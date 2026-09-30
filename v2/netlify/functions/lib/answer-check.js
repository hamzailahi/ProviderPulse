// lib/answer-check.js
// Checks that every figure in an assistant answer can be traced to data.
//
// The market assistant is told never to state a number it did not get from a
// tool. A prompt is advisory, so this makes it checkable: pull every number out
// of the text and require that it appears in a tool result from the same
// conversation (or in the assistant's own documented method, or in what the
// user typed). Pure and dependency-free, so the rule can be tested offline.
//
// WHAT COUNTS AS TRACED
//   1. Found in a source, allowing for display rounding: 13.9 matches 13.904,
//      "14" matches 13.9, "88%" matches 88 or 0.88, "410,000" matches 410000,
//      "4.2M" matches 4,213,000. A 5-digit number (a ZIP) must match exactly.
//   2. Derived from two traced numbers on the SAME line (a sentence, bullet or
//      table row): their sum, difference, ratio, percent change or share.
//      Requiring the operands beside the result keeps coincidences rare; a
//      figure whose inputs are not shown cannot be checked, so it is flagged.
//
// WHAT IS NOT CHECKED (deliberately, to keep false alarms rare)
//   list numbering ("1."), "top 3", the unit in "per 1,000", counts of
//   structure words ("3 reasons"), years, the 0-100 scale ("72 of 100"), and numbers written as words
//   ("two cardiologists"). The last is a known limit: digits only.

'use strict';

const NUM = /(?<![A-Za-z]-?)(?<![\w.])(\$)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(%|[kKmMbB](?![A-Za-z])|x(?![A-Za-z])|×)?/g;
const STRUCTURE_WORDS = /^\s+(reasons?|factors?|steps?|options?|points?|findings?|bullets?|questions?|ways|sections?|things|items|tools?|scenarios?|paragraphs?|sentences?|lines?|headings?)\b/i;
const SCALE = { k: 1e3, m: 1e6, b: 1e9 };

// Every number token in `text`, with enough detail to compare it with another.
function extractNumbers(text) {
  const s = String(text == null ? '' : text);
  const out = [];
  const lines = s.split('\n');
  let offset = 0;
  lines.forEach((line, li) => {
    NUM.lastIndex = 0;
    let m;
    while ((m = NUM.exec(line)) !== null) {
      const intPart = m[2].replace(/,/g, ''), frac = m[3] || '', suffix = m[4] || '';
      const decimals = frac ? frac.length - 1 : 0;
      let value = Number(intPart + frac);
      const tok = {
        raw: m[0], line: li, lineText: line, index: m.index, decimals,
        dollar: !!m[1], percent: suffix === '%', multiple: suffix === 'x' || suffix === '×',
        scale: SCALE[suffix.toLowerCase()] || 1, sig: (intPart.replace(/^0+/, '') + frac.slice(1)).length || 1,
        plainInt: !frac && !suffix && !m[1] && !m[2].includes(','), intString: intPart
      };
      if (tok.scale > 1) value *= tok.scale;
      tok.value = value;
      tok.exempt = exemptReason(line, m, tok);
      out.push(tok);
    }
    offset += line.length + 1;
  });
  return out;
}

function exemptReason(line, m, tok) {
  const before = line.slice(0, m.index), after = line.slice(m.index + m[0].length);
  if (/^\s*(?:[-*>]\s+)?$/.test(before) && /^[.)]\s/.test(after)) return 'list marker';
  if (/\btop\s+$/i.test(before) && tok.plainInt) return 'top N';
  if (/\bper\s+$/i.test(before) && /^10+$/.test(tok.intString) && !m[3] && !m[4]) return 'per unit';   // "per 1,000" names a rate, it is not a claim
  if (tok.plainInt && STRUCTURE_WORDS.test(after)) return 'structure word';
  if (tok.plainInt && tok.value >= 1900 && tok.value <= 2100) return 'year';
  if (tok.plainInt && tok.value === 100 && /(?:\bof\s|\/)$/.test(before)) return 'scale';
  return '';
}

// Does answer number `t` equal source value `s` once display rounding is allowed?
function sameNumber(t, s) {
  const v = t.value;
  if (t.scale > 1) {
    const place = Math.pow(10, Math.floor(Math.log10(Math.abs(v) || 1)) - (t.sig - 1));
    return Math.abs(s - v) <= 0.5 * place + 1e-9;
  }
  let place = Math.pow(10, -t.decimals);
  // "410,000" is usually a rounded 410,312. Round at the written precision, but
  // only for big whole numbers: "50" or "100" must not match 48 or 104.
  if (t.decimals === 0 && !t.percent && !t.dollar && v >= 1000) {
    const tz = t.intString.length - t.intString.replace(/0+$/, '').length;
    if (tz >= 3) place = Math.pow(10, tz);
  }
  const near = x => Math.abs(Math.round(x / place) * place - v) < place * 1e-6;
  if (near(s)) return true;
  // "93.8%" is usually the fraction 0.938 in a payload.
  if (t.percent && Math.abs(s) <= 1.0000001 && near(s * 100)) return true;
  return false;
}

// The numbers a set of source texts contain, plus their exact integer strings
// (a ZIP must match exactly, never "by rounding").
function collectSourceNumbers(texts) {
  const values = [], ints = new Set();
  for (const t of texts || []) {
    for (const tok of extractNumbers(t)) {
      values.push(tok.value);
      if (tok.plainInt) ints.add(tok.intString);
    }
  }
  return { values: Array.from(new Set(values)), ints };
}

function traced(t, src) {
  if (t.plainInt && t.intString.length === 5) return src.ints.has(t.intString);   // ZIP-shaped
  for (let i = 0; i < src.values.length; i++) if (sameNumber(t, src.values[i])) return true;
  return false;
}

// Simple arithmetic on two traced numbers shown on the same line.
function derivedFrom(t, pool) {
  const v = t.value, place = Math.pow(10, -t.decimals);
  const eq = x => isFinite(x) && Math.abs(Math.round(x / place) * place - v) < place * 1e-6;
  for (let i = 0; i < pool.length; i++) {
    for (let j = 0; j < pool.length; j++) {
      if (i === j) continue;
      const a = pool[i], b = pool[j];
      if (eq(a + b) || eq(Math.abs(a - b))) return true;
      if (b !== 0 && (eq(a / b) || eq(Math.abs((a - b) / b) * 100) || eq((a / b) * 100))) return true;
      if (a + b !== 0 && eq((a / (a + b)) * 100)) return true;
    }
  }
  return false;
}

/**
 * @param {string} text            the answer or document body
 * @param {string[]} sources       tool results from this conversation
 * @param {string[]} allowed       other legitimate text: the assistant's own
 *                                 method description, the user's question, the
 *                                 dashboard context
 * @returns {{checked:number, traced:number, derived:number, exempt:number,
 *            unverified:{raw:string, line:string}[]}}
 */
function verifyText(text, sources, allowed) {
  const src = collectSourceNumbers([].concat(sources || [], allowed || []));
  const toks = extractNumbers(text);
  const res = { checked: 0, traced: 0, derived: 0, exempt: 0, unverified: [] };
  const byLine = new Map();
  for (const t of toks) {
    if (t.exempt) { res.exempt++; continue; }
    res.checked++;
    t.ok = traced(t, src);
    if (t.ok) res.traced++;
    if (!byLine.has(t.line)) byLine.set(t.line, []);
    byLine.get(t.line).push(t);
  }
  for (const list of byLine.values()) {
    const pool = list.filter(t => t.ok).map(t => t.value);
    for (const t of list) {
      if (t.ok) continue;
      if (pool.length >= 2 && derivedFrom(t, pool)) { t.ok = true; res.derived++; continue; }
      res.unverified.push({ raw: t.raw, line: t.lineText.trim().slice(0, 160) });
    }
  }
  return res;
}

module.exports = { extractNumbers, collectSourceNumbers, verifyText, sameNumber };
