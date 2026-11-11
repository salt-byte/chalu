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
  bflp:{name:'大鱼小池塘',field:'教育心理学',tier:'analogy',says:'能力相同的学生，在平均水平更高的学校里对自己的评价更低。127 万名学生的汇总效应为 −0.28。证据来自学校，用到别处是类比。',src:'Fang 等，Frontiers in Psychology，元分析',url:'https://consensus.app/papers/details/w:c6956f5a-c7dc-4eeb-9741-f20f5615cffe/?utm_source=claude_desktop'}
};

// 把任何来源的包洗成引擎能跑的形状。模型输出不可信，所有字段都钳住。
function sanitize(raw){
  if(!raw || typeof raw!=='object') throw new Error('没有拿到岔路包');
  if(raw.refuse) return {refuse: String(raw.refuse).slice(0,300)};
  const S = (v,n)=>String(v==null?'':v).slice(0,n||200);
  const pack = {title:S(raw.title,40)||'岔路', question:S(raw.question,300), caveat:S(raw.caveat,400), builtin:!!raw.builtin,
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
  Object.keys(rr).slice(0,24).forEach(id=>{
    const r=rr[id]||{}; const lib = r.lib && LIB[r.lib];
    if(lib) pack.rules[id]={name:lib.name,field:lib.field,says:lib.says,src:lib.src,url:lib.url,tier:lib.tier||'study',why:S(r.why,160)};
    else { const t = r.tier==='analogy'?'analogy':(r.tier==='assume'?'assume':'unverified');
      pack.rules[id]={name:S(r.name,24)||'未命名规律',field:S(r.field,24),says:S(r.says,220),src:t==='analogy'?'类比，不是证据':(t==='assume'?'没有数据来源，是模型的设定':'由模型提出，没有核实过出处'),url:'',tier:t,why:S(r.why,160)}; }
  });
  (Array.isArray(raw.events)?raw.events:[]).slice(0,20).forEach((e,i)=>{
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
if(typeof module!=='undefined') module.exports={LIB,sanitize,simulate,batch,summarize,newLife,pending,stepYear,quant,BUILTIN,BUILTIN2};
