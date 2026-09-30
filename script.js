(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- clocks ---------- */
  const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { const t = fmt.format(new Date()); document.getElementById('clock').textContent = 'Kochi · ' + t + ' IST'; document.getElementById('clock2').textContent = 'Kochi, Kerala · ' + t + ' IST'; };
  tick(); setInterval(tick, 15000);

  /* ---------- marquee ---------- */
  const flowerIcon = (c) => `<svg viewBox="-82 -82 164 164" aria-hidden="true"><g fill="${c}">${[0,72,144,216,288].map(r => `<path transform="rotate(${r})" d="M0 0 C -24 -16, -30 -56, 0 -76 C 30 -56, 24 -16, 0 0 Z"/>`).join('')}</g><circle r="18" fill="#DDBE82"/></svg>`;
  const fill = (el, words, c) => { const one = words.map(w => `<span>${w}</span>${flowerIcon(c)}`).join(''); el.innerHTML = one + one; };
  fill(document.getElementById('trackA'), ['Machine learning', 'Quantum computing', 'Mathematical modeling', 'Data science', 'AI agents'], '#100D1D');
  fill(document.getElementById('trackB'), ['CUSAT', 'IIT Madras', 'IEEE CS', 'Qiskit', 'PennyLane', 'Locus', 'Three.js', 'Kochi, Kerala'], '#D38DB2');

  /* ---------- 3D bloom petals ---------- */
  const ring = (id, n, tilt, off) => { const el = document.getElementById(id); for (let i = 0; i < n; i++) { const p = document.createElement('div'); p.className = 'petal3d'; p.style.transform = `rotateZ(${off + i * 360 / n}deg) rotateX(${tilt}deg)`; el.appendChild(p); } };
  ring('r1', 10, -24, 0); ring('r2', 8, -46, 22); ring('r3', 7, -68, 10);
  const tilt = document.getElementById('tilt');
  if (!reduce) addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    tilt.style.setProperty('--rx', (58 + y * -26) + 'deg');
    tilt.style.setProperty('--ry', (x * 34) + 'deg');
  });

  /* ---------- realistic 3D lily (Three.js) ---------- */
  (function lily() {
    const stage = document.getElementById('bloomStage');
    if (!window.THREE || !stage) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
    stage.classList.add('gl');
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    const lookAt = new THREE.Vector3(0, 0.95, 0);

    // studio light on black: warm key, cool fill, strong pale rim for glowing petal edges
    scene.add(new THREE.HemisphereLight(0xf4e6f0, 0x2a1426, 0.4));
    const key = new THREE.DirectionalLight(0xfff1e6, 1.35); key.position.set(-3, 4, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xc9c2f0, 0.45); fill.position.set(4, 1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffe8f2, 1.2); rim.position.set(1, 3, -5); scene.add(rim);
    const under = new THREE.PointLight(0xffc6de, 0.6, 5); under.position.set(0, 0.2, 1.2); scene.add(under);

    const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const C = { throat: lin('#E1E8C6'), pink: lin('#DE7FAF'), deep: lin('#B04A80'), edge: lin('#F2C9DC'), spot: lin('#7E2350') };

    // A tepal: spine rises from the base, opens outward, then recurves back at the tip.
    function tepal(L, W, t0, bend, cup, wave, seed) {
      const su = 16, sv = 40, pos = [], col = [], idx = [];
      let y = 0, z = 0; const spine = [];
      for (let j = 0; j <= sv; j++) {
        const v = j / sv, th = t0 + bend * Math.pow(v, 2.1);
        spine.push({ y, z, th });
        y += Math.cos(th) * L / sv; z += Math.sin(th) * L / sv;
      }
      const c = new THREE.Color();
      for (let j = 0; j <= sv; j++) {
        const v = j / sv, s = spine[j];
        const hw = W * Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(v, 0.72))), 0.9) * (1 - 0.25 * v) + 0.04 * W;
        const ny = -Math.sin(s.th), nz = Math.cos(s.th);            // surface normal (points to the inside of the flower)
        for (let i = 0; i <= su; i++) {
          const u = -1 + 2 * i / su;
          const lift = cup * u * u * hw * (1 - 0.55 * v) - 0.05 * hw * Math.exp(-u * u * 40) * (1 - v);   // edges rise, midrib groove
          const ruffle = wave * Math.sin(v * 26 + seed + u * 2) * Math.pow(Math.abs(u), 3) * hw * smooth(.25, .9, v);
          const d = lift + ruffle;
          pos.push(u * hw, s.y + ny * d, s.z + nz * d);
          // colour: green-white throat, pink body, darker stripe down the middle, pale glowing edges
          c.copy(C.throat).lerp(C.pink, smooth(0.02, 0.28, v));
          c.lerp(C.deep, Math.exp(-u * u * 9) * smooth(0.08, 0.3, v) * (1 - smooth(0.55, 0.95, v)) * 0.75);
          c.lerp(C.edge, Math.pow(Math.abs(u), 5) * 0.7 + smooth(0.85, 1, v) * 0.35);
          const sp = Math.sin(u * 37 + seed) * Math.sin(v * 53 + seed * 2);
          if (v > 0.12 && v < 0.4 && Math.abs(u) < 0.6 && sp > 0.93) c.lerp(C.spot, 0.55);
          const vein = 1 - 0.06 * (0.5 + 0.5 * Math.cos(u * 26)) * smooth(0.05, 0.8, v);
          col.push(c.r * vein, c.g * vein, c.b * vein);
        }
      }
      for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) { const a = j * (su + 1) + i, b = a + su + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    const petalMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.45, sheen: new THREE.Color(0xffd6ea) });

    const flower = new THREE.Group(); scene.add(flower);
    const bloom = new THREE.Group(); bloom.position.y = 0.45; flower.add(bloom);
    const tepals = [];
    [[0, 2.0, 0.52, 0.7, 1.9, 0.5, 0.05], [120, 2.05, 0.5, 0.66, 2.0, 0.45, 0.05], [240, 1.95, 0.52, 0.74, 1.8, 0.5, 0.05],
     [60, 1.9, 0.64, 0.55, 1.7, 0.62, 0.07], [180, 1.95, 0.62, 0.6, 1.75, 0.6, 0.07], [300, 1.85, 0.65, 0.52, 1.6, 0.66, 0.07]]
      .forEach(([deg, L, W, t0, bend, cup, wave], k) => {
        const m = new THREE.Mesh(tepal(L, W, t0, bend, cup, wave, k * 1.7), petalMat);
        const piv = new THREE.Group(); piv.rotation.y = THREE.MathUtils.degToRad(deg + (k % 2 ? 4 : -3)); piv.add(m); m.position.z = 0.06;
        bloom.add(piv); tepals.push({ m, ph: k });
      });

    // stamens + pistil
    const tube = (pts, r, mat) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 8, false), mat);
    const filMat = new THREE.MeshStandardMaterial({ color: lin('#E9D2DA'), roughness: 0.5 });
    const antherMat = new THREE.MeshStandardMaterial({ color: lin('#7A2230'), roughness: 0.75 });
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + 0.3, len = 1.45 + (k % 3) * 0.08, sp = 0.45 + (k % 2) * 0.12;
      const pts = [0, .35, .7, 1].map(t => new THREE.Vector3(Math.cos(a) * sp * t * t * len * .6, t * len, Math.sin(a) * sp * t * t * len * .6));
      bloom.add(tube(pts, 0.012, filMat));
      const an = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10), antherMat);
      an.scale.set(0.55, 2.6, 0.55); an.position.copy(pts[3]); an.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9 + 1.3); bloom.add(an);
    }
    const pistilPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.03, 0.6, 0.05), new THREE.Vector3(0.1, 1.2, 0.12), new THREE.Vector3(0.14, 1.62, 0.16)];
    bloom.add(tube(pistilPts, 0.02, new THREE.MeshStandardMaterial({ color: lin('#DCE4C8'), roughness: 0.45 })));
    const stig = new THREE.Group(); stig.position.copy(pistilPts[3]);
    const stigMat = new THREE.MeshStandardMaterial({ color: lin('#F2B23A'), roughness: 0.5, emissive: lin('#3A2000') });
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), stigMat); const a = k / 3 * Math.PI * 2; b.position.set(Math.cos(a) * 0.035, 0.02, Math.sin(a) * 0.035); stig.add(b); }
    bloom.add(stig);

    // ovary + stem
    const green = new THREE.MeshStandardMaterial({ color: lin('#5A7A45'), roughness: 0.55 });
    const ov = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), green); ov.scale.set(1, 1.6, 1); ov.position.y = 0.4; flower.add(ov);
    flower.add(tube([new THREE.Vector3(0, 0.38, 0), new THREE.Vector3(0.02, -0.6, 0.02), new THREE.Vector3(-0.04, -1.8, 0), new THREE.Vector3(-0.02, -3.2, 0)], 0.045, green));

    flower.rotation.x = 0.28; flower.rotation.z = -0.06;

    const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1.3 ? 44 : 32; camera.updateProjectionMatrix(); };
    resize(); new ResizeObserver(resize).observe(stage);
    let mx = 0, my = 0, sx = 0, sy = 0;
    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
    let visible = true;
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
    const t0 = performance.now();
    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - t0) / 1000;
      sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05;
      const ang = sx * 0.8, el = 0.28 - sy * 0.3, dist = 4.7;
      camera.position.set(Math.sin(ang) * Math.cos(el) * dist, 0.95 + Math.sin(el) * dist, Math.cos(ang) * Math.cos(el) * dist); camera.lookAt(lookAt);
      flower.rotation.y = reduce ? 0.4 : 0.4 + Math.sin(t * 0.25) * 0.7;
      flower.position.y = reduce ? 0 : Math.sin(t * 0.8) * 0.03;
      for (const p of tepals) p.m.rotation.x = reduce ? 0 : Math.sin(t * 0.7 + p.ph) * 0.02;
      renderer.render(scene, camera);
    };
    requestAnimationFrame(frame);
  })();

  /* ---------- butterflies ---------- */
  const hero = document.querySelector('.hero');
  const bflySVG = (a, b) => `<svg viewBox="-50 -50 100 100"><defs><linearGradient id="bg${a.slice(1)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <g class="w r"><path d="M0 -2 C 8 -30, 42 -36, 40 -10 C 38 4, 16 6, 0 2 Z M0 2 C 18 6, 32 14, 26 30 C 18 40, 4 24, 0 8 Z" fill="url(#bg${a.slice(1)})" stroke="#2A2046" stroke-width="1.2"/><circle cx="30" cy="-16" r="3" fill="#DDBE82"/></g>
    <g class="w l"><path transform="scale(-1 1)" d="M0 -2 C 8 -30, 42 -36, 40 -10 C 38 4, 16 6, 0 2 Z M0 2 C 18 6, 32 14, 26 30 C 18 40, 4 24, 0 8 Z" fill="url(#bg${a.slice(1)})" stroke="#2A2046" stroke-width="1.2"/><circle cx="-30" cy="-16" r="3" fill="#DDBE82"/></g>
    <ellipse rx="2.6" ry="13" cy="3" fill="#2A2046"/><path d="M-1 -9 C -4 -18,-8 -22,-11 -24 M1 -9 C 4 -18,8 -22,11 -24" stroke="#2A2046" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;
  const flies = [
    { a: '#D38DB2', b: '#3E2F73', s: 1, ax: .42, ay: .3, fx: .00021, fy: .00033, ph: 0 },
    { a: '#8C9EDB', b: '#6E2F55', s: .78, ax: .36, ay: .34, fx: .00017, fy: .00029, ph: 2.1 },
    { a: '#DDBE82', b: '#6E2F55', s: .62, ax: .3, ay: .22, fx: .00026, fy: .00041, ph: 4.2 },
  ].map(f => { const d = document.createElement('div'); d.className = 'bfly'; d.innerHTML = bflySVG(f.a, f.b); hero.appendChild(d); return { ...f, el: d }; });
  let t0 = performance.now();
  const flyLoop = (now) => {
    const W = hero.clientWidth, H = hero.clientHeight, t = now - t0;
    for (const f of flies) {
      const px = W / 2 + Math.sin(t * f.fx + f.ph) * W * f.ax + Math.sin(t * f.fx * 2.3) * 40;
      const py = H * .5 + Math.sin(t * f.fy + f.ph * 1.3) * H * f.ay;
      const dx = Math.cos(t * f.fx + f.ph) * W * f.ax * f.fx + Math.cos(t * f.fx * 2.3) * 40 * f.fx * 2.3;
      const dy = Math.cos(t * f.fy + f.ph * 1.3) * H * f.ay * f.fy;
      const ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      f.el.style.transform = `translate(${px - 28}px, ${py - 28}px) rotate(${ang}deg) scale(${f.s})`;
    }
    if (!reduce) requestAnimationFrame(flyLoop);
  };
  requestAnimationFrame(flyLoop);

  /* ---------- falling petals ---------- */
  const pc = document.getElementById('petals'), px = pc.getContext('2d');
  let pw, ph, dpr = Math.min(devicePixelRatio || 1, 2);
  const sizeP = () => { pw = innerWidth; ph = innerHeight; pc.width = pw * dpr; pc.height = ph * dpr; px.setTransform(dpr, 0, 0, dpr, 0, 0); };
  sizeP(); addEventListener('resize', sizeP);
  const cols = ['rgba(211,141,178,', 'rgba(168,151,216,', 'rgba(221,190,130,'];
  const petals = Array.from({ length: reduce ? 0 : 22 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: 5 + Math.random() * 7, v: .25 + Math.random() * .6, r: Math.random() * 6.28, vr: (Math.random() - .5) * .02, sw: Math.random() * 6.28, c: cols[Math.floor(Math.random() * 3)], a: .25 + Math.random() * .35 }));
  const drawPetal = (p) => { px.save(); px.translate(p.x, p.y); px.rotate(p.r); px.scale(1, .6 + .4 * Math.sin(p.sw * 2)); px.beginPath(); px.moveTo(0, 0); px.bezierCurveTo(-p.s, -p.s * .7, -p.s * 1.2, -p.s * 2.4, 0, -p.s * 3); px.bezierCurveTo(p.s * 1.2, -p.s * 2.4, p.s, -p.s * .7, 0, 0); px.fillStyle = p.c + p.a + ')'; px.fill(); px.restore(); };
  const petalLoop = () => { px.clearRect(0, 0, pw, ph); for (const p of petals) { p.y += p.v; p.sw += .01; p.x += Math.sin(p.sw) * .5; p.r += p.vr; if (p.y > ph + 30) { p.y = -30; p.x = Math.random() * pw; } drawPetal(p); } requestAnimationFrame(petalLoop); };
  if (!reduce) petalLoop();

  /* ---------- cursor ---------- */
  const cur = document.querySelector('.cursor');
  if (matchMedia('(hover: hover)').matches && !reduce) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    const cl = () => { cx += (tx - cx) * .2; cy += (ty - cy) * .2; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(cl); }; cl();
    document.querySelectorAll('a, button, .q-canvas-wrap').forEach(el => { el.addEventListener('pointerenter', () => cur.classList.add('big')); el.addEventListener('pointerleave', () => cur.classList.remove('big')); });
  }

  /* ---------- project card tilt ---------- */
  document.querySelectorAll('.pcard').forEach(card => {
    const glow = card.querySelector('.glow');
    card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; glow.style.setProperty('--gx', x + 'px'); glow.style.setProperty('--gy', y + 'px'); if (!reduce) card.style.transform = `rotateX(${(y / r.height - .5) * -8}deg) rotateY(${(x / r.width - .5) * 10}deg)`; });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; glow.style.setProperty('--gx', '-300px'); });
  });

  /* ---------- statement words ---------- */
  const st = document.getElementById('statement');
  const wrapWords = (node) => { [...node.childNodes].forEach(n => { if (n.nodeType === 3) { const frag = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w)); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.appendChild(s); } }); n.replaceWith(frag); } else if (n.nodeType === 1) { n.classList.add('w'); } }); };
  wrapWords(st);

  const ce = document.getElementById('copyEmail');
  ce.addEventListener('click', () => { const done = () => { ce.textContent = 'Copied'; setTimeout(() => ce.textContent = 'Copy email', 1800); }; const sel = () => { const r = document.createRange(); r.selectNodeContents(document.querySelector('.email-addr')); const s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r); ce.textContent = 'Selected, press copy'; setTimeout(() => ce.textContent = 'Copy email', 2200); }; try { navigator.clipboard.writeText('ptnandika21@gmail.com').then(done, sel); } catch (e) { sel(); } });
  document.getElementById('toTop').addEventListener('click', () => { if (window.__lenis) window.__lenis.scrollTo(0); else scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- smooth scroll + scroll scenes ---------- */
  const loader = document.querySelector('.loader');
  const intro = () => {
    if (!hasGsap || reduce) { loader && loader.remove(); st.querySelectorAll('.w').forEach(w => w.style.color = 'var(--petal)'); return; }
    const count = document.getElementById('count'); const o = { v: 0 };
    const tl = gsap.timeline();
    tl.to(o, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => count.textContent = Math.round(o.v) })
      .to(loader, { yPercent: -100, duration: .8, ease: 'expo.inOut' })
      .from('.hero-name .ch', { yPercent: 110, rotate: 6, duration: 1, ease: 'expo.out', stagger: .05, clearProps: 'transform' }, '-=.45')
      .from('.bloom-stage', { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out' }, '<.1')
      .from('.hero-sub, .hero-eyebrow', { y: 30, opacity: 0, duration: .8, ease: 'power3.out' }, '<.2')
      .add(() => loader.remove());
    setTimeout(() => { if (document.body.contains(loader)) { tl.progress(1); } }, 4500);

    if (window.Lenis) { const lenis = new Lenis({ lerp: .09 }); window.__lenis = lenis; lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -70 }); } else if (id === '#top') { e.preventDefault(); lenis.scrollTo(0); } })); }

    // hero name drifts apart as you scroll
    gsap.fromTo('.hero-name', { yPercent: 0 }, { yPercent: -10, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo('.bloom-stage', { yPercent: 0, opacity: 1 }, { yPercent: 18, opacity: .35, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    // statement brightens word by word
    gsap.to(st.querySelectorAll('.w'), { color: '#F3EEF7', stagger: .1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    // big headings slide
    gsap.utils.toArray('.h2, .big-cta').forEach(h => gsap.fromTo(h, { xPercent: -4 }, { xPercent: 2, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } }));
    // horizontal work
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const track = document.getElementById('htrack');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.work', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
      gsap.utils.toArray('.wcard .art').forEach(a => gsap.to(a, { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.work', start: 'top top', end: () => '+=' + dist(), scrub: true } }));
    });
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(intro); else intro();

  /* ---------- Bloch sphere ---------- */
  const cv = document.getElementById('bloch'), cx2 = cv.getContext('2d'), qwrap = document.getElementById('qwrap');
  let W2 = 0, H2 = 0;
  const sizeB = () => { const r = qwrap.getBoundingClientRect(); W2 = r.width; H2 = r.height; const d = Math.min(devicePixelRatio || 1, 2); cv.width = W2 * d; cv.height = H2 * d; cx2.setTransform(d, 0, 0, d, 0, 0); };
  sizeB(); new ResizeObserver(sizeB).observe(qwrap);
  let v = [0, 0, 1], yaw = -0.6, pitch = 0.32, anim = null, trail = [];
  const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rot = (p, k, th) => { const c = Math.cos(th), s = Math.sin(th), kx = cross(k, p), kd = dot(k, p); return [0, 1, 2].map(i => p[i] * c + kx[i] * s + k[i] * kd * (1 - c)); };
  const GATES = { X: [[1, 0, 0], Math.PI], Y: [[0, 1, 0], Math.PI], Z: [[0, 0, 1], Math.PI], H: [norm([1, 0, 1]), Math.PI], S: [[0, 0, 1], Math.PI / 2], T: [[0, 0, 1], Math.PI / 4] };
  const proj = (p) => { const x = p[0] * Math.cos(yaw) - p[1] * Math.sin(yaw), y = p[0] * Math.sin(yaw) + p[1] * Math.cos(yaw); const R = Math.min(W2, H2) * .34; return { X: W2 / 2 + R * x, Y: H2 / 2 - R * (p[2] * Math.cos(pitch) - y * Math.sin(pitch)), d: y * Math.cos(pitch) + p[2] * Math.sin(pitch), R }; };
  const updateReadout = () => {
    const th = Math.acos(Math.max(-1, Math.min(1, v[2]))), phi = Math.atan2(v[1], v[0]);
    const a = Math.cos(th / 2), b = Math.sin(th / 2), p0 = a * a;
    const phs = Math.abs(b) < 1e-3 ? '' : ` · e<sup>i${(phi / Math.PI).toFixed(2)}π</sup>`;
    document.getElementById('ket').innerHTML = `|ψ⟩ = <em>${a.toFixed(3)}</em>|0⟩ + <em>${b.toFixed(3)}</em>${phs}|1⟩`;
    document.getElementById('p0').textContent = Math.round(p0 * 100) + '%'; document.getElementById('p1').textContent = Math.round((1 - p0) * 100) + '%';
    document.getElementById('p0bar').style.width = (p0 * 100) + '%'; document.getElementById('p1bar').style.width = ((1 - p0) * 100) + '%';
  };
  const runRot = (k, th, dur, done) => { const v0 = v.slice(); const t0 = performance.now(); anim = (now) => { let t = Math.min(1, (now - t0) / dur); const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; v = norm(rot(v0, k, th * e)); if (t >= 1) { anim = null; done && done(); } }; };
  document.querySelectorAll('.gate').forEach(b => b.addEventListener('click', () => { if (anim) return; const [k, th] = GATES[b.dataset.g]; runRot(k, th, 700); }));
  const hist = document.getElementById('history'); let shots = [];
  document.getElementById('measure').addEventListener('click', () => {
    if (anim) return; const p0 = (1 + v[2]) / 2; const out = Math.random() < p0 ? 0 : 1; const target = out ? [0, 0, -1] : [0, 0, 1];
    const c = dot(v, target); const done = () => { v = target.slice(); shots.push(out); if (shots.length > 12) shots.shift(); hist.innerHTML = '<span>Measured:</span>' + shots.map(s => `<span class="shot ${s ? 'one' : ''}">|${s}⟩</span>`).join(''); };
    if (c > .9999) { done(); return; }
    let k = cross(v, target); if (Math.hypot(...k) < 1e-6) k = [1, 0, 0]; runRot(norm(k), Math.acos(Math.max(-1, Math.min(1, c))), 500, done);
  });
  document.getElementById('reset').addEventListener('click', () => { if (anim) return; const c = dot(v, [0, 0, 1]); if (c > .9999) return; let k = cross(v, [0, 0, 1]); if (Math.hypot(...k) < 1e-6) k = [1, 0, 0]; runRot(norm(k), Math.acos(Math.max(-1, Math.min(1, c))), 500); trail = []; });
  let drag = null;
  qwrap.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; qwrap.setPointerCapture(e.pointerId); });
  qwrap.addEventListener('pointermove', (e) => { if (!drag) return; yaw = drag.yaw + (e.clientX - drag.x) * .01; pitch = Math.max(-.2, Math.min(1.1, drag.pitch + (e.clientY - drag.y) * .006)); });
  qwrap.addEventListener('pointerup', () => drag = null); qwrap.addEventListener('pointercancel', () => drag = null);
  const circle3 = (f, n = 90) => Array.from({ length: n + 1 }, (_, i) => proj(f(i / n * Math.PI * 2)));
  const strokePath = (pts, back, col, w) => { cx2.lineWidth = w; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const isBack = (a.d + b.d) / 2 < 0; if (isBack !== back) continue; cx2.strokeStyle = col; cx2.beginPath(); cx2.moveTo(a.X, a.Y); cx2.lineTo(b.X, b.Y); cx2.stroke(); } };
  const drawFlower = (x, y, r, spin) => { cx2.save(); cx2.translate(x, y); cx2.rotate(spin); for (let i = 0; i < 5; i++) { cx2.rotate(Math.PI * 2 / 5); const g = cx2.createRadialGradient(0, -r * .6, 1, 0, -r * .5, r * 1.1); g.addColorStop(0, '#F6E4EE'); g.addColorStop(.5, '#D38DB2'); g.addColorStop(1, '#6E2F55'); cx2.fillStyle = g; cx2.beginPath(); cx2.moveTo(0, 0); cx2.bezierCurveTo(-r * .45, -r * .3, -r * .55, -r * .95, 0, -r * 1.2); cx2.bezierCurveTo(r * .55, -r * .95, r * .45, -r * .3, 0, 0); cx2.fill(); } cx2.fillStyle = '#EBCB8B'; cx2.beginPath(); cx2.arc(0, 0, r * .28, 0, 7); cx2.fill(); cx2.restore(); };
  const labels = [[[0, 0, 1.18], '|0⟩'], [[0, 0, -1.18], '|1⟩'], [[1.22, 0, 0], '|+⟩'], [[-1.22, 0, 0], '|−⟩'], [[0, 1.22, 0], '|+i⟩']];
  const drawB = (now) => {
    if (anim) anim(now);
    if (!drag && !reduce) yaw += .0016;
    cx2.clearRect(0, 0, W2, H2);
    const c = proj([0, 0, 0]); const R = c.R;
    const eq = circle3(t => [Math.cos(t), Math.sin(t), 0]);
    const m1 = circle3(t => [Math.cos(t), 0, Math.sin(t)]);
    const m2 = circle3(t => [0, Math.cos(t), Math.sin(t)]);
    strokePath(eq, true, 'rgba(185,176,204,.18)', 1); strokePath(m1, true, 'rgba(140,158,219,.14)', 1); strokePath(m2, true, 'rgba(211,141,178,.12)', 1);
    const g = cx2.createRadialGradient(c.X - R * .35, c.Y - R * .4, R * .1, c.X, c.Y, R); g.addColorStop(0, 'rgba(168,151,216,.30)'); g.addColorStop(.6, 'rgba(211,141,178,.08)'); g.addColorStop(1, 'rgba(16,13,29,.2)');
    cx2.fillStyle = g; cx2.beginPath(); cx2.arc(c.X, c.Y, R, 0, 7); cx2.fill(); cx2.strokeStyle = 'rgba(168,151,216,.5)'; cx2.lineWidth = 1.4; cx2.stroke();
    const axes = [[[0, 0, 1], [0, 0, -1]], [[1, 0, 0], [-1, 0, 0]], [[0, 1, 0], [0, -1, 0]]];
    cx2.setLineDash([3, 5]); cx2.strokeStyle = 'rgba(185,176,204,.35)'; cx2.lineWidth = 1; axes.forEach(([a, b]) => { const p = proj(a), q = proj(b); cx2.beginPath(); cx2.moveTo(p.X, p.Y); cx2.lineTo(q.X, q.Y); cx2.stroke(); }); cx2.setLineDash([]);
    strokePath(eq, false, 'rgba(185,176,204,.55)', 1.2); strokePath(m1, false, 'rgba(140,158,219,.4)', 1); strokePath(m2, false, 'rgba(211,141,178,.35)', 1);
    cx2.font = '500 13px "JetBrains Mono", monospace'; cx2.textAlign = 'center'; cx2.textBaseline = 'middle';
    labels.forEach(([p, t]) => { const q = proj(p); cx2.fillStyle = q.d < -.1 ? 'rgba(185,176,204,.45)' : '#F3EEF7'; cx2.fillText(t, q.X, q.Y); });
    // trail
    trail.push(v.slice()); if (trail.length > 70) trail.shift();
    for (let i = 1; i < trail.length; i++) { const a = proj(trail[i - 1]), b = proj(trail[i]); cx2.strokeStyle = `rgba(221,190,130,${i / trail.length * .6})`; cx2.lineWidth = 2; cx2.beginPath(); cx2.moveTo(a.X, a.Y); cx2.lineTo(b.X, b.Y); cx2.stroke(); }
    // shadow on equator plane
    const sh = proj([v[0], v[1], 0]); cx2.setLineDash([2, 4]); cx2.strokeStyle = 'rgba(221,190,130,.35)'; cx2.beginPath(); cx2.moveTo(c.X, c.Y); cx2.lineTo(sh.X, sh.Y); cx2.lineTo(proj(v).X, proj(v).Y); cx2.stroke(); cx2.setLineDash([]);
    // vector
    const tip = proj(v); const lg = cx2.createLinearGradient(c.X, c.Y, tip.X, tip.Y); lg.addColorStop(0, '#DDBE82'); lg.addColorStop(1, '#D38DB2');
    cx2.strokeStyle = lg; cx2.lineWidth = 3.5; cx2.lineCap = 'round'; cx2.beginPath(); cx2.moveTo(c.X, c.Y); cx2.lineTo(tip.X, tip.Y); cx2.stroke();
    cx2.fillStyle = '#F3EEF7'; cx2.beginPath(); cx2.arc(c.X, c.Y, 3.5, 0, 7); cx2.fill();
    drawFlower(tip.X, tip.Y, Math.max(10, R * .1) * (1 + tip.d * .15), now * .0012);
    updateReadout();
    requestAnimationFrame(drawB);
  };
  requestAnimationFrame(drawB);
})();
