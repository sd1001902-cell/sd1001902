// ============ 九幽回廊 · 游戏内容数据（中式暗黑） ============

const SLOTS = [
  { id: 'weapon', n: "Binh khí", s: "Binh" },
  { id: 'helm',   n: "Mũ", s: "Mũ" },
  { id: 'chest',  n: "Áo giáp", s: "Giáp" },
  { id: 'gloves', n: "Hộ uyển", s: "Tay" },
  { id: 'boots',  n: "Giày", s: "Giày" },
  { id: 'ring',   n: "Nhẫn", s: "Nhẫn" },
  { id: 'amulet', n: "Ngọc bội", s: "Bội" },
  // 通关后随幻境最高纪录逐个开的位置（rift：要打到第几层）。ring2 没有自己的装备，戴的是第二枚扳指
  { id: 'belt',    n: "Thắt lưng", s: "Đai", rift: 10 },
  { id: 'offhand', n: "Tay phụ", s: "Phụ", rift: 20 },
  { id: 'ring2',   n: "Nhẫn·2", s: "Giới", rift: 30, type: 'ring' },
];
const SLOT_IDS = SLOTS.filter(s => !s.rift).map(s => s.id);   // 剧情里就有的七个位置（也是会掉的七种装备）
const POS_IDS = SLOTS.map(s => s.id);                         // 身上所有的位置
const X_ITEM_SLOTS = SLOTS.filter(s => s.rift && !s.type).map(s => s.id);   // 通关后新增的装备种类：腰带、副手
const slotType = pos => (SLOTS.find(s => s.id === pos) || {}).type || pos;
const OFFHAND_BASE = { berserker: "Vỏ đao", mage: "Hộp bùa", necro: "Chuông dẫn hồn", assassin: "Túi tiêu", paladin: "Mõ gỗ" };
const SLOT_NAME = Object.fromEntries(SLOTS.map(s => [s.id, s.n]));
const MAX_SOCKETS = { weapon: 3, helm: 2, chest: 3, gloves: 1, boots: 1, ring: 1, amulet: 1, belt: 1, offhand: 1 };

const RARITY = {
  normal: { n: "Phàm phẩm", aff: [0, 0] },
  magic:  { n: "Linh phẩm", aff: [1, 2] },
  rare:   { n: "Bảo phẩm", aff: [3, 4] },
  set:    { n: "Bộ", aff: [2, 2] },
  legend: { n: "Thần binh", aff: [2, 3] },
};
const RARITY_ORDER = ['normal', 'magic', 'rare', 'set', 'legend'];

const STAT_NAMES = {
  atk: "Công", hp: "Khí huyết", armor: "Hộ giáp", crit: "Tỉ lệ chí mạng", critDmg: "ST chí mạng",
  spd: "Tốc độ", leech: "Hút máu", res: "Kháng toàn bộ", dmgPct: "Sát thương", elem: "ST thuật pháp",
  hpPct: "Khí huyết tối đa", armorPct: "Hộ giáp", atkPct: "Công", thornK: "Bội số phản chấn", thornDmg: "Sát thương phản chấn", lowHpK: "Tăng sát thương khi ít máu", regen: "Hồi khí huyết mỗi lượt", thorns: "Sát thương phản chấn",
  mf: "Phúc duyên", gf: "Thu hoạch bạc", freeze: "Tỉ lệ bất động", minion: "Giới hạn số cương thi",
  dodge: "Né tránh", poison: "Đòn đánh gây trúng độc", minionPct: "Sức mạnh cương thi", healPct: "Hiệu quả trị liệu", eva: "Né tránh", skd: "Sát thương một chiêu",
  xFirst: "Ra tay trước (thanh lượt)", xBoss: "Sát thương lên thủ lĩnh, tinh anh", xExec: "Trảm sát (sát thương lên địch sắp chết)", xBreak: "Phá thế (sát thương lên địch đang tụ lực)",
  // 稀有词条（只能洗炼出）和灵玉用到的
  xDouble: "Liên trảm (tỉ lệ bồi thêm một đòn sau khi ra tay)", xRage: "Nộ khí bí kỹ nhận được", xTen: "Thanh thần (kháng choáng, bất động)", xDr: "Giảm sát thương phải nhận", xLast: "Bất khuất (giảm sát thương khi khí huyết dưới 30%)",
  xHaste: "Tật hành (tốc độ hai lượt đầu trận)", xKill: "Tham lang (hồi khí huyết mỗi lần giết địch)", cdSkip: "Tỉ lệ chiêu không vào hồi chiêu", xLuck: "Tỉ lệ rơi thần binh", xShield: "Bàn thạch (vào trận có sẵn hộ thể, theo khí huyết tối đa)",
  regenPct: "Hồi khí huyết mỗi lượt", xCritNext: "Hội tâm (sát thương chiêu kế sau khi chí mạng)", allyPct: "Sát thương và khí huyết của đồng hành, cương thi",
};
const PCT_STATS = new Set(['thorns', 'eva', 'skd', 'crit', 'critDmg', 'leech', 'res', 'dmgPct', 'elem', 'hpPct', 'armorPct', 'atkPct', 'thornK', 'thornDmg', 'lowHpK', 'mf', 'gf', 'freeze', 'dodge', 'poison', 'minionPct', 'healPct', 'xBoss', 'xExec', 'xBreak',
  'xDouble', 'xRage', 'xTen', 'xDr', 'xLast', 'xHaste', 'xKill', 'cdSkip', 'xLuck', 'xShield', 'regenPct', 'xCritNext', 'allyPct']);

const BASES = {
  weapon: [["Dao rựa", 1], ["Kiếm sắt", 1], ["Thanh Phong Kiếm", 8], ["Cửu Hoàn Đao", 16], ["Huyền Thiết Trọng Kiếm", 26], ["Trảm Yêu Kiếm", 40]],
  helm:   [["Khăn vải", 1], ["Nón lá", 8], ["Mũ sắt", 18], ["Kim quan buộc tóc", 30], ["Mặt nạ quỷ", 42]],
  chest:  [["Áo vải", 1], ["Giáp da", 8], ["Giáp xích", 18], ["Giáp vảy cá", 30], ["Minh Quang Khải", 42]],
  gloves: [["Hộ uyển vải", 1], ["Hộ uyển sắt", 10], ["Hổ trảo", 24], ["Hộ uyển vảy rồng", 40]],
  boots:  [["Dép cỏ", 1], ["Ủng vải", 10], ["Giày sắt", 24], ["Đạp Vân Ngoa", 40]],
  ring:   [["Nhẫn", 1]],
  amulet: [["Ngọc bội", 1]],
  belt:   [["Đai vải", 1], ["Đai da", 12], ["Đai khóa đồng", 26], ["Đai vân mãng", 40]],
  offhand: [["cũ", 1], ["đồng", 14], ["huyền thiết", 28], ["tử kim", 42]],   // 副手：前缀 + 本门的物件（刀鞘、符匣、引魂铃、镖囊、木鱼）
};
// 2026-11 词条重做：
//   ① 百分比词条（暴击、暴伤、伤害、术法、吸血、全抗、最大气血、速度……）的幅度不再跟着装备等级涨，第一章是多少，第十章还是多少；
//      后期的成长靠攻击、气血、护甲这些实数词条（flat）和装备本身的主属性。
//   ② 每种百分比词条只出在三个部位（slots），攻击词条只出在兵器、护腕、扳指、玉佩上；一件装备最多两条攻击类词条。
//      七件全堆同一种的路子堵上了：看到多少就是多少，没有暗地里的递减。
//   ③ 词条的下限提高（比如攻击 2–5 改成 3–5），普通装备和极品装备的差距收窄。
const AFFIXES = [
  // g：'o' 攻击类（一件装备最多两条）、'd' 防御类；ro：改之前的幅度，旧存档换算用
  { k: 'atk',     r: [3, 5],   ro: [2, 5],   flat: true, w: 12, g: 'o', p: "sắc bén", slots: ['weapon', 'gloves', 'ring', 'amulet', 'offhand'] },
  { k: 'hp',      r: [12, 20], ro: [8, 20],  flat: true, w: 12, g: 'd', p: "cường tráng", slots: ['weapon', 'helm', 'chest', 'boots', 'ring', 'amulet', 'belt'] },
  { k: 'armor',   r: [6, 10],  ro: [4, 10],  flat: true, w: 10, g: 'd', p: "vững chắc", slots: ['helm', 'chest', 'gloves', 'boots', 'belt'] },
  { k: 'crit',    r: [3, 6],   ro: [2, 6],   w: 7, g: 'o', p: "chí mạng", slots: ['gloves', 'ring', 'amulet', 'offhand'] },
  { k: 'critDmg', r: [15, 28], ro: [10, 28], w: 7, g: 'o', p: "tàn độc", slots: ['weapon', 'ring', 'amulet', 'offhand'] },
  { k: 'spd',     r: [4, 8],   ro: [3, 8],   w: 9, g: 'o', p: "nhanh nhẹn", slots: ['boots', 'gloves', 'amulet', 'offhand'] },
  { k: 'leech',   r: [2, 3],   ro: [1, 3],   w: 5, g: 'o', p: "khát máu", slots: ['weapon', 'helm', 'gloves'] },
  { k: 'res',     r: [6, 10],  ro: [4, 10],  w: 7, g: 'd', p: "trừ tà", slots: ['helm', 'chest', 'boots', 'belt'] },
  { k: 'dmgPct',  r: [8, 14],  ro: [5, 14],  w: 8, g: 'o', p: "cuồng bạo", slots: ['weapon', 'gloves', 'ring', 'offhand'] },
  { k: 'elem',    r: [10, 18], ro: [6, 18],  w: 5, g: 'o', p: "thông linh", slots: ['weapon', 'helm', 'amulet', 'offhand'] },
  { k: 'hpPct',   r: [6, 10],  ro: [4, 10],  w: 6, g: 'd', p: "dưỡng nguyên", slots: ['helm', 'chest', 'amulet', 'belt'] },
  { k: 'regen',   r: [2, 3],   ro: [1, 3],   flat: true, w: 5, g: 'd', p: "hồi xuân", no: ['offhand'] },
  { k: 'thorns',  r: [5, 10], w: 4, g: 'd', st: 'thornDmg', p: "có gai", no: ['offhand'] },   // 2026-11-24 再改：「反震伤害 +5–10%」，最后乘上去（反震、金刚震都吃），不会被罗汉套、金身玉的大底子稀释。老装备的「反震倍率 +10–20%」按成色对半折过来
  { k: 'mf',      r: [8, 20],  w: 4, p: "có phúc" },
  { k: 'gf',      r: [10, 30], w: 4, p: "chiêu tài" },
  // 2026-11 新加：pg＝通关后才会随掉落出（洗炼随时都能洗到）；st：算到哪个属性上
  { k: 'armorPct', r: [6, 12], w: 5, g: 'd', pg: 1, p: "vững như tường", slots: ['helm', 'chest', 'boots', 'belt'] },
  { k: 'healPct', r: [8, 15],  w: 4, g: 'd', pg: 1, p: "diệu thủ", slots: ['helm', 'amulet', 'offhand'] },
  { k: 'eva',     r: [2, 4],   w: 4, g: 'd', pg: 1, st: 'dodge', p: "linh động", slots: ['boots', 'gloves', 'helm'] },
  { k: 'freeze',  r: [2, 4],   w: 4, pg: 1, p: "ngưng sương", slots: ['weapon', 'gloves'] },
  { k: 'poison',  r: [10, 18], w: 4, pg: 1, p: "tẩm độc", slots: ['weapon', 'ring'] },
  { k: 'skd',     r: [8, 15],  w: 5, pg: 1, p: "tinh chuyên", slots: ['weapon', 'gloves', 'ring', 'amulet'] },   // 某一招伤害：洗出来时按这件装备的职业随机挑一招，存成 sk_<招式>
  // 特殊词条：只从悬赏、鬼市这些地方来，不会随机掉
  // 2026-11：也是各部位的稀有词条——洗炼时每条有 WASH_RARE 的几率洗出来（rs：出在哪个部位）
  { k: 'xFirst',  r: [20, 40], w: 0, sp: true, fixed: true, p: "tiên phát", rs: 'gloves' },
  { k: 'xBoss',   r: [8, 18],  w: 0, sp: true, fixed: true, p: "đồ khôi", rs: 'weapon' },
  { k: 'xExec',   r: [15, 30], w: 0, sp: true, fixed: true, p: "đoạn mệnh", rs: 'ring' },
  { k: 'xBreak',  r: [20, 40], w: 0, sp: true, fixed: true, p: "phá thế", rs: 'gloves' },
  { k: 'xDouble', r: [6, 10],  w: 0, sp: true, fixed: true, p: "liên trảm", rs: 'weapon' },
  { k: 'xRage',   r: [15, 25], w: 0, sp: true, fixed: true, p: "minh tâm", rs: 'helm' },
  { k: 'xTen',    r: [30, 50], w: 0, sp: true, fixed: true, p: "thanh thần", rs: 'helm' },
  { k: 'xDr',     r: [4, 7],   w: 0, sp: true, fixed: true, p: "kim cương", rs: 'chest' },
  { k: 'xLast',   r: [12, 20], w: 0, sp: true, fixed: true, p: "bất khuất", rs: 'chest' },
  { k: 'dodge',   r: [4, 7],   w: 0, sp: true, fixed: true, p: "đạp phong", rs: 'boots' },
  { k: 'xHaste',  r: [20, 35], w: 0, sp: true, fixed: true, p: "tật hành", rs: 'boots' },
  { k: 'xKill',   r: [2, 4],   w: 0, sp: true, fixed: true, p: "tham lang", rs: 'ring' },
  { k: 'cdSkip',  r: [4, 7],   w: 0, sp: true, fixed: true, p: "tụ linh", rs: 'amulet' },
  { k: 'xLuck',   r: [10, 20], w: 0, sp: true, fixed: true, p: "phúc tinh", rs: 'amulet' },
  { k: 'xShield', r: [8, 14],  w: 0, sp: true, fixed: true, p: "bàn thạch", rs: 'belt' },
  { k: 'regenPct', r: [1, 2],  w: 0, sp: true, fixed: true, p: "hồi nguyên", rs: 'belt' },
  { k: 'xCritNext', r: [10, 18], w: 0, sp: true, fixed: true, p: "hội tâm", rs: 'offhand' },
  { k: 'allyPct', r: [8, 14],  w: 0, sp: true, fixed: true, p: "đồng điệu", rs: 'offhand' },
];
const WASH_RARE = 0.01;   // 洗炼：每条被洗的词条变成本部位稀有词条的几率
const SP_AFFIXES = AFFIXES.filter(a => a.sp).map(a => a.k);
const RARE_NAME_A = ["Huyền Minh", "Xích Huyết", "Thái Ất", "Cửu U", "Vô Tướng", "Thanh Minh", "Tử Điện", "Hàn Sương", "Tu La", "Âm Dương", "Càn Khôn", "Phệ Hồn"];
const RARE_NAME_B = { weapon: ["Nhận", "Phong", "Trảm"], helm: ["Quan", "Khôi", "Diện"], chest: ["Giáp", "Bào", "Khải"],
  gloves: ["Trảo", "Uyển", "Ác"], boots: ["Lý", "Bộ", "Ngoa"], ring: ["Giới", "Hoàn", "Ấn"], amulet: ["Bội", "Giác", "Phù"], belt: ["Đai", "Thao", "Thúc"] };

const LEGENDS = [
  { id: 'butcher',  n: "Đoạn Hồn Trảm Mã Đao", slot: 'weapon', ch: 4, imp: { critDmg: 40 }, fx: 'execute',    d: "Sát thương lên địch dưới 30% khí huyết +60%" },
  { id: 'storm',    n: "Tử Điện Thanh Sương",   slot: 'weapon', ch: 7, imp: { spd: 10 },     fx: 'chain',      d: "Đòn đánh có 20% tỉ lệ gọi thiên lôi, gây 50% sát thương lên mọi kẻ địch" },
  { id: 'reaper',   n: "Ẩm Huyết Đao",     slot: 'weapon', ch: 5, imp: { leech: 4 },    fx: 'cleave',     d: "Đòn đơn mục tiêu lan sang mọi kẻ địch khác, gây 35% sát thương" },
  { id: 'glacier',  n: "Hàn Phách Huyền Thiết Kiếm", slot: 'weapon', ch: 6, imp: { elem: 15 },    fx: 'frostbite',  d: "Đòn đánh có 15% tỉ lệ làm mục tiêu bất động" },
  { id: 'seer',     n: "Thiên Cơ Quan",     slot: 'helm', ch: 2,   imp: { crit: 6 },     fx: 'firstStrike', d: "Đầu mỗi trận luôn ra tay trước" },
  { id: 'madman',   n: "Mặt Nạ Cuồng Tăng",   slot: 'helm', ch: 4,   imp: { dmgPct: 10 },  fx: 'lowHpDmg',   d: "Khí huyết càng thấp sát thương càng cao, tối đa +50%" },
  { id: 'champion', n: "Bá Vương Khôi",     slot: 'helm', ch: 6,   imp: { dmgPct: 8 },   fx: 'bossDmg',    d: "Sát thương lên tinh anh và thủ lĩnh +35%" },
  { id: 'warden',   n: "Trấn Nhạc Quan",     slot: 'helm', ch: 1,   imp: { hpPct: 8 },    fx: 'startShield', d: "Đầu trận nhận hộ thể chân khí bằng 25% khí huyết tối đa" },
  { id: 'undying',  n: "Bất Diệt Kim Thân Giáp", slot: 'chest', ch: 8,  imp: { hpPct: 12 },   fx: 'cheatDeath', d: "Mỗi trận một lần: khi nhận đòn chí tử thì giữ lại một hơi và hồi 30%" },
  { id: 'throne',   n: "Kinh Cức Khải",     slot: 'chest', ch: 4,  imp: { thornK: 20 },  fx: 'thornsPct',  d: "Bội số phản chấn +60%: mỗi lần bị đánh, bật lại 60% công kích của bạn" },
  { id: 'vampire',  n: "Huyết Bức Bào",     slot: 'chest', ch: 3,  imp: { leech: 3 },    fx: 'vampire',    d: "Hiệu quả hút máu gấp đôi" },
  { id: 'phoenix',  n: "Phượng Vũ Nghê Thường",   slot: 'chest', ch: 9,  imp: { res: 12 },     fx: 'phoenix',    d: "Lần đầu khí huyết dưới 30% mỗi trận thì bùng lửa, gây 300% sát thương hỏa lên mọi kẻ địch" },
  { id: 'looter',   n: "Mô Kim Thủ",     slot: 'gloves', ch: 1, imp: { gf: 50 },      fx: 'lootKill',   d: "Giết địch có 12% tỉ lệ rơi thêm một món trang bị" },
  { id: 'frenzy',   n: "Phong Ma Hộ Uyển",   slot: 'gloves', ch: 3, imp: { spd: 6 },      fx: 'frenzy',     d: "Mỗi đòn đánh tăng 4% tốc độ trong trận, tối đa +40%" },
  { id: 'alchemist',n: "Luyện Đan Thủ",     slot: 'gloves', ch: 1, imp: { regen: 5 },    fx: 'potionPlus', d: "Lượng hồi của đan dược +60%" },
  { id: 'ghost',    n: "Đạp Tuyết Vô Ngân",   slot: 'boots', ch: 2,  imp: { spd: 8 },      fx: 'dodge',      d: "15% tỉ lệ né đòn" },
  { id: 'momentum', n: "Thần Hành Ngoa",     slot: 'boots', ch: 5,  imp: { spd: 10 },     fx: 'momentum',   d: "Mỗi kẻ địch bị giết, tốc độ trong trận +15%" },
  { id: 'earth',    n: "Trấn Sơn Lý",     slot: 'boots', ch: 3,  imp: { armorPct: 15 },fx: 'stoneSkin',  d: "Mọi sát thương phải nhận -12%" },
  { id: 'soul',     n: "Nhiếp Hồn Ban Chỉ",   slot: 'ring', ch: 2,   imp: { leech: 3 },    fx: 'killHeal',   d: "Giết địch hồi 10% khí huyết tối đa" },
  { id: 'twin',     n: "Âm Dương Ban Chỉ",   slot: 'ring', ch: 8,   imp: { crit: 4 },     fx: 'doubleCast', d: "Kỹ năng có 20% tỉ lệ tung liền hai lần" },
  { id: 'greed',    n: "Tụ Bảo Ban Chỉ",   slot: 'ring', ch: 6,   imp: { gf: 40, mf: 25 }, fx: 'lucky',   d: "Tinh anh và thủ lĩnh rơi thêm 1 món trang bị" },
  { id: 'surge',    n: "Ngũ Hành Ban Chỉ",   slot: 'ring', ch: 7,   imp: { elem: 10 },    fx: 'elemSurge',  d: "Sát thương thuật pháp có 20% tỉ lệ gấp đôi" },
  { id: 'abyssEye', n: "Cửu U Chi Nhãn",   slot: 'amulet', ch: 9, imp: { critDmg: 30 }, fx: 'critStack',  d: "Mỗi đòn chí mạng tăng 5% sát thương trong trận, tối đa 10 tầng" },
  { id: 'avenger',  n: "Nhai Tí Bội",     slot: 'amulet', ch: 5, imp: { armorPct: 15 },fx: 'revenge',    d: "Khi bị tấn công có 30% tỉ lệ đánh trả ngay" },
  { id: 'hourglass',n: "Quang Âm Ngọc",     slot: 'amulet', ch: 10, imp: { spd: 5 },      fx: 'cdr',        d: "Mọi kỹ năng hồi chiêu -1" },
  { id: 'deadcharm',n: "Dưỡng Thi Ngọc",     slot: 'amulet', ch: 7, imp: { hpPct: 6 },    fx: 'undeadAlly', d: "Đầu mỗi trận gọi ra một cương thi trợ chiến (mọi môn phái)" },
  // ---------- 通关后的通用神兵（pg：通关后才进掉落池）：不求强，求有意思。攻、守、辅、刷宝都有 ----------
  { id: 'liubo',    n: "Lục Bác Đao",   slot: 'weapon', pg: 1, imp: { crit: 5 },      fx: 'gDice',    d: "Mỗi trận mở màn gieo xúc xắc một lần, ngẫu nhiên được một thứ: sát thương +25%, tốc độ +25%, chí mạng +20%, sát thương phải nhận -20%" },
  { id: 'jincuo',   n: "Kim Thác Đao",   slot: 'weapon', pg: 1, imp: { gf: 40 },       fx: 'gGold',    d: "Trong người cứ mỗi 10 vạn lượng bạc, sát thương +3%, tối đa +30%" },
  { id: 'zuixian',  n: "Túy Tiên Cân",   slot: 'helm',   pg: 1, imp: { hpPct: 8 },     fx: 'gDrunk',   d: "Không uống được đan dược; mỗi lượt hồi 4% khí huyết tối đa" },
  { id: 'zhaoyao',  n: "Chiếu Yêu Quan",   slot: 'helm',   pg: 1, imp: { crit: 5 },      fx: 'gReveal',  d: "Tinh anh mang mỗi một đặc tính, sát thương của bạn lên nó +10%" },
  { id: 'sheshen',  n: "Xả Thân Giáp",   slot: 'chest',  pg: 1, imp: { crit: 6 },      fx: 'gGlass',   d: "Khí huyết tối đa -20%, sát thương +20%" },
  { id: 'jingchan', n: "Kinh Thiền Y",   slot: 'chest',  pg: 1, imp: { hpPct: 10 },    fx: 'gPanic',   d: "Mỗi trận, lần đầu khí huyết dưới 30% thì chấn choáng mọi kẻ địch một lượt" },
  { id: 'huifeng',  n: "Hồi Phong Thủ",   slot: 'gloves', pg: 1, imp: { spd: 6 },       fx: 'gReset',   d: "Khi chí mạng có 10% tỉ lệ khiến một chiêu đang hồi lập tức dùng lại được" },
  { id: 'dianjin',  n: "Điểm Kim Thủ",   slot: 'gloves', pg: 1, imp: { gf: 60 },       fx: 'gMidas',   d: "Giết địch có 25% tỉ lệ rơi thêm một túi bạc" },
  { id: 'suodi',    n: "Súc Địa Ngoa",   slot: 'boots',  pg: 1, imp: { spd: 8 },       fx: 'gBlink',   d: "Chiêu đầu tiên tung ra mỗi trận không vào hồi chiêu" },
  { id: 'xiaoyao',  n: "Tiêu Dao Lý",   slot: 'boots',  pg: 1, imp: { spd: 6 },       fx: 'gEvade',   d: "Né tránh +8%; sau khi né, chiêu kế sát thương +50%" },
  { id: 'lunhui',   n: "Luân Hồi Giới",   slot: 'ring',   pg: 1, imp: { mf: 20 },       fx: 'gRevive',  d: "Tinh anh ngã xuống có 20% tỉ lệ hoàn hồn đứng dậy lại (một nửa khí huyết), đánh ngã lần nữa vẫn rơi đồ như thường" },
  { id: 'lianhuan', n: "Liên Hoàn Giới",   slot: 'ring',   pg: 1, imp: { critDmg: 25 },  fx: 'gKillCrit', d: "Sau khi giết địch, chiêu kế chắc chắn chí mạng" },
  { id: 'tongxin',  n: "Đồng Tâm Tỏa",   slot: 'amulet', pg: 1, imp: { hpPct: 8 },     fx: 'gBond',    d: "Mỗi trận một lần: khi bạn nhận đòn chí tử, đồng hành đỡ thay, bạn giữ được 20% khí huyết, đồng hành mất một nửa khí huyết" },
  { id: 'liangyi',  n: "Lưỡng Nghi Bội",   slot: 'amulet', pg: 1, imp: { armorPct: 10 }, fx: 'gYinYang', d: "Lượt của bạn luân phiên một dương một âm: lượt dương sát thương +30%; lượt âm, cho tới lần ra tay kế, sát thương phải nhận -30%" },
  { id: 'guzhu',    n: "Cô Chú Đai",   slot: 'belt',    pg: 1, x: 1, imp: { critDmg: 20 }, fx: 'gGamble', d: "Mỗi đòn của bạn có 10% tỉ lệ sát thương ×3, cũng có 10% tỉ lệ đánh hụt" },
  { id: 'xuanhu',   n: "Huyền Hồ Đai",   slot: 'belt',    pg: 1, x: 1, imp: { hpPct: 8 },    fx: 'gGourd',  d: "Sau khi uống đan dược, trong 3 lượt sát thương +40%" },
  { id: 'shouzhuo', n: "Thủ Chuyết Đai",   slot: 'belt',    pg: 1, x: 1, imp: { armorPct: 12 }, fx: 'gRest',  d: "Mỗi trận, 2 lượt đầu của bạn, sát thương phải nhận -40%" },
  { id: 'suanpan',  n: "Bàn Tính Sắt",   slot: 'offhand', pg: 1, x: 1, imp: { gf: 40 },      fx: 'gFast',   d: "Bạn ra tay trong vòng 8 lần mà xong trận thì trận đó rơi thêm một món trang bị" },
  { id: 'yinhun',   n: "Đèn Dẫn Hồn",   slot: 'offhand', pg: 1, x: 1, imp: { elem: 10 },    fx: 'gLamp',   d: "Mở trận soi vào một kẻ địch, nó nhận sát thương +25%; nó ngã thì chuyển sang kẻ kế" },
  { id: 'jujiang',  n: "Trống Tụ Tướng",   slot: 'offhand', pg: 1, x: 1, imp: { hpPct: 8 },    fx: 'gDrum',   d: "Mở trận đồng hành và cương thi ra tay trước; sát thương của họ +15%" },
  // ---------- 散件流：一对扳指。不穿套装、全身神兵也是一条路（两枚可以叠；数在 engine.js 的 SAN_DMG / SAN_DR） ----------
  { id: 'wuxiang',  n: "Vô Tướng Hoàn",   slot: 'ring',   pg: 1, wt: 8, imp: { dmgPct: 6 },    fx: 'sanA',     d: "Khi trên người không có hiệu ứng Bộ nào: mỗi món thần binh đang mặc, sát thương +5%, sát thương phải nhận -1.5% (cộng dồn với Vô Danh Giới)" },
  { id: 'wuming',   n: "Vô Danh Giới",   slot: 'ring',   pg: 1, wt: 8, imp: { hpPct: 8 },     fx: 'sanB',     d: "Khi trên người không có hiệu ứng Bộ nào: mỗi món thần binh đang mặc, sát thương +5%, sát thương phải nhận -1.5% (cộng dồn với Vô Tướng Hoàn)" },
  // ---------- 职业传奇：改变一个技能的打法（ch：主要掉落的章节） ----------
  { id: 'xuexuan',  n: "Huyết Toàn Phong",     slot: 'weapon', cls: 'berserker', ch: 2, imp: { leech: 3 },   fx: 'whirl2',      d: "Toàn Phong Đao xoay liền hai vòng, mỗi vòng hồi máu theo số người trúng" },
  { id: 'lieyanjia',n: "Liệt Diễm Chiến Giáp",   slot: 'chest',  cls: 'berserker', ch: 4, imp: { hpPct: 10 },  fx: 'lieyanAll',   d: "Liệt Diễm Đao thành đòn quét (mỗi mục tiêu 80%), thiêu đốt mọi kẻ địch" },
  { id: 'pojunkui', n: "Phá Quân Khôi",     slot: 'helm',   cls: 'berserker', ch: 6, imp: { dmgPct: 10 }, fx: 'armorHunter', d: "Với địch bị phá giáp, mọi chiêu sát thương +40%" },
  { id: 'yinxuejie',n: "Ẩm Huyết Giới",     slot: 'ring',   cls: 'berserker', ch: 8, imp: { leech: 4 },   fx: 'bloodPlus',   d: "Ẩm Huyết Trảm hồi chiêu -2, lượng hồi máu gấp đôi" },
  { id: 'hansuizhu',n: "Hàn Tủy Châu",     slot: 'amulet', cls: 'mage',      ch: 2, imp: { elem: 12 },   fx: 'shatterBlast',d: "Kim Quang Chú đập vỡ địch đóng băng (vỡ băng) thì nổ tung, các địch khác nhận 60% sát thương đòn này" },
  { id: 'sanmei',   n: "Tam Muội Chân Hỏa Bào", slot: 'chest',  cls: 'mage',      ch: 4, imp: { elem: 15 },   fx: 'burn2',       d: "Thiêu đốt bạn gây ra có sát thương gấp đôi" },
  { id: 'leiting',  n: "Lôi Đình Ban Chỉ",   slot: 'ring',   cls: 'mage',      ch: 6, imp: { crit: 5 },    fx: 'chainAll',    d: "Chưởng Tâm Lôi đánh trúng mọi kẻ địch, không giới hạn ba mục tiêu" },
  { id: 'yinbaozhu',n: "Dẫn Bạo Châu",     slot: 'weapon', cls: 'mage',      ch: 8, imp: { elem: 20 },   fx: 'detPlus',     d: "Dẫn Bạo Phù hồi chiêu -1, mỗi trạng thái tăng thêm từ +80% thành +230%" },
  { id: 'shiwangguan',n: "Thi Vương Quan",   slot: 'helm',   cls: 'necro',     ch: 2, imp: { minionPct: 20 }, fx: 'corpseBurst', d: "Cương thi của bạn ngã xuống thì nổ tung, thiêu đốt mọi kẻ địch" },
  { id: 'baigufan', n: "Bạch Cốt Phan",     slot: 'weapon', cls: 'necro',     ch: 4, imp: { minionPct: 25 }, fx: 'minionArmor', d: "Đòn của cương thi phá giáp địch; giới hạn cương thi +1" },
  { id: 'shidudan', n: "Thi Độc Đan",     slot: 'amulet', cls: 'necro',     ch: 6, imp: { elem: 12 },   fx: 'corpsePlague',d: "Địch trúng Thi Độc Bạo vừa bị thiêu đốt vừa trúng độc" },
  { id: 'hanshipao',n: "Hàn Thi Bào",     slot: 'chest',  cls: 'necro',     ch: 8, imp: { hpPct: 10 },  fx: 'stormStun',   d: "Bách Quỷ Dạ Hành có 35% tỉ lệ làm địch choáng" },
  { id: 'qianzhen', n: "Thiên Châm Hạp",     slot: 'gloves', cls: 'assassin',  ch: 2, imp: { crit: 5 },    fx: 'needle6',     d: "Băng Phách Châm phóng một lần sáu cây" },
  { id: 'yingsha',  n: "Ảnh Sát Ngoa",     slot: 'boots',  cls: 'assassin',  ch: 4, imp: { spd: 10 },    fx: 'shadow3',     d: "Vô Ảnh Bộ hồi chiêu -2, ba đòn sau chắc chắn chí mạng" },
  { id: 'duoming',  n: "Đoạt Mệnh Nhận",     slot: 'weapon', cls: 'assassin',  ch: 6, imp: { critDmg: 40 },fx: 'markSpread',  d: "Địch mang Đoạt Mệnh Ấn chết thì ấn nhảy sang kẻ địch kế tiếp" },
  { id: 'huoyannang',n: "Túi Tiêu Hỏa Diệm",  slot: 'ring',   cls: 'assassin',  ch: 8, imp: { dmgPct: 8 },  fx: 'fanBurn',     d: "Mạn Thiên Hoa Vũ thiêu đốt mọi kẻ địch" },
  { id: 'jingangchu',n: "Kim Cương Xử",    slot: 'weapon', cls: 'paladin',   ch: 2, imp: { dmgPct: 10 }, fx: 'hammerAll',   d: "Hàng Ma Xử đánh mọi kẻ địch, có 20% tỉ lệ gây choáng" },
  { id: 'budongxiang',n: "Tượng Bất Động Minh Vương",slot: 'amulet', cls: 'paladin',  ch: 4, imp: { armorPct: 15 }, fx: 'budong2',   d: "Hộ thể của Bất Động Minh Vương gấp đôi; còn hộ thể thì sát thương phải nhận -20%" },
  { id: 'ganluping',n: "Bình Cam Lộ",     slot: 'ring',   cls: 'paladin',   ch: 6, imp: { healPct: 15 },fx: 'ganlu2',      d: "Cam Lộ hồi máu gấp đôi, đồng thời xóa trúng độc và choáng trên người bạn" },
  { id: 'fuhutao',  n: "Găng Phục Hổ",   slot: 'gloves', cls: 'paladin',   ch: 8, imp: { crit: 5 },    fx: 'fuhu2',       d: "Phục Hổ Quyền vừa phá giáp vừa gây choáng địch (30%)" },
  // 2026-11：腰带、副手上的神兵（通关后才掉）。每条幻境套装路线两件，点名招式；攻、防、辅都有
  { id: 'bawangdai',  n: "Bá Vương Đai",   slot: 'belt',    cls: 'berserker', ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'bawangBelt',  d: "Bá Vương Giải Giáp đánh trúng thì chiêu kế tiếp sát thương +50%" },
  { id: 'nutaoqiao',  n: "Vỏ Đao Nộ Đào", slot: 'offhand', cls: 'berserker', ch: 9, x: 1, imp: { dmgPct: 8 },  fx: 'nutao',       d: "Nộ ý quá nửa thì mỗi lượt hồi 4% khí huyết tối đa; Bất Thoái hồi chiêu -2" },
  { id: 'xiuluodai',  n: "Tu La Đai",   slot: 'belt',    cls: 'berserker', ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'xiuluoBelt',  d: "Khí huyết dưới 30% thì sát thương phải nhận -30%" },
  { id: 'liediqiao',  n: "Vỏ Đao Liệt Địa", slot: 'offhand', cls: 'berserker', ch: 9, x: 1, imp: { crit: 5 },    fx: 'liediOff',    d: "Liệt Địa Trảm có 50% tỉ lệ gây choáng; Toàn Phong Đao mỗi lần trúng một kẻ địch đang phá giáp, Nộ ý +5" },
  { id: 'wuxingtao',  n: "Ngũ Hành Thao",   slot: 'belt',    cls: 'mage',      ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'wuxingBelt',  d: "Khi “Liên” đủ 5 tầng, mỗi lần ra chiêu làm các chiêu còn lại hồi chiêu -1" },
  { id: 'taijixia',   n: "Hộp Bùa Thái Cực", slot: 'offhand', cls: 'mage',      ch: 9, x: 1, imp: { elem: 12 },   fx: 'taijiOff',    d: "Giới hạn bùa hộ thân +20%; đang có bùa thì sát thương thuật pháp phải nhận -30%" },
  { id: 'baifudai',   n: "Bách Phù Đai",   slot: 'belt',    cls: 'mage',      ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'baifuBelt',   d: "Trạng thái bạn gây ra kéo dài thêm 2 lượt" },
  { id: 'zhenxiexia', n: "Hộp Bùa Trấn Tà", slot: 'offhand', cls: 'mage',      ch: 9, x: 1, imp: { elem: 12 },   fx: 'zhenxieOff',  d: "Kẻ địch mỗi có một loại trạng thái thì sát thương nó gây lên bạn -8%" },
  { id: 'ganshisuo',  n: "Dây Cản Thi",   slot: 'belt',    cls: 'necro',     ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'ganshiBelt',  d: "Cương thi ngã 3 lượt sau tự bò dậy (mỗi thi vị mỗi trận một lần)" },
  { id: 'shehunling', n: "Chuông Nhiếp Hồn",   slot: 'offhand', cls: 'necro',     ch: 9, x: 1, imp: { minionPct: 15 }, fx: 'shehunOff', d: "Sau Rung Chuông · Tập Hỏa, cương thi có 30% tỉ lệ mỗi con ra tay thêm một lần" },
  { id: 'baigunang',  n: "Túi Bách Cổ",   slot: 'belt',    cls: 'necro',     ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'baiguBelt',   d: "Giới hạn tầng trúng độc +2 nữa (cần Ngũ Độc Độc Hành 6 món: 8 tầng → 10 tầng)" },
  { id: 'caoren',     n: "Hình Nhân Thế Mạng", slot: 'offhand', cls: 'necro',     ch: 9, x: 1, imp: { elem: 12 },   fx: 'caorenOff',   d: "Mỗi trận một lần: đòn chí tử do hình nhân chịu thay, bạn còn 25% khí huyết, và mọi kẻ địch trúng độc" },
  { id: 'cangfengdai', n: "Tàng Phong Đai",  slot: 'belt',    cls: 'assassin',  ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'cangfengBelt', d: "Vào trận có sẵn 3 điểm Sát ý; đòn kết liễu không bị né, không đánh hụt" },
  { id: 'wuyingnang', n: "Túi Vô Ảnh",   slot: 'offhand', cls: 'assassin',  ch: 9, x: 1, imp: { spd: 6 },     fx: 'wuyingOff',   d: "Né được một đòn thì hồi 4% khí huyết tối đa, chiêu đang hồi lâu nhất hồi chiêu -1" },
  { id: 'qianjidai',  n: "Thiên Cơ Đai",   slot: 'belt',    cls: 'assassin',  ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'qianjiBelt',  d: "Chiêu ám khí (Tiêu Tẩm Độc, Băng Phách Châm, Mạn Thiên Hoa Vũ) cứ trúng 5 lần thì mọi chiêu hồi chiêu -1" },
  { id: 'baidunang',  n: "Túi Tiêu Bách Độc", slot: 'offhand', cls: 'assassin',  ch: 9, x: 1, imp: { crit: 5 },    fx: 'baiduOff',    d: "Kẻ địch trúng độc gây sát thương lên bạn -20%; kẻ địch mang độc chết thì độc truyền sang một kẻ địch khác" },
  { id: 'fumodai',    n: "Phục Ma Đai",   slot: 'belt',    cls: 'paladin',   ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'fumoBelt',    d: "Kẻ địch trúng Kim Cương Chấn có 30% tỉ lệ bị choáng; giới hạn «Phật nộ» tăng từ 10 lên 15 tầng" },
  { id: 'muyu',       n: "Mõ Trấn Tâm", slot: 'offhand', cls: 'paladin',   ch: 9, x: 1, imp: { healPct: 12 }, fx: 'muyuOff',    d: "Mỗi lần bị đánh phản chấn hồi 1.5% khí huyết tối đa, và hồi cho đồng hành 4%" },
  { id: 'daridai',    n: "Đại Nhật Đai",   slot: 'belt',    cls: 'paladin',   ch: 9, x: 1, imp: { hpPct: 8 },   fx: 'dariBelt',    d: "Giới hạn hộ thể chân khí từ 50% lên 80% khí huyết tối đa (cần Đại Nhật Như Lai 4 món)" },
  { id: 'zijinbo',    n: "Bát Tử Kim",   slot: 'offhand', cls: 'paladin',   ch: 9, x: 1, imp: { dmgPct: 8 },  fx: 'zijinOff',    d: "Khi dùng Bát Nhã Tâm Kinh, Cam Lộ thì gây 150% sát thương Phật quang lên mọi kẻ địch" },
  // 2026-11：专属兵器（w: 1）。每条幻境套装路线一把，直接改写主力招式；自带攻击比普通神兵高三成，每强化 +1 特效再涨 3%。
  // 不走普通掉落：攒「兵魄」找张大锤打，幻境妖王另有很小的几率直接掉
  { id: 'bawangdao',  n: "Bá Vương Đao",     slot: 'weapon', cls: 'berserker', ch: 9, w: 1, set: 'xuehai',  imp: { critDmg: 40 },  fx: 'wBawang',  d: "Bá Vương Giải Giáp sát thương +100%; dùng nó giết địch thì Nộ ý đã tiêu được hoàn lại hết" },
  { id: 'xiuluoren',  n: "Tu La Huyết Nhận",   slot: 'weapon', cls: 'berserker', ch: 9, w: 1, set: 'busi',    imp: { leech: 5 },     fx: 'wXiuluo',  d: "Sau Toàn Phong Đao, Liệt Địa Trảm bồi thêm một đòn, gây 60% sát thương lên mọi kẻ địch; khí huyết dưới một nửa thì hút máu gấp đôi" },
  { id: 'taiyifuchen', n: "Thái Ất Phất Trần",  slot: 'weapon', cls: 'mage',      ch: 9, w: 1, set: 'guiyuan', imp: { elem: 20 },     fx: 'wTaiyi',   d: "Giới hạn “Liên” +2 tầng; “Liên” đủ 5 tầng thì mọi chiêu sát thương thêm +30%" },
  { id: 'wanfubi',    n: "Vạn Phù Bút",     slot: 'weapon', cls: 'mage',      ch: 9, w: 1, set: 'wanfu',   imp: { elem: 20 },     fx: 'wWanfu',   d: "Dẫn Bạo Phù kích nổ cùng lúc trạng thái trên mọi kẻ địch cả sân, mỗi kẻ địch tính theo trạng thái của chính nó, sát thương thêm +30%" },
  { id: 'zhenshiling', n: "Chuông Đồng Trấn Thi",  slot: 'weapon', cls: 'necro',     ch: 9, w: 1, set: 'yinbing', imp: { minionPct: 20 }, fx: 'wZhenshi', d: "Cương thi mỗi lần ra tay có 25% tỉ lệ đánh liền hai phát" },
  { id: 'wandufan',   n: "Vạn Độc Phan",     slot: 'weapon', cls: 'necro',     ch: 9, w: 1, set: 'duxing',  imp: { elem: 20 },     fx: 'wWandu',   d: "Độc trên kẻ địch không còn tan theo lượt; phần kết toán độc phát của Thi Độc Lan, Thổ Độn Táng +100%" },
  { id: 'qishabi',    n: "Thất Sát Chủy",     slot: 'weapon', cls: 'assassin',  ch: 9, w: 1, set: 'qisha',   imp: { critDmg: 40 },  fx: 'wQisha',   d: "Giới hạn Sát ý +1; đòn kết liễu giết địch thì sát thương dư chuyển sang kẻ địch kế" },
  { id: 'lihuaxia',   n: "Bạo Vũ Lê Hoa Hạp", slot: 'weapon', cls: 'assassin',  ch: 9, w: 1, set: 'qianji',  imp: { crit: 8 },      fx: 'wLihua',   d: "Chiêu ám khí mỗi lần trúng có 30% tỉ lệ bồi thêm một cây Băng Phách Châm (60% sát thương, kèm đóng băng)" },
  { id: 'fumozhang',  n: "Phục Ma Thiền Trượng",   slot: 'weapon', cls: 'paladin',   ch: 9, w: 1, set: 'luohan',  imp: { hpPct: 12 },    fx: 'wFumo',    d: "Sát thương Kim Cương Chấn +100%" },
  { id: 'darilun',    n: "Đại Nhật Kim Luân",   slot: 'weapon', cls: 'paladin',   ch: 9, w: 1, set: 'dari',    imp: { dmgPct: 12 },   fx: 'wDari',    d: "Phật quang bồi thêm của Đại Nhật Như Lai sát thương +75%, mỗi kẻ địch trúng đòn hồi 2% khí huyết tối đa" },
  // 其他部位再添几件门派神兵（正常掉落；穿了幻境套装的可以收进乾坤袋用）
  { id: 'duanyue',    n: "Đoạn Nhạc Hộ Uyển",   slot: 'gloves', cls: 'berserker', ch: 7, imp: { atk: 10 },     fx: 'duanyue',    d: "Kẻ địch trúng Đoạn Cốt đồng thời bị phá giáp và thiêu đốt" },
  { id: 'xuantian',   n: "Huyền Thiên Quan",     slot: 'helm',   cls: 'mage',      ch: 7, imp: { elem: 12 },    fx: 'xuantian',   d: "Hàn Băng Quyết, Lạc Thạch Quyết hồi chiêu -1" },
  { id: 'huangquan',  n: "Hoàng Tuyền Lý",     slot: 'boots',  cls: 'necro',     ch: 7, imp: { minionPct: 10 }, fx: 'huangquan', d: "Tốc độ và khí huyết cương thi +25%" },
  { id: 'youying',    n: "U Ảnh Bội",     slot: 'amulet', cls: 'assassin',  ch: 7, imp: { crit: 5 },     fx: 'youying',    d: "Trong lúc Yên Độn sát thương của bạn +50%; Yên Độn hồi chiêu -2" },
  { id: 'jingangjia', n: "Kim Cương Cà Sa",   slot: 'chest',  cls: 'paladin',   ch: 7, imp: { hpPct: 8 },    fx: 'jingangjia', d: "Kim Chung Tráo hồi chiêu -2; đang có hộ thể chân khí thì mỗi lượt hồi 3% khí huyết tối đa" },
  // ---------- 通关后的职业神兵（每个职业 6 件）：腰带、副手、扳指各一件，配套装时能直接上身；另外三件在套装占的部位，靠乾坤袋或散件流用 ----------
  // 用途：冷门招式转正 2、两条路线都能用 2、防御辅助 2
  { id: 'fentianxue',  n: "Phần Thiên Ngoa",   slot: 'boots',   cls: 'berserker', ch: 9, pg: 1, imp: { spd: 8 },      fx: 'cLieyan',    d: "Liệt Diễm Đao hồi chiêu -1; đánh kẻ địch đang thiêu đốt sát thương gấp đôi, Nộ ý +10" },
  { id: 'kaishanjie',  n: "Nhẫn Khai Sơn", slot: 'ring',    cls: 'berserker', ch: 9, pg: 1, imp: { atk: 12 },     fx: 'cSlash',     d: "Mỗi lần ra chiêu, tiện tay bồi một nhát Bổ Chém (60%, không chiếm lượt), một nửa tỉ lệ khiến kẻ địch bị phá giáp, Nộ ý +3" },
  { id: 'zhanyidai',   n: "Chiến Ý Đai",   slot: 'belt',    cls: 'berserker', ch: 9, pg: 1, x: 1, imp: { hpPct: 8 },  fx: 'cFuryCrit',  d: "Mỗi 10 điểm Nộ ý, tỉ lệ chí mạng +2%" },
  { id: 'shizhanqiao', n: "Vỏ Đao Thị Chiến", slot: 'offhand', cls: 'berserker', ch: 9, pg: 1, x: 1, imp: { dmgPct: 8 }, fx: 'cMeltFury',  d: "Chiêu thức trúng kẻ địch bị phá giáp, Nộ ý +4 (mỗi lần ra tay một lần); Nộ ý đầy thì sát thương +20%" },
  { id: 'kuangxuepei', n: "Cuồng Huyết Bội",   slot: 'amulet',  cls: 'berserker', ch: 9, pg: 1, imp: { hpPct: 8 },    fx: 'cFuryDr',    d: "Mỗi 10 điểm Nộ ý, sát thương phải nhận -1.5%" },
  { id: 'shihoupao',   n: "Sư Hống Chiến Bào", slot: 'chest',   cls: 'berserker', ch: 9, pg: 1, imp: { hpPct: 10 },   fx: 'cWarcry',    d: "Sư Tử Hống hồi chiêu -2, đồng thời khiến đồng hành và cương thi tăng 40% công trong 3 lượt" },
  { id: 'wuleiling',   n: "Ngũ Lôi Lệnh",   slot: 'gloves',  cls: 'mage',      ch: 9, pg: 1, imp: { elem: 12 },    fx: 'cWulei',     d: "Ngũ Lôi Chính Pháp hồi chiêu -1; mỗi tầng “Liên” sát thương +25%, kẻ địch trúng đòn 30% bị choáng" },
  { id: 'lingfujie',   n: "Nhẫn Linh Phù", slot: 'ring',    cls: 'mage',      ch: 9, pg: 1, imp: { elem: 12 },    fx: 'cMissile',   d: "Mỗi lần ra chiêu, tiện tay phóng một lá Linh Phù (90% thuật pháp, đánh ngẫu nhiên một kẻ địch, không chiếm lượt)" },
  { id: 'taiyipao',    n: "Thái Ất Đạo Bào", slot: 'chest',   cls: 'mage',      ch: 9, pg: 1, imp: { hpPct: 10 },   fx: 'cLianFloor', d: "Mở trận “Liên” đã có 2 tầng; “Liên” đứt cũng không thấp hơn 2 tầng" },
  { id: 'baguaxia',    n: "Hộp Bát Quái Phù", slot: 'offhand', cls: 'mage',      ch: 9, pg: 1, x: 1, imp: { elem: 12 }, fx: 'cBagua',     d: "Trên kẻ địch mỗi có một loại trạng thái, nó nhận sát thương của bạn +8%" },
  { id: 'julingdai',   n: "Tụ Linh Đai",   slot: 'belt',    cls: 'mage',      ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cLianDr',    d: "Mỗi tầng “Liên”, sát thương phải nhận -4% (tính tối đa 5 tầng)" },
  { id: 'tagangbu',    n: "Đạp Cương Bộ",   slot: 'boots',   cls: 'mage',      ch: 9, pg: 1, imp: { spd: 6 },      fx: 'cTagang',    d: "Khi hộ thể chân khí bị đánh hết, đóng băng mọi kẻ địch một lượt (mỗi trận hai lần)" },
  { id: 'shehunshou',  n: "Nhiếp Hồn Thủ",   slot: 'gloves',  cls: 'necro',     ch: 9, pg: 1, imp: { elem: 12 },    fx: 'cCurse',     d: "Nhiếp Hồn Chú hồi chiêu -2; kẻ địch trúng chú nhận sát thương của bạn và cương thi +25%" },
  { id: 'zhenhunjie',  n: "Nhẫn Trấn Hồn", slot: 'ring',    cls: 'necro',     ch: 9, pg: 1, imp: { minionPct: 15 }, fx: 'cSpear',   d: "Mỗi lần ra chiêu, tiện tay đóng một cây Trấn Hồn Đinh (60%, không chiếm lượt) và khiến kẻ địch trúng độc; kẻ địch bị đóng đinh, cương thi cắn nó sát thương +20%" },
  { id: 'fushidai',    n: "Hủ Thi Đai",   slot: 'belt',    cls: 'necro',     ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cRotBelt',   d: "Đòn của cương thi khiến kẻ địch trúng độc; sát thương của bạn lên kẻ địch trúng độc +15%" },
  { id: 'qixingling',  n: "Thất Tinh Linh",   slot: 'offhand', cls: 'necro',     ch: 9, pg: 1, x: 1, imp: { minionPct: 15 }, fx: 'cQixing', d: "Ra chiêu trúng kẻ địch đang trúng độc, chiêu đang hồi lâu nhất hồi chiêu -1 (mỗi lần ra tay một lần)" },
  { id: 'xumingdeng',  n: "Tục Mệnh Đăng",   slot: 'amulet',  cls: 'necro',     ch: 9, pg: 1, imp: { hpPct: 8 },    fx: 'cXuming',    d: "Mỗi trận hai lần: khí huyết dưới 35% thì hồi 20% khí huyết tối đa" },
  { id: 'shiyuguan',   n: "Thi Ngữ Quan",   slot: 'helm',    cls: 'necro',     ch: 9, pg: 1, imp: { minionPct: 15 }, fx: 'cShiyu',   d: "Sát thương và khí huyết của đồng hành +30%; cương thi mỗi lượt hồi 5% khí huyết" },
  { id: 'dishayi',     n: "Địa Sát Y",   slot: 'chest',   cls: 'assassin',  ch: 9, pg: 1, imp: { hpPct: 10 },   fx: 'cDici',      d: "Địa Thích hồi chiêu -1, tỉ lệ choáng từ 40% lên 70%; trúng kẻ địch đang choáng thì Sát ý thêm +1" },
  { id: 'shuangshenghuan', n: "Song Sinh Thích Hoàn", slot: 'ring', cls: 'assassin', ch: 9, pg: 1, imp: { critDmg: 25 }, fx: 'cTwin',      d: "Mỗi lần ra chiêu, tiện tay bồi một lượt Song Thích (hai nhát mỗi nhát 40%, nhát thứ hai chắc chắn chí mạng, không chiếm lượt), một nửa tỉ lệ Sát ý +1" },
  { id: 'yexingdai',   n: "Dạ Hành Đai",   slot: 'belt',    cls: 'assassin',  ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cKiCrit',    d: "Mỗi điểm Sát ý, sát thương chí mạng +10% (đòn kết liễu tính theo Sát ý trước khi ra tay)" },
  { id: 'huixuannang', n: "Túi Phi Tiêu Hồi Toàn", slot: 'offhand', cls: 'assassin',  ch: 9, pg: 1, x: 1, imp: { crit: 5 },  fx: 'cKiBack',    d: "Dùng xong đòn kết liễu, hoàn lại một nửa Sát ý đã tiêu" },
  { id: 'guimian',     n: "Mặt Nạ Dạ Xoa",     slot: 'helm',    cls: 'assassin',  ch: 9, pg: 1, imp: { spd: 6 },      fx: 'cGhostMask', d: "Né tránh +6%; mỗi lần né được một đòn, nhận hộ thể chân khí bằng 5% khí huyết tối đa (tối đa 25%)" },
  { id: 'jinchanshou', n: "Kim Thiền Thủ",   slot: 'gloves',  cls: 'assassin',  ch: 9, pg: 1, imp: { hpPct: 8 },    fx: 'cJinchan',   d: "Khi Yên Độn kết thúc, hồi 15% khí huyết tối đa và xóa các trạng thái xấu trên người" },
  { id: 'wanfoguan',   n: "Vạn Phật Quan",   slot: 'helm',    cls: 'paladin',   ch: 9, pg: 1, imp: { dmgPct: 8 },   fx: 'cJudge',     d: "Vạn Phật Triều Tông hồi chiêu -2, kẻ địch trúng đòn 30% bị choáng; khi có hộ thể chân khí sát thương +50%" },
  { id: 'luohanjie',   n: "Nhẫn Kim Cương", slot: 'ring',    cls: 'paladin',   ch: 9, pg: 1, imp: { armorPct: 12 }, fx: 'cHoly',     d: "Mỗi lần ra chiêu, tiện tay bồi một đòn La Hán Quyền (100% Phật quang, không chiếm lượt), và cho bạn hộ thể chân khí bằng 3% khí huyết tối đa (tối đa cộng dồn tới 50%)" },
  { id: 'jinshendai',  n: "Kim Thân Đai",   slot: 'belt',    cls: 'paladin',   ch: 9, pg: 1, x: 1, imp: { hpPct: 8 }, fx: 'cShieldDmg', d: "Khi có hộ thể chân khí, sát thương +20%" },
  { id: 'jinganglingo', n: "Kim Cương Linh",  slot: 'offhand', cls: 'paladin',   ch: 9, pg: 1, x: 1, imp: { healPct: 12 }, fx: 'cCounter', d: "Tích đủ 8 tầng «Chấn» là tung Kim Cương Chấn (vốn 10 tầng), sát thương Kim Cương Chấn +30%" },
  { id: 'luohanbu',    n: "La Hán Bộ",   slot: 'boots',   cls: 'paladin',   ch: 9, pg: 1, imp: { armorPct: 12 }, fx: 'cHalf',     d: "Mỗi lần trúng đòn có 25% tỉ lệ chỉ nhận một nửa sát thương" },
  { id: 'putizi',      n: "Bồ Đề Tử",   slot: 'amulet',  cls: 'paladin',   ch: 9, pg: 1, imp: { healPct: 12 }, fx: 'cBodhi',     d: "Đồng hành nhận sát thương -30%; khi bạn hồi máu, đồng hành cũng hồi cùng tỉ lệ khí huyết" },
];

const SETS = [
  { id: 'bloodrage', n: "Tu La Huyết Chiến", cls: 'berserker',
    pieces: [['weapon', "Tu La Chiến Đao"], ['helm', "Tu La Huyết Khôi"], ['chest', "Tu La Chiến Giáp"], ['gloves', "Tu La Hộ Uyển"]],
    b2: { leech: 6 }, b2d: "Hút máu +6%", b4: 'bloodrage', b4d: "Khí huyết dưới 50% thì sát thương +60%, tốc độ +30%" },
  { id: 'bulwark', n: "Thiết Bích Đồng Tường", cls: 'berserker',
    pieces: [['chest', "Đồng Tường Trọng Giáp"], ['boots', "Đồng Tường Chiến Ngoa"], ['ring', "Đồng Tường Ban Chỉ"], ['amulet', "Đồng Tường Hộ Tâm Kính"]],
    b2: { armorPct: 40 }, b2d: "Hộ giáp +40%", b4: 'bulwark', b4d: "Khi bị đánh phản chấn 40% sát thương, Toàn Phong Đao hồi chiêu -1" },
  { id: 'infernal', n: "Tam Muội Chân Hỏa", cls: 'mage',
    pieces: [['weapon', "Chân Hỏa Phất Trần"], ['helm', "Chân Hỏa Đạo Quan"], ['chest', "Chân Hỏa Đạo Bào"], ['gloves', "Chân Hỏa Hộ Uyển"]],
    b2: { elem: 30 }, b2d: "Sát thương thuật pháp +30%", b4: 'ignite', b4d: "Chân Hỏa Phù thiêu địch 3 lượt (mỗi lượt 50% công), Chân Hỏa Phù hồi chiêu -1" },
  { id: 'frost', n: "Huyền Băng Quyết", cls: 'mage',
    pieces: [['chest', "Huyền Băng Pháp Bào"], ['boots', "Huyền Băng Vân Lý"], ['ring', "Huyền Băng Ban Chỉ"], ['amulet', "Huyền Băng Ngọc Bội"]],
    b2: { freeze: 15 }, b2d: "Tỉ lệ bất động +15%", b4: 'shatter', b4d: "Sát thương lên địch bị bất động gấp đôi, Hàn Băng Quyết hồi chiêu -1" },
  { id: 'bonelord', n: "Thi Vương", cls: 'necro',
    pieces: [['weapon', "Thi Vương Linh"], ['helm', "Thi Vương Nón Lá"], ['chest', "Thi Vương Thọ Y"], ['gloves', "Thi Vương Chỉ Sáo"]],
    b2: { minion: 1 }, b2d: "Giới hạn số cương thi +1", b4: 'boneLord', b4d: "Sát thương và khí huyết của cương thi +100%" },
  { id: 'plague', n: "Ngũ Độc Giáo", cls: 'necro',
    pieces: [['chest', "Ngũ Độc Cổ Y"], ['boots', "Ngũ Độc Xà Lý"], ['ring', "Ngũ Độc Ban Chỉ"], ['amulet', "Ngũ Độc Cổ Đàn"]],
    b2: { poison: 30 }, b2d: "Đòn đánh gây trúng độc (mỗi lượt 30% công, 3 lượt)", b4: 'plague', b4d: "Sát thương trúng độc +150%, Thi Độc Bạo làm mọi kẻ địch trúng độc" },
  { id: 'shadowdance', n: "Vô Ảnh Môn", cls: 'assassin',
    pieces: [['weapon', "Vô Ảnh Song Thích"], ['helm', "Vô Ảnh Diện Tráo"], ['chest', "Vô Ảnh Dạ Hành Y"], ['gloves', "Vô Ảnh Chỉ Sáo"]],
    b2: { crit: 8 }, b2d: "Tỉ lệ chí mạng +8%", b4: 'shadowDance', b4d: "Khi chí mạng có 35% tỉ lệ đánh thêm một đòn ngay" },
  { id: 'venomfang', n: "Xà Tín", cls: 'assassin',
    pieces: [['chest', "Xà Lân Nhuyễn Giáp"], ['boots', "Xà Hành Nhuyễn Ngoa"], ['ring', "Xà Nha Ban Chỉ"], ['amulet', "Xà Đởm Ngọc Bội"]],
    b2: { poison: 40 }, b2d: "Đòn đánh gây trúng độc (mỗi lượt 40% công, 3 lượt)", b4: 'venomFang', b4d: "Địch trúng độc nhận sát thương +30%, Tiêu Tẩm Độc hồi chiêu -1" },
  { id: 'oath', n: "Kim Cương Bất Hoại", cls: 'paladin',
    pieces: [['weapon', "Kim Cương Thiền Trượng"], ['helm', "Kim Cương Tăng Mạo"], ['chest', "Kim Cương Cà Sa"], ['gloves', "Kim Cương Hộ Uyển"]],
    b2: { hpPct: 10 }, b2d: "Khí huyết tối đa +10%", b4: 'holyLight', b4d: "Bát Nhã Tâm Kinh hồi chiêu -2, lượng hồi dư chuyển thành hộ thể chân khí" },
  { id: 'wrath', n: "Hàng Ma", cls: 'paladin',
    pieces: [['chest', "Hàng Ma Tăng Y"], ['boots', "Hàng Ma Tăng Hài"], ['ring', "Hàng Ma Ban Chỉ"], ['amulet', "Hàng Ma Niệm Châu"]],
    b2: { elem: 30 }, b2d: "Sát thương thuật pháp +30% (Phật quang cũng tính)", b4: 'wrath', b4d: "Hàng Ma Xử đập trúng mọi kẻ địch" },
];

// 职业（id 沿用，名字和形象全换成东方）
const CLASSES = {
  berserker: {
    n: "Cuồng Đao Khách", d: "Đao khách lưu lạc giang hồ, máu dày da dạn, càng đánh càng điên. Bị đánh hay ra đòn đều tích “Nộ ý”, Nộ ý quá nửa thì chiêu càng hiểm; máu càng ít, sát thương càng cao.", spr: 'blade',
    base: { hp: 145, atk: 12, armor: 15, crit: 6, critDmg: 155, res: 20 }, per: { hp: 16.5, atk: 2.35, armor: 2.5 },
    res: { n: "Nộ ý", max: 100 },
    skills: [
      { id: 'liedi',     n: "Liệt Địa Trảm",   lv: 1, cat: 'ctrl',  cd: 3, wx: 'tu',   k: 'aoe', m: 0.6, stun: 0.2, d: "Một đao chém nứt mặt đất, gây 60% sát thương lên mọi kẻ địch, 20% tỉ lệ làm choáng" },
      { id: 'lieyan',    n: "Liệt Diễm Đao",   lv: 3, cat: 'core',  cd: 3, wx: 'huo',  k: 'single', m: 1.5, d: "Thân đao bốc lửa, gây 150% sát thương" },
      { id: 'warcry',    n: "Sư Tử Hống",   lv: 6, cat: 'buff',  cd: 6, wx: 'tu', d: "Trong 3 lượt công +40%, hộ giáp +50%, Nộ ý +30" },
      { id: 'hanren',    n: "Đoạn Cốt",     lv: 9, cat: 'core',  cd: 3, wx: 'shui', k: 'single', m: 1.4, d: "Lưỡi đao lạnh thấu xương, gây 140% sát thương" },
      { id: 'bloodlust', n: "Ẩm Huyết Trảm",   lv: 12, cat: 'core', cd: 4, wx: 'jin', d: "Gây 180% sát thương, hồi khí huyết bằng 50% sát thương gây ra" },
      { id: 'whirl',     n: "Toàn Phong Đao",   lv: 16, cat: 'core', cd: 3, wx: 'jin', d: "Gây 70% sát thương lên mọi kẻ địch" },
      { id: 'bawang',    n: "Bá Vương Giải Giáp", lv: 20, cat: 'core', cd: 3, wx: 'jin', d: "Nuốt toàn bộ Nộ ý: gây 150% sát thương, mỗi điểm Nộ ý thêm +2% (Nộ ý đầy là 350%)" },
      { id: 'butui',     n: "Bất Thoái",     lv: 25, cat: 'buff', cd: 6, wx: 'tu', d: "Trong 2 lượt sát thương phải nhận -50%, mỗi đòn bị đánh tích gấp đôi Nộ ý" },
      { id: 'slash',     n: "Bổ Chém",     lv: 1,  cd: 0, wx: 'jin', d: "Gây 100% sát thương vật lý, Nộ ý +5" },
    ],
    tree: { n: "Đao Ý", t: [
      { id: 'furyUp',  n: "Nộ Hỏa",     d: "Nộ ý nhận được +10%", max: 5, st: { furyGain: 10 } },
      { id: 'warUp',   n: "Chiến Ý",     d: "Sát thương +3%", max: 5, st: { dmgPct: 3 } },
      { id: 'bloodUp', n: "Ẩm Huyết Đao Ý", d: "Sát thương Ẩm Huyết Trảm +15%", max: 5, st: { sk_bloodlust: 15 } },
      { id: 'undying', n: "Bất Tử",     d: "Mỗi trận một lần: khi nhận đòn chí tử thì giữ lại 1 điểm khí huyết, chống qua lượt kế tiếp", max: 1, fx: 'lastBreath' } ] } },
  mage: {
    n: "Đạo Sĩ Ngũ Hành", d: "Vẽ bùa niệm chú, giỏi nhất là treo trạng thái và kích nổ trạng thái, thân thể mỏng nhất. Mỗi lần đổi sang một hành khác để ra chiêu thì chồng một tầng “Liên” (mỗi tầng sát thương +8%), không cần theo thứ tự; cùng một hành ra liên tiếp thì không tăng cũng không mất (đòn thường Linh Phù tính là Mộc). Mỗi trận mở đầu tự có một lớp bùa hộ thân (hộ thể bằng 35% khí huyết).", spr: 'taoist',
    base: { hp: 140, atk: 12, armor: 9, crit: 8, critDmg: 160, res: 14 }, per: { hp: 19.5, atk: 3.3, armor: 2.3 },
    res: { n: "Liên", max: 5 },
    skills: [
      { id: 'fireball',  n: "Chân Hỏa Phù",   lv: 1, cat: 'core',  cd: 2, wx: 'huo', d: "Gây 180% sát thương hỏa" },
      { id: 'frostnova', n: "Hàn Băng Quyết",   lv: 3, cat: 'ctrl',  cd: 4, wx: 'shui', d: "Gây 45% sát thương băng lên mọi kẻ địch" },
      { id: 'chain',     n: "Chưởng Tâm Lôi",   lv: 6, cat: 'core',  cd: 3, wx: 'mu', d: "Gây 120% sát thương lôi lên tối đa 3 kẻ địch" },
      { id: 'luoshi',    n: "Lạc Thạch Quyết",   lv: 9, cat: 'ctrl',  cd: 4, wx: 'tu',  k: 'aoe', m: 0.9, stun: 0.2, d: "Đá núi từ trời rơi xuống, gây 90% sát thương lên mọi kẻ địch, 20% tỉ lệ làm choáng" },
      { id: 'jinguang',  n: "Kim Quang Chú",   lv: 12, cat: 'core', cd: 2, wx: 'jin', k: 'single', m: 1.7, d: "Một luồng kim quang, gây 170% sát thương" },
      { id: 'zhenyue',   n: "Trấn Nhạc Phù",   lv: 14, cat: 'buff', cd: 5, wx: 'tu', d: "Nhận bùa hộ thân bằng 20% khí huyết tối đa (không vượt giới hạn), trong 3 lượt sát thương +40%" },
      { id: 'lunzhuan',  n: "Dẫn Bạo Phù",   lv: 16, cat: 'core', cd: 3, wx: 'huo', k: 'single', m: 1.4, d: "Gây 140% sát thương; mục tiêu mỗi có một loại trạng thái thì thêm +120%, rồi kích nổ xóa sạch mọi trạng thái" },
      { id: 'meteor',    n: "Thiên Giáng Hỏa Vũ", lv: 20, cat: 'core', cd: 6, wx: 'huo', d: "Gây 200% sát thương hỏa lên mọi kẻ địch" },
      { id: 'wulei',     n: "Ngũ Lôi Chính Pháp", lv: 25, cat: 'core', cd: 4, wx: 'jin', d: "Gây 190% sát thương lôi; khi “Liên” đầy 5 tầng thì đánh trúng mọi kẻ địch" },
      { id: 'missile',   n: "Linh Phù",     lv: 1,  cd: 0, wx: 'mu', d: "Gây 110% sát thương thuật pháp" },
    ],
    tree: { n: "Ngũ Hành", t: [
      { id: 'fireUp',  n: "Hỏa Hành", d: "Sát thương Chân Hỏa Phù và Thiên Giáng Hỏa Vũ +12%", max: 5, st: { sk_fireball: 12, sk_meteor: 12 } },
      { id: 'frostUp', n: "Thủy Hành", d: "Sát thương Hàn Băng Quyết +15%, tỉ lệ bất động +2%", max: 5, st: { sk_frostnova: 15, freeze: 2 } },
      { id: 'lianUp',  n: "Lưu Chuyển", d: "Mỗi tầng “Liên” cộng thêm +1% sát thương", max: 5, st: { lianPct: 1 } },
      { id: 'archmage', n: "Thiên Sư", d: "Giới hạn “Liên” 5 → 7; chiêu làm đầy sẽ chắc chắn chí mạng, rồi “Liên” về không tích lại", max: 1, fx: 'tianshi' } ] } },
  necro: {
    n: "Cản Thi Nhân", d: "Một nhánh cản thi Tương Tây, bản thân yếu ớt, dựa vào rung chuông sai khiến cương thi chiến đấu. Ở trang “Võ học” xếp sẵn “Thi trận”: khiêu thi đánh nhanh, thiết giáp thi chắn phía trước, độc thi và âm hỏa thi ở hàng sau gây trạng thái.", spr: 'corpseman',
    base: { hp: 125, atk: 12, armor: 10, crit: 5, critDmg: 150, res: 12 }, per: { hp: 17, atk: 3.35, armor: 2.4 },
    res: { n: "Thi vị" },
    skills: [
      { id: 'summon',    n: "Rung Chuông Gọi Xác", lv: 1, cat: 'buff',  cd: 2, wx: 'tu', d: "Gọi lại một cương thi đã ngã theo Thi trận (vào trận cương thi đã xếp sẵn; thi vị cơ bản 3)" },
      { id: 'jihuo',     n: "Rung Chuông · Tập Hỏa", lv: 3, cat: 'core', cd: 3, wx: 'jin', d: "Mọi cương thi lập tức đánh mục tiêu mỗi con một lần" },
      { id: 'shidu',     n: "Thi Độc Lan",   lv: 6, cat: 'core',  cd: 4, wx: 'mu',  k: 'aoe', m: 0.4, d: "Thi độc lan tràn, gây 40% sát thương lên mọi kẻ địch" },
      { id: 'corpse',    n: "Thi Bạo",     lv: 9, cat: 'core',  cd: 3, wx: 'huo', d: "Kích nổ cương thi ít máu nhất, đánh mọi kẻ địch bằng 80% khí huyết còn lại của nó" },
      { id: 'yangshi',   n: "Dưỡng Thi Phù",   lv: 12, cat: 'buff', cd: 4, wx: 'shui', d: "Mọi cương thi hồi 30% khí huyết, ra tay thêm 2 lần, trong 3 lượt công +30%" },
      { id: 'curse',     n: "Nhiếp Hồn Chú",   lv: 16, cat: 'ctrl', cd: 6, wx: 'shui', d: "Trong 3 lượt mọi kẻ địch giảm 30% sát thương" },
      { id: 'bonestorm', n: "Bách Quỷ Dạ Hành", lv: 20, cat: 'core', cd: 5, wx: 'shui', d: "Mỗi cương thi đánh mọi kẻ địch một lần 45% sát thương (càng nhiều cương thi càng đau)" },
      { id: 'tudun',     n: "Thổ Độn Táng",   lv: 25, cat: 'core', cd: 4, wx: 'tu',  k: 'aoe', m: 1.0, heal: 'minion', d: "Đất cuộn trào, gây 100% sát thương lên mọi kẻ địch và hồi 30% khí huyết cho cương thi của bạn" },
      { id: 'bonespear', n: "Trấn Hồn Đinh",   lv: 1,  cd: 0, wx: 'jin', d: "Gây 60% sát thương thuật pháp; địch trúng đinh sẽ bị cương thi ưu tiên cắn" },
    ],
    tree: { n: "Ngự Thi", t: [
      { id: 'skelUp',   n: "Luyện Thi",     d: "Khí huyết và sát thương cương thi +12%", max: 5, st: { minionPct: 12 } },
      { id: 'ironUp',   n: "Thiết Thi",     d: "Khí huyết thiết giáp thi +15%, khi bị đánh phản chấn +10%", max: 5, st: { ironPct: 15 } },
      { id: 'poisonUp', n: "Thi Độc",     d: "Trúng độc do bạn và cương thi gây ra +15% sát thương", max: 5, st: { poisonPct: 15 } },
      { id: 'boneArmy', n: "Vạn Thi Triều Tông", d: "Thi vị +1", max: 1, fx: 'boneArmy' } ] } },
  assassin: {
    n: "Thích Khách Dạ Hành", d: "Xuất thân ám khí, nhanh nhất, độc nhất, chuyên giết một mục tiêu. Ra đòn tích “Sát ý” (tối đa 5 điểm), dùng Đoạt Mệnh Ấn, Ảnh Sát xả hết một hơi; khai trận ra tay trước, đánh nhóm yếu.", spr: 'assassin',
    base: { hp: 112, atk: 12, armor: 9, crit: 14, critDmg: 165, spd: 10, res: 14 }, per: { hp: 14.5, atk: 2.75, armor: 1.9 },
    res: { n: "Sát ý", max: 5 },
    skills: [
      { id: 'venom',      n: "Tiêu Tẩm Độc",   lv: 1, cat: 'core',  cd: 3, wx: 'mu', ki: 1, d: "Gây 120% sát thương và khiến mục tiêu trúng độc, Sát ý +1" },
      { id: 'shadowstep', n: "Vô Ảnh Bộ",   lv: 3, cat: 'buff',  cd: 5, wx: 'shui', ki: 2, d: "Trong 3 lượt né tránh +40%, đòn kế tiếp chắc chắn chí mạng, Sát ý +2" },
      { id: 'bingpo',     n: "Băng Phách Châm",   lv: 6, cat: 'ctrl',  cd: 3, wx: 'shui', k: 'multi', m: 0.6, hits: 3, ki: 1, d: "Bắn liền ba cây kim băng, mỗi cây 60% sát thương, trúng ngẫu nhiên, Sát ý +1" },
      { id: 'deathmark',  n: "Đoạt Mệnh Ấn",   lv: 9, cat: 'core',  cd: 4, wx: 'shui', fin: 1, d: "Đòn kết liễu: gây 250% sát thương, mỗi điểm Sát ý thêm +25%, và đóng Đoạt Mệnh Ấn 3 lượt (địch bị đánh dấu nhận sát thương +50%)" },
      { id: 'fan',        n: "Mạn Thiên Hoa Vũ", lv: 12, cat: 'core', cd: 3, wx: 'jin', d: "Ám khí cùng phóng, gây 60% sát thương lên mọi kẻ địch" },
      { id: 'dici',       n: "Địa Thích",     lv: 16, cat: 'ctrl', cd: 3, wx: 'tu',   k: 'single', m: 1.6, ki: 1, d: "Gai đất xuyên lên, gây 160% sát thương, Sát ý +1" },
      { id: 'shadowkill', n: "Ảnh Sát",     lv: 20, cat: 'core', cd: 4, wx: 'jin', fin: 1, d: "Đòn kết liễu: đâm liên tiếp một mục tiêu, số nhát bằng Sát ý, mỗi nhát 90% sát thương, chắc chắn chí mạng" },
      { id: 'yandun',     n: "Yên Độn",     lv: 25, cat: 'buff', cd: 6, wx: 'mu', ki: 3, d: "Trong 2 lượt địch đánh không trúng bạn, Sát ý +3" },
      { id: 'twin',       n: "Song Thích",     lv: 1,  cd: 0, wx: 'jin', ki: 1, d: "Đâm nhanh hai nhát, mỗi nhát 60% sát thương, Sát ý +1" },
    ],
    tree: { n: "Ám Khí", t: [
      { id: 'venomUp',  n: "Tẩm Độc",   d: "Sát thương Tiêu Tẩm Độc và trúng độc +15%", max: 5, st: { sk_venom: 15, poisonPct: 15 } },
      { id: 'shadowUp', n: "Thân Pháp",   d: "Né tránh +2%", max: 5, st: { dodge: 2 } },
      { id: 'kiUp',     n: "Sát Tâm",   d: "Đòn kết liễu: mỗi điểm Sát ý tăng thêm +5%", max: 5, st: { kiPct: 5 } },
      { id: 'reap',     n: "Đoạt Hồn",   d: "Địch mang Đoạt Mệnh Ấn nhận thêm +50% sát thương; giới hạn Sát ý +1", max: 1, fx: 'deathMarkPlus' } ] } },
  paladin: {
    n: "Võ Tăng Kim Cương", d: "Ngoại gia công phu Thiếu Lâm, chịu đòn giỏi nhất, sát thương thấp nhất. Bị đánh chắc chắn phản chấn (sát thương Phật quang = công kích × bội số phản chấn, sẵn có 30%), còn tự hồi máu được; mỗi lần phản chấn tích một tầng «Chấn», đủ 10 tầng tung «Kim Cương Chấn», Phật quang quét cả sân. Khi dẫn đồng hành có «Hộ Pháp Kim Thân»: yêu vật bị đồng hành đánh choáng, đóng băng mà mất lượt vẫn ăn một lần phản chấn của bạn; yêu vật đánh đồng hành, bạn phản chấn thay họ một nửa.", spr: 'monk',
    base: { hp: 130, atk: 12, armor: 10, crit: 5, critDmg: 150, res: 10 }, per: { hp: 12.5, atk: 2.9, armor: 1.7 },
    res: { n: "Chấn" },
    skills: [
      { id: 'aegis',     n: "Kim Chung Tráo",   lv: 1, cat: 'buff',  cd: 6, wx: 'jin', d: "Nhận hộ thể chân khí bằng 20% khí huyết tối đa" },
      { id: 'hammer',    n: "Hàng Ma Xử",   lv: 3, cat: 'core',  cd: 3, wx: 'jin', d: "Gây 190% sát thương Phật quang" },
      { id: 'ganlu',     n: "Cam Lộ",     lv: 6, cat: 'core',  cd: 4, wx: 'shui', k: 'healaoe', m: 0.7, heal: 0.06, d: "Cam lộ rơi xuống, hồi 6% khí huyết và gây 70% sát thương lên mọi kẻ địch" },
      { id: 'fuhu',      n: "Phục Hổ Quyền",   lv: 9, cat: 'ctrl',  cd: 3, wx: 'mu',   k: 'single', m: 1.7, d: "Một quyền phục hổ, gây 170% sát thương, địch trúng đòn trong 2 lượt sát thương -15%" },
      { id: 'prayer',    n: "Bát Nhã Tâm Kinh", lv: 12, cat: 'buff', cd: 5, wx: 'mu', d: "Khí huyết dưới 70% thì hồi 16% khí huyết tối đa" },
      { id: 'budong',    n: "Bất Động Minh Vương", lv: 16, cat: 'core', cd: 5, wx: 'tu',   k: 'aoe', m: 0.9, shield: 0.11, d: "Gây 90% sát thương lên mọi kẻ địch và nhận hộ thể bằng 11% khí huyết" },
      { id: 'judgement', n: "Vạn Phật Triều Tông", lv: 20, cat: 'core', cd: 6, wx: 'huo', d: "Gây 200% sát thương Phật quang lên mọi kẻ địch" },
      { id: 'chanhou',   n: "Sư Tử Hống · Thiền", lv: 16, cat: 'ctrl', cd: 6, wx: 'tu', d: "Khiêu khích mọi kẻ địch 3 lượt: chúng chỉ đánh được bạn (thủ lĩnh cũng vậy). Trong thời gian này sát thương phải chịu -45%, bội số phản chấn +50%" },
      { id: 'holy',      n: "La Hán Quyền",   lv: 1,  cd: 0, wx: 'tu', d: "Gây 115% sát thương Phật quang" },
    ],
    tree: { n: "Thiền Tâm", t: [
      { id: 'counterUp', n: "Thiết Bích",   d: "Bội số phản chấn +10%", max: 5, st: { thornK: 10 } },
      { id: 'hammerUp',  n: "Hàng Ma",   d: "Sát thương Hàng Ma Xử +15%", max: 5, st: { sk_hammer: 15 } },
      { id: 'healUp',    n: "Từ Bi",   d: "Hiệu quả trị liệu +10%", max: 5, st: { healPct: 10 } },
      { id: 'divine',    n: "Phật Pháp Vô Biên", d: "Bát Nhã Tâm Kinh đồng thời gây 100% sát thương Phật quang lên mọi kẻ địch; giới hạn hộ thể chân khí +30%", max: 1, fx: 'divine' } ] } },
};
const CLASS_IDS = Object.keys(CLASSES);

const TALENT_SHARED = [
  { id: 'survive', n: "Nội Công", t: [
    { id: 'vit',   n: "Dịch Cân Kinh",   d: "Khí huyết tối đa +4%", max: 5, st: { hpPct: 4 } },
    { id: 'iron',  n: "Thiết Bố Sam",   d: "Hộ giáp +6%, kháng toàn bộ +2%", max: 5, st: { armorPct: 6, res: 2 } },
    { id: 'drain', n: "Hấp Tinh Đại Pháp", d: "Hút máu +1%", max: 5, st: { leech: 1 } },
    { id: 'last',  n: "Trí Chi Tử Địa", d: "Khí huyết dưới 30% thì sát thương phải nhận -40%", max: 1, fx: 'lastStand' } ] },
  { id: 'slay', n: "Sát Phạt", t: [
    { id: 'precise', n: "Mắt Tinh",   d: "Tỉ lệ chí mạng +2%", max: 5, st: { crit: 2 } },
    { id: 'brutal',  n: "Lòng Ác",   d: "Sát thương chí mạng +10%", max: 5, st: { critDmg: 10 } },
    { id: 'swift',   n: "Tay Nhanh",   d: "Tốc độ +4", max: 5, st: { spd: 4 } },
    { id: 'exec',    n: "Trảm Thảo Trừ Căn", d: "Sát thương lên địch dưới 30% khí huyết +60%", max: 1, fx: 'execute' } ] },
];
const TALENT_TIER_REQ = 3;

// 玉石 2026-11-23 重做：九档（碎……极品，后四档无瑕、通灵、天成、九幽跟着幻境最高层开）；
// 赤玉、墨玉从死数（+16 攻击、+40 护甲，满级只占 2%～4%）改成百分比；每档按「极品」的倍数算：前五档每档 +0.2，后四档越涨越少，九幽 = 极品 ×1.6
const GEM_MUL = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.35, 1.48, 1.6];
const gemVals = top => GEM_MUL.map(m => Math.round(top * m * 10) / 10);
const GEM_TYPES = {
  ruby:     { n: "Xích ngọc", c: '#e04040', st: 'atkPct',   v: gemVals(6) },
  sapphire: { n: "Thanh ngọc", c: '#4a9aff', st: 'res',      v: gemVals(15).map(Math.round) },
  topaz:    { n: "Hoàng ngọc", c: '#f1c94a', st: 'crit',     v: gemVals(6) },
  emerald:  { n: "Thúy ngọc", c: '#3cc870', st: 'hpPct',    v: gemVals(11) },
  amethyst: { n: "Mặc ngọc", c: '#8a6aaa', st: 'armorPct', v: gemVals(8) },
  diamond:  { n: "Bạch ngọc", c: '#f0f4f8', st: 'critDmg',  v: gemVals(28) },
};
const GEM_TIERS = ["vụn", "thô", "tốt", "tinh", "cực phẩm", "vô hà", "thông linh", "thiên thành", "Cửu U"];
const GEM_RIFT = [60, 100, 150, 200];   // 无瑕、通灵、天成、九幽：幻境最高层打到这里才合得出
const ENHANCE_RATE = [1, 1, 1, 1, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
const ENHANCE_MAX = 10;

// 难度：base 是在章节等级之上额外加的怪物等级
const DIFFS = {
  normal:    { n: "Phàm Trần", base: 0,  res: 0,  hpMul: 1,   atkMul: 1,   loot: 0 },
  nightmare: { n: "Tu La", base: 22, res: 20, hpMul: 2.7, atkMul: 2.1, loot: 1 },
  hell:      { n: "Luyện Ngục", base: 40, res: 40, hpMul: 4.4, atkMul: 3.3, loot: 2 },
};
const DIFF_IDS = Object.keys(DIFFS);

const ELITE_AFFIXES = [
  { id: 'fiery',    n: "Liệt Diễm", d: "Đòn đánh gây thêm sát thương hỏa" },
  { id: 'cold',     n: "Hàn Sương", d: "Đòn đánh có tỉ lệ làm mục tiêu bất động" },
  { id: 'vamp',     n: "Hút máu", d: "Đòn đánh hút khí huyết" },
  { id: 'split',    n: "Phân Thân", d: "Chết rồi tách thành hai con" },
  { id: 'thorny',   n: "Phản chấn", d: "Dội lại một phần tư sát thương phải nhận: mỗi lần bạn ra tay, tối đa bị dội mất 15% khí huyết tối đa, hộ thể chân khí đỡ trước" },
  { id: 'enraged',  n: "Cuồng Bạo", d: "Quá nửa máu thì sát thương và tốc độ tăng mạnh" },
  { id: 'tough',    n: "Da Đồng", d: "Khí huyết tăng mạnh" },
  { id: 'fast',     n: "Thần Hành", d: "Tốc độ hành động tăng mạnh" },
  { id: 'shielded', n: "Hộ Thể", d: "Đầu trận nhận hộ thể chân khí" },
  { id: 'venom',    n: "Kịch Độc", d: "Đòn đánh làm mục tiêu trúng độc" },
];
const ELITE_TITLES = ["hung sát", "oán độc", "khát máu", "trăm năm", "ngàn năm", "cuồng nộ", "âm u"];

const ROOM_TYPES = {
  start: { n: "Lối vào" }, empty: { n: "Phòng trống" }, battle: { n: "Yêu vật" }, elite: { n: "Tinh anh" },
  keeper: { n: "Yêu tướng giữ cửa" }, event: { n: "Kỳ ngộ" }, chest: { n: "Rương báu" }, gold: { n: "Bạc" },
  shop: { n: "Người bán rong" }, rest: { n: "Lửa trại" }, boss: { n: "Thủ lĩnh" }, goblin: { n: "Kim Thiềm Chiêu Tài" },
  story: { n: "Cốt truyện" }, page: { n: "Tàn quyển" },
};

// 奇遇（随机事件）。go() 返回 { msg, fight? }；E 是引擎提供的工具函数。
const EVENTS = [
  { id: 'shrine', t: "Miếu Thổ Địa", d: "Bên đường có ngôi miếu Thổ Địa đổ nát, trong lư hương vậy mà còn cắm ba nén nhang chưa cháy hết.",
    c: [
      { l: "Thắp hương cầu nguyện", go: (r, E) => {
          const x = Math.random();
          if (x < 0.4) { E.buff(r, 'dmgPct', 15); return { msg: "Thổ Địa hiển linh, vỗ vai bạn. Chuyến này sát thương +15%." }; }
          if (x < 0.7) { E.buff(r, 'armorPct', 30); return { msg: "Một luồng ấm áp bao quanh người. Chuyến này hộ giáp +30%." }; }
          E.hurt(r, 0.2); return { msg: "Trong lư hương nhảy ra một con chồn cắn bạn một phát, hóa ra miếu đã bị chiếm từ lâu. Mất 20% khí huyết." };
        } },
      { l: "Rời đi", go: () => ({ msg: "Kính quỷ thần mà tránh xa." }) },
    ] },
  { id: 'adventurer', t: "Thư sinh gặp nạn", d: "Một thư sinh bị treo trên cây, miệng vẫn đang đọc «Luận Ngữ». Hắn nói chỉ cần một viên đan dược là hồi lại được.",
    c: [
      { l: "Cho hắn một viên đan dược", req: r => r.potions > 0, go: (r, E) => { r.potions--; const it = E.loot(r, 'elite'); return { msg: "Thư sinh cảm động rơi nước mắt, dúi bảo vật gia truyền vào tay bạn:" + it }; } },
      { l: "Lục rương sách của hắn", go: (r, E) => { const g = E.gold(r, 6); E.hurt(r, 0.1); return { msg: `Thư sinh dùng nghiên mực đập vào đầu bạn. Bạn lấy được ${g} lượng bạc, mất 10% khí huyết.` }; } },
      { l: "Rời đi", go: () => ({ msg: "Sau lưng vọng lại tiếng mắng “gỗ mục không thể chạm khắc”." }) },
    ] },
  { id: 'cursedChest', t: "Quan tài dán đầy bùa", d: "Một cỗ quan tài sơn đen dán đầy bùa vàng, bên trong mơ hồ có thứ gì đang gõ.",
    c: [
      { l: "Xé bùa mở quan tài", go: (r, E) => {
          if (Math.random() < 0.5) { const it = E.loot(r, 'boss'); return { msg: "Trong quan tài là một lão viên ngoại đã hóa tro từ lâu, tay vẫn nắm chặt bảo vật:" + it }; }
          return { msg: "Nắp quan tài “rầm” một tiếng bay ra — một con yêu tinh lao tới!", fight: 'elite' };
        } },
      { l: "Rời đi", go: () => ({ msg: "Có những thứ tốt nhất đừng đụng vào." }) },
    ] },
  { id: 'bloodAltar', t: "Tế đàn tà thần", d: "Rãnh máu trên tế đàn đã khô từ lâu, như đang chờ vật tế mới.",
    c: [
      { l: "Dâng 20% khí huyết", go: (r, E) => { E.hurt(r, 0.2); E.buff(r, 'dmgPct', 20); return { msg: "Tế đàn uống máu bạn. Chuyến này sát thương +20%." }; } },
      { l: "Rời đi", go: () => ({ msg: "Bạn cất binh khí đi." }) },
    ] },
  { id: 'gambler', t: "Sòng bạc ma", d: "Một bộ xương mặc áo dài ngồi sau ống xúc xắc: “Khách quan, đặt Tài hay Xỉu?”",
    c: [
      { l: "Đặt cược", dyn: (r, E) => `Đặt ${E.bet(r)} lượng`, req: (r, E) => E.save().gold >= E.bet(r), go: (r, E) => {
          const b = E.bet(r);
          if (Math.random() < 0.5) { E.save().gold += b; return { msg: `Mở! Bốn năm sáu, Tài! Bạn thắng ${b} lượng. Cằm bộ xương rớt xuống đất.` }; }
          E.save().gold -= b; return { msg: `Mở! Một hai ba, Xỉu! Bộ xương cười khành khạch thu mất ${b} lượng của bạn.` };
        } },
      { l: "Rời đi", go: () => ({ msg: "“Khách quan lần sau lại đến nha~”" }) },
    ] },
  { id: 'library', t: "Trang rách Tàng Kinh Các", d: "Một đống kinh sách bị chuột gặm, chữ trên trang vẫn còn phát sáng.",
    c: [
      { l: "Lật xem", go: (r, E) => {
          if (Math.random() < 0.25) return { msg: "Trong sách nhảy ra cả bầy mọt sách thành tinh!", fight: 'battle' };
          const x = E.xp(r, 0.25); return { msg: `Bạn đọc hiểu một trang tâm pháp võ công. Nhận ${x} kinh nghiệm.` };
        } },
      { l: "Rời đi", go: () => ({ msg: "Chuyện của người đọc sách, để sau hẵng tính." }) },
    ] },
  { id: 'fountain', t: "Hai giếng cổ", d: "Nước giếng bên trái trong vắt thấy đáy, nước giếng bên phải đỏ như máu.",
    c: [
      { l: "Uống nước giếng trong", go: (r, E) => { E.heal(r, 0.5); return { msg: "Nước giếng ngọt lành. Hồi 50% khí huyết." }; } },
      { l: "Uống nước giếng máu", go: (r, E) => {
          if (Math.random() < 0.6) { E.buff(r, 'hpPct', 15); E.heal(r, 0.15); return { msg: "Huyết khí cuồn cuộn, sức mạnh vô song. Chuyến này khí huyết tối đa +15%." }; }
          E.hurt(r, 0.25); return { msg: "Có độc! Bạn nôn mửa cả buổi. Mất 25% khí huyết." };
        } },
    ] },
  { id: 'bones', t: "Mộ hoang lộn xộn", d: "Mấy nấm mồ mới không bia, đất một nấm còn đang động đậy.",
    c: [
      { l: "Đào ra xem", go: (r, E) => {
          if (Math.random() < 0.6) { const it = E.loot(r, 'normal'); return { msg: "Hóa ra là con chuột chũi. Trong mộ chôn:" + it }; }
          return { msg: "Từ trong mộ thò ra một bàn tay tóm lấy chân bạn!", fight: 'battle' };
        } },
      { l: "Rời đi", go: () => ({ msg: "Hãy để người chết yên nghỉ." }) },
    ] },
  { id: 'pact', t: "Tâm ma", d: "Trong đầu bạn vang lên một giọng nói: “Ta có thể cho ngươi sức mạnh… chỉ cần một chút cái giá.”",
    c: [
      { l: "Chấp nhận tâm ma", go: (r, E) => { E.buff(r, 'crit', 15); E.buff(r, 'critDmg', 40); E.buff(r, 'hpPct', -15);
          return { msg: "Tâm ma nhập thể. Chuyến này tỉ lệ chí mạng +15%, sát thương chí mạng +40%, khí huyết tối đa -15%." }; } },
      { l: "Thầm niệm Thanh Tâm Chú", go: () => ({ msg: "Tâm ma tan đi đầy cay cú." }) },
    ] },
  { id: 'lostSoul', t: "Cô hồn lạc lối", d: "Hồn phách một bà lão quanh quẩn ở ngã ba, nói không tìm được đường về nhà.",
    c: [
      { l: "Chỉ đường cho bà", go: r => { r.potions++; return { msg: "Bà lão cảm ơn rồi tan biến, tại chỗ để lại một viên đan dược. Đan dược +1." }; } },
      { l: "Hấp thụ hồn phách", go: (r, E) => { E.buff(r, 'leech', 4); return { msg: "Một luồng sức mạnh lạnh lẽo chảy vào người… bạn thấy mình hơi không còn là người. Chuyến này hút máu +4%." }; } },
    ] },
  { id: 'rack', t: "Binh khí bỏ lại", d: "Một bộ hài cốt ngồi tựa tường, tay vẫn nắm một món binh khí tốt.",
    c: [
      { l: "Mượn dùng tạm", go: (r, E) => { const it = E.loot(r, 'elite', 'weapon'); return { msg: "Ngón tay bộ hài cốt buông ra:" + it }; } },
      { l: "Rời đi", go: () => ({ msg: "Quân tử không đoạt thứ người khác yêu thích, người chết cũng vậy." }) },
    ] },
  { id: 'trap', t: "Địa đạo cơ quan", d: "Gạch lát nền khắc hình bát quái, trên tường chi chít lỗ nhỏ.",
    c: [
      { l: "Đi theo bộ pháp bát quái", go: (r, E) => { if (Math.random() < 0.7) return { msg: "Càn ba liền, Khôn sáu đứt… bạn qua an toàn." }; E.hurt(r, 0.15); return { msg: "Bước sai một bước, tên độc bắn tới tấp! Mất 15% khí huyết." }; } },
      { l: "Lao qua, tiện tay cạy bạc trong tường", go: (r, E) => { E.hurt(r, 0.12); const g = E.gold(r, 8); return { msg: `Bạn trúng mấy mũi tên, mất 12% khí huyết, nhưng cạy được ${g} lượng bạc.` }; } },
    ] },
  { id: 'gemVein', t: "Mạch ngọc", d: "Vách đá khảm mấy viên ngọc phát sáng, nhưng đá xung quanh trông rất lỏng lẻo.",
    c: [
      { l: "Đào tay không", go: (r, E) => { E.hurt(r, 0.1); const g = E.gem(r); return { msg: `Đá vụn cứa vào bạn (mất 10% khí huyết), nhưng bạn đào được một viên ${g}.` }; } },
      { l: "Rời đi", go: () => ({ msg: "Cẩn tắc vô áy náy." }) },
    ] },
  { id: 'anvil', t: "Lò đúc kiếm", d: "Một lò đúc kiếm bỏ hoang, lửa lò vậy mà vẫn chưa tắt.",
    c: [
      { l: "Tôi luyện binh khí của bạn", req: r => !!E_weapon(r), go: (r, E) => E.forge(r) },
      { l: "Rời đi", go: () => ({ msg: "Bạn không có thời gian rèn sắt." }) },
    ] },
  { id: 'prisoner', t: "Hồ tiên bị nhốt", d: "Một con hồ ly trắng nhỏ bị nhốt trong lồng sắt, con yêu quái canh giữ đang ngủ gật gần đó.",
    c: [
      { l: "Đập lồng sắt", go: () => ({ msg: "Một tiếng động lớn đánh thức tên canh giữ!", fight: 'elite', reward: 'mats' }) },
      { l: "Rời đi", go: () => ({ msg: "Hồ ly trắng nhỏ thất vọng nhìn bạn bỏ đi." }) },
    ] },
  { id: 'soulWell', t: "Giếng Tụ Hồn", d: "Trong một cái giếng sâu cuộn trào ánh sáng xanh u ám.",
    c: [
      { l: "Hút hồn tinh", go: (r, E) => { const n = E.mats(r, 6); return { msg: `Bạn thu được ${n} viên hồn tinh (nguyên liệu dùng ở Lò Rèn).` }; } },
      { l: "Đổ một viên đan dược vào", req: r => r.potions > 0, go: (r, E) => { r.potions--; E.buff(r, 'res', 20); return { msg: "Nước giếng lặng xuống, che chở bạn. Chuyến này kháng toàn bộ +20%." }; } },
    ] },
];
function E_weapon(r) { return SAVE.chars[r.cls].eq.weapon; }

// ---------------- 五行 ----------------
const WX = { jin: { n: "Kim", c: '#f1d34e' }, mu: { n: "Mộc", c: '#5fd07a' }, shui: { n: "Thủy", c: '#5fb0ff' }, huo: { n: "Hỏa", c: '#ff6a2a' }, tu: { n: "Thổ", c: '#c8935a' } };
const WX_IDS = ['mu', 'huo', 'tu', 'jin', 'shui'];
const WX_SHENG = { mu: 'huo', huo: 'tu', tu: 'jin', jin: 'shui', shui: 'mu' };   // 甲生乙
const WX_KE = { mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin', jin: 'mu' };      // 甲克乙
// 反应：相克以「打上去的五行」命名，相生以「原来的印」命名
const REACTS = {
  ke_shui: { n: "Chưng Đằng", d: "Thủy khắc Hỏa: đòn này gấp đôi sát thương" },
  ke_huo:  { n: "Dung Giáp", d: "Hỏa khắc Kim: hộ giáp giảm nửa, kháng -20, kéo dài 3 lượt" },
  ke_jin:  { n: "Phạt",   d: "Kim khắc Mộc: chém đứt hộ thể, đòn này chắc chắn chí mạng" },
  ke_mu:   { n: "Liệt",   d: "Mộc khắc Thổ: đánh choáng 1 lượt" },
  ke_tu:   { n: "Phong",   d: "Thổ khắc Thủy: đóng băng 1 lượt" },
  sh_mu:   { n: "Liệu Nguyên", d: "Mộc sinh Hỏa: mọi kẻ địch đều bốc cháy" },
  sh_huo:  { n: "Dư Tẫn", d: "Hỏa sinh Thổ: các địch khác cũng nhận 40% sát thương" },
  sh_tu:   { n: "Thối Phong", d: "Thổ sinh Kim: sát thương +20%, đòn kế tiếp của bạn chắc chắn chí mạng" },
  sh_jin:  { n: "Hàn Phong", d: "Kim sinh Thủy: mục tiêu chậm lại 3 lượt" },
  sh_shui: { n: "Tư Dưỡng", d: "Thủy sinh Mộc: bạn hồi 8% khí huyết" },
};
// 妖物的五行与特性（按像素图大致归类）
const MON_WX = {yayi:'jin', yong:'tu', headless:'shui', xianling:'tu',  jiangshi: 'tu', skeleton: 'jin', imp: 'mu', bat: 'mu', wisp: 'huo', hound: 'mu', spider: 'mu', golem: 'tu', snake: 'shui', toad: 'shui',
  ghost: 'shui', fox: 'huo', femghost: 'shui', bull: 'tu', crow: 'huo', paper: 'mu', knight: 'jin', caster: 'huo', demon: 'huo', zombie: 'tu', skelking: 'jin' };
const MON_TRAIT = {yayi:'shield', yong:'shield', headless:'fly',  skeleton: 'shield', knight: 'shield', golem: 'shield', jiangshi: 'regen', zombie: 'regen', snake: 'regen', bat: 'fly', wisp: 'fly', crow: 'fly', ghost: 'fly' };
const TRAITS = { shield: { n: "Cốt giáp", d: "Vào trận mang sẵn một lớp hộ thể; bị “Phá giáp” là vỡ" }, regen: { n: "Hồi xuân", d: "Mỗi lượt hồi máu; khi bị “Thiêu đốt” thì không hồi được" }, fly: { n: "Phi hành", d: "Đòn cận chiến có 25% đánh hụt; bị “Đóng băng” thì rơi xuống, không còn hụt nữa" } };
// 同伴
const COMPANIONS = {
  ngoc: { n: 'Ngoc', spr: 'ngoc', wx: 'huo', ap: 'burn', hp: 0.5, atk: 0.5, spd: 95, d: "Hồi máu cho bạn; bình thuốc ném ra làm địch thiêu đốt", row: 'back', role: "Hồi máu · Thiêu đốt",
    up: ["Hảo cảm 10: khí huyết dưới bảy phần là hồi máu cho bạn, tiện tay xóa trúng độc, choáng", "Hảo cảm 20: khi hồi máu cả đội cùng hồi"] },
  zhen: { n: "Cô Trân", spr: 'constable', wx: 'jin', ap: 'armor', hp: 0.65, atk: 0.6, spd: 105, d: "Đao bộ khoái làm địch phá giáp, cứ ba chiêu lại quăng xích một lần làm địch choáng", row: 'front', role: "Phá giáp · Choáng",
    up: ["Hảo cảm 10: tỉ lệ xích sắt gây choáng từ năm phần lên tám phần", "Hảo cảm 20: xích sắt quăng vào mọi kẻ địch"] },
  long: { n: "Long đạo trưởng", spr: 'scholar', wx: 'mu', ap: 'chill', hp: 0.45, atk: 0.55, spd: 98, d: "Chính khí quyết làm địch đóng băng, thỉnh thoảng ngâm một đoạn tăng công cho bạn", row: 'back', role: "Tăng công · Đóng băng",
    up: ["Hảo cảm 10: Chính Khí Quyết từ bốn chiêu một lần thành ba chiêu một lần", "Hảo cảm 20: Chính Khí Quyết tăng công cho cả đội"] },
  kang: { n: "Quản gia Khang", spr: 'merchant', wx: 'tu', ap: 'stun', apc: 0.2, hp: 1.6, atk: 0.35, spd: 85, d: "Tiền tuyến chịu đòn: biết khiêu khích; cứ ba chiêu thì “Đỡ đao” hai lượt, đỡ thay bạn ba phần sát thương", row: 'front', role: "Khiêu khích · Đỡ đao", pg: 1,
    up: ["Hảo cảm 10: Đỡ đao đỡ thay bạn bốn phần", "Hảo cảm 20: khiêu khích dữ hơn, kéo thêm một nửa số đòn"] },
  // 2026-11 新伙伴：通关后达成条件认识（lock：认识的条件，界面上显示）
  lei: { n: "Lôi Lão Hổ", spr: 'blade', wx: 'jin', ap: 'armor', hp: 0.9, atk: 0.65, spd: 100, d: "Thợ săn già tiền tuyến: chuyên chém kẻ ít máu nhất; Chém làm địch phá giáp, mỗi ba chiêu một nhát “Đoạn Đầu Đao”, gây sát thương gấp đôi lên địch tàn máu", row: 'front', role: "Kết liễu · Phá giáp", pg: 1,
    lock: "Hoàn thành 10 lần truy nã", up: ["Hảo cảm 10: Đoạn Đầu Đao gấp đôi khi địch dưới nửa máu", "Hảo cảm 20: Đoạn Đầu Đao chém chết người thì bồi thêm một đao cho kẻ kế tiếp"] },
  liu: { n: "Sư phụ Lưu", spr: 'oldman', wx: 'shui', ap: 'stun', apc: 0.3, hp: 0.55, atk: 0.45, spd: 92, d: "Lão sư gia nhà quàn ở hậu tuyến: mỗi ba chiêu tụng một đoạn An Hồn Kinh, cả đội giảm 20% sát thương phải nhận trong hai lượt; lắc chuông làm địch choáng", row: 'back', role: "Cả đội giảm sát thương · Choáng", pg: 1,
    lock: "Trấn Yêu Lục đủ 3 trang", up: ["Hảo cảm 10: tụng kinh giảm sát thương lên 30%", "Hảo cảm 20: khi tụng kinh tiện tay gõ choáng một kẻ địch"] },
  tie: { n: "Thiết Đản", spr: 'smith', wx: 'huo', ap: 'burn', hp: 0.6, atk: 0.6, spd: 96, d: "Đồ đệ thợ rèn ở hậu tuyến: hỏa súng làm địch thiêu đốt; mỗi ba chiêu “Gia cố” cho tiền tuyến ba lượt, hộ giáp +40%", row: 'back', role: "Thiêu đốt · Tăng giáp tiền tuyến", pg: 1,
    lock: "Rèn một món binh khí chuyên thuộc chỗ Trương Đại Chùy", up: ["Hảo cảm 10: Gia cố cả hậu tuyến", "Hảo cảm 20: hỏa súng bắn tất cả địch"] },
};

// ---------------- 状态配合 ----------------
// 起手技能给敌人挂状态（ap），收招技能打带状态的敌人有额外效果（pay）
const STATES = { burn: { n: "Thiêu đốt", c: '#ff6a2a', d: "Mỗi lượt mất một mảng máu lớn (chỉ một tầng, giữ cái mạnh); yêu vật hồi xuân đang cháy thì không hồi máu được" },
  chill: { n: "Đóng băng", c: '#5fb0ff', d: "Ra đòn chậm lại; yêu vật biết bay sẽ rơi xuống" },
  armor: { n: "Phá giáp", c: '#d8a05a', d: "Hộ giáp giảm nửa, kháng -20; cốt giáp vỡ ngay" },
  stun: { n: "Choáng", c: '#f1d34e', d: "Bỏ qua lần ra đòn kế tiếp" },
  poison: { n: "Trúng độc", c: '#7fe05a', d: "Mỗi lượt mất máu, có thể cộng dồn tầng (tối đa 5 tầng, mỗi tầng 3 lượt)" } };
const SKILL_COMBO = {
  liedi: { ap: 'armor' }, lieyan: { ap: 'burn' }, warcry: { ap: 'stun', apc: 0.3 }, hanren: { ap: 'chill', pay: { s: 'stun', x: 'crit', n: "Đoạn Cốt" } },
  bloodlust: { pay: { s: 'burn', x: 'dmg', v: 1.8, n: "Ẩm Hỏa" } }, whirl: { pay: { s: 'armor', x: 'dmg', v: 1.7, n: "Phá Quân" } }, bawang: { pay: { s: 'armor', x: 'crit', n: "Giải Giáp" } },
  fireball: { ap: 'burn' }, frostnova: { ap: 'chill' }, chain: { pay: { s: 'burn', x: 'dmg', v: 1.8, n: "Lôi Hỏa" } }, luoshi: { ap: 'armor' },
  jinguang: { pay: { s: 'chill', x: 'shatter', v: 2.8, n: "Vỡ Băng" } }, lunzhuan: { pay: { s: 'any', x: 'detonate', n: "Kích Nổ" } },
  meteor: { pay: { s: 'armor', x: 'dmg', v: 1.5, n: "Phần Thành" } }, wulei: { pay: { s: 'stun', x: 'crit', n: "Thiên Lôi" } },
  bonespear: {}, jihuo: { pay: { s: 'poison', x: 'dmg', v: 1.8, n: "Thi Độc Công Tâm" } }, shidu: { ap: 'poison' }, corpse: { pay: { s: 'burn', x: 'spread', n: "Thi Hỏa" } },
  curse: { ap: 'armor' }, bonestorm: { pay: { s: 'armor', x: 'dmg', v: 1.5, n: "Bách Quỷ Phệ Giáp" } }, tudun: { pay: { s: 'chill', x: 'shatter', v: 2.2, n: "Băng Táng" } },
  venom: { ap: 'poison' }, bingpo: { ap: 'chill' }, deathmark: { pay: { s: 'stun', x: 'dmg', v: 2, n: "Thừa Hư" } }, fan: { pay: { s: 'poison', x: 'dmg', v: 1.6, n: "Độc Vũ" } },
  dici: { ap: 'stun', apc: 0.4, pay: { s: 'chill', x: 'crit', n: "Băng Thích" } }, shadowkill: { pay: { s: 'poison', x: 'dmg', v: 1.4, n: "Độc Nhận" } },
  hammer: { ap: 'stun', apc: 0.3 }, ganlu: { ap: 'chill' }, fuhu: { ap: 'armor', pay: { s: 'stun', x: 'dmg', v: 1.8, n: "Phục Hổ" } },
  budong: { pay: { s: 'stun', x: 'heal', v: 0.06, n: "Minh Vương" } }, judgement: { pay: { s: 'armor', x: 'dmg', v: 1.6, n: "Phục Ma" } },
};
for (const c in CLASSES) for (const k of CLASSES[c].skills) Object.assign(k, SKILL_COMBO[k.id] || {});
const payText = p => !p ? '' : p.x === 'dmg' ? `Sát thương ×${p.v}` : p.x === 'crit' ? "Chắc chắn chí mạng" : p.x === 'shatter' ? `Sát thương ×${p.v}, đập vỡ trạng thái` : p.x === 'spread' ? "Lây sang mọi kẻ địch" : p.x === 'heal' ? `Bạn hồi ${Math.round(p.v * 100)}% khí huyết` : p.x === 'detonate' ? "Mỗi trạng thái +80%" : '';
