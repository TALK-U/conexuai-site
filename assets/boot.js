/* 主题与语言。<head> 里同步执行，先于首帧。
   同源外链而非内联：CSP 的 script-src 只放 'self'。 */
(function () {
  var d = document.documentElement, ls = null, ss = null;
  try { ls = window.localStorage; } catch (e) {}
  try { ss = window.sessionStorage; } catch (e) {}
  function get(k) { try { return ls && ls.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (ls) ls.setItem(k, v); } catch (e) {} }
  var t = get('cx-theme');
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);

  try { history.scrollRestoration = 'manual'; } catch (e) {}
  var pending = null;
  try { pending = ss && ss.getItem('cx-scroll'); } catch (e) {}
  if (pending !== null && pending !== '') {
    try { ss.removeItem('cx-scroll'); } catch (e) {}
    var y = Number(pending);
    if (y >= 0 && y < 1e7) {
      var done = false;
      function place() {
        if (done || !document.body) return;
        var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        var target = Math.min(y, max);
        window.scrollTo(0, target);
        if (Math.abs((window.scrollY || 0) - target) <= 1) done = true;
      }
      if (window.MutationObserver) {
        var mo = new MutationObserver(function () { place(); });
        mo.observe(d, { childList: true, subtree: true });
        document.addEventListener('DOMContentLoaded', function () {
          place();
          mo.disconnect();
        });
      }
      document.addEventListener('DOMContentLoaded', place);
      window.addEventListener('load', function () { place(); done = true; });
    }
  }

  var p = location.pathname, isEn = /^\/en(\/|$)/.test(p);
  function other() {
    if (isEn) return p.replace(/^\/en/, '') || '/';
    return '/en' + p;
  }
  function remember() {
    try { if (ss) ss.setItem('cx-scroll', String(Math.round(window.scrollY || 0))); } catch (e) {}
  }
  if (ls && !get('cx-lang')) {
    var want = /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
    set('cx-lang', want);
    if (get('cx-lang') === want && (want === 'en') !== isEn) {
      remember();
      location.replace(other());
      return;
    }
  }

  function setOpen(header, toggle, open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    var label = toggle.getAttribute(open ? 'data-close-label' : 'data-open-label');
    if (label) toggle.setAttribute('aria-label', label);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var l = document.getElementById('lang'), b = document.getElementById('theme');
    var header = document.querySelector('.hd'), toggle = document.querySelector('.nav-toggle');
    if (l) l.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      set('cx-lang', isEn ? 'zh' : 'en');
      remember();
      location.href = other();
    });
    if (b) b.addEventListener('click', function () {
      var cur = d.getAttribute('data-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var n = cur === 'dark' ? 'light' : 'dark';
      d.setAttribute('data-theme', n);
      set('cx-theme', n);
    });
    if (header && toggle) {
      toggle.addEventListener('click', function () {
        setOpen(header, toggle, !header.classList.contains('is-open'));
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && header.classList.contains('is-open')) {
          setOpen(header, toggle, false);
          toggle.focus();
        }
      });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute('href') || '';
      if (header && toggle && header.classList.contains('is-open') && header.contains(a)) {
        setOpen(header, toggle, false);
      }
      if (href.charAt(0) !== '#' || href.length < 2) return;
      var el = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!el) return;
      e.preventDefault();
      var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', href);
    });
  });
})();
