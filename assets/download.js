/**
 * 下载页 · 兑码（约 45 行，零依赖，同源）。
 *
 * 禁用 JS 时表单原样 POST 到 /api/redeem，由 Functions 返回一张最简回执页——
 * 拿不到包的人不该是因为他关了 JavaScript。
 */
(function () {
  "use strict";
  var form = document.getElementById("redeem-form");
  var out = document.getElementById("redeem-out");
  if (!form || !out) return;
  var en = document.documentElement.lang === "en";
  var T = en ? {
    checking: "Checking…",
    net: "Could not reach the server. Please try again in a moment.",
    link: "Download Conexuai",
    ver: "Version",
    sha: "SHA-256 of this file:",
    expires: "This link expires in %d minutes.",
  } : {
    checking: "正在校验…",
    net: "连不上服务器，请过一会儿再试一次。",
    link: "下载 Conexuai",
    ver: "版本",
    sha: "这个文件的 SHA-256：",
    expires: "这个链接 %d 分钟后失效。",
  };

  function show(html, bad) {
    out.hidden = false;
    out.className = bad ? "notice notice-bad" : "notice";
    out.innerHTML = html;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  form.addEventListener("submit", function (ev) {
    if (!form.reportValidity()) return;
    ev.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    show(esc(T.checking), false);

    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (btn) btn.disabled = false;
        var b = res.body || {};
        if (!res.ok || !b.ok) { show(esc(b.error || T.net), true); return; }
        show(
          '<p><a class="btn btn-primary" href="' + esc(b.url) + '" download>' + esc(T.link) + "</a></p>" +
          "<p>" + esc(b.filename || "") +
            (b.version ? " · " + esc(T.ver) + " " + esc(b.version) : "") + "</p>" +
          "<p>" + esc(T.sha) + '<code class="hash">' + esc(b.sha256) + "</code></p>" +
          "<p>" + esc(T.expires.replace("%d", String(Math.round((b.expiresIn || 0) / 60)))) + "</p>",
          false,
        );
      })
      .catch(function () {
        if (btn) btn.disabled = false;
        show(esc(T.net), true);
      });
  });
})();
