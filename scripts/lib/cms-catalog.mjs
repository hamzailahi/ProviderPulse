// CMS DCAT catalog resolution, shared by scripts/import-medicare-activity.mjs
// and scripts/train-demand-model.mjs. Moved here unchanged from the importer
// (see its header for why dataset URLs are resolved at run time, not pinned).

const CMS_CATALOG = 'https://data.cms.gov/data.json';

let _catalog = null;
export async function catalog() {
  if (_catalog) return _catalog;
  console.log(`catalog: fetching ${CMS_CATALOG}`);
  const res = await fetch(CMS_CATALOG, { headers: { 'User-Agent': 'ProviderPulse-import' } });
  if (!res.ok) throw new Error(`catalog: HTTP ${res.status} from ${CMS_CATALOG}. Pass --puf-url/--or-url to bypass.`);
  const json = await res.json();
  const sets = Array.isArray(json) ? json : (json.dataset || json.datasets || []);
  if (!sets.length) throw new Error(`catalog: parsed but found no datasets. Shape may have changed; pass --puf-url/--or-url to bypass.`);
  console.log(`catalog: ${sets.length.toLocaleString()} datasets`);
  _catalog = sets;
  return sets;
}

const CSV_RE = /\.csv(\?|$)/i;

/** All CSV download URLs on a DCAT dataset entry, newest-looking first. */
function csvDistributions(ds) {
  const dists = ds.distribution || ds.distributions || [];
  return dists
    .map(d => ({
      url: d.downloadURL || d.accessURL || d.downloadUrl || null,
      title: d.title || d.name || '',
      format: (d.format || d.mediaType || '').toLowerCase()
    }))
    .filter(d => d.url && (CSV_RE.test(d.url) || d.format.includes('csv')));
}

/** Pull a 4-digit year out of a distribution title or URL, if one is there. */
function yearOf(s) {
  const m = String(s || '').match(/(20\d{2})/g);
  return m ? Math.max(...m.map(Number)) : null;
}

/**
 * Pull a full date out of a distribution title or filename as YYYYMMDD.
 *
 * Order & Referring is republished WEEKLY, and every snapshot carries the same
 * year, so a year-only sort cannot order them -- it left selection depending on
 * the order CMS happened to return, which would silently pick a stale enrolment
 * file the day they reorder. Enrolment freshness is the whole value of that
 * signal, so it gets a real comparison.
 *
 * Handles "Order and Referring : 2026-07-31" and "OrderReferring_20260730.csv".
 */
function dateOf(s) {
  const t = String(s || '');
  const dash = t.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (dash) return Number(dash[1] + dash[2] + dash[3]);
  const plain = t.match(/(20\d{2})(\d{2})(\d{2})/);
  if (plain) {
    const mm = Number(plain[2]), dd = Number(plain[3]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) return Number(plain[1] + plain[2] + plain[3]);
  }
  return null;
}

/**
 * A catalog title without a trailing release stamp. data.cms.gov began
 * suffixing titles with " : YYYY-MM-DD" (seen 2026-10), which broke every
 * pattern anchored with $. Patterns are matched against the bare title.
 */
export function baseTitle(t) {
  return String(t || '').trim().replace(/\s*:\s*(19|20)\d{2}(-\d{2}(-\d{2})?)?\s*$/, '').trim();
}

/**
 * Find one dataset by title and return its newest CSV distribution.
 * Prints every candidate, so a failed match is diagnosable from the log alone
 * rather than requiring another round trip.
 */
export async function resolve(titleRe, label) {
  const sets = await catalog();
  const hits = sets.filter(d => titleRe.test(baseTitle(d.title)));

  if (!hits.length) {
    // Near-misses: titles sharing the pattern's two most specific words, so the
    // log names the dataset we meant rather than the first word that matched.
    const words = titleRe.source.replace(/[\\^$.*+?()[\]{}|]/g, ' ').split(/\s+/).filter(w => w.length > 4)
      .sort((x, y) => y.length - x.length).slice(0, 2).map(w => w.toLowerCase());
    const near = sets
      .filter(d => words.length && words.every(w => String(d.title || '').toLowerCase().includes(w.slice(0, -1))))
      .slice(0, 15)
      .map(d => `      - ${d.title}`);
    throw new Error(
      `${label}: no catalog entry matched ${titleRe}\n` +
      (near.length ? `    similar titles present:\n${near.join('\n')}\n` : '') +
      `    Pass --puf-url/--or-url with a direct CSV link to bypass the catalog.`
    );
  }

  console.log(`${label}: ${hits.length} catalog match(es)`);
  const options = [];
  for (const ds of hits) {
    for (const d of csvDistributions(ds)) {
      options.push({
        dataset: ds.title,
        modified: ds.modified || '',
        // Title before URL, deliberately: the 2024 PUF lives under a /2026-05/
        // publication path, so reading the URL first would label 2024 data as
        // 2026 and misdate every activity signal derived from it.
        year: yearOf(d.title) || yearOf(d.url) || yearOf(ds.modified),
        // Full date where one exists, for weekly-republished datasets.
        date: dateOf(d.title) || dateOf(d.url) || null,
        // The dataset's own release stamp (" : YYYY-MM-DD" in its title), a
        // tiebreak when several releases of the same dataset match.
        released: dateOf(ds.title) || null,
        ...d
      });
    }
  }
  if (!options.length) {
    throw new Error(
      `${label}: matched "${hits[0].title}" but it exposes no CSV distribution.\n` +
      `    distributions seen: ${JSON.stringify((hits[0].distribution || []).slice(0, 5))}\n` +
      `    Pass --puf-url/--or-url to bypass.`
    );
  }

  // Newest first: year, then the full date within that year, then the dataset's
  // modified stamp as a last resort. Without the date term this fell through to
  // catalog order for weekly files, which is not an ordering at all.
  options.sort((a, b) =>
    (b.year || 0) - (a.year || 0) ||
    (b.date || 0) - (a.date || 0) ||
    (b.released || 0) - (a.released || 0) ||
    String(b.modified).localeCompare(String(a.modified))
  );
  for (const o of options.slice(0, 8)) {
    console.log(`    ${o.year || '????'}${o.date ? '-' + String(o.date).slice(4) : '    '}  ${o.title || '(untitled)'}  ${o.url}`);
  }
  const pick = options[0];
  console.log(`${label}: using ${pick.year || 'unknown year'} -> ${pick.url}`);
  return pick;
}
