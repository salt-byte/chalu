// 《岔路》的拼装器。照《八十亿分之一》按国家查表的办法：规则挂在属性上，不挂在题目上。
// 一条路 = 六个维度各取一个值。两条路一配，规则自己装配成一个岔路。
const DIMS = [
  {id:'dest', name:'去处', vals:[['big','大厂'],['mid','中厂'],['startup','创业公司'],['gov','体制内'],['study','读研'],['solo','自己做']]},
  {id:'pos',  name:'位置', vals:[['core','核心业务'],['edge','边缘业务']], only:['big','mid','startup','gov']},
  {id:'city', name:'城市', vals:[['t1','一线'],['prov','省会'],['small','小城']]},
  {id:'home', name:'离家', vals:[['near','离家近'],['far','离家远']]},
  {id:'love', name:'感情', vals:[['single','单身'],['local','同城恋爱'],['ldr','异地恋']]},
  {id:'cash', name:'存款', vals:[['tight','紧'],['year','够撑一年'],['rich','宽裕']]}
];
const DEF = {dest:'mid', pos:'core', city:'t1', home:'far', love:'single', cash:'year'};
const VAL = {}; DIMS.forEach(d => d.vals.forEach(([k,n]) => VAL[d.id+':'+k] = n));
function comboCount(){
  const emp = DIMS[0].vals.filter(([k]) => DIMS[1].only.includes(k)).length, other = DIMS[0].vals.length - emp;
  const rest = DIMS.slice(2).reduce((n,d) => n * d.vals.length, 1), per = (emp*2 + other) * rest;
  return {per, pairs: per*(per-1)/2};
}

// 每个属性值带来什么：起点、每年的变化、事件、抉择。p 是每年发生的概率，全部是设定。
// 事件里的 r 是规律库编号；'H' 是通用的「模型假设」。
const TRAITS = {
  'dest:big':{pay:100, grow:6, mood:0, ev:[
    {id:'hop',l:'被挖走',t:'一个不太熟的前同事递来机会，你跳了，薪水涨了一截。',p:.15,f:2,r:'weakties',tone:'up',e:{pay:{mul:1.17},mood:{add:5}}},
    {id:'pond',l:'被大池塘压住',t:'身边的人都很强，你开始怀疑自己是不是最差的那个。',p:.45,f:2,to:3,once:1,r:'bflp',tone:'down'},
    {id:'reorg',l:'组织调整',t:'两年里组织架构调了三次，你换了第三个老板。',p:.15,f:2,once:1,r:'H',tone:'down',e:{mood:{add:-5}}}],
    ch:{prompt:'隔壁核心组缺人手，想让你业余搭把手。没有绩效，也没人保证之后能转过去。',o:[
      {l:'去帮忙',t:'你开始每周多花两个晚上在别人的项目上。核心组的人记住了你的名字。',s:'seen',e:{mood:{add:-4},skill:{add:3}}},
      {l:'不去',t:'你把时间留给了自己。',e:{mood:{add:2}}}]}},
  'dest:mid':{pay:88, grow:4, mood:0, ev:[
    {id:'trust',l:'被委以重任',t:'老板把一块新业务整个交给了你。',p:.18,f:2,once:1,r:'task',tone:'up',s:'didcx',e:{skill:{add:8},mood:{add:5}}},
    {id:'ceil',l:'晋升变难',t:'公司增长放缓，今年的晋升名额砍了一半。',p:.15,f:3,once:1,r:'H',tone:'down',e:{mood:{add:-5}}},
    {id:'hopm',l:'被猎头找到',t:'一位猎头打来电话，你跳了，薪水涨了一截。',p:.1,f:2,r:'weakties',tone:'up',e:{pay:{mul:1.15},mood:{add:4}}}],
    ch:{prompt:'老板想开一条新业务线，问你敢不敢带。',o:[
      {l:'接',t:'你接了。接下来半年几乎没有周末。',s:'didcx',e:{skill:{add:10},mood:{add:-6}}},
      {l:'不接',t:'你没举手。日子照旧。',e:{mood:{add:3}}}]}},
  'dest:startup':{pay:105, grow:6, mood:0, ev:[
    {id:'fold',l:'公司散了',t:'公司没融到下一轮，最后一个月的工资拖了两个月才发。',p:.12,f:2,once:1,r:'startup',tone:'down',s:'laid',b:['boom'],knob:1,e:{pay:{mul:.85},mood:{add:-12}}},
    {id:'boom',l:'公司做成了',t:'公司拿到大额融资，你的期权第一次有了价格。',p:.05,f:2,once:1,r:'startup',tone:'up',s:'boom',b:['fold'],e:{pay:{mul:1.5},mood:{add:14}}},
    {id:'chaos',l:'一人顶三个岗',t:'你一个人做了产品、运营和客服三份活。',p:.35,f:1,r:'task',tone:'flat',e:{skill:{add:5},mood:{add:-4}}}],
    ch:{prompt:'老板说今年现金紧，问你愿不愿意拿一部分工资换期权。',o:[
      {l:'换期权',t:'你签了。到手的钱少了一截。',s:'opt',e:{pay:{mul:.88},mood:{add:2}}},
      {l:'要现金',t:'你说家里需要钱。老板说理解。',e:{}}]}},
  'dest:gov':{pay:80, grow:2, mood:0, ev:[
    {id:'calm',l:'风浪里的安稳',t:'大学同学群里有人在问裁员赔偿怎么算。你看了一眼，接着吃饭。',p:.3,f:1,r:'public',tone:'up',e:{mood:{add:6}}},
    {id:'paper',l:'改材料到深夜',t:'年底总结改了第七稿，你在办公室待到十一点。',p:.3,f:1,r:'H',tone:'down',e:{mood:{add:-5}}},
    {id:'same',l:'日子开始重复',t:'第三年的春天，你能背出全年每个月要做的事。',p:.35,f:3,once:1,r:'H',tone:'down',e:{mood:{add:-7}}},
    {id:'promoS',l:'被提拔',t:'借调回来以后，你升了一级。',p:.22,f:3,once:1,q:'seen',r:'H',tone:'up',e:{pay:{mul:1.12},mood:{add:8}}}],
    ch:{prompt:'领导问你愿不愿意借调到上级部门一年。累，但能被看见。',o:[
      {l:'去',t:'你去了。一年里写了四十份材料，见了几个以前只在名单上见过的人。',s:'seen',e:{mood:{add:-5}}},
      {l:'不去',t:'你说家里有事，推掉了。',e:{mood:{add:2}}}]}},
  'dest:study':{pay:30, grow:7, mood:-2, ev:[
    {id:'pub',l:'论文被接收',t:'你的论文被接收了。导师在组会上提了一句。',p:.2,f:2,r:'H',tone:'up',s:'pub',knob:1,e:{skill:{add:8},mood:{add:10}}},
    {id:'stuck',l:'课题卡住',t:'课题卡了大半年，没有一个能写进论文的结果。',p:.22,f:1,to:3,r:'gradmh',tone:'down',e:{mood:{add:-10}}},
    {id:'grad',l:'毕业',t:'你答辩通过了，带着学位去找工作。',p:.75,f:3,to:4,once:1,r:'H',tone:'up',s:'grad',e:{pay:{add:95},mood:{add:12}}},
    {id:'cold',l:'毕业撞上寒冬',t:'你毕业那年，几家想去的公司同时缩招。',p:.3,f:3,to:4,once:1,q:'grad',r:'entry',tone:'down',e:{pay:{mul:.9},mood:{add:-6}}},
    {id:'rjob',l:'论文换来好工作',t:'面试官翻着你的论文问了二十分钟，当场给了 offer。',p:.5,f:3,to:5,once:1,q:'pub',r:'brand',tone:'up',e:{pay:{mul:1.15}}}],
    ch:{prompt:'导师给你两个方向：一个稳，按部就班能毕业；一个有意思，但可能做不出来。',o:[
      {l:'选稳的',t:'你选了稳的那个。导师点点头，没多说。',e:{mood:{add:2}}},
      {l:'选有意思的',t:'你选了没人做过的那个。',s:'pub',e:{mood:{add:-3},skill:{add:5}}}]}},
  'dest:solo':{pay:22, grow:5, mood:1, ev:[
    {id:'lift',l:'改变后的轻松',t:'辞职后的头几个月，你睡得比过去两年都好。',p:.7,f:1,to:1,once:1,r:'coin',tone:'up',e:{mood:{add:10}}},
    {id:'hit',l:'项目跑通',t:'项目有了第一批愿意付钱的人，收入开始超过以前的工资。',p:.13,f:1,once:1,r:'H',tone:'up',s:'made',b:['back'],knob:1,e:{pay:{add:110},mood:{add:15}}},
    {id:'grow2',l:'口碑带来客户',t:'老客户带来了新客户。',p:.6,f:2,q:'made',b:['back'],r:'weakties',tone:'up',e:{pay:{mul:1.22}}},
    {id:'dry',l:'撑不下去',t:'存款见底了，项目还没有起色。你开始投简历。',p:.2,f:2,once:1,b:['made'],r:'startup',tone:'down',s:'back',run:1,knob:1,e:{mood:{add:-16}}},
    {id:'ret',l:'回去上班',t:'你回去上班了。空窗的这段时间让对方压了价。',p:.8,f:2,once:1,q:'back',r:'scar',tone:'down',e:{pay:{add:68}}}],
    ch:{prompt:'有家公司想把你的项目连人一起收走，给你一份比以前高的工资。',o:[
      {l:'卖掉',t:'你签了字。项目变成了别人的一个功能。',s:'back',e:{pay:{add:100},mood:{add:-4}}},
      {l:'不卖',t:'你回了一封很短的邮件。',e:{}}]}},
  'pos:core':{ev:[
    {id:'boss',l:'遇到强主管',t:'你被分到一位说话有分量的主管手下。',p:.45,f:1,to:1,once:1,r:'boss',tone:'up',s:'boss',e:{mood:{add:4}}},
    {id:'cx',l:'接到硬项目',t:'你接手了一个没人做过的项目，从头做到上线。',p:.5,f:1,r:'task',tone:'up',s:'didcx',knob:1,e:{skill:{add:8},mood:{add:4}}},
    {id:'cutc',l:'部门被合并',t:'公司收缩，你所在的部门被合并，你在名单上。',p:.04,f:1,once:1,r:'noncore',tone:'down',s:'laid',e:{mood:{add:-18}}}]},
  'pos:edge':{ev:[
    {id:'boss',l:'遇到强主管',t:'你被分到一位说话有分量的主管手下。',p:.2,f:1,to:1,once:1,r:'boss',tone:'up',s:'boss',e:{mood:{add:4}}},
    {id:'cx',l:'接到硬项目',t:'难得轮到你做一个有难度的项目。',p:.2,f:1,r:'task',tone:'up',s:'didcx',knob:1,e:{skill:{add:8},mood:{add:4}}},
    {id:'maint',l:'做维护和配合',t:'这一年你做的大多是维护和配合别的团队。',p:.5,f:1,to:2,r:'task',tone:'down',e:{mood:{add:-3}}},
    {id:'cute',l:'部门被裁撤',t:'业务调整，你所在的部门被整体裁撤。',p:.12,f:1,once:1,r:'noncore',tone:'down',s:'laid',knob:1,e:{mood:{add:-18}}},
    {id:'move',l:'转进核心',t:'核心业务线有了名额，他们第一个想到的是你。',p:.08,f:2,once:1,r:'H',tone:'up',s:'boss',e:{mood:{add:8}}},
    {id:'move2',l:'帮忙换来的转岗',t:'你帮过忙的那个组有了名额，他们点了你的名字。',p:.3,f:3,once:1,q:'seen',r:'weakties',tone:'up',e:{mood:{add:8},skill:{add:4}}}]},
  'city:t1':{payx:1.15, mood:0, ev:[
    {id:'commute',l:'通勤磨人',t:'早高峰的换乘通道里，你被人流推着走了四分钟。',p:.4,f:1,r:'commute',tone:'down',e:{mood:{add:-5}}},
    {id:'rent',l:'房租上涨',t:'房东发来微信，下个月起涨八百。',p:.3,f:1,r:'H',tone:'down',e:{pay:{add:-5},mood:{add:-3}}},
    {id:'meetup',l:'行业活动',t:'一次行业活动上加的微信，半年后给你介绍了一个机会。',p:.1,f:2,r:'weakties',tone:'up',e:{pay:{mul:1.1}}}]},
  'city:prov':{payx:1, ev:[
    {id:'house',l:'买得起房',t:'你付了首付，月供比一线的房租还低。',p:.15,f:2,once:1,r:'H',tone:'up',e:{mood:{add:8}}},
    {id:'circle',l:'圈子变小',t:'饭局上聊的还是那几个人的近况，你发现自己插不上话。',p:.2,f:2,r:'island',tone:'down'}]},
  'city:small':{payx:.8, mood:1, ev:[
    {id:'evening',l:'下班后的傍晚',t:'下班走回家只要十分钟，天还亮着。',p:.4,f:1,r:'commute',tone:'up',e:{mood:{add:4}}},
    {id:'few',l:'机会很少',t:'你翻了一遍本地的招聘，对口的岗位只有两个。',p:.25,f:2,r:'H',tone:'down',e:{mood:{add:-4}}}]},
  'home:near':{ev:[
    {id:'dinner',l:'回家吃饭',t:'周日中午，你妈做了一桌菜，你爸问你要不要带点走。',p:.5,f:1,r:'H',tone:'up',e:{mood:{add:3}}},
    {id:'nag',l:'被安排',t:'家里又给你介绍了一个「条件不错」的人。',p:.25,f:1,r:'H',tone:'down',e:{mood:{add:-4}}}]},
  'home:far':{ev:[
    {id:'door',l:'离家太远',t:'过年回家，你妈送你到小区门口，站着没走。',p:.25,f:2,r:'H',tone:'down',e:{mood:{add:-5}}},
    {id:'call',l:'家里的电话',t:'半夜接到家里电话，说你爸住院了。你订了最早一班车。',p:.05,f:2,once:1,r:'H',tone:'down',e:{mood:{add:-10}}}]},
  'love:single':{ev:[
    {id:'meet',l:'遇到喜欢的人',t:'朋友的饭局上，你和一个人聊到了最后。',p:.15,f:1,once:1,r:'H',tone:'up',e:{mood:{add:8}}}]},
  'love:local':{ev:[
    {id:'weekend',l:'平常的周末',t:'周六早上，你们一起去菜市场，为买哪种西红柿争了两句。',p:.4,f:1,b:['split'],r:'H',tone:'up',e:{mood:{add:3}}},
    {id:'split',l:'分开',t:'你们在一个很普通的周二晚上决定分开。',p:.05,f:2,once:1,r:'H',tone:'down',s:'split',e:{mood:{add:-15}}}]},
  'love:ldr':{ev:[
    {id:'visit',l:'见面的周末',t:'高铁站出口，你一眼就认出对方的外套。',p:.5,f:1,b:['split','moved'],r:'ldr',tone:'up',e:{mood:{add:4}}},
    {id:'tired',l:'来回奔波',t:'周日晚上的末班高铁上，你第三次错过了想说的话。',p:.3,f:1,b:['split','moved'],r:'H',tone:'down',e:{mood:{add:-4}}},
    {id:'moved',l:'终于搬到一起',t:'你们终于定了，有一个人搬了过去。',p:.15,f:2,once:1,b:['split'],r:'H',tone:'up',s:'moved',e:{mood:{add:6}}},
    {id:'reunion',l:'搬到一起后的落差',t:'住到一起以后，你发现对方和视频里那个人不太一样。',p:.4,f:2,once:1,q:'moved',r:'ldr',tone:'down',e:{mood:{add:-6}}},
    {id:'split',l:'分开',t:'一次很长的电话之后，你们决定分开。',p:.07,f:2,once:1,b:['moved'],r:'H',tone:'down',s:'split',e:{mood:{add:-15}}}]},
  'cash:tight':{mood:-1, ev:[
    {id:'squeeze',l:'月底算账',t:'月底你打开记账软件，看了一眼又关上了。',p:.3,f:1,r:'H',tone:'down',e:{mood:{add:-4}}}]},
  'cash:year':{ev:[]},
  'cash:rich':{mood:1, ev:[]}
};
// 雇佣类去处共用的事件
const EMPLOYED = [
  {id:'promoB',l:'主管推你上去',t:'主管把你推上去，你升了一级。',p:.14,f:2,q:'boss',r:'boss',tone:'up',e:{pay:{mul:1.12},mood:{add:8}}},
  {id:'promoC',l:'做出成绩后晋升',t:'项目做出来了，你升了一级。',p:.16,f:2,q:'didcx',r:'task',tone:'up',e:{pay:{mul:1.12},mood:{add:8}}},
  {id:'junior',l:'初级岗位收缩',t:'公司缩减初级岗位，你在名单上。',p:.02,f:1,to:2,once:1,r:'junior',tone:'down',s:'laid',e:{mood:{add:-18}}},
  {id:'gap',l:'空窗太久',t:'你找了大半年才重新上岸，新工作的薪水比原来低。',p:.35,f:1,once:1,q:'laid',r:'scar',tone:'down',run:1,e:{pay:{mul:.91}}}
];
const COMMON = [
  {id:'heal',l:'比想象中走得出来',t:'你以为会消沉很久，结果几个月后就不怎么想这件事了。',p:.5,f:2,once:1,q:'laid',r:'impact',tone:'up',e:{mood:{add:10}}},
  {id:'heal2',l:'比想象中走得出来',t:'分开半年后，你已经能平静地提起这件事。',p:.6,f:3,once:1,q:'split',r:'impact',tone:'up',e:{mood:{add:12}}},
  {id:'itch',l:'想起没走的路',t:'你刷到一个当年和你站在同一个路口、选了另一条路的人。',p:.2,f:2,r:'regret',tone:'down',e:{mood:{add:-5}}}
];
const EXTRA_LIB = {island:{tier:'analogy',name:'岛屿法则',field:'生态学',says:'迁到小岛上的大型动物会一代代变小，小型动物反而变大。环境的尺度会重新塑造住在里面的东西。'}};
const ANALOGY = {
  'dest:big|dest:mid':{name:'宁为鸡口，无为牛后',field:'《战国策·韩策》',says:'这个岔路两千年前就有人吵过。'},
  pos:{name:'十攻其一',field:'《孙子兵法·虚实》',says:'「我专为一，敌分为十，是以十攻其一也。」在小地方当主力，还是在大地方当边角。'},
  study:{name:'磨刀不误砍柴工',field:'俗语',says:'先花几年把刀磨快，还是先砍起来。磨刀的人前几年一根柴也没有。'},
  solo:{name:'破釜沉舟',field:'《史记·项羽本纪》',says:'把船凿沉、把锅砸了再打。没有退路的人，和留着退路的人，打的不是同一场仗。'},
  gov:{name:'r 选择与 K 选择',field:'生态学',says:'有的物种一次生很多，赌其中几个活下来；有的只生几个，每个都养到大。两种都能活，只是押注的方式不同。'},
  startup:{name:'r 选择与 K 选择',field:'生态学',says:'有的物种一次生很多，赌其中几个活下来；有的只生几个，每个都养到大。两种都能活，只是押注的方式不同。'},
  city:{name:'岛屿法则',field:'生态学',says:'迁到小岛上的大型动物会一代代变小，小型动物反而变大。环境的尺度会重新塑造住在里面的东西。'},
  love:{name:'相濡以沫，不如相忘于江湖',field:'《庄子·大宗师》',says:'泉水干了，两条鱼挤在一起，用唾沫互相润湿。庄子说，不如各自游回江湖。'},
  home:{name:'父母在，不远游',field:'《论语·里仁》',says:'后半句常被漏掉：「游必有方」。孔子说的不是不能走，是走要有个去处。'},
  cash:{name:'兵马未动，粮草先行',field:'兵家俗语',says:'仗能打多久，先看粮够吃几天。'}
};

function clean(a){ const o = Object.assign({}, DEF, a||{}); if(!DIMS[1].only.includes(o.dest)) delete o.pos; else if(!o.pos) o.pos = 'core'; return o; }
function pathName(a, b){
  const diff = DIMS.filter(d => a[d.id] && a[d.id] !== b[d.id]).map(d => VAL[d.id+':'+a[d.id]]);
  const show = diff.length ? diff.slice(0,3) : [VAL['dest:'+a.dest]];
  if(a.pos && !diff.includes(VAL['dest:'+a.dest]) && diff.length < 3 && a.pos !== b.pos) {}
  if(!show.includes(VAL['dest:'+a.dest]) && a.dest !== b.dest) show.unshift(VAL['dest:'+a.dest]);
  return show.join(' · ').replace('核心业务','核心').replace('边缘业务','边缘');
}
function describe(a){ return DIMS.filter(d => a[d.id]).map(d => VAL[d.id+':'+a[d.id]]).join('、'); }

function compose(rawA, rawB){
  const A = clean(rawA), B = clean(rawB), sides = {A, B};
  const pack = {builtin:true, composed:true, attrs:{A, B}, years:5, meters:[], events:[], rules:{}, choices:[]};
  const nameA = pathName(A, B), nameB = pathName(B, A);
  pack.options = {A:{name:nameA}, B:{name:nameB}};
  pack.title = nameA + '，还是' + nameB;
  pack.question = '一条路：' + describe(A) + '。另一条路：' + describe(B) + '。';
  pack.caveat = '这个岔路是由属性拼出来的。规则挂在属性上，所以事件不会像手写的那样贴合你的处境；所有概率都是设定的，可以在揭晓页改。';
  const start = {}, drift = {};
  ['A','B'].forEach(k => { const a = sides[k], d = TRAITS['dest:'+a.dest], c = TRAITS['city:'+a.city];
    start[k] = {pay: d.pay * (c.payx||1), skill:30, mood: 60};
    drift[k] = {pay: 0, skill: d.grow, mood: (d.mood||0) + (c.mood||0) + ((TRAITS['cash:'+a.cash]||{}).mood||0)}; });
  const top = Math.max(start.A.pay, start.B.pay); ['A','B'].forEach(k => { start[k].pay = Math.round(start[k].pay/top*100); drift[k].pay = Math.max(1, Math.round(start[k].pay*0.045)); });
  pack.meters = [
    {id:'pay', name:'收入指数', note:'两条路里起点较高的记为 100', start:{A:start.A.pay, B:start.B.pay}, drift:{A:drift.A.pay, B:drift.B.pay}, noise:2, max:800},
    {id:'skill', name:'成长', note:'0 到 100', start:{A:30, B:30}, drift:{A:drift.A.skill, B:drift.B.skill}, noise:2, max:100},
    {id:'mood', name:'满意度', note:'0 到 100', start:{A:60, B:60}, drift:{A:drift.A.mood, B:drift.B.mood}, noise:4, max:100}];
  pack.rules.H = {tier:'assume', name:'模型设定', field:'模型假设', says:'这件事每年发生的概率是设定的，没有统计支撑。'};
  const addRule = r => { if(!r || pack.rules[r]) return; if(LIB[r]) pack.rules[r] = {lib:r}; else if(EXTRA_LIB[r]) pack.rules[r] = Object.assign({}, EXTRA_LIB[r]); };
  ['A','B'].forEach(k => {
    const a = sides[k], o = k==='A' ? 'B' : 'A', list = [];
    DIMS.forEach(d => { if(a[d.id]) (TRAITS[d.id+':'+a[d.id]].ev||[]).forEach(e => list.push(e)); });
    if(DIMS[1].only.includes(a.dest)) EMPLOYED.forEach(e => list.push(e));
    COMMON.forEach(e => list.push(e));
    const seen = new Set();
    list.forEach(e => { if(seen.has(e.id)) return; seen.add(e.id);
      let p = e.p; if(e.run){ p *= a.cash==='tight' ? 1.5 : a.cash==='rich' ? 0.55 : 1; }
      addRule(e.r);
      const eff = {}; Object.keys(e.e||{}).forEach(m => eff[m] = e.e[m]);
      pack.events.push({id:e.id+k, label:e.l, text:{[k]:e.t, [o]:''}, p:{[k]:Math.min(.9,p), [o]:0}, from:e.f||1, to:e.to||5, once:!!e.once,
        requires:e.q ? e.q : '', blockedBy:e.b||[], sets:e.s||'', tone:e.tone, rule:e.r||null, effects:eff, knob:!!e.knob});
    });
    const ch = TRAITS['dest:'+a.dest].ch;
    if(ch) pack.choices.push({id:'c'+k, year:k==='A'?2:3, path:k, prompt:{[k]:ch.prompt, [o]:''}, options:ch.o.map(x => ({label:x.l, text:x.t, sets:x.s||'', tone:'flat', rule:null, effects:x.e||{}}))});
  });
  // 收尾的类比：挑两条路差得最大的那个维度
  let key = A.dest !== B.dest ? (['big','mid'].includes(A.dest) && ['big','mid'].includes(B.dest) ? 'dest:big|dest:mid' : (['study','solo','gov','startup'].find(x => A.dest===x || B.dest===x) || 'pos'))
          : A.pos !== B.pos ? 'pos' : ['city','love','home','cash'].find(d => A[d] !== B[d]) || 'pos';
  pack.rules.X = Object.assign({tier:'analogy'}, ANALOGY[key]); pack.closing = {A:'X', B:'X'};
  // 比什么：收入一边倒时（一方几乎总是更高），比较没有信息量，改成比满意度
  try{ const t = sanitize(pack), ra = batch(t,'A',300,11), rb = batch(t,'B',300,12); let w = 0; for(let i=0;i<300;i++) w += ra[i].final.pay > rb[i].final.pay ? 1 : 0;
    if(w < 30 || w > 270){ pack.meters.unshift(pack.meters.splice(2,1)[0]); pack.caveat += ' 这两条路的收入差得太远，比较没有意义，所以这里比的是满意度。'; } }catch(e){}
  return pack;
}

// 从一句话里读出两条路。读不出的维度沿用另一条路，再读不出就用默认值，玩家可以在出发前改。
const KW = {
  dest:[['study',['读研','读博','博士','硕士','考研','留学','出国读','深造','二战','读书']],['gov',['考公','公务员','体制内','编制','事业单位','国企','央企','选调','上岸','银行']],
        ['solo',['辞职','单干','自己做','自由职业','副业','裸辞','自己干','gap']],['startup',['创业公司','初创','startup','创业团队','小公司']],
        ['big',['大厂','字节','阿里','腾讯','美团','百度','京东','华为','网易','拼多多','小红书','快手','大公司','外企','大企业']],['mid',['中厂','中型','小厂','中小','企业','公司','私企']]],
  pos:[['edge',['边缘','非核心','支持部门','中台','后台','外包']],['core',['核心','主业务','一线业务']]],
  city:[['prov',['省会','杭州','成都','武汉','南京','西安','长沙','郑州','二线','新一线','苏州']],['small',['县城','小城','三线','四线','小县']],['t1',['一线','北京','上海','深圳','广州','北上广']]],
  home:[['near',['老家','回家','离家近','父母身边','家乡','回去陪']],['far',['离家远','外地','异乡','出国']]],
  love:[['ldr',['异地']],['local',['同城','搬过去','搬去','在一起','对象身边']],['single',['单身']]],
  cash:[['tight',['没存款','存款少','缺钱','负债','没钱','房贷']],['rich',['存款够','不缺钱','积蓄多','存款多','宽裕']],['year',['撑一年','够一年']]]
};
function readSide(t){ const a = {}; Object.keys(KW).forEach(d => { for(const [v, ws] of KW[d]){ if(ws.some(w => t.includes(w.toLowerCase()))){ a[d] = v; break; } } });
  if(a.home==='near' && !a.city) a.city = 'prov'; if(t.includes('老家') && !a.city) a.city = 'prov'; return a; }
function parseDilemma(q){
  const t = String(q).toLowerCase().replace(/\s+/g,'');
  const parts = t.split(/还是|或者|或是|vs\.?|v\.s\.|，或|要不要|\/|还不如|不如/).filter(Boolean);
  let a, b, found = 0;
  if(parts.length >= 2){ a = readSide(parts[0]); b = readSide(parts.slice(1).join('')); }
  else { a = readSide(t); b = {}; }
  found = Object.keys(a).length + Object.keys(b).length;
  if(parts.length < 2 || !b.dest && !Object.keys(b).length){ // 只说了一条路：另一条是「维持现状」
    b = Object.assign({}, a); if(a.dest === 'solo' || a.dest === 'study' || a.dest === 'gov') b.dest = 'mid'; else if(a.home === 'near') { b.home = 'far'; b.city = 't1'; } else b.dest = a.dest === 'big' ? 'mid' : 'big'; }
  if(a.home === 'near' && !b.home) b.home = 'far'; if(b.home === 'near' && !a.home) a.home = 'far';
  DIMS.forEach(d => { if(!a[d.id] && b[d.id] && d.id !== 'dest' && d.id !== 'pos') a[d.id] = b[d.id]; if(!b[d.id] && a[d.id] && d.id !== 'dest' && d.id !== 'pos') b[d.id] = a[d.id]; });
  const keep = d => ['study','solo','gov'].includes(d) ? 'mid' : d;
  if(!a.dest && !b.dest){ a.dest = b.dest = 'mid'; }
  else if(!a.dest) a.dest = keep(b.dest); else if(!b.dest) b.dest = keep(a.dest);
  if(a.dest === b.dest && !a.pos !== !b.pos){ if(!a.pos) a.pos = b.pos; if(!b.pos) b.pos = a.pos; }
  if(a.home==='near' && b.home!=='near' && !b.city) b.city = 't1';
  return {A:clean(a), B:clean(b), found};
}
// 常见的岔路，放在标题页上逛
const COMMON_PAIRS = [
  ['大厂还是创业公司', {dest:'big'}, {dest:'startup'}], ['考公还是去大厂', {dest:'gov'}, {dest:'big'}], ['读研还是直接工作', {dest:'study'}, {dest:'mid'}],
  ['北京还是回省会', {city:'t1'}, {city:'prov', home:'near'}], ['异地恋，要不要去对方城市', {love:'ldr', city:'t1'}, {love:'local', city:'prov', home:'far'}],
  ['辞职单干，存款紧', {dest:'solo', cash:'tight'}, {dest:'mid', cash:'tight'}], ['大厂边缘还是小城体制内', {dest:'big', pos:'edge'}, {dest:'gov', city:'small', home:'near'}],
  ['创业公司核心还是大厂边缘', {dest:'startup', pos:'core'}, {dest:'big', pos:'edge'}], ['回老家考公还是留一线', {dest:'gov', city:'prov', home:'near'}, {dest:'mid', city:'t1'}],
  ['读研还是去创业公司', {dest:'study'}, {dest:'startup'}], ['留在大厂还是出来自己做', {dest:'big'}, {dest:'solo', cash:'rich'}], ['离家近还是工作好', {dest:'mid', home:'near', city:'prov'}, {dest:'big', home:'far', city:'t1'}]
];
if(typeof module !== 'undefined') module.exports = {DIMS, compose, parseDilemma, comboCount, COMMON_PAIRS};
