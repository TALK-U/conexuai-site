/**
 * Cloudflare Pages Functions · 全站响应头。
 *
 * CSP 是这一层最要紧的一条：它把「页面无第三方脚本」从一句承诺变成浏览器强制的事实。
 * Turnstile 是唯一一个被放进白名单的外部来源，
 * 而且只放 script-src / frame-src 两项——它需要这两项，别的不给。
 *
 * 注意 'unsafe-inline' **不在** script-src 里：站点没有任何内联脚本，
 * 两个 .js 都是同源外链文件。哪天有人想内联一段，CSP 会先拦住他。
 */
const TURNSTILE = 'https://challenges.cloudflare.com';

const CSP = [
  "default-src 'self'",
  `script-src 'self' ${TURNSTILE}`,
  `frame-src ${TURNSTILE}`,
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

export async function onRequest(context) {
  const res = await context.next();
  const h = new Headers(res.headers);
  h.set('Content-Security-Policy', CSP);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=(), usb=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  // HSTS 只在 https 上下发；自定义域绑好、确认全站 https 之后它才有意义
  if (new URL(context.request.url).protocol === 'https:') {
    h.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
