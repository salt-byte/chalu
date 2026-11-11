const TIER = {study:'研究',stat:'统计',analogy:'类比',assume:'假设',unverified:'未核实'};
const API = (window.CHALU_API || '').replace(/\/$/, '');
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const copyOf = o => JSON.parse(JSON.stringify(o));
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const G = {pack:null, orig:null, seed:1, L:{}, picks:{}, deck:new Set(), phase:'ready', bet:null, R:null, sound:true};

/* 声音：几个正弦短音，够用了 */
let AC = null;
function blip(f, d, v){ if(!G.sound) return; try{ AC = AC || new (window.AudioContext||window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain();
  o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(v||0.05, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+d); }catch(e){} }

function show(id){ document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id===id)); window.scrollTo(0,0); document.body.classList.toggle('at-title', id==='title' || id==='loading'); if(id==='title') Stage.idle(); Stage.resize && Stage.resize(); }
function status(msg, err){ $('status').textContent = msg; $('status').className = 'status'+(err?' err':''); }

/* ---------- 标题 ---------- */
function initTitle(){
  const P = PACKS, n = comboCount();
  $('combo').textContent = '常见的岔路。六个维度、每条路 '+n.per+' 种拼法，这套规则一共能拼出 '+n.pairs.toLocaleString('zh-CN')+' 种岔路。';
  $('pairs').innerHTML = COMMON_PAIRS.map((c,i) => '<button data-i="'+i+'">'+esc(c[0])+'</button>').join('') + '<button class="rand" id="rand">随机抽一个岔路</button>';
  $('pairs').querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const c = COMMON_PAIRS[+b.dataset.i]; blip(440,.12); openComposed(c[1], c[2], ''); });
  $('rand').onclick = () => { const r = () => { const o = {}; DIMS.forEach(d => o[d.id] = d.vals[Math.floor(Math.random()*d.vals.length)][0]); return o; }; blip(520,.12); openComposed(r(), r(), '这是随机抽出的一个岔路。'); };
  $('presets').innerHTML = P.map((b,i) => '<button data-i="'+i+'"><b>'+esc(b.title)+'</b><span class="small muted">'+esc(b.question)+'</span></button>').join('');
  $('presets').querySelectorAll('button').forEach(b => b.onclick = () => { blip(440,.12); G.attrs = null; brief(sanitize(P[+b.dataset.i])); });
  $('gen').onclick = generate;
}
function openComposed(a, b, note){ G.attrs = {A:Object.assign({}, a), B:Object.assign({}, b)}; brief(sanitize(compose(G.attrs.A, G.attrs.B)), note); }
function renderBuilder(){
  if(!G.attrs){ $('builder').innerHTML = ''; return; }
  const p = G.pack;
  $('builder').innerHTML = '<p class="small muted" style="margin-bottom:10px">这个岔路是拼出来的。不对的地方直接改，每改一处，规则会重新装配。</p><div class="builder">'+['A','B'].map(k =>
    '<div class="bcol '+k+'"><h3>'+esc(p.options[k].name)+'</h3>'+DIMS.map(d => { if(d.id==='pos' && !d.only.includes(G.attrs[k].dest)) return '';
      return '<div class="dim"><span>'+d.name+'</span><div class="opts">'+d.vals.map(([v,nm]) => '<button data-k="'+k+'" data-d="'+d.id+'" data-v="'+v+'" aria-pressed="'+((G.attrs[k][d.id]||DEF[d.id])===v)+'">'+nm+'</button>').join('')+'</div></div>'; }).join('')+'</div>').join('')+'</div>';
  $('builder').querySelectorAll('button[data-k]').forEach(b => b.onclick = () => { G.attrs[b.dataset.k][b.dataset.d] = b.dataset.v; blip(600,.05,.03);
    const y = window.scrollY; brief(sanitize(compose(G.attrs.A, G.attrs.B)), G.note); window.scrollTo(0, y); });
}
async function generate(){
  const q = $('q').value.trim(), key = $('key').value.trim();
  if(q.length < 4){ status('写一句你在哪两条路之间犹豫。', true); return; }
  if(!key && API){
    // 内置的模型：经由转发站调用 DeepSeek，失败就退回本地拼装
    blip(440,.12); show('loading');
    try{
      const res = await fetch(API, {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({q})});
      const data = await res.json().catch(() => ({}));
      if(!res.ok) throw new Error(data.error || ('转发站返回 '+res.status));
      const pack = sanitize(data.pack);
      if(pack.refuse){ show('title'); status(pack.refuse, true); return; }
      G.attrs = null; brief(pack); return;
    }catch(e){
      const d = parseDilemma(q); openComposed(d.A, d.B, '模型这次没拆成功（'+String(e.message||e).slice(0,40)+'），先用属性拼了一个，可以在下面改。'); return;
    }
  }
  if(!key){
    // 和八十亿分之一一样：不调用模型。从这句话里读出两条路的属性，规则自己装配
    const d = parseDilemma(q), hand = matchPack(q);
    const note = d.found ? '你写的是「'+q.slice(0,40)+(q.length>40?'…':'')+'」。下面是读出来的两条路。' : '这句话里没读出具体的路，先给你两条默认的，在下面改成你的情况。';
    blip(440,.12); openComposed(d.A, d.B, note + (hand ? ' 也有一个精修版的相近岔路：「'+hand.title+'」，可以回标题页挑。' : '')); return;
  }
  blip(440,.12); show('loading');
  try{
    const res = await fetch('https://api.deepseek.com/chat/completions', {method:'POST', headers:{'content-type':'application/json', authorization:'Bearer '+key},
      body: JSON.stringify({model:'deepseek-flash', max_tokens:7000, stream:false, response_format:{type:'json_object'}, messages:[{role:'system', content:'你只输出一个合法的 JSON 对象。'}, {role:'user', content: buildPrompt(q)}]})});
    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error('DeepSeek 返回 '+res.status+(data.error && data.error.message ? '（'+String(data.error.message).slice(0,50)+'）' : ''));
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    const a = text.indexOf('{'), b = text.lastIndexOf('}'); if(a < 0 || b <= a) throw new Error('模型没有按格式回答');
    const pack = sanitize(JSON.parse(text.slice(a, b+1)));
    if(pack.refuse){ show('title'); status(pack.refuse, true); return; }
    brief(pack);
  }catch(e){
    show('title'); const m = String(e.message||e);
    status('这次没拆成功：'+(/Failed to fetch|NetworkError|Load failed/.test(m) ? '浏览器没能连上 DeepSeek' : m.slice(0,80))+'。可以先走下面现成的。', true);
  }
}

/* ---------- 出发前 ---------- */
function brief(pack, note){
  G.pack = pack; G.orig = copyOf(pack); G.note = note || '';
  const rs = Object.values(pack.rules), n = t => rs.filter(r => r.tier===t).length;
  $('bq').textContent = pack.question; $('bA').textContent = pack.options.A.name; $('bB').textContent = pack.options.B.name;
  $('facts').innerHTML =
    '<dt>走多久</dt><dd>'+pack.years+' 年，两条路同时走</dd>'+
    '<dt>比什么</dt><dd>'+pack.meters.map(m => esc(m.name)).join('、')+'</dd>'+
    '<dt>规则</dt><dd>'+rs.length+' 条：'+(n('study')+n('stat'))+' 条带论文出处'+(n('unverified')?'，'+n('unverified')+' 条是模型提出、没有核实过的':'')+(n('analogy')?'，'+n('analogy')+' 条是类比':'')+(n('assume')?'，'+n('assume')+' 条是设定':'')+'</dd>'+
    '<dt>途中</dt><dd>'+(pack.choices.length ? '有 '+pack.choices.length+' 处要你自己拿主意' : '没有需要你拿主意的地方，只看事情怎么发生')+'</dd>';
  $('bcav').textContent = (note ? note+' ' : '') + (pack.composed ? '' : pack.builtin ? '这个难题是人工查证过的示例。' : '这个难题是模型根据你写的话现场拆的。') + (pack.caveat ? '最可能算错的地方：'+pack.caveat : '');
  renderBuilder();
  if(!$('brief').classList.contains('on')) show('brief');
}

/* ---------- 走 ---------- */
function crowd(){
  const p = G.pack, runs = {A: batch(p,'A',1000,90001), B: batch(p,'B',1000,90002)}, m0 = p.meters[0].id;
  let w = 0; for(let i=0;i<1000;i++){ const a = runs.A[i].final[m0], b = runs.B[i].final[m0]; w += a>b ? 1 : a===b ? 0.5 : 0; }
  const scale = {}; p.meters.forEach(m => { const all = runs.A.concat(runs.B).map(r => r.final[m.id]).sort((x,y)=>x-y); scale[m.id] = Math.max(quant(all,.97), m.start.A, m.start.B, 1); });
  const ends = runs.A.concat(runs.B).map(r => r.final[m0]).sort((x,y)=>x-y), st = p.meters[0].start;
  let lo = Math.min(quant(ends,.01), st.A, st.B), hi = Math.max(quant(ends,.985), st.A, st.B); const pad = (hi-lo)*0.08 || 5;
  G.R = {runs, winA: w/1000, sum:{A:summarize(p,runs.A), B:summarize(p,runs.B)}, scale, m0, range:{lo:lo-pad, hi:hi+pad}};
}
function startGame(){
  const p = G.pack; G.seed = (Date.now() % 2000000000) + Math.floor(Math.random()*1000);
  G.L = {A:newLife(p,'A',G.seed), B:newLife(p,'B',G.seed+17)}; G.picks = {}; G.deck = new Set(); G.bet = null; G.phase = 'ready';
  crowd();
  ['A','B'].forEach(k => { $('n'+k).textContent = p.options[k].name; $('f'+k).innerHTML = ''; meters(k, null); });
  $('pips').innerHTML = Array.from({length:p.years}, () => '<i></i>').join('');
  $('ytitle').textContent = '出发'; $('yhint').textContent = '两个你，同一天，走向不同的路。';
  setNext(); show('play');
  Stage.reset(p.years, G.R.range, {A:G.L.A.start[G.R.m0], B:G.L.B.start[G.R.m0]});
}
function meters(k, prev){
  const p = G.pack, L = G.L[k];
  $('m'+k).innerHTML = p.meters.map(m => { const v = Math.round(L.val[m.id]), d = prev ? v - prev[m.id] : 0;
    return '<span>'+esc(m.name)+'</span><span class="bar"><i style="width:'+clamp(v/G.R.scale[m.id]*100,2,100)+'%"></i></span><span class="num">'+v+' <span class="d '+(d>0?'up':d<0?'down':'')+'">'+(d>0?'+'+d:d<0?d:'')+'</span></span>'; }).join('');
}
function ruleLine(id){
  const r = id && G.pack.rules[id]; if(!r) return '';
  const link = r.url ? ' <a href="'+esc(r.url)+'" target="_blank" rel="noopener">出处</a>' : '';
  return '<div class="why"><span class="tier '+r.tier+'">'+TIER[r.tier]+'</span><b>'+esc(r.name)+'</b>'+(r.field?'（'+esc(r.field)+'）':'')+'：'+esc(r.says)+link+'</div>';
}
function setNext(){
  const p = G.pack, y = G.L.A.y, b = $('next');
  if(G.phase === 'asking'){ const need = allPending().length, got = Object.keys(G.picks).filter(id => allPending().some(x => x.c.id+x.k === id)).length;
    b.disabled = got < need; b.textContent = '过完第 '+(y+1)+' 年'; $('dockhint').textContent = got < need ? '两个你都在等你拿主意。' : ''; }
  else if(y >= p.years){ b.disabled = false; b.textContent = '走完了'; $('dockhint').textContent = ''; }
  else { b.disabled = false; b.textContent = y === 0 ? '进入第 1 年' : '进入第 '+(y+1)+' 年'; $('dockhint').textContent = ''; }
}
function allPending(){ return ['A','B'].flatMap(k => pending(G.L[k]).map(c => ({k,c}))); }
function onNext(){
  const p = G.pack, y = G.L.A.y;
  if(G.phase === 'ready' && y >= p.years){ toBet(); return; }
  if(G.phase === 'ready'){
    ['A','B'].forEach(k => $('f'+k).insertAdjacentHTML('beforeend', '<div class="yr" id="yr'+k+(y+1)+'">第 '+(y+1)+' 年</div>'));
    $('ytitle').textContent = '第 '+(y+1)+' 年'; $('yhint').textContent = '';
    const pend = allPending();
    if(pend.length){
      G.phase = 'asking'; blip(520,.18); pend.forEach(x => Stage.gate(x.k, true));
      pend.forEach(({k,c}) => { const key = c.id+k;
        $('f'+k).insertAdjacentHTML('beforeend', '<div class="card ask" id="ask'+key+'"><div>'+esc(c.prompt[k])+'</div><div class="row">'+c.options.map((o,i) => '<button data-i="'+i+'">'+esc(o.label)+'</button>').join('')+'</div></div>');
        $('ask'+key).querySelectorAll('button').forEach(btn => btn.onclick = () => { G.picks[key] = +btn.dataset.i; blip(600,.08);
          $('ask'+key).querySelector('.row').innerHTML = '<span class="picked">你选了：'+esc(c.options[+btn.dataset.i].label)+'</span>'; setNext(); }); });
      setNext(); pend.forEach(x => { const lane = $('f'+x.k).parentElement; lane.scrollTo && lane.scrollTo({top: lane.scrollHeight}); }); if(document.body.classList.contains('no3d') || innerWidth <= 820) $('yr'+pend[0].k+(y+1)).scrollIntoView({behavior: calm?'auto':'smooth', block:'start'}); return;
    }
  }
  resolve();
}
function resolve(){
  const p = G.pack; let tone = 0;
  ['A','B'].forEach(k => { const L = G.L[k], prev = {}; p.meters.forEach(m => prev[m.id] = Math.round(L.val[m.id]));
    const rec = stepYear(L, c => G.picks[c.id+k]);
    rec.ev.forEach(e => { const a = $('ask'+e.id+k); if(a) a.remove(); });
    const html = rec.ev.length ? rec.ev.map((e,i) => { if(e.rule) G.deck.add(e.rule); tone += e.tone==='up'?1:e.tone==='down'?-1:0;
        return '<div class="card '+e.tone+'" style="animation-delay:'+(i*0.18)+'s">'+(e.chosen?'<div class="picked">你选了：'+esc(e.chosen)+'</div>':'')+'<div>'+esc(e.text)+'</div>'+ruleLine(e.rule)+'</div>'; }).join('')
      : '<div class="card"><div class="muted">这一年没有大事发生。</div></div>';
    $('f'+k).insertAdjacentHTML('beforeend', html); meters(k, prev); Stage.step(k, rec.y, rec.val[G.R.m0], rec.ev); const lane = $('f'+k).parentElement; lane.scrollTo && lane.scrollTo({top: lane.scrollHeight, behavior: calm?'auto':'smooth'});
    if(L.y >= p.years){ const ana = Object.keys(p.rules).filter(id => p.rules[id].tier==='analogy'), pick = (p.closing && p.rules[p.closing[k]] && p.closing[k]) || ana[k==='A'?0:ana.length-1];
      if(pick){ G.deck.add(pick); $('f'+k).insertAdjacentHTML('beforeend', '<div class="card" style="animation-delay:.6s"><div class="muted small">走到这里，有句老话可以拿来看这条路。它不是证据。</div>'+ruleLine(pick)+'</div>'); } } });
  blip(tone > 0 ? 660 : tone < 0 ? 196 : 330, .35, .06);
  G.phase = 'ready'; const y = G.L.A.y; $('pips').querySelectorAll('i').forEach((el,i) => el.classList.toggle('done', i < y));
  setNext();
  if(document.body.classList.contains('no3d') || innerWidth <= 820){ const anchor = $('yrA'+y); if(anchor) anchor.scrollIntoView({behavior: calm?'auto':'smooth', block:'start'}); }
}

/* ---------- 下注 ---------- */
function mine(k){ return Math.round(G.L[k].val[G.R.m0]); }
function toBet(){
  const p = G.pack, m = p.meters[0];
  $('betq').innerHTML = p.years+' 年过去了。<span class="A">'+esc(p.options.A.name)+'</span>的你，'+esc(m.name)+'是 <span class="num">'+mine('A')+'</span>；<span class="B">'+esc(p.options.B.name)+'</span>的你，是 <span class="num">'+mine('B')+'</span>。';
  $('betA').textContent = p.options.A.name; $('betB').textContent = p.options.B.name;
  show('bet'); blip(392,.5,.05);
}

/* ---------- 揭晓 ---------- */
function reveal(bet){
  G.bet = bet; show('reveal'); renderReveal(true);
}
function renderReveal(animate){
  const p = G.pack, R = G.R, m = p.meters[0], nm = k => '「'+esc(p.options[k].name)+'」';
  const a = mine('A'), b = mine('B'), saw = a>b ? 'A' : b>a ? 'B' : null, maj = R.winA >= 0.5 ? 'A' : 'B';
  const share = Math.round((maj==='A' ? R.winA : 1-R.winA)*100), flip = 100 - share;
  $('rv1').innerHTML = saw ? '你走的这一遍里，<span class="'+saw+'">'+nm(saw)+'</span>更高。<br>可这只是一遍。下面是两千遍。' : '你走的这一遍里，两条路打平了。<br>下面是两千遍。';
  $('key').innerHTML = '<span><i style="background:var(--a)"></i>'+esc(p.options.A.name)+'的一千个你</span><span><i style="background:var(--b)"></i>'+esc(p.options.B.name)+'的一千个你</span><span><i style="background:var(--ink);height:4px"></i>粗线：你刚走过的那两条</span><span>纵轴：'+esc(m.name)+(m.note?'（'+esc(m.note)+'）':'')+'</span>';
  $('stats').innerHTML =
    '<div class="tile"><b>'+share+'%</b><span>同一天出发的一千对你里，'+nm(maj)+'的'+esc(m.name)+'更高的比例</span></div>'+
    '<div class="tile"><b>'+flip+'%</b><span>只走一遍就下结论，结论和上面相反的概率</span></div>'+
    p.meters.map(mm => '<div class="tile" style="border-top-width:1px"><span class="muted small">'+esc(mm.name)+'的中位数（一成到九成）</span><span class="num"><span style="color:var(--a)">'+R.sum.A.meters[mm.id].p50+'（'+R.sum.A.meters[mm.id].p10+'–'+R.sum.A.meters[mm.id].p90+'）</span>　<span style="color:var(--b)">'+R.sum.B.meters[mm.id].p50+'（'+R.sum.B.meters[mm.id].p10+'–'+R.sum.B.meters[mm.id].p90+'）</span></span></div>').join('');
  let v;
  if(!G.bet) v = '你说说不准。手里只有一个样本的时候，这是最准确的回答。';
  else if(G.bet === maj) v = '你押了'+nm(G.bet)+'。一千遍里它确实赢得多。<br>但你是凭一遍押的，而一遍有 <em>'+flip+'%</em> 的可能指向另一边。';
  else v = '你押了'+nm(G.bet)+'。一千遍里，赢得多的是'+nm(maj)+'。<br>'+(saw===G.bet ? '你亲身走过的那一遍，恰好是少数的那 <em>'+flip+'%</em>。' : '');
  $('rv2').innerHTML = v;
  const ob = LIB.outcome;
  $('ob').innerHTML = '<div class="card"><div class="why" style="font-size:14.5px"><span class="tier study">研究</span><b>'+ob.name+'</b>（'+ob.field+'）：'+ob.says+' <a href="'+ob.url+'" target="_blank" rel="noopener">出处</a></div><div class="small muted">现实里每个人只走一遍。所以「我当年选对了」和「我当年选错了」，多半说的都是结果，不是选择。</div></div>';
  $('deck').innerHTML = Object.keys(p.rules).map(id => { const r = p.rules[id];
    return '<div class="law '+(G.deck.has(id)?'':'miss')+'"><div><span class="tier '+r.tier+'">'+TIER[r.tier]+'</span><span class="f">'+esc(r.field)+'</span></div><h3>'+esc(r.name)+'</h3><div>'+esc(r.says)+'</div>'+
      (r.url?'<a class="small" href="'+esc(r.url)+'" target="_blank" rel="noopener">'+esc(r.src)+'</a>':'<span class="small muted">'+esc(r.src)+'</span>')+'</div>'; }).join('');
  $('cav').textContent = p.caveat ? '这次模拟最可能算错的地方：'+p.caveat : '';
  if(animate) renderKnobs();
  draw(animate && !calm);
  const tj = r => [r.start[R.m0]].concat(r.years.map(y => y.val[R.m0]));
  Stage.reveal(R.runs.A.slice(0,320).map(tj), R.runs.B.slice(0,320).map(tj), animate);
}
function renderKnobs(){
  const p = G.pack, ks = p.events.filter(e => e.knob).slice(0,4), list = ks.length ? ks : p.events.slice(0,3);
  $('knobs').innerHTML = list.map(e => '<div class="knob"><div><span class="tier assume">假设</span>每年「'+esc(e.label || e.text.A || e.text.B)+'」的概率</div><div class="knobpair">'+
    ['A','B'].map(k => '<div><label for="k'+e.id+k+'"><span>'+esc(p.options[k].name)+'</span><span class="num" id="v'+e.id+k+'">'+Math.round(e.p[k]*100)+'%</span></label><input class="k'+k.toLowerCase()+'" type="range" id="k'+e.id+k+'" min="0" max="0.8" step="0.01" value="'+e.p[k]+'"></div>').join('')+'</div></div>').join('')+
    '<button id="kreset">恢复原来的设定</button>';
  list.forEach(e => ['A','B'].forEach(k => $('k'+e.id+k).addEventListener('input', ev => { e.p[k] = parseFloat(ev.target.value); $('v'+e.id+k).textContent = Math.round(e.p[k]*100)+'%'; crowd(); renderReveal(false); })));
  $('kreset').onclick = () => { const o = copyOf(G.orig); G.pack.events.forEach((e,i) => e.p = o.events[i].p); crowd(); renderReveal(false); renderKnobs(); };
}
let raf = 0;
function draw(animate){
  cancelAnimationFrame(raf);
  const cv = $('cv'), c = cv.getContext('2d'), W = cv.width, H = cv.height, p = G.pack, R = G.R, m0 = R.m0, N = p.years;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const col = {A:css('--a'), B:css('--b'), ink:css('--ink'), muted:css('--muted'), line:css('--line')};
  const traj = r => [r.start[m0]].concat(r.years.map(y => y.val[m0]));
  const crowdT = {A:R.runs.A.slice(0,350).map(traj), B:R.runs.B.slice(0,350).map(traj)};
  const me = {A:[G.L.A.start[m0]].concat(G.L.A.years.map(y => y.val[m0])), B:[G.L.B.start[m0]].concat(G.L.B.years.map(y => y.val[m0]))};
  const ends = R.runs.A.concat(R.runs.B).map(r => r.final[m0]).sort((a,b)=>a-b);
  let lo = Math.min(quant(ends,.01), ...me.A, ...me.B, p.meters[0].start.A, p.meters[0].start.B), hi = Math.max(quant(ends,.985), ...me.A, ...me.B);
  const pad = (hi-lo)*0.08 || 5; lo -= pad; hi += pad;
  const L = 56, Rr = 24, T = 20, B = 38, X = i => L + i/N*(W-L-Rr), Y = v => H - B - (clamp(v,lo,hi)-lo)/(hi-lo)*(H-T-B);
  const path = (t, upto) => { c.beginPath(); const n = Math.min(t.length-1, upto); for(let i=0;i<=Math.floor(n);i++) i ? c.lineTo(X(i),Y(t[i])) : c.moveTo(X(i),Y(t[i]));
    const f = n - Math.floor(n); if(f > 0 && Math.floor(n)+1 < t.length){ const i = Math.floor(n); c.lineTo(X(i+f), Y(t[i]+(t[i+1]-t[i])*f)); } c.stroke(); };
  function frame(t){
    c.clearRect(0,0,W,H); c.font = '13px "IBM Plex Mono", monospace'; c.textBaseline = 'middle';
    c.strokeStyle = col.line; c.fillStyle = col.muted; c.lineWidth = 1; c.globalAlpha = 1;
    for(let g=0; g<=4; g++){ const v = lo + (hi-lo)*g/4, y = Y(v); c.beginPath(); c.moveTo(L,y); c.lineTo(W-Rr,y); c.stroke(); c.textAlign = 'right'; c.fillText(Math.round(v), L-8, y); }
    c.textAlign = 'center'; for(let i=0;i<=N;i++) c.fillText(i===0?'出发':'第'+i+'年', X(i), H-16);
    const k = Math.min(1, Math.max(0, (t-0.35)/0.65)), shown = Math.floor(k*350);
    c.lineWidth = 1; c.globalAlpha = 0.085;
    ['A','B'].forEach(s => { c.strokeStyle = col[s]; for(let i=0;i<shown;i++) path(crowdT[s][i], N); });
    c.globalAlpha = 1; const upto = Math.min(N, t/0.35*N);
    ['A','B'].forEach(s => { c.strokeStyle = col.ink; c.lineWidth = 6; path(me[s], upto); c.strokeStyle = col[s]; c.lineWidth = 3; path(me[s], upto);
      if(upto >= N){ c.fillStyle = col[s]; c.beginPath(); c.arc(X(N), Y(me[s][N]), 6, 0, 7); c.fill(); c.strokeStyle = col.ink; c.lineWidth = 2; c.stroke(); } });
  }
  if(!animate){ frame(1); return; }
  const t0 = performance.now(), dur = 4200; let last = -1;
  (function tick(now){ const t = Math.min(1, (now-t0)/dur); frame(t); const s = Math.floor(t*8); if(s !== last && t > 0.35){ last = s; blip(220 + s*40, .12, .025); }
    if(t < 1) raf = requestAnimationFrame(tick); else blip(523,.6,.05); })(t0);
}
function copyText(){
  const p = G.pack, R = G.R, maj = R.winA >= 0.5 ? 'A' : 'B', share = Math.round((maj==='A'?R.winA:1-R.winA)*100), m = p.meters[0];
  const t = '《岔路》'+p.title+'\n我把两条路各走了一遍：'+p.options.A.name+' '+m.name+' '+mine('A')+'，'+p.options.B.name+' '+mine('B')+'。\n同样的规则跑一千遍，「'+p.options[maj].name+'」更高的有 '+share+'%。只走一遍就下结论，有 '+(100-share)+'% 的概率看反。';
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => $('copied').textContent = '已复制。', () => $('copied').textContent = '复制没成功，可以手动截屏。');
}

Stage.init($('stage')); initTitle(); document.body.classList.add('at-title'); Stage.idle();
$('depart').onclick = () => { blip(330,.2); startGame(); };
$('back1').onclick = () => show('title');
$('next').onclick = onNext;
$('betA').onclick = () => reveal('A'); $('betB').onclick = () => reveal('B'); $('betN').onclick = () => reveal(null);
$('again').onclick = () => { G.pack = copyOf(G.orig); startGame(); };
$('newq').onclick = () => show('title');
$('copy').onclick = copyText;
$('snd').onclick = () => { G.sound = !G.sound; $('snd').textContent = '声音：'+(G.sound?'开':'关'); $('snd').setAttribute('aria-pressed', G.sound); };
