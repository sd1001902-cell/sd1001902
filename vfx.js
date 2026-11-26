// ============ 九幽回廊 · 战斗特效（中式暗黑） ============
// 符箓、暗器、鬼火、金光、书法大字、墨迹飞溅、化为飞灰。
'use strict';
const VFX = (() => {
  let arena = null, layer = null, speed = 1, lastMv = 0;
  // 起手时间：出招动作做完再放特效。OFF>0 时，所有特效整体往后推 OFF 毫秒
  let OFF = 0;
  const later = (fn, t) => setTimeout(() => { const sv = OFF; OFF = 0; try { fn(); } finally { OFF = sv; } }, (t || 0) + OFF);
  const deferred = (fn, args) => { const o = OFF; setTimeout(() => { const sv = OFF; OFF = 0; try { fn(...args); } finally { OFF = sv; } }, o); return null; };
  const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COL = { phys: '#f0e6d0', fire: '#ff6a1a', cold: '#8fd8ff', light: '#e6e0ff', magic: '#5df0c0', holy: '#ffd75a', poison: '#7fe05a', buff: '#ff8a4a', heal: '#ff9ac0' };
  const GHOST = '#5df0c0', GOLD = '#ffd75a', BLOOD = '#c4291f', INK = '#120a08';
  const fac = () => ({ 1: 1, 2: 0.6, 3: 0.4, 4: 0.32 }[speed] || 1);

  function setup(a, spd) { arena = a; layer = a && a.querySelector('.fxl'); speed = spd || 1; if (typeof GFX !== 'undefined') GFX.setup(a); clearInterval(idleH); if (a && !RM) idleH = setInterval(idleTick, 120); }
  // 待机呼吸：每个人自己的节奏，在站姿和「沉一下」两张图之间换
  let idleH = 0, idleZh = 0;
  function idleTick() {
    if (!arena || !document.body.contains(arena)) { clearInterval(idleH); return; }
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.gfx === 0) return;   // 特效「低」（省电）：待机呼吸不换图
    const t = performance.now(), gf = GF();
    if (gf && t > idleZh) {   // 国风样板：隔几秒，随便哪具僵尸原地蹦一下（跳尸嘛）
      idleZh = t + 2200 + Math.random() * 2600;
      const zs = [...arena.querySelectorAll('.unit.k-minion:not(.dead)')].filter(el => !el.closest('#foes') && !(el._busy > t)), z = zs[Math.floor(Math.random() * zs.length)], za = z && z.querySelector('.act');
      if (za && za.animate) A(za, [tf('none'), tf('translateY(1px) scale(1.06,.93)', 0.2), tf('translateY(-7px) scale(.96,1.05)', 0.52), tf('translateY(0) scale(1.07,.92)', 0.82), tf('none')], 380, 'ease-out');
    }
    arena.querySelectorAll('.unit:not(.dead) .act').forEach(act => {
      if (isRig(act)) { const el = act.closest('.unit'); if (!el || el._busy > t) return; const p = act.dataset.pose; if (p !== 'idle' && p !== 'idle2') return;
        if (gf && FIDGET[act.dataset.rig] && el.classList.contains('k-hero')) {   // 国风：主角站久了，各有各的小动作
          if (!el._fz) el._fz = t + 1800 + Math.random() * 2400;
          if (t > el._fz) { el._fz = t + 4200 + Math.random() * 3800; const r = { el, act, rig: true, face: el.closest('#foes') ? -1 : 1 }, L = FIDGET[act.dataset.rig];
            L[(el._fzn = (el._fzn || 0) + 1) % L.length](r, pos(el.id.slice(2))); return; } }
        const ph = el._ph || (el._ph = Math.random() * 1200), want = Math.floor((t + ph) / 560) % 2 ? 'idle2' : 'idle'; if (p !== want) setPose(act, want); return; }
      const img = act.querySelector(':scope > img'), el = act.closest('.unit'); if (!img || !el || el._busy > t) return;
      if (!img.dataset.base) img.dataset.base = img.src;
      if (act.dataset.mon) {   // 蓄力的回合：一直憋着劲，身子往后压
        const chg = el.classList.contains('charging');
        if (chg) { let pal = null; try { pal = JSON.parse(act.dataset.pal || 'null'); } catch (e) {} const cw = SPR.monUrl(act.dataset.spr, 'mw', pal); if (cw && img.src !== cw) img.src = cw; el._chgPose = true; return; }
        if (el._chgPose) { el._chgPose = false; img.src = img.dataset.base; }
      }
      if (!img.dataset.br) { let pal = null; try { pal = JSON.parse(act.dataset.pal || 'null'); } catch (e) {} img.dataset.br = act.dataset.nm ? SPR.breathUrl(act.dataset.nm, pal) : img.dataset.base; }
      if (img.src !== img.dataset.base && img.src !== img.dataset.br) return;   // 正在摆别的动作
      const ph = el._ph || (el._ph = Math.random() * 1200), on = Math.floor((t + ph) / (el.classList.contains('k-boss') ? 700 : 520)) % 2 === 1;
      const want = on ? img.dataset.br : img.dataset.base; if (img.src !== want) img.src = want;
    });
  }
  const GX = () => (typeof GFX !== 'undefined' && arena) ? GFX : null;
  const lumOf = c => { const [r, g, b] = GX() ? GFX.rgb(c) : [200, 200, 200]; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  function setSpeed(s) { speed = s; }
  // 人在画面里的位置：量一次要逼浏览器把版面排好，一招里要量好几次——量过的记 150 毫秒，这段时间里直接用
  const PC = new Map(); let PCt = 0;
  function pos(id) {
    if (!arena) return null;
    const now = performance.now(); if (now - PCt > 150) { PC.clear(); PCt = now; }
    const hit = PC.get(id); if (hit && hit.el.isConnected) return hit.p;
    const el = document.getElementById('u-' + id); if (!el) return null;
    const s = el.querySelector('.sp') || el, r = s.getBoundingClientRect(), A = arena.getBoundingClientRect();
    const p = { x: r.left - A.left + r.width / 2, y: r.top - A.top + r.height / 2, w: r.width, h: r.height }; PC.set(id, { el, p }); return { ...p };
  }
  function spawn(cls, x, y, dur, vars, html) {
    if (!layer) return null;
    if (OFF > 0) return deferred(spawn, [cls, x, y, dur, vars, html]);
    const d = document.createElement('i');
    d.className = 'fx ' + cls; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.setProperty('--d', Math.max(60, dur) + 'ms');
    if (vars) for (const k in vars) d.style.setProperty('--' + k, vars[k]);
    if (html) d.innerHTML = html;
    layer.appendChild(d); setTimeout(() => d.remove(), dur + 80);
    return d;
  }
  function proj(cls, a, b, dur, c, html) {
    const dx = b.x - a.x, dy = b.y - a.y, ang = Math.atan2(dy, dx) * 180 / Math.PI;
    return spawn('proj ' + cls, a.x, a.y, dur, { dx: dx + 'px', dy: dy + 'px', ang: ang + 'deg', c: c || '#fff' }, html);
  }
  function parts(p, n, c, spread, dur, opt = {}) {
    if (!p) return;
    const G = GX(), cls = opt.cls || '';
    if (G && /^(|flame|ember|shard|ash|ink|dust|bub|spark)$/.test(cls)) {
      if (OFF > 0) return deferred(parts, [p, n, c, spread, dur, opt]);
      const life = dur / Math.max(0.3, fac()), sec = life / 1000, sp = spread / Math.max(0.2, sec) * 1.7, q = { x: p.x, y: p.y };
      const base = { dir: opt.dir, cone: opt.cone, jit: opt.jit || 10, life };
      switch (cls) {
        case 'flame': G.burst(q, { ...base, n: Math.round(n * 1.6), c0: '#fff2b0', c1: c, speed: sp * 0.6, rise: (opt.rise || -40) * 2.2, grav: -50, s: (opt.size || 9) * 1.1, s1: 2, shape: 'glow', drag: 1.6 }); G.burst(q, { ...base, n: Math.ceil(n / 2), c0: '#ffe6a0', c1: c, speed: sp * 0.8, rise: -90, life: life * 1.3, s: 2, shape: 'px', add: true, drag: 1 }); break;
        case 'ember': G.burst(q, { ...base, n: Math.round(n * 1.4), c0: '#fff6d0', c1: c, speed: sp * 0.7, rise: (opt.rise || -40) * 1.8, grav: -20, s: 3, s1: 1, shape: 'px', add: true, drag: 1.2 }); break;
        case 'shard': G.burst(q, { ...base, n: Math.round(n * 1.3), c0: '#ffffff', c1: c, speed: sp * 1.3, grav: 380, s: (opt.size || 6) * 0.8, shape: 'shard', drag: 1.4, vr: 14, add: false }); G.burst(q, { ...base, n: Math.ceil(n / 2), c0: '#ffffff', c1: c, speed: sp * 1.6, life: life * 0.6, s: 2, shape: 'spark', drag: 3, len: 0.04 }); break;
        case 'ash': G.burst(q, { ...base, n, c0: c, c1: '#1a1414', speed: sp * 0.5, rise: (opt.rise || -50) * 1.4, grav: -20, s: 4, s1: 2, shape: 'px', add: false, drag: 1, life: life * 1.3 }); break;
        case 'ink': G.ink(q, Math.round(n * 1.4), spread, c); break;
        case 'dust': G.burst(q, { ...base, n: Math.round(n * 1.2), c0: c, c1: '#2a2420', speed: sp * 0.7, rise: -20, s: (opt.size || 12) * 0.7, s1: (opt.size || 12) * 1.8, shape: 'smoke', a0: 0.5, add: false, drag: 3 }); break;
        case 'bub': G.burst(q, { ...base, n, c0: '#e8ffd0', c1: c, speed: sp * 0.4, rise: -60, s: 2, s1: 6, shape: 'ring', drag: 1.5, life: life * 1.2 }); break;
        default: { const lit = lumOf(c) > 0.42; G.burst(q, { ...base, n: Math.round(n * 1.4), c0: lit ? '#ffffff' : c, c1: c, speed: sp, rise: opt.rise || 0, grav: lit ? 60 : 200, s: (opt.size || 5) * 0.8, s1: 1, shape: 'px', add: lit, drag: 2 });
          if (lit) G.burst(q, { ...base, n: Math.ceil(n / 2), c0: '#ffffff', c1: c, speed: sp * 1.4, life: life * 0.6, s: 2, shape: 'spark', drag: 3, len: 0.04 }); }
      }
      return;
    }
    for (let i = 0; i < n; i++) {
      const ang = opt.dir != null ? opt.dir + (Math.random() - 0.5) * (opt.cone || 1) : Math.random() * Math.PI * 2;
      const r = spread * (0.4 + Math.random() * 0.6);
      spawn('pt ' + (opt.cls || ''), p.x + (Math.random() - 0.5) * (opt.jit || 10), p.y + (Math.random() - 0.5) * (opt.jit || 10), dur * (0.7 + Math.random() * 0.5),
        { dx: Math.cos(ang) * r + 'px', dy: Math.sin(ang) * r + (opt.rise || 0) + 'px', c, s: (opt.size || 5) * (0.7 + Math.random() * 0.6) + 'px' });
    }
  }
  function boom(p, c, size, dur) {
    if (!p) return; const G = GX();
    if (!G) return spawn('boom', p.x, p.y, dur, { c, s: size + 'px' });
    if (OFF > 0) return deferred(boom, [p, c, size, dur]);
    const life = dur / Math.max(0.3, fac());
    G.glow(p, c, size * 0.62, life * 0.9); G.glow(p, '#ffffff', size * 0.25, life * 0.45);
    G.burst(p, { n: Math.round(6 + size / 12), c0: '#ffffff', c1: c, speed: size * 3, life: life * 0.8, s: 2, shape: 'spark', drag: 3.2, grav: 140, len: 0.05 });
    if (size >= 120) G.shock(p, c, size * 0.75, life, 3);
  }
  function ring(p, c, size, dur, w) {
    if (!p) return; const G = GX();
    if (!G) return spawn('ring', p.x, p.y, dur, { c, s: size + 'px', w: (w || 4) + 'px' });
    if (OFF > 0) return deferred(ring, [p, c, size, dur, w]);
    G.shock(p, c, size / 2, dur / Math.max(0.3, fac()), (w || 4) * 0.8);
  }
  const slash = (p, c, rot, size, dur) => p && spawn('slash', p.x, p.y, dur, { c, rot: rot + 'deg', s: size + 'px' });
  const pillar = (p, c, dur) => p && spawn('pillar', p.x, p.y + p.h / 2, dur, { c, h: (p.y + p.h / 2) + 'px' });
  // 书法大字：落笔如印，墨散而去
  let LOUD = false;   // 大招、首领死亡时为 true：4 倍速也照样出字
  // 2026-11-24 大字只留秘技：普通招式、伙伴、小怪出招都不盖大字；秘技、首领大招、打死首领、克制道具传 force
  const glyph = (p, ch, c, size, dur, dy, force) => p && force && spawn('glyph', p.x, p.y + (dy || 0), dur, { c, s: size + 'px' }, ch);
  const glyphF = (p, ch, c, size, dur, dy) => glyph(p, ch, c, size, dur, dy, true);
  // 朱红印章
  const seal = (p, ch, dur) => p && spawn('seal', p.x, p.y, dur, null, ch);
  // 墨迹飞溅
  const ink = (p, n, spread, dur, c) => parts(p, n, c || INK, spread, dur, { cls: 'ink', size: 9, jit: 16 });
  const flames = (p, n, c, spread, dur) => parts(p, n, c, spread, dur, { cls: 'flame', size: 9, rise: -40, jit: 30 });
  const FU = () => SPR.img('fu', 26);
  function bolt(points, c, dur) {
    if (!layer || points.length < 2) return;
    if (OFF > 0) return deferred(bolt, [points, c, dur]);
    if (GX()) return GX().bolt(points, c, dur / Math.max(0.3, fac()));
    const W = arena.clientWidth, H = arena.clientHeight;
    let d = '';
    points.forEach((p, i) => {
      if (!i) { d += `M${p.x},${p.y}`; return; }
      const q = points[i - 1], n = 6;
      for (let k = 1; k <= n; k++) {
        const t = k / n, x = q.x + (p.x - q.x) * t, y = q.y + (p.y - q.y) * t;
        const j = k === n ? 0 : 18;
        d += ` L${x + (Math.random() - 0.5) * j},${y + (Math.random() - 0.5) * j}`;
      }
    });
    const el = document.createElement('i');
    el.className = 'fx boltwrap'; el.style.setProperty('--d', dur + 'ms');
    el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${d}" stroke="${c}" stroke-width="9" fill="none" opacity=".35" stroke-linejoin="round"/><path d="${d}" stroke="#fff" stroke-width="2.5" fill="none" stroke-linejoin="round"/></svg>`;
    layer.appendChild(el); setTimeout(() => el.remove(), dur + 80);
  }
  // 2026-11-25 用户：打斗画面老抖，看得眼睛累。整屏只为大事震：首领的大招、秘技、首领倒下、落地这类（力度 ≥ 7）；
  // 两倍速以上只留 ≥ 9；1.5 秒里最多震一次；幅度压到原来六成、最多 6 像素。普通出手、暴击、连招、破盾都不再震屏
  const SHAKE_MIN = 7; let shLast = 0;
  function shake(power, force) {   // force：秘技、首领倒下——不看倍速和间隔
    if (!arena) return;
    power = power || 4;
    if (!force && (power < SHAKE_MIN || (speed >= 2 && power < 9))) return;
    if (OFF > 0) return deferred(shake, [power, force]);
    const t = performance.now(); if (!force && t - shLast < 1500) return; shLast = t;
    power = Math.min(6, power * 0.6);
    const lv = GX() ? GFX.lvl() : 2; if (lv === 0) return; power = power * (lv === 1 ? 0.7 : 1);
    arena.style.setProperty('--sh', power.toFixed(1) + 'px');
    if (GX() && power >= 5.4) GFX.punch(0.03);
    const ar = arena; clearTimeout(ar._shT); const on = () => { ar.classList.add('shake'); ar._shT = setTimeout(() => ar.classList.remove('shake'), 320); };
    if (ar.classList.contains('shake')) { ar.classList.remove('shake'); requestAnimationFrame(() => requestAnimationFrame(on)); } else on();   // 不读 offsetWidth，免得逼重排
  }
  function sprite(p, html, dur, cls, vars) { return p && spawn('sprfx ' + (cls || ''), p.x, p.y, dur, vars, html); }
  // 全屏水墨泼溅（大招）
  function inkWash(c) { if (!arena) return; spawn('wash', arena.clientWidth / 2, arena.clientHeight / 2, Math.round(700 * fac()), { c: c || INK }); }

  // ======== 出招动作：整个人（.unit）冲过去、身体（.act）起手发力、兵器（.wp）挥出去 ========
  // 兵器：拿在前手（16 格里的 [14.5,10.5]），斜放的兵器图握把在 g，r 是平时的角度
  const WPN = {
    blade: { w: 'w_dao', s: 0.85, g: [3, 12.5], r: -20 },
    taoist: { w: 'w_jian', s: 0.8, g: [3, 12.5], r: -25 },
    corpseman: { w: 'w_ling', s: 0.7, g: [2.5, 13.5], r: -30 },
    assassin: { w: 'w_bishou', s: 0.55, g: [4.5, 12.5], r: -10 },
    monk: { w: 'w_zhang', s: 1.05, g: [6.5, 9.5], r: -40 },
    constable: { w: 'w_dao', s: 0.65, g: [3, 12.5], r: -15 },
    scholar: { w: 'w_bi', s: 0.55, g: [4, 11.5], r: -20 },
    skeleton: { w: 'w_dao', s: 0.7, g: [3, 12.5], r: -15, pal: { M: '#8a7a6a', W: '#b8a890', R: '#5a3a2a', Y: '#6a5a40' } },
    skelking: { w: 'w_dao', s: 0.85, g: [3, 12.5], r: -20, pal: { M: '#c9a45c', W: '#ffe58a', R: '#5a1f6e' } },
    knight: { w: 'w_qiang', s: 0.95, g: [3.5, 11.5], r: -35 },
    goblin: { w: 'w_bishou', s: 0.5, g: [4.5, 12.5], r: -10 },
    bull: { w: 'w_qiang', s: 1, g: [3.5, 11.5], r: -40, pal: { M: '#6a6a72', W: '#b0b0b8', R: '#3a1a1a' } },
    yayi: { w: 'w_qiang', s: 0.95, g: [3.5, 11.5], r: -35 },
    yong: { w: 'w_qiang', s: 0.95, g: [3.5, 11.5], r: -35, pal: { M: '#8a7a5a', W: '#c8b890' } },
    bandit: { w: 'w_dao', s: 0.75, g: [3, 12.5], r: -15, pal: { M: '#8a8a8a', W: '#c8c8c8', R: '#5a2a1a' } },
    miner: { w: 'w_gao', s: 0.8, g: [2.5, 12.5], r: -30 },
    icesoldier: { w: 'w_qiang', s: 0.95, g: [3.5, 11.5], r: -35, pal: { M: '#c8f0ff', W: '#ffffff', R: '#3ad8ff', F: '#4a6a8a' } },
    oxhead: { w: 'w_qiang', s: 1, g: [3.5, 11.5], r: -40, pal: { M: '#6a6a72', W: '#b0b0b8', R: '#3a1a1a' } },
    horseface: { w: 'w_qiang', s: 1, g: [3.5, 11.5], r: -40, pal: { M: '#6a6a72', W: '#b0b0b8', R: '#1a1a3a' } },
    baiwuchang: { w: 'w_zhang', s: 0.95, g: [6.5, 9.5], r: -40, pal: { F: '#e8e8e8', Y: '#c8c8c8', M: '#aaaaaa' } },
    xuanbing32: { w: 'w_jian', s: 0.6, g: [3, 12.5], r: -25, pal: { O: '#c8f0ff', F: '#5a8ab8', Y: '#e8f8ff', R: '#3a8ad8' } },
  };
  const HAND = [14.5, 10.5];
  // 动作图里手的位置（兵器跟着挪）
  const HANDS = {"blade":{"rd":[14.0,5.5],"st":[15.5,11.0],"cs":[14.0,6.5],"ht":[15.5,9.0]},"assassin":{"rd":[14.0,4.5],"st":[15.5,10.0],"cs":[14.0,5.5],"ht":[15.5,8.0]},"monk":{"rd":[15.0,5.5],"st":[15.5,11.0],"cs":[15.0,6.5],"ht":[15.5,9.0]},"taoist":{"rd":[15.0,5.5],"st":[15.5,11.0],"cs":[15.0,6.5],"ht":[15.5,9.0]},"corpseman":{"rd":[15.0,6.5],"st":[15.5,12.0],"cs":[15.0,7.5],"ht":[15.5,10.0]},"ngoc":{"rd":[15.0,6.5],"st":[15.5,12.0],"cs":[15.0,7.5],"ht":[15.5,10.0]},"constable":{"rd":[15.0,5.5],"st":[15.5,11.0],"cs":[15.0,6.5],"ht":[15.5,9.0]},"scholar":{"rd":[14.0,6.5],"st":[15.5,12.0],"cs":[14.0,7.5],"ht":[15.5,10.0]}};
  const MOVE_OF = { hound: 'pounce', fox: 'pounce', ngocfox: 'pounce', imp: 'pounce', bat: 'swoop', crow: 'swoop', ghost: 'glide', femghost: 'glide', wisp: 'glide', xianling: 'glide', headless: 'glide',
    golem: 'slam', bull: 'charge', spider: 'strike', snake: 'strike', toad: 'strike', jiangshi: 'hop', zombie: 'hop', paper: 'flutter',
    boar: 'charge', bear: 'slam', leopard: 'pounce', monkey: 'pounce', shanxiao: 'hop', treant: 'slam', spiderwoman: 'strike', rat: 'pounce', cocoonman: 'hop', tarantula: 'strike',
    lavadog: 'pounce', stoneguard: 'slam', lizard: 'strike', firecrow: 'swoop', minerghost: 'glide', fireling: 'glide',
    xianling32: 'hop', wolfking32: 'pounce', spiderqueen32: 'strike', magmagolem32: 'slam',
    snakewoman: 'strike', croc: 'strike', mosquito: 'swoop', waterghost: 'glide', wasps: 'swoop', toadking: 'pounce', snakemother32: 'strike',
    snowwolf: 'pounce', iceshard: 'glide', yeti: 'slam', icesilkworm: 'strike', snowape: 'pounce', crystalgolem: 'slam',
    oxhead: 'charge', hanged: 'glide', baiwuchang: 'glide', painted: 'glide', guiwang32: 'glide' };
  const IDLE_OF = { ghost: 'm-float', femghost: 'm-float', wisp: 'm-float', xianling: 'm-float', headless: 'm-float', paper: 'm-float', bat: 'm-flap', crow: 'm-flap',
    firecrow: 'm-flap', minerghost: 'm-float', fireling: 'm-float', mosquito: 'm-flap', wasps: 'm-flap', waterghost: 'm-float', iceshard: 'm-float',
    hanged: 'm-float', baiwuchang: 'm-float', guiwang32: 'm-float' };
  // 主角骨架小人：三层图（身后的兵器 / 身体 / 身前的兵器和手），换姿势就是换三张图
  const WR_OVER = { legend: { M: '#ffc45a', m: '#fff3c0' }, set: { M: '#7fe08a', m: '#e8ffe8' }, rare: { M: '#f0dc7a', m: '#fffbe0' }, magic: { M: '#9aa8ff', m: '#eef0ff' } };
  const isRig = act => !!(act && act.dataset.rig && typeof HERO !== 'undefined');
  // 换姿势时的声音：出招按兵器分，蓄势是衣袂声，胜利收刀一声铮，倒下一声闷响
  const WSFX = { dao: 'whoosh', tsword: 'swish', sdao: 'swish', dagger: 'stab', staff: 'staffw', hammer: 'hammerw', bell: 'ding', bottle: 'clink', whisk: 'swish', cane: 'rustle', none: 'rustle' };
  function poseSfx(act, from, to) {
    if (typeof SFX === 'undefined' || from === to || to === 'idle' || to === 'idle2') return;
    const L = HERO.LOOK[act.dataset.rig] || {}, fast = speed >= 2;
    if (to === 'st') SFX.play(WSFX[L.weapon] || 'swish');
    else if (to === 'wu' && !fast) SFX.play('rustle');
    else if (to === 'vi') SFX.play('shing');
    else if (to === 'kn') SFX.play('thud');
  }
  function setPose(act, pose) {
    if (!isRig(act)) return; let over = null; try { over = JSON.parse(act.dataset.over || 'null'); } catch (e) {}
    poseSfx(act, act.dataset.pose, pose);
    const F = HERO.url(act.dataset.rig, pose, over); if (!F) return;
    const [b, m, f] = act.querySelectorAll(':scope > img'); if (b) b.src = F.back; if (m) m.src = F.body; if (f) f.src = F.front;
    act.dataset.pose = pose; act.dataset.tx = F.tip[0].toFixed(3); act.dataset.ty = F.tip[1].toFixed(3); act.dataset.hx = F.hand[0].toFixed(3); act.dataset.hy = F.hand[1].toFixed(3);
  }
  function rigHeroHTML(u, S, key, over0) {
    const k = S / 32, w = 56 * k, h = 46 * k, wr = u.kind === 'hero' && typeof SAVE !== 'undefined' && SAVE.chars && SAVE.chars[u.cls] && SAVE.chars[u.cls].eq && SAVE.chars[u.cls].eq.weapon ? SAVE.chars[u.cls].eq.weapon.rarity : null;
    key = key || u.cls; const over = u.kind === 'hero' ? (WR_OVER[wr] || null) : (over0 || null), F = HERO.url(key, 'idle', over);
    return `<div class="pose" style="--bt:${(1.8 + Math.random() * 0.8).toFixed(2)}s;--bd:-${(Math.random() * 2).toFixed(2)}s"><div class="act rig${u.side === 'e' ? ' flip' : ''}" data-rig="${key}" data-pose="idle" data-over='${JSON.stringify(over)}' data-tx="${F.tip[0].toFixed(3)}" data-ty="${F.tip[1].toFixed(3)}" data-hx="${F.hand[0].toFixed(3)}" data-hy="${F.hand[1].toFixed(3)}" style="--rw:${w.toFixed(1)}px;--rh:${h.toFixed(1)}px;--rl:${((S - w) / 2).toFixed(1)}px;--rt:${(S - 44 * k).toFixed(1)}px"><img class="hb" src="${F.back}" alt="" draggable="false"><img class="spr" src="${F.body}" alt="" draggable="false"><img class="hf" src="${F.front}" alt="" draggable="false"></div></div>`;
  }
  function rigHTML(u, img, S, spr) {
    if (typeof HERO !== 'undefined') {
      if (u.kind === 'hero' && HERO.has(u.cls)) return rigHeroHTML(u, S);
      const lk = u.kind !== 'hero' && HERO.lookOf(spr || u.spr); if (lk) return rigHeroHTML(u, S, lk, HERO.mapPal(lk, u.pal));
    }
    const face = u.side === 'e' ? -1 : 1, W = WPN[spr || u.spr];
    let wp = '';
    if (W) {
      const ws = S * W.s, hx = (face > 0 ? HAND[0] : 16 - HAND[0]) / 16 * S, hy = HAND[1] / 16 * S, gx = W.g[0] / 16 * ws, gy = W.g[1] / 16 * ws;
      wp = `<i class="wp" data-r="${W.r}" data-s="${S}" data-gx="${gx.toFixed(1)}" data-gy="${gy.toFixed(1)}" style="--wx:${(hx - gx).toFixed(1)}px;--wy:${(hy - gy).toFixed(1)}px;--ws:${ws.toFixed(1)}px;--ox:${gx.toFixed(1)}px;--oy:${gy.toFixed(1)}px;--wf:${face};--wr:${W.r}deg">${SPR.img(W.w, Math.round(ws), W.pal)}</i>`;
    }
    const nm = spr || u.spr, pal = u.kind === 'hero' && typeof CLASSES !== 'undefined' ? CLASSES[u.cls].pal : u.pal;
    return `<div class="pose" style="--bt:${(1.8 + Math.random() * 0.8).toFixed(2)}s;--bd:-${(Math.random() * 2).toFixed(2)}s"><div class="act" data-nm="${nm}" data-pal='${JSON.stringify(pal || null)}'${(u.kind === 'boss' || u.rare) && u.kind !== 'hero' && SPR.monUrl ? ` data-spr="${nm}" data-mon="1"` : HANDS[nm] || (SPR.T[nm + '_atk']) ? ` data-spr="${nm}"${HANDS[nm] ? '' : ' data-atk="1"'}` : ''}>${img}${wp}</div></div>`;
  }
  const idleCls = spr => IDLE_OF[spr] || '';
  function rig(id) {
    const el = document.getElementById('u-' + id); if (!el) return null;
    const act = el.querySelector('.act');
    return { el, act, wp: el.querySelector('.wp'), img: el.querySelector('.act > img.spr') || el.querySelector('.act > img'), face: el.closest('#foes') ? -1 : 1, rig: isRig(act) };
  }
  // 换动作图：at 毫秒后换成 kind（rd 起手 / st 出招 / cs 施法 / ht 挨打），null 换回站姿；兵器跟着挪到手上
  const KFALL = { wu: 'rd', ft: 'st', c2: 'cs', bk: 'rd', vi: 'cs', ds: 'rd', kn: 'ht' };
  const MONK = { rd: 'mw', wu: 'mw', cs: 'mw', c2: 'mw', bk: 'mw', ds: 'mw', vi: 'mw', st: 'atk', atk: 'atk', ft: 'mf', ht: 'mh', kn: 'mh' };
  function frame(r, kind) {
    if (r.act && isRig(r.act)) { setPose(r.act, kind || 'idle'); return; }
    if (r.act && r.act.dataset.mon && r.img) {   // 首领、稀有精英：从原图生成的动作帧
      if (!r.img.dataset.base) r.img.dataset.base = r.img.src;
      let pal = null; try { pal = JSON.parse(r.act.dataset.pal || 'null'); } catch (e) {}
      const mk = kind && MONK[kind]; r.img.src = mk ? (SPR.monUrl(r.act.dataset.spr, mk, pal) || r.img.dataset.base) : r.img.dataset.base; return;
    }
    if (kind && KFALL[kind] && r.act && r.act.dataset.spr && !SPR.T[r.act.dataset.spr + '_' + kind]) kind = KFALL[kind];
    const nm = r.act && r.act.dataset.spr; if (!nm || !r.img || (kind && !SPR.T[nm + '_' + kind])) return;
    if (!r.img.dataset.base) r.img.dataset.base = r.img.src;
    let pal = null; try { pal = JSON.parse(r.act.dataset.pal || 'null'); } catch (e) {}
    r.img.src = kind ? SPR.url(nm + '_' + kind, pal) : r.img.dataset.base;
    if (r.wp) { const S = +r.wp.dataset.s, h = kind && HANDS[nm] ? HANDS[nm][kind] : HAND, hx = (r.face > 0 ? h[0] : 16 - h[0]) / 16 * S, hy = h[1] / 16 * S;
      r.wp.style.setProperty('--wx', (hx - +r.wp.dataset.gx).toFixed(1) + 'px'); r.wp.style.setProperty('--wy', (hy - +r.wp.dataset.gy).toFixed(1) + 'px'); }
  }
  // 一串动作图：seq = [[kind, 开始(0~1)], ...]，最后自动换回站姿
  function frames(r, seq, d, end) {
    if (!r || !r.act || !(r.act.dataset.spr || r.rig)) return;
    (r.el._ft || []).forEach(clearTimeout); r.el._ft = []; r.el._busy = performance.now() + d * (end || 0.8);
    seq.forEach(([k, t]) => r.el._ft.push(setTimeout(() => frame(r, k), Math.round(d * t))));
    r.el._ft.push(setTimeout(() => frame(r, null), Math.round(d * (end || 0.8))));
  }
  const A = (el, fr, d, ease) => el && el.animate ? el.animate(fr, { duration: Math.max(30, Math.round(d)), easing: ease || 'cubic-bezier(.3,.7,.4,1)' }) : null;
  const tf = (s, o, x) => Object.assign({ transform: s }, o == null ? {} : { offset: o }, x || {});
  // 兵器：steps = [[角度, 时间点, 往前送几像素]]
  function wpn(r, steps, d, ease) {
    if (!r.wp) return; const rest = +r.wp.dataset.r || 0, f = r.face;
    const k = (a, x) => `${x ? `translateX(${x * f}px) ` : ''}scaleX(${f}) rotate(${a}deg)`;
    A(r.wp, [tf(k(rest)), ...steps.map(([a, o, x]) => tf(k(a, x), o)), tf(k(rest))], d, ease || 'linear');
  }
  // 身体：steps = [[transform, 时间点, 额外属性]]
  const body2 = (r, steps, d, ease) => A(r.act, [tf('none'), ...steps.map(([t, o, x]) => tf(t, o, x)), tf('none')], d, ease || 'linear');
  // 冲到目标跟前：arrive 到、leave 走；arcY 走弧线（负数往上跳，正数往下俯冲）
  function travel(r, a, t, d, arrive, leave, frac, arcY, hops) {
    if (!a || !t) return;
    const dx = (t.x - a.x) * frac, dy = (t.y - a.y) * frac, at = (k, y) => `translate(${(dx * k).toFixed(1)}px,${(dy * k + (y || 0)).toFixed(1)}px)`;
    r.el.style.zIndex = 6; setTimeout(() => { r.el.style.zIndex = ''; }, d);
    const go = arrive * 0.35, fr = [tf('none'), tf('none', go)];
    if (hops) for (let i = 1; i < hops * 2; i++) fr.push(tf(at(i / (hops * 2), i % 2 ? -16 : 0), go + (arrive - go) * i / (hops * 2)));
    else if (arcY) fr.push(tf(at(0.5, arcY), go + (arrive - go) * 0.5));
    fr.push(tf(at(1), arrive), tf(at(1), leave), tf('none'));
    A(r.el, fr, d, 'ease-in-out');
  }
  // 残影：冲刺时身后留几道影子
  function ghosts(r, a, t, frac, t0, t1, n, col) {
    if (!r.img || !a || !t) return;
    const src = r.img.src, S = r.img.width;
    for (let i = 0; i < n; i++) { const k = (i + 0.5) / n;
      setTimeout(() => sprite({ x: a.x + (t.x - a.x) * frac * k, y: a.y + (t.y - a.y) * frac * k }, `<img src="${src}" width="${S}" height="${S}" style="transform:scaleX(${r.face})">`, Math.round(300 * fac()), 'ghostimg', { c: col || '#9ab0ff' }), t0 + (t1 - t0) * k); }
  }
  const feet = p => p && { x: p.x, y: p.y + p.h * 0.45, h: p.h };
  const dust = (p, n) => p && parts(feet(p), n || 6, '#a8967e', 34, Math.round(460 * fac()), { cls: 'dust', rise: -10, size: 12, jit: 26 });
  // 刀光：跟着兵器挥出去的月牙
  let arcN = 0;
  function arc(p, face, c, rot, size, dur) {
    if (!p) return; const id = 'ag' + (++arcN % 999);
    spawn('arc', p.x, p.y, dur || Math.round(300 * fac()), { c, f: face, rot: (rot || 0) + 'deg', s: (size || 110) + 'px' },
      `<svg viewBox="-50 -50 100 100"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path d="M-42,-4 A44,44 0 0 1 42,-4 A58,58 0 0 0 -42,-4 Z" fill="url(#${id})"/></svg>`);
  }
  const impact = (p, c, size) => p && spawn('impact', p.x, p.y, Math.round(320 * fac()), { c: c || '#fff', s: (size || 120) + 'px' });
  // ---------- 国风样板（志怪·阴间）：只在 body.gf 时走 ----------
  const GF = () => typeof document !== 'undefined' && document.body.classList.contains('gf');
  const MING = '#59e0c4', FUY = '#e8c13a', rim = (c, k) => ({ filter: `drop-shadow(0 0 ${k || 6}px ${c})` });
  // 兵器尖（铃口）在战场里的位置：姿势图自己带着
  function tipP(r) { const im = r && r.act && r.act.querySelector(':scope > img'); if (!im || !arena) return null; const b = im.getBoundingClientRect(), A0 = arena.getBoundingClientRect(), tx = +r.act.dataset.tx || 0.5, ty = +r.act.dataset.ty || 0.5;
    return { x: b.left - A0.left + (r.face > 0 ? tx : 1 - tx) * b.width, y: b.top - A0.top + ty * b.height }; }
  // 铃音：从铃口荡开的细圈，一粗一细
  const chime = (r, size, dur, quiet) => { const p = tipP(r); if (!p) return; spawn('yin', p.x, p.y, dur, { c: MING, s: size + 'px' }); if (quiet) return; spawn('yin thin', p.x, p.y, dur * 1.25, { c: '#d8fff4', s: size * 1.5 + 'px' }); if (typeof SFX !== 'undefined') SFX.play('ding'); };
  // 黄符：从脚边飘起来几张
  const fus = (p, n, dur) => { if (!p) return; for (let i = 0; i < n; i++) spawn('fu', p.x + (Math.random() - 0.5) * 34, p.y + p.h * 0.3, dur * (0.8 + Math.random() * 0.5), { dx: ((Math.random() - 0.5) * 46).toFixed(0) + 'px', dy: (-46 - Math.random() * 34).toFixed(0) + 'px', r0: ((Math.random() - 0.5) * 40).toFixed(0) + 'deg', r1: ((Math.random() - 0.5) * 150).toFixed(0) + 'deg', dl: (i * 50) + 'ms' }); };
  // 僵尸听铃：我方还站着的僵尸齐齐一跳，额头的符亮一下
  function zombieHop(d, hgt) { if (!arena) return;
    arena.querySelectorAll('.unit.k-minion:not(.dead)').forEach((el, i) => { if (el.closest('#foes')) return; const act = el.querySelector('.act'); if (!act || !act.animate) return;
      const h = hgt || 11; A(act, [tf('none'), tf('translateY(2px) scale(1.08,.9)', 0.16), tf(`translateY(-${h}px) scale(.94,1.08)`, 0.48), tf('translateY(0) scale(1.1,.88)', 0.78), tf('none')], d, 'ease-out');
      const sp = el.querySelector('.sp') || el, b = sp.getBoundingClientRect(), A0 = arena.getBoundingClientRect(), x = b.left - A0.left + b.width / 2, y = b.top - A0.top;
      setTimeout(() => spawn('fuflash', x, y + b.height * 0.22 - h * 0.5, d * 0.7, { c: FUY }), d * 0.3);
      setTimeout(() => spawn('hopdust', x, y + b.height * 0.96, d * 0.6, { c: '#9fb0a8' }), d * 0.78); }); }
  // 待机小动作：每个职业两样，轮着来
  const FIDGET = {
    necro: [r => frames(r, [['ib', 0]], 900, 1),
      r => { frames(r, [['ib', 0], ['ic', 0.2], ['id', 0.4], ['ic', 0.6], ['ib', 0.8]], 860, 1); setTimeout(() => { if (/^i[bcd]$/.test(r.act.dataset.pose)) chime(r, 26, 420, 1); }, 380); }],
    berserker: [r => frames(r, [['kd', 0]], 1200, 1), r => frames(r, [['mo', 0]], 900, 1)],
    mage: [(r, p) => { frames(r, [['pt', 0]], 950, 1); if (p) spawn('bagua', p.x, p.y + p.h * 0.44, 900, { c: '#ffe9a8', s: '64px' }); }, r => frames(r, [['lk', 0]], 800, 1)],
    assassin: [r => frames(r, [['z1', 0], ['z2', 0.22], ['z1', 0.44], ['z2', 0.66]], 700, 1), r => frames(r, [['lk', 0]], 800, 1)],
    paladin: [(r, p) => { frames(r, [['pr', 0]], 1050, 1); if (p) spawn('lian', p.x, p.y + p.h * 0.44, 1000, { s: '56px' }); }, r => frames(r, [['lk', 0]], 800, 1)],
  };
  // 出招的点缀：狂刀客一笔墨刀光，道士脚下八卦、飞符，刺客一团夜烟、一线寒光，和尚脚下莲花
  function gfFlourish(cls, mv, r, a, t, f, res) {
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.gfx === 0) return;
    const F = r.face, hit = Math.max(60, (res.hit || 0) + (res.pre || 0)), D = Math.round(380 * f), tp = t || (a && { x: a.x + 44 * F, y: a.y - 4, h: a.h }), fy = a ? a.y + a.h * 0.44 : 0;
    if (cls === 'berserker') {
      if (mv === 'roar') { if (a) later(() => spawn('yinwave', a.x, fy, 520 * f, { c: '#c4291f', s: '260px' }), hit * 0.5); return; }
      if (mv === 'spin') { if (a) later(() => { spawn('mohen', a.x, a.y, D, { c: '#c4291f', s: '124px', rot: '-8deg' }); spawn('mohen', a.x, a.y + 6, D, { c: '#c4291f', s: '124px', rot: '172deg' }); }, hit * 0.7); return; }
      if (tp) later(() => { spawn('mohen', tp.x, tp.y, D, { c: '#c4291f', s: (mv === 'heavy' ? 132 : 98) + 'px', rot: (mv === 'heavy' ? 68 : -26 + Math.random() * 20).toFixed(0) + 'deg', fx: F });
        if (mv === 'combo') later(() => spawn('mohen', tp.x, tp.y, D, { c: '#c4291f', s: '98px', rot: '30deg', fx: F }), 110 * f); }, hit);
    } else if (cls === 'mage') {
      if (a) spawn('bagua', a.x, fy, Math.max(440 * f, hit + 260 * f), { c: '#ffe9a8', s: '112px' });
      if (mv !== 'stomp') later(() => fus(a, 2, 520 * f), hit * 0.4);
    } else if (cls === 'assassin') {
      if (a) spawn('yeyan', a.x, fy - 4, 420 * f, { s: '56px' });
      if (tp && mv !== 'vanish') later(() => spawn('yishan', tp.x, tp.y, 260 * f, { c: '#c9a0ff', s: '112px', rot: (-30 + Math.random() * 60).toFixed(0) + 'deg' }), hit);
    } else if (cls === 'paladin') {
      if (a) spawn('lian', a.x, fy, Math.max(480 * f, hit + 260 * f), { s: '98px' });
      if (tp && (mv === 'palm' || mv === 'heavy')) later(() => spawn('yin', tp.x, tp.y, 320 * f, { c: '#ffd75a', s: '62px' }), hit);
    }
  }
  // 秘技特写之后的场面（大字已经在特写里出过，这里不再盖字）
  function gfU(cls, mid, foes, G) { if (!GF()) return false; const hp = pos('P'), fy = hp ? hp.y + hp.h * 0.44 : mid.y;
    if (cls === 'berserker') { spawn('mohen', mid.x, mid.y, G * 0.8, { c: '#ff3a2a', s: '300px', rot: '-18deg' }); later(() => spawn('mohen', mid.x, mid.y + 10, G * 0.8, { c: '#ff3a2a', s: '300px', rot: '16deg', fx: -1 }), 120); if (hp) spawn('yinwave', hp.x, fy, G * 0.7, { c: '#c4291f', s: '380px' }); }
    else if (cls === 'mage') { spawn('bagua', mid.x, mid.y + 30, G * 1.3, { c: '#ffe9a8', s: '330px' }); if (hp) { spawn('bagua', hp.x, fy, G, { c: '#ffe9a8', s: '130px' }); fus(hp, 5, G); } }
    else if (cls === 'assassin') { foes.forEach((p, i) => later(() => spawn('yishan', p.x, p.y, G * 0.5, { c: '#c9a0ff', s: '150px', rot: (-40 + Math.random() * 80).toFixed(0) + 'deg' }), i * 60)); if (hp) spawn('yeyan', hp.x, fy - 4, G * 0.8, { s: '90px' }); }
    else if (cls === 'paladin') { if (hp) spawn('lian', hp.x, fy, G * 1.3, { s: '220px' }); spawn('lian', mid.x, mid.y + 30, G * 1.2, { s: '320px' }); }
    return true; }
  // 普通摇铃（普攻、摄魂、镇魂钉、养尸符）：提铃一荡一落，一声
  function gfBell(r, a, t, f, c) { const d = 440 * f, F = r.face;
    frames(r, [['cs', 0.04], ['ya', 0.16], ['yb', 0.34], ['yc', 0.56]], d, 0.84);
    body2(r, [[`translateY(-3px)`, 0.2], [`translateY(-4px)`, 0.4], [`translateX(${5 * F}px) translateY(1px)`, 0.62, rim(MING, 5)]], d);
    setTimeout(() => chime(r, 44, 340 * f), d * 0.36);
    setTimeout(() => { if (a) spawn('yinwave', a.x, a.y + a.h * 0.44, 420 * f, { c: MING, s: '120px' }); }, d * 0.58);
    return { hit: 0, pre: Math.round(d * 0.62) }; }
  // 大摇铃（摇铃唤尸、集火、百鬼夜行）：举过头顶来回三荡，铃音一圈圈荡开，黄符飘起，僵尸齐跳
  function gfBell2(r, a, t, f) { const d = 660 * f, F = r.face;
    frames(r, [['rd', 0], ['ya', 0.1], ['yb', 0.24], ['ya', 0.38], ['yb', 0.52], ['yc', 0.66]], d, 0.9);
    body2(r, [[`translateY(2px) scale(1.04,.95)`, 0.06], [`translateY(-7px) scale(1.03)`, 0.2, rim(MING, 5)], [`translateY(-8px) scale(1.04)`, 0.52, rim(MING, 7)], [`translateX(${6 * F}px) translateY(1px)`, 0.7, rim(MING, 5)]], d);
    [0.14, 0.28, 0.42, 0.56].forEach((k, i) => setTimeout(() => chime(r, 46 + i * 10, 360 * f), d * k));
    setTimeout(() => fus(a, 4, 700 * f), d * 0.12);
    setTimeout(() => { if (a) { spawn('yinwave', a.x, a.y + a.h * 0.44, 560 * f, { c: MING, s: '300px' }); spawn('yinwave', a.x, a.y + a.h * 0.44, 700 * f, { c: '#d8fff4', s: '420px' }); } zombieHop(380 * f); }, d * 0.66);
    return { hit: 0, pre: Math.round(d * 0.7) }; }
  const mcircle = (p, c, size) => p && spawn('mcircle', p.x, p.y + p.h * 0.42, Math.round(760 * fac()), { c, s: (size || 92) + 'px' });
  const glow = (c, k) => ({ filter: `drop-shadow(0 0 ${k || 10}px ${c}) brightness(1.35)` });
  const MELEE_CLS = ['berserker', 'assassin', 'paladin'];
  const HERO_MV = { slash: 'combo', whirl: 'spin', warcry: 'roar', bloodlust: 'heavy', missile: 'cast', fireball: 'cast', frostnova: 'stomp', chain: 'sky', meteor: 'sky',
    bonespear: 'bell', summon: 'bell2', curse: 'bell', corpse: 'bell2', bonestorm: 'bell2', twin: 'stab', venom: 'throw', shadowstep: 'vanish', fan: 'spinthrow', deathmark: 'stab',
    holy: 'palm', aegis: 'plant', prayer: 'plant', hammer: 'heavy', judgement: 'sky', phoenix: 'roar', ult: 'ult',
    jihuo: 'bell2', yangshi: 'bell', bawang: 'heavy', butui: 'roar', wulei: 'sky', shadowkill: 'combo', yandun: 'vanish', chanhou: 'roar',
    liedi: 'heavy', lieyan: 'swing', hanren: 'stab', luoshi: 'sky', jinguang: 'cast', lunzhuan: 'throw', shidu: 'stomp', tudun: 'stomp', bingpo: 'throw', dici: 'stomp',
    ganlu: 'plant', fuhu: 'palm', budong: 'plant' };
  // 每一招自己的一串姿势（[姿势, 在这一招里的时间点 0~1]）；身法（冲刺、跳、发光）还走上面的 MOVES
  const MOVE_D = { swing: 440, combo: 560, heavy: 620, spin: 520, roar: 520, cast: 420, sky: 520, stomp: 480, bell: 400, bell2: 560, stab: 460, throw: 380, vanish: 460, spinthrow: 460, palm: 440, plant: 480, ult: 700 };
  const SKILL_FR = {
    // 狂刀客
    slash: [['rd', 0], ['st', 0.2], ['ft', 0.27], ['wu', 0.34], ['st', 0.42], ['ft', 0.48], ['jp', 0.53], ['sl', 0.62]],
    liedi: [['rd', 0], ['jp', 0.14], ['sl', 0.46]],
    lieyan: [['rd', 0], ['wu', 0.12], ['st', 0.36], ['up', 0.5]],
    warcry: [['bk', 0.05], ['rr', 0.2]],
    hanren: [['ds', 0], ['st', 0.28], ['up', 0.42]],
    bloodlust: [['wu', 0.04], ['jp', 0.18], ['sl', 0.47], ['up', 0.62]],
    whirl: [['up', 0.06], ['st', 0.2]],
    bawang: [['rd', 0], ['wu', 0.1], ['jp', 0.28], ['st', 0.46], ['sl', 0.54]],
    butui: [['bk', 0.05], ['rr', 0.3]],
    'ult:berserker': [['rd', 0.04], ['jp', 0.18], ['st', 0.44], ['sl', 0.52]],
    // 五行道士
    missile: [['pt', 0.06], ['th', 0.44]],
    fireball: [['wu', 0.04], ['pt', 0.22], ['th', 0.44]],
    frostnova: [['c2', 0.08], ['jp', 0.24], ['sl', 0.42]],
    chain: [['pt', 0.08], ['c2', 0.3], ['pt', 0.5]],
    luoshi: [['c2', 0.06], ['pt', 0.3], ['sl', 0.48]],
    jinguang: [['cs', 0.04], ['pt', 0.26], ['st', 0.5]],
    lunzhuan: [['wu', 0.04], ['th', 0.44], ['ft', 0.6]],
    meteor: [['md', 0.04], ['c2', 0.36]],
    wulei: [['pt', 0.04], ['c2', 0.26], ['pt', 0.5]],
    'ult:mage': [['md', 0.06], ['c2', 0.3], ['pt', 0.5]],
    // 赶尸人
    summon: [['c2', 0.08], ['cs', 0.26], ['c2', 0.44], ['cs', 0.62]],
    jihuo: [['cs', 0.04], ['c2', 0.22], ['pt', 0.46]],
    shidu: [['wu', 0.04], ['jp', 0.18], ['sl', 0.42]],
    corpse: [['pt', 0.04], ['rr', 0.3], ['th', 0.48]],
    yangshi: [['pr', 0.06], ['c2', 0.4]],
    curse: [['cs', 0.04], ['pt', 0.3], ['th', 0.56]],
    bonestorm: [['md', 0.04], ['c2', 0.3], ['md', 0.5], ['c2', 0.66]],
    tudun: [['wu', 0.04], ['md', 0.2], ['sl', 0.44]],
    bonespear: [['wu', 0.04], ['th', 0.5]],
    'ult:necro': [['md', 0.04], ['c2', 0.26], ['md', 0.42], ['c2', 0.56]],
    // 夜行刺客
    twin: [['ds', 0], ['st', 0.22], ['up', 0.32], ['st', 0.44], ['ft', 0.52]],
    venom: [['wu', 0], ['th', 0.44]],
    shadowstep: [['kn', 0], ['ds', 0.5]],
    bingpo: [['wu', 0], ['th', 0.26], ['rd', 0.36], ['th', 0.46], ['ft', 0.56]],
    deathmark: [['ds', 0], ['st', 0.26], ['up', 0.4], ['vi', 0.6]],
    fan: [['jp', 0.06], ['th', 0.44]],
    dici: [['jp', 0.04], ['sl', 0.42]],
    shadowkill: [['ds', 0], ['st', 0.18], ['up', 0.26], ['st', 0.34], ['ft', 0.42], ['st', 0.5], ['up', 0.58], ['sl', 0.66]],
    yandun: [['kn', 0], ['ds', 0.5]],
    'ult:assassin': [['ds', 0.02], ['st', 0.2], ['up', 0.3], ['jp', 0.38], ['sl', 0.5]],
    // 金刚武僧
    holy: [['rd', 0], ['pm', 0.36]],
    aegis: [['pr', 0.08], ['c2', 0.4]],
    hammer: [['wu', 0.04], ['jp', 0.18], ['sl', 0.47]],
    ganlu: [['pr', 0.08], ['cs', 0.44]],
    fuhu: [['rd', 0], ['pm', 0.3], ['up', 0.46]],
    prayer: [['pr', 0.08], ['md', 0.36]],
    budong: [['md', 0.08], ['pr', 0.44]],
    judgement: [['md', 0.04], ['c2', 0.34]],
    chanhou: [['bk', 0.04], ['rr', 0.2]],
    'ult:paladin': [['pr', 0.04], ['md', 0.2], ['c2', 0.38], ['sl', 0.52]],
  };
  function motionOf(u, c, spr, hasT) {
    if (u.kind === 'hero') {
      if (HERO_MV[c.id]) return HERO_MV[c.id];
      const melee = MELEE_CLS.includes(u.cls);
      if (c.id === 'gen') { if (c.aoe) return melee ? (u.cls === 'paladin' ? 'stomp' : u.cls === 'assassin' ? 'spinthrow' : 'spin') : 'sky';
        return melee ? (u.cls === 'assassin' ? 'stab' : u.cls === 'paladin' ? 'palm' : 'swing') : (u.cls === 'necro' ? 'bell' : 'cast'); }
      return melee ? 'swing' : 'cast';
    }
    if (u.kind === 'ally') {
      if (spr === 'constable') return c.id === 'chain2' ? 'throw' : 'swing';
      if (spr === 'scholar') return c.id === 'zhengqi' ? 'plant' : 'cast';
      return c.id === 'foxfire' || c.id === 'foxfireAll' || c.id === 'foxHeal' ? 'cast' : 'throw';
    }
    if (c.id === 'charge') return 'gather';
    if (c.id === 'bossAoe') return 'quake';
    if (c.id === 'roar' || c.id === 'enrage' || c.id === 'phase') return 'roar';
    if (c.id === 'summon' || c.id === 'bossHeal') return 'raise';
    if (c.id === 'web') return 'throw';
    if (u.kind === 'minion' ? u.ae === 'magic' : c.elem && c.elem !== 'phys') return 'raise';
    if (!hasT) return 'swing';
    return MOVE_OF[spr] || (u.kind === 'boss' ? 'heavy' : 'swing');
  }
  const ECOL = { phys: '#f0e6d0', fire: '#ff8a3a', cold: '#9ad8ff', light: '#e6e0ff', magic: '#5df0c0', holy: '#ffd75a', poison: '#8fe05a', buff: '#ff8a4a', heal: '#ff9ac0' };
  // 每种动作：返回 { hit: 打中的时刻, pre: 特效推迟多久 }
  const MOVES = {
    swing(r, a, t, f, c) { const d = 440 * f, F = r.face; frames(r, [['rd', 0], ['wu', 0.16], ['st', 0.38], ['ft', 0.5]], d, 0.74);
      if (t) travel(r, a, t, d, 0.42, 0.62, 0.78);
      body2(r, [[`translateX(${-5 * F}px) rotate(${-9 * F}deg) scale(1.06,.94)`, 0.24], [`translateX(${5 * F}px) rotate(${12 * F}deg) scale(1.12,.9)`, 0.42], [`rotate(${6 * F}deg)`, 0.62]], d);
      wpn(r, [[-115, 0.24], [90, 0.42], [78, 0.62]], d);
      const hit = Math.round(d * 0.42); if (t && (r.wp || r.rig)) setTimeout(() => arc(t, F, '#fff', 20, 110), hit * 0.85);
      return { hit, pre: 0 }; },
    combo(r, a, t, f) { const d = 560 * f, F = r.face; frames(r, [['rd', 0], ['st', 0.2], ['ft', 0.27], ['wu', 0.34], ['st', 0.42], ['ft', 0.48], ['wu', 0.53], ['st', 0.6], ['ft', 0.68]], d, 0.8);
      if (t) travel(r, a, t, d, 0.2, 0.72, 0.78);
      body2(r, [[`translateX(${-5 * F}px) rotate(${-8 * F}deg)`, 0.12], [`translateX(${5 * F}px) rotate(${10 * F}deg) scale(1.1,.92)`, 0.26], [`rotate(${-6 * F}deg)`, 0.35],
        [`translateX(${6 * F}px) rotate(${-10 * F}deg) scale(1.1,.92)`, 0.44], [`translateY(-6px) rotate(${-10 * F}deg)`, 0.53], [`translateX(${8 * F}px) translateY(2px) rotate(${14 * F}deg) scale(1.16,.88)`, 0.62], [`rotate(${8 * F}deg)`, 0.72]], d);
      wpn(r, [[-110, 0.12], [85, 0.26], [70, 0.33], [-95, 0.44], [-150, 0.53], [100, 0.62], [90, 0.72]], d);
      if (t) { setTimeout(() => arc(t, F, '#fff', 20, 100), d * 0.23); setTimeout(() => arc(t, F, '#ffd0b0', 200, 96), d * 0.41); setTimeout(() => arc(t, F, '#fff', 40, 130), d * 0.59); }
      return { hit: Math.round(d * 0.26), pre: 0 }; },
    heavy(r, a, t, f, c, u) { const d = 620 * f, F = r.face; frames(r, [['rd', 0.02], ['wu', 0.14], ['st', 0.46], ['ft', 0.54]], d, 0.76);
      if (t) travel(r, a, t, d, 0.48, 0.68, 0.74, -34);
      body2(r, [[`translateY(3px) scale(1.1,.88)`, 0.14], [`translateY(-24px) rotate(${-12 * F}deg) scale(.96,1.06)`, 0.36], [`translateY(4px) rotate(${10 * F}deg) scale(1.2,.82)`, 0.48], [`rotate(${6 * F}deg)`, 0.68]], d);
      wpn(r, [[-30, 0.14], [-160, 0.36], [105, 0.48], [95, 0.68]], d);
      const hit = Math.round(d * 0.48);
      setTimeout(() => { if (t) { if (r.wp || r.rig) arc(t, F, u && u.kind === 'boss' ? '#ff8a6a' : '#fff', 60, 150); impact(t, '#fff', 150); dust(t, 8); } shake(5); }, hit);
      return { hit, pre: 0 }; },
    spin(r, a, t, f) { const d = 520 * f, F = r.face, P = 'perspective(260px) '; frames(r, [['st', 0.08]], d, 0.86);
      A(r.act, [tf(P + 'rotateY(0deg)'), tf(P + 'rotateY(0deg) translateY(2px) scale(1.06,.94)', 0.1), tf(P + `rotateY(${360 * F}deg) scale(1.08)`, 0.45), tf(P + `rotateY(${720 * F}deg)`, 0.85), tf(P + `rotateY(${720 * F}deg)`)], d, 'linear');
      wpn(r, [[50, 0.1], [50, 0.85]], d); setTimeout(() => dust(a, 8), d * 0.3);
      return { hit: Math.round(d * 0.45), pre: 0 }; },
    roar(r, a, t, f, c) { const d = 520 * f, col = c.id === 'phase' ? '#ff3a5a' : c.id === 'warcry' ? '#ffb066' : '#ff5a3a'; frames(r, [['c2', 0.18]], d, 0.8);
      body2(r, [[`translateY(4px) scale(1.06,.9)`, 0.14], [`translateY(-6px) scale(1.16)`, 0.32, glow(col, 14)], [`translateX(3px) translateY(-6px) scale(1.16)`, 0.4, glow(col, 14)], [`translateX(-3px) translateY(-6px) scale(1.16)`, 0.48], [`translateX(3px) translateY(-4px) scale(1.12)`, 0.56], [`scale(1.04)`, 0.75]], d);
      wpn(r, [[-50, 0.32], [-40, 0.4], [-55, 0.48], [-45, 0.75]], d);
      return { hit: 0, pre: Math.round(d * 0.3) }; },
    cast(r, a, t, f, c) { const d = 420 * f, F = r.face, col = ECOL[c.elem] || '#cfe8ff'; frames(r, [['c2', 0.08], ['cs', 0.3], ['st', 0.52]], d, 0.78);
      mcircle(a, col);
      body2(r, [[`translateY(-10px) scale(1.05)`, 0.35, glow(col)], [`translateX(${7 * F}px) translateY(-3px) rotate(${6 * F}deg)`, 0.55, glow(col, 6)]], d);
      wpn(r, [[-70, 0.35], [48, 0.55, 4], [40, 0.75]], d);
      return { hit: 0, pre: Math.round(d * 0.55) }; },
    sky(r, a, t, f, c) { const d = 520 * f, col = ECOL[c.elem] || '#cfe8ff'; frames(r, [['c2', 0.1]], d, 0.8);
      mcircle(a, col, 120); parts(a, 10, col, 40, d * 1.4, { rise: -70, size: 4 });
      body2(r, [[`translateY(-16px) scale(1.06)`, 0.4, glow(col, 16)], [`translateY(-14px) scale(1.06)`, 0.62, glow(col, 12)]], d);
      wpn(r, [[-45, 0.3, 0], [-45, 0.62]], d);
      return { hit: 0, pre: Math.round(d * 0.4) }; },
    stomp(r, a, t, f, c) { const d = 480 * f, col = ECOL[c.elem] || '#cfe8ff'; frames(r, [['wu', 0.1], ['ft', 0.42]], d, 0.72);
      body2(r, [[`translateY(-14px) scale(.96,1.06)`, 0.3, glow(col)], [`translateY(3px) scale(1.16,.84)`, 0.45], [`scale(1.04,.96)`, 0.6]], d);
      wpn(r, [[-45, 0.3], [100, 0.45], [95, 0.6]], d);
      setTimeout(() => { dust(a, 10); shake(3); }, d * 0.45);
      return { hit: 0, pre: Math.round(d * 0.45) }; },
    bell(r, a, t, f, c) { if (GF() && r.rig) return gfBell(r, a, t, f, c); const d = 400 * f, F = r.face; frames(r, [['cs', 0.08], ['rd', 0.2], ['cs', 0.32], ['rd', 0.44], ['st', 0.6]], d, 0.8);
      body2(r, [[`translateY(-4px)`, 0.24], [`translateY(0)`, 0.48], [`translateX(${6 * F}px) rotate(${5 * F}deg)`, 0.68, glow('#5df0c0', 8)]], d);
      wpn(r, [[-55, 0.12], [-5, 0.24], [-60, 0.36], [-5, 0.48], [35, 0.68, 4], [30, 0.8]], d);
      setTimeout(() => ring(a && { x: a.x + 22 * F, y: a.y - 6 }, '#ffd75a', 50, 300 * f, 2), d * 0.3);
      return { hit: 0, pre: Math.round(d * 0.66) }; },
    bell2(r, a, t, f) { if (GF() && r.rig) return gfBell2(r, a, t, f); const d = 560 * f, F = r.face; frames(r, [['c2', 0.1], ['cs', 0.28], ['c2', 0.46], ['cs', 0.62]], d, 0.78);
      mcircle(a, '#5df0c0', 110);
      body2(r, [[`translateY(-8px) scale(1.04)`, 0.25, glow('#5df0c0', 12)], [`translateY(-10px) scale(1.06)`, 0.6, glow('#5df0c0', 14)]], d);
      wpn(r, [[-65, 0.15], [-25, 0.25], [-70, 0.35], [-25, 0.45], [-70, 0.55], [-45, 0.7]], d);
      [0.2, 0.4, 0.6].forEach(k => setTimeout(() => ring(a && { x: a.x + 18 * F, y: a.y - 14 }, '#ffd75a', 70, 320 * f, 2), d * k));
      return { hit: 0, pre: Math.round(d * 0.5) }; },
    stab(r, a, t, f) { const d = 460 * f, F = r.face; frames(r, [['ds', 0], ['st', 0.24], ['rd', 0.34], ['st', 0.44], ['ft', 0.52]], d, 0.72);
      if (t) { travel(r, a, t, d, 0.26, 0.7, 0.8); ghosts(r, a, t, 0.8, d * 0.09, d * 0.26, 3, '#b98cff'); }
      body2(r, [[`translateX(${-4 * F}px) scale(1.04,.96)`, 0.12], [`translateX(${9 * F}px) scale(1.12,.94)`, 0.3], [`translateX(0)`, 0.4], [`translateX(${11 * F}px) scale(1.14,.92)`, 0.52]], d);
      wpn(r, [[-40, 0.12], [40, 0.3, 7], [10, 0.4], [42, 0.52, 9], [0, 0.7]], d);
      if (t) { setTimeout(() => impact(t, '#d8c8ff', 80), d * 0.3); setTimeout(() => impact(t, '#d8c8ff', 90), d * 0.52); }
      return { hit: Math.round(d * 0.3), pre: 0 }; },
    throw(r, a, t, f) { const d = 380 * f, F = r.face; frames(r, [['wu', 0], ['st', 0.46], ['ft', 0.6]], d, 0.76);
      body2(r, [[`translateX(${-6 * F}px) rotate(${-10 * F}deg) scale(1.04,.96)`, 0.35], [`translateX(${8 * F}px) rotate(${12 * F}deg)`, 0.55]], d);
      wpn(r, [[-140, 0.35], [65, 0.55]], d);
      return { hit: 0, pre: Math.round(d * 0.52) }; },
    vanish(r, a, t, f) { const d = 460 * f, F = r.face; frames(r, [['kn', 0], ['ds', 0.5]], d, 0.8);
      A(r.act, [tf('none', null, { opacity: 1 }), tf(`translateX(${-10 * F}px) scale(.9)`, 0.3, { opacity: 0.08 }), tf(`translateX(${8 * F}px)`, 0.6, { opacity: 0.08 }), tf('none', null, { opacity: 1 })], d);
      ghosts(r, a, a && { x: a.x + 40 * F, y: a.y }, 1, 0, d * 0.5, 3, '#7a4aff');
      return { hit: 0, pre: 0 }; },
    spinthrow(r, a, t, f) { const d = 460 * f, F = r.face, P = 'perspective(260px) '; frames(r, [['wu', 0.1], ['st', 0.45]], d, 0.76);
      A(r.act, [tf(P + 'rotateY(0deg)'), tf(P + `rotateY(${360 * F}deg) translateY(-8px)`, 0.5), tf(P + `rotateY(${360 * F}deg) translateX(${6 * F}px)`, 0.62), tf(P + `rotateY(${360 * F}deg)`)], d);
      wpn(r, [[60, 0.5], [70, 0.62]], d);
      return { hit: 0, pre: Math.round(d * 0.55) }; },
    palm(r, a, t, f) { const d = 440 * f, F = r.face; frames(r, [['rd', 0], ['cs', 0.36]], d, 0.7);
      if (t) travel(r, a, t, d, 0.42, 0.62, 0.76);
      body2(r, [[`translateX(${-5 * F}px) scale(1.05,.95)`, 0.2], [`translateX(${10 * F}px) scale(1.15,.92)`, 0.42, glow('#ffd75a', 10)], [`translateX(${4 * F}px)`, 0.62]], d);
      wpn(r, [[-80, 0.2], [-95, 0.42], [-85, 0.62]], d);
      if (t) setTimeout(() => impact(t, '#ffe58a', 120), d * 0.42);
      return { hit: Math.round(d * 0.42), pre: 0 }; },
    plant(r, a, t, f, c) { const d = 480 * f, col = c.id === 'zhengqi' ? '#9aff8a' : '#ffd75a'; frames(r, [['c2', 0.18]], d, 0.76);
      body2(r, [[`translateY(-6px) scale(1.04)`, 0.3, glow(col, 12)], [`translateY(2px) scale(1.08,.94)`, 0.45, glow(col, 16)], [`scale(1.02)`, 0.7, glow(col, 8)]], d);
      wpn(r, [[-45, 0.3], [-45, 0.7]], d); setTimeout(() => dust(a, 5), d * 0.45);
      return { hit: 0, pre: Math.round(d * 0.3) }; },
    ult(r, a, t, f) { const d = 700 * f, F = r.face; frames(r, [['rd', 0.05], ['wu', 0.2], ['st', 0.45], ['ft', 0.56]], d, 0.82);
      body2(r, [[`translateY(4px) scale(1.12,.86)`, 0.15], [`translateY(-30px) rotate(${-10 * F}deg) scale(1.1)`, 0.35, glow('#fff', 18)], [`translateY(4px) rotate(${10 * F}deg) scale(1.22,.84)`, 0.5, glow('#fff', 10)], [`rotate(${4 * F}deg)`, 0.7]], d);
      wpn(r, [[-30, 0.15], [-170, 0.35], [110, 0.5], [100, 0.7]], d);
      setTimeout(() => { dust(a, 10); }, d * 0.5);
      return { hit: 0, pre: Math.round(d * 0.4) }; },
    gather(r, a, t, f, c) { const d = 600 * f, col = ECOL[c.elem] || '#ff5a3a'; frames(r, [['cs', 0.05]], d, 0.85);
      body2(r, [[`translateY(3px) scale(1.08,.92)`, 0.15, glow(col, 12)], [`translateX(-2px) translateY(3px) scale(1.08,.92)`, 0.3, glow(col, 16)], [`translateX(2px) translateY(3px) scale(1.08,.92)`, 0.45, glow(col, 18)], [`translateX(-2px) translateY(3px) scale(1.08,.92)`, 0.6, glow(col, 18)], [`translateX(2px) translateY(2px) scale(1.06,.94)`, 0.75, glow(col, 14)]], d);
      wpn(r, [[-130, 0.3], [-140, 0.75]], d);
      return { hit: 0, pre: 0 }; },
    quake(r, a, t, f, c) { const d = 620 * f, col = ECOL[c.elem] || '#ff5a3a'; frames(r, [['rd', 0.1], ['st', 0.48]], d, 0.75);
      body2(r, [[`translateY(4px) scale(1.12,.86)`, 0.15], [`translateY(-22px) scale(1.12)`, 0.36, glow(col, 18)], [`translateY(4px) scale(1.26,.8)`, 0.5, glow(col, 10)], [`scale(1.06,.96)`, 0.7]], d);
      wpn(r, [[-160, 0.36], [100, 0.5], [95, 0.7]], d);
      setTimeout(() => { dust(a, 12); shake(6); }, d * 0.5);
      return { hit: 0, pre: Math.round(d * 0.5) }; },
    raise(r, a, t, f, c) { const d = 420 * f, F = r.face, col = ECOL[c.elem] || '#5df0c0'; frames(r, [['cs', 0.1], ['st', 0.52]], d, 0.76);
      mcircle(a, col, 80);
      body2(r, [[`translateY(-8px) scale(1.06)`, 0.4, glow(col, 12)], [`translateX(${5 * F}px) translateY(-3px)`, 0.58, glow(col, 6)]], d);
      wpn(r, [[-70, 0.4], [45, 0.58, 4]], d);
      return { hit: 0, pre: Math.round(d * 0.5) }; },
    pounce(r, a, t, f) { const d = 480 * f, F = r.face;
      travel(r, a, t, d, 0.42, 0.6, 0.82, -42); dust(a, 5);
      body2(r, [[`translateY(3px) scale(1.12,.84)`, 0.14], [`rotate(${-16 * F}deg) scale(.96,1.06)`, 0.3], [`rotate(${12 * F}deg) scale(1.1,.92)`, 0.42], [`rotate(${4 * F}deg)`, 0.6]], d);
      return { hit: Math.round(d * 0.42), pre: 0 }; },
    swoop(r, a, t, f) { const d = 480 * f;
      travel(r, a, t, d, 0.42, 0.6, 0.82, 30);
      body2(r, [[`scaleX(.75) translateY(-3px)`, 0.12], [`scaleX(1.12)`, 0.24], [`scaleX(.75)`, 0.34], [`scaleX(1.15) scaleY(.9)`, 0.42], [`scaleX(.85)`, 0.6]], d);
      return { hit: Math.round(d * 0.42), pre: 0 }; },
    glide(r, a, t, f) { const d = 520 * f;
      travel(r, a, t, d, 0.44, 0.62, 0.8); ghosts(r, a, t, 0.8, d * 0.15, d * 0.44, 3, '#9adcff');
      A(r.act, [tf('none', null, { opacity: 1 }), tf('scale(1.05,.95)', 0.2, { opacity: 0.35 }), tf('scale(1.1)', 0.4, { opacity: 0.35 }), tf('scale(1.14,.9)', 0.46, { opacity: 1 }), tf('none', null, { opacity: 1 })], d);
      return { hit: Math.round(d * 0.46), pre: 0 }; },
    slam(r, a, t, f) { const d = 600 * f;
      travel(r, a, t, d, 0.38, 0.64, 0.7);
      body2(r, [[`translateY(4px) scale(1.14,.86)`, 0.18], [`translateY(-20px) scale(.94,1.08)`, 0.36], [`translateY(3px) scale(1.24,.8)`, 0.48], [`scale(1.06,.96)`, 0.64]], d);
      const hit = Math.round(d * 0.48); setTimeout(() => { impact(t, '#fff', 140); dust(t, 9); shake(5); }, hit);
      return { hit, pre: 0 }; },
    charge(r, a, t, f) { const d = 520 * f, F = r.face;
      travel(r, a, t, d, 0.42, 0.62, 0.82); ghosts(r, a, t, 0.82, d * 0.2, d * 0.42, 3, '#ffb08a');
      body2(r, [[`translateX(${-6 * F}px) rotate(${14 * F}deg)`, 0.22], [`translateX(${4 * F}px) rotate(${16 * F}deg) scale(1.1,.92)`, 0.42], [`rotate(${6 * F}deg)`, 0.62]], d);
      wpn(r, [[45, 0.22], [45, 0.42, 6], [40, 0.62]], d);
      setTimeout(() => dust(a, 7), d * 0.2); setTimeout(() => impact(t, '#fff', 120), d * 0.42);
      return { hit: Math.round(d * 0.42), pre: 0 }; },
    strike(r, a, t, f) { const d = 380 * f, F = r.face;
      travel(r, a, t, d, 0.36, 0.5, 0.5);
      body2(r, [[`translateX(${-4 * F}px) scale(.9,1.1)`, 0.2], [`translateX(${6 * F}px) scale(1.32,.86)`, 0.36], [`scale(1.06,.96)`, 0.5]], d);
      return { hit: Math.round(d * 0.36), pre: 0 }; },
    hop(r, a, t, f) { const d = 540 * f;
      travel(r, a, t, d, 0.42, 0.62, 0.78, 0, 2);
      body2(r, [[`scale(1.06,.94)`, 0.15], [`scale(.98,1.04)`, 0.25], [`scale(1.06,.94)`, 0.33], [`scale(1.12,.9)`, 0.42]], d);
      return { hit: Math.round(d * 0.42), pre: 0 }; },
    flutter(r, a, t, f) { const d = 460 * f;
      travel(r, a, t, d, 0.4, 0.6, 0.78);
      body2(r, [['rotate(-14deg)', 0.1], ['rotate(14deg)', 0.2], ['rotate(-14deg)', 0.3], ['rotate(10deg) scale(1.1)', 0.4], ['rotate(-4deg)', 0.6]], d);
      return { hit: Math.round(d * 0.4), pre: 0 }; },
  };
  function choreo(o, Bt) {
    const u = Bt.units.find(x => x.id === o.actor); if (!u) return { hit: 0, pre: 0 };
    const r = rig(u.id); if (!r || !r.act || !r.el.animate) return { hit: 0, pre: 0 };
    const c = o.cast || {}, f = fac();
    const hitId = c.target && c.target !== u.id ? c.target : (o.pops.find(p => /^\d+$/.test(p[1]) && Bt.units.some(x => x.id === p[0] && x.side !== u.side)) || [])[0];
    const a = pos(u.id), t = hitId && !c.aoe ? pos(hitId) : null;
    const spr = u.kind === 'hero' ? (CLASSES[u.cls] || {}).spr : u.spr;
    const M = MOVES[motionOf(u, c, spr, !!t)] || MOVES.swing;
    const res = M(r, a, t, f, c, u) || { hit: 0, pre: 0 };
    if (u.kind === 'hero' && r.rig) { const mvN = motionOf(u, c, spr, !!t), seq = SKILL_FR[o.ult ? 'ult:' + u.cls : c.id];
      if (seq && !(GF() && !o.ult && (mvN === 'bell' || mvN === 'bell2'))) frames(r, seq, (MOVE_D[mvN] || 480) * f, 0.82);   // 国风：摇铃的姿势由摇铃自己排
      if (GF() && !o.ult && u.cls !== 'necro') gfFlourish(u.cls, mvN, r, a, t, f, res); }
    if (r.act.dataset.mon) { const h0 = res.hit || res.pre || 300 * f, tot = h0 + 280 * f, hk = h0 / tot;   // 首领、稀有精英：蓄力 → 出招 → 收势
      frames(r, [['rd', 0], ['st', Math.max(0.06, hk - 0.14)], ['ft', Math.min(0.92, hk + 0.2)]], tot, 1); }
    else if (r.act.dataset.atk) frames(r, [['atk', 0]], (res.hit || res.pre || 300 * f) + 220 * f, 1);   // 妖物出招图
    return { hit: Math.max(0, Math.round(res.hit)), pre: Math.max(0, Math.round(res.pre)) };
  }
  // 首领登场：从天上砸下来
  function onLand(id) { const p = pos(id); if (!p || RM) return; dust(p, 14); ring(feet(p), '#c8a88a', 220, Math.round(520 * fac()), 4); shake(8); }
  // 打赢了：主角把兵器一举
  function victory(id) {
    const r = rig(id); if (!r || !r.act || RM) return; const d = 900 * fac(), F = r.face; frames(r, [['rd', 0], ['wu', 0.2], ['vi', 0.34]], d, 1.2);
    if (r.rig) later(() => { r.el._busy = Infinity; setPose(r.act, 'vi'); }, d * 1.2);
    body2(r, [[`translateY(3px) scale(1.08,.9)`, 0.12], [`translateY(-18px) scale(.96,1.06)`, 0.32], [`translateY(0) scale(1.06,.94)`, 0.48], [`translateY(-2px)`, 0.7, glow('#ffd75a', 10)]], d, 'ease-out');
    wpn(r, [[-200, 0.32], [-405, 0.48], [-45, 0.7], [-45, 0.95]], d, 'ease-out');
    later(() => { const p = pos(id); if (p) parts(p, 10, '#ffd75a', 50, 800 * fac(), { cls: 'ember', rise: -50 }); }, d * 0.5);
  }
  // 挨打：往后一仰、晃一下；暴击更狠，外加一圈冲击线
  function onHit(id, crit) {
    const r = rig(id); if (!r || !r.act || RM) return;
    const f = fac(), k = (crit ? 1.4 : 1) * 0.45, away = -r.face;   // 2026-11-25 挨打后仰幅度压到原来不到一半（原来 9 像素、暴击 16 像素），看着不晃眼
    if (!(r.el._busy > performance.now())) frames(r, [['ht', 0]], 300 * f, 1);
    A(r.act, [tf('none'), tf(`translate(${(9 * away * k).toFixed(1)}px,${(-2 * k).toFixed(1)}px) rotate(${(7 * away * k).toFixed(1)}deg) scale(.96,1.03)`, 0.25), tf(`translate(${(3 * away * k).toFixed(1)}px,0) rotate(${(2 * away * k).toFixed(1)}deg)`, 0.6), tf('none')], 300 * f, 'ease-out');
    if (crit) impact(pos(id), '#fff3c0', 150);
    const G = GX(), p = pos(id);
    if (G && p) {
      G.whiteFlash(id);
      G.burst(p, { n: crit ? 16 : 7, c0: '#ffffff', c1: crit ? '#ffd23a' : '#ffb07a', speed: crit ? 380 : 240, life: 300, s: 2, shape: 'spark', drag: 3.5, grav: 200, len: 0.045, dir: away > 0 ? 0 : Math.PI, cone: 2.2 });
      if (crit) { G.glow(p, '#fff3c0', 70, 220); const t = performance.now(); if (speed < 2 && t - (onHit.hs || 0) > 1200) { onHit.hs = t; G.hitstop(60); } }   // 顿帧：普通的一下不再停（原来每一下都把全场动画停 28 毫秒，一秒十几下，画面一卡一卡）；暴击一倍速才停，1.2 秒最多一次
    }
  }
  // 返回命中延迟（毫秒）：有飞行物时，伤害数字等飞到再出现
  function play(o, B) {
    if (!o || !arena || !layer) return 0;
    const cr = o.actor && !RM ? choreo(o, B) : { hit: 0, pre: 0 };
    const off = cr.hit + cr.pre; lastMv = off; OFF = off;   // 近战：等刀落下再出特效；术法：等起手做完再放
    LOUD = !!o.ult;
    try { return body(o, B, 0) + off; } finally { OFF = 0; LOUD = false; }
  }
  function body(o, B, mv) {
    const f = fac(), T = Math.round(200 * f), D = Math.round(440 * f), G = Math.round(760 * f);
    const c = o.cast; if (!c) return mv;
    const dl = (fn) => mv ? later(fn, mv) : fn();
    const actor = B.units.find(u => u.id === o.actor);
    const ap = o.actor ? pos(o.actor) : null;
    const hitIds = [...new Set(o.pops.filter(p => /^\d+$/.test(p[1])).map(p => p[0]))];
    const unitOf = id => B.units.find(u => u.id === id);
    const foeIds = hitIds.filter(id => { const u = unitOf(id); return u && actor && u.side !== actor.side; });
    const fps = foeIds.map(pos).filter(Boolean);
    const tp = c.target ? pos(c.target) : fps[0];
    const col = COL[c.elem] || '#fff';
    const R = actor && actor.runes ? actor.runes[c.id] : null;
    const R1 = (R === 'a'), R2 = (R === 'b');
    const heroP = pos('P');

    // ---- Ngoc ----
    switch (c.id) {
      case 'ngocHeal': {
        const hp2 = tp || heroP;
        if (ap && hp2) { proj('potion', ap, hp2, T, '#ff9ac0'); later(() => { ring(hp2, '#ff9ac0', 90, D, 3); parts(hp2, 8, '#ffb3c8', 30, D * 1.3, { cls: 'heart', rise: -50, size: 9 }); }, T); return T; }
        return 0; }
      case 'foxHeal': {
        const hp3 = tp || heroP;
        if (hp3) { ring(hp3, '#ffe0f0', 120, D, 3); flames(hp3, 10, '#ffd0e8', 40, D * 1.4); parts(hp3, 6, '#fff', 30, D * 1.3, { cls: 'heart', rise: -50, size: 8 }); }
        return 0; }
      case 'foxfire':
        if (ap && tp) { proj('foxfire', ap, tp, T, '#9ad8ff'); later(() => { boom(tp, '#9ad8ff', 60, D * 0.8); flames(tp, 6, '#cfe8ff', 26, D); }, T); return T; }
        return 0;
      case 'foxfireAll':
        if (ap) { glyph(ap, '狐', '#ffb3d8', 64, G, -40); fps.forEach((p, i) => later(() => proj('foxfire', ap, p, T, '#9ad8ff'), i * 30)); }
        later(() => fps.forEach(p => { boom(p, '#9ad8ff', 70, D); flames(p, 5, '#cfe8ff', 30, D); }), T + 60);
        return T + 60;
      case 'kangGuard':
        if (heroP) { ring(heroP, '#ffd75a', 110, D, 3); glyph(heroP, '挡', '#ffe9a0', 60, G, -40); }
        return 0;
      case 'liuChant':
        if (heroP) { ring(heroP, '#ffe7a0', 130, D, 3); glyph(heroP, '佛', '#fff2b0', 60, G, -40); }
        return 0;
      case 'tieBolt':
        if (heroP) { ring(heroP, '#d8a05a', 110, D, 3); glyph(heroP, '固', '#ffd08a', 60, G, -40); }
        return 0;
      case 'tieGun':
        if (ap) { const ts3 = c.aoe ? fps : tp ? [tp] : []; ts3.forEach((p, i) => later(() => proj('foxfire', ap, p, T, '#ff7a3a'), i * 30)); later(() => ts3.forEach(p => { boom(p, '#ff7a3a', 60, D * 0.8); flames(p, 5, '#ffb070', 26, D); }), T); return T; }
        return 0;
      case 'potionThrow':
        if (ap && tp) { proj('potion', ap, tp, T, '#7fe05a'); later(() => { boom(tp, '#7fe05a', 56, D * 0.8); parts(tp, 8, '#7fe05a', 30, D, { cls: 'bub', rise: -30 }); }, T); return T; }
        return 0;
    }

    // ---- 新技能和同伴：按五行出效果 ----
    if (c.id === 'gen' || ['blade2', 'chain2', 'zhengjue', 'zhengqi', 'leiCut', 'leiFinish', 'liuBell'].includes(c.id)) {
      const w = c.wx, wc = w ? WX[w].c : '#fff', ts2 = c.aoe ? fps : tp ? [tp] : [];
      if (c.id === 'zhengqi') { if (heroP) { ring(heroP, '#9aff8a', 120, D, 3); glyph(heroP, '正', '#c8ffb0', 60, G, -40); } return 0; }
      const fx = p => {
        if (w === 'jin') { slash(p, '#fff6c0', -30, 90, D); slash(p, wc, 30, 70, D * 0.8); }
        else if (w === 'mu') { parts(p, 10, wc, 40, D, { cls: 'petal' }); boom(p, wc, 60, D * 0.7); }
        else if (w === 'shui') { ring(p, wc, 90, D, 4); parts(p, 8, '#dff4ff', 34, D, { cls: 'shard' }); }
        else if (w === 'huo') { boom(p, wc, 90, D); flames(p, 8, '#ffb02a', 40, D); }
        else if (w === 'tu') { boom(p, '#7a5a3a', 90, D); parts(p, 10, '#a07a50', 46, D, { cls: 'ash', rise: -10, size: 9 }); }
      };
      if (c.aoe && w === 'tu') shake(6);
      if (!c.aoe && ap && tp && (w === 'mu' || w === 'shui' || w === 'huo') && c.id !== 'blade2') { proj('ghostorb', ap, tp, T, wc); later(() => fx(tp), T); return T; }
      dl(() => ts2.forEach((p, i) => later(() => fx(p), i * 40)));
      return mv;
    }
    // ---- 秘技 ----
    if (c.id === 'ult') {
      const W = arena.clientWidth, H = arena.clientHeight, mid = { x: W * 0.62, y: H * 0.45 }, foes = fps.length ? fps : [mid];
      if (c.cut) { inkWash(INK); glyphF(mid, ULTS.cutG || '断', '#ffd86a', 150, G * 1.2); shake(7, 1); return Math.round(T * 0.5); }   // 自动出招：只打断蓄力
      inkWash(c.combo ? '#2a0a1a' : INK);
      const UG = (ULTS[c.cls] || {}).g;   // 2026-11-24 秘技改成职业增益：大字跟着新招名
      switch (c.cls) {
        case 'berserker': spawn('bigslash', mid.x, mid.y, G, { c: '#ff3a2a' }); foes.forEach((p, i) => later(() => { slash(p, '#fff', -30, 130, D); ink(p, 10, 70, D, BLOOD); }, i * 50)); gfU('berserker', mid, foes, G) || glyphF(mid, UG, '#ff3a2a', 170, G * 1.4); shake(12, 1); break;
        case 'mage': foes.forEach((p, i) => later(() => { bolt([{ x: p.x + (Math.random() - 0.5) * 60, y: 0 }, p], '#b8a8ff', D); boom(p, '#e6e0ff', 90, D); }, i * 90)); gfU('mage', mid, foes, G) || glyphF(mid, UG, '#e6e0ff', 170, G * 1.4); shake(10, 1); break;
        case 'necro': foes.forEach((p, i) => { for (let k = 0; k < 2; k++) sprite({ x: -30, y: p.y + (k ? 18 : -18) }, SPR.img('ghost', 44, { W: '#cfe8e0', B: GHOST }), G, 'sweep', { dx: (W + 60) + 'px', dl: (i * 50 + k * 100) + 'ms' }); flames(p, 8, GHOST, 50, G); });
          if (GF()) { const hp = pos('P'); fus(hp, 6, G); if (hp) { spawn('yinwave', hp.x, hp.y + hp.h * 0.44, G * 0.8, { c: MING, s: '460px' }); spawn('yinwave', hp.x, hp.y + hp.h * 0.44, G, { c: '#d8fff4', s: '620px' }); } later(() => zombieHop(Math.round(420 * fac()), 14), 120); }   // 国风样板：大字已经在特写里出过，这里换成铃音荡开、黄符飘起、群尸齐跳
          else glyphF(mid, UG, GHOST, 170, G * 1.4);
          shake(8, 1); break;
        case 'assassin': { const p = foes[0]; for (let k = 0; k < 7; k++) later(() => { slash(p, k % 2 ? '#fff' : BLOOD, Math.random() * 180, 90, D * 0.6); ink(p, 3, 40, D, BLOOD); }, k * 70); seal(p, '杀', G * 1.6); gfU('assassin', mid, foes, G) || glyphF(mid, UG, '#ff3a3a', 150, G * 1.2); shake(8, 1); break; }
        case 'paladin': spawn('palm', mid.x, mid.y, G, { c: GOLD, s: '200px' }); foes.forEach(p => { pillar(p, GOLD, G); boom(p, GOLD, 120, D); }); gfU('paladin', mid, foes, G) || glyphF(mid, UG, GOLD, 170, G * 1.4); spawn('swastika', mid.x, mid.y, G * 1.4, { c: GOLD }); shake(10, 1); break;
      }
      if (c.combo) { const ap2 = pos('NG'); if (ap2) foes.forEach((p, i) => later(() => proj('foxfire', ap2, p, T, '#9ad8ff'), 200 + i * 40)); glyphF({ x: W * 0.3, y: H * 0.35 }, '狐', '#ffb3d8', 110, G * 1.3); }
      return Math.round(T * 0.7);
    }
    // ---- 敌人 ----
    if (c.enemy) {
      const bossA = !!(actor && actor.kind === 'boss');   // 首领的大招才盖大字
      switch (c.id) {
        case 'charge':
          if (ap) { ring(ap, '#ff3a2a', 160, G, 6); (bossA ? glyphF : glyph)(ap, '蓄', '#ff5a3a', 70, G, -50); parts(ap, 14, '#ff5a3a', 70, G, { dir: -Math.PI / 2, cone: 2.5, rise: -20 }); }
          return 0;
        case 'bossAoe': {
          const al = B.units.filter(u => u.side === 'p' && u.hp > 0).map(u => pos(u.id)).filter(Boolean);
          if (al.length) spawn('wave', arena.clientWidth / 2, al[0].y, D, { c: col });
          al.forEach(p => { boom(p, col, 90, D); parts(p, 10, col, 50, D, { cls: c.elem === 'fire' ? 'flame' : c.elem === 'cold' ? 'shard' : '' }); });
          if (ap) (bossA ? glyphF : glyph)(ap, { fire: '焚', cold: '冻', light: '雷', poison: '毒', magic: '煞' }[c.elem] || '煞', col, 70, G, -30);
          shake(7); return Math.round(T * 0.6);
        }
        case 'summon': {
          if (ap) { spawn('ink-circle', ap.x, ap.y + 30, D * 1.6, { c: GHOST }); (bossA ? glyphF : glyph)(ap, '召', GHOST, 54, G, -40); }
          B.units.filter(u => u.side === 'e' && u.kind === 'minion' && u.hp > 0).slice(-3).forEach(u => { const p = pos(u.id); if (p) flames(p, 5, GHOST, 24, D); });
          return 0;
        }
        case 'web':
          if (heroP) { spawn('web', heroP.x, heroP.y, G * 1.4, null); }
          if (ap && heroP) proj('thread', ap, heroP, T, '#e8e8e8');
          return T;
        case 'bossHeal':
          if (ap) { ring(ap, '#7fe05a', 130, D, 4); parts(ap, 10, '#9aff8a', 40, D * 1.3, { cls: 'plus', rise: -60 }); }
          return 0;
        case 'roar':
          if (ap) { ring(ap, BLOOD, 260, D * 1.2, 8); ring(ap, '#ff8a4a', 160, D, 4); (bossA ? glyphF : glyph)(ap, '吼', '#ff5a3a', 80, G, -20); }
          shake(8); return 0;
        case 'enrage':
          if (ap) { boom(ap, BLOOD, 200, G); (bossA ? glyphF : glyph)(ap, '怒', '#ff3a2a', 100, G * 1.2); ink(ap, 12, 90, G, BLOOD); }
          shake(9); return Math.round(T * 0.6);
        case 'phase':
          if (ap) { inkWash(); boom(ap, '#5a0a2a', 260, G); (bossA ? glyphF : glyph)(ap, '魔', '#ff3a5a', 110, G * 1.4); ink(ap, 18, 120, G, '#2a0a14'); }
          shake(12); return Math.round(T * 0.8);
      }
      if (!tp || !ap) return mv;
      if (c.elem === 'phys' || !c.elem) { dl(() => { spawn('claw', tp.x, tp.y, D, { c: '#ff4a3a', rot: (Math.random() * 40 - 20) + 'deg' }); ink(tp, 4, 24, D, BLOOD); }); return mv; }
      const ec = c.elem === 'magic' ? GHOST : col;
      proj('ghostorb', ap, tp, T, ec); later(() => { boom(tp, ec, 54, D * 0.8); parts(tp, 6, ec, 30, D, { cls: c.elem === 'fire' ? 'flame' : '' }); }, T);
      return T;
    }

    // ---- 召唤物（行尸 / 鬼卒） ----
    if (actor && actor.kind === 'minion') {
      if (!tp) return 0;
      if (speed >= 2) return actor.ae === 'magic' ? T : mv;   // 2026-11-25 省电：两倍速以上僵尸、鬼卒出手不画爪痕和鬼火（赶尸人一场下来出手最多，手机最烫）
      if (actor.ae === 'magic' && ap) { proj('ghostorb small', ap, tp, T, GHOST); later(() => boom(tp, GHOST, 36, D * 0.6), T); return T; }
      dl(() => spawn('claw', tp.x, tp.y, D * 0.8, { c: '#9ab89a', rot: (Math.random() * 40 - 20) + 'deg' })); return mv;
    }

    // ---- 主角武学 ----
    switch (c.id) {
      // 狂刀客
      case 'slash':
        if (tp) dl(() => { slash(tp, '#fff', -30, 90, D); later(() => slash(tp, '#ffb08a', 20, 70, D * 0.8), 90); later(() => slash(tp, '#fff', 60, 80, D * 0.8), 180); ink(tp, 5, 40, D, BLOOD); });
        return mv;
      case 'whirl':
        if (ap) { spawn('spin', ap.x, ap.y, D, { c: R1 ? '#ff5a4a' : '#f0e6d0' }); ring(ap, '#f0e6d0', 140, D, 5); }
        fps.forEach((p, i) => { slash(p, '#fff', i * 60 - 40, 76, D); ink(p, 3, 30, D, BLOOD); });
        if (R1 && ap) parts(ap, 8, '#ff3a2a', 40, D, { rise: -30 });
        if (R2) shake(4);
        return 0;
      case 'warcry':
        if (ap) { ring(ap, '#ff5a3a', 280, D * 1.2, 8); ring(ap, '#ffb066', 160, D, 4); glyph(ap, '吼', '#ff7a3a', 96, G); }
        if (R1) B.units.filter(u => u.side === 'e' && u.hp > 0).forEach(u => ring(pos(u.id), '#ff3a3a', 60, D));
        shake(6); return 0;
      case 'bloodlust':
        if (tp) { slash(tp, BLOOD, -20, 120, D); slash(tp, '#fff', 25, 80, D); glyph(tp, '斩', '#ff3a2a', 100, G); ink(tp, 12, 70, D * 1.2, BLOOD);
          if (ap) parts(tp, 12, '#e0302a', Math.hypot(ap.x - tp.x, ap.y - tp.y), D * 1.3, { dir: Math.atan2(ap.y - tp.y, ap.x - tp.x), cone: 0.5, size: 6, cls: 'ink' }); }
        shake(5); return 0;
      // 五行道士
      case 'missile':
        if (ap && tp) { proj('fu', ap, tp, T, GOLD, FU()); later(() => { boom(tp, GOLD, 50, D * 0.7); parts(tp, 6, '#fff2b0', 26, D, { cls: 'paper' }); }, T); return T; }
        return 0;
      case 'fireball':
        if (!ap) return 0;
        if (R1) { fps.forEach(p => proj('fu burning', ap, p, T, COL.fire, FU())); later(() => fps.forEach(p => { boom(p, COL.fire, 64, D); flames(p, 5, '#ffb02a', 30, D); }), T); return T; }
        if (tp) { proj('fu burning', ap, tp, T, COL.fire, FU()); later(() => { boom(tp, COL.fire, R2 ? 150 : 100, D); flames(tp, 10, '#ffb02a', 50, D); parts(tp, 5, '#3a2a20', 40, D, { cls: 'ash', rise: -40 }); if (R2) fps.forEach(p => boom(p, COL.fire, 50, D)); shake(3); }, T); return T; }
        return 0;
      case 'frostnova':
        if (ap) { ring(ap, '#8fd8ff', 420, D * 1.2, 10); ring(ap, '#ffffff', 260, D, 3); glyph(ap, '冰', '#bfeaff', 90, G, -30); }
        fps.forEach(p => { parts(p, 8, '#cfefff', 30, D, { cls: 'shard' }); if (R2) slash(p, '#8fd8ff', 90, 60, D); });
        return 0;
      case 'chain':
        if (ap && fps.length) { glyph(ap, '雷', '#e6e0ff', 70, G, -50); bolt([{ x: ap.x, y: 0 }, ap, ...fps], '#b8a8ff', D * 0.9); fps.forEach(p => boom(p, '#e6e0ff', 50, D * 0.6)); shake(3); }
        return 0;
      case 'meteor': {
        const mc = R1 ? '#8fd8ff' : COL.fire;
        if (ap) glyph({ x: arena.clientWidth / 2, y: arena.clientHeight * 0.4 }, '火', mc, 140, G * 1.3);
        fps.forEach((p, i) => spawn('meteor', p.x, p.y, T * 1.6, { c: mc, dl: i * 40 + 'ms' }));
        later(() => { fps.forEach(p => { boom(p, mc, R2 ? 150 : 120, D); flames(p, 8, mc, 60, D); }); shake(R2 ? 10 : 8); }, T * 1.6);
        return Math.round(T * 1.6);
      }
      // 赶尸人
      case 'bonespear':
        if (ap && tp) { proj('nail', ap, tp, T, GHOST); later(() => { boom(tp, GHOST, 44, D * 0.6); flames(tp, 5, GHOST, 26, D); }, T); return T; }
        return 0;
      case 'summon': {
        const al = B.units.filter(u => u.side === 'p' && u.kind === 'minion');
        const p = al.length ? pos(al[al.length - 1].id) : ap;
        if (ap) spawn('bell', ap.x, ap.y - ap.h * 0.7, D * 1.6, { c: GOLD });
        if (p) { spawn('ink-circle', p.x, p.y + 20, D * 1.4, { c: R1 ? '#b98cff' : R2 ? '#ffb02a' : GHOST }); flames(p, 8, GHOST, 30, D * 1.3); }
        return 0;
      }
      case 'curse': {
        B.units.filter(u => u.side === 'e' && u.hp > 0).forEach(u => { const p = pos(u.id); if (!p) return;
          sprite(p, SPR.img('fu', 30, { R: R1 ? '#7a4aff' : '#c4291f' }), D * 1.5, 'stick');
          sprite(p, SPR.img('wisp', 28, { G: GHOST }), D * 1.3, 'curse'); });
        if (ap) glyph(ap, '摄', GHOST, 64, G, -40);
        return 0;
      }
      case 'corpse':
        fps.forEach(p => { boom(p, '#4a6a2a', 110, D); boom(p, '#7fe05a', 60, D * 0.8); ink(p, 10, 60, D, '#2a3a14'); parts(p, 8, '#7fe05a', 50, D, { cls: 'bub', rise: -20 }); });
        shake(5); if (R2 && ap) parts(ap, 8, '#ff5a5a', 30, D, { rise: -30 });
        return 0;
      case 'bonestorm': {
        inkWash('#04140f');
        const W = arena.clientWidth;
        fps.forEach((p, i) => { for (let k = 0; k < 2; k++) sprite({ x: -30, y: p.y + (k ? 20 : -20) }, SPR.img('ghost', 40, { W: '#cfe8e0', B: GHOST }), G, 'sweep', { dx: (W + 60) + 'px', dl: (i * 60 + k * 120) + 'ms' }); flames(p, 6, GHOST, 40, G); });
        glyph({ x: W / 2, y: arena.clientHeight * 0.45 }, '鬼', GHOST, 130, G * 1.3);
        return 0;
      }
      // 夜行刺客
      case 'twin':
        if (mv) { later(() => play({ ...o, actor: null }, B), mv); return mv; }
        foeIds.forEach(id => { const p = pos(id); slash(p, '#e8e8ff', -45, 70, D * 0.6); later(() => { slash(p, '#e8e8ff', 45, 70, D * 0.6); ink(p, 3, 26, D, BLOOD); }, D * 0.25); });
        return 0;
      case 'venom':
        if (!ap) return 0;
        (R2 ? fps : tp ? [tp] : []).forEach(p => proj('dart', ap, p, T, COL.poison));
        later(() => (R2 ? fps : tp ? [tp] : []).forEach(p => { parts(p, 8, COL.poison, 26, D * 1.3, { rise: -30, cls: 'bub' }); boom(p, COL.poison, 44, D * 0.6); }), T);
        return T;
      case 'shadowstep':
        if (ap) { sprite(ap, SPR.img(actor.spr, 76, { N: '#111', R: '#3a3a3a', B: '#222' }), D * 1.4, 'after'); ink(ap, 14, 60, D); }
        if (R1 && tp) { slash(tp, '#b98cff', -40, 90, D); slash(tp, '#fff', 40, 60, D); }
        return 0;
      case 'fan':
        if (!ap || !fps.length) return 0;
        fps.forEach((p, i) => { proj('star', ap, p, T, '#e0e0f0'); later(() => proj('star', ap, p, T, '#e0e0f0'), 40); });
        parts(ap, 10, '#ff9ac0', 80, D * 1.5, { cls: 'petal', rise: 20 });
        later(() => fps.forEach(p => { slash(p, '#fff', Math.random() * 180, 50, D * 0.6); parts(p, 4, '#ff9ac0', 30, D, { cls: 'petal' }); }), T + 40);
        return T + 40;
      case 'deathmark':
        if (tp) { slash(tp, BLOOD, -35, 110, D); seal(tp, '杀', G * 1.4); ink(tp, 8, 50, D, BLOOD); shake(4); }
        return 0;
      // 金刚武僧
      case 'holy':
        if (tp) { spawn('palm', tp.x, tp.y, D, { c: GOLD }); boom(tp, GOLD, 60, D * 0.7); }
        return 0;
      case 'aegis':
        if (ap) { spawn('goldbell', ap.x, ap.y, D * 1.8, { c: GOLD }); parts(ap, 10, '#fff2b0', 50, D, { rise: -20 }); }
        return 0;
      case 'prayer':
        if (ap) { ring(ap, '#ffe58a', 140, D, 3); ['般', '若', '心', '经'].forEach((ch, i) => spawn('sutra', ap.x + (i - 1.5) * 26, ap.y, G * 1.3, { dl: i * 80 + 'ms' }, ch)); parts(ap, 10, '#b8ffb0', 40, D * 1.3, { rise: -60, cls: 'plus' }); }
        fps.forEach(p => pillar(p, COL.holy, D));
        return 0;
      case 'hammer': {
        const ts = fps.length ? fps : tp ? [tp] : [];
        ts.forEach(p => spawn('hammer', p.x, p.y, T * 1.5, { c: GOLD }));
        later(() => { ts.forEach(p => { boom(p, GOLD, R2 ? 130 : 100, D); ring(p, '#fff', 90, D, 3); }); shake(R2 ? 8 : 6); }, T * 1.5);
        return Math.round(T * 1.5);
      }
      case 'judgement':
        glyph({ x: arena.clientWidth / 2, y: arena.clientHeight * 0.45 }, '佛', GOLD, 150, G * 1.4);
        spawn('swastika', arena.clientWidth / 2, arena.clientHeight * 0.45, G * 1.4, { c: GOLD });
        fps.forEach((p, i) => later(() => { pillar(p, COL.holy, D); boom(p, GOLD, 110, D); }, i * 40));
        shake(7); return 0;
      case 'phoenix':
        if (ap) { ring(ap, COL.fire, 380, D * 1.3, 12); boom(ap, '#ffb02a', 200, D); glyph(ap, '凤', '#ffb02a', 110, G); }
        fps.forEach(p => { boom(p, COL.fire, 100, D); flames(p, 6, '#ffb02a', 40, D); }); shake(9);
        return 0;
    }
    return mv;
  }
  // 化为飞灰：墨点四散 + 纸灰上飘
  function onDeath(id, kind) {
    const p = pos(id); if (!p) return 0;
    { const r0 = rig(id); if (r0 && r0.rig) { (r0.el._ft || []).forEach(clearTimeout); r0.el._busy = Infinity; setPose(r0.act, 'kn'); ink(p, 6, 40, Math.round(700 * fac())); return Math.round(500 * fac()); } }
    const D = Math.round(700 * fac()), big = kind === 'boss';
    const G = GX(), el = document.getElementById('u-' + id);
    if (G && el) {
      if (big) { const t = G.bossDeath(el, p); later(() => glyph(p, '灭', '#f1e2c6', 120, Math.round(1100 * fac()), 0, true), t * 0.55); shake(10, 1); return t; }
      ink(p, kind === 'elite' ? 10 : 6, 50, D);
      G.disintegrate(el, { n: kind === 'elite' ? 260 : 170, dirx: el.closest('#foes') ? 1 : -1 });
      if (kind === 'goblin') parts(p, 16, '#f1c94a', 70, D, { cls: 'coin', size: 7 });
      if (kind === 'elite' || el.classList.contains('rare')) later(() => G.beam(feet(p), el.classList.contains('rare') ? '#ffd75a' : '#ffb04a', 1700), 380 * fac());
      return Math.round(560 * fac());
    }
    ink(p, big ? 26 : 10, big ? 110 : 50, D);
    parts(p, big ? 20 : 8, '#5a4e46', big ? 80 : 40, D * 1.4, { cls: 'ash', rise: -60, size: 7 });
    if (kind === 'goblin') parts(p, 16, '#f1c94a', 70, D, { cls: 'coin', size: 7 });
    if (big) { boom(p, BLOOD, 240, D); glyph(p, '灭', '#f1e2c6', 120, Math.round(1100 * fac()), 0, true); shake(10, 1); }
  }
  function onHeal(id) { const p = pos(id); if (p) parts(p, 6, '#7fff9a', 26, 520 * fac(), { rise: -40, cls: 'plus', size: 6 }); }
  // ======== 连招：每一种都有自己的组合特效 ========
  const foesAlive = () => [...document.querySelectorAll('#foes .unit:not(.dead)')].map(e => pos(e.id.slice(2))).filter(Boolean);
  function spikes(p, n, c, c2, size) { if (!p) return; const F = feet(p);
    for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; spawn('spike', F.x + k * (size * 0.42), F.y + Math.abs(k) * 2, Math.round((520 + i * 40) * fac()), { c, c2: c2 || '#ffffff', s: (size * (1 - Math.abs(k) * 0.16)).toFixed(0) + 'px', rot: (k * 9).toFixed(0) + 'deg', dl: Math.abs(k) * 40 + 'ms' }); } }
  function cracks(p, c, size) { if (!p) return; const R = size / 2; let d = '';
    for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI * 2 + Math.random() * 0.5; let x = 0, y = 0; d += `M0,0`;
      for (let k = 1; k <= 3; k++) { const rr = R * k / 3, aa = a0 + (Math.random() - 0.5) * 0.6; x = Math.cos(aa) * rr; y = Math.sin(aa) * rr; d += ` L${x.toFixed(1)},${y.toFixed(1)}`; } }
    spawn('cracks', p.x, p.y, Math.round(620 * fac()), { s: size + 'px', c }, `<svg viewBox="${-R} ${-R} ${size} ${size}"><path d="${d}" stroke="${c}" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="#fff" stroke-width="1" fill="none"/></svg>`); }
  const iceshell = (p, size) => p && spawn('iceshell', p.x, p.y, Math.round(520 * fac()), { s: (size || 90) + 'px' });
  // 连招、金刚震的横幅放在中线下面（主角团那半边），上半区只留妖物和伤害数字
  const bannerY = () => { const ln = document.getElementById('bline'), b = ln ? parseFloat(ln.style.bottom) : NaN; return isNaN(b) ? arena.clientHeight * 0.58 : arena.clientHeight - b + 18; };
  const banner = (name, c, c2, lab) => arena && spawn('cbanner', arena.clientWidth / 2, bannerY(), Math.round(1100 * fac()), { c, c2: c2 || c }, `<small>${lab || '连招'}</small><b>${name}</b>`);
  const REACT_FX = {
    破军(p) { slash(p, '#fff', -45, 130, 360 * fac()); slash(p, '#d8a05a', 45, 130, 360 * fac()); parts(p, 16, '#d8a05a', 80, 700 * fac(), { cls: 'shard', size: 8 }); cracks(p, '#d8a05a', 120); },
    饮火(p) { flames(p, 14, '#ff6a2a', 50, 800 * fac()); pillar(p, '#ff3a1a', 700 * fac()); ink(p, 10, 70, 700 * fac(), BLOOD); boom(p, '#ff6a2a', 140, 500 * fac()); },
    断骨(p) { cracks(p, '#cfefff', 140); impact(p, '#ffffff', 170); parts(p, 12, '#cfefff', 60, 600 * fac(), { cls: 'shard' }); },
    碎冰(p) { iceshell(p, 100); later(() => { parts(p, 22, '#cfefff', 100, 750 * fac(), { cls: 'shard', size: 8 }); ring(p, '#ffd75a', 160, 500 * fac(), 4); boom(p, '#ffffff', 120, 350 * fac()); }, 260 * fac()); },
    雷火(p) { bolt([{ x: p.x + (Math.random() - 0.5) * 40, y: 0 }, p], '#ffe08a', 420 * fac()); later(() => { boom(p, '#ff6a2a', 170, 520 * fac()); flames(p, 12, '#ffb02a', 70, 800 * fac()); }, 120 * fac()); },
    焚城(p) { foesAlive().forEach((q, i) => later(() => { spawn('meteor', q.x, q.y, 320 * fac(), { c: '#ff6a2a' }); later(() => { boom(q, '#ff6a2a', 160, 520 * fac()); parts(q, 8, '#3a2a20', 60, 900 * fac(), { cls: 'ash', rise: -50 }); }, 320 * fac()); }, i * 60)); },
    引爆(p) { sprite(p, SPR.img('fu', 34, { R: '#ff3a1a' }), 300 * fac(), 'stick'); later(() => { ring(p, '#ff8a3a', 260, 600 * fac(), 8); boom(p, '#fff3c0', 200, 500 * fac()); flames(p, 14, '#ff6a2a', 90, 800 * fac()); shake(8); }, 280 * fac()); },
    尸火(p) { const all = foesAlive(); all.forEach(q => { if (q !== p) bolt([p, q], '#5df07a', 380 * fac()); later(() => flames(q, 8, '#5df07a', 40, 800 * fac()), 160 * fac()); }); boom(p, '#2a6a2a', 160, 500 * fac()); },
    蚀骨(p) { parts(p, 16, '#8fe05a', 50, 900 * fac(), { cls: 'bub', rise: -40 }); sprite(p, SPR.img('skeleton', 46, { W: '#c8f0a0', R: '#5df07a' }), 700 * fac(), 'curse'); boom(p, '#5a9a2a', 110, 500 * fac()); },
    冰葬(p) { spikes(p, 5, '#a07a50', '#e8d8b8', 60); later(() => { iceshell(p, 96); later(() => parts(p, 20, '#cfefff', 90, 700 * fac(), { cls: 'shard', size: 8 }), 220 * fac()); }, 160 * fac()); shake(6); },
    追刺(p) { for (let k = 0; k < 5; k++) later(() => { slash(p, k % 2 ? '#b98cff' : '#fff', k * 37 - 70, 100, 260 * fac()); impact(p, '#d8c8ff', 80); }, k * 60 * fac()); },
    火上浇油(p) { parts(p, 14, '#ff9ac0', 70, 500 * fac(), { cls: 'petal' }); later(() => { ring(p, '#ff6a2a', 200, 520 * fac(), 6); flames(p, 16, '#ffb02a', 80, 900 * fac()); boom(p, '#ff6a2a', 150, 480 * fac()); }, 200 * fac()); },
    冰刺(p) { spikes(p, 5, '#8fd8ff', '#ffffff', 70); impact(p, '#cfefff', 160); later(() => parts(p, 14, '#cfefff', 70, 600 * fac(), { cls: 'shard' }), 200 * fac()); shake(5); },
    趁虚(p) { inkWash('#1a0408'); slash(p, BLOOD, -35, 170, 420 * fac()); seal(p, '杀', 900 * fac()); ink(p, 12, 90, 700 * fac(), BLOOD); },
    寒拳(p) { spawn('palm', p.x, p.y, 520 * fac(), { c: '#9ad8ff' }); later(() => { ring(p, '#cfefff', 180, 520 * fac(), 5); parts(p, 14, '#cfefff', 70, 650 * fac(), { cls: 'shard' }); }, 160 * fac()); },
    伏魔(p) { pillar(p, GOLD, 800 * fac()); spawn('swastika', p.x, p.y, 900 * fac(), { c: GOLD }); later(() => { boom(p, GOLD, 170, 520 * fac()); cracks(p, '#ffd75a', 140); }, 220 * fac()); },
    明王(p) { const h = pos('P'); if (h) { spawn('palm', h.x, h.y - 20, 900 * fac(), { c: GOLD, s: '170px' }); ring(h, GOLD, 220, 700 * fac(), 5); parts(h, 14, '#fff2b0', 60, 900 * fac(), { cls: 'plus', rise: -60 }); } boom(p, GOLD, 120, 420 * fac()); },
  };
  function onReact(id, name, c) {
    const p = pos(id); if (!p) return;
    const f = fac(), fx = REACT_FX[name];
    banner(name, c);   // 连招名只在顶上横幅出现一次
    if (fx) fx(p); else { ring(p, c, 120, Math.round(500 * f), 5); boom(p, '#fff', 70, Math.round(300 * f)); }
    parts(p, 10, c, 60, 700 * f, { cls: 'ember', rise: -40 });
    shake(5);
  }
  // 金刚震：和尚攒满「震」，佛光从身上炸开扫过全场（一阵子才一次，特效可以足一点）
  function onJinzhen() {
    const h = pos('P'); if (!h) return; const f = fac();
    banner('金刚震', GOLD, '#fff2b0', '反震');
    spawn('swastika', h.x, h.y, Math.round(800 * f), { c: GOLD }); ring(h, GOLD, 300, Math.round(650 * f), 6);
    foesAlive().forEach((q, i) => later(() => { boom(q, GOLD, 110, Math.round(420 * f)); parts(q, 6, '#fff2b0', 50, 600 * f, { cls: 'ember', rise: -30 }); }, (120 + i * 50) * f));
    shake(5);
  }
  function onBlock(id) { const p = pos(id); if (p) { ring(p, GOLD, 70, 300 * fac(), 3); } }
  function onCrit(id) { const p = pos(id); if (p) { boom(p, '#fff6c0', 80, 280 * fac()); ink(p, 4, 40, 400 * fac(), BLOOD); shake(3); } }
  // 克制道具生效：道具从主角身上飞出去，金色「破」字落在妖物身上
  function onFoil(id, icon) {
    const p = pos(id), h = pos('P'); if (!p) return 0;
    const f = fac(), T = Math.round(420 * f);
    if (h && icon) proj('keyfly', h, p, T, GOLD, icon);
    setTimeout(() => { glyphF(p, '破', GOLD, 130, Math.round(1100 * f)); ring(p, GOLD, 200, Math.round(600 * f), 6); ring(p, '#fff', 110, Math.round(380 * f), 3);
      boom(p, '#fff3c0', 140, Math.round(360 * f)); parts(p, 18, GOLD, 90, 800 * f, { cls: 'ember', rise: -30 }); shake(7); }, h && icon ? T : 0);
    return T + Math.round(900 * f);
  }
  function onThaw(id) { const p = pos(id); if (p) { parts(p, 14, '#bfe8ff', 60, 600 * fac(), { cls: 'shard', size: 7 }); ring(p, '#8fd8ff', 90, 360 * fac(), 3); } }
  function onShieldBreak(id) { const p = pos(id); if (p) { parts(p, 16, '#ffe58a', 70, 600 * fac(), { cls: 'shard', size: 6 }); ring(p, GOLD, 120, 420 * fac(), 4); shake(3); } }
  function onFlare(id) { const p = pos(id); if (p) { flames(p, 6, '#ffb02a', 26, 520 * fac()); parts(p, 4, '#3a2a20', 24, 800 * fac(), { cls: 'ash', rise: -50 }); } }
  function shakeNow(pw) { const o = OFF; OFF = 0; try { shake(pw, 1); } finally { OFF = o; } }
  return { setup, setSpeed, shakeNow, setPose, play, onDeath, onHeal, onCrit, onBlock, onReact, onJinzhen, onFoil, onThaw, onShieldBreak, onFlare, onHit, onLand, victory, rigHTML, idleCls, fac, lastMv: () => lastMv };
})();
