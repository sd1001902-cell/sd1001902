// ============ 九幽回廊 · 大地图引擎（多场景，纯逻辑，可在 Node 里测试） ============
// 一章由多个场景组成（野外、室内、地下城、青石镇），场景之间靠「门」相连。
'use strict';
var W_ELITE = [6.24, 1.64], W_BOSS = [3.0, 2.7], W_NORM = [2, 0.85];   // 大地图：小怪约打 4–6 下，精英 20–25 下（2026-11 精英两次加强：血 3.0→4.8→6.24、攻 1.28→1.43→1.64，同级正常装要打得吃力，逼人去刷装备）
const W_SIGHT = 3.3, W_SIGHT_DARK = 1.8, W_BELL = 6.5, W_BLOCK = '#oT^HCKX:';
// 特殊地形：% 蛛网（火把烧）  ~ 网桥（走过就塌）  : 深渊  * 岩浆（冷热交替）  " 毒沼  _ 冰面（会滑）
const wHasKey = (ch, k) => !!k && !!(wkeys()[k] || wstate(ch).flags[k] || wflags()[k]);
const wTerr = ch => (WMAPS[ch] && WMAPS[ch].terrain) || {};
// 网桥塌了以后：走 16 步或过 6 秒重新结好
function wBridgeDown(S, sc, x, y) { const b = S.pz.br && S.pz.br[wgk(sc, x, y)]; if (!b) return false; if (typeof b === 'number') return (S.pz.bc || 0) - b <= 16; return (S.pz.bc || 0) - b.s <= 16 && Date.now() - b.t < 6000; }
const wLavaHot = () => Math.floor(Date.now() / 2600) % 2 === 0;
const _wm = {}, _wi = {};
function wmap(ch, sc) {
  if (ch === 99 && !WMAPS[99] && typeof SAVE !== 'undefined' && SAVE && SAVE.run && SAVE.run.rw) rBuild(SAVE.run);
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
  const m = wmap(ch), S = SAVE.world[wk(ch)], D = wScene(ch), p = S.pos, SG = wSight(), R = Math.ceil(SG);
  const a = D.seen.split('');
  if (m.hasBox == null) m.hasBox = Object.values(m.def.pts).some(P => P.t === 'box');
  const room = m.def.lit || m.def.reveal || m.hasBox;     // 室内、推冰块的地方：一进门就全看得见
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
    if (!room && (Math.abs(x - p.x) > R || Math.abs(y - p.y) > R)) continue;
    const dx = x - p.x, dy = y - p.y;
    if (room || dx * dx + dy * dy <= SG * SG) a[y * m.W + x] = '1';
  }
  D.seen = a.join('');
}
const wSeen = (ch, x, y) => { const m = wmap(ch); return x >= 0 && y >= 0 && x < m.W && y < m.H && wScene(ch).seen[y * m.W + x] === '1'; };
const wSight = () => SAVE.run && SAVE.run.mode === 'rift' && hasMod(SAVE.run, 'dark') ? W_SIGHT_DARK : W_SIGHT;   // 加难度「伸手不见五指」：幻境里看得更近
const wInSight = (ch, x, y) => { const S = SAVE.world[wk(ch)]; if (wmap(ch).def.lit) return true; const p = S.pos, dx = x - p.x, dy = y - p.y, SG = wSight(); return dx * dx + dy * dy <= SG * SG; };

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
const W_PUZ_N = { '%': "Mạng nhện (dùng đuốc đốt)", '~': "Cầu tơ (dẫm qua là sập)", '*': "Dung nham (đợi nó tối xuống rồi qua)", '"': "Đầm độc", '_': "Mặt băng (trượt một mạch tới cuối)" };
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
  if (!free(nx, ny)) return { blocked: true, acts: [{ toast: "Đẩy không nổi — bên kia có vật chắn" }] };
  let slid = 0; while (wTile(m, nx, ny) === '_' && free(nx + dx, ny + dy)) { nx += dx; ny += dy; slid++; }
  b.x = nx; b.y = ny; const acts = [{ sfx: 'step' }];
  if (slid) acts.push({ toast: "Khối băng “ùng ục” trượt đi" });
  const byFlag = {};
  for (const c in m.pts) { const P = m.def.pts[c]; if (P.t !== 'boxgoal') continue; (byFlag[P.flag] = byFlag[P.flag] || { P, pts: [] }).pts.push(...m.pts[c]); }
  for (const f in byFlag) { if (S.flags[f]) continue; const G = byFlag[f];
    if (G.pts.every(p => wBoxes(ch).some(q => q.x === p.x && q.y === p.y))) { S.flags[f] = 1; acts.push({ sfx: 'rare' }, { toast: G.P.done || "Mắt băng sáng lên — cửa băng “ầm ầm” mở ra!" }); } }
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
  if (P && ['camp', 'boss', 'gate', 'qspot', 'grave', 'qfight', 'door', 'plate', 'rin', 'rexit', 'rpylon'].includes(P.t)) return false;
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
  if (WMAPS[ch].rift) return rSpawnFloor(ch, sc);
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
    const scared = !WMAPS[ch].rift && wkeys().wolftooth && !mn.elite && mn.lv <= (SAVE.chars[SAVE.cls] || { level: 1 }).level - 1;   // 狼王牙：弱小的妖物不敢扑上来
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
const AFF_WHO = { ngoc: 'Ngoc', zhen: "Cô Trân", liu: "Sư phụ Lưu", kang: "Quản gia Khang", long: "Long đạo trưởng" };
const AFF_LV = ["Xa lạ", "Xa lạ", "Quen biết", "Quen biết", "Thân quen", "Thân quen", "Tin tưởng", "Tin tưởng", "Tri kỷ", "Tri kỷ", "Sinh tử chi giao"];
function wAff(id, d) { SAVE.aff = SAVE.aff || {}; const v = Math.max(0, Math.min(Math.max(10, SAVE.aff[id] || 0), (SAVE.aff[id] || 0) + d));   /* 送礼能把好感送到 25，剧情里的加减不会把它压回 10 */ SAVE.aff[id] = v; return v; }
const wAffOf = id => (SAVE.aff || {})[id] || 0;
function wAffActs(o) { const a = []; for (const k in o) { wAff(k, o[k]); a.push({ aff: [k, o[k]] }); } return a; }
// 对话里的选择、选择题的后果
function wFx(ch, o, run) {
  const S = wstate(ch), a = [];
  if (!o) return a;
  if (o.set) Object.assign(S.flags, o.set);
  if (o.key && !wkeys()[o.key]) { wkeys()[o.key] = 1; a.push({ toast: `Nhận “${W_KEYS[o.key].n}” — ${W_KEYS[o.key].d}` }); }
  if (o.aff) a.push(...wAffActs(o.aff));
  if (o.gold) { SAVE.gold = Math.max(0, SAVE.gold + o.gold); if (run && o.gold > 0) run.goldGot += o.gold; a.push({ toast: `Bạc ${o.gold > 0 ? '+' : ''}${o.gold}` }); }
  if (o.rw) { const r = wReward(ch, o.rw, run); if (r) a.push({ toast: r }); }
  if (o.mb) { SAVE.mb = Math.max(0, wMb() + o.mb); a.push({ toast: `Minh tệ ${o.mb > 0 ? '+' : ''}${o.mb}` }); }
  if (o.fight) a.push({ fight: { ...o.fight, first: 'e' }, key: {} });
  if (o.bump) a.push(...wBump(ch, o.bump[0], o.bump[1], run));   // 选了这一项，算完成某个目标（结局的分支要等玩家真选了才算）
  return a;
}
function wChoose(ch, id, i, run) { const o = CHOICES[id].opts[i], a = [];
  if (o.need && !wstate(ch).flags[o.need] && !wflags()[o.need] && !wkeys()[o.need]) return [{ dlg: o.nlines || [['narr', "…Bạn không nghĩ ra nên nói gì."]] }].concat(wFx(ch, o.nfx, run)); if (o.lines) a.push({ dlg: wLines(ch, o.lines) }); return a.concat(wFx(ch, o, run)); }

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
    const x = Math.round(xpNeed(qlv) * rw.xp * (ch >= 2 ? (WMAPS[ch].qxp || 0.3) : 0.38)); const ups = gainXp(cls, x); if (run) run.xpGot += x; parts.push(`Kinh nghiệm +${x}${ups ? ` (lên cấp ${ch2.level}!)` : ''}`); }
  if (rw.gold) { SAVE.gold += rw.gold; if (run) run.goldGot += rw.gold; parts.push(`Bạc +${rw.gold}`); }
  if (rw.mb) { SAVE.mb = wMb() + rw.mb; parts.push(`Minh tệ +${rw.mb}`); }
  if (rw.item) { const it = storeItem(run && run.world ? run : null, makeItem({ ilvl: ch >= 2 ? chIlvl(ch, ch2.level) : ch2.level + 2, rarity: rw.item, slot: rw.slot, cls })); parts.push(`<b class="r-${it.rarity}">${it.name}</b>`); }
  if (rw.pot) { SAVE.potExtra = (SAVE.potExtra || 0) + rw.pot; if (run) run.potions += rw.pot; parts.push(`Giới hạn đan dược +${rw.pot}`); }
  if (rw.key) { wkeys()[rw.key] = 1; parts.push(`Vật phẩm cốt truyện “${W_KEYS[rw.key].n}”`); }
  if (rw.flag) wflags()[rw.flag] = 1;
  if (rw.setw) Object.assign(wflags(), typeof rw.setw === 'function' ? rw.setw(wstate(ch)) : rw.setw);
  if (rw.eat && run) { const F = wEat(run, rw.eat); if (F) parts.push(`Đã ăn “${F.n}”: ${F.d}`); }
  if (rw.flag === 'longTown') { SAVE.comps = SAVE.comps || { ngoc: 1 }; if (!SAVE.comps.long) { SAVE.comps.long = 1; parts.push("Long đạo trưởng có thể làm đồng hành của bạn rồi"); } }
  return parts.join(" ");
}
// 康总管的美食图谱：出门前吃一道，管到下次在篝火边休息
const FOODS = [
  { id: 'zhouzi',  n: "Giò heo kho Túy Tiên Lâu", flag: null,    d: "Chuyến này mang thêm 1 viên đan dược", pot: 1 },
  { id: 'nver',    n: "Gà say rượu Nữ Nhi Hồng",   flag: 'dish1', d: "Tốc độ +8", st: { spd: 8 } },
  { id: 'songrong',n: "Đùi heo rừng hầm nấm tùng", flag: 'dish2', d: "Khí huyết tối đa +12%", st: { hpPct: 12 } },
  { id: 'zhusun',  n: "Gà hầm nấm trúc",     flag: 'dish3', d: "Sát thương +10%", st: { dmgPct: 10 } },
  { id: 'lajiao',  n: "Cá nấu cay Hang Hỏa Diệm", flag: 'dish4', d: "Tỉ lệ chí mạng +6%", st: { crit: 6 } },
  { id: 'tianluo', n: "Ốc xào tía tô",   flag: 'dish5', d: "Kháng toàn bộ +12", st: { res: 12 } },
  { id: 'xuelian', n: "Gà hầm tuyết liên",     flag: 'dish6', d: "Hút máu +3%", st: { leech: 3 } },
];
const foodsOpen = () => FOODS.filter(f => !f.flag || wflags()[f.flag]);
function wEat(run, id) { const F = FOODS.find(f => f.id === id); if (!F || !run) return null; run.food = id; if (F.pot) run.potions += F.pot; run.hp = Math.min(runStats(run).maxHp, run.hp + runStats(run).maxHp * 0.2); return F; }
// ---------------- 交易：各章的摊子（鬼市、冰家村……） ----------------
const W_SHOPS = {};
const W_MINI_RW = {};   // 小游戏的奖励：W_MINI_RW[id](ch, 成绩) → 提示文字
const wMb = () => SAVE.mb || 0;
const wCurN = cur => cur === 'mb' ? wMb() : cur === 'shang' ? (SAVE.shang || 0) : SAVE.gold;
const wCurName = cur => cur === 'mb' ? "minh tệ" : cur === 'shang' ? "tiền thưởng" : "lượng";
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
  const S = wstate(ch), SH = W_SHOPS[id], st = wShopStock(ch, id), e = st.items[i]; if (!e) return { err: "Không có món này" };
  if (e.sold) return { err: "Đã bán rồi" };
  if (e.show && !e.show(S)) return { err: "Không có món này" };
  if (e.need && !e.need(S)) return { err: e.needMsg || "Giờ chưa mua được" };
  if (e.k === 'exchange') { if (SAVE.gold < e.gold) return { err: "Không đủ bạc" }; SAVE.gold -= e.gold; SAVE.mb = wMb() + e.mb; return { ok: `${e.gold} lượng đổi được ${e.mb} minh tệ`, acts: [] }; }
  if (e.k === 'consum' && (run && (run[e.id] || 0) >= (e.max || 9))) return { err: `Mang tối đa ${e.max} cái` };
  if (!wPay(SH.cur, e.price)) return { err: `Không đủ ${wCurName(SH.cur) === "lượng" ? "Bạc" : wCurName(SH.cur)}` };
  const cls = run ? run.cls : SAVE.cls; let msg = '', item = null, acts = [];
  if (e.k === 'item') { item = storeItem(null, e.it); e.sold = true; msg = `Đã mua “${e.it.name}”`; }
  else if (e.k === 'gamble' || e.k === 'blind') {
    if (e.k === 'blind' && featureOn('gems') && Math.random() < 0.35) { const key = gemKey(RNG.pick(Object.keys(GEM_TYPES)), RNG.i(1, 2)); addGem(key); msg = `Trong hộp là một viên ${gemName(key)}`; }
    else { const r = e.k === 'blind' ? RNG.w({ magic: 20, rare: 45, set: 20, legend: 15 }) : rollRarity('gamble', 0, 0);
      item = storeItem(null, makeItem({ slot: e.slot, ilvl: wShopLv(ch), rarity: r, cls })); msg = `Mở ra được: “${item.name}”`; }
  }
  else if (e.k === 'gem') { addGem(e.key); e.sold = true; msg = `Mua một viên ${gemName(e.key)}`; }
  else if (e.k === 'food') { const first = !S.flags['ate_' + e.food], F = wEat(run, e.food); S.flags['ate_' + e.food] = 1; msg = F ? `Đã ăn “${F.n}”: ${F.d} (hiệu lực đến lần nghỉ sau)` : "Đã ăn"; if (first) acts = acts.concat(wBump(ch, 'eat', e.tag || e.food, run)); }
  else if (e.k === 'consum') { if (run) run[e.id] = (run[e.id] || 0) + 1; msg = `Mua ${e.n} (giờ có ${run ? run[e.id] : 1} cái)`; }
  else if (e.k === 'intel') { S.flags[e.flag] = 1; e.sold = true; msg = e.msg || "Đã ghi nhớ"; }
  else if (e.k === 'key') { wkeys()[e.key] = 1; e.sold = true; msg = `Nhận “${W_KEYS[e.key].n}” — ${W_KEYS[e.key].d}`; }
  else if (e.k === 'mats') { SAVE.mats += e.cnt; msg = `Hồn tinh +${e.cnt}`; }
  else if (e.k === 'forge') { const it0 = makeItem({ slot: e.slot, ilvl: wShopLv(ch), rarity: e.rar, cls }); if (e.sp) addSpecial(it0); item = storeItem(null, it0); e.sold = true; msg = `Đổi được “${item.name}”${item.sp ? " (có thuộc tính đặc biệt)" : ''}`; }
  else if (e.k === 'get') { S.flags['got_' + e.id] = 1; e.sold = true; msg = `Mua được “${e.n}”`; acts = acts.concat(wBump(ch, 'get', e.id, run)); }
  if (e.after) acts.unshift({ dlg: wLines(ch, e.after) });
  return { ok: msg, item, acts };
}
// 当铺：把储物箱里的东西换成钱
const wShopSellPrice = (SH, it) => Math.max(1, Math.round(sellPrice(it) * (SH.sellRate || 0.15)));
function wShopSell(ch, id, itemId) {
  const SH = W_SHOPS[id], it = SAVE.stash.find(x => x.id === itemId); if (!it || !SH.sell) return { err: "Không có món này" };
  const p = wShopSellPrice(SH, it); returnGems(it); SAVE.stash.splice(SAVE.stash.indexOf(it), 1);
  if (SH.cur === 'mb') SAVE.mb = wMb() + p; else SAVE.gold += p;
  return { ok: `“${it.name}” cầm được ${p} ${wCurName(SH.cur)}` };
}
// 开光：随手洗掉一条词条，换一条新的
function wShopReroll(ch, id, itemId) {
  const SH = W_SHOPS[id], it = findOwned(itemId); if (!it || !SH.reroll) return { err: "Không có món này" };
  if (!it.aff || !it.aff.length) return { err: "Món này không có thuộc tính nào để khai quang" };
  if (!wPay(SH.cur, SH.reroll)) return { err: "Không đủ minh tệ" };
  const idx = RNG.i(0, it.aff.length - 1), old = it.aff[idx], keep = it.aff.filter((_, j) => j !== idx).map(a => a[0]).concat(Object.keys(it.imp || {}));
  const na = rollAffixes(1, it.ilvl, affMult(it), keep, false, it.slot)[0]; if (na) it.aff[idx] = na;
  return { ok: `“${fmtStat(old[0], old[1])}”→“${na ? fmtStat(na[0], na[1]) : "Không đổi"}”` };
}
// ---------------- 悬赏榜：雷老虎的榜，每章丙、乙、甲三档 ----------------
const W_BOUNTY = {};   // W_BOUNTY[ch] = [{ id, tier: 1丙 2乙 3甲, n, mon, z（出没的区域）, lore, say, abs, half, flee, minions, pal, spd }]
const BTY_TIER = {
  1: { n: "Hạng Bính", lv: -1, hp: 3, atk: 2.6, shang: 15, xp: 0.35 },
  2: { n: "Hạng Ất", lv: 1, hp: 4, atk: 2.6, shang: 35, xp: 0.6 },
  3: { n: "Hạng Giáp · Đầu sỏ", lv: 3, hp: 4.2, atk: 2.5, shang: 80, xp: 1.2 } };
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
  const B = wBty(ch), D = wBtyDef(ch, id); if (!D) return { err: "Không có tờ truy nã này" };
  if (B.on[id]) return { err: "Đang truy rồi" };
  if (D.tier === 3 && B.done[id]) return { err: "Kẻ này đã đền tội" };
  if (B.took >= BTY_PER_REST) return { err: `Mỗi lượt nhận tối đa ${BTY_PER_REST} tờ. Nghỉ chân bên lửa trại, bảng sẽ đổi lượt mới` };
  const r = wBtySpawn(ch, D); if (!r) return { err: "Vùng này không tìm thấy dấu vết của nó" };
  B.took++; B.on[id] = 1; B.offer = B.offer.filter(x => x !== id);
  return { ok: `Đã nhận “${D.n}” — ${wBtyWhere(ch, D)}` };
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
    return [{ dlg: [['narr', `${D.n} cụp đuôi chạy mất.`], ['narr', r ? `Nhìn hướng thì nó chạy về phía ${wBtyWhere(ch, D)}. Lần sau ra tay phải nhanh.` : "Chạy mất tăm rồi."]] }];
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
  acts.push({ toast: `Truy nã “${D.n}” đã đền tội! ${postg ? `Tiền thưởng +${T.shang}` : `Bạc +${gold}`}  ${rw}  <b class="r-${it.rarity}">${it.name}</b>${it.sp ? " (có thuộc tính đặc biệt)" : ''}` }, { sfx: 'rare' });
  return acts;
}
// 地图上的伤害（冻伤、冰锥）：不会打死人
function wHurt(run, pct) { const mx = runStats(run).maxHp, d = Math.round(mx * pct); const before = run.hp; run.hp = Math.max(1, run.hp - d); return before - run.hp; }
const W_KEYS = {
  zhaohun: { n: "Chuông Chiêu Hồn", d: "Trên bản đồ thấy được yêu vật ở xa hơn, kể cả trong sương mù.", spr: 'fu' },
  shufang: { n: "Chìa khóa thư phòng", d: "Chìa khóa đồng của thư phòng huyện nha, treo dưới kinh đường mộc.", spr: 'key' },
  diary: { n: "Nhật ký huyện lệnh", d: "“Tâm đắc làm quan”. Kẹp bên trong một tờ giấy: “Ngũ hành tương sinh, Mộc là khởi đầu”.", spr: 'scroll' },
  wolftooth: { n: "Nanh Sói Vương", d: "Tiểu yêu cấp thấp hơn bạn không dám chủ động lao vào.", spr: 'key' },
  guanyin: { n: "Ấn quan cũ", d: "Ấn quan sư phụ Lưu dùng ở huyện nha năm xưa. Nha dịch của huyện lệnh thấy nó là không dám xông lên hộ giá.", spr: 'i_ring' },
  jingtang: { n: "Kinh Đường Mộc", d: "Kinh đường mộc huyện thái gia dùng khi thăng đường. Không có nó, lão không đập bàn được.", spr: 'key' },
  pingan: { n: "Khấu Bình An", d: "A Phúc đeo hồi nhỏ. Đỡ được bút phán quan.", spr: 'i_amulet' },
};
// 计数类目标（打怪、找线索、采药、掉落、解谜）+1
function wBump(ch, k, v, run) {
  const S = wstate(ch), acts = [], m = wMain(ch);
  if (m && m.goal[k] === v) {
    S.kc++;
    if (S.kc >= (m.goal.n || 1)) acts.push(...wStepActs(ch, m, run));
    else acts.push({ toast: `${m.t} (${S.kc}/${m.goal.n})` });
  }
  for (const q of WQ[ch].side) {
    const s = S.side[q.id]; if (!s || s.st !== 'on') continue;
    const st = q.steps[s.step]; if (st.goal[k] !== v) continue;
    s.n++;
    if (s.n >= (st.goal.n || 1)) { if (st.lines) acts.push({ dlg: st.lines }); acts.push(...wAdvanceSide(ch, q, run)); }
    else acts.push({ toast: `${q.t} (${s.n}/${st.goal.n})` });
  }
  return acts;
}
function wCompleteMain(ch, run) {
  const S = wstate(ch), m = wMain(ch), acts = [];
  if (m.after) acts.push({ dlg: wLines(ch, m.after) });
  if (m.choiceAfter) acts.push({ choice: typeof m.choiceAfter === 'function' ? m.choiceAfter(S) : m.choiceAfter });
  Object.assign(S.flags, m.set || {});
  if (m.aff) acts.push(...wAffActs(m.aff));
  if (m.comp) { SAVE.comps = SAVE.comps || { ngoc: 1 }; if (!SAVE.comps[m.comp]) { SAVE.comps[m.comp] = 1; acts.push({ toast: `${COMPANIONS[m.comp].n} có thể làm đồng hành của bạn rồi (chọn ở lửa trại hoặc trang xuất chinh)` }); } }
  const r = wReward(ch, m.rw, run);
  acts.push({ toast: `Hoàn thành nhiệm vụ chính “${m.t}” ${r ? " " + r : ''}` });
  if (m.startSide && !S.side[m.startSide]) { S.side[m.startSide] = { st: 'on', step: 0, n: 0 }; const q = WQ[ch].side.find(q => q.id === m.startSide); acts.push({ toast: `Nhận nhiệm vụ phụ “${q.t}”` }); }
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
    acts.push({ toast: `Hoàn thành nhiệm vụ phụ “${q.t}”  ${wReward(ch, q.rw, run)}` });
  } else acts.push({ toast: `Nhiệm vụ phụ “${q.t}”: ${(q.steps[s.step].hint && SAVE.guide !== 'full' ? q.steps[s.step].hint : q.steps[s.step].d).replace('{n}', 0)}` });
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
    return a.concat([{ toast: `${m.t} (${S.kc}/${m.goal.talks.length})` }]);
  }
  for (const q of WQ[ch].side) {
    const s = S.side[q.id]; if (!s || s.st !== 'on') continue;
    const st = q.steps[s.step];
    if (st.goal.talk === npc && st.needKey && !wkeys()[st.needKey]) return [{ dlg: st.waitLines || [[npc, "Đồ chưa lấy được phải không?"]] }];
    if (st.goal.talk === npc && st.needF && !st.needF(S)) return [{ dlg: wLines(ch, st.waitLines) || [[npc, "Còn chưa xong phải không?"]] }, ...(st.waitMini ? [{ mini: st.waitMini }] : [])];
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
    return [{ dlg: q.offer || [] }, { toast: `Nhận nhiệm vụ phụ “${q.t}”: ${(st.hint && SAVE.guide !== 'full' ? st.hint : st.d).replace('{n}', 0)}` }];
  }
  if (npc === 'kang' && wflags().foodbook && S.sc === 'town') return [{ dlg: [['kang', RNG.pick(["Huynh đệ tốt! Đói rồi phải không? Hôm nay muốn ăn gì?", "Lại đây lại đây, bếp sau vừa ra nồi!", "Ăn no rồi hẵng ra cửa! Ta mời — à không, ghi sổ."])]] }, { food: true }];
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
    return [{ toast: S.flags.bar ? "Cạch — hàng rào đỏ chìm xuống đất, hàng rào xanh trồi lên" : "Cạch — hàng rào xanh chìm xuống đất, hàng rào đỏ trồi lên" }, { sfx: 'door' }];
  }
  if (!wPtVisible(ch, x, y)) return [];
  switch (P.t) {
    case 'camp':
      S.camp = P.id; if (!S.camps.includes(P.id)) { S.camps.push(P.id); acts.push({ toast: `Đã thắp lửa trại “${P.n}”` }); }
      if (m && m.goal.reach === P.id) { if (wReachOk(ch, m)) acts.push(...wStepActs(ch, m, run)); else acts.push({ toast: m.escortMiss || "Người chưa theo kịp" }); }
      return acts;
    case 'qspot':
      if (m && m.goal.reach === P.id && m.waves) {   // 守阵眼：一波接一波
        const a = [{ dlg: wLines(ch, m.lines) || [] }];
        m.waves.forEach((w, i) => { if (i && m.between && m.between[i - 1]) a.push({ dlg: m.between[i - 1] }); a.push({ fight: { ...w, first: 'e' }, key: i === m.waves.length - 1 ? { main: m.id } : {} }); });
        return a;
      }
      if (m && m.goal.reach === P.id) return wReachOk(ch, m) ? wStepActs(ch, m, run) : [{ toast: m.escortMiss || "Người chưa theo kịp" }];
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
      S.got[k] = 1; return [{ dlg: P.lines || [] }, { toast: `Tìm thấy manh mối “${P.n}”` }, ...wBump(ch, 'clue', P.grp, run)];
    case 'herb': S.got[k] = 1; return [{ toast: `Hái được một cây ${P.n}` }, ...wBump(ch, 'herb', P.grp, run)];
    case 'relic': S.got[k] = 1; wkeys()[P.key] = 1; return [{ dlg: P.lines || [] }, { toast: `Nhận “${W_KEYS[P.key].n}” — ${W_KEYS[P.key].d}` }, { sfx: 'legend' }];
    case 'chest': if (P.needKey && !wkeys()[P.needKey]) return [{ toast: P.lock || "Không mở được" }]; S.got[k] = 1; return [...(P.lines ? [{ dlg: P.lines }] : []), { chest: true, q: P.q }];
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
    return [{ dlg: P.wake || [['narr', "Khói xanh của hương Tỉnh Hồn bay tới. Hắn hắt xì một cái, mắt dần dần có thần."], ['narr', "“Tôi… tôi ở đây làm gì thế này?”"], ['narr', "Hắn nhìn quanh một lượt, co giò chạy xuống núi."]] }, { toast: `Đã gọi tỉnh ${P.n || "một tín đồ"} (đã gọi tỉnh ${F.woke} người)` }, { sfx: 'buff' }];
  }
  if (S.got[k] === 1) return [{ toast: `${P.n || "Hắn"} đang ngất. Có hương Tỉnh Hồn rồi hẵng quay lại gọi dậy` }];
  S.got[k] = 1; F.knock = (F.knock || 0) + 1;
  return [{ dlg: P.knock || [['narr', `${P.n || "Tín đồ"} mắt dại ra, dang tay chặn giữa đường, miệng lẩm bẩm “tiên đan… tiên đan…”`], ['narr', "Bạn chặt một chưởng vào gáy hắn. Hắn mềm nhũn ngã xuống."]] }, { toast: "Đánh ngất rồi — có hương Tỉnh Hồn thì quay lại gọi hắn dậy" }, { sfx: 'hit' }];
}
// 阴阳镜：同一处地方，阳面和阴面两个样（( 只在阳面能走，) 只在阴面能走）
const wYinScene = ch => { const d = wmap(ch).def; return !!d.yy; };
function wYinToggle(ch) {
  const S = wstate(ch), m = wmap(ch), c = wTile(m, S.pos.x, S.pos.y);
  if (!wYinScene(ch)) return [{ toast: "Chỗ này không soi ra mặt Âm" }];
  if ((c === '(' && !S.flags.yin) || (c === ')' && S.flags.yin)) return [{ toast: "Chỗ dưới chân này, sang mặt bên kia lại trống không — đổi chỗ khác rồi soi" }];
  S.flags.yin = S.flags.yin ? 0 : 1; wReveal(ch);
  const D = WMAPS[ch].scenes[S.sc], a = [{ sfx: 'magic' }, { toast: S.flags.yin ? "Xoay gương Âm Dương — mặt Âm. Ven đường đứng đầy ma" : "Xoay gương Âm Dương — trở về mặt Dương" }];
  if (D.onYin) { const r = D.onYin(S); if (r) a.push(...r); }
  return a;
}
// 和挡路的东西交互（石门、古碑、灯、告示、锁着的门）
function wUse(ch, x, y, run) {
  const S = wstate(ch), m = wmap(ch), P = wPt(ch, x, y), M = wMain(ch); if (!P || (P.when && P.t !== 'npc' && !P.when(S))) return [];
  const k = wgk(S.sc, x, y);
  if (P.t === 'gate' && !S.flags[P.flag]) {
    if (M && M.goal.gate === P.id) return wStepActs(ch, M, run);
    return [{ dlg: [['narr', P.lock || "Cửa đóng."]] }];
  }
  if (P.t === 'door' && !wDoorOpen(ch, P)) return [{ dlg: [['narr', P.lock || "Cửa khóa."]] }];
  if (P.t === 'stele') {
    if (wGoalOpen(ch, { rub: P.id })) return [{ dlg: P.rubLines || [] }, ...wBump(ch, 'rub', P.id, run)];
    return [{ dlg: [['narr', P.desc || "Một tấm bia cổ."]] }];
  }
  if (P.t === 'sign') return [{ dlg: P.lines || [['narr', P.desc || '']] }];
  if (P.t === 'xintu') return wXintu(ch, k, P);
  if (P.t === 'board') { const first = P.lines && !S.got[k]; S.got[k] = 1; return [...(first ? [{ dlg: wLines(ch, P.lines) }] : []), { board: true }]; }
  if (P.t === 'mini') {   // 钓鱼洞、雪堆……：每歇一次能玩几回
    const k2 = 'mn_' + k, r = S.pz.restN || 0, used = S.pz[k2] && S.pz[k2].r === r ? S.pz[k2].n : 0;
    if (P.when2 && !P.when2(S)) return [{ dlg: P.lock || [['narr', "Giờ thì không được."]] }];
    if (used >= (P.per || 3)) return [{ toast: P.tired || "Hôm nay đến đây thôi — nghỉ chân bên lửa trại rồi quay lại" }];
    S.pz[k2] = { r, n: used + 1 };
    return [...(P.lines ? [{ dlg: wLines(ch, P.lines) }] : []), { mini: P.mini }];
  }
  if (P.t === 'boxreset') { if (wBoxSolved(ch)) return [{ toast: "Cửa băng đã mở rồi." }]; if (S.pz.box) delete S.pz.box[S.sc]; return [{ dlg: P.lines || [['narr', "Bạn gõ vào cột băng. Các khối băng “rắc rắc” lùi về chỗ cũ."]] }]; }
  if (P.t === 'lamp') {
    const Z = m.def.pz[P.grp];
    if (S.flags[Z.flag]) return [{ dlg: [['narr', Z.lit || "Đèn đều sáng cả rồi."]] }];
    if (S.got[k]) return [{ toast: "Ngọn đèn này đã sáng rồi" }];
    const i = S.pz[P.grp] || 0;
    if (Z.order[i] === P.wx) {
      S.got[k] = 1; S.pz[P.grp] = i + 1;
      if (i + 1 >= Z.order.length) { S.flags[Z.flag] = 1; const kk = []; if (Z.key) { wkeys()[Z.key] = 1; kk.push({ toast: `Nhận “${W_KEYS[Z.key].n}” — ${W_KEYS[Z.key].d}` }); } return [{ sfx: 'legend' }, { dlg: Z.done }, ...kk, ...wBump(ch, 'puzzle', P.grp, run)]; }
      return [{ toast: `${Z.verb || "Đã thắp"}“${P.lab || WX[P.wx].n}” (${i + 1}/${Z.order.length})` }, { sfx: 'magic' }];
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
    if (!wHasKey(ch, TR.web || 'torch')) return { blocked: true, acts: [{ toast: "Mạng nhện vừa dính vừa dai, đao chém không đứt — phải dùng lửa đốt" }] };
    S.got[wgk(S.sc, x, y)] = 1;
    for (const [dx, dy] of W_DIRS8) if (wTile(m0, x + dx, y + dy) === '%') S.got[wgk(S.sc, x + dx, y + dy)] = 1;   // 一燎一片
    pre.push({ toast: "Đuốc vừa liếm tới, mạng nhện xèo xèo cháy thành tro" }, { sfx: 'fire' });
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
    if (run.hp > mx * 0.15) { run.hp = Math.max(1, run.hp - d); pre.push({ toast: c1 === '*' ? `Dung nham đang nóng! Khí huyết -${hpShow(d, heroLv())} (đợi nó tối xuống rồi đi)` : `Nước độc ngấm vào giày, khí huyết -${hpShow(d, heroLv())}` }); }
  }
  // 每章自己的地形规矩（暴风雪、塌方、扒手……）
  if (run && WMAPS[ch].onStep) { const r = WMAPS[ch].onStep(ch, S, run, x, y); if (r) { if (r.stop) return { acts: [...pre, ...r.acts] }; pre.push(...(r.acts || [])); } }
  // 巡逻的眼睛：被看见就被赶回门口
  const seenBy = W_AUTOSOLVE ? null : wWatchSee(ch, x, y);
  if (seenBy && seenBy.alarm && (S.pz.alarmT || 0) > S.pz.bc) { /* 刚打完增援，喘口气 */ }
  else if (seenBy && seenBy.alarm) { S.pz.alarmT = S.pz.bc + 8; return { acts: [...pre, { toast: seenBy.caught || "Báo động vang lên!" }, { sfx: 'fail' }, { fight: { ...seenBy.alarm, first: 'e' }, key: {} }] }; }
  if (seenBy && !seenBy.alarm) { S.pos = { ...(S.pz.ent || from) }; wReveal(ch); return { acts: [...pre, { toast: seenBy.caught || `Bị ${seenBy.n || "lính tuần đêm"} phát hiện! Bạn bị đuổi ra ngoài` }, { sfx: 'fail' }] }; }
  if (WMAPS[ch].rift) { const r = rStep(ch, x, y, run); if (r.stop) return { acts: [...pre, ...r.acts] }; pre.push(...r.acts); }
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
  if (WMAPS[ch].rift) return rFight(ch, mn, first);
  const enc = { kind: mn.elite ? 'elite' : 'battle', mon: mn.m, lv: mn.lv, name: mn.name, pal: mn.pal, first, tag: mn.tag };
  if (mn.elite && SAVE.run) { enc.affs = eliteAffsOf(SAVE.run, mn); enc.rare = !!mn.rr; }
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
    if (Math.random() < (g.p || 0.5) || S.pz[key] >= 3) { S.pz[key] = 0; acts.push({ toast: `Nhận “${g.dn}”` }, ...wBump(ch, 'drop', g.drop, run)); }
  }
  return acts;
}
// 战斗赢了
function wFightWon(ch, key, run) {
  if (WMAPS[ch].rift) return rWon(ch, key, run);
  const S = wstate(ch), D = wScene(ch), acts = [];
  if (key.mon) {
    const i = D.mons.findIndex(mn => mn.id === key.mon); if (i < 0) return acts;
    if (D.mons[i].bty) return wBtyWon(ch, D.mons[i], run);
    const mn = D.mons.splice(i, 1)[0];
    if (mn.elite && mn.pt) D.dead[mn.id] = { t: Date.now(), pt: mn.pt };   // 精英的掉落在战斗结算里（四成宝品），休息后重生
    if (mn.tag) acts.push(...wBump(ch, 'kill', mn.tag, run));
    acts.push(...wBump(ch, 'killz', mn.z, run));
    acts.push(...wDrop(ch, mn, run));
    if (WMAPS[ch].mbDrop) { const [a0, a1] = WMAPS[ch].mbDrop, n = Math.round((a0 + Math.random() * (a1 - a0)) * (mn.elite ? 4 : 1)); SAVE.mb = wMb() + n; acts.push({ toast: `Minh tệ +${n}` }); }
    wEnsureDropMons(ch);
  }
  if (key.main) {
    if (key.pt) S.got[key.pt] = 1;
    if (key.boss) { S.flags['boss_' + key.boss] = 1;   // 首领首杀：三成几率掉一件传奇（优先本章的）
      const cls = run ? run.cls : SAVE.cls;
      if (RNG.ch(0.3)) { const it = storeItem(run && run.world ? run : null, makeItem({ ilvl: chIlvl(ch, 99), rarity: 'legend', cls })); acts.push({ toast: `Thủ lĩnh rơi truyền kỳ: <b class="r-legend">${it.name}</b>` }); } }
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
  if (S.flags.escort) { const m = wMain(ch); msg = (m && m.escortLost) || "Người đi theo bạn bị yêu vật kéo đi mất."; S.flags.escort = 0; }
  if (!(S.camp && wTele(ch, S.camp))) { const D = WMAPS[ch], st = wmap(ch, D.start).pts[D.startPt][0]; S.sc = D.start; S.pos = { x: st.x, y: st.y }; wScene(ch); wReveal(ch); }
  run.food = null; run.hp = runStats(run).maxHp; run.potions = wPotBase() + (SAVE.potExtra || 0);
  return { lost, msg };
}
// 篝火：休息、夜话
function wRest(ch, run) { const S0 = wstate(ch); S0.pz.restN = (S0.pz.restN || 0) + 1; run.food = null; run.hp = runStats(run).maxHp; run.potions = wPotBase() + (SAVE.potExtra || 0); wRespawn(ch); const S = wstate(ch), pre = [];
  if (WMAPS[ch].daynight) { S.flags.night = S.flags.night ? 0 : 1; pre.push({ toast: S.flags.night ? "Trời tối. Đèn chợ ma lần lượt sáng lên." : "Trời sáng. Chợ ma dọn hàng, chỉ còn lại một đất tiền giấy." }); }
  return pre.concat(wCampTalk(ch)); }
function wCampTalk(ch) {
  const S = wstate(ch);
  const L = (CAMPTALK[ch] || []).find(t => !S.flags['ct_' + t.id] && (!t.at || t.at.includes(S.camp)) && (!t.when || t.when(S)));
  if (!L) return [];
  S.flags['ct_' + L.id] = 1;
  const a = [{ banner: ["Chuyện đêm bên lửa trại", L.t] }, { dlg: L.lines }];
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
const wEliteAt = (ch, x, y) => !WMAPS[ch].rift && wScene(ch).mons.some(mn => mn.elite && mn.x === x && mn.y === y && !(wmap(ch).def.pts[mn.pt] || {}).gate);
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
  if (!R && !R2.near) return { path: [], near: true, puzzle: wWatchActive(ch) && !(S.pz.sneak || {})[S.sc] ? "Tuần tra" : "Lạc đường", x: R2.x, y: R2.y, door: R2.door };
  if (!p0) return R;
  const n = wPathNear(ch, p0.x, p0.y);
  const c0 = wTile(wmap(ch), p0.x, p0.y), P0 = wmap(ch).def.pts[c0];
  return { path: n.path, near: true, puzzle: P0 && P0.box ? "Cửa băng (đẩy khối băng lên mắt băng)" : c0 === '(' || c0 === ')' ? "Đường đứt (mặt này không qua được — dùng Gương Âm Dương soi sang mặt kia rồi hãy qua)" : W_PUZ_N[c0] || "Cơ quan", who: P0 && P0.t === 'xintu' ? (P0.n || "một tín đồ") : null, x: p0.x, y: p0.y, door: R2.door };
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
    out.push({ main: false, id: q.id, offer: true, key: true, t: q.t, d: `Đi tìm ${(SPEAKERS[q.giver] || {}).n || "người giao nhiệm vụ"}, nhận nhiệm vụ phụ này`, mark: q.giver });
  }
  for (const id in (S.bty && S.bty.on) || {}) { const D = wBtyDef(ch, id); if (D) out.push({ main: false, bty: true, id: 'bty_' + id, t: `Truy nã · ${D.n}`, d: `${BTY_TIER[D.tier].n} ${wBtyWhere(ch, D)}`, mark: 'mon:bty_' + id }); }
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
  if (enc.rift) return rPrep(run, enc);
  const ch = run.chapter, S = wstate(ch), F = CHAPTERS[ch - 1];
  run.encCell = { mon: enc.mon, lv: enc.lv, affs: enc.affs, rare: enc.rare };
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

// ============ 九幽幻境（大秘境）：走路遇怪版（2026-11） ============
// 照暗黑的大秘境做：限时，杀怪涨进度，进度满了召唤守关妖王；一局四层，每层从十章的野外场景里抽一张，怪物密度是剧情里的三倍；
// 撞上一群怪，旁边两格内的怪群一起卷进来（拉怪合战）；精英倒下掉一颗精魄球，走过去捡；每层一座塔。
// 幻境用一个假的章节号 RCH：地图是从别的章节抄来、抹掉机关和人物的；任务表是空的。
const RCH = 99;
var R_NORM = [1.3, 0.8], R_ELITE = [3.2, 1.25], R_BOSS = [2.6, 2.2];
// 2026-11-23 守关妖王加强（用户定 A、B、C；主线首领不动）：
// A 速度每 50 层 +6%（最多 +30%），150 层起每出手 5 次连动一次；B 100/200/300 层起各多一条精英词缀（不给分身、铜皮、神行）；
// C 打到 70% 血上一层护体真气（最大气血 15%，没打破之前受到的伤害减半），35% 血暴怒（攻击 ×1.2），组队时这时候喊小妖（原来半血喊）
var R_BOSS_SPD = [50, 0.06, 0.3], R_BOSS_DUO = [150, 5], R_BOSS_AFF = [100, 200, 300], R_BOSS_PH = [0.7, 0.15, 0.5, 0.35, 1.2];   // 第一版（每 50 层 +10%、四招连动、暴怒 ×1.3）200 层妖王比小怪群还难一大截，收一收
function rBossUp(run, u, fixed) {   // fixed：这只妖王上次抽到的词缀（倒下再来打，还是那几条）
  const N = run.riftLv || 0;
  u.spd *= 1 + Math.min(R_BOSS_SPD[2], R_BOSS_SPD[1] * Math.floor(N / R_BOSS_SPD[0]));
  if (N >= R_BOSS_DUO[0]) u.duo = R_BOSS_DUO[1];
  const n = R_BOSS_AFF.filter(x => N >= x).length;
  let add = [];
  if (fixed) add = fixed.slice();
  else if (n) { const pool = ELITE_AFFIXES.map(a => a.id).filter(a => !['split', 'tough', 'fast'].includes(a) && !(u.aff || []).includes(a)); add = RNG.shuffle(pool).slice(0, n); }
  if (add.length) {
    u.aff = [...(u.aff || []), ...add];
    if (add.includes('shielded')) u.shield = Math.max(u.shield || 0, Math.round(u.maxHp * 0.3)); }
  u.ph1 = true; u.ph2 = true; u.nAct = 0;
  return add;
}
// 2026-11-23 打妖王倒下了：妖王的血接着上次（每倒一次回一成），已经过了的阶段不再来，词缀不变；护法打死的不复活，活着的接着上次的血；喊来的小妖同理
var R_BOSS_BACK = 0.1, R_BOSS_PROG = 0.02;   // 每倒一次妖王回多少血；自动闯关：这一次打掉的要比它回的血多这么多（或者打死了护法、小妖），才算打动了、接着去打
function rBossGain(b) {   // 这一场打妖王打动了没有：妖王掉的血超过它倒一次回的血，或者打死了护法、喊来的小妖
  if (!b) return false; const bz = b.units.filter(u => u.kind === 'boss'); if (!bz.length) return false;
  const now = bz.reduce((a, u) => a + Math.max(0, u.hp) / u.maxHp, 0) / bz.length, prog = (b.bossHp0 != null ? b.bossHp0 : 1) - now;
  return prog >= R_BOSS_BACK + R_BOSS_PROG || b.units.some(u => (u.hufa || u.called) && u.hp <= 0);
}
function rBossKeep(b, key) {   // 输了的那一场：把妖王一伙的状态记在地图上的妖王身上
  if (!b || !key || !key.rboss) return null;
  const D = wScene(RCH), mn = D.mons.find(o => o.id === key.rboss); if (!mn) return null;
  const bz = b.units.filter(u => u.kind === 'boss'); if (!bz.length) return null;
  const frac = u => Math.max(0, u.hp) / u.maxHp, now = bz.reduce((a, u) => a + frac(u), 0) / bz.length;
  const P = mn.bst || { b: [], h: [] }, B2 = P.b.map(x => ({ ...x })), H2 = P.h.slice();   // 上次就没上场的（已经打死的）保持死的
  for (const u of bz) B2[u.bidx || 0] = { hp: u.hp > 0 ? Math.min(1, frac(u) + R_BOSS_BACK) : 0, p1: !!u.ph1, p2: !!u.ph2, sh: u.shield > 0 ? u.shield / u.maxHp : 0, ps: !!(u.phShield && u.shield > 0), n: u.nAct || 0, call: !!u.callU };   // 护体（词缀的、七成血的）剩多少也记着，不会重新长满
  for (const u of b.units) if (u.hufa) H2[u.hidx || 0] = frac(u);
  mn.bst = { b: B2, h: H2, a: b.units.filter(u => u.called).map(u => frac(u)).filter(f => f > 0) };
  return { prog: (b.bossHp0 != null ? b.bossHp0 : 1) - now, now };
}
function rBossLoad(units, mn) {   // 再打：照记下来的摆回去
  const S = mn && mn.bst; if (!S) return units;
  const out = [];
  for (const u of units) {
    if (u.kind === 'boss') { const T = S.b[u.bidx || 0]; if (!T) { out.push(u); continue; } if (T.hp <= 0) continue;
      u.hp = Math.max(1, Math.round(u.maxHp * T.hp)); u.nAct = T.n || 0;
      u.shield = Math.round(u.maxHp * (T.sh || 0)); if (T.ps && u.shield > 0) u.phShield = true;
      if (!T.p1) delete u.ph1;
      if (!T.p2) { delete u.ph2; u.rageB = true; u.atk *= R_BOSS_PH[4]; }
      if (!T.call && u.callU) { const L = u.callU; delete u.callU; S.a.forEach((f, j) => { const x = L[j]; if (x) { x.hp = Math.max(1, Math.round(x.maxHp * f)); x.called = true; out.push(x); } }); }
      out.push(u); continue; }
    if (u.hufa) { const f = S.h[u.hidx || 0]; if (f != null && f <= 0) continue; if (f != null) u.hp = Math.max(1, Math.round(u.maxHp * f)); }
    out.push(u);
  }
  return out;
}
var R_BOSS_UP = 1.6;   // 守关妖王本身的血再 ×1.6（护法、小妖不动）：原来首领三四十手就倒，不像最后一关。香相应加了 1 分钟
// 50 层以后精英涨得比小怪慢一点（每层 +6% 气血、+3.5% 攻击，小怪和妖王是 +8%、+5%）：实测精英战比小怪群、妖王战早二三十层就打不过，只能绕着走
var R_ELITE_LIN = [0.06, 0.035];
function rEliteEase(N) { return [rLinHp(N, R_ELITE_LIN[0]) / rLinHp(N, R_LIN[1]), rLinAtk(N, R_ELITE_LIN[1]) / rLinAtk(N, R_LIN[2])]; }   // 幻境妖物在 makeMonster 基础上再乘的 [气血, 攻击]
var R_NEED = 100;            // 召唤妖王要攒的分：小妖 1、精英 4（精魄球再 4）、稀有精英 6（球 6）
const R_FLOORS = 4, R_PULL = 3, R_PULL_MAX = 4, R_STAGE = 5;   // 四层；拉怪半径 3 格、一次最多 4 群；台上最多 5 只，其余排队上
const R_BT_MS = 30;          // 战斗里的时间按读条折算：读条 100（主角出手一轮）= 3 秒。和几倍速、跳不跳过战斗无关
const R_PYLONS = { power: { n: "Tháp Uy Năng", d: "Ba trận tiếp theo, sát thương +80%" }, guard: { n: "Tháp Hộ Thể", d: "Ba trận tiếp theo, mở màn có một lớp hộ thể (40% khí huyết tối đa)" },
                   haste: { n: "Tháp Tật Hành", d: "Ba trận tiếp theo, tốc độ +30" }, gather: { n: "Tháp Tụ Yêu", d: "Dẫn hết yêu vật gần đó về bên mình, trận tới đánh một hơi bảy bầy" } };
const isRift = run => !!run && run.mode === 'rift' && !!run.world;
const rFloorOf = (ch, sc) => wmap(ch, sc).def.rift;
// 把一张剧情地图抄成幻境的一层：机关全关，人物、门、箱子抹掉，定出入口、出口、塔的位置（全是算出来的，不靠随机，读档重建得出一模一样的图）
const _rs = {};
function rSanitize(c, sc) {
  const key = c + ':' + sc; if (_rs[key]) return _rs[key];
  const D = WMAPS[c].scenes[sc], H = D.rows.length, W = D.rows[0].length, g = D.rows.map(r => [...r]);
  const isFloor = t => t === ',' || t === '.' || t === '=', SUB = { '%': ',', '~': '=', R: '.', Q: '.', '(': '.', ')': '.' }, doors = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = D.rows[y][x], P = D.pts[t];
    if (P) { let pick = null; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (D.rows[y + dy] || '')[x + dx]; if (isFloor(n) && !D.pts[n]) { pick = n; break; } }
      g[y][x] = pick || ','; if (P.t === 'door') doors.push({ x, y }); }
    else if (SUB[t]) g[y][x] = SUB[t]; }
  const pass = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !W_BLOCK.includes(g[y][x]);
  const bfs = src => { const d = new Int16Array(W * H).fill(-1), q = []; for (const s of src) { d[s.y * W + s.x] = 0; q.push(s); }
    for (let i = 0; i < q.length; i++) { const c0 = q[i], d0 = d[c0.y * W + c0.x]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = c0.x + dx, y = c0.y + dy; if (pass(x, y) && d[y * W + x] < 0) { d[y * W + x] = d0 + 1; q.push({ x, y }); } } }
    return { d, q }; };
  // 最大的一片连通地面
  const seen = new Uint8Array(W * H); let comp = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!pass(x, y) || seen[y * W + x]) continue; const r = bfs([{ x, y }]).q; for (const p of r) seen[p.y * W + p.x] = 1; if (r.length > comp.length) comp = r; }
  const inC = new Uint8Array(W * H); for (const p of comp) inC[p.y * W + p.x] = 1;
  const spawnable = p => isFloor(g[p.y][p.x]);
  // 入口：原来的门里挑一扇「离最远处最远」的；没有门就用两次最远点
  let cands = doors.filter(p => inC[p.y * W + p.x]); if (!cands.length) { const a = comp[0], f = bfs([a]).q; cands = [f[f.length - 1]]; }
  let entry = null, exit = null, far = -1, dE = null;
  for (const p of cands) { const r = bfs([p]); let e = null; for (let i = r.q.length - 1; i >= 0; i--) if (spawnable(r.q[i])) { e = r.q[i]; break; } if (!e) continue; const dd = r.d[e.y * W + e.x]; if (dd > far) { far = dd; entry = p; exit = e; dE = r.d; } }
  // 塔：离入口四到七成远，又尽量偏离「入口到出口」那条近路
  const dX = bfs([exit]).d, onPath = comp.filter(p => dE[p.y * W + p.x] + dX[p.y * W + p.x] <= far + 1), dP = bfs(onPath).d;
  let pylon = null, best = -1;
  for (const p of comp) { const d0 = dE[p.y * W + p.x]; if (!spawnable(p) || d0 < far * 0.35 || d0 > far * 0.7) continue; const v = dP[p.y * W + p.x]; if (v > best) { best = v; pylon = p; } }
  const mons = [...new Set((D.zones || []).flatMap(z => z.mons || []))].filter(i => CHAPTERS[c - 1].mons[i]);
  const cells = comp.filter(p => spawnable(p) && dE[p.y * W + p.x] >= 6);
  return (_rs[key] = { c, sc, n: D.n, theme: D.theme, W, H, g, entry, exit, pylon, far, dE, cells, size: comp.length, mons: mons.length ? mons : CHAPTERS[c - 1].mons.map((_, i) => i) });
}
// 拿来当幻境一层的场景：每章挑几张够大、抹掉机关后走得通的野外和地下城（不要镇子和小屋）
const R_SCENES = { 1: ['grave', 'deep', 'yamen'], 2: ['linwai', 'gushu', 'langxue'], 3: ['shandao', 'pansi', 'shanjiao'], 4: ['kuangcun', 'kuangdong1', 'kuangdong2', 'ronglu'],
                   5: ['yucun', 'duzhao2', 'shechao'], 6: ['xueshan', 'xueyuan', 'bingku', 'binghu'], 7: ['huangquan', 'guiwang'], 8: ['shanmen', 'qiandian', 'houyuan'],
                   9: ['kengkou', 'guimenguan', 'huangquan9', 'guimen'], 10: ['zhenxin', 'shenyuan'] };
function rScenePool() {
  const out = [];
  for (const c in R_SCENES) for (const sc of R_SCENES[c]) { if (!WMAPS[c] || !WMAPS[c].scenes[sc]) continue; const Z = rSanitize(+c, sc); if (Z.entry && Z.exit && Z.pylon && Z.cells.length >= 220) out.push({ c: +c, sc }); }
  return out;
}
// 开一局：抽四层（四个不同的章节），每层一种塔，守关妖王另抽一章的
function newRiftRun(cls, riftLv) {
  const pool = RNG.shuffle(rScenePool()), floors = [], used = new Set();
  for (const p of pool) { if (used.has(p.c)) continue; used.add(p.c); floors.push({ c: p.c, sc: p.sc, py: RNG.pick(Object.keys(R_PYLONS)) }); if (floors.length >= R_FLOORS) break; }
  const run = { world: true, cls, mode: 'rift', diff: 'normal', riftLv: riftLv || 1, chapter: RCH, mods: featureOn('mods') ? (SAVE.mods || []).slice() : [], floor: 1, buffs: {}, loot: [], goldGot: 0, xpGot: 0, gemsGot: 0,
    matsGot: 0, kills: 0, t0: Date.now(), lvStart: SAVE.chars[cls].level, paraStart: SAVE.para.lv, hp: 0, ended: null, rooms: 0, xpMul: 1.75, prog: 0, clock: 0, pts: 0, fights: 0,
    maze: { v: 2, cells: [], maxDist: 1 }, pos: 0, hasKey: true, theme: floors[0].c - 1,
    rw: { floors, f: 0, bossC: RNG.i(1, 10), boss: 0, sh: RNG.ch(SH.rate) ? shPick() : null } };   // sh：山海经副本，守关的是哪只异兽（进去时不告诉玩家）
  run.ngoc = pgOr(0) && SAVE.ngocJoin ? 'fox' : null; run.comp = !run.ngoc && (SAVE.comps || {})[SAVE.comp] ? SAVE.comp : null;
  if (pgOr(0)) { run.team = teamOf(); run.ngoc = null; run.comp = null; }   // 通关后的幻境：组队
  for (const id of run.mods) { const M = DUNGEON_MODS.find(x => x.id === id); if (!M) continue;   // 2026-11-24 加难度在幻境里也生效（原来幻境开局清单是空的，选了等于没选）
    if (M.mf) run.buffs.mf = (run.buffs.mf || 0) + M.mf; if (M.gf) run.buffs.gf = (run.buffs.gf || 0) + M.gf; if (M.xp) run.xpMul += M.xp / 100; }
  rBuild(run);
  if (SAVE.world) delete SAVE.world[RCH];
  const prev = SAVE.run; SAVE.run = run; wstate(RCH).flags.rfree = 1; SAVE.run = prev;
  run.potions = hasMod(run, 'scarce') ? 0 : 3 + bLv('alchemist'); run.hp = runStats(run).maxHp;
  return run;
}
// 按这一局抽到的层，把假章节的地图表搭出来（开局、读档、导入存档码时都要搭一次）
function rBuild(run) {
  const scenes = {}, F = run.rw.floors;
  F.forEach((f, i) => { const Z = rSanitize(f.c, f.sc), g = Z.g.map(r => [...r]), last = i === F.length - 1;
    g[Z.entry.y][Z.entry.x] = '1'; if (!last) g[Z.exit.y][Z.exit.x] = '2'; g[Z.pylon.y][Z.pylon.x] = '3';
    scenes['f' + i] = { n: `Tầng ${"123456"[i]} · ${Z.n}`, theme: Z.theme, lv: 1, rows: g.map(r => r.join('')), zones: [], lit: true,
      pts: { 1: { t: 'rin' }, 2: { t: 'rexit', n: "Tầng kế" }, 3: { t: 'rpylon', py: f.py } }, rift: { fi: i, c: f.c, sc: f.sc, py: f.py, last } }; });
  WMAPS[RCH] = { n: "Ảo Cảnh Cửu U", rift: true, start: 'f0', startPt: '1', scenes, terrain: { ice: 'rfree', lava: 'rfree', swamp: 'rfree', web: 'rfree' } };
  WQ[RCH] = { main: [], side: [] };
  for (const k in _wm) if (k.startsWith(RCH + ':')) delete _wm[k]; delete _wi[RCH];
}
const rBase = run => riftD(run.riftLv).base;
const R_MOD_ELITE = 2;   // 加难度「妖将横行」：幻境每层多几只精英
// 一层的妖物：一簇一簇地放（一簇两三群，挨在一起，方便一口气拉进来），每层四五只精英
function rSpawnFloor(ch, sc, wave) {
  const m = wmap(ch, sc), S = SAVE.world[wk(ch)], D = S.sd[sc], R = m.def.rift, Z = rSanitize(R.c, R.sc), run = SAVE.run;
  const lv = riftLvCap(run, (run ? rBase(run) : 1) + R.fi), key = p => p.y * m.W + p.x;
  const taken = new Set(D.mons.map(key)); for (const p of [Z.entry, Z.exit, Z.pylon]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) taken.add((p.y + dy) * m.W + p.x + dx);
  let cells = Z.cells.filter(p => !taken.has(key(p)));
  if (wave) cells = cells.filter(p => Math.max(Math.abs(p.x - S.pos.x), Math.abs(p.y - S.pos.y)) >= 6);
  const nGroups = wave || Math.max(22, Math.min(34, Math.round(Z.cells.length / 20)));
  let nElite = wave ? 2 : 4 + R.fi + (RNG.ch(0.5) ? 1 : 0) + (run && hasMod(run, 'elites') ? R_MOD_ELITE : 0), rareLeft = wave ? 0 : (RNG.ch(0.5) ? 1 : 0);
  const centers = []; let guard = 0, left = nGroups;
  while (left > 0 && cells.length && guard++ < 400) {
    const c0 = RNG.pick(cells); if (centers.some(o => Math.max(Math.abs(o.x - c0.x), Math.abs(o.y - c0.y)) < 5)) continue;
    centers.push(c0);
    const near = cells.filter(p => Math.max(Math.abs(p.x - c0.x), Math.abs(p.y - c0.y)) <= 2 && !taken.has(key(p))).map(p => ({ p, d: Math.abs(p.x - c0.x) + Math.abs(p.y - c0.y) + Math.random() })).sort((a, b) => a.d - b.d).map(e => e.p);
    const n = Math.min(left, near.length, RNG.i(2, 4)), main = RNG.pick(Z.mons);
    for (let i = 0; i < n; i++) { const p = near[i]; taken.add(key(p));
      const el = i === 0 && nElite > 0 && RNG.ch(0.45) ? 1 : 0; if (el) nElite--;
      const rare = el && rareLeft > 0 ? 1 : 0; if (rare) rareLeft--;
      const r = Math.random(), beh = el ? 'guard' : r < 0.35 ? 'chase' : r < 0.75 ? 'patrol' : 'sleep';
      D.mons.push(wNewMon(ch, { x: p.x, y: p.y, z: 'r', m: i === 0 || RNG.ch(0.6) ? main : RNG.pick(Z.mons), c: R.c, lv: lv + (!riftNewbie(run) && RNG.ch(0.3) ? 1 : 0), beh, elite: el, rare })); left--; }
  }
  // 精英没放够：把普通的升上去
  for (const mn of RNG.shuffle(D.mons.filter(o => !o.elite && !o.boss))) { if (nElite <= 0) break; mn.elite = 1; mn.beh = 'guard'; nElite--; }
}
// 撞上一群怪：旁边两格内的怪群一起卷进来
function rFight(ch, mn, first) {
  const D = wScene(ch), run = SAVE.run, R = rFloorOf(ch);
  if (mn.boss) return { fight: { kind: 'boss', rift: 1, c: mn.c, lv: mn.lv, first: 'e', mid: mn.id }, key: { rboss: mn.id } };
  const gather = run && run.rbuff && run.rbuff.k === 'gather', rad = gather ? R_PULL + 2 : R_PULL, cap = gather ? 7 : R_PULL_MAX, hp = wstate(ch).pos;
  const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));   // 离被撞上的那群、或者离你自己够近的，都算卷进来
  const near = D.mons.filter(o => o !== mn && !o.boss).map(o => ({ o, d: Math.min(cheb(o, mn), cheb(o, hp)) })).filter(e => e.d <= rad).sort((a, b) => a.d - b.d).slice(0, cap - 1);
  const ids = [mn.id, ...near.map(e => e.o.id)];
  return { fight: { kind: 'rift', rift: 1, ids, lv: mn.lv, first, n: ids.length }, key: { rmons: ids } };
}
// 组队时妖物变强：[每个伙伴加多少血, 首领护法的血量（按精英算的倍数）]
let R_TEAM = [0.1, 0.5, 0.5, 5, 0.35, 0.04];   // [每个伙伴小怪精英加血, 护法血量倍数（按精英）, 首领横扫伤害, 横扫间隔, 护法攻击倍数, 每个伙伴首领加血]
function rPrep(run, enc) {
  const ch = RCH, D = wScene(ch), R = rFloorOf(ch);
  run.encCell = { lv: enc.lv };
  run.ngoc = pgOr(0) && SAVE.ngocJoin ? 'fox' : null; run.comp = !run.ngoc && (SAVE.comps || {})[SAVE.comp] ? SAVE.comp : null;
  if (pgOr(0)) { run.team = teamOf(); run.ngoc = null; run.comp = null; }   // 通关后的幻境：组队
  const nT = (run.team || []).length, tK = 1 + R_TEAM[0] * nT, tKB = 1 + R_TEAM[5] * nT;   // 组队：每带一个伙伴，小怪精英血量 +10%，首领 +4%（首领另外带护法）
  if (enc.kind === 'boss') {
    run.theme = enc.c - 1;
    const mn = enc.mid != null ? D.mons.find(o => o.id === enc.mid) : null; let bi = 0;   // 地图上的这只妖王：记着它的词缀、护法、上次打剩的血
    const units = makeEncounter(run, 'boss', run.encCell); units.forEach(u => { u.maxHp = u.hp = Math.round(u.hp * R_BOSS[0] * tKB * (u.kind === 'boss' ? R_BOSS_UP : 1)); u.atk *= R_BOSS[1];
      if (u.kind === 'boss') { const fx = mn && mn.baff ? mn.baff[bi] : null, got = rBossUp(run, u, fx); if (mn) (mn.baff = mn.baff || [])[bi] = got; u.bidx = bi++; } });
    if (nT) {   // 首领也带帮手：伙伴几个，护法几个（本章妖物的精英，各带一条精英词缀）；半血时再喊一波小妖
      const F0 = CHAPTERS[enc.c - 1], B0 = units.find(u => u.kind === 'boss') || units[0], ez = rEliteEase(run.riftLv), lv = enc.lv;
      const okA = ['fiery', 'cold', 'vamp', 'enraged', 'tough', 'fast', 'shielded', 'venom'];   // 不给分身、反震
      if (mn && !mn.hsp) mn.hsp = [];   // 护法长什么样、带什么词缀，第一次定下来以后不变
      const hufa = []; for (let i = 0; i < nT; i++) { const sp = mn && mn.hsp[i] ? mn.hsp[i] : { m: RNG.i(0, F0.mons.length - 1), a: RNG.pick(okA) }; if (mn) mn.hsp[i] = sp;
        const def = F0.mons[sp.m] || F0.mons[0], e = makeMonster(def, lv, run, 'elite', [sp.a]);
        e.name = "Hộ pháp · " + def.n; e.hufa = true; e.hidx = i; e.maxHp = e.hp = Math.round(e.hp * R_ELITE[0] * ez[0] * R_TEAM[1]); e.atk *= R_ELITE[1] * ez[1] * R_TEAM[4]; if (e.shield) e.shield = Math.round(e.maxHp * 0.3); hufa.push(e); }
      B0.callU = []; for (let i = 0; i < 1 + Math.ceil(nT / 2); i++) { const u = makeMonster(RNG.pick(F0.mons), lv, run, 'normal'); u.maxHp = u.hp = Math.round(u.hp * R_NORM[0] * tK); u.atk *= R_NORM[1]; B0.callU.push(u); }
      B0.sweep = true;
      run.encUnits = rBossLoad([...hufa, ...units], mn); return 'boss';
    }
    run.encUnits = rBossLoad(units, mn); return 'boss';
  }
  run.theme = R.c - 1;
  const F = CHAPTERS[R.c - 1], Z = rSanitize(R.c, R.sc), nAff = 1 + (run.riftLv >= 20 ? 1 : 0) + (run.riftLv >= 45 ? 1 : 0), el = [], no = [];
  const norm = (def, lv) => { const u = makeMonster(def, lv, run, 'normal'); u.maxHp = u.hp = Math.round(u.hp * R_NORM[0] * tK); u.atk *= R_NORM[1]; return u; };
  for (const id of enc.ids) { const mn = D.mons.find(o => o.id === id); if (!mn) continue; const def = F.mons[mn.m] || F.mons[0];
    if (mn.elite) {
      const affs = eliteAffsOf(run, mn), e = makeMonster(def, mn.lv + (riftNewbie(run) ? 0 : 1), run, 'elite', affs);
      e.name = mn.rare ? RNG.pick(RARE_ELITE_NAMES) : joinName(RNG.pick(ELITE_TITLES), def.n);
      const ez = rEliteEase(run.riftLv); e.maxHp = e.hp = Math.round(e.hp * R_ELITE[0] * ez[0] * (mn.rare ? 1.3 : 1) * tK); e.atk *= R_ELITE[1] * ez[1]; if (mn.rare) e.rare = true; if (e.shield) e.shield = Math.round(e.maxHp * 0.3);
      el.push(e); if (RNG.ch(0.6)) no.push(norm(def, mn.lv));
    } else { const n = riftNewbie(run) ? 1 : Math.min(3, +RNG.w({ 1: 35, 2: 45, 3: 20 }) + (def.pack ? 1 : 0)); for (let i = 0; i < n; i++) no.push(norm(i === 0 || RNG.ch(0.6) ? def : F.mons[RNG.pick(Z.mons)] || def, mn.lv)); }
  }
  const units = [...el, ...no];
  run.encUnits = units.slice(0, R_STAGE); if (units.length > R_STAGE) run.encReinf = units.slice(R_STAGE);
  return el.length ? 'elite' : 'battle';
}
// 进度：打死的妖物按分算（在战斗里一只一只记），这里把分换成百分比
// 每层不封顶：想在一层打到底、还是往下走，自己定。越往下越肥——妖物高一级，每只给的进度更多（R_DEEP），精英也多一只
const R_DEEP = [1, 1.15, 1.3, 1.5];
const rDeep = run => R_DEEP[Math.min(R_DEEP.length - 1, (run.rw && run.rw.f) || 0)];
const rCapped = () => false;
function rAddPts(run, p) {
  const add = p * rDeep(run);
  run.rw.fp = (run.rw.fp || 0) + add; run.pts = (run.pts || 0) + add; run.prog = Math.min(100, run.pts / R_NEED * 100);
}
function rPickOrbs(ch, run) {
  const S = wstate(ch), D = wScene(ch), acts = []; if (!D.orbs || !D.orbs.length) return acts;
  const keep = []; let got = 0;
  for (const o of D.orbs) { if (o.x === S.pos.x && o.y === S.pos.y) got += o.p; else keep.push(o); }
  if (got) { D.orbs = keep; const b = run.prog; rAddPts(run, got); acts.push({ toast: `Nhặt được tinh phách: tiến độ +${Math.round(run.prog - b)}%` }, { sfx: 'loot' }); }
  return acts;
}
// 进度满了：守关妖王在身边现身
function rCheckBoss(ch, run) {
  if (run.prog < 100 || run.rw.boss) return [];
  const S = wstate(ch), D = wScene(ch); let at = null;
  for (let r = 2; r <= 6 && !at; r++) { const c = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = S.pos.x + dx, y = S.pos.y + dy; if (wPassMon(ch, x, y) && wPath(ch, x, y)) c.push({ x, y }); } if (c.length) at = RNG.pick(c); }
  if (!at) at = { x: S.pos.x, y: S.pos.y };
  const sh = shOn(run), B = sh ? SH_BEASTS[run.rw.sh] : CHAPTERS[run.rw.bossC - 1].boss;
  D.mons.push(wNewMon(ch, { x: at.x, y: at.y, z: 'rb', m: -1, c: run.rw.bossC, lv: riftLvCap(run, rBase(run) + rFloorOf(ch).fi), beh: 'guard', boss: 1 }));
  run.rw.boss = 1; run.rw.bossF = rFloorOf(ch).fi;
  return [{ rboss: (sh ? "Dị thú Sơn Hải·" : '') + B.n, d: B.d, sh }];
}
function rWon(ch, key, run) {
  const S = wstate(ch), D = wScene(ch), acts = [], R = rFloorOf(ch);
  if (key.rboss) { const i = D.mons.findIndex(mn => mn.id === key.rboss); if (i >= 0) D.mons.splice(i, 1); return [{ rdone: true }]; }
  for (const id of key.rmons || []) { const i = D.mons.findIndex(mn => mn.id === id); if (i < 0) continue; const mn = D.mons.splice(i, 1)[0];
    if (mn.elite) (D.orbs = D.orbs || []).push({ x: mn.x, y: mn.y, p: mn.rare ? 6 : 4 }); }
  run.fights = (run.fights || 0) + 1;
  rBuffTick(run);
  acts.push(...rPickOrbs(ch, run), ...rCheckBoss(ch, run));
  if (R.last && !run.rw.boss && D.mons.length < 8) { rSpawnFloor(ch, S.sc, 10); acts.push({ toast: "Yêu khí lại tụ về — tầng này lại trồi lên một đợt yêu vật" }); }
  return acts;
}
// 塔的效果：数着场次用完
function rBuffTick(run) { const B = run.rbuff; if (!B) return; if (--B.n <= 0) { for (const k in B.st || {}) run.buffs[k] = (run.buffs[k] || 0) - B.st[k]; delete run.rbuff; } }
function rPylon(ch, run, type) {
  const S = wstate(ch), D = wScene(ch), P = R_PYLONS[type];
  if (run.rbuff) { run.rbuff.n = 1; rBuffTick(run); }
  if (type === 'power') { run.rbuff = { k: type, n: 3, st: { dmgPct: 80 } }; run.buffs.dmgPct = (run.buffs.dmgPct || 0) + 80; }
  else if (type === 'haste') { run.rbuff = { k: type, n: 3, st: { spd: 30 } }; run.buffs.spd = (run.buffs.spd || 0) + 30; }
  else if (type === 'guard') run.rbuff = { k: type, n: 3 };
  else if (type === 'gather') {
    run.rbuff = { k: type, n: 1 };
    const list = D.mons.filter(o => !o.boss).map(o => ({ o, d: wdist(o, S.pos) })).filter(e => e.d <= 14).sort((a, b) => a.d - b.d).slice(0, 7); let moved = 0;
    for (const { o } of list) { let done = false;
      for (let r = 1; r <= 3 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = S.pos.x + dx, y = S.pos.y + dy;
        if (wPassMon(ch, x, y)) { o.x = x; o.y = y; o.hx = x; o.hy = y; done = true; moved++; } } }
  }
  return [{ toast: `${P.n}: ${P.d}` }, { sfx: 'magic' }];
}
// 每走一步：捡球、踩塔、进下一层
function rStep(ch, x, y, run) {
  const S = wstate(ch), m = wmap(ch), R = m.def.rift, P = wPt(ch, x, y), acts = [];
  if (!run) return { acts };
  acts.push(...rPickOrbs(ch, run), ...rCheckBoss(ch, run));
  if (P && P.t === 'rpylon' && !S.got[wgk(S.sc, x, y)]) { S.got[wgk(S.sc, x, y)] = 1; acts.push(...rPylon(ch, run, P.py)); }
  if (acts.some(a => a.rboss)) return { stop: true, acts };   // 妖王现身：停下脚步
  if (P && P.t === 'rexit') {
    if (run.rw.boss) return { acts: [...acts, { toast: "Yêu vương giữ ải đã hiện thân, ngay ở tầng này — xử nó trước đã" }] };
    const nf = R.fi + 1, sc = 'f' + nf; run.rw.f = nf; run.rw.fp = 0; run.floor = nf + 1;
    S.sc = sc; const e = wmap(ch, sc).pts['1'][0]; S.pos = { x: e.x, y: e.y }; S.pz.ent = { ...S.pos };
    wScene(ch); wReveal(ch); wUnstackMons(ch); run.theme = rFloorOf(ch).c - 1; if (!hasMod(run, 'scarce')) run.potions = Math.min(3 + bLv('alchemist') + 2, (run.potions || 0) + 1);
    return { stop: true, acts: [...acts, { enter: sc }, { toast: "Đã sang tầng kế: đan dược +1" }] };
  }
  return { acts };
}

// ============ 通天塔（2026-11-24 用户定）============
// 一层一场：普通层一群小怪带精英，逢 5 层精英首领带护法，逢 10 层塔主（妖王）。进塔时人人一样（50 级、一身宝品塔装、两招），
// 自己号上的装备、修为、玉、伙伴、阵法、役使一样都不带；每过一层三选一往上长：普通层拿塔装（太古 +10 满词条、自带玉）或招式、变招，
// 逢 5 层拿神兵之魂（乾坤袋，最多三格），逢 10 层拿灵玉（最多三颗）。每层回满血，不带丹药；怒气在塔里一层层留着。
// 每十层存一次档，倒下回到存档那层（带着存档时那身塔装）。每周换一座塔（楼层、妖物、三选一按周和职业定好，大家一样），从第一层重爬；
// 每个职业的历史最高层、首通奖励永久保留。
var TW = { bossK: [0.45, 0.6], ilvl: 70, plus: 10, gemT: 6, lgLv0: 20, lgLvK: 1.2, lgMax: 150, nStart: 2, n0: 24, nK: 0.85, top: 200, box: 200,
  para: { pAtk: 25, pArmor: 25, pHp: 25, crit: 60, spd: 40, res: 80, dmgPct: 90, hpPct: 60, armorPct: 25 },
  cls: { berserker: { hpPct: 20, dmgPct: 30 }, mage: { hpPct: 80, dmgPct: 40 }, necro: { hpPct: 80, dmgPct: 80, minionPct: 60 }, assassin: { hpPct: 40, dmgPct: 40 }, paladin: {} },
  start: { necro: ['summon', 'shidu'], assassin: ['venom', 'bingpo'] } };   // 2026-11-25 塔里僵尸改成吃你的伤害、暴击（同幻境），赶尸人伤害补偿 150 → 80：打塔主步数 227 → 121，最高层中位约 30 → 33（60 局）   // 起手两招（没写的按等级取前两招）   // 塔里不带伙伴：各职业的底子按模拟补一点（和尚自己扛得住，不补）
const twN = f => Math.round(TW.n0 + TW.nK * (f - 1));   // 第 f 层相当于幻境多少层（妖物强度）
function twWeek() { return Math.floor(((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000 + 3) / 7); }   // 周一换周（本地时间）
function twRng(seed) { let s = seed | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const twHash = (...a) => { let h = 2166136261; for (const c of a.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h | 0; };
function twWith(seed, fn) {   // 塔里的东西按种子生成：同一周同一个职业，大家看到的一样
  const R = Math.random, W = AFFIXES.filter(a => a.k === 'mf' || a.k === 'gf').map(a => [a, a.w]);
  Math.random = twRng(seed); W.forEach(([a]) => { a.w = 0; });   // 塔装不出福缘、招财这种没用的词条
  try { return fn(); } finally { Math.random = R; W.forEach(([a, w]) => { a.w = w; }); }
}
const twClone = o => JSON.parse(JSON.stringify(o));
function twSave() {
  const T = SAVE.tower || (SAVE.tower = { wk: 0, c: {}, rec: {}, ms: {}, wr: {} }), w = twWeek();
  if (T.wk !== w) { T.wk = w; T.c = {}; T.wr = {}; }
  return T;
}
function twState(cls) { const T = twSave(); return T.c[cls] || (T.c[cls] = twNew(cls)); }
function twReset(cls) {   // 从第 1 层重来：塔装、招式、灵玉回到开局，本周最高、奖励记录都留着（奖励只给比已领更高的塔主）
  const T = twSave(), o = twState(cls), n = twNew(cls); n.best = o.best; T.c[cls] = n; return n; }
function twNew(cls) { const kit = twStartKit(cls); return { fl: 1, ck: 0, best: 0, kit, ckKit: twClone(kit), pend: null }; }
const twSets = cls => BUILDS[cls].map(B => B.set);
function twItem(cls, slot, rarity, extra) {   // 一件塔装：宝品照常；套装、神兵一律太古 +10、词条满值；孔开满、镶通灵玉
  const it = makeItem({ slot: slotType(slot), ilvl: TW.ilvl, rarity, cls, noSocket: true, ...(extra || {}) });
  it.plus = TW.plus; it.tw = 1;
  // 2026-11-25 套装、神兵换上去时沿用这一格原来的词条和孔（twApply），只换特效；不再是太古满词条白送属性
  const st = slotType(it.slot), n = MAX_SOCKETS[st] || 0, g = ['weapon', 'ring', 'amulet', 'offhand'].includes(st) ? 'ruby' : 'emerald';
  it.sockets = n; it.gems = Array.from({ length: n }, () => gemKey(g, TW.gemT));
  return it;
}
function twStartKit(cls) {
  const T = twSave();
  return twWith(twHash(T.wk, cls, 'start'), () => {
    const eq = {}; for (const sl of POS_IDS) { const it = twItem(cls, sl, 'rare'); it.slot = sl === 'ring2' ? 'ring' : it.slot; eq[sl] = it; }
    const sk = (TW.start[cls] || []).slice(); if (!sk.length) sk.push(...CLASSES[cls].skills.filter(k => k.cd).sort((a, b) => a.lv - b.lv).slice(0, TW.nStart).map(k => k.id));
    return { eq, sk, rn: {}, cube: [], lg: [], rage: 25 };
  });
}
function twTal(cls) { const t = {}; for (const Bq of talentBranches(cls)) Bq.t.forEach(T => { t[Bq.id + '.' + T.id] = T.max; }); return t; }
function twCh(cls, kit) {   // 塔里的「角色」：交给 calcStats / startBattle 用，不碰存档里的角色
  return { tower: true, level: 50, eq: kit.eq, tal: twTal(cls), cube: kit.cube.slice(), lgs: kit.lg.map((g, i) => 'tw' + i), twLg: kit.lg.map((g, i) => ({ id: 'tw' + i, t: g.t, lv: g.lv })),
    runes: { ...kit.rn }, loadout: kit.sk.slice(), loadoutManual: 1, yi: [], form: SAVE.chars[cls] && SAVE.chars[cls].form };
}
function twGlobal() { const s = {}; for (const P of PARAGON_STATS) { const n = TW.para[P.k] || 0; if (n) s[P.k] = (s[P.k] || 0) + n * P.v; } return s; }
const twLgLv = f => Math.min(TW.lgMax, Math.round(TW.lgLv0 + TW.lgLvK * f));
// 第 f 层的妖物：按周、职业、层数定好
function twFloor(cls, f) {
  const T = twSave();
  return twWith(twHash(T.wk, cls, 'floor', f), () => {
    const c = 1 + ((f - 1 + T.wk) % 10), F = CHAPTERS[c - 1], N = twN(f), run = { mode: 'rift', riftLv: N, theme: c - 1, mods: [], cls, world: true }, lv = riftD(N).base, ez = rEliteEase(N);
    const nAff = 1 + (N >= 20 ? 1 : 0) + (N >= R_AFF_HI[0] ? 1 : 0) + (N >= R_AFF_HI[1] ? 1 : 0);
    const affs = (k, ban) => RNG.shuffle(ELITE_AFFIXES.map(a => a.id).filter(a => !(ban || []).includes(a))).slice(0, k);
    const norm = def => { const u = makeMonster(def, lv, run, 'normal'); u.maxHp = u.hp = Math.round(u.hp * R_NORM[0]); u.atk *= R_NORM[1]; return u; };
    const elite = (def, k, mul, ban) => { const e = makeMonster(def, lv + 1, run, 'elite', affs(k, ban)); e.name = joinName(RNG.pick(ELITE_TITLES), def.n); e.maxHp = e.hp = Math.round(e.hp * R_ELITE[0] * ez[0] * (mul || 1)); e.atk *= R_ELITE[1] * ez[1]; if (e.shield) e.shield = Math.round(e.maxHp * 0.3); return e; };
    let units = [], kind = 'battle', name = '';
    if (f % 10 === 0) {   // 塔主：本章首领，按幻境守关妖王的规矩加强（加速、连动、词缀、两段）
      kind = 'boss';
      const u = makeMonster(F.boss, lv + 2, run, 'boss'); name = "Chủ tháp · " + F.boss.n; u.name = name; u.maxHp = u.hp = Math.round(u.hp * 1.15 * R_BOSS[0] * R_BOSS_UP * TW.bossK[0]); u.atk *= R_BOSS[1] * TW.bossK[1];   // 一个人打，比幻境守关妖王软一点
      const n = R_BOSS_AFF.filter(x => N >= x).length, pool = ELITE_AFFIXES.map(a => a.id).filter(a => !['split', 'tough', 'fast', 'thorny'].includes(a) && !(u.aff || []).includes(a));
      rBossUp(run, u, RNG.shuffle(pool).slice(0, n)); units.push(u);   // 一个人打：塔主不给反震（多段的职业会被自己弹死）
      if (f >= 30) { const def = RNG.pick(F.mons), e = elite(def, 1, R_TEAM[1]); e.name = "Hộ pháp · " + def.n; e.hufa = true; units.unshift(e); }
    } else if (f % 5 === 0) {   // 精英首领：稀有精英多一条词缀、血更厚，带两个护法
      kind = 'elite';
      const def = RNG.pick(F.mons), e = elite(def, nAff + 1, 1.8, ['split', 'thorny']); e.rare = true; e.name = RNG.pick(RARE_ELITE_NAMES); name = e.name; units.push(e);
      for (let i = 0; i < 2; i++) { const d2 = RNG.pick(F.mons), h = elite(d2, 1, R_TEAM[1]); h.name = "Hộ pháp · " + d2.n; h.hufa = true; units.push(h); }
    } else {   // 普通层：一群小怪，层数高了带一两只精英
      const main = RNG.pick(F.mons), n = 3 + RNG.i(0, 2) + (main.pack ? 1 : 0);
      for (let i = 0; i < n; i++) units.push(norm(i === 0 || RNG.ch(0.6) ? main : RNG.pick(F.mons)));
      const ne = (f >= 3 ? 1 : 0) + (f >= 25 ? 1 : 0); for (let i = 0; i < ne; i++) units.unshift(elite(RNG.pick(F.mons), nAff));
      if (ne) kind = 'elite';
    }
    return { kind, units, c: c, N, lv, name };
  });
}
// 三选一：普通层塔装或招式；逢 5 层神兵之魂；逢 10 层灵玉。都按周、职业、层数定好
function twPicks(cls, f, kit) {
  const T = twSave(), C = CLASSES[cls];
  return twWith(twHash(T.wk, cls, 'pick', f), () => {
    const out = [], B = BUILDS[cls];
    const lgPool = () => { const own = new Set(kit.lg.map(g => g.t)); const want = [];   // 2026-11-25 不再优先出流派推荐的：懂搭配才挑得准
      const gen = Object.keys(LGEMS).filter(t => !own.has(t) && t !== 'greed' && t !== 'reforge' && !want.includes(t) && (!LGEMS[t].cls || LGEMS[t].cls === cls)); return RNG.shuffle(want).concat(RNG.shuffle(gen)); };
    const cubePool = () => { const own = new Set(kit.cube); const want = [];
      const gen = LEGENDS.filter(l => !l.w && (!l.cls || l.cls === cls) && !own.has(l.id) && !want.includes(l.id) && l.fx).map(l => l.id); return RNG.shuffle(want).slice(0, 2).concat(RNG.shuffle(gen)); };
    if (f % 10 === 0) {
      const lv = twLgLv(f);
      if (kit.lg.length < 3) lgPool().slice(0, 3).forEach(t => out.push({ t: 'lg', g: { t, lv } }));
      else {   // 三颗满了：两颗升 30 级，再给一颗新的（换掉身上一颗，接过它的等级）（2026-11-25）
        RNG.shuffle(kit.lg.map((g, i) => i)).slice(0, 2).sort((a, b) => a - b).forEach(i => out.push({ t: 'lgup', i, add: 30 }));
        const nt = lgPool()[0]; if (nt) out.push({ t: 'lg', g: { t: nt, lv }, swap: 1 });
      }
    } else if (f % 5 === 0) cubePool().slice(0, 3).forEach(lid => out.push(kit.cube.length < 3 ? { t: 'cube', lid } : { t: 'cube', lid, swap: 1 }));   // 满了也出，选了换掉一个
    else {
      const sets = twSets(cls), gear = () => {
        if (RNG.ch(0.62)) { const sid = RNG.pick(sets), S = SETS.find(x => x.id === sid), [sl] = RNG.pick(S.pieces); return { t: 'eq', it: twItem(cls, sl, 'set', { setId: sid }) }; }
        const legs = [...new Set(B.flatMap(b => b.leg))].map(id => LEGENDS.find(l => l.id === id)).filter(Boolean);
        const wpn = LEGENDS.filter(l => l.w && sets.includes(l.set));
        const gen = LEGENDS.filter(l => !l.cls && !l.w && !l.x && l.slot !== 'offhand');
        const clsL = LEGENDS.filter(l => l.cls === cls && !l.w && !l.x);   // 本职业的神兵（不只流派推荐那几件）+ 套装兵器，或者通用神兵，各一半
        const L = RNG.pick(RNG.ch(0.5) ? clsL.concat(wpn) : gen); return { t: 'eq', it: twItem(cls, L.slot, 'legend', { legendId: L.id }) };
      };
      const skill = () => {
        const notIn = C.skills.filter(k => k.cd && !kit.sk.includes(k.id));
        const add = notIn.filter(k => skFits(cls, kit.sk.concat(k.id))), swp = notIn.filter(k => kit.sk.some(o => skFits(cls, kit.sk.map(x => x === o ? k.id : x))));   // 按武学分类规则：能直接加的、换掉一招才放得下的
        if (kit.sk.length < LOADOUT_MAX && add.length) return { t: 'sk', id: RNG.pick(add).id };
        if (swp.length && (kit.sk.length < LOADOUT_MAX || RNG.ch(0.4))) return { t: 'sk', id: RNG.pick(swp).id, swap: 1 };   // 招式满了（或这一类放不下了）也出新招，选的时候换掉一招（2026-11-25）
        const has = kit.sk.filter(id => RUNES[id]); if (!has.length) return swp.length ? { t: 'sk', id: RNG.pick(swp).id, swap: 1 } : gear();
        const id = RNG.pick(has), cur = kit.rn[id], r = cur ? (cur === 'a' ? 'b' : 'a') : RNG.pick(['a', 'b']); return { t: 'rn', id, r };
      };
      out.push(gear()); out.push(RNG.ch(kit.sk.length < LOADOUT_MAX ? 0.6 : 0.35) ? skill() : gear()); out.push(skill());
      RNG.shuffle(out);
    }
    return out;
  });
}
// 三选一都不要：换一点全属性，一层层叠（2026-11-25）
const TW_ALL = 3;   // 每次：伤害、气血、护甲各 +3%
// 套装共鸣（2026-11-25）：塔里同一套凑齐 4 件、6 件，另给伤害、气血——集中凑一套的才有，东拼西凑拿不到
const TW_RES = [[4, 60, 40], [6, 120, 80]];
function twSetMax(kit) { const c = {}; for (const q of POS_IDS) { const it = kit.eq[q]; if (it && it.set) c[it.set] = (c[it.set] || 0) + 1; } return Math.max(0, ...Object.values(c)); }
function twBuffs(cls, kit) { const b = { ...(TW.cls[cls] || {}) }, a = TW_ALL * (kit.allN || 0); if (a) for (const k of ['dmgPct', 'hpPct', 'armorPct']) b[k] = (b[k] || 0) + a;
  const n = twSetMax(kit); for (const [k, d, h] of TW_RES) if (n >= k) { b.dmgPct = (b.dmgPct || 0) + d; b.hpPct = (b.hpPct || 0) + h; }
  return b; }
// 底子属性（攻击、护甲、气血、速度这些部位本身带的）沿用旧的那件，再加上新神兵自己的特效属性
function twImpOf(old, it) { const lo = old.legend && LEGENDS.find(l => l.id === old.legend), ln = it.legend && LEGENDS.find(l => l.id === it.legend), b = { ...(old.imp || {}) };
  if (lo) for (const k in lo.imp) if (b[k] != null) { b[k] -= lo.imp[k]; if (Math.abs(b[k]) < 1e-9) delete b[k]; }
  if (ln) for (const k in ln.imp) b[k] = (b[k] || 0) + ln.imp[k];
  return b; }
function twEqPos(kit, it) {   // 塔装换上去落在哪一格：扳指先顶掉空的、宝品的那只
  if (slotType(it.slot) !== 'ring') return it.slot;
  const rank = x => !x ? -1 : x.rarity === 'rare' ? 0 : 1; return rank(kit.eq.ring2) < rank(kit.eq.ring) ? 'ring2' : 'ring';
}
function twApply(cls, p) {   // 选中一样：放进塔装
  const S = twState(cls), kit = S.kit;
  if (p.t === 'eq') {
    const pos = twEqPos(kit, p.it), old = kit.eq[pos], it = p.it;
    if (old) { it.aff = twClone(old.aff); it.plus = old.plus; it.sockets = old.sockets; it.gems = (old.gems || []).slice(); it.imp = twImpOf(old, it); }
    kit.eq[pos] = it;
  } else if (p.t === 'sk') { if (kit.sk.includes(p.id)) {} else if (p.out && kit.sk.includes(p.out)) { const L = kit.sk.map(x => x === p.out ? p.id : x); if (skFits(cls, L)) { kit.sk = L; delete kit.rn[p.out]; } } else if (skFits(cls, kit.sk.concat(p.id))) kit.sk.push(p.id); }
  else if (p.t === 'rn') kit.rn[p.id] = p.r;
  else if (p.t === 'cube') { if (kit.cube.includes(p.lid)) {} else if (p.out != null && kit.cube.includes(p.out)) kit.cube[kit.cube.indexOf(p.out)] = p.lid; else if (kit.cube.length < 3) kit.cube.push(p.lid); }
  else if (p.t === 'lg') { const o = p.out != null && kit.lg[+p.out];
    if (o) kit.lg[+p.out] = { ...p.g, lv: Math.max(p.g.lv, o.lv) }; else if (kit.lg.length < 3) kit.lg.push(p.g); }
  else if (p.t === 'all') kit.allN = (kit.allN || 0) + 1;
  else if (p.t === 'lgup') { const g = kit.lg[p.i]; if (g) g.lv = Math.min(TW.lgMax + 60, g.lv + p.add); }
  S.pend = null;
  if (S.ckWait) { S.ckWait = false; S.ckKit = twClone(kit); }   // 塔主层：选完再存档（存档里带着这次拿的灵玉）
}
// 开打：做一个只在这一场用的「趟」，不碰存档里的进行中冒险
function twRun(cls) {
  const S = twState(cls), f = S.fl, fl = twFloor(cls, f), ch = twCh(cls, S.kit);
  const sth = (() => { try { return wmap(fl.c).def.theme; } catch (e) { return null; } })();
  const run = { cls, mode: 'tower', world: true, chapter: 1, riftLv: fl.N, theme: fl.c - 1, sth, mods: [], buffs: twBuffs(cls, S.kit), potions: 0, team: [], twCh: ch, twF: f, twC: fl.c, twName: fl.name,
    rage: S.kit.rage, hp: 1e15, encCell: { lv: fl.lv }, encUnits: fl.units, loot: [], goldGot: 0, xpGot: 0, gemsGot: 0, matsGot: 0, kills: 0, t0: Date.now(), prog: 0, food: null };
  run.hp = runStats(run).maxHp;
  return { run, kind: fl.kind };
}
// 打完一层：赢了记层数、给三选一、发奖；输了回存档
// 塔主奖励（2026-11-25 塔顶 200 层后重定）：每周魂晶 100 起、每个塔主多 5，爬到顶一周约 3000；九幽玄晶只在 100 层以上首通给
const twPickFl = f => f % 3 === 0 || f % 5 === 0;   // 2026-11-25 不再每层都选：每 3 层一次，逢 5 层神兵之魂、逢 10 层灵玉照旧
const TW_REW = { mats: 100, matsK: 5, goldX: 200, jyFrom: 110 };
function twRewOf(f) { const k = f / 10, m = TW_REW.mats + TW_REW.matsK * (k - 1);
  return { m, g: m * TW_REW.goldX, tier: 2 + Math.ceil(f / 40), x: f >= TW_REW.jyFrom ? (f > 150 ? 3 : 2) : 0 }; }
function twEnd(cls, b) {
  const T = twSave(), S = twState(cls), f = S.fl, res = { win: !!b.win, f, rew: [] };
  if (b.win) {
    S.kit.rage = Math.round(b.P.rage || 0); S.best = Math.max(S.best, f); T.rec[cls] = Math.max(T.rec[cls] || 0, f); S.fl = f + 1;
    S.pend = f >= TW.top || !twPickFl(f) ? null : twPicks(cls, f, S.kit); if (S.pend && !S.pend.length) S.pend = null;   // 塔顶打完就不用再选了
    if (f >= TW.top) res.top = true;
    if (f % 10 === 0) {
      S.ck = f; if (S.pend) S.ckWait = true; else S.ckKit = twClone(S.kit);
      const R = twRewOf(f); T.wr[cls] = T.wr[cls] || 0; T.ms[cls] = T.ms[cls] || 0;
      if (f > T.wr[cls]) { T.wr[cls] = f; const gk = gemKey(RNG.pick(['ruby', 'sapphire', 'topaz', 'emerald', 'amethyst', 'diamond']), Math.min(gemCap(), R.tier));
        SAVE.mats += R.m; SAVE.gold += R.g; addGem(gk); res.rew.push({ t: 'wk', m: R.m, g: R.g, gem: gk }); }
      if (f > T.ms[cls]) { T.ms[cls] = f; if (R.x) { if (shelved('jy')) { const m = R.x * 100; SAVE.mats += m; res.rew.push({ t: 'first', m }); }   // 九幽封存：首通的玄晶改给魂晶（1 颗折 100）
        else { SAVE.jyx = (SAVE.jyx || 0) + R.x; res.rew.push({ t: 'first', x: R.x }); } } }
    }
  } else { S.kit = twClone(S.ckKit); S.fl = S.ck + 1; S.pend = null; S.ckWait = false; res.back = S.fl; }
  return res;
}
