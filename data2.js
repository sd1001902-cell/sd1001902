// ============ 九幽回廊 · 长线玩法内容 ============

STAT_NAMES.frozenDmg = '对定身敌人伤害';
PCT_STATS.add('frozenDmg');
const MAX_LEVEL = 50;

const RUNES = {
  // 2026-11 补齐：每招两个变招，一攻一守（或一辅）。道士标「改为 X 行」的会换五行，方便凑齐一圈相生
  liedi:      [{ n: '崩山', d: '伤害 +60%' }, { n: '震地', d: '40% 几率眩晕；打中的敌人 2 回合内伤害 -20%' }],
  lieyan:     [{ n: '燎原', d: '灼烧蔓延给所有敌人' }, { n: '焚身', d: '对已经灼烧的敌人伤害 +80%' }],
  hanren:     [{ n: '碎骨', d: '打中的敌人 3 回合内受到的伤害 +20%' }, { n: '寒甲', d: '打中后获得 8% 最大气血的护体' }],
  bawang:     [{ n: '破釜', d: '怒意满时必定暴击' }, { n: '卸力', d: '按吃掉的怒意回血：每点 0.3% 最大气血' }],
  butui:      [{ n: '死战', d: '不退期间伤害 +40%' }, { n: '铁壁', d: '多持续 1 回合，期间反震翻倍' }],
  luoshi:     [{ n: '陨铁诀', d: '改为金行，伤害 +30%' }, { n: '山崩', d: '30% 几率眩晕每个敌人' }],
  jinguang:   [{ n: '玄水咒', d: '改为水行，打中的敌人冰冻' }, { n: '破甲金光', d: '对破甲的敌人伤害 +60%' }],
  lunzhuan:   [{ n: '厚土符', d: '改为土行，引爆后自己得一层护身符箓' }, { n: '余烬', d: '引爆后目标重新灼烧' }],
  wulei:      [{ n: '青木雷', d: '改为木行，「连」满 3 层就劈中所有敌人' }, { n: '天罚', d: '对眩晕的敌人伤害翻倍' }],
  jihuo:      [{ n: '尸潮', d: '集火时僵尸攻击 +30%' }, { n: '护主', d: '集火后，下一次打向你的攻击由僵尸全数代受' }],
  shidu:      [{ n: '蚀骨', d: '伤害 +100%，并让所有敌人破甲' }, { n: '腐毒', d: '中毒的敌人造成的伤害 -15%' }],
  yangshi:    [{ n: '借尸还魂', d: '同时扶起一具倒下的僵尸' }, { n: '尸甲', d: '3 回合内僵尸受到的伤害 -40%，你 -15%' }],
  tudun:      [{ n: '地裂', d: '伤害 +60%，30% 几率眩晕' }, { n: '入土为安', d: '你自己也恢复 15% 最大气血' }],
  bingpo:     [{ n: '寒星', d: '三针全打同一个目标' }, { n: '封脉', d: '打中的敌人 2 回合内伤害 -25%' }],
  dici:       [{ n: '穿心', d: '必定暴击，不再眩晕' }, { n: '陷阱', d: '眩晕几率提高到 70%，伤害 -30%' }],
  shadowkill: [{ n: '影分', d: '连刺分给所有敌人' }, { n: '嗜血影', d: '每刺一下恢复 2% 最大气血' }],
  yandun:     [{ n: '毒烟', d: '烟遁时让所有敌人中毒' }, { n: '金蝉', d: '多持续 1 回合，期间每回合恢复 5% 最大气血' }],
  ganlu:      [{ n: '净世', d: '伤害 +80%' }, { n: '甘霖', d: '回血翻倍，不再伤敌' }],
  fuhu:       [{ n: '降龙', d: '对眩晕的敌人必定暴击' }, { n: '卸劲', d: '打中的敌人 3 回合内伤害 -30%' }],
  budong:     [{ n: '明王怒', d: '伤害 +60%' }, { n: '金身', d: '护体翻倍，冷却 +1' }],
  chanhou:    [{ n: '当头棒喝', d: '施放时 50% 几率眩晕每个敌人' }, { n: '禅定', d: '嘲讽多 1 回合' }],
  whirl:      [{ n: '血旋', d: '每击中一个敌人恢复 2% 最大气血' }, { n: '飓风刀', d: '伤害 +50%，冷却 +1' }],
  warcry:     [{ n: '震慑', d: '同时震慑所有敌人 3 回合（伤害 -30%）' }, { n: '血战令', d: '狮子吼期间吸血 +10%' }],
  bloodlust:  [{ n: '斩首', d: '对气血低于 40% 的敌人伤害翻倍' }, { n: '鲸吞', d: '恢复量提高到伤害的 100%' }],
  fireball:   [{ n: '三连符', d: '改为对最多 3 个敌人各造成 100% 伤害' }, { n: '爆炎符', d: '命中后对其他所有敌人溅射 50% 伤害' }],
  frostnova:  [{ n: '千里冰封', d: '定身几率提高到 80%，伤害减半' }, { n: '冰锥', d: '伤害 +100%，不再定身' }],
  chain:      [{ n: '雷暴', d: '最多弹射 5 个目标' }, { n: '九天雷', d: '伤害 +60%，只弹射 2 个目标' }],
  meteor:     [{ n: '冰雹', d: '改为冰冷伤害，并定身所有敌人' }, { n: '焚天', d: '伤害 +50%，冷却 +2' }],
  summon:     [{ n: '连唤', d: '一次补两具僵尸' }, { n: '厚葬', d: '唤出的僵尸气血 +60%' }],
  curse:      [{ n: '勾魂', d: '摄魂效果提高到伤害 -45%' }, { n: '腐骨', d: '被摄魂的敌人受到伤害 +25%' }],
  corpse:     [{ n: '连环尸爆', d: '一次引爆两具僵尸' }, { n: '啖尸', d: '每次尸爆恢复 8% 最大气血' }],
  bonestorm:  [{ n: '鬼锁', d: '40% 几率定身每个敌人' }, { n: '万鬼', d: '伤害 +40%' }],
  venom:      [{ n: '鹤顶红', d: '中毒伤害翻倍' }, { n: '散花镖', d: '命中所有敌人并使其中毒，伤害 -40%' }],
  shadowstep: [{ n: '鬼影袭', d: '施放时立刻对目标造成 150% 伤害' }, { n: '幻影', d: '持续时间延长到 6 回合' }],
  fan:        [{ n: '暴雨梨花', d: '伤害 +40%' }, { n: '回旋镖', d: '对每个敌人命中两次，每次 50%' }],
  deathmark:  [{ n: '追魂', d: '被标记的敌人死亡时，夺命印冷却立刻重置' }, { n: '破绽', d: '标记的增伤效果 +25%' }],
  aegis:      [{ n: '金刚反震', d: '护体真气存在时，反弹受到伤害的 30%' }, { n: '不动明王', d: '护体真气提高到 40% 最大气血' }],
  prayer:     [{ n: '回春', d: '之后 3 回合，每回合再恢复 6% 气血' }, { n: '佛光普照', d: '治疗时对所有敌人造成 80% 佛光伤害' }],
  hammer:     [{ n: '雷音', d: '定身几率提高到 60%' }, { n: '伏魔', d: '伤害 +50%' }],
  judgement:  [{ n: '大日如来', d: '伤害 +40%' }, { n: '普度', d: '每击中一个敌人恢复 3% 最大气血' }],
};

// 灵玉（原传奇宝石）：只在九幽幻境的守关妖王身上掉落，可以无限升级
// 灵玉 2026-11-23 重做：删掉只是普通属性的五颗（战神、长生、疾风、破军、回春）；留六颗特色玉；
// 每个门派一颗本命玉（cls：只有本门能放进灵玉匣），两套幻境套装都吃得到；另外五颗不绑门派、绑一种打法。
// st：直接加到属性上的部分；机制部分在战斗里按 P.lgv[类型] = 等级 读（LGV 里的公式）
// ---------------- 阵法（2026-11-23，照梦幻西游的阵：四个号位，1、2 号前排，3、4 号后排，各号位加成不同，有的有代价） ----------------
// b：加成（跟着阵的等级涨，10 级是 1 级的 1.9 倍）；p：代价（不涨）；all：全员都有的加成/代价（同样 b 涨 p 不涨）
// 键：dmg 伤害%，dr 受到的伤害 -%（负数是多挨），spd 速度%，arm 护甲%，heal 受到的治疗%，aggro 妖物先打他的几率%，ext 挂的状态多几回合，stD 对身上有状态的妖物伤害%
// at：幻境到过多少层学会；ch：主线通关第几章学会（哪个先到算哪个）
const FORMS = {
  san:       { n: '散阵', s: '散', tag: '不摆阵', d: '不摆阵：前后排按职业站，没有加成也没有代价。妖物摆了阵，就会克你。' },
  tianfu:    { n: '天覆阵', s: '天覆', tag: '全员猛攻', at: 10, ch: 2, rows: [0, 0, 1, 1], pos: [{}, {}, {}, {}], all: { b: { dmg: 18 }, p: { spd: -6 } } },
  niaoxiang: { n: '鸟翔阵', s: '鸟翔', tag: '抢先手', at: 20, ch: 4, rows: [0, 0, 1, 1], pos: [{ b: { spd: 20 } }, { b: { spd: 10 } }, { b: { spd: 10 } }, { p: { dr: -10 } }] },
  dizai:     { n: '地载阵', s: '地载', tag: '稳守', at: 30, ch: 6, rows: [0, 0, 1, 1], pos: [{ b: { dr: 25 } }, { b: { arm: 30 } }, { b: { heal: 20 } }, { b: { heal: 20 } }], all: { p: { dmg: -10 } } },
  huyi:      { n: '虎翼阵', s: '虎翼', tag: '一人突击', at: 45, ch: 8, rows: [0, 0, 1, 1], pos: [{ b: { dmg: 30, aggro: 35 }, p: { dr: -15 } }, { b: { dmg: 10 } }, { b: { dmg: 10 } }, { b: { dr: 15 } }] },
  shepan:    { n: '蛇蟠阵', s: '蛇蟠', tag: '控场挂状态', at: 60, ch: 10, rows: [0, 0, 1, 1], pos: [{ b: { ext: 1, stD: 15 } }, { b: { dr: 10 } }, { b: { dr: 10 } }, { b: { dr: 10 } }], all: { p: { spd: -5 } } },
};
const FORM_IDS = ['tianfu', 'niaoxiang', 'dizai', 'huyi', 'shepan'];
const FORM_BEAT = { huyi: 'shepan', shepan: 'niaoxiang', niaoxiang: 'tianfu', tianfu: 'dizai', dizai: 'huyi' };   // 谁克谁：虎翼冲散蛇蟠，蛇蟠缠住鸟翔，鸟翔快过天覆，天覆压垮地载，地载挡住虎翼；五个阵都克散阵
const FORM_WHY = { huyi: '一人突击，冲散盘着的阵', shepan: '缠住快的', niaoxiang: '抢在猛攻前面出手', tianfu: '猛攻压垮守阵', dizai: '稳守挡住单点突击' };
const FORM_MAX = 10; let FORM_K = 10, EFM_FROM = 20;   // 阵最高 10 级；克制：克的一方伤害 +10%，被克的一方 -10%；幻境 20 层起妖物摆阵
const formCost = lv => 30 * lv;   // 升到下一级要的魂晶
const formScale = (v, lv) => v * (1 + 0.1 * ((lv || 1) - 1));
const FORM_STAT = { dmg: '伤害', dr: '受到的伤害', spd: '速度', arm: '护甲', heal: '受到的治疗', aggro: '妖物先打他', ext: '挂的状态多持续', stD: '对有状态的妖物伤害' };
const LGEM_CAP = 150;   // 2026-11-23 灵玉最高 150 级（原来跟着幻境层数一直涨，300 层时灵玉近 300 级，高层没压力）
const LGV = {
  zhLow: lv => 1 + lv * 0.05, zhHalf: lv => 10 + lv * 0.5,     // 战魂：气血每少 10%，伤害再 +x%；怒意过半时伤害 +x%
  wxCh: lv => Math.min(60, 15 + lv * 0.3),                      // 五行：换五行时挂状态的几率
  swPoi: lv => 5 + lv * 0.2,                                   // 尸王：每个空尸位，中毒伤害 +x%
  dpKi: lv => Math.min(60, 20 + lv * 0.3), dpFin: lv => 25 + lv * 0.75,   // 夺魄：暗器打中 +1 杀意的几率；终结技伤害
  jsSh: lv => 3 + lv * 0.04,                                    // 金身：挨打反震时得护体（最大气血 %）。2026-11-24 反击并进反震，次数多了，数值降到原来的八成左右
  lhK: lv => 5 + lv * 0.15,                                     // 连环：群攻每多打中一个敌人 +x%
  sgK: lv => 4 + lv * 0.12,                                     // 蚀骨：敌人身上每种状态 +x%
  xjK: lv => 15 + lv * 0.35, xjBoom: lv => 100 + lv * 1.5,      // 玄甲：有护体时伤害；护体打碎炸开
  ssK: lv => 15 + lv * 0.3, ssHeal: lv => 1 + lv * 0.02,       // 嗜杀：每层下一招伤害；杀一个回血
  tgK: lv => 30 + lv * 0.6,                                     // 天罡：放完必杀后的伤害
};
const LGEMS = {
  // ---- 留下的六颗特色玉 ----
  pain:  { n: '血煞玉', c: '#ff4a4a', d: lv => `攻击附带中毒：每回合 ${20 + lv}% 攻击`, st: lv => ({ poison: 20 + lv }) },
  ice:   { n: '寒髓玉', c: '#8fd0ff', d: lv => `定身几率 +${(5 + lv * 0.2).toFixed(1)}%，对定身敌人伤害 +${20 + lv}%`, st: lv => ({ freeze: 5 + lv * 0.2, frozenDmg: 20 + lv }) },
  greed: { n: '招财玉', c: '#f1c94a', d: lv => `银两获取 +${30 + lv * 2}%，福缘 +${10 + lv}%`, st: lv => ({ gf: 30 + lv * 2, mf: 10 + lv }) },
  guard: { n: '金钟玉', c: '#e8c13a', d: lv => `受到的伤害 -${(6 + lv * 0.3).toFixed(1)}%；气血低于 30% 时效果翻倍`, st: lv => ({ gDr: 6 + lv * 0.3 }) },
  bond:  { n: '同心玉', c: '#ff9ad0', d: lv => `同伴、Ngoc、僵尸的伤害和气血 +${15 + lv}%`, st: lv => ({ allyPct: 15 + lv }) },
  flow:  { n: '流光玉', c: '#9ae8ff', d: lv => `有冷却的招式放出后，${Math.min(CDSKIP_CAP, 10 + lv * 0.4).toFixed(1)}% 几率不进冷却（各处加起来最多 ${CDSKIP_CAP}%）`, st: lv => ({ cdSkip: 10 + lv * 0.4 }) },
  // ---- 本命玉：每门一颗 ----
  zhanhun: { n: '战魂玉', c: '#ff6a3a', cls: 'berserker', d: lv => `怒意获得 +${Math.round(20 + lv)}%；怒意过半时伤害 +${LGV.zhHalf(lv).toFixed(0)}%；气血每少 10%，伤害再 +${LGV.zhLow(lv).toFixed(1)}%（血海、修罗不死）`, st: lv => ({ furyGain: 20 + lv, lowHpK: LGV.zhLow(lv) }) },
  wuxing:  { n: '五行玉', c: '#c8a2ff', cls: 'mage', d: lv => `换一种五行出招时，${LGV.wxCh(lv).toFixed(0)}% 几率给目标挂上这种五行的状态（火灼烧、水冰冻、土破甲、木中毒、金眩晕）；「连」每层伤害再 +${(1.5 + lv * 0.06).toFixed(1)}%（归元、万符）`, st: lv => ({ lianPct: 1.5 + lv * 0.06 }) },
  shiwang: { n: '尸王玉', c: '#7fd08a', cls: 'necro', d: lv => `僵尸的伤害和气血 +${Math.round(20 + lv * 0.8)}%；尸位每空一个，你的中毒伤害 +${LGV.swPoi(lv).toFixed(0)}%（阴兵、五毒）`, st: lv => ({ minionPct: 20 + lv * 0.8 }) },
  duopo:   { n: '夺魄玉', c: '#a0a8ff', cls: 'assassin', d: lv => `杀意上限 +1；暗器（淬毒镖、冰魄针、漫天花雨）打中时 ${LGV.dpKi(lv).toFixed(0)}% 几率 +1 杀意；终结技伤害 +${LGV.dpFin(lv).toFixed(0)}%（七杀、千机）`, st: () => ({}) },
  jinshen: { n: '金身玉', c: '#ffd76a', cls: 'paladin', d: lv => `反震倍率 +${Math.round(30 + lv)}%；每次挨打反震，得到 ${LGV.jsSh(lv).toFixed(1)}% 最大气血的护体真气（罗汉、大日）`, st: lv => ({ thornK: 30 + lv }) },
  // ---- 打法玉：不绑门派，配对了套装才好用 ----
  lianhuan: { n: '连环玉', c: '#ffb060', d: lv => `群攻招式每多打中一个敌人，这一招伤害 +${LGV.lhK(lv).toFixed(1)}%（最多算 5 个）。配修罗不死、万符、千机、大日`, st: () => ({}) },
  shigu:    { n: '蚀骨玉', c: '#9ad86a', d: lv => `敌人身上每有一种状态，受到你的伤害 +${LGV.sgK(lv).toFixed(1)}%；你挂的状态多持续 1 回合。配万符、五毒、千机、归元`, st: () => ({}) },
  xuanjia:  { n: '玄甲玉', c: '#8ab0d8', d: lv => `身上有护体时伤害 +${LGV.xjK(lv).toFixed(0)}%；护体被打碎时炸开，对所有敌人造成 ${LGV.xjBoom(lv).toFixed(0)}% 伤害（两回合最多一次）。配大日、罗汉、五行道士`, st: () => ({}) },
  shisha:   { n: '嗜杀玉', c: '#e05a5a', d: lv => `每有一个敌人倒下：回复 ${LGV.ssHeal(lv).toFixed(1)}% 气血，下一招伤害 +${LGV.ssK(lv).toFixed(0)}%（最多叠 3 层，出招后清空）。配七杀、修罗不死、阴兵`, st: () => ({}) },
  tiangang: { n: '天罡玉', c: '#ffe08a', d: lv => `必杀蓄得快 ${Math.round(30 + lv * 0.5)}%；放完必杀后两招伤害 +${LGV.tgK(lv).toFixed(0)}%。配血海、大日这些靠必杀的打法`, st: lv => ({ xRage: 30 + lv * 0.5 }) },
  // 老存档里被删的灵玉：先放在这里，等玩家挑一颗新的换（等级保留）
  reforge:  { n: '待重铸的灵玉', c: '#8a8070', d: () => '这颗灵玉的效果删掉了：去「灵玉 · 重铸」挑一颗新的，等级原样保留', st: () => ({}), hide: true },
};
const LGEM_OLD = { power: '战神玉', life: '长生玉', zeal: '疾风玉', slay: '破军玉', renew: '回春玉' };
// 灵玉匣：通关后每个角色一个，不是掉出来的装备。自带一点气血和伤害（跟着幻境最高纪录涨），三个孔镶灵玉
const BOX_SLOTS = 3;
const boxStat = riftMax => 5 + Math.floor((riftMax || 0) / 10);

// 流派推荐：通关后每个门派两条路（对应两套幻境套装）。sk：[招式, 变招]；leg：腰带、副手上的神兵；cube：乾坤袋三格；gems：灵玉匣三颗
const BUILDS = {
  berserker: [
    { set: 'xuehai', d: '攒满怒意，霸王卸甲一刀定音，打妖王最快', sk: [['liedi', 'a'], ['bawang', 'a'], ['hanren', 'a'], ['warcry', 'b'], ['bloodlust', 'b']],
      leg: ['bawangdai', 'nutaoqiao'], cube: ['butcher', 'champion', 'yinxuejie'], gems: ['zhanhun', 'tiangang', 'guard'] },
    { set: 'busi', d: '压着血线转旋风刀，越残越疯，清群怪最快', sk: [['liedi', 'b'], ['whirl', 'a'], ['bloodlust', 'b'], ['warcry', 'a'], ['butui', 'b']],
      leg: ['xiuluodai', 'liediqiao'], cube: ['xuexuan', 'madman', 'pojunkui'], gems: ['zhanhun', 'guard', 'lianhuan'] } ],
  mage: [
    { set: 'guiyuan', d: '木火土金水一圈圈接下去，「连」满了每招四倍', sk: [['chain', 'b'], ['fireball', 'b'], ['luoshi', 'b'], ['jinguang', 'b'], ['frostnova', 'b']],
      leg: ['wuxingtao', 'taijixia'], cube: ['surge', 'hourglass', 'sanmei'], gems: ['wuxing', 'guard', 'shigu'] },
    { set: 'wanfu', d: '不管顺序，把状态挂满全场再引爆', sk: [['frostnova', 'a'], ['luoshi', 'b'], ['fireball', 'b'], ['lunzhuan', 'b'], ['meteor', 'a']],
      leg: ['baifudai', 'zhenxiexia'], cube: ['yinbaozhu', 'sanmei', 'surge'], gems: ['wuxing', 'shigu', 'guard'] } ],
  necro: [
    { set: 'yinbing', d: '尸群碾压：僵尸替你挨打，倒下还会炸', sk: [['summon', 'a'], ['jihuo', 'a'], ['yangshi', 'a'], ['bonestorm', 'b'], ['corpse', 'a']],
      leg: ['ganshisuo', 'shehunling'], cube: ['baigufan', 'shiwangguan', 'hanshipao'], gems: ['shiwang', 'bond', 'shisha'] },
    { set: 'duxing', d: '不带尸，一个人叠毒，再一次结算', sk: [['shidu', 'a'], ['tudun', 'a'], ['curse', 'b'], ['bonestorm', 'b']],
      leg: ['baigunang', 'caoren'], cube: ['surge', 'earth', 'soul'], gems: ['shiwang', 'pain', 'shigu'] } ],
  assassin: [
    { set: 'qisha', d: '攒杀意，终结技点杀；杀一个，刷新一次', sk: [['venom', 'a'], ['shadowstep', 'a'], ['dici', 'a'], ['deathmark', 'a'], ['shadowkill', 'b']],
      leg: ['cangfengdai', 'wuyingnang'], cube: ['duoming', 'yingsha', 'abyssEye'], gems: ['duopo', 'guard', 'tiangang'] },
    { set: 'qianji', d: '先上毒，暗器铺满全场', sk: [['venom', 'b'], ['fan', 'b'], ['bingpo', 'b'], ['yandun', 'a'], ['deathmark', 'b']],
      leg: ['qianjidai', 'baidunang'], cube: ['qianzhen', 'huoyannang', 'momentum'], gems: ['duopo', 'pain', 'shigu'] } ],
  paladin: [
    { set: 'luohan', d: '狮子吼拉住所有妖物，挨一下弹一下、攒满金刚震打全场，越打越硬', sk: [['aegis', 'a'], ['chanhou', 'b'], ['budong', 'b'], ['hammer', 'a'], ['prayer', 'a']],
      leg: ['fumodai', 'muyu'], cube: ['jinganglingo', 'earth', 'budongxiang'],   /* 2026-11-24 睚眦佩、荆棘铠换成金刚铃、镇山履（反击并进反震后睚眦佩只占 0.2% 伤害；300 层实测打小怪胜率 50%→64%） */ gems: ['jinshen', 'guard', 'xuanjia'] },
    { set: 'dari', d: '护体养着，主动出招追佛光', sk: [['hammer', 'b'], ['fuhu', 'a'], ['ganlu', 'a'], ['budong', 'a'], ['prayer', 'b']],
      leg: ['daridai', 'zijinbo'], cube: ['jingangchu', 'ganluping', 'hourglass'], gems: ['jinshen', 'xuanjia', 'tiangang'] } ],
};
// 改五行的变招（只有道士用得上）
const RUNE_WX = { luoshi: { a: 'jin' }, jinguang: { a: 'shui' }, lunzhuan: { a: 'tu' }, wulei: { a: 'mu' } };
const runeWx = (k, r) => (RUNE_WX[k.id] && RUNE_WX[k.id][r]) || k.wx;

const RIFT_THEMES = CHAPTERS;

const GOBLIN = { n: '招财金蟾', hp: 2.2, atk: 0, spd: 1.25, spr: 'toad', goblin: true };
const GOBLIN_FLEE = 7;
const RARE_ELITE_NAMES = ['碎骨老妖', '血眼婆婆', '无面鬼', '饿死鬼王二', '灰烬娘娘', '腐心老祖', '哑巴屠夫', '千牙怪', '黑棘山君', '哭坟女', '铁颚精', '九命猫妖'];

const DUNGEON_MODS = [
  { id: 'elites', n: '妖将横行', d: '每层多 2 个精英（迷宫里是精英房间）', r: '福缘 +25%', mf: 25 },
  { id: 'armored', n: '铜皮铁骨', d: '妖物护甲 +60%', r: '福缘 +15%，经验 +15%', mf: 15, xp: 15 },
  { id: 'brutal', n: '凶煞', d: '妖物伤害 +30%', r: '经验 +30%，福缘 +10%', mf: 10, xp: 30 },
  { id: 'hardy', n: '百年道行', d: '妖物气血 +50%', r: '福缘 +25%，经验 +20%', mf: 25, xp: 20 },
  { id: 'scarce', n: '囊中羞涩', d: '不带丹药，货郎也不卖', r: '银两 +100%，福缘 +10%', mf: 10, gf: 100 },
  { id: 'dark', n: '伸手不见五指', d: '看不见隔壁房间里有什么；幻境里视野只剩一半多', r: '福缘 +20%', mf: 20 },
];

// 修为（原巅峰等级）：满级后所有角色共享
const PARAGON_STATS = [
  // 根基（root）：乘在最终的攻击／护甲／气血上，不和套装、灵玉那一堆百分比加在一起稀释。每项 50 点封顶（+100%）
  { k: 'pAtk', n: '攻击', v: 2, cap: 100, root: 1 },
  { k: 'pArmor', n: '护甲', v: 2, cap: 100, root: 1 },
  { k: 'pHp', n: '气血', v: 2, cap: 100, root: 1 },
  { k: 'dmgPct', n: '伤害', v: 1 },
  { k: 'hpPct', n: '最大气血', v: 1 },
  { k: 'armorPct', n: '护甲', v: 2 },
  { k: 'critDmg', n: '暴击伤害', v: 2 },
  { k: 'crit', n: '暴击率', v: 0.5, cap: 50 },
  { k: 'spd', n: '速度', v: 0.5, cap: 40 },
  { k: 'res', n: '全抗', v: 0.5, cap: 60 },
  { k: 'mf', n: '福缘', v: 2 },
  { k: 'gf', n: '银两获取', v: 3 },
];
const REALMS = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙'];
const realmName = lv => { const i = Math.floor(lv / 10); return (REALMS[Math.min(i, REALMS.length - 1)] + (i >= REALMS.length ? ` ${lv - (REALMS.length - 1) * 10} 重` : ` ${lv % 10 + 1} 重`)); };

// 营地建筑（ch = 通关第几章后开张）
const BUILDINGS = [
  { id: 'alchemist', n: 'Ngoc 的药铺', ch: 0, max: 3, gold: 500, mats: 6, npc: 'ngoc',
    d: lv => `每局多带 ${lv} 颗丹药，丹药恢复量 +${lv * 10}%` },
  { id: 'smith', n: '张大锤铸剑坊', ch: 0, max: 5, gold: 600, mats: 15, npc: 'smith',
    d: lv => `强化上限 +${5 + lv}，强化成功率 +${lv * 3}%` },
  { id: 'warehouse', n: '库房', ch: 0, max: 4, gold: 400, mats: 5,
    d: lv => `储物箱容量 ${120 + lv * 40} 格` },
  { id: 'merchant', n: '钱多多钱庄', ch: 1, max: 4, gold: 700, mats: 8, npc: 'merchant',
    d: lv => `地底货郎多卖 ${lv} 件货，赌石便宜 ${lv * 8}%，出售价格 +${lv * 10}%` },
  { id: 'barracks', n: '雷老虎镖局', ch: 2, max: 3, gold: 800, mats: 12, npc: 'biaotou',
    d: lv => `可以同时押 ${1 + lv} 趟镖，押镖收益 +${lv * 20}%` },
  { id: 'jewel', n: '玉器坊', ch: 3, max: 3, gold: 500, mats: 10,
    d: lv => `玉石最高可合成到「${GEM_TIERS[Math.min(4, 2 + lv)]}」，合成费用 -${lv * 20}%${lv >= 3 ? '，取下玉石免费' : ''}` },
];
const FEATURE_CH = { reroll: 2, enhance: 4, sockets: 5, gems: 5, cube: 6, runes: 7 };

const DISPATCH = [
  { h: 1, n: '押短镖', d: '1 小时' },
  { h: 4, n: '押长镖', d: '4 小时' },
  { h: 8, n: '走西域', d: '8 小时' },
];

const BOUNTY_POOL = [
  { id: 'kill',  t: n => `斩妖 ${n} 只`, n: [60, 120], ev: 'kill' },
  { id: 'elite', t: n => `击杀 ${n} 只精英妖物`, n: [4, 8], ev: 'elite' },
  { id: 'clear', t: () => '打通任意一章', n: [1, 1], ev: 'clear' },
  { id: 'rift',  t: () => '闯过一次九幽幻境', n: [1, 1], ev: 'rift', rift: true },
  { id: 'chest', t: n => `打开 ${n} 个宝箱`, n: [2, 4], ev: 'chest' },
  { id: 'event', t: n => `完成 ${n} 次奇遇`, n: [3, 6], ev: 'event' },
  { id: 'boss',  t: n => `击败 ${n} 个首领`, n: [2, 4], ev: 'boss' },
  { id: 'room',  t: n => `探索 ${n} 个房间`, n: [40, 80], ev: 'room' },
  { id: 'forge', t: n => `在铸剑坊强化 ${n} 次`, n: [2, 4], ev: 'forge' },
];

const BESTIARY_TIERS = [50, 200, 1000];

const ACHIEVEMENTS = [
  { id: 'ch1',    n: '初入江湖',   d: '打通第一章',               st: { dmgPct: 2 },  chk: S => storyCleared('normal') >= 1 },
  { id: 'ch5',    n: '小有名气',   d: '打通第五章',               st: { hpPct: 3 },   chk: S => storyCleared('normal') >= 5 },
  { id: 'ch10',   n: '镇魔英雄',   d: '打通全部十章',             st: { dmgPct: 5 },  chk: S => storyCleared('normal') >= 10 },
  { id: 'clrNM',  n: '修罗归来',   d: '在修罗难度打通全部十章',   st: { hpPct: 5 },   chk: S => storyCleared('nightmare') >= 10 },
  { id: 'clrH',   n: '炼狱不灭',   d: '在炼狱难度打通全部十章',   st: { dmgPct: 8 },  chk: S => storyCleared('hell') >= 10 },
  { id: 'r10',    n: '幻境行者',   d: '闯过九幽幻境 10 层',       st: { mf: 10 },     chk: S => S.riftMax >= 10 },
  { id: 'r25',    n: '幻境老手',   d: '闯过九幽幻境 25 层',       st: { dmgPct: 3 },  chk: S => S.riftMax >= 25 },
  { id: 'r50',    n: '幻境宗师',   d: '闯过九幽幻境 50 层',       st: { hpPct: 5 },   chk: S => S.riftMax >= 50 },
  { id: 'r100',   n: '九幽之主',   d: '闯过九幽幻境 100 层',      st: { dmgPct: 10 }, chk: S => S.riftMax >= 100 },
  { id: 'k500',   n: '斩妖除魔',   d: '累计斩妖 500 只',          st: { gf: 10 },     chk: S => S.stats.kills >= 500 },
  { id: 'k5000',  n: '千人斩',     d: '累计斩妖 5000 只',         st: { critDmg: 10 },chk: S => S.stats.kills >= 5000 },
  { id: 'k50000', n: '杀神',       d: '累计斩妖 50000 只',        st: { dmgPct: 5 },  chk: S => S.stats.kills >= 50000 },
  { id: 'leg',    n: '神兵出世',   d: '获得第一件神兵',           st: { mf: 5 },      chk: S => !!S.flags.legend },
  { id: 'set4',   n: '套装大师',   d: '任意角色穿齐一套 4 件套',  st: { res: 3 },     chk: S => !!S.flags.set4 },
  { id: 'anc',    n: '上古之力',   d: '获得一件上古装备',         st: { dmgPct: 2 },  chk: S => !!S.flags.ancient },
  { id: 'pri',    n: '太古神器',   d: '获得一件太古装备',         st: { dmgPct: 5 },  chk: S => !!S.flags.primal },
  { id: 'plus10', n: '铸剑大师',   d: '把一件装备强化到 +10',     st: { armorPct: 5 },chk: S => !!S.flags.plus10 },
  { id: 'gob10',  n: '财神附体',   d: '击杀 10 只招财金蟾',       st: { gf: 20 },     chk: S => S.stats.goblins >= 10 },
  { id: 'cube10', n: '乾坤在握',   d: '乾坤袋收藏 10 种神兵特效', st: { mf: 10 },     chk: S => Object.keys(S.cube).length >= 10 },
  { id: 'cubeAll',n: '神兵谱',     d: '乾坤袋收藏全部神兵特效',   st: { dmgPct: 8 },  chk: S => Object.keys(S.cube).length >= LEGENDS.length },
  { id: 'all20',  n: '五门皆通',   d: '五个职业都达到 20 级',     st: { hpPct: 3 },   chk: S => CLASS_IDS.every(c => S.chars[c].level >= 20) },
  { id: 'p10',    n: '筑基',       d: '修为达到 10 级',           st: { res: 3 },     chk: S => S.para.lv >= 10 },
  { id: 'p50',    n: '化神',       d: '修为达到 40 级',           st: { dmgPct: 5 },  chk: S => S.para.lv >= 40 },
  { id: 'best20', n: '百妖谱',     d: '妖物图鉴达成 20 个阶段',   st: { dmgPct: 3 },  chk: S => bestiaryTiers() >= 20 },
  { id: 'bnt10',  n: '赏金猎人',   d: '完成 10 个江湖悬赏',       st: { gf: 15 },     chk: S => S.stats.bounties >= 10 },
  { id: 'lg25',   n: '养玉大师',   d: '把一块灵玉升到 25 级',     st: { critDmg: 10 },chk: S => S.lgems.some(g => g.lv >= 25) },
];

// ============ 九幽幻境 · 大秘境 ============
// 限时：一炷香 = 13 分钟（毫秒）。地图上按真实时间走；战斗里按读条折算（一轮 3 秒，和战斗倍速、跳不跳过无关）
const RIFT_CLOCK = { room: 35 };
var RIFT_LIMIT = 13 * 60 * 1000;   // 原来 12 分钟；守关妖王血量 ×1.6 后多给 1 分钟
const riftLimit = N => RIFT_LIMIT;
// 剩下多少香 → 灵玉升级次数、下次最多能挑战高几层
const RIFT_GRADES = [
  { min: 0.5,  n: '神速', upg: 5, jump: 10 },   // 2026-11-24 跳层放大（原来 +3 / +2）：打得快的号能尽快打到吃力的层数
  { min: 0.25, n: '迅捷', upg: 4, jump: 5 },
  { min: 0, n: '从容', upg: 3, jump: 1 },
  { min: -1,   n: '香尽', upg: 1, jump: 0 },
];

// 幻境套装：每个职业一套 6 件，只在幻境 RSET_LV 层以上掉落
const RSET_LV = 20;
SETS.push(
  { id: 'xuehai', n: '血海无涯', cls: 'berserker', rift: true,
    pieces: [['helm', '血海战盔'], ['chest', '血海战甲'], ['gloves', '血海护腕'], ['boots', '血海战靴'], ['ring', '血海扳指'], ['amulet', '血海护心镜']],
    b2: { furyGain: 30, hpPct: 10, xDr: 35 }, b2d: '怒意获得 +30%，最大气血 +10%，受到的伤害 -35%',
    b4: 'xueHai4', b4d: '霸王卸甲只吃掉一半怒意；怒意过半时，受到的伤害再 -35%',
    b6: 'xueHai6', b6d: '每 1 点怒意，伤害 +3%（满怒 +300%）；霸王卸甲伤害翻倍' },
  { id: 'guiyuan', n: '五行归元', cls: 'mage', rift: true,
    pieces: [['helm', '归元道冠'], ['chest', '归元法衣'], ['gloves', '归元护腕'], ['boots', '归元云履'], ['ring', '归元扳指'], ['amulet', '归元玉佩']],
    b2: { lianPct: 4, elem: 20, xDr: 40 }, b2d: '每层「连」的伤害加成再 +4%，术法伤害 +20%，受到的伤害 -40%',
    b4: 'guiYuan4', b4d: '换一种五行出招，「连」一次 +2，这一招伤害 +40%',
    b6: 'guiYuan6', b6d: '「连」叠满时，这一招伤害 ×4，并以 60% 的伤害波及其余所有敌人' },
  { id: 'yinbing', n: '阴兵借道', cls: 'necro', rift: true,
    pieces: [['helm', '阴兵斗笠'], ['chest', '阴兵寿衣'], ['gloves', '阴兵指套'], ['boots', '阴兵草鞋'], ['ring', '阴兵扳指'], ['amulet', '阴兵铜铃']],
    b2: { minion: 1, minionPct: 20 }, b2d: '尸位 +1，僵尸强度 +20%',
    b4: 'yinBing4', b4d: '僵尸倒下时炸开，按它最大气血的 50% 打所有敌人',
    b6: 'yinBing6', b6d: '僵尸的伤害 ×2；每有一具僵尸在场，你受到的伤害 -7%；一下打掉你超过 25% 气血的部分，由僵尸替你挡' },
  { id: 'qisha', n: '七杀', cls: 'assassin', rift: true,
    pieces: [['helm', '七杀面罩'], ['chest', '七杀夜行衣'], ['gloves', '七杀指套'], ['boots', '七杀软靴'], ['ring', '七杀扳指'], ['amulet', '七杀玉佩']],
    b2: { crit: 8, critDmg: 30, xDr: 45 }, b2d: '暴击率 +8%，暴击伤害 +30%，受到的伤害 -45%',
    b4: 'qiSha4', b4d: '杀意上限 +2；终结技用完后返还 2 点杀意',
    b6: 'qiSha6', b6d: '终结技伤害 ×6；终结技杀死目标时，冷却立刻清零' },
  { id: 'luohan', n: '罗汉金身', cls: 'paladin', rift: true,
    pieces: [['helm', '罗汉僧帽'], ['chest', '罗汉袈裟'], ['gloves', '罗汉护腕'], ['boots', '罗汉僧鞋'], ['ring', '罗汉扳指'], ['amulet', '罗汉念珠']],
    b2: { armorPct: 30, thornK: 150 }, b2d: '护甲 +30%，反震倍率 +150%（反震 = 你的攻击 × 反震倍率，每挨一下打弹一下；伙伴晕住的妖物也吃一次，妖物打伙伴你替他弹一半）',
    b4: 'luoHan4', b4d: '狮子吼嘲讽期间：反震翻倍，每次反震攒两层「震」（金刚震来得快一倍）',
    b6: 'luoHan6', b6d: '每次反震有一半几率叠一层「佛怒」（这场战斗内，最多 10 层）：每层伤害 +20%，受到的伤害 -4%；反震伤害的一成回给自己' },
);
// 第二套幻境套装：RSET2_LV 层起掉。上面那五套是把本门的招牌机制推到头；这五套换一种打法，用的是上面不碰的招式
const RSET2_LV = 30;
SETS.push(
  { id: 'busi', n: '修罗不死', cls: 'berserker', rift: true, rlv: RSET2_LV,
    pieces: [['helm', '不死战盔'], ['chest', '不死战甲'], ['gloves', '不死护腕'], ['boots', '不死战靴'], ['ring', '不死扳指'], ['amulet', '不死护心镜']],
    b2: { leech: 5, hpPct: 12, xDr: 35 }, b2d: '吸血 +5%，最大气血 +12%，受到的伤害 -35%',
    b4: 'buSi4', b4d: '旋风刀、裂地斩冷却 -1，每打中一个敌人恢复 3% 气血；只剩一个敌人也能放旋风刀',
    b6: 'buSi6', b6d: '气血每少 1%，伤害 +4%；旋风刀、裂地斩伤害 ×5；每场战斗一次：挨了致命一击不倒，留 1 点气血，并进入 3 回合「不退」',
    need: ['liedi', 'whirl'], tip: '靠旋风刀、裂地斩清场，两招都要带上' },
  { id: 'wanfu', n: '万符归宗', cls: 'mage', rift: true, rlv: RSET2_LV,
    pieces: [['helm', '万符道冠'], ['chest', '万符法衣'], ['gloves', '万符护腕'], ['boots', '万符云履'], ['ring', '万符扳指'], ['amulet', '万符玉佩']],
    b2: { elem: 25, hpPct: 8, xDr: 40 }, b2d: '术法伤害 +25%，最大气血 +8%，受到的伤害 -40%',
    b4: 'wanFu4', b4d: '你的招式给一个敌人挂上状态时，同样的状态蔓延给所有敌人；敌人身上每有一种状态，受到你的伤害 +50%；挂状态的招式出手时，补一层护身符箓',
    b6: 'wanFu6', b6d: '引爆符不再把状态清掉，每种状态的加成从 +120% 提到 +170%，并以 80% 的伤害波及其余所有敌人；引爆符冷却 -1',
    need: ['lunzhuan'], tip: '带上引爆符，再带两三招能挂状态的（真火符、寒冰诀、落石诀）' },
  { id: 'duxing', n: '五毒独行', cls: 'necro', rift: true, rlv: RSET2_LV,
    pieces: [['helm', '独行斗笠'], ['chest', '独行蛊衣'], ['gloves', '独行指套'], ['boots', '独行草鞋'], ['ring', '独行扳指'], ['amulet', '独行蛊坛']],
    b2: { poisonPct: 60, hpPct: 15, xDr: 30 }, b2d: '中毒伤害 +60%，最大气血 +15%，受到的伤害 -30%',
    b4: 'duXing4', b4d: '尸位每空一个（最多算 4 个）：你的伤害 +60%，受到的伤害 -13%；镇魂钉附带中毒；没有僵尸也能放百鬼夜行',
    b6: 'duXing6', b6d: '中毒可以叠加（最多 8 层）；尸毒蔓、土遁葬打中带毒的敌人时，把它身上剩下的毒伤按三倍立刻结算一遍（毒不消失）',
    need: ['shidu', 'tudun'], tip: '不召僵尸，一个人下毒。带上尸毒蔓、土遁葬；把摇铃唤尸换下来' },
  { id: 'qianji', n: '千机', cls: 'assassin', rift: true, rlv: RSET2_LV,
    pieces: [['helm', '千机面罩'], ['chest', '千机夜行衣'], ['gloves', '千机指套'], ['boots', '千机软靴'], ['ring', '千机扳指'], ['amulet', '千机匣']],
    b2: { crit: 6, poisonPct: 50, xDr: 50 }, b2d: '暴击率 +6%，中毒伤害 +50%，受到的伤害 -50%',
    b4: 'qianJi4', b4d: '暗器招式（淬毒镖、冰魄针、漫天花雨）冷却 -1；淬毒镖的毒沾到所有敌人；只剩一个敌人也能放漫天花雨',
    b6: 'qianJi6', b6d: '暗器招式打中带毒的敌人：必定暴击，伤害 ×6；漫天花雨每打中一个敌人，杀意 +1',
    need: ['venom', 'fan'], tip: '带上淬毒镖、漫天花雨，最好再带冰魄针；留一招终结技花杀意' },
  { id: 'dari', n: '大日如来', cls: 'paladin', rift: true, rlv: RSET2_LV,
    pieces: [['helm', '大日僧帽'], ['chest', '大日袈裟'], ['gloves', '大日护腕'], ['boots', '大日僧鞋'], ['ring', '大日扳指'], ['amulet', '大日念珠']],
    b2: { healPct: 25, hpPct: 10, xDr: 35 }, b2d: '治疗效果 +25%，最大气血 +10%，受到的伤害 -35%',
    b4: 'daRi4', b4d: '每回合获得 12% 最大气血的护体真气；回血溢出的部分也变成护体（最多攒到最大气血的 50%）',
    b6: 'daRi6', b6d: '身上有护体真气时：伤害 +150%；每次施放有冷却的招式，追加一道佛光，对所有敌人造成 200% 伤害',
    tip: '什么招式都能带；冷却短的招式越多，佛光追得越勤' },
);
STAT_NAMES.furyGain = STAT_NAMES.furyGain || '怒意获得';
STAT_NAMES.lianPct = STAT_NAMES.lianPct || '每层「连」伤害';
// 2026-11-24 反击并进反震，反击几率这个属性没有了

// 九幽词条（2026-11-24）：九幽品质的装备多长一条，按部位各两种（一种偏输出、一种偏生存），通用效果，不放大套装机制。
// st：直接算到这个属性上；没有 st 的在战斗里单独处理。两枚扳指共用扳指的池子；同一个词条穿两件不叠加，算高的那件
const JY_AFF = {
  liepo:    { slot: 'weapon',  n: '裂魄', r: [30, 50],  st: 'xBoss',    d: v => `打首领、精英伤害 +${v}%` },
  tuntian:  { slot: 'weapon',  n: '吞天', r: [2, 3],                    d: v => `这场每倒下一只妖物，伤害 +${v}%（最多 +${v * 10}%）` },
  lingtai:  { slot: 'helm',    n: '灵台', r: [40, 60],  st: 'xRage',    d: v => `必杀怒气攒得快 ${v}%` },
  dingshen: { slot: 'helm',    n: '定神', r: [30, 50],  st: 'xTen',     d: v => `每场第一次被眩晕、冰冻直接免掉；之后再被控制，有 ${v}% 几率免掉` },
  xuanming: { slot: 'chest',   n: '玄冥', r: [25, 40],                  d: v => `开战获得最大气血 ${v}% 的护体` },
  bumie:    { slot: 'chest',   n: '回魂', r: [20, 30],                  d: v => `每场一次：挨了致命伤不倒，回复 ${v}% 气血（和其他免死各算各的）` },
  pojia:    { slot: 'gloves',  n: '洞穿', r: [20, 35],                  d: v => `无视妖物 ${v}% 的护甲和全抗` },
  lianhuan: { slot: 'gloves',  n: '疾影', r: [8, 15],                   d: v => `出手后有 ${v}% 几率马上再出手一次` },
  tayou:    { slot: 'boots',   n: '踏幽', r: [15, 25],  st: 'spd',      d: v => `速度 +${v}%` },
  xianji:   { slot: 'boots',   n: '先机', r: [60, 90],  st: 'xFirst',   d: v => `开战读条直接 +${v}（几乎必定先手）` },
  shihun:   { slot: 'ring',    n: '噬魂', r: [2, 4],                    d: v => `暴击时回复这一击伤害 ${v}% 的气血` },
  duoming:  { slot: 'ring',    n: '索命', r: [40, 60],  st: 'xExec',    d: v => `对气血低于 30% 的敌人伤害 +${v}%` },
  tongyou:  { slot: 'amulet',  n: '通幽', r: [10, 15],                  d: v => `每回合有 ${v}% 几率让一招冷却中的招式直接转好` },
  tongpao:  { slot: 'amulet',  n: '同袍', r: [30, 50],                  d: v => `带的伙伴伤害和气血 +${v}%（僵尸不算）` },
  huiyuan:  { slot: 'belt',    n: '生息', r: [3, 5],    st: 'regenPct', d: v => `每回合回复最大气血 ${v}%` },
  panshi:   { slot: 'belt',    n: '坚岳', r: [15, 25],                  d: v => `气血高于七成时，受到的伤害 -${v}%（算在减伤七成封顶里）` },
  huixin:   { slot: 'offhand', n: '碎心', r: [80, 120], st: 'critDmg',  d: v => `暴击伤害 +${v}%` },
  shentong: { slot: 'offhand', n: '神通', r: [20, 30],                  d: v => `所有招式伤害 +${v}%` },
};
const jyText = jy => { const A = jy && JY_AFF[jy[0]]; return A ? `${A.n}：${A.d(jy[1])}` : ''; };

// 镇妖录：幻境里收服妖物的精魄。一章一页，层数越高精魄品级越高（一品到十品）
// 一品 1–19 层，二品 20–39，三品 40–59，四品 60–79，五品 80–103；往上每 24 层一品：六品 104，七品 128，八品 152，九品 176，十品 200
const zyGrade = N => N < 80 ? 1 + Math.floor(N / 20) : Math.min(10, 5 + Math.floor((N - 80) / 24));
const ZY_CN = ['', '一品', '二品', '三品', '四品', '五品', '六品', '七品', '八品', '九品', '十品'];
const ZY_NEED = 5;   // 一页收服首领 + 至少 5 种妖物，就能读到这一页的后记
const ZY_PAGES = [
  { st: { hpPct: 0.3 }, sd: '最大气血',
    hou: '幻境里的县令还在升堂，一遍又一遍。刘师傅听说了，揣着那方旧官印去了一趟乱葬岗，对着空坟拱手，打了半天官腔，最后只说了两个字：「退堂。」\n那以后，幻境里的县令再出来，惊堂木拍得轻了些。' },
  { st: { critDmg: 0.8 }, sd: '暴击伤害',
    hou: '黑风林的狼窝后来又有了动静。雷老虎带小虎去看过，远远地，一只母狼叼着崽子钻进石缝，回头看了他们一眼。\n小虎说它在点头。雷老虎说你看错了，回去的路上，却把腰刀收进了鞘里。' },
  { st: { dmgPct: 0.25 }, sd: '伤害',
    hou: '康总管往盘丝洞送过一面铜镜，用红绸包着，说是「生意往来」。镜子立在洞口，一直没人照。\n直到有一天夜里，镜面上蒙了一层细细的丝，像有人对着它，仔仔细细地梳了很久的头。' },
  { st: { armorPct: 0.6 }, sd: '护甲',
    hou: '铁蛋给石魔打的那颗「心」，最后没装进去。他把它带回铸剑坊，挂在炉子边上。张大锤嫌占地方，铁蛋说：「它说烫，我想让它凉一凉。」\n每回出炉，他都往那块铁上浇一瓢水。「滋」的一声，像一口长长的叹气。' },
  { st: { res: 0.2 }, sd: '全抗',
    hou: '蛇母蜕下的那张皮，照她的魂在黄泉路上托付的，交到了沼泽边的老渔婆手里。老渔婆把它晾干，挂在船头，每天出船前摸一下。\n有人问她怕不怕。她说：「怕什么。就是个被人骗了三百年的傻姑娘。」' },
  { st: { hpPct: 0.3 }, sd: '最大气血',
    hou: '镇上那个不说话的磨刀老头，把玄冰子的剑挂在了磨刀摊上头。剑不卖，也不磨。有人问起，他头一回开了口：「祖上欠一个送饭的孩子一条命。还上了。」\n幻境里的玄冰子还是冷着脸出剑。可每次倒下之前，他都会朝你这边看一眼，像在确认——这回，小师弟没再弄丢。' },
  { st: { mf: 1, gf: 2 }, sd: '福缘、银两获取',
    hou: '鬼货郎用一段记忆换了一段给你：鬼王生前是个看庙的。庙塌了，他就一直等，等有人给他盖一座新的；等到后来，什么人许的庙他都信。\n中元那天，有人在鬼市口用纸扎了一座小庙，一把火烧了。那以后，鬼市的灯笼每个月圆都亮得齐齐整整，一盏不少。' },
  { st: { xBoss: 0.4 }, sd: '对首领、精英的伤害',
    hou: '白云观改成了正气书院。后院那座丹炉拆了，炉膛里刮出厚厚一层灰。珍姑娘把灰埋在山脚，没立碑。\n小虎问她埋的是谁。她说：「一个怕死的人。」过了一会儿，又说：「……也是一个三百年没睡过一个好觉的人。」' },
  { st: { crit: 0.08 }, sd: '暴击率',
    hou: '牛头马面今年的年终考核，破天荒评了个「优」。考评上写：「鬼门关秩序井然，外逃鬼魂为零。」落款旁边有人用小字补了一句：「特别感谢青石镇刘师爷协助办理路引。」\n刘师傅把抄件裱起来挂在义庄，逢人便说：「公家的事，还得公家人来办。」' },
  { st: { dmgPct: 0.25 }, sd: '伤害',
    hou: '九幽深渊安静了。幻境里的魔尊，不过是深渊记得的一个影子——它记得被锁住的三百年，也记得最后那一刻：五枚钉子一齐亮起来，第五枚钉子上，站着一个回来补钉的少年。\n镇妖录写到这一页，就写满了。' },
];
// 役使：收服一章首领的精魄后，可以带着它的本事上阵；每个角色带 2 只。g = 那只首领精魄的品级（1–10）
const YI_STUN = g => Math.min(60, 16 + g * 6), YI_HOOK = g => Math.min(30, 8 + g * 3);
const YISHI = {
  xianling: { pg: 0, n: '惊堂木', d: g => `开战时惊堂木一拍：每个敌人有 ${YI_STUN(g)}% 几率被震晕（首领减半）` },
  langwang: { pg: 1, n: '狼群', d: g => `你每次出手后，有 ${18 + g * 5}% 几率引来狼影扑咬目标，造成 ${60 + g * 20}% 伤害` },
  zhizhu:   { pg: 2, n: '缠丝', d: g => `开战时给所有敌人缠上蛛丝：冰冻（变慢）${2 + Math.ceil(g / 2)} 回合` },
  shimo:    { pg: 3, n: '熔心', d: g => `挨打时有 ${15 + g * 5}% 几率熔岩反溅，对出手的敌人造成 ${80 + g * 30}% 火焰伤害并灼烧` },
  shemu:    { pg: 4, n: '蜕皮', d: g => `每场战斗一次：气血低于 35% 时蜕皮，恢复 ${14 + g * 5}% 最大气血，清掉身上的中毒、灼烧、冰冻和眩晕` },
  xuanbing: { pg: 5, n: '封镇', d: g => `对眩晕或冰冻（变慢）中的敌人伤害 +${12 + g * 6}%` },
  guiwang:  { pg: 6, n: '鬼市', d: g => `福缘 +${12 + g * 8}%，银两获取 +${20 + g * 10}%（刷宝用）` },
  qingxu:   { pg: 7, n: '丹火护体', d: g => `每场战斗开始时，获得 ${8 + g * 4}% 最大气血的护体` },
  niuma:    { pg: 8, n: '勾魂', d: g => `普通妖物气血低于 ${YI_HOOK(g)}% 时，直接被勾走（精英和首领不算）` },
  mozun:    { pg: 9, n: '魔气', d: g => `伤害 +${8 + g * 4}%，但受到的伤害 +8%` },
};
