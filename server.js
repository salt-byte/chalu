// 《岔路》服务端：发静态页面，并代用户向 Claude 要一个「岔路包」。
// 密钥只从环境变量 ANTHROPIC_API_KEY 读，永远不进前端、不进仓库。
const http = require('http'), fs = require('fs'), path = require('path');
const { buildPrompt } = require('./src/prompt.js');

const PORT = process.env.PORT || 3000;
// 模型供应方：默认 DeepSeek（接口与 OpenAI 兼容）。设 CHALU_PROVIDER=anthropic 可换成 Claude。
const PROVIDER = (process.env.CHALU_PROVIDER || (process.env.DEEPSEEK_API_KEY ? 'deepseek' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'deepseek')).toLowerCase();
const KEY = PROVIDER === 'anthropic' ? (process.env.ANTHROPIC_API_KEY || '') : (process.env.DEEPSEEK_API_KEY || '');
const MODEL = process.env.CHALU_MODEL || (PROVIDER === 'anthropic' ? 'claude-sonnet-5-5' : 'deepseek-flash');
const DS_BASE = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const PER_IP_HOUR = Number(process.env.CHALU_PER_IP_HOUR || 6);     // 每个访客每小时最多拆几题
const PER_DAY = Number(process.env.CHALU_PER_DAY || 300);           // 全站每天上限，保护账单
const DIST = path.join(__dirname, 'dist');

const hits = new Map(); let day = { d: '', n: 0 };
function allowed(ip){
  const now = Date.now(), d = new Date().toISOString().slice(0, 10);
  if (day.d !== d) day = { d, n: 0 };
  if (day.n >= PER_DAY) return '今天拆的题已经到上限了，明天再来，或者先走现成的难题';
  const list = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  if (list.length >= PER_IP_HOUR) return '你这一小时拆得有点多，歇一会儿再来';
  list.push(now); hits.set(ip, list); day.n++; return '';
}
function send(res, code, obj){ res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }

async function makePack(q){
  let text = '';
  if (PROVIDER === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: AbortSignal.timeout(110000),
      headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 7000, messages: [{ role: 'user', content: buildPrompt(q) }] })
    });
    const data = await r.json();
    if (!r.ok) throw new Error('模型服务返回 ' + r.status + (data && data.error && data.error.type ? '（' + data.error.type + '）' : ''));
    text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  } else {
    const r = await fetch(DS_BASE + '/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(110000),
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + KEY },
      body: JSON.stringify({ model: MODEL, max_tokens: 7000, stream: false, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: '你只输出一个合法的 JSON 对象。' }, { role: 'user', content: buildPrompt(q) }] })
    });
    const data = await r.json();
    if (!r.ok) throw new Error('模型服务返回 ' + r.status + (data && data.error && data.error.message ? '（' + String(data.error.message).slice(0, 60) + '）' : ''));
    text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  }
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('模型没有按格式回答');
  return JSON.parse(text.slice(a, b + 1));
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/healthz') return send(res, 200, { ok: true, provider: PROVIDER, model: MODEL, key: !!KEY });
    if (req.method === 'POST' && req.url === '/api/pack') {
      if (!KEY) return send(res, 503, { error: '服务端还没有配置模型密钥' });
      let body = ''; for await (const c of req) { body += c; if (body.length > 4000) return send(res, 413, { error: '写得太长了，精简到 600 字以内' }); }
      let q = ''; try { q = String(JSON.parse(body).q || '').trim().slice(0, 600); } catch (e) {}
      if (q.length < 8) return send(res, 400, { error: '难题写得太短了' });
      const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const no = allowed(ip); if (no) return send(res, 429, { error: no });
      return send(res, 200, { pack: await makePack(q) });
    }
    if (req.method !== 'GET') return send(res, 405, { error: 'method not allowed' });
    let f = path.normalize(decodeURIComponent(req.url.split('?')[0])); if (f === '/' || f === '\\') f = '/index.html';
    const file = path.join(DIST, f);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
  } catch (e) { send(res, 500, { error: String(e.message || e).slice(0, 120) }); }
}).listen(process.env.CHALU_NO_LISTEN ? 0 : PORT, () => console.log('岔路 listening on ' + PORT + (KEY ? '' : '（未配置模型密钥，只能玩现成难题）')));
module.exports = { buildPrompt };
