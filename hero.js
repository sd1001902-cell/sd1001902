// ============ 九幽回廊 · 主角骨架小人（侧身、不对称，按姿势逐帧画出来） ============
'use strict';
const HERO = (() => {
  const W = 56, H = 46, rad = d => d * Math.PI / 180;
  const dirv = a => [Math.sin(rad(a)), Math.cos(rad(a))];   // 0 朝下，90 朝前（右），180 朝上，-90 朝后
  const add = (p, v, k) => [p[0] + v[0] * (k == null ? 1 : k), p[1] + v[1] * (k == null ? 1 : k)];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = v => Math.hypot(v[0], v[1]);
  const K = '#140c0a';

  // ---------- 头像格子（12×12，朝右；ax/ay 是脖子接口） ----------
  const HEADS = {
    bz: { ax: 6, ay: 11, side: [
      '...H.HH.H...',
      '..HHHHHHHH..',
      '.HHHHHHHHHH.',
      'HHHHHHHHHHH.',
      'RRRRRRRRRRR.',
      'HHHHSSSSSSS.',
      'HHHSSSSKKSS.',
      '.HHSSSSKSSSS',
      '.HHSSSSSSSS.',
      '..HSSSSSSKS.',
      '...SSSSSSS..',
      '....SSSS....'], back: [
      '...H.HH.H...',
      '..HHHHHHHH..',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      'RRRRRRRRRRRR',
      '.HHHHRRHHHH.',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '..HHHHHHHH..',
      '...HHHHHH...',
      '....SSSS....',
      '....SSSS....'] },
    dao: { ax: 6, ay: 11, side: [
      '.....YY.....',
      '....YHHY....',
      '...HHHHHH...',
      '..HHHHHHHH..',
      '.HHHHHHHHHH.',
      '.HHHHSSSSSS.',
      '.HHHSSSKKSS.',
      '.HHHSSSKSSSS',
      '..HHSSSSSSS.',
      '..HHSSSSKSS.',
      '..HH.SSSSS..',
      '.....SSSS...'], back: [
      '.....YY.....',
      '....YHHY....',
      '...HHHHHH...',
      '..HHHHHHHH..',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '..HHHHHHHH..',
      '..HHHHHHHH..',
      '...HHHHHH...',
      '....SSSS....'] },
    hat: { ax: 8, ay: 11, side: [
      '.......TT.......',
      '.....TTTTTT.....',
      '...TTTTTTTTTT...',
      '.TTTTTTTTTTTTTT.',
      'TTTTTTTTTTTTTTTT',
      '....HHHssssY....',
      '....HHSSSSSYY...',
      '....HSSSSKSSY...',
      '....HSSSSSSSS...',
      '.....HSSSSSKS...',
      '......SSSSSS....',
      '.......SSSS.....'], back: [
      '.......TT.......',
      '.....TTTTTT.....',
      '...TTTTTTTTTT...',
      '.TTTTTTTTTTTTTT.',
      'TTTTTTTTTTTTTTTT',
      '....HHHHHHHH....',
      '....HHHHHHHH....',
      '....HHHHHHHH....',
      '.....HHHHHH.....',
      '.....HHHHHH.....',
      '......SSSS......',
      '......SSSS......'] },
    hood: { ax: 6, ay: 11, side: [
      '............',
      '...HHHHHH...',
      '..HHHHHHHH..',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHHH',
      '.HHHHSSSSSH.',
      '.HHHSSSKRSSH',
      '.HHHHBBBBBBB',
      '.HHHHBBBBBB.',
      '..HHHBBBBBB.',
      '..HHHHBBBB..',
      '....HHHH....'], back: [
      '............',
      '...HHHHHH...',
      '..HHHHHHHH..',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '.HHHHRRHHHH.',
      '.HHHHRRHHHH.',
      '.HHHHHHHHHH.',
      '.HHHHHHHHHH.',
      '..HHHHHHHH..',
      '..HHHHHHHH..',
      '....HHHH....'] },
    bald: { ax: 6, ay: 11, side: [
      '............',
      '....SSSS....',
      '..SSSSSSSS..',
      '.SSSSKSKSSS.',
      '.SSSSSSSSSS.',
      '.SSSSSSSSSSS',
      '.SSSSSSKKSS.',
      '.SsSSSSKSSSS',
      '..SSSSSSSSS.',
      '..SSSSSSKSS.',
      '...SSSSSSS..',
      '....SSSS....'], back: [
      '............',
      '....SSSS....',
      '..SSSSSSSS..',
      '.SSSKSSKSSS.',
      '.SSSSSSSSSS.',
      'sSSSSSSSSSSs',
      'sSSSSSSSSSSs',
      '.SSSSSSSSSS.',
      '..SSSSSSSS..',
      '...SSSSSS...',
      '....SSSS....',
      '....SSSS....'] },
    ngoc: { ax: 6, ay: 11, side: [
      '....HHHHG...',
      '..HHHHHHHG..',
      '.HHHHHHHHHH.',
      'HHHHHHHHHHH.',
      'HHHHHHHSSSH.',
      'HHHHHSSSSSS.',
      'HHHHSSSSKSS.',
      'HHHHSSSSKSSS',
      'HHHHSSSSSSS.',
      'HHHH.SSSSRS.',
      'HHH...SSSS..',
      'HH.....SS...'] },
    fox: { ax: 6, ay: 12, side: [
      '..HH....HH..',
      '..HOH..HOH..',
      '..HHHHHHHHG.',
      '.HHHHHHHHHH.',
      'HHHHHHHHHHH.',
      'HHHHHHHSSSH.',
      'HHHHHSSSSSS.',
      'HHHHSSSSKSS.',
      'HHHHSSSSKSSS',
      'HHHHSSSSSSS.',
      'HHHH.SSSSRS.',
      'HHH...SSSS..',
      'HH.....SS...'] },
    cap: { ax: 6, ay: 11, side: [
      '....TTTT....',
      '..TTTTTTTT..',
      '.TTTTTTTTTT.',
      'RTTTTTTTTTTT',
      'R.HHHHSSSSS.',
      'R.HHHSSSSSS.',
      '..HHHSSSKSS.',
      '..HHHSSSKSSS',
      '..HHHSSSSSS.',
      '..HH.SSSSRS.',
      '..H...SSSS..',
      '.......SS...'] },
    sage: { ax: 6, ay: 11, side: [
      '...TTTTTT...',
      '...TTTTTT...',
      '..TTTTTTTT..',
      '..HHHHHHHH..',
      '.HHHHSSSSSS.',
      '.HHHSSSWWSS.',
      '.HHHSSSKSSSS',
      '.HHHSSSSSSS.',
      '..HHSWWWWWS.',
      '..HH.WWWWW..',
      '.....WWWW...',
      '......WW....'] },
    smith: { ax: 6, ay: 11, side: [
      '............',
      '...HHHHHH...',
      '..HHHHHHHH..',
      '.HHHHHHHHHH.',
      '.HHHHSSSSSS.',
      '.HHHSSSKKSS.',
      '.HHHSSSKSSSS',
      '.HHSSSSSSSS.',
      '..HSSEEEEES.',
      '..HSSEEEEE..',
      '...SSEEEE...',
      '.....SS.....'] },
    mer: { ax: 6, ay: 11, side: [
      '.....Y......',
      '...RRRRR....',
      '..RRRRRRR...',
      '.RRRRRRRRR..',
      '.HHHHSSSSSS.',
      '.HHHSSSKKSS.',
      '.HHHSSSKSSSS',
      '.HHHSSSSSSS.',
      '..HHSSEEESS.',
      '..HH.SSSSS..',
      '.....SSSS...',
      '......SS....'] },
    vil: { ax: 6, ay: 11, side: [
      '............',
      '...TTTTTT...',
      '..TTTTTTTT..',
      '.TTTTTTTTTT.',
      '.HHHHSSSSSS.',
      '.HHHSSSKKSS.',
      '.HHHSSSKSSSS',
      '.HHHSSSSSSS.',
      '..HHSSSSKSS.',
      '..HH.SSSSS..',
      '.....SSSS...',
      '......SS....'] },
    old: { ax: 6, ay: 11, side: [
      '.....WW.....',
      '....WWWW....',
      '..WWWWWWWW..',
      '.WWWWWWWWWW.',
      '.WWWWSSSSSS.',
      '.WWWSSSWWSS.',
      '.WWWSSSKSSSS',
      '.WWWSSSSSSS.',
      '..WWSWWWWWS.',
      '..WW.WWWWW..',
      '.....WWWWW..',
      '......WWW...'] },
  };
  // 背影：只有侧脸的头，自动把脸涂成头发
  function backOf(H0, hairCh) {
    if (H0.back) return H0.back;
    const rows = H0.side.map(r => [...r]);
    for (let y = 0; y < rows.length - 2; y++) for (let x = 0; x < rows[y].length; x++) { const c = rows[y][x]; if (c === 'S' || c === 'K' || c === 'R' && y > 3 || c === 'E') rows[y][x] = hairCh; }
    return (H0.back = rows.map(r => r.join('')));
  }

  // ---------- 五个职业的样子 ----------
  const LOOK = {
    berserker: { head: 'bz', arms: 'bare', robe: 0, weapon: 'dao', tails: 'R',
      pal: { H: '#1a1414', R: '#c0281c', S: '#d9a27a', B: '#2a3a5a', D: '#3a2e2a', F: '#5a3a22', M: '#c8ccd6', m: '#f4f6fa', W: '#5a3a1a', Y: '#c9a13a', A: '#8a6a4a' } },
    mage: { head: 'dao', arms: 'wide', robe: 2, weapon: 'tsword', tails: 'A',
      pal: { H: '#1a1414', Y: '#e8c13a', S: '#e2b48a', B: '#2e4a7a', D: '#22304a', F: '#2a1a12', M: '#b0582a', m: '#e08a4a', W: '#6a2a14', R: '#c0281c', A: '#e8dfc8' } },
    necro: { head: 'hat', arms: 'sleeve', robe: 1, weapon: 'bell', tails: 0,
      pal: { H: '#1a1414', T: '#a8884a', S: '#d9b08a', B: '#2a2832', D: '#1e1c24', F: '#2a1a12', Y: '#e8c13a', M: '#d8b84a', m: '#fff0a0', W: '#4a2a14', R: '#8a1a14', A: '#6a5a3a' } },
    assassin: { head: 'hood', arms: 'sleeve', robe: 0, weapon: 'dagger', tails: 'R', dual: 1,
      pal: { H: '#1c1c26', B: '#24242e', R: '#d0283a', S: '#d9a27a', D: '#1a1a22', F: '#121218', M: '#c8d0e0', m: '#ffffff', W: '#3a2a2a', Y: '#8a8aa0', A: '#3a3a4a' } },
    paladin: { head: 'bald', arms: 'sleeve', robe: 2, weapon: 'staff', tails: 0, beads: 1,
      pal: { S: '#d9a27a', B: '#d0782a', D: '#8a3a14', F: '#3a2a1a', R: '#8a2a14', Y: '#e8c13a', M: '#e8c13a', m: '#fff2a8', W: '#4a2a14', A: '#5a2a14', H: '#d9a27a' } },
    // —— 同伴和常见人物（按原来用的小人图对上） ——
    ngoc: { head: 'ngoc', arms: 'sleeve', robe: 2, weapon: 'bottle', tails: 'H', slim: 1, oneHand: 1, palMap: { P: 'B', H: 'H', G: 'G', S: 'S', R: 'R' },
      pal: { H: '#1a1012', G: '#3fd18a', S: '#f2c8a8', B: '#e86a8a', R: '#ff6a8a', D: '#c84a6a', F: '#4a2a2a', M: '#5fd8a0', m: '#e8fff0', W: '#8a5a3a', A: '#3fd18a', Y: '#e8c13a' } },
    ngocfox: { head: 'fox', arms: 'sleeve', robe: 2, weapon: 'bottle', tails: 'H', fox: 1, slim: 1, oneHand: 1, palMap: {},
      pal: { H: '#ece8f4', O: '#ffb066', G: '#3fd18a', S: '#f2c8a8', B: '#f4f0ff', R: '#ff8aa0', D: '#d8d0e8', F: '#6a5a7a', M: '#9ad8ff', m: '#ffffff', W: '#8a5a3a', A: '#ffb066', Y: '#e8c13a' } },
    constable: { head: 'cap', arms: 'sleeve', robe: 0, weapon: 'sdao', tails: 'H', slim: 1, oneHand: 1, palMap: { R: 'R', S: 'S' },
      pal: { T: '#1c1c26', R: '#c0281c', H: '#1a1214', S: '#e8b898', B: '#2a2a3c', D: '#22222e', F: '#3a2418', M: '#c8ccd6', m: '#f4f6fa', W: '#5a3a1a', Y: '#c9a13a', A: '#c0281c' } },
    scholar: { head: 'sage', arms: 'wide', robe: 2, weapon: 'whisk', tails: 0, oneHand: 1, palMap: { B: 'B' },
      pal: { T: '#1a1a22', H: '#9a9aa0', W: '#ece8e0', S: '#e2b48a', B: '#8a9aa8', D: '#4a5460', F: '#2a1a12', P: '#f0ece0', R: '#2a5a4a', A: '#2a5a4a', Y: '#c9a13a' } },
    taoist: { head: 'dao', arms: 'wide', robe: 2, weapon: 'whisk', tails: 0, oneHand: 1, palMap: { B: 'B', H: 'H', S: 'S', Y: 'Y' },
      pal: { H: '#1a1414', Y: '#e8c13a', S: '#e2b48a', B: '#e8e4d8', D: '#5a5448', F: '#2a1a12', P: '#f0ece0', W: '#6a4a2a', R: '#8a6a3a', A: '#8a6a3a' } },
    smith: { head: 'smith', arms: 'bare', robe: 0, weapon: 'hammer', tails: 0, apron: 1, oneHand: 1, palMap: { B: 'B', A: 'P', S: 'S' },
      pal: { H: '#2a1a14', E: '#4a2a1a', S: '#d9a27a', B: '#7a5a3a', P: '#5a3a22', D: '#3a2e2a', F: '#2a1a12', M: '#6a6a74', m: '#a8a8b4', W: '#5a3a1a', R: '#5a3a22', A: '#3a2a20' } },
    merchant: { head: 'mer', arms: 'wide', robe: 2, weapon: 'none', tails: 0, oneHand: 1, palMap: { R: 'R', S: 'S', Y: 'Y' },
      pal: { R: '#8a1a14', Y: '#e8c13a', H: '#1a1414', E: '#2a1a14', S: '#e2b48a', B: '#5a2a1a', D: '#3a2418', F: '#1a1210', R2: '#c9a13a', A: '#c9a13a' } },
    villager: { head: 'vil', arms: 'sleeve', robe: 0, weapon: 'none', tails: 0, oneHand: 1, palMap: { B: 'B', S: 'S', H: 'H' },
      pal: { T: '#6a5a3a', H: '#1a1414', S: '#d9a27a', B: '#5a6a7a', D: '#3a3a40', F: '#2a1a12', R: '#3a3a40', A: '#3a3a40' } },
    oldman: { head: 'old', arms: 'wide', robe: 2, weapon: 'cane', tails: 0, oneHand: 1, palMap: { B: 'B', S: 'S' },
      pal: { W: '#e8e4dc', S: '#d9a27a', B: '#7a6a5a', D: '#4a4038', F: '#2a1a12', R: '#4a3a2a', A: '#4a3a2a', M: '#6a4a2a', m: '#8a6a4a' } },
  };
  // 原来的小人图 → 新骨架造型（地图和战斗里用这个对应）
  const SPR_LOOK = { ngoc: 'ngoc', ngocfox: 'ngocfox', constable: 'constable', scholar: 'scholar', taoist: 'taoist', smith: 'smith', merchant: 'merchant', villager: 'villager', oldman: 'oldman', blade: 'berserker' };
  const lookOf = spr => SPR_LOOK[spr] || null;
  function mapPal(look, pal) {
    if (!pal) return null; const L = LOOK[look]; if (!L) return null; const pm = L.palMap || {}, out = {}; let n = 0;
    for (const k in pal) { const t = pm[k] || (look === 'berserker' ? k : null); if (t && L.pal[t] !== undefined) { out[t] = pal[k]; n++; } }
    return n ? out : null;
  }

  // ---------- 姿势：角度都是度数（0 下、90 前、180 上） ----------
  // x/y 整体挪；lean 上身前倾；ns/ne 近手肩肘；fs/fe 远手；nh/nk、fh/fk 两腿髋膝；w 兵器朝向；wl 兵器在前(f)还是身后(b)；two 双手握
  const BASE = { x: 0, y: 0, lean: 4, hx: 0, hy: 0, ns: 14, ne: 30, fs: -14, fe: 24, nh: 16, nk: 10, fh: -12, fk: 8, w: 200, wl: 'b', two: 0, tail: 0, view: 'side', blur: 0 };
  const POSES = {
    idle:  {},
    idle2: { y: 1, nk: 18, fk: 14, nh: 20, fh: -8, ne: 34, fe: 28, tail: 1 },
    rd:    { y: 1, lean: 12, nh: 34, nk: 30, fh: -26, fk: 12, ns: 60, ne: 40, fs: 30, fe: 60, w: 120, wl: 'f', two: 1, tail: 2 },
    wu:    { y: -1, lean: -10, nh: 24, nk: 16, fh: -20, fk: 6, ns: 168, ne: 12, fs: 150, fe: 20, w: 215, wl: 'b', two: 1, tail: -1, hx: -1 },
    st:    { x: 2, y: 2, lean: 26, nh: 56, nk: 44, fh: -44, fk: 4, ns: 86, ne: 4, fs: 60, fe: 20, w: 100, wl: 'f', two: 1, tail: 3, blur: 1 },
    ft:    { x: 3, y: 3, lean: 32, nh: 58, nk: 52, fh: -46, fk: 6, ns: 36, ne: 6, fs: 20, fe: 30, w: 32, wl: 'f', two: 1, tail: 3 },
    cs:    { lean: -6, nh: 20, nk: 10, fh: -18, fk: 6, ns: 128, ne: 22, fs: 70, fe: 70, w: 160, wl: 'f', tail: 1 },
    c2:    { y: -1, lean: -10, nh: 14, nk: 6, fh: -14, fk: 4, ns: 160, ne: 10, fs: 150, fe: 16, w: 180, wl: 'f', tail: 2 },
    ht:    { x: -2, y: 1, lean: -22, hx: -1, nh: -6, nk: 24, fh: -30, fk: 18, ns: -40, ne: 50, fs: -60, fe: 40, w: 240, wl: 'b', tail: -2 },
    bk:    { y: 1, lean: 6, nh: 26, nk: 22, fh: -24, fk: 10, ns: 70, ne: 70, fs: 50, fe: 80, w: 172, wl: 'f', two: 1 },
    vi:    { y: -1, lean: -6, nh: 22, nk: 8, fh: -16, fk: 4, ns: 172, ne: 6, fs: -30, fe: 50, w: 180, wl: 'f', tail: 2 },
    ds:    { x: 2, y: 3, lean: 40, nh: 70, nk: 60, fh: -60, fk: 30, ns: -50, ne: 20, fs: -70, fe: 20, w: 250, wl: 'b', tail: 4 },
    kn:    { y: 6, lean: 18, nh: 70, nk: 110, fh: -10, fk: 100, ns: 30, ne: 40, fs: 10, fe: 30, w: 150, wl: 'f', tail: 0 },
    w0:    { nh: 30, nk: 6, fh: -26, fk: 20, ns: -22, ne: 30, fs: 26, fe: 30, tail: 1 },
    w1:    { y: -1, nh: 6, nk: 30, fh: 0, fk: 4, ns: 0, ne: 30, fs: 0, fe: 26, tail: 2 },
    w2:    { nh: -26, nk: 20, fh: 30, fk: 6, ns: 26, ne: 30, fs: -22, fe: 30, tail: 1 },
    w3:    { y: -1, nh: 0, nk: 4, fh: 6, fk: 30, ns: 0, ne: 30, fs: 0, fe: 26, tail: 2 },
    // —— 招式专用 ——
    jp:    { y: -5, lean: -6, nh: 72, nk: 115, fh: 24, fk: 105, ns: 170, ne: 10, fs: 150, fe: 20, w: 205, wl: 'b', two: 1, tail: -2 },     // 跳起举刀
    sl:    { x: 2, y: 5, lean: 42, nh: 72, nk: 92, fh: -52, fk: 18, ns: 40, ne: 0, fs: 30, fe: 20, w: 18, wl: 'f', two: 1, tail: 4, blur: 1 },   // 砸地
    up:    { y: -1, lean: -14, nh: 22, nk: 10, fh: -32, fk: 10, ns: 152, ne: 0, fs: 112, fe: 20, w: 168, wl: 'f', two: 1, tail: 1, blur: 1 },   // 上挑
    th:    { x: 1, y: 1, lean: 18, nh: 46, nk: 30, fh: -34, fk: 8, ns: 102, ne: -8, fs: -52, fe: 30, w: 104, wl: 'f', tail: 3 },             // 甩出（符、镖、钉）
    pt:    { lean: -4, nh: 20, nk: 8, fh: -16, fk: 6, ns: 140, ne: 0, fs: 72, fe: 96, w: 150, wl: 'f', tail: 1 },                             // 剑指
    pr:    { lean: 2, nh: 10, nk: 6, fh: -10, fk: 4, ns: 66, ne: 104, fs: 58, fe: 112, w: 176, wl: 'b', tail: 0 },                            // 合十
    md:    { y: 6, lean: -4, nh: 82, nk: 122, fh: -8, fk: 112, ns: 150, ne: 10, fs: 140, fe: 20, w: 180, wl: 'f', tail: 1 },                 // 跪地结印
    pm:    { x: 2, y: 2, lean: 20, nh: 50, nk: 40, fh: -40, fk: 6, ns: 92, ne: 0, fs: -40, fe: 60, w: 210, wl: 'b', tail: 3 },               // 出掌
    rr:    { lean: -14, hy: -1, nh: 30, nk: 14, fh: -26, fk: 8, ns: -50, ne: 40, fs: -62, fe: 40, w: 235, wl: 'b', tail: 3 },                // 怒吼
    // —— 国风样板：赶尸人摇铃、待机小动作 ——
    ya:    { y: -1, lean: -9, nh: 18, nk: 8, fh: -16, fk: 4, ns: 166, ne: 0, fs: 72, fe: 100, w: -42, wl: 'f', tail: 1 },                   // 举铃·往后荡
    yb:    { y: -1, lean: 3, nh: 22, nk: 12, fh: -18, fk: 4, ns: 150, ne: 8, fs: 72, fe: 100, w: 62, wl: 'f', tail: 2 },                    // 举铃·往前荡
    yc:    { x: 1, y: 1, lean: 16, nh: 44, nk: 30, fh: -32, fk: 8, ns: 100, ne: -6, fs: -40, fe: 50, w: 78, wl: 'f', tail: 3 },             // 落铃·指向妖物
    ib:    { lean: 3, hy: 1, ns: 78, ne: 74, w: 4, wl: 'f' },                                                                               // 待机：把铃提到眼前看一眼
    ic:    { lean: 2, ns: 80, ne: 70, w: -30, wl: 'f' },                                                                                    // 待机：提着铃轻轻晃——往后
    id:    { lean: 2, ns: 80, ne: 70, w: 36, wl: 'f' },                                                                                     // 待机：提着铃轻轻晃——往前
    // —— 国风：另外四个职业的待机小动作 ——
    kd:    { lean: -4, ns: 152, ne: 68, w: 250, wl: 'b', fs: -10, fe: 30 },                                                                 // 狂刀客：把刀往肩上一扛
    mo:    { lean: 8, ns: 52, ne: 50, w: 100, wl: 'f', two: 1 },                                                                            // 狂刀客：横刀抹一把
    z1:    { ns: 58, ne: 70, w: 120, wl: 'f' },                                                                                             // 刺客：转匕首——刀尖朝前
    z2:    { ns: 58, ne: 70, w: 300, wl: 'f' },                                                                                             // 刺客：转匕首——刀尖朝后
    ride:  { lean: 3, nh: 82, nk: 78, fh: 74, fk: 70, ns: 26, ne: 46, fs: 34, fe: 40 },                                                    // 骑在坐骑上：两腿往前跨着
    lk:    { lean: -3, hx: -1 },                                                                                                            // 回头看一眼（手上照站姿）
    b0: { view: 'back', walk: 0 }, b1: { view: 'back', walk: 1, y: -1 }, b2: { view: 'back', walk: 2 }, b3: { view: 'back', walk: 3, y: -1 },
  };
  // 各职业的修正：武器握法不一样
  const TWEAK = {
    berserker: { jp: { w: 205 }, sl: { w: 30 }, up: { w: 165 }, th: { w: 110, two: 0 }, pt: { w: 160 }, pr: { w: 200, wl: 'b' }, md: { w: 30, ns: 50, ne: 0, wl: 'f' }, rr: { w: 250 }, st: { w: 74, ns: 74, ne: 0, fs: 50, blur: 1 }, ft: { w: 24, ns: 30, ne: 0 }, idle: { w: 62, ns: 26, ne: 36, wl: 'f' }, idle2: { w: 60, ns: 26, ne: 40, wl: 'f' }, w0: { w: 62, ns: -6, ne: 40, wl: 'f' }, w1: { w: 62, ns: 8, ne: 40, wl: 'f' }, w2: { w: 62, ns: 26, ne: 40, wl: 'f' }, w3: { w: 62, ns: 8, ne: 40, wl: 'f' } },
    mage: { jp: { two: 0, w: 190 }, sl: { two: 0, w: 20, ns: 50 }, up: { two: 0 }, th: { w: 100 }, pt: { w: 175, ns: 160, ne: 0, fs: 88, fe: 0 }, pr: { w: 160, ns: 40, ne: 90, wl: 'f' }, md: { w: 170, ns: 160, ne: 0 }, pm: { w: 160, ns: -20, ne: 60, fs: 92, fe: 0, wl: 'f' }, rr: { w: 220 }, idle: { w: 160, ns: 30, ne: 60, wl: 'f' }, idle2: { w: 158, ns: 30, ne: 62, wl: 'f' }, rd: { two: 0, fs: 120, fe: 30 }, wu: { two: 0 }, st: { two: 0, fs: -40, fe: 30 }, ft: { two: 0, fs: -30 }, bk: { two: 0 },
      cs: { ns: 100, ne: 0, w: 95, fs: 150, fe: 10 }, c2: { ns: 150, ne: 0, w: 170, fs: 120, fe: 50 },
      w0: { w: 160, ns: 30, ne: 60, wl: 'f' }, w1: { w: 160, ns: 30, ne: 60, wl: 'f' }, w2: { w: 160, ns: 30, ne: 60, wl: 'f' }, w3: { w: 160, ns: 30, ne: 60, wl: 'f' } },
    necro: { jp: { two: 0, w: 200 }, sl: { two: 0, w: 10, ns: 30 }, up: { two: 0, w: 20 }, th: { w: 70, ns: 104, ne: -6 }, pt: { w: 30, ns: 132, ne: 0 }, pr: { w: 10, ns: 30, ne: 90, wl: 'f' }, md: { w: 20, ns: 165, ne: 0, fs: 150, fe: 10 }, pm: { w: 10, ns: -20, ne: 60, fs: 92, fe: 0, wl: 'f' }, rr: { w: 20, wl: 'f' }, idle: { w: 0, ns: 10, ne: 70, wl: 'f' }, idle2: { w: 0, ns: 10, ne: 74, wl: 'f' }, rd: { two: 0, w: 20, ns: 70, ne: 40, fs: 40, fe: 70 }, st: { two: 0, w: 30, ns: 100, ne: 10, fs: -30, fe: 40 },
      ft: { two: 0, w: 10 }, wu: { two: 0, w: 210 }, bk: { two: 0, w: 10 }, cs: { ns: 150, ne: 10, w: 20, fs: 90, fe: 40 }, c2: { ns: 170, ne: 0, w: 10, fs: 160, fe: 10 }, vi: { w: 10 },
      w0: { w: 0, ns: 10, ne: 70, wl: 'f' }, w1: { w: 0, ns: 10, ne: 70, wl: 'f' }, w2: { w: 0, ns: 10, ne: 70, wl: 'f' }, w3: { w: 0, ns: 10, ne: 70, wl: 'f' } },
    assassin: { jp: { two: 0, w: 200 }, sl: { two: 0, w: 20, ns: 40, ne: 0 }, up: { two: 0, w: 160 }, th: { w: 96 }, pt: { w: 150 }, pr: { w: 160, wl: 'f' }, md: { w: 150, ns: 120, ne: 20 }, pm: { w: 30, ns: -20, ne: 50, fs: 92, fe: 0, wl: 'f' }, rr: { w: 230 }, idle: { w: 20, ns: 20, ne: 50, wl: 'f', y: 1, nk: 20, fk: 14, lean: 10 }, idle2: { w: 18, ns: 20, ne: 54, wl: 'f', y: 2, nk: 26, fk: 18, lean: 12 },
      rd: { two: 0, w: 70, ns: 50, ne: 50, fs: 40, fe: 70, y: 3, nk: 50, fk: 30, lean: 20 }, wu: { two: 0, w: 200, ns: 150, ne: 30 }, st: { two: 0, w: 92, ns: 92, ne: 0, fs: -30, fe: 40 },
      ft: { two: 0, w: 60, ns: 60, ne: 0 }, bk: { two: 0, w: 150 }, cs: { w: 140, ns: 100, ne: 30, fs: 60, fe: 90 }, c2: { w: 170 }, vi: { w: 175 },
      w0: { w: 20, ns: -10, ne: 40, wl: 'f' }, w1: { w: 20, ns: 0, ne: 40, wl: 'f' }, w2: { w: 20, ns: 20, ne: 40, wl: 'f' }, w3: { w: 20, ns: 0, ne: 40, wl: 'f' } },
    paladin: { jp: { w: 200 }, sl: { w: 30 }, up: { w: 160 }, th: { w: 100, two: 0 }, pt: { w: 176, ns: 26, ne: 70, fs: 150, fe: 10, wl: 'f' }, pr: { w: 176, ns: 22, ne: 78, fs: 66, fe: 112, wl: 'f' }, md: { w: 176, ns: 30, ne: 60, fs: 160, fe: 10, wl: 'f' }, pm: { w: 176, ns: 22, ne: 70, fs: 92, fe: 0, wl: 'f' }, rr: { w: 176, ns: 26, ne: 70, wl: 'f' }, idle: { w: 176, ns: 26, ne: 70, wl: 'f' }, idle2: { w: 176, ns: 26, ne: 74, wl: 'f' }, rd: { w: 118 }, st: { w: 96 }, ft: { w: 60 }, wu: { w: 200 },
      cs: { ns: 80, ne: 70, w: 176, fs: 70, fe: 80, wl: 'b' }, c2: { ns: 20, ne: 80, w: 176, fs: 165, fe: 0, wl: 'f' }, vi: { w: 176, ns: 120, ne: 30 },
      w0: { w: 166, ns: 20, ne: 70, wl: 'f' }, w1: { w: 168, ns: 26, ne: 70, wl: 'f' }, w2: { w: 170, ns: 30, ne: 70, wl: 'f' }, w3: { w: 168, ns: 26, ne: 70, wl: 'f' } },
    ngoc: { idle: { w: 175, ns: 20, ne: 70, wl: 'f' }, rd: { w: 150, ns: 120, ne: 40 }, wu: { w: 200, ns: 170, ne: 20 }, st: { w: 110, ns: 100, ne: 0 }, ft: { w: 60, ns: 60, ne: 0 }, cs: { w: 170, ns: 140, ne: 10, fs: 110, fe: 40 }, c2: { w: 180 } },
    ngocfox: { idle: { w: 175, ns: 20, ne: 70, wl: 'f' }, rd: { w: 150, ns: 120, ne: 40 }, wu: { w: 200, ns: 170, ne: 20 }, st: { w: 110, ns: 100, ne: 0 }, ft: { w: 60, ns: 60, ne: 0 }, cs: { w: 170, ns: 140, ne: 10, fs: 110, fe: 40 }, c2: { w: 180 } },
    constable: { idle: { w: 25, ns: 18, ne: 30, wl: 'f' }, rd: { w: 100, ns: 60, ne: 30 }, st: { w: 80, ns: 80, ne: 0, blur: 1 }, ft: { w: 30, ns: 40, ne: 0 }, cs: { w: 150, ns: 110, ne: 20 } },
    scholar: { idle: { w: 160, ns: 30, ne: 80, wl: 'f' }, cs: { w: 150, ns: 120, ne: 20, fs: 60, fe: 80 }, rd: { w: 130, ns: 90, ne: 30 }, st: { w: 110, ns: 100, ne: 0 } },
    taoist: { idle: { w: 160, ns: 30, ne: 80, wl: 'f' }, cs: { w: 150, ns: 120, ne: 20, fs: 60, fe: 80 }, rd: { w: 130, ns: 90, ne: 30 }, st: { w: 110, ns: 100, ne: 0 } },
    smith: { idle: { w: 15, ns: 12, ne: 20, wl: 'f' }, rd: { w: 150, ns: 60, ne: 60 }, wu: { w: 210, ns: 170, ne: 20 }, st: { w: 80, ns: 80, ne: 0, blur: 1 }, ft: { w: 30, ns: 40, ne: 0 } },
    merchant: { idle: { ns: 40, ne: 90, fs: 30, fe: 100, lean: 0 } },
    villager: { idle: { ns: 6, ne: 20, fs: -6, fe: 18 } },
    oldman: { idle: { w: 4, ns: 32, ne: 8, wl: 'f', lean: 12, y: 1, nk: 16, fk: 12 }, idle2: { w: 4, ns: 32, ne: 10, wl: 'f', lean: 13, y: 1, nk: 18, fk: 14 } },
  };

  // ---------- 栅格化 ----------
  function newBuf() { return { G: Array.from({ length: H }, () => Array(W).fill('.')), O: Array.from({ length: H }, () => Array(W).fill(-1)) }; }
  function capPix(a, b, r0, r1) {
    const out = [], minx = Math.floor(Math.min(a[0], b[0]) - Math.max(r0, r1) - 1), maxx = Math.ceil(Math.max(a[0], b[0]) + Math.max(r0, r1) + 1);
    const miny = Math.floor(Math.min(a[1], b[1]) - Math.max(r0, r1) - 1), maxy = Math.ceil(Math.max(a[1], b[1]) + Math.max(r0, r1) + 1);
    const ab = sub(b, a), L2 = ab[0] * ab[0] + ab[1] * ab[1] || 1e-6;
    for (let y = Math.max(0, miny); y <= Math.min(H - 1, maxy); y++) for (let x = Math.max(0, minx); x <= Math.min(W - 1, maxx); x++) {
      const px = x + 0.5, py = y + 0.5; let t = ((px - a[0]) * ab[0] + (py - a[1]) * ab[1]) / L2; t = Math.max(0, Math.min(1, t));
      const cx = a[0] + ab[0] * t, cy = a[1] + ab[1] * t, r = r0 + (r1 - r0) * t;
      if (Math.hypot(px - cx, py - cy) <= r + 0.05) out.push([x, y]);
    }
    return out;
  }
  function polyPix(pts) {
    const out = [], xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(H - 1, Math.ceil(Math.max(...ys))); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(W - 1, Math.ceil(Math.max(...xs))); x++) {
      const px = x + 0.5, py = y + 0.5; let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; }
      if (inside) out.push([x, y]);
    }
    return out;
  }
  // 画一块：sep=true 时把压在下面的别的部件沿边描一圈深线（像素画的“选择性描边”）
  function put(buf, pix, ch, gid, sep) {
    const set = new Set(pix.map(([x, y]) => y * W + x));
    if (sep) for (const [x, y] of pix) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || set.has(ny * W + nx)) continue;
      const o = buf.O[ny][nx]; if (o >= 0 && o !== gid) buf.G[ny][nx] = 'K';
    }
    for (const [x, y] of pix) { buf.G[y][x] = ch; buf.O[y][x] = gid; }
  }
  function stamp(buf, rows, ox, oy, gid, map) {
    const pix = {};
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; const X = ox + x, Y = oy + y; if (X < 0 || Y < 0 || X >= W || Y >= H) return; const c = map && map[ch] || ch; (pix[c] = pix[c] || []).push([X, Y]); }));
    const all = [].concat(...Object.values(pix));
    put(buf, all, 'K', gid, true);   // 先描边分隔
    for (const c in pix) for (const [x, y] of pix[c]) { buf.G[y][x] = c; buf.O[y][x] = gid; }
  }
  function outline(buf) {
    const G = buf.G, out = G.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (G[y][x] !== '.') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (G[y + dy] || [])[x + dx]; if (q && q !== '.') { out[y][x] = 'K'; break; } }
    }
    buf.G = out; return buf;
  }
  // 两节手臂：已知肩膀和手要到的位置，算手肘（远手双手握刀用）
  function ik(s, t, a, b, bend) {
    let d = sub(t, s), L = len(d); const maxL = a + b - 0.05; if (L > maxL) { d = [d[0] / L * maxL, d[1] / L * maxL]; L = maxL; }
    const base = Math.atan2(d[1], d[0]), ca = Math.max(-1, Math.min(1, (a * a + L * L - b * b) / (2 * a * L))), ang = base + bend * Math.acos(ca);
    const e = [s[0] + Math.cos(ang) * a, s[1] + Math.sin(ang) * a]; return { e, h: add(s, d) };
  }

  // ---------- 兵器 ----------
  function weapon(buf, kind, hand, ang, gid, look, blur) {
    const d = dirv(ang), n = [d[1], -d[0]];   // n：刃口那一侧
    if (kind === 'dao') {
      put(buf, capPix(hand, add(hand, d, -3.2), 0.75, 0.75), 'W', gid, true);
      put(buf, capPix(add(add(hand, d, 1.1), n, -1.6), add(add(hand, d, 1.1), n, 1.6), 0.6, 0.6), 'Y', gid);
      put(buf, capPix(add(hand, d, 1.8), add(hand, d, 13.5), 1.0, 1.7), 'M', gid);
      put(buf, capPix(add(hand, d, 13.5), add(add(hand, d, 15.6), n, 0.8), 1.5, 0.3), 'M', gid);
      put(buf, capPix(add(add(hand, d, 3), n, 1.1), add(add(hand, d, 14), n, 1.5), 0.45, 0.45), 'm', gid);
      if (blur) for (let k = 1; k <= 3; k++) put(buf, capPix(add(add(hand, d, 6), n, -2.2 * k), add(add(hand, d, 14), n, -2.6 * k), 0.4, 0.4), 'Z', gid + 1);
      return add(hand, d, 15);
    }
    if (kind === 'tsword') {
      put(buf, capPix(hand, add(hand, d, -2.6), 0.7, 0.7), 'W', gid, true);
      put(buf, capPix(add(add(hand, d, 0.9), n, -1.3), add(add(hand, d, 0.9), n, 1.3), 0.55, 0.55), 'Y', gid);
      put(buf, capPix(add(hand, d, 1.5), add(hand, d, 11.5), 0.85, 0.85), 'M', gid);
      put(buf, capPix(add(hand, d, 11.5), add(hand, d, 12.8), 0.85, 0.2), 'M', gid);
      put(buf, capPix(add(add(hand, d, 2.5), n, 0.5), add(add(hand, d, 11), n, 0.5), 0.35, 0.35), 'm', gid);
      put(buf, capPix(add(hand, d, -2.6), add(add(hand, d, -4.5), [0, 1], 2.5), 0.5, 0.5), 'R', gid);   // 剑穗
      return add(hand, d, 12.5);
    }
    if (kind === 'bell') {
      put(buf, capPix(hand, add(hand, d, 3.2), 0.6, 0.6), 'W', gid, true);
      const c = add(hand, d, 5.2);
      put(buf, capPix(add(c, d, -1.4), add(c, d, 1.4), 1.3, 2.4), 'M', gid);
      put(buf, capPix(add(add(c, d, -0.6), n, 0.8), add(add(c, d, 0.6), n, 1.2), 0.45, 0.45), 'm', gid);
      put(buf, capPix(add(c, d, 2.6), add(c, d, 2.8), 0.6, 0.6), 'W', gid);
      put(buf, capPix(add(hand, d, -0.6), add(add(hand, d, -1.2), [0, 1], 3.5), 0.45, 0.45), 'Y', gid);   // 黄符
      return add(c, d, 2);
    }
    if (kind === 'dagger') {
      put(buf, capPix(hand, add(hand, d, -1.6), 0.65, 0.65), 'W', gid, true);
      put(buf, capPix(add(add(hand, d, 0.8), n, -1), add(add(hand, d, 0.8), n, 1), 0.5, 0.5), 'Y', gid);
      put(buf, capPix(add(hand, d, 1.3), add(hand, d, 6.6), 0.8, 0.3), 'M', gid);
      put(buf, capPix(add(add(hand, d, 1.8), n, 0.4), add(add(hand, d, 5.4), n, 0.3), 0.3, 0.3), 'm', gid);
      if (blur) put(buf, capPix(add(hand, d, -2), add(hand, d, -7), 0.4, 0.4), 'Z', gid + 1);
      return add(hand, d, 6.6);
    }
    if (kind === 'staff') {
      const a = add(hand, d, -10), b = add(hand, d, 15);
      put(buf, capPix(a, b, 0.75, 0.75), 'W', gid, true);
      const top = add(hand, d, 15.5);
      put(buf, capPix(add(top, d, 0.2), add(top, d, 2.6), 1.9, 1.9), 'M', gid);
      put(buf, capPix(add(top, d, 1.1), add(top, d, 1.7), 0.8, 0.8), '.', gid);
      put(buf, capPix(add(add(top, d, 0.5), n, 2.6), add(add(top, d, 1.5), n, 2.8), 0.6, 0.6), 'M', gid);
      put(buf, capPix(add(add(top, d, 0.5), n, -2.6), add(add(top, d, 1.5), n, -2.8), 0.6, 0.6), 'M', gid);
      put(buf, capPix(add(hand, d, -10.5), add(hand, d, -9.5), 0.8, 0.8), 'M', gid);
      return top;
    }
    if (kind === 'sdao') {
      put(buf, capPix(hand, add(hand, d, -2.4), 0.7, 0.7), 'W', gid, true);
      put(buf, capPix(add(add(hand, d, 0.9), n, -1.3), add(add(hand, d, 0.9), n, 1.3), 0.55, 0.55), 'Y', gid);
      put(buf, capPix(add(hand, d, 1.5), add(hand, d, 9.5), 0.9, 1.2), 'M', gid);
      put(buf, capPix(add(hand, d, 9.5), add(add(hand, d, 11), n, 0.6), 1.1, 0.3), 'M', gid);
      put(buf, capPix(add(add(hand, d, 2.5), n, 0.9), add(add(hand, d, 10), n, 1.1), 0.4, 0.4), 'm', gid);
      if (blur) for (let k = 1; k <= 2; k++) put(buf, capPix(add(add(hand, d, 4), n, -2 * k), add(add(hand, d, 10), n, -2.4 * k), 0.4, 0.4), 'Z', gid + 1);
      return add(hand, d, 11);
    }
    if (kind === 'bottle') {
      const c = add(hand, [0, -2.2]);
      put(buf, capPix(add(c, [0, 0.4]), add(c, [0, 0.6]), 1.9, 1.9), 'M', gid, true);
      put(buf, capPix(add(c, [0, -1.6]), add(c, [0, -2.8]), 0.7, 0.7), 'M', gid);
      put(buf, capPix(add(c, [0, -3.3]), add(c, [0, -3.5]), 0.7, 0.7), 'W', gid);
      put(buf, capPix(add(c, [-0.7, -0.2]), add(c, [-0.6, 0.3]), 0.4, 0.4), 'm', gid);
      return add(c, [0, -3.5]);
    }
    if (kind === 'whisk') {
      const top = add(hand, d, 5);
      put(buf, capPix(add(hand, d, -1), top, 0.6, 0.6), 'W', gid, true);
      for (let k = -1; k <= 1; k++) { const e = add(add(top, [k * 1.2 + 0.5, 3.5]), d, 1.5); put(buf, capPix(top, add(e, [k * 0.8, 3]), 0.7, 0.45), 'P', gid); }
      return top;
    }
    if (kind === 'hammer') {
      const top = add(hand, d, 7);
      put(buf, capPix(add(hand, d, -1.5), top, 0.65, 0.65), 'W', gid, true);
      put(buf, capPix(add(top, n, -2.6), add(top, n, 2.6), 1.6, 1.6), 'M', gid);
      put(buf, capPix(add(add(top, n, -2), d, -0.7), add(add(top, n, 2), d, -0.7), 0.4, 0.4), 'm', gid);
      if (blur) put(buf, capPix(add(add(top, n, -4), d, -2), add(add(top, n, -6), d, -5), 0.5, 0.5), 'Z', gid + 1);
      return top;
    }
    if (kind === 'cane') {
      const end = add(hand, d, 11.5);
      put(buf, capPix(add(hand, d, -1.5), end, 0.6, 0.55), 'M', gid, true);
      put(buf, capPix(add(hand, d, -1.8), add(add(hand, d, -1.8), n, 1.4), 0.7, 0.7), 'M', gid);
      return end;
    }
    return hand;
  }

  // ---------- 拼一帧 ----------
  function build(cls, pose) {
    const L = LOOK[cls] || LOOK.berserker, TW = TWEAK[cls] || {}, TI = TW.idle || {}, inh = {};
    if (/^(idle2|w\d|lk|ride)$/.test(pose) && !TW[pose]) for (const k of ['w', 'wl', 'ne', 'lean', 'y']) if (TI[k] !== undefined && (k !== 'y' || pose === 'idle2')) inh[k] = TI[k] + (k === 'y' && pose === 'idle2' ? 0 : 0);
    const P = Object.assign({}, BASE, POSES[pose] || POSES.idle, inh, TW[pose] || {});
    const back = newBuf(), body = newBuf(), front = newBuf();
    const hip = [28 + P.x, 33 + P.y], tv = [Math.sin(rad(P.lean)), -Math.cos(rad(P.lean))], neck = add(hip, tv, 7);
    const nSh = add(neck, [0.9, 1.4]), fSh = add(neck, [-1.4, 1.6]);
    const nHp = add(hip, [1, 0]), fHp = add(hip, [-1.1, 0]);
    const leg = (hp, a, k) => { const kn = add(hp, dirv(a), 5.4), an = add(kn, dirv(a - k), 5.6); return { kn, an }; };
    const NL = leg(nHp, P.nh, P.nk), FL = leg(fHp, P.fh, P.fk);
    const arm = (sh, a, e) => { const el = add(sh, dirv(a), 4), hd = add(el, dirv(a + e), 3.6); return { el, hd }; };
    const NA = arm(nSh, P.ns, P.ne); let FA = arm(fSh, P.fs, P.fe);
    const wd = dirv(P.w);
    if (P.two && !L.oneHand && L.weapon !== 'bell') { const tgt = add(NA.hd, wd, -2.4); const r = ik(fSh, tgt, 4, 3.6, -1); FA = { el: r.e, hd: r.h }; }
    let gid = 1;
    const sleeveR = L.arms === 'wide' ? [1.3, 2.4] : L.arms === 'bare' ? [1.2, 1.0] : L.slim ? [1.1, 1.0] : [1.3, 1.2];
    const tR = L.slim ? [2.5, 2.8] : [2.9, 3.3];
    const armCh = L.arms === 'bare' ? 'S' : 'B';
    // 远侧：手、腿（暗一档）
    const drawArm = (buf, A, sh, far) => {
      const g = gid++, c = far ? armCh.toLowerCase() : armCh;
      put(buf, capPix(sh, A.el, 1.35, sleeveR[0]), c, g, !far);
      put(buf, capPix(A.el, A.hd, sleeveR[0], sleeveR[1]), c, g);
      if (L.arms === 'bare') put(buf, capPix(add(A.el, sub(A.hd, A.el), 0.55), A.hd, 1.15, 1.15), far ? 'w' : 'A', g);   // 护腕
      put(buf, capPix(A.hd, A.hd, 1.15, 1.15), far ? 's' : 'S', g);
    };
    const drawLeg = (buf, hp, Lg, far, a, k) => {
      const g = gid++, c = far ? 'd' : 'D', f = far ? 'f' : 'F';
      put(buf, capPix(hp, Lg.kn, 1.9, 1.6), c, g, !far);
      put(buf, capPix(Lg.kn, Lg.an, 1.6, 1.3), c, g);
      const toe = add(Lg.an, dirv(a - k + 90), 2.3);
      put(buf, capPix(Lg.an, [toe[0], Math.max(toe[1], Lg.an[1] - 0.6)], 1.15, 1.0), f, g);
    };
    if (P.view === 'back') {
      // 背影：两条腿并排、两只手在两边、背后的头
      const lh = add(hip, [-1.6, 0]), rh = add(hip, [1.6, 0]);
      const lg = (hp, lift) => ({ kn: add(hp, [0, 5.4 - lift]), an: add(hp, [0, 11 - lift * 1.6]) });
      const ph = P.walk || 0, l1 = ph === 1 ? 1.4 : 0, l2 = ph === 3 ? 1.4 : 0;
      for (const [hp, lift] of [[lh, l1], [rh, l2]]) { const g = gid++, Lg = lg(hp, lift); put(body, capPix(hp, Lg.kn, 1.8, 1.6), 'D', g, true); put(body, capPix(Lg.kn, Lg.an, 1.6, 1.3), 'D', g); put(body, capPix(add(Lg.an, [0, -0.3]), add(Lg.an, [0, 0.4]), 1.3, 1.3), 'F', g); }
      const g = gid++; put(body, capPix(hip, neck, 3.2, 3.6), 'B', g, true);
      if (L.robe) put(body, polyPix([add(hip, [-3.4, -0.5]), add(hip, [3.4, -0.5]), add(hip, [4.6, 4 + L.robe * 2.4]), add(hip, [-4.6, 4 + L.robe * 2.4])]), 'B', g);
      put(body, capPix(add(hip, [-3, -0.3]), add(hip, [3, -0.3]), 0.8, 0.8), 'R', g);
      for (const sx of [-1, 1]) { const sh = add(neck, [3 * sx, 1.4]), sw = ph === 1 ? sx : ph === 3 ? -sx : 0, el = add(sh, [0.6 * sx, 3.6 + sw * 0.4]), hd = add(el, [0.2 * sx, 3.2]); const g2 = gid++; put(body, capPix(sh, el, 1.3, sleeveR[0]), armCh, g2, true); put(body, capPix(el, hd, sleeveR[0], sleeveR[1]), armCh, g2); put(body, capPix(hd, hd, 1.1, 1.1), 'S', g2); }
      const Hd = HEADS[L.head]; stamp(body, Hd.back || backOf(Hd, L.head === 'old' ? 'W' : 'H'), Math.round(neck[0] - Hd.ax), Math.round(neck[1] - Hd.ay + 1), gid++);
      if (L.weapon === 'dao' || L.weapon === 'staff') weapon(back, L.weapon, add(neck, [2, 0]), 205, 50, L);
      return { back, body, front, hand: neck, tip: neck };
    }
    // 狐尾（九尾形态的 Ngoc）
    if (L.fox) for (let k = 0; k < 3; k++) { const g = gid++, root = add(hip, [-2, -1]), sw = P.tail * 0.6, mid = add(root, [-6 - k, -3 + k * 3 + sw]), tip = add(root, [-10 - k * 1.5, -8 + k * 5 + sw * 1.5]);
      put(body, capPix(root, mid, 1.4, 2.6), 'H', g, true); put(body, capPix(mid, tip, 2.6, 1.0), 'H', g); put(body, capPix(add(tip, sub(mid, tip), 0.25), tip, 1.2, 0.8), 'O', g); }
    // 远侧
    drawArm(body, FA, fSh, true);
    if (L.dual) weapon(body, 'dagger', FA.hd, P.w + 25, gid++, L);
    drawLeg(body, fHp, FL, true, P.fh, P.fk);
    // 头带、围巾飘带（在身后）
    const Hd = HEADS[L.head], hox = Math.round(neck[0] + P.hx - Hd.ax), hoy = Math.round(neck[1] + P.hy - Hd.ay);
    if (L.tails) {
      const g = gid++, root = [hox + 1, hoy + (L.head === 'hood' ? 9 : 4.5)], sw = P.tail;
      put(body, capPix(root, add(root, [-4.5 - Math.abs(sw) * 0.5, 1.5 + sw * 0.6]), 0.8, 0.6), L.tails, g);
      put(body, capPix(add(root, [0, 0.5]), add(root, [-6 - Math.abs(sw) * 0.6, 3.5 - sw * 0.4]), 0.7, 0.5), L.tails, g);
    }
    // 身体
    { const g = gid++;
      put(body, capPix(hip, neck, tR[0], tR[1]), 'B', g, true);
      if (L.robe) { const kn1 = NL.kn, kn2 = FL.kn, lo = L.robe === 2 ? 0.8 : 0.45, a1 = add(kn1, sub(NL.an, kn1), lo), a2 = add(kn2, sub(FL.an, kn2), lo);
        put(body, polyPix([add(hip, [-3.2, -1]), add(hip, [3.4, -1]), add(a1, [1.6, 0.6]), add(a2, [-1.8, 0.6])]), 'B', g); }
      put(body, capPix(add(hip, tv, 0.6), add(add(hip, tv, 0.6), [0, 0]), 2.9, 2.9), 'B', g);
      const sash = add(hip, tv, 0.8); put(body, capPix(add(sash, [-3, 0.3]), add(sash, [3, -0.3]), 0.75, 0.75), 'R', g);
      if (L.apron) put(body, polyPix([add(neck, [-1, 2.5]), add(neck, [3.4, 2.5]), add(add(NL.kn, [1.5, 0]), sub(hip, NL.kn), 0.15), add(hip, [-2.4, 3])]), 'P', g);
      if (L.beads) for (let k = 0; k < 5; k++) put(body, capPix(add(add(neck, [1.4, 1.6]), [-k * 0.7 + 0.3, k * 0.9]), add(add(neck, [1.4, 1.6]), [-k * 0.7 + 0.3, k * 0.9]), 0.5, 0.5), 'Y', g);
    }
    drawLeg(body, nHp, NL, false, P.nh, P.nk);
    stamp(body, Hd.side, hox, hoy, gid++);
    // 兵器
    const wb = P.wl === 'b' ? back : front;
    const tip = L.weapon === 'none' ? NA.hd : weapon(wb, L.weapon, NA.hd, P.w, 60, L, P.blur);
    if (P.wl === 'b') drawArm(body, NA, nSh, false);
    else { drawArm(body, NA, nSh, false); put(front, capPix(NA.hd, NA.hd, 1.15, 1.15), 'S', 70, true); }
    return { back, body, front, hand: NA.hd, tip };
  }

  // ---------- 上色 ----------
  function palOf(cls, over) {
    const L = LOOK[cls] || LOOK.berserker, p = Object.assign({ K }, L.pal, over || {});
    const dk = c => SPR.mixc(c, '#0a0608', 0.3);
    p.A = p.A || '#8a6a4a'; p.Z = p.Z || '#fff4dc'; p.b = dk(p.B); p.d = dk(p.D); p.f = dk(p.F); p.s = dk(p.S); p.w = dk(p.A);
    return p;
  }
  const HD_ON = () => !(typeof SAVE !== 'undefined' && SAVE && SAVE.hdOff);
  const cache = {};
  // 返回三层画布 + 手和兵器尖的位置（0~1 的比例）
  function frame(cls, pose, over) {
    const key = cls + '|' + pose + '|' + JSON.stringify(over || {}) + HD_ON();
    if (cache[key]) return cache[key];
    if (typeof document === 'undefined') return null;
    const f = build(cls, pose), pal = palOf(cls, over);
    const mk = b => { outline(b); return SPR.paint(b.G, pal, HD_ON()); };
    const out = { back: mk(f.back), body: mk(f.body), front: mk(f.front), hand: [f.hand[0] / W, f.hand[1] / H], tip: [f.tip[0] / W, f.tip[1] / H] };
    return (cache[key] = out);
  }
  const urls = {};
  function url(cls, pose, over) {
    const key = cls + '|' + pose + '|' + JSON.stringify(over || {}) + HD_ON();
    if (urls[key]) return urls[key];
    const F = frame(cls, pose, over); if (!F) return null;
    return (urls[key] = { back: F.back.toDataURL(), body: F.body.toDataURL(), front: F.front.toDataURL(), hand: F.hand, tip: F.tip });
  }
  // 三层叠成一张（地图上用）
  const flat = {};
  function cv(cls, pose, over) {
    const key = cls + '|' + pose + '|' + JSON.stringify(over || {}) + HD_ON();
    if (flat[key]) return flat[key];
    const F = frame(cls, pose, over); if (!F) return null;
    const c = document.createElement('canvas'); c.width = F.body.width; c.height = F.body.height; const g = c.getContext('2d');
    g.drawImage(F.back, 0, 0); g.drawImage(F.body, 0, 0); g.drawImage(F.front, 0, 0);
    return (flat[key] = c);
  }
  // 头像：截头和肩膀；大图截全身
  const por = {};
  function portrait(cls, mode, over) {
    const key = cls + mode + JSON.stringify(over || {}) + HD_ON(); if (por[key]) return por[key];
    const c0 = cv(cls, mode === 'full' ? 'rd' : 'idle', over); if (!c0) return '';
    const k = c0.width / W, [x, y, s] = mode === 'full' ? [6, 1, 44] : mode === 'stand' ? [10, 5, 36] : [19, 13, 19];
    const c = document.createElement('canvas'); c.width = s * k; c.height = s * k; c.getContext('2d').drawImage(c0, x * k, y * k, s * k, s * k, 0, 0, s * k, s * k);
    return (por[key] = c.toDataURL());
  }
  const has = cls => !!LOOK[cls];
  const POSE_NAMES = Object.keys(POSES);
  return { frame, url, cv, has, portrait, lookOf, mapPal, POSES: POSE_NAMES, LOOK, build, W, H };
})();
if (typeof window !== 'undefined') window.HERO = HERO;
