// The admin's "View as" switch (2026-10-25, the user's choice): one button on
// the patient app, the portal, the market dashboard and the review queue,
// shown only for the admin account (ADMIN_EMAILS; lib/auth.js isAdmin, which
// auth-login and auth-refresh report as `admin`). It only moves between
// pages. Every page's server checks still decide what the account may see or
// do, so a session edited to claim `admin` gains a menu and nothing else.
(function () {
  var VIEWS = [
    ['/', 'Patient app'],
    ['/portal', 'Provider portal'],
    ['/dashboard', 'Market dashboard'],
    ['/admin-review.html', 'Review queue']
  ];
  var s = null;
  try { s = JSON.parse(sessionStorage.getItem('pp.session.v1') || localStorage.getItem('pp.session.v1') || 'null'); } catch (e) { s = null; }
  if (!s || !s.admin || !s.access_token) return;

  var path = location.pathname.replace(/\/+$/, '') || '/';
  var here = path === '/' || /\/app\.html$/.test(path) ? '/'
    : /portal/.test(path) ? '/portal'
    : /dashboard|\/index\.html$/.test(path) ? '/dashboard'
    : /admin-review/.test(path) ? '/admin-review.html' : '';

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  }
  var css = el('style', {});
  css.textContent =
    '#pp-admin{position:fixed;left:12px;bottom:12px;z-index:10000;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '#pp-admin>button{background:#0f172a;color:#fff;border:0;border-radius:999px;padding:10px 14px;min-height:40px;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,.25)}' +
    '#pp-admin>button:focus-visible,#pp-admin a:focus-visible{outline:3px solid #6366f1;outline-offset:2px}' +
    '#pp-admin .menu{position:absolute;left:0;bottom:48px;background:#fff;color:#0f172a;border:1px solid #d5dde8;border-radius:12px;padding:6px;min-width:200px;box-shadow:0 10px 30px rgba(15,23,42,.18)}' +
    '#pp-admin .menu[hidden]{display:none}' +
    '#pp-admin .menu p{margin:4px 8px 6px;color:#64748b;font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em}' +
    '#pp-admin a{display:block;padding:10px;border-radius:8px;color:#0f172a;text-decoration:none}' +
    '#pp-admin a:hover{background:#f1f5f9}' +
    '#pp-admin a[aria-current=page]{background:#eef2ff;color:#3730a3}' +
    '@media print{#pp-admin{display:none}}';
  document.head.appendChild(css);

  var box = el('div', { id: 'pp-admin' });
  var btn = el('button', { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'pp-admin-menu' }, 'Admin: view as');
  var menu = el('div', { class: 'menu', id: 'pp-admin-menu', hidden: '' });
  menu.appendChild(el('p', {}, 'View as'));
  VIEWS.forEach(function (v) {
    var a = el('a', { href: v[0] }, v[1]);
    if (v[0] === here) a.setAttribute('aria-current', 'page');
    menu.appendChild(a);
  });
  function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function () {
    var open = menu.hidden;
    menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
  box.appendChild(menu); box.appendChild(btn);
  function mount() { document.body.appendChild(box); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
