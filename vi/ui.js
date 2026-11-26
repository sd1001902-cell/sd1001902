// ============ 九幽回廊 · 界面 ============
'use strict';
{
const $ = s => document.querySelector(s);
const app = $('#app'), modal = $('#modal'), sheet = $('#sheet');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SPEEDS = { 1: 420, 2: 200, 4: 80 };
const CN = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

let COMBO = { n: 0, t: null }, PAUSE = 0;
let GSLOT = null, GSUB = 'stash', ITAB = 'info', BAGTAB = 'stat', HTAB = 'stat', TBR = 0, MODSOPEN = false, AUTO = false, autoT = null, WALKING = false, FRESH = new Set();
let VIEW = 'town', TT = 'go', B = null, BRES = null, timer = null, EVRES = null, CHEST = null, LASTRUN = null, FILTER = 'all', MODALFN = null, BACK = null;

loadSave(); ensureBounties();
if (SAVE.run && SAVE.run.mode === 'tower') SAVE.run = null;   // 通天塔的一场没打完就关了：这层不算，回到塔外重打
if (SAVE.run) VIEW = SAVE.run.world ? 'world' : 'map';
SFX.set(SAVE.sound, false); applyFs();
const mvolOf = () => SAVE.mvol == null ? 0.6 : SAVE.mvol; SFX.vol(mvolOf());
let MTEST = null;   // 设置里正在试听的那一段（离开城镇/标题页就自动取消）

function save() { persist(); }
function applyFs() { document.documentElement.style.setProperty('--fs', SAVE.fs || 1); }
// 掉了传奇：金色光柱 + 声音
function legBeam() {
  if (!SAVE || !SAVE.newLeg || !SAVE.newLeg.length) return;
  const name = SAVE.newLeg.shift(); const el = document.createElement('div'); el.className = 'legbeam legtip'; el.innerHTML = `<i>✦</i><b>Truyền kỳ · ${esc(name)}</b>`;   // 原来是一整道全屏金光，太夸张；现在顶上一条小金条
  document.body.appendChild(el); SFX.play('legend'); setTimeout(() => el.remove(), 2700);
}
setInterval(() => { if (!document.querySelector('.legbeam')) legBeam(); }, 500);
let BTOAST = [];
function toast(msg) { if (VIEW === 'battle' && B && !B.over) { if (!BTOAST.includes(msg)) BTOAST.push(msg); return; } const t = $('#toast'); t.innerHTML = msg;
  { const mp = VIEW === 'world' && !MODALFN && innerWidth <= 700 && document.querySelector('.wmapbox, #wmap, .wmap'); t.style.top = mp ? Math.round(mp.getBoundingClientRect().top + 30) + 'px' : ''; }   // 手机上地图界面的提示落在地图上沿，不盖住气血条和任务栏
  t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); }
function achToast(list) { if (list && list.length) { SFX.play('legend'); setTimeout(() => toast("Đạt thành tựu:" + list.map(a => `<b>${a.n}</b>`).join(", ")), 600); } }
const ctxCls = () => SAVE.run ? SAVE.run.cls : SAVE.cls;
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} giờ ${m} phút` : m ? `${m} phút ${s % 60} giây` : `${s} giây`; };
const num = v => Number.isInteger(v) ? v : (Math.round(v * 10) / 10);
const heroSpr = (cls, size, extra) => typeof HERO !== 'undefined' && HERO.has(cls) ? `<img class="spr hpor ${extra || ''}" src="${HERO.portrait(cls, size >= 100 ? 'full' : 'head')}" width="${size}" height="${size}" alt="" draggable="false">` : SPR.img(CLASSES[cls].spr, size, CLASSES[cls].pal, extra);
// 同伴和常见人物：有侧身新造型的用新造型（头像 / 站姿 / 全身），没有的还用原来的小人图
const unitIcon = (spr, size, pal, extra, mode) => { const lk = typeof HERO !== 'undefined' && HERO.lookOf(spr);
  return lk ? `<img class="spr hpor ${extra || ''}" src="${HERO.portrait(lk, mode || (size >= 100 ? 'full' : size >= 50 ? 'stand' : 'head'), HERO.mapPal(lk, pal))}" width="${size}" height="${size}" alt="" draggable="false">` : SPR.img(spr, size, pal, extra); };
// 顶栏的大数字缩写：十万以上写成「12.3万」，省地方
const fmtBig = n => { n = Math.round(n); if (n < 10000) return String(n); if (n >= 1e8) return `${Math.round(n / 1e7) / 10} tỉ`; const v = n >= 1000000 ? Math.round(n / 10000) : Math.round(n / 1000) / 10; return `${v} vạn`; };
const hpTxt = (v, lv) => fmtBig(hpShow(Math.max(0, v), lv == null ? heroLv() : lv));   // 主角这边的气血数字：乘上气血倍数再显示
// 跳字（2026-11-24 第三版）：游戏体粗数字 + 粗描边（后面垫一层描边字，前面是本色／暴击金色渐变）；头上「爆」出来，弹一下就往上飘、半程淡出，0.7 秒左右；
// 暴击从三倍大旋着砸下来，炸一圈金环、画面抖一下；同一个目标的数字按中、左、右三条道轮流冒；站在最上排的（首领常在后排）数字放到身体中部
const POP_KF = {   // 2026-11-24 第六版：头上冒出、轻弹一下就一路往上飘，飘到七成才开始淡；整段留久一点，看得清
  n: [[0, 6, .7, 0, 0], [.08, 0, 1.12, 1, 0], [.16, -3, 1, 1, 0], [.7, -40, 1, 1, 0], [1, -56, .95, 0, 0]],
  b: [[0, 6, .7, 0, 0], [.08, 0, 1.2, 1, 0], [.18, -3, 1, 1, 0], [.7, -42, 1, 1, 0], [1, -58, .95, 0, 0]],
  c: [[0, 0, 1.5, 0, 0], [.1, -2, .95, 1, 0], [.2, -5, 1.05, 1, 0], [.3, -9, 1, 1, 0], [.72, -42, 1, 1, 0], [1, -58, .95, 0, 0]],
  h: [[0, 0, .7, 0, 0], [.1, -2, 1.1, 1, 0], [.2, -5, 1, 1, 0], [.7, -30, 1, 1, 0], [1, -42, 1, 0, 0]],
};
const POP_MS = { n: 760, b: 800, c: 900, h: 720 };
const popSpd = () => ({ 1: 1, 2: 0.85, 3: 0.72 }[SAVE.speed] || 1);
const popMax = () => ({ 1: 3, 2: 3, 3: 2 }[SAVE.speed] || 3);   // 同一个目标同时留几个数字：倍速越高留得越少（3 倍速新数字直接顶掉旧的）
const popHTML = h => `<i class="o">${h}</i><b>${h}</b>`;
// 累计数字：每个目标一种（伤害 / 掉血 / 回血）只挂一个，往上加
const ACC_IDLE = 650, ACC_KILL = 500, ACC_OUT = 500;   // 2026-11-24 用户：再快一点点
function accPut(el, key, v, o) {
  if (!el || !(v > 0)) return;
  el._acc = el._acc || {}; let a = el._acc[key];
  if (!a || !a.p.isConnected || a.out) {
    const p = document.createElement('span'); p.className = 'pop acc ' + (o.cls || '') + (!o.head && accLow(el) ? ' low' : ''); p.innerHTML = popHTML(`${o.sign || ''}${fmtBig(v)}`); el.appendChild(p);
    if (o.head) accHead(el, p);   // 妖物：数字放在头顶上，不压在身上
    a = el._acc[key] = { p, v: 0, t: null, out: false };
    if (p.animate) p.animate([{ transform: 'translate(-50%,6px) scale(.7)', opacity: 0 }, { transform: 'translate(-50%,0) scale(1)', opacity: 1 }], { duration: 140 * spdF(), easing: 'ease-out' });
  }
  a.v += v; const p = a.p; p.innerHTML = popHTML(`${o.sign || ''}${fmtBig(a.v)}`);
  if (o.kill) accFree(el, a);
  const b = p.querySelector('b'), sc = o.kill ? 1.45 : o.crit ? 1.35 : 1.12;
  if (o.crit || o.kill) { p.classList.add('hot'); clearTimeout(a.hot); a.hot = setTimeout(() => p.classList.remove('hot'), 300 * spdF()); }
  const now = performance.now();   // 2026-11-25 省电：普通的一下离上次弹跳不到 0.12 秒就不再叠一个动画（僵尸集火一口气六七下）
  if (p.animate && (o.crit || o.kill || !(now - (a.pt || 0) < 120))) { a.pt = now; p.animate([{ transform: `translate(-50%,0) scale(${sc})` }, { transform: 'translate(-50%,0) scale(1)' }], { duration: (o.crit || o.kill ? 260 : 160) * spdF(), easing: 'ease-out' }); }
  clearTimeout(a.t);
  a.t = setTimeout(() => { a.out = true; if (!p.animate) return p.remove(); p.animate([{ transform: 'translate(-50%,0)', opacity: 1 }, { transform: 'translate(-50%,-44px)', opacity: 0 }], { duration: ACC_OUT * popSpd(), easing: 'ease-in', fill: 'forwards' }).onfinish = () => p.remove(); }, (o.kill ? ACC_KILL : ACC_IDLE) * popSpd());
}
// 打死：数字搬到场地上（不跟着尸体变灰变淡），换成橙色大号，过一会儿飘走
function accFree(el, a) {
  const p = a.p; if (p.classList.contains('kill')) return; p.classList.add('kill');
  const ar = document.getElementById('arena');
  if (ar && p.parentNode === el) { const r = p.getBoundingClientRect(), R = ar.getBoundingClientRect(); p.style.left = (r.left + r.width / 2 - R.left) + 'px'; p.style.top = (r.top - R.top) + 'px'; p.style.margin = '0'; ar.appendChild(p); }
}
function accDead(el) {   // 妖物倒下时头上还挂着的累计数（比如被灼烧烧死）也一起定格
  if (!el || !el._acc) return;
  for (const a of Object.values(el._acc)) { if (a.out || !a.p.isConnected || a.p.classList.contains('kill')) continue;
    accFree(el, a); const p = a.p;
    if (p.animate) p.animate([{ transform: 'translate(-50%,0) scale(1.45)' }, { transform: 'translate(-50%,0) scale(1)' }], { duration: 260 * spdF(), easing: 'ease-out' });
    clearTimeout(a.t); a.t = setTimeout(() => { a.out = true; if (!p.animate) return p.remove(); p.animate([{ transform: 'translate(-50%,0)', opacity: 1 }, { transform: 'translate(-50%,-44px)', opacity: 0 }], { duration: ACC_OUT * popSpd(), easing: 'ease-in', fill: 'forwards' }).onfinish = () => p.remove(); }, ACC_KILL * popSpd()); }
}
function accHead(el, p) {
  const ar = document.getElementById('arena'); if (!ar) return;
  if (B && B._lay && el._ahLay === B._lay && el._ahTop != null) { p.style.top = el._ahTop; return; }   // 2026-11-25 省电：同一个布局里头顶位置只量一次（原来每冒一个新数字都强制量一遍）
  const R = ar.getBoundingClientRect(), E = el.getBoundingClientRect(), sp = el.querySelector('.sp'), S = sp ? sp.getBoundingClientRect() : E;
  const h = p.offsetHeight || 20, w = Math.max(p.offsetWidth || 0, 44), cx = E.left + E.width / 2;
  let top = S.top - R.top - h;   // 场地坐标：数字底边贴着头顶
  for (const q of ar.querySelectorAll(':scope > .turnbar, :scope > .fbadge')) { const r = q.getBoundingClientRect(); if (r.height && cx + w / 2 + 4 > r.left && cx - w / 2 - 4 < r.right) top = Math.max(top, r.bottom - R.top + 2); }   // 顶上出手条挡着就往下让
  p.style.top = (Math.max(2, top) - (E.top - R.top)) + 'px';
  if (B && B._lay) { el._ahLay = B._lay; el._ahTop = p.style.top; }
}
const accLow = el => { const ar = document.getElementById('arena'); return !!ar && el.getBoundingClientRect().top - ar.getBoundingClientRect().top < 64; };
function popPut(el, cls, html, kind) {
  if (!el) return null;
  kind = kind || 'n';
  const side = / m[lr]\b/.test(cls);
  const old = [...el.querySelectorAll(':scope > .pop' + (side ? (/ ml\b/.test(cls) ? '.ml' : '.mr') : ':not(.ml):not(.mr):not(.move)'))]; for (let k = 0; k <= old.length - popMax(); k++) old[k].remove(); old.forEach(q => { if (q.isConnected) q.style.marginTop = ((parseFloat(q.style.marginTop) || 0) - 24) + 'px'; });   // 新数字一出来，还没飘走的整列往上让一行，字和字之间拉开
  const now = performance.now(); if (!el._lowT || now - el._lowT > 1500) { el._lowT = now; const ar = document.getElementById('arena'); el._low = !!ar && el.getBoundingClientRect().top - ar.getBoundingClientRect().top < 64; }
  const p = document.createElement('span'); p.className = cls + (el._low ? ' low' : ''); p.innerHTML = popHTML(html);
  el.appendChild(p);
  const kf = POP_KF[kind] || POP_KF.n, dur = (POP_MS[kind] || 700) * popSpd();
  if (p.animate) { const a = p.animate(kf.map(([o, y, sc, op, rt]) => ({ offset: o, transform: `translate(-50%,${y}px) scale(${sc})${rt ? ` rotate(${rt}deg)` : ''}`, opacity: op })), { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }); a.onfinish = () => p.remove(); }
  else setTimeout(() => p.remove(), dur);
  return p;
}
const uK = u => u && u.side === 'p' && B && B.P ? hpK(B.P.lv) : 1;                       // 战斗里某个单位的显示倍数
const chTitle = ch => CHAPTERS[ch - 1] ? `Chương ${CN[ch]} · ${CHAPTERS[ch - 1].n}` : "Ảo Cảnh Cửu U";   // 幻境用的是假章节号

// ---------- 对话 ----------
let DLG = null;
function dlgSpeaker(who) {
  if (who === 'me') return { n: "Bạn", img: heroSpr(ctxCls(), 72) };
  if (who === 'boss') { const Bo = DLG.boss; return { n: Bo ? Bo.n : "? ? ? ", img: Bo ? unitIcon(Bo.spr, 72, Bo.pal, '', 'head') : '' }; }
  const S = SPEAKERS[who] || { n: '' }, por = S.por || POR_EXTRA[who];
  if (por) return { n: S.n, img: SPR.img(por, 84, null, 'por') };
  return { n: S.n, img: S.spr ? unitIcon(S.spr, 72, S.pal, '', 'head') : '' };
}
// 没写立绘的主要角色，补一张
const POR_EXTRA = { ngoc: 'p_ngoc', lei: 'p_lei', tiedan: 'p_tiedan', smith: 'p_smith', qingxu: 'p_qingxu' };
// 从台词里猜表情：标点 + 关键词（中越两种）
const MOOD_RX = {
  angry: /滚|混账|该死|找死|拿下|砍了|你敢|畜生|住口|闭嘴|放肆|大胆|Cút|khốn|Chết tiệt|Bắt lấy|Câm miệng|Láo|to gan/i,
  happy: /哈哈|嘿嘿|嘻嘻|呵呵|太好了|谢谢|多谢|好吃|恭喜|喜酒|好兄弟！|痛快|Ha ha|Hê hê|Hi hi|cảm ơn|Đa tạ|Tốt quá|ngon|Chúc mừng|sảng khoái/i,
  sad: /对不起|没回来|再也|哭|难过|不在了|舍不得|想他|想她|xin lỗi|không về|không bao giờ|khóc|nhớ (anh|em|cha|mẹ|ông|bà)/i,
  surprise: /[？?][！!]|[！!][？?]|什么？|怎么会|真的？|啊？|Gì cơ|Hả\?|Thật sao|Sao lại/i,
};
function moodOf(who, text) {
  if (!text || who === 'narr') return '';
  if (/^(……|…|\.\.\.)$/.test(text.trim())) return 'dots';
  if (MOOD_RX.surprise.test(text)) return 'surprise';
  if (MOOD_RX.angry.test(text) || /[！!]{2}/.test(text)) return 'angry';
  if (MOOD_RX.happy.test(text)) return 'happy';
  if (MOOD_RX.sad.test(text) || /^(……|…)[^！!？?]*(……|…)$/.test(text)) return 'sad';

  return '';
}
const MOOD_EMO = { angry: 'emo_angry', happy: 'emo_note', sad: 'emo_sweat', surprise: 'emo_ex', dots: 'emo_dots' };
function playDialog(lines, boss, done) {
  if (typeof lines === 'function') lines = lines(SAVE.run && SAVE.run.world ? wstate(SAVE.run.chapter) : null);
  if (!lines || !lines.length) { if (done) done(); return; }
  DLG = { lines, i: 0, boss, done, typing: null };
  $('#dlg').hidden = false; showLine();
}
function showLine() {
  if (!DLG || !DLG.lines[DLG.i]) return;
  const [who, text] = DLG.lines[DLG.i], sp = dlgSpeaker(who), box = $('#dlg');
  box.classList.toggle('narr', who === 'narr');
  box.classList.toggle('right', who === 'me');
  const mood = moodOf(who, text), por = box.querySelector('.dlg-por');
  por.innerHTML = sp.img + (mood && MOOD_EMO[mood] ? `<i class="emo">${SPR.img(MOOD_EMO[mood], 28)}</i>` : '');
  por.className = 'dlg-por' + (mood ? ' mood-' + mood : '');
  box.querySelector('.dlg-name').textContent = sp.n;
  const el = box.querySelector('.dlg-text'); el.textContent = '';
  clearInterval(DLG.typing);
  let i = 0; const chars = [...text];
  DLG.full = text;
  const D = DLG; D.typing = setInterval(() => { i += 2; el.textContent = chars.slice(0, i).join(''); if (i >= chars.length || DLG !== D) { clearInterval(D.typing); D.typing = null; } }, 22);
  box.querySelector('.dlg-prog').textContent = `${DLG.i + 1}/${DLG.lines.length}`;
}
function nextLine() {
  if (!DLG) return;
  if (DLG.typing) { clearInterval(DLG.typing); DLG.typing = null; $('#dlg .dlg-text').textContent = DLG.full; return; }
  DLG.i++; SFX.play('page');
  if (DLG.i >= DLG.lines.length) endDlg(); else showLine();
}
function endDlg() { if (!DLG) return; clearInterval(DLG.typing); const d = DLG.done; DLG = null; $('#dlg').hidden = true; if (d) d(); }
function banner(title, sub, ms = 2000) {
  const b = $('#banner'); b.innerHTML = `<h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}`;
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); SFX.play('gong');
  setTimeout(() => b.classList.remove('on'), ms);
}
const seen = k => !!SAVE.story.seen[k];
const markSeen = k => { SAVE.story.seen[k] = 1; };

// ---------- 小部件 ----------
function fmtStat(k, v) {
  v = num(v);
  if (k === 'poison') return `Đòn đánh gây trúng độc: mỗi lượt ${v}% công`;
  if (k.startsWith('sk_')) { const id = k.slice(3); for (const c of CLASS_IDS) { const s = CLASSES[c].skills.find(x => x.id === id); if (s) return `+${v}% sát thương ${s.n}`; } }
  const sign = v >= 0 ? '+' : '';
  if (k === 'hp' || k === 'regen') return `${sign}${fmtBig(hpShow(v, heroLv()))} ${STAT_NAMES[k] || k}`;   // 气血类的固定数值：和最大气血同一个倍数
  return `${sign}${v}${PCT_STATS.has(k) ? '%' : ''} ${STAT_NAMES[k] || k}`;
}
const itemTitle = it => `${ancName(it)}${esc(it.name)}${it.plus ? ` +${it.plus}` : ''}`;
function jyBanner(it) { SFX.play('legend'); qtoast(`<span class="jyt">CỬU U XUẤT THẾ</span><b class="r-${it.rarity}">${esc(itemTitle(it))}</b>${it.jy ? `<small>${esc(jyText(it.jy))}</small>` : ''}`, 4200); }
const ancCls = it => it.anc === 3 ? 'jiuyou' : it.anc === 2 ? 'primal' : it.anc === 1 ? 'ancient' : '';
function socketDots(it) { if (!it.sockets) return ''; return `<span class="dots">${Array.from({ length: it.sockets }, (_, i) => { const g = it.gems[i]; return `<i style="${g ? 'background:' + gemColor(g) : ''}"></i>`; }).join('')}</span>`; }
function setCountFor(cls, setId) { let n = 0; const eq = SAVE.chars[cls].eq; for (const sl in eq) if (eq[sl] && eq[sl].set === setId) n++; return n; }
const gemImg = (key, size) => SPR.img('gem', size, { G: gemColor(key) });
function itemCard(it, cls, label) {
  const L = legendOf(it), S = setOf(it), m = itemMult(it);
  let h = `<div class="icard ${ancCls(it)}">${label ? `<div class="lab">${label}</div>` : ''}<div class="ihead">${SPR.item(it, 48)}<div>
    <div class="iname r-${it.rarity}">${itemTitle(it)}</div>
    <div class="isub"><b class="tierb">${TIER_N[it.tier || tierOf(it.ilvl)]}</b> ${RARITY[it.rarity].n} · ${SLOT_NAME[it.slot]} · ${esc(it.base)} · Cấp trang bị ${it.ilvl}</div></div></div>`;
  if (it.anc) h += `<div class="ianc">${it.anc === 3 ? "Cửu U: mọi thuộc tính +69% (trên Thái Cổ thêm +30%), từ tố ngẫu nhiên đều đạt tối đa" : it.anc === 2 ? "Thái Cổ: mọi chỉ số +30%, thuộc tính ngẫu nhiên đều tối đa" : "Thượng Cổ: mọi chỉ số +30%"}</div>`;
  if (it.jy && JY_AFF[it.jy[0]]) h += `<div class="ijy"><b>Cửu U</b> ${esc(jyText(it.jy))}<small>(vị trí này còn tẩy ra được: ${Object.keys(JY_AFF).filter(k => JY_AFF[k].slot === JY_AFF[it.jy[0]].slot && k !== it.jy[0]).map(k => JY_AFF[k].n).join(", ")})</small></div>`;
  if (it.cls) h += `<div class="ireq ${canEquip(it, cls) ? '' : 'bad'}">Chỉ ${CLASSES[it.cls].n}</div>`;
  h += '<ul>' + Object.keys(it.imp).map(k => `<li class="imp">${fmtStat(k, Math.round(it.imp[k] * statMult(it, k)))}</li>`).join('')
       + it.aff.map(([k, v]) => `<li class="aff ${SP_AFFIXES.includes(k) ? 'spx' : ''}">${fmtStat(k, Math.round(v * statMult(it, k)))}${affTag(it, k, v)}</li>`).join('') + '</ul>'
       + (it.aff.length ? `<div class="iq">Chất lượng thuộc tính <b>${Math.round(itemQ(it) * 100)}%</b>${it.sp ? " <span class=\"spx\">có thuộc tính đặc biệt</span>" : ''}</div>` : '');
  if (it.plus) h += `<div class="iplus">Cường hóa +${it.plus}: các chỉ số thực như công, khí huyết, hộ giáp +${it.plus * 8}%</div>`;
  if (it.lk) h += "<div class=\"ilock\">Đã khóa: khi phân giải, bán hàng loạt sẽ bỏ qua món này</div>";
  { const kn = kitNamesOf(it); if (kn.length) h += `<div class="ilock">Nằm trong bộ phối đồ “${kn.map(esc).join("”“")}”: khi bán, phân giải hàng loạt sẽ bỏ qua nó</div>`; }
  if (it.sockets) h += `<div class="isock">${Array.from({ length: it.sockets }, (_, i) => { const g = it.gems[i];
    return g ? `<span class="gs">${gemImg(g, 18)}${gemName(g)}: ${gemDesc(g)}</span>` : "<span class=\"gs empty\">Lỗ trống</span>"; }).join('')}</div>`;
  if (L) h += `<p class="ifx">Hồn thần binh: ${L.d}${SAVE.cube[L.id] ? "<small> (đã cất vào Túi Càn Khôn)</small>" : ''}</p>`;
  if (L && (L.fx === 'sanA' || L.fx === 'sanB')) h += `<p class="san-st">${sanState(ctxCls())}</p>`;
  if (S) {
    const n = setCountFor(S.cls, S.id), eq = SAVE.chars[S.cls].eq;
    h += `<div class="iset ${S.rift ? 'rset' : ''}"><b>${S.n}</b>${S.rift ? "<em>Bộ Ảo Cảnh</em> ·" : ''} (${CLASSES[S.cls].n} đã mặc ${n}/${S.pieces.length})
      <div class="${n >= 2 ? 'on' : ''}">2 món: ${S.b2d}</div><div class="${n >= 4 ? 'on' : ''}">4 món: ${S.b4d}</div>${S.b6 ? `<div class="${n >= 6 ? 'on' : ''}">6 món: ${S.b6d}</div>` : ''}
      ${setTip(S, n)}<div>${S.pieces.map(p => `<span class="${eq[p[0]] && eq[p[0]].set === S.id ? 'on' : ''}">${p[1]}</span>`).join(" ")}</div></div>`;
  }
  return h + `<div class="ipr">Bán ${sellPrice(it)} lượng · Phân giải được ${salvageValue(it)} hồn tinh</div></div>`;
}
// 词条后面的星级和范围：★★★☆☆ 7–18
function affTag(it, k, v) { const r = affRange(k, it.ilvl, genMult(it)); if (!r) return ''; const q = affQ(it, k, v), st = affStars(q);
  const sh = x => k === 'hp' || k === 'regen' ? fmtBig(hpShow(x, heroLv())) : x;   // 气血类的范围和数值用同一个倍数显示
  return ` <small class="qs q${st}">${'★'.repeat(st)}${'☆'.repeat(5 - st)}</small><small class="qr">${sh(r[0])}–${sh(r[1])}</small>`; }
let WLOCK = { id: null, s: new Set() };
// 第二套幻境套装要配招式才打得出来：写明搭配，穿到 4 件还没带上的招式点出来
function setTip(S, n) {
  if (!S.tip) return '';
  const L = syncLoadout(S.cls), miss = n >= 4 ? (S.need || []).filter(id => !L.includes(id)).map(id => (CLASSES[S.cls].skills.find(k => k.id === id) || {}).n).filter(Boolean) : [];
  return `<div class="settip">Phối hợp: ${S.tip}${miss.length ? `<b class="warn"> Chưa mang: ${miss.join(", ")} (vào trang “Võ học” để đổi)</b>` : ''}</div>`;
}
// 洗炼之前先看清楚：没锁的每一条会变成什么、各有多大几率、数值在什么范围；金色的是这个部位专属的稀有词条
function washOddsHTML(it, locks) {
  const O = washOdds(it, locks), n = it.aff.length - locks.length; if (!O.length || n <= 0) return '';
  const sh = (k, x) => k === 'hp' || k === 'regen' ? fmtBig(hpShow(Math.round(x * statMult(it, k)), heroLv())) : Math.round(x * statMult(it, k));
  const pc = p => p >= 0.1 ? Math.round(p * 100) + '%' : (p * 100).toFixed(1) + '%';
  return `<details class="odds" open><summary>Lần này tẩy ${n} dòng · mỗi dòng có thể thành</summary>
    <div class="odds-l">${O.map(o => `<div class="${o.rare ? 'rare' : ''}"><span>${STAT_NAMES[o.k] || o.k}${o.rare ? "<i>hiếm</i>" : ''}</span><small>${sh(o.k, o.lo)}–${sh(o.k, o.hi)}${PCT_STATS.has(o.k) ? '%' : ''}</small><b>${pc(o.p)}</b></div>`).join('')}</div>
    <p class="sub">Tẩy luyện không giới hạn số dòng công kích (đồ rơi tối đa hai dòng). “Sát thương một chiêu” sẽ chọn ngẫu nhiên một chiêu của môn phái. Màu vàng là dòng hiếm riêng của ${SLOT_NAME[it.slot]}, chỉ tẩy luyện mới ra. ${n > 1 ? `Lần này tẩy ${n} dòng, tỉ lệ ra ít nhất một dòng hiếm khoảng ${(100 * (1 - Math.pow(1 - WASH_RARE, n))).toFixed(1)}%. ` : ''}Ra rồi nhớ khóa lại trước, rồi hãy tẩy dòng khác.</p></details>`;
}
const wlockOf = it => (WLOCK.id === it.id ? WLOCK.s : new Set());
function deltaOf(it, cls) {
  if (!canEquip(it, cls)) return "<span class=\"delta no\">Không dùng được</span>";
  const d = powerWith(cls, it) - power(charStats(cls));
  return d > 0 ? `<span class="delta up">+${d}</span>` : d < 0 ? `<span class="delta dn">${d}</span>` : '<span class="delta no">±0</span>';
}
function lootChips(items) {
  if (!items || !items.length) return '';
  const cls = ctxCls(), cur = power(charStats(cls));
  const up = it => SAVE.stash.includes(it) && canEquip(it, cls) && powerBest(cls, it).p > cur;   // 传承后更强的也标出来
  return `<div class="loot">${items.map(it => { const u = up(it); return `<button class="lchip ${ancCls(it)} ${u ? 'isup' : ''}" data-act="item" data-arg="${it.id}">${SPR.item(it, 24)}<span class="r-${it.rarity}">${itemTitle(it)}</span>${u ? '<em class="upm">↑</em>' : ''}</button>`; }).join('')}</div>`;
}
const zyChips = zy => zy && zy.length ? `<div class="loot">${zy.map(([n, g, old]) => { const d = allMonsterDefs().find(x => x.n === n);
  return `<span class="lchip zy">${d ? SPR.img(d.spr, 24, d.pal) : ''}<span>Tinh phách · ${n}<b>${ZY_CN[g]}</b>${old ? "<small>Lên phẩm</small>" : "<small>Mới thu phục</small>"}</span></span>`; }).join('')}</div>` : '';
const gemChips = keys => keys && keys.length ? `<div class="loot">${keys.map(k => `<span class="lchip">${gemImg(k, 22)}${gemName(k)}</span>`).join('')}</div>` : '';
// 现在点开的是哪个位置：点了「扳指·二」，扳指就往第二个位置比、往第二个位置穿
const gpos = it => GSLOT && GSLOT !== 'box' && slotType(GSLOT) === it.slot ? GSLOT : undefined;
// 每件储物箱装备换上后的战力变化（一次算好，渲染时复用）
function deltaMap(cls) {
  const cur = power(charStats(cls)), m = new Map();
  m.inh = new Set();   // 要传承才到得了这个数的（身上那件强化过、镶了玉）
  for (const it of SAVE.stash) { if (!canEquip(it, cls)) { m.set(it.id, null); continue; } const b = powerBest(cls, it, gpos(it)); m.set(it.id, b.p - cur); if (b.inh) m.inh.add(it.id); }
  return m;
}
const deltaTag = (d, inh) => { const m = inh ? "<i class=\"inhm\">TT</i>" : ''; return d == null ? "<span class=\"delta no\">Không dùng được</span>" : d > 0 ? `<span class="delta up">${m}+${d}</span>` : d < 0 ? `<span class="delta dn">${m}${d}</span>` : `<span class="delta no">${m}±0</span>`; };
const cuTxt = m => String(Math.round(m * 10) / 10);
const inFightNow = () => VIEW === 'battle' && !!B && !B.over;
function itemRow(it, D) {
  const d = D.get(it.id);
  return `<div class="irow2 ${ancCls(it)} ${d > 0 ? 'isup' : ''}"><button class="ir-main" data-act="item" data-arg="${it.id}">${SPR.item(it, 30)}<span class="nm r-${it.rarity}">${itemTitle(it)}<small>${SLOT_NAME[it.slot]} · giai ${it.ilvl} ${socketDots(it)}</small></span></button>
    ${deltaTag(d)}${d != null ? `<button class="btn sm qeq ${d > 0 ? '' : 'ghost'}" data-act="qeq" data-arg="${it.id}">Mặc</button>` : '<span class="qeq-ph"></span>'}</div>`;
}
// 装备面板：上面是身上 7 个位置，点一个位置，下面只列这个位置能换的装备
function gearPanel(cls, inRun) {
  const eq = SAVE.chars[cls].eq, D = deltaMap(cls);
  const up = {};
  for (const it of SAVE.stash) { const d = D.get(it.id); if (!(d > 0)) continue; const ps = posFor(cls, it, gpos(it)); if (d > (up[ps] || 0)) up[ps] = d; }
  let doll = SLOTS.filter(sl => slotOpen(sl.id)).map(sl => { const it = eq[sl.id];
    return `<button class="gsb ${GSLOT === sl.id ? 'on' : ''} ${it ? 'b-' + it.rarity + ' ' + ancCls(it) : 'empty'}" data-act="gsl" data-arg="${sl.id}" aria-pressed="${GSLOT === sl.id}">
      <span class="gi">${it ? SPR.item(it, 34) : `<i>${sl.s}</i>`}</span><span class="gn">${sl.n}${it && it.plus ? ` +${it.plus}` : ''}</span>${up[sl.id] ? `<em>+${up[sl.id]}</em>` : ''}</button>`; }).join('');
  if (boxOpen() && !inRun) {   // 通关后：灵玉匣，和还没开的新位置（写明幻境打到几层开）
    const nb = boxOf(cls).filter(Boolean).length;
    doll += `<button class="gsb box ${GSLOT === 'box' ? 'on' : ''} ${nb ? 'b-legend' : 'empty'}" data-act="gsl" data-arg="box" aria-pressed="${GSLOT === 'box'}"><span class="gi">${SPR.img('gem', 30, { G: '#ffb02a' }, nb ? 'glow' : '')}</span><span class="gn">Hộp ngọc ${nb}/${BOX_SLOTS}</span></button>`
      + SLOTS.filter(sl => sl.rift && !slotOpen(sl.id)).map(sl => `<div class="gsb locked"><span class="gi"><i>Khóa</i></span><span class="gn">${sl.n}</span><small>Ảo Cảnh tầng ${sl.rift}</small></div>`).join('');
  }
  if (GSLOT === 'box' && (!boxOpen() || inRun)) GSLOT = null;
  const nUp = Object.keys(up).length;
  const subs = inRun ? [] : [['stash', `Túi đồ ${SAVE.stash.length}`], ...(featureOn('gems') ? [['gems', "Ngọc"]] : []), ...(featureOn('cube') ? [['cube', "Túi Càn Khôn"]] : [])];
  const sub = inRun || !subs.some(x => x[0] === GSUB) ? 'stash' : GSUB;
  let body;
  if (GSLOT === 'box') body = boxBody(cls);
  else if (sub === 'stash') body = stashBody(cls, D);
  else if (sub === 'gems') body = gemsBody();
  else if (sub === 'cube') body = cubeBody(cls);
  return `<div class="ghead"><div class="gdoll">${doll}</div>
      <div class="gbar"><span class="sub">${nUp ? `<b class="upn">${nUp}</b> ô có trang bị tốt hơn` : "Đang mặc bộ tốt nhất hiện có"}</span><button class="btn sm ${nUp ? '' : 'ghost'}" ${nUp ? '' : 'disabled'} data-act="best">Mặc đồ mạnh nhất</button></div>
      ${subs.length > 1 ? `<div class="gsubs" style="--n:${subs.length}">${subs.map(([k, n]) => `<button class="${sub === k ? 'on' : ''}" data-act="gsub" data-arg="${k}">${n}</button>`).join('')}</div>` : ''}</div>
    <div class="gbody">${body}</div>`;
}
function stashBody(cls, D) {
  const order = { legend: 0, set: 1, rare: 2, magic: 3, normal: 4 };
  let list = SAVE.stash.filter(it => (!GSLOT || it.slot === slotType(GSLOT)) && (FILTER === 'all' || (FILTER === 'up' && D.get(it.id) > 0) || (FILTER === 'leg' && it.legend && !SAVE.cube[it.legend]) || (FILTER === 'jy' && it.anc === 3)));
  list.sort((a, b) => GSLOT || FILTER === 'up' ? ((D.get(b.id) ?? -1e9) - (D.get(a.id) ?? -1e9)) : (order[a.rarity] - order[b.rarity] || (b.anc || 0) - (a.anc || 0) || b.ilvl - a.ilvl));
  const cur = GSLOT && SAVE.chars[cls].eq[GSLOT];
  // 点了部位：身上那件的完整属性直接摊开（以前只有一行名字，还得再点一下才看得到）
  const compact = VIEW === 'town' && TT === 'bag';   // 一屏的背包页：身上那件只占一行，点名字看完整属性
  const curRow = GSLOT && compact ? `<div class="gcur3"><span class="sub">${SLOT_NAME[GSLOT]} đang mặc</span>${cur ? `<button class="gc3n r-${cur.rarity}" data-act="item" data-arg="${cur.id}">${SPR.item(cur, 22)}<span>${itemTitle(cur)}</span></button>${wsTabs().length > 1 ? `<button class="btn sm ghost" data-act="wsopen" data-arg="enh|${cur.id}">Bồi dưỡng</button>` : ''}<button class="btn sm ghost" data-act="unequip" data-arg="${GSLOT}">Tháo</button>` : "<span class=\"sub\">Trống</span>"}</div>
      <h4 class="sub-h gcur-t">${SLOT_NAME[slotType(GSLOT)]} có thể thay trong túi đồ</h4>`
    : GSLOT ? `<div class="gcur2"><div class="gcur-h"><span class="sub">${SLOT_NAME[GSLOT]} đang mặc</span>${cur ? `${VIEW === 'town' && wsTabs().length > 1 ? `<button class="btn sm ghost" data-act="wsopen" data-arg="enh|${cur.id}">Nuôi đồ</button>` : ''}<button class="btn sm ghost" data-act="item" data-arg="${cur.id}">Thêm</button><button class="btn sm ghost" data-act="unequip" data-arg="${GSLOT}">Tháo</button>` : ''}<button class="btn sm ghost" data-act="gsl" data-arg="${GSLOT}">Thu gọn</button></div>
      ${cur ? itemCard(cur, cls, '') : "<p class=\"sub\" style=\"margin:6px 0 0\">Đang trống</p>"}</div>
      <h4 class="sub-h gcur-t">${SLOT_NAME[slotType(GSLOT)]} đổi được trong túi đồ</h4>` : '';
  const chips = [['all', "Tất cả"], ['up', "Chỉ đồ tốt hơn"], ...(featureOn('cube') ? [['leg', "Chưa cất vào Túi"]] : []), ...(SAVE.stash.some(it => it.anc === 3) ? [['jy', "Cửu U"]] : [])];
  return `${curRow}<div class="chips">${chips.map(([k, n]) => `<button class="chip ${FILTER === k ? 'on' : ''}" data-act="filter" data-arg="${k}">${n}</button>`).join('')}
      ${VIEW === 'town' ? `<button class="chip bulkc" data-act="bulkopen">Lọc phân giải / bán</button>${svcFns('kang').some(f => f[0] === 'gamble') ? "<button class=\"chip bulkc\" data-act=\"npcgo\" data-arg=\"kang|gamble\">Cược đá</button>" : ''}` : ''}</div>
    <div class="ilist2">${list.length ? list.map(it => itemRow(it, D)).join('') : `<div class="empty-note">${GSLOT ? `Trong túi đồ không có ${SLOT_NAME[slotType(GSLOT)]} nào để thay.` : "Không có trang bị nào phù hợp."}</div>`}</div>
    <p class="sub" style="margin:8px 0 0">Số bên phải là lực chiến thay đổi sau khi mặc (cường hóa và ngọc đi theo vị trí, đã tính sẵn). Túi đồ ${SAVE.stash.length}/${stashMax()}, năm môn phái dùng chung.</p>`;
}
// 灵玉一行：名字、等级、说明；本命玉标上是哪个门派的
function lgemRow(g, btn) { const G = LGEMS[g.t] || LGEMS.reforge;
  return `<div class="gemrow lg">${SPR.img('gem', 26, { G: G.c }, 'glow')}<span class="nm"><b style="color:${G.c}">${g.t === 'reforge' && LGEM_OLD[g.old] ? LGEM_OLD[g.old] : G.n}</b> cấp ${g.lv}${g.lv >= LGEM_CAP ? " (tối đa)" : ''}${G.cls ? ` <em class="lgcls">bản mệnh ${CLASSES[G.cls].n}</em>` : ''} <small>${G.d(g.lv)}</small></span>${btn || ''}</div>`; }
// 灵玉重铸：老存档里被删的五颗（战神、长生、疾风、破军、回春）挑一颗新的换，等级原样保留
let LGRE = null;
const lgReModal = () => {
  const todo = SAVE.lgems.filter(g => g.t === 'reforge'); if (!todo.length) return `<h2 class="mh">Tái luyện linh ngọc</h2><p class="help-p">Đã đổi xong hết.</p><div class="row"><button class="btn" data-act="close">Được</button></div>`;
  const g = todo.find(x => x.id === LGRE) || todo[0], owned = new Set(SAVE.lgems.map(x => x.t)), opts = Object.keys(LGEMS).filter(t => !LGEMS[t].hide && !owned.has(t));
  const sorted = [...opts.filter(t => LGEMS[t].cls === SAVE.cls), ...opts.filter(t => LGEMS[t].cls && LGEMS[t].cls !== SAVE.cls), ...opts.filter(t => !LGEMS[t].cls)];
  return `<button class="btn sm ghost x" data-act="close">Để sau</button><h2 class="mh">Tái luyện linh ngọc <small>còn ${todo.length} viên</small></h2>
    <p class="help-p">Linh ngọc đổi phiên bản: <b>${LGEM_OLD[g.old] || "Viên linh ngọc này"}</b> (cấp ${g.lv}) chỉ là chỉ số thường, hiệu quả đã bị xóa. Chọn cho nó một viên mới, <b>cấp giữ nguyên</b>. Mỗi môn phái có một viên “linh ngọc bản mệnh” chỉ phái đó dùng được, các linh ngọc khác ai cũng dùng được.</p>
    <div class="lgre" data-scroll="lgre">${sorted.map(t => { const G = LGEMS[t]; return `<button class="lgre-o" data-act="lgreforge" data-arg="${g.id}|${t}"><b style="color:${G.c}">${G.n}${G.cls ? ` <em class="lgcls">bản mệnh ${CLASSES[G.cls].n}</em>` : ''}</b><small>${G.d(g.lv)}</small></button>`; }).join('')}</div>`;
};
// 灵玉匣：三个孔，灵玉全账号共用，每个角色各挑三颗
function boxBody(cls) {
  const L = boxOf(cls), bs = boxStat(SAVE.riftMax), inBox = new Set(L.filter(Boolean)), rest = SAVE.lgems.filter(g => !inBox.has(g.id));
  const gemRow = (g, btn) => lgemRow(g, btn);
  return `<div class="gcur2"><div class="gcur-h"><span class="sub">Hộp Linh Ngọc</span><button class="btn sm ghost" data-act="gsl" data-arg="box">Thu gọn</button></div>
      <p class="help-p">Hộp có sẵn: khí huyết tối đa +${bs}%, sát thương +${bs}% (kỷ lục Ảo Cảnh cứ qua 10 tầng, mỗi thứ thêm +1%). Ba lỗ chỉ khảm linh ngọc. Linh ngọc dùng chung cả tài khoản: mỗi nhân vật tự chọn ba viên, đổi nhân vật không cần tháo. Linh ngọc tối đa cấp ${LGEM_CAP}, được nâng khi quyết toán Ảo Cảnh.</p>
      <div class="gems">${L.map((gid, i) => { const g = gid && SAVE.lgems.find(x => x.id === gid);
        return g ? gemRow(g, `<button class="btn sm ghost" data-act="boxoff" data-arg="${i}">Tháo</button>`) : `<div class="gemrow lg empty"><span class="nm"><i>Lỗ ${i + 1} · đang trống</i></span></div>`; }).join('')}</div></div>
    <h4 class="sub-h gcur-t">Linh ngọc còn đặt vào được</h4>
    ${SAVE.lgems.some(g => g.t === 'reforge') ? `<button class="btn sm lgref" data-act="lgreopen">Có ${SAVE.lgems.filter(g => g.t === 'reforge').length} viên linh ngọc chờ tái luyện: chọn viên mới (giữ cấp) ›</button>` : ''}
    <div class="gems">${rest.length ? rest.map(g => { const G = LGEMS[g.t]; return gemRow(g, G.cls && G.cls !== cls ? `<button class="btn sm ghost" disabled>Riêng ${CLASSES[G.cls].n}</button>` : g.t === 'reforge' ? "<button class=\"btn sm\" data-act=\"lgreopen\">Tái luyện</button>" : `<button class="btn sm" data-act="boxput" data-arg="${g.id}">Đặt vào hộp</button>`); }).join('') : `<div class="empty-note">${SAVE.lgems.length ? "Linh ngọc đang có đều ở trong hộp rồi." : "Chưa có linh ngọc. Hãy vào Ảo Cảnh Cửu U đánh bại yêu vương giữ ải."}</div>`}</div>`;
}
function gemsBody() {
  const gemKeys = Object.keys(SAVE.gems).sort((a, b) => a.localeCompare(b));
  return `<p class="help-p">Ba viên ngọc giống nhau ghép được một viên cao hơn một bậc, giờ tối đa ghép tới “${GEM_TIERS[gemCap()]}”. Xưởng Ngọc quản tới “cực phẩm”; bốn bậc sau “vô hà, thông linh, thiên thành, Cửu U” cần Ảo Cảnh cao nhất đánh tới tầng ${GEM_RIFT.join(", ")}. Ngọc đã khảm trên trang bị cũng nâng cấp thẳng được (chạm vào nó ở chỗ Chưởng quầy Ngọc).</p>
    ${(() => { const P = combineAllPlan(false); return P.n ? `<button class="btn gemall" data-act="combineall">Ghép tất cả: ghép ${P.n} lần (${fmtBig(P.cost)} lượng${P.mcost ? ` + ${P.mcost} hồn tinh` : ''})</button>` : ''; })()}
    <div class="gems">${gemKeys.length ? gemKeys.map(k => `<div class="gemrow">${gemImg(k, 26)}<span class="nm">${gemName(k)} <small>${gemDesc(k)}</small></span><b>×${SAVE.gems[k]}</b>
      <button class="btn sm ghost" ${SAVE.gems[k] >= 3 && +k.split('_')[1] < gemCap() ? '' : 'disabled'} data-act="combine" data-arg="${k}">Ghép (${combineCost(k)} lượng${combineMats(k) ? ` + ${combineMats(k)} hồn tinh` : ''})</button></div>`).join('')
      : "<div class=\"empty-note\">Chưa có ngọc. Tinh anh, thủ lĩnh và rương báu sẽ rơi ngọc.</div>"}</div>
    ${SAVE.lgems.length || featureOn('rift') ? `<h4 class="sub-h">Linh ngọc <small>yêu vương giữ ải trong Ảo Cảnh rơi ra, khảm trong Hộp Linh Ngọc (chạm “Hộp ngọc” ở ô trang bị)</small></h4>
    <div class="gems">${SAVE.lgems.length ? SAVE.lgems.map(g => { const users = CLASS_IDS.filter(c => (SAVE.chars[c].lgs || []).includes(g.id)).map(c => CLASSES[c].n), G = LGEMS[g.t];
      return `<div class="gemrow lg">${SPR.img('gem', 26, { G: G.c }, 'glow')}<span class="nm"><b style="color:${G.c}">${G.n}</b> cấp ${g.lv} <small>${G.d(g.lv)}</small><small>${users.length ? "Đang dùng: " + users.join(", ") : "Chưa ai dùng"}</small></span></div>`; }).join('')
      : "<div class=\"empty-note\">Chưa có linh ngọc. Hãy vào Ảo Cảnh Cửu U đánh bại yêu vương giữ ải.</div>"}</div>` : ''}`;
}
function cubeBody(cls) {
  if (!featureOn('cube')) return lockNote("Nhận trong cốt truyện chương 6");
  const ch = SAVE.chars[cls], learned = LEGENDS.filter(L => SAVE.cube[L.id]);
  return `<p class="help-p">Đã cất ${learned.length}/${LEGENDS.length} loại hồn thần binh. Chạm mở một món thần binh, cất nó vào Túi Càn Khôn là học vĩnh viễn hiệu ứng. Mỗi nhân vật có 3 ô, đặt vào là có hiệu lực ngay.</p>
    <div class="cube">${[0, 1, 2].map(i => { const lid = ch.cube[i], L = lid && LEGENDS.find(l => l.id === lid);
      return `<div class="cslot"><small>Ô ${i + 1}</small>${L ? `<b class="r-legend">${L.n}</b><span>${L.d}</span>` : "<span class=\"sub\">Trống</span>"}
        <button class="btn sm ghost" ${learned.length ? '' : 'disabled'} data-act="cubepick" data-arg="${i}">${L ? "Đổi" : "Đặt vào"}</button></div>`; }).join('')}</div>`;
}
// 幻境的香：还剩多少（0–1）
const xiangLeft = run => run && run.mode === 'rift' ? Math.max(0, 1 - (run.clock || 0) / riftLimit(run.riftLv)) : 1;
const fmtClock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const xiangTxt = run => run.world ? fmtClock(xiangLeft(run) * riftLimit(run.riftLv)) : Math.round(xiangLeft(run) * 100) + '%';   // 新幻境按时间：还剩几分几秒
const riftRecTxt = R => R ? (R.s != null ? `Tầng ${R.lv} · mất ${fmtClock(R.s * 1000)}` : `Tầng ${R.lv} · ${R.t} lượt (kỷ lục cũ)`) : '';
function xiangBarTxt(run) { const L = xiangLeft(run), G = run.riftDone ? null : RIFT_GRADES.find(g => g.min >= 0 && L >= g.min);
  return `${L > 0 ? `Một nén hương · còn ${xiangTxt(run)}${G ? ` · xong lúc này được “${G.n}”` : ''}` : "Hương đã tàn · vẫn đánh xong lấy đồ được, nhưng không tính kỷ lục"}${run.deaths ? ` · ngã ${run.deaths} lần` : ''}`; }
// 幻境的香：在地图上按真实时间烧（开着窗口、对话、切到后台时不烧）；战斗里的时间由引擎按回合折算
let RTICK = 0, RSAVE = 0, RDOM = 0;
setInterval(() => {
  const run = typeof SAVE !== 'undefined' && SAVE && SAVE.run, now = performance.now();
  if (!run || !isRift(run) || run.riftDone || VIEW !== 'world' || DLG || MODALFN || document.hidden) { RTICK = 0; return; }
  if (RTICK) run.clock = (run.clock || 0) + Math.min(1000, now - RTICK);
  RTICK = now;
  if (now - RDOM < 950) return; RDOM = now;   // 2026-11-24 省电：香条一秒更新一次（原来四分之一秒一次，还带 0.4 秒过渡动画，地图上一直在重排重画）
  const xb = document.querySelector('#xiangbar'), L = xiangLeft(run);
  if (xb) { xb.querySelector('i').style.width = L * 100 + '%'; xb.classList.toggle('low', L > 0 && L < 0.25); xb.classList.toggle('out', L <= 0); xb.querySelector('span').textContent = xiangBarTxt(run); }
  const xg = document.querySelector('#rbxiang'); if (xg) { xg.textContent = `Hương ${xiangTxt(run)}`; xg.classList.toggle('low', L > 0 && L < 0.25); xg.classList.toggle('out', L <= 0); }
  if (now - RSAVE > 8000) { RSAVE = now; persist(true); }
}, 250);
const riftHelpModal = () => `<h2 class="mh">Ảo Cảnh đổi cách đánh</h2>
  <p class="help-p">Không còn là bấm ô nữa. Giờ là bốn tầng bản đồ lớn, yêu vật đi thành từng bầy, nhìn thấy được, vòng qua được.</p>
  <p class="help-p"><b>Kéo quái hợp chiến</b>: đụng một bầy yêu vật, các bầy trong vòng ba ô sẽ bị cuốn vào cùng, một trận tối đa bốn bầy. Chiêu đánh lan ở đây đáng giá nhất.</p>
  <p class="help-p"><b>Tiến độ</b>: diệt yêu tích tiến độ, tinh anh cho nhiều hơn, ngã xuống còn rơi một viên tinh phách, phải đi tới nhặt. Tiến độ đầy thì yêu vương giữ ải hiện thân ngay cạnh bạn.</p>
  <p class="help-p"><b>Đổi tầng</b>: tiến độ mỗi tầng không giới hạn; muốn đánh tới cùng ở tầng này hay tới trận truyền tống ở xa để sang tầng kế là tùy bạn. Càng xuống sâu càng béo: yêu vật cao hơn một cấp, mỗi con cho nhiều tiến độ hơn (tầng hai +15%, tầng ba +30%, tầng bốn +50%), tinh anh cũng thêm một con. Mỗi tầng còn có một ngọn tháp, giẫm lên được cộng sức trong ba trận.</p>
  <p class="help-p"><b>Một nén hương</b>: mười ba phút. Trên bản đồ cháy theo thời gian thật; trong trận tính theo lượt, một vòng tính ba giây, mở tốc độ mấy hay bỏ qua trận đều như nhau.</p>
  <p class="help-p"><b>Đánh lâu lộ sơ hở</b>: một trận đánh tới vòng 10 (trận yêu vương là vòng 20) thì yêu vật không hồi máu nữa, từ đó mỗi vòng nhận thêm 10% sát thương — yêu vật hồi máu giỏi mấy cũng không kéo thành thế bí. Trong Ảo Cảnh, yêu vật biết hồi máu mỗi lượt chỉ hồi 2%, thiêu đốt và trúng độc đều chặn được.</p>
  <p class="help-p">Trang bị rơi ra đều ghi vào ván này, đánh xong xem một thể; giữa chừng không dừng lại tổng kết.</p>
  <div class="row" style="justify-content:center"><button class="btn" data-act="close">Đã hiểu</button></div>`;
function xiangBar(run) {
  const L = xiangLeft(run), G = run.riftDone ? null : RIFT_GRADES.find(g => g.min >= 0 && L >= g.min);
  return `<div class="xiangbar ${L <= 0 ? 'out' : L < 0.25 ? 'low' : ''}" id="xiangbar"><i style="width:${L * 100}%"></i><em style="left:50%"></em><em style="left:25%"></em>
    <span>${xiangBarTxt(run)}</span></div>`;
}
function runBar(run) {
  const s = runStats(run), hp = Math.max(0, Math.min(run.hp, s.maxHp));
  const buffs = Object.entries(run.buffs).filter(([, v]) => v).map(([k, v]) => fmtStat(k, v)).join(", ");
  const title = run.mode === 'rift' ? `Ảo Cảnh Cửu U tầng ${run.riftLv} · ${themeOf(run).n}` : run.world ? chTitle(run.chapter) : `${chTitle(run.chapter)} · tầng ${CN[run.floor]}`;
  const goal = run.world && run.mode !== 'rift' ? '' : run.mode === 'rift'
    ? `<span class="pill ${run.prog >= 100 ? 'gold' : ''}" id="rbprog">${SPR.img('portal', 18)}Tiến độ ${Math.floor(run.prog)}%</span><span class="pill xiang ${xiangLeft(run) <= 0 ? 'out' : xiangLeft(run) < 0.25 ? 'low' : ''}" id="rbxiang">Hương ${xiangTxt(run)}</span>`
    : `<span class="pill ${run.hasKey ? 'gold' : 'dim'}">${SPR.img('key', 18)}${run.hasKey ? "Đã có chìa khóa" : "Chưa tìm thấy chìa khóa"}</span>`;
  return `<header class="runbar"><div class="rb-hero">${heroSpr(run.cls, 44)}<div><div class="fl">${title}</div>
      <div class="sub">${CLASSES[run.cls].n} Lv ${SAVE.chars[run.cls].level} · ${run.mode === 'rift' ? "Ảo Cảnh" : DIFFS[run.diff].n}${run.ngoc ? " · cùng Ngoc" : ''}${run.mods.length ? ' · ' + run.mods.map(id => DUNGEON_MODS.find(m => m.id === id).n).join(", ") : ''}</div></div></div>
    <div class="hpw"><div class="hpbar big" id="rbhp"><i style="width:${hp / s.maxHp * 100}%"></i><span>${hpTxt(hp)} / ${hpTxt(s.maxHp)}</span></div>${xpRow(run.cls)}</div>
    <div class="row"><span class="pill" id="rbpot">Đan dược ${run.potions}</span>${goal}<span class="pill gold">Bạc ${SAVE.gold}</span>${run.world && (run.chapter === 7 || SAVE.mb) ? `<span class="pill mb">Minh tệ ${SAVE.mb || 0}</span>` : ''}${run.tishen ? `<span class="pill">Hình nhân ${run.tishen}</span>` : ''}</div></header>
    ${buffs ? `<div class="buffs">Tăng cường chuyến này: ${buffs}</div>` : ''}`;
}
// 战斗里的顶栏：压成两条细行（血条在下面的状态栏里），整场战斗一屏放得下
function battleBar(run) {
  if (run.mode === 'tower') { const S = twState(run.cls); return `<header class="runbar bbar"><div class="bb1"><b class="fl">Tháp Thông Thiên · tầng ${run.twF}${run.twName ? ' · ' + esc(run.twName) : ''}</b></div><div class="bb2"><span class="pill">Lưu ở tầng ${S.ck}</span><span class="pill gold">Cao nhất tuần này ${S.best}</span></div></header>`; }
  const title = run.mode === 'rift' ? `Ảo Cảnh tầng ${run.riftLv} · ${themeOf(run).n}` : run.world ? chTitle(run.chapter) : `${chTitle(run.chapter)} · tầng ${CN[run.floor]}`;
  const goal = run.world && run.mode !== 'rift' ? '' : run.mode === 'rift'
    ? `<span class="pill ${run.prog >= 100 ? 'gold' : ''}" id="rbprog"><i></i>Tiến độ ${Math.floor(run.prog)}%</span><span class="pill xiang ${xiangLeft(run) <= 0 ? 'out' : xiangLeft(run) < 0.25 ? 'low' : ''}" id="rbxiang">Hương ${xiangTxt(run)}</span>`
    : `<span class="pill ${run.hasKey ? 'gold' : 'dim'}">${run.hasKey ? "Đã có chìa khóa" : "Chưa tìm thấy chìa khóa"}</span>`;
  return `<header class="runbar bbar"><div class="bb1"><b class="fl">${title}</b>${xpRow(run.cls)}</div>
    <div class="bb2">${goal}<span class="pill gold">Bạc ${fmtBig(SAVE.gold)}</span>${run.world && (run.chapter === 7 || SAVE.mb) ? `<span class="pill mb">Minh tệ ${SAVE.mb || 0}</span>` : ''}${run.tishen ? `<span class="pill">Hình nhân ${run.tishen}</span>` : ''}</div></header>`;
}
const lockNote = (txt) => `<div class="locknote">${SPR.img('lock', 22)}<span>${txt}</span></div>`;

// ---------- 青石镇（营地） ----------
// 2026-11-26 减法改版：背包独立成页（五门共用）；设置缩成右上角齿轮
// 山海异兽坐骑：图鉴页最上面一排；没见过的只有剪影
const mountPanel = () => { const M = SAVE.mounts || {}; return `<section class="panel mtp"><h3>Dị thú Sơn Hải <small>${Object.keys(MOUNTS).filter(k => M[k]).length}/${Object.keys(MOUNTS).length} · thắng là cưỡi được, chỉ để đẹp</small></h3><div class="mts">${Object.keys(MOUNTS).map(id => { const m = MOUNTS[id], got = M[id], on = got && SAVE.mount === id; return `<button class="mt ${got ? '' : 'no'} ${on ? 'on' : ''}" data-act="mount" data-arg="${id}">${SPR.img(m.spr, 44)}<b>${got ? m.n : "? ? "}</b><small>${on ? "Đang cưỡi" : got ? "Chạm để cưỡi" : "Chưa gặp"}</small></button>`; }).join('')}</div></section>`; };
// 出征页关隘图里的主角：有坐骑就骑着，没有就站着（三层姿势图叠起来，和地图上是同一套）
function heroFig(cls, S) {
  if (typeof HERO === 'undefined' || !HERO.has(cls)) return heroSpr(cls, S);
  const mt = SAVE.mount && (SAVE.mounts || {})[SAVE.mount] && MOUNTS[SAVE.mount], cell = S / 32, u = cell * 0.655 * 30 / 30, F = HERO.url(cls, mt ? 'ride' : 'idle', null); if (!F) return heroSpr(cls, S);
  const w = 56 * u * 1.5, h = 46 * u * 1.5, k = u * 1.5, lay = (x, y) => ['back', 'body', 'front'].map(l => `<img src="${F[l]}" style="position:absolute;left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;image-rendering:pixelated" alt="" draggable="false">`).join('');
  if (!mt) return `<div class="hfig" style="width:${(S * 0.7).toFixed(0)}px;height:${S}px">${lay(S * 0.35 - 28 * k, S - 44 * k)}</div>`;
  return `<div class="hfig" style="width:${S}px;height:${S}px"><img src="${SPR.url(mt.spr)}" style="position:absolute;left:0;top:0;width:${S}px;height:${S}px;image-rendering:pixelated" alt="" draggable="false">${lay(mt.seat[0] * cell - 28 * k, mt.seat[1] * cell - 33 * k)}</div>`;
}
// 布阵那一行（出征页）：阵法和伙伴合在一起
function zhenRow() {
  const T = teamOf(), N = teamSlots(), c = formCur(), any = FORM_IDS.some(formOpen);
  return `<button class="teamrow zhrow" data-act="${any ? 'fmopen' : 'teamopen'}"><span class="sub">${any ? "Trận pháp" : "Đồng hành"}</span>${any ? `<b>${c ? `${FORMS[c].n} Lv ${formLv(c)}` : "Tán Trận"}</b>` : ''}<small>Đồng hành ${T.length}/${N}</small><em>${any ? "Bày trận" : "Điều chỉnh"} ›</em></button>`;
}
// 关隘图里门前的队伍：摆了阵按号位分前后排，没摆按各人本来的前后排；点了去布阵
function gateTeam(cls) {
  const keys = fmMembers(), cur = formCur(), sl = cur ? formSlots(cur, keys, cls) : null;
  const rowOf = k => sl ? (sl.indexOf(k) < 2 ? 0 : 1) : natRow(k, cls), num = k => sl ? `<i>${sl.indexOf(k) + 1}</i>` : '';
  const fig = k => `<span class="rg-m ${k === 'hero' ? 'me' : ''}">${k === 'hero' ? heroFig(cls, 62) : unitIcon(k === 'ngoc' ? 'ngocfox' : COMPANIONS[k].spr, 38, null, '', 'full')}${num(k)}</span>`;
  const grp = (r, lab) => { const L = keys.filter(k => rowOf(k) === r); return `<button class="rg-row r${r}" data-act="${FORM_IDS.some(formOpen) ? 'fmopen' : 'teamopen'}"><span class="rg-figs">${L.map(fig).join('')}</span><small>${lab}</small></button>`; };
  return grp(1, "Hậu tuyến") + grp(0, "Tiền tuyến");
}
// 布阵弹窗底下的一排伙伴：亮着的是带上的，写着站几号
function fmBench(sel) {
  const T = teamOf(), N = teamSlots(), all = Object.keys(COMPANIONS).filter(compOpen), sl = sel !== 'san' ? formSlots(sel, fmMembers(), SAVE.cls) : null;
  if (!all.length) return '';
  return `<div class="fmbench"><span class="sub">Đồng hành ${T.length}/${N}<button class="linkbtn" data-act="teamopen">Tài của từng người ›</button></span><div class="fmbl">${all.map(c => { const on = T.includes(c), i = sl ? sl.indexOf(c) : -1;
    return `<button class="fmbc ${on ? 'on' : ''}" data-act="fmbench" data-arg="${c}">${unitIcon(c === 'ngoc' ? 'ngocfox' : COMPANIONS[c].spr, 26, null, '', 'head')}<b>${c === 'ngoc' ? 'Ngoc' : COMPANIONS[c].n}</b><small>${on ? (i >= 0 ? `Vị trí ${i + 1}` : natRow(c, SAVE.cls) ? "Hậu tuyến" : "Tiền tuyến") : "Chưa mang"}</small></button>`; }).join('')}</div></div>`;
}
const TOWN_TABS = [['go', "Xuất chinh"], ['gear', "Nhân vật"], ['bag', "Túi đồ"], ['hero', "Tu luyện"], ['col', "Giang Hồ Lục"]];
function dots() {
  const d = {}, cls = SAVE.cls;
  d.col = featureOn('bounty') && SAVE.bounty && SAVE.bounty.list.some(b => b.prog >= b.need && !b.claimed);
  d.hero = talTodo(cls) || (featureOn('para') && paraFree() > 0 && !autoParaOn());
  return d;
}
function townHTML() {
  try { if (autoAllot()) persist(true); } catch (e) {}   // 自动加点：有没用掉的心法、修为点就先加上
  const cls = SAVE.cls, C = CLASSES[cls], ch = SAVE.chars[cls], s = charStats(cls), need = xpNeed(ch.level), dt = dots(), top = ch.level >= MAX_LV;
  const tabs = CLASS_IDS.map(id => `<button class="ct ${id === cls ? 'on' : ''}" data-act="tab" data-arg="${id}" title="${CLASSES[id].n}">${heroSpr(id, 30)}<span>${SAVE.chars[id].level}</span></button>`).join('');
  const body = ({ go: goTab, gear: gearTab, bag: bagTab, hero: heroTab, col: colTab, set: setTab }[TT] || goTab)();
  const xpk = top ? SAVE.para.xp / paraNeed(SAVE.para.lv) : ch.xp / need;
  // 2026-11 一屏：顶上两条（资源一条，角色切换＋当前角色一条），下面一排页签，再下面内容区；整页不滚，只在内容区里的框滚
  return `<div class="thead"><div class="th1"><button class="homeb" data-act="home" aria-label="Trang chủ">‹</button><h1>Cửu U Hồi Lang</h1>
      <div class="rescur"><span class="pill gold">${SPR.img('ingot', 16)}${fmtBig(SAVE.gold)}</span><span class="pill">${SPR.img('shard', 16)}${fmtBig(SAVE.mats)}</span><button class="setb ${TT === 'set' ? 'on' : ''}" data-act="tt" data-arg="set" aria-label="Cài đặt">⚙</button></div></div>
    <div class="th2"><div class="ctabs">${tabs}</div>${!seen('clstip') && storyCleared('normal') < 2 && !SAVE.story.ended ? "<button class=\"clstip\" data-act=\"clstip\"><b>↖ Năm hình đầu này là năm môn phái</b>Chạm một cái là đổi người, mỗi phái một lối đánh <i>Đã hiểu</i></button>" : ''}
      <div class="cinfo"><div class="ci1"><b>${C.n}</b><span><i>Lực chiến</i> <b>${power(s)}</b></span></div>
        <div class="xp xpm ${top ? 'pxp' : ''}"><i style="width:${Math.min(100, xpk * 100)}%"></i></div><small>${top ? `${featureOn('para') && SAVE.para.lv ? realmName(SAVE.para.lv) + ' · ' : ''}Tu vi ${SAVE.para.xp}/${paraNeed(SAVE.para.lv)}` : `Cấp ${ch.level}${featureOn('para') && SAVE.para.lv ? ` · Tu vi ${realmName(SAVE.para.lv)}` : ` · Kinh nghiệm ${ch.xp}/${need}`}`}</small></div></div></div>
  ${storageOK ? '' : "<p class=\"warn\">Trình duyệt này không cho lưu tiến độ, đóng trang là mất hết.</p>"}
  <nav class="ttabs">${TOWN_TABS.map(([k, n]) => `<button class="ttab ${TT === k ? 'on' : ''}" data-act="tt" data-arg="${k}">${n}${dt[k] ? '<i class="dot"></i>' : ''}</button>`).join('')}</nav>
  <main class="tcont t-${TT}" data-scroll="tc-${TT}">${body}</main>`;   // 页签放在上面（原来钉在屏幕最底下）
}
function npcList() {
  const c = storyCleared('normal');
  if (!c && riftPath()) return [['ngoc', 'ngoc'], ...['kang', 'smith', 'tiedan', 'yujiang', 'lei'].filter(id => svcFns(id).length).map(id => [id, id])];   // 幻境路线：Ngoc 带路，镇上的师傅按开到哪儿陆续露面
  if (!c) { const w1 = SAVE.world && SAVE.world[wk(1)]; if (!w1 || w1.main < WQ[1].main.findIndex(m => m.id === 'm10')) return []; }   // 第一章还没走进青石镇：镇上的人还不认识
  let L = wTownNpcs().map(id => [id, id]);
  if (c >= 9) L = L.filter(([id]) => id !== 'long');   // 第九章，龙道长提着灯走上了坑口
  if (c >= 1 && c < 8) L.push(['taoist', 'taoist']);
  for (const id of ['tiedan', 'yujiang']) if (svcFns(id).length && !L.some(x => x[0] === id)) L.push([id, id]);   // 有手艺可做了才露面
  return L;
}
// ---------- 镇上的人各有手艺：点谁，开谁的铺子（每人一两样）----------
const SVC = {
  kang:    { hi: "Sổ sách nhà kho ta nhớ cả. Muốn kiểm kê, hay muốn thử vận may?", fns: [['bulk', "Kiểm kê nhà kho", () => true], ['gamble', "Cược đá", () => featureOn('enhance')]] },
  smith:   { hi: "Hả? Rèn sắt? Nói to lên! Cường hóa thì tìm ta!", fns: [['enh', "Cường hóa", () => featureOn('enhance')]] },
  tiedan:  { hi: "Cha ta lo đập, ta lo mài. Dòng nào chướng mắt cứ đem tới; đao cũ nung lại, cứng như đồ mới!", fns: [['refine', "Tẩy luyện", () => featureOn('reroll')], ['up', "Điểm hóa", () => featureOn('anc')]] },
  yujiang: { hi: "Lỗ phải đục cho chuẩn, ngọc phải ghép cho chắc. Cứ từ từ.", fns: [['sock', "Đục lỗ khảm ngọc", () => featureOn('sockets')], ['gems', "Ghép ngọc", () => featureOn('gems')]] },
  lei:     { hi: "Việc trên bảng ngày nào cũng đổi. Gom đủ tiền thưởng thì ra quầy đổi đồ tốt!", fns: [['bounty', "Truy nã mỗi ngày", () => featureOn('bounty')], ['shang', "Quầy tiền thưởng", () => featureOn('bounty')]] },
};
const svcFns = id => (SVC[id] ? SVC[id].fns.filter(f => f[2]()) : []);
let NPCV = { id: null, fn: null, item: null }, GAMBLE = null, BULKX = new Set(), BULKARM = false;
// 筛选分解／出售：先挑品级，再挑要留下的，下面列出会被处理的装备，点一件可以单独留下
function bulkBody() {
  const f = bulkFilter(), cls = SAVE.cls, sell = f.mode === 'sell', cnt = {};
  for (const it of SAVE.stash) cnt[it.rarity] = (cnt[it.rarity] || 0) + 1;
  const all = bulkPick(cls, f), list = all.filter(it => !BULKX.has(it.id));
  const tot = list.reduce((a, it) => a + (sell ? sellPrice(it) : salvageValue(it)), 0), risky = list.filter(it => it.rarity === 'set' || it.rarity === 'legend').length;
  const keeps = [['keepUp', `món giúp ${CLASSES[cls].n} mạnh lên`], ['keepSp', "món có dòng đặc biệt"], ['keepAnc', "Thượng Cổ"], ['keepPri', "Thái Cổ"], ...(shelved('jy') ? [] : [['keepJy', "Cửu U"]]), ['keepQ', "món có phẩm chất dòng từ tám phần"], ...(featureOn('cube') ? [['keepCube', "thần binh chưa cất vào Túi Càn Khôn"]] : [])];
  const order = { legend: 0, set: 1, rare: 2, magic: 3, normal: 4 }, shown = all.slice().sort((a, b) => order[a.rarity] - order[b.rarity] || b.ilvl - a.ilvl).slice(0, 80);
  // 2026-11-23 重排：品级一排五格、留下规则两列勾选、装备按品级分组排成整齐的方格；方格在框里滚，确认按钮钉在底部
  const nA = n => SAVE.stash.filter(it => it.anc === n && f.r[it.rarity]).length;   // 选中的品级里有几件上古、太古、九幽
  const jyN = list.filter(it => it.anc === 3).length;
  const keepsTxt = { keepUp: "món giúp bạn mạnh lên", keepSp: "có dòng đặc biệt", keepAnc: `Thượng Cổ${nA(1) ? `<small>${nA(1)} món</small>` : ''}`, keepPri: `Thái Cổ${nA(2) ? `<small>${nA(2)} món</small>` : ''}`, keepJy: `<span class="jyc">Cửu U</span>${nA(3) ? `<small>${nA(3)} món</small>` : ''}`, keepQ: "phẩm chất dòng từ tám phần", keepCube: "thần binh chưa cất vào Túi Càn Khôn" };
  const groups = RARITY_ORDER.slice().reverse().map(r => [r, shown.filter(it => it.rarity === r)]).filter(g => g[1].length);
  const tile = it => `<button class="bk2-t r-${it.rarity} ${BULKX.has(it.id) ? 'off' : ''} ${ancCls(it)}" data-act="bulkx" data-arg="${it.id}">${SPR.item(it, 30)}<span>${esc(itemTitle(it))}</span>${BULKX.has(it.id) ? "<em>Giữ</em>" : ''}</button>`;
  return `<div class="bulk bk2">
    <div class="bk2-seg"><button class="${sell ? '' : 'on'}" data-act="bulkmode" data-arg="salv">Phân giải · lấy hồn tinh</button><button class="${sell ? 'on' : ''}" data-act="bulkmode" data-arg="sell">Bán · lấy bạc</button></div>
    <h4 class="bk2-h">Xử lý những phẩm cấp nào</h4>
    <div class="bk2-rar">${RARITY_ORDER.map(r => `<button class="r-${r} ${f.r[r] ? 'on' : ''}" data-act="bulkr" data-arg="${r}"><b>${RARITY[r].n}</b><small>${cnt[r] || 0} món</small></button>`).join('')}</div>
    <h4 class="bk2-h">Giữ lại những món này<small>Đã cường hóa, khảm ngọc, khóa thì không bao giờ bị động tới</small></h4>
    <div class="bk2-keep">${keeps.map(([k]) => `<button class="${f[k] ? 'on' : ''}${['keepAnc', 'keepPri', 'keepJy'].includes(k) ? ' w2' : ''}" data-act="bulkk" data-arg="${k}"><i></i>${keepsTxt[k]}</button>`).join('')}</div>
    <div class="bk2-list" data-scroll="bulk">${groups.length ? groups.map(([r, L]) => { const a1 = L.filter(it => it.anc === 1).length, a2 = L.filter(it => it.anc === 2).length, a3 = L.filter(it => it.anc === 3).length; return `<div class="bk2-g r-${r}">${RARITY[r].n} · ${L.length}${a1 ? `<em class="ga1">Thượng Cổ ${a1}</em>` : ''}${a2 ? `<em class="ga2">Thái Cổ ${a2}</em>` : ''}${a3 ? `<em class="ga3">Cửu U ${a3}</em>` : ''}</div>${L.map(tile).join('')}`; }).join('') : "<p class=\"bk2-empty\">Không có trang bị nào hợp điều kiện</p>"}${all.length > shown.length ? `<p class="bk2-empty">……còn ${all.length - shown.length} món chưa liệt kê</p>` : ''}</div>
    <div class="bk2-foot"><p>${list.length ? `${sell ? "Bán" : "Phân giải"} <b>${list.length}</b> món → <b>${tot}</b> ${sell ? "lượng bạc" : "hồn tinh"}` : "Không có trang bị cần xử lý"}${all.length ? "<small>Chạm vào trang bị để giữ riêng món đó</small>" : ''}</p>
    <button class="btn big" ${list.length ? '' : 'disabled'} data-act="bulkgo">${BULKARM && risky ? (jyN ? `Trong đó có ${jyN} món Cửu U, chạm lần nữa để xác nhận` : `Trong đó có ${risky} món Bộ hoặc Thần binh, chạm lần nữa để xác nhận`) : `${sell ? "Bán" : "Phân giải"} ${list.length} món này`}</button></div></div>`;
}
const bulkModal = () => `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">Kiểm kê nhà kho</h2>${bulkBody()}`;
function gambleBody() {
  const cls = SAVE.cls, p = gamblePrice(cls);
  const n = gambleN();
  return `<p class="help-p">Bỏ <b>${p}</b> lượng${n ? `<small class="gb-up">(cược liền lần ${n + 1} +${Math.round(n * GB_STEP * 100)}%)</small>` : ''}, cược một món trang bị ${CLASSES[cls].n} dùng được: vị trí bạn chọn, phẩm cấp tùy vận may${rTop() > 0 ? "<button class=\"qhelp sm\" data-act=\"gbhelp\" aria-label=\"Giải thích\">?</button>" : ''}</p>
    <div class="row wallet"><span class="pill gold">Bạc ${SAVE.gold}</span></div>
    <div class="svc-slots">${SLOTS.filter(sl => !sl.type && slotOpen(sl.id)).map(sl => `<button class="btn sm" ${SAVE.gold >= p ? '' : 'disabled'} data-act="gamb" data-arg="${sl.id}">${sl.n}</button>`).join('')}</div>
    ${GAMBLE && SAVE.stash.includes(GAMBLE) ? `<div class="svc-res"><span class="sub">Cược được (đã cất vào túi đồ):</span>${lootChips([GAMBLE])}</div>` : ''}`;
}
// 要挑一件装备才能办的事：先列装备（身上的在前），点一件，下面才是这位师傅的那一样手艺
function svcItems(fn) {
  const ok = it => fn === 'refine' ? it.aff.length > 0 : fn === 'up' ? (it.rarity === 'legend' || it.rarity === 'set') : true, order = { legend: 0, set: 1, rare: 2, magic: 3, normal: 4 };
  return [...Object.values(SAVE.chars[SAVE.cls].eq).filter(it => it && ok(it)).map(it => ({ it, eq: 1 })),
    ...SAVE.stash.filter(ok).sort((a, b) => order[a.rarity] - order[b.rarity] || b.ilvl - a.ilvl).slice(0, 40).map(it => ({ it }))];
}
const svcInfo = (fn, it) => fn === 'enh' ? ((it.plus || 0) >= ENHANCE_MAX ? "Đã +10" : `Cường hóa +${it.plus || 0}`) : fn === 'sock' ? `Lỗ ${(it.gems || []).length}/${it.sockets || 0}` : fn === 'refine' ? `Phẩm chất ${Math.round(itemQ(it) * 100)}%`
  : fn === 'up' ? TIER_N[it.tier || tierOf(it.ilvl)] : fn === 'inh' ? `+${it.plus || 0}${it.gems && it.gems.length ? ` · ${it.gems.length} viên ngọc` : ''}` : '';
function svcItemBody(fn, title) {
  const f = NPCV.item && findItem(NPCV.item);
  if (f) return `<div class="svc-it"><button class="btn sm ghost" data-act="npcitem" data-arg="">‹ Đổi món</button>${SPR.item(f.it, 30)}<span class="nm r-${f.it.rarity}">${itemTitle(f.it)}<small>${SLOT_NAME[f.it.slot]} · ${f.where === 'eq' ? "đang mặc" : "trong túi đồ"}</small></span><button class="btn sm ghost" data-act="item" data-arg="${f.it.id}">Xem</button></div>${smithHTML(f.it, f.where, new Set([fn]), title)}`;
  const L = svcItems(fn);
  return `<p class="sub">Chọn một món trang bị (đồ ${CLASSES[SAVE.cls].n} đang mặc xếp trước):</p>
    <div class="svc-list">${L.map(({ it, eq }) => `<button class="svc-row ${ancCls(it)}" data-act="npcitem" data-arg="${it.id}">${SPR.item(it, 28)}<span class="nm r-${it.rarity}">${itemTitle(it)}<small>${eq ? "Đang mặc · " : ''}${SLOT_NAME[it.slot]} · giai ${it.ilvl}</small></span><em>${svcInfo(fn, it)}</em></button>`).join('') || "<div class=\"empty-note\">Không có trang bị phù hợp.</div>"}</div>`;
}
const npcModal = () => {
  const id = NPCV.id, Sp = SPEAKERS[id] || {}, fns = svcFns(id);
  if (!fns.length) return "<button class=\"btn sm ghost x\" data-act=\"close\">Đóng</button><p class=\"sub\">Ở đây hiện chưa có việc gì làm được.</p>";
  if (!fns.some(f => f[0] === NPCV.fn)) { NPCV.fn = fns[0][0]; NPCV.item = null; }
  const fn = NPCV.fn, title = fns.find(f => f[0] === fn)[1];
  const body = fn === 'bulk' ? bulkBody() : fn === 'gamble' ? gambleBody() : fn === 'gems' ? gemsBody() : fn === 'bounty' ? bountyHTML()
    : fn === 'shang' ? `<p class="help-p">Tiền thưởng kiếm từ truy nã đem ra quầy đổi đồ: hồn tinh, ngọc, trang bị có dòng đặc biệt, Bộ, Thần binh. Hàng mỗi lần nghỉ đổi một lượt.</p><div class="row wallet"><span class="pill gold">Tiền thưởng ${SAVE.shang || 0}</span></div><div class="row" style="justify-content:center"><button class="btn" data-act="btyshop">Mở quầy tiền thưởng</button></div>`
    : svcItemBody(fn, title);
  return `<div class="shead"><button class="btn sm ghost" data-act="close">Đóng</button>${fns.length > 1 ? `<div class="stabs">${fns.map(f => `<button class="${f[0] === fn ? 'on' : ''}" data-act="npcfn" data-arg="${f[0]}">${f[1]}</button>`).join('')}</div>` : ''}</div>
    <div class="svc-head">${unitIcon(Sp.spr, 56, Sp.pal, '', 'stand')}<div><b>${Sp.n}</b><p>${SVC[id].hi}</p></div></div>${body}`;
};
// ---------------- 养成台 ----------------
// 以前：找人 → 选职能 → 挑装备 → 操作，换一样手艺又得从头找这件装备。现在一个页面：
// 顶上一排身上的装备，点一下选中；下面一排页签切手艺，选中的装备不变；第一页「一览」直接列出现在能做的事。镇上的三位师傅只是入口
let WS = { tab: 'ov', item: null, stash: false };
// 2026-11-26 减法：传承取消（强化跟部位）、淬炼并进洗炼、升阶并进点化
const WS_TABS = [['ov', "Tổng quan", () => true, null], ['enh', "Cường hóa", () => featureOn('enhance'), 'smith'], ['refine', "Tẩy luyện", () => featureOn('reroll'), 'tiedan'],
  ['up', "Điểm hóa", () => featureOn('anc'), 'tiedan'], ['sock', "Khảm ngọc", () => featureOn('sockets'), 'yujiang'], ['forge', "Đúc binh", () => featureOn('rift'), 'smith']];
const wsTabs = () => WS_TABS.filter(t => t[2]());
const WS_NPC = { smith: 'enh', tiedan: 'refine', yujiang: 'sock' };
// 这件装备现在能做什么（一览和页签红点共用）
function wsCan(it, where) {
  const c = {}, cls = ctxCls();
  if (featureOn('enhance') && (it.plus || 0) < smithMax()) { const e = enhanceCost(it); if (SAVE.gold >= e.gold && SAVE.mats >= e.mats) c.enh = `Cường hóa được lên +${(it.plus || 0) + 1} (tỉ lệ thành công ${Math.round(e.rate * 100)}%)`; }
  if (featureOn('sockets')) { const free = (it.sockets || 0) - (it.gems || []).length, sc = socketCost(it);
    if (free > 0 && Object.keys(SAVE.gems).some(k => SAVE.gems[k] > 0)) c.sock = `Có ${free} lỗ trống, khảm ngọc được`;
    else if ((it.sockets || 0) < MAX_SOCKETS[it.slot] && SAVE.gold >= sc.gold && SAVE.mats >= sc.mats) c.sock = "Đục thêm được một lỗ"; }
  if (featureOn('reroll') && it.aff.length) { const q = itemQ(it); if (busyRoll(it)) c.refine = "Còn một lần tẩy luyện chưa chọn kết quả"; else if (q != null && q < 0.5) c.refine = `Chất lượng thuộc tính chỉ ${Math.round(q * 100)}%, có thể tẩy luyện`; }
  if (featureOn('anc') && !c.up && ancOK(it) && SAVE.mats >= ancCost(it) && (!it.anc || (it.anc === 1 ? primalGate() : jyGate() && (SAVE.jyx || 0) >= JY_XJ))) c.up = `Có thể điểm hóa thành ${it.anc === 2 ? "Cửu U" : it.anc ? "Thái Cổ" : "Thượng Cổ"} (${ancCost(it)} hồn tinh${it.anc === 2 ? ` + ${JY_XJ} viên Cửu U Huyền Tinh` : ''})`;
  return c;
}
function wsWorn(cls) { const eq = SAVE.chars[cls].eq; return eqSlots().map(p => [p, eq[p]]).filter(e => e[1]); }
function wsForgeBody(cls) {
  const W = wpnList(cls), bp = SAVE.bp || 0, owned = new Set(allItems().map(it => it.legend).filter(Boolean));
  return `<p class="help-p"><b>Binh khí chuyên thuộc</b>: mỗi hướng Bộ Ảo Cảnh một món, đổi hẳn cách dùng chiêu chủ lực. Công có sẵn cao hơn thần binh thường ba phần; mỗi +1 cường hóa, hiệu ứng tăng thêm 3%. Gom đủ <b>${WPN_COST}</b> viên Binh phách thì chỉ định đúc một món.</p>
    <div class="row wallet"><span class="pill gold">Binh phách ${bp} / ${WPN_COST}</span></div>
    <p class="sub">Binh phách: từ Ảo Cảnh tầng ${WPN_LV}, mỗi ván xong đúng giờ được 2 viên, hương tàn chỉ được 1 viên. Từ tầng ${RSET2_LV}, yêu vương còn có tỉ lệ rất nhỏ rơi thẳng một món.</p>
    ${W.map(L => { const S = SETS.find(x => x.id === L.set);
      return `<div class="wpn"><div class="wpn-h">${SPR.img('i_weapon', 34, { M: SPR.RAR_COL.legend })}<span class="nm"><b class="r-legend">${L.n}</b><small>hợp “${S ? S.n : ''}” · đúc ra giai ${wpnIlvl()}${owned.has(L.id) ? " · đã có một món" : ''}</small></span>
        <button class="btn sm" ${bp >= WPN_COST ? '' : 'disabled'} data-act="wsforge" data-arg="${L.id}">Đúc</button></div><p>${L.d}</p></div>`; }).join('')}`;
}
function wsModal() {
  const cls = ctxCls(), tabs = wsTabs(); if (!tabs.some(t => t[0] === WS.tab)) WS.tab = 'ov';
  const tab = WS.tab, T = tabs.find(t => t[0] === tab), worn = wsWorn(cls), f = WS.item && findItem(WS.item); if (WS.item && !f) WS.item = null;
  const cans = new Map(worn.map(([p, it]) => [it.id, wsCan(it, 'eq')]));
  const dot = k => [...cans.values()].some(c => c[k]) || (k === 'forge' && (SAVE.bp || 0) >= WPN_COST);
  const strip = `<div class="ws-strip">${worn.map(([p, it]) => `<button class="ws-it ${WS.item === it.id ? 'on' : ''} b-${it.rarity}" data-act="wsitem" data-arg="${it.id}">${SPR.item(it, 30)}<small>${it.plus ? '+' + it.plus : SLOTS.find(z => z.id === p).s}</small>${tab !== 'ov' && cans.get(it.id)[tab] ? '<i></i>' : ''}</button>`).join('')}
      ${tab === 'enh' || tab === 'sock' ? '' : `<button class="ws-it more ${WS.stash ? 'on' : ''}" data-act="wsstash"><span>Túi</span><small>Túi đồ</small></button>`}</div>`;
  let body;
  if (tab === 'forge') body = wsForgeBody(cls);
  else if (tab === 'ov') {
    const todo = []; for (const [p, it] of worn) { const c = cans.get(it.id); for (const k of ['refine', 'enh', 'sock', 'up']) if (c[k] && tabs.some(t => t[0] === k)) todo.push([it, k, c[k]]); }
    body = `<h4 class="sub-h">Làm được ngay <small>chạm một dòng để tới thẳng</small></h4>
      <div class="ws-todo">${todo.length ? todo.slice(0, 12).map(([it, k, txt]) => `<button data-act="wsgo" data-arg="${k}|${it.id}">${SPR.item(it, 24)}<span><b class="r-${it.rarity}">${itemTitle(it)}</b><small>${txt}</small></span><em>${tabs.find(t => t[0] === k)[1]} ›</em></button>`).join('') : "<div class=\"empty-note\">Đồ đang mặc hiện chưa có gì làm được: không đủ bạc, hồn tinh, hoặc đã làm tới hết mức.</div>"}</div>
      <h4 class="sub-h">Đồ đang mặc</h4>
      <div class="ws-tbl"><div class="hd"><span>Trang bị</span><span>C.hóa</span><span>Lỗ</span><span>P.chất</span><span>Giai</span></div>${worn.map(([p, it]) => { const q = itemQ(it);
        return `<button data-act="wsitem" data-arg="${it.id}"><span class="r-${it.rarity}">${SPR.item(it, 20)}${itemTitle(it)}</span><span>+${it.plus || 0}</span><span>${(it.gems || []).length}/${it.sockets || 0}</span><span class="${q != null && q < 0.5 ? 'lo' : ''}">${q == null ? '—' : Math.round(q * 100) + '%'}</span><span>${tierOf(it.ilvl)}</span></button>`; }).join('')}</div>`;
  } else if (f) {
    body = `<div class="svc-it">${SPR.item(f.it, 30)}<span class="nm r-${f.it.rarity}">${itemTitle(f.it)}<small>${SLOT_NAME[f.it.slot]} · ${f.where === 'eq' ? "đang mặc" : "trong túi đồ"}</small></span><button class="btn sm ghost" data-act="item" data-arg="${f.it.id}">Xem</button></div>${smithHTML(f.it, f.where, new Set([tab]), T[1])}`;
  } else body = "<p class=\"sub\" style=\"text-align:center;margin:14px 0\">Chạm một món trang bị ở trên trước.</p>";
  if (WS.stash && tab !== 'forge' && tab !== 'enh' && tab !== 'sock') { const L = svcItems(tab === 'ov' ? 'refine' : tab).filter(e => !e.eq);
    body = `<div class="svc-list ws-stash">${L.map(({ it }) => `<button class="svc-row ${ancCls(it)} ${WS.item === it.id ? 'on' : ''}" data-act="wsitem" data-arg="${it.id}">${SPR.item(it, 28)}<span class="nm r-${it.rarity}">${itemTitle(it)}<small>${SLOT_NAME[it.slot]} · giai ${it.ilvl}</small></span><em>${svcInfo(tab === 'ov' ? 'refine' : tab, it)}</em></button>`).join('') || "<div class=\"empty-note\">Trong túi đồ không có trang bị phù hợp.</div>"}</div>` + body; }
  if (tab === 'sock' && featureOn('gems')) body = `<button class="btn gemfit" data-act="gemfit">Khảm ngọc tốt nhất<small>Mỗi lỗ trên người đổi sang viên hợp nhất trong túi ngọc · miễn phí</small></button>` + body + `<details class="wxinfo"><summary>Ghép ngọc</summary>${gemsBody()}</details>`;
  const Sp = T[3] && SPEAKERS[T[3]];
  return `<div class="shead"><button class="btn sm ghost" data-act="close">Đóng</button><b class="ws-title">Đài Nuôi Đồ</b><span class="ws-res">${fmtBig(SAVE.gold)} lượng · ${fmtBig(SAVE.mats)} hồn tinh${!shelved('jy') && (SAVE.jyx || jyGate()) ? ` · <b class="jyc">${SAVE.jyx || 0} Huyền Tinh</b>` : ''}</span></div>
    ${tab === 'forge' ? '' : strip}
    <div class="ws-tabs">${tabs.map(t => `<button class="${t[0] === tab ? 'on' : ''}" data-act="wstab" data-arg="${t[0]}">${t[1]}${t[0] !== 'ov' && dot(t[0]) ? '<i></i>' : ''}</button>`).join('')}</div>
    ${Sp ? `<div class="ws-npc">${unitIcon(Sp.spr, 30, Sp.pal, '', 'stand')}<span>${Sp.n}</span></div>` : ''}${body}`;
}
function wsOpen(tab, item) { const tabs = wsTabs(); WS = { tab: tabs.some(t => t[0] === tab) ? tab : 'ov', item: item || null, stash: false }; if (item) { const f = findItem(item); if (f && f.where !== 'eq') WS.stash = false; } BACK = null; openModal(wsModal); }
const boxNoteModal = () => `<h2 class="mh">Có thêm mấy ô trang bị</h2>
  <p class="help-p"><b>Hộp Linh Ngọc</b>: Ảo Cảnh đánh tới tầng 30 thì mỗi nhân vật có một cái, nằm trong các ô trang bị ở trang “Nhân vật”. Hộp có sẵn một ít khí huyết và sát thương, ba lỗ chuyên khảm linh ngọc. Linh ngọc dùng chung cả tài khoản, mỗi nhân vật tự chọn ba viên. Linh ngọc trước đây khảm trên nhẫn, ngọc bội đã được chuyển vào hộp, hai lỗ đó trả lại cho ngọc thường.</p>
  <p class="help-p"><b>Ô trang bị mới</b> mở dần theo kỷ lục Ảo Cảnh: <b>Thắt lưng</b> (tầng 10, thiên phòng thủ), <b>Tay phụ</b> (tầng 20, thiên tấn công, mỗi môn phái một món riêng), <b>Nhẫn thứ hai</b> (tầng 30). Mở rồi thì loại trang bị đó sẽ rơi trong Ảo Cảnh.</p>
  <div class="row" style="justify-content:center"><button class="btn" data-act="close">Đã hiểu</button></div>`;
const svcNoteModal = () => `<h2 class="mh">Dưỡng trang bị ở đâu</h2>
  <p class="help-p">Bấm mở một món trang bị, hàng trên cùng chính là: Cường hóa, Tẩy luyện, Điểm hóa, Khảm ngọc. Cường hóa và ngọc ghi trên vị trí, đổi trang bị không mất.</p>
  <p class="help-p">Kiểm kê, phân giải, cược đá ở “Túi đồ”; truy nã và quầy tiền thưởng ở “Giang Hồ Lục → Truy nã”.</p>
  <div class="row" style="justify-content:center"><button class="btn" data-act="close">Đã hiểu</button></div>`;
function npcRow() {   // 镇上的人：2026-11-26 铺子都搬走了（养成点装备、清点在背包、悬赏在江湖录），这一排只管聊天和交任务
  const qc = townCh(), story = !SAVE.story.ended && !riftPath();
  const L = npcList().filter(([id]) => story || (qc && wNpcMark(qc, id)));   // 通关后、幻境路线：身上挂着任务的人才露面
  if (!L.length) return '';
  return `<div class="npcrow">${L.map(([id]) => { const S = SPEAKERS[id], mk = qc ? wNpcMark(qc, id) : '';
    return `<button class="npc2" data-act="npc" data-arg="${id}" id="npc-${id}">${mk ? `<em class="qmk ${mk}">${mk === 'turn' ? '?' : '!'}</em>` : ''}${unitIcon(S.spr, 34, S.pal, '', 'head')}<b>${S.n}</b></button>`; }).join('')}</div>`;
}
function campStrip() {
  return `<section class="camp" style="--bg:#0e0a0c"><div class="lanterns"><i></i><i></i><i></i></div>
    <div class="npcs">${npcList().map(([id]) => { const S = SPEAKERS[id], qc = townCh(), mk = qc ? wNpcMark(qc, id) : '';
      return `<button class="npc ${id}" data-act="npc" data-arg="${id}" id="npc-${id}">${mk ? `<em class="qmk ${mk}">${mk === 'turn' ? '?' : '!'}</em>` : ''}${unitIcon(S.spr, id === 'ngoc' ? 76 : 60, S.pal, id === 'ngoc' ? 'idle' : '', 'stand')}<b>${S.n}</b>${svcFns(id).length ? `<small class="svc-tag">${svcFns(id).map(f => f[1]).join(' · ')}</small>` : ''}</button>`; }).join('')}</div>
    <p class="camp-hint">Trấn Thanh Thạch · chạm vào người trong trấn: mỗi người một nghề</p></section>`;
}
// 役使那一行：收服过首领精魄才出现；点开换
function yiRow(cls) {
  if (!featureOn('rift') || !yiCount()) return '';
  const yi = (SAVE.chars[cls].yi || []).filter(id => yiGrade(id));
  return `<div class="yirow" data-act="zyopen"><span class="sub">Dịch Sứ</span>${[0, 1].map(i => { const id = yi[i], d = id && yiBoss(id), g = id && yiGrade(id);
    return id ? `<span class="yi2">${d ? SPR.img(d.spr, 26, d.pal) : ''}<b>${YISHI[id].n}</b><small>${ZY_CN[g]}</small></span>` : `<span class="yi2 empty">＋ Ô trống</span>`; }).join('')}<em>${shelved('zy') ? "Đổi ›" : "Trấn Yêu Lục ›"}</em></div>`;
}
function goTab() {
  const cls = SAVE.cls, run = SAVE.run;
  if (run) return `${npcRow()}<section class="panel gopanel"><h3>Chuyến phiêu lưu đang dở</h3><div class="gobody"><div class="resume">${CLASSES[run.cls].n} · ${run.mode === 'rift' ? "Ảo Cảnh Cửu U · tầng " + run.riftLv + " " : run.world ? chTitle(run.chapter) + ' · ' + zoneName() : chTitle(run.chapter) + " · tầng" + CN[run.floor] + ""}</div></div>
    <div class="gostart"><button class="btn big" data-act="resume">Tiếp tục phiêu lưu</button><button class="btn ghost" data-act="retreat" style="width:100%">${run.world ? "Kết thúc chuyến này (giữ nguyên tiến độ nhiệm vụ, có thể đổi nhân vật)" : "Bỏ cuộc (đồ đã nhận vẫn giữ lại)"}</button></div></section>`;
  const ru = featureOn('rift'), mode = ru && (SAVE.mode === 'rift' || SAVE.mode === 'tower') ? SAVE.mode : 'story';
  const modeSel = ru ? `<div class="seg sm s3"><button class="${mode === 'story' ? 'on' : ''}" data-act="mode" data-arg="story">Cốt truyện</button><button class="${mode === 'rift' ? 'on' : ''}" data-act="mode" data-arg="rift">Ảo Cảnh Cửu U</button><button class="${mode === 'tower' ? 'on' : ''}" data-act="mode" data-arg="tower">Tháp Thông Thiên</button></div>` : "<b class=\"gotitle\">Cốt truyện chính</b>";
  let body;
  if (mode === 'tower') return `${npcRow()}<section class="panel gopanel"><div class="gotop">${modeSel}<button class="qhelp" data-act="twhelp" aria-label="Giải thích">?</button></div>${towerBody(cls)}</section>`;
  if (mode === 'story') {
    if (!SAVE.unlocked[SAVE.diff]) SAVE.diff = 'normal';
    const diff = SAVE.diff, cl = storyCleared(diff), maxCh = Math.min(10, cl + 1);
    if (SAVE.chapter > maxCh) SAVE.chapter = maxCh;
    const k = SAVE.chapter, C = CHAPTERS[k - 1], done = k <= cl, known = storyCleared('normal') >= k;
    const rec = Math.min(MAX_LV, (k === 1 ? 1 : 2) + Math.round((k - 1) * 2.3) + DIFFS[diff].base);
    const lv = SAVE.chars[cls].level;
    const diffs = DIFF_IDS.filter(d => SAVE.unlocked[d]);
    body = `${diffs.length > 1 ? `<div class="dsw">${diffs.map(d => `<button class="${diff === d ? 'on' : ''}" data-act="diff" data-arg="${d}">${DIFFS[d].n}</button>`).join('')}</div>` : ''}
      <div class="chcard" style="--cbg:${C.bg}">
        <button class="charr" data-act="chnav" data-arg="-1" ${k > 1 ? '' : 'disabled'} aria-label="Chương trước">‹</button>
        <div class="chc-mid">
          <div class="chc-art ${known ? '' : 'sil'}">${SPR.img(C.boss.spr, 64, C.boss.pal, 'idle')}</div>
          <small class="chc-no">Chương ${CN[k]}${done ? " · <em>Đã qua</em>" : ''}</small>
          <h3>${C.n}</h3><p>${C.sub}</p>
          <div class="chc-meta"><span>Thủ lĩnh: ${known ? C.boss.n : "? ? ? "}</span><span class="${lv >= rec ? '' : 'warn'}">Đề xuất cấp ${rec} (bạn cấp ${lv})</span>${C.ngoc ? "<span class=\"pink\">Cùng Ngoc</span>" : ''}</div>
        </div>
        <button class="charr" data-act="chnav" data-arg="1" ${k < maxCh ? '' : 'disabled'} aria-label="Chương sau">›</button>
      </div>
      <div class="chdots">${CHAPTERS.map((_, i) => `<i class="${i + 1 === k ? 'on' : ''} ${i + 1 <= cl ? 'done' : ''} ${i + 1 > maxCh ? 'lock' : ''}"></i>`).join('')}</div>
      ${!SAVE.story.ended && !riftPath() ? "<button class=\"linkbtn topath\" data-act=\"topath\">Không muốn xem cốt truyện? Đổi sang “Thử thách Ảo Cảnh” ›</button>" : ''}${formRow()}${yiRow(cls)}`;
  } else {
    const maxR = Math.max(1, SAVE.riftCap || 3); if (SAVE.riftLv > maxR) SAVE.riftLv = maxR;
    const cu = catchUpMul(cls), rec = SAVE.riftRec[cls], ar = ancRate(SAVE.riftLv);
    const info = [["Thượng Cổ", `${(ar[0] * 100).toFixed(1)}%${ar[1] ? ` · Thái Cổ ${(ar[1] * 100).toFixed(2)}%` : ''}${jyRate(SAVE.riftLv) && !shelved('jy') ? ` · <b class="jyc">Cửu U ${(jyRate(SAVE.riftLv) * 100).toFixed(2)}%</b>` : ''}`], ["Một nén hương", `${Math.round(riftLimit(SAVE.riftLv) / 60000)} phút`],
      ["Kỷ lục", rec ? riftRecTxt(rec) : "Chưa có"], ["Bộ", SAVE.riftLv >= RSET2_LV ? "Rơi cả hai bộ" : SAVE.riftLv >= RSET_LV ? "Rơi một bộ" : `Từ tầng ${RSET_LV}`], ["Tinh phách", ZY_CN[zyGrade(SAVE.riftLv)]], ["Cao nhất", `Tầng ${maxR}`]];
    // 2026-11-26 出征页重排：上面一幅「幻境关隘」图（牌楼、匾额上写层数、主角和伙伴站在门前），底下是木牌快捷键和四块带图标的信息
    const dq = (arg, txt, dis) => `<button data-act="rlv" data-arg="${arg}" ${dis ? 'disabled' : ''}>${txt}</button>`, atMin = SAVE.riftLv <= 1, atMax = SAVE.riftLv >= maxR;
    const tile = (ic, k, v, act) => `<${act ? `button data-act="rlvto" data-arg="${act}"` : 'div'} class="rtile">${SPR.img(ic, 26)}<span><small>${k}</small><b>${v}</b></span></${act ? 'button' : 'div'}>`;
    body = `<div class="rgate"><i class="rg-moon"></i><i class="rg-mt"></i><i class="rg-mist"></i><i class="rg-ground"></i><i class="rg-path"></i>
        <div class="rg-arch"><i class="rg-portal"></i><i class="rg-pl"></i><i class="rg-pr"></i><i class="rg-roof"></i><i class="rg-beam"><em>Ảo Cảnh Cửu U</em></i><i class="rg-lan l"></i><i class="rg-lan r"></i>
          <div class="rg-plaque"><small>Tầng</small><b>${SAVE.riftLv}</b></div></div>
        <button class="rg-arr l" data-act="rlv" data-arg="-1" ${atMin ? 'disabled' : ''} aria-label="Thấp hơn một tầng">‹</button><button class="rg-arr r" data-act="rlv" data-arg="1" ${atMax ? 'disabled' : ''} aria-label="Cao hơn một tầng">›</button>
        ${gateTeam(cls)}
        <span class="rg-sh">${SPR.img('mt_dijiang', 16)}Có thể gặp <b>dị thú Sơn Hải</b> · thú cưỡi ${Object.keys(MOUNTS).filter(k => (SAVE.mounts || {})[k]).length}/${Object.keys(MOUNTS).length}</span></div>
      <div class="rquick"><button data-act="rlvto" data-arg="1" ${atMin ? 'disabled' : ''}>T.1</button>${dq(-50, '-50', atMin)}${dq(-10, '-10', atMin)}${dq(-5, '-5', atMin)}${dq(5, '+5', atMax)}${dq(10, '+10', atMax)}${dq(50, '+50', atMax)}<button data-act="rlvto" data-arg="${maxR}" ${atMax ? 'disabled' : ''}>Max</button></div>
      <div class="rtiles">${tile('fire', "Một nén hương · yêu vật", `${info[1][1]} · khoảng cấp ${riftLvCap({ riftLv: SAVE.riftLv, cls }, riftD(SAVE.riftLv).base)}`)}${tile('i_weapon', ar[1] ? "Thượng Cổ · Thái Cổ" : "Thượng Cổ", `${(ar[0] * 100).toFixed(1)}%${ar[1] ? ` · ${(ar[1] * 100).toFixed(2)}%` : ''}`)}${tile('chest', "Bộ · Tinh phách", `${info[3][1]} · ${info[4][1]}`)}${tile('scroll', "Kỷ lục · Cao nhất", `${info[2][1]} · tầng ${maxR}`, rec && rec.lv !== SAVE.riftLv && rec.lv <= maxR ? rec.lv : 0)}</div>
      ${rpOn() ? rpathRow() : ''}
      ${cu > 1 ? `<p class="cu-note s1">Đang đuổi theo: kinh nghiệm chiến đấu <b>×${cuTxt(cu)}</b> (thấp hơn nhân vật cao nhất ${topLevel() - SAVE.chars[cls].level} cấp)</p>` : ''}
      ${zhenRow()}${yiRow(cls)}`;
  }
  const mods = featureOn('mods') ? `<button class="chip modchip ${SAVE.mods.length ? 'on' : ''}" data-act="modsopen">Tăng độ khó${SAVE.mods.length ? ' ' + SAVE.mods.length : ''}</button>` : '';
  const comps = Object.keys(COMPANIONS).filter(c => (SAVE.comps || {})[c]);
  const compSel = comps.length > 1 && mode !== 'rift' ? `<div class="compsel"><span class="sub">Đồng hành</span>${comps.map(c => { const C2 = COMPANIONS[c]; return `<button class="cmp2 ${SAVE.comp === c ? 'on' : ''}" data-act="comp" data-arg="${c}">${unitIcon(C2.spr, 28, null, '', 'head')}<span><b>${c === 'ngoc' ? 'Ngoc' : C2.n}</b><small>${C2.d}</small></span></button>`; }).join('')}</div>` : '';
  return `${npcRow()}<section class="panel gopanel"><div class="gotop">${modeSel}${mods}<button class="qhelp" data-act="gohelp" aria-label="Giải thích">?</button></div>
    <div class="gobody" data-scroll="gobody">${body}${compSel}</div>
    <div class="gostart"><button class="btn big" data-act="start">${mode === 'rift' ? `Vào Ảo Cảnh Cửu U tầng ${SAVE.riftLv}` : `Xuất phát: ${chTitle(SAVE.chapter)}`}</button></div></section>`;
}
// ---------- 幻境路线：开局选「幻境挑战」的人，按幻境打通的最高层一样样开（幻境之路），每开一样有人来说一声、写明去哪儿用 ----------
// 2026-11-26 减法改版：节奏放慢（见 engine.js 的 RIFT_UNLOCK）；主线通关以后也按这张表开。f：对应哪个功能；sp：剧情里已经教过，走主线的人不再提；sl：走主线的人听到的话
const RIFT_STEPS = [
  { lv: 0, n: "Ảo Cảnh Cửu U · Ngoc đồng hành", d: "Trong một nén hương đánh thông một tầng là có thể khiêu chiến tầng sâu hơn. Mười tầng đầu yêu vật không cao hơn bạn quá nhiều.", where: "Trang xuất chinh → vào Ảo Cảnh Cửu U" },
  { lv: 3, f: 'enhance', n: "Cường hóa · cô Trân", d: "Trương Đại Chùy cường hóa cho bạn. Cường hóa ghi trên vị trí: ô binh khí cường hóa tới mấy thì đổi cây nào cũng là bấy nhiêu. Cô Trân đến làm đồng hành.", where: "Trang “Nhân vật”, bấm một món đang mặc → Cường hóa; đồng hành đổi ở mục “Đồng hành” trong trang Ảo Cảnh",
    lines: [['smith', "Hả? Ngươi là cái đứa bò ra từ Ảo Cảnh đó à? Nói to lên!"], ['smith', "Cường hóa thì tìm ta! Ta cường hóa không phải món nào, mà là vị trí trên người ngươi — đổi đồ rồi, cường hóa vẫn còn!"], ['zhen', "Đồ trong Ảo Cảnh càng lúc càng nhiều, nha môn ngồi không yên nữa rồi."], ['zhen', "Chuyến sau, ta xuống cùng ngươi."]],
    sl: [['smith', "Hả? Ảo Cảnh đánh tới tầng ba rồi? Nói to lên!"], ['smith', "Cường hóa thì tìm ta! Ta cường hóa không phải món nào, mà là vị trí trên người ngươi — đổi đồ rồi, cường hóa vẫn còn!"]] },
  { lv: 7, f: 'runes', sp: 1, n: "Long đạo trưởng · Biến chiêu", d: "Long đạo trưởng đến làm đồng hành, còn dạy bạn đổi cách đánh cho chiêu thức (biến chiêu).", where: "Chọn biến chiêu cho chiêu thức trong “Tu luyện → Võ học”",
    lines: [['long', "Huynh đài! Tại hạ đêm xem thiên tượng, yêu khí dưới Cửu U ngút trời —"], ['long', "Tại hạ xuống cùng ngươi ngay. Tiện thể dạy ngươi một tay: cùng một chiêu, đổi cách đánh, uy lực khác hẳn."]] },
  { lv: 8, f: 'sockets', n: "Đục lỗ khảm ngọc", d: "Chưởng quầy Ngọc đục lỗ, khảm ngọc cho vị trí. Lỗ và ngọc cũng ghi trên vị trí, đổi trang bị không cần tháo. Ngọc bậc thấp nhặt được sẽ tự ghép lên.", where: "Trang “Nhân vật”, bấm một món đang mặc → Khảm ngọc; ngọc ở “Túi đồ → Ngọc”, ở đó có nút “Khảm ngọc tốt nhất”",
    lines: [['yujiang', "Mấy viên đá lấp lánh nhặt dọc đường đừng vứt. Đem đây, ta khảm cho."], ['yujiang', "Lỗ đục trên vị trí của ngươi, ngọc cũng đi theo vị trí. Đổi trang bị rồi, khỏi phải tháo."]] },
  { lv: 10, f: 'bounty', n: "Truy nã · Quầy tiền thưởng · quản gia Khang", d: "Lôi Lão Hổ ngày nào cũng treo truy nã, đánh xong lĩnh tiền thưởng, đổi đồ tốt ở quầy; quản gia Khang đến làm đồng hành; Ảo Cảnh bắt đầu rơi nhiều loại từ khóa và thần binh hơn.", where: "“Giang Hồ Lục → Truy nã”",
    lines: [['lei', "Việc trên bảng ngày nào cũng đổi! Đánh xong đến lĩnh thưởng, gom đủ thì đổi đồ tốt ở quầy!"], ['kang', "Sổ sách kho ta ghi giúp ngươi. …Chuyến sau, tính cả ta."]],
    sl: [['lei', "Việc trên bảng ngày nào cũng đổi! Đánh xong đến lĩnh thưởng, gom đủ thì đổi đồ tốt ở quầy!"]] },
  { lv: 15, f: 'reroll', n: "Tẩy luyện", d: "Thiết Đản giúp bạn tẩy những thuộc tính không ưng: khóa cái muốn giữ, còn lại đổi mới hết, xong chọn một trong hai bộ cũ mới.", where: "Bấm một món trang bị → Tẩy luyện",
    lines: [['tiedan', "Món trên người ngươi, từ khóa tệ quá! Đem đây, ta tẩy cho!"], ['tiedan', "Cái nào muốn giữ thì khóa trước. Khóa càng nhiều ta thu càng đắt — đừng trách ta không nói trước!"]] },
  { lv: 20, f: 'cube', sp: 1, n: "Túi Càn Khôn", d: "Thu hiệu ứng của thần binh vào Túi Càn Khôn, học vĩnh viễn: không mặc món đó, hiệu ứng vẫn còn.", where: "Ô “Túi Càn Khôn” trong các ô trang bị ở trang “Nhân vật”",
    lines: [['ngoc', "Cái túi này cho ngươi. Nhặt được thần binh đừng vội bán — thu bản lĩnh của nó vào đây, nó sẽ mãi là của ngươi."]] },
  { lv: 20, n: "Bộ Ảo Cảnh", d: "Từ tầng 20 rơi bộ Ảo Cảnh, từ tầng 30 rơi cả hai bộ.", where: "Mục “Bộ” trong thông tin Ảo Cảnh ở trang xuất chinh",
    lines: [['ngoc', "Dưới tầng hai mươi có cả bộ trang bị người xưa để lại. Gom đủ bộ thì hơn mọi thứ."]] },
  { lv: 25, f: 'anc', n: "Điểm hóa", d: "Thần binh, đồ bộ có thể tốn hồn tinh để điểm hóa thành Thượng Cổ: mọi thuộc tính +30%. Sau tầng 90 Ảo Cảnh, Thượng Cổ còn điểm hóa tiếp thành Thái Cổ được.", where: "Bấm một món thần binh hoặc đồ bộ → Điểm hóa",
    lines: [['tiedan', "Thần binh, đồ bộ mang đây! Ta điểm hóa nó thành Thượng Cổ — thuộc tính toàn thân tăng ba phần!"], ['tiedan', "Cần hồn tinh. Rất nhiều hồn tinh."]] },
  { lv: 30, f: 'lgem', n: "Linh ngọc", d: "Đánh thông một tầng là có thể được một viên linh ngọc, khảm vào Hộp Linh Ngọc; đánh càng nhanh, nâng được càng nhiều cấp.", where: "Ô “Linh ngọc” trong các ô trang bị ở trang “Nhân vật”",
    lines: [['yujiang', "Linh ngọc từ Ảo Cảnh ra, lỗ thường không giữ nổi. Cho ngươi một cái hộp, chuyên để nó."]] },
  { lv: 40, f: 'para', n: "Tu vi", d: "Sau khi đầy cấp (cấp 50), kinh nghiệm biến thành điểm tu vi, tự cộng vào thuộc tính.", where: "“Tu luyện → Tu vi” (mặc định tự cộng điểm)",
    lines: [['ngoc', "Ngươi đã đi đủ sâu rồi. Đợi ngươi đến cấp năm mươi, từ đó mỗi điểm kinh nghiệm đều sẽ thành tu vi."]] },
];
const rpOk = x => x.f ? featureOn(x.f) : rTop() >= x.lv;
const rpOn = () => (riftPath() || storyEnded()) && featureOn('rift');
const rpNext = () => RIFT_STEPS.find(x => !rpOk(x));
function rpathRow() {
  const nx = rpNext(); if (!nx) return '';
  return `<button class="rpath" data-act="rpath"><span class="sub">Đường Ảo Cảnh</span><b>Thông tầng ${nx.lv}</b><small>Mở: ${esc(nx.n)}</small><em>›</em></button>`;
}
const rpathModal = () => { const t = rTop(), nx = rpNext();
  return `<h2 class="mh">Đường Ảo Cảnh <small>đã thông ${t} tầng</small></h2><p class="sub">Ảo Cảnh thông đến tầng mấy thì mở thứ đó. Không cần vội, từng thứ một. Cốt truyện lúc nào cũng có thể chuyển sang “Cốt truyện chính” ở trang xuất chinh để xem.</p>
    <ol class="rpl">${RIFT_STEPS.map(x => { const ok = rpOk(x), cur = x === nx;
      return `<li class="${ok ? 'ok' : cur ? 'nx' : ''}"><b>${x.lv ? `Tầng ${x.lv}` : "Mở đầu"}</b><div><span>${ok ? '✓ ' : ''}${esc(x.n)}</span><small>${esc(x.d)}</small>${ok ? `<em>Ở đâu: ${esc(x.where)}</em>` : cur ? `<em>Còn thiếu ${Math.max(1, x.lv - t)} tầng</em>` : ''}</div></li>`; }).join('')}</ol>
    <p class="help-p">Đồng hành khác: ${['lei', 'liu', 'tie'].map(c => `${COMPANIONS[c].n} (${COMPANIONS[c].lock})`).join(", ")}, sau tầng mười lần lượt quen được.</p>
    <div class="sheet-act"><button class="btn ghost" data-act="close">Được rồi</button></div>`; };
const toPathModal = () => `<h2 class="mh">Đổi sang “Thử thách Ảo Cảnh”?</h2><p class="help-p">Tiến độ cốt truyện vẫn giữ nguyên, lúc nào cũng có thể chuyển lại “Cốt truyện chính” đánh tiếp.</p>
  <p class="help-p">Ảo Cảnh đánh từ tầng 1, càng sâu mở càng nhiều: cường hóa, khảm ngọc, truy nã, tẩy luyện, Túi Càn Khôn, đồng hành… mỗi thứ mở ra đều có người chỉ bạn dùng ở đâu.</p>
  <div class="sheet-act"><button class="btn" data-act="setpath">Đổi sang Ảo Cảnh</button><button class="btn ghost" data-act="close">Thôi</button></div>`;
function playRiftIntro(sw) {
  markSeen('rpIntro'); markSeen('prologue'); save();
  setTimeout(() => playDialog([
    ...(sw ? [] : [['narr', "Trấn Thanh Thạch. Một trấn nhỏ nơi biên ải, dựng trên một hồi lang cổ xưa."], ['narr', "Sâu nhất trong hồi lang có một vùng ảo cảnh: trong một nén hương, yêu vật tầng sau dữ hơn tầng trước, đồ rơi tầng sau tốt hơn tầng trước."]]),
    ['ngoc', "Muốn mạnh lên? Vào Ảo Cảnh. Không chết được đâu, cùng lắm bị nó nhả ra thôi."],
    ['ngoc', "Ta xuống cùng ngươi. Ngươi đánh càng sâu, người trong trấn chịu giúp ngươi càng nhiều."],
    ['narr', sw ? "(Bước tiếp theo làm gì, xem “Đường Ảo Cảnh” ở trang Ảo Cảnh, hoặc chạm Ngoc trong trấn.)" : "(Chọn một nghề ở hàng trên cùng, rồi bấm “Vào Ảo Cảnh Cửu U”. Bước tiếp theo làm gì, xem “Đường Ảo Cảnh” ở trang Ảo Cảnh, hoặc chạm Ngoc trong trấn.)"],
  ], null), 400);
}
// 回到镇上：幻境路线刚开的东西，让对应的人来说一声
function riftPathCheck() {
  if (VIEW !== 'town' || !rpOn() || DLG || MODALFN) return;
  const sty = !riftPath();   // 走主线通关的人：剧情里教过的（变招、乾坤袋）不再提，伙伴也早认识了
  SAVE.flags = SAVE.flags || {}; const all = RIFT_STEPS.filter(x => x.lv > 0 && rTop() >= x.lv && !SAVE.flags['rp' + x.lv]); if (!all.length) return;
  all.forEach(x => { SAVE.flags['rp' + x.lv] = 1; }); save();
  const st = all.filter(x => !(sty && x.sp)).map(x => sty && x.sl ? { ...x, lines: x.sl } : x); if (!st.length || st.length > 3) return;   // 一口气跳过好多步的（老存档、测试号）：不排队念了
  setTimeout(() => { if (DLG || VIEW === 'battle') return; playDialog(st.flatMap(x => [...(x.lines || []), ['narr', `(Đường Ảo Cảnh · tầng ${x.lv}: mới mở “${x.n}”. Ở đâu: ${x.where})`]]), null, () => refresh()); }, 600);
}
// 出征页的说明（原来整段摊在页面上，现在点「?」才出来）
// ---------- 通天塔（2026-11-24）----------
const twKindTxt = (cls, f) => f % 10 === 0 ? `Chủ tháp · ${CHAPTERS[(f - 1 + twSave().wk) % 10].boss.n}` : f % 5 === 0 ? "Thủ lĩnh tinh anh kèm hộ pháp" : f >= 3 ? "Một đàn yêu vật, có tinh anh" : "Một đàn yêu vật";
const twNextRew = f => { const k = Math.ceil(f / 10) * 10; return k; };
function twKitLine(cls, kit) {   // 身上塔装的一句话概括
  const sets = {}; let leg = 0, rare = 0; for (const p of POS_IDS) { const it = kit.eq[p]; if (!it) continue; if (it.set) sets[it.set] = (sets[it.set] || 0) + 1; else if (it.legend) leg++; else rare++; }
  const st = Object.keys(sets).map(id => `${(SETS.find(x => x.id === id) || {}).n || id} ${sets[id]} món`).join(' · ');
  const rs = twSetMax(kit);
  return [st, rs >= TW_RES[0][0] ? `Cộng hưởng ${rs >= TW_RES[1][0] ? 6 : 4} món` : '', leg ? `Thần binh ${leg} món` : '', rare ? `Bảo phẩm ${rare} món` : '', kit.allN ? `Toàn thuộc tính +${TW_ALL * kit.allN}%` : ''].filter(Boolean).join(' · ');
}
function towerBody(cls) {
  const T = twSave(), S = twState(cls), f = S.fl, kit = S.kit, C = CLASSES[cls], rec = T.rec[cls] || 0, nx = Math.min(TW.top, twNextRew(f)), RW = twRewOf(nx), top = f > TW.top;
  const sk = kit.sk.map(id => { const k = C.skills.find(x => x.id === id), r = kit.rn[id]; return k ? `${k.n}${r ? `<small>·${RUNES[id][r === 'a' ? 0 : 1].n}</small>` : ''}` : ''; }).join(", ");
  const cube = kit.cube.map(id => (LEGENDS.find(l => l.id === id) || {}).n).filter(Boolean).join(", ") || "Chưa có";
  const lg = kit.lg.map(g => `${LGEMS[g.t].n} ${g.lv}`).join(", ") || "Chưa có";
  return `<div class="gobody tw" data-scroll="gobody">
      <div class="twhead"><b>${esc(C.n)}<button class="qhelp tq" data-act="twcls" aria-label="Lối chơi môn phái">?</button></b><span>Tuần này tầng <em>${f}</em></span></div>
      <div class="twstat"><div><small>Điểm lưu</small><b>tầng ${S.ck}</b></div><div><small>Cao nhất tuần</small><b>tầng ${S.best}</b></div><div><small>Kỷ lục</small><b>tầng ${rec}</b></div></div>
      <div class="twnext"><small>${top ? "Đỉnh tháp" : `Tầng ${f}`}</small><b>${top ? `Đã qua hết ${TW.top} tầng` : `${twKindTxt(cls, f)}${f === TW.top ? " · Đỉnh tháp" : ''}`}</b></div>
      <div class="twkit" data-act="twkit"><div><small>Đồ tháp</small><span>${twKitLine(cls, kit)}</span></div><div><small>Chiêu</small><span>${sk}</span></div><div><small>Hồn thần binh</small><span>${cube}</span></div><div><small>Linh ngọc</small><span>${lg}</span></div><em>Xem đồ tháp ›</em></div>
      ${top ? `<p class="twrew twtop">Đã lên đỉnh tầng ${TW.top} · có thể leo lại ngay từ tầng 1, thưởng chủ tháp mỗi tuần chỉ nhận một lần</p>` : `<p class="twrew"><small>Chủ tháp tầng ${nx}</small>${(T.wr[cls] || 0) >= nx ? "Thưởng tuần này đã nhận" : `Hồn tinh ${RW.m} · Bạc ${fmtBig(RW.g)} · một viên ngọc`}${(T.ms[cls] || 0) >= nx || !RW.x ? '' : shelved('jy') ? ` · lần đầu qua thêm hồn tinh ${RW.x * 100}` : ` · <b class="jyc">Lần đầu: Huyền Tinh ${RW.x}</b>`}</p>`}
      <p class="sub twnote">Vào tháp ai cũng như nhau, không mang đồ luyện của mình · thứ Hai đổi tháp</p>
    </div>
    <div class="gostart">${f > 1 && !top ? `<button class="btn sm ghost twrs" data-act="twreset">Leo lại từ tầng 1</button>` : ''}${S.pend ? `<button class="btn big" data-act="twpend">Chọn thưởng tầng ${f - 1} trước</button>` : top ? `<button class="btn big" data-act="twagain">Leo lại từ tầng 1</button>` : `<button class="btn big" data-act="twgo">Khiêu chiến tầng ${f}</button>`}</div>`;
}
const twResetModal = () => () => { const cls = SAVE.cls, S = twState(cls), T = twSave(), wr = T.wr[cls] || 0;
  return `<h2 class="mh">Leo lại từ tầng 1?</h2><p class="help-p">Hiện ở tầng ${S.fl}. Leo lại thì đồ tháp, chiêu, hồn thần binh, linh ngọc đều về bộ lúc đầu, leo lại từ tầng 1, chọn một trong ba có thể đổi lối khác.</p>
  <p class="help-p">Cao nhất tuần ${S.best} tầng và kỷ lục đều giữ nguyên. Thưởng chỉ lấy mức cao nhất: ${wr ? `tuần này đã nhận tới chủ tháp tầng ${wr}, leo lại thì chủ tháp từ tầng ${wr} trở xuống không cho thưởng nữa, hạ được tầng cao hơn mới cho` : "tuần này chưa nhận thưởng chủ tháp, hạ chủ tháp vẫn cho như thường"}; Cửu U Huyền Tinh lần đầu mỗi tầng cũng chỉ cho một lần.</p>
  <div class="sheet-act"><button class="btn" data-act="twreset2">Leo lại</button><button class="btn ghost" data-act="close">Thôi</button></div>`; };
const twPendModal = () => () => { const cls = SAVE.cls, S = twState(cls); return `<h2 class="mh">Tầng ${S.fl - 1} · chọn một thứ mang lên tầng</h2><div class="twpicks">${twPicksHTML(cls)}</div>`; };
function twGo() {
  if (SAVE.run) return toast("Hãy kết thúc chuyến phiêu lưu đang dở trước đã");
  if (twState(SAVE.cls).pend) return openModal(twPendModal());
  if (twState(SAVE.cls).fl > TW.top) return openModal(twResetModal());
  const cls = SAVE.cls, { run, kind } = twRun(cls); AUTO = false;
  SAVE.run = run; beginBattle(kind);
  banner(`Tháp Thông Thiên · tầng ${run.twF}`, run.twName || (kind === 'elite' ? "Có tinh anh" : "Một đàn yêu vật"), 1400);
  applyStep(null);
}
// 三选一：点一下展开看清楚（套装各档效果、换下什么、跟手上哪些东西有关），再按「就选它」（2026-11-25）
let TWSEL = null;   // { f: 这是哪一层的三选一, i }
const twSetCnt = kit => { const c = {}; for (const q of POS_IDS) { const it = kit.eq[q]; if (it && it.set) c[it.set] = (c[it.set] || 0) + 1; } return c; };
const twResTxt = () => `Trong tháp gom đủ ${TW_RES[0][0]} món: sát thương +${TW_RES[0][1]}%, khí huyết +${TW_RES[0][2]}%; ${TW_RES[1][0]} món thêm +${TW_RES[1][1]}%, +${TW_RES[1][2]}%`;
const twSetTxt = S => [2, 4, 6].map(n => S['b' + n + 'd']).filter(Boolean).join("; ");
const twTheme = (cls, sid) => { const b = (BUILDS[cls] || []).find(x => x.set === sid); return b ? b.d : ''; };
// 一段说明里点名了哪些招式、哪些套装：只说有没有关系，不评好坏
function twRelOut(cls, kit, txt, selfSet) {
  const C = CLASSES[cls], cnt = twSetCnt(kit), own = id => kit.sk.includes(id) || !(C.skills.find(k => k.id === id) || {}).cd;
  const ks = C.skills.filter(k => txt.includes(k.n)), out = [];
  const need = ks.filter(k => !own(k.id)).map(k => k.n), have = ks.filter(k => own(k.id)).map(k => k.n);
  if (need.length) out.push(`Cần dùng: <b>${need.join(", ")}</b> (ngươi chưa có)`);
  if (have.length) out.push(`Tăng cho: ${have.join(", ")}`);
  SETS.filter(S => S.id !== selfSet && txt.includes(S.n)).forEach(S => out.push(`Cần phối: ${S.n} (trên người ${cnt[S.id] || 0} món)`));
  return out;
}
// 新招式、变招：塔装里哪些东西点名了这一招
const twRelIn = (cls, kit, name) => { const src = twRelSrc(cls, kit, name); return src.length ? [`Liên quan chiêu này: ${src.join(", ")}`] : []; };
function twRelSrc(cls, kit, name) {
  const src = [], cnt = twSetCnt(kit);
  for (const id in cnt) { const S = SETS.find(x => x.id === id); if (S && twSetTxt(S).includes(name)) src.push(`${S.n} (${cnt[id]} món)`); }
  for (const q of POS_IDS) { const it = kit.eq[q], L = it && it.legend && LEGENDS.find(l => l.id === it.legend); if (L && L.d.includes(name)) src.push(L.n); }
  kit.cube.forEach(id => { const L = LEGENDS.find(l => l.id === id); if (L && L.d.includes(name) && !src.includes(L.n)) src.push(L.n); });
  kit.lg.forEach(g => { const G = LGEMS[g.t]; if (G && G.d(g.lv).includes(name)) src.push(G.n); });
  return src;
}
const twSwOk = (kit, p, sw) => p.t === 'sk' ? kit.sk.includes(sw) : p.t === 'cube' ? kit.cube.includes(sw) : p.t === 'lg' ? !!kit.lg[+sw] : false;
function twPickHTML(cls, p, i) {
  const C = CLASSES[cls], S0 = twState(cls), kit = S0.kit, sel = TWSEL && TWSEL.f === S0.fl && TWSEL.i === i;
  let h = '', d = '', det = [], rel = [];
  if (p.t === 'eq') { const it = p.it, S = it.set && SETS.find(x => x.id === it.set), L = it.legend && LEGENDS.find(l => l.id === it.legend);
    const pos = twEqPos(kit, it), old = kit.eq[pos], cnt = twSetCnt(kit);
    h = `<b class="r-${it.rarity}">${itemTitle(it)}</b><small>${(SLOTS.find(x => x.id === slotType(it.slot)) || {}).n || ''}</small>`;
    if (S) { const now = (cnt[S.id] || 0) - (old && old.set === S.id ? 1 : 0) + 1, th = twTheme(cls, S.id);
      d = `${S.n}: mặc vào thành ${now} món${th ? ` · ${esc(th)}` : ''}`;
      det = [2, 4, 6].filter(n => S['b' + n + 'd']).map(n => { const was = (cnt[S.id] || 0) >= n, on = now >= n;
        return `<p class="twb ${on ? (was ? 'on' : 'new') : 'off'}"><i>${n} món</i>${esc(S['b' + n + 'd'])}<em>${on ? (was ? "Đã mở" : "Món này mở") : `Thiếu ${n - now} món`}</em></p>`; });
      det.push(`<p class="twb ${now >= TW_RES[0][0] ? (now >= TW_RES[1][0] ? ((cnt[S.id] || 0) >= TW_RES[1][0] ? 'on' : 'new') : ((cnt[S.id] || 0) >= TW_RES[0][0] ? 'on' : 'new')) : 'off'}"><i>Cộng hưởng</i>${twResTxt()}<em>${now >= TW_RES[1][0] ? "Cộng hưởng 6 món" : now >= TW_RES[0][0] ? "Cộng hưởng 4 món" : `Thiếu ${TW_RES[0][0] - now} món`}</em></p>`);
      rel = twRelOut(cls, kit, twSetTxt(S), S.id);
    } else if (L) { d = esc(L.d); rel = twRelOut(cls, kit, L.d); }
    let ol = "Ô này đang trống";
    if (old) { ol = `Thay ra: <b class="r-${old.rarity}">${itemTitle(old)}</b>`;
      const OS = old.set && old.set !== it.set && SETS.find(x => x.id === old.set);
      if (OS) { const c = cnt[OS.id], lost = [2, 4, 6].filter(n => OS['b' + n + 'd'] && c >= n && c - 1 < n);
        ol += ` (${OS.n} ${c} → ${c - 1} món${lost.length ? `, <b class="lo">mất hiệu ứng ${lost.join(", ")} món</b>` : ''})`; } }
    det.push(`<p class="twol">${ol}</p>`); }
  else if (p.t === 'sk') { const k = C.skills.find(x => x.id === p.id); h = `<b>Chiêu mới · ${k.n}${skcTag(cls, k)}${p.swap ? `<small>${kit.sk.length < LOADOUT_MAX ? `Không còn chỗ cho ${SK_CAT[k.cat || 'core']}` : "Đã đủ chiêu"}, phải bỏ một chiêu</small>` : ''}</b>`; d = esc(k.d); rel = twRelIn(cls, kit, k.n);
    const R = RUNES[k.id]; if (R) det.push(`<p class="twol">Sau này còn biến chiêu: «${R[0].n}» ${esc(R[0].d)}; «${R[1].n}» ${esc(R[1].d)}</p>`);
    if (p.swap) { const sw = sel && TWSEL.sw, ok = sw && kit.sk.includes(sw);
      det.push(`<p class="twol">Bỏ chiêu nào:</p><div class="twsw">${kit.sk.map(id => { const o = C.skills.find(x => x.id === id); const fit = skFits(cls, kit.sk.map(x => x === id ? k.id : x)); return o ? `<button class="${id === sw ? 'on' : ''}" ${fit ? '' : 'disabled'} data-act="twswap" data-arg="${id}">${o.n}<small>${SK_CAT[o.cat || 'core']}</small></button>` : ''; }).join('')}</div>`);
      if (kit.sk.some(id => !skFits(cls, kit.sk.map(x => x === id ? k.id : x)))) det.push(`<p class="twol">Ô mờ là bỏ đi sẽ không hợp phân loại (Cốt lõi, Trạng thái, Khống chế mỗi loại một ô, thêm ${SK_FREE} ô tự do)</p>`);
      if (ok) { const o = C.skills.find(x => x.id === sw), r = kit.rn[sw], OR = r && RUNES[sw][r === 'a' ? 0 : 1], lose = twRelSrc(cls, kit, o.n);
        det.push(`<p class="twol">Thay ra: <b>${o.n}</b>${OR ? `, biến chiêu «${OR.n}» của nó cũng mất` : ''}</p>`);
        if (lose.length) det.push(`<p class="twol"><b class="lo">Mấy thứ này liên quan tới ${o.n}, bỏ rồi sẽ vô dụng: ${lose.join(", ")}</b></p>`); } } }
  else if (p.t === 'rn') { const k = C.skills.find(x => x.id === p.id), R = RUNES[p.id][p.r === 'a' ? 0 : 1], cur = kit.rn[p.id], R0 = cur && RUNES[p.id][cur === 'a' ? 0 : 1];
    h = `<b>Biến chiêu · ${k.n} «${R.n}»${skcTag(cls, k)}</b>`; d = esc(R.d); rel = twRelIn(cls, kit, k.n).concat(twRelOut(cls, kit, R.d).filter(x => !x.includes(k.n)));
    det.push(`<p class="twol">${R0 ? `Thay «${R0.n}» hiện tại: ${esc(R0.d)}` : `${k.n} hiện chưa có biến chiêu`}</p>`); }
  else if (p.t === 'cube') { const L = LEGENDS.find(l => l.id === p.lid); h = `<b class="r-legend">Hồn thần binh · ${L.n}${p.swap ? "<small>Đã đủ, phải bỏ một cái</small>" : ''}</b>`; d = esc(L.d); rel = twRelOut(cls, kit, L.d);
    det.push(`<p class="twol">Hồn thần binh chỉ cho hiệu ứng, không chiếm ô trang bị (đã có ${kit.cube.length}/3)</p>`);
    if (p.swap) { const sw = sel && TWSEL.sw; det.push(`<p class="twol">Bỏ cái nào:</p><div class="twsw">${kit.cube.map(id => { const o = LEGENDS.find(l => l.id === id); return o ? `<button class="${id === sw ? 'on' : ''}" data-act="twswap" data-arg="${id}">${o.n}</button>` : ''; }).join('')}</div>`);
      const o = sw && LEGENDS.find(l => l.id === sw); if (o && kit.cube.includes(sw)) det.push(`<p class="twol">Thay ra: <b>${o.n}</b>: ${esc(o.d)}</p>`); } }
  else if (p.t === 'lg') { const G = LGEMS[p.g.t], sw = p.swap && sel ? TWSEL.sw : null, o = sw != null && kit.lg[+sw], lv = o ? Math.max(p.g.lv, o.lv) : p.g.lv;
    h = `<b style="color:${G.c}">Linh ngọc · ${G.n} ${p.swap ? (o ? lv + " cấp" : '') : p.g.lv + " cấp"}${p.swap ? "<small>Đã đủ, phải bỏ một viên</small>" : ''}</b>`; d = esc(G.d(lv)); rel = twRelOut(cls, kit, G.d(lv));
    if (p.swap) { det.push(`<p class="twol">Bỏ viên nào (viên mới giữ cấp của nó):</p><div class="twsw">${kit.lg.map((g, j) => `<button class="${String(j) === String(sw) ? 'on' : ''}" data-act="twswap" data-arg="${j}">${LGEMS[g.t].n}<small>cấp ${g.lv}</small></button>`).join('')}</div>`);
      if (o) det.push(`<p class="twol">Thay ra: <b>${LGEMS[o.t].n} cấp ${o.lv}</b>: ${esc(LGEMS[o.t].d(o.lv))}</p>`); } }
  else if (p.t === 'lgup') { const g = kit.lg[p.i], G = LGEMS[g.t]; h = `<b style="color:${G.c}">${G.n} cấp ${g.lv} → ${g.lv + p.add}</b>`; d = esc(G.d(g.lv + p.add)); det.push(`<p class="twol">Hiện tại: ${esc(G.d(g.lv))}</p>`); }
  const need = p.swap && !(sel && TWSEL.sw != null && twSwOk(kit, p, TWSEL.sw));
  const more = sel ? `<div class="twdet">${det.join('')}${rel.map(t => `<p class="twrel">${t}</p>`).join('')}<button class="btn sm${need ? ' off' : ''}" data-act="twpick" data-arg="${i}">${need ? `Chạm chọn ${p.t === 'sk' ? "Chiêu" : p.t === 'cube' ? "hồn thần binh" : "Linh ngọc"} muốn bỏ trước` : "Chọn món này"}</button></div>` : '';
  return `<div class="twpick${sel ? ' sel' : ''}" data-act="twsel" data-arg="${i}">${h}<span>${d}</span>${sel ? '' : "<em class=\"twmore\">Chạm xem chi tiết ›</em>"}${more}</div>`;
}
function twSkipHTML(cls) {   // 三样都不要：换全属性
  const S0 = twState(cls), n = S0.kit.allN || 0, sel = TWSEL && TWSEL.f === S0.fl && TWSEL.i === 'x';
  return `<div class="twpick twskip${sel ? ' sel' : ''}" data-act="twsel" data-arg="x"><b>Không lấy · Toàn thuộc tính</b><span>Sát thương, khí huyết, hộ giáp mỗi thứ +${TW_ALL}%${n ? ` (đã lấy ${n} lần, hiện mỗi thứ +${TW_ALL * n}%)` : ''}, cộng dồn tới hết tháp tuần này</span>${sel ? `<div class="twdet"><button class="btn sm" data-act="twpick" data-arg="x">Chọn món này</button></div>` : ''}</div>`;
}
const twPicksHTML = cls => (twState(cls).pend || []).map((p, i) => twPickHTML(cls, p, i)).join('') + twSkipHTML(cls);
function twResHTML() {
  const cls = SAVE.run.cls, S = twState(cls), R = BRES.tw;
  const rew = R.rew.map(x => x.t === 'wk' ? `Thưởng tuần: Hồn tinh +${x.m} · Bạc +${fmtBig(x.g)} · ${gemName(x.gem)}` : x.m ? `Thưởng lần đầu qua: hồn tinh +${x.m}` : `Thưởng lần đầu: <b class="jyx">Cửu U Huyền Tinh +${x.x}</b>`).map(t => `<p class="twrw">${t}</p>`).join('');
  if (!R.win) return `<div class="res lose tw"><h3>Bại</h3><p>Ngã ở tầng ${R.f}. Quay về tầng ${R.back}, đồ tháp trở về bộ lúc lưu.</p>
    <div class="twbtns"><button class="btn big" data-act="twnext">Đánh lại tầng ${R.back}</button><button class="btn ghost" data-act="twhome">Về Trấn Thanh Thạch</button></div></div>`;
  const ck = R.f % 10 === 0 ? `<p class="twrw">Đã lưu: tầng ${R.f}</p>` : '';
  if (R.top) return `<div class="res win tw"><h3>Lên đỉnh</h3><p>Đã hạ chủ tháp tầng ${TW.top}. Có thể leo lại ngay từ tầng 1, đổi lối khác mà chơi; thưởng chủ tháp mỗi tuần chỉ nhận một lần.</p>${rew}<div class="twbtns"><button class="btn big" data-act="twagain">Leo lại từ tầng 1</button><button class="btn ghost" data-act="twhome">Về Trấn Thanh Thạch</button></div></div>`;
  if (S.pend) return `<div class="res win tw"><h3>Qua tầng ${R.f}</h3>${rew}${ck}<p class="sub">Chọn một thứ mang lên tầng</p><div class="twpicks">${twPicksHTML(cls)}</div></div>`;
  let nf = R.f + 1; while (nf < TW.top && !twPickFl(nf)) nf++;
  return `<div class="res win tw"><h3>Qua tầng ${R.f}</h3>${rew}${ck}<p class="sub">Lần chọn một trong ba tiếp theo: sau khi qua tầng ${nf}</p><div class="twbtns"><button class="btn big" data-act="twnext">Lên tầng ${S.fl}</button><button class="btn ghost" data-act="twhome">Về Trấn Thanh Thạch</button></div></div>`;
}
function twEndUI() {
  BRES = { tw: twEnd(SAVE.run.cls, B), win: !!B.win, items: [], gems: [], zy: [] }; save();   setTimeout(() => lbSync(), 800);   // 排行榜：有新纪录就传
  if (B.win) VFX.victory('P'); SFX.play(B.win ? (BRES.tw.rew.length ? 'legend' : 'win') : 'lose');
  flushBattleToasts(); const el = $('#bres'); if (!el) return; $('#bctl').hidden = true; el.innerHTML = twResHTML();
}
// 看塔装：在城里也能看清楚每样东西干嘛的——套装各档效果、神兵特效、招式和变招说明、还没学的招式（2026-11-25）
let TWKSEL = 0;
const twKitModal = () => () => {
  const cls = SAVE.cls, kit = twState(cls).kit, C = CLASSES[cls], cnt = twSetCnt(kit), H = t => `<h4 class="twkh">${t}</h4>`;
  const sets = Object.keys(cnt).map(id => { const S = SETS.find(x => x.id === id); if (!S) return ''; const n = cnt[id], th = twTheme(cls, id);
    return `<div class="twkset"><b class="r-set">${S.n}</b><small>trên người ${n} món</small>${th ? `<span>${esc(th)}</span>` : ''}${[2, 4, 6].filter(k => S['b' + k + 'd']).map(k => `<p class="twb ${n >= k ? 'on' : 'off'}"><i>${k} món</i>${esc(S['b' + k + 'd'])}<em>${n >= k ? "Đã mở" : `Thiếu ${k - n} món`}</em></p>`).join('')}<p class="twb ${n >= TW_RES[0][0] ? 'on' : 'off'}"><i>Cộng hưởng</i>${twResTxt()}<em>${n >= TW_RES[1][0] ? "Cộng hưởng 6 món" : n >= TW_RES[0][0] ? "Cộng hưởng 4 món" : `Thiếu ${TW_RES[0][0] - n} món`}</em></p></div>`; }).join('');
  const eq = POS_IDS.map(p => { const it = kit.eq[p]; if (!it) return ''; const L = it.legend && LEGENDS.find(l => l.id === it.legend);
    return `<div class="twkrow"><small>${(SLOTS.find(x => x.id === p) || {}).n}</small><b class="r-${it.rarity}">${itemTitle(it)}</b>${it.set ? `<em>${(SETS.find(x => x.id === it.set) || {}).n}</em>` : ''}${L ? `<span>${esc(L.d)}</span>` : ''}</div>`; }).join('');
  const skRow = (k, own) => { const r = kit.rn[k.id], RR = RUNES[k.id] || [], R = r && RR[r === 'a' ? 0 : 1];
    const rn = own ? (R ? `<span class="twrn">Biến chiêu «${R.n}»: ${esc(R.d)}</span>` : RR.length ? `<span class="twrn dim">Chưa biến chiêu, chọn một trong ba sẽ ra: «${RR[0].n}» ${esc(RR[0].d)}; «${RR[1].n}» ${esc(RR[1].d)}</span>` : '') : '';
    return `<div class="twkrow${own ? '' : ' dim'}"><small>${k.cd ? `Hồi chiêu ${k.cd}` : "Chiêu cơ bản"}</small><b>${k.n}</b>${wxBadge(k)}${skcTag(cls, k)}<span>${esc(k.d)}</span>${rn}</div>`; };
  const basic = C.skills.filter(k => !k.cd), own = kit.sk.map(id => C.skills.find(x => x.id === id)).filter(Boolean), rest = C.skills.filter(k => k.cd && !kit.sk.includes(k.id));
  const cu = kit.cube.map(id => { const L = LEGENDS.find(l => l.id === id); return `<div class="twkrow"><small>Hồn thần binh</small><b class="r-legend">${L.n}</b><span>${esc(L.d)}</span></div>`; }).join('');
  const lg = kit.lg.map(g => { const G = LGEMS[g.t]; return `<div class="twkrow"><small>Linh ngọc</small><b style="color:${G.c}">${G.n} cấp ${g.lv}</b><span>${esc(G.d(g.lv))}</span></div>`; }).join('');
  const all = kit.allN ? `<div class="twkrow"><small>Toàn thuộc tính</small><b>Sát thương, khí huyết, hộ giáp mỗi thứ +${TW_ALL * kit.allN}%</b><span>Đổi từ những lần không lấy gì, đã lấy ${kit.allN} lần</span></div>` : '';
  const Sx = skSlots(cls, kit.sk); if (TWKSEL !== 'basic' && !(TWKSEL >= 0 && TWKSEL <= 4)) TWKSEL = 0;
  const ks = TWKSEL === 'basic' ? basic[0] : Sx[TWKSEL] && C.skills.find(x => x.id === Sx[TWKSEL]);
  const skSec = `${H(`Chiêu · ${skRuleTxt(cls, kit.sk)}`)}${slotGrid(cls, kit.sk, kit.rn, 'twksel', TWKSEL)}<div class="slx"><button class="${TWKSEL === 'basic' ? 'on' : ''}" data-act="twksel" data-arg="basic">Cơ bản · ${basic[0].n}</button></div>
    ${ks ? skRow(ks, true) : `<p class="help-p sub">Ô ${TWKSEL + 1} (${slotName(TWKSEL)}) đang trống, lấy chiêu ở lựa chọn một trong ba để điền vào</p>`}`;
  return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">Đồ tháp · ${esc(C.n)}</h2><div class="twkit2" data-scroll="twkit">
    ${skSec}${sets ? H("Hiệu ứng bộ") + sets : ''}${H("Trang bị")}${eq}
    ${cu || lg || all ? H("Hồn thần binh · Linh ngọc") + cu + lg + all : ''}
    ${rest.length ? `<details class="wxinfo skfold"><summary>Chiêu chưa học · sẽ ra khi chọn một trong ba (${rest.length})</summary>${rest.map(k => skRow(k, false)).join('')}</details>` : ''}</div>`;
};
// 塔里用的是不熟的职业时：先看一眼它靠什么打、塔里会出哪几套（只说路子，不给配装）
const mechModal = () => () => { const cls = ctxCls(), M = CLS_MECH[cls], s = charStats(cls);
  return `<h2 class="mh">Công pháp bản môn · ${M[0]}</h2><div class="help-scroll"><p class="help-p">${M[1]}</p><p class="help-p">${sustText(cls, s)}</p></div><div class="sheet-act"><button class="btn ghost" data-act="close">Xong</button></div>`; };
const twClsModal = () => () => { const cls = SAVE.cls, C = CLASSES[cls], M = CLS_MECH[cls];
  const sets = twSets(cls).map(id => { const S = SETS.find(x => x.id === id); return S ? `<div class="twkrow"><small>Bộ</small><b class="r-set">${S.n}</b><span>${esc(twTheme(cls, id))}</span></div>` : ''; }).join('');
  return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">${esc(C.n)} · Cách đánh</h2><div class="twkit2" data-scroll="twcls"><p class="help-p">${esc(C.d)}</p>${M ? `<p class="help-p"><b>${M[0]}</b>: ${M[1]}</p>` : ''}
    <p class="help-p sub">Trong tháp sẽ ra mấy bộ này, mỗi bộ một lối. Gom đủ 4 món, 6 món cùng bộ còn có cộng hưởng:</p>${sets}<p class="help-p sub">Khi chọn một trong ba, chạm vào thẻ để xem toàn bộ hiệu ứng, sẽ thay ra món gì, và liên quan tới chiêu nào ngươi đang có.</p></div>`; };
const twHelpModal = () => () => `<h2 class="mh">Tháp Thông Thiên</h2><div class="help-scroll"><p class="help-p">Mỗi tầng một trận, đánh xong lên thẳng tầng trên, đỉnh tháp là tầng ${TW.top}. Tầng thường là một đàn yêu vật (từ tầng 3 có tinh anh), cứ 5 tầng là thủ lĩnh tinh anh kèm hai hộ pháp, cứ 10 tầng là chủ tháp. Yêu vật mỗi tầng mạnh hơn một chút, tăng dần từ từ.</p>
  <p class="help-p">Vào tháp ai cũng như nhau: cấp 50, một bộ đồ tháp bảo phẩm, hai chiêu, nền tu vi thống nhất; không mang trang bị, tu vi, ngọc, đồng hành, Dịch Sứ của mình. Mỗi tầng hồi đầy máu, không mang đan dược, nộ khí bí kỹ giữ qua từng tầng.</p>
  <p class="help-p">Cứ 3 tầng chọn một trong ba để mạnh lên (tầng 5, tầng 10 cũng có): lựa chọn thường là một món đồ tháp (bộ, thần binh; mặc vào thì giữ nguyên dòng và lỗ của ô đó, chỉ đổi hiệu ứng) hoặc một chiêu, một biến chiêu (tối đa năm chiêu, đủ rồi vẫn còn ra chiêu mới, chọn nó thì phải bỏ một chiêu); cứ 5 tầng lấy một hồn thần binh (tối đa ba, đủ rồi vẫn còn ra cái mới, chọn nó thì phải bỏ một cái); cứ 10 tầng lấy một linh ngọc (tối đa ba, đủ rồi thì chọn một viên để lên cấp, hoặc lấy một viên mới thay cho một viên trên người, viên mới giữ cấp của viên cũ). Không muốn món nào thì chọn «Không lấy», đổi lấy sát thương, khí huyết, hộ giáp mỗi thứ +${TW_ALL}%, cộng dồn mãi.</p>
  <p class="help-p">Cộng hưởng bộ: trong tháp gom đủ ${TW_RES[0][0]} món cùng một bộ thì sát thương +${TW_RES[0][1]}%, khí huyết +${TW_RES[0][2]}%; đủ ${TW_RES[1][0]} món thì thêm sát thương +${TW_RES[1][1]}%, khí huyết +${TW_RES[1][2]}%. Mặc lẫn lộn thì không có, muốn theo một bộ phải chọn tập trung suốt đường.</p>
  <p class="help-p">Mỗi lần hạ chủ tháp là lưu một lần. Ngã thì về tầng đã lưu, đồ tháp cũng về bộ lúc lưu. Muốn đổi lối thì có thể «Leo lại từ tầng 1»; lên đỉnh rồi cũng leo lại ngay được. Thưởng chủ tháp mỗi tuần chỉ nhận một lần, chỉ lấy mức cao nhất. Thứ Hai hằng tuần đổi tháp mới, leo lại từ tầng một; cùng tuần, cùng nghề thì yêu vật và lựa chọn ai cũng giống nhau.</p>
  <p class="help-p">Thưởng: mỗi chủ tháp hạ được, lần đầu trong tuần nhận hồn tinh, bạc và một viên ngọc, càng cao cho càng nhiều, leo tới đỉnh một tuần khoảng ${Math.round(Array.from({ length: TW.top / 10 }, (_, i) => twRewOf((i + 1) * 10).m).reduce((a, b) => a + b, 0) / 100) * 100} hồn tinh; từ tầng ${TW_REW.jyFrom}, mỗi nghề lần đầu hạ một chủ tháp còn được thêm một khoản hồn tinh. Kỷ lục cao nhất được giữ mãi.</p></div>`;
const goHelpModal = () => () => {
  const rift = featureOn('rift') && SAVE.mode === 'rift';
  return `<h2 class="mh">${rift ? "Ảo Cảnh Cửu U" : "Cốt truyện chính"}</h2>${rift ? `<p class="help-p">Thử thách tối đa tầng ${Math.max(1, SAVE.riftCap || 3)}. Giới hạn <b>một nén hương</b> (${Math.round(riftLimit(SAVE.riftLv) / 60000)} phút). Một ván bốn tầng bản đồ lớn, yêu vật đi thành bầy: đụng một bầy, các bầy bên cạnh bị cuốn vào cùng. Diệt yêu tích đầy tiến độ thì yêu vương giữ ải hiện thân; hạ nó trước khi hương tàn, hương còn càng nhiều thì linh ngọc càng được nâng nhiều lần, lần sau càng nhảy được nhiều tầng: còn trên một nửa +${RIFT_GRADES[0].jump} tầng, còn trên một phần tư +${RIFT_GRADES[1].jump} tầng, qua được là +${RIFT_GRADES[2].jump} tầng. Ngã xuống không tính thua: bạn bị ném về lối vào của tầng này, hương cháy mất một đoạn.</p>
    <p class="help-p">Trên bản đồ hương cháy theo thời gian thật; trong trận tính theo lượt (một vòng tính 3 giây), mở tốc độ mấy hay bỏ qua trận đều như nhau.</p>
    <p class="help-p">Thần binh, đồ Bộ rơi ra có tỉ lệ là Thượng Cổ (từ tầng 30, tầng càng cao càng dễ ra), từ tầng 90 còn có thể là Thái Cổ. Từ tầng ${RSET_LV} rơi đồ Bộ Ảo Cảnh, từ tầng ${RSET2_LV} rơi cả hai bộ. Yêu vương giữ ải để lại tinh phách, phẩm theo số tầng, Dịch Sứ bạn mang cũng mạnh lên theo.</p>
    <p class="help-p">Khi dẫn đồng hành, yêu vật cũng mạnh lên theo: tiểu yêu nhiều máu hơn, thủ lĩnh mang theo hộ pháp.</p>
    <p class="help-p">Từ tầng ${R_HI[0]} trở lên yêu vật mạnh lên nhanh hơn; từ các tầng ${R_SEG.slice(1).map(g => g[0]).join(", ")} mỗi mốc lại nhanh thêm một bậc, mỗi tầng tăng lần lượt gấp ${R_SEG.slice(1).map(g => +(g[1] / R_SEG[0][1]).toFixed(1)).join(", ")} lần lúc đầu; tinh anh từ tầng ${R_AFF_HI[0]} thêm một đặc tính, từ tầng ${R_AFF_HI[1]} thêm một nữa.</p>
    <p class="help-p">Yêu vương giữ ải: tầng càng cao ra tay càng nhanh; từ tầng ${R_BOSS_AFF.join(", ")} mỗi mốc thêm một đặc tính; từ tầng ${R_BOSS_DUO[0]} cứ ra tay ${R_BOSS_DUO[1]} lần thì liên động một lần. Đánh xuống bảy phần máu nó dựng lên hộ thể chân khí (chưa phá thì đánh nó chỉ còn một nửa), ba phần rưỡi máu thì bạo nộ, gọi trợ thủ. Một đòn của nó tối đa lấy ${CN[Math.round(R_BOSS_CAP * 10)]} phần khí huyết của bạn.</p>`
    : `<p class="help-p">Mỗi chương một bản đồ lớn: đi đường gặp quái, tìm chìa khóa, làm nhiệm vụ, cuối cùng đánh thủ lĩnh. Thủ lĩnh có manh mối và chìa khóa khắc chế riêng, tìm được chìa khóa rồi đánh sẽ nhẹ nhàng hơn nhiều. Ngã xuống thì đồ đã nhặt đều được giữ, bạn sẽ tỉnh lại bên đống lửa trại gần nhất.</p>`}
    ${featureOn('mods') ? `<h4 class="sub-h">Tăng độ khó</h4><div class="mods">${DUNGEON_MODS.map(M => `<button class="mod ${SAVE.mods.includes(M.id) ? 'on' : ''}" data-act="modt" data-arg="${M.id}"><b>${M.n}</b><span>${M.d}</span><small>${M.r}</small></button>`).join('')}</div>` : ''}
    <button class="btn ghost" data-act="close">Xong</button>`;
};

function bountyHTML() {
  if (!featureOn('bounty')) return '';
  ensureBounties();
  const Bn = SAVE.bounty, allDone = Bn.list.every(b => b.claimed);
  return `<section class="panel"><h3>Truy nã giang hồ <small>Làm mới mỗi ngày · xong thì nhận rương (chắc chắn từ Bảo phẩm trở lên)</small></h3>
    <div class="bounties">${Bn.list.map((b, i) => `<div class="bounty ${b.claimed ? 'done' : ''}"><div><b>${b.t}</b><div class="bar"><i style="width:${b.prog / b.need * 100}%"></i></div><small>${b.prog} / ${b.need}</small></div>
      ${b.claimed ? "<span class=\"sub\">Đã nhận</span>" : `<button class="btn sm" ${b.prog >= b.need ? '' : 'disabled'} data-act="bclaim" data-arg="${i}">Nhận</button>`}</div>`).join('')}</div>
    <div class="row" style="margin-top:10px;justify-content:space-between"><span class="sub">Xong cả ba thì nhận thêm một <b style="color:var(--gold2)">rương thưởng lớn</b> (chắc chắn có bộ hoặc thần binh)</span>
      ${Bn.bonus ? "<span class=\"sub\">Đã nhận</span>" : `<button class="btn sm" ${allDone ? '' : 'disabled'} data-act="bbonus">Nhận rương lớn</button>`}</div>
    <div class="row" style="margin-top:10px;justify-content:space-between"><span class="sub">Tiền thưởng tích được, ra quầy đổi đồ</span><button class="btn sm ghost" data-act="btyshop">Quầy tiền thưởng</button></div></section>`;
}
// 配装：三套，一键切换
const gemMissTxt = L => { const c = {}; for (const g of L) c[g] = (c[g] || 0) + 1; return Object.keys(c).map(g => gemName(g) + (c[g] > 1 ? ' ×' + c[g] : '')).join(", "); };
const kitGemSum = k => { if (!k || !k.gems) return ''; const c = {}; for (const p in k.gems) for (const g of k.gems[p]) c[gemT(g)] = (c[gemT(g)] || 0) + 1;   // 这套用了几颗什么玉：赤 3 黄 2 青 5
  return Object.keys(GEM_TYPES).filter(t => c[t]).map(t => `<i style="color:${GEM_TYPES[t].c}">${GEM_TYPES[t].n.slice(0, 1)}${c[t]}</i>`).join(''); };
const kitNamesOf = it => { const L = []; for (const c of CLASS_IDS) for (const k of (SAVE.chars[c].kits || [])) if (k && Object.values(k.eq).includes(it.id)) L.push(k.n); return L; };
function kitBar(cls) {
  const K = kitsOf(cls), ch = SAVE.chars[cls], busy = SAVE.run && SAVE.run.cls === cls;
  return `<section class="panel kitp"><h3>Phối đồ <small>Lưu cả một bộ: trang bị và ngọc khảm trên đó, Túi Càn Khôn, chiêu thức và biến chiêu, linh ngọc, Dịch Sứ, điểm Tâm pháp. Chạm một lần là thay cả bộ (Tâm pháp cộng lại miễn phí; ngọc bị lấy đi sẽ tự bù lại, miễn phí)</small></h3>
    <div class="kits">${K.map((k, i) => { const on = k && kitSame(cls, i);
      return `<div class="kit ${on ? 'on' : ''} ${k ? '' : 'empty'}">${k ? `<button class="kitb" ${busy || on ? 'disabled' : ''} data-act="kituse" data-arg="${i}"><b>${esc(k.n)}</b><small>${on ? "Đang mặc" : "Chạm để thay"}</small>${kitGemSum(k) ? `<span class="kgs">${kitGemSum(k)}</span>` : ''}</button>`
        : `<button class="kitb" data-act="kitedit" data-arg="${i}"><b>Ô trống</b><small>Lưu bộ đang mặc vào đây</small></button>`}
        ${k ? `<button class="mini" data-act="kitedit" data-arg="${i}">Lưu</button>` : ''}</div>`; }).join('')}</div>
    ${busy ? "<p class=\"sub\">Đang ở ngoài không thay được, về thành rồi thay.</p>" : ''}</section>`;
}
const kitModal = i => () => { const k = kitsOf(SAVE.cls)[i];
  return `<h2 class="mh">${k ? "Ghi đè" : "Lưu thành"} phối đồ ${i + 1}</h2><p class="help-p">Lưu bộ đang mặc của ${CLASSES[SAVE.cls].n} vào đây: trang bị ở từng ô và ngọc khảm, Túi Càn Khôn, chiêu thức mang theo và biến chiêu, Hộp Linh Ngọc, Dịch Sứ, điểm Tâm pháp. Ngọc của mỗi bộ ghi riêng: khi đổi sang bộ này, ngọc bị bộ khác lấy đi sẽ tự bù lại từ túi ngọc và túi đồ (miễn phí). ${k ? `Sẽ ghi đè lên “${esc(k.n)}” cũ.` : ''}</p>
    <label class="kitn">Tên <input id="kitn" maxlength="12" value="${esc(k ? k.n : `Phối đồ ${i + 1}`)}"></label>
    <div class="row" style="gap:8px;margin-top:10px"><button class="btn" data-act="kitsave" data-arg="${i}">Lưu</button>${k ? `<button class="btn ghost" data-act="kitdel" data-arg="${i}">Xóa bộ này</button>` : ''}<button class="btn ghost" data-act="close">Hủy</button></div>`; };
// 人物页（2026-11 一屏）：上面四个小页签。「身上」是配装、关键属性、装备格；点哪一格就跳到储物箱里只看这一类
let GVIEW = 'body';
function kitRow(cls) {
  const K = kitsOf(cls), busy = SAVE.run && SAVE.run.cls === cls;
  return `<div class="kitrow"><span class="sub">Phối đồ</span>${K.map((k, i) => { const on = k && kitSame(cls, i);
    return k ? `<div class="kp ${on ? 'on' : ''}"><button class="kpb" ${busy || on ? 'disabled' : ''} data-act="kituse" data-arg="${i}">${esc(k.n)}${kitGemSum(k) ? `<span class="kgs">${kitGemSum(k)}</span>` : ''}</button><button class="kpe" data-act="kitedit" data-arg="${i}" aria-label="Lưu">Lưu</button></div>`
      : `<div class="kp empty"><button class="kpb" data-act="kitedit" data-arg="${i}">＋ Lưu bộ này</button></div>`; }).join('')}</div>`;
}
// 人物页的属性框：先放常用的十二项，再放身上有的特殊属性；框有多高放多少行，放不下的点「全部属性」看
const KS_EXTRA = [['healPct', "Trị liệu"], ['regen', "Hồi máu"], ['regenPct', "Hồi máu"], ['thornK', "Bội số phản chấn"], ['thornDmg', "Sát thương phản chấn"], ['xDr', "Giảm ST"], ['xBoss', "ST thủ lĩnh"], ['xExec', "Trảm sát"], ['xDouble', "Liên trảm"], ['xFirst', "Tiên thủ"],
  ['xBreak', "Phá thế"], ['xRage', "Nộ khí"], ['xTen', "Thanh thần"], ['xLast', "Bất khuất"], ['xHaste', "Tật hành"], ['xKill', "Tham lang"], ['cdSkip', "Miễn hồi chiêu"], ['xCritNext', "Hội tâm"], ['xShield', "Bàn thạch"],
  ['allyPct', "Đồng hành"], ['freeze', "Bất động"], ['poison', "Kèm độc"], ['skd', "Chiêu riêng"], ['minion', "Số cương thi"], ['minionPct', "Cương thi"], ['gf', "Bạc"], ['xLuck', "Tỉ lệ thần binh"]];
function keyStats(cls) {
  const ch = SAVE.chars[cls], s = charStats(cls);
  const L = [["Khí huyết", hpTxt(s.maxHp, ch.level)], ["Công", fmtBig(s.atk)], ["Hộ giáp", fmtBig(s.armorT)], ["Kháng toàn bộ", s.res + '%'], ["Bạo kích", s.crit + '%'], ["Sát thương", '+' + s.dmgPct + '%']];
  // 屏幕高、底下还空着的时候多放几行（fitKstats 量着空出来的地方一行一行放）；只列不是 0 的
  const dg = Math.round((s.dodge + (cls === 'assassin' ? SUST.assassin.a * sustLv(ch.level) : 0)) * 10) / 10;
  const X = [["ST bạo kích", s.critDmg + '%', 1], ["Tốc độ", s.speed, 1], ["Hút máu", s.leech + '%', s.leech], ["Thuật pháp", '+' + s.elem + '%', s.elem], ["Né tránh", dg + '%', dg], ["Phúc duyên", '+' + s.mf + '%', s.mf],
    ["Hồi máu", fmtBig(hpShow(s.regen || 0, ch.level)), s.regen], ["Giảm ST", (s.xDr || 0) + '%', s.xDr], ["Phản chấn", '+' + (s.thornDmg || 0) + '%', s.thornDmg], ["Đồng hành", '+' + (s.allyPct || 0) + '%', s.allyPct],
    ["Bạc", '+' + (s.gf || 0) + '%', s.gf], ["Trị liệu", '+' + (s.healPct || 0) + '%', s.healPct]].filter(x => x[2]);
  // 身上的套装几件、生效中的神兵特效（只写名字，详情在「全部属性」）
  const sets = SETS.filter(S => S.cls === cls && (s.setCount[S.id] || 0) >= 2).map(S => `<i class="r-set">${esc(S.n)} ${s.setCount[S.id]}/${S.pieces.length}</i>`);
  const fx = [...s.fx].map(f => { const Lg = LEGENDS.find(l => l.fx === f); return Lg ? `<i class="r-legend">${esc(Lg.n)}</i>` : ''; }).filter(Boolean);
  const chips = [...sets, ...fx];
  return `<button class="kstats" data-act="statall">${L.map(([n, v]) => `<div class="ksi"><span>${n}</span><b>${v}</b></div>`).join('')}${X.map(([n, v]) => `<div class="ksi x"><span>${n}</span><b>${v}</b></div>`).join('')}${chips.length ? `<p class="ksfx">${chips.join('')}</p>` : ''}<em>Tất cả chỉ số ›</em></button>`;
}
addEventListener('resize', () => fitKstats()); try { document.fonts && document.fonts.ready.then(() => fitKstats()); } catch (e) {}
// 属性框只放整行：放不下的那几行藏起来（不出现半行）
function fitKstats() {
  const k = document.querySelector('.gfit .kstats'); if (!k) return; const it = [...k.querySelectorAll(':scope > .ksi:not(.x)')], fx = k.querySelector(':scope > .ksfx'), xs = [...k.querySelectorAll(':scope > .ksi.x')];
  xs.forEach(d => d.classList.remove('show'));
  it.forEach(d => { d.style.display = ''; }); if (fx) { fx.style.display = ''; fx.style.maxHeight = ''; }
  fitKbase(k, it, fx);
  // 底下还空着（屏幕高的手机）：多出来的属性一行一行放进来，放到不够一行为止
  const g = k.closest('.gfit'), bar = g && g.querySelector(':scope > .gbar'); if (!bar || !xs.length || !it.length) return;
  const cs2 = getComputedStyle(k), cols = Math.max(1, cs2.gridTemplateColumns.split(' ').filter(Boolean).length), rowH = it[0].getBoundingClientRect().height + (parseFloat(cs2.rowGap) || 0);
  // 能用的地方 = 底下空着的 + 装备格比「每格 100 高」多出来的（装备格会自己让出来）
  const doll = g.querySelector(':scope > .gdoll'), dr = doll ? Math.ceil(doll.children.length / 4) : 0, dollMin = dr * 100 + Math.max(0, dr - 1) * 5;
  let free = g.getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom - 4 + (doll ? Math.max(0, doll.getBoundingClientRect().height - dollMin) : 0);
  for (let i = 0; i < xs.length && rowH > 0 && free >= rowH; i += cols) { xs.slice(i, i + cols).forEach(d => d.classList.add('show')); free -= rowH; }
}
function fitKbase(k, it, fx) {
  const cs = getComputedStyle(k), bot = k.getBoundingClientRect().bottom - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth);
  let cut = it.findIndex(d => d.getBoundingClientRect().bottom > bot + 0.5);
  if (cut >= 0) { cut -= cut % 3; it.slice(Math.max(3, cut)).forEach(d => { d.style.display = 'none'; }); if (fx) fx.style.display = 'none'; return; }
  if (fx) { const top = fx.getBoundingClientRect().top, ch = 22, n = Math.floor((bot - top) / ch);   // 特效小标签：放得下几行就留几行
    if (n < 1) fx.style.display = 'none'; else if (fx.scrollHeight > n * ch + 1) fx.style.maxHeight = n * ch + 'px'; }
}
const statAllModal = cls => () => `<h2 class="mh">${CLASSES[cls].n} · Toàn bộ thuộc tính</h2><div class="statbox" data-scroll="statbox">${statPage(cls)}</div><div class="row" style="justify-content:center;margin-top:8px"><button class="btn ghost" data-act="close">Được rồi</button></div>`;
function statFull(cls) {
  const s = charStats(cls);
  const fxList = [...s.fx].map(f => { const L = LEGENDS.find(l => l.fx === f); if (L) return `<li><b class="r-legend">${L.n}</b>: ${L.d}</li>`;
    const S = SETS.find(x => x.b4 === f); if (S) return `<li><b class="r-set">${S.n} 4 món</b>: ${S.b4d}</li>`;
    const S6 = SETS.find(x => x.b6 === f); if (S6) return `<li><b class="r-set">${S6.n} 6 món</b>: ${S6.b6d}</li>`;
    for (const Bq of talentBranches(cls)) { const T = Bq.t.find(t => t.fx === f); if (T) return `<li><b style="color:var(--gold2)">Tâm pháp · ${T.n}</b>: ${T.d}</li>`; } return ''; }).join('');
  const sets = SETS.filter(S => S.cls === cls && (!S.rift || featureOn('rift')) && (s.setCount[S.id] || 0) > 0);
  return `${statBlock(cls)}${sets.length ? `<h4 class="sub-h">Bộ đang mặc</h4><ul class="setlist">${sets.map(S => { const n = s.setCount[S.id] || 0;
      return `<li><b>${S.n}</b> (${n}/${S.pieces.length})<div class="${n >= 2 ? 'on' : 'off'}">2 món: ${S.b2d}</div><div class="${n >= 4 ? 'on' : 'off'}">4 món: ${S.b4d}</div>${S.b6d ? `<div class="${n >= 6 ? 'on' : 'off'}">6 món: ${S.b6d}</div>` : ''}</li>`; }).join('')}</ul>` : ''}
    ${fxList ? `<h4 class="sub-h">Hiệu ứng đang có</h4><ul class="setlist fxlist">${fxList}</ul>` : ''}`;
}
// 人物页（2026-11-26 减法改版）：一屏——6 项要紧的属性（其余点「全部属性」）、装备格、灵玉和乾坤袋两格、一键换装、配装。背包搬到单独的页签
function gearTab() {
  const cls = SAVE.cls, eq = SAVE.chars[cls].eq, D = deltaMap(cls), up = {};
  for (const it of SAVE.stash) { const d = D.get(it.id); if (!(d > 0)) continue; const ps = posFor(cls, it, gpos(it)); if (d > (up[ps] || 0)) up[ps] = d; }
  const nUp = Object.keys(up).length;
  let doll = SLOTS.filter(sl => slotOpen(sl.id)).map(sl => { const it = eq[sl.id];
    return `<button class="gsb ${it ? 'b-' + it.rarity + ' ' + ancCls(it) : 'empty'}" data-act="gsl" data-arg="${sl.id}"><span class="gi">${it ? SPR.item(it, 34) : `<i>${sl.s}</i>`}</span><span class="gn">${sl.n}${it && it.plus ? ` +${it.plus}` : ''}</span>${up[sl.id] ? `<em>+${up[sl.id]}</em>` : ''}</button>`; }).join('');
  if (featureOn('rift')) doll += SLOTS.filter(sl => sl.rift && !slotOpen(sl.id)).map(sl => `<div class="gsb locked"><span class="gi"><i>Khóa</i></span><span class="gn">${sl.n}</span><small>Ảo Cảnh tầng ${sl.rift}</small></div>`).join('');
  if (boxOpen()) { const nb = boxOf(cls).filter(Boolean).length;
    doll += `<button class="gsb box ${nb ? 'b-legend' : 'empty'}" data-act="boxopen"><span class="gi">${SPR.img('gem', 30, { G: '#ffb02a' }, nb ? 'glow' : '')}</span><span class="gn">Linh ngọc ${nb}/${BOX_SLOTS}</span></button>`; }
  if (featureOn('cube')) { const nc = (SAVE.chars[cls].cube || []).filter(Boolean).length;
    doll += `<button class="gsb box ${nc ? 'b-legend' : 'empty'}" data-act="cubeopen"><span class="gi">${SPR.img('bag', 30)}</span><span class="gn">Càn Khôn ${nc}/3</span></button>`; }
  return `<section class="panel gearp2"><div class="gfit">${keyStats(cls)}<div class="gdoll">${doll}</div>
      <div class="gbar"><span class="sub">${nUp ? `<b class="upn">${nUp}</b> ô nên thay` : "Đã là bộ tốt nhất hiện có"}</span><span class="gbar-b"><button class="btn sm ghost" data-act="kits">Phối đồ</button><button class="btn sm ${nUp ? '' : 'ghost'}" ${nUp ? '' : 'disabled'} data-act="best">Mặc đồ mạnh nhất</button></span></div></div></section>`;
}
const boxModal = () => `${boxBody(SAVE.cls)}<div class="row" style="justify-content:center;margin-top:8px"><button class="btn ghost" data-act="close">Được rồi</button></div>`;
const cubeBagModal = () => `<h2 class="mh">Túi Càn Khôn</h2>${cubeBody(SAVE.cls)}<div class="row" style="justify-content:center;margin-top:8px"><button class="btn ghost" data-act="close">Được rồi</button></div>`;
const kitsModal = () => `<h2 class="mh">Phối đồ</h2><p class="help-p">Lưu bộ đang mặc thành một bộ: trang bị, Túi Càn Khôn, chiêu thức và biến chiêu, linh ngọc, Dịch Sứ, điểm tâm pháp. Sau này bấm một cái là thay cả bộ. Cường hóa và lỗ ghi trên vị trí, thay bộ nào cũng còn; mỗi bộ khảm ngọc gì thì ghi riêng.</p>${kitRow(SAVE.cls)}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-act="close">Được rồi</button></div>`;
// 背包页：装备、玉石。五个门派共用这一个背包
let BAGV = 'eq';
function bagTab() {
  const cls = SAVE.cls, subs = [['eq', `Trang bị ${SAVE.stash.length}`], ...(featureOn('gems') ? [['gems', "Ngọc"]] : [])];
  if (!subs.some(x => x[0] === BAGV)) BAGV = 'eq';
  const bar = subs.length > 1 ? `<div class="gsubs gtop" style="--n:${subs.length}">${subs.map(([k, n]) => `<button class="${BAGV === k ? 'on' : ''}" data-act="bagv" data-arg="${k}">${n}</button>`).join('')}</div>` : '';
  const body = BAGV === 'gems' ? `${Object.keys(SAVE.gems).length && featureOn('sockets') ? "<button class=\"btn gemfit\" data-act=\"gemfit\">Khảm ngọc tốt nhất<small>Mỗi lỗ trên người đổi sang viên hợp nhất trong túi ngọc · miễn phí</small></button>" : ''}${gemsBody()}` : stashBody(cls, deltaMap(cls));
  const back = BAGV === 'eq' && GSLOT ? `<button class="chip gback" data-act="bagall">‹ Tất cả trang bị</button>` : '';
  return `<section class="panel gearp2 bagp">${bar}<div class="gscroll gbody" data-scroll="bag-${BAGV}">${back}${body}</div></section>`;
}
// 本职续航那一段（带当前数值）：「人物」页和「武学」页的本门功法卡共用
// 本职续航一行版（2026-11-25 精简）：页面上只放这一行，整段说明进「?」
const SUST_S = { berserker: "Chịu đòn -{dr}% · hút máu có hiệu lực đủ", mage: "Mỗi tầng “Liên” thêm {a}% hộ thể (tối đa {cap}%)", necro: "Chịu đòn -{dr}% · {a}% do cương thi chịu thay · cương thi ngã thì hồi {b}% máu",
  assassin: "Chịu đòn -{dr}% · né +{a}% · né được hồi {b}% máu · hạ địch hồi {c}%", paladin: "Chịu đòn -{dr}% · phản chấn hồi {a}% máu · mỗi lượt hồi {b}%" };
function sustShort(cls, s) { const ch = SAVE.chars[cls], SU = SUST[cls], lvF = sustLv(ch.level);
  const suV = k => k === 'dr' || k === 'cap' ? SU[k] : Math.round(Math.min(k === 'a' && cls === 'necro' ? 60 : 999, SU[k] * ((cls === 'assassin' && k === 'a') ? 1 : 1 + s.sust / 100) * lvF) * 10) / 10;
  return `<b>Hồi phục · ${SU.n}</b>: ${SUST_S[cls].replace(/\{(\w+)\}/g, (m, k) => suV(k))}`; }
function sustText(cls, s) {
  const ch = SAVE.chars[cls], SU = SUST[cls], lvF = sustLv(ch.level);
  const suV = k => k === 'dr' || k === 'cap' ? SU[k] : Math.round(Math.min(k === 'a' && cls === 'necro' ? 60 : 999, SU[k] * ((cls === 'assassin' && k === 'a') ? 1 : 1 + s.sust / 100) * lvF) * 10) / 10;
  const desc = SU.d.replace(/\{(\w+)\}/g, (m, k) => suV(k));
  return `<b>Hồi phục bản môn · ${SU.n}</b>: ${desc}. ${cls === 'berserker' ? '' : `<br>“Hút máu” của môn phái khác trên người bạn chỉ còn ba phần; mỗi 1% hút máu còn được quy thành 4% sức hồi phục${s.sust ? ` (hiện +${s.sust}%)` : ''}.`}`;
}
// 本门功法：不占格子、一直生效的两样——门派机制和本职续航。以前只散在职业介绍和「人物」页的小字里
const CLS_MECH_S = { berserker: "Ra đòn, chịu đòn đều tích Nộ ý, quá nửa thì sát thương +15%, càng ít máu càng đau", mage: "Đổi sang một hành khác để ra chiêu thì cộng một tầng “Liên”, mỗi tầng sát thương +8%, tối đa 5 tầng",
  necro: "Vào trận cương thi đã xếp trận, ăn chỉ số và tăng sát thương của ngươi; cương thi ra tay vài lần là hóa đất, phải rung chuông gọi lại", assassin: "Ám khí tích Sát ý, chiêu kết liễu tiêu sạch một lần; vào trận ra tay trước", paladin: "Chịu đòn chắc chắn phản chấn, đủ 10 tầng “Chấn” thì tung Kim Cương Chấn đánh cả sân" };
const CLS_MECH = {
  berserker: ["Nộ ý", "Ra đòn tích 5 điểm, trúng một đòn tích 8 điểm, tối đa 100 điểm. Nộ ý quá nửa: sát thương +15%. Khí huyết mỗi thiếu một phần mười: sát thương thêm +3%. Bá Vương Giải Giáp đổi hết Nộ ý thành sát thương (mỗi điểm +2%)."],
  mage: ["Ngũ hành lưu chuyển", "Mỗi lần đổi sang một hành khác để ra chiêu, chồng một tầng “Liên” (tối đa 5 tầng), mỗi tầng sát thương +8%, không cần theo thứ tự; cùng một hành ra liên tiếp thì không tăng cũng không mất. Mỗi chiêu thuộc hành nào được ghi cạnh tên chiêu; đòn thường Linh Phù là Mộc."],
  necro: ["Thi trận", "Vào trận cương thi đã xếp sẵn theo Thi trận (thi vị cơ bản 3), công và khí huyết của chúng tính theo chỉ số của bạn; trong Ảo Cảnh và Tháp Thông Thiên, mọi chỉ số tăng sát thương chung trên người bạn chúng cũng hưởng (sát thương, tỉ lệ chí mạng, ST chí mạng, thủ lĩnh và tinh anh, trảm sát, phá thế, Cửu U, Thực Cốt Ngọc; ST thuật pháp chỉ cộng cho Độc Thi, Âm Hỏa Thi), còn những thứ chỉ có khi chính bạn ra tay thì không tính (liên trảm, hội tâm, sát thương một chiêu…). Kẻ địch bị Trấn Hồn Đinh đóng trúng sẽ bị cương thi ưu tiên cắn. Mỗi cương thi chỉ ra tay được một số lần (Khiêu Thi 5, Thiết Giáp Thi 8, Độc Thi 6, Âm Hỏa Thi 4, lúc vào trận lệch nhau một hai lần), dùng hết thì hóa thành đất; ngã hay hóa đất đều dùng Rung Chuông Gọi Xác gọi lại, Dưỡng Thi Phù nối thêm 2 lần. Thi Vương không tính."],
  assassin: ["Sát ý", "Tiêu Tẩm Độc, Băng Phách Châm và các chiêu như vậy khi ra đòn sẽ tích Sát ý (tối đa 5 điểm), đòn kết liễu tiêu sạch một lần: Đoạt Mệnh Ấn mỗi điểm sát thương +25%, Ảnh Sát mỗi điểm đâm thêm một nhát. Vào trận bạn ra tay trước."],
  paladin: ["Phản chấn · Kim Cương Chấn", "Bị đánh chắc chắn phản chấn: sát thương Phật quang = công kích × bội số phản chấn (sẵn có 30%, đồ và bộ La Hán cộng thêm). Mỗi lần phản chấn tích một tầng «Chấn», đủ 10 tầng tự tung «Kim Cương Chấn», Phật quang đánh mọi kẻ địch. Bị đánh phản chấn còn hồi chút khí huyết."],
};
// 招式现在算哪一行：道士有的变招会改五行
const effWx = (cls, k) => featureOn('runes') ? runeWx(k, (SAVE.chars[cls].runes || {})[k.id]) : k.wx;
const wxBadge = (k, cls) => { const w = cls ? effWx(cls, k) : k.wx; return w && WX[w] ? `<i class="wxb" style="--c:${WX[w].c}">${WX[w].n}</i>` : ''; };
// 流派推荐：通关后每个门派两条路。照着配什么招、什么变招、什么套装神兵灵玉，缺的写明去哪刷
// 散件流现在的状态：穿了几件神兵、有没有套装效果挡着、合计多少
function sanState(cls) {
  const eq = SAVE.chars[cls].eq, s = charStats(cls), n = POS_IDS.filter(p => eq[p] && eq[p].legend).length, C = CLASSES[cls];
  if (Object.keys(s.setCount).some(id => s.setCount[id] >= 2)) return `${C.n} đang có hiệu ứng Bộ, hiện <b class="lo">không có tác dụng</b>.`;
  if (!s.sanN) return `${C.n} đang mặc ${n} món thần binh, trên người và trong Túi Càn Khôn đều chưa có Vô Tướng Hoàn hay Vô Danh Giới.`;
  return `${C.n} đang mặc ${n} món thần binh: sát thương <b>+${Math.round(s.sanN * SAN_DMG * 100)}%</b>, sát thương phải nhận <b>-${Math.round(Math.min(SAN_DR_CAP, s.sanN * SAN_DR) * 1000) / 10}%</b>.`;
}
function sanModal(cls) {
  const owned = new Set(allItems().map(it => it.legend).filter(Boolean)), R = ['wuxiang', 'wuming'].map(id => LEGENDS.find(l => l.id === id));
  return `<h2 class="mh">Đồ lẻ (không mặc Bộ)</h2>
    <p class="help-p">Không mặc món Bộ nào, toàn thân đổi sang thần binh. Sống nhờ một cặp nhẫn: mỗi món thần binh đang mặc, mỗi chiếc nhẫn cho sát thương +${Math.round(SAN_DMG * 100)}%, sát thương phải nhận -${SAN_DR * 100}%. Mười món thần binh, hai chiếc nhẫn = sát thương +${Math.round(SAN_DMG * 2000)}%, sát thương phải nhận -${SAN_DR * 2000}%. Yếu hơn Bộ 6 món một chút, được cái không kén đồ.</p>
    ${R.map(X => `<div class="bc-line"><i class="${owned.has(X.id) || SAVE.cube[X.id] ? 'bc-ok' : 'bc-no'}">${owned.has(X.id) || SAVE.cube[X.id] ? '✓' : '✗'}</i><b class="r-legend">${X.n}</b><small>Nhẫn · ${owned.has(X.id) || SAVE.cube[X.id] ? "đã có" : "qua ải rồi thì đâu cũng rơi"}</small><p>${X.d}</p></div>`).join('')}
    <p class="san-st">${sanState(cls)}</p><div class="row" style="justify-content:center"><button class="btn" data-act="close">Hiểu rồi</button></div>`;
}
// 流派推荐里点某一件：弹出效果和哪里掉（卡片上只留 ✓✗ 清单）
function bcInfoModal(cls, arg) {
  const [t, id, rn] = String(arg).split(':'), C = CLASSES[cls], ch = SAVE.chars[cls], owned = new Set(allItems().map(it => it.legend).filter(Boolean));
  let h = '', d = '', src = '';
  if (t === 'K') { const k = C.skills.find(x => x.id === id), R = RUNES[id] && rn ? RUNES[id][rn === 'a' ? 0 : 1] : null;
    h = k.n + (R ? ' · ' + R.n : ''); d = k.d + (R ? `<br><b>Biến chiêu «${R.n}»</b>: ${R.d}` : ''); src = k.lv > ch.level ? `Học ở cấp ${k.lv}` : "Đã học"; }
  else if (t === 'S') { const S = SETS.find(x => x.id === id), n = charStats(cls).setCount[id] || 0;
    h = S.n; d = [['2', S.b2d], ['4', S.b4d], ['6', S.b6d]].filter(x => x[1]).map(x => `<b>${x[0]} món</b>: ${x[1]}`).join('<br>'); src = `Đã mặc ${n}/6 · rơi từ Ảo Cảnh tầng ${S.rlv || RSET_LV}`; }
  else if (t === 'G') { const G = LGEMS[id], g = SAVE.lgems.find(x => x.t === id), inb = !!g && (ch.lgs || []).includes(g.id);
    h = G.n; d = G.d(g ? g.lv : 1); src = g ? (inb ? `Đã gắn · cấp ${g.lv}` : "đã có, chưa đặt") : "yêu vương Ảo Cảnh rơi"; }
  else { const X = LEGENDS.find(l => l.id === id); if (!X) return '';
    h = X.n; d = X.d;
    if (t === 'W') src = owned.has(id) ? "đã có" : `Binh phách ${SAVE.bp || 0}/${WPN_COST}, gom đủ thì tìm Trương Đại Chùy đúc`;
    else if (t === 'C') { const has = !!SAVE.cube[id], inb = (ch.cube || []).includes(id); src = has ? (inb ? "Đã cho vào Túi Càn Khôn" : "Đã thu, chưa cho vào Túi Càn Khôn") : `rơi từ chương ${CN[X.ch || 1]}`; }
    else { const open = slotOpen(X.slot); src = `${SLOT_NAME[X.slot]} · ${owned.has(id) ? "đã có" : open ? "rơi trong Ảo Cảnh" : `Ảo Cảnh tầng ${SLOTS.find(z => z.id === X.slot).rift} mở ${SLOT_NAME[X.slot]} rồi mới rơi`}`; } }
  return `<h2 class="mh">${h}</h2><p class="help-p">${d}</p><p class="bc-src">${src}</p><div class="row" style="justify-content:center"><button class="btn" data-act="close">Hiểu rồi</button></div>`;
}
function buildCard(cls) {
  const L = BUILDS[cls]; if (!L || !featureOn('rift')) return '';
  const ch = SAVE.chars[cls], s = charStats(cls), C = CLASSES[cls], load = syncLoadout(cls);
  let bi = ch.bld; if (bi == null) bi = (s.setCount[L[1].set] || 0) > (s.setCount[L[0].set] || 0) ? 1 : 0;
  const B = L[bi], S = SETS.find(x => x.id === B.set), owned = new Set(allItems().map(it => it.legend).filter(Boolean));
  const ok = v => v ? '<i class="bc-ok">✓</i>' : '<i class="bc-no">✗</i>';
  const chip = (on, arg, txt) => `<span class="bc-bit ${on ? 'on' : ''}" data-act="bcinfo" data-arg="${arg}">${ok(on)}${txt}</span>`;
  const skRow = B.sk.map(([id, rn]) => { const k = C.skills.find(x => x.id === id), R = RUNES[id] && rn ? RUNES[id][rn === 'a' ? 0 : 1] : null, on = load.includes(id) && (!R || !featureOn('runes') || ch.runes[id] === rn);
    return chip(on, `K:${id}:${rn || ''}`, `${k.n}${R ? '·' + R.n : ''}${k.lv > ch.level ? `<small>cấp ${k.lv}</small>` : ''}`); }).join('');
  const nSet = s.setCount[S.id] || 0;
  const legRow = B.leg.map(lid => chip(owned.has(lid), 'L:' + lid, LEGENDS.find(l => l.id === lid).n)).join('');
  const WX0 = LEGENDS.find(l => l.w && l.set === B.set);
  const cubeRow = B.cube.map(lid => chip((ch.cube || []).includes(lid), 'C:' + lid, LEGENDS.find(l => l.id === lid).n)).join('');
  const gemRow = B.gems.map(t => { const g = SAVE.lgems.find(x => x.t === t); return chip(!!g && (ch.lgs || []).includes(g.id), 'G:' + t, LGEMS[t].n); }).join('');
  const sec = (h, row) => `<div class="bc-sec"><span class="bc-h">${h}</span><div class="bc-bits">${row}</div></div>`;
  const nMiss = (skRow + legRow + cubeRow + gemRow).split('bc-no').length - 1 + (nSet >= 6 ? 0 : 1) + (WX0 && !owned.has(WX0.id) ? 1 : 0);
  // 2026-11-24 默认收起，点标题展开（展开状态记住，换套装、配完都不会自己合上）
  return `<details class="bcard" ${window.BCOPEN ? 'open' : ''} ontoggle="window.BCOPEN=this.open"><summary class="sub-h">Gợi ý lối chơi <small>${S.n} · Bộ ${nSet}/6${nMiss ? ` · còn thiếu ${nMiss} món` : " · đủ rồi"}</small></summary>
    <div class="seg sm">${L.map((X, i) => `<button class="${i === bi ? 'on' : ''}" data-act="bldpick" data-arg="${i}">${SETS.find(z => z.id === X.set).n}</button>`).join('')}</div>
    <p class="help-p">${B.d}</p>
    ${sec("Chiêu", skRow)}${sec("Bộ", chip(nSet >= 6, 'S:' + S.id, `${S.n}<small>${nSet}/6</small>`))}${WX0 ? sec("Binh khí", chip(owned.has(WX0.id), 'W:' + WX0.id, WX0.n)) : ''}${sec("Thần binh", legRow)}${featureOn('cube') ? sec("Túi Càn Khôn", cubeRow) : ''}${sec("Linh ngọc", gemRow)}
    <button class="btn" style="width:100%;margin-top:8px" data-act="bldapply" data-arg="${bi}">Phối theo một chạm</button>
    <div class="bc-san">Đồ lẻ (không mặc Bộ)<button class="qhelp sm" data-act="sanhelp" aria-label="Giải thích">?</button></div></details>`;
}
function mechCard(cls) {
  const M = CLS_MECH[cls], s = charStats(cls);
  let extra = '';
  if (cls === 'mage') {   // 道士：现在带的招式凑不凑得齐一圈五行
    const { act, basic } = skillList(cls), have = new Set([...act, basic].map(k => effWx(cls, k))), miss = WX_IDS.filter(w => !have.has(w));
    extra = `<p class="help-p wxrow">Ngũ hành ngươi đang mang: ${WX_IDS.map(w => `<i class="wxb ${have.has(w) ? '' : 'off'}" style="--c:${WX[w].c}">${WX[w].n}</i>`).join(' ')}</p>`;
  }
  return `<div class="mech mech2"><div class="mh2"><b>Công pháp bản môn · ${M[0]}</b><button class="qhelp sm" data-act="mechhelp" aria-label="Giải thích">?</button></div>
    <p class="help-p">${CLS_MECH_S[cls]}</p><p class="help-p">${sustShort(cls, s)}</p></div>${extra}`;
}
// 现在身上哪些东西在加强这一招：套装、神兵（穿着的和乾坤袋里启用的）、点过的心法——说明里点了这招名字的都列出来
function skillBoosts(cls, k) {
  const ch = SAVE.chars[cls], s = charStats(cls), out = [], hit = d => d && d.includes(k.n);
  for (const S of SETS) { if (S.cls !== cls) continue; const n = s.setCount[S.id] || 0;
    if (n >= 2 && hit(S.b2d)) out.push([`${S.n} 2 món`, S.b2d, 'set']); if (n >= 4 && hit(S.b4d)) out.push([`${S.n} 4 món`, S.b4d, 'set']); if (n >= 6 && S.b6 && hit(S.b6d)) out.push([`${S.n} 6 món`, S.b6d, 'set']); }
  const lids = new Set(); for (const sl in ch.eq) if (ch.eq[sl] && ch.eq[sl].legend) lids.add(ch.eq[sl].legend); for (const lid of ch.cube || []) if (lid && SAVE.cube[lid]) lids.add(lid);
  for (const lid of lids) { const L = LEGENDS.find(l => l.id === lid); if (L && hit(L.d)) out.push([L.n, L.d, 'legend']); }
  for (const Bq of talentBranches(cls)) for (const T of Bq.t) { const r = ch.tal[Bq.id + '.' + T.id] || 0; if (r && T.fx && hit(T.d)) out.push([`Tâm pháp·${T.n}`, T.d, 'tal']); }
  return out.length ? `<details class="skboost"><summary>Được tăng cường bởi: ${out.map(([n, d, c]) => `<b class="${c === 'set' ? 'r-set' : c === 'legend' ? 'r-legend' : 'tl'}">${n}</b>`).join(", ")}</summary>${out.map(([n, d, c]) => `<div><b class="${c === 'set' ? 'r-set' : c === 'legend' ? 'r-legend' : 'tl'}">${n}</b>${d}</div>`).join('')}</details>` : '';
}
// 人物属性：一排数值 + 本职续航。城镇「人物」「修炼」和游戏里的「人物」弹窗共用
function statBlock(cls) {
  const ch = SAVE.chars[cls], s = SAVE.run && SAVE.run.cls === cls && (VIEW === 'world' || VIEW === 'battle' || VIEW === 'map') ? runStats(SAVE.run) : charStats(cls);   // 出门在外：把吃的、带的加成也算上
  const raw = (v, r) => v + '%' + (r > 75 ? `<small class="rawv">gốc ${r}</small>` : '');
  const stats = [["Khí huyết", hpTxt(s.maxHp, ch.level)], ["Công", s.atk], ["Hộ giáp", s.armorT], ["Kháng toàn bộ", raw(s.res, s.resRaw)], ["Tỉ lệ chí mạng", raw(s.crit, s.critRaw)], ["ST chí mạng", s.critDmg + '%'],
    ["Tốc độ", s.speed], ["Sát thương", '+' + s.dmgPct + '%'], ["ST thuật pháp", '+' + s.elem + '%'], ["Hút máu", s.leech + '%'], ["Né tránh", Math.round((s.dodge + (cls === 'assassin' ? SUST.assassin.a * sustLv(ch.level) : 0)) * 10) / 10 + '%'], ["Phúc duyên", '+' + s.mf + '%']];
  const mfTxt = `Phúc duyên +${s.mf}%: tỉ lệ rơi ×${mfK(s.mf).toFixed(2)} · thượng cổ ×${mfAnc(s.mf).toFixed(2)}${s.mf > MF_CAP ? ` (tối đa +${MF_CAP}%)` : ''}`;
  const R = armorRef(), red = armorRed(s.armorT, R.lv);
  const defTxt = `<span>Với ${R.short}: giảm vật lý <b>${red}%</b>, giảm thuật pháp <b>${s.res}%</b></span><button class="qhelp sm" data-act="defhelp" aria-label="Giải thích">?</button>`;
  return `<div class="stats">${stats.map(([n, v]) => `<div><span>${n}</span><b>${v}</b></div>`).join('')}</div>${statMore(cls, s)}<p class="help-p defp">${defTxt}</p><p class="help-p sustp">${sustShort(cls, s)}<button class="qhelp sm" data-act="mechhelp" aria-label="Giải thích">?</button></p><p class="help-p">${mfTxt}</p>`;
}
// 全部属性里「其他属性」（2026-11-26 用户说点进去属性不全）：上面 12 项之外，凡是不为 0 的都列出来
const STAT_BASE = new Set(['atk', 'hp', 'armor', 'crit', 'critDmg', 'spd', 'leech', 'res', 'dmgPct', 'elem', 'mf', 'dodge', 'maxHp', 'armorT', 'critRaw', 'resRaw', 'speed', 'level', 'sust', 'thorns', 'pAtk', 'pHp', 'pArmor', 'atkPct', 'hpPct', 'armorPct', 'regen', 'regenPct', 'poison', 'minion', 'gDr']);
STAT_NAMES.poisonPct = STAT_NAMES.poisonPct || "Sát thương trúng độc"; STAT_NAMES.ironPct = STAT_NAMES.ironPct || "Khí huyết Thiết Giáp Thi"; STAT_NAMES.kiPct = STAT_NAMES.kiPct || "Đòn kết liễu: mỗi điểm Sát ý tăng thêm";
const STAT_ORDER = ['xDr', 'xLast', 'xShield', 'xTen', 'thornDmg', 'thornK', 'lowHpK', 'xBoss', 'xExec', 'xBreak', 'xDouble', 'xCritNext', 'xFirst', 'xHaste', 'xKill', 'xRage', 'furyGain', 'lianPct', 'cdSkip', 'freeze', 'poisonPct', 'healPct', 'minionPct', 'ironPct', 'allyPct', 'gf', 'xLuck'];
function statMore(cls, s) {
  const ch = SAVE.chars[cls], r1 = v => Math.round(v * 10) / 10, L = [], add = (n, v) => L.push([n, v]);
  if (s.atkPct) add("Cộng thêm công", '+' + r1(s.atkPct) + '%');
  if (s.hpPct) add("Cộng thêm khí huyết tối đa", '+' + r1(s.hpPct) + '%');
  if (s.armorPct) add("Cộng thêm hộ giáp", '+' + r1(s.armorPct) + '%');
  if (s.pAtk || s.pHp || s.pArmor) add("Căn cơ tu vi (công / khí huyết / hộ giáp)", `+${s.pAtk || 0}%/+${s.pHp || 0}%/+${s.pArmor || 0}%`);
  if (s.regen || s.regenPct) add("Hồi khí huyết mỗi lượt", [s.regen ? fmtBig(hpShow(s.regen, ch.level)) : '', s.regenPct ? r1(s.regenPct) + "% khí huyết tối đa" : ''].filter(Boolean).join(' + '));
  if (s.gDr) add("Kim Chung Ngọc giảm ST (khí huyết dưới 30% thì gấp đôi)", r1(s.gDr) + '%');
  if (s.poison) add("Đòn đánh gây trúng độc", `mỗi lượt ${r1(s.poison)}% công`);
  if (s.minion) add(STAT_NAMES.minion, '+' + s.minion);
  const seen = new Set(), bare = new Set(['xDr', 'xLast', 'xShield', 'xTen', 'xDouble', 'xFirst', 'cdSkip', 'freeze', 'xKill', 'thornK']);   // bare：几率、减伤这些，前面不写加号
  const one = k => { const v = s[k]; if (seen.has(k) || typeof v !== 'number' || !v || !STAT_NAMES[k]) return; seen.add(k);
    const pct = PCT_STATS.has(k) || /Pct$|Gain$/.test(k); add(STAT_NAMES[k], (bare.has(k) ? '' : '+') + r1(v) + (pct ? '%' : '')); };
  STAT_ORDER.forEach(one); for (const k in s) if (!STAT_BASE.has(k)) one(k);
  for (const id in s.sk || {}) { const sk = CLASSES[cls].skills.find(x => x.id === id); if (sk && s.sk[id]) add(`ST ${sk.n}`, '+' + r1(s.sk[id]) + '%'); }
  return L.length ? `<h4 class="sub-h">Thuộc tính khác</h4><div class="stats one">${L.map(([n, v]) => `<div><span>${n}</span><b>${v}</b></div>`).join('')}</div>` : '';
}
// 护甲减伤：物理伤害 × 系数 ÷（系数 + 护甲），系数 = 40 + 妖物等级 × 9（和 engine hit() 里一样）
const armorK = lv => 40 + lv * 9;
const armorRed = (a, lv) => Math.round(100 * a / (a + armorK(lv)));
function armorRef() {   // 拿哪一层的妖物来比：在幻境里就是这一层，没在打就用你选好的层数；还没开幻境就按自己等级
  const r = SAVE.run, N = r && r.mode === 'rift' ? r.riftLv : featureOn('rift') ? Math.max(1, SAVE.riftLv || SAVE.riftMax || 1) : 0;
  if (N) { const lv = riftD(N).base; return { n: `tầng ${N} Ảo Cảnh (yêu vật cấp ${lv})`, short: `tầng ${N} Ảo Cảnh`, lv }; }
  const lv = SAVE.chars[SAVE.cls].level; return { n: `yêu vật cấp ${lv}`, short: `yêu vật cấp ${lv}`, lv };
}
const defHelpModal = () => () => {
  const s = charStats(SAVE.cls), R = armorRef(), N0 = SAVE.run && SAVE.run.mode === 'rift' ? SAVE.run.riftLv : SAVE.riftLv || SAVE.riftMax || 0;
  const Ns = featureOn('rift') ? [...new Set([50, 100, 150, 200, 300, N0].filter(n => n > 0))].sort((a, b) => a - b) : [];
  const tbl = Ns.length ? `<table class="deftbl"><tr><th>Tầng</th>${Ns.map(n => `<th class="${n === N0 ? 'on' : ''}">${n}</th>`).join('')}</tr><tr><td>Cấp yêu vật</td>${Ns.map(n => `<td class="${n === N0 ? 'on' : ''}">${riftD(n).base}</td>`).join('')}</tr><tr><td>Bạn giảm vật lý</td>${Ns.map(n => `<td class="${n === N0 ? 'on' : ''}">${armorRed(s.armorT, riftD(n).base)}%</td>`).join('')}</tr></table>` : '';
  const line = (n, v, r, cap) => `${n}: gốc <b>${r}%</b> → thực tế <b>${v}%</b>${r > 75 ? '' : ` (chưa tới 75, tính đủ)`}, tối đa ${cap}%`;
  return `<h2 class="mh">Hộ giáp, kháng toàn bộ, chí mạng tính thế nào</h2><div>
  <p class="help-p"><b>Hộ giáp</b> chỉ chặn sát thương vật lý: sát thương vật lý nhận vào × hệ số ÷ (hệ số + hộ giáp của bạn), <b>hệ số = 40 + cấp yêu vật × 9</b>. Hộ giáp càng chồng càng kém lời, không có trần cứng; cùng một lượng hộ giáp, yêu vật cấp càng cao thì giảm càng ít. Hộ giáp hiện tại <b>${s.armorT}</b>, với ${R.n} giảm <b>${armorRed(s.armorT, R.lv)}%</b>.</p>${tbl}
  <p class="help-p"><b>Kháng toàn bộ</b> chặn sát thương thuật pháp như lửa, băng, độc, sét, giảm thẳng theo phần trăm. Trong 75% tính đủ; phần vượt 75 cứ 2 điểm tính 1, từ 80% trở đi cứ 3 điểm tính 1, <b>tối đa ${RES_SOFT[1]}%</b> (gốc 85 → 80, gốc 100 → 85).<br>${line("Kháng toàn bộ của bạn", s.res, s.resRaw, RES_SOFT[1])}</p>
  <p class="help-p"><b>Chí mạng</b>: trong 75% tính đủ; phần vượt 75 cứ 2 điểm tính 1, từ 85% trở đi cứ 3 điểm tính 1, <b>tối đa ${CRIT_SOFT[1]}%</b> (gốc 95 → 85, gốc 110 → 90).<br>${line("Chí mạng của bạn", s.crit, s.critRaw, CRIT_SOFT[1])}</p>
  <p class="help-p">Ngoài vật lý và thuật pháp, Kim Chung Ngọc, dòng giảm sát thương… những thứ "sát thương nhận vào -x%" còn nhân thêm một lần nữa.</p></div>
  <button class="btn ghost" data-act="close">Đã hiểu</button>`;
};
// 全部属性（人物页点属性框弹出）：原来修炼页的「属性」整页搬到这里
// 还有心法点、而且真有能点的（满级会多出 1 点没处用，不算）
const talTodo = cls => talentInfo(cls).free > 0 && talentBranches(cls).some(Bq => Bq.t.some((T, i) => canLearn(cls, Bq.id, i)));
function statPage(cls) {
  const s = charStats(cls);
    const fxList = [...s.fx].map(f => { const L = LEGENDS.find(l => l.fx === f); if (L) return `<li><b class="r-legend">${L.n}</b>: ${L.d}</li>`;
      const S = SETS.find(x => x.b4 === f); if (S) return `<li><b class="r-set">${S.n} 4 món</b>: ${S.b4d}</li>`;
      const S6 = SETS.find(x => x.b6 === f); if (S6) return `<li><b class="r-set">${S6.n} 6 món</b>: ${S6.b6d}</li>`;
      for (const Bq of talentBranches(cls)) { const T = Bq.t.find(t => t.fx === f); if (T) return `<li><b style="color:var(--gold2)">Tâm pháp · ${T.n}</b>: ${T.d}</li>`; } return ''; }).join('');
  return `${statBlock(cls)}
      <h4 class="sub-h">Bộ trang bị môn phái</h4><ul class="setlist">${SETS.filter(S => S.cls === cls && (!S.rift || featureOn('rift'))).map(S => { const n = s.setCount[S.id] || 0;
        return `<li class="${S.rift ? 'rset' : ''}"><details><summary><b>${S.n}</b> <small>đã mặc ${n}/${S.pieces.length}${S.rift ? ` · Ảo Cảnh từ tầng ${S.rlv || RSET_LV}` : ''}</small></summary><div class="${n >= 2 ? 'on' : 'off'}">2 món: ${S.b2d}</div><div class="${n >= 4 ? 'on' : 'off'}">4 món: ${S.b4d}</div>${S.b6 ? `<div class="${n >= 6 ? 'on' : 'off'}">6 món: ${S.b6d}</div>` : ''}${setTip(S, n)}</details></li>`; }).join('')}</ul>
      ${fxList ? `<h4 class="sub-h">Hiệu ứng đang có</h4><ul class="setlist fxlist">${fxList}</ul>` : ''}`;
}
function heroTab() {
  const cls = SAVE.cls, ch = SAVE.chars[cls], s = charStats(cls), ti = talentInfo(cls), pf = paraFree(), rOn = featureOn('runes');
  const tabs = [['skill', "Võ học"], ['tal', `Tâm pháp${talTodo(cls) ? ` <b class="upn">${ti.free}</b>` : ''}`], ...(featureOn('para') ? [['para', `Tu vi${pf && !autoParaOn() ? ` <b class="upn">${pf}</b>` : ''}`]] : [])];
  if (!tabs.some(t => t[0] === HTAB)) HTAB = 'skill';
  const bar = `<div class="gsubs htabs" style="--n:${tabs.length}">${tabs.map(([k, n]) => `<button class="${HTAB === k ? 'on' : ''}" data-act="htab" data-arg="${k}">${n}</button>`).join('')}</div>`;
  let body = '';
  // 2026-11-26 减法：心法、修为默认自动加点；想自己点，关掉自动再展开
  const autoRow = (on, act, txt) => `<div class="autorow ${on ? 'on' : ''}"><span><b>Tự cộng điểm: ${on ? "Bật" : "Tắt"}</b><small>${txt}</small></span><button class="btn sm ghost" data-act="${act}">${on ? "Tự mình cộng" : "Bật lại tự động"}</button></div>`;
  if (HTAB === 'tal') {
    const on = autoTalOn(), sum = talentBranches(cls).map(Bq => `${Bq.n} ${branchSpent(cls, Bq.id)}`).join(' · ');
    const manual = `<div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="sub">Mỗi cấp được 1 điểm · còn <b style="color:var(--gold2)">${ti.free}</b> điểm</span>
      <button class="btn sm ghost" ${SAVE.gold >= respecCost(cls) && ti.spent ? '' : 'disabled'} data-act="respec">Tán công tu lại${respecCost(cls) ? ` (${respecCost(cls)} lượng)` : " (miễn phí)"}</button></div>${talentGrid(cls)}`;
    body = on ? `${autoRow(true, 'autotal', "Mỗi cấp được 1 điểm tâm pháp, tự cộng sẵn: cộng đầy nhánh bản môn trước, rồi tới Sát Phạt, Nội Công.")}<p class="autosum">Đã cộng: ${sum}</p><details class="autofold"><summary>Xem đã cộng những gì</summary>${talentGrid(cls)}</details>`
      : `${autoRow(false, 'autotal', "Giờ do bạn tự cộng.")}${manual}`;
  } else if (HTAB === 'skill') {
    body = skillPanel(cls);
  } else {
    const on = autoParaOn(), rows = `${[1, 0].map(rt => `<h4 class="sub-h">${rt ? "Căn cơ <small>nhân vào cuối · mỗi mục tối đa 50 điểm</small>" : "Khác <small>cộng chung với trang bị</small>"}</h4>
      <div class="para">${PARAGON_STATS.filter(P => !!P.root === !!rt).map(P => { const n = SAVE.para.pts[P.k] || 0, pc = P.root || PCT_STATS.has(P.k), full = P.cap && (n + 1) * P.v > P.cap;
        return `<div class="prow ${P.root ? 'root' : ''}"><span>${P.n}<small>mỗi điểm +${P.v}${pc ? '%' : ''}${P.cap ? " · tối đa " + P.cap + '%' : ''}</small></span><b>${full ? "<i>đầy</i> " : ''}+${num(n * P.v)}${pc ? '%' : ''}</b>
        ${on ? '' : [1, 10, 50].map(k => `<button class="mini" ${paraCanAdd(P.k) ? '' : 'disabled'} data-act="para" data-arg="${P.k}|${k}">+${k}</button>`).join('')}</div>`; }).join('')}</div>`).join('')}`;
    const head = `<p class="help-p">Năm môn phái dùng chung · ${SAVE.para.lv ? `${realmName(SAVE.para.lv)} · ` : ''}tổng cộng <b style="color:var(--gold2)">${SAVE.para.lv}</b> điểm${pf ? ` · còn <b style="color:var(--gold2)">${pf}</b> điểm chưa dùng` : ''}</p>`;
    const sum = PARAGON_STATS.filter(P => SAVE.para.pts[P.k]).map(P => `${P.n} +${num(SAVE.para.pts[P.k] * P.v)}${P.root || PCT_STATS.has(P.k) ? '%' : ''}`).join(' · ');
    body = on ? `${autoRow(true, 'autopara', "Đầy cấp rồi kinh nghiệm biến thành điểm tu vi, tự cộng sẵn: căn cơ trước (công, khí huyết, hộ giáp), sau đó chủ yếu là sát thương, khí huyết.")}${head}<p class="autosum">${sum || "Chưa có điểm tu vi"}</p><details class="autofold"><summary>Xem từng mục</summary>${rows}</details>`
      : `${autoRow(false, 'autopara', "Giờ do bạn tự cộng.")}${head}${rows}${SAVE.para.lv ? "<button class=\"btn sm ghost\" style=\"margin-top:8px\" data-act=\"parareset\">Phân lại tu vi (miễn phí)</button>" : ''}`;
  }
  return `<section class="panel herop">${bar}<div class="hbody" data-scroll="hbody-${HTAB}">${body}</div></section>`;
}
const stTag = (st, txt) => st && STATES[st] ? `<span class="stt" style="--c:${STATES[st].c}">${txt || STATES[st].n}</span>` : '';
// ---- 伙伴组队（通关后的幻境） ----
const rowTag = c => `<i class="rowt ${COMPANIONS[c].row}">${COMPANIONS[c].row === 'front' ? "Tiền tuyến" : "Hậu tuyến"}</i>`;
function teamRow() {
  const T = teamOf(), N = teamSlots();
  return `<button class="teamrow" data-act="teamopen"><span class="sub">Đồng hành ${T.length}/${N}</span>${T.length ? T.map(c => `<span class="tm">${unitIcon(c === 'ngoc' ? 'ngocfox' : COMPANIONS[c].spr, 30, null, '', 'head')}<b>${c === 'ngoc' ? 'Ngoc' : COMPANIONS[c].n}</b>${rowTag(c)}</span>`).join('') : "<i class=\"sub\">Lần này đi một mình</i>"}<em>Điều chỉnh ›</em></button>`;
}
let TEAMX = null;   // 伙伴弹窗里展开看详情的那位
const teamModal = () => () => {
  const T = teamOf(), N = teamSlots(), L = Object.keys(COMPANIONS).filter(compOpen), LK = Object.keys(COMPANIONS).filter(c => !compOpen(c) && (COMP_LOCK[c] || (riftPath() && RIFT_COMP[c] != null)));
  const row = (c, lock) => { const C = COMPANIONS[c], v = wAffOf(c), on = T.includes(c), cost = giftCost(c), x = TEAMX === c;
    const head = `<div class="tmh" data-act="teamx" data-arg="${c}">${unitIcon(c === 'ngoc' ? 'ngocfox' : C.spr, 36, null, '', 'head')}<span><b>${c === 'ngoc' ? "Ngoc (Cửu Vĩ)" : C.n}</b>${rowTag(c)}<small>${C.role}${lock ? '' : ` · Hảo cảm ${v}/${COMP_AFF_MAX}`}</small></span>
      ${lock ? `<em class="tml">🔒</em>` : `<button class="btn sm ${on ? '' : 'ghost'}" data-act="teamtog" data-arg="${c}">${on ? "Cho nghỉ" : "Dẫn theo"}</button>`}</div>`;
    if (!x) return `<div class="tmc ${on ? 'on' : ''} ${lock ? 'lock' : ''}">${head}</div>`;
    if (lock) { if (!COMP_LOCK[c]) return `<div class="tmc lock x">${head}<p>${C.d}</p><div class="tmaff">Chưa quen: thông Ảo Cảnh tầng ${RIFT_COMP[c]} (hiện ${rTop()} tầng)</div></div>`;
      const [h, n] = COMP_LOCK[c](); return `<div class="tmc lock x">${head}<p>${C.d}</p><div class="tmaff">Chưa quen: ${C.lock}${pgOr(0) ? ` (${Math.min(h, n)}/${n})` : " (sau khi thông quan)"}</div></div>`; }
    return `<div class="tmc x ${on ? 'on' : ''}">${head}<p>${C.d}</p>
      <div class="tmaff">Hảo cảm <b>${v}</b>/${COMP_AFF_MAX} (khí huyết, công +${v * 4}%)<button class="btn sm ghost" ${v < COMP_AFF_MAX && SAVE.gold >= cost ? '' : 'disabled'} data-act="gift" data-arg="${c}">${v < COMP_AFF_MAX ? `Tặng quà ${fmtBig(cost)} lượng` : "Đầy rồi"}</button></div>
      ${(C.up || []).map((t, i) => `<div class="tmup ${v >= (i + 1) * 10 ? 'ok' : ''}">${v >= (i + 1) * 10 ? '✓' : '·'} ${t}</div>`).join('')}</div>`; };
  return `<h2 class="mh">Đồng hành <small>mang ${T.length}/${N}</small><button class="qhelp sm" data-act="teamhelp" aria-label="Giải thích">?</button></h2>
    <p class="sub tm-tip">Chạm vào tên để xem chi tiết và tặng quà. ${N < 3 ? `Kỷ lục Ảo Cảnh qua tầng ${N < 2 ? 120 : 150} sẽ mở thêm một ô.` : ''}</p>
    <div class="teaml">${L.map(c => row(c)).join('')}${LK.map(c => row(c, true)).join('')}</div>
    <div class="sheet-act"><span class="sub">Bạn có ${fmtBig(SAVE.gold)} lượng</span><button class="btn ghost" data-act="close">Xong</button></div>`;
};
const teamHelpModal = () => () => `<h2 class="mh">Đồng hành</h2><p class="help-p">Bảy phần đòn của yêu vật đánh vào tiền tuyến, tiền tuyến ngã hết mới đánh hậu tuyến. Đồng hành ăn theo mức tăng sát thương và chí mạng của bạn; bạn mang chiêu kết thúc ăn trạng thái nào, đồng hành sẽ ưu tiên giúp bạn treo trạng thái đó. Khi bí kỹ, đồng hành đầy nộ khí cùng hợp kích, mỗi người kèm một hiệu ứng.</p>
  <p class="help-p">Khi dẫn đồng hành, yêu vật cũng mạnh lên: tiểu yêu nhiều máu hơn, thủ lĩnh mang theo hộ pháp.</p><button class="btn ghost" data-act="close">Quay lại</button>`;
// ---- 阵法（2026-11-23）：选阵、摆号位、升级；妖阵和克制 ----
let FMSEL = null, FMPICK = null;   // 弹窗里正在看的阵；点了哪个号位（再点一个就互换）
const fmShort = id => id ? FORMS[id].s : '';
const fmBeatBy = id => Object.keys(FORM_BEAT).find(k => FORM_BEAT[k] === id);
const fmKTxt = k => k > 0 ? "khắc" : k < 0 ? "bị khắc" : "hòa";
function fmTxt(e) {   // 一个号位的效果写成几小段；代价标红
  return Object.keys(e).filter(k => e[k]).map(k => { const v = e[k], bad = v < 0;
    const t = k === 'dr' ? (v > 0 ? `nhận sát thương -${v}%` : `nhận sát thương +${-v}%`) : k === 'aggro' ? `yêu vật ${v}% đánh người này trước` : k === 'ext' ? `trạng thái thêm ${v} lượt` : k === 'stD' ? `đánh kẻ có trạng thái +${v}%` : k === 'heal' ? `nhận hồi máu +${v}%` : `${FORM_STAT[k]} ${v > 0 ? '+' : ''}${v}%`;
    return `<i class="${bad ? 'bad' : ''}">${t}</i>`; }).join('');
}
function fmMembers() {   // 摆阵板上的人：出门在外按这一局带的；在城里按出征模式（幻境看组队，主线看同伴）
  if (SAVE.run) return formMembers(SAVE.run);
  if (SAVE.mode === 'rift' && pgOr(0)) return ['hero', ...teamOf()];
  const c = SAVE.comp && (SAVE.comps || {})[SAVE.comp] ? SAVE.comp : 'ngoc'; return ['hero', c];
}
const fmName = k => k === 'hero' ? CLASSES[SAVE.cls].n : k === 'ngoc' ? 'Ngoc' : (COMPANIONS[k] || {}).n || k;
const fmIcon = k => k === 'hero' ? heroSpr(SAVE.cls, 30) : unitIcon(k === 'ngoc' ? 'ngocfox' : COMPANIONS[k].spr, 30, null, '', 'head');
function fmEnemyNow() {   // 幻境地图上：这一层的妖阵、守关妖王的阵（妖王出来以后）
  const r = SAVE.run; if (!r || r.mode !== 'rift' || !r.world) return null;
  const f = enemyForm(r, 'x'); if (!f) return null; return { f, b: r.rw && r.rw.boss ? enemyForm(r, 'boss') : null };
}
function formRow() {
  if (!FORM_IDS.some(formOpen)) return '';
  const c = formCur();
  return `<button class="teamrow fmrow" data-act="fmopen"><span class="sub">Trận pháp</span><b>${c ? `${FORMS[c].n} Lv ${formLv(c)}` : "Tán Trận (chưa bày)"}</b><small>${FORM_IDS.filter(formOpen).length}/${FORM_IDS.length} trận</small><em>Xếp trận ›</em></button>`;
}
const formModal = () => () => {
  const F = formSave(), cur = formCur() || 'san', sel = FMSEL && FORMS[FMSEL] ? FMSEL : cur, cls = SAVE.cls, E = fmEnemyNow();
  const list = ['san', ...FORM_IDS].map(id => { const op = formOpen(id), k = E && op ? formK(id, E.f) : null;
    return `<button class="fmo ${id === sel ? 'sel' : ''} ${id === cur ? 'cur' : ''} ${op ? '' : 'lock'}" data-act="fmsel" data-arg="${id}"><b>${FORMS[id].n}</b><small>${op ? (id === 'san' ? "Không bày" : 'Lv ' + formLv(id)) : '🔒'}</small>${id === cur ? "<em>Đang dùng</em>" : k != null && E ? `<i class="fk k${k}">${fmKTxt(k)}</i>` : ''}</button>`; }).join('');
  const Fd = FORMS[sel], op = formOpen(sel);
  let body;
  if (sel === 'san') body = `<p class="help-p">${Fd.d}</p>${fmBench(sel)}<div class="fmact">${cur !== 'san' ? "<button class=\"btn sm\" data-act=\"fmuse\" data-arg=\"san\">Không bày trận</button>" : "<button class=\"btn sm\" disabled>Đang dùng</button>"}</div>`;
  else if (!op) body = `<p class="help-p"><b>${Fd.n}</b> (${Fd.tag}) chưa học: qua chương ${Fd.ch} chính tuyến, hoặc từng tới tầng ${Fd.at} Ảo Cảnh là học được.</p>`;
  else {
    const lv = formLv(sel), keys = fmMembers(), sl = formSlots(sel, keys, cls);
    const cell = i => { const k = sl[i], e = formFx(sel, i, lv);
      return `<button class="fmc ${FMPICK === i ? 'pick' : ''} ${k ? '' : 'empty'}" data-act="fmslot" data-arg="${i}"><span class="fmn">Vị ${i + 1}</span>${k ? `<span class="fmw">${fmIcon(k)}<b>${esc(fmName(k))}</b></span>` : "<span class=\"fmw\"><b class=\"dim\">Trống</b></span>"}<span class="fme">${fmTxt(e) || "<i>Không có tăng ích</i>"}</span></button>`; };
    const nb = FORM_BEAT[sel], by = fmBeatBy(sel), c = formCost(lv);
    body = `<p class="fmh"><b>${Fd.n}</b> <span>Lv ${lv}/${FORM_MAX} · ${Fd.tag} · khắc <b>${FORMS[nb].n}</b> · bị <b>${FORMS[by].n}</b> khắc</span></p>
      <div class="fmb"><div class="fmr"><span class="fml">Trước</span>${cell(0)}${cell(1)}</div><div class="fmr"><span class="fml">Sau</span>${cell(2)}${cell(3)}</div></div>
      <p class="sub fmtip">${FMPICK != null ? `Chạm thêm một vị trí để đổi chỗ, hoặc chạm đồng hành để đứng vào vị trí ${FMPICK + 1}` : "Chạm một vị trí, rồi chạm vị trí khác hoặc đồng hành bên dưới"}</p>${fmBench(sel)}
      <div class="fmact">${sel !== cur ? `<button class="btn sm" data-act="fmuse" data-arg="${sel}">Bày trận này</button>` : "<button class=\"btn sm\" disabled>Đang dùng</button>"}
        ${lv < FORM_MAX ? `<button class="btn sm ghost" ${SAVE.mats >= c ? '' : 'disabled'} data-act="fmup" data-arg="${sel}">Lên Lv ${lv + 1} (hồn tinh ${c})</button>` : "<button class=\"btn sm ghost\" disabled>Tối đa</button>"}</div>`;
  }
  const eTxt = E ? `<p class="fmen">Trận yêu tầng này: <b>${FORMS[E.f].n}</b>${E.b ? ` · Yêu vương giữ ải: <b>${FORMS[E.b].n}</b>` : ''}</p>` : '';
  return `<h2 class="mh">Bày trận <small>Hồn tinh ${SAVE.mats}</small><button class="qhelp sm" data-act="fmhelp" aria-label="Giải thích">?</button></h2>${eTxt}
    <div class="fmlist">${list}</div><div class="fmbody">${body}</div>
    <div class="sheet-act"><button class="btn ghost" data-act="close">Xong</button></div>`;
};
const formHelpModal = () => () => `<h2 class="mh">Dùng trận pháp thế nào</h2>
  <p class="help-p">Mỗi trận có bốn vị trí: vị 1, 2 đứng hàng trước, vị 3, 4 đứng hàng sau. Yêu vật đánh hàng trước bảy phần. Bạn và đồng hành đứng vị nào tự xếp; mỗi vị có tăng ích khác nhau, có vị phải trả giá (chữ đỏ).</p>
  <p class="help-p">Trận học được theo tiến độ (qua bao nhiêu chương chính tuyến, hoặc từng tới tầng bao nhiêu của Ảo Cảnh), tốn hồn tinh để nâng, tối đa cấp ${FORM_MAX}; nâng cấp chỉ tăng phần tăng ích, cái giá không đổi.</p>
  <p class="help-p"><b>Tương khắc</b>: ${FORM_IDS.map(id => `${FORMS[id].n} khắc ${FORMS[FORM_BEAT[id]].n}`).join(", ")}; cả năm trận đều khắc Tán Trận. Bên khắc sát thương +${FORM_K}%, bên bị khắc sát thương -${FORM_K}%.</p>
  <p class="help-p">Từ tầng ${EFM_FROM} Ảo Cảnh yêu vật cũng bày trận: mỗi tầng một trận, yêu vương giữ ải bày trận riêng. Góc phải trên bản đồ ghi trận yêu của tầng này, góc trái trên trận đánh ghi tình hình khắc chế. Trước khi đánh đổi sang trận khắc nó, đổi lúc nào cũng được.</p>
  <button class="btn ghost" data-act="close">Quay lại</button>`;
function formNotify() { const g = formCheckUnlock(); if (g.length) { save(); qtoast(`Đã học ${g.map(id => `“${FORMS[id].n}”`).join(", ")}: vào "Xuất chinh · Trận pháp" để bày trận`); } }
const compTag = c => COMPANIONS[c] && COMPANIONS[c].ap ? stTag(COMPANIONS[c].ap, "Gây" + STATES[COMPANIONS[c].ap].n) : '';
// 技能卡上的状态说明
const skTags = k => `${k.ap ? stTag(k.ap, `Gây ${STATES[k.ap].n}${k.apc && k.apc < 1 ? ' ' + Math.round(k.apc * 100) + '%' : ''}`) : ''}${k.pay ? (k.pay.s === 'any' ? `<span class="stt pay" style="--c:#e8b0ff">Đánh mục tiêu có trạng thái: ${payText(k.pay)}</span>` : stTag(k.pay.s, `Đánh ${STATES[k.pay.s].n}: ${payText(k.pay)}`).replace('class="stt"', 'class="stt pay"')) : ''}`;
// 当前带的技能能打出哪些连招（先挂状态，再收招）
function comboHints(act, comp) {
  const src = act.filter(k => k.ap).map(k => ({ n: k.n, s: k.ap }));
  if (comp && COMPANIONS[comp] && COMPANIONS[comp].ap) src.push({ n: COMPANIONS[comp].n, s: COMPANIONS[comp].ap });
  const out = [], seen = new Set();
  for (const b2 of act.filter(k => k.pay)) for (const a of src) {
    if (b2.pay.s !== 'any' && b2.pay.s !== a.s) continue;
    const key = a.n + b2.id; if (seen.has(key) || a.n === b2.n && b2.pay.s !== 'any') continue; seen.add(key);
    out.push(`<span class="ch"><b>${esc(b2.pay.n)}</b>“${esc(a.n)}”→“${esc(b2.n)}”</span>`);
    if (b2.pay.s === 'any') break;
  }
  return out.length ? `<div class="combo-h">${out.join('')}</div>` : "<p class=\"combo-h none\">Võ học đang mang chưa thành liên hoàn: mang một chiêu mở đòn “gây trạng thái”, rồi một chiêu kết đòn “đánh trạng thái đó”.</p>";
}
// 赶尸人的尸阵：每个位置放哪种僵尸
function formHTML(cls) {
  if (cls !== 'necro') return '';
  const ch = SAVE.chars.necro, cap = 3 + charStats('necro').minion + (charStats('necro').fx.has('minionArmor') ? 1 : 0), form = necroForm(ch.level, ch.form);
  const opts = ZOMBIE_ORDER.filter(z => ZOMBIES[z].lv <= ch.level);
  return `<div class="form"><h4 class="sub-h">Thi trận <small>Vào trận xếp sẵn theo thứ tự này; con nào ngã thì dùng Rung Chuông Gọi Xác gọi lại (thi vị ${cap})</small></h4>
    ${Array.from({ length: cap }, (_, i) => `<div class="frow"><span class="fpos">${i + 1}</span>${ZOMBIE_ORDER.map(z => { const Z = ZOMBIES[z], lock = Z.lv > ch.level;
      return `<button class="fz ${form[i] === z ? 'on' : ''}" ${lock ? 'disabled' : ''} data-act="form" data-arg="${i}|${z}">${SPR.img(Z.spr, 26, Z.pal)}<b>${Z.n}</b><small>${lock ? Z.lv + " cấp" : esc(Z.d.split(", ")[0])}</small></button>`; }).join('')}</div>`).join('')}
    <p class="help-p">${ZOMBIE_ORDER.map(z => `<b>${ZOMBIES[z].n}</b> (cấp ${ZOMBIES[z].lv}): ${ZOMBIES[z].d}`).join('<br>')}</p></div>`;
}
// 武学分类（2026-11-25）：每招标核心、状态、控制；带招按「核心 1 + 状态 1 + 控制 1 + 自由 2」
const skcTag = (cls, k) => { const c = k.cd ? (k.cat || 'core') : 'base'; return `<i class="skc c-${c}">${c === 'base' ? "Cơ bản" : SK_CAT[c]}</i>`; };
const skRuleTxt = (cls, L) => { const c = skCnt(cls, L); return `Cốt lõi ${c.core} · Trạng thái ${c.buff} · Khống chế ${c.ctrl} · Ô tự do ${skFree(cls, L)}/${SK_FREE}`; };
const SK_RULE = `Võ học xuất chiến chia ba loại: <b>Cốt lõi</b> là chiêu gây sát thương chính, <b>Trạng thái</b> là tăng lực, hộ thể, hồi máu, <b>Khống chế</b> là choáng, đóng băng, làm yếu, khiêu khích. Trong năm ô, Cốt lõi, Trạng thái, Khống chế mỗi loại một ô, hai ô còn lại là ô tự do, loại nào cũng được.`;
// 武学页（2026-11-25 重做）：上面 5 个格子（核心·状态·控制·自由·自由），点格子弹出能选的招式；下面是选中那一格的详情
let SKSEL = 0, SKPK = null;   // SKSEL：选中第几格（0–4）或 'basic'、'ult'；SKPK：弹窗里展开的那一招
const SLOT_CAT = ['core', 'buff', 'ctrl', null, null];
const slotName = i => SLOT_CAT[i] ? SK_CAT[SLOT_CAT[i]] : "Tự do";
const runeOf = (cls, id, rmap) => { const r = (rmap || SAVE.chars[cls].runes || {})[id]; return r && RUNES[id] ? RUNES[id][r === 'a' ? 0 : 1] : null; };
// 5 格（武学页、看塔装共用）：act 点格子用的动作，sel 选中的格
function slotGrid(cls, L, rmap, act, sel) {
  const C = CLASSES[cls], S = skSlots(cls, L);
  return `<div class="slg">${S.map((id, i) => { const k = id && C.skills.find(x => x.id === id), R = k && runeOf(cls, id, rmap), n = id ? L.indexOf(id) + 1 : 0;
    return `<button class="slc ${k ? 'c-' + (k.cat || 'core') : 'empty'} ${sel === i ? 'on' : ''}" data-act="${act}" data-arg="${i}"><small>${slotName(i)}${n ? `<em>${n}</em>` : ''}</small>${k ? `<b>${wxBadge(k, rmap ? null : cls)}${k.n}</b><i>${R ? R.n : " "}</i>` : "<b class=\"add\">＋ Chọn</b><i>　</i>"}</button>`; }).join('')}</div>`;
}
function skillPanel(cls, inBag) {
  const ch = SAVE.chars[cls], s = charStats(cls), { act, basic } = skillList(cls), rOn = featureOn('runes'), L = act.map(k => k.id), S = skSlots(cls, L), U = ULTS[cls];
  if (typeof SKSEL === 'number' && (SKSEL < 0 || SKSEL > 4)) SKSEL = 0;
  const sel = SKSEL === 'basic' ? basic : SKSEL === 'ult' ? null : (S[SKSEL] && CLASSES[cls].skills.find(x => x.id === S[SKSEL]));
  let det;
  if (SKSEL === 'ult') det = `<div class="skd"><div class="skh"><b>Bí kỹ · ${U.n}</b><small>tích đầy thanh bí kỹ rồi tự bấm</small></div><p>${U.d}</p></div>`;
  else if (!sel) det = `<div class="skd empty"><p>Ô ${SKSEL + 1} (${slotName(SKSEL)}) đang trống.</p><button class="btn" data-act="skpick" data-arg="${SKSEL}">Chọn một chiêu</button></div>`;
  else { const k = sel, r = ch.runes[k.id], i = L.indexOf(k.id);
    det = `<div class="skd"><div class="skh"><b>${wxBadge(k, cls)}${k.n}</b>${skcTag(cls, k)}<small>${k.cd ? "Hồi chiêu " + k.cd : "Chiêu cơ bản, dùng khi các võ học khác đang hồi chiêu"}</small></div>
      <p>${k.d}${s.sk[k.id] ? `<span class="skb"> (tâm pháp +${s.sk[k.id]}%)</span>` : ''}</p>${k.ap || k.pay ? `<div class="sktags">${skTags(k)}</div>` : ''}${skillBoosts(cls, k)}
      ${k.cd && rOn && RUNES[k.id] ? `<div class="runes">${RUNES[k.id].map((R, j) => { const id = j ? 'b' : 'a'; return `<button class="rune ${r === id ? 'on' : ''}" data-act="rune" data-arg="${k.id}|${id}"><b>${R.n}</b><span>${R.d}</span></button>`; }).join('')}</div>` : ''}
      ${k.cd ? `<div class="skord"><span>Thứ tự ra chiêu ${i + 1}/${L.length}</span><button class="mini" ${i ? '' : 'disabled'} data-act="skup" data-arg="${k.id}">Lên trước</button><button class="mini" ${i < L.length - 1 ? '' : 'disabled'} data-act="skdn" data-arg="${k.id}">Lùi sau</button></div>
      <div class="skbtns"><button class="btn" data-act="skpick" data-arg="${SKSEL}">Đổi chiêu</button><button class="btn ghost" data-act="skoff" data-arg="${k.id}">Tháo</button></div>` : ''}</div>`; }
  const fold = (h, body, key) => body ? `<details class="wxinfo skfold" ${window['SKF_' + key] ? 'open' : ''} ontoggle="window.SKF_${key}=this.open"><summary>${h}</summary>${body}</details>` : '';
  const combo = `<p class="help-p">Chiêu mở đòn “gây trạng thái” lên địch, chiêu kết đòn đánh vào địch đang mang trạng thái đó sẽ có thêm hiệu ứng (gấp đôi sát thương, chắc chắn chí mạng, đập vỡ, lây lan…).</p>
      <div class="rlist">${Object.entries(STATES).map(([k, S2]) => `<div>${stTag(k)}<span>${S2.d}</span></div>`).join('')}</div>${comboHints(act, SAVE.comp)}
      <p class="help-p">Đồng hành cũng gây trạng thái: Ngoc thiêu đốt, cô Trân phá giáp, Long đạo trưởng đóng băng. Dẫn đúng người, chiêu kết đòn của bạn mới có đất dụng võ.</p>`;
  return `${mechCard(cls)}
    <h4 class="sub-h">Võ học xuất chiến <small>chạm ô để đổi chiêu · số là thứ tự ra chiêu</small></h4>
    ${slotGrid(cls, L, null, 'sksel', SKSEL)}
    <div class="slx"><button class="${SKSEL === 'basic' ? 'on' : ''}" data-act="sksel" data-arg="basic">Cơ bản · ${basic.n}</button><button class="${SKSEL === 'ult' ? 'on' : ''}" data-act="sksel" data-arg="ult">Bí kỹ · ${U.n}</button></div>
    ${det}
    <details class="wxinfo skfold skrule"><summary>${skRuleTxt(cls, L)}</summary><p class="help-p">${SK_RULE}</p></details>
    ${inBag ? '' : buildCard(cls)}${fold("Thi trận", formHTML(cls), 'form')}${fold("Phối hợp trạng thái · cách đánh liên hoàn", combo, 'combo')}`;
}
// 点格子弹出：这一类能选的招式（自由格列全部，按类别分组）
const skPickModal = (cls, si) => () => {
  const ch = SAVE.chars[cls], C = CLASSES[cls], L = syncLoadout(cls), S = skSlots(cls, L), cur = S[si], cat = SLOT_CAT[si];
  const cand = C.skills.filter(k => k.cd && (!cat || (k.cat || 'core') === cat));
  const row = k => { const lock = k.lv > ch.level, here = k.id === cur, eqd = L.includes(k.id), N = cur ? L.map(x => x === cur ? k.id : x) : L.concat(k.id);
    const swap = eqd && !here && cat && cur, can = !lock && !here && (swap || (!eqd && skFits(cls, N)));
    const tag = here ? "<span class=\"pkt on\">Ở ô này</span>" : eqd ? `<span class="pkt">Ô ${S.indexOf(k.id) + 1}</span>` : lock ? `<span class="pkt">Cấp ${k.lv} lĩnh ngộ</span>` : !can ? "<span class=\"pkt no\">Không còn chỗ</span>" : '';
    const open = SKPK === k.id, RR = RUNES[k.id];
    return `<div class="pki ${can ? '' : 'dim'} ${open ? 'open' : ''}" data-act="skpk" data-arg="${k.id}"><div class="pkh"><b>${wxBadge(k, cls)}${k.n}</b>${skcTag(cls, k)}<small>Hồi chiêu ${k.cd}</small>${tag}</div>
      ${open ? `<p>${k.d}</p>${k.ap || k.pay ? `<div class="sktags">${skTags(k)}</div>` : ''}${RR ? `<p class="pkr">Biến chiêu: «${RR[0].n}» ${RR[0].d}; «${RR[1].n}» ${RR[1].d}</p>` : ''}
        ${can ? `<button class="btn" data-act="skput" data-arg="${si}|${k.id}">${swap ? "Đổi sang ô này" : "Lắp vào"}</button>` : !lock && !here && !eqd ? `<p class="pkr no">Hai ô tự do đã dùng hết, hãy gỡ bớt một chiêu thừa ở ô khác trước</p>` : eqd && !here ? `<p class="pkr">Đã lắp ở ô ${S.indexOf(k.id) + 1}</p>` : ''}` : `<p class="pkd">${k.d}</p>`}</div>`; };
  const body = cat ? cand.map(row).join('') : SK_CATS.map(c => { const ks = cand.filter(k => (k.cat || 'core') === c); return ks.length ? `<p class="skgh">${skcTag(cls, { cd: 1, cat: c })}</p>${ks.map(row).join('')}` : ''; }).join('');
  return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">Ô ${si + 1} · chọn chiêu ${cat ? SK_CAT[cat] : ''}</h2><div class="pkl" data-scroll="skpk">${body}</div>`;
};
function talentGrid(cls) {
  const tal = SAVE.chars[cls].tal, brs = talentBranches(cls); if (TBR >= brs.length) TBR = 0;
  return `<div class="tbr-chips">${brs.map((Bq, i) => `<button class="chip ${TBR === i ? 'on' : ''}" data-act="tbr" data-arg="${i}">${Bq.n}<small>${branchSpent(cls, Bq.id)}</small></button>`).join('')}</div><div class="tbr-wrap">${brs.map((Bq, bi) => { const sp = branchSpent(cls, Bq.id);
    return `<div class="tbr ${TBR === bi ? '' : 'm-hide'}"><h3>${Bq.n}<small>Đã đầu tư ${sp}</small></h3>${Bq.t.map((T, i) => { const r = tal[Bq.id + '.' + T.id] || 0, locked = sp < i * TALENT_TIER_REQ, can = canLearn(cls, Bq.id, i);
      return `<div class="tal ${locked ? 'locked' : ''} ${r ? 'has' : ''} ${T.max === 1 ? 'cap' : ''}"><div class="tt"><b>${T.n}</b><span>${r}/${T.max}</span></div><p>${T.d}${T.max > 1 ? " (mỗi điểm)" : ''}</p>
        ${locked ? `<small>Cần đầu tư ${i * TALENT_TIER_REQ} điểm vào nhánh này</small>` : `<button class="btn sm" ${can ? '' : 'disabled'} data-act="learn" data-arg="${Bq.id}|${i}">Tu tập</button>`}</div>`; }).join('')}</div>`; }).join('')}</div>`;
}
// ---------- 排行榜（2026-11-26）：成绩存在 Supabase 的 jiuyou 项目（新加坡）。只能经 lb_submit 写：每个玩家一个随机 pid + 本机密钥，别人改不了你的成绩
// claude.ai 里的页面不让连外部网站，排行榜只在网页版（github）能用。起了名字才上传
const LB_URL = 'https://ttmvtftgncavnocfvwrk.supabase.co/rest/v1/rpc/', LB_KEY = 'sb_publishable_Nbnc5vsX9YwHxRucF5Xo0A_sZxe7XvD', LB_SITE = 'https://sd1001902-cell.github.io/sd1001902/';
const LB_CLS = { paladin: 'monk' }, LB_CLS_BACK = { monk: 'paladin' };   // 库里武僧叫 monk
const LB_SHORT = { berserker: "Cuồng Đao", mage: "Đạo Sĩ", necro: "Cản Thi", assassin: "Thích Khách", paladin: "Võ Tăng" };
let LBV = { kind: 'rift', cls: 'all', data: {}, busy: false, err: '', syncing: false };
const lbBlocked = () => /claude/i.test(location.hostname);
function lbRand(n) { const a = new Uint8Array(n); try { crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < n; i++) a[i] = Math.random() * 256 | 0; } return a; }
function lbMe() { const L = SAVE.lb || (SAVE.lb = { pid: '', sec: '', name: '', sent: {} });
  if (!L.pid) { const b = lbRand(16); b[6] = b[6] & 15 | 64; b[8] = b[8] & 63 | 128; const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    L.pid = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; L.sec = [...lbRand(24)].map(x => 'abcdefghijkmnpqrstuvwxyz23456789'[x & 31]).join(''); }
  L.sent = L.sent || {}; return L; }
async function lbCall(fn, body, keep) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(() => { if (ctl) ctl.abort(); }, 12000);
  try { const r = await fetch(LB_URL + fn, { method: 'POST', headers: { apikey: LB_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined, keepalive: !!keep });
    const j = await r.json().catch(() => null); if (!r.ok) throw new Error((j && j.message) || ('HTTP ' + r.status)); return j; }
  finally { clearTimeout(to); }
}
const lbWeek = () => 'w' + twWeek();
function lbRows() {   // 现在该上传的：每个职业的幻境纪录、本周通天塔最高层
  const rows = [], wk = lbWeek(), T = SAVE.tower;
  for (const c of CLASS_IDS) {
    const R = SAVE.riftRec && SAVE.riftRec[c], tb = T && T.wk === twWeek() && T.c && T.c[c] ? T.c[c].best || 0 : 0;
    if (!(R && R.lv > 0) && !tb) continue;
    let pw = 0; try { pw = Math.max(0, Math.round(power(charStats(c)))); } catch (e) {}
    const cc = LB_CLS[c] || c;
    if (R && R.lv > 0) rows.push({ kind: 'rift', cls: cc, period: 'all', val: R.lv, sub: R.s != null ? R.s : 999999, power: pw });
    if (tb) rows.push({ kind: 'tower', cls: cc, period: wk, val: tb, sub: 0, power: pw });
  }
  return rows;
}
async function lbSync(force) {   // 有新纪录就传上去；没起名字不传
  if (!SAVE || !SAVE.lb || !SAVE.lb.name || lbBlocked() || LBV.syncing || (location.protocol === 'file:' && !window.CS_TEST)) return;   // 本地测试不往榜上传
  const L = lbMe(), key = r => r.kind + '|' + r.cls + '|' + r.period, rows = lbRows().filter(r => force || L.sent[key(r)] !== r.val + '|' + r.sub);
  if (!rows.length) return;
  LBV.syncing = true;
  try { await lbCall('lb_submit', { p_pid: L.pid, p_sec: L.sec, p_name: L.name, p_rows: rows }); for (const r of rows) L.sent[key(r)] = r.val + '|' + r.sub; save(); }
  catch (e) { LBV.err = String(e && e.message || e); }
  finally { LBV.syncing = false; }
}
const lbKey = () => LBV.kind + '|' + LBV.cls + '|' + (LBV.kind === 'tower' ? lbWeek() : 'all');
async function lbLoad(force) {
  const k = lbKey(), D = LBV.data[k];
  if (LBV.busy) { if (force) LBV.again = true; return; }   // 正在读：读完再读一遍
  if (lbBlocked() || (!force && D && Date.now() - D.t < 30000)) return;
  LBV.busy = true; LBV.err = '';
  try { await lbSync();
    const ask = () => lbCall('lb_board', { p_kind: LBV.kind, p_period: LBV.kind === 'tower' ? lbWeek() : 'all', p_cls: LBV.cls === 'all' ? 'all' : (LB_CLS[LBV.cls] || LBV.cls), p_pid: SAVE.lb && SAVE.lb.pid || null, p_limit: 50 });
    let j = await ask();
    // 榜上没有我手上已经有的成绩（比如榜清过一次）：把纪录重传一遍，每个榜每次打开游戏只补一回
    if (SAVE.lb && SAVE.lb.name && !(LBV.healed = LBV.healed || {})[k]) {
      const want = lbRows().filter(r => r.kind === LBV.kind && (LBV.cls === 'all' || r.cls === (LB_CLS[LBV.cls] || LBV.cls))), have = (j && j.me) || [];
      if (want.some(r => !have.some(m => m.cls === r.cls && m.val >= r.val))) { LBV.healed[k] = 1; await lbSync(true); j = await ask(); }
    }
    LBV.data[k] = { t: Date.now(), j }; }
  catch (e) { LBV.err = /fetch|network|abort|load/i.test(String(e && e.message || e)) ? "Không kết nối được bảng xếp hạng, kiểm tra mạng nhé" : "Bảng xếp hạng bị lỗi: " + (e && e.message || e); }
  finally { LBV.busy = false; if (LBV.again) { LBV.again = false; setTimeout(() => lbLoad(true), 0); } if ((TT === 'col' && CTAB === 'lb' && VIEW === 'town') || MODALFN === lbModal) refresh(); }
}
// ---------- 云存档（2026-11-26，Supabase）：打着打着自动上传；取回码（16 位）换设备时取回。只在网页版能用 ----------
// 库里每个取回码每台设备留最近 3 份、总共 8 份；一台旧设备乱传也挤不掉另一台的最新存档
const CS_ON = true;
const CS_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let CS = { hold: true, busy: false, timer: null, err: '', pend: null, found: null };
function csDev() { try { let d = localStorage.getItem('jy_dev'); if (!d) { d = 'd' + [...lbRand(10)].map(x => CS_ABC[x & 31]).join(''); localStorage.setItem('jy_dev', d); } return d; } catch (e) { return 'dnostore'; } }
const csFmt = c => 'JY-' + c.match(/.{4}/g).join('-');
const csNorm = v => { let c = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length === 18 && c.startsWith('JY')) c = c.slice(2); return /^[A-HJ-NP-Z2-9]{16}$/.test(c) ? c : null; };
const csOn = () => CS_ON && !lbBlocked() && storageOK && (location.protocol !== 'file:' || window.CS_TEST);   // 本地测试不往库里传
function csMe() { const C = SAVE.cs || (SAVE.cs = {}); if (!C.code) { C.code = [...lbRand(16)].map(x => CS_ABC[x & 31]).join(''); persist(true); } return C; }
async function csUpload(force, keep) {
  if (!csOn() || CS.hold || CS.busy || !hasProgress()) return;
  const C = csMe(); if (!force && (SAVE.t || 0) <= (C.ut || 0)) return;
  CS.busy = true;
  try { const t = SAVE.t || Date.now(), data = await exportSaveZ();
    const r = await lbCall('cs_put', { p_code: C.code, p_dev: csDev(), p_data: data, p_meta: { ...saveBrief(SAVE), rift: SAVE.riftMax || 0, t } }, keep && data.length < 60000);   // keepalive 最多 64KB
    C.ut = t; C.at = Date.now(); C.last = r && r.id; CS.err = ''; persist(true);
    if (!C.told) { C.told = 1; persist(true); toast("Đã bật lưu đám mây: mã lấy lại ở \"Cài đặt → Lưu trữ\", chụp màn hình giữ lại nhé"); } }
  catch (e) { CS.err = String(e && e.message || e); }
  finally { CS.busy = false; }
}
function csQueue() {   // 存一次档就排一次上传：最快 20 秒后，离上次上传至少 90 秒；玩着的时候不会一直往后推
  if (!csOn() || CS.hold || CS.timer) return;
  const wait = Math.max(20000, 90000 - (Date.now() - ((SAVE.cs && SAVE.cs.at) || 0)));
  CS.timer = setTimeout(() => { CS.timer = null; csUpload(); }, wait);
}
async function csBoot() {   // 开游戏：先看云上有没有别的设备传的、更新的存档，有就问一声；没有就开始自动上传
  if (!csOn()) return;
  const C = csMe();
  try { const L = await lbCall('cs_list', { p_code: C.code }), top = (L || []).filter(r => r.dev !== csDev() && r.meta && !r.meta.pre).sort((a, b) => (b.meta.t || 0) - (a.meta.t || 0))[0];
    if (top && (top.meta.t || 0) > (SAVE.t || 0) + 2000) { CS.pend = top; openModal(csNewerModal); return; } }
  catch (e) { CS.err = String(e && e.message || e); }
  csStart(); csPreBackup();
}
// 减法改版前的存档（读档时原样留在本机的那份）也往云上放一份，单独算一台「设备」，不会被平时的上传挤掉。只传一次
async function csPreBackup() {
  try { const raw = localStorage.getItem(PRESLIM_KEY); if (!raw || localStorage.getItem(PRESLIM_KEY + '_up')) return;
    const o = JSON.parse(raw), u8 = new TextEncoder().encode(JSON.stringify(slimSave(o)));
    const data = canDeflate() ? SAVE_TAG2 + '.' + u8.length.toString(36) + '.' + sum32b(u8).toString(36) + '.' + b64u(await pipeBytes(u8, new CompressionStream('deflate'))) : packSaveObj(slimSave(o));
    await lbCall('cs_put', { p_code: csMe().code, p_dev: csDev() + 'P', p_data: data, p_meta: { ...saveBrief(o), rift: o.riftMax || 0, t: o.t || 0, pre: 1 } });
    localStorage.setItem(PRESLIM_KEY + '_up', '1'); } catch (e) {}
}
function csStart() { CS.hold = false; if (!CS.started) { CS.started = 1; const prev = onPersist; onPersist = prev ? () => { prev(); csQueue(); } : csQueue; } csQueue(); }
const csNewerModal = () => { const P = CS.pend, m = P.meta;
  return `<h2 class="mh">Trên mây có bản lưu mới hơn</h2>
    <div class="bk-cmp"><div class="in"><small>Trên mây (thiết bị khác tải lên)</small><b>${briefLine(m)}</b><small>Lưu lúc ${fmtDay(m.t)}</small></div>
    <div><small>Thiết bị này</small><b>${briefLine(saveBrief(SAVE))}</b>${SAVE.t ? `<small>Lưu lúc ${fmtDay(SAVE.t)}</small>` : ''}</div></div>
    <div class="row"><button class="btn" data-act="cscloud">Dùng bản trên mây</button><button class="btn ghost" data-act="cskeep">Dùng bản máy này</button></div>
    <p class="help-p">Chọn "Dùng bản máy này" thì bản trên mây vẫn còn, vào "Cài đặt → Lưu trữ → Lưu đám mây" dùng mã lấy lại là lấy về được.</p>`; };
async function csTake(code, id) {   // 下载一份，读成存档对象，带上取回码
  const data = await lbCall('cs_get', { p_code: code, p_id: id }); if (!data) throw new Error('gone');
  const o = await decodeSaveAny(data); o.cs = { code, ut: o.t || 0, at: Date.now(), last: id, told: 1 }; return o;
}
const csListModal = () => { const F = CS.found, me = csDev();
  return `<h2 class="mh">Lấy lại bản lưu đám mây</h2><p class="help-p">Mã ${csFmt(F.code)} có ${F.list.length} bản, mới nhất ở trên:</p>
    <div class="cslist">${F.list.map(r => `<div class="csr"><span><b>${briefLine(r.meta || {})}</b><small>${fmtDay((r.meta && r.meta.t) || Date.parse(r.t))} · ${r.meta && r.meta.pre ? "bản lưu trước khi đổi phiên bản" : r.dev === me ? "máy này tải lên" : "máy khác tải lên"}${r.meta && r.meta.rift ? ` · Ảo Cảnh tầng ${r.meta.rift}` : ''}</small></span><button class="btn sm" data-act="cspick" data-arg="${r.id}">Dùng bản này</button></div>`).join('')}</div>
    <div class="row" style="justify-content:center"><button class="btn ghost" data-act="close">Hủy</button></div>`; };
function csPanel() {
  if (!CS_ON) return '';
  if (lbBlocked()) return `<section class="panel"><h3>Lưu đám mây</h3><p class="help-p">Ở đây không dùng được lưu đám mây (trang trên claude.ai không cho kết nối ra ngoài). Chơi bản web sẽ tự tải lên: ${LB_SITE}</p></section>`;
  const C = csMe();
  const line = CS.err && !C.at ? "Tải lên chưa được, lát nữa sẽ tự thử lại" : C.at ? `Đang tự tải lên · Lần trước ${fmtDay(C.at)}` : hasProgress() ? "Chưa tải lên lần nào, chơi một lúc sẽ tự tải" : "Bắt đầu chơi rồi sẽ tự tải lên";
  return `<section class="panel"><h3>Lưu đám mây</h3><p class="help-p">${line}</p>
    <div class="cscode"><small>Mã lấy lại</small><b>${csFmt(C.code)}</b><button class="btn sm ghost" data-act="cscopy">Sao chép</button></div>
    <p class="sub">Đổi điện thoại, xóa bộ nhớ đệm thì nhập mã này trên máy mới để lấy lại. Chụp màn hình giữ lại, đừng gửi cho người khác.</p>
    <div class="row rdm-row"><input id="csIn" placeholder="Nhập mã lấy lại trên máy mới" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" data-act="csfind">Lấy lại</button></div></section>`;
}
// 开始界面的排行榜按钮：小字写幻境榜首
let LBTOP = null, LBTOPT = 0;
function lbTitleLine() {
  if (!lbBlocked() && Date.now() - LBTOPT > 60000) { LBTOPT = Date.now();
    lbCall('lb_board', { p_kind: 'rift', p_period: 'all', p_cls: 'all', p_pid: null, p_limit: 1 }).then(j => { LBTOP = j && j.top && j.top[0] || null; if (VIEW === 'title' && !MODALFN) render(); }).catch(() => {}); }
  return LBTOP ? `Đứng đầu Ảo Cảnh: ${esc(LBTOP.n)} · tầng ${LBTOP.val}` : "Xem ai leo cao nhất";
}
const lbModal = () => `<h2 class="mh">Bảng xếp hạng</h2>${lbHTML()}<div class="row" style="justify-content:center;margin-top:8px"><button class="btn ghost" data-act="close">Đóng</button></div>`;
function lbHTML() {
  if (lbBlocked()) return `<section class="panel"><h3>Bảng xếp hạng</h3><p class="help-p">Ở đây không mở được bảng xếp hạng (trang trên claude.ai không cho kết nối ra ngoài). Chơi bản web là xem được:</p><p class="help-p"><a href="${LB_SITE}" target="_blank" rel="noopener">${LB_SITE}</a></p><p class="help-p">Dữ liệu có thể chuyển sang bằng mã lưu trong "Cài đặt → Lưu trữ".</p></section>`;
  const L = SAVE.lb, named = !!(L && L.name), D = LBV.data[lbKey()], j = D && D.j;
  if (!D && !LBV.busy) setTimeout(() => lbLoad(), 0);
  const val = r => LBV.kind === 'rift' ? `<b>Tầng ${r.val}</b><small>${r.sub < 999999 ? fmtClock(r.sub * 1000) : '—'}</small>` : `<b>Tầng ${r.val}</b>`;
  const row = r => `<div class="lbr ${r.me ? 'me' : ''}"><i>${r.rk}</i><span><b>${esc(r.n)}</b><small>${LB_SHORT[LB_CLS_BACK[r.cls] || r.cls] || ''} · Lực chiến ${fmtBig(r.pw)}</small></span><em>${val(r)}</em></div>`;
  const mine = j && j.me && j.me.length ? j.me.filter(m => !(j.top || []).some(t => t.rk === m.rk)) : [];
  const list = j ? ((j.top || []).length ? j.top.map(row).join('') + (mine.length ? `<div class="lbgap">⋯</div>${mine.map(m => row({ ...m, me: true })).join('')}` : '') : `<div class="empty-note">${LBV.kind === 'tower' ? "Tuần này chưa ai lên bảng" : "Chưa ai lên bảng"}</div>`) : `<div class="empty-note">${LBV.err ? esc(LBV.err) : "Đang tải…"}</div>`;
  return `<section class="panel lbp">
    <div class="lbtop"><div class="seg">${[['rift', "Ảo Cảnh"], ['tower', "Tháp Thông Thiên · Tuần này"]].map(([k, n]) => `<button class="${LBV.kind === k ? 'on' : ''}" data-act="lbkind" data-arg="${k}">${n}</button>`).join('')}</div><button class="qhelp sm" data-act="lbhelp" aria-label="Giải thích">?</button></div>
    <div class="lbcls">${[['all', "Tất cả"], ...CLASS_IDS.map(c => [c, LB_SHORT[c]])].map(([k, n]) => `<button class="${LBV.cls === k ? 'on' : ''}" data-act="lbcls" data-arg="${k}">${n}</button>`).join('')}</div>
    <div class="lblist">${list}</div>
    ${LBV.err && j ? `<p class="sub warn">${esc(LBV.err)}</p>` : ''}
    ${named ? `<div class="lbme"><span>Tên trên bảng: <b>${esc(L.name)}</b></span><button class="btn sm ghost" data-act="lbrename">Đổi tên</button><button class="btn sm ghost" data-act="lbreload" ${LBV.busy ? 'disabled' : ''}>Làm mới</button></div>`
      : `<div class="lbme"><input id="lbName" maxlength="12" placeholder="Đặt tên là lên bảng" autocomplete="off"><button class="btn sm" data-act="lbjoin">Lên bảng</button></div>`}
  </section>`;
}
let CTAB = null;
// 江湖录（2026-11 一屏）：分成几个小页签，每个只在框里滚
function colTab() {
  const ach = ACHIEVEMENTS.map(A => { const got = !!SAVE.ach[A.id];
    return `<div class="ach ${got ? 'got' : ''}"><b>${A.n}</b><span>${A.d}</span></div>`; }).join('');
  const nGot = ACHIEVEMENTS.filter(A => SAVE.ach[A.id]).length;
  const mons = allMonsterDefs().map(d => { const k = SAVE.kills[MK(d.n)] || 0, t = bestiaryTier(d.n), nx = BESTIARY_TIERS[t];
    return `<div class="mon ${k ? '' : 'unk'}">${SPR.img(d.spr, 40, d.pal)}<b>${k ? d.n : "? ? ? "}</b><small>Diệt ${k}${nx ? ' / ' + nx : ''}</small><span class="tier">${'★'.repeat(t)}${'☆'.repeat(3 - t)}</span></div>`; }).join('');
  const cl = storyCleared('normal');
  const replay = CHAPTERS.map((C, i) => { const k = i + 1; if (k > cl) return '';
    if (wHas(k)) return `<div class="rp"><b>${chTitle(k)}</b><button class="btn sm ghost" data-act="replay" data-arg="${k}|wintro">Mở đầu</button><button class="btn sm ghost" data-act="replay" data-arg="${k}|woutro">${k === 10 ? "Kết cục" : "Kết chương"}</button></div>`;   // 走地图的章节：回顾玩家真正看过的那几段
    return `<div class="rp"><b>${chTitle(k)}</b><button class="btn sm ghost" data-act="replay" data-arg="${k}|intro">Mở đầu</button>${C.story ? `<button class="btn sm ghost" data-act="replay" data-arg="${k}|story">${C.story.t}</button>` : ''}${C.outro.length ? `<button class="btn sm ghost" data-act="replay" data-arg="${k}|outro">Kết chương</button>` : ''}</div>`; }).join('') + (SAVE.story.ended && !wHas(10) ? "<div class=\"rp\"><b>Chương cuối</b><button class=\"btn sm\" data-act=\"replay\" data-arg=\"10|ending\">Kết cục</button></div>" : '');
  const rec = [...CHAPTERS.map((C, i) => { const b = SAVE.best['normal-' + (i + 1)]; return [chTitle(i + 1), b ? fmtTime(b.t) : '—']; }),
    ["Tầng Ảo Cảnh cao nhất", SAVE.riftMax || '—'], ...CLASS_IDS.filter(c => SAVE.riftRec[c]).map(c => ["Ảo Cảnh ·" + CLASSES[c].n, riftRecTxt(SAVE.riftRec[c])]), ...CLASS_IDS.filter(c => (SAVE.riftRecOld || {})[c]).map(c => ["Trước đổi bản·" + CLASSES[c].n, riftRecTxt(SAVE.riftRecOld[c])]), ["Tổng yêu đã diệt", SAVE.stats.kills], ["Kim Thiềm Chiêu Tài", SAVE.stats.goblins], ["Truy nã đã xong", SAVE.stats.bounties]];
  const tabs = [...(featureOn('bounty') ? [['bty', "Truy nã"]] : []), ...(featureOn('rift') ? [...(shelved('zy') ? [] : [['zy', "Trấn Yêu Lục"]]), ['lb', "Xếp hạng"]] : []), ['ach', featureOn('rift') ? "Thành tựu" : `Thành tựu ${nGot}/${ACHIEVEMENTS.length}`], ['dex', "Đồ giám"], ['rec', "Kỷ lục"]];
  if (!tabs.some(t => t[0] === CTAB)) CTAB = tabs[0][0];
  const sec = {
    ach: `<section class="panel"><h3>Thành tựu <small>${nGot}/${ACHIEVEMENTS.length}</small></h3><div class="achs">${ach}</div></section>`,
    dex: `${mountPanel()}<section class="panel"><h3>Đồ giám Truyền kỳ <small>${Object.keys(SAVE.codex || {}).filter(k => LEGENDS.some(l => l.id === k)).length}/${LEGENDS.length} · truyền kỳ riêng của môn phái có ghi tên môn phái</small></h3><div class="codex">${LEGENDS.map(L => { const got = SAVE.codex && SAVE.codex[L.id];
      return `<div class="${got ? 'got' : 'no'}"><b>${got ? L.n : "? ? ? "}</b><i>${(SLOTS.find(x => x.id === L.slot) || {}).n || ''}${L.cls ? ' · ' + CLASSES[L.cls].n : " · dùng chung"}${L.ch ? " · hay gặp ở chương" + L.ch + "" : ''}</i><br>${got ? L.d : "Chưa có"}</div>`; }).join('')}</div></section>
      <section class="panel"><h3>Bách Yêu Phổ <small>Mỗi loại yêu vật diệt ${BESTIARY_TIERS.join(' / ')} con thì sáng một sao</small></h3><div class="mons">${mons}</div></section>`,
    rec: `<section class="panel"><h3>Kỷ lục cá nhân <small>Thời gian nhanh nhất mỗi chương ở độ khó Phàm Trần</small></h3><div class="stats">${rec.map(([n, v]) => `<div><span>${n}</span><b>${v}</b></div>`).join('')}</div></section>
      <section class="panel"><h3>Xem lại cốt truyện <small>Đoạn đã xem có thể xem lại bất cứ lúc nào</small></h3>${seen('snowfox') || cl >= 1 ? "<div class=\"rp\"><b>Mở đầu · Đêm tuyết</b><button class=\"btn sm ghost\" data-act=\"snowreplay\">Xem lại</button></div>" : ''}${replay || "<div class=\"empty-note\">Qua chương 1 rồi mới xem lại được cốt truyện.</div>"}</section>` };
  const body = CTAB === 'bty' ? bountyHTML() : CTAB === 'zy' ? zyHTML() : CTAB === 'lb' ? lbHTML() : sec[CTAB];
  return tpane(tabs, CTAB, 'ctab', body);
}
// 一屏页面的通用壳：上面一排小页签，下面的内容只在框里滚
const tpane = (tabs, cur, act, body) => `<div class="tpane"><div class="gsubs gtop" style="--n:${tabs.length}">${tabs.map(([k, n]) => `<button class="${cur === k ? 'on' : ''}" data-act="${act}" data-arg="${k}">${n}</button>`).join('')}</div>
  <div class="tscroll" data-scroll="${act}-${cur}">${body}</div></div>`;
// ---------- 镇妖录 ----------
// 役使（2026-11-26）：镇妖录封存后，役使单独一个弹窗，从出征页那一行进
function yiListHTML(cls) { const my = SAVE.chars[cls].yi || [];
  return Object.keys(YISHI).map(id => { const Y = YISHI[id], g = yiGrade(id), on = my.includes(id), bossN = zyEntries(Y.pg).filter(e => e.boss).map(e => e.n).join(", ");
    return `<button class="yi ${on ? 'on' : ''} ${g ? '' : 'lock'}" data-act="yi" data-arg="${id}" ${g ? '' : 'disabled'}><b>${Y.n}</b><small>${g ? bossN + ' · ' + ZY_CN[g] : "Thu phục" + bossN + " để dùng"}</small><span>${Y.d(Math.max(1, g))}</span></button>`; }).join(''); }
const yiModal = () => `<h2 class="mh">Dịch Sứ <small>${CLASSES[SAVE.cls].n} mang tối đa 2 con</small></h2>
  <p class="help-p">Hạ yêu vương giữ ải trong Ảo Cảnh, thu phục tinh phách của nó là mang nó ra trận được. Phẩm của tinh phách theo số tầng Ảo Cảnh (tầng 20 nhị phẩm, tầng 40 tam phẩm… tầng 200 thập phẩm là tối đa), phẩm càng cao Dịch Sứ càng mạnh. Bấm một cái để mang theo hoặc bỏ xuống.</p>
  <div class="yim" data-scroll="yim">${yiListHTML(SAVE.cls)}</div>
  <div class="row" style="justify-content:center;margin-top:8px"><button class="btn ghost" data-act="close">Được rồi</button></div>`;
const zyHelpModal = () => () => `<h2 class="mh">Trấn Yêu Lục</h2><p class="help-p">Phẩm của tinh phách tùy tầng Ảo Cảnh: tầng 1–19 nhất phẩm, tầng 20 nhị phẩm, tầng 40 tam phẩm, tầng 60 tứ phẩm, tầng 80 ngũ phẩm, sau đó cứ 24 tầng lên một phẩm (104 lục phẩm, 128 thất phẩm, 152 bát phẩm, 176 cửu phẩm), tầng 200 thập phẩm. Phẩm càng cao, trang này cho càng nhiều chỉ số; thu phục thủ lĩnh một chương thì có thể mang nó theo làm “Dịch Sứ”.</p><button class="btn ghost" data-act="close">Xong</button>`;
let ZYOPEN = false, ZYPG = -1;
function zyHTML() {
  const cls = SAVE.cls, my = SAVE.chars[cls].yi || [];
  const nAll = ZY_PAGES.reduce((a, _, i) => a + zyEntries(i).filter(e => zyOf(e.n)).length, 0), tot = ZY_PAGES.reduce((a, _, i) => a + zyEntries(i).length, 0);
  const defs = allMonsterDefs(), dOf2 = n => defs.find(d => d.n === n);
  const yiList = Object.keys(YISHI).map(id => { const Y = YISHI[id], g = yiGrade(id), on = my.includes(id), bossN = zyEntries(Y.pg).filter(e => e.boss).map(e => e.n).join(", ");
    return `<button class="yi ${on ? 'on' : ''} ${g ? '' : 'lock'}" data-act="yi" data-arg="${id}" ${g ? '' : 'disabled'}><b>${Y.n}</b><small>${g ? bossN + ' · ' + ZY_CN[g] : "Thu phục" + bossN + " để dùng"}</small><span>${Y.d(Math.max(1, g))}</span></button>`; }).join('');
  const pages = ZY_PAGES.map((Pg, i) => {
    const E = zyEntries(i), got = E.filter(e => zyOf(e.n)).length, pts = zyPagePts(i), done = zyPageDone(i), open = ZYPG === i;
    const bonus = Object.entries(Pg.st).map(([k, v]) => fmtStat(k, +(pts * v).toFixed(1))).join(", ");
    const ents = E.map(e => { const g = zyOf(e.n), d = dOf2(e.n);
      return `<div class="zye ${g ? 'g' + g : 'unk'} ${e.boss ? 'boss' : ''}">${d ? SPR.img(d.spr, 34, d.pal) : ''}<b>${g || (SAVE.kills[MK(e.n)] || 0) ? e.n : "? ? ? "}</b><small>${g ? ZY_CN[g] : "Chưa thu phục"}</small></div>`; }).join('');
    return `<div class="zyp ${done ? 'done' : ''} ${open ? 'open' : ''}"><button class="zyh" data-act="zyp" data-arg="${i}"><b>Trang ${CN[i + 1]} · ${CHAPTERS[i].n}</b><span>${got}/${E.length} loại · ${pts ? bonus : Pg.sd}</span><i>${done ? "Hậu ký" : ''}${open ? '▲' : '▼'}</i></button>
      ${open ? `<div class="zyb"><div class="zyes">${ents}</div>
        <p class="sub">Trang này mỗi 1 phẩm thì ${Object.entries(Pg.st).map(([k, v]) => fmtStat(k, v)).join(", ")}. ${done ? '' : `Thu phục thủ lĩnh và ít nhất ${ZY_NEED} loại yêu vật thì đọc được hậu ký của trang này (hiện tại ${E.filter(e => !e.boss && zyOf(e.n)).length}/${ZY_NEED}${E.some(e => e.boss && zyOf(e.n)) ? '' : ", chưa thu phục thủ lĩnh"}).`}</p>
        ${done ? `<div class="hou"><h4>Hậu ký</h4>${Pg.hou.split('\n').map(t => `<p>${t}</p>`).join('')}</div>` : ''}</div>` : ''}</div>`; }).join('');
  return `<section class="panel zylu" id="zylu"><h3>Trấn Yêu Lục <small>${nAll}/${tot} loại</small><button class="qhelp sm" data-act="zyhelp" aria-label="Giải thích">?</button></h3>

    <h4 class="sub-h">Dịch Sứ <small>${CLASSES[cls].n}mang tối đa 2 con, chạm để mang hoặc thả</small></h4><div class="yis">${yiList}</div>
    <div class="zyps">${pages}</div></section>`;
}
// ---------- 主页面 ----------
const CH_THEME = [null, "Tỉnh", "Bảo vệ", "Tham", "Tâm", "Xả thân", "Sự thật", "Cái tên", "Sợ chết", "Đường về nhà", "Lần này đến lượt tôi"];
const CH_ACCENT = [null, '#7fd8b0', '#7fc46a', '#e86aa8', '#ff7a2a', '#9ae05a', '#9fd8ff', '#c9a0ff', '#f0d080', '#a0b8ff', '#ffd75a'];
const INTER = { 3: ["Màn chuyển 1", "Túy Tiên Lâu mở cửa lại", "Náo nhiệt", "Trời tối, cả con phố treo đầy đèn lồng đỏ."], 4: ["Màn chuyển 2", "Hội đèn Thất Tịch", "Tâm ý", "Đèn trên sông trôi xa dần, từng chiếc một."],
  6: ["Màn chuyển 3", "Giấc mơ ba trăm năm trước", "Đưa cơm", "Năm ấy, bạn mười lăm tuổi."], 8: ["Màn chuyển 4", "Đêm trước xuất chinh", "Từ biệt", "Trước khi trời sáng, ai cũng đã đến."] };
const hasProgress = () => !!(SAVE.run || storyCleared('normal') > 0 || CLASS_IDS.some(c => SAVE.chars[c].level > 1) || Object.keys(SAVE.world || {}).length);
// 开局挑门派：五张卡，写明打法和上手难度；底下说清楚以后能换、哪些东西五门共用
let CPICK = null;
const CLS_PICK = [['berserker', "Cận chiến", "Máu dày da cứng, càng đánh càng điên; máu càng ít, sát thương càng cao", '★', "Dễ chơi nhất"], ['paladin', "Cận chiến", "Chịu đòn giỏi nhất: bị đánh là phản chấn, tích đủ thì Kim Cương Chấn quét cả sân, còn tự hồi máu", '★', "Dễ"],
  ['mage', "Pháp thuật", "Vẽ bùa niệm chú, đánh lan gắn trạng thái rồi kích nổ; thân thể yếu nhất", '★★', "Trung bình"], ['assassin', "Ám Khí", "Nhanh nhất, hiểm nhất, chuyên giết một mục tiêu; đánh lan yếu", '★★★', "Khó"], ['necro', "Triệu hồi", "Lắc chuông điều khiển cương thi chiến đấu, bản thân núp phía sau", '★★★', "Khó"]];
const clsPickModal = () => `<h2 class="mh">Chọn một môn phái</h2><p class="sub cpk-sub">Có tất cả năm môn phái, chọn trước một phái hợp tay. Sau này chạm vào hình đầu ở trên cùng doanh trại để đổi người bất cứ lúc nào; bạc, túi đồ, tu vi, số tầng Ảo Cảnh năm phái dùng chung, cấp độ thì phái nào luyện phái nấy.</p>
  <div class="cpick">${CLS_PICK.map(([id, tag, d, st, hard]) => `<button class="cpk" data-act="clspick" data-arg="${id}"><span class="cpk-a">${heroSpr(id, 46)}</span>
    <span class="cpk-t"><b>${CLASSES[id].n}<em>${tag}</em></b><small>${d}</small></span><span class="cpk-h"><i>${st}</i><small>${hard}</small></span></button>`).join('')}</div>`;
function titleHTML() {
  const prog = hasProgress(), cls = SAVE.cls, lv = SAVE.chars[cls].level;
  const ch = SAVE.run ? SAVE.run.chapter : Math.min(10, storyCleared('normal') + 1);
  const emb = Array.from({ length: 18 }, (_, i) => `<i class="tl-emb" style="--x:${(i * 53) % 100}%;--d:${6 + (i * 7) % 9}s;--dl:${-(i * 1.3) % 9}s;--s:${2 + i % 3}px"></i>`).join('');
  return `<div class="title">
    <div class="tl-sky"><i class="tl-moon"></i><i class="tl-mtn a"></i><i class="tl-mtn b"></i><i class="tl-town"></i><i class="tl-fog a"></i><i class="tl-fog b"></i>${emb}</div>
    <div class="tl-head"><h1>Cửu U Hồi Lang</h1><p>Ba trăm năm trước, năm người làm đinh, thiên hồ làm khóa.</p></div>
    <div class="tl-menu">
      ${prog ? `<button class="btn big" data-act="tcont">Tiếp tục<small>${esc(CLASSES[cls].n)} cấp ${lv} · ${riftPath() && !SAVE.run && !storyCleared('normal') ? `Ảo Cảnh Cửu U · cao nhất tầng ${rTop()}` : esc(chTitle(ch))}${SAVE.test ? " · nhân vật chơi thử" : ''}</small></button>
        <button class="btn big tl-lb" data-act="tlb">Bảng xếp hạng<small>${lbTitleLine()}</small></button>` : `<button class="btn big" data-act="tpath" data-arg="story">Cốt truyện chính<small>Đi theo câu chuyện, mở khóa từng chương · Khuyên chơi lần đầu</small></button>
        <button class="btn big tl-rift" data-act="tpath" data-arg="rift">Thử thách Ảo Cảnh<small>Bỏ qua cốt truyện, cày thẳng; càng sâu mở càng nhiều</small></button>
        <button class="btn big tl-lb" data-act="tlb">Bảng xếp hạng<small>${lbTitleLine()}</small></button>`}
      <div class="tl-row">${prog ? "<button class=\"btn ghost\" data-act=\"tnew\">Chơi lại</button>" : ''}<button class="btn ghost" data-act="tsave">Lưu trữ</button><button class="btn ghost" data-act="tset">Cài đặt</button></div>
    </div>
    <p class="tl-sign">Tác phẩm của Đồ Dữ Hào</p>
    <p class="tl-lang">${[['zh', "中文"], ['vi', 'Tiếng Việt']].map(([k, n]) => `<a data-act="lang" data-arg="${k}" class="${(window.LANG || 'zh') === k ? 'on' : ''}">${n}</a>`).join(' · ')}</p>
    <p class="tl-foot">${storageOK ? `Tiến trình tự lưu trên thiết bị này${bkDue() ? " · <a data-act=\"tsave\">nên sao lưu</a>" : ''}` : "Trình duyệt này không cho lưu tiến độ"}</p>
  </div>`;
}
// 每章开头的「上回说到」
const CH_RECAP = {
  2: ["Bạn tỉnh dậy trong một nấm mồ ở Bãi Tha Ma, không nhớ gì cả.", "Sư phụ Lưu ở nhà quàn, nữ bộ khoái cô Trân, Ngoc ở tiệm thuốc… bạn hạ Huyện Lệnh Cương Thi, cứu Vương Nhị bán đậu phụ ra khỏi địa cung.", "Vương Nhị nói, kẻ bắt sáu người còn lại là một đạo sĩ áo trắng.", "Cây đinh gãy trong mộ, Ngoc lặng lẽ cất đi."],
  3: ["Bạn cứu Tiểu Hổ của tiêu cục về từ Rừng Hắc Phong, hạ Lang Yêu Vương, lấy được đinh Mộc.", "Giọng Thanh Mộc Tử vang lên: “Đinh còn, người còn.”", "Đinh hút dương khí, bạn suýt không tỉnh lại — chính Thanh Hư đạo trưởng của Bạch Vân Quán đã cứu bạn. Bạn giao đinh cho ông ta.", "Ngoc nghe chuyện, cái thuyền tán thuốc rơi xuống đất."],
  4: ["Trong Động Bàn Tơ, quản gia Khang vì tiền công của đám tiểu nhị mà giao ra cái khóa trường mệnh mẹ ông để lại.", "Bạn hạ Nhện Nương Nương, lấy được đinh Kim, nghe thấy giọng Kim Bất Hoán.", "Tấm mạng nhện thêu chín cái đuôi trong phòng kén là do “tiên trưởng áo trắng” đặt làm — mỗi người một thước.", "Đêm Túy Tiên Lâu mở cửa lại, Thanh Hư gửi đến một hộp hương an thần. Ngoc biến sắc."],
  5: ["Trong Hang Hỏa Diệm, cha con Trương Đại Chùy và Thiết Đản cùng nhau rèn một trái tim.", "Bạn lấy được đinh Hỏa, Liệt Dương Tử mắng bạn “khóc cái gì mà khóc”, bạn nhớ ra một nửa tên mình — “Thổ”.", "Dấu chu sa sau lá bùa tránh lửa giống hệt dấu trên xích sắt trong hầm mỏ.", "Đêm Thất Tịch, cô Trân lục được trên người tên trộm một tờ độ điệp của Bạch Vân Quán."],
  6: ["Sương độc ở Đầm Vạn Độc là do bùa của Bạch Vân Quán “thúc” ra.", "Ngoc đỡ cho bạn một nhát cắn của Xà Mẫu, lúc sốt cao cứ gọi mãi “A Thổ”. Bạn đã cứu cô ấy về.", "Đêm đó, cô đặt một cây đinh gãy vào tay bạn, rồi lại rút về: “…Chưa đến lúc.”"],
  7: ["Trong Hang Băng Côn Lôn, Huyền Băng Tử nhận ra bạn — “tiểu sư đệ”.", "Ba trăm năm trước, cậu bé đưa cơm A Thổ đã thay Bạch Vân Tử bỏ trốn trước trận, làm cây đinh thứ năm.", "Năm cây đinh là ổ khóa; gộp lại, chính là chìa khóa.", "Cuối cùng bạn cũng nhớ ra tên mình.", "Đêm đó bạn sốt cao, mơ thấy một con hồ ly trắng nói “Ta đợi ngươi”. Tỉnh dậy, Ngoc đang gục bên giường ngủ thiếp đi."],
  8: ["Ở chợ ma, trang Sổ Sinh Tử rách ghi: “A Thổ, mười lăm tuổi, giữ đinh thay huynh, hồn chưa tan.”", "Nhưng khi bạn về trấn Thanh Thạch, tiệm thuốc đã trống trơn. Trên quầy chỉ còn một chiếc chuông đuôi cáo và một mảnh giấy: “Tiền thuốc khỏi trả.”", "Cô Trân nói, cổng Bạch Vân Quán đã mở, bên trong toàn là người."],
  9: ["Trong Bạch Vân Quán, Thanh Hư xé đạo bào, lộ ra Bạch Vân Tử của ba trăm năm trước. Hắn bị hút xuống Thiên Khanh.", "Ngoc giằng khỏi lưới cửu vĩ, tự mình nhảy xuống, từ bên trong chống giữ cánh cửa: “Lần này… đến lượt ngươi tới đón ta.”", "Thiết Đản và Trương Đại Chùy đang thức trắng đêm rèn lại đinh Thổ."],
  10: ["Bạn qua Quỷ Môn Quan, đi qua đường Hoàng Tuyền và cầu Nại Hà. Đầu Trâu Mặt Ngựa thành đồng minh, Lôi Lão Hổ dẫn tiêu cục giữ miệng hố.", "Thiết Đản người đầy tro bụi, mang tới cây đinh Thổ còn đỏ rực.", "Con hồ ly trắng chín đuôi trong xiềng xích ngẩng đầu — “Ta đến đón ngươi rồi.”"],
};
const recapLines = ch => (CH_RECAP[ch] || []).map((t, i) => ['narr', (i ? '' : "【Hồi trước kể rằng】") + t]);
function playPrologue() {
  if (seen('prologue')) return; markSeen('prologue'); save();
  setTimeout(() => playDialog([
    ['narr', "Trấn Thanh Thạch. Một trấn nhỏ nơi biên ải, dựng trên một hồi lang cổ xưa."],
    ['narr', "Ba trăm năm trước, Cửu Vĩ Thiên Hồ cùng năm vị trấn yêu sư đã phong ấn Cửu U Ma Tôn dưới lòng trấn."],
    ['narr', "Ba trăm năm sau, phong ấn bắt đầu lỏng. Người chết bò ra khỏi mộ, dân trong trấn lần lượt mất tích."],
    ['narr', "Còn bạn, đang nằm giữa Bãi Tha Ma, chẳng nhớ nổi điều gì —"],
    ['narr', "(Chọn một nghề ở hàng trên cùng, rồi bấm “Xuất phát” để bắt đầu chương 1)"],
  ], null), 400);
}
// 特效「低」（省电）：把一直循环的装饰动画（呼吸、飘动、火苗……）停在第一帧，打击、飘字这些一次性的照放
let FXSW = 0;
function fxSweep() {
  clearTimeout(FXSW); if (SAVE.gfx !== 0 || !document.getAnimations) return;
  try { for (const a of document.getAnimations()) { const T = a.effect && a.effect.getTiming && a.effect.getTiming(); const el = a.effect.target; if (T && T.iterations === Infinity && a.playState === 'running' && !(el && el.closest && el.closest('.snowsc'))) a.pause(); } } catch (e) {}
  FXSW = setTimeout(fxSweep, 1500);
}
// ---------- 序 · 雪夜：三百年前，送饭的少年阿土在山道上救了一只白狐（第一章开场前播一次，江湖录·纪录里能重看）----------
const SNOW_BEATS = [
  { c: 'b1', t: "Ba trăm năm trước · Mùa đông", lines: [['', "Năm ấy tuyết rơi suốt bảy ngày bảy đêm."]] },
  { c: 'b2', lines: [['', "Trên đường núi, một con hồ ly trắng bị bẫy sắt của thợ săn kẹp chặt chân sau."], ['', "Nó vùng vẫy cả đêm, trên tuyết từng vòng từng vòng toàn là vết máu nó kéo lê."]] },
  { c: 'b3', lines: [['', "Một thiếu niên đưa cơm lên núi đi ngang qua. Cậu tên A Thổ, mười lăm tuổi, khoác giỏ cơm cho năm vị sư huynh."], ["A Thổ", "Đừng cắn tao nhé… để tao gỡ ra cho."]] },
  { c: 'b4', lines: [['', "Bẫy sắt “cạch” một tiếng bật ra. Cậu cởi áo bông quấn lấy nó, rồi bẻ nửa nắm cơm trong giỏ."], ["A Thổ", "Các sư huynh có hỏi thì tao bảo dọc đường đói bụng."], ["A Thổ", "Chạy đi. Đừng để bị bắt nữa."]] },
  { c: 'b5', lines: [['', "Hồ ly trắng chạy được mười mấy bước thì dừng lại, quay đầu nhìn cậu một cái."], ['', "Tuyết dày quá, A Thổ nhìn không rõ — phía sau nó kéo lê chín cái đuôi."]] },
  { c: 'b6', t: "Ba trăm năm sau", lines: [['', "Bãi tha ma. Một nấm mồ mới."]] },
];
function snowPrologue(done) {
  const el = document.createElement('div'); el.className = 'snowsc b1';
  const flakes = Array.from({ length: 46 }, (_, i) => `<i style="--x:${(i * 53) % 100}%;--s:${2 + (i % 4)}px;--d:${4 + (i % 7) * 0.9}s;--dl:-${(i * 0.37) % 6}s;--dx:${(i % 2 ? 1 : -1) * (10 + i % 25)}px"></i>`).join('');
  el.innerHTML = `<div class="ss-sky"></div><div class="ss-mtn"></div><div class="ss-snow">${flakes}</div><div class="ss-ground"></div>
    <div class="ss-fox"><div class="ss-tails">${Array.from({ length: 9 }, (_, i) => `<i style="--r:${-60 + i * 15}deg"></i>`).join('')}</div>${SPR.img('fox', 56, { O: '#ece6dc', W: '#ffffff', Y: '#ffdd55' })}<i class="ss-blood"></i><i class="ss-trap"></i><i class="ss-coat"></i><i class="ss-rice"></i></div>
    <div class="ss-boy">${unitIcon('villager', 78, { B: '#8a6a3a' }, '', 'stand')}<i class="ss-bask"></i></div>
    <div class="ss-title"></div><div class="ss-cap"></div><button class="ss-skip">Bỏ qua</button><div class="ss-tap">Chạm để tiếp tục</div>`;
  document.body.appendChild(el);
  let bi = 0, li = 0, over = false, tm = null;
  const cap = el.querySelector('.ss-cap'), ttl = el.querySelector('.ss-title');
  const show = () => { const B = SNOW_BEATS[bi]; el.className = 'snowsc ' + B.c; ttl.textContent = B.t || ''; ttl.classList.toggle('on', !!B.t);
    const [who, txt] = B.lines[li]; cap.innerHTML = `${who ? `<b>${esc(who)}</b>` : ''}<p>${esc(txt)}</p>`; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    clearTimeout(tm); tm = setTimeout(next, 3600 + txt.length * 70); };
  const fin = () => { if (over) return; over = true; clearTimeout(tm); el.classList.add('out'); setTimeout(() => { el.remove(); try { SFX.mood(curMood()); } catch (e) {} done && done(); }, 900); };
  const next = () => { if (over) return; const B = SNOW_BEATS[bi]; if (li < B.lines.length - 1) li++; else if (bi < SNOW_BEATS.length - 1) { bi++; li = 0; } else return fin(); show(); };
  el.addEventListener('click', e => { e.stopPropagation(); if (e.target.classList.contains('ss-skip')) fin(); else next(); });
  try { SFX.mood({ key: 'sad' }); } catch (e) {} show();
}
// 老存档（第一章已经开过头）没看过雪夜：回来的时候补放一次
function snowCatchUp() {
  const w1 = SAVE.world && SAVE.world[1];
  if (seen('snowfox') || !(storyCleared('normal') > 0 || (w1 && w1.main > 0))) return;
  setTimeout(() => { if (DLG || MODALFN || document.querySelector('.snowsc') || !(VIEW === 'town' || (VIEW === 'world' && !WAUTO))) return;   // 战斗、自动探索的时候不打断，下次回来再放
    markSeen('snowfox'); save(); snowPrologue(() => toast("Cốt truyện mới “Mở đầu · Đêm tuyết”, sau này có thể xem lại ở Giang Hồ Lục → Kỷ lục")); }, 700);
}
// 每章 / 幕间开场：3–5 秒的小动画，点一下可以跳过
function chapterIntro(o, done) {
  const el = document.createElement('div'); el.className = 'chint'; el.style.setProperty('--ac', o.ac || '#ffd75a');
  const emb = Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${2.5 + (i % 4) * 0.6}s;--dl:${(i % 5) * 0.25}s"></i>`).join('');
  el.innerHTML = `<div class="ci-ink"></div><div class="ci-emb">${emb}</div><div class="ci-box"><div class="ci-no">${esc(o.no)}</div><div class="ci-name">${esc(o.name)}</div>
    <div class="ci-theme"><span>${esc(o.theme)}</span></div><div class="ci-sub">${esc(o.sub || '')}</div></div><div class="ci-skip">Chạm để bỏ qua</div>`;
  document.body.appendChild(el); SFX.play('gong'); setTimeout(() => SFX.play('boss'), 1700);
  let over = false; const fin = () => { if (over) return; over = true; el.classList.add('out'); setTimeout(() => { el.remove(); done && done(); }, 450); };
  el.addEventListener('click', e => { e.stopPropagation(); fin(); });
  setTimeout(fin, 4600);
}
function chIntroFor(ch) { const C = CHAPTERS[ch - 1]; return { no: chTitle(ch).split('·')[0].trim(), name: (chTitle(ch).split('·')[1] || C.n || '').trim(), theme: CH_THEME[ch] || '', sub: C.sub, ac: CH_ACCENT[ch] }; }
function interIntroFor(ch) { const I = INTER[ch]; return I ? { no: I[0], name: I[1], theme: I[2], sub: I[3], ac: '#ffb05a' } : null; }
// 试玩：直接从某一章开始（测试用，原存档自动备份）
let TCLS = null, TEST_BAK = null;
// 换存档前把正在播的对话、选项框都收掉，免得上一个存档的剧情接着跑
function clearOverlays() { for (let i = 0; i < 60 && DLG; i++) endDlg(); const q = document.querySelector('#quiz'); if (q) { q.hidden = true; q.onclick = null; q.innerHTML = ''; } }
const testBackup = () => { try { return localStorage.getItem(TEST_BACKUP_KEY); } catch (e) { return TEST_BAK; } };
function testPanel() {
  const cls = TCLS || SAVE.cls, bak = testBackup() || TEST_BAK;
  return `<section class="panel"><h3>Chơi thử <small>Để thử nghiệm, không cần chơi từ đầu</small></h3>
    ${SAVE.test ? `<p class="help-p"><b style="color:var(--gold2)">Đang dùng nhân vật chơi thử (${CLASSES[SAVE.test.cls].n} · bắt đầu từ chương ${SAVE.test.ch}${SAVE.test.inter ? " màn chuyển" : ''})</b></p>` : ''}
    <p class="help-p">Chọn môn phái và chương, vào thẳng chương đó. Cấp, trang bị, tâm pháp, đồng hành, đạo cụ và món ăn của các chương trước đều chuẩn bị như “chơi bình thường đến chương này” (ví dụ chương 3: cấp 13, hai món hiếm, còn lại đồ xanh). Bản lưu của bạn được sao lưu trước, có thể quay lại bất cứ lúc nào.</p>
    <div class="row">${CLASS_IDS.map(c => `<button class="btn sm ${c === cls ? '' : 'ghost'}" data-act="tcls" data-arg="${c}">${CLASSES[c].n}</button>`).join('')}</div>
    <div class="row" style="margin-top:6px">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => `<button class="btn sm ghost" data-act="tstart" data-arg="${c}">Chương ${c}</button>`).join('')}</div>
    <div class="row" style="margin-top:6px">${[[3, "Màn chuyển 1"], [4, "Màn chuyển 2"], [6, "Màn chuyển 3"], [8, "Màn chuyển 4"]].map(([c, n]) => `<button class="btn sm ghost" data-act="tstart" data-arg="${c}i">${n}</button>`).join('')}</div>
    ${bak ? `<div class="row" style="margin-top:6px"><button class="btn sm" data-act="trestore">Về bản lưu của tôi</button></div>` : ''}
  </section>`;
}
const langRow = () => `<div class="row lang-row">${[['zh', "中文"], ['vi', 'Tiếng Việt']].map(([k, n]) => `<button class="btn sm ${(window.LANG || 'zh') === k ? '' : 'ghost'}" data-act="lang" data-arg="${k}">${n}</button>`).join('')}</div>`;
const setBasic = () => `<section class="panel"><h3>Ngôn ngữ</h3>${langRow()}</section><section class="panel"><h3>Chiến đấu</h3><div class="row"><button class="btn ghost" data-act="autocast">Ra chiêu khi đánh: ${SAVE.ultAuto === false ? "Thủ công" : "Tự động"}</button></div><p class="help-p">Thủ công: đến lượt ngươi thì dừng lại, chạm chiêu nào thì ra chiêu đó. Trong trận chạm chiêu nào cũng xem được mô tả.</p><div class="row"><button class="btn ghost" data-act="skiptog">Nút “Bỏ qua trận”: ${SAVE.showSkip ? "hiện" : "giấu đi"}</button></div><p class="help-p">Mặc định giấu đi, đánh từng trận mà xem mới có vị; muốn nhanh thì bật ở đây, trong trận sẽ hiện “Bỏ qua trận”.</p></section><section class="panel"><h3>Âm thanh</h3><div class="row"><button class="btn ghost" data-act="snd">Hiệu ứng: ${SAVE.sound ? "Bật" : "Tắt"}</button><button class="btn ghost" data-act="mus">Nhạc cổ cầm: ${SAVE.music ? "Bật" : "Tắt"}</button></div>
  <label class="volrow"><span>Âm lượng nhạc</span><input type="range" min="0" max="100" step="5" value="${Math.round(mvolOf() * 100)}" data-vol="m"><b id="mvolv">${Math.round(mvolOf() * 100)}%</b></label>
  <p class="help-p" style="margin:10px 0 6px">Nghe thử nhạc nền (chạm một cái là phát nhạc của nơi đó):</p>
  <div class="row mtest">${[['town', "Trấn Thanh Thạch"], ['c1', "Nghĩa địa"], ['c2', "Rừng Hắc Phong"], ['c3', "Động Bàn Tơ"], ['c4', "Hang Hỏa Diệm"], ['c5', "Đầm Vạn Độc"], ['c6', "Hang Băng Côn Lôn"], ['c7', "Chợ Ma"], ['c8', "Bạch Vân Quán"], ['c9', "Tầng Trên Cửu U"], ['c10', "Vực Sâu Cửu U"], ['sad', "Chuyện đêm bên lửa trại"], ['battle', "Đánh thường"], ['boss', "Đánh thủ lĩnh"]].map(([k, n]) => `<button class="btn sm ${MTEST && MTEST.id === k ? '' : 'ghost'}" data-act="mtest" data-arg="${k}">${n}</button>`).join('')}<button class="btn sm ghost" data-act="mtest" data-arg="">Dừng</button></div>
  <p class="help-p" style="margin-top:6px">Loa ngoài điện thoại không nghe được âm trầm, đeo tai nghe sẽ đầy đủ hơn. Hầu hết các nơi đều rất trống, hơn chục giây mới có một câu — là cố ý.</p></section>
    <section class="panel"><h3>Điều khiển</h3><p class="help-p">Trên bản đồ lớn: chạm đâu đi đó; chạm thanh nhiệm vụ phía trên để tự đi tới; trên máy tính dùng phím mũi tên hoặc WASD.</p><div class="row"><button class="btn ghost" data-act="joy">Cần điều khiển ảo: ${SAVE.joy ? "Bật" : "Tắt"}</button>
      <button class="btn ghost" data-act="fs">Cỡ chữ: ${({ 0.9: "Nhỏ", 1: "Vừa", 1.15: "Lớn", 1.3: "Rất lớn" })[SAVE.fs || 1] || "Vừa"}</button>
      <button class="btn ghost" data-act="guide">Chỉ dẫn nhiệm vụ: ${SAVE.guide === 'full' ? "Chi tiết" : "Manh mối"}</button></div>
      <p class="help-p">Chỉ dẫn “Manh mối”: chỉ cho biết đại khái ở vùng nào, đồ phải tự tìm; “Chi tiết”: đánh dấu thẳng vị trí.</p>
      </section><section class="panel"><h3>Hình ảnh</h3><div class="row"><button class="btn ghost" data-act="gfxq">Hiệu ứng: ${["Thấp (tiết kiệm pin)", "Vừa", "Cao"][SAVE.gfx != null ? SAVE.gfx : 2]}</button>
      <button class="btn ghost" data-act="cine">Hoạt cảnh bí kỹ: ${SAVE.cineOff ? "tắt" : "gọn"}</button>
      <button class="btn ghost" data-act="allnums">Số sát thương: ${SAVE.allNums ? "Hiện tất cả" : "Chỉ nhân vật chính"}</button>
      <button class="btn ghost" data-act="hdpx">Điểm ảnh: ${SAVE.hdOff ? "Cổ điển" : "Sắc nét"}</button></div>
      <p class="help-p">Điện thoại nóng, tốn pin thì chỉnh xuống “Thấp”: chế độ tiết kiệm pin — ít hạt hơn, bỏ khựng hình và quay chậm, các động tác chờ của nhân vật và cảnh dừng lại, bản đồ đứng yên thì vẽ ít khung hình hơn.</p></section>`;
// ---------- 存档备份 ----------
const fmtDay = t => { const d = new Date(t), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; };
const briefLine = b => `${esc(CLASSES[b.cls] ? CLASSES[b.cls].n : b.cls)} cấp ${b.lv} · ${b.ended ? "đã qua cả mười chương" : `đã qua ${b.cleared} chương`} · Bạc ${b.gold}`;
const bkDue = () => hasProgress() && (!SAVE.bk || (SAVE.bk.c || 0) < storyCleared('normal'));   // 打过新的一章还没备份
function markBackup() { SAVE.bk = { t: Date.now(), c: storyCleared('normal') }; }
const setSave = () => (prepZ(), '') + csPanel() + `<section class="panel"><h3>Mã đổi thưởng</h3><div class="row rdm-row"><input id="rdmIn" placeholder="Nhập mã đổi thưởng" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn sm" data-act="redeem">Đổi</button></div></section><section class="panel bkp"><h3>Sao lưu tiến trình</h3>
      <p class="help-p">Tiến trình chỉ nằm trong trình duyệt này trên thiết bị này: xóa bộ nhớ đệm, đổi điện thoại hay mở bằng trình duyệt khác là mất. Nên sao lưu sau mỗi chương.</p>
      <p class="bk-now"><b>Tiến trình hiện tại</b>${briefLine(saveBrief(SAVE))}<small>${SAVE.bk ? `Sao lưu lần trước: ${fmtDay(SAVE.bk.t)}` : "Chưa sao lưu lần nào"}</small></p>
      <div class="row"><button class="btn sm" data-act="export">Sao chép mã lưu</button><button class="btn sm ghost" data-act="bkfile">Lưu thành tệp</button></div>
      <p class="help-p bk-tip">Mã lưu là một chuỗi ký tự dài. Sao chép rồi gửi cho chính mình (ví dụ Zalo “Cloud của tôi”, Messenger) để cất; nếu dài quá không gửi được thì dùng “Lưu thành tệp”.</p>
      <h3 style="margin-top:14px">Khôi phục tiến trình</h3>
      <textarea id="imp" placeholder="Dán mã lưu vào đây"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="import">Đọc mã lưu</button><button class="btn sm ghost" data-act="bkpick">Khôi phục từ tệp</button><input type="file" id="bkf" accept=".txt,text/plain" hidden></div>
      <div class="row" style="margin-top:14px"><button class="btn sm ghost" data-act="reset">Xóa lưu, chơi lại từ đầu</button></div></section>`;
let IMPORTING = null;
const importModal = () => () => { const a = saveBrief(IMPORTING), b = saveBrief(SAVE), older = hasProgress() && (a.cleared < b.cleared || (a.cleared === b.cleared && a.lv < b.lv));
  return `<h2 class="mh">Khôi phục bản lưu này?</h2>
    <div class="bk-cmp"><div class="in"><small>Tiến trình trong mã lưu</small><b>${briefLine(a)}</b>${a.t ? `<small>Lưu lúc ${fmtDay(a.t)}</small>` : ''}</div>
    ${hasProgress() ? `<div><small>Tiến trình hiện có trên thiết bị này (sẽ bị ghi đè)</small><b>${briefLine(b)}</b>${b.t ? `<small>Lưu lúc ${fmtDay(b.t)}</small>` : ''}</div>` : ''}</div>
    ${older ? "<p class=\"bk-warn\">Chú ý: tiến trình trong mã lưu còn ít hơn hiện tại. Bạn chắc chắn muốn lấy bản cũ ghi đè bản mới?</p>" : ''}
    <div class="row"><button class="btn" data-act="doimport">Khôi phục bản lưu này</button><button class="btn ghost" data-act="imcancel">Hủy</button></div>`; };
let ZCODE = null;   // 提前压好的短存档码（JY2）。点「复制」那一下必须同步完成，所以面板一打开就先压好
function prepZ() { ZCODE = null; exportSaveZ().then(c => { ZCODE = c; }).catch(() => {}); }
async function tryImport(str) {
  try { IMPORTING = await decodeSaveAny(str); } catch (e) { IMPORTING = null; return toast(e.message === 'cut' ? "Mã lưu không đầy đủ: có thể bị cắt khi sao chép, hãy sao chép lại cho trọn" : e.message === 'old' ? "Trình duyệt này quá cũ, không đọc được mã lưu này — hãy mở game bằng trình duyệt khác rồi khôi phục" : "Đây không phải mã lưu, hãy kiểm tra lại"); }
  BACK = MODALFN; openModal(importModal());
}
// 选章试玩：测试用，平时折起来，不打扰正常游玩
const testFold = () => `<details class="testfold" ${SAVE.test || testBackup() || TEST_BAK ? 'open' : ''}><summary>Chơi thử theo chương <small>để thử nghiệm</small></summary>${testPanel()}</details>`;
let STAB = 'base';
// 设置（2026-11 一屏）：分成常规、声音、存档、指南
const secOf = (html, t) => { const m = html.split('</section>').map(x => x + '</section>').filter(x => x.includes('<section')); return m.filter(x => t.some(k => x.includes('<h3>' + k))).join(''); };
function setTab() {
  const B0 = setBasic();
  const tabs = [['base', "Chung"], ['snd', "Âm thanh"], ['save', "Lưu trữ"], ['help', "Hướng dẫn"]];
  const body = STAB === 'snd' ? secOf(B0, ["Âm thanh"]) : STAB === 'save' ? setSave() : STAB === 'help' ? `<section class="panel"><h3>Cẩm nang giang hồ</h3>
      <ul class="help">
        <li><b>Cốt truyện</b>: mười chương truyện, mỗi chương ba tầng mê cung. Mỗi tầng phải hạ “yêu tướng giữ cửa” lấy chìa khóa mới mở được cửa thủ lĩnh. Tầng ba là thủ lĩnh lớn của chương.</li>
        <li><b>Khám phá</b>: chạm vào địa điểm trên bản đồ, nhân vật sẽ tự đi tới; cũng có thể bật “Tự khám phá”, có chuyện mới dừng lại.</li>
        <li><b>Chiến đấu</b>: mặc định tự ra chiêu. Bạn chỉ cần chọn đường, xử lý kỳ ngộ, thay trang bị, xếp chiêu thức. Khí huyết dưới 35% sẽ tự uống đan dược.</li>
        <li><b>Mạnh lên chỉ có bốn đường</b>: trang bị (phẩm chất, cường hóa, tẩy luyện, khảm ngọc), lưu phái (bộ, thần binh, Túi Càn Khôn, chiêu thức, Dịch Sứ), linh ngọc, tu vi. Tâm pháp và tu vi mặc định tự cộng điểm.</li>
        <li><b>Cường hóa, lỗ, ngọc ghi trên vị trí</b>: đổi trang bị không mất. Bấm một món trang bị, hàng trên cùng là Cường hóa, Tẩy luyện, Điểm hóa, Khảm ngọc.</li>
        <li><b>Khi nào mở</b>: trong cốt truyện chương 6 có Túi Càn Khôn, chương 7 có biến chiêu. Phá đảo xong (hoặc ngay từ đầu đi “Thử thách Ảo Cảnh”) thì mở Ảo Cảnh Cửu U, những thứ khác mở dần theo số tầng Ảo Cảnh đã thông: tầng 3 cường hóa, tầng 8 khảm ngọc, tầng 10 truy nã, tầng 15 tẩy luyện, tầng 25 điểm hóa, tầng 30 linh ngọc, tầng 40 tu vi.</li>
        <li><b>Kim Thiềm Chiêu Tài</b>: thỉnh thoảng xuất hiện trong mê cung, vài lượt sau sẽ chạy mất, giết được thì rơi đầy bảo vật.</li>
        <li>Chết không mất trang bị, kinh nghiệm hay nguyên liệu nào.</li>
      </ul></section>${testFold()}` : secOf(B0, ["Ngôn ngữ", "Chiến đấu", "Thao tác", "Hình ảnh"]);
  return tpane(tabs, STAB, 'stab', body);
}
// ---------- 迷宫 ----------
function roomIcon(run, c) {
  const F = themeOf(run);
  if (c.type === 'start') return SPR.img('stairs', 30);
  if (c.type === 'shop') return SPR.img('bag', 30);
  if (c.cleared) return c.type === 'rest' ? '<span class="ash"></span>' : '';
  if (!c.visited && hasMod(run, 'dark') && c.type !== 'boss') return '<span class="unk">?</span>';
  switch (c.type) {
    case 'battle': { const m = F.mons[c.mon]; return SPR.img(m.spr, 30, m.pal); }
    case 'elite': { const m = F.mons[c.mon]; return SPR.img(m.spr, 34, m.pal, 'elite-ic'); }
    case 'keeper': return SPR.img('key', 34, null, 'glow');
    case 'goblin': return SPR.img('toad', 32, null, 'glow');
    case 'story': return SPR.img('ngoc', 32, null, 'glow');
    case 'page': return SPR.img('scroll', 32, null, 'glow');
    case 'empty': return '';
    case 'boss': {
      const bd = run.mode === 'story' && run.floor < 3 ? F.mons[F.guards[run.floor - 1].m] : F.boss;
      return SPR.img(bd.spr, 40, bd.pal) + (bossLocked(run) ? `<span class="lockic">${SPR.img(run.mode === 'rift' ? 'portal' : 'lock', 22)}</span>` : '');
    }
    case 'event': return SPR.img('fu', 30);
    case 'chest': return SPR.img('chest', 30);
    case 'gold': return SPR.img('ingot', 30);
    case 'rest': return SPR.img('fire', 30);
    default: return '';
  }
}
const TERRAIN = [
  { g: '#1a1511', p: '#4a3a2a', d: [['tomb'], ['deadtree'], ['mound']] },
  { g: '#101a12', p: '#3e3a24', d: [['pine'], ['pine', { G: '#2a4a30' }], ['deadtree']] },
  { g: '#16111c', p: '#3a3046', d: [['cobweb'], ['rock', { G: '#3a3440', H: '#5a5266' }], ['cobweb']] },
  { g: '#200f09', p: '#4a2818', d: [['crack'], ['rock', { G: '#4a2a1e', H: '#7a3a22' }], ['crack']] },
  { g: '#111a10', p: '#344028', d: [['deadtree', { B: '#2a3a20' }], ['mound', { D: '#2a3a1e' }], ['rock', { G: '#2e3a28', H: '#4a5a3a' }]] },
  { g: '#101a26', p: '#34485c', d: [['crystal'], ['rock', { G: '#4a5a6a', H: '#8aa0b8' }], ['crystal']] },
  { g: '#140f17', p: '#3a2c3c', d: [['lantern'], ['tomb'], ['lantern', { R: '#2a9a7a', Y: '#c8fff0' }]] },
  { g: '#17150f', p: '#46402e', d: [['pine'], ['lantern', { R: '#c8c0b0', Y: '#fff6d0' }], ['rock']] },
  { g: '#1e0c0b', p: '#4a2018', d: [['crack'], ['tomb', { G: '#4a2a2a' }], ['rock', { G: '#3a1a1a', H: '#5a2a22' }]] },
  { g: '#130a1a', p: '#36203f', d: [['crack', { O: '#b04aff', Y: '#e8b0ff' }], ['crystal', { C: '#7a3ab8', W: '#e0b0ff' }], ['deadtree']] },
];
const terrainOf = run => TERRAIN[(run.mode === 'rift' ? run.theme : run.chapter - 1) % TERRAIN.length];
const cellPos = c => `left:${(c.x + 0.5) * 100 / MW}%;top:${(c.y + 0.5) * 100 / MH}%`;
function mapHTML() {
  const run = SAVE.run, M = run.maze, T = terrainOf(run), cw = 100 / MW, chh = 100 / MH;
  const rnd = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + (run.floor * 7 + k) * 78.233) * 43758.5453; return x - Math.floor(x); };
  let deco = '', cor = '', places = '';
  const mask = [];
  for (const c of M.cells) {
    if (!c.room) {
      const n = rnd(c.i, 9) < 0.55 ? 2 : 1;
      for (let k = 0; k < n; k++) { const D = T.d[Math.floor(rnd(c.i, k) * T.d.length)];
        deco += `<span class="deco" style="left:${(c.x + 0.18 + rnd(c.i, k + 3) * 0.64) * cw}%;top:${(c.y + 0.2 + rnd(c.i, k + 5) * 0.6) * chh}%">${SPR.img(D[0], 30 + Math.round(rnd(c.i, k + 7) * 16), D[1])}</span>`; }
    }
    if (c.seen) mask.push(`radial-gradient(ellipse ${c.visited ? '34% 28%' : '20% 17%'} at ${(c.x + 0.5) * cw}% ${(c.y + 0.5) * chh}%, #000 45%, transparent 100%)`);
  }
  for (const c of M.cells) for (const j of c.links) {
    if (j < c.i) continue; const d = M.cells[j];
    if (!(c.visited || d.visited) || !(c.seen && d.seen)) continue;
    if (d.y === c.y) cor += `<i class="cor h" style="left:${(Math.min(c.x, d.x) + 0.5) * cw}%;top:${(c.y + 0.5) * chh}%;width:${cw}%"></i>`;
    else cor += `<i class="cor v" style="left:${(c.x + 0.5) * cw}%;top:${(Math.min(c.y, d.y) + 0.5) * chh}%;height:${chh}%"></i>`;
  }
  for (const c of M.cells) {
    if (!c.seen || !c.room) continue;
    const here = c.i === run.pos, can = !here && !!pathTo(run, c.i);
    const hide = !c.visited && hasMod(run, 'dark') && c.type !== 'boss';
    const label = hide ? "Chưa rõ" : (ROOM_TYPES[c.type] || { n: '' }).n + (c.cleared && c.type !== 'shop' ? " (đã dọn)" : '');
    places += `<button class="place ${c.visited ? 'vis' : 'seen'} ${here ? 'here' : ''} t-${hide ? 'unknown' : c.type} ${can ? 'can' : ''} ${FRESH.has(c.i) ? 'fresh' : ''}" style="${cellPos(c)}" ${can ? '' : 'disabled'} data-act="cell" data-arg="${c.i}" aria-label="${label}" title="${label}">
      <span class="pl-base"></span><span class="pl-ic">${roomIcon(run, c)}</span></button>`;
  }
  FRESH = new Set();
  const rooms = M.cells.filter(c => c.room), vis = rooms.filter(c => c.visited).length;
  const hint = run.mode === 'rift'
    ? (bossLocked(run) ? "Diệt yêu lấp đầy tiến độ, <b>yêu vương giữ ải</b> sẽ xuất hiện." : "Yêu vương giữ ải đã xuất hiện!")
    : (run.hasKey ? (run.floor < 3 ? "Chìa khóa trong tay, đi hạ thủ lĩnh tầng này." : `Chìa khóa trong tay, <b>${themeOf(run).boss.n}</b> ở ngay phía trước.`) : "Tìm <b>yêu tướng giữ cửa</b> (biểu tượng chìa khóa), cướp chìa khóa mới mở được cửa thủ lĩnh.");
  return `${runBar(run)}
    ${run.mode === 'rift' ? `<div class="rprog"><i style="width:${run.prog}%"></i><span>Tiến độ Ảo Cảnh ${Math.floor(run.prog)}%</span></div>${xiangBar(run)}` : ''}
    <p class="maphint">${hint}<span class="sub"> ${vis}/${rooms.length}</span></p>
    <div class="maze2" style="--g:${T.g};--p:${T.p}">
      <div class="terrain" style="-webkit-mask-image:${mask.join(',')};mask-image:${mask.join(',')}">${deco}${cor}</div>
      ${places}
      <div class="walker" id="walker" style="${cellPos(M.cells[run.pos])}">${heroSpr(run.cls, 40)}</div>
    </div>
    <div class="mapctl"><button class="btn ${AUTO ? '' : 'ghost'} autob" data-act="auto">${AUTO ? "Đang tự khám phá…" : "Tự khám phá"}</button>
      <button class="btn ghost" data-act="bag">Nhân vật${talentInfo(run.cls).free ? ` <b class="upn">${talentInfo(run.cls).free}</b>` : ''}</button><button class="btn ghost" data-act="retreat">Rút lui</button></div>`;
}
const STEP_MS = 170;
function walkTo(i) {
  const run = SAVE.run; if (WALKING || !run) return;
  const c = run.maze.cells[+i];
  if (c.type === 'boss' && !c.cleared && bossLocked(run)) { const r = moveTo(run, +i); SFX.play('fail'); stopAuto(); return toast(r.err); }
  const path = pathTo(run, +i); if (!path) return;
  WALKING = true;
  const w = $('#walker'), steps = path.slice(1); let k = 0;
  const step = () => {
    if (!SAVE.run || VIEW !== 'map') { WALKING = false; return; }
    if (k >= steps.length) { WALKING = false; if (w) w.classList.remove('walking'); return onCell(i); }
    const n = run.maze.cells[steps[k++]];
    if (w) { w.classList.add('walking'); const nx = (n.x + 0.5) * 100 / MW; w.classList.toggle('flip', nx < parseFloat(w.style.left)); w.style.left = nx + '%'; w.style.top = (n.y + 0.5) * 100 / MH + '%';
      const im = w.querySelector('img'), C = CLASSES[run.cls]; if (im) { im.src = SPR.walkUrl(C.spr, C.pal, k % 2 ? 1 : 3); setTimeout(() => { if (im.isConnected) im.src = SPR.walkUrl(C.spr, C.pal, 0); }, STEP_MS / 2); } }
    if (k % 2) SFX.play('step');
    setTimeout(step, STEP_MS);
  };
  step();
}
function stopAuto() { if (AUTO) { AUTO = false; const b = document.querySelector('.autob'); if (b) { b.classList.add('ghost'); b.textContent = isRift(SAVE.run) ? "Tự tìm yêu" : "Tự khám phá"; } } clearTimeout(autoT); }
function autoTarget(run) {
  const cells = run.maze.cells, prev = { [run.pos]: -1 }, q = [run.pos];
  while (q.length) {
    const i = q.shift(), c = cells[i];
    if (i !== run.pos && !c.visited) { if (c.type !== 'boss') return i; continue; }
    for (const j of c.links) if (!(j in prev)) { prev[j] = i; q.push(j); }
  }
  return null;
}
function autoStep() {
  clearTimeout(autoT);
  if (!AUTO || !SAVE.run || VIEW !== 'map' || WALKING) return;
  if (DLG || MODALFN) { autoT = setTimeout(autoStep, 500); return; }
  const run = SAVE.run;
  if (run.hp < runStats(run).maxHp * 0.3 && run.potions === 0) { stopAuto(); return toast("Khí huyết quá thấp mà đan dược đã hết, tạm dừng tự khám phá. Tìm lửa trại nghỉ chân, hoặc đổi trang bị."); }
  const t = autoTarget(run);
  if (t == null) { stopAuto(); return toast(run.mode === 'rift' ? (bossLocked(run) ? "Tầng này đã đi hết." : "Yêu vương giữ ải đã xuất hiện, sẵn sàng thì đi khiêu chiến.") : run.hasKey ? "Tầng này đi khắp rồi, thủ lĩnh ở ngay phía trước." : "Đi khắp rồi… chìa khóa chắc chắn ở trên người yêu tướng giữ cửa."); }
  walkTo(t);
}
function onCell(i) {
  const run = SAVE.run, before = new Set(run.maze.cells.filter(c => c.seen).map(c => c.i)), r = moveTo(run, +i);
  if (!r.err) FRESH = new Set(run.maze.cells.filter(c => c.seen && !before.has(c.i)).map(c => c.i));
  if (r.err) { SFX.play('fail'); stopAuto(); return toast(r.err); }
  SFX.play(r.fresh ? 'door' : 'step');
  const c = r.cell, C = run.mode === 'story' ? CHAPTERS[run.chapter - 1] : null;
  EVRES = null; CHEST = null;
  if (c.type === 'shop') { enterShop(run); VIEW = 'shop'; save(); return render(); }
  if (c.cleared) { save(); return render(); }
  switch (c.type) {
    case 'boss':
      if (C && run.floor === 3 && !seen('b' + run.chapter)) { save(); render(); markSeen('b' + run.chapter); return playDialog(C.preboss, C.boss, () => beginBattle('boss')); }
      return beginBattle('boss');
    case 'battle': case 'elite': case 'keeper': case 'goblin': return beginBattle(c.type);
    case 'story': {
      save(); render();
      return playDialog(C.story.lines, C.boss, () => { const got = applyStoryReward(run, C.story.reward); clearCell(run); save(); render(); SFX.play('rare'); if (got.length) toast(got.join(" · ")); });
    }
    case 'page': { const txt = collectPage(run); clearCell(run); save(); render(); SFX.play('legend'); openModal(pageModal(run.chapter, txt)); achToast(checkAch()); return; }
    case 'event': if (!c.ev) c.ev = RNG.pick(EVENTS).id; VIEW = 'event'; break;
    case 'rest': VIEW = 'rest'; break;
    case 'chest': CHEST = openChest(run); clearCell(run); VIEW = 'chest'; SFX.play('loot'); break;
    case 'gold': { const g = EV.gold(run, 6); clearCell(run); SFX.play('coin'); toast(`Nhặt được ${g} lượng bạc`); break; }
    default: { clearCell(run); if (RNG.ch(0.12)) { const n = EV.mats(run, 1); toast(`Trong góc có ${n} viên hồn tinh`); } }
  }
  save(); render();
}
const pageModal = (k, txt) => () => `<div class="pagebig">${SPR.img('scroll', 64)}<h2 class="mh">Tàn quyển · phần ${CN[k]}</h2><p>${esc(txt)}</p><small>Vĩnh viễn: sát thương +1%, khí huyết +1%</small>
  <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-act="close">Cất kỹ</button></div></div>`;

// ---------- 战斗 ----------
function beginBattle(kind) {
  B = startBattle(SAVE.run, kind); B.logs = []; BRES = null; VIEW = 'battle'; B.ultAuto = B.castAuto = SAVE.ultAuto !== false; COMBO = { n: 0, t: null }; save(); render();   // 出招自动/手动跟着设置
  if (B.yiPops && B.yiPops.length) { const yp = B.yiPops; B.yiPops = null; setTimeout(() => { if (!B || B.over) return; [...new Set(yp.map(p => p[3]))].forEach(id => yiFlash(id, YISHI[id].n)); updBattle({ lines: [], pops: yp.map(p => p.slice(0, 3)), actor: null }, true); }, 500); }
  const run = SAVE.run, F = themeOf(run);
  const bossName = kind === 'boss' ? B.units.find(u => u.kind === 'boss').name : '';
  B.logs.push({ boss: run.mode === 'rift' ? `${bossName} xuất hiện!` : run.floor < 3 ? `${bossName} chặn đường!` : `${F.boss.n} xuất hiện! ${F.boss.d}.`, keeper: "Yêu tướng giữ cửa chặn đường!", elite: B.units.some(u => u.rare) ? "Một yêu vật có danh hiệu chặn đường!" : "Một yêu vật tinh anh chặn đường!", goblin: "Kim Thiềm Chiêu Tài! Mau hạ nó trước khi nó chuồn mất!" }[kind] || "Yêu vật lao tới!");
  SFX.play(kind === 'boss' ? 'gong' : kind === 'goblin' ? 'coin' : 'door');
  if (kind === 'boss' && run.mode === 'story' && run.floor === 3) banner(F.boss.n, F.boss.d, 1800);
  updBattle(null); schedule();
}
const CAST_NAMES = { ngocHeal: "ném tới một bình thuốc", foxHeal: "dùng hồ hỏa chữa thương cho bạn", foxfire: "phóng ra một đốm hồ hỏa", foxfireAll: "hồ hỏa ngập trời", potionThrow: "ném ra một bình thuốc “không biết là thuốc gì”",
  blade2: "vung đao chém xuống", chain2: "quăng xích sắt", zhengjue: "niệm một câu chính khí quyết", zhengqi: "cao giọng ngâm «Chính Khí Ca»", gen: '', bossHeal: "hút độc khí hồi máu", roar: "ngửa mặt hú dài", enrage: "nổi cuồng bạo", web: "nhả tơ quấn lấy bạn", summon: "gọi đồng bọn tới", phase: "hiện nguyên hình", phoenix: "Lông phượng hoàng bùng cháy" };
function narrate(o) {
  if (!o.actor || !o.cast || !B) return '';
  if (o.ult) return o.ult.auto ? "Bạn quát lớn một tiếng, cắt đứt yêu vật đang tụ lực!" : `Bạn thi triển bí kỹ “${o.ult.n}”!`;
  if (o.cast.id === 'charge') return '';
  const u = B.units.find(x => x.id === o.actor); if (!u) return '';
  const dmg = o.pops.filter(p => /^\d+$/.test(p[1])).reduce((a, p) => a + +p[1], 0);
  const crit = o.pops.some(p => p[2] === 'crit' && /^\d+$/.test(p[1]));
  const c = o.cast, who = u.kind === 'hero' ? "Bạn" : u.name;
  let what;
  if (c.id === 'gen') { const k = CLASSES[u.cls] && CLASSES[u.cls].skills.find(x => x.id === c.sk); what = k ? `thi triển “${k.n}”` : "ra đòn"; }
  else if (CAST_NAMES[c.id]) what = CAST_NAMES[c.id];
  else if (u.kind === 'hero') { const k = CLASSES[u.cls].skills.find(s => s.id === c.id); what = k ? `thi triển “${k.n}”` : "ra đòn"; }
  else if (c.id === 'bossAoe') what = "thi triển yêu pháp diện rộng";
  else if (u.kind === 'minion') what = "vồ tới";
  else what = c.elem && c.elem !== 'phys' ? "thi triển yêu pháp" : "cắn xé";
  return `${who}${isVi() ? ' ' : ''}${what}${dmg ? `, gây ${dmg} sát thương${crit ? " (chí mạng)" : ''}` : ''}`;
}
const spdF = () => ({ 1: 1, 2: 0.5, 3: 0.33 }[SAVE.speed] || 1);   // 2026-11-23 最高 3 倍（原来 4 倍，用户定）
function schedule(o) {
  clearTimeout(timer); if (!B || B.over) return;
  let ms = o ? Math.min(800, Math.max(120, (o.dt || 8) * 18)) * spdF() : 500;
  if (o && o.ult) ms += ULT_MS(); else if (o && o.cast && (o.cast.id === 'phase' || o.cast.id === 'enrage')) ms += CUT_MS();
  if (o && o.foilKey) ms += 950 * spdF();
  timer = setTimeout(tick, ms);
}
const CUT_MS = () => SAVE.speed >= 3 ? 700 : SAVE.speed === 2 ? 900 : 1150;
const ULT_MS = () => SAVE.cineOff ? 0 : SAVE.speed >= 3 ? 320 : 500;   // 秘技：顶上一条细横幅，不压暗、不挡人
function tick() {
  if (!B || VIEW !== 'battle') return;
  // 手动出招：轮到你时停下来等你点
  if (!B.castAuto && !B.over) { const nx = turnOrder(B, 1)[0]; if (nx === B.P && !B.P.st.frozen && !B.castReq && !B.ultReq) { B.waiting = true; applyStep(null); return; } }
  B.waiting = false;
  const o = battleStep(B); const nl = narrate(o); if (nl && !(o.lines.length && !o.pops.some(p => /^\d+$/.test(p[1])))) B.logs.push(nl); B.logs.push(...o.lines); updBattle(o, true);
  if (B.over) setTimeout(endBattle, o.ult ? ULT_MS() + 300 : 250); else schedule(o);
}
function skipBattle() {
  clearTimeout(timer); let n = 0; B.ultAuto = true; B.castAuto = true;
  while (!B.over && n++ < 8000) { const o = battleStep(B); B.logs.push(...o.lines); }
  updBattle(null); endBattle();
}
function endBattle() {
  if (BRES) return;
  if (SAVE.run && SAVE.run.mode === 'tower') return twEndUI();
  BRES = finishBattle(B);
  if (BRES.win) { clearCell(SAVE.run); VFX.victory('P'); }
  if (BRES.win && isRift(SAVE.run) && B.kind !== 'boss') {   // 幻境里的普通合战：不停下来看结算，掉的东西记在这一局里，回地图接着打
    const run = SAVE.run, n = B.dead.length, good = BRES.items.filter(i => i.anc || i.rarity === 'legend' || i.rarity === 'set');
    save(); flushBattleToasts(); SFX.play(good.length ? 'legend' : BRES.levels ? 'level' : 'win');
    qtoast(`Diệt ${n} con · tiến độ ${Math.floor(run.prog)}%${BRES.items.length ? ` · ${BRES.items.length} món trang bị` : ''}`);
    for (const it of good) if (it.anc === 3) jyBanner(it); else qtoast(`Nhận được <b class="r-${it.rarity}">${esc(itemTitle(it))}</b>`);
    if (BRES.jyx) qtoast(`Cửu U Huyền Tinh +${BRES.jyx}`);
    if (BRES.zy && BRES.zy.length) qtoast(`Tinh phách +${BRES.zy.length}`);
    if (BRES.mount) qtoast(`Nhận thú cưỡi “<b>${MOUNTS[BRES.mount].n}</b>”${BRES.mountOn ? ", đã cưỡi lên rồi" : " (đổi trong Đồ giám ở Giang Hồ Lục)"}`);
    if (BRES.yiNew) qtoast(`Mở khóa Dịch Sứ “<b>${YISHI[BRES.yiNew].n}</b>”${BRES.yiOn ? ", đã mang theo rồi" : "(ở trang xuất chinh, bấm hàng Dịch Sứ để mang theo)"}`);
    if (BRES.levels) qtoast(SAVE.chars[run.cls].level >= MAX_LV ? `Đột phá tu vi: ${realmName(SAVE.para.lv)}` : `Lên cấp! Giờ là cấp ${SAVE.chars[run.cls].level}`);
    achToast(BRES.ach); BRES.items.forEach(i => delete i.auto);
    return setTimeout(() => { if (BRES && VIEW === 'battle') battleContinue(); }, 500);
  }
  save(); showRes(); BRES.items.filter(i => i.anc === 3).forEach(jyBanner);
  if (!BRES.win && isRift(SAVE.run) && WAUTO && (RDEATH < 1 || (WKEY && WKEY.key && WKEY.key.rboss && rBossGain(B)))) setTimeout(() => { if (BRES && !BRES.win && VIEW === 'battle' && WAUTO) battleContinue(); }, 2400);   // 自动闯关：第一次倒下自己爬起来；打妖王时只要这次打掉了一截，就接着爬起来
  if (!BRES.win && !(WKEY && WKEY.key && WKEY.key.scripted)) SFX.play('lose');
  else if (BRES.items.some(i => i.anc || i.rarity === 'legend' || i.rarity === 'set')) SFX.play('legend');
  else if (BRES.levels) SFX.play('level');
  else if (BRES.key) SFX.play('key');
  else SFX.play('win');
  achToast(BRES.ach);
}
function flushBattleToasts() { const q = BTOAST; BTOAST = []; q.forEach((m, i) => setTimeout(() => toast(m), 400 + i * 2800)); }
function showRes() {
  const el = $('#bres'); if (!el || !BRES) return;
  flushBattleToasts();
  $('#bctl').hidden = true;
  const run = SAVE.run, ch = SAVE.chars[run.cls];
  const extra = [BRES.mats ? `Hồn tinh +${BRES.mats}` : '', BRES.jyx ? `<b class="jyx">Cửu U Huyền Tinh +${BRES.jyx}</b>` : '', BRES.key ? "<b style=\"color:var(--gold2)\">Lấy được chìa khóa!</b>" : '',
    BRES.goblin === 'killed' ? "<b style=\"color:var(--gold2)\">Bắt được Kim Thiềm rồi!</b>" : BRES.goblin === 'fled' ? "Kim Thiềm chuồn mất rồi…" : ''].filter(Boolean).join(" · ");
  const lvText = BRES.levels ? ` <b style="color:var(--gold2)">${ch.level >= MAX_LV ? `Đột phá tu vi: ${realmName(SAVE.para.lv)}!` : `Lên cấp! Giờ là cấp ${ch.level}, nhận điểm tâm pháp`}</b>` : '';
  const cont = run.world ? "Tiếp tục" : B.kind === 'boss' ? (run.mode === 'rift' ? "Hoàn thành Ảo Cảnh" : run.floor < 3 ? "Xuống tầng tiếp" : "Hết chương") : "Tiếp tục khám phá";
  if (BRES.mount) { BTOAST.push(`Thắng dị thú Sơn Hải, nhận thú cưỡi “<b>${MOUNTS[BRES.mount].n}</b>”${BRES.mountOn ? ", đã cưỡi lên rồi" : ''}. Thú cưỡi chỉ để đi đường cho đẹp, không cộng chỉ số; đổi trong Đồ giám ở Giang Hồ Lục.`); flushBattleToasts(); }
  if (BRES.yiNew) { const Y = YISHI[BRES.yiNew]; BTOAST.push(`Thu phục tinh phách thủ lĩnh, mở khóa Dịch Sứ “<b>${Y.n}</b>”${BRES.yiOn ? ", đã mang theo rồi" : "(Dịch Sứ đã đủ hai con, ở trang xuất chinh bấm hàng Dịch Sứ để đổi)"}: ${Y.d(yiGrade(BRES.yiNew))}. Từ trận sau nó sẽ theo bên cạnh bạn.`); flushBattleToasts(); }
  const autoEq = BRES.items.filter(i => i.auto);
  if (autoEq.length) { toast("Ô trống đã tự mặc:" + autoEq.map(i => `<b>${esc(i.name)}</b>`).join(", ")); autoEq.forEach(i => delete i.auto); }
  el.innerHTML = BRES.win
    ? `<div class="res win"><h3>Thắng</h3><p>Kinh nghiệm +${BRES.xp}${BRES.cu ? `<small class="cu"> (đuổi cấp ×${cuTxt(BRES.cu)})</small>` : ''}${lvText} · Bạc +${BRES.gold}${extra ? " · " + extra : ''}</p>
       ${lootChips(BRES.items)}${gemChips(BRES.gems)}${zyChips(BRES.zy)}${BRES.items.length || BRES.gems.length || (BRES.zy && BRES.zy.length) ? '' : "<p class=\"sub\">Lần này không rơi trang bị</p>"}
       ${BRES.stat ? `<details class="bstat-d"><summary>Thống kê trận này</summary>${statHero(BRES.stat, BRES.hs)}</details>` : ''}
       <button class="btn big" data-act="bcont">${cont}</button></div>`
    : (WKEY && WKEY.key && WKEY.key.scripted ? `<div class="res lose"><h3>Không trụ nổi</h3><p>Nó mạnh quá. Bàn tay cầm đao của bạn run lên —</p><button class="btn big" data-act="bcont">……</button></div>`
      : run.mode === 'rift' ? `<div class="res lose"><h3>Ngã xuống rồi</h3><p>Ảo Cảnh không lấy mạng bạn, chỉ lấy hương: bạn bị ném về lối vào, hương cháy mất một đoạn (ngã càng nhiều cháy càng nhiều). Bầy yêu vật vừa hạ bạn vẫn ở chỗ cũ.</p><button class="btn big" data-act="bcont">Đứng dậy</button></div>`
      : `<div class="res lose"><h3>Bại</h3><p>Trang bị, nguyên liệu, kinh nghiệm lần này đều được giữ lại. ${run.world ? "Bạn sẽ tỉnh lại bên đống lửa trại gần nhất." : run.ngoc ? "Ngoc đã kéo bạn về trấn." : ''}</p>${bossMissHTML()}<button class="btn big" data-act="bcont">${run.world ? "Về lửa trại" : "Về trấn"}</button></div>`);
}
function battleHTML() {
  const run = SAVE.run, T0 = run.world && SCENE_THEMES[run.sth || run.theme], T = T0 || terrainOf(run), U = ULTS[run.cls];
  const wxl = false && T0 && T0.wx ? `<div class="wxl wx-${T0.wx}">${Array.from({ length: 14 }, () => `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:-${(Math.random() * 8).toFixed(1)}s;animation-duration:${(5 + Math.random() * 6).toFixed(1)}s"></i>`).join('')}</div>` : '';
  const deco = [0.08, 0.3, 0.55, 0.8].map((x, i) => { const D = T.d[i % T.d.length]; return `<span class="svd" style="left:${x * 100}%">${SPR.img(D[0], 44 + i * 6, D[1])}</span>`; }).join('');
  return `${battleBar(run)}
    <div class="arena sv ${T0 ? 'k-' + T0.kind : ''}" id="arena" style="--bg:${T0 ? T0.bg : themeOf(run).bg};--g:${T.g};--p:${T.p}">${typeof GFX !== 'undefined' ? `<div class="sv-paint" style="background-image:url(${GFX.background(run.theme || (run.mode === 'rift' ? 'rift' + (themeOf(run).n || '') : 'gen'), T0 || { kind: T.kind || 'field', bg: themeOf(run).bg, g: T.g, p: T.p, wx: T.wx }, B && B.kind === 'boss')})"></div>` : ''}<div class="sv-back">${deco}</div>${wxl}
      <div class="turnbar" id="turnbar"></div><button class="fbadge" id="fbadge" data-act="fminfo" hidden></button><div class="wardbar" id="wardbar" hidden></div><div class="side allies" id="allies"></div><div class="side foes" id="foes"></div>
      <div class="flash" id="flash"></div><div class="fxl"></div><div class="combo" id="combo"></div><div class="cutin" id="cutin"></div>
      <div class="stpop" id="stpop" data-act="stclose" hidden></div><button class="statb" id="statc" data-act="statfull" aria-label="Thống kê trận này">TK</button><div id="bres"></div></div>
    <div class="bctl sbar" id="bctl"><div class="sb-me" id="sbme"></div><div class="sb-foe" id="sbfoe"></div></div>
    <div class="hud" id="hud"><div class="hud-ctl"><div class="spdc" id="spdc">${[1, 2, 3].map(s => `<button class="${SAVE.speed === s ? 'on' : ''}" data-act="speed" data-arg="${s}">×${s}</button>`).join('')}${SAVE.showSkip ? "<button data-act=\"skip\">Bỏ qua</button>" : ''}</div></div><div class="hud-sk" id="hudsk"></div>
      <button class="ultb" id="ultb" data-act="ult" title="Bí kỹ · ${U.n}: ${U.d}"><i id="ultfill"></i><span><b>Bí kỹ</b><small id="ultpct"></small></span></button>
</div>`;
}
// ---- 状态栏和状态说明 ----
// 身上的状态统一在这里列：名字、颜色、还剩几回合、说明（点一下在画面上浮出说明）
const ST_INFO = {
  frozen: ["Choáng", '#f1d34e', 0, "Bỏ qua lần ra tay kế tiếp. Thủ lĩnh có một nửa khả năng không bị choáng."],
  slow: ["Đóng băng", '#5fb0ff', 0, "Ra tay chậm lại (tốc độ ×0,65); yêu vật biết bay sẽ rơi xuống."],
  melt: ["Phá giáp", '#d8a05a', 0, "Hộ giáp giảm một nửa, kháng toàn bộ -20; Cốt giáp, giáp bạc sẽ bị đánh vỡ."],
  burn: ["Thiêu đốt", '#ff7a3a', 0, "Mỗi lượt mất máu; yêu vật Hồi xuân đang cháy thì không hồi được máu, Kén tơ cháy là thủng."],
  poison: ["Trúng độc", '#7fe05a', 0, "Mỗi lượt mất máu, mỗi tầng kéo dài 3 lượt, cộng dồn tối đa 5 tầng (Ngũ Độc Độc Hành nhiều hơn). Cửu Vĩ khi hồi máu (hảo cảm 10) sẽ tiện tay giải luôn."],
  curse: ["Nhiếp Hồn", '#c39cff', 0, "Sát thương gây ra giảm ba phần."],
  mark: ["Đoạt Mệnh Ấn", '#ff5a5a', 0, "Kẻ địch bị đánh dấu chịu sát thương cao hơn."],
  warcry: ["Phấn chấn", '#ffb066', 1, "Sát thương +40%, hộ giáp +50% (Sư Tử Hống, chính khí của Long đạo trưởng đều là cái này)."],
  kangG: ["Đỡ đao", '#ffd75a', 1, "Quản gia Khang gánh thay bạn ba phần sát thương (hảo cảm 10 là bốn phần); khi máu của ông dưới một phần tư thì không đỡ nữa."],
  liuDr: ["Kinh thanh", '#fff2b0', 1, "An Hồn Kinh của sư phụ Lưu: sát thương phải nhận -20% (hảo cảm 10 là -30%)."],
  tieArm: ["Gia cố", '#d8a05a', 1, "Miếng giáp Thiết Đản gắn cho: hộ giáp +40%."],
  shadow: ["Vô Ảnh", '#b9a0ff', 1, "Né tránh tăng mạnh, đòn kế tiếp chắc chắn chí mạng."],
  smoke: ["Yên Độn", '#b9a0ff', 1, "Kẻ địch đánh không trúng bạn."],
  butui: ["Bất Thoái", '#ff9a5a', 1, "Sát thương phải nhận -50%, bị đánh tích gấp đôi nộ ý."],
  chan: ["Thiền", '#fff2b0', 1, "Sát thương phải chịu -45%, bội số phản chấn +50%."],
  renew: ["Hồi xuân", '#5df07a', 1, "Mỗi lượt hồi 6% khí huyết."],
  shield: ["Hộ Thể", '#ffe58a', 1, "Chân khí hộ thể: chặn sát thương trước, chặn hết mới mất máu."],
  charging: ["Tụ lực", '#ff5a3a', 0, "Thủ lĩnh đang tụ lực, chiêu sau rất nặng. Làm nó choáng là cắt được, bí kỹ cũng cắt được (bật tự động ra chiêu thì sẽ tung giúp bạn)."],
  enraged: ["Cuồng Bạo", '#ff5a3a', 0, "Sát thương và tốc độ tăng mạnh."],
  ghost: ["Quỷ thân", '#c39cff', 0, "Hóa thành quỷ ảnh, rất khó đánh trúng. Dùng choáng để nó hiện hình."],
  cocoon: ["Kén tơ", '#e8e0d0', 0, "Nhả tơ bọc lấy mình, chặn sát thương. Dùng thiêu đốt có thể đốt thủng kén tơ."],
  silver: ["Giáp bạc", '#cfd8e8', 0, "Một lớp giáp bạc chặn sát thương. Dùng phá giáp có thể đánh vỡ."],
  hufa: ["Hộ pháp", '#ff9a5a', 0, "Trợ thủ của thủ lĩnh: bạn mang bao nhiêu đồng hành, thủ lĩnh mang bấy nhiêu hộ pháp."],
  call: ["Quát lớn", '#ff9a5a', 0, "Khi máu thủ lĩnh còn một nửa (yêu vương giữ ải Ảo Cảnh là lúc bạo nộ), sẽ gọi một bầy tiểu yêu xông lên."],
  phsh: ["Hộ thể chân khí", '#9ad0ff', 0, "Hộ thể chân khí yêu vương giữ ải dựng lên khi còn bảy phần máu: chưa phá thì đánh nó chỉ còn một nửa."],
  rageB: ["Bạo nộ", '#ff3a2a', 0, "Yêu vương giữ ải bạo nộ khi còn ba phần rưỡi máu: công kích +20%."],
  duo: ["Liên động", '#ffb04a', 0, "Yêu vương giữ ải (từ tầng 150 Ảo Cảnh): cứ ra tay năm lần, liền ra thêm một chiêu."],
  stacks: ["Cửu U", '#ffd23a', 1, "Bộ Cửu U: mỗi lần chí mạng chồng một tầng, sát thương càng đánh càng cao."] };
function unitSts(u) {
  const L = [], add = (k, t, extra) => { const I = ST_INFO[k]; if (I) L.push({ k, n: I[0] + (t ? ' ' + t : ''), c: I[1], good: !!I[2], ...(extra || {}) }); };
  if (!u || u.hp <= 0) return L;
  if (u.charging) add('charging'); if (u.ghostForm) add('ghost'); if (u.cocoon && u.shield > 0) add('cocoon'); if (u.silver && u.shield > 0) add('silver');
  if (u.enraged || (u.aff && u.aff.includes('enraged') && u.hp / u.maxHp < 0.5)) add('enraged');
  if (u.phShield && u.shield > 0) add('phsh'); if (u.rageB) add('rageB'); if (u.duo) add('duo');
  for (const k of ['frozen', 'slow', 'melt', 'burn', 'poison', 'curse', 'mark', 'warcry', 'kangG', 'liuDr', 'tieArm', 'shadow', 'smoke', 'butui', 'chan', 'renew']) {
    const v = u.st[k]; if (!v) continue; const t = typeof v === 'number' ? v : v && v.t; add(k, k === 'poison' && v.L && v.L.length > 1 ? `×${v.L.length}` : t > 0 && t < 99 ? t : ''); }   // 中毒显示层数
  if (u.shield > 0 && !u.cocoon && !u.silver) add('shield', fmtBig(Math.round(u.shield * uK(u))));
  if (u.kind === 'hero' && u.stacks) add('stacks', '×' + u.stacks);
  if (u.hufa) add('hufa'); if (u.callU) add('call');
  return L;
}
let STPOP = null;
function stDesc(u, k) {
  if (!u) return null;
  if (k === 'trait' && u.trait) return { n: TRAITS[u.trait].n + " (đặc tính yêu vật)", c: '#e8c88a', d: TRAITS[u.trait].d };
  if (k === 'life') return { n: `Còn ra tay được ${u.life} lần`, c: '#c8b08a', d: "Cương thi tự ra tay một lần thì trừ một lần, hết thì hóa thành đất (mặc Âm Binh Mượn Đường 4 món vẫn nổ). Dưỡng Thi Phù nối thêm 2 lần cho mọi cương thi. Ngã thì dùng Rung Chuông Gọi Xác gọi lại." };
  if (k === 'fonu') return { n: `Phật nộ ${u.fonu || 0} tầng`, c: '#ffb066', d: "Bộ La Hán Kim Thân 6 món: mỗi lần phản chấn có một nửa tỉ lệ chồng một tầng, mỗi tầng sát thương +20%, sát thương phải nhận -4%, có hiệu lực suốt trận này." };
  if (k.startsWith('aff:')) { const A = ELITE_AFFIXES.find(x => x.id === k.slice(4)); return A ? { n: A.n + " (thuộc tính tinh anh)", c: '#ffb066', d: A.d } : null; }
  if (k === 'all') { const L = [...(u.trait ? [TRAITS[u.trait].n] : []), ...(u.aff || []).map(a => (ELITE_AFFIXES.find(x => x.id === a) || {}).n).filter(Boolean), ...unitSts(u).map(x => x.n)];
    return { n: "Tất cả trạng thái", c: '#e8c88a', d: L.join(", ") + ". Chạm vào từng trạng thái trên thanh trạng thái để xem giải thích." }; }
  const x = unitSts(u).find(y => y.k === k), I = ST_INFO[k]; if (!x || !I) return null;
  const t = u.st[k], left = typeof t === 'number' ? t : t && t.t;
  return { n: I[0] + (left > 0 && left < 99 ? ` · còn ${left} lượt` : ''), c: I[1], d: I[3] };
}
document.addEventListener('click', e => { if (STPOP && e.target.closest && e.target.closest('#arena') && !e.target.closest('[data-act=stinfo],[data-act=castq],[data-act=ult],#stpop,#statc')) { STPOP = null; drawStPop(); } });   // 点战场空白处收起说明
function drawStPop() {
  const el = document.getElementById('stpop'); if (!el) return;
  const sc = document.getElementById('statc'); if (sc) sc.classList.toggle('on', !!(STPOP && STPOP.full));
  if (STPOP && STPOP.full && B) { el.hidden = false; el.classList.add('full'); const h = `<b style="color:#e8c88a">Thống kê trận này</b><span class="stx">✕</span>${statHero(B.stat, B.hs)}`; if (el._h !== h) { el._h = h; el.innerHTML = h; } return; }
  el.classList.remove('full'); el._h = '';
  if (STPOP && STPOP.ult && B) {   // 点右下角的秘技：看说明（攒满了就顺手放出去）
    const U = ULTS[B.P.cls], r = Math.round(B.P.rage || 0);
    el.hidden = false; el.innerHTML = `<b style="color:#ffcf6a">Bí kỹ · ${U.n}</b><span class="stx">✕</span><p>${U.d}</p><p class="sub">${r >= 100 ? (B.ultReq ? "Đã tung ra" : `Đã đầy ${Math.floor(r / 100)} ô`) : `Còn thiếu ${100 - r}%`} · tối đa tích hai ô, không chiếm lượt</p>`; return; }
  if (STPOP && STPOP.sk && B) {   // 战斗里点招式：看说明（2026-11-25）
    const k = B.P.skills.find(x => x.id === STPOP.sk); if (!k) { STPOP = null; el.hidden = true; return; }
    const r = B.P.runes && B.P.runes[k.id], R = r && RUNES[k.id] ? RUNES[k.id][r === 'a' ? 0 : 1] : null;
    el.hidden = false; el.innerHTML = `<b style="color:#f1e2c6">${k.n}</b>${k.cd ? skcTag(B.P.cls, k) : ''}<span class="stx">✕</span><p>${k.d}${R ? `<br><span style="color:#d9c48c">Biến chiêu «${R.n}»: ${R.d}</span>` : ''}</p><p class="sub">${!k.cd ? "Chiêu cơ bản" : k.left > 0 ? `Còn hồi chiêu ${k.left} đòn` : "Sẵn sàng"}${!B.castAuto && B.castReq === k.id ? " · đòn sau ra chiêu này" : ''}</p>`; return; }
  const u = STPOP && B && B.units.find(x => x.id === STPOP.id), D = u && stDesc(u, STPOP.k);
  if (!D) { STPOP = null; el.hidden = true; return; }
  el.hidden = false; el.innerHTML = `<b style="color:${D.c}">${D.n}</b><span class="stx">✕</span><p>${esc(u.side === 'e' ? u.name : u.id === 'P' ? "Bạn" : u.name)}: ${D.d}</p>`;
}
// 状态栏：左边你，右边选中的目标（没选就是首领／精英，只有小怪就合计）
function sbChips(u, aff) {
  const L = unitSts(u).map(x => `<span class="sbc ${x.good ? 'g' : ''}" style="--c:${x.c}" data-act="stinfo" data-arg="${u.id}|${x.k}">${x.n}</span>`);
  if (aff) { if (u.trait) L.unshift(`<span class="sbc a" data-act="stinfo" data-arg="${u.id}|trait">${TRAITS[u.trait].n}</span>`); (u.aff || []).forEach(a => { const A = ELITE_AFFIXES.find(x => x.id === a); if (A) L.unshift(`<span class="sbc a" data-act="stinfo" data-arg="${u.id}|aff:${a}">${A.n}</span>`); }); }
  return L.join('');
}
const sbHp = (h, m, c) => `<div class="sbhp"><i style="width:${Math.max(0, Math.min(100, h / Math.max(1, m) * 100))}%;background:${c}"></i></div>`;
const setH = (el, h) => { if (el._h === h) return false; el._h = h; el.innerHTML = h; return true; };   // 内容没变就不动 DOM
function drawSbar() {   // 三段分开更新：名字和数字、血条、状态——状态没变就不重排（原来每一步整块重写还要重新量一遍状态放不放得下）
  const me = $('#sbme'), fo = $('#sbfoe'); if (!me || !fo || !B) return;
  const P = B.P, run = SAVE.run, pc = run ? run.potions : 0;
  sbSet(me, `<b>Bạn</b><button class="potb" id="potb" data-act="bpot" ${B.over || pc <= 0 || P.hp <= 0 || P.hp >= P.maxHp ? 'disabled' : ''}>Đan ×${pc}</button>`, P.hp / P.maxHp, '#5fbf5a', sbChips(P), 'P', `${fmtBig(Math.max(0, Math.round(P.hp)) * uK(P))} / ${fmtBig(P.maxHp * uK(P))}`);
  const E = aliveOf(B, 'e'); if (!E.length) { setH(fo, ''); return; }
  const T = E.find(u => u.id === B.target) || E.find(u => u.kind === 'boss') || E.find(u => u.kind === 'elite' || u.rare) || null;
  if (T) { const tag = T.id === B.target ? "Đang chọn" : T.kind === 'boss' ? "Thủ lĩnh" : "Tinh anh";
    sbSet(fo, `<b>${esc(T.name.replace(/^幻境守关·/, ''))}</b><small>${tag} ${Math.round(T.hp / T.maxHp * 100)}%${T.kind === 'boss' && E.length > 1 ? ` +${E.length - 1}` : ''}</small>`, T.hp / T.maxHp, '#d8463a', sbChips(T, true), T.id, `${fmtBig(Math.max(0, T.hp) * uK(T))} / ${fmtBig(T.maxHp * uK(T))}`); }
  else { const h = E.reduce((a, u) => a + Math.max(0, u.hp), 0), m = E.reduce((a, u) => a + u.maxHp, 0), more = (B.reinf || []).length;
    sbSet(fo, `<b>Tiểu yêu ×${E.length}</b><small>Tổng máu ${Math.round(h / m * 100)}%</small>`, h / m, '#d8463a', more ? `<span class="sbc m">phía sau còn ${more} con</span>` : '', 'x', `${fmtBig(h)} / ${fmtBig(m)}`); }
}
function sbSet(box, head, frac, col, chips, id, num) {
  if (!box.querySelector(':scope > .sbh')) { box._h = null; box.innerHTML = `<div class="sbh"></div><div class="sbhp"><i></i><em></em></div><div class="sbcs"></div>`; }
  const H = box.children[0], bar = box.children[1].firstElementChild, C = box.children[2], nm = box.children[1].lastElementChild;
  setH(H, head); if (nm._t !== num) { nm._t = num; nm.textContent = num || ''; }   // 血量数字写在血条里
  const w = Math.max(0, Math.min(100, frac * 100)).toFixed(1) + '%'; if (bar._w !== w) { bar._w = w; bar.style.width = w; } if (bar._c !== col) { bar._c = col; bar.style.background = col; }
  if (setH(C, chips) || C._id !== id) { C._id = id; sbFit(box, id); }
}
// 状态多了只显示放得下的两行，剩下的折成「+N」（点开看全部），状态栏高度固定不跳
function sbFit(box, id) {
  const c = box.querySelector('.sbcs'); if (!c || c.scrollHeight <= c.clientHeight + 1) return;
  const kids = [...c.children]; let n = 0;
  const more = document.createElement('span'); more.className = 'sbc m'; more.dataset.act = 'stinfo'; more.dataset.arg = id + '|all'; c.appendChild(more);
  while (kids.length && c.scrollHeight > c.clientHeight + 1) { kids.pop().remove(); n++; more.textContent = '+' + n; }
}
// 役使：跟在你身边的两只首领精魄（小图标）；本事一触发就闪一下
const yiBoss = id => { const Y = YISHI[id], e = Y && zyEntries(Y.pg).find(x => x.boss); return e ? allMonsterDefs().find(d => d.n === e.n) : null; };
const yiFolHTML = yi => `<div class="yifol">${Object.keys(yi).map(id => { const d = yiBoss(id); return `<i id="yif-${id}" title="Dịch Sứ · ${YISHI[id].n}">${d ? SPR.img(d.spr, 26, d.pal) : ''}</i>`; }).join('')}</div>`;
function yiFlash(id, txt) { const el = document.getElementById('yif-' + id); if (!el) return; bump(el, 'go', 700); if (txt) { const t = document.createElement('span'); t.className = 'yit'; t.textContent = txt; el.appendChild(t); setTimeout(() => t.remove(), 1000); } }
function unitEl(u) {
  const el = document.createElement('div');
  el.className = 'unit k-' + u.kind + (u.rare ? ' rare' : '') + ' spawn'; el.id = 'u-' + u.id;
  if (u.side === 'e') { el.dataset.act = 'btarget'; el.dataset.arg = u.id; }
  const size = { hero: 64, boss: u.guard ? 76 : 112, elite: u.rare ? 68 : 60, normal: 48, mini: 38, minion: u.zt === 'shiwang' ? 52 : 40, goblin: 54, ally: 56, ward: 60 }[u.kind] || 48;   // 尸王比普通僵尸大一圈
  el.dataset.pal = JSON.stringify(u.pal || null); el.dataset.size = size;
  const img = u.kind === 'hero' ? heroSpr(u.cls, size) : SPR.img(u.spr || 'skeleton', size, u.pal), spr = u.kind === 'hero' ? CLASSES[u.cls].spr : u.spr;
  el.style.setProperty('--sz', size + 'px'); const ic = VFX.idleCls(spr); if (ic) el.classList.add(ic);
  if (u.kind === 'hero' && SAVE.chars[u.cls]) { const E = SAVE.chars[u.cls].eq || {}, w = E.weapon; if (w && w.rarity) el.classList.add('wr-' + w.rarity);
    if (Object.values(E).filter(it => it && it.rarity === 'set').length >= 2) el.classList.add('gear-set'); }
  el.innerHTML = `<div class="aura"><i class="a-rage"></i><i class="a-fire"></i><i class="a-tox"></i><i class="a-ice"></i><i class="a-shd"></i><i class="a-cur"></i><i class="a-stun"><b>✦</b><b>✦</b><b>✦</b></i></div><div class="sp">${VFX.rigHTML(u, img, size, spr)}</div>
    <div class="un${u.kind === 'boss' ? ' bs' : u.kind === 'elite' || u.rare ? ' el' : ''}">${esc(u.name)}</div>
    ${u.side === 'e' && (u.kind === 'elite' || u.kind === 'boss' || u.rare) && u.aff && u.aff.length ? `<div class="tags">${u.aff.slice(0, 2).map(a => { const A = ELITE_AFFIXES.find(x => x.id === a); return A ? `<span data-act="stinfo" data-arg="${u.id}|aff:${a}">${A.n}</span>` : ''; }).join('')}${u.aff.length > 2 ? `<span data-act="stinfo" data-arg="${u.id}|all">+${u.aff.length - 2}</span>` : ''}</div>` : ''}
    <div class="hpbar"><em class="tr"></em><i></i><b class="sh"></b><span></span></div><div class="sts"></div>${u.kind === 'hero' && u.yi && Object.keys(u.yi).length ? yiFolHTML(u.yi) : ''}`;
  setTimeout(() => el.classList.remove('spawn'), u.kind === 'boss' ? 650 : 400);
  if (u.kind === 'boss' && !u.guard) setTimeout(() => VFX.onLand(u.id), 560);
  return el;
}
function bumpCombo(n) {
  COMBO.n += n; clearTimeout(COMBO.t); COMBO.t = setTimeout(() => { COMBO.n = 0; const c = $('#combo'); if (c) c.className = 'combo'; }, 2400);
  const c = $('#combo'); if (!c || COMBO.n < 3) return;
  c.innerHTML = `<b>${COMBO.n}</b><span>liên kích</span>`; c.className = 'combo on' + (COMBO.n >= 20 ? ' hot' : ''); bump(c, 'pump', 160);
}
// 给元素挂一下动画 class。原来先读一次 offsetWidth 逼浏览器重排来重启动画，战斗里一秒几十次，是卡顿的大头：
// 现在没挂着就直接挂；正挂着就先摘掉，隔两帧再挂（不用逼重排）
function bump(el, cls, ms) { if (!el) return; const k = '_b' + cls; clearTimeout(el[k]);
  const on = () => { el.classList.add(cls); el[k] = setTimeout(() => el.classList.remove(cls), ms); };
  if (!el.classList.contains(cls)) return on();
  el.classList.remove(cls); requestAnimationFrame(() => requestAnimationFrame(on)); }
function sayBubble(id, text) {
  const el = document.getElementById('u-' + id); if (!el || !text) return;
  el.querySelectorAll('.bubble').forEach(x => x.remove());
  const b = document.createElement('div'); b.className = 'bubble'; b.textContent = text; el.appendChild(b);
  setTimeout(() => b.remove(), 2200);
}
// 主角团那半边的上沿（中线下面一点），连招、金刚震、秘技的字都放这里（2026-11-24：上半区只留妖物和伤害数字）
const partyTop = () => { const ar = $('#arena'), ln = $('#bline'); if (!ar) return 0; const b = ln ? parseFloat(ln.style.bottom) : NaN; return isNaN(b) ? ar.clientHeight * 0.55 : ar.clientHeight - b + 10; };
function showCutin(kind, data) {
  const el = $('#cutin'); if (!el) return;
  let h;
  if (kind === 'ult') {   // 秘技：屏幕顶上一条细横幅，不压暗；4 倍速只闪名字
    const run = SAVE.run, sm = SAVE.speed >= 3, ms = ULT_MS();
    if (document.body.classList.contains('gf')) {   // 国风样板：半秒水墨定格——战场褪成墨色，一笔墨带扫过，毛笔大字 + 朱砂竖印
      const UC = { berserker: '#ff5a3a', mage: '#b8a8ff', necro: '#59e0c4', assassin: '#ff4a6a', paladin: '#ffd75a' }[run.cls] || '#ffd75a', ar = $('#arena');
      el.innerHTML = `<div class="uk-wash"></div><div class="uk-row">${sm ? '' : `<div class="uk-art">${heroSpr(run.cls, 100)}</div>`}<b class="uk-g">${data.g}</b><span class="uk-seal">${esc(data.n)}</span></div>`;
      el.className = 'cutin on ultink'; el.style.setProperty('--cd', ms + 'ms'); el.style.setProperty('--uc', UC);
      if (ar && !sm) { ar.classList.add('gfink'); setTimeout(() => ar.classList.remove('gfink'), ms * 0.86); }
      SFX.play('gong');
      clearTimeout(el._h); el._h = setTimeout(() => { el.className = 'cutin'; el.innerHTML = ''; }, ms); return;
    }
    const art = sm ? '' : `<div class="ci-art">${heroSpr(run.cls, 52)}${data.combo ? (data.sprs && data.sprs.length ? data.sprs : [run.ngoc === 'fox' ? 'ngocfox' : 'ngoc']).map(sp => unitIcon(sp, 46, null, '', 'full')).join('') : ''}</div>`;
    el.innerHTML = `<div class="ci-band">${art}<div class="ci-txt"><b class="ci-g">${data.g}</b><span>${esc(data.n)}</span></div></div>`;
    el.className = 'cutin on ultlite' + (data.combo ? ' combo' : ''); el.style.setProperty('--cd', ms + 'ms');   // 秘技横幅放在战场最下面（主角团这半边，见 .cutin.ultlite）
    SFX.play('gong');
    clearTimeout(el._h); el._h = setTimeout(() => { el.className = 'cutin'; el.innerHTML = ''; }, ms); return;
  } else {
    h = `<div class="ci-band boss"><div class="ci-art">${SPR.img(data.spr, 120, data.pal)}</div><div class="ci-txt"><b class="ci-g">${kind === 'phase' ? "BIẾN" : "NỘ"}</b><span>${esc(data.name)}</span></div></div>`;
    el.className = 'cutin on boss';
    SFX.play('boss');
  }
  el.innerHTML = h; el.style.setProperty('--cd', CUT_MS() + 'ms');
  clearTimeout(el._h); el._h = setTimeout(() => { el.className = 'cutin'; el.innerHTML = ''; }, CUT_MS());
}
const ALLY_MOVES = { chain2: "Xích sắt", zhengjue: "Chính Khí Quyết", zhengqi: "Chính khí", foxfire: "Hồ hỏa", foxfireAll: "Hồ hỏa trận", foxHeal: "Hồ quang", ngocHeal: "Gói thuốc", potionThrow: "Bình thuốc", kangGuard: "Đỡ đao",
  leiCut: "Chém", leiFinish: "Đoạn Đầu Đao", liuChant: "Tụng kinh", liuBell: "Lắc chuông", tieGun: "Hỏa súng", tieBolt: "Gia cố" };
const allyMoveName = (u, id) => id === 'blade2' ? ({ zhen: "Đao bộ khoái", kang: "Bàn tính", lei: "Chém" }[u.comp] || "Ra đao") : ALLY_MOVES[id] || '';
const skShort = n => /[\u4e00-\u9fff]/.test(n) ? n.slice(0, 2) : n.split(' ').slice(0, 2).join(' ');   // 招式条上的短名：中文取两个字，越南语取前两个词
// 小队统计表（战斗里、结算、幻境一局）
let STATOPEN = false;   // 统计改成画中画：战斗画面左下角「统计」，点开才有（每场默认收起）
// 本场统计（2026-11-24）：主角详细——输出按来源、最高一击、暴击率；承伤分护体挡下／减伤挡掉／真正掉血；伙伴每人一行输出占比
function statHero(st, hs) {
  if (!hs) return statTable(st);
  const rows = Object.values(st || {}), me = rows.find(r => r.cid === 'P'), tot = rows.reduce((a, r) => a + r.dmg, 0) || 1, f = v => fmtBig(Math.round(v || 0));
  const bar = (n, pc, c) => `<div class="hsr"><b>${esc(n)}</b><span class="hsb"><i style="width:${Math.max(0, Math.min(100, pc))}%${c ? ';background:' + c : ''}"></i></span><em>${Math.round(pc)}%</em></div>`;
  const src = Object.entries(hs.src || {}).sort((a, b) => b[1] - a[1]), sTot = src.reduce((a, x) => a + x[1], 0) || 1;
  const top = src.slice(0, 5), rest = src.slice(5).reduce((a, x) => a + x[1], 0);
  if (rest > 0) top.push(["Khác", rest]);
  const myDmg = me ? me.dmg : sTot, raw = Math.max(hs.raw || 0, (hs.sh || 0) + (hs.hp || 0)), rT = raw || 1;
  const mit = Math.max(0, raw - (hs.sh || 0) - (hs.hp || 0));
  const others = rows.filter(r => r.cid !== 'P').sort((a, b) => b.dmg - a.dmg);
  return `<div class="hsd">
    <div class="hsh">Bạn · sát thương <b>${f(myDmg)}</b>${others.length ? `<small>chiếm ${Math.round(myDmg / tot * 100)}% cả đội</small>` : ''}</div>
    ${top.length ? top.map(([k, v]) => bar(k, v / sTot * 100)).join('') : "<p class=\"sub\">Chưa ra tay.</p>"}
    <div class="hsk"><span>Đòn cao nhất ${f(hs.max)}</span><span>Tỉ lệ bạo kích ${hs.n ? Math.round(hs.cr / hs.n * 100) : 0}%</span></div>
    <div class="hsh">Chịu đòn · bị đánh ${hs.hitN || 0} lần, nhận vào ${f(raw)}</div>
    ${raw ? bar("Hộ thể chặn", (hs.sh || 0) / rT * 100, '#e0c060') + bar("Giảm sát thương", mit / rT * 100, '#8fa8c8') + bar("Mất máu", (hs.hp || 0) / rT * 100, '#d8665a') : ''}
    <div class="hsk"><span>Hồi máu ${f(hs.heal)}</span><span>Khống chế ${me ? me.ctrl || 0 : 0} lần</span></div>
    ${others.length ? `<div class="hsh">Đồng hành · tỉ lệ sát thương</div>${others.map(r => bar(r.cid === 'Z' ? "Cương thi" : r.n.replace(/（.*）/, ''), r.dmg / tot * 100, '#7a9ab8')).join('')}` : ''}
  </div>`;
}
function statTable(st, mini) {
  const rows = Object.values(st || {}); if (!rows.length) return "<p class=\"sub\">Chưa có dữ liệu.</p>";
  const ord = r => r.cid === 'P' ? 0 : r.cid === 'Z' ? 2 : 1; rows.sort((a, b) => ord(a) - ord(b) || b.dmg - a.dmg);
  const tot = rows.reduce((a, r) => a + r.dmg, 0) || 1, f = v => v ? fmtBig(Math.round(v)) : '—';
  const sub = r => [r.shield ? `Hộ thể ${fmtBig(Math.round(r.shield))}` : '', r.guard ? `Đỡ đao ${fmtBig(Math.round(r.guard))}` : ''].filter(Boolean).join(' ');
  return `<table class="stbl ${mini ? 'mini' : ''}"><tr><th></th><th>Sát thương</th><th>Khống chế</th><th>Hồi máu</th><th>Chịu đòn</th></tr>${rows.map(r => `<tr><td>${esc(r.cid === 'P' ? "Bạn" : r.n)}</td><td>${f(r.dmg)}<small>${Math.round(r.dmg / tot * 100)}%</small></td><td>${r.ctrl || '—'}</td><td>${f(r.heal)}</td><td>${f(r.taken)}${sub(r) ? `<small>${sub(r)}</small>` : ''}</td></tr>`).join('')}</table>
    ${mini ? '' : "<p class=\"stbl-n\">Khống chế = số lần làm địch choáng, đóng băng; Hộ thể = sát thương chân khí hộ thể chặn được; Chịu đòn = máu thật sự mất.</p>"}`;
}
function statMini(st) {
  const rows = Object.values(st || {}); if (!rows.length) return "<div class=\"smn\">Bắt đầu đánh thì ở đây hiện tỷ lệ sát thương của từng người</div>";
  const ord = r => r.cid === 'P' ? 0 : r.cid === 'Z' ? 2 : 1; rows.sort((a, b) => ord(a) - ord(b) || b.dmg - a.dmg);
  const tot = rows.reduce((a, r) => a + r.dmg, 0) || 1, f = v => v ? fmtBig(Math.round(v)) : '—';
  return `<div class="smr smh"><span></span><span>Tỷ lệ sát thương</span><span></span><span>KC</span><span>Hồi</span><span>Chịu</span></div>${rows.map(r => { const pc = Math.round(r.dmg / tot * 100);
    return `<div class="smr"><span>${esc(r.cid === 'P' ? "Bạn" : r.n.replace(/（.*）/, ''))}</span><span class="smb"><i style="width:${pc}%"></i></span><span>${pc}%</span><span>${r.ctrl || '—'}</span><span>${f(r.heal)}</span><span>${f(r.taken)}</span></div>`; }).join('')}`;
}
let STATT = 0, STATQ = 0;
function statPipRefresh() { const w = 450 - (performance.now() - STATT); if (w <= 0) { STATT = performance.now(); return drawStPop(); } if (!STATQ) STATQ = setTimeout(() => { STATQ = 0; STATT = performance.now(); if (STPOP && STPOP.full) drawStPop(); }, w); }
function updStat() {   // 统计框半秒刷一次就够（原来每一步都整块重写，一直在逼页面重排）
  const go = () => { STATQ = 0; STATT = performance.now(); const el = document.getElementById('bstatp'); if (!el || !B) return; const h = statMini(B.stat); if (el._h !== h) { el._h = h; el.innerHTML = h; } };
  const w = 450 - (performance.now() - STATT); if (w <= 0) return go(); if (!STATQ) STATQ = setTimeout(go, w);
}
function updBattle(o, anim) {
  if (STPOP && STPOP.full) statPipRefresh();
  if (!B) return;
  if (o && o.say) { const su = B.units.find(u => u.id === o.say[0]); if ((SAVE.speed || 1) < 2 || (su && su.kind === 'boss')) sayBubble(o.say[0], o.say[1]); }
  if (o && anim && o.foilKey) {   // 克制道具生效的特写
    const pp = o.pops.find(p => p[1] === "Bị khắc chế"), K = (typeof W_KEYS !== 'undefined' && W_KEYS[o.foilKey[0]]) || null;
    VFX.onFoil(pp ? pp[0] : o.actor, K ? SPR.img(K.spr || 'key', 36) : ''); SFX.play('rare');
    const ar = $('#arena'); if (ar) bump(ar, 'foilflash', 700);
  }
  if (o && anim && !SAVE.cineOff && (o.ult || (o.cast && (o.cast.id === 'phase' || o.cast.id === 'enrage')))) {
    if (o.ult) showCutin('ult', o.ult);
    else { const u = B.units.find(x => x.id === o.actor); if (u) showCutin(o.cast.id, u); }
    const b = B;
    setTimeout(() => { if (B !== b) return; const d = VFX.play(o, B); setTimeout(() => { if (B === b) applyStep(o, anim); }, d); }, (o.ult ? ULT_MS() : CUT_MS()) * 0.8);
    return;
  }
  if (o && anim) {
    const delay = Math.max(VFX.play(o, B), VFX.lastMv());
    if (delay > 0) { const b = B; setTimeout(() => { if (B === b) applyStep(o, anim); }, delay); return; }
  }
  applyStep(o, anim);
}
// 战场小圆点：每个状态一个字
const ST_DOT = { frozen: "Choáng", slow: "BĂNG", melt: "PHÁ", burn: "Bỏng", poison: "ĐỘC", curse: "NHIẾP", mark: "Ấn", warcry: "Hăng", kangG: "Đỡ", liuDr: "KINH", tieArm: "Cố", shadow: "Ảnh", smoke: "Khói", butui: "Trụ", chan: "Thiền", renew: "Xuân", charging: "TỤ", enraged: "Cuồng", ghost: "QUỶ", cocoon: "Kén", silver: "Ngân", phsh: "Khiên", rageB: "NỘ", duo: "Liên", stacks: "U" };
const dotTxt = t => t.length > 1 ? t.charAt(0) + t.slice(1).toLowerCase() : t;   // 越南语版：只首字母大写
// 震那一行：职业资源后面跟主角最要紧的两个状态（带层数、剩几回合）。先放本职业的招牌状态，不够再放快结束的增益
const HERO_KEY = { paladin: ['fonu', 'chan'], berserker: ['butui', 'warcry'], assassin: ['shadow', 'smoke'] };
function heroKeyChips(P) {
  const out = [], seen = new Set(), left = k => { const v = P.st[k]; const t = typeof v === 'number' ? v : v && v.t; return t > 0 && t < 99 ? t : 0; };
  const chip = (k, n, c, v) => { seen.add(k); out.push(`<span class="rchip kst" style="--c:${c}" data-act="stinfo" data-arg="P|${k}">${n}${v ? ` <b>${v}</b>` : ''}</span>`); };
  for (const k of HERO_KEY[P.cls] || []) {
    if (out.length >= 2) break;
    if (k === 'fonu') { if (P.fonu > 0) chip(k, "Phật nộ", '#ffb066', P.fonu); continue; }
    if (P.st[k] && ST_INFO[k]) chip(k, ST_INFO[k][0], ST_INFO[k][1], left(k));
  }
  if (out.length < 2) unitSts(P).filter(x => x.good && !seen.has(x.k) && x.k !== 'shield').sort((a, b) => (left(a.k) || 99) - (left(b.k) || 99)).slice(0, 2 - out.length).forEach(x => chip(x.k, ST_INFO[x.k][0], x.c, x.k === 'stacks' ? P.stacks : left(x.k)));
  return out.join('');
}
// 职业资源：怒意、连、杀意、尸位、震
function resChip(P) {
  const R = CLASSES[P.cls].res; if (!R) return '';
  if (P.cls === 'berserker') return `<span class="rchip fury ${P.fury >= 50 ? 'hot' : ''}">Nộ ý <i style="--w:${Math.round(P.fury || 0)}%"></i><b>${Math.round(P.fury || 0)}</b></span>`;
  if (P.cls === 'mage') { const lw = P.lastWx; return `<span class="rchip lian" title="Đổi sang một hành khác để ra chiêu +1">Liên <b>${P.lian || 0}</b>${lw ? `<em style="color:${WX[lw].c}">${WX[lw].n}</em>` : ''}</span>`; }
  if (P.cls === 'assassin') return `<span class="rchip ki">Sát ý ${Array.from({ length: P.kiMax }, (_, i) => `<i class="${i < P.ki ? 'on' : ''}"></i>`).join('')}</span>`;
  if (P.cls === 'necro') return `<span class="rchip">Thi vị <b>${zombiesOf(B).filter(z => !ZOMBIES[z.zt].ult).length}/${P.minionCap}</b></span>`;
  if (P.cls === 'paladin') { const n = jzNeed(P), z = Math.min(n, P.zhen || 0); return `<span class="rchip zhen ${z >= n - 2 ? 'hot' : ''}" title="Tích đủ thì tung Kim Cương Chấn">Chấn <i style="--w:${Math.round(z / n * 100)}%"></i><b>${z}/${n}</b></span>`; }
  return '';
}
// 出手顺序条：接下来 6 次谁出手；头像下面是速度
const TB_SZ = 26;
function tbIcon(u) { if (!u._tbi) u._tbi = u.kind === 'hero' ? heroSpr(u.cls, TB_SZ) : unitIcon(u.spr || 'skeleton', TB_SZ, u.pal, '', 'head'); return u._tbi; }
function drawFBadge() {   // 战斗左上角：你的阵 / 克制 / 妖物的阵
  const el = $('#fbadge'), ar = $('#arena'); if (!el || !B) return;
  const my = B.fm || 'san', en = B.efm, on = !!(B.fm || en); el.hidden = !on; if (ar) ar.classList.toggle('hasfb', on); if (!on) return;
  const k = B.fk || 0; el.className = `fbadge k${k}`;
  setH(el, en ? `<span>${fmShort(my)}</span><em>${fmKTxt(k)}</em><span>${fmShort(en)}</span>` : `<span>${fmShort(my)}</span>`);
}
function drawTurnBar() {
  const el = $('#turnbar'); if (!el || !B) return; drawFBadge();
  if (B.over) { setH(el, ''); return; }
  const L = turnOrder(B, 6);
  setH(el, `<span class="tbl">Lượt</span>` + L.map((u, i) => `<div class="tbu ${u.side === 'e' ? 'e' : u.kind === 'hero' ? 'me' : 'p'} ${i === 0 ? 'now' : ''}" title="${esc(u.name)}">${tbIcon(u)}<b>${Math.round(spdOf(u) * 100)}</b></div>`).join(''));
}
// 战斗区高度是定死的：哪边人多了排不下，就把那一边整体缩小，画面不跟着撑大缩小
function fitSides() {
  const ar = $('#arena'); if (!ar || !ar.classList.contains('sv')) return;
  const cs = getComputedStyle(ar), avail = ar.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 10;
  formAllies();   // 双方都站固定阵位，不再整块缩放
}
window.addEventListener('resize', () => { if (typeof VIEW !== 'undefined' && VIEW === 'battle') fitSides(); });
// 我方固定阵位：靠近敌人的一列是前排（你、康总管、雷老虎），后面一列是后排（Ngoc、龙道长、刘师傅、铁蛋）；
// 每人一个格子，开战排一次，打的过程中谁挂状态、谁掉血都不挪（原来是自动换行排，状态一多一少人就跳来跳去）。召唤物站在最前面一小块
function formAllies() {
  // 2026-11-23 上下对阵（用户定）：妖物在上半，主角团在下半，中间一条阵营界线。每边最多两排（前排挨着界线，后排和前排左右错开），
  // 召唤物在我方前排上面再站一排。人的大小按画面高度算：能放下就尽量大，放不下就一起缩。开战时排一次，之后谁倒了位子空着，补上来的妖物站进空位，别人不挪
  const ar = $('#arena'); if (!ar || !B) return;
  const cs = getComputedStyle(ar), tb = $('#turnbar'), pt = Math.max(parseFloat(cs.paddingTop) || 0, tb ? tb.offsetTop + Math.max(47, tb.offsetHeight) + 2 : 0)   /* 出手条还没画出来时也按 47 算，免得头一次排和之后排得不一样 */, pb = Math.max(6, (parseFloat(cs.paddingBottom) || 0) - 20);
  const desk = innerWidth > 700, LBL = desk ? 54 : 46, SPH = 58, BSH = 118;   // 名字、血条、状态三行的高度；一倍大小时小妖、首领的身高
  const sa = $('#allies'), sf = $('#foes'); if (!sa || !sf) return;
  for (const sd of [sa, sf]) { sd.classList.add('form', 'tb'); sd.style.transform = ''; }
  const HR = desk ? 44 : 38;   // 2026-11-24 头顶留出跳字的地方：最上排妖物头上要能飘数字，整个战场往下压一点
  const TOP = ar.clientHeight - pt - 8 - HR; if (TOP - pb <= 0 || !ar.clientWidth) return;   // 最上面的人头顶不能超过这里（出手顺序条下面再空出 HR）
  const put = (u, x, bot, z, zi) => { const el = document.getElementById('u-' + u.id); if (!el) return; el.style.left = x + '%'; el.style.bottom = Math.round(bot) + 'px'; el.style.setProperty('--uz', z.toFixed(2)); el.style.scale = ''; el.style.zIndex = String(zi); };
  const P = B.units.filter(u => u.side === 'p'), main = P.filter(u => u.kind !== 'minion'), mins = P.filter(u => u.kind === 'minion' && !u.dead);
  // 前后排和战斗里妖物挑人打的规矩一致（engine 里的 FRONT_CLS、伙伴的 front）：狂刀客、武僧站前排，道士、赶尸人、刺客站后排；
  // 你站自己那一排的正中，同排伙伴分站左右，另一排的伙伴和你那排左右错开
  const isFront = u => isFrontU(u);   // 摆了阵就看号位（u.frow），没摆按职业 / 伙伴本来的前后排
  const heroU = main.find(u => u.kind === 'hero'), heroF = !!(heroU && isFront(heroU));
  if (B._formP == null) {
    const front = main.filter(isFront), back = main.filter(u => !front.includes(u)), hf = B.fm ? (x, y) => (x.fslot ?? 9) - (y.fslot ?? 9) : (x, y) => (x.kind === 'hero' ? -1 : 0) - (y.kind === 'hero' ? -1 : 0);   // 摆了阵按号位从左到右
    front.sort(hf); back.sort(hf);
    front.forEach((u, i) => { u._fc = 0; u._fi = i; }); back.forEach((u, i) => { u._fc = 1; u._fi = i; });
    [...main].sort((x, y) => hf(x, y) || x._fc - y._fc).forEach((u, i) => { u._wi = i; });   // 宽屏一排时的顺序：你在正中，前排伙伴挨着你，后排伙伴往外
    B._formP = 1; }
  main.forEach(u => { if (u._fc == null) { u._fc = isFront(u) ? 0 : 1; u._fi = main.filter(o => o._fc === u._fc && o !== u).length; u._wi = main.length - 1; } });
  const E = B.units.filter(u => u.side === 'e'), boss = E.filter(u => u.kind === 'boss'), rest = E.filter(u => u.kind !== 'boss');
  const SL = boss.length === 1 ? [[0, 30], [0, 70], [1, 12], [1, 88], [0, 50], [0, 8], [0, 92]] : boss.length ? [[0, 50], [0, 12], [0, 88], [1, 8], [1, 92], [0, 31], [0, 69]] : [[0, 50], [0, 24], [0, 76], [1, 36], [1, 64], [1, 12], [1, 88]];   // [排, 横向%]；前排让开首领站的地方
  const taken = new Set(rest.filter(u => u.hp > 0 && u._fs != null).map(u => u._fs));
  for (const u of rest) if (u._fs == null) { let k = 0; while (taken.has(k) && k < SL.length - 1) k++; u._fs = k; taken.add(k); }
  // 量一下每个人：字和血条那几行多高（lh）、一倍大小时身子多高（sb）——精英多一行词缀、首领和大块头身子高，各算各的
  const zNow = el => parseFloat(el.style.getPropertyValue('--uz')) || 1;
  // 每人只在头一次排的时候量一次，之后一直用这个数（挂上状态、倒下收起来，行高都不变，中线就不会跳）
  const meas = u => { if (u._m && !u.phased) return u._m; const el = document.getElementById('u-' + u.id), sp = el && el.querySelector('.sp');
    if (!el || !sp || !el.offsetHeight) return { lh: LBL, sb: u.kind === 'boss' ? BSH : SPH }; const z = zNow(el), h = sp.offsetHeight; return (u._m = { lh: Math.max(LBL - 8, el.offsetHeight - h), sb: h / z }); };
  const M = new Map(); for (const u of [...main, ...mins, ...E]) M.set(u, meas(u));
  const rowH = (L, z) => L.reduce((a, u) => { const m = M.get(u); return Math.max(a, m.lh + m.sb * z); }, 0);
  const fA = main.filter(u => u._fc === 0), bA = main.filter(u => u._fc === 1), fE = rest.filter(u => SL[u._fs][0] === 0), bE = rest.filter(u => SL[u._fs][0] === 1);
  if (mins.length) B._hadM = 1; const hasM = !!B._hadM, GAP0 = desk ? 24 : 16, wide = ar.clientWidth * 0.12 > (desk ? 104 : 76), OV = wide ? 0.5 : 0.86;   // 前后排左右错开，上下可以叠一点（宽屏错得开，叠一半）
  const lay = (Z, ZE = Z) => {   // 给定大小（我方 Z、妖物 ZE），从下往上排，返回各排离底边多高
    const L = {}; L.A0 = pb; L.A1 = bA.length && !wide ? pb + rowH(bA, Z) * OV : pb; let top = wide ? L.A1 + rowH(main, Z) : Math.max(L.A0 + rowH(bA, Z), L.A1 + rowH(fA, Z));
    if (hasM && wide) { L.AM = L.A1; top = Math.max(top, L.A1 + rowH(mins, Z * 0.78)); }   // 宽屏：我方所有人（伙伴、召唤物）站成一排
    else if (hasM) { L.AM = fA.length ? L.A1 + rowH(fA, Z) * OV : L.A1; top = Math.max(top, L.AM + rowH(mins, Z * 0.78)); }
    L.line = top; L.E0 = top + GAP0; const h0 = rowH(fE, ZE); L.E1 = L.E0 + h0 * OV; L.B = L.E0 + (fE.length ? h0 * 0.55 : 0);
    L.top = Math.max(L.E0 + h0, bE.length ? L.E1 + rowH(bE, ZE) : 0, boss.length ? L.B + rowH(boss, ZE * 0.92) : 0); return L; };
  // 2026-11-24 开战排一次就锁住：你们这边的位置、大小和中线一整场都不动。之后妖物多了（分身、补上来、召帮手）放不下，
  // 只动妖物那半边：先往中线靠一点，再不够就把妖物缩小一点（原来是整场重新居中，中线会突然往下跳）
  const C = B._lay, same = C && C.W === ar.clientWidth && C.H === ar.clientHeight && C.top === TOP;
  let Z, ZE, L, lift, LINE, E0abs, keep = false;
  if (same && Math.abs(lay(C.Z, C.ZE).line - C.line) < 1) {
    Z = C.Z; lift = C.lift; LINE = C.LINE; const lo = LINE + GAP0 / 2;
    for (ZE = C.ZE; ZE >= 0.5; ZE -= 0.02) { const L2 = lay(Z, ZE), blk = L2.top - L2.E0, base = Math.max(lo, Math.min(C.E0abs, TOP - blk)); if (base + blk <= TOP + 1) { L = L2; E0abs = base; keep = true; break; } }
  }
  if (!keep) { Z = desk ? 1.3 : 0.86; while (Z > 0.5 && lay(Z).top > TOP) Z -= 0.02; ZE = Z; L = lay(Z); const extra = Math.max(0, TOP - L.top), mid = Math.min(extra * 0.8, desk ? 120 : 80); lift = Math.max(0, extra - mid) / 2;   // 有富余：先加宽中间的界线空隙，剩下的上下居中
    LINE = L.line + lift + (GAP0 + mid) / 2; E0abs = L.E0 + lift + mid; }
  B._lay = { W: ar.clientWidth, H: ar.clientHeight, top: TOP, Z, ZE, lift, line: L.line, LINE, E0abs };
  for (const k of ['A0', 'A1', 'AM']) if (L[k] != null) L[k] += lift;
  const eSh = E0abs - L.E0; for (const k of ['E0', 'E1', 'B']) L[k] += eSh;
  let ln = $('#bline'); if (!ln) { ln = document.createElement('div'); ln.id = 'bline'; ln.innerHTML = '<i></i>'; ar.appendChild(ln); }
  ln.style.bottom = Math.round(LINE) + 'px';
  const FX = heroF ? [[50, 24, 76, 6, 94], [36, 64, 14, 86, 50]] : [[36, 64, 14, 86, 50], [50, 24, 76, 6, 94]];   // [前排, 后排] 依次站的横向位置（%）：你那一排从正中排起
  const WX = [50, 39, 61, 28, 72, 17, 83, 6, 94, 44, 56, 33, 67];   // 宽屏一排：你在正中，往两边依次站
  const nRow = [fA.length, bA.length], PX = (n, back) => n <= 1 ? [50] : n === 2 ? (back ? [24, 76] : [36, 64]) : n === 3 ? [24, 50, 76] : [14, 38, 62, 86];   // 摆了阵：每排按人数居中排开
  main.forEach(u => { const back = u._fc === 1; if (wide) put(u, B.fm ? PX(main.length, false)[u._wi % main.length] : WX[u._wi % WX.length], L.A1, Z, 24);
    else put(u, B.fm ? PX(nRow[u._fc], back)[u._fi % Math.max(1, nRow[u._fc])] : FX[u._fc][u._fi % 5], back ? L.A0 : L.A1, Z, back ? 30 : 24); });
  const used = new Set(mins.map(u => u._slot).filter(x => x != null)); mins.forEach(u => { if (u._slot == null) { let k = 0; while (used.has(k)) k++; u._slot = k; used.add(k); } });
  const MX = [63, 37, 85, 15, 74, 26, 50, 95, 5];   // 召唤物：你头顶前面横着一排，各占一个位子，前面的倒了后面的也不挪
  mins.forEach(u => put(u, wide ? WX[(main.length + u._slot) % WX.length] : MX[u._slot % MX.length], L.AM, Z * 0.78, 18));
  for (const u of rest) { if (u.hp <= 0 && u._fs != null && rest.some(o => o !== u && o.hp > 0 && o._fs === u._fs)) continue;
    const [r, x] = SL[u._fs]; put(u, x, r ? L.E1 : L.E0, ZE, r ? 10 : 16); }
  const BX = boss.length === 1 ? [50] : boss.length === 2 ? [32, 68] : [18, 50, 82];
  boss.forEach((u, i) => put(u, BX[i % BX.length], L.B, ZE * 0.92, 8 - i));
}
function applyStep(o, anim) {
  if (!B) return;
  drawTurnBar();
  { const wb = $('#wardbar'); if (wb && B.ward) { const W = B.ward, k = Math.min(1, W.n / W.need); wb.hidden = false; wb.innerHTML = `<b>${esc(W.name)} · tụng niệm</b><i><em style="width:${k * 100}%"></em></i><span>${W.n} / ${W.need}</span>`; } }
  const foes = $('#foes'), allies = $('#allies'); if (!foes) return;
  const wasDead = new Set(B.units.filter(u => u._shownDead).map(u => u.id)); let refit = false;
  const danger = B.units.some(u => u.side === 'e' && u.hp > 0 && u.charging);
  for (const u of B.units) {
    let el = document.getElementById('u-' + u.id);
    if (!el) { if (u.dead && u.kind === 'minion') continue; el = unitEl(u); (u.side === 'e' ? foes : allies).appendChild(el); refit = true; }
    if (u.dead && u.kind === 'minion') { el.classList.add('die'); setTimeout(() => { el.remove(); fitSides(); }, 500); continue; }
    if (u.phased && el.dataset.phased !== '1') { el.dataset.phased = '1'; el.querySelector('.sp').innerHTML = VFX.rigHTML(u, SPR.img(u.spr, +el.dataset.size, u.pal), +el.dataset.size, u.spr); el.querySelector('.un').firstChild.textContent = u.name; bump(el, 'phase', 800); }
    if (u.dead && !u._shownDead) { u._shownDead = true; if (u.side === 'e') accDead(el); if (!u.escaped && anim) VFX.onDeath(u.id, u.kind);
      if (u.side === 'e' && !u.escaped && anim && el.animate) { const big = u.kind === 'boss'; el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: big ? 2000 : 800, fill: 'forwards' }); }
      else el.classList.add(u.escaped ? 'fled' : u.kind === 'ally' ? 'retreat' : 'die');
      if (u.side === 'e' && B && !B.over) setTimeout(() => { if (B && !B.over) { el.classList.add('gone'); fitSides(); } }, u.kind === 'boss' ? 2100 : 850); }   // 倒下的敌人动画放完就收起来，不占位子
    el.classList.toggle('danger', danger && u.side === 'p' && u.hp > 0 && u.kind !== 'minion');
    el.classList.toggle('charging', !!u.charging && u.hp > 0);
    el.classList.toggle('dead', !!u.dead);
    el.classList.toggle('tgt', u.side === 'e' && B.target === u.id && u.hp > 0);
    { const w = Math.max(0, u.hp / u.maxHp * 100).toFixed(1) + '%', shw = u.shield > 0 ? Math.min(100, u.shield / u.maxHp * 100).toFixed(1) + '%' : '0';   // 2026-11-25 省电：血条只在变了的时候写。白色残影在红条底下，回血时慢慢涨也看不见，不用再「关过渡 + 强制重排」（原来每一步每个人都重排一次，人越多越烫，赶尸人最多）
      const hb = el._hb || (el._hb = { i: el.querySelector('.hpbar i'), tr: el.querySelector('.hpbar .tr'), sh: el.querySelector('.hpbar .sh'), sp: el.querySelector('.hpbar span') });
      if (hb.w !== w) { hb.w = w; hb.i.style.width = w; if (hb.tr) hb.tr.style.width = w; }
      if (hb.shw !== shw) { hb.shw = shw; hb.sh.style.width = shw; }
      const tx = u.escaped ? "chuồn rồi" : u.kind === 'ally' && u.dead ? "tạm lui" : `${fmtBig(Math.max(0, Math.round(u.hp)) * uK(u))} / ${fmtBig(u.maxHp * uK(u))}`; if (hb.tx !== tx) { hb.tx = tx; hb.sp.textContent = tx; } }
    const st = [];
    if (u.kind === 'ward' && B.ward) { st.push(`<span style="color:#ffe58a">Giữ lấy ông ấy!</span>`); el.querySelector('.sp').style.opacity = (1 - 0.55 * Math.min(1, B.ward.n / B.ward.need)).toFixed(2); }
    if (u.kind === 'minion' && u.life != null && u.hp > 0) st.push(`<span class="zl" data-act="stinfo" data-arg="${u.id}|life">${u.life}</span>`);   // 僵尸还能出手几次
    if (u.def && u.def.goblin && !u.dead) st.push(`<span style="color:#f1c94a">${GOBLIN_FLEE - (u.flee || 0)} lượt nữa chuồn</span>`);
    if (u.fleeDef && u.flee && u.hp > 0) st.push(`<span style="color:#f1c94a">${Math.max(0, (u.fleeDef.n || 3) - u.flee + 1)} lượt nữa bỏ chạy</span>`);
    { const L = unitSts(u).filter(x => x.k !== 'hufa' && x.k !== 'call' && x.k !== 'shield');   // 2026-11-24 战场上统一成小圆点，最多两个，多的折成 +N；护体看血条末端那截白；全名和回合数在下面状态栏里
      L.slice(0, 2).forEach(x => st.push(`<span class="sd" style="--c:${x.c}" data-act="stinfo" data-arg="${u.id}|${x.k}">${dotTxt(ST_DOT[x.k] || x.n.charAt(0))}</span>`));
      if (L.length > 2) st.push(`<span class="sd m" data-act="stinfo" data-arg="${u.id}|all">+${L.length - 2}</span>`); }
    el.classList.toggle('frozen', !!u.st.frozen);
    // 状态挂在身上：火、毒、冰壳、金星、护盾、狂暴
    const alive = u.hp > 0 && !u.dead;
    el.classList.toggle('st-burn', alive && !!u.st.burn); el.classList.toggle('st-tox', alive && !!u.st.poison);
    el.classList.toggle('st-ice', alive && !!u.st.slow); el.classList.toggle('st-stun', alive && !!u.st.frozen);
    el.classList.toggle('st-shd', alive && u.shield > 0); el.classList.toggle('st-cur', alive && !!u.st.curse);
    el.classList.toggle('st-rage', alive && !!(u.enraged || u.rageB || (u.aff && u.aff.includes('enraged') && u.hp / u.maxHp < 0.5)));
    if (anim) { if (el._ice && !u.st.slow) VFX.onThaw(u.id); if (el._shd && !(u.shield > 0) && alive) VFX.onShieldBreak(u.id); }
    el._ice = !!u.st.slow; el._shd = u.shield > 0;
    if (u.side === 'e' && u.kind === 'boss' && alive && u.charging && !el._chg && anim) { const ar = $('#arena'); if (ar) { const w = document.createElement('div'); w.className = 'bwarn'; w.textContent = "⚠ Nó đang tụ lực — chiêu sau rất nặng"; ar.appendChild(w); setTimeout(() => w.remove(), 1800); } SFX.play('gong'); }
    el._chg = !!(u.charging && alive);
    { const h = st.join(''); if (el._stsH !== h) { el._stsH = h; el.querySelector('.sts').innerHTML = h; } }   // 2026-11-25 省电：状态小圆点没变就不重写（原来每一步每个人都重建一遍）

  }
  if (o) {
    let hurtHero = false, crit = false, dmg = false, healed = false;
    const actorU = B.units.find(u => u.id === o.actor);
    const basicId = actorU && actorU.kind === 'hero' ? (CLASSES[actorU.cls].skills.find(k => !k.cd) || {}).id : null;
    const isBasic = o.cast && basicId && o.cast.id === basicId;
    const SP = SAVE.speed || 1, reactN = new Set((o.react || []).map(R => R.n)), popIdx = {}, byAlly = actorU && (actorU.kind === 'ally' || actorU.kind === 'minion');
    const ALL = !!SAVE.allNums;   // 设置里「伤害数字：全部显示」；默认只看主角
    // 2026-11-24 跳字再细：同一个目标这一下的数字合成一个（多段带「×n」）；普攻不跳；颜色只留白、金（暴击）、淡金（反震金刚震）、橙（灼烧）、绿（中毒）
    const G = new Map(), TX = [], REFL = new Set(["Phản chấn", "Kim Cương Chấn", "Phản thương", "Huyền Giáp Ngọc"]), SAVEP = new Set(["Bất hủ", "Đồng tâm", "Hình nhân", "Bất Tử", "Lột Da"]);   // 免死、保命的字：任何时候都跳
    let cmbN = 0;
    for (const [id, txt0, c, isSt, by, tag] of o.pops) {
      const el = document.getElementById('u-' + id); if (!el) continue;
      const tu = B.units.find(u => u.id === id);
      if (isSt || reactN.has(txt0)) continue;   // 状态名挂在身上、连招名在顶上横幅里，不在人头上飘
      const txt = c === 'thorn' ? txt0.replace(/^\D+/, '') : txt0, dmgN = /^\d+$/.test(txt), dot = /^-\d+$/.test(txt);
      const onHero = id === 'P', mine = by === 'P' || by === 'Z';   // 僵尸打的算你的（2026-11-25）
      let show = true;
      if (!ALL) {   // 只看主角：妖物身上只跳主角打的（含普攻，累计成一个数）；主角身上跳小号掉血、回血、格挡闪避；伙伴、僵尸身上不跳
        if (tu && tu.side === 'e') show = mine && (dmgN || dot);   // 2026-11-24 累计以后普攻也算进总数
        else if (onHero) show = dmgN || dot || c === 'heal' || txt === "Đỡ đòn" || txt === "Né tránh" || SAVEP.has(txt);
        else show = SAVEP.has(txt);
      }
      if (!show) { if (anim && dmgN && SP < 3) { if (tu && tu.side === 'e') { if (tu.hp > 0) VFX.onHit(id, false); } else bump(el, 'hurt', 300); } }
      else if (dmgN || dot || c === 'heal') {
        const kk = id + '|' + (c === 'heal' ? 'heal' : onHero && !ALL ? 'hurt' : tu && tu.side === 'e' ? 'dmg' : dot ? 'dot' + c : 'dmg');   // 2026-11-24 累计：妖物身上主角的伤害（含持续伤害）合成一个数
        const g = G.get(kk) || { id, el, tu, onHero, n: 0, v: 0, vals: [], crit: false, tag: '', c, dot, heal: c === 'heal', ally: ALL && byAlly && tu && tu.side === 'e' };
        const vv = +txt.replace(/\D/g, '') || 0; g.v += vv; g.vals.push(vv); g.n++; if (c === 'crit') g.crit = true; if (tag && !g.tag) g.tag = tag; if (g.c === 'crit' && c !== 'crit') g.c = c;
        G.set(kk, g);
      } else TX.push({ el, txt, c, onHero, save: SAVEP.has(txt) });
      if (anim && dmgN && actorU && actorU.side === 'p' && tu && tu.side === 'e') cmbN++;   // 连击数一步里攒着，最后改一次（僵尸集火一步六七下，原来每下都重写一遍）
      if (anim && (txt === "Né tránh" || txt === "Đỡ đòn") && el.animate) { el.animate([{ transform: 'none' }, { transform: txt === "Né tránh" ? 'translate(-22px,-6px)' : 'translateX(-6px)' }, { transform: 'none' }], { duration: 260 }); if (txt === "Đỡ đòn") VFX.onBlock(id); }
      if (anim && dot && c === 'burn') { bump(el, 'flare', 450); VFX.onFlare(id); }
      if (anim && dot && c === 'poison') bump(el, 'drip', 450);
      if (anim && dmgN && el._shd) bump(el, 'crack', 320);
      const big = dmgN && tu && tu.maxHp && +txt / tu.maxHp >= 0.08;
      if (dmgN && anim && show) { if ((SP < 3 && by !== 'Z') || big || c === 'crit') bump(el, 'hurt', 300); dmg = true; if (id === 'P') hurtHero = true; if (c === 'crit' && !onHero) { crit = true; VFX.onCrit(id); } }   // 僵尸的小伤害不抖妖物（2026-11-25 省电）   // 2026-11-25 暴击不再整场顿帧（顿帧交给 VFX：一倍速、1.2 秒最多一次）
      if (c === 'heal') { healed = true; if (anim) VFX.onHeal(id); }
    }
    if (cmbN) bumpCombo(cmbN);
    // 2026-11-24 跳字第七版「累计」：每个目标头上只留一个数，后面每打一下原地往上加、弹一下；暴击闪金；打死放大定格；停手一会儿整体上飘淡出。主角掉血、回血各一个
    let ji = 0;
    for (const g of G.values()) {
      const K = uK(g.tu), kill = !g.onHero && g.tu && g.tu.hp <= 0 && !g.heal;
      const key = g.heal ? 'heal' : g.onHero && !ALL ? 'hurt' : 'dmg';
      const friend = g.onHero || !!(g.tu && g.tu.side === 'p');   // 自己人身上：红字带减号
      const cls = g.heal ? 'heal' : friend ? 'hurt' : '';
      const side = g.onHero && !ALL ? (g.heal ? ' mr' : ' ml') : '';
      const sign = g.heal ? '+' : friend ? '-' : '';
      const delay = o.jzz && !g.onHero ? ji++ * 60 * spdF() : 0;   // 金刚震：一只只亮
      const put = () => { accPut(g.el, key, g.v * K, { cls: cls + side, sign, crit: g.crit && !g.onHero, kill, head: !g.onHero && !!(g.tu && g.tu.side === 'e') });
        if (anim && !g.onHero && !(g.tu && g.tu.hp <= 0)) VFX.onHit(g.id, g.crit); };
      if (delay) setTimeout(put, delay); else put();
    }
    for (const t of TX) if (SP < 2 || t.save) popPut(t.el, t.save ? 'pop txt save' : `pop txt ${t.onHero && !ALL ? 'hurt ml' : t.c}`, esc(String(t.txt).replace(/\d+/, n => fmtBig(+n))), t.save ? 'c' : 'h');
    if (anim && o.yi) yiFlash(o.yi, YISHI[o.yi] && YISHI[o.yi].n);
    if (anim && actorU && actorU.kind === 'ally' && o.cast) {   // 伙伴出手：头顶冒招式名，身上亮一圈
      const el = document.getElementById('u-' + actorU.id), mv = allyMoveName(actorU, o.cast.id);
      if (el && mv && SAVE.allNums) { const t = document.createElement('span'); t.className = 'pop move'; t.textContent = mv; el.appendChild(t); setTimeout(() => t.remove(), 1000); bump(el, 'acting', 600); }
    }
    if (anim && o.jzz) { VFX.onJinzhen(); SFX.play('react'); }
    if (anim && o.react) { o.react.forEach(R => VFX.onReact(R.id, R.n, (STATES[R.s] || {}).c || '#e8b0ff')); SFX.play('react'); if (!SAVE.flags.combo1) { SAVE.flags.combo1 = 1; setTimeout(() => toast(`Ra được liên chiêu “${o.react[0].n}”! Dùng chiêu mở đòn gây trạng thái cho địch trước, rồi đánh bằng chiêu kết đòn là có thêm hiệu ứng. Vào “Tu luyện · Võ học” xem cách phối hợp`), 600); } }
    if (anim && o.cast) {
      const e = o.cast.elem;
      if (o.cast.aoe) { const f = $('#flash'); f.className = 'flash on f-' + e; setTimeout(() => { f.className = 'flash'; }, 380); }
      if (!o.cast.enemy && ['fire', 'cold', 'light', 'magic', 'holy', 'poison', 'buff'].includes(e)) SFX.play(e);
      else if (o.cast.enemy && o.cast.aoe) SFX.play(e === 'cold' ? 'cold' : 'fire');
      if (o.cast.id === 'summon' && !o.cast.enemy) SFX.play('bell');
    }
    if (anim) {
      if (crit) SFX.play('crit'); else if (hurtHero) SFX.play('hurt'); else if (dmg) SFX.play('hit');
      if (healed) SFX.play('heal');
      if (B.units.some(u => u._shownDead && !wasDead.has(u.id))) { SFX.play('death');
        if (typeof GFX !== 'undefined' && !B.units.some(u => u.side === 'e' && u.hp > 0 && !u.dead)) { GFX.slowmo(650, 0.3); GFX.punch(0.05); } }
    }
  }
  if (refit) fitSides();
  const P = B.P, rb = $('#rbhp');
  const foes0 = aliveOf(B, 'e'), tg = foes0.find(f => f.id === B.target) || foes0[0];
  const hs = $('#hudsk'); if (hs) hs.innerHTML = `<div class="hs-top">${resChip(P)}${heroKeyChips(P)}</div><div class="hs-grid">` + [...P.skills.filter(k => k.cd), ...(B.castAuto ? [] : P.skills.filter(k => !k.cd))].map(k => { const st = k.ap || (k.pay && k.pay.s !== 'any' ? k.pay.s : null), c = st ? STATES[st].c : '#e8b0ff';
      const payOn = k.pay && tg && (k.pay.s === 'any' ? stHas(tg, 'any') : stHas(tg, k.pay.s)), tag = !k.cd ? "Cơ" : payOn ? "Kết" : k.ap ? STATES[k.ap].n[0] : k.pay ? "Kết" : '';
      return `<button class="skb2 ${k.left > 0 ? 'cd' : 'rdy'} ${payOn && k.left <= 0 ? 'payon' : ''} auto" style="--c:${c}" data-act="castq" data-arg="${k.id}" title="${esc(k.n)}"><b>${skShort(k.n)}</b><small>${k.left > 0 ? `Hồi chiêu ${k.left}` : payOn ? "Thu chiêu!" : !k.cd ? "Đánh thường" : "Sẵn sàng"}</small></button>`; }).join('') + '</div>';
  const ub = $('#ultb'); if (ub) { const r = Math.round(P.rage || 0), full = r >= 100, n = Math.floor(r / 100), U = ULTS[P.cls];   // 2026-11-24 第二版：能存两格
    $('#ultfill').style.width = (full ? 100 : r) + '%'; ub.classList.toggle('ready', full); ub.classList.toggle('manual', full); ub.classList.toggle('queued', !!B.ultReq); ub.classList.toggle('two', n >= 2);
    $('#ultpct').textContent = B.ultReq ? "Ngay" : n >= 2 ? "Đầy hai ô" : full ? `Một ô · ${r - 100}%` : `${r}%`; ub.disabled = B.over;
    if (full && !B.over && !SAVE.flags.ult3) { SAVE.flags.ult3 = 1; setTimeout(() => toast(`Bí kỹ đã đổi: tích chậm, giữ được hai ô, để dành đánh yêu vương. Chạm «${U.n}» — ${U.d}. Không tốn lượt, còn cắt được yêu vương đang tụ lực; nộ khí giữ sang trận sau. Khi bật tự động ra chiêu, chỉ dùng ô thứ hai để cắt tụ lực giúp bạn, luôn chừa lại một ô`, 7000), 300); } }
  if (rb) { rb.querySelector('i').style.width = Math.max(0, P.hp / P.maxHp * 100) + '%'; rb.querySelector('span').textContent = `${fmtBig(Math.max(0, Math.round(P.hp)) * uK(P))} / ${fmtBig(P.maxHp * uK(P))}`; }
  const pot = $('#rbpot'); if (pot) pot.textContent = "Đan dược " + SAVE.run.potions;
  drawSbar(); drawStPop();
  const pr = $('#rbprog'); if (pr) pr.lastChild.textContent = `Tiến độ ${Math.floor(SAVE.run.prog)}%`;
  const xg = $('#rbxiang'); if (xg) { const L = xiangLeft(SAVE.run); xg.textContent = `Hương ${xiangTxt(SAVE.run)}`; xg.classList.toggle('low', L > 0 && L < 0.25); xg.classList.toggle('out', L <= 0); }
  const log = $('#blog'); if (log) log.innerHTML = B.logs.slice(-6).reverse().map(l => `<div>${esc(l)}</div>`).join('') || '<div>……</div>';
}
function finishRunView(run, outcome) {
  if (run && run.mode === 'rift') setTimeout(() => lbSync(), 800);   // 排行榜：幻境破纪录就传
  endRun(run, outcome); LASTRUN = run; VIEW = 'end'; B = null; save(); render(); achToast(run.ach); formNotify();   // 阵法跟着进度学会
}
function battleContinue() {
  const run = SAVE.run;
  if (run && run.world) return worldBattleContinue();
  if (!BRES.win && run.mode === 'rift') {
    const pen = riftRevive(run); B = null; VIEW = 'map'; save(); render();
    banner("Bạn ngã xuống rồi", `Ảo Cảnh ném bạn về lối vào · hương cháy mất ${Math.round(pen / riftLimit(run.riftLv) * 100)}%`, 1800); return;
  }
  if (!BRES.win) return finishRunView(run, 'dead');
  if (B.kind === 'boss') {
    if (run.mode === 'rift') { riftComplete(run); SFX.play('legend'); return finishRunView(run, 'win'); }
    if (run.floor < 3) {
      nextFloor(run); B = null; VIEW = 'map'; save(); render(); SFX.play('door');
      banner(`Tầng ${CN[run.floor]}`, `Hồi 50% khí huyết${hasMod(run, 'scarce') ? '' : ", đan dược +1"}`, 1600); return;
    }
    const res = storyComplete(run), C = CHAPTERS[run.chapter - 1], key = 'o' + run.chapter;
    endRun(run, 'win'); LASTRUN = run; B = null; VIEW = 'end'; save();
    const tut = res.first && run.diff === 'normal' && typeof TUTORIALS !== 'undefined' && TUTORIALS[run.chapter];
    const finish = () => {
      if (tut && !seen('t' + run.chapter)) { markSeen('t' + run.chapter); save(); return playDialog(tut, null, finish); }
      if (res.ending && !seen('ending')) { markSeen('ending'); save(); return playDialog(ENDING, C.boss, () => { VIEW = 'credits'; render(); window.scrollTo(0, 0); SFX.play('win'); achToast(run.ach); }); }
      render(); window.scrollTo(0, 0); achToast(run.ach);
    };
    if (C.outro.length && !seen(key)) { markSeen(key); save(); return playDialog(C.outro, C.boss, finish); }
    return finish();
  }
  B = null; VIEW = 'map'; save(); render();
}


// ---------- 大地图 ----------
let WGEN = 0, WDRAWT = 0, WF = 1, WMOVING = false;   // 地图重画：代数、上一帧时间、这一帧相当于几个 60 帧、这一帧有没有东西在动
let MAPGOAL = null, RDEATH = 0, RARMED = null;   // 小地图点的目的地；自动闯关连着倒下几次；这一局已经按记忆开过自动
let WALK = null, WAUTO = false, WAUTOZ = null, WKEY = null, WLOOP = 0, WCAM = null, WHERO = null, WMONP = {}, WTAP = null, WTRK = false, JOY = null, WGOAL = null, WPART = [], WTRAIL = [];
const WTS = () => (window.innerWidth < 700 ? 42 : 52), W_STEP = 150;
const wch = () => SAVE.run.chapter;
const backView = () => (SAVE.run && SAVE.run.world ? 'world' : 'map');
const wTheme = () => { const ch = wch(), d = wmap(ch).def, dn = WMAPS[ch] && WMAPS[ch].daynight, nt = !!wstate(ch).flags.night;
  if (d.yy && wstate(ch).flags.yin && d.themeYin) return SCENE_THEMES[d.themeYin];
  return SCENE_THEMES[dn && nt && d.themeNight || dn && !nt && d.themeDay || d.theme] || SCENE_THEMES.grave; };   // 昼夜：同一处地方白天黑夜两个样
function zoneName() { const r = SAVE.run, S = wstate(r.chapter), m = wmap(r.chapter), z = m.zoneAt(S.pos.x, S.pos.y); return z.id === S.sc ? m.def.n : z.n; }
// 依次弹出的提示
const TQ = []; let TQon = false;
function qtoast(msg) { TQ.push(msg); if (!TQon) nextToast(); }
function nextToast() { const m = TQ.shift(); if (m == null) { TQon = false; return; } TQon = true; toast(m); setTimeout(nextToast, TQ.length ? 1500 : 200); }
const eliteTagTxt = (mn, def) => { if (!SAVE.run) return ''; const A = eliteAffsOf(SAVE.run, mn).map(a => (ELITE_AFFIXES.find(x => x.id === a) || {}).n).filter(Boolean); if (def && def.trait && TRAITS[def.trait]) A.unshift(TRAITS[def.trait].n); return A.join(' · '); };
const riftHint = run => { const R = wmap(RCH).def.rift; return run.rw.boss ? "Yêu vương giữ ải đã hiện thân — tìm nó, hạ nó"
  : `Đụng một bầy yêu vật, các bầy bên cạnh bị cuốn vào cùng. Tinh anh ngã xuống rơi tinh phách, đi tới nhặt. ${R.last ? "Đây là tầng cuối, yêu vật béo nhất." : R.fi ? `Tầng này mỗi con yêu vật cho tiến độ +${Math.round((R_DEEP[R.fi] - 1) * 100)}%, càng xuống sâu càng béo.` : "Càng xuống sâu càng béo: tầng kế mỗi con yêu vật cho nhiều tiến độ hơn."}`; };
// 幻境的地图界面：没有任务栏，换成进度条和香
function riftWorldHTML() {
  const run = SAVE.run, B = run.rbuff;   // 地图顶上只留层名：同伴的名字放这儿会和层名挤在一起
  const hint = riftHint(run);
  return `${runBar(run)}
    <div class="rhud"><div class="rprog ${run.prog >= 100 ? 'full' : ''}" id="rprog"><i style="width:${run.prog}%"></i><em style="left:40%"></em><em style="left:80%"></em><span>${run.rw.boss ? `Tiến độ đã đầy · yêu vương giữ ải đã hiện thân${(() => { const mb = wScene(RCH).mons.find(o => o.boss && o.bst); if (!mb) return ''; const L = mb.bst.b.filter(x => x.hp > 0); return L.length ? ` · còn ${Math.round(100 * L.reduce((a, x) => a + x.hp, 0) / L.length)}% máu` : ''; })()}` : `Tiến độ Ảo Cảnh ${Math.floor(run.prog)}%`}</span></div>${xiangBar(run)}${B ? `<p class="rbuff">${R_PYLONS[B.k].n} đang có hiệu lực: còn ${B.n} trận</p>` : ''}<p class="rhint" id="rhint">${hint}</p></div>
    <div class="wmap" id="wmap"><canvas id="wcv"></canvas><div class="wzone" id="wzone">${esc(zoneName())}</div>
      ${(() => { const E = fmEnemyNow(); if (!E) return '<div class="wfol"></div>'; const k = formK(formCur() || 'san', E.b || E.f);
        return `<button class="wfol fmchip k${k}" data-act="fmopen">${E.b ? "Yêu vương" : "Trận yêu"} ${fmShort(E.b || E.f)} · <b>${fmKTxt(k)}</b></button>`; })()}
      ${SAVE.joy ? '<div class="joy" id="joy"><i></i></div>' : ''}</div>
    <div class="wctl"><button class="btn ${WAUTO ? '' : 'ghost'} wauto" data-act="wauto">${WAUTO ? "Đang vượt ải…" : "Tự vượt ải"}</button>
      <button class="btn ghost" data-act="wmini">Bản đồ</button>
      <button class="btn ghost" data-act="bag">Nhân vật${talentInfo(run.cls).free ? ` <b class="upn">${talentInfo(run.cls).free}</b>` : ''}</button>
      <button class="btn ghost" data-act="rquit">Rời đi</button></div>
`;
}
function worldHTML() {
  if (isRift(SAVE.run)) return riftWorldHTML();
  const run = SAVE.run, ch = run.chapter, tr = wTracker(ch), m = tr[0];
  const sides = tr.slice(1), S = wstate(ch);
  const fol = [S.flags.ngocFollow ? 'Ngoc' : '', S.flags.zhenFollow ? "Cô Trân" : '', S.flags.escort ? SPEAKERS[S.flags.escort].n : ''].filter(Boolean);
  const comp = wCompNow(ch);
  return `${runBar(run)}
    <div class="wtrack ${WTRK ? 'open' : ''}">
      ${m ? `<button class="wt-main" data-act="wgo" data-arg="${m.id}"><span class="wt-tag">Chính</span>${trkTD(m)}<em>Đi tới ▸</em></button>` : "<div class=\"wt-main\"><b>Đã xong cốt truyện chương này</b><small>Có thể tiếp tục khám phá, làm nhiệm vụ phụ, săn yêu vật</small></div>"}
      ${sides.length ? `<button class="wt-more ${sides.some(q => q.key) ? 'k' : ''}" data-act="wtrk">Phụ${sides.some(q => q.bty) ? " · Truy nã" : ''} ${sides.length}${sides.some(q => q.key) ? " · có việc gấp" : ''} ${WTRK ? '▲' : '▼'}</button>` : ''}
      ${WTRK ? `<div class="wt-list">${sides.map(q => `<button class="wt-side" data-act="wgo" data-arg="${q.id}"><span class="wt-tag s ${q.key ? 'k' : q.bty ? 'b' : ''}">${q.key ? "Gấp" : q.bty ? "Truy nã" : "Phụ"}</span>${trkTD(q)}<em>Đi tới ▸</em></button>`).join('')}</div>` : ''}
    </div>
    <div class="wmap" id="wmap"><canvas id="wcv"></canvas><div class="wzone" id="wzone">${esc(zoneName())}</div>
      <div class="wfol">${fol.length ? `Đi cùng: ${fol.map(esc).join(", ")}` : comp ? `Đồng hành: ${esc(COMPANIONS[comp].n)}` : ''}${run.food ? `${fol.length || comp ? ' · ' : ''}No bụng: ${esc((FOODS.find(f => f.id === run.food) || {}).n || '')}` : ''}</div>
      ${SAVE.joy ? '<div class="joy" id="joy"><i></i></div>' : ''}</div>
    <div class="wctl">${(() => { const cc = wCompNow(run.chapter); if (!cc) return ''; const mk = wNpcMark(run.chapter, cc); if (!mk) return ''; return `<button class="btn" data-act="wtalkc" title="Nói chuyện với ${esc((SPEAKERS[cc] || {}).n || cc)}">💬${esc(((SPEAKERS[cc] || {}).n || cc).slice(0, 3))}</button>`; })()}${wYinScene(ch) && wHasKey(ch, 'yinyangjing') ? `<button class="btn ${S.flags.yin ? '' : 'ghost'} wyin" data-act="wyin">Gương Âm Dương · ${S.flags.yin ? "Mặt Âm" : "Mặt Dương"}</button>` : ''}<button class="btn ${WAUTO ? '' : 'ghost'} wauto" data-act="wauto">${WAUTO ? "Đang khám phá…" : "Tự khám phá"}</button>
      <button class="btn ghost" data-act="wlog">Nhiệm vụ</button><button class="btn ghost" data-act="wmini">Bản đồ</button>${FORM_IDS.some(formOpen) ? "<button class=\"btn ghost\" data-act=\"fmopen\">Trận pháp</button>" : ''}
      <button class="btn ghost" data-act="bag">Nhân vật${talentInfo(run.cls).free ? ` <b class="upn">${talentInfo(run.cls).free}</b>` : ''}</button></div>
`;
}
// ---- 绘制 ----
function wSetup() {
  const cv = $('#wcv'); if (!cv) return;
  const box = $('#wmap'), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = box.clientWidth * dpr; cv.height = box.clientHeight * dpr;
  cv.style.width = box.clientWidth + 'px'; cv.style.height = box.clientHeight + 'px';
  const S = wstate(wch()), ts = WTS();
  if (!WHERO || WHERO.ch !== wch() || WHERO.sc !== S.sc) { WHERO = { ch: wch(), sc: S.sc, x: S.pos.x, y: S.pos.y, flip: false, t: 0 }; WMONP = {}; WCAM = null; WPART = []; WTRAIL = []; }
  WHERO.x = S.pos.x; WHERO.y = S.pos.y;
  if (!WCAM) WCAM = { x: S.pos.x, y: S.pos.y };
  if (isRift(SAVE.run) && SAVE.rAuto && RARMED !== SAVE.run && !SAVE.run.riftDone) { RARMED = SAVE.run; RDEATH = 0;   // 上次开着自动闯关：进门（或刷新后接着打）就自己开始
    setTimeout(() => { if (VIEW === 'world' && !WAUTO && !WALK && isRift(SAVE.run)) wStartAuto(); }, 900); }
  cancelAnimationFrame(WLOOP); clearTimeout(WLOOP); const gen = ++WGEN; WDRAWT = 0;
  // 省电：有东西在动（走路、镜头、妖物挪步、点地涟漪）才 60 帧；静止时约 20 帧，只剩火光、呼吸这些小动静
  const loop = t => { if (gen !== WGEN || VIEW !== 'world' || !$('#wcv') || !SAVE.run || !SAVE.run.world) return; wDraw(cv, dpr, ts, t);
    const mv = WMOVING || WALK || JOY, low = SAVE.gfx === 0;   // 特效「低」= 省电：走路 30 帧，静止 8 帧
    if (mv && !low) WLOOP = requestAnimationFrame(loop); else WLOOP = setTimeout(() => { if (gen === WGEN) WLOOP = requestAnimationFrame(loop); }, mv ? 22 : low ? 120 : 38); };
  WLOOP = requestAnimationFrame(loop);
  cv.onpointerdown = e => { const r = cv.getBoundingClientRect(); wTap(e.clientX - r.left, e.clientY - r.top, cv, ts); };
  if (SAVE.joy) wJoySetup();
}
const hash2 = (x, y, k) => { const v = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
// 地面
function wFloor(g, T, c, x, y, px, py, ts, h) {
  const K = T.kind;
  if (K === 'room') {
    if (c === ',') { g.fillStyle = T.p; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = 'rgba(232,193,58,.18)'; g.fillRect(px + 3, py + 3, ts - 6, 2); g.fillRect(px + 3, py + ts - 5, ts - 6, 2); return; }
    g.fillStyle = shade(T.g, (y % 2 ? 14 : 20) + h * 6); g.fillRect(px, py, ts + 1, ts + 1);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px, py + ts - 2, ts + 1, 2); g.fillRect(px + ((x * 7 + y * 3) % 3) * ts / 3, py, 2, ts);
    return;
  }
  if (K === 'dungeon') {
    g.fillStyle = c === ',' ? shade(T.p, 10) : shade(T.g, 16 + h * 8); g.fillRect(px, py, ts + 1, ts + 1);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
    if (h > 0.85) { g.fillStyle = 'rgba(120,200,190,.08)'; g.fillRect(px + h * ts * 0.6, py + ts * 0.5, ts * 0.3, 2); }
    return;
  }
  if (K === 'town' && c === '=') { g.fillStyle = shade(T.p, 4 + h * 10); g.fillRect(px, py, ts + 1, ts + 1); g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeRect(px + 0.5, py + 0.5, ts / 2, ts / 2); g.strokeRect(px + ts / 2 + 0.5, py + ts / 2 + 0.5, ts / 2 - 1, ts / 2 - 1); return; }
  g.fillStyle = h < 0.33 ? shade(T.g, 22) : h < 0.66 ? shade(T.g, 28) : shade(T.g, 17); g.fillRect(px, py, ts + 1, ts + 1);
  g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(px, py + ts - 2, ts + 1, 2);
  if (c === '=') { g.fillStyle = shade(T.p, 12); g.fillRect(px + ts * 0.12, py, ts * 0.76, ts + 1); g.fillStyle = shade(T.p, -10); g.fillRect(px + ts * 0.3, py + ts * (0.2 + h * 0.4), 3, 3); }
  else if (h > 0.78) { g.fillStyle = K === 'town' ? 'rgba(110,150,70,.35)' : shade(T.g, 14); g.fillRect(px + h * ts * 0.7, py + hash2(x, y, 2) * ts * 0.7, 3, 2); }
}
// 挡路的地形
function wSolid(g, T, m, c, x, y, px, py, ts, spr) {
  const K = T.kind, up = wTile(m, x, y - 1), dn = wTile(m, x, y + 1);
  if (c === '^') {
    const base = T.wall || '#2e2622';
    g.fillStyle = base; g.fillRect(px, py, ts + 1, ts + 1);
    if (K === 'dungeon') { g.fillStyle = shade(base, 14); for (let r = 0; r < 3; r++) g.fillRect(px + (r % 2 ? 0 : ts / 2) + 1, py + r * ts / 3 + 1, ts / 2 - 2, ts / 3 - 2); }
    else { g.fillStyle = shade(base, 16); g.fillRect(px + 2, py + 2, ts - 4, ts * 0.45); }
    if (dn !== '^') { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(px, py + ts - 4, ts + 1, 4); }
  } else if (c === 'H') {
    const roof = '#3b2c30', wall = '#6a4a32';
    if (dn !== 'H') { g.fillStyle = wall; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = '#2a1a12'; g.fillRect(px + ts * 0.3, py + ts * 0.25, ts * 0.4, ts * 0.45);
      g.fillStyle = 'rgba(255,190,90,.35)'; g.fillRect(px + ts * 0.34, py + ts * 0.3, ts * 0.32, ts * 0.35); g.fillStyle = '#2a1a12'; g.fillRect(px + ts * 0.49, py + ts * 0.25, 2, ts * 0.45); }
    else { g.fillStyle = roof; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = shade(roof, 14); for (let r = 0; r < 4; r++) g.fillRect(px, py + r * ts / 4, ts + 1, 2);
      if (up !== 'H') { g.fillStyle = '#1e1416'; g.fillRect(px, py, ts + 1, 4); }
      if (wTile(m, x, y + 2) !== 'H' && dn === 'H') { g.fillStyle = '#1a1012'; g.fillRect(px - 2, py + ts - 5, ts + 5, 5); } }
  } else if (c === 'C') {
    if (T.C && T.C !== 'coffin' && SPR.T[T.C]) spr(T.C, px - ts * 0.1, py - ts * 0.3, ts * 1.2, T.CPal || null);
    else if (T.C === 'coffin') { g.fillStyle = '#2a1a10'; g.fillRect(px + ts * 0.18, py + ts * 0.05, ts * 0.64, ts * 0.9); g.fillStyle = '#4a2e1a'; g.fillRect(px + ts * 0.24, py + ts * 0.1, ts * 0.52, ts * 0.8); g.fillStyle = '#c8a050'; g.fillRect(px + ts * 0.46, py + ts * 0.2, 3, ts * 0.25); }
    else { g.fillStyle = '#3a2418'; g.beginPath(); g.ellipse(px + ts / 2, py + ts * 0.58, ts * 0.32, ts * 0.36, 0, 0, 7); g.fill(); g.fillStyle = '#7a2a1a'; g.fillRect(px + ts * 0.32, py + ts * 0.12, ts * 0.36, ts * 0.16); }
  } else if (c === 'K') {
    g.fillStyle = '#3a2416'; g.fillRect(px + 1, py + ts * 0.15, ts - 2, ts * 0.8); g.fillStyle = '#5a3a22'; g.fillRect(px + 3, py + ts * 0.2, ts - 6, ts * 0.12);
    g.fillStyle = '#8a6a3a'; for (let i = 0; i < 4; i++) g.fillRect(px + 5 + i * (ts - 10) / 4, py + ts * 0.42, 3, ts * 0.32);
  } else if (c === 'X') {
    if (K === 'room' || K === 'dungeon') { g.fillStyle = K === 'room' ? '#6a1a14' : '#3a3644'; g.fillRect(px + ts * 0.22, py - ts * 0.3, ts * 0.56, ts * 1.25); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(px + ts * 0.26, py - ts * 0.3, 3, ts * 1.25); g.fillStyle = '#1a1010'; g.fillRect(px + ts * 0.16, py + ts * 0.85, ts * 0.68, ts * 0.12); }
    else if (K === 'town') { g.fillStyle = '#5a3a20'; g.fillRect(px + ts * 0.15, py + ts * 0.25, ts * 0.7, ts * 0.6); g.strokeStyle = '#2a1a0e'; g.lineWidth = 2; g.strokeRect(px + ts * 0.15, py + ts * 0.25, ts * 0.7, ts * 0.6); g.beginPath(); g.moveTo(px + ts * 0.15, py + ts * 0.25); g.lineTo(px + ts * 0.85, py + ts * 0.85); g.stroke(); }
    else spr('rock', px - ts * 0.05, py - ts * 0.15, ts * 1.1, { G: '#3a3230', H: '#5a4e48' });
  } else if (c === '#') { const D = T.d[Math.floor(hash2(x, y, 3) * T.d.length)]; spr(D[0], px - ts * 0.15, py - ts * 0.4, ts * 1.3, D[1]); }
  else if (c === 'o') spr('mound', px - ts * 0.05, py - ts * 0.2, ts * 1.1);
  else if (c === 'T') spr(K === 'town' ? 'pine' : (T.tree || 'deadtree'), px - ts * 0.15, py - ts * 0.45, ts * 1.3, K === 'town' ? { G: '#3a5a34' } : (T.treePal || null));
}
// 特殊地形：岩浆、毒沼、冰面、网桥、深渊、蛛网
function wTerrDraw(g, T, S, m, c, x, y, px, py, ts, h, t) {
  if (c === '&') { wFloor(g, T, ',', x, y, px, py, ts, h); g.globalAlpha = 0.82; spr(T.tree || 'pine', px - ts * 0.1, py - ts * 0.35, ts * 1.2, { G: '#3a5a2a' }); g.globalAlpha = 1; return; }   // 看着像树，其实能钻过去
  if (c === ':') { g.fillStyle = '#030204'; g.fillRect(px, py, ts + 1, ts + 1); if (wTile(m, x, y - 1) !== ':') { g.fillStyle = 'rgba(120,100,90,.25)'; g.fillRect(px, py, ts + 1, 3); } return; }
  if (c === '~') {
    g.fillStyle = '#030204'; g.fillRect(px, py, ts + 1, ts + 1);
    if (wBridgeDown(S, S.sc, x, y)) { g.strokeStyle = 'rgba(220,220,220,.25)'; g.beginPath(); g.moveTo(px + 3, py + 4); g.lineTo(px + ts * 0.4, py + ts * 0.7); g.stroke(); return; }
    g.strokeStyle = 'rgba(235,235,240,.75)'; g.lineWidth = 1.5; g.beginPath();
    for (let i = 0; i <= 4; i++) { g.moveTo(px, py + i * ts / 4); g.lineTo(px + ts, py + i * ts / 4); g.moveTo(px + i * ts / 4, py); g.lineTo(px + i * ts / 4, py + ts); } g.stroke(); return;
  }
  if (c === '%') {
    wFloor(g, T, '.', x, y, px, py, ts, h);
    if (S.got[wgk(S.sc, x, y)]) { g.fillStyle = 'rgba(20,10,8,.55)'; g.beginPath(); g.ellipse(px + ts / 2, py + ts / 2, ts * 0.4, ts * 0.3, 0, 0, 7); g.fill(); return; }
    g.strokeStyle = 'rgba(240,240,250,.8)'; g.lineWidth = 1; g.beginPath(); const cx = px + ts / 2, cy = py + ts / 2;
    for (let a = 0; a < 8; a++) { g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a * 0.785) * ts * 0.6, cy + Math.sin(a * 0.785) * ts * 0.6); }
    for (let r = 1; r <= 3; r++) { g.moveTo(cx + r * ts / 7, cy); for (let a = 1; a <= 8; a++) g.lineTo(cx + Math.cos(a * 0.785) * r * ts / 7, cy + Math.sin(a * 0.785) * r * ts / 7); }
    g.stroke(); return;
  }
  if (c === '*') {
    const hot = wLavaHot() && !wHasKey(wch(), wTerr(wch()).lava), fl = 0.5 + 0.5 * Math.sin(t / 260 + x * 1.7 + y);
    g.fillStyle = hot ? `rgb(${200 + 50 * fl},${70 + 50 * fl},20)` : '#3a1a12'; g.fillRect(px, py, ts + 1, ts + 1);
    g.fillStyle = hot ? 'rgba(255,230,120,.6)' : 'rgba(255,110,40,.35)'; g.fillRect(px + h * ts * 0.6, py + hash2(x, y, 5) * ts * 0.7, ts * 0.3, 3); return;
  }
  if (c === '"') {
    g.fillStyle = shade('#2a3a1a', h * 10); g.fillRect(px, py, ts + 1, ts + 1);
    const b = (t / 900 + h * 3) % 1; g.fillStyle = `rgba(150,220,80,${0.5 * (1 - b)})`; g.beginPath(); g.arc(px + h * ts * 0.7 + 4, py + ts * (0.8 - b * 0.4), 2 + b * 3, 0, 7); g.fill(); return;
  }
  if (c === '(' || c === ')') {   // 阴阳两面的路：这一面有，另一面是空的
    const on = c === '(' ? !S.flags.yin : !!S.flags.yin;
    if (on) { wFloor(g, T, '=', x, y, px, py, ts, h); if (c === ')') { g.fillStyle = `rgba(170,140,255,${0.18 + 0.08 * Math.sin(t / 500 + x)})`; g.fillRect(px, py, ts + 1, ts + 1); } return; }
    g.fillStyle = '#05040a'; g.fillRect(px, py, ts + 1, ts + 1);
    g.fillStyle = c === ')' ? 'rgba(150,120,230,.16)' : 'rgba(230,200,140,.12)'; g.fillRect(px + ts * 0.15, py + ts * (0.3 + 0.2 * Math.sin(t / 900 + y)), ts * 0.7, 2);
    return;
  }
  if (c === '_') {
    g.fillStyle = shade('#9ec8e0', h * 12 - 6); g.fillRect(px, py, ts + 1, ts + 1);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(px + h * ts * 0.5, py + ts * 0.3, ts * 0.4, 2); g.fillRect(px + ts * 0.2, py + ts * 0.7, ts * 0.25, 1); return;
  }
}
let spr = () => {};
function wDraw(cv, dpr, ts, t) {
  const g = cv.getContext('2d'), ch = wch(), m = wmap(ch), S = wstate(ch), T = wTheme(), K = T.kind;
  const Wp = cv.width / dpr, Hp = cv.height / dpr;
  // 匀速滑到下一格（不再一格一跳）
  if (WHERO.mv) { const k = Math.min(1, (t - WHERO.mv.t0) / WHERO.mv.d); WHERO.x = WHERO.mv.fx + (S.pos.x - WHERO.mv.fx) * k; WHERO.y = WHERO.mv.fy + (S.pos.y - WHERO.mv.fy) * k; WHERO.dist = (WHERO.mv.dist0 || 0) + k; if (k >= 1 && !WALK) WHERO.mv = null;
    else if (k >= 1 && WALK && WALK.h && !DLG && !MODALFN) { clearTimeout(WALK.h); WALK.h = 0; wStepLoop(); } }   // 这一格走完的那一帧就接着走下一格（原来等计时器，格与格之间会顿一下）
  else { WHERO.x = S.pos.x; WHERO.y = S.pos.y; }
  WF = WDRAWT ? Math.min(4, Math.max(0.25, (t - WDRAWT) / 16.67)) : 1; WDRAWT = t;   // 跟帧率无关：慢帧时一步走得多一点
  { const k = 1 - Math.pow(0.8, WF); WCAM.x += (WHERO.x - WCAM.x) * k; WCAM.y += (WHERO.y - WCAM.y) * k; }
  WMOVING = !!WHERO.mv || Math.abs(WHERO.x - WCAM.x) + Math.abs(WHERO.y - WCAM.y) > 0.02 || !!(WTAP && t - WTAP.t < 450);
  // 小场景居中，不跟镜头
  const cxm = m.W * ts <= Wp ? (m.W - 1) / 2 : Math.max((Wp / ts - 1) / 2, Math.min(m.W - (Wp / ts + 1) / 2, WCAM.x));
  const cym = m.H * ts <= Hp ? (m.H - 1) / 2 : Math.max((Hp / ts - 1) / 2, Math.min(m.H - (Hp / ts + 1) / 2, WCAM.y));
  const ox = Math.round(Wp / 2 - (cxm + 0.5) * ts), oy = Math.round(Hp / 2 - (cym + 0.5) * ts);
  WCAM.ox = ox; WCAM.oy = oy;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#050406'; g.fillRect(0, 0, Wp, Hp);
  const x0 = Math.max(0, Math.floor(-ox / ts) - 1), x1 = Math.min(m.W - 1, Math.ceil((Wp - ox) / ts) + 1);
  const y0 = Math.max(0, Math.floor(-oy / ts) - 1), y1 = Math.min(m.H - 1, Math.ceil((Hp - oy) / ts) + 1);
  spr = (name, px, py, size, pal) => { const c = SPR.cv(name, pal); if (c) g.drawImage(c, px, py, size, size); };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!wSeen(ch, x, y)) continue;
    const c = wTile(m, x, y), px = ox + x * ts, py = oy + y * ts, h = hash2(x, y, 1);
    if (c === '^' || c === 'H') continue;
    if ('*"_~:%&()'.includes(c)) { wTerrDraw(g, T, S, m, c, x, y, px, py, ts, h, t); continue; }
    const isBar = (c === 'R' || c === 'Q') && !m.def.pts[c];
    wFloor(g, T, W_BLOCK.includes(c) || isBar ? '.' : c, x, y, px, py, ts, h);
    if (isBar) {
      const up2 = !S.flags.barsJammed && (c === 'R' ? !S.flags.bar : !!S.flags.bar), col = c === 'R' ? '#c4291f' : '#2ab8a8';
      if (up2) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(px, py + ts * 0.8, ts, ts * 0.2); g.fillStyle = col; for (let i = 0; i < 4; i++) g.fillRect(px + 3 + i * (ts - 6) / 3.3, py - ts * 0.15, 4, ts * 1.05); g.fillRect(px, py + ts * 0.1, ts, 3); }
      else { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(px + 2, py + ts * 0.45, ts - 4, 3); g.fillStyle = col; g.globalAlpha = 0.5; g.fillRect(px + 2, py + ts * 0.42, ts - 4, 2); g.globalAlpha = 1; }
    }
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!wSeen(ch, x, y)) continue;
    const c = wTile(m, x, y); if (!W_BLOCK.includes(c)) continue;
    { const Pd = m.def.pts[c]; if (Pd && (Pd.t === 'chest' || Pd.t === 'npc')) continue; }   // 代号恰好是 K/T/C 的箱子和人：不画成书架、树
    wSolid(g, T, m, c, x, y, ox + x * ts, oy + y * ts, ts, spr);
  }
  // 地点
  const pulse = 0.5 + 0.5 * Math.sin(t / 300);
  const tr = wTracker(ch), mk = new Set();
  for (const q of tr) { const p = wMarkPos(ch, q); if (p && !p.area && p.sc === S.sc) mk.add(wkey(p.x, p.y)); }
  g.textAlign = 'center';
  for (const code in m.pts) for (const p of m.pts[code]) {
    if (!wSeen(ch, p.x, p.y) || !wPtVisible(ch, p.x, p.y)) continue;
    const P = m.def.pts[code], px = ox + p.x * ts, py = oy + p.y * ts;
    if (P.t === 'npc' || P.t === 'elite' || P.t === 'walker' || P.t === 'qspot') continue;
    if (P.t === 'deco') { spr(P.spr, px - ts * 0.1, py - ts * 0.3 + Math.sin(t / 400) * 1.5, ts * 1.2, P.pal); continue; }
    if (P.t === 'box') continue;
    if (P.t === 'xintu') { const st = S.got[wgk(S.sc, p.x, p.y)];
      if (st === 1) { g.save(); g.globalAlpha = 0.75; g.translate(px + ts / 2, py + ts * 0.7); g.rotate(-1.45); spr('villager', -ts * 0.5, -ts * 0.55, ts, P.pal || { B: '#d8d0c0' }); g.restore();
        g.font = `bold ${Math.round(ts * 0.3)}px serif`; g.fillStyle = '#c8d0ff'; g.fillText('z', px + ts * 0.8, py + ts * 0.1 - pulse * 3); continue; }
      const sw = Math.sin(t / 700 + p.x) * 1.5; spr('villager', px - ts * 0.1 + sw, py - ts * 0.35, ts * 1.2, P.pal || { B: '#d8d0c0' });
      g.font = `bold ${Math.round(ts * 0.24)}px "Noto Serif SC",serif`; g.fillStyle = '#d0c8f0'; g.fillText(P.n || "Tín đồ", px + ts / 2, py + ts * 1.08); continue; }
    if (P.t === 'boxgoal') { const on = wBoxes(ch).some(b => b.x === p.x && b.y === p.y) || S.flags[P.flag]; g.fillStyle = on ? 'rgba(140,230,255,.55)' : `rgba(140,220,255,${0.18 + 0.12 * pulse})`; g.beginPath(); g.ellipse(px + ts / 2, py + ts / 2, ts * 0.42, ts * 0.32, 0, 0, 7); g.fill(); g.strokeStyle = '#bff0ff'; g.lineWidth = 2; g.stroke(); continue; }
    if (P.t === 'boxreset') { spr('crystal', px - ts * 0.05, py - ts * 0.3, ts * 1.1, { C: '#7ad0ff', W: '#e8f8ff' }); continue; }
    if (P.t === 'prop') { const k = P.big || 1.2; spr(P.spr, px + ts / 2 - ts * k / 2, py + ts - ts * k - ts * 0.05, ts * k, P.pal); continue; }   // 场景里的实物（不动）
    if (P.t === 'watch') {
      g.fillStyle = `rgba(255,220,90,${0.13 + 0.08 * pulse})`;
      for (const [cx, cy] of wWatchCells(ch, p, P)) if (wSeen(ch, cx, cy)) g.fillRect(ox + cx * ts, oy + cy * ts, ts, ts);
      const Sp = SPEAKERS[P.npc] || { spr: 'taoist' }; spr(Sp.spr, px - ts * 0.1, py - ts * 0.35, ts * 1.2, Sp.pal);
      g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; g.fillStyle = '#ffd25a'; g.fillText(P.n || "Tuần đêm", px + ts / 2, py + ts * 1.08); continue;
    }
    if (P.t === 'camp') { g.fillStyle = `rgba(255,140,40,${0.15 + 0.1 * pulse})`; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * 0.9, 0, 7); g.fill(); spr('fire', px, py - ts * 0.15 - (t / 120 % 2), ts); }
    else if (P.t === 'chest') spr('chest', px + 2, py, ts - 4);
    else if (P.t === 'event') spr('fu', px + 4, py + 2 - pulse * 3, ts - 8);
    else if (P.t === 'herb') spr('herb', px, py, ts);
    else if (P.t === 'qitem' || P.t === 'clue' || P.t === 'relic') { g.fillStyle = `rgba(255,230,150,${0.12 + 0.12 * pulse})`; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * 0.45, 0, 7); g.fill(); spr(P.spr || 'scroll', px + 6, py + 4 - pulse * 3, ts - 12); }
    else if (P.t === 'gate') { g.fillStyle = '#3a3230'; g.fillRect(px, py, ts, ts); g.fillStyle = '#c8b070'; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * 0.22, 0, 7); g.fill(); g.fillStyle = '#e8f0ff'; g.globalAlpha = 0.4 + 0.3 * pulse; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * 0.15, 0, 7); g.fill(); g.globalAlpha = 1; }
    else if (P.t === 'stele') spr('tomb', px - ts * 0.15, py - ts * 0.5, ts * 1.4, { G: '#6a665e', H: '#8a867c' });
    else if (P.t === 'mini') { const k = P.big || 1.2; spr(P.spr || 'chest', px + ts / 2 - ts * k / 2, py + ts - ts * k - ts * 0.05, ts * k, P.pal); if (P.n) { g.font = `bold ${Math.round(ts * 0.24)}px "Noto Serif SC",serif`; g.fillStyle = '#bfe6ff'; g.textAlign = 'center'; g.fillText(P.n, px + ts / 2, py + ts * 1.12); } }
    else if (P.t === 'sign' && P.spr) { const k = P.big || 1.3; spr(P.spr, px + ts / 2 - ts * k / 2, py + ts - ts * k - ts * 0.05, ts * k, P.pal); }   // 能看的实物（铜镜、壁画）
    else if (P.t === 'board') { g.fillStyle = '#5a3a20'; g.fillRect(px + ts * 0.2, py + ts * 0.4, 3, ts * 0.6); g.fillRect(px + ts * 0.74, py + ts * 0.4, 3, ts * 0.6); g.fillStyle = '#8a6a3a'; g.fillRect(px + ts * 0.06, py + ts * 0.02, ts * 0.88, ts * 0.5); g.fillStyle = '#e8dcc0'; g.fillRect(px + ts * 0.14, py + ts * 0.08, ts * 0.3, ts * 0.36); g.fillRect(px + ts * 0.52, py + ts * 0.08, ts * 0.32, ts * 0.36); g.fillStyle = '#c4291f'; g.beginPath(); g.arc(px + ts * 0.68, py + ts * 0.32, ts * 0.08, 0, 7); g.fill(); g.font = `bold ${Math.round(ts * 0.22)}px "Noto Serif SC",serif`; g.fillStyle = '#ffd75a'; g.textAlign = 'center'; g.fillText("Truy nã", px + ts / 2, py + ts * 1.12); }
    else if (P.t === 'sign') { g.fillStyle = '#5a3a20'; g.fillRect(px + ts * 0.46, py + ts * 0.4, 4, ts * 0.6); g.fillStyle = '#8a6a3a'; g.fillRect(px + ts * 0.1, py + ts * 0.05, ts * 0.8, ts * 0.45); g.fillStyle = '#e8dcc0'; for (let i = 0; i < 3; i++) g.fillRect(px + ts * 0.18 + i * ts * 0.22, py + ts * 0.12, ts * 0.16, ts * 0.3); }
    else if (P.t === 'lamp') {
      const lit = S.got[wgk(S.sc, p.x, p.y)] || S.flags[(m.def.pz[P.grp] || {}).flag], col = P.col || WX[P.wx].c;
      g.fillStyle = '#2a2420'; g.fillRect(px + ts * 0.42, py + ts * 0.35, ts * 0.16, ts * 0.65); g.fillStyle = '#4a4038'; g.fillRect(px + ts * 0.22, py + ts * 0.25, ts * 0.56, ts * 0.14);
      if (lit) { g.fillStyle = col; g.globalAlpha = 0.25 + 0.15 * pulse; g.beginPath(); g.arc(px + ts / 2, py + ts * 0.12, ts * 0.6, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(px + ts / 2, py + ts * 0.1, ts * 0.1, ts * 0.17, 0, 0, 7); g.fill(); }
      g.font = `400 ${Math.round(ts * 0.42)}px "Ma Shan Zheng",serif`; g.fillStyle = lit ? col : shade(col, -70); g.fillText(P.lab || WX[P.wx].n, px + ts / 2, py + ts * 0.25);
    }
    else if (P.t === 'plate') { g.fillStyle = '#3a3640'; g.fillRect(px + 4, py + 4, ts - 8, ts - 8); g.strokeStyle = S.flags.bar ? '#2ab8a8' : '#c4291f'; g.lineWidth = 2; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * 0.25, 0, 7); g.stroke(); g.beginPath(); g.moveTo(px + ts / 2, py + ts * 0.25); g.lineTo(px + ts / 2, py + ts * 0.75); g.stroke(); }
    else if (P.t === 'door') {
      const open = wDoorOpen(ch, P), wallDoor = wTile(m, p.x, p.y - 1) === 'H' || wTile(m, p.x - 1, p.y) === '^' || wTile(m, p.x + 1, p.y) === '^' || wTile(m, p.x, p.y - 1) === '^';
      if (wallDoor) { g.fillStyle = '#120a08'; g.fillRect(px + ts * 0.12, py + ts * 0.05, ts * 0.76, ts * 0.95); g.fillStyle = open ? `rgba(255,170,80,${0.2 + 0.15 * pulse})` : 'rgba(80,80,90,.3)'; g.fillRect(px + ts * 0.18, py + ts * 0.12, ts * 0.64, ts * 0.85); }
      else { g.fillStyle = `rgba(255,215,140,${0.18 + 0.15 * pulse})`; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * 0.5, 0, 7); g.fill(); }
      if (!open) spr('lock', px + ts * 0.25, py + ts * 0.25, ts * 0.5);
    }
    else if (P.t === 'rexit') { g.fillStyle = `rgba(150,110,255,${0.22 + 0.18 * pulse})`; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * (0.62 + 0.08 * pulse), 0, 7); g.fill(); spr('portal', px - ts * 0.1, py - ts * 0.25, ts * 1.2);
      g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; g.fillStyle = '#d8c8ff'; g.fillText("Tầng kế", px + ts / 2, py + ts * 1.18); }
    else if (P.t === 'rpylon') { const used = S.got[wgk(S.sc, p.x, p.y)], col = { power: '#ff7a4a', guard: '#7ac8ff', haste: '#9be870', gather: '#d28cff' }[P.py] || '#fff';
      if (!used) { g.fillStyle = col; g.globalAlpha = 0.18 + 0.14 * pulse; g.beginPath(); g.arc(px + ts / 2, py + ts * 0.45, ts * 0.75, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.fillStyle = '#2a2622'; g.fillRect(px + ts * 0.3, py + ts * 0.82, ts * 0.4, ts * 0.14); g.fillStyle = used ? '#4a4640' : '#6a665e'; g.fillRect(px + ts * 0.38, py + ts * 0.05, ts * 0.24, ts * 0.8);
      g.fillStyle = used ? '#55504a' : col; g.beginPath(); g.arc(px + ts / 2, py + ts * 0.05, ts * (used ? 0.13 : 0.17 + 0.03 * pulse), 0, 7); g.fill();
      g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; g.fillStyle = used ? '#8a8478' : col; g.fillText(R_PYLONS[P.py].n + (used ? " (đã dùng)" : ''), px + ts / 2, py + ts * 1.18); }
    else if (P.t === 'rin') { g.strokeStyle = 'rgba(232,199,125,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * 0.4, 0, 7); g.stroke(); }
    else if (P.t === 'boss') { const C = CHAPTERS[ch - 1]; spr(C.boss.spr, px - ts * 0.35, py - ts * 0.8, ts * 1.7, C.boss.pal); }
    else if (P.t === 'grave') { g.fillStyle = '#0e0a08'; g.fillRect(px + ts * 0.2, py + ts * 0.3, ts * 0.6, ts * 0.5); }
    if (mk.has(wkey(p.x, p.y))) { g.strokeStyle = `rgba(255,215,90,${0.4 + 0.5 * pulse})`; g.lineWidth = 2; g.beginPath(); g.arc(px + ts / 2, py + ts / 2, ts * (0.5 + 0.1 * pulse), 0, 7); g.stroke(); }
  }
  for (const b of (W_AUTOSOLVE ? [] : wBoxes(ch))) if (wSeen(ch, b.x, b.y)) spr(m.def.boxSpr || 'iceblock', ox + b.x * ts - ts * 0.05, oy + b.y * ts - ts * 0.15, ts * 1.1);   // 冰块
  // 门的名字、屋子的招牌
  g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`;
  for (const code in m.pts) { const P = m.def.pts[code]; if (P.t !== 'door') continue; const p = m.pts[code][0]; if (!wSeen(ch, p.x, p.y)) continue;
    const lx = ox + (p.x + 0.5) * ts, ly = oy + p.y * ts + (p.y === 0 ? ts * 1.3 : p.y === m.H - 1 ? -ts * 0.15 : -ts * 0.15);
    const txt = (p.x === 0 ? '← ' : p.x === m.W - 1 ? '' : '') + P.n + (p.x === m.W - 1 ? ' →' : '');
    const w = g.measureText(txt).width + 10; g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(lx - w / 2, ly - ts * 0.26, w, ts * 0.34); g.fillStyle = '#ffd79a'; g.fillText(txt, lx, ly);
  }
  g.font = `400 ${Math.round(ts * 0.42)}px "Ma Shan Zheng",serif`;
  for (const [lx, ly, txt] of m.def.labels || []) { if (!wSeen(ch, lx, ly)) continue; const X = ox + (lx + 0.5) * ts, Y = oy + (ly + 0.62) * ts, w = g.measureText(txt).width + 14;
    g.fillStyle = '#1a0e08'; g.fillRect(X - w / 2, Y - ts * 0.42, w, ts * 0.55); g.strokeStyle = '#c8a050'; g.lineWidth = 1.5; g.strokeRect(X - w / 2, Y - ts * 0.42, w, ts * 0.55); g.fillStyle = '#ffd79a'; g.fillText(txt, X, Y); }
  // 人
  g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`;
  for (const n of wNpcs(ch)) {
    if (!wSeen(ch, n.x, n.y)) continue;
    const Sp = SPEAKERS[n.id] || {}, px = ox + n.x * ts, py = oy + n.y * ts, bob = Math.sin(t / 500 + n.x) * 1.2;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(px + ts / 2, py + ts * 0.88, ts * 0.3, ts * 0.1, 0, 0, 7); g.fill();
    const lk = typeof HERO !== 'undefined' && HERO.lookOf(Sp.spr);
    if (lk) { const c2 = HERO.cv(lk, Math.floor((t + n.x * 397) / 600) % 2 ? 'idle2' : 'idle', HERO.mapPal(lk, Sp.pal)), u = ts * 1.12 / 30, fx = px + ts / 2, fy = py + ts * 0.9;
      g.save(); g.translate(fx, fy); if (WHERO && WHERO.x + 0.5 < n.x + 0.5 - 0.2) g.scale(-1, 1); g.drawImage(c2, -28 * u, -44 * u, HERO.W * u, HERO.H * u); g.restore(); }
    else spr(Sp.spr, px - ts * 0.1, py - ts * 0.35 + bob, ts * 1.2, Sp.pal);
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(px - ts * 0.2, py + ts * 0.86, ts * 1.4, ts * 0.3);
    g.fillStyle = n.id === 'ngoc' ? '#ffb3c8' : '#e8c77d'; g.fillText(Sp.n || '', px + ts / 2, py + ts * 1.08);
    const mkk = wNpcMark(ch, n.id);
    if (mkk) { g.font = `900 ${Math.round(ts * 0.55)}px "Noto Serif SC",serif`; g.fillStyle = mkk === 'main' ? '#ffd75a' : mkk === 'turn' ? '#8fe89a' : '#ffffff';
      g.fillText(mkk === 'turn' ? '?' : '!', px + ts / 2, py - ts * 0.35 - pulse * 4); g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; }
  }
  // 妖物
  const bell = wkeys().zhaohun, D = wScene(ch);
  for (const o of D.orbs || []) { const px = ox + o.x * ts, py = oy + o.y * ts, bob = Math.sin(t / 260 + o.x) * 3;   // 精魄球
    g.fillStyle = `rgba(190,140,255,${0.25 + 0.2 * pulse})`; g.beginPath(); g.arc(px + ts / 2, py + ts * 0.5 + bob, ts * 0.36, 0, 7); g.fill();
    g.fillStyle = '#e8d8ff'; g.beginPath(); g.arc(px + ts / 2, py + ts * 0.5 + bob, ts * 0.15, 0, 7); g.fill(); }
  for (const mn of D.mons) {
    const d2 = (mn.x - S.pos.x) ** 2 + (mn.y - S.pos.y) ** 2;
    if (!(wInSight(ch, mn.x, mn.y) || (bell && d2 <= W_BELL * W_BELL) || (mn.tag === 'walker' && bell))) continue;
    const P0 = WMONP[mn.id] || (WMONP[mn.id] = { x: mn.x, y: mn.y });
    { const k = 1 - Math.pow(0.82, WF); P0.x += (mn.x - P0.x) * k; P0.y += (mn.y - P0.y) * k; if (Math.abs(mn.x - P0.x) + Math.abs(mn.y - P0.y) > 0.02) WMOVING = true; }
    const C0 = CHAPTERS[(mn.c || ch) - 1] || CHAPTERS[0], def = mn.boss ? (mn.z === 'rb' && shOn(SAVE.run) ? SH_BEASTS[SAVE.run.rw.sh] : C0.boss) : (C0.mons[mn.m] || {}), px = ox + P0.x * ts, py = oy + P0.y * ts;
    const size = mn.boss ? ts * 1.7 : mn.big ? ts * 1.35 : mn.rare ? ts * 1.3 : mn.elite ? ts * 1.15 : ts * 0.95, bob = mn.beh === 'sleep' ? 0 : Math.sin(t / 220 + mn.x) * 2;
    if (mn.elite || mn.boss) { g.fillStyle = mn.boss ? `rgba(255,50,40,${0.3 + 0.15 * pulse})` : mn.rare ? 'rgba(190,120,255,.35)' : 'rgba(255,120,40,.25)'; g.beginPath(); g.ellipse(px + ts / 2, py + ts * 0.85, ts * (mn.boss ? 0.8 : 0.5), ts * (mn.boss ? 0.28 : 0.18), 0, 0, 7); g.fill(); }
    g.globalAlpha = wInSight(ch, mn.x, mn.y) ? 1 : 0.55;
    spr(def.spr || 'skeleton', px + (ts - size) / 2, py + ts - size - 2 + bob, size, mn.pal || def.pal);
    g.globalAlpha = 1;
    if (mn.beh === 'sleep') { g.fillStyle = '#9ab'; g.font = `bold ${Math.round(ts * 0.3)}px sans-serif`; g.fillText('z', px + ts * 0.85, py + ts * 0.1 - (t / 400 % 1) * 6); g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; }
    if (mn.beh === 'chase' && d2 <= 25 && wInSight(ch, mn.x, mn.y)) { g.fillStyle = '#ff5a3a'; g.font = `900 ${Math.round(ts * 0.4)}px sans-serif`; g.fillText('!', px + ts / 2, py - ts * 0.1); g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; }
    const etag = mn.elite && !mn.boss ? eliteTagTxt(mn, def) : '';   // 精英：词缀、特性在地图上就写出来
    if (mn.z === 'r' && mn.elite) { g.fillStyle = mn.rare ? '#d8a8ff' : '#ffb066'; g.fillText(mn.rare ? "Tinh anh hiếm" : "Tinh anh", px + ts / 2, py + ts * 1.15); }
    if (etag) { g.font = `bold ${Math.round(ts * 0.22)}px "Noto Serif SC",serif`; g.fillStyle = '#ffd27a'; g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 3; g.strokeText(etag, px + ts / 2, py + ts * 1.42); g.fillText(etag, px + ts / 2, py + ts * 1.42); g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; }
    if (mn.boss) { g.fillStyle = '#ff6a5a'; g.fillText("Yêu vương giữ ải · " + def.n, px + ts / 2, py + ts * 1.2); }
    if (mn.name && (mn.elite || mn.tag)) { const dl = mn.lv - SAVE.chars[SAVE.run.cls].level;
      g.fillStyle = dl >= 3 ? '#ff4a3a' : dl >= 1 ? '#ffb066' : '#d8d0b0'; g.fillText(`${mn.name}${mn.elite ? ` Lv${mn.lv}` : ''}`, px + ts / 2, py + ts * 1.15); }
  }
  // 路径预览
  if (WALK && WALK.path) { g.fillStyle = 'rgba(255,215,140,.45)'; for (const p of WALK.path.slice(WALK.i)) { g.beginPath(); g.arc(ox + (p.x + 0.5) * ts, oy + (p.y + 0.5) * ts, 3, 0, 7); g.fill(); } }
  if (MAPGOAL && MAPGOAL.sc === S.sc) { g.strokeStyle = `rgba(255,215,140,${(0.6 + 0.3 * Math.sin(t / 220)).toFixed(2)})`; g.lineWidth = 2; g.beginPath(); g.arc(ox + (MAPGOAL.x + 0.5) * ts, oy + (MAPGOAL.y + 0.5) * ts, ts * 0.38, 0, 7); g.stroke(); }
  if (WTAP && t - WTAP.t < 400) { g.strokeStyle = `rgba(255,215,140,${1 - (t - WTAP.t) / 400})`; g.lineWidth = 2; g.beginPath(); g.arc(ox + (WTAP.x + 0.5) * ts, oy + (WTAP.y + 0.5) * ts, ts * 0.45, 0, 7); g.stroke(); } else if (WTAP && !WTAP.t) WTAP.t = t;
  // 跟在身后的人
  const fol = [S.flags.ngocFollow ? ['ngoc'] : null, S.flags.zhenFollow ? ['constable'] : null, S.flags.escort ? [(SPEAKERS[S.flags.escort] || {}).spr || 'villager', (SPEAKERS[S.flags.escort] || {}).pal] : null].filter(Boolean);
  fol.forEach((f, i) => { const tp = WTRAIL[i + 1] || WTRAIL[WTRAIL.length - 1] || { x: S.pos.x - 0.6 * (i + 1), y: S.pos.y + 0.1 };
    f.p = f.p || { x: tp.x, y: tp.y }; const k2 = 'f' + i; const Pq = WMONP[k2] || (WMONP[k2] = { x: tp.x, y: tp.y, d: 0 });
    const kf = 1 - Math.pow(0.84, WF), dx = (tp.x - Pq.x) * kf, dy = (tp.y - Pq.y) * kf, mv = Math.hypot(dx, dy); Pq.x += dx; Pq.y += dy; Pq.d = (Pq.d || 0) + mv; if (mv > 0.004) WMOVING = true;
    if (Math.abs(dx) > 0.01) Pq.flip = dx < 0;
    const flk = typeof HERO !== 'undefined' && HERO.lookOf(f[0]);
    if (flk) { const c2 = HERO.cv(flk, mv > 0.004 ? 'w' + (Math.floor(Pq.d * 2.5) % 4) : Math.floor((t + i * 300) / 600) % 2 ? 'idle2' : 'idle', HERO.mapPal(flk, f[1])), u = ts * 1.0 / 30, fx = ox + (Pq.x + 0.5) * ts, fy = oy + (Pq.y + 0.85) * ts;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(fx, fy, ts * 0.26, ts * 0.09, 0, 0, 7); g.fill();
      g.save(); g.translate(fx, fy); if (Pq.flip) g.scale(-1, 1); g.drawImage(c2, -28 * u, -44 * u, HERO.W * u, HERO.H * u); g.restore(); return; }
    const fc = SPR.walkCv(f[0], f[1], mv > 0.004 ? [1, 0, 3, 0][Math.floor(Pq.d * 2.5) % 4] : 0);
    if (fc) { const sz = ts * 0.95, px2 = ox + Pq.x * ts, py2 = oy + Pq.y * ts - ts * 0.3; g.save(); if (Pq.flip) { g.translate(px2 + sz, py2); g.scale(-1, 1); } else g.translate(px2, py2); g.drawImage(fc, 0, 0, sz, sz * fc.height / fc.width); g.restore(); } });
  // 主角
  const walking = !!(WALK || WHERO.mv), ph = (WHERO.dist || 0) * Math.PI, hb = walking ? Math.abs(Math.sin(ph)) * 2 : Math.sin(t / 400) * 1, lean = walking ? Math.sin(ph) * 0.04 : 0;
  const wf = walking ? [1, 0, 3, 0][Math.floor((WHERO.dist || 0) * 2.5) % 4] : 0;   // 迈步：左、并、右、并
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); { const mtOn = SAVE.mount && (SAVE.mounts || {})[SAVE.mount] && MOUNTS[SAVE.mount]; g.ellipse(ox + (WHERO.x + 0.5) * ts, oy + (WHERO.y + 0.9) * ts, ts * (mtOn ? 0.6 : 0.32), ts * (mtOn ? 0.16 : 0.12), 0, 0, 7); } g.fill();
  const HS = m.def.heroSpr, hsN = HS ? HS[0] : CLASSES[SAVE.run.cls].spr, hsP = HS ? HS[1] : CLASSES[SAVE.run.cls].pal;   // 梦里是十五岁的阿土
  const rigC = !HS && typeof HERO !== 'undefined' && HERO.has(SAVE.run.cls) ? SAVE.run.cls : null, wi = Math.floor((WHERO.dist || 0) * 2.5) % 4;
  const MT = rigC && SAVE.mount && (SAVE.mounts || {})[SAVE.mount] && MOUNTS[SAVE.mount] && SPR.T[MOUNTS[SAVE.mount].spr] ? MOUNTS[SAVE.mount] : null;   // 山海坐骑：只在地图上走路时骑着，不加属性
  const hc = MT ? HERO.cv(rigC, 'ride') : rigC ? HERO.cv(rigC, WHERO.back && walking ? 'b' + wi : WHERO.back ? 'b0' : walking ? 'w' + wi : Math.floor(t / 560) % 2 ? 'idle2' : 'idle') : WHERO.back ? SPR.backCv(hsN, hsP, wf) : SPR.walkCv(hsN, hsP, wf);
  // 走路扬尘
  if (walking && wf !== WHERO.lastWf) { WHERO.lastWf = wf; if (wf) (WHERO.dust || (WHERO.dust = [])).push({ x: WHERO.x + 0.5 + (Math.random() - 0.5) * 0.2, y: WHERO.y + 0.88, t }); }
  if (WHERO.dust) { WHERO.dust = WHERO.dust.filter(d => t - d.t < 520); for (const d of WHERO.dust) { const k = (t - d.t) / 520; g.fillStyle = `rgba(190,170,140,${(0.45 * (1 - k)).toFixed(3)})`; const r = ts * (0.06 + k * 0.14); g.beginPath(); g.ellipse(ox + d.x * ts, oy + d.y * ts - k * ts * 0.12, r * 1.4, r, 0, 0, 7); g.fill(); } }
  if (hc) { g.save(); const hx = ox + (WHERO.x + 0.5) * ts, hy = oy + (WHERO.y + 0.8) * ts - hb;
    g.translate(hx, rigC ? hy + hb : hy); g.rotate(MT ? 0 : lean); if (WHERO.flip) g.scale(-1, 1);
    if (MT) { const cell = ts * 0.057, u = ts * 1.12 / 30, hopK = walking ? Math.abs(Math.sin(ph)) : 0, mb = MT.hop ? -hopK * ts * 0.24 : walking ? -hopK * 1.6 : Math.sin(t / 500) * 0.8;
      const fb = walking && (MT.hop ? hopK > 0.3 : Math.floor((WHERO.dist || 0) * 2.5) % 2 === 1), mc = SPR.cv(MT.spr + (fb ? '_b' : '')), mx0 = -MT.seat[0] * cell, my0 = ts * 0.1 - 31 * cell + mb;
      if (mc) g.drawImage(mc, mx0, my0, 32 * cell, 32 * cell);
      g.drawImage(hc, -28 * u, my0 + MT.seat[1] * cell - 33 * u, HERO.W * u, HERO.H * u); }
    else if (rigC) { const u = ts * 1.12 / 30; g.drawImage(hc, -28 * u, -44 * u, HERO.W * u, HERO.H * u); } else g.drawImage(hc, -ts * 0.55, -ts * 1.1, ts * 1.1, ts * 1.1 * hc.height / hc.width);
    g.restore(); }
  // 天气
  wCrowd(g, ch, m, S, ox, oy, ts, t, spr);
  if (SAVE.gfx !== 0) wWeather(g, T.wx, Wp, Hp, t);
  // 迷雾
  if (!m.def.lit) { const fog = wFogCanvas(ch); g.imageSmoothingEnabled = true; g.drawImage(fog, ox - ts / 2, oy - ts / 2, (m.W + 1) * ts, (m.H + 1) * ts); g.imageSmoothingEnabled = false; }
  else { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, Wp, oy); g.fillRect(0, oy + m.H * ts, Wp, Hp); }
  if (K === 'dungeon' || K === 'room') { const gr = g.createRadialGradient(Wp / 2, Hp / 2, Math.min(Wp, Hp) * 0.25, Wp / 2, Hp / 2, Math.max(Wp, Hp) * 0.7); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, K === 'dungeon' ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.3)'); g.fillStyle = gr; g.fillRect(0, 0, Wp, Hp); }
  wHazardHud(g, ch, m, S, ox, oy, ts, t, Wp, Hp);
  // 屏幕外 / 别的场景的任务目标：边缘箭头
  let mainM = tr[0] && wMarkPos(ch, tr[0]);
  if (mainM && mainM.sc !== S.sc) { const d = wNextDoor(ch, S.sc, mainM.sc); mainM = d ? { x: d.x, y: d.y, sc: S.sc } : null; }
  if (mainM) {
    const tx = ox + (mainM.x + 0.5) * ts, ty = oy + (mainM.y + 0.5) * ts;
    if (tx < 0 || ty < 0 || tx > Wp || ty > Hp) {
      const cx = Wp / 2, cy = Hp / 2, a = Math.atan2(ty - cy, tx - cx);
      const px = Math.max(22, Math.min(Wp - 22, cx + Math.cos(a) * (Wp / 2 - 22) / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)) * Wp / Hp)));
      const py = Math.max(22, Math.min(Hp - 22, cy + Math.sin(a) * (Hp / 2 - 22) / Math.max(Math.abs(Math.sin(a)), Math.abs(Math.cos(a)) * Hp / Wp)));
      g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = `rgba(255,215,90,${0.6 + 0.4 * pulse})`; g.beginPath(); g.moveTo(14, 0); g.lineTo(-8, -10); g.lineTo(-3, 0); g.lineTo(-8, 10); g.fill(); g.restore();
    }
  }
}
// 天气粒子（屏幕坐标）
function wWeather(g, wx, W, H, t) {
  if (!wx) return;
  const N = { fog: 7, wisp: 14, ember: 26, dust: 22, drip: 14, leaf: 12, snow: 40, ash: 24, spore: 18, petal: 14 }[wx] || 0;
  while (WPART.length < N) WPART.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), p: Math.random() * 6.28 });
  for (const P of WPART) {
    if (wx === 'fog') { P.x += WF * (0.15 + P.s * 0.2); if (P.x > W + 150) P.x = -150; const r = 90 + P.s * 90; const gr = g.createRadialGradient(P.x, P.y, 0, P.x, P.y, r); gr.addColorStop(0, 'rgba(180,170,160,.08)'); gr.addColorStop(1, 'rgba(180,170,160,0)'); g.fillStyle = gr; g.fillRect(P.x - r, P.y - r, r * 2, r * 2); }
    else if (wx === 'wisp') { P.y -= WF * (0.15 + P.s * 0.2); P.x += WF * (Math.sin(t / 900 + P.p) * 0.3); if (P.y < -10) { P.y = H + 10; P.x = Math.random() * W; } const a = 0.35 + 0.3 * Math.sin(t / 400 + P.p); g.fillStyle = `rgba(110,240,180,${a * 0.25})`; g.beginPath(); g.arc(P.x, P.y, 6 + P.s * 4, 0, 7); g.fill(); g.fillStyle = `rgba(190,255,220,${a})`; g.beginPath(); g.arc(P.x, P.y, 1.6 + P.s, 0, 7); g.fill(); }
    else if (wx === 'ember') { P.y -= WF * (0.4 + P.s * 0.6); P.x += WF * (Math.sin(t / 500 + P.p) * 0.4); if (P.y < -5) { P.y = H + 5; P.x = Math.random() * W; } g.fillStyle = `rgba(255,${120 + P.s * 80 | 0},40,${0.4 + 0.4 * P.s})`; g.fillRect(P.x, P.y, 2, 2); }
    else if (wx === 'dust') { P.y += WF * (Math.sin(t / 1300 + P.p) * 0.08); P.x += WF * (0.06 + P.s * 0.05); if (P.x > W + 5) P.x = -5; g.fillStyle = `rgba(255,230,180,${0.12 + 0.15 * P.s})`; g.fillRect(P.x, P.y, 1.5, 1.5); }
    else if (wx === 'snow') { P.y += WF * (0.5 + P.s * 0.8); P.x += WF * (Math.sin(t / 800 + P.p) * 0.5 - 0.2); if (P.y > H + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = `rgba(240,248,255,${0.5 + 0.4 * P.s})`; g.fillRect(P.x, P.y, 2 + P.s, 2 + P.s); }
    else if (wx === 'ash') { P.y += WF * (0.25 + P.s * 0.3); P.x += WF * (Math.sin(t / 900 + P.p) * 0.4); if (P.y > H + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = `rgba(90,80,80,${0.4 + 0.3 * P.s})`; g.fillRect(P.x, P.y, 2, 2); }
    else if (wx === 'spore') { P.y -= WF * (0.12 + P.s * 0.15); P.x += WF * (Math.sin(t / 700 + P.p) * 0.35); if (P.y < -5) { P.y = H + 5; P.x = Math.random() * W; } g.fillStyle = `rgba(170,230,90,${0.25 + 0.3 * Math.sin(t / 300 + P.p) ** 2})`; g.beginPath(); g.arc(P.x, P.y, 1.5 + P.s * 1.5, 0, 7); g.fill(); }
    else if (wx === 'petal') { P.y += WF * (0.35 + P.s * 0.3); P.x += WF * (0.3 + Math.sin(t / 600 + P.p) * 0.6); if (P.y > H + 5 || P.x > W + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = P.s > 0.5 ? 'rgba(255,190,210,.7)' : 'rgba(255,240,245,.6)'; g.fillRect(P.x, P.y, 3, 2); }
    else if (wx === 'drip') { P.y += WF * (2 + P.s * 2); if (P.y > H) { P.y = -20; P.x = Math.random() * W; } g.fillStyle = 'rgba(140,200,220,.35)'; g.fillRect(P.x, P.y, 1, 6); }
    else if (wx === 'leaf') { P.y += WF * (0.3 + P.s * 0.3); P.x += WF * (0.4 + Math.sin(t / 700 + P.p) * 0.5); if (P.y > H + 5 || P.x > W + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = P.s > 0.5 ? 'rgba(200,120,50,.6)' : 'rgba(140,170,70,.5)'; g.fillRect(P.x, P.y, 3, 2); }
  }
}
function shade(hex, d) { const n = parseInt(hex.slice(1), 16); const c = k => Math.max(0, Math.min(255, ((n >> k) & 255) + d)); return `rgb(${c(16)},${c(8)},${c(0)})`; }
let _fogc = null;
function wFogCanvas(ch) {
  const m = wmap(ch);
  if (!_fogc) _fogc = document.createElement('canvas');
  _fogc.width = m.W + 1; _fogc.height = m.H + 1;
  const g = _fogc.getContext('2d'), img = g.createImageData(m.W + 1, m.H + 1);
  const a = (x, y) => { if (x < 0 || y < 0 || x >= m.W || y >= m.H) return 255; if (!wSeen(ch, x, y)) return 250; return wInSight(ch, x, y) ? 0 : 120; };
  for (let y = 0; y <= m.H; y++) for (let x = 0; x <= m.W; x++) {
    const v = (a(x - 1, y - 1) + a(x, y - 1) + a(x - 1, y) + a(x, y)) / 4, i = (y * (m.W + 1) + x) * 4;
    img.data[i] = 5; img.data[i + 1] = 4; img.data[i + 2] = 6; img.data[i + 3] = v;
  }
  g.putImageData(img, 0, 0);
  return _fogc;
}
// ---- 操作 ----
const W_USE = ['gate', 'stele', 'sign', 'board', 'lamp', 'xintu'];
function wInteract(ch, x, y) {
  const npc = wNpcAt(ch, x, y);
  if (npc) return () => wRun(wTalk(ch, npc.id, SAVE.run));
  const P = wPt(ch, x, y);
  if (P && (W_USE.includes(P.t) || (P.t === 'door' && !wDoorOpen(ch, P))) && !wPassHero(ch, x, y)) return () => wRun(wUse(ch, x, y, SAVE.run));
  return null;
}
function wTap(px, py, cv, ts) {
  if (DLG || MODALFN) return;
  const ch = wch(), m = wmap(ch);
  const x = Math.floor((px - WCAM.ox) / ts), y = Math.floor((py - WCAM.oy) / ts);
  if (x < 0 || y < 0 || x >= m.W || y >= m.H) return;
  WTAP = { x, y, t: 0 }; wStopAuto(); WGOAL = null; MAPGOAL = null;
  const S = wstate(ch);
  if (x === S.pos.x && y === S.pos.y) { const P = wPt(ch, x, y); if (P && P.t === 'camp') openModal(campModal(P)); return; }
  if (wBoxAt(ch, x, y)) { const dx = x - S.pos.x, dy = y - S.pos.y; if (Math.abs(dx) + Math.abs(dy) === 1) return wDirStep(dx, dy); return qtoast("Đứng cạnh khối băng, chạm vào nó theo hướng muốn đẩy"); }
  if (wIceTap(x, y)) return;
  const act = wInteract(ch, x, y);
  if (act) return wWalkTo(x, y, act);
  const P = wPt(ch, x, y);
  wWalkTo(x, y, P && P.t === 'camp' && wPtVisible(ch, x, y) ? () => openModal(campModal(P)) : null, true);
}
// 走到最近的篝火，打开歇脚（第一次到会先点亮篝火，等它说完再开）
function wGoCamp(ch) {
  const cp = wNearCamp(ch); if (!cp) return; const S0 = wstate(ch);
  if (cp.x === S0.pos.x && cp.y === S0.pos.y) return openModal(campModal(cp.P));
  const arrive = (n = 0) => { if (VIEW !== 'world' || n > 120) return; if (WALK || DLG) return setTimeout(() => arrive(n + 1), 250);
    const S1 = wstate(ch); if (S1.pos.x === cp.x && S1.pos.y === cp.y && !MODALFN) openModal(campModal(cp.P)); };
  wWalkTo(cp.x, cp.y, null, true); setTimeout(arrive, 300);
}
// 这张图里离你最近、看得见的篝火
function wNearCamp(ch) {
  const S = wstate(ch), m = wmap(ch); let best = null;
  for (const c of Object.keys(m.pts)) { const D = m.def.pts[c]; if (!D || D.t !== 'camp') continue;
    for (const q of m.pts[c]) if (wPtVisible(ch, q.x, q.y)) { const d = Math.abs(q.x - S.pos.x) + Math.abs(q.y - S.pos.y); if (!best || d < best.d) best = { x: q.x, y: q.y, d, P: { code: c, ...D } }; } }
  return best;
}
// 冰面上用手点：寻路不会替人解冰面，所以原来点冰面一点反应都没有（只能用方向键）。现在：
//   人站在冰上，或者站在冰边、点的那格顺着冰面的方向——往点的那个方向滑；
//   人离冰面还远——先走到冰边（正对着点的那一格的那个入口），再点一下才滑。
let ICEHINT = 0;
function wIceTap(x, y) {
  const ch = wch(), S = wstate(ch), m = wmap(ch), T = wTerr(ch);
  if (wHasKey(ch, T.ice)) return false;
  const ice = (a, b) => wTile(m, a, b) === '_', onIce = ice(S.pos.x, S.pos.y);
  if (!onIce && !ice(x, y)) return false;
  const ddx = x - S.pos.x, ddy = y - S.pos.y, sx = Math.sign(ddx), sy = Math.sign(ddy);
  const dirs = (Math.abs(ddx) >= Math.abs(ddy) ? [[sx, 0], [0, sy]] : [[0, sy], [sx, 0]]).filter(d => d[0] || d[1]);
  const slide = (dx, dy) => { const t = wDirTarget(dx, dy); if (!t) return false; wDirStep(dx, dy); return true; };
  if (onIce) {   // 在冰上：点哪边就往哪边滑；正对的方向走不动，再试另一个方向
    for (const [dx, dy] of dirs) if (slide(dx, dy)) return true;
    qtoast("Bên đó không trượt qua được"); return true;
  }
  // 在岸上、点的是冰：点的那格和人在同一行（列），而且人就贴着冰——直接滑
  if ((!ddx || !ddy) && ice(S.pos.x + sx, S.pos.y + sy)) { if (!slide(sx, sy)) qtoast("Bên đó không trượt qua được"); return true; }
  // 否则先走到入口：从点的那格往四个方向退到冰面外头的第一格，挑走得到、最近的一个
  let best = null;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let ex = x - dx, ey = y - dy; while (ice(ex, ey)) { ex -= dx; ey -= dy; }
    if (!wSeen(ch, ex, ey) || !wPassHero(ch, ex, ey) || wBoxAt(ch, ex, ey) || wPuzzle(ch, ex, ey)) continue;
    const here = ex === S.pos.x && ey === S.pos.y, path = here ? [] : wPath(ch, ex, ey); if (!path) continue;
    if (!best || path.length < best.path.length) best = { ex, ey, dx, dy, path };
  }
  if (!best) { for (const [dx, dy] of dirs) if (ice(S.pos.x + dx, S.pos.y + dy) && slide(dx, dy)) return true;   // 站在冰面中间的石台上，别的入口都走不到：就按点的方向滑
    qtoast("Từ phía này không tới được mảng băng đó"); return true; }
  if (!best.path.length) { if (!slide(best.dx, best.dy)) qtoast("Bên đó không trượt qua được"); return true; }
  WALK = { path: best.path, i: 0, onArrive: () => { if (ICEHINT++ < 2) qtoast("Đã tới mép băng: chạm lên mặt băng lần nữa để trượt về hướng đó"); } };
  wStepLoop();
  return true;
}
function wWalkTo(x, y, onArrive) {
  const ch = wch();
  let path = wPath(ch, x, y), near = false;
  if (!path) { const r = wPathNear(ch, x, y); path = r.path; near = true; }
  if (!path || (!path.length && !onArrive)) return false;
  if (!path.length) { if (onArrive && !near) onArrive(); return true; }
  WALK = { path, i: 0, onArrive: near ? null : onArrive };
  wStepLoop();
  return true;
}
function wStepLoop() {
  clearTimeout(WALK && WALK.h);
  if (!WALK || VIEW !== 'world') { WALK = null; return; }
  if (DLG || MODALFN) { WALK.h = setTimeout(wStepLoop, 200); return; }
  const ch = wch();
  let p = WALK.path[WALK.i++];
  if (!p && WALK.joy && JOY && !DLG) { const T = wDirTarget(JOY[0], JOY[1]); if (T && !T.act) { const P2 = wPt(ch, T.x, T.y); WALK.path.push({ x: T.x, y: T.y }); WALK.i = WALK.path.length; p = WALK.path[WALK.i - 1]; /* 原来下标多加了一次，摇杆每走一格就断一下 */ WALK.onArrive = P2 && P2.t === 'camp' ? () => openModal(campModal(P2)) : null; } }
  if (!p) { const f = WALK.onArrive; WALK = null; if (f) f(); else if (WAUTO) setTimeout(wAutoStep, 120); updWorldHud(); return; }
  const S = wstate(ch);
  if (WHERO) { WHERO.flip = p.x < S.pos.x ? true : p.x > S.pos.x ? false : WHERO.flip; WHERO.back = p.y < S.pos.y ? true : p.y > S.pos.y ? false : (p.x !== S.pos.x ? false : WHERO.back); }
  const from = { x: S.pos.x, y: S.pos.y }, sc0 = S.sc;
  const diag = p.x !== S.pos.x && p.y !== S.pos.y, dur = W_STEP * (diag ? 1.35 : 1);
  if (WHERO) { const pm = WHERO.mv, now = performance.now(), cont = pm && now - (pm.t0 + pm.d) < 80 && now >= pm.t0 + pm.d - 8;   // 接着上一格走：时间和位置都从上一格的终点算起，速度不断
    WHERO.mv = { fx: cont ? from.x : WHERO.x, fy: cont ? from.y : WHERO.y, t0: cont ? pm.t0 + pm.d : now, d: dur, dist0: Math.round(WHERO.dist || 0) }; }
  const r = wStep(ch, p.x, p.y, SAVE.run);
  if (S.sc === sc0 && !r.blocked) { WTRAIL.unshift(from); WTRAIL.length = Math.min(WTRAIL.length, 4); }
  if (WALK) { const T2 = SCENE_THEMES[(wmap(ch).def || {}).theme] || {}, th = (wmap(ch).def || {}).theme; SFX.play(th === 'snow' || th === 'icecave' ? 'crunch' : th === 'swamp' ? 'squelch' : T2.kind === 'room' || T2.kind === 'hall' ? 'wood' : WALK.i % 2 ? 'step' : 'step2'); }
  updWorldHud();
  if (r.blocked) { WALK = null; for (const a of r.acts || []) { if (a.toast) qtoast(a.toast); if (a.sfx) SFX.play(a.sfx); }   // 被挡住要说一声为什么；自动探索时被挡住：换条路再试，连着三次都不通才停（原来会卡在「探索中…」不动）
    if (WAUTO) { if (++AUTOBLK >= 3) { AUTOBLK = 0; wStopAuto(); qtoast("Bên này không đi được, tạm dừng tự khám phá"); } else { clearTimeout(AUTOT); AUTOT = setTimeout(wAutoStep, 250); } }
    return; }
  AUTOBLK = 0;
  if (r.cont) { for (const a of r.acts) { if (a.toast) qtoast(a.toast); if (a.sfx) SFX.play(a.sfx); } }
  else if (r.acts.length) { WALK = null; save(); return wRun(r.acts); }
  // 自动探索时：有醒着的妖物靠近、或者找到了要找的东西，就停下
  if (WAUTO && !isRift(SAVE.run)) {   // 剧情里：醒着的妖物靠近就停；幻境里本来就是去找妖物打，撞上去就开打
    if (wScene(ch).mons.some(mn => mn.beh !== 'sleep' && wInSight(ch, mn.x, mn.y) && wdist(mn, S.pos) <= 3)) { WALK = null; wStopAuto(); qtoast("Phía trước có yêu vật, tạm dừng tự khám phá"); return; }
    const found = wTracker(ch).find(q => q.find && (() => { const t = wMarkPos(ch, q); return t && !t.area && t.sc === S.sc && wInSight(ch, t.x, t.y); })());
    if (found) { WALK = null; wStopAuto(); WGOAL = null; qtoast(`Đằng kia hình như có gì đó — “${found.t}”`); SFX.play('rare'); return; }
  }
  WALK.h = setTimeout(wStepLoop, dur);
}
let AUTOT = null, AUTOBLK = 0;
function wAutoStep() {
  clearTimeout(AUTOT);
  if (!WAUTO || VIEW !== 'world' || WALK) return;
  if (DLG || MODALFN) { AUTOT = setTimeout(wAutoStep, 400); return; }   // 正在说话或开着窗口：等它关了接着探索
  const ch = wch(), run = SAVE.run;
  if (isRift(run)) {   // 幻境：妖王 > 精魄球 > 最近的一群妖物；这一层打空了就去传送阵
    const S = wstate(ch), D = wScene(ch), m = wmap(ch), near = L => L.slice().sort((a, b) => wdist(a, S.pos) - wdist(b, S.pos));
    // 自动闯关：妖王 > 精魄和精英优先（近处的精魄当顺路捡，精英比同样远的小妖先打）> 最近的一群；这一层攒够了就去传送阵
    const boss = D.mons.find(o => o.boss), sc = o => wdist(o, S.pos) - (o.orb ? 16 : o.rare ? 32 : o.elite ? 24 : 0);   // 精英远一点也先去：一只精英连精魄 8 分，顶得上一大群小妖
    const pool = rCapped(run) ? [] : [...(D.orbs || []).map(o => ({ x: o.x, y: o.y, orb: 1 })), ...D.mons];
    const cands = boss ? [boss] : pool.length ? pool.sort((a, b) => sc(a) - sc(b)).slice(0, 6) : (m.pts['2'] || []);
    let path = null; for (const c of cands) { path = wPath(ch, c.x, c.y); if (path && path.length) break; }
    if (!path || !path.length) { wStopAuto(); return qtoast("Quanh đây không còn yêu vật, tự đi tìm thử xem"); }
    WALK = { path: path.slice(0, 12), i: 0 }; return wStepLoop();
  }
  if (run.hp < runStats(run).maxHp * 0.35 && run.potions === 0) { wStopAuto(); return qtoast("Khí huyết thấp quá, về lửa trại nghỉ chân đã"); }
  const path = wExploreTarget(ch, WAUTOZ);
  if (!path || !path.length) { const z = WAUTOZ; wStopAuto();
    // 路都走过了，但地上还有发光的线索没捡：提醒去点一下（原来只会说「找遍了」，其实东西就在眼前）
    let loose = 0; { const m = wmap(ch); for (const c in m.pts) { const P = m.def.pts[c]; if (!P || !['qitem', 'clue', 'relic'].includes(P.t)) continue; for (const p of m.pts[c]) if (wSeen(ch, p.x, p.y) && wPtVisible(ch, p.x, p.y)) loose++; } }
    return qtoast(loose ? "Đường đã đi hết — chỗ phát sáng trên mặt đất chưa xem, chạm vào thử" : z ? "Vùng này tìm khắp rồi, sang chỗ khác xem" : "Quanh đây đã khám phá hết"); }
  WALK = { path: path.slice(0, 10), i: 0 }; wStepLoop();
}
function wStopAuto() { WAUTOZ = null; if (!WAUTO) return; WAUTO = false; const b = document.querySelector('.wauto'); if (b) { b.classList.add('ghost'); b.textContent = isRift(SAVE.run) ? "Tự vượt ải" : "Tự khám phá"; } }
function wStartAuto(zone) { if (wWatchBlock(wch())) return qtoast("Chỗ này có người tuần tra, tự khám phá vô dụng — tự lần mò qua đi"); WAUTO = true; WAUTOZ = zone || null; const b = document.querySelector('.wauto'); if (b) { b.classList.remove('ghost'); b.textContent = isRift(SAVE.run) ? "Đang vượt ải…" : "Đang khám phá…"; } MAPGOAL = null; wAutoStep(); }
// 等级和经验条：手机上副标题是收起来的，等级要单独露出来
let XPLV = null;
function xpInfo(cls) {
  const ch = SAVE.chars[cls], top = ch.level >= MAX_LV;
  const cur = top ? SAVE.para.xp : ch.xp, need = top ? paraNeed(SAVE.para.lv) : xpNeed(ch.level);
  return { lv: top ? SAVE.para.lv : ch.level, top, k: Math.max(0, Math.min(1, cur / need)), cur, need };
}
function xpRow(cls) {
  const X = xpInfo(cls), key = cls + (X.top ? 'p' : '') + X.lv, up = XPLV && XPLV.cls === cls && XPLV.key !== key && X.lv > XPLV.lv; XPLV = { cls, key, lv: X.lv };
  return `<div class="xprow${up ? ' lvup' : ''}" id="rbxp"><b>${X.top ? `Tu vi ${X.lv}` : `Lv ${X.lv}`}</b><div class="xpbar"><i style="width:${(X.k * 100).toFixed(1)}%"></i></div><small>${Math.floor(X.k * 100)}%</small></div>`;
}
function updXp() { const r = $('#rbxp'); if (!r || !SAVE.run) return; const X = xpInfo(SAVE.run.cls); r.querySelector('i').style.width = (X.k * 100).toFixed(1) + '%'; r.querySelector('small').textContent = Math.floor(X.k * 100) + '%'; }
// 任务条只放简略版：标题、进度、一行描述（长了就省略），全文去「任务」里看
function trkTD(q) {
  let d = String(q.d || ''), pg = '';
  const mm = d.match(/[（(]\s*(\d+\s*\/\s*\d+)\s*[）)]\s*$/); if (mm) { pg = mm[1].replace(/\s/g, ''); d = d.slice(0, mm.index).trim(); }
  return `<b>${esc(q.t)}${pg ? `<i class="wt-pg">${pg}</i>` : ''}</b><small>${esc(d)}</small>`;
}
function updWorldHud() {
  const run = SAVE.run; if (!run || VIEW !== 'world') return;
  const s = runStats(run), rb = $('#rbhp');
  if (rb) { rb.querySelector('i').style.width = Math.max(0, run.hp / s.maxHp * 100) + '%'; rb.querySelector('span').textContent = `${hpTxt(run.hp)} / ${hpTxt(s.maxHp)}`; }
  const z = $('#wzone'); if (z) z.textContent = zoneName();
  if (isRift(run)) { const rp = $('#rprog'), pb = $('#rbprog'); if (rp) { rp.querySelector('i').style.width = run.prog + '%'; rp.classList.toggle('full', run.prog >= 100); rp.querySelector('span').textContent = run.rw.boss ? "Tiến độ đã đầy · yêu vương giữ ải đã hiện thân" : `Tiến độ Ảo Cảnh ${Math.floor(run.prog)}%`; }
    if (pb) pb.lastChild.textContent = `Tiến độ ${Math.floor(run.prog)}%`; const rh = $('#rhint'); if (rh) rh.textContent = riftHint(run); const pt = $('#rbpot'); if (pt) pt.textContent = `Đan dược ${run.potions}`; }
  updXp();
}
// 剧情动作：对话、选择题、选择、提示、好感（地图和镇上通用）
function doCommon(a, next) {
  if (a.intro) { const o = a.intro === 'inter' ? interIntroFor(qch()) : chIntroFor(qch()); if (!o) { next(); return true; } const S = wstate(qch()); S.pz.iintro = 1; chapterIntro(o, next); return true; }
  if (a.dlg) { if (!a.dlg.length) next(); else playDialog(a.dlg, null, next); return true; }
  if (a.quiz) { playQuiz(QUIZ[a.quiz], next); return true; }
  if (a.mini) { playMini(a.mini, next); return true; }
  if (a.food) { openModal(foodModal); next(); return true; }
  if (a.board) { wStopAuto(); BTYMSG = ''; openModal(boardModal); next(); return true; }
  if (a.shop) { wStopAuto(); SHOPID = a.shop; SHOPTAB = 'buy'; SHOPMSG = ''; SHOPSEL = -1; openModal(shopModal); next(); return true; }
  if (a.choice) { playChoice(a.choice, next); return true; }
  if (a.toast) { qtoast(a.toast); SFX.play('rare'); next(); return true; }
  if (a.aff) { const [k, d] = a.aff; qtoast(`<span class="afft">${esc(AFF_WHO[k])} thiện cảm ${d > 0 ? '+' + d + ' ♥' : d}</span>`); SFX.play(d > 0 ? 'buff' : 'fail'); next(); return true; }
  if (a.banner) { banner(a.banner[0], a.banner[1], 1700); if (a.banner[0] === "Chuyện đêm bên lửa trại") SFX.mood({ key: 'sad' }); setTimeout(next, 1000); return true; }
  if (a.sfx) { SFX.play(a.sfx); next(); return true; }
  if (a.final && SAVE.run && SAVE.run.world) { setTimeout(wFinishChapter, 50); return true; }   // 选择里直接走到了结局
  return false;
}
function runCommon(acts, done, i = 0) { save(); if (i >= acts.length) return done && done(); const next = () => runCommon(acts, done, i + 1); if (!doCommon(acts[i], next)) next(); }
// 地图上依次执行引擎给出的动作
function wRun(acts, i = 0) {
  save();
  if (i >= acts.length) { if (VIEW === 'world') { render(); wResume(); } return; }
  const a = acts[i], next = () => wRun(acts, i + 1);
  if (doCommon(a, next)) return;
  if (a.enter) { WHERO = null; WMONP = {}; render(); const D = WMAPS[wch()].scenes[a.enter]; banner(D.n, '', 1100); SFX.play('door'); return setTimeout(next, 350); }
  if (a.fight) { WKEY = { key: a.key, rest: acts.slice(i + 1) }; return beginWorldBattle(a.fight); }
  if (a.rboss) { WALK = null; render();   /* 自动闯关开着就接着去打妖王 */ banner(a.sh ? "Dị thú Sơn Hải hiện thân" : "Yêu vương giữ ải hiện thân", `${a.rboss} · ${a.d || ''}`, a.sh ? 2800 : 2200); SFX.play('gong'); return setTimeout(next, 600); }
  if (a.rdone) { const run = SAVE.run; riftComplete(run); SFX.play('legend'); return finishRunView(run, 'win'); }
  if (a.chest) { const run = SAVE.run; run.encCell = { lv: wmap(wch()).zoneAt(wstate(wch()).pos.x, wstate(wch()).pos.y).lv };
    CHEST = openChest(run, a.q); VIEW = 'chest'; SFX.play('loot'); WKEY = { rest: acts.slice(i + 1) }; return render(); }
  if (a.event) { const run = SAVE.run; run.encCell = { lv: wmap(wch()).zoneAt(wstate(wch()).pos.x, wstate(wch()).pos.y).lv, ev: RNG.pick(EVENTS).id };
    EVRES = null; VIEW = 'event'; WKEY = { rest: acts.slice(i + 1) }; return render(); }
  if (a.final) return wFinishChapter();
  if (a.dossier) { DOSS = { go: () => { closeModal(); next(); }, back: () => { closeModal(); WGOAL = null; render(); } }; wStopAuto(); return openModal(dossierModal(a.dossier)); }
  next();
}
// 走地图的章节，剧情回顾放玩家真正看过的：开场 = 第一步（紧跟着自动开始的第二步也算），结尾 = 收尾那一步（第十章按拿到的结局）
function wReplayLines(k, part) {
  const M = (WQ[k] || {}).main || [], S = (SAVE.world && SAVE.world[k]) || { flags: {}, pz: {}, side: {}, got: {}, sd: {} };
  const L = x => { try { return (typeof x === 'function' ? x(S) : x) || []; } catch (e) { return []; } };
  const of = m => (m ? [...L(m.lines), ...L(m.after)] : []).filter(l => Array.isArray(l) && typeof l[1] === 'string' && !/^（/.test(l[1]));
  if (part === 'wintro') return [...of(M[0]), ...(M[1] && M[1].auto ? of(M[1]) : [])];
  const F = M.filter(m => m.final), end = wflags().ending;
  const z = (end && F.find(m => m.rw && m.rw.setw && m.rw.setw.ending === end)) || F[F.length - 1] || M[M.length - 1], out = of(z);
  return out.length < 4 ? [...of(M[M.indexOf(z) - 1]), ...out] : out;   // 收尾那步太短（比如只剩一句「醒来」），把前一步也带上
}
// 打首领输了：提醒还有哪几样克制它的东西没带
function bossMissHTML() {
  const id = WKEY && WKEY.key && WKEY.key.boss, D = id && typeof DOSSIER !== 'undefined' && DOSSIER[id]; if (!D) return '';
  const miss = D.items.filter(it => it.key && !wkeys()[it.key] && W_KEYS[it.key]); if (!miss.length) return '';
  return `<p class="sub">Còn ${miss.length} món khắc chế nó chưa mang theo: ${miss.map(it => `“${esc(W_KEYS[it.key].n)}”`).join(", ")}. Chỗ tìm có ghi trong Hồ sơ thủ lĩnh (thanh Nhiệm vụ cũng có manh mối), mang theo rồi quay lại sẽ dễ hơn nhiều.</p>`;
}
// 首领卷宗
let DOSS = null;
const dossierModal = id => () => {
  const D = DOSSIER[id], have = D.items.filter(it => it.key && wkeys()[it.key]).length, tot = D.items.filter(it => it.key).length;
  const C = CHAPTERS[wch() - 1].boss;
  return `<div class="doss"><div class="doss-h">${SPR.img(C.spr, 72, C.pal)}<div><small>Hồ sơ thủ lĩnh</small><h2 class="mh">${esc(D.n)}</h2><p class="sub">${esc(D.d)}</p></div></div>
    <ul class="dossl">${D.items.map(it => { const ok = it.key ? !!wkeys()[it.key] : null;
      return `<li class="${ok === true ? 'ok' : ok === false ? 'no' : 'sk'}"><b>${esc(it.n)}</b><span>${esc(it.d)}</span><small>${ok === true ? `✓ Đã khắc chế: ${esc(W_KEYS[it.key].n)}` : ok === false ? `✗ Khắc chế nó: ${esc(it.how)}` : `Mẹo: ${esc(it.how)}`}</small></li>`; }).join('')}</ul>
    <p class="help-p">Đã mang ${have}/${tot} vật khắc chế. ${have < tot ? "Thiếu đồ vẫn đánh được, chỉ là khó hơn nhiều — có thể quay về tìm, hoặc luyện thêm vài cấp rồi tới." : "Chuẩn bị rất chu đáo."}</p>
    <div class="row"><button class="btn" data-act="dgo">Đánh</button><button class="btn ghost" data-act="dback">Về chuẩn bị thêm</button></div></div>`;
};
// 连输之后的提示：哪招要用什么克、那样东西从哪条支线来
const bossHelpModal = id => () => {
  const D = DOSSIER[id], ch = wch(), S = wstate(ch), tr = wTracker(ch);
  const miss = D.items.filter(it => it.key && !wkeys()[it.key]);
  return `<div class="doss"><div class="doss-h"><div><small>Đã thua nó ${S.pz.bl || 2} lần</small><h2 class="mh">${esc(D.n)}</h2><p class="sub">Nó có ${miss.length} chiêu phải dùng vật khắc chế. Chỉ luyện thêm vài cấp thì khó mà gồng nổi — hãy lấy được vật khắc nó trước.</p></div></div>
    <ul class="dossl">${miss.map(it => { const q = WQ[ch].side.find(q => wSideKey(q) === it.key), on = q && tr.some(t => t.id === q.id);
      return `<li class="no"><b>${esc(it.n)}</b><span>${esc(it.d)}</span><small>Khắc chế nó: ${esc(it.how)}</small>${on ? `<button class="btn sm bh-go" data-act="bhgo" data-arg="${q.id}">${S.side[q.id] ? "Đi làm nhiệm vụ phụ này" : "Đi nhận nhiệm vụ phụ này"} ▸</button>` : ''}</li>`; }).join('')}</ul>
    <div class="row"><button class="btn ghost" data-act="close">Đã hiểu</button></div></div>`;
};
// 一键前往跨场景时：进门之后接着走
function wResume() {
  if (WGOAL && !DLG && !MODALFN && VIEW === 'world') { const id = WGOAL.id; if (++WGOAL.hops > 10) { WGOAL = null; return; } setTimeout(() => { if (WGOAL && WGOAL.id === id && !WALK && !DLG && !MODALFN) ACT.wgo(id, null, true); }, 350); }
  else if (MAPGOAL && !DLG && !MODALFN && VIEW === 'world') { const G = MAPGOAL, S = wstate(wch());
    if (G.sc !== S.sc || (G.x === S.pos.x && G.y === S.pos.y) || ++G.hops > 12) { MAPGOAL = null; return; }
    setTimeout(() => { if (MAPGOAL === G && !WALK && !DLG && !MODALFN && VIEW === 'world' && !wWalkTo(G.x, G.y, () => { if (MAPGOAL === G) MAPGOAL = null; })) MAPGOAL = null; }, 350); }
  else if (WAUTO) setTimeout(wAutoStep, 400);
}
function beginWorldBattle(enc) {
  const run = SAVE.run; if (isRift(run)) run.sth = wmap(RCH).def.theme;
  const kind = wPrepBattle(run, enc);
  beginBattle(kind);
  if (enc.rift && enc.n > 1) B.logs.push(`Cuốn vào một hơi ${enc.n} bầy yêu vật${B.reinf && B.reinf.length ? `, phía sau còn xếp hàng ${B.reinf.length} con` : ''}`);
  if (enc.first === 'p') { B.P.g = 100; B.units.forEach(u => { if (u.side === 'e') u.g = Math.min(u.g, 10); }); B.logs.push("Bạn ra tay trước!"); }
  else if (enc.first === 'e' && enc.kind !== 'boss') { B.units.forEach(u => { if (u.side === 'e') u.g = 85; }); B.logs.push("Bị yêu vật đánh lén sau lưng!"); }
  if (enc.kind === 'boss') { const BC = (CHAPTERS[(enc.rift ? enc.c : run.chapter) - 1] || CHAPTERS[0]).boss; banner(enc.rift ? "Giữ ải Ảo Cảnh · " + BC.n : BC.n, BC.d, 1800); }
  applyStep(null);
}
function riftBattleContinue() {
  const run = SAVE.run, k = WKEY || {}; WKEY = null;
  if (!BRES.win) {
    const gain = k.key && k.key.rboss ? rBossGain(B) : false, kept = k.key && k.key.rboss ? rBossKeep(B, k.key) : null;   // 打妖王倒下：它的血记下来，下次接着打（每倒一次回一成）
    const auto = WAUTO, pen = riftRevive(run), left = xiangLeft(run) > 0;
    // 自动闯关：打小怪倒下一次爬起来接着打，连着倒两次就停；打妖王只要这次打动了（掉的血比它回的多，或者打死了帮手），香也还有，就一直接着去打
    const keep = auto && (kept ? gain && left : ++RDEATH < 2); if (kept && gain) RDEATH = 0;
    B = null; VIEW = 'world'; WALK = null; WGOAL = null; MAPGOAL = null; wStopAuto(); WHERO = null; save(); render();
    banner("Bạn ngã xuống rồi", kept ? `Yêu vương còn ${Math.round(Math.min(1, kept.now + R_BOSS_BACK) * 100)}% máu (mỗi lần bạn ngã nó hồi một phần mười) · hương cháy mất ${fmtClock(pen)}` : `Ảo Cảnh ném bạn về lối vào của tầng này · hương cháy mất ${fmtClock(pen)}`, 2200);
    if (keep) setTimeout(() => { if (VIEW === 'world' && !WAUTO && isRift(SAVE.run)) wStartAuto(); }, 2000);
    else if (auto) qtoast(kept ? (!left ? "Hương đã cháy hết, tự động vượt ải tạm dừng. Máu yêu vương vẫn được ghi lại, bạn có thể tự đánh tiếp (tính là \"Hương tàn\")" : "Lần này không đánh nổi yêu vương (máu mất chưa bằng máu nó hồi), tự động vượt ải tạm dừng: đổi trang bị, đổi trận rồi đánh tiếp") : "Ngã liền hai lần, tự vượt ải tạm dừng: thay bộ trang bị, hoặc hạ một tầng rồi thử lại");
    return;
  }
  RDEATH = 0; if (B && B.kind === 'boss') wStopAuto();   // 打完妖王停在结算
  B = null; VIEW = 'world'; save(); render();
  wRun(wFightWon(RCH, k.key || {}, run).concat(k.rest || []));
}
function worldBattleContinue() {
  if (isRift(SAVE.run)) return riftBattleContinue();
  const run = SAVE.run, ch = run.chapter, k = WKEY || {}; WKEY = null;
  if (!BRES.win && k.key && k.key.scripted) {   // 剧情战：本来就打不赢，输了照样往下走
    run.hp = Math.max(1, Math.round(runStats(run).maxHp * 0.3)); B = null; VIEW = 'world'; save(); render();
    wRun(wFightWon(ch, k.key, run).concat(k.rest || [])); return;
  }
  if (!BRES.win) {
    const bid = k.key && k.key.boss, S0 = wstate(ch); if (bid) S0.pz.bl = (S0.pz.bl || 0) + 1;
    const r = wDefeat(ch, run); B = null; VIEW = 'world'; WALK = null; WGOAL = null; MAPGOAL = null; wStopAuto(); WHERO = null; save(); render();
    // 同一个首领输到第二次（以后每隔一次）：直接说清它哪招要用什么克，并给一个「前往」
    const help = bid && S0.pz.bl >= 2 && S0.pz.bl % 2 === 0 && DOSSIER[bid] && DOSSIER[bid].items.some(it => it.key && !wkeys()[it.key]);
    playDialog([['narr', `Bạn ngã xuống… mơ mơ màng màng, có người kéo bạn về bên lửa trại. ${r.lost ? `Túi tiền nhẹ đi ${r.lost} lượng.` : ''}`], ...(r.msg ? [['narr', r.msg]] : [])], null, help ? () => openModal(bossHelpModal(bid)) : undefined);
    return;
  }
  B = null; VIEW = 'world'; save(); render();
  wRun(wFightWon(ch, k.key || {}, run).concat(k.rest || []));
}
function wBack() { const k = WKEY; WKEY = null; VIEW = 'world'; wRun((k && k.rest) || []); }   // 开完宝箱、遇完奇遇：接着自动探索 / 接着前往（原来会停在「探索中…」不动）
function wFinishChapter() {
  const run = SAVE.run; WGOAL = null; wStopAuto();
  const res = storyComplete(run); endRun(run, 'win'); LASTRUN = run; VIEW = res.ending || (run.chapter === 10 && run.diff === 'normal' && SAVE.story.ended && !seen('credW')) ? 'credits' : 'end'; if (VIEW === 'credits') markSeen('credW');
  save(); render(); window.scrollTo(0, 0); SFX.play('win'); achToast(run.ach);
}
// ---- 选择题 / 选择 ----
const qch = () => (SAVE.run && SAVE.run.world ? SAVE.run.chapter : townCh() || 1);
const qrun = () => (SAVE.run && SAVE.run.world ? SAVE.run : null);
function showOpts(lastQ, labels, onPick) {
  const box = $('#quiz'), who = SPEAKERS[lastQ[0]] || { n: '' };
  box.innerHTML = `<div class="qz-box"><div class="qz-q">${who.n ? `<b>${esc(who.n)}</b>` : ''}${esc(lastQ[1])}</div>${labels.map((l, i) => `<button class="qz-opt" data-qi="${i}">${esc(l)}</button>`).join('')}</div>`;
  box.hidden = false;
  box.onclick = e => { const b = e.target.closest('[data-qi]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null; onPick(+b.dataset.qi); };
}
// ================= 机关示范 =================
// 每种机关第一次出现在眼前时，放一段十秒左右的小动画：先看一遍怎么过，再自己走。
const DKF = (keys, T) => { let a = keys[0]; for (const k of keys) { if (k[0] > T) { const u = (T - a[0]) / Math.max(0.001, k[0] - a[0]); return [a[1] + (k[1] - a[1]) * u, a[2] + (k[2] - a[2]) * u]; } a = k; } return [a[1], a[2]]; };
const DPUT = (rows, x, y, c) => { rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); };
const DEMOS = {
  lava: { n: "Dung nham", len: 7.8, at: [1.2, 2.7], cap: ["Dung nham lúc sáng lúc tối, cứ một lát lại đổi", "Lúc đang sáng mà dẫm lên sẽ bị bỏng — cứ đứng bên mép đợi", "Tối xuống rồi, đi một mạch qua luôn"],
    step: T => { const hot = Math.floor(T / 2.6) % 2 === 0, R = ['##########', '....LL....', '....LL....', '....LL....', '##########'].map(r => hot ? r : r.replace(/L/g, 'l'));
      return { rows: R, hero: DKF([[0, 0.5, 2], [1.2, 3, 2], [2.8, 3, 2], [4.5, 7, 2], [5.1, 8.5, 2], [7.8, 8.5, 2]], T), wait: T > 1.2 && T < 2.8 }; } },
  web: { n: "Mạng nhện", len: 9, at: [2, 5.6], cap: ["Mạng nhện bịt kín lối đi, cố xông cũng không qua được", "Mang đuốc theo người rồi bước vào, lửa lướt qua là cháy thông", "Chưa có đuốc? Cứ làm theo nhiệm vụ để lấy nó trước"],
    step: T => { const R = ['##########', '.....W....', '.....W....', '.....W....', '##########']; if (T > 4.2) DPUT(R, 5, 2, T < 4.9 ? 'F' : '.');
      return { rows: R, hero: DKF([[0, 0.5, 2], [2, 4, 2], [4.2, 4, 2], [5.4, 5, 2], [7, 8.5, 2], [9, 8.5, 2]], T), torch: true }; } },
  bridge: { n: "Cầu tơ", len: 10, at: [1.5, 6.5], cap: ["Cầu tơ: ô nào dẫm qua thì ô đó sập", "Đừng quay đầu, đừng đi vòng — nhắm một đường rồi đi thẳng tới cuối", "Lưới đã sập, một lát sau sẽ kết lại"],
    step: T => { const R = ['##########', '...GGGG...', '...BBBB...', '...GGGG...', '##########'], h = DKF([[0, 0.5, 2], [1.5, 2, 2], [5.5, 7, 2], [6.5, 8.5, 2], [10, 8.5, 2]], T);
      for (let x = 3; x <= 6; x++) { const tx = 1.5 + (x - 2) * 0.8 + 0.5; if (T > tx && T < tx + 3.4) DPUT(R, x, 2, 'G'); }
      return { rows: R, hero: h }; } },
  swamp: { n: "Đầm độc", len: 9, at: [1.2, 6.8], cap: ["Nước độc sẽ làm mất khí huyết theo từng bước", "Vòng được thì cứ đi vòng", "Có vật khắc nó rồi thì cứ lội thẳng qua"],
    step: T => ({ rows: ['..........', '...SSSS...', '...SSSS...', '...SSSS...', '..........'], hero: DKF([[0, 0.5, 2], [1.2, 2, 2], [2.4, 2, 4], [5.6, 7, 4], [6.8, 7, 2], [7.6, 8.5, 2], [9, 8.5, 2]], T) }) },
  plate: { n: "Bàn đạp và hàng rào", len: 10, at: [3, 8], cap: ["Khi hàng rào chắn đường, gần đó chắc chắn có bàn đạp", "Dẫm lên: hàng rào đỏ chìm xuống, hàng rào xanh trồi lên", "Dẫm lần nữa là đổi lại — nghĩ kỹ thứ tự rồi hãy dẫm"],
    step: T => { const on = T > 3, R = ['######R###', '......R...', '..P...R...', '......R...', '######R###'].map(r => on ? r.replace(/R/g, 'r') : r); DPUT(R, 8, 4, on ? 'C' : 'c');
      return { rows: R, hero: DKF([[0, 0.5, 1], [1.4, 2, 1], [3, 2, 2], [4.2, 2, 2], [5.2, 3, 2], [8, 8.5, 2], [10, 8.5, 2]], T) }; } },
  watch: { n: "Tầm mắt kẻ tuần tra", len: 10.5, at: [1.6, 5], cap: ["Những ô màu vàng là chỗ hắn nhìn thấy", "Hắn sẽ quay đầu — đợi tầm mắt dời đi", "Tranh lúc hở mà đi qua; bị thấy sẽ bị đuổi về, hoặc phải đánh một trận"],
    step: T => { const down = T < 4.6 || T > 9.4, R = ['..........', '.....E....', '..........', '..........', '..........'];
      const cone = down ? [[5, 2], [5, 3], [5, 4], [4, 3], [6, 3], [4, 4], [6, 4]] : [[6, 1], [7, 1], [8, 1], [7, 0], [8, 0], [7, 2], [8, 2]];
      return { rows: R, cone, face: down ? 's' : 'e', hero: DKF([[0, 0.5, 3], [1.6, 3, 3], [5, 3, 3], [8, 8.5, 3], [10.5, 8.5, 3]], T), wait: T > 1.6 && T < 5 }; } },
  ice: { n: "Mặt băng", len: 9, at: [2.4, 4.8], cap: ["Mặt băng: dẫm lên là trượt một mạch tới cuối", "Đụng phải đá hoặc tường mới dừng lại được", "Xem kỹ muốn dừng ở đâu rồi mới chọn dẫm lên từ phía nào"],
    step: T => ({ rows: ['##########', '..IIIIII..', '..IIIIK...', '..IIIIII..', '##########'], hero: DKF([[0, 0.5, 2], [1.6, 1, 2], [2.4, 1, 2], [3.6, 5, 2], [4.8, 5, 2], [5.6, 5, 3], [6.4, 7, 3], [7.2, 8.5, 3], [9, 8.5, 3]], T) }) },
  box: { n: "Khối băng và mắt băng", len: 10, at: [3, 6.8], cap: ["Khối băng: đứng cạnh nó rồi chạm vào nó theo hướng muốn đẩy", "Đẩy nó lên mắt băng đang sáng, cửa băng sẽ mở", "Đẩy lệch cũng không sao — chạm vào tinh thể bên cạnh, khối băng về lại chỗ cũ"],
    step: T => { const bx = T < 3 ? 3 : Math.min(6, 3 + (T - 3) * 2.2), R = ['##########', '..........', '......O..D', '..........', '##########']; if (bx >= 6) DPUT(R, 9, 2, 'd');
      return { rows: R, box: [bx, 2], hero: DKF([[0, 0.5, 2], [2, 2, 2], [6, 2, 2], [6.8, 2, 3], [9, 8.5, 3], [10, 8.5, 3]], T) }; } },
  xintu: { n: "Tín đồ bị mê hoặc", len: 9, at: [2.6, 4.4], cap: ["Tín đồ bị mê hoặc sẽ đứng chắn ngay lối đi", "Lại gần rồi chạm vào người đó", "Có hương tỉnh hồn thì gọi tỉnh được; chưa có thì đánh ngất trước rồi qua"],
    step: T => { const R = ['#####.####', '#####.####', '.....V....', '#####.####', '#####.####']; if (T > 4.4) DPUT(R, 5, 2, 'v');
      return { rows: R, tap: T > 3.2 && T < 4.4 ? [5, 2] : null, hero: DKF([[0, 0.5, 2], [2.6, 4, 2], [5.2, 4, 2], [7.6, 8.5, 2], [9, 8.5, 2]], T) }; } },
  yy: { n: "Hai mặt Âm Dương", len: 10, at: [2, 5], cap: ["Có những con đường ở Mặt Dương thì bị đứt", "Chạm “Gương Âm Dương” soi sang Mặt Âm, đoạn đường đứt sẽ nối lại", "Qua rồi vẫn có thể soi về Mặt Dương"],
    step: T => { const yin = T > 4, R = ['....~~....', '....~~....', '....yy....', '....~~....', '....~~....'].map(r => yin ? r.replace(/y/g, 'Y') : r);
      return { rows: R, tint: yin, hero: DKF([[0, 0.5, 2], [2, 3, 2], [5, 3, 2], [7.5, 8.5, 2], [10, 8.5, 2]], T), wait: T > 2 && T < 4 }; } },
};
function demoDraw(key, g, W, H, t) {
  const D = DEMOS[key], T = (t / 1000) % D.len, st = D.step(T), ts = W / 10, fl = 0.5 + 0.5 * Math.sin(t / 240);
  g.clearRect(0, 0, W, H);
  const cone = new Set((st.cone || []).map(p => p[0] + ',' + p[1]));
  st.rows.forEach((row, y) => { for (let x = 0; x < 10; x++) { const c = row[x], px = x * ts, py = y * ts, cx = px + ts / 2, cy = py + ts / 2;
    g.fillStyle = (x + y) % 2 ? '#2b2420' : '#27211d'; g.fillRect(px, py, ts + 1, ts + 1);
    if (c === '#') { g.fillStyle = '#120e0c'; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = '#1e1815'; g.fillRect(px + 3, py + 3, ts - 8, ts / 2 - 4); }
    else if (c === 'L' || c === 'l') { g.fillStyle = c === 'L' ? `rgb(${210 + 40 * fl},${80 + 50 * fl},24)` : '#3a1a12'; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = c === 'L' ? 'rgba(255,235,130,.7)' : 'rgba(255,110,40,.3)'; g.fillRect(px + ts * 0.2, py + ts * (0.3 + 0.3 * ((x * 7 + y * 3) % 3) / 3), ts * 0.4, 3); }
    else if (c === 'W' || c === 'F') { if (c === 'F') { g.fillStyle = `rgba(255,${150 + 80 * fl},40,.9)`; g.beginPath(); g.arc(cx, cy, ts * 0.42, 0, 7); g.fill(); }
      else { g.strokeStyle = 'rgba(240,240,250,.85)'; g.lineWidth = 1; g.beginPath(); for (let a = 0; a < 8; a++) { g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a * 0.785) * ts * 0.55, cy + Math.sin(a * 0.785) * ts * 0.55); } for (let r = 1; r <= 2; r++) { g.moveTo(cx + r * ts / 5, cy); for (let a = 1; a <= 8; a++) g.lineTo(cx + Math.cos(a * 0.785) * r * ts / 5, cy + Math.sin(a * 0.785) * r * ts / 5); } g.stroke(); } }
    else if (c === 'G') { g.fillStyle = '#060404'; g.fillRect(px, py, ts + 1, ts + 1); }
    else if (c === 'B') { g.fillStyle = '#060404'; g.fillRect(px, py, ts + 1, ts + 1); g.strokeStyle = 'rgba(235,235,245,.9)'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= 3; i++) { g.moveTo(px, py + ts * (0.15 + i * 0.23)); g.lineTo(px + ts, py + ts * (0.15 + i * 0.23)); g.moveTo(px + ts * (0.1 + i * 0.27), py + ts * 0.1); g.lineTo(px + ts * (0.1 + i * 0.27), py + ts * 0.9); } g.stroke(); }
    else if (c === 'S') { g.fillStyle = '#2a3a1a'; g.fillRect(px, py, ts + 1, ts + 1); const b = (t / 900 + x * 0.37 + y * 0.61) % 1; g.fillStyle = `rgba(150,220,80,${0.6 * (1 - b)})`; g.beginPath(); g.arc(px + ts * 0.3 + (x * 5 % 9), py + ts * (0.8 - b * 0.4), 2 + b * 3, 0, 7); g.fill(); }
    else if (c === 'I') { g.fillStyle = '#9fd0e8'; g.fillRect(px, py, ts + 1, ts + 1); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + ts * 0.2, py + ts * 0.7); g.lineTo(px + ts * 0.6, py + ts * 0.3); g.stroke(); }
    else if (c === 'K') { g.fillStyle = '#9fd0e8'; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = '#4a4440'; g.beginPath(); g.arc(cx, cy + 2, ts * 0.36, 0, 7); g.fill(); g.fillStyle = '#6a625c'; g.beginPath(); g.arc(cx - 3, cy - 2, ts * 0.18, 0, 7); g.fill(); }
    else if (c === 'O') { g.fillStyle = `rgba(140,225,255,${0.3 + 0.3 * fl})`; g.beginPath(); g.ellipse(cx, cy, ts * 0.4, ts * 0.3, 0, 0, 7); g.fill(); }
    else if (c === 'D' || c === 'd') { g.fillStyle = c === 'D' ? '#7ab8d8' : '#1c2a30'; g.fillRect(px + 2, py, ts - 3, ts + 1); if (c === 'D') { g.fillStyle = '#e8f8ff'; g.fillRect(px + ts * 0.4, py + ts * 0.4, ts * 0.2, ts * 0.2); } }
    else if (c === 'P') { g.fillStyle = '#6a5a3a'; g.fillRect(px + 4, py + 4, ts - 8, ts - 8); g.fillStyle = `rgba(255,220,120,${0.4 + 0.4 * fl})`; g.fillRect(px + 8, py + 8, ts - 16, ts - 16); }
    else if ('RrCc'.includes(c)) { const up = c === 'R' || c === 'C', col = c === 'R' || c === 'r' ? '#c4291f' : '#2ab8b0'; g.fillStyle = col; g.globalAlpha = up ? 1 : 0.25;
      for (let i = 0; i < 3; i++) g.fillRect(px + ts * (0.18 + i * 0.27), py + (up ? 2 : ts * 0.7), ts * 0.14, up ? ts - 4 : ts * 0.25); g.globalAlpha = 1; }
    else if (c === '~') { g.fillStyle = st.tint ? '#2a1a4a' : '#16303a'; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px + ((t / 60 + y * 9) % ts), py + ts * 0.5, 6, 2); }
    else if (c === 'y' || c === 'Y') { g.fillStyle = st.tint ? '#2a1a4a' : '#16303a'; g.fillRect(px, py, ts + 1, ts + 1); g.fillStyle = c === 'Y' ? '#c8b8f0' : 'rgba(200,184,240,.22)'; g.fillRect(px, py + ts * 0.2, ts + 1, ts * 0.6); if (c === 'y') { g.strokeStyle = 'rgba(200,184,240,.6)'; g.setLineDash([3, 3]); g.strokeRect(px + 1, py + ts * 0.2, ts - 2, ts * 0.6); g.setLineDash([]); } }
    if (cone.has(x + ',' + y)) { g.fillStyle = `rgba(255,215,70,${0.32 + 0.12 * fl})`; g.fillRect(px, py, ts + 1, ts + 1); }
  } });
  if (st.tint) { g.fillStyle = 'rgba(110,70,200,.16)'; g.fillRect(0, 0, W, H); }
  const who = (x, y, col, hat) => { const cx = x * ts + ts / 2, cy = y * ts + ts / 2; g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, cy + ts * 0.36, ts * 0.28, ts * 0.1, 0, 0, 7); g.fill();
    g.fillStyle = col; g.fillRect(cx - ts * 0.17, cy - ts * 0.08, ts * 0.34, ts * 0.42); g.fillStyle = '#e8c8a0'; g.beginPath(); g.arc(cx, cy - ts * 0.2, ts * 0.15, 0, 7); g.fill(); if (hat) { g.fillStyle = hat; g.fillRect(cx - ts * 0.2, cy - ts * 0.36, ts * 0.4, ts * 0.09); } };
  st.rows.forEach((row, y) => { for (let x = 0; x < 10; x++) { const c = row[x];
    if (c === 'E') { who(x, y, '#d8d0c0', '#3a3a4a'); const d = { s: [0, 1], e: [1, 0], w: [-1, 0], n: [0, -1] }[st.face || 's']; g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(x * ts + ts / 2 + d[0] * ts * 0.34, y * ts + ts / 2 + d[1] * ts * 0.34, 3, 0, 7); g.fill(); }
    if (c === 'V') who(x, y, '#d0c8b8', null);
    if (c === 'v') { g.fillStyle = '#d0c8b8'; g.fillRect(x * ts + ts * 0.15, y * ts + ts * 0.62, ts * 0.7, ts * 0.2); g.fillStyle = '#c8c0ff'; g.font = `bold ${Math.round(ts * 0.36)}px sans-serif`; g.textAlign = 'center'; g.fillText('z', x * ts + ts * 0.75, y * ts + ts * 0.4 - 3 * fl); }
  } });
  if (st.box) { const px = st.box[0] * ts, py = st.box[1] * ts; g.fillStyle = '#bfe8ff'; g.fillRect(px + 3, py + 3, ts - 6, ts - 6); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.strokeRect(px + 3.5, py + 3.5, ts - 7, ts - 7); }
  const [hx, hy] = st.hero; who(hx, hy, '#8a1a12', '#1a1412');
  if (st.torch) { g.fillStyle = `rgba(255,${170 + 60 * fl},60,1)`; g.beginPath(); g.arc(hx * ts + ts * 0.82, hy * ts + ts * 0.3, 3.5 + fl, 0, 7); g.fill(); }
  if (st.wait) { g.fillStyle = '#ffe9c4'; g.font = `bold ${Math.round(ts * 0.42)}px sans-serif`; g.textAlign = 'center'; g.fillText('…', hx * ts + ts / 2, hy * ts - 2); }
  if (st.tap) { g.strokeStyle = '#ffe9c4'; g.lineWidth = 2; g.beginPath(); g.arc(st.tap[0] * ts + ts / 2, st.tap[1] * ts + ts / 2, ts * (0.3 + 0.25 * fl), 0, 7); g.stroke(); }
  return T < D.at[0] ? 0 : T < D.at[1] ? 1 : 2;
}
let DEMOK = null;
const demoModal = key => () => {
  const D = DEMOS[key];
  setTimeout(() => { const cv = document.querySelector('#democv'); if (!cv || cv._on) return; cv._on = 1; const g = cv.getContext('2d'), t0 = performance.now();
    const loop = () => { if (!cv.isConnected) return; const i = demoDraw(key, g, cv.width, cv.height, performance.now() - t0); const el = document.querySelector('#democap'); if (el && el.dataset.i !== String(i)) { el.dataset.i = i; el.textContent = D.cap[i]; } requestAnimationFrame(loop); }; loop(); }, 0);
  return `<div class="demo"><small>Cơ quan mới</small><h2 class="mh">${esc(D.n)}</h2><canvas id="democv" width="300" height="150"></canvas><p id="democap" class="demo-cap">${esc(D.cap[0])}</p>
    <div class="row" style="justify-content:center"><button class="btn" data-act="close">Đã hiểu</button></div></div>`;
};
// 眼前第一次出现某种机关：停下来放示范（每种只放一次）
function wDemoKey(ch) {
  const S = wstate(ch), m = wmap(ch), seen = SAVE.demos || {}, p = S.pos, T = { '%': 'web', '~': 'bridge', '*': 'lava', '"': 'swamp', '_': 'ice', '(': 'yy', ')': 'yy' };
  if (!seen.watch && wWatchActive(ch) && Object.keys(m.pts).some(c => m.def.pts[c].t === 'watch' && (!m.def.pts[c].when || m.def.pts[c].when(S)) && m.pts[c].some(q => Math.abs(q.x - p.x) <= 7 && Math.abs(q.y - p.y) <= 7 && wSeen(ch, q.x, q.y)))) return 'watch';
  if (!seen.box && wBoxes(ch).some(b => Math.abs(b.x - p.x) <= 4 && Math.abs(b.y - p.y) <= 4 && wSeen(ch, b.x, b.y))) return 'box';
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = p.x + dx, y = p.y + dy; if (!wSeen(ch, x, y)) continue;
    const c = wTile(m, x, y), P = m.def.pts[c]; let k = T[c] || (P && (P.t === 'plate' || P.t === 'xintu') ? P.t : null);
    if (k === 'web' && S.got[wgk(S.sc, x, y)]) k = null; if (k === 'xintu' && S.got[wgk(S.sc, x, y)]) k = null;
    if (k && !seen[k] && DEMOS[k]) return k; }
  return null;
}
function wDemoCheck() {
  if (VIEW !== 'world' || DLG || MODALFN || WKEY || !SAVE.run || !SAVE.run.world || isRift(SAVE.run)) return; const qz = document.querySelector('#quiz');   // 幻境里冰面不滑、岩浆毒沼不伤人：这些机关说明不弹（原来会弹，还会打断自动闯关、把剧情里该看的说明提前标成看过） if (qz && !qz.hidden) return;
  let k = null; try { k = wDemoKey(wch()); } catch (e) { return; } if (!k) return;
  SAVE.demos = SAVE.demos || {}; SAVE.demos[k] = 1; save();
  wStopAuto(); if (WALK) { clearTimeout(WALK.h); WALK = null; } WGOAL = null; SFX.play('click'); openModal(demoModal(k));
}
setInterval(wDemoCheck, 600);
// ================= 小游戏 =================
// 拉风箱：火候走到橘黄那一段时点「拉」，五下里中四下就成
function playMini(id, done) {
  if (id === 'bellows') return miniBellows(done);
  if (id === 'bellows2') return miniBellows(done, 0, { beats: ["Dài", "Ngắn", "Dài", "Ngắn", "Ngắn", "Dài"], need: 5, who: 'smith',
    win: [['smith', '……'], ['smith', "Nhát búa này, là thằng nhóc mày kéo bễ đấy à?"], ['tiedan', "Là bọn con cùng kéo!"]], again: [['smith', "Lửa yếu rồi! Tim phải rèn từng lớp một, vội cái gì! Làm lại!"]] });
  if (id === 'danlu') { const N = ["Lò phía đông", "Lò ở giữa", "Lò phía tây"]; return miniBellows(done, 0, { beats: ["Ngắn", "Dài", "Ngắn"], need: 3, who: 'zhen', title: "Nén lửa đan",
    hint: (b, h) => `${N[b] || ''}: lửa trong lò cứ phụt lên từng đợt — lúc ngọn lửa rơi vào đoạn vàng cam thì đập cửa lò!`, btn: b => `Đập cửa lò! (${N[b] || ''})`,
    win: [['narr', "Ba lò đan “phụt” một tiếng, cùng tắt ngấm."], ['narr', "Từ khe nắp lò bay ra từng sợi khói trắng, lượn quanh bạn một vòng rồi trôi xuống núi."], ['zhen', "…Đó là người trong trấn."]],
    again: [['zhen', "Lửa lại bùng lên rồi! Nhìn cho chuẩn hẵng đập!"]], giveup: [['zhen', "Tránh ra."], ['narr', "Cô Trân vung sống đao, “choang choang choang” ba nhát, đập móp cả ba cửa lò."], ['zhen', "Cũng được."]] }); }
  if (id === 'bellows3') return miniBellows(done, 0, { beats: ["Dài", "Dài", "Ngắn", "Dài", "Ngắn", "Dài"], need: 5, who: 'smith', title: "Ba người kéo bễ",
    hint: (b, h) => "Trương Đại Chùy cầm búa, Thiết Đản và bạn mỗi người một bên kéo bễ — lửa đến đoạn vàng cam thì cùng kéo!", btn: b => `Kéo! (${["Dài", "Dài", "Ngắn", "Dài", "Ngắn", "Dài"][b] || ''})`,
    win: [['smith', "…Lửa đẹp."], ['narr', "Cây đinh trên đe dần dần chuyển màu vàng đất, ánh lên."], ['tiedan', "Cha! Xong chưa?"], ['smith', "Còn khâu tôi nước cuối cùng. Trước khi trời sáng, nhất định rèn xong."]],
    again: [['smith', "Nóng vội rồi. Làm lại."], ['tiedan', "Anh, đếm theo em — dài, dài, ngắn!"]], giveup: [['smith', "…Được rồi."], ['narr', "Trương Đại Chùy một mình kéo bễ. Ngọn lửa vững như vẽ."], ['smith', "Hai đứa, đi ngủ. Phần còn lại để ta."]] });
  if (id === 'taoquan') return miniTaoquan(done);
  if (id === 'kanjia') return miniKanjia(done);
  if (id === 'tail') return miniTail(done);
  if (id === 'huaquan') return miniHuaquan(done);
  if (id === 'dice') return miniDice(done);
  if (id === 'fish') return miniFish(done);
  if (id === 'snowball') return miniSnowball(done);
  done && done();
}
// 计时小游戏的画面：只在状态变了才重建按钮，平时只挪指针。
// （原来每一帧都重建整块，鼠标按下和抬起落在两个不同的按钮上，电脑上经常点不中。）
function miniPaint(box, key, html, pos) {
  if (box._mk !== key || !box.querySelector('.mz-pt')) { box.innerHTML = html(); box._mk = key; }
  const pt = box.querySelector('.mz-pt'); if (pt) pt.style.left = pos * 100 + '%';
  box._pos = pos;
  if (!box.onpointerdown) box.onpointerdown = e => { if (e.target.closest('[data-mz]')) { box._pd = box._pos; box._pdt = performance.now(); } };
}
// 判定用「手指按下去那一刻」的位置，而不是松手那一刻——按得久一点也不吃亏
function miniPos(box) { const p = box._pd != null && performance.now() - box._pdt < 700 ? box._pd : box._pos; box._pd = null; return p; }
function miniBellows(done, tries = 0, O = {}) {
  const box = $('#quiz'); let beat = 0, hits = 0, t0 = performance.now(), raf = 0, zone = null;
  const BEATS = O.beats || ["Dài", "Dài", "Dài", "Ngắn", "Ngắn"], NEED = O.need || 4, WHO = O.who || 'tiedan';
  const newZone = () => { const w = BEATS[beat] === "Dài" ? 0.2 : 0.13; const c = 0.3 + Math.random() * 0.45; zone = [c - w / 2, c + w / 2]; t0 = performance.now(); };
  const draw = () => {
    const per = BEATS[beat] === "Dài" ? 1700 : 1150, k = ((performance.now() - t0) % (per * 2)) / per, pos = k <= 1 ? k : 2 - k;
    miniPaint(box, 'b' + beat + '|' + hits + '|' + zone[0], () => O.title ? `<div class="qz-box mini"><div class="qz-q"><b>${esc(O.title)}</b>${esc(O.hint(beat, hits))} (trúng ${hits} / ${beat})</div>
      <div class="mz-bar"><i class="mz-zone" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">${esc(O.btn(beat))}</button></div>`
      : `<div class="qz-box mini"><div class="qz-q"><b>${O.who ? "Cha con kéo bễ" : "Kéo bễ"}</b>${WHO === 'smith' ? "Trương Đại Chùy" : "Thiết Đản"}: “${esc(BEATS.map((b, i) => i < beat ? '✓' : b).join(' '))}” — lửa đến đoạn <span class="mz-or">vàng cam</span> thì chạm “Kéo”! (trúng ${hits} / ${beat})</div>
      <div class="mz-bar"><i class="mz-zone" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">Kéo! (${BEATS[beat]})</button></div>`, pos);
    raf = requestAnimationFrame(draw);
  };
  box.hidden = false; newZone(); draw();
  box.onclick = e => {
    if (!e.target.closest('[data-mz]')) return; e.stopPropagation();
    const mp = miniPos(box), ok = mp >= zone[0] && mp <= zone[1]; if (ok) hits++; SFX.play(ok ? 'hit' : 'fail'); beat++;
    if (beat < BEATS.length) { newZone(); return; }
    cancelAnimationFrame(raf); box.hidden = true; box.onclick = null;
    if (hits >= NEED) { SFX.play('legend'); playDialog(O.win || [['tiedan', hits === 5 ? "Năm lần trúng cả năm! Cha em kéo còn không bằng anh!" : "Xong rồi! Lửa vừa khéo!"], ['narr', "Khối sắt nung đỏ rực, sáng trong."]], null, done); }
    else if (tries >= 2 && O.giveup) playDialog(O.giveup, null, done);
    else if (tries >= 2) playDialog([[WHO, "…Thôi thôi, cậu nghỉ đi."], ['narr', WHO === 'smith' ? "Trương Đại Chùy cầm lấy bễ tự kéo. Lửa vừa khéo." : "Thiết Đản cầm lấy bễ tự kéo, miệng cứ đếm “dài, dài, ngắn”."], [WHO, "Lần sau tập tiếp."]], null, done);
    else playDialog(O.again || [['tiedan', hits >= 2 ? "Suýt nữa! Lửa hơi yếu… làm lại một lần nữa!" : "Ê ê ê, lửa sắp tắt rồi! Anh đang quạt mát đấy à! Làm lại!"]], null, () => miniBellows(done, tries + 1, O));
  };
}
// 套圈：圈在晃，看准木头老虎的位置扔；三个圈中两个
function miniTaoquan(done, tries = 0) {
  const box = $('#quiz'); let n = 0, hits = 0, raf = 0, t0 = performance.now();
  const zone = () => { const w = 0.16 - n * 0.025, c = [0.62, 0.38, 0.7][n]; return [c - w / 2, c + w / 2]; };
  const draw = () => { const per = 1050 - n * 150, k = ((performance.now() - t0) % (per * 2)) / per, pos = k <= 1 ? k : 2 - k, z = zone();
    miniPaint(box, 't' + n + '|' + hits, () => `<div class="qz-box mini"><div class="qz-q"><b>Ném vòng · vòng thứ ${n + 1} (trúng ${hits})</b>Tiểu Hổ: “Con hổ gỗ kia! Đúng con đó!” — tay đung đưa tới ngay trên <span class="mz-or">con hổ</span> thì chạm “Ném”!</div>
      <div class="mz-bar"><i class="mz-zone" style="left:${z[0] * 100}%;width:${(z[1] - z[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">Ném!</button></div>`, pos); raf = requestAnimationFrame(draw); };
  box.hidden = false; draw();
  box.onclick = e => { if (!e.target.closest('[data-mz]')) return; e.stopPropagation();
    const z = zone(), mp = miniPos(box), ok = mp >= z[0] && mp <= z[1]; if (ok) hits++; SFX.play(ok ? 'hit' : 'fail'); n++; t0 = performance.now();
    if (n < 3) return;
    cancelAnimationFrame(raf); box.hidden = true; box.onclick = null;
    const S = wstate(qch()); S.flags.taoquanWin = hits >= 2 ? 1 : 0;
    if (hits >= 2) { SFX.play('rare'); playDialog([['narr', "Chiếc vòng “bộp” một tiếng lọt trúng con hổ gỗ."], ['xiaohu', "Trúng rồi! Trúng rồi! Em biết ngay anh làm được mà!"], ['narr', "Tiểu Hổ ôm con hổ gỗ chạy khắp đám đông, gặp ai cũng khoe là anh ném trúng."]], null, done); }
    else if (tries < 1) playDialog([['xiaohu', "Ối! Chỉ thiếu chút xíu!"], ['xiaohu', "…Ném thêm lần nữa được không? Em còn ba đồng nè."]], null, () => miniTaoquan(done, tries + 1));
    else playDialog([['narr', "Cả ba chiếc vòng đều rơi cạnh con hổ."], ['xiaohu', "…Không sao!"], ['narr', "Ông chủ sạp thấy Tiểu Hổ mắt rưng rưng, dúi con hổ gỗ vào tay nó: “Cầm lấy, thấy anh mày ném hăng thế.”"]], null, done);
  };
}
// 讨价还价：康总管的小动作透露他吃哪一套
const KJ_OPT = ["Khen bánh trung thu của ông", "Quay người bỏ đi", "Móc ra mấy đồng xu"], KJ_TELL = ["Ông lau mồ hôi, lầm bầm “hôm nay chưa bán được cái nào”", "Ông lén liếc sạp bánh trung thu đối diện", "Ông nhìn chằm chằm túi tiền của bạn, yết hầu khẽ động"];
function miniKanjia(done) {
  const box = $('#quiz'); let round = 0, cut = 0; const P = ["Một lượng", "Năm chỉ", "Một chỉ", "Năm văn"];
  const ask = () => { const want = Math.floor(Math.random() * 3), tell = Math.random() < 0.8 ? want : (want + 1) % 3;
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>Mặc cả · lượt ${round + 1} (giờ ${P[cut]} một cái)</b>Quản gia Khang: “Bánh trung thu ngũ nhân bí truyền của Túy Tiên Lâu!”<br>${KJ_TELL[tell]}.</div>${KJ_OPT.map((n, i) => `<button class="qz-opt" data-kj="${i}">${n}</button>`).join('')}</div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-kj]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const my = +b.dataset.kj, ok = my === want; if (ok) cut++; round++; SFX.play(ok ? 'rare' : 'fail');
      const L = ok ? [[['kang', "Được được được, nể tình hai ta…"], ['kang', "…Một cái bánh? Cậu muốn ăn, hay muốn lấy mạng tôi?"], ['kang', "…Được!"]][my % 3]] : [['kang', ["Khen? Khen cũng vô ích! Không bớt một văn nào!", "Đi thì đi! …Cậu, cậu đi thật à? …Không tiễn!", "Mấy đồng xu này, mua vụn bánh còn chẳng đủ!"][my]]];
      playDialog(L, null, () => round < 3 ? ask() : (() => { const S = wstate(qch()); S.flags.kanjia = cut;
        playDialog(cut >= 3 ? [['kang', "…Năm văn. Năm văn! Cầm đi cầm đi!"], ['kang', "Chuyện này đừng để đám tiểu nhị biết."], ['narr', "Ông còn lén dúi thêm cho bạn một cái."]]
          : cut >= 1 ? [['kang', `${P[cut]}, không bớt được nữa!`], ['narr', "Bạn trả tiền. …Ngon thật, trong năm loại nhân có một loại là hạt thông Rừng Hắc Phong."]]
          : [['kang', "Một lượng! Già trẻ không lừa!"], ['narr', "Bạn nghiến răng mua một cái. …Ngon thật."]], null, done); })()); };
  };
  ask();
}
// 跟踪小偷：他要回头的时候会有小动作。该躲就躲，该跟就跟；被看见或跟丢了就重来
const TAIL_TELL = [["Hắn không ngoảnh lại, bước càng lúc càng nhanh", 0], ["Hắn lách vào đám đông, nhìn quanh tìm túi tiền", 0], ["Hắn chậm bước lại, cổ khẽ động", 1], ["Hắn dừng trước một sạp đèn lồng, tay sờ ra sau lưng", 1]];
function miniTail(done, tries = 0) {
  const box = $('#quiz'); let step = 0, gap = 2;
  const ask = () => { const look = Math.random() < 0.4, pool = TAIL_TELL.filter(t => t[1] === (look ? 1 : 0)), honest = Math.random() < 0.85, T = honest ? RNG.pick(pool) : RNG.pick(TAIL_TELL.filter(t => t[1] !== (look ? 1 : 0)));
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>Bám đuôi · ${'●'.repeat(step)}${'○'.repeat(6 - step)} Khoảng cách: ${["Sát nút", "Không xa", "Hơi xa", "Sắp mất dấu"][Math.min(3, gap - 1)] || "Sát nút"}</b>${T[0]}.</div>
      <button class="qz-opt" data-tl="0">Bám theo</button><button class="qz-opt" data-tl="1">Nấp vào đám đông</button></div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-tl]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const move = b.dataset.tl === '0';
      if (move && look && tries >= 2) { SFX.play('fail'); return playDialog([['narr', "Hắn đột ngột quay đầu — co giò bỏ chạy."], ['narr', "Vừa chạy ra đầu ngõ đã đâm sầm vào cô Trân."], ['zhen', "Chạy à? Chạy tiếp đi."]], null, done); }
      if (move && look) { SFX.play('fail'); return playDialog([['narr', "Hắn đột ngột quay đầu — chạm ngay ánh mắt bạn."], ['narr', "Tên trộm co giò bỏ chạy, chớp mắt đã chui vào ngõ."], ['zhen', tries ? "…Lại bị hắn phát hiện. Tôi chặn đầu bên kia, anh bám thêm lần nữa." : "Đồ ngốc. Tôi chặn đầu bên kia, anh bám thêm lần nữa."]], null, () => miniTail(done, tries + 1)); }
      if (move) { step++; gap = Math.max(1, gap - 1); SFX.play('step'); }
      else if (look) { SFX.play('rare'); }
      else { gap++; }
      if (gap >= 5 && tries >= 2) return playDialog([['narr', "Đông người quá, chớp mắt hắn đã biến mất."], ['narr', "…Đầu ngõ bên kia vọng lại một tiếng kêu thảm thiết."], ['zhen', "(Xách cổ áo tên trộm bước ra) Mất dấu à? Không sao, tôi chặn rồi."]], null, done);
      if (gap >= 5) return playDialog([['narr', "Đông người quá, chớp mắt hắn đã biến mất."], ['zhen', "Mất dấu? …Hắn chạy không xa đâu, làm lại."]], null, () => miniTail(done, tries + 1));
      if (step >= 6) { SFX.play('legend'); return playDialog([['narr', "Tên trộm rẽ vào một ngõ cụt, ngồi xổm đếm tiền đồng trong túi."], ['zhen', "Đếm xong chưa?"], ['narr', "Cô Trân bước ra từ đầu ngõ bên kia."]], null, done); }
      playDialog([['narr', move ? "Bạn bám theo không xa không gần." : look ? "Bạn lách vào đám đông. Hắn ngoảnh lại nhìn, chẳng phát hiện gì." : "Bạn né một chút — hắn không ngoảnh lại, đi xa hơn một đoạn."]], null, ask); };
  };
  ask();
}
// 押大小：赌坊鬼摇完骰盅，左手小指会敲桌子——敲两下开大，敲一下开小（它偶尔故意敲错）。三局两胜；白天在赌坊捡到灌铅骰子的，可以当场揭穿
const DICE_BIG = ["Ngón út tay trái của nó gõ “cộc, cộc” hai cái lên bàn", "Ống xúc xắc vừa dừng, ngón út nó điểm hai cái lên mặt bàn", "Nó ho một tiếng, ngón út “cộc cộc” hai cái", "Nó cười hì hì nhìn bạn, ngón út gõ hai cái lên mép bàn"];
const DICE_SMALL = ["Ngón út tay trái của nó gõ “cộc” một cái", "Ống xúc xắc vừa dừng, ngón út nó khẽ điểm một cái lên bàn", "Nó ngáp một cái, ngón út “cộc” một tiếng", "Nó nheo mắt nhìn bạn, ngón út gõ một cái lên mép bàn"];
function miniDice(done, tries = 0) {
  const box = $('#quiz'), ev = !!wkeys().guanqian; let me = 0, him = 0, round = 0;
  const fin = win => { const S = wstate(qch()); S.flags.diceWin = win ? 1 : 0; done && done(); };
  const ask = () => {
    const big = Math.random() < 0.5, honest = Math.random() < (round === 2 ? 0.7 : 0.82), tell = RNG.pick(big === honest ? DICE_BIG : DICE_SMALL);
    const opts = [["Đặt Tài", 'b'], ["Đặt Xỉu", 's']]; if (ev && (round > 0 || tries > 0)) opts.push(["“Xúc xắc của ngươi, đổ chì rồi.”", 'x']);
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>Tài xỉu · ván ${round + 1} (bạn ${me} : ${him} nó)</b>Ống xúc xắc lắc “lốc cốc lốc cốc” một hồi, rồi “cạch” một tiếng úp xuống bàn.<br>${tell}.</div>${opts.map(o => `<button class="qz-opt" data-dc="${o[1]}">${o[0]}</button>`).join('')}</div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-dc]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const k = b.dataset.dc;
      if (k === 'x') { SFX.play('legend'); return playDialog([['narr', "Bạn đập “bộp” viên xúc xắc nặng trịch xuống bàn."], ['dufang', '……'], ['narr', "Sòng bạc bỗng im phăng phắc. Mấy chục đôi mắt ma đồng loạt nhìn chằm chằm vào con ma sòng bạc."], ['dufang', "Hay, hay, hay con mắt!"], ['dufang', "Cái bóng… cái bóng mang đi! Chuyện này ra khỏi cửa rồi đừng ai nhắc nữa!"]], null, () => fin(true)); }
      const ok = (k === 'b') === big; if (ok) me++; else him++; round++; SFX.play(ok ? 'rare' : 'fail');
      const L = [['narr', `Mở ống — ${big ? "Bốn, năm, sáu, Tài!" : "Một, hai, ba, Xỉu!"}`], ok ? ['dufang', ["…Coi như ngươi gặp may.", "Ồ, cũng có nghề đấy.", "…Lại nào!"][Math.min(2, me - 1 + him)]] : ['dufang', ["Ha ha ha!", "Hề hề, xúc xắc chợ ma lạ người.", "Nhường cho nhé~"][Math.min(2, him - 1 + me)]]];
      if (me >= 2) return playDialog(L.concat([['dufang', '……'], ['dufang', "Mười năm rồi, lần đầu có người sống thắng ta."], ['dufang', "Cái bóng, mang đi."]]), null, () => fin(true));
      if (him >= 2) {
        if (tries >= 1) return playDialog(L.concat([['kangx', "Lại, lại nữa! Ta đặt… ta đặt thịt của ta! Ta nhiều thịt lắm!"], ['dufang', '……'], ['dufang', "Thôi thôi."], ['dufang', "Cái bóng của ngươi gầy thế này, ta nuôi nó còn phải bù thêm hương khói."], ['dufang', "Mang đi mang đi! Nhìn thấy là bực!"]]), null, () => fin(true));
        return playDialog(L.concat([['kangx', "Không sao không sao! Lại một ván nữa!"], ['kangx', "(Nói nhỏ) Huynh đệ, tôi thua ở đây mười năm, chỉ nhìn ra một chuyện: nó gõ hai cái, phần nhiều ra Tài; gõ một cái, phần nhiều ra Xỉu."], ['kangx', "“Phần nhiều” thôi nhé! Nó cũng biết lừa đấy!"]]), null, () => miniDice(done, tries + 1));
      }
      playDialog(L, null, ask); };
  };
  playDialog(tries ? [['dufang', "Lại thì lại!"]] : [['dufang', "Luật đơn giản: đặt Tài hay Xỉu, ba ván thắng hai."], ['kangx', "(Nói nhỏ) Nó gõ bàn… cậu nhìn ngón út nó kìa…"]], null, ask);
}
// 冰钓：浮漂在冰窟窿里上下晃，鱼一咬钩（浮漂沉到蓝色那段）就点「提竿」。五下里提中三下，鱼就上来了
function miniFish(done) {
  const box = $('#quiz'); let tries = 0, hits = 0, raf = 0, t0 = performance.now(), zone = null, spd = 1;
  const newZone = () => { const w = 0.16 - hits * 0.02, c = 0.25 + Math.random() * 0.5; zone = [c - w / 2, c + w / 2]; spd = 0.9 + Math.random() * 0.7 + hits * 0.2; t0 = performance.now(); };
  const draw = () => { const t = (performance.now() - t0) / 1000, pos = 0.5 + 0.45 * Math.sin(t * 2.4 * spd) * Math.cos(t * 1.3 * spd + 0.7);
    miniPaint(box, 'f' + tries + '|' + hits + '|' + zone[0], () => `<div class="qz-box mini"><div class="qz-q"><b>Câu cá băng (cần thứ ${tries + 1} · trúng ${hits}/3)</b>Phao vừa chìm đến đoạn <span class="mz-bl">màu xanh</span> thì giật cần!</div>
      <div class="mz-bar"><i class="mz-zone bl" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">Giật cần!</button></div>`, pos); raf = requestAnimationFrame(draw); };
  const fin = () => { cancelAnimationFrame(raf); box.hidden = true; box.onclick = null; const msg = (W_MINI_RW.fish || (() => ''))(wch(), hits >= 3 ? 1 : 0);
    playDialog(hits >= 3 ? [['narr', "Cần câu trĩu xuống — một con cá băng quẫy đuôi bị bạn lôi khỏi lỗ băng!"], ...(msg ? [['narr', msg]] : [])] : [['narr', "Dây câu chùng xuống, cá chạy mất."], ['narr', "Lỗ băng sủi lên một cái bong bóng, như đang cười bạn."]], null, done); };
  box.hidden = false; newZone(); draw();
  box.onclick = e => { if (!e.target.closest('[data-mz]')) return; e.stopPropagation();
    const mp = miniPos(box), ok = mp >= zone[0] && mp <= zone[1]; if (ok) hits++; tries++; SFX.play(ok ? 'hit' : 'fail');
    if (hits >= 3 || tries >= 5) return fin(); newZone(); };
}
// 打雪仗：小孩从三道雪墙后面探头，看准了砸；十次里砸中六次就赢
function miniSnowball(done) {
  const box = $('#quiz'); let n = 0, hits = 0, at = -1, tm = 0;
  const KID = SPR.img('villager', 40, { B: '#c4291f' });
  const show = () => { clearTimeout(tm); if (n >= 10) return fin(); at = Math.floor(Math.random() * 3); n++;
    box.innerHTML = `<div class="qz-box mini"><div class="qz-q"><b>Ném tuyết (${n}/10 · trúng ${hits})</b>Đứa nào thò đầu ra thì ném đứa đó!</div>
      <div class="snowrow">${[0, 1, 2].map(i => `<button class="snowwall ${i === at ? 'up' : ''}" data-sb="${i}">${i === at ? KID : ''}<i></i></button>`).join('')}</div></div>`;
    tm = setTimeout(() => { at = -1; SFX.play('fail'); show(); }, Math.max(520, 950 - n * 35)); };
  const fin = () => { clearTimeout(tm); box.hidden = true; box.onclick = null; const msg = (W_MINI_RW.snowball || (() => ''))(wch(), hits >= 6 ? 1 : 0);
    playDialog(hits >= 6 ? [['narr', `Bạn ném trúng ${hits} đứa. Bọn trẻ la oai oái giơ tay đầu hàng.`], ...(msg ? [['narr', msg]] : [])] : [['narr', `Bạn chỉ ném trúng ${hits} đứa, còn mình thì dính đầy tuyết.`], ['narr', "Bọn trẻ cười lăn lộn."]], null, done); };
  box.hidden = false;
  box.onclick = e => { const b = e.target.closest('[data-sb]'); if (!b) return; e.stopPropagation(); if (+b.dataset.sb === at) { hits++; SFX.play('hit'); at = -1; show(); } else SFX.play('step'); };
  show();
}
// 划拳：雷老虎出拳前有小动作，看出来就能赢；三局两胜
const HQ = ["Búa", "Kéo", "Bao"], HQ_TELL = ["Nắm đấm hắn siết đến trắng cả khớp ngón tay", "Hắn gõ hai ngón tay “cộc cộc” lên bàn", "Hắn xòe bàn tay chùi chùi lên đùi"];
function miniHuaquan(done) {
  const box = $('#quiz'); let me = 0, him = 0, round = 0;
  const ask = () => {
    const pick = Math.floor(Math.random() * 3), truthful = Math.random() < 0.75, tell = truthful ? pick : (pick + 1 + Math.floor(Math.random() * 2)) % 3;
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>Oẳn tù tì · ván ${round + 1} (bạn ${me} : ${him} Lôi Lão Hổ)</b>Lôi Lão Hổ: “Huynh đệ tốt nào —”<br>${HQ_TELL[tell]}.</div>${HQ.map((n, i) => `<button class="qz-opt" data-hq="${i}">Ra ${n}</button>`).join('')}</div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-hq]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const my = +b.dataset.hq, r = (pick - my + 3) % 3;   // 1：我赢（我石头他剪刀）
      round++; let L;
      if (r === 0) L = [['narr', `Bạn ra ${HQ[my]}, hắn cũng ra ${HQ[pick]}.`], ['lei', "Hòa! Lại nào!"]];
      else if (r === 1) { me++; L = [['narr', `Bạn ra ${HQ[my]}, hắn ra ${HQ[pick]}.`], ['lei', RNG.pick(["…Lão tử uống!", "Mẹ nó! Uống thì uống!", "Thằng nhóc mày nhìn trộm tay lão tử phải không?!"])], ['narr', "Lôi Lão Hổ ngửa cổ, cạn một bát lớn."]]; }
      else { him++; L = [['narr', `Bạn ra ${HQ[my]}, hắn ra ${HQ[pick]}.`], ['lei', RNG.pick(["Ha ha ha! Uống!", "Non! Non lắm! Uống!", "Lão tử áp tiêu hai mươi năm, oẳn tù tì chưa thua bao giờ! Uống!"])], ['narr', "Bạn uống một bát lớn, cổ họng nóng bốc khói."]]; }
      SFX.play(r === 1 ? 'rare' : r === 2 ? 'fail' : 'page');
      playDialog(L, null, () => {
        if (me < 2 && him < 2 && round < 5) return ask();
        const S = wstate(qch()); S.flags.hqWin = me > him ? 1 : 0;
        playDialog(me > him ? [['lei', "…Phục! Lão tử phục rồi!"], ['lei', "Nhóc con, sau này rượu của tiêu cục cứ uống thoải mái! Chuyện của mày, là chuyện của lão tử!"], ['narr', "Lôi Lão Hổ vỗ vai bạn, vỗ đến suýt ngã sấp."]]
          : [['lei', "Ha ha ha! Nhóc con, tửu lượng còn phải luyện!"], ['narr', "Đèn lồng trước mắt bạn bắt đầu quay vòng. Lôi Lão Hổ đỡ lấy bạn, nhe răng cười."], ['lei', "Có điều — dám oẳn tù tì với lão tử, cả trấn chẳng được mấy người."]], null, done);
      });
    };
  };
  ask();
}
// 美食图谱
// ---------------- 摊子：买、当、开光 ----------------
let SHOPID = null, SHOPTAB = 'buy', SHOPMSG = '', SHOPSEL = -1;
// 悬赏榜
let BTYMSG = '';
const boardModal = () => {
  const ch = wch(), L = wBtyList(ch), B = wBty(ch), S = wstate(ch);
  const card = D => { const T = BTY_TIER[D.tier], on = !!B.on[D.id], done = D.tier === 3 && B.done[D.id], F = CHAPTERS[ch - 1].mons[D.mon] || {};
    const rw = D.tier === 1 ? "Trang bị hiếm" : D.tier === 2 ? "Hiếm hoặc bộ, có thể có thuộc tính đặc biệt" : "Thần binh, có thuộc tính đặc biệt";
    return `<div class="btyc t${D.tier} ${on ? 'on' : ''} ${done ? 'done' : ''}"><div class="btyh">${SPR.img(F.spr || 'skeleton', 40, D.pal || F.pal)}<div><span class="btyt">${T.n}</span><b>${esc(D.n)}</b><small>${esc(wBtyWhere(ch, D))} · cấp ${wBtyLv(ch) + T.lv}${(D.spd || 1) > 1.05 ? " · rất nhanh" : ''}</small></div></div>
      <p>${esc(D.lore)}</p><div class="btyr"><span>${featureOn('bounty') ? `Tiền thưởng ${T.shang}` : `Bạc ${T.shang * 10}`} · ${rw}</span>${done ? "<em class=\"ok\">Đã đền tội</em>" : on ? "<em>Đang truy bắt</em>" : `<button class="btn sm" ${B.took < BTY_PER_REST ? '' : 'disabled'} data-act="btyacc" data-arg="${D.id}">Nhận</button>`}</div></div>`; };
  const t3 = L.filter(D => D.tier === 3), rest = L.filter(D => D.tier < 3);
  return `<div class="shoph">${SPR.img('scroll', 48)}<div><h2 class="mh">Bảng Truy Nã · ${esc(WMAPS[ch].n)}</h2><p class="sub">“${featureOn('bounty') ? "Tiền thưởng lĩnh ở chỗ Lôi Lão Hổ" : "Thanh toán tiền thưởng tại chỗ"}. Mua bán lấy mạng đổi tiền, tự cân nhắc.”</p></div></div>
    <div class="row wallet">${featureOn('bounty') ? `<span class="pill gold">Tiền thưởng ${SAVE.shang || 0}</span>` : ''}<span class="pill">Lượt này còn nhận được ${Math.max(0, BTY_PER_REST - B.took)} tờ</span>${featureOn('bounty') ? "<button class=\"btn sm ghost\" data-act=\"btyshop\">Đổi tiền thưởng</button>" : ''}</div>
    ${BTYMSG ? `<p class="evres shopmsg">${BTYMSG}</p>` : ''}
    ${L.length ? `<div class="btyl">${t3.map(card).join('')}${rest.map(card).join('')}</div>` : "<p class=\"sub\">Yêu vật vùng này chưa ai thấy — cứ đi xem đã, nơi đã tới mới dán lệnh truy nã.</p>"}
    <p class="help-p">Hạng Bính, hạng Ất cứ mỗi lần nghỉ bên lửa trại lại đổi một lượt, mỗi lượt nhận tối đa ba tờ. Hạng Giáp · Đầu sỏ chỉ có một tờ, hạ rồi là hết. Kẻ bị truy nã hung hãn hơn tinh anh ven đường nhiều; có kẻ biết chạy, có kẻ hóa bóng ma, có kẻ kết kén — đọc kỹ trên bảng rồi hẵng đi.</p>
    <button class="btn ghost" data-act="close">Đi đây</button>`;
};
const shopEntryName = e => e.k === 'item' ? `<span class="r-${e.it.rarity}">${esc(itemTitle(e.it))}</span> <small>${SLOT_NAME[e.it.slot]}</small>`
  : e.k === 'gem' ? `${gemName(e.key)} <small>${gemDesc(e.key)}</small>` : e.k === 'exchange' ? `${e.gold} lượng → ${e.mb} minh tệ` : esc(e.n || '');
const shopEntryIcon = e => e.k === 'item' ? SPR.item(e.it, 28) : e.k === 'gem' ? gemImg(e.key, 28) : SPR.img(e.spr || (e.k === 'food' ? 'cauldron' : e.k === 'gamble' || e.k === 'blind' ? 'chest' : e.k === 'exchange' ? 'gold' : 'scroll'), 28, e.pal);
// 在哪一章的铺子里：出门在外就是那一章；在营地页（雷老虎的赏银柜）按通关到的章算
const shopCh = () => SAVE.run && SAVE.run.world && !isRift(SAVE.run) ? SAVE.run.chapter : Math.max(1, Math.min(10, storyCleared('normal') || 1));
const shopModal = () => {
  const ch = shopCh(), SH = W_SHOPS[SHOPID], st = wShopStock(ch, SHOPID), cur = wCurName(SH.cur), run = SAVE.run, cls = run ? run.cls : SAVE.cls, S = wstate(ch);
  const Sp = SPEAKERS[SH.who] || { spr: 'merchant' };
  const tabs = [['buy', SH.buyName || "Mua"], ...(SH.sell ? [['sell', SH.sellName || "Cầm"]] : []), ...(SH.reroll ? [['roll', "Khai quang"]] : [])];
  let body = '';
  if (SHOPTAB === 'buy') body = st.items.map((e, i) => { if (e.show && !e.show(S)) return ''; const can = !e.sold && (!e.need || e.need(S)) && (e.k === 'exchange' ? SAVE.gold >= e.gold : wCurN(SH.cur) >= e.price);
    return `<div class="irow ${e.k === 'item' ? ancCls(e.it) : ''}">${shopEntryIcon(e)}<button class="linkish nm" data-act="shopsel" data-arg="${i}">${shopEntryName(e)}${e.d ? `<small class="sd">${esc(e.d)}</small>` : ''}</button>
      ${e.sold ? "<span class=\"delta no\">Đã bán</span>" : `<button class="btn sm" ${can ? '' : 'disabled'} data-act="shopbuy" data-arg="${i}">${e.k === 'exchange' ? "Đổi" : e.price + ' ' + cur}</button>`}</div>
      ${SHOPSEL === i && e.k === 'item' ? `<div class="shopcard">${itemCard(e.it, cls)}<p class="sub">Mặc vào lực chiến ${deltaOf(e.it, cls)}</p></div>` : ''}`; }).join('');
  else if (SHOPTAB === 'sell') { const L = SAVE.stash.slice().sort((a, b) => sellPrice(b) - sellPrice(a));
    body = L.length ? L.map(it => `<div class="irow ${ancCls(it)}">${SPR.item(it, 28)}<button class="linkish nm" data-act="item" data-arg="${it.id}"><span class="r-${it.rarity}">${esc(itemTitle(it))}</span> <small>${SLOT_NAME[it.slot]}</small></button><button class="btn sm ghost" data-act="shopsell" data-arg="${it.id}">Cầm ${wShopSellPrice(SH, it)} ${cur}</button></div>`).join('') : "<p class=\"sub\">Túi đồ trống trơn. Đồ đang mặc thì không cầm được.</p>"; }
  else { const own = [...Object.values(SAVE.chars[cls].eq).filter(Boolean), ...SAVE.stash].filter(it => it.aff && it.aff.length);
    body = `<p class="help-p">Khai quang: tẩy ngẫu nhiên một thuộc tính, đổi thành thuộc tính mới — tốt xấu tùy duyên. Mỗi lần ${SH.reroll} ${cur}.</p>` + own.map(it => `<div class="irow ${ancCls(it)}">${SPR.item(it, 28)}<button class="linkish nm" data-act="item" data-arg="${it.id}"><span class="r-${it.rarity}">${esc(itemTitle(it))}</span><small class="sd">${it.aff.map(([k, v]) => fmtStat(k, Math.round(v * itemMult(it)))).join(", ")}</small></button><button class="btn sm" ${wCurN(SH.cur) >= SH.reroll ? '' : 'disabled'} data-act="shoproll" data-arg="${it.id}">Khai quang</button></div>`).join(''); }
  return `<div class="shoph">${unitIcon(Sp.spr, 56, Sp.pal, '', 'stand')}<div><h2 class="mh">${esc(SH.n)}</h2><p class="sub">${esc(SH.blurb || '')}</p></div></div>
    <div class="row wallet"><span class="pill gold">Bạc ${SAVE.gold}</span>${SH.cur === 'shang' ? `<span class="pill gold">Tiền thưởng ${SAVE.shang || 0}</span>` : ''}${SH.cur === 'mb' || SAVE.mb ? `<span class="pill mb">Minh tệ ${wMb()}</span>` : ''}${run && run.tishen ? `<span class="pill">Hình nhân ${run.tishen}</span>` : ''}</div>
    ${tabs.length > 1 ? `<div class="row tabs">${tabs.map(([k, n]) => `<button class="btn sm ${SHOPTAB === k ? '' : 'ghost'}" data-act="shoptab" data-arg="${k}">${n}</button>`).join('')}</div>` : ''}
    ${SHOPMSG ? `<p class="evres shopmsg">${SHOPMSG}</p>` : ''}
    <div class="shop">${body}</div>${SH.note ? `<p class="help-p">${esc(SH.note)}</p>` : ''}
    <button class="btn ghost" data-act="close">Đi đây</button>`;
};
// 鬼市里来来往往的鬼（只是热闹，不挡路）
const CROWD = {};
function wCrowd(g, ch, m, S, ox, oy, ts, t, spr) {
  const C = m.def.crowd; if (!C || (C.when && !C.when(S))) return;
  const key = ch + ':' + S.sc; let L = CROWD[key];
  const ok = (x, y) => { const c = wTile(m, x, y); return c && !W_BLOCK.includes(c) && !m.def.pts[c] && c !== ':'; };
  const pick = () => { for (let k = 0; k < 30; k++) { const x = C.area[0] + Math.floor(Math.random() * (C.area[2] - C.area[0] + 1)), y = C.area[1] + Math.floor(Math.random() * (C.area[3] - C.area[1] + 1)); if (ok(x, y)) return { x, y }; } return { x: C.area[0], y: C.area[1] }; };
  if (!L) { L = CROWD[key] = Array.from({ length: C.n }, (_, i) => { const p = pick(), q = pick(), D = C.sprs[i % C.sprs.length]; return { x: p.x, y: p.y, tx: q.x, ty: q.y, v: 0.6 + Math.random() * 0.8, spr: D[0], pal: D[1], say: '', sayT: 0, ph: Math.random() * 6 }; }); }
  const dt = 1 / 60;
  for (const P of L) {
    const dx = P.tx - P.x, dy = P.ty - P.y, d = Math.hypot(dx, dy);
    if (d < 0.1) { if (Math.random() < 0.01) { const q = pick(); P.tx = q.x; P.ty = q.y; } }
    else { P.x += dx / d * P.v * dt; P.y += dy / d * P.v * dt; }
    if (!P.sayT && C.says && Math.random() < 0.0012) { P.say = RNG.pick(C.says); P.sayT = t; }
    if (P.sayT && t - P.sayT > 2600) P.sayT = 0;
    if (!wSeen(ch, Math.round(P.x), Math.round(P.y))) continue;
    const px = ox + P.x * ts, py = oy + P.y * ts + Math.sin(t / 300 + P.ph) * 1.5;
    g.globalAlpha = 0.78; spr(P.spr, px + ts * 0.05, py - ts * 0.15, ts * 0.9, P.pal); g.globalAlpha = 1;
    if (P.sayT) { g.font = `${Math.round(ts * 0.24)}px "Noto Serif SC",serif`; const w = g.measureText(P.say).width + 8; g.fillStyle = 'rgba(16,10,8,.82)'; g.fillRect(px + ts / 2 - w / 2, py - ts * 0.55, w, ts * 0.32); g.fillStyle = '#e8d8b8'; g.textAlign = 'center'; g.fillText(P.say, px + ts / 2, py - ts * 0.32); }
  }
}
// 冻伤、塌方：画面上的提示
function wHazardHud(g, ch, m, S, ox, oy, ts, t, Wp, Hp) {
  if (S.cold > 0 && m.def.cold) {
    const k = Math.min(1, S.cold / 100), gr = g.createRadialGradient(Wp / 2, Hp / 2, Math.min(Wp, Hp) * (0.5 - k * 0.2), Wp / 2, Hp / 2, Math.max(Wp, Hp) * 0.7);
    gr.addColorStop(0, 'rgba(200,230,255,0)'); gr.addColorStop(1, `rgba(200,230,255,${0.15 + k * 0.5})`); g.fillStyle = gr; g.fillRect(0, 0, Wp, Hp);
    g.fillStyle = 'rgba(10,16,24,.75)'; g.fillRect(8, Hp - 30, 132, 22); g.fillStyle = k >= 1 ? '#ff8a8a' : '#bfe6ff'; g.fillRect(12, Hp - 26, 124 * k, 14);
    g.font = `bold 12px "Noto Sans SC",sans-serif`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(k >= 1 ? "Bị cóng rồi! Mau tìm lửa trại" : "Hàn khí", 14, Hp - 15);
  }
  const E = S.esc; if (!E || S.flags.escaped) return;
  const pul = 0.5 + 0.5 * Math.sin(t / 160);
  g.fillStyle = `rgba(120,10,10,${0.08 + 0.1 * pul})`; g.fillRect(0, 0, Wp, Hp);
  if (E.warn && E.warn.sc === S.sc) { const px = ox + (E.warn.x + 0.5) * ts, py = oy + (E.warn.y + 0.5) * ts; g.fillStyle = `rgba(0,0,0,${0.35 + 0.3 * pul})`; g.beginPath(); g.ellipse(px, py + ts * 0.25, ts * 0.45, ts * 0.22, 0, 0, 6.29); g.fill(); g.strokeStyle = '#ff6a5a'; g.lineWidth = 2; g.stroke(); }
  if (E.fell && E.fell.sc === S.sc && t - E.fell.t < 500) { const px = ox + E.fell.x * ts, py = oy + E.fell.y * ts, k = (t - E.fell.t) / 500; g.globalAlpha = 1 - k; g.drawImage(SPR.cv('iceblock'), px, py - ts * (1 - k) * 2, ts, ts); g.globalAlpha = 1; }
  g.fillStyle = 'rgba(16,6,6,.85)'; g.fillRect(Wp / 2 - 110, 8, 220, 26); g.font = `bold 14px "Noto Serif SC",serif`; g.textAlign = 'center'; g.fillStyle = E.left < 25 ? '#ff6a5a' : '#ffd0c0';
  g.fillText(`Hang băng sập rồi! Chạy mau — còn ${E.left} bước`, Wp / 2, 26);
}
const foodModal = () => {
  const run = SAVE.run, L = foodsOpen(), cur = run && run.food;
  return `<h2 class="mh">Sách Ẩm Thực của quản gia Khang</h2><p class="help-p">Ăn một món, hiệu lực đến lần nghỉ bên lửa trại kế tiếp. Ăn cơm tiện thể hồi hai phần khí huyết. Gom được nguyên liệu mới, sách lại thêm một món.</p>
    <div class="foods">${FOODS.map(F => { const ok = L.includes(F); return `<button class="btn ${ok ? (cur === F.id ? '' : 'ghost') : 'ghost dis'}" ${ok ? `data-act="eat" data-arg="${F.id}"` : 'disabled'}>${ok ? esc(F.n) : "? ? ? "} <small>${ok ? esc(F.d) : "Chưa gom được nguyên liệu"}${cur === F.id ? " · đang thưởng thức" : ''}</small></button>`; }).join('')}</div>
    <button class="btn ghost" data-act="close">Không ăn nữa</button>`;
};
function playQuiz(rounds, done, r = 0) {
  if (!rounds || r >= rounds.length) return done && done();
  const R = rounds[r];
  playDialog(R.q, null, () => showOpts(R.q[R.q.length - 1], R.opts.map(o => o[0]), i => {
    const o = R.opts[i];
    SFX.play(o[1] ? 'rare' : 'fail');
    const fx = o[3] ? wFx(qch(), o[3], qrun()) : [];
    playDialog(o[2], null, () => runCommon(fx, () => (o[1] ? playQuiz(rounds, done, r + 1) : playQuiz(rounds, done, r))));
  }));
}
function playChoice(id, done) {
  const C = CHOICES[id];
  playDialog(C.q, null, () => showOpts(C.q[C.q.length - 1], C.opts.map(o => o.l), i => { SFX.play('page'); runCommon(wChoose(qch(), id, i, qrun()), done); }));
}
// ---- 篝火 ----
const campModal = P => () => {
  const ch = wch(), S = wstate(ch), others = S.camps.filter(id => id !== P.id);
  const comps = Object.keys(COMPANIONS).filter(c => (SAVE.comps || {})[c]), forced = S.flags.ngocFollow || S.flags.zhenFollow;
  const talk = wCampTalkReady(ch);
  return `<h2 class="mh">${SPR.img('fire', 34, null, 'flicker')} ${esc(P.n)}</h2>
    <p class="help-p">Ánh lửa xua tan âm khí. Lưu tiến độ ở đây; thua trận sẽ về lửa trại gần nhất.</p>
    <div class="campb"><button class="btn" data-act="wrest">Nghỉ ngơi${WMAPS[ch].daynight ? (S.flags.night ? " đến sáng" : " đến tối") : ''} <small>Hồi đầy khí huyết và đan dược, tiểu yêu sẽ xuất hiện lại${talk ? " · <b class=\"talkdot\">Có người muốn nói chuyện với bạn</b>" : ''}</small></button>
      ${comps.length > 1 && !forced ? `<div class="compsel camp"><span class="sub">Dẫn ai đi cùng</span>${comps.map(c => { const C2 = COMPANIONS[c]; return `<button class="cmp2 ${SAVE.comp === c ? 'on' : ''}" data-act="wcomp" data-arg="${c}">${unitIcon(C2.spr, 30, null, '', 'head')}<b>${C2.n}</b>${compTag(c)}</button>`; }).join('')}</div>` : ''}
      ${others.map(id => `<button class="btn ghost" data-act="wtele" data-arg="${id}">Dịch chuyển tới “${esc(wCampName(ch, id))}” <small>${esc(WMAPS[ch].scenes[wCampPos(ch, id).sc].n)}</small></button>`).join('')}
      <button class="btn ghost" data-act="wmenu">Tạm rời <small>Về menu xuất chinh (đổi nhân vật, xem đồ giám), sau đó tiếp tục từ đây</small></button>
      <button class="btn ghost" data-act="close">Rời đi</button></div>`;
};
// ---- 任务日志 / 小地图 ----
const affMet = (S, k) => k === 'ngoc' || (k === 'liu' && mPast(S, 'm3')) || (k === 'zhen' && S.flags.zhenMet) || wAffOf(k) > 0 || (k === 'kang' && S.side.S2) || (k === 'long' && S.side.S4);
function affHTML(ch) {
  const S = wstate(ch);
  const L = Object.keys(AFF_WHO).filter(k => affMet(S, k));
  return `<div class="affl">${L.map(k => { const v = wAffOf(k), h = Math.min(5, Math.round(v / 2)); const Sp = SPEAKERS[k];
    return `<div class="aff">${SPR.img(Sp.por || Sp.spr, 44, Sp.por ? null : Sp.pal)}<div><b>${esc(AFF_WHO[k])}</b><small>${AFF_LV[Math.min(10, v)]}${v > 10 ? ' +' + (v - 10) : ''}</small></div><span class="hearts">${'♥'.repeat(h)}<i>${'♡'.repeat(5 - h)}</i></span></div>`; }).join('')}</div>
    <p class="help-p">Thiện cảm đến từ nhiệm vụ, lựa chọn trong hội thoại, chuyện đêm bên lửa trại. Thiện cảm càng cao, dẫn theo càng đánh mạnh (mỗi điểm +4% khí huyết và công).</p>`;
}
const questModal = () => () => {
  const ch = SAVE.run && SAVE.run.world ? SAVE.run.chapter : 1, S = wstate(ch), Q = WQ[ch];
  const main = Q.main.map((m, i) => `<li class="${i < S.main ? 'done' : i === S.main ? 'cur' : 'todo'}">${i < S.main ? '✓' : i === S.main ? '▸' : '·'} ${i <= S.main ? esc(m.t) : "? ? ? "}${i < S.main && (m.lines || m.after) ? ` <button class="btn sm ghost rvb" data-act="wreplay" data-arg="${i}">Xem lại</button>` : ''}${i === S.main ? `<small>${esc(((SAVE.guide === 'full' || !m.hint) ? m.d : m.hint).replace('{n}', S.kc))}</small>` : ''}</li>`).join('');
  const side = Q.side.filter(q => S.side[q.id]).map(q => { const s = S.side[q.id], st = q.steps[s.step];
    return `<li class="${s.st === 'done' ? 'done' : 'cur'}">${s.st === 'done' ? '✓' : '▸'} ${esc(q.t)}${s.st === 'on' ? `<small>${esc(((SAVE.guide === 'full' || !st.hint) ? st.d : st.hint).replace('{n}', s.n))}</small>` : ''}</li>`; }).join('');
  const keys = Object.keys(wkeys()).map(k => W_KEYS[k] && `<div class="keyit">${SPR.img(W_KEYS[k].spr, 28)}<span><b>${W_KEYS[k].n}</b><small>${W_KEYS[k].d}</small></span></div>`).join('');
  return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">${chTitle(ch)}</h2>
    ${CH_RECAP[ch] ? `<div class="row" style="margin:4px 0 8px"><button class="btn sm ghost" data-act="wrecap">Hồi trước kể rằng</button><span class="sub">Nhiệm vụ chính đã xong có thể chạm “Xem lại”</span></div>` : "<p class=\"sub\">Nhiệm vụ chính đã xong có thể chạm “Xem lại”</p>"}
    <h4 class="sub-h">Nhiệm vụ chính <small>${S.main}/${Q.main.length}</small></h4><ul class="qlog">${main}</ul>
    <h4 class="sub-h">Nhiệm vụ phụ <small>đã xong ${Q.side.filter(q => S.side[q.id] && S.side[q.id].st === 'done').length}/${Q.side.length}</small></h4><ul class="qlog">${side || "<li class=\"todo\">Chưa nhận nhiệm vụ phụ nào. Người có dấu “!” trên đầu đang có việc tìm bạn.</li>"}</ul>
    <h4 class="sub-h">Nhân vật</h4>${affHTML(ch)}
    ${keys ? `<h4 class="sub-h">Vật phẩm cốt truyện</h4><div class="keys">${keys}</div>` : ''}`;
};
// ---- 全章大地图：去过的地方、任务在哪、点亮的篝火可以直接传送 ----
let MAPTAB = 'all';
function wTeleBlock(ch) {
  const S = wstate(ch), m = wMain(ch);
  if (m && m.escort && S.flags.escort === m.escort) return "Đang dẫn người theo, không đi được — đưa người đến nơi trước đã";
  if (wWatchBlock(ch)) return "Lính tuần đang canh, tự lần ra ngoài trước đã";
  return '';
}
function wLitCamps(ch, sc) {
  const S = wstate(ch), I = wIndex(ch), out = [];
  for (const id in I) { const e = I[id]; if (e.sc !== sc || !e.P || e.P.t !== 'camp') continue; if (S.camps.includes(id) || (/^town/.test(sc) && S.sd[sc])) out.push(id); }
  return out;
}
function regionSVG(ch) {
  const S = wstate(ch), all = wScenes(ch), E = new Map(), adj = {};
  for (const sc of all) { const m = wmap(ch, sc); for (const c in m.def.pts) { const P = m.def.pts[c]; if (P.t !== 'door' || P.lost || !all.includes(P.to) || P.to === sc) continue;
    const k = [sc, P.to].sort().join('|'); if (!E.has(k)) { E.set(k, [sc, P.to]); (adj[sc] = adj[sc] || []).push(P.to); (adj[P.to] = adj[P.to] || []).push(sc); } } }
  const known = new Set(Object.keys(S.sd));
  for (const sc of Object.keys(S.sd)) { const m = wmap(ch, sc), D = S.sd[sc]; for (const c in m.pts) { const P = m.def.pts[c]; if (P.t !== 'door' || P.lost || !all.includes(P.to)) continue;
    if (m.pts[c].some(p => D.seen && D.seen[p.y * m.W + p.x] === '1')) known.add(P.to); } }
  const depth = {}, order = [], q = [];
  const roots = [WMAPS[ch].start, ...all.filter(s => /^town/.test(s))];
  for (const r of roots) if (depth[r] == null) { depth[r] = 0; q.push(r); }
  while (q.length) { const sc = q.shift(); order.push(sc); for (const n of adj[sc] || []) if (depth[n] == null) { depth[n] = depth[sc] + 1; q.push(n); } }
  for (const sc of all) if (depth[sc] == null) { depth[sc] = 0; order.push(sc); }
  const shown = order.filter(sc => known.has(sc)), rows = {};
  shown.forEach(sc => (rows[depth[sc]] = rows[depth[sc]] || []).push(sc));
  const ds = Object.keys(rows).map(Number).sort((a, b) => a - b), W = 330, RH = 66, pos = {};
  ds.forEach((d, i) => { const L = rows[d]; L.forEach((sc, j) => { pos[sc] = { x: W * (j + 1) / (L.length + 1), y: 34 + i * RH }; }); });
  const H = 34 + Math.max(0, ds.length - 1) * RH + 40;
  const marks = {}; for (const q2 of wTracker(ch)) { const p = wMarkPos(ch, q2); if (p && p.sc) { const o = marks[p.sc] = marks[p.sc] || {}; if (q2.main) o.main = 1; else o.side = 1; } }
  let svg = `<svg class="rgn" viewBox="0 0 ${W} ${H}" width="100%">`;
  for (const [a, b] of E.values()) if (pos[a] && pos[b]) svg += `<line x1="${pos[a].x}" y1="${pos[a].y}" x2="${pos[b].x}" y2="${pos[b].y}" class="rg-e"/>`;
  for (const sc of shown) { const p = pos[sc], vis = !!S.sd[sc], lit = vis ? wLitCamps(ch, sc) : [], here = sc === S.sc, mk = marks[sc] || {};
    const name = vis ? WMAPS[ch].scenes[sc].n : "? ? ? ", w = Math.min(96, Math.max(58, name.length * 13 + 18));
    svg += `<g class="rg-n ${here ? 'here' : ''} ${vis ? '' : 'unk'} ${lit.length ? 'lit' : ''}" ${lit.length ? `data-act="mapgo" data-arg="${sc}"` : ''}>
      <rect x="${p.x - w / 2}" y="${p.y - 15}" width="${w}" height="30" rx="6"/><text x="${p.x}" y="${p.y + 5}">${esc(name)}</text>
      ${lit.length ? `<text class="rg-f" x="${p.x - w / 2 + 2}" y="${p.y - 10}">🔥</text>` : ''}${mk.main ? `<text class="rg-m" x="${p.x + w / 2 - 4}" y="${p.y - 9}">★</text>` : mk.side ? `<text class="rg-s" x="${p.x + w / 2 - 4}" y="${p.y - 9}">●</text>` : ''}
      ${here ? `<text class="rg-h" x="${p.x}" y="${p.y + 27}">Bạn ở đây</text>` : ''}</g>`; }
  return svg + '</svg>';
}
const miniModal = () => () => {
  if (isRift(SAVE.run)) { const S0 = wstate(RCH), D0 = wScene(RCH), m0 = wmap(RCH), bs = D0.mons.find(o => o.boss), ex = !m0.def.rift.last && (m0.pts['2'] || [])[0], orb = (D0.orbs || []).length;
    const go = bs ? "<button class=\"btn sm\" data-act=\"minigo\" data-arg=\"boss\">Đi đánh yêu vương giữ ải</button>" : `${ex ? "<button class=\"btn sm\" data-act=\"minigo\" data-arg=\"exit\">Tới trận truyền tống</button>" : ''}${orb ? `<button class="btn sm ghost" data-act="minigo" data-arg="orb">Nhặt tinh phách (${orb})</button>` : ''}`;
    return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">${esc(WMAPS[RCH].scenes[S0.sc].n)}</h2><canvas id="minicv" class="minicv"></canvas>
    ${go ? `<div class="row mgo">${go}</div>` : ''}
    <p class="sub" style="text-align:center"><b>Chạm vào bất kỳ chỗ nào trên bản đồ là đi thẳng tới đó</b>. Khung tím là trận truyền tống, khung xanh là tháp, chấm đỏ là yêu vật, chấm cam là tinh anh, chấm tím sáng là tinh phách, khối đỏ lớn là yêu vương giữ ải</p>`; }
  const ch = wch(), S = wstate(ch), vis = Object.keys(S.sd).map(sc => WMAPS[ch].scenes[sc].n);
  const tabs = `<div class="row mtabs"><button class="btn sm ${MAPTAB === 'all' ? '' : 'ghost'}" data-act="maptab" data-arg="all">Cả chương</button><button class="btn sm ${MAPTAB === 'here' ? '' : 'ghost'}" data-act="maptab" data-arg="here">Vùng này</button></div>`;
  if (MAPTAB === 'all') { const blk = wTeleBlock(ch);
    return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">${esc(chTitle(ch))}</h2>${tabs}${regionSVG(ch)}
      <p class="sub" style="text-align:center">${blk ? `<b style="color:var(--blood2)">${esc(blk)}</b>` : "Chạm chỗ có 🔥 để dịch chuyển thẳng tới lửa trại ở đó"} · ★ chính ● phụ</p>`; }
  return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">${esc(WMAPS[ch].scenes[S.sc].n)}</h2>${tabs}<canvas id="minicv" class="minicv"></canvas>
  <p class="sub" style="text-align:center"><b>Chạm vào bất kỳ chỗ nào trên bản đồ là đi thẳng tới đó</b>. Khung vàng là mục tiêu nhiệm vụ, cam là lửa trại, chấm vàng là lối ra vào, chấm đỏ là yêu vật gần đó</p>
  <p class="sub" style="text-align:center">Nơi đã tới: ${vis.map(esc).join(' · ')}</p>`;
};
function drawMini() {
  const cv = $('#minicv'); if (!cv) return;
  const ch = wch(), m = wmap(ch), S = wstate(ch), T = wTheme(), k = Math.floor(Math.min(320 / m.W, 420 / m.H));
  cv.width = m.W * k; cv.height = m.H * k; const g = cv.getContext('2d');
  g.fillStyle = '#050406'; g.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) { if (!wSeen(ch, x, y)) continue; const c = wTile(m, x, y);
    g.fillStyle = c === 'H' ? '#5a3a30' : W_BLOCK.includes(c) ? (c === '^' ? '#4a3e36' : '#1a1410') : c === '=' ? T.p : shade(T.g, 22); g.fillRect(x * k, y * k, k, k); }
  for (const z of m.def.zones || []) { if (!z.groups && !z.n) continue; const cx = (z.r[0] + z.r[2] + 1) / 2 * k, cy = (z.r[1] + z.r[3] + 1) / 2 * k; if (!wSeen(ch, Math.floor(cx / k), Math.floor(cy / k))) continue; g.fillStyle = 'rgba(232,199,125,.55)'; g.font = `${Math.max(10, k * 1.1)}px "Noto Serif SC"`; g.textAlign = 'center'; g.fillText(z.n, cx, cy); }
  for (const code in m.pts) { const P = m.def.pts[code]; for (const p of m.pts[code]) { if (!wSeen(ch, p.x, p.y)) continue;
    if (P.t === 'camp') { g.fillStyle = '#ff8a3a'; g.fillRect(p.x * k, p.y * k, k, k); }
    if (P.t === 'door') { g.fillStyle = wDoorOpen(ch, P) ? '#ffd75a' : '#8a7a5a'; g.fillRect(p.x * k, p.y * k, k, k); g.fillStyle = '#ffe9c4'; g.font = `${Math.max(10, k)}px "Noto Serif SC"`; g.textAlign = 'center'; g.fillText(P.n, Math.min(cv.width - 30, Math.max(30, (p.x + 0.5) * k)), p.y === 0 ? (p.y + 2.4) * k : (p.y - 0.4) * k); } } }
  for (const q of wTracker(ch)) { let p = wMarkPos(ch, q); if (p && p.sc !== S.sc) { const d = wNextDoor(ch, S.sc, p.sc); p = d && { ...d, sc: S.sc }; }
    if (p) { g.strokeStyle = q.main ? '#ffd75a' : '#8fe89a'; g.lineWidth = 2; const r = p.area ? k * 3 : 2; g.strokeRect(p.x * k - r, p.y * k - r, k + r * 2, k + r * 2); } }
  for (const mn of wScene(ch).mons) if (wInSight(ch, mn.x, mn.y) || (wkeys().zhaohun && wdist(mn, S.pos) <= 7)) { g.fillStyle = mn.boss ? '#ff2a1a' : mn.elite ? '#ff8a3a' : '#c4291f'; if (mn.boss) g.fillRect(mn.x * k - k / 2, mn.y * k - k / 2, k * 2, k * 2); else g.fillRect(mn.x * k + k / 4, mn.y * k + k / 4, k / 2, k / 2); }
  if (m.def.rift) { for (const o of wScene(ch).orbs || []) { g.fillStyle = '#d8a8ff'; g.fillRect(o.x * k + k / 5, o.y * k + k / 5, k * 0.6, k * 0.6); }
    for (const [c, col] of [['2', '#a07aff'], ['3', '#6ad8e8']]) for (const p of m.pts[c] || []) { if (c === '3' && S.got[wgk(S.sc, p.x, p.y)]) continue; g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(p.x * k - 2, p.y * k - 2, k + 4, k + 4); } }
  g.fillStyle = '#fff'; g.fillRect(S.pos.x * k, S.pos.y * k, k, k);
  if (MAPGOAL && MAPGOAL.sc === S.sc) { g.strokeStyle = '#ffd78c'; g.lineWidth = 2; g.beginPath(); g.arc((MAPGOAL.x + 0.5) * k, (MAPGOAL.y + 0.5) * k, Math.max(4, k * 0.9), 0, 7); g.stroke(); }
  cv.onclick = e => { const r = cv.getBoundingClientRect(); if (!r.width) return; miniGo(Math.floor((e.clientX - r.left) / r.width * m.W), Math.floor((e.clientY - r.top) / r.height * m.H)); };
}
// 小地图点哪走哪：点到墙或没去过的地方，就近找一格走得到的；路上撞到妖物照样开打，打完接着走
function miniGo(x, y) {
  const ch = wch(); let T = null;
  for (let r = 0; r <= 2 && !T; r++) for (let dy = -r; dy <= r && !T; dy++) for (let dx = -r; dx <= r && !T; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const tx = x + dx, ty = y + dy; if (wSeen(ch, tx, ty) && wPassHero(ch, tx, ty)) T = { x: tx, y: ty }; }
  if (!T) return qtoast(wSeen(ch, x, y) ? "Chỗ đó không đi qua được" : "Chỗ đó chưa tới bao giờ, đi dò trước đã");
  miniWalk(T.x, T.y);
}
function miniWalk(x, y) {
  const ch = wch(), S = wstate(ch); closeModal(); wStopAuto(); WGOAL = null;
  if (x === S.pos.x && y === S.pos.y) { MAPGOAL = null; return; }
  const G = MAPGOAL = { sc: S.sc, x, y, hops: 0 };
  if (!wWalkTo(x, y, () => { if (MAPGOAL === G) MAPGOAL = null; })) { MAPGOAL = null; qtoast("Từ đây không đi tới đó được"); }
}
// ---- 摇杆 / 方向键 ----
function wJoySetup() {
  const j = $('#joy'); if (!j) return;
  const knob = j.querySelector('i');
  const set = e => { const r = j.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const L = Math.min(34, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); knob.style.transform = `translate(${Math.cos(a) * L}px,${Math.sin(a) * L}px)`;
    JOY = Math.hypot(dx, dy) < 7 ? null : (() => { const o = Math.round(a / (Math.PI / 4)); return [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]][(o + 8) % 8]; })(); };
  // 按住就一直盯着手指：原来按下时落在中心附近（还没方向）就不再检查，得先点准方向再按住才走；现在按住期间随时一拖就走
  j.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); j.setPointerCapture(e.pointerId); JOYDOWN = true; j.classList.add('on'); set(e); wJoyStep(); };
  j.onpointermove = e => { if (!j.hasPointerCapture(e.pointerId)) return; set(e); if (JOY && !WALK) wJoyStep(); };
  j.onpointerup = j.onpointercancel = () => { JOYDOWN = false; JOY = null; j.classList.remove('on'); knob.style.transform = ''; clearTimeout(_joyH); };
}
let _joyH = 0, JOYDOWN = false;
function wJoyStep() { clearTimeout(_joyH); if (VIEW !== 'world' || (!JOY && !JOYDOWN)) return; if (JOY && !WALK) wDirStep(JOY[0], JOY[1]); _joyH = setTimeout(wJoyStep, 40); }
// 按方向走一格：返回要走到的格子；挡着的人/机关返回交互
function wDirTarget(dx, dy) {
  const ch = wch(), S = wstate(ch), x = S.pos.x + dx, y = S.pos.y + dy;
  const act = wInteract(ch, x, y); if (act) return { act };
  if (wBoxAt(ch, x, y) && !(dx && dy)) return { x, y };   // 推冰块
  if (!wPassHero(ch, x, y) || (dx && dy && !wDiagOk(ch, S.pos, dx, dy))) {
    if (dx && dy) { if (wPassHero(ch, S.pos.x + dx, S.pos.y)) return wDirTarget(dx, 0); if (wPassHero(ch, S.pos.x, S.pos.y + dy)) return wDirTarget(0, dy); }
    return null;
  }
  return { x, y };
}
function wDirStep(dx, dy) {
  if (WALK || DLG || MODALFN || VIEW !== 'world') return;
  WGOAL = null; MAPGOAL = null;
  const T = wDirTarget(dx, dy); if (!T) return;
  if (T.act) return T.act();
  const P = wPt(wch(), T.x, T.y);
  WALK = { path: [{ x: T.x, y: T.y }], i: 0, joy: true, onArrive: P && P.t === 'camp' ? () => openModal(campModal(P)) : null }; wStepLoop();
}
// 镇上：带任务的人
function townCh() { if (SAVE.run && SAVE.run.world && !isRift(SAVE.run)) return SAVE.run.chapter; if (riftPath() && !storyCleared('normal') && !(SAVE.world && SAVE.world[1])) return 0;   // 幻境路线还没碰过剧情：镇上的人不挂剧情任务
  const c = SAVE.chapter || 1; return wHas(c) && WMAPS[c].scenes.town ? c : wHas(1) ? 1 : 0; }

// ---------- 奇遇 / 货郎 / 篝火 / 宝箱 / 结算 / 片尾 ----------
function sceneWrap(art, inner) { return `${runBar(SAVE.run)}<div class="scene"><div class="panel"><div class="art">${art}</div>${inner}</div></div>`; }
function eventHTML() {
  const run = SAVE.run, c = curCell(run), ev = EVENTS.find(e => e.id === c.ev);
  if (!EVRES) return sceneWrap(SPR.img('fu', 72, null, 'float'), `<h2>${ev.t}</h2><p class="d">${ev.d}</p><div class="choices">${ev.c.map((x, i) => {
    const ok = !x.req || x.req(run, EV);
    return `<button class="btn" ${ok ? '' : 'disabled'} data-act="choice" data-arg="${i}">${x.dyn ? x.dyn(run, EV) : x.l}</button>`; }).join('')}</div>`);
  return sceneWrap(SPR.img('fu', 72, null, 'float'), `<h2>${ev.t}</h2><p class="evres">${esc(EVRES.msg)}</p>${lootChips(EVRES.items)}
    <button class="btn big" data-act="evcont">${EVRES.fight ? "Nghênh chiến" : "Tiếp tục khám phá"}</button>`);
}
function shopHTML() {
  const run = SAVE.run, sh = curCell(run).shop;
  return sceneWrap(SPR.img('merchant', 72, { R: '#3a3a3a', Y: '#6a5a3a' }), `<h2>Người bán rong dưới đất</h2><p class="d">“Đừng nhìn nữa, toàn hàng tốt lột từ người chết ra, già trẻ không lừa.”</p>
    <div class="shop">${sh.items.map((x, i) => `<div class="irow ${ancCls(x.it)}">${SPR.item(x.it, 28)}<button class="linkish r-${x.it.rarity}" data-act="sitem" data-arg="${i}">${itemTitle(x.it)} <small>${SLOT_NAME[x.it.slot]}</small></button>
        ${x.sold ? "<span class=\"delta no\">Đã bán</span>" : `<button class="btn sm" ${SAVE.gold >= x.price ? '' : 'disabled'} data-act="buy" data-arg="${i}">${x.price} lượng</button>`}</div>`).join('')}
      <div class="irow">${gemImg(sh.gem.key, 28)}<span class="nm">${gemName(sh.gem.key)} <small>${gemDesc(sh.gem.key)}</small></span>${sh.gem.sold ? "<span class=\"delta no\">Đã bán</span>" : `<button class="btn sm" ${SAVE.gold >= sh.gem.price ? '' : 'disabled'} data-act="buygem">${sh.gem.price} lượng</button>`}</div>
      ${sh.potion ? `<div class="irow"><span class="nm">Hồi Xuân Đan <small>(đang có ${run.potions} viên)</small></span><button class="btn sm" ${SAVE.gold >= sh.potion ? '' : 'disabled'} data-act="potion">${sh.potion} lượng</button></div>` : "<div class=\"irow\"><span class=\"nm sub\">“Túi rỗng”: người bán rong không bán đan dược</span></div>"}</div>
    <p class="d" style="margin:12px 0 0;font-size:14px;color:var(--dim)">Bạn có ${SAVE.gold} lượng. Người bán rong sẽ ở mãi phòng này, có thể quay lại mua.</p>
    <button class="btn big" style="margin-top:12px" data-act="leave">Rời đi</button>`);
}
function restHTML() {
  return sceneWrap(SPR.img('fire', 80, null, 'flicker'), `<h2>Lửa trại</h2><p class="d">Ánh lửa xua tan âm khí. Bạn có thể thở một hơi ở đây.</p><div class="choices">
    <button class="btn" data-act="rest" data-arg="heal">Ngồi thiền: hồi 45% khí huyết</button>
    <button class="btn" data-act="rest" data-arg="sharpen">Mài đao: chuyến này sát thương +10%</button></div>`);
}
function chestHTML() {
  return sceneWrap(SPR.img('chest', 76), `<h2>Rương báu</h2><p class="d">Nắp rương kẽo kẹt mở ra. Bạn nhận được ${CHEST ? CHEST.gold : 0} lượng bạc và:</p>${lootChips(CHEST && CHEST.items)}${CHEST && CHEST.gems.length ? `<p class="sub">Còn một viên ${CHEST.gems[0]}</p>` : ''}
    <button class="btn big" data-act="leave">Tiếp tục khám phá</button>`);
}
// 2026-11-25 幻境结算升灵玉：这个角色灵玉匣里带着的排最上面（按匣子顺序），其余照旧
function lgUpOrder(cls) {
  const ids = boxOf(cls).filter(Boolean), on = ids.map(id => SAVE.lgems.find(g => g.id === id)).filter(Boolean);
  return [...on.map(g => Object.assign(Object.create(g), { on: 1 })), ...SAVE.lgems.filter(g => !ids.includes(g.id))];
}
// 2026-11-25 幻境结算：升完灵玉直接再打一层（层数可以在这里调，默认还是刚才选的那层）
function ragainRow() {
  const maxR = Math.max(1, SAVE.riftCap || 3); if (SAVE.riftLv > maxR) SAVE.riftLv = maxR;
  return `<div class="ragain"><span>Ván sau</span><button class="btn ghost" data-act="raglv" data-arg="-1" ${SAVE.riftLv <= 1 ? 'disabled' : ''} aria-label="Bớt một tầng">‹</button><b><small>tầng </small>${SAVE.riftLv}</b><button class="btn ghost" data-act="raglv" data-arg="1" ${SAVE.riftLv >= maxR ? 'disabled' : ''} aria-label="Thêm một tầng">›</button>
    ${maxR > SAVE.riftLv ? `<button class="btn ghost rtop" data-act="raglv" data-arg="${maxR - SAVE.riftLv}">Cao nhất ${maxR}</button>` : ''}</div>`;
}
function endHTML() {
  const r = LASTRUN; if (!r) { VIEW = 'town'; return townHTML(); }
  const t = Math.round(((r.t1 || Date.now()) - r.t0) / 1000);
  const rift = r.mode === 'rift', sd = r.storyDone;
  const title = rift ? (r.ended === 'win' ? `Ảo Cảnh tầng ${r.riftLv} · Qua ải` : r.ended === 'dead' ? "Bạn ngã xuống trong Ảo Cảnh" : "Bạn rời Ảo Cảnh")
    : r.ended === 'win' ? `${chTitle(r.chapter)} · Hết` : r.ended === 'dead' ? "Bạn ngã xuống dưới lòng đất" : "Bạn rút về trấn Thanh Thạch";
  const order = { legend: 0, set: 1, rare: 2, magic: 3, normal: 4 };
  const loot = r.loot.slice().sort((a, b) => order[a.rarity] - order[b.rarity] || (b.anc || 0) - (a.anc || 0));
  let extra = '';
  if (sd && sd.first) extra += `<div class="firstclear"><h3>Thưởng phá đảo lần đầu</h3><p>Bạc +${sd.gold} · Hồn tinh +${sd.mats}</p>${lootChips(sd.items)}${sd.unlock ? `<p class="evres">${sd.unlock}</p>` : ''}
    ${sd.chapter < 10 && r.diff === 'normal' ? `<p class="sub">Đã mở chương sau “${CHAPTERS[sd.chapter].n}”</p>` : ''}</div>`;
  if (rift && r.riftDone) {
    const tl = r.timeLeft || 0, used = Math.round((r.clock || 0) / 100);
    extra += `<div class="riftres g-${tl >= 0.5 ? 'a' : tl >= 0.25 ? 'b' : tl > 0 ? 'c' : 'd'}"><div class="rr-g">${r.grade}</div>
      <div><p>${r.world ? `Mất <b>${fmtClock(r.clock || 0)}</b> · hương còn <b>${fmtClock(tl * riftLimit(r.riftLv))}</b>` : `Mất <b>${used}</b> lượt · hương còn <b>${Math.round(tl * 100)}%</b>`}${r.deaths ? ` · ngã ${r.deaths} lần` : ''}</p>
      <p>${tl > 0 ? `${boxOpen() ? r.upgPara ? "Linh ngọc đều tối đa · " : `Linh ngọc nâng cấp được <b>${r.upg}</b> lần · ` : ''}Hiện tối đa khiêu chiến được <b>${SAVE.riftCap}</b> tầng${SAVE.riftCap > (r.capBefore || 0) ? " (đã mở lên trên)" : ''}` : `Hương cháy hết rồi: tầng này không tính qua${boxOpen() ? ", linh ngọc chỉ nâng được 1 lần" : ''}`}</p>
      ${r.bp ? `<p class="newslot">Binh phách <b>+${r.bp}</b> (hiện ${SAVE.bp || 0}/${WPN_COST}${(SAVE.bp || 0) >= WPN_COST ? ", đủ đúc một binh khí chuyên thuộc rồi: tìm Trương Đại Chùy" : ''})</p>` : ''}
      ${(r.newSlots || []).length ? `<p class="newslot">Mở ô trang bị mới: <b>${r.newSlots.map(p => SLOT_NAME[p]).join(", ")}</b>. Vào trang “Nhân vật” xem; loại trang bị này từ giờ sẽ rơi trong Ảo Cảnh.</p>` : ''}
      ${r.stat ? `<details class="bstat-d"><summary>Thống kê ván này</summary>${statHero(r.stat, r.hs)}</details>` : ''}
      ${r.record ? `<p class="evres">Kỷ lục mới của ${CLASSES[r.cls].n}: tầng ${r.riftLv} · ${r.world ? "mất " + fmtClock(r.clock || 0) : used + " lượt"}</p>` : ''}</div></div>`;
    if (boxOpen()) extra += `<div class="lgup"><h3>Linh ngọc</h3>${r.newGem ? `<p class="evres">Nhận linh ngọc mới: <b style="color:${LGEMS[r.newGem.t].c}">${LGEMS[r.newGem.t].n}</b></p>` : ''}
      ${r.upgPara ? `<p class="evres">Linh ngọc đều đã đạt cấp ${LGEM_CAP}: ${r.upgPara.n} lượt nâng đổi thành kinh nghiệm Tu vi <b>+${fmtBig(r.upgPara.x)}</b>${r.upgPara.lv ? ` (Tu vi lên ${r.upgPara.lv} cấp)` : ''}</p>` : ''}
      ${SAVE.lgems.length && !r.upgPara ? `<p class="sub">Còn nâng được <b style="color:var(--gold2)">${r.upg}</b> lần. Tỉ lệ thành công tùy tầng Ảo Cảnh và cấp linh ngọc, tối đa cấp ${LGEM_CAP}.</p>
      <div class="gems">${lgUpOrder(r.cls).map(g => `<div class="gemrow lg${g.on ? ' on' : ''}">${SPR.img('gem', 26, { G: LGEMS[g.t].c }, 'glow')}<span class="nm">${g.on ? "<em class=\"lgon\">Đang dùng</em>" : ''}<b style="color:${LGEMS[g.t].c}">${LGEMS[g.t].n}</b> cấp ${g.lv}<small>${LGEMS[g.t].d(g.lv)}</small></span>
        ${g.lv >= LGEM_CAP ? "<button class=\"btn sm\" disabled>Tối đa</button>" : `<button class="btn sm" ${r.upg ? '' : 'disabled'} data-act="lgup" data-arg="${g.id}">Nâng (${Math.round(lgemChance(g, r.riftLv) * 100)}%)</button>`}</div>`).join('')}</div>` : ''}</div>`;
  }
  // 2026-11 一屏：上面标题，中间在框里滚，按钮固定在底部
  return `<div class="scene endv"><div class="panel endp"><div class="endtop"><div class="art">${r.ended === 'win' ? heroSpr(r.cls, 56, 'float') + (r.ngoc ? unitIcon(r.ngoc === 'fox' ? 'ngocfox' : 'ngoc', 50, null, 'float', 'stand') : '') : SPR.img('skeleton', 56)}</div><div><h2>${title}</h2>
    <p class="d">${CLASSES[r.cls].n} · ${rift ? "Ảo Cảnh Cửu U" : DIFFS[r.diff].n}${r.world ? '' : ` · khám phá ${r.rooms} phòng`}</p></div></div>
    <div class="endscroll" data-scroll="end">
    ${r.record && !rift ? "<p class=\"evres\">Phá kỷ lục nhanh nhất của chương!</p>" : ''}
    ${extra}
    <div class="endstats"><div><small>${rift && r.world ? "Hương đã cháy" : "Thời gian"}</small><b>${rift && r.world ? fmtClock(r.clock || 0) : fmtTime(t)}</b></div><div><small>Diệt yêu</small><b>${r.kills}</b></div>
      <div><small>Cấp</small><b>${r.lvStart} → ${SAVE.chars[r.cls].level}</b></div><div><small>Bạc</small><b>+${r.goldGot}</b></div>
      <div><small>Ngọc</small><b>+${r.gemsGot}</b></div><div><small>Hồn tinh</small><b>+${r.matsGot}</b></div>${r.jyxGot ? `<div><small>Cửu U Huyền Tinh</small><b>+${r.jyxGot}</b></div>` : ''}
      ${SAVE.para.lv > r.paraStart ? `<div><small>Tu vi</small><b>${realmName(SAVE.para.lv)}</b></div>` : ''}</div>
    <p style="margin:0;color:var(--dim)">Lần này nhận ${loot.length} món trang bị (đã cất vào túi đồ)</p>${lootChips(loot)}
    ${!rift && r.ended === 'win' && bkDue() ? `<div class="bk-nudge"><p>Lại xong một chương. Tiến trình chỉ nằm trên thiết bị này, sao lưu lại cho chắc.</p><button class="btn sm" data-act="export">Sao chép mã lưu</button><button class="btn sm ghost" data-act="bknudge">Cách sao lưu khác</button></div>` : ''}
    </div>${rift && riftUnlocked() ? ragainRow() : ''}<div class="endbtns">${r.loot && r.loot.length ? "<button class=\"btn ghost\" data-act=\"bulkopen\">Kiểm chiến lợi phẩm</button>" : ''}<button class="btn ${rift && riftUnlocked() ? 'ghost' : 'big'}" data-act="town">Về trấn</button>${rift && riftUnlocked() ? "<button class=\"btn big\" data-act=\"ragain\">Đánh tiếp</button>" : ''}</div></div></div>`;
}
function creditsHTML() {
  const E = (SAVE.wflags || {}).ending, EN = { 1: "Kết cục 1 · Mỗi người một nửa", 2: "Kết cục 2 · Thắp đèn", 3: "Kết cục 3 · Lần này đến lượt tôi" }[E];
  const roll = [['', "CỬU U HỒI LANG"], ...(EN ? [['', EN + ((SAVE.wflags || {}).endingHidden ? " · Vĩ thanh ẩn “Ván cờ này”" : '')]] : []), ["Diễn viên chính", 'Ngoc cute'], ["Nhân vật chính", "A Thổ (chúng sinh)"],
    ["Trấn Thanh Thạch", "Cô Trân · Khang Phúc Quý · sư phụ Lưu · Lôi Lão Hổ · Trương Đại Chùy · Thiết Đản · Trân Đại · Tiểu Hổ"], ["Chính Khí Thư Viện", "Long đạo trưởng (an nghỉ)"], ["Trấn yêu sư", "Thanh Mộc Tử · Kim Bất Hoán · Liệt Dương Tử · Huyền Băng Tử (an nghỉ)"],
    ["Phản diện", "Bạch Vân Tử (Thanh Hư đạo trưởng)"], ["Đại phản diện", "Cửu U Ma Tôn"], ["Âm phủ", "Mạnh Bà · Đầu Trâu · Mặt Ngựa · Vương Tiểu Lục · Quỷ bán rong · A Phúc"],
    ["Khách mời đặc biệt", "Huyện Lệnh Cương Thi · Lang Yêu Vương · Nhện Nương Nương · Xích Viêm Thạch Ma · Xà Mẫu Ngàn Năm · Quỷ Vương"], ["Đặc biệt cảm ơn", "Ngoc cute ngoài đời thật"], ['', "— HẾT —"]];
  return `<div class="credits"><div class="cr-art">${heroSpr(SAVE.cls, 96, 'float')}${SPR.img('ngoc', 96, null, 'float')}</div>
    <div class="cr-win"><div class="cr-roll">${roll.map(([a, b]) => `<div class="cr-line"><small>${a}</small><b>${b}</b></div>`).join('')}<p class="cr-sign">Sản xuất · Thực hiện  Đồ Dữ Hào</p></div></div>
    <details class="cr-unlock"><summary>Lối chơi mới đã mở</summary><p><b>Ảo Cảnh Cửu U</b> (giới hạn một nén hương, số tầng không có tận cùng, có thể dẫn đồng hành) · <b>Độ khó Tu La</b>. Những thứ khác mở dần theo số tầng Ảo Cảnh đã thông: <b>Cường hóa</b> (tầng 3) · <b>Khảm ngọc</b> (tầng 8) · <b>Truy nã</b> (tầng 10) · <b>Tẩy luyện</b> (tầng 15) · <b>Điểm hóa</b> (tầng 25) · <b>Linh ngọc</b> (tầng 30) · <b>Tu vi</b> (tầng 40). Bước tiếp theo mở gì, xem “Đường Ảo Cảnh” ở trang Ảo Cảnh.</p></details>
    <button class="btn big" data-act="credend">Về trấn Thanh Thạch</button></div>`;
}

// ---------- 弹窗 ----------
function openModal(fn) { MODALFN = fn; sheet.innerHTML = fn(); modal.hidden = false; const t = document.querySelector('#toast'); if (t) t.style.top = ''; }   // 弹窗打开时，提示条回到顶上，不压着弹窗里的字
function closeModal() { if (BACK) { MODALFN = BACK; BACK = null; sheet.innerHTML = MODALFN(); return; } MODALFN = null; modal.hidden = true; }
function findItem(id) {
  const s = SAVE.stash.find(x => x.id === id); if (s) return { it: s, where: 'stash' };
  for (const c of CLASS_IDS) for (const sl in SAVE.chars[c].eq) if (SAVE.chars[c].eq[sl] && SAVE.chars[c].eq[sl].id === id) return { it: SAVE.chars[c].eq[sl], where: 'eq', cls: c };
  return null;
}
// 装备养成的各个小节：W 里写要哪几节（enh 强化、sock 打孔镶玉、inh 传承、up 升阶、refine 淬炼洗炼、cube 收进乾坤袋）。每个 NPC 只管自己那一两节
function smithHTML(it, where, W, title) {
  W = W || new Set(['enh', 'sock', 'up', 'refine', 'cube']);
  const worn = where === 'eq' || !!it.tw;   // 强化、孔、玉记在部位上：只能对穿在身上的做
  const ec = enhanceCost(it), sc = socketCost(it), maxS = MAX_SOCKETS[it.slot], cap = smithMax();
  let h = `<div class="smith"><h4>${title || ''} <small>Bạn có ${SAVE.gold} lượng · ${SAVE.mats} hồn tinh</small></h4>`;
  if (W.has('enh') && !worn) h += "<div class=\"srow\">Cường hóa ghi trên vị trí: mặc nó vào, vị trí này cường hóa tới mấy thì nó là bấy nhiêu; đổi trang bị không mất cường hóa.</div>";
  else if (W.has('enh')) h += (it.plus || 0) >= ENHANCE_MAX ? "<div class=\"srow\">Đã cường hóa đến +10</div>"
    : (it.plus || 0) >= cap ? `<div class="srow">Trương Đại Chùy giờ chỉ cường hóa tối đa đến +${cap}, qua các chương sau tay nghề ông sẽ khá hơn</div>`
    : `<div class="srow"><span>Cường hóa +${it.plus || 0} → +${(it.plus || 0) + 1}<small>tỉ lệ ${Math.round(ec.rate * 100)}% · ${ec.gold} lượng + ${ec.mats} hồn tinh (thất bại chỉ mất nguyên liệu) · chỉ cộng các chỉ số thực như công, khí huyết, hộ giáp · cường hóa ghi trên vị trí, đổi trang bị không mất</small></span><button class="btn sm" ${SAVE.gold >= ec.gold && SAVE.mats >= ec.mats ? '' : 'disabled'} data-act="enh" data-arg="${it.id}">Cường hóa</button></div>`;
  if (W.has('sock') && featureOn('sockets') && !worn) h += "<div class=\"srow\">Lỗ và ngọc ghi trên vị trí: mặc nó vào rồi mới đục lỗ, khảm ngọc; đổi trang bị thì ngọc đi theo vị trí.</div>";
  else if (W.has('sock') && featureOn('sockets')) h += (it.sockets || 0) >= maxS ? `<div class="srow">Đã đục đủ lỗ (${maxS}/${maxS})</div>`
    : `<div class="srow"><span>Đục lỗ ${it.sockets || 0}/${maxS}<small>${sc.gold} lượng + ${sc.mats} hồn tinh</small></span><button class="btn sm" ${SAVE.gold >= sc.gold && SAVE.mats >= sc.mats ? '' : 'disabled'} data-act="sock" data-arg="${it.id}">Đục lỗ</button></div>`;
  if (W.has('sock') && it.sockets && featureOn('sockets') && worn) {
    h += "<div class=\"srow col\"><span>Ngọc</span><div class=\"gslots\">";
    for (let i = 0; i < it.sockets; i++) {
      const g = it.gems[i];
      const up = g && !g.startsWith('L:') && +g.split('_')[1] < GEM_TIERS.length - 1 ? `<button class="gslot gup ${(SAVE.gems[g] || 0) >= 2 && !gemCapErr(+g.split('_')[1] + 1) ? '' : 'off'}" data-act="gemup" data-arg="${it.id}|${i}">Nâng cấp<small>${(SAVE.gems[g] || 0) >= 2 ? `${combineCost(g)} lượng${combineMats(g) ? ' + ' + combineMats(g) + " hồn tinh" : ''}` : `Còn thiếu ${2 - (SAVE.gems[g] || 0)} viên`}</small></button>` : '';
      h += g ? `<span class="gpair"><button class="gslot" data-act="ungem" data-arg="${it.id}|${i}">${gemImg(g, 22)}${gemName(g)}<small>${gemDesc(g)} · Gỡ ra${unsocketCost(g) ? ' ' + unsocketCost(g) + " lượng" : " (miễn phí)"}</small></button>${up}</span>` : "<span class=\"gslot empty\">Lỗ trống</span>";
    }
    h += '</div>';
    const free = it.sockets - it.gems.length, keys = Object.keys(SAVE.gems);
    const lg = [];   // 灵玉搬进灵玉匣了，装备的孔只镶普通玉
    if (free > 0) h += keys.length || lg.length ? `<div class="gpick">Chọn ngọc để khảm: ${lg.map(g => `<button class="chip lgc" data-act="lgem" data-arg="${it.id}|${g.id}">${SPR.img('gem', 16, { G: LGEMS[g.t].c })}${LGEMS[g.t].n} cấp ${g.lv}</button>`).join('')}${keys.map(k => `<button class="chip" data-act="gem" data-arg="${it.id}|${k}">${gemImg(k, 16)}${gemName(k)} ×${SAVE.gems[k]}</button>`).join('')}</div>` : "<p class=\"sub\">Bạn chưa có ngọc.</p>";
    h += '</div>';
  }
  if (W.has('up') && featureOn('anc')) {
    if (!(it.rarity === 'legend' || it.rarity === 'set')) h += "<div class=\"srow\">Chỉ thần binh và đồ bộ mới điểm hóa được.</div>";
    if (it.rarity === 'legend' || it.rarity === 'set') { const c = ancCost(it), can = SAVE.mats >= c;
      const xj = SAVE.jyx || 0;
      h += it.anc === 3 ? `<div class="srow">Món này là Cửu U: mọi thuộc tính +69%, từ tố đều tối đa, thêm một từ tố Cửu U.</div><div class="srow"><span>Tẩy lại từ tố Cửu U<small>Hiện tại: ${esc(jyText(it.jy))}. Rút lại trong hai loại của vị trí này, giá trị cũng quay lại · ${JY_WASH} viên Cửu U Huyền Tinh (bạn có ${xj})</small></span><button class="btn sm" ${xj >= JY_WASH ? '' : 'disabled'} data-act="jywash" data-arg="${it.id}">Tẩy lại</button></div>`
        : it.anc === 2 ? (jyGate() ? `<div class="srow"><span>Điểm hóa thành Cửu U<small>Mọi thuộc tính thêm +30%, bổ sung đủ 5–6 từ tố tối đa, mọc thêm một từ tố Cửu U; cường hóa, ngọc giữ nguyên · ${c} hồn tinh + ${JY_XJ} viên Cửu U Huyền Tinh (bạn có ${fmtBig(SAVE.mats)} hồn tinh, ${xj} viên Huyền Tinh)</small></span><button class="btn sm" ${can && xj >= JY_XJ ? '' : 'disabled'} data-act="ancient" data-arg="${it.id}">Điểm hóa</button></div>`
          : shelved('jy') ? `<div class="srow">Món này là Thái Cổ: mọi thuộc tính +30%, các dòng đều đạt trị số tối đa. Đã tới đỉnh rồi.</div>`
          : `<div class="srow">Món này là Thái Cổ: mọi thuộc tính +30%, từ tố đều tối đa. Ảo Cảnh đánh tới tầng ${JY_FROM} trở đi, có thể tốn ${c} hồn tinh + ${JY_XJ} viên Cửu U Huyền Tinh để điểm hóa thành Cửu U.</div>`)
        : !it.anc ? `<div class="srow"><span>Điểm hóa thành Thượng Cổ<small>mọi chỉ số +30%, một nửa tỉ lệ mọc thêm một dòng; cường hóa, ngọc, các dòng sẵn có đều giữ nguyên · ${c} hồn tinh (bạn có ${fmtBig(SAVE.mats)}). Thành Thượng Cổ rồi còn điểm hóa tiếp lên Thái Cổ được.</small></span><button class="btn sm" ${can ? '' : 'disabled'} data-act="ancient" data-arg="${it.id}">Điểm hóa</button></div>`
        : primalGate() ? `<div class="srow"><span>Điểm hóa thành Thái Cổ<small>mọc thêm một dòng, mọi dòng thành trị số tối đa; cường hóa, ngọc giữ nguyên · ${c} hồn tinh (bạn có ${fmtBig(SAVE.mats)})</small></span><button class="btn sm" ${can ? '' : 'disabled'} data-act="ancient" data-arg="${it.id}">Điểm hóa</button></div>`
        : `<div class="srow">Món này đã là Thượng Cổ. Đánh Ảo Cảnh tới tầng ${PRIMAL_FROM} rồi thì có thể tốn ${c} hồn tinh điểm hóa tiếp lên Thái Cổ.</div>`; }
  }
  if (W.has('refine') && it.aff.length && featureOn('reroll') && !it.rrPending) {
    const m = itemMult(it);
    if (it.rfPending) { const P = it.rfPending;
      h += `<div class="srow col"><span>Kết quả tôi luyện: chọn một cái để giữ</span><div class="gslots">${P.opts.map((o, i) => `<button class="gslot" data-act="rfpick" data-arg="${it.id}|${i}">${fmtStat(o[0], Math.round(o[1] * statMult(it, o[0])))}${affTag(it, o[0], o[1])}<small>${i ? " (mới)" : " (cũ)"}</small></button>`).join('')}</div></div>`;
    } else if (it.wsPending) { const P = it.wsPending;
      h += `<div class="srow col"><span>Kết quả tẩy luyện: chọn một trong hai bộ</span><div class="wsopts">${P.opts.map((set, i) => `<button class="gslot wsopt" data-act="wspick" data-arg="${it.id}|${i}"><b>${i ? "Đổi sang cái mới" : "Giữ nguyên"}</b>${set.map(([k, v]) => `<div class="${SP_AFFIXES.includes(k) ? 'spx' : ''}">${fmtStat(k, Math.round(v * statMult(it, k)))}${affTag(it, k, v)}</div>`).join('')}</button>`).join('')}</div></div>`;
    } else {
      const lk = wlockOf(it), wc = washCost(it, lk.size), unlockedSp = it.aff.some(([k], i) => SP_AFFIXES.includes(k) && !lk.has(i));
      h += `<div class="srow col"><span>Tẩy luyện <small>Khóa cái muốn giữ, còn lại đổi mới hết, xong chọn một trong hai bộ; giá mỗi lần cố định, khóa càng nhiều càng đắt.</small></span>
        <button class="btn sm wsgo" ${lk.size < it.aff.length && SAVE.gold >= wc.gold && SAVE.mats >= wc.mats ? '' : 'disabled'} data-act="ws" data-arg="${it.id}">Tẩy luyện (khóa ${lk.size} · ${fmtBig(wc.gold)} lượng + ${wc.mats} hồn tinh)</button>
        ${unlockedSp ? "<p class=\"sub warn\">Thuộc tính đặc biệt chưa khóa — tẩy luyện sẽ xóa mất nó (không lấy lại được).</p>" : ''}
        <div class="rflist">${it.aff.map(([k, v], i) => `<div class="rfrow ${lk.has(i) ? 'lk' : ''}"><button class="lockb ${lk.has(i) ? 'on' : ''}" data-act="wlock" data-arg="${it.id}|${i}">${lk.has(i) ? "Đã khóa" : "Khóa"}</button><span class="${SP_AFFIXES.includes(k) ? 'spx' : ''}">${fmtStat(k, Math.round(v * statMult(it, k)))}${affTag(it, k, v)}</span></div>`).join('')}</div>
        ${washOddsHTML(it, [...lk])}</div>`;
    }
  }
  if (W.has('refine') && it.aff.length && featureOn('reroll') && it.rrPending) {
    const rc = rerollCost(it);
    if (it.rrPending) {
      h += `<div class="srow col"><span>Kết quả tẩy luyện: chọn một dòng để giữ</span><div class="gslots">${it.rrPending.opts.map((o, i) => `<button class="gslot" data-act="rrpick" data-arg="${it.id}|${i}">${fmtStat(o[0], Math.round(o[1] * statMult(it, o[0])))}${i === 0 ? "<small> (cũ)</small>" : ''}</button>`).join('')}</div></div>`;
    } else {
      h += `<div class="srow col"><span>Tẩy luyện <small>Tốn ${rc.gold} lượng + ${rc.mats} hồn tinh, đổi một thuộc tính thành một trong hai lựa chọn ngẫu nhiên mới (cũng có thể giữ nguyên). Mỗi món chỉ tẩy được cùng một thuộc tính.</small></span><div class="gslots">
        ${it.aff.map(([k, v], i) => `<button class="gslot" ${(it.rr == null || it.rr === i) && SAVE.gold >= rc.gold && SAVE.mats >= rc.mats ? '' : 'disabled'} data-act="rr" data-arg="${it.id}|${i}">${fmtStat(k, Math.round(v * statMult(it, k)))}</button>`).join('')}</div></div>`;
    }
  }
  if (W.has('cube') && where === 'stash' && it.legend && featureOn('cube')) h += `<div class="srow"><span>Cất vào Túi Càn Khôn<small>${SAVE.cube[it.legend] ? "Trong Túi Càn Khôn đã có hiệu ứng này" : "Hủy món thần binh này để học vĩnh viễn hiệu ứng của nó (cần 10 hồn tinh)"}</small></span><button class="btn sm" ${!SAVE.cube[it.legend] && SAVE.mats >= 10 ? '' : 'disabled'} data-act="extract" data-arg="${it.id}">Cất vào</button></div>`;
  return h + '</div>';
}
function statMap(it) {
  const o = {};
  for (const k in it.imp) o[k] = (o[k] || 0) + Math.round(it.imp[k] * statMult(it, k));
  for (const [k, v] of it.aff) o[k] = (o[k] || 0) + Math.round(v * statMult(it, k));
  return o;
}
function diffChips(it, cur) {
  const a = statMap(it), b = cur ? statMap(cur) : {}, keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const rows = keys.map(k => [k, num((a[k] || 0) - (b[k] || 0))]).filter(([, d]) => d);
  if (!rows.length) return '';
  rows.sort((x, y) => y[1] - x[1]);
  return `<div class="diffs">${rows.map(([k, d]) => `<span class="${d > 0 ? 'up' : 'dn'}">${fmtStat(k, d)}</span>`).join('')}</div>`;
}
// 对比表：点储物箱里的装备，直接和身上那件一行一行对比（不用再点开）
function cmpTable(it, cur) {
  const a = statMap(it), b = statMap(cur), keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const nm = k => k.startsWith('sk_') ? fmtStat(k, 0).replace(/^\+0% /, '') : k === 'armorPct' ? "Hộ giáp%" : (STAT_NAMES[AFF_ST[k] || k] || k);
  const fv = (k, v) => v == null ? '—' : (k === 'hp' || k === 'regen' ? fmtBig(hpShow(v, heroLv())) : v) + (PCT_STATS.has(AFF_ST[k] || k) || k.startsWith('sk_') ? '%' : '');
  keys.sort((x, y) => ((b[x] != null) - (b[y] != null)) || ((a[y] || 0) - (b[y] || 0)) - ((a[x] || 0) - (b[x] || 0)));
  const L = legendOf(it), Lc = legendOf(cur), S = setOf(it), Sc = setOf(cur);
  const fx = (x, X, Y) => X ? `<b class="r-legend">${X.n}</b>: ${X.d}` : Y ? `<b class="r-set">${Y.n}</b>` : "<span class=\"sub\">Không</span>";
  return `<div class="cmpt"><div class="cmr cmh"><span></span><span class="r-${it.rarity}">Món này</span><span class="r-${cur.rarity}">Đang mặc</span></div>
    ${keys.map(k => { const x = a[k], y = b[k], d = (x || 0) - (y || 0); return `<div class="cmr"><span>${nm(k)}</span><b class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${fv(k, x)}</b><span>${fv(k, y)}</span></div>`; }).join('')}
    ${L || Lc || S || Sc ? `<div class="cmfx"><div><small>Món này</small>${fx(it, L, S)}</div><div><small>Đang mặc</small>${fx(cur, Lc, Sc)}</div></div>` : ''}</div>`;
}
// 更换某一格：储物箱里这一类的装备，能提升的排前面
const swapModal = sl => () => {
  const cls = SAVE.cls, D = deltaMap(cls), cur = SAVE.chars[cls].eq[sl], typ = slotType(sl);
  const L = SAVE.stash.filter(it => it.slot === typ && canEquip(it, cls)).sort((a, b) => (D.get(b.id) ?? -1e9) - (D.get(a.id) ?? -1e9)).slice(0, 80);
  return `<h2 class="mh">Thay ${SLOT_NAME[sl]} <small>trong túi đồ có ${L.length} món thay được</small></h2>
    <p class="sub swcur">Đang mặc: ${cur ? `<b class="r-${cur.rarity}">${itemTitle(cur)}</b>` : "Trống"}</p>
    <div class="swl">${L.length ? L.map(it => { const d = D.get(it.id);
      return `<button class="swr" data-act="swpick" data-arg="${it.id}|${sl}">${SPR.item(it, 28)}<span class="r-${it.rarity}">${itemTitle(it)}<small>cấp ${it.ilvl}${it.set ? " · Bộ" : ''}</small></span><em class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? '+' + fmtBig(d) : d < 0 ? '-' + fmtBig(-d) : '—'}</em></button>`; }).join('')
      : "<p class=\"empty-note\">Trong túi đồ không có món nào thay được. Đi đánh thêm vài chuyến nhé.</p>"}</div>
    <div class="sheet-act"><span class="sub">Bên phải là chiến lực thay đổi sau khi mặc</span><button class="btn ghost" data-act="close">Quay lại</button></div>`;
};
function itemModal(id, shopIdx) {
  return () => {
    const cls = ctxCls();
    let it, where;
    if (shopIdx != null) { it = curCell(SAVE.run).shop.items[shopIdx].it; where = 'shop'; }
    else { const f = findItem(id); if (!f) return "<p>Món trang bị này không còn nữa.</p><button class=\"btn\" data-act=\"close\">Đóng</button>"; it = f.it; where = f.where; }
    const ipos = where === 'eq' ? (Object.keys(SAVE.chars[cls].eq).find(k => SAVE.chars[cls].eq[k] === it) || it.slot) : posFor(cls, it, gpos(it)), cur = SAVE.chars[cls].eq[ipos];
    const isMine = where === 'eq' && cur && cur.id === it.id;
    const inFight = VIEW === 'battle' && B && !B.over;
    const canSmith = false, atTown = where !== 'shop' && !inFight && VIEW === 'town';   // 铸剑坊拆给了镇上的人：这里只留「拿去找谁」的快捷按钮
    const tab = canSmith ? ITAB : 'info';
    let h = `<div class="shead"><button class="btn sm ghost" data-act="close">Đóng</button>${canSmith ? `<div class="stabs"><button class="${tab === 'info' ? 'on' : ''}" data-act="itab" data-arg="info">Thuộc tính</button><button class="${tab === 'smith' ? 'on' : ''}" data-act="itab" data-arg="smith">Lò Rèn</button></div>` : ''}</div>`;
    if (tab === 'info') {
      if (atTown) {   // 2026-11-26 养成只留这一个入口：点装备，直接强化／洗炼／点化／镶玉（强化、镶玉记在部位上，只对身上的）
        const wt = wsTabs().map(t => t[0]), go = [['enh', "Cường hóa"], ['refine', "Tẩy luyện"], ['up', "Điểm hóa"], ['sock', "Khảm ngọc"]].filter(([fn]) => wt.includes(fn) && (where === 'eq' || (fn !== 'enh' && fn !== 'sock')) && (fn !== 'refine' || it.aff.length) && (fn !== 'up' || it.rarity === 'legend' || it.rarity === 'set'));
        if (go.length) h += `<div class="svc-go">${go.map(([fn, t]) => `<button class="chip" data-act="wsopen" data-arg="${fn}|${it.id}">${t}</button>`).join('')}</div>`;
      }
      if (!isMine && where !== 'eq') {
        if (canEquip(it, cls)) {
          const base = power(charStats(cls)), pb = powerBest(cls, it, gpos(it)), d = pb.raw - base, sg = n => (n >= 0 ? '+' : '') + n;
          h += `<div class="pdelta2"><span>${cur ? `So với <b class="r-${cur.rarity}">${itemTitle(cur)}</b> đang mặc` : `${SLOT_NAME[it.slot]} đang trống`}</span><b class="${d >= 0 ? 'up' : 'dn'}">Lực chiến ${sg(d)}</b></div>`;
        } else h += `<p class="pdelta warn">${CLASSES[cls].n} không dùng được bộ môn phái này</p>`;
      }
      if (cur && !isMine && where !== 'eq' && canEquip(it, cls)) h += cmpTable(it, cur) + `<details class="curd"><summary>Toàn bộ thuộc tính món này (sao, lỗ, bộ)</summary>${itemCard(it, cls, '')}</details>`;
      else h += itemCard(it, cls, isMine ? "Đang mặc" : where === 'eq' ? "Nhân vật khác đang dùng" : '');
      if (atTown) {
        if (where === 'stash' && it.legend && featureOn('cube')) h += smithHTML(it, where, new Set(['cube']), "Túi Càn Khôn");
      }
    } else h += smithHTML(it, where);
    const acts = [];
    if (where === 'stash') {
      if (canEquip(it, cls)) acts.push(`<button class="btn" data-act="equip" data-arg="${it.id}">Mặc</button>`);
      if (!inFight) h += `<div class="isub2"><button class="chip" data-act="sell" data-arg="${it.id}">Bán ${sellPrice(it)} lượng</button><button class="chip" data-act="salv" data-arg="${it.id}">Phân giải ${salvageValue(it)} hồn tinh</button><button class="chip" data-act="lock" data-arg="${it.id}">${it.lk ? "Mở khóa" : "Khóa"}</button></div>`;
    }
    if (isMine && VIEW === 'town' && (TT === 'gear' || TT === 'bag')) acts.push(`<button class="btn" data-act="gswap" data-arg="${ipos}">Thay</button>`);
    if (isMine) acts.push(`<button class="btn ghost" data-act="unequip" data-arg="${ipos}">Tháo</button>`);
    if (acts.length) h += `<div class="sheet-act">${acts.join('')}</div>`;
    return h;
  };
}
// 2026-11-25 乾坤袋选格子：神兵之魂一百多种，按门派（本门／通用／推荐／全部）、部位筛
let CPF = { g: 'mine', s: '' };
const CP_SLOTS = ['weapon', 'helm', 'chest', 'gloves', 'belt', 'boots', 'ring', 'amulet', 'offhand'];
const cubeModal = slot => () => {
  const cls = SAVE.cls, ch = SAVE.chars[cls], learned = LEGENDS.filter(L => SAVE.cube[L.id]);
  const rec = new Set((BUILDS[cls] || []).flatMap(B => B.cube || []));
  const G = [['mine', "Bổn môn", L => L.cls === cls], ['any', "Dùng chung", L => !L.cls], ['rec', "Gợi ý lối chơi", L => rec.has(L.id)], ['all', "Tất cả", () => true]].map(([k, n, f]) => [k, n, f, learned.filter(f).length]);
  let g = G.find(x => x[0] === CPF.g); if (!g || !g[3]) g = G.find(x => x[3]) || G[3];
  const pool = learned.filter(g[2]), sl = CP_SLOTS.filter(k => pool.some(L => L.slot === k)), sk = sl.includes(CPF.s) ? CPF.s : '';
  const list = pool.filter(L => !sk || L.slot === sk).sort((x, y) => (ch.cube.includes(y.id) ? 1 : 0) - (ch.cube.includes(x.id) ? 1 : 0) || CP_SLOTS.indexOf(x.slot) - CP_SLOTS.indexOf(y.slot));
  return `<button class="btn sm ghost x" data-act="close">Đóng</button><h2 class="mh">Túi Càn Khôn · ô ${slot + 1}</h2><p class="sub">Chọn một hồn thần binh đã cất để đặt vào ô này (${CLASSES[cls].n}).</p>
    <div class="chips cpf">${G.filter(x => x[3] || x[0] === 'all').map(([k, n, , c]) => `<button class="chip ${g[0] === k ? 'on' : ''}" data-act="cpf" data-arg="g|${k}">${n}<small>${c}</small></button>`).join('')}</div>
    ${sl.length > 1 ? `<div class="chips cpf cps"><button class="chip ${sk ? '' : 'on'}" data-act="cpf" data-arg="s|">Mọi vị trí</button>${sl.map(k => `<button class="chip ${sk === k ? 'on' : ''}" data-act="cpf" data-arg="s|${k}">${SLOT_NAME[k]}<small>${pool.filter(L => L.slot === k).length}</small></button>`).join('')}</div>` : ''}
    <div class="cubepick">${ch.cube[slot] ? `<button class="cp" data-act="cubeset" data-arg="${slot}|"><b>Bỏ trống ô này</b></button>` : ''}${list.length ? list.map(L => `<button class="cp ${ch.cube.includes(L.id) ? 'on' : ''}" data-act="cubeset" data-arg="${slot}|${L.id}"><b class="r-legend">${L.n}</b><span>${L.d}</span><small>${SLOT_NAME[L.slot]}${L.cls ? ' · ' + CLASSES[L.cls].n : " · dùng chung"}${rec.has(L.id) ? " · Gợi ý lối chơi" : ''}${ch.cube.includes(L.id) ? " · đã đặt" : ''}</small></button>`).join('') : "<p class=\"sub\">Loại này chưa cất món nào.</p>"}</div>`;
};
const bagModal = () => () => `<div class="shead"><button class="btn sm ghost" data-act="close">Đóng</button><div class="stabs"><button class="${BAGTAB === 'stat' ? 'on' : ''}" data-act="bagtab" data-arg="stat">Chỉ số</button><button class="${BAGTAB === 'gear' ? 'on' : ''}" data-act="bagtab" data-arg="gear">Trang bị</button><button class="${BAGTAB === 'skill' ? 'on' : ''}" data-act="bagtab" data-arg="skill">Võ học</button><button class="${BAGTAB === 'tal' ? 'on' : ''}" data-act="bagtab" data-arg="tal">Tâm pháp${talentInfo(ctxCls()).free ? ` <b class="upn">${talentInfo(ctxCls()).free}</b>` : ''}</button></div></div>
  ${BAGTAB === 'stat' ? `<div class="inbag bagstat"><h3 class="bs-h">${esc(CLASSES[ctxCls()].n)} · cấp ${SAVE.chars[ctxCls()].level}</h3>${statBlock(ctxCls())}</div>` : BAGTAB === 'gear' ? `<div class="gearp inbag">${gearPanel(ctxCls(), true)}</div>` : BAGTAB === 'skill' ? skillPanel(ctxCls(), true) : `<p class="sub">Tâm pháp còn ${talentInfo(ctxCls()).free} điểm${paraFree() ? ` · tu vi còn ${paraFree()} điểm (về trấn để cộng)` : ''}</p>${talentGrid(ctxCls())}`}`;
const retreatModal = () => () => `<h2 class="mh">Rút về trấn Thanh Thạch?</h2><p>Chuyến này dừng ở đây. Trang bị, nguyên liệu, kinh nghiệm và bạc đã nhận đều được giữ lại.</p>
  <div class="row"><button class="btn" data-act="doretreat">Xác nhận rút</button><button class="btn ghost" data-act="close">Nghĩ lại</button></div>`;
const resetModal = () => () => `<h2 class="mh" style="color:var(--blood2)">Xóa toàn bộ bản lưu?</h2><p>Mọi nhân vật, cấp, trang bị, ngọc, công trình, tiến độ cốt truyện đều bị xóa sạch, không khôi phục được.</p>
  <div class="row"><button class="btn" data-act="doreset">Xác nhận xóa</button><button class="btn ghost" data-act="close">Hủy</button></div>`;
const rewardModal = (title, r) => () => `<h2 class="mh">${title}</h2>
  <p>${[r.xp ? `Kinh nghiệm +${r.xp}` : '', r.gold ? `Bạc +${r.gold}` : '', r.mats ? `Hồn tinh +${r.mats}` : '', r.ups ? `<b style="color:var(--gold2)">Lên ${r.ups} cấp!</b>` : ''].filter(Boolean).join(" · ")}</p>
  ${lootChips(r.items)}${gemChips(r.gems || (r.gem ? [r.gem] : []))}<div class="row" style="justify-content:center"><button class="btn" data-act="close">Được</button></div>`;

// ---------- 云存档（当前环境不可用时自动退回本机） ----------
const CLOUD = { db: null, uid: null, status: 'connecting', at: 0, pushing: false, dirty: false, timerH: null };
function cloudLine() {
  return { connecting: "Lưu đám mây: đang kiểm tra…", off: "Lưu đám mây: chưa bật, tiến độ lưu trong trình duyệt của thiết bị này. Đổi thiết bị thì dùng mã lưu bên dưới để chuyển.",
    ok: `Lưu đám mây: đã bật, tiến độ tự đồng bộ vào tài khoản của bạn${CLOUD.at ? " (lần đồng bộ trước " + new Date(CLOUD.at).toLocaleTimeString() + ")" : ''}.`,
    err: "Lưu đám mây: đồng bộ thất bại, lát nữa sẽ tự thử lại. Tiến độ vẫn lưu trên thiết bị này.",
    ro: "Lưu đám mây: cách truy cập hiện tại không có quyền ghi, tiến độ chỉ lưu trên thiết bị này." }[CLOUD.status];
}
function refreshCloudUI() { const l = $('#cloudline'); if (l) l.textContent = cloudLine(); }
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
async function initCloud() {
  try {
    if (!window.claude || !window.claude.use) throw 0;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) throw 0;
    const id = await user.id(); if (!id) throw 0;
    CLOUD.db = db; CLOUD.uid = id;
    const snap = await timeout(db.doc(`data/users/${id}/save`).get(), 10000);
    if (snap.exists) {
      const d = snap.data();
      if (d && d.json && (d.t || 0) > (SAVE.t || 0)) {
        try { SAVE = parseSave(JSON.parse(d.json)); persist(true); SFX.set(SAVE.sound, false); VIEW = SAVE.run ? 'map' : 'town'; B = null; render(); toast("Đã tải bản lưu mới nhất từ đám mây"); } catch (e) {}
      } else if ((d.t || 0) < (SAVE.t || 0)) queuePush();
    } else queuePush();
    CLOUD.status = 'ok'; CLOUD.at = Date.now(); onPersist = queuePush; refreshCloudUI();
  } catch (e) { CLOUD.status = 'off'; refreshCloudUI(); }
}
function queuePush() { CLOUD.dirty = true; clearTimeout(CLOUD.timerH); CLOUD.timerH = setTimeout(pushNow, 4000); }
async function pushNow() {
  if (!CLOUD.db || CLOUD.pushing || !CLOUD.dirty) return;
  CLOUD.pushing = true; CLOUD.dirty = false;
  try {
    const json = JSON.stringify(SAVE);
    if (json.length < 240000) await CLOUD.db.doc(`data/users/${CLOUD.uid}/save`).set({ json, t: SAVE.t || Date.now() });
    CLOUD.status = 'ok'; CLOUD.at = Date.now();
  } catch (e) {
    if (e && ['invalid_argument', 'revoked', 'not_granted'].includes(e.code)) { CLOUD.status = 'ro'; onPersist = null; CLOUD.pushing = false; refreshCloudUI(); return; }
    CLOUD.status = 'err'; CLOUD.dirty = true; setTimeout(pushNow, 15000);
  }
  CLOUD.pushing = false; refreshCloudUI();
  if (CLOUD.dirty) queuePush();
}

// ---------- 操作 ----------
function refresh() { save(); if (VIEW !== 'battle') render(); else applyStep(null); if (MODALFN) setSheet(MODALFN()); }
// 重画弹窗时，框里滚到哪儿还在哪儿（原来点一下就跳回顶上，比如清点库房里单独留下一件）
function setSheet(html) { const keep = { _: sheet.scrollTop }; sheet.querySelectorAll('[data-scroll]').forEach(e => { keep[e.dataset.scroll] = e.scrollTop; });
  sheet.innerHTML = html; if (keep._) sheet.scrollTop = keep._; sheet.querySelectorAll('[data-scroll]').forEach(e => { const v = keep[e.dataset.scroll]; if (v) e.scrollTop = v; }); }
const split = a => a.split('|');
function playActsTown(acts) { runCommon(acts, () => render()); }
function npcTalk(id) {
  const c = storyCleared('normal');
  const pool = (NPC_LINES[id] || []).filter(l => l.ch <= c && (l.until == null || c < l.until));
  if (!pool.length) return;
  const recent = pool.filter(l => l.ch >= c - 2);
  const line = RNG.pick(RNG.ch(0.6) && recent.length ? recent : pool).t;
  const el = document.getElementById('npc-' + id); if (!el) return;
  document.querySelectorAll('.npc .bubble').forEach(x => x.remove());
  const b = document.createElement('div'); b.className = 'bubble'; b.textContent = line; el.appendChild(b);
  bump(el, 'talk', 400); setTimeout(() => b.remove(), 3200);
}
const ACT = {
  tab: c => { SAVE.cls = c; FILTER = 'all'; GSLOT = null; if (!seen('clstip')) markSeen('clstip'); refresh(); },
  tt: k => { TT = k; refresh(); },
  mount: id => { if (!(SAVE.mounts || {})[id]) return toast("Chưa gặp con dị thú này — trong Ảo Cảnh thỉnh thoảng sẽ gặp phó bản Sơn Hải Kinh"); SAVE.mount = SAVE.mount === id ? null : id; save(); refresh(); toast(SAVE.mount ? `Đã cưỡi ${MOUNTS[id].n}, ra bản đồ đi thử xem` : "Đã xuống"); },
  diff: d => { SAVE.diff = d; refresh(); },
  chap: k => { SAVE.chapter = +k; refresh(); },
  chnav: d => { const cl = storyCleared(SAVE.diff), maxCh = Math.min(10, cl + 1); SAVE.chapter = Math.max(1, Math.min(maxCh, SAVE.chapter + +d)); SFX.play('page'); refresh(); },
  htab: k => { HTAB = k; refresh(); },
  tbr: i => { TBR = +i; refresh(); },
  modsopen: () => openModal(goHelpModal()),
  gohelp: () => openModal(goHelpModal()),
  logt: () => { const l = $('#blog'); if (l) l.classList.toggle('open'); },
  auto: () => { if (AUTO) { stopAuto(); return; } AUTO = true; const b = document.querySelector('.autob'); if (b) { b.classList.remove('ghost'); b.textContent = "Đang tự khám phá…"; } autoStep(); },
  mode: m => { SAVE.mode = m; refresh(); },
  twgo: () => twGo(),
  twnext: () => { SAVE.run = null; B = null; BRES = null; twGo(); },
  twhome: () => { SAVE.run = null; B = null; BRES = null; VIEW = 'town'; TT = 'go'; save(); render(); },
  twpick: i => { const cls = (SAVE.run && SAVE.run.mode === 'tower' && SAVE.run.cls) || SAVE.cls, S = twState(cls); let p = S.pend && (i === 'x' ? { t: 'all' } : S.pend[+i]); if (!p) return;
    if (p.swap) { const sw = TWSEL && TWSEL.i === +i ? TWSEL.sw : null; if (sw == null || !twSwOk(S.kit, p, sw)) return toast(p.t === 'sk' ? "Chạm chọn chiêu muốn bỏ trước đã" : p.t === 'cube' ? "Chạm chọn hồn thần binh muốn bỏ trước" : "Chạm chọn linh ngọc muốn bỏ trước"); p = { ...p, out: sw }; } twApply(cls, p); TWSEL = null; save(); SFX.play('rare');
    if (VIEW === 'battle' && BRES && BRES.tw) { const el = $('#bres'); if (el) el.innerHTML = twResHTML(); } else { closeModal(); refresh(); } },
  twsel: i => { const cls = (SAVE.run && SAVE.run.mode === 'tower' && SAVE.run.cls) || SAVE.cls, f = twState(cls).fl; const k = i === 'x' ? 'x' : +i; TWSEL = TWSEL && TWSEL.f === f && TWSEL.i === k ? null : { f, i: k };
    if (VIEW === 'battle' && BRES && BRES.tw) { const el = $('#bres'); if (el) { const st = el.scrollTop; el.innerHTML = twResHTML(); el.scrollTop = st; } } else if (MODALFN) setSheet(MODALFN()); },
  twswap: id => { if (!TWSEL) return; TWSEL.sw = TWSEL.sw === id ? null : id; if (VIEW === 'battle' && BRES && BRES.tw) { const el = $('#bres'); if (el) { const st = el.scrollTop; el.innerHTML = twResHTML(); el.scrollTop = st; } } else if (MODALFN) setSheet(MODALFN()); },
  twagain: () => { const cls = (SAVE.run && SAVE.run.mode === 'tower' && SAVE.run.cls) || SAVE.cls; SAVE.run = null; B = null; BRES = null; twReset(cls); TWSEL = null; save(); twGo(); },
  twreset: () => { if (SAVE.run) return toast("Hãy kết thúc chuyến phiêu lưu đang dở trước đã"); openModal(twResetModal()); },
  twreset2: () => { twReset(SAVE.cls); TWSEL = null; save(); closeModal(); refresh(); toast("Về tầng 1, đồ tháp về bộ lúc đầu"); },
  twcls: () => openModal(twClsModal()),
  mechhelp: () => { if (MODALFN) BACK = MODALFN; openModal(mechModal()); },
  twpend: () => openModal(twPendModal()),
  twkit: () => { TWKSEL = 0; openModal(twKitModal()); },
  twksel: i => { TWKSEL = i === 'basic' ? i : +i; if (MODALFN) setSheet(MODALFN()); },
  twhelp: () => openModal(twHelpModal()),
  rlvto: n => { SAVE.riftLv = Math.max(1, Math.min(Math.max(1, SAVE.riftCap || 3), +n || 1)); refresh(); },   // 一下跳到 1 层、本门纪录、最高层
  rlv: d => { SAVE.riftLv = Math.max(1, Math.min(Math.max(1, SAVE.riftCap || 3), SAVE.riftLv + +d)); refresh(); },
  ctab: k => { CTAB = k; refresh(); },
  tlb: () => { openModal(lbModal); },
  cskeep: () => { CS.pend = null; closeModal(); csStart(); csUpload(true); },
  cscloud: async () => { const P = CS.pend; if (!P) return; try { IMPORTING = await csTake(csMe().code, P.id); ACT.doimport(); } catch (e) { toast("Không lấy được bản trên mây, kiểm tra mạng rồi thử lại"); } },
  cscopy: () => { const c = csFmt(csMe().code); try { navigator.clipboard.writeText(c).then(() => toast("Đã sao chép mã lấy lại"), () => toast(c)); } catch (e) { toast(c); } },
  csfind: async () => { const code = csNorm(($('#csIn') || {}).value); if (!code) return toast("Mã không đúng: sau JY là 16 chữ cái và số");
    try { const L = await lbCall('cs_list', { p_code: code }); if (!L || !L.length) return toast("Mã này chưa có bản lưu nào"); CS.found = { code, list: L }; BACK = MODALFN; openModal(csListModal); }
    catch (e) { toast("Không kết nối được lưu đám mây, kiểm tra mạng nhé"); } },
  cspick: async a => { const F = CS.found; if (!F) return; try { IMPORTING = await csTake(F.code, +a); BACK = MODALFN; openModal(importModal()); } catch (e) { toast("Bản lưu này đọc không được, thử bản khác"); } },
  lbkind: k => { LBV.kind = k; refresh(); },
  lbcls: k => { LBV.cls = k; refresh(); },
  lbreload: () => { lbLoad(true); refresh(); },
  lbjoin: () => { const v = String(($('#lbName') || {}).value || '').replace(/[\u0000-\u001f<>&"]/g, '').trim(); if (!v) return toast("Đặt tên trước đã"); if (v.length > 12) return toast("Tên tối đa 12 ký tự");
    lbMe().name = v; lbMe().sent = {}; save(); toast("Đã lên bảng: " + v); LBV.data = {}; lbLoad(true); refresh(); },
  lbrename: () => { const L = lbMe(); openModal(() => `<h2 class="mh">Đổi tên</h2><div class="row rdm-row"><input id="lbName2" maxlength="12" value="${esc(L.name || '')}" autocomplete="off"><button class="btn sm" data-act="lbrename2">OK</button></div><p class="help-p">Thành tích của mọi nghề, Ảo Cảnh và Tháp Thông Thiên đều đổi tên theo.</p>`); },
  lbrename2: () => { const v = String(($('#lbName2') || {}).value || '').replace(/[\u0000-\u001f<>&"]/g, '').trim(); if (!v) return toast("Đặt tên trước đã"); if (v.length > 12) return toast("Tên tối đa 12 ký tự");
    const L = lbMe(); L.name = v; L.sent = {}; save(); closeModal(); LBV.data = {}; lbLoad(true); refresh(); },
  lbhelp: () => openModal(() => `<h2 class="mh">Bảng xếp hạng</h2><p class="help-p">Đặt tên xong, thành tích của từng nghề sẽ tự tải lên: Ảo Cảnh so tầng cao nhất, cùng tầng thì so thời gian; Tháp Thông Thiên so tầng cao nhất trong tuần, thứ Hai hằng tuần làm mới (cùng tuần, cùng nghề thì tháp của mọi người giống nhau). Lực chiến chỉ để xem, không tính hạng.</p><p class="help-p">Chỉ dùng được ở bản web: ${LB_SITE}</p><p class="help-p">Dữ liệu lưu trên máy mỗi người, thành tích là tự báo lên, chơi cho vui thôi.</p><div class="row" style="justify-content:center"><button class="btn" data-act="close">Hiểu rồi</button></div>`),
  zyhelp: () => openModal(zyHelpModal()),
  stab: k => { STAB = k; refresh(); },
  slimok: () => { delete SAVE.slimNote; save(); closeModal(); },
  yiopen: () => { BACK = null; openModal(yiModal); },
  boxopen: () => { BACK = null; openModal(boxModal); },
  cubeopen: () => { BACK = null; openModal(cubeBagModal); },
  kits: () => { BACK = null; openModal(kitsModal); },
  bagv: k => { BAGV = k; GSLOT = null; FILTER = 'all'; refresh(); },
  bagall: () => { GSLOT = null; FILTER = 'all'; refresh(); },
  tobag: sl => { closeModal(); MODALFN = null; modal.hidden = true; BACK = null; GSLOT = sl || null; TT = 'bag'; BAGV = 'eq'; FILTER = 'all'; VIEW = 'town'; refresh(); },
  gemfit: () => { const r = gemAutoFit(ctxCls()); save(); if (r.n) SFX.play('forge'); toast(r.n ? `Đã đổi ${r.n} viên ngọc hợp hơn` : "Ngọc trên người đã là hợp nhất rồi (hoặc trong túi ngọc không có viên tốt hơn)"); refresh(); },
  zyopen: () => { if (shelved('zy')) return ACT.yiopen(); TT = 'col'; CTAB = 'zy'; ZYOPEN = true; VIEW = 'town'; refresh(); setTimeout(() => { const e = document.getElementById('zylu'); if (e) e.scrollIntoView({ block: 'start' }); }, 50); },
  zyp: a => { ZYPG = ZYPG === +a ? -1 : +a; refresh(); },
  yi: id => { const r = setYi(SAVE.cls, id); if (r.err) return toast(r.err); save(); refresh(); },
  modt: id => { const i = SAVE.mods.indexOf(id); if (i >= 0) SAVE.mods.splice(i, 1); else SAVE.mods.push(id); refresh(); },
  teamx: c => { TEAMX = TEAMX === c ? null : c; refresh(); },
  teamhelp: () => { const prev = MODALFN; openModal(teamHelpModal()); BACK = prev; },
  defhelp: () => { const prev = MODALFN; openModal(defHelpModal()); BACK = prev; },
  teamopen: () => { BACK = null; openModal(teamModal()); },
  fmopen: () => { BACK = null; FMSEL = null; FMPICK = null; formCheckUnlock(); openModal(formModal()); },
  fmbench: c => {   // 布阵里点伙伴：先点了号位就让他站到那个号位（带满了就把那个号位上的伙伴换下来）；没点号位就是上阵 / 下阵
    const sel = FMSEL || formCur() || 'san', T = teamOf(), inT = T.includes(c), N = teamSlots();
    if (FMPICK != null && sel !== 'san') {
      const occ = formSlots(sel, fmMembers(), SAVE.cls)[FMPICK];
      if (!inT) { if (T.length >= N) { if (occ && occ !== 'hero') SAVE.team = T.filter(x => x !== occ); else return toast(`Đồng hành đã đủ (${N} người): chạm một vị trí đang có đồng hành đứng, rồi chạm người này để đổi`); } SAVE.team = [...teamOf(), c]; }
      const keys = fmMembers(), j = formSlots(sel, keys, SAVE.cls).indexOf(c); if (j >= 0 && j !== FMPICK) formSwap(sel, SAVE.cls, keys, j, FMPICK);
      FMPICK = null; save(); SFX.play('click'); return refresh(); }
    if (inT) SAVE.team = T.filter(x => x !== c); else if (T.length < N) SAVE.team = [...T, c]; else return toast(`Đồng hành đã đủ (${N} người): chạm một vị trí trước, rồi chạm người này để thay người đang đứng ở đó`);
    save(); SFX.play('click'); refresh(); },
  fmsel: id => { FMSEL = id; FMPICK = null; refresh(); },
  fmslot: i => { i = +i; const sel = FMSEL || formCur(); if (!sel || sel === 'san') return; if (FMPICK == null) { FMPICK = i; refresh(); return; }
    if (FMPICK !== i) { formSwap(sel, SAVE.cls, fmMembers(), FMPICK, i); save(); SFX.play('click'); } FMPICK = null; refresh(); },
  fmuse: id => { if (!formOpen(id)) return; formSave().cur = id; FMPICK = null; save(); SFX.play('rare'); toast(id === 'san' ? "Không bày trận nữa" : `Đã bày "${FORMS[id].n}"`); refresh(); },
  fmup: id => { const r = formUp(id); if (r.err) return toast(r.err); save(); SFX.play('legend'); toast(`${FORMS[id].n} lên Lv ${r.lv}`); refresh(); },
  fmhelp: () => { const prev = MODALFN; openModal(formHelpModal()); BACK = prev; },
  fminfo: () => { if (!B) return; const my = B.fm || 'san', en = B.efm, k = B.fk; if (!en) return toast(`Bạn đang bày "${FORMS[my].n}". Bầy yêu vật này không bày trận`);
    toast(`Bạn: ${FORMS[my].n}　Yêu vật: ${FORMS[en].n}　${k > 0 ? `Bạn khắc nó: sát thương của bạn +${FORM_K}%, của nó -${FORM_K}%` : k < 0 ? `Nó khắc bạn: sát thương của bạn -${FORM_K}%, của nó +${FORM_K}%` : "Không tương khắc"}`); },
  teamtog: c => { const T = teamOf(); if (T.includes(c)) SAVE.team = T.filter(x => x !== c); else if (T.length < teamSlots()) SAVE.team = [...T, c]; else return toast(`Hết chỗ rồi (${teamSlots()} chỗ), cho một người nghỉ trước`); save(); refresh(); },
  gift: c => { const r = giftComp(c); if (r.err) return toast(r.err); SFX.play('buff'); toast(`${c === 'ngoc' ? 'Ngoc' : COMPANIONS[c].n} hảo cảm +1 ♥ (hiện ${r.v})${r.v === 10 || r.v === 20 ? ": kỹ năng mạnh lên rồi!" : ''}`); save(); refresh(); },
  ngoctog: () => { SAVE.ngocJoin = !SAVE.ngocJoin; refresh(); if (SAVE.ngocJoin) toast("Ngoc: “Đáng lẽ phải dẫn ta theo từ lâu rồi.”"); else toast("Ngoc: “…Vậy thì về sớm một chút.”"); },
  npc: id => {
    if (id === 'ngoc' && riftPath() && !storyCleared('normal') && !SAVE.run) return openModal(rpathModal);   // 幻境路线：点 Ngoc 看「幻境之路」
    const qc = townCh();
    if (qc && (wNpcMark(qc, id) || WNPC[id])) { const acts = wTalk(qc, id, SAVE.run && SAVE.run.world ? SAVE.run : null);
      if (acts.length === 1 && acts[0].dlg && acts[0].dlg.length === 1 && !wNpcMark(qc, id) && NPC_LINES[id] && storyCleared('normal') >= 1) return npcTalk(id);
      if (acts.length === 1 && acts[0].dlg && acts[0].dlg.length === 1) { const el = document.getElementById('npc-' + id); if (el) { document.querySelectorAll('.npc .bubble').forEach(x => x.remove()); const b = document.createElement('div'); b.className = 'bubble'; b.textContent = acts[0].dlg[0][1]; el.appendChild(b); bump(el, 'talk', 400); setTimeout(() => b.remove(), 3200); } return; }
      return playActsTown(acts); }
    npcTalk(id);
  },
  start: () => {
    AUTO = false;
    const mode = riftUnlocked() && SAVE.mode === 'rift' ? 'rift' : 'story';
    if (mode === 'story' && !chapterUnlocked(SAVE.diff, SAVE.chapter)) return toast("Chương này chưa mở khóa");
    if (mode === 'story' && (SAVE.diff === 'normal' || SAVE.diff === 'nightmare') && wHas(SAVE.chapter)) {
      SAVE.run = newWorldRun(SAVE.cls, SAVE.chapter, SAVE.diff); const S = wstate(SAVE.chapter);
      if (S.camp) wTele(SAVE.chapter, S.camp);
      VIEW = 'world'; WHERO = null; refresh(); window.scrollTo(0, 0);
      const ch = SAVE.chapter, C = CHAPTERS[ch - 1], M = WQ[ch].main, cur = M[S.main];
      const sv = SAVE, first = () => { if (SAVE !== sv || VIEW !== 'world' || wstate(ch).main !== 0) return; const g0 = M[0].goal; if (g0.talk) setTimeout(() => { if (SAVE === sv && VIEW === 'world' && wstate(ch).main === 0) wRun(wTalk(ch, g0.talk, SAVE.run)); }, 300); };
      const ci = () => chapterIntro(chIntroFor(ch), () => { if (SAVE !== sv) return; if (CH_RECAP[ch]) playDialog(recapLines(ch), null, first); else first(); });
      if (S.main === 0 && ch === 1 && !seen('snowfox')) { markSeen('snowfox'); save(); snowPrologue(ci); }   // 序 · 雪夜
      else if (S.main === 0) ci();
      else if (cur && /^i/.test(cur.id) && !/^i/.test((M[S.main - 1] || {}).id || '') && interIntroFor(ch) && !S.pz.iintro) { S.pz.iintro = 1; chapterIntro(interIntroFor(ch)); }
      else banner(chTitle(ch), C.sub, 2000);
      return;
    }
    if (mode === 'rift') {   // 幻境：走路遇怪的大地图
      SAVE.run = newRiftRun(SAVE.cls, SAVE.riftLv); RTICK = 0;
      VIEW = 'world'; WHERO = null; WAUTO = false; WGOAL = null; WALK = null; refresh(); window.scrollTo(0, 0);
      banner(`Ảo Cảnh Cửu U · tầng ${SAVE.run.riftLv}`, WMAPS[RCH].scenes.f0.n, 2000);
      if (shOn(SAVE.run)) setTimeout(() => { if (shOn(SAVE.run) && VIEW === 'world') { banner("Phó bản Sơn Hải Kinh", "Ải này có dị thú giữ ải · rơi đồ nhiều hơn", 2800); SFX.play('gong'); } }, 2200);
      if (!seen('rift2')) { markSeen('rift2'); save(); setTimeout(() => openModal(riftHelpModal), 2200); }
      return;
    }
    SAVE.run = newRun(SAVE.cls, { mode, diff: SAVE.diff, chapter: SAVE.chapter, riftLv: SAVE.riftLv, mods: SAVE.mods.slice() });
    VIEW = 'map'; refresh(); window.scrollTo(0, 0);
    const run = SAVE.run;
    if (mode === 'story') {
      const C = CHAPTERS[run.chapter - 1];
      const show = () => banner(chTitle(run.chapter), C.sub, 2200);
      if (!seen('i' + run.chapter)) { markSeen('i' + run.chapter); save(); playDialog(C.intro, C.boss, show); } else show();
    } else { banner(`Ảo Cảnh Cửu U · tầng ${run.riftLv}`, themeOf(run).n, 1800); }
  },
  resume: () => { VIEW = SAVE.run.world ? 'world' : 'map'; WHERO = null; refresh(); window.scrollTo(0, 0); },
  retreat: () => { stopAuto(); openModal(retreatModal()); },
  doretreat: () => { const r = SAVE.run; BACK = null; closeModal(); clearTimeout(timer); finishRunView(r, 'retreat'); },
  town: () => { VIEW = 'town'; TT = 'go'; LASTRUN = null; refresh(); window.scrollTo(0, 0); snowCatchUp(); },
  raglv: d => { SAVE.riftLv = Math.max(1, Math.min(Math.max(1, SAVE.riftCap || 3), SAVE.riftLv + +d)); save(); refresh(); },
  ragain: () => { const r = LASTRUN; if (SAVE.run || !riftUnlocked()) return;
    const go = () => { closeModal(); LASTRUN = null; SAVE.mode = 'rift'; if (r && r.cls && SAVE.cls !== r.cls) SAVE.cls = r.cls; VIEW = 'town'; TT = 'go'; ACT.start(); };
    const left = r && r.upg && !r.upgPara && boxOpen() && SAVE.lgems.some(g => g.lv < LGEM_CAP) ? r.upg : 0;
    if (left) return openModal(() => `<h2 class="mh">Linh ngọc chưa nâng xong</h2><p class="help-p">Còn <b>${left}</b> lần nâng linh ngọc chưa dùng, mở ván mới là mất.</p><div class="row" style="justify-content:center"><button class="btn" data-act="close">Quay lại nâng</button><button class="btn ghost" data-act="ragain2">Không nâng nữa, đánh</button></div>`);
    go(); },
  ragain2: () => { const r = LASTRUN; if (r) r.upg = 0; ACT.ragain(); },
  credend: () => { VIEW = 'end'; refresh(); window.scrollTo(0, 0); if (!seen('postg')) { markSeen('postg'); markSeen('npcsvc'); markSeen('boxnote'); save(); setTimeout(() => playDialog(POSTGAME_OPEN(), null, () => {}), 400); } },
  snowreplay: () => snowPrologue(),
  replay: a => { const [k, part] = split(a), C = CHAPTERS[+k - 1]; const lines = part === 'ending' ? ENDING : part === 'story' ? C.story.lines : /^w/.test(part) ? wReplayLines(+k, part) : C[part]; playDialog(lines, C.boss); },
  item: id => { const prev = MODALFN; ITAB = 'info'; openModal(itemModal(id)); BACK = prev; },
  gview: k => { if (k === 'stash' && GVIEW === 'stash') GSLOT = null; if (k !== 'stash') GSLOT = null; GVIEW = k; GSUB = k === 'gems' || k === 'cube' ? k : 'stash'; FILTER = 'all'; refresh(); },
  statall: () => openModal(statAllModal(SAVE.cls)),
  gsl: sl => { if (sl === 'box' && MODALFN === boxModal) return closeModal();
    if (VIEW === 'town' && TT === 'gear') { if (sl === 'box') return ACT.boxopen();
      const it = SAVE.chars[SAVE.cls].eq[sl]; if (it) { ITAB = 'info'; return openModal(itemModal(it.id)); }   // 点身上的装备格：弹出这件的属性
      GSLOT = sl; TT = 'bag'; BAGV = 'eq'; FILTER = 'all'; return refresh(); }   // 空格子：去背包挑这一类
    if (VIEW === 'town' && TT === 'bag') { GSLOT = GSLOT === sl ? null : sl; return refresh(); }
  GSLOT = GSLOT === sl ? null : sl; refresh(); if (GSLOT) { const el = document.querySelector('.gdoll'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } },   // 点了部位：把这一排和下面摊开的属性滚到眼前
  // 「更换」：原来这个动作被误写进了 gsl 里，按了没反应。现在弹出储物箱里这一格能换的装备，按提升排好；点一件看对比，「穿上」就换进这一格
  gswap: sl => { const prev = MODALFN; openModal(swapModal(sl)); BACK = prev; },
  swpick: a => { const [id, sl] = split(a); const prev = MODALFN; GSLOT = sl; ITAB = 'info'; openModal(itemModal(id)); BACK = prev; },
  gsub: k => { GSUB = k; refresh(); },
  itab: k => { ITAB = k; refresh(); },
  npcfn: k => { NPCV.fn = k; NPCV.item = null; BULKARM = false; refresh(); },
  npcitem: id => { NPCV.item = id || null; refresh(); },
  npcgo: a => { const [id, fn, item] = split(a); if (WS_NPC[id]) return wsOpen(fn, item || null); NPCV = { id, fn, item: item || null }; GAMBLE = null; BACK = null; openModal(npcModal); },
  wstab: k => { WS.tab = k; refresh(); },
  wsitem: id => { WS.item = WS.item === id && WS.tab !== 'ov' ? null : id; if (WS.tab === 'ov') WS.tab = wsTabs().some(t => t[0] === 'enh') ? 'enh' : wsTabs()[1] ? wsTabs()[1][0] : 'ov'; refresh(); },
  wsstash: () => { WS.stash = !WS.stash; refresh(); },
  wsgo: a => { const [k, id] = split(a); WS.tab = k; WS.item = id; WS.stash = false; refresh(); },
  wsopen: a => { const [k, id] = split(a); wsOpen(k || 'ov', id || null); },
  wsforge: lid => { const r = forgeWeapon(ctxCls(), lid); if (r.err) return toast(r.err); SFX.play('legend'); toast(`Đã đúc xong: <b>${esc(r.it.name)}</b> (đã cất vào túi đồ)`); refresh(); achToast(checkAch()); },
  gamb: slot => { const it = gamble(SAVE.cls, slot); if (!it) return toast("Không đủ bạc"); GAMBLE = it; SFX.play(it.rarity === 'legend' || it.rarity === 'set' ? 'legend' : it.rarity === 'rare' ? 'rare' : 'coin'); refresh(); },
  bulkopen: () => { BULKX = new Set(); BULKARM = false; BACK = null; openModal(bulkModal); },
  bulkmode: m => { bulkFilter().mode = m; BULKARM = false; refresh(); },
  bulkr: r => { const f = bulkFilter(); f.r[r] = f.r[r] ? 0 : 1; BULKARM = false; refresh(); },
  bulkk: k => { const f = bulkFilter(); f[k] = f[k] ? 0 : 1; BULKARM = false; refresh(); },
  bulkx: id => { if (BULKX.has(id)) BULKX.delete(id); else BULKX.add(id); BULKARM = false; refresh(); },
  bulkgo: () => { const f = bulkFilter(), list = bulkPick(SAVE.cls, f).filter(it => !BULKX.has(it.id)); if (!list.length) return;
    if (!BULKARM && list.some(it => it.rarity === 'set' || it.rarity === 'legend')) { BULKARM = true; return refresh(); }
    const r = bulkDo(f.mode, list.map(it => it.id)); BULKARM = false; SFX.play(f.mode === 'sell' ? 'coin' : 'forge');
    toast(f.mode === 'sell' ? `Bán ${r.n} món, được ${r.v} lượng` : `Phân giải ${r.n} món, được ${r.v} hồn tinh`); refresh(); },
  lock: id => { const it = findOwned(id); if (!it) return; if (it.lk) delete it.lk; else it.lk = 1; refresh(); },
  bagtab: k => { BAGTAB = k; refresh(); },
  qeq: id => {
    const cls = ctxCls(), f = findItem(id); if (!f) return;
    const d = powerWith(cls, f.it, gpos(f.it)) - power(charStats(cls));
    if (equipItem(cls, id, gpos(f.it))) { SFX.play('loot'); toast(`Đã mặc <b>${esc(f.it.name)}</b>, lực chiến ${d >= 0 ? '+' : ''}${d}`); refresh(); achToast(checkAch()); }
  },
  sitem: i => openModal(itemModal(null, +i)),
  close: () => closeModal(),
  equip: id => { const f0 = findItem(id); if (f0 && equipItem(ctxCls(), id, gpos(f0.it))) { SFX.play('loot'); toast("Đã trang bị"); closeModal(); refresh(); achToast(checkAch()); } },
  unequip: sl => { unequip(ctxCls(), sl); closeModal(); refresh(); },
  sell: id => { const g = sellItem(id); SFX.play('coin'); toast(`Bán được ${g} lượng`); closeModal(); refresh(); },
  salv: id => { const m = salvage(id); SFX.play('forge'); toast(`Phân giải được ${m} hồn tinh`); closeModal(); refresh(); },
  best: () => { const cls = ctxCls(), plan = bestPlan(cls); if (!plan.length) return toast("Đã là bộ mạnh nhất rồi"); ACT.bestgo(); },
  bestgo: () => { const cls = ctxCls(), r = bestApply(cls); closeModal(); if (r.n) SFX.play('loot');
    toast(r.n ? `Đã mặc ${r.n} món mạnh hơn (cường hóa và ngọc nằm trên vị trí nên đi theo luôn)` : "Đã là bộ mạnh nhất rồi");
    refresh(); achToast(checkAch()); },
  junk: () => { const r = sellJunk(); if (r.n) SFX.play('coin'); toast(r.n ? `Bán ${r.n} món, được ${r.g} lượng` : "Không có Phàm/Linh phẩm nào để bán (đồ đã cường hóa hoặc khảm ngọc sẽ không bán)"); refresh(); },
  salvjunk: () => { const r = salvageJunk(); if (r.n) SFX.play('forge'); toast(r.n ? `Phân giải ${r.n} món, được ${r.m} hồn tinh` : "Không có Phàm/Linh phẩm nào để phân giải"); refresh(); },
  filter: f => { FILTER = f; refresh(); },
  enh: id => { const it = findOwned(id); const r = enhance(it); if (r.err) return toast(r.err); SFX.play(r.ok ? 'forge' : 'fail'); toast(r.ok ? `Cường hóa thành công! Giờ là +${it.plus}` : "Trương Đại Chùy: “Lần này… trượt tay.” Mất nguyên liệu"); refresh(); achToast(checkAch()); },
  sock: id => { const r = addSocket(findOwned(id)); if (r.err) return toast(r.err); SFX.play('forge'); toast("Đục lỗ thành công"); refresh(); },
  gem: a => { const [id, k] = split(a); const r = socketGem(findOwned(id), k); if (r.err) return toast(r.err); SFX.play('rare'); toast("Khảm thành công"); refresh(); },
  boxput: gid => { const cls = ctxCls(), i = boxOf(cls).indexOf(null); if (i < 0) return toast("Ba lỗ đều đầy, tháo một viên trước đã"); const r = boxSet(cls, i, gid); if (r.err) return toast(r.err); SFX.play('legend'); refresh(); achToast(checkAch()); },
  boxoff: i => { const r = boxSet(ctxCls(), +i, null); if (r.err) return toast(r.err); SFX.play('click'); refresh(); },
  gemup: a => { const [id, i] = split(a); const r = upgradeSocketed(findOwned(id), +i); if (r.err) return toast(r.err); SFX.play('rare'); toast("Đã nâng thành " + gemName(r.key)); refresh(); },
  lgreopen: () => { LGRE = null; BACK = null; openModal(lgReModal); },
  lgreforge: a => { const [gid, t] = split(a), g = SAVE.lgems.find(x => x.id === gid); if (!g || g.t !== 'reforge' || !LGEMS[t] || LGEMS[t].hide || SAVE.lgems.some(x => x.t === t)) return;
    g.t = t; delete g.old; save(); SFX.play('rare'); toast(`Đã đổi thành ${LGEMS[t].n} (cấp ${g.lv})`); if (SAVE.lgems.some(x => x.t === 'reforge')) refresh(); else { closeModal(); refresh(); } },
  ungem: a => { const [id, i] = split(a); const r = unsocket(findOwned(id), +i); if (r.err) return toast(r.err); toast("Đã gỡ ngọc"); refresh(); },
  rr: a => { const [id, i] = split(a); const r = rerollStart(findOwned(id), +i); if (r.err) return toast(r.err); SFX.play('magic'); refresh(); },
  rrpick: a => { const [id, i] = split(a); rerollPick(findOwned(id), +i); SFX.play('forge'); toast("Tẩy luyện xong"); refresh(); },
  btyacc: id => { const r = wBtyAccept(wch(), id); BTYMSG = r.err || r.ok; SFX.play(r.err ? 'fail' : 'rare'); if (MODALFN) sheet.innerHTML = MODALFN(); },
  btyshop: () => { const prev = MODALFN; SHOPID = 'shangyin'; SHOPTAB = 'buy'; SHOPMSG = ''; SHOPSEL = -1; openModal(shopModal); if (prev === npcModal) BACK = prev; },
  form: a => { const [i, z] = split(a); const ch = SAVE.chars.necro; ch.form = necroForm(ch.level, ch.form); ch.form[+i] = z; save(); SFX.play('click'); refresh(); },
  rf: a => { const [id, i] = split(a); const r = refineStart(findOwned(id), +i); if (r.err) return toast(r.err); SFX.play('magic'); refresh(); },
  rfpick: a => { const [id, i] = split(a); refinePick(findOwned(id), +i); SFX.play('forge'); toast(+i ? "Đã đổi trị số mới" : "Giữ lại cái cũ"); refresh(); },
  wlock: a => { const [id, i] = split(a); if (WLOCK.id !== id) WLOCK = { id, s: new Set() }; const k = +i; if (WLOCK.s.has(k)) WLOCK.s.delete(k); else WLOCK.s.add(k); refresh(); },
  ws: id => { const it = findOwned(id); const r = washStart(it, [...wlockOf(it)]); if (r.err) return toast(r.err); SFX.play('magic'); refresh(); },
  wspick: a => { const [id, i] = split(a); washPick(findOwned(id), +i); SFX.play('forge'); toast(+i ? "Tẩy luyện xong: đã đổi thuộc tính mới" : "Giữ nguyên"); refresh(); },
  jywash: id => { const it = findOwned(id); const r = jyWash(it); if (r.err) return toast(r.err); SFX.play('rare'); toast(`Từ tố Cửu U: ${esc(jyText(it.jy))}`); save(); refresh(); },
  ancient: id => { const it = findOwned(id); const r = ancientize(it); if (r.err) return toast(r.err); SFX.play('legend'); if (r.jy) jyBanner(it); toast(`Điểm hóa xong: <b>${esc(itemTitle(it))}</b>${r.jy ? `, từ tố Cửu U: ${esc(jyText(it.jy))}` : r.add ? ", mọc thêm một dòng" : ''}`); save(); refresh(); achToast(checkAch()); },
  uptier: id => { const it = findOwned(id); const r = upTier(it, upTierTarget(ownerOf(it) || SAVE.cls)); if (r.err) return toast(r.err); SFX.play('forge'); toast(`Thăng giai xong: giờ là ${TIER_N[it.tier]}`); refresh(); },
  extract: id => { const r = extractLegend(id); if (r.err) return toast(r.err); SFX.play('legend'); toast("Hồn thần binh đã vào Túi Càn Khôn, sang trang “Trang bị” đặt nó vào ô"); closeModal(); refresh(); achToast(checkAch()); },
  cubepick: i => { const prev = MODALFN; openModal(cubeModal(+i)); if (prev === cubeBagModal) BACK = prev; },
  cpf: a => { const [k, v] = split(a); if (k === 'g') { CPF.g = v; CPF.s = ''; } else CPF.s = v; if (MODALFN) sheet.innerHTML = MODALFN(); },
  cubeset: a => { const [i, lid] = split(a); setCube(SAVE.cls, +i, lid || null); SFX.play('rare'); closeModal(); refresh(); },
  combineall: () => { const r = combineAllPlan(true); if (!r.n) return toast("Không có ngọc nào ghép được"); SFX.play('rare'); toast(`Đã ghép ${r.n} lần, được ` + Object.entries(r.got).sort((a, b) => b[0].split('_')[1] - a[0].split('_')[1]).map(([k, v]) => `${gemName(k)}×${v}`).join(", ")); save(); refresh(); },
  combine: k => { const r = combineGem(k); if (r.err) return toast(r.err); SFX.play('rare'); toast("Đã ghép " + gemName(r.key)); refresh(); },
  learn: a => { const [br, i] = split(a); if (learnTalent(ctxCls(), br, +i)) { SFX.play('buff'); refresh(); } },
  respec: () => { if (resetTalents(ctxCls())) { toast("Tán công xong, đã hoàn lại điểm tâm pháp"); refresh(); } },
  para: a => { const [k, n] = split(a); if (addPara(k, +n)) { SFX.play('buff'); refresh(); achToast(checkAch()); } },
  parareset: () => { resetPara(); toast("Đã hoàn lại điểm tu vi"); refresh(); },
  autotal: () => { SAVE.autoTal = !autoTalOn(); let n = 0; if (autoTalOn()) for (const c of CLASS_IDS) n += autoTalent(c); toast(autoTalOn() ? `Tâm pháp bật lại tự cộng điểm${n ? `: vừa cộng giúp bạn ${n} điểm` : ''}` : "Tâm pháp chuyển sang tự mình cộng: muốn làm lại thì “Tán công tu lại”"); refresh(); },
  autopara: () => { SAVE.autoPara = !autoParaOn(); const n = autoParaOn() ? autoPara() : 0; toast(autoParaOn() ? `Tu vi bật lại tự cộng điểm${n ? `: vừa cộng giúp bạn ${n} điểm` : ''}` : "Tu vi chuyển sang tự mình cộng: muốn làm lại thì “Phân bổ lại”"); refresh(); },
  rune: a => { const [id, r] = split(a); setRune(ctxCls(), id, r); SFX.play('magic'); refresh(); },
  bldpick: i => { SAVE.chars[ctxCls()].bld = +i; refresh(); },
  gbhelp: () => { const prev = MODALFN; openModal(() => `<h2 class="mh">Giá đổ thạch tính thế nào</h2><p class="help-p">Giá gốc theo tầng Ảo Cảnh cao nhất bạn từng tới: ${GB_BASE} + tầng cao nhất × ${GB_PER} lượng (hiện tại ${fmtBig(gambleBase(SAVE.cls))}). Tiền trang Tiền Đa Đa mỗi cấp rẻ hơn 8%.</p><p class="help-p">Cược liền tay, mỗi lần đắt thêm ${GB_STEP * 100}%; đánh xong một lượt Ảo Cảnh thì về giá gốc.</p><p class="help-p">Ra hàng: phần nhiều Linh phẩm, Bảo phẩm, thỉnh thoảng ra Bộ, rất hiếm khi ra Thần binh.</p><div class="row" style="justify-content:center"><button class="btn" data-act="close">Hiểu rồi</button></div>`); BACK = prev; },
  bcinfo: a => { const prev = MODALFN, h = bcInfoModal(ctxCls(), a); if (!h) return; openModal(() => h); BACK = prev; },
  sanhelp: () => { const prev = MODALFN, c = ctxCls(); openModal(() => sanModal(c)); BACK = prev; },
  bldapply: i => { const r = applyBuild(ctxCls(), +i); if (!r) return; SFX.play('buff');
    toast(`Đã phối xong: mang ${r.sk} chiêu${r.miss ? ` (${r.miss} chiêu chưa học)` : ''}${r.cube ? `, Túi Càn Khôn đặt ${r.cube} món` : ''}${r.gems ? `, linh ngọc đặt ${r.gems} viên` : ''}`); refresh(); achToast(checkAch()); },
  skup: id => { moveSkill(ctxCls(), id, -1); refresh(); },
  skdn: id => { moveSkill(ctxCls(), id, 1); refresh(); },
  sksel: i => { SKSEL = i === 'basic' || i === 'ult' ? i : +i; refresh(); },
  skpick: i => { SKPK = null; const cls = ctxCls(); if (MODALFN) BACK = MODALFN; openModal(skPickModal(cls, +i)); },
  skpk: id => { SKPK = SKPK === id ? null : id; if (MODALFN) setSheet(MODALFN()); },
  skput: a => { const [i, id] = split(a), cls = ctxCls(), r = setSkillSlot(cls, +i, id); if (r === 'cat') return toast("Hai ô tự do đã dùng hết, hãy gỡ bớt một chiêu thừa trước"); SFX.play('buff'); const at = skSlots(cls, syncLoadout(cls)).indexOf(id); SKSEL = at >= 0 ? at : +i; SKPK = null; closeModal(); refresh(); },
  skoff: id => { equipSkill(ctxCls(), id); SFX.play('click'); refresh(); },
  skeq: id => { const cls = ctxCls(), r = equipSkill(cls, id); if (r === 'full') return toast(`Mang tối đa ${LOADOUT_MAX} võ học, tháo bớt một cái trước`);
    if (r === 'cat') { const c = skCat(cls, id); return toast(`Hai ô tự do đã dùng hết, không còn chỗ cho chiêu ${SK_CAT[c]} này: hãy gỡ bớt một chiêu thừa trước`); } SFX.play(r === 'on' ? 'buff' : 'click'); refresh(); },
  bclaim: i => { const r = claimBounty(+i); if (!r) return; SFX.play('legend'); save(); render(); openModal(rewardModal("Rương truy nã", r)); achToast(checkAch()); },
  bbonus: () => { const r = claimBountyBonus(); if (!r) return; SFX.play('legend'); save(); render(); openModal(rewardModal("Rương thưởng lớn", r)); achToast(checkAch()); },
  lgup: gid => { const ok = upgradeLgem(LASTRUN, gid); if (ok == null) return; SFX.play(ok ? 'legend' : 'fail'); toast(ok ? "Nâng linh ngọc thành công!" : "Nâng thất bại"); refresh(); achToast(checkAch()); },
  cell: i => { stopAuto(); walkTo(i); },
  bag: () => { stopAuto(); BACK = null; if (talentInfo(ctxCls()).free && !SAVE.stash.length) BAGTAB = 'tal'; openModal(bagModal()); },
  ult: () => { if (!B || B.over) return; STPOP = { ult: 1 }; drawStPop(); if ((B.P.rage || 0) < 100) return; B.ultReq = true; SFX.play('buff'); applyStep(null); if (B.waiting) { B.waiting = false; clearTimeout(timer); tick(); } },
  ultsw: () => { SAVE.ultAuto = SAVE.ultAuto === false; if (B) { B.ultAuto = SAVE.ultAuto; B.castAuto = SAVE.ultAuto; B.castReq = null; if (B.waiting && B.castAuto) { B.waiting = false; setTimeout(tick, 50); } else if (!B.castAuto) applyStep(null); } save(); const b = document.querySelector('.ultsw'); if (b) { b.classList.toggle('on', SAVE.ultAuto); b.innerHTML = SAVE.ultAuto ? "Tự động<br>ra chiêu" : "Thủ công<br>ra chiêu"; }
    toast(SAVE.ultAuto ? "Tự động ra chiêu: kỹ năng tự tung; bí kỹ đầy hai ô thì chỉ dùng ô thứ hai để cắt yêu vật tụ lực, muốn hiệu ứng tăng cường thì tự chạm «Bí kỹ»" : "Thủ công ra chiêu: chạm kỹ năng phía trên, chiêu sau nhân vật sẽ tung nó; không chạm thì dùng chiêu cơ bản. Nộ khí đầy thì chạm «Bí kỹ» (không tốn lượt)"); if (B) applyStep(null); },
  castq: id => { if (!B || B.over) return; const k = B.P.skills.find(x => x.id === id); if (!k) return;
    STPOP = B.castAuto && STPOP && STPOP.sk === id ? null : { sk: id }; drawStPop(); if (B.castAuto || k.left > 0) return; B.castReq = B.castReq === id ? null : id; SFX.play('click'); applyStep(null); if (B.waiting && B.castReq) { B.waiting = false; clearTimeout(timer); tick(); } },
  btarget: id => { if (!B || B.over) return; B.target = B.target === id ? null : id; SFX.play('click'); applyStep(null); },
  wgo: (id, el, cont) => {
    const ch = wch(), q = wTracker(ch).find(x => x.id === id); if (!q) { WGOAL = null; return; }
    if (!cont) WGOAL = { id, hops: 0 }; else if (!WGOAL) return;
    wStopAuto(); clearTimeout(WALK && WALK.h); WALK = null;
    { const p0 = wMarkPos(ch, q); if (p0 && p0.comp) { WGOAL = null; return ACT.wtalkc(); } }   // 要找的人就跟在身边：直接搭话
    if (wWatchBlock(ch)) { WGOAL = null; return qtoast("Chỗ này có người tuần tra, tự tìm đường vô dụng — tự lần mò qua đi"); }
    let todOff = false;
    { const MS = WQ[ch].main.find(m => m.id === id), nt = !!wstate(ch).flags.night;   // 昼夜：时辰不对，找不着人
      if (WMAPS[ch].daynight && MS && MS.tod && (MS.tod === 'night') !== nt && !cont) { todOff = true; qtoast(MS.tod === 'night' ? "Việc này phải đợi trời tối — nghỉ chân bên lửa trại là trời tối" : "Việc này phải đợi trời sáng — nghỉ chân bên lửa trại là trời sáng"); } }
    const p = wMarkPos(ch, q), R = p && wRoute(ch, p);
    if (todOff && wNearCamp(ch)) { WGOAL = null; return wGoCamp(ch); }   // 时辰不对，去了也白去：带去最近的篝火歇一歇
    if (!p) { WGOAL = null; return wStartAuto(); }
    if (!R) { WGOAL = null; return qtoast("Đường bên đó giờ chưa đi được"); }
    if (R.puzzle) {   // 被谜题挡住：走到边上停下，剩下的自己来
      WGOAL = null; WTAP = { x: R.x, y: R.y, t: 0 };
      const msg = R.who ? `${R.who} mắt đờ đẫn chắn ngay lối đi — lại gần chạm vào người đó xem` : R.puzzle === "Lạc đường" ? "Đường trong rừng phải tự tìm — cửa nào đi qua một lần mới nhớ" : R.puzzle === "Tuần tra" ? "Phía trước có người tuần tra, phải tự lần qua" : `Phía trước là ${R.puzzle}, phải tự đi`;
      if (!R.path.length) return qtoast(msg);
      WALK = { path: R.path, i: 0, onArrive: () => qtoast(msg) }; return wStepLoop();
    }
    WTAP = { x: R.x, y: R.y, t: 0 };
    let done = null;
    if (!R.door) {
      if (p.area) done = () => { WGOAL = null; qtoast("Chính là vùng này, tìm quanh xem"); wStartAuto(p.zone || wmap(ch).zoneAt(wstate(ch).pos.x, wstate(ch).pos.y).id); };
      else { const act = wInteract(ch, p.x, p.y); done = () => { WGOAL = null; if (act) act(); }; }
    }
    if (R.near) {
      if (!R.path.length) { if (p.area && !R.door) return done(); WGOAL = null; return qtoast(R.fence ? "Đường bị hàng rào chặn — gần đây có cơ quan, thử dẫm lên xem" : "Con đường này chưa dò ra, thử “Tự khám phá” xem"); }
      qtoast(R.plate ? "Đường bị hàng rào chặn — thử dẫm lên cái cơ quan kia xem" : R.fence ? "Đường bị hàng rào chặn — gần đây có cơ quan, thử dẫm lên xem" : "Đường phía trước chưa dò, đi về hướng đó trước");
      WALK = { path: R.path, i: 0, onArrive: p.area && !R.door ? done : () => { if (WGOAL) setTimeout(() => ACT.wgo(id, null, true), 200); } }; return wStepLoop();
    }
    if (!R.path.length) { if (done) return done(); WGOAL = null; return; }
    WALK = { path: R.path, i: 0, onArrive: done }; wStepLoop();
  },
  wtrk: () => { WTRK = !WTRK; render(); },
  bpot: () => { if (!B || B.over) return; const o = { pops: [], lines: [] }; if (!drinkPotion(B, o)) return toast(SAVE.run.potions <= 0 ? "Đã hết đan dược" : "Khí huyết đang đầy, không cần uống"); SFX.play('heal'); applyStep(o, true); save(); },
  bhgo: id => { BACK = null; closeModal(); WTRK = true; render(); ACT.wgo(id); },
  shoptab: k => { SHOPTAB = k; SHOPMSG = ''; SHOPSEL = -1; openModal(shopModal); },
  shopsel: i => { SHOPSEL = SHOPSEL === +i ? -1 : +i; openModal(shopModal); },
  shopbuy: i => { const r = wShopBuy(shopCh(), SHOPID, +i, SAVE.run); SHOPMSG = r.err ? `<span class="bad">${esc(r.err)}</span>` : esc(r.ok); SFX.play(r.err ? 'fail' : r.item && (r.item.rarity === 'legend' || r.item.rarity === 'set') ? 'legend' : 'coin'); save();
    if (r.acts && r.acts.length) { closeModal(); wRun(r.acts); } else openModal(shopModal); },
  shopsell: id => { const r = wShopSell(shopCh(), SHOPID, id); SHOPMSG = r.err ? `<span class="bad">${esc(r.err)}</span>` : esc(r.ok); SFX.play(r.err ? 'fail' : 'coin'); save(); openModal(shopModal); },
  shoproll: id => { const r = wShopReroll(shopCh(), SHOPID, id); SHOPMSG = r.err ? `<span class="bad">${esc(r.err)}</span>` : esc(r.ok); SFX.play(r.err ? 'fail' : 'magic'); save(); openModal(shopModal); },
  eat: id => { const F = wEat(SAVE.run, id); closeModal(); if (F) { SFX.play('buff'); qtoast(`Đã ăn “${esc(F.n)}”: ${esc(F.d)} (hiệu lực đến lần nghỉ sau)`); } save(); refresh(); },
  wtalkc: () => { const ch = wch(), cc = wCompNow(ch); if (!cc) return; wStopAuto(); wRun(wTalk(ch, cc, SAVE.run)); },
  wyin: () => { WALK = null; wStopAuto(); wRun(wYinToggle(wch())); },
  wauto: () => { WGOAL = null; MAPGOAL = null; if (isRift(SAVE.run)) { SAVE.rAuto = !WAUTO; RDEATH = 0; save(); } if (WAUTO) return wStopAuto(); wStartAuto(); },
  rquit: () => { wStopAuto(); openModal(() => `<h2 class="mh">Rời Ảo Cảnh?</h2><p class="help-p">Ván này dừng ở đây: trang bị, kinh nghiệm đã nhận đều giữ lại, nhưng không được nâng linh ngọc, cũng không tính kỷ lục.</p>
    <div class="row" style="justify-content:center"><button class="btn" data-act="rquitgo">Rời đi</button><button class="btn ghost" data-act="close">Đánh tiếp</button></div>`); },
  rquitgo: () => { const r = SAVE.run; BACK = null; closeModal(); WALK = null; finishRunView(r, 'retreat'); },
  wlog: () => { wStopAuto(); BACK = null; openModal(questModal()); },
  wrecap: () => { const ch = wch(); closeModal(); playDialog(recapLines(ch), null); },
  wreplay: i => { const ch = wch(), m = WQ[ch].main[+i]; if (!m) return; const L = [...(wLines(ch, m.lines) || []), ...(wLines(ch, m.after) || [])]; closeModal(); if (L.length) playDialog([['narr', `【Xem lại · ${m.t}】`], ...L], null); },
  wmini: () => { if (!isRift(SAVE.run)) wStopAuto(); BACK = null; openModal(miniModal()); drawMini(); },   // 幻境里看一眼地图不打断自动闯关（关上接着走）
  minigo: k => { const ch = wch(), S = wstate(ch), D = wScene(ch), m = wmap(ch);
    const T = k === 'boss' ? D.mons.find(o => o.boss) : k === 'exit' ? (m.pts['2'] || [])[0] : (D.orbs || []).slice().sort((a, b) => wdist(a, S.pos) - wdist(b, S.pos))[0];
    if (!T) return qtoast("Giờ không có chỗ nào để đi"); miniWalk(T.x, T.y); },
  maptab: k => { MAPTAB = k; if (MODALFN) { sheet.innerHTML = MODALFN(); drawMini(); } },
  mapgo: sc => {
    const ch = wch(), S = wstate(ch), blk = wTeleBlock(ch); if (blk) return toast(blk);
    const L = wLitCamps(ch, sc); if (!L.length) return toast("Bên đó chưa nhóm lửa trại");
    const id = L.includes(S.camp) ? S.camp : L[0]; if (!S.camps.includes(id)) S.camps.push(id);
    clearTimeout(WALK && WALK.h); WALK = null; wStopAuto(); ACT.wtele(id);
  },
  wrest: () => { const ch = wch(), acts = wRest(ch, SAVE.run); save(); SFX.play('heal'); closeModal(); render(); qtoast("Nghỉ một lát. Khí huyết và đan dược đã đầy, yêu vật quanh đây cũng quay lại rồi"); if (acts.length) wRun(acts); },
  wtele: id => { wTele(wch(), id); WHERO = null; WGOAL = null; closeModal(); render(); SFX.play('door'); banner(WMAPS[wch()].scenes[wstate(wch()).sc].n, wCampName(wch(), id), 1100); },
  dgo: () => { const d = DOSS; DOSS = null; if (d) d.go(); },
  dback: () => { const d = DOSS; DOSS = null; if (d) d.back(); else closeModal(); },
  wmenu: () => { closeModal(); WGOAL = null; wStopAuto(); VIEW = 'town'; TT = 'go'; save(); render(); window.scrollTo(0, 0); },
  wcomp: c => { SAVE.comp = c; save(); refresh(); qtoast(`Lần này dẫn ${COMPANIONS[c].n} đi cùng`); },
  lang: (arg) => { if (arg === (window.LANG || 'zh')) return; save(); try { localStorage.setItem('abyss_lang', arg); } catch (e) {} location.reload(); },
  fs: () => { const o = [0.9, 1, 1.15, 1.3]; SAVE.fs = o[(o.indexOf(SAVE.fs || 1) + 1) % o.length]; applyFs(); save(); refresh(); },
  guide: () => { SAVE.guide = SAVE.guide === 'full' ? 'clue' : 'full'; save(); refresh(); toast(SAVE.guide === 'full' ? "Chỉ dẫn nhiệm vụ: Chi tiết (đánh dấu thẳng vị trí mục tiêu)" : "Chỉ dẫn nhiệm vụ: Manh mối (chỉ nói đại khái ở vùng nào)"); },
  joy: () => { SAVE.joy = !SAVE.joy; save(); render(); },
  gfxq: () => { SAVE.gfx = ((SAVE.gfx != null ? SAVE.gfx : 2) + 1) % 3; save(); if (SAVE.gfx !== 0 && document.getAnimations) document.getAnimations().forEach(a => { if (a.playState === 'paused') a.play(); }); refresh(); },
  cine: () => { SAVE.cineOff = !SAVE.cineOff; save(); refresh(); },
  autocast: () => { SAVE.ultAuto = SAVE.ultAuto === false; save(); refresh(); toast(SAVE.ultAuto ? "Tự động ra chiêu khi đánh" : "Ra chiêu thủ công: đến lượt ngươi thì chạm chiêu, nhân vật ra chiêu đó; chạm chiêu cũng xem được mô tả"); },
  allnums: () => { SAVE.allNums = !SAVE.allNums; save(); refresh(); },
  hdpx: () => { SAVE.hdOff = !SAVE.hdOff; save(); render(); },
  comp: c => { SAVE.comp = c; save(); refresh(); toast(`Lần này dẫn ${COMPANIONS[c].n} đi cùng: ${COMPANIONS[c].d}`); },
  speed: s => { SAVE.speed = Math.min(3, +s); VFX.setSpeed(+s); save(); document.querySelectorAll('#spdc [data-act=speed]').forEach(b => b.classList.toggle('on', b.dataset.arg === String(s))); schedule(); },
  stinfo: a => { const [id, k] = String(a).split('|'); STPOP = STPOP && STPOP.id === id && STPOP.k === k ? null : { id, k }; drawStPop(); },
  stclose: () => { STPOP = null; drawStPop(); },
  statfull: () => { STPOP = STPOP && STPOP.full ? null : { full: true }; drawStPop(); },
  kitedit: i => { const prev = MODALFN; openModal(kitModal(+i)); if (prev === kitsModal) BACK = prev; },
  kitsave: i => { const el = document.getElementById('kitn'); const k = kitSave(SAVE.cls, +i, el && el.value.trim()); SFX.play('buff'); closeModal(); save(); refresh(); toast(`Đã lưu: <b>${esc(k.n)}</b>`); },
  kitdel: i => { kitsOf(SAVE.cls)[+i] = null; closeModal(); save(); refresh(); toast("Đã xóa bộ phối đồ này (trang bị vẫn còn)"); },
  kituse: i => { const r = kitUse(SAVE.cls, +i); if (r.err) return toast(r.err); SFX.play('loot'); save(); refresh();
    const k = kitsOf(SAVE.cls)[+i]; toast(`Đã thay "<b>${esc(k.n)}</b>"${r.miss.length ? `. Không tìm thấy: ${r.miss.join(", ")} (các ô này giữ nguyên)` : ''}${r.away.length ? `. Có trang bị đang mặc trên người ${r.away.join(", ")}, không lấy qua` : ''}${r.gmiss && r.gmiss.length ? `. Thiếu ${r.gmiss.length} viên ngọc: ${gemMissTxt(r.gmiss)} (lỗ để trống)` : ''}`); },
  skip: () => skipBattle(),
  bcont: () => battleContinue(),
  choice: i => { EVRES = resolveEvent(SAVE.run, curCell(SAVE.run).ev, +i); if (!EVRES.fight) clearCell(SAVE.run); SFX.play(EVRES.items && EVRES.items.length ? 'loot' : 'magic'); refresh(); },
  evcont: () => { const run = SAVE.run;
    if (run.world) { if (EVRES && EVRES.fight) { const z = wmap(run.chapter).zoneAt(wstate(run.chapter).pos.x, wstate(run.chapter).pos.y); const r = WKEY && WKEY.rest; WKEY = { key: {}, rest: r || [] }; return beginWorldBattle({ kind: EVRES.fight === 'elite' ? 'elite' : 'battle', mon: RNG.pick(z.mons.length ? z.mons : [0]), lv: z.lv, first: 'p' }); } return wBack(); }
    if (EVRES && EVRES.fight) return beginBattle(EVRES.fight); VIEW = 'map'; refresh(); },
  buy: i => {
    const x = curCell(SAVE.run).shop.items[+i];
    if (x.sold || SAVE.gold < x.price) return;
    SAVE.gold -= x.price; x.sold = true; storeItem(SAVE.run, x.it); SFX.play('coin'); toast("Đã mua " + x.it.name); closeModal(); refresh();
  },
  buygem: () => { const g = curCell(SAVE.run).shop.gem; if (g.sold || SAVE.gold < g.price) return; SAVE.gold -= g.price; g.sold = true; addGem(g.key); SFX.play('rare'); refresh(); },
  potion: () => { const sh = curCell(SAVE.run).shop; if (!sh.potion || SAVE.gold < sh.potion) return; SAVE.gold -= sh.potion; SAVE.run.potions++; SFX.play('coin'); refresh(); },
  leave: () => { if (SAVE.run && SAVE.run.world) return wBack(); VIEW = 'map'; refresh(); },
  rest: k => { if (k === 'heal') EV.heal(SAVE.run, 0.45); else EV.buff(SAVE.run, 'dmgPct', 10); clearCell(SAVE.run); SFX.play(k === 'heal' ? 'heal' : 'forge'); toast(k === 'heal' ? "Hồi 45% khí huyết" : "Chuyến này sát thương +10%"); VIEW = 'map'; refresh(); },
  skiptog: () => { SAVE.showSkip = !SAVE.showSkip; save(); refresh(); },
  snd: () => { SAVE.sound = !SAVE.sound; SFX.set(SAVE.sound, SAVE.music); refresh(); },
  mus: () => { SAVE.music = !SAVE.music; SFX.set(SAVE.sound, SAVE.music); refresh(); },
  mtest: k => {
    const M = k === 'boss' ? { key: 'c1', kind: 'field', fight: 'boss' } : k === 'battle' ? { key: 'c1', kind: 'field', fight: 'battle' } : k === 'town' || k === 'sad' ? { key: k } : /^c\d+$/.test(k) ? { key: k, kind: 'field' } : null;
    if (!M) { MTEST = null; SFX.audition(curMood()); return refresh(); }
    if (!SAVE.music) { SAVE.music = true; save(); toast("Đã bật nhạc nền"); }
    SFX.ensure(); SFX.set(SAVE.sound, true); MTEST = { id: k, m: M }; SFX.audition(M); refresh();
  },
  export: async () => {
    markBackup(); persist(true); const code = ZCODE || exportSave();
    const done = () => { toast(`Đã sao chép mã lưu (${code.length} ký tự), hãy dán vào chỗ nào đó để cất`); const m = document.querySelector('.bk-now small'); if (m) m.textContent = `Sao lưu lần trước: ${fmtDay(SAVE.bk.t)}`; document.querySelectorAll('.bk-nudge').forEach(x => x.remove()); };
    try { await navigator.clipboard.writeText(code); done(); }
    catch (e) { const t = $('#imp'); if (!t) return ACT.tsave(), setTimeout(ACT.export, 50);
      t.value = code; t.focus(); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      if (ok) done(); else toast("Không tự sao chép được: mã lưu đã nằm trong ô bên dưới, hãy nhấn giữ, chọn tất cả rồi sao chép"); }
  },
  bkfile: async () => {
    markBackup(); persist(true); const code = ZCODE || exportSave(), b = saveBrief(SAVE), d = new Date(), z = n => String(n).padStart(2, '0');
    const name = `jiuyou-save-${b.cls}-lv${b.lv}-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}.txt`;
    try { const file = new File([code], name, { type: 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: "Bản lưu Cửu U Hồi Lang" }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      toast("Đã tạo tệp lưu. Nếu không thấy hiện lưu hoặc chia sẻ, hãy dùng “Sao chép mã lưu”");
    } catch (e) { toast("Trình duyệt này không lưu tệp được, hãy dùng “Sao chép mã lưu”"); }
  },
  bkpick: () => { const f = $('#bkf'); if (!f) return; f.onchange = () => { const file = f.files && f.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => tryImport(String(rd.result || '')); rd.onerror = () => toast("Không đọc được tệp"); rd.readAsText(file); f.value = ''; }; f.click(); },
  redeem: () => { const v = ($('#rdmIn') || {}).value || ''; if (!v.trim()) return toast("Hãy nhập mã đổi thưởng trước"); const r = redeemCode(v); if (r.err) return toast(r.err);
    save(); SFX.play('forge'); toast(r.mount ? `Đổi thành công: thú cưỡi “<b>${MOUNTS[r.mount].n}</b>”, đã cưỡi lên rồi` : `Đổi thành công: ${({ M: "Hồn tinh", G: "Bạc", X: "Cửu U Huyền Tinh" })[r.k]} +${fmtBig(r.n)}`); refresh(); },
  import: () => { const v = ($('#imp') || {}).value || ''; if (!v.trim()) return toast("Hãy dán mã lưu vào ô trước"); tryImport(v); },
  imcancel: () => { IMPORTING = null; closeModal(); },
  doimport: () => { if (!IMPORTING) return; clearOverlays(); SAVE = IMPORTING; IMPORTING = null; persist(true); toast("Đã khôi phục, đang tải lại…"); setTimeout(() => location.reload(), 500); },
  bknudge: () => { ACT.tsave(); },
  tcls: c => { TCLS = c; refresh(); },
  home: () => { stopAuto(); closeModal(); VIEW = 'title'; render(); window.scrollTo(0, 0); },
  tcont: () => { closeModal(); if (SAVE.run) { ACT.resume(); return snowCatchUp(); } VIEW = 'town'; TT = 'go'; render(); window.scrollTo(0, 0); playPrologue(); snowCatchUp(); },
  tnew: () => openModal(resetModal()),
  ttest: () => openModal(() => `${testPanel()}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-act="close">Đóng</button></div>`),
  tsave: () => openModal(() => `${setSave()}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-act="close">Đóng</button></div>`),
  tset: () => openModal(() => `${setBasic()}${testFold()}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-act="close">Đóng</button></div>`),
  tstart: c => {
    const ch = parseInt(c, 10), inter = /i$/.test(c), cls = TCLS || SAVE.cls;
    if (!SAVE.test) { const raw = JSON.stringify(SAVE); TEST_BAK = raw; try { localStorage.setItem(TEST_BACKUP_KEY, raw); } catch (e) {} }
    stopAuto(); clearTimeout(timer); clearOverlays();
    SAVE = makeTestSave(cls, ch, inter); ensureBounties(); persist(); BACK = null; closeModal(); VIEW = 'town'; TT = 'go';
    render(); toast(`Nhân vật chơi thử: ${CLASSES[cls].n} cấp ${SAVE.chars[cls].level}, bắt đầu từ chương ${ch}${inter ? " màn chuyển" : ''}`);
    setTimeout(() => ACT.start(), 300);
  },
  trestore: () => {
    const raw = testBackup() || TEST_BAK; if (!raw) return toast("Không tìm thấy bản lưu dự phòng");
    clearOverlays();
    try { SAVE = migrate(JSON.parse(raw)); } catch (e) { return toast("Bản lưu dự phòng không đọc được"); }
    try { localStorage.removeItem(TEST_BACKUP_KEY); } catch (e) {} TEST_BAK = null;
    persist(); BACK = null; closeModal(); VIEW = 'town'; TT = 'set'; render(); toast("Đã về bản lưu của bạn");
  },
  reset: () => openModal(resetModal()),
  doreset: () => { clearOverlays(); SAVE = newSave(); ensureBounties(); persist(); BACK = null; closeModal(); VIEW = 'title'; render(); toast("Đã bắt đầu lại: chọn một con đường"); },
  tpath: p => { CPICK = p === 'rift' ? 'rift' : 'story'; BACK = null; openModal(clsPickModal); },   // 新开局：先挑门派（原来默认狂刀客，新人不知道还有另外四个）
  clspick: c => { if (!CLASSES[c]) return; const p = CPICK || 'story'; CPICK = null; SAVE.cls = c; markSeen('clspick');
    SAVE.path = p; if (p === 'rift') { SAVE.mode = 'rift'; SAVE.riftLv = 1; } save(); closeModal(); VIEW = 'town'; TT = 'go'; render(); window.scrollTo(0, 0); if (p === 'rift') playRiftIntro(); else playPrologue(); },
  clstip: () => { markSeen('clstip'); refresh(); },
  topath: () => openModal(toPathModal),
  setpath: () => { SAVE.path = 'rift'; SAVE.mode = 'rift'; save(); closeModal(); refresh(); playRiftIntro(true); },
  rpath: () => openModal(rpathModal),
};
let musicStarted = false;
// 音量滑条：拖动时马上生效，松手时存档
document.addEventListener('input', e => { const el = e.target.closest && e.target.closest('[data-vol]'); if (!el) return; const v = (+el.value || 0) / 100; SAVE.mvol = v; SFX.vol(v); const b = document.querySelector('#mvolv'); if (b) b.textContent = Math.round(v * 100) + '%';
  if (v > 0 && !SAVE.music) { SAVE.music = true; SFX.ensure(); SFX.set(SAVE.sound, true); } });
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('[data-vol]')) save(); });
document.addEventListener('click', e => {
  if (!musicStarted) { musicStarted = true; SFX.ensure(); if (SAVE.music) SFX.set(SAVE.sound, true); }
  if (DLG) { if (e.target.closest('.dlg-skip')) endDlg(); else nextLine(); return; }
  const t = e.target.closest('[data-act]');
  if (!t || t.disabled) return;
  const f = ACT[t.dataset.act]; if (!f) return;
  if (!['cell', 'skip', 'speed', 'npc', 'logt'].includes(t.dataset.act)) SFX.play('click');
  f(t.dataset.arg, t);
});
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
const KEYS = new Set(), KEYDIR = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
function keyDir() { let x = 0, y = 0; for (const k of KEYS) { x += KEYDIR[k][0]; y += KEYDIR[k][1]; } x = Math.sign(x); y = Math.sign(y); return x || y ? [x, y] : null; }
document.addEventListener('keyup', e => { if (!KEYDIR[e.key]) return; KEYS.delete(e.key); JOY = keyDir(); });
window.addEventListener('blur', () => { KEYS.clear(); JOY = null; });
document.addEventListener('keydown', e => {
  if (VIEW === 'world' && !DLG && !MODALFN && KEYDIR[e.key]) { e.preventDefault(); if (!KEYS.has(e.key)) { KEYS.add(e.key); wStopAuto(); keyDir(); if (!JOY) { JOY = keyDir(); wJoyStep(); } } return; }
  if (DLG && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); nextLine(); return; }
  if (DLG && e.key === 'Escape') { endDlg(); return; }
  if (e.key === 'Escape' && MODALFN) closeModal();
});


// 当前该放什么配乐
function curMood() {
  const run = SAVE.run;
  if (MTEST) { if (VIEW === 'town' || VIEW === 'title') return MTEST.m; MTEST = null; }
  if (VIEW === 'end' || VIEW === 'credits') return { key: 'sad' };
  if (!run || VIEW === 'town') return { key: 'town' };
  const ch = run.chapter || 1, key = 'c' + (isRift(run) && !run.ended ? wmap(RCH).def.rift.c : Math.min(10, ch));   // 幻境：这一层是从哪一章抄来的，就放哪一章的曲子
  if (VIEW === 'battle' && B) return { key, kind: 'field', fight: B.kind === 'boss' ? 'boss' : 'battle' };
  if (run.world && wHas(ch)) { const D = wmap(ch).def, T = SCENE_THEMES[D.theme] || {}; if (T.kind === 'town') return { key: 'town' }; return { key: D.music || key, kind: T.kind === 'room' ? 'room' : T.kind === 'dungeon' ? 'dungeon' : 'field' }; }
  return { key, kind: 'dungeon' };
}
function render() {
  if (VIEW !== 'town' && VIEW !== 'title' && VIEW !== 'end' && VIEW !== 'credits' && !SAVE.run) VIEW = 'town';
  if (VIEW === 'map' && SAVE.run && SAVE.run.world) VIEW = 'world';
  const html = { title: titleHTML, town: townHTML, world: worldHTML, map: mapHTML, battle: battleHTML, event: eventHTML, shop: shopHTML, rest: restHTML, chest: chestHTML, end: endHTML, credits: creditsHTML }[VIEW]();
  const keepS = {}; app.querySelectorAll('[data-scroll]').forEach(e => { keepS[e.dataset.scroll] = e.scrollTop; });   // 框里滚到哪儿，重画以后还在哪儿
  app.innerHTML = html;
  document.body.dataset.view = VIEW; document.body.classList.toggle('fx0', SAVE.gfx === 0); fxSweep(); fitKstats(); riftPathCheck();
  app.querySelectorAll('[data-scroll]').forEach(e => { const v = keepS[e.dataset.scroll]; if (v) e.scrollTop = v; });
  if (VIEW === 'town' && SAVE.flags && !SAVE.flags.yiTip && featureOn('rift') && !(SAVE.chars[SAVE.cls].yi || []).length && Object.keys(YISHI).some(k => yiGrade(k))) { SAVE.flags.yiTip = 1; save(); setTimeout(() => toast("Bạn đã thu phục tinh phách thủ lĩnh, có thể mang hai <b>Dịch Sứ</b> ra trận (ô “Dịch Sứ” trong bảng Ảo Cảnh). Mang rồi chúng sẽ theo bên cạnh bạn, khi bản lĩnh kích hoạt sẽ lóe sáng."), 900); }
  if (VIEW === 'town' || VIEW === 'end') { const met = compMeetCheck(); if (met.length) { save(); met.forEach((c, i) => setTimeout(() => toast(`Đồng hành mới: <b>${COMPANIONS[c].n}</b> (${COMPANIONS[c].role}) đồng ý theo bạn vào Ảo Cảnh. Vào mục “Đồng hành” trong bảng Ảo Cảnh để mang theo.`), 600 + i * 2800)); } }
  if (VIEW === 'battle') { VFX.setup($('#arena'), SAVE.speed); if (typeof GFX !== 'undefined' && SAVE.run) { const T0 = SAVE.run.world && SCENE_THEMES[SAVE.run.sth || SAVE.run.theme]; GFX.ambient((T0 || terrainOf(SAVE.run) || {}).wx); } applyStep(null); showRes(); } else VFX.setup(null);
  if (VIEW === 'world') wSetup();
  try { SFX.mood(curMood()); } catch (e) {}
  if (VIEW === 'map' && AUTO && !WALKING) { clearTimeout(autoT); autoT = setTimeout(autoStep, 420); }
  if (VIEW !== 'map') WALKING = false;
}
VIEW = 'title';
try { if (autoAllot()) persist(true); } catch (e) {}   // 自动加点：没用掉的心法、修为点先加上
render();
setTimeout(() => { try { lbSync(); } catch (e) {} }, 5000);   // 排行榜：开游戏时把没传过的纪录补上
setTimeout(() => { try { csBoot(); } catch (e) {} }, 2500);   // 云存档：先对一下云上的，再开始自动上传
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { try { csUpload(false, true); } catch (e) {} } });   // 切到后台、关页面时补传一次
initCloud();
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}   // 请浏览器别在空间紧张时自动清掉存档
if (SAVE.lgems && SAVE.lgems.some(g => g.t === 'reforge')) setTimeout(() => { if (!MODALFN && VIEW !== 'battle' && !DLG) openModal(lgReModal); }, 2200);   // 老灵玉待重铸：进游戏先弹一次
setTimeout(formNotify, 1800);   // 老存档：进度够的阵直接学会
if (SAVE.lgCut) { const L = SAVE.lgCut; delete SAVE.lgCut; save(); setTimeout(() => toast(`Giới hạn cấp linh ngọc đổi thành <b>${LGEM_CAP}</b>: ${L.map(([n, v]) => `${n} ${v} → ${LGEM_CAP}`).join(", ")}. Khi tất cả đã tối đa, lượt nâng linh ngọc lúc quyết toán Ảo Cảnh sẽ đổi thành kinh nghiệm Tu vi`, 7000), 900); }
if (SAVE.paraUp2) { const [a0, a1] = SAVE.paraUp2; delete SAVE.paraUp2; save(); setTimeout(() => toast(`Tu vi lên cấp lại nhanh gấp đôi, kinh nghiệm cày trước đây đã được bù theo chuẩn mới: cấp <b>${a0}</b> → cấp <b>${a1}</b>. Tu vi năm môn phái dùng chung, điểm dư ra hãy cộng ở 「Nhân vật · Tu vi」`, 6500), 1200); }
if (SAVE.paraUp) { const [a0, a1] = SAVE.paraUp; delete SAVE.paraUp; save(); setTimeout(() => toast(`Tu vi lên cấp nhanh gấp hai mươi lần, kinh nghiệm cày trước đây đã được bù theo chuẩn mới: cấp <b>${a0}</b> → cấp <b>${a1}</b>, điểm dư cộng ở “Tu luyện · Tu vi”`, 6000), 1200); }
if (SAVE.story.ended && seen('postg') && seen('npcsvc') && !seen('boxnote')) { markSeen('boxnote'); if (!SAVE.gearNote) setTimeout(() => { if (!MODALFN && VIEW !== 'battle') openModal(boxNoteModal); }, 1400); }
if (SAVE.story.ended && seen('postg') && !seen('npcsvc')) { markSeen('npcsvc'); if (!SAVE.gearNote) setTimeout(() => { if (!MODALFN && VIEW !== 'battle') openModal(svcNoteModal); }, 1400); }
// 减法改版（2026-11-26）：老存档第一次打开，说一遍改了什么、这份存档动了哪里
const slimNoteModal = () => { const N = SAVE.slimNote || {};
  return `<h2 class="mh">Bản này đã lược bớt</h2><div class="slimbox">
    <p class="help-p">Thứ quá nhiều, chỗ để mạnh lên cũng quá nhiều, bản này gom gọn lại. <b>Mạnh lên chỉ còn bốn đường: trang bị, lưu phái, linh ngọc, tu vi.</b></p>
    <ul class="help slimn">
      <li><b>Cường hóa, lỗ, ngọc ghi trên vị trí</b>: đổi trang bị không mất, bỏ truyền thừa.</li>
      <li><b>Các trang</b>: Xuất chinh｜Nhân vật｜Túi đồ｜Tu luyện｜Giang Hồ Lục, cài đặt ở bánh răng góc trên bên phải. Bấm một món trang bị, trên cùng là Cường hóa, Tẩy luyện, Điểm hóa, Khảm ngọc.</li>
      <li><b>Gộp lại</b>: tôi luyện gộp vào tẩy luyện, thăng giai gộp vào điểm hóa; ngọc bậc thấp tự ghép, thêm nút “Khảm ngọc tốt nhất”.</li>
      <li><b>Cất tạm, sau này mở lại</b>: trận pháp, Trấn Yêu Lục, Cửu U, tăng độ khó. Dịch Sứ vẫn còn, ở trang xuất chinh.</li>
      <li><b>Tâm pháp, tu vi mặc định tự cộng điểm</b>, muốn tự cộng thì tắt ở trang tu luyện.</li>
    </ul>
    <p class="help-p"><b>Bản lưu của bạn</b>: tính năng đã mở đều còn nguyên${N.jy ? `; ${N.jy} món Cửu U tạm dùng như Thái Cổ, dòng thuộc tính giữ nguyên, khi Cửu U mở lại sẽ trở về như cũ, Huyền Tinh cũng được giữ cho bạn` : ''}${N.mats || N.gold ? `; cường hóa và lỗ trên trang bị trong túi đồ được hoàn thành <b>${fmtBig(N.mats || 0)}</b> hồn tinh, <b>${fmtBig(N.gold || 0)}</b> lượng` : ''}${N.gems ? `, ${N.gems} viên ngọc trả về túi ngọc` : ''}; kỷ lục Ảo Cảnh và bảng xếp hạng ghi lại từ đầu (kỷ lục cũ vẫn xem được ở “Giang Hồ Lục → Kỷ lục”).</p></div>
    <div class="row" style="justify-content:center"><button class="btn" data-act="slimok">Đã hiểu</button></div>`; };
if (SAVE.slimNote) setTimeout(() => { if (!MODALFN && VIEW !== 'battle' && SAVE.slimNote) openModal(slimNoteModal); }, 1200);
if (SAVE.gearNote) { delete SAVE.gearNote; persist(); setTimeout(() => openModal(() => `<h2 class="mh">Dòng thuộc tính trang bị đã đổi luật</h2>
  <p class="help-p">Trước đây các dòng phần trăm như chí mạng, sát thương chí mạng, sát thương, thuật pháp cứ tăng theo cấp trang bị, bảy món cộng dồn lại khiến thủ lĩnh về sau vài chiêu là gục. Giờ đổi thành thế này:</p>
  <p class="help-p">Một, biên độ của dòng phần trăm cố định, không tăng theo cấp nữa; về sau mạnh lên nhờ các chỉ số thực như công, khí huyết, hộ giáp.</p>
  <p class="help-p">Hai, mỗi loại dòng chỉ xuất hiện ở vài vị trí cố định: dòng tấn công nằm trên binh khí, hộ uyển, nhẫn, ngọc bội; dòng phòng thủ chủ yếu nằm trên mũ, áo giáp, giày. Mỗi món tối đa hai dòng tấn công.</p>
  <p class="help-p">Ba, binh khí, hộ uyển, nhẫn, ngọc bội bậc Bảo phẩm chắc chắn có hai dòng tấn công; mức thấp nhất của các dòng cũng được nâng lên, khó ra đồ bỏ đi.</p>
  <p class="help-p">Bốn, cường hóa chỉ cộng chỉ số thực.</p>
  <p class="help-p">Trang bị cũ của bạn đã được quy đổi theo luật mới: dòng phần trăm thu nhỏ lại, dòng không hợp lệ được đổi thành công, khí huyết hoặc hộ giáp với cùng phẩm chất. Yêu vật cũng được giảm sức tương ứng — với trang bị bình thường, độ khó vẫn như cũ; thủ lĩnh giữ ải ở Hang Băng Côn Lôn và Chợ Ma U Minh cứng hơn trước một chút.</p>
  <div class="row" style="justify-content:center"><button class="btn" data-act="close">Đã hiểu</button></div>`), 900); }
if (SAVE.respec4) { delete SAVE.respec4; persist(); setTimeout(() => toast("Năm môn phái đã được làm lại: điểm tâm pháp hoàn trả hết, chiêu thức cũng được sắp lại. Vào “Tu luyện” xem tâm pháp và chiêu thức mới, Cản Thi Nhân nhớ xếp “Thi trận”"), 1200); }
window.__abyss = { get SAVE() { return SAVE; }, get B() { return B; }, pause: () => clearTimeout(timer), mini: (id, f) => playMini(id, f), get WHERO() { return WHERO; }, get WGOAL() { return WGOAL; }, get WAUTO() { return WAUTO; }, ACT, fightw: e => beginWorldBattle(e), wbusy: () => !!WALK, maxhp: () => runStats(SAVE.run).maxHp, wtr: () => { const ch = SAVE.run && SAVE.run.world && SAVE.run.chapter; if (!ch) return []; return wTracker(ch).map(q => ({ t: q.t, town: wMarkPos(ch, q.mark) === 'town' })); }, fight: k => beginBattle(k), get WALKING() { return WALKING; }, get B() { return B; }, get VIEW() { return VIEW; }, get DLG() { return DLG; }, endDlg, wRun: a => wRun(a), dbg: { dlg: l => playDialog(l, null, null), render: () => render(), save: () => save(), view: v => { VIEW = v; }, finish: (r, o) => finishRunView(r, o) } };
}
