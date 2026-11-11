// 《岔路》的三维舞台：一条路在夜里分成两股，两个发光的你各走一股。
// 路的高度就是主指标，所以走出来的路本身是一条立体的曲线。揭晓时两千条路从岔口扇开。
const Stage = (() => {
  const S = {ok:false}, SEG = 10, X0 = 3, LZ = {A:-2.0, B:2.0}, COL = {A:0x86A8EE, B:0xE3A738}, NIGHT = 0x0F1514;
  let R, scene, cam, world, crowdG, el, N = 5, yLo = 0, yHi = 1, mode = 'idle', t0 = 0;
  let walkers = {}, last = {}, tweens = [], pending = null, gates = {};
  const tgt = new THREE.Vector3(0, 3, 0), tgtGoal = new THREE.Vector3(0, 3, 0), back = new THREE.Vector3(-21, 10, 0), backGoal = new THREE.Vector3(-21, 10, 0);
  const orbit = {yaw:0, pitch:0, dist:1, drag:false, x:0, y:0};
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cl = (x,a,b) => Math.max(a, Math.min(b, x));
  const Y = v => (cl(v, yLo, yHi) - yLo) / Math.max(1e-6, yHi - yLo) * 11 + 0.3;
  const P = (k, i, v) => new THREE.Vector3(X0 + i*SEG, Y(v), LZ[k] * (1 + 0.16*i));
  const glow = (c, e) => new THREE.MeshStandardMaterial({color:c, emissive:c, emissiveIntensity:e == null ? 0.7 : e, roughness:0.6});
  function tube(a, b, r, mat){ return new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, r, 8, false), mat); }
  function tween(ms, fn, done){ if(calm){ fn(1); done && done(); return; } tweens.push({t:performance.now(), ms, fn, done}); }

  S.init = function(container){
    el = container;
    try{
      R = new THREE.WebGLRenderer({antialias:true}); R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setClearColor(NIGHT);
      el.appendChild(R.domElement);
    }catch(e){ S.ok = false; el.style.display = 'none'; document.body.classList.add('no3d'); return false; }
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(NIGHT, 45, 170);
    cam = new THREE.PerspectiveCamera(50, 1, 0.1, 600);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5)); const d = new THREE.DirectionalLight(0xffffff, 0.5); d.position.set(-10, 30, 10); scene.add(d);
    const grid = new THREE.GridHelper(600, 120, 0x2A3531, 0x1A2320); grid.position.set(60, 0, 0); scene.add(grid);
    const sp = []; for(let i=0;i<700;i++){ const a = Math.random()*Math.PI*2, h = 20 + Math.random()*150, r = 150 + Math.random()*120; sp.push(60 + Math.cos(a)*r, h, Math.sin(a)*r); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0x8C9A93, size:0.9, fog:false})));
    world = new THREE.Group(); scene.add(world); crowdG = new THREE.Group(); scene.add(crowdG);
    const dom = R.domElement; dom.style.touchAction = 'pan-y';
    dom.addEventListener('pointerdown', e => { orbit.drag = true; orbit.x = e.clientX; orbit.y = e.clientY; });
    addEventListener('pointerup', () => orbit.drag = false);
    addEventListener('pointermove', e => { if(!orbit.drag) return; orbit.yaw = cl(orbit.yaw - (e.clientX - orbit.x)*0.006, -1.5, 1.5); orbit.pitch = cl(orbit.pitch + (e.clientY - orbit.y)*0.004, -0.35, 0.6); orbit.x = e.clientX; orbit.y = e.clientY; });
    dom.addEventListener('wheel', e => { if(mode === 'idle') return; e.preventDefault(); orbit.dist = cl(orbit.dist * (e.deltaY > 0 ? 1.08 : 0.93), 0.5, 2.2); }, {passive:false});
    addEventListener('resize', size); size(); S.ok = true; t0 = performance.now(); requestAnimationFrame(loop); return true;
  };
  function size(){ if(!R) return; const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight; R.setSize(w, h, false); R.domElement.style.width = '100%'; R.domElement.style.height = '100%'; cam.aspect = w/h; cam.updateProjectionMatrix(); }
  S.resize = size;
  function clear(g){ while(g.children.length){ const o = g.children.pop(); o.traverse && o.traverse(c => { c.geometry && c.geometry.dispose(); }); } }

  // 新的一局：画出岔口和两个出发的你
  S.reset = function(years, range, starts){
    if(!S.ok) return; clear(world); clear(crowdG); tweens = []; gates = {}; N = years; yLo = range.lo; yHi = range.hi; orbit.yaw = 0; orbit.pitch = 0; orbit.dist = 1;
    const y0 = (Y(starts.A) + Y(starts.B)) / 2, ink = glow(0xE9EEE8, 0.5);
    world.add(tube(new THREE.Vector3(-40, y0, 0), new THREE.Vector3(0, y0, 0), 0.24, ink));
    ['A','B'].forEach(k => { const p0 = P(k, 0, starts[k]);
      world.add(tube(new THREE.Vector3(0, y0, 0), p0, 0.22, glow(COL[k])));
      const w = new THREE.Group(); w.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), glow(COL[k], 1)));
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7, 6), new THREE.MeshBasicMaterial({color:COL[k], transparent:true, opacity:0.45})); beam.position.y = 3.5; w.add(beam);
      w.add(new THREE.PointLight(COL[k], 1.1, 16)); w.position.copy(p0); world.add(w); walkers[k] = w; last[k] = p0.clone(); });
    follow(0); mode = 'play';
  };
  function follow(i){ const cy = (last.A.y + last.B.y) / 2; tgtGoal.set(X0 + i*SEG + 2, cy + 0.2, 0); backGoal.set(-21, 10, 0); }

  // 抉择时，那个你停在一道门前
  S.gate = function(k, on){
    if(!S.ok) return;
    if(gates[k]){ world.remove(gates[k]); gates[k] = null; }
    if(!on) return;
    const g = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 40), new THREE.MeshBasicMaterial({color:COL[k]})); g.rotation.y = Math.PI/2;
    g.position.copy(last[k]).add(new THREE.Vector3(1.6, 0.2, 0)); world.add(g); gates[k] = g;
  };

  // 过一年：路往前长一段，沿路立起这一年的事
  S.step = function(k, i, value, evs){
    if(!S.ok) return; S.gate(k, false);
    const a = last[k].clone(), b = P(k, i, value), seg = tube(a, b, 0.2, glow(COL[k])); const full = seg.geometry.index.count;
    seg.geometry.setDrawRange(0, 0); world.add(seg);
    const marks = (evs || []).map((e, j) => { const t = (j + 1) / (evs.length + 1), p = a.clone().lerp(b, t); let m;
      if(e.chosen){ m = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 8, 32), new THREE.MeshBasicMaterial({color:COL[k]})); m.rotation.y = Math.PI/2; m.position.copy(p).add(new THREE.Vector3(0, 0.2, 0)); }
      else if(e.tone === 'up'){ m = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.9, 6), glow(0x6CC08D, 0.9)); m.position.copy(p).add(new THREE.Vector3(0, 1.25, LZ[k] > 0 ? 0.9 : -0.9)); }
      else if(e.tone === 'down'){ m = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), glow(0xE57F7F, 0.9)); m.position.copy(p).add(new THREE.Vector3(0, 0.55, LZ[k] > 0 ? 0.9 : -0.9)); }
      else { m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), glow(0x8C9A93, 0.6)); m.position.copy(p).add(new THREE.Vector3(0, 0.5, LZ[k] > 0 ? 0.9 : -0.9)); }
      m.scale.setScalar(0.001); m.userData.t = t; world.add(m); return m; });
    tween(1300, t => { const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
      walkers[k].position.lerpVectors(a, b, e); seg.geometry.setDrawRange(0, Math.floor(full * e / 3) * 3);
      marks.forEach(m => { const s = cl((e - m.userData.t) * 6, 0.001, 1); m.scale.setScalar(s); }); });
    last[k] = b; follow(i);
  };

  // 揭晓：镜头升起，每股各扇开几百条别的你走出的路。按结局高低排开，越往外结局越高。
  S.reveal = function(trajA, trajB, animate){
    if(!S.ok) return; clear(crowdG); mode = 'reveal';
    const mid = X0 + N*SEG/2; tgtGoal.set(mid + 4, 3.5, 0); backGoal.set(-(mid + 34), 36, 0); scene.fog.far = 330; orbit.yaw = 0.42; orbit.pitch = 0;
    const all = [];
    [['A', trajA], ['B', trajB]].forEach(([k, T]) => { const sorted = T.slice().sort((p, q) => p[p.length-1] - q[q.length-1]), sign = LZ[k] < 0 ? -1 : 1;
      sorted.forEach((tr, r) => { const zEnd = sign * (5 + r / sorted.length * 46), pts = tr.map((v, i) => new THREE.Vector3(X0 + i*SEG, Y(v), sign*2.0 + (zEnd - sign*2.0) * (i / N)));
        const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:COL[k], transparent:true, opacity:0.3})); ln.visible = !animate || calm; crowdG.add(ln); all.push(ln); }); });
    if(animate && !calm){ for(let i = all.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [all[i], all[j]] = [all[j], all[i]]; }
      tween(3600, t => { const n = Math.floor(Math.max(0, (t - 0.25) / 0.75) * all.length); for(let i = 0; i < n; i++) all[i].visible = true; }); }
  };
  S.idle = function(){ if(!S.ok) return; S.reset(5, {lo:0, hi:10}, {A:5, B:5}); ['A','B'].forEach(k => S.step(k, 1, k === 'A' ? 6.5 : 4)); mode = 'idle'; tgtGoal.set(10, 12, -13); backGoal.set(-34, 5, 0); scene.fog.far = 170; };
  S.play = function(){ mode = 'play'; if(scene) scene.fog.far = 170; };

  function loop(now){
    requestAnimationFrame(loop);
    for(let i = tweens.length - 1; i >= 0; i--){ const w = tweens[i], t = Math.min(1, (now - w.t) / w.ms); w.fn(t); if(t >= 1){ tweens.splice(i, 1); w.done && w.done(); } }
    tgt.lerp(tgtGoal, 0.05); back.lerp(backGoal, 0.05);
    const yaw = orbit.yaw + (mode === 'idle' && !calm ? Math.sin((now - t0) / 5000) * 0.25 : 0), d = orbit.dist;
    const bx = back.x * d, by = back.y * d * (1 + orbit.pitch);
    cam.position.set(tgt.x + bx * Math.cos(yaw), tgt.y + by, tgt.z + bx * Math.sin(yaw)); cam.lookAt(tgt);
    Object.keys(gates).forEach(k => { if(gates[k]) gates[k].scale.setScalar(1 + Math.sin(now / 260) * 0.12); });
    R.render(scene, cam);
  }
  return S;
})();
