/**
 * POST /api/redeem · 邀请码换限时下载链接。
 *
 * 一码一包：每位测试者一份带自己水印的安装包，邀请码记录里直接指向它。
 * 码与包一一对应，溯源才成立（内测协议第 4 条）。
 *
 * **失败一律同一句话**：不存在 / 已撤销 / 已用尽都回「邀请码无效或已用尽」。
 * 区分开来等于免费告诉对方"这个码是真的，只是用完了"，那就能拿来枚举有效码空间。
 *
 * 签名链接 TTL 30 分钟，每次兑码重新签发——链接万一被转发，泄漏窗口是有界的。
 * 链接由本站自己 HMAC 签（见 _lib.js signDownload 的注释：为什么不用 R2 预签名）。
 * 已经下载出去的包收不回来，这正是水印存在的理由，不试图用技术手段解决。
 */
import { clientIp, rateLimited, reply, signDownload } from './_lib.js';

const TTL_SEC = 30 * 60;
const INVALID_ZH = '邀请码无效或已用尽。';
const INVALID_EN = 'That invitation code is not valid, or has been used up.';

/** 抄写宽容：大小写、空格、连字符都不计较；Crockford 的易混字符一律归位。 */
export function normalize(input) {
  const s = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    .replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
  return s.length >= 8 && s.length <= 20 ? s : null;
}

export async function onRequestPost({ request, env }) {
  const ip = clientIp(request);
  if (await rateLimited(env, 'redeem', ip, 5, 60)) {
    return reply(request, 429, { ok: false, error: '试得太频繁了，请过一分钟再试。' },
      '<p>试得太频繁了，请过一分钟再试。<br>Too many attempts — please wait a minute.</p>');
  }

  const form = new URLSearchParams(await request.text());
  const code = normalize(form.get('code'));
  const invalid = () => reply(request, 400, { ok: false, error: INVALID_ZH },
    `<p>${INVALID_ZH}<br>${INVALID_EN}</p>`);

  if (!code || !env.INVITES || !env.PACKAGES) return invalid();

  const raw = await env.INVITES.get(`invite:${code}`);
  if (!raw) return invalid();

  let rec;
  try { rec = JSON.parse(raw); } catch { return invalid(); }
  if (rec.revokedAt) return invalid();
  if (Number(rec.uses || 0) >= Number(rec.maxUses || 1)) return invalid();
  if (!rec.buildKey || !rec.sha256) return invalid();

  const object = await env.PACKAGES.get(rec.buildKey);
  if (!object) return invalid();

  // 用量先记再发链接：先发后记的话，写失败就等于这个码白送一次
  rec.uses = Number(rec.uses || 0) + 1;
  rec.lastUsedAt = new Date().toISOString();
  await env.INVITES.put(`invite:${code}`, JSON.stringify(rec));

  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SEC;
  const token = await signDownload(env.LINK_SECRET || '', rec.buildKey, expiresAt);
  const url = `${new URL(request.url).origin}/api/package?k=${encodeURIComponent(rec.buildKey)}`
    + `&e=${expiresAt}&t=${token}`;

  return reply(request, 200, {
    ok: true,
    url,
    // 混发两个版本时，只给文件名与哈希，测试者分不清自己拿的是哪一版
    version: rec.version || null,
    filename: rec.filename || rec.buildKey.split('/').pop(),
    sha256: rec.sha256,
    expiresIn: TTL_SEC,
  }, `<p>下载链接（${TTL_SEC / 60} 分钟内有效）：<a href="${url}">${rec.filename || rec.buildKey}</a>${rec.version ? `（${rec.version}）` : ''}</p>
<p>SHA-256：<code class="hash">${rec.sha256}</code></p>
<p>装之前请按<a href="/download/">下载页</a>的三步校验一遍。</p>`);
}

export const onRequestGet = () => Response.redirect('/download/', 302);
