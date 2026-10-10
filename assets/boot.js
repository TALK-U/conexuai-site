/* 首页偏好：主题与语言。<head> 里同步执行，先于首帧，避免闪烁。
   同源外链而非内联：CSP 的 script-src 只放 'self'，不为它开 hash 或 unsafe-inline。 */
(function () {
  var d = document.documentElement, ls = null;
  try { ls = window.localStorage; } catch (e) {}
  function get(k) { try { return ls && ls.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (ls) ls.setItem(k, v); } catch (e) {} }
  var t = get('cx-theme');
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
  var p = location.pathname, isEn = /^\/en(\/|$)/.test(p);
  function other() { return (isEn ? (p.replace(/^\/en/, '') || '/') : '/en' + p) + location.hash; }
  /* 只在首次（还没有语言偏好）按浏览器语言落页；记下偏好后不再自动跳 */
  if (ls && !get('cx-lang')) {
    var want = /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
    set('cx-lang', want);
    if (get('cx-lang') === want && (want === 'en') !== isEn) { location.replace(other()); return; }
  }
  document.addEventListener('DOMContentLoaded', function () {
    var l = document.getElementById('lang'), b = document.getElementById('theme');
    if (l) l.addEventListener('click', function (e) {
      e.preventDefault(); set('cx-lang', isEn ? 'zh' : 'en'); location.href = other();
    });
    if (b) b.addEventListener('click', function () {
      var cur = d.getAttribute('data-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var n = cur === 'dark' ? 'light' : 'dark';
      d.setAttribute('data-theme', n); set('cx-theme', n);
    });
  });
})();
