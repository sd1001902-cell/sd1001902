// ============ 深渊回廊 · 游戏引擎（不碰界面） ============
'use strict';

const RNG = {
  f: (a, b) => a + Math.random() * (b - a),
  i: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  ch: p => Math.random() < p,
  w(map) {
    let t = 0; for (const k in map) t += Math.max(0, map[k]);
    let x = Math.random() * t;
    for (const k in map) { x -= Math.max(0, map[k]); if (x < 0) return k; }
    return Object.keys(map)[0];
  },
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
};
let _uid = 0;
const uid = () => (++_uid).toString(36) + Math.random().toString(36).slice(2, 7);

// ---------------- 存档 ----------------
const SAVE_KEY = 'jiuyou-save-v1';
let SAVE = null;
let storageOK = true;
let onPersist = null;

function newChar() { return { level: 1, xp: 0, tal: {}, runes: {}, order: null, off: {}, yi: [], cube: [null, null, null],
  eq: { weapon: makeItem({ slot: 'weapon', ilvl: 1, rarity: 'normal', noSocket: true }) } }; }
function newSave() {
  const s = { v: 4, gv: 2, boxv: 1, pv: 2, team: ['ngoc'], t: 0, gold: 0, mats: 0, gems: {}, stash: [], chars: {}, unlocked: { normal: true }, cls: 'berserker', diff: 'normal',
              mode: 'story', riftLv: 1, mods: [], speed: 1, sound: true, music: true, run: null,
              stats: { runs: 0, wins: 0, kills: 0, goblins: 0, bounties: 0, rifts: 0 }, best: {},
              para: { lv: 0, xp: 0, pts: {} }, cube: {}, lgems: [], flags: {}, kills: {}, ach: {}, bld: {}, disp: {}, bounty: null,
              riftMax: 0, rift: {}, riftCap: 3, jyx: 0, riftRec: {}, zy: {}, chapter: 1, ngocJoin: true, ultAuto: true, thv: 2,
              story: { cleared: { normal: 0, nightmare: 0, hell: 0 }, pages: {}, ended: false, seen: {} } };
  for (const c of CLASS_IDS) s.chars[c] = newChar();
  return s;
}
function migrate(s) {
  const d = newSave(), gv0 = s.gv || 0, bx0 = s.boxv || 0, pv0 = s.pv || 0, thv0 = s.thv || 0;
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  for (const k in d.stats) if (s.stats[k] === undefined) s.stats[k] = 0;
  for (const c of CLASS_IDS) {
    if (!s.chars[c]) s.chars[c] = newChar();
    const ch = s.chars[c], nc = newChar();
    for (const k of ['tal', 'runes', 'off', 'cube', 'yi']) if (!ch[k]) ch[k] = nc[k];
    if (ch.order === undefined) ch.order = null;
    if (ch.level > MAX_LEVEL) { ch.level = MAX_LEVEL; ch.xp = 0; }
  }
  if (!bx0) {   // 灵玉从扳指、玉佩搬进灵玉匣；孔还给普通玉
    for (const c of CLASS_IDS) { const ch = s.chars[c]; if (!ch.lgs) ch.lgs = [];
      for (const sl in ch.eq) { const it = ch.eq[sl]; if (!it || !it.gems) continue; for (const g of it.gems) if (g.startsWith('L:') && ch.lgs.length < BOX_SLOTS && !ch.lgs.includes(g.slice(2))) ch.lgs.push(g.slice(2)); } }
    const strip = it => { if (it && it.gems) it.gems = it.gems.filter(g => !g.startsWith('L:')); };
    (s.stash || []).forEach(strip); for (const c of CLASS_IDS) for (const sl in s.chars[c].eq) strip(s.chars[c].eq[sl]);
    s.boxv = 1;
  }
  if (s.para && !pv0) {   // 修为升级所需降到二十分之一之后，把以前刷的经验按新标准补上：已有的等级按老标准（30000 + 1500×级）折回总经验，再按新标准重新算等级。只做一次
    const L0 = s.para.lv || 0; let T = (s.para.xp || 0) + 30000 * L0 + 750 * L0 * (L0 - 1), L = 0;
    while (T >= paraNeed(L) && L < 9999) { T -= paraNeed(L); L++; }
    if (L > L0) { s.para.lv = L; s.para.xp = Math.round(T); s.paraUp = [L0, L]; }
  }
  if (s.para && pv0 === 1) {   // 修为又快了一倍：按上一版标准（1500 + 75×级）折回总经验，再按新标准重新算等级。只做一次
    const L0 = s.para.lv || 0; let T = s.para.xp || 0, L = 0; for (let i = 0; i < L0; i++) T += 1500 + 75 * i;
    while (T >= paraNeed(L) && L < 99999) { T -= paraNeed(L); L++; }
    if (L > L0) { s.para.lv = L; s.para.xp = Math.round(T); s.paraUp2 = [L0, L]; }
  }
  s.pv = 2;
  if ((s.speed || 1) > 3) s.speed = 3;   // 2026-11-23 倍速最高 3 倍
  if (!thv0) {   // 2026-11-24 反震词条从死数改成反震倍率：按原来在范围里的成色（q）落到 10–20%；荆棘铠自带的反震也改成反震倍率 +20%
    walkItems(s, it => {
      const gm = genMult(it);
      for (const a of it.aff || []) if (a[0] === 'thorns') { const sc = 1 + (it.ilvl || 1) * 0.22, lo = 5 * sc * gm, hi = 8 * sc * gm, q = Math.max(0, Math.min(1, (a[1] - lo) / Math.max(1, hi - lo))); a[1] = Math.round((10 + q * 10) * gm); }
      if (it.imp && it.imp.thorns != null) { const L = it.legend && LEGENDS.find(l => l.id === it.legend); if (L && L.imp.thornK) it.imp.thornK = L.imp.thornK; delete it.imp.thorns; }
    });
  }
  if (thv0 < 2) walkItems(s, it => { for (const a of it.aff || []) if (a[0] === 'thorns') a[1] = Math.max(1, Math.round(a[1] / 2)); });   // 2026-11-24 反震词条改成「反震伤害 +5–10%」：原来的反震倍率 +10–20% 对半折
  s.thv = 2;
  for (const g of s.lgems || []) if (LGEM_OLD[g.t]) { g.old = g.t; g.t = 'reforge'; }
  for (const g of s.lgems || []) if ((g.lv || 0) > LGEM_CAP) { (s.lgCut = s.lgCut || []).push([g.t === 'reforge' && LGEM_OLD[g.old] ? LGEM_OLD[g.old] : (LGEMS[g.t] || {}).n || "Linh ngọc", g.lv]); g.lv = LGEM_CAP; }   // 等级上限 150：超出的降回来，进游戏提示一次   // 2026-11-23 删掉的五颗灵玉：等玩家挑新的（等级保留）
  if (s.flags && !s.flags.wpnForged) { const all = [...(s.stash || [])]; for (const c in s.chars || {}) for (const sl in s.chars[c].eq || {}) if (s.chars[c].eq[sl]) all.push(s.chars[c].eq[sl]);
    if (all.some(it => it && it.legend && (LEGENDS.find(l => l.id === it.legend) || {}).w)) s.flags.wpnForged = 1; }   // 老存档：手里有专属兵器就算打过
  if (!Array.isArray(s.team)) s.team = s.ngocJoin !== false ? ['ngoc'] : s.comp && s.comp !== 'ngoc' ? [s.comp] : [];   // 幻境组队：老存档按原来带的那位
  s.disp = {};
  if (s.riftCap == null || s.riftCap < s.riftMax + 1) s.riftCap = Math.max(3, s.riftMax + 3);   // 老存档：保持原来「最高纪录 +3」的上限
  if (!s.comps) s.comps = { ngoc: 1 };
  if (!s.comp) s.comp = 'ngoc';
  if (s.run && !s.run.world && (!s.run.maze || s.run.maze.v !== 2)) s.run = null;
  if (!(s.story && s.story.ended) && !(s.path === 'rift' && (s.riftMax || 0) >= 15)) s.mods = [];
  if (!s.story.cleared) s.story = d.story;
  if (s.run && (!s.run.maze || !s.run.mode)) s.run = null;
  if (s.run && s.run.mode === 'rift' && !(s.run.world && s.run.rw)) s.run = null;   // 旧的点格子幻境：进行到一半的那一局作废
  if (s.run && s.run.mode === 'rift' && typeof rBuild === 'function') { try { rBuild(s.run); } catch (e) { s.run = null; } }
  // 传奇图鉴：把已经拿到的都记上；找不到定义的旧神兵降为稀有
  if (!s.codex) s.codex = {};
  s.newLeg = [];
  const allIt = [...(s.stash || [])]; for (const c in s.chars) for (const k in (s.chars[c].eq || {})) if (s.chars[c].eq[k]) allIt.push(s.chars[c].eq[k]);
  for (const it of allIt) if (it && it.rarity === 'legend') { if (it.legend && LEGENDS.some(l => l.id === it.legend)) s.codex[it.legend] = 1; else { it.rarity = 'rare'; delete it.legend; } }
  // 职业重做（v4）：心法点全部退回、技能装配重来、旧变招清掉
  if ((s.v || 0) < 4) { for (const c of CLASS_IDS) { const ch = s.chars[c]; ch.tal = {}; ch.loadout = null; ch.loadoutManual = 0; ch.unequipped = {}; ch.runes = {}; } s.respec4 = 1; }
  // 速度改成数值：旧鞋子的主属性速度（固定 3）按阶数补上
  for (const it of allIt) if (it && it.slot === 'boots' && it.imp) { const L = it.legend && LEGENDS.find(l => l.id === it.legend), li = (L && L.imp.spd) || 0; if (it.imp.spd === 3 + li) it.imp.spd = bootSpd(it.ilvl) + li; }
  // 词条重做（gv 2）：旧装备的百分比词条按新规矩换算，出错部位的词条换成同档的实数词条
  if (gv0 < 2) { let n = 0; walkItems(s, it => { if (regearItem(it)) n++; }); if (n && s.t) s.gearNote = n; s.gv = 2; }
  s.v = 4;
  return s;
}
function walkItems(o, fn, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 12) return;
  if (typeof o.slot === 'string' && Array.isArray(o.aff) && o.imp && typeof o.ilvl === 'number') { fn(o); return; }
  if (Array.isArray(o)) { for (const x of o) if (x && typeof x === 'object') walkItems(x, fn, depth + 1); return; }
  for (const k in o) { const x = o[k]; if (x && typeof x === 'object') walkItems(x, fn, depth + 1); }
}
const REGEAR_TO = { o: ['atk', 'hp', 'armor', 'regen', 'thorns'], d: ['hp', 'armor', 'regen', 'thorns', 'atk'] };
function regearItem(it) {
  const gm = genMult(it), before = JSON.stringify(it.aff) + JSON.stringify(it.imp), first = it.aff[0] && it.aff[0][0];
  // 每条词条先算出成色 q（在旧范围里排第几），再按新规矩落到新范围里
  const rows = it.aff.map(([k, v]) => {
    const A = affDef(k); if (!A || A.fixed) return { k, v, keep: true };
    const ro = A.ro || A.r, q = Math.max(0, Math.min(1, (v / (affScOld(A, it.ilvl) * gm) - ro[0]) / (ro[1] - ro[0])));
    return { k, A, q, ok: affOK(A, it.slot) };
  });
  // 攻击类最多两条：先留「攻击」，再留成色最好的
  const offs = rows.filter(r => r.A && r.ok && r.A.g === 'o').sort((a, b) => (b.k === 'atk') - (a.k === 'atk') || b.q - a.q); offs.slice(AFF_OFF_MAX).forEach(r => { r.ok = false; });
  const have = new Set(rows.filter(r => r.keep || r.ok).map(r => r.k)); let nOff = rows.filter(r => r.A && r.ok && r.A.g === 'o').length;
  const val = (A, q) => Math.max(1, Math.round((A.r[0] + q * (A.r[1] - A.r[0])) * affSc(A, it.ilvl) * gm));
  it.aff = rows.map(r => {
    if (r.keep) return [r.k, r.v];
    if (r.ok) return [r.k, val(r.A, r.q)];
    // 这个部位不再出这种词条（或者攻击类超了两条）：按原来的成色换成一条实数词条
    const T = (REGEAR_TO[r.A.g] || REGEAR_TO.d).map(x => AFFIXES.find(a => a.k === x)).find(T => !have.has(T.k) && affOK(T, it.slot) && (T.g !== 'o' || nOff < AFF_OFF_MAX))
           || AFFIXES.find(a => !a.fixed && a.w > 0 && !have.has(a.k) && affOK(a, it.slot) && a.g !== 'o');
    if (!T) return [r.k, val(r.A, r.q)];
    have.add(T.k); if (T.g === 'o') nOff++;
    return [T.k, val(T, r.q)];
  });
  const L = legendOf(it); if (L) for (const k in L.imp) if (!FLAT_STATS.has(k) && k !== 'spd' && it.imp[k] != null) it.imp[k] = L.imp[k];
  const changed = JSON.stringify(it.aff) + JSON.stringify(it.imp) !== before;
  if (changed) { delete it.rfPending; delete it.wsPending; delete it.rrPending;
    if (it.rarity === 'magic' && it.aff[0] && it.aff[0][0] !== first && it.base) { const A = affDef(it.aff[0][0]); if (A) it.name = joinName(A.p, it.base); } }
  return changed;
}
function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { SAVE = migrate(JSON.parse(raw)); clampRunHp(); return SAVE; } }
  catch (e) { storageOK = false; }
  SAVE = newSave(); return SAVE;
}
function clampRunHp() { try { if (SAVE && SAVE.run && SAVE.run.hp != null) SAVE.run.hp = Math.min(SAVE.run.hp, runStats(SAVE.run).maxHp); } catch (e) {} }
function persist(quiet) {
  if (!quiet) SAVE.t = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); storageOK = true; } catch (e) { storageOK = false; }
  if (onPersist && !quiet) onPersist();
}
// ---------- 存档码：压缩（LZW）+ 网址安全的 64 进制 + 长度和校验，短得多，被截断能认出来 ----------
const B64U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', LZ_MAX = 1 << 16;
function lzPack(str) {   // str 里每个字符都在 0~255
  const dict = new Map(); let next = 256, bits = 9, w = '', acc = 0, nacc = 0, out = '';
  const emit = code => { acc |= code << nacc; nacc += bits; while (nacc >= 6) { out += B64U[acc & 63]; acc >>>= 6; nacc -= 6; } };
  const codeOf = k => k.length === 1 ? k.charCodeAt(0) : dict.get(k);
  for (let i = 0; i < str.length; i++) {
    const c = str[i], wc = w + c;
    if (wc.length === 1 || dict.has(wc)) { w = wc; continue; }
    emit(codeOf(w));
    if (next < LZ_MAX) { dict.set(wc, next++); if (next > (1 << bits)) bits++; }
    w = c;
  }
  if (w) emit(codeOf(w));
  if (nacc) out += B64U[acc & 63];
  return out;
}
function lzUnpack(txt) {
  const val = {}; for (let i = 0; i < 64; i++) val[B64U[i]] = i;
  let pos = 0, acc = 0, nacc = 0, bits = 9, next = 256;
  const read = () => { while (nacc < bits) { if (pos >= txt.length) return -1; const v = val[txt[pos++]]; if (v === undefined) throw new Error('bad char'); acc |= v << nacc; nacc += 6; } const c = acc & ((1 << bits) - 1); acc >>>= bits; nacc -= bits; return c; };
  const dict = []; let k = read(); if (k < 0) return ''; if (k > 255) throw new Error('bad head');
  let w = String.fromCharCode(k); const out = [w];
  for (;;) {
    if (next < LZ_MAX && next + 1 > (1 << bits)) bits++;
    k = read(); if (k < 0) break;
    let e; if (k < 256) e = String.fromCharCode(k); else if (k < next) e = dict[k - 256]; else if (k === next) e = w + w[0]; else throw new Error('bad code');
    out.push(e);
    if (next < LZ_MAX) { dict[next - 256] = w + e[0]; next++; }
    w = e;
  }
  return out.join('');
}
function sum32(s) { let a = 1, b = 0; for (let i = 0; i < s.length; i++) { a = (a + s.charCodeAt(i)) % 65521; b = (b + a) % 65521; } return ((b << 16) | a) >>> 0; }
const SAVE_TAG = 'JY1';
function packSaveObj(obj) { const raw = unescape(encodeURIComponent(JSON.stringify(obj))); return SAVE_TAG + '.' + raw.length.toString(36) + '.' + sum32(raw).toString(36) + '.' + lzPack(raw); }
// 存档码瘦身（只影响导出的码，本机存档不动）：
//   1. 每张地图的迷雾原来是一格一个字符，改成「连续多少格」的游程；
//   2. 不在打的章节，普通小怪不进码——回去歇一次脚就会按原数补齐；精英、悬赏、带标记的照留。
const rleSeen = s => { if (typeof s !== 'string' || !/^[01]*$/.test(s) || !s) return s; const out = []; let c = s[0], n = 0; for (const ch of s) { if (ch === c) n++; else { out.push(n.toString(36)); c = ch; n = 1; } } out.push(n.toString(36)); return 'R' + s[0] + out.join('.'); };
const unrleSeen = s => { if (typeof s !== 'string' || s[0] !== 'R') return s; let c = s[1], out = ''; for (const n of s.slice(2).split('.')) { out += c.repeat(parseInt(n, 36) || 0); c = c === '0' ? '1' : '0'; } return out; };
const MON_PLAIN = ['id', 'x', 'y', 'z', 'm', 'lv', 'beh', 'hx', 'hy'];
function slimSave(S) {
  const o = JSON.parse(JSON.stringify(S)), cur = o.run && o.run.world ? o.run.chapter : null;
  for (const k in o.world || {}) { const W = o.world[k]; if (!W || !W.sd) continue;
    for (const sc in W.sd) { const D = W.sd[sc]; D.seen = rleSeen(D.seen);
      if (W.ch !== cur && Array.isArray(D.mons)) D.mons = D.mons.filter(mn => Object.keys(mn).some(q => !MON_PLAIN.includes(q))); } }
  o._slim = 1; return o;
}
function fatSave(o) {
  if (!o || !o._slim) return o;
  for (const k in o.world || {}) { const W = o.world[k]; if (!W || !W.sd) continue; for (const sc in W.sd) W.sd[sc].seen = unrleSeen(W.sd[sc].seen); }
  delete o._slim; return o;
}
function exportSave() { return packSaveObj(slimSave(SAVE)); }
// 更短的存档码（JY2）：浏览器自带的 deflate，比上面的 LZW 再短四成多。老浏览器没有这个功能，就继续用 JY1。
const SAVE_TAG2 = 'JY2';
const sum32b = u8 => { let a = 1, b = 0; for (let i = 0; i < u8.length; i++) { a = (a + u8[i]) % 65521; b = (b + a) % 65521; } return ((b << 16) | a) >>> 0; };
const b64u = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 3) { const a = u8[i], b = i + 1 < u8.length ? u8[i + 1] : 0, c = i + 2 < u8.length ? u8[i + 2] : 0;
  s += B64U[a >> 2] + B64U[((a & 3) << 4) | (b >> 4)]; if (i + 1 < u8.length) s += B64U[((b & 15) << 2) | (c >> 6)]; if (i + 2 < u8.length) s += B64U[c & 63]; } return s; };
const unb64u = str => { const out = new Uint8Array(Math.floor(str.length * 3 / 4)); let acc = 0, bits = 0, j = 0;
  for (let i = 0; i < str.length; i++) { const v = B64U.indexOf(str[i]); if (v < 0) throw new Error('cut'); acc = ((acc << 6) | v) & 0xffff; bits += 6; if (bits >= 8) { bits -= 8; out[j++] = (acc >> bits) & 255; } } return out.subarray(0, j); };
const canDeflate = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' && typeof Response === 'function' && typeof TextEncoder === 'function';
async function pipeBytes(u8, stream) { const w = stream.writable.getWriter(); w.write(u8).catch(() => {}); w.close().catch(() => {}); return new Uint8Array(await new Response(stream.readable).arrayBuffer()); }
async function exportSaveZ() {
  if (!canDeflate()) return exportSave();
  try { const raw = new TextEncoder().encode(JSON.stringify(slimSave(SAVE))), z = await pipeBytes(raw, new CompressionStream('deflate'));
    return SAVE_TAG2 + '.' + raw.length.toString(36) + '.' + sum32b(raw).toString(36) + '.' + b64u(z); } catch (e) { return exportSave(); }
}
// 两种存档码都认。message：'cut' 不完整 / 'bad' 不是存档码 / 'old' 浏览器太旧读不了 JY2
async function decodeSaveAny(str) {
  const s = String(str || '').replace(/\s+/g, ''), m = s.match(/JY2\.([0-9a-z]+)\.([0-9a-z]+)\.([A-Za-z0-9_-]+)/);
  if (!m) { if (/JY2\./.test(s)) throw new Error('cut'); return decodeSave(str); }
  if (!canDeflate()) throw new Error('old');
  let raw; try { raw = await pipeBytes(unb64u(m[3]), new DecompressionStream('deflate')); } catch (e) { throw new Error('cut'); }
  if (raw.length !== parseInt(m[1], 36) || sum32b(raw) !== parseInt(m[2], 36)) throw new Error('cut');
  return parseSave(fatSave(JSON.parse(new TextDecoder().decode(raw))));
}
// 存档码 → 存档对象（不动当前进度）。出错时抛出 Error，message：'cut' 被截断 / 'bad' 不是存档码
function decodeSave(str) {
  str = String(str || '').replace(/\s+/g, '');
  const m = str.match(/JY1\.([0-9a-z]+)\.([0-9a-z]+)\.([A-Za-z0-9_-]+)/);
  if (m) {
    let raw; try { raw = lzUnpack(m[3]); } catch (e) { throw new Error('cut'); }
    if (raw.length !== parseInt(m[1], 36) || sum32(raw) !== parseInt(m[2], 36)) throw new Error('cut');
    return parseSave(fatSave(JSON.parse(decodeURIComponent(escape(raw)))));
  }
  if (/^JY1\./.test(str)) throw new Error('cut');
  let obj; try { obj = JSON.parse(decodeURIComponent(escape(atob(str)))); } catch (e) { throw new Error('bad'); }   // 旧版存档码
  return parseSave(obj);
}
function parseSave(obj) { if (!obj || !obj.chars || !Array.isArray(obj.stash)) throw new Error('bad'); return migrate(obj); }
function importSave(str) { SAVE = decodeSave(str); persist(); }
// 一眼看得懂的存档摘要：恢复之前给玩家确认用
function saveBrief(S) {
  const cls = S.cls, c = (S.chars || {})[cls] || { level: 1 }, cleared = ((S.story || {}).cleared || {}).normal || 0;
  return { cls, lv: c.level || 1, cleared, ch: S.run && S.run.chapter ? S.run.chapter : Math.min(10, cleared + 1), gold: S.gold || 0, t: S.t || 0, para: (S.para || {}).lv || 0, ended: !!(S.story || {}).ended };
}

// ---------------- 剧情进度与解锁 ----------------
const storyCleared = diff => (SAVE && SAVE.story && SAVE.story.cleared[diff || 'normal']) || 0;
const POSTGAME = new Set(['rift', 'para', 'lgem', 'bounty', 'mods', 'nightmare', 'enhance', 'sockets', 'gems', 'reroll']);   // 装备养成（强化、打孔镶玉、淬炼洗炼、传承升阶）通关后才开：剧情里装备每章都换，专心看故事
// 两条路：主线（看剧情，一章一章开）/ 幻境（开头选「幻境挑战」：跳过剧情直接刷，按幻境打到的最高层一样样开）。两条路共用一个存档，主线随时能回去打
const riftPath = () => !!(typeof SAVE !== 'undefined' && SAVE && SAVE.path === 'rift');
const rTop = () => (SAVE && SAVE.riftMax) || 0;
const RIFT_UNLOCK = { rift: 0, enhance: 3, reroll: 5, sockets: 5, gems: 5, runes: 7, cube: 8, bounty: 10, lgem: 12, para: 15, mods: 15 };
const RIFT_COMP = { ngoc: 0, zhen: 3, long: 7, kang: 10 };   // 幻境路线：伙伴陆续来
const pgOr = lv => !!(SAVE && SAVE.story && SAVE.story.ended) || (riftPath() && rTop() >= lv);   // 通关了，或者幻境路线打到了 lv 层
const featureOn = key => (riftPath() && RIFT_UNLOCK[key] != null && rTop() >= RIFT_UNLOCK[key]) || featureOn0(key);
const featureOn0 = key => POSTGAME.has(key) ? !!(SAVE && SAVE.story && SAVE.story.ended) : storyCleared('normal') >= (FEATURE_CH[key] || 0) || (key === 'runes' && typeof wPast === 'function' && wPast(7, 'runes7'));   // 变招：第七章龙道长教过就开
const pgCh = () => Math.max(storyCleared('normal'), riftPath() ? Math.min(10, Math.floor(rTop() / 2)) : 0);   // 营地建筑按「相当于打到第几章」：幻境路线两层算一章
const bldOpen = B => pgCh() >= (B.ch || 0);

// ---------------- 营地建筑 ----------------
const bLv = id => { const B = BUILDINGS.find(x => x.id === id); return B && SAVE && SAVE.story ? Math.min(B.max, Math.floor(pgCh() * (B.max + 1) / 11)) : 0; };
const stashMax = () => 120 + bLv('warehouse') * 40;
const smithMax = () => Math.min(ENHANCE_MAX, 5 + bLv('smith'));
const gemCap = () => { const j = Math.min(4, 2 + bLv('jewel')); return j < 4 ? j : 4 + GEM_RIFT.filter(l => (SAVE.riftMax || 0) >= l).length; };   // 玉器坊管到极品；后四档看幻境最高层
function gemCapErr(nt) { if (nt <= gemCap()) return null; return gemCap() < 4 || nt <= 4 ? `Xưởng Ngọc chưa đủ cấp, giờ chỉ ghép được tới “${GEM_TIERS[gemCap()]}”` : `Ảo Cảnh cao nhất phải đánh tới tầng ${GEM_RIFT[nt - 5]} mới ghép ra được “${GEM_TIERS[nt]}”`; }
function bldCost(B, lv) { return { gold: Math.round(B.gold * Math.pow(lv + 1, 2)), mats: B.mats * (lv + 1) }; }
function upgradeBuilding(id) {
  const B = BUILDINGS.find(x => x.id === id), lv = bLv(id);
  if (!bldOpen(B)) return { err: "Chưa khai trương" };
  if (lv >= B.max) return { err: "Đã tối đa cấp" };
  const c = bldCost(B, lv);
  if (SAVE.gold < c.gold) return { err: "Không đủ tiền vàng" };
  if (SAVE.mats < c.mats) return { err: "Không đủ mảnh linh hồn" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats; SAVE.bld[id] = lv + 1; return { ok: true };
}

// ---------------- 装备 ----------------
// ---------------- 装备分阶：每章一段等级，掉落的装备按所在章节定阶 ----------------
const CH_BAND = [null, [1, 7], [8, 12], [12, 15], [15, 18], [18, 21], [21, 24], [24, 27], [27, 30], [30, 33], [33, 36]];
const TIER_N = ['', "Giai 1", "Giai 2", "Giai 3", "Giai 4", "Giai 5", "Giai 6", "Giai 7", "Giai 8", "Giai 9", "Giai 10", "Giai 11"];
function tierOf(ilvl) { for (let c = 1; c <= 10; c++) if (ilvl <= CH_BAND[c][1] + 1) return c; return 11; }
const curChapter = () => (typeof SAVE !== 'undefined' && SAVE && SAVE.run && SAVE.run.world && SAVE.run.mode === 'rift') ? 10 : (typeof SAVE !== 'undefined' && SAVE && SAVE.run && SAVE.run.world) ? SAVE.run.chapter : Math.min(10, (typeof SAVE !== 'undefined' && SAVE && SAVE.story ? storyCleared('normal') : 0) + 1);
// 本章装备的等级上限（任务奖励、宝箱不会超过本章）
function chIlvl(ch, lv) { const B = CH_BAND[Math.min(10, Math.max(1, ch))]; return Math.max(B[0], Math.min(B[1], lv)) + 1; }
// 通关后的新位置：腰带、副手、第二枚扳指，按幻境最高纪录逐个开；灵玉匣通关即得
const slotOpen = pos => { const S = SLOTS.find(x => x.id === pos); return !!S && (!S.rift || !!(pgOr(0) && (SAVE.riftMax || 0) >= S.rift)); };
const eqSlots = () => POS_IDS.filter(slotOpen);
const boxOpen = () => pgOr(RIFT_UNLOCK.lgem);
// 同一件神兵、同一套的扳指，只能戴一枚
const sameRing = (a, b) => !!a && !!b && a !== b && ((a.legend && a.legend === b.legend) || (a.set && a.set === b.set));
// 这件装备穿到哪个位置：扳指有两个位置（空的优先；都满了换掉更值得换的那枚），别的装备只有自己那个位置
function posFor(cls, it, want) {
  if (it.slot !== 'ring' || !slotOpen('ring2')) return it.slot;
  const ch = SAVE.chars[cls], eq = ch.eq;
  if (eq.ring === it) return 'ring'; if (eq.ring2 === it) return 'ring2';
  if (sameRing(it, eq.ring)) return 'ring'; if (sameRing(it, eq.ring2)) return 'ring2';
  if (want === 'ring' || want === 'ring2') return want;
  if (!eq.ring) return 'ring'; if (!eq.ring2) return 'ring2';
  const P = e => power(calcStats(cls, e, ch.level, null, ch));
  return P({ ...eq, ring2: it }) > P({ ...eq, ring: it }) ? 'ring2' : 'ring';
}
function implicitFor(slot, L) {
  switch (slot) {
    case 'belt':    return { hp: Math.round(6 + L * 5), armor: Math.round(2 + L * 1.6) };
    case 'offhand': return { atk: Math.round(1 + L * 1.1) };
    case 'weapon': return { atk: Math.round(2 + L * 2.0) };
    case 'helm':   return { armor: Math.round(2 + L * 2.0) };
    case 'chest':  return { armor: Math.round(5 + L * 3.2), hp: Math.round(4 + L * 4.5) };
    case 'gloves': return { armor: Math.round(1 + L * 1.5), atk: Math.round(L * 0.55) };
    case 'boots':  return { armor: Math.round(1 + L * 1.5), spd: bootSpd(L) };   // 鞋子的主属性：速度，随阶数涨
    default: return {};
  }
}
const bootSpd = L => Math.round(4 + tierOf(L) * 1.2);
const SPD_CAP = 90;   // 速度最多 100 + 90
function scaleObj(o, m) { const r = {}; for (const k in o) r[k] = k === 'spd' ? o[k] : Math.round(o[k] * m); return r; }
const affSc = (a, ilvl) => a.fixed ? 1 : a.flat ? 1 + ilvl * 0.22 : 1;   // 百分比词条不随装备等级涨（原来是 0.68 + ilvl / 22：第七章差不多翻倍）
const affScOld = (a, ilvl) => a.fixed ? 1 : a.flat ? 1 + ilvl * 0.22 : 0.68 + ilvl / 22;   // 旧存档换算用
const FLAT_STATS = new Set(['atk', 'hp', 'armor', 'regen']);   // 2026-11-24 反震改成百分比（反震倍率），不再随等级涨、吃强化   // 实数属性：随等级涨、吃强化
const affOK = (a, slot) => !slot || ((!a.slots || a.slots.includes(slot)) && !(a.no && a.no.includes(slot)));
const OFF_SLOTS = new Set(['weapon', 'gloves', 'ring', 'amulet', 'offhand']);
const AFF_OFF_MAX = 2;   // 一件装备最多两条攻击类词条（攻击、伤害、术法、暴击、暴伤、速度、吸血）
// 「某一招伤害」词条存成 sk_<招式>；查表、排重时都按 skd 算
const affBase = k => k && k.startsWith('sk_') ? 'skd' : k;
const affDef = k => AFFIXES.find(a => a.k === affBase(k));
const AFF_ST = Object.fromEntries(AFFIXES.filter(a => a.st).map(a => [a.k, a.st]));
const SKD_EX = new Set(['warcry', 'butui', 'summon', 'jihuo', 'yangshi', 'curse', 'shadowstep', 'yandun', 'aegis', 'prayer', 'chanhou']);
let AFF_CLS = null;   // 掉落、洗炼时这件装备算哪个职业的（挑「某一招」用）
function skdKey(cls) { const C = CLASSES[cls || AFF_CLS || (SAVE && SAVE.run && SAVE.run.cls) || (SAVE && SAVE.cls)] || CLASSES.berserker; return 'sk_' + RNG.pick(C.skills.filter(x => !SKD_EX.has(x.id))).id; }
const affPgOK = a => !a.pg || pgOr(10);
function affixValue(a, ilvl, mult, max) {
  const sc = affSc(a, ilvl);
  return Math.max(1, Math.round((max ? a.r[1] : RNG.f(a.r[0], a.r[1])) * sc * mult));
}
function rollAffixes(n, ilvl, mult, exclude = [], max, slot, wash) {   // wash：洗炼，不封顶攻击类、所有词条都能洗到
  const out = [], used = new Set(exclude.map(affBase));
  let nOff = 0; for (const k of exclude) { const A = affDef(k); if (A && A.g === 'o') nOff++; }
  // 兵器、护腕、扳指、玉佩：三条以上词条的装备，一定带满两条攻击类——掉出来的宝品不会全是防御词条，普通装备和挑过的装备差距也小
  const needOff = !wash && slot && OFF_SLOTS.has(slot) && n + exclude.length >= 3 ? AFF_OFF_MAX : 0, offMax = wash ? 99 : AFF_OFF_MAX;
  while (out.length < n) {
    const left = n - out.length, must = needOff - nOff >= left;
    let pool = AFFIXES.filter(a => !used.has(a.k) && a.w > 0 && affOK(a, slot) && (wash || affPgOK(a)) && (a.g !== 'o' || nOff < offMax));
    if (must) { const p2 = pool.filter(a => a.g === 'o'); if (p2.length) pool = p2; }
    if (!pool.length) break;
    let x = Math.random() * pool.reduce((s, a) => s + a.w, 0), pick = pool[0];
    for (const a of pool) { x -= a.w; if (x < 0) { pick = a; break; } }
    used.add(pick.k); if (pick.g === 'o') nOff++; out.push([pick.k === 'skd' ? skdKey() : pick.k, affixValue(pick, ilvl, mult, max)]);
  }
  return out;
}
function pickBase(slot, ilvl, cls) { const ok = BASES[slot].filter(b => b[1] <= (ilvl || 1)); const b = (RNG.pick(ok.slice(-2)) || BASES[slot][0])[0];
  return slot === 'offhand' ? joinName(b, OFFHAND_BASE[cls] || OFFHAND_BASE.berserker) : b; }
// 会掉哪些种类：剧情里是那七种；通关后在幻境里，开了的腰带、副手也会掉
const dropSlots = () => SAVE && SAVE.run && SAVE.run.mode === 'rift' ? [...SLOT_IDS, ...X_ITEM_SLOTS.filter(slotOpen)] : SLOT_IDS;
// 大地图掉率：普通怪基本只掉凡品/灵品；稀有主要靠精英、首领、宝箱
const W_RARITY = {
  normal: { normal: 50, magic: 45, rare: 5, set: 0.2, legend: 0.05 },
  elite:  { normal: 0, magic: 52, rare: 40, set: 5, legend: 3 },
  boss:   { normal: 0, magic: 0, rare: 85, set: 15, legend: 0 },
  chest:  { normal: 0, magic: 60, rare: 35, set: 4, legend: 1 },
  quest:  { normal: 0, magic: 100, rare: 0, set: 0, legend: 0 },
};
// 福缘：只抬神兵、套装和上古（原来还抬宝品，把神兵挤掉了，精英、妖王身上几乎没用）。每 +100%：神兵、套装 ×1.5，上古 ×1.25；算到 +300% 为止
const MF_CAP = 300, mfK = mf => 1 + Math.min(MF_CAP, Math.max(0, mf || 0)) / 200, mfAnc = mf => 1 + Math.min(MF_CAP, Math.max(0, mf || 0)) / 400;
let DROP_MF = 0;   // 这场战斗结算掉落时的福缘（上古几率用）
let DROP_LUCK = 0;   // 「福星」词条：这场战斗结算掉落时，神兵的权重按它加成
function rollRarity(quality, mf, diffLoot) {
  if (typeof SAVE !== 'undefined' && SAVE && SAVE.run && SAVE.run.world && SAVE.run.mode !== 'rift' && W_RARITY[quality === 'cache' ? 'chest' : quality]) {
    const w = { ...W_RARITY[quality === 'cache' ? 'chest' : quality] }, m2 = Math.pow(1.3, diffLoot || 0);
    w.rare *= m2; w.set *= mfK(mf) * m2; w.legend *= mfK(mf) * m2 * (1 + (DROP_LUCK || 0) / 100);
    return RNG.w(w);
  }
  const w = { normal: 40, magic: 36, rare: 18, set: 2.5, legend: 1.05 * (1 + (DROP_LUCK || 0) / 100) };   // 神兵：幻境 30 层一局一件出头（最早是 0.12，一局难得见一件）
  if (quality === 'elite') { w.normal = 6; w.magic = 40; w.rare *= 2.2; w.set *= 3; w.legend *= 3; }
  if (quality === 'boss')  { w.normal = 0; w.magic = 18; w.rare *= 3; w.set *= 6; w.legend *= 6; }
  if (quality === 'gamble'){ w.normal = 0; w.magic = 50; w.rare = 36; w.set = 7; w.legend = 2.5; }
  if (quality === 'cache') { w.normal = 0; w.magic = 0; w.rare = 60; w.set = 20; w.legend = 5; }
  const m2 = Math.pow(1.3, diffLoot || 0);
  w.set *= m2 * mfK(mf); w.legend *= m2 * mfK(mf);
  return RNG.w(w);
}
function rollSockets(slot, rarity) {
  const max = MAX_SOCKETS[slot], p = { normal: 0.35, magic: 0.2, rare: 0.25, set: 0.15, legend: 0.15 }[rarity];
  let n = 0; while (n < max && RNG.ch(n === 0 ? p : p * 0.5)) n++;
  return n;
}
const affMult = it => ({ rare: 1.1, set: 1.2, legend: 1.2 }[it.rarity] || 1);
const ANC_P = [0.05, 0.003];   // 上古、太古的几率（原来 10%、0.6%：神兵掉得多了，这两档收一收才显得珍贵）
// 上古、太古跟着幻境层数走：30 层以内 5% / 0.3%，往上每层 +0.25% / +0.03%（69 层约 14.8% / 1.5%），封顶 20% / 2%。幻境以外（主线、赌装备、铸兵）按底数
const ANC_STEP = [0.0025, 0.0005], ANC_CAP = [0.2, 0.02], ANC_FROM = 30, ANC_COST = 500, PRIMAL_COST = 1000, PRIMAL_FROM = 90, PRIMAL_P0 = 0.005;   // 太古：幻境 90 层起才出，90 层 0.5%，每层 +0.05%，120 层到 2% 封顶
const ancRate = N => { const d = Math.max(0, (N || 0) - ANC_FROM); return [Math.min(ANC_CAP[0], ANC_P[0] + d * ANC_STEP[0]), (N || 0) >= JY_FROM ? 2 * jyRate(N) : (N || 0) >= PRIMAL_FROM ? Math.min(ANC_CAP[1], PRIMAL_P0 + (N - PRIMAL_FROM) * ANC_STEP[1]) : 0]; };   // 400 层起太古 = 九幽的两倍（400 层 2%，500 层 6%）
const ancNow = () => ancRate(SAVE && SAVE.run && SAVE.run.mode === 'rift' ? SAVE.run.riftLv : 0);
// 九幽（2026-11-24 用户定）：太古之上第四档。全属性再 +30%（合计普通的 1.69 倍），5–6 条满值词条，外加 1 条九幽词条。
// 只在幻境 400 层起掉：400 层 1%，每层 +0.02%，500 层 3% 封顶；保底：太古点化成九幽（2000 魂晶 + 10 颗九幽玄晶，要到过 400 层）；九幽词条可以花 2 颗玄晶重洗
const JY_FROM = 400, JY_P0 = 0.01, JY_STEP = 0.0002, JY_CAP = 0.03, JY_COST = 2000, JY_XJ = 10, JY_WASH = 2;
const jyRate = N => (N || 0) >= JY_FROM ? Math.min(JY_CAP, JY_P0 + ((N || 0) - JY_FROM) * JY_STEP) : 0;
const jyOK = () => !!(SAVE && SAVE.run && SAVE.run.mode === 'rift' && SAVE.run.riftLv >= JY_FROM);
const jyGate = () => (SAVE.riftMax || 0) >= JY_FROM;
const ancK = it => (it.anc || 0) >= 3 ? 1.69 : it.anc ? 1.3 : 1;   // 上古、太古 ×1.3，九幽 ×1.69
const maxAnc = it => (it.anc || 0) >= 2;   // 太古、九幽：词条全满值
const jySlot = it => { const t = slotType(it.slot) || it.slot; return t === 'ring2' ? 'ring' : t; };
function rollJy(it) { const pool = Object.keys(JY_AFF).filter(k => JY_AFF[k].slot === jySlot(it)); if (!pool.length) return null; const k = RNG.pick(pool), A = JY_AFF[k]; return [k, RNG.i(A.r[0], A.r[1])]; }
function jyWash(it) {   // 重洗九幽词条：本部位的池子里重抽，数值也重摇
  if (!it || (it.anc || 0) < 3 || !it.jy) return { err: "Chỉ trang bị Cửu U mới tẩy được từ tố Cửu U" };
  if ((SAVE.jyx || 0) < JY_WASH) return { err: `Cửu U Huyền Tinh không đủ (cần ${JY_WASH} viên)` };
  SAVE.jyx -= JY_WASH; const old = it.jy; it.jy = rollJy(it); return { ok: true, old };
}
function jyUp(it) {   // 太古 → 九幽：多长一条满值词条（凑到 5–6 条），再长一条九幽词条
  it.anc = 3; SAVE.flags.jiuyou = true;
  const want = 5 + (RNG.ch(0.5) ? 1 : 0); if (it.aff.length < want) addAffixes(it, want - it.aff.length);
  it.aff = it.aff.map(([k]) => [k, affixValue(affDef(k), it.ilvl, affMult(it), true)]);
  it.jy = rollJy(it); }
// 点化：花魂晶逐级点——普通 → 上古（500，一半几率多长一条词条）→ 太古（1000，再多长一条，全部词条变满值）。太古要幻境到过 90 层
const ancOK = it => !!it && (it.rarity === 'legend' || it.rarity === 'set') && (it.anc || 0) < 3;
const ancCost = it => (it.anc || 0) === 0 ? ANC_COST : (it.anc || 0) === 1 ? PRIMAL_COST : JY_COST;
const primalGate = () => (SAVE.riftMax || 0) >= PRIMAL_FROM;
function ancientize(it) {
  if (!it || !(it.rarity === 'legend' || it.rarity === 'set')) return { err: "Chỉ thần binh và đồ Bộ mới điểm hóa được" };
  if ((it.anc || 0) >= 3) return { err: "Món này đã là Cửu U rồi" };
  if (busyRoll(it)) return { err: "Món này còn một kết quả tẩy luyện / tôi luyện chưa chọn" };
  if (it.anc === 1 && !primalGate()) return { err: `Đánh Ảo Cảnh tới tầng ${PRIMAL_FROM} mới điểm hóa được Thái Cổ` };
  if (it.anc === 2 && !jyGate()) return { err: `Ảo Cảnh đánh tới tầng ${JY_FROM} mới điểm hóa được Cửu U` };
  if (it.anc === 2 && (SAVE.jyx || 0) < JY_XJ) return { err: `Cửu U Huyền Tinh không đủ (cần ${JY_XJ} viên)` };
  const c = ancCost(it); if (SAVE.mats < c) return { err: "Không đủ hồn tinh" };
  SAVE.mats -= c; let add = 0;
  if (it.anc === 2) { SAVE.jyx -= JY_XJ; const n0 = it.aff.length; jyUp(it); return { ok: true, add: it.aff.length - n0, jy: true }; }
  if (!it.anc) { it.anc = 1; SAVE.flags.ancient = true; if (RNG.ch(0.5)) add = addAffixes(it, 1); }
  else { it.anc = 2; SAVE.flags.primal = true; add = addAffixes(it, 1); it.aff = it.aff.map(([k]) => [k, affixValue(affDef(k), it.ilvl, affMult(it), true)]); }
  return { ok: true, add };
}
const primalOK = () => !!(SAVE && SAVE.run && SAVE.run.mode === 'rift' && SAVE.run.riftLv >= PRIMAL_FROM);
// 通关后掉的装备按新的词条数（主线照旧，已有的装备不动）：宝品 2 条；神兵、套装 3 条；上古 3–4 条；太古 4–5 条
const PG_AFF = () => pgOr(10);
function addAffixes(it, n) { const L = it.legend && LEGENDS.find(l => l.id === it.legend), ex = [...it.aff.map(a => a[0]), ...(L ? Object.keys(L.imp) : [])];
  AFF_CLS = it.cls || ownerCls(it); const more = rollAffixes(n, it.ilvl, affMult(it), ex, maxAnc(it), it.slot); AFF_CLS = null;
  while (more.length < n) {   // 副手这种格子攻击类词条多、又封顶两条：凑不够就放开封顶，保证上古 3–4、太古 4–5 条
    const used = new Set([...ex, ...more.map(a => a[0])].map(affBase)), pool = AFFIXES.filter(a => !used.has(a.k) && a.w > 0 && affPgOK(a) && affOK(a, slotType(it.slot) || it.slot)); if (!pool.length) break;
    const A = RNG.pick(pool); more.push([A.k === 'skd' ? skdKey(it.cls || ownerCls(it)) : A.k, affixValue(A, it.ilvl, affMult(it), maxAnc(it))]);
  }
  it.aff.push(...more); return more.length; }
function finishItem(it, noSocket) {
  it.tier = tierOf(it.ilvl);
  it.plus = 0; it.gems = []; it.sockets = noSocket ? 0 : rollSockets(it.slot, it.rarity);
  if (it.rarity === 'legend' || it.rarity === 'set') {
    const ap = ancNow(), ak = mfAnc(DROP_MF); it.anc = jyOK() && RNG.ch(jyRate(SAVE.run.riftLv) * ak) ? 3 : primalOK() && RNG.ch(ap[1] * ak) ? 2 : RNG.ch(ap[0] * ak) ? 1 : 0;
    if (it.anc === 3) jyUp(it);
    else {
      if (PG_AFF() && it.anc) { const want = (it.anc === 2 ? 4 : 3) + (RNG.ch(0.5) ? 1 : 0); if (it.aff.length < want) addAffixes(it, want - it.aff.length); }   // 通关后：上古 3–4 条，太古 4–5 条
      if (it.anc === 2) it.aff = it.aff.map(([k]) => [k, affixValue(affDef(k), it.ilvl, affMult(it), true)]); }
  }
  return it;
}
function makeItem({ slot, ilvl, rarity, cls, setId, noSocket, legendId }) {
  AFF_CLS = cls || null;
  ilvl = Math.max(1, Math.min(70, Math.round(ilvl)));
  if (rarity === 'legend') {
    const cc = Math.max(tierOf(ilvl), 1);
    const ok = l => (!slot || l.slot === slot) && (!l.cls || l.cls === cls) && (l.ch || 1) <= cc && (!l.pg || pgOr(10)) && (!l.x || (slotOpen(l.slot) && (slot === l.slot || dropSlots().includes(l.slot))));
    const mine = LEGENDS.filter(l => ok(l) && l.cls), gen = LEGENDS.filter(l => ok(l) && !l.cls);
    const forced = legendId && LEGENDS.find(l => l.id === legendId);
    const pool = forced ? [forced] : (mine.length && (RNG.ch(0.6) || !gen.length) ? mine : gen).filter(l => !l.w);   // 专属兵器不走普通掉落
    if (pool.length) {
      const wsum = pool.map(l => ((l.ch || 1) >= cc ? 3 : (l.ch || 1) >= cc - 1 ? 1.6 : 1) * (l.wt || 1));   // wt：散件流那对扳指是整条路的门槛，掉得比别的通用神兵勤   // 本章的传奇更常见
      let r0 = Math.random() * wsum.reduce((a, b) => a + b, 0), L = pool[0];
      for (let i = 0; i < pool.length; i++) { r0 -= wsum[i]; if (r0 <= 0) { L = pool[i]; break; } }
      slot = L.slot;
      const imp = scaleObj(implicitFor(slot, ilvl), L.w ? 1.05 * WPN_BASE : 1.05), lsc = 0.45 + ilvl / 20;
      for (const k in L.imp) imp[k] = (imp[k] || 0) + (FLAT_STATS.has(k) ? Math.max(1, Math.round(L.imp[k] * lsc)) : L.imp[k]);   // 神兵自带的百分比属性也不随等级涨
      return finishItem({ id: uid(), slot, ilvl, rarity, name: L.n, base: pickBase(slot, ilvl, L.cls || cls), legend: L.id, imp, ...(slot === 'offhand' && L.cls ? { cls: L.cls } : {}),
                          aff: rollAffixes(PG_AFF() ? 3 : RNG.i(2, 3), ilvl, 1.05, Object.keys(L.imp), false, slot) }, noSocket);
    }
    rarity = 'rare';
  }
  if (rarity === 'set') {
    let pool = [];
    for (const S of SETS) if (!S.rift || setId) for (const [sl, n] of S.pieces) if (!slot || sl === slot) pool.push({ S, sl, n });
    if (setId) pool = pool.filter(p => p.S.id === setId);
    else if (cls && RNG.ch(0.65)) { const p2 = pool.filter(p => p.S.cls === cls); if (p2.length) pool = p2; }
    if (pool.length) {
      const p = RNG.pick(pool); slot = p.sl;
      const rs = p.S.rift;   // 幻境套装：底子更厚，多一条词条
      return finishItem({ id: uid(), slot, ilvl, rarity, name: p.n, base: pickBase(slot, ilvl), set: p.S.id, cls: p.S.cls,
                          imp: scaleObj(implicitFor(slot, ilvl), rs ? 1.4 : 1.25), aff: rollAffixes(rs || PG_AFF() ? 3 : 2, ilvl, rs ? 1.3 : 1.2, [], false, slot) }, noSocket);
    }
    rarity = 'rare';
  }
  slot = slot || RNG.pick(dropSlots());
  if (rarity === 'normal' && (slot === 'ring' || slot === 'amulet')) rarity = 'magic';
  const ocls = slot === 'offhand' ? (cls || (SAVE && SAVE.cls) || 'berserker') : null;   // 副手是各门派自己的物件，别的门派用不了
  const base = pickBase(slot, ilvl, ocls);
  const R = RARITY[rarity];
  const aff = rollAffixes(rarity === 'rare' && PG_AFF() ? 2 : RNG.i(R.aff[0], R.aff[1]), ilvl, rarity === 'rare' ? 1.1 : 1, [], false, slot);
  let name = base;
  if (rarity === 'magic') name = joinName(affDef(aff[0][0]).p, base);
  if (rarity === 'rare') name = slot === 'offhand' ? joinName(RNG.pick(RARE_NAME_A), OFFHAND_BASE[ocls]) : RNG.pick(RARE_NAME_A) + (isVi() ? ' ' : '') + RNG.pick(RARE_NAME_B[slot]);
  const it0 = { id: uid(), slot, ilvl, rarity, name, base, imp: implicitFor(slot, ilvl), aff }; if (ocls) it0.cls = ocls;
  return finishItem(it0, noSocket);
}
const ancName = it => it.anc === 3 ? "Cửu U ·" : it.anc === 2 ? "Thái Cổ ·" : it.anc === 1 ? "Thượng Cổ ·" : '';
function itemMult(it) { return (1 + (it.plus || 0) * 0.08) * ancK(it); }
// 强化只加实数属性（攻击、气血、护甲、回复、反震）；百分比属性不吃强化，只吃上古／太古的 +30%
const statMult = (it, k) => k === 'spd' ? 1 : FLAT_STATS.has(k) ? itemMult(it) : ancK(it);
function itemStats(it) {
  const s = {};
  const add = (k, v) => { s[k] = (s[k] || 0) + v; };
  for (const k in it.imp) add(k, Math.round(it.imp[k] * statMult(it, k)));
  for (const [k, v] of it.aff) add(AFF_ST[k] || k, Math.round(v * statMult(it, k)));
  for (const g of it.gems || []) {
    if (g.startsWith('L:')) { const L = SAVE && SAVE.lgems.find(x => x.id === g.slice(2)); if (L) { const st = LGEMS[L.t].st(L.lv); for (const k in st) add(k, st[k]); } continue; }
    const [t, tier] = g.split('_'); const G = GEM_TYPES[t]; if (G) add(G.st, G.v[+tier]);
  }
  return s;
}
function sellPrice(it) { return Math.round((3 + it.ilvl * 1.5) * { normal: 1, magic: 2, rare: 5, set: 12, legend: 15 }[it.rarity] * (1 + (it.plus || 0) * 0.15) * (it.anc ? (it.anc >= 3 ? 4 : 2) : 1) * (1 + bLv('merchant') * 0.1)); }
function canEquip(it, cls) { return !it.cls || it.cls === cls; }
const legendOf = it => it.legend && LEGENDS.find(l => l.id === it.legend);
const setOf = it => it.set && SETS.find(s => s.id === it.set);

// ---------------- 天赋 ----------------
function talentBranches(cls) { return [{ ...CLASSES[cls].tree, id: 'class' }, ...TALENT_SHARED]; }
function talentInfo(cls) {
  const ch = SAVE.chars[cls], tal = ch.tal || {};
  let spent = 0; for (const k in tal) spent += tal[k];
  return { total: ch.level - 1, spent, free: ch.level - 1 - spent };
}
function branchSpent(cls, br) { const tal = SAVE.chars[cls].tal; let n = 0; for (const k in tal) if (k.startsWith(br + '.')) n += tal[k]; return n; }
function canLearn(cls, br, idx) {
  const Bq = talentBranches(cls).find(b => b.id === br), T = Bq.t[idx], key = br + '.' + T.id;
  return talentInfo(cls).free > 0 && (SAVE.chars[cls].tal[key] || 0) < T.max && branchSpent(cls, br) >= idx * TALENT_TIER_REQ;
}
function learnTalent(cls, br, idx) {
  if (!canLearn(cls, br, idx)) return false;
  const before = runMaxHpIf(cls);
  const T = talentBranches(cls).find(b => b.id === br).t[idx], key = br + '.' + T.id;
  SAVE.chars[cls].tal[key] = (SAVE.chars[cls].tal[key] || 0) + 1;
  fixRunHp(cls, before); return true;
}
const respecCost = cls => SAVE.chars[cls].level < 10 ? 0 : SAVE.chars[cls].level * 25;
function resetTalents(cls) {
  const c = respecCost(cls); if (SAVE.gold < c) return false;
  const before = runMaxHpIf(cls);
  SAVE.gold -= c; SAVE.chars[cls].tal = {}; fixRunHp(cls, before); return true;
}

// ---------------- 巅峰等级 ----------------
const paraNeed = p => Math.round((1500 + p * 75) / 2);   // 2026-11-23 再快一倍（用户：幻境层数高了修为跟不上妖物）；原来 1500 + 75p   // 原来 30000 + 1500p：修为 100 级时十来局才升一级。除以 20：69 层一局约 2.5 万经验，100 级时一局升 3 级，200 级时一局一级多
function paraFree() { let n = 0; for (const k in SAVE.para.pts) n += SAVE.para.pts[k]; return SAVE.para.lv - n; }
function paraCanAdd(k) { const P = PARAGON_STATS.find(x => x.k === k); const cur = SAVE.para.pts[k] || 0; return paraFree() > 0 && (!P.cap || (cur + 1) * P.v <= P.cap); }
function addPara(k, n = 1) { let done = 0; while (done < n && paraCanAdd(k)) { SAVE.para.pts[k] = (SAVE.para.pts[k] || 0) + 1; done++; } return done; }
function resetPara() { SAVE.para.pts = {}; }

// ---------------- 镇妖录与役使 ----------------
function zyEntries(i) { const C = CHAPTERS[i], out = [], seen = new Set();
  const add = (n, boss) => { if (!seen.has(n)) { seen.add(n); out.push({ n, boss }); } };
  add(C.boss.n, true); if (C.boss.twin) add(C.boss.twin.n, true); C.mons.forEach(m => add(m.n, false)); return out; }
// 存档里镇妖录、图鉴按中文名记；越南语版用 ZHN（越→中）换回中文名，两个语言共用一份存档
const MK = n => (typeof ZHN !== 'undefined' && ZHN[n]) || n;
// 越南语：形容词放在名词后面（「锋锐的铁剑」→「Kiếm sắt sắc bén」）
const isVi = () => typeof window !== 'undefined' && window.LANG === 'vi';
const joinName = (adj, noun) => isVi() ? noun + ' ' + adj : adj + noun;
const zyOf = n => (SAVE.zy || {})[MK(n)] || 0;
function zyPagePts(i) { return zyEntries(i).reduce((a, e) => a + zyOf(e.n), 0); }
function zyPageDone(i) { const E = zyEntries(i); return E.some(e => e.boss && zyOf(e.n)) && E.filter(e => !e.boss && zyOf(e.n)).length >= ZY_NEED; }
function yiGrade(id) { const Y = YISHI[id]; if (!Y) return 0; return Math.max(...zyEntries(Y.pg).filter(e => e.boss).map(e => zyOf(e.n))); }
function yiOf(ch) { const o = {}; if (!ch || !ch.yi || !SAVE || !featureOn('rift')) return o; for (const id of ch.yi) { const g = yiGrade(id); if (g) o[id] = g; } return o; }
function setYi(cls, id) {
  const ch = SAVE.chars[cls], yi = ch.yi || (ch.yi = []), before = runMaxHpIf(cls);
  const i = yi.indexOf(id);
  if (i >= 0) yi.splice(i, 1); else { if (!yiGrade(id)) return { err: "Chưa thu phục thủ lĩnh chương này" }; if (yi.length >= 2) yi.shift(); yi.push(id); }
  fixRunHp(cls, before); return { ok: true };
}
// 收一颗精魄：品级比现在高才算数，否则化成魂晶
function zyTake(res, name, g) {
  const cur = zyOf(name);
  if (g > cur) { const yiBefore = Object.keys(YISHI).filter(id => yiGrade(id)); SAVE.zy[MK(name)] = g; res.zy.push([name, g, cur]);
    // 头一回收服某章首领：解锁一只役使；身上役使没带满就直接带上
    const nu = Object.keys(YISHI).find(id => yiGrade(id) && !yiBefore.includes(id)), cls = SAVE.run && SAVE.run.cls;
    if (nu) { res.yiNew = nu; const ch = cls && SAVE.chars[cls]; if (ch && (ch.yi || []).length < 2) { setYi(cls, nu); res.yiOn = true; } } }
  else res.mats += 2;
}

// ---------------- 图鉴与成就 ----------------
function bestiaryTier(name) { const k = (SAVE.kills || {})[MK(name)] || 0; let t = 0; for (const x of BESTIARY_TIERS) if (k >= x) t++; return t; }
function bestiaryTiers() { let n = 0; for (const name in SAVE.kills) n += bestiaryTier(name); return n; }
const bestiaryBonus = name => 0;
function allMonsterDefs() {
  const out = [], seen = new Set();
  const add = (d, kind) => { if (!seen.has(d.n)) { seen.add(d.n); out.push({ ...d, kind }); } };
  RIFT_THEMES.forEach(T => { T.mons.forEach(m => add(m, 'mon')); add(T.boss, 'boss'); if (T.boss.twin) add({ ...T.boss.twin }, 'boss'); });
  add(GOBLIN, 'goblin');
  return out;
}
function checkAch() {
  const got = [];
  for (const A of ACHIEVEMENTS) if (!SAVE.ach[A.id]) { let ok = false; try { ok = A.chk(SAVE); } catch (e) {} if (ok) { SAVE.ach[A.id] = Date.now(); got.push(A); } }
  return got;
}
function globalStats() {
  const s = {};
  const add = (k, v) => { s[k] = (s[k] || 0) + v; };
  if (featureOn('para')) for (const P of PARAGON_STATS) { const n = SAVE.para.pts[P.k] || 0; if (n) add(P.k, n * P.v); }
  if (featureOn('rift')) ZY_PAGES.forEach((Pg, i) => { const n = zyPagePts(i); if (n) for (const k in Pg.st) add(k, +(n * Pg.st[k]).toFixed(2)); });
  return s;
}

// ---------------- 属性 ----------------
const STAT_KEYS = Object.keys(STAT_NAMES);
// 暴击、全抗的衰减：75 以内照算；暴击 75 以上每 2 点算 1 点，到 85 以后每 3 点算 1 点，最高 90；全抗 75 以上每 2 点算 1 点，到 80 以后每 3 点算 1 点，最高 85
const softCap = (v, b, mx) => { if (!(v > 75)) return v; const r2 = 75 + 2 * (b - 75); const e = v <= r2 ? 75 + (v - 75) / 2 : b + (v - r2) / 3; return Math.round(Math.min(mx, e) * 10) / 10; };
const CRIT_SOFT = [85, 90], RES_SOFT = [80, 85];
const critSoft = v => softCap(v, CRIT_SOFT[0], CRIT_SOFT[1]), resSoft = v => softCap(v, RES_SOFT[0], RES_SOFT[1]);
const softRaw = (e, b, mx) => e <= 75 ? e : e >= mx ? Infinity : e <= b ? 75 + 2 * (e - 75) : 75 + 2 * (b - 75) + 3 * (e - b);   // 反过来：想要实际 e，面板得堆多少
function calcStats(clsId, eq, level, buffs, ch) {
  const C = CLASSES[clsId], s = { sk: {} }, lgv = {};   // lgv：灵玉匣里生效的灵玉 → 等级（战斗里按它算机制）
  for (const k of STAT_KEYS) s[k] = 0;
  s.hp = C.base.hp + C.per.hp * (level - 1);
  s.atk = C.base.atk + C.per.atk * (level - 1);
  s.armor = C.base.armor + C.per.armor * (level - 1);
  s.crit = C.base.crit; s.critDmg = C.base.critDmg; s.spd = C.base.spd || 0; s.res = C.base.res || 0;
  if (clsId === 'paladin') s.thornK = MONK_THK;   // 和尚自带反震倍率
  const fx = new Set(), setCount = {}, jyv = {}; let nLeg = 0;
  const add = (k, v) => { if (k.startsWith('sk_')) s.sk[k.slice(3)] = (s.sk[k.slice(3)] || 0) + v; else s[k] = (s[k] || 0) + v; };
  for (const sl of POS_IDS) {
    const it = eq[sl]; if (!it) continue;
    const st = itemStats(it); for (const k in st) add(k, st[k]);
    if (it.set) setCount[it.set] = (setCount[it.set] || 0) + 1;
    const L = legendOf(it); if (L) { fx.add(L.fx); nLeg++; }
    if (it.jy && JY_AFF[it.jy[0]]) jyv[it.jy[0]] = Math.max(jyv[it.jy[0]] || 0, it.jy[1]);   // 九幽词条：同一个穿两件算高的
  }
  for (const k in jyv) if (JY_AFF[k].st) add(JY_AFF[k].st, jyv[k]);
  for (const id in setCount) {
    const S = SETS.find(x => x.id === id); if (!S) continue;
    if (setCount[id] >= 2) for (const k in S.b2) add(k, S.b2[k]);
    if (setCount[id] >= 4) fx.add(S.b4);
    if (setCount[id] >= 6 && S.b6) fx.add(S.b6);
  }
  if (ch) {
    const tal = ch.tal || {};
    for (const Bq of talentBranches(clsId)) Bq.t.forEach(T => {
      const r = tal[Bq.id + '.' + T.id] || 0; if (!r) return;
      if (T.st) for (const k in T.st) add(k, T.st[k] * r);
      if (T.fx) fx.add(T.fx);
    });
    for (const lid of ch.cube || []) { const L = lid && LEGENDS.find(l => l.id === lid); if (L && (ch.tower || SAVE.cube[lid])) fx.add(L.fx); }   // 通天塔：塔里收的神兵之魂直接算
    if (ch.tower ? ch.twLg.length : SAVE && boxOpen()) {   // 灵玉匣：自带的气血、伤害，加上匣里三颗灵玉（通天塔：塔里拿的灵玉）
      const bs = boxStat(ch.tower ? TW.box : SAVE.riftMax); add('hpPct', bs); add('dmgPct', bs);
      for (const gid of ch.lgs || []) { const g = gid && (ch.tower ? ch.twLg : SAVE.lgems).find(x => x.id === gid), G = g && LGEMS[g.t]; if (G && (!G.cls || G.cls === clsId)) { const st = G.st(g.lv); for (const k in st) add(k, st[k]); lgv[g.t] = g.lv; } }
    }
    const yi = ch.tower ? {} : yiOf(ch);
    if (yi.guiwang) { add('mf', 12 + yi.guiwang * 8); add('gf', 20 + yi.guiwang * 10); }
    if (yi.mozun) add('dmgPct', 8 + yi.mozun * 4);
  }
  if (fx.has('gGlass')) add('dmgPct', 20);
  if (fx.has('gEvade')) add('dodge', 8);
  if (fx.has('cGhostMask')) add('dodge', 6);
  // 散件流：身上没有任何套装效果（没有哪套凑到两件）时，无相环、无名戒按穿着的神兵件数算
  const sanK = (fx.has('sanA') ? 1 : 0) + (fx.has('sanB') ? 1 : 0);
  s.sanN = sanK && !Object.keys(setCount).some(id => setCount[id] >= 2) ? sanK * nLeg : 0;
  if (SAVE) { const g = ch && ch.tower ? twGlobal() : globalStats(); for (const k in g) add(k, g[k]); }   // 通天塔：修为按统一的底子
  if (buffs) for (const k in buffs) add(k, buffs[k]);
  s.maxHp = Math.max(1, Math.round(s.hp * (1 + s.hpPct / 100) * (fx.has('gGlass') ? 0.8 : 1) * (1 + (s.pHp || 0) / 100)));   // pHp／pArmor／pAtk：修为的「根基」，乘在最终数值上
  s.cls = clsId; s.sust = clsId === 'berserker' ? 0 : Math.round(s.leech * 4);   // 别的职业：每 1% 吸血折成 4% 续航强度（本职的护体／替死／身法／金刚）
  s.armorT = Math.round(s.armor * (1 + s.armorPct / 100) * (1 + (s.pArmor || 0) / 100));
  s.atk = Math.round(s.atk * (1 + (s.atkPct || 0) / 100) * (1 + (s.pAtk || 0) / 100));   // atkPct：赤玉
  s.critRaw = Math.round(s.crit * 10) / 10; s.resRaw = Math.round(s.res * 10) / 10; s.crit = critSoft(s.critRaw); s.res = resSoft(s.resRaw);   // 2026-11-23 不再 75% 卡死：超出部分打折算
  s.spd = Math.min(SPD_CAP, Math.round(s.spd * 10) / 10); s.speed = 100 + s.spd; s.dmgPct = Math.round(s.dmgPct * 10) / 10; s.hpPct = Math.round(s.hpPct * 10) / 10; s.critDmg = Math.round(s.critDmg * 10) / 10; s.crit = Math.round(s.crit * 10) / 10;
  s.dodge = Math.min(45, s.dodge + (fx.has('dodge') ? 15 : 0));
  if (fx.has('boneArmy')) s.minion += 1;
  s.fx = fx; s.setCount = setCount; s.level = level; s.cls = clsId; s.lgv = lgv; s.jy = jyv;
  return s;
}
function charStats(clsId, buffs) { const ch = SAVE.chars[clsId]; return calcStats(clsId, ch.eq, ch.level, buffs, ch); }
// ============ 气血放大（2026-11）============
// 主角一刀几千、自己只有几百血，不像话。做法：主角这一边所有和气血有关的数字——最大气血、挨的伤害、回的血、护体——
// 一律乘一个随等级变大的倍数 hpK（10 级约 ×3.6，26 级约 ×10，满级约 ×20）。
// 战斗内部仍按原来的数算，只在显示和存取时换算，所以「挨几下死」和改之前一模一样，难度不会因为这一条而变。
const hpK = lv => 1 + 0.18 * Math.pow(Math.max(0, (lv || 1) - 1), 1.22);
const hpShow = (v, lv) => Math.round(v * hpK(lv));
const heroLv = () => { try { return SAVE.chars[SAVE.cls].level || 1; } catch (e) { return 1; } };
// 各职业的续航：狂刀客靠吸血；别的职业吸血只有三成（按放大后的气血算），各有各的路子。sust = 续航强度加成（%）
// 妖物打主角一方的伤害整体上调（MON_UP），换来各职业本职续航更有分量；两边一起调，胜率对齐改之前
let MON_UP = 1.3;
let DR_CAP = 0.7;   // 2026-11-24 主角各种「受到的伤害 -x%」连乘后最多减七成（护甲、全抗另算）。罗汉叠了狮子吼、佛怒、不动明王、金钟玉、职业减伤，850 层挨的伤害能减掉 97.5%   // 1 / 1.3 ≈ 0.77：狂刀客的 23% 减伤就是照这个数定的
const SUST = {
  berserker:{ n: "Huyết chiến", d: "Da dày thịt chắc: sát thương phải chịu -{dr}%; hút máu có hiệu lực trọn vẹn (gây ra bao nhiêu sát thương thì hồi máu theo tỉ lệ hút máu bấy nhiêu)", dr: 23 },
  mage:     { n: "Thủy hành hộ thể", d: "Mỗi lần nối thêm một tầng “Liên”, trên người thêm một lớp hộ thể ({a}% khí huyết tối đa, cộng dồn tối đa {cap}%)", a: 6.5, cap: 45 },
  necro:    { n: "Thế mạng", d: "Sát thương phải chịu -{dr}%; khi trên sân có cương thi, thêm {a}% do cương thi gánh thay; cương thi ngã xuống thì bạn hồi {b}% khí huyết tối đa", a: 17, b: 6, dr: 7 },
  assassin: { n: "Thân Pháp", d: "Sát thương phải chịu -{dr}%, né tránh +{a}%; mỗi lần né được hồi {b}% khí huyết tối đa, hạ gục kẻ địch hồi {c}%", a: 25, b: 18, c: 22, dr: 12 },
  paladin:  { n: "Kim Cương Bất Hoại", d: "Sát thương phải chịu -{dr}%; mỗi lần bị đánh phản chấn hồi {a}% khí huyết tối đa; mỗi lượt hồi thêm {b}%", a: 3, b: 1.5, dr: 19 },
};
// 等级越高，气血倍数越大，吸血缩水得越厉害，所以续航也跟着等级涨：10 级约 0.75 倍，23 级 1 倍，43 级起 1.4 倍封顶
const sustLv = lv => Math.min(1.4, 0.55 + (lv || 1) / 50);
const sustV = (u, k) => (SUST[u.cls][k] || 0) * (1 + (u.sust || 0) / 100) * sustLv(u.lv);
function power(s) {
  const off = s.atk * (1 + s.dmgPct / 100 + s.elem / 250) * (1 + s.crit / 100 * (s.critDmg / 100 - 1)) * (1 + s.spd / 100 + (s.thornK || 0) / (s.cls === 'paladin' ? 150 : 400) * (1 + (s.thornDmg || 0) / 100));   // 反震倍率也算输出（和尚挨打多，算得重一点）
  const san = s.sanN || 0;   // 散件流也算进战力，「一键换上最强」才不会把它拆了。按 +1.5%／层算：十件神兵两枚扳指 ×1.3，显示出来和同档的 6 件套差不多（实测略弱）
  const ehp = s.maxHp * (1 + s.armorT / 120) / (1 - s.res / 100 * 0.6) * (1 + s.dodge / 100) + s.regen * 25 + s.thorns * 8;
  let skb = 0; for (const k in s.sk) skb += s.sk[k];
  let rs = 0; for (const f of s.fx) if (RSET_FX.has(f)) rs++;   // 幻境套装的 4 件、6 件效果很值钱，「一键换上最强」不能把它拆散
  return Math.round(Math.sqrt(off * ehp) * (1 + 0.015 * san) * (1 + s.leech / (s.cls === 'berserker' || !s.cls ? 40 : 160)) * (1 + s.fx.size * 0.08 + s.minion * 0.1 + s.freeze / 200 + s.poison / 200 + skb / 600) * (1 + rs * 0.3));
}
const RSET_FX = new Set([...SETS.filter(S => S.rift).flatMap(S => [S.b4, S.b6]), ...LEGENDS.filter(l => l.w).map(l => l.fx)]);   // 专属兵器也按这个份量算，一键换装不会把它换下来
function powerWith(cls, item, pos) { const ch = SAVE.chars[cls]; return power(calcStats(cls, { ...ch.eq, [posFor(cls, item, pos)]: item }, ch.level, null, ch)); }
// 传承后的样子（不动原件）：把 src 的强化（降一级）、孔和玉搬到 dst 上。新捡的 +0 装备要这样才能和身上强化过的比
function inheritSim(dst, src) {
  if (typeof canInherit !== 'function' || !canInherit(dst, src)) return dst;
  const c = { ...dst, gems: [...(dst.gems || [])] };
  c.plus = Math.min(ENHANCE_MAX, Math.max(dst.plus || 0, Math.max(0, (src.plus || 0) - 1)));
  c.sockets = Math.max(dst.sockets || 0, Math.min(MAX_SOCKETS[dst.slot], src.sockets || 0));
  for (const g of src.gems || []) if (c.gems.length < c.sockets) c.gems.push(g);
  return c;
}
// 换上这件能到的战力：直接换、传承后换，取高的。inh：要传承才到得了这个数
function powerBest(cls, item, pos0) {
  const pos = posFor(cls, item, pos0), raw = powerWith(cls, item, pos), sim = inheritSim(item, SAVE.chars[cls].eq[pos]);
  if (sim === item) return { p: raw, raw, inh: false };
  const ch = SAVE.chars[cls], pi = power(calcStats(cls, { ...ch.eq, [pos]: sim }, ch.level, null, ch));
  return pi > raw ? { p: pi, raw, inh: true } : { p: raw, raw, inh: false };
}
// 「一键换上最强」的打算：每个位置挑传承后最强的那件。不动存档，只出清单
function bestPlan(cls) {
  const ch = SAVE.chars[cls], eq = { ...ch.eq }, plan = {};
  const P = e => power(calcStats(cls, e, ch.level, null, ch));
  const taken = it => Object.values(plan).some(e => e.it === it);
  for (let pass = 0; pass < 2; pass++) for (const sl of eqSlots()) {
    let bestP = P(eq), best = null;
    for (const it of SAVE.stash) {
      if (it.slot !== slotType(sl) || !canEquip(it, cls) || (taken(it) && !(plan[sl] && plan[sl].it === it))) continue;
      if (it.slot === 'ring' && sameRing(it, eq[sl === 'ring' ? 'ring2' : 'ring'])) continue;
      const sim = inheritSim(it, ch.eq[sl]), pr = P({ ...eq, [sl]: gemSim(it, ch.eq[sl]) }), ps = sim === it ? pr : P({ ...eq, [sl]: sim });   // 不传承也会把玉搬过来（免费）
      const inh = ps > pr, p = Math.max(pr, ps);
      if (p > bestP) { bestP = p; best = { it, sl, inh, sim: inh ? sim : it, cost: inh ? inheritCost(it, ch.eq[sl]) : null }; }
    }
    if (best) { eq[sl] = best.sim; plan[sl] = best; }
  }
  return Object.values(plan);
}
// 照清单办：useInh 为假就只换不用传承也更强的；银两魂晶不够的那件，不传承也更强就照换，否则跳过
function bestApply(cls, useInh) {
  if (!useInh) return { n: bestGear(cls), inh: 0, skip: 0 };
  const ch = SAVE.chars[cls]; let n = 0, ni = 0, skip = 0;
  for (const e of bestPlan(cls)) {
    if (!SAVE.stash.includes(e.it)) continue;
    let did = false;
    if (e.inh) { const r = inheritFrom(e.it, ch.eq[e.sl]); if (r.err) { if (power(calcStats(cls, { ...ch.eq, [e.sl]: gemSim(e.it, ch.eq[e.sl]) }, ch.level, null, ch)) <= power(calcStats(cls, ch.eq, ch.level, null, ch))) { skip++; continue; } } else { ni++; did = true; } }
    const old = ch.eq[e.sl];
    if (equipItem(cls, e.it.id, e.sl)) { n++; if (!did && old) bestGear.gm = (bestGear.gm || 0) + moveGems(old, e.it); }
  }
  return { n, inh: ni, skip };
}

// ---------------- 等级 ----------------
const MAX_LV = MAX_LEVEL;
const xpNeed = L => Math.round(40 * Math.pow(L, 1.75));
// 通关后的小号追赶：比账号里等级最高的角色低多少级，战斗经验就翻多少倍（差得越多追得越快），追平了就没有。
// 最高的还没满级时，差 1 级不算——免得两个号互相垫着爬
function catchUpMul(cls) {
  if (!pgOr(0)) return 1;
  const top = topLevel(), gap = top - SAVE.chars[cls].level;
  return gap > 0 && (top >= MAX_LV || gap >= 2) ? 3 + gap * 0.25 : 1;
}
// 幻境前 10 层照顾小号：妖物最多比你高 2 级（大号等级够，不受影响）；10 级以前再让一步——妖物不比你高，一群只来一只
const R_EASY = 10;
const riftNewbie = run => !!run && run.riftLv <= R_EASY && SAVE.chars[run.cls].level < 10;
const riftLvCap = (run, lv) => run && run.riftLv <= R_EASY ? Math.max(1, Math.min(lv, SAVE.chars[run.cls].level + (riftNewbie(run) ? 0 : 2))) : lv;
function gainXp(cls, x) {
  const ch = SAVE.chars[cls]; let ups = 0, pups = 0;
  if (ch.level < MAX_LV) {
    ch.xp += x; x = 0;
    while (ch.level < MAX_LV && ch.xp >= xpNeed(ch.level)) { ch.xp -= xpNeed(ch.level); ch.level++; ups++; }
    if (ch.level >= MAX_LV) { x = ch.xp; ch.xp = 0; }
  }
  if (x > 0) {
    SAVE.para.xp += x;
    while (SAVE.para.xp >= paraNeed(SAVE.para.lv)) { SAVE.para.xp -= paraNeed(SAVE.para.lv); SAVE.para.lv++; pups++; }
  }
  return ups + pups;
}

// ---------------- 装备操作 ----------------
function runMaxHpIf(cls) { return SAVE.run && SAVE.run.cls === cls ? runStats(SAVE.run).maxHp : 0; }
function fixRunHp(cls, before) {
  const r = SAVE.run; if (!r || r.cls !== cls || !before) return;
  const after = runStats(r).maxHp;
  r.hp = Math.max(1, Math.min(after, Math.round(r.hp * after / before)));
}
function checkSet4(cls) { const s = charStats(cls); if (Object.values(s.setCount).some(n => n >= 4)) SAVE.flags.set4 = true; }
function equipItem(cls, id, pos0) {
  const ch = SAVE.chars[cls], i = SAVE.stash.findIndex(x => x.id === id);
  if (i < 0) return false;
  const it = SAVE.stash[i]; if (!canEquip(it, cls)) return false;
  const before = runMaxHpIf(cls), pos = posFor(cls, it, pos0);
  SAVE.stash.splice(i, 1);
  if (ch.eq[pos]) SAVE.stash.push(ch.eq[pos]);
  ch.eq[pos] = it;
  fixRunHp(cls, before); checkSet4(cls); return true;
}
function unequip(cls, slot) {
  const ch = SAVE.chars[cls]; if (!ch.eq[slot]) return;
  const before = runMaxHpIf(cls);
  SAVE.stash.push(ch.eq[slot]); delete ch.eq[slot];
  fixRunHp(cls, before);
}
function returnGems(it) { for (const g of it.gems || []) if (!g.startsWith('L:')) SAVE.gems[g] = (SAVE.gems[g] || 0) + 1; it.gems = []; }
function sellItem(id) {
  const i = SAVE.stash.findIndex(x => x.id === id); if (i < 0) return 0;
  const it = SAVE.stash[i], p = sellPrice(it); returnGems(it);
  SAVE.gold += p; SAVE.stash.splice(i, 1); return p;
}
const isJunk = it => (it.rarity === 'normal' || it.rarity === 'magic') && !(it.plus > 0) && !(it.gems && it.gems.length) && !inKit(it);
// ---------------- 配装：每个角色 3 套，存装备、乾坤袋、招式和变招、灵玉、役使、心法点；在城里一键切换 ----------------
const KIT_N = 3;
const kitsOf = cls => { const ch = SAVE.chars[cls]; if (!Array.isArray(ch.kits)) ch.kits = []; while (ch.kits.length < KIT_N) ch.kits.push(null); return ch.kits; };
const jcopy = o => o == null ? o : JSON.parse(JSON.stringify(o));
function kitSave(cls, i, name) {
  const ch = SAVE.chars[cls], K = kitsOf(cls), eq = {};
  for (const p of POS_IDS) eq[p] = ch.eq[p] ? ch.eq[p].id : null;
  K[i] = { n: (name || (K[i] && K[i].n) || `Phối đồ ${i + 1}`).slice(0, 12), eq, cube: jcopy(ch.cube || []), lgs: jcopy(ch.lgs || []), yi: jcopy(ch.yi || []), tal: jcopy(ch.tal || {}),
    runes: jcopy(ch.runes || {}), loadout: jcopy(ch.loadout || null), loadoutManual: ch.loadoutManual || 0, unequipped: jcopy(ch.unequipped || {}), order: jcopy(ch.order || null), off: jcopy(ch.off || {}),
    gems: kitGemsNow(ch), t: Date.now() };
  ch.kitOn = i;
  return K[i];
}
// ---- 配装的玉石（2026-11-23）：每套记下每件装备镶的玉，各镶各的。换到这一套时，玉不对就自动补齐（免费）：
// 先从玉石包拿，再从储物箱里没穿着的装备上拆（多半是别的配装的，那套换回去时再从这边拆回去）；找不到同样的，就拿同一种玉里品级最高的；实在没有，列出缺哪几颗
const gemT = k => k.split('_')[0], gemTier = k => +k.split('_')[1];
const plainGems = it => (it && it.gems || []).filter(g => !g.startsWith('L:'));
function kitGemsNow(ch) { const G = {}; for (const p of POS_IDS) if (ch.eq[p]) G[p] = plainGems(ch.eq[p]); return G; }
function kitGemsSnap(cls) {   // 穿着某套时改了玉（升级、换玉），换走之前记下来：只记装备还是这套里那件的格子
  const ch = SAVE.chars[cls], K = kitsOf(cls), k = ch.kitOn != null ? K[ch.kitOn] : null; if (!k) return;
  k.gems = k.gems || {}; for (const p of POS_IDS) if (ch.eq[p] && k.eq[p] === ch.eq[p].id) k.gems[p] = plainGems(ch.eq[p]);
}
function kitGemsFill(cls, k) {
  const ch = SAVE.chars[cls], miss = []; if (!k.gems || !featureOn('gems')) return miss;
  const ps = POS_IDS.filter(p => ch.eq[p] && k.eq[p] === ch.eq[p].id && k.gems[p]);
  const need = {};
  // 1. 每件装备：留下记录里有的（同一颗，或同一种玉），多出来的卸回玉石包
  for (const p of ps) {
    const it = ch.eq[p], want = [...k.gems[p]], have = plainGems(it), keep = [];
    for (const g of [...have]) { const j = want.indexOf(g); if (j >= 0) { want.splice(j, 1); keep.push(g); have.splice(have.indexOf(g), 1); } }
    for (const g of [...have]) { const j = want.findIndex(w => gemT(w) === gemT(g)); if (j >= 0) { want.splice(j, 1); keep.push(g); have.splice(have.indexOf(g), 1); } }
    for (const g of have) addGem(g);
    it.gems = [...(it.gems || []).filter(g => g.startsWith('L:')), ...keep]; need[p] = want;
  }
  // 2. 缺的补上
  const onOthers = new Set(); for (const c of CLASS_IDS) for (const q in SAVE.chars[c].eq) if (SAVE.chars[c].eq[q]) onOthers.add(SAVE.chars[c].eq[q]);
  const donors = () => SAVE.stash.filter(x => !onOthers.has(x) && plainGems(x).length);
  const take = w => {
    if (SAVE.gems[w] > 0) { if (--SAVE.gems[w] <= 0) delete SAVE.gems[w]; return w; }
    for (const d of donors()) { const j = d.gems.indexOf(w); if (j >= 0) { d.gems.splice(j, 1); return w; } }
    let best = null, src = null;   // 同一种玉里品级最高的：先看玉石包，再看储物箱
    for (const g in SAVE.gems) if (SAVE.gems[g] > 0 && gemT(g) === gemT(w) && (!best || gemTier(g) > gemTier(best))) { best = g; src = null; }
    for (const d of donors()) for (const g of plainGems(d)) if (gemT(g) === gemT(w) && (!best || gemTier(g) > gemTier(best))) { best = g; src = d; }
    if (!best) return null;
    if (src) src.gems.splice(src.gems.indexOf(best), 1); else if (--SAVE.gems[best] <= 0) delete SAVE.gems[best];
    return best;
  };
  for (const p of ps) { const it = ch.eq[p];
    for (const w of need[p]) { if ((it.gems || []).length >= (it.sockets || 0)) { miss.push(w); continue; } const g = take(w); if (g) it.gems.push(g); else miss.push(w); } }
  return miss;
}
// 一键换装时玉跟着走（免费）：换下来那件上的玉搬到新装备上，孔不够的退回玉石包
function gemSim(it, old) {
  const og = plainGems(old); if (!og.length || !it) return it;
  const free = Math.max(0, (it.sockets || 0) - (it.gems || []).length); if (!free) return it;
  return { ...it, gems: [...(it.gems || []), ...og.slice(0, free)] };
}
function moveGems(old, it) {
  const og = plainGems(old); if (!og.length || !it) return 0; let n = 0;
  old.gems = (old.gems || []).filter(g => g.startsWith('L:')); it.gems = it.gems || [];
  for (const g of og) { if (it.gems.length < (it.sockets || 0)) { it.gems.push(g); n++; } else addGem(g); }
  return n;
}
// 现在身上这身和第 i 套是不是一样（只比装备、乾坤袋、招式）
function kitSame(cls, i) { const ch = SAVE.chars[cls], k = kitsOf(cls)[i]; if (!k) return false;
  const gs = L => [...(L || [])].sort().join(',');   // 玉也要一样（同一身装备、两套玉的情况）
  return POS_IDS.every(p => (ch.eq[p] ? ch.eq[p].id : null) === (k.eq[p] || null)) && JSON.stringify(ch.cube || []) === JSON.stringify(k.cube || []) && JSON.stringify(ch.loadout || null) === JSON.stringify(k.loadout || null) && JSON.stringify(ch.tal || {}) === JSON.stringify(k.tal || {})
    && (!k.gems || !featureOn('gems') || POS_IDS.every(p => !ch.eq[p] || !k.gems[p] || gs(plainGems(ch.eq[p])) === gs(k.gems[p]))); }
// 哪些装备在本角色的配装里（分解、出售时跳过）
function kitIds() { const S = new Set(); if (!SAVE) return S; for (const c of CLASS_IDS) for (const k of (SAVE.chars[c] && SAVE.chars[c].kits) || []) if (k) for (const p in k.eq) if (k.eq[p]) S.add(k.eq[p]); return S; }
const inKit = it => !!it && kitIds().has(it.id);
function kitUse(cls, i) {
  const k = kitsOf(cls)[i]; if (!k) return { err: "Bộ này chưa lưu" };
  if (SAVE.run && SAVE.run.cls === cls) return { err: "Đang ở ngoài không thay được, về thành rồi thay" };
  const ch = SAVE.chars[cls], before = runMaxHpIf(cls), miss = [], away = [];
  if (ch.kitOn !== i) kitGemsSnap(cls);   // 换走之前：现在这套的玉有改动，先记下
  // 1. 装备：先把要换下的放回储物箱，再穿上这套的。找不到的那一件，格子保持原样
  const mine = new Map(); for (const p of POS_IDS) if (ch.eq[p]) mine.set(ch.eq[p].id, p);
  const where = id => SAVE.stash.find(x => x.id === id) || (mine.has(id) ? ch.eq[mine.get(id)] : null);
  const plan = [];
  for (const p of POS_IDS) {
    const want = k.eq[p] || null, cur = ch.eq[p] ? ch.eq[p].id : null; if (want === cur) continue;
    if (want && !where(want)) { let other = null; for (const c of CLASS_IDS) if (c !== cls) for (const q in SAVE.chars[c].eq) if (SAVE.chars[c].eq[q] && SAVE.chars[c].eq[q].id === want) other = c;
      (other ? away : miss).push(other ? CLASSES[other].n : p); continue; }
    if (want && !slotOpen(p) && p !== 'weapon') continue;
    plan.push([p, want]);
  }
  for (const [p] of plan) if (ch.eq[p]) { SAVE.stash.push(ch.eq[p]); delete ch.eq[p]; }
  for (const [p, want] of plan) if (want) { const j = SAVE.stash.findIndex(x => x.id === want); if (j >= 0 && canEquip(SAVE.stash[j], cls)) { ch.eq[p] = SAVE.stash[j]; SAVE.stash.splice(j, 1); } }
  // 2. 乾坤袋、灵玉、役使：还在的才放回去
  if (featureOn('cube')) ch.cube = [0, 1, 2].map(j => { const l = (k.cube || [])[j]; return l && SAVE.cube[l] ? l : null; });
  if (k.lgs) ch.lgs = k.lgs.map(g => g && SAVE.lgems.some(x => x.id === g) ? g : null);
  if (k.yi) ch.yi = k.yi.filter(id => yiGrade(id)).slice(0, 2);
  // 3. 心法：免费按这套重新加点（点数不够就不动）
  if (k.tal) { let n = 0; for (const t in k.tal) n += k.tal[t]; if (n <= ch.level - 1) ch.tal = jcopy(k.tal); }
  // 4. 招式和变招
  ch.runes = jcopy(k.runes || {}); if (k.loadout) ch.loadout = k.loadout.filter(id => CLASSES[cls].skills.some(x => x.id === id && x.lv <= ch.level));
  ch.loadoutManual = k.loadoutManual || 0; ch.unequipped = jcopy(k.unequipped || {}); ch.order = jcopy(k.order); ch.off = jcopy(k.off || {});
  if (!k.gems) k.gems = kitGemsNow(ch);   // 老配装没记过玉：就按现在装备上的记下
  const gmiss = kitGemsFill(cls, k);   // 5. 玉石：按这套记下的补齐
  ch.kitOn = i; fixRunHp(cls, before); checkSet4(cls);
  return { ok: true, miss: miss.map(p => SLOT_NAME[p] || p), away: [...new Set(away)], gmiss };
}
function sellJunk() {
  let g = 0, n = 0;
  SAVE.stash = SAVE.stash.filter(it => { if (isJunk(it)) { g += sellPrice(it); n++; return false; } return true; });
  SAVE.gold += g; return { g, n };
}
function bestGear(cls) {
  const ch = SAVE.chars[cls]; const before = runMaxHpIf(cls); let changed = 0;
  for (let pass = 0; pass < 2; pass++) for (const sl of eqSlots()) {
    let bestP = power(calcStats(cls, ch.eq, ch.level, null, ch)), best = null;
    for (const it of SAVE.stash) {
      if (it.slot !== slotType(sl) || !canEquip(it, cls) || (it.slot === 'ring' && sameRing(it, ch.eq[sl === 'ring' ? 'ring2' : 'ring']))) continue;
      const p = power(calcStats(cls, { ...ch.eq, [sl]: gemSim(it, ch.eq[sl]) }, ch.level, null, ch));   // 换下来那件的玉会跟过来
      if (p > bestP) { bestP = p; best = it; }
    }
    if (best) { SAVE.stash.splice(SAVE.stash.indexOf(best), 1); const old = ch.eq[sl];
      if (old) { SAVE.stash.push(old); bestGear.gm = (bestGear.gm || 0) + moveGems(old, best); if ((old.plus || 0) > 0) bestGear.left = (bestGear.left || []).concat([old]); }
      ch.eq[sl] = best; changed++; }
  }
  fixRunHp(cls, before); checkSet4(cls); return changed;
}
function storeItem(run, it) {
  if (it.rarity === 'legend') { SAVE.flags.legend = true; SAVE.codex = SAVE.codex || {}; if (it.legend) SAVE.codex[it.legend] = 1; (SAVE.newLeg = SAVE.newLeg || []).push(it.name); }
  if (it.anc === 1) SAVE.flags.ancient = true;
  if (it.anc === 2) SAVE.flags.primal = true;
  if (it.anc === 3) SAVE.flags.jiuyou = true;
  if (SAVE.stash.length >= stashMax()) {
    const junk = SAVE.stash.filter(isJunk).sort((a, b) => sellPrice(a) - sellPrice(b))[0];
    if (junk) sellItem(junk.id);
  }
  SAVE.stash.push(it);
  if (run) { run.loot.push(it); if (!SAVE.chars[run.cls].eq[it.slot] && canEquip(it, run.cls)) { equipItem(run.cls, it.id); it.auto = true; } }
  return it;
}
const topLevel = () => Math.max(...CLASS_IDS.map(c => SAVE.chars[c].level));
// 赌石（2026-11-24 加价）：开了幻境之后按到过的最高层定底价（500 + 最高层 × 60）；连着赌每次 +10%，打完一局幻境回到底价。钱庄折扣照算
const GB_BASE = 500, GB_PER = 60, GB_STEP = 0.1;
const gambleBase = cls => rTop() > 0 ? GB_BASE + rTop() * GB_PER : 40 + SAVE.chars[cls].level * 18;
const gambleN = () => rTop() > 0 ? SAVE.gbN || 0 : 0;
function gamblePrice(cls) { return Math.round(gambleBase(cls) * (1 + GB_STEP * gambleN()) * (1 - bLv('merchant') * 0.08)); }
function gamble(cls, slot) {
  const p = gamblePrice(cls); if (SAVE.gold < p) return null;
  SAVE.gold -= p; if (rTop() > 0) SAVE.gbN = (SAVE.gbN || 0) + 1;
  return storeItem(null, makeItem({ slot, ilvl: SAVE.chars[cls].level + 2, rarity: rollRarity('gamble', 0, 0), cls }));
}

// ---------------- 铁匠：强化 / 打孔 / 镶嵌 / 分解 / 重铸 / 魔盒 ----------------
function ownerCls(it) { for (const c of CLASS_IDS) for (const sl in SAVE.chars[c].eq) if (SAVE.chars[c].eq[sl] === it) return c; return SAVE.cls; }
function findOwned(id) {
  const s = SAVE.stash.find(x => x.id === id); if (s) return s;
  for (const c of CLASS_IDS) for (const sl in SAVE.chars[c].eq) if (SAVE.chars[c].eq[sl] && SAVE.chars[c].eq[sl].id === id) return SAVE.chars[c].eq[sl];
  return null;
}
function ownerOf(it) { for (const c of CLASS_IDS) for (const sl in SAVE.chars[c].eq) if (SAVE.chars[c].eq[sl] === it) return c; return null; }
function withOwnerHp(it, fn) { const o = ownerOf(it), b = o ? runMaxHpIf(o) : 0; const r = fn(); if (o) fixRunHp(o, b); return r; }
function enhanceCost(it) { const p = it.plus || 0; return { gold: Math.round((20 + it.ilvl * 4) * (p + 1)), mats: p + 1, rate: Math.min(1, ENHANCE_RATE[p] + bLv('smith') * 0.03) }; }
function enhance(it) {
  if ((it.plus || 0) >= smithMax()) return { err: (it.plus || 0) >= ENHANCE_MAX ? "Đã cường hóa tối đa" : `Tiệm rèn chưa đủ cấp, giờ chỉ cường hóa được tối đa +${smithMax()}` };
  const c = enhanceCost(it);
  if (SAVE.gold < c.gold) return { err: "Không đủ tiền vàng" };
  if (SAVE.mats < c.mats) return { err: "Không đủ mảnh linh hồn" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats; track('forge');
  const ok = RNG.ch(c.rate);
  if (ok) withOwnerHp(it, () => { it.plus = (it.plus || 0) + 1; });
  if (it.plus >= 10) SAVE.flags.plus10 = true;
  return { ok };
}
function socketCost(it) { const n = it.sockets || 0; return { gold: Math.round((60 + it.ilvl * 8) * (n + 1)), mats: 4 * (n + 1) }; }
function addSocket(it) {
  if ((it.sockets || 0) >= MAX_SOCKETS[it.slot]) return { err: "Vị trí này đã đục đủ lỗ" };
  const c = socketCost(it);
  if (SAVE.gold < c.gold) return { err: "Không đủ tiền vàng" };
  if (SAVE.mats < c.mats) return { err: "Không đủ mảnh linh hồn" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats; it.sockets = (it.sockets || 0) + 1; return { ok: true };
}
const salvageValue = it => ({ normal: 1, magic: 2, rare: 4, set: 8, legend: 10 }[it.rarity] + (it.plus || 0) * 2 + (it.anc ? (it.anc >= 3 ? 40 : 10) : 0));
function salvage(id) {
  const i = SAVE.stash.findIndex(x => x.id === id); if (i < 0) return 0;
  const it = SAVE.stash[i], v = salvageValue(it); returnGems(it);
  SAVE.stash.splice(i, 1); SAVE.mats += v; return v;
}
// 筛选分解／出售：按品级挑，再按几条「保留」规则留下好东西。强化过、镶了玉、锁定的、淬炼洗炼到一半的，永远不动
const BULK_DEF = { mode: 'salv', r: { normal: 1, magic: 1, rare: 1, set: 0, legend: 0 }, keepUp: 1, keepSp: 1, keepAnc: 1, keepPri: 1, keepJy: 1, keepQ: 0, keepCube: 1 };   // keepAnc 只管上古，keepPri 管太古（2026-11-23 分开），keepJy 管九幽（2026-11-24）
function bulkFilter() { const f = SAVE.bulkf || (SAVE.bulkf = JSON.parse(JSON.stringify(BULK_DEF))); for (const k in BULK_DEF) if (f[k] == null) f[k] = JSON.parse(JSON.stringify(BULK_DEF[k])); return f; }
const bulkSafe = it => !!(it.lk || it.plus > 0 || (it.gems && it.gems.length) || busyRoll(it) || inKit(it));   // 配装里用到的也不动
function bulkPick(cls, f) {
  const cur = power(charStats(cls));
  return SAVE.stash.filter(it => {
    if (!f.r[it.rarity] || bulkSafe(it)) return false;
    if (f.keepSp && it.aff.some(a => SP_AFFIXES.includes(a[0]))) return false;
    if (f.keepAnc && it.anc === 1) return false;
    if (f.keepPri && it.anc === 2) return false;
    if (f.keepJy && it.anc === 3) return false;   // 九幽默认留下；用户取消勾选才会处理
    if (f.keepCube && it.legend && !SAVE.cube[it.legend]) return false;
    if (f.keepQ && it.aff.length && itemQ(it) >= 0.8) return false;
    if (f.keepUp && canEquip(it, cls) && powerBest(cls, it).p > cur) return false;   // 传承后更强的也算：新捡的没强化，直接比会输给身上强化过的
    return true;
  });
}
function bulkDo(mode, ids) { let n = 0, v = 0; for (const id of ids) { const it = SAVE.stash.find(x => x.id === id); if (!it || bulkSafe(it)) continue; v += mode === 'sell' ? sellItem(id) : salvage(id); n++; } return { n, v }; }
function salvageJunk() {
  let m = 0, n = 0;
  SAVE.stash = SAVE.stash.filter(it => { if (isJunk(it)) { m += salvageValue(it); n++; return false; } return true; });
  SAVE.mats += m; return { m, n };
}
// ---------------- 装备养成：成色、淬炼、洗炼、传承、升阶、特殊词条 ----------------
const genMult = it => ({ rare: 1.1, set: 1.2, legend: 1.05 }[it.rarity] || 1);
function affRange(k, ilvl, mult) { const a = affDef(k); if (!a) return null; const sc = affSc(a, ilvl); return [Math.max(1, Math.round(a.r[0] * sc * mult)), Math.max(1, Math.round(a.r[1] * sc * mult))]; }
// 成色：这条词条在它能出的范围里排第几（0~1）
function affQ(it, k, v) { const r = affRange(k, it.ilvl, genMult(it)); if (!r || r[1] <= r[0]) return 1; return Math.max(0, Math.min(1, (v - r[0]) / (r[1] - r[0]))); }
const affStars = q => 1 + Math.min(4, Math.floor(q * 5));
function itemQ(it) { if (!it.aff || !it.aff.length) return null; return it.aff.reduce((s, [k, v]) => s + affQ(it, k, v), 0) / it.aff.length; }
const busyRoll = it => !!(it.rfPending || it.wsPending || it.rrPending);
// 淬炼：一条词条的数值重新摇一次，新旧二选一
function refineCost(it) { const n = it.rfn || 0; return { gold: Math.round((30 + it.ilvl * 5) * (1 + n * 0.25)), mats: 2 + Math.floor(n / 2) }; }
function refineStart(it, idx) {
  if (busyRoll(it)) return { err: "Kết quả lần trước còn chưa chọn" };
  const a = it.aff[idx], A = a && affDef(a[0]); if (!A) return { err: "Thuộc tính này không tôi luyện được" };
  const c = refineCost(it); if (SAVE.gold < c.gold) return { err: "Không đủ bạc" }; if (SAVE.mats < c.mats) return { err: "Không đủ hồn tinh" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats; it.rfn = (it.rfn || 0) + 1;
  it.rfPending = { idx, opts: [[...a], [a[0], affixValue(A, it.ilvl, genMult(it), maxAnc(it))]] }; return { ok: true };
}
function refinePick(it, c) { const P = it.rfPending; if (!P) return; withOwnerHp(it, () => { it.aff[P.idx] = P.opts[c]; }); delete it.rfPending; }
// 洗炼：锁住想留的词条，其余全部换新；洗完新旧整套二选一
function washCost(it, nLock) { const n = it.wsn || 0; return { gold: Math.round((60 + it.ilvl * 8) * (1 + n * 0.2) * (1 + nLock * 0.8)), mats: 4 + nLock * 3 + Math.floor(n / 2) }; }
function washStart(it, locks) {
  if (busyRoll(it)) return { err: "Kết quả lần trước còn chưa chọn" };
  if (!it.aff.length) return { err: "Món trang bị này không có thuộc tính" };
  locks = [...new Set(locks)].filter(i => it.aff[i]); if (locks.length >= it.aff.length) return { err: "Phải chừa ít nhất một dòng không khóa" };
  const c = washCost(it, locks.length); if (SAVE.gold < c.gold) return { err: "Không đủ bạc" }; if (SAVE.mats < c.mats) return { err: "Không đủ hồn tinh" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats; it.wsn = (it.wsn || 0) + 1;
  const L = legendOf(it), keep = locks.map(i => it.aff[i][0]).concat(L ? Object.keys(L.imp) : []);
  AFF_CLS = it.cls || ownerCls(it); const fresh = rollAffixes(it.aff.length - locks.length, it.ilvl, genMult(it), keep, maxAnc(it), it.slot, true); AFF_CLS = null;
  // 稀有词条：每条新词条有 WASH_RARE 的几率变成这个部位专属的那两条之一（身上已经有的不重复）
  const have = new Set([...keep, ...fresh.map(a => a[0])].map(affBase));
  for (let q = 0; q < fresh.length; q++) { if (!RNG.ch(WASH_RARE)) continue; const pool = AFFIXES.filter(a => a.rs === it.slot && !have.has(a.k)); if (!pool.length) continue;
    const A = RNG.pick(pool); have.delete(fresh[q][0]); fresh[q] = [A.k, affixValue(A, it.ilvl, genMult(it), maxAnc(it))]; have.add(A.k); it.wsRare = 1; }
  let j = 0; const neo = it.aff.map((a, i) => locks.includes(i) ? [...a] : (fresh[j++] || [...a]));
  it.wsPending = { opts: [it.aff.map(a => [...a]), neo] }; return { ok: true };
}
function washPick(it, c) { const P = it.wsPending; if (!P) return; withOwnerHp(it, () => { it.aff = P.opts[c]; }); delete it.wsPending; delete it.wsRare; }
// 这次洗炼每条新词条可能是什么：[词条, 几率, 数值下限, 上限, 是不是稀有]。几率按权重实算（已经锁住的、神兵自带的不会重复出）
function washOdds(it, locks) {
  const L = legendOf(it), keep = new Set((locks || []).map(i => it.aff[i] && affBase(it.aff[i][0])).concat(L ? Object.keys(L.imp) : []));
  const pool = AFFIXES.filter(a => a.w > 0 && affOK(a, it.slot) && !keep.has(a.k)), W = pool.reduce((x, a) => x + a.w, 0) || 1;
  const rare = AFFIXES.filter(a => a.rs === it.slot && !keep.has(a.k)), pr = rare.length ? WASH_RARE : 0;
  const rng = a => affRange(a.k, it.ilvl, genMult(it));
  return [...pool.sort((a, b) => b.w - a.w).map(a => { const r = rng(a); return { k: a.k, p: a.w / W * (1 - pr), lo: r[0], hi: r[1], g: a.g }; }),
          ...rare.map(a => { const r = rng(a); return { k: a.k, p: pr / rare.length, lo: r[0], hi: r[1], rare: true }; })];
}
// 传承：把旧装备的强化（降一级）、孔和宝石转到同部位的新装备上
function inheritCost(dst, src) { const p = Math.max(1, src.plus || 0); return { gold: Math.round((40 + dst.ilvl * 6) * p), mats: p }; }
const canInherit = (dst, src) => src && dst && src !== dst && src.slot === dst.slot && ((src.plus || 0) > 0 || (src.gems && src.gems.length));
function inheritFrom(dst, src) {
  if (!canInherit(dst, src)) return { err: "Không truyền thừa được" };
  const c = inheritCost(dst, src); if (SAVE.gold < c.gold) return { err: "Không đủ bạc" }; if (SAVE.mats < c.mats) return { err: "Không đủ hồn tinh" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats;
  const plus = Math.max(0, (src.plus || 0) - 1), gems = [...(src.gems || [])], socks = src.sockets || 0;
  withOwnerHp(src, () => { src.plus = 0; src.gems = []; });
  const over = [];
  withOwnerHp(dst, () => {
    dst.plus = Math.min(ENHANCE_MAX, Math.max(dst.plus || 0, plus));
    dst.gems = dst.gems || []; dst.sockets = Math.max(dst.sockets || 0, Math.min(MAX_SOCKETS[dst.slot], socks));
    for (const g of gems) { if (dst.gems.length < dst.sockets) dst.gems.push(g); else over.push(g); }
  });
  if (over.length) returnGems({ gems: over });
  return { ok: true, plus: dst.plus, gems: gems.length - over.length };
}
// 升阶：稀有、套装、神兵可以升到当前章节的阶数，词条按比例一起涨
const upTierOK = it => ['rare', 'set', 'legend'].includes(it.rarity);
function upTierTarget(cls) { return chIlvl(curChapter(), SAVE.chars[cls || SAVE.cls].level); }
function upTierCost(it, L) { const d = Math.max(1, tierOf(L) - tierOf(it.ilvl)); return { gold: Math.round((150 + L * 15) * d), mats: 5 * d }; }
function upTier(it, L) {
  if (!upTierOK(it) || L <= it.ilvl) return { err: "Không thăng giai được" };
  const c = upTierCost(it, L); if (SAVE.gold < c.gold) return { err: "Không đủ bạc" }; if (SAVE.mats < c.mats) return { err: "Không đủ hồn tinh" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats;
  const old = it.ilvl, b0 = implicitFor(it.slot, old), b1 = implicitFor(it.slot, L);
  withOwnerHp(it, () => {
    const imp = {};
    for (const k in it.imp) {
      if (k === 'spd') imp[k] = it.imp[k] + (it.slot === 'boots' ? (b1.spd || 0) - (b0.spd || 0) : 0);
      else if (b0[k]) imp[k] = Math.round(it.imp[k] * b1[k] / b0[k]);
      else imp[k] = FLAT_STATS.has(k) ? Math.max(1, Math.round(it.imp[k] * (0.45 + L / 20) / (0.45 + old / 20))) : it.imp[k];
    }
    it.imp = imp;
    it.aff = it.aff.map(([k, v]) => { const a = affDef(k); return a ? [k, Math.max(1, Math.round(v * affSc(a, L) / affSc(a, old)))] : [k, v]; });
    it.ilvl = L; it.tier = tierOf(L);
  });
  return { ok: true };
}
// 给装备加一条特殊词条（悬赏、鬼市的货）：顶掉最后一条普通词条
function addSpecial(it, k) {
  const keys = SP_AFFIXES.filter(x => !it.aff.some(a => a[0] === x)); if (!keys.length) return it;
  k = k && keys.includes(k) ? k : RNG.pick(keys); const A = AFFIXES.find(a => a.k === k);
  const v = affixValue(A, it.ilvl, 1, maxAnc(it));
  if (it.aff.length >= 3 || (it.rarity !== 'magic' && it.aff.length >= 2)) it.aff[it.aff.length - 1] = [k, v]; else it.aff.push([k, v]);
  it.sp = 1; return it;
}
function rerollCost(it) { const n = it.rrn || 0; return { gold: Math.round((50 + it.ilvl * 6) * (1 + n * 0.3)), mats: 4 + n }; }
function rerollStart(it, idx) {
  if (it.rr != null && it.rr !== idx) return { err: "Món này đã đúc lại một thuộc tính khác, chỉ có thể tiếp tục đúc lại dòng đó" };
  if (!it.aff[idx]) return { err: "Không có thuộc tính này" };
  const c = rerollCost(it);
  if (SAVE.gold < c.gold) return { err: "Không đủ tiền vàng" };
  if (SAVE.mats < c.mats) return { err: "Không đủ mảnh linh hồn" };
  SAVE.gold -= c.gold; SAVE.mats -= c.mats;
  const L = legendOf(it), excl = [...it.aff.filter((_, i) => i !== idx).map(a => a[0]), ...(L ? Object.keys(L.imp) : [])];
  it.rr = idx; it.rrn = (it.rrn || 0) + 1;
  it.rrPending = { idx, opts: [it.aff[idx], ...rollAffixes(2, it.ilvl, affMult(it), excl, maxAnc(it), it.slot)] };
  return { ok: true };
}
function rerollPick(it, c) {
  if (!it.rrPending) return;
  withOwnerHp(it, () => { it.aff[it.rrPending.idx] = it.rrPending.opts[c]; });
  delete it.rrPending;
}
function extractLegend(id) {
  const i = SAVE.stash.findIndex(x => x.id === id); if (i < 0) return { err: "Chỉ trích xuất được truyền kỳ trong kho" };
  const it = SAVE.stash[i]; if (!it.legend) return { err: "Chỉ trang bị truyền kỳ mới có hiệu ứng để trích xuất" };
  if (SAVE.cube[it.legend]) return { err: "Trong hộp ma thuật đã có hiệu ứng này" };
  if (SAVE.mats < 10) return { err: "Cần 10 mảnh linh hồn" };
  SAVE.mats -= 10; returnGems(it); SAVE.stash.splice(i, 1); SAVE.cube[it.legend] = true; return { ok: true, lid: it.legend };
}
function setCube(cls, slot, lid) {
  const ch = SAVE.chars[cls], before = runMaxHpIf(cls);
  if (lid && !SAVE.cube[lid]) return;
  ch.cube = ch.cube.map((x, i) => i === slot ? (lid || null) : (x === lid ? null : x));
  fixRunHp(cls, before);
}
// ---------------- 专属兵器 ----------------
// 兵魄：幻境 20 层起，每局给一点（按时打完 2 颗，40 层起 3 颗；香烧完只给 1 颗）。WPN_COST 颗找张大锤指定打一把——20 到 39 层正好二十局一把
const WPN_BASE = 1.3, WPN_UP = 0.03, WPN_COST = 40, WPN_DROP = 0.01, WPN_LV = 20;
const wpnList = cls => LEGENDS.filter(l => l.w && l.cls === cls);
const bpGain = (N, inTime) => N < WPN_LV ? 0 : inTime ? 2 : 1;   // 按时 2 颗：40 颗一把 = 整 20 局，不随层数加快
const wpnIlvl = () => Math.max(30, Math.min(70, riftD(Math.max(WPN_LV, SAVE.riftMax || 0)).base + 2));
function forgeWeapon(cls, lid) {
  const L = LEGENDS.find(l => l.id === lid && l.w && l.cls === cls); if (!L) return { err: "Không đúc được món này" };
  if ((SAVE.bp || 0) < WPN_COST) return { err: "Không đủ Binh phách" };
  if (SAVE.stash.length >= stashMax()) return { err: "Kho đầy rồi, dọn bớt trước đã" };
  SAVE.bp -= WPN_COST; SAVE.flags.wpnForged = 1; const it = storeItem(null, makeItem({ ilvl: wpnIlvl(), rarity: 'legend', cls, legendId: lid })); return { ok: true, it };
}
// 专属兵器每强化 +1，特效再涨 WPN_UP
const wpnK = ch => { const W = ch && ch.eq && ch.eq.weapon, L = W && legendOf(W); return L && L.w ? 1 + WPN_UP * (W.plus || 0) : 1; };
// 流派推荐：一键照配。招式和变招按推荐来（没学会的跳过）；乾坤袋、灵玉匣只放手上已经有的
function applyBuild(cls, i) {
  const B = (BUILDS[cls] || [])[i]; if (!B) return null;
  const ch = SAVE.chars[cls], C = CLASSES[cls], before = runMaxHpIf(cls), r = { sk: 0, miss: 0, cube: 0, gems: 0 };
  const L = [];
  for (const [id, rn] of B.sk) { const k = C.skills.find(x => x.id === id); if (!k || k.lv > ch.level) { r.miss++; continue; } L.push(id); if (featureOn('runes') && rn) ch.runes[id] = rn; }
  ch.loadout = L.slice(0, LOADOUT_MAX); ch.loadoutManual = 1; ch.unequipped = {}; for (const k of C.skills) if (k.cd && !L.includes(k.id)) ch.unequipped[k.id] = 1;
  r.sk = L.length;
  if (featureOn('cube')) { const have = B.cube.filter(lid => SAVE.cube[lid]); if (have.length) { ch.cube = [0, 1, 2].map(j => have[j] || null); r.cube = have.length; } }
  if (boxOpen()) { const have = B.gems.map(t => SAVE.lgems.find(g => g.t === t)).filter(Boolean); if (have.length) { ch.lgs = [0, 1, 2].map(j => have[j] ? have[j].id : null); r.gems = have.length; } }
  ch.bld = i; fixRunHp(cls, before); return r;
}
const gemKey = (t, tier) => t + '_' + tier;
function gemName(key) {
  if (key.startsWith('L:')) { const g = SAVE.lgems.find(x => x.id === key.slice(2)); return g ? `${LGEMS[g.t].n} (cấp ${g.lv})` : "Ngọc truyền kỳ"; }
  const [t, tier] = key.split('_'); return joinName(GEM_TIERS[+tier], GEM_TYPES[t].n);
}
function gemDesc(key) {
  if (key.startsWith('L:')) { const g = SAVE.lgems.find(x => x.id === key.slice(2)); return g ? LGEMS[g.t].d(g.lv) : ''; }
  const [t, tier] = key.split('_'); const G = GEM_TYPES[t]; return `+${G.v[+tier]}${PCT_STATS.has(G.st) ? '%' : ''} ${STAT_NAMES[G.st]}`;
}
const gemColor = key => key.startsWith('L:') ? (LGEMS[(SAVE.lgems.find(x => x.id === key.slice(2)) || {}).t] || { c: '#fff' }).c : GEM_TYPES[key.split('_')[0]].c;
function addGem(key, n = 1) { SAVE.gems[key] = (SAVE.gems[key] || 0) + n; }
// 剧情里玉石还没开放：捡到的先悄悄攒着，不在战利品里显示，通关后一起拿出来
function dropGem(res, key) { if (featureOn('gems')) res.gems.push(key); else addGem(key); }
function socketGem(it, key) {
  if (!SAVE.gems[key]) return { err: "Không có viên ngọc này" };
  if ((it.gems || []).length >= (it.sockets || 0)) return { err: "Không có lỗ trống" };
  withOwnerHp(it, () => { it.gems.push(key); });
  if (--SAVE.gems[key] <= 0) delete SAVE.gems[key];
  return { ok: true };
}
const lgemHost = gid => { for (const it of allItems()) if ((it.gems || []).includes('L:' + gid)) return it; return null; };
function allItems() { const a = [...SAVE.stash]; for (const c of CLASS_IDS) for (const sl in SAVE.chars[c].eq) if (SAVE.chars[c].eq[sl]) a.push(SAVE.chars[c].eq[sl]); return a; }
// 灵玉现在镶在灵玉匣里：全账号共用，每个角色各自挑三颗（同一颗不能放两个孔）
function boxOf(cls) { const ch = SAVE.chars[cls]; if (!ch.lgs) ch.lgs = []; while (ch.lgs.length < BOX_SLOTS) ch.lgs.push(null); return ch.lgs; }
function boxSet(cls, i, gid) {
  if (!boxOpen()) return { err: "Phá đảo xong mới có Hộp Linh Ngọc" };
  const L = boxOf(cls); if (i < 0 || i >= BOX_SLOTS) return { err: "Không có lỗ này" };
  if (gid && !SAVE.lgems.some(g => g.id === gid)) return { err: "Không có viên linh ngọc này" };
  { const g = gid && SAVE.lgems.find(x => x.id === gid), G = g && LGEMS[g.t]; if (G && G.cls && G.cls !== cls) return { err: `Đây là linh ngọc bản mệnh của ${CLASSES[G.cls].n}, môn phái khác không dùng được` }; }
  const before = runMaxHpIf(cls), j = gid ? L.indexOf(gid) : -1;
  if (j >= 0 && j !== i) L[j] = L[i];   // 已经在别的孔里：两个孔对调
  L[i] = gid || null; fixRunHp(cls, before); return { ok: true };
}
function socketLgem() { return { err: "Linh ngọc giờ khảm trong Hộp Linh Ngọc" }; }
const unsocketCost = key => key.startsWith('L:') || bLv('jewel') >= 3 ? 0 : 30 * (+key.split('_')[1] + 1);
function unsocket(it, idx) {
  const key = it.gems[idx]; if (!key) return { err: "Chỗ này không có ngọc" };
  const c = unsocketCost(key); if (SAVE.gold < c) return { err: "Không đủ tiền vàng" };
  SAVE.gold -= c; withOwnerHp(it, () => { it.gems.splice(idx, 1); });
  if (!key.startsWith('L:')) addGem(key);
  return { ok: true };
}
const combineCost = key => Math.round(20 * Math.pow(+key.split('_')[1] + 1, 2) * (1 - bLv('jewel') * 0.2));
const combineMats = key => { const t = +key.split('_')[1]; return t >= 4 ? 5 * Math.pow(2, t - 4) : 0; };   // 合无瑕起要魂晶：5、10、20、40
function combineGem(key) {
  const [t, tier] = key.split('_');
  if (+tier >= GEM_TIERS.length - 1) return { err: "Đã đạt cấp cao nhất" };
  { const e = gemCapErr(+tier + 1); if (e) return { err: e }; }
  if ((SAVE.gems[key] || 0) < 3) return { err: "Cần 3 viên ngọc giống nhau" };
  const c = combineCost(key), m = combineMats(key); if (SAVE.gold < c) return { err: "Không đủ tiền vàng" }; if (SAVE.mats < m) return { err: `Không đủ hồn tinh (cần ${m})` };
  SAVE.gold -= c; SAVE.mats -= m; SAVE.gems[key] -= 3; if (!SAVE.gems[key]) delete SAVE.gems[key];
  const nk = gemKey(t, +tier + 1); addGem(nk); return { ok: true, key: nk };
}
// 一键合成（2026-11-24 用户要的）：每种玉从低档往高档，能合的全合上去；银两、魂晶不够就停在那一步
function combineAllPlan(apply) {
  const G0 = SAVE.gems, G = { ...G0 }; let gold = SAVE.gold, mats = SAVE.mats, n = 0, cost = 0, mcost = 0;
  const types = [...new Set(Object.keys(G).map(k => k.split('_')[0]))];
  for (let tier = 0; tier < GEM_TIERS.length - 1 && tier < gemCap(); tier++) for (const t of types) {
    const k = gemKey(t, tier), c = combineCost(k), m = combineMats(k);
    while ((G[k] || 0) >= 3 && gold >= c && mats >= m) { G[k] -= 3; const nk = gemKey(t, tier + 1); G[nk] = (G[nk] || 0) + 1; gold -= c; mats -= m; cost += c; mcost += m; n++; }
  }
  const got = {}; for (const k in G) if (G[k] > (G0[k] || 0)) got[k] = G[k] - (G0[k] || 0);   // 净多出来的（中间档合出来又合上去的不算）
  if (apply && n) { SAVE.gems = {}; for (const k in G) if (G[k] > 0) SAVE.gems[k] = G[k]; SAVE.gold = gold; SAVE.mats = mats; }
  return { n, cost, mcost, got };
}
// 镶着的玉石直接升一档：再拿两颗同色同档的（加上镶着的那颗就是三颗），花费和合成一样，不用先拆下来
function upgradeSocketed(it, idx) {
  const key = it && it.gems && it.gems[idx]; if (!key || key.startsWith('L:')) return { err: "Ở đây không có ngọc" };
  const [t, tier] = key.split('_'), nt = +tier + 1;
  if (nt >= GEM_TIERS.length) return { err: "Đã đạt cấp cao nhất" };
  { const e = gemCapErr(nt); if (e) return { err: e }; }
  if ((SAVE.gems[key] || 0) < 2) return { err: `Còn cần 2 viên ${gemName(key)} (trong tay có ${SAVE.gems[key] || 0} viên)` };
  const c = combineCost(key), m = combineMats(key); if (SAVE.gold < c) return { err: "Không đủ tiền vàng" }; if (SAVE.mats < m) return { err: `Không đủ hồn tinh (cần ${m})` };
  SAVE.gold -= c; SAVE.mats -= m; SAVE.gems[key] -= 2; if (!SAVE.gems[key]) delete SAVE.gems[key];
  withOwnerHp(it, () => { it.gems[idx] = gemKey(t, nt); });
  return { ok: true, key: it.gems[idx] };
}
function rollGem(run) {
  // 幻境层数越高掉得越好：30 层前照旧（最高到极品），30 层起每 30 层底子 +1 档；最高掉到无瑕（还要幻境最高层够 60）
  const N = run.mode === 'rift' ? run.riftLv || 1 : 0, d = run.mode === 'rift' && N >= 30 ? Math.min(5, 2 + Math.floor((N - 30) / 30)) : diffIdx(run);
  const top = Math.min(5, 4 + GEM_RIFT.filter(l => (SAVE.riftMax || 0) >= l).length);
  const tier = Math.max(0, Math.min(top, d + (run.floor >= 3 ? 1 : 0) + (RNG.ch(0.2) ? 1 : 0)));
  return gemKey(RNG.pick(Object.keys(GEM_TYPES)), tier);
}

// ---------------- 技能顺序与符文 ----------------
const LOADOUT_MAX = 5;
const SKILL_PRIO = { berserker: ['liedi', 'lieyan', 'whirl', 'bloodlust', 'bawang', 'hanren', 'warcry', 'butui'],
  mage: ['fireball', 'luoshi', 'jinguang', 'frostnova', 'chain', 'lunzhuan', 'meteor', 'wulei'],
  necro: ['summon', 'shidu', 'jihuo', 'corpse', 'bonestorm', 'yangshi', 'curse', 'tudun'],
  assassin: ['venom', 'deathmark', 'bingpo', 'shadowkill', 'dici', 'fan', 'shadowstep', 'yandun'],
  paladin: ['hammer', 'fuhu', 'aegis', 'ganlu', 'budong', 'judgement', 'prayer', 'chanhou'] };
// 已学会的主动技能里，按装配顺序取前 4 个；空位自动补上新学会的
function syncLoadout(cls) {
  const ch = SAVE.chars[cls], C = CLASSES[cls];
  const ok = id => C.skills.some(k => k.id === id && k.cd && k.lv <= ch.level);
  // 没手动换过技能的话，按推荐顺序自动带上最搭的几招
  if (!ch.loadoutManual && SKILL_PRIO[cls]) { const L0 = SKILL_PRIO[cls].filter(ok).slice(0, LOADOUT_MAX); for (const k of C.skills) if (L0.length < LOADOUT_MAX && k.cd && ok(k.id) && !L0.includes(k.id)) L0.push(k.id); ch.loadout = L0; return L0; }
  let L = (ch.loadout || []).filter(ok);
  for (const k of C.skills) if (L.length < LOADOUT_MAX && k.cd && k.lv <= ch.level && !L.includes(k.id) && !(ch.unequipped || {})[k.id]) L.push(k.id);
  ch.loadout = L; return L;
}
function skillList(cls) {
  const C = CLASSES[cls], L = syncLoadout(cls);
  return { act: L.map(id => C.skills.find(k => k.id === id)), basic: C.skills.find(k => !k.cd), all: C.skills.filter(k => k.cd) };
}
function equipSkill(cls, id) {
  const ch = SAVE.chars[cls], L = syncLoadout(cls); ch.unequipped = ch.unequipped || {}; ch.loadoutManual = 1;
  if (L.includes(id)) { ch.loadout = L.filter(x => x !== id); ch.unequipped[id] = 1; return 'off'; }
  if (L.length >= LOADOUT_MAX) return 'full';
  delete ch.unequipped[id]; ch.loadout = L.concat(id); return 'on';
}
function moveSkill(cls, id, dir) {
  const ch = SAVE.chars[cls], L = syncLoadout(cls).slice(), i = L.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= L.length) return;
  [L[i], L[j]] = [L[j], L[i]]; ch.loadout = L; ch.loadoutManual = 1;
}
function setRune(cls, id, r) { const rs = SAVE.chars[cls].runes; if (rs[id] === r) delete rs[id]; else rs[id] = r; }

// ---------------- 一局地下城（迷宫） ----------------
const MW = 5, MH = 6;
// 怪的全抗：原来 N×1.2、60 封顶，50 层起术法只剩 40%，而物理打在护甲上还剩 64%——道士凭空少三成多。改成跟着护甲的减伤走（30 层 24%、50 层 34%、69 层 43%）
// 50 层以后不再利滚利：每高一层，气血加 50 层时的 8%、攻击加 5%，妖物等级只涨 0.7 级（原来 1.4）。原来每 10 层气血翻一倍多，80 层的精英谁都打不动。
// 改后 80 层 ≈ 原来 67 层，100 层 ≈ 原来 73 层，原来 80 层的难度落在 125–130 层
const R_LIN = [50, 0.08, 0.05, 0.7];
const R_HI = [150, 0.10, 0.06];   // 2026-11-23 150 层以后每层涨得更快（用户：线性从 6 提到 10）：气血每层 +10%、攻击每层 +6%（都按 50 层的数值算），小怪、精英、妖王一样
// 150 层以后分段涨：每段 [从第几层起, 每层气血 +, 每层攻击 +]（都按 50 层的数值算），后一段接着前一段累加
// 2026-11-23 150 层起 10% / 6%；2026-11-24 用户定 300 层起 30% / 18%、400 层起 45% / 25%、500 层起 60% / 35%
const R_SEG = [[150, 0.10, 0.06], [300, 0.30, 0.18], [400, 0.45, 0.25], [500, 0.60, 0.35]];
const R_HI2 = R_SEG[1];   // 说明文字用
const rSegSum = (N, k) => { let v = 0; for (let i = 0; i < R_SEG.length; i++) { const a = R_SEG[i][0], b = i + 1 < R_SEG.length ? R_SEG[i + 1][0] : Infinity; if (N > a) v += R_SEG[i][k] * (Math.min(N, b) - a); } return v; };
const rLinHp = (N, a) => { const k = Math.max(0, N - R_LIN[0]); return 1 + a * Math.min(k, R_HI[0] - R_LIN[0]) + rSegSum(N, 1); };
const rLinAtk = (N, a) => { const k = Math.max(0, N - R_LIN[0]); return 1 + a * Math.min(k, R_HI[0] - R_LIN[0]) + rSegSum(N, 2); };
const rOldLv = N => 6 + Math.round(N * 1.4);   // 没改之前的妖物等级：幻境里的经验还按它算，免得层数高了经验反而少
function riftD(N) {
  const M = Math.min(N, R_LIN[0]), k = Math.max(0, N - R_LIN[0]), base = 6 + Math.round(M * 1.4) + Math.round(k * R_LIN[3]), ar = 4 + base * 3.5;
  return { n: "Bí cảnh · tầng " + N + " ", base, res: Math.round(Math.min(N * 1.2, 100 * ar / (490 + ar))),   // 全抗跟着这一层妖物护甲的减伤走（对 50 级的主角），术法和物理吃一样的亏
    hpMul: Math.pow(1.075, M) * rLinHp(N, R_LIN[1]), atkMul: Math.pow(1.055, M) * rLinAtk(N, R_LIN[2]), loot: Math.min(4, 0.5 + N / 15) };
}
const dOf = run => run.mode === 'rift' || run.mode === 'tower' ? riftD(run.riftLv) : DIFFS[run.diff];
const themeOf = run => run.mode === 'rift' || run.mode === 'tower' ? RIFT_THEMES[run.theme] : CHAPTERS[run.chapter - 1];
const diffIdx = run => run.mode === 'rift' || run.mode === 'tower' ? Math.min(2, Math.floor(run.riftLv / 15)) : DIFF_IDS.indexOf(run.diff);
const hasMod = (run, id) => (run.mods || []).includes(id);
const riftUnlocked = () => featureOn('rift');
function runStats(run) {
  if (run.mode === 'tower') return calcStats(run.cls, run.twCh.eq, run.twCh.level, run.buffs, run.twCh);
  const F = run.food && typeof FOODS !== 'undefined' && FOODS.find(f => f.id === run.food);
  if (F && F.st) { const b = { ...run.buffs }; for (const k in F.st) b[k] = (b[k] || 0) + F.st[k]; return charStats(run.cls, b); }
  return charStats(run.cls, run.buffs);
}
function cellLv(run, c) {
  if (c && c.lv != null) return c.lv;
  const M = run.maze, frac = (c ? c.dist : 0) / Math.max(1, M.maxDist);
  if (run.mode === 'rift') return dOf(run).base + Math.floor(frac * 3);
  return dOf(run).base + CHAPTERS[run.chapter - 1].base + (run.floor - 1) + Math.floor(frac * 2);
}
function curCell(run) { return run.world ? (run.encCell || (run.encCell = {})) : run.maze.cells[run.pos]; }
function isAway(cls) { return false; }

function newRun(cls, opts = {}) {
  const mode = opts.mode || 'story', mods = opts.mods || [];
  const run = { cls, mode, diff: opts.diff || 'normal', riftLv: opts.riftLv || 1, chapter: opts.chapter || 1, mods, floor: 1,
                potions: mods.includes('scarce') ? 0 : 3 + bLv('alchemist'), buffs: {}, loot: [], goldGot: 0, xpGot: 0, gemsGot: 0, matsGot: 0,
                kills: 0, t0: Date.now(), lvStart: SAVE.chars[cls].level, paraStart: SAVE.para.lv, hp: 0, ended: null, rooms: 0, xpMul: 1.5, prog: 0 };
  for (const id of mods) { const M = DUNGEON_MODS.find(x => x.id === id); if (!M) continue;
    if (M.mf) run.buffs.mf = (run.buffs.mf || 0) + M.mf; if (M.gf) run.buffs.gf = (run.buffs.gf || 0) + M.gf; if (M.xp) run.xpMul += M.xp / 100; }
  if (mode === 'rift') { run.theme = RNG.i(0, RIFT_THEMES.length - 1); run.xpMul += 0.25; run.ngoc = pgOr(0) && SAVE.ngocJoin ? 'fox' : null; }
  else { const C = CHAPTERS[run.chapter - 1]; run.ngoc = C.ngoc === 'normal' ? 'normal' : C.ngoc === 'fox' ? 'fox' : null; }
  if (!run.ngoc) run.comp = (SAVE.comps || {})[SAVE.comp] ? SAVE.comp : null;
  if (mode === 'rift' && pgOr(0)) { run.team = teamOf(); run.ngoc = null; run.comp = null; }
  genMaze(run);
  run.hp = runStats(run).maxHp;
  return run;
}
function genMaze(run) {
  const N = MW * MH, cells = [], rift = run.mode === 'rift';
  for (let i = 0; i < N; i++) cells.push({ i, x: i % MW, y: Math.floor(i / MW), links: [], type: 'empty', room: false, seen: false, visited: false, cleared: false, dist: -1 });
  const nb = c => [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => [c.x + dx, c.y + dy])
    .filter(([x, y]) => x >= 0 && y >= 0 && x < MW && y < MH).map(([x, y]) => cells[y * MW + x]);
  const link = (a, b) => { if (!a.links.includes(b.i)) { a.links.push(b.i); b.links.push(a.i); } };
  const target = rift ? 18 : RNG.i(16, 18);
  let rooms, start;
  for (let tries = 0; tries < 30; tries++) {
    cells.forEach(c => { c.links = []; c.room = false; });
    start = cells[(MH - 1) * MW + RNG.i(1, MW - 2)]; start.room = true;
    rooms = [start];
    // 生长树：多数时候从最新的房间往外长（形成长走廊），偶尔从旧房间分叉（形成岔路和死胡同）
    while (rooms.length < target) {
      const from = RNG.ch(0.62) ? rooms[rooms.length - 1] : RNG.pick(rooms);
      const opts = nb(from).filter(n => !n.room); if (!opts.length) { if (rooms.every(r => !nb(r).some(n => !n.room))) break; continue; }
      const up = opts.filter(n => n.y < from.y), n = up.length && RNG.ch(0.35) ? RNG.pick(up) : RNG.pick(opts);
      n.room = true; link(from, n); rooms.push(n);
    }
    if (rooms.length >= target && Math.min(...rooms.map(r => r.y)) <= 1) break;
  }
  // 少量环路
  for (let k = 0; k < 2; k++) { const c = RNG.pick(rooms), n = nb(c).find(n => n.room && !c.links.includes(n.i)); if (n && RNG.ch(0.6)) link(c, n); }
  const d = Array(N).fill(-1), par = Array(N).fill(-1), q = [start.i]; d[start.i] = 0;
  while (q.length) { const i = q.shift(); for (const j of cells[i].links) if (d[j] < 0) { d[j] = d[i] + 1; par[j] = i; q.push(j); } }
  rooms.forEach(c => { c.dist = d[c.i]; });
  const maxDist = Math.max(...rooms.map(c => c.dist));
  // 首领：最远处的死胡同优先
  const far = rooms.filter(c => c !== start && c.dist >= maxDist - 1).sort((a, b) => (a.links.length - b.links.length) || b.dist - a.dist || a.y - b.y);
  const boss = far[0];
  // 首领房间只留一个入口，避免绕路
  if (boss.links.length > 1) { const keep = boss.links.reduce((a, b) => d[a] <= d[b] ? a : b); for (const j of boss.links.slice()) if (j !== keep) { boss.links = boss.links.filter(x => x !== j); cells[j].links = cells[j].links.filter(x => x !== boss.i); } }
  // 删掉入口后，确认其他房间都还连得上（不经过首领）
  const ok = new Set([start.i]), q2 = [start.i];
  while (q2.length) { const i = q2.shift(); for (const j of cells[i].links) if (j !== boss.i && !ok.has(j)) { ok.add(j); q2.push(j); } }
  for (const c of rooms) if (c !== boss && !ok.has(c.i)) { const n = nb(c).find(n => n.room && n !== boss && ok.has(n.i)); if (n) { link(c, n); ok.add(c.i); } }
  start.type = 'start'; boss.type = 'boss';
  let keyC = null;
  const free = () => rooms.filter(c => c.type === 'empty');
  if (!rift) {
    const onPath = new Set(); for (let i = boss.i; i >= 0; i = par[i]) onPath.add(i);
    let pool = free().filter(c => !onPath.has(c.i) && c.dist >= maxDist * 0.4);
    if (!pool.length) pool = free().filter(c => c.dist >= maxDist * 0.35);
    if (!pool.length) pool = free();
    const ends = pool.filter(c => c.links.length === 1);
    keyC = RNG.pick(ends.length ? ends : pool); keyC.type = 'keeper';
  }
  const take = (type, n, pref) => { for (let k = 0; k < n; k++) { const pool = RNG.shuffle((pref ? free().filter(pref) : []).concat()); const c = pool[0] || RNG.pick(free()); if (c) c.type = type; } };
  if (!rift) {
    const C = CHAPTERS[run.chapter - 1];
    if (run.floor === 2 && C.story) take('story', 1, c => c.dist >= maxDist * 0.3);
  }
  take('chest', 1, c => c.links.length === 1); take('rest', 1, c => c.dist >= maxDist * 0.4); take('event', 2);
  if (run.floor === 2 || rift) take('shop', 1);
  take('elite', 1 + (hasMod(run, 'elites') ? 2 : 0));
  if (RNG.ch(rift ? 0.4 : 0.3)) take('goblin', 1);
  take('gold', 1, c => c.links.length === 1);
  take('battle', rift ? 7 : 5);
  // 剩下的空房间：一半变成小战斗，一半留作通道
  for (const c of free()) if (RNG.ch(0.5)) c.type = 'battle';
  const F = themeOf(run);
  for (const c of rooms) if (c.type === 'battle' || c.type === 'elite' || c.type === 'keeper') c.mon = RNG.i(0, F.mons.length - 1);
  run.maze = { v: 2, cells, maxDist, start: start.i, boss: boss.i, key: keyC ? keyC.i : -1 };
  run.pos = start.i; run.hasKey = false;
  visit(run, start); start.cleared = true;
}
function visit(run, c) {
  if (!c.visited) { run.rooms++; track('room'); }
  c.visited = true; c.seen = true;
  for (const j of c.links) run.maze.cells[j].seen = true;
}
function pathTo(run, target) {
  const cells = run.maze.cells, t = cells[target]; if (!t || !t.seen) return null;
  const prev = { [run.pos]: -1 }, q = [run.pos];
  while (q.length) {
    const i = q.shift(); if (i === target) break;
    for (const j of cells[i].links) {
      if (j in prev) continue;
      if (!cells[j].visited && j !== target) continue;
      prev[j] = i; q.push(j);
    }
  }
  if (!(target in prev)) return null;
  const path = []; for (let i = target; i !== -1; i = prev[i]) path.unshift(i);
  return path;
}
function bossLocked(run) {
  if (run.mode !== 'rift') return !run.hasKey;
  if (run.prog >= 100) return false;
  // 所有能打的房间都清空了就直接放行，避免差一点点卡住
  return run.maze.cells.some(c => !c.cleared && ['battle', 'elite', 'goblin'].includes(c.type));
}
function moveTo(run, target) {
  const c = run.maze.cells[target];
  if (c.type === 'boss' && !c.cleared && bossLocked(run))
    return { err: run.mode === 'rift' ? `Thủ hộ bí cảnh chưa xuất hiện: tiếp tục diệt quái để lấp đầy tiến độ (hiện tại ${Math.floor(run.prog)}%)` : "Cửa thủ lĩnh bị phong ấn. Hãy tìm hộ vệ chìa khóa, cướp lấy chìa khóa trước." };
  const path = pathTo(run, target); if (!path) return { err: "Không qua được" };
  run.pos = target; const fresh = !c.visited; visit(run, c);
  if (run.mode === 'rift' && !run.riftDone) run.clock = (run.clock || 0) + RIFT_CLOCK.room * Math.max(1, path.length - 1);
  return { cell: c, fresh, steps: path.length - 1 };
}
function clearCell(run) { const c = curCell(run); c.cleared = true; }
function nextFloor(run) { run.floor++; genMaze(run); run.floorNew = true; EV.heal(run, 0.5); run.potions += hasMod(run, 'scarce') ? 0 : 1; }
function endRun(run, outcome) {
  run.ended = outcome; run.t1 = Date.now();
  if (run.mode === 'rift' && run.world && SAVE.world) delete SAVE.world[RCH];   // 幻境的地图只管这一局
  SAVE.stats.runs++;
  if (outcome === 'win') {
    SAVE.stats.wins++;
    if (run.mode === 'story') {
      const secs = Math.round((run.t1 - run.t0) / 1000), key = run.diff + '-' + run.chapter;
      const b = SAVE.best[key];
      if (!b || secs < b.t) { SAVE.best[key] = { t: secs, cls: run.cls, lv: SAVE.chars[run.cls].level }; run.record = !!b; }
    }
  }
  run.ach = checkAch();
  SAVE.run = null;
}
function openChest(run, q) {
  run.evItems = []; if (run.world) EV.loot(run, q || 'chest'); else { EV.loot(run, 'elite'); if (RNG.ch(0.5)) EV.loot(run, 'normal'); }
  const gems = RNG.ch(0.4) && featureOn('gems') ? [EV.gem(run)] : [];
  track('chest');
  return { items: run.evItems, gold: EV.gold(run, 5), gems };
}
function enterShop(run) {
  const c = curCell(run);
  if (!c.shop) {
    const lv = cellLv(run, c) + 1, s = runStats(run);
    c.shop = { items: Array.from({ length: 4 + bLv('merchant') }, () => { const it = makeItem({ ilvl: lv, rarity: rollRarity('elite', s.mf, dOf(run).loot), cls: run.cls }); return { it, price: Math.round(sellPrice(it) * 4 / (1 + bLv('merchant') * 0.1)), sold: false }; }),
               potion: hasMod(run, 'scarce') ? 0 : 15 + lv * 3, gem: { key: rollGem(run), price: 60 + lv * 6, sold: false } };
  }
  return c.shop;
}
// ---------------- 剧情 ----------------
function storyRoomData(run) { return CHAPTERS[run.chapter - 1].story; }
function applyStoryReward(run, rw) {
  const got = [];
  if (!rw) return got;
  if (rw.gold) got.push(`Bạc +${EV.gold(run, rw.gold * 3)}`);
  if (rw.potion) { run.potions += rw.potion; got.push(`Đan dược +${rw.potion}`); }
  if (rw.gem) { if (featureOn('gems')) got.push(`Nhận ${EV.gem(run)}`); else { addGem(rollGem(run)); got.push(`Nhận ${EV.gold(run, 3)} lượng`); } }
  if (rw.mats) got.push(`Hồn tinh +${EV.mats(run, rw.mats)}`);
  if (rw.heal) { EV.heal(run, rw.heal); got.push(rw.heal >= 1 ? "Khí huyết đầy" : `Hồi ${Math.round(rw.heal * 100)}% khí huyết`); }
  if (rw.ngoc) { run.ngoc = rw.ngoc; got.push("Ngoc gia nhập trận đấu"); }
  return got;
}
function collectPage(run) { SAVE.story.pages[run.chapter] = true; return CHAPTERS[run.chapter - 1].page; }
function chapterUnlocked(diff, ch) { if (diff !== 'normal' && !SAVE.unlocked[diff]) return false; return ch <= storyCleared(diff) + 1; }
function storyComplete(run) {
  const ch = run.chapter, di = DIFF_IDS.indexOf(run.diff), first = storyCleared(run.diff) < ch;
  const res = { first, chapter: ch, items: [], gold: 0, mats: 0, unlock: '' };
  if (first) {
    SAVE.story.cleared[run.diff] = ch;
    res.gold = Math.round(150 * ch * (1 + di)); res.mats = 5 * ch;
    SAVE.gold += res.gold; SAVE.mats += res.mats; run.goldGot += res.gold; run.matsGot += res.mats;
    res.items.push(storeItem(run, makeItem({ ilvl: run.world ? chIlvl(run.chapter, 99) : cellLv(run, curCell(run)) + 2, rarity: rollRarity('cache', 50, di), cls: run.cls })));
    if (run.diff === 'normal') {
      res.unlock = CHAPTERS[ch - 1].unlock || '';
      if (ch === 10) { SAVE.story.ended = true; SAVE.unlocked.nightmare = true; res.ending = true; }
    }
    if (run.diff === 'nightmare' && ch === 10) SAVE.unlocked.hell = true;
  }
  track('clear');
  run.storyDone = res;
  return res;
}
// ---------------- 试玩角色：直接从某一章开始（测试用） ----------------
// 等级、装备、心法、同伴、前几章的道具和美食，都按「正常玩到这一章」准备
const TEST_BACKUP_KEY = 'jiuyou-save-backup';
const testLevel = (ch, inter) => inter ? CH_BAND[Math.min(10, ch)][1] + 1 : ch <= 1 ? 1 : ch === 2 ? 8 : CH_BAND[Math.min(10, ch)][0] + 1;
// inter：直接从这一章结尾的幕间开始（前面的主线当作已经做完）
function makeTestSave(cls, ch, inter) {
  const prev = SAVE, s = newSave(); SAVE = s;
  try {
    s.test = { ch, cls, inter: !!inter }; s.cls = cls; s.chapter = ch; s.diff = 'normal';
    s.story.cleared.normal = ch - 1; s.story.seen.prologue = 1;
    for (let i = 1; i < ch; i++) s.story.seen['i' + i] = 1;
    const C = s.chars[cls], L = testLevel(ch, inter); C.level = L; C.xp = 0;
    if (ch > 1) {
      SLOT_IDS.forEach((sl, i) => { const it = makeItem({ ilvl: L, rarity: i < 2 ? 'rare' : 'magic', slot: sl, cls }); s.stash.push(it); equipItem(cls, it.id); });
      s.stash = s.stash.filter(it => it.rarity !== 'normal');
    }
    for (let g = 0; g < 60; g++) { let ok = false;
      for (const B of talentBranches(cls)) for (let ti = 0; ti < B.t.length; ti++) if (!ok && canLearn(cls, B.id, ti)) { learnTalent(cls, B.id, ti); ok = true; }
      if (!ok) break; }
    syncLoadout(cls);
    s.gold = 220 * (ch - 1); s.mats = 6 * (ch - 1);
    s.comps = ch >= 3 ? { ngoc: 1, zhen: 1, long: 1 } : { ngoc: 1 }; s.comp = 'ngoc';
    s.wflags = {}; for (let i = 1; i < ch; i++) s.wflags['dish' + i] = 1; if (ch >= 4) s.wflags.foodbook = 1;
    s.keys = {};
    if (typeof WQ !== 'undefined') for (let c = 2; c < ch; c++) { const Q = WQ[c]; if (!Q) continue;
      for (const m of Q.main) if (m.rw && m.rw.key) s.keys[m.rw.key] = 1;
      for (const q of Q.side) if (q.rw && q.rw.key) s.keys[q.rw.key] = 1; }
    if (ch >= 3) s.keys.wolftooth = 1;
    s.aff = { ngoc: Math.min(10, ch + 1), zhen: Math.min(10, ch - 1), kang: Math.min(10, ch - 1), long: Math.max(0, ch - 2), liu: Math.max(0, ch - 2) };
    if (inter && typeof WQ !== 'undefined' && WQ[ch]) {
      const M = WQ[ch].main, idx = M.findIndex(m => /^i/.test(m.id));
      if (idx > 0) {
        s.run = newWorldRun(cls, ch); const S = wstate(ch); let tele = null;
        for (let i = 0; i < idx; i++) { const m = M[i]; if (m.set) Object.assign(S.flags, m.set); if (m.tele) tele = m.tele;
          if (m.rw && m.rw.flag) s.wflags[m.rw.flag] = 1; if (m.rw && m.rw.key) s.keys[m.rw.key] = 1; if (m.comp) s.comps[m.comp] = 1; }
        for (const q of WQ[ch].side) if (q.rw && q.rw.key) s.keys[q.rw.key] = 1;
        S.main = idx; S.kc = 0;
        if (tele) { wEnter(ch, tele[0], tele[1]); if (tele[2]) { S.camp = tele[2]; S.camps = [tele[2]]; } }
        else wEnter(ch, WMAPS[ch].start, WMAPS[ch].startPt);
        s.run = null;
      }
    }
  } finally { SAVE = prev; }
  return s;
}
// 秘境完成
function riftGrade(run) { const tl = Math.max(0, 1 - (run.clock || 0) / riftLimit(run.riftLv)); return { tl, G: tl > 0 ? RIFT_GRADES.find(g => g.min >= 0 && tl >= g.min) : RIFT_GRADES[RIFT_GRADES.length - 1] }; }
function riftComplete(run) {
  SAVE.gbN = 0;   // 打完一局幻境：赌石回到底价
  const N = run.riftLv, { tl, G } = riftGrade(run);
  run.timeLeft = tl; run.grade = G.n; run.jump = G.jump;
  run.capBefore = SAVE.riftCap;
  const open0 = new Set(eqSlots());
  if (tl > 0) {
    SAVE.riftMax = Math.max(SAVE.riftMax, N); SAVE.rift[run.cls] = Math.max(SAVE.rift[run.cls] || 0, N);
    SAVE.riftCap = Math.max(SAVE.riftCap || 3, N + G.jump);
    const R = SAVE.riftRec[run.cls], used = Math.round((run.clock || 0) / (run.world ? 1000 : 100));   // 新幻境记秒（s）；旧纪录记的是回合（t），同层数时让新的顶掉
    if (run.world) { if (!R || N > R.lv || (N === R.lv && (R.s == null || used < R.s))) { SAVE.riftRec[run.cls] = { lv: N, s: used, d: today() }; run.record = true; } }
    else if (!R || N > R.lv || (N === R.lv && used < R.t)) { SAVE.riftRec[run.cls] = { lv: N, t: used, d: today() }; run.record = true; }
  }
  run.bp = bpGain(N, tl > 0); if (run.bp) SAVE.bp = (SAVE.bp || 0) + run.bp;
  run.newSlots = eqSlots().filter(p => !open0.has(p));   // 这一局打开的新装备位
  SAVE.stats.rifts++; track('rift');
  const owned = new Set(SAVE.lgems.map(g => g.t)), un = Object.keys(LGEMS).filter(t => !owned.has(t) && !LGEMS[t].hide), mine = un.find(t => LGEMS[t].cls === run.cls);   // 本门的本命玉还没有：优先给它
  let newGem = null;
  if (un.length && (SAVE.lgems.length === 0 || RNG.ch(0.55))) { newGem = { id: uid(), t: mine || RNG.pick(un), lv: 0 }; SAVE.lgems.push(newGem); }
  run.upg = G.upg; run.riftDone = true; run.newGem = newGem;
  lgemUpToPara(run);
}
// 幻境里倒下不算输：被吐回入口，香烧掉一截（倒得越多烧得越多）
function riftRevive(run) {
  run.deaths = (run.deaths || 0) + 1;
  const pen = Math.round(riftLimit(run.riftLv) * Math.min(0.15, 0.05 + 0.03 * (run.deaths - 1)));
  run.clock = (run.clock || 0) + pen; run.hp = runStats(run).maxHp;
  if (run.world) { const S = wstate(RCH), e = wmap(RCH).pts['1'][0]; S.pos = { x: e.x, y: e.y }; wReveal(RCH); wUnstackMons(RCH); } else run.pos = run.maze.start;
  return pen;
}
function lgemChance(g, N) { if (g.lv >= LGEM_CAP) return 0; const d = N - g.lv; return d >= 10 ? 1 : d >= 0 ? 0.6 + d * 0.04 : Math.max(0.05, 0.6 + d * 0.1); }
const lgemMaxed = () => SAVE.lgems.length > 0 && SAVE.lgems.every(g => g.lv >= LGEM_CAP);
// 灵玉都满 150 级以后：这一局的升级次数换成修为经验，每次约半级修为
function lgemUpToPara(run) {
  if (!run || !run.upg || !lgemMaxed()) return 0;
  let x = 0; for (let i = 0; i < run.upg; i++) x += Math.round(paraNeed(SAVE.para.lv + i) / 2);
  const L0 = SAVE.para.lv; SAVE.para.xp += x; while (SAVE.para.xp >= paraNeed(SAVE.para.lv)) { SAVE.para.xp -= paraNeed(SAVE.para.lv); SAVE.para.lv++; }
  run.upgPara = { n: run.upg, x, lv: SAVE.para.lv - L0 }; run.upg = 0; return x;
}
function upgradeLgem(run, gid) {
  if (!run || !run.upg) return null;
  const g = SAVE.lgems.find(x => x.id === gid); if (!g) return null;
  if (g.lv >= LGEM_CAP) return null;
  run.upg--; const ok = RNG.ch(lgemChance(g, run.riftLv)); if (ok) withOwnerHpGem(gid, () => { g.lv++; });
  return ok;
}
function withOwnerHpGem(gid, fn) { const r = SAVE.run, c = r && (SAVE.chars[r.cls].lgs || []).includes(gid) ? r.cls : null, b = c ? runMaxHpIf(c) : 0; fn(); if (c) fixRunHp(c, b); }

// ---------------- 每日悬赏 ----------------
function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function ensureBounties() {
  if (!SAVE) return;
  if (SAVE.bounty && SAVE.bounty.day === today()) return;
  const pool = RNG.shuffle(BOUNTY_POOL.filter(b => !b.rift || riftUnlocked())).slice(0, 3);
  SAVE.bounty = { day: today(), bonus: false, list: pool.map(b => { const need = RNG.i(b.n[0], b.n[1]); return { id: b.id, ev: b.ev, t: b.t(need), need, prog: 0, claimed: false }; }) };
}
function track(ev, n = 1) {
  if (!SAVE) return; ensureBounties();
  for (const b of SAVE.bounty.list) if (b.ev === ev && b.prog < b.need) b.prog = Math.min(b.need, b.prog + n);
}
function bountyReward(quality) {
  const lv = topLevel(), it = storeItem(null, makeItem({ ilvl: lv + 2, rarity: rollRarity(quality, 50, 0), cls: SAVE.cls }));
  const gold = 100 + lv * 25, mats = 6 + Math.floor(lv / 5);
  SAVE.gold += gold; SAVE.mats += mats;
  const gem = RNG.ch(0.5) ? gemKey(RNG.pick(Object.keys(GEM_TYPES)), Math.min(4, gemCap(), Math.floor(lv / 15))) : null;
  if (gem) addGem(gem);
  return { gold, mats, items: [it], gem };
}
function claimBounty(i) {
  const b = SAVE.bounty.list[i]; if (!b || b.claimed || b.prog < b.need) return null;
  b.claimed = true; SAVE.stats.bounties++; return bountyReward('boss');
}
function claimBountyBonus() {
  const B = SAVE.bounty; if (!B || B.bonus || !B.list.every(b => b.claimed)) return null;
  B.bonus = true; return bountyReward('cache');
}

// ---------------- 离线派遣 ----------------
const dispSlots = () => 1 + bLv('barracks');
const dispUsed = () => Object.keys(SAVE.disp).length;
function canDispatch(cls) { return !SAVE.disp[cls] && !(SAVE.run && SAVE.run.cls === cls) && dispUsed() < dispSlots(); }
function startDispatch(cls, h) { if (!canDispatch(cls)) return false; const now = Date.now(); SAVE.disp[cls] = { start: now, end: now + h * 3600e3, h }; return true; }
function cancelDispatch(cls) { delete SAVE.disp[cls]; }
function claimDispatch(cls) {
  const D = SAVE.disp[cls]; if (!D || Date.now() < D.end) return null;
  delete SAVE.disp[cls];
  const lv = SAVE.chars[cls].level, h = D.h, mult = 1 + bLv('barracks') * 0.2;
  const xp = Math.round(xpNeed(Math.min(lv, MAX_LV - 1)) * 0.07 * h * mult);
  const gold = Math.round((15 + lv * 4) * h * 8 * mult), mats = Math.round(h * 2 * mult);
  const ups = gainXp(cls, xp); SAVE.gold += gold; SAVE.mats += mats;
  const items = []; for (let i = 0; i < Math.floor(h * 1.2 * mult) + 1; i++) items.push(storeItem(null, makeItem({ ilvl: lv, rarity: rollRarity(h >= 4 ? 'elite' : 'normal', 30, 0), cls })));
  const gems = []; for (let i = 0; i < h; i++) if (RNG.ch(0.15)) { const k = gemKey(RNG.pick(Object.keys(GEM_TYPES)), Math.min(4, gemCap(), Math.floor(lv / 15))); addGem(k); gems.push(k); }
  return { xp, gold, mats, items, gems, ups };
}

// 事件用的工具
const EV = {
  buff(r, k, v) { r.buffs[k] = (r.buffs[k] || 0) + v; const m = runStats(r).maxHp; if (r.hp > m) r.hp = m; },
  hurt(r, p) { r.hp = Math.max(1, Math.round(r.hp - runStats(r).maxHp * p)); },
  heal(r, p) { const m = runStats(r).maxHp; r.hp = Math.min(m, Math.round(r.hp + m * p)); },
  gold(r, mult) { const g = Math.round((10 + cellLv(r, curCell(r)) * mult) * RNG.f(0.8, 1.3) * (1 + (r.buffs.gf || 0) / 100)); SAVE.gold += g; r.goldGot += g; return g; },
  loot(r, q, slot) {
    const s = runStats(r), lv = cellLv(r, curCell(r)) + 1;
    const it = makeItem({ slot, ilvl: lv, rarity: rollRarity(q, s.mf, dOf(r).loot), cls: r.cls });
    storeItem(r, it); (r.evItems = r.evItems || []).push(it);
    return `“${ancName(it)}${it.name}”`;
  },
  xp(r, frac) { const x = Math.round(xpNeed(Math.min(SAVE.chars[r.cls].level, MAX_LV - 1)) * frac); gainXp(r.cls, x); r.xpGot += x; return x; },
  bet(r) { return 30 * r.floor * (1 + diffIdx(r) * 2); },
  save() { return SAVE; },
  gem(r) { const k = rollGem(r); addGem(k); r.gemsGot++; return gemName(k); },
  mats(r, n) { n = n + RNG.i(0, 2); SAVE.mats += n; r.matsGot += n; return n; },
  forge(r) {
    const w = SAVE.chars[r.cls].eq.weapon;
    if ((w.plus || 0) >= ENHANCE_MAX) return { msg: "Vũ khí của bạn đã cường hóa đến giới hạn." };
    if (RNG.ch(0.5)) { withOwnerHp(w, () => { w.plus = (w.plus || 0) + 1; }); if (w.plus >= 10) SAVE.flags.plus10 = true; return { msg: `Tia lửa văng tung tóe! ${w.name} cường hóa lên +${w.plus}.` }; }
    return { msg: "Cái đe nứt ra, chẳng có chuyện gì xảy ra." };
  },
};
function resolveEvent(run, evId, ci) {
  run.evItems = [];
  const ev = EVENTS.find(e => e.id === evId), c = ev.c[ci];
  if (c.req && !c.req(run, EV)) return { msg: "Không đủ điều kiện." };
  const res = c.go(run, EV) || {};
  if (res.reward) run.pendingReward = res.reward;
  track('event');
  res.items = run.evItems; return res;
}

// ---------------- 怪物 ----------------
let W_TUNE = [null, [.95, 1.18, 1, 1, 1, 1], [.91, 1.10, 1, 1, .9, 1.10], [.89, 1.11, .97, 1, .87, 1.10], [.89, 1.10, .94, 1, .83, 1.10], [.78, 1.07, 1.04, 1, .81, 1.10],
              [.84, 1.05, .94, 1, .82, 1.10], [.78, 1.05, .98, 1, .78, 1.10], [.83, 1.05, .9, .97, .60, 1.10], [.76, 1.08, .96, .95, .64, 1.10], [.78, 1.08, .9, .98, .60, 1.10]];
let W_BOSS_UP = { 6: [1.18, 1.17], 7: [1.3, 1.14] };   // 第六、七章守关原来几乎没跟着涨（第五章 5.0 万血 → 第七章 5.5 万 → 第八章 10 万），补上
const lvTune = lv => [1 - 0.2 * Math.max(0, Math.min(1, ((lv || 1) - 9) / 12)), 1.03];   // 幻境等不分章节的地方：按等级粗调（9 级以下不动，21 级起气血 ×0.8）
function makeMonster(def, lv, run, kind, affs) {
  const D = dOf(run);
  let hp = (25 + lv * 11.5) * (def.hp || 1) * D.hpMul * 1.25;
  let atk = (4 + lv * 1.85) * (def.atk || 1) * D.atkMul;
  let armor = 4 + lv * 3.5;
  if (kind === 'elite') { hp *= 2.4; atk *= 1.3; }
  if (kind === 'boss') { hp *= 6.5; atk *= 1.45; }
  if (kind === 'mini') { hp *= 0.35; atk *= 0.6; }
  if (run.mode === 'story') { const k = run.chapter - 1; if (run.world) { hp *= 1 + Math.min(k, 1) * 0.35 + k * 0.04; atk *= 1 + Math.min(k, 1) * 0.22 + k * 0.025; } else { hp *= 1 + k * 0.38; atk *= 1 + k * 0.27; } }   // 大地图的等级已经按章节涨了，不再重复乘
  // 词条重做之后，主角的百分比加成不再越滚越大，妖物跟着调：W_TUNE[章] = [气血, 攻击, 首领气血再乘, 首领攻击再乘, 打主角的术法伤害, 精英攻击再乘]，对着「每格一件同级宝品」的普通装备，把胜率调回改之前
  if (run.mode === 'story' && run.world) { const T = W_TUNE[run.chapter] || [1, 1, 1, 1]; hp *= T[0]; atk *= T[1]; if (kind === 'elite') atk *= T[5] || 1; if (kind === 'boss') { hp *= T[2] || 1; atk *= T[3] || 1; const U = W_BOSS_UP[run.chapter]; if (U) { hp *= U[0]; atk *= U[1]; } } }
  else { const f = lvTune(lv); hp *= f[0]; atk *= f[1]; }
  if (hasMod(run, 'hardy')) hp *= 1.5;
  if (hasMod(run, 'brutal')) atk *= 1.3;
  if (hasMod(run, 'armored')) armor *= 1.6;
  affs = affs || [];
  if (affs.includes('tough')) hp *= 1.8;
  const u = { id: uid(), side: 'e', kind, name: def.n, lv, atk, armor, res: Math.min(75, D.res + (def.res || 0)),
              spd: 90 * (def.spd || 1) * (affs.includes('fast') ? 1.5 : 1), crit: 5, critDmg: 150, ae: def.elem || 'phys',
              aff: affs, abs: def.abs, halfDef: def.half, dieSay: def.die, g: RNG.f(0, 40), st: {}, def, spr: def.spr, pal: def.pal };
  u.maxHp = u.hp = Math.round(hp);
  if (affs.includes('shielded')) u.shield = Math.round(u.maxHp * 0.3);
  u.wx = def.wx || MON_WX[def.spr] || null;
  u.trait = def.trait !== undefined ? def.trait : (kind === 'boss' ? null : MON_TRAIT[def.spr] || null);
  if (u.trait === 'shield') u.shield = Math.max(u.shield || 0, Math.round(u.maxHp * 0.25));
  return u;
}
// 地图上一只精英的词缀：第一次看见它的时候摇好，存在它身上，进战斗照用
const R_AFF_HI = [150, 250];   // 高层精英：150 层起多一个词缀，250 层起再多一个（小怪不带词缀：用户定）
function eliteAffsOf(run, mn) {
  if (mn.affs) return mn.affs;
  const rift = run.mode === 'rift';
  if (!rift && mn.rr == null) mn.rr = RNG.ch(0.15) ? 1 : 0;
  const n = (rift ? 1 + (run.riftLv >= 20 ? 1 : 0) + (run.riftLv >= R_AFF_HI[0] ? 1 : 0) + (run.riftLv >= R_AFF_HI[1] ? 1 : 0) :   /* 原来 45 层起再加一个（三个词缀）：高层精英叠三个词缀是打不过的主因之一，收回两个；稀有精英仍然多一个 */ 1 + diffIdx(run) + (run.world ? W_EAFF : 0)) + (mn.rare || mn.rr ? 1 : 0);
  mn.affs = RNG.shuffle(ELITE_AFFIXES.map(a => a.id)).slice(0, n); return mn.affs;
}
function makeEncounter(run, kind, cell) {
  const lv = cellLv(run, cell), F = themeOf(run), out = [];
  const mainDef = cell && cell.mon != null ? F.mons[cell.mon] : RNG.pick(F.mons);
  const nAffBase = run.mode === 'rift' ? 1 + (run.riftLv >= 20 ? 1 : 0) + (run.riftLv >= 45 ? 1 : 0) : 1 + diffIdx(run) + (run.world ? W_EAFF : 0);   // 大地图可以多给词缀（W_EAFF，默认 0）。幻境：精英词缀最多 3 条（稀有精英 +1），推层看的是本事，不是运气
  if (kind === 'goblin') {
    const g = makeMonster(GOBLIN, lv, run, 'goblin'); g.atk = 0; out.push(g);
  } else if (kind === 'boss' && run.mode === 'story' && run.floor < 3) {
    const g = F.guards[run.floor - 1], gd = { ...F.mons[g.m], n: g.n };
    const u = makeMonster(gd, lv + 2, run, 'boss'); u.guard = true;
    u.maxHp = u.hp = Math.round(u.hp * 0.55); u.atk *= 0.9;
    if (run.chapter === 1) { u.maxHp = u.hp = Math.round(u.hp * 0.7); u.atk *= 0.85; }
    out.push(u);
  } else if (kind === 'boss') {
    const twin = F.boss.twin;
    const boss = makeMonster(F.boss, lv + 2, run, 'boss');
    if (run.mode === 'rift') { boss.name = "Giữ Ải Ảo Cảnh ·" + F.boss.n; boss.maxHp = boss.hp = Math.round(boss.hp * 1.15); }
    else { boss.maxHp = boss.hp = Math.round(boss.hp * BOSS_HP); boss.atk *= BOSS_ATK; }
    if (run.mode === 'story' && run.chapter === 1 && run.diff === 'normal' && !run.world) { boss.maxHp = boss.hp = Math.round(boss.hp * 0.7); boss.atk *= 0.85; }
    out.push(boss);
    if (twin) {
      const t = makeMonster({ ...twin, hp: F.boss.hp, atk: F.boss.atk, abs: F.boss.twinAbs, half: F.boss.twinHalf, die: F.boss.die }, lv + 2, run, 'boss');
      if (run.mode === 'rift') t.name = "Giữ Ải Ảo Cảnh ·" + twin.n;
      t.maxHp = t.hp = boss.maxHp; out.push(t);
    }
  } else if (kind === 'elite' || kind === 'keeper') {
    const pre = cell && cell.affs && kind === 'elite';   // 大地图上的精英：词缀在地图上就定好了（看得见才好备战），这里照用
    const rare = kind === 'elite' && (pre ? !!cell.rare : RNG.ch(0.15));
    const affs = pre ? cell.affs.slice() : RNG.shuffle(ELITE_AFFIXES.map(a => a.id)).slice(0, nAffBase + (kind === 'keeper' || rare ? 1 : 0));
    const e = makeMonster(mainDef, lv + 1, run, 'elite', affs);
    e.name = kind === 'keeper' ? "Hộ vệ chìa khóa ·" + mainDef.n : rare ? RNG.pick(RARE_ELITE_NAMES) : joinName(RNG.pick(ELITE_TITLES), mainDef.n);
    if (rare) { e.rare = true; e.maxHp = e.hp = Math.round(e.hp * 1.3); }
    out.push(e);
    for (let i = RNG.i(0, 2); i > 0; i--) out.push(makeMonster(mainDef, lv, run, 'normal'));
  } else {
    let n = +RNG.w({ 1: 30, 2: 45, 3: 25 }); if (mainDef.pack) n = Math.min(4, n + 1);
    for (let i = 0; i < n; i++) out.push(makeMonster(i === 0 || RNG.ch(0.6) ? mainDef : RNG.pick(F.mons), lv, run, 'normal'));
  }
  return out;
}

// ---------------- 自动战斗 ----------------
let BOSS_HP = 2.9, BOSS_ATK = 1.3;
var W_EAFF = 1;   // 大地图精英额外词缀条数（2026-11：精英 2 条词缀，稀有 3 条）
var W_LVUP = [0.02, 0.02, 4];   // 比妖物高时：每级打出 +2%、挨打 -2%，最多 4 级（原来 +7% / -6%，最多 6 级）
function startBattle(run, kind) {
  const s = runStats(run), C = CLASSES[run.cls], ch = run.twCh || SAVE.chars[run.cls], lv = ch.level, cell = curCell(run), rnOn = !!run.twCh || featureOn('runes');
  const { act, basic } = run.twCh ? { act: ch.loadout.map(id => C.skills.find(k => k.id === id)).filter(Boolean), basic: C.skills.find(k => !k.cd) } : skillList(run.cls);   // 通天塔：用塔里的招式
  const skills = [...act.filter(k => k.lv <= lv), basic].map(k => ({ ...k, left: 0, wx: rnOn ? runeWx(k, (ch.runes || {})[k.id]) : k.wx }));   // 道士的变招可以改五行
  BK = hpK(lv);
  const P = { id: 'P', side: 'p', kind: 'hero', name: C.n, lv, cls: run.cls, spr: C.spr, hp: Math.min(run.hp, s.maxHp), maxHp: s.maxHp, atk: s.atk,
              armor: s.armorT, res: s.res, spd: 100 + s.spd, crit: s.crit, critDmg: s.critDmg, leech: s.leech, regen: s.regen,
              thorns: s.thorns, sust: s.sust || 0, dodge: s.dodge, dmgPct: s.dmgPct, elem: s.elem, freeze: s.freeze, poison: s.poison, frozenDmg: s.frozenDmg,
              minionCap: 3 + s.minion + (s.fx && s.fx.has('minionArmor') ? 1 : 0), minionPct: s.minionPct, healPct: s.healPct, sk: s.sk, runes: rnOn ? { ...ch.runes } : {},
              xBoss: s.xBoss, xExec: s.xExec, xBreak: s.xBreak,
              fury: 0, furyGain: s.furyGain || 0, lian: s.fx.has('cLianFloor') ? 2 : 0, lastWx: null, lianPct: s.lianPct || 0, ki: s.fx.has('cangfengBelt') ? 3 : 0, kiMax: 5 + (s.lgv && s.lgv.duopo != null ? 1 : 0) + (s.fx.has('deathMarkPlus') ? 1 : 0) + (s.fx.has('qiSha4') ? 2 : 0) + (s.fx.has('wQisha') ? 1 : 0), kiPct: s.kiPct || 0,
              wpK: wpnK(ch), sanN: s.sanN || 0, goldK: s.fx.has('gGold') ? Math.min(0.3, Math.floor((SAVE.gold || 0) / 1e5) * 0.03) : 0,
              gDr: s.gDr || 0, regenPct: s.regenPct || 0, allyPct: s.allyPct || 0, cdSkip: s.cdSkip || 0,
              xDouble: s.xDouble || 0, xRage: s.xRage || 0, xTen: s.xTen || 0, xDr: s.xDr || 0, xLast: s.xLast || 0, xHaste: s.xHaste || 0, hasteN: s.xHaste ? 2 : 0, xKill: s.xKill || 0, xCritNext: s.xCritNext || 0,
              lgv: s.lgv || {}, lowHpK: s.lowHpK || 0, thornK: (s.thornK || 0) + (s.fx.has('thornsPct') ? 60 : 0), ssN: 0,
              zhen: 0, thornDmg: s.thornDmg || 0, yi: yiOf(ch), fonu: 0, jy: s.jy || {}, ironPct: s.ironPct || 0, poisonPct: s.poisonPct || 0,
              fx: s.fx, g: s.fx.has('firstStrike') ? 100 : Math.min(95, s.xFirst || 0), st: {}, stacks: 0, frenzy: 0, mom: 0, shield: 0, skills, rage: run.rage != null ? Math.min(ULT.maxR, run.rage) : 25 };   // 2026-11-24 怒气跨场保留（同一趟里）
  const encU = run.encUnits; delete run.encUnits;
  const b = { kind, P, units: [P, ...(encU || makeEncounter(run, kind, cell))], corpses: 0, turn: 0, over: false, win: false,
              dead: [], extraLoot: 0, cheated: false, phoenix: false, run, goblinEscaped: false, ultAuto: true, castAuto: true, castReq: null, ultReq: false, ults: 0, reacts: 0 };
  if (run.encReinf) { b.reinf = run.encReinf; delete run.encReinf; }
  if (s.fx.has('startShield')) P.shield = Math.round(P.maxHp * 0.25);
  if (run.rbuff && run.rbuff.k === 'guard') P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * 0.4));
  if (run.cls === 'mage') P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * 0.35));   // 五行道士：护身符箓
  if (run.cls === 'assassin') P.g = Math.max(P.g, 30);   // 夜行刺客：先手
  if (s.fx.has('undeadAlly')) summonSkel(b, P);
  if (run.cls === 'necro' && !s.fx.has('duXing4')) summonSkel(b, P, P.runes.summon || null, P.minionCap || 3);   // 赶尸人：开战时僵尸已经按尸阵列好，不用先花几回合摇铃（五毒独行不带尸）
  if (P.yi.qingxu) { P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * (8 + P.yi.qingxu * 4) / 100)); (b.yiPops = b.yiPops || []).push(['P', "Đan Hỏa Hộ Thể", 'buff', 'qingxu']); }
  if (P.jy.xuanming) { P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * P.jy.xuanming / 100)); (b.yiPops = b.yiPops || []).push(['P', "Huyền Minh", 'buff']); }   // 九幽·玄冥
  if (run.encWard) {   // 守护战：一个不能打的人在念，念完就赢；他倒了就输
    const W = run.encWard; delete run.encWard;
    b.ward = { need: W.need, n: 0, lines: W.lines || [], say: W.say || {}, end: W.end || '', mons: W.mons, lv: W.lv, keep: W.keep || 3, name: W.name };
    b.units.push({ id: 'WD', side: 'p', kind: 'ward', name: W.name, lv, spr: W.spr, pal: W.pal, maxHp: Math.round(P.maxHp * (W.hp || 1)), hp: Math.round(P.maxHp * (W.hp || 1)),
      atk: 0, armor: P.armor * (W.arm || 1), res: P.res, spd: W.spd || 80, crit: 0, critDmg: 100, g: 10, st: {} });
  }
  const comp = !run.team && run.comp && run.comp !== 'ngoc' ? COMPANIONS[run.comp] : null;
  const afB = 1 + 0.04 * ((SAVE.aff || {})[run.comp || 'ngoc'] || 0);
  if (run.team) run.team.forEach((c, i) => b.units.push(makeAlly(b, P, c, i)));   // 幻境组队：一到三个伙伴
  else if (comp) b.units.push({ id: 'NG', side: 'p', kind: 'ally', comp: run.comp, name: comp.n, lv, spr: comp.spr, wx: comp.wx,
      maxHp: Math.round(P.maxHp * comp.hp * afB), hp: Math.round(P.maxHp * comp.hp * afB), atk: P.atk * comp.atk * afB, armor: P.armor * 0.8, res: P.res, spd: comp.spd, crit: 10, critDmg: 160, g: 30, st: {}, rage: 0, n: 0 });
  else if (!run.team && (run.ngoc || run.comp === 'ngoc')) {
    const fox = run.ngoc === 'fox';
    b.units.push({ id: 'NG', side: 'p', kind: 'ally', name: fox ? "Ngoc (Cửu Vĩ)" : 'Ngoc', lv, spr: fox ? 'ngocfox' : 'ngoc', fox,
      maxHp: Math.round(P.maxHp * (fox ? 0.7 : 0.5) * afB), hp: Math.round(P.maxHp * (fox ? 0.7 : 0.5) * afB), atk: P.atk * (fox ? 0.85 : 0.5) * afB,
      armor: P.armor * 0.8, res: P.res, spd: fox ? 108 : 95, crit: 10, critDmg: 160, g: 30, st: {}, healCd: 0, rage: 0 });
  }
  if (s.xShield) P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * s.xShield / 100));   // 磐石
  if (s.fx.has('gDice')) { b.dice = RNG.pick(['dmg', 'spd', 'crit', 'dr']); if (b.dice === 'spd') P.spd *= 1.25; if (b.dice === 'crit') P.crit = Math.min(95, (P.crit || 0) + 20); }   // 六博刀
  if (s.fx.has('gLamp')) { const f = RNG.pick(b.units.filter(u => u.side === 'e' && u.hp > 0)); if (f) f.st.lamp = true; }                                                     // 引魂灯
  if (s.fx.has('gDrum')) for (const u of b.units) if (u.kind === 'ally' || u.kind === 'minion') u.g = 100;                                                                          // 聚将鼓
  if (s.fx.has('cShiyu')) for (const u of b.units) if (u.kind === 'ally') { u.maxHp = u.hp = Math.round(u.maxHp * 1.3); u.atk *= 1.3; }   // 尸语冠
  if (P.allyPct || P.jy.tongpao) for (const u of b.units) if (u.kind === 'ally') { const k = (1 + (P.allyPct || 0) / 100) * (1 + (P.jy.tongpao || 0) / 100); u.maxHp = u.hp = Math.round(u.maxHp * k); u.atk *= k; }   // 同心玉；九幽·同袍（只管伙伴）
  for (const u of b.units) { const k = stKey(u); if (k && !(b.stat && b.stat[k])) { stAddK(b, k, 'dmg', 1e-9); b.stat[k].dmg = 0; } }   // 开战就有统计框：你、每个伙伴、僵尸先各占一行
  applyForm(b, run);   // 阵法：号位加成、前后排、克制
  { const bz = b.units.filter(u => u.kind === 'boss'); if (bz.length) b.bossHp0 = bz.reduce((a, u) => a + u.hp / u.maxHp, 0) / bz.length; }   // 开打时首领剩几成血（幻境妖王可能是上次打剩的）
  if (P.yi.xianling || P.yi.zhizhu) for (const f of b.units) if (f.side === 'e') {
    if (P.yi.zhizhu) { f.st.slow = 3 + Math.ceil(P.yi.zhizhu / 2); (b.yiPops = b.yiPops || []).push([f.id, "Triền Ti", 'cold', 'zhizhu']); }
    if (P.yi.xianling && RNG.ch(YI_STUN(P.yi.xianling) / 100 * (f.kind === 'boss' ? 0.5 : 1))) { f.st.frozen = true; (b.yiPops = b.yiPops || []).push([f.id, "Kinh Đường Mộc", 'cold', 'xianling']); }
  }
  return b;
}
const aliveOf = (b, side) => b.units.filter(u => u.side === side && u.hp > 0);
function spdOf(u) {
  let s = u.spd / 100;
  if (u.st && u.st.slow) s *= 0.65;
  if (u.hasteN > 0 && u.xHaste) s *= 1 + u.xHaste / 100;
  if (u.aff && u.aff.includes('enraged') && u.hp / u.maxHp < 0.5) s *= 1.3;
  if (u.fx && u.fx.has('bloodrage') && u.hp / u.maxHp < 0.5) s *= 1.3;
  if (u.enraged) s *= 1.3;
  if (u.frenzy) s *= 1 + 0.04 * u.frenzy;
  if (u.mom) s *= 1 + 0.15 * u.mom;
  return Math.max(0.2, s);
}
// ---------------- 伙伴组队（通关后的幻境） ----------------
// 伙伴吃你的伤害加成、暴击、暴伤，再乘 COMP_DMG；一个伙伴约占全队一成伤害，好感满（25 点，+100%）约两成
let COMP_DK = { ngoc: 5, zhen: 14, long: 14, kang: 12, lei: 9, liu: 14, tie: 12 };   // 各伙伴的伤害系数（对着幻境 40 层的配装校出来的）
const COMP_AFF_MAX = 25, FRONT_CLS = new Set(['berserker', 'paladin']);
const teamSlots = () => 1 + ((SAVE.riftMax || 0) >= 120 ? 1 : 0) + ((SAVE.riftMax || 0) >= 150 ? 1 : 0);
// ---------------- 阵法（2026-11-23）：四个号位，谁站哪自己摆；号位决定前后排（妖物七成先打前排）；阵花魂晶升级；幻境 20 层起妖物也摆阵，五阵循环相克 ----------------
const formSave = () => { if (!SAVE.form) SAVE.form = { cur: 'san', lv: {}, pos: {} }; return SAVE.form; };
const formLv = id => formSave().lv[id] || 0;
const formOpen = id => id === 'san' || formLv(id) > 0;
const formCur = () => { const F = formSave(); return F.cur && F.cur !== 'san' && F.lv[F.cur] ? F.cur : null; };
function formCheckUnlock() {   // 跟着进度学会：主线通关第几章，或幻境到过多少层，哪个先到算哪个
  const F = formSave(), ch = (SAVE.story && SAVE.story.cleared && SAVE.story.cleared.normal) || 0, r = SAVE.riftMax || 0, got = [];
  for (const id of FORM_IDS) if (!F.lv[id] && (ch >= FORMS[id].ch || r >= FORMS[id].at)) { F.lv[id] = 1; got.push(id); }
  return got;
}
function formFx(id, i, lv) {   // 某个阵第 i 号位（0 起）在 lv 级时的全部效果（全员的 + 这个号位的）
  const F = FORMS[id], o = {}; if (!F || !F.pos) return o;
  const add = (src, sc) => { for (const k in src || {}) o[k] = (o[k] || 0) + (sc ? formScale(src[k], lv) : src[k]); };
  for (const part of [F.all || {}, F.pos[i] || {}]) { add(part.b, true); add(part.p, false); }
  for (const k in o) o[k] = k === 'ext' ? Math.floor(o[k]) : Math.round(o[k]);
  if (o.aggro) o.aggro = Math.min(60, o.aggro);
  return o;
}
const memKey = u => u.kind === 'hero' ? 'hero' : (u.cid || u.comp || 'ngoc');
const natRow = (k, cls) => k === 'hero' ? (FRONT_CLS.has(cls) ? 0 : 1) : ((COMPANIONS[k] || {}).row === 'front' ? 0 : 1);
function formSlots(id, keys, cls) {   // 这个阵四个号位上各站谁：按存下来的摆；新来的人按他本来的前后排找空位
  const F = formSave(), rows = FORMS[id].rows, sv = (((F.pos || {})[cls] || {})[id] || []).slice(0, 4); while (sv.length < 4) sv.push(null);
  const have = new Set(keys);
  for (const k of keys) if (!sv.includes(k)) {
    const free = j => sv[j] == null || !have.has(sv[j]), w = natRow(k, cls);
    let i = [0, 1, 2, 3].find(j => free(j) && rows[j] === w); if (i == null) i = [0, 1, 2, 3].find(free); if (i != null) sv[i] = k;
  }
  return sv.map(k => have.has(k) ? k : null);
}
function formSwap(id, cls, keys, a, b) { const sv = formSlots(id, keys, cls); [sv[a], sv[b]] = [sv[b], sv[a]]; const F = formSave(); F.pos = F.pos || {}; (F.pos[cls] = F.pos[cls] || {})[id] = sv; return sv; }
function formUp(id) {
  const F = formSave(), lv = F.lv[id]; if (!lv) return { err: "Chưa học trận này" }; if (lv >= FORM_MAX) return { err: "Đã tối đa cấp" };
  const c = formCost(lv); if (SAVE.mats < c) return { err: `Không đủ hồn tinh (cần ${c})` };
  SAVE.mats -= c; F.lv[id] = lv + 1; return { lv: lv + 1 };
}
const formK = (my, en) => !en ? 0 : (!my || my === 'san') ? -1 : FORM_BEAT[my] === en ? 1 : FORM_BEAT[en] === my ? -1 : 0;   // 1 你克它，-1 它克你
const rFloorIdx = () => { try { const R = rFloorOf(RCH); return (R && R.fi) || 0; } catch (e) { return 0; } };
function enemyForm(run, kind) {   // 幻境 20 层起：每层妖物摆一个阵（这一局开始时定好），守关妖王另摆一个
  if (!run || run.mode !== 'rift' || (run.riftLv || 0) < EFM_FROM) return null;
  if (!run.efm) run.efm = { f: [0, 1, 2, 3].map(() => RNG.pick(FORM_IDS)), b: RNG.pick(FORM_IDS) };
  return kind === 'boss' ? run.efm.b : run.efm.f[rFloorIdx()] || run.efm.f[0];
}
// 我方的人：你 + 这场带的伙伴（幻境组队 / 主线的同伴或 Ngoc）
function formMembers(run) {
  const r = run || SAVE.run, ks = ['hero'];
  if (r && r.team) ks.push(...r.team); else if (r && r.mode !== 'rift') { if (r.comp && r.comp !== 'ngoc') ks.push(r.comp); else if (r.ngoc || r.comp === 'ngoc') ks.push('ngoc'); }
  else ks.push(...teamOf());
  return [...new Set(ks)];
}
function applyForm(b, run) {
  if (run && run.mode === 'tower') return;   // 通天塔不带阵法
  const F = formCur(), en = enemyForm(run, b.kind);
  b.fm = F; b.efm = en; b.fk = formK(F || 'san', en);
  if (!F) return;
  const mem = b.units.filter(u => u.side === 'p' && (u.kind === 'hero' || u.kind === 'ally')), lv = formLv(F);
  const sl = formSlots(F, mem.map(memKey), run.cls);
  for (const u of mem) {
    const i = sl.indexOf(memKey(u)); if (i < 0) continue;
    const e = formFx(F, i, lv); u.fslot = i; u.frow = FORMS[F].rows[i];
    if (e.dmg) u.fmD = e.dmg; if (e.dr) u.fmR = e.dr; if (e.heal) u.fmHeal = e.heal; if (e.aggro) u.fmAggro = e.aggro; if (e.ext) u.fmExt = e.ext; if (e.stD) u.fmStD = e.stD;
    if (e.spd) u.spd *= 1 + e.spd / 100; if (e.arm) u.armor *= 1 + e.arm / 100;
  }
}
const isFrontU = a => a.frow != null ? a.frow === 0 : a.kind === 'hero' ? FRONT_CLS.has(a.cls) : a.kind === 'ally' && !!a.front;
const zyPagesDone = () => ZY_PAGES.reduce((a, _, i) => a + (zyPageDone(i) ? 1 : 0), 0);
const COMP_LOCK = {   // 通关后才认识的伙伴：[现在多少, 要多少]
  lei: () => [(SAVE.stats && SAVE.stats.bounties) || 0, 10],
  liu: () => [zyPagesDone(), 3],
  tie: () => [SAVE.flags && SAVE.flags.wpnForged ? 1 : 0, 1] };
const compOpen = c => { if (!COMPANIONS[c]) return false; const ended = !!(SAVE.story && SAVE.story.ended);
  if (riftPath() && RIFT_COMP[c] != null && rTop() >= RIFT_COMP[c]) return true;   // 幻境路线：打到那一层就来
  if (COMP_LOCK[c]) return (ended || riftPath()) && (() => { const [a, n] = COMP_LOCK[c](); return a >= n; })();
  return c === 'kang' ? ended : !!(SAVE.comps || {})[c]; };
// 新认识了伙伴：回城时提示一次
function compMeetCheck() { if (!SAVE || !pgOr(0)) return []; SAVE.flags = SAVE.flags || {}; const got = [];
  for (const c in COMP_LOCK) if (!SAVE.flags['met_' + c] && compOpen(c)) { SAVE.flags['met_' + c] = 1; got.push(c); } return got; }
function teamOf() { const T = (SAVE.team || []).filter(compOpen); return [...new Set(T)].slice(0, teamSlots()); }
const giftCost = c => 5000 + 2000 * wAffOf(c);
function giftComp(c) {
  if (!compOpen(c)) return { err: "Chưa quen biết" };
  const v = wAffOf(c); if (v >= COMP_AFF_MAX) return { err: "Hảo cảm đã đầy" };
  const cost = giftCost(c); if (SAVE.gold < cost) return { err: "Không đủ bạc" };
  SAVE.gold -= cost; SAVE.aff = SAVE.aff || {}; SAVE.aff[c] = v + 1; return { ok: true, v: v + 1 };
}
const compNeeds = (P, s) => P.skills.some(k => k.cd && k.pay && (k.pay.s === s || k.pay.s === 'any'));   // 你带的招式里有没有收这种状态的
function makeAlly(b, P, c, idx) {
  const C = COMPANIONS[c], aff = wAffOf(c), afB = 1 + 0.04 * aff, fox = c === 'ngoc';
  const hp = fox ? 0.7 : C.hp, at = fox ? 0.85 : C.atk;
  const u = { id: idx ? 'NG' + (idx + 1) : 'NG', side: 'p', kind: 'ally', comp: fox ? null : c, cid: c, fox, front: C.row === 'front', afl: aff, name: fox ? "Ngoc (Cửu Vĩ)" : C.n, lv: P.lv, spr: fox ? 'ngocfox' : C.spr, wx: C.wx,
    maxHp: Math.round(P.maxHp * hp * afB), atk: P.atk * at * afB * (COMP_DK[c] || 1), armor: P.armor * (c === 'kang' ? 1.8 : C.row === 'front' ? 1.2 : 0.8), res: c === 'kang' ? Math.max(P.res || 0, Math.min(75, (P.res || 0) + 15)) : P.res, spd: fox ? 108 : C.spd,
    crit: Math.max(10, P.crit || 0), critDmg: Math.max(160, P.critDmg || 0), dmgPct: P.dmgPct || 0, elem: P.elem || 0, g: 30, st: {}, rage: 0, n: 0, healCd: 0,
    taunt: c === 'kang' ? (aff >= 20 ? 0.55 : 0.35) : c === 'lei' ? 0.15 : 0 };
  u.hp = u.maxHp; return u;
}
function addRage(u, n) { if (u.rage == null) return; const h = u.kind === 'hero'; u.rage = Math.min(h ? ULT.maxR : 100, u.rage + n * (1 + (u.xRage || 0) / 100) * (h ? ULT.gain : 1)); }   // 主角：攒得慢、能存两格（2026-11-24 第二版）
const popN = (u, n) => String(n);   // 跳字仍然给原始数；界面显示时再乘倍数、把上万的写成「1.2万」
let BK = 1;
function heal(u, amt, out, quiet) {
  if (u.hp <= 0) return 0;
  if (u.fmHeal) amt *= 1 + u.fmHeal / 100;   // 地载阵后排：受到的治疗加成
  if (u.side === 'e' && BNOW && wearyN(BNOW) > 0) return 0;   // 久战破绽：妖物回不了血了
  const a = Math.min(u.maxHp - u.hp, Math.round(amt));
  if (a >= 1) { u.hp += a; if (!quiet) out.pops.push([u.id, '+' + popN(u, a), 'heal']); if (u.side === 'p') stAdd(BNOW, stActor(BNOW), 'heal', a); if (BNOW && u === BNOW.P) hsOf(BNOW).heal += a; }
  if (a >= 1 && u.kind === 'hero' && u.fx && u.fx.has('cBodhi') && BNOW) BNOW.units.filter(x => x.kind === 'ally' && x.hp > 0).forEach(x => { x.hp = Math.min(x.maxHp, x.hp + Math.round(x.maxHp * a / u.maxHp)); });   // 菩提子
  if (u.kind === 'hero' && u.fx && u.fx.has('daRi4')) {   // 大日如来：溢出的治疗攒成护体
    const over = Math.round(amt) - Math.max(0, a), cap = Math.round(u.maxHp * dariCap(u));
    if (over >= 1 && (u.shield || 0) < cap) { u.shield = Math.min(cap, (u.shield || 0) + over); if (!quiet) out.pops.push([u.id, "Hộ Thể", 'buff']); }
  }
  return Math.max(0, a);
}
function freezeU(u, out, label) {
  if (u.hp <= 0 || (u.kind === 'boss' && RNG.ch(0.5))) return;
  if (u.kind === 'hero' && u.jy && u.jy.dingshen && BNOW && !BNOW.jyDs) { BNOW.jyDs = true; out.pops.push([u.id, "Định Thần", 'buff']); return; }   // 九幽·定神：每场第一次控制直接免掉
  if (u.kind === 'hero' && u.xTen && RNG.ch(u.xTen / 100)) { out.pops.push([u.id, "Thanh thần", 'buff']); return; }
  u.st.frozen = true; out.pops.push([u.id, label || "Choáng", 'cold', 1]); if (u.side === 'e') { const by = stActor(BNOW); u.frzA = !!(by && by.kind === 'ally'); stAdd(BNOW, by, 'ctrl', 1); }
  if (u.ghostForm) { u.ghostForm = false; out.pops.push([u.id, "Hiện hình", 'react']); out.lines.push(`${u.name} bị đánh choáng, quỷ thân hiện hình!`); }
}
function applyPoison(src, tgt, pct, bonus) {
  const m = src.fx && src.fx.has('plague') ? 2.5 : 1;
  const swK = src.kind === 'hero' && src.lgv && src.lgv.shiwang != null && BNOW ? LGV.swPoi(src.lgv.shiwang) * emptySlots(BNOW, src) : 0;   // 尸王玉：尸位空着，毒更狠
  const d = src.atk * pct / 100 * m * (1 + ((bonus || 0) + swK) / 100), old = tgt.st.poison;
  const own = src.kind === 'minion' ? null : src;   // 五毒独行：毒可以叠，最多叠到单次的 DUXING_STACK 倍
  tgt.st.poison = { d: own && own.fx && own.fx.has('duXing6') && old ? Math.min(d * (own.fx.has('baiguBelt') ? 8 : DUXING_STACK), old.d + d) : d, t: 3 + stExt(own), by: stKey(src) || 'P' };
}
const mageCap = P => SUST.mage.cap + (P.fx && P.fx.has('taijiOff') ? 20 : 0);
const dariCap = u => u.fx && u.fx.has('dariBelt') ? 0.8 : DARI_CAP;
const stExt = u => (u && u.fx && u.fx.has('baifuBelt') ? 2 : 0) + (u && u.lgv && u.lgv.shigu != null ? 1 : 0) + ((u && u.fmExt) || 0);   // 百符带 +2；蚀骨玉 +1   // 百符带：状态多挂两回合
const setWeak = (f, t, v, out) => { if (f.hp > 0) { f.st.weak = Math.max(f.st.weak || 0, t); f.st.weakV = Math.max(f.st.weakV || 0, v); out.pops.push([f.id, "Kiệt lực", 'curse', 1]); } };
let THORN_CAP = 0.15, CDSKIP_CAP = 40;
let SAN_DMG = 0.05, SAN_DR = 0.015, SAN_DR_CAP = 0.5;   // 散件流：每件神兵、每枚扳指 +5% 伤害、-1.5% 受伤（十件神兵两枚扳指 = +100% / -30%）。38 层对打：比同路线的 6 件套略慢
let YINBING_MUL = 2;   // 阴兵借道 6 件：原来 ×4。僵尸改成开战就在场以后，这一套比别的门派快了一倍，收到 ×2
// 第二套幻境套装的数（调平衡只动这里）
// 2026-11-24 流派平衡（毕业号模板对比后，用户：按你说的做）：只改各套自己的机制数字，加上套装 2 件的减伤
let XUEHAI_DR = 0.35, XUEHAI_FURY = 0.03, QISHA_FIN = 6, GUIYUAN_MUL = 4, GUIYUAN_SW = 0.4;
let BUSI_HP = 0.04, BUSI_AOE = 5, WANFU_ST = 0.5, WANFU_SPLASH = 0.8, WANFU_DET = 0.4, DUXING_DMG = 0.6, DUXING_DR = 0.13, DUXING_STACK = 8, DUXING_BURST = 3, QIANJI_MUL = 6, DARI_CAP = 0.5, DARI_DMG = 1.5, DARI_HIT = 2, DARI_REGEN = 0.12;
const emptySlots = (b, P) => Math.max(0, Math.min(4, (P.minionCap || 3)) - zombiesOf(b).filter(z => !ZOMBIES[z.zt].ult).length);
const DART_SK = new Set(['venom', 'bingpo', 'fan']), BUSI_SK = new Set(['whirl', 'liedi']);
// ---------------- 赶尸人的僵尸 ----------------
const ZOMBIES = {
  tiaoshi: { n: "Khiêu Thi",   lv: 1,  spr: 'jiangshi', pal: null, hp: 0.34, atk: 0.8, spd: 112, arm: 1, ae: 'phys', d: "Hàng trước · đánh nhanh, vồ cắn" },
  tiejia:  { n: "Thiết Giáp Thi", lv: 6,  spr: 'yong', pal: { B: '#4a4a5a' }, hp: 0.7, atk: 0.4, spd: 85, arm: 2.2, ae: 'phys', taunt: 0.6, thornsP: 0.15, d: "Hàng trước · khiêu khích: sáu phần đòn của địch đánh vào nó, bị đánh thì phản chấn" },
  dushi:   { n: "Độc Thi",   lv: 12, spr: 'swampcorpse', pal: null, hp: 0.32, atk: 0.5, spd: 98, arm: 0.8, ae: 'poison', ap: 'poison', apc: 0.7, d: "Hàng sau · phun độc, gây trúng độc" },
  yinhuo:  { n: "Âm Hỏa Thi", lv: 20, spr: 'jiangshi', pal: { B: '#2a3a6a', S: '#9ad0ff' }, hp: 0.3, atk: 0.42, spd: 82, arm: 0.8, ae: 'fire', aoe: 0.8, ap: 'burn', apc: 0.4, d: "Hàng sau · phun thi hỏa, đánh mọi kẻ địch, gây thiêu đốt" },
  shiwang: { n: "Thi Vương",   lv: 25, spr: 'jiangshi', pal: { B: '#6a4a10', S: '#e8c13a' }, hp: 1.2, atk: 0.9, spd: 100, arm: 2, ae: 'phys', aoe: 1, life: 4, ult: true, d: "Gọi ra bằng tuyệt kỹ, càn quét cả trận 4 lượt; khi có mặt thì mọi cương thi công +30%" },
};
const ZOMBIE_ORDER = ['tiaoshi', 'tiejia', 'dushi', 'yinhuo'];
// 尸阵：赶尸人在武学页排的位置；没排过就按解锁情况给一个顺手的
function necroForm(lv, form) {
  const ok = z => ZOMBIES[z] && !ZOMBIES[z].ult && ZOMBIES[z].lv <= lv;
  const def = [ok('tiejia') ? 'tiejia' : 'tiaoshi', 'tiaoshi', ok('dushi') ? 'dushi' : 'tiaoshi', ok('yinhuo') ? 'yinhuo' : 'tiaoshi', 'tiaoshi'];
  return def.map((d, i) => form && ok(form[i]) ? form[i] : d);
}
function makeZombie(b, P, zt, slot, rune) {
  const Z = ZOMBIES[zt] || ZOMBIES.tiaoshi, m = (P.fx && P.fx.has('boneLord') ? 2 : 1) * (1 + (P.minionPct || 0) / 100) * (1 + (P.allyPct || 0) / 100);
  const hq = P.fx && P.fx.has('huangquan') ? 1.25 : 1;
  const hpM = (rune === 'b' ? 1.6 : 1) * (zt === 'tiejia' ? 1 + (P.ironPct || 0) / 100 : 1) * hq;
  const u = { id: uid(), side: 'p', kind: 'minion', zt, slot, name: Z.n, lv: P.lv, spr: Z.spr, pal: Z.pal,
              maxHp: Math.round(P.maxHp * Z.hp * m * hpM), atk: P.atk * Z.atk * m * (P.fx && P.fx.has('yinBing6') ? YINBING_MUL : 1), armor: P.armor * Z.arm, res: P.res, spd: Z.spd * hq, crit: 5, critDmg: 150, g: 40, st: {},
              ae: Z.ae, wx: 'tu', taunt: Z.taunt, thornsP: Z.thornsP ? Z.thornsP + (P.ironPct || 0) / 150 : 0, poisonPct: P.poisonPct || 0, life: Z.life };
  if (b.run && b.run.mode === 'rift') { u.dmgPct = P.dmgPct || 0; u.crit = P.crit; u.critDmg = P.critDmg; }   // 幻境里僵尸吃你的伤害加成和暴击（修为、灵玉、镇妖录才对赶尸人有用）
  u.hp = u.maxHp; b.units.push(u); return u;
}
const zombiesOf = b => b.units.filter(u => u.kind === 'minion' && u.hp > 0);
// 摇铃唤尸：按尸阵把空着的位置补上
function summonSkel(b, P, rune, n) {
  const cap = P.minionCap || 3, form = P.cls === 'necro' ? necroForm(P.lv, SAVE.chars.necro && SAVE.chars.necro.form) : ['tiaoshi', 'tiaoshi', 'tiaoshi', 'tiaoshi', 'tiaoshi'];
  let made = 0;
  for (let k = 0; k < (n || 1); k++) {
    const alive = zombiesOf(b).filter(z => !ZOMBIES[z.zt].ult); if (alive.length >= cap) break;
    let slot = 0; while (slot < cap && alive.some(z => z.slot === slot)) slot++;
    makeZombie(b, P, form[slot] || 'tiaoshi', slot, rune); made++;
  }
  return made;
}
function minionAct(b, u, out) {
  if (u.life != null && --u.life < 0) { u.hp = 0; out.lines.push(`${u.name} hóa thành một nắm đất, trở về lòng đất`); out.pops.push([u.id, "Về đất", 'miss']); return; }
  const foes = aliveOf(b, 'e'); if (!foes.length) return;
  const Z = ZOMBIES[u.zt] || ZOMBIES.tiaoshi, king = b.units.some(x => x.zt === 'shiwang' && x.hp > 0 && x !== u);
  const am = (u.st.yang ? 1.3 : 1) * (king ? 1.3 : 1), sk = Z.ap ? { ap: Z.ap, apc: Z.apc || 1 } : null;
  if (Z.aoe) { out.cast = { id: 'minion', elem: u.ae, target: foes[0].id, aoe: true }; foes.forEach(f => hit(b, u, f, Z.aoe * am, u.ae, out, { aoe: 1, sk })); return; }
  const t = (b.focus && foes.find(f => f.id === b.focus)) || (Z.taunt ? foes[0] : foes.reduce((a, c) => c.hp < a.hp ? c : a));
  out.cast = { id: 'minion', elem: u.ae, target: t.id }; hit(b, u, t, am, u.ae, out, { sk });
  if (b.P && b.P.fx.has('wZhenshi') && RNG.ch(0.25 * b.P.wpK)) { const t2 = t.hp > 0 ? t : aliveOf(b, 'e')[0]; if (t2) { out.pops.push([u.id, "Liên kích", 'crit']); hit(b, u, t2, am, u.ae, out, { sk }); } }
}

// 出手顺序预览：照着读条往后推 n 次（不改战斗状态）
function turnOrder(b, n) {
  const live = b.units.filter(u => u.hp > 0 && !u.dead), g = new Map(live.map(u => [u, u.g])), out = [];
  for (let k = 0; k < n && live.length; k++) {
    let actor = null, bt = Infinity;
    for (const u of live) { const t = (100 - g.get(u)) / spdOf(u); if (t < bt) { bt = t; actor = u; } }
    for (const u of live) g.set(u, g.get(u) + bt * spdOf(u));
    g.set(actor, 0); out.push(actor);
  }
  return out;
}
// 幻境里的「久战破绽」：一场打到第 R_WEARY[0] 轮（按主角出手算），妖物不再回血，之后每轮多受 R_WEARY[1] 的伤害——再能回血的妖物也拖不成死局
let R_WEARY = [10, 0.10, 20], R_REGEN = 0.02;   // [普通战从第几轮起, 每轮多受多少, 妖王战从第几轮起]：妖王是这一局的关口，晚一倍才露破绽
let BNOW = null;
const riftB = b => !!(b && b.run && ((b.run.mode === 'rift' && b.run.world) || b.run.mode === 'tower'));   // 通天塔照幻境的规矩打（久战破绽、妖王封顶、两段）
// 幻境守关的蓄力大招（惊堂木、喷火、吞噬这些）：剧情里有道具能克，幻境里没得克，再乘上守关的攻击 ×2.2，满血一下就没（僵尸县令的惊堂木平均打掉 87%，最高 137%）。
// 幻境里这类大招每下最多打掉目标一半气血：还是要命（后面接着眩晕和普攻），但不会满血秒人
var R_CAP_HIT = 0.5, R_BOSS_CAP = 0.4;   // 2026-11-24 守关妖王一次出手最多打掉四成气血（原来六成：高层两下就倒，除了罗汉谁都打不过首领）
const wearyN = b => riftB(b) ? Math.max(0, (b.pr || 0) - R_WEARY[b.kind === 'boss' ? 2 : 0] + 1) : 0;
// ---------------- 小队统计：输出、控制、治疗、护体挡下、承伤、挡刀（按人分；僵尸合一行） ----------------
const stKey = u => !u ? null : u.kind === 'minion' ? 'Z' : u.side === 'p' && u.kind !== 'ward' ? u.id : null;
function stAddK(b, k, f, v) {
  if (!b || !k || !(v > 0)) return; b.stat = b.stat || {};
  let r = b.stat[k]; if (!r) { const u = k === 'Z' ? null : b.units.find(x => x.id === k); r = b.stat[k] = { n: k === 'Z' ? "Cương thi" : u ? u.name : k, cid: k === 'P' || k === 'Z' ? k : (u && (u.cid || (u.fox ? 'ngoc' : u.comp))) || k, dmg: 0, ctrl: 0, heal: 0, shield: 0, taken: 0, guard: 0 }; }
  r[f] += v;
}
const stAdd = (b, u, f, v) => stAddK(b, stKey(u), f, v);
const stActor = b => b && b.curActor && b.curActor.side === 'p' ? b.curActor : b && b.P;   // 控制、治疗记在正在出手的那个人头上
function mergeStat(into, st) { if (!st) return into; into = into || {}; for (const k in st) { const r = st[k], key = r.cid; const t = into[key] = into[key] || { n: r.n, cid: key, dmg: 0, ctrl: 0, heal: 0, shield: 0, taken: 0, guard: 0 }; for (const f of ['dmg', 'ctrl', 'heal', 'shield', 'taken', 'guard']) t[f] += r[f] || 0; } return into; }
// 主角详细统计（2026-11-24）：输出按来源分、最高一击、暴击率；承伤分护体挡下／减伤挡掉／真正掉血；回了多少血
const hsOf = b => b.hs || (b.hs = { src: {}, max: 0, n: 0, cr: 0, hitN: 0, raw: 0, sh: 0, hp: 0, heal: 0 });
function hsDmg(b, k, v) { if (!b || !(v > 0)) return; const h = hsOf(b); h.src[k] = (h.src[k] || 0) + v; if (v > h.max) h.max = v; }
function mergeHs(into, h) { if (!h) return into; into = into || { src: {}, max: 0, n: 0, cr: 0, hitN: 0, raw: 0, sh: 0, hp: 0, heal: 0 }; for (const k in h.src) into.src[k] = (into.src[k] || 0) + h.src[k]; into.max = Math.max(into.max, h.max || 0); for (const f of ['n', 'cr', 'hitN', 'raw', 'sh', 'hp', 'heal']) into[f] += h[f] || 0; return into; }
function battleStep(b) {
  const out = { lines: [], pops: [], actor: null, cast: null };
  if (b.over) return out;
  BNOW = b;
  // 必杀（2026-11-24）：不占出手，按下去下一步立刻放；自动出招时攒满两格才替你打断蓄力（只打断，留一格给你）
  if (b.P && b.P.hp > 0 && b.P.rage >= 100) { const foes = aliveOf(b, 'e');
    if (foes.length && (b.ultReq || (b.ultAuto && b.P.rage >= ULT.maxR && foes.some(f => f.charging)))) { out.actor = 'P'; out.dt = 0; ultimate(b, b.P, foes, out, !b.ultReq);   // 自动打断只用第二格
      if (b.P.lgv && b.P.lgv.tiangang != null) { b.P.st.tg = 3; out.pops.push(['P', "Thiên Cương", 'buff']); }   // 天罡玉：必杀后两招加伤
      resolveDeaths(b, out); return out; } }
  b.ultReq = false;
  const live = b.units.filter(u => u.hp > 0);
  let actor = null, bt = Infinity;
  for (const u of live) { const t = (100 - u.g) / spdOf(u); if (t < bt) { bt = t; actor = u; } }
  for (const u of live) u.g += bt * spdOf(u);
  actor.g = 0; out.actor = actor.id; out.dt = bt; b.curActor = actor;
  if (b.run && b.run.mode === 'rift' && !b.run.riftDone) b.run.clock = (b.run.clock || 0) + bt * (b.run.world ? R_BT_MS : 1);
  b.capAcc = actor.kind === 'boss' ? {} : null;   // 守关妖王这一手打了谁多少（封顶用）
  act(b, actor, out); b.capAcc = null;
  if (actor === b.P && actor.hp > 0 && !b.over && actor.jy && actor.jy.lianhuan && RNG.ch(actor.jy.lianhuan / 100)) { actor.g = 100; out.pops.push(['P', "Tật Ảnh", 'buff']); }   // 九幽·疾影：马上再出手一次
  if (actor.duo && actor.hp > 0 && out.actor && !b.over && ++actor.nAct % actor.duo === 0) { actor.g = 100; out.pops.push([actor.id, "Liên động", 'crit']); out.lines.push(`${actor.name} thân hình chợt lóe, tiếp ngay một chiêu nữa!`); }   // 守关妖王连动：马上再出一招
  for (const u of b.units) if (u.hp > 0 && u.kind === 'boss') {   // 守关妖王换阶段
    if (u.ph1 && u.hp / u.maxHp < R_BOSS_PH[0]) { delete u.ph1; u.shield = Math.max(u.shield || 0, Math.round(u.maxHp * R_BOSS_PH[1])); u.phShield = true; out.pops.push([u.id, "Hộ thể chân khí", 'buff']); out.lines.push(`Quanh người ${u.name} bốc lên một lớp hộ thể chân khí — chưa phá được thì đánh nó chỉ còn một nửa!`); }
    if (u.phShield && !(u.shield > 0)) { delete u.phShield; out.pops.push([u.id, "Hộ thể vỡ rồi", 'react']); out.lines.push(`Hộ thể chân khí của ${u.name} bị đánh tan!`); }
    if (u.ph2 && u.hp / u.maxHp < R_BOSS_PH[3]) { delete u.ph2; u.atk *= R_BOSS_PH[4]; u.rageB = true; out.pops.push([u.id, "Bạo nộ", 'crit']); out.lines.push(`${u.name} bạo nộ: ra tay càng hiểm!`); }
  }
  for (const u of b.units) if (u.callU && u.hp > 0 && (u.ph2 != null || u.rageB ? !!u.rageB : u.hp / u.maxHp < 0.5)) {   // 幻境组队：首领喊小妖（守关妖王暴怒时喊；没有阶段的照旧半血喊）
    const L = u.callU; delete u.callU; L.forEach(x => { x.g = RNG.i(0, 40); x.called = true; b.units.push(x); });
    out.pops.push([u.id, "Quát lớn", 'crit']); out.lines.push(`${u.name} quát lớn một tiếng, lại có ${L.length} con yêu vật xông lên!`); }
  resolveDeaths(b, out);
  if (++b.turn > 700 && !b.over) { b.over = true; b.win = false; out.lines.push("Trận đánh kéo dài quá lâu, bạn kiệt sức ngã xuống."); }
  return out;
}
function act(b, u, out) {
  for (const k of ['burn', 'poison']) {
    const d = u.st[k]; if (!d) continue;
    const dmg = Math.max(1, Math.round(d.d)); u.hp -= dmg; if (u.side === 'e') stAddK(b, d.by || 'P', 'dmg', Math.min(dmg, dmg + Math.min(0, u.hp)));
    if (u.side === 'e' && (d.by || 'P') === 'P') hsDmg(b, "Sát thương duy trì", Math.min(dmg, dmg + Math.min(0, u.hp))); else if (u === b.P) { const h = hsOf(b); h.raw += dmg; h.hp += dmg; }
    out.pops.push([u.id, '-' + popN(u, dmg), k, 0, (d.by || 'P') === 'P' ? 'P' : '']);
    if (!(k === 'poison' && u.side === 'e' && b.P && b.P.fx.has('wWandu')) && --d.t <= 0) delete u.st[k];
    if (u.hp <= 0 && u.kind === 'hero') heroSave(b, u, out);
    if (u.hp <= 0) { out.lines.push(`${u.name} ${k === 'burn' ? "bị thiêu" : "trúng độc"} chết`); return; }
  }
  if (u.st.frozen) { delete u.st.frozen; if (u.frzA) { u.frzA = false; if (u.side === 'e' && b.P && b.P.cls === 'paladin') thornHit(b, b.P, u, out, { thf: 1 }); if (u.hp <= 0) { out.actor = null; return; } } if (u.charging) { delete u.charging; out.pops.push([u.id, "Ngắt", 'buff']); out.lines.push(`${u.name} bị đánh choáng, tụ lực bị ngắt!`); } else out.lines.push(`${u.name} bị choáng`); out.actor = null; return; }
  if (u.trait === 'regen' && u.hp > 0 && !u.st.burn && !(riftB(b) && u.st.poison)) heal(u, u.maxHp * (riftB(b) ? R_REGEN : 0.05), out);   // 幻境里精英血厚三倍多，回 5% 打不动：改成 2%，中毒也压得住
  for (const k of ['warcry', 'curse', 'shadow', 'mark', 'melt', 'slow', 'butui', 'smoke', 'chan', 'tg', 'rumo', 'jsh', 'qianren', 'guiyi', 'baigui', 'yang', 'weak', 'vuln', 'shijia', 'gourd', 'kangG', 'liuDr', 'tieArm']) if (u.st[k] && --u.st[k] <= 0) {
    delete u.st[k];
    if (k === 'smoke' && u.kind === 'hero' && u.fx && u.fx.has('cJinchan') && u.hp > 0) {   // 金蝉手：烟遁散了，回血、清负面
      heal(u, u.maxHp * 0.15, out); for (const z of ['frozen', 'poison', 'burn', 'slow', 'curse', 'weak', 'vuln', 'melt']) delete u.st[z]; delete u.st.weakV; out.pops.push([u.id, "Kim Thiền", 'buff']); }
    if (k === 'weak') delete u.st.weakV;
    if (k === 'curse') { delete u.st.curseW; delete u.st.curseB; }
    if (k === 'mark') delete u.st.markB;
  }
  if (u.regen) heal(u, u.regen, out, true);
  if (u.kind === 'minion' && u.hp > 0 && b.P && b.P.fx && b.P.fx.has('cShiyu')) heal(u, u.maxHp * 0.05, out, true);   // 尸语冠
  if (u.kind === 'hero' && u.regenPct && u.hp > 0) heal(u, u.maxHp * u.regenPct / 100, out, true);
  if (u.kind === 'hero' && u.hp > 0) {
    if (u.st.smoke && u.runes.yandun === 'b') heal(u, u.maxHp * 0.05, out);                       // 烟遁·金蝉
    if (u.fx.has('nutao') && (u.fury || 0) >= 50) heal(u, u.maxHp * 0.04, out, true);             // 怒涛刀鞘
    if (u.fx.has('jingangjia') && u.shield > 0) heal(u, u.maxHp * 0.03, out, true);               // 金刚袈裟
    if (u.fx.has('gDrunk')) heal(u, u.maxHp * 0.04, out, true);                                   // 醉仙巾
  }
  if (u.kind === 'hero' && u.cls === 'paladin' && u.hp > 0) heal(u, u.maxHp * sustV(u, 'b') / 100, out, true);
  if (u.kind === 'hero' && u.hp > 0 && u.fx && u.fx.has('daRi4')) u.shield = Math.min(Math.round(u.maxHp * dariCap(u)), Math.max(u.shield || 0, 0) + Math.round(u.maxHp * DARI_REGEN));
  if (u.st.renew) { heal(u, u.maxHp * 0.06, out); if (--u.st.renew <= 0) delete u.st.renew; }
  if (u.kind === 'hero') return heroAct(b, u, out);
  if (u.kind === 'ally') return ngocAct(b, u, out);
  if (u.kind === 'ward') return wardAct(b, u, out);
  if (u.kind === 'minion') return minionAct(b, u, out);
  enemyAct(b, u, out);
}
// 守护战里念诵的人：每轮念一句，正气护住众人；念完，小怪全退
function wardAct(b, u, out) {
  const W = b.ward; if (!W) return; W.n++;
  const L = W.lines[(W.n - 1) % Math.max(1, W.lines.length)];
  out.cast = { id: 'zhengqi', elem: 'holy', target: u.id }; out.pops.push([u.id, `${W.n}/${W.need}`, 'buff']);
  if (W.say[W.n]) { out.say = [u.id, W.say[W.n]]; out.lines.push(`${u.name}: “${W.say[W.n]}”`); }
  else if (L) { out.say = [u.id, L]; out.lines.push(`${u.name} niệm: “${L}”`); }
  aliveOf(b, 'p').forEach(a => { if (a !== u) heal(a, a.maxHp * 0.04, out, true); });
  if (W.n >= W.need) {
    aliveOf(b, 'e').forEach(f => { f.hp = 0; out.pops.push([f.id, "Tan biến", 'holy']); });
    out.lines.push(W.end || "Chính khí xông thẳng lên trời, quỷ triều rút lui."); out.cast = { id: 'zhengqi', elem: 'holy', aoe: true, target: u.id };
  }
}
// 伙伴起手：你带了收某种状态的招式，伙伴就专挑没挂这种状态的敌人、并且一定挂上（伙伴帮你起手）
function compStart(b, u, s, foes, out) {
  if (!compNeeds(b.P, s)) return null;
  const f = foes.find(x => !stHas(x, s)); if (!f) return null;
  if (!u.toldStart) { u.toldStart = 1; out.pops.push([u.id, "Khởi thủ", 'buff']); }
  return f;
}
// 组队：全队（你和伙伴，不含僵尸、法坛）里血量比例最低的那个
const teamMates = b => b.units.filter(x => x.side === 'p' && x.hp > 0 && (x.kind === 'hero' || x.kind === 'ally'));
const teamLow = (b, line) => { const L = teamMates(b).filter(x => x.hp / x.maxHp < line); return L.length ? L.reduce((a, c) => c.hp / c.maxHp < a.hp / a.maxHp ? c : a) : null; };
// 武僧组队：自己的奶顺带给伙伴（按伙伴自己的最大气血，打五折）
function allyHeal(b, P, pct, out) { if (!b.run || !b.run.team) return; b.units.filter(x => x.kind === 'ally' && x.hp > 0).forEach(x => heal(x, x.maxHp * pct * 0.5 * (1 + (P.healPct || 0) / 100), out)); }
function compAct(b, u, out) {
  const P = b.P, foes = aliveOf(b, 'e'); if (!foes.length) return;
  addRage(u, 9); u.n = (u.n || 0) + 1;
  if (u.comp === 'zhen') {
    if (u.n % 3 === 0) { const all = b.run && b.run.team && u.afl >= 20, apc = b.run && b.run.team && u.afl >= 10 ? 0.8 : 0.5, st = compStart(b, u, 'stun', foes, out);
      const tt = all ? foes : [st || foes.reduce((a, c) => c.hp < a.hp ? c : a)];
      out.cast = { id: 'chain2', elem: 'phys', target: tt[0].id, wx: 'jin', aoe: all }; tt.forEach(t => hit(b, u, t, 0.7, 'phys', out, { sk: { ap: 'stun', apc: st && t === st ? 1 : apc }, aoe: all ? 1 : 0 }));
      if (RNG.ch(0.25)) out.say = [u.id, RNG.pick(["Ngoan ngoãn chút!", "Theo ta về nha môn!", "Hừ, chỉ có chút bản lĩnh này?"])]; }
    else { const st = compStart(b, u, 'armor', foes, out), t = st || foes.reduce((a, c) => c.hp < a.hp ? c : a); out.cast = { id: 'blade2', elem: 'phys', target: t.id, wx: 'jin' }; hit(b, u, t, 1, 'phys', out, { sk: { ap: 'armor', apc: st ? 1 : 0.4 } }); }
  } else if (u.comp === 'long') {
    const every = b.run && b.run.team && u.afl >= 10 ? 3 : 4;
    if (u.n % every === 0 && P.hp > 0) { P.st.warcry = Math.max(P.st.warcry || 0, 2); out.pops.push(['P', "Chính khí", 'buff']);
      if (b.run && b.run.team) { const O = b.units.filter(x => x.side === 'p' && x !== P && x.hp > 0 && x.kind !== 'ward' && (u.afl >= 20 || x.kind === 'ally'));   // 你，加上输出最高的那个伙伴；好感 20 全队
        (u.afl >= 20 ? O : O.length ? [O.reduce((a, c) => c.atk > a.atk ? c : a)] : []).forEach(x => { x.st.warcry = Math.max(x.st.warcry || 0, 2); if (u.afl < 20) out.pops.push([x.id, "Chính khí", 'buff']); }); }
      out.cast = { id: 'zhengqi', elem: 'holy', target: 'P' }; out.say = [u.id, RNG.pick(["Trời đất có chính khí!", "Hạo nhiên chi khí, chí đại chí cương!", "Huynh đài, tại hạ giúp một tay!"])]; }
    else { const st = compStart(b, u, 'chill', foes, out), t = st || RNG.pick(foes); out.cast = { id: 'zhengjue', elem: 'poison', target: t.id, wx: 'mu' }; hit(b, u, t, 0.95, 'poison', out, { sk: { ap: 'chill', apc: st ? 1 : 0.45 } }); }
  } else if (u.comp === 'kang') {
    if (u.n % 3 === 0 && P.hp > 0) { teamMates(b).filter(x => x !== u).forEach(x => { x.st.kangG = 3; }); out.pops.push(['P', "Đỡ đao", 'buff']); out.cast = { id: 'kangGuard', elem: 'phys', target: 'P' }; if (RNG.ch(0.4)) out.say = [u.id, RNG.pick(["Núp sau lưng ta!", "Cú này ghi sổ!", "Buôn lỗ ta cũng làm rồi!"])]; }
    else { const st = compStart(b, u, 'stun', foes, out), t = st || foes[0]; out.cast = { id: 'blade2', elem: 'phys', target: t.id, wx: 'tu' }; hit(b, u, t, 0.8, 'phys', out, { sk: { ap: 'stun', apc: st ? 1 : 0.2 } }); }
  } else if (u.comp === 'lei') {   // 雷老虎：砍血最少的；每三招断头刀
    const low = foes.reduce((a, c) => c.hp / c.maxHp < a.hp / a.maxHp ? c : a);
    if (u.n % 3 === 0) { const line = u.afl >= 10 ? 0.5 : 0.35, t = low, m = t.hp / t.maxHp < line ? 3.2 : 1.6;
      out.cast = { id: 'leiFinish', elem: 'phys', target: t.id, wx: 'jin' }; hit(b, u, t, m, 'phys', out, { sk: { ap: 'armor', apc: 1 } });
      if (t.hp <= 0 && u.afl >= 20) { const n2 = aliveOf(b, 'e').filter(f => f !== t); if (n2.length) { const t2 = n2.reduce((a, c) => c.hp < a.hp ? c : a); out.pops.push([u.id, "Thêm một đao", 'buff']); hit(b, u, t2, 1, 'phys', out, { sk: { ap: 'armor', apc: 1 } }); } }
      if (RNG.ch(0.3)) out.say = [u.id, RNG.pick(["Cái đầu này là của ta!", "Chạy? Chạy nhanh hơn đao ta à?", "Kẻ tiếp theo!"])]; }
    else { const st = compStart(b, u, 'armor', foes, out), t = st || low; out.cast = { id: 'leiCut', elem: 'phys', target: t.id, wx: 'jin' }; hit(b, u, t, 1, 'phys', out, { sk: { ap: 'armor', apc: st ? 1 : 0.5 } }); }
  } else if (u.comp === 'liu') {   // 刘师傅：每三招念经，全队减伤；木鱼敲晕
    if (u.n % 3 === 0) { const T = b.units.filter(x => x.side === 'p' && x.hp > 0 && x.kind !== 'ward'); b.liuDrV = u.afl >= 10 ? 0.3 : 0.2; T.forEach(x => { x.st.liuDr = 3; });
      out.pops.push(['P', "Kinh thanh hộ thể", 'buff']); out.cast = { id: 'liuChant', elem: 'holy', target: 'P' };
      if (u.afl >= 20) { const t = foes.reduce((a, c) => c.atk > a.atk ? c : a); freezeU(t, out, "Choáng"); }
      if (RNG.ch(0.3)) out.say = [u.id, RNG.pick(["Đừng loạn, cứ theo quy củ.", "Lão phu làm giấy thông hành bốn mươi năm, chưa thấy ai vô lý thế này.", "An Hồn Kinh tụng tới đây rồi — đừng động."])]; }
    else { const st = compStart(b, u, 'stun', foes, out), t = st || RNG.pick(foes); out.cast = { id: 'liuBell', elem: 'holy', target: t.id, wx: 'shui' }; hit(b, u, t, 0.85, 'holy', out, { sk: { ap: 'stun', apc: st ? 1 : 0.3 } }); }
  } else if (u.comp === 'tie') {   // 铁蛋：火铳灼烧；每三招给前排加固
    if (u.n % 3 === 0) { const T = b.units.filter(x => x.side === 'p' && x.hp > 0 && x.kind !== 'ward' && (u.afl >= 10 || isFrontU(x) || x.kind === 'minion'));
      T.forEach(x => { x.st.tieArm = 3; }); out.pops.push([T.includes(P) ? 'P' : (T[0] || u).id, "Gia cố", 'buff']); out.cast = { id: 'tieBolt', elem: 'phys', target: 'P' };
      if (RNG.ch(0.3)) out.say = [u.id, RNG.pick(["Sư phụ bảo đinh tán phải đóng ba lần!", "Miếng giáp này chính tay ta gõ đấy!", "Giữ vững, ta lắp thêm cho một miếng!"])]; }
    else if (u.afl >= 20) { out.cast = { id: 'tieGun', elem: 'fire', aoe: true }; foes.forEach(f => hit(b, u, f, 0.55, 'fire', out, { aoe: 1, sk: { ap: 'burn', apc: 0.5 } })); }
    else { const st = compStart(b, u, 'burn', foes, out), t = st || RNG.pick(foes); out.cast = { id: 'tieGun', elem: 'fire', target: t.id, wx: 'huo' }; hit(b, u, t, 0.9, 'fire', out, { sk: { ap: 'burn', apc: st ? 1 : 0.6 } }); }
  }
}
function ngocAct(b, u, out) {
  if (u.comp) return compAct(b, u, out);
  const P = b.P, foes = aliveOf(b, 'e'); if (!foes.length) return;
  if (u.healCd > 0) u.healCd--;
  addRage(u, 9);
  if (RNG.ch(0.16)) { out.say = [u.id, RNG.pick(NGOC_QUIPS[u.fox ? 'fox' : 'normal'])]; }
  const tm = b.run && b.run.team;
  const HT = tm ? teamLow(b, u.afl >= 10 ? 0.8 : 0.7) : (P.hp > 0 && P.hp / P.maxHp < 0.6 ? P : null);   // 组队：全队谁血量比例最低先奶谁
  if (HT && u.healCd <= 0) {
    heal(HT, HT.maxHp * (u.fox ? 0.15 : 0.1), out); u.healCd = 3;
    if (tm && u.afl >= 10) { delete HT.st.poison; delete HT.st.frozen; }
    if (tm && u.afl >= 20) b.units.filter(x => x.side === 'p' && x !== P && x.hp > 0 && x.kind !== 'ward').forEach(x => heal(x, x.maxHp * 0.15, out, true));
    out.lines.push(HT === P ? (u.fox ? "Hồ quang của Ngoc bao trùm lấy bạn" : "Ngoc ném tới một gói thuốc") : `Ngoc chữa thương cho ${HT.name}`);
    out.cast = { id: u.fox ? 'foxHeal' : 'ngocHeal', elem: 'heal', target: HT.id }; return;
  }
  if (u.fox) {
    if (RNG.ch(0.3)) { out.cast = { id: 'foxfireAll', elem: 'fire', aoe: true }; foes.forEach(f => hit(b, u, f, 0.55, 'fire', out, { aoe: 1, sk: { ap: 'burn', apc: 0.4 } })); }
    else { const t = compStart(b, u, 'burn', foes, out) || RNG.pick(foes); out.cast = { id: 'foxfire', elem: 'fire', target: t.id }; hit(b, u, t, 1, 'fire', out, { sk: { ap: 'burn' } }); }
  } else { const t = foes[0]; out.cast = { id: 'potionThrow', elem: 'poison', target: t.id }; hit(b, u, t, 0.8, 'magic', out, { sk: { ap: 'burn', apc: 0.5 } }); }
}

// ---------------- 必杀技 ----------------
// 2026-11-24 改成主动按钮（用户定）：怒气满了点「必杀」才有职业增益（加上打断妖王蓄力、伙伴合击）；
//   自动出招时程序只在妖物蓄力时替你放，只有打断效果。怒气同一趟里跨场保留。增益收着做：必杀带来的伤害占比压在一成以内
const ULTS = {
  berserker: { n: "Nhập Ma", g: "MA", s: "Sát thương +60%", elem: 'phys', wx: 'jin', d: "Trong ba lượt sát thương +60%; Nộ ý +30, 20% sát thương gây ra hồi thành khí huyết (mặc bộ Bất Tử thì không cộng Nộ ý, không hút máu, để khỏi hút máu lên lại)" },
  mage:      { n: "Ngũ Hành Quy Nhất", g: "QUY", s: "Sát thương ×2", elem: 'light', wx: 'mu', d: "Trong ba lượt sát thương gấp đôi; hai chiêu tiếp theo chắc chắn chí mạng" },
  necro:     { n: "Bách Quỷ Hoàn Hồn", g: "QUỶ", s: "Đầy thi · độc phát", elem: 'magic', wx: 'shui', d: "Lấp đầy thi vị, Thi Vương bò lên quét cả trận bốn lượt (từ cấp 25); trong ba lượt bạn và cương thi sát thương +40%; độc trên mọi yêu vật lập tức kết toán hai lần. Mặc Ngũ Độc Độc Hành thì không gọi thi, độc đổi thành kết toán bốn lần" },
  assassin:  { n: "Vô Ảnh Thiên Nhận", g: "ẢNH", s: "Đoạt mệnh · hồi chiêu", elem: 'phys', wx: 'jin', d: "Đánh Đoạt Mệnh Ấn lên cả trận; mọi chiêu hồi chiêu -2; Sát ý +3 (mặc Thiên Cơ thì đổi thành: cả trận trúng độc, ám khí hồi chiêu về 0, trong ba lượt sát thương +60%)" },
  cutG: "ĐOẠN",
  paladin:   { n: "Kim Thân", g: "PHẬT", s: "Kim Cương Chấn · hộ thể", elem: 'holy', wx: 'tu', d: "Lập tức đánh ra một lần Kim Cương Chấn (không tốn «Chấn»); nhận hộ thể bằng 30% khí huyết; trong ba lượt Phản chấn ×5, sát thương Phật quang +50%" },
};
// 2026-11-24 第二版（用户定）：攒得慢（主角怒气获取 ×gain）、能存两格（maxR 200，一格 100）、效果做大，留着打妖王；自动出招只用第二格替你打断，永远给你留一格
// 回合数：状态在自己回合开头扣，记 4＝三回合
const ULT = { gain: 0.4, maxR: 200, furyAdd: 30, rmDmg: 0.6, rmLee: 0.2, rmT: 4, crit2: 2, gyDmg: 1, zomb: 9, duK: 2, bgDmg: 0.4, ki: 3, cdCut: 2, qrT: 4, qrDmg: 0.6, zhen: 0, jsSh: 0.3, jsThk: 4, jsHoly: 0.5, jsT: 4, sw: 1 };
function lianCap(P) { return (P.fx.has('tianshi') ? 7 : 5) + (P.fx.has('wTaiyi') ? 2 : 0); }
function ultimate(b, P, foes, out, autoCut) {
  P.rage = Math.max(0, (P.rage || 0) - 100); b.ultReq = false; b.ults++;
  const U = ULTS[P.cls];
  let cut = 0;
  for (const f of foes) if (f.charging) { delete f.charging; cut++; out.pops.push([f.id, "Ngắt", 'buff']); out.lines.push(`Tụ lực của ${f.name} bị ngắt!`); }
  if (autoCut) {   // 自动出招：只替你打断
    out.ult = { cls: P.cls, n: "Ngắt", g: ULTS.cutG, combo: false, auto: 1 }; out.cast = { id: 'ult', elem: U.elem, aoe: true, cls: P.cls, cut: 1 };
    out.lines.push("Nhân lúc nó tụ lực, bạn quát lớn một tiếng cắt đứt nó!"); return;
  }
  const NG = b.units.find(u => u.kind === 'ally' && u.hp > 0);
  const J = b.units.filter(u => u.kind === 'ally' && u.hp > 0 && u.rage >= 100);   // 怒气满的伙伴一起出手
  const combo = J.length > 0;
  J.forEach(u => { u.rage = 0; });
  out.ult = { cls: P.cls, n: combo ? (J.length > 1 ? `${J.length + 1} người hợp kích · ` : "Song nhân hợp kích · ") + U.n : U.n, g: U.g, combo, comp: NG && NG.comp, sprs: J.map(u => u.spr) };
  out.cast = { id: 'ult', elem: U.elem, aoe: true, cls: P.cls, combo };
  out.lines.push(combo ? `Bạn và ${J.map(u => u.name).join(", ")} cùng ra tay — “${U.n}”!` : `Tuyệt kỹ “${U.n}”!`);
  if (b.run && b.run.team) J.forEach(u => {   // 合击里各带一段
    if (u.cid === 'zhen') { foes.forEach(f => freezeU(f, out, "Choáng")); out.pops.push([u.id, "Xích sắt", 'buff']); }
    else if (u.cid === 'ngoc') { b.units.filter(x => x.side === 'p' && x.hp > 0 && x.kind !== 'ward').forEach(x => heal(x, x.maxHp * 0.15, out, true)); out.pops.push([u.id, "Hồ quang", 'buff']); }
    else if (u.cid === 'long') { b.units.filter(x => x.side === 'p' && x.hp > 0 && x.kind !== 'ward').forEach(x => { x.st.warcry = Math.max(x.st.warcry || 0, 3); }); out.pops.push([u.id, "Chính khí", 'buff']); }
    else if (u.cid === 'kang') { const capS = Math.round(P.maxHp * 0.5); P.shield = Math.min(Math.max(capS, P.shield || 0), (P.shield || 0) + Math.round(P.maxHp * 0.15)); out.pops.push(['P', "Hộ Thể", 'buff']); }
    else if (u.cid === 'lei') { foes.forEach(f => { f.st.melt = Math.max(f.st.melt || 0, 3); }); out.pops.push([u.id, "Giải Giáp", 'buff']); }
    else if (u.cid === 'liu') { b.liuDrV = Math.max(b.liuDrV || 0, u.afl >= 10 ? 0.3 : 0.2); b.units.filter(x => x.side === 'p' && x.hp > 0 && x.kind !== 'ward').forEach(x => { x.st.liuDr = 4; }); out.pops.push([u.id, "Kinh thanh", 'buff']); }
    else if (u.cid === 'tie') { b.units.filter(x => x.side === 'p' && x.hp > 0 && x.kind !== 'ward').forEach(x => { x.st.tieArm = 4; }); foes.forEach(f => stSet(u, f, 'burn', out)); out.pops.push([u.id, "Hỏa súng tề minh", 'buff']); }
  });
  switch (P.cls) {
    case 'berserker': if (!P.fx.has('buSi4')) P.fury = Math.min(100, (P.fury || 0) + ULT.furyAdd); P.st.rumo = ULT.rmT;   // 不死套不灌怒意（满怒会改去放霸王卸甲） out.pops.push(['P', '入魔', 'crit']); break;
    case 'mage': { out.pops.push(['P', "Quy nhất", 'crit']);   // 不再灌「连」：天师叠满就清零，灌满反而打断归元
      P.ultCrit = (P.ultCrit || 0) + ULT.crit2; P.st.guiyi = ULT.rmT; break; }
    case 'necro': {
      const solo = P.fx.has('duXing4');   // 五毒独行吃空尸位：不起尸，毒多结算一次
      const n = solo ? 0 : summonSkel(b, P, P.runes.summon || null, ULT.zomb); if (n) out.pops.push(['P', "Dậy xác", 'buff']);   // 尸位补满
      if (!solo && ULT.sw && P.lv >= 25 && !zombiesOf(b).some(z => z.zt === 'shiwang')) { makeZombie(b, P, 'shiwang', 9); out.lines.push("Mặt đất nứt ra — Thi Vương bò lên!"); }
      const K = (ULT.duK + (solo ? 2 : 0)) * (P.fx.has('duXing6') ? DUXING_BURST : 1) * (P.fx.has('wWandu') ? 1 + P.wpK : 1);
      foes.forEach(f => { const ps = f.st.poison; if (f.hp > 0 && ps) { out.pops.push([f.id, "Độc phát", 'poison']); hit(b, P, f, 0, 'poison', out, { flat: Math.round(ps.d * ps.t * K), proc: 1, aoe: 1, raw: 1, ult: 1 }); } }); P.st.baigui = ULT.rmT; break; }   // duK＝结算几次
    case 'assassin': { P.ki = Math.min(P.kiMax, (P.ki || 0) + (P.fx.has('qianJi4') ? 0 : ULT.ki)); if (!P.fx.has('qianJi4')) out.pops.push(['P', `Sát ý ${P.ki}`, 'buff']); out.pops.push(['P', `Sát ý ${P.ki}`, 'buff']);
      P.skills.forEach(k => { if (k.left > 0) k.left = Math.max(0, k.left - ULT.cdCut); });   // 所有招式冷却 -cdCut
      if (P.fx.has('qianJi4')) { foes.forEach(f => stSet(P, f, 'poison', out)); P.skills.forEach(k => { if (DART_SK.has(k.id)) k.left = 0; }); }   // 千机：全场上毒，暗器冷却清零
      foes.forEach(f => { f.st.mark = Math.max(f.st.mark || 0, ULT.qrT); out.pops.push([f.id, "Đánh dấu", 'curse']); });   // 全场打上夺命印
      if (P.fx.has('qianJi4')) { P.st.qianren = ULT.qrT; out.pops.push(['P', "Thiên nhận", 'crit']); } break; }
    case 'paladin': { P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * ULT.jsSh)); P.st.jsh = ULT.jsT; out.pops.push(['P', "Kim Thân", 'crit']);
      jinZhen(b, P, (P.thornK || 0) * (1 + (P.thornDmg || 0) / 100), out); break; }   // 立刻金刚震，不耗「震」
  }
  if (combo) { const cw = NG.wx || 'huo'; aliveOf(b, 'e').forEach(f => hit(b, NG, f, 1.2, WX_ELEM[cw], out, { ult: 1, aoe: 1, wx: cw })); heal(P, P.maxHp * 0.1, out); }
}
function skillReady(b, P, sk, foes) {
  switch (sk.id) {
    case 'whirl': return foes.length >= 2 || P.fx.has('buSi4');
    case 'fan': return foes.length >= 2 || P.fx.has('qianJi4');
    case 'warcry': return !P.st.warcry;
    case 'summon': return zombiesOf(b).filter(z => !ZOMBIES[z.zt].ult).length < P.minionCap;
    case 'jihuo': return zombiesOf(b).length > 0;
    case 'bonestorm': return zombiesOf(b).length > 0 || P.fx.has('duXing4');
    case 'yangshi': return zombiesOf(b).some(z => z.hp < z.maxHp * 0.8 || !z.st.yang);
    case 'bawang': return P.fury >= 40;
    case 'deathmark': case 'shadowkill': return P.ki >= Math.min(3, P.kiMax);
    case 'butui': return P.hp / P.maxHp < 0.75 && !P.st.butui;
    case 'yandun': return !P.st.smoke;
    case 'chanhou': return !P.st.chan;
    case 'curse': return !foes.some(f => f.st.curse);
    case 'corpse': return zombiesOf(b).some(z => !ZOMBIES[z.zt].ult);
    case 'shadowstep': return !P.st.shadow;
    case 'prayer': return P.hp / P.maxHp < 0.7 || !!(b.run && b.run.team && teamLow(b, 0.6));
    case 'aegis': return !(P.shield > P.maxHp * 0.05);
    default: return true;
  }
}
function skillCd(P, sk) {
  let cd = sk.cd; const fx = P.fx, R = P.runes[sk.id];
  if (sk.id === 'fireball' && fx.has('ignite')) cd--;
  if (sk.id === 'frostnova' && fx.has('shatter')) cd--;
  if (sk.id === 'whirl' && fx.has('rampage')) cd--;
  if (sk.id === 'whirl' && R === 'b') cd++;
  if (sk.id === 'meteor' && fx.has('archmage')) cd -= 2;
  if (sk.id === 'meteor' && R === 'b') cd += 2;
  if (sk.id === 'venom' && fx.has('venomFang')) cd--;
  if (sk.id === 'prayer' && fx.has('holyLight')) cd -= 2;
  if (sk.id === 'bloodlust' && fx.has('bloodPlus')) cd -= 2;
  if (sk.id === 'lunzhuan' && fx.has('detPlus')) cd -= 1;
  if (sk.id === 'shadowstep' && fx.has('shadow3')) cd -= 2;
  if (BUSI_SK.has(sk.id) && fx.has('buSi4')) cd--;
  if (sk.id === 'lunzhuan' && fx.has('wanFu6')) cd--;
  if (DART_SK.has(sk.id) && fx.has('qianJi4')) cd--;
  if (sk.id === 'budong' && R === 'b') cd++;
  if ((sk.id === 'frostnova' || sk.id === 'luoshi') && fx.has('xuantian')) cd--;
  if (sk.id === 'yandun' && fx.has('youying')) cd -= 2;
  if (sk.id === 'aegis' && fx.has('jingangjia')) cd -= 2;
  if ((sk.id === 'lieyan' && fx.has('cLieyan')) || (sk.id === 'wulei' && fx.has('cWulei')) || (sk.id === 'dici' && fx.has('cDici'))) cd--;
  if ((sk.id === 'warcry' && fx.has('cWarcry')) || (sk.id === 'curse' && fx.has('cCurse')) || (sk.id === 'judgement' && fx.has('cJudge'))) cd -= 2;
  if (sk.id === 'butui' && fx.has('nutao')) cd -= 2;
  if (fx.has('cdr')) cd--;
  return Math.max(1, cd);
}
// 吃丹药：回最大气血的 45%。可以自己点（随时，不占出手），也会在气血低于 35% 时自动吃
function drinkPotion(b, out) {
  const P = b.P, run = b.run;
  if (!P || b.over || P.hp <= 0 || !run || run.potions <= 0 || P.hp >= P.maxHp || P.fx.has('gDrunk')) return false;   // 醉仙巾：不吃丹药
  if (P.fx.has('gGourd')) { P.st.gourd = 3; out.pops.push(['P', "Huyền hồ", 'buff']); }
  run.potions--; heal(P, P.maxHp * 0.45 * (P.fx.has('potionPlus') ? 1.6 : 1) * (1 + bLv('alchemist') * 0.1), out);
  out.lines.push(`Bạn uống một bình thuốc (còn ${run.potions} bình)`);
  return true;
}
// 普攻扳指（通关后的职业神兵）：五招都带满的时候普攻几乎不出手，所以改成「每次出招后顺手补一记普攻」，不占出手
function basicFollow(b, P, out) {
  const foes = aliveOf(b, 'e'); if (!foes.length || P.hp <= 0) return;
  const t = (b.target && foes.find(f => f.id === b.target)) || foes[0], FX = P.fx;
  if (FX.has('cSlash')) { if (hit(b, P, t, 0.6, 'phys', out) && t.hp > 0 && RNG.ch(0.5)) stSet(P, t, 'armor', out); P.fury = Math.min(100, (P.fury || 0) + 3); out.pops.push(['P', "Khai Sơn", 'buff']); }   // 开山扳指
  if (FX.has('cMissile')) { const al = aliveOf(b, 'e'); if (al.length) hit(b, P, RNG.pick(al), 0.9, 'magic', out); out.pops.push(['P', "Linh Phù", 'buff']); }            // 灵符扳指
  if (FX.has('cSpear')) { if (hit(b, P, t, 0.6, 'magic', out) && t.hp > 0) { b.focus = t.id; applyPoison(P, t, 35, P.poisonPct || 0); out.pops.push([t.id, "Trấn hồn", 'curse']); } }   // 镇魂扳指
  if (FX.has('cTwin')) { hit(b, P, t, 0.4, 'phys', out); const t2 = aliveOf(b, 'e')[0]; if (t2) hit(b, P, t2, 0.4, 'phys', out, { crit: 1 }); if (RNG.ch(0.5)) P.ki = Math.min(P.kiMax, (P.ki || 0) + 1); }   // 双生刺环
  if (FX.has('cHoly')) { hit(b, P, t, 1, 'holy', out); const capS = Math.round(P.maxHp * 0.5); if ((P.shield || 0) < capS) P.shield = Math.min(capS, (P.shield || 0) + Math.round(P.maxHp * 0.03)); out.pops.push(['P', "La Hán", 'buff']); }   // 金刚指环
}
const BASIC_FX = ['cSlash', 'cMissile', 'cSpear', 'cTwin', 'cHoly'];
function heroAct(b, P, out) {
  const run = b.run;
  b.pr = (b.pr || 0) + 1;
  if (P.hasteN > 0 && b.pr > 1) P.hasteN--;
  b.thTurn = 0;   // 反震的封顶按「一次出手」算
  if (P.jy && P.jy.tongyou && RNG.ch(P.jy.tongyou / 100)) { const ks = P.skills.filter(k => k.left > 0); if (ks.length) { RNG.pick(ks).left = 0; out.pops.push(['P', "Thông U", 'buff']); } }   // 九幽·通幽
  P.cbOn = !!P.cbNext; P.cbNext = false;   // 会心：上一招暴击过，这一招增伤
  P.kcOn = !!P.kcNext; P.kcNext = false;   // 连环戒：上一招之后有敌人倒下，这一招必暴
  P.evOn = !!P.evNext; P.evNext = false;   // 逍遥履：闪过之后这一招增伤
  if (b.pr === 1) {
    if (b.dice) { out.pops.push(['P', { dmg: "Xúc xắc · sát thương", spd: "Xúc xắc · tốc độ", crit: "Xúc xắc · chí mạng", dr: "Xúc xắc · giảm thương" }[b.dice], 'buff']); out.lines.push("Lục Bác Đao gieo ra: " + { dmg: "sát thương +25%", spd: "tốc độ +25%", crit: "chí mạng +20%", dr: "sát thương phải nhận -20%" }[b.dice]); }
    const lf = b.units.find(u => u.side === 'e' && u.hp > 0 && u.st.lamp); if (lf) out.pops.push([lf.id, "Dẫn hồn", 'curse']);
  }
  if (P.fx.has('gYinYang')) { P.yy = b.pr % 2 === 1 ? 'yang' : 'yin'; out.pops.push(['P', P.yy === 'yang' ? "Dương" : "âm u", 'buff']); }   // 两仪佩
  if (b.revQ && b.revQ.length) {   // 赶尸索：倒下的僵尸过 3 回合自己爬起来
    for (const q of b.revQ) q.t--;
    for (const q of b.revQ.filter(x => x.t <= 0)) { if (!zombiesOf(b).some(z => z.slot === q.slot && !ZOMBIES[z.zt].ult)) { const z = makeZombie(b, P, q.zt, q.slot, P.runes.summon || null); out.pops.push([z.id, "Dậy xác", 'buff']); out.lines.push(`${z.name} tự bò dậy`); } }
    b.revQ = b.revQ.filter(x => x.t > 0);
  }
  if (riftB(b)) { const w = wearyN(b); if (w === 1) { out.lines.push("Đánh lâu lộ sơ hở: khí tức yêu vật rối loạn — không hồi máu nữa, từ đây mỗi vòng nhận thêm " + Math.round(R_WEARY[1] * 100) + "% sát thương"); aliveOf(b, 'e').forEach(f => out.pops.push([f.id, "Phá Trán", 'react'])); } b.weary = w; }
  if (P.hp / P.maxHp < 0.35 && run.potions > 0) drinkPotion(b, out);   // 兜底：气血低于 35% 自动吃一颗
  for (const sk of P.skills) if (sk.left > 0) sk.left--;
  let foes = aliveOf(b, 'e'); if (!foes.length) return;
  let sk;
  if (b.castAuto) sk = autoPick(b, P, foes);
  else { sk = b.castReq && P.skills.find(k => k.id === b.castReq && k.left <= 0); b.castReq = null; if (!sk) sk = P.skills.find(k => !k.cd); }
  if (b.target && foes.some(f => f.id === b.target)) foes = [foes.find(f => f.id === b.target), ...foes.filter(f => f.id !== b.target)];   // 手动点了目标
  else if (sk.pay) foes = foes.slice().sort((x, y) => stHas(y, sk.pay.s) - stHas(x, sk.pay.s));   // 收招打带状态的那个
  // 五行道士「五行流转」（2026-11 改）：换一种五行 +1（五行归元 4 件 +2）；同一种五行连着放不加不扣；普攻灵符不算五行，不加也不打断。没有顺序要求
  if (P.cls === 'mage' && sk.wx) { const cap = (P.fx.has('tianshi') ? 7 : 5) + (P.fx.has('wTaiyi') ? 2 : 0);
    const lian0 = P.lian, same = P.lastWx === sk.wx;
    if (!same) P.lian = Math.min(cap, P.lian + (P.fx.has('guiYuan4') ? 2 : 1));
    if (!same && P.lgv && P.lgv.wuxing != null && foes[0] && RNG.ch(LGV.wxCh(P.lgv.wuxing) / 100)) { const st = { huo: 'burn', shui: 'chill', tu: 'armor', mu: 'poison', jin: 'stun' }[sk.wx]; if (st) stSet(P, foes[0], st, out); }   // 五行玉：换五行时挂上这一行的状态
    b.guiCast = !same && P.fx.has('guiYuan4');   // 五行归元 4 件：换五行的这一招 +20%
    P.lastWx = sk.wx;
    if (P.fx.has('cLianFloor')) P.lian = Math.max(P.lian, 2);   // 太乙道袍
    if (P.cls === 'mage' && (P.lian > lian0 || P.lian === cap)) { const capS = Math.round(P.maxHp * mageCap(P) / 100), add = Math.round(P.maxHp * sustV(P, 'a') / 100); if ((P.shield || 0) < capS) { P.shield = Math.min(capS, (P.shield || 0) + add); out.pops.push(['P', "Hộ Thể", 'buff']); } }
    if (P.fx.has('wanFu4') && sk.ap && !(P.lian > lian0)) { const capS = Math.round(P.maxHp * mageCap(P) / 100), add = Math.round(P.maxHp * sustV(P, 'a') / 100); if ((P.shield || 0) < capS) { P.shield = Math.min(capS, (P.shield || 0) + add); out.pops.push(['P', "Hộ Thể", 'buff']); } }
    if (P.fx.has('wuxingBelt') && P.lian >= 5) for (const k2 of P.skills) if (k2 !== sk && k2.left > 0) k2.left--;   // 五行绦
    if (P.fx.has('guiYuan6') && P.lian >= 5) { b.guiYuan = true; out.pops.push(['P', "Quy Nguyên", 'crit']); }
    if (P.lian) out.pops.push(['P', `Liên ${P.lian}`, 'buff']);
    if (P.fx.has('tianshi') && P.lian >= cap) { b.castCrit = true; b.lianReset = true; } }
  if (P.ultCrit > 0) { b.castCrit = true; P.ultCrit--; }   // 五行归一：接下来两招必暴
  const nFoe0 = aliveOf(b, 'e').length;
  const bw0 = !!P.st.bwNext;
  const ki0 = P.ki || 0, dz = sk.id === 'dici' && P.fx.has('cDici') && foes[0] && foes[0].st.frozen; b.kiSnap = sk.fin ? ki0 : null;
  b.ssOn = P.ssN || 0; cast(b, P, sk, foes, out); b.kiSnap = null; b.guiCast = false; if (b.ssOn) { P.ssN = 0; b.ssOn = 0; }   // 嗜杀玉：这一招吃掉攒的层数
  if (P.lgv && P.lgv.duopo != null && ['venom', 'bingpo', 'fan'].includes(sk.id) && P.ki < P.kiMax && RNG.ch(LGV.dpKi(P.lgv.duopo) / 100)) { P.ki++; out.pops.push(['P', "Đoạt Phách", 'buff']); }   // 夺魄玉
  if (sk.id === 'lieyan' && P.fx.has('cLieyan')) P.fury = Math.min(100, (P.fury || 0) + 10);                              // 焚天靴
  if (dz) P.ki = Math.min(P.kiMax, P.ki + 1);
  if (sk.cd && BASIC_FX.some(k => P.fx.has(k))) basicFollow(b, P, out);                                                                               // 地煞衣
  if (sk.fin && P.fx.has('cKiBack') && ki0 > P.ki) { const back = Math.floor((ki0 - P.ki) / 2); if (back) { P.ki = Math.min(P.kiMax, P.ki + back); out.pops.push(['P', "Hồi toàn", 'buff']); } }   // 回旋镖囊
  b.castCrit = false; b.guiYuan = false; if (bw0 && sk.id !== 'bawang') delete P.st.bwNext; if (b.lianReset) { b.lianReset = false; P.lian = P.fx.has('cLianFloor') ? 2 : 0; out.pops.push(['P', "Thiên Sư", 'crit']); }
  if (P.cls === 'berserker') P.fury = Math.min(100, (P.fury || 0) + 5 * (1 + (P.furyGain || 0) / 100) + (sk.id === 'warcry' ? 30 : 0));
  if (P.cls === 'assassin' && sk.ki) P.ki = Math.min(P.kiMax, P.ki + sk.ki);
  if (sk.cd) {
    sk.left = skillCd(P, sk);
    if (P.cdSkip && RNG.ch(Math.min(CDSKIP_CAP, P.cdSkip) / 100)) { sk.left = 0; out.pops.push(['P', "Lưu quang", 'buff']); }   // 所有来源合计最多 40%
    if (P.fx.has('gBlink') && !b.blink) { b.blink = true; sk.left = 0; out.pops.push(['P', "Súc địa", 'buff']); }   // 缩地靴
    foes = aliveOf(b, 'e');
    if (P.fx.has('doubleCast') && foes.length && RNG.ch(0.2) && skillReady(b, P, sk, foes)) {
      out.lines.push("Song Sinh Giới: kỹ năng tung lại lần nữa!"); cast(b, P, sk, foes, out);
    }
    if (sk.fin && P.fx.has('qiSha6') && aliveOf(b, 'e').length < nFoe0) { sk.left = 0; out.pops.push(['P', "Thất Sát", 'crit']); }
  }
  if (sk.fin && P.fx.has('qiSha4')) P.ki = Math.min(P.kiMax, P.ki + 2);
  if (sk.cd && P.fx.has('daRi6') && P.shield > 0 && P.hp > 0) {   // 大日如来：出招后护体真气震荡，打所有敌人（护体不消耗）
    const al = aliveOf(b, 'e'), wd = P.fx.has('wDari');
    if (al.length) { out.pops.push(['P', "Đại Nhật", 'crit']); let nh = 0; al.forEach(f => { if (hit(b, P, f, DARI_HIT * (wd ? 1 + 0.75 * P.wpK : 1), 'holy', out, { proc: 1, aoe: 1 })) nh++; }); if (wd && nh) heal(P, P.maxHp * 0.02 * nh, out, true); }
  }
  if (P.fx.has('wXiuluo') && BUSI_SK.has(sk.id) && P.hp > 0) { const al = aliveOf(b, 'e'); if (al.length) { out.pops.push(['P', "Tu La Huyết Nhận", 'crit']); al.forEach(f => hit(b, P, f, 0.6 * P.wpK, 'phys', out, { proc: 1, aoe: 1 })); } }
  if (P.yi.langwang && RNG.ch((18 + P.yi.langwang * 5) / 100)) { const t2 = aliveOf(b, 'e')[0];
    if (t2) { out.pops.push([t2.id, "Bóng sói", 'crit']); out.yi = 'langwang'; hit(b, P, t2, 0.6 + P.yi.langwang * 0.2, 'phys', out, { proc: 1 }); } }
}
// 自动出招：有状态先收招，没状态先起手；职业各有讲究
function autoPick(b, P, foes) {
  const ready = P.skills.filter(k => k.cd && k.left <= 0 && skillReady(b, P, k, foes)), basic = P.skills.find(k => !k.cd);
  const has = s => foes.some(f => stHas(f, s)), pick = id => ready.find(k => k.id === id);
  const FX = P.fx;
  if (P.cls === 'necro' && FX.has('duXing4')) {   // 五毒独行：不召尸。先让人人带毒，叠着毒等尸毒蔓、土遁葬来结算
    const r2 = ready.filter(k => !['summon', 'jihuo', 'yangshi', 'corpse'].includes(k.id)), p2 = id => r2.find(k => k.id === id);
    const allPois = foes.every(f => f.st.poison);
    if (!allPois && p2('shidu')) return p2('shidu');
    if (FX.has('duXing6') && foes.some(f => f.st.poison)) { const x = p2('tudun') || p2('shidu'); if (x) return x; }
    if (foes.length >= 3 && p2('curse')) return p2('curse');
    if (FX.has('duXing6')) return (foes.length >= 3 ? p2('bonestorm') : null) || basic;   // 招式都在冷却：用镇魂钉接着叠毒
    return p2('tudun') || p2('bonestorm') || p2('shidu') || p2('curse') || basic;
  }
  if (P.cls === 'mage' && FX.has('wanFu4')) {   // 万符归宗：不管相生。先把状态挂齐（蔓延到全场），再引爆
    const n = Math.max(...foes.map(f => stHas(f, 'any'))), det = pick('lunzhuan');
    if (det && n >= (FX.has('wanFu6') ? 2 : 3)) return det;
    const ap = ready.filter(k => k.ap && !foes.every(f => stHas(f, k.ap))).sort((x, y) => (y.k === 'aoe' || y.id === 'frostnova' ? 1 : 0) - (x.k === 'aoe' || x.id === 'frostnova' ? 1 : 0))[0];
    if (ap) return ap;
    if (det && n >= 1) return det;
    const py = ready.find(k => k.pay && k.id !== 'lunzhuan' && has(k.pay.s)); if (py) return py;
    return ready.find(k => k.id !== 'lunzhuan') || basic;
  }
  if (P.cls === 'berserker' && FX.has('buSi4') && !(P.fury >= 80 && pick('bawang') && foes.length < 2)) { const x = (foes.some(f => f.st.melt) ? pick('whirl') : null) || pick('liedi') || pick('whirl'); if (x) return x; }
  if (P.cls === 'assassin' && FX.has('qianJi4')) { const pz = foes.some(f => f.st.poison); const x = (!foes.every(f => f.st.poison) ? pick('venom') : null) || (pz ? pick('fan') || pick('bingpo') : null); if (x && !(P.ki >= P.kiMax && ready.some(k => k.fin))) return x; }
  if (P.cls === 'necro' && pick('summon') && zombiesOf(b).filter(z => !ZOMBIES[z.zt].ult).length < Math.min(2, P.minionCap)) return pick('summon');
  if (P.cls === 'paladin' && P.hp / P.maxHp < 0.5 && (pick('prayer') || pick('aegis'))) return pick('prayer') || pick('aegis');
  if (P.cls === 'berserker' && P.fury >= 80 && pick('bawang')) return pick('bawang');
  if (P.cls === 'assassin' && P.ki >= P.kiMax - 1) { const f = ready.find(k => k.fin && k.pay && has(k.pay.s)) || ready.find(k => k.fin); if (f) return f; }
  if (P.cls === 'mage') {   // 五行道士：自动出招按木→火→土→金→水轮着放（只是自动出招的习惯，没有加成），接不上就换一种五行
    const nx = P.lastWx ? WX_SHENG[P.lastWx] : null, cont = nx ? ready.filter(k => k.wx === nx) : [];
    const pk = L => L.find(k => k.pay && has(k.pay.s)) || L.find(k => k.ap && !has(k.ap)) || L.find(k => !k.fin);
    const c = cont.length && pk(cont); if (c) return c; if (nx && basic.wx === nx) return basic;
    const dif = ready.filter(k => k.wx !== P.lastWx), c2 = dif.length && pk(dif); if (c2) return c2;
    if (P.lastWx && basic.wx !== P.lastWx && !ready.length) return basic; }
  const pay = ready.find(k => k.pay && !k.fin && has(k.pay.s)); if (pay) return pay;
  const start = ready.find(k => k.ap && !has(k.ap)); if (start) return start;
  return ready.find(k => !k.fin && k.id !== 'bawang') || basic;
}
function cast(b, P, sk, foes, out) {
  b.castWx = sk.wx; b.castSk = sk;
  try { castInner(b, P, sk, foes, out); } finally { b.castWx = null; b.castSk = null; b.castAoe = false; }
}
function castInner(b, P, sk, foes, out) {
  const t = foes[0], R = P.runes[sk.id] || null;
  let m = 1 + ((P.sk && P.sk[sk.id]) || 0) / 100;
  const hp = (pct) => P.maxHp * pct * (1 + (P.healPct || 0) / 100);
  if (sk.cd) out.lines.push(`Bạn thi triển “${sk.n}”${R ? '·' + RUNES[sk.id][R === 'a' ? 0 : 1].n : ''}`);
  const elemOf = { slash: 'phys', whirl: 'phys', bloodlust: 'phys', missile: 'magic', fireball: 'fire', frostnova: 'cold', chain: 'light',
    meteor: R === 'a' ? 'cold' : 'fire', bonespear: 'magic', corpse: 'magic', bonestorm: 'magic', twin: 'phys', venom: 'poison', fan: 'phys',
    deathmark: 'phys', holy: 'holy', hammer: 'holy', judgement: 'holy', jihuo: 'phys', shadowkill: 'phys', bawang: 'phys', wulei: 'light' }[sk.id];
  const aoe = ['whirl', 'frostnova', 'meteor', 'corpse', 'bonestorm', 'fan', 'judgement', 'chain'].includes(sk.id) || (sk.id === 'hammer' && P.fx.has('wrath')) || (sk.id === 'venom' && R === 'b') || (sk.id === 'fireball' && R);
  out.cast = { id: sk.id, elem: elemOf || 'buff', aoe, target: t && t.id, wx: b.castWx };
  b.castAoe = aoe || sk.k === 'aoe';   // 连环玉看这个
  if (sk.k) return castGen(b, P, sk, foes, out, m);
  const all = (mult, elem, after) => foes.forEach(f => { const d = hit(b, P, f, mult, elem, out, { aoe: 1 }); if (after) after(f, d); });
  switch (sk.id) {
    case 'slash': hit(b, P, t, m, 'phys', out); break;
    case 'missile': hit(b, P, t, m * 1.1, elemOf, out); break;
    case 'holy': hit(b, P, t, m * 1.15, elemOf, out); break;
    case 'bonespear': hit(b, P, t, m * 0.6, elemOf, out); if (t.hp > 0) { b.focus = t.id; out.pops.push([t.id, "Trấn hồn", 'curse']);
      if (P.fx.has('duXing4')) { applyPoison(P, t, 35, P.poisonPct || 0); out.pops.push([t.id, "Trúng độc", 'poison', 1]); } } break;
    case 'whirl': {
      for (let r = 0; r < (P.fx.has('whirl2') ? 2 : 1); r++) {
        let n = 0; aliveOf(b, 'e').forEach(f => { const ml = !!f.st.melt; if (hit(b, P, f, 0.7 * m * (R === 'b' ? 1.5 : 1), 'phys', out, { aoe: 1 })) { n++; if (ml && P.fx.has('liediOff')) P.fury = Math.min(100, (P.fury || 0) + 5); } });
        if (P.fx.has('buSi4') && n) heal(P, P.maxHp * 0.03 * n, out);
        if (P.fx.has('rampage')) heal(P, P.maxHp * 0.05, out);
        if ((R === 'a' || P.fx.has('whirl2')) && n) heal(P, P.maxHp * 0.02 * n, out);
      }
      break;
    }
    case 'warcry': P.st.warcry = 4; out.pops.push(['P', "Chiến hống", 'buff']); if (P.fx.has('cWarcry')) b.units.filter(u => (u.kind === 'ally' || u.kind === 'minion') && u.hp > 0).forEach(u => { u.st.warcry = 4; out.pops.push([u.id, "Chiến hống", 'buff']); }); if (R === 'a') foes.forEach(f => { f.st.curse = 4; out.pops.push([f.id, "Chấn Nhiếp", 'curse', 1]); }); break;
    case 'bloodlust': { const mm = 1.8 * m * (R === 'a' && t.hp / t.maxHp < 0.4 ? 2 : 1); const d = hit(b, P, t, mm, 'phys', out); if (d) heal(P, d * (R === 'b' ? 1 : 0.5) * (P.fx.has('bloodPlus') ? 2 : 1), out); break; }
    case 'fireball': {
      const ign = f => { if (f.hp > 0 && P.fx.has('ignite')) { f.st.burn = { d: P.atk * 0.5 * (1 + P.elem / 100), t: 3 + stExt(P) }; out.pops.push([f.id, "Bốc cháy", 'fire', 1]); } };
      if (R === 'a') RNG.shuffle(foes).slice(0, 3).forEach(f => { if (hit(b, P, f, 0.8 * m, 'fire', out, { aoe: 1 })) ign(f); });
      else { const d = hit(b, P, t, 1.8 * m, 'fire', out); if (d) { ign(t); if (R === 'b') foes.filter(f => f !== t).forEach(f => hit(b, P, f, m, 'fire', out, { proc: 1 })); } }
      break;
    }
    case 'frostnova': all(0.45 * m * (R === 'a' ? 0.5 : R === 'b' ? 2 : 1), 'cold', f => { if (R === 'a' && RNG.ch(0.6)) freezeU(f, out); }); break;
    case 'chain': RNG.shuffle(foes).slice(0, P.fx.has('chainAll') ? 99 : R === 'a' ? 5 : R === 'b' ? 2 : 3).forEach(f => hit(b, P, f, 1.2 * m * (R === 'b' ? 1.6 : 1), 'light', out, { aoe: 1 })); break;
    case 'meteor': all(2.0 * m * (R === 'b' ? 1.5 : 1), R === 'a' ? 'cold' : 'fire', f => { if (R === 'a') freezeU(f, out); }); break;
    case 'summon': if (!summonSkel(b, P, R, R === 'a' ? 2 : 1)) out.lines.push("Thi vị đã đầy"); break;
    case 'jihuo': { out.cast.aoe = false;
      const volley = () => zombiesOf(b).forEach(z => { const tt = t.hp > 0 ? t : aliveOf(b, 'e')[0]; if (tt) hit(b, z, tt, (z.st.yang ? 1.3 : 1) * (R === 'a' ? 1.3 : 1), z.ae || 'phys', out, { sk }); });
      volley();
      if (P.fx.has('shehunOff') && RNG.ch(0.3) && aliveOf(b, 'e').length) { out.pops.push(['P', "Chuông Nhiếp Hồn", 'crit']); volley(); }
      if (R === 'b' && zombiesOf(b).length) { P.st.guardZ = 1; out.pops.push(['P', "Hộ Chủ", 'buff']); }
      break; }
    case 'yangshi': if (R === 'a') summonSkel(b, P, P.runes.summon || null, 1);
      zombiesOf(b).forEach(z => { heal(z, z.maxHp * 0.3, out); z.st.yang = 3; }); if (R === 'b') P.st.shijia = 3; out.pops.push(['P', "Dưỡng thi", 'buff']); break;
    case 'curse': foes.forEach(f => { f.st.curse = 4; if (R === 'a') f.st.curseW = true; if (R === 'b') f.st.curseB = true; out.pops.push([f.id, "Nguyền rủa", 'curse', 1]); }); break;
    case 'corpse': {   // 尸爆：炸掉血最少的一具僵尸
      for (let i = 0; i < (R === 'a' ? 2 : 1); i++) {
        const Z = zombiesOf(b).filter(z => !ZOMBIES[z.zt].ult).sort((x, y) => x.hp - y.hp)[0]; if (!Z) break;
        const dmg = Math.round(Z.hp * 0.8 * m * (1 + (P.elem || 0) / 200)); Z.hp = 0; out.pops.push([Z.id, "Thi Bạo", 'fire']);
        aliveOf(b, 'e').forEach(f => { hit(b, P, f, 0, 'magic', out, { aoe: 1, flat: dmg }); if (f.hp > 0 && P.fx.has('plague')) applyPoison(P, f, P.poison || 30); if (P.fx.has('corpsePlague') && f.hp > 0) { stSet(P, f, 'burn', out); applyPoison(P, f, 35); } });
        if (R === 'b') heal(P, P.maxHp * 0.08, out);
        if (!aliveOf(b, 'e').length) break;
      }
      break;
    }
    case 'bonestorm': all(0.45 * Math.max(1, zombiesOf(b).length) * m * (R === 'b' ? 1.4 : 1), 'magic', f => { if (R === 'a' && RNG.ch(0.4)) freezeU(f, out); else if (P.fx.has('stormStun') && f.hp > 0 && RNG.ch(0.35)) freezeU(f, out, "Choáng"); }); break;
    case 'shadowkill': { const n = Math.max(1, P.ki); P.ki = 0; for (let i = 0; i < n; i++) { const al = aliveOf(b, 'e'), tt = R === 'a' ? RNG.pick(al) : (t.hp > 0 ? t : al[0]); if (!tt) break;
        const dd = hit(b, P, tt, 0.9 * m * (1 + (P.kiPct || 0) / 100), 'phys', out, { crit: 1, aoe: R === 'a' ? 1 : 0 }); if (dd && R === 'b') heal(P, P.maxHp * 0.02, out, true); } break; }
    case 'yandun': P.st.smoke = R === 'b' ? 4 : 3; out.pops.push(['P', "Yên Độn", 'buff']);
      if (R === 'a') foes.forEach(f => { applyPoison(P, f, 40, Math.max(P.sk.venom || 0, P.poisonPct || 0)); out.pops.push([f.id, "Trúng độc", 'poison', 1]); }); break;
    case 'bawang': { const f = P.fury || 0, eat = P.fx.has('xueHai4') ? f - Math.floor(f / 2) : f; P.fury = f - eat;
      const dd = hit(b, P, t, (1.5 + f * 0.02) * m * (P.fx.has('xueHai6') ? 2 : 1) * (P.fx.has('wBawang') ? 1 + P.wpK : 1), 'phys', out, R === 'a' && f >= 100 ? { crit: 1 } : {});
      if (P.fx.has('wBawang') && t.hp <= 0) { P.fury = f; out.pops.push(['P', "Bá Vương Đao", 'crit']); }
      if (R === 'b' && eat > 0) heal(P, P.maxHp * 0.003 * eat, out);
      if (dd && P.fx.has('bawangBelt')) { P.st.bwNext = 1; out.pops.push(['P', "Bá Vương Đai", 'buff']); }
      break; }
    case 'butui': P.st.butui = R === 'b' ? 4 : 3; out.pops.push(['P', "Bất Thoái", 'buff']); break;
    case 'chanhou': P.st.chan = 4 + (R === 'b' ? 1 : 0); out.pops.push(['P', "Khiêu khích", 'buff']); out.lines.push("Một tiếng Sư Tử Hống: mọi yêu vật đều lao về phía bạn"); if (R === 'a') foes.forEach(f => { if (RNG.ch(0.5)) freezeU(f, out, "Choáng"); }); break;
    case 'wulei': { const all5 = P.lian >= (R === 'a' ? 3 : 5), wl = P.fx.has('cWulei'); (all5 ? foes : [t]).forEach(f => { if (hit(b, P, f, 1.9 * m * (R === 'b' && f.st.frozen ? 2 : 1) * (wl ? 1 + 0.25 * P.lian : 1), 'light', out, { aoe: all5 ? 1 : 0 }) && wl && RNG.ch(0.3)) freezeU(f, out, "Choáng"); }); out.cast.aoe = all5; break; }
    case 'twin': { hit(b, P, t, 0.6 * m, 'phys', out); const t2 = aliveOf(b, 'e')[0]; if (t2) hit(b, P, t2, 0.6 * m, 'phys', out); break; }
    case 'venom': {
      const pois = f => { if (f.hp > 0) { applyPoison(P, f, 40 * (R === 'a' ? 2 : 1), Math.max(P.sk.venom || 0, P.poisonPct || 0)); out.pops.push([f.id, "Trúng độc", 'poison', 1]); } };
      if (R === 'b') all(0.72 * m, 'phys', (f, d) => { if (d) pois(f); });
      else { const d = hit(b, P, t, 1.2 * m, 'phys', out); if (d) pois(t); if (d && P.fx.has('qianJi4')) aliveOf(b, 'e').filter(f => f !== t).forEach(pois); }
      break;
    }
    case 'shadowstep': P.st.shadow = R === 'b' ? 6 : 4; P.st.shadowCrit = P.fx.has('shadow3') ? 3 : 1; out.pops.push(['P', "Ảnh bộ", 'buff']); if (R === 'a') hit(b, P, t, 1.5 * m, 'phys', out); break;
    case 'fan':
      if (R === 'b') foes.forEach(f => { hit(b, P, f, 0.5 * m, 'phys', out, { aoe: 1 }); hit(b, P, f, 0.5 * m, 'phys', out, { aoe: 1 }); });
      else all(0.6 * m * (R === 'a' ? 1.4 : 1), 'phys');
      if (P.fx.has('qianJi6')) { P.ki = Math.min(P.kiMax, P.ki + foes.length); out.pops.push(['P', "Sát ý " + P.ki, 'buff']); }
      if (P.fx.has('fanBurn')) aliveOf(b, 'e').forEach(f => stSet(P, f, 'burn', out));
      break;
    case 'deathmark': { hit(b, P, t, 2.5 * m * (1 + P.ki * (0.25 + (P.kiPct || 0) / 100)), 'phys', out); P.ki = 0; if (t.hp > 0) { t.st.mark = 4; if (R === 'b') t.st.markB = true; out.pops.push([t.id, "Đánh dấu", 'curse']); } break; }
    case 'aegis': P.shield = Math.max(P.shield || 0, Math.round(hp(R === 'b' ? 0.35 : 0.2) * (P.fx.has('divine') ? 1.3 : 1))); out.pops.push(['P', "Khiên", 'buff']); break;
    case 'prayer': {
      const want = hp(0.16), got = heal(P, want, out); allyHeal(b, P, 0.16, out);
      if (P.fx.has('holyLight') && want - got > 1) P.shield = (P.shield || 0) + Math.round(want - got);
      if (P.fx.has('divine')) all(1, 'holy');
      if (R === 'a') P.st.renew = 3;
      if (R === 'b') all(0.8, 'holy');
      if (P.fx.has('zijinOff')) { out.pops.push(['P', "Bát Tử Kim", 'crit']); aliveOf(b, 'e').forEach(f => hit(b, P, f, 1.5, 'holy', out, { proc: 1, aoe: 1 })); }
      break;
    }
    case 'hammer': {
      const tg = P.fx.has('wrath') || P.fx.has('hammerAll') ? foes : [t];
      tg.forEach(f => { hit(b, P, f, 1.9 * m * (R === 'b' ? 1.5 : 1), 'holy', out, { aoe: tg.length > 1 ? 1 : 0 }); if ((R === 'a' && RNG.ch(0.3)) || (P.fx.has('hammerAll') && f.hp > 0 && RNG.ch(0.2))) freezeU(f, out, "Choáng"); });
      break;
    }
    case 'judgement': { let n = 0; const wf = P.fx.has('cJudge'); all(2.0 * m * (R === 'a' ? 1.4 : 1) * (wf && P.shield > 0 ? 1.5 : 1), 'holy', (f, d) => { if (d) { n++; if (wf && RNG.ch(0.3)) freezeU(f, out, "Choáng"); } }); if (R === 'b' && n) heal(P, P.maxHp * 0.03 * n, out); break; }
  }
}
const WX_ELEM = { jin: 'phys', mu: 'poison', shui: 'cold', huo: 'fire', tu: 'holy' };
function castGen(b, P, sk, foes, out, m) {
  const t = foes[0], el = WX_ELEM[b.castWx] || 'phys', aoe = ['aoe', 'aoeburn', 'dotall', 'healaoe'].includes(sk.k);
  out.cast = { id: 'gen', sk: sk.id, elem: el, wx: b.castWx, aoe, target: t && t.id };
  const stun = f => { if (sk.stun && f.hp > 0 && RNG.ch(sk.stun)) freezeU(f, out, "Choáng"); };
  const burn = f => { if (f.hp > 0) { f.st.burn = { d: P.atk * 0.45 * (1 + (P.elem || 0) / 100), t: 3 + stExt(P) }; out.pops.push([f.id, "Thiêu đốt", 'fire', 1]); } };
  const FX = P.fx, R = P.runes[sk.id] || null;
  if (sk.id === 'lieyan' && FX.has('lieyanAll')) { foes.forEach(f => { if (hit(b, P, f, sk.m * m * 0.8, el, out, { aoe: 1 })) stSet(P, f, 'burn', out); }); out.cast.aoe = true; return; }
  if (sk.id === 'fuhu' && FX.has('fuhu2')) { if (hit(b, P, t, sk.m * m, el, out)) { stSet(P, t, 'armor', out); if (RNG.ch(0.3)) stSet(P, t, 'stun', out); } return; }
  if (sk.id === 'bingpo' && FX.has('needle6')) sk = { ...sk, hits: 6 };
  // 变招：改数值的先把这一招的参数改掉（hit() 里读的是 b.castSk，所以一起换）
  const tune = o => { sk = { ...sk, ...o }; b.castSk = sk; };
  if (sk.id === 'liedi') { if (R === 'a') tune({ m: sk.m * 1.6 }); if (R === 'b') tune({ stun: 0.4 }); if (FX.has('liediOff')) tune({ stun: Math.max(sk.stun || 0, 0.5) }); }
  if (sk.id === 'luoshi') { if (R === 'a') tune({ m: sk.m * 1.3 }); if (R === 'b') tune({ stun: 0.3 }); }
  if (sk.id === 'jinguang') { if (R === 'a') tune({ ap: 'chill' }); if (R === 'b' && t.st.melt) tune({ m: sk.m * 1.6 }); }
  if (sk.id === 'lieyan' && R === 'b' && t.st.burn) tune({ m: sk.m * 1.8 });
  if (sk.id === 'shidu' && R === 'a') tune({ m: sk.m * 2 });
  if (sk.id === 'tudun' && R === 'a') tune({ m: sk.m * 1.6, stun: 0.3 });
  if (sk.id === 'dici') { if (R === 'a') tune({ ap: null }); if (R === 'b') tune({ apc: 0.7, m: sk.m * 0.7 }); if (FX.has('cDici') && sk.ap) tune({ apc: Math.max(sk.apc || 0, 0.7) }); }   // 地煞衣
  if (sk.id === 'ganlu') { if (R === 'a') tune({ m: sk.m * 1.8 }); if (R === 'b') tune({ m: 0, heal: (sk.heal || 0.1) * 2, ap: null }); }
  if (sk.id === 'budong') { if (R === 'a') tune({ m: sk.m * 1.6 }); if (R === 'b') tune({ shield: sk.shield * 2 }); }
  if (sk.id === 'lunzhuan' && FX.has('wWanfu')) {   // 万符笔：全场每个敌人各自引爆
    out.cast.aoe = true; foes.forEach(f => { if (hit(b, P, f, sk.m * m * (1 + 0.3 * P.wpK), el, out, { aoe: 1 }) && R === 'b' && f.hp > 0) stSet(P, f, 'burn', out); });
    if (R === 'a') { const capS = Math.round(P.maxHp * mageCap(P) / 100); if ((P.shield || 0) < capS) { P.shield = Math.min(capS, (P.shield || 0) + Math.round(P.maxHp * sustV(P, 'a') / 100)); out.pops.push(['P', "Hộ Thể", 'buff']); } }
    return;
  }
  const dy = sk.id === 'hanren' && FX.has('duanyue');
  const xopt = (sk.id === 'dici' && R === 'a') || (sk.id === 'fuhu' && R === 'a' && t.st.frozen) ? { crit: 1 } : {};
  if (sk.id === 'ganlu' && FX.has('ganlu2')) { heal(P, P.maxHp * 0.12 * (1 + (P.healPct || 0) / 100), out); delete P.st.poison; delete P.st.frozen; out.pops.push(['P', "Thanh tẩy", 'buff']); }
  switch (sk.k) {
    case 'single': if (hit(b, P, t, sk.m * m, el, out, xopt)) { stun(t);
        if (sk.id === 'lieyan' && R === 'a') aliveOf(b, 'e').filter(f => f !== t).forEach(f => stSet(P, f, 'burn', out));
        if (dy && t.hp > 0) { stSet(P, t, 'armor', out); stSet(P, t, 'burn', out); }
        if (sk.id === 'hanren' && R === 'a' && t.hp > 0) { t.st.vuln = 3; out.pops.push([t.id, "Toái Cốt", 'curse', 1]); }
        if (sk.id === 'hanren' && R === 'b') { P.shield = (P.shield || 0) + Math.round(P.maxHp * 0.08); out.pops.push(['P', "Hộ Thể", 'buff']); }
        if (sk.id === 'fuhu' && R === 'b') setWeak(t, 3, 0.3, out);
        if (sk.id === 'lunzhuan' && R === 'b' && t.hp > 0) stSet(P, t, 'burn', out); }
      if (sk.id === 'lunzhuan' && R === 'a') { const capS = Math.round(P.maxHp * mageCap(P) / 100); if ((P.shield || 0) < capS) { P.shield = Math.min(capS, (P.shield || 0) + Math.round(P.maxHp * sustV(P, 'a') / 100)); out.pops.push(['P', "Hộ Thể", 'buff']); } }
      break;
    case 'aoe': { let nh = 0; foes.forEach(f => { if (hit(b, P, f, sk.m * m, el, out, { aoe: 1 })) { nh++; stun(f); if (sk.id === 'liedi' && R === 'b') setWeak(f, 2, 0.2, out); if (sk.id === 'shidu' && R === 'a') stSet(P, f, 'armor', out); } });
      if (sk.id === 'tudun' && R === 'b') heal(P, P.maxHp * 0.15 * (1 + (P.healPct || 0) / 100), out);
      if (sk.id === 'liedi' && FX.has('buSi4') && nh) heal(P, P.maxHp * 0.03 * nh, out);
      if ((sk.id === 'shidu' || sk.id === 'tudun') && FX.has('duXing6')) foes.forEach(f => { const ps = f.st.poison; if (f.hp > 0 && ps) { out.pops.push([f.id, "Độc phát", 'poison']); hit(b, P, f, 0, 'poison', out, { flat: Math.round(ps.d * ps.t * DUXING_BURST * (FX.has('wWandu') ? 1 + P.wpK : 1)), proc: 1, aoe: 1, raw: 1 }); } }); }
      if (sk.heal === 'minion') aliveOf(b, 'p').filter(u => u.kind === 'minion').forEach(u => heal(u, u.maxHp * 0.3, out));
      if (sk.shield) { P.shield = Math.max(P.shield || 0, Math.round(P.maxHp * sk.shield * (FX.has('budong2') ? 2 : 1))); out.pops.push(['P', "Hộ Thể", 'buff']); }
      break;
    case 'burn': if (hit(b, P, t, sk.m * m, el, out)) burn(t); break;
    case 'aoeburn': foes.forEach(f => { if (hit(b, P, f, sk.m * m, el, out, { aoe: 1 })) burn(f); }); break;
    case 'slow': if (hit(b, P, t, sk.m * m, el, out) && t.hp > 0) { t.st.slow = 3; out.pops.push([t.id, "Đóng băng", 'cold', 1]); } break;
    case 'multi': for (let i = 0; i < (sk.hits || 3); i++) { const al = aliveOf(b, 'e'); if (!al.length) break; const tt = sk.id === 'bingpo' && R === 'a' && t.hp > 0 ? t : RNG.pick(al);
        if (hit(b, P, tt, sk.m * m, el, out, { aoe: 1 }) && sk.id === 'bingpo' && R === 'b') setWeak(tt, 2, 0.25, out); } break;
    case 'dotall': foes.forEach(f => { if (hit(b, P, f, sk.m * m, el, out, { aoe: 1 }) && f.hp > 0) { applyPoison(P, f, 35); out.pops.push([f.id, "Trúng độc", 'poison', 1]); } }); break;
    case 'healaoe': heal(P, P.maxHp * (sk.heal || 0.1) * (1 + (P.healPct || 0) / 100), out); if (sk.id === 'ganlu') allyHeal(b, P, sk.heal || 0.1, out); if (sk.m > 0) foes.forEach(f => hit(b, P, f, sk.m * m, el, out, { aoe: 1 }));
      if (sk.id === 'ganlu' && FX.has('zijinOff')) { out.pops.push(['P', "Bát Tử Kim", 'crit']); aliveOf(b, 'e').forEach(f => hit(b, P, f, 1.5, 'holy', out, { proc: 1, aoe: 1 })); }
      break;
  }
}
// 状态：灼烧、冰冻、破甲、眩晕
const ST_KEY = { burn: 'burn', chill: 'slow', armor: 'melt', stun: 'frozen', poison: 'poison' };
const stHas = (f, s) => s === 'any' ? ['burn', 'slow', 'melt', 'frozen', 'poison'].filter(k => f.st[k]).length : (f.st[ST_KEY[s]] ? 1 : 0);
function stClear(f, s) { for (const k of s === 'any' ? ['burn', 'slow', 'melt', 'frozen', 'poison'] : [ST_KEY[s]]) delete f.st[k]; }
function stSet(src, f, s, out) {
  if (f.hp <= 0) return;
  if (s === 'burn' && f.cocoon && f.shield > 0) { f.shield = 0; f.cocoon = false; out.pops.push([f.id, "Kén tơ cháy thủng", 'react']); out.lines.push(`Kén tơ của ${f.name} bắt lửa rồi!`); }
  if (s === 'burn') { f.st.burn = { d: dotIn(BNOW, src, f, src.atk * 0.45 * (1 + (src.elem || 0) / 100) * (src.fx && src.fx.has('burn2') ? 2 : 1)), t: 3 + stExt(src), by: stKey(src) || 'P' }; out.pops.push([f.id, "Thiêu đốt", 'fire', 1]); }
  else if (s === 'chill') { if (!f.st.slow) stAdd(BNOW, stKey(src) ? src : stActor(BNOW), 'ctrl', 1); f.st.slow = 3 + stExt(src); out.pops.push([f.id, "Đóng băng", 'cold', 1]); if (f.lavaShell && f.shield > 0) { f.shield = 0; f.lavaShell = false; out.pops.push([f.id, "Vỏ nứt", 'react']); out.lines.push(`Lớp vỏ dung nham của ${f.name} bị đông nứt!`); } }
  else if (s === 'armor') { f.st.melt = 3 + stExt(src); out.pops.push([f.id, "Phá giáp", 'crit', 1]); if (f.shield > 0 && (f.trait === 'shield' || f.silver)) { f.shield = 0; out.pops.push([f.id, f.silver ? "Giáp bạc vỡ rồi" : "Vỡ giáp", 'react']); if (f.silver) out.lines.push(`Giáp bạc của ${f.name} bị đánh vỡ!`); } }
  else if (s === 'stun') freezeU(f, out, "Choáng");
  else if (s === 'poison') { applyPoison(src, f, 35, src.poisonPct || 0); out.pops.push([f.id, "Trúng độc", 'poison', 1]); }
}
function enemyAct(b, u, out) {
  if (u.def && u.def.goblin) {
    u.flee = (u.flee || 0) + 1;
    if (u.flee >= GOBLIN_FLEE) { u.escaped = true; u.hp = 0; out.lines.push("Kim Thiềm chui vào cổng dịch chuyển, chạy mất rồi!"); out.pops.push([u.id, "Chạy mất", 'miss']); return; }
    out.lines.push(GOBLIN_FLEE - u.flee <= 2 ? "Kim Thiềm đang mở cổng dịch chuyển!" : "Kim Thiềm ôm túi tiền chạy loạn khắp nơi");
    return;
  }
  if (u.fleeDef && u.hp / u.maxHp < u.fleeDef.at) {   // 悬赏的家伙：打残了要跑，几回合内不打死就跑掉
    u.flee = (u.flee || 0) + 1; const left = (u.fleeDef.n || 3) - u.flee;
    if (left < 0) { u.escaped = true; u.hp = 0; u.dead = true; if (b.run) b.run.btyEsc = u.bty; out.lines.push(`${u.name} chui vào bóng tối, chạy mất rồi!`); out.pops.push([u.id, "Chạy mất", 'miss']); return; }
    out.lines.push(`${u.name} muốn chạy! ${left ? `${left} lượt nữa là chạy mất` : "Lượt sau là chạy mất!"}`); out.pops.push([u.id, "Muốn chạy", 'crit']); bossSay(u, out, u.fleeDef.say); return;
  }
  if ((u.kind === 'boss' || u.abs) && bossAct(b, u, out)) return;
  const allies = aliveOf(b, 'p'), P = b.P;
  if (P.hp > 0 && P.st.chan) { out.cast = { id: 'atk', elem: u.ae, target: P.id, enemy: true }; hit(b, u, P, 1, u.ae, out); return; }   // 狮子吼：嘲讽期间谁都只能打你
  const others = allies.filter(a => a !== P), tank = others.find(a => a.taunt), wd = others.find(a => a.kind === 'ward');
  if (wd && !(tank && RNG.ch(tank.taunt)) && RNG.ch(0.4)) { out.cast = { id: 'atk', elem: u.ae, target: wd.id, enemy: true }; hit(b, u, wd, 1, u.ae, out); return; }
  let t = tank && RNG.ch(tank.taunt * (u.kind === 'boss' ? 0.5 : 1)) ? tank : null;
  if (!t) { const ag = allies.find(a => a.fmAggro); if (ag && RNG.ch(ag.fmAggro / 100)) t = ag; }   // 虎翼阵 1 号：妖物更爱打他
  if (!t && b.run && (b.run.team || b.fm)) {   // 幻境组队、摆了阵：七成打前排，前排倒光了才打后排
    const fr = allies.filter(a => a.kind !== 'ward' && isFrontU(a));
    if (fr.length && RNG.ch(0.7)) t = RNG.pick(fr);
  }
  if (!t) t = P.hp > 0 && (!others.length || RNG.ch(0.55)) ? P : RNG.pick(others);
  if (t) { out.cast = { id: 'atk', elem: u.ae, target: t.id, enemy: true }; hit(b, u, t, 1, u.ae, out); }
}
function bossSay(u, out, text) { if (!text) return; out.say = [u.id, text]; out.lines.push(`${u.name}: “${text}”`); }
function bossAct(b, u, out) {
  u.cnt = (u.cnt || 0) + 1;
  if (u.charging) { const A = u.charging; delete u.charging; if (riftB(b) && u.kind === 'boss') b.capHit = R_CAP_HIT; const r = doAbility(b, u, A, out, true); b.capHit = 0; return r; }
  const H = u.halfDef;
  if (H && !u.halfDone && u.hp / u.maxHp < 0.5) {
    u.halfDone = true; bossSay(u, out, H.say);
    if (H.enrage) u.enraged = true;
    if (H.ghost) { u.ghostForm = true; out.pops.push([u.id, "Quỷ thân", 'buff']); out.lines.push(`${u.name} hóa thành một đám bóng ma, rất khó đánh trúng — dùng “Choáng” để nó hiện hình`); }
    if (H.cocoon) { u.shield = Math.round(u.maxHp * H.cocoon); u.cocoon = true; out.pops.push([u.id, "Kén tơ hộ thể", 'buff']); out.lines.push(`${u.name} nhả tơ cuộn mình lại — dùng “Thiêu đốt” để đốt thủng kén tơ`); }
    if (H.silver) { u.shield = Math.round(u.maxHp * H.silver); u.silver = true; out.pops.push([u.id, "Giáp bạc hộ thể", 'buff']); out.lines.push(`${u.name} phủ lên người một lớp giáp bạc — dùng “Phá giáp” để đập vỡ`); }
    if (H.phase) { u.phased = true; if (u.def.pal2) u.pal = u.def.pal2; if (H.name) u.name = H.name; u.atk *= 1.25; u.spd *= 1.15; heal(u, u.maxHp * 0.1, out); }
    out.cast = { id: H.phase ? 'phase' : 'enrage', elem: 'magic', aoe: true, enemy: true, target: u.id };
    return true;
  }
  for (const A of u.abs || []) if (u.cnt % A.every === 0 && doAbility(b, u, A, out)) return true;
  if (u.sweep && u.cnt % R_TEAM[3] === 2) {   // 幻境组队：首领横扫前排（没有前排就扫全队）
    const L = aliveOf(b, 'p').filter(a => a.kind !== 'ward'), isF = a => isFrontU(a) || a.kind === 'minion';
    const T = L.filter(isF).length ? L.filter(isF) : L; if (!T.length) return false;
    out.cast = { id: 'atk', elem: u.ae, aoe: true, enemy: true, target: T[0].id }; out.pops.push([u.id, "Quét ngang", 'crit']); out.lines.push(`${u.name} quét ngang, cả tiền tuyến cùng lãnh một đòn!`);
    T.forEach(t => hit(b, u, t, R_TEAM[2], u.ae, out, { aoe: 1 })); return true;
  }
  return false;
}
function doAbility(b, u, A, out, now) {
  const allies = aliveOf(b, 'p');
  if ((A.t === 'aoe' || A.t === 'poison') && !now) { u.charging = A; out.cast = { id: 'charge', elem: A.t === 'poison' ? 'poison' : A.elem, enemy: true, target: u.id }; out.pops.push([u.id, "Tụ lực", 'crit']); out.lines.push(`${u.name} đang tụ lực, chuẩn bị tung đại chiêu…`); return true; }
  const hasKey = k => typeof SAVE !== 'undefined' && SAVE.keys && SAVE.keys[k];
  if (A.key && hasKey(A.key)) { out.lines.push(A.foil); out.pops.push([u.id, "Bị khắc chế", 'miss']); out.cast = { id: 'roar', elem: 'phys', target: u.id, enemy: true }; (out.foil = out.foil || []).push(A.foil); (out.foilKey = out.foilKey || []).push(A.key); return true; }
  if (A.t === 'devour' && !now) { u.charging = A; out.cast = { id: 'charge', elem: 'poison', enemy: true, target: u.id }; out.pops.push([u.id, "Tụ lực", 'crit']); bossSay(u, out, A.say); out.lines.push(`${u.name} há to miệng — đánh choáng nó là ngắt được!`); return true; }
  if (A.t === 'gavel' && !now) { u.charging = A; out.cast = { id: 'charge', elem: 'holy', enemy: true, target: u.id }; out.pops.push([u.id, "Tụ lực", 'crit']); bossSay(u, out, A.say); out.lines.push(`${u.name} giơ cao kinh đường mộc…`); return true; }
  switch (A.t) {
    case 'shell':
      bossSay(u, out, A.say); u.shield = Math.max(u.shield || 0, Math.round(u.maxHp * (A.pct || 0.15) * (u.kind === 'elite' && !u.bty ? Math.pow(0.7, u.shellN = (u.shellN || 0) + 1) / 0.7 : 1))); u.lavaShell = true;
      out.pops.push([u.id, "Vỏ dung nham", 'buff']); out.lines.push(`${u.name} kết một lớp vỏ dung nham — “Đóng băng” làm nó nứt ra`); out.cast = { id: 'roar', elem: 'fire', target: u.id, enemy: true }; return true;
    case 'devour':
      if (b.P.hp <= 0) return false;
      bossSay(u, out, A.bite || "Nuốt —!"); out.cast = { id: 'bossAoe', elem: 'poison', target: 'P', enemy: true };
      hit(b, u, b.P, A.mult || 2.4, 'phys', out, { proc: 1, noBlock: 1 }); return true;
    case 'court': {
      if (aliveOf(b, 'e').length >= 5) return false;
      const def = themeOf(b.run).mons[A.m || 0];
      for (let i = 0; i < (A.n || 2) && aliveOf(b, 'e').length < 5; i++) { const m = makeMonster(def, Math.max(1, u.lv - 2), b.run, 'normal'); m.g = 0; m.protect = true; m.name = "Hộ giá" + m.name; b.units.push(m); }
      bossSay(u, out, A.say); out.lines.push(A.note || "Khi yêu vật hộ giá còn sống, thủ lĩnh nhận ít đi hơn ba phần sát thương"); out.cast = { id: 'summon', elem: 'magic', enemy: true }; return true;
    }
    case 'gavel':
      bossSay(u, out, "Bốp!!"); out.cast = { id: 'bossAoe', elem: 'holy', aoe: true, enemy: true };
      allies.forEach(t => { hit(b, u, t, A.mult || 0.8, 'holy', out, { proc: 1 }); if (t.hp > 0) { t.st.frozen = true; out.pops.push([t.id, "Choáng", 'cold']); } });
      return true;
    case 'brush':
      if (b.P.hp <= 0) return false;
      bossSay(u, out, A.say); out.cast = { id: 'web', elem: 'magic', target: 'P', enemy: true };
      hit(b, u, b.P, 0.6, 'magic', out, { proc: 1 }); if (b.P.hp > 0) { b.P.st.poison = { d: b.P.maxHp * (A.pct || 0.03), t: 3 }; out.pops.push(['P', "Câu Hồn", 'poison']); }
      return true;
    case 'summon': {
      if (aliveOf(b, 'e').length >= 5) return false;
      const def = themeOf(b.run).mons[A.m || 0];
      for (let i = 0; i < (A.n || 2) && aliveOf(b, 'e').length < 5; i++) { const m = makeMonster(def, Math.max(1, u.lv + (A.lvd != null ? A.lvd : -2)), b.run, 'normal'); m.g = 0; b.units.push(m); }
      bossSay(u, out, A.say); out.cast = { id: 'summon', elem: 'magic', enemy: true }; return true;
    }
    case 'aoe':
      bossSay(u, out, A.say); out.cast = { id: 'bossAoe', elem: A.elem, aoe: true, enemy: true };
      allies.forEach(t => { hit(b, u, t, A.mult * 1.3, A.elem, out, { proc: 1 }); if (A.freeze && RNG.ch(A.freeze)) freezeU(t, out); });
      return true;
    case 'web':
      if (b.P.hp <= 0) return false;
      bossSay(u, out, A.say); out.cast = { id: 'web', elem: 'magic', target: 'P', enemy: true };
      hit(b, u, b.P, A.mult || 0.6, 'phys', out, { proc: 1 }); if (b.P.hp > 0) { b.P.st.frozen = true; out.pops.push(['P', "Bất động", 'cold']); }
      return true;
    case 'poison':
      bossSay(u, out, A.say); out.cast = { id: 'bossAoe', elem: 'poison', aoe: true, enemy: true };
      allies.forEach(t => { hit(b, u, t, A.mult || 0.65, 'poison', out, { proc: 1 }); if (t.hp > 0) { t.st.poison = { d: dotIn(b, u, t, u.atk * (A.dot || 0.35)), t: 3 }; out.pops.push([t.id, "Trúng độc", 'poison', 1]); } });
      return true;
    case 'heal':
      if (u.hp / u.maxHp > 0.85) return false;
      if (u.st.burn && !A.pierce) { out.lines.push(`${u.name} đang bốc cháy, không hút được thi khí`); out.pops.push([u.id, "Áp chế bằng lửa", 'fire']); return true; }
      bossSay(u, out, A.say); heal(u, u.maxHp * A.pct * (u.kind === 'elite' && !u.bty ? Math.pow(0.7, u.healN = (u.healN || 0) + 1) / 0.7 : 1), out); out.cast = { id: 'bossHeal', elem: 'poison', target: u.id, enemy: true }; return true;   // 精英血厚了，回血一次比一次少，免得打成拉锯
    case 'roar':
      bossSay(u, out, A.say); u.roarN = (u.roarN || 0) + 1; if (u.roarN <= (A.cap || 3)) u.atk *= (A.mult || 1.12); else if (u.kind !== 'elite' || u.bty || u.roarN <= (A.cap || 3) + 3) heal(u, u.maxHp * 0.03, out); out.pops.push([u.id, "Gầm thét", 'crit']); out.cast = { id: 'roar', elem: 'phys', target: u.id, enemy: true }; return true;
  }
  return false;
}
function hit(b, src, tgt, mult, elem, out, opt = {}) {
  if (!tgt || tgt.hp <= 0 || src.hp <= 0) return 0;
  const sure = src === b.P && src.fx && src.fx.has('cangfengBelt') && b.castSk && b.castSk.fin;   // 藏锋带：终结技必中
  if (tgt.trait === 'fly' && !sure && !tgt.st.slow && src.kind === 'hero' && !opt.aoe && !opt.ult && ['berserker', 'assassin', 'paladin'].includes(src.cls) && RNG.ch(0.25)) { out.pops.push([tgt.id, "Hụt", 'miss']); return 0; }
  if (tgt.st.smoke && src.side === 'e') { out.pops.push([tgt.id, "Yên Độn", 'miss']); return 0; }
  const isAss = tgt.kind === 'hero' && tgt.cls === 'assassin' && src.side === 'e';
  const dodge = (tgt.dodge || 0) + (tgt.st.shadow ? 40 : 0) + (tgt.ghostForm ? 25 : 0) + (isAss ? SUST.assassin.a * sustLv(tgt.lv) : 0);
  if (dodge && !sure && RNG.ch(Math.min(70, dodge) / 100)) { out.pops.push([tgt.id, "Né tránh", 'miss']); if (tgt === b.P && tgt.fx.has('cGhostMask')) { const capS = Math.round(tgt.maxHp * 0.25); if ((tgt.shield || 0) < capS) tgt.shield = Math.min(capS, (tgt.shield || 0) + Math.round(tgt.maxHp * 0.05)); } if (tgt === b.P && tgt.fx.has('gEvade')) tgt.evNext = true; if (isAss && tgt.hp > 0) { heal(tgt, tgt.maxHp * sustV(tgt, 'b') / 100, out);
      if (tgt.fx.has('wuyingOff')) { heal(tgt, tgt.maxHp * 0.04, out, true); const k2 = tgt.skills.filter(k => k.left > 0).sort((x, y) => y.left - x.left)[0]; if (k2) k2.left--; } } return 0; }
  const fx = src.fx, tfx = tgt.fx;
  let gam = 1;   // 孤注带：一成 ×3，一成打空
  if (src === b.P && fx.has('gGamble') && !opt.proc && opt.flat == null && tgt.side === 'e') { const r = Math.random(); if (r < 0.1) { gam = 3; out.pops.push(['P', "Cô chú", 'crit']); } else if (r < 0.2) { out.pops.push([tgt.id, "Đánh hụt", 'miss']); return 0; } }
  let d = opt.flat != null ? opt.flat : src.atk * mult * (1 + (src.dmgPct || 0) / 100 + (elem !== 'phys' ? (src.elem || 0) / 100 : 0));
  if (src.st.warcry) d *= 1.4;
  if (src.st.rumo) d *= 1 + ULT.rmDmg;   // 狂刀客必杀「入魔」
  if (src.st.qianren) d *= 1 + ULT.qrDmg;   // 刺客必杀「无影千刃」
  if (src.st.guiyi) d *= 1 + ULT.gyDmg;   // 道士必杀「五行归一」
  if (src.st.baigui || (src.kind === 'minion' && b.P && b.P.st.baigui)) d *= 1 + ULT.bgDmg;   // 赶尸人必杀「百鬼还魂」：自己和僵尸
  if (src.st.jsh && elem === 'holy') d *= 1 + ULT.jsHoly;   // 和尚必杀「金身」：佛光（含反震）加伤
  if (src.kind === 'hero') {   // 职业的看家本事
    if (src.cls === 'berserker') { d *= (src.fury >= 50 ? 1.15 * (src.lgv && src.lgv.zhanhun != null ? 1 + LGV.zhHalf(src.lgv.zhanhun) / 100 : 1) : 1) * (1 + (0.03 + (src.lowHpK || 0) / 100) * Math.floor((1 - src.hp / src.maxHp) * 10)); }   // 战魂玉：怒意过半加伤、残血加伤
    if (src.cls === 'mage' && src.lian) d *= 1 + src.lian * (0.08 + (src.lianPct || 0) / 100);
  }
  if (src === b.P && src.lgv && tgt.side === 'e') {   // 灵玉的打法加成（2026-11-23）
    const V = src.lgv;
    if (V.lianhuan != null && b.castAoe && !opt.proc) d *= 1 + LGV.lhK(V.lianhuan) / 100 * Math.min(4, Math.max(0, aliveOf(b, 'e').length - 1));
    if (V.shigu != null) d *= 1 + LGV.sgK(V.shigu) / 100 * stHas(tgt, 'any');
    if (V.xuanjia != null && src.shield > 0) d *= 1 + LGV.xjK(V.xuanjia) / 100;
    if (V.shisha != null && b.ssOn) d *= 1 + LGV.ssK(V.shisha) / 100 * b.ssOn;
    if (V.tiangang != null && src.st.tg) d *= 1 + LGV.tgK(V.tiangang) / 100;
    if (V.duopo != null && b.castSk && b.castSk.fin && !opt.proc) d *= 1 + LGV.dpFin(V.duopo) / 100;
  }
  if (tgt === b.P && tgt.st.chan) d *= 1 - CHAN_DR / 100;   // 狮子吼：嘲讽期间受到的伤害 -45%（2026-11-24 原来 -30%，反击晕人取消后补的）
  if (tgt.phShield && tgt.shield > 0) d *= R_BOSS_PH[2];                          // 守关妖王 70% 血的护体真气：打破之前伤害减半
  if (src.fmD) d *= 1 + src.fmD / 100;                                           // 阵法：号位伤害
  if (src.fmStD && tgt.st && stHas(tgt, 'any')) d *= 1 + src.fmStD / 100;          // 蛇蟠阵 1 号：打身上有状态的
  if (tgt.fmR) d *= 1 - tgt.fmR / 100;                                           // 阵法：号位受到的伤害
  if (b.fk) d *= 1 + FORM_K / 100 * b.fk * (src.side === 'p' ? 1 : src.side === 'e' ? -1 : 0);   // 克制：克的一方 +10%，被克的一方 -10%
  if (tgt.kind === 'hero' && tgt.st.butui) d *= 0.5;
  if (tgt.kind === 'minion' && tgt.st.yang && b.P && b.P.runes && b.P.runes.yangshi === 'b') d *= 0.6;   // 养尸符·尸甲
  if (src.st.curse) d *= src.st.curseW ? 0.55 : 0.7;
  if (src.st.weak) d *= 1 - (src.st.weakV || 0.2);
  if (tgt.st.vuln) d *= 1.2;
  if (src.side === 'e' && src.st.poison && b.P && b.P.runes && b.P.runes.shidu === 'b') d *= 0.85;           // 尸毒蔓·腐毒
  if (src === b.P && src.st.butui && src.runes.butui === 'a') d *= 1.4;                                       // 不退·死战
  if (src === b.P && src.st.bwNext && !opt.proc && b.castSk && b.castSk.id !== 'bawang') d *= 1.5;           // 霸王带
  if (src === b.P && src.cbOn && src.xCritNext && !opt.proc) d *= 1 + src.xCritNext / 100;                      // 会心
  if (src === b.P) {
    d *= gam;
    if (src.sanN) d *= 1 + SAN_DMG * src.sanN;                                                                  // 散件流
    if (src.goldK) d *= 1 + src.goldK;                                                                          // 金错刀
    if (b.dice === 'dmg') d *= 1.25;                                                                            // 六博刀
    if (src.yy === 'yang') d *= 1.3;                                                                            // 两仪佩
    if (src.st.gourd) d *= 1.4;                                                                                 // 悬壶带
    if (src.evOn && !opt.proc) d *= 1.5;                                                                        // 逍遥履
  }
  if (tgt.st.lamp) d *= 1.25;                                                                                   // 引魂灯
  if (src === b.P && tgt.side === 'e') {   // 职业神兵（通关后那批）
    if (fx.has('cLieyan') && b.castSk && b.castSk.id === 'lieyan' && tgt.st.burn) d *= 2;                       // 焚天靴
    if (fx.has('cMeltFury') && (src.fury || 0) >= 100) d *= 1.2;                                                 // 嗜战刀鞘
    if (fx.has('cBagua')) d *= 1 + 0.08 * stHas(tgt, 'any');                                                     // 八卦符匣
    if (fx.has('cRotBelt') && tgt.st.poison) d *= 1.15;                                                          // 腐尸带
    if (fx.has('cShieldDmg') && src.shield > 0) d *= 1.2;                                                        // 金身带
  }
  if (b.P && b.P.fx && tgt.side === 'e' && (src === b.P || src.kind === 'minion')) {
    if (tgt.st.curse && b.P.fx.has('cCurse')) d *= 1.25;                                                         // 摄魂手
    if (src.kind === 'minion' && b.P.fx.has('cSpear') && b.focus === tgt.id) d *= 1.2;                           // 镇魂扳指
  }
  if ((src.kind === 'ally' || src.kind === 'minion') && b.P && b.P.fx.has('gDrum')) d *= 1.15;                  // 聚将鼓
  if (tgt.st.curse && tgt.st.curseB) d *= 1.25;
  if (fx) {
    if (fx.has('execute') && tgt.hp / tgt.maxHp < 0.3) d *= 1.6;
    if (fx.has('bloodrage') && src.hp / src.maxHp < 0.5) d *= 1.6;
    if (fx.has('lowHpDmg')) d *= 1 + 0.5 * (1 - src.hp / src.maxHp);
    if (fx.has('critStack')) d *= 1 + 0.05 * src.stacks;
    if (fx.has('shatter') && tgt.st.frozen) d *= 2;
    if (fx.has('bossDmg') && (tgt.kind === 'boss' || tgt.kind === 'elite')) d *= 1.35;
    if (fx.has('gReveal') && tgt.kind === 'elite' && tgt.aff) d *= 1 + 0.1 * tgt.aff.length;
    if (fx.has('venomFang') && tgt.st.poison) d *= 1.3;
    if (fx.has('archmage')) d *= 1.15;
    if (fx.has('elemSurge') && elem !== 'phys' && RNG.ch(0.2)) d *= 2;
    if (fx.has('armorHunter') && tgt.st.melt) d *= 1.4;
    if (fx.has('xueHai6') && src.fury) d *= 1 + src.fury * XUEHAI_FURY;
    if (fx.has('qiSha6') && src === b.P && b.castSk && b.castSk.fin) d *= QISHA_FIN;
    if (fx.has('luoHan6') && src.fonu) d *= 1 + src.fonu * FONU_DMG;
    if (src === b.P && !opt.raw) {
      if (fx.has('buSi6')) d *= (1 + BUSI_HP * 100 * (1 - Math.max(0, src.hp) / src.maxHp)) * (b.castSk && BUSI_SK.has(b.castSk.id) && !opt.proc ? BUSI_AOE : 1);
      if (fx.has('wanFu4') && tgt.side === 'e') d *= 1 + WANFU_ST * stHas(tgt, 'any');
      if (fx.has('duXing4')) d *= 1 + DUXING_DMG * emptySlots(b, src);
      if (fx.has('daRi6') && src.shield > 0) d *= 1 + DARI_DMG;
      if (fx.has('wTaiyi') && src.lian >= 5) d *= 1 + 0.3 * src.wpK;
      if (fx.has('youying') && src.st.smoke) d *= 1.5;
    }
  }
  if (src === b.P && b.guiYuan && !opt.proc) d *= GUIYUAN_MUL;
  if (src.side === 'p' && b.P && b.P.yi && b.P.yi.xuanbing && (tgt.st.frozen || tgt.st.slow)) { d *= 1 + (12 + b.P.yi.xuanbing * 6) / 100; if (src === b.P && (!b.xbTold || RNG.ch(0.12))) { b.xbTold = 1; out.yi = 'xuanbing'; out.pops.push([tgt.id, "Phong Trấn", 'cold']); } }
  if (src.xBoss && (tgt.kind === 'boss' || tgt.kind === 'elite')) d *= 1 + src.xBoss / 100;
  if (src === b.P && src.jy && tgt.side === 'e') {   // 九幽·吞天、神通
    if (src.jy.tuntian) { const nd = b.units.reduce((a, u) => a + (u.side === 'e' && u.hp <= 0 ? 1 : 0), 0); if (nd) d *= 1 + Math.min(10, nd) * src.jy.tuntian / 100; }
    if (src.jy.shentong && b.castSk && !opt.proc) d *= 1 + src.jy.shentong / 100;
  }
  if (src.xExec && tgt.hp / tgt.maxHp < 0.3) d *= 1 + src.xExec / 100;
  if (src.xBreak && tgt.charging) d *= 1 + src.xBreak / 100;
  if (src.frozenDmg && tgt.st.frozen) d *= 1 + src.frozenDmg / 100;
  if (src.side === 'p' && tgt.def) d *= 1 + bestiaryBonus(tgt.def.n) / 100;
  if (tgt.st.mark) d *= 1.5 + (tgt.st.markB ? 0.25 : 0) + (fx && fx.has('deathMarkPlus') ? 0.5 : 0);
  if (tgt.side === 'e' && b.weary) d *= 1 + R_WEARY[1] * b.weary;
  if (src.aff && src.aff.includes('enraged') && src.hp / src.maxHp < 0.5) d *= 1.6;
  if (src.enraged) d *= 1.3;
  let crit = false;
  if (opt.crit || (src === b.P && b.castCrit)) crit = true;
  else if (src.st.shadowCrit) { crit = true; src.st.shadowCrit = (src.st.shadowCrit === true ? 1 : src.st.shadowCrit) - 1; if (src.st.shadowCrit <= 0) delete src.st.shadowCrit; }
  else if (src === b.P && fx && fx.has('qianJi6') && b.castSk && DART_SK.has(b.castSk.id) && tgt.st.poison && !opt.proc) { crit = true; d *= QIANJI_MUL; }
  else if (src === b.P && src.kcOn && !opt.proc) crit = true;
  else if (RNG.ch(((src.crit || 0) + (src === b.P && fx && fx.has('cFuryCrit') ? (src.fury || 0) / 5 : 0)) / 100)) crit = true;   // 战意带：每 10 点怒意暴击 +2%
  if (src === b.P && b.guiCast && b.castSk && !opt.proc) d *= 1 + GUIYUAN_SW;
  if (crit && src === b.P && fx.has('gReset') && !opt.proc && RNG.ch(0.1)) { const k2 = src.skills.find(k => k.left > 0 && !(b.castSk && b.castSk.id === k.id)); if (k2) { k2.left = 0; out.pops.push(['P', "Hồi phong", 'buff']); } }
  if (crit) { d *= ((src.critDmg || 150) + (src === b.P && fx && fx.has('cKiCrit') ? 10 * (b.kiSnap != null ? b.kiSnap : src.ki || 0) : 0)) / 100;   /* 夜行带：每点杀意暴伤 +10% */ if (fx && fx.has('critStack') && src.stacks < 10) src.stacks++; if (src === b.P) src.cbNext = true; }
  const dRaw = tgt === b.P && src.side === 'e' ? d / ((tgt.st.chan ? 1 - CHAN_DR / 100 : 1) * (tgt.fmR ? 1 - tgt.fmR / 100 : 1) * (tgt.st.butui ? 0.5 : 1)) : 0;   // 主角统计：减伤之前打来多少
  const pj = src === b.P && src.jy && src.jy.pojia && tgt.side === 'e' ? 1 - src.jy.pojia / 100 : 1;   // 九幽·洞穿
  if (elem === 'phys') { const K = 40 + (src.lv || 1) * 9; d *= K / (K + tgt.armor * pj * (tgt.st.warcry ? 1.5 : 1) * (tgt.st.melt ? 0.5 : 1) * (tgt.st.tieArm ? 1.4 : 1)); }
  else d *= 1 - Math.max(0, Math.min(RES_SOFT[1], tgt.res || 0) * pj - (tgt.st.melt ? 20 : 0)) / 100;
  if (tgt.st.liuDr && tgt.side === 'p' && src.side === 'e') d *= 1 - (b.liuDrV || 0.2);   // 刘师傅念经
  // 收招：打带状态的敌人
  let pay = null;
  const SK = opt.sk || (src === b.P && !opt.ult ? b.castSk : null);
  if (SK && SK.pay && src.side === 'p' && tgt.side === 'e' && !opt.proc) {
    const P2 = SK.pay, has = stHas(tgt, P2.s);
    if (has) {
      pay = P2;
      if (P2.x === 'dmg') d *= P2.v;
      else if (P2.x === 'shatter') { d *= P2.v; stClear(tgt, P2.s); }
      else if (P2.x === 'crit' && !crit) { crit = true; d *= (src.critDmg || 150) / 100; }
      else if (P2.x === 'detonate') { d *= 1 + ((fx && fx.has('detPlus') ? 2.3 : 0.8) + (fx && fx.has('wanFu6') ? WANFU_DET : 0)) * has; if (!(fx && fx.has('wanFu6'))) stClear(tgt, 'any'); }
    }
  }
  const dA = d;   // 减伤封顶用：这一段之前的数
  if (tfx) {
    if (tfx.has('xueHai4') && (tgt.fury || 0) >= 50) d *= 1 - XUEHAI_DR;
    if (tfx.has('yinBing6')) d *= 1 - 0.07 * Math.min(6, zombiesOf(b).length);
    if (tfx.has('luoHan6') && tgt.fonu) d *= 1 - 0.04 * tgt.fonu;
    if (tfx.has('duXing4') && tgt === b.P) d *= 1 - DUXING_DR * emptySlots(b, tgt);
    if (tgt.gDr && src.side === 'e') d *= 1 - Math.min(60, tgt.gDr * (tgt.hp / tgt.maxHp < 0.3 ? 2 : 1)) / 100;
    if (src.side === 'e' && (tgt.xDr || tgt.xLast)) d *= 1 - Math.min(50, (tgt.xDr || 0) + (tgt.hp / tgt.maxHp < 0.3 ? tgt.xLast || 0 : 0)) / 100;
    if (tgt === b.P && src.side === 'e') {
      if (tfx.has('xiuluoBelt') && tgt.hp / tgt.maxHp < 0.3) d *= 0.7;
      if (tfx.has('taijiOff') && tgt.shield > 0 && elem !== 'phys') d *= 0.7;
      if (tfx.has('zhenxieOff')) d *= 1 - 0.08 * stHas(src, 'any');
      if (tfx.has('baiduOff') && src.st.poison) d *= 0.8;
      if (tgt.st.shijia) d *= 0.85;
    }
    if (tgt.yi && tgt.yi.mozun) d *= 1.08;
    if (tfx.has('stoneSkin')) d *= 0.88;
    if (tgt === b.P) {
      if (tgt.sanN) d *= 1 - Math.min(SAN_DR_CAP, SAN_DR * tgt.sanN);
      if (b.dice === 'dr') d *= 0.8;
      if (tgt.yy === 'yin') d *= 0.7;
      if (tfx.has('gRest') && (b.pr || 0) <= 2) d *= 0.6;
      if (tfx.has('cFuryDr')) d *= 1 - 0.015 * Math.floor((tgt.fury || 0) / 10);                                 // 狂血佩
      if (tfx.has('cLianDr')) d *= 1 - 0.04 * Math.min(5, tgt.lian || 0);                                         // 聚灵带
      if (tfx.has('cHalf') && RNG.ch(0.25)) d *= 0.5;                                                             // 罗汉步
      if (tgt.jy && tgt.jy.panshi && tgt.hp / tgt.maxHp > 0.7) d *= 1 - tgt.jy.panshi / 100;                     // 九幽·坚岳
    }
    if (tfx.has('budong2') && tgt.shield > 0) d *= 0.8;
    if (tfx.has('lastStand') && tgt.hp / tgt.maxHp < 0.3) d *= 0.6;
  }
  // 大地图第二章起：等级差直接影响伤害。比妖物低 1 级：打出 -7%、挨打 +6%（最多按 6 级算）；
  // 比妖物高：收益压低（W_LVUP），高 1 级只 +2% / -2%，最多按 4 级算——要变强得靠刷装备，不是靠练级碾压
  if (b.run && b.run.world && b.run.mode === 'story' && b.run.chapter >= 2 && b.P) {
    const heroLv = b.P.lv || 1;
    const lvMul = (gp, dn, up) => gp > 0 ? 1 + Math.min(W_LVUP[2], gp) * up : 1 + Math.max(-6, gp) * dn;
    if (src.side === 'p' && tgt.side === 'e') d *= lvMul(heroLv - (tgt.lv || heroLv), 0.07, W_LVUP[0]);
    else if (src.side === 'e' && tgt.side === 'p') d *= lvMul(heroLv - (src.lv || heroLv), -0.06, -W_LVUP[1]);
  }
  if (src.side === 'e' && tgt.kind === 'hero') d *= MON_UP * (1 - ((SUST[tgt.cls] || {}).dr || 0) / 100);   // 只加在主角身上；狂刀客皮厚，正好抵掉
  if (DR_CAP < 1 && src.side === 'e' && tgt === b.P && dA > 0) {   // 各种「受到的伤害 -x%」连乘封顶（护甲、全抗不算在内）
    const pre = (tgt.st.chan ? 1 - CHAN_DR / 100 : 1) * (tgt.fmR ? 1 - tgt.fmR / 100 : 1) * (tgt.st.butui ? 0.5 : 1), T = pre * d / (dA * MON_UP);
    if (T < 1 - DR_CAP) d *= (1 - DR_CAP) / T; }
  // 全抗词条不再随等级涨（普通装备第七章从约 48 掉到约 33），妖物打主角的术法伤害按章节相应调低（W_TUNE[章][4]）
  if (src.side === 'e' && tgt.kind === 'hero' && elem !== 'phys' && b.run && b.run.mode === 'story' && b.run.world) d *= (W_TUNE[b.run.chapter] || [])[4] || 1;
  d = Math.max(1, Math.round(d * RNG.f(0.9, 1.1)));
  if (b.capHit && src.side === 'e' && tgt.side === 'p' && d > tgt.maxHp * b.capHit) d = Math.round(tgt.maxHp * b.capHit);   // 幻境守关蓄力的大招：一下最多打掉一半气血，不会满血被秒
  else if (src.kind === 'boss' && tgt.side === 'p' && riftB(b) && b.capAcc) {   // 守关妖王出一次手（连带词缀的追击）对同一个人最多打掉六成气血，不会满血被秒
    const used = b.capAcc[tgt.id] || 0, room = Math.max(0, Math.round(tgt.maxHp * R_BOSS_CAP) - used); if (d > room) d = Math.max(1, room); b.capAcc[tgt.id] = used + d; }
  if ((tgt.kind === 'boss' || tgt.bty) && src.side === 'p' && b.units.some(x => x.side === 'e' && x.hp > 0 && x.protect)) { d = Math.max(1, Math.round(d * 0.65)); if (RNG.ch(0.3)) out.pops.push([tgt.id, "Hộ giá", 'miss']); }
  if (tgt.kind === 'hero' && tgt.cls === 'necro' && src.side === 'e' && !opt.proc && d > 1) {   // 替死：僵尸代受一部分
    const Z = zombiesOf(b).sort((x, y) => (y.taunt ? 1 : 0) - (x.taunt ? 1 : 0) || y.hp - x.hp)[0];
    if (Z) { const all = !!tgt.st.guardZ; if (all) delete tgt.st.guardZ; const part = Math.min(Z.hp, all ? d - 1 : Math.round(d * Math.min(60, sustV(tgt, 'a')) / 100)); if (part >= 1) { Z.hp -= part; d -= part; out.pops.push([Z.id, popN(Z, part), 'phys']); } }
  }
  if (tgt.kind === 'ally' && src.side === 'e' && b.P && b.P.fx && b.P.fx.has('cBodhi')) d = Math.max(1, Math.round(d * 0.7));   // 菩提子
  if (tgt.side === 'p' && src.side === 'e' && tgt.st.kangG && d > 1) {   // 康总管挡刀：替全队挡
    const K = b.units.find(x => x.cid === 'kang' && x.hp > 0 && x !== tgt && x.hp / x.maxHp > 0.25);   // 自己血不到四分之一就不挡了
    if (K) { const part = Math.round(d * (K.afl >= 10 ? 0.4 : 0.3)), own = Math.min(K.hp - 1, Math.round(part * 0.6));   // 挡下的那部分，康总管自己只吃六成（皮糙肉厚）
      if (part > 0 && own > 0) { K.hp -= own; d -= part; out.pops.push([K.id, popN(K, own), 'phys']); stAdd(b, K, 'guard', part); } } }
  const hsT = tgt === b.P && src.side === 'e' ? hsOf(b) : null; if (hsT) { hsT.hitN++; hsT.raw += Math.max(d, dRaw); }
  const dPre = d, shieldThorns = tgt.shield > 0 && tgt.runes && tgt.runes.aegis === 'a';
  if (tgt.shield > 0) {
    const a = Math.min(tgt.shield, d); tgt.shield -= a; d -= a; if (tgt.side === 'p') stAdd(b, tgt, 'shield', a); if (hsT) hsT.sh += a;
    if (tgt === b.P && a > 0 && tgt.shield <= 0 && tgt.lgv && tgt.lgv.xuanjia != null && src.side === 'e' && (b.xjAt == null || (b.pr || 0) - b.xjAt >= 2)) {   // 玄甲玉：护体打碎炸开
      b.xjAt = b.pr || 0; out.pops.push(['P', "Huyền Giáp", 'crit']); aliveOf(b, 'e').forEach(f => hit(b, tgt, f, LGV.xjBoom(tgt.lgv.xuanjia) / 100, 'holy', out, { proc: 1, aoe: 1, refl: 1, tag: "Huyền Giáp Ngọc" })); }
    if (tgt === b.P && a > 0 && tgt.shield <= 0 && tfx && tfx.has('cTagang') && (b.tagang || 0) < 2) {   // 踏罡步：护体打光，冰冻全场
      b.tagang = (b.tagang || 0) + 1; out.lines.push("Đạp Cương Bộ: hộ thể vỡ, hàn khí cuốn qua cả sân"); aliveOf(b, 'e').forEach(f => freezeU(f, out, "Đóng băng")); }
    if (d <= 0) {
      out.pops.push([tgt.id, "Khiên", 'miss']);
      if (shieldThorns && src.hp > 0) { const r = Math.round(dPre * 0.3); src.hp -= r; out.pops.push([src.id, "Phản thương" + r, 'thorn', 0, tgt === b.P ? 'P' : '', "Phản thương"]); if (tgt === b.P) hsDmg(b, "Phản thương", r); }
      thornHit(b, tgt, src, out, opt);
      return 0;
    }
  }
  if (tgt.kind === 'hero' && src.side === 'e' && !opt.noBlock && RNG.ch(0.12)) { d = Math.max(1, Math.round(d * 0.5)); out.pops.push([tgt.id, "Đỡ đòn", 'block']); }
  tgt.hp -= d;
  if (crit && src === b.P && src.jy && src.jy.shihun && src.hp > 0 && d > 0) heal(src, d * src.jy.shihun / 100, out, true);   // 九幽·噬魂
  if (tgt.side === 'e') stAdd(b, src, 'dmg', d + Math.min(0, tgt.hp)); else stAdd(b, tgt, 'taken', d);
  if (hsT) hsT.hp += d;
  else if (src === b.P && tgt.side === 'e') { hsDmg(b, opt.tag || (opt.ult ? "Tất sát" : !opt.proc && b.castSk ? b.castSk.n : "Hiệu ứng"), d + Math.min(0, tgt.hp)); if (!opt.proc && !opt.tag && !opt.ult) { const h = hsOf(b); h.n++; if (crit) h.cr++; } }
  out.pops.push([tgt.id, popN(tgt, d), crit ? 'crit' : elem, 0, src === b.P ? 'P' : '', opt.tag || '']);
  if (tgt.side === 'e' && b.P && b.P.fx) {   // 职业神兵：打中之后
    const PF = b.P.fx;
    if (src === b.P && tgt.st.melt && PF.has('cMeltFury') && b.mfAt !== b.pr) { b.mfAt = b.pr; src.fury = Math.min(100, (src.fury || 0) + 4); }          // 嗜战刀鞘
    if (src === b.P && b.castSk && tgt.st.poison && PF.has('cQixing') && b.qxAt !== b.pr) { const k2 = src.skills.filter(k => k.left > 0).sort((x, y) => y.left - x.left)[0]; b.qxAt = b.pr; if (k2) { k2.left--; out.pops.push(['P', "Thất Tinh", 'buff']); } }   // 七星铃
    if (src.kind === 'minion' && tgt.hp > 0 && !tgt.st.poison && PF.has('cRotBelt')) { applyPoison(b.P, tgt, 35, b.P.poisonPct || 0); out.pops.push([tgt.id, "Trúng độc", 'poison', 1]); }   // 腐尸带
  }
  if (tgt.kind === 'hero' && src.side === 'e' && tgt.cls === 'berserker') tgt.fury = Math.min(100, (tgt.fury || 0) + 8 * (tgt.st.butui ? 2 : 1) * (1 + (tgt.furyGain || 0) / 100));
  if (tgt.thornsP && src.side === 'e' && src.hp > 0) { const r = Math.max(1, Math.round(d * tgt.thornsP)); src.hp -= r; out.pops.push([src.id, "Phản chấn" + r, 'thorn']); }
  thornHit(b, tgt, src, out, opt);
  if (tgt.kind === 'hero' && tgt.yi && src.side === 'e' && !opt.proc) {
    if (tgt.yi.shimo && src.hp > 0 && tgt.hp > 0 && RNG.ch((15 + tgt.yi.shimo * 5) / 100)) { out.pops.push([tgt.id, "Dung Tâm", 'fire']); out.yi = 'shimo'; hit(b, tgt, src, 0.8 + tgt.yi.shimo * 0.3, 'fire', out, { proc: 1 }); stSet(tgt, src, 'burn', out); }
    if (tgt.yi.shemu && !b.shed && tgt.hp > 0 && tgt.hp / tgt.maxHp < 0.35) { b.shed = true; heal(tgt, tgt.maxHp * (14 + tgt.yi.shemu * 5) / 100, out);
      for (const k of ['poison', 'burn', 'frozen', 'slow']) delete tgt.st[k]; out.pops.push([tgt.id, "Lột Da", 'buff']); out.yi = 'shemu'; out.lines.push("Dịch Sứ · Xà Mẫu: bạn lột đi một lớp da, vết thương khép lại"); }
  }
  if (src.side === 'p' && tgt.side === 'e' && tgt.hp > 0 && b.P && b.P.yi && b.P.yi.niuma && (tgt.kind === 'normal' || tgt.kind === 'mini') && tgt.hp / tgt.maxHp < YI_HOOK(b.P.yi.niuma) / 100) {
    tgt.hp = 0; out.pops.push([tgt.id, "Câu Hồn", 'curse']); out.yi = 'niuma'; }
  if (pay) {
    b.reacts = (b.reacts || 0) + 1;
    out.pops.push([tgt.id, pay.n, 'react']); (out.react = out.react || []).push({ id: tgt.id, n: pay.n, s: pay.s });
    if (pay.x === 'heal' && src.hp > 0) heal(src, src.maxHp * pay.v, out);
    if (pay.x === 'spread') aliveOf(b, 'e').filter(f => f !== tgt).forEach(f => stSet(src, f, pay.s, out));
    if (pay.x === 'detonate' && src.fx && src.fx.has('wanFu6') && !src.fx.has('wWanfu')) aliveOf(b, 'e').filter(f => f !== tgt).forEach(f => hit(b, src, f, 0, elem, out, { flat: Math.round(d * WANFU_SPLASH), proc: 1, aoe: 1, raw: 1 }));
    if (pay.x === 'shatter' && src.fx && src.fx.has('shatterBlast')) aliveOf(b, 'e').filter(f => f !== tgt).forEach(f => hit(b, src, f, 0, 'cold', out, { flat: Math.round(d * 0.6), proc: 1, aoe: 1 }));
  }
  if (SK && SK.ap && tgt.side === 'e' && tgt.hp > 0 && !opt.proc && RNG.ch(SK.apc || 1)) { stSet(src, tgt, SK.ap, out);
    if (src === b.P && fx && fx.has('wanFu4') && !opt.aoe) aliveOf(b, 'e').filter(f => f !== tgt && !stHas(f, SK.ap)).forEach(f => stSet(src, f, SK.ap, out)); }
  if (src.kind === 'minion' && tgt.side === 'e' && tgt.hp > 0 && b.P.fx.has('minionArmor') && !tgt.st.melt) stSet(src, tgt, 'armor', out);
  if (src === b.P && fx && fx.has('qianjiBelt') && b.castSk && DART_SK.has(b.castSk.id) && !opt.proc) { src.dartN = (src.dartN || 0) + 1; if (src.dartN >= 5) { src.dartN = 0; for (const k2 of src.skills) if (k2.left > 0 && k2 !== b.castSk) k2.left--; out.pops.push(['P', "Thiên Cơ", 'buff']); } }
  if (src === b.P && fx && !opt.proc && b.castSk) {
    if (fx.has('wQisha') && b.castSk.fin && tgt.hp < 0) { const nx = aliveOf(b, 'e').find(f => f !== tgt); if (nx) { out.pops.push([nx.id, "Thất Sát", 'crit']); hit(b, src, nx, 0, elem, out, { flat: Math.round(-tgt.hp * src.wpK), proc: 1, raw: 1 }); } }
    if (fx.has('wLihua') && DART_SK.has(b.castSk.id) && RNG.ch(0.3)) { const al = aliveOf(b, 'e'), t2 = al.length ? RNG.pick(al) : null; if (t2) { out.pops.push([t2.id, "Lê hoa", 'cold']); if (hit(b, src, t2, 0.6 * src.wpK, 'cold', out, { proc: 1 })) stSet(src, t2, 'chill', out); } }
  }
  if (src.kind === 'hero' && !opt.ult && b.rgT !== b.turn) { b.rgT = b.turn; addRage(src, crit ? 9 : 5); }   // 2026-11-24：一次出手只攒一次怒气（多段、群攻不再攒得飞快）
  if (src === b.P && src.xDouble && !opt.proc && !opt.aoe && tgt.hp > 0 && RNG.ch(src.xDouble / 100)) { out.pops.push([tgt.id, "Liên trảm", 'crit']); hit(b, src, tgt, mult * 0.5, elem, out, { proc: 1 }); }
  if (tgt.kind === 'hero' || tgt.kind === 'ally') addRage(tgt, 6);
  if (tgt.kind === 'hero') {
    heroSave(b, tgt, out);   // 免死：替身草人、修罗不死、同心锁、不灭金身甲（各自每场一次）
    if (tgt.hp > 0 && tgt.hp / tgt.maxHp < 0.3 && tfx.has('gPanic') && !b.panic) { b.panic = true; out.lines.push("Kinh Thiền Y rung lên, yêu vật đứng sững cả lũ"); aliveOf(b, 'e').forEach(f => freezeU(f, out)); }
    if (tgt.hp > 0 && tgt.hp / tgt.maxHp < 0.35 && tfx.has('cXuming') && (b.xuming || 0) < 2) { b.xuming = (b.xuming || 0) + 1; heal(tgt, tgt.maxHp * 0.2, out); out.pops.push([tgt.id, "Tục mệnh", 'buff']); }   // 续命灯
    if (tgt.hp > 0 && tgt.hp / tgt.maxHp < 0.3 && tfx.has('phoenix') && !b.phoenix) {
      b.phoenix = true; out.lines.push("Lông phượng hoàng bùng cháy!"); out.cast = { id: 'phoenix', elem: 'fire', aoe: true };
      aliveOf(b, 'e').forEach(f => hit(b, tgt, f, 3, 'fire', out, { proc: 1 }));
    }
  }
  let lee = (src.leech || 0) / 100 * (fx && fx.has('vampire') ? 2 : 1) * (fx && fx.has('wXiuluo') && src.hp / src.maxHp < 0.5 ? 2 : 1);
  if (src.aff && src.aff.includes('vamp')) lee += 0.3;
  if (src.st.warcry && src.runes && src.runes.warcry === 'b') lee += 0.1;
  if (src.st.rumo && !(fx && fx.has('buSi4'))) lee += ULT.rmLee;   // 不死套要压着血线，入魔不吸血
  if (lee && src.kind === 'hero' && src.cls !== 'berserker') { const k = BK || 1; lee *= (0.3 + 0.7 / (k * k)) / k; }   // 三成；刚出门那几级气血还没放大多少，吸血也就还没怎么缩，平滑过渡
  if (lee) heal(src, d * lee, out, true);
  if (opt.proc) return d;
  if (src.side === 'p') {
    if (src.kind === 'hero' && fx.has('frenzy') && src.frenzy < 10) src.frenzy++;
    if (src.freeze && RNG.ch(src.freeze / 100)) freezeU(tgt, out);
    if (fx && fx.has('frostbite') && RNG.ch(0.15)) freezeU(tgt, out);
    if (src.poison && tgt.hp > 0) applyPoison(src, tgt, src.poison);
    if (fx && fx.has('chain') && !opt.aoe && RNG.ch(0.2)) {
      out.lines.push("Phong bạo nộ: sét bùng nổ!");
      aliveOf(b, 'e').forEach(f => hit(b, src, f, 0.5, 'light', out, { proc: 1 }));
    }
    if (fx && fx.has('cleave') && !opt.aoe) aliveOf(b, 'e').filter(f => f !== tgt).forEach(f => hit(b, src, f, mult * 0.35, elem, out, { proc: 1 }));
    if (src === b.P && b.guiYuan && !opt.aoe) aliveOf(b, 'e').filter(f => f !== tgt).forEach(f => hit(b, src, f, mult * 0.6, elem, out, { proc: 1, aoe: 1 }));
    if (crit && fx && fx.has('shadowDance') && RNG.ch(0.35)) { const t2 = tgt.hp > 0 ? tgt : aliveOf(b, 'e')[0]; if (t2) hit(b, src, t2, 1, 'phys', out, { proc: 1 }); }
  } else {
    if (src.aff.includes('cold') && RNG.ch(0.2)) freezeU(tgt, out);
    if (src.aff.includes('venom') && tgt.hp > 0) tgt.st.poison = { d: dotIn(b, src, tgt, src.atk * 0.25), t: 3 };
    if (src.aff.includes('fiery')) hit(b, src, tgt, 0.4, 'fire', out, { proc: 1 });
  }
  if (tgt.hp > 0 && src.hp > 0) {
    let refl = tgt.thorns || 0;
    if (tfx && tfx.has('bulwark')) {
      refl += d * 0.4;
      const w = tgt.skills.find(s => s.id === 'whirl'); if (w && w.left > 0) w.left--;
    }
    if (shieldThorns) refl += dPre * 0.3;
    if (tgt.aff && tgt.aff.includes('thorny')) {   // 反震：弹回 25%。幻境里精英的血是主角的十几、几十倍，照单全收等于打死它之前先弹死自己——所以封顶，并且先扣护体
      let r = d * 0.25;
      if (src.kind === 'hero') {   // 主角：从这次出手到下次出手之间，合计最多弹掉最大气血的 THORN_CAP；护体真气先挡
        r = Math.max(0, Math.min(r, src.maxHp * THORN_CAP - (b.thTurn || 0))); b.thTurn = (b.thTurn || 0) + r;
        const a2 = Math.min(src.shield || 0, r); if (a2 >= 1) { src.shield -= a2; r -= a2; if (r < 1) out.pops.push([src.id, "Khiên", 'miss']); }
      } else r = Math.min(r, src.maxHp * THORN_CAP);   // 同伴、僵尸：每一击封顶
      refl += r;
    }
    if (tgt.st.butui && tgt.runes && tgt.runes.butui === 'b') refl *= 2;
    if (refl >= 1) { refl = Math.round(refl); src.hp -= refl; if (src === b.P && src.hp <= 0) heroSave(b, src, out); out.pops.push([src.id, "Phản thương" + refl, 'thorn', 0, tgt === b.P ? 'P' : '', "Phản thương"]); if (src === b.P) { const h = hsOf(b); h.raw += refl; h.hp += refl; } else if (tgt === b.P) hsDmg(b, "Phản thương", refl); }
    if (tfx && tfx.has('revenge') && src.hp > 0 && RNG.ch(0.3)) hit(b, tgt, src, 1, 'phys', out, { proc: 1 });
  }
  return d;
}
// 主角挨到致命伤时的免死（挨打和持续伤害都走这里；2026-11-24 原来只有挨打才查，被毒、被烧死的时候免死不触发）
// 妖物挂在我方身上的持续伤害：原来直接按妖物攻击算，护甲、抗性、减伤全不吃，高层一跳就能打掉大半血。
// 现在按抗性和各种减伤打折，幻境里一跳最多打掉最大气血的 R_DOT_CAP（2026-11-24）
const R_DOT_CAP = 0.06;
function dotIn(b, src, t, d) {
  if (!t || t.side !== 'p' || !src || src.side !== 'e') return d;
  let k = 1 - Math.min(RES_SOFT[1], t.res || 0) / 100;
  if (t.kind === 'hero') k *= MON_UP * (1 - ((SUST[t.cls] || {}).dr || 0) / 100);
  if (t.xDr) k *= 1 - Math.min(50, t.xDr) / 100;
  if (t.sanN) k *= 1 - Math.min(SAN_DR_CAP, SAN_DR * t.sanN);
  if (t.st && t.st.chan) k *= 1 - CHAN_DR / 100;
  if (t.fx && t.fx.has('luoHan6') && t.fonu) k *= 1 - 0.04 * t.fonu;
  d *= k; if (b && riftB(b) && t.maxHp) d = Math.min(d, t.maxHp * R_DOT_CAP);
  return d;
}
function heroSave(b, tgt, out) {
  const tfx = tgt.fx; if (!tfx || tgt.hp > 0) return;
    if (tgt.hp <= 0 && tfx.has('caorenOff') && !b.caoren) { b.caoren = true; tgt.hp = Math.round(tgt.maxHp * 0.25); out.lines.push("Hình nhân thế mạng chịu thay bạn đòn này!"); out.pops.push([tgt.id, "Hình nhân", 'buff']);
      aliveOf(b, 'e').forEach(f => { applyPoison(tgt, f, 35, tgt.poisonPct || 0); out.pops.push([f.id, "Trúng độc", 'poison', 1]); }); }
    if (tgt.hp <= 0 && tfx.has('buSi6') && !b.buSi) { b.buSi = true; tgt.hp = 1; tgt.st.butui = 3; out.lines.push("Tu La Bất Tử: bạn nhất quyết không ngã!"); out.pops.push([tgt.id, "Bất Tử", 'buff']); }
    if (tgt.hp <= 0 && tfx.has('gBond') && !b.bond) { const al = b.units.find(x => x.kind === 'ally' && x.hp > 0);   // 同心锁
      if (al) { b.bond = true; tgt.hp = Math.round(tgt.maxHp * 0.2); al.hp = Math.max(1, Math.round(al.hp - al.maxHp * 0.5)); out.lines.push(`${al.name} đỡ thay bạn đòn này!`); out.pops.push([al.id, "Đồng tâm", 'buff']); } }
    if (tgt.hp <= 0 && tfx.has('cheatDeath') && !b.cheated) {
      b.cheated = true; tgt.hp = Math.round(tgt.maxHp * 0.3);
      out.lines.push("Giáp Bất Hủ tỏa sáng, bạn trở về từ bờ vực cái chết!"); out.pops.push([tgt.id, "Bất hủ", 'buff']);
    }
    if (tgt.hp <= 0 && tgt.jy && tgt.jy.bumie && !b.jyBm) { b.jyBm = true; tgt.hp = Math.round(tgt.maxHp * tgt.jy.bumie / 100); out.lines.push("Cửu U · Hồi Hồn: bạn gắng gượng không ngã."); out.pops.push([tgt.id, "Hồi hồn", 'buff']); }
}
// 反震（2026-11-24 和反击合并）：和尚没有「反击」了，挨打只有反震——每挨一下打（被护体挡下的也算）必定弹一下：
//   伤害 = 攻击 × 反震倍率 × (1 + 反震伤害%)，佛光，吃伤害加成和佛怒。和尚自带反震倍率 +MONK_THK%（calcStats），狮子吼嘲讽期间再 +50%。
//   和尚每反震一次攒一层「震」（罗汉 4 件：狮子吼期间攒两层），攒满 JZ_N 层（金刚铃 8 层）自动放「金刚震」：佛光打所有敌人 = 攻击 × 反震倍率 × JZ_K。
//   真挨打的反震（不算定身、护法）才回血（金刚不坏）、给金身玉护体、木鱼回血
// 护法金身：伙伴晕住/冻住的妖物，跳过回合时照样吃和尚一次完整反震（act 里，opt.thf）；妖物打伙伴，和尚替伙伴反震一半（HUFA_K）。和尚自己晕住的不算
// 罗汉佛怒（2026-11-24 回调）：反震一半几率叠一层，每层伤害 +20%（原来必叠、每层 +30%，开场一轮就满层，伤害太高）
const FONU_CH = 0.5, FONU_DMG = 0.2;
const CHAN_DR = 45, THORN_TAUNT = 50, HUFA_K = 0.5, MONK_THK = 30, JZ_N = 10;
let JZ_K = 0.7;   // 2026-11-24 模拟定的：罗汉单刷强度和改前差不多（快一成多），控场队快两成、高层胜率高一成
const jzNeed = P => P && P.fx && P.fx.has('cCounter') ? 8 : JZ_N;
function thornHit(b, tgt, src, out, opt) {
  let f = opt.thf || 1, real = !opt.thf;
  if (tgt !== b.P && tgt.kind === 'ally' && b.P && b.P.cls === 'paladin') { f *= HUFA_K; tgt = b.P; real = false; }
  if (tgt !== b.P || src.side !== 'e' || src.hp <= 0 || tgt.hp <= 0 || opt.refl) return;
  const tfx = tgt.fx || new Set(), chan = !!tgt.st.chan, monk = tgt.cls === 'paladin', lh4 = chan && tfx.has('luoHan4');
  let K = (tgt.thornK || 0) + (chan && monk ? THORN_TAUNT : 0); if (K <= 0) return;
  if (lh4) K *= 2;
  if (tgt.st.jsh) K *= 1 + ULT.jsThk;   // 和尚必杀「金身」
  K *= 1 + (tgt.thornDmg || 0) / 100;
  const d = hit(b, tgt, src, K * f / 100, 'holy', out, { proc: 1, refl: 1, tag: "Phản chấn" });
  if (!monk) return;
  if (real) {
    heal(tgt, tgt.maxHp * sustV(tgt, 'a') / 100, out, true);   // 金刚不坏：挨打反震回血
    if (tgt.lgv && tgt.lgv.jinshen != null) { const capS = tgt.maxHp * 0.5; if ((tgt.shield || 0) < capS) tgt.shield = Math.round(Math.min(capS, (tgt.shield || 0) + tgt.maxHp * LGV.jsSh(tgt.lgv.jinshen) / 100)); }   // 金身玉：挨打反震给自己护体
    if (tfx.has('muyuOff')) { heal(tgt, tgt.maxHp * 0.015, out, true); b.units.filter(u => u.kind === 'ally' && u.hp > 0).forEach(u => heal(u, u.maxHp * 0.04, out, true)); }   // 镇心木鱼
  }
  if (tfx.has('luoHan6')) {
    if (tgt.fonu < (tfx.has('fumoBelt') ? 15 : 10) && RNG.ch(FONU_CH)) { tgt.fonu++; out.pops.push([tgt.id, "Phật nộ " + tgt.fonu, 'buff']); }
    if (d > 0) heal(tgt, d * 0.1, out, true);
  }
  tgt.zhen = (tgt.zhen || 0) + (lh4 ? 2 : 1);
  if (tgt.zhen >= jzNeed(tgt)) { tgt.zhen = 0; jinZhen(b, tgt, K, out); }
}
// 金刚震：攒满「震」自动放，佛光扫过全场。伏魔禅杖伤害 +100%（随兵器成色），金刚铃 +30%，伏魔带打中的 30% 几率晕住
function jinZhen(b, P, K, out) {
  const tfx = P.fx, m = K / 100 * JZ_K * (tfx.has('wFumo') ? 1 + P.wpK : 1) * (tfx.has('cCounter') ? 1.3 : 1);
  out.jzz = 1; out.lines.push("Kim Cương Chấn! Phật quang quét qua cả sân");
  aliveOf(b, 'e').forEach(f => { hit(b, P, f, m, 'holy', out, { proc: 1, aoe: 1, refl: 1, tag: "Kim Cương Chấn" }); if (tfx.has('fumoBelt') && f.hp > 0 && RNG.ch(0.3)) freezeU(f, out, "Choáng"); });
}
function resolveDeaths(b, out) {
  const run = b.run, P = b.P;
  for (const u of b.units) {
    if (u.hp > 0 || u.dead) continue;
    if (u.kind === 'hero' && u.fx && u.fx.has('lastBreath') && !b.lastBreath) { b.lastBreath = true; u.hp = 1; u.st.butui = 2; out.pops.push([u.id, "Bất Tử", 'buff']); out.lines.push("Còn một hơi thở — bạn vẫn đứng vững!"); continue; }
    if (u.kind === 'hero' && run && run.tishen > 0) { run.tishen--; u.hp = Math.round(u.maxHp * 0.3); out.pops.push([u.id, "Hình nhân thế mạng", 'buff']); out.lines.push(`Một hình nhân giấy “phụt” một cái đỡ thay bạn đòn này, cháy thành tro (còn ${run.tishen} cái)`); continue; }
    if (u.side === 'e' && P && P.cls === 'assassin' && P.hp > 0) heal(P, P.maxHp * sustV(P, 'c') / 100, out);
    if (u.side === 'e' && P && P.xKill && P.hp > 0) heal(P, P.maxHp * P.xKill / 100, out, true);
    u.dead = true; u.hp = 0;
    if (u.kind === 'ally') { out.say = [u.id, u.cid === 'kang' ? "Ối cái lưng già của ta… rút, rút thôi!" : "Tôi, tôi rút lui chút đã! Ngươi chống đỡ cho ta!"]; out.lines.push(`${u.name} lui về phía sau`); continue; }
    if (u.kind === 'ward') { b.wardDown = true; out.lines.push(`${u.name} ngã xuống rồi…`); continue; }
    if (u.kind === 'minion' && P.cls === 'necro' && P.hp > 0) heal(P, P.maxHp * sustV(P, 'b') / 100, out);
    if (u.kind === 'minion' && P.fx.has('yinBing4')) { const dmg = Math.round(u.maxHp * 0.5); aliveOf(b, 'e').forEach(f => hit(b, P, f, 0, 'magic', out, { flat: dmg, proc: 1, aoe: 1 })); out.pops.push([u.id, "Âm binh nổ", 'fire']); }
    if (u.kind === 'minion' && P.fx.has('ganshiBelt') && P.hp > 0 && !ZOMBIES[u.zt].ult && !(b.revUsed = b.revUsed || {})[u.slot]) { b.revUsed[u.slot] = 1; (b.revQ = b.revQ || []).push({ zt: u.zt, slot: u.slot, t: 3 }); }
    if (u.side === 'e' && u.st && u.st.poison && P.fx.has('baiduOff')) { const nx = aliveOf(b, 'e').find(f => f !== u && !f.st.poison); if (nx) { nx.st.poison = { d: u.st.poison.d, t: 3 }; out.pops.push([nx.id, "Truyền độc", 'poison', 1]); } }
    if (u.kind === 'minion' && P.fx.has('corpseBurst')) { aliveOf(b, 'e').forEach(f => stSet(P, f, 'burn', out)); out.lines.push("Cương thi nổ tung, thi hỏa văng tứ tung"); }
    if (u.side !== 'e') continue;
    if (u.kind === 'boss' && u.dieSay && !u.guard) { out.say = [u.id, u.dieSay]; }
    if (u.escaped) { b.goblinEscaped = true; continue; }
    b.corpses++; b.dead.push(u);
    out.lines.push(`${u.name} ngã xuống`);
    const nm = MK(u.def.n); SAVE.kills[nm] = (SAVE.kills[nm] || 0) + 1;
    track('kill');
    if (u.kind === 'elite') track('elite');
    if (u.kind === 'boss') track('boss');
    if (u.kind === 'goblin') { SAVE.stats.goblins++; track('goblin'); }
    if (run.mode === 'rift' && run.world) { if (u.kind !== 'boss') rAddPts(run, u.kind === 'elite' ? (u.rare ? 6 : 4) : u.kind === 'mini' ? 0.3 : 1); }
    else if (run.mode === 'rift' && u.kind !== 'boss') run.prog = Math.min(100, run.prog + 1.7 * (u.kind === 'elite' ? (u.rare ? 18 : 12) : u.kind === 'mini' ? 1.5 : u.kind === 'goblin' ? 5 : 4));
    if (P.fx.has('killHeal')) heal(P, P.maxHp * 0.1, out);
    if (u.side === 'e' && P.lgv && P.lgv.shisha != null && P.hp > 0) { P.ssN = Math.min(3, (P.ssN || 0) + 1); heal(P, P.maxHp * LGV.ssHeal(P.lgv.shisha) / 100, out, true); }   // 嗜杀玉
    if (P.fx.has('lootKill') && RNG.ch(0.12)) b.extraLoot++;
    if (P.fx.has('gMidas') && RNG.ch(0.25)) { b.midas = (b.midas || 0) + 1; out.pops.push([u.id, "Bạc", 'buff']); }
    if (P.fx.has('gKillCrit')) P.kcNext = true;
    if (u.st.lamp && P.fx.has('gLamp')) { const nx = aliveOf(b, 'e').find(f => f !== u); if (nx) { nx.st.lamp = true; out.pops.push([nx.id, "Dẫn hồn", 'curse']); } }
    if (u.kind === 'elite' && !u.rev && !u.guard && !u.bty && P.fx.has('gRevive') && RNG.ch(0.2)) {   // 轮回戒：还魂再打一次，掉落照给
      const c = { ...u, id: uid(), st: {}, dead: false, rev: true, rare: false, hp: Math.round(u.maxHp / 2), name: "Hoàn hồn ·" + u.def.n, g: 0 }; delete c.charging; delete c.healN; delete c.roarN; b.units.push(c);   // 照原样复制一只（幻境里精英的气血是另外放大过的，重新造会变弱）
      out.lines.push(`${u.name} hoàn hồn, lại đứng dậy!`); out.pops.push([c.id, "Hoàn hồn", 'react']);
    }
    if (P.fx.has('momentum') && P.mom < 6) P.mom++;
    if (u.st.mark && P.runes.deathmark === 'a') { const s = P.skills.find(k => k.id === 'deathmark'); if (s) s.left = 0; }
    if (u.st.mark && P.fx.has('markSpread')) { const nx = b.units.find(x => x.side === 'e' && x.hp > 0 && !x.st.mark); if (nx) { nx.st.mark = 4; out.pops.push([nx.id, "Ấn chuyển sang", 'curse']); } }
    if (u.aff.includes('split') && u.kind !== 'mini') {
      for (let i = 0; i < 2; i++) { const c = makeMonster(u.def, u.lv, run, 'mini'); c.name = "Phân liệt ·" + u.def.n; c.g = 30; b.units.push(c); }
      out.lines.push(`${u.name} tách thành hai con!`);
    }
  }
  if (b.ward && !b.wardDown && b.ward.n < b.ward.need && run && run.world) {   // 鬼潮：打掉一个，又涌上来一个
    const W = b.ward, F = CHAPTERS[run.chapter - 1];
    while (aliveOf(b, 'e').length < W.keep) { const m = makeMonster(F.mons[RNG.pick(W.mons)], W.lv, run, 'normal'); m.maxHp = m.hp = Math.round(m.hp * W_NORM[0]); m.atk *= W_NORM[1]; m.g = RNG.i(0, 40); b.units.push(m); }
  }
  if (b.reinf && b.reinf.length && P.hp > 0) {   // 幻境合战：台上倒下一只，后面排队的补上来
    let n = 0; while (b.reinf.length && aliveOf(b, 'e').length < R_STAGE) { const u = b.reinf.shift(); u.g = RNG.i(0, 40); b.units.push(u); n++; }
    if (n) out.lines.push(`Thêm ${n} con yêu vật nữa vây tới (phía sau còn ${b.reinf.length} con)`);
  }
  if (P.hp <= 0 || b.wardDown) { b.over = true; b.win = false; }
  else if (!aliveOf(b, 'e').length) { b.over = true; b.win = true; }
}
function dropItem(run, q, ilvl, mf) { return makeItem({ ilvl, rarity: rollRarity(q, mf, dOf(run).loot), cls: run.cls }); }
function finishBattle(b) {
  const run = b.run, s = runStats(run);
  run.hp = Math.max(0, Math.min(b.P.hp, s.maxHp)); run.rage = Math.round(b.P.rage || 0);
  const res = { win: b.win, xp: 0, gold: 0, items: [], levels: 0, gems: [], mats: 0, zy: [], key: false, goblin: b.goblinEscaped ? 'fled' : null, stat: b.stat || null, hs: b.hs || null };
  run.stat = mergeStat(run.stat, b.stat); run.hs = mergeHs(run.hs, b.hs);
  if (!b.win) return res;
  const lv = SAVE.chars[run.cls].level, di = diffIdx(run), rw = run.mode === 'rift' && !!run.world, sw = !!run.world && !rw;   // rw：新幻境（一局要打上百只，单只的掉落和经验减半）
  DROP_LUCK = s.xLuck || 0; DROP_MF = s.mf || 0;
  for (const u of b.dead) {
    const mult = u.guard ? 5 : u.kind === 'boss' ? 12 : u.kind === 'elite' ? (u.rare ? 5 : 3) : u.kind === 'mini' ? 0.3 : u.kind === 'goblin' ? 2 : 1;
    let x = (6 + u.lv * 3) * (sw && u.kind === 'elite' ? 5 : mult) * run.xpMul * (rw ? 0.5 : 1);
    if (run.mode === 'rift' && run.riftLv > R_LIN[0]) x *= (6 + 3 * rOldLv(run.riftLv)) / (6 + 3 * riftD(run.riftLv).base);   // 妖物等级涨慢了，经验照原来的层数给
    const gap = lv - u.lv;
    if (sw) { if (gap >= 3) x *= Math.max(0.08, 1 - (gap - 2) * 0.3); }   // 大地图：比你低 3 级以上的妖物，经验大减
    else if (gap > 5) x *= Math.max(0.1, 1 - (gap - 5) * 0.12);
    res.xp += Math.round(x);
    res.gold += Math.round((2 + u.lv * 1.2) * (u.kind === 'goblin' ? 25 : mult) * RNG.f(0.7, 1.3) * (1 + s.gf / 100) * (rw ? 0.5 : 1));
    if (u.kind === 'goblin') {
      res.goblin = 'killed';
      for (let i = 0; i < 4 + di; i++) res.items.push(dropItem(run, 'elite', u.lv + 1, s.mf + 50));
      dropGem(res, rollGem(run)); res.mats += RNG.i(4, 8);
      continue;
    }
    const q = u.guard ? 'elite' : u.kind === 'boss' ? 'boss' : u.kind === 'elite' ? 'elite' : 'normal';
    let n = rw ? (q === 'boss' ? 3 + di : q === 'elite' ? 1 : (RNG.ch(u.kind === 'mini' ? 0.02 : 0.06) ? 1 : 0)) : sw ? (q === 'boss' ? 2 : q === 'elite' ? 1 : (RNG.ch(u.kind === 'mini' ? 0.05 : 0.12) ? 1 : 0))
      : u.guard ? 2 : q === 'boss' ? 2 + di : q === 'elite' ? 1 + (RNG.ch(0.5) ? 1 : 0) : (RNG.ch(u.kind === 'mini' ? 0.08 : 0.2) ? 1 : 0);
    if (q !== 'normal' && s.fx.has('lucky')) n++;
    for (let i = 0; i < n; i++) res.items.push(dropItem(run, q, u.lv + (q === 'boss' ? 1 : 0), s.mf));
    if (u.rare) res.items.push(dropItem(run, 'boss', u.lv + 1, s.mf));
    if (run.mode === 'rift') {
      const g = zyGrade(run.riftLv), nm = u.def.n;
      if (q === 'boss' || (q === 'elite' && RNG.ch(u.rare ? 1 : rw ? 0.3 : 0.6))) zyTake(res, nm, g);
      else if (u.kind === 'normal' && RNG.ch((zyOf(nm) < g ? 0.05 : 0.01) * (rw ? 0.4 : 1))) zyTake(res, nm, g);
      if (q === 'boss' && run.riftLv >= RSET2_LV && RNG.ch(WPN_DROP)) { const W = wpnList(run.cls); if (W.length) res.items.push(makeItem({ ilvl: u.lv + 1, rarity: 'legend', cls: run.cls, legendId: RNG.pick(W).id })); }
      const two = run.riftLv >= RSET2_LV;   // 30 层起多一套：两套各半，掉率跟着提，免得凑头一套变慢
      if (run.riftLv >= RSET_LV && RNG.ch(q === 'boss' ? (two ? 1 : 0.7) : u.rare ? (two ? 0.25 : 0.15) : q === 'elite' ? (rw ? (two ? 0.05 : 0.03) : 0.06) : 0)) {
        const avail = SETS.filter(S => S.rift && (S.rlv || RSET_LV) <= run.riftLv), mine = RNG.pick(avail.filter(S => S.cls === run.cls)), other = RNG.pick(avail);
        res.items.push(makeItem({ ilvl: u.lv + 1, rarity: 'set', setId: (RNG.ch(0.85) ? mine : other).id, cls: run.cls }));
        if (two && q === 'boss' && RNG.ch(0.4)) res.items.push(makeItem({ ilvl: u.lv + 1, rarity: 'set', setId: RNG.pick(avail.filter(S => S.cls === run.cls)).id, cls: run.cls }));
      }
    }
    if (RNG.ch(q === 'boss' ? 1 : q === 'elite' ? 0.35 : rw ? 0.02 : 0.05)) dropGem(res, rollGem(run));
    res.mats += q === 'boss' ? RNG.i(4, 7) : q === 'elite' ? RNG.i(1, 3) + (u.rare ? 3 : 0) : (RNG.ch(rw ? 0.05 : 0.12) ? 1 : 0);
    if (run.mode === 'rift' && run.riftLv >= JY_FROM) res.jyx = (res.jyx || 0) + (u.kind === 'boss' ? RNG.i(1, 2) : q === 'elite' && RNG.ch(u.rare ? 0.5 : 0.1) ? 1 : 0);   // 九幽玄晶：400 层起，守关妖王 1–2 颗，精英一成几率
  }
  if (s.fx.has('gFast') && (b.pr || 0) <= 8) b.extraLoot++;                                                                   // 铁算盘
  if (b.midas) res.gold += Math.round(b.midas * (2 + lv * 1.2) * 10 * (1 + s.gf / 100));                                         // 点金手
  for (let i = 0; i < b.extraLoot; i++) res.items.push(dropItem(run, 'normal', cellLv(run, curCell(run)), s.mf));
  DROP_LUCK = 0; DROP_MF = 0;
  if (b.kind === 'keeper') { run.hasKey = true; res.key = true; }
  if (run.pendingReward === 'mats') { res.mats += 8; run.pendingReward = null; }
  run.kills += b.dead.length; SAVE.stats.kills += b.dead.length;
  SAVE.gold += res.gold; run.goldGot += res.gold;
  SAVE.mats += res.mats; run.matsGot += res.mats;
  if (res.jyx) { SAVE.jyx = (SAVE.jyx || 0) + res.jyx; run.jyxGot = (run.jyxGot || 0) + res.jyx; }
  res.gems.forEach(k => addGem(k)); run.gemsGot += res.gems.length;
  const cu = catchUpMul(run.cls); if (cu > 1) { res.xp = Math.round(res.xp * cu); res.cu = cu; }
  res.levels = gainXp(run.cls, res.xp); run.xpGot += res.xp;
  res.items.forEach(it => storeItem(run, it));
  const s2 = runStats(run);
  run.hp = Math.min(s2.maxHp, run.hp + (s2.maxHp - s.maxHp) + Math.round(s2.maxHp * 0.12));
  res.ach = checkAch();
  return res;
}
