/** 两个 API 共用的小东西：节流、回执、字段清洗。刻意保持到最小，不做框架。 */

/** 同一来源的调用频次。IP **只存哈希**，不存明文——与隐私声明第七节一致。 */
export async function rateLimited(env, bucket, ip, limit, windowSec) {
  if (!env.APPLICATIONS) return false;                 // KV 没绑就不拦，如实退化
  const key = `rl:${bucket}:${await sha256Hex(`${ip}|${env.RL_SALT || 'conexuai'}`)}`;
  const seen = Number((await env.APPLICATIONS.get(key)) || 0);
  if (seen >= limit) return true;
  await env.APPLICATIONS.put(key, String(seen + 1), { expirationTtl: windowSec });
  return false;
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 想要 JSON 就给 JSON；否则给一张最简回执页——**禁用 JS 的人照样走得完流程**。 */
export function reply(request, status, payload, htmlBody) {
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  return new Response(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Conexuai</title>
<link rel="stylesheet" href="/assets/tokens.css"><link rel="stylesheet" href="/assets/site.css"></head>
<body><main id="main"><div class="wrap prose"><h1>Conexuai</h1>${htmlBody}
<p><a class="btn" href="/">返回首页 · Back to home</a></p></div></main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

/** 只收白名单字段，其余一律丢掉；单值截断、多选限量。表单体本身另有大小上限。 */
export function pick(form, spec) {
  const out = {};
  for (const [name, rule] of Object.entries(spec)) {
    if (rule.multi) {
      out[name] = form.getAll(name).slice(0, rule.max || 16).map((v) => String(v).slice(0, 64));
    } else {
      const v = form.get(name);
      out[name] = v === null ? null : String(v).slice(0, rule.max || 200);
    }
  }
  return out;
}

export const clientIp = (request) => request.headers.get('CF-Connecting-IP') || '0.0.0.0';

/**
 * 限时下载链接的签名。
 *
 * 为什么不用 R2 的 S3 兼容预签名：那需要一把长期有效的存储 API 密钥，
 * 而我们不愿意让这样一把密钥住进部署环境、再交给一段代码去签。
 * 所以这里换个做法，效果一样：链接由本站自己用 HMAC 签，/api/package 验签后从 R2 取对象流回去。
 * 对用户没有差别（一条限时链接），对我们少了一把长期有效的存储密钥在外面飘。
 */
const enc = new TextEncoder();

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

export async function signDownload(secret, objectKey, expiresAtSec) {
  return hmac(secret, `${objectKey}|${expiresAtSec}`);
}

/** 逐字节比完再回结果：提前 return 会把"前几位对了"这件事透过耗时漏出去。 */
export async function verifyDownload(secret, objectKey, expiresAtSec, token) {
  const want = await signDownload(secret, objectKey, expiresAtSec);
  if (typeof token !== 'string' || token.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i += 1) diff |= want.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}
