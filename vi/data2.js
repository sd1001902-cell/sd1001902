// ============ 九幽回廊 · 长线玩法内容 ============

STAT_NAMES.frozenDmg = "Sát thương lên địch bất động";
PCT_STATS.add('frozenDmg');
const MAX_LEVEL = 50;

const RUNES = {
  whirl:      [{ n: "Huyết Toàn", d: "Mỗi lần đánh trúng một kẻ địch hồi 2% khí huyết tối đa" }, { n: "Phi Phong Đao", d: "Sát thương +50%, hồi chiêu +1" }],
  warcry:     [{ n: "Chấn Nhiếp", d: "Đồng thời chấn nhiếp mọi kẻ địch 3 lượt (sát thương -30%)" }, { n: "Huyết Chiến Lệnh", d: "Trong lúc Sư Tử Hống hút máu +10%" }],
  bloodlust:  [{ n: "Trảm Thủ", d: "Sát thương lên địch dưới 40% khí huyết gấp đôi" }, { n: "Kình Thôn", d: "Lượng hồi tăng lên bằng 100% sát thương" }],
  fireball:   [{ n: "Tam Liên Phù", d: "Đổi thành gây 100% sát thương lên mỗi kẻ địch, tối đa 3 kẻ" }, { n: "Bạo Viêm Phù", d: "Trúng đích thì bắn tóe 50% sát thương lên mọi kẻ địch khác" }],
  frostnova:  [{ n: "Thiên Lý Băng Phong", d: "Tỉ lệ bất động tăng lên 80%, sát thương giảm nửa" }, { n: "Băng Chùy", d: "Sát thương +100%, không còn bất động" }],
  chain:      [{ n: "Lôi Bạo", d: "Nảy tối đa 5 mục tiêu" }, { n: "Cửu Thiên Lôi", d: "Sát thương +60%, chỉ nảy 2 mục tiêu" }],
  meteor:     [{ n: "Mưa Đá", d: "Đổi thành sát thương băng, và làm mọi kẻ địch bất động" }, { n: "Phần Thiên", d: "Sát thương +50%, hồi chiêu +2" }],
  summon:     [{ n: "Liên Hoán", d: "Mỗi lần gọi hai cương thi" }, { n: "Hậu Táng", d: "Cương thi gọi ra có khí huyết +60%" }],
  curse:      [{ n: "Câu Hồn", d: "Hiệu quả nhiếp hồn tăng lên sát thương -45%" }, { n: "Hủ Cốt", d: "Địch bị nhiếp hồn nhận sát thương +25%" }],
  corpse:     [{ n: "Liên Hoàn Thi Bạo", d: "Mỗi lần kích nổ hai cương thi" }, { n: "Đạm Thi", d: "Mỗi lần thi bạo hồi 8% khí huyết tối đa" }],
  bonestorm:  [{ n: "Quỷ Tỏa", d: "40% tỉ lệ làm từng kẻ địch bất động" }, { n: "Vạn Quỷ", d: "Sát thương +40%" }],
  venom:      [{ n: "Hạc Đỉnh Hồng", d: "Sát thương trúng độc gấp đôi" }, { n: "Tán Hoa Tiêu", d: "Trúng mọi kẻ địch và làm chúng trúng độc, sát thương -40%" }],
  shadowstep: [{ n: "Quỷ Ảnh Tập", d: "Khi tung lập tức gây 150% sát thương lên mục tiêu" }, { n: "Huyễn Ảnh", d: "Thời gian kéo dài thành 6 lượt" }],
  fan:        [{ n: "Bạo Vũ Lê Hoa", d: "Sát thương +40%" }, { n: "Phi Tiêu Hồi Toàn", d: "Trúng mỗi kẻ địch hai lần, mỗi lần 50%" }],
  deathmark:  [{ n: "Truy Hồn", d: "Địch bị đánh dấu chết thì Đoạt Mệnh Ấn lập tức hồi chiêu xong" }, { n: "Phá Trán", d: "Hiệu quả tăng sát thương của dấu ấn +25%" }],
  aegis:      [{ n: "Kim Cương Phản Chấn", d: "Khi còn hộ thể chân khí, phản lại 30% sát thương phải nhận" }, { n: "Bất Động Minh Vương", d: "Hộ thể chân khí tăng lên 40% khí huyết tối đa" }],
  prayer:     [{ n: "Hồi xuân", d: "3 lượt sau đó, mỗi lượt hồi thêm 6% khí huyết" }, { n: "Phật Quang Phổ Chiếu", d: "Khi trị liệu thì gây 80% sát thương Phật quang lên mọi kẻ địch" }],
  hammer:     [{ n: "Lôi Âm", d: "Tỉ lệ bất động tăng lên 60%" }, { n: "Phục Ma", d: "Sát thương +50%" }],
  judgement:  [{ n: "Đại Nhật Như Lai", d: "Sát thương +40%" }, { n: "Phổ Độ", d: "Mỗi lần đánh trúng một kẻ địch hồi 3% khí huyết tối đa" }],
};

// 灵玉（原传奇宝石）：只在九幽幻境的守关妖王身上掉落，可以无限升级
const LGEMS = {
  pain:  { n: "Huyết Sát Ngọc", c: '#ff4a4a', d: lv => `Đòn đánh gây trúng độc: mỗi lượt ${20 + lv}% công`, st: lv => ({ poison: 20 + lv }) },
  power: { n: "Chiến Thần Ngọc", c: '#ffb02a', d: lv => `Sát thương +${(10 + lv * 0.5).toFixed(1)}%`, st: lv => ({ dmgPct: 10 + lv * 0.5 }) },
  life:  { n: "Trường Sinh Ngọc", c: '#5df07a', d: lv => `Khí huyết tối đa +${(8 + lv * 0.4).toFixed(1)}%`, st: lv => ({ hpPct: 8 + lv * 0.4 }) },
  ice:   { n: "Hàn Tủy Ngọc", c: '#8fd0ff', d: lv => `Tỉ lệ bất động +${(5 + lv * 0.2).toFixed(1)}%, sát thương lên địch bất động +${20 + lv}%`, st: lv => ({ freeze: 5 + lv * 0.2, frozenDmg: 20 + lv }) },
  greed: { n: "Chiêu Tài Ngọc", c: '#f1c94a', d: lv => `Thu hoạch bạc +${30 + lv * 2}%, phúc duyên +${10 + lv}%`, st: lv => ({ gf: 30 + lv * 2, mf: 10 + lv }) },
  zeal:  { n: "Tật Phong Ngọc", c: '#c39cff', d: lv => `Tốc độ +${(6 + lv * 0.3).toFixed(1)}`, st: lv => ({ spd: 6 + lv * 0.3 }) },
};

const RIFT_THEMES = CHAPTERS;

const GOBLIN = { n: "Kim Thiềm Chiêu Tài", hp: 2.2, atk: 0, spd: 1.25, spr: 'toad', goblin: true };
const GOBLIN_FLEE = 7;
const RARE_ELITE_NAMES = ["Lão Yêu Toái Cốt", "Bà Bà Huyết Nhãn", "Quỷ Không Mặt", "Ma Chết Đói Vương Nhị", "Hôi Tẫn Nương Nương", "Hủ Tâm Lão Tổ", "Đồ Tể Câm", "Quái Ngàn Răng", "Hắc Cức Sơn Quân", "Nữ Quỷ Khóc Mộ", "Thiết Ngạc Tinh", "Miêu Yêu Chín Mạng"];

const DUNGEON_MODS = [
  { id: 'elites', n: "Yêu Tướng Hoành Hành", d: "Mỗi tầng thêm 2 phòng tinh anh", r: "Phúc duyên +25%", mf: 25 },
  { id: 'armored', n: "Đồng Bì Thiết Cốt", d: "Hộ giáp yêu vật +60%", r: "Phúc duyên +15%, kinh nghiệm +15%", mf: 15, xp: 15 },
  { id: 'brutal', n: "hung sát", d: "Sát thương yêu vật +30%", r: "Kinh nghiệm +30%, phúc duyên +10%", mf: 10, xp: 30 },
  { id: 'hardy', n: "Đạo Hạnh Trăm Năm", d: "Khí huyết yêu vật +50%", r: "Phúc duyên +25%, kinh nghiệm +20%", mf: 25, xp: 20 },
  { id: 'scarce', n: "Túi Rỗng", d: "Không mang đan dược, người bán rong cũng không bán", r: "Bạc +100%, phúc duyên +10%", mf: 10, gf: 100 },
  { id: 'dark', n: "Tối Đen Như Mực", d: "Không thấy phòng bên cạnh có gì", r: "Phúc duyên +20%", mf: 20 },
];

// 修为（原巅峰等级）：满级后所有角色共享
const PARAGON_STATS = [
  { k: 'dmgPct', n: "Sát thương", v: 1 },
  { k: 'hpPct', n: "Khí huyết tối đa", v: 1 },
  { k: 'armorPct', n: "Hộ giáp", v: 2 },
  { k: 'critDmg', n: "ST chí mạng", v: 2 },
  { k: 'crit', n: "Tỉ lệ chí mạng", v: 0.5, cap: 50 },
  { k: 'spd', n: "Tốc độ", v: 0.5, cap: 40 },
  { k: 'res', n: "Kháng toàn bộ", v: 0.5, cap: 60 },
  { k: 'mf', n: "Phúc duyên", v: 2 },
  { k: 'gf', n: "Thu hoạch bạc", v: 3 },
];
const REALMS = ["Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Đại Thừa", "Độ Kiếp", "Chân Tiên"];
const realmName = lv => { const i = Math.floor(lv / 10); return (REALMS[Math.min(i, REALMS.length - 1)] + (i >= REALMS.length ? ` tầng ${lv - (REALMS.length - 1) * 10}` : ` tầng ${lv % 10 + 1}`)); };

// 营地建筑（ch = 通关第几章后开张）
const BUILDINGS = [
  { id: 'alchemist', n: "Tiệm thuốc của Ngoc", ch: 0, max: 3, gold: 500, mats: 6, npc: 'ngoc',
    d: lv => `Mỗi chuyến mang thêm ${lv} viên đan dược, lượng hồi đan dược +${lv * 10}%` },
  { id: 'smith', n: "Lò Rèn Trương Đại Chùy", ch: 0, max: 5, gold: 600, mats: 15, npc: 'smith',
    d: lv => `Giới hạn cường hóa +${5 + lv}, tỉ lệ cường hóa thành công +${lv * 3}%` },
  { id: 'warehouse', n: "Nhà kho", ch: 0, max: 4, gold: 400, mats: 5,
    d: lv => `Sức chứa kho ${120 + lv * 40} ô` },
  { id: 'merchant', n: "Tiền Trang Tiền Đa Đa", ch: 1, max: 4, gold: 700, mats: 8, npc: 'merchant',
    d: lv => `Người bán rong dưới đất bán thêm ${lv} món, đổ thạch rẻ hơn ${lv * 8}%, giá bán +${lv * 10}%` },
  { id: 'barracks', n: "Tiêu Cục Lôi Lão Hổ", ch: 2, max: 3, gold: 800, mats: 12, npc: 'biaotou',
    d: lv => `Có thể áp tiêu cùng lúc ${1 + lv} chuyến, thu nhập áp tiêu +${lv * 20}%` },
  { id: 'jewel', n: "Xưởng Ngọc", ch: 3, max: 3, gold: 500, mats: 10,
    d: lv => `Ngọc ghép tối đa đến “${GEM_TIERS[Math.min(4, 2 + lv)]}”, phí ghép -${lv * 20}%${lv >= 3 ? ", gỡ ngọc miễn phí" : ''}` },
];
const FEATURE_CH = { reroll: 2, enhance: 4, sockets: 5, gems: 5, cube: 6, runes: 7 };

const DISPATCH = [
  { h: 1, n: "Áp tiêu ngắn", d: "1 giờ" },
  { h: 4, n: "Áp tiêu dài", d: "4 giờ" },
  { h: 8, n: "Đi Tây Vực", d: "8 giờ" },
];

const BOUNTY_POOL = [
  { id: 'kill',  t: n => `Diệt ${n} con yêu`, n: [60, 120], ev: 'kill' },
  { id: 'elite', t: n => `Hạ ${n} yêu vật tinh anh`, n: [4, 8], ev: 'elite' },
  { id: 'clear', t: () => "Qua bất kỳ một chương nào", n: [1, 1], ev: 'clear' },
  { id: 'rift',  t: () => "Xông qua Ảo Cảnh Cửu U một lần", n: [1, 1], ev: 'rift', rift: true },
  { id: 'chest', t: n => `Mở ${n} rương báu`, n: [2, 4], ev: 'chest' },
  { id: 'event', t: n => `Hoàn thành ${n} kỳ ngộ`, n: [3, 6], ev: 'event' },
  { id: 'boss',  t: n => `Đánh bại ${n} thủ lĩnh`, n: [2, 4], ev: 'boss' },
  { id: 'room',  t: n => `Khám phá ${n} phòng`, n: [40, 80], ev: 'room' },
  { id: 'forge', t: n => `Cường hóa ở Lò Rèn ${n} lần`, n: [2, 4], ev: 'forge' },
];

const BESTIARY_TIERS = [50, 200, 1000];

const ACHIEVEMENTS = [
  { id: 'ch1',    n: "Mới Vào Giang Hồ",   d: "Qua chương 1",               st: { dmgPct: 2 },  chk: S => storyCleared('normal') >= 1 },
  { id: 'ch5',    n: "Có Chút Danh Tiếng",   d: "Qua chương 5",               st: { hpPct: 3 },   chk: S => storyCleared('normal') >= 5 },
  { id: 'ch10',   n: "Anh Hùng Trấn Ma",   d: "Qua cả mười chương",             st: { dmgPct: 5 },  chk: S => storyCleared('normal') >= 10 },
  { id: 'clrNM',  n: "Tu La Trở Về",   d: "Qua cả mười chương ở độ khó Tu La",   st: { hpPct: 5 },   chk: S => storyCleared('nightmare') >= 10 },
  { id: 'clrH',   n: "Luyện Ngục Bất Diệt",   d: "Qua cả mười chương ở độ khó Luyện Ngục",   st: { dmgPct: 8 },  chk: S => storyCleared('hell') >= 10 },
  { id: 'r10',    n: "Lữ Khách Ảo Cảnh",   d: "Xông qua Ảo Cảnh Cửu U tầng 10",       st: { mf: 10 },     chk: S => S.riftMax >= 10 },
  { id: 'r25',    n: "Lão Làng Ảo Cảnh",   d: "Xông qua Ảo Cảnh Cửu U tầng 25",       st: { dmgPct: 3 },  chk: S => S.riftMax >= 25 },
  { id: 'r50',    n: "Tông Sư Ảo Cảnh",   d: "Xông qua Ảo Cảnh Cửu U tầng 50",       st: { hpPct: 5 },   chk: S => S.riftMax >= 50 },
  { id: 'r100',   n: "Chủ Nhân Cửu U",   d: "Xông qua Ảo Cảnh Cửu U tầng 100",      st: { dmgPct: 10 }, chk: S => S.riftMax >= 100 },
  { id: 'k500',   n: "Trảm Yêu Trừ Ma",   d: "Tổng cộng diệt 500 con yêu",          st: { gf: 10 },     chk: S => S.stats.kills >= 500 },
  { id: 'k5000',  n: "Thiên Nhân Trảm",     d: "Tổng cộng diệt 5000 con yêu",         st: { critDmg: 10 },chk: S => S.stats.kills >= 5000 },
  { id: 'k50000', n: "Sát Thần",       d: "Tổng cộng diệt 50000 con yêu",        st: { dmgPct: 5 },  chk: S => S.stats.kills >= 50000 },
  { id: 'leg',    n: "Thần Binh Xuất Thế",   d: "Nhận món thần binh đầu tiên",           st: { mf: 5 },      chk: S => !!S.flags.legend },
  { id: 'set4',   n: "Bậc Thầy Phối Bộ",   d: "Một nhân vật bất kỳ mặc đủ một bộ 4 món",  st: { res: 3 },     chk: S => !!S.flags.set4 },
  { id: 'anc',    n: "Sức Mạnh Thượng Cổ",   d: "Nhận một món trang bị Thượng Cổ",         st: { dmgPct: 2 },  chk: S => !!S.flags.ancient },
  { id: 'pri',    n: "Thần Khí Thái Cổ",   d: "Nhận một món trang bị Thái Cổ",         st: { dmgPct: 5 },  chk: S => !!S.flags.primal },
  { id: 'plus10', n: "Đại Sư Rèn Kiếm",   d: "Cường hóa một món trang bị lên +10",     st: { armorPct: 5 },chk: S => !!S.flags.plus10 },
  { id: 'gob10',  n: "Thần Tài Nhập Thân",   d: "Hạ 10 con Kim Thiềm Chiêu Tài",       st: { gf: 20 },     chk: S => S.stats.goblins >= 10 },
  { id: 'cube10', n: "Càn Khôn Trong Tay",   d: "Túi Càn Khôn cất 10 loại hiệu ứng thần binh", st: { mf: 10 },     chk: S => Object.keys(S.cube).length >= 10 },
  { id: 'cubeAll',n: "Thần Binh Phổ",     d: "Túi Càn Khôn cất đủ mọi hiệu ứng thần binh",   st: { dmgPct: 8 },  chk: S => Object.keys(S.cube).length >= LEGENDS.length },
  { id: 'all20',  n: "Ngũ Môn Giai Thông",   d: "Cả năm môn phái đều đạt cấp 20",     st: { hpPct: 3 },   chk: S => CLASS_IDS.every(c => S.chars[c].level >= 20) },
  { id: 'p10',    n: "Trúc Cơ",       d: "Tu vi đạt cấp 10",           st: { res: 3 },     chk: S => S.para.lv >= 10 },
  { id: 'p50',    n: "Hóa Thần",       d: "Tu vi đạt cấp 40",           st: { dmgPct: 5 },  chk: S => S.para.lv >= 40 },
  { id: 'best20', n: "Bách Yêu Phổ",     d: "Đồ giám yêu vật đạt 20 bậc",   st: { dmgPct: 3 },  chk: S => bestiaryTiers() >= 20 },
  { id: 'bnt10',  n: "Thợ Săn Tiền Thưởng",   d: "Hoàn thành 10 truy nã giang hồ",       st: { gf: 15 },     chk: S => S.stats.bounties >= 10 },
  { id: 'lg25',   n: "Đại Sư Dưỡng Ngọc",   d: "Nâng một viên linh ngọc lên cấp 25",     st: { critDmg: 10 },chk: S => S.lgems.some(g => g.lv >= 25) },
];

// ============ 九幽幻境 · 大秘境 ============
// 限时：一炷香 = 12 分钟（毫秒）。地图上按真实时间走；战斗里按读条折算（一轮 3 秒，和战斗倍速、跳不跳过无关）
const RIFT_CLOCK = { room: 35 };
var RIFT_LIMIT = 12 * 60 * 1000;
const riftLimit = N => RIFT_LIMIT;
// 剩下多少香 → 灵玉升级次数、下次最多能挑战高几层
const RIFT_GRADES = [
  { min: 0.5,  n: "Thần Tốc", upg: 5, jump: 3 },
  { min: 0.25, n: "Nhanh Nhẹn", upg: 4, jump: 2 },
  { min: 0, n: "Ung Dung", upg: 3, jump: 1 },
  { min: -1,   n: "Tàn Hương", upg: 1, jump: 0 },
];

// 幻境套装：每个职业一套 6 件，只在幻境 RSET_LV 层以上掉落
const RSET_LV = 20;
SETS.push(
  { id: 'xuehai', n: "Huyết Hải Vô Nhai", cls: 'berserker', rift: true,
    pieces: [['helm', "Huyết Hải Chiến Khôi"], ['chest', "Huyết Hải Chiến Giáp"], ['gloves', "Huyết Hải Hộ Uyển"], ['boots', "Huyết Hải Chiến Ngoa"], ['ring', "Huyết Hải Ban Chỉ"], ['amulet', "Huyết Hải Hộ Tâm Kính"]],
    b2: { furyGain: 30, hpPct: 10 }, b2d: "Nộ ý nhận được +30%, khí huyết tối đa +10%",
    b4: 'xueHai4', b4d: "Bá Vương Giải Giáp chỉ nuốt một nửa Nộ ý; Nộ ý quá nửa thì sát thương phải nhận -25%",
    b6: 'xueHai6', b6d: "Mỗi 1 điểm Nộ ý, sát thương +1,5% (đầy nộ +150%); sát thương Bá Vương Giải Giáp gấp đôi" },
  { id: 'guiyuan', n: "Ngũ Hành Quy Nguyên", cls: 'mage', rift: true,
    pieces: [['helm', "Quy Nguyên Đạo Quan"], ['chest', "Quy Nguyên Pháp Y"], ['gloves', "Quy Nguyên Hộ Uyển"], ['boots', "Quy Nguyên Vân Lý"], ['ring', "Quy Nguyên Ban Chỉ"], ['amulet', "Quy Nguyên Ngọc Bội"]],
    b2: { lianPct: 4, elem: 20 }, b2d: "Mỗi tầng “Liên” cộng thêm +4% sát thương, sát thương thuật pháp +20%",
    b4: 'guiYuan4', b4d: "Ra chiêu đứt tương sinh, “Liên” không về không, chỉ lùi 2 tầng",
    b6: 'guiYuan6', b6d: "Khi “Liên” đầy, chiêu đó sát thương ×3, và lan 60% sát thương sang mọi kẻ địch còn lại" },
  { id: 'yinbing', n: "Âm Binh Mượn Đường", cls: 'necro', rift: true,
    pieces: [['helm', "Âm Binh Nón Lá"], ['chest', "Âm Binh Thọ Y"], ['gloves', "Âm Binh Chỉ Sáo"], ['boots', "Âm Binh Dép Cỏ"], ['ring', "Âm Binh Ban Chỉ"], ['amulet', "Âm Binh Chuông Đồng"]],
    b2: { minion: 1, minionPct: 20 }, b2d: "Thi vị +1, sức mạnh cương thi +20%",
    b4: 'yinBing4', b4d: "Cương thi ngã xuống thì nổ tung, đánh mọi kẻ địch bằng 50% khí huyết tối đa của nó",
    b6: 'yinBing6', b6d: "Sát thương cương thi ×4; mỗi cương thi có mặt, sát thương bạn phải nhận -7%" },
  { id: 'qisha', n: "Thất Sát", cls: 'assassin', rift: true,
    pieces: [['helm', "Thất Sát Diện Tráo"], ['chest', "Thất Sát Dạ Hành Y"], ['gloves', "Thất Sát Chỉ Sáo"], ['boots', "Thất Sát Nhuyễn Ngoa"], ['ring', "Thất Sát Ban Chỉ"], ['amulet', "Thất Sát Ngọc Bội"]],
    b2: { crit: 8, critDmg: 30 }, b2d: "Tỉ lệ chí mạng +8%, sát thương chí mạng +30%",
    b4: 'qiSha4', b4d: "Giới hạn Sát ý +2; dùng xong đòn kết liễu được hoàn 2 điểm Sát ý",
    b6: 'qiSha6', b6d: "Sát thương đòn kết liễu ×4; đòn kết liễu giết được mục tiêu thì hồi chiêu ngay lập tức" },
  { id: 'luohan', n: "La Hán Kim Thân", cls: 'paladin', rift: true,
    pieces: [['helm', "La Hán Tăng Mạo"], ['chest', "La Hán Cà Sa"], ['gloves', "La Hán Hộ Uyển"], ['boots', "La Hán Tăng Hài"], ['ring', "La Hán Ban Chỉ"], ['amulet', "La Hán Niệm Châu"]],
    b2: { counter: 20, armorPct: 30 }, b2d: "Tỉ lệ phản kích +20%, hộ giáp +30%",
    b4: 'luoHan4', b4d: "Phản kích đánh mọi kẻ địch, sát thương từ 80% lên 200%; đòn bị hộ thể đỡ cũng phản kích",
    b6: 'luoHan6', b6d: "Tỉ lệ phản kích thêm +15%; mỗi lần phản kích cộng một tầng “Phật nộ” (trong trận này, tối đa 10 tầng): mỗi tầng sát thương +30%, sát thương phải nhận -4%" },
);
STAT_NAMES.furyGain = STAT_NAMES.furyGain || "Nộ ý nhận được";
STAT_NAMES.lianPct = STAT_NAMES.lianPct || "Sát thương mỗi tầng “Liên”";
STAT_NAMES.counter = STAT_NAMES.counter || "Tỉ lệ phản kích";

// 镇妖录：幻境里收服妖物的精魄。一章一页，层数越高精魄品级越高（一品到五品）
const zyGrade = N => Math.min(5, 1 + Math.floor(N / 20));   // 一品 1–19 层，二品 20–39，三品 40–59，四品 60–79，五品 80 层以上
const ZY_CN = ['', "Nhất phẩm", "Nhị phẩm", "Tam phẩm", "Tứ phẩm", "Ngũ phẩm"];
const ZY_NEED = 5;   // 一页收服首领 + 至少 5 种妖物，就能读到这一页的后记
const ZY_PAGES = [
  { st: { hpPct: 0.3 }, sd: "Khí huyết tối đa",
    hou: "Viên huyện lệnh trong Ảo Cảnh vẫn còn thăng đường, hết lần này đến lần khác. Sư phụ Lưu nghe chuyện, mang theo ấn quan cũ lên Bãi Tha Ma một chuyến, chắp tay trước nấm mồ trống, nói giọng quan cách cả buổi, cuối cùng chỉ nói hai chữ: “Bãi đường.”\nTừ đó về sau, viên huyện lệnh trong Ảo Cảnh có ra nữa thì kinh đường mộc cũng đập nhẹ tay hơn." },
  { st: { critDmg: 0.8 }, sd: "ST chí mạng",
    hou: "Hang sói Rừng Hắc Phong về sau lại có động tĩnh. Lôi Lão Hổ dẫn Tiểu Hổ đi xem, từ xa thấy một con sói mẹ ngậm con chui vào khe đá, ngoảnh lại nhìn họ một cái.\nTiểu Hổ nói nó đang gật đầu. Lôi Lão Hổ bảo mày nhìn nhầm rồi, trên đường về lại tra đao vào vỏ." },
  { st: { dmgPct: 0.25 }, sd: "Sát thương",
    hou: "Quản gia Khang từng gửi tới Động Bàn Tơ một tấm gương đồng, bọc lụa đỏ, nói là “giao thương qua lại”. Gương dựng ở cửa động, mãi không ai soi.\nCho đến một đêm, mặt gương phủ một lớp tơ mỏng, như có ai đó ngồi trước nó, chải tóc rất lâu, rất tỉ mỉ." },
  { st: { armorPct: 0.6 }, sd: "Hộ giáp",
    hou: "Trái “tim” Thiết Đản rèn cho Thạch Ma, cuối cùng không lắp vào. Cậu mang nó về Lò Rèn, treo cạnh lò. Trương Đại Chùy chê chật chỗ, Thiết Đản nói: “Nó bảo nóng, con muốn để nó nguội một chút.”\nMỗi lần ra lò, cậu đều dội lên khối sắt ấy một gáo nước. “Xèo” một tiếng, như một tiếng thở dài thật dài." },
  { st: { res: 0.2 }, sd: "Kháng toàn bộ",
    hou: "Tấm da Xà Mẫu lột ra, theo lời hồn bà gửi gắm trên đường Hoàng Tuyền, được trao vào tay bà lão đánh cá bên đầm. Bà phơi khô, treo ở mũi thuyền, ngày nào ra khơi cũng sờ một cái.\nCó người hỏi bà có sợ không. Bà nói: “Sợ cái gì. Chỉ là một cô gái ngốc bị người ta lừa ba trăm năm.”" },
  { st: { hpPct: 0.3 }, sd: "Khí huyết tối đa",
    hou: "Ông lão mài dao không bao giờ nói chuyện trong trấn treo thanh kiếm của Huyền Băng Tử lên trên sạp mài dao. Kiếm không bán, cũng không mài. Có người hỏi, lần đầu tiên ông mở miệng: “Tổ tiên nợ một đứa bé đưa cơm một mạng. Trả xong rồi.”\nHuyền Băng Tử trong Ảo Cảnh vẫn lạnh mặt xuất kiếm. Nhưng lần nào trước khi ngã xuống, ông cũng nhìn về phía bạn một cái, như để xác nhận — lần này, tiểu sư đệ không còn bị đánh mất nữa." },
  { st: { mf: 1, gf: 2 }, sd: "Phúc duyên, thu hoạch bạc",
    hou: "Quỷ bán rong đổi cho bạn một đoạn ký ức: lúc còn sống Quỷ Vương là người giữ miếu. Miếu sập, hắn cứ chờ mãi, chờ ai đó dựng cho hắn một ngôi mới; chờ đến về sau, ai hứa dựng miếu hắn cũng tin.\nNgày Rằm tháng Bảy, có người dùng giấy dán một ngôi miếu nhỏ ở đầu chợ ma, rồi đốt đi. Từ đó, đèn lồng chợ ma cứ mỗi đêm trăng tròn lại sáng đều tăm tắp, không thiếu một ngọn." },
  { st: { xBoss: 0.4 }, sd: "Sát thương lên thủ lĩnh, tinh anh",
    hou: "Bạch Vân Quán đổi thành Chính Khí Thư Viện. Lò đan ở hậu viện bị dỡ, trong lò cạo ra một lớp tro dày. Cô Trân chôn tro dưới chân núi, không dựng bia.\nTiểu Hổ hỏi cô chôn ai. Cô nói: “Một kẻ sợ chết.” Một lúc sau, lại nói: “…Cũng là một người ba trăm năm chưa ngủ được một giấc ngon.”" },
  { st: { crit: 0.08 }, sd: "Tỉ lệ chí mạng",
    hou: "Kỳ sát hạch cuối năm nay của Đầu Trâu Mặt Ngựa, lần đầu tiên được xếp loại “Tốt”. Bản đánh giá ghi: “Quỷ Môn Quan trật tự nghiêm chỉnh, số hồn ma trốn thoát bằng không.” Cạnh chỗ ký tên có ai đó viết thêm một dòng chữ nhỏ: “Đặc biệt cảm ơn Lưu sư gia trấn Thanh Thạch đã hỗ trợ làm giấy thông hành.”\nSư phụ Lưu đem bản sao đóng khung treo ở nhà quàn, gặp ai cũng nói: “Việc công, vẫn phải để người nhà nước làm.”" },
  { st: { dmgPct: 0.25 }, sd: "Sát thương",
    hou: "Vực Sâu Cửu U đã yên tĩnh. Ma Tôn trong Ảo Cảnh chỉ là một cái bóng vực sâu còn nhớ — nó nhớ ba trăm năm bị khóa, cũng nhớ khoảnh khắc cuối cùng: năm cây đinh cùng sáng lên, trên cây đinh thứ năm, đứng một thiếu niên đã quay về đóng lại đinh.\nTrấn Yêu Lục viết đến trang này, là viết kín rồi." },
];
// 役使：收服一章首领的精魄后，可以带着它的本事上阵；每个角色带 2 只。g = 那只首领精魄的品级（1–5）
const YISHI = {
  xianling: { pg: 0, n: "Kinh Đường Mộc", d: g => `Khai trận đập kinh đường mộc: mỗi kẻ địch có ${16 + g * 6}% tỉ lệ bị chấn choáng (thủ lĩnh giảm nửa)` },
  langwang: { pg: 1, n: "Bầy Sói", d: g => `Mỗi lần bạn ra đòn, có ${18 + g * 5}% tỉ lệ dẫn bóng sói vồ cắn mục tiêu, gây ${60 + g * 20}% sát thương` },
  zhizhu:   { pg: 2, n: "Triền Ti", d: g => `Khai trận quấn tơ nhện lên mọi kẻ địch: đóng băng (chậm lại) ${2 + Math.ceil(g / 2)} lượt` },
  shimo:    { pg: 3, n: "Dung Tâm", d: g => `Khi bị đánh có ${15 + g * 5}% tỉ lệ dung nham bắn ngược, gây ${80 + g * 30}% sát thương hỏa lên kẻ ra đòn và thiêu đốt` },
  shemu:    { pg: 4, n: "Lột Da", d: g => `Mỗi trận một lần: khí huyết dưới 35% thì lột da, hồi ${14 + g * 5}% khí huyết tối đa, xóa trúng độc, thiêu đốt, đóng băng và choáng trên người` },
  xuanbing: { pg: 5, n: "Phong Trấn", d: g => `Sát thương lên địch đang choáng hoặc đóng băng (chậm lại) +${12 + g * 6}%` },
  guiwang:  { pg: 6, n: "Chợ Ma", d: g => `Phúc duyên +${12 + g * 8}%, thu hoạch bạc +${20 + g * 10}% (để săn đồ)` },
  qingxu:   { pg: 7, n: "Đan Hỏa Hộ Thể", d: g => `Đầu mỗi trận nhận hộ thể bằng ${8 + g * 4}% khí huyết tối đa` },
  niuma:    { pg: 8, n: "Câu Hồn", d: g => `Yêu vật thường dưới ${8 + g * 3}% khí huyết thì bị câu đi luôn (tinh anh và thủ lĩnh không tính)` },
  mozun:    { pg: 9, n: "Ma Khí", d: g => `Sát thương +${8 + g * 4}%, nhưng sát thương phải nhận +8%` },
};
