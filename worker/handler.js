// Cloudflare Worker：网页把难题发到这里，这里带上密钥去问 DeepSeek。密钥只存在 Cloudflare 的环境变量 DEEPSEEK_API_KEY 里。
const ALLOW = ['https://salt-byte.github.io', 'http://localhost:3999', 'http://localhost:3000', 'null'];
const PER_IP_HOUR = 6, PER_DAY = 300;           // 防刷：每个访客每小时 6 次，每个实例每天 300 次
const hits = new Map(); let day = { d: '', n: 0 };
function cors(origin){ const o = ALLOW.includes(origin) ? origin : ALLOW[0];
  return { 'access-control-allow-origin': o, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'vary': 'origin' }; }
function reply(code, obj, origin){ return new Response(JSON.stringify(obj), { status: code, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, cors(origin)) }); }
export default {
  async fetch(req, env){
    const origin = req.headers.get('origin') || '';
    if(req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    if(req.method !== 'POST') return reply(405, { error: '只接受 POST' }, origin);
    if(!ALLOW.includes(origin)) return reply(403, { error: '这个转发站只服务《岔路》的网页' }, origin);
    if(!env.DEEPSEEK_API_KEY) return reply(503, { error: '转发站还没有配置密钥' }, origin);
    const ip = req.headers.get('cf-connecting-ip') || 'x', now = Date.now(), d = new Date().toISOString().slice(0, 10);
    if(day.d !== d) day = { d, n: 0 };
    if(day.n >= PER_DAY) return reply(429, { error: '今天拆的题已经到上限了，先玩内置的岔路' }, origin);
    const list = (hits.get(ip) || []).filter(t => now - t < 3600e3);
    if(list.length >= PER_IP_HOUR) return reply(429, { error: '你这一小时拆得有点多，歇一会儿再来' }, origin);
    list.push(now); hits.set(ip, list); day.n++;
    let q = ''; try{ q = String((await req.json()).q || '').trim().slice(0, 600); }catch(e){}
    if(q.length < 4) return reply(400, { error: '难题写得太短了' }, origin);
    try{
      const r = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.DEEPSEEK_API_KEY },
        body: JSON.stringify({ model: env.CHALU_MODEL || 'deepseek-flash', max_tokens: 7000, stream: false, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: '你只输出一个合法的 JSON 对象。' }, { role: 'user', content: buildPrompt(q) }] }) });
      const data = await r.json();
      if(!r.ok) return reply(502, { error: 'DeepSeek 返回 ' + r.status }, origin);
      const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
      const a = text.indexOf('{'), b = text.lastIndexOf('}');
      if(a < 0 || b <= a) return reply(502, { error: '模型没有按格式回答' }, origin);
      return reply(200, { pack: JSON.parse(text.slice(a, b + 1)) }, origin);
    }catch(e){ return reply(502, { error: '调用模型失败' }, origin); }
  }
};
