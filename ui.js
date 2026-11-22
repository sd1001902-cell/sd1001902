// ============ 九幽回廊 · 界面 ============
'use strict';
{
const $ = s => document.querySelector(s);
const app = $('#app'), modal = $('#modal'), sheet = $('#sheet');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SPEEDS = { 1: 420, 2: 200, 4: 80 };
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

let COMBO = { n: 0, t: null }, PAUSE = 0;
let GSLOT = null, GSUB = 'stash', ITAB = 'info', BAGTAB = 'stat', HTAB = 'stat', TBR = 0, MODSOPEN = false, AUTO = false, autoT = null, WALKING = false, FRESH = new Set();
let VIEW = 'town', TT = 'go', B = null, BRES = null, timer = null, EVRES = null, CHEST = null, LASTRUN = null, FILTER = 'all', MODALFN = null, BACK = null;

loadSave(); ensureBounties();
if (SAVE.run) VIEW = SAVE.run.world ? 'world' : 'map';
SFX.set(SAVE.sound, false); applyFs();
const mvolOf = () => SAVE.mvol == null ? 0.6 : SAVE.mvol; SFX.vol(mvolOf());
let MTEST = null;   // 设置里正在试听的那一段（离开城镇/标题页就自动取消）

function save() { persist(); }
function applyFs() { document.documentElement.style.setProperty('--fs', SAVE.fs || 1); }
// 掉了传奇：金色光柱 + 声音
function legBeam() {
  if (!SAVE || !SAVE.newLeg || !SAVE.newLeg.length) return;
  const name = SAVE.newLeg.shift(); const el = document.createElement('div'); el.className = 'legbeam'; el.innerHTML = `<b>传奇 · ${name}</b>`;
  document.body.appendChild(el); SFX.play('legend'); setTimeout(() => el.remove(), 2700);
}
setInterval(() => { if (!document.querySelector('.legbeam')) legBeam(); }, 500);
let BTOAST = [];
function toast(msg) { if (VIEW === 'battle' && B && !B.over) { if (!BTOAST.includes(msg)) BTOAST.push(msg); return; } const t = $('#toast'); t.innerHTML = msg;
  { const mp = VIEW === 'world' && !MODALFN && innerWidth <= 700 && document.querySelector('.wmapbox, #wmap, .wmap'); t.style.top = mp ? Math.round(mp.getBoundingClientRect().top + 30) + 'px' : ''; }   // 手机上地图界面的提示落在地图上沿，不盖住气血条和任务栏
  t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); }
function achToast(list) { if (list && list.length) { SFX.play('legend'); setTimeout(() => toast('成就达成：' + list.map(a => `<b>${a.n}</b>`).join('、')), 600); } }
const ctxCls = () => SAVE.run ? SAVE.run.cls : SAVE.cls;
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const fmtLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} 小时 ${m} 分` : m ? `${m} 分 ${s % 60} 秒` : `${s} 秒`; };
const num = v => Number.isInteger(v) ? v : (Math.round(v * 10) / 10);
const heroSpr = (cls, size, extra) => typeof HERO !== 'undefined' && HERO.has(cls) ? `<img class="spr hpor ${extra || ''}" src="${HERO.portrait(cls, size >= 100 ? 'full' : 'head')}" width="${size}" height="${size}" alt="" draggable="false">` : SPR.img(CLASSES[cls].spr, size, CLASSES[cls].pal, extra);
// 同伴和常见人物：有侧身新造型的用新造型（头像 / 站姿 / 全身），没有的还用原来的小人图
const unitIcon = (spr, size, pal, extra, mode) => { const lk = typeof HERO !== 'undefined' && HERO.lookOf(spr);
  return lk ? `<img class="spr hpor ${extra || ''}" src="${HERO.portrait(lk, mode || (size >= 100 ? 'full' : size >= 50 ? 'stand' : 'head'), HERO.mapPal(lk, pal))}" width="${size}" height="${size}" alt="" draggable="false">` : SPR.img(spr, size, pal, extra); };
// 顶栏的大数字缩写：十万以上写成「12.3万」，省地方
const fmtBig = n => { n = Math.round(n); if (n < 10000) return String(n); const v = n >= 1000000 ? Math.round(n / 10000) : Math.round(n / 1000) / 10; return `${v}万`; };
const hpTxt = (v, lv) => fmtBig(hpShow(Math.max(0, v), lv == null ? heroLv() : lv));   // 主角这边的气血数字：乘上气血倍数再显示
const uK = u => u && u.side === 'p' && B && B.P ? hpK(B.P.lv) : 1;                       // 战斗里某个单位的显示倍数
const chTitle = ch => CHAPTERS[ch - 1] ? `第${CN[ch]}章 · ${CHAPTERS[ch - 1].n}` : '九幽幻境';   // 幻境用的是假章节号

// ---------- 对话 ----------
let DLG = null;
function dlgSpeaker(who) {
  if (who === 'me') return { n: '你', img: heroSpr(ctxCls(), 72) };
  if (who === 'boss') { const Bo = DLG.boss; return { n: Bo ? Bo.n : '？？？', img: Bo ? unitIcon(Bo.spr, 72, Bo.pal, '', 'head') : '' }; }
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
  if (k === 'poison') return `攻击附带中毒：每回合 ${v}% 攻击`;
  if (k.startsWith('sk_')) { const id = k.slice(3); for (const c of CLASS_IDS) { const s = CLASSES[c].skills.find(x => x.id === id); if (s) return `+${v}% ${s.n}伤害`; } }
  const sign = v >= 0 ? '+' : '';
  if (k === 'hp' || k === 'regen') return `${sign}${fmtBig(hpShow(v, heroLv()))} ${STAT_NAMES[k] || k}`;   // 气血类的固定数值：和最大气血同一个倍数
  return `${sign}${v}${PCT_STATS.has(k) ? '%' : ''} ${STAT_NAMES[k] || k}`;
}
const itemTitle = it => `${ancName(it)}${esc(it.name)}${it.plus ? ` +${it.plus}` : ''}`;
const ancCls = it => it.anc === 2 ? 'primal' : it.anc === 1 ? 'ancient' : '';
function socketDots(it) { if (!it.sockets) return ''; return `<span class="dots">${Array.from({ length: it.sockets }, (_, i) => { const g = it.gems[i]; return `<i style="${g ? 'background:' + gemColor(g) : ''}"></i>`; }).join('')}</span>`; }
function setCountFor(cls, setId) { let n = 0; const eq = SAVE.chars[cls].eq; for (const sl in eq) if (eq[sl] && eq[sl].set === setId) n++; return n; }
const gemImg = (key, size) => SPR.img('gem', size, { G: gemColor(key) });
function itemCard(it, cls, label) {
  const L = legendOf(it), S = setOf(it), m = itemMult(it);
  let h = `<div class="icard ${ancCls(it)}">${label ? `<div class="lab">${label}</div>` : ''}<div class="ihead">${SPR.item(it, 48)}<div>
    <div class="iname r-${it.rarity}">${itemTitle(it)}</div>
    <div class="isub"><b class="tierb">${TIER_N[it.tier || tierOf(it.ilvl)]}</b> ${RARITY[it.rarity].n} · ${SLOT_NAME[it.slot]} · ${esc(it.base)} · 装备等级 ${it.ilvl}</div></div></div>`;
  if (it.anc) h += `<div class="ianc">${it.anc === 2 ? '太古：所有属性 +30%，随机词条全部满值' : '上古：所有属性 +30%'}</div>`;
  if (it.cls) h += `<div class="ireq ${canEquip(it, cls) ? '' : 'bad'}">限 ${CLASSES[it.cls].n}</div>`;
  h += '<ul>' + Object.keys(it.imp).map(k => `<li class="imp">${fmtStat(k, Math.round(it.imp[k] * statMult(it, k)))}</li>`).join('')
       + it.aff.map(([k, v]) => `<li class="aff ${SP_AFFIXES.includes(k) ? 'spx' : ''}">${fmtStat(k, Math.round(v * statMult(it, k)))}${affTag(it, k, v)}</li>`).join('') + '</ul>'
       + (it.aff.length ? `<div class="iq">词条成色 <b>${Math.round(itemQ(it) * 100)}%</b>${it.sp ? '　<span class="spx">带特殊词条</span>' : ''}</div>` : '');
  if (it.plus) h += `<div class="iplus">强化 +${it.plus}：攻击、气血、护甲这些实数属性 +${it.plus * 8}%</div>`;
  if (it.sockets) h += `<div class="isock">${Array.from({ length: it.sockets }, (_, i) => { const g = it.gems[i];
    return g ? `<span class="gs">${gemImg(g, 18)}${gemName(g)}：${gemDesc(g)}</span>` : '<span class="gs empty">空孔</span>'; }).join('')}</div>`;
  if (L) h += `<p class="ifx">神兵之魂：${L.d}${SAVE.cube[L.id] ? '<small>（乾坤袋已收藏）</small>' : ''}</p>`;
  if (S) {
    const n = setCountFor(S.cls, S.id), eq = SAVE.chars[S.cls].eq;
    h += `<div class="iset ${S.rift ? 'rset' : ''}"><b>${S.n}</b>${S.rift ? '<em>幻境套装</em>' : ''}（${CLASSES[S.cls].n}已穿 ${n}/${S.pieces.length}）
      <div class="${n >= 2 ? 'on' : ''}">2 件：${S.b2d}</div><div class="${n >= 4 ? 'on' : ''}">4 件：${S.b4d}</div>${S.b6 ? `<div class="${n >= 6 ? 'on' : ''}">6 件：${S.b6d}</div>` : ''}
      <div>${S.pieces.map(p => `<span class="${eq[p[0]] && eq[p[0]].set === S.id ? 'on' : ''}">${p[1]}</span>`).join('　')}</div></div>`;
  }
  return h + `<div class="ipr">卖 ${sellPrice(it)} 两 · 分解得 ${salvageValue(it)} 魂晶</div></div>`;
}
// 词条后面的星级和范围：★★★☆☆ 7–18
function affTag(it, k, v) { const r = affRange(k, it.ilvl, genMult(it)); if (!r) return ''; const q = affQ(it, k, v), st = affStars(q);
  const sh = x => k === 'hp' || k === 'regen' ? fmtBig(hpShow(x, heroLv())) : x;   // 气血类的范围和数值用同一个倍数显示
  return ` <small class="qs q${st}">${'★'.repeat(st)}${'☆'.repeat(5 - st)}</small><small class="qr">${sh(r[0])}–${sh(r[1])}</small>`; }
let WLOCK = { id: null, s: new Set() };
const wlockOf = it => (WLOCK.id === it.id ? WLOCK.s : new Set());
function deltaOf(it, cls) {
  if (!canEquip(it, cls)) return '<span class="delta no">不可用</span>';
  const d = powerWith(cls, it) - power(charStats(cls));
  return d > 0 ? `<span class="delta up">+${d}</span>` : d < 0 ? `<span class="delta dn">${d}</span>` : '<span class="delta no">±0</span>';
}
function lootChips(items) {
  if (!items || !items.length) return '';
  return `<div class="loot">${items.map(it => `<button class="lchip ${ancCls(it)}" data-act="item" data-arg="${it.id}">${SPR.item(it, 24)}<span class="r-${it.rarity}">${itemTitle(it)}</span></button>`).join('')}</div>`;
}
const zyChips = zy => zy && zy.length ? `<div class="loot">${zy.map(([n, g, old]) => { const d = allMonsterDefs().find(x => x.n === n);
  return `<span class="lchip zy">${d ? SPR.img(d.spr, 24, d.pal) : ''}<span>精魄·${n}<b>${ZY_CN[g]}</b>${old ? '<small>升品</small>' : '<small>新收服</small>'}</span></span>`; }).join('')}</div>` : '';
const gemChips = keys => keys && keys.length ? `<div class="loot">${keys.map(k => `<span class="lchip">${gemImg(k, 22)}${gemName(k)}</span>`).join('')}</div>` : '';
// 每件储物箱装备换上后的战力变化（一次算好，渲染时复用）
function deltaMap(cls) {
  const cur = power(charStats(cls)), m = new Map();
  for (const it of SAVE.stash) m.set(it.id, canEquip(it, cls) ? powerWith(cls, it) - cur : null);
  return m;
}
const deltaTag = d => d == null ? '<span class="delta no">不可用</span>' : d > 0 ? `<span class="delta up">+${d}</span>` : d < 0 ? `<span class="delta dn">${d}</span>` : '<span class="delta no">±0</span>';
function itemRow(it, D) {
  const d = D.get(it.id);
  return `<div class="irow2 ${ancCls(it)} ${d > 0 ? 'isup' : ''}"><button class="ir-main" data-act="item" data-arg="${it.id}">${SPR.item(it, 30)}<span class="nm r-${it.rarity}">${itemTitle(it)}<small>${SLOT_NAME[it.slot]} · ${it.ilvl} 阶 ${socketDots(it)}</small></span></button>
    ${deltaTag(d)}${d != null ? `<button class="btn sm qeq ${d > 0 ? '' : 'ghost'}" data-act="qeq" data-arg="${it.id}">穿上</button>` : '<span class="qeq-ph"></span>'}</div>`;
}
// 装备面板：上面是身上 7 个位置，点一个位置，下面只列这个位置能换的装备
function gearPanel(cls, inRun) {
  const eq = SAVE.chars[cls].eq, D = deltaMap(cls);
  const up = {};
  for (const it of SAVE.stash) { const d = D.get(it.id); if (d > 0 && d > (up[it.slot] || 0)) up[it.slot] = d; }
  const doll = SLOTS.map(sl => { const it = eq[sl.id];
    return `<button class="gsb ${GSLOT === sl.id ? 'on' : ''} ${it ? 'b-' + it.rarity + ' ' + ancCls(it) : 'empty'}" data-act="gsl" data-arg="${sl.id}" aria-pressed="${GSLOT === sl.id}">
      <span class="gi">${it ? SPR.item(it, 34) : `<i>${sl.s}</i>`}</span><span class="gn">${sl.n}${it && it.plus ? ` +${it.plus}` : ''}</span>${up[sl.id] ? `<em>+${up[sl.id]}</em>` : ''}</button>`; }).join('');
  const nUp = Object.keys(up).length;
  const subs = inRun ? [] : [['stash', `储物箱 ${SAVE.stash.length}`], ...(featureOn('gems') ? [['gems', '玉石']] : []), ...(featureOn('cube') ? [['cube', '乾坤袋']] : [])];
  const sub = inRun || !subs.some(x => x[0] === GSUB) ? 'stash' : GSUB;
  let body;
  if (sub === 'stash') body = stashBody(cls, D);
  else if (sub === 'gems') body = gemsBody();
  else if (sub === 'cube') body = cubeBody(cls);
  return `<div class="ghead"><div class="gdoll">${doll}</div>
      <div class="gbar"><span class="sub">${nUp ? `<b class="upn">${nUp}</b> 个位置有更好的装备` : '身上已经是目前最好的搭配'}</span><button class="btn sm ${nUp ? '' : 'ghost'}" ${nUp ? '' : 'disabled'} data-act="best">一键换上最强</button></div>
      ${subs.length > 1 ? `<div class="gsubs" style="--n:${subs.length}">${subs.map(([k, n]) => `<button class="${sub === k ? 'on' : ''}" data-act="gsub" data-arg="${k}">${n}</button>`).join('')}</div>` : ''}</div>
    <div class="gbody">${body}</div>`;
}
function stashBody(cls, D) {
  const order = { legend: 0, set: 1, rare: 2, magic: 3, normal: 4 };
  let list = SAVE.stash.filter(it => (!GSLOT || it.slot === GSLOT) && (FILTER === 'all' || (FILTER === 'up' && D.get(it.id) > 0) || (FILTER === 'leg' && it.legend && !SAVE.cube[it.legend])));
  list.sort((a, b) => GSLOT || FILTER === 'up' ? ((D.get(b.id) ?? -1e9) - (D.get(a.id) ?? -1e9)) : (order[a.rarity] - order[b.rarity] || (b.anc || 0) - (a.anc || 0) || b.ilvl - a.ilvl));
  const cur = GSLOT && SAVE.chars[cls].eq[GSLOT];
  const curRow = GSLOT ? `<div class="gcur"><span class="sub">身上的${SLOT_NAME[GSLOT]}：</span>${cur ? `<button class="linkish r-${cur.rarity}" data-act="item" data-arg="${cur.id}">${SPR.item(cur, 22)}${itemTitle(cur)}</button><button class="btn sm ghost" data-act="unequip" data-arg="${GSLOT}">卸下</button>` : '<span class="sub">空着</span>'}
      <button class="btn sm ghost" data-act="gsl" data-arg="${GSLOT}">看全部</button></div>` : '';
  const chips = [['all', '全部'], ['up', '只看能提升的'], ...(featureOn('cube') ? [['leg', '乾坤袋未收']] : [])];
  return `${curRow}<div class="chips">${chips.map(([k, n]) => `<button class="chip ${FILTER === k ? 'on' : ''}" data-act="filter" data-arg="${k}">${n}</button>`).join('')}
      ${VIEW === 'town' ? '<button class="chip" data-act="junk">卖凡品灵品</button><button class="chip" data-act="salvjunk">分解凡品灵品</button>' : ''}</div>
    <div class="ilist2">${list.length ? list.map(it => itemRow(it, D)).join('') : `<div class="empty-note">${GSLOT ? `储物箱里没有可以换的${SLOT_NAME[GSLOT]}。` : '这里没有符合条件的装备。'}</div>`}</div>
    <p class="sub" style="margin:8px 0 0">右边数字是换上后的战力变化。储物箱 ${SAVE.stash.length}/${stashMax()}，各角色共用。</p>`;
}
function gemsBody() {
  const gemKeys = Object.keys(SAVE.gems).sort((a, b) => a.localeCompare(b));
  return `<p class="help-p">三块相同的玉石可以合成高一阶，最高合成到「${GEM_TIERS[gemCap()]}」。想镶玉：点身上那件装备，打开「铸剑坊」。</p>
    <div class="gems">${gemKeys.length ? gemKeys.map(k => `<div class="gemrow">${gemImg(k, 26)}<span class="nm">${gemName(k)} <small>${gemDesc(k)}</small></span><b>×${SAVE.gems[k]}</b>
      <button class="btn sm ghost" ${SAVE.gems[k] >= 3 && +k.split('_')[1] < gemCap() ? '' : 'disabled'} data-act="combine" data-arg="${k}">合成（${combineCost(k)} 两）</button></div>`).join('')
      : '<div class="empty-note">还没有玉石。精英、首领和宝箱会掉落玉石。</div>'}</div>
    ${SAVE.lgems.length || featureOn('rift') ? `<h4 class="sub-h">灵玉 <small>幻境守关妖王掉落，只能镶在扳指或玉佩上</small></h4>
    <div class="gems">${SAVE.lgems.length ? SAVE.lgems.map(g => { const host = lgemHost(g.id), G = LGEMS[g.t];
      return `<div class="gemrow lg">${SPR.img('gem', 26, { G: G.c }, 'glow')}<span class="nm"><b style="color:${G.c}">${G.n}</b> ${g.lv} 级 <small>${G.d(g.lv)}</small><small>${host ? '镶在：' + itemTitle(host) : '未镶嵌'}</small></span></div>`; }).join('')
      : '<div class="empty-note">还没有灵玉。去九幽幻境打败守关妖王吧。</div>'}</div>` : ''}`;
}
function cubeBody(cls) {
  if (!featureOn('cube')) return lockNote('第六章剧情中获得');
  const ch = SAVE.chars[cls], learned = LEGENDS.filter(L => SAVE.cube[L.id]);
  return `<p class="help-p">已收藏 ${learned.length}/${LEGENDS.length} 种神兵之魂。在神兵的「铸剑坊」里把它收进乾坤袋，就能永久学会特效。每个角色 3 个格子，放进去直接生效。</p>
    <div class="cube">${[0, 1, 2].map(i => { const lid = ch.cube[i], L = lid && LEGENDS.find(l => l.id === lid);
      return `<div class="cslot"><small>格子 ${i + 1}</small>${L ? `<b class="r-legend">${L.n}</b><span>${L.d}</span>` : '<span class="sub">空</span>'}
        <button class="btn sm ghost" ${learned.length ? '' : 'disabled'} data-act="cubepick" data-arg="${i}">${L ? '更换' : '放入'}</button></div>`; }).join('')}</div>`;
}
// 幻境的香：还剩多少（0–1）
const xiangLeft = run => run && run.mode === 'rift' ? Math.max(0, 1 - (run.clock || 0) / riftLimit(run.riftLv)) : 1;
const fmtClock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const xiangTxt = run => run.world ? fmtClock(xiangLeft(run) * riftLimit(run.riftLv)) : Math.round(xiangLeft(run) * 100) + '%';   // 新幻境按时间：还剩几分几秒
const riftRecTxt = R => R ? (R.s != null ? `${R.lv} 层 · 用时 ${fmtClock(R.s * 1000)}` : `${R.lv} 层 · ${R.t} 回合（旧纪录）`) : '';
function xiangBarTxt(run) { const L = xiangLeft(run), G = run.riftDone ? null : RIFT_GRADES.find(g => g.min >= 0 && L >= g.min);
  return `${L > 0 ? `一炷香 · 还剩 ${xiangTxt(run)}${G ? ` · 现在打完是「${G.n}」` : ''}` : '香烧完了 · 还能打完拿东西，但不算纪录'}${run.deaths ? ` · 倒下 ${run.deaths} 次` : ''}`; }
// 幻境的香：在地图上按真实时间烧（开着窗口、对话、切到后台时不烧）；战斗里的时间由引擎按回合折算
let RTICK = 0, RSAVE = 0;
setInterval(() => {
  const run = typeof SAVE !== 'undefined' && SAVE && SAVE.run, now = performance.now();
  if (!run || !isRift(run) || run.riftDone || VIEW !== 'world' || DLG || MODALFN || document.hidden) { RTICK = 0; return; }
  if (RTICK) run.clock = (run.clock || 0) + Math.min(1000, now - RTICK);
  RTICK = now;
  const xb = document.querySelector('#xiangbar'), L = xiangLeft(run);
  if (xb) { xb.querySelector('i').style.width = L * 100 + '%'; xb.classList.toggle('low', L > 0 && L < 0.25); xb.classList.toggle('out', L <= 0); xb.querySelector('span').textContent = xiangBarTxt(run); }
  const xg = document.querySelector('#rbxiang'); if (xg) { xg.textContent = `香 ${xiangTxt(run)}`; xg.classList.toggle('low', L > 0 && L < 0.25); xg.classList.toggle('out', L <= 0); }
  if (now - RSAVE > 8000) { RSAVE = now; persist(true); }
}, 250);
const riftHelpModal = () => `<h2 class="mh">幻境换了打法</h2>
  <p class="help-p">不再是点格子了。现在是四层大地图，妖物成群结队，看得见、绕得开。</p>
  <p class="help-p"><b>拉怪合战</b>：撞上一群妖物，旁边三格内的会一起卷进来，一场最多四群。群攻的招式在这里最值钱。</p>
  <p class="help-p"><b>进度</b>：斩妖攒进度，精英给得多，倒下后还会掉一颗精魄，要走过去捡。进度满了，守关妖王就在你身边现身。</p>
  <p class="help-p"><b>换层</b>：每层最多攒四成进度，攒够了就去远处的传送阵换下一层，不用清完；一局一般走三层，最后一层不封顶。每层还有一座塔，踩上去有三场战斗的加成。</p>
  <p class="help-p"><b>一炷香</b>：十二分钟。在地图上按真实时间烧；战斗里按回合折算，一轮算三秒，开几倍速、跳不跳过战斗都一样。</p>
  <p class="help-p">掉的装备都记在这一局里，打完一起看；中途不会停下来结算。</p>
  <div class="row" style="justify-content:center"><button class="btn" data-act="close">知道了</button></div>`;
function xiangBar(run) {
  const L = xiangLeft(run), G = run.riftDone ? null : RIFT_GRADES.find(g => g.min >= 0 && L >= g.min);
  return `<div class="xiangbar ${L <= 0 ? 'out' : L < 0.25 ? 'low' : ''}" id="xiangbar"><i style="width:${L * 100}%"></i><em style="left:50%"></em><em style="left:25%"></em>
    <span>${xiangBarTxt(run)}</span></div>`;
}
function runBar(run) {
  const s = runStats(run), hp = Math.max(0, Math.min(run.hp, s.maxHp));
  const buffs = Object.entries(run.buffs).filter(([, v]) => v).map(([k, v]) => fmtStat(k, v)).join('，');
  const title = run.mode === 'rift' ? `九幽幻境 ${run.riftLv} 层 · ${themeOf(run).n}` : run.world ? chTitle(run.chapter) : `${chTitle(run.chapter)} · 第${CN[run.floor]}层`;
  const goal = run.world && run.mode !== 'rift' ? '' : run.mode === 'rift'
    ? `<span class="pill ${run.prog >= 100 ? 'gold' : ''}" id="rbprog">${SPR.img('portal', 18)}进度 ${Math.floor(run.prog)}%</span><span class="pill xiang ${xiangLeft(run) <= 0 ? 'out' : xiangLeft(run) < 0.25 ? 'low' : ''}" id="rbxiang">香 ${xiangTxt(run)}</span>`
    : `<span class="pill ${run.hasKey ? 'gold' : 'dim'}">${SPR.img('key', 18)}${run.hasKey ? '已有钥匙' : '未找到钥匙'}</span>`;
  return `<header class="runbar"><div class="rb-hero">${heroSpr(run.cls, 44)}<div><div class="fl">${title}</div>
      <div class="sub">${CLASSES[run.cls].n} Lv ${SAVE.chars[run.cls].level} · ${run.mode === 'rift' ? '幻境' : DIFFS[run.diff].n}${run.ngoc ? ' · Ngoc 同行' : ''}${run.mods.length ? ' · ' + run.mods.map(id => DUNGEON_MODS.find(m => m.id === id).n).join('、') : ''}</div></div></div>
    <div class="hpw"><div class="hpbar big" id="rbhp"><i style="width:${hp / s.maxHp * 100}%"></i><span>${hpTxt(hp)} / ${hpTxt(s.maxHp)}</span></div>${xpRow(run.cls)}</div>
    <div class="row"><span class="pill" id="rbpot">丹药 ${run.potions}</span>${goal}<span class="pill gold">银两 ${SAVE.gold}</span>${run.world && (run.chapter === 7 || SAVE.mb) ? `<span class="pill mb">冥币 ${SAVE.mb || 0}</span>` : ''}${run.tishen ? `<span class="pill">纸人 ${run.tishen}</span>` : ''}</div></header>
    ${buffs ? `<div class="buffs">本局加成：${buffs}</div>` : ''}`;
}
const lockNote = (txt) => `<div class="locknote">${SPR.img('lock', 22)}<span>${txt}</span></div>`;

// ---------- 青石镇（营地） ----------
const TOWN_TABS = [['go', '出征'], ['gear', '人物'], ['hero', '修炼'], ['col', '江湖录'], ['set', '设置']];
function dots() {
  const d = {}, cls = SAVE.cls;
  d.col = featureOn('bounty') && SAVE.bounty && SAVE.bounty.list.some(b => b.prog >= b.need && !b.claimed);
  d.hero = talentInfo(cls).free > 0 || (featureOn('para') && paraFree() > 0);
  return d;
}
function townHTML() {
  const cls = SAVE.cls, C = CLASSES[cls], ch = SAVE.chars[cls], s = charStats(cls), need = xpNeed(ch.level), dt = dots();
  const tabs = CLASS_IDS.map(id => `<button class="tab ${id === cls ? 'on' : ''}" data-act="tab" data-arg="${id}">${heroSpr(id, 34)}<b>${CLASSES[id].n}</b><span>Lv ${SAVE.chars[id].level}</span></button>`).join('');
  const body = ({ go: goTab, gear: gearTab, hero: heroTab, col: colTab, set: setTab }[TT] || goTab)();
  return `<div class="top"><button class="btn sm ghost homeb" data-act="home">‹ 主页</button><h1>九幽回廊</h1><span class="sub">中式暗黑 · 自动战斗 · 迷宫探索</span>
      <div class="row rescur"><span class="pill gold">${SPR.img('ingot', 18)}银两 ${fmtBig(SAVE.gold)}</span><span class="pill">${SPR.img('shard', 18)}魂晶 ${fmtBig(SAVE.mats)}</span>${featureOn('para') && SAVE.para.lv ? `<span class="pill para">修为 · ${realmName(SAVE.para.lv)}</span>` : ''}</div></div>
  ${storageOK ? '' : '<p class="warn">当前浏览器不允许保存进度，关闭页面后进度会丢失。</p>'}
  <div class="tabs">${tabs}</div>
  <section class="panel hero-strip"><div class="pedestal">${heroSpr(cls, 72, 'idle')}</div>
    <div class="hs-mid"><div class="row" style="align-items:baseline"><h2>${C.n}</h2><span class="sub hs-desc">${C.d}</span></div>
      <div class="lvline"><span>等级 ${ch.level}${ch.level >= MAX_LV ? '（满级）' : ''}</span><span>${ch.level >= MAX_LV ? `修为经验 ${SAVE.para.xp} / ${paraNeed(SAVE.para.lv)}` : `经验 ${ch.xp} / ${need}`}</span></div>
      <div class="xp ${ch.level >= MAX_LV ? 'pxp' : ''}"><i style="width:${ch.level >= MAX_LV ? SAVE.para.xp / paraNeed(SAVE.para.lv) * 100 : ch.xp / need * 100}%"></i></div></div>
    <div class="power"><small>战力</small><b>${power(s)}</b></div></section>
  <nav class="ttabs">${TOWN_TABS.map(([k, n]) => `<button class="ttab ${TT === k ? 'on' : ''}" data-act="tt" data-arg="${k}">${n}${dt[k] ? '<i class="dot"></i>' : ''}</button>`).join('')}</nav>
  ${body}`;
}
function npcList() {
  const c = storyCleared('normal'), L = wTownNpcs().map(id => [id, id]);
  if (c >= 1 && c < 8) L.push(['taoist', 'taoist']);
  return L;
}
function campStrip() {
  return `<section class="camp" style="--bg:#0e0a0c"><div class="lanterns"><i></i><i></i><i></i></div>
    <div class="npcs">${npcList().map(([id]) => { const S = SPEAKERS[id], qc = townCh(), mk = qc ? wNpcMark(qc, id) : '';
      return `<button class="npc ${id}" data-act="npc" data-arg="${id}" id="npc-${id}">${mk ? `<em class="qmk ${mk}">${mk === 'turn' ? '?' : '!'}</em>` : ''}${unitIcon(S.spr, id === 'ngoc' ? 76 : 60, S.pal, id === 'ngoc' ? 'idle' : '', 'stand')}<b>${S.n}</b></button>`; }).join('')}</div>
    <p class="camp-hint">青石镇 · 点击镇上的人聊两句</p></section>`;
}
function goTab() {
  const cls = SAVE.cls, run = SAVE.run;
  if (run) return `${campStrip()}<section class="panel"><h3>进行中的冒险</h3><div class="resume">${CLASSES[run.cls].n} · ${run.mode === 'rift' ? '九幽幻境 ' + run.riftLv + ' 层' : run.world ? chTitle(run.chapter) + ' · ' + zoneName() : chTitle(run.chapter) + ' · 第' + CN[run.floor] + '层'}</div>
    <div class="row"><button class="btn big" data-act="resume">继续冒险</button><button class="btn ghost" data-act="retreat" style="width:100%">${run.world ? '结束这一趟（任务进度都保留，可以换个角色）' : '放弃（已得到的东西都会保留）'}</button></div></section>`;
  const ru = featureOn('rift'), mode = ru && SAVE.mode === 'rift' ? 'rift' : 'story';
  const modeSel = ru ? `<div class="seg sm"><button class="${mode === 'story' ? 'on' : ''}" data-act="mode" data-arg="story">主线剧情</button><button class="${mode === 'rift' ? 'on' : ''}" data-act="mode" data-arg="rift">九幽幻境</button></div>` : '';
  let body;
  if (mode === 'story') {
    if (!SAVE.unlocked[SAVE.diff]) SAVE.diff = 'normal';
    const diff = SAVE.diff, cl = storyCleared(diff), maxCh = Math.min(10, cl + 1);
    if (SAVE.chapter > maxCh) SAVE.chapter = maxCh;
    const k = SAVE.chapter, C = CHAPTERS[k - 1], done = k <= cl, known = storyCleared('normal') >= k;
    const rec = Math.min(MAX_LV, 2 + Math.round((k - 1) * 2.3) + DIFFS[diff].base);
    const lv = SAVE.chars[cls].level;
    const diffs = DIFF_IDS.filter(d => SAVE.unlocked[d]);
    body = `${diffs.length > 1 ? `<div class="dsw">${diffs.map(d => `<button class="${diff === d ? 'on' : ''}" data-act="diff" data-arg="${d}">${DIFFS[d].n}</button>`).join('')}</div>` : ''}
      <div class="chcard" style="--cbg:${C.bg}">
        <button class="charr" data-act="chnav" data-arg="-1" ${k > 1 ? '' : 'disabled'} aria-label="上一章">‹</button>
        <div class="chc-mid">
          <div class="chc-art ${known ? '' : 'sil'}">${SPR.img(C.boss.spr, 84, C.boss.pal, 'idle')}</div>
          <small class="chc-no">第${CN[k]}章${done ? ' · <em>已通关</em>' : ''}</small>
          <h3>${C.n}</h3><p>${C.sub}</p>
          <div class="chc-meta"><span>首领：${known ? C.boss.n : '？？？'}</span><span class="${lv >= rec ? '' : 'warn'}">建议 ${rec} 级（你 ${lv} 级）</span>${C.ngoc ? '<span class="pink">Ngoc 同行</span>' : ''}</div>
        </div>
        <button class="charr" data-act="chnav" data-arg="1" ${k < maxCh ? '' : 'disabled'} aria-label="下一章">›</button>
      </div>
      <div class="chdots">${CHAPTERS.map((_, i) => `<i class="${i + 1 === k ? 'on' : ''} ${i + 1 <= cl ? 'done' : ''} ${i + 1 > maxCh ? 'lock' : ''}"></i>`).join('')}</div>`;
  } else {
    const maxR = Math.max(1, SAVE.riftCap || 3); if (SAVE.riftLv > maxR) SAVE.riftLv = maxR;
    const rec = SAVE.riftRec[cls], yi = (SAVE.chars[cls].yi || []).filter(id => yiGrade(id));
    body = `<div class="rift-pick"><button class="btn ghost" data-act="rlv" data-arg="-5">-5</button><button class="btn ghost" data-act="rlv" data-arg="-1">-1</button>
        <div class="rl"><b>${SAVE.riftLv}</b><small>层 · 妖物约 ${riftD(SAVE.riftLv).base} 级</small></div>
        <button class="btn ghost" data-act="rlv" data-arg="1">+1</button><button class="btn ghost" data-act="rlv" data-arg="5">+5</button></div>
      <p class="help-p" style="text-align:center">最多可以挑战 ${maxR} 层。限时<b>一炷香</b>（${Math.round(riftLimit(SAVE.riftLv) / 60000)} 分钟）。一局四层大地图，妖物成群：撞上一群，旁边的会一起卷进来。斩妖攒满进度，守关妖王现身；香烧完前打败它，剩的香越多，灵玉升级次数越多，下次能往上跳的层数也越多。倒下了不算输，会被吐回这一层的入口，香烧掉一截。</p>
      <p class="help-p" style="text-align:center">地图上按真实时间烧香；战斗里按回合折算（一轮算 3 秒），开几倍速、跳不跳过战斗都一样。</p>
      <div class="riftinfo"><span>${CLASSES[cls].n}的纪录：<b>${rec ? riftRecTxt(rec) : '还没有'}</b></span><span>${SAVE.riftLv >= RSET_LV ? `这一层会掉<b class="r-set">幻境套装</b>` : `${RSET_LV} 层起掉<b class="r-set">幻境套装</b>`}</span>
        <span>精魄：<b>${ZY_CN[zyGrade(SAVE.riftLv)]}</b></span><span>役使：${yi.length ? yi.map(id => `<b>${YISHI[id].n}</b>`).join('、') : '<i>没带</i>'} <button class="linkbtn" data-act="zyopen">镇妖录</button></span></div>
      <button class="ngoc-toggle ${SAVE.ngocJoin ? 'on' : ''}" data-act="ngoctog">${SPR.img('ngocfox', 36)}<span><b>带上 Ngoc</b><small>${SAVE.ngocJoin ? '她会和你一起闯幻境' : '这次你一个人去'}</small></span></button>`;
  }
  const mods = featureOn('mods') ? `<button class="modsbtn" data-act="modsopen">加难度${SAVE.mods.length ? ` · 已选 ${SAVE.mods.length} 项` : ''} ${MODSOPEN ? '▲' : '▼'}</button>
    ${MODSOPEN ? `<div class="mods">${DUNGEON_MODS.map(M => `<button class="mod ${SAVE.mods.includes(M.id) ? 'on' : ''}" data-act="modt" data-arg="${M.id}"><b>${M.n}</b><span>${M.d}</span><small>${M.r}</small></button>`).join('')}</div>` : ''}` : '';
  const comps = Object.keys(COMPANIONS).filter(c => (SAVE.comps || {})[c]);
  const compSel = comps.length > 1 ? `<div class="compsel"><span class="sub">同伴</span>${comps.map(c => { const C2 = COMPANIONS[c]; return `<button class="cmp2 ${SAVE.comp === c ? 'on' : ''}" data-act="comp" data-arg="${c}">${unitIcon(C2.spr, 34, null, '', 'head')}<b>${C2.n}</b>${compTag(c)}</button>`; }).join('')}</div>` : '';
  return `${campStrip()}<section class="panel gopanel">${modeSel}${body}${compSel}${mods}
    <button class="btn big" data-act="start">${mode === 'rift' ? `进入九幽幻境 ${SAVE.riftLv} 层` : `出发：${chTitle(SAVE.chapter)}`}</button></section>`;
}
function bountyHTML() {
  if (!featureOn('bounty')) return '';
  ensureBounties();
  const Bn = SAVE.bounty, allDone = Bn.list.every(b => b.claimed);
  return `<section class="panel"><h3>江湖悬赏 <small>每天刷新 · 完成后领宝箱（必出宝品以上）</small></h3>
    <div class="bounties">${Bn.list.map((b, i) => `<div class="bounty ${b.claimed ? 'done' : ''}"><div><b>${b.t}</b><div class="bar"><i style="width:${b.prog / b.need * 100}%"></i></div><small>${b.prog} / ${b.need}</small></div>
      ${b.claimed ? '<span class="sub">已领取</span>' : `<button class="btn sm" ${b.prog >= b.need ? '' : 'disabled'} data-act="bclaim" data-arg="${i}">领取</button>`}</div>`).join('')}</div>
    <div class="row" style="margin-top:10px;justify-content:space-between"><span class="sub">三个全部完成，再领一个<b style="color:var(--gold2)">赏金大箱</b>（必出套装或神兵）</span>
      ${Bn.bonus ? '<span class="sub">已领取</span>' : `<button class="btn sm" ${allDone ? '' : 'disabled'} data-act="bbonus">领取大箱</button>`}</div></section>`;
}
function gearTab() { return `<section class="panel"><h3>人物属性</h3>${statBlock(SAVE.cls)}</section><section class="panel gearp">${gearPanel(SAVE.cls, false)}</section>`; }
// 人物属性：一排数值 + 本职续航。城镇「人物」「修炼」和游戏里的「人物」弹窗共用
function statBlock(cls) {
  const ch = SAVE.chars[cls], s = SAVE.run && SAVE.run.cls === cls && (VIEW === 'world' || VIEW === 'battle' || VIEW === 'map') ? runStats(SAVE.run) : charStats(cls);   // 出门在外：把吃的、带的加成也算上
  const stats = [['气血', hpTxt(s.maxHp, ch.level)], ['攻击', s.atk], ['护甲', s.armorT], ['全抗', s.res + '%'], ['暴击率', s.crit + '%'], ['暴击伤害', s.critDmg + '%'],
    ['速度', s.speed], ['伤害', '+' + s.dmgPct + '%'], ['术法伤害', '+' + s.elem + '%'], ['吸血', s.leech + '%'], ['闪避', Math.round((s.dodge + (cls === 'assassin' ? SUST.assassin.a * sustLv(ch.level) : 0)) * 10) / 10 + '%'], ['福缘', '+' + s.mf + '%']];
  const SU = SUST[cls], lvF = sustLv(ch.level);
  const suV = k => k === 'dr' || k === 'cap' ? SU[k] : Math.round(Math.min(k === 'a' && cls === 'necro' ? 60 : 999, SU[k] * ((cls === 'assassin' && k === 'a') ? 1 : 1 + s.sust / 100) * lvF) * 10) / 10;
  const desc = SU.d.replace(/\{(\w+)\}/g, (m, k) => suV(k));
  const sustP = `<p class="help-p sustp"><b>本职续航 · ${SU.n}</b>：${desc}。${cls === 'berserker' ? '' : `<br>别的门派的「吸血」在你身上只有三成；每 1% 吸血另外折成 4% 续航强度${s.sust ? `（现在 +${s.sust}%）` : ''}。`}</p>`;
  return `<div class="stats">${stats.map(([n, v]) => `<div><span>${n}</span><b>${v}</b></div>`).join('')}</div>${sustP}`;
}
function heroTab() {
  const cls = SAVE.cls, ch = SAVE.chars[cls], s = charStats(cls), ti = talentInfo(cls), pf = paraFree(), rOn = featureOn('runes');
  const tabs = [['stat', '属性'], ['tal', `心法${ti.free ? ` <b class="upn">${ti.free}</b>` : ''}`], ['skill', '武学'], ...(featureOn('para') ? [['para', `修为${pf ? ` <b class="upn">${pf}</b>` : ''}`]] : [])];
  if (!tabs.some(t => t[0] === HTAB)) HTAB = 'stat';
  const bar = `<div class="gsubs htabs" style="--n:${tabs.length}">${tabs.map(([k, n]) => `<button class="${HTAB === k ? 'on' : ''}" data-act="htab" data-arg="${k}">${n}</button>`).join('')}</div>`;
  let body = '';
  if (HTAB === 'stat') {
    const fxList = [...s.fx].map(f => { const L = LEGENDS.find(l => l.fx === f); if (L) return `<li><b class="r-legend">${L.n}</b>：${L.d}</li>`;
      const S = SETS.find(x => x.b4 === f); if (S) return `<li><b class="r-set">${S.n} 4 件</b>：${S.b4d}</li>`;
      const S6 = SETS.find(x => x.b6 === f); if (S6) return `<li><b class="r-set">${S6.n} 6 件</b>：${S6.b6d}</li>`;
      for (const Bq of talentBranches(cls)) { const T = Bq.t.find(t => t.fx === f); if (T) return `<li><b style="color:var(--gold2)">心法·${T.n}</b>：${T.d}</li>`; } return ''; }).join('');
    body = `${statBlock(cls)}
      <h4 class="sub-h">门派套装</h4><ul class="setlist">${SETS.filter(S => S.cls === cls && (!S.rift || featureOn('rift'))).map(S => { const n = s.setCount[S.id] || 0;
        return `<li class="${S.rift ? 'rset' : ''}"><b>${S.n}</b>${S.rift ? `<em>幻境 ${RSET_LV} 层以上掉落</em>` : ''}（已穿 ${n}/${S.pieces.length}）<div class="${n >= 2 ? 'on' : 'off'}">2 件：${S.b2d}</div><div class="${n >= 4 ? 'on' : 'off'}">4 件：${S.b4d}</div>${S.b6 ? `<div class="${n >= 6 ? 'on' : 'off'}">6 件：${S.b6d}</div>` : ''}</li>`; }).join('')}</ul>
      ${fxList ? `<h4 class="sub-h">生效中的特效</h4><ul class="setlist fxlist">${fxList}</ul>` : ''}`;
  } else if (HTAB === 'tal') {
    body = `<div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="sub">每升一级得 1 点 · 可用 <b style="color:var(--gold2)">${ti.free}</b> 点</span>
      <button class="btn sm ghost" ${SAVE.gold >= respecCost(cls) && ti.spent ? '' : 'disabled'} data-act="respec">散功重修${respecCost(cls) ? `（${respecCost(cls)} 两）` : '（免费）'}</button></div>${talentGrid(cls)}`;
  } else if (HTAB === 'skill') {
    body = skillPanel(cls);
  } else {
    body = `<p class="help-p">所有角色共享。满 ${MAX_LV} 级后的经验转成修为，每突破一层得 1 点：炼气、筑基、金丹、元婴……${SAVE.para.lv ? ` 现在：<b>${realmName(SAVE.para.lv)}</b>` : ''}</p>
      <div class="para">${PARAGON_STATS.map(P => { const n = SAVE.para.pts[P.k] || 0; return `<div class="prow"><span>${P.n}<small>每点 +${P.v}${PCT_STATS.has(P.k) ? '%' : ''}${P.cap ? ' · 上限 ' + P.cap + '%' : ''}</small></span><b>+${num(n * P.v)}${PCT_STATS.has(P.k) ? '%' : ''}</b>
        <button class="mini" ${paraCanAdd(P.k) ? '' : 'disabled'} data-act="para" data-arg="${P.k}|1">+1</button><button class="mini" ${paraCanAdd(P.k) ? '' : 'disabled'} data-act="para" data-arg="${P.k}|10">+10</button></div>`; }).join('')}</div>
      ${SAVE.para.lv ? '<button class="btn sm ghost" style="margin-top:8px" data-act="parareset">重新分配修为（免费）</button>' : ''}`;
  }
  return `<section class="panel herop">${bar}<div class="hbody">${body}</div></section>`;
}
const stTag = (st, txt) => st && STATES[st] ? `<span class="stt" style="--c:${STATES[st].c}">${txt || STATES[st].n}</span>` : '';
const compTag = c => COMPANIONS[c] && COMPANIONS[c].ap ? stTag(COMPANIONS[c].ap, '挂' + STATES[COMPANIONS[c].ap].n) : '';
// 技能卡上的状态说明
const skTags = k => `${k.ap ? stTag(k.ap, `挂${STATES[k.ap].n}${k.apc && k.apc < 1 ? ' ' + Math.round(k.apc * 100) + '%' : ''}`) : ''}${k.pay ? (k.pay.s === 'any' ? `<span class="stt pay" style="--c:#e8b0ff">打带状态的：${payText(k.pay)}</span>` : stTag(k.pay.s, `打${STATES[k.pay.s].n}：${payText(k.pay)}`).replace('class="stt"', 'class="stt pay"')) : ''}`;
// 当前带的技能能打出哪些连招（先挂状态，再收招）
function comboHints(act, comp) {
  const src = act.filter(k => k.ap).map(k => ({ n: k.n, s: k.ap }));
  if (comp && COMPANIONS[comp] && COMPANIONS[comp].ap) src.push({ n: COMPANIONS[comp].n, s: COMPANIONS[comp].ap });
  const out = [], seen = new Set();
  for (const b2 of act.filter(k => k.pay)) for (const a of src) {
    if (b2.pay.s !== 'any' && b2.pay.s !== a.s) continue;
    const key = a.n + b2.id; if (seen.has(key) || a.n === b2.n && b2.pay.s !== 'any') continue; seen.add(key);
    out.push(`<span class="ch"><b>${esc(b2.pay.n)}</b>「${esc(a.n)}」→「${esc(b2.n)}」</span>`);
    if (b2.pay.s === 'any') break;
  }
  return out.length ? `<div class="combo-h">${out.join('')}</div>` : '<p class="combo-h none">现在带的技能还配不成连招：带一个「挂状态」的起手技能，再带一个「打该状态」的收招技能。</p>';
}
// 赶尸人的尸阵：每个位置放哪种僵尸
function formHTML(cls) {
  if (cls !== 'necro') return '';
  const ch = SAVE.chars.necro, cap = 3 + charStats('necro').minion + (charStats('necro').fx.has('minionArmor') ? 1 : 0), form = necroForm(ch.level, ch.form);
  const opts = ZOMBIE_ORDER.filter(z => ZOMBIES[z].lv <= ch.level);
  return `<div class="form"><h4 class="sub-h">尸阵 <small>摇铃唤尸按这个顺序把空位补上（尸位 ${cap}）</small></h4>
    ${Array.from({ length: cap }, (_, i) => `<div class="frow"><span class="fpos">${i + 1}</span>${ZOMBIE_ORDER.map(z => { const Z = ZOMBIES[z], lock = Z.lv > ch.level;
      return `<button class="fz ${form[i] === z ? 'on' : ''}" ${lock ? 'disabled' : ''} data-act="form" data-arg="${i}|${z}">${SPR.img(Z.spr, 26, Z.pal)}<b>${Z.n}</b><small>${lock ? Z.lv + ' 级' : esc(Z.d.split('，')[0])}</small></button>`; }).join('')}</div>`).join('')}
    <p class="help-p">${ZOMBIE_ORDER.concat('shiwang').map(z => `<b>${ZOMBIES[z].n}</b>（${ZOMBIES[z].lv} 级）：${ZOMBIES[z].d}`).join('<br>')}</p></div>`;
}
function skillPanel(cls, inBag) {
  const ch = SAVE.chars[cls], s = charStats(cls), { act, basic, all } = skillList(cls), rOn = featureOn('runes');
  const eqIds = new Set(act.map(k => k.id));
  const row = (k, i, eq) => { const lock = ch.level < k.lv, r = ch.runes[k.id];
    return `<div class="sk ${lock ? 'locked' : ''} ${eq ? 'eq' : ''}"><div class="skh"><b>${k.n}</b><small>${lock ? k.lv + ' 级领悟' : '冷却 ' + k.cd}</small>
      <span class="ord">${eq ? `<button class="mini" ${i ? '' : 'disabled'} data-act="skup" data-arg="${k.id}" aria-label="上移">▲</button><button class="mini" ${i < act.length - 1 ? '' : 'disabled'} data-act="skdn" data-arg="${k.id}" aria-label="下移">▼</button>` : ''}
      ${lock ? '' : `<button class="mini wide ${eq ? '' : 'go'}" data-act="skeq" data-arg="${k.id}">${eq ? '卸下' : '装配'}</button>`}</span></div>
      <p>${k.d}${s.sk[k.id] ? `<span class="skb">（心法 +${s.sk[k.id]}%）</span>` : ''}</p>${k.ap || k.pay ? `<div class="sktags">${skTags(k)}</div>` : ''}
      ${eq && rOn && RUNES[k.id] ? `<div class="runes">${RUNES[k.id].map((R, j) => { const id = j ? 'b' : 'a'; return `<button class="rune ${r === id ? 'on' : ''}" data-act="rune" data-arg="${k.id}|${id}"><b>${R.n}</b><span>${R.d}</span></button>`; }).join('')}</div>` : ''}</div>`; };
  const rest = all.filter(k => !eqIds.has(k.id)).sort((a, b) => a.lv - b.lv);
  return `${formHTML(cls)}<details class="wxinfo"><summary>状态配合 · 怎么打连招</summary>
      <p class="help-p">起手技能给敌人「挂状态」，收招技能打带这个状态的敌人，会有额外效果（伤害翻倍、必定暴击、打碎、传染……）。</p>
      <div class="rlist">${Object.entries(STATES).map(([k, S2]) => `<div>${stTag(k)}<span>${S2.d}</span></div>`).join('')}</div>
      <p class="help-p">同伴也会挂状态：Ngoc 灼烧，珍姑娘破甲，龙道长冰冻。带对了同伴，你的收招就有得打。</p></details>
    <h4 class="sub-h">出战武学 <small>${act.length}/${LOADOUT_MAX} · 自动出招时从上到下优先${rOn ? ' · 可以给每招选一种变招' : ''}</small></h4>
    ${comboHints(act, SAVE.comp)}
    <div class="skl">${act.map((k, i) => row(k, i, true)).join('') || '<div class="empty-note">还没有装配武学</div>'}
      <div class="sk basic"><div class="skh"><b>${basic.n}</b><small>基本招式，其他武学都在冷却时使用</small></div><p>${basic.d}</p>${basic.ap || basic.pay ? `<div class="sktags">${skTags(basic)}</div>` : ''}</div></div>
    ${rest.length ? `<h4 class="sub-h">没带上的武学</h4><div class="skl">${rest.map(k => row(k, 0, false)).join('')}</div>` : ''}`;
}
function talentGrid(cls) {
  const tal = SAVE.chars[cls].tal, brs = talentBranches(cls); if (TBR >= brs.length) TBR = 0;
  return `<div class="tbr-chips">${brs.map((Bq, i) => `<button class="chip ${TBR === i ? 'on' : ''}" data-act="tbr" data-arg="${i}">${Bq.n}<small>${branchSpent(cls, Bq.id)}</small></button>`).join('')}</div><div class="tbr-wrap">${brs.map((Bq, bi) => { const sp = branchSpent(cls, Bq.id);
    return `<div class="tbr ${TBR === bi ? '' : 'm-hide'}"><h3>${Bq.n}<small>已投入 ${sp}</small></h3>${Bq.t.map((T, i) => { const r = tal[Bq.id + '.' + T.id] || 0, locked = sp < i * TALENT_TIER_REQ, can = canLearn(cls, Bq.id, i);
      return `<div class="tal ${locked ? 'locked' : ''} ${r ? 'has' : ''} ${T.max === 1 ? 'cap' : ''}"><div class="tt"><b>${T.n}</b><span>${r}/${T.max}</span></div><p>${T.d}${T.max > 1 ? '（每点）' : ''}</p>
        ${locked ? `<small>需要本路投入 ${i * TALENT_TIER_REQ} 点</small>` : `<button class="btn sm" ${can ? '' : 'disabled'} data-act="learn" data-arg="${Bq.id}|${i}">修习</button>`}</div>`; }).join('')}</div>`; }).join('')}</div>`;
}
function colTab() {
  const ach = ACHIEVEMENTS.map(A => { const got = !!SAVE.ach[A.id];
    return `<div class="ach ${got ? 'got' : ''}"><b>${A.n}</b><span>${A.d}</span></div>`; }).join('');
  const nGot = ACHIEVEMENTS.filter(A => SAVE.ach[A.id]).length;
  const mons = allMonsterDefs().map(d => { const k = SAVE.kills[MK(d.n)] || 0, t = bestiaryTier(d.n), nx = BESTIARY_TIERS[t];
    return `<div class="mon ${k ? '' : 'unk'}">${SPR.img(d.spr, 40, d.pal)}<b>${k ? d.n : '？？？'}</b><small>斩 ${k}${nx ? ' / ' + nx : ''}</small><span class="tier">${'★'.repeat(t)}${'☆'.repeat(3 - t)}</span></div>`; }).join('');
  const cl = storyCleared('normal');
  const replay = CHAPTERS.map((C, i) => { const k = i + 1; if (k > cl) return '';
    return `<div class="rp"><b>${chTitle(k)}</b><button class="btn sm ghost" data-act="replay" data-arg="${k}|intro">开场</button>${C.story ? `<button class="btn sm ghost" data-act="replay" data-arg="${k}|story">${C.story.t}</button>` : ''}${C.outro.length ? `<button class="btn sm ghost" data-act="replay" data-arg="${k}|outro">结尾</button>` : ''}</div>`; }).join('') + (SAVE.story.ended ? '<div class="rp"><b>终章</b><button class="btn sm" data-act="replay" data-arg="10|ending">结局</button></div>' : '');
  const rec = [...CHAPTERS.map((C, i) => { const b = SAVE.best['normal-' + (i + 1)]; return [chTitle(i + 1), b ? fmtTime(b.t) : '—']; }),
    ['幻境最高层', SAVE.riftMax || '—'], ...CLASS_IDS.filter(c => SAVE.riftRec[c]).map(c => ['幻境·' + CLASSES[c].n, riftRecTxt(SAVE.riftRec[c])]), ['累计斩妖', SAVE.stats.kills], ['招财金蟾', SAVE.stats.goblins], ['完成悬赏', SAVE.stats.bounties]];
  return `${bountyHTML()}${featureOn('rift') ? zyHTML() : ''}<div class="cols"><div>
    <section class="panel"><h3>剧情回顾 <small>已经看过的剧情可以随时重看</small></h3>${replay || '<div class="empty-note">打通第一章后可以回看剧情。</div>'}</section>
    <section class="panel"><h3>成就 <small>${nGot}/${ACHIEVEMENTS.length}</small></h3><div class="achs">${ach}</div></section>
  </div><div>
    <section class="panel"><h3>个人纪录 <small>凡尘难度各章最快用时</small></h3><div class="stats">${rec.map(([n, v]) => `<div><span>${n}</span><b>${v}</b></div>`).join('')}</div></section>
    <section class="panel"><h3>传奇图鉴 <small>${Object.keys(SAVE.codex || {}).filter(k => LEGENDS.some(l => l.id === k)).length}/${LEGENDS.length} · 本职业的专属传奇标了职业名</small></h3><div class="codex">${LEGENDS.map(L => { const got = SAVE.codex && SAVE.codex[L.id];
      return `<div class="${got ? 'got' : 'no'}"><b>${got ? L.n : '？？？'}</b><i>${(SLOTS.find(x => x.id === L.slot) || {}).n || ''}${L.cls ? ' · ' + CLASSES[L.cls].n : ' · 通用'}${L.ch ? ' · 多见于第' + L.ch + '章' : ''}</i><br>${got ? L.d : '尚未得到'}</div>`; }).join('')}</div></section>
    <section class="panel"><h3>百妖谱 <small>每种妖物斩 ${BESTIARY_TIERS.join(' / ')} 只点亮一颗星</small></h3><div class="mons">${mons}</div></section>
  </div></div>`;
}
// ---------- 镇妖录 ----------
let ZYOPEN = false, ZYPG = -1;
function zyHTML() {
  const cls = SAVE.cls, my = SAVE.chars[cls].yi || [];
  const nAll = ZY_PAGES.reduce((a, _, i) => a + zyEntries(i).filter(e => zyOf(e.n)).length, 0), tot = ZY_PAGES.reduce((a, _, i) => a + zyEntries(i).length, 0);
  const defs = allMonsterDefs(), dOf2 = n => defs.find(d => d.n === n);
  const yiList = Object.keys(YISHI).map(id => { const Y = YISHI[id], g = yiGrade(id), on = my.includes(id), bossN = zyEntries(Y.pg).filter(e => e.boss).map(e => e.n).join('、');
    return `<button class="yi ${on ? 'on' : ''} ${g ? '' : 'lock'}" data-act="yi" data-arg="${id}" ${g ? '' : 'disabled'}><b>${Y.n}</b><small>${g ? bossN + ' · ' + ZY_CN[g] : '收服' + bossN + '后可用'}</small><span>${Y.d(Math.max(1, g))}</span></button>`; }).join('');
  const pages = ZY_PAGES.map((Pg, i) => {
    const E = zyEntries(i), got = E.filter(e => zyOf(e.n)).length, pts = zyPagePts(i), done = zyPageDone(i), open = ZYPG === i;
    const bonus = Object.entries(Pg.st).map(([k, v]) => fmtStat(k, +(pts * v).toFixed(1))).join('，');
    const ents = E.map(e => { const g = zyOf(e.n), d = dOf2(e.n);
      return `<div class="zye ${g ? 'g' + g : 'unk'} ${e.boss ? 'boss' : ''}">${d ? SPR.img(d.spr, 34, d.pal) : ''}<b>${g || (SAVE.kills[MK(e.n)] || 0) ? e.n : '？？？'}</b><small>${g ? ZY_CN[g] : '未收服'}</small></div>`; }).join('');
    return `<div class="zyp ${done ? 'done' : ''} ${open ? 'open' : ''}"><button class="zyh" data-act="zyp" data-arg="${i}"><b>其${CN[i + 1]} · ${CHAPTERS[i].n}</b><span>${got}/${E.length} 种 · ${pts ? bonus : Pg.sd}</span><i>${done ? '后记' : ''}${open ? '▲' : '▼'}</i></button>
      ${open ? `<div class="zyb"><div class="zyes">${ents}</div>
        <p class="sub">这一页每有 1 品，${Object.entries(Pg.st).map(([k, v]) => fmtStat(k, v)).join('，')}。${done ? '' : `收服首领和至少 ${ZY_NEED} 种妖物，可以读到这一页的后记（现在 ${E.filter(e => !e.boss && zyOf(e.n)).length}/${ZY_NEED}${E.some(e => e.boss && zyOf(e.n)) ? '' : '，首领还没收'}）。`}</p>
        ${done ? `<div class="hou"><h4>后记</h4>${Pg.hou.split('\n').map(t => `<p>${t}</p>`).join('')}</div>` : ''}</div>` : ''}</div>`; }).join('');
  return `<section class="panel zylu" id="zylu"><h3>镇妖录 <small>${nAll}/${tot} 种 · 幻境里的首领、精英，偶尔还有小妖，会留下精魄</small></h3>
    <p class="help-p">精魄的品级看幻境层数：1–19 层一品，20 层二品，40 层三品，60 层四品，80 层以上五品。品级越高，这一页给的属性越多；收服一章的首领，就能把它带在身边「役使」。</p>
    <h4 class="sub-h">役使 <small>${CLASSES[cls].n}最多带 2 只，点一下带上或放下</small></h4><div class="yis">${yiList}</div>
    <div class="zyps">${pages}</div></section>`;
}
// ---------- 主页面 ----------
const CH_THEME = [null, '醒', '守护', '贪', '心', '舍身', '真相', '名字', '怕死', '回家的路', '这次换我'];
const CH_ACCENT = [null, '#7fd8b0', '#7fc46a', '#e86aa8', '#ff7a2a', '#9ae05a', '#9fd8ff', '#c9a0ff', '#f0d080', '#a0b8ff', '#ffd75a'];
const INTER = { 3: ['幕间一', '醉仙楼重新开张', '热闹', '天黑了，整条街挂满了红灯笼。'], 4: ['幕间二', '七夕灯会', '心意', '河上的灯，一盏一盏漂远了。'],
  6: ['幕间三', '三百年前的梦', '送饭', '那一年，你十五岁。'], 8: ['幕间四', '出征前夜', '告别', '天亮之前，每个人都来了。'] };
const hasProgress = () => !!(SAVE.run || storyCleared('normal') > 0 || CLASS_IDS.some(c => SAVE.chars[c].level > 1) || Object.keys(SAVE.world || {}).length);
function titleHTML() {
  const prog = hasProgress(), cls = SAVE.cls, lv = SAVE.chars[cls].level;
  const ch = SAVE.run ? SAVE.run.chapter : Math.min(10, storyCleared('normal') + 1);
  const emb = Array.from({ length: 18 }, (_, i) => `<i class="tl-emb" style="--x:${(i * 53) % 100}%;--d:${6 + (i * 7) % 9}s;--dl:${-(i * 1.3) % 9}s;--s:${2 + i % 3}px"></i>`).join('');
  return `<div class="title">
    <div class="tl-sky"><i class="tl-moon"></i><i class="tl-mtn a"></i><i class="tl-mtn b"></i><i class="tl-town"></i><i class="tl-fog a"></i><i class="tl-fog b"></i>${emb}</div>
    <div class="tl-head"><h1>九幽回廊</h1><p>三百年前，五人为钉，天狐为锁。</p></div>
    <div class="tl-menu">
      ${prog ? `<button class="btn big" data-act="tcont">继续游戏<small>${esc(CLASSES[cls].n)} ${lv} 级 · ${esc(chTitle(ch))}${SAVE.test ? ' · 试玩角色' : ''}</small></button>
        <button class="btn ghost" data-act="tnew">重新开始</button>` : `<button class="btn big" data-act="tcont">开始游戏</button>`}
      <div class="tl-row"><button class="btn ghost" data-act="tsave">存档</button><button class="btn ghost" data-act="tset">设置</button></div>
    </div>
    <p class="tl-sign">涂与豪作品</p>
    <p class="tl-lang">${[['zh', '中文'], ['vi', 'Tiếng Việt']].map(([k, n]) => `<a data-act="lang" data-arg="${k}" class="${(window.LANG || 'zh') === k ? 'on' : ''}">${n}</a>`).join(' · ')}</p>
    <p class="tl-foot">${storageOK ? `进度自动保存在这台设备上${bkDue() ? ' · <a data-act="tsave">建议备份一下</a>' : ''}` : '当前浏览器不允许保存进度'}</p>
  </div>`;
}
// 每章开头的「上回说到」
const CH_RECAP = {
  2: ['你从乱葬岗的坟里醒来，什么也记不得。', '义庄的刘师傅、女捕快珍姑娘、药铺的 Ngoc……你打倒了僵尸县令，从地宫里救出了卖豆腐的王二。', '王二说，带走另外六个人的，是一个穿白衣服的道士。', '坟里那根断掉的钉子，Ngoc 悄悄收了起来。'],
  3: ['你从黑风林救回了镖局的小虎，打倒狼妖王，拿到了木之钉。', '青木子的声音说：「钉子在，人就在。」', '钉子吸人阳气，你差点没醒过来——是白云观的清虚道长救了你。你把钉子交给了他。', 'Ngoc 听说之后，药碾子掉在了地上。'],
  4: ['盘丝洞里，康总管为了伙计们的工钱，交出了他娘留的长命锁。', '你打倒蜘蛛娘娘，拿到金之钉，听见了金不换的声音。', '茧室里那张绣着九条尾巴的蛛网，是「白衣仙长」定制的——一人一尺。', '醉仙楼重新开张那晚，清虚送来一盒安神香。Ngoc 变了脸色。'],
  5: ['火焰窟里，张大锤和铁蛋父子俩一起打了一颗心。', '你拿到火之钉，烈阳子骂你「哭什么哭」，你想起了自己名字的一半——「土」。', '避火符背面的朱砂印，和矿洞铁链上的一模一样。', '七夕那晚，珍姑娘从小偷身上搜出了一张白云观的度牒。'],
  6: ['万毒沼的毒雾，是白云观的符「催」出来的。', 'Ngoc 替你挡了蛇母一口，高烧的时候一直喊「阿土」。你把她救了回来。', '夜里，她把一根断钉放进你手里，又收了回去：「……还不是时候。」'],
  7: ['昆仑冰窟里，玄冰子认出了你——「小师弟」。', '三百年前，送饭的孩子阿土，替临阵逃走的白云子做了第五枚钉子。', '五枚钉子是锁；凑在一起，就是钥匙。', '你终于想起了自己的名字。', '那天夜里你发了高烧，梦见一只白狐说「我等你」。醒来时，Ngoc 趴在床边睡着了。'],
  8: ['鬼市里，生死簿的残页上写着：「阿土，十五岁，替兄守钉，魂未散。」', '可等你回到青石镇，药铺空了。柜台上只剩一只狐尾铃铛，和一张字条：「药钱不用还了。」', '珍姑娘说，白云观的门开了，里面全是人。'],
  9: ['白云观里，清虚撕下道袍，露出了三百年前的白云子。他被吸进了天坑。', 'Ngoc 挣开九尾网，自己跳了下去，从里面撑住了门：「这回……换你来接我。」', '铁蛋和张大锤，正连夜重铸土之钉。'],
  10: ['你过了鬼门关，走过黄泉路和奈何桥。牛头马面成了盟友，雷老虎带着镖局守在坑口。', '铁蛋满身是灰，送来了通红的土之钉。', '锁链里的九尾白狐抬起头——「我来接你了。」'],
};
const recapLines = ch => (CH_RECAP[ch] || []).map((t, i) => ['narr', (i ? '' : '【上回说到】') + t]);
function playPrologue() {
  if (seen('prologue')) return; markSeen('prologue'); save();
  setTimeout(() => playDialog([
    ['narr', '青石镇。一座建在古老回廊之上的边陲小镇。'],
    ['narr', '三百年前，九尾天狐与五位镇妖师，将九幽魔尊封在了镇子底下。'],
    ['narr', '三百年后，封印开始松动。死人从坟里爬出来，镇上的人一个接一个失踪。'],
    ['narr', '而你，正躺在乱葬岗上，什么也想不起来——'],
    ['narr', '（选一个职业，在「出征」里开始第一章）'],
  ], null), 400);
}
// 每章 / 幕间开场：3–5 秒的小动画，点一下可以跳过
function chapterIntro(o, done) {
  const el = document.createElement('div'); el.className = 'chint'; el.style.setProperty('--ac', o.ac || '#ffd75a');
  const emb = Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${2.5 + (i % 4) * 0.6}s;--dl:${(i % 5) * 0.25}s"></i>`).join('');
  el.innerHTML = `<div class="ci-ink"></div><div class="ci-emb">${emb}</div><div class="ci-box"><div class="ci-no">${esc(o.no)}</div><div class="ci-name">${esc(o.name)}</div>
    <div class="ci-theme"><span>${esc(o.theme)}</span></div><div class="ci-sub">${esc(o.sub || '')}</div></div><div class="ci-skip">点一下跳过</div>`;
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
  return `<section class="panel"><h3>试玩 <small>测试用，不用从头玩</small></h3>
    ${SAVE.test ? `<p class="help-p"><b style="color:var(--gold2)">现在用的是试玩角色（${CLASSES[SAVE.test.cls].n} · 从第 ${SAVE.test.ch} 章${SAVE.test.inter ? '的幕间' : ''}开始）</b></p>` : ''}
    <p class="help-p">选职业和章节，直接进入那一章。等级、装备、心法、同伴、前几章拿到的道具和美食，都按「正常玩到这一章」准备好（比如第三章：13 级，两件稀有、其余蓝装）。你自己的存档会先备份，随时可以切回来。</p>
    <div class="row">${CLASS_IDS.map(c => `<button class="btn sm ${c === cls ? '' : 'ghost'}" data-act="tcls" data-arg="${c}">${CLASSES[c].n}</button>`).join('')}</div>
    <div class="row" style="margin-top:6px">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => `<button class="btn sm ghost" data-act="tstart" data-arg="${c}">第${c}章</button>`).join('')}</div>
    <div class="row" style="margin-top:6px">${[[3, '幕间一'], [4, '幕间二'], [6, '幕间三'], [8, '幕间四']].map(([c, n]) => `<button class="btn sm ghost" data-act="tstart" data-arg="${c}i">${n}</button>`).join('')}</div>
    ${bak ? `<div class="row" style="margin-top:6px"><button class="btn sm" data-act="trestore">回到我自己的存档</button></div>` : ''}
  </section>`;
}
const langRow = () => `<div class="row lang-row">${[['zh', '中文'], ['vi', 'Tiếng Việt']].map(([k, n]) => `<button class="btn sm ${(window.LANG || 'zh') === k ? '' : 'ghost'}" data-act="lang" data-arg="${k}">${n}</button>`).join('')}</div>`;
const setBasic = () => `<section class="panel"><h3>语言 · Ngôn ngữ</h3>${langRow()}</section><section class="panel"><h3>声音</h3><div class="row"><button class="btn ghost" data-act="snd">音效：${SAVE.sound ? '开' : '关'}</button><button class="btn ghost" data-act="mus">古琴背景：${SAVE.music ? '开' : '关'}</button></div>
  <label class="volrow"><span>音乐音量</span><input type="range" min="0" max="100" step="5" value="${Math.round(mvolOf() * 100)}" data-vol="m"><b id="mvolv">${Math.round(mvolOf() * 100)}%</b></label>
  <p class="help-p" style="margin:10px 0 6px">配乐试听（点一下就放那个地方的音乐）：</p>
  <div class="row mtest">${[['town', '青石镇'], ['c1', '坟场'], ['c2', '黑风林'], ['c3', '盘丝洞'], ['c4', '火焰窟'], ['c5', '万毒沼'], ['c6', '昆仑冰窟'], ['c7', '鬼市'], ['c8', '白云观'], ['c9', '九幽上层'], ['c10', '九幽深渊'], ['sad', '篝火夜话'], ['battle', '普通打斗'], ['boss', '首领战']].map(([k, n]) => `<button class="btn sm ${MTEST && MTEST.id === k ? '' : 'ghost'}" data-act="mtest" data-arg="${k}">${n}</button>`).join('')}<button class="btn sm ghost" data-act="mtest" data-arg="">停</button></div>
  <p class="help-p" style="margin-top:6px">手机外放听不到低音，戴耳机更完整。大多数地方都很空，隔十来秒才来一句，是故意的。</p></section>
    <section class="panel"><h3>操作</h3><p class="help-p">大地图上：点哪走哪；点上方的任务栏自动前往；电脑上可以用方向键或 WASD。</p><div class="row"><button class="btn ghost" data-act="joy">虚拟摇杆：${SAVE.joy ? '开' : '关'}</button>
      <button class="btn ghost" data-act="fs">字号：${({ 0.9: '小', 1: '标准', 1.15: '大', 1.3: '特大' })[SAVE.fs || 1] || '标准'}</button>
      <button class="btn ghost" data-act="guide">任务指引：${SAVE.guide === 'full' ? '详细' : '线索'}</button></div>
      <p class="help-p">任务指引「线索」：只告诉你大概在哪一带，东西要自己找；「详细」：直接标出位置。</p>
      </section><section class="panel"><h3>画面</h3><div class="row"><button class="btn ghost" data-act="gfxq">特效：${['低', '中', '高'][SAVE.gfx != null ? SAVE.gfx : 2]}</button>
      <button class="btn ghost" data-act="cine">大招演出：${SAVE.cineOff ? '关' : '开'}</button>
      <button class="btn ghost" data-act="hdpx">像素：${SAVE.hdOff ? '经典' : '高清'}</button></div>
      <p class="help-p">手机发烫或卡顿时把特效调到「低」：粒子减少，不再顿帧、慢镜。</p></section>`;
// ---------- 存档备份 ----------
const fmtDay = t => { const d = new Date(t), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`; };
const briefLine = b => `${esc(CLASSES[b.cls] ? CLASSES[b.cls].n : b.cls)} ${b.lv} 级 · ${b.ended ? '已通关全部十章' : `已通关 ${b.cleared} 章`} · 银两 ${b.gold}`;
const bkDue = () => hasProgress() && (!SAVE.bk || (SAVE.bk.c || 0) < storyCleared('normal'));   // 打过新的一章还没备份
function markBackup() { SAVE.bk = { t: Date.now(), c: storyCleared('normal') }; }
const setSave = () => (prepZ(), '') + `<section class="panel bkp"><h3>存档备份</h3>
      <p class="help-p">进度只存在这台设备的这个浏览器里：清理缓存、换手机、换浏览器打开，进度都会丢。建议每打完一章备份一次。</p>
      <p class="bk-now"><b>现在的进度</b>${briefLine(saveBrief(SAVE))}<small>${SAVE.bk ? `上次备份：${fmtDay(SAVE.bk.t)}` : '还没有备份过'}</small></p>
      <div class="row"><button class="btn sm" data-act="export">复制存档码</button><button class="btn sm ghost" data-act="bkfile">保存成文件</button></div>
      <p class="help-p bk-tip">存档码是一长串字符。复制后发给自己（比如微信「文件传输助手」、Zalo 自己的聊天）存起来；太长发不出去时，用「保存成文件」。</p>
      <h3 style="margin-top:14px">恢复进度</h3>
      <textarea id="imp" placeholder="把存档码粘贴到这里"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="import">读取存档码</button><button class="btn sm ghost" data-act="bkpick">从文件恢复</button><input type="file" id="bkf" accept=".txt,text/plain" hidden></div>
      <div class="row" style="margin-top:14px"><button class="btn sm ghost" data-act="reset">删除存档重新开始</button></div></section>`;
let IMPORTING = null;
const importModal = () => () => { const a = saveBrief(IMPORTING), b = saveBrief(SAVE), older = hasProgress() && (a.cleared < b.cleared || (a.cleared === b.cleared && a.lv < b.lv));
  return `<h2 class="mh">恢复这份存档？</h2>
    <div class="bk-cmp"><div class="in"><small>存档码里的进度</small><b>${briefLine(a)}</b>${a.t ? `<small>保存于 ${fmtDay(a.t)}</small>` : ''}</div>
    ${hasProgress() ? `<div><small>这台设备上现在的进度（会被覆盖）</small><b>${briefLine(b)}</b>${b.t ? `<small>保存于 ${fmtDay(b.t)}</small>` : ''}</div>` : ''}</div>
    ${older ? '<p class="bk-warn">注意：存档码里的进度比现在的还少。确认要用旧的覆盖新的吗？</p>' : ''}
    <div class="row"><button class="btn" data-act="doimport">恢复这份存档</button><button class="btn ghost" data-act="imcancel">取消</button></div>`; };
let ZCODE = null;   // 提前压好的短存档码（JY2）。点「复制」那一下必须同步完成，所以面板一打开就先压好
function prepZ() { ZCODE = null; exportSaveZ().then(c => { ZCODE = c; }).catch(() => {}); }
async function tryImport(str) {
  try { IMPORTING = await decodeSaveAny(str); } catch (e) { IMPORTING = null; return toast(e.message === 'cut' ? '存档码不完整：可能复制时被截断了，请重新完整复制一次' : e.message === 'old' ? '这个浏览器太旧，读不了这份存档码——换一个浏览器打开游戏再恢复' : '这不是存档码，请检查一下'); }
  BACK = MODALFN; openModal(importModal());
}
// 选章试玩：测试用，平时折起来，不打扰正常游玩
const testFold = () => `<details class="testfold" ${SAVE.test || testBackup() || TEST_BAK ? 'open' : ''}><summary>选章试玩 <small>测试用</small></summary>${testPanel()}</details>`;
function setTab() {
  return `<div class="cols"><div>
    ${setBasic()}
    ${setSave()}
    ${testFold()}
  </div><div>
    <section class="panel"><h3>江湖指南</h3>
      <ul class="help">
        <li><b>主线</b>：十章故事，每章三层迷宫。每层先打败「守门妖将」拿钥匙，才能开首领的门。第三层是本章大首领。</li>
        <li><b>探索</b>：点地图上的地点，角色会走过去；也可以打开「自动探索」，有事才会停下。</li>
        <li><b>战斗</b>：全自动。你只要选路线、处理奇遇、换装备、点心法。气血低于 35% 会自动服用丹药。</li>
        <li><b>成长</b>：前期只有等级、装备、心法。之后跟着剧情逐个开放：第四章强化，第五章镶玉，第六章乾坤袋，第七章武学变招。</li>
        <li><b>通关后</b>：开启九幽幻境（无尽层数）、修罗难度、修为、灵玉、洗炼、江湖悬赏、加难度。</li>
        <li><b>招财金蟾</b>：迷宫里偶尔出现，几回合后会逃，打死能爆一地宝贝。</li>
        <li>死了不会丢任何装备、经验和材料。</li>
      </ul></section>
  </div></div>`;
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
    const label = hide ? '未知' : (ROOM_TYPES[c.type] || { n: '' }).n + (c.cleared && c.type !== 'shop' ? '（已清理）' : '');
    places += `<button class="place ${c.visited ? 'vis' : 'seen'} ${here ? 'here' : ''} t-${hide ? 'unknown' : c.type} ${can ? 'can' : ''} ${FRESH.has(c.i) ? 'fresh' : ''}" style="${cellPos(c)}" ${can ? '' : 'disabled'} data-act="cell" data-arg="${c.i}" aria-label="${label}" title="${label}">
      <span class="pl-base"></span><span class="pl-ic">${roomIcon(run, c)}</span></button>`;
  }
  FRESH = new Set();
  const rooms = M.cells.filter(c => c.room), vis = rooms.filter(c => c.visited).length;
  const hint = run.mode === 'rift'
    ? (bossLocked(run) ? '斩妖填满进度，<b>守关妖王</b>就会现身。' : '守关妖王现身了！')
    : (run.hasKey ? (run.floor < 3 ? '钥匙在手，去打败这一层的首领。' : `钥匙在手，<b>${themeOf(run).boss.n}</b>就在前面。`) : '找到<b>守门妖将</b>（钥匙图标），夺取钥匙才能开首领之门。');
  return `${runBar(run)}
    ${run.mode === 'rift' ? `<div class="rprog"><i style="width:${run.prog}%"></i><span>幻境进度 ${Math.floor(run.prog)}%</span></div>${xiangBar(run)}` : ''}
    <p class="maphint">${hint}<span class="sub">　${vis}/${rooms.length}</span></p>
    <div class="maze2" style="--g:${T.g};--p:${T.p}">
      <div class="terrain" style="-webkit-mask-image:${mask.join(',')};mask-image:${mask.join(',')}">${deco}${cor}</div>
      ${places}
      <div class="walker" id="walker" style="${cellPos(M.cells[run.pos])}">${heroSpr(run.cls, 40)}</div>
    </div>
    <div class="mapctl"><button class="btn ${AUTO ? '' : 'ghost'} autob" data-act="auto">${AUTO ? '自动探索中…' : '自动探索'}</button>
      <button class="btn ghost" data-act="bag">人物${talentInfo(run.cls).free ? ` <b class="upn">${talentInfo(run.cls).free}</b>` : ''}</button><button class="btn ghost" data-act="retreat">撤退</button></div>`;
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
function stopAuto() { if (AUTO) { AUTO = false; const b = document.querySelector('.autob'); if (b) { b.classList.add('ghost'); b.textContent = isRift(SAVE.run) ? '自动寻妖' : '自动探索'; } } clearTimeout(autoT); }
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
  if (run.hp < runStats(run).maxHp * 0.3 && run.potions === 0) { stopAuto(); return toast('气血太低，丹药也用完了，自动探索先停下。找篝火歇一歇，或者换件装备。'); }
  const t = autoTarget(run);
  if (t == null) { stopAuto(); return toast(run.mode === 'rift' ? (bossLocked(run) ? '这一层逛完了。' : '守关妖王现身了，准备好就去挑战。') : run.hasKey ? '这一层都走遍了，首领就在前面。' : '都走遍了……钥匙一定在守门妖将身上。'); }
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
      return playDialog(C.story.lines, C.boss, () => { const got = applyStoryReward(run, C.story.reward); clearCell(run); save(); render(); SFX.play('rare'); if (got.length) toast(got.join('　·　')); });
    }
    case 'page': { const txt = collectPage(run); clearCell(run); save(); render(); SFX.play('legend'); openModal(pageModal(run.chapter, txt)); achToast(checkAch()); return; }
    case 'event': if (!c.ev) c.ev = RNG.pick(EVENTS).id; VIEW = 'event'; break;
    case 'rest': VIEW = 'rest'; break;
    case 'chest': CHEST = openChest(run); clearCell(run); VIEW = 'chest'; SFX.play('loot'); break;
    case 'gold': { const g = EV.gold(run, 6); clearCell(run); SFX.play('coin'); toast(`捡到 ${g} 两银子`); break; }
    default: { clearCell(run); if (RNG.ch(0.12)) { const n = EV.mats(run, 1); toast(`角落里有 ${n} 颗魂晶`); } }
  }
  save(); render();
}
const pageModal = (k, txt) => () => `<div class="pagebig">${SPR.img('scroll', 64)}<h2 class="mh">残卷·其${CN[k]}</h2><p>${esc(txt)}</p><small>永久：伤害 +1%，气血 +1%</small>
  <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-act="close">收好</button></div></div>`;

// ---------- 战斗 ----------
function beginBattle(kind) {
  B = startBattle(SAVE.run, kind); B.logs = []; BRES = null; VIEW = 'battle'; COMBO = { n: 0, t: null }; save(); render();
  const run = SAVE.run, F = themeOf(run);
  const bossName = kind === 'boss' ? B.units.find(u => u.kind === 'boss').name : '';
  B.logs.push({ boss: run.mode === 'rift' ? `${bossName}现身了！` : run.floor < 3 ? `${bossName}拦住了去路！` : `${F.boss.n}出现了！${F.boss.d}。`, keeper: '守门妖将挡住了去路！', elite: B.units.some(u => u.rare) ? '一只有名号的妖物挡住了去路！' : '一只精英妖物挡住了去路！', goblin: '招财金蟾！快在它溜走之前拿下！' }[kind] || '妖物扑了上来！');
  SFX.play(kind === 'boss' ? 'gong' : kind === 'goblin' ? 'coin' : 'door');
  if (kind === 'boss' && run.mode === 'story' && run.floor === 3) banner(F.boss.n, F.boss.d, 1800);
  updBattle(null); schedule();
}
const CAST_NAMES = { ngocHeal: '扔来一瓶药', foxHeal: '用狐火为你疗伤', foxfire: '放出一团狐火', foxfireAll: '狐火漫天', potionThrow: '扔出一瓶「不知道是什么」的药',
  blade2: '挥刀劈下', chain2: '甩出锁链', zhengjue: '念了一句正气诀', zhengqi: '高声诵读《正气歌》', gen: '', bossHeal: '吸取毒气回血', roar: '仰天长啸', enrage: '狂暴了', web: '吐丝缠住了你', summon: '召来帮手', phase: '现出真身', phoenix: '凤凰之羽爆燃' };
function narrate(o) {
  if (!o.actor || !o.cast || !B) return '';
  if (o.ult) return `你施展必杀「${o.ult.n}」！`;
  if (o.cast.id === 'charge') return '';
  const u = B.units.find(x => x.id === o.actor); if (!u) return '';
  const dmg = o.pops.filter(p => /^\d+$/.test(p[1])).reduce((a, p) => a + +p[1], 0);
  const crit = o.pops.some(p => p[2] === 'crit' && /^\d+$/.test(p[1]));
  const c = o.cast, who = u.kind === 'hero' ? '你' : u.name;
  let what;
  if (c.id === 'gen') { const k = CLASSES[u.cls] && CLASSES[u.cls].skills.find(x => x.id === c.sk); what = k ? `施展「${k.n}」` : '出手'; }
  else if (CAST_NAMES[c.id]) what = CAST_NAMES[c.id];
  else if (u.kind === 'hero') { const k = CLASSES[u.cls].skills.find(s => s.id === c.id); what = k ? `施展「${k.n}」` : '出手'; }
  else if (c.id === 'bossAoe') what = '施放大范围妖法';
  else if (u.kind === 'minion') what = '扑了上去';
  else what = c.elem && c.elem !== 'phys' ? '施放妖法' : '扑咬';
  return `${who}${isVi() ? ' ' : ''}${what}${dmg ? `，造成 ${dmg} 伤害${crit ? '（暴击）' : ''}` : ''}`;
}
const spdF = () => ({ 1: 1, 2: 0.5, 4: 0.25 }[SAVE.speed] || 1);
function schedule(o) {
  clearTimeout(timer); if (!B || B.over) return;
  let ms = o ? Math.min(800, Math.max(120, (o.dt || 8) * 18)) * spdF() : 500;
  if (o && (o.ult || (o.cast && (o.cast.id === 'phase' || o.cast.id === 'enrage')))) ms += CUT_MS();
  if (o && o.foilKey) ms += 950 * spdF();
  timer = setTimeout(tick, ms);
}
const CUT_MS = () => SAVE.speed === 4 ? 650 : SAVE.speed === 2 ? 900 : 1150;
function tick() {
  if (!B || VIEW !== 'battle') return;
  // 手动出招：轮到你时停下来等你点
  if (!B.castAuto && !B.over) { const nx = turnOrder(B, 1)[0]; if (nx === B.P && !B.P.st.frozen && !B.castReq && !B.ultReq) { B.waiting = true; applyStep(null); return; } }
  B.waiting = false;
  const o = battleStep(B); const nl = narrate(o); if (nl && !(o.lines.length && !o.pops.some(p => /^\d+$/.test(p[1])))) B.logs.push(nl); B.logs.push(...o.lines); updBattle(o, true);
  if (B.over) setTimeout(endBattle, o.ult ? CUT_MS() + 300 : 250); else schedule(o);
}
function skipBattle() {
  clearTimeout(timer); let n = 0; B.ultAuto = true; B.castAuto = true;
  while (!B.over && n++ < 8000) { const o = battleStep(B); B.logs.push(...o.lines); }
  updBattle(null); endBattle();
}
function endBattle() {
  if (BRES) return;
  BRES = finishBattle(B);
  if (BRES.win) { clearCell(SAVE.run); VFX.victory('P'); }
  if (BRES.win && isRift(SAVE.run) && B.kind !== 'boss') {   // 幻境里的普通合战：不停下来看结算，掉的东西记在这一局里，回地图接着打
    const run = SAVE.run, n = B.dead.length, good = BRES.items.filter(i => i.anc || i.rarity === 'legend' || i.rarity === 'set');
    save(); flushBattleToasts(); SFX.play(good.length ? 'legend' : BRES.levels ? 'level' : 'win');
    qtoast(`斩 ${n} 只 · 进度 ${Math.floor(run.prog)}%${BRES.items.length ? ` · 装备 ${BRES.items.length} 件` : ''}`);
    for (const it of good) qtoast(`得到 <b class="r-${it.rarity}">${esc(itemTitle(it))}</b>`);
    if (BRES.zy && BRES.zy.length) qtoast(`精魄 +${BRES.zy.length}`);
    if (BRES.levels) qtoast(SAVE.chars[run.cls].level >= MAX_LV ? `修为突破：${realmName(SAVE.para.lv)}` : `升级！现在 ${SAVE.chars[run.cls].level} 级`);
    achToast(BRES.ach); BRES.items.forEach(i => delete i.auto);
    return setTimeout(() => { if (BRES && VIEW === 'battle') battleContinue(); }, 500);
  }
  save(); showRes();
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
  const extra = [BRES.mats ? `魂晶 +${BRES.mats}` : '', BRES.key ? '<b style="color:var(--gold2)">得到钥匙！</b>' : '',
    BRES.goblin === 'killed' ? '<b style="color:var(--gold2)">金蟾被你拿下了！</b>' : BRES.goblin === 'fled' ? '金蟾溜走了……' : ''].filter(Boolean).join('　·　');
  const lvText = BRES.levels ? `　<b style="color:var(--gold2)">${ch.level >= MAX_LV ? `修为突破：${realmName(SAVE.para.lv)}！` : `升级！现在 ${ch.level} 级，获得心法点`}</b>` : '';
  const cont = run.world ? '继续' : B.kind === 'boss' ? (run.mode === 'rift' ? '完成幻境' : run.floor < 3 ? '前往下一层' : '本章完结') : '继续探索';
  const autoEq = BRES.items.filter(i => i.auto);
  if (autoEq.length) { toast('空着的位置自动穿上了：' + autoEq.map(i => `<b>${esc(i.name)}</b>`).join('、')); autoEq.forEach(i => delete i.auto); }
  el.innerHTML = BRES.win
    ? `<div class="res win"><h3>胜</h3><p>经验 +${BRES.xp}${lvText}　·　银两 +${BRES.gold}${extra ? '　·　' + extra : ''}</p>
       ${lootChips(BRES.items)}${gemChips(BRES.gems)}${zyChips(BRES.zy)}${BRES.items.length || BRES.gems.length || (BRES.zy && BRES.zy.length) ? '' : '<p class="sub">这次没有掉装备</p>'}
       <button class="btn big" data-act="bcont">${cont}</button></div>`
    : (WKEY && WKEY.key && WKEY.key.scripted ? `<div class="res lose"><h3>撑不住了</h3><p>它太强了。你握刀的手在发抖——</p><button class="btn big" data-act="bcont">……</button></div>`
      : run.mode === 'rift' ? `<div class="res lose"><h3>倒下了</h3><p>幻境不收你的命，只收你的香：你会被吐回入口，香烧掉一截（倒得越多烧得越多）。打倒你的那群妖物还在原地。</p><button class="btn big" data-act="bcont">爬起来</button></div>`
      : `<div class="res lose"><h3>败</h3><p>这次得到的装备、材料、经验都已保留。${run.world ? '你会在最近的篝火边醒来。' : run.ngoc ? 'Ngoc 把你拖回了镇上。' : ''}</p><button class="btn big" data-act="bcont">${run.world ? '回到篝火' : '回镇上'}</button></div>`);
}
function battleHTML() {
  const run = SAVE.run, T0 = run.world && SCENE_THEMES[run.sth || run.theme], T = T0 || terrainOf(run), U = ULTS[run.cls];
  const wxl = T0 && T0.wx ? `<div class="wxl wx-${T0.wx}">${Array.from({ length: 14 }, () => `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:-${(Math.random() * 8).toFixed(1)}s;animation-duration:${(5 + Math.random() * 6).toFixed(1)}s"></i>`).join('')}</div>` : '';
  const deco = [0.08, 0.3, 0.55, 0.8].map((x, i) => { const D = T.d[i % T.d.length]; return `<span class="svd" style="left:${x * 100}%">${SPR.img(D[0], 44 + i * 6, D[1])}</span>`; }).join('');
  return `${runBar(run)}
    <div class="arena sv ${T0 ? 'k-' + T0.kind : ''}" id="arena" style="--bg:${T0 ? T0.bg : themeOf(run).bg};--g:${T.g};--p:${T.p}">${typeof GFX !== 'undefined' ? `<div class="sv-paint" style="background-image:url(${GFX.background(run.theme || (run.mode === 'rift' ? 'rift' + (themeOf(run).n || '') : 'gen'), T0 || { kind: T.kind || 'field', bg: themeOf(run).bg, g: T.g, p: T.p, wx: T.wx }, B && B.kind === 'boss')})"></div>` : ''}<div class="sv-back">${deco}</div>${wxl}
      <div class="turnbar" id="turnbar"></div><div class="wardbar" id="wardbar" hidden></div><div class="side allies" id="allies"></div><div class="side foes" id="foes"></div>
      <div class="flash" id="flash"></div><div class="fxl"></div><div class="combo" id="combo"></div><div class="cutin" id="cutin"></div><div id="bres"></div></div>
    <div class="hud" id="hud"><div class="hud-sk" id="hudsk"></div>
      <button class="ultb" id="ultb" data-act="ult"><i id="ultfill"></i><span><b>必杀·${U.n}</b><small id="ultpct"></small></span></button>
</div>
    <div class="bctl" id="bctl">${[1, 2, 4].map(s => `<button class="btn sm ${SAVE.speed === s ? '' : 'ghost'}" data-act="speed" data-arg="${s}">${s} 倍速</button>`).join('')}
      <button class="btn sm ghost" data-act="skip">跳过战斗</button>
      <button class="btn sm potb" id="potb" data-act="bpot" ${run.potions > 0 ? '' : 'disabled'}>吃丹药 ×${run.potions}</button></div>
    <div class="blog" id="blog" data-act="logt" title="点击展开/收起"></div>`;
}
function unitEl(u) {
  const el = document.createElement('div');
  el.className = 'unit k-' + u.kind + (u.rare ? ' rare' : '') + ' spawn'; el.id = 'u-' + u.id;
  if (u.side === 'e') { el.dataset.act = 'btarget'; el.dataset.arg = u.id; }
  const size = { hero: 64, boss: u.guard ? 76 : 112, elite: u.rare ? 68 : 60, normal: 48, mini: 38, minion: 40, goblin: 54, ally: 56, ward: 60 }[u.kind] || 48;
  el.dataset.pal = JSON.stringify(u.pal || null); el.dataset.size = size;
  const img = u.kind === 'hero' ? heroSpr(u.cls, size) : SPR.img(u.spr || 'skeleton', size, u.pal), spr = u.kind === 'hero' ? CLASSES[u.cls].spr : u.spr;
  el.style.setProperty('--sz', size + 'px'); const ic = VFX.idleCls(spr); if (ic) el.classList.add(ic);
  if (u.kind === 'hero' && SAVE.chars[u.cls]) { const E = SAVE.chars[u.cls].eq || {}, w = E.weapon; if (w && w.rarity) el.classList.add('wr-' + w.rarity);
    if (Object.values(E).filter(it => it && it.rarity === 'set').length >= 2) el.classList.add('gear-set'); }
  el.innerHTML = `<div class="aura"><i class="a-rage"></i><i class="a-fire"></i><i class="a-tox"></i><i class="a-ice"></i><i class="a-shd"></i><i class="a-cur"></i><i class="a-stun"><b>✦</b><b>✦</b><b>✦</b></i></div><div class="sp">${VFX.rigHTML(u, img, size, spr)}</div>
    <div class="un">${esc(u.name)}</div>
    ${(u.aff && u.aff.length) || u.trait ? `<div class="tags">${u.trait ? `<span class="tr" title="${TRAITS[u.trait].d}">${TRAITS[u.trait].n}</span>` : ''}${(u.aff || []).map(a => { const A = ELITE_AFFIXES.find(x => x.id === a); return `<span title="${A.d}">${A.n}</span>`; }).join('')}</div>` : ''}
    <div class="hpbar"><i></i><b class="sh"></b><span></span></div><div class="sts"></div>`;
  setTimeout(() => el.classList.remove('spawn'), u.kind === 'boss' ? 650 : 400);
  if (u.kind === 'boss' && !u.guard) setTimeout(() => VFX.onLand(u.id), 560);
  return el;
}
function bumpCombo(n) {
  COMBO.n += n; clearTimeout(COMBO.t); COMBO.t = setTimeout(() => { COMBO.n = 0; const c = $('#combo'); if (c) c.className = 'combo'; }, 2400);
  const c = $('#combo'); if (!c || COMBO.n < 3) return;
  c.innerHTML = `<b>${COMBO.n}</b><span>连击</span>`; c.className = 'combo on' + (COMBO.n >= 20 ? ' hot' : ''); bump(c, 'pump', 160);
}
function bump(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }
function sayBubble(id, text) {
  const el = document.getElementById('u-' + id); if (!el || !text) return;
  el.querySelectorAll('.bubble').forEach(x => x.remove());
  const b = document.createElement('div'); b.className = 'bubble'; b.textContent = text; el.appendChild(b);
  setTimeout(() => b.remove(), 2200);
}
function showCutin(kind, data) {
  const el = $('#cutin'); if (!el) return;
  let h;
  if (kind === 'ult') {
    const run = SAVE.run;
    h = `<div class="ci-band"><div class="ci-art">${heroSpr(run.cls, 120)}${data.combo ? unitIcon(run.ngoc === 'fox' ? 'ngocfox' : 'ngoc', 104, null, '', 'full') : ''}</div>
      <div class="ci-txt"><b class="ci-g">${data.g}</b><span>${esc(data.n)}</span></div></div>`;
    el.className = 'cutin on' + (data.combo ? ' combo' : '');
    SFX.play('gong'); if (typeof GFX !== 'undefined') GFX.ult(data.combo ? '#ff9ac0' : '#ffb04a');
  } else {
    h = `<div class="ci-band boss"><div class="ci-art">${SPR.img(data.spr, 120, data.pal)}</div><div class="ci-txt"><b class="ci-g">${kind === 'phase' ? '变' : '怒'}</b><span>${esc(data.name)}</span></div></div>`;
    el.className = 'cutin on boss';
    SFX.play('boss');
  }
  el.innerHTML = h; el.style.setProperty('--cd', CUT_MS() + 'ms');
  clearTimeout(el._h); el._h = setTimeout(() => { el.className = 'cutin'; el.innerHTML = ''; }, CUT_MS());
}
function updBattle(o, anim) {
  if (!B) return;
  if (o && o.say) { const su = B.units.find(u => u.id === o.say[0]); if ((SAVE.speed || 1) < 2 || (su && su.kind === 'boss')) sayBubble(o.say[0], o.say[1]); }
  if (o && anim && o.foilKey) {   // 克制道具生效的特写
    const pp = o.pops.find(p => p[1] === '被克制'), K = (typeof W_KEYS !== 'undefined' && W_KEYS[o.foilKey[0]]) || null;
    VFX.onFoil(pp ? pp[0] : o.actor, K ? SPR.img(K.spr || 'key', 36) : ''); SFX.play('rare');
    const ar = $('#arena'); if (ar) bump(ar, 'foilflash', 700);
  }
  if (o && anim && !SAVE.cineOff && (o.ult || (o.cast && (o.cast.id === 'phase' || o.cast.id === 'enrage')))) {
    if (o.ult) showCutin('ult', o.ult);
    else { const u = B.units.find(x => x.id === o.actor); if (u) showCutin(o.cast.id, u); }
    const b = B;
    setTimeout(() => { if (B !== b) return; const d = VFX.play(o, B); setTimeout(() => { if (B === b) applyStep(o, anim); }, d); }, CUT_MS() * 0.8);
    return;
  }
  if (o && anim) {
    const delay = Math.max(VFX.play(o, B), VFX.lastMv());
    if (delay > 0) { const b = B; setTimeout(() => { if (B === b) applyStep(o, anim); }, delay); return; }
  }
  applyStep(o, anim);
}
// 职业资源：怒意、连、杀意、尸位、反击
function resChip(P) {
  const R = CLASSES[P.cls].res; if (!R) return '';
  if (P.cls === 'berserker') return `<span class="rchip fury ${P.fury >= 50 ? 'hot' : ''}">怒意 <i style="--w:${Math.round(P.fury || 0)}%"></i><b>${Math.round(P.fury || 0)}</b></span>`;
  if (P.cls === 'mage') { const nx = P.lastWx ? WX_SHENG[P.lastWx] : null; return `<span class="rchip lian">连 <b>${P.lian || 0}</b>${nx ? `<small>下一招接<em style="color:${WX[nx].c}">${WX[nx].n}</em></small>` : ''}</span>`; }
  if (P.cls === 'assassin') return `<span class="rchip ki">杀意 ${Array.from({ length: P.kiMax }, (_, i) => `<i class="${i < P.ki ? 'on' : ''}"></i>`).join('')}</span>`;
  if (P.cls === 'necro') return `<span class="rchip">尸位 <b>${zombiesOf(B).filter(z => !ZOMBIES[z.zt].ult).length}/${P.minionCap}</b></span>`;
  if (P.cls === 'paladin') return `<span class="rchip">反击 <b>${Math.min(85, P.counter + (P.shield > 0 ? 15 : 0) + (P.st.chan ? 40 : 0))}%</b></span>`;
  return '';
}
// 出手顺序条：接下来 6 次谁出手；头像下面是速度
const TB_SZ = 26;
function tbIcon(u) { if (!u._tbi) u._tbi = u.kind === 'hero' ? heroSpr(u.cls, TB_SZ) : unitIcon(u.spr || 'skeleton', TB_SZ, u.pal, '', 'head'); return u._tbi; }
function drawTurnBar() {
  const el = $('#turnbar'); if (!el || !B) return;
  if (B.over) { el.innerHTML = ''; return; }
  const L = turnOrder(B, 6);
  el.innerHTML = `<span class="tbl">出手</span>` + L.map((u, i) => `<div class="tbu ${u.side === 'e' ? 'e' : u.kind === 'hero' ? 'me' : 'p'} ${i === 0 ? 'now' : ''}" title="${esc(u.name)}">${tbIcon(u)}<b>${Math.round(spdOf(u) * 100)}</b></div>`).join('');
}
// 战斗区高度是定死的：哪边人多了排不下，就把那一边整体缩小，画面不跟着撑大缩小
function fitSides() {
  const ar = $('#arena'); if (!ar || !ar.classList.contains('sv')) return;
  const cs = getComputedStyle(ar), avail = ar.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 10;
  for (const id of ['allies', 'foes']) { const sd = document.getElementById(id); if (!sd) continue;
    const h = sd.offsetHeight, k = h > avail && h > 0 ? Math.max(0.5, Math.floor(avail / h * 100) / 100) : 1;
    sd.style.transform = k < 1 ? `scale(${k})` : ''; }
}
window.addEventListener('resize', () => { if (typeof VIEW !== 'undefined' && VIEW === 'battle') fitSides(); });
function applyStep(o, anim) {
  if (!B) return;
  drawTurnBar();
  { const wb = $('#wardbar'); if (wb && B.ward) { const W = B.ward, k = Math.min(1, W.n / W.need); wb.hidden = false; wb.innerHTML = `<b>${esc(W.name)} · 念诵</b><i><em style="width:${k * 100}%"></em></i><span>${W.n} / ${W.need}</span>`; } }
  const foes = $('#foes'), allies = $('#allies'); if (!foes) return;
  const wasDead = new Set(B.units.filter(u => u._shownDead).map(u => u.id)); let refit = false;
  const danger = B.units.some(u => u.side === 'e' && u.hp > 0 && u.charging);
  for (const u of B.units) {
    let el = document.getElementById('u-' + u.id);
    if (!el) { if (u.dead && u.kind === 'minion') continue; el = unitEl(u); (u.side === 'e' ? foes : allies).appendChild(el); refit = true; }
    if (u.dead && u.kind === 'minion') { el.classList.add('die'); setTimeout(() => { el.remove(); fitSides(); }, 500); continue; }
    if (u.phased && el.dataset.phased !== '1') { el.dataset.phased = '1'; el.querySelector('.sp').innerHTML = VFX.rigHTML(u, SPR.img(u.spr, +el.dataset.size, u.pal), +el.dataset.size, u.spr); el.querySelector('.un').firstChild.textContent = u.name; bump(el, 'phase', 800); }
    if (u.dead && !u._shownDead) { u._shownDead = true; if (!u.escaped && anim) VFX.onDeath(u.id, u.kind);
      if (u.side === 'e' && !u.escaped && anim && el.animate) { const big = u.kind === 'boss'; el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: big ? 2000 : 800, fill: 'forwards' }); }
      else el.classList.add(u.escaped ? 'fled' : u.kind === 'ally' ? 'retreat' : 'die');
      if (u.side === 'e' && B && !B.over) setTimeout(() => { if (B && !B.over) { el.classList.add('gone'); fitSides(); } }, u.kind === 'boss' ? 2100 : 850); }   // 倒下的敌人动画放完就收起来，不占位子
    el.classList.toggle('danger', danger && u.side === 'p' && u.hp > 0 && u.kind !== 'minion');
    el.classList.toggle('charging', !!u.charging && u.hp > 0);
    el.classList.toggle('dead', !!u.dead);
    el.classList.toggle('tgt', u.side === 'e' && B.target === u.id && u.hp > 0);
    el.querySelector('.hpbar i').style.width = Math.max(0, u.hp / u.maxHp * 100) + '%';
    el.querySelector('.hpbar .sh').style.width = u.shield > 0 ? Math.min(100, u.shield / u.maxHp * 100) + '%' : '0';
    el.querySelector('.hpbar span').textContent = u.escaped ? '溜走了' : u.kind === 'ally' && u.dead ? '暂时退下' : `${fmtBig(Math.max(0, Math.round(u.hp)) * uK(u))} / ${fmtBig(u.maxHp * uK(u))}`;
    const st = [];
    if (u.kind === 'ward' && B.ward) { st.push(`<span style="color:#ffe58a">守住他！</span>`); el.querySelector('.sp').style.opacity = (1 - 0.55 * Math.min(1, B.ward.n / B.ward.need)).toFixed(2); }
    if (u.def && u.def.goblin && !u.dead) st.push(`<span style="color:#f1c94a">${GOBLIN_FLEE - (u.flee || 0)} 回合后溜走</span>`);
    if (u.charging && u.hp > 0) st.push('<span style="color:#ff5a3a">蓄力中！</span>');
    if (u.fleeDef && u.flee && u.hp > 0) st.push(`<span style="color:#f1c94a">${Math.max(0, (u.fleeDef.n || 3) - u.flee + 1)} 回合后跑掉</span>`);
    if (u.st.frozen) st.push('<span style="color:#f1d34e">眩晕</span>');
    if (u.st.slow) st.push('<span style="color:#5fb0ff">冰冻</span>');
    if (u.st.melt) st.push('<span style="color:#d8a05a">破甲</span>');
    if (u.st.burn) st.push('<span style="color:#ff7a3a">灼烧</span>');
    if (u.st.poison) st.push('<span style="color:#7fe05a">中毒</span>');
    if (u.st.curse) st.push('<span style="color:#c39cff">摄魂</span>');
    if (u.st.mark) st.push('<span style="color:#ff5a5a">夺命印</span>');
    if (u.st.warcry) st.push('<span style="color:#ffb066">狮子吼</span>');
    if (u.st.shadow) st.push('<span style="color:#b9a0ff">无影</span>');
    if (u.st.renew) st.push('<span style="color:#5df07a">回春</span>');
    if (u.shield > 0) st.push('<span style="color:#ffe58a">护体</span>');
    if (u.enraged || (u.aff && u.aff.includes('enraged') && u.hp / u.maxHp < 0.5)) st.push('<span style="color:#ff5a3a">狂暴</span>');
    if (u.kind === 'hero' && u.stacks) st.push(`<span style="color:#ffd23a">九幽 ×${u.stacks}</span>`);
    el.classList.toggle('frozen', !!u.st.frozen);
    // 状态挂在身上：火、毒、冰壳、金星、护盾、狂暴
    const alive = u.hp > 0 && !u.dead;
    el.classList.toggle('st-burn', alive && !!u.st.burn); el.classList.toggle('st-tox', alive && !!u.st.poison);
    el.classList.toggle('st-ice', alive && !!u.st.slow); el.classList.toggle('st-stun', alive && !!u.st.frozen);
    el.classList.toggle('st-shd', alive && u.shield > 0); el.classList.toggle('st-cur', alive && !!u.st.curse);
    el.classList.toggle('st-rage', alive && !!(u.enraged || (u.aff && u.aff.includes('enraged') && u.hp / u.maxHp < 0.5)));
    if (anim) { if (el._ice && !u.st.slow) VFX.onThaw(u.id); if (el._shd && !(u.shield > 0) && alive) VFX.onShieldBreak(u.id); }
    el._ice = !!u.st.slow; el._shd = u.shield > 0;
    if (u.side === 'e' && u.kind === 'boss' && alive && u.charging && !el._chg && anim) { const ar = $('#arena'); if (ar) { const w = document.createElement('div'); w.className = 'bwarn'; w.textContent = '⚠ 它在蓄力——下一招很重'; ar.appendChild(w); setTimeout(() => w.remove(), 1800); } SFX.play('gong'); }
    el._chg = !!(u.charging && alive);
    el.querySelector('.sts').innerHTML = st.join('');

  }
  if (o) {
    let hurtHero = false, crit = false, dmg = false, healed = false;
    const actorU = B.units.find(u => u.id === o.actor);
    const basicId = actorU && actorU.kind === 'hero' ? (CLASSES[actorU.cls].skills.find(k => !k.cd) || {}).id : null;
    const isBasic = o.cast && basicId && o.cast.id === basicId;
    const SP = SAVE.speed || 1, reactN = new Set((o.react || []).map(R => R.n));
    for (const [id, txt0, c, isSt] of o.pops) {
      const el = document.getElementById('u-' + id); if (!el) continue;
      const tu = B.units.find(u => u.id === id);
      // 少字：状态名已经挂在血条下面、连招名在顶上横幅里，不再在人头上飘一遍；反伤只留数字
      if (isSt || reactN.has(txt0)) continue;
      const txt = c === 'thorn' ? txt0.replace(/^\D+/, '') : txt0, dmgN = /^\d+$/.test(txt);
      if (SP >= 2 && /^-\d+$/.test(txt) && (c === 'burn' || c === 'poison')) { if (anim && c === 'burn') { bump(el, 'flare', 450); VFX.onFlare(id); } continue; }   // 快速时持续伤害不跳字，看血条
      const quiet = SP >= 4 && dmgN && c !== 'crit' && c !== 'thorn' && tu && tu.maxHp && +txt / tu.maxHp < 0.08;   // 4 倍速：小伤害不跳字
      const parts = anim && isBasic && dmgN && +txt >= 6 ? (() => { const a = Math.round(+txt * 0.3), b2 = Math.round(+txt * 0.3); return [a, b2, +txt - a - b2]; })() : [txt];
      const tier = v => { if (!dmgN || !tu || !tu.maxHp) return ''; const r = v / tu.maxHp; return r >= 0.22 ? ' big' : r >= 0.08 ? ' mid' : ''; };
      let pop = null, sum = 0;
      parts.forEach((v, k) => setTimeout(() => {
        const last = k === parts.length - 1, cr = c === 'crit' && last;
        if (quiet) { if (anim && dmgN && !(tu && tu.hp <= 0 && tu.side === 'e')) VFX.onHit(id, cr); return; }
        if (!pop || !pop.isConnected) { pop = document.createElement('span'); pop.style.left = (28 + Math.random() * 44) + '%'; el.appendChild(pop); const pp = pop; setTimeout(() => pp.remove(), 1100 + parts.length * 90); }
        sum += dmgN ? +v : 0;
        pop.className = 'pop ' + c + tier(dmgN ? sum : 0) + (parts.length > 1 && !last ? ' tick' : '') + (parts.length > 1 && k > 0 ? ' re' : '');
        pop.textContent = dmgN ? fmtBig(sum * uK(tu)) + (cr ? '!' : '') : String(v).replace(/\d+/, n => fmtBig(+n * uK(tu)));
        if (parts.length > 1 && k > 0) { pop.style.animation = 'none'; void pop.offsetWidth; pop.style.animation = ''; }
        if (anim && dmgN && !(tu && tu.hp <= 0 && tu.side === 'e')) VFX.onHit(id, cr);
      }, k * 90 * spdF()));
      if (anim && dmgN && actorU && actorU.side === 'p' && tu && tu.side === 'e') bumpCombo(parts.length);
      if (anim && (txt === '闪避' || txt === '格挡') && el.animate) { el.animate([{ transform: 'none' }, { transform: txt === '闪避' ? 'translate(-22px,-6px)' : 'translateX(-6px)' }, { transform: 'none' }], { duration: 260 }); if (txt === '格挡') VFX.onBlock(id); }
      if (anim && /^-\d+$/.test(txt) && c === 'burn') { bump(el, 'flare', 450); VFX.onFlare(id); }
      if (anim && /^-\d+$/.test(txt) && c === 'poison') bump(el, 'drip', 450);
      if (anim && /^\d+$/.test(txt) && el._shd) bump(el, 'crack', 320);
      if (/^\d+$/.test(txt) && anim) { bump(el, 'hurt', 300); dmg = true; if (id === 'P') hurtHero = true; if (c === 'crit') { crit = true; VFX.onCrit(id); const ar = $('#arena'); if (ar) bump(ar, 'hitstop', 90); } }
      if (c === 'heal') { healed = true; if (anim) VFX.onHeal(id); }
    }
    if (anim && o.react) { o.react.forEach(R => VFX.onReact(R.id, R.n, (STATES[R.s] || {}).c || '#e8b0ff')); SFX.play('react'); if (!SAVE.flags.combo1) { SAVE.flags.combo1 = 1; setTimeout(() => toast(`打出连招「${o.react[0].n}」！先用起手技能给敌人挂状态，再用收招技能打，就有额外效果。去「修炼 · 武学」看看搭配`), 600); } }
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
  const hs = $('#hudsk'); if (hs) hs.innerHTML = `<div class="hs-top">${resChip(P)}${B.reacts ? `<span class="rcnt">连招 ×${B.reacts}</span>` : ''}</div><div class="hs-grid">` + [...P.skills.filter(k => k.cd), ...(B.castAuto ? [] : P.skills.filter(k => !k.cd))].map(k => { const st = k.ap || (k.pay && k.pay.s !== 'any' ? k.pay.s : null), c = st ? STATES[st].c : '#e8b0ff';
      const payOn = k.pay && tg && (k.pay.s === 'any' ? stHas(tg, 'any') : stHas(tg, k.pay.s)), tag = !k.cd ? '普' : payOn ? '收' : k.ap ? STATES[k.ap].n[0] : k.pay ? '收' : '';
      return `<button class="skb2 ${k.left > 0 ? 'cd' : 'rdy'} ${payOn && k.left <= 0 ? 'payon' : ''} auto" style="--c:${c}" data-act="castq" data-arg="${k.id}">${tag ? `<em>${tag}</em>` : ''}${k.n}${k.left > 0 ? `<i>${k.left}</i>` : ''}</button>`; }).join('') + '</div>';
  const ub = $('#ultb'); if (ub) { const r = Math.round(P.rage || 0), full = r >= 100;
    $('#ultfill').style.width = r + '%'; ub.classList.toggle('ready', full); ub.classList.toggle('manual', full && !B.ultAuto); ub.classList.toggle('queued', !!B.ultReq);
    $('#ultpct').textContent = B.ultReq ? '下一招释放' : full ? (B.ultAuto ? '怒气已满' : '点我释放！') : `怒气 ${r}%`; ub.disabled = B.over; }
  if (rb) { rb.querySelector('i').style.width = Math.max(0, P.hp / P.maxHp * 100) + '%'; rb.querySelector('span').textContent = `${fmtBig(Math.max(0, Math.round(P.hp)) * uK(P))} / ${fmtBig(P.maxHp * uK(P))}`; }
  const pot = $('#rbpot'); if (pot) pot.textContent = '丹药 ' + SAVE.run.potions;
  { const pb = $('#potb'); if (pb) { pb.textContent = `吃丹药 ×${SAVE.run.potions}`; pb.disabled = B.over || SAVE.run.potions <= 0 || P.hp <= 0 || P.hp >= P.maxHp; } }
  const pr = $('#rbprog'); if (pr) pr.lastChild.textContent = `进度 ${Math.floor(SAVE.run.prog)}%`;
  const xg = $('#rbxiang'); if (xg) { const L = xiangLeft(SAVE.run); xg.textContent = `香 ${xiangTxt(SAVE.run)}`; xg.classList.toggle('low', L > 0 && L < 0.25); xg.classList.toggle('out', L <= 0); }
  const log = $('#blog'); if (log) log.innerHTML = B.logs.slice(-6).reverse().map(l => `<div>${esc(l)}</div>`).join('') || '<div>……</div>';
}
function finishRunView(run, outcome) {
  endRun(run, outcome); LASTRUN = run; VIEW = 'end'; B = null; save(); render(); achToast(run.ach);
}
function battleContinue() {
  const run = SAVE.run;
  if (run && run.world) return worldBattleContinue();
  if (!BRES.win && run.mode === 'rift') {
    const pen = riftRevive(run); B = null; VIEW = 'map'; save(); render();
    banner('你倒下了', `幻境把你吐回了入口 · 香烧掉 ${Math.round(pen / riftLimit(run.riftLv) * 100)}%`, 1800); return;
  }
  if (!BRES.win) return finishRunView(run, 'dead');
  if (B.kind === 'boss') {
    if (run.mode === 'rift') { riftComplete(run); SFX.play('legend'); return finishRunView(run, 'win'); }
    if (run.floor < 3) {
      nextFloor(run); B = null; VIEW = 'map'; save(); render(); SFX.play('door');
      banner(`第${CN[run.floor]}层`, `恢复 50% 气血${hasMod(run, 'scarce') ? '' : '，丹药 +1'}`, 1600); return;
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
const riftHint = run => { const R = wmap(RCH).def.rift; return run.rw.boss ? '守关妖王已经现身——找到它，打倒它' : rCapped(run) ? '这一层的妖气吸够了（每层最多攒四成）：去传送阵，换下一层'
  : `撞上一群妖物，旁边的会一起卷进来。精英倒下会掉精魄，走过去捡。${R.last ? '这是最后一层，进度不封顶。' : '每层最多攒四成进度。'}`; };
// 幻境的地图界面：没有任务栏，换成进度条和香
function riftWorldHTML() {
  const run = SAVE.run, B = run.rbuff;   // 地图顶上只留层名：同伴的名字放这儿会和层名挤在一起
  const hint = riftHint(run);
  return `${runBar(run)}
    <div class="rhud"><div class="rprog ${run.prog >= 100 ? 'full' : ''}" id="rprog"><i style="width:${run.prog}%"></i><em style="left:40%"></em><em style="left:80%"></em><span>${run.rw.boss ? '进度已满 · 守关妖王已现身' : `幻境进度 ${Math.floor(run.prog)}%`}</span></div>${xiangBar(run)}${B ? `<p class="rbuff">${R_PYLONS[B.k].n}生效中：还剩 ${B.n} 场</p>` : ''}<p class="rhint" id="rhint">${hint}</p></div>
    <div class="wmap" id="wmap"><canvas id="wcv"></canvas><div class="wzone" id="wzone">${esc(zoneName())}</div>
      <div class="wfol">${''}</div>
      ${SAVE.joy ? '<div class="joy" id="joy"><i></i></div>' : ''}</div>
    <div class="wctl"><button class="btn ${WAUTO ? '' : 'ghost'} wauto" data-act="wauto">${WAUTO ? '寻妖中…' : '自动寻妖'}</button>
      <button class="btn ghost" data-act="wmini">地图</button>
      <button class="btn ghost" data-act="bag">人物${talentInfo(run.cls).free ? ` <b class="upn">${talentInfo(run.cls).free}</b>` : ''}</button>
      <button class="btn ghost" data-act="rquit">离开</button></div>
`;
}
function worldHTML() {
  if (isRift(SAVE.run)) return riftWorldHTML();
  const run = SAVE.run, ch = run.chapter, tr = wTracker(ch), m = tr[0];
  const sides = tr.slice(1), S = wstate(ch);
  const fol = [S.flags.ngocFollow ? 'Ngoc' : '', S.flags.zhenFollow ? '珍姑娘' : '', S.flags.escort ? SPEAKERS[S.flags.escort].n : ''].filter(Boolean);
  const comp = wCompNow(ch);
  return `${runBar(run)}
    <div class="wtrack ${WTRK ? 'open' : ''}">
      ${m ? `<button class="wt-main" data-act="wgo" data-arg="${m.id}"><span class="wt-tag">主线</span>${trkTD(m)}<em>前往 ▸</em></button>` : '<div class="wt-main"><b>本章主线已完成</b><small>可以继续探索、做支线、刷妖物</small></div>'}
      ${sides.length ? `<button class="wt-more ${sides.some(q => q.key) ? 'k' : ''}" data-act="wtrk">支线${sides.some(q => q.bty) ? '·悬赏' : ''} ${sides.length}${sides.some(q => q.key) ? ' · 有要紧的' : ''} ${WTRK ? '▲' : '▼'}</button>` : ''}
      ${WTRK ? `<div class="wt-list">${sides.map(q => `<button class="wt-side" data-act="wgo" data-arg="${q.id}"><span class="wt-tag s ${q.key ? 'k' : q.bty ? 'b' : ''}">${q.key ? '要紧' : q.bty ? '悬赏' : '支线'}</span>${trkTD(q)}<em>前往 ▸</em></button>`).join('')}</div>` : ''}
    </div>
    <div class="wmap" id="wmap"><canvas id="wcv"></canvas><div class="wzone" id="wzone">${esc(zoneName())}</div>
      <div class="wfol">${fol.length ? `同行：${fol.map(esc).join('、')}` : comp ? `同伴：${esc(COMPANIONS[comp].n)}` : ''}${run.food ? `${fol.length || comp ? ' · ' : ''}饱腹：${esc((FOODS.find(f => f.id === run.food) || {}).n || '')}` : ''}</div>
      ${SAVE.joy ? '<div class="joy" id="joy"><i></i></div>' : ''}</div>
    <div class="wctl">${(() => { const cc = wCompNow(run.chapter); if (!cc) return ''; const mk = wNpcMark(run.chapter, cc); if (!mk) return ''; return `<button class="btn" data-act="wtalkc" title="和${esc((SPEAKERS[cc] || {}).n || cc)}说话">💬${esc(((SPEAKERS[cc] || {}).n || cc).slice(0, 3))}</button>`; })()}${wYinScene(ch) && wHasKey(ch, 'yinyangjing') ? `<button class="btn ${S.flags.yin ? '' : 'ghost'} wyin" data-act="wyin">阴阳镜·${S.flags.yin ? '阴面' : '阳面'}</button>` : ''}<button class="btn ${WAUTO ? '' : 'ghost'} wauto" data-act="wauto">${WAUTO ? '探索中…' : '自动探索'}</button>
      <button class="btn ghost" data-act="wlog">任务</button><button class="btn ghost" data-act="wmini">地图</button>
      <button class="btn ghost" data-act="bag">人物${talentInfo(run.cls).free ? ` <b class="upn">${talentInfo(run.cls).free}</b>` : ''}</button></div>
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
  cancelAnimationFrame(WLOOP);
  const loop = t => { if (VIEW !== 'world' || !$('#wcv') || !SAVE.run || !SAVE.run.world) return; wDraw(cv, dpr, ts, t); WLOOP = requestAnimationFrame(loop); };
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
  if (WHERO.mv) { const k = Math.min(1, (t - WHERO.mv.t0) / WHERO.mv.d); WHERO.x = WHERO.mv.fx + (S.pos.x - WHERO.mv.fx) * k; WHERO.y = WHERO.mv.fy + (S.pos.y - WHERO.mv.fy) * k; WHERO.dist = (WHERO.mv.dist0 || 0) + k; if (k >= 1 && !WALK) WHERO.mv = null; }
  else { WHERO.x = S.pos.x; WHERO.y = S.pos.y; }
  WCAM.x += (WHERO.x - WCAM.x) * 0.2; WCAM.y += (WHERO.y - WCAM.y) * 0.2;
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
      g.font = `bold ${Math.round(ts * 0.24)}px "Noto Serif SC",serif`; g.fillStyle = '#d0c8f0'; g.fillText(P.n || '信徒', px + ts / 2, py + ts * 1.08); continue; }
    if (P.t === 'boxgoal') { const on = wBoxes(ch).some(b => b.x === p.x && b.y === p.y) || S.flags[P.flag]; g.fillStyle = on ? 'rgba(140,230,255,.55)' : `rgba(140,220,255,${0.18 + 0.12 * pulse})`; g.beginPath(); g.ellipse(px + ts / 2, py + ts / 2, ts * 0.42, ts * 0.32, 0, 0, 7); g.fill(); g.strokeStyle = '#bff0ff'; g.lineWidth = 2; g.stroke(); continue; }
    if (P.t === 'boxreset') { spr('crystal', px - ts * 0.05, py - ts * 0.3, ts * 1.1, { C: '#7ad0ff', W: '#e8f8ff' }); continue; }
    if (P.t === 'prop') { const k = P.big || 1.2; spr(P.spr, px + ts / 2 - ts * k / 2, py + ts - ts * k - ts * 0.05, ts * k, P.pal); continue; }   // 场景里的实物（不动）
    if (P.t === 'watch') {
      g.fillStyle = `rgba(255,220,90,${0.13 + 0.08 * pulse})`;
      for (const [cx, cy] of wWatchCells(ch, p, P)) if (wSeen(ch, cx, cy)) g.fillRect(ox + cx * ts, oy + cy * ts, ts, ts);
      const Sp = SPEAKERS[P.npc] || { spr: 'taoist' }; spr(Sp.spr, px - ts * 0.1, py - ts * 0.35, ts * 1.2, Sp.pal);
      g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; g.fillStyle = '#ffd25a'; g.fillText(P.n || '巡夜', px + ts / 2, py + ts * 1.08); continue;
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
    else if (P.t === 'board') { g.fillStyle = '#5a3a20'; g.fillRect(px + ts * 0.2, py + ts * 0.4, 3, ts * 0.6); g.fillRect(px + ts * 0.74, py + ts * 0.4, 3, ts * 0.6); g.fillStyle = '#8a6a3a'; g.fillRect(px + ts * 0.06, py + ts * 0.02, ts * 0.88, ts * 0.5); g.fillStyle = '#e8dcc0'; g.fillRect(px + ts * 0.14, py + ts * 0.08, ts * 0.3, ts * 0.36); g.fillRect(px + ts * 0.52, py + ts * 0.08, ts * 0.32, ts * 0.36); g.fillStyle = '#c4291f'; g.beginPath(); g.arc(px + ts * 0.68, py + ts * 0.32, ts * 0.08, 0, 7); g.fill(); g.font = `bold ${Math.round(ts * 0.22)}px "Noto Serif SC",serif`; g.fillStyle = '#ffd75a'; g.textAlign = 'center'; g.fillText('悬赏', px + ts / 2, py + ts * 1.12); }
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
      g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; g.fillStyle = '#d8c8ff'; g.fillText('下一层', px + ts / 2, py + ts * 1.18); }
    else if (P.t === 'rpylon') { const used = S.got[wgk(S.sc, p.x, p.y)], col = { power: '#ff7a4a', guard: '#7ac8ff', haste: '#9be870', gather: '#d28cff' }[P.py] || '#fff';
      if (!used) { g.fillStyle = col; g.globalAlpha = 0.18 + 0.14 * pulse; g.beginPath(); g.arc(px + ts / 2, py + ts * 0.45, ts * 0.75, 0, 7); g.fill(); g.globalAlpha = 1; }
      g.fillStyle = '#2a2622'; g.fillRect(px + ts * 0.3, py + ts * 0.82, ts * 0.4, ts * 0.14); g.fillStyle = used ? '#4a4640' : '#6a665e'; g.fillRect(px + ts * 0.38, py + ts * 0.05, ts * 0.24, ts * 0.8);
      g.fillStyle = used ? '#55504a' : col; g.beginPath(); g.arc(px + ts / 2, py + ts * 0.05, ts * (used ? 0.13 : 0.17 + 0.03 * pulse), 0, 7); g.fill();
      g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; g.fillStyle = used ? '#8a8478' : col; g.fillText(R_PYLONS[P.py].n + (used ? '（用过了）' : ''), px + ts / 2, py + ts * 1.18); }
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
    P0.x += (mn.x - P0.x) * 0.18; P0.y += (mn.y - P0.y) * 0.18;
    const C0 = CHAPTERS[(mn.c || ch) - 1] || CHAPTERS[0], def = mn.boss ? C0.boss : (C0.mons[mn.m] || {}), px = ox + P0.x * ts, py = oy + P0.y * ts;
    const size = mn.boss ? ts * 1.7 : mn.big ? ts * 1.35 : mn.rare ? ts * 1.3 : mn.elite ? ts * 1.15 : ts * 0.95, bob = mn.beh === 'sleep' ? 0 : Math.sin(t / 220 + mn.x) * 2;
    if (mn.elite || mn.boss) { g.fillStyle = mn.boss ? `rgba(255,50,40,${0.3 + 0.15 * pulse})` : mn.rare ? 'rgba(190,120,255,.35)' : 'rgba(255,120,40,.25)'; g.beginPath(); g.ellipse(px + ts / 2, py + ts * 0.85, ts * (mn.boss ? 0.8 : 0.5), ts * (mn.boss ? 0.28 : 0.18), 0, 0, 7); g.fill(); }
    g.globalAlpha = wInSight(ch, mn.x, mn.y) ? 1 : 0.55;
    spr(def.spr || 'skeleton', px + (ts - size) / 2, py + ts - size - 2 + bob, size, mn.pal || def.pal);
    g.globalAlpha = 1;
    if (mn.beh === 'sleep') { g.fillStyle = '#9ab'; g.font = `bold ${Math.round(ts * 0.3)}px sans-serif`; g.fillText('z', px + ts * 0.85, py + ts * 0.1 - (t / 400 % 1) * 6); g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; }
    if (mn.beh === 'chase' && d2 <= 25 && wInSight(ch, mn.x, mn.y)) { g.fillStyle = '#ff5a3a'; g.font = `900 ${Math.round(ts * 0.4)}px sans-serif`; g.fillText('!', px + ts / 2, py - ts * 0.1); g.font = `bold ${Math.round(ts * 0.26)}px "Noto Serif SC",serif`; }
    if (mn.z === 'r' && mn.elite) { g.fillStyle = mn.rare ? '#d8a8ff' : '#ffb066'; g.fillText(mn.rare ? '稀有精英' : '精英', px + ts / 2, py + ts * 1.15); }
    if (mn.boss) { g.fillStyle = '#ff6a5a'; g.fillText('守关妖王 · ' + def.n, px + ts / 2, py + ts * 1.2); }
    if (mn.name && (mn.elite || mn.tag)) { const dl = mn.lv - SAVE.chars[SAVE.run.cls].level;
      g.fillStyle = dl >= 3 ? '#ff4a3a' : dl >= 1 ? '#ffb066' : '#d8d0b0'; g.fillText(`${mn.name}${mn.elite ? ` ${mn.lv}级` : ''}`, px + ts / 2, py + ts * 1.15); }
  }
  // 路径预览
  if (WALK && WALK.path) { g.fillStyle = 'rgba(255,215,140,.45)'; for (const p of WALK.path.slice(WALK.i)) { g.beginPath(); g.arc(ox + (p.x + 0.5) * ts, oy + (p.y + 0.5) * ts, 3, 0, 7); g.fill(); } }
  if (WTAP && t - WTAP.t < 400) { g.strokeStyle = `rgba(255,215,140,${1 - (t - WTAP.t) / 400})`; g.lineWidth = 2; g.beginPath(); g.arc(ox + (WTAP.x + 0.5) * ts, oy + (WTAP.y + 0.5) * ts, ts * 0.45, 0, 7); g.stroke(); } else if (WTAP && !WTAP.t) WTAP.t = t;
  // 跟在身后的人
  const fol = [S.flags.ngocFollow ? ['ngoc'] : null, S.flags.zhenFollow ? ['constable'] : null, S.flags.escort ? [(SPEAKERS[S.flags.escort] || {}).spr || 'villager', (SPEAKERS[S.flags.escort] || {}).pal] : null].filter(Boolean);
  fol.forEach((f, i) => { const tp = WTRAIL[i + 1] || WTRAIL[WTRAIL.length - 1] || { x: S.pos.x - 0.6 * (i + 1), y: S.pos.y + 0.1 };
    f.p = f.p || { x: tp.x, y: tp.y }; const k2 = 'f' + i; const Pq = WMONP[k2] || (WMONP[k2] = { x: tp.x, y: tp.y, d: 0 });
    const dx = (tp.x - Pq.x) * 0.16, dy = (tp.y - Pq.y) * 0.16, mv = Math.hypot(dx, dy); Pq.x += dx; Pq.y += dy; Pq.d = (Pq.d || 0) + mv;
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
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(ox + (WHERO.x + 0.5) * ts, oy + (WHERO.y + 0.9) * ts, ts * 0.32, ts * 0.12, 0, 0, 7); g.fill();
  const HS = m.def.heroSpr, hsN = HS ? HS[0] : CLASSES[SAVE.run.cls].spr, hsP = HS ? HS[1] : CLASSES[SAVE.run.cls].pal;   // 梦里是十五岁的阿土
  const rigC = !HS && typeof HERO !== 'undefined' && HERO.has(SAVE.run.cls) ? SAVE.run.cls : null, wi = Math.floor((WHERO.dist || 0) * 2.5) % 4;
  const hc = rigC ? HERO.cv(rigC, WHERO.back && walking ? 'b' + wi : WHERO.back ? 'b0' : walking ? 'w' + wi : Math.floor(t / 560) % 2 ? 'idle2' : 'idle') : WHERO.back ? SPR.backCv(hsN, hsP, wf) : SPR.walkCv(hsN, hsP, wf);
  // 走路扬尘
  if (walking && wf !== WHERO.lastWf) { WHERO.lastWf = wf; if (wf) (WHERO.dust || (WHERO.dust = [])).push({ x: WHERO.x + 0.5 + (Math.random() - 0.5) * 0.2, y: WHERO.y + 0.88, t }); }
  if (WHERO.dust) { WHERO.dust = WHERO.dust.filter(d => t - d.t < 520); for (const d of WHERO.dust) { const k = (t - d.t) / 520; g.fillStyle = `rgba(190,170,140,${(0.45 * (1 - k)).toFixed(3)})`; const r = ts * (0.06 + k * 0.14); g.beginPath(); g.ellipse(ox + d.x * ts, oy + d.y * ts - k * ts * 0.12, r * 1.4, r, 0, 0, 7); g.fill(); } }
  if (hc) { g.save(); const hx = ox + (WHERO.x + 0.5) * ts, hy = oy + (WHERO.y + 0.8) * ts - hb;
    g.translate(hx, rigC ? hy + hb : hy); g.rotate(lean); if (WHERO.flip) g.scale(-1, 1);
    if (rigC) { const u = ts * 1.12 / 30; g.drawImage(hc, -28 * u, -44 * u, HERO.W * u, HERO.H * u); } else g.drawImage(hc, -ts * 0.55, -ts * 1.1, ts * 1.1, ts * 1.1 * hc.height / hc.width);
    g.restore(); }
  // 天气
  wCrowd(g, ch, m, S, ox, oy, ts, t, spr);
  wWeather(g, T.wx, Wp, Hp, t);
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
    if (wx === 'fog') { P.x += 0.15 + P.s * 0.2; if (P.x > W + 150) P.x = -150; const r = 90 + P.s * 90; const gr = g.createRadialGradient(P.x, P.y, 0, P.x, P.y, r); gr.addColorStop(0, 'rgba(180,170,160,.08)'); gr.addColorStop(1, 'rgba(180,170,160,0)'); g.fillStyle = gr; g.fillRect(P.x - r, P.y - r, r * 2, r * 2); }
    else if (wx === 'wisp') { P.y -= 0.15 + P.s * 0.2; P.x += Math.sin(t / 900 + P.p) * 0.3; if (P.y < -10) { P.y = H + 10; P.x = Math.random() * W; } const a = 0.35 + 0.3 * Math.sin(t / 400 + P.p); g.fillStyle = `rgba(110,240,180,${a * 0.25})`; g.beginPath(); g.arc(P.x, P.y, 6 + P.s * 4, 0, 7); g.fill(); g.fillStyle = `rgba(190,255,220,${a})`; g.beginPath(); g.arc(P.x, P.y, 1.6 + P.s, 0, 7); g.fill(); }
    else if (wx === 'ember') { P.y -= 0.4 + P.s * 0.6; P.x += Math.sin(t / 500 + P.p) * 0.4; if (P.y < -5) { P.y = H + 5; P.x = Math.random() * W; } g.fillStyle = `rgba(255,${120 + P.s * 80 | 0},40,${0.4 + 0.4 * P.s})`; g.fillRect(P.x, P.y, 2, 2); }
    else if (wx === 'dust') { P.y += Math.sin(t / 1300 + P.p) * 0.08; P.x += 0.06 + P.s * 0.05; if (P.x > W + 5) P.x = -5; g.fillStyle = `rgba(255,230,180,${0.12 + 0.15 * P.s})`; g.fillRect(P.x, P.y, 1.5, 1.5); }
    else if (wx === 'snow') { P.y += 0.5 + P.s * 0.8; P.x += Math.sin(t / 800 + P.p) * 0.5 - 0.2; if (P.y > H + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = `rgba(240,248,255,${0.5 + 0.4 * P.s})`; g.fillRect(P.x, P.y, 2 + P.s, 2 + P.s); }
    else if (wx === 'ash') { P.y += 0.25 + P.s * 0.3; P.x += Math.sin(t / 900 + P.p) * 0.4; if (P.y > H + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = `rgba(90,80,80,${0.4 + 0.3 * P.s})`; g.fillRect(P.x, P.y, 2, 2); }
    else if (wx === 'spore') { P.y -= 0.12 + P.s * 0.15; P.x += Math.sin(t / 700 + P.p) * 0.35; if (P.y < -5) { P.y = H + 5; P.x = Math.random() * W; } g.fillStyle = `rgba(170,230,90,${0.25 + 0.3 * Math.sin(t / 300 + P.p) ** 2})`; g.beginPath(); g.arc(P.x, P.y, 1.5 + P.s * 1.5, 0, 7); g.fill(); }
    else if (wx === 'petal') { P.y += 0.35 + P.s * 0.3; P.x += 0.3 + Math.sin(t / 600 + P.p) * 0.6; if (P.y > H + 5 || P.x > W + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = P.s > 0.5 ? 'rgba(255,190,210,.7)' : 'rgba(255,240,245,.6)'; g.fillRect(P.x, P.y, 3, 2); }
    else if (wx === 'drip') { P.y += 2 + P.s * 2; if (P.y > H) { P.y = -20; P.x = Math.random() * W; } g.fillStyle = 'rgba(140,200,220,.35)'; g.fillRect(P.x, P.y, 1, 6); }
    else if (wx === 'leaf') { P.y += 0.3 + P.s * 0.3; P.x += 0.4 + Math.sin(t / 700 + P.p) * 0.5; if (P.y > H + 5 || P.x > W + 5) { P.y = -5; P.x = Math.random() * W; } g.fillStyle = P.s > 0.5 ? 'rgba(200,120,50,.6)' : 'rgba(140,170,70,.5)'; g.fillRect(P.x, P.y, 3, 2); }
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
  WTAP = { x, y, t: 0 }; wStopAuto(); WGOAL = null;
  const S = wstate(ch);
  if (x === S.pos.x && y === S.pos.y) { const P = wPt(ch, x, y); if (P && P.t === 'camp') openModal(campModal(P)); return; }
  if (wBoxAt(ch, x, y)) { const dx = x - S.pos.x, dy = y - S.pos.y; if (Math.abs(dx) + Math.abs(dy) === 1) return wDirStep(dx, dy); return qtoast('走到冰块旁边，往要推的方向点它'); }
  if (wIceTap(x, y)) return;
  const act = wInteract(ch, x, y);
  if (act) return wWalkTo(x, y, act);
  const P = wPt(ch, x, y);
  wWalkTo(x, y, P && P.t === 'camp' && wPtVisible(ch, x, y) ? () => openModal(campModal(P)) : null, true);
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
    qtoast('那边滑不过去'); return true;
  }
  // 在岸上、点的是冰：点的那格和人在同一行（列），而且人就贴着冰——直接滑
  if ((!ddx || !ddy) && ice(S.pos.x + sx, S.pos.y + sy)) { if (!slide(sx, sy)) qtoast('那边滑不过去'); return true; }
  // 否则先走到入口：从点的那格往四个方向退到冰面外头的第一格，挑走得到、最近的一个
  let best = null;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let ex = x - dx, ey = y - dy; while (ice(ex, ey)) { ex -= dx; ey -= dy; }
    if (!wSeen(ch, ex, ey) || !wPassHero(ch, ex, ey) || wBoxAt(ch, ex, ey) || wPuzzle(ch, ex, ey)) continue;
    const here = ex === S.pos.x && ey === S.pos.y, path = here ? [] : wPath(ch, ex, ey); if (!path) continue;
    if (!best || path.length < best.path.length) best = { ex, ey, dx, dy, path };
  }
  if (!best) { for (const [dx, dy] of dirs) if (ice(S.pos.x + dx, S.pos.y + dy) && slide(dx, dy)) return true;   // 站在冰面中间的石台上，别的入口都走不到：就按点的方向滑
    qtoast('从这边到不了那块冰面'); return true; }
  if (!best.path.length) { if (!slide(best.dx, best.dy)) qtoast('那边滑不过去'); return true; }
  WALK = { path: best.path, i: 0, onArrive: () => { if (ICEHINT++ < 2) qtoast('到冰边了：再点一下冰面，就往那边滑'); } };
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
  if (!p && WALK.joy && JOY && !DLG) { const T = wDirTarget(JOY[0], JOY[1]); if (T && !T.act) { const P2 = wPt(ch, T.x, T.y); WALK.path.push({ x: T.x, y: T.y }); p = WALK.path[WALK.i++]; WALK.onArrive = P2 && P2.t === 'camp' ? () => openModal(campModal(P2)) : null; } }
  if (!p) { const f = WALK.onArrive; WALK = null; if (f) f(); else if (WAUTO) setTimeout(wAutoStep, 120); updWorldHud(); return; }
  const S = wstate(ch);
  if (WHERO) { WHERO.flip = p.x < S.pos.x ? true : p.x > S.pos.x ? false : WHERO.flip; WHERO.back = p.y < S.pos.y ? true : p.y > S.pos.y ? false : (p.x !== S.pos.x ? false : WHERO.back); }
  const from = { x: S.pos.x, y: S.pos.y }, sc0 = S.sc;
  const diag = p.x !== S.pos.x && p.y !== S.pos.y, dur = W_STEP * (diag ? 1.35 : 1);
  if (WHERO) WHERO.mv = { fx: WHERO.x, fy: WHERO.y, t0: performance.now(), d: dur, dist0: Math.round(WHERO.dist || 0) };
  const r = wStep(ch, p.x, p.y, SAVE.run);
  if (S.sc === sc0 && !r.blocked) { WTRAIL.unshift(from); WTRAIL.length = Math.min(WTRAIL.length, 4); }
  if (WALK) { const T2 = SCENE_THEMES[(wmap(ch).def || {}).theme] || {}, th = (wmap(ch).def || {}).theme; SFX.play(th === 'snow' || th === 'icecave' ? 'crunch' : th === 'swamp' ? 'squelch' : T2.kind === 'room' || T2.kind === 'hall' ? 'wood' : WALK.i % 2 ? 'step' : 'step2'); }
  updWorldHud();
  if (r.blocked) { WALK = null; for (const a of r.acts || []) { if (a.toast) qtoast(a.toast); if (a.sfx) SFX.play(a.sfx); }   // 被挡住要说一声为什么；自动探索时被挡住：换条路再试，连着三次都不通才停（原来会卡在「探索中…」不动）
    if (WAUTO) { if (++AUTOBLK >= 3) { AUTOBLK = 0; wStopAuto(); qtoast('这边走不通，自动探索先停下'); } else { clearTimeout(AUTOT); AUTOT = setTimeout(wAutoStep, 250); } }
    return; }
  AUTOBLK = 0;
  if (r.cont) { for (const a of r.acts) { if (a.toast) qtoast(a.toast); if (a.sfx) SFX.play(a.sfx); } }
  else if (r.acts.length) { WALK = null; save(); return wRun(r.acts); }
  // 自动探索时：有醒着的妖物靠近、或者找到了要找的东西，就停下
  if (WAUTO) {
    if (wScene(ch).mons.some(mn => mn.beh !== 'sleep' && wInSight(ch, mn.x, mn.y) && wdist(mn, S.pos) <= 3)) { WALK = null; wStopAuto(); qtoast('前面有妖物，自动探索先停下'); return; }
    const found = wTracker(ch).find(q => q.find && (() => { const t = wMarkPos(ch, q); return t && !t.area && t.sc === S.sc && wInSight(ch, t.x, t.y); })());
    if (found) { WALK = null; wStopAuto(); WGOAL = null; qtoast(`那边好像有东西——「${found.t}」`); SFX.play('rare'); return; }
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
    const boss = D.mons.find(o => o.boss), cands = boss ? [boss] : (D.orbs && D.orbs.length && !rCapped(run)) ? near(D.orbs) : (D.mons.length && !rCapped(run)) ? near(D.mons).slice(0, 6) : (m.pts['2'] || []);
    let path = null; for (const c of cands) { path = wPath(ch, c.x, c.y); if (path && path.length) break; }
    if (!path || !path.length) { wStopAuto(); return qtoast('附近找不到妖物了，自己走走看'); }
    WALK = { path: path.slice(0, 12), i: 0 }; return wStepLoop();
  }
  if (run.hp < runStats(run).maxHp * 0.35 && run.potions === 0) { wStopAuto(); return qtoast('气血太低了，先回篝火歇一歇'); }
  const path = wExploreTarget(ch, WAUTOZ);
  if (!path || !path.length) { const z = WAUTOZ; wStopAuto();
    // 路都走过了，但地上还有发光的线索没捡：提醒去点一下（原来只会说「找遍了」，其实东西就在眼前）
    let loose = 0; { const m = wmap(ch); for (const c in m.pts) { const P = m.def.pts[c]; if (!P || !['qitem', 'clue', 'relic'].includes(P.t)) continue; for (const p of m.pts[c]) if (wSeen(ch, p.x, p.y) && wPtVisible(ch, p.x, p.y)) loose++; } }
    return qtoast(loose ? '路都走过了——地上发光的地方还没看，点一下试试' : z ? '这一带都找遍了，换个地方看看' : '附近都探索过了'); }
  WALK = { path: path.slice(0, 10), i: 0 }; wStepLoop();
}
function wStopAuto() { WAUTOZ = null; if (!WAUTO) return; WAUTO = false; const b = document.querySelector('.wauto'); if (b) { b.classList.add('ghost'); b.textContent = isRift(SAVE.run) ? '自动寻妖' : '自动探索'; } }
function wStartAuto(zone) { if (wWatchBlock(wch())) return qtoast('这里有人巡逻，自动探索不管用——自己摸过去'); WAUTO = true; WAUTOZ = zone || null; const b = document.querySelector('.wauto'); if (b) { b.classList.remove('ghost'); b.textContent = isRift(SAVE.run) ? '寻妖中…' : '探索中…'; } wAutoStep(); }
// 等级和经验条：手机上副标题是收起来的，等级要单独露出来
let XPLV = null;
function xpInfo(cls) {
  const ch = SAVE.chars[cls], top = ch.level >= MAX_LV;
  const cur = top ? SAVE.para.xp : ch.xp, need = top ? paraNeed(SAVE.para.lv) : xpNeed(ch.level);
  return { lv: top ? SAVE.para.lv : ch.level, top, k: Math.max(0, Math.min(1, cur / need)), cur, need };
}
function xpRow(cls) {
  const X = xpInfo(cls), key = cls + (X.top ? 'p' : '') + X.lv, up = XPLV && XPLV.cls === cls && XPLV.key !== key && X.lv > XPLV.lv; XPLV = { cls, key, lv: X.lv };
  return `<div class="xprow${up ? ' lvup' : ''}" id="rbxp"><b>${X.top ? `修为 ${X.lv}` : `Lv ${X.lv}`}</b><div class="xpbar"><i style="width:${(X.k * 100).toFixed(1)}%"></i></div><small>${Math.floor(X.k * 100)}%</small></div>`;
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
  if (isRift(run)) { const rp = $('#rprog'), pb = $('#rbprog'); if (rp) { rp.querySelector('i').style.width = run.prog + '%'; rp.classList.toggle('full', run.prog >= 100); rp.querySelector('span').textContent = run.rw.boss ? '进度已满 · 守关妖王已现身' : `幻境进度 ${Math.floor(run.prog)}%`; }
    if (pb) pb.lastChild.textContent = `进度 ${Math.floor(run.prog)}%`; const rh = $('#rhint'); if (rh) rh.textContent = riftHint(run); const pt = $('#rbpot'); if (pt) pt.textContent = `丹药 ${run.potions}`; }
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
  if (a.aff) { const [k, d] = a.aff; qtoast(`<span class="afft">${esc(AFF_WHO[k])} 好感 ${d > 0 ? '+' + d + ' ♥' : d}</span>`); SFX.play(d > 0 ? 'buff' : 'fail'); next(); return true; }
  if (a.banner) { banner(a.banner[0], a.banner[1], 1700); if (a.banner[0] === '篝火夜话') SFX.mood({ key: 'sad' }); setTimeout(next, 1000); return true; }
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
  if (a.rboss) { wStopAuto(); WALK = null; render(); banner('守关妖王现身', `${a.rboss} · ${a.d || ''}`, 2200); SFX.play('gong'); return setTimeout(next, 600); }
  if (a.rdone) { const run = SAVE.run; riftComplete(run); SFX.play('legend'); return finishRunView(run, 'win'); }
  if (a.chest) { const run = SAVE.run; run.encCell = { lv: wmap(wch()).zoneAt(wstate(wch()).pos.x, wstate(wch()).pos.y).lv };
    CHEST = openChest(run, a.q); VIEW = 'chest'; SFX.play('loot'); WKEY = { rest: acts.slice(i + 1) }; return render(); }
  if (a.event) { const run = SAVE.run; run.encCell = { lv: wmap(wch()).zoneAt(wstate(wch()).pos.x, wstate(wch()).pos.y).lv, ev: RNG.pick(EVENTS).id };
    EVRES = null; VIEW = 'event'; WKEY = { rest: acts.slice(i + 1) }; return render(); }
  if (a.final) return wFinishChapter();
  if (a.dossier) { DOSS = { go: () => { closeModal(); next(); }, back: () => { closeModal(); WGOAL = null; render(); } }; wStopAuto(); return openModal(dossierModal(a.dossier)); }
  next();
}
// 首领卷宗
let DOSS = null;
const dossierModal = id => () => {
  const D = DOSSIER[id], have = D.items.filter(it => it.key && wkeys()[it.key]).length, tot = D.items.filter(it => it.key).length;
  const C = CHAPTERS[wch() - 1].boss;
  return `<div class="doss"><div class="doss-h">${SPR.img(C.spr, 72, C.pal)}<div><small>首领卷宗</small><h2 class="mh">${esc(D.n)}</h2><p class="sub">${esc(D.d)}</p></div></div>
    <ul class="dossl">${D.items.map(it => { const ok = it.key ? !!wkeys()[it.key] : null;
      return `<li class="${ok === true ? 'ok' : ok === false ? 'no' : 'sk'}"><b>${esc(it.n)}</b><span>${esc(it.d)}</span><small>${ok === true ? `✓ 已克制：${esc(W_KEYS[it.key].n)}` : ok === false ? `✗ 克制它：${esc(it.how)}` : `技巧：${esc(it.how)}`}</small></li>`; }).join('')}</ul>
    <p class="help-p">已经带了 ${have}/${tot} 件克制的东西。${have < tot ? '没带齐也能打，只是会难很多——可以先回去找，或者多练几级再来。' : '准备得很充分。'}</p>
    <div class="row"><button class="btn" data-act="dgo">开打</button><button class="btn ghost" data-act="dback">先回去准备</button></div></div>`;
};
// 连输之后的提示：哪招要用什么克、那样东西从哪条支线来
const bossHelpModal = id => () => {
  const D = DOSSIER[id], ch = wch(), S = wstate(ch), tr = wTracker(ch);
  const miss = D.items.filter(it => it.key && !wkeys()[it.key]);
  return `<div class="doss"><div class="doss-h"><div><small>已经输给它 ${S.pz.bl || 2} 次</small><h2 class="mh">${esc(D.n)}</h2><p class="sub">它有 ${miss.length} 招得用东西克。光靠多练几级很难硬扛——先把克它的东西拿到手。</p></div></div>
    <ul class="dossl">${miss.map(it => { const q = WQ[ch].side.find(q => wSideKey(q) === it.key), on = q && tr.some(t => t.id === q.id);
      return `<li class="no"><b>${esc(it.n)}</b><span>${esc(it.d)}</span><small>克制它：${esc(it.how)}</small>${on ? `<button class="btn sm bh-go" data-act="bhgo" data-arg="${q.id}">${S.side[q.id] ? '去做这条支线' : '去接这条支线'} ▸</button>` : ''}</li>`; }).join('')}</ul>
    <div class="row"><button class="btn ghost" data-act="close">知道了</button></div></div>`;
};
// 一键前往跨场景时：进门之后接着走
function wResume() {
  if (WGOAL && !DLG && !MODALFN && VIEW === 'world') { const id = WGOAL.id; if (++WGOAL.hops > 10) { WGOAL = null; return; } setTimeout(() => { if (WGOAL && WGOAL.id === id && !WALK && !DLG && !MODALFN) ACT.wgo(id, null, true); }, 350); }
  else if (WAUTO) setTimeout(wAutoStep, 400);
}
function beginWorldBattle(enc) {
  const run = SAVE.run; if (isRift(run)) run.sth = wmap(RCH).def.theme;
  const kind = wPrepBattle(run, enc);
  beginBattle(kind);
  if (enc.rift && enc.n > 1) B.logs.push(`一口气卷进来 ${enc.n} 群妖物${B.reinf && B.reinf.length ? `，后面还排着 ${B.reinf.length} 只` : ''}`);
  if (enc.first === 'p') { B.P.g = 100; B.units.forEach(u => { if (u.side === 'e') u.g = Math.min(u.g, 10); }); B.logs.push('你抢先出手！'); }
  else if (enc.first === 'e' && enc.kind !== 'boss') { B.units.forEach(u => { if (u.side === 'e') u.g = 85; }); B.logs.push('被妖物从背后偷袭了！'); }
  if (enc.kind === 'boss') { const BC = (CHAPTERS[(enc.rift ? enc.c : run.chapter) - 1] || CHAPTERS[0]).boss; banner(enc.rift ? '幻境守关 · ' + BC.n : BC.n, BC.d, 1800); }
  applyStep(null);
}
function riftBattleContinue() {
  const run = SAVE.run, k = WKEY || {}; WKEY = null;
  if (!BRES.win) {
    const pen = riftRevive(run); B = null; VIEW = 'world'; WALK = null; WGOAL = null; wStopAuto(); WHERO = null; save(); render();
    banner('你倒下了', `幻境把你吐回了这一层的入口 · 香烧掉 ${fmtClock(pen)}`, 1800); return;
  }
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
    const r = wDefeat(ch, run); B = null; VIEW = 'world'; WALK = null; WGOAL = null; wStopAuto(); WHERO = null; save(); render();
    // 同一个首领输到第二次（以后每隔一次）：直接说清它哪招要用什么克，并给一个「前往」
    const help = bid && S0.pz.bl >= 2 && S0.pz.bl % 2 === 0 && DOSSIER[bid] && DOSSIER[bid].items.some(it => it.key && !wkeys()[it.key]);
    playDialog([['narr', `你倒下了……迷迷糊糊中，有人把你拖回了篝火边。${r.lost ? `钱袋轻了 ${r.lost} 两。` : ''}`], ...(r.msg ? [['narr', r.msg]] : [])], null, help ? () => openModal(bossHelpModal(bid)) : undefined);
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
  lava: { n: '岩浆', len: 7.8, at: [1.2, 2.7], cap: ['岩浆一明一暗，隔一会儿换一次', '亮着的时候踩上去会烫伤——先在边上等', '暗下去了，一口气走过去'],
    step: T => { const hot = Math.floor(T / 2.6) % 2 === 0, R = ['##########', '....LL....', '....LL....', '....LL....', '##########'].map(r => hot ? r : r.replace(/L/g, 'l'));
      return { rows: R, hero: DKF([[0, 0.5, 2], [1.2, 3, 2], [2.8, 3, 2], [4.5, 7, 2], [5.1, 8.5, 2], [7.8, 8.5, 2]], T), wait: T > 1.2 && T < 2.8 }; } },
  web: { n: '蛛网', len: 9, at: [2, 5.6], cap: ['蛛网把路封死了，硬闯过不去', '身上带着火把，走进去，火一燎就开', '还没有火把？先跟着任务把它拿到手'],
    step: T => { const R = ['##########', '.....W....', '.....W....', '.....W....', '##########']; if (T > 4.2) DPUT(R, 5, 2, T < 4.9 ? 'F' : '.');
      return { rows: R, hero: DKF([[0, 0.5, 2], [2, 4, 2], [4.2, 4, 2], [5.4, 5, 2], [7, 8.5, 2], [9, 8.5, 2]], T), torch: true }; } },
  bridge: { n: '网桥', len: 10, at: [1.5, 6.5], cap: ['网桥：踩过的那一格会塌', '别回头、别兜圈——认准一条线走到头', '塌掉的网，过一会儿会重新结好'],
    step: T => { const R = ['##########', '...GGGG...', '...BBBB...', '...GGGG...', '##########'], h = DKF([[0, 0.5, 2], [1.5, 2, 2], [5.5, 7, 2], [6.5, 8.5, 2], [10, 8.5, 2]], T);
      for (let x = 3; x <= 6; x++) { const tx = 1.5 + (x - 2) * 0.8 + 0.5; if (T > tx && T < tx + 3.4) DPUT(R, x, 2, 'G'); }
      return { rows: R, hero: h }; } },
  swamp: { n: '毒沼', len: 9, at: [1.2, 6.8], cap: ['毒水会一步一步掉气血', '能绕就绕着走', '拿到克它的东西以后，就可以直接蹚过去'],
    step: T => ({ rows: ['..........', '...SSSS...', '...SSSS...', '...SSSS...', '..........'], hero: DKF([[0, 0.5, 2], [1.2, 2, 2], [2.4, 2, 4], [5.6, 7, 4], [6.8, 7, 2], [7.6, 8.5, 2], [9, 8.5, 2]], T) }) },
  plate: { n: '踏板和栅栏', len: 10, at: [3, 8], cap: ['栅栏挡路的时候，附近一定有踏板', '踩上去：红栅栏沉下去，青栅栏升起来', '再踩一次就换回来——想好先后再踩'],
    step: T => { const on = T > 3, R = ['######R###', '......R...', '..P...R...', '......R...', '######R###'].map(r => on ? r.replace(/R/g, 'r') : r); DPUT(R, 8, 4, on ? 'C' : 'c');
      return { rows: R, hero: DKF([[0, 0.5, 1], [1.4, 2, 1], [3, 2, 2], [4.2, 2, 2], [5.2, 3, 2], [8, 8.5, 2], [10, 8.5, 2]], T) }; } },
  watch: { n: '巡逻的视线', len: 10.5, at: [1.6, 5], cap: ['黄色的格子，是他看得见的地方', '他会转头——等视线挪开', '趁空当走过去；被看见会被赶回去，或者招来一场架'],
    step: T => { const down = T < 4.6 || T > 9.4, R = ['..........', '.....E....', '..........', '..........', '..........'];
      const cone = down ? [[5, 2], [5, 3], [5, 4], [4, 3], [6, 3], [4, 4], [6, 4]] : [[6, 1], [7, 1], [8, 1], [7, 0], [8, 0], [7, 2], [8, 2]];
      return { rows: R, cone, face: down ? 's' : 'e', hero: DKF([[0, 0.5, 3], [1.6, 3, 3], [5, 3, 3], [8, 8.5, 3], [10.5, 8.5, 3]], T), wait: T > 1.6 && T < 5 }; } },
  ice: { n: '冰面', len: 9, at: [2.4, 4.8], cap: ['冰面：一踩上去就一滑到底', '撞到石头或者墙，才停得下来', '先看好要停在哪儿，再决定从哪边踩上去'],
    step: T => ({ rows: ['##########', '..IIIIII..', '..IIIIK...', '..IIIIII..', '##########'], hero: DKF([[0, 0.5, 2], [1.6, 1, 2], [2.4, 1, 2], [3.6, 5, 2], [4.8, 5, 2], [5.6, 5, 3], [6.4, 7, 3], [7.2, 8.5, 3], [9, 8.5, 3]], T) }) },
  box: { n: '冰块和冰眼', len: 10, at: [3, 6.8], cap: ['冰块：站到它旁边，朝要推的方向点它', '把它推上发光的冰眼，冰门就开了', '推歪了也不怕——点旁边的水晶，冰块回到原位'],
    step: T => { const bx = T < 3 ? 3 : Math.min(6, 3 + (T - 3) * 2.2), R = ['##########', '..........', '......O..D', '..........', '##########']; if (bx >= 6) DPUT(R, 9, 2, 'd');
      return { rows: R, box: [bx, 2], hero: DKF([[0, 0.5, 2], [2, 2, 2], [6, 2, 2], [6.8, 2, 3], [9, 8.5, 3], [10, 8.5, 3]], T) }; } },
  xintu: { n: '被迷住的信徒', len: 9, at: [2.6, 4.4], cap: ['被迷住的信徒会堵在路口', '走到跟前，点他一下', '手里有醒魂香就能叫醒；没有，就先打晕再过去'],
    step: T => { const R = ['#####.####', '#####.####', '.....V....', '#####.####', '#####.####']; if (T > 4.4) DPUT(R, 5, 2, 'v');
      return { rows: R, tap: T > 3.2 && T < 4.4 ? [5, 2] : null, hero: DKF([[0, 0.5, 2], [2.6, 4, 2], [5.2, 4, 2], [7.6, 8.5, 2], [9, 8.5, 2]], T) }; } },
  yy: { n: '阴阳两面', len: 10, at: [2, 5], cap: ['有些路在阳面是断的', '点「阴阳镜」照到阴面，断的路就接上了', '过去以后，还可以再照回阳面'],
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
  return `<div class="demo"><small>新机关</small><h2 class="mh">${esc(D.n)}</h2><canvas id="democv" width="300" height="150"></canvas><p id="democap" class="demo-cap">${esc(D.cap[0])}</p>
    <div class="row" style="justify-content:center"><button class="btn" data-act="close">知道了</button></div></div>`;
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
  if (VIEW !== 'world' || DLG || MODALFN || WKEY || !SAVE.run || !SAVE.run.world) return; const qz = document.querySelector('#quiz'); if (qz && !qz.hidden) return;
  let k = null; try { k = wDemoKey(wch()); } catch (e) { return; } if (!k) return;
  SAVE.demos = SAVE.demos || {}; SAVE.demos[k] = 1; save();
  wStopAuto(); if (WALK) { clearTimeout(WALK.h); WALK = null; } WGOAL = null; SFX.play('click'); openModal(demoModal(k));
}
setInterval(wDemoCheck, 600);
// ================= 小游戏 =================
// 拉风箱：火候走到橘黄那一段时点「拉」，五下里中四下就成
function playMini(id, done) {
  if (id === 'bellows') return miniBellows(done);
  if (id === 'bellows2') return miniBellows(done, 0, { beats: ['长', '短', '长', '短', '短', '长'], need: 5, who: 'smith',
    win: [['smith', '……'], ['smith', '这一锤，是你小子拉的风？'], ['tiedan', '是我们一起拉的！']], again: [['smith', '火候虚了！心是一层一层打的，急什么！再来！']] });
  if (id === 'danlu') { const N = ['东边那口炉', '中间那口炉', '西边那口炉']; return miniBellows(done, 0, { beats: ['短', '长', '短'], need: 3, who: 'zhen', title: '压丹火',
    hint: (b, h) => `${N[b] || ''}：炉膛里的火一窜一窜的——火苗落到橘黄那一段时，拍下炉门！`, btn: b => `拍炉门！（${N[b] || ''}）`,
    win: [['narr', '三口丹炉「噗」地一声，一齐熄了。'], ['narr', '炉盖缝里飘出一缕一缕白烟，绕着你转了一圈，往山下飘去。'], ['zhen', '……那是镇上的人。']],
    again: [['zhen', '火又窜上来了！看准了再拍！']], giveup: [['zhen', '让开。'], ['narr', '珍姑娘抡起刀背，「哐哐哐」三下，把三口炉门全砸瘪了。'], ['zhen', '也行。']] }); }
  if (id === 'bellows3') return miniBellows(done, 0, { beats: ['长', '长', '短', '长', '短', '长'], need: 5, who: 'smith', title: '三个人拉风箱',
    hint: (b, h) => '张大锤掌锤，铁蛋和你一人一边拉风箱——火候走到橘黄那一段时，一起拉！', btn: b => `拉！（${['长', '长', '短', '长', '短', '长'][b] || ''}）`,
    win: [['smith', '……好火。'], ['narr', '钉子在砧子上一点一点变成土黄色，透出光来。'], ['tiedan', '爹！成了吗？'], ['smith', '还差最后一道淬火。天亮前，一定打好。']],
    again: [['smith', '心急了。再来。'], ['tiedan', '哥，跟着我数——长、长、短！']], giveup: [['smith', '……行了。'], ['narr', '张大锤一个人拉起了风箱。火苗稳得像画上去的。'], ['smith', '你们俩，去睡。剩下的我来。']] });
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
  const BEATS = O.beats || ['长', '长', '长', '短', '短'], NEED = O.need || 4, WHO = O.who || 'tiedan';
  const newZone = () => { const w = BEATS[beat] === '长' ? 0.2 : 0.13; const c = 0.3 + Math.random() * 0.45; zone = [c - w / 2, c + w / 2]; t0 = performance.now(); };
  const draw = () => {
    const per = BEATS[beat] === '长' ? 1700 : 1150, k = ((performance.now() - t0) % (per * 2)) / per, pos = k <= 1 ? k : 2 - k;
    miniPaint(box, 'b' + beat + '|' + hits + '|' + zone[0], () => O.title ? `<div class="qz-box mini"><div class="qz-q"><b>${esc(O.title)}</b>${esc(O.hint(beat, hits))}（中 ${hits} / ${beat}）</div>
      <div class="mz-bar"><i class="mz-zone" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">${esc(O.btn(beat))}</button></div>`
      : `<div class="qz-box mini"><div class="qz-q"><b>${O.who ? '父子拉风箱' : '拉风箱'}</b>${WHO === 'smith' ? '张大锤' : '铁蛋'}：「${esc(BEATS.map((b, i) => i < beat ? '✓' : b).join(' '))}」——火候走到<span class="mz-or">橘黄</span>那一段时，点「拉」！（中 ${hits} / ${beat}）</div>
      <div class="mz-bar"><i class="mz-zone" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">拉！（${BEATS[beat]}）</button></div>`, pos);
    raf = requestAnimationFrame(draw);
  };
  box.hidden = false; newZone(); draw();
  box.onclick = e => {
    if (!e.target.closest('[data-mz]')) return; e.stopPropagation();
    const mp = miniPos(box), ok = mp >= zone[0] && mp <= zone[1]; if (ok) hits++; SFX.play(ok ? 'hit' : 'fail'); beat++;
    if (beat < BEATS.length) { newZone(); return; }
    cancelAnimationFrame(raf); box.hidden = true; box.onclick = null;
    if (hits >= NEED) { SFX.play('legend'); playDialog(O.win || [['tiedan', hits === 5 ? '五下全中！我爹都没你拉得好！' : '成了！火候刚好！'], ['narr', '铁块烧得通红透亮。']], null, done); }
    else if (tries >= 2 && O.giveup) playDialog(O.giveup, null, done);
    else if (tries >= 2) playDialog([[WHO, '……行了行了，你歇着。'], ['narr', WHO === 'smith' ? '张大锤接过风箱自己拉了起来。火候刚好。' : '铁蛋接过风箱自己拉了起来，嘴里一直数着「长、长、短」。'], [WHO, '下回再练。']], null, done);
    else playDialog(O.again || [['tiedan', hits >= 2 ? '差一点！火有点虚……再来一回！' : '哎哎哎，火要灭了！你这是在扇扇子！再来！']], null, () => miniBellows(done, tries + 1, O));
  };
}
// 套圈：圈在晃，看准木头老虎的位置扔；三个圈中两个
function miniTaoquan(done, tries = 0) {
  const box = $('#quiz'); let n = 0, hits = 0, raf = 0, t0 = performance.now();
  const zone = () => { const w = 0.16 - n * 0.025, c = [0.62, 0.38, 0.7][n]; return [c - w / 2, c + w / 2]; };
  const draw = () => { const per = 1050 - n * 150, k = ((performance.now() - t0) % (per * 2)) / per, pos = k <= 1 ? k : 2 - k, z = zone();
    miniPaint(box, 't' + n + '|' + hits, () => `<div class="qz-box mini"><div class="qz-q"><b>套圈 · 第 ${n + 1} 个圈（中 ${hits}）</b>小虎：「那只木头老虎！就那只！」——手晃到<span class="mz-or">老虎</span>上面时，点「扔」！</div>
      <div class="mz-bar"><i class="mz-zone" style="left:${z[0] * 100}%;width:${(z[1] - z[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">扔！</button></div>`, pos); raf = requestAnimationFrame(draw); };
  box.hidden = false; draw();
  box.onclick = e => { if (!e.target.closest('[data-mz]')) return; e.stopPropagation();
    const z = zone(), mp = miniPos(box), ok = mp >= z[0] && mp <= z[1]; if (ok) hits++; SFX.play(ok ? 'hit' : 'fail'); n++; t0 = performance.now();
    if (n < 3) return;
    cancelAnimationFrame(raf); box.hidden = true; box.onclick = null;
    const S = wstate(qch()); S.flags.taoquanWin = hits >= 2 ? 1 : 0;
    if (hits >= 2) { SFX.play('rare'); playDialog([['narr', '圈「啪」地套住了木头老虎。'], ['xiaohu', '中了！中了！我就知道你行！'], ['narr', '小虎抱着木头老虎，在人群里跑来跑去，逢人就说是你套的。']], null, done); }
    else if (tries < 1) playDialog([['xiaohu', '哎呀！就差一点！'], ['xiaohu', '……再来一回好不好？我这还有三文钱。']], null, () => miniTaoquan(done, tries + 1));
    else playDialog([['narr', '三个圈都落在了老虎旁边。'], ['xiaohu', '……没事！'], ['narr', '摊主看小虎眼巴巴的，把木头老虎塞给了他：「拿去吧，看你哥哥扔得那么卖力。」']], null, done);
  };
}
// 讨价还价：康总管的小动作透露他吃哪一套
const KJ_OPT = ['夸他的月饼', '转身要走', '掏出几个铜板'], KJ_TELL = ['他擦了擦汗，小声嘀咕「今天还没开张」', '他偷偷瞄了一眼对面的月饼摊', '他盯着你的钱袋，喉结动了动'];
function miniKanjia(done) {
  const box = $('#quiz'); let round = 0, cut = 0; const P = ['一两', '五钱', '一钱', '五文'];
  const ask = () => { const want = Math.floor(Math.random() * 3), tell = Math.random() < 0.8 ? want : (want + 1) % 3;
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>讨价还价 · 第 ${round + 1} 回（现在 ${P[cut]} 一块）</b>康总管：「醉仙楼秘制五仁月饼！」<br>${KJ_TELL[tell]}。</div>${KJ_OPT.map((n, i) => `<button class="qz-opt" data-kj="${i}">${n}</button>`).join('')}</div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-kj]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const my = +b.dataset.kj, ok = my === want; if (ok) cut++; round++; SFX.play(ok ? 'rare' : 'fail');
      const L = ok ? [[['kang', '好好好，看在咱俩的交情上……'], ['kang', '……一块月饼？你是想吃，还是想要我的命？'], ['kang', '……行！']][my % 3]] : [['kang', ['夸？夸也没用！一文都不能少！', '走就走！……你、你真走啊？……不送！', '这几个铜板，买个月饼渣都不够！'][my]]];
      playDialog(L, null, () => round < 3 ? ask() : (() => { const S = wstate(qch()); S.flags.kanjia = cut;
        playDialog(cut >= 3 ? [['kang', '……五文。五文！拿走拿走！'], ['kang', '这事别让伙计们知道。'], ['narr', '他还偷偷多塞了你一块。']]
          : cut >= 1 ? [['kang', `${P[cut]}，不能再少了！`], ['narr', '你付了钱。……确实好吃，五仁里有一仁是黑风林的松子。']]
          : [['kang', '一两！童叟无欺！'], ['narr', '你咬咬牙买了一块。……确实好吃。']], null, done); })()); };
  };
  ask();
}
// 跟踪小偷：他要回头的时候会有小动作。该躲就躲，该跟就跟；被看见或跟丢了就重来
const TAIL_TELL = [['他头也不回地往前走，脚步越来越快', 0], ['他挤进人堆里，左右张望了一下钱袋', 0], ['他脚步慢了下来，脖子动了动', 1], ['他在一个灯笼摊前停住，手往腰后摸', 1]];
function miniTail(done, tries = 0) {
  const box = $('#quiz'); let step = 0, gap = 2;
  const ask = () => { const look = Math.random() < 0.4, pool = TAIL_TELL.filter(t => t[1] === (look ? 1 : 0)), honest = Math.random() < 0.85, T = honest ? RNG.pick(pool) : RNG.pick(TAIL_TELL.filter(t => t[1] !== (look ? 1 : 0)));
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>跟踪 · ${'●'.repeat(step)}${'○'.repeat(6 - step)}　距离：${['紧跟', '不远', '有点远', '快跟丢了'][Math.min(3, gap - 1)] || '紧跟'}</b>${T[0]}。</div>
      <button class="qz-opt" data-tl="0">跟上去</button><button class="qz-opt" data-tl="1">躲进人群</button></div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-tl]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const move = b.dataset.tl === '0';
      if (move && look && tries >= 2) { SFX.play('fail'); return playDialog([['narr', '他猛地回头——撒腿就跑。'], ['narr', '刚跑出巷子口，就一头撞在了珍姑娘身上。'], ['zhen', '跑啊？接着跑。']], null, done); }
      if (move && look) { SFX.play('fail'); return playDialog([['narr', '他猛地回头——正好和你对上了眼。'], ['narr', '小贼撒腿就跑，一眨眼钻进了巷子。'], ['zhen', tries ? '……又被他发现了。我从另一头堵他，你再跟一次。' : '笨。我从另一头堵他，你再跟一次。']], null, () => miniTail(done, tries + 1)); }
      if (move) { step++; gap = Math.max(1, gap - 1); SFX.play('step'); }
      else if (look) { SFX.play('rare'); }
      else { gap++; }
      if (gap >= 5 && tries >= 2) return playDialog([['narr', '人太多了，一转眼，他不见了。'], ['narr', '……巷子那头传来一声惨叫。'], ['zhen', '（拎着小贼的领子走出来）跟丢了？没事，我堵着呢。']], null, done);
      if (gap >= 5) return playDialog([['narr', '人太多了，一转眼，他不见了。'], ['zhen', '跟丢了？……他跑不远，再来。']], null, () => miniTail(done, tries + 1));
      if (step >= 6) { SFX.play('legend'); return playDialog([['narr', '小贼拐进一条死胡同，蹲下来数钱袋里的铜板。'], ['zhen', '数完了吗？'], ['narr', '珍姑娘从胡同那头走了出来。']], null, done); }
      playDialog([['narr', move ? '你不远不近地跟着。' : look ? '你闪进人群。他回头看了一眼，什么也没发现。' : '你躲了一下——他没回头，走远了一些。']], null, ask); };
  };
  ask();
}
// 押大小：赌坊鬼摇完骰盅，左手小指会敲桌子——敲两下开大，敲一下开小（它偶尔故意敲错）。三局两胜；白天在赌坊捡到灌铅骰子的，可以当场揭穿
const DICE_BIG = ['它的左手小指在桌上「哒、哒」敲了两下', '骰盅一停，它的小指头点了两下桌面', '它咳嗽一声，小指「哒哒」两下', '它笑嘻嘻地看着你，小指在桌沿上敲了两下'];
const DICE_SMALL = ['它的左手小指「哒」地敲了一下', '骰盅一停，它的小指头轻轻点了一下桌子', '它打了个哈欠，小指「哒」地一下', '它眯着眼看你，小指在桌沿上敲了一下'];
function miniDice(done, tries = 0) {
  const box = $('#quiz'), ev = !!wkeys().guanqian; let me = 0, him = 0, round = 0;
  const fin = win => { const S = wstate(qch()); S.flags.diceWin = win ? 1 : 0; done && done(); };
  const ask = () => {
    const big = Math.random() < 0.5, honest = Math.random() < (round === 2 ? 0.7 : 0.82), tell = RNG.pick(big === honest ? DICE_BIG : DICE_SMALL);
    const opts = [['押大', 'b'], ['押小', 's']]; if (ev && (round > 0 || tries > 0)) opts.push(['「你的骰子，灌了铅。」', 'x']);
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>押大小 · 第 ${round + 1} 局（你 ${me} : ${him} 它）</b>骰盅「哗啦哗啦」摇了一阵，「啪」地扣在桌上。<br>${tell}。</div>${opts.map(o => `<button class="qz-opt" data-dc="${o[1]}">${o[0]}</button>`).join('')}</div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-dc]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const k = b.dataset.dc;
      if (k === 'x') { SFX.play('legend'); return playDialog([['narr', '你把那颗沉甸甸的骰子「啪」地拍在桌上。'], ['dufang', '……'], ['narr', '赌坊里一下子安静了。几十双鬼眼睛，齐刷刷地盯着赌坊鬼。'], ['dufang', '好、好、好眼力！'], ['dufang', '影子……影子拿走！这事儿，咱们出了门谁也别提！']], null, () => fin(true)); }
      const ok = (k === 'b') === big; if (ok) me++; else him++; round++; SFX.play(ok ? 'rare' : 'fail');
      const L = [['narr', `开盅——${big ? '四、五、六，大！' : '一、二、三，小！'}`], ok ? ['dufang', ['……算你走运。', '哟，有两下子。', '……再来！'][Math.min(2, me - 1 + him)]] : ['dufang', ['哈哈哈！', '嘿嘿，鬼市的骰子，认生。', '承让承让～'][Math.min(2, him - 1 + me)]]];
      if (me >= 2) return playDialog(L.concat([['dufang', '……'], ['dufang', '十年了，头一回有阳人赢我。'], ['dufang', '影子，拿走。']]), null, () => fin(true));
      if (him >= 2) {
        if (tries >= 1) return playDialog(L.concat([['kangx', '再、再来！我把……我把我的肉押上！我肉多！'], ['dufang', '……'], ['dufang', '罢了罢了。'], ['dufang', '你这影子瘦成这样，我养着它，还得倒贴香火。'], ['dufang', '拿走拿走！看着心烦！']]), null, () => fin(true));
        return playDialog(L.concat([['kangx', '没事没事！再来一回！'], ['kangx', '（小声）好兄弟，我在这儿输了十年，就看出一件事：它敲两下，多半开大；敲一下，多半开小。'], ['kangx', '「多半」啊！它也会骗人！']]), null, () => miniDice(done, tries + 1));
      }
      playDialog(L, null, ask); };
  };
  playDialog(tries ? [['dufang', '再来就再来！']] : [['dufang', '规矩简单：押大押小，三局两胜。'], ['kangx', '（小声）它敲桌子……你看它的小指头……']], null, ask);
}
// 冰钓：浮漂在冰窟窿里上下晃，鱼一咬钩（浮漂沉到蓝色那段）就点「提竿」。五下里提中三下，鱼就上来了
function miniFish(done) {
  const box = $('#quiz'); let tries = 0, hits = 0, raf = 0, t0 = performance.now(), zone = null, spd = 1;
  const newZone = () => { const w = 0.16 - hits * 0.02, c = 0.25 + Math.random() * 0.5; zone = [c - w / 2, c + w / 2]; spd = 0.9 + Math.random() * 0.7 + hits * 0.2; t0 = performance.now(); };
  const draw = () => { const t = (performance.now() - t0) / 1000, pos = 0.5 + 0.45 * Math.sin(t * 2.4 * spd) * Math.cos(t * 1.3 * spd + 0.7);
    miniPaint(box, 'f' + tries + '|' + hits + '|' + zone[0], () => `<div class="qz-box mini"><div class="qz-q"><b>冰钓（第 ${tries + 1} 竿 · 提中 ${hits}/3）</b>浮漂一沉到<span class="mz-bl">蓝色</span>那段，就提竿！</div>
      <div class="mz-bar"><i class="mz-zone bl" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></i><i class="mz-pt" style="left:${pos * 100}%"></i></div>
      <button class="qz-opt mz-go" data-mz="1">提竿！</button></div>`, pos); raf = requestAnimationFrame(draw); };
  const fin = () => { cancelAnimationFrame(raf); box.hidden = true; box.onclick = null; const msg = (W_MINI_RW.fish || (() => ''))(wch(), hits >= 3 ? 1 : 0);
    playDialog(hits >= 3 ? [['narr', '竿子一沉——一条冰鱼甩着尾巴被你拽出了冰窟窿！'], ...(msg ? [['narr', msg]] : [])] : [['narr', '鱼线一松，鱼跑了。'], ['narr', '冰窟窿里冒了个泡，像在笑你。']], null, done); };
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
    box.innerHTML = `<div class="qz-box mini"><div class="qz-q"><b>打雪仗（${n}/10 · 砸中 ${hits}）</b>谁探头就砸谁！</div>
      <div class="snowrow">${[0, 1, 2].map(i => `<button class="snowwall ${i === at ? 'up' : ''}" data-sb="${i}">${i === at ? KID : ''}<i></i></button>`).join('')}</div></div>`;
    tm = setTimeout(() => { at = -1; SFX.play('fail'); show(); }, Math.max(520, 950 - n * 35)); };
  const fin = () => { clearTimeout(tm); box.hidden = true; box.onclick = null; const msg = (W_MINI_RW.snowball || (() => ''))(wch(), hits >= 6 ? 1 : 0);
    playDialog(hits >= 6 ? [['narr', `你砸中了 ${hits} 个。孩子们哇哇叫着举手投降。`], ...(msg ? [['narr', msg]] : [])] : [['narr', `你只砸中了 ${hits} 个，倒是自己挨了一身雪。`], ['narr', '孩子们笑成一团。']], null, done); };
  box.hidden = false;
  box.onclick = e => { const b = e.target.closest('[data-sb]'); if (!b) return; e.stopPropagation(); if (+b.dataset.sb === at) { hits++; SFX.play('hit'); at = -1; show(); } else SFX.play('step'); };
  show();
}
// 划拳：雷老虎出拳前有小动作，看出来就能赢；三局两胜
const HQ = ['石头', '剪刀', '布'], HQ_TELL = ['他的拳头攥得指节发白', '他两根手指在桌上「哒哒」地敲', '他张开巴掌在大腿上蹭了蹭'];
function miniHuaquan(done) {
  const box = $('#quiz'); let me = 0, him = 0, round = 0;
  const ask = () => {
    const pick = Math.floor(Math.random() * 3), truthful = Math.random() < 0.75, tell = truthful ? pick : (pick + 1 + Math.floor(Math.random() * 2)) % 3;
    box.innerHTML = `<div class="qz-box"><div class="qz-q"><b>划拳 · 第 ${round + 1} 局（你 ${me} : ${him} 雷老虎）</b>雷老虎：「哥俩好啊——」<br>${HQ_TELL[tell]}。</div>${HQ.map((n, i) => `<button class="qz-opt" data-hq="${i}">出${n}</button>`).join('')}</div>`;
    box.hidden = false;
    box.onclick = e => { const b = e.target.closest('[data-hq]'); if (!b) return; e.stopPropagation(); box.hidden = true; box.onclick = null;
      const my = +b.dataset.hq, r = (pick - my + 3) % 3;   // 1：我赢（我石头他剪刀）
      round++; let L;
      if (r === 0) L = [['narr', `你出${HQ[my]}，他也出${HQ[pick]}。`], ['lei', '平！再来！']];
      else if (r === 1) { me++; L = [['narr', `你出${HQ[my]}，他出${HQ[pick]}。`], ['lei', RNG.pick(['……老子喝！', '他娘的！喝就喝！', '你小子偷看老子手了吧？！'])], ['narr', '雷老虎一仰脖，干了一大碗。']]; }
      else { him++; L = [['narr', `你出${HQ[my]}，他出${HQ[pick]}。`], ['lei', RNG.pick(['哈哈哈！喝！', '嫩！太嫩！喝！', '老子押了二十年镖，划拳没输过！喝！'])], ['narr', '你喝了一大碗，烧得喉咙冒烟。']]; }
      SFX.play(r === 1 ? 'rare' : r === 2 ? 'fail' : 'page');
      playDialog(L, null, () => {
        if (me < 2 && him < 2 && round < 5) return ask();
        const S = wstate(qch()); S.flags.hqWin = me > him ? 1 : 0;
        playDialog(me > him ? [['lei', '……服了！老子服了！'], ['lei', '小子，以后镖局的酒，你随便喝！你的事，就是老子的事！'], ['narr', '雷老虎拍着你的肩膀，拍得你差点趴下。']]
          : [['lei', '哈哈哈！小子，酒量还得练！'], ['narr', '你眼前的灯笼开始转圈。雷老虎把你扶住，咧嘴一笑。'], ['lei', '不过——够胆子跟老子划拳的，镇上没几个。']], null, done);
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
    const rw = D.tier === 1 ? '稀有装备' : D.tier === 2 ? '稀有或套装，可能带特殊词条' : '神兵，带特殊词条';
    return `<div class="btyc t${D.tier} ${on ? 'on' : ''} ${done ? 'done' : ''}"><div class="btyh">${SPR.img(F.spr || 'skeleton', 40, D.pal || F.pal)}<div><span class="btyt">${T.n}</span><b>${esc(D.n)}</b><small>${esc(wBtyWhere(ch, D))} · ${wBtyLv(ch) + T.lv} 级${(D.spd || 1) > 1.05 ? ' · 很快' : ''}</small></div></div>
      <p>${esc(D.lore)}</p><div class="btyr"><span>${featureOn('bounty') ? `赏银 ${T.shang}` : `银两 ${T.shang * 10}`} · ${rw}</span>${done ? '<em class="ok">已伏法</em>' : on ? '<em>追捕中</em>' : `<button class="btn sm" ${B.took < BTY_PER_REST ? '' : 'disabled'} data-act="btyacc" data-arg="${D.id}">接下</button>`}</div></div>`; };
  const t3 = L.filter(D => D.tier === 3), rest = L.filter(D => D.tier < 3);
  return `<div class="shoph">${SPR.img('scroll', 48)}<div><h2 class="mh">悬赏榜 · ${esc(WMAPS[ch].n)}</h2><p class="sub">「${featureOn('bounty') ? '赏银找雷老虎领' : '赏钱当场结'}。拿命换钱的买卖，自己掂量。」</p></div></div>
    <div class="row wallet">${featureOn('bounty') ? `<span class="pill gold">赏银 ${SAVE.shang || 0}</span>` : ''}<span class="pill">这一轮还能接 ${Math.max(0, BTY_PER_REST - B.took)} 张</span>${featureOn('bounty') ? '<button class="btn sm ghost" data-act="btyshop">赏银兑换</button>' : ''}</div>
    ${BTYMSG ? `<p class="evres shopmsg">${BTYMSG}</p>` : ''}
    ${L.length ? `<div class="btyl">${t3.map(card).join('')}${rest.map(card).join('')}</div>` : '<p class="sub">这一带的妖物还没人见过——先走走看，去过的地方才会贴出悬赏。</p>'}
    <p class="help-p">丙等、乙等每在篝火边歇一次换一批，一轮最多接三张。甲等·首恶只有一张，打掉就没了。悬赏的家伙比路边的精英凶得多；有的会跑、有的会化鬼影、有的会结茧——看清榜上写的再去。</p>
    <button class="btn ghost" data-act="close">走了</button>`;
};
const shopEntryName = e => e.k === 'item' ? `<span class="r-${e.it.rarity}">${esc(itemTitle(e.it))}</span> <small>${SLOT_NAME[e.it.slot]}</small>`
  : e.k === 'gem' ? `${gemName(e.key)} <small>${gemDesc(e.key)}</small>` : e.k === 'exchange' ? `${e.gold} 两 → ${e.mb} 枚冥币` : esc(e.n || '');
const shopEntryIcon = e => e.k === 'item' ? SPR.item(e.it, 28) : e.k === 'gem' ? gemImg(e.key, 28) : SPR.img(e.spr || (e.k === 'food' ? 'cauldron' : e.k === 'gamble' || e.k === 'blind' ? 'chest' : e.k === 'exchange' ? 'gold' : 'scroll'), 28, e.pal);
const shopModal = () => {
  const ch = wch(), SH = W_SHOPS[SHOPID], st = wShopStock(ch, SHOPID), cur = wCurName(SH.cur), run = SAVE.run, cls = run ? run.cls : SAVE.cls, S = wstate(ch);
  const Sp = SPEAKERS[SH.who] || { spr: 'merchant' };
  const tabs = [['buy', SH.buyName || '买'], ...(SH.sell ? [['sell', SH.sellName || '当']] : []), ...(SH.reroll ? [['roll', '开光']] : [])];
  let body = '';
  if (SHOPTAB === 'buy') body = st.items.map((e, i) => { if (e.show && !e.show(S)) return ''; const can = !e.sold && (!e.need || e.need(S)) && (e.k === 'exchange' ? SAVE.gold >= e.gold : wCurN(SH.cur) >= e.price);
    return `<div class="irow ${e.k === 'item' ? ancCls(e.it) : ''}">${shopEntryIcon(e)}<button class="linkish nm" data-act="shopsel" data-arg="${i}">${shopEntryName(e)}${e.d ? `<small class="sd">${esc(e.d)}</small>` : ''}</button>
      ${e.sold ? '<span class="delta no">已售</span>' : `<button class="btn sm" ${can ? '' : 'disabled'} data-act="shopbuy" data-arg="${i}">${e.k === 'exchange' ? '换' : e.price + ' ' + cur}</button>`}</div>
      ${SHOPSEL === i && e.k === 'item' ? `<div class="shopcard">${itemCard(e.it, cls)}<p class="sub">换上后战力 ${deltaOf(e.it, cls)}</p></div>` : ''}`; }).join('');
  else if (SHOPTAB === 'sell') { const L = SAVE.stash.slice().sort((a, b) => sellPrice(b) - sellPrice(a));
    body = L.length ? L.map(it => `<div class="irow ${ancCls(it)}">${SPR.item(it, 28)}<button class="linkish nm" data-act="item" data-arg="${it.id}"><span class="r-${it.rarity}">${esc(itemTitle(it))}</span> <small>${SLOT_NAME[it.slot]}</small></button><button class="btn sm ghost" data-act="shopsell" data-arg="${it.id}">当 ${wShopSellPrice(SH, it)} ${cur}</button></div>`).join('') : '<p class="sub">储物箱是空的。身上穿着的东西当不了。</p>'; }
  else { const own = [...Object.values(SAVE.chars[cls].eq).filter(Boolean), ...SAVE.stash].filter(it => it.aff && it.aff.length);
    body = `<p class="help-p">开光：随手洗掉一条词条，换成一条新的——好坏全看缘分。每次 ${SH.reroll} ${cur}。</p>` + own.map(it => `<div class="irow ${ancCls(it)}">${SPR.item(it, 28)}<button class="linkish nm" data-act="item" data-arg="${it.id}"><span class="r-${it.rarity}">${esc(itemTitle(it))}</span><small class="sd">${it.aff.map(([k, v]) => fmtStat(k, Math.round(v * itemMult(it)))).join('，')}</small></button><button class="btn sm" ${wCurN(SH.cur) >= SH.reroll ? '' : 'disabled'} data-act="shoproll" data-arg="${it.id}">开光</button></div>`).join(''); }
  return `<div class="shoph">${unitIcon(Sp.spr, 56, Sp.pal, '', 'stand')}<div><h2 class="mh">${esc(SH.n)}</h2><p class="sub">${esc(SH.blurb || '')}</p></div></div>
    <div class="row wallet"><span class="pill gold">银两 ${SAVE.gold}</span>${SH.cur === 'shang' ? `<span class="pill gold">赏银 ${SAVE.shang || 0}</span>` : ''}${SH.cur === 'mb' || SAVE.mb ? `<span class="pill mb">冥币 ${wMb()}</span>` : ''}${run && run.tishen ? `<span class="pill">纸人 ${run.tishen}</span>` : ''}</div>
    ${tabs.length > 1 ? `<div class="row tabs">${tabs.map(([k, n]) => `<button class="btn sm ${SHOPTAB === k ? '' : 'ghost'}" data-act="shoptab" data-arg="${k}">${n}</button>`).join('')}</div>` : ''}
    ${SHOPMSG ? `<p class="evres shopmsg">${SHOPMSG}</p>` : ''}
    <div class="shop">${body}</div>${SH.note ? `<p class="help-p">${esc(SH.note)}</p>` : ''}
    <button class="btn ghost" data-act="close">走了</button>`;
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
    g.font = `bold 12px "Noto Sans SC",sans-serif`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(k >= 1 ? '冻伤了！快找篝火' : '寒气', 14, Hp - 15);
  }
  const E = S.esc; if (!E || S.flags.escaped) return;
  const pul = 0.5 + 0.5 * Math.sin(t / 160);
  g.fillStyle = `rgba(120,10,10,${0.08 + 0.1 * pul})`; g.fillRect(0, 0, Wp, Hp);
  if (E.warn && E.warn.sc === S.sc) { const px = ox + (E.warn.x + 0.5) * ts, py = oy + (E.warn.y + 0.5) * ts; g.fillStyle = `rgba(0,0,0,${0.35 + 0.3 * pul})`; g.beginPath(); g.ellipse(px, py + ts * 0.25, ts * 0.45, ts * 0.22, 0, 0, 6.29); g.fill(); g.strokeStyle = '#ff6a5a'; g.lineWidth = 2; g.stroke(); }
  if (E.fell && E.fell.sc === S.sc && t - E.fell.t < 500) { const px = ox + E.fell.x * ts, py = oy + E.fell.y * ts, k = (t - E.fell.t) / 500; g.globalAlpha = 1 - k; g.drawImage(SPR.cv('iceblock'), px, py - ts * (1 - k) * 2, ts, ts); g.globalAlpha = 1; }
  g.fillStyle = 'rgba(16,6,6,.85)'; g.fillRect(Wp / 2 - 110, 8, 220, 26); g.font = `bold 14px "Noto Serif SC",serif`; g.textAlign = 'center'; g.fillStyle = E.left < 25 ? '#ff6a5a' : '#ffd0c0';
  g.fillText(`冰窟塌了！快跑——还剩 ${E.left} 步`, Wp / 2, 26);
}
const foodModal = () => {
  const run = SAVE.run, L = foodsOpen(), cur = run && run.food;
  return `<h2 class="mh">康总管的美食图谱</h2><p class="help-p">吃一道，管到下次在篝火边休息。吃饭顺便回两成气血。收集到新食材，图谱上就多一道菜。</p>
    <div class="foods">${FOODS.map(F => { const ok = L.includes(F); return `<button class="btn ${ok ? (cur === F.id ? '' : 'ghost') : 'ghost dis'}" ${ok ? `data-act="eat" data-arg="${F.id}"` : 'disabled'}>${ok ? esc(F.n) : '？？？'} <small>${ok ? esc(F.d) : '还没收集到食材'}${cur === F.id ? ' · 正在享用' : ''}</small></button>`; }).join('')}</div>
    <button class="btn ghost" data-act="close">不吃了</button>`;
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
    <p class="help-p">火光驱散了阴气。在这里存档；打输了会回到最近的篝火。</p>
    <div class="campb"><button class="btn" data-act="wrest">休息 <small>回满气血和丹药，小妖会重新出现${talk ? ' · <b class="talkdot">有人想和你说说话</b>' : ''}</small></button>
      ${comps.length > 1 && !forced ? `<div class="compsel camp"><span class="sub">带谁同行</span>${comps.map(c => { const C2 = COMPANIONS[c]; return `<button class="cmp2 ${SAVE.comp === c ? 'on' : ''}" data-act="wcomp" data-arg="${c}">${unitIcon(C2.spr, 30, null, '', 'head')}<b>${C2.n}</b>${compTag(c)}</button>`; }).join('')}</div>` : ''}
      ${others.map(id => `<button class="btn ghost" data-act="wtele" data-arg="${id}">传送到「${esc(wCampName(ch, id))}」 <small>${esc(WMAPS[ch].scenes[wCampPos(ch, id).sc].n)}</small></button>`).join('')}
      <button class="btn ghost" data-act="wmenu">暂离 <small>回到出征菜单（换角色、看图鉴），之后从这里继续</small></button>
      <button class="btn ghost" data-act="close">离开</button></div>`;
};
// ---- 任务日志 / 小地图 ----
const affMet = (S, k) => k === 'ngoc' || (k === 'liu' && mPast(S, 'm3')) || (k === 'zhen' && S.flags.zhenMet) || wAffOf(k) > 0 || (k === 'kang' && S.side.S2) || (k === 'long' && S.side.S4);
function affHTML(ch) {
  const S = wstate(ch);
  const L = Object.keys(AFF_WHO).filter(k => affMet(S, k));
  return `<div class="affl">${L.map(k => { const v = wAffOf(k), h = Math.round(v / 2); const Sp = SPEAKERS[k];
    return `<div class="aff">${SPR.img(Sp.por || Sp.spr, 44, Sp.por ? null : Sp.pal)}<div><b>${esc(AFF_WHO[k])}</b><small>${AFF_LV[v]}</small></div><span class="hearts">${'♥'.repeat(h)}<i>${'♡'.repeat(5 - h)}</i></span></div>`; }).join('')}</div>
    <p class="help-p">好感来自任务、对话里的选择、篝火夜话。好感越高，带着同行时战斗越强（每点 +4% 气血和攻击）。</p>`;
}
const questModal = () => () => {
  const ch = SAVE.run && SAVE.run.world ? SAVE.run.chapter : 1, S = wstate(ch), Q = WQ[ch];
  const main = Q.main.map((m, i) => `<li class="${i < S.main ? 'done' : i === S.main ? 'cur' : 'todo'}">${i < S.main ? '✓' : i === S.main ? '▸' : '·'} ${i <= S.main ? esc(m.t) : '？？？'}${i < S.main && (m.lines || m.after) ? ` <button class="btn sm ghost rvb" data-act="wreplay" data-arg="${i}">回看</button>` : ''}${i === S.main ? `<small>${esc(((SAVE.guide === 'full' || !m.hint) ? m.d : m.hint).replace('{n}', S.kc))}</small>` : ''}</li>`).join('');
  const side = Q.side.filter(q => S.side[q.id]).map(q => { const s = S.side[q.id], st = q.steps[s.step];
    return `<li class="${s.st === 'done' ? 'done' : 'cur'}">${s.st === 'done' ? '✓' : '▸'} ${esc(q.t)}${s.st === 'on' ? `<small>${esc(((SAVE.guide === 'full' || !st.hint) ? st.d : st.hint).replace('{n}', s.n))}</small>` : ''}</li>`; }).join('');
  const keys = Object.keys(wkeys()).map(k => W_KEYS[k] && `<div class="keyit">${SPR.img(W_KEYS[k].spr, 28)}<span><b>${W_KEYS[k].n}</b><small>${W_KEYS[k].d}</small></span></div>`).join('');
  return `<button class="btn sm ghost x" data-act="close">关闭</button><h2 class="mh">${chTitle(ch)}</h2>
    ${CH_RECAP[ch] ? `<div class="row" style="margin:4px 0 8px"><button class="btn sm ghost" data-act="wrecap">上回说到</button><span class="sub">已经做完的主线可以点「回看」</span></div>` : '<p class="sub">已经做完的主线可以点「回看」</p>'}
    <h4 class="sub-h">主线 <small>${S.main}/${Q.main.length}</small></h4><ul class="qlog">${main}</ul>
    <h4 class="sub-h">支线 <small>已完成 ${Q.side.filter(q => S.side[q.id] && S.side[q.id].st === 'done').length}/${Q.side.length}</small></h4><ul class="qlog">${side || '<li class="todo">还没接到支线。头顶有「!」的人有事找你。</li>'}</ul>
    <h4 class="sub-h">人物</h4>${affHTML(ch)}
    ${keys ? `<h4 class="sub-h">主线道具</h4><div class="keys">${keys}</div>` : ''}`;
};
// ---- 全章大地图：去过的地方、任务在哪、点亮的篝火可以直接传送 ----
let MAPTAB = 'all';
function wTeleBlock(ch) {
  const S = wstate(ch), m = wMain(ch);
  if (m && m.escort && S.flags.escort === m.escort) return '带着人呢，走不开——先把人送到';
  if (wWatchBlock(ch)) return '巡逻的人盯着呢，先自己摸出去';
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
    const name = vis ? WMAPS[ch].scenes[sc].n : '？？？', w = Math.min(96, Math.max(58, name.length * 13 + 18));
    svg += `<g class="rg-n ${here ? 'here' : ''} ${vis ? '' : 'unk'} ${lit.length ? 'lit' : ''}" ${lit.length ? `data-act="mapgo" data-arg="${sc}"` : ''}>
      <rect x="${p.x - w / 2}" y="${p.y - 15}" width="${w}" height="30" rx="6"/><text x="${p.x}" y="${p.y + 5}">${esc(name)}</text>
      ${lit.length ? `<text class="rg-f" x="${p.x - w / 2 + 2}" y="${p.y - 10}">🔥</text>` : ''}${mk.main ? `<text class="rg-m" x="${p.x + w / 2 - 4}" y="${p.y - 9}">★</text>` : mk.side ? `<text class="rg-s" x="${p.x + w / 2 - 4}" y="${p.y - 9}">●</text>` : ''}
      ${here ? `<text class="rg-h" x="${p.x}" y="${p.y + 27}">你在这</text>` : ''}</g>`; }
  return svg + '</svg>';
}
const miniModal = () => () => {
  if (isRift(SAVE.run)) { const S0 = wstate(RCH);
    return `<button class="btn sm ghost x" data-act="close">关闭</button><h2 class="mh">${esc(WMAPS[RCH].scenes[S0.sc].n)}</h2><canvas id="minicv" class="minicv"></canvas>
    <p class="sub" style="text-align:center">紫框是传送阵，青框是塔，红点是妖物，橙点是精英，亮紫点是精魄，大红块是守关妖王</p>`; }
  const ch = wch(), S = wstate(ch), vis = Object.keys(S.sd).map(sc => WMAPS[ch].scenes[sc].n);
  const tabs = `<div class="row mtabs"><button class="btn sm ${MAPTAB === 'all' ? '' : 'ghost'}" data-act="maptab" data-arg="all">全章</button><button class="btn sm ${MAPTAB === 'here' ? '' : 'ghost'}" data-act="maptab" data-arg="here">这一带</button></div>`;
  if (MAPTAB === 'all') { const blk = wTeleBlock(ch);
    return `<button class="btn sm ghost x" data-act="close">关闭</button><h2 class="mh">${esc(chTitle(ch))}</h2>${tabs}${regionSVG(ch)}
      <p class="sub" style="text-align:center">${blk ? `<b style="color:var(--blood2)">${esc(blk)}</b>` : '点有 🔥 的地方，直接传送到那里的篝火'}　·　★ 主线　● 支线</p>`; }
  return `<button class="btn sm ghost x" data-act="close">关闭</button><h2 class="mh">${esc(WMAPS[ch].scenes[S.sc].n)}</h2>${tabs}<canvas id="minicv" class="minicv"></canvas>
  <p class="sub" style="text-align:center">金框是任务目标，橙色是篝火，黄点是出入口，红点是附近的妖物</p>
  <p class="sub" style="text-align:center">去过的地方：${vis.map(esc).join(' · ')}</p>`;
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
}
// ---- 摇杆 / 方向键 ----
function wJoySetup() {
  const j = $('#joy'); if (!j) return;
  const knob = j.querySelector('i');
  const set = e => { const r = j.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const L = Math.min(34, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); knob.style.transform = `translate(${Math.cos(a) * L}px,${Math.sin(a) * L}px)`;
    JOY = Math.hypot(dx, dy) < 12 ? null : (() => { const o = Math.round(a / (Math.PI / 4)); return [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]][(o + 8) % 8]; })(); };
  j.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); j.setPointerCapture(e.pointerId); set(e); wJoyStep(); };
  j.onpointermove = e => { if (j.hasPointerCapture(e.pointerId)) set(e); };
  j.onpointerup = j.onpointercancel = () => { JOY = null; knob.style.transform = ''; };
}
let _joyH = 0;
function wJoyStep() { clearTimeout(_joyH); if (!JOY || VIEW !== 'world') return; if (!WALK) wDirStep(JOY[0], JOY[1]); _joyH = setTimeout(wJoyStep, 60); }
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
  WGOAL = null;
  const T = wDirTarget(dx, dy); if (!T) return;
  if (T.act) return T.act();
  const P = wPt(wch(), T.x, T.y);
  WALK = { path: [{ x: T.x, y: T.y }], i: 0, joy: true, onArrive: P && P.t === 'camp' ? () => openModal(campModal(P)) : null }; wStepLoop();
}
// 镇上：带任务的人
function townCh() { if (SAVE.run && SAVE.run.world) return SAVE.run.chapter; const c = SAVE.chapter || 1; return wHas(c) && WMAPS[c].scenes.town ? c : wHas(1) ? 1 : 0; }

// ---------- 奇遇 / 货郎 / 篝火 / 宝箱 / 结算 / 片尾 ----------
function sceneWrap(art, inner) { return `${runBar(SAVE.run)}<div class="scene"><div class="panel"><div class="art">${art}</div>${inner}</div></div>`; }
function eventHTML() {
  const run = SAVE.run, c = curCell(run), ev = EVENTS.find(e => e.id === c.ev);
  if (!EVRES) return sceneWrap(SPR.img('fu', 72, null, 'float'), `<h2>${ev.t}</h2><p class="d">${ev.d}</p><div class="choices">${ev.c.map((x, i) => {
    const ok = !x.req || x.req(run, EV);
    return `<button class="btn" ${ok ? '' : 'disabled'} data-act="choice" data-arg="${i}">${x.dyn ? x.dyn(run, EV) : x.l}</button>`; }).join('')}</div>`);
  return sceneWrap(SPR.img('fu', 72, null, 'float'), `<h2>${ev.t}</h2><p class="evres">${esc(EVRES.msg)}</p>${lootChips(EVRES.items)}
    <button class="btn big" data-act="evcont">${EVRES.fight ? '迎战' : '继续探索'}</button>`);
}
function shopHTML() {
  const run = SAVE.run, sh = curCell(run).shop;
  return sceneWrap(SPR.img('merchant', 72, { R: '#3a3a3a', Y: '#6a5a3a' }), `<h2>地底货郎</h2><p class="d">「别看了，都是从死人身上扒下来的好货，童叟无欺。」</p>
    <div class="shop">${sh.items.map((x, i) => `<div class="irow ${ancCls(x.it)}">${SPR.item(x.it, 28)}<button class="linkish r-${x.it.rarity}" data-act="sitem" data-arg="${i}">${itemTitle(x.it)} <small>${SLOT_NAME[x.it.slot]}</small></button>
        ${x.sold ? '<span class="delta no">已售</span>' : `<button class="btn sm" ${SAVE.gold >= x.price ? '' : 'disabled'} data-act="buy" data-arg="${i}">${x.price} 两</button>`}</div>`).join('')}
      <div class="irow">${gemImg(sh.gem.key, 28)}<span class="nm">${gemName(sh.gem.key)} <small>${gemDesc(sh.gem.key)}</small></span>${sh.gem.sold ? '<span class="delta no">已售</span>' : `<button class="btn sm" ${SAVE.gold >= sh.gem.price ? '' : 'disabled'} data-act="buygem">${sh.gem.price} 两</button>`}</div>
      ${sh.potion ? `<div class="irow"><span class="nm">回春丹 <small>（现有 ${run.potions} 颗）</small></span><button class="btn sm" ${SAVE.gold >= sh.potion ? '' : 'disabled'} data-act="potion">${sh.potion} 两</button></div>` : '<div class="irow"><span class="nm sub">「囊中羞涩」：货郎不卖丹药</span></div>'}</div>
    <p class="d" style="margin:12px 0 0;font-size:14px;color:var(--dim)">你有 ${SAVE.gold} 两。货郎会一直待在这个房间，可以回来再买。</p>
    <button class="btn big" style="margin-top:12px" data-act="leave">离开</button>`);
}
function restHTML() {
  return sceneWrap(SPR.img('fire', 80, null, 'flicker'), `<h2>篝火</h2><p class="d">火光驱散了阴气。你可以在这里喘口气。</p><div class="choices">
    <button class="btn" data-act="rest" data-arg="heal">打坐：恢复 45% 气血</button>
    <button class="btn" data-act="rest" data-arg="sharpen">磨刀：本局伤害 +10%</button></div>`);
}
function chestHTML() {
  return sceneWrap(SPR.img('chest', 76), `<h2>宝箱</h2><p class="d">箱盖吱呀一声打开了。你得到了 ${CHEST ? CHEST.gold : 0} 两银子和：</p>${lootChips(CHEST && CHEST.items)}${CHEST && CHEST.gems.length ? `<p class="sub">还有一块${CHEST.gems[0]}</p>` : ''}
    <button class="btn big" data-act="leave">继续探索</button>`);
}
function endHTML() {
  const r = LASTRUN; if (!r) { VIEW = 'town'; return townHTML(); }
  const t = Math.round(((r.t1 || Date.now()) - r.t0) / 1000);
  const rift = r.mode === 'rift', sd = r.storyDone;
  const title = rift ? (r.ended === 'win' ? `幻境 ${r.riftLv} 层 · 过关` : r.ended === 'dead' ? '你倒在了幻境里' : '你离开了幻境')
    : r.ended === 'win' ? `${chTitle(r.chapter)} · 完` : r.ended === 'dead' ? '你倒在了地底' : '你撤回了青石镇';
  const order = { legend: 0, set: 1, rare: 2, magic: 3, normal: 4 };
  const loot = r.loot.slice().sort((a, b) => order[a.rarity] - order[b.rarity] || (b.anc || 0) - (a.anc || 0));
  let extra = '';
  if (sd && sd.first) extra += `<div class="firstclear"><h3>首次通关奖励</h3><p>银两 +${sd.gold}　·　魂晶 +${sd.mats}</p>${lootChips(sd.items)}${sd.unlock ? `<p class="evres">${sd.unlock}</p>` : ''}
    ${sd.chapter < 10 && r.diff === 'normal' ? `<p class="sub">下一章「${CHAPTERS[sd.chapter].n}」已开启</p>` : ''}</div>`;
  if (rift && r.riftDone) {
    const tl = r.timeLeft || 0, used = Math.round((r.clock || 0) / 100);
    extra += `<div class="riftres g-${tl >= 0.5 ? 'a' : tl >= 0.25 ? 'b' : tl > 0 ? 'c' : 'd'}"><div class="rr-g">${r.grade}</div>
      <div><p>${r.world ? `用时 <b>${fmtClock(r.clock || 0)}</b> · 香还剩 <b>${fmtClock(tl * riftLimit(r.riftLv))}</b>` : `用时 <b>${used}</b> 回合 · 香还剩 <b>${Math.round(tl * 100)}%</b>`}${r.deaths ? ` · 倒下 ${r.deaths} 次` : ''}</p>
      <p>${tl > 0 ? `灵玉可以升级 <b>${r.upg}</b> 次 · 现在最多能挑战 <b>${SAVE.riftCap}</b> 层${SAVE.riftCap > (r.capBefore || 0) ? '（往上开了）' : ''}` : '香烧完了：这一层不算过，灵玉只能升 1 次'}</p>
      ${r.record ? `<p class="evres">${CLASSES[r.cls].n}的新纪录：${r.riftLv} 层 · ${r.world ? '用时 ' + fmtClock(r.clock || 0) : used + ' 回合'}</p>` : ''}</div></div>`;
    extra += `<div class="lgup"><h3>灵玉</h3>${r.newGem ? `<p class="evres">得到新的灵玉：<b style="color:${LGEMS[r.newGem.t].c}">${LGEMS[r.newGem.t].n}</b></p>` : ''}
      ${SAVE.lgems.length ? `<p class="sub">还可以升级 <b style="color:var(--gold2)">${r.upg}</b> 次。成功率取决于幻境层数和灵玉等级。</p>
      <div class="gems">${SAVE.lgems.map(g => `<div class="gemrow lg">${SPR.img('gem', 26, { G: LGEMS[g.t].c }, 'glow')}<span class="nm"><b style="color:${LGEMS[g.t].c}">${LGEMS[g.t].n}</b> ${g.lv} 级<small>${LGEMS[g.t].d(g.lv)}</small></span>
        <button class="btn sm" ${r.upg ? '' : 'disabled'} data-act="lgup" data-arg="${g.id}">升级（${Math.round(lgemChance(g, r.riftLv) * 100)}%）</button></div>`).join('')}</div>` : ''}</div>`;
  }
  return `<div class="scene"><div class="panel"><div class="art">${r.ended === 'win' ? heroSpr(r.cls, 80, 'float') + (r.ngoc ? unitIcon(r.ngoc === 'fox' ? 'ngocfox' : 'ngoc', 72, null, 'float', 'stand') : '') : SPR.img('skeleton', 80)}</div><h2>${title}</h2>
    <p class="d">${CLASSES[r.cls].n} · ${rift ? '九幽幻境' : DIFFS[r.diff].n}${r.world ? '' : ` · 探索 ${r.rooms} 个房间`}</p>
    ${r.record && !rift ? '<p class="evres">刷新了本章最快纪录！</p>' : ''}
    ${extra}
    <div class="endstats"><div><small>${rift && r.world ? '香烧了' : '用时'}</small><b>${rift && r.world ? fmtClock(r.clock || 0) : fmtTime(t)}</b></div><div><small>斩妖</small><b>${r.kills}</b></div>
      <div><small>等级</small><b>${r.lvStart} → ${SAVE.chars[r.cls].level}</b></div><div><small>银两</small><b>+${r.goldGot}</b></div>
      <div><small>玉石</small><b>+${r.gemsGot}</b></div><div><small>魂晶</small><b>+${r.matsGot}</b></div>
      ${SAVE.para.lv > r.paraStart ? `<div><small>修为</small><b>${realmName(SAVE.para.lv)}</b></div>` : ''}</div>
    <p style="margin:0;color:var(--dim)">这次得到 ${loot.length} 件装备（已放进储物箱）</p>${lootChips(loot)}
    ${!rift && r.ended === 'win' && bkDue() ? `<div class="bk-nudge"><p>又打完一章。进度只存在这台设备上，备份一下更保险。</p><button class="btn sm" data-act="export">复制存档码</button><button class="btn sm ghost" data-act="bknudge">更多备份方式</button></div>` : ''}
    <button class="btn big" data-act="town">回青石镇</button></div></div>`;
}
function creditsHTML() {
  const E = (SAVE.wflags || {}).ending, EN = { 1: '结局一 · 一人一半', 2: '结局二 · 点灯', 3: '结局三 · 这次换我' }[E];
  const roll = [['', '九 幽 回 廊'], ...(EN ? [['', EN + ((SAVE.wflags || {}).endingHidden ? ' · 隐藏尾声「这盘棋」' : '')]] : []), ['主演', 'Ngoc cute'], ['主角', '阿土（芸芸众生）'],
    ['青石镇', '珍姑娘 · 康福贵 · 刘师傅 · 雷老虎 · 张大锤 · 铁蛋 · 珍大 · 小虎'], ['正气书院', '龙道长（安息）'], ['镇妖师', '青木子 · 金不换 · 烈阳子 · 玄冰子（安息）'],
    ['反派', '白云子（清虚道长）'], ['大反派', '九幽魔尊'], ['阴间', '孟婆 · 牛头 · 马面 · 王小六 · 鬼货郎 · 阿福'],
    ['特别出演', '僵尸县令 · 狼妖王 · 蜘蛛娘娘 · 赤炎石魔 · 千年蛇母 · 鬼王'], ['特别鸣谢', '现实中的 Ngoc cute'], ['', '—— 全剧终 ——']];
  return `<div class="credits"><div class="cr-art">${heroSpr(SAVE.cls, 96, 'float')}${SPR.img('ngoc', 96, null, 'float')}</div>
    <div class="cr-roll">${roll.map(([a, b]) => `<div class="cr-line"><small>${a}</small><b>${b}</b></div>`).join('')}</div>
    <p class="cr-sign">出品 · 制作　涂与豪</p>
    <div class="cr-unlock"><p>已开启：<b>铸剑坊</b>（强化、打孔镶玉、淬炼洗炼、传承升阶）· <b>赏银柜</b> · <b>九幽幻境</b>（限时一炷香，无尽深渊，可以带 Ngoc）· <b>幻境套装</b> · <b>镇妖录</b>（收服妖物、役使首领）· <b>修罗难度</b> · <b>修为</b> · <b>灵玉</b> · <b>江湖悬赏</b> · <b>加难度</b></p></div>
    <button class="btn big" data-act="credend">回青石镇</button></div>`;
}

// ---------- 弹窗 ----------
function openModal(fn) { MODALFN = fn; sheet.innerHTML = fn(); modal.hidden = false; const t = document.querySelector('#toast'); if (t) t.style.top = ''; }   // 弹窗打开时，提示条回到顶上，不压着弹窗里的字
function closeModal() { if (BACK) { MODALFN = BACK; BACK = null; sheet.innerHTML = MODALFN(); return; } MODALFN = null; modal.hidden = true; }
function findItem(id) {
  const s = SAVE.stash.find(x => x.id === id); if (s) return { it: s, where: 'stash' };
  for (const c of CLASS_IDS) for (const sl in SAVE.chars[c].eq) if (SAVE.chars[c].eq[sl] && SAVE.chars[c].eq[sl].id === id) return { it: SAVE.chars[c].eq[sl], where: 'eq', cls: c };
  return null;
}
function smithHTML(it, where) {
  if (VIEW !== 'town') return '<p class="sub" style="text-align:center">强化、传承、升阶、打孔、淬炼、洗炼，要回营地页找张大锤。</p>';
  const ec = enhanceCost(it), sc = socketCost(it), maxS = MAX_SOCKETS[it.slot], cap = smithMax();
  let h = `<div class="smith"><h4>${SPR.img('smith', 28)}张大锤铸剑坊 <small>你有 ${SAVE.gold} 两 · ${SAVE.mats} 魂晶</small></h4>`;
  if (!featureOn('enhance')) h += lockNote('通关以后，张大锤的铸剑坊开炉：强化、打孔镶玉、淬炼洗炼、传承升阶');
  else h += (it.plus || 0) >= ENHANCE_MAX ? '<div class="srow">已经强化到 +10</div>'
    : (it.plus || 0) >= cap ? `<div class="srow">张大锤现在最多能强化到 +${cap}，打通后面的章节他的手艺会更好</div>`
    : `<div class="srow"><span>强化 +${it.plus || 0} → +${(it.plus || 0) + 1}<small>成功率 ${Math.round(ec.rate * 100)}% · ${ec.gold} 两 + ${ec.mats} 魂晶（失败只损失材料）· 只加攻击、气血、护甲这些实数属性</small></span><button class="btn sm" ${SAVE.gold >= ec.gold && SAVE.mats >= ec.mats ? '' : 'disabled'} data-act="enh" data-arg="${it.id}">强化</button></div>`;
  if (featureOn('sockets')) h += (it.sockets || 0) >= maxS ? `<div class="srow">孔已打满（${maxS}/${maxS}）</div>`
    : `<div class="srow"><span>打孔 ${it.sockets || 0}/${maxS}<small>${sc.gold} 两 + ${sc.mats} 魂晶</small></span><button class="btn sm" ${SAVE.gold >= sc.gold && SAVE.mats >= sc.mats ? '' : 'disabled'} data-act="sock" data-arg="${it.id}">打孔</button></div>`;
  if (it.sockets && featureOn('sockets')) {
    h += '<div class="srow col"><span>玉石</span><div class="gslots">';
    for (let i = 0; i < it.sockets; i++) {
      const g = it.gems[i];
      h += g ? `<button class="gslot" data-act="ungem" data-arg="${it.id}|${i}">${gemImg(g, 22)}${gemName(g)}<small>取下${unsocketCost(g) ? ' ' + unsocketCost(g) + ' 两' : '（免费）'}</small></button>` : '<span class="gslot empty">空孔</span>';
    }
    h += '</div>';
    const free = it.sockets - it.gems.length, keys = Object.keys(SAVE.gems);
    const lg = (it.slot === 'ring' || it.slot === 'amulet') ? SAVE.lgems.filter(g => !lgemHost(g.id)) : [];
    if (free > 0) h += keys.length || lg.length ? `<div class="gpick">选择要镶的玉：${lg.map(g => `<button class="chip lgc" data-act="lgem" data-arg="${it.id}|${g.id}">${SPR.img('gem', 16, { G: LGEMS[g.t].c })}${LGEMS[g.t].n} ${g.lv} 级</button>`).join('')}${keys.map(k => `<button class="chip" data-act="gem" data-arg="${it.id}|${k}">${gemImg(k, 16)}${gemName(k)} ×${SAVE.gems[k]}</button>`).join('')}</div>` : '<p class="sub">你还没有玉石。</p>';
    h += '</div>';
  }
  if (featureOn('enhance')) {
    // 传承：同部位、身上或箱子里带强化/宝石的旧装备
    const pool = [...SAVE.stash, ...CLASS_IDS.flatMap(c => Object.values(SAVE.chars[c].eq).filter(Boolean))].filter(s => canInherit(it, s));
    if (pool.length) h += `<div class="srow col"><span>传承 <small>把旧装备的强化（降一级）、孔和宝石转到这件上。旧装备会变回白板。</small></span><div class="gslots">${pool.slice(0, 6).map(s => { const c = inheritCost(it, s);
      return `<button class="gslot" ${SAVE.gold >= c.gold && SAVE.mats >= c.mats ? '' : 'disabled'} data-act="inh" data-arg="${it.id}|${s.id}"><span class="r-${s.rarity}">${esc(s.name)}${s.plus ? ' +' + s.plus : ''}</span>${s.gems && s.gems.length ? `（${s.gems.length} 颗玉）` : ''}<small>→ +${Math.max(it.plus || 0, (s.plus || 0) - 1)} · ${c.gold} 两 ${c.mats} 魂晶</small></button>`; }).join('')}</div></div>`;
    const L = upTierTarget(ownerOf(it) || SAVE.cls);
    if (upTierOK(it) && L > it.ilvl && tierOf(L) > tierOf(it.ilvl)) { const c = upTierCost(it, L);
      h += `<div class="srow"><span>升阶 ${TIER_N[tierOf(it.ilvl)]} → ${TIER_N[tierOf(L)]}<small>装备等级 ${it.ilvl} → ${L}，攻击、气血、护甲这些实数属性一起涨，百分比词条不变 · ${c.gold} 两 + ${c.mats} 魂晶</small></span><button class="btn sm" ${SAVE.gold >= c.gold && SAVE.mats >= c.mats ? '' : 'disabled'} data-act="uptier" data-arg="${it.id}">升阶</button></div>`; }
  }
  if (it.aff.length && featureOn('reroll') && !it.rrPending) {
    const m = itemMult(it);
    if (it.rfPending) { const P = it.rfPending;
      h += `<div class="srow col"><span>淬炼结果：选一个留下</span><div class="gslots">${P.opts.map((o, i) => `<button class="gslot" data-act="rfpick" data-arg="${it.id}|${i}">${fmtStat(o[0], Math.round(o[1] * statMult(it, o[0])))}${affTag(it, o[0], o[1])}<small>${i ? '（新的）' : '（原来的）'}</small></button>`).join('')}</div></div>`;
    } else if (it.wsPending) { const P = it.wsPending;
      h += `<div class="srow col"><span>洗炼结果：整套二选一</span><div class="wsopts">${P.opts.map((set, i) => `<button class="gslot wsopt" data-act="wspick" data-arg="${it.id}|${i}"><b>${i ? '换成新的' : '留原样'}</b>${set.map(([k, v]) => `<div class="${SP_AFFIXES.includes(k) ? 'spx' : ''}">${fmtStat(k, Math.round(v * statMult(it, k)))}${affTag(it, k, v)}</div>`).join('')}</button>`).join('')}</div></div>`;
    } else {
      const lk = wlockOf(it), rc = refineCost(it), wc = washCost(it, lk.size), unlockedSp = it.aff.some(([k], i) => SP_AFFIXES.includes(k) && !lk.has(i));
      h += `<div class="srow col"><span>淬炼 · 洗炼 <small>淬炼：一条词条的数值重摇，新旧二选一（${rc.gold} 两 + ${rc.mats} 魂晶）。洗炼：锁住想留的，其余全部换新，洗完整套二选一；锁得越多越贵。</small></span>
        <div class="rflist">${it.aff.map(([k, v], i) => `<div class="rfrow ${lk.has(i) ? 'lk' : ''}"><button class="lockb ${lk.has(i) ? 'on' : ''}" data-act="wlock" data-arg="${it.id}|${i}">${lk.has(i) ? '已锁' : '锁'}</button><span class="${SP_AFFIXES.includes(k) ? 'spx' : ''}">${fmtStat(k, Math.round(v * statMult(it, k)))}${affTag(it, k, v)}</span><button class="btn sm ghost" ${SAVE.gold >= rc.gold && SAVE.mats >= rc.mats ? '' : 'disabled'} data-act="rf" data-arg="${it.id}|${i}">淬炼</button></div>`).join('')}</div>
        ${unlockedSp ? '<p class="sub warn">特殊词条没锁——洗炼会把它洗掉（洗不回来）。</p>' : ''}
        <button class="btn sm" ${lk.size < it.aff.length && SAVE.gold >= wc.gold && SAVE.mats >= wc.mats ? '' : 'disabled'} data-act="ws" data-arg="${it.id}">洗炼（锁 ${lk.size} 条 · ${wc.gold} 两 + ${wc.mats} 魂晶）</button></div>`;
    }
  }
  if (it.aff.length && featureOn('reroll') && it.rrPending) {
    const rc = rerollCost(it);
    if (it.rrPending) {
      h += `<div class="srow col"><span>洗炼结果：选一条留下</span><div class="gslots">${it.rrPending.opts.map((o, i) => `<button class="gslot" data-act="rrpick" data-arg="${it.id}|${i}">${fmtStat(o[0], Math.round(o[1] * statMult(it, o[0])))}${i === 0 ? '<small>（原来的）</small>' : ''}</button>`).join('')}</div></div>`;
    } else {
      h += `<div class="srow col"><span>洗炼 <small>花 ${rc.gold} 两 + ${rc.mats} 魂晶，把一条词条换成随机的两个新选项之一（也可以保留原样）。一件装备只能洗同一条词条。</small></span><div class="gslots">
        ${it.aff.map(([k, v], i) => `<button class="gslot" ${(it.rr == null || it.rr === i) && SAVE.gold >= rc.gold && SAVE.mats >= rc.mats ? '' : 'disabled'} data-act="rr" data-arg="${it.id}|${i}">${fmtStat(k, Math.round(v * statMult(it, k)))}</button>`).join('')}</div></div>`;
    }
  }
  if (where === 'stash' && it.legend && featureOn('cube')) h += `<div class="srow"><span>收进乾坤袋<small>${SAVE.cube[it.legend] ? '乾坤袋里已经有这个特效了' : '销毁这件神兵，永久学会它的特效（需要 10 颗魂晶）'}</small></span><button class="btn sm" ${!SAVE.cube[it.legend] && SAVE.mats >= 10 ? '' : 'disabled'} data-act="extract" data-arg="${it.id}">收进去</button></div>`;
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
function itemModal(id, shopIdx) {
  return () => {
    const cls = ctxCls();
    let it, where;
    if (shopIdx != null) { it = curCell(SAVE.run).shop.items[shopIdx].it; where = 'shop'; }
    else { const f = findItem(id); if (!f) return '<p>这件装备已经不在了。</p><button class="btn" data-act="close">关闭</button>'; it = f.it; where = f.where; }
    const cur = SAVE.chars[cls].eq[it.slot];
    const isMine = where === 'eq' && cur && cur.id === it.id;
    const inFight = VIEW === 'battle' && B && !B.over;
    const canSmith = where !== 'shop' && !inFight && VIEW === 'town' && (featureOn('enhance') || featureOn('reroll') || (featureOn('cube') && it.legend));   // 剧情里只有神兵能收进乾坤袋，别的装备不显示铸剑坊
    const tab = canSmith ? ITAB : 'info';
    let h = `<div class="shead"><button class="btn sm ghost" data-act="close">关闭</button>${canSmith ? `<div class="stabs"><button class="${tab === 'info' ? 'on' : ''}" data-act="itab" data-arg="info">属性</button><button class="${tab === 'smith' ? 'on' : ''}" data-act="itab" data-arg="smith">铸剑坊</button></div>` : ''}</div>`;
    if (tab === 'info') {
      if (!isMine && where !== 'eq') {
        if (canEquip(it, cls)) {
          const d = powerWith(cls, it) - power(charStats(cls));
          h += `<div class="pdelta2"><span>${cur ? `和身上的 <b class="r-${cur.rarity}">${itemTitle(cur)}</b> 比` : `${SLOT_NAME[it.slot]}现在空着`}</span><b class="${d >= 0 ? 'up' : 'dn'}">战力 ${d >= 0 ? '+' : ''}${d}</b></div>${diffChips(it, cur)}`;
        } else h += `<p class="pdelta warn">${CLASSES[cls].n}用不了这件门派套装</p>`;
      }
      h += itemCard(it, cls, isMine ? '当前装备' : where === 'eq' ? '别的角色正在用' : '');
      if (cur && !isMine && where !== 'eq') h += `<details class="curd"><summary>展开身上那件的完整属性</summary>${itemCard(cur, cls, '身上穿的')}</details>`;
    } else h += smithHTML(it, where);
    const acts = [];
    if (where === 'stash') {
      if (canEquip(it, cls)) acts.push(`<button class="btn" data-act="equip" data-arg="${it.id}">穿上</button>`);
      if (!inFight) acts.push(`<button class="btn ghost" data-act="sell" data-arg="${it.id}">卖 ${sellPrice(it)} 两</button>`, `<button class="btn ghost" data-act="salv" data-arg="${it.id}">分解 ${salvageValue(it)} 魂晶</button>`);
    }
    if (isMine) acts.push(`<button class="btn ghost" data-act="unequip" data-arg="${it.slot}">卸下</button>`);
    if (acts.length) h += `<div class="sheet-act">${acts.join('')}</div>`;
    return h;
  };
}
const cubeModal = slot => () => {
  const cls = SAVE.cls, ch = SAVE.chars[cls], learned = LEGENDS.filter(L => SAVE.cube[L.id]);
  return `<button class="btn sm ghost x" data-act="close">关闭</button><h2 class="mh">乾坤袋 · 格子 ${slot + 1}</h2><p class="sub">选一个已收藏的神兵之魂放进这个格子（${CLASSES[cls].n}）。</p>
    <div class="cubepick">${ch.cube[slot] ? `<button class="cp" data-act="cubeset" data-arg="${slot}|"><b>清空这个格子</b></button>` : ''}${learned.map(L => `<button class="cp ${ch.cube.includes(L.id) ? 'on' : ''}" data-act="cubeset" data-arg="${slot}|${L.id}"><b class="r-legend">${L.n}</b><span>${L.d}</span><small>${SLOT_NAME[L.slot]}${ch.cube.includes(L.id) ? ' · 已放入' : ''}</small></button>`).join('')}</div>`;
};
const bagModal = () => () => `<div class="shead"><button class="btn sm ghost" data-act="close">关闭</button><div class="stabs"><button class="${BAGTAB === 'stat' ? 'on' : ''}" data-act="bagtab" data-arg="stat">属性</button><button class="${BAGTAB === 'gear' ? 'on' : ''}" data-act="bagtab" data-arg="gear">装备</button><button class="${BAGTAB === 'skill' ? 'on' : ''}" data-act="bagtab" data-arg="skill">武学</button><button class="${BAGTAB === 'tal' ? 'on' : ''}" data-act="bagtab" data-arg="tal">心法${talentInfo(ctxCls()).free ? ` <b class="upn">${talentInfo(ctxCls()).free}</b>` : ''}</button></div></div>
  ${BAGTAB === 'stat' ? `<div class="inbag bagstat"><h3 class="bs-h">${esc(CLASSES[ctxCls()].n)} · ${SAVE.chars[ctxCls()].level} 级</h3>${statBlock(ctxCls())}</div>` : BAGTAB === 'gear' ? `<div class="gearp inbag">${gearPanel(ctxCls(), true)}</div>` : BAGTAB === 'skill' ? skillPanel(ctxCls(), true) : `<p class="sub">心法可用 ${talentInfo(ctxCls()).free} 点${paraFree() ? ` · 修为可用 ${paraFree()} 点（回镇上分配）` : ''}</p>${talentGrid(ctxCls())}`}`;
const retreatModal = () => () => `<h2 class="mh">撤回青石镇？</h2><p>这一趟就到这里。已经得到的装备、材料、经验和银两都会保留。</p>
  <div class="row"><button class="btn" data-act="doretreat">确认撤回</button><button class="btn ghost" data-act="close">再想想</button></div>`;
const resetModal = () => () => `<h2 class="mh" style="color:var(--blood2)">删除全部存档？</h2><p>所有角色、等级、装备、玉石、建筑、剧情进度都会清空，无法恢复。</p>
  <div class="row"><button class="btn" data-act="doreset">确认删除</button><button class="btn ghost" data-act="close">取消</button></div>`;
const rewardModal = (title, r) => () => `<h2 class="mh">${title}</h2>
  <p>${[r.xp ? `经验 +${r.xp}` : '', r.gold ? `银两 +${r.gold}` : '', r.mats ? `魂晶 +${r.mats}` : '', r.ups ? `<b style="color:var(--gold2)">升了 ${r.ups} 级！</b>` : ''].filter(Boolean).join('　·　')}</p>
  ${lootChips(r.items)}${gemChips(r.gems || (r.gem ? [r.gem] : []))}<div class="row" style="justify-content:center"><button class="btn" data-act="close">好</button></div>`;

// ---------- 云存档（当前环境不可用时自动退回本机） ----------
const CLOUD = { db: null, uid: null, status: 'connecting', at: 0, pushing: false, dirty: false, timerH: null };
function cloudLine() {
  return { connecting: '云存档：正在检查……', off: '云存档：当前未开启，进度保存在这台设备的浏览器里。换设备时用下面的存档码转移。',
    ok: `云存档：已开启，进度自动同步到你的账号${CLOUD.at ? '（上次同步 ' + new Date(CLOUD.at).toLocaleTimeString() + '）' : ''}。`,
    err: '云存档：同步失败，稍后会自动重试。进度仍保存在这台设备上。',
    ro: '云存档：你当前的访问方式没有写入权限，进度只保存在这台设备上。' }[CLOUD.status];
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
        try { SAVE = parseSave(JSON.parse(d.json)); persist(true); SFX.set(SAVE.sound, false); VIEW = SAVE.run ? 'map' : 'town'; B = null; render(); toast('已从云端读取最新存档'); } catch (e) {}
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
function refresh() { save(); if (VIEW !== 'battle') render(); else applyStep(null); if (MODALFN) sheet.innerHTML = MODALFN(); }
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
  tab: c => { SAVE.cls = c; FILTER = 'all'; GSLOT = null; refresh(); },
  tt: k => { TT = k; refresh(); },
  diff: d => { SAVE.diff = d; refresh(); },
  chap: k => { SAVE.chapter = +k; refresh(); },
  chnav: d => { const cl = storyCleared(SAVE.diff), maxCh = Math.min(10, cl + 1); SAVE.chapter = Math.max(1, Math.min(maxCh, SAVE.chapter + +d)); SFX.play('page'); refresh(); },
  htab: k => { HTAB = k; refresh(); },
  tbr: i => { TBR = +i; refresh(); },
  modsopen: () => { MODSOPEN = !MODSOPEN; refresh(); },
  logt: () => { const l = $('#blog'); if (l) l.classList.toggle('open'); },
  auto: () => { if (AUTO) { stopAuto(); return; } AUTO = true; const b = document.querySelector('.autob'); if (b) { b.classList.remove('ghost'); b.textContent = '自动探索中…'; } autoStep(); },
  mode: m => { SAVE.mode = m; refresh(); },
  rlv: d => { SAVE.riftLv = Math.max(1, Math.min(Math.max(1, SAVE.riftCap || 3), SAVE.riftLv + +d)); refresh(); },
  zyopen: () => { TT = 'col'; ZYOPEN = true; VIEW = 'town'; refresh(); setTimeout(() => { const e = document.getElementById('zylu'); if (e) e.scrollIntoView({ block: 'start' }); }, 50); },
  zyp: a => { ZYPG = ZYPG === +a ? -1 : +a; refresh(); },
  yi: id => { const r = setYi(SAVE.cls, id); if (r.err) return toast(r.err); save(); refresh(); },
  modt: id => { const i = SAVE.mods.indexOf(id); if (i >= 0) SAVE.mods.splice(i, 1); else SAVE.mods.push(id); refresh(); },
  ngoctog: () => { SAVE.ngocJoin = !SAVE.ngocJoin; refresh(); if (SAVE.ngocJoin) toast('Ngoc：「早就该带上我了。」'); else toast('Ngoc：「……那你早点回来。」'); },
  npc: id => {
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
    if (mode === 'story' && !chapterUnlocked(SAVE.diff, SAVE.chapter)) return toast('这一章还没解锁');
    if (mode === 'story' && (SAVE.diff === 'normal' || SAVE.diff === 'nightmare') && wHas(SAVE.chapter)) {
      SAVE.run = newWorldRun(SAVE.cls, SAVE.chapter, SAVE.diff); const S = wstate(SAVE.chapter);
      if (S.camp) wTele(SAVE.chapter, S.camp);
      VIEW = 'world'; WHERO = null; refresh(); window.scrollTo(0, 0);
      const ch = SAVE.chapter, C = CHAPTERS[ch - 1], M = WQ[ch].main, cur = M[S.main];
      const sv = SAVE, first = () => { if (SAVE !== sv || VIEW !== 'world' || wstate(ch).main !== 0) return; const g0 = M[0].goal; if (g0.talk) setTimeout(() => { if (SAVE === sv && VIEW === 'world' && wstate(ch).main === 0) wRun(wTalk(ch, g0.talk, SAVE.run)); }, 300); };
      if (S.main === 0) chapterIntro(chIntroFor(ch), () => { if (SAVE !== sv) return; if (CH_RECAP[ch]) playDialog(recapLines(ch), null, first); else first(); });
      else if (cur && /^i/.test(cur.id) && !/^i/.test((M[S.main - 1] || {}).id || '') && interIntroFor(ch) && !S.pz.iintro) { S.pz.iintro = 1; chapterIntro(interIntroFor(ch)); }
      else banner(chTitle(ch), C.sub, 2000);
      return;
    }
    if (mode === 'rift') {   // 幻境：走路遇怪的大地图
      SAVE.run = newRiftRun(SAVE.cls, SAVE.riftLv); RTICK = 0;
      VIEW = 'world'; WHERO = null; WAUTO = false; WGOAL = null; WALK = null; refresh(); window.scrollTo(0, 0);
      banner(`九幽幻境 · ${SAVE.run.riftLv} 层`, WMAPS[RCH].scenes.f0.n, 2000);
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
    } else { banner(`九幽幻境 · ${run.riftLv} 层`, themeOf(run).n, 1800); }
  },
  resume: () => { VIEW = SAVE.run.world ? 'world' : 'map'; WHERO = null; refresh(); window.scrollTo(0, 0); },
  retreat: () => { stopAuto(); openModal(retreatModal()); },
  doretreat: () => { const r = SAVE.run; BACK = null; closeModal(); clearTimeout(timer); finishRunView(r, 'retreat'); },
  town: () => { VIEW = 'town'; TT = 'go'; LASTRUN = null; refresh(); window.scrollTo(0, 0); },
  credend: () => { VIEW = 'end'; refresh(); window.scrollTo(0, 0); if (!seen('postg')) { markSeen('postg'); save(); setTimeout(() => playDialog(POSTGAME_OPEN(), null, () => {}), 400); } },
  replay: a => { const [k, part] = split(a), C = CHAPTERS[+k - 1]; const lines = part === 'ending' ? ENDING : part === 'story' ? C.story.lines : C[part]; playDialog(lines, C.boss); },
  item: id => { const prev = MODALFN; ITAB = 'info'; openModal(itemModal(id)); BACK = prev; },
  gsl: sl => { GSLOT = GSLOT === sl ? null : sl; refresh(); },
  gsub: k => { GSUB = k; refresh(); },
  itab: k => { ITAB = k; refresh(); },
  bagtab: k => { BAGTAB = k; refresh(); },
  qeq: id => {
    const cls = ctxCls(), f = findItem(id); if (!f) return;
    const d = powerWith(cls, f.it) - power(charStats(cls));
    if (equipItem(cls, id)) { SFX.play('loot'); toast(`穿上了 <b>${esc(f.it.name)}</b>，战力 ${d >= 0 ? '+' : ''}${d}`); refresh(); achToast(checkAch()); }
  },
  sitem: i => openModal(itemModal(null, +i)),
  close: () => closeModal(),
  equip: id => { if (equipItem(ctxCls(), id)) { SFX.play('loot'); toast('已装备'); closeModal(); refresh(); achToast(checkAch()); } },
  unequip: sl => { unequip(ctxCls(), sl); closeModal(); refresh(); },
  sell: id => { const g = sellItem(id); SFX.play('coin'); toast(`卖了 ${g} 两`); closeModal(); refresh(); },
  salv: id => { const m = salvage(id); SFX.play('forge'); toast(`分解得到 ${m} 颗魂晶`); closeModal(); refresh(); },
  best: () => { bestGear.left = []; const n = bestGear(ctxCls()), left = bestGear.left.filter(x => SAVE.stash.includes(x)); toast(n ? `换上了 ${n} 件更强的装备${left.length ? `。换下来的「${esc(left[0].name)}${left[0].plus ? ' +' + left[0].plus : ''}」${left.length > 1 ? `等 ${left.length} 件` : ''}上有强化或玉，可以在铸剑坊「传承」到新装备上` : ''}` : '已经是最强搭配了'); refresh(); achToast(checkAch()); },
  junk: () => { const r = sellJunk(); if (r.n) SFX.play('coin'); toast(r.n ? `卖掉 ${r.n} 件，得到 ${r.g} 两` : '没有可以卖的凡品和灵品（强化过或镶了玉的不会卖）'); refresh(); },
  salvjunk: () => { const r = salvageJunk(); if (r.n) SFX.play('forge'); toast(r.n ? `分解 ${r.n} 件，得到 ${r.m} 颗魂晶` : '没有可以分解的凡品和灵品'); refresh(); },
  filter: f => { FILTER = f; refresh(); },
  enh: id => { const it = findOwned(id); const r = enhance(it); if (r.err) return toast(r.err); SFX.play(r.ok ? 'forge' : 'fail'); toast(r.ok ? `强化成功！现在是 +${it.plus}` : '张大锤：「这次……手滑了。」材料损失了'); refresh(); achToast(checkAch()); },
  sock: id => { const r = addSocket(findOwned(id)); if (r.err) return toast(r.err); SFX.play('forge'); toast('打孔成功'); refresh(); },
  gem: a => { const [id, k] = split(a); const r = socketGem(findOwned(id), k); if (r.err) return toast(r.err); SFX.play('rare'); toast('镶嵌成功'); refresh(); },
  lgem: a => { const [id, g] = split(a); const r = socketLgem(findOwned(id), g); if (r.err) return toast(r.err); SFX.play('legend'); toast('灵玉镶嵌成功'); refresh(); },
  ungem: a => { const [id, i] = split(a); const r = unsocket(findOwned(id), +i); if (r.err) return toast(r.err); toast('玉石已取下'); refresh(); },
  rr: a => { const [id, i] = split(a); const r = rerollStart(findOwned(id), +i); if (r.err) return toast(r.err); SFX.play('magic'); refresh(); },
  rrpick: a => { const [id, i] = split(a); rerollPick(findOwned(id), +i); SFX.play('forge'); toast('洗炼完成'); refresh(); },
  btyacc: id => { const r = wBtyAccept(wch(), id); BTYMSG = r.err || r.ok; SFX.play(r.err ? 'fail' : 'rare'); if (MODALFN) sheet.innerHTML = MODALFN(); },
  btyshop: () => { SHOPID = 'shangyin'; SHOPTAB = 'buy'; SHOPMSG = ''; SHOPSEL = -1; openModal(shopModal); },
  form: a => { const [i, z] = split(a); const ch = SAVE.chars.necro; ch.form = necroForm(ch.level, ch.form); ch.form[+i] = z; save(); SFX.play('click'); refresh(); },
  rf: a => { const [id, i] = split(a); const r = refineStart(findOwned(id), +i); if (r.err) return toast(r.err); SFX.play('magic'); refresh(); },
  rfpick: a => { const [id, i] = split(a); refinePick(findOwned(id), +i); SFX.play('forge'); toast(+i ? '换上了新的数值' : '留下了原来的'); refresh(); },
  wlock: a => { const [id, i] = split(a); if (WLOCK.id !== id) WLOCK = { id, s: new Set() }; const k = +i; if (WLOCK.s.has(k)) WLOCK.s.delete(k); else WLOCK.s.add(k); refresh(); },
  ws: id => { const it = findOwned(id); const r = washStart(it, [...wlockOf(it)]); if (r.err) return toast(r.err); SFX.play('magic'); refresh(); },
  wspick: a => { const [id, i] = split(a); washPick(findOwned(id), +i); SFX.play('forge'); toast(+i ? '洗炼完成：换上了新词条' : '留下了原样'); refresh(); },
  inh: a => { const [d, s] = split(a); const r = inheritFrom(findOwned(d), findOwned(s)); if (r.err) return toast(r.err); SFX.play('forge'); toast(`传承完成：现在 +${r.plus}${r.gems ? `，带过来 ${r.gems} 颗玉` : ''}`); refresh(); },
  uptier: id => { const it = findOwned(id); const r = upTier(it, upTierTarget(ownerOf(it) || SAVE.cls)); if (r.err) return toast(r.err); SFX.play('forge'); toast(`升阶完成：现在是${TIER_N[it.tier]}`); refresh(); },
  extract: id => { const r = extractLegend(id); if (r.err) return toast(r.err); SFX.play('legend'); toast('神兵之魂收进了乾坤袋，去「装备」页把它放进格子'); closeModal(); refresh(); achToast(checkAch()); },
  cubepick: i => openModal(cubeModal(+i)),
  cubeset: a => { const [i, lid] = split(a); setCube(SAVE.cls, +i, lid || null); SFX.play('rare'); closeModal(); refresh(); },
  combine: k => { const r = combineGem(k); if (r.err) return toast(r.err); SFX.play('rare'); toast('合成了 ' + gemName(r.key)); refresh(); },
  learn: a => { const [br, i] = split(a); if (learnTalent(ctxCls(), br, +i)) { SFX.play('buff'); refresh(); } },
  respec: () => { if (resetTalents(ctxCls())) { toast('散功完毕，心法点已退回'); refresh(); } },
  para: a => { const [k, n] = split(a); if (addPara(k, +n)) { SFX.play('buff'); refresh(); achToast(checkAch()); } },
  parareset: () => { resetPara(); toast('修为点已退回'); refresh(); },
  rune: a => { const [id, r] = split(a); setRune(ctxCls(), id, r); SFX.play('magic'); refresh(); },
  skup: id => { moveSkill(ctxCls(), id, -1); refresh(); },
  skdn: id => { moveSkill(ctxCls(), id, 1); refresh(); },
  skeq: id => { const r = equipSkill(ctxCls(), id); if (r === 'full') return toast(`最多带 ${LOADOUT_MAX} 个武学，先卸下一个`); SFX.play(r === 'on' ? 'buff' : 'click'); refresh(); },
  bclaim: i => { const r = claimBounty(+i); if (!r) return; SFX.play('legend'); save(); render(); openModal(rewardModal('悬赏宝箱', r)); achToast(checkAch()); },
  bbonus: () => { const r = claimBountyBonus(); if (!r) return; SFX.play('legend'); save(); render(); openModal(rewardModal('赏金大箱', r)); achToast(checkAch()); },
  lgup: gid => { const ok = upgradeLgem(LASTRUN, gid); if (ok == null) return; SFX.play(ok ? 'legend' : 'fail'); toast(ok ? '灵玉升级成功！' : '升级失败'); refresh(); achToast(checkAch()); },
  cell: i => { stopAuto(); walkTo(i); },
  bag: () => { stopAuto(); BACK = null; if (talentInfo(ctxCls()).free && !SAVE.stash.length) BAGTAB = 'tal'; openModal(bagModal()); },
  ult: () => { if (!B || B.over) return; if ((B.P.rage || 0) < 100) return toast('怒气还没满'); B.ultReq = true; SFX.play('buff'); applyStep(null); if (B.waiting) { B.waiting = false; clearTimeout(timer); tick(); } },
  ultsw: () => { SAVE.ultAuto = SAVE.ultAuto === false; if (B) { B.ultAuto = SAVE.ultAuto; B.castAuto = SAVE.ultAuto; B.castReq = null; if (B.waiting && B.castAuto) { B.waiting = false; setTimeout(tick, 50); } else if (!B.castAuto) applyStep(null); } save(); const b = document.querySelector('.ultsw'); if (b) { b.classList.toggle('on', SAVE.ultAuto); b.innerHTML = SAVE.ultAuto ? '自动<br>出招' : '手动<br>出招'; }
    toast(SAVE.ultAuto ? '自动出招：技能和必杀都自动放' : '手动出招：点上面的技能，主角下一招就放它；不点就用基本招式。怒气满了点「必杀」'); if (B) applyStep(null); },
  castq: id => { if (!B || B.over) return; if (B.castAuto) return; const k = B.P.skills.find(x => x.id === id); if (!k) return;
    if (k.left > 0) return toast(`「${k.n}」还要冷却 ${k.left} 招`); B.castReq = B.castReq === id ? null : id; SFX.play('click'); applyStep(null); if (B.waiting && B.castReq) { B.waiting = false; clearTimeout(timer); tick(); } },
  btarget: id => { if (!B || B.over) return; B.target = B.target === id ? null : id; SFX.play('click'); applyStep(null); },
  wgo: (id, el, cont) => {
    const ch = wch(), q = wTracker(ch).find(x => x.id === id); if (!q) { WGOAL = null; return; }
    if (!cont) WGOAL = { id, hops: 0 }; else if (!WGOAL) return;
    wStopAuto(); clearTimeout(WALK && WALK.h); WALK = null;
    { const p0 = wMarkPos(ch, q); if (p0 && p0.comp) { WGOAL = null; return ACT.wtalkc(); } }   // 要找的人就跟在身边：直接搭话
    if (wWatchBlock(ch)) { WGOAL = null; return qtoast('这里有人巡逻，自动寻路不管用——自己摸过去'); }
    { const MS = WQ[ch].main.find(m => m.id === id), nt = !!wstate(ch).flags.night;   // 昼夜：时辰不对，找不着人
      if (WMAPS[ch].daynight && MS && MS.tod && (MS.tod === 'night') !== nt && !cont) qtoast(MS.tod === 'night' ? '这件事得等天黑——在篝火边歇一歇，天就黑了' : '这件事得等天亮——在篝火边歇一歇，天就亮了'); }
    const p = wMarkPos(ch, q);
    if (!p) { WGOAL = null; return wStartAuto(); }
    const R = wRoute(ch, p);
    if (!R) { WGOAL = null; return qtoast('那边的路现在还走不通'); }
    if (R.puzzle) {   // 被谜题挡住：走到边上停下，剩下的自己来
      WGOAL = null; WTAP = { x: R.x, y: R.y, t: 0 };
      const msg = R.who ? `${R.who}两眼发直地挡在路口——走过去点他一下` : R.puzzle === '迷路' ? '林子里的路得自己找——走过一次的门才认得' : R.puzzle === '巡逻' ? '前面有人巡逻，得自己摸过去' : `前面是${R.puzzle}，得自己走`;
      if (!R.path.length) return qtoast(msg);
      WALK = { path: R.path, i: 0, onArrive: () => qtoast(msg) }; return wStepLoop();
    }
    WTAP = { x: R.x, y: R.y, t: 0 };
    let done = null;
    if (!R.door) {
      if (p.area) done = () => { WGOAL = null; qtoast('就是这一带了，四处找找'); wStartAuto(p.zone || wmap(ch).zoneAt(wstate(ch).pos.x, wstate(ch).pos.y).id); };
      else { const act = wInteract(ch, p.x, p.y); done = () => { WGOAL = null; if (act) act(); }; }
    }
    if (R.near) {
      if (!R.path.length) { if (p.area && !R.door) return done(); WGOAL = null; return qtoast(R.fence ? '路被栅栏挡住了——附近有机关，踩上去试试' : '这条路还没探出来，试试「自动探索」'); }
      qtoast(R.plate ? '路被栅栏挡住了——去踩那块机关试试' : R.fence ? '路被栅栏挡住了——附近有机关，踩上去试试' : '前面的路还没探过，先往那个方向走');
      WALK = { path: R.path, i: 0, onArrive: p.area && !R.door ? done : () => { if (WGOAL) setTimeout(() => ACT.wgo(id, null, true), 200); } }; return wStepLoop();
    }
    if (!R.path.length) { if (done) return done(); WGOAL = null; return; }
    WALK = { path: R.path, i: 0, onArrive: done }; wStepLoop();
  },
  wtrk: () => { WTRK = !WTRK; render(); },
  bpot: () => { if (!B || B.over) return; const o = { pops: [], lines: [] }; if (!drinkPotion(B, o)) return toast(SAVE.run.potions <= 0 ? '丹药吃完了' : '气血是满的，不用吃'); SFX.play('heal'); applyStep(o, true); save(); },
  bhgo: id => { BACK = null; closeModal(); WTRK = true; render(); ACT.wgo(id); },
  shoptab: k => { SHOPTAB = k; SHOPMSG = ''; SHOPSEL = -1; openModal(shopModal); },
  shopsel: i => { SHOPSEL = SHOPSEL === +i ? -1 : +i; openModal(shopModal); },
  shopbuy: i => { const r = wShopBuy(wch(), SHOPID, +i, SAVE.run); SHOPMSG = r.err ? `<span class="bad">${esc(r.err)}</span>` : esc(r.ok); SFX.play(r.err ? 'fail' : r.item && (r.item.rarity === 'legend' || r.item.rarity === 'set') ? 'legend' : 'coin'); save();
    if (r.acts && r.acts.length) { closeModal(); wRun(r.acts); } else openModal(shopModal); },
  shopsell: id => { const r = wShopSell(wch(), SHOPID, id); SHOPMSG = r.err ? `<span class="bad">${esc(r.err)}</span>` : esc(r.ok); SFX.play(r.err ? 'fail' : 'coin'); save(); openModal(shopModal); },
  shoproll: id => { const r = wShopReroll(wch(), SHOPID, id); SHOPMSG = r.err ? `<span class="bad">${esc(r.err)}</span>` : esc(r.ok); SFX.play(r.err ? 'fail' : 'magic'); save(); openModal(shopModal); },
  eat: id => { const F = wEat(SAVE.run, id); closeModal(); if (F) { SFX.play('buff'); qtoast(`吃了「${esc(F.n)}」：${esc(F.d)}（管到下次休息）`); } save(); refresh(); },
  wtalkc: () => { const ch = wch(), cc = wCompNow(ch); if (!cc) return; wStopAuto(); wRun(wTalk(ch, cc, SAVE.run)); },
  wyin: () => { WALK = null; wStopAuto(); wRun(wYinToggle(wch())); },
  wauto: () => { WGOAL = null; if (WAUTO) return wStopAuto(); wStartAuto(); },
  rquit: () => { wStopAuto(); openModal(() => `<h2 class="mh">离开幻境？</h2><p class="help-p">这一局就到这儿：已经拿到的装备、经验都留着，但没有灵玉升级，也不算纪录。</p>
    <div class="row" style="justify-content:center"><button class="btn" data-act="rquitgo">离开</button><button class="btn ghost" data-act="close">接着打</button></div>`); },
  rquitgo: () => { const r = SAVE.run; BACK = null; closeModal(); WALK = null; finishRunView(r, 'retreat'); },
  wlog: () => { wStopAuto(); BACK = null; openModal(questModal()); },
  wrecap: () => { const ch = wch(); closeModal(); playDialog(recapLines(ch), null); },
  wreplay: i => { const ch = wch(), m = WQ[ch].main[+i]; if (!m) return; const L = [...(wLines(ch, m.lines) || []), ...(wLines(ch, m.after) || [])]; closeModal(); if (L.length) playDialog([['narr', `【回看 · ${m.t}】`], ...L], null); },
  wmini: () => { wStopAuto(); BACK = null; openModal(miniModal()); drawMini(); },
  maptab: k => { MAPTAB = k; if (MODALFN) { sheet.innerHTML = MODALFN(); drawMini(); } },
  mapgo: sc => {
    const ch = wch(), S = wstate(ch), blk = wTeleBlock(ch); if (blk) return toast(blk);
    const L = wLitCamps(ch, sc); if (!L.length) return toast('那边还没点过篝火');
    const id = L.includes(S.camp) ? S.camp : L[0]; if (!S.camps.includes(id)) S.camps.push(id);
    clearTimeout(WALK && WALK.h); WALK = null; wStopAuto(); ACT.wtele(id);
  },
  wrest: () => { const ch = wch(), acts = wRest(ch, SAVE.run); save(); SFX.play('heal'); closeModal(); render(); qtoast('歇了一会儿。气血和丹药都补满了，附近的妖物也回来了'); if (acts.length) wRun(acts); },
  wtele: id => { wTele(wch(), id); WHERO = null; WGOAL = null; closeModal(); render(); SFX.play('door'); banner(WMAPS[wch()].scenes[wstate(wch()).sc].n, wCampName(wch(), id), 1100); },
  dgo: () => { const d = DOSS; DOSS = null; if (d) d.go(); },
  dback: () => { const d = DOSS; DOSS = null; if (d) d.back(); else closeModal(); },
  wmenu: () => { closeModal(); WGOAL = null; wStopAuto(); VIEW = 'town'; TT = 'go'; save(); render(); window.scrollTo(0, 0); },
  wcomp: c => { SAVE.comp = c; save(); refresh(); qtoast(`这次带 ${COMPANIONS[c].n} 同行`); },
  lang: (arg) => { if (arg === (window.LANG || 'zh')) return; save(); try { localStorage.setItem('abyss_lang', arg); } catch (e) {} location.reload(); },
  fs: () => { const o = [0.9, 1, 1.15, 1.3]; SAVE.fs = o[(o.indexOf(SAVE.fs || 1) + 1) % o.length]; applyFs(); save(); refresh(); },
  guide: () => { SAVE.guide = SAVE.guide === 'full' ? 'clue' : 'full'; save(); refresh(); toast(SAVE.guide === 'full' ? '任务指引：详细（直接标出目标位置）' : '任务指引：线索（只告诉大概在哪一带）'); },
  joy: () => { SAVE.joy = !SAVE.joy; save(); render(); },
  gfxq: () => { SAVE.gfx = ((SAVE.gfx != null ? SAVE.gfx : 2) + 1) % 3; save(); refresh(); },
  cine: () => { SAVE.cineOff = !SAVE.cineOff; save(); refresh(); },
  hdpx: () => { SAVE.hdOff = !SAVE.hdOff; save(); render(); },
  comp: c => { SAVE.comp = c; save(); refresh(); toast(`这次带 ${COMPANIONS[c].n} 一起去：${COMPANIONS[c].d}`); },
  speed: s => { SAVE.speed = +s; VFX.setSpeed(+s); save(); document.querySelectorAll('#bctl [data-act=speed]').forEach(b => b.classList.toggle('ghost', b.dataset.arg !== s)); schedule(); },
  skip: () => skipBattle(),
  bcont: () => battleContinue(),
  choice: i => { EVRES = resolveEvent(SAVE.run, curCell(SAVE.run).ev, +i); if (!EVRES.fight) clearCell(SAVE.run); SFX.play(EVRES.items && EVRES.items.length ? 'loot' : 'magic'); refresh(); },
  evcont: () => { const run = SAVE.run;
    if (run.world) { if (EVRES && EVRES.fight) { const z = wmap(run.chapter).zoneAt(wstate(run.chapter).pos.x, wstate(run.chapter).pos.y); const r = WKEY && WKEY.rest; WKEY = { key: {}, rest: r || [] }; return beginWorldBattle({ kind: EVRES.fight === 'elite' ? 'elite' : 'battle', mon: RNG.pick(z.mons.length ? z.mons : [0]), lv: z.lv, first: 'p' }); } return wBack(); }
    if (EVRES && EVRES.fight) return beginBattle(EVRES.fight); VIEW = 'map'; refresh(); },
  buy: i => {
    const x = curCell(SAVE.run).shop.items[+i];
    if (x.sold || SAVE.gold < x.price) return;
    SAVE.gold -= x.price; x.sold = true; storeItem(SAVE.run, x.it); SFX.play('coin'); toast('买下了 ' + x.it.name); closeModal(); refresh();
  },
  buygem: () => { const g = curCell(SAVE.run).shop.gem; if (g.sold || SAVE.gold < g.price) return; SAVE.gold -= g.price; g.sold = true; addGem(g.key); SFX.play('rare'); refresh(); },
  potion: () => { const sh = curCell(SAVE.run).shop; if (!sh.potion || SAVE.gold < sh.potion) return; SAVE.gold -= sh.potion; SAVE.run.potions++; SFX.play('coin'); refresh(); },
  leave: () => { if (SAVE.run && SAVE.run.world) return wBack(); VIEW = 'map'; refresh(); },
  rest: k => { if (k === 'heal') EV.heal(SAVE.run, 0.45); else EV.buff(SAVE.run, 'dmgPct', 10); clearCell(SAVE.run); SFX.play(k === 'heal' ? 'heal' : 'forge'); toast(k === 'heal' ? '恢复了 45% 气血' : '本局伤害 +10%'); VIEW = 'map'; refresh(); },
  snd: () => { SAVE.sound = !SAVE.sound; SFX.set(SAVE.sound, SAVE.music); refresh(); },
  mus: () => { SAVE.music = !SAVE.music; SFX.set(SAVE.sound, SAVE.music); refresh(); },
  mtest: k => {
    const M = k === 'boss' ? { key: 'c1', kind: 'field', fight: 'boss' } : k === 'battle' ? { key: 'c1', kind: 'field', fight: 'battle' } : k === 'town' || k === 'sad' ? { key: k } : /^c\d+$/.test(k) ? { key: k, kind: 'field' } : null;
    if (!M) { MTEST = null; SFX.audition(curMood()); return refresh(); }
    if (!SAVE.music) { SAVE.music = true; save(); toast('已把背景音乐打开'); }
    SFX.ensure(); SFX.set(SAVE.sound, true); MTEST = { id: k, m: M }; SFX.audition(M); refresh();
  },
  export: async () => {
    markBackup(); persist(true); const code = ZCODE || exportSave();
    const done = () => { toast(`存档码已复制（${code.length} 个字符），找个地方粘贴存好`); const m = document.querySelector('.bk-now small'); if (m) m.textContent = `上次备份：${fmtDay(SAVE.bk.t)}`; document.querySelectorAll('.bk-nudge').forEach(x => x.remove()); };
    try { await navigator.clipboard.writeText(code); done(); }
    catch (e) { const t = $('#imp'); if (!t) return ACT.tsave(), setTimeout(ACT.export, 50);
      t.value = code; t.focus(); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      if (ok) done(); else toast('没法自动复制：存档码已放进下面的输入框，请长按全选后手动复制'); }
  },
  bkfile: async () => {
    markBackup(); persist(true); const code = ZCODE || exportSave(), b = saveBrief(SAVE), d = new Date(), z = n => String(n).padStart(2, '0');
    const name = `jiuyou-save-${b.cls}-lv${b.lv}-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}.txt`;
    try { const file = new File([code], name, { type: 'text/plain' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: '九幽回廊存档' }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      toast('存档文件已生成。要是没有弹出保存或分享，请改用「复制存档码」');
    } catch (e) { toast('这个浏览器没法保存文件，请改用「复制存档码」'); }
  },
  bkpick: () => { const f = $('#bkf'); if (!f) return; f.onchange = () => { const file = f.files && f.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => tryImport(String(rd.result || '')); rd.onerror = () => toast('文件读不出来'); rd.readAsText(file); f.value = ''; }; f.click(); },
  import: () => { const v = ($('#imp') || {}).value || ''; if (!v.trim()) return toast('先把存档码粘贴到输入框里'); tryImport(v); },
  imcancel: () => { IMPORTING = null; closeModal(); },
  doimport: () => { if (!IMPORTING) return; clearOverlays(); SAVE = IMPORTING; IMPORTING = null; persist(true); toast('已恢复，正在重新载入……'); setTimeout(() => location.reload(), 500); },
  bknudge: () => { ACT.tsave(); },
  tcls: c => { TCLS = c; refresh(); },
  home: () => { stopAuto(); closeModal(); VIEW = 'title'; render(); window.scrollTo(0, 0); },
  tcont: () => { closeModal(); if (SAVE.run) return ACT.resume(); VIEW = 'town'; TT = 'go'; render(); window.scrollTo(0, 0); playPrologue(); },
  tnew: () => openModal(resetModal()),
  ttest: () => openModal(() => `${testPanel()}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-act="close">关闭</button></div>`),
  tsave: () => openModal(() => `${setSave()}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-act="close">关闭</button></div>`),
  tset: () => openModal(() => `${setBasic()}${testFold()}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-act="close">关闭</button></div>`),
  tstart: c => {
    const ch = parseInt(c, 10), inter = /i$/.test(c), cls = TCLS || SAVE.cls;
    if (!SAVE.test) { const raw = JSON.stringify(SAVE); TEST_BAK = raw; try { localStorage.setItem(TEST_BACKUP_KEY, raw); } catch (e) {} }
    stopAuto(); clearTimeout(timer); clearOverlays();
    SAVE = makeTestSave(cls, ch, inter); ensureBounties(); persist(); BACK = null; closeModal(); VIEW = 'town'; TT = 'go';
    render(); toast(`试玩角色：${CLASSES[cls].n} ${SAVE.chars[cls].level} 级，从第 ${ch} 章${inter ? '的幕间' : ''}开始`);
    setTimeout(() => ACT.start(), 300);
  },
  trestore: () => {
    const raw = testBackup() || TEST_BAK; if (!raw) return toast('没有找到备份的存档');
    clearOverlays();
    try { SAVE = migrate(JSON.parse(raw)); } catch (e) { return toast('备份的存档读不出来'); }
    try { localStorage.removeItem(TEST_BACKUP_KEY); } catch (e) {} TEST_BAK = null;
    persist(); BACK = null; closeModal(); VIEW = 'town'; TT = 'set'; render(); toast('已回到你自己的存档');
  },
  reset: () => openModal(resetModal()),
  doreset: () => { clearOverlays(); SAVE = newSave(); ensureBounties(); persist(); BACK = null; closeModal(); VIEW = 'town'; TT = 'go'; render(); toast('已重新开始'); playPrologue(); },
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
  app.innerHTML = html;
  document.body.dataset.view = VIEW;
  if (VIEW === 'battle') { VFX.setup($('#arena'), SAVE.speed); if (typeof GFX !== 'undefined' && SAVE.run) { const T0 = SAVE.run.world && SCENE_THEMES[SAVE.run.sth || SAVE.run.theme]; GFX.ambient((T0 || terrainOf(SAVE.run) || {}).wx); } applyStep(null); showRes(); } else VFX.setup(null);
  if (VIEW === 'world') wSetup();
  try { SFX.mood(curMood()); } catch (e) {}
  if (VIEW === 'map' && AUTO && !WALKING) { clearTimeout(autoT); autoT = setTimeout(autoStep, 420); }
  if (VIEW !== 'map') WALKING = false;
}
VIEW = 'title';
render();
initCloud();
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}   // 请浏览器别在空间紧张时自动清掉存档
if (SAVE.gearNote) { delete SAVE.gearNote; persist(); setTimeout(() => openModal(() => `<h2 class="mh">装备词条改了规矩</h2>
  <p class="help-p">之前暴击、暴伤、伤害、术法这些百分比词条跟着装备等级越涨越大，七件叠起来，后面的首领几下就没了。现在改成这样：</p>
  <p class="help-p">一、百分比词条的幅度固定，不再随等级涨；后期变强靠攻击、气血、护甲这些实数。</p>
  <p class="help-p">二、每种词条只出在固定的几个部位：攻击类出在兵器、护腕、扳指、玉佩上，防御类主要出在头冠、衣甲、鞋履上。一件装备最多两条攻击类词条。</p>
  <p class="help-p">三、宝品的兵器、护腕、扳指、玉佩一定带两条攻击类词条；词条的下限也提高了，不容易出废件。</p>
  <p class="help-p">四、强化只加实数属性。</p>
  <p class="help-p">你手上的旧装备已经按新规矩换算过：百分比缩回去了，不合规的词条按原来的成色换成了攻击、气血或护甲。妖物也相应调弱了——装备普通的话，难度和原来一样；昆仑冰窟和幽冥鬼市的守关比原来硬一些。</p>
  <div class="row" style="justify-content:center"><button class="btn" data-act="close">知道了</button></div>`), 900); }
if (SAVE.respec4) { delete SAVE.respec4; persist(); setTimeout(() => toast('五个职业重做了：心法点已经全部退回，招式也重新装配。去「修炼」看看新的心法和招式，赶尸人记得排一下「尸阵」'), 1200); }
window.__abyss = { get SAVE() { return SAVE; }, get B() { return B; }, pause: () => clearTimeout(timer), mini: (id, f) => playMini(id, f), get WHERO() { return WHERO; }, get WGOAL() { return WGOAL; }, get WAUTO() { return WAUTO; }, ACT, fightw: e => beginWorldBattle(e), wbusy: () => !!WALK, maxhp: () => runStats(SAVE.run).maxHp, wtr: () => { const ch = SAVE.run && SAVE.run.world && SAVE.run.chapter; if (!ch) return []; return wTracker(ch).map(q => ({ t: q.t, town: wMarkPos(ch, q.mark) === 'town' })); }, fight: k => beginBattle(k), get WALKING() { return WALKING; }, get B() { return B; }, get VIEW() { return VIEW; }, get DLG() { return DLG; }, endDlg, wRun: a => wRun(a), dbg: { dlg: l => playDialog(l, null, null), render: () => render(), save: () => save(), view: v => { VIEW = v; }, finish: (r, o) => finishRunView(r, o) } };
}
