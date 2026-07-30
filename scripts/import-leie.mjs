// Import the HHS OIG exclusions list (LEIE) into Supabase.
//
// OIG publishes the complete list monthly as a single ~15 MB CSV, so this does a
// full refresh (delete then insert) rather than an upsert: providers who have been
// reinstated must disappear, and an upsert would leave them behind forever.
//
// Only ~10% of LEIE records carry an NPI, so importing every row (not just the ones
// with an NPI) is deliberate — it is what makes name-based matching possible later.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/import-leie.mjs [--dry-run] [--file path.csv]

const SOURCE = 'https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv';
const TABLE = 'leie_exclusions';
const BATCH = 1000;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.indexOf('--file') !== -1 ? args[args.indexOf('--file') + 1] : null;

// Minimal RFC-4180 parser. The LEIE quotes every field and business names contain
// commas, so splitting on commas is not an option.
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const clean = v => {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
};
// LEIE writes a placeholder rather than leaving these blank
const cleanNpi = v => {
  const s = String(v ?? '').trim();
  return /^\d{10}$/.test(s) && s !== '0000000000' ? s : null;
};
const cleanDate = v => {
  const s = String(v ?? '').trim();
  return /^\d{8}$/.test(s) && s !== '00000000' ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : null;
};

async function main() {
  let csv;
  if (fileArg) {
    csv = await (await import('node:fs/promises')).readFile(fileArg, 'utf8');
    console.log(`read ${fileArg} (${(csv.length / 1e6).toFixed(1)} MB)`);
  } else {
    console.log(`downloading ${SOURCE} ...`);
    const res = await fetch(SOURCE, { headers: { 'User-Agent': 'ProviderPulse-LEIE-import' } });
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
    csv = await res.text();
    console.log(`downloaded ${(csv.length / 1e6).toFixed(1)} MB`);
  }

  const rows = parseCsv(csv);
  const header = rows.shift().map(h => h.trim().toUpperCase());
  const col = name => header.indexOf(name);
  const need = ['LASTNAME', 'FIRSTNAME', 'BUSNAME', 'NPI', 'EXCLTYPE', 'EXCLDATE'];
  const missing = need.filter(n => col(n) === -1);
  if (missing.length) throw new Error(`LEIE layout changed, missing columns: ${missing.join(', ')}`);

  const records = rows
    .filter(r => r.length >= header.length - 2)
    .map(r => ({
      npi: cleanNpi(r[col('NPI')]),
      last_name: clean(r[col('LASTNAME')]),
      first_name: clean(r[col('FIRSTNAME')]),
      mid_name: clean(r[col('MIDNAME')]),
      business_name: clean(r[col('BUSNAME')]),
      general: clean(r[col('GENERAL')]),
      specialty: clean(r[col('SPECIALTY')]),
      city: clean(r[col('CITY')]),
      state: clean(r[col('STATE')]),
      zip: clean(r[col('ZIP')]),
      excl_type: clean(r[col('EXCLTYPE')]),
      excl_date: cleanDate(r[col('EXCLDATE')]),
      rein_date: cleanDate(r[col('REINDATE')])
    }));

  const withNpi = records.filter(r => r.npi).length;
  const distinctNpi = new Set(records.filter(r => r.npi).map(r => r.npi)).size;
  console.log(`parsed ${records.length.toLocaleString()} records`);
  console.log(`  with a usable NPI: ${withNpi.toLocaleString()} (${(100 * withNpi / records.length).toFixed(1)}%), ${distinctNpi.toLocaleString()} distinct`);

  // A collapsed parse would silently wipe the table, so refuse to proceed on a
  // result too small to be plausible.
  if (records.length < 50000) throw new Error(`only ${records.length} records parsed; refusing to replace the table`);

  if (dryRun) { console.log('--dry-run: nothing written'); return; }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  process.stdout.write('clearing existing rows ... ');
  const del = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=gte.0`, { method: 'DELETE', headers });
  if (!del.ok) throw new Error(`delete failed: HTTP ${del.status} ${await del.text()}`);
  console.log('done');

  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(chunk)
    });
    if (!res.ok) throw new Error(`insert failed at row ${i}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    process.stdout.write(`\rinserted ${Math.min(i + BATCH, records.length).toLocaleString()} / ${records.length.toLocaleString()}`);
  }
  console.log('\nLEIE import complete');
}

main().catch(e => { console.error('LEIE import failed:', e.message); process.exit(1); });
