/**
 * 申请页 · 表单增强（约 60 行，零依赖，同源）。
 *
 * **禁用 JS 也能提交**：表单本身就是 <form method="post" action="/api/apply">，
 * 这里只做三件事——原地显示回执、防重复点击、按需挂 Turnstile。
 * 页面的功能不建立在这个文件被执行的前提上。
 */
(function () {
  "use strict";
  var form = document.getElementById("apply-form");
  if (!form) return;
  var note = document.getElementById("apply-note");
  var en = document.documentElement.lang === "en";
  var T = en ? {
    sending: "Submitting…",
    ok: "Received. We review applications by hand and will email you.",
    bad: "Could not submit: ",
    net: "Could not reach the server. Please try again in a moment.",
  } : {
    sending: "正在提交…",
    ok: "已收到，审核后邮件通知。",
    bad: "没能提交：",
    net: "连不上服务器，请过一会儿再试一次。",
  };

  /**
   * Turnstile 人机校验。
   * **只有配了站点密钥才去加载它的脚本**——没配就一个外部请求都不发，
   * 这样「页面无第三方脚本」这条验收在未配置态下是可被抓包直证的，不是一句承诺。
   */
  var box = document.querySelector(".cf-turnstile");
  if (box && box.getAttribute("data-sitekey")) {
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  function say(text, bad) {
    if (!note) return;
    note.textContent = text;
    note.className = bad ? "notice notice-bad" : "notice";
  }

  form.addEventListener("submit", function (ev) {
    if (!form.reportValidity()) return;
    ev.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    say(T.sending, false);

    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (res.ok && res.body && res.body.ok) {
          form.hidden = true;
          var done = document.createElement("p");
          done.className = "notice";
          done.textContent = T.ok;
          form.parentNode.insertBefore(done, form);
          return;
        }
        if (btn) btn.disabled = false;
        say(T.bad + ((res.body && res.body.error) || ""), true);
      })
      .catch(function () {
        if (btn) btn.disabled = false;
        say(T.net, true);
      });
  });
})();
