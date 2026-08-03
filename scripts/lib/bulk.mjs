// Shared helpers for the bulk import scripts (LEIE, Medicare activity).
//
// Extracted from scripts/import-leie.mjs. NOTE: import-leie.mjs has deliberately
// NOT been rewired to use this module -- it is a working monthly job and
// rewriting it is a separate change with its own risk, outside the scope of the
// task that created this file. Do that as its own commit when someone has the
// appetite to re-run the LEIE import and confirm the counts still match.
//
// The parser here is a STREAMING version. LEIE's in-memory parser is fine for a
// 15 MB file; the CMS files are hundreds of MB and would risk the runner's heap.

/**
 * Parse CSV from a byte stream, yielding one array of fields per row.
 *
 * Minimal RFC-4180: handles quoted fields, escaped "" inside quotes, and CRLF.
 * Quote state is carried across chunk boundaries, so a quoted field containing
 * a comma or newline that happens to straddle a 64 KB read still parses -- the
 * bug you only find in production, on one row out of a million.
 */
export async function* streamCsvRows(readable) {
  const decoder = new TextDecoder('utf-8');
  let row = [], field = '', inQuotes = false, pendingQuote = false;

  const flushField = () => { row.push(field); field = ''; };

  for await (const chunk of readable) {
    const text = decoder.decode(chunk, { stream: true });
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (pendingQuote) {
        // Previous char was a quote while inside quotes: either an escaped
        // quote, or the close of the field.
        pendingQuote = false;
        if (c === '"') { field += '"'; continue; }
        inQuotes = false;
        // fall through and reprocess c as an unquoted char
      }
      if (inQuotes) {
        if (c === '"') pendingQuote = true;
        else field += c;
        continue;
      }
      if (c === '"') inQuotes = true;
      else if (c === ',') flushField();
      else if (c === '\n') { flushField(); yield row; row = []; }
      else if (c !== '\r') field += c;
    }
  }
  // Trailing chunk of a multi-byte character, then the final row if the file
  // does not end with a newline.
  field += decoder.decode();
  if (field.length || row.length) { flushField(); yield row; }
}

/** Fetch a URL and stream its CSV rows. Throws with the status on failure. */
export async function* fetchCsvRows(url, label) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ProviderPulse-import' } });
  if (!res.ok) throw new Error(`${label}: download failed: HTTP ${res.status} ${url}`);
  if (!res.body) throw new Error(`${label}: response had no body`);
  yield* streamCsvRows(res.body);
}

/** Stream CSV rows from a local file (for --file testing without the network). */
export async function* fileCsvRows(path) {
  const { createReadStream } = await import('node:fs');
  yield* streamCsvRows(createReadStream(path));
}

/**
 * Resolve a header row into a case/whitespace-insensitive column lookup, and
 * fail with the columns actually present when an expected one is missing.
 *
 * This is the difference between "the first Action run tells you the dataset
 * changed and names the columns" and "the table quietly fills with nulls".
 */
export function columnIndex(header, required, label) {
  const norm = s => String(s ?? '').trim().toUpperCase().replace(/^﻿/, '');
  const cols = header.map(norm);
  const at = name => cols.indexOf(norm(name));
  const missing = required.filter(n => at(n) === -1);
  if (missing.length) {
    throw new Error(
      `${label}: expected column(s) not found: ${missing.join(', ')}\n` +
      `  columns actually present (${cols.length}): ${cols.join(', ')}\n` +
      `  Fix the constants at the top of the script against the CMS data dictionary.`
    );
  }
  return at;
}

export const clean = v => {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
};

export const cleanNpi = v => {
  const s = String(v ?? '').trim();
  return /^\d{10}$/.test(s) && s !== '0000000000' ? s : null;
};

export const cleanInt = v => {
  const s = String(v ?? '').trim().replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s));
};

/**
 * POST rows to PostgREST in batches.
 *
 * `onConflict` switches this from insert to upsert. Supply it whenever absence
 * of a row is not itself a signal -- a full refresh would then be churn, and a
 * partially-failed refresh would look like mass deletion.
 */
export async function batchWrite(rows, { url, key, table, batch = 1000, onConflict = null, label = 'insert' }) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: onConflict ? 'return=minimal,resolution=merge-duplicates' : 'return=minimal'
  };
  const endpoint = `${url}/rest/v1/${table}` + (onConflict ? `?on_conflict=${onConflict}` : '');

  for (let i = 0; i < rows.length; i += batch) {
    const chunk = rows.slice(i, i + batch);
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(chunk) });
    if (!res.ok) {
      throw new Error(`${label} failed at row ${i}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    }
    process.stdout.write(`\r  ${label}: ${Math.min(i + batch, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}`);
  }
  if (rows.length) process.stdout.write('\n');
}
