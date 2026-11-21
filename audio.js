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
    ambNodes = ambient(cur); droneNodes = m.fight ? [] : drone(cur);
    const my = gen;
    phraseT = setTimeout(() => phrase(my), 700);
    if (cur.perc) percT = setTimeout(() => perc(my), 300);
  }
  function startMusic() { if (!musicOn || !ensure()) return; const k = curKey; curKey = ''; if (k) { const [key, kind, fight] = k.split('|'); mood({ key, kind, fight }); } else mood({ key: 'town' }); }
  function stopMusic() {
    if (!ctx) return;
    gen++; clearTimeout(phraseT); clearTimeout(percT); cur = null;
    const t = ctx.currentTime, old = [...ambNodes, ...droneNodes]; ambNodes = []; droneNodes = [];
    musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value, t); musicGain.gain.linearRampToValueAtTime(0, t + 0.8);
    setTimeout(() => old.forEach(n => { try { n.stop(); } catch (e) {} }), 1000);
  }
  return {
    play, ensure, mood,
    set(sound, music) { soundOn = sound; musicOn = music; if (music) startMusic(); else stopMusic(); },
    startMusic,
  };
})();
