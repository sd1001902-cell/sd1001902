// ============ 九幽回廊 · 画面增强 ============
// 画布粒子（叠加发光）、顿帧、慢镜、受击白闪、化灰、状态持续特效、精英光环、首领蓄力预警、大招演出、战斗背景。
'use strict';
const GFX = (() => {
  const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let arena = null, cv = null, g = null, W = 0, H = 0, DPR = 1, raf = 0, lastT = 0, ts = 1, stopUntil = 0, slowUntil = 0;
  const P = [], FX = [];   // 粒子；整屏的东西（幕布、闪光、闪电、速度线）
  const lvl = () => (typeof SAVE !== 'undefined' && SAVE && SAVE.gfx != null) ? SAVE.gfx : 2;   // 0 低 1 中 2 高
  const dens = () => [0.35, 0.75, 1.2][lvl()];
  const cap = () => [160, 380, 800][lvl()];
  const R = Math.random, rr = (a, b) => a + R() * (b - a);
  const fac = () => (typeof VFX !== 'undefined' && VFX.fac ? VFX.fac() : 1);
  const now = () => performance.now();
  const rgbCache = {};
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (rgbCache[c]) return rgbCache[c];
    let h = String(c || '#fff').trim();
    if (h.startsWith('rgb')) { const m = h.match(/[\d.]+/g).map(Number); return (rgbCache[c] = [m[0], m[1], m[2]]); }
    h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    const n = parseInt(h.slice(0, 6), 16); return (rgbCache[c] = [n >> 16 & 255, n >> 8 & 255, n & 255]);
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  const mixRgb = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const css = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a == null ? 1 : a.toFixed(3)})`;
  const lighten = (c, k) => mixRgb(rgb(c), [255, 248, 230], k);

  // ======== 画布 ========
  function setup(a) {
    arena = a; P.length = 0; FX.length = 0; stopUntil = 0; slowUntil = 0; ts = 1; AMB = null;
    if (!a) return;
    cv = document.createElement('canvas'); cv.className = 'fxc'; a.appendChild(cv);
    g = cv.getContext('2d'); resize();
    if (!raf) { lastT = now(); raf = requestAnimationFrame(loop); }
  }
  function resize() {
    if (!cv || !arena) return;
    DPR = Math.min(2, window.devicePixelRatio || 1); W = arena.clientWidth; H = arena.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  function alive() { return arena && cv && document.body.contains(cv); }

  // ======== 粒子 ========
  // shape: px 像素方块 · glow 发光团 · spark 拖尾火花 · smoke 烟 · ring 冲击环 · shard 碎片 · ink 墨点 · star 星芒 · beam 光柱
  function add(o) {
    if (P.length >= cap()) P.splice(0, Math.ceil(cap() * 0.08));
    const life = (o.life || 600) * fac();
    const p = { x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, ax: o.ax || 0, ay: o.ay || 0, drag: o.drag || 0, t: -(o.delay || 0) * fac(), life,
      s0: o.s0 != null ? o.s0 : (o.s || 4), s1: o.s1 != null ? o.s1 : (o.s0 != null ? o.s0 : (o.s || 4)), c0: rgb(o.c0 || o.c || '#fff'), c1: rgb(o.c1 || o.c0 || o.c || '#fff'),
      a0: o.a0 != null ? o.a0 : 1, shape: o.shape || 'px', add: o.add != null ? o.add : (o.shape === 'glow' || o.shape === 'spark' || o.shape === 'ring' || o.shape === 'star' || o.shape === 'beam'),
      rot: o.rot || R() * 6.28, vr: o.vr || 0, w: o.w || 3, fadeIn: o.fadeIn || 0, follow: o.follow || null, len: o.len || 0.05 };
    P.push(p); return p;
  }
  function burst(pt, o = {}) {
    if (!pt || !alive()) return;
    const n = Math.max(1, Math.round((o.n || 10) * dens()));
    for (let i = 0; i < n; i++) {
      const ang = o.dir != null ? o.dir + (R() - 0.5) * (o.cone != null ? o.cone : 1) : R() * Math.PI * 2;
      const sp = (o.speed || 120) * rr(0.35, 1);
      add({ x: pt.x + (R() - 0.5) * (o.jit || 8), y: pt.y + (R() - 0.5) * (o.jit || 8), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + (o.rise || 0),
        ay: o.grav || 0, drag: o.drag != null ? o.drag : 2.2, life: (o.life || 600) * rr(0.6, 1.15), s0: (o.s || 4) * rr(0.7, 1.3), s1: o.s1 != null ? o.s1 * rr(0.7, 1.3) : null,
        c0: o.c0 || o.c, c1: o.c1, shape: o.shape || 'px', add: o.add, a0: o.a0, vr: o.vr != null ? o.vr : (R() - 0.5) * 10, delay: o.delay ? R() * o.delay : 0, len: o.len });
    }
  }
  // 常用组合
  const glow = (pt, c, r, life) => pt && alive() && add({ x: pt.x, y: pt.y, shape: 'glow', s0: r * 0.6, s1: r, c0: c, life: life || 380, a0: 0.9 });
  const shock = (pt, c, r, life, w) => pt && alive() && add({ x: pt.x, y: pt.y, shape: 'ring', s0: r * 0.12, s1: r, c0: c, life: life || 420, w: w || 3, a0: 0.95 });
  const sparks = (pt, c, n, sp, o = {}) => burst(pt, { n, c0: '#fffbe8', c1: c, speed: sp || 260, life: o.life || 380, s: o.s || 2, shape: 'spark', drag: 3, grav: o.grav || 120, dir: o.dir, cone: o.cone, len: 0.045 });
  const embers = (pt, c, n, o = {}) => burst(pt, { n, c0: o.c0 || '#fff2b0', c1: c, speed: o.speed || 60, rise: -70, grav: -30, life: o.life || 1100, s: o.s || 3, shape: 'px', drag: 1.2, jit: o.jit || 30, add: true });
  const smoke = (pt, c, n, o = {}) => burst(pt, { n, c0: c || '#3a3030', c1: o.c1 || c || '#1a1414', speed: o.speed || 40, rise: o.rise != null ? o.rise : -30, life: o.life || 1200, s: o.s || 14, s1: o.s1 || 34, shape: 'smoke', a0: o.a0 || 0.45, drag: 1.5, jit: o.jit || 20, add: false });
  const shards = (pt, c, n, o = {}) => burst(pt, { n, c0: o.c0 || '#ffffff', c1: c, speed: o.speed || 220, grav: 420, life: o.life || 700, s: o.s || 5, shape: 'shard', drag: 1.4, vr: 14 });
  const ink = (pt, n, spread, c) => burst(pt, { n, c0: c || '#120a08', c1: c || '#120a08', speed: spread * 3, life: 700, s: 7, s1: 2, shape: 'ink', grav: 160, drag: 3.5, jit: 10, add: false });
  const flame = (pt, c, n, o = {}) => burst(pt, { n, c0: '#fff4b8', c1: c || '#ff5a1a', speed: o.speed || 50, rise: -120, grav: -60, life: o.life || 700, s: o.s || 9, s1: 2, shape: 'glow', drag: 1.8, jit: o.jit || 26 });
  const dust = (pt, c, n) => burst(pt, { n: n || 8, c0: c || '#8a7a68', c1: '#3a3028', speed: 90, rise: -10, life: 700, s: 8, s1: 22, shape: 'smoke', a0: 0.5, drag: 3, jit: 30, add: false, dir: -Math.PI / 2, cone: 3 });

  // ======== 整屏效果 ========
  function bolt(pts, c, dur) {
    if (!alive() || pts.length < 2) return;
    const segs = [];
    pts.forEach((p, i) => { if (!i) return; const q = pts[i - 1], n = 7; let px = q.x, py = q.y;
      for (let k = 1; k <= n; k++) { const t = k / n, j = k === n ? 0 : 16, x = q.x + (p.x - q.x) * t + (R() - 0.5) * j, y = q.y + (p.y - q.y) * t + (R() - 0.5) * j; segs.push([px, py, x, y]); px = x; py = y; } });
    FX.push({ k: 'bolt', segs, c: rgb(c), t: 0, life: (dur || 380) * fac() });
    const end = pts[pts.length - 1]; glow(end, c, 70, 300); sparks(end, c, 10, 220);
  }
  function flash(c, a, life) { if (!alive()) return; FX.push({ k: 'flash', c: rgb(c || '#fff'), a: a || 0.5, t: 0, life: (life || 160) * fac() }); }
  function veil(a, life, hold) { if (!alive()) return; FX.push({ k: 'veil', a: a || 0.6, t: 0, life: (life || 900) * fac(), hold: hold || 0.6 }); }
  function speedLines(c, life) { if (!alive()) return; const L = []; for (let i = 0; i < 46; i++) L.push({ a: R() * 6.28, r0: rr(0.15, 0.4), w: rr(1, 3) }); FX.push({ k: 'lines', L, c: rgb(c || '#fff'), t: 0, life: (life || 700) * fac() }); }
  function rays(pt, c, life) { if (!alive() || !pt) return; const L = []; for (let i = 0; i < 12; i++) L.push({ a: i / 12 * 6.28 + rr(-0.15, 0.15), w: rr(4, 10) }); FX.push({ k: 'rays', x: pt.x, y: pt.y, L, c: rgb(c || '#fff3c0'), t: 0, life: (life || 800) * fac() }); }
  function beam(pt, c, life) { if (!alive() || !pt) return; FX.push({ k: 'beam', x: pt.x, y: pt.y, c: rgb(c || '#ffd75a'), t: 0, life: (life || 1600) * fac() }); }

  // ======== 顿帧 / 慢镜 / 镜头 ========
  function hitstop(ms) {
    if (!arena || RM || lvl() === 0) return;
    const d = ms * Math.max(0.5, fac()), anims = arena.getAnimations ? arena.getAnimations({ subtree: true }).filter(a => a.playState === 'running') : [];
    anims.forEach(a => { try { a.pause(); } catch (e) {} });
    stopUntil = Math.max(stopUntil, now() + d);
    setTimeout(() => anims.forEach(a => { try { if (a.playState === 'paused') a.play(); } catch (e) {} }), d);
  }
  function slowmo(ms, rate) {
    if (!arena || RM || lvl() === 0) return;
    rate = rate || 0.3; slowUntil = now() + ms; ts = rate;
    const anims = arena.getAnimations ? arena.getAnimations({ subtree: true }) : [];
    anims.forEach(a => { try { a.updatePlaybackRate ? a.updatePlaybackRate(rate) : (a.playbackRate = rate); } catch (e) {} });
    setTimeout(() => { ts = 1; anims.forEach(a => { try { a.updatePlaybackRate ? a.updatePlaybackRate(1) : (a.playbackRate = 1); } catch (e) {} }); }, ms);
  }
  function punch(k) {
    if (!arena || RM || lvl() === 0 || !arena.animate) return;
    const t = arena.querySelectorAll('.side,.sv-paint,.sv-back');
    t.forEach(el => el.animate([{ scale: '1' }, { scale: String(1 + (k || 0.04)) }, { scale: '1' }], { duration: 260 * fac(), easing: 'cubic-bezier(.2,.8,.3,1)' }));
  }
  function whiteFlash(id) {
    const el = document.getElementById('u-' + id); if (!el) return;
    el.classList.remove('hflash'); void el.offsetWidth; el.classList.add('hflash');
    setTimeout(() => el.classList.remove('hflash'), 90);
  }

  // ======== 化灰：按像素把人拆成粒子 ========
  function spriteImg(el) { return el && (el.querySelector('.act img') || el.querySelector('.sp img')); }
  function disintegrate(el, o = {}) {
    if (!alive() || !el) return 0;
    const im = spriteImg(el); if (!im || !im.naturalWidth) return 0;
    const A = arena.getBoundingClientRect(), r = im.getBoundingClientRect();
    if (!r.width) return 0;
    const nw = im.naturalWidth, nh = im.naturalHeight, oc = document.createElement('canvas'); oc.width = nw; oc.height = nh;
    const ox = oc.getContext('2d'); ox.drawImage(im, 0, 0);
    let data; try { data = ox.getImageData(0, 0, nw, nh).data; } catch (e) { return 0; }
    const flip = getComputedStyle(im).transform.includes('-1') || (im.closest('.act') && getComputedStyle(im.closest('.act')).transform.startsWith('matrix(-1'));
    const budget = Math.round((o.n || 220) * dens()), total = nw * nh, step = Math.max(1, Math.round(Math.sqrt(total / Math.max(40, budget * 2.2))));
    const px = r.width / nw * step, dirx = o.dirx != null ? o.dirx : 1;
    for (let y = 0; y < nh; y += step) for (let x = 0; x < nw; x += step) {
      const i = (y * nw + x) * 4; if (data[i + 3] < 40) continue;
      const c = [data[i], data[i + 1], data[i + 2]], X = r.left - A.left + (flip ? nw - 1 - x : x) / nw * r.width, Y = r.top - A.top + y / nh * r.height;
      const k = y / nh;
      add({ x: X, y: Y, vx: rr(10, 70) * dirx + (R() - 0.5) * 30, vy: rr(-90, -20), ay: -20, drag: 0.6, life: rr(700, 1300) * (o.slow || 1), delay: (o.top ? k : 1 - k) * 360 + R() * 160, s0: Math.max(2, px), s1: 1,
        c0: c, c1: o.ash ? rgb(o.ash) : mixRgb(c, [40, 30, 30], 0.7), shape: 'px', add: false });
      if (R() < 0.12) add({ x: X, y: Y, vx: rr(-20, 40), vy: rr(-80, -30), life: rr(600, 1000), delay: (o.top ? k : 1 - k) * 360, s0: 3, s1: 1, c0: o.ember || '#ffb04a', shape: 'px', add: true });
    }
    const sp = el.querySelector('.sp'); if (sp) { sp.style.transition = 'opacity .12s'; sp.style.opacity = '0'; }
    return 520;
  }
  // 首领倒下：三段——裂光、爆开、化灰
  function bossDeath(el, pt) {
    if (!alive() || !pt) return 0;
    const f = fac();
    hitstop(220); flash('#fff', 0.6, 220); rays(pt, '#fff3c0', 1000);
    for (let k = 0; k < 4; k++) setTimeout(() => { if (!alive()) return; glow(pt, '#ffe9a0', 90 + k * 30, 260); sparks(pt, '#ffd75a', 10, 260); }, k * 180 * f);
    setTimeout(() => { if (!alive()) return; flash('#fff6d8', 0.75, 260); shock(pt, '#ffd75a', 260, 700, 6); shock(pt, '#ffffff', 160, 420, 3); glow(pt, '#ff8a3a', 220, 700);
      sparks(pt, '#ff8a3a', 40, 460, { life: 700 }); embers(pt, '#ff6a1a', 30, { speed: 160, jit: 60 }); smoke(pt, '#2a1a14', 16, { speed: 90, s: 20, s1: 60 });
      disintegrate(el, { n: 360, top: false, slow: 1.4 }); if (typeof VFX !== 'undefined') VFX.shakeNow && VFX.shakeNow(14); }, 760 * f);
    return Math.round(1300 * f);
  }

  // ======== 单位身上的持续特效（每帧扫一遍场上的人） ========
  const acc = {};
  function unitBox(el) {
    const s = el.querySelector('.sp'); if (!s || !arena) return null;
    const A = arena.getBoundingClientRect(), r = s.getBoundingClientRect(); if (!r.width) return null;
    return { x: r.left - A.left + r.width / 2, y: r.top - A.top + r.height / 2, w: r.width, h: r.height, top: r.top - A.top, bot: r.bottom - A.top };
  }
  function every(key, rate, dt) { acc[key] = (acc[key] || 0) + rate * dens() * dt; const n = Math.floor(acc[key]); acc[key] -= n; return n; }
  const ELITE_C = { normal: '#ff8a3a', rare: '#ffd75a' };
  function unitFx(dt, t) {
    if (!arena) return;
    const units = arena.querySelectorAll('.unit:not(.dead):not(.gone)');
    let charging = false;
    units.forEach(el => {
      const C = el.classList; const b = unitBox(el); if (!b) return; const id = el.id;
      const sx = () => b.x + (R() - 0.5) * b.w * 0.6, sy = () => b.top + b.h * rr(0.3, 0.95);
      if (C.contains('st-burn')) {
        for (let i = every(id + 'b', 34, dt); i > 0; i--) add({ x: sx(), y: sy(), vx: rr(-10, 10), vy: rr(-110, -60), ay: -40, drag: 1, life: rr(380, 620), s0: rr(5, 9), s1: 1, c0: '#fff0a0', c1: '#ff4a10', shape: 'glow', a0: 0.85 });
        for (let i = every(id + 'bs', 4, dt); i > 0; i--) add({ x: sx(), y: b.top + b.h * 0.3, vx: rr(-8, 8), vy: rr(-40, -25), life: 1200, s0: 8, s1: 22, c0: '#3a2a24', c1: '#1a1210', shape: 'smoke', a0: 0.35, add: false });
        for (let i = every(id + 'be', 8, dt); i > 0; i--) add({ x: sx(), y: sy(), vx: rr(-20, 20), vy: rr(-120, -60), life: 900, s0: 2, s1: 1, c0: '#ffe08a', shape: 'px', add: true });
      }
      if (C.contains('st-tox')) {
        for (let i = every(id + 't', 10, dt); i > 0; i--) add({ x: sx(), y: sy(), vx: rr(-6, 6), vy: rr(-40, -20), life: rr(700, 1100), s0: rr(2, 4), s1: rr(4, 7), c0: '#a8ff7a', shape: 'ring', w: 1.5, a0: 0.8 });
        for (let i = every(id + 'td', 3, dt); i > 0; i--) add({ x: sx(), y: b.top + b.h * rr(0.4, 0.8), vy: 20, ay: 260, life: 600, s0: 3, s1: 2, c0: '#7fe05a', c1: '#3a7a20', shape: 'px', add: false });
      }
      if (C.contains('st-ice')) {
        for (let i = every(id + 'i', 9, dt); i > 0; i--) add({ x: sx(), y: sy(), life: rr(400, 700), s0: rr(3, 6), s1: 0.5, c0: '#ffffff', c1: '#8fd8ff', shape: 'star' });
        for (let i = every(id + 'im', 3, dt); i > 0; i--) add({ x: sx(), y: b.bot - 4, vx: rr(-14, 14), vy: rr(-12, -4), life: 1300, s0: 10, s1: 26, c0: '#cfefff', c1: '#8fd8ff', shape: 'smoke', a0: 0.22, add: false });
      }
      if (C.contains('st-cur')) for (let i = every(id + 'c', 8, dt); i > 0; i--) add({ x: sx(), y: b.bot - 6, vx: rr(-14, 14), vy: rr(-70, -40), ax: Math.sin(t / 200) * 40, life: rr(800, 1200), s0: rr(6, 10), s1: 1, c0: '#e0b8ff', c1: '#7a3ac0', shape: 'glow', a0: 0.7 });
      if (C.contains('st-rage')) for (let i = every(id + 'r', 12, dt); i > 0; i--) add({ x: sx(), y: b.bot - rr(0, 20), vx: rr(-10, 10), vy: rr(-120, -70), life: rr(500, 800), s0: 3, s1: 1, c0: '#ffb0a0', c1: '#ff2a1a', shape: 'px', add: true });
      if (C.contains('st-stun')) for (let i = every(id + 's', 5, dt); i > 0; i--) add({ x: b.x + (R() - 0.5) * b.w * 0.5, y: b.top + 2, life: 380, s0: 4, s1: 0.5, c0: '#ffffff', c1: '#ffe08a', shape: 'star' });
      if (C.contains('st-shd')) for (let i = every(id + 'sh', 6, dt); i > 0; i--) { const a = R() * 6.28; add({ x: b.x + Math.cos(a) * b.w * 0.5, y: b.y + Math.sin(a) * b.h * 0.5, vy: -10, life: 500, s0: 3, s1: 0.5, c0: '#ffffff', c1: '#ffd75a', shape: 'star' }); }
      if (C.contains('k-elite') || C.contains('rare')) {
        const col = C.contains('rare') ? '#ffd75a' : ELITE_C.normal;
        FX.push({ k: 'aura', x: b.x, y: b.bot - 2, r: b.w * 0.55, t: 0, life: 1, once: true, c: rgb(col) });
        for (let i = every(id + 'e', 5, dt); i > 0; i--) add({ x: b.x + (R() - 0.5) * b.w * 0.9, y: b.bot - 2, vy: rr(-50, -25), life: rr(800, 1300), s0: 2, s1: 1, c0: col, shape: 'px', add: true });
      }
      if (C.contains('wr-legend')) { const wp = el.querySelector('.wp'), ra = el.querySelector('.act.rig'), A = arena.getBoundingClientRect();
        if (wp) { const r = wp.getBoundingClientRect();
          for (let i = every(id + 'wl', 14, dt); i > 0; i--) add({ x: r.left - A.left + R() * r.width, y: r.top - A.top + R() * r.height, vy: rr(-40, -15), life: rr(500, 900), s0: 2, s1: 1, c0: '#ffe0a0', c1: '#ff6a1a', shape: 'px', add: true }); }
        else if (ra) { const im = ra.querySelector('img.hf'), r = im && im.getBoundingClientRect(); if (r && r.width) { const hx = +ra.dataset.hx, hy = +ra.dataset.hy, tx = +ra.dataset.tx, ty = +ra.dataset.ty;
          for (let i = every(id + 'wl', 14, dt); i > 0; i--) { const k = R(); add({ x: r.left - A.left + (hx + (tx - hx) * k) * r.width + rr(-2, 2), y: r.top - A.top + (hy + (ty - hy) * k) * r.height + rr(-2, 2), vy: rr(-40, -15), life: rr(500, 900), s0: 2, s1: 1, c0: '#ffe0a0', c1: '#ff6a1a', shape: 'px', add: true }); } } } }
      if (C.contains('gear-set')) FX.push({ k: 'aura', x: b.x, y: b.bot - 2, r: b.w * 0.5, t: 0, life: 1, once: true, c: rgb('#3cc850') });
      if (C.contains('k-boss')) for (let i = every(id + 'B', 3, dt); i > 0; i--) add({ x: b.x + (R() - 0.5) * b.w, y: b.bot - 4, vx: rr(-20, 20), vy: rr(-14, -4), life: 1600, s0: 16, s1: 40, c0: '#2a0a0a', c1: '#120404', shape: 'smoke', a0: 0.35, add: false });
      if (C.contains('charging')) {
        charging = true;
        FX.push({ k: 'aura', x: b.x, y: b.bot - 2, r: b.w * 0.7, t: 0, life: 1, once: true, c: rgb('#ff3a1a'), pulse: true });
        for (let i = every(id + 'ch', 22, dt); i > 0; i--) { const a = R() * 6.28, d = rr(60, 110); add({ x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d, vx: -Math.cos(a) * d * 2.2, vy: -Math.sin(a) * d * 2.2, drag: 0, life: 420, s0: 2, s1: 1, c0: '#ffd0a0', c1: '#ff3a1a', shape: 'spark', len: 0.06 }); }
      }
    });
    if (charging) { const h = document.getElementById('u-P'); const b = h && unitBox(h); if (b) FX.push({ k: 'warn', x: b.x, y: b.bot - 2, r: b.w * 0.8, t: 0, life: 1, once: true }); }
  }

  // ======== 主循环 ========
  function loop(t) {
    raf = 0;
    if (!alive()) { P.length = 0; FX.length = 0; return; }
    raf = requestAnimationFrame(loop);
    let dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    if (cv.width !== Math.round(arena.clientWidth * DPR) || cv.height !== Math.round(arena.clientHeight * DPR)) resize();
    const frozen = now() < stopUntil, k = (frozen ? 0 : dt) * (now() < slowUntil ? ts : 1) / Math.max(0.3, fac());
    if (!frozen && !RM) { unitFx(dt, t); ambientTick(dt); }
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    // 幕布、闪光在最底下/最上面分开画
    for (const F of FX) if (F.k === 'veil') { const q = F.t / F.life, a = q < 0.15 ? q / 0.15 : q > F.hold ? Math.max(0, 1 - (q - F.hold) / (1 - F.hold)) : 1; g.fillStyle = `rgba(6,3,4,${(F.a * a).toFixed(3)})`; g.fillRect(0, 0, W, H); }
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += k * 1000;
      if (p.t >= p.life) { P.splice(i, 1); continue; }
      if (p.t < 0) { if (p.shape === 'px') drawP(p, 0); continue; }
      const dd = Math.max(0, 1 - p.drag * k); p.vx = (p.vx + p.ax * k) * dd; p.vy = (p.vy + p.ay * k) * dd; p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
      drawP(p, p.t / p.life);
    }
    g.globalCompositeOperation = 'source-over';
    for (let i = FX.length - 1; i >= 0; i--) {
      const F = FX[i];
      if (F.once) { drawFX(F, t); FX.splice(i, 1); continue; }
      F.t += k * 1000; if (F.t >= F.life) { FX.splice(i, 1); continue; }
      if (F.k !== 'veil') drawFX(F, t);
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  function drawP(p, q) {
    const s = lerp(p.s0, p.s1, q), c = q < 0.5 ? mixRgb(p.c0, p.c1, q * 2 * 0.5) : mixRgb(p.c0, p.c1, 0.5 + (q - 0.5));
    let a = p.a0 * (q > 0.6 ? (1 - q) / 0.4 : 1); if (p.fadeIn && q < p.fadeIn) a *= q / p.fadeIn;
    if (a <= 0.01 || s <= 0) return;
    g.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    switch (p.shape) {
      case 'px': { const z = Math.max(1, Math.round(s / 2) * 2); g.fillStyle = css(c, a); g.fillRect(Math.round(p.x / 2) * 2 - z / 2, Math.round(p.y / 2) * 2 - z / 2, z, z); break; }
      case 'glow': { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, s); gr.addColorStop(0, css(lighten(c, 0.5), a)); gr.addColorStop(0.35, css(c, a * 0.75)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(p.x - s, p.y - s, s * 2, s * 2); break; }
      case 'smoke': { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, s); gr.addColorStop(0, css(c, a)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.fillRect(p.x - s, p.y - s, s * 2, s * 2); break; }
      case 'spark': { g.strokeStyle = css(c, a); g.lineWidth = Math.max(1, s); g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * p.len, p.y - p.vy * p.len); g.stroke(); break; }
      case 'ring': { g.strokeStyle = css(c, a); g.lineWidth = Math.max(1, p.w * (1 - q * 0.6)); g.beginPath(); g.arc(p.x, p.y, Math.max(0.5, s), 0, 6.283); g.stroke(); break; }
      case 'shard': { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = css(c, a); g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.45, 0); g.lineTo(0, s * 0.8); g.lineTo(-s * 0.45, 0); g.closePath(); g.fill(); g.fillStyle = css([255, 255, 255], a * 0.7); g.fillRect(-1, -s * 0.6, 1.5, s * 0.6); g.restore(); break; }
      case 'ink': { g.fillStyle = css(c, a); g.beginPath(); g.arc(p.x, p.y, Math.max(0.5, s), 0, 6.283); g.fill(); break; }
      case 'star': { g.save(); g.translate(p.x, p.y); g.rotate(q * 2); g.fillStyle = css(c, a); g.fillRect(-s, -0.75, s * 2, 1.5); g.fillRect(-0.75, -s, 1.5, s * 2); g.fillStyle = css([255, 255, 255], a); g.fillRect(-1, -1, 2, 2); g.restore(); break; }
    }
  }
  function drawFX(F, t) {
    const q = F.life > 1 ? F.t / F.life : 0;
    switch (F.k) {
      case 'flash': g.globalCompositeOperation = 'lighter'; g.fillStyle = css(F.c, F.a * (1 - q)); g.fillRect(0, 0, W, H); break;
      case 'bolt': {
        if (R() < 0.25 && q < 0.7) return;   // 闪烁
        g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
        for (const [w, a, col] of [[10, 0.25 * (1 - q), F.c], [4, 0.7 * (1 - q), F.c], [1.6, 1 - q, [255, 255, 255]]]) {
          g.strokeStyle = css(col, a); g.lineWidth = w; g.beginPath(); F.segs.forEach(([x0, y0, x1, y1], i) => { if (!i) g.moveTo(x0, y0); g.lineTo(x1, y1); }); g.stroke();
        }
        break;
      }
      case 'lines': {
        g.globalCompositeOperation = 'lighter'; const cx = W / 2, cy = H / 2, M = Math.hypot(W, H) / 2;
        for (const L of F.L) { const r0 = M * (L.r0 + q * 0.5), r1 = r0 + M * 0.35; g.strokeStyle = css(F.c, 0.45 * (1 - q)); g.lineWidth = L.w; g.beginPath(); g.moveTo(cx + Math.cos(L.a) * r0, cy + Math.sin(L.a) * r0); g.lineTo(cx + Math.cos(L.a) * r1, cy + Math.sin(L.a) * r1); g.stroke(); }
        break;
      }
      case 'rays': {
        g.globalCompositeOperation = 'lighter'; const len = 40 + q * 260, a = q < 0.8 ? 0.55 : 0.55 * (1 - q) / 0.2;
        for (const L of F.L) { g.save(); g.translate(F.x, F.y); g.rotate(L.a + q * 0.4); const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, css(F.c, a)); gr.addColorStop(1, css(F.c, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(len, -L.w * (1 + q)); g.lineTo(len, L.w * (1 + q)); g.closePath(); g.fill(); g.restore(); }
        break;
      }
      case 'beam': {
        g.globalCompositeOperation = 'lighter'; const a = q < 0.15 ? q / 0.15 : q > 0.7 ? (1 - q) / 0.3 : 1, w = 26 * (0.6 + 0.4 * Math.sin(t / 90));
        const gr = g.createLinearGradient(F.x - w, 0, F.x + w, 0); gr.addColorStop(0, css(F.c, 0)); gr.addColorStop(0.5, css(lighten(F.c, 0.4), 0.75 * a)); gr.addColorStop(1, css(F.c, 0));
        g.fillStyle = gr; g.fillRect(F.x - w, 0, w * 2, F.y);
        const gl = g.createRadialGradient(F.x, F.y, 0, F.x, F.y, 46); gl.addColorStop(0, css(F.c, 0.8 * a)); gl.addColorStop(1, css(F.c, 0)); g.fillStyle = gl; g.fillRect(F.x - 46, F.y - 46, 92, 92);
        if (R() < 0.5) add({ x: F.x + (R() - 0.5) * w, y: F.y - R() * 20, vy: rr(-160, -80), life: 700, s0: 2, s1: 1, c0: '#ffffff', c1: F.c, shape: 'px', add: true });
        break;
      }
      case 'rune': {   // 护盾：旋转的六角符阵
        g.globalCompositeOperation = 'lighter'; const r = F.r, rot = t / 900;
        for (const [rad, a, w] of [[r, 0.38, 1.5], [r * 0.84, 0.18, 1]]) { g.strokeStyle = css(F.c, a * (0.8 + 0.2 * Math.sin(t / 160))); g.lineWidth = w; g.beginPath();
          for (let i = 0; i <= 6; i++) { const an = rot * (rad === r ? 1 : -1) + i / 6 * 6.283, x = F.x + Math.cos(an) * rad, y = F.y + Math.sin(an) * rad * 0.9; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
        for (let i = 0; i < 6; i++) { const an = rot + i / 6 * 6.283; g.fillStyle = css(F.c, 0.8); g.fillRect(F.x + Math.cos(an) * r - 1.5, F.y + Math.sin(an) * r * 0.9 - 1.5, 3, 3); }
        break;
      }
      case 'aura': {   // 脚下的光环（精英/蓄力）
        g.globalCompositeOperation = 'lighter'; const pu = F.pulse ? 0.55 + 0.45 * Math.sin(t / 110) : 1, rot = t / 1400;
        g.save(); g.translate(F.x, F.y); g.scale(1, 0.32);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, F.r); gr.addColorStop(0, css(F.c, 0.28 * pu)); gr.addColorStop(1, css(F.c, 0)); g.fillStyle = gr; g.fillRect(-F.r, -F.r, F.r * 2, F.r * 2);
        g.strokeStyle = css(F.c, 0.5 * pu); g.lineWidth = 2; g.setLineDash([6, 7]); g.lineDashOffset = -rot * 60; g.beginPath(); g.arc(0, 0, F.r, 0, 6.283); g.stroke(); g.setLineDash([]); g.restore();
        break;
      }
      case 'warn': {   // 首领蓄力：主角脚下红色预警圈
        g.globalCompositeOperation = 'source-over'; const pu = 0.5 + 0.5 * Math.sin(t / 90);
        g.save(); g.translate(F.x, F.y); g.scale(1, 0.34);
        g.fillStyle = `rgba(255,40,20,${(0.12 + 0.12 * pu).toFixed(3)})`; g.beginPath(); g.arc(0, 0, F.r, 0, 6.283); g.fill();
        g.strokeStyle = `rgba(255,70,40,${(0.6 + 0.4 * pu).toFixed(3)})`; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, F.r, 0, 6.283); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.arc(0, 0, F.r * (1 - ((t / 700) % 1)), 0, 6.283); g.stroke(); g.restore();
        g.fillStyle = `rgba(255,90,60,${(0.7 + 0.3 * pu).toFixed(3)})`; g.font = '900 18px serif'; g.textAlign = 'center'; g.fillText('!', F.x, F.y - 4 - 6 * pu);
        break;
      }
    }
  }

  // ======== 大招演出 ========
  function ult(c) {
    if (!alive() || RM) return;
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.cineOff) return;
    veil(0.62, 1100, 0.7); speedLines('#fff3d0', 760);
    const f = fac(), mid = { x: W / 2, y: H * 0.45 };
    setTimeout(() => { if (!alive()) return; flash('#fff', 0.55, 200); ink(mid, 26, 110, '#140608'); burst(mid, { n: 30, c0: '#fff6d8', c1: c || '#ff8a3a', speed: 420, life: 600, s: 2, shape: 'spark', drag: 2.5, len: 0.05 }); shock(mid, c || '#ffd75a', W * 0.6, 600, 5); }, 380 * f);
  }

  // ======== 战斗背景：按场景主题画一张像素风的远景+近景（缓存） ========
  const bgCache = {};
  function seeded(s) { let x = 0; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) | 0; return () => { x = (x * 1103515245 + 12345) | 0; return ((x >>> 8) & 0xffff) / 65536; }; }
  const hexMix = (a, b, k) => css(mixRgb(rgb(a), rgb(b), k));
  // ======== 战斗背景：按场景画一张像素画（160×140）；首领战加一件镇场的大东西 ========
  const FAM = { silk: 'web', lava: 'lava', yang: 'lava', core: 'abyss', volcano: 'volcano', icecave: 'ice', snow: 'snow', swamp: 'swamp',
    ghost: 'market', ghostmd: 'market', ghostday: 'grave', yin: 'yin', daoguan: 'temple', shrine: 'temple', danfang: 'temple', daoyard: 'yard',
    grave: 'grave', town: 'town', townnight: 'town', townplague: 'town', village: 'town', teahouse: 'inn', biaoju: 'inn', room: 'inn', hall: 'hall',
    yamen: 'yamen', forest: 'forest', mizong: 'forest', gushu: 'forest', deep: 'forest', treeheart: 'tree', mount: 'mount', dream: 'dream', cave: 'cave', dg: 'cave' };
  function background(key, T, boss) {
    if (typeof document === 'undefined' || !T) return '';
    const kind = T.kind || 'field', fam = FAM[key] || (kind === 'room' ? 'inn' : kind === 'hall' ? 'hall' : kind === 'dungeon' ? 'cave' : kind === 'town' ? 'town' : 'field');
    const ck = key + '|' + kind + '|' + (boss ? 'B' : '');
    if (bgCache[ck]) return bgCache[ck];
    const w = 160, h = 140, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), rnd = seeded(ck);
    const bg = T.bg || '#141010', gr = T.g || '#2a2418', pa = T.p || '#4a4030', hz = Math.round(h * 0.48), M = hexMix;
    const RR = (a, b) => a + rnd() * (b - a), RI = (a, b) => Math.floor(RR(a, b + 1));
    const F = (col, X, Y, W2, H2) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), Math.round(W2), Math.round(H2)); };
    const grad = (X, Y, W2, H2, a, b, c2) => { const g1 = x.createLinearGradient(0, Y, 0, Y + H2); g1.addColorStop(0, a); if (c2) g1.addColorStop(0.55, c2); g1.addColorStop(1, b); x.fillStyle = g1; x.fillRect(X, Y, W2, H2); };
    const dith = (X, Y, W2, H2, col, k) => { x.fillStyle = col; for (let yy = Y; yy < Y + H2; yy++) for (let xx = X; xx < X + W2; xx++) if (((xx + yy) & 1) === 0 && rnd() < k) x.fillRect(xx, yy, 1, 1); };
    const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); };
    const circ = (cx, cy, r, col) => { x.fillStyle = col; for (let yy = -r; yy <= r; yy++) { const ww = Math.round(Math.sqrt(Math.max(0, r * r - yy * yy))); x.fillRect(Math.round(cx - ww), Math.round(cy + yy), ww * 2 + 1, 1); } };
    const line = (x0, y0, x1, y1, col) => { x.fillStyle = col; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); };
    const ridge = (y0, amp, f1, col, jag) => { const ph = rnd() * 9, ph2 = rnd() * 9; x.fillStyle = col; for (let i = 0; i < w; i++) { const y = y0 - amp * (0.55 * Math.sin(i * f1 + ph) + 0.3 * Math.sin(i * f1 * 2.3 + ph2) + (jag ? 0.15 * (rnd() - 0.5) : 0)); x.fillRect(i, Math.round(y), 1, h); } };
    // —— 小件 ——
    const pine = (bx, by, ht, col) => { const d = M(col, '#000', 0.35); F(d, bx, by - 3, 1, 4); for (let k = 0; k < 3; k++) { const ty = by - 3 - k * ht * 0.28, tw = ht * (0.42 - k * 0.1); poly([[bx - tw, ty], [bx + tw + 1, ty], [bx + 0.5, ty - ht * 0.42]], k % 2 ? col : d); } };
    const dead = (bx, by, ht, col) => { line(bx, by, bx + RR(-1, 1), by - ht, col); for (let k = 0; k < 4; k++) { const yy = by - ht * RR(0.4, 0.95), dx = (k % 2 ? 1 : -1) * RR(3, 7); line(bx, yy, bx + dx, yy - RR(2, 6), col); } F(col, bx - 1, by - ht * 0.55, 1, ht * 0.55); };
    const house = (hx, by, hw, hh, roof, wall, lit) => { F(wall, hx, by - hh, hw, hh); poly([[hx - 3, by - hh], [hx + hw + 3, by - hh], [hx + hw - 1, by - hh - 6], [hx + 1, by - hh - 6]], roof); F(M(roof, '#000', 0.4), hx - 3, by - hh, hw + 6, 1); F(roof, hx - 4, by - hh - 1, 2, 1); F(roof, hx + hw + 2, by - hh - 1, 2, 1);
      if (lit) { F('#ffcf6a', hx + 2, by - hh + 3, 3, 3); F(M('#ffcf6a', wall, 0.6), hx + 1, by - hh + 2, 5, 5); F('#ffcf6a', hx + 2, by - hh + 3, 3, 3); } F(M(wall, '#000', 0.5), hx + hw - 5, by - 6, 3, 6); };
    const lantern = (lx, ly, col) => { const glowC = M(col, bg, 0.75); circ(lx + 1, ly + 3, 5, glowC); F('#2a1a10', lx + 1, ly - 3, 1, 3); F(col, lx - 1, ly, 5, 6); F(M(col, '#ffe8a0', 0.55), lx, ly + 1, 3, 4); F(M(col, '#000', 0.4), lx - 1, ly, 5, 1); F(M(col, '#000', 0.4), lx - 1, ly + 5, 5, 1); };
    const tomb = (tx, by, sz) => { const st = M(pa, '#888', 0.25); poly([[tx - sz * 1.6, by], [tx + sz * 1.6, by], [tx + sz, by - sz * 0.9], [tx - sz, by - sz * 0.9]], M(gr, '#000', 0.2)); F(st, tx - sz * 0.45, by - sz * 1.9, sz * 0.9, sz * 1.3); F(M(st, '#000', 0.4), tx - sz * 0.45 + sz * 0.6, by - sz * 1.9, 1, sz * 1.3); F(M(st, '#000', 0.5), tx - 1, by - sz * 1.6, 2, sz * 0.6); };
    const web = (cx, cy, r, col) => { for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + 0.3; line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, col); }
      for (let ring = 1; ring <= 4; ring++) { const rr = r * ring / 4.4; for (let k = 0; k < 9; k++) { const a1 = k / 9 * 6.283 + 0.3, a2 = (k + 1) / 9 * 6.283 + 0.3, sag = rr * 0.12; line(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr, (cx + Math.cos(a1) * rr + cx + Math.cos(a2) * rr) / 2, (cy + Math.sin(a1) * rr + cy + Math.sin(a2) * rr) / 2 + sag, col); line((cx + Math.cos(a1) * rr + cx + Math.cos(a2) * rr) / 2, (cy + Math.sin(a1) * rr + cy + Math.sin(a2) * rr) / 2 + sag, cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr, col); } } };
    const cocoon = (cx, top, len, col) => { line(cx, 0, cx, top, M(col, bg, 0.5)); for (let yy = 0; yy < len; yy++) { const ww = Math.round(Math.sin(yy / len * 3.14) * len * 0.22) + 1; F(yy % 3 === 0 ? M(col, '#000', 0.3) : col, cx - ww, top + yy, ww * 2 + 1, 1); } F(M(col, '#fff', 0.4), cx - 1, top + 3, 1, len * 0.5); };
    const stal = (sx, len, col, wid) => { for (let yy = 0; yy < len; yy++) { const ww = Math.max(0, Math.round((1 - yy / len) * wid)); F(col, sx - ww, yy, ww * 2 + 1, 1); } };
    const shard = (cx, by, ht, col, hi) => { poly([[cx - ht * 0.22, by], [cx + ht * 0.22, by], [cx + ht * 0.12, by - ht * 0.8], [cx - ht * 0.02, by - ht], [cx - ht * 0.18, by - ht * 0.7]], col); line(cx - ht * 0.05, by - ht * 0.9, cx - ht * 0.12, by - 2, hi); };
    const chain = (cx, len, col) => { for (let yy = 0; yy < len; yy += 4) { F(col, cx - 1, yy, 3, 1); F(col, cx - 1, yy + 2, 1, 2); F(col, cx + 1, yy + 2, 1, 2); F(M(col, '#000', 0.4), cx, yy + 1, 1, 2); } };
    const money = (mx, my) => { F('#d8c890', mx, my, 3, 3); F(M('#d8c890', '#000', 0.5), mx + 1, my + 1, 1, 1); };
    const fogBand = (y0, y1, col, k) => { const [r1, g1, b1] = rgb(col), mid = (y0 + y1) / 2, gg = x.createLinearGradient(0, y0, 0, y1); gg.addColorStop(0, `rgba(${r1},${g1},${b1},0)`); gg.addColorStop(0.5, `rgba(${r1},${g1},${b1},${(k * 0.7).toFixed(2)})`); gg.addColorStop(1, `rgba(${r1},${g1},${b1},0)`); x.fillStyle = gg; x.fillRect(0, y0, w, y1 - y0); void mid; };
    const moon = (mx, my, r, col) => { circ(mx, my, r + 5, M(col, bg, 0.9)); circ(mx, my, r + 2, M(col, bg, 0.8)); circ(mx, my, r, col); circ(mx + r * 0.35, my - r * 0.2, Math.max(1, r * 0.3), M(col, '#000', 0.12)); circ(mx - r * 0.3, my + r * 0.35, Math.max(1, r * 0.2), M(col, '#000', 0.1)); };
    const stars = (n, yMax) => { for (let k = 0; k < n; k++) { x.fillStyle = `rgba(255,240,210,${(0.2 + rnd() * 0.6).toFixed(2)})`; x.fillRect(RI(0, w - 1), RI(0, yMax), 1, 1); } };
    // —— 野外的天和地 ——
    const sky = (top, bot, o = {}) => { grad(0, 0, w, hz + 2, top, bot); stars(o.stars != null ? o.stars : 40, hz * 0.6);
      if (o.moon !== false) moon(o.mx || RR(24, 136), o.my || RR(14, 24), o.mr || 7, o.mc || M('#f1dcb0', bg, 0.15));
      for (let k = 0; k < 3; k++) { const cy = RR(8, hz * 0.55), cw = RR(30, 70), cx = RR(-10, w); dith(Math.round(cx), Math.round(cy), Math.round(cw), 3, M(bot, '#ccc', 0.12), 0.5); } };
    const hills = (far, mid) => { ridge(hz - 22, 12, 0.035, far, false); ridge(hz - 9, 7, 0.07, mid, true); };
    const ground = (g1, g2, o = {}) => { grad(0, hz, w, h - hz, g1, g2);
      if (o.path !== false) { const pc = o.pc || M(pa, g1, 0.72); for (let yy = hz + 4; yy < h; yy++) { const ww = 5 + (yy - hz) * 0.55, cx = w * 0.5 + Math.sin(yy * 0.09) * 6; F(pc, cx - ww / 2, yy, ww, 1); if (yy % 3 === 0) F(M(pc, '#000', 0.12), cx - ww / 2 + RR(0, ww), yy, 2, 1); } }
      for (let k = 0; k < 18; k++) { const sx = RR(0, w), sy = RR(hz + 6, h), sz = RI(1, 3); F(M(pa, '#000', 0.4), sx, sy + 1, sz + 1, 1); F(M(pa, '#fff', 0.08), sx, sy, sz, 1); }
      for (let k = 0; k < 110; k++) { F(M(g1, rnd() < 0.5 ? '#000' : '#a0a070', 0.3), RR(0, w), RR(hz + 2, h), 1, RI(1, 2)); } };
    const front = col => { for (let i = 0; i < w; i += 2 + RI(0, 2)) { const th = RI(2, 7); F(col, i, h - th, 1, th); if (rnd() < 0.3) F(col, i + 1, h - th + 2, 1, th - 2); } };
    // —— 洞里 ——
    const caveBase = (wall, floor, o = {}) => { grad(0, 0, w, h, M(wall, '#000', 0.6), M(floor, '#000', 0.3), wall);
      for (let k = 0; k < 90; k++) { const rx = RR(0, w), ry = RR(0, hz + 4), rs = RI(2, 7); F(M(wall, rnd() < 0.5 ? '#000' : '#fff', RR(0.08, 0.25)), rx, ry, rs, Math.max(1, rs - 2)); }
      for (let k = 0; k < 4; k++) { const px = RR(0, w), pw = RR(10, 22); poly([[px, 0], [px + pw, 0], [px + pw * 0.8, hz + 8], [px + pw * 0.1, hz + 8]], M(wall, '#000', 0.35)); }   // 远处石柱
      ridge(hz + 6, 6, 0.09, M(wall, floor, 0.5), true);
      grad(0, hz + 6, w, h - hz - 6, M(floor, '#000', 0.1), M(floor, '#000', 0.45));
      for (let k = 0; k < 120; k++) F(M(floor, rnd() < 0.5 ? '#000' : '#fff', 0.15), RR(0, w), RR(hz + 8, h), RI(1, 3), 1);
      for (let i = 0; i < w; i += RI(4, 10)) stal(i, RI(4, o.stal || 14), M(wall, '#000', 0.45), RI(1, 3)); };
    // —— 屋里 ——
    const room = (wall, floor, o = {}) => { grad(0, 0, w, hz + 4, M(wall, '#000', 0.55), M(wall, '#000', 0.12));
      for (let yy = 6; yy < hz; yy += 7) for (let i = (yy / 7 & 1) * 6; i < w; i += 12) F(M(wall, '#000', 0.28), i, yy, 1, 7);
      for (let yy = 6; yy < hz; yy += 7) F(M(wall, '#000', 0.28), 0, yy, w, 1);
      F(M('#3a2214', bg, 0.2), 0, 0, w, 5); F(M('#6a3a1a', bg, 0.2), 0, 4, w, 1);   // 横梁
      for (let k = 0; k < 5; k++) { const px = 6 + k * 37; F(o.pillar || M('#7a2a1a', bg, 0.25), px, 0, 6, hz + 4); F(M(o.pillar || '#7a2a1a', '#fff', 0.15), px + 1, 0, 1, hz + 4); F(M(o.pillar || '#7a2a1a', '#000', 0.4), px + 5, 0, 1, hz + 4); F(M('#3a2214', bg, 0.2), px - 1, hz + 1, 8, 3); }
      grad(0, hz + 4, w, h - hz - 4, M(floor, '#000', 0.05), M(floor, '#000', 0.45));
      for (let yy = hz + 6; yy < h; yy += 5) { F(M(floor, '#000', 0.3), 0, yy, w, 1); for (let i = ((yy / 5) & 1) * 11; i < w; i += 22) F(M(floor, '#000', 0.3), i, yy, 1, 5); } };
    const windowL = (wx, wy, ww, wh, frame, light) => { F(frame, wx - 1, wy - 1, ww + 2, wh + 2); F(light, wx, wy, ww, wh); for (let j = 0; j < ww; j += 4) F(frame, wx + j, wy, 1, wh); for (let j = 0; j < wh; j += 4) F(frame, wx, wy + j, ww, 1); };
    // ========== 各场景 ==========
    let accent = null;   // 首领战的镇场大件
    if (fam === 'web') {
      caveBase(T.wall || '#2a1c2e', gr); const sc = '#c8b8d0';
      web(0, 0, 46, M(sc, bg, 0.35)); web(w, 0, 40, M(sc, bg, 0.45)); web(w * 0.42, -6, 26, M(sc, bg, 0.6));
      for (let k = 0; k < 14; k++) { const sx = RR(0, w); line(sx, 0, sx + RR(-2, 2), RR(10, hz), M(sc, bg, 0.55)); }
      for (let k = 0; k < 5; k++) cocoon(RR(10, w - 10), RR(10, 26), RI(10, 16), M('#e8e0d0', bg, 0.25));
      for (let k = 0; k < 6; k++) shard(RR(4, w - 4), hz + RR(6, 12), RR(8, 16), M('#8a3a9a', bg, 0.2), '#f0c0ff');
      for (let k = 0; k < 4; k++) { const ex = RR(0, w), ey = RR(hz + 10, h - 10); poly([[ex, ey], [ex + RR(14, 24), ey - 2], [ex + RR(20, 30), ey + 2], [ex + 4, ey + 3]], M(sc, gr, 0.75)); }   // 地上的蛛丝
      if (boss) accent = () => { web(w * 0.7, hz - 12, 58, M('#e8dcf0', bg, 0.15)); circ(w * 0.7, hz - 12, 3, '#3a1a3a'); };
    } else if (fam === 'lava' || fam === 'abyss') {
      const ab = fam === 'abyss', wall = T.wall || (ab ? '#2a1010' : '#3a1a12'); caveBase(wall, gr, { stal: 10 });
      const lc = ab ? '#d0301a' : '#ff7a1a', lh = ab ? '#ff9a5a' : '#ffe08a';
      for (let k = 0; k < 7; k++) { let cx = RR(0, w), cy = RR(4, hz - 6); for (let s2 = 0; s2 < 10; s2++) { const nx = cx + RR(-4, 4), ny = cy + RR(1, 4); line(cx, cy, nx, ny, M(lc, wall, 0.25)); cx = nx; cy = ny; } }   // 墙上发光的裂缝
      const ry = hz + 12; for (let i = 0; i < w; i++) { const t1 = 3 + Math.sin(i * 0.12) * 1.6 + Math.sin(i * 0.31) * 0.8; F(M(lc, '#000', 0.25), i, ry - t1 - 1, 1, 1); F(lc, i, ry - t1, 1, t1 * 2); if ((i + RI(0, 3)) % 6 === 0) F(lh, i, ry - 1, 2, 1); }
      grad(0, ry - 14, w, 12, 'rgba(0,0,0,0)', M(lc, bg, 0.75));
      for (let k = 0; k < 3; k++) { const px = RR(10, w - 30), py = RR(ry + 18, h - 12), pw = RR(14, 26); poly([[px, py], [px + pw, py - 1], [px + pw + 3, py + 3], [px + 2, py + 5]], lc); F(lh, px + 4, py + 1, pw * 0.5, 1); }
      if (ab) { for (let k = 0; k < 5; k++) chain(RR(6, w - 6), RR(18, 44), '#4a3434'); for (let k = 0; k < 5; k++) shard(RR(0, w), hz + RR(4, 10), RR(10, 18), '#8a1a1a', '#ff9a9a'); }
      if (boss) accent = () => { const fx2 = w * 0.72; for (let yy = 0; yy < ry; yy++) { const ww = 5 + Math.sin(yy * 0.3) * 1.5; F(lc, fx2 - ww, yy, ww * 2, 1); if (yy % 5 === 0) F(lh, fx2 - 1, yy, 2, 2); } circ(fx2, ry, 9, M(lc, lh, 0.3)); };
    } else if (fam === 'ice') {
      const wall = T.wall || '#3a5262'; caveBase(wall, gr, { stal: 4 });
      for (let i = 0; i < w; i += RI(3, 7)) { const L = RI(6, 22); stal(i, L, M('#bfe8ff', wall, 0.35), RI(1, 2)); line(i, 0, i, L - 3, '#e8f8ff'); }
      for (let k = 0; k < 9; k++) shard(RR(0, w), hz + RR(4, 14), RR(10, 24), M('#7ad0ff', bg, 0.15), '#f4fcff');
      for (let k = 0; k < 6; k++) { const sx = RR(0, w), sy = RR(hz + 14, h - 6); F(M('#e8f8ff', gr, 0.3), sx, sy, RR(12, 26), 2); F('#f4fcff', sx + 3, sy, 6, 1); }
      if (boss) accent = () => { const tx = w * 0.72, by = hz + 8; poly([[tx - 18, by], [tx + 18, by], [tx + 12, by - 44], [tx, by - 58], [tx - 12, by - 44]], M('#7ad0ff', bg, 0.05)); line(tx - 4, by - 50, tx - 8, by - 2, '#f4fcff'); line(tx + 6, by - 40, tx + 9, by - 4, M('#f4fcff', '#7ad0ff', 0.5)); };
    } else if (fam === 'yin') {
      const wall = T.wall || '#1e1426'; caveBase(wall, gr);
      for (let k = 0; k < 6; k++) shard(RR(0, w), hz + RR(4, 12), RR(10, 18), M('#6a3aaa', bg, 0.2), '#e0c0ff');
      for (let k = 0; k < 5; k++) tomb(RR(10, w - 10), hz + RR(10, 26), RR(4, 6));
      for (let k = 0; k < 3; k++) chain(RR(6, w - 6), RR(16, 36), '#3a3446');
      for (let k = 0; k < 24; k++) money(RR(0, w), RR(hz + 8, h - 4));
      if (boss) accent = () => { const gx = w * 0.72, by = hz + 6; F('#1a1022', gx - 22, by - 46, 44, 46); F('#3a2a4a', gx - 24, by - 50, 48, 5); F('#5a3a7a', gx - 2, by - 40, 4, 40); circ(gx, by - 22, 6, '#6a3aaa'); chain(gx - 16, by - 6, '#4a3a5a'); chain(gx + 16, by - 6, '#4a3a5a'); };
    } else if (fam === 'cave') {
      caveBase(T.wall || '#2e2620', gr);
      for (let k = 0; k < 4; k++) { const px = RR(0, w), py = RR(hz + 16, h - 10), pw = RR(12, 22); F(M('#3a4a5a', gr, 0.4), px, py, pw, 2); F(M('#8aa0b0', gr, 0.4), px + 3, py, pw * 0.4, 1); }
      for (let k = 0; k < 6; k++) shard(RR(0, w), hz + RR(4, 12), RR(8, 14), M(pa, bg, 0.2), M(pa, '#fff', 0.4));
      if (boss) accent = () => { const tx = w * 0.72; poly([[tx - 26, hz + 8], [tx + 26, hz + 8], [tx + 16, hz - 30], [tx - 16, hz - 30]], M(T.wall || '#2e2620', '#000', 0.4)); F('#ffb04a', tx - 3, hz - 18, 6, 8); circ(tx, hz - 14, 8, M('#ffb04a', bg, 0.8)); F('#ffb04a', tx - 3, hz - 18, 6, 8); };
    } else if (fam === 'inn' || fam === 'hall' || fam === 'temple') {
      const wall = T.wall || '#3a2c20'; room(wall, gr, { pillar: fam === 'temple' ? '#8a2a1a' : null });
      if (fam === 'temple') {
        windowL(w * 0.5 - 13, 8, 26, 22, M(wall, '#000', 0.5), M('#e8c86a', wall, 0.55));
        circ(w * 0.5, 19, 7, '#e8e0d0'); x.fillStyle = '#1a1414'; x.fillRect(w * 0.5, 12, 8, 15); circ(w * 0.5, 15.5, 3, '#e8e0d0'); circ(w * 0.5, 22.5, 3, '#1a1414'); F('#1a1414', w * 0.5 - 1, 15, 2, 2); F('#e8e0d0', w * 0.5 - 1, 22, 2, 2);   // 太极
        for (const bx of [w * 0.2, w * 0.8]) { F('#c8a028', bx - 4, 6, 8, 30); F('#8a1a14', bx - 3, 9, 6, 22); F('#c8a028', bx - 3, 36, 2, 4); F('#c8a028', bx + 1, 36, 2, 4); }   // 幡
        F('#4a2a18', w * 0.5 - 22, hz - 6, 44, 10); F('#6a3a20', w * 0.5 - 22, hz - 6, 44, 2);   // 供桌
        F('#8a7a5a', w * 0.5 - 5, hz - 13, 10, 7); F('#b0a070', w * 0.5 - 6, hz - 13, 12, 2);   // 香炉
        for (let k = -1; k <= 1; k++) { F('#c84a2a', w * 0.5 + k * 3, hz - 19, 1, 6); for (let yy = 0; yy < 14; yy++) dith(w * 0.5 + k * 3 + Math.round(Math.sin(yy * 0.5 + k) * 1.5), hz - 20 - yy, 1, 1, '#a09890', 0.6); }
        if (key === 'danfang') { const fx2 = w * 0.78; F('#5a4a3a', fx2 - 10, hz - 16, 20, 18); F('#7a6a4a', fx2 - 12, hz - 18, 24, 3); circ(fx2, hz - 7, 4, '#ff7a1a'); circ(fx2, hz - 7, 2, '#ffe08a'); }
      } else {
        for (let k = 0; k < 2; k++) windowL(30 + k * 74, 10, 24, 20, M(wall, '#000', 0.5), M('#3a4a6a', bg, 0.25));
        for (let k = 0; k < 3; k++) lantern(18 + k * 62, 8, '#c4291f');
        if (key === 'teahouse' || fam === 'inn') for (let k = 0; k < 3; k++) { const tx = 20 + k * 58; F('#4a2a16', tx, hz + 4, 22, 3); F('#2a160c', tx + 2, hz + 7, 2, 8); F('#2a160c', tx + 18, hz + 7, 2, 8); F('#d8d0c0', tx + 8, hz + 2, 3, 2); }
        if (key === 'biaoju') for (let k = 0; k < 2; k++) { const fx2 = 46 + k * 70; F('#3a2214', fx2, 4, 1, 30); poly([[fx2 + 1, 5], [fx2 + 16, 8], [fx2 + 1, 18]], '#b8231b'); F('#e8c86a', fx2 + 4, 10, 4, 3); }
      }
      if (boss) accent = () => { const sx = w * 0.72, by = hz + 4; poly([[sx - 20, by], [sx + 20, by], [sx + 14, by - 30], [sx + 8, by - 44], [sx - 8, by - 44], [sx - 14, by - 30]], M('#c8a028', bg, 0.55)); circ(sx, by - 50, 8, M('#c8a028', bg, 0.5)); circ(sx, by - 50, 13, M('#e8c86a', bg, 0.85)); };
    } else {
      // —— 户外：天、远山、中景、地面 ——
      const night = fam !== 'dream';
      const skyTop = fam === 'dream' ? '#3a2a4a' : fam === 'volcano' ? '#1a0806' : fam === 'swamp' ? '#0a120a' : fam === 'snow' ? '#2a3442' : M(bg, '#000', 0.5);
      const skyBot = fam === 'dream' ? '#e8a060' : fam === 'volcano' ? '#6a1a0a' : fam === 'swamp' ? '#2a3a1e' : fam === 'snow' ? '#7a8a9a' : M(bg, pa, 0.45);
      sky(skyTop, skyBot, { stars: fam === 'dream' || fam === 'volcano' ? 6 : 40, moon: fam !== 'volcano' && !(boss && !['grave', 'market', 'forest', 'swamp'].includes(fam)), mc: fam === 'grave' || fam === 'market' ? '#e8d8b8' : fam === 'swamp' ? '#b8c890' : fam === 'dream' ? '#ffe0a0' : undefined, mr: fam === 'dream' ? 10 : 7, my: fam === 'dream' ? hz - 14 : undefined });
      if (fam === 'volcano') { poly([[w * 0.55, hz - 6], [w * 0.68, hz - 40], [w * 0.74, hz - 40], [w * 0.9, hz - 6]], '#1a0c08'); for (let yy = 0; yy < 22; yy++) dith(Math.round(w * 0.7 - 2 - yy * 0.3), hz - 42 - yy, 5 + yy * 0.6, 1, M('#ff6a1a', skyTop, yy / 22), 0.5); circ(w * 0.71, hz - 41, 3, '#ff9a3a'); }
      if (fam === 'mount') { for (let k = 0; k < 3; k++) { const mx = RR(0, w), mh = RR(30, 50); poly([[mx - mh * 0.7, hz], [mx, hz - mh], [mx + mh * 0.6, hz]], M(bg, '#5a6a7a', 0.25 + k * 0.08)); poly([[mx - 4, hz - mh + 6], [mx, hz - mh], [mx + 4, hz - mh + 6]], M('#e8e8f0', bg, 0.3)); } }
      hills(M(skyBot, '#000', 0.4), M(gr, bg, 0.4));
      const sil = M(bg, '#000', 0.5);
      if (fam === 'town' || fam === 'market' || fam === 'yamen') {
        for (let i = -4; i < w; i += RI(18, 26)) house(i, hz + 1, RI(14, 20), RI(9, 15), M('#2a2a34', bg, 0.3), M('#4a3a2a', bg, 0.45), rnd() < 0.55);
        if (key === 'townplague') fogBand(hz - 30, hz + 10, '#8ab060', 0.35);
      } else if (fam === 'forest' || fam === 'tree' || fam === 'swamp' || fam === 'mount' || fam === 'yard' || fam === 'dream' || fam === 'snow' || fam === 'field') {
        const tc = (T.treePal && T.treePal.G) || '#22402a';
        for (let i = 0; i < w; i += RI(5, 11)) (fam === 'swamp' || rnd() < 0.2 ? dead : pine)(i, hz + 1, RR(10, 22), fam === 'swamp' ? sil : M(tc, bg, 0.45));
      } else if (fam === 'grave' || fam === 'volcano') {
        for (let i = RI(0, 12); i < w; i += RI(18, 34)) dead(i, hz + 1, RR(10, 20), sil);
      }
      if (fam === 'forest' || fam === 'tree') { for (let k = 0; k < 6; k++) { const tx = RR(0, w), tw = RI(3, 6); F(M('#1a140e', bg, 0.2), tx, 0, tw, hz + 12); F(M('#3a2a1a', bg, 0.3), tx, 0, 1, hz + 12); } for (let k = 0; k < 4; k++) { const sx = RR(10, w - 10); for (let yy = 0; yy < hz; yy++) dith(Math.round(sx + yy * 0.3), yy, 4, 1, 'rgba(220,230,200,.25)', 0.25); } }
      const g1 = fam === 'snow' ? '#c8d8e4' : fam === 'dream' ? '#8a7030' : M(gr, bg, 0.2), g2 = fam === 'snow' ? '#7a8a96' : M(gr, '#000', 0.4);
      ground(g1, g2, { path: fam !== 'swamp', pc: fam === 'snow' ? '#e8f0f6' : undefined });
      if (fam === 'swamp') { for (let k = 0; k < 6; k++) { const px = RR(-10, w), py = RR(hz + 8, h - 10), pw = RR(20, 40); for (let yy = 0; yy < 5; yy++) F(M('#2a4a2a', '#000', yy * 0.08), px + yy * 2, py + yy, pw - yy * 4, 1); F('#8ab070', px + 6, py + 1, pw * 0.3, 1); F('#4a8a3a', px + pw * 0.5, py + 2, 3, 2); }
        for (let k = 0; k < 20; k++) { const rx = RR(0, w), ry = RR(hz + 4, h); line(rx, ry, rx + RR(-1, 1), ry - RI(4, 9), M('#4a5a2a', bg, 0.2)); } fogBand(hz - 6, hz + 20, '#7a9a5a', 0.3); }
      if (fam === 'grave' || key === 'ghostday') { for (let k = 0; k < 7; k++) tomb(RR(6, w - 6), hz + RR(8, 30), RR(3, 6)); for (let k = 0; k < 18; k++) money(RR(0, w), RR(hz + 6, h - 4)); fogBand(hz - 4, hz + 16, '#a0a0b0', 0.3); }
      if (fam === 'market') { for (let k = 0; k < 4; k++) { const sx = 8 + k * 40 + RR(-3, 3); F('#3a2a1a', sx, hz - 2, 1, 14); F('#3a2a1a', sx + 22, hz - 2, 1, 14); poly([[sx - 3, hz - 2], [sx + 25, hz - 2], [sx + 22, hz - 8], [sx, hz - 8]], k % 2 ? '#6a1a1a' : '#d8d0c0'); F('#4a3020', sx, hz + 8, 23, 3); }
        line(0, 10, w, 16, '#2a1a10'); for (let k = 0; k < 8; k++) lantern(6 + k * 20, 11 + Math.round(k * 0.75), k % 3 === 2 ? '#e8e0d0' : '#c4291f');
        for (let k = 0; k < 14; k++) money(RR(0, w), RR(hz + 10, h - 4)); }
      if (fam === 'yamen') { const gx = w * 0.5; F('#6a1a14', gx - 30, hz - 26, 6, 27); F('#6a1a14', gx + 24, hz - 26, 6, 27); poly([[gx - 40, hz - 26], [gx + 40, hz - 26], [gx + 32, hz - 36], [gx - 32, hz - 36]], '#2a2a34'); F('#1a1414', gx - 24, hz - 24, 48, 25); F('#c8a028', gx - 10, hz - 33, 20, 6); F('#4a2a18', gx - 9, hz - 32, 18, 4);
        circ(gx - 40, hz + 2, 5, '#6a6a70'); circ(gx + 40, hz + 2, 5, '#6a6a70'); }
      if (fam === 'yard') { const gx = w * 0.5; poly([[gx - 36, hz - 14], [gx + 36, hz - 14], [gx + 28, hz - 24], [gx - 28, hz - 24]], '#2a2a34'); F('#5a4a3a', gx - 26, hz - 14, 52, 15); F('#8a1a14', gx - 6, hz - 10, 12, 11); F('#5a5048', gx - 6, hz + 10, 12, 8); F('#7a7060', gx - 8, hz + 9, 16, 2); for (let yy = 0; yy < 12; yy++) dith(gx - 2 + Math.round(Math.sin(yy * 0.6) * 2), hz + 8 - yy, 2, 1, '#a09890', 0.6); }
      if (fam === 'tree') { const tx = w * 0.62; F('#2a1e12', tx - 14, 0, 28, hz + 10); F('#3a2a18', tx - 14, 0, 3, hz + 10); for (let k = 0; k < 4; k++) line(tx - 14 - k * 6, hz + 10, tx - 4, hz - 6, '#2a1e12'); circ(tx, hz - 12, 5, '#7aff8a'); circ(tx, hz - 12, 9, M('#7aff8a', bg, 0.75)); }
      if (fam === 'snow') for (let k = 0; k < 20; k++) F('#f4f8fc', RR(0, w), RR(hz - 10, hz + 2), RI(2, 5), 1);
      if (fam === 'dream') { fogBand(hz - 10, hz + 6, '#ffd8a0', 0.25); for (let k = 0; k < 40; k++) F('#e8c070', RR(0, w), RR(hz + 4, h), 1, RI(2, 4)); }
      front(M(gr, '#000', 0.6));
      if (boss) accent = () => { if (fam === 'grave' || fam === 'market') { const gx = w * 0.7; F('#3a3434', gx - 16, hz - 30, 32, 32); F('#4a4444', gx - 18, hz - 34, 36, 5); F('#1a1414', gx - 6, hz - 22, 12, 22); F('#c4291f', gx - 2, hz - 28, 4, 3); }
        else if (fam === 'forest' || fam === 'swamp') { const tx = w * 0.72; F('#1a140e', tx - 10, 0, 20, hz + 6); for (let k = 0; k < 6; k++) line(tx, hz - 30 + k * 3, tx + (k % 2 ? 26 : -26), hz - 40 + k * 2, '#1a140e'); }
        else { grad(0, 0, w, hz, 'rgba(120,10,10,.35)', 'rgba(0,0,0,0)'); moon(w * 0.7, 20, 11, '#c83a2a'); } };
    }
    if (accent) accent();
    // 首领战：天色压红、四角压暗
    if (boss) { const rg = x.createRadialGradient(w * 0.7, hz, 10, w * 0.7, hz, w * 0.8); rg.addColorStop(0, 'rgba(120,20,10,.18)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, w, h); }
    fogBand(hz - 6, hz + 8, M(bg, '#bbb', 0.12), 0.35);
    const vg = x.createLinearGradient(0, h * 0.76, 0, h); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = vg; x.fillRect(0, h * 0.76, w, h * 0.24);
    const vs = x.createLinearGradient(0, 0, w, 0); vs.addColorStop(0, 'rgba(0,0,0,.35)'); vs.addColorStop(0.15, 'rgba(0,0,0,0)'); vs.addColorStop(0.85, 'rgba(0,0,0,0)'); vs.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = vs; x.fillRect(0, 0, w, h);
    return (bgCache[ck] = c.toDataURL());
  }
  // ======== 场景天气：火星、雪、孢子、鬼火、雾、落叶、花瓣、灰、水滴 ========
  let AMB = null;
  function ambient(wx) { AMB = wx || null; }
  function ambientTick(dt) {
    if (!AMB || !W) return; const A = AMB;
    if (A === 'ember') for (let i = every('amb', 9, dt); i > 0; i--) add({ x: rr(0, W), y: H + 4, vx: rr(-10, 10), vy: rr(-60, -30), ax: rr(-8, 8), life: rr(2000, 3400), s0: 2, s1: 1, c0: '#ffd08a', c1: '#ff4a1a', shape: 'px', add: true });
    else if (A === 'snow') for (let i = every('amb', 12, dt); i > 0; i--) add({ x: rr(-20, W), y: -4, vx: rr(6, 18), vy: rr(18, 34), life: rr(5000, 8000), s0: R() < 0.3 ? 3 : 2, c0: '#f4fbff', a0: 0.85, shape: 'px' });
    else if (A === 'spore') for (let i = every('amb', 4, dt); i > 0; i--) add({ x: rr(0, W), y: rr(H * 0.4, H), vx: rr(-6, 6), vy: rr(-14, -4), life: rr(3000, 5000), s0: 4, s1: 6, c0: '#b8f07a', c1: '#4a8a2a', a0: 0.5, shape: 'glow', add: true, fadeIn: 0.3 });
    else if (A === 'wisp') for (let i = every('amb', 1.6, dt); i > 0; i--) add({ x: rr(0, W), y: rr(H * 0.25, H * 0.7), vx: rr(-10, 10), vy: rr(-8, 4), ax: rr(-6, 6), life: rr(3000, 5000), s0: 7, s1: 4, c0: '#9ad8ff', c1: '#3a6aff', a0: 0.6, shape: 'glow', add: true, fadeIn: 0.3 });
    else if (A === 'fog') for (let i = every('amb', 0.8, dt); i > 0; i--) add({ x: -40, y: rr(H * 0.35, H * 0.8), vx: rr(14, 24), life: rr(9000, 12000), s0: 60, s1: 90, c0: '#9a9aa0', a0: 0.08, shape: 'smoke', fadeIn: 0.3 });
    else if (A === 'leaf' || A === 'petal') for (let i = every('amb', 2.4, dt); i > 0; i--) add({ x: rr(-10, W), y: -4, vx: rr(10, 26), vy: rr(20, 34), ax: rr(-10, 10), life: rr(5000, 8000), s0: 3, c0: A === 'petal' ? '#ffb8c8' : R() < 0.5 ? '#8a6a2a' : '#5a7a2a', shape: 'px', vr: rr(-3, 3) });
    else if (A === 'ash') for (let i = every('amb', 5, dt); i > 0; i--) add({ x: rr(-10, W), y: -4, vx: rr(-4, 10), vy: rr(10, 20), life: rr(6000, 9000), s0: 2, c0: '#8a8480', a0: 0.7, shape: 'px' });
    else if (A === 'dust') for (let i = every('amb', 3, dt); i > 0; i--) add({ x: rr(0, W), y: rr(0, H * 0.8), vx: rr(-4, 4), vy: rr(-3, 3), life: rr(3000, 5000), s0: 2, c0: '#e8d8b0', a0: 0.4, shape: 'px', fadeIn: 0.4 });
    else if (A === 'drip') for (let i = every('amb', 1.4, dt); i > 0; i--) add({ x: rr(0, W), y: 0, vy: 40, ay: 260, life: 1100, s0: 2, c0: '#9ab8d0', a0: 0.7, shape: 'px' });
  }

  function onResize() { resize(); }
  if (typeof window !== 'undefined') window.addEventListener('resize', onResize);
  return { setup, add, burst, glow, shock, sparks, embers, smoke, shards, ink, flame, dust, bolt, flash, veil, speedLines, rays, beam, hitstop, slowmo, punch, whiteFlash,
    disintegrate, bossDeath, ult, background, ambient, rgb, dens, lvl };
})();
