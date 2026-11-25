// ============ 九幽回廊 · 游戏内容数据（中式暗黑） ============

const SLOTS = [
  { id: 'weapon', n: '兵器', s: '兵' },
  { id: 'helm',   n: '头冠', s: '冠' },
  { id: 'chest',  n: '衣甲', s: '甲' },
  { id: 'gloves', n: '护腕', s: '腕' },
  { id: 'boots',  n: '鞋履', s: '履' },
  { id: 'ring',   n: '扳指', s: '戒' },
  { id: 'amulet', n: '玉佩', s: '佩' },
  // 通关后随幻境最高纪录逐个开的位置（rift：要打到第几层）。ring2 没有自己的装备，戴的是第二枚扳指
  { id: 'belt',    n: '腰带', s: '带', rift: 10 },
  { id: 'offhand', n: '副手', s: '副', rift: 20 },
  { id: 'ring2',   n: '扳指·二', s: '戒', rift: 30, type: 'ring' },
];
const SLOT_IDS = SLOTS.filter(s => !s.rift).map(s => s.id);   // 剧情里就有的七个位置（也是会掉的七种装备）
const POS_IDS = SLOTS.map(s => s.id);                         // 身上所有的位置
const X_ITEM_SLOTS = SLOTS.filter(s => s.rift && !s.type).map(s => s.id);   // 通关后新增的装备种类：腰带、副手
const slotType = pos => (SLOTS.find(s => s.id === pos) || {}).type || pos;
const OFFHAND_BASE = { berserker: '刀鞘', mage: '符匣', necro: '引魂铃', assassin: '镖囊', paladin: '木鱼' };
const SLOT_NAME = Object.fromEntries(SLOTS.map(s => [s.id, s.n]));
const MAX_SOCKETS = { weapon: 3, helm: 2, chest: 3, gloves: 1, boots: 1, ring: 1, amulet: 1, belt: 1, offhand: 1 };

const RARITY = {
  normal: { n: '凡品', aff: [0, 0] },
  magic:  { n: '灵品', aff: [1, 2] },
  rare:   { n: '宝品', aff: [3, 4] },
  set:    { n: '套装', aff: [2, 2] },
  legend: { n: '神兵', aff: [2, 3] },
};
const RARITY_ORDER = ['normal', 'magic', 'rare', 'set', 'legend'];

const STAT_NAMES = {
  atk: '攻击', hp: '气血', armor: '护甲', crit: '暴击率', critDmg: '暴击伤害',
  spd: '速度', leech: '吸血', res: '全抗', dmgPct: '伤害', elem: '术法伤害',
  hpPct: '最大气血', armorPct: '护甲', atkPct: '攻击', thornK: '反震倍率', thornDmg: '反震伤害', lowHpK: '残血增伤', regen: '每回合回复气血', thorns: '反震伤害',
  mf: '福缘', gf: '银两获取', freeze: '定身几率', minion: '僵尸数量上限',
  dodge: '闪避', poison: '攻击附带中毒', minionPct: '僵尸强度', healPct: '治疗效果', eva: '闪避', skd: '某一招伤害',
  xFirst: '先手（开战读条）', xBoss: '对首领、精英的伤害', xExec: '斩杀（对残血敌人伤害）', xBreak: '破势（对蓄力中的敌人伤害）',
  // 稀有词条（只能洗炼出）和灵玉用到的
  xDouble: '连斩（出手后再补一击的几率）', xRage: '秘技怒气获取', xTen: '清神（抵抗眩晕、定身）', xDr: '受到的伤害减少', xLast: '不屈（气血低于 30% 时减伤）',
  xHaste: '疾行（开战前两回合速度）', xKill: '贪狼（每杀一个敌人回复气血）', cdSkip: '招式不进冷却的几率', xLuck: '神兵掉率', xShield: '磐石（开战自带护体，按最大气血）',
  regenPct: '每回合回复气血', xCritNext: '会心（暴击后下一招伤害）', allyPct: '同伴、僵尸的伤害和气血',
};
const PCT_STATS = new Set(['thorns', 'eva', 'skd', 'crit', 'critDmg', 'leech', 'res', 'dmgPct', 'elem', 'hpPct', 'armorPct', 'atkPct', 'thornK', 'thornDmg', 'lowHpK', 'mf', 'gf', 'freeze', 'dodge', 'poison', 'minionPct', 'healPct', 'xBoss', 'xExec', 'xBreak',
  'xDouble', 'xRage', 'xTen', 'xDr', 'xLast', 'xHaste', 'xKill', 'cdSkip', 'xLuck', 'xShield', 'regenPct', 'xCritNext', 'allyPct']);

const BASES = {
  weapon: [['柴刀', 1], ['铁剑', 1], ['青锋剑', 8], ['九环刀', 16], ['玄铁重剑', 26], ['斩妖剑', 40]],
  helm:   [['布巾', 1], ['斗笠', 8], ['铁盔', 18], ['束发金冠', 30], ['鬼面', 42]],
  chest:  [['布衣', 1], ['皮甲', 8], ['锁子甲', 18], ['鱼鳞甲', 30], ['明光铠', 42]],
  gloves: [['布护腕', 1], ['铁护腕', 10], ['虎爪', 24], ['龙鳞护腕', 40]],
  boots:  [['草鞋', 1], ['布靴', 10], ['铁履', 24], ['踏云靴', 40]],
  ring:   [['扳指', 1]],
  amulet: [['玉佩', 1]],
  belt:   [['布带', 1], ['皮带', 12], ['铜扣带', 26], ['蟒纹带', 40]],
  offhand: [['旧', 1], ['铜', 14], ['玄铁', 28], ['紫金', 42]],   // 副手：前缀 + 本门的物件（刀鞘、符匣、引魂铃、镖囊、木鱼）
};
// 2026-11 词条重做：
//   ① 百分比词条（暴击、暴伤、伤害、术法、吸血、全抗、最大气血、速度……）的幅度不再跟着装备等级涨，第一章是多少，第十章还是多少；
//      后期的成长靠攻击、气血、护甲这些实数词条（flat）和装备本身的主属性。
//   ② 每种百分比词条只出在三个部位（slots），攻击词条只出在兵器、护腕、扳指、玉佩上；一件装备最多两条攻击类词条。
//      七件全堆同一种的路子堵上了：看到多少就是多少，没有暗地里的递减。
//   ③ 词条的下限提高（比如攻击 2–5 改成 3–5），普通装备和极品装备的差距收窄。
const AFFIXES = [
  // g：'o' 攻击类（一件装备最多两条）、'd' 防御类；ro：改之前的幅度，旧存档换算用
  { k: 'atk',     r: [3, 5],   ro: [2, 5],   flat: true, w: 12, g: 'o', p: '锋锐的', slots: ['weapon', 'gloves', 'ring', 'amulet', 'offhand'] },
  { k: 'hp',      r: [12, 20], ro: [8, 20],  flat: true, w: 12, g: 'd', p: '强健的', slots: ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet', 'belt'] },
  { k: 'armor',   r: [6, 10],  ro: [4, 10],  flat: true, w: 10, g: 'd', p: '坚实的', slots: ['helm', 'chest', 'gloves', 'boots', 'belt'] },
  { k: 'crit',    r: [3, 6],   ro: [2, 6],   w: 7, g: 'o', p: '致命的', slots: ['gloves', 'ring', 'amulet', 'offhand'] },
  { k: 'critDmg', r: [15, 28], ro: [10, 28], w: 7, g: 'o', p: '狠辣的', slots: ['weapon', 'ring', 'amulet', 'offhand'] },
  { k: 'spd',     r: [4, 8],   ro: [3, 8],   w: 9, g: 'o', p: '迅捷的', slots: ['boots', 'gloves', 'amulet', 'offhand'] },
  { k: 'leech',   r: [2, 3],   ro: [1, 3],   w: 5, g: 'o', p: '嗜血的', slots: ['weapon', 'helm', 'gloves'] },
  { k: 'res',     r: [6, 10],  ro: [4, 10],  w: 7, g: 'd', p: '辟邪的', slots: ['helm', 'chest', 'boots', 'belt'] },
  { k: 'dmgPct',  r: [8, 14],  ro: [5, 14],  w: 8, g: 'o', p: '狂暴的', slots: ['weapon', 'gloves', 'ring', 'offhand'] },
  { k: 'elem',    r: [10, 18], ro: [6, 18],  w: 5, g: 'o', p: '通灵的', slots: ['weapon', 'helm', 'amulet', 'offhand'] },
  { k: 'hpPct',   r: [6, 10],  ro: [4, 10],  w: 6, g: 'd', p: '养元的', slots: ['helm', 'chest', 'amulet', 'belt'] },
  { k: 'regen',   r: [2, 3],   ro: [1, 3],   flat: true, w: 5, g: 'd', p: '回春的', no: ['offhand'] },
  { k: 'thorns',  r: [5, 10], w: 4, g: 'd', st: 'thornDmg', p: '带刺的', no: ['offhand'] },   // 2026-11-24 再改：「反震伤害 +5–10%」，最后乘上去（反震、金刚震都吃），不会被罗汉套、金身玉的大底子稀释。老装备的「反震倍率 +10–20%」按成色对半折过来
  { k: 'mf',      r: [8, 20],  w: 4, p: '有福的' },
  { k: 'gf',      r: [10, 30], w: 4, p: '招财的' },
  // 2026-11 新加：pg＝通关后才会随掉落出（洗炼随时都能洗到）；st：算到哪个属性上
  { k: 'armorPct', r: [6, 12], w: 5, g: 'd', pg: 1, p: '铁壁的', slots: ['helm', 'chest', 'boots', 'belt'] },
  { k: 'healPct', r: [8, 15],  w: 4, g: 'd', pg: 1, p: '妙手的', slots: ['helm', 'amulet', 'offhand'] },
  { k: 'eva',     r: [2, 4],   w: 4, g: 'd', pg: 1, st: 'dodge', p: '灵动的', slots: ['boots', 'gloves', 'helm'] },
  { k: 'freeze',  r: [2, 4],   w: 4, pg: 1, p: '凝霜的', slots: ['weapon', 'gloves'] },
  { k: 'poison',  r: [10, 18], w: 4, pg: 1, p: '淬毒的', slots: ['weapon', 'ring'] },
  { k: 'skd',     r: [8, 15],  w: 5, pg: 1, p: '精专的', slots: ['weapon', 'gloves', 'ring', 'amulet'] },   // 某一招伤害：洗出来时按这件装备的职业随机挑一招，存成 sk_<招式>
  // 特殊词条：只从悬赏、鬼市这些地方来，不会随机掉
  // 2026-11：也是各部位的稀有词条——洗炼时每条有 WASH_RARE 的几率洗出来（rs：出在哪个部位）
  { k: 'xFirst',  r: [20, 40], w: 0, sp: true, fixed: true, p: '先发的', rs: 'gloves' },
  { k: 'xBoss',   r: [8, 18],  w: 0, sp: true, fixed: true, p: '屠魁的', rs: 'weapon' },
  { k: 'xExec',   r: [15, 30], w: 0, sp: true, fixed: true, p: '断命的', rs: 'ring' },
  { k: 'xBreak',  r: [20, 40], w: 0, sp: true, fixed: true, p: '破势的', rs: 'gloves' },
  { k: 'xDouble', r: [6, 10],  w: 0, sp: true, fixed: true, p: '连斩的', rs: 'weapon' },
  { k: 'xRage',   r: [15, 25], w: 0, sp: true, fixed: true, p: '明心的', rs: 'helm' },
  { k: 'xTen',    r: [30, 50], w: 0, sp: true, fixed: true, p: '清神的', rs: 'helm' },
  { k: 'xDr',     r: [4, 7],   w: 0, sp: true, fixed: true, p: '金刚的', rs: 'chest' },
  { k: 'xLast',   r: [12, 20], w: 0, sp: true, fixed: true, p: '不屈的', rs: 'chest' },
  { k: 'dodge',   r: [4, 7],   w: 0, sp: true, fixed: true, p: '踏风的', rs: 'boots' },
  { k: 'xHaste',  r: [20, 35], w: 0, sp: true, fixed: true, p: '疾行的', rs: 'boots' },
  { k: 'xKill',   r: [2, 4],   w: 0, sp: true, fixed: true, p: '贪狼的', rs: 'ring' },
  { k: 'cdSkip',  r: [4, 7],   w: 0, sp: true, fixed: true, p: '聚灵的', rs: 'amulet' },
  { k: 'xLuck',   r: [10, 20], w: 0, sp: true, fixed: true, p: '福星的', rs: 'amulet' },
  { k: 'xShield', r: [8, 14],  w: 0, sp: true, fixed: true, p: '磐石的', rs: 'belt' },
  { k: 'regenPct', r: [1, 2],  w: 0, sp: true, fixed: true, p: '回元的', rs: 'belt' },
  { k: 'xCritNext', r: [10, 18], w: 0, sp: true, fixed: true, p: '会心的', rs: 'offhand' },
  { k: 'allyPct', r: [8, 14],  w: 0, sp: true, fixed: true, p: '同调的', rs: 'offhand' },
];
const WASH_RARE = 0.01;   // 洗炼：每条被洗的词条变成本部位稀有词条的几率
const SP_AFFIXES = AFFIXES.filter(a => a.sp).map(a => a.k);
const RARE_NAME_A = ['玄冥', '赤血', '太乙', '九幽', '无相', '青冥', '紫电', '寒霜', '修罗', '阴阳', '乾坤', '噬魂'];
const RARE_NAME_B = { weapon: ['刃', '锋', '斩'], helm: ['冠', '盔', '面'], chest: ['甲', '袍', '铠'],
  gloves: ['爪', '腕', '握'], boots: ['履', '步', '靴'], ring: ['戒', '环', '印'], amulet: ['佩', '珏', '符'], belt: ['带', '绦', '束'] };

const LEGENDS = [
  { id: 'butcher',  n: '断魂斩马刀', slot: 'weapon', ch: 4, imp: { critDmg: 40 }, fx: 'execute',    d: '对气血低于 30% 的敌人伤害 +60%' },
  { id: 'storm',    n: '紫电青霜',   slot: 'weapon', ch: 7, imp: { spd: 10 },     fx: 'chain',      d: '攻击有 20% 几率引来天雷，对所有敌人造成 50% 伤害' },
  { id: 'reaper',   n: '饮血刀',     slot: 'weapon', ch: 5, imp: { leech: 4 },    fx: 'cleave',     d: '单体攻击会波及其他所有敌人，造成 35% 伤害' },
  { id: 'glacier',  n: '寒魄玄铁剑', slot: 'weapon', ch: 6, imp: { elem: 15 },    fx: 'frostbite',  d: '攻击有 15% 几率定身目标' },
  { id: 'seer',     n: '天机冠',     slot: 'helm', ch: 2,   imp: { crit: 6 },     fx: 'firstStrike', d: '每场战斗开始时抢先出手' },
  { id: 'madman',   n: '狂僧面具',   slot: 'helm', ch: 4,   imp: { dmgPct: 10 },  fx: 'lowHpDmg',   d: '气血越低伤害越高，最多 +50%' },
  { id: 'champion', n: '霸王盔',     slot: 'helm', ch: 6,   imp: { dmgPct: 8 },   fx: 'bossDmg',    d: '对精英和首领伤害 +35%' },
  { id: 'warden',   n: '镇岳冠',     slot: 'helm', ch: 1,   imp: { hpPct: 8 },    fx: 'startShield', d: '战斗开始时获得 25% 最大气血的护体真气' },
  { id: 'undying',  n: '不灭金身甲', slot: 'chest', ch: 8,  imp: { hpPct: 12 },   fx: 'cheatDeath', d: '每场战斗一次：受到致命伤害时保住一口气并恢复 30%' },
  { id: 'throne',   n: '荆棘铠',     slot: 'chest', ch: 4,  imp: { thornK: 20 },  fx: 'thornsPct',  d: '反震倍率 +60%：每挨一下打，就按你攻击的 60% 弹回去' },
  { id: 'vampire',  n: '血蝠袍',     slot: 'chest', ch: 3,  imp: { leech: 3 },    fx: 'vampire',    d: '吸血效果翻倍' },
  { id: 'phoenix',  n: '凤羽霓裳',   slot: 'chest', ch: 9,  imp: { res: 12 },     fx: 'phoenix',    d: '每场战斗首次气血低于 30% 时浴火爆发，对所有敌人造成 300% 火焰伤害' },
  { id: 'looter',   n: '摸金手',     slot: 'gloves', ch: 1, imp: { gf: 50 },      fx: 'lootKill',   d: '击杀敌人时 12% 几率额外掉落一件装备' },
  { id: 'frenzy',   n: '疯魔护腕',   slot: 'gloves', ch: 3, imp: { spd: 6 },      fx: 'frenzy',     d: '每次攻击使本场速度 +4%，最多 +40%' },
  { id: 'alchemist',n: '炼丹手',     slot: 'gloves', ch: 1, imp: { regen: 5 },    fx: 'potionPlus', d: '丹药恢复量 +60%' },
  { id: 'ghost',    n: '踏雪无痕',   slot: 'boots', ch: 2,  imp: { spd: 8 },      fx: 'dodge',      d: '15% 几率闪避攻击' },
  { id: 'momentum', n: '神行靴',     slot: 'boots', ch: 5,  imp: { spd: 10 },     fx: 'momentum',   d: '每击杀一个敌人，本场速度 +15%' },
  { id: 'earth',    n: '镇山履',     slot: 'boots', ch: 3,  imp: { armorPct: 15 },fx: 'stoneSkin',  d: '受到的所有伤害 -12%' },
  { id: 'soul',     n: '摄魂扳指',   slot: 'ring', ch: 2,   imp: { leech: 3 },    fx: 'killHeal',   d: '击杀敌人恢复 10% 最大气血' },
  { id: 'twin',     n: '阴阳扳指',   slot: 'ring', ch: 8,   imp: { crit: 4 },     fx: 'doubleCast', d: '技能有 20% 几率连续施放两次' },
  { id: 'greed',    n: '聚宝扳指',   slot: 'ring', ch: 6,   imp: { gf: 40, mf: 25 }, fx: 'lucky',   d: '精英和首领额外掉落 1 件装备' },
  { id: 'surge',    n: '五行扳指',   slot: 'ring', ch: 7,   imp: { elem: 10 },    fx: 'elemSurge',  d: '术法伤害有 20% 几率翻倍' },
  { id: 'abyssEye', n: '九幽之眼',   slot: 'amulet', ch: 9, imp: { critDmg: 30 }, fx: 'critStack',  d: '每次暴击使本场伤害 +5%，最多 10 层' },
  { id: 'avenger',  n: '睚眦佩',     slot: 'amulet', ch: 5, imp: { armorPct: 15 },fx: 'revenge',    d: '受到攻击时 30% 几率立刻还手' },
  { id: 'hourglass',n: '光阴玉',     slot: 'amulet', ch: 10, imp: { spd: 5 },      fx: 'cdr',        d: '所有技能冷却 -1' },
  { id: 'deadcharm',n: '养尸玉',     slot: 'amulet', ch: 7, imp: { hpPct: 6 },    fx: 'undeadAlly', d: '每场战斗开始时唤出一具僵尸助战（所有职业）' },
  // ---------- 通关后的通用神兵（pg：通关后才进掉落池）：不求强，求有意思。攻、守、辅、刷宝都有 ----------
  { id: 'liubo',    n: '六博刀',   slot: 'weapon', pg: 1, imp: { crit: 5 },      fx: 'gDice',    d: '每场战斗开始时掷一次骰子，随机得一样：伤害 +25%、速度 +25%、暴击 +20%、受到的伤害 -20%' },
  { id: 'jincuo',   n: '金错刀',   slot: 'weapon', pg: 1, imp: { gf: 40 },       fx: 'gGold',    d: '身上每有 10 万两银子，伤害 +3%，最多 +30%' },
  { id: 'zuixian',  n: '醉仙巾',   slot: 'helm',   pg: 1, imp: { hpPct: 8 },     fx: 'gDrunk',   d: '不能吃丹药；每回合恢复 4% 最大气血' },
  { id: 'zhaoyao',  n: '照妖冠',   slot: 'helm',   pg: 1, imp: { crit: 5 },      fx: 'gReveal',  d: '精英身上每有一个词缀，你对它的伤害 +10%' },
  { id: 'sheshen',  n: '舍身甲',   slot: 'chest',  pg: 1, imp: { crit: 6 },      fx: 'gGlass',   d: '最大气血 -20%，伤害 +20%' },
  { id: 'jingchan', n: '惊蝉衣',   slot: 'chest',  pg: 1, imp: { hpPct: 10 },    fx: 'gPanic',   d: '每场战斗首次气血低于 30% 时，震晕所有敌人一回合' },
  { id: 'huifeng',  n: '回风手',   slot: 'gloves', pg: 1, imp: { spd: 6 },       fx: 'gReset',   d: '暴击时有 10% 几率让一招正在冷却的招式立刻转好' },
  { id: 'dianjin',  n: '点金手',   slot: 'gloves', pg: 1, imp: { gf: 60 },       fx: 'gMidas',   d: '击杀敌人时 25% 几率多掉一袋银两' },
  { id: 'suodi',    n: '缩地靴',   slot: 'boots',  pg: 1, imp: { spd: 8 },       fx: 'gBlink',   d: '每场战斗用出的第一招不进冷却' },
  { id: 'xiaoyao',  n: '逍遥履',   slot: 'boots',  pg: 1, imp: { spd: 6 },       fx: 'gEvade',   d: '闪避 +8%；闪避之后，下一招伤害 +50%' },
  { id: 'lunhui',   n: '轮回戒',   slot: 'ring',   pg: 1, imp: { mf: 20 },       fx: 'gRevive',  d: '精英倒下时有 20% 几率还魂再站起来（气血一半），再打倒一次照样掉东西' },
  { id: 'lianhuan', n: '连环戒',   slot: 'ring',   pg: 1, imp: { critDmg: 25 },  fx: 'gKillCrit', d: '击杀敌人后，下一招必定暴击' },
  { id: 'tongxin',  n: '同心锁',   slot: 'amulet', pg: 1, imp: { hpPct: 8 },     fx: 'gBond',    d: '每场战斗一次：你受到致命伤害时同伴替你挡下，你保住 20% 气血，同伴损失一半气血' },
  { id: 'liangyi',  n: '两仪佩',   slot: 'amulet', pg: 1, imp: { armorPct: 10 }, fx: 'gYinYang', d: '你的回合一阳一阴轮着来：阳回合伤害 +30%；阴回合到下次出手前，受到的伤害 -30%' },
  { id: 'guzhu',    n: '孤注带',   slot: 'belt',    pg: 1, x: 1, imp: { critDmg: 20 }, fx: 'gGamble', d: '你的每一击有 10% 几率伤害 ×3，也有 10% 几率打空' },
  { id: 'xuanhu',   n: '悬壶带',   slot: 'belt',    pg: 1, x: 1, imp: { hpPct: 8 },    fx: 'gGourd',  d: '吃丹药后 3 回合内伤害 +40%' },
  { id: 'shouzhuo', n: '守拙带',   slot: 'belt',    pg: 1, x: 1, imp: { armorPct: 12 }, fx: 'gRest',  d: '每场战斗你的前 2 回合，受到的伤害 -40%' },
  { id: 'suanpan',  n: '铁算盘',   slot: 'offhand', pg: 1, x: 1, imp: { gf: 40 },      fx: 'gFast',   d: '你出手 8 次以内打完一场，这一场多掉一件装备' },
  { id: 'yinhun',   n: '引魂灯',   slot: 'offhand', pg: 1, x: 1, imp: { elem: 10 },    fx: 'gLamp',   d: '开战时照住一个敌人，它受到的伤害 +25%；它倒下后换下一个' },
  { id: 'jujiang',  n: '聚将鼓',   slot: 'offhand', pg: 1, x: 1, imp: { hpPct: 8 },    fx: 'gDrum',   d: '开战时同伴和僵尸抢先出手；他们的伤害 +15%' },
  // ---------- 散件流：一对扳指。不穿套装、全身神兵也是一条路（两枚可以叠；数在 engine.js 的 SAN_DMG / SAN_DR） ----------
  { id: 'wuxiang',  n: '无相环',   slot: 'ring',   pg: 1, wt: 8, imp: { dmgPct: 6 },    fx: 'sanA',     d: '身上没有任何套装效果时：每穿一件神兵，伤害 +5%，受到的伤害 -1.5%（和无名戒叠加）' },
  { id: 'wuming',   n: '无名戒',   slot: 'ring',   pg: 1, wt: 8, imp: { hpPct: 8 },     fx: 'sanB',     d: '身上没有任何套装效果时：每穿一件神兵，伤害 +5%，受到的伤害 -1.5%（和无相环叠加）' },
  // ---------- 职业传奇：改变一个技能的打法（ch：主要掉落的章节） ----------
  { id: 'xuexuan',  n: '血旋风',     slot: 'weapon', cls: 'berserker', ch: 2, imp: { leech: 3 },   fx: 'whirl2',      d: '旋风刀连转两圈，每圈都按命中人数回血' },
  { id: 'lieyanjia',n: '烈焰战甲',   slot: 'chest',  cls: 'berserker', ch: 4, imp: { hpPct: 10 },  fx: 'lieyanAll',   d: '烈焰刀变成横扫（每个 80%），让所有敌人灼烧' },
  { id: 'pojunkui', n: '破军盔',     slot: 'helm',   cls: 'berserker', ch: 6, imp: { dmgPct: 10 }, fx: 'armorHunter', d: '对破甲的敌人，所有招式伤害 +40%' },
  { id: 'yinxuejie',n: '饮血戒',     slot: 'ring',   cls: 'berserker', ch: 8, imp: { leech: 4 },   fx: 'bloodPlus',   d: '饮血斩冷却 -2，回血量翻倍' },
  { id: 'hansuizhu',n: '寒髓珠',     slot: 'amulet', cls: 'mage',      ch: 2, imp: { elem: 12 },   fx: 'shatterBlast',d: '金光咒打碎冰冻（碎冰）时炸开，其他敌人受到这一击 60% 的伤害' },
  { id: 'sanmei',   n: '三昧真火袍', slot: 'chest',  cls: 'mage',      ch: 4, imp: { elem: 15 },   fx: 'burn2',       d: '你挂上的灼烧伤害翻倍' },
  { id: 'leiting',  n: '雷霆扳指',   slot: 'ring',   cls: 'mage',      ch: 6, imp: { crit: 5 },    fx: 'chainAll',    d: '掌心雷劈中所有敌人，不再限三个' },
  { id: 'yinbaozhu',n: '引爆珠',     slot: 'weapon', cls: 'mage',      ch: 8, imp: { elem: 20 },   fx: 'detPlus',     d: '引爆符冷却 -1，每种状态的加成从 +80% 变成 +230%' },
  { id: 'shiwangguan',n: '尸王冠',   slot: 'helm',   cls: 'necro',     ch: 2, imp: { minionPct: 20 }, fx: 'corpseBurst', d: '你的僵尸倒下时炸开，让所有敌人灼烧' },
  { id: 'baigufan', n: '白骨幡',     slot: 'weapon', cls: 'necro',     ch: 4, imp: { minionPct: 25 }, fx: 'minionArmor', d: '僵尸的攻击会让敌人破甲；僵尸上限 +1' },
  { id: 'shidudan', n: '尸毒丹',     slot: 'amulet', cls: 'necro',     ch: 6, imp: { elem: 12 },   fx: 'corpsePlague',d: '尸毒爆打中的敌人同时灼烧和中毒' },
  { id: 'hanshipao',n: '寒尸袍',     slot: 'chest',  cls: 'necro',     ch: 8, imp: { hpPct: 10 },  fx: 'stormStun',   d: '百鬼夜行有 35% 几率让敌人眩晕' },
  { id: 'qianzhen', n: '千针匣',     slot: 'gloves', cls: 'assassin',  ch: 2, imp: { crit: 5 },    fx: 'needle6',     d: '冰魄针一次发出六根' },
  { id: 'yingsha',  n: '影杀靴',     slot: 'boots',  cls: 'assassin',  ch: 4, imp: { spd: 10 },    fx: 'shadow3',     d: '无影步冷却 -2，之后三次攻击必定暴击' },
  { id: 'duoming',  n: '夺命刃',     slot: 'weapon', cls: 'assassin',  ch: 6, imp: { critDmg: 40 },fx: 'markSpread',  d: '被夺命印标记的敌人死去时，印记跳到下一个敌人' },
  { id: 'huoyannang',n: '火焰镖囊',  slot: 'ring',   cls: 'assassin',  ch: 8, imp: { dmgPct: 8 },  fx: 'fanBurn',     d: '漫天花雨让所有敌人灼烧' },
  { id: 'jingangchu',n: '金刚杵',    slot: 'weapon', cls: 'paladin',   ch: 2, imp: { dmgPct: 10 }, fx: 'hammerAll',   d: '降魔杵打所有敌人，并有 20% 几率眩晕' },
  { id: 'budongxiang',n: '不动明王像',slot: 'amulet', cls: 'paladin',  ch: 4, imp: { armorPct: 15 }, fx: 'budong2',   d: '不动明王的护体翻倍；护体还在时，受到的伤害 -20%' },
  { id: 'ganluping',n: '甘露瓶',     slot: 'ring',   cls: 'paladin',   ch: 6, imp: { healPct: 15 },fx: 'ganlu2',      d: '甘露回血翻倍，并清掉你身上的中毒和眩晕' },
  { id: 'fuhutao',  n: '伏虎拳套',   slot: 'gloves', cls: 'paladin',   ch: 8, imp: { crit: 5 },    fx: 'fuhu2',       d: '伏虎拳同时让敌人破甲和眩晕（30%）' },
  // 2026-11：腰带、副手上的神兵（通关后才掉）。每条幻境套装路线两件，点名招式；攻、防、辅都有
  { id: 'bawangdai',  n: '霸王带',   slot: 'belt',    cls: 'berserker', ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'bawangBelt',  d: '霸王卸甲打中后，下一招伤害 +50%' },
  { id: 'nutaoqiao',  n: '怒涛刀鞘', slot: 'offhand', cls: 'berserker', ch: 9, x: 1, imp: { dmgPct: 8 },  fx: 'nutao',       d: '怒意过半时每回合恢复 4% 最大气血；不退冷却 -2' },
  { id: 'xiuluodai',  n: '修罗带',   slot: 'belt',    cls: 'berserker', ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'xiuluoBelt',  d: '气血低于 30% 时，受到的伤害 -30%' },
  { id: 'liediqiao',  n: '裂地刀鞘', slot: 'offhand', cls: 'berserker', ch: 9, x: 1, imp: { crit: 5 },    fx: 'liediOff',    d: '裂地斩有 50% 几率眩晕；旋风刀每打中一个破甲的敌人，怒意 +5' },
  { id: 'wuxingtao',  n: '五行绦',   slot: 'belt',    cls: 'mage',      ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'wuxingBelt',  d: '「连」满 5 层时，每次出招让其余招式冷却 -1' },
  { id: 'taijixia',   n: '太极符匣', slot: 'offhand', cls: 'mage',      ch: 9, x: 1, imp: { elem: 12 },   fx: 'taijiOff',    d: '护身符箓上限 +20%；身上有符箓时，受到的术法伤害 -30%' },
  { id: 'baifudai',   n: '百符带',   slot: 'belt',    cls: 'mage',      ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'baifuBelt',   d: '你挂上的状态多持续 2 回合' },
  { id: 'zhenxiexia', n: '镇邪符匣', slot: 'offhand', cls: 'mage',      ch: 9, x: 1, imp: { elem: 12 },   fx: 'zhenxieOff',  d: '敌人身上每有一种状态，它对你造成的伤害 -8%' },
  { id: 'ganshisuo',  n: '赶尸索',   slot: 'belt',    cls: 'necro',     ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'ganshiBelt',  d: '僵尸倒下 3 回合后自己爬起来（每个尸位每场一次）' },
  { id: 'shehunling', n: '摄魂铃',   slot: 'offhand', cls: 'necro',     ch: 9, x: 1, imp: { minionPct: 15 }, fx: 'shehunOff', d: '摇铃·集火之后，僵尸有 30% 几率再各出手一次' },
  { id: 'baigunang',  n: '百蛊囊',   slot: 'belt',    cls: 'necro',     ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'baiguBelt',   d: '中毒层数上限再 +2（要配五毒独行 6 件：8 层 → 10 层）' },
  { id: 'caoren',     n: '替身草人', slot: 'offhand', cls: 'necro',     ch: 9, x: 1, imp: { elem: 12 },   fx: 'caorenOff',   d: '每场战斗一次：致命的一击由草人代受，你留 25% 气血，并让所有敌人中毒' },
  { id: 'cangfengdai', n: '藏锋带',  slot: 'belt',    cls: 'assassin',  ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'cangfengBelt', d: '开战自带 3 点杀意；终结技不会被闪开、不会落空' },
  { id: 'wuyingnang', n: '无影囊',   slot: 'offhand', cls: 'assassin',  ch: 9, x: 1, imp: { spd: 6 },     fx: 'wuyingOff',   d: '闪开一次攻击后恢复 4% 最大气血，冷却最长的那一招冷却 -1' },
  { id: 'qianjidai',  n: '千机带',   slot: 'belt',    cls: 'assassin',  ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'qianjiBelt',  d: '暗器招式（淬毒镖、冰魄针、漫天花雨）每打中 5 次，所有招式冷却 -1' },
  { id: 'baidunang',  n: '百毒镖囊', slot: 'offhand', cls: 'assassin',  ch: 9, x: 1, imp: { crit: 5 },    fx: 'baiduOff',    d: '中毒的敌人对你造成的伤害 -20%；带毒的敌人死去时，毒传给另一个敌人' },
  { id: 'fumodai',    n: '伏魔带',   slot: 'belt',    cls: 'paladin',   ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'fumoBelt',    d: '金刚震打中的敌人 30% 几率晕住；「佛怒」上限从 10 层提高到 15 层' },
  { id: 'muyu',       n: '镇心木鱼', slot: 'offhand', cls: 'paladin',   ch: 9, x: 1, imp: { healPct: 12 }, fx: 'muyuOff',    d: '每次挨打反震恢复 1.5% 最大气血，并给同伴恢复 4%' },
  { id: 'daridai',    n: '大日带',   slot: 'belt',    cls: 'paladin',   ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'dariBelt',    d: '护体真气的上限从最大气血的 50% 提高到 80%（要配大日如来 4 件）' },
  { id: 'zijinbo',    n: '紫金钵',   slot: 'offhand', cls: 'paladin',   ch: 9, x: 1, imp: { dmgPct: 8 },  fx: 'zijinOff',    d: '施放般若心经、甘露时，对所有敌人造成 150% 佛光伤害' },
  // 2026-11：专属兵器（w: 1）。每条幻境套装路线一把，直接改写主力招式；自带攻击比普通神兵高三成，每强化 +1 特效再涨 3%。
  // 不走普通掉落：攒「兵魄」找张大锤打，幻境妖王另有很小的几率直接掉
  { id: 'bawangdao',  n: '霸王刀',     slot: 'weapon', cls: 'berserker', ch: 9, w: 1, set: 'xuehai',  imp: { critDmg: 40 },  fx: 'wBawang',  d: '霸王卸甲伤害 +100%；用它打死敌人，吃掉的怒意全数返还' },
  { id: 'xiuluoren',  n: '修罗血刃',   slot: 'weapon', cls: 'berserker', ch: 9, w: 1, set: 'busi',    imp: { leech: 5 },     fx: 'wXiuluo',  d: '旋风刀、裂地斩之后追加一击，对所有敌人造成 60% 伤害；气血低于一半时吸血翻倍' },
  { id: 'taiyifuchen', n: '太乙拂尘',  slot: 'weapon', cls: 'mage',      ch: 9, w: 1, set: 'guiyuan', imp: { elem: 20 },     fx: 'wTaiyi',   d: '「连」的上限 +2 层；「连」满 5 层后，所有招式伤害再 +30%' },
  { id: 'wanfubi',    n: '万符笔',     slot: 'weapon', cls: 'mage',      ch: 9, w: 1, set: 'wanfu',   imp: { elem: 20 },     fx: 'wWanfu',   d: '引爆符同时引爆全场每个敌人身上的状态，每个敌人都按自己身上的状态算，伤害再 +30%' },
  { id: 'zhenshiling', n: '镇尸铜铃',  slot: 'weapon', cls: 'necro',     ch: 9, w: 1, set: 'yinbing', imp: { minionPct: 20 }, fx: 'wZhenshi', d: '僵尸每次出手有 25% 几率连打两下' },
  { id: 'wandufan',   n: '万毒幡',     slot: 'weapon', cls: 'necro',     ch: 9, w: 1, set: 'duxing',  imp: { elem: 20 },     fx: 'wWandu',   d: '敌人身上的毒不再随回合消退；尸毒蔓、土遁葬的毒发结算 +100%' },
  { id: 'qishabi',    n: '七杀匕',     slot: 'weapon', cls: 'assassin',  ch: 9, w: 1, set: 'qisha',   imp: { critDmg: 40 },  fx: 'wQisha',   d: '杀意上限 +1；终结技打死敌人时，溢出的伤害转给下一个敌人' },
  { id: 'lihuaxia',   n: '暴雨梨花匣', slot: 'weapon', cls: 'assassin',  ch: 9, w: 1, set: 'qianji',  imp: { crit: 8 },      fx: 'wLihua',   d: '暗器招式每次命中有 30% 几率追加一根冰魄针（60% 伤害，并冰冻）' },
  { id: 'fumozhang',  n: '伏魔禅杖',   slot: 'weapon', cls: 'paladin',   ch: 9, w: 1, set: 'luohan',  imp: { hpPct: 12 },    fx: 'wFumo',    d: '金刚震伤害 +100%' },
  { id: 'darilun',    n: '大日金轮',   slot: 'weapon', cls: 'paladin',   ch: 9, w: 1, set: 'dari',    imp: { dmgPct: 12 },   fx: 'wDari',    d: '大日如来追加的佛光伤害 +75%，每打中一个敌人恢复 2% 最大气血' },
  // 其他部位再添几件门派神兵（正常掉落；穿了幻境套装的可以收进乾坤袋用）
  { id: 'duanyue',    n: '断岳护腕',   slot: 'gloves', cls: 'berserker', ch: 7, imp: { atk: 10 },     fx: 'duanyue',    d: '断骨打中的敌人同时破甲和灼烧' },
  { id: 'xuantian',   n: '玄天冠',     slot: 'helm',   cls: 'mage',      ch: 7, imp: { elem: 12 },    fx: 'xuantian',   d: '寒冰诀、落石诀冷却 -1' },
  { id: 'huangquan',  n: '黄泉履',     slot: 'boots',  cls: 'necro',     ch: 7, imp: { minionPct: 10 }, fx: 'huangquan', d: '僵尸的速度和气血 +25%' },
  { id: 'youying',    n: '幽影佩',     slot: 'amulet', cls: 'assassin',  ch: 7, imp: { crit: 5 },     fx: 'youying',    d: '烟遁期间你的伤害 +50%；烟遁冷却 -2' },
  { id: 'jingangjia', n: '金刚袈裟',   slot: 'chest',  cls: 'paladin',   ch: 7, imp: { hpPct: 8 },    fx: 'jingangjia', d: '金钟罩冷却 -2；身上有护体真气时，每回合恢复 3% 最大气血' },
  // ---------- 通关后的职业神兵（每个职业 6 件）：腰带、副手、扳指各一件，配套装时能直接上身；另外三件在套装占的部位，靠乾坤袋或散件流用 ----------
  // 用途：冷门招式转正 2、两条路线都能用 2、防御辅助 2
  { id: 'fentianxue',  n: '焚天靴',   slot: 'boots',   cls: 'berserker', ch: 9, pg: 1, imp: { spd: 8 },      fx: 'cLieyan',    d: '烈焰刀冷却 -1；打正在灼烧的敌人伤害翻倍，怒意 +10' },
  { id: 'kaishanjie',  n: '开山扳指', slot: 'ring',    cls: 'berserker', ch: 9, pg: 1, imp: { atk: 12 },     fx: 'cSlash',     d: '每次出招后，顺手补一记劈砍（60%，不占出手），一半几率让敌人破甲，怒意 +3' },
  { id: 'zhanyidai',   n: '战意带',   slot: 'belt',    cls: 'berserker', ch: 9, pg: 1, x: 1, imp: { hpPct: 8 },  fx: 'cFuryCrit',  d: '每 10 点怒意，暴击率 +2%' },
  { id: 'shizhanqiao', n: '嗜战刀鞘', slot: 'offhand', cls: 'berserker', ch: 9, pg: 1, x: 1, imp: { dmgPct: 8 }, fx: 'cMeltFury',  d: '招式打中破甲的敌人，怒意 +4（每次出手一次）；怒意满时伤害 +20%' },
  { id: 'kuangxuepei', n: '狂血佩',   slot: 'amulet',  cls: 'berserker', ch: 9, pg: 1, imp: { hpPct: 8 },    fx: 'cFuryDr',    d: '每 10 点怒意，受到的伤害 -1.5%' },
  { id: 'shihoupao',   n: '狮吼战袍', slot: 'chest',   cls: 'berserker', ch: 9, pg: 1, imp: { hpPct: 10 },   fx: 'cWarcry',    d: '狮子吼冷却 -2，同时让同伴和僵尸 3 回合内攻击 +40%' },
  { id: 'wuleiling',   n: '五雷令',   slot: 'gloves',  cls: 'mage',      ch: 9, pg: 1, imp: { elem: 12 },    fx: 'cWulei',     d: '五雷正法冷却 -1；每层「连」伤害 +25%，劈中的敌人 30% 眩晕' },
  { id: 'lingfujie',   n: '灵符扳指', slot: 'ring',    cls: 'mage',      ch: 9, pg: 1, imp: { elem: 12 },    fx: 'cMissile',   d: '每次出招后，顺手打出一张灵符（90% 术法，随机打一个敌人，不占出手）' },
  { id: 'taiyipao',    n: '太乙道袍', slot: 'chest',   cls: 'mage',      ch: 9, pg: 1, imp: { hpPct: 10 },   fx: 'cLianFloor', d: '开战「连」就有 2 层；「连」断了也不会低于 2 层' },
  { id: 'baguaxia',    n: '八卦符匣', slot: 'offhand', cls: 'mage',      ch: 9, pg: 1, x: 1, imp: { elem: 12 }, fx: 'cBagua',     d: '敌人身上每有一种状态，受到你的伤害 +8%' },
  { id: 'julingdai',   n: '聚灵带',   slot: 'belt',    cls: 'mage',      ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cLianDr',    d: '每层「连」，受到的伤害 -4%（最多算 5 层）' },
  { id: 'tagangbu',    n: '踏罡步',   slot: 'boots',   cls: 'mage',      ch: 9, pg: 1, imp: { spd: 6 },      fx: 'cTagang',    d: '护体真气被打光时，冰冻所有敌人一回合（每场两次）' },
  { id: 'shehunshou',  n: '摄魂手',   slot: 'gloves',  cls: 'necro',     ch: 9, pg: 1, imp: { elem: 12 },    fx: 'cCurse',     d: '摄魂咒冷却 -2；被咒住的敌人受到你和僵尸的伤害 +25%' },
  { id: 'zhenhunjie',  n: '镇魂扳指', slot: 'ring',    cls: 'necro',     ch: 9, pg: 1, imp: { minionPct: 15 }, fx: 'cSpear',   d: '每次出招后，顺手钉一枚镇魂钉（60%，不占出手）并让敌人中毒；钉中的敌人，僵尸咬它伤害 +20%' },
  { id: 'fushidai',    n: '腐尸带',   slot: 'belt',    cls: 'necro',     ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cRotBelt',   d: '僵尸的攻击让敌人中毒；你对中毒的敌人伤害 +15%' },
  { id: 'qixingling',  n: '七星铃',   slot: 'offhand', cls: 'necro',     ch: 9, pg: 1, x: 1, imp: { minionPct: 15 }, fx: 'cQixing', d: '出招打中中毒的敌人时，冷却最长的那一招冷却 -1（每次出手一次）' },
  { id: 'xumingdeng',  n: '续命灯',   slot: 'amulet',  cls: 'necro',     ch: 9, pg: 1, imp: { hpPct: 8 },    fx: 'cXuming',    d: '每场两次：气血低于 35% 时恢复 20% 最大气血' },
  { id: 'shiyuguan',   n: '尸语冠',   slot: 'helm',    cls: 'necro',     ch: 9, pg: 1, imp: { minionPct: 15 }, fx: 'cShiyu',   d: '同伴的伤害和气血 +30%；僵尸每回合恢复 5% 气血' },
  { id: 'dishayi',     n: '地煞衣',   slot: 'chest',   cls: 'assassin',  ch: 9, pg: 1, imp: { hpPct: 10 },   fx: 'cDici',      d: '地刺冷却 -1，眩晕几率从 40% 提高到 70%；打中眩晕的敌人，杀意多 +1' },
  { id: 'shuangshenghuan', n: '双生刺环', slot: 'ring', cls: 'assassin', ch: 9, pg: 1, imp: { critDmg: 25 }, fx: 'cTwin',      d: '每次出招后，顺手补一次双刺（两下各 40%，第二下必定暴击，不占出手），一半几率杀意 +1' },
  { id: 'yexingdai',   n: '夜行带',   slot: 'belt',    cls: 'assassin',  ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cKiCrit',    d: '每点杀意，暴击伤害 +10%（终结技按出手前的杀意算）' },
  { id: 'huixuannang', n: '回旋镖囊', slot: 'offhand', cls: 'assassin',  ch: 9, pg: 1, x: 1, imp: { crit: 5 },  fx: 'cKiBack',    d: '终结技用完，返还一半用掉的杀意' },
  { id: 'guimian',     n: '夜叉面',     slot: 'helm',    cls: 'assassin',  ch: 9, pg: 1, imp: { spd: 6 },      fx: 'cGhostMask', d: '闪避 +6%；每闪开一次攻击，得到 5% 最大气血的护体真气（最多 25%）' },
  { id: 'jinchanshou', n: '金蝉手',   slot: 'gloves',  cls: 'assassin',  ch: 9, pg: 1, imp: { hpPct: 8 },    fx: 'cJinchan',   d: '烟遁结束时恢复 15% 最大气血，并清掉身上的负面状态' },
  { id: 'wanfoguan',   n: '万佛冠',   slot: 'helm',    cls: 'paladin',   ch: 9, pg: 1, imp: { dmgPct: 8 },   fx: 'cJudge',     d: '万佛朝宗冷却 -2，打中的敌人 30% 眩晕；身上有护体真气时伤害 +50%' },
  { id: 'luohanjie',   n: '金刚指环', slot: 'ring',    cls: 'paladin',   ch: 9, pg: 1, imp: { armorPct: 12 }, fx: 'cHoly',     d: '每次出招后，顺手补一记罗汉拳（100% 佛光，不占出手），并给你 3% 最大气血的护体真气（最多叠到 50%）' },
  { id: 'jinshendai',  n: '金身带',   slot: 'belt',    cls: 'paladin',   ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cShieldDmg', d: '身上有护体真气时，伤害 +20%' },
  { id: 'jinganglingo', n: '金刚铃',  slot: 'offhand', cls: 'paladin',   ch: 9, pg: 1, x: 1, imp: { healPct: 12 }, fx: 'cCounter', d: '攒满 8 层「震」就放金刚震（原来 10 层），金刚震伤害 +30%' },
  { id: 'luohanbu',    n: '罗汉步',   slot: 'boots',   cls: 'paladin',   ch: 9, pg: 1, imp: { armorPct: 12 }, fx: 'cHalf',     d: '每次挨打有 25% 几率只受一半伤害' },
  { id: 'putizi',      n: '菩提子',   slot: 'amulet',  cls: 'paladin',   ch: 9, pg: 1, imp: { healPct: 12 }, fx: 'cBodhi',     d: '同伴受到的伤害 -30%；你回血时，同伴也回同样比例的气血' },
];

const SETS = [
  { id: 'bloodrage', n: '修罗血战', cls: 'berserker',
    pieces: [['weapon', '修罗战刀'], ['helm', '修罗血盔'], ['chest', '修罗战甲'], ['gloves', '修罗护腕']],
    b2: { leech: 6 }, b2d: '吸血 +6%', b4: 'bloodrage', b4d: '气血低于 50% 时，伤害 +60%，速度 +30%' },
  { id: 'bulwark', n: '铁壁铜墙', cls: 'berserker',
    pieces: [['chest', '铜墙重甲'], ['boots', '铜墙战靴'], ['ring', '铜墙扳指'], ['amulet', '铜墙护心镜']],
    b2: { armorPct: 40 }, b2d: '护甲 +40%', b4: 'bulwark', b4d: '受到攻击时反震 40% 伤害，并使旋风刀冷却 -1' },
  { id: 'infernal', n: '三昧真火', cls: 'mage',
    pieces: [['weapon', '真火拂尘'], ['helm', '真火道冠'], ['chest', '真火道袍'], ['gloves', '真火护腕']],
    b2: { elem: 30 }, b2d: '术法伤害 +30%', b4: 'ignite', b4d: '真火符使敌人燃烧 3 回合（每回合 50% 攻击），真火符冷却 -1' },
  { id: 'frost', n: '玄冰诀', cls: 'mage',
    pieces: [['chest', '玄冰法袍'], ['boots', '玄冰云履'], ['ring', '玄冰扳指'], ['amulet', '玄冰玉佩']],
    b2: { freeze: 15 }, b2d: '定身几率 +15%', b4: 'shatter', b4d: '对被定身的敌人伤害翻倍，寒冰诀冷却 -1' },
  { id: 'bonelord', n: '尸王', cls: 'necro',
    pieces: [['weapon', '尸王铃'], ['helm', '尸王斗笠'], ['chest', '尸王寿衣'], ['gloves', '尸王指套']],
    b2: { minion: 1 }, b2d: '僵尸数量上限 +1', b4: 'boneLord', b4d: '僵尸的伤害和气血 +100%' },
  { id: 'plague', n: '五毒教', cls: 'necro',
    pieces: [['chest', '五毒蛊衣'], ['boots', '五毒蛇履'], ['ring', '五毒扳指'], ['amulet', '五毒蛊坛']],
    b2: { poison: 30 }, b2d: '攻击附带中毒（每回合 30% 攻击，3 回合）', b4: 'plague', b4d: '中毒伤害 +150%，尸毒爆让所有敌人中毒' },
  { id: 'shadowdance', n: '无影门', cls: 'assassin',
    pieces: [['weapon', '无影双刺'], ['helm', '无影面罩'], ['chest', '无影夜行衣'], ['gloves', '无影指套']],
    b2: { crit: 8 }, b2d: '暴击率 +8%', b4: 'shadowDance', b4d: '暴击时 35% 几率立刻追加一次攻击' },
  { id: 'venomfang', n: '蛇信', cls: 'assassin',
    pieces: [['chest', '蛇鳞软甲'], ['boots', '蛇行软靴'], ['ring', '蛇牙扳指'], ['amulet', '蛇胆玉佩']],
    b2: { poison: 40 }, b2d: '攻击附带中毒（每回合 40% 攻击，3 回合）', b4: 'venomFang', b4d: '中毒的敌人受到伤害 +30%，淬毒镖冷却 -1' },
  { id: 'oath', n: '金刚不坏', cls: 'paladin',
    pieces: [['weapon', '金刚禅杖'], ['helm', '金刚僧帽'], ['chest', '金刚袈裟'], ['gloves', '金刚护腕']],
    b2: { hpPct: 10 }, b2d: '最大气血 +10%', b4: 'holyLight', b4d: '般若心经冷却 -2，溢出的治疗转为护体真气' },
  { id: 'wrath', n: '降魔', cls: 'paladin',
    pieces: [['chest', '降魔僧衣'], ['boots', '降魔僧鞋'], ['ring', '降魔扳指'], ['amulet', '降魔念珠']],
    b2: { elem: 30 }, b2d: '术法伤害 +30%（佛光也算）', b4: 'wrath', b4d: '降魔杵会砸中所有敌人' },
];

// 职业（id 沿用，名字和形象全换成东方）
const CLASSES = {
  berserker: {
    n: '狂刀客', d: '浪迹江湖的刀客，血厚皮糙，越打越疯。挨打、出手都攒「怒意」，怒意过半招式更狠；血越少，伤害越高。', spr: 'blade',
    base: { hp: 145, atk: 12, armor: 15, crit: 6, critDmg: 155, res: 20 }, per: { hp: 16.5, atk: 2.35, armor: 2.5 },
    res: { n: '怒意', max: 100 },
    skills: [
      { id: 'liedi',     n: '裂地斩',   lv: 1, cat: 'ctrl',  cd: 3, wx: 'tu',   k: 'aoe', m: 0.6, stun: 0.2, d: '一刀劈裂地面，对所有敌人造成 60% 伤害，20% 几率眩晕' },
      { id: 'lieyan',    n: '烈焰刀',   lv: 3, cat: 'core',  cd: 3, wx: 'huo',  k: 'single', m: 1.5, d: '刀身燃火，造成 150% 伤害' },
      { id: 'warcry',    n: '狮子吼',   lv: 6, cat: 'buff',  cd: 6, wx: 'tu', d: '3 回合内攻击 +40%、护甲 +50%，怒意 +30' },
      { id: 'hanren',    n: '断骨',     lv: 9, cat: 'core',  cd: 3, wx: 'shui', k: 'single', m: 1.4, d: '寒刃入骨，造成 140% 伤害' },
      { id: 'bloodlust', n: '饮血斩',   lv: 12, cat: 'core', cd: 4, wx: 'jin', d: '造成 180% 伤害，并恢复伤害量 50% 的气血' },
      { id: 'whirl',     n: '旋风刀',   lv: 16, cat: 'core', cd: 3, wx: 'jin', d: '对所有敌人造成 70% 伤害' },
      { id: 'bawang',    n: '霸王卸甲', lv: 20, cat: 'core', cd: 3, wx: 'jin', d: '吃掉全部怒意：造成 150% 伤害，每点怒意再 +2%（怒意满时 350%）' },
      { id: 'butui',     n: '不退',     lv: 25, cat: 'buff', cd: 6, wx: 'tu', d: '2 回合内受到的伤害 -50%，挨的每一下都攒双倍怒意' },
      { id: 'slash',     n: '劈砍',     lv: 1,  cd: 0, wx: 'jin', d: '造成 100% 物理伤害，怒意 +5' },
    ],
    tree: { n: '刀意', t: [
      { id: 'furyUp',  n: '怒火',     d: '怒意获得 +10%', max: 5, st: { furyGain: 10 } },
      { id: 'warUp',   n: '战意',     d: '伤害 +3%', max: 5, st: { dmgPct: 3 } },
      { id: 'bloodUp', n: '饮血刀意', d: '饮血斩伤害 +15%', max: 5, st: { sk_bloodlust: 15 } },
      { id: 'undying', n: '不死',     d: '每场战斗一次：受到致命伤时锁住 1 点气血，撑过下一回合', max: 1, fx: 'lastBreath' } ] } },
  mage: {
    n: '五行道士', d: '画符念咒，最会挂状态、引爆状态，身板最薄。每换一种五行出招叠一层「连」（每层伤害 +8%），不用管顺序；同一种五行连着放不加也不掉（普攻灵符算木）。每场开局自带一层护身符箓（35% 气血的护体）。', spr: 'taoist',
    base: { hp: 140, atk: 12, armor: 9, crit: 8, critDmg: 160, res: 14 }, per: { hp: 19.5, atk: 3.3, armor: 2.3 },
    res: { n: '连', max: 5 },
    skills: [
      { id: 'fireball',  n: '真火符',   lv: 1, cat: 'core',  cd: 2, wx: 'huo', d: '造成 180% 火焰伤害' },
      { id: 'frostnova', n: '寒冰诀',   lv: 3, cat: 'ctrl',  cd: 4, wx: 'shui', d: '对所有敌人造成 45% 冰冷伤害' },
      { id: 'chain',     n: '掌心雷',   lv: 6, cat: 'core',  cd: 3, wx: 'mu', d: '对最多 3 个敌人各造成 120% 雷电伤害' },
      { id: 'luoshi',    n: '落石诀',   lv: 9, cat: 'ctrl',  cd: 4, wx: 'tu',  k: 'aoe', m: 0.9, stun: 0.2, d: '山石从天而降，对所有敌人造成 90% 伤害，20% 几率眩晕' },
      { id: 'jinguang',  n: '金光咒',   lv: 12, cat: 'core', cd: 2, wx: 'jin', k: 'single', m: 1.7, d: '一道金光，造成 170% 伤害' },
      { id: 'zhenyue',   n: '镇岳符',   lv: 14, cat: 'buff', cd: 5, wx: 'tu', d: '得到 20% 最大气血的护身符箓（不超过上限），3 回合内伤害 +40%' },
      { id: 'lunzhuan',  n: '引爆符',   lv: 16, cat: 'core', cd: 3, wx: 'huo', k: 'single', m: 1.4, d: '造成 140% 伤害；目标身上每有一种状态，再 +120%，然后把状态全部引爆清掉' },
      { id: 'meteor',    n: '天降火雨', lv: 20, cat: 'core', cd: 6, wx: 'huo', d: '对所有敌人造成 200% 火焰伤害' },
      { id: 'wulei',     n: '五雷正法', lv: 25, cat: 'core', cd: 4, wx: 'jin', d: '造成 190% 雷电伤害；「连」满 5 层时劈中所有敌人' },
      { id: 'missile',   n: '灵符',     lv: 1,  cd: 0, wx: 'mu', d: '造成 110% 术法伤害' },
    ],
    tree: { n: '五行', t: [
      { id: 'fireUp',  n: '火行', d: '真火符和天降火雨伤害 +12%', max: 5, st: { sk_fireball: 12, sk_meteor: 12 } },
      { id: 'frostUp', n: '水行', d: '寒冰诀伤害 +15%，定身几率 +2%', max: 5, st: { sk_frostnova: 15, freeze: 2 } },
      { id: 'lianUp',  n: '流转', d: '每层「连」的伤害加成再 +1%', max: 5, st: { lianPct: 1 } },
      { id: 'archmage', n: '天师', d: '「连」上限 5 → 7；叠满的那一招必定暴击，然后「连」清零重新叠', max: 1, fx: 'tianshi' } ] } },
  necro: {
    n: '赶尸人', d: '湘西赶尸一脉，自己身板弱，靠摇铃驱使僵尸作战。在「武学」页排好「尸阵」：跳尸快攻、铁甲尸挡在前面、毒尸和阴火尸在后排挂状态。', spr: 'corpseman',
    base: { hp: 125, atk: 12, armor: 10, crit: 5, critDmg: 150, res: 12 }, per: { hp: 17, atk: 3.35, armor: 2.4 },
    res: { n: '尸位' },
    skills: [
      { id: 'summon',    n: '摇铃唤尸', lv: 1, cat: 'buff',  cd: 2, wx: 'tu', d: '把倒下的僵尸按尸阵补回一具（开战时僵尸已经列好阵；基础尸位 3）' },
      { id: 'jihuo',     n: '摇铃·集火', lv: 3, cat: 'core', cd: 3, wx: 'jin', d: '所有僵尸立刻对目标各出手一次' },
      { id: 'shidu',     n: '尸毒蔓',   lv: 6, cat: 'core',  cd: 4, wx: 'mu',  k: 'aoe', m: 0.4, d: '尸毒蔓延，对所有敌人造成 40% 伤害' },
      { id: 'corpse',    n: '尸爆',     lv: 9, cat: 'core',  cd: 3, wx: 'huo', d: '引爆血最少的一具僵尸，按它剩余气血的 80% 打所有敌人' },
      { id: 'yangshi',   n: '养尸符',   lv: 12, cat: 'buff', cd: 4, wx: 'shui', d: '所有僵尸恢复 30% 气血、多出手 2 次，3 回合内攻击 +30%' },
      { id: 'curse',     n: '摄魂咒',   lv: 16, cat: 'ctrl', cd: 6, wx: 'shui', d: '3 回合内所有敌人伤害 -30%' },
      { id: 'bonestorm', n: '百鬼夜行', lv: 20, cat: 'core', cd: 5, wx: 'shui', d: '每具僵尸各对所有敌人造成一次 45% 伤害（僵尸越多越疼）' },
      { id: 'tudun',     n: '土遁葬',   lv: 25, cat: 'core', cd: 4, wx: 'tu',  k: 'aoe', m: 1.0, heal: 'minion', d: '大地翻涌，对所有敌人造成 100% 伤害，并给你的僵尸回 30% 气血' },
      { id: 'bonespear', n: '镇魂钉',   lv: 1,  cd: 0, wx: 'jin', d: '造成 60% 术法伤害；钉中的敌人，僵尸会优先去咬' },
    ],
    tree: { n: '御尸', t: [
      { id: 'skelUp',   n: '炼尸',     d: '僵尸的气血和伤害 +12%', max: 5, st: { minionPct: 12 } },
      { id: 'ironUp',   n: '铁尸',     d: '铁甲尸气血 +15%，挨打时反震 +10%', max: 5, st: { ironPct: 15 } },
      { id: 'poisonUp', n: '尸毒',     d: '你和僵尸挂的中毒伤害 +15%', max: 5, st: { poisonPct: 15 } },
      { id: 'boneArmy', n: '万尸朝宗', d: '尸位 +1', max: 1, fx: 'boneArmy' } ] } },
  assassin: {
    n: '夜行刺客', d: '暗器出身，最快、最狠，专杀一个。出手攒「杀意」（最多 5 点），用夺命印、影杀一口气花掉；开战先手，群攻弱。', spr: 'assassin',
    base: { hp: 112, atk: 12, armor: 9, crit: 14, critDmg: 165, spd: 10, res: 14 }, per: { hp: 14.5, atk: 2.75, armor: 1.9 },
    res: { n: '杀意', max: 5 },
    skills: [
      { id: 'venom',      n: '淬毒镖',   lv: 1, cat: 'core',  cd: 3, wx: 'mu', ki: 1, d: '造成 120% 伤害并使目标中毒，杀意 +1' },
      { id: 'shadowstep', n: '无影步',   lv: 3, cat: 'buff',  cd: 5, wx: 'shui', ki: 2, d: '3 回合内闪避 +40%，下一次攻击必定暴击，杀意 +2' },
      { id: 'bingpo',     n: '冰魄针',   lv: 6, cat: 'ctrl',  cd: 3, wx: 'shui', k: 'multi', m: 0.6, hits: 3, ki: 1, d: '连发三根冰针，每根 60% 伤害，随机命中，杀意 +1' },
      { id: 'deathmark',  n: '夺命印',   lv: 9, cat: 'core',  cd: 4, wx: 'shui', fin: 1, d: '终结技：造成 250% 伤害，每点杀意再 +25%，并打上夺命印 3 回合（被标记的敌人受到伤害 +50%）' },
      { id: 'fan',        n: '漫天花雨', lv: 12, cat: 'core', cd: 3, wx: 'jin', d: '暗器齐发，对所有敌人造成 60% 伤害' },
      { id: 'dici',       n: '地刺',     lv: 16, cat: 'ctrl', cd: 3, wx: 'tu',   k: 'single', m: 1.6, ki: 1, d: '地刺破土，造成 160% 伤害，杀意 +1' },
      { id: 'shadowkill', n: '影杀',     lv: 20, cat: 'core', cd: 4, wx: 'jin', fin: 1, d: '终结技：对一个目标连刺，次数等于杀意，每下 90% 伤害，必定暴击' },
      { id: 'yandun',     n: '烟遁',     lv: 25, cat: 'buff', cd: 6, wx: 'mu', ki: 3, d: '2 回合内敌人打不中你，杀意 +3' },
      { id: 'twin',       n: '双刺',     lv: 1,  cd: 0, wx: 'jin', ki: 1, d: '快速出刺两次，每次 60% 伤害，杀意 +1' },
    ],
    tree: { n: '暗器', t: [
      { id: 'venomUp',  n: '淬毒',   d: '淬毒镖伤害和中毒伤害 +15%', max: 5, st: { sk_venom: 15, poisonPct: 15 } },
      { id: 'shadowUp', n: '身法',   d: '闪避 +2%', max: 5, st: { dodge: 2 } },
      { id: 'kiUp',     n: '杀心',   d: '终结技每点杀意的加成 +5%', max: 5, st: { kiPct: 5 } },
      { id: 'reap',     n: '夺魂',   d: '被夺命印标记的敌人额外受到 +50% 伤害；杀意上限 +1', max: 1, fx: 'deathMarkPlus' } ] } },
  paladin: {
    n: '金刚武僧', d: '少林外家功夫，最耐打，输出最低。挨打必定反震（佛光伤害 = 攻击 × 反震倍率，自带 30%），还会给自己回血；每反震一次攒一层「震」，攒满 10 层放「金刚震」，佛光扫过全场。带伙伴时「护法金身」：伙伴晕住、冻住的妖物，跳过回合时照样吃你一次反震；妖物打伙伴，你替伙伴反震一半。', spr: 'monk',
    base: { hp: 130, atk: 12, armor: 10, crit: 5, critDmg: 150, res: 10 }, per: { hp: 12.5, atk: 2.9, armor: 1.7 },
    res: { n: '震' },
    skills: [
      { id: 'aegis',     n: '金钟罩',   lv: 1, cat: 'buff',  cd: 6, wx: 'jin', d: '获得 20% 最大气血的护体真气' },
      { id: 'hammer',    n: '降魔杵',   lv: 3, cat: 'core',  cd: 3, wx: 'jin', d: '造成 190% 佛光伤害' },
      { id: 'ganlu',     n: '甘露',     lv: 6, cat: 'core',  cd: 4, wx: 'shui', k: 'healaoe', m: 0.7, heal: 0.06, d: '甘露洒落，恢复 6% 气血，并对所有敌人造成 70% 伤害' },
      { id: 'fuhu',      n: '伏虎拳',   lv: 9, cat: 'ctrl',  cd: 3, wx: 'mu',   k: 'single', m: 1.7, d: '一拳伏虎，造成 170% 伤害，打中的敌人 2 回合内伤害 -15%' },
      { id: 'prayer',    n: '般若心经', lv: 12, cat: 'buff', cd: 5, wx: 'mu', d: '气血低于 70% 时恢复 16% 最大气血' },
      { id: 'budong',    n: '不动明王', lv: 16, cat: 'core', cd: 5, wx: 'tu',   k: 'aoe', m: 0.9, shield: 0.11, d: '对所有敌人造成 90% 伤害，并获得 11% 气血的护体' },
      { id: 'judgement', n: '万佛朝宗', lv: 20, cat: 'core', cd: 6, wx: 'huo', d: '对所有敌人造成 200% 佛光伤害' },
      { id: 'chanhou',   n: '狮子吼·禅', lv: 16, cat: 'ctrl', cd: 6, wx: 'tu', d: '嘲讽所有敌人 3 回合：它们只能打你（首领也一样）。这期间受到的伤害 -45%，反震倍率 +50%' },
      { id: 'holy',      n: '罗汉拳',   lv: 1,  cd: 0, wx: 'tu', d: '造成 115% 佛光伤害' },
    ],
    tree: { n: '禅心', t: [
      { id: 'counterUp', n: '铁壁',   d: '反震倍率 +10%', max: 5, st: { thornK: 10 } },
      { id: 'hammerUp',  n: '降魔',   d: '降魔杵伤害 +15%', max: 5, st: { sk_hammer: 15 } },
      { id: 'healUp',    n: '慈悲',   d: '治疗效果 +10%', max: 5, st: { healPct: 10 } },
      { id: 'divine',    n: '佛法无边', d: '般若心经同时对所有敌人造成 100% 佛光伤害；护体真气上限 +30%', max: 1, fx: 'divine' } ] } },
};
const CLASS_IDS = Object.keys(CLASSES);

const TALENT_SHARED = [
  { id: 'survive', n: '内功', t: [
    { id: 'vit',   n: '易筋经',   d: '最大气血 +4%', max: 5, st: { hpPct: 4 } },
    { id: 'iron',  n: '铁布衫',   d: '护甲 +6%，全抗 +2%', max: 5, st: { armorPct: 6, res: 2 } },
    { id: 'drain', n: '吸星大法', d: '吸血 +1%', max: 5, st: { leech: 1 } },
    { id: 'last',  n: '置之死地', d: '气血低于 30% 时受到的伤害 -40%', max: 1, fx: 'lastStand' } ] },
  { id: 'slay', n: '杀伐', t: [
    { id: 'precise', n: '眼疾',   d: '暴击率 +2%', max: 5, st: { crit: 2 } },
    { id: 'brutal',  n: '心狠',   d: '暴击伤害 +10%', max: 5, st: { critDmg: 10 } },
    { id: 'swift',   n: '手快',   d: '速度 +4', max: 5, st: { spd: 4 } },
    { id: 'exec',    n: '斩草除根', d: '对气血低于 30% 的敌人伤害 +60%', max: 1, fx: 'execute' } ] },
];
const TALENT_TIER_REQ = 3;

// 玉石 2026-11-23 重做：九档（碎……极品，后四档无瑕、通灵、天成、九幽跟着幻境最高层开）；
// 赤玉、墨玉从死数（+16 攻击、+40 护甲，满级只占 2%～4%）改成百分比；每档按「极品」的倍数算：前五档每档 +0.2，后四档越涨越少，九幽 = 极品 ×1.6
const GEM_MUL = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.35, 1.48, 1.6];
const gemVals = top => GEM_MUL.map(m => Math.round(top * m * 10) / 10);
const GEM_TYPES = {
  ruby:     { n: '赤玉', c: '#e04040', st: 'atkPct',   v: gemVals(6) },
  sapphire: { n: '青玉', c: '#4a9aff', st: 'res',      v: gemVals(15).map(Math.round) },
  topaz:    { n: '黄玉', c: '#f1c94a', st: 'crit',     v: gemVals(6) },
  emerald:  { n: '翠玉', c: '#3cc870', st: 'hpPct',    v: gemVals(11) },
  amethyst: { n: '墨玉', c: '#8a6aaa', st: 'armorPct', v: gemVals(8) },
  diamond:  { n: '白玉', c: '#f0f4f8', st: 'critDmg',  v: gemVals(28) },
};
const GEM_TIERS = ['碎', '粗', '良', '精', '极品', '无瑕', '通灵', '天成', '九幽'];
const GEM_RIFT = [60, 100, 150, 200];   // 无瑕、通灵、天成、九幽：幻境最高层打到这里才合得出
const ENHANCE_RATE = [1, 1, 1, 1, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
const ENHANCE_MAX = 10;

// 难度：base 是在章节等级之上额外加的怪物等级
const DIFFS = {
  normal:    { n: '凡尘', base: 0,  res: 0,  hpMul: 1,   atkMul: 1,   loot: 0 },
  nightmare: { n: '修罗', base: 22, res: 20, hpMul: 2.7, atkMul: 2.1, loot: 1 },
  hell:      { n: '炼狱', base: 40, res: 40, hpMul: 4.4, atkMul: 3.3, loot: 2 },
};
const DIFF_IDS = Object.keys(DIFFS);

const ELITE_AFFIXES = [
  { id: 'fiery',    n: '烈焰', d: '攻击额外造成火焰伤害' },
  { id: 'cold',     n: '寒霜', d: '攻击有几率定身目标' },
  { id: 'vamp',     n: '吸血', d: '攻击吸取气血' },
  { id: 'split',    n: '分身', d: '死后分成两只' },
  { id: 'thorny',   n: '反震', d: '把受到的伤害弹回四分之一：你每出手一次，最多被弹掉 15% 最大气血，护体真气先挡' },
  { id: 'enraged',  n: '狂暴', d: '半血后伤害和速度大增' },
  { id: 'tough',    n: '铜皮', d: '气血大幅提高' },
  { id: 'fast',     n: '神行', d: '行动速度大幅提高' },
  { id: 'shielded', n: '护体', d: '战斗开始时获得护体真气' },
  { id: 'venom',    n: '剧毒', d: '攻击使目标中毒' },
];
const ELITE_TITLES = ['凶煞', '怨毒', '嗜血', '百年', '千年', '狂怒', '阴'];

const ROOM_TYPES = {
  start: { n: '入口' }, empty: { n: '空房间' }, battle: { n: '妖物' }, elite: { n: '精英' },
  keeper: { n: '守门妖将' }, event: { n: '奇遇' }, chest: { n: '宝箱' }, gold: { n: '银两' },
  shop: { n: '货郎' }, rest: { n: '篝火' }, boss: { n: '首领' }, goblin: { n: '招财金蟾' },
  story: { n: '剧情' }, page: { n: '残卷' },
};

// 奇遇（随机事件）。go() 返回 { msg, fight? }；E 是引擎提供的工具函数。
const EVENTS = [
  { id: 'shrine', t: '土地庙', d: '路边一座破土地庙，香炉里居然还插着三炷没烧完的香。',
    c: [
      { l: '上香许愿', go: (r, E) => {
          const x = Math.random();
          if (x < 0.4) { E.buff(r, 'dmgPct', 15); return { msg: '土地公显灵，拍了拍你的肩。本局伤害 +15%。' }; }
          if (x < 0.7) { E.buff(r, 'armorPct', 30); return { msg: '一股暖流护住全身。本局护甲 +30%。' }; }
          E.hurt(r, 0.2); return { msg: '香炉里跳出一只黄鼠狼咬了你一口，原来这庙早被占了。失去 20% 气血。' };
        } },
      { l: '离开', go: () => ({ msg: '敬鬼神而远之。' }) },
    ] },
  { id: 'adventurer', t: '落难书生', d: '一个书生被吊在树上，嘴里还在背《论语》。他说只要一颗丹药就能缓过来。',
    c: [
      { l: '给他一颗丹药', req: r => r.potions > 0, go: (r, E) => { r.potions--; const it = E.loot(r, 'elite'); return { msg: '书生感激涕零，把祖传的宝贝塞给你：' + it }; } },
      { l: '翻他的书箱', go: (r, E) => { const g = E.gold(r, 6); E.hurt(r, 0.1); return { msg: `书生用砚台砸了你的头。你拿走了 ${g} 两银子，失去 10% 气血。` }; } },
      { l: '离开', go: () => ({ msg: '身后传来「朽木不可雕也」的骂声。' }) },
    ] },
  { id: 'cursedChest', t: '贴满符的棺材', d: '一口黑漆棺材，上面贴满了黄符，里面隐约有东西在敲。',
    c: [
      { l: '撕符开棺', go: (r, E) => {
          if (Math.random() < 0.5) { const it = E.loot(r, 'boss'); return { msg: '棺材里是一具早已化灰的老员外，手里还攥着宝贝：' + it }; }
          return { msg: '棺盖「砰」地飞了出去——一只精怪扑了出来！', fight: 'elite' };
        } },
      { l: '离开', go: () => ({ msg: '有些东西最好别碰。' }) },
    ] },
  { id: 'bloodAltar', t: '邪神祭坛', d: '祭坛上的血槽干涸已久，似乎在等待新的祭品。',
    c: [
      { l: '献上 20% 气血', go: (r, E) => { E.hurt(r, 0.2); E.buff(r, 'dmgPct', 20); return { msg: '祭坛饮下你的血。本局伤害 +20%。' }; } },
      { l: '离开', go: () => ({ msg: '你收起了兵器。' }) },
    ] },
  { id: 'gambler', t: '鬼赌坊', d: '一只穿长衫的骷髅坐在骰盅后面：「客官，押大押小？」',
    c: [
      { l: '下注', dyn: (r, E) => `押 ${E.bet(r)} 两`, req: (r, E) => E.save().gold >= E.bet(r), go: (r, E) => {
          const b = E.bet(r);
          if (Math.random() < 0.5) { E.save().gold += b; return { msg: `开！四五六，大！你赢了 ${b} 两。骷髅的下巴掉到了地上。` }; }
          E.save().gold -= b; return { msg: `开！一二三，小！骷髅咯咯笑着收走了你的 ${b} 两。` };
        } },
      { l: '离开', go: () => ({ msg: '「客官下次再来呀～」' }) },
    ] },
  { id: 'library', t: '藏经阁残页', d: '一堆被老鼠啃过的经书，书页上的字还在发光。',
    c: [
      { l: '翻阅', go: (r, E) => {
          if (Math.random() < 0.25) return { msg: '书里窜出一群书虫成精了！', fight: 'battle' };
          const x = E.xp(r, 0.25); return { msg: `你读懂了一页武功心法。获得 ${x} 经验。` };
        } },
      { l: '离开', go: () => ({ msg: '读书人的事，回头再说。' }) },
    ] },
  { id: 'fountain', t: '两口古井', d: '左边的井水清澈见底，右边的井水红得像血。',
    c: [
      { l: '喝清井的水', go: (r, E) => { E.heal(r, 0.5); return { msg: '井水甘甜。恢复 50% 气血。' }; } },
      { l: '喝血井的水', go: (r, E) => {
          if (Math.random() < 0.6) { E.buff(r, 'hpPct', 15); E.heal(r, 0.15); return { msg: '血气翻涌，力大无穷。本局最大气血 +15%。' }; }
          E.hurt(r, 0.25); return { msg: '有毒！你吐了半天。失去 25% 气血。' };
        } },
    ] },
  { id: 'bones', t: '乱坟堆', d: '几座没有墓碑的新坟，其中一座的土还在动。',
    c: [
      { l: '挖开看看', go: (r, E) => {
          if (Math.random() < 0.6) { const it = E.loot(r, 'normal'); return { msg: '原来是只土拨鼠。坟里埋着：' + it }; }
          return { msg: '坟里伸出一只手抓住了你的脚！', fight: 'battle' };
        } },
      { l: '离开', go: () => ({ msg: '让死者安息吧。' }) },
    ] },
  { id: 'pact', t: '心魔', d: '你脑中响起一个声音：「我可以给你力量……只要一点点代价。」',
    c: [
      { l: '接受心魔', go: (r, E) => { E.buff(r, 'crit', 15); E.buff(r, 'critDmg', 40); E.buff(r, 'hpPct', -15);
          return { msg: '心魔入体。本局暴击率 +15%、暴击伤害 +40%，最大气血 -15%。' }; } },
      { l: '默念清心咒', go: () => ({ msg: '心魔不甘地散去了。' }) },
    ] },
  { id: 'lostSoul', t: '迷途孤魂', d: '一个老婆婆的魂魄在路口打转，说找不到回家的路。',
    c: [
      { l: '给她指路', go: r => { r.potions++; return { msg: '婆婆道谢后消散，原地留下一颗丹药。丹药 +1。' }; } },
      { l: '吸收魂魄', go: (r, E) => { E.buff(r, 'leech', 4); return { msg: '冰冷的力量流入体内……你感觉自己有点不是人。本局吸血 +4%。' }; } },
    ] },
  { id: 'rack', t: '遗落的兵器', d: '一具骸骨靠墙坐着，手里还握着一把好兵器。',
    c: [
      { l: '借来一用', go: (r, E) => { const it = E.loot(r, 'elite', 'weapon'); return { msg: '骸骨的手指松开了：' + it }; } },
      { l: '离开', go: () => ({ msg: '君子不夺人所好，死人也一样。' }) },
    ] },
  { id: 'trap', t: '机关暗道', d: '地砖上刻着八卦图，墙上密密麻麻全是小孔。',
    c: [
      { l: '按八卦步法走', go: (r, E) => { if (Math.random() < 0.7) return { msg: '乾三连、坤六断……你安全通过了。' }; E.hurt(r, 0.15); return { msg: '踩错一步，毒箭齐发！失去 15% 气血。' }; } },
      { l: '冲过去，顺手撬墙里的银子', go: (r, E) => { E.hurt(r, 0.12); const g = E.gold(r, 8); return { msg: `你挨了几箭，失去 12% 气血，但撬出了 ${g} 两银子。` }; } },
    ] },
  { id: 'gemVein', t: '玉石矿脉', d: '岩壁上嵌着几块发光的玉石，但周围的石头看起来很不稳。',
    c: [
      { l: '徒手开采', go: (r, E) => { E.hurt(r, 0.1); const g = E.gem(r); return { msg: `碎石划伤了你（失去 10% 气血），但你挖出了一块${g}。` }; } },
      { l: '离开', go: () => ({ msg: '小心驶得万年船。' }) },
    ] },
  { id: 'anvil', t: '铸剑炉', d: '一座废弃的铸剑炉，炉火居然还没熄灭。',
    c: [
      { l: '淬炼你的兵器', req: r => !!E_weapon(r), go: (r, E) => E.forge(r) },
      { l: '离开', go: () => ({ msg: '你没有时间打铁。' }) },
    ] },
  { id: 'prisoner', t: '被困的狐仙', d: '一只小白狐被铁笼困住，看守它的妖怪就在附近打盹。',
    c: [
      { l: '砸开铁笼', go: () => ({ msg: '一声巨响惊醒了看守！', fight: 'elite', reward: 'mats' }) },
      { l: '离开', go: () => ({ msg: '小白狐失望地看着你离开。' }) },
    ] },
  { id: 'soulWell', t: '聚魂井', d: '一口深井里翻涌着幽蓝的光。',
    c: [
      { l: '汲取魂晶', go: (r, E) => { const n = E.mats(r, 6); return { msg: `你收集到了 ${n} 颗魂晶（铸剑坊用的材料）。` }; } },
      { l: '倒入一颗丹药', req: r => r.potions > 0, go: (r, E) => { r.potions--; E.buff(r, 'res', 20); return { msg: '井水平静下来，护佑着你。本局全抗 +20%。' }; } },
    ] },
];
function E_weapon(r) { return SAVE.chars[r.cls].eq.weapon; }

// ---------------- 五行 ----------------
const WX = { jin: { n: '金', c: '#f1d34e' }, mu: { n: '木', c: '#5fd07a' }, shui: { n: '水', c: '#5fb0ff' }, huo: { n: '火', c: '#ff6a2a' }, tu: { n: '土', c: '#c8935a' } };
const WX_IDS = ['mu', 'huo', 'tu', 'jin', 'shui'];
const WX_SHENG = { mu: 'huo', huo: 'tu', tu: 'jin', jin: 'shui', shui: 'mu' };   // 甲生乙
const WX_KE = { mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin', jin: 'mu' };      // 甲克乙
// 反应：相克以「打上去的五行」命名，相生以「原来的印」命名
const REACTS = {
  ke_shui: { n: '蒸腾', d: '水克火：这一击伤害翻倍' },
  ke_huo:  { n: '熔甲', d: '火克金：护甲减半、抗性 -20，持续 3 回合' },
  ke_jin:  { n: '伐',   d: '金克木：斩断护体，这一击必定暴击' },
  ke_mu:   { n: '裂',   d: '木克土：击晕 1 回合' },
  ke_tu:   { n: '封',   d: '土克水：冻住 1 回合' },
  sh_mu:   { n: '燎原', d: '木生火：所有敌人都烧起来' },
  sh_huo:  { n: '余烬', d: '火生土：其他敌人也受到 40% 伤害' },
  sh_tu:   { n: '淬锋', d: '土生金：伤害 +20%，你的下一击必定暴击' },
  sh_jin:  { n: '寒锋', d: '金生水：目标变慢 3 回合' },
  sh_shui: { n: '滋养', d: '水生木：你恢复 8% 气血' },
};
// 妖物的五行与特性（按像素图大致归类）
const MON_WX = {yayi:'jin', yong:'tu', headless:'shui', xianling:'tu',  jiangshi: 'tu', skeleton: 'jin', imp: 'mu', bat: 'mu', wisp: 'huo', hound: 'mu', spider: 'mu', golem: 'tu', snake: 'shui', toad: 'shui',
  ghost: 'shui', fox: 'huo', femghost: 'shui', bull: 'tu', crow: 'huo', paper: 'mu', knight: 'jin', caster: 'huo', demon: 'huo', zombie: 'tu', skelking: 'jin' };
const MON_TRAIT = {yayi:'shield', yong:'shield', headless:'fly',  skeleton: 'shield', knight: 'shield', golem: 'shield', jiangshi: 'regen', zombie: 'regen', snake: 'regen', bat: 'fly', wisp: 'fly', crow: 'fly', ghost: 'fly' };
const TRAITS = { shield: { n: '骨甲', d: '开场带一层护体；被「破甲」就碎' }, regen: { n: '回春', d: '每回合回血；被「灼烧」时回不了' }, fly: { n: '飞行', d: '近战攻击有 25% 落空；被「冰冻」后掉下来，不会再落空' } };
// 同伴
const COMPANIONS = {
  ngoc: { n: 'Ngoc', spr: 'ngoc', wx: 'huo', ap: 'burn', hp: 0.5, atk: 0.5, spd: 95, d: '给你回血；扔的药瓶会让敌人灼烧', row: 'back', role: '回血 · 灼烧',
    up: ['好感 10：气血低于七成就给你回血，顺手清掉中毒、眩晕', '好感 20：回血时全队一起回'] },
  zhen: { n: '珍姑娘', spr: 'constable', wx: 'jin', ap: 'armor', hp: 0.65, atk: 0.6, spd: 105, d: '捕快刀会让敌人破甲，每三招甩一次锁链让敌人眩晕', row: 'front', role: '破甲 · 眩晕',
    up: ['好感 10：锁链眩晕的几率从五成提到八成', '好感 20：锁链甩向所有敌人'] },
  long: { n: '龙道长', spr: 'scholar', wx: 'mu', ap: 'chill', hp: 0.45, atk: 0.55, spd: 98, d: '正气诀会让敌人冰冻，时不时念一段给你加攻击', row: 'back', role: '加攻 · 冰冻',
    up: ['好感 10：正气诀从每四招一次变成每三招一次', '好感 20：正气诀给全队加攻击'] },
  kang: { n: '康总管', spr: 'merchant', wx: 'tu', ap: 'stun', apc: 0.2, hp: 1.6, atk: 0.35, spd: 85, d: '前排肉盾：会嘲讽；每三招「挡刀」两回合，替你挡下三成伤害', row: 'front', role: '嘲讽 · 挡刀', pg: 1,
    up: ['好感 10：挡刀替你挡四成', '好感 20：嘲讽更凶，多拉一半的攻击'] },
  // 2026-11 新伙伴：通关后达成条件认识（lock：认识的条件，界面上显示）
  lei: { n: '雷老虎', spr: 'blade', wx: 'jin', ap: 'armor', hp: 0.9, atk: 0.65, spd: 100, d: '前排老猎户：专砍血最少的；劈刀让敌人破甲，每三招一记「断头刀」，对残血的敌人伤害翻倍', row: 'front', role: '收残血 · 破甲', pg: 1,
    lock: '完成 10 次悬赏', up: ['好感 10：断头刀对血量低于一半的敌人就翻倍', '好感 20：断头刀砍死了人，再补一刀给下一个'] },
  liu: { n: '刘师傅', spr: 'oldman', wx: 'shui', ap: 'stun', apc: 0.3, hp: 0.55, atk: 0.45, spd: 92, d: '后排义庄的老师爷：每三招念一段安魂经，全队两回合受到的伤害 -20%；摇铃会让敌人眩晕', row: 'back', role: '全队减伤 · 眩晕', pg: 1,
    lock: '镇妖录集满 3 页', up: ['好感 10：念经减伤提到 30%', '好感 20：念经时顺手把一个敌人敲晕'] },
  tie: { n: '铁蛋', spr: 'smith', wx: 'huo', ap: 'burn', hp: 0.6, atk: 0.6, spd: 96, d: '后排铁匠徒弟：火铳让敌人灼烧；每三招给前排「加固」三回合，护甲 +40%', row: 'back', role: '灼烧 · 前排加甲', pg: 1,
    lock: '在张大锤那里打一把专属兵器', up: ['好感 10：加固也给后排', '好感 20：火铳打所有敌人'] },
};

// ---------------- 状态配合 ----------------
// 起手技能给敌人挂状态（ap），收招技能打带状态的敌人有额外效果（pay）
const STATES = { burn: { n: '灼烧', c: '#ff6a2a', d: '每回合掉一大截血（只有一层，强的留着）；回春的妖物烧着时不能回血' },
  chill: { n: '冰冻', c: '#5fb0ff', d: '出手变慢；飞行的妖物会掉下来' },
  armor: { n: '破甲', c: '#d8a05a', d: '护甲减半、抗性 -20；骨甲直接碎掉' },
  stun: { n: '眩晕', c: '#f1d34e', d: '跳过下一次出手' },
  poison: { n: '中毒', c: '#7fe05a', d: '每回合掉血，可以叠层（最多 5 层，每层 3 回合）' } };
const SKILL_COMBO = {
  liedi: { ap: 'armor' }, lieyan: { ap: 'burn' }, warcry: { ap: 'stun', apc: 0.3 }, hanren: { ap: 'chill', pay: { s: 'stun', x: 'crit', n: '断骨' } },
  bloodlust: { pay: { s: 'burn', x: 'dmg', v: 1.8, n: '饮火' } }, whirl: { pay: { s: 'armor', x: 'dmg', v: 1.7, n: '破军' } }, bawang: { pay: { s: 'armor', x: 'crit', n: '卸甲' } },
  fireball: { ap: 'burn' }, frostnova: { ap: 'chill' }, chain: { pay: { s: 'burn', x: 'dmg', v: 1.8, n: '雷火' } }, luoshi: { ap: 'armor' },
  jinguang: { pay: { s: 'chill', x: 'shatter', v: 2.8, n: '碎冰' } }, lunzhuan: { pay: { s: 'any', x: 'detonate', n: '引爆' } },
  meteor: { pay: { s: 'armor', x: 'dmg', v: 1.5, n: '焚城' } }, wulei: { pay: { s: 'stun', x: 'crit', n: '天雷' } },
  bonespear: {}, jihuo: { pay: { s: 'poison', x: 'dmg', v: 1.8, n: '尸毒攻心' } }, shidu: { ap: 'poison' }, corpse: { pay: { s: 'burn', x: 'spread', n: '尸火' } },
  curse: { ap: 'armor' }, bonestorm: { pay: { s: 'armor', x: 'dmg', v: 1.5, n: '百鬼噬甲' } }, tudun: { pay: { s: 'chill', x: 'shatter', v: 2.2, n: '冰葬' } },
  venom: { ap: 'poison' }, bingpo: { ap: 'chill' }, deathmark: { pay: { s: 'stun', x: 'dmg', v: 2, n: '趁虚' } }, fan: { pay: { s: 'poison', x: 'dmg', v: 1.6, n: '毒雨' } },
  dici: { ap: 'stun', apc: 0.4, pay: { s: 'chill', x: 'crit', n: '冰刺' } }, shadowkill: { pay: { s: 'poison', x: 'dmg', v: 1.4, n: '毒刃' } },
  hammer: { ap: 'stun', apc: 0.3 }, ganlu: { ap: 'chill' }, fuhu: { ap: 'armor', pay: { s: 'stun', x: 'dmg', v: 1.8, n: '伏虎' } },
  budong: { pay: { s: 'stun', x: 'heal', v: 0.06, n: '明王' } }, judgement: { pay: { s: 'armor', x: 'dmg', v: 1.6, n: '伏魔' } },
};
for (const c in CLASSES) for (const k of CLASSES[c].skills) Object.assign(k, SKILL_COMBO[k.id] || {});
const payText = p => !p ? '' : p.x === 'dmg' ? `伤害 ×${p.v}` : p.x === 'crit' ? '必定暴击' : p.x === 'shatter' ? `伤害 ×${p.v}，打碎状态` : p.x === 'spread' ? '传给所有敌人' : p.x === 'heal' ? `你回 ${Math.round(p.v * 100)}% 气血` : p.x === 'detonate' ? '每种状态 +80%' : '';
