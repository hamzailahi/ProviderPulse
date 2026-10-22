'use strict';
// lib/procedures.js: the market assistant's get_procedures tool (2026-10-20).
//
// Until this existed the assistant told users "ProviderPulse data does not
// include procedure billing volumes or reimbursement rates" while the
// dashboard's Procedures panel showed four sources of exactly that. This reads
// the same public, aggregate tables the panel reads (cms_procedures_full,
// medicaid_procedures + procedure_codes, medicare_hospitals +
// medicare_hospital_procedures) through the publishable key and returns a
// pre-summarized answer: the top codes with patients, services and average
// allowed and paid amounts, plus the notes that decide how to read them.
//
// Every figure it returns is published by CMS or HHS; nothing here touches
// patient, account or search data. A failed request is reported as
// incomplete, never read as "no procedures" (see CLAUDE.md, "A failed query is
// not an empty answer"). Words go through procedure-search.js, so
// "colonoscopy" reaches CMS's "large bowel using an endoscope".

const ProcedureSearch = require('../../../assets/procedure-search.js');
const CodeList = require('../../../assets/code-list.js');

const SOURCES = ['medicare_clinicians', 'medicaid', 'hospital_outpatient', 'hospital_inpatient'];
const GEO_MEASURE = 'DENTAL';          // the PLACES rows that carry ZCTA centroids
const MAX_ZIPS = 30;
const MAX_PAGES = 8;                   // 1,000-row pages per request group
const BUDGET_MS = 14000;               // stop starting requests after this
const TOP = 20;
const MAX_ZIPS_CODE_LIST = 120;         // a code list asks for few rows per ZIP

const NOTES = {
  medicare_clinicians: [
    'CMS Medicare Physician & Other Practitioners by Provider and Service, 2024: traditional (fee-for-service) Medicare only, which covers people 65 and older and some younger people with disabilities; Medicare Advantage, Medicaid and commercial claims are not in it.',
    'CMS leaves out any code a clinician billed for fewer than 11 Medicare patients in the year, so small volumes and pregnancy or children\'s care barely appear.',
    'Each row sits at the address the clinician bills Medicare from, often a group\'s main office. Patient counts are summed across clinicians, so one patient seen by two clinicians counts twice.',
    'Average allowed is what Medicare approves per service (its payment plus the patient\'s share); average paid is Medicare\'s own payment. Both are weighted by services here.',
    'avg_medicare_paid blends every biller of a code: the clinician\'s professional fee and the organization\'s payment. clinician_fee is the clinicians\' own average; quote it for what a physician is paid. facility_fee is what organizations were paid, and billed_by names them: for scopes that is mostly the surgery center\'s facility fee, but for pathology it is labs and for imaging it is imaging centers or groups, so label it by billed_by, never as a surgery center fee by default.',
    'These are averages of what was actually paid per service, below the fee schedule\'s full rate: Medicare pays 80% of the allowed amount (less 2% sequestration), and a second endoscopy in the same session is paid less (the multiple endoscopy rule), so codes usually done second, such as 45380, 43239 and 45381, run well under their scheduled rate.'
  ],
  medicaid: [
    'HHS Medicaid Provider Spending by HCPCS (T-MSIS), 2024: Medicaid and CHIP, fee-for-service and managed care, placed at each provider\'s listed ZIP.',
    'HHS withholds any provider, code and month with fewer than 12 patients, so these are floors; most obstetricians deliver fewer than 12 Medicaid babies a month.',
    'Patient-months add each month\'s patients, so one patient seen in three months counts three times; it is not a head count. Paid per claim is total paid divided by claim lines.',
    'A claim line can carry several units of a service, so paid per claim line is not a price per service and is not comparable with Medicare\'s average per service. Where it is far above Medicare\'s local average for the same code, per_claim_check says so: do not quote that figure as a payment rate.',
    'States bill differently: Texas bills deliveries as 59409, 59514 and 59430 rather than the global 59400.'
  ],
  hospital: [
    'CMS Medicare Inpatient and Outpatient Hospitals by Provider and Service, 2024: traditional Medicare only, the nearest hospitals to the ZIP. Each hospital is listed at the address it bills Medicare under, often a system\'s main campus.',
    'Codes are payment groups (APC for outpatient, DRG for inpatient), not CPT or HCPCS codes. CMS withholds counts under 11.'
  ]
};

const milesBetween = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8, r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};
const r2 = v => (v == null || !isFinite(v) ? null : Math.round(v * 100) / 100);
const int = v => Math.round(Number(v) || 0);
// PostgREST pattern text: reserved characters become wildcards, which match them.
const pat = s => encodeURIComponent('*' + String(s).replace(/[,()"*\\:]/g, '*') + '*');

async function getProcedures(input, opts) {
  const o = opts || {};
  const doFetch = o.fetch || fetch, env = o.env || process.env;
  const started = Date.now();
  const zip = input && input.zip, source = input && input.source;
  if (typeof zip !== 'string' || !/^\d{5}$/.test(zip)) return { error: 'zip must be 5 digits' };
  if (!SOURCES.includes(source)) return { error: 'source must be one of ' + SOURCES.join(', ') };
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return { error: 'Database is not configured' };
  const hospital = source.startsWith('hospital_');
  const specialty = typeof input.specialty === 'string' && input.specialty.trim() ? input.specialty.trim().slice(0, 80) : null;
  // Words are cut at 80 characters; a code list keeps up to 100 codes. Until
  // 2026-10-22 every query was cut at 80, which held about 13 codes, so a
  // 46-code list arrived chopped mid-code, read as words, and the model split
  // it into chunks.
  const rawQuery = typeof input.query === 'string' ? input.query.trim().slice(0, 1200) : '';
  const query = rawQuery ? (CodeList.parse(rawQuery).isList ? rawQuery : rawQuery.slice(0, 80)) : null;
  const askedRadius = Math.max(0, Math.min(hospital ? 50 : 15, int(input.radius_miles)));
  // opts.zips: an explicit area (the ZIPs on the user's map), used instead of
  // a radius by get_area_profile and by get_procedures' use_map_area.
  const given = !hospital && Array.isArray(o.zips) ? [...new Set([zip].concat(o.zips.filter(z => typeof z === 'string' && /^\d{5}$/.test(z))))] : null;
  const budgetMs = Number(o.budgetMs) > 0 ? Math.min(BUDGET_MS, Number(o.budgetMs)) : BUDGET_MS;

  const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, Accept: 'application/json' };
  let failed = 0, capped = false, outOfTime = false;
  const get = async (path, ms) => {
    if (Date.now() - started > budgetMs) { outOfTime = true; return null; }
    try {
      const r = await doFetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: H, signal: AbortSignal.timeout(ms || 7000) });
      if (!r.ok) { failed++; return null; }
      const b = await r.json();
      if (!Array.isArray(b)) { failed++; return null; }
      return b;
    } catch (e) { failed++; return null; }
  };
  // Offset pages under a fixed order; stops at MAX_PAGES and says so.
  const paged = async (path) => {
    const out = [];
    for (let p = 0; p < MAX_PAGES; p++) {
      const rows = await get(`${path}&limit=1000&offset=${p * 1000}`);
      if (!rows) return { rows: out, ok: false };
      out.push(...rows);
      if (rows.length < 1000) return { rows: out, ok: true };
    }
    capped = true;
    return { rows: out, ok: true };
  };
  const inGroups = async (items, size, parallel, fn) => {
    const groups = [];
    for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
    const out = [];
    for (let i = 0; i < groups.length; i += parallel) out.push(...await Promise.all(groups.slice(i, i + parallel).map(fn)));
    return out;
  };

  // ---- the area: this ZIP, or every ZIP whose centre is within the radius
  const home = given ? null : await get(`cdc_places?zip=eq.${zip}&measureid=eq.${GEO_MEASURE}&select=zip,lat,lon&limit=1`, 5000);
  const centre = home && home[0] && home[0].lat != null ? { lat: +home[0].lat, lon: +home[0].lon } : null;
  if (hospital && !centre) return { zip, source, error: home ? 'No location data for this ZIP, so nearby hospitals cannot be found' : 'The location lookup did not answer. Try again.' };
  let zips = given || [zip];
  const radius = given ? null : hospital ? (askedRadius || 25) : askedRadius;
  // A list of codes in `query` (2026-10-22): every code is reported, codes
  // with no rows are named, and the map can be wider since few rows return.
  const parsed = query ? CodeList.parse(query) : null;
  const list = parsed && parsed.isList ? parsed.codes : null;
  if (list && hospital) return { zip, source, error: 'Hospitals report payment groups (APC outpatient, DRG inpatient), not CPT codes, so a code list cannot filter them. Search this source with words instead, for example "colonoscopy" or "endoscopy".' };
  const zipCap = list ? MAX_ZIPS_CODE_LIST : MAX_ZIPS;
  if (given && zips.length > zipCap) { zips = zips.slice(0, zipCap); capped = true; }
  if (!given && !hospital && radius > 0 && centre) {
    const dLat = radius / 69, dLon = radius / Math.max(1, 69 * Math.cos(centre.lat * Math.PI / 180));
    const box = await get(`cdc_places?measureid=eq.${GEO_MEASURE}&lat=gte.${(centre.lat - dLat).toFixed(4)}&lat=lte.${(centre.lat + dLat).toFixed(4)}` +
      `&lon=gte.${(centre.lon - dLon).toFixed(4)}&lon=lte.${(centre.lon + dLon).toFixed(4)}&select=zip,lat,lon&limit=1000`, 6000);
    const near = (box || []).map(r => ({ zip: r.zip, mi: milesBetween(centre.lat, centre.lon, +r.lat, +r.lon) }))
      .filter(r => r.mi <= radius).sort((a, b) => a.mi - b.mi).map(r => r.zip);
    zips = [...new Set([zip].concat(near))];
    if (zips.length > MAX_ZIPS) { zips = zips.slice(0, MAX_ZIPS); capped = true; }
  }

  // ---- what to look for
  const codeLike = !list && query && /^[A-Za-z0-9]{5}$/.test(query) && /\d/.test(query) ? query.toUpperCase() : null;
  const needles = query && !codeLike && !list ? ProcedureSearch.needles(query).slice(0, 8) : [];
  const listIn = list ? list.map(encodeURIComponent).join(',') : '';
  // Codes asked for that came back with no rows: withheld (under 11 or 12
  // patients) or not billed here; unknown when a request failed.
  const without = present => (list ? list.filter(c => !present.has(c)) : undefined);
  const descFilter = col => needles.length ? `&or=(${needles.map(n => `${col}.ilike.${pat(n)}`).join(',')})` : '';
  const specFilter = specialty && !hospital ? `&specialty=ilike.${pat(specialty)}` : '';

  const base = {
    source, data_year: 2024,
    area: given ? { zip, map_area: true, zips_searched: zips.length, zips: zips } : { zip, radius_miles: radius, zips_searched: zips.length },
    filters: { specialty: hospital ? null : specialty, query, matched_terms: list ? list : needles.length ? needles : (codeLike ? [codeLike] : []) }
  };
  const finish = (out, notes) => {
    const incomplete = failed > 0 || capped || outOfTime;
    // A code list echoes what was asked and what came back (2026-10-22): a
    // report split 46 codes into several calls, then said codes it had asked
    // for were left out or never requested. The echo is the check.
    if (list) {
      const withRows = (out.top_codes || []).map(c => String(c.code).toUpperCase());
      out.code_list = { requested_count: list.length, requested_codes: list, with_rows_count: withRows.length, codes_with_rows: withRows,
        codes_without_rows: out.codes_without_rows, codes_beyond_limit: parsed.ignored || 0,
        rule: 'This one call covered every code in requested_codes. Do not call a code missing, left out or not requested unless it is absent from requested_codes or listed in codes_without_rows.' };
    }
    return Object.assign(base, out, {
      incomplete,
      incomplete_reason: incomplete ? [failed ? failed + ' request(s) failed or timed out' : null, capped ? 'some results were capped' : null,
        outOfTime ? 'the time budget ran out' : null].filter(Boolean).join('; ') + '. Totals are floors.' : null,
      notes
    });
  };

  // ---- Medicare clinicians (Part B)
  if (source === 'medicare_clinicians') {
    const sel = 'zip,npi,entity_code,specialty,hcpcs_cd,hcpcs_desc,tot_benes,tot_srvcs,avg_mdcr_alowd_amt,avg_mdcr_pymt_amt';
    const codeF = list ? `&hcpcs_cd=in.(${listIn})` : codeLike ? `&hcpcs_cd=eq.${encodeURIComponent(codeLike)}` : descFilter('hcpcs_desc');
    const parts = await inGroups(zips, 10, 3, list => paged(`cms_procedures_full?zip=in.(${list.join(',')})${specFilter}${codeF}&select=${sel}&order=specialty,tot_benes.desc,npi,hcpcs_cd,place_of_service`));
    const rows = parts.flatMap(p => p.rows);
    if (!rows.length && failed) return { zip, source, error: 'The Medicare procedure table did not answer in time. Try a smaller radius or a specialty.' };
    const by = {}, specs = {}, npis = new Set(), zs = {};
    for (const r of rows) {
      const z = zs[r.zip] || (zs[r.zip] = { zip: r.zip, npis: new Set(), patients: 0, services: 0, paid: 0 });
      z.npis.add(r.npi); z.patients += Number(r.tot_benes) || 0; z.services += Number(r.tot_srvcs) || 0;
      z.paid += (Number(r.avg_mdcr_pymt_amt) || 0) * (Number(r.tot_srvcs) || 0);
      const c = by[r.hcpcs_cd] || (by[r.hcpcs_cd] = { code: r.hcpcs_cd, description: r.hcpcs_desc, patients: 0, services: 0, allowed: 0, paid: 0, npis: new Set(), ind: [0, 0], org: [0, 0], orgBy: {} });
      const s = Number(r.tot_srvcs) || 0;
      c.patients += Number(r.tot_benes) || 0; c.services += s;
      c.allowed += (Number(r.avg_mdcr_alowd_amt) || 0) * s; c.paid += (Number(r.avg_mdcr_pymt_amt) || 0) * s;
      const side = r.entity_code === 'O' ? c.org : c.ind;   // facility fee vs the clinician's own fee
      side[0] += s; side[1] += (Number(r.avg_mdcr_pymt_amt) || 0) * s;
      if (r.entity_code === 'O' && r.specialty) c.orgBy[r.specialty] = (c.orgBy[r.specialty] || 0) + s;
      c.npis.add(r.npi); npis.add(r.npi);
      const sp = specs[r.specialty] || (specs[r.specialty] = { specialty: r.specialty, patients: 0, npis: new Set() });
      sp.patients += Number(r.tot_benes) || 0; sp.npis.add(r.npi);
    }
    const codes = Object.values(by).sort((a, b) => b.patients - a.patients);
    return finish({
      totals: { rows: rows.length, codes: codes.length, clinicians: npis.size, patients_summed: int(codes.reduce((a, c) => a + c.patients, 0)), services: int(codes.reduce((a, c) => a + c.services, 0)),
        medicare_paid: int(codes.reduce((a, c) => a + c.paid, 0)) },
      codes_without_rows: list ? (failed || capped || outOfTime ? 'unknown: some requests did not complete' : without(new Set(codes.map(c => c.code)))) : undefined,
      top_codes: (list ? codes : codes.slice(0, TOP)).map(c => ({ code: c.code, description: c.description, clinicians: c.npis.size, patients: int(c.patients), services: int(c.services),
        avg_allowed: c.services ? r2(c.allowed / c.services) : null, avg_medicare_paid: c.services ? r2(c.paid / c.services) : null,
        services_per_patient: c.patients ? r2(c.services / c.patients) : null,
        clinician_fee: { services: int(c.ind[0]), avg_medicare_paid: c.ind[0] ? r2(c.ind[1] / c.ind[0]) : null, medicare_paid: int(c.ind[1]) },
        // Who the organizations are: surgery centers for scopes, but labs for
        // pathology and imaging centers for ultrasound (a report called a lab's
        // 88305 payment a surgery center's "facility fee", 2026-10-22).
        facility_fee: { services: int(c.org[0]), avg_medicare_paid: c.org[0] ? r2(c.org[1] / c.org[0]) : null, medicare_paid: int(c.org[1]),
          billed_by: Object.keys(c.orgBy).sort((a, b) => c.orgBy[b] - c.orgBy[a]).slice(0, 3) } })),
      by_specialty: specialty ? undefined : Object.values(specs).sort((a, b) => b.patients - a.patients).slice(0, 8)
        .map(s => ({ specialty: s.specialty, clinicians: s.npis.size, patients_summed: int(s.patients) })),
      by_zip: zips.length > 1 ? zips.map(z => zs[z] ? { zip: z, clinicians: zs[z].npis.size, patients_summed: int(zs[z].patients), services: int(zs[z].services), medicare_paid: int(zs[z].paid) }
        : failed || capped ? { zip: z, unknown: true } : { zip: z, clinicians: 0, patients_summed: 0, services: 0, medicare_paid: 0 }) : undefined
    }, NOTES.medicare_clinicians);
  }

  // ---- Medicaid
  if (source === 'medicaid') {
    let codeF = '';
    if (list) codeF = `&code=in.(${listIn})`;
    else if (codeLike) codeF = `&code=eq.${encodeURIComponent(codeLike)}`;
    else if (needles.length) {
      const hits = await get(`procedure_codes?select=code${descFilter('description')}&limit=500`, 6000);
      if (!hits) return { zip, source, error: 'The code description lookup did not answer. Try again.' };
      if (!hits.length) return finish({ totals: { rows: 0, codes: 0 }, top_codes: [] }, NOTES.medicaid.concat(['No code description matches "' + query + '". Try a CPT or HCPCS code.']));
      codeF = `&code=in.(${hits.map(h => encodeURIComponent(h.code)).join(',')})`;
    }
    const parts = await inGroups(zips, 50, 3, list => paged(`medicaid_procedures?zip=in.(${list.join(',')})${specFilter}${codeF}&select=zip,specialty,code,claims,patient_months,paid,providers&order=zip,specialty,code`));
    const rows = parts.flatMap(p => p.rows);
    if (!rows.length && failed) return { zip, source, error: 'The Medicaid procedure table did not answer in time. Try a smaller radius or a specialty.' };
    const by = {}, specs = {}, zs = {};
    for (const r of rows) {
      const z = zs[r.zip] || (zs[r.zip] = { zip: r.zip, claims: 0, paid: 0 });
      z.claims += Number(r.claims) || 0; z.paid += Number(r.paid) || 0;
      const c = by[r.code] || (by[r.code] = { code: r.code, claims: 0, patient_months: 0, paid: 0, providers: 0 });
      c.claims += Number(r.claims) || 0; c.patient_months += Number(r.patient_months) || 0; c.paid += Number(r.paid) || 0; c.providers += Number(r.providers) || 0;
      const sp = specs[r.specialty] || (specs[r.specialty] = { specialty: r.specialty, claims: 0, paid: 0 });
      sp.claims += Number(r.claims) || 0; sp.paid += Number(r.paid) || 0;
    }
    const codes = Object.values(by).sort((a, b) => b.claims - a.claims);
    const top = list ? codes : codes.slice(0, TOP);
    const desc = {};
    if (top.length) (await get(`procedure_codes?code=in.(${top.map(c => encodeURIComponent(c.code)).join(',')})&select=code,description`, 5000) || []).forEach(d => { desc[d.code] = d.description; });
    // Medicare's local average paid per service for the same codes, from a
    // sample of the area (2026-10-22: ECG 93000 showed $205.76 per Medicaid
    // claim line against about $10 from Medicare). A side check: a failure
    // here leaves the check out, it does not make the Medicaid figures incomplete.
    const mcr = {};
    if (top.length && Date.now() - started < budgetMs - 3000) {
      const inCodes = top.map(c => encodeURIComponent(c.code)).join(',');
      const groups = [];
      for (let i = 0; i < Math.min(zips.length, 30); i += 10) groups.push(zips.slice(i, i + 10));
      const pages = await Promise.all(groups.map(async g => {
        try {
          const r = await doFetch(`${env.SUPABASE_URL}/rest/v1/cms_procedures_full?zip=in.(${g.join(',')})&hcpcs_cd=in.(${inCodes})&select=hcpcs_cd,tot_srvcs,avg_mdcr_pymt_amt&limit=1000`, { headers: H, signal: AbortSignal.timeout(5000) });
          const b = r.ok ? await r.json() : null;
          return Array.isArray(b) ? b : [];
        } catch (e) { return []; }
      }));
      pages.flat().forEach(r => {
        const k = String(r.hcpcs_cd).toUpperCase(), sv = Number(r.tot_srvcs) || 0;
        const m = mcr[k] || (mcr[k] = { s: 0, p: 0 });
        m.s += sv; m.p += sv * (Number(r.avg_mdcr_pymt_amt) || 0);
      });
    }
    const check = c => {
      const m = mcr[String(c.code).toUpperCase()];
      if (!c.claims || !m || !m.s) return undefined;
      const per = c.paid / c.claims, avg = m.p / m.s;
      return per > 3 * avg ? `Unreliable as a rate: $${r2(per)} per claim line is ${Math.round(per / avg)} times Medicare's local average of $${r2(avg)} per service, so these claim lines likely carry several units or bundled services.` : undefined;
    };
    return finish({
      totals: { rows: rows.length, codes: codes.length, claim_lines: int(codes.reduce((a, c) => a + c.claims, 0)), paid: int(codes.reduce((a, c) => a + c.paid, 0)) },
      codes_without_rows: list ? (failed || capped || outOfTime ? 'unknown: some requests did not complete' : without(new Set(codes.map(c => String(c.code).toUpperCase())))) : undefined,
      top_codes: top.map(c => ({ code: c.code, description: desc[c.code] || null, claim_lines: int(c.claims), patient_months: int(c.patient_months),
        total_paid: int(c.paid), paid_per_claim: c.claims ? r2(c.paid / c.claims) : null, per_claim_check: check(c), provider_count_summed: int(c.providers) })),
      by_specialty: specialty ? undefined : Object.values(specs).sort((a, b) => b.claims - a.claims).slice(0, 8)
        .map(s => ({ specialty: s.specialty, claim_lines: int(s.claims), total_paid: int(s.paid) })),
      by_zip: zips.length > 1 ? zips.map(z => (zs[z] || !(failed || capped) ? { zip: z, claim_lines: int(zs[z] ? zs[z].claims : 0), total_paid: int(zs[z] ? zs[z].paid : 0) } : { zip: z, unknown: true })) : undefined
    }, NOTES.medicaid);
  }

  // ---- Medicare hospitals (outpatient APC, inpatient DRG)
  const setting = source === 'hospital_outpatient' ? 'outpatient' : 'inpatient';
  const dLat = radius / 69, dLon = radius / Math.max(1, 69 * Math.cos(centre.lat * Math.PI / 180));
  const hs = await get(`medicare_hospitals?lat=gte.${(centre.lat - dLat).toFixed(4)}&lat=lte.${(centre.lat + dLat).toFixed(4)}` +
    `&lon=gte.${(centre.lon - dLon).toFixed(4)}&lon=lte.${(centre.lon + dLon).toFixed(4)}&select=ccn,hospital,zip,lat,lon&limit=1000`, 6000);
  if (!hs) return { zip, source, error: 'The hospital lookup did not answer. Try again.' };
  const near = hs.map(h => Object.assign({}, h, { miles: milesBetween(centre.lat, centre.lon, +h.lat, +h.lon) }))
    .filter(h => h.miles <= radius).sort((a, b) => a.miles - b.miles).slice(0, 15);
  if (!near.length) return finish({ hospitals: [], totals: { rows: 0, codes: 0 }, top_codes: [] }, NOTES.hospital.concat(['No hospital within ' + radius + ' miles bills Medicare from its own address.']));
  const codeF = codeLike ? `&code=eq.${encodeURIComponent(codeLike)}` : descFilter('description');
  const got = await paged(`medicare_hospital_procedures?ccn=in.(${near.map(h => encodeURIComponent(h.ccn)).join(',')})&setting=eq.${setting}${codeF}&select=ccn,code,description,patients,services,avg_allowed,avg_paid&order=ccn,code`);
  if (!got.rows.length && failed) return { zip, source, error: 'The hospital procedure table did not answer in time. Try again.' };
  const byCcn = {}, by = {};
  for (const r of got.rows) {
    byCcn[r.ccn] = (byCcn[r.ccn] || 0) + (Number(r.patients) || 0);
    const c = by[r.code] || (by[r.code] = { code: r.code, description: r.description, patients: 0, paid: 0, allowed: 0, hospitals: new Set() });
    const p = Number(r.patients) || 0;
    c.patients += p; c.paid += (Number(r.avg_paid) || 0) * p; c.allowed += (Number(r.avg_allowed) || 0) * p; c.hospitals.add(r.ccn);
  }
  const codes = Object.values(by).sort((a, b) => b.patients - a.patients);
  return finish({
    area: { zip, radius_miles: radius, hospitals_searched: near.length },
    hospitals: near.slice(0, 10).map(h => ({ hospital: h.hospital, miles: r2(h.miles), [setting === 'inpatient' ? 'discharges' : 'patients']: int(byCcn[h.ccn]) })),
    totals: { rows: got.rows.length, codes: codes.length, [setting === 'inpatient' ? 'discharges' : 'patients']: int(codes.reduce((a, c) => a + c.patients, 0)) },
    top_codes: codes.slice(0, TOP).map(c => ({ code: c.code, description: c.description, hospitals: c.hospitals.size,
      [setting === 'inpatient' ? 'discharges' : 'patients']: int(c.patients),
      [setting === 'inpatient' ? 'avg_total_payment' : 'avg_allowed']: c.patients ? r2(c.allowed / c.patients) : null,
      avg_medicare_paid: c.patients ? r2(c.paid / c.patients) : null }))
  }, NOTES.hospital.concat(specialty ? ['The specialty filter does not apply to hospital data.'] : []));
}

module.exports = { getProcedures, SOURCES, NOTES };
