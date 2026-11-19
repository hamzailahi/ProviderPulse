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

export function run(input) {
  const { counts, zips, places, bench, hpsa, zipcounty } = input;
  const Z = zips.filter(z => Number.isFinite(z.lat) && Number.isFinite(z.lon));
  const zipIdx = new Map(Z.map(z => [z.zip, z]));
  // Supply as of the cutoff (both tables, like the live model) and clinician entrants after it.
  const before = new Map(), entered = new Map();   // zip -> Map code -> n
  for (const r of counts) {
    if (r.before) { const m = before.get(r.zip) || new Map(); m.set(r.code, (m.get(r.code) || 0) + r.before); before.set(r.zip, m); }
    if (r.entered && r.entity === '1') { const m = entered.get(r.zip) || new Map(); m.set(r.code, (m.get(r.code) || 0) + r.entered); entered.set(r.zip, m); }
  }
  const P = new Map();
  for (const r of places) { const m = P.get(r.zip) || {}; m[r.measureid] = r.value; P.set(r.zip, m); }
  const benchmarks = { measures: {}, specialties: {} };
  for (const r of bench) { if (r.kind === 'measure') benchmarks.measures[r.key] = r.data; if (r.kind === 'specialty') benchmarks.specialties[r.key] = r.data; }
  const hp = new Map();   // state|countyKey -> {primary, dental, mental}
  for (const h of hpsa) {
    const k = h.state + '|' + countyKey(h.county), d = /mental/i.test(h.discipline) ? 'mental' : /dental/i.test(h.discipline) ? 'dental' : /primary/i.test(h.discipline) ? 'primary' : null;
    if (!d) continue;
    const o = hp.get(k) || {}; o[d] = Math.max(o[d] || 0, h.score || 0); hp.set(k, o);
  }
  const hpCounties = new Set([...hp.keys()]);
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
      adults, places: pl, benchmarks, milesBetween: (a, b, c, d) => milesBetween({ lat: a, lon: b }, { lat: c, lon: d }) });
    const ck = zc.get(z.zip);
    for (const sp of s.specialties) {
      const f = sp.factors, need = f.need ?? null, access = f.access ?? null;
      const disc = MarketModel.SHORTAGE_DISCIPLINE[sp.specialty] || 'primary';
      const hpsaScore = ck == null ? null : hpCounties.has(ck) ? (hp.get(ck)[disc] || 0) : 0;
      out.push({ zip: z.zip, specialty: sp.specialty, need, access, needScore: need != null && access != null ? (need + access) / 2 : null,
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
      nHpsa: hm.length, rhoHpsa: spearman(hm.map(r => r.hpsa), hm.map(r => r.entryPer1k)),
      rhoScoreSame: spearman(hm.filter(r => r.needScore != null).map(r => r.needScore), hm.filter(r => r.needScore != null).map(r => r.entryPer1k)) });
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
    zipcounty: read('zipcounty').map(([zip, county, state]) => ({ zip, county, state }))
  };
  const rows = run(input), sum = summarize(rows);
  writeFileSync(arg('csv'), 'zip,specialty,need,access,need_score,hpsa,entry_per_1k\n' + rows.map(r => [r.zip, '"' + r.specialty + '"', r.need ?? '', r.access ?? '', r.needScore ?? '', r.hpsa ?? '', r.entryPer1k.toFixed(4)].join(',')).join('\n') + '\n');
  const f = v => (v == null ? 'n/a' : v.toFixed(2));
  const meta = JSON.parse(process.env.NPPES_STATS || '{}');
  const lines = ['# Back-test: the need score against where clinicians entered', '',
    `Run ${new Date().toISOString().slice(0, 10)} by scripts/backtest-entry.mjs. Read only.`, '',
    'Each ZIP with at least 1,000 adults is scored as of the end of 2020: the live model\'s need factor (CDC PLACES measures against national percentiles; age mix is left out here) and its access factor (listings per adult in the 10-mile catchment against the national rate, counting only NPIs enumerated by the end of 2020). "Patients need care here" is their average. The outcome is clinicians (NPI-1) enumerated in 2021 to 2025 per 1,000 adults in the same catchment. HPSA (the county\'s designation score for the specialty\'s discipline, 0 when the county has none) is tested the same way.', '',
    '## Limits', '',
    '- Supply in 2020 counts NPIs still active today at today\'s address: clinicians who retired or moved since are missing or misplaced (NPPES blanks deactivated records), so 2020 supply is understated and survivors are placed where they are now.',
    '- Need uses today\'s PLACES and today\'s adults; both change slowly, but they are not 2020 figures.',
    '- Entry is an NPI being issued, mostly new graduates and newly licensed clinicians. It measures where clinicians start practising, which reflects jobs and training sites as much as need.',
    '- A positive correlation means the score points where clinicians went; a negative one means they went to already-supplied places. Neither alone proves the score right or wrong; the comparison with HPSA on the same ZIPs is the fair test.', '',
    `- NPPES rows read: ${meta.rows ? meta.rows.toLocaleString() : 'n/a'}; deactivated (not placeable): ${meta.deactivated ? meta.deactivated.toLocaleString() : 'n/a'}; enumerated by 2020 and active: ${meta.before ? meta.before.toLocaleString() : 'n/a'}; entered 2021 to 2025: ${meta.entered ? meta.entered.toLocaleString() : 'n/a'}`,
    `- ZIP x specialty rows scored: ${rows.length.toLocaleString()}`, '',
    '## By specialty', '',
    'Rank correlation (Spearman) with entry per 1,000 adults. "Top vs bottom fifth" is the mean entry rate in the highest-scoring fifth of ZIPs over the lowest. The last two columns use only ZIPs whose county matched HPSA records, so the score and HPSA are compared on the same ZIPs.', '',
    '| Specialty | ZIPs | Need score | Need alone | Access alone | Top vs bottom fifth | ZIPs with county | HPSA | Need score, same ZIPs |', '|---|---|---|---|---|---|---|---|---|',
    ...sum.map(s => `| ${s.label} | ${s.n.toLocaleString()} | ${f(s.rhoScore)} | ${f(s.rhoNeed)} | ${f(s.rhoAccess)} | ${s.liftScore == null ? 'n/a' : s.liftScore.toFixed(2) + 'x'} | ${s.nHpsa.toLocaleString()} | ${f(s.rhoHpsa)} | ${f(s.rhoScoreSame)} |`), ''];
  writeFileSync(arg('report'), lines.join('\n'));
  console.log(lines.slice(-sum.length - 3).join('\n'));
}
