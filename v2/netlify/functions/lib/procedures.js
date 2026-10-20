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

const SOURCES = ['medicare_clinicians', 'medicaid', 'hospital_outpatient', 'hospital_inpatient'];
const GEO_MEASURE = 'DENTAL';          // the PLACES rows that carry ZCTA centroids
const MAX_ZIPS = 30;
const MAX_PAGES = 8;                   // 1,000-row pages per request group
const BUDGET_MS = 14000;               // stop starting requests after this
const TOP = 20;

const NOTES = {
  medicare_clinicians: [
    'CMS Medicare Physician & Other Practitioners by Provider and Service, 2024: traditional (fee-for-service) Medicare only, which covers people 65 and older and some younger people with disabilities; Medicare Advantage, Medicaid and commercial claims are not in it.',
    'CMS leaves out any code a clinician billed for fewer than 11 Medicare patients in the year, so small volumes and pregnancy or children\'s care barely appear.',
    'Each row sits at the address the clinician bills Medicare from, often a group\'s main office. Patient counts are summed across clinicians, so one patient seen by two clinicians counts twice.',
    'Average allowed is what Medicare approves per service (its payment plus the patient\'s share); average paid is Medicare\'s own payment. Both are weighted by services here.'
  ],
  medicaid: [
    'HHS Medicaid Provider Spending by HCPCS (T-MSIS), 2024: Medicaid and CHIP, fee-for-service and managed care, placed at each provider\'s listed ZIP.',
    'HHS withholds any provider, code and month with fewer than 12 patients, so these are floors; most obstetricians deliver fewer than 12 Medicaid babies a month.',
    'Patient-months add each month\'s patients, so one patient seen in three months counts three times; it is not a head count. Paid per claim is total paid divided by claim lines.',
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
  const query = typeof input.query === 'string' && input.query.trim() ? input.query.trim().slice(0, 80) : null;
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
  if (given && zips.length > MAX_ZIPS) { zips = zips.slice(0, MAX_ZIPS); capped = true; }
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
  const codeLike = query && /^[A-Za-z0-9]{5}$/.test(query) && /\d/.test(query) ? query.toUpperCase() : null;
  const needles = query && !codeLike ? ProcedureSearch.needles(query).slice(0, 8) : [];
  const descFilter = col => needles.length ? `&or=(${needles.map(n => `${col}.ilike.${pat(n)}`).join(',')})` : '';
  const specFilter = specialty && !hospital ? `&specialty=ilike.${pat(specialty)}` : '';

  const base = {
    source, data_year: 2024,
    area: given ? { zip, map_area: true, zips_searched: zips.length, zips: zips } : { zip, radius_miles: radius, zips_searched: zips.length },
    filters: { specialty: hospital ? null : specialty, query, matched_terms: needles.length ? needles : (codeLike ? [codeLike] : []) }
  };
  const finish = (out, notes) => {
    const incomplete = failed > 0 || capped || outOfTime;
    return Object.assign(base, out, {
      incomplete,
      incomplete_reason: incomplete ? [failed ? failed + ' request(s) failed or timed out' : null, capped ? 'some results were capped' : null,
        outOfTime ? 'the time budget ran out' : null].filter(Boolean).join('; ') + '. Totals are floors.' : null,
      notes
    });
  };

  // ---- Medicare clinicians (Part B)
  if (source === 'medicare_clinicians') {
    const sel = 'zip,npi,specialty,hcpcs_cd,hcpcs_desc,tot_benes,tot_srvcs,avg_mdcr_alowd_amt,avg_mdcr_pymt_amt';
    const codeF = codeLike ? `&hcpcs_cd=eq.${encodeURIComponent(codeLike)}` : descFilter('hcpcs_desc');
    const parts = await inGroups(zips, 10, 3, list => paged(`cms_procedures_full?zip=in.(${list.join(',')})${specFilter}${codeF}&select=${sel}&order=specialty,tot_benes.desc,npi,hcpcs_cd,place_of_service`));
    const rows = parts.flatMap(p => p.rows);
    if (!rows.length && failed) return { zip, source, error: 'The Medicare procedure table did not answer in time. Try a smaller radius or a specialty.' };
    const by = {}, specs = {}, npis = new Set(), zs = {};
    for (const r of rows) {
      const z = zs[r.zip] || (zs[r.zip] = { zip: r.zip, npis: new Set(), patients: 0, services: 0, paid: 0 });
      z.npis.add(r.npi); z.patients += Number(r.tot_benes) || 0; z.services += Number(r.tot_srvcs) || 0;
      z.paid += (Number(r.avg_mdcr_pymt_amt) || 0) * (Number(r.tot_srvcs) || 0);
      const c = by[r.hcpcs_cd] || (by[r.hcpcs_cd] = { code: r.hcpcs_cd, description: r.hcpcs_desc, patients: 0, services: 0, allowed: 0, paid: 0, npis: new Set() });
      const s = Number(r.tot_srvcs) || 0;
      c.patients += Number(r.tot_benes) || 0; c.services += s;
      c.allowed += (Number(r.avg_mdcr_alowd_amt) || 0) * s; c.paid += (Number(r.avg_mdcr_pymt_amt) || 0) * s;
      c.npis.add(r.npi); npis.add(r.npi);
      const sp = specs[r.specialty] || (specs[r.specialty] = { specialty: r.specialty, patients: 0, npis: new Set() });
      sp.patients += Number(r.tot_benes) || 0; sp.npis.add(r.npi);
    }
    const codes = Object.values(by).sort((a, b) => b.patients - a.patients);
    return finish({
      totals: { rows: rows.length, codes: codes.length, clinicians: npis.size, patients_summed: int(codes.reduce((a, c) => a + c.patients, 0)), services: int(codes.reduce((a, c) => a + c.services, 0)),
        medicare_paid: int(codes.reduce((a, c) => a + c.paid, 0)) },
      top_codes: codes.slice(0, TOP).map(c => ({ code: c.code, description: c.description, clinicians: c.npis.size, patients: int(c.patients), services: int(c.services),
        avg_allowed: c.services ? r2(c.allowed / c.services) : null, avg_medicare_paid: c.services ? r2(c.paid / c.services) : null,
        services_per_patient: c.patients ? r2(c.services / c.patients) : null })),
      by_specialty: specialty ? undefined : Object.values(specs).sort((a, b) => b.patients - a.patients).slice(0, 8)
        .map(s => ({ specialty: s.specialty, clinicians: s.npis.size, patients_summed: int(s.patients) })),
      by_zip: zips.length > 1 ? zips.map(z => zs[z] ? { zip: z, clinicians: zs[z].npis.size, patients_summed: int(zs[z].patients), services: int(zs[z].services), medicare_paid: int(zs[z].paid) }
        : failed || capped ? { zip: z, unknown: true } : { zip: z, clinicians: 0, patients_summed: 0, services: 0, medicare_paid: 0 }) : undefined
    }, NOTES.medicare_clinicians);
  }

  // ---- Medicaid
  if (source === 'medicaid') {
    let codeF = '';
    if (codeLike) codeF = `&code=eq.${encodeURIComponent(codeLike)}`;
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
    const top = codes.slice(0, TOP);
    const desc = {};
    if (top.length) (await get(`procedure_codes?code=in.(${top.map(c => encodeURIComponent(c.code)).join(',')})&select=code,description`, 5000) || []).forEach(d => { desc[d.code] = d.description; });
    return finish({
      totals: { rows: rows.length, codes: codes.length, claim_lines: int(codes.reduce((a, c) => a + c.claims, 0)), paid: int(codes.reduce((a, c) => a + c.paid, 0)) },
      top_codes: top.map(c => ({ code: c.code, description: desc[c.code] || null, claim_lines: int(c.claims), patient_months: int(c.patient_months),
        total_paid: int(c.paid), paid_per_claim: c.claims ? r2(c.paid / c.claims) : null, provider_count_summed: int(c.providers) })),
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
