/**
 * POST /api/apply · 收内测申请（Alpha 期不发信）。
 *
 * 做三件事，一件不多：收表单 → 白名单清洗 → 写 KV（180 天 TTL）。
 *
 * **不发邮件**。Cloudflare 自身只能收信不能发信，要发就得挂一个外部邮件 API，
 * 那会在申请这条唯一入口上加四个新故障点（账号、密钥、域名验证、送达率）。
 * 邀请邮件本来就是人工发的，自动通知只省掉「每天看一眼」这一个动作。
 * 我们直接在 Cloudflare 控制台看 APPLICATIONS 这个 KV 即可。
 *
 * Turnstile 校验**不过也不拒**：只在记录上标一笔。人工审核才是真正的闸门，
 * 而把一个真人因为反滥用组件没加载出来挡在门外，代价比收几条垃圾申请大得多。
 */
import { clientIp, pick, rateLimited, reply, sha256Hex } from './_lib.js';

const FIELDS = {
  q1_agents: { multi: true, max: 12 }, q1_other: {}, q1_concurrent: {},
  q2_form: { multi: true, max: 6 },
  q3_os: {}, q3_other: {},
  q4_pain: {}, q4_other: {},
  q5_wish: { max: 600 },
  q6_pricing: {}, q7_join: {}, q8_interview: {},
  q9_email: { max: 160 }, q9_region: { max: 80 },
  agree: {},
};

const MAX_BODY = 8 * 1024;
const TTL_180_DAYS = 180 * 24 * 3600;

const isEmail = (s) => typeof s === 'string' && /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(s);

async function checkTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return 'not-configured';
  if (!token) return 'missing';
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const j = await r.json();
    return j.success === true ? 'ok' : 'failed';
  } catch {
    return 'unreachable';
  }
}

export async function onRequestPost({ request, env }) {
  const ip = clientIp(request);
  if (await rateLimited(env, 'apply', ip, 3, 600)) {
    return reply(request, 429, { ok: false, error: '提交太频繁了，请过十分钟再试。' },
      '<p>提交太频繁了，请过十分钟再试。<br>Too many submissions — please try again in ten minutes.</p>');
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) {
    return reply(request, 413, { ok: false, error: '内容太长了。' }, '<p>内容太长了。/ Payload too large.</p>');
  }
  const form = new URLSearchParams(raw);

  // honeypot：机器人填了就当作收下了（回 200），但一个字节都不存。
  // 回 200 是刻意的——告诉对方"被识破了"等于免费送他一次调参机会。
  if (form.get('website')) {
    return reply(request, 200, { ok: true }, '<p>已收到，审核后邮件通知。</p>');
  }

  const data = pick(form, FIELDS);
  if (!isEmail(data.q9_email)) {
    return reply(request, 400, { ok: false, error: '邮箱看起来不对，请再检查一下。' },
      '<p>邮箱看起来不对，请再检查一下。<br>That email address does not look right.</p>');
  }
  if (data.agree !== '1') {
    return reply(request, 400, { ok: false, error: '需要先同意内测协议与安全隐私声明。' },
      '<p>需要先同意内测协议与安全隐私声明。<br>You need to accept the Beta Agreement first.</p>');
  }

  const record = {
    v: 1,
    at: new Date().toISOString(),
    lang: (request.headers.get('Referer') || '').includes('/en/') ? 'en' : 'zh',
    ua: (request.headers.get('User-Agent') || '').slice(0, 200),
    country: request.headers.get('CF-IPCountry') || null,
    // 明文 IP 不入库（隐私声明第七节）；留哈希只为查"同一个人投了多少次"
    ipHash: (await sha256Hex(`${ip}|${env.RL_SALT || 'conexuai'}`)).slice(0, 16),
    turnstile: await checkTurnstile(env, form.get('cf-turnstile-response'), ip),
    answers: data,
  };

  if (!env.APPLICATIONS) {
    // KV 没绑就如实说收不了，**不假装收到了**——那会让申请人以为自己已经报上名。
    return reply(request, 503, { ok: false, error: '表单后端还没配置好，请稍后再试。' },
      '<p>表单后端还没配置好，请稍后再试。<br>The form backend is not configured yet.</p>');
  }
  const key = `apply:${record.at}:${crypto.randomUUID()}`;
  await env.APPLICATIONS.put(key, JSON.stringify(record), { expirationTtl: TTL_180_DAYS });

  return reply(request, 200, { ok: true },
    '<p>已收到，审核后邮件通知。<br>Received — we will email you after review.</p>');
}

/** GET 到这个地址的是人走错了路，不是接口被调用，指回申请页即可。 */
export const onRequestGet = () => Response.redirect('/apply/', 302);
