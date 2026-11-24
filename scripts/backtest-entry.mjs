// Back-test (2026-11-19, the user's choice): does the "patients need care
// here" score, built as of the end of 2020, point to where clinicians entered
// in 2021 to 2025? HPSA designation gets the same test as a comparison.
//
// Inputs (CSV, header row): --counts zip,code,entity,before,entered (scripts/backtest-nppes.mjs)
//   --zips zip,lat,lon,adults   --places zip,measureid,value   --bench kind,key,data(json)
//   --hpsa state_name,county,discipline,score   --zipcounty zip,county,state_name
// Output: --report markdown, --csv per ZIP x specialty.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spearman, milesBetween } from './lib/e2sfca.mjs';
const require = createRequire(import.meta.url);
const MarketModel = require('../v2/assets/market-model.js');
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');
const { SCORED } = require('../v2/assets/specialties.js');

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
// Minimal CSV reader that honours quotes (benchmark JSON and labels hold commas).
export function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; } else f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows.slice(1).filter(r => r.length > 1);
}
const read = k => parseCsv(readFileSync(arg(k), 'utf8'));
const countyKey = s => String(s || '').toLowerCase()
  .replace(/\b(city and borough|census area|municipality|borough|parish|county|city)\b/g, ' ')
  .replace(/\bst\.?\s/g, 'saint ').replace(/[^a-z]/g, '');

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',PR:'Puerto Rico',RI:'Rhode Island',
  SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};
export const MIN_ADULTS = 1000;

// Payer yield (2026-11-20, dry run): what an average resident's coverage pays
// a practice, relative to Medicare. Each coverage type the Census counts is
// weighted by a published payment level: commercial (employer, direct
// purchase, TRICARE) 1.43x Medicare (physician services, MedPAC / KFF
// review), Medicaid 0.72x (Urban Institute Medicaid-to-Medicare fee index,
// national), Medicare 1.0, uninsured 0. Coverage types overlap, so the
// weights are averaged over coverage counts and scaled by the insured share.
export const YIELD = MarketModel.YIELD;
export const payerYield = MarketModel.payerYield;

export function run(input, opts = {}) {
  const { counts, zips, places, bench, hpsa, zipcounty } = input;
  const supplyAll = opts.supply === 'all';   // 'before' (2020, the default) or 'all' (today)
  // Ability to pay, like the live model: insured rate (70%) and median income
  // (30%) as percentiles within the ZIP's state (ACS).
  const payOf = new Map();
  const acs = input.acs || [];
  const byState = new Map();
  for (const a of acs) { if (!a.state) continue; (byState.get(a.state) || byState.set(a.state, []).get(a.state)).push(a); }
  for (const a of acs) a.yield = payerYield(a);
  for (const [, rs] of byState) {
    const ins = rs.map(a => a.insured).filter(v => v != null), inc = rs.map(a => a.income).filter(v => v != null);
    const yl = rs.map(a => a.yield).filter(v => v != null);
    if (ins.length < 30) continue;
    for (const a of rs) {
      const ip = a.insured == null ? null : MarketModel.rankIn(ins, a.insured), cp = a.income == null || inc.length < 30 ? null : MarketModel.rankIn(inc, a.income);
      const yp = a.yield == null || yl.length < 30 ? null : MarketModel.rankIn(yl, a.yield);
      if (ip != null) payOf.set(a.zip, { insuredPct: ip, incomePct: cp, yieldPct: yp });
    }
  }
  const Z = zips.filter(z => Number.isFinite(z.lat) && Number.isFinite(z.lon));
  const zipIdx = new Map(Z.map(z => [z.zip, z]));
  // Supply as of the cutoff (both tables, like the live model) and clinician entrants after it.
  const before = new Map(), entered = new Map();   // zip -> Map code -> n
  for (const r of counts) {
    const sup = supplyAll ? r.before + r.entered : r.before;
    if (sup) { const m = before.get(r.zip) || new Map(); m.set(r.code, (m.get(r.code) || 0) + sup); before.set(r.zip, m); }
    if (r.entered && r.entity === '1') { const m = entered.get(r.zip) || new Map(); m.set(r.code, (m.get(r.code) || 0) + r.entered); entered.set(r.zip, m); }
  }
  const P = new Map();
  for (const r of places) { const m = P.get(r.zip) || {}; m[r.measureid] = r.value; P.set(r.zip, m); }
  const benchmarks = { measures: {}, specialties: {} };
  for (const r of bench) { if (r.kind === 'measure') benchmarks.measures[r.key] = r.data; if (r.kind === 'specialty') benchmarks.specialties[r.key] = r.data; }
  // Stored drive-time access (access_e2sfca, site-weighted), the figure the live
  // score reads: used for today's supply only, against the weighted national
  // rate so local and national stay like for like (2026-11-24).
  const E2 = supplyAll && opts.e2sfca ? opts.e2sfca : null;
  if (E2) for (const k in benchmarks.specialties) { const d = benchmarks.specialties[k]; if (d && d.rate_per_1k_weighted) benchmarks.specialties[k] = { ...d, rate_per_1k: d.rate_per_1k_weighted }; }
  const hp = new Map();   // state|countyKey -> {primary, dental, mental}
  for (const h of hpsa) {
    const k = h.state + '|' + countyKey(h.county), d = /mental/i.test(h.discipline) ? 'mental' : /dental/i.test(h.discipline) ? 'dental' : /primary/i.test(h.discipline) ? 'primary' : null;
    if (!d) continue;
    const o = hp.get(k) || {}; o[d] = Math.max(o[d] || 0, h.score || 0); hp.set(k, o);
  }
  const hpCounties = new Set([...hp.keys()]);
  const fipsOf = new Map(zipcounty.map(r => [r.zip, r.fips]));
  const zc = new Map(zipcounty.map(r => [r.zip, (STATE_NAMES[String(r.state).toUpperCase()] || r.state) + '|' + countyKey(r.county)]));

  // Grid of ZIP centres, half a degree square, for the catchment search.
  const grid = new Map(), g = v => Math.floor(v * 2);
  for (const z of Z) { const k = g(z.lat) + ',' + g(z.lon); (grid.get(k) || grid.set(k, []).get(k)).push(z); }
  const nearby = z => { const out = []; for (let a = -1; a <= 1; a++) for (let b = -2; b <= 2; b++) for (const y of grid.get((g(z.lat) + a) + ',' + (g(z.lon) + b)) || []) out.push(y); return out; };

  const codeSpec = new Map();
  for (const [label] of SCORED) for (const c of TaxonomyMap.codesFor(label)) (codeSpec.get(c) || codeSpec.set(c, []).get(c)).push(label);
  const out = [];
  for (const z of Z) {
    if (!(z.adults >= MIN_ADULTS)) continue;
    const near = nearby(z).map(y => ({ y, m: milesBetween(z, y) })).filter(x => x.m <= 25).sort((a, b) => a.m - b.m);
    let pick = near.filter(x => x.m <= 10); if (pick.length < 11) pick = near.slice(0, 11); pick = pick.slice(0, 60);
    const adults = pick.reduce((t, x) => t + (x.y.adults || 0), 0);
    if (!adults) continue;
    const pl = {}, pw = {};
    for (const x of pick) { const m = P.get(x.y.zip); if (!m) continue; for (const k in m) { pl[k] = (pl[k] || 0) + m[k] * x.y.adults; pw[k] = (pw[k] || 0) + x.y.adults; } }
    for (const k in pl) pl[k] = pw[k] ? pl[k] / pw[k] : null;
    const rows = [], ent = {};
    for (const x of pick) {
      for (const [code, n] of before.get(x.y.zip) || []) rows.push({ taxonomy_code: code, n, w: n, latitude: x.y.lat, longitude: x.y.lon, npi: 'z' + x.y.zip + code });
      for (const [code, n] of entered.get(x.y.zip) || []) for (const l of codeSpec.get(code) || []) ent[l] = (ent[l] || 0) + n;
    }
    const s = MarketModel.score({ specialties: SCORED, rows, codesFor: l => TaxonomyMap.codesFor(l), center: { lat: z.lat, lng: z.lon },
      adults, places: pl, benchmarks, pay: payOf.get(z.zip), accessE2sfca: E2 ? E2.get(z.zip) : undefined, milesBetween: (a, b, c, d) => milesBetween({ lat: a, lon: b }, { lat: c, lon: d }) });
    const ck = zc.get(z.zip);
    for (const sp of s.specialties) {
      const f = sp.factors, need = f.need ?? null, access = f.access ?? null;
      const disc = MarketModel.SHORTAGE_DISCIPLINE[sp.specialty] || 'primary';
      const hpsaScore = ck == null ? null : hpCounties.has(ck) ? (hp.get(ck)[disc] || 0) : 0;
      const pay = f.pay ?? null, comp = f.competition ?? null, po = payOf.get(z.zip);
      const payYield = po && po.yieldPct != null ? Math.round(0.7 * po.yieldPct + 0.3 * (po.incomePct ?? po.yieldPct)) : null;
      const basis = sp.evidence && sp.evidence.access ? sp.evidence.access.basis : null;
      out.push({ accessBasis: basis, zip: z.zip, fips: fipsOf.get(z.zip) || null, specialty: sp.specialty, need, access, needScore: need != null && access != null ? (need + access) / 2 : null,
        pay, payYield, competition: comp, viability: pay != null && comp != null ? (pay + comp) / 2 : null,
        hpsa: hpsaScore, hpsaMatched: ck != null, entryPer1k: (ent[sp.specialty] || 0) / adults * 1000, adults });
    }
  }
  return out;
}

export function summarize(rows) {
  const by = new Map(); for (const r of rows) (by.get(r.specialty) || by.set(r.specialty, []).get(r.specialty)).push(r);
  const res = [];
  for (const [label, rs] of by) {
    const ok = rs.filter(r => r.needScore != null);
    const quint = (key) => { const v = ok.filter(r => r[key] != null).sort((a, b) => a[key] - b[key]); const q = Math.floor(v.length / 5); if (q < 5) return null;
      const mean = a => a.reduce((t, r) => t + r.entryPer1k, 0) / a.length; const lo = mean(v.slice(0, q)), hi = mean(v.slice(-q)); return lo > 0 ? hi / lo : null; };
    const hm = rs.filter(r => r.hpsaMatched);
    res.push({ label, n: ok.length,
      rhoScore: spearman(ok.map(r => r.needScore), ok.map(r => r.entryPer1k)),
      rhoNeed: spearman(ok.map(r => r.need), ok.map(r => r.entryPer1k)),
      rhoAccess: spearman(ok.map(r => r.access), ok.map(r => r.entryPer1k)),
      liftScore: quint('needScore'),
      rhoViab: spearman(rs.filter(r => r.viability != null).map(r => r.viability), rs.filter(r => r.viability != null).map(r => r.entryPer1k)),
      liftViab: (() => { const v = rs.filter(r => r.viability != null).sort((a, b) => a.viability - b.viability); const q = Math.floor(v.length / 5); if (q < 5) return null;
        const m = a => a.reduce((t, r) => t + r.entryPer1k, 0) / a.length; const lo = m(v.slice(0, q)); return lo > 0 ? m(v.slice(-q)) / lo : null; })(),
      nViab: rs.filter(r => r.viability != null).length,
      rhoPay: spearman(rs.filter(r => r.pay != null).map(r => r.pay), rs.filter(r => r.pay != null).map(r => r.entryPer1k)),
      rhoYield: spearman(rs.filter(r => r.payYield != null).map(r => r.payYield), rs.filter(r => r.payYield != null).map(r => r.entryPer1k)),
      liftPay: quint('pay'), liftYield: quint('payYield'),
      rhoComp: spearman(rs.filter(r => r.competition != null).map(r => r.competition), rs.filter(r => r.competition != null).map(r => r.entryPer1k)),
      nHpsa: hm.length, rhoHpsa: spearman(hm.map(r => r.hpsa), hm.map(r => r.entryPer1k)),
      rhoScoreSame: spearman(hm.filter(r => r.needScore != null).map(r => r.needScore), hm.filter(r => r.needScore != null).map(r => r.entryPer1k)) });
  }
  return res;
}

// County outcomes: the need score (today's supply), averaged over the county's
// ZIPs by adults, against preventable hospital stays (County Health Rankings,
// stays for ambulatory-care-sensitive conditions per 100,000 Medicare
// enrollees; CMS's own county PQI rates are published as NA), ER visits and
// readmissions per county; HPSA (the county's own score) on the same counties.
export function outcomes(rows, util) {
  const by = new Map();
  for (const r of rows) { if (!r.fips) continue; const k = r.specialty + '|' + r.fips; const a = by.get(k) || { s: r.specialty, f: r.fips, h: null, n: 0, w: 0, need: 0, nw: 0, acc: 0, aw: 0, sc: 0, sw: 0 };
    if (r.hpsaMatched && r.hpsa != null) a.h = Math.max(a.h ?? 0, r.hpsa);
    if (r.needScore != null) { a.sc += r.needScore * r.adults; a.sw += r.adults; }
    if (r.need != null) { a.need += r.need * r.adults; a.nw += r.adults; }
    if (r.access != null) { a.acc += r.access * r.adults; a.aw += r.adults; }
    by.set(k, a); }
  const U = new Map(util.map(u => [u.fips, u]));
  const per = new Map();
  for (const a of by.values()) { const u = U.get(a.f); if (!u || !a.sw) continue; (per.get(a.s) || per.set(a.s, []).get(a.s)).push({ score: a.sc / a.sw, need: a.nw ? a.need / a.nw : null, access: a.aw ? a.acc / a.aw : null, u, hpsa: a.h }); }
  const res = [];
  for (const [label, cs] of per) {
    const rho = (key, out) => { const v = cs.filter(c => c[key] != null && c.u[out] != null); return v.length < 30 ? null : spearman(v.map(c => c[key]), v.map(c => c.u[out])); };
    const rhoH = out => { const v = cs.filter(c => c.hpsa != null && c.u[out] != null); return v.length < 30 ? null : spearman(v.map(c => c.hpsa), v.map(c => c.u[out])); };
    res.push({ label, counties: cs.length,
      pqi: rho('score', 'pqi'), pqiNeed: rho('need', 'pqi'), pqiAccess: rho('access', 'pqi'), pqiHpsa: rhoH('pqi'),
      er: rho('score', 'er'), erHpsa: rhoH('er'), readm: rho('score', 'readm'), readmHpsa: rhoH('readm') });
  }
  return res;
}

if (process.argv[1] && process.argv[1].endsWith('backtest-entry.mjs')) {
  const num = v => (v === '' || v == null ? null : Number(v));
  const input = {
    counts: read('counts').map(([zip, code, entity, b, e]) => ({ zip, code, entity, before: +b || 0, entered: +e || 0 })),
    zips: read('zips').map(([zip, lat, lon, adults]) => ({ zip, lat: num(lat), lon: num(lon), adults: num(adults) || 0 })),
    places: read('places').map(([zip, measureid, value]) => ({ zip, measureid, value: num(value) })).filter(r => r.value != null),
    bench: read('bench').map(([kind, key, data]) => ({ kind, key, data: JSON.parse(data) })),
    hpsa: read('hpsa').map(([state, county, discipline, score]) => ({ state, county, discipline, score: num(score) || 0 })),
    zipcounty: read('zipcounty').map(([zip, fips, county, state]) => ({ zip, fips, county, state })),
    acs: read('acs').map(([zip, state, uni, unins, inc, mcr, mcd, emp, dir, tri]) => ({ zip, state, insured: num(uni) > 0 && num(unins) != null ? 1 - num(unins) / num(uni) : null, income: num(inc),
      medicare: num(mcr), medicaid: num(mcd), employer: num(emp), direct: num(dir), tricare: num(tri) }))
  };
  // util: fips, er_per_1000, readmission_rate, then the 7 PQI columns for ages 65 to 74
  const util = read('util').map(c => ({ fips: c[0], er: num(c[1]), readm: num(c[2]), pqi: num(c[3]) }));
  console.log('util counties', util.length, 'with preventable stays', util.filter(u => u.pqi != null).length);
  const rows = run(input), sum = summarize(rows);
  let e2sfca = null;
  if (arg('e2sfca')) { e2sfca = new Map(); for (const [zip, spec, per1k, mins] of read('e2sfca')) { const m = e2sfca.get(zip) || {}; m[spec] = { per_1k: num(per1k), catchment_minutes: num(mins) }; e2sfca.set(zip, m); } }
  const now = run(input, { supply: 'all', e2sfca }), out = outcomes(now, util);
  const e2n = now.filter(r => r.accessBasis === 'e2sfca').length, accN = now.filter(r => r.access != null).length;
  console.log('access from drive time', e2n, 'of', accN);
  writeFileSync(arg('csv'), 'zip,specialty,need,access,need_score,pay,competition,viability,hpsa,entry_per_1k\n' + rows.map(r => [r.zip, '"' + r.specialty + '"', r.need ?? '', r.access ?? '', r.needScore ?? '', r.pay ?? '', r.competition ?? '', r.viability ?? '', r.hpsa ?? '', r.entryPer1k.toFixed(4)].join(',')).join('\n') + '\n');
  const f = v => (v == null ? 'n/a' : v.toFixed(2)), x = v => (v == null ? 'n/a' : v.toFixed(2) + 'x');
  const meta = JSON.parse(process.env.NPPES_STATS || '{}');
  const lines = ['# Back-test: need against health outcomes, viability against entry', '',
    `Run ${new Date().toISOString().slice(0, 10)} by scripts/backtest-entry.mjs. Read only.`, '',
    'Two scores, each against the outcome it claims to predict (2026-11-19, the user\'s choice after the first run showed new clinicians going to already-supplied areas):', '',
    '- **Patients need care here** = the mean of the need factor (CDC PLACES against national percentiles; age mix left out here) and the access factor (where `access_e2sfca` holds the ZIP and specialty, the stored drive-time E2SFCA figure the live score reads, against the site-weighted national rate; else listings per adult in the 10-mile catchment against the national rate' + (e2n ? `; drive time covered ${e2n.toLocaleString()} of ${accN.toLocaleString()} ZIP x specialty rows with an access figure` : '') + '). Tested with today\'s supply against county outcomes that thin access is known to raise: preventable hospital stays (County Health Rankings: stays for conditions good outpatient care usually prevents, per 100,000 Medicare enrollees; CMS publishes its own county rates as NA), ER visits per 1,000 and readmission rate (Medicare fee-for-service, newest year). County score = adult-weighted mean of its ZIPs (HUD main county). Higher correlation is better: a need score should rise with preventable stays.',
    '- **A practice can make it here** = the mean of ability to pay (insured rate 70% and median income 30%, percentiles in the state, ACS) and room from competitors (nearest same-specialty listing). Tested as of the end of 2020 against clinicians (NPI-1) enumerated in 2021 to 2025 per 1,000 adults in the catchment.',
    '- HPSA (the county\'s score for the specialty\'s discipline, 0 when a matched county has none) gets the same tests on the same counties and ZIPs.', '',
    '## Limits', '',
    '- 2020 supply counts NPIs still active today at today\'s address (deactivated records carry no address).',
    '- Need uses today\'s PLACES; the outcomes are Medicare fee-for-service only and county-wide, so a ZIP-level score is averaged up and loses detail.',
    '- Correlation is not cause: poorer, older counties have both more need and more preventable stays. Need alone and access alone are shown so the two can be told apart.', '',
    `- NPPES rows read: ${meta.rows ? meta.rows.toLocaleString() : 'n/a'}; enumerated by 2020 and active: ${meta.before ? meta.before.toLocaleString() : 'n/a'}; entered 2021 to 2025: ${meta.entered ? meta.entered.toLocaleString() : 'n/a'}`,
    `- Counties with outcomes: ${util.length.toLocaleString()}`, '',
    '## 1. Patients need care here vs county outcomes', '',
    'Spearman across counties. Preventable stays columns: the score, need alone, access alone, then HPSA.', '',
    '| Specialty | Counties | Preventable stays: score | need | access | HPSA | ER visits: score | HPSA | Readmissions: score | HPSA |', '|---|---|---|---|---|---|---|---|---|---|',
    ...out.map(o => `| ${o.label} | ${o.counties.toLocaleString()} | ${f(o.pqi)} | ${f(o.pqiNeed)} | ${f(o.pqiAccess)} | ${f(o.pqiHpsa)} | ${f(o.er)} | ${f(o.erHpsa)} | ${f(o.readm)} | ${f(o.readmHpsa)} |`), '',
    '## 2. A practice can make it here vs clinician entry 2021 to 2025', '',
    'Payer yield (dry run, 2026-11-20): coverage weighted by what it pays relative to Medicare (commercial 1.43, Medicare 1.0, Medicaid 0.72, uninsured 0; published national averages), then 70% yield and 30% income as percentiles in the state, beside the live pay factor (insured rate and income).', '',
    '| Specialty | ZIPs | Viability score | Pay alone (live) | Payer yield (dry run) | Pay: top vs bottom fifth | Yield: top vs bottom fifth | Competition alone | HPSA (same ZIPs) |', '|---|---|---|---|---|---|---|---|---|',
    ...sum.map(s2 => `| ${s2.label} | ${s2.nViab.toLocaleString()} | ${f(s2.rhoViab)} | ${f(s2.rhoPay)} | ${f(s2.rhoYield)} | ${x(s2.liftPay)} | ${x(s2.liftYield)} | ${f(s2.rhoComp)} | ${f(s2.rhoHpsa)} |`), '',
    '## 3. For reference: patients need care here vs entry (the first run\'s finding)', '',
    'Negative means new clinicians went where supply was already dense, not where the need score pointed.', '',
    '| Specialty | ZIPs | Need score | Need alone | Access alone | Top vs bottom fifth |', '|---|---|---|---|---|---|',
    ...sum.map(s2 => `| ${s2.label} | ${s2.n.toLocaleString()} | ${f(s2.rhoScore)} | ${f(s2.rhoNeed)} | ${f(s2.rhoAccess)} | ${x(s2.liftScore)} |`), ''];
  writeFileSync(arg('report'), lines.join('\n'));
  console.log(lines.slice(0, 40).join('\n'));
}
