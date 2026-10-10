/**
 * GET /api/package?k=&e=&t= · 验签后把安装包从 R2 流回去。
 *
 * 这是 /api/redeem 发出的那条限时链接的另一端。只认自己签的票：
 * 对象键与过期时刻都在签名覆盖范围内，改任何一个字签名就不对。
 * 验签失败与过期都回同一句，不区分——区分开来就是在告诉人"这个键是存在的"。
 */
import { reply, verifyDownload } from './_lib.js';

const GONE_ZH = '链接已失效，请回下载页重新兑一次邀请码。';
const GONE_EN = 'This link has expired — redeem your invitation code again on the download page.';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const key = u.searchParams.get('k') || '';
  const exp = Number(u.searchParams.get('e') || 0);
  const token = u.searchParams.get('t') || '';
  const gone = () => reply(request, 403, { ok: false, error: GONE_ZH },
    `<p>${GONE_ZH}<br>${GONE_EN}</p>`);

  if (!key || !exp || !env.PACKAGES) return gone();
  if (Math.floor(Date.now() / 1000) > exp) return gone();
  if (!(await verifyDownload(env.LINK_SECRET || '', key, exp, token))) return gone();

  const object = await env.PACKAGES.get(key);
  if (!object) return gone();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('content-disposition', `attachment; filename="${key.split('/').pop()}"`);
  // 限时链接不该被任何中间层缓存下来——缓存等于把有效期悄悄延长
  headers.set('cache-control', 'private, no-store');
  return new Response(object.body, { headers });
}
