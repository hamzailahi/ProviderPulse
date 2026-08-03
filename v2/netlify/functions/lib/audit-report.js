// audit-report.js
// Renders a Directory Accuracy audit as one self-contained HTML document.
//
// Self-contained is a hard requirement: no external CSS, no webfonts, no
// images. The buyer prints this to PDF and forwards it inside an organisation
// that will not fetch anything from us, and a report whose styling depends on
// a live CDN is a report that arrives broken.
//
// Pure: takes rows, returns a string. No I/O, so it can be rendered and
// eyeballed without touching the network.

'use strict';

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Quoted verbatim in the appendix and reused in the per-finding footer. One
// definition so the two can never drift apart.
const DISCLAIMER =
  'This report is a screening signal, not a compliance determination. ' +
  'It surfaces records that merit human verification; it does not certify, ' +
  'validate, or guarantee the accuracy of any provider record, and it is not ' +
  'legal or regulatory advice.';

const VERDICT_LABEL = {
  excluded: 'Excluded',
  likely_inactive: 'Likely inactive',
  likely_stale: 'Likely stale',
  unverifiable: 'Unverifiable',
  likely_accurate: 'Likely accurate'
};

// Worst first: an audit is read top-down and the actionable rows must be there.
const VERDICT_ORDER = ['excluded', 'likely_inactive', 'likely_stale', 'unverifiable', 'likely_accurate'];

const VERDICT_TONE = {
  excluded: 'crit', likely_inactive: 'crit', likely_stale: 'warn',
  unverifiable: 'unk', likely_accurate: 'ok'
};

function summarise(findings) {
  const byVerdict = {};
  for (const f of findings) byVerdict[f.verdict] = (byVerdict[f.verdict] || 0) + 1;
  const scored = findings.filter(f => typeof f.confidence === 'number');
  const mean = scored.length
    ? Math.round((scored.reduce((s, f) => s + f.confidence, 0) / scored.length) * 100) / 100
    : null;
  // What a payer acts on: anything not confirmed current.
  const needsWork = findings.filter(f => f.verdict !== 'likely_accurate').length;
  return { byVerdict, mean, needsWork, total: findings.length };
}

function signalRows(signals) {
  if (!Array.isArray(signals) || !signals.length) {
    return '<tr><td colspan="3" class="muted">No signals recorded.</td></tr>';
  }
  return signals.map(s => {
    const dir = s.direction === 'positive' ? '+' : s.direction === 'negative' ? '−' : '·';
    const cls = s.direction === 'positive' ? 'ok' : s.direction === 'negative' ? 'crit' : 'unk';
    return `<tr>
      <td class="sig-name">${esc(s.name)}</td>
      <td><span class="dir ${cls}">${dir}</span> ${esc(s.value)}</td>
      <td class="muted">${esc(s.detail || '')}</td>
    </tr>`;
  }).join('');
}

function renderAuditReport(audit, findings) {
  const rows = (findings || []).slice().sort((a, b) => {
    const av = VERDICT_ORDER.indexOf(a.verdict), bv = VERDICT_ORDER.indexOf(b.verdict);
    if (av !== bv) return (av < 0 ? 99 : av) - (bv < 0 ? 99 : bv);
    return (a.confidence ?? 1) - (b.confidence ?? 1);
  });
  const s = summarise(rows);
  const generated = new Date().toISOString().slice(0, 10);
  const label = audit && audit.label ? audit.label : 'Directory accuracy audit';
  const scope = [
    audit && audit.state ? esc(audit.state) : null,
    audit && Array.isArray(audit.zip_prefixes) && audit.zip_prefixes.length
      ? 'ZIP ' + audit.zip_prefixes.map(esc).join(', ') : null
  ].filter(Boolean).join(' · ');

  const tiles = VERDICT_ORDER
    .filter(v => s.byVerdict[v])
    .map(v => `<div class="tile ${VERDICT_TONE[v]}">
        <div class="tile-n">${s.byVerdict[v]}</div>
        <div class="tile-l">${esc(VERDICT_LABEL[v] || v)}</div>
      </div>`).join('');

  const findingBlocks = rows.map((f, i) => `
    <section class="finding">
      <div class="f-head">
        <div>
          <div class="f-name">${esc(f.provider_name || 'Provider')}</div>
          <div class="f-meta">NPI ${esc(f.npi)}${f.address_checked ? ' &middot; ' + esc(f.address_checked) : ''}</div>
        </div>
        <div class="f-score">
          <span class="badge ${VERDICT_TONE[f.verdict] || 'unk'}">${esc(VERDICT_LABEL[f.verdict] || f.verdict || '—')}</span>
          <span class="conf">${f.confidence == null ? '—' : f.confidence.toFixed(2)}</span>
        </div>
      </div>
      ${f.narrative ? `<p class="f-narr">${esc(f.narrative)}</p>` : '<p class="f-narr muted">No rationale recorded.</p>'}
      <table class="sig">
        <thead><tr><th>Signal</th><th>Finding</th><th>Detail</th></tr></thead>
        <tbody>${signalRows(f.signals)}</tbody>
      </table>
    </section>`).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(label)} — ProviderPulse</title>
<style>
  /* System fonts only: a webfont would not load inside the buyer's network. */
  :root{--ink:#12181f;--mut:#5b6876;--line:#dfe4ea;--ok:#1a7f5a;--warn:#a8621b;
        --crit:#b03030;--unk:#6b7683;--a1:#0d9488;--a2:#4f46e5}
  *{box-sizing:border-box}
  body{margin:0;padding:40px 44px 64px;color:var(--ink);background:#fff;
       font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       max-width:1000px}
  h1,h2,h3{font-family:ui-serif,Georgia,"Times New Roman",serif;font-weight:600;letter-spacing:-.01em}
  h1{font-size:27px;margin:0 0 4px}
  h2{font-size:18px;margin:34px 0 12px;padding-bottom:7px;border-bottom:1px solid var(--line)}
  .brand{display:flex;align-items:center;gap:10px;margin-bottom:18px}
  .mark{width:26px;height:26px;border-radius:7px;flex:none;
        background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;
        display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}
  .brand-n{font-family:ui-serif,Georgia,serif;font-size:16px;font-weight:600}
  .sub{color:var(--mut);font-size:13px;margin:0}
  .tiles{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 6px}
  .tile{border:1px solid var(--line);border-left-width:3px;border-radius:8px;padding:11px 15px;min-width:120px}
  .tile-n{font:700 23px ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums}
  .tile-l{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
  .tile.ok{border-left-color:var(--ok)} .tile.warn{border-left-color:var(--warn)}
  .tile.crit{border-left-color:var(--crit)} .tile.unk{border-left-color:var(--unk)}
  .headline{border:1px solid var(--line);border-radius:10px;padding:15px 18px;margin:16px 0;background:#fafbfc}
  .headline b{font:700 17px ui-monospace,Menlo,monospace}
  .reg{font-size:13px;color:var(--mut);line-height:1.6}
  .finding{border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin:0 0 14px;
           break-inside:avoid;page-break-inside:avoid}
  .f-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
  .f-name{font-weight:650;font-size:15px}
  .f-meta{color:var(--mut);font-size:12px;margin-top:2px;font-family:ui-monospace,Menlo,monospace}
  .f-score{display:flex;align-items:center;gap:10px;flex:none}
  .conf{font:700 17px ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums}
  .badge{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
         padding:3px 9px;border-radius:20px;border:1px solid;white-space:nowrap}
  .badge.ok{color:var(--ok);border-color:var(--ok);background:#eef8f3}
  .badge.warn{color:var(--warn);border-color:var(--warn);background:#fdf4ea}
  .badge.crit{color:var(--crit);border-color:var(--crit);background:#fdeeee}
  .badge.unk{color:var(--unk);border-color:var(--unk);background:#f4f6f8}
  .f-narr{margin:12px 0 12px;font-size:13.5px}
  table.sig{width:100%;border-collapse:collapse;font-size:12px}
  table.sig th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.07em;
               color:var(--mut);border-bottom:1px solid var(--line);padding:5px 8px 5px 0;font-weight:600}
  table.sig td{padding:5px 8px 5px 0;border-bottom:1px solid #f0f3f6;vertical-align:top}
  .sig-name{font-family:ui-monospace,Menlo,monospace;white-space:nowrap}
  .dir{display:inline-block;width:13px;font-weight:700}
  .dir.ok{color:var(--ok)} .dir.crit{color:var(--crit)} .dir.unk{color:var(--unk)}
  .muted{color:var(--mut)}
  .appendix{font-size:12.5px;color:var(--mut)}
  .appendix li{margin-bottom:6px}
  .disclaimer{border:1px solid var(--line);border-left:3px solid var(--warn);
              border-radius:8px;padding:13px 16px;margin-top:14px;font-size:12.5px;color:var(--ink)}
  .foot{margin-top:34px;padding-top:12px;border-top:1px solid var(--line);
        font-size:11px;color:var(--mut)}
  @media print{
    body{padding:0;max-width:none;font-size:11.5pt}
    h2{page-break-after:avoid} .finding{border-color:#ccc}
    .tile,.headline,.finding,.disclaimer{break-inside:avoid}
  }
</style></head>
<body>

<div class="brand"><div class="mark">&#10010;</div><div class="brand-n">ProviderPulse</div></div>

<h1>${esc(label)}</h1>
<p class="sub">Directory accuracy audit${scope ? ' · ' + scope : ''} · ${esc(s.total)} provider records · generated ${esc(generated)}</p>

<h2>Executive summary</h2>
<div class="headline">
  <b>${s.needsWork}</b> of <b>${s.total}</b> audited records could not be confirmed as currently accurate.
  Mean confidence <b>${s.mean == null ? '—' : s.mean.toFixed(2)}</b> on a 0–1 scale.
</div>
<div class="tiles">${tiles || '<div class="tile unk"><div class="tile-n">0</div><div class="tile-l">No findings</div></div>'}</div>

<h2>Why directory accuracy is measurable now</h2>
<p class="reg">
  Under the REAL Health Providers Act, Medicare Advantage plans are required to verify
  provider directory records on a rolling 90-day cycle, and plan-level accuracy scores are
  scheduled to be published from 2029. Separately, the CY2026 CMS final rule brings plan
  directory data onto Medicare Plan Finder, where it is visible to beneficiaries at the point
  of choosing a plan. Directory quality therefore moves from an internal operations metric to
  a published one. This report measures a sample of records against independent federal
  sources so that gaps can be found and corrected before they are scored.
</p>

<h2>Findings</h2>
<p class="sub">Ordered by severity, then by confidence. Every score is decomposed into the signals that produced it.</p>
${findingBlocks || '<p class="muted">No findings recorded for this audit.</p>'}

<h2>Methodology</h2>
<ul class="appendix">
  <li><b>NPPES</b> (National Plan &amp; Provider Enumeration System) — registration status and the practice address of record. A deactivated NPI remains in the registry indefinitely, so registry presence alone is not evidence of a current practice.</li>
  <li><b>Medicare Physician &amp; Other Practitioners PUF</b> (CMS) — most recent year in which the NPI billed Medicare services. Keyed on the rendering practitioner, so it does not cover organisational NPIs, and many providers legitimately bill no Medicare at all.</li>
  <li><b>PECOS Order &amp; Referring</b> (CMS) — current enrolment and eligibility to order or refer.</li>
  <li><b>OIG LEIE</b> (HHS Office of Inspector General) — federal exclusions. <b>Only about 10.5% of LEIE records carry a usable NPI</b> (8,586 distinct NPIs across 83,665 records), so NPI matching alone detects roughly one excluded provider in ten. A name-and-state match is reported as a review item rather than a finding, because that combination collides for over a thousand real provider names.</li>
  <li><b>Geocoding</b> (Nominatim, Photon) — whether the directory address resolves, and how far it sits from the registry address. Tolerance is 2 km.</li>
  <li><b>Provider attestation</b> (ProviderPulse) — whether the provider has claimed the listing and confirmed this address against an NPPES-verified location.</li>
  <li><b>Scoring</b> — hand-weighted and fully decomposed; every finding lists the signals behind it. A missing input contributes no weight and is reported as unknown. Unknown is never treated as clean.</li>
</ul>

<div class="disclaimer"><b>Scope and limitations.</b> ${esc(DISCLAIMER)}</div>

<div class="foot">
  ProviderPulse · audit ${esc(audit && audit.id ? audit.id : '')} · ${esc(generated)}
</div>
</body></html>`;
}

module.exports = { renderAuditReport, DISCLAIMER, VERDICT_ORDER, summarise };
