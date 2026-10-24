// Phone numbers from NPPES: 10 US digits, or null. NPPES stores bare digits,
// sometimes with a leading 1 or an extension tacked on; anything that is not a
// plausible North American number (area and exchange codes cannot start with
// 0 or 1) is dropped rather than shown to a patient.
export function cleanPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  if (d.length !== 10) return null;
  if (/^[01]/.test(d) || /^...[01]/.test(d)) return null;
  if (/^(\d)\1{9}$/.test(d)) return null;          // 0000000000, 9999999999
  return d;
}

// Which organizations get a new phone: those NPPES has a phone for and whose
// stored phone differs. Returns { changes: [[npi, phone]], stats }.
export function phoneChanges(directory, nppes) {
  const stats = { directory_rows: 0, matched: 0, already_right: 0, to_write: 0, no_nppes_phone: 0 };
  const want = new Map(nppes);
  const changes = [];
  for (const [npi, current] of directory) {
    stats.directory_rows++;
    const p = want.get(npi);
    if (!p) { stats.no_nppes_phone++; continue; }
    stats.matched++;
    if ((current || '') === p) { stats.already_right++; continue; }
    stats.to_write++;
    changes.push([npi, p]);
  }
  return { changes, stats };
}
