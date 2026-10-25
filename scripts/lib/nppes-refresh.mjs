// The weekly NPPES refresh (scripts/nppes-refresh.mjs): what a record from the
// NPPES file or the NPI Registry API becomes in our directory, and what each
// one changes. Pure functions, so scripts/test-nppes-refresh.mjs can cover
// them without a database.
//
// Rules (the user's choices, 2026-10-25):
//   - an NPI we do not list is added (NPI-2 to clinics, NPI-1 to
//     provider_individuals), with coordinates only from an accurate geocode;
//   - an NPI we list whose name, address, phone or taxonomy changed is
//     updated; a changed address is geocoded again, an unchanged one keeps
//     its coordinates;
//   - a deactivated NPI is removed from clinics, provider_individuals and
//     clinic_secondary_locations.
// Stored formats follow the national load: organization legal names and
// clinician "FIRST LAST" as NPPES writes them (capitals), the first practice
// address line, a 10-digit phone, the NUCC display name beside the code.
import { cleanPhone } from './phones.mjs';
import { pickNppesTaxonomy } from './taxonomy-map.mjs';

const T = 15;   // NPPES taxonomy slots

// The npidata_pfile columns this job reads. A missing one stops the run.
// Headers are matched with case, spacing and punctuation ignored: the
// pl_pfile writes "Address-  Address Line 2" with two spaces.
const key = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const finder = (header, what) => {
  const h = header.map(key);
  return name => {
    const i = h.indexOf(key(name));
    if (i < 0) throw new Error(`${what}: no column "${name}"`);
    return i;
  };
};

export function fileIndex(header) {
  const col = finder(header, 'NPPES file (is this the npidata_pfile, not the fileheader or pl_pfile?)');
  return {
    npi: col('NPI'), type: col('Entity Type Code'),
    org: col('Provider Organization Name (Legal Business Name)'),
    first: col('Provider First Name'), last: col('Provider Last Name (Legal Name)'),
    addr1: col('Provider First Line Business Practice Location Address'),
    city: col('Provider Business Practice Location Address City Name'),
    state: col('Provider Business Practice Location Address State Name'),
    zip: col('Provider Business Practice Location Address Postal Code'),
    phone: col('Provider Business Practice Location Address Telephone Number'),
    deact: col('NPI Deactivation Date'), react: col('NPI Reactivation Date'),
    codes: Array.from({ length: T }, (_, i) => col(`Healthcare Provider Taxonomy Code_${i + 1}`)),
    switches: Array.from({ length: T }, (_, i) => col(`Healthcare Provider Primary Taxonomy Switch_${i + 1}`))
  };
}

// The pl_pfile (secondary practice locations) columns.
export function plIndex(header) {
  const col = finder(header, 'NPPES practice-location file');
  const p = 'Provider Secondary Practice Location Address ';
  return {
    npi: col('NPI'),
    addr1: col(p + 'Address Line 1'), addr2: col(p + 'Address Line 2'),
    city: col(p + 'City Name'), state: col(p + 'State Name'), zip: col(p + 'Postal Code')
  };
}

// NPPES dates are MM/DD/YYYY. Deactivated means a deactivation date with no
// later reactivation.
const day = s => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '').trim());
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
};
export function isDeactivated(deact, react) {
  const d = day(deact);
  if (!d) return false;
  const r = day(react);
  return !r || r < d;
}

const up = s => String(s || '').trim().replace(/\s+/g, ' ').toUpperCase();
const zip5 = s => { const z = String(s || '').replace(/\D/g, '').slice(0, 5); return z.length === 5 ? z : null; };

// display: Map code -> NUCC display name.
function taxonomy(codes, switches, display) {
  const pick = pickNppesTaxonomy(codes, switches);
  if (!pick) return { code: null, src: null, taxonomy: null };
  return { code: pick.code, src: pick.source, taxonomy: display.get(pick.code) || null };
}

// One npidata_pfile row -> a normalized record, or null for a row with no
// usable NPI. A deactivated row carries only its NPI.
export function fileRecord(row, ix, display) {
  const npi = String(row[ix.npi] || '').trim();
  if (!/^\d{10}$/.test(npi)) return null;
  if (isDeactivated(row[ix.deact], row[ix.react])) return { npi, deactivated: true };
  const type = String(row[ix.type] || '').trim();
  if (type !== '1' && type !== '2') return null;
  const t = taxonomy(ix.codes.map(i => row[i]), ix.switches.map(i => row[i]), display);
  return {
    npi, type: Number(type), deactivated: false,
    name: type === '2' ? up(row[ix.org]) || null : up([row[ix.first], row[ix.last]].filter(x => String(x || '').trim()).join(' ')) || null,
    address: up(row[ix.addr1]) || null,
    city: up(row[ix.city]) || null,
    state: up(row[ix.state]).slice(0, 2) || null,
    zip: zip5(row[ix.zip]),
    phone: cleanPhone(row[ix.phone]),
    ...t
  };
}

// One NPI Registry API record -> the same shape.
export function apiRecord(rec, display) {
  const npi = String((rec && rec.number) || '');
  if (!/^\d{10}$/.test(npi)) return null;
  const b = rec.basic || {};
  if (b.status === 'D') return { npi, deactivated: true };
  const type = rec.enumeration_type === 'NPI-2' ? 2 : rec.enumeration_type === 'NPI-1' ? 1 : null;
  if (!type) return null;
  const loc = (rec.addresses || []).find(a => a.address_purpose === 'LOCATION') || {};
  const taxes = rec.taxonomies || [];
  const t = taxonomy(taxes.map(x => x.code), taxes.map(x => (x.primary ? 'Y' : 'N')), display);
  return {
    npi, type, deactivated: false,
    name: type === 2 ? up(b.organization_name) || null : up([b.first_name, b.last_name].filter(Boolean).join(' ')) || null,
    address: up(loc.address_1) || null,
    city: up(loc.city) || null,
    state: up(loc.state).slice(0, 2) || null,
    zip: zip5(loc.postal_code),
    phone: cleanPhone(loc.telephone_number),
    ...t
  };
}

// One pl_pfile row -> a secondary site, kept in NPPES's own case like the
// national load's secondary rows.
export function plRecord(row, ix) {
  const npi = String(row[ix.npi] || '').trim();
  const sp = s => String(s || '').trim().replace(/\s+/g, ' ');
  const address = sp(row[ix.addr1]);
  const zip = zip5(row[ix.zip]);
  if (!/^\d{10}$/.test(npi) || !address || !zip) return null;
  return { npi, address, address2: sp(row[ix.addr2]) || null, city: sp(row[ix.city]) || null, state: sp(row[ix.state]).slice(0, 2).toUpperCase() || null, zip };
}

export const tableFor = rec => (rec.type === 2 ? 'clinics' : 'provider_individuals');

const same = (a, b) => up(a) === up(b);
export const moved = (old, rec) => !same(old.address, rec.address) || !same(old.city, rec.city) || !same(old.state, rec.state) || !same(old.zip, rec.zip);

// What changed between a stored row and a fresh record. A blank incoming
// phone or taxonomy never blanks a stored one.
export function changes(old, rec) {
  const out = [];
  if (rec.name && !same(old.name, rec.name)) out.push('name');
  if (moved(old, rec)) out.push('address');
  if (rec.phone && (old.phone || '') !== rec.phone) out.push('phone');
  if (rec.code && (old.taxonomy_code || '') !== rec.code) out.push('taxonomy');
  return out;
}

// The database row for a record. coords: {lat, lng} or null (not drawn).
export function rowFor(rec, old, coords, now) {
  const keep = old && !moved(old, rec);
  const lat = keep ? old.latitude ?? null : coords ? coords.lat : null;
  const lng = keep ? old.longitude ?? null : coords ? coords.lng : null;
  const row = {
    npi: rec.npi,
    name: rec.name ?? old?.name ?? null,
    address: rec.address, city: rec.city, state: rec.state, zip: rec.zip,
    phone: rec.phone || old?.phone || null,
    primary_taxonomy: rec.code ? rec.taxonomy : old?.primary_taxonomy ?? null,
    taxonomy_code: rec.code || old?.taxonomy_code || null,
    taxonomy_code_source: rec.code ? rec.src : old?.taxonomy_code_source ?? null,
    latitude: lat, longitude: lng
  };
  if (rec.type === 1) {
    row.refreshed_at = now;
    if (!old) { row.enumeration_type = 'NPI-1'; row.source = 'nppes_weekly'; }
  }
  return row;
}

// Sort one chunk of records against what the directory holds.
// existing: { clinics: Map npi -> row, provider_individuals: Map npi -> row }.
// Returns the NPIs to delete, the records to insert or update, and which of
// them need a geocode.
export function planChunk(records, existing) {
  const p = { deletes: [], inserts: [], updates: [], geocode: [], stats: {} };
  const bump = k => { p.stats[k] = (p.stats[k] || 0) + 1; };
  for (const rec of records) {
    if (rec.deactivated) {
      const held = existing.clinics.has(rec.npi) || existing.provider_individuals.has(rec.npi);
      bump(held ? 'deactivated_listed' : 'deactivated_not_listed');
      if (held) p.deletes.push(rec.npi);
      continue;
    }
    const table = tableFor(rec);
    const other = table === 'clinics' ? 'provider_individuals' : 'clinics';
    const old = existing[table].get(rec.npi);
    if (!old && existing[other].has(rec.npi)) { bump('type_changed_skipped'); continue; }
    if (!rec.address || !rec.zip) { bump('no_practice_address'); continue; }
    if (!old) {
      bump(table === 'clinics' ? 'new_organizations' : 'new_clinicians');
      p.inserts.push(rec); p.geocode.push(rec);
      continue;
    }
    const c = changes(old, rec);
    if (!c.length) { bump('unchanged'); continue; }
    for (const k of c) bump('changed_' + k);
    bump(table === 'clinics' ? 'updated_organizations' : 'updated_clinicians');
    p.updates.push({ rec, old });
    if (c.includes('address')) p.geocode.push(rec);
  }
  return p;
}

// Refuse to write when the totals do not look like a normal week: a broken
// file or a wrong match would otherwise delete or rewrite the directory.
export const LIMITS = {
  weekly: { min_records: 1000, max_deletes: 25000, max_updates: 300000, max_inserts: 300000 },
  full: { min_records: 5000000, max_deletes: 400000, max_updates: 3000000, max_inserts: 1500000 },
  api: { min_records: 0, max_deletes: 0, max_updates: 300000, max_inserts: 300000 }
};
export function overLimit(totals, mode) {
  const l = LIMITS[mode];
  if (!l) return `unknown mode ${mode}`;
  if (totals.records < l.min_records) return `only ${totals.records} records; a ${mode} file has at least ${l.min_records}`;
  if (totals.deletes > l.max_deletes) return `${totals.deletes} deletions is over the ${mode} limit of ${l.max_deletes}`;
  if (totals.updates > l.max_updates) return `${totals.updates} updates is over the ${mode} limit of ${l.max_updates}`;
  if (totals.inserts > l.max_inserts) return `${totals.inserts} additions is over the ${mode} limit of ${l.max_inserts}`;
  return null;
}

// Weekly file names: NPPES_Data_Dissemination_MMDDYY_MMDDYY_Weekly(_V2).zip.
// Returns { start, end } as YYYY-MM-DD, or null.
export function weeklyRange(name) {
  const m = /NPPES_Data_Dissemination_(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_Weekly/i.exec(String(name || ''));
  if (!m) return null;
  return { start: `20${m[3]}-${m[1]}-${m[2]}`, end: `20${m[6]}-${m[4]}-${m[5]}` };
}

// Which weekly files to apply: every one that ends after the last applied
// week, oldest first (V2 preferred when both spellings exist), and whether
// the files on offer start late enough to leave a gap.
export function weeksToApply(names, lastEnd) {
  const byEnd = new Map();
  for (const n of names) {
    const r = weeklyRange(n);
    if (!r) continue;
    const cur = byEnd.get(r.end);
    if (!cur || (/_V2/i.test(n) && !/_V2/i.test(cur.name))) byEnd.set(r.end, { name: n, ...r });
  }
  const all = [...byEnd.values()].sort((a, b) => (a.end < b.end ? -1 : 1));
  // No state yet (the first run): every weekly file still offered.
  const todo = lastEnd ? all.filter(w => w.end > lastEnd) : all;
  let gap = false;
  if (lastEnd && todo.length) {
    const next = new Date(lastEnd + 'T00:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
    gap = todo[0].start > next.toISOString().slice(0, 10);
  }
  return { todo, gap };
}
