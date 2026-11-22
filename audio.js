// ============ 九幽回廊 · 音效（全部由浏览器实时合成：古筝拨弦、锣、铃、木鱼） ============
'use strict';
const SFX = (() => {
  let ctx = null, master = null, musicGain = null, musicNodes = null, last = {};
  let soundOn = true, musicOn = true;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return ctx; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function noiseBuf(dur) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
  function tone(type, f0, f1, dur, vol, delay = 0) {
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, vol, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, freq, q, vol, type = 'bandpass', delay = 0, f1) {
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(dur + 0.05); f.type = type; f.frequency.setValueAtTime(freq, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q;
    env(g, t, 0.004, vol, dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  // 古筝式拨弦：快速起音 + 轻微滑音 + 泛音
  function pluck(f, vol, delay = 0, dest) {
    const t = ctx.currentTime + delay, out = dest || master;
    [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([m, ty, v]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = ty; o.frequency.setValueAtTime(f * m * 1.012, t); o.frequency.exponentialRampToValueAtTime(f * m, t + 0.08);
      const dur = 1.6 / m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  // 锣：低频非谐泛音，长衰减
  function gong(vol = 0.2, base = 92) {
    const t = ctx.currentTime;
    [[1, 1], [1.48, 0.6], [2.03, 0.45], [2.74, 0.3], [3.9, 0.15]].forEach(([m, v]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(base * m * 0.97, t); o.frequency.linearRampToValueAtTime(base * m, t + 0.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 2.7);
    });
    noise(0.25, 400, 0.8, vol * 0.6, 'lowpass');
  }
  // 铃：高频非谐泛音
  function bell(vol = 0.08, base = 1320, delay = 0) {
    [[1, 1], [2.76, 0.4], [5.4, 0.2]].forEach(([m, v]) => tone('sine', base * m, 0, 1.1 / m, vol * v, delay));
  }
  // 刀风：带通噪声扫频，起音慢一点（呼——）
  function swoosh(dur, f0, f1, vol, q = 1.2, att = 0.45, delay = 0) {
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(dur + 0.05); f.type = 'bandpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  const PENTA = [146.8, 174.6, 196, 220, 261.6, 293.7, 349.2, 392, 440, 523.3, 587.3];
  const SOUNDS = {
    click:  () => { tone('sine', 900, 700, 0.04, 0.08); noise(0.03, 1800, 6, 0.12); },
    step:   () => { noise(0.08, 300, 2, 0.25, 'lowpass'); },
    step2:  () => { noise(0.07, 380, 2, 0.2, 'lowpass'); },
    crunch: () => { noise(0.09, 2400, 0.9, 0.14); noise(0.05, 900, 1, 0.1, 'bandpass', 0.03); },
    wood:   () => { tone('triangle', 190, 120, 0.06, 0.07); noise(0.05, 500, 2, 0.12, 'lowpass'); },
    squelch:() => { noise(0.12, 500, 3, 0.16, 'lowpass', 0, 220); tone('sine', 160, 90, 0.08, 0.05); },
    whoosh: () => { swoosh(0.26, 280, 1500, 0.34, 0.9, 0.55); },
    swish:  () => { swoosh(0.15, 1300, 4200, 0.22, 1.4, 0.5); },
    stab:   () => { swoosh(0.09, 2200, 5200, 0.2, 2, 0.4); tone('sine', 2600, 2200, 0.05, 0.03, 0.06); },
    staffw: () => { swoosh(0.24, 180, 700, 0.32, 0.8, 0.6); },
    hammerw:() => { swoosh(0.22, 150, 520, 0.3, 0.8, 0.6); },
    rustle: () => { noise(0.12, 1300, 0.7, 0.07); },
    shing:  () => { tone('sine', 2637, 2600, 0.7, 0.045); tone('sine', 3951, 3900, 0.5, 0.025); noise(0.06, 6000, 1, 0.08, 'highpass'); },
    thud:   () => { tone('sine', 95, 45, 0.22, 0.22); noise(0.18, 220, 1, 0.22, 'lowpass'); },
    clink:  () => { bell(0.04, 2400); bell(0.03, 3100, 0.04); },
    ding:   () => { bell(0.05, 1480); },
    door:   () => { noise(0.35, 200, 1, 0.3, 'lowpass', 0, 80); tone('sawtooth', 70, 50, 0.3, 0.05); },
    hit:    () => { noise(0.07, 1800, 1.5, 0.35); tone('triangle', 180, 90, 0.08, 0.15); },
    crit:   () => { noise(0.12, 2600, 1, 0.45); tone('square', 320, 120, 0.15, 0.12); },
    hurt:   () => { noise(0.1, 600, 1, 0.35); tone('sawtooth', 140, 70, 0.12, 0.1); },
    fire:   () => { noise(0.35, 900, 0.7, 0.35, 'lowpass', 0, 300); },
    cold:   () => { [1800, 2400, 3000].forEach((f, i) => tone('sine', f, f * 1.05, 0.25, 0.05, i * 0.03)); noise(0.2, 5000, 3, 0.12, 'highpass'); },
    light:  () => { noise(0.18, 4000, 0.5, 0.3, 'highpass'); tone('square', 900, 200, 0.12, 0.06); },
    magic:  () => { tone('sine', 400, 900, 0.2, 0.12); tone('triangle', 600, 1200, 0.2, 0.06, 0.03); },
    holy:   () => { bell(0.06, 880); bell(0.04, 1174, 0.05); },
    poison: () => { tone('sine', 300, 180, 0.25, 0.1); noise(0.2, 800, 4, 0.1); },
    heal:   () => { [587.3, 784, 880].forEach((f, i) => pluck(f, 0.07, i * 0.06)); },
    buff:   () => { tone('sawtooth', 220, 440, 0.25, 0.08); },
    death:  () => { tone('sawtooth', 220, 40, 0.5, 0.12); noise(0.4, 400, 1, 0.2, 'lowpass', 0, 100); },
    loot:   () => { pluck(784, 0.12); pluck(1174.7, 0.1, 0.07); },
    rare:   () => { [587.3, 784, 880, 1174.7].forEach((f, i) => pluck(f, 0.1, i * 0.06)); },
    legend: () => { [293.7, 392, 440, 587.3, 784, 880, 1174.7].forEach((f, i) => pluck(f, 0.11, i * 0.05)); bell(0.06, 1760, 0.4); },
    level:  () => { [392, 440, 587.3, 784].forEach((f, i) => pluck(f, 0.12, i * 0.1)); bell(0.05, 1568, 0.4); },
    win:    () => { [293.7, 349.2, 392, 587.3].forEach((f, i) => pluck(f, 0.13, i * 0.12)); },
    lose:   () => { [392, 349.2, 293.7, 220, 146.8].forEach((f, i) => pluck(f, 0.12, i * 0.22)); gong(0.12, 70); },
    forge:  () => { tone('square', 1200, 600, 0.06, 0.12); noise(0.15, 3000, 2, 0.3); },
    fail:   () => { tone('sawtooth', 200, 90, 0.3, 0.1); },
    boss:   () => gong(0.24, 80),
    gong:   () => gong(0.2, 92),
    bell:   () => { bell(0.09, 1320); bell(0.07, 1320, 0.18); bell(0.05, 1320, 0.36); },
    page:   () => noise(0.08, 3000, 0.8, 0.08, 'highpass', 0, 6000),
    coin:   () => { bell(0.05, 2093); bell(0.04, 2637, 0.05); },
    react:  () => { bell(0.07, 1046); pluck(523.3, 0.1); pluck(784, 0.08, 0.04); noise(0.12, 2400, 1, 0.12); },
    key:    () => { bell(0.07, 1568); pluck(784, 0.08, 0.05); },
  };
  function play(name) {
    if (!soundOn || !ensure()) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 55) return;
    last[name] = now;
    try { (SOUNDS[name] || SOUNDS.click)(); } catch (e) {}
  }
  // ================= 配乐：按章节 / 场合合成 =================
  // 五声音阶：宫商角徵羽五种调式；乐器：筝、笛、箫、编钟、唢呐；打击：鼓、木鱼、锣；环境声：风、虫、火、水滴、人声
  const MODES = { gong: [0, 2, 4, 7, 9], shang: [0, 2, 5, 7, 10], jue: [0, 3, 5, 8, 10], zhi: [0, 2, 5, 7, 9], yu: [0, 3, 5, 7, 10] };
  const SCALE = (root, mode) => { const m = MODES[mode], out = []; for (let o = -1; o < 3; o++) for (const st of m) out.push(root * Math.pow(2, o + st / 12)); return out; };
  const MOODS = {
    town:   { root: 293.7, mode: 'gong', inst: ['zheng', 'flute'], gap: [0.28, 0.42, 0.55], rest: [1.2, 3], vol: 1, perc: 'muyu', bpm: 96, amb: 'birds', drone: [146.8], dvol: 0.5 },
    sad:    { root: 220, mode: 'yu', inst: ['xiao', 'zheng'], gap: [0.9, 1.3, 1.8], rest: [2.5, 5], vol: 0.9, perc: null, amb: null, drone: [110], dvol: 0.6 },
    c1:     { root: 146.8, mode: 'yu', inst: ['xiao', 'zheng'], gap: [0.6, 0.9, 1.2], rest: [2.5, 5], vol: 1, perc: 'muyu', bpm: 50, amb: 'wind', drone: [73.4, 110] },
    c2:     { root: 196, mode: 'jue', inst: ['flute', 'zheng'], gap: [0.35, 0.5, 0.7], rest: [2, 4], vol: 1, perc: null, amb: 'crickets', drone: [98] },
    c3:     { root: 174.6, mode: 'shang', inst: ['zheng', 'bell'], gap: [0.4, 0.6, 0.9], rest: [2, 4], vol: 0.9, perc: null, amb: 'drip', drone: [87.3, 130.8], slide: 1 },
    c4:     { root: 130.8, mode: 'zhi', inst: ['zheng', 'xiao'], gap: [0.3, 0.45, 0.6], rest: [1.5, 3], vol: 1, perc: 'drum', bpm: 84, amb: 'fire', drone: [65.4, 98] },
    c5:     { root: 155.6, mode: 'yu', inst: ['xiao', 'zheng'], gap: [0.7, 1.0, 1.4], rest: [3, 5], vol: 0.9, perc: null, amb: 'bubble', drone: [77.8] },
    c6:     { root: 261.6, mode: 'shang', inst: ['bell', 'flute'], gap: [0.8, 1.2, 1.6], rest: [3, 6], vol: 0.9, perc: null, amb: 'blizzard', drone: [130.8, 196] },
    c7:     { root: 233.1, mode: 'zhi', inst: ['suona', 'zheng'], gap: [0.25, 0.35, 0.5], rest: [1.5, 3], vol: 0.8, perc: 'muyu', bpm: 110, amb: 'crowd', drone: [116.5] },
    c8:     { root: 196, mode: 'gong', inst: ['bell', 'xiao'], gap: [0.6, 0.9, 1.2], rest: [2, 4], vol: 0.9, perc: 'muyu', bpm: 60, amb: 'chant', drone: [98, 147] },
    c9:     { root: 185, mode: 'yu', inst: ['xiao', 'bell'], gap: [1.0, 1.5, 2.0], rest: [3, 6], vol: 0.8, perc: null, amb: 'wind', drone: [92.5, 138.6] },
    c10:    { root: 138.6, mode: 'jue', inst: ['xiao', 'zheng', 'bell'], gap: [0.5, 0.8], rest: [2, 4], vol: 1, perc: 'drum', bpm: 66, amb: 'wind', drone: [69.3, 103.8] },
  };
  // 同一章：室内更静、地下城更暗、战斗加鼓加快、首领战满编打击乐
  function moodDef(m) {
    const base = MOODS[m.key] || MOODS.c1, d = { ...base };
    if (m.kind === 'room') { d.perc = null; d.amb = 'fire'; d.gap = d.gap.map(x => x * 1.2); d.inst = ['zheng']; }
    if (m.kind === 'dungeon') { d.root = base.root / 1.5; d.gap = d.gap.map(x => x * 1.3); d.amb = base.amb === 'fire' ? 'fire' : 'drip'; d.perc = base.perc === 'drum' ? 'drum' : null; }
    if (m.fight === 'battle') { d.gap = [0.18, 0.25, 0.32]; d.rest = [0.4, 1]; d.perc = 'drum'; d.bpm = 132; d.vol = 1.1; d.drum2 = 1; }
    if (m.fight === 'boss') { d.gap = [0.16, 0.22]; d.rest = [0.3, 0.7]; d.perc = 'drum'; d.bpm = 150; d.vol = 1.2; d.drum2 = 2; d.gongs = 1; d.mode = d.mode === 'gong' ? 'yu' : d.mode; }
    return d;
  }
  let cur = null, curKey = '', phraseT = null, percT = null, ambNodes = [], droneNodes = [], gen = 0;
  const mg = () => musicGain;
  function mtone(type, f, dur, vol, t, attack = 0.01, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    o.connect(g); g.connect(dest || mg()); o.start(t); o.stop(t + attack + dur + 0.05); return o;
  }
  function mnoise(dur, freq, q, vol, t, type = 'bandpass', attack = 0.004) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(dur + 0.1); f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    s.connect(f); f.connect(g); g.connect(mg()); s.start(t); s.stop(t + dur + 0.1);
  }
  // 乐器
  function inst(name, f, dur, vol, t, slide) {
    if (name === 'zheng') { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
      o.frequency.setValueAtTime(f * (slide ? 0.94 : 1.012), t); o.frequency.exponentialRampToValueAtTime(f, t + (slide ? 0.18 : 0.08));
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g); g.connect(mg()); o.start(t); o.stop(t + 1.7); mtone('sine', f * 2, 0.8, vol * 0.3, t, 0.004); return; }
    if (name === 'flute' || name === 'xiao') {
      const ff = name === 'xiao' ? f / 2 : f, o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = ff; lfo.frequency.value = 5; lg.gain.value = ff * 0.008; lfo.connect(lg); lg.connect(o.frequency);
      const len = Math.max(0.4, dur * 1.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.8, t + 0.09); g.gain.setValueAtTime(vol * 0.7, t + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(mg()); o.start(t); lfo.start(t); o.stop(t + len + 0.05); lfo.stop(t + len + 0.05);
      mnoise(0.12, ff * 3, 1, vol * 0.05, t, 'bandpass', 0.03); return; }
    if (name === 'bell') { [[1, 1], [2.76, 0.35], [5.4, 0.15]].forEach(([m, v]) => mtone('sine', f * m, 2.2 / m, vol * v * 0.8, t, 0.003)); return; }
    if (name === 'suona') { const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f; lfo.frequency.value = 6; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency);
      fl.type = 'bandpass'; fl.frequency.value = 1400; fl.Q.value = 1.2; const len = Math.max(0.3, dur * 1.2);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(fl); fl.connect(g); g.connect(mg()); o.start(t); lfo.start(t); o.stop(t + len + 0.05); lfo.stop(t + len + 0.05); return; }
  }
  // 旋律：在调式里随机游走，几句一段
  function phrase(my) {
    if (my !== gen || !cur) return;
    const d = cur, sc = SCALE(d.root, d.mode), now = ctx.currentTime + 0.05;
    let idx = 5 + Math.floor(Math.random() * 5), t = 0;
    const n = 3 + Math.floor(Math.random() * 5), main = RNGp(d.inst);
    for (let i = 0; i < n; i++) {
      idx = Math.max(2, Math.min(sc.length - 2, idx + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
      const g = RNGp(d.gap);
      inst(main, sc[idx], g, 0.06 * d.vol, now + t, d.slide && Math.random() < 0.3);
      if (d.inst.length > 1 && Math.random() < 0.18) inst(d.inst[1], sc[Math.max(0, idx - 5)], g * 2, 0.04 * d.vol, now + t);
      t += g;
    }
    phraseT = setTimeout(() => phrase(my), (t + d.rest[0] + Math.random() * (d.rest[1] - d.rest[0])) * 1000);
  }
  const RNGp = a => a[Math.floor(Math.random() * a.length)];
  // 打击乐
  function perc(my, beat = 0) {
    if (my !== gen || !cur || !cur.perc) return;
    const d = cur, t = ctx.currentTime + 0.05, spb = 60 / (d.bpm || 80);
    if (d.perc === 'muyu') { if (beat % 2 === 0 || Math.random() < 0.3) { mtone('sine', 820, 0.06, 0.07 * d.vol, t, 0.002); mnoise(0.03, 1500, 4, 0.05 * d.vol, t); } }
    if (d.perc === 'drum') {
      if (beat % 4 === 0 || (d.drum2 && beat % 4 === 2) || (d.drum2 === 2 && Math.random() < 0.35)) { const o = mtone('sine', 90, 0.35, 0.22 * d.vol, t, 0.003); o.frequency.exponentialRampToValueAtTime(48, t + 0.3); mnoise(0.12, 300, 1, 0.12 * d.vol, t, 'lowpass'); }
      if (d.drum2 && beat % 2 === 1) mnoise(0.05, 2500, 2, 0.05 * d.vol, t, 'bandpass');
    }
    if (d.gongs && beat % 16 === 0) { [[1, 1], [1.48, 0.6], [2.03, 0.4]].forEach(([m, v]) => mtone('sine', 85 * m, 2.4, 0.09 * v, t, 0.02)); }
    percT = setTimeout(() => perc(my, beat + 1), spb * 1000);
  }
  // 环境声
  function ambient(d) {
    const t = ctx.currentTime, kill = [];
    const loopNoise = (freq, q, vol, type = 'bandpass', lfoF = 0.07, lfoD = 0) => {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf(4); s.loop = true;
      f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
      if (lfoD) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfoF; lg.gain.value = lfoD; l.connect(lg); lg.connect(g.gain); l.start(t); kill.push(l); }
      s.connect(f); f.connect(g); g.connect(mg()); s.start(t); kill.push(s);
    };
    const a = d.amb;
    if (a === 'wind' || a === 'blizzard') loopNoise(a === 'blizzard' ? 600 : 380, 0.6, a === 'blizzard' ? 0.05 : 0.03, 'bandpass', 0.09, 0.02);
    if (a === 'fire') loopNoise(500, 0.5, 0.02, 'lowpass');
    if (a === 'crowd') loopNoise(700, 0.8, 0.025, 'bandpass', 0.3, 0.012);
    if (a === 'chant') { const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 98; f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 4; g.gain.value = 0.018; o.connect(f); f.connect(g); g.connect(mg()); o.start(t); kill.push(o); }
    // 零星的声音：虫鸣、水滴、鸟叫、火星、气泡
    const sparks = { crickets: () => { for (let i = 0; i < 3; i++) mtone('sine', 4200 + Math.random() * 300, 0.03, 0.015, ctx.currentTime + i * 0.06, 0.002); },
      drip: () => mtone('sine', 1200 + Math.random() * 800, 0.12, 0.03, ctx.currentTime, 0.002),
      birds: () => { const t0 = ctx.currentTime, f0 = 2400 + Math.random() * 800; const o = mtone('sine', f0, 0.12, 0.02, t0, 0.01); o.frequency.exponentialRampToValueAtTime(f0 * 1.3, t0 + 0.1); },
      fire: () => mnoise(0.02, 3000, 2, 0.03, ctx.currentTime),
      bubble: () => { const t0 = ctx.currentTime, o = mtone('sine', 300 + Math.random() * 200, 0.1, 0.03, t0, 0.005); o.frequency.exponentialRampToValueAtTime(700, t0 + 0.1); } };
    const sp = sparks[a];
    let alive = true;
    if (sp) { const tick = () => { if (!alive) return; try { sp(); } catch (e) {} ambT = setTimeout(tick, 600 + Math.random() * 2600); }; let ambT = setTimeout(tick, 800); kill.push({ stop: () => { alive = false; clearTimeout(ambT); } }); }
    return kill;
  }
  function drone(d) {
    const t = ctx.currentTime, nodes = [];
    (d.drone || []).forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(), flt = ctx.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = d.kind === 'dungeon' ? f / 1.5 : f; flt.type = 'lowpass'; flt.frequency.value = 200 + i * 80;
      g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.04 / (i + 1) * (d.dvol || 1), t + 2);
      lfo.frequency.value = 0.06 + i * 0.05; lg.gain.value = 0.015; lfo.connect(lg); lg.connect(g.gain);
      o.connect(flt); flt.connect(g); g.connect(mg()); o.start(t); lfo.start(t); nodes.push(o, lfo);
    });
    return nodes;
  }
  // ================= 配乐 v2：中式恐怖 =================
  // 思路：留白。平时只有一层很低的底音 + 一件独奏乐器，隔很久才响一句；每个地方有一种「不对劲」。
  // 先做三段试听：坟场（c1）、鬼市（c7）、首领战。其余章节仍用上面的旧写法。
  let rev = null, wetIn = null, tm2 = [];
  function bus2() {
    if (rev) return; rev = ctx.createConvolver();
    const sr = ctx.sampleRate, n = Math.floor(sr * 3.2), b = ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.8) * Math.min(1, i / (sr * 0.015)); }
    rev.buffer = b; wetIn = ctx.createGain(); const lp = ctx.createBiquadFilter(), wo = ctx.createGain(); lp.type = 'lowpass'; lp.frequency.value = 3200; wo.gain.value = 0.5;
    wetIn.connect(rev); rev.connect(lp); lp.connect(wo); wo.connect(musicGain);
  }
  function out2(node, dry, wet) { if (dry) { const d = ctx.createGain(); d.gain.value = dry; node.connect(d); d.connect(musicGain); } if (wet) { const w = ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(wetIn); } }
  const adsr = (g, t, a, peak, hold, r) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r); };
  // 拨弦（筝、琵琶）：Karplus-Strong 算出来的一根弦，有真的余韵
  let ksC = {}, ksN = 0;
  function ksBuf(f, bright, dur) {
    const key = Math.round(f * 4) + '|' + bright + '|' + dur; if (ksC[key]) return ksC[key];
    if (ksN > 40) { ksC = {}; ksN = 0; }
    const sr = ctx.sampleRate, N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * dur), b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0), ring = new Float32Array(N);
    let p = 0, mx = 0; for (let i = 0; i < N; i++) { p += ((Math.random() * 2 - 1) - p) * bright; ring[i] = p; }
    const damp = Math.pow(10, -3 / (f * dur * 0.75)); let i = 0;
    for (let n = 0; n < len; n++) { const j = i + 1 === N ? 0 : i + 1, y = damp * 0.5 * (ring[i] + ring[j]); d[n] = ring[i]; if (Math.abs(d[n]) > mx) mx = Math.abs(d[n]); ring[i] = y; i = j; }
    const fade = Math.floor(sr * 0.04); for (let n = 0; n < len; n++) d[n] = d[n] / (mx || 1) * (n > len - fade ? (len - n) / fade : 1);
    ksN++; return ksC[key] = b;
  }
  function pluck(f, t, vol, o = {}) {
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = ksBuf(f, o.bright || 0.45, o.dur || 2.2);
    if (o.bend) { s.playbackRate.setValueAtTime(o.bend, t); s.playbackRate.exponentialRampToValueAtTime(1, t + (o.bendT || 0.16)); }
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + 0.18); lg.gain.linearRampToValueAtTime(0.011 * o.vib, t + 0.6); l.connect(lg); lg.connect(s.playbackRate); l.start(t); l.stop(t + 2.4); }
    g.gain.value = vol; s.connect(g); out2(g, 1, o.wet == null ? 0.5 : o.wet); s.start(t);
  }
  // 箫：气声起音，从下面滑上来，颤音晚一点才出来，句尾往下掉
  function xiao2(f, t, dur, vol, o = {}) {
    const a = ctx.createOscillator(), b = ctx.createOscillator(), g = ctx.createGain(), gb = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    for (const [osc, m] of [[a, 1], [b, 2]]) { osc.type = 'sine'; osc.frequency.setValueAtTime(f * m * (o.from || 0.972), t); osc.frequency.exponentialRampToValueAtTime(f * m, t + 0.24);
      if (o.fall) { osc.frequency.setValueAtTime(f * m, t + dur * 0.72); osc.frequency.exponentialRampToValueAtTime(f * m * o.fall, t + dur + 0.3); } }
    l.frequency.value = 4.4; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + Math.min(0.6, dur * 0.4)); lg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(1.3, dur * 0.85)); l.connect(lg); lg.connect(a.frequency);
    gb.gain.value = 0.16; b.connect(gb); gb.connect(g); a.connect(g); adsr(g, t, 0.2, vol, Math.max(0.05, dur - 0.2), 0.5);
    const s = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), bg = ctx.createGain(); s.buffer = noiseBuf(dur + 1); bf.type = 'bandpass'; bf.frequency.value = f * 2.3; bf.Q.value = 0.9;
    bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(vol * 0.16, t + 0.06); bg.gain.exponentialRampToValueAtTime(vol * 0.012, t + 0.35); bg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 0.9));
    s.connect(bf); bf.connect(bg); bg.connect(g); out2(g, 0.75, o.wet == null ? 0.8 : o.wet);
    const end = t + dur + 0.8; a.start(t); b.start(t); l.start(t); s.start(t); a.stop(end); b.stop(end); l.stop(end); s.stop(end);
  }
  // 二胡：一定带滑音；cents 是故意拉不准的量
  function erhu(f, t, dur, vol, o = {}) {
    const osc = ctx.createOscillator(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    osc.type = 'sawtooth'; osc.detune.value = o.cents || 0; osc.frequency.setValueAtTime(o.from || f * 0.945, t); osc.frequency.exponentialRampToValueAtTime(f, t + (o.gl || 0.12));
    l.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + Math.min(0.25, dur * 0.5)); lg.gain.linearRampToValueAtTime(f * 0.011, t + Math.min(0.7, dur)); l.connect(lg); lg.connect(osc.frequency);
    f1.type = 'peaking'; f1.frequency.value = 950; f1.Q.value = 2; f1.gain.value = 9; f2.type = 'peaking'; f2.frequency.value = 2300; f2.Q.value = 3; f2.gain.value = 6; lp.type = 'lowpass'; lp.frequency.value = 2800;
    adsr(g, t, 0.06, vol * 0.5, Math.max(0.02, dur - 0.12), 0.14); osc.connect(f1); f1.connect(f2); f2.connect(lp); lp.connect(g); out2(g, 0.8, o.wet == null ? 0.45 : o.wet);
    osc.start(t); l.start(t); osc.stop(t + dur + 0.3); l.stop(t + dur + 0.3);
  }
  // 唢呐：鼻音、急颤、前面带个上滑的装饰音。far = 很远的地方传过来的
  function suona2(f, t, dur, vol, o = {}) {
    const a = ctx.createOscillator(), b = ctx.createOscillator(), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    a.type = 'square'; b.type = 'sawtooth'; for (const osc of [a, b]) { osc.detune.value = o.cents || 0; osc.frequency.setValueAtTime(f * 0.89, t); osc.frequency.exponentialRampToValueAtTime(f, t + 0.05); if (o.fall) { osc.frequency.setValueAtTime(f, t + dur * 0.6); osc.frequency.exponentialRampToValueAtTime(f * o.fall, t + dur); } }
    l.frequency.value = 6.4; lg.gain.value = f * 0.013; l.connect(lg); lg.connect(a.frequency); lg.connect(b.frequency);
    bp.type = 'bandpass'; bp.frequency.value = o.far ? 1300 : 1900; bp.Q.value = o.far ? 1.4 : 1.1; hp.type = 'highpass'; hp.frequency.value = 500;
    adsr(g, t, 0.025, vol * (o.far ? 0.5 : 0.42), Math.max(0.02, dur - 0.08), 0.09); a.connect(bp); b.connect(bp); bp.connect(hp); hp.connect(g); out2(g, o.far ? 0.25 : 0.9, o.far ? 1 : 0.35);
    const end = t + dur + 0.25; a.start(t); b.start(t); l.start(t); a.stop(end); b.stop(end); l.stop(end);
  }
  // 打击：木鱼、小锣（音往上翘）、大锣（音往下沉）、钹、板鼓、堂鼓、磬
  function hit(type, f, dur, vol, t, to, toT) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + toT);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); o.start(t); o.stop(t + dur + 0.05); return g; }
  function nz(dur, type, freq, q, vol, t) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf(dur + 0.05); f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); s.start(t); s.stop(t + dur + 0.05); return g; }
  function muyu2(t, vol, p = 1) { out2(hit('sine', 760 * p, 0.11, vol, t), 0.9, 0.5); out2(hit('sine', 1840 * p, 0.045, vol * 0.4, t), 0.9, 0.3); out2(nz(0.006, 'bandpass', 2200, 2, vol * 0.2, t), 0.8, 0); }
  function luo(t, vol, big) {
    const base = big ? 190 : 640, dur = big ? 2.8 : 0.75;
    [[1, 1], [1.51, 0.6], [2.02, 0.45], [2.74, 0.3], [3.9, 0.16]].forEach(([m, v]) => out2(hit('sine', base * m, dur / Math.sqrt(m), vol * v, t, base * m * (big ? 0.93 : 1.1), big ? 0.6 : 0.13), 0.85, big ? 0.7 : 0.4));
    out2(nz(big ? 0.25 : 0.04, 'bandpass', base * 4, 1.5, vol * (big ? 0.18 : 0.1), t), 0.8, 0.15);
  }
  function bo(t, vol) { [[2350, 1, 0.16], [3140, 0.8, 0.13], [3980, 0.55, 0.1], [4870, 0.35, 0.07], [5900, 0.2, 0.05]].forEach(([f, v, d]) => out2(hit('sine', f, d, vol * v * 0.5, t), 0.9, 0.2)); out2(nz(0.012, 'highpass', 5000, 0.7, vol * 0.25, t), 0.9, 0); }
  function bangu(t, vol) { out2(hit('sine', 1480, 0.028, vol * 0.8, t, 1250, 0.02), 1, 0.1); out2(hit('sine', 2950, 0.014, vol * 0.35, t), 1, 0.05); out2(nz(0.008, 'bandpass', 2600, 1.2, vol * 0.3, t), 1, 0); }
  function tanggu(t, vol) { out2(hit('sine', 112, 0.42, vol, t, 52, 0.32), 1, 0.3); out2(hit('triangle', 236, 0.2, vol * 0.6, t, 150, 0.16), 1, 0.3); out2(nz(0.03, 'bandpass', 420, 1.5, vol * 0.25, t), 1, 0.1); }   // 手机喇叭放不出 100Hz 以下，所以加一层 200Hz 上下的鼓皮声
  function qing(f, t, vol) { [[1, 1, 5], [1.004, 0.6, 5], [2.71, 0.35, 2.6], [4.95, 0.18, 1.3]].forEach(([m, v, d]) => out2(hit('sine', f * m, d, vol * v, t), 0.6, 0.9)); }
  // 远处的戏腔：一个女声似的长音，慢慢滑上去又掉下来
  function ghost(f, t, dur, vol) {
    const o = ctx.createOscillator(), b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.94, t); o.frequency.linearRampToValueAtTime(f, t + dur * 0.25); o.frequency.setValueAtTime(f, t + dur * 0.55); o.frequency.linearRampToValueAtTime(f * 1.122, t + dur * 0.7); o.frequency.linearRampToValueAtTime(f * 0.89, t + dur);
    l.frequency.value = 5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + dur * 0.6); l.connect(lg); lg.connect(o.frequency);
    b1.type = 'bandpass'; b1.frequency.value = 850; b1.Q.value = 5; b2.type = 'bandpass'; b2.frequency.value = 1250; b2.Q.value = 6;
    adsr(g, t, dur * 0.3, vol, dur * 0.4, dur * 0.3); o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); out2(g, 0.1, 1.2); o.start(t); l.start(t); o.stop(t + dur + 0.1); l.stop(t + dur + 0.1);
  }
  // 一直响着的东西（风、人声、底音）：返回节点，换氛围时由 mood() 统一停掉
  function bedNoise(freq, q, vol, sweep, rate) {
    const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lf = ctx.createGain(), lg = ctx.createGain();
    s.buffer = noiseBuf(4); s.loop = true; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol; l.frequency.value = rate || 0.07; lf.gain.value = sweep || 0; lg.gain.value = vol * 0.6;
    l.connect(lf); lf.connect(f.frequency); l.connect(lg); lg.connect(g.gain); s.connect(f); f.connect(g); out2(g, 1, 0.3); s.start(t); l.start(t); return [s, l];
  }
  function bedTone(f, vol, type = 'sine', cut = 400) {
    const t = ctx.currentTime, o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cut;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 3); o.connect(lp); lp.connect(g); g.connect(musicGain); o.start(t); return { node: o, gain: g };
  }
  function gust(t, dur, vol) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), f0 = rnd(330, 420), up = rnd(1.25, 1.45);
    s.buffer = noiseBuf(dur + 0.5);
    for (const [m, v] of [[1, 1], [1.5, 0.35]]) { const f = ctx.createBiquadFilter(), fg = ctx.createGain(); f.type = 'bandpass'; f.Q.value = 16; fg.gain.value = v;
      f.frequency.setValueAtTime(f0 * m, t); f.frequency.linearRampToValueAtTime(f0 * m * up, t + dur * 0.45); f.frequency.linearRampToValueAtTime(f0 * m * 0.9, t + dur); s.connect(f); f.connect(fg); fg.connect(g); }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.linearRampToValueAtTime(vol * 0.5, t + dur * 0.65); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    out2(g, 0.7, 0.5); s.start(t); s.stop(t + dur + 0.3);
  }
  // 定时：fn 返回「过多少秒再来一次」；换了氛围（gen 变了）就自己停
  function every(my, first, fn) { const tick = () => { if (my !== gen || !ctx) return; let d = 1; if (ctx.state === 'running' && !document.hidden) { d = 2; try { d = fn(ctx.currentTime + 0.08); } catch (e) { if (window.__mdbg) console.error('music: ' + (e && e.stack || e)); } }   // 切到后台、声音被系统暂停时不排音，免得回来时一股脑全响
      if (tm2.length > 200) tm2 = tm2.slice(-50); tm2.push(setTimeout(tick, Math.max(0.03, d) * 1000)); }; tm2.push(setTimeout(tick, first * 1000)); }
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];

  // ---- 坟场 · 义庄：风、木鱼、隔很久才来一句的箫、远处断断续续的送葬唢呐 ----
  function graveV2(my, kind) {
    const sc = SCALE(146.8, 'yu'), nodes = [], room = kind === 'room', deep = kind === 'dungeon';   // D 羽：D F G A C；sc[10] = D4
    if (!room && !deep) every(my, 9, t => { gust(t, rnd(5, 8), 0.05); return rnd(16, 30); });
    const d1 = bedTone(deep ? 55 : 73.4, 0.016), d2 = bedTone(deep ? 55.4 : 73.9, 0.014), d3 = bedTone(deep ? 82.4 : 110, 0.008); nodes.push(d1.node, d2.node, d3.node);
    let n = 0;
    every(my, 2.5, t => { n++; if (n % 11 === 0) return rnd(5, 8); muyu2(t, 0.08, deep ? 0.8 : 1); if (Math.random() < 0.2) muyu2(t + 0.33, 0.05, deep ? 0.8 : 1); return (deep ? 3.6 : 2.6) + rnd(-0.15, 0.15); });
    const PH = [[[13, 2.4], [12, 1.2], [11, 1.0], [10, 3.2]], [[10, 1.6], [11, 1.0], [12, 2.8]], [[14, 1.8], [13, 1.2], [12, 0.9], [13, 0.7], [11, 3.0]], [[10, 3.6]], [[8, 2.0], [9, 1.2], [10, 3.2]], [[12, 1.4], [13, 2.2], [10, 3.0]]];
    if (!deep) every(my, 6, t => { const ph = pick(PH); let x = 0; ph.forEach(([i, d], k) => { xiao2(sc[i], t + x, d * 0.92, 0.095, { fall: k === ph.length - 1 ? 0.965 : 0, from: k ? 0.985 : 0.955 }); x += d; }); return x + rnd(room ? 14 : 9, room ? 24 : 16); });
    if (deep) { every(my, 3, t => { out2(hit('sine', rnd(1100, 1900), 0.14, 0.03, t), 0.6, 1); return rnd(1.5, 5); }); every(my, 9, t => { ghost(sc[pick([8, 10])], t, rnd(4, 6), 0.012); return rnd(28, 45); }); }
    every(my, 14, t => { qing(sc[pick([5, 8])], t, 0.06); return rnd(22, 34); });
    if (!room && !deep) {
      const F = [[13, 0.5], [12, 0.5], [13, 0.5], [14, 0.9], [13, 0.5], [12, 0.45], [11, 0.5], [10, 1.4]];   // 送葬调，从很远的地方飘过来，缺字漏句
      every(my, 20, t => { let x = 0, k0 = Math.floor(rnd(0, 3)); F.slice(k0).forEach(([i, d]) => { if (Math.random() < 0.8) suona2(sc[i] * 2, t + x, d * 0.9, 0.075, { far: 1, cents: -28, fall: Math.random() < 0.3 ? 0.97 : 0 }); x += d; }); return x + rnd(38, 65); });
      every(my, 48, t => { ghost(sc[pick([12, 13])], t, rnd(4.5, 6.5), 0.014); return rnd(70, 110); });
    }
    return nodes;
  }
  // ---- 鬼市：热闹的小锣和二胡，但拍子会飘、音拉不准，隔一阵子全场突然静下来 ----
  function marketV2(my, kind) {
    const sc = SCALE(233.1, 'zhi'), nodes = [];   // 降 B 徵：Bb C Eb F G；sc[5] = Bb3
    const dr = bedTone(58.3, 0.01); nodes.push(dr.node);
    const BARS = { A: 'T...c...', B: 'T...T.c.', C: 'k.T...c.', D: 'T.......' }, SEQ = 'ABACABAD';
    const MEL = [[[8, .5], [9, .5], [10, 1], [9, .5], [8, .5], [7, 1], [8, .5], [9, .5], [8, .5], [7, .5], [6, 2]],
      [[10, 1], [11, .5], [10, .5], [9, 1], [8, 1], [9, .5], [10, .5], [9, .5], [8, .5], [7, 2]],
      [[11, 1.5], [10, .5], [9, 1], [10, 1], [9, .5], [8, .5], [7, .5], [8, .5], [9, 2]],
      [[5, 4, { from: 233.1 * 0.5, gl: 1.3 }], [-1, 4]]];   // 最后一句是一声拖长的「吆喝」
    let bar = 0, hush = Math.floor(rnd(9, 13)), mrest = 2;
    every(my, 1.2, t => {
      const spb = 60 / 88 * (1 + 0.055 * Math.sin(bar * 0.9)), st = spb / 2;
      if (bar >= hush) {   // 全场忽然静下来：只剩一声磬，然后小锣一敲，又热闹起来
        const gap = rnd(2.6, 4.2); bar = 0; hush = Math.floor(rnd(9, 13)); mrest = 1;
        nodes.slice(0, 4).forEach(nd => { /* 底噪不动，靠旋律和锣鼓全停制造空白 */ }); qing(sc[5], t + gap * 0.35, 0.06); return gap;
      }
      const pat = BARS[SEQ[bar % 8]];
      for (let i = 0; i < 8; i++) { if (Math.random() < 0.1) continue; const c = pat[i], tt = t + i * st + rnd(-0.012, 0.012); if (c === 'T') luo(tt, 0.05, false); else if (c === 'c') bo(tt, 0.028); else if (c === 'k') bangu(tt, 0.06); }
      if (mrest > 0) mrest--; else if (bar % 2 === 0) {
        const m = pick(MEL); let x = 0;
        m.forEach(([i, b, o]) => { if (i >= 0) { const f = sc[i], cents = rnd(-38, 22), late = rnd(0, 0.03);
          erhu(f, t + x * spb + late, b * spb * 0.92, 0.125, { cents, ...(o || (Math.random() < 0.15 ? { from: f * 1.08, gl: 0.2 } : {})) });
          if (!o && Math.random() < 0.4) pluck(f * 2, t + x * spb + rnd(0.03, 0.07), 0.05, { bright: 0.8, dur: 0.9, wet: 0.3 }); } x += b; });
        mrest = Math.random() < 0.45 ? 3 : 1;
      }
      bar++; return spb * 4;
    });
    return nodes;
  }
  // ---- 打斗：戏曲锣鼓点推着走。首领战再加大锣和唢呐 ----
  function fightV2(my, d, boss) {
    const sc = SCALE(d.root, 'yu'), bpm = boss ? 152 : 128, st = 60 / bpm / 4, nodes = [];
    const lowf = d.root / (d.root > 200 ? 4 : 2), pulse = bedTone(lowf, 0.0001, 'sawtooth', 420); nodes.push(pulse.node); pulse.gain.gain.cancelScheduledValues(0); pulse.gain.gain.value = 0.0001;
    const SU = [[[15, 1.5], [14, .5], [13, 1], [15, 1], [16, 2], [15, .5], [14, .5], [13, 1]],
      [[13, .5], [14, .5], [15, 1], [13, .5], [12, .5], [11, 1], [12, .5], [13, .5], [12, .5], [11, .5], [10, 2]],
      [[10, .5], [12, .5], [13, .5], [15, .5], [16, 2], [15, .25], [15, .25], [15, .25], [15, .25], [13, 1], [15, 2]],
      [[15, 3, { fall: 0.94 }], [13, 1], [12, 1], [13, 1], [10, 2]]];
    const OST = [5, 8, 7, 8, 5, 8, 9, 8];   // 琵琶在下面来回拨的几个音
    let bar = 0;
    every(my, 0.25, t => {
      const brk = bar % 8 === 7;   // 每八小节留一小节：只剩一声大锣和越敲越密的板鼓
      for (let i = 0; i < 16; i++) { const tt = t + i * st;
        if (brk) { if (i === 0) luo(tt, boss ? 0.09 : 0.05, boss); if (i >= 4) { bangu(tt, 0.03 + i * 0.004); if (i >= 10) bangu(tt + st / 2, 0.03 + i * 0.004); } continue; }
        const acc = [0, 3, 6, 10, 12].includes(i);
        if (boss || i % 2 === 0) bangu(tt, acc ? (boss ? 0.075 : 0.1) : (boss ? 0.035 : 0.05));
        if (i === 0 || i === 8 || (boss && bar % 2 === 1 && (i === 6 || i === 14))) tanggu(tt, boss ? 0.2 : 0.15);
        if (i === 4 || i === 12) luo(tt, boss ? 0.04 : 0.06, false);
        if (boss && (i === 2 || i === 6 || i === 10 || i === 14)) bo(tt, 0.028);
        if (boss && i === 0 && bar % 2 === 0) luo(tt, 0.1, true);
        if (i % 2 === 0) { pulse.gain.gain.setValueAtTime(boss ? 0.05 : 0.035, tt); pulse.gain.gain.exponentialRampToValueAtTime(0.004, tt + st * 1.8); }
        if (!boss && i % 2 === 0) pluck(sc[OST[i / 2]] * 2, tt, i % 8 === 0 ? 0.11 : 0.075, { bright: 0.75, dur: 0.8, wet: 0.25 });
      }
      if (boss && !brk && bar % 4 === 0) { const m = SU[(bar / 4) % SU.length | 0]; let x = 0; m.forEach(([i, b, o]) => { suona2(sc[i], t + x * st * 4, b * st * 4 * 0.9, 0.135, o || {}); x += b; }); }
      if (!boss && !brk && bar % 4 === 2) { let x = 0; [[13, 1], [12, .5], [11, .5], [10, 2]].forEach(([i, b]) => { erhu(sc[i], t + x * st * 4, b * st * 4 * 0.9, 0.1, {}); x += b; }); }
      bar++; return st * 16;
    });
    return nodes;
  }
  // ---- 其余各处：都是「一层底音 + 一件独奏乐器 + 一种这个地方才有的声音」，没有一直响的噪声 ----
  function note(inst, f, t, d, vol, last) {
    if (inst === 'xiao') xiao2(f, t, d * 0.92, vol, { fall: last ? 0.965 : 0, from: 0.975 });
    else if (inst === 'zheng') pluck(f, t, vol * 1.5, { vib: d > 0.9 ? 1 : 0, bend: Math.random() < 0.18 ? 0.945 : 0, dur: 2.4 });
    else if (inst === 'pipa') pluck(f, t, vol * 1.4, { bright: 0.8, dur: last ? 2 : 1.2, bend: last ? 1.06 : 0, bendT: 0.3 });
    else if (inst === 'erhu') erhu(f, t, d * 0.95, vol * 1.5, { gl: 0.2, wet: 0.7 });
    else if (inst === 'bell') { qing(f, t, vol * 0.7); pluck(f * 2, t, vol * 0.5, { bright: 0.9, dur: 1.2, wet: 0.9 }); }
  }
  // 独奏：从几句写好的乐句里挑一句，奏完歇很久
  function solo(my, sc, inst, PH, vol, first, rest, tempo, onPhrase) {
    every(my, first, t => { const ph = pick(PH); let x = 0; ph.forEach(([i, d], k) => { note(inst, sc[i], t + x, d * tempo, vol, k === ph.length - 1); x += d * tempo; }); if (onPhrase) onPhrase(t, ph, x); return x + rnd(rest[0], rest[1]); });
  }
  const beds = (...fv) => fv.map(([f, v]) => bedTone(f, v).node);
  function drips(my, first, a, b, vol) { every(my, first, t => { out2(hit('sine', rnd(1100, 1900), 0.14, vol || 0.03, t), 0.6, 1); return rnd(a, b); }); }
  function heart(t, vol) { tanggu(t, vol); tanggu(t + 0.28, vol * 0.6); }
  function anvil(t, vol) { [[1180, 1, 0.5], [2960, 0.55, 0.3], [4410, 0.25, 0.18]].forEach(([f, v, d]) => out2(hit('sine', f, d, vol * v, t), 0.5, 0.9)); }
  // 诵经：低低的一排人声，一个字一顿；slip = 念到最后整排往下滑（不对劲的地方）
  function chant(t, n, vol, slip) {
    const o = ctx.createOscillator(), b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), sy = 0.62;
    o.type = 'sawtooth'; b1.type = 'bandpass'; b1.frequency.value = 600; b1.Q.value = 6; b2.type = 'bandpass'; b2.frequency.value = 1000; b2.Q.value = 8; lp.type = 'lowpass'; lp.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, t);
    for (let k = 0; k < n; k++) { const tt = t + k * sy; o.frequency.setValueAtTime(k % 4 === 3 ? 110 : 98, tt); g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(vol, tt + 0.08); g.gain.linearRampToValueAtTime(vol * 0.45, tt + 0.45); g.gain.linearRampToValueAtTime(0.0001, tt + 0.6); muyu2(tt, 0.035, 0.9); }
    const end = t + n * sy;
    if (slip) { o.frequency.setValueAtTime(98, end); o.frequency.linearRampToValueAtTime(84, end + 2.2); g.gain.setValueAtTime(0.0001, end); g.gain.linearRampToValueAtTime(vol * 0.8, end + 0.1); g.gain.linearRampToValueAtTime(0.0001, end + 2.4); }
    o.connect(b1); o.connect(b2); b1.connect(lp); b2.connect(lp); lp.connect(g); out2(g, 0.4, 1); o.start(t); o.stop(end + 2.6);
  }
  // 青石镇：全游戏唯一暖的地方。筝弹宫调的小曲，笛子偶尔应一句
  function townV2(my) {
    const sc = SCALE(293.7, 'gong'), nodes = beds([146.8, 0.006], [220, 0.004]); let n = 0;   // D 宫：D E F# A B；sc[5] = D4
    const PH = [[[10, .5], [9, .5], [8, 1], [7, .5], [8, .5], [5, 2]], [[5, .5], [7, .5], [8, 1], [9, .5], [10, 1.5], [8, 2]], [[8, .75], [9, .25], [10, 1], [12, 1], [10, .5], [9, .5], [8, 2]], [[7, 1], [8, .5], [7, .5], [6, 1], [5, 2.5]], [[10, 1], [8, .5], [7, .5], [8, 1], [5, .5], [7, .5], [8, 2]]];
    solo(my, sc, 'zheng', PH, 0.13, 1.5, [1.8, 4], 0.7, (t, ph, x) => { pluck(sc[0], t, 0.1, { dur: 2.6 }); if (++n % 2 === 0) xiao2(sc[ph[ph.length - 1][0]] * 2, t + x + 0.4, 2.2, 0.05, { fall: 0.98, wet: 0.6 }); });
    return nodes;
  }
  // 篝火夜话、结局：一支箫慢慢吹，筝在底下垫一两个音
  function sadV2(my) {
    const sc = SCALE(220, 'yu'), nodes = beds([110, 0.014], [165, 0.006]);   // A 羽：A C D E G；sc[5] = A3
    const PH = [[[10, 2.2], [9, 1.2], [8, 1.2], [7, 3]], [[8, 1.5], [9, 1], [10, 2.5], [9, 1], [8, 3]], [[7, 2], [8, 1], [6, 1], [5, 3.5]], [[11, 2], [10, 1.4], [8, 1], [9, 3]]];
    solo(my, sc, 'xiao', PH, 0.085, 1.5, [4, 8], 1, t => { pluck(sc[0], t, 0.05, { dur: 2.6 }); pluck(sc[3], t + 0.9, 0.035, { dur: 2.6 }); });
    return nodes;
  }
  // 黑风林：低低的箫，林子深处隔一阵传来一声拖长的狼嚎
  function forestV2(my, kind) {
    const sc = SCALE(196, 'jue'), nodes = beds([98, 0.016], [98.5, 0.014]), deep = kind === 'dungeon', room = kind === 'room';   // G 角：G Bb C Eb F；sc[5] = G3
    const PH = [[[13, 2], [12, 1], [11, 1.5], [10, 3]], [[10, 1.5], [12, 1], [13, 2.5]], [[15, 2.5], [14, 1], [13, 1], [12, 3]], [[11, 3.5]], [[10, 1.2], [11, 1.2], [13, 3]]];
    solo(my, sc, 'xiao', PH, 0.09, 5, deep ? [14, 24] : [9, 17], 1);
    if (!room) every(my, 16, t => { const f = sc[pick([15, 16])]; erhu(f, t, rnd(2.8, 3.6), 0.07, { from: f * 0.6, gl: 1.3, wet: 1.3 }); if (Math.random() < 0.4) erhu(f * 0.84, t + rnd(4, 6), 2.6, 0.04, { from: f * 0.5, gl: 1.2, wet: 1.4 }); return rnd(34, 60); });
    if (!room && !deep) every(my, 11, t => { gust(t, rnd(5, 8), 0.05); return rnd(20, 34); });
    if (deep) drips(my, 3, 1.5, 5);
    every(my, 24, t => { qing(sc[pick([5, 8])], t, 0.05); return rnd(28, 44); });
    return nodes;
  }
  // 盘丝洞：琵琶的碎音像蜘蛛在爬，洞顶滴水
  function caveV2(my, kind) {
    const sc = SCALE(174.6, 'shang'), nodes = beds([87.3, 0.016], [87.7, 0.014]);   // F 商：F G Bb C Eb；sc[5] = F3
    const trem = (f, t, n, v) => { for (let k = 0; k < n; k++) pluck(f, t + k * 0.075, v * (0.5 + 0.5 * Math.sin(Math.PI * k / n)), { bright: 0.85, dur: 0.7, wet: 0.5 }); return n * 0.075; };
    every(my, 3, t => { const r = Math.random(); let x = 0;
      if (r < 0.4) { x = trem(sc[pick([10, 12])], t, 16, 0.24) + 0.3; [[9, .45], [8, .45], [10, 1.8]].forEach(([i, d], k) => { note('pipa', sc[i], t + x, d, 0.16, k === 2); x += d; }); }
      else if (r < 0.75) [[12, .32], [11, .32], [10, .32], [8, 1.6]].forEach(([i, d], k) => { note('pipa', sc[i], t + x, d, 0.16, k === 3); x += d; });
      else { pluck(sc[13], t, 0.18, { bright: 0.9, dur: 2.2, vib: 1 }); x = 2.2; }
      return x + rnd(3.5, 7.5); });
    drips(my, 2, 1, 3.8, 0.06);
    every(my, 20, t => { for (let k = 0; k < 6; k++) pluck(sc[15 + (k % 3)], t + k * 0.05, 0.05, { bright: 0.95, dur: 0.4, wet: 0.8 }); return rnd(24, 40); });   // 很轻很快的一串：有东西从头顶爬过去
    every(my, 40, t => { ghost(sc[pick([10, 12])], t, rnd(4, 6), 0.012); return rnd(60, 90); });
    return nodes;
  }
  // 火焰窟：远处有人在打铁，「叮——叮叮」；地底下像有心跳
  function mineV2(my, kind) {
    const sc = SCALE(130.8, 'zhi'), nodes = beds([65.4, 0.016], [98, 0.01]);   // C 徵：C D F G A；sc[10] = C4
    every(my, 2, t => { heart(t, 0.09); return 3.8 + rnd(-0.1, 0.1); });
    every(my, 7, t => { anvil(t, 0.05); anvil(t + 0.9, 0.035); anvil(t + 1.15, 0.045); return rnd(9, 17); });
    solo(my, sc, 'xiao', [[[12, 2], [11, 1], [10, 3]], [[10, 1.5], [12, 1.5], [13, 3]], [[14, 2], [13, 1], [12, 1], [10, 3]]], 0.08, 12, kind === 'dungeon' ? [22, 34] : [16, 28], 1);
    if (kind === 'dungeon') drips(my, 4, 2, 6);
    return nodes;
  }
  // 万毒沼：二胡拉得很慢很低，像有人在哭；沼泽里冒泡
  function swampV2(my, kind) {
    const sc = SCALE(155.6, 'yu'), nodes = beds([77.8, 0.016], [78.2, 0.014]);   // 降 E 羽；sc[10] = Eb4
    solo(my, sc, 'erhu', [[[10, 2], [11, 1], [10, 1], [8, 3]], [[12, 2.5], [11, 1.2], [10, 2.8]], [[8, 1.5], [10, 1.5], [9, 3]], [[13, 2], [12, 1], [10, 3.2]]], 0.1, 5, kind === 'dungeon' ? [14, 24] : [10, 18], 1);
    every(my, 3, t => { const f = rnd(300, 480); out2(hit('sine', f, 0.11, 0.045, t, f * 1.9, 0.1), 0.6, 0.8); if (Math.random() < 0.3) out2(hit('sine', f * 1.2, 0.09, 0.03, t + 0.18, f * 2.2, 0.08), 0.6, 0.8); return rnd(2, 7); });
    every(my, 18, t => { qing(sc[pick([5, 8])], t, 0.05); return rnd(26, 40); });
    every(my, 50, t => { ghost(sc[pick([12, 13])], t, rnd(4.5, 6), 0.012); return rnd(70, 100); });
    return nodes;
  }
  // 昆仑冰窟：冰上的磬声，很高很远；隔一阵一声冰裂
  function iceV2(my, kind) {
    const sc = SCALE(261.6, 'shang'), nodes = beds([130.8, 0.01]);   // C 商：C D F G Bb；sc[10] = C5
    solo(my, sc, 'bell', [[[10, 2.5], [12, 2.5], [11, 4]], [[13, 2], [10, 5]], [[12, 1.5], [11, 1.5], [10, 1.5], [8, 5]], [[8, 3], [10, 4]]], 0.12, 3, [7, 13], 1);
    if (kind !== 'room' && kind !== 'dungeon') every(my, 8, t => { gust(t, rnd(5, 9), 0.06); return rnd(13, 22); });
    every(my, 22, t => { pluck(sc[15], t, 0.09, { bright: 0.95, dur: 0.5, bend: 1.5, bendT: 0.09, wet: 1 }); return rnd(28, 50); });
    every(my, 30, t => { xiao2(sc[pick([10, 12])], t, rnd(3, 4), 0.07, { fall: 0.97, wet: 1.2 }); return rnd(40, 60); });
    if (kind === 'dungeon') drips(my, 4, 2, 6);
    return nodes;
  }
  // 白云观：磬一下一下地敲，殿里有人低声诵经——偶尔念到最后，整排声音一齐往下滑
  function templeV2(my, kind) {
    const sc = SCALE(196, 'gong'), nodes = beds([98, 0.012], [147, 0.007]);   // G 宫；sc[5] = G3
    every(my, 2, t => { qing(sc[pick([5, 5, 8])], t, 0.085); return rnd(7, 9.5); });
    every(my, 9, t => { const n = Math.floor(rnd(10, 17)); chant(t, n, 0.05, Math.random() < 0.4); return n * 0.62 + rnd(14, 24); });
    solo(my, sc, 'xiao', [[[10, 2.5], [9, 1.2], [8, 3]], [[8, 2], [10, 3.5]]], 0.06, 30, [34, 55], 1);
    return nodes;
  }
  // 九幽上层：几乎只剩心跳。隔一阵心跳忽然停住，过几秒才接上
  function netherV2(my, kind) {
    const sc = SCALE(185, 'yu'), nodes = beds([92.5, 0.016], [93.1, 0.014], [138.6, 0.006]); let n = 0, stop = Math.floor(rnd(18, 28));   // 升 F 羽；sc[10] = F#4
    every(my, 2, t => { if (++n >= stop) { n = 0; stop = Math.floor(rnd(18, 28)); return rnd(6, 9); } heart(t, 0.16); return 1.5; });
    every(my, 12, t => { ghost(sc[pick([10, 11, 12])], t, rnd(4, 6.5), 0.022); return rnd(20, 36); });
    every(my, 22, t => { xiao2(sc[pick([8, 10])], t, rnd(3.5, 5), 0.075, { fall: 0.96, wet: 1.3 }); return rnd(26, 42); });
    every(my, 38, t => { luo(t, 0.035, true); return rnd(45, 70); });
    return nodes;
  }
  // 九幽深渊：心跳更慢更重，底下像有东西在喘气，二胡低低地哼
  function abyssV2(my, kind) {
    const sc = SCALE(138.6, 'jue'), nodes = beds([69.3, 0.018], [69.8, 0.016], [103.8, 0.008]);   // 升 C 角；sc[10] = C#4
    every(my, 2, t => { heart(t, 0.2); return 2.0; });
    every(my, 5, t => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), d = rnd(3.5, 4.5); s.buffer = noiseBuf(d + 0.5); f.type = 'bandpass'; f.Q.value = 12; f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(330, t + d * 0.4); f.frequency.linearRampToValueAtTime(230, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.075, t + d * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); out2(g, 0.7, 0.6); s.start(t); s.stop(t + d + 0.3); return rnd(10, 14); });
    every(my, 9, t => { const f = sc[pick([8, 9, 10])]; erhu(f, t, rnd(3, 4.2), 0.14, { from: f * 1.06, gl: 0.8, wet: 1 }); return rnd(18, 28); });
    every(my, 16, t => { ghost(sc[pick([11, 12, 13])], t, rnd(4.5, 7), 0.024); return rnd(25, 40); });
    every(my, 30, t => { luo(t, 0.04, true); return rnd(35, 52); });
    return nodes;
  }
  const V2 = { town: townV2, sad: sadV2, c1: graveV2, c2: forestV2, c3: caveV2, c4: mineV2, c5: swampV2, c6: iceV2, c7: marketV2, c8: templeV2, c9: netherV2, c10: abyssV2 };
  // 切换氛围：{ key: 'c1'…'c10'|'town'|'sad', kind, fight }
  function mood(m) {
    if (!m) return;
    const k = `${m.key}|${m.kind || ''}|${m.fight || ''}`;
    if (k === curKey && cur) return;
    curKey = k;
    if (!musicOn || !ensure()) return;
    const old = [...ambNodes, ...droneNodes];
    gen++; clearTimeout(phraseT); clearTimeout(percT);
    cur = moodDef(m); cur.kind = m.kind;
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), t);
    musicGain.gain.linearRampToValueAtTime(0.25, t + 0.4); musicGain.gain.linearRampToValueAtTime(0.85, t + 2);
    setTimeout(() => old.forEach(n => { try { n.stop(); } catch (e) {} }), 600);
    const my = gen; tm2.forEach(clearTimeout); tm2 = [];
    // 新写法（中式恐怖）：所有场景和打斗都走这里；m.old 只在测试里用来对比旧配乐
    if (!m.old) { bus2(); ambNodes = m.fight ? fightV2(my, cur, m.fight === 'boss') : (V2[m.key] || graveV2)(my, m.kind); droneNodes = []; return; }
    ambNodes = ambient(cur); droneNodes = m.fight ? [] : drone(cur);
    phraseT = setTimeout(() => phrase(my), 700);
    if (cur.perc) percT = setTimeout(() => perc(my), 300);
  }
  function startMusic() { if (!musicOn || !ensure()) return; const k = curKey; curKey = ''; if (k) { const [key, kind, fight] = k.split('|'); mood({ key, kind, fight }); } else mood({ key: 'town' }); }
  function stopMusic() {
    if (!ctx) return;
    gen++; clearTimeout(phraseT); clearTimeout(percT); tm2.forEach(clearTimeout); tm2 = []; cur = null;
    const t = ctx.currentTime, old = [...ambNodes, ...droneNodes]; ambNodes = []; droneNodes = [];
    musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value, t); musicGain.gain.linearRampToValueAtTime(0, t + 0.8);
    setTimeout(() => old.forEach(n => { try { n.stop(); } catch (e) {} }), 1000);
  }
  return {
    play, ensure, mood,
    audition(m) { curKey = ''; mood(m); },                 // 设置里的试听：不管现在在哪儿，直接放这一段
    tap() { return { ctx, master, musicGain }; },          // 测试用：录一段出来看电平和频谱
    set(sound, music) { soundOn = sound; musicOn = music; if (music) startMusic(); else stopMusic(); },
    startMusic,
  };
})();
