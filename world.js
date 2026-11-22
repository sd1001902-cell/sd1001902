// ============ 九幽回廊 · 大地图引擎（多场景，纯逻辑，可在 Node 里测试） ============
// 一章由多个场景组成（野外、室内、地下城、青石镇），场景之间靠「门」相连。
'use strict';
var W_ELITE = [6.24, 1.64], W_BOSS = [3.0, 2.7], W_NORM = [2, 0.85];   // 大地图：小怪约打 4–6 下，精英 20–25 下（2026-11 精英两次加强：血 3.0→4.8→6.24、攻 1.28→1.43→1.64，同级正常装要打得吃力，逼人去刷装备）
const W_SIGHT = 3.3, W_BELL = 6.5, W_BLOCK = '#oT^HCKX:';
// 特殊地形：% 蛛网（火把烧）  ~ 网桥（走过就塌）  : 深渊  * 岩浆（冷热交替）  " 毒沼  _ 冰面（会滑）
const wHasKey = (ch, k) => !!k && !!(wkeys()[k] || wstate(ch).flags[k] || wflags()[k]);
const wTerr = ch => (WMAPS[ch] && WMAPS[ch].terrain) || {};
// 网桥塌了以后：走 16 步或过 6 秒重新结好
function wBridgeDown(S, sc, x, y) { const b = S.pz.br && S.pz.br[wgk(sc, x, y)]; if (!b) return false; if (typeof b === 'number') return (S.pz.bc || 0) - b <= 16; return (S.pz.bc || 0) - b.s <= 16 && Date.now() - b.t < 6000; }
const wLavaHot = () => Math.floor(Date.now() / 2600) % 2 === 0;
const _wm = {}, _wi = {};
function wmap(ch, sc) {
  sc = sc || (SAVE.world && SAVE.world[wk(ch)] && SAVE.world[wk(ch)].v === 2 ? SAVE.world[wk(ch)].sc : WMAPS[ch].start);
  const key = ch + ':' + sc; if (_wm[key]) return _wm[key];
  const D = WMAPS[ch].scenes[sc], H = D.rows.length, Wd = D.rows[0].length, pts = {};
  D.rows.forEach((r, y) => [...r].forEach((c, x) => { if (D.pts[c]) (pts[c] = pts[c] || []).push({ x, y }); }));
  const dz = { id: sc, n: D.n, lv: D.lv || 1, mons: [], groups: 0, r: [0, 0, Wd - 1, H - 1] };
  const zoneAt = (x, y) => (D.zones || []).find(z => x >= z.r[0] && y >= z.r[1] && x <= z.r[2] && y <= z.r[3]) || dz;
  return (_wm[key] = { def: D, M: D, sc, W: Wd, H, pts, zoneAt, ch });
}
// 所有带 id 的地点：id → 场景和位置
function wIndex(ch) {
  if (_wi[ch]) return _wi[ch];
  const I = {};
  for (const sc in WMAPS[ch].scenes) { const m = wmap(ch, sc); for (const c in m.pts) { const P = m.def.pts[c]; if (P.id) I[P.id] = { sc, c, P, at: m.pts[c] }; } }
  return (_wi[ch] = I);
}
const wHas = ch => !!(typeof WMAPS !== 'undefined' && WMAPS[ch] && WQ[ch]);
function wTile(m, x, y) { return (x < 0 || y < 0 || x >= m.W || y >= m.H) ? '#' : m.M.rows[y][x]; }
const wkey = (x, y) => x + ',' + y;
const wgk = (sc, x, y) => sc + ':' + x + ',' + y;
const wdist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
// 修罗难度用另一份地图进度（第 ch+100 号）
const wk = ch => ch + (typeof SAVE !== 'undefined' && SAVE && SAVE.run && SAVE.run.world && SAVE.run.diff === 'nightmare' ? 100 : 0);
const wflags = () => (SAVE.wflags = SAVE.wflags || {});
// 前面章节做过的选择（比如第二章放走狼王）
const wPast = (ch, k) => !!(SAVE.world && SAVE.world[wk(ch)] && SAVE.world[wk(ch)].flags && SAVE.world[wk(ch)].flags[k]);
const wkeys = () => (SAVE.keys = SAVE.keys || {});
const wScenes = ch => Object.keys(WMAPS[ch].scenes);

// ---------------- 主线进度小工具（地图和任务数据里的 when 会用） ----------------
const wMainIdx = (ch, id) => WQ[ch].main.findIndex(m => m.id === id);
const mAt = (S, id) => { const m = WQ[S.ch].main[S.main]; return !!m && m.id === id; };
const mFrom = (S, id) => S.main >= wMainIdx(S.ch, id);
const mPast = (S, id) => S.main > wMainIdx(S.ch, id);
const sDone = (S, id) => !!S.side[id] && S.side[id].st === 'done';
const sOn = (S, id) => !!S.side[id] && S.side[id].st === 'on';

// ---------------- 存档 ----------------
function wstate(ch) {
  SAVE.world = SAVE.world || {};
  let S = SAVE.world[wk(ch)];
  if (S && S.v !== 2) { delete SAVE.world[wk(ch)]; S = null; if (SAVE.keys) delete SAVE.keys.zhaohun; }
  if (!S) {
    const D = WMAPS[ch], m = wmap(ch, D.start), st = m.pts[D.startPt][0];
    S = SAVE.world[wk(ch)] = { v: 2, ch, sc: D.start, pos: { x: st.x, y: st.y }, sd: {}, got: {}, flags: {}, main: 0, kc: 0, side: {}, camp: null, camps: [], nid: 1, pz: {} };
    wScene(ch); wReveal(ch);
  }
  return S;
}
// 每个场景自己的迷雾、妖物（第一次进入时生成）
function wScene(ch, sc) {
  const S = SAVE.world[wk(ch)]; sc = sc || S.sc;
  if (!S.sd[sc]) { const m = wmap(ch, sc); S.sd[sc] = { seen: '0'.repeat(m.W * m.H), mons: [], dead: {} }; wSpawnAll(ch, sc); }
  return S.sd[sc];
}
function wReveal(ch) {
  const m = wmap(ch), S = SAVE.world[wk(ch)], D = wScene(ch), p = S.pos, R = Math.ceil(W_SIGHT);
  const a = D.seen.split('');
  if (m.hasBox == null) m.hasBox = Object.values(m.def.pts).some(P => P.t === 'box');
  const room = m.def.lit || m.def.reveal || m.hasBox;     // 室内、推冰块的地方：一进门就全看得见
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    if (!room && (Math.abs(x - p.x) > R || Math.abs(y - p.y) > R)) continue;
    const dx = x - p.x, dy = y - p.y;
    if (room || dx * dx + dy * dy <= W_SIGHT * W_SIGHT) a[y * m.W + x] = '1';
  }
  D.seen = a.join('');
}
const wSeen = (ch, x, y) => { const m = wmap(ch); return x >= 0 && y >= 0 && x < m.W && y < m.H && wScene(ch).seen[y * m.W + x] === '1'; };
const wInSight = (ch, x, y) => { const S = SAVE.world[wk(ch)]; if (wmap(ch).def.lit) return true; const p = S.pos, dx = x - p.x, dy = y - p.y; return dx * dx + dy * dy <= W_SIGHT * W_SIGHT; };

// ---------------- 人物 ----------------
function wNpcs(ch, sc) {
  const S = wstate(ch), m = wmap(ch, sc), out = [];
  if (m.def.when && !m.def.when(S)) return out;   // 只在某段剧情才有人的场景（灯会、喜酒）
  for (const c in m.pts) { const P = m.def.pts[c]; if (P.t !== 'npc' || (P.when && !P.when(S))) continue;
    const p = m.pts[c][0]; out.push({ id: P.npc, x: p.x, y: p.y }); }
  return out;
}
function wTownNpcs(ch = 1) { if (!wHas(ch) || !WMAPS[ch].scenes.town) return []; return wNpcs(ch, 'town').map(n => n.id); }
const wNpcAt = (ch, x, y, sc) => wNpcs(ch, sc).find(n => n.x === x && n.y === y);
function wFindNpc(ch, id) {
  if (id === wCompNow(ch) && !wNpcs(ch).some(n => n.id === id)) { const S0 = wstate(ch); return { sc: S0.sc, x: S0.pos.x, y: S0.pos.y, comp: true }; }
  const S = wstate(ch), order = [S.sc, ...wScenes(ch).filter(s => s !== S.sc)];
  for (const sc of order) { const n = wNpcs(ch, sc).find(n => n.id === id); if (n) return { sc, x: n.x, y: n.y }; }
  return null;
}

// ---------------- 地点 ----------------
function wPt(ch, x, y, sc) { const m = wmap(ch, sc), c = wTile(m, x, y), d = m.def.pts[c]; return d ? { code: c, ...d } : null; }
function wPtVisible(ch, x, y, sc) {
  const S = wstate(ch), m = wmap(ch, sc), P = m.def.pts[wTile(m, x, y)]; if (!P) return false;
  sc = sc || S.sc;
  const g = S.got[wgk(sc, x, y)];
  if (P.when && P.t !== 'npc' && !P.when(S)) return false;
  switch (P.t) {
    case 'qitem': return !g && wGoalOpen(ch, { get: P.id });
    case 'clue': return !g && wGoalOpen(ch, { clue: P.grp });
    case 'herb': return !g && wGoalOpen(ch, { herb: P.grp });
    case 'chest': case 'event': return !g;
    case 'relic': return !g && !wkeys()[P.key];
    case 'qfight': return !g && wGoalOpen(ch, { fight: P.id });
    case 'qspot': return wGoalOpen(ch, { reach: P.id });
    case 'boss': return !S.flags['boss_' + P.id];
    case 'gate': return !S.flags[P.flag];
    case 'xintu': return g !== 2;
    default: return true;
  }
}
const wDoorOpen = (ch, P) => !P.need || (typeof P.need === 'function' ? !!P.need(wstate(ch)) : !!(wstate(ch).flags[P.need] || wflags()[P.need]));
// ---------------- 自动寻路不替你解谜 ----------------
// 蛛网（没烧开）、网桥（还没自己走过）、岩浆/毒沼/冰面（没有对应道具）都算谜题地形：前往、自动探索、长距离点地走都绕开，走到边上停下
let W_AUTOSOLVE = false;   // 机器人测试用：打开后自动寻路照旧穿过谜题
function wPuzzle(ch, x, y, sc) {
  if (W_AUTOSOLVE) return false;
  const S = wstate(ch), s = sc || S.sc, c = wTile(wmap(ch, s), x, y), T = wTerr(ch);
  if (c === '%') return !S.got[wgk(s, x, y)];
  if (c === '~') return !((S.pz.brs || {})[s] >= 8);
  if (c === '*') return !wHasKey(ch, T.lava);
  if (c === '"') return !wHasKey(ch, T.swamp);
  if (c === '_') return !wHasKey(ch, T.ice);
  const P = wmap(ch, s).def.pts[c]; if (P && P.t === 'gate' && P.box && !S.flags[P.flag]) return true;   // 还没推开的冰门
  return false;
}
const W_PUZ_N = { '%': '蛛网（用火把烧开）', '~': '网桥（踩过就塌）', '*': '岩浆（等它暗下去再过）', '"': '毒沼', '_': '冰面（一滑到底）' };
// 有巡逻的地方：自己摸过去一次之前，自动寻路不管用
function wWatchActive(ch, sc) { const S = wstate(ch), m = wmap(ch, sc); return Object.values(m.def.pts).some(P => P.t === 'watch' && (!P.when || P.when(S))); }
function wWatchBlock(ch) { if (W_AUTOSOLVE) return false; const S = wstate(ch); return wWatchActive(ch) && !(S.pz.sneak || {})[S.sc]; }
// 迷踪林这种有「迷路门」的地方：只认自己走过的门
function wDoorKnown(ch, sc, P) {
  if (W_AUTOSOLVE) return true;
  const m = wmap(ch, sc); if (!Object.values(m.def.pts).some(Q => Q.t === 'door' && Q.lost)) return true;
  return !!(wstate(ch).pz.ud || {})[sc + '>' + P.to + '@' + P.at];
}
// ---------------- 推冰块：推到冰眼上开门（冰面上会一直滑） ----------------
function wBoxes(ch, sc) {
  const S = wstate(ch), s = sc || S.sc; S.pz.box = S.pz.box || {};
  if (!S.pz.box[s]) { const m = wmap(ch, s), L = []; for (const c in m.pts) if (m.def.pts[c].t === 'box') for (const p of m.pts[c]) L.push({ x: p.x, y: p.y }); S.pz.box[s] = L; }
  return S.pz.box[s];
}
const wBoxAt = (ch, x, y, sc) => !W_AUTOSOLVE && wBoxes(ch, sc).some(b => b.x === x && b.y === y);
function wBoxSolved(ch, sc) { const S = wstate(ch), m = wmap(ch, sc); return Object.values(m.def.pts).filter(P => P.t === 'boxgoal').every(P => S.flags[P.flag]); }
function wPushBox(ch, x, y, from) {
  const S = wstate(ch), m = wmap(ch), b = wBoxes(ch).find(q => q.x === x && q.y === y); if (!b) return null;
  const dx = x - from.x, dy = y - from.y; if (dx && dy) return { blocked: true, acts: [] };
  const free = (a, c) => { if (!wPassHero(ch, a, c) || wBoxAt(ch, a, c) || wMonAt(ch, a, c) || wIsDoor(ch, a, c)) return false; const P = wPt(ch, a, c); return !P || P.t === 'boxgoal' || P.t === 'box'; };
  let nx = x + dx, ny = y + dy;
  if (!free(nx, ny)) return { blocked: true, acts: [{ toast: '推不动——那边有东西挡着' }] };
  let slid = 0; while (wTile(m, nx, ny) === '_' && free(nx + dx, ny + dy)) { nx += dx; ny += dy; slid++; }
  b.x = nx; b.y = ny; const acts = [{ sfx: 'step' }];
  if (slid) acts.push({ toast: '冰块「咕噜噜」地滑了出去' });
  const byFlag = {};
  for (const c in m.pts) { const P = m.def.pts[c]; if (P.t !== 'boxgoal') continue; (byFlag[P.flag] = byFlag[P.flag] || { P, pts: [] }).pts.push(...m.pts[c]); }
  for (const f in byFlag) { if (S.flags[f]) continue; const G = byFlag[f];
    if (G.pts.every(p => wBoxes(ch).some(q => q.x === p.x && q.y === p.y))) { S.flags[f] = 1; acts.push({ sfx: 'rare' }, { toast: G.P.done || '冰眼亮了——冰门「轰隆隆」地开了！' }); } }
  return { acts };
}
function wPassHero(ch, x, y, sc) {
  if (wBoxAt(ch, x, y, sc)) return false;
  const m = wmap(ch, sc), c = wTile(m, x, y), S = wstate(ch);
  if (W_BLOCK.includes(c) && !(m.def.pts[c] && m.def.pts[c].t === 'chest')) return false;   // 有的箱子用了 K 当代号：箱子能走上去
  if (c === 'R' && !m.def.pts.R) return !!S.flags.bar || !!S.flags.barsJammed;
  if (c === 'Q' && !m.def.pts.Q) return !S.flags.bar || !!S.flags.barsJammed;
  if (c === '%') return !!S.got[wgk(sc || S.sc, x, y)] || wHasKey(ch, wTerr(ch).web || 'torch');
  if (c === '~') return !wBridgeDown(S, sc || S.sc, x, y);
  if (c === '(') return W_AUTOSOLVE || !S.flags.yin;
  if (c === ')') return W_AUTOSOLVE || !!S.flags.yin;
  const P = m.def.pts[c];
  if (P) {
    if (P.t === 'xintu') return W_AUTOSOLVE || !!S.got[wgk(sc || S.sc, x, y)];
    if (P.t === 'gate' && !S.flags[P.flag] && !(P.box && W_AUTOSOLVE)) return false;
    if (P.t === 'boxreset') return false;
    if (P.t === 'lamp' && P.when && !P.when(S)) return true;
    if (P.t === 'stele' || P.t === 'sign' || P.t === 'board' || P.t === 'mini' || P.t === 'lamp' || P.t === 'watch' || (P.t === 'prop' && P.block !== false)) return false;
    if (P.t === 'door' && !wDoorOpen(ch, P)) return false;
  }
  return !wNpcAt(ch, x, y, sc);
}
function wPassMon(ch, x, y, sc) {
  if (!wPassHero(ch, x, y, sc)) return false;
  const c0 = wTile(wmap(ch, sc), x, y); if (c0 === '%' && !wstate(ch).got[wgk(sc || wstate(ch).sc, x, y)]) return false;
  const m = wmap(ch, sc), P = m.def.pts[wTile(m, x, y)];
  if (P && ['camp', 'boss', 'gate', 'qspot', 'grave', 'qfight', 'door', 'plate'].includes(P.t)) return false;
  return !wScene(ch, sc || SAVE.world[wk(ch)].sc).mons.some(mn => mn.x === x && mn.y === y);
}

// ---------------- 妖物 ----------------
function wNewMon(ch, o) { const S = SAVE.world[wk(ch)]; return { id: 'm' + (S.nid++), ...o, hx: o.x, hy: o.y }; }
function wSpawnZone(ch, sc, z, n, forceM) {
  const m = wmap(ch, sc), S = SAVE.world[wk(ch)], D = S.sd[sc], cand = [];
  const allPts = Object.values(m.pts).flat();
  for (let y = z.r[1]; y <= z.r[3]; y++) for (let x = z.r[0]; x <= z.r[2]; x++) {
    if (m.zoneAt(x, y) !== z) continue;
    const c = wTile(m, x, y); if (c !== '.' && c !== '=' && c !== ',') continue;
    if (!wPassMon(ch, x, y, sc)) continue;
    if (S.sc === sc && wdist({ x, y }, S.pos) < 5) continue;
    if (allPts.some(p => wdist(p, { x, y }) < 2)) continue;
    cand.push({ x, y });
  }
  for (let i = 0; i < n && cand.length; i++) {
    const p = cand.splice(RNG.i(0, cand.length - 1), 1)[0];
    const r = Math.random(), beh = r < (z.chase || 0) ? 'chase' : r < 0.55 ? 'patrol' : 'sleep';
    D.mons.push(wNewMon(ch, { x: p.x, y: p.y, z: z.id, m: forceM != null ? forceM : RNG.pick(z.mons), lv: z.lv + (RNG.ch(0.3) ? 1 : 0), beh }));
  }
}
const wEliteMon = (ch, P, p, code) => wNewMon(ch, { x: p.x, y: p.y, z: 'elite', m: P.mon, lv: P.lv, beh: 'guard', elite: 1, name: P.name, pal: P.pal, tag: P.tag, big: P.big, pt: code });
function wSpawnAll(ch, sc) {
  const m = wmap(ch, sc), D = SAVE.world[wk(ch)].sd[sc];
  for (const z of m.def.zones || []) if (z.groups) wSpawnZone(ch, sc, z, z.groups);
  for (const code in m.def.pts) { const P = m.def.pts[code]; if (P.t !== 'elite') continue;
    for (const p of m.pts[code] || []) D.mons.push(wEliteMon(ch, P, p, code)); }
  wSpawnTagged(ch, sc);
}
// 跟着剧情出现的妖物（比如跑掉的三具尸体）
function wSpawnTagged(ch, only) {
  const S = SAVE.world[wk(ch)];
  for (const sc of only ? [only] : wScenes(ch)) {
    const m = wmap(ch, sc);
    for (const code in m.def.pts) { const P = m.def.pts[code]; if (P.t !== 'walker' || !S.flags[P.on]) continue;
      (m.pts[code] || []).forEach((p, i) => {
        const k = 'sp_' + sc + code + i; if (S.flags[k]) return;
        const D = only ? S.sd[sc] : wScene(ch, sc); if (!D) return;
        S.flags[k] = 1; D.mons.push(wNewMon(ch, { x: p.x, y: p.y, z: 'walker', m: P.mon, lv: P.lv, beh: 'patrol', name: P.name, tag: P.tag, pal: P.pal }));
      }); }
  }
}
// 篝火休息：小妖和精英都重新出现
function wRespawn(ch) {
  const S = SAVE.world[wk(ch)], now = Date.now();
  for (const sc in S.sd) {
    const m = wmap(ch, sc), D = S.sd[sc];
    for (const z of m.def.zones || []) if (z.groups) { const have = D.mons.filter(mn => mn.z === z.id).length; if (have < z.groups) wSpawnZone(ch, sc, z, z.groups - have); }
    for (const id in D.dead) { const X = D.dead[id];
      const P = m.def.pts[X.pt]; if (!P) continue; const p = m.pts[X.pt][0];
      if (!D.mons.some(mn => mn.x === p.x && mn.y === p.y)) D.mons.push(wEliteMon(ch, P, p, X.pt));
      delete D.dead[id]; }
  }
}
// 任务要打的精英已经死了（还没刷新）：任务接到时让它重新出现，免得卡住
function wReviveFor(ch, g) {
  if (!g || (!g.kill && !g.drop)) return;
  const S = SAVE.world[wk(ch)];
  const want = P => (g.kill && P.tag === g.kill) || (g.drop && (g.mon || []).includes(P.mon));
  if (g.drop && Object.keys(S.sd).some(sc => S.sd[sc].mons.some(mn => (g.mon || []).includes(mn.m)))) return;
  for (const sc in S.sd) { const m = wmap(ch, sc), D = S.sd[sc];
    for (const id in D.dead) { const X = D.dead[id], P = m.def.pts[X.pt]; if (!P || !want(P)) continue; const p = m.pts[X.pt][0];
      if (!D.mons.some(mn => mn.x === p.x && mn.y === p.y)) D.mons.push(wEliteMon(ch, P, p, X.pt)); delete D.dead[id]; } }
}
// 掉落任务要打的那种小妖全被清光了（还没在篝火休息）：在有这种妖物的区域补一只，免得卡住
function wEnsureDropMons(ch) {
  const S = SAVE.world[wk(ch)], m0 = wMain(ch), gs = [];
  if (m0 && m0.goal.drop) gs.push(m0.goal);
  for (const q of WQ[ch].side) { const s = S.side[q.id]; if (s && s.st === 'on' && q.steps[s.step].goal.drop) gs.push(q.steps[s.step].goal); }
  for (const g of gs) {
    const ids = g.mon || [];
    if (Object.keys(S.sd).some(sc => S.sd[sc].mons.some(mn => ids.includes(mn.m)))) continue;
    let done = false;
    for (const sc of Object.keys(S.sd).sort((a, b) => (a === S.sc) - (b === S.sc))) { if (done) break;
      const mm = wmap(ch, sc);
      for (const z of mm.def.zones || []) { const hit = ids.find(i => z.mons.includes(i)); if (hit == null) continue;
        const before = S.sd[sc].mons.length; wSpawnZone(ch, sc, z, 2, hit); if (S.sd[sc].mons.length > before) { done = true; break; } }
    }
  }
}
const wMonAt = (ch, x, y) => wScene(ch).mons.find(mn => mn.x === x && mn.y === y);
// 妖物和主角叠在同一格（进门、醒来、刷新时可能发生）：把妖物挪到旁边空着的一格，不然点不到它、也打不起来
function wUnstackMons(ch) {
  const S = wstate(ch), D = wScene(ch);
  for (const mn of D.mons) { if (mn.x !== S.pos.x || mn.y !== S.pos.y) continue;
    let done = false;
    for (let r = 1; r <= 3 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = mn.x + dx, y = mn.y + dy;
      if (wPassMon(ch, x, y) && !D.mons.some(o => o !== mn && o.x === x && o.y === y)) { mn.x = x; mn.y = y; done = true; } } }
}
function wMoveMons(ch) {
  const S = SAVE.world[wk(ch)], hp = S.pos, D = wScene(ch);
  for (const mn of D.mons) {
    if (mn.beh === 'sleep' || mn.beh === 'guard') continue;
    if (Math.abs(mn.x - hp.x) + Math.abs(mn.y - hp.y) > 12) continue;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: mn.x + dx, y: mn.y + dy }));
    const d = wdist(mn, hp);
    let to = null;
    const scared = wkeys().wolftooth && !mn.elite && mn.lv <= (SAVE.chars[SAVE.cls] || { level: 1 }).level - 1;   // 狼王牙：弱小的妖物不敢扑上来
    if (mn.beh === 'chase' && d <= 5 && wInSight(ch, mn.x, mn.y) && !scared) {
      const opts = nb.filter(p => (p.x === hp.x && p.y === hp.y) || wPassMon(ch, p.x, p.y)).sort((a, b) => wdist(a, hp) - wdist(b, hp));
      if (opts.length && wdist(opts[0], hp) < d) to = opts[0];
    } else if (RNG.ch(0.45)) {
      const opts = nb.filter(p => wPassMon(ch, p.x, p.y) && Math.abs(p.x - mn.hx) + Math.abs(p.y - mn.hy) <= 3 && !(p.x === hp.x && p.y === hp.y) && !(scared && wdist(p, hp) <= 1));
      if (opts.length) to = RNG.pick(opts);
    }
    if (to) { mn.x = to.x; mn.y = to.y; }
  }
}

// ---------------- 好感度 ----------------
const AFF_WHO = { ngoc: 'Ngoc', zhen: '珍姑娘', liu: '刘师傅', kang: '康总管', long: '龙道长' };
const AFF_LV = ['陌生', '陌生', '相识', '相识', '熟络', '熟络', '信任', '信任', '知己', '知己', '生死之交'];
function wAff(id, d) { SAVE.aff = SAVE.aff || {}; const v = Math.max(0, Math.min(10, (SAVE.aff[id] || 0) + d)); SAVE.aff[id] = v; return v; }
const wAffOf = id => (SAVE.aff || {})[id] || 0;
function wAffActs(o) { const a = []; for (const k in o) { wAff(k, o[k]); a.push({ aff: [k, o[k]] }); } return a; }
// 对话里的选择、选择题的后果
function wFx(ch, o, run) {
  const S = wstate(ch), a = [];
  if (!o) return a;
  if (o.set) Object.assign(S.flags, o.set);
  if (o.key && !wkeys()[o.key]) { wkeys()[o.key] = 1; a.push({ toast: `得到「${W_KEYS[o.key].n}」——${W_KEYS[o.key].d}` }); }
  if (o.aff) a.push(...wAffActs(o.aff));
  if (o.gold) { SAVE.gold = Math.max(0, SAVE.gold + o.gold); if (run && o.gold > 0) run.goldGot += o.gold; a.push({ toast: `银两 ${o.gold > 0 ? '+' : ''}${o.gold}` }); }
  if (o.rw) { const r = wReward(ch, o.rw, run); if (r) a.push({ toast: r }); }
  if (o.mb) { SAVE.mb = Math.max(0, wMb() + o.mb); a.push({ toast: `冥币 ${o.mb > 0 ? '+' : ''}${o.mb}` }); }
  if (o.fight) a.push({ fight: { ...o.fight, first: 'e' }, key: {} });
  if (o.bump) a.push(...wBump(ch, o.bump[0], o.bump[1], run));   // 选了这一项，算完成某个目标（结局的分支要等玩家真选了才算）
  return a;
}
function wChoose(ch, id, i, run) { const o = CHOICES[id].opts[i], a = [];
  if (o.need && !wstate(ch).flags[o.need] && !wflags()[o.need] && !wkeys()[o.need]) return [{ dlg: o.nlines || [['narr', '……你想不出该怎么说。']] }].concat(wFx(ch, o.nfx, run)); if (o.lines) a.push({ dlg: wLines(ch, o.lines) }); return a.concat(wFx(ch, o, run)); }

// ---------------- 任务状态 ----------------
const wMain = ch => WQ[ch].main[wstate(ch).main];
function wMainGoal(ch, type) { const m = wMain(ch); return m && m.goal[type]; }
function wSideOn(ch, id, step) { const s = wstate(ch).side[id]; return !!s && s.st === 'on' && (step == null || s.step === step); }
// 某个目标（如 {get:'ledger'}）现在是否是进行中的任务目标
function wGoalOpen(ch, g) {
  const k = Object.keys(g)[0], v = g[k], m = wMain(ch);
  if (m && m.goal[k] === v) return true;
  const S = wstate(ch);
  return WQ[ch].side.some(q => { const s = S.side[q.id]; return s && s.st === 'on' && q.steps[s.step].goal[k] === v; });
}
function wPotBase() { const f = wflags(); return 3 + bLv('alchemist') + (f.dish1 ? 1 : 0) + (f.herb1 ? 1 : 0); }
function wReward(ch, rw, run) {
  if (!rw) return '';
  const cls = run ? run.cls : SAVE.cls, ch2 = SAVE.chars[cls], parts = [];
  if (rw.xp) { const qlv = ch >= 2 ? Math.max(CH_BAND[Math.min(ch, 10)][0], Math.min(CH_BAND[Math.min(ch, 10)][1], ch2.level)) : Math.min(ch2.level, MAX_LV - 1);   // 任务经验按本章等级算，刷高了等级也不会多给
    const x = Math.round(xpNeed(qlv) * rw.xp * (ch >= 2 ? (WMAPS[ch].qxp || 0.3) : 0.38)); const ups = gainXp(cls, x); if (run) run.xpGot += x; parts.push(`经验 +${x}${ups ? `（升到 ${ch2.level} 级！）` : ''}`); }
  if (rw.gold) { SAVE.gold += rw.gold; if (run) run.goldGot += rw.gold; parts.push(`银两 +${rw.gold}`); }
  if (rw.mb) { SAVE.mb = wMb() + rw.mb; parts.push(`冥币 +${rw.mb}`); }
  if (rw.item) { const it = storeItem(run && run.world ? run : null, makeItem({ ilvl: ch >= 2 ? chIlvl(ch, ch2.level) : ch2.level + 2, rarity: rw.item, slot: rw.slot, cls })); parts.push(`<b class="r-${it.rarity}">${it.name}</b>`); }
  if (rw.pot) { SAVE.potExtra = (SAVE.potExtra || 0) + rw.pot; if (run) run.potions += rw.pot; parts.push(`丹药上限 +${rw.pot}`); }
  if (rw.key) { wkeys()[rw.key] = 1; parts.push(`主线道具「${W_KEYS[rw.key].n}」`); }
  if (rw.flag) wflags()[rw.flag] = 1;
  if (rw.setw) Object.assign(wflags(), typeof rw.setw === 'function' ? rw.setw(wstate(ch)) : rw.setw);
  if (rw.eat && run) { const F = wEat(run, rw.eat); if (F) parts.push(`吃了「${F.n}」：${F.d}`); }
  if (rw.flag === 'longTown') { SAVE.comps = SAVE.comps || { ngoc: 1 }; if (!SAVE.comps.long) { SAVE.comps.long = 1; parts.push('龙道长可以做你的同伴了'); } }
  return parts.join('　');
}
// 康总管的美食图谱：出门前吃一道，管到下次在篝火边休息
const FOODS = [
  { id: 'zhouzi',  n: '醉仙楼酱肘子', flag: null,    d: '这一趟多带 1 颗丹药', pot: 1 },
  { id: 'nver',    n: '女儿红醉鸡',   flag: 'dish1', d: '速度 +8', st: { spd: 8 } },
  { id: 'songrong',n: '松茸烩野猪腿', flag: 'dish2', d: '最大气血 +12%', st: { hpPct: 12 } },
  { id: 'zhusun',  n: '竹荪炖鸡',     flag: 'dish3', d: '伤害 +10%', st: { dmgPct: 10 } },
  { id: 'lajiao',  n: '火焰窟水煮鱼', flag: 'dish4', d: '暴击率 +6%', st: { crit: 6 } },
  { id: 'tianluo', n: '紫苏炒田螺',   flag: 'dish5', d: '全抗 +12', st: { res: 12 } },
  { id: 'xuelian', n: '雪莲炖鸡',     flag: 'dish6', d: '吸血 +3%', st: { leech: 3 } },
];
const foodsOpen = () => FOODS.filter(f => !f.flag || wflags()[f.flag]);
function wEat(run, id) { const F = FOODS.find(f => f.id === id); if (!F || !run) return null; run.food = id; if (F.pot) run.potions += F.pot; run.hp = Math.min(runStats(run).maxHp, run.hp + runStats(run).maxHp * 0.2); return F; }
// ---------------- 交易：各章的摊子（鬼市、冰家村……） ----------------
const W_SHOPS = {};
const W_MINI_RW = {};   // 小游戏的奖励：W_MINI_RW[id](ch, 成绩) → 提示文字
const wMb = () => SAVE.mb || 0;
const wCurN = cur => cur === 'mb' ? wMb() : cur === 'shang' ? (SAVE.shang || 0) : SAVE.gold;
const wCurName = cur => cur === 'mb' ? '冥币' : cur === 'shang' ? '赏银' : '两';
function wPay(cur, n) { if (wCurN(cur) < n) return false; if (cur === 'mb') SAVE.mb = wMb() - n; else if (cur === 'shang') SAVE.shang = (SAVE.shang || 0) - n; else SAVE.gold -= n; return true; }
// 货架：每在篝火边歇一次换一批（daily），否则一直是这批
function wShopStock(ch, id) {
  const S = wstate(ch), SH = W_SHOPS[id]; S.shops = S.shops || {};
  const key = SH.daily ? (S.pz.restN || 0) : 0;
  let st = S.shops[id];
  if (!st || st.key !== key) st = S.shops[id] = { key, items: SH.stock(S, ch).filter(Boolean) };
  return st;
}
function wShopLv(ch) { const cls = SAVE.run ? SAVE.run.cls : SAVE.cls; return chIlvl(ch, SAVE.chars[cls].level); }
function wShopBuy(ch, id, i, run) {
  const S = wstate(ch), SH = W_SHOPS[id], st = wShopStock(ch, id), e = st.items[i]; if (!e) return { err: '没这样东西' };
  if (e.sold) return { err: '已经卖掉了' };
  if (e.show && !e.show(S)) return { err: '没这样东西' };
  if (e.need && !e.need(S)) return { err: e.needMsg || '现在还买不了' };
  if (e.k === 'exchange') { if (SAVE.gold < e.gold) return { err: '银两不够' }; SAVE.gold -= e.gold; SAVE.mb = wMb() + e.mb; return { ok: `${e.gold} 两换了 ${e.mb} 枚冥币`, acts: [] }; }
  if (e.k === 'consum' && (run && (run[e.id] || 0) >= (e.max || 9))) return { err: `最多带 ${e.max} 个` };
  if (!wPay(SH.cur, e.price)) return { err: `${wCurName(SH.cur) === '两' ? '银两' : wCurName(SH.cur)}不够` };
  const cls = run ? run.cls : SAVE.cls; let msg = '', item = null, acts = [];
  if (e.k === 'item') { item = storeItem(null, e.it); e.sold = true; msg = `买下了「${e.it.name}」`; }
  else if (e.k === 'gamble' || e.k === 'blind') {
    if (e.k === 'blind' && featureOn('gems') && Math.random() < 0.35) { const key = gemKey(RNG.pick(Object.keys(GEM_TYPES)), RNG.i(1, 2)); addGem(key); msg = `盒子里是一颗${gemName(key)}`; }
    else { const r = e.k === 'blind' ? RNG.w({ magic: 20, rare: 45, set: 20, legend: 15 }) : rollRarity('gamble', 0, 0);
      item = storeItem(null, makeItem({ slot: e.slot, ilvl: wShopLv(ch), rarity: r, cls })); msg = `开出来：「${item.name}」`; }
  }
  else if (e.k === 'gem') { addGem(e.key); e.sold = true; msg = `买下一颗${gemName(e.key)}`; }
  else if (e.k === 'food') { const first = !S.flags['ate_' + e.food], F = wEat(run, e.food); S.flags['ate_' + e.food] = 1; msg = F ? `吃了「${F.n}」：${F.d}（管到下次休息）` : '吃了'; if (first) acts = acts.concat(wBump(ch, 'eat', e.tag || e.food, run)); }
  else if (e.k === 'consum') { if (run) run[e.id] = (run[e.id] || 0) + 1; msg = `买了${e.n}（现在有 ${run ? run[e.id] : 1} 个）`; }
  else if (e.k === 'intel') { S.flags[e.flag] = 1; e.sold = true; msg = e.msg || '记下了'; }
  else if (e.k === 'key') { wkeys()[e.key] = 1; e.sold = true; msg = `得到「${W_KEYS[e.key].n}」——${W_KEYS[e.key].d}`; }
  else if (e.k === 'mats') { SAVE.mats += e.cnt; msg = `魂晶 +${e.cnt}`; }
  else if (e.k === 'forge') { const it0 = makeItem({ slot: e.slot, ilvl: wShopLv(ch), rarity: e.rar, cls }); if (e.sp) addSpecial(it0); item = storeItem(null, it0); e.sold = true; msg = `换到「${item.name}」${item.sp ? '（带特殊词条）' : ''}`; }
  else if (e.k === 'get') { S.flags['got_' + e.id] = 1; e.sold = true; msg = `买到「${e.n}」`; acts = acts.concat(wBump(ch, 'get', e.id, run)); }
  if (e.after) acts.unshift({ dlg: wLines(ch, e.after) });
  return { ok: msg, item, acts };
}
// 当铺：把储物箱里的东西换成钱
const wShopSellPrice = (SH, it) => Math.max(1, Math.round(sellPrice(it) * (SH.sellRate || 0.15)));
function wShopSell(ch, id, itemId) {
  const SH = W_SHOPS[id], it = SAVE.stash.find(x => x.id === itemId); if (!it || !SH.sell) return { err: '没这样东西' };
  const p = wShopSellPrice(SH, it); returnGems(it); SAVE.stash.splice(SAVE.stash.indexOf(it), 1);
  if (SH.cur === 'mb') SAVE.mb = wMb() + p; else SAVE.gold += p;
  return { ok: `「${it.name}」当了 ${p} ${wCurName(SH.cur)}` };
}
// 开光：随手洗掉一条词条，换一条新的
function wShopReroll(ch, id, itemId) {
  const SH = W_SHOPS[id], it = findOwned(itemId); if (!it || !SH.reroll) return { err: '没这样东西' };
  if (!it.aff || !it.aff.length) return { err: '这件东西没有可以开光的词条' };
  if (!wPay(SH.cur, SH.reroll)) return { err: '冥币不够' };
  const idx = RNG.i(0, it.aff.length - 1), old = it.aff[idx], keep = it.aff.filter((_, j) => j !== idx).map(a => a[0]).concat(Object.keys(it.imp || {}));
  const na = rollAffixes(1, it.ilvl, affMult(it), keep, false, it.slot)[0]; if (na) it.aff[idx] = na;
  return { ok: `「${fmtStat(old[0], old[1])}」→「${na ? fmtStat(na[0], na[1]) : '没变'}」` };
}
// ---------------- 悬赏榜：雷老虎的榜，每章丙、乙、甲三档 ----------------
const W_BOUNTY = {};   // W_BOUNTY[ch] = [{ id, tier: 1丙 2乙 3甲, n, mon, z（出没的区域）, lore, say, abs, half, flee, minions, pal, spd }]
const BTY_TIER = {
  1: { n: '丙等', lv: -1, hp: 3, atk: 2.6, shang: 15, xp: 0.35 },
  2: { n: '乙等', lv: 1, hp: 4, atk: 2.6, shang: 35, xp: 0.6 },
  3: { n: '甲等·首恶', lv: 3, hp: 4.2, atk: 2.5, shang: 80, xp: 1.2 } };
const BTY_PER_REST = 3;
const wBtyDef = (ch, id) => (W_BOUNTY[ch] || []).find(D => D.id === id);
function wBtyLv(ch) { const W = WMAPS[ch]; let lv = 1; for (const sc in W.scenes) { const d = W.scenes[sc]; if (d.lv) lv = Math.max(lv, d.lv); for (const c in d.pts || {}) if (d.pts[c].t === 'boss' && d.pts[c].lv) lv = Math.max(lv, d.pts[c].lv); } return lv; }
function wBtyZone(ch, D) { for (const sc of wScenes(ch)) { const z = (wmap(ch, sc).def.zones || []).find(z => z.id === D.z); if (z) return { sc, z }; } return null; }
function wBtyWhere(ch, D) { const Z = wBtyZone(ch, D); return Z ? `${WMAPS[ch].scenes[Z.sc].n}${Z.z.n && Z.z.n !== WMAPS[ch].scenes[Z.sc].n ? '·' + Z.z.n : ''}` : ''; }
// 榜单：甲等一直挂着（打掉为止）；丙、乙各两张，每在篝火边歇一次换一批；一轮最多接三张
function wBty(ch) {
  const S = wstate(ch); S.bty = S.bty || { on: {}, done: {}, r: -1, offer: [], took: 0 };
  const B = S.bty, r = S.pz.restN || 0;
  if (B.r !== r) { B.r = r; B.took = 0;
    const pick = (t, n) => RNG.shuffle((W_BOUNTY[ch] || []).filter(D => D.tier === t && !B.on[D.id] && wBtyOpen(ch, D))).slice(0, n).map(D => D.id);
    B.offer = [...pick(1, 2), ...pick(2, 2)]; }
  return B;
}
const wBtyOpen = (ch, D) => !D.when || D.when(wstate(ch));
function wBtyList(ch) {
  const B = wBty(ch), L = W_BOUNTY[ch] || [];
  return [...L.filter(D => D.tier === 3 && wBtyOpen(ch, D)), ...B.offer.map(id => wBtyDef(ch, id)).filter(Boolean), ...L.filter(D => B.on[D.id] && D.tier < 3 && !B.offer.includes(D.id))];
}
function wBtySpawn(ch, D) {
  const Z = wBtyZone(ch, D); if (!Z) return null;
  const S = wstate(ch), m = wmap(ch, Z.sc), Dd = wScene(ch, Z.sc), allPts = Object.values(m.pts).flat(), cand = [];
  for (let y = Z.z.r[1]; y <= Z.z.r[3]; y++) for (let x = Z.z.r[0]; x <= Z.z.r[2]; x++) {
    if (m.zoneAt(x, y) !== Z.z) continue; const c = wTile(m, x, y); if (c !== '.' && c !== '=' && c !== ',') continue;
    if (!wPassMon(ch, x, y, Z.sc) || allPts.some(p => wdist(p, { x, y }) < 2)) continue;
    if (S.sc === Z.sc && wdist({ x, y }, S.pos) < 6) continue; cand.push({ x, y }); }
  if (!cand.length) return null;
  cand.sort((a, b) => wdist(b, m.pts[Object.keys(m.pts).find(c => m.def.pts[c].t === 'camp')]?.[0] || { x: 0, y: 0 }) - wdist(a, m.pts[Object.keys(m.pts).find(c => m.def.pts[c].t === 'camp')]?.[0] || { x: 0, y: 0 }));
  const p = cand[RNG.i(0, Math.min(cand.length - 1, Math.floor(cand.length / 3)))];   // 离篝火远一点
  const mn = wNewMon(ch, { x: p.x, y: p.y, z: 'bty', m: D.mon, lv: wBtyLv(ch) + BTY_TIER[D.tier].lv, beh: 'guard', elite: 1, name: D.n, pal: D.pal, tag: 'bty_' + D.id, big: D.tier >= 2 ? 1.25 : 1.1, bty: D.id });
  Dd.mons = Dd.mons.filter(x => x.bty !== D.id); Dd.mons.push(mn); return { sc: Z.sc, mn };
}
function wBtyAccept(ch, id) {
  const B = wBty(ch), D = wBtyDef(ch, id); if (!D) return { err: '没这张榜' };
  if (B.on[id]) return { err: '已经在追了' };
  if (D.tier === 3 && B.done[id]) return { err: '这个已经伏法了' };
  if (B.took >= BTY_PER_REST) return { err: `这一轮最多接 ${BTY_PER_REST} 张。在篝火边歇一歇，榜会换一批` };
  const r = wBtySpawn(ch, D); if (!r) return { err: '这一带找不到它的踪迹' };
  B.took++; B.on[id] = 1; B.offer = B.offer.filter(x => x !== id);
  return { ok: `接下了「${D.n}」——${wBtyWhere(ch, D)}` };
}
function wBtyUnits(ch, run, enc) {
  const F = CHAPTERS[ch - 1], D = wBtyDef(ch, enc.bty), T = BTY_TIER[D.tier], base = F.mons[D.mon] || F.mons[0];
  const def = { ...base, n: D.n, abs: D.abs, half: D.half, pal: D.pal || base.pal, spd: (base.spd || 1) * (D.spd || 1) };
  const u = makeMonster(def, enc.lv, run, 'elite', D.affs || []);
  u.name = D.n; u.maxHp = u.hp = Math.round(u.hp * 3.4 * T.hp * (D.k || 1)); u.atk *= 1.28 * T.atk * Math.pow(D.k || 1, 0.6); u.bty = D.id; u.rare = D.tier >= 2;   // 悬赏单独定标，不跟路边精英一起变
  if (D.flee) u.fleeDef = D.flee;
  const units = [u];
  for (let i = 0; i < (D.minions || 0); i++) { const mm = makeMonster(F.mons[D.mm != null ? D.mm : D.mon] || base, Math.max(1, enc.lv - 2), run, 'normal'); units.push(mm); }
  return units;
}
function wBtyWon(ch, mn, run) {
  const S = wstate(ch), Dd = wScene(ch), D = wBtyDef(ch, mn.bty), T = BTY_TIER[D.tier], acts = [];
  if (run && run.btyEsc === mn.bty) {   // 打残了跑掉了：换个地方躲起来
    delete run.btyEsc; const r = wBtySpawn(ch, D);
    return [{ dlg: [['narr', `${D.n}夹着尾巴跑了。`], ['narr', r ? `看方向，是往${wBtyWhere(ch, D)}去了。下回出手要快。` : '跑得没影了。']] }];
  }
  Dd.mons = Dd.mons.filter(x => x.id !== mn.id);
  const B = wBty(ch), first = !B.done[D.id]; B.done[D.id] = (B.done[D.id] || 0) + 1; delete B.on[D.id];
  const postg = featureOn('bounty'), gold = T.shang * 10;   // 通关前赏银柜没开：赏银折成银两
  if (postg) SAVE.shang = (SAVE.shang || 0) + T.shang; else SAVE.gold += gold;
  const cls = run ? run.cls : SAVE.cls, L = chIlvl(ch, 99);
  let rar = D.tier === 1 ? 'rare' : D.tier === 2 ? (RNG.ch(0.4) ? 'set' : 'rare') : 'legend';
  let it = makeItem({ ilvl: L, rarity: rar, cls, slot: D.slot }); if (D.tier === 3 || (D.tier === 2 && RNG.ch(0.4))) addSpecial(it, D.sp);
  it = storeItem(run && run.world ? run : null, it);
  const rw = wReward(ch, { xp: T.xp * (first ? 1 : 0.6) }, run);
  if (D.end) acts.push({ dlg: wLines(ch, D.end) });
  acts.push({ toast: `悬赏「${D.n}」伏法！${postg ? `赏银 +${T.shang}` : `银两 +${gold}`}　${rw}　<b class="r-${it.rarity}">${it.name}</b>${it.sp ? '（带特殊词条）' : ''}` }, { sfx: 'rare' });
  return acts;
}
// 地图上的伤害（冻伤、冰锥）：不会打死人
function wHurt(run, pct) { const mx = runStats(run).maxHp, d = Math.round(mx * pct); const before = run.hp; run.hp = Math.max(1, run.hp - d); return before - run.hp; }
const W_KEYS = {
  zhaohun: { n: '招魂铃', d: '地图上能看到更远处的妖物，迷雾里的也能看见。', spr: 'fu' },
  shufang: { n: '书房钥匙', d: '县衙书房的铜钥匙，挂在惊堂木底下。', spr: 'key' },
  diary: { n: '县令手记', d: '「为官心得」。夹着一张纸：「五行相生，木为始」。', spr: 'scroll' },
  wolftooth: { n: '狼王牙', d: '比你等级低的小妖不敢主动扑上来。', spr: 'key' },
  guanyin: { n: '旧官印', d: '刘师傅当年在县衙用的官印。县令的衙役见了它，不敢上来护驾。', spr: 'i_ring' },
  jingtang: { n: '惊堂木', d: '县太爷升堂用的惊堂木。没了它，他拍不了桌子。', spr: 'key' },
  pingan: { n: '平安扣', d: '阿福小时候戴的。挡得住判官笔。', spr: 'i_amulet' },
};
// 计数类目标（打怪、找线索、采药、掉落、解谜）+1
function wBump(ch, k, v, run) {
  const S = wstate(ch), acts = [], m = wMain(ch);
  if (m && m.goal[k] === v) {
    S.kc++;
    if (S.kc >= (m.goal.n || 1)) acts.push(...wStepActs(ch, m, run));
    else acts.push({ toast: `${m.t}（${S.kc}/${m.goal.n}）` });
  }
  for (const q of WQ[ch].side) {
    const s = S.side[q.id]; if (!s || s.st !== 'on') continue;
    const st = q.steps[s.step]; if (st.goal[k] !== v) continue;
    s.n++;
    if (s.n >= (st.goal.n || 1)) { if (st.lines) acts.push({ dlg: st.lines }); acts.push(...wAdvanceSide(ch, q, run)); }
    else acts.push({ toast: `${q.t}（${s.n}/${st.goal.n}）` });
  }
  return acts;
}
function wCompleteMain(ch, run) {
  const S = wstate(ch), m = wMain(ch), acts = [];
  if (m.after) acts.push({ dlg: wLines(ch, m.after) });
  if (m.choiceAfter) acts.push({ choice: typeof m.choiceAfter === 'function' ? m.choiceAfter(S) : m.choiceAfter });
  Object.assign(S.flags, m.set || {});
  if (m.aff) acts.push(...wAffActs(m.aff));
  if (m.comp) { SAVE.comps = SAVE.comps || { ngoc: 1 }; if (!SAVE.comps[m.comp]) { SAVE.comps[m.comp] = 1; acts.push({ toast: `${COMPANIONS[m.comp].n}可以做你的同伴了（篝火边或出征页选择）` }); } }
  const r = wReward(ch, m.rw, run);
  acts.push({ toast: `完成主线「${m.t}」${r ? '　' + r : ''}` });
  if (m.startSide && !S.side[m.startSide]) { S.side[m.startSide] = { st: 'on', step: 0, n: 0 }; const q = WQ[ch].side.find(q => q.id === m.startSide); acts.push({ toast: `接到支线「${q.t}」` }); }
  S.main++; S.kc = 0;
  while (wMain(ch) && wMain(ch).skip && wMain(ch).skip(S)) S.main++;   // 前面章节已经办成的事，这一步跳过
  wSpawnTagged(ch); if (wMain(ch)) wReviveFor(ch, wMain(ch).goal);
  if (m.tele) { acts.push(...wEnter(ch, m.tele[0], m.tele[1])); if (m.tele[2]) { S.camp = m.tele[2]; if (!S.camps.includes(m.tele[2])) S.camps.push(m.tele[2]); } }
  if (typeof m.final === 'function' ? m.final(S) : m.final) { S.flags.done = 1; acts.push({ final: true }); }
  const nx = wMain(ch);
  if (nx && /^i/.test(nx.id) && !/^i/.test(m.id)) acts.push({ intro: 'inter' });   // 进入幕间：开场小动画
  if (nx && nx.auto && nx.goal.fight) {   // 接着就开打（开场第一场架）：不用先走到那个点上
    const e = wIndex(ch)[nx.goal.fight];
    if (e && e.P && e.P.enc) acts.push({ dlg: wLines(ch, nx.lines) || [] }, { fight: { ...e.P.enc, first: e.P.enc.first || 'p' }, key: { main: nx.id, pt: wgk(e.sc, e.at[0].x, e.at[0].y), boss: null, scripted: !!e.P.enc.scripted } });
  } else if (nx && nx.auto) acts.push(...wTalk(ch, nx.goal.talk, run));
  return acts;
}
function wAdvanceSide(ch, q, run) {
  const S = wstate(ch), s = S.side[q.id], acts = [];
  const st = q.steps[s.step];
  if (st.choice) acts.push({ choice: st.choice });
  if (st.set) Object.assign(S.flags, st.set);
  s.step++; s.n = 0;
  while (s.step < q.steps.length && q.steps[s.step].skipIf && q.steps[s.step].skipIf(S)) s.step++;
  if (s.step < q.steps.length) wReviveFor(ch, q.steps[s.step].goal);
  if (s.step >= q.steps.length) {
    s.st = 'done';
    if (q.aff) acts.push(...wAffActs(q.aff));
    acts.push({ toast: `完成支线「${q.t}」　${wReward(ch, q.rw, run)}` });
  } else acts.push({ toast: `支线「${q.t}」：${(q.steps[s.step].hint && SAVE.guide !== 'full' ? q.steps[s.step].hint : q.steps[s.step].d).replace('{n}', 0)}` });
  return acts;
}
// 主线步骤的对话 + 选择题 + 选择 + 完成
const wLines = (ch, L) => typeof L === 'function' ? L(wstate(ch)) : L;
function wStepActs(ch, m, run) {
  const acts = [];
  if (m.lines) acts.push({ dlg: wLines(ch, m.lines) });
  if (m.quiz) acts.push({ quiz: m.quiz });
  if (m.mini) acts.push({ mini: m.mini });
  if (m.choice) acts.push({ choice: m.choice });
  acts.push(...wCompleteMain(ch, run));
  return acts;
}
const wReachOk = (ch, m) => !m.escort || wstate(ch).flags.escort === m.escort;

// ---------------- 交互 ----------------
function wTalk(ch, npc, run) {
  const S = wstate(ch), m = wMain(ch);
  if (m && m.escort === npc && S.flags.escort !== npc) { S.flags.escort = npc; return [{ dlg: m.escortLines || [] }]; }
  if (m && m.goal.talk === npc) return wStepActs(ch, m, run);
  if (m && m.goal.pickTalk === npc && m.pickChoice) return [{ choice: typeof m.pickChoice === 'function' ? m.pickChoice(S) : m.pickChoice }];   // 选择还没选（比如刷新了页面）：再问一次
  if (m && m.goal.talks && m.goal.talks.includes(npc) && !S.pz['tk_' + m.id + '_' + npc]) {
    S.pz['tk_' + m.id + '_' + npc] = 1; S.kc++;
    const a = [{ dlg: wLines(ch, (m.tl || {})[npc]) || [] }];
    if (S.kc >= m.goal.talks.length) return a.concat(wStepActs(ch, m, run));
    return a.concat([{ toast: `${m.t}（${S.kc}/${m.goal.talks.length}）` }]);
  }
  for (const q of WQ[ch].side) {
    const s = S.side[q.id]; if (!s || s.st !== 'on') continue;
    const st = q.steps[s.step];
    if (st.goal.talk === npc && st.needKey && !wkeys()[st.needKey]) return [{ dlg: st.waitLines || [[npc, '东西还没拿到吧？']] }];
    if (st.goal.talk === npc && st.needF && !st.needF(S)) return [{ dlg: wLines(ch, st.waitLines) || [[npc, '还没好吧？']] }, ...(st.waitMini ? [{ mini: st.waitMini }] : [])];
    if (st.goal.talk === npc) { const a = []; if (st.lines) a.push({ dlg: wLines(ch, st.lines) }); if (st.quiz) a.push({ quiz: st.quiz }); if (st.mini) a.push({ mini: st.mini }); return a.concat(wAdvanceSide(ch, q, run)); }
    if (st.goal.waves && q.giver === npc) {   // 守卫：一波接一波
      const a = [{ dlg: st.lines || [] }], W = st.goal.waves;
      W.forEach((w, i) => { if (i && st.between && st.between[i - 1]) a.push({ dlg: st.between[i - 1] }); a.push({ fight: { ...w, first: 'e' }, key: i === W.length - 1 ? { side: q.id } : {} }); });
      return a;
    }
  }
  { const N0 = WNPC[npc]; if (N0 && N0.onTalk) { const r = N0.onTalk(S, ch, run); if (r) return r; } }
  for (const q of WQ[ch].side) {
    if (q.giver !== npc || S.side[q.id] || q.auto) continue;
    if (q.when && !q.when(S, S.side)) continue;
    S.side[q.id] = { st: 'on', step: 0, n: 0 };
    const st = q.steps[0]; wReviveFor(ch, st.goal);
    return [{ dlg: q.offer || [] }, { toast: `接到支线「${q.t}」：${(st.hint && SAVE.guide !== 'full' ? st.hint : st.d).replace('{n}', 0)}` }];
  }
  if (npc === 'kang' && wflags().foodbook && S.sc === 'town') return [{ dlg: [['kang', RNG.pick(['好兄弟！饿了吧？今天想吃点什么？', '来来来，后厨刚出锅的！', '吃饱了再出门！我请——不对，记账。'])]] }, { food: true }];
  const N = WNPC[npc] || { idle: ['……'] };
  if (N.shop && W_SHOPS[N.shop] && (!N.shopWhen || N.shopWhen(S))) return [{ shop: N.shop }];
  const pool = (N.at || []).filter(x => x.when(S)).map(x => x.t);
  return [{ dlg: [[npc, RNG.pick(pool.length && RNG.ch(0.7) ? pool : N.idle)]] }];
}
// 有没有事要找这个人（头顶的 ! 或 ?）
function wNpcMark(ch, npc) {
  if (!wHas(ch)) return '';
  const S = wstate(ch), m = wMain(ch);
  if (m && (m.goal.talk === npc || m.goal.pickTalk === npc || (m.escort === npc && S.flags.escort !== npc) || (m.goal.talks && m.goal.talks.includes(npc) && !S.pz['tk_' + m.id + '_' + npc]))) return 'main';
  for (const q of WQ[ch].side) {
    const s = S.side[q.id];
    if (s && s.st === 'on' && ((q.steps[s.step].goal.talk === npc && (!q.steps[s.step].needKey || wkeys()[q.steps[s.step].needKey])) || (q.steps[s.step].goal.waves && q.giver === npc))) return 'turn';
    if (!s && q.giver === npc && !q.auto && (!q.when || q.when(S, S.side))) return 'offer';
  }
  return '';
}
// 换场景
function wArrive(ch, sc, code) {
  const m = wmap(ch, sc), p = (m.pts[code] || [])[0];
  if (!p) { const st = m.pts[Object.keys(m.pts)[0]][0]; return { x: st.x, y: st.y }; }
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const x = p.x + dx, y = p.y + dy, c = wTile(m, x, y), P = m.def.pts[c];
    if (x < 0 || y < 0 || x >= m.W || y >= m.H || W_BLOCK.includes(c) || c === 'R' || c === 'Q') continue;
    if (P && P.t !== 'camp' && P.t !== 'qspot') continue;
    return { x, y };
  }
  return { x: p.x, y: p.y };
}
function wEnter(ch, sc, code) {
  const S = wstate(ch);
  if (S.pz.br) for (const k in S.pz.br) if (k.startsWith(sc + ':')) delete S.pz.br[k];   // 网桥重新结好
  S.sc = sc; S.pos = wArrive(ch, sc, code); S.pz.ent = { ...S.pos }; S.pz.entCode = code;
  if (S.pz.box && S.pz.box[sc] && !wBoxSolved(ch, sc)) delete S.pz.box[sc];   // 冰块没推好就离开，回来重新摆
  { const B = wmap(ch, sc).def.pts[code]; if (B && B.t === 'door') { S.pz.ud = S.pz.ud || {}; S.pz.ud[sc + '>' + B.to + '@' + B.at] = 1; } }   // 来时的门，认得回去
  wScene(ch); wReveal(ch); wUnstackMons(ch);
  const acts = [{ enter: sc }];
  const D = WMAPS[ch].scenes[sc];
  if (D.onEnter) { const a = D.onEnter(S); if (a) acts.push(...a); }
  const m = wMain(ch);   // 「到某个场景」类的目标
  if (m && m.goal.enter === sc && wReachOk(ch, m)) acts.push(...wStepActs(ch, m, null));
  for (const q of WQ[ch].side) { const s = S.side[q.id]; if (!s || s.st !== 'on') continue; const st = q.steps[s.step];
    if (st.goal.enter === sc) { if (st.lines) acts.push({ dlg: wLines(ch, st.lines) }); acts.push(...wAdvanceSide(ch, q, null)); } }
  return acts;
}
function wTele(ch, campId) {
  const e = wIndex(ch)[campId]; if (!e) return false;
  const S = wstate(ch); S.sc = e.sc; S.pos = { ...e.at[0] }; S.camp = campId; wScene(ch); wReveal(ch); return true;
}
// 走到某一格时触发的事
function wTrigger(ch, x, y, run) {
  const S = wstate(ch), P = wPt(ch, x, y); if (!P) return [];
  const k = wgk(S.sc, x, y), m = wMain(ch), acts = [];
  if (P.t === 'door') { if (!wDoorOpen(ch, P)) return [];
    S.pz.ud = S.pz.ud || {}; S.pz.ud[S.sc + '>' + P.to + '@' + P.at] = 1;
    if (wWatchActive(ch) && S.pz.entCode && wTile(wmap(ch), x, y) !== S.pz.entCode) { S.pz.sneak = S.pz.sneak || {}; S.pz.sneak[S.sc] = 1; }   // 从另一头出去：这片巡逻算摸过了
    const e = wEnter(ch, P.to, P.at); return P.lost ? [{ toast: P.lost }, ...e] : e; }
  if (P.t === 'plate') {
    if (S.flags.barsJammed) return [];
    S.pz.lastPlate = wkey(x, y);
    S.flags.bar = S.flags.bar ? 0 : 1;
    return [{ toast: S.flags.bar ? '咔哒——红色栅栏沉进地里，青色栅栏升了起来' : '咔哒——青色栅栏沉进地里，红色栅栏升了起来' }, { sfx: 'door' }];
  }
  if (!wPtVisible(ch, x, y)) return [];
  switch (P.t) {
    case 'camp':
      S.camp = P.id; if (!S.camps.includes(P.id)) { S.camps.push(P.id); acts.push({ toast: `点亮了篝火「${P.n}」` }); }
      if (m && m.goal.reach === P.id) { if (wReachOk(ch, m)) acts.push(...wStepActs(ch, m, run)); else acts.push({ toast: m.escortMiss || '人没跟上来' }); }
      return acts;
    case 'qspot':
      if (m && m.goal.reach === P.id && m.waves) {   // 守阵眼：一波接一波
        const a = [{ dlg: wLines(ch, m.lines) || [] }];
        m.waves.forEach((w, i) => { if (i && m.between && m.between[i - 1]) a.push({ dlg: m.between[i - 1] }); a.push({ fight: { ...w, first: 'e' }, key: i === m.waves.length - 1 ? { main: m.id } : {} }); });
        return a;
      }
      if (m && m.goal.reach === P.id) return wReachOk(ch, m) ? wStepActs(ch, m, run) : [{ toast: m.escortMiss || '人没跟上来' }];
      for (const q of WQ[ch].side) { const s = S.side[q.id]; if (s && s.st === 'on' && q.steps[s.step].goal.reach === P.id) { const st = q.steps[s.step]; return (st.lines ? [{ dlg: st.lines }] : []).concat(wAdvanceSide(ch, q, run)); } }
      return [];
    case 'qfight': case 'boss': {
      const lv = wmap(ch).zoneAt(x, y).lv;
      if (m && m.goal.fight === P.id) {
        const enc = P.t === 'boss' ? { kind: 'boss', first: 'e', lv: P.lv || lv } : { ...P.enc, first: P.enc.first || 'p' };
        return [...(P.t === 'boss' && typeof DOSSIER !== 'undefined' && DOSSIER[P.id] ? [{ dossier: P.id }] : []), { dlg: m.lines || [] }, { fight: enc, key: { main: m.id, pt: k, boss: P.t === 'boss' ? P.id : null, scripted: !!(P.enc && P.enc.scripted) } }];
      }
      for (const q of WQ[ch].side) { const s = S.side[q.id]; if (!s || s.st !== 'on') continue; const st = q.steps[s.step];
        if (st.goal.fight === P.id) return [{ dlg: st.lines || [] }, { fight: { ...P.enc, first: 'p' }, key: { side: q.id, pt: k } }]; }
      return [];
    }
    case 'qitem': {
      S.got[k] = 1;
      if (m && m.goal.get === P.id) return wStepActs(ch, m, run);
      for (const q of WQ[ch].side) { const s = S.side[q.id]; if (s && s.st === 'on' && q.steps[s.step].goal.get === P.id) {
        const st = q.steps[s.step]; return (st.lines ? [{ dlg: st.lines }] : []).concat(wAdvanceSide(ch, q, run)); } }
      return [];
    }
    case 'clue':
      if (P.enc && !S.got['enc_' + k]) return [{ dlg: P.encLines || [] }, { fight: { ...P.enc, first: 'e' }, key: { clue: k, x, y } }];   // 有东西守着的线索：先打
      S.got[k] = 1; return [{ dlg: P.lines || [] }, { toast: `找到线索「${P.n}」` }, ...wBump(ch, 'clue', P.grp, run)];
    case 'herb': S.got[k] = 1; return [{ toast: `采到一株${P.n}` }, ...wBump(ch, 'herb', P.grp, run)];
    case 'relic': S.got[k] = 1; wkeys()[P.key] = 1; return [{ dlg: P.lines || [] }, { toast: `得到「${W_KEYS[P.key].n}」——${W_KEYS[P.key].d}` }, { sfx: 'legend' }];
    case 'chest': if (P.needKey && !wkeys()[P.needKey]) return [{ toast: P.lock || '打不开' }]; S.got[k] = 1; return [...(P.lines ? [{ dlg: P.lines }] : []), { chest: true, q: P.q }];
    case 'event': S.got[k] = 1; return [{ event: true }];
    case 'xintu': return S.got[k] === 1 && wHasKey(ch, 'xinghun') ? wXintu(ch, k, P) : [];
  }
  return [];
}
// 被控制的信徒：叫醒的人数记在 wflags().woke（结局要看）
function wXintu(ch, k, P) {
  const S = wstate(ch), F = wflags();
  if (S.got[k] === 2) return [];
  if (wHasKey(ch, 'xinghun')) {
    S.got[k] = 2; F.woke = (F.woke || 0) + 1; F['woke_' + (P.id || k)] = 1;
    return [{ dlg: P.wake || [['narr', '醒魂香的青烟飘过去。他打了个喷嚏，眼睛里慢慢有了光。'], ['narr', '「我……我在这儿干嘛？」'], ['narr', '他四下看了看，撒腿就往山下跑。']] }, { toast: `叫醒了${P.n || '一个信徒'}（已经叫醒 ${F.woke} 个）` }, { sfx: 'buff' }];
  }
  if (S.got[k] === 1) return [{ toast: `${P.n || '他'}晕着呢。等有了醒魂香，再回来叫醒他` }];
  S.got[k] = 1; F.knock = (F.knock || 0) + 1;
  return [{ dlg: P.knock || [['narr', `${P.n || '信徒'}两眼发直，张着手拦在路中间，嘴里念着「仙丹……仙丹……」`], ['narr', '你一掌劈在他后颈上。他软软地倒了下去。']] }, { toast: '打晕了——有了醒魂香，可以回来叫醒他' }, { sfx: 'hit' }];
}
// 阴阳镜：同一处地方，阳面和阴面两个样（( 只在阳面能走，) 只在阴面能走）
const wYinScene = ch => { const d = wmap(ch).def; return !!d.yy; };
function wYinToggle(ch) {
  const S = wstate(ch), m = wmap(ch), c = wTile(m, S.pos.x, S.pos.y);
  if (!wYinScene(ch)) return [{ toast: '这里照不出阴面' }];
  if ((c === '(' && !S.flags.yin) || (c === ')' && S.flags.yin)) return [{ toast: '脚下这块地方，到了另一面是空的——换个地方再照' }];
  S.flags.yin = S.flags.yin ? 0 : 1; wReveal(ch);
  const D = WMAPS[ch].scenes[S.sc], a = [{ sfx: 'magic' }, { toast: S.flags.yin ? '阴阳镜一转——阴面。路边站满了鬼' : '阴阳镜一转——回到阳面' }];
  if (D.onYin) { const r = D.onYin(S); if (r) a.push(...r); }
  return a;
}
// 和挡路的东西交互（石门、古碑、灯、告示、锁着的门）
function wUse(ch, x, y, run) {
  const S = wstate(ch), m = wmap(ch), P = wPt(ch, x, y), M = wMain(ch); if (!P || (P.when && P.t !== 'npc' && !P.when(S))) return [];
  const k = wgk(S.sc, x, y);
  if (P.t === 'gate' && !S.flags[P.flag]) {
    if (M && M.goal.gate === P.id) return wStepActs(ch, M, run);
    return [{ dlg: [['narr', P.lock || '门关着。']] }];
  }
  if (P.t === 'door' && !wDoorOpen(ch, P)) return [{ dlg: [['narr', P.lock || '门锁着。']] }];
  if (P.t === 'stele') {
    if (wGoalOpen(ch, { rub: P.id })) return [{ dlg: P.rubLines || [] }, ...wBump(ch, 'rub', P.id, run)];
    return [{ dlg: [['narr', P.desc || '一块古碑。']] }];
  }
  if (P.t === 'sign') return [{ dlg: P.lines || [['narr', P.desc || '']] }];
  if (P.t === 'xintu') return wXintu(ch, k, P);
  if (P.t === 'board') { const first = P.lines && !S.got[k]; S.got[k] = 1; return [...(first ? [{ dlg: wLines(ch, P.lines) }] : []), { board: true }]; }
  if (P.t === 'mini') {   // 钓鱼洞、雪堆……：每歇一次能玩几回
    const k2 = 'mn_' + k, r = S.pz.restN || 0, used = S.pz[k2] && S.pz[k2].r === r ? S.pz[k2].n : 0;
    if (P.when2 && !P.when2(S)) return [{ dlg: P.lock || [['narr', '现在不行。']] }];
    if (used >= (P.per || 3)) return [{ toast: P.tired || '今天就到这儿吧——在篝火边歇一歇再来' }];
    S.pz[k2] = { r, n: used + 1 };
    return [...(P.lines ? [{ dlg: wLines(ch, P.lines) }] : []), { mini: P.mini }];
  }
  if (P.t === 'boxreset') { if (wBoxSolved(ch)) return [{ toast: '冰门已经开了。' }]; if (S.pz.box) delete S.pz.box[S.sc]; return [{ dlg: P.lines || [['narr', '你敲了敲冰锥。冰块「咔咔」地缩回了原来的地方。']] }]; }
  if (P.t === 'lamp') {
    const Z = m.def.pz[P.grp];
    if (S.flags[Z.flag]) return [{ dlg: [['narr', Z.lit || '灯都亮着。']] }];
    if (S.got[k]) return [{ toast: '这盏灯已经亮了' }];
    const i = S.pz[P.grp] || 0;
    if (Z.order[i] === P.wx) {
      S.got[k] = 1; S.pz[P.grp] = i + 1;
      if (i + 1 >= Z.order.length) { S.flags[Z.flag] = 1; const kk = []; if (Z.key) { wkeys()[Z.key] = 1; kk.push({ toast: `得到「${W_KEYS[Z.key].n}」——${W_KEYS[Z.key].d}` }); } return [{ sfx: 'legend' }, { dlg: Z.done }, ...kk, ...wBump(ch, 'puzzle', P.grp, run)]; }
      return [{ toast: `${Z.verb || '点亮了'}「${P.lab || WX[P.wx].n}」（${i + 1}/${Z.order.length}）` }, { sfx: 'magic' }];
    }
    S.pz[P.grp] = 0;
    for (const c in m.pts) { const Q = m.def.pts[c]; if (Q.t === 'lamp' && Q.grp === P.grp) m.pts[c].forEach(p => delete S.got[wgk(S.sc, p.x, p.y)]); }
    return [{ sfx: 'fail' }, { dlg: Z.fail }, { fight: { ...Z.enc, first: 'e' }, key: {} }];
  }
  return [];
}
// 走一步
function wStep(ch, x, y, run) {
  wUnstackMons(ch);
  const S = wstate(ch), m0 = wmap(ch), c0 = wTile(m0, x, y), TR = wTerr(ch), pre = [];
  if (c0 === '%' && !S.got[wgk(S.sc, x, y)]) {
    if (!wHasKey(ch, TR.web || 'torch')) return { blocked: true, acts: [{ toast: '蛛网又粘又韧，刀砍不断——得用火烧' }] };
    S.got[wgk(S.sc, x, y)] = 1;
    for (const [dx, dy] of W_DIRS8) if (wTile(m0, x + dx, y + dy) === '%') S.got[wgk(S.sc, x + dx, y + dy)] = 1;   // 一燎一片
    pre.push({ toast: '火把一燎，蛛网嗤嗤地烧成了灰' }, { sfx: 'fire' });
  }
  if (wBoxAt(ch, x, y)) { const r = wPushBox(ch, x, y, S.pos); if (!r || r.blocked) return r || { blocked: true, acts: [] }; pre.push(...r.acts); }
  if (!wPassHero(ch, x, y)) return { blocked: true, acts: [] };
  const from = S.pos;
  S.pz.bc = (S.pz.bc || 0) + 1;
  if (c0 === '~') { S.pz.brs = S.pz.brs || {}; S.pz.brs[S.sc] = (S.pz.brs[S.sc] || 0) + 1; }
  if (wTile(m0, from.x, from.y) === '~') { S.pz.br = S.pz.br || {}; S.pz.br[wgk(S.sc, from.x, from.y)] = { s: S.pz.bc, t: Date.now() }; }
  // 冰面：一直滑到撞上东西
  const dx = Math.sign(x - from.x), dy = Math.sign(y - from.y);
  if (c0 === '_' && Math.abs(x - from.x) <= 1 && Math.abs(y - from.y) <= 1 && !wHasKey(ch, TR.ice)) {
    while (wTile(m0, x, y) === '_' && wPassHero(ch, x + dx, y + dy) && !wMonAt(ch, x + dx, y + dy) && !wIsDoor(ch, x + dx, y + dy) && (!(dx && dy) || wDiagOk(ch, { x, y }, dx, dy))) { x += dx; y += dy; }
  }
  S.pos = { x, y }; wReveal(ch);
  // 岩浆、毒沼伤血
  const c1 = wTile(m0, x, y);
  if (run && ((c1 === '*' && wLavaHot() && !wHasKey(ch, TR.lava)) || (c1 === '"' && !wHasKey(ch, TR.swamp)))) {
    const mx = runStats(run).maxHp, d = Math.round(mx * (c1 === '*' ? (wHasKey(ch, 'bihuofu') ? 0.045 : 0.09) : 0.05));
    if (run.hp > mx * 0.15) { run.hp = Math.max(1, run.hp - d); pre.push({ toast: c1 === '*' ? `岩浆正烫！气血 -${d}（等它暗下去再走）` : `毒水渗进鞋里，气血 -${d}` }); }
  }
  // 每章自己的地形规矩（暴风雪、塌方、扒手……）
  if (run && WMAPS[ch].onStep) { const r = WMAPS[ch].onStep(ch, S, run, x, y); if (r) { if (r.stop) return { acts: [...pre, ...r.acts] }; pre.push(...(r.acts || [])); } }
  // 巡逻的眼睛：被看见就被赶回门口
  const seenBy = W_AUTOSOLVE ? null : wWatchSee(ch, x, y);
  if (seenBy && seenBy.alarm && (S.pz.alarmT || 0) > S.pz.bc) { /* 刚打完增援，喘口气 */ }
  else if (seenBy && seenBy.alarm) { S.pz.alarmT = S.pz.bc + 8; return { acts: [...pre, { toast: seenBy.caught || '警报响了！' }, { sfx: 'fail' }, { fight: { ...seenBy.alarm, first: 'e' }, key: {} }] }; }
  if (seenBy && !seenBy.alarm) { S.pos = { ...(S.pz.ent || from) }; wReveal(ch); return { acts: [...pre, { toast: seenBy.caught || `被${seenBy.n || '巡夜的'}发现了！你被赶了出来` }, { sfx: 'fail' }] }; }
  if (pre.length) {   // 地形提示不打断走路
    let mn2 = wMonAt(ch, x, y); if (mn2) return { acts: [...pre, wFightMon(ch, mn2, 'p')] };
    const a2 = wTrigger(ch, x, y, run); if (a2.length) return { acts: [...pre, ...a2] };
    wMoveMons(ch); mn2 = wMonAt(ch, x, y); if (mn2) return { acts: [...pre, wFightMon(ch, mn2, 'e')] };
    return { acts: pre, cont: true };
  }
  let mn = wMonAt(ch, x, y);
  if (mn) return { acts: [wFightMon(ch, mn, 'p')] };
  const acts = wTrigger(ch, x, y, run);
  if (acts.length) return { acts };
  wMoveMons(ch);
  mn = wMonAt(ch, x, y);
  if (mn) return { acts: [wFightMon(ch, mn, 'e')] };
  return { acts: [] };
}
// 潜行：巡逻的人看着一个方向，视线被墙挡住
function wWatchSee(ch, x, y) {
  const m = wmap(ch), S = wstate(ch);
  for (const c in m.pts) { const P = m.def.pts[c]; if (P.t !== 'watch' || (P.when && !P.when(S))) continue;
    for (const p of m.pts[c]) { for (const [wx, wy] of wWatchCells(ch, p, P)) if (wx === x && wy === y) return P; } }
  return null;
}
function wWatchCells(ch, p, P) {
  const m = wmap(ch), out = [], D = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  let dir = P.dir; if (P.turn) { const o = P.turn, i = Math.floor(Date.now() / (P.every || 3000)) % o.length; dir = o[i]; }
  const [dx, dy] = D[dir], r = wHasKey(ch, P.key) ? Math.ceil(P.r / 2) : P.r;
  for (let k = 1; k <= r; k++) for (let s = -Math.floor(k / 2); s <= Math.floor(k / 2); s++) {
    const cx = p.x + dx * k + (dy ? s : 0), cy = p.y + dy * k + (dx ? s : 0), t = wTile(m, cx, cy);
    if (W_BLOCK.includes(t) || t === 'R' || t === 'Q') continue;
    // 中间有墙就看不见
    let ok = true; for (let j = 1; j < k; j++) { const t2 = wTile(m, p.x + dx * j + (dy ? Math.round(s * j / k) : 0), p.y + dy * j + (dx ? Math.round(s * j / k) : 0)); if (W_BLOCK.includes(t2)) { ok = false; break; } }
    if (ok) out.push([cx, cy]);
  }
  return out;
}
function wFightMon(ch, mn, first) {
  const enc = { kind: mn.elite ? 'elite' : 'battle', mon: mn.m, lv: mn.lv, name: mn.name, pal: mn.pal, first, tag: mn.tag };
  if (mn.bty) { enc.bty = mn.bty; return { fight: enc, key: { mon: mn.id } }; }
  const P = mn.pt && wmap(ch).def.pts[mn.pt]; if (P && P.abs) enc.abs = P.abs;
  const z = (wmap(ch).def.zones || []).find(z => z.id === mn.z); if (z && z.mons.length) enc.mix = z.mons;
  if (mn.tag === 'walker') { enc.n = 1; enc.kind = 'battle'; }
  return { fight: enc, key: { mon: mn.id } };
}
// 打怪掉任务道具（比如尸油）
function wDrop(ch, mn, run) {
  const S = wstate(ch), m = wMain(ch), acts = [], gs = [];
  if (m && m.goal.drop) gs.push(m.goal);
  for (const q of WQ[ch].side) { const s = S.side[q.id]; if (s && s.st === 'on' && q.steps[s.step].goal.drop) gs.push(q.steps[s.step].goal); }
  const seen = new Set();
  for (const g of gs) {
    if (seen.has(g.drop) || !g.mon.includes(mn.m)) continue; seen.add(g.drop);
    const key = 'dm_' + g.drop; S.pz[key] = (S.pz[key] || 0) + 1;
    if (Math.random() < (g.p || 0.5) || S.pz[key] >= 3) { S.pz[key] = 0; acts.push({ toast: `得到「${g.dn}」` }, ...wBump(ch, 'drop', g.drop, run)); }
  }
  return acts;
}
// 战斗赢了
function wFightWon(ch, key, run) {
  const S = wstate(ch), D = wScene(ch), acts = [];
  if (key.mon) {
    const i = D.mons.findIndex(mn => mn.id === key.mon); if (i < 0) return acts;
    if (D.mons[i].bty) return wBtyWon(ch, D.mons[i], run);
    const mn = D.mons.splice(i, 1)[0];
    if (mn.elite && mn.pt) D.dead[mn.id] = { t: Date.now(), pt: mn.pt };   // 精英的掉落在战斗结算里（四成宝品），休息后重生
    if (mn.tag) acts.push(...wBump(ch, 'kill', mn.tag, run));
    acts.push(...wBump(ch, 'killz', mn.z, run));
    acts.push(...wDrop(ch, mn, run));
    if (WMAPS[ch].mbDrop) { const [a0, a1] = WMAPS[ch].mbDrop, n = Math.round((a0 + Math.random() * (a1 - a0)) * (mn.elite ? 4 : 1)); SAVE.mb = wMb() + n; acts.push({ toast: `冥币 +${n}` }); }
    wEnsureDropMons(ch);
  }
  if (key.main) {
    if (key.pt) S.got[key.pt] = 1;
    if (key.boss) { S.flags['boss_' + key.boss] = 1;   // 首领首杀：三成几率掉一件传奇（优先本章的）
      const cls = run ? run.cls : SAVE.cls;
      if (RNG.ch(0.3)) { const it = storeItem(run && run.world ? run : null, makeItem({ ilvl: chIlvl(ch, 99), rarity: 'legend', cls })); acts.push({ toast: `首领掉落传奇：<b class="r-legend">${it.name}</b>` }); } }
    acts.push(...wCompleteMain(ch, run));
  }
  if (key.clue) { S.got['enc_' + key.clue] = 1; acts.push(...wTrigger(ch, key.x, key.y, run)); }
  if (key.side) { if (key.pt) S.got[key.pt] = 1; const q = WQ[ch].side.find(q => q.id === key.side); acts.push(...wAdvanceSide(ch, q, run)); }
  return acts;
}
// 输了：回到最近的篝火
function wDefeat(ch, run) {
  const S = wstate(ch), lost = Math.floor(SAVE.gold * 0.1); SAVE.gold -= lost;
  let msg = '';
  if (S.flags.escort) { const m = wMain(ch); msg = (m && m.escortLost) || '跟着你的人被妖物拖走了。'; S.flags.escort = 0; }
  if (!(S.camp && wTele(ch, S.camp))) { const D = WMAPS[ch], st = wmap(ch, D.start).pts[D.startPt][0]; S.sc = D.start; S.pos = { x: st.x, y: st.y }; wScene(ch); wReveal(ch); }
  run.food = null; run.hp = runStats(run).maxHp; run.potions = wPotBase() + (SAVE.potExtra || 0);
  return { lost, msg };
}
// 篝火：休息、夜话
function wRest(ch, run) { const S0 = wstate(ch); S0.pz.restN = (S0.pz.restN || 0) + 1; run.food = null; run.hp = runStats(run).maxHp; run.potions = wPotBase() + (SAVE.potExtra || 0); wRespawn(ch); const S = wstate(ch), pre = [];
  if (WMAPS[ch].daynight) { S.flags.night = S.flags.night ? 0 : 1; pre.push({ toast: S.flags.night ? '天黑了。鬼市的灯一盏一盏亮起来。' : '天亮了。鬼市收了摊，只剩一地纸钱。' }); }
  return pre.concat(wCampTalk(ch)); }
function wCampTalk(ch) {
  const S = wstate(ch);
  const L = (CAMPTALK[ch] || []).find(t => !S.flags['ct_' + t.id] && (!t.at || t.at.includes(S.camp)) && (!t.when || t.when(S)));
  if (!L) return [];
  S.flags['ct_' + L.id] = 1;
  const a = [{ banner: ['篝火夜话', L.t] }, { dlg: L.lines }];
  if (L.choice) a.push({ choice: L.choice });
  if (L.aff) a.push(...wAffActs(L.aff));
  return a;
}
const wCampTalkReady = ch => { const S = wstate(ch); return (CAMPTALK[ch] || []).some(t => !S.flags['ct_' + t.id] && (!t.at || t.at.includes(S.camp)) && (!t.when || t.when(S))); };
function wCampPos(ch, id) { const e = wIndex(ch)[id]; return e && { sc: e.sc, ...e.at[0] }; }
const wCampName = (ch, id) => { const e = wIndex(ch)[id]; return e ? e.P.n : id; };

// ---------------- 寻路 ----------------
const W_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const W_DIRS8 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];
// 斜着走：两边都得能过，不能穿墙角，也不能从门边斜插
const wDiagOk = (ch, c, dx, dy) => !(dx && dy) || (wPassHero(ch, c.x + dx, c.y) && wPassHero(ch, c.x, c.y + dy) && !wIsDoor(ch, c.x + dx, c.y) && !wIsDoor(ch, c.x, c.y + dy));
// 只走看得见的路；目标挡路（人、石门）时走到它旁边
function wPath(ch, tx, ty) { return wPath0(ch, tx, ty, true) || wPath0(ch, tx, ty, false); }
function wHazard(ch, x, y) { const c = wTile(wmap(ch), x, y), T = wTerr(ch); return (c === '"' && !wHasKey(ch, T.swamp)) || (c === '*' && !wHasKey(ch, T.lava)); }
function wPath0(ch, tx, ty, safe) {
  const S = wstate(ch), s = S.pos, goalBlocked = !wPassHero(ch, tx, ty);
  const prev = new Map([[wkey(s.x, s.y), null]]), q = [s];
  let end = null;
  while (q.length) {
    const c = q.shift();
    if ((c.x === tx && c.y === ty) || (goalBlocked && Math.abs(c.x - tx) + Math.abs(c.y - ty) === 1)) { end = c; break; }
    for (const [dx, dy] of W_DIRS8) {
      const n = { x: c.x + dx, y: c.y + dy }, k = wkey(n.x, n.y);
      if (!wSeen(ch, n.x, n.y) || !wPassHero(ch, n.x, n.y) || !wDiagOk(ch, c, dx, dy)) continue;
      if (wPuzzle(ch, n.x, n.y) && !(n.x === tx && n.y === ty)) continue;
      if (wTile(wmap(ch), n.x, n.y) === '_' && !wHasKey(ch, wTerr(ch).ice)) { if (dx && dy) continue; while (wTile(wmap(ch), n.x, n.y) === '_' && wPassHero(ch, n.x + dx, n.y + dy) && !wIsDoor(ch, n.x + dx, n.y + dy)) { n.x += dx; n.y += dy; } }
      const k2 = wkey(n.x, n.y); if (prev.has(k2) || (wWatchOn(ch) && wWatchSee(ch, n.x, n.y)) || (safe && wHazard(ch, n.x, n.y) && !(n.x === tx && n.y === ty))) continue;
      if (k2 !== k && (n.x !== tx || n.y !== ty) && wIsDoor(ch, n.x, n.y)) continue;
      if ((wIsDoor(ch, n.x, n.y) || wEliteAt(ch, n.x, n.y)) && !(n.x === tx && n.y === ty)) continue;   // 路过门口不进门，也不撞精英
      prev.set(k2, c); q.push(n);
    }
  }
  if (!end) return null;
  const path = []; for (let c = end; c; c = prev.get(wkey(c.x, c.y))) path.unshift(c);
  return path.slice(1);
}
const wWatchOn = ch => { const m = wmap(ch); return Object.values(m.def.pts).some(P => P.t === 'watch'); };
const wIsDoor = (ch, x, y) => { const P = wPt(ch, x, y); return !!P && P.t === 'door'; };
// 自动寻路绕开精英（除非精英就是目标）
const wEliteAt = (ch, x, y) => wScene(ch).mons.some(mn => mn.elite && mn.x === x && mn.y === y && !(wmap(ch).def.pts[mn.pt] || {}).gate);
// 目标还没探索时：走到已知的、离它最近的地方
function wPathNear(ch, tx, ty) {
  const direct = wPath(ch, tx, ty); if (direct) return { path: direct, near: false };
  const S = wstate(ch);
  let best = null, bd = 1e9;
  const prev = new Map([[wkey(S.pos.x, S.pos.y), null]]), q = [S.pos];
  while (q.length) {
    const c = q.shift(); const d = Math.abs(c.x - tx) + Math.abs(c.y - ty);
    if (d < bd) { bd = d; best = c; }
    for (const [dx, dy] of W_DIRS8) { const n = { x: c.x + dx, y: c.y + dy }, k = wkey(n.x, n.y);
      if (prev.has(k) || !wSeen(ch, n.x, n.y) || !wPassHero(ch, n.x, n.y) || wPuzzle(ch, n.x, n.y) || wIsDoor(ch, n.x, n.y) || wEliteAt(ch, n.x, n.y) || !wDiagOk(ch, c, dx, dy)) continue; prev.set(k, c); q.push(n); }
  }
  if (!best || (best.x === S.pos.x && best.y === S.pos.y)) return { path: [], near: true };
  const path = []; for (let c = best; c; c = prev.get(wkey(c.x, c.y))) path.unshift(c);
  return { path: path.slice(1), near: true };
}
// 自动探索：走向最近一块还没看过的地方（优先指定区域 / 当前区域）
function wExploreTarget(ch, zid) {
  const m = wmap(ch), S = wstate(ch), z0 = zid || m.zoneAt(S.pos.x, S.pos.y).id;
  const prev = new Map([[wkey(S.pos.x, S.pos.y), null]]), q = [S.pos];
  let any = null, inZ = null;
  while (q.length) {
    const c = q.shift();
    const frontier = W_DIRS.some(([dx, dy]) => { const x = c.x + dx, y = c.y + dy; return x >= 0 && y >= 0 && x < m.W && y < m.H && !wSeen(ch, x, y) && !W_BLOCK.includes(wTile(m, x, y)); });
    if (frontier && (c.x !== S.pos.x || c.y !== S.pos.y)) { if (m.zoneAt(c.x, c.y).id === z0) { inZ = c; break; } if (!any) any = c; }
    for (const [dx, dy] of W_DIRS8) { const n = { x: c.x + dx, y: c.y + dy }, k = wkey(n.x, n.y);
      if (prev.has(k) || !wSeen(ch, n.x, n.y) || !wPassHero(ch, n.x, n.y) || wPuzzle(ch, n.x, n.y) || wIsDoor(ch, n.x, n.y) || wEliteAt(ch, n.x, n.y) || !wDiagOk(ch, c, dx, dy)) continue; prev.set(k, c); q.push(n); }
  }
  const tgt = inZ || (zid ? null : any);
  if (!tgt) return null;
  const path = []; for (let c = tgt; c; c = prev.get(wkey(c.x, c.y))) path.unshift(c);
  return path.slice(1);
}
// 目标那边还没探过：走向离目标最近的「未探索边缘」
function wExploreToward(ch, tx, ty) {
  const m = wmap(ch), S = wstate(ch);
  const prev = new Map([[wkey(S.pos.x, S.pos.y), null]]), q = [{ ...S.pos, d: 0 }];
  let best = null, bs = 1e9;
  while (q.length) {
    const c = q.shift();
    const frontier = W_DIRS.some(([dx, dy]) => { const x = c.x + dx, y = c.y + dy; return x >= 0 && y >= 0 && x < m.W && y < m.H && !wSeen(ch, x, y) && !W_BLOCK.includes(wTile(m, x, y)); });
    if (frontier && (c.x !== S.pos.x || c.y !== S.pos.y)) { const sc = Math.abs(c.x - tx) + Math.abs(c.y - ty) + c.d * 0.35; if (sc < bs) { bs = sc; best = c; } }
    for (const [dx, dy] of W_DIRS8) { const n = { x: c.x + dx, y: c.y + dy, d: c.d + 1 }, k = wkey(n.x, n.y);
      if (prev.has(k) || !wSeen(ch, n.x, n.y) || !wPassHero(ch, n.x, n.y) || wPuzzle(ch, n.x, n.y) || wIsDoor(ch, n.x, n.y) || wEliteAt(ch, n.x, n.y) || !wDiagOk(ch, c, dx, dy)) continue; prev.set(k, c); q.push(n); }
  }
  if (!best) return null;
  const path = []; for (let c = best; c; c = prev.get(wkey(c.x, c.y))) path.unshift({ x: c.x, y: c.y });
  return path.slice(1);
}
// 场景之间怎么走：下一扇门
// 跨场景寻路：考虑每个场景里从入口实际走得到哪些门（阴阳两面、被墙隔开的区域）
function wReachDoors(ch, sc, st) {
  const m = wmap(ch, sc), seen = new Set([wkey(st.x, st.y)]), q = [st], doors = [];
  while (q.length) {
    const c = q.pop();
    for (const [dx, dy] of W_DIRS) {
      const x = c.x + dx, y = c.y + dy, k = wkey(x, y); if (seen.has(k) || x < 0 || y < 0 || x >= m.W || y >= m.H) continue;
      const P = m.def.pts[wTile(m, x, y)];
      if (P && P.t === 'door') { seen.add(k); if (wDoorOpen(ch, P) && wDoorKnown(ch, sc, P)) doors.push({ x, y, P }); continue; }
      if (!wPassHero(ch, x, y, sc) && !(P && P.t === 'npc')) continue;
      seen.add(k); q.push({ x, y });
    }
  }
  return doors;
}
function wNextDoor(ch, from, to) {
  if (from === to) return null;
  const S0 = wstate(ch), start = { sc: from, pos: S0.pos, first: null }, vis = new Set([from + '@' + wkey(S0.pos.x, S0.pos.y)]), q = [start];
  while (q.length) {
    const n = q.shift();
    for (const d of wReachDoors(ch, n.sc, n.pos)) {
      const first = n.first || { x: d.x, y: d.y, to: d.P.to };
      if (d.P.to === to) return first;
      const ar = wArrive(ch, d.P.to, d.P.at), k = d.P.to + '@' + wkey(ar.x, ar.y);
      if (vis.has(k) || vis.size > 200) continue; vis.add(k); q.push({ sc: d.P.to, pos: ar, first });
    }
  }
  return wNextDoor0(ch, from, to);
}
function wNextDoor0(ch, from, to) {
  if (from === to) return null;
  const prev = new Map([[from, null]]), q = [from];
  while (q.length) {
    const sc = q.shift(); if (sc === to) break;
    const m = wmap(ch, sc);
    for (const c in m.def.pts) { const P = m.def.pts[c]; if (P.t !== 'door' || !wDoorOpen(ch, P) || !wDoorKnown(ch, sc, P) || prev.has(P.to)) continue; prev.set(P.to, { sc, c }); q.push(P.to); }
  }
  if (!prev.has(to)) return null;
  let step = prev.get(to), cur = to;
  while (step && step.sc !== from) { cur = step.sc; step = prev.get(cur); }
  const S = wstate(ch), m = wmap(ch, from), ps = (m.pts[step.c] || []).slice().sort((a, b) => wdist(a, S.pos) - wdist(b, S.pos));
  return ps[0] ? { x: ps[0].x, y: ps[0].y, to: m.def.pts[step.c].to } : null;
}
// 一键前往：返回本场景里要走的路
function wRoute(ch, t) {
  const R = wRoute0(ch, t);
  if (W_AUTOSOLVE || (R && !R.near)) return R;
  let R2; W_AUTOSOLVE = true; try { R2 = wRoute0(ch, t); } finally { W_AUTOSOLVE = false; }
  if (!R2) return R;
  const S = wstate(ch);
  // 机关后面还没探过（比如岩浆对岸）：照样要说清楚是机关挡路，而不是「路还没探出来」
  const isXt = p => { const P = wPt(ch, p.x, p.y); return !!P && P.t === 'xintu' && !S.got[wgk(S.sc, p.x, p.y)]; };   // 被迷住的信徒站在路口
  const isYY = p => { const c = wTile(wmap(ch), p.x, p.y); return (c === '(' && !!S.flags.yin) || (c === ')' && !S.flags.yin); };   // 阴阳两面：这一面是断的
  let p0 = (R2.path || []).find(p => wPuzzle(ch, p.x, p.y) || isXt(p) || isYY(p));
  if (!p0 && R && R.near && !R.path.length && !R.fence) {   // 一步也近不了了：看看是不是哪个机关就挡在走得到的地方旁边（对岸还在雾里时，路线里找不到它）
    const m = wmap(ch), L = [], reach = new Set([wkey(S.pos.x, S.pos.y)]), q = [S.pos];
    while (q.length) { const c = q.shift();
      for (const [dx, dy] of W_DIRS8) { const n = { x: c.x + dx, y: c.y + dy }, k = wkey(n.x, n.y);
        if (reach.has(k) || !wSeen(ch, n.x, n.y) || !wPassHero(ch, n.x, n.y) || wPuzzle(ch, n.x, n.y) || wIsDoor(ch, n.x, n.y) || wEliteAt(ch, n.x, n.y) || !wDiagOk(ch, c, dx, dy)) continue; reach.add(k); q.push(n); } }
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) { const p = { x, y };
      if (!wSeen(ch, x, y) || !(wPuzzle(ch, x, y) || isXt(p) || isYY(p))) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach.has(wkey(x + dx, y + dy)))) L.push({ x, y, d: Math.abs(x - R.x) + Math.abs(y - R.y) }); }
    L.sort((a, b) => a.d - b.d); p0 = L[0] || null;
  }
  if (R2.near && !p0) return R;
  if (!R && !R2.near) return { path: [], near: true, puzzle: wWatchActive(ch) && !(S.pz.sneak || {})[S.sc] ? '巡逻' : '迷路', x: R2.x, y: R2.y, door: R2.door };
  if (!p0) return R;
  const n = wPathNear(ch, p0.x, p0.y);
  const c0 = wTile(wmap(ch), p0.x, p0.y), P0 = wmap(ch).def.pts[c0];
  return { path: n.path, near: true, puzzle: P0 && P0.box ? '冰门（把冰块推到冰眼上）' : c0 === '(' || c0 === ')' ? '断路（这一面走不通——拿阴阳镜照到另一面再过）' : W_PUZ_N[c0] || '机关', who: P0 && P0.t === 'xintu' ? (P0.n || '一个信徒') : null, x: p0.x, y: p0.y, door: R2.door };
}
function wRoute0(ch, t) {
  const S = wstate(ch);
  let x = t.x, y = t.y, door = false;
  if (t.sc !== S.sc) { const d = wNextDoor(ch, S.sc, t.sc); if (!d) return null; x = d.x; y = d.y; door = true; }
  const p = wPath(ch, x, y); if (p) return { path: p, near: false, door, x, y };
  const e = wExploreToward(ch, x, y); if (e && e.length) return { path: e, near: true, door, x, y };
  if (SAVE.guide === 'full') {   // 详细指引：路被栅栏挡住时，去踩另一块机关
    const m = wmap(ch), L = [];
    for (const c in m.pts) if (m.def.pts[c].t === 'plate' && !S.flags.barsJammed) for (const p of m.pts[c]) {
      const k = wkey(p.x, p.y), pa = wPath(ch, p.x, p.y); if (pa && pa.length) L.push({ pa, k }); }
    L.sort((a, b) => (a.k === S.pz.lastPlate) - (b.k === S.pz.lastPlate) || a.pa.length - b.pa.length);
    if (L[0]) return { path: L[0].pa, near: true, plate: true, door, x: L[0].pa[L[0].pa.length - 1].x, y: L[0].pa[L[0].pa.length - 1].y };
  }
  const n = wPathNear(ch, x, y);
  // 线索模式：不替玩家走到机关上，但要说清楚是栅栏挡路（原来只会说「路还没探出来」，其实是机关没踩）
  let fence = false; { const m = wmap(ch); for (const c in m.pts) if (m.def.pts[c].t === 'plate' && !S.flags.barsJammed && m.pts[c].length) fence = true; }
  return { path: n.path, near: true, door, x, y, fence };
}
// 任务标记的位置：{sc,x,y}（线索模式下可能只给一个区域）
function wNearestMon(ch, f) {
  const S = wstate(ch), order = [S.sc, ...Object.keys(S.sd).filter(s => s !== S.sc)];
  for (const sc of order) { const L = S.sd[sc].mons.filter(f).sort((a, b) => wdist(a, S.pos) - wdist(b, S.pos)); if (L[0]) return { sc, x: L[0].x, y: L[0].y }; }
  return null;
}
function wNearestPt(ch, f) {
  const S = wstate(ch), order = [S.sc, ...wScenes(ch).filter(s => s !== S.sc)];
  for (const sc of order) {
    const m = wmap(ch, sc), L = [];
    for (const c in m.pts) { const P = m.def.pts[c]; if (!f(P)) continue; for (const p of m.pts[c]) if (wPtVisible(ch, p.x, p.y, sc)) L.push(p); }
    L.sort((a, b) => wdist(a, S.pos) - wdist(b, S.pos)); if (L[0]) return { sc, x: L[0].x, y: L[0].y };
  }
  return null;
}
function wZoneCenter(ch, zid, sc0) {
  for (const sc of sc0 ? [sc0] : wScenes(ch)) {
    const m = wmap(ch, sc), z = zid ? (m.def.zones || []).find(z => z.id === zid) : { r: [0, 0, m.W - 1, m.H - 1] };
    if (z) return { sc, x: (z.r[0] + z.r[2]) >> 1, y: (z.r[1] + z.r[3]) >> 1 };
  }
  return null;
}
function wMarkPos(ch, q) {
  if (!q) return null;
  if (typeof q === 'string') q = { mark: q };
  const mark = q.mark; if (!mark) return null;
  const S = wstate(ch), I = wIndex(ch), full = SAVE.guide === 'full';
  let t = null;
  // 护送任务：人还没跟上，先指向要带的那个人，而不是终点
  if (q.escort && S.flags.escort !== q.escort) { const n = wFindNpc(ch, q.escort); if (n) return n; }
  if (mark.startsWith('mon:')) { const tag = mark.slice(4); t = wNearestMon(ch, mn => mn.tag === tag); }
  else if (mark.startsWith('monm:')) { const ids = mark.slice(5).split('/').map(Number); t = wNearestMon(ch, mn => ids.includes(mn.m)); }
  else if (mark.startsWith('zone:')) { const zid = mark.slice(5); t = wNearestMon(ch, mn => mn.z === zid) || wZoneCenter(ch, zid); }
  else if (mark.startsWith('herb:') || mark.startsWith('clue:')) { const [k, g] = mark.split(':'); t = wNearestPt(ch, P => P.t === k && P.grp === g); }
  else if (mark.startsWith('lamp:')) { const g = mark.slice(5), sc = I[g] ? I[g].sc : null; t = wNextLamp(ch, g); }
  else if (I[mark]) { const e = I[mark]; const p = e.at.find(p => !S.got[wgk(e.sc, p.x, p.y)]) || e.at[0]; t = { sc: e.sc, x: p.x, y: p.y }; }
  else t = wFindNpc(ch, mark);
  if (!t) { if (q.area) { const [sc, zid] = q.area.split('.'); const c = wZoneCenter(ch, zid || null, sc); return c && { ...c, area: true, zone: zid }; } return null; }
  if (!full && q.find && q.area && !(t.sc === S.sc && wSeen(ch, t.x, t.y))) {
    const [sc, zid] = q.area.split('.'); const c = wZoneCenter(ch, zid || null, sc);
    return { ...c, area: true, zone: zid };
  }
  return t;
}
function wNextLamp(ch, grp) {
  for (const sc of wScenes(ch)) { const m = wmap(ch, sc); if (!m.def.pz || !m.def.pz[grp]) continue;
    const Z = m.def.pz[grp], S = wstate(ch), want = Z.order[S.pz[grp] || 0];
    for (const c in m.pts) { const P = m.def.pts[c]; if (P.t === 'lamp' && P.grp === grp && P.wx === want) { const p = m.pts[c][0]; return { sc, x: p.x, y: p.y }; } } }
  return null;
}
// 「要紧」的支线：奖励是克制首领狠招的东西，而且手里还没有
const wSideKey = q => (q.rw && q.rw.key) || ((q.steps || []).map(st => st.rw && st.rw.key).find(Boolean)) || null;
function wFoilSet() { const out = new Set(); if (typeof DOSSIER === 'undefined') return out; for (const id in DOSSIER) for (const it of DOSSIER[id].items || []) if (it.key) out.add(it.key); return out; }
function wSideFoil(q) { const k = wSideKey(q); return !!k && !wkeys()[k] && wFoilSet().has(k); }
// 任务追踪：主线 + 进行中的支线
function wTracker(ch) {
  const S = wstate(ch), out = [], m = wMain(ch), full = SAVE.guide === 'full';
  const ent = (main, id, t, st, n, giver) => { const g = st.goal;
    return { main, id, t, d: ((full || !st.hint) ? st.d : st.hint).replace('{n}', n), mark: st.mark || g.talk || (g.waves ? giver : null), area: st.area, escort: st.escort, find: !!(g.get || g.clue || g.herb || g.puzzle || g.rub) }; };
  if (m) { const e = ent(true, m.id, m.t, m, S.kc); if (m.goal.talks) e.mark = m.goal.talks.find(n => !S.pz['tk_' + m.id + '_' + n]) || e.mark; out.push(e); }
  for (const q of WQ[ch].side) { const s = S.side[q.id]; if (!s || s.st !== 'on') continue; const e = ent(false, q.id, q.t, q.steps[s.step], s.n, q.giver); if (wSideFoil(q)) e.key = true; out.push(e); }
  // 被首领打倒两次以后：还没接的「要紧」支线也列出来，指向发任务的人
  if ((S.pz.bl || 0) >= 2) for (const q of WQ[ch].side) {
    if (S.side[q.id] || q.auto || !wSideFoil(q) || (q.when && !q.when(S, S.side))) continue;
    out.push({ main: false, id: q.id, offer: true, key: true, t: q.t, d: `去找${(SPEAKERS[q.giver] || {}).n || '发任务的人'}，接下这条支线`, mark: q.giver });
  }
  for (const id in (S.bty && S.bty.on) || {}) { const D = wBtyDef(ch, id); if (D) out.push({ main: false, bty: true, id: 'bty_' + id, t: `悬赏·${D.n}`, d: `${BTY_TIER[D.tier].n}　${wBtyWhere(ch, D)}`, mark: 'mon:bty_' + id }); }
  return out;
}
// 进入大地图：建立「这一趟」的状态
function newWorldRun(cls, ch, diff) {
  const run = { world: true, cls, mode: 'story', diff: diff || 'normal', riftLv: 1, chapter: ch, mods: [], floor: 3, buffs: {}, loot: [], goldGot: 0, xpGot: 0, gemsGot: 0,
    matsGot: 0, kills: 0, t0: Date.now(), lvStart: SAVE.chars[cls].level, paraStart: SAVE.para.lv, hp: 0, ended: null, rooms: 0, xpMul: 1, prog: 0,
    maze: { v: 2, cells: [], maxDist: 1 }, pos: 0, hasKey: true, ngoc: null };
  const prev = SAVE.run; SAVE.run = run; wstate(ch); SAVE.run = prev;
  run.potions = wPotBase() + (SAVE.potExtra || 0); run.hp = runStats(run).maxHp;
  return run;
}
// 现在跟在身边的人：剧情强制的优先，其次是自己选的同伴
function wCompNow(ch) {
  const S = wstate(ch);
  if (wmap(ch).def.solo) return null;   // 梦里、一个人的场景：没有同伴
  if (S.flags.noComp) return null;       // 剧情里大家都走散了
  if (S.flags.ngocFollow) return 'ngoc';
  if (S.flags.zhenFollow) return 'zhen';
  let c = (SAVE.comps || {})[SAVE.comp] ? SAVE.comp : null;
  const ban = WMAPS[ch].compBan ? WMAPS[ch].compBan(S) : null;   // 剧情里不在场的人不能带（比如 Ngoc 被抓走的那两章）
  if (c && ban && ban.includes(c)) c = ['zhen', 'long', 'ngoc'].find(x => (SAVE.comps || {})[x] && !ban.includes(x)) || null;
  return c;
}
// 把地图上的遭遇变成战斗单位
function wPrepBattle(run, enc) {
  const ch = run.chapter, S = wstate(ch), F = CHAPTERS[ch - 1];
  run.encCell = { mon: enc.mon, lv: enc.lv };
  run.theme = wmap(ch).def.theme;
  const c = wCompNow(ch);
  run.ngoc = c === 'ngoc' ? (S.flags.ngocFox ? 'fox' : 'normal') : null;
  run.comp = c && c !== 'ngoc' ? c : null;
  let units;
  if (enc.kind === 'boss') { const eas = WMAPS[ch].boss || (ch >= 3 ? [0.86, 0.9] : [1, 1]); units = makeEncounter(run, 'boss', run.encCell); units.forEach(u => { u.maxHp = u.hp = Math.round(u.hp * W_BOSS[0] * eas[0]); u.atk *= W_BOSS[1] * eas[1]; if (u.kind === 'boss' && S.flags.bossRage) u.enraged = true; if (u.kind === 'boss' && S.flags.bossSlow) u.g = -60; }); }
  else if (enc.bty) units = wBtyUnits(ch, run, enc);
  else if (enc.ward) {   // 守护战：一波接一波的小怪，守住念诵的人
    const W = enc.ward, F2 = CHAPTERS[ch - 1]; run.encWard = { ...W, lv: enc.lv };
    units = []; for (let i = 0; i < (W.n0 || 3); i++) { const u = makeMonster(F2.mons[RNG.pick(W.mons)], enc.lv, run, 'normal'); u.maxHp = u.hp = Math.round(u.hp * W_NORM[0]); u.atk *= W_NORM[1]; units.push(u); }
  }
  else if (enc.kind === 'elite') {
    units = makeEncounter(run, 'elite', run.encCell);
    if (enc.name) { units[0].name = enc.name; if (enc.pal) units[0].pal = enc.pal; }
    if (enc.abs) units[0].abs = enc.abs;
    units.forEach(u => { u.maxHp = u.hp = Math.round(u.hp * W_ELITE[0]); u.atk *= W_ELITE[1]; });
    if (enc.scripted) units.forEach(u => { u.maxHp = u.hp = Math.round(u.hp * 12); u.atk *= 2.2; });   // 剧情战：打不过的
  } else {
    const def = F.mons[enc.mon] || F.mons[0], n = enc.n || Math.min(4, +RNG.w({ 1: 30, 2: 45, 3: 25 }) + (def.pack ? 1 : 0));
    const pool = enc.mix || [enc.mon];
    units = [];
    for (let i = 0; i < n; i++) { const d2 = i === 0 || RNG.ch(0.6) ? def : F.mons[RNG.pick(pool)] || def; const u = makeMonster(d2, enc.lv, run, 'normal'); if (enc.name && n === 1) u.name = enc.name; u.maxHp = u.hp = Math.round(u.hp * W_NORM[0]); u.atk *= W_NORM[1]; units.push(u); }
  }
  run.encUnits = units;
  return enc.kind === 'boss' ? 'boss' : enc.kind === 'elite' ? 'elite' : 'battle';
}
