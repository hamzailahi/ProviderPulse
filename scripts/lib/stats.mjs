// Small statistics for the back-test (2026-11-25, the user's ask for
// citable figures: confidence intervals, p-values, holdout and controls).
// No dependencies; deterministic (seeded) resampling so a rerun on the same
// data prints the same intervals.
import { spearman } from './e2sfca.mjs';

export function ranks(v) {
  const n = v.length, o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(n);
  for (let i = 0; i < n;) { let j = i; while (j + 1 < n && o[j + 1][0] === o[i][0]) j++; const m = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[o[k][1]] = m; i = j + 1; }
  return r;
}

// Mulberry32: a seeded generator, so intervals repeat run to run.
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Two-sided p-value for Spearman's rho from the t approximation
// t = r sqrt((n-2)/(1-r^2)) with n-2 degrees of freedom, using the
// regularized incomplete beta function (continued fraction, Numerical Recipes).
function betacf(a, b, x) {
  const MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function lgamma(z) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let ser = 1.000000000190015;
  for (const c of g) ser += c / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
export function ibeta(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
export function pSpearman(r, n) {
  if (r == null || n < 4) return null;
  if (Math.abs(r) >= 1) return 0;
  const df = n - 2, t = r * Math.sqrt(df / (1 - r * r));
  return ibeta(df / 2, 0.5, df / (df + t * t));
}

// Analytic 95% interval for Spearman's rho: Fisher z with the Bonett and
// Wright (2000) standard error sqrt((1 + r^2/2)/(n - 3)).
export function ciSpearman(r, n) {
  if (r == null || n < 5) return null;
  const z = Math.atanh(Math.max(-0.999999, Math.min(0.999999, r))), se = Math.sqrt((1 + r * r / 2) / (n - 3));
  return [Math.tanh(z - 1.96 * se), Math.tanh(z + 1.96 * se)];
}

// Paired bootstrap: resample the same units for both measures, so the
// interval is for the difference rho(a,y) - rho(b,y) on identical units.
export function bootDiff(a, b, y, B = 500, seed = 1) {
  const n = y.length; if (n < 30) return null;
  const rand = rng(seed), d = [];
  for (let k = 0; k < B; k++) {
    const ia = new Array(n); for (let i = 0; i < n; i++) ia[i] = Math.floor(rand() * n);
    const ys = ia.map(i => y[i]), r1 = spearman(ia.map(i => a[i]), ys), r2 = spearman(ia.map(i => b[i]), ys);
    if (r1 != null && r2 != null) d.push(r1 - r2);
  }
  d.sort((p, q) => p - q);
  const q = p => d[Math.min(d.length - 1, Math.max(0, Math.round(p * (d.length - 1))))];
  return { lo: q(0.025), hi: q(0.975), share_above_0: d.filter(v => v > 0).length / d.length, B: d.length };
}

// Partial Spearman: rank every variable, regress the ranks of x and of y on
// the ranks of the controls (least squares), correlate the residuals.
function ols(Y, X) {   // X: n x k with intercept column; returns residuals
  const k = X[0].length, n = Y.length, XtX = Array.from({ length: k }, () => new Array(k).fill(0)), Xty = new Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let p = 0; p < k; p++) { Xty[p] += X[i][p] * Y[i]; for (let q = 0; q < k; q++) XtX[p][q] += X[i][p] * X[i][q]; }
  // Gauss-Jordan
  const M = XtX.map((row, i) => [...row, Xty[i]]);
  for (let c = 0; c < k; c++) {
    let p = c; for (let r = c + 1; r < k; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; const v = M[c][c]; if (Math.abs(v) < 1e-12) return null;
    for (let j = c; j <= k; j++) M[c][j] /= v;
    for (let r = 0; r < k; r++) if (r !== c) { const f = M[r][c]; for (let j = c; j <= k; j++) M[r][j] -= f * M[c][j]; }
  }
  const beta = M.map(row => row[k]);
  return Y.map((y, i) => y - X[i].reduce((t, x, p) => t + x * beta[p], 0));
}
export function partialSpearman(x, y, controls) {
  const n = x.length; if (n < 30) return null;
  const C = controls.map(ranks), X = Array.from({ length: n }, (_, i) => [1, ...C.map(c => c[i])]);
  const ex = ols(ranks(x), X), ey = ols(ranks(y), X);
  if (!ex || !ey) return null;
  let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += ex[i] * ey[i]; sxx += ex[i] ** 2; syy += ey[i] ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

// Stable half split by key (FNV-1a hash), so the same county always lands in
// the same half.
export function half(key) {
  let h = 0x811c9dc5; for (const ch of String(key)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h % 2 === 0 ? 'A' : 'B';
}
export const shareOf = r => (r == null ? null : r >= 0.15 ? 1 : r >= 0.05 ? 0.5 : 0);
