// Rules for "fax via organization" (2026-11-16, the user's rule): a clinician
// with no fax of their own may show an organization's fax only when
//   1. Medicare's reassignment list says the clinician bills through that
//      organization (individual NPI -> group PAC ID, and the group's PAC ID ->
//      organization NPIs in the Public Provider Enrollment file), AND
//   2. the clinician's own NPPES practice address is that organization's
//      address (same ZIP, same house number and street; suite ignored).
// Several qualifying organizations with different faxes: none is chosen.
import { streetOnly, streetParts } from './geocode-batch.mjs';

export function addressKey(address, state, zip) {
  const z = String(zip || '').trim().slice(0, 5);
  if (!/^\d{5}$/.test(z)) return null;
  const p = streetParts(streetOnly(address), String(state || '').toUpperCase());
  if (!/^\d/.test(p.house) || !p.rest.length) return null;
  return [z, p.house, p.dirs.slice().sort().join(' '), p.rest.join(' ')].join('|');
}

// Find a column by pattern; throw with the header when it is missing.
export function findCol(header, re, label) {
  const i = header.findIndex(h => re.test(String(h).trim().replace(/^﻿/, '')));
  if (i < 0) throw new Error(`${label}: no column matches ${re}. Columns: ${header.join(', ')}`);
  return i;
}

/**
 * docs: Map npi -> addressKey (clinicians with no fax)
 * reassign: Map npi -> Set(groupPac)
 * pacOrgs: Map pac -> Set(orgNpi)
 * orgs: Map orgNpi -> { key, fax, name }
 * Returns { matches: [{npi, org_npi, org_name, fax}], counts }
 */
export function matchFaxViaOrg({ docs, reassign, pacOrgs, orgs }) {
  const counts = { clinicians_without_fax: docs.size, with_reassignment: 0, group_has_org_npi: 0, org_has_fax: 0, same_address: 0, ambiguous: 0, matched: 0 };
  const matches = [];
  for (const [npi, key] of docs) {
    const pacs = reassign.get(npi);
    if (!pacs) continue;
    counts.with_reassignment++;
    const orgNpis = new Set();
    for (const pac of pacs) for (const o of pacOrgs.get(pac) || []) orgNpis.add(o);
    if (!orgNpis.size) continue;
    counts.group_has_org_npi++;
    const withFax = [...orgNpis].map(o => [o, orgs.get(o)]).filter(([, o]) => o && o.fax);
    if (!withFax.length) continue;
    counts.org_has_fax++;
    const here = key ? withFax.filter(([, o]) => o.key === key) : [];
    if (!here.length) continue;
    counts.same_address++;
    const faxes = new Set(here.map(([, o]) => o.fax));
    if (faxes.size > 1) { counts.ambiguous++; continue; }
    const [orgNpi, o] = here.sort((a, b) => a[0].localeCompare(b[0]))[0];
    matches.push({ npi, org_npi: orgNpi, org_name: o.name, fax: o.fax });
    counts.matched++;
  }
  return { matches, counts };
}
