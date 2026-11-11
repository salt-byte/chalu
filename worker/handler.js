// Cloudflare Worker：网页把难题发到这里，这里带上密钥去问模型。密钥只存在 Cloudflare 的环境变量里。
// 两家都走 OpenAI 兼容接口：
//   DeepSeek 官方：DEEPSEEK_API_KEY=sk-...，模型默认 deepseek-flash
//   火山方舟：ARK_API_KEY=ark-...（放在 DEEPSEEK_API_KEY 里也认），并必须设 CHALU_MODEL 为方舟的模型名或接入点 ID（ep-...）
// CHALU_BASE_URL 可以把接口地址改成任何 OpenAI 兼容的服务。
const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3', DS_BASE = 'https://api.deepseek.com';
function cleanKey(v){ return String(v || '').trim().replace(/^bearer\s+/i, '').replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim(); }
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
    const KEY = cleanKey(env.ARK_API_KEY) || cleanKey(env.DEEPSEEK_API_KEY);
    if(!KEY) return reply(503, { error: '转发站还没有配置密钥' }, origin);
    const ark = !!cleanKey(env.ARK_API_KEY) || /^ark/i.test(KEY);
    const BASE = (String(env.CHALU_BASE_URL || '').trim() || (ark ? ARK_BASE : DS_BASE)).replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    const MODEL = String(env.CHALU_MODEL || '').trim() || (ark ? '' : 'deepseek-flash');
    const WHO = ark ? '火山方舟' : 'DeepSeek';
    if(!MODEL) return reply(503, { error: '用火山方舟的密钥时，要在转发站设置 CHALU_MODEL（方舟的模型名或 ep- 开头的接入点 ID）' }, origin);
    const ip = req.headers.get('cf-connecting-ip') || 'x', now = Date.now(), d = new Date().toISOString().slice(0, 10);
    if(day.d !== d) day = { d, n: 0 };
    if(day.n >= PER_DAY) return reply(429, { error: '今天拆的题已经到上限了，先玩内置的岔路' }, origin);
    const list = (hits.get(ip) || []).filter(t => now - t < 3600e3);
    if(list.length >= PER_IP_HOUR) return reply(429, { error: '你这一小时拆得有点多，歇一会儿再来' }, origin);
    list.push(now); hits.set(ip, list); day.n++;
    let q = ''; try{ q = String((await req.json()).q || '').trim().slice(0, 600); }catch(e){}
    if(q.length < 4) return reply(400, { error: '难题写得太短了' }, origin);
    try{
      // 流式接收：整段等回答容易超过 100 秒被掐断。方舟的思考型模型先关掉深度思考，拆题用不上，还慢好几倍。
      const ask = extras => fetch(BASE + '/chat/completions', { method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + KEY },
        body: JSON.stringify(Object.assign({ model: MODEL, max_tokens: 7000, stream: true,
          messages: [{ role: 'system', content: '你只输出一个合法的 JSON 对象。' }, { role: 'user', content: buildPrompt(q) }] },
          extras ? Object.assign({ response_format: { type: 'json_object' } }, ark && env.CHALU_THINKING !== 'on' ? { thinking: { type: 'disabled' } } : {}) : {})) });
      let r = await ask(true);
      if(r.status === 400) r = await ask(false);   // 有些模型不认 response_format 或 thinking，去掉再问一次
      if(!r.ok){
        const data = await r.json().catch(() => ({}));
        const why = data && data.error && (data.error.message || data.error.code) ? '（' + String(data.error.message || data.error.code).slice(0, 80) + '）' : '';
        return reply(502, { error: WHO + ' 返回 ' + r.status + (r.status === 401 ? '：密钥无效（长度 ' + KEY.length + '，开头 ' + KEY.slice(0, 3) + '）' : why) }, origin);
      }
      let text = '';
      const pick = d => { const c = d && d.choices && d.choices[0]; return c ? ((c.delta && c.delta.content) || (c.message && c.message.content) || '') : ''; };
      if(/event-stream/i.test(r.headers.get('content-type') || '')){
        const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
        for(;;){
          const { done, value } = await rd.read();
          buf += done ? dec.decode() : dec.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = done ? '' : lines.pop();
          for(const ln of lines){ const m = /^data:\s*(.*)$/.exec(ln.trim()); if(!m || m[1] === '[DONE]') continue; try{ text += pick(JSON.parse(m[1])); }catch(e){} }
          if(done) break;
        }
      } else text = pick(await r.json().catch(() => ({})));
      const a = text.indexOf('{'), b = text.lastIndexOf('}');
      if(a < 0 || b <= a) return reply(502, { error: '模型没有按格式回答' }, origin);
      return reply(200, { pack: JSON.parse(text.slice(a, b + 1)) }, origin);
    }catch(e){ return reply(502, { error: '调用模型失败' }, origin); }
  }
};
