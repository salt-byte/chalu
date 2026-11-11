// 《岔路》v0.2 通用引擎：吃一个「岔路包」（JSON），吐分布和单次人生。
// 页面、测试、以及运行时由模型生成的包，都走这一份代码。
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function ab(v,path){ return (v && typeof v==='object') ? Number(v[path]) : Number(v); }

// 已核实的规律库。运行时模型只能引用这里的 id；库外的规律一律标「未核实」。
const LIB = {
  firmsize:{name:'首份工作的公司规模',field:'劳动经济学',says:'第一份工作在大公司的人，长期结果持续更好，换了工作之后仍然如此。机制可能是大公司的技能培养更好。',src:'Arellano-Bover，Journal of Labor Economics，西班牙行政数据',url:'https://consensus.app/papers/details/w:c54e0be4-f945-488d-a6ae-6b4b08d5c161/?utm_source=claude_desktop'},
  brand:{name:'前东家的名片',field:'管理学',says:'地位高的雇主早期不必付足薪水，但员工积累经验后薪水涨得更快，因为这段经历本身是能力的信号。',src:'Bidwell 等，Strategic Management Journal，投行从业者调查',url:'https://consensus.app/papers/details/w:2dae0abd-28ec-4119-a57a-7206bc98fe62/?utm_source=claude_desktop'},
  task:{name:'早期任务的难度',field:'组织行为学',says:'一家高科技公司把新人随机分到不同项目。被分到复杂项目的人学得更多、更容易被看见，之后晋升更快、回报更高。',src:'Li、Krackhardt、Niezink，Academy of Management Journal，2025',url:'https://consensus.app/papers/details/w:0437328d-f261-4d48-8029-cbbdd661d861/?utm_source=claude_desktop'},
  boss:{name:'第一位主管',field:'社会学',says:'入职时被分到有权力的主管手下的人，更容易拿到能建立名声的工作，留任和绩效薪酬都更好。',src:'Briscoe、Kellogg，American Sociological Review，一家大型律所的人事数据',url:'https://consensus.app/papers/details/w:44cc6f72-b95b-4f73-b7b0-c811b0fc2706/?utm_source=claude_desktop'},
  weakties:{name:'弱关系',field:'社会学',says:'领英在两千万用户身上做的随机实验：不太熟的人比熟人更能带来新工作，在数字化行业尤其如此。',src:'Rajkumar 等，Science，2022',url:'https://consensus.app/papers/details/w:572478a9-b20d-4521-9a80-3f8f40cafcdc/?utm_source=claude_desktop'},
  noncore:{name:'非核心业务先被剥离',field:'战略管理',says:'对 35 项研究的汇总：公司剥离业务，主要由业务单元表现弱、公司规模大、业务多元化驱动。',src:'Kolev，British Journal of Management，元分析',url:'https://consensus.app/papers/details/w:26baea6a-168c-47ed-ade3-5b7b8eef7b1a/?utm_source=claude_desktop'},
  scar:{name:'失业的伤疤',field:'劳动经济学',says:'被裁者六年后收入仍比预期低约 9%。但损失主要落在失业时间长的人身上，很快找到工作的人平均没有损失。',src:'Stevens 1997；Fallick 等 2025',url:'https://consensus.app/papers/details/w:d231e370-4b0b-47af-96ac-bf085c5afc05/?utm_source=claude_desktop'},
  startup:{name:'早期员工的收入',field:'组织研究',says:'丹麦登记数据：被初创公司雇用的人，之后十年比被成熟大公司雇用的人少挣约 17%，其中一半来自人本身的差异。',src:'Sorenson 等，Organization Science，2021',url:'https://consensus.app/papers/details/w:975753a6-ba75-4621-ae75-ba69efcd43f6/?utm_source=claude_desktop'},
  entry:{name:'入场时的行情',field:'劳动经济学',says:'在不景气时进入就业市场的人，起初收入明显偏低，这个差距要十到十五年才逐渐消失。',src:'von Wachter，Journal of Economic Perspectives，综述',url:'https://consensus.app/papers/details/w:87f2c037-c9be-4d95-aee0-fc45822b9711/?utm_source=claude_desktop'},
  junior:{name:'初级岗位在收缩',field:'统计',tier:'stat',says:'斯坦福的研究显示，到 2025 年 9 月，22 到 25 岁软件开发者的就业比 2022 年底的峰值低了近两成。',src:'《Canaries in the Coal Mine?》，转引自腾讯新闻深氪报道',url:'https://news.qq.com/rain/a/20260706A03UBI00'},
  coin:{name:'抛硬币实验',field:'行为经济学',says:'让拿不定主意的人抛硬币决定。在辞职、分手这类大事上，做出改变的人半年后明显更快乐。人在重大选择面前可能过于谨慎。',src:'Levitt，NBER 工作论文，大规模随机实地实验',url:'https://consensus.app/papers/details/w:3af4d38d-c565-4eeb-8996-911187c6170b/?utm_source=claude_desktop'},
  regret:{name:'后悔的时间规律',field:'社会心理学',says:'短期内，人更后悔做错的事；长期看，人更后悔没做的事。后来的重复实验支持这个规律，但效应比原研究弱。',src:'Gilovich、Medvec，Psychological Review，1995',url:'https://consensus.app/papers/details/w:8f4c866e-691a-48ff-96ba-af5d03017571/?utm_source=claude_desktop'},
  impact:{name:'影响力偏差',field:'社会心理学',says:'人会高估未来某件事对自己情绪的影响有多强、持续多久，对坏事尤其如此。恢复得比自己预想的快。',src:'Wilson、Gilbert，Current Directions in Psychological Science，2005',url:'https://consensus.app/papers/details/w:17e1d14e-070a-438f-9f61-ee9d622c4547/?utm_source=claude_desktop'},
  outcome:{name:'结果偏差',field:'决策心理学',says:'同一个决定，结果好的时候人们就说它想得周全，结果坏就说它欠考虑，哪怕明知决定时的信息完全一样。',src:'Baron、Hershey，Journal of Personality and Social Psychology，1988',url:'https://consensus.app/papers/details/w:69e7da8f-1ed7-4e5f-a605-39c563342090/?utm_source=claude_desktop'},
  commute:{name:'通勤悖论',field:'经济学',says:'按经济学的推论，长通勤应该被更高的工资或更便宜的房子补偿回来。德国的追踪数据显示补不回来：通勤越久的人，生活满意度系统性地更低。',src:'Stutzer、Frey，Scandinavian Journal of Economics，2008',url:'https://consensus.app/papers/details/w:60bd113d-de30-4a22-a444-631ec67641a4/?utm_source=claude_desktop'},
  gradmh:{name:'博士生的心理负担',field:'公共卫生',says:'美国八所顶尖经济学博士项目里，约四分之一的学生有中度以上的抑郁或焦虑症状，是普通人群的两倍多，读到六年级以上升到三分之一以上。',src:'Bolotnyy 等，Journal of Economic Literature，2022',url:'https://consensus.app/papers/details/w:2207a179-a461-4f02-9a63-0caed4942350/?utm_source=claude_desktop'},
  public:{name:'体制内的满意度',field:'公共管理',says:'欧洲 19 国的调查：公共部门员工的工作满意度高于私营部门，在「担心丢工作」的人越多的国家，这个差距越大。',src:'Fernández Puente、Sánchez-Sánchez，SAGE Open，2021',url:'https://consensus.app/papers/details/w:496b9423-5f41-426a-b26a-398dc23ff533/?utm_source=claude_desktop'},
  ldr:{name:'异地恋的理想化',field:'传播学',says:'异地的情侣比同城的更稳定，因为见得少，彼此被理想化了。但一旦搬到一起，分手的反而更多；分开越久、理想化越重的，搬到一起后越不稳。',src:'Stafford、Merolla，Journal of Social and Personal Relationships，2007',url:'https://consensus.app/papers/details/w:e4499105-e68d-49e0-89f1-64aa97158889/?utm_source=claude_desktop'},
  bflp:{name:'大鱼小池塘',field:'教育心理学',tier:'analogy',says:'能力相同的学生，在平均水平更高的学校里对自己的评价更低。127 万名学生的汇总效应为 −0.28。证据来自学校，用到别处是类比。',src:'Fang 等，Frontiers in Psychology，元分析',url:'https://consensus.app/papers/details/w:c6956f5a-c7dc-4eeb-9741-f20f5615cffe/?utm_source=claude_desktop'},
  adapt:{name:'对人生大事的适应',field:'幸福感研究',says:'德国二十年的追踪数据：结婚、离婚、丧偶、生孩子、被裁之后，生活满意度会在几年内回到原来的水平。失业是例外，男性对失业几乎适应不了。',src:'Clark、Diener 等，Economic Journal，2008，德国追踪数据',url:'https://consensus.app/papers/details/3092e76988c35711b9c12311646bd95c/?utm_source=claude_desktop'},
  bigcity:{name:'大城市的经验更值钱',field:'城市经济学',says:'在大城市工作的人一来就有工资溢价，而且每年积累的经验更值钱，收入涨得更快。这部分经验的价值在搬走之后仍然留着。',src:'De la Roca、Puga，Review of Economic Studies，2016，西班牙行政数据',url:'https://consensus.app/papers/details/4d60a2adda6a53a3bed0f1d5530f782e/?utm_source=claude_desktop'},
  selfemp:{name:'单干的收入代价',field:'劳动经济学',says:'多数自雇者的起步收入和收入增长都低于受雇，干满十年的人收入中位数比受雇低约 35%。他们仍然留下来，说明自己做主这类非金钱回报很大。',src:'Hamilton，Journal of Political Economy，2000',url:'https://consensus.app/papers/details/0ed2c3af8eb25ab3b7a2bed1ff9dd892/?utm_source=claude_desktop'}
};

// 把任何来源的包洗成引擎能跑的形状。模型输出不可信，所有字段都钳住。
function sanitize(raw){
  if(!raw || typeof raw!=='object') throw new Error('没有拿到岔路包');
  if(raw.refuse) return {refuse: String(raw.refuse).slice(0,300)};
  const S = (v,n)=>String(v==null?'':v).slice(0,n||200);
  const pack = {title:S(raw.title,40)||'岔路', question:S(raw.question,300), caveat:S(raw.caveat,400), builtin:!!raw.builtin, composed:!!raw.composed,
    options:{A:{name:S(raw.options&&raw.options.A&&raw.options.A.name,24)||'选项一'},B:{name:S(raw.options&&raw.options.B&&raw.options.B.name,24)||'选项二'}},
    years: clamp(Math.round(Number(raw.years)||5),3,10), meters:[], events:[], rules:{}};
  (Array.isArray(raw.meters)?raw.meters:[]).slice(0,4).forEach((m,i)=>{
    const id=S(m.id,20)||('m'+i);
    pack.meters.push({id,name:S(m.name,12)||id,note:S(m.note,60),
      start:{A:clamp(ab(m.start,'A')||50,0,400),B:clamp(ab(m.start,'B')||50,0,400)},
      drift:{A:clamp(ab(m.drift,'A')||0,-30,30),B:clamp(ab(m.drift,'B')||0,-30,30)},
      noise:clamp(Number(m.noise)||3,0,15), min:0, max:Number(m.max)>0?Number(m.max):1000});
  });
  if(pack.meters.length<1) throw new Error('岔路包里没有可比较的指标');
  const mids = new Set(pack.meters.map(m=>m.id));
  const rr = raw.rules||{};
  Object.keys(rr).slice(0, raw.builtin ? 60 : 24).forEach(id=>{
    const r=rr[id]||{}; const lib = r.lib && LIB[r.lib];
    if(lib) pack.rules[id]={name:lib.name,field:lib.field,says:lib.says,src:lib.src,url:lib.url,tier:lib.tier||'study',why:S(r.why,160)};
    else { const t = r.tier==='analogy'?'analogy':(r.tier==='assume'?'assume':'unverified');
      pack.rules[id]={name:S(r.name,24)||'未命名规律',field:S(r.field,24),says:S(r.says,220),src:t==='analogy'?'类比，不是证据':(t==='assume'?'没有数据来源，是模型的设定':'由模型提出，没有核实过出处'),url:'',tier:t,why:S(r.why,160)}; }
  });
  (Array.isArray(raw.events)?raw.events:[]).slice(0, raw.builtin ? 120 : 20).forEach((e,i)=>{
    const rule = pack.rules[e.rule] ? e.rule : null;
    const tier = rule ? pack.rules[rule].tier : 'assume';
    const eff = {};
    if(tier!=='analogy' && e.effects && typeof e.effects==='object') Object.keys(e.effects).forEach(k=>{ if(!mids.has(k)) return;
      const v=e.effects[k]||{}; const o={};
      ['A','B'].forEach(p=>{ const add=clamp(ab(v.add,p)||0,-40,40), mul=clamp(ab(v.mul,p)||1,0.5,1.6); o[p]={add,mul}; });
      eff[k]=o; });
    pack.events.push({id:S(e.id,24)||('e'+i), text:{A:S(ab2(e.text,'A'),120),B:S(ab2(e.text,'B'),120)},
      p:{A:clamp(ab(e.p,'A')||0,0,1),B:clamp(ab(e.p,'B')||0,0,1)}, from:clamp(Math.round(Number(e.from)||1),1,10), to:clamp(Math.round(Number(e.to)||10),1,10),
      once:!!e.once, requires:e.requires?S(e.requires,24):'', sets:e.sets?S(e.sets,24):'', blockedBy:(Array.isArray(e.blockedBy)?e.blockedBy:(e.blockedBy?[e.blockedBy]:[])).slice(0,3).map(x=>S(x,24)), tone:['up','down','flat'].includes(e.tone)?e.tone:'flat',
      rule, effects:eff, knob:!!e.knob, label:S(e.label,24)});
  });
  if(pack.events.length<2) throw new Error('岔路包里的事件太少');
  pack.choices=[];
  (Array.isArray(raw.choices)?raw.choices:[]).slice(0,6).forEach((c,i)=>{
    const opts=(Array.isArray(c.options)?c.options:[]).slice(0,3).map(o=>{
      const rule = pack.rules[o.rule] ? o.rule : null, tier = rule ? pack.rules[rule].tier : 'assume', eff={};
      if(tier!=='analogy' && o.effects && typeof o.effects==='object') Object.keys(o.effects).forEach(k=>{ if(!mids.has(k)) return;
        const v=o.effects[k]||{}; eff[k]={add:clamp(Number(v.add)||0,-40,40),mul:clamp(Number(v.mul)||1,0.5,1.6)}; });
      return {label:S(o.label,16)||'选这个', text:S(o.text,120), sets:o.sets?S(o.sets,24):'', rule, effects:eff, tone:['up','down','flat'].includes(o.tone)?o.tone:'flat'};
    });
    if(opts.length<2) return;
    pack.choices.push({id:S(c.id,24)||('c'+i), year:clamp(Math.round(Number(c.year)||1),1,pack.years), path:c.path==='A'||c.path==='B'?c.path:'both',
      prompt:{A:S(ab2(c.prompt,'A'),140),B:S(ab2(c.prompt,'B'),140)}, requires:c.requires?S(c.requires,24):'', options:opts});
  });
  if(raw.closing && typeof raw.closing==='object') pack.closing={A:S(raw.closing.A,24),B:S(raw.closing.B,24)};
  const AB = v => v==='A'||v==='B' ? v : ''; pack.stance = {change:AB(raw.stance&&raw.stance.change), lock:AB(raw.stance&&raw.stance.lock)};
  return pack;
}
function ab2(v,path){ return (v && typeof v==='object') ? v[path] : v; }

function newLife(pack, path, seed){
  const L={pack,path,seed,r:mulberry32(seed),r2:mulberry32(seed^0x9E3779B9),val:{},flags:{},counts:{},years:[],y:0,picks:{}};
  pack.meters.forEach(m=>L.val[m.id]=m.start[path]);
  L.start={}; pack.meters.forEach(m=>L.start[m.id]=Math.round(L.val[m.id]));
  return L;
}
// 下一年要面对的抉择（玩家先选，再过这一年）
function pending(L){ const y=L.y+1; return L.pack.choices.filter(c=>c.year===y && (c.path==='both'||c.path===L.path) && (!c.requires||L.flags[c.requires]) && c.prompt[L.path]); }
function applyEff(L,eff){ Object.keys(eff).forEach(k=>{ const m=L.pack.meters.find(x=>x.id===k), f=eff[k]; L.val[k]=clamp(L.val[k]*f.mul+f.add, m.min, m.max); }); }
function stepYear(L, decide){
  const pack=L.pack, path=L.path, r=L.r, y=++L.y, ev=[];
  pending({pack,path,y:y-1,flags:L.flags}).forEach(c=>{
    const auto=Math.floor(L.r2()*c.options.length); let i = decide ? decide(c) : auto; if(!(i>=0&&i<c.options.length)) i=auto;
    const o=c.options[i]; L.picks[c.id]=i; if(o.sets) L.flags[o.sets]=true; applyEff(L,o.effects);
    ev.push({id:c.id,text:o.text||('你选了：'+o.label),rule:o.rule,tone:o.tone,chosen:o.label,prompt:c.prompt[path]});
  });
  pack.meters.forEach(m=>{ L.val[m.id]=clamp(L.val[m.id]+m.drift[path]+(r()-0.5)*2*m.noise, m.min, m.max); });
  pack.events.forEach(e=>{
    if(y<e.from||y>e.to) return; if(e.once&&L.counts[e.id]) return; if(e.requires&&!L.flags[e.requires]) return; if(e.blockedBy.some(f=>L.flags[f])) return;
    if(r()>=e.p[path]) return; if(!e.text[path]) return;
    L.counts[e.id]=(L.counts[e.id]||0)+1; if(e.sets) L.flags[e.sets]=true;
    const eff={}; Object.keys(e.effects).forEach(k=>eff[k]=e.effects[k][path]); applyEff(L,eff);
    ev.push({id:e.id,text:e.text[path],rule:e.rule,tone:e.tone});
  });
  const snap={}; pack.meters.forEach(m=>snap[m.id]=Math.round(L.val[m.id]));
  const rec={y,ev,val:snap}; L.years.push(rec); return rec;
}
function simulate(pack, path, seed){
  const L=newLife(pack,path,seed); while(L.y<pack.years) stepYear(L,null);
  const fin={}; pack.meters.forEach(m=>fin[m.id]=Math.round(L.val[m.id]));
  return {path,seed,years:L.years,start:L.start,final:fin,counts:L.counts};
}
function batch(pack,path,n,seed0){ const o=[]; for(let i=0;i<n;i++) o.push(simulate(pack,path,seed0+i*7919)); return o; }
function quant(sorted,p){ return sorted[Math.min(sorted.length-1,Math.floor(p*sorted.length))]; }
function summarize(pack,runs){
  const out={meters:{},events:{}};
  pack.meters.forEach(m=>{ const s=runs.map(x=>x.final[m.id]).sort((a,b)=>a-b); out.meters[m.id]={p10:quant(s,.1),p50:quant(s,.5),p90:quant(s,.9)}; });
  pack.events.forEach(e=>{ out.events[e.id]=Math.round(100*runs.filter(x=>x.counts[e.id]).length/runs.length); });
  return out;
}

// 内置示例：按 v0.1 的查证结果手写。
const BUILTIN = {
  builtin:true, title:'大厂边缘，还是中厂核心', years:5,
  question:'秋招手里有两个 offer：一个是大厂的边缘部门，一个是中厂的核心部门。',
  caveat:'规则背后的研究多数不在中国、也不在互联网行业。所有概率都是作者设定的，没有国内统计支撑。',
  options:{A:{name:'大厂 · 边缘部门'},B:{name:'中厂 · 核心部门'}},
  meters:[
    {id:'pay',name:'薪资指数',note:'大厂起薪记为 100',start:{A:100,B:88},drift:{A:5,B:5},noise:2,max:600},
    {id:'skill',name:'技能',note:'0 到 100',start:{A:30,B:30},drift:{A:6,B:4},noise:2,max:100},
    {id:'mood',name:'心态',note:'0 到 100。边缘部门每年低 2 点，是假设',start:{A:60,B:60},drift:{A:-2,B:0},noise:3,max:100}
  ],
  rules:{
    R1:{lib:'firmsize',why:'大厂每年技能多涨 2 点'}, R2:{lib:'brand',why:'大厂出身跳槽涨得更多'}, R3:{lib:'task',why:'核心部门更常接到复杂项目'},
    R4:{lib:'boss',why:'核心部门更可能遇到强主管'}, R5:{lib:'weakties',why:'大厂里认识的人多，外部机会多'}, R6:{lib:'noncore',why:'边缘部门更容易被收缩'},
    R7:{lib:'scar',why:'空窗超过半年，薪资降 9%'}, R8:{lib:'bflp',why:'只用于解说大厂里的心态'}, R12:{lib:'junior',why:'头两年两条路都更容易被裁'},
    H1:{tier:'assume',name:'内部转岗',field:'模型假设',says:'大厂边缘部门的人每年有 8% 的机会转进核心部门。'},
    H2:{tier:'assume',name:'按年资晋升',field:'模型假设',says:'没有强主管也没做过复杂项目的人，仍有一个较低的晋升概率。'},
    X1:{tier:'analogy',name:'十攻其一',field:'《孙子兵法·虚实》',says:'「我专为一，敌分为十，是以十攻其一也。」在小地方当主力，还是在大地方当边角。'},
    X2:{tier:'analogy',name:'宁为鸡口，无为牛后',field:'《战国策·韩策》',says:'这个岔路两千年前就有人吵过。'}
  },
  events:[
    {id:'boss',label:'遇到强主管',text:'你被分到一位说话有分量的主管手下。',p:{A:0.2,B:0.5},from:1,to:1,once:true,sets:'boss',tone:'up',rule:'R4',effects:{mood:{add:4}}},
    {id:'move',label:'内部转岗到核心',text:{A:'核心业务线招人，你内部转岗成功了。',B:''},p:{A:0.08,B:0},from:1,to:5,once:true,sets:'core',tone:'up',rule:'H1',effects:{mood:{add:6}}},
    {id:'cx',label:'接到复杂项目',text:{A:'难得轮到你做一个有难度的项目。',B:'你接手了一个没人做过的项目，从头做到上线。'},p:{A:0.2,B:0.6},knob:true,from:1,to:5,sets:'didcx',tone:'up',rule:'R3',effects:{skill:{add:8},mood:{add:5}}},
    {id:'cx2',label:'转岗后的复杂项目',text:{A:'转到核心之后，你开始独立负责一块业务。',B:''},p:{A:0.4,B:0},from:1,to:5,requires:'core',tone:'up',rule:'R3',effects:{skill:{add:8},mood:{add:5}}},
    {id:'small',label:'被大池塘压住',text:{A:'身边的人都很强，你开始怀疑自己是不是最差的那个。',B:''},p:{A:0.5,B:0},from:2,to:3,once:true,tone:'down',rule:'R8',effects:{}},
    {id:'promoB',label:'强主管带来的晋升',text:'主管把你推上去，你升了一级。',p:{A:0.14,B:0.14},from:2,to:5,requires:'boss',tone:'up',rule:'R4',effects:{pay:{mul:1.12},mood:{add:8}}},
    {id:'promoC',label:'做出成绩后的晋升',text:'项目做出来了，你升了一级。',p:{A:0.16,B:0.16},from:2,to:5,requires:'didcx',tone:'up',rule:'R3',effects:{pay:{mul:1.12},mood:{add:8}}},
    {id:'promo0',label:'按年资晋升',text:'你熬到了年限，升了一级。',p:{A:0.04,B:0.04},from:3,to:5,tone:'up',rule:'H2',effects:{pay:{mul:1.1},mood:{add:5}}},
    {id:'cutY',label:'头两年的额外裁员',text:'公司缩减初级岗位，你在名单上。',p:{A:0.02,B:0.02},from:1,to:2,sets:'laid',tone:'down',rule:'R12',effects:{mood:{add:-20}}},
    {id:'cut',label:'部门被收缩',text:{A:'业务调整，你所在的部门被整体裁撤。',B:'公司收缩，你所在的部门被合并，你在名单上。'},p:{A:0.12,B:0.05},knob:true,from:1,to:5,once:true,sets:'laid',tone:'down',rule:'R6',effects:{mood:{add:-20}}},
    {id:'gap',label:'空窗超过半年',text:'你找了大半年才重新上岸，新工作的薪水比原来低。',p:{A:0.1,B:0.16},from:1,to:5,once:true,requires:'laid',tone:'down',rule:'R7',effects:{pay:{mul:0.91}}},
    {id:'hop',label:'被挖走',text:{A:'一个不太熟的前同事递来机会，你跳槽了。',B:'一位猎头找到你，你跳槽了。'},p:{A:0.16,B:0.1},knob:true,from:2,to:5,tone:'up',rule:'R5',effects:{pay:{mul:{A:1.22,B:1.16}},mood:{add:8}}},
    {id:'hop2',label:'凭本事跳槽',text:'你拿着做过的项目去面试，对方开了更高的价。',p:{A:0.1,B:0.1},from:3,to:5,once:true,requires:'didcx',tone:'up',rule:'R2',effects:{pay:{mul:{A:1.2,B:1.2}},mood:{add:6}}}
  ],
  choices:[
    {id:'help',year:2,path:'A',prompt:'隔壁核心组缺人手，想让你业余搭把手。没有绩效，也没人保证之后能转过去。',options:[
      {label:'去帮忙',text:'你开始每周多花两个晚上在别人的项目上。核心组的人记住了你的名字。',sets:'seen',tone:'flat',rule:'R5',effects:{mood:{add:-4},skill:{add:3}}},
      {label:'不去',text:'你把时间留给了自己。',tone:'flat',rule:null,effects:{mood:{add:2}}}]},
    {id:'rumor',year:2,path:'B',prompt:'公司这个季度没完成目标，食堂里开始有人聊融资的事。',options:[
      {label:'悄悄看机会',text:'你更新了简历，约了两个前同事吃饭。',sets:'looking',tone:'flat',rule:'R5',effects:{mood:{add:-3}}},
      {label:'留下来押注',text:'你决定不看外面，把手上的事做到底。',sets:'loyal',tone:'flat',rule:null,effects:{mood:{add:2}}}]},
    {id:'hard',year:3,path:'both',prompt:{A:'领导问有没有人愿意接一个烂尾的项目。做成了是你的，做砸了也是你的。',B:'老板想开一条新业务线，问你敢不敢带。'},options:[
      {label:'接',text:'你接了。接下来半年几乎没有周末。',sets:'didcx',tone:'flat',rule:'R3',effects:{skill:{add:10},mood:{add:-6}}},
      {label:'不接',text:'你没举手。日子照旧。',tone:'flat',rule:null,effects:{mood:{add:3}}}]}
  ],
  closing:{A:'X2',B:'X1'}
};
BUILTIN.events.push(
  {id:'move2',label:'帮忙换来的转岗',text:{A:'核心组有了名额，他们第一个想到的是你。',B:''},p:{A:0.3,B:0},from:3,to:5,once:true,requires:'seen',sets:'core',tone:'up',rule:'R5',effects:{mood:{add:8}}},
  {id:'hopL',label:'看机会看到了',text:{A:'',B:'前同事把你推荐给了他现在的老板，你拿到了一个更好的 offer。'},p:{A:0,B:0.35},from:2,to:4,once:true,requires:'looking',tone:'up',rule:'R5',effects:{pay:{mul:1.14},mood:{add:6}}},
  {id:'stay',label:'押注得到回报',text:{A:'',B:'公司缓过来了。留下来的人里，你被提成了小组负责人。'},p:{A:0,B:0.22},from:3,to:5,once:true,requires:'loyal',tone:'up',rule:'R4',effects:{pay:{mul:1.12},mood:{add:8}}}
);

const BUILTIN2 = {
  builtin:true, title:'辞职单干，还是再干一年', years:5,
  question:'你想辞职去做自己的小项目，存款够撑一年。也可以再上一年班，多攒点钱和人脉。',
  caveat:'「自己做」这条路的成败概率完全是设定的，没有统计支撑。相关研究讲的是初创公司的员工，不是创始人。',
  options:{A:{name:'现在辞职单干'},B:{name:'再干一年'}},
  meters:[
    {id:'pay',name:'收入指数',note:'现在的工资记为 100',start:{A:20,B:100},drift:{A:6,B:5},noise:4,max:800},
    {id:'own',name:'自主感',note:'0 到 100',start:{A:75,B:40},drift:{A:0,B:-2},noise:3,max:100},
    {id:'mood',name:'心态',note:'0 到 100',start:{A:65,B:55},drift:{A:-2,B:-1},noise:4,max:100}
  ],
  rules:{
    c:{lib:'coin',why:'做出改变的人，半年后心态更好'}, g:{lib:'regret',why:'没走的那条路，越往后越想'}, i:{lib:'impact',why:'失败的打击比预想的恢复得快'},
    s:{lib:'startup',why:'小摊子早期挣得少，也更容易散'}, w:{lib:'weakties',why:'机会多半来自不太熟的人'}, k:{lib:'scar',why:'空窗久了，回去上班会降薪'},
    h:{tier:'assume',name:'项目的成败',field:'模型假设',says:'自己做的项目每年有一成多的机会跑通，也有两成的机会撑不下去。'},
    x:{tier:'analogy',name:'破釜沉舟',field:'《史记·项羽本纪》',says:'把船凿沉、把锅砸了再打。没有退路的人，和留着退路的人，打的不是同一场仗。'}
  },
  events:[
    {id:'lift',label:'改变后的轻松',text:{A:'辞职后的头几个月，你睡得比过去两年都好。',B:''},p:{A:0.7,B:0},from:1,to:1,once:true,tone:'up',rule:'c',effects:{mood:{add:10}}},
    {id:'hit',label:'项目跑通',text:{A:'项目有了第一批愿意付钱的人，收入开始超过以前的工资。',B:''},p:{A:0.13,B:0},knob:true,from:1,to:5,once:true,blockedBy:['sold','back'],sets:'made',tone:'up',rule:'h',effects:{pay:{add:110},mood:{add:15}}},
    {id:'grow',label:'跑通后的增长',text:{A:'老客户带来了新客户。',B:''},p:{A:0.6,B:0},from:2,to:5,requires:'made',blockedBy:['sold'],tone:'up',rule:'w',effects:{pay:{mul:1.25}}},
    {id:'dry',label:'撑不下去',text:{A:'存款见底了，项目还没有起色。你开始投简历。',B:''},p:{A:0.2,B:0},knob:true,from:2,to:5,once:true,blockedBy:['sold','made'],sets:'back',tone:'down',rule:'s',effects:{mood:{add:-18},own:{add:-25}}},
    {id:'ret',label:'回去上班',text:{A:'你回去上班了。空窗的这段时间让对方压了价。',B:''},p:{A:0.8,B:0},from:2,to:5,once:true,requires:'back',tone:'down',rule:'k',effects:{pay:{add:70}}},
    {id:'heal',label:'比想象中恢复得快',text:{A:'你以为会消沉很久，结果三个月后就不怎么想这件事了。',B:''},p:{A:0.6,B:0},from:3,to:5,once:true,requires:'back',tone:'up',rule:'i',effects:{mood:{add:14}}},
    {id:'raise',label:'升职加薪',text:{A:'',B:'你升了一级，工资涨了一截。'},p:{A:0,B:0.2},from:1,to:5,tone:'up',rule:null,effects:{pay:{mul:1.12},mood:{add:5}}},
    {id:'itch',label:'想起没走的路',text:{A:'',B:'刷到别人做成了你当初想做的那件事。你把手机扣在了桌上。'},p:{A:0,B:0.3},knob:true,from:2,to:5,tone:'down',rule:'g',effects:{mood:{add:-7}}},
    {id:'cutb',label:'被裁',text:{A:'',B:'公司裁员，你在名单上。'},p:{A:0,B:0.06},from:1,to:5,once:true,tone:'down',rule:'k',effects:{pay:{mul:0.93},mood:{add:-15}}},
    {id:'late',label:'晚一步出发',text:{A:'',B:'你终于辞了职，带着比当初多一倍的存款。'},p:{A:0,B:0.5},from:2,to:5,once:true,requires:'wait',sets:'made2',tone:'flat',rule:'c',effects:{pay:{add:-60},own:{add:35},mood:{add:8}}}
  ],
  choices:[
    {id:'side',year:1,path:'B',prompt:'白天上班，晚上还有四个小时。',options:[
      {label:'拿来做那个项目',text:'你开始每晚做到一点。进度很慢，但它在长。',sets:'wait',tone:'flat',rule:null,effects:{mood:{add:-5},own:{add:8}}},
      {label:'拿来休息',text:'你决定先把这一年过好。',tone:'flat',rule:null,effects:{mood:{add:4}}}]},
    {id:'cash',year:2,path:'A',prompt:'有家公司想把你的项目连人一起收走，给你一份比以前高的工资。',options:[
      {label:'卖掉，回去上班',text:'你签了字。项目变成了别人的一个功能。',sets:'sold',tone:'flat',rule:null,effects:{pay:{add:100},own:{add:-35}}},
      {label:'不卖',text:'你回了一封很短的邮件。',tone:'flat',rule:'x',effects:{}}]}
  ],
  closing:{A:'x',B:'g'}
};

const BUILTIN3 = {
  builtin:true, title:'读博，还是工作', years:7, keys:['读博','博士','phd','PhD','科研','学术','导师','直博','申博'],
  question:'你手里有一个博士 offer 和一份还不错的工作，只能选一个。你对研究有兴趣，但不确定能不能坚持五六年。',
  caveat:'七年的窗口对读博不公平，博士的回报大多在毕业十年后才显出来。「毕业」和「发论文」的概率是设定的，学科之间差别极大。',
  options:{A:{name:'去读博'},B:{name:'去工作'}},
  meters:[
    {id:'pay',name:'收入指数',note:'工作的起薪记为 100',start:{A:30,B:100},drift:{A:1,B:5},noise:2,max:600},
    {id:'depth',name:'专业深度',note:'0 到 100',start:{A:35,B:35},drift:{A:7,B:3},noise:2,max:100},
    {id:'mood',name:'心态',note:'0 到 100',start:{A:65,B:60},drift:{A:-3,B:-1},noise:4,max:100}
  ],
  rules:{
    m:{lib:'gradmh',why:'读博的人心态更容易往下走，越往后越明显'}, e:{lib:'entry',why:'毕业那年碰上的行情，会跟着你很多年'}, g:{lib:'regret',why:'没读的那条路，过几年会越来越常想起'},
    i:{lib:'impact',why:'退学或被裁，恢复得比你以为的快'}, w:{lib:'weakties',why:'工作的人认识的人多，机会也多'}, b:{lib:'brand',why:'博士学位本身是一个信号，跳槽时值钱'},
    h:{tier:'assume',name:'毕业和发表',field:'模型假设',says:'每年发出一篇好论文、按时毕业的概率都是设定的，不同学科差别很大。'},
    x:{tier:'analogy',name:'磨刀不误砍柴工',field:'俗语',says:'先花几年把刀磨快，还是先砍起来。磨刀的人前几年一根柴也没有。'}
  },
  events:[
    {id:'paper',label:'论文被接收',text:{A:'你的论文被接收了。导师在组会上提了一句。',B:''},p:{A:0.2,B:0},knob:true,from:2,to:7,blockedBy:['quit'],sets:'pub',tone:'up',rule:'h',effects:{depth:{add:8},mood:{add:10}}},
    {id:'stuck',label:'课题卡住',text:{A:'课题卡了整整一年，没有一个能写进论文的结果。',B:''},p:{A:0.22,B:0},knob:true,from:1,to:6,blockedBy:['quit','grad'],sets:'stuck',tone:'down',rule:'m',effects:{mood:{add:-12}}},
    {id:'night',label:'深夜怀疑意义',text:{A:'凌晨两点的实验室，你第一次认真想，这些到底有没有用。',B:''},p:{A:0.25,B:0},from:3,to:7,blockedBy:['quit','grad'],tone:'down',rule:'m',effects:{mood:{add:-7}}},
    {id:'quit',label:'退学去工作',text:{A:'你办了退学，带着一个硕士学位去找工作。',B:''},p:{A:0.12,B:0},from:2,to:5,once:true,requires:'stuck',blockedBy:['grad'],sets:'quit',tone:'flat',rule:'i',effects:{pay:{add:62},mood:{add:6}}},
    {id:'grad',label:'博士毕业',text:{A:'你答辩通过了。走出会议室，外面在下雨。',B:''},p:{A:0.5,B:0},from:5,to:7,once:true,blockedBy:['quit'],sets:'grad',tone:'up',rule:'h',effects:{pay:{add:115},mood:{add:16}}},
    {id:'cold',label:'毕业撞上寒冬',text:{A:'你毕业那年，几家大厂的研究院同时缩招。',B:''},p:{A:0.3,B:0},from:5,to:7,once:true,requires:'grad',tone:'down',rule:'e',effects:{pay:{mul:0.88},mood:{add:-6}}},
    {id:'rjob',label:'拿到研究岗',text:{A:'凭那几篇论文，你拿到了一个研究岗，薪水比你的同龄人高一截。',B:''},p:{A:0.6,B:0},from:5,to:7,once:true,requires:'pub',blockedBy:['quit'],tone:'up',rule:'b',effects:{pay:{mul:1.25}}},
    {id:'raise',label:'跳槽涨薪',text:{A:'',B:'一个不太熟的前同事把你推荐了过去，薪水涨了一截。'},p:{A:0,B:0.18},from:2,to:7,tone:'up',rule:'w',effects:{pay:{mul:1.15},mood:{add:5}}},
    {id:'plat',label:'进入平台期',text:{A:'',B:'你发现今年做的事，和两年前差不多。'},p:{A:0,B:0.3},from:3,to:7,once:true,tone:'down',rule:null,effects:{mood:{add:-7}}},
    {id:'itch',label:'想起没走的路',text:{A:'',B:'刷到当年同一个实验室的人发了顶会。你点了个赞，然后把手机扣在桌上。'},p:{A:0,B:0.22},from:3,to:7,tone:'down',rule:'g',effects:{mood:{add:-6}}},
    {id:'cut',label:'被裁',text:{A:'',B:'部门调整，你在名单上。'},p:{A:0,B:0.06},from:1,to:7,once:true,tone:'down',rule:'i',effects:{pay:{mul:0.92},mood:{add:-14}}},
    {id:'big',label:'冷门方向出了成果',text:{A:'那个没人看好的方向，被你做出来了。',B:''},p:{A:0.2,B:0},from:3,to:6,once:true,requires:'risky',blockedBy:['quit'],sets:'pub',tone:'up',rule:'h',effects:{depth:{add:15},mood:{add:14}}},
    {id:'stuck2',label:'冷门方向走不通',text:{A:'那个方向做了一年半，你开始接受它可能走不通。',B:''},p:{A:0.15,B:0},from:2,to:5,once:true,requires:'risky',blockedBy:['quit'],sets:'stuck',tone:'down',rule:'m',effects:{mood:{add:-12}}}
  ],
  choices:[
    {id:'dir',year:1,path:'A',prompt:'导师给你两个方向：一个稳，按部就班能毕业；一个有意思，但可能做不出来。',options:[
      {label:'选稳的',text:'你选了稳的那个。导师点点头，没多说。',tone:'flat',rule:null,effects:{mood:{add:2}}},
      {label:'选有意思的',text:'你选了没人做过的那个。',sets:'risky',tone:'flat',rule:null,effects:{mood:{add:5}}}]},
    {id:'part',year:2,path:'B',prompt:'公司有一个读在职硕士的名额，要占掉两年的周末。',options:[
      {label:'申请',text:'你开始了一周七天都在上课或上班的两年。',tone:'flat',rule:null,effects:{depth:{add:10},mood:{add:-6}}},
      {label:'不申请',text:'你把周末留给了自己。',tone:'flat',rule:null,effects:{mood:{add:3}}}]},
    {id:'side',year:3,path:'A',prompt:'师兄拉你去他的创业公司兼职，钱不少，导师不知道。',options:[
      {label:'去',text:'你开始每周偷偷去两个下午。',tone:'flat',rule:null,effects:{pay:{add:18},depth:{add:-4},mood:{add:-2}}},
      {label:'不去',text:'你回了一句「最近太忙」。',tone:'flat',rule:null,effects:{}}]}
  ],
  closing:{A:'x',B:'x'}
};

const BUILTIN4 = {
  builtin:true, title:'留在一线，还是回老家', years:5, keys:['回老家','老家','一线','北上广','北京','上海','深圳','杭州','省会','家乡','回家','离父母','房价','逃离'],
  question:'你在一线城市干了三年，想回老家省会。那边机会少，但离父母近，房子买得起。',
  caveat:'感情和家庭的变化没有算进去，而这往往才是回不回去的真正原因。两地的收入差和房价差都是粗设的。',
  options:{A:{name:'留在一线'},B:{name:'回老家省会'}},
  meters:[
    {id:'ease',name:'宽裕度',note:'收入扣掉房租或房贷后的余地，现在记为 100',start:{A:100,B:104},drift:{A:5,B:3},noise:4,max:500},
    {id:'near',name:'亲近感',note:'和家人朋友的联系，0 到 100',start:{A:40,B:65},drift:{A:-1,B:1},noise:3,max:100},
    {id:'mood',name:'心态',note:'0 到 100',start:{A:55,B:60},drift:{A:0,B:0},noise:4,max:100}
  ],
  rules:{
    w:{lib:'weakties',why:'一线认识的人多，机会来得也多'}, c:{lib:'commute',why:'一线的通勤每年磨掉一点心态，工资补不回来'}, g:{lib:'regret',why:'没走的那条路越往后越常想起'},
    i:{lib:'impact',why:'回去后的落差，消退得比你预想的快'}, b:{lib:'bflp',why:'只用来解说回去后「在小池塘里变大」的感觉'},
    h:{tier:'assume',name:'省会的机会',field:'模型假设',says:'省会同类岗位每年出现好机会的概率，设为一线的三分之一。'},
    x:{tier:'analogy',name:'岛屿法则',field:'生态学',says:'迁到小岛上的大型动物会一代代变小，小型动物反而变大。环境的尺度会重新塑造住在里面的东西。'}
  },
  events:[
    {id:'jump',label:'跳槽涨薪',text:{A:'前同事拉你去了一家新公司，工资涨了两成。',B:'省会那家对口的公司在招人，你去了。'},p:{A:0.24,B:0.08},knob:true,from:1,to:5,tone:'up',rule:'w',effects:{ease:{mul:{A:1.18,B:1.12}}}},
    {id:'rent',label:'房租上涨',text:{A:'房东发来微信，下个月起涨八百。',B:''},p:{A:0.35,B:0},knob:true,from:1,to:5,blockedBy:['buyA'],tone:'down',rule:'h',effects:{ease:{add:-8},mood:{add:-4}}},
    {id:'commute',label:'通勤磨人',text:{A:'早高峰的换乘通道里，你被人流推着走了四分钟。',B:''},p:{A:0.4,B:0},from:1,to:5,tone:'down',rule:'c',effects:{mood:{add:-5}}},
    {id:'dinner',label:'周末回家吃饭',text:{A:'',B:'周日中午，你妈做了一桌菜，你爸问你要不要带点走。'},p:{A:0,B:0.6},from:1,to:5,tone:'up',rule:null,effects:{near:{add:4},mood:{add:3}}},
    {id:'small',label:'圈子变小',text:{A:'',B:'饭局上聊的还是那几个人的近况，你发现自己插不上话。'},p:{A:0,B:0.3},from:2,to:5,tone:'down',rule:'x',effects:{}},
    {id:'big',label:'成了熟手',text:{A:'',B:'你在这家公司成了最懂这块业务的人，领导什么事都先问你。'},p:{A:0,B:0.25},from:2,to:5,once:true,tone:'up',rule:'b',effects:{mood:{add:8}}},
    {id:'adapt',label:'落差消退',text:{A:'',B:'你不再每天刷原来同事的朋友圈了。'},p:{A:0,B:0.5},from:2,to:3,once:true,tone:'up',rule:'i',effects:{mood:{add:8}}},
    {id:'miss',label:'想起没走的路',text:{A:'过年回家，你妈送你到小区门口，站着没走。',B:'刷到前同事升了总监。'},p:{A:0.3,B:0.25},from:2,to:5,tone:'down',rule:'g',effects:{mood:{add:-6}}},
    {id:'house',label:'买房',text:{A:'',B:'你在老家付了首付，月供比原来的房租还低。'},p:{A:0,B:0.3},knob:true,from:1,to:5,once:true,requires:'save',tone:'up',rule:'h',effects:{ease:{add:15},mood:{add:8}}},
    {id:'shopok',label:'小店活下来了',text:{A:'',B:'小店熬过了第一年，开始有回头客。'},p:{A:0,B:0.35},from:2,to:4,once:true,requires:'shop',blockedBy:['shopno'],sets:'shopyes',tone:'up',rule:'h',effects:{ease:{add:20},mood:{add:8}}},
    {id:'shopno',label:'小店关门',text:{A:'',B:'小店撑了一年半，你把钥匙还给了房东。'},p:{A:0,B:0.3},from:2,to:4,once:true,requires:'shop',blockedBy:['shopyes'],sets:'shopno',tone:'down',rule:'i',effects:{ease:{add:-12},mood:{add:-10}}},
    {id:'cut',label:'被裁',text:{A:'部门重组，你在名单上。',B:'公司撤了省会的办事处。'},p:{A:0.07,B:0.05},from:1,to:5,once:true,tone:'down',rule:null,effects:{ease:{mul:0.85},mood:{add:-15}}}
  ],
  choices:[
    {id:'cash',year:1,path:'B',prompt:'刚回来，手里有一笔在一线攒下的钱。',options:[
      {label:'存着看房',text:'你把钱放进了定期，周末开始跟中介看房。',sets:'save',tone:'flat',rule:null,effects:{}},
      {label:'开个小店',text:'你盘下了学校门口的一间铺面。',sets:'shop',tone:'flat',rule:null,effects:{ease:{add:-15},mood:{add:5}}}]},
    {id:'away',year:3,path:'A',prompt:'公司要派人去外地开新业务，两年，级别升一级。',options:[
      {label:'去',text:'你去了一个离家更远的城市。',tone:'flat',rule:null,effects:{ease:{mul:1.15},near:{add:-12}}},
      {label:'不去',text:'你留在了原来的工位。',tone:'flat',rule:null,effects:{mood:{add:2}}}]}
  ],
  closing:{A:'x',B:'x'}
};

const BUILTIN5 = {
  builtin:true, title:'考公，还是进企业', years:5, keys:['考公','公务员','体制内','编制','事业单位','国企','选调','上岸','铁饭碗','稳定'],
  question:'你考上了一个公务员岗位，同时手里有一家企业的 offer，起薪比体制内高两成。',
  caveat:'体制内的晋升、各地的收入差别都很大，这里只用了一组粗设的数字。研究样本来自欧洲，不是中国。',
  options:{A:{name:'进体制内'},B:{name:'进企业'}},
  meters:[
    {id:'pay',name:'收入指数',note:'企业起薪记为 100',start:{A:82,B:100},drift:{A:3,B:5},noise:2,max:600},
    {id:'safe',name:'安稳感',note:'0 到 100',start:{A:75,B:45},drift:{A:1,B:-1},noise:3,max:100},
    {id:'mood',name:'心态',note:'0 到 100',start:{A:62,B:60},drift:{A:-1,B:-1},noise:4,max:100}
  ],
  rules:{
    p:{lib:'public',why:'外面越不稳，体制内的人越满意'}, j:{lib:'junior',why:'企业的初级岗位在收缩'}, s:{lib:'scar',why:'被裁后空窗太久，薪水会降'},
    w:{lib:'weakties',why:'企业里机会多半来自不太熟的人'}, u:{lib:'startup',why:'去创业公司，早期挣得少，也更容易散'}, g:{lib:'regret',why:'没走的路，过几年会想起'},
    h:{tier:'assume',name:'体制内的节奏',field:'模型假设',says:'体制内按年资涨薪，晋升慢，被看见的机会少。具体概率是设定的。'},
    x:{tier:'analogy',name:'r 选择与 K 选择',field:'生态学',says:'有的物种一次生很多，赌其中几个活下来；有的只生几个，每个都养到大。两种都能活，只是押注的方式不同。'}
  },
  events:[
    {id:'paper',label:'写材料到深夜',text:{A:'年底总结改了第七稿，你在办公室待到十一点。',B:''},p:{A:0.3,B:0},from:1,to:5,tone:'down',rule:'h',effects:{mood:{add:-5}}},
    {id:'same',label:'日子开始重复',text:{A:'第三年的春天，你能背出全年每个月要做的事。',B:''},p:{A:0.35,B:0},from:3,to:5,once:true,tone:'down',rule:'h',effects:{mood:{add:-7}}},
    {id:'calm',label:'风浪里的安稳',text:{A:'大学同学群里有人在问裁员赔偿怎么算。你看了一眼，接着吃饭。',B:''},p:{A:0.3,B:0},from:1,to:5,tone:'up',rule:'p',effects:{mood:{add:6},safe:{add:5}}},
    {id:'promoA',label:'被提拔',text:{A:'借调回来以后，你升了一级。',B:''},p:{A:0.22,B:0},from:3,to:5,once:true,requires:'seen',tone:'up',rule:'h',effects:{pay:{mul:1.12},mood:{add:8}}},
    {id:'promo0',label:'按年资晋升',text:{A:'你熬到了年限，升了一级。',B:''},p:{A:0.12,B:0},from:4,to:5,once:true,tone:'up',rule:'h',effects:{pay:{mul:1.08}}},
    {id:'raise',label:'跳槽涨薪',text:{A:'',B:'一个不太熟的前同事递来机会，你跳了，薪水涨了一截。'},p:{A:0,B:0.2},knob:true,from:2,to:5,blockedBy:['startup'],tone:'up',rule:'w',effects:{pay:{mul:1.16},mood:{add:5}}},
    {id:'cut',label:'被裁',text:{A:'',B:'公司缩减初级岗位，你在名单上。'},p:{A:0,B:0.08},knob:true,from:1,to:5,once:true,blockedBy:['startup'],sets:'laid',tone:'down',rule:'j',effects:{mood:{add:-15},safe:{add:-20}}},
    {id:'gap',label:'空窗太久',text:{A:'',B:'你找了七个月才上岸，新工作的薪水比原来低。'},p:{A:0,B:0.4},from:1,to:5,once:true,requires:'laid',tone:'down',rule:'s',effects:{pay:{mul:0.9}}},
    {id:'burn',label:'连续加班',text:{A:'',B:'项目上线前的三周，你没在十二点前离开过公司。'},p:{A:0,B:0.22},from:1,to:5,tone:'down',rule:null,effects:{mood:{add:-6}}},
    {id:'itch',label:'想起没走的路',text:{A:'同学在朋友圈晒年终奖。你算了一下，是你一年的工资。',B:'考公群里那个和你同一年备考的人发了上岸的喜报。'},p:{A:0.2,B:0.2},from:2,to:5,tone:'down',rule:'g',effects:{mood:{add:-5}}},
    {id:'sfail',label:'创业公司散了',text:{A:'',B:'创业公司没融到下一轮，最后一个月的工资拖了两个月才发。'},p:{A:0,B:0.25},from:3,to:5,once:true,requires:'startup',blockedBy:['swin'],sets:'sfail',tone:'down',rule:'u',effects:{pay:{mul:0.82},mood:{add:-12},safe:{add:-20}}},
    {id:'swin',label:'创业公司做成了',text:{A:'',B:'公司拿到了大额融资，你的期权第一次有了价格。'},p:{A:0,B:0.08},from:3,to:5,once:true,requires:'startup',blockedBy:['sfail'],sets:'swin',tone:'up',rule:'u',effects:{pay:{mul:1.5},mood:{add:15}}}
  ],
  choices:[
    {id:'loan',year:2,path:'A',prompt:'领导问你愿不愿意借调到上级部门一年。累，但能被看见。',options:[
      {label:'去',text:'你去了。一年里你写了四十份材料，见了几个以前只在名单上见过的人。',sets:'seen',tone:'flat',rule:null,effects:{mood:{add:-5}}},
      {label:'不去',text:'你说家里有事，推掉了。',tone:'flat',rule:null,effects:{mood:{add:2}}}]},
    {id:'su',year:2,path:'B',prompt:'一家创业公司找到你，开价高三成，还给期权。',options:[
      {label:'去',text:'你签了。新办公室在一栋还没装修完的楼里。',sets:'startup',tone:'flat',rule:'u',effects:{pay:{mul:1.3},safe:{add:-15}}},
      {label:'不去',text:'你回了一封客气的邮件。',tone:'flat',rule:null,effects:{}}]}
  ],
  closing:{A:'x',B:'x'}
};

const BUILTIN6 = {
  builtin:true, title:'去对方的城市，还是继续异地', years:5, keys:['异地','对方的城市','男朋友','女朋友','对象','恋人','搬过去','在一起','结婚','分手','感情','伴侣'],
  question:'你和恋人异地两年了。对方希望你搬过去，可那边你的行业机会少。',
  caveat:'两个人的事，一个人的模拟只能算一半。分手和结婚的概率是粗设的，没有统计支撑。',
  options:{A:{name:'搬去对方城市'},B:{name:'继续异地'}},
  meters:[
    {id:'close',name:'亲密感',note:'0 到 100',start:{A:72,B:70},drift:{A:0,B:-2},noise:3,max:100},
    {id:'work',name:'事业指数',note:'现在记为 100',start:{A:85,B:100},drift:{A:4,B:5},noise:2,max:400},
    {id:'mood',name:'心态',note:'0 到 100',start:{A:62,B:58},drift:{A:0,B:-1},noise:4,max:100}
  ],
  rules:{
    l:{lib:'ldr',why:'异地时把对方理想化，搬到一起后理想会被日常打碎'}, g:{lib:'regret',why:'没去的那座城，会越来越常出现在你脑子里'}, i:{lib:'impact',why:'分手的打击，恢复得比你以为的快'},
    c:{lib:'coin',why:'做出改变的人，半年后心态往往更好'}, w:{lib:'weakties',why:'在新城市，机会多半来自不太熟的人'},
    h:{tier:'assume',name:'两个人的走向',field:'模型假设',says:'每年分手或决定结婚的概率是设定的，没有统计支撑。'},
    x:{tier:'analogy',name:'相濡以沫，不如相忘于江湖',field:'《庄子·大宗师》',says:'泉水干了，两条鱼挤在一起，用唾沫互相润湿。庄子说，不如各自游回江湖。'}
  },
  events:[
    {id:'lift',label:'改变后的轻松',text:{A:'搬过去的第一个月，你们每天一起吃晚饭。',B:''},p:{A:0.7,B:0},from:1,to:1,once:true,tone:'up',rule:'c',effects:{mood:{add:8},close:{add:5}}},
    {id:'clash',label:'日常的摩擦',text:{A:'住到一起第三个月，你们第一次为谁洗碗吵到半夜。',B:''},p:{A:0.4,B:0},knob:true,from:1,to:2,once:true,tone:'down',rule:'l',effects:{close:{add:-12},mood:{add:-6}}},
    {id:'settle',label:'找到相处的节奏',text:{A:'你们定下了周六各自出门、周日一起买菜的规矩。',B:''},p:{A:0.35,B:0},from:2,to:5,once:true,blockedBy:['split'],tone:'up',rule:null,effects:{close:{add:10},mood:{add:5}}},
    {id:'lonely',label:'新城市没朋友',text:{A:'周末对方加班，你在新城市找不到一个能约的人。',B:''},p:{A:0.35,B:0},from:1,to:3,tone:'down',rule:'h',effects:{mood:{add:-6}}},
    {id:'job',label:'在新城市找到机会',text:{A:'对方朋友的朋友在招人，你去聊了一次，就定了。',B:''},p:{A:0.25,B:0},from:1,to:5,once:true,tone:'up',rule:'w',effects:{work:{mul:1.15},mood:{add:6}}},
    {id:'visit',label:'见面的周末',text:{A:'',B:'高铁站出口，你一眼就认出对方的外套。'},p:{A:0,B:0.55},from:1,to:5,blockedBy:['split','moved'],tone:'up',rule:'l',effects:{close:{add:6},mood:{add:4}}},
    {id:'tired',label:'来回奔波',text:{A:'',B:'周日晚上的末班高铁上，你第三次错过了想说的话。'},p:{A:0,B:0.3},from:1,to:5,blockedBy:['split','moved'],tone:'down',rule:'h',effects:{mood:{add:-5},close:{add:-3}}},
    {id:'promo',label:'升职',text:{A:'',B:'你升了一级。打电话告诉对方时，对方在加班，说回头聊。'},p:{A:0,B:0.2},from:2,to:5,tone:'up',rule:null,effects:{work:{mul:1.12},mood:{add:4}}},
    {id:'merge',label:'终于有一个人搬了',text:{A:'',B:'你们终于定了，对方搬了过来。'},p:{A:0,B:0.22},knob:true,from:2,to:5,once:true,blockedBy:['split'],sets:'moved',tone:'up',rule:'h',effects:{close:{add:8},mood:{add:6}}},
    {id:'merge2',label:'约好的日子到了',text:{A:'',B:'约好的日子到了，你们把两个家并成了一个。'},p:{A:0,B:0.45},from:3,to:4,once:true,requires:'date',blockedBy:['split','moved'],sets:'moved',tone:'up',rule:'h',effects:{close:{add:10},mood:{add:6}}},
    {id:'reunion',label:'搬到一起后的落差',text:{A:'',B:'住到一起以后，你发现对方和视频里那个人不太一样。'},p:{A:0,B:0.4},from:2,to:5,once:true,requires:'moved',tone:'down',rule:'l',effects:{close:{add:-12}}},
    {id:'split',label:'分开',text:{A:'你们在一个很普通的周二晚上决定分开。',B:'一次很长的电话之后，你们决定分开。'},p:{A:0.06,B:0.07},knob:true,from:2,to:5,once:true,blockedBy:['wed'],sets:'split',tone:'down',rule:'h',effects:{close:{add:-50},mood:{add:-20}}},
    {id:'heal',label:'比想象中走得出来',text:'你以为会很久，结果半年后就能平静地提起这件事。',p:{A:0.6,B:0.6},from:3,to:5,once:true,requires:'split',tone:'up',rule:'i',effects:{mood:{add:14}}},
    {id:'wed',label:'决定结婚',text:{A:'你们去领了证，没办酒，晚上吃了一顿火锅。',B:''},p:{A:0.14,B:0},from:2,to:5,once:true,blockedBy:['split'],sets:'wed',tone:'up',rule:'h',effects:{close:{add:12},mood:{add:10}}},
    {id:'itch',label:'想起没走的路',text:{A:'原来的同事在群里发新项目上线的照片，你还在列表里。',B:''},p:{A:0.25,B:0},from:2,to:5,tone:'down',rule:'g',effects:{mood:{add:-6}}}
  ],
  choices:[
    {id:'work',year:1,path:'A',prompt:'对方的城市里，你的行业机会不多。',options:[
      {label:'降一级先上班',text:'你接了一个比原来低一级的岗位。',tone:'flat',rule:null,effects:{work:{add:-10},mood:{add:-3}}},
      {label:'先做自由职业',text:'你在家接原来客户的活，时间自由，收入不稳。',tone:'flat',rule:null,effects:{work:{add:-5},mood:{add:3}}}]},
    {id:'ask',year:2,path:'B',prompt:'视频里，对方问：我们打算什么时候结束异地？',options:[
      {label:'定一个日期',text:'你们在日历上圈了一个日子，一年以后。',sets:'date',tone:'flat',rule:null,effects:{close:{add:6}}},
      {label:'先不说',text:'你说等工作稳定一点再说。对方说好，然后沉默了一会儿。',tone:'flat',rule:null,effects:{close:{add:-6}}}]}
  ],
  closing:{A:'x',B:'x'}
};

BUILTIN.keys = ['大厂','中厂','边缘','核心部门','offer','秋招','校招','两个offer','部门','字节','阿里','腾讯'];
BUILTIN2.keys = ['辞职','单干','创业','自己做','副业','裸辞','存款','自由职业','小项目','再干一年'];
// 这两个岔路里，五到七年内收入一边倒，真正在比的是过得怎么样，所以把心态放在第一位比较
[BUILTIN3, BUILTIN5].forEach(b => { const i = b.meters.findIndex(m => m.id === 'mood'); b.meters.unshift(b.meters.splice(i, 1)[0]); b.meters[0].name = '满意度'; });
const PACKS = [BUILTIN, BUILTIN2, BUILTIN3, BUILTIN4, BUILTIN5, BUILTIN6];
// 和八十亿分之一一样，运行时不调用模型：在内置的岔路里找最接近的那个。
// 哪条路是改变现状、哪条更难回头。只标确定的，拿不准的留空。
const STANCE = {'辞职单干，还是再干一年':{change:'A',lock:'A'}, '留在一线，还是回老家':{change:'B'}, '去对方的城市，还是继续异地':{change:'A'}};
PACKS.forEach(p => { if(STANCE[p.title]) p.stance = STANCE[p.title]; });
function matchPack(q){
  const t = String(q).toLowerCase(); let best = null, bs = 0;
  PACKS.forEach(p => { const s = (p.keys||[]).reduce((n,k) => n + (t.includes(k.toLowerCase()) ? (k.length >= 3 ? 2 : 1) : 0), 0); if(s > bs){ bs = s; best = p; } });
  return best;
}

// 道理库：规律库说「事情通常会怎样」，道理库说「所以该怎么判断」。每条都有论文出处。
// 用法见下面的 judge()：按玩家最看重的那一项，把适用的道理逐条套到两条路上。
const DAOLI = {
  outside:{name:'外部视角', field:'决策心理学', says:'人习惯把自己的处境当成独一份，只按自己的计划和想象去估计，忽略同类情况的统计结果。看同类的整体分布，比看自己那一个故事准。', src:'Kahneman、Lovallo，Management Science，1993', url:'https://consensus.app/papers/details/362af47ccd0951fdbdcba53cf4e1a7ba/?utm_source=claude_desktop'},
  outcome:{name:'结果偏差', field:'决策心理学', says:LIB.outcome.says, src:LIB.outcome.src, url:LIB.outcome.url},
  coin:{name:'拿不定时，改变的人更快乐', field:'行为经济学', says:LIB.coin.says, src:LIB.coin.src, url:LIB.coin.url},
  regret:{name:'长期更后悔没做的事', field:'社会心理学', says:LIB.regret.says, src:LIB.regret.src, url:LIB.regret.url},
  loss:{name:'损失厌恶', field:'行为经济学', says:'同样大小的一失一得，失去带来的分量更重。人因此会为了躲开可能的损失，放弃总体更好的选择。', src:'Tversky、Kahneman，Quarterly Journal of Economics，1991', url:'https://consensus.app/papers/details/5f19e28f50235111b12d89fa42b36c13/?utm_source=claude_desktop'},
  logmoney:{name:'钱按倍数起作用', field:'幸福感研究', says:'幸福感大致随收入的对数上升：从一万到两万，和从十万到二十万，带来的提升差不多。所以比钱要看倍数，不看差额；少掉一半比多出一半更疼。', src:'Killingsworth、Kahneman、Mellers，PNAS，2023', url:'https://consensus.app/papers/details/d81abcc1dc615413a0ea4d2d91a07bad/?utm_source=claude_desktop'},
  feelmoney:{name:'钱管评价，不管心情', field:'幸福感研究', says:'盖洛普全球调查里，收入能预测人对自己生活的总体评价，但对每天心情的预测弱得多。每天的心情更多取决于有没有在学东西、能不能自己做主、是否被尊重、遇事有没有人可靠。', src:'Diener 等，Journal of Personality and Social Psychology，2010', url:'https://consensus.app/papers/details/391ec16ed8825869b92bd05b0423a87a/?utm_source=claude_desktop'},
  focus:{name:'聚焦错觉', field:'决策心理学', says:'比较两种生活时，最显眼的那个差别会被看得过重。中西部的学生以为加州人更幸福，实际两地的生活满意度一样。', src:'Schkade、Kahneman，Psychological Science，1998', url:'https://consensus.app/papers/details/957ce277f8ad5b43aff5b05ae1362f76/?utm_source=claude_desktop'},
  impact:{name:'影响力偏差', field:'社会心理学', says:LIB.impact.says, src:LIB.impact.src, url:LIB.impact.url},
  revers:{name:'能反悔的决定，反而不满意', field:'社会心理学', says:'人都想给自己留退路。可实验里，可以反悔的人对自己选的东西更不满意，不能反悔的人反而更喜欢自己的选择。', src:'Gilbert、Ebert，Journal of Personality and Social Psychology，2002', url:'https://consensus.app/papers/details/9ed25d26747758fb85ddc8a28ae5d311/?utm_source=claude_desktop'},
  maxim:{name:'非要挑出最优的人更不快乐', field:'社会心理学', says:'一心要选到最好的人，比觉得够好就行的人更不快乐、更容易后悔。这是欧美样本的结果；后来在中国样本里，这层关系不明显。', src:'Schwartz 等，Journal of Personality and Social Psychology，2002', url:'https://consensus.app/papers/details/83dd10e5fedd500ca6793e3875ca7f3f/?utm_source=claude_desktop'},
  // 兵法、寓言、古语、俗语：前人的经验，不是统计证据。kind 标类别，src 标原书。
  floor:{kind:'兵法', name:'先为不可胜', field:'《孙子兵法·形篇》', says:'「昔之善战者，先为不可胜，以待敌之可胜。不可胜在己，可胜在敌。」先保证自己输不掉，再等赢的机会。', src:'《孙子兵法·形篇》', url:''},
  bubai:{kind:'兵法', name:'立于不败之地', field:'《孙子兵法·形篇》', says:'「故善战者，立于不败之地，而不失敌之败也。」会打仗的人先站在输不了的位置上。', src:'《孙子兵法·形篇》', url:''},
  suan:{kind:'兵法', name:'多算胜，少算不胜', field:'《孙子兵法·计篇》', says:'「夫未战而庙算胜者，得算多也；未战而庙算不胜者，得算少也。多算胜，少算不胜。」开打之前算下来胜算多的一方，才值得打。', src:'《孙子兵法·计篇》', url:''},
  xiansheng:{kind:'兵法', name:'胜兵先胜而后求战', field:'《孙子兵法·形篇》', says:'「是故胜兵先胜而后求战，败兵先战而后求胜。」赢的人是先有了赢面才动手，输的人是先动手再去碰运气。', src:'《孙子兵法·形篇》', url:''},
  wuchang:{kind:'兵法', name:'兵无常势，水无常形', field:'《孙子兵法·虚实篇》', says:'「故兵无常势，水无常形，能因敌变化而取胜者，谓之神。」局面没有固定的样子，眼下的强弱说变就变。', src:'《孙子兵法·虚实篇》', url:''},
  heli:{kind:'兵法', name:'合于利而动，不合于利而止', field:'《孙子兵法·火攻篇》', says:'「非利不动，非得不用，非危不战。」「合于利而动，不合于利而止。」动不动，只看动了有没有好处，不看心里痒不痒。', src:'《孙子兵法·火攻篇》', url:''},
  jiubian:{kind:'兵法', name:'城有所不攻，地有所不争', field:'《孙子兵法·九变篇》', says:'「涂有所不由，军有所不击，城有所不攻，地有所不争。」有的路不走，有的城不打，有的地不争。放掉一些，才守得住要紧的。', src:'《孙子兵法·九变篇》', url:''},
  zouwei:{kind:'兵法', name:'三十六策，走是上计', field:'《南齐书·王敬则传》', says:'「檀公三十六策，走是上计。」局面一年不如一年的时候，离开不丢人，是上策。', src:'《南齐书·王敬则传》', url:''},
  zhibi:{kind:'兵法', name:'知彼知己，百战不殆', field:'《孙子兵法·谋攻篇》', says:'「知彼知己，百战不殆；不知彼而知己，一胜一负；不知彼，不知己，每战必殆。」只了解外面的形势、不了解自己，胜负各半。', src:'《孙子兵法·谋攻篇》', url:''},
  swift:{kind:'兵法', name:'兵闻拙速', field:'《孙子兵法·作战篇》', says:'「故兵闻拙速，未睹巧之久也。」打仗只听说过笨拙但快的，没见过精巧却拖得久的。拖着本身就在消耗。', src:'《孙子兵法·作战篇》', url:''},
  deadground:{kind:'兵法', name:'陷之死地然后生', field:'《孙子兵法·九地篇》', says:'「投之亡地然后存，陷之死地然后生。」没有退路的时候，人才会把全部力气用出来。', src:'《孙子兵法·九地篇》', url:''},
  saiweng:{kind:'寓言', name:'塞翁失马', field:'《淮南子·人间训》', says:'边塞老人丢了马，马带回了胡人的骏马；儿子骑骏马摔断了腿，却因此躲过了征兵。一时的得失会翻过来。', src:'《淮南子·人间训》', url:''},
  stump:{kind:'寓言', name:'守株待兔', field:'《韩非子·五蠹》', says:'宋国农夫捡到一只撞死在树桩上的兔子，「因释其耒而守株，冀复得兔」。撞上一次的好运，不能当成每年的收成。', src:'《韩非子·五蠹》', url:''},
  threefour:{kind:'寓言', name:'朝三暮四', field:'《庄子·齐物论》', says:'早上三颗晚上四颗，猴子都怒；早上四颗晚上三颗，猴子都喜。「名实未亏而喜怒为用」，总数没变，变的只是先后。', src:'《庄子·齐物论》', url:''},
  mend:{kind:'寓言', name:'亡羊补牢', field:'《战国策·楚策四》', says:'「见兔而顾犬，未为晚也；亡羊而补牢，未为迟也。」出了错还能补救的局面，错的代价有上限。', src:'《战国策·楚策四》', url:''},
  tortoise:{kind:'寓言', name:'龟兔赛跑', field:'《伊索寓言》', says:'兔子起步快，中途睡了一觉；乌龟一直走，先到了终点。起点高低是一回事，每年往前走多少是另一回事。', src:'《伊索寓言》', url:''},
  kezhou:{kind:'寓言', name:'刻舟求剑', field:'《吕氏春秋·察今》', says:'剑掉进江里，楚人在船帮上刻了个记号，等船停了从记号处下水去找。「舟已行矣，而剑不行，求剑若此，不亦惑乎。」局面在走，按老位置找东西找不到。', src:'《吕氏春秋·察今》', url:''},
  bamiao:{kind:'寓言', name:'揠苗助长', field:'《孟子·公孙丑上》', says:'宋人嫌禾苗长得慢，一棵棵往上拔，回家说「今日病矣，予助苗长矣」，儿子跑去一看，苗都枯了。急着要早见效，反而毁了后面的收成。', src:'《孟子·公孙丑上》', url:''},
  yugong:{kind:'寓言', name:'愚公移山', field:'《列子·汤问》', says:'「子子孙孙无穷匮也，而山不加增，何苦而不平。」每年挪一点，山不会再长高，时间站在一直做的人这边。', src:'《列子·汤问》', url:''},
  maidu:{kind:'寓言', name:'买椟还珠', field:'《韩非子·外储说左上》', says:'郑国人看中了装珍珠的木匣，「买其椟而还其珠」。被最好看的那部分吸引，把真正值钱的退了回去。', src:'《韩非子·外储说左上》', url:''},
  jingdi:{kind:'寓言', name:'井底之蛙', field:'《庄子·秋水》', says:'「井蛙不可以语于海者，拘于虚也。」一直待在原处的人，会把眼前这口井当成全部。', src:'《庄子·秋水》', url:''},
  jiaotu:{kind:'寓言', name:'狡兔三窟', field:'《战国策·齐策四》', says:'冯谖对孟尝君说：「狡兔有三窟，仅得免其死耳。」多留一条退路，为的是出事时不至于没处去。', src:'《战国策·齐策四》', url:''},
  mangren:{kind:'寓言', name:'盲人摸象', field:'《大般涅槃经》', says:'几个盲人各摸到大象的一部分，摸到腿的说象像柱子，摸到耳朵的说像簸箕。只碰到一处的人，说的都是真的，也都不是全貌。', src:'《大般涅槃经》', url:''},
  guanzhong:{kind:'寓言', name:'管中窥豹', field:'《世说新语·方正》', says:'「此郎亦管中窥豹，时见一斑。」从竹管里看豹子，只看得见一块斑。', src:'《世说新语·方正》', url:''},
  beigong:{kind:'寓言', name:'杯弓蛇影', field:'《晋书·乐广传》', says:'客人把墙上弓的影子看成杯里的蛇，喝下去后病了一场；弄清是影子，病就好了。一次吓人的经历，会让人长久地怕一个并不存在的东西。', src:'《晋书·乐广传》', url:''},
  zhishang:{kind:'寓言', name:'纸上谈兵', field:'《史记·廉颇蔺相如列传》', says:'赵括谈起兵法无人能驳倒，真领兵时四十万赵军覆没。推演得再漂亮，也替代不了真上场。', src:'《史记·廉颇蔺相如列传》', url:''},
  pofu:{kind:'寓言', name:'破釜沉舟', field:'《史记·项羽本纪》', says:'项羽渡河后「皆沉船，破釜甑，烧庐舍，持三日粮，以示士卒必死，无一还心」，九战九胜。', src:'《史记·项羽本纪》', url:''},
  huabing:{kind:'寓言', name:'画饼充饥', field:'《三国志·魏书·卢毓传》', says:'「名如画地作饼，不可啖也。」画出来的饼不能吃。只在最好的情形里才兑现的好处，平常日子里填不了肚子。', src:'《三国志·魏书·卢毓传》', url:''},
  goose:{kind:'寓言', name:'生金蛋的鹅', field:'《伊索寓言》', says:'农夫嫌鹅每天只下一个金蛋太慢，杀了鹅想一次取完，肚子里什么也没有。为了眼前多拿一点，把以后每年都有的那份断了。', src:'《伊索寓言》', url:''},
  milkmaid:{kind:'寓言', name:'挤牛奶的姑娘', field:'《伊索寓言》', says:'姑娘头顶牛奶去卖，一路盘算卖了奶买蛋、蛋孵鸡、鸡换裙子，一得意摇了摇头，牛奶全洒了。还没到手的好结果，不能提前算进账里。', src:'《伊索寓言》', url:''},
  dogshadow:{kind:'寓言', name:'叼肉的狗', field:'《伊索寓言》', says:'狗叼着肉过桥，看见水里的倒影以为是另一块更大的肉，张嘴去抢，嘴里的肉掉进了河里。', src:'《伊索寓言》', url:''},
  foxgrapes:{kind:'寓言', name:'狐狸和葡萄', field:'《伊索寓言》', says:'狐狸够不着葡萄，就说葡萄是酸的。路一旦定了，人会自己把没选的那条说得没那么好。', src:'《伊索寓言》', url:''},
  ant:{kind:'寓言', name:'蚂蚁和蚱蜢', field:'《伊索寓言》', says:'夏天蚂蚁搬粮，蚱蜢唱歌；到了冬天，蚱蜢来向蚂蚁讨吃的。前几年舒服的那条路，后几年未必还舒服。', src:'《伊索寓言》', url:''},
  buridan:{kind:'寓言', name:'布里丹的驴', field:'中世纪哲学寓言，托名布里丹', says:'一头驴站在两堆一模一样的干草中间，哪一堆都没有更好的理由先吃，最后饿死了。两边差不多的时候，不选才是最差的选法。', src:'中世纪哲学寓言，托名布里丹', url:''},
  zhengren:{kind:'寓言', name:'郑人买履', field:'《韩非子·外储说左上》', says:'郑国人量好脚的尺寸去买鞋，到了集市发现尺码忘在家里，回去取，集市已经散了。问他为什么不用脚试，他说「宁信度，无自信也」。', src:'《韩非子·外储说左上》', url:''},
  yegong:{kind:'寓言', name:'叶公好龙', field:'刘向《新序·杂事五》', says:'叶公满屋子画龙，真龙来了却吓得掉头就跑。「是叶公非好龙也，好夫似龙而非龙者也。」喜欢的可能是想象里的那条路，不是真走上去的那条。', src:'刘向《新序·杂事五》', url:''},
  qutu:{kind:'寓言', name:'曲突徙薪', field:'《汉书·霍光传》', says:'客人劝主人把烟囱改弯、把柴草搬开，主人不听，后来果然失火。「曲突徙薪亡恩泽，焦头烂额为上客」，事先防住的灾没人记得，可它最划算。', src:'《汉书·霍光传》', url:''},
  bearpaw:{kind:'古语', name:'鱼与熊掌', field:'《孟子·告子上》', says:'「鱼，我所欲也；熊掌，亦我所欲也。二者不可得兼，舍鱼而取熊掌者也。」两样只能得一样时，取自己更看重的那样，另一样就认了。', src:'《孟子·告子上》', url:''},
  yusu:{kind:'古语', name:'欲速则不达', field:'《论语·子路》', says:'「无欲速，无见小利。欲速则不达，见小利则大事不成。」', src:'《论语·子路》', url:''},
  yuanlv:{kind:'古语', name:'人无远虑，必有近忧', field:'《论语·卫灵公》', says:'「人无远虑，必有近忧。」只看头一两年的人，麻烦会来得更早。', src:'《论语·卫灵公》', url:''},
  zaisi:{kind:'古语', name:'再，斯可矣', field:'《论语·公冶长》', says:'「季文子三思而后行。子闻之，曰：再，斯可矣。」孔子的意思是想两遍就够了，想太多反而生出私心和犹豫。', src:'《论语·公冶长》', url:''},
  xiaoburen:{kind:'古语', name:'小不忍则乱大谋', field:'《论语·卫灵公》', says:'「小不忍，则乱大谋。」前面那段难熬的日子熬不过去，后面的打算就都落空。', src:'《论语·卫灵公》', url:''},
  kuibu:{kind:'古语', name:'不积跬步，无以至千里', field:'《荀子·劝学》', says:'「不积跬步，无以至千里；不积小流，无以成江海。」', src:'《荀子·劝学》', url:''},
  hebao:{kind:'古语', name:'合抱之木，生于毫末', field:'《老子》第六十四章', says:'「合抱之木，生于毫末；九层之台，起于累土；千里之行，始于足下。」', src:'《老子》第六十四章', url:''},
  daqi:{kind:'古语', name:'大器晚成', field:'《老子》第四十一章', says:'「大方无隅，大器晚成。」大的东西成得晚。', src:'《老子》第四十一章', url:''},
  huofu:{kind:'古语', name:'祸兮福之所倚', field:'《老子》第五十八章', says:'「祸兮，福之所倚；福兮，祸之所伏。」坏事里靠着好事，好事里藏着坏事。', src:'《老子》第五十八章', url:''},
  zhizu44:{kind:'古语', name:'知足不辱，知止不殆', field:'《老子》第四十四章', says:'「知足不辱，知止不殆，可以长久。」知道够了就不会受辱，知道停就不会遇险。', src:'《老子》第四十四章', url:''},
  zhizu:{kind:'古语', name:'知足者富', field:'《老子》第三十三章', says:'「知足者富。」觉得够了的人，才算富。', src:'《老子》第三十三章', url:''},
  qiongbian:{kind:'古语', name:'穷则变，变则通', field:'《周易·系辞下》', says:'「穷则变，变则通，通则久。」路走到头就该变，变了才通，通了才长久。', src:'《周易·系辞下》', url:''},
  youhuan:{kind:'古语', name:'生于忧患，死于安乐', field:'《孟子·告子下》', says:'「然后知生于忧患而死于安乐也。」安稳的地方最容易让人不知不觉地垮掉。', src:'《孟子·告子下》', url:''},
  yanqiang:{kind:'古语', name:'不立乎岩墙之下', field:'《孟子·尽心上》', says:'「是故知命者不立乎岩墙之下。」明白事理的人不站在快要倒的墙底下。', src:'《孟子·尽心上》', url:''},
  buwei:{kind:'古语', name:'有不为，而后可以有为', field:'《孟子·离娄下》', says:'「人有不为也，而后可以有为。」先定下哪些不做，才做得成要做的。', src:'《孟子·离娄下》', url:''},
  jinxinshu:{kind:'古语', name:'尽信书，则不如无书', field:'《孟子·尽心下》', says:'「尽信《书》，则不如无《书》。」什么都照书上的信，还不如没有书。', src:'《孟子·尽心下》', url:''},
  linyuan:{kind:'古语', name:'临渊羡鱼，不如退而结网', field:'《汉书·董仲舒传》', says:'「临渊羡鱼，不如退而结网。」站在水边眼馋，不如回去织网。', src:'《汉书·董仲舒传》', url:''},
  hukou:{kind:'古语', name:'不入虎穴，不得虎子', field:'《后汉书·班超传》', says:'「不入虎穴，不得虎子。」想要那个上限，只能进去。', src:'《后汉书·班超传》', url:''},
  dangduan:{kind:'古语', name:'当断不断，反受其乱', field:'《史记·齐悼惠王世家》', says:'「当断不断，反受其乱。」该定的时候不定，乱子反而落到自己头上。', src:'《史记·齐悼惠王世家》', url:''},
  quda:{kind:'古语', name:'利之中取大，害之中取小', field:'《墨子·大取》', says:'「利之中取大，害之中取小也。」几样好处里拿大的，几样坏处里挑小的。', src:'《墨子·大取》', url:''},
  cangling:{kind:'古语', name:'仓廪实则知礼节', field:'《管子·牧民》', says:'「仓廪实则知礼节，衣食足则知荣辱。」先得吃穿不愁，别的才谈得上。', src:'《管子·牧民》', url:''},
  yidan:{kind:'古语', name:'一箪食，一瓢饮', field:'《论语·雍也》', says:'「一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐。」颜回过得清苦，别人受不了，他的快乐不变。', src:'《论语·雍也》', url:''},
  dongyu:{kind:'古语', name:'失之东隅，收之桑榆', field:'《后汉书·冯异传》', says:'「失之东隅，收之桑榆。」这头丢掉的，会在那头收回来一些。', src:'《后汉书·冯异传》', url:''},
  weiyu:{kind:'古语', name:'未雨绸缪', field:'《诗经·豳风·鸱鸮》', says:'「迨天之未阴雨，彻彼桑土，绸缪牖户。」趁天还没下雨，先把门窗缠牢。', src:'《诗经·豳风·鸱鸮》', url:''},
  qingshan:{kind:'古语', name:'留得青山在，不怕没柴烧', field:'《初刻拍案惊奇》卷二十二', says:'「留得青山在，不怕没柴烧。」底子保住了，就还有下一次。', src:'《初刻拍案惊奇》卷二十二', url:''},
  shunuo:{kind:'俗语', name:'树挪死，人挪活', field:'民间俗语', says:'树挪了地方容易死，人换个地方反而活得开。', src:'民间俗语', url:''},
  yidong:{kind:'俗语', name:'一动不如一静', field:'民间俗语', says:'没有把握的时候，动一下不如先不动。', src:'民间俗语', url:''},
  zheshan:{kind:'俗语', name:'这山望着那山高', field:'民间俗语', says:'站在这座山上，总觉得对面那座更高；真过去了，回头看这座也一样高。', src:'民间俗语', url:''},
  xianzhong:{kind:'俗语', name:'富贵险中求', field:'民间俗语', says:'大的好处都在有风险的地方。', src:'民间俗语', url:''},
  modao:{kind:'俗语', name:'磨刀不误砍柴工', field:'民间俗语', says:'花在磨刀上的时间，会在砍柴的时候赚回来。', src:'民间俗语', url:''},
  wannian:{kind:'俗语', name:'小心驶得万年船', field:'民间俗语', says:'慢一点、稳一点的船，开得最久。', src:'民间俗语', url:''}
};
const MONEY = /收入|薪|工资|钱|存款|宽裕|pay|income|salary|wealth|money/i, FEEL = /满意|心态|幸福|快乐|心情|舒心|mood|wellbeing|happy|satisf/i;
function meterKind(m){ const t = m.id + ' ' + m.name; return MONEY.test(t) ? 'money' : FEEL.test(t) ? 'feel' : 'other'; }
// 一千对里 A 更高的比例、谁领先。不到 58% 算分不出。
function leadOf(runs, id){ const n = Math.min(runs.A.length, runs.B.length); let w = 0;
  for(let i=0;i<n;i++){ const a = runs.A[i].final[id], b = runs.B[i].final[id]; w += a>b ? 1 : a===b ? 0.5 : 0; }
  const pA = w/n, pct = Math.round(Math.max(pA, 1-pA)*100); return {pA, pct, lead: pct < 58 ? null : (pA >= 0.5 ? 'A' : 'B')}; }
// 按玩家最看重的那一项 focusId 下判断。先从模拟结果里读出若干「论点」（比如：最差的一成里谁更输不掉），
// 每个论点偏向一条路或只是提醒，下面挂着支持它的道理（for）和说法相反的道理（counter）。偏向按论点数比，不按道理条数比。
function judge(pack, runs, focusId, mine){
  const m = pack.meters.find(x => x.id === focusId) || pack.meters[0], id = m.id, kind = meterKind(m), nm = k => '「' + pack.options[k].name + '」', other = k => k === 'A' ? 'B' : 'A';
  const L = {}; pack.meters.forEach(x => L[x.id] = leadOf(runs, x.id)); const F = L[id], st = pack.stance || {}, points = [];
  const q = (k, p) => quant(runs[k].map(r => r.final[id]).sort((a,b) => a-b), p);
  const pick = keys => keys.filter(k => DAOLI[k]).map(k => Object.assign({id:k, kind:'研究'}, DAOLI[k]));
  const add = (key, side, text, fr, counter, weight) => points.push({id:key, side, text, weight: side ? (weight || 1) : 0, items: pick(fr), counter: pick(counter || [])});
  const saw = mine && mine.A !== mine.B ? (mine.A > mine.B ? 'A' : 'B') : null;
  const lo = {A:q('A',0.1), B:q('B',0.1)}, mid = {A:q('A',0.5), B:q('B',0.5)}, hi = {A:q('A',0.9), B:q('B',0.9)}, gapThr = Math.max(2, 0.04*Math.max(mid.A, mid.B));
  const hiDrift = m.drift.A === m.drift.B ? null : (m.drift.A > m.drift.B ? 'A' : 'B'), hiStart = m.start.A === m.start.B ? null : (m.start.A > m.start.B ? 'A' : 'B');
  const against = pack.meters.filter(x => x.id !== id && L[x.id].lead && F.lead && L[x.id].lead !== F.lead);
  const close = pack.meters.filter(x => !L[x.id].lead).length;
  // 胜算
  if(F.lead) add('lead', F.lead, '一千对你里，' + nm(F.lead) + '的' + m.name + '更高的占 ' + F.pct + '%。胜算在它这边。', F.pct >= 80 ? ['outside','suan','xiansheng'] : ['outside','suan'], F.pct < 75 ? ['wuchang'] : []);
  else add('nolead', null, '一千对你里两条路各赢一半左右（' + F.pct + '%）。在' + m.name + '上，算不出谁的胜算多。', ['outside','suan']);
  // 你走的那一遍和大盘相反
  if(saw && F.lead && saw !== F.lead) add('onerun', null, '你亲身走的那一遍里' + nm(saw) + '更高，和一千遍的多数相反。那一遍是结果，不是选择的好坏。', ['outcome','guanzhong','mangren','beigong']);
  // 一遍定不了论
  if(F.pct < 75) add('flip', null, '在' + m.name + '上，只看一遍就下结论，有 ' + (100 - F.pct) + '% 的可能看反。', ['saiweng','huofu','wuchang']);
  // 钱按倍数算
  if(kind === 'money'){ const g = k => { let t = 0; runs[k].forEach(r => t += Math.log(Math.max(1, r.final[id]))); return t/runs[k].length; }, d = g('A') - g('B');
    if(Math.abs(d) >= 0.04){ const k = d > 0 ? 'A' : 'B'; add('logmoney', k, '钱要按倍数比。折算后' + nm(k) + '平均高出约 ' + Math.round((Math.exp(Math.abs(d))-1)*100) + '%。' + (F.lead && F.lead !== k ? '它赢的次数少，但输的时候输得浅。' : ''), ['logmoney']); }
    else add('logmoney', null, '钱要按倍数比。折算后两条路的' + m.name + '差不到 4%，带不来多少感受上的不同。', ['logmoney','zhizu']); }
  // 输不掉
  if(Math.abs(lo.A - lo.B) >= gapThr){ const k = lo.A > lo.B ? 'A' : 'B'; add('floor', k, '运气最差的那一成里，' + nm(k) + '的' + m.name + '是 ' + lo[k] + '，' + nm(other(k)) + '是 ' + lo[other(k)] + '。' + nm(k) + '更输不掉。', ['floor','bubai','yanqiang','weiyu','qutu','qingshan','wannian'], ['hukou','xianzhong']); }
  // 领先的那条下行更深：害怕会被放大
  if(F.lead && lo[F.lead] < lo[other(F.lead)] - gapThr) add('loss', null, nm(F.lead) + '多数时候更高，可最差时会落到 ' + lo[F.lead] + '。人对这种下行的害怕是放大过的：先问自己落到那里扛不扛得住，扛得住就别让害怕替你选。', ['loss','hukou','xianzhong'], ['yanqiang']);
  // 只赢在好运上
  ['A','B'].forEach(k => { const o = other(k); if(hi[k] - hi[o] >= gapThr && mid[o] - mid[k] >= gapThr) add('tail', o, nm(k) + '最好的一成能到 ' + hi[k] + '，高过' + nm(o) + '的 ' + hi[o] + '；可寻常年景它是 ' + mid[k] + '，低于' + nm(o) + '的 ' + mid[o] + '。它赢在少数的好运上。', ['stump','milkmaid','huabing','dogshadow'], ['hukou']); });
  // 钱和心情指向两边
  const money = pack.meters.find(x => meterKind(x) === 'money'), feel = pack.meters.find(x => meterKind(x) === 'feel');
  if(money && feel && L[money.id].lead && L[feel.id].lead && L[money.id].lead !== L[feel.id].lead){ const fk = L[feel.id].lead, mk = L[money.id].lead;
    if(kind === 'feel') add('feelmoney', fk, nm(mk) + '钱更多，' + nm(fk) + '的' + feel.name + '更好。你看重的这一项，是钱换不来的那部分。', ['feelmoney','yidan','zhizu','zhizu44'], ['cangling']);
    else add('feelmoney', null, nm(mk) + '钱更多，' + nm(fk) + '的' + feel.name + '更好。多出来的钱抬高的是「我过得不错」的评价，每天舒不舒心另算。', ['feelmoney','zhizu44','yidan'], ['cangling']); }
  // 变还是不变
  if(st.change === 'A' || st.change === 'B'){ const c = st.change, s0 = other(c);
    if(F.lead === c) add('heli', c, nm(c) + '是改变现状的那条，而它在' + m.name + '上占优。动了有好处，就该动。', ['heli','shunuo','linyuan'], ['yidong']);
    else if(F.lead === s0) add('heli', s0, nm(c) + '是改变现状的那条，可在' + m.name + '上占优的是不动的' + nm(s0) + '。动了没有好处，就不动。', ['heli','yidong','zheshan'], ['shunuo','jingdi']);
    else add('coin', c, '在' + m.name + '上两条路接近，正是拿不定的情形。实验里，这种时候做了改变的人半年后更快乐。' + nm(c) + '是改变的那条。', ['coin','shunuo','linyuan'], ['heli','yidong','zheshan']);
    add('regret', c, nm(c) + '是「去做」的那条，' + nm(s0) + '是「不做」的那条。长期看，人更后悔没做的事。这条研究的重复实验效应偏弱，只算半个论点。', ['regret','jingdi'], ['yegong'], 0.5);
    if(mid[s0] < m.start[s0] - gapThr) add('decline', c, '不动的话，' + nm(s0) + '的' + m.name + '寻常年景会从 ' + Math.round(m.start[s0]) + ' 落到 ' + mid[s0] + '。原地在往下走。', ['qiongbian','zouwei','kezhou','youhuan']); }
  // 别的指标在另一边
  if(against.length){
    add('trade', F.lead, '你要的是' + m.name + '，它在' + nm(F.lead) + '这边；' + against.map(x => x.name).join('、') + '在另一边。两样不能都要，按你自己说的，取' + m.name + '。', ['bearpaw','buwei','quda','jiubian'], ['dongyu']);
    add('focus', null, '可也别只盯着' + m.name + '。比较两种生活时，最显眼的那个差别会被看得过重，真过起来分量没那么大。', ['focus','maidu']); }
  // 比的是心情
  if(kind === 'feel' && F.lead) add('impact', null, '这里比的是' + m.name + '。人会高估一件事对情绪的影响有多强、多久，现实里两条路的差距多半比模拟的小。', ['impact']);
  // 先甜后甜
  if(hiDrift && hiStart && hiDrift !== hiStart) add('slowfast', F.lead === hiDrift ? hiDrift : null, nm(hiStart) + '起点高，' + nm(hiDrift) + '每年涨得多。' + (F.lead === hiDrift ? pack.years + ' 年下来，涨得多的那条已经追过去了。' : pack.years + ' 年里还没追上；年头再长，会更接近。'), ['tortoise','kuibu','hebao','yugong','daqi','modao','xiaoburen','yusu','bamiao']);
  const yr1 = k => { let t = 0; runs[k].forEach(r => t += r.years[0].val[id]); return t/runs[k].length; }, e = yr1('A') - yr1('B');
  if(F.lead && Math.abs(e) >= gapThr && (e > 0 ? 'A' : 'B') !== F.lead) add('longrun', F.lead, '第一年是' + nm(other(F.lead)) + '的' + m.name + '更高，到第 ' + pack.years + ' 年是' + nm(F.lead) + '更高。只看头一年会选反。', ['yuanlv','goose','ant','yusu']);
  if(!F.lead && hiStart && Math.abs(m.start.A - m.start.B) >= gapThr) add('samesum', null, nm(hiStart) + '一开始的' + m.name + '更高，可 ' + pack.years + ' 年后两条路分不出高下。差的只是先甜还是后甜。', ['threefour']);
  // 难回头
  if(st.lock === 'A' || st.lock === 'B'){ const k = st.lock, o = other(k);
    add('mend', o, nm(o) + '走错了还能改，' + nm(k) + '难回头。能补救的那条，错的代价有上限。', ['mend','jiaotu'], ['deadground','pofu','revers']);
    add('commit', null, '但别因为' + nm(k) + '没有退路就给它扣太多分。断了退路的人会把力气都用上，事后也更容易对自己的选择满意。', ['revers','deadground','pofu','foxgrapes']); }
  // 差不多就定
  if(close * 2 >= pack.meters.length) add('close', null, pack.meters.length + ' 项里有 ' + close + ' 项两条路分不出高下。再比也比不出最优，拖着本身有代价。', ['maxim','swift','dangduan','zaisi','buridan']);
  // 模拟不认识你
  add('self', null, '这些数字知道两条路大概什么样，不知道你是谁、输不输得起。它们是纸面上的推演。和你自己的感受对不上时，别急着信数字。', ['zhibi','zhengren','jinxinshu','zhishang']);
  const score = {A:0, B:0}; points.forEach(p => { if(p.side) score[p.side] += p.weight; });
  const side = Math.abs(score.A - score.B) < 0.75 ? null : (score.A > score.B ? 'A' : 'B');
  return {focus:id, side, score, lead:L, points};
}
// 道理账：把每条规律单独拿掉重跑，看它把两条路的差距（A 减 B）往哪边推了多少。正数是往 A 推。
// 起点和年增长、没挂规律的事件，都记成「设定」，和有出处的规律分开算。
function argue(pack, n){
  n = n || 300;
  const gap = p => { const o = {}, rs = {A: batch(p,'A',n,70001), B: batch(p,'B',n,70002)};
    p.meters.forEach(m => { let a = 0, b = 0; for(let i=0;i<n;i++){ a += rs.A[i].final[m.id]; b += rs.B[i].final[m.id]; } o[m.id] = (a-b)/n; }); return o; };
  const without = hit => Object.assign({}, pack, {
    events: pack.events.map(e => hit(e.rule) ? Object.assign({}, e, {p:{A:0,B:0}}) : e),
    choices: pack.choices.map(c => Object.assign({}, c, {options: c.options.map(o => hit(o.rule) ? Object.assign({}, o, {effects:{}}) : o)}))});
  const base = gap(pack), items = [];
  const tiltOf = g => { const t = {}; pack.meters.forEach(m => t[m.id] = base[m.id] - g[m.id]); return t; };
  const used = new Set(); pack.events.forEach(e => used.add(e.rule)); pack.choices.forEach(c => c.options.forEach(o => { if(Object.keys(o.effects).length) used.add(o.rule); }));
  Object.keys(pack.rules).forEach(id => { const r = pack.rules[id]; if(r.tier === 'analogy' || !used.has(id)) return;
    items.push({id, tier: r.tier, tilt: tiltOf(gap(without(x => x === id)))}); });
  if(used.has(null)) items.push({id:'_none', tier:'assume', tilt: tiltOf(gap(without(x => x === null)))});
  items.push({id:'_base', tier:'assume', tilt: gap(without(() => true))});
  return {base, items};
}
if(typeof module!=='undefined') module.exports={LIB,DAOLI,judge,leadOf,meterKind,argue,sanitize,simulate,batch,summarize,newLife,pending,stepYear,quant,BUILTIN,BUILTIN2,PACKS,matchPack};
