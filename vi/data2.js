// ============ 九幽回廊 · 长线玩法内容 ============

STAT_NAMES.frozenDmg = "Sát thương lên địch bất động";
PCT_STATS.add('frozenDmg');
const MAX_LEVEL = 50;

const RUNES = {
  // 2026-11 补齐：每招两个变招，一攻一守（或一辅）。道士标「改为 X 行」的会换五行，方便凑齐一圈相生
  liedi:      [{ n: "Băng Sơn", d: "Sát thương +60%" }, { n: "Chấn Địa", d: "40% tỉ lệ gây choáng; kẻ địch trúng đòn trong 2 lượt sát thương -20%" }],
  lieyan:     [{ n: "Liệu Nguyên", d: "Thiêu đốt lan sang mọi kẻ địch" }, { n: "Phần Thân", d: "Sát thương lên kẻ địch đang bị thiêu đốt +80%" }],
  hanren:     [{ n: "Toái Cốt", d: "Kẻ địch trúng đòn trong 3 lượt nhận sát thương +20%" }, { n: "Hàn Giáp", d: "Đánh trúng thì nhận hộ thể bằng 8% khí huyết tối đa" }],
  bawang:     [{ n: "Phá Phủ", d: "Nộ ý đầy thì chắc chắn chí mạng" }, { n: "Tá Lực", d: "Hồi máu theo Nộ ý đã tiêu: mỗi điểm 0,3% khí huyết tối đa" }],
  butui:      [{ n: "Tử Chiến", d: "Trong lúc Bất Thoái sát thương +40%" }, { n: "Thiết Bích", d: "Kéo dài thêm 1 lượt, trong lúc đó phản chấn gấp đôi" }],
  luoshi:     [{ n: "Vẫn Thiết Quyết", d: "Đổi thành hành Kim, sát thương +30%" }, { n: "Sơn Băng", d: "30% tỉ lệ gây choáng mỗi kẻ địch" }],
  jinguang:   [{ n: "Huyền Thủy Chú", d: "Đổi thành hành Thủy, kẻ địch trúng đòn bị đóng băng" }, { n: "Kim Quang Phá Giáp", d: "Sát thương lên kẻ địch đang phá giáp +60%" }],
  lunzhuan:   [{ n: "Hậu Thổ Phù", d: "Đổi thành hành Thổ, kích nổ xong bản thân nhận một lớp bùa hộ thân" }, { n: "Dư Tẫn", d: "Kích nổ xong mục tiêu bị thiêu đốt lại" }],
  wulei:      [{ n: "Thanh Mộc Lôi", d: "Đổi thành hành Mộc, “Liên” đủ 3 tầng là đánh trúng mọi kẻ địch" }, { n: "Thiên Phạt", d: "Sát thương lên kẻ địch đang choáng gấp đôi" }],
  jihuo:      [{ n: "Thi Triều", d: "Khi tập hỏa cương thi tấn công +30%" }, { n: "Hộ Chủ", d: "Sau tập hỏa, đòn kế tiếp đánh vào bạn do cương thi chịu thay toàn bộ" }],
  shidu:      [{ n: "Thực Cốt", d: "Sát thương +100%, và làm mọi kẻ địch phá giáp" }, { n: "Hủ Độc", d: "Kẻ địch trúng độc gây sát thương -15%" }],
  yangshi:    [{ n: "Tá Thi Hoàn Hồn", d: "Đồng thời dựng dậy một cương thi đã ngã" }, { n: "Thi Giáp", d: "Trong 3 lượt cương thi nhận sát thương -40%, bạn -15%" }],
  tudun:      [{ n: "Địa Liệt", d: "Sát thương +60%, 30% tỉ lệ gây choáng" }, { n: "Nhập Thổ Vi An", d: "Bản thân bạn cũng hồi 15% khí huyết tối đa" }],
  bingpo:     [{ n: "Hàn Tinh", d: "Ba kim đều đánh cùng một mục tiêu" }, { n: "Phong Mạch", d: "Kẻ địch trúng đòn trong 2 lượt sát thương -25%" }],
  dici:       [{ n: "Xuyên Tâm", d: "Chắc chắn chí mạng, không còn gây choáng" }, { n: "Cạm Bẫy", d: "Tỉ lệ gây choáng lên 70%, sát thương -30%" }],
  shadowkill: [{ n: "Ảnh Phân", d: "Chuỗi đâm chia đều cho mọi kẻ địch" }, { n: "Thị Huyết Ảnh", d: "Mỗi nhát đâm hồi 2% khí huyết tối đa" }],
  yandun:     [{ n: "Độc Yên", d: "Khi Yên Độn làm mọi kẻ địch trúng độc" }, { n: "Kim Thiền", d: "Kéo dài thêm 1 lượt, trong lúc đó mỗi lượt hồi 5% khí huyết tối đa" }],
  ganlu:      [{ n: "Tịnh Thế", d: "Sát thương +80%" }, { n: "Cam Lâm", d: "Hồi máu gấp đôi, không còn gây sát thương" }],
  fuhu:       [{ n: "Hàng Long", d: "Chắc chắn chí mạng lên kẻ địch đang choáng" }, { n: "Tá Kình", d: "Kẻ địch trúng đòn trong 3 lượt sát thương -30%" }],
  budong:     [{ n: "Minh Vương Nộ", d: "Sát thương +60%" }, { n: "Kim Thân", d: "Hộ thể gấp đôi, hồi chiêu +1" }],
  chanhou:    [{ n: "Đương Đầu Bổng Hát", d: "Khi dùng có 50% tỉ lệ gây choáng mỗi kẻ địch" }, { n: "Thiền Định", d: "Khiêu khích thêm 1 hiệp" }],
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
// 灵玉 2026-11-23 重做：删掉只是普通属性的五颗（战神、长生、疾风、破军、回春）；留六颗特色玉；
// 每个门派一颗本命玉（cls：只有本门能放进灵玉匣），两套幻境套装都吃得到；另外五颗不绑门派、绑一种打法。
// st：直接加到属性上的部分；机制部分在战斗里按 P.lgv[类型] = 等级 读（LGV 里的公式）
// ---------------- 阵法（2026-11-23，照梦幻西游的阵：四个号位，1、2 号前排，3、4 号后排，各号位加成不同，有的有代价） ----------------
// b：加成（跟着阵的等级涨，10 级是 1 级的 1.9 倍）；p：代价（不涨）；all：全员都有的加成/代价（同样 b 涨 p 不涨）
// 键：dmg 伤害%，dr 受到的伤害 -%（负数是多挨），spd 速度%，arm 护甲%，heal 受到的治疗%，aggro 妖物先打他的几率%，ext 挂的状态多几回合，stD 对身上有状态的妖物伤害%
// at：幻境到过多少层学会；ch：主线通关第几章学会（哪个先到算哪个）
const FORMS = {
  san:       { n: "Tán Trận", s: "Tán", tag: "Không bày trận", d: "Không bày trận: hàng trước sau theo môn phái, không tăng ích cũng không phải trả giá. Yêu vật bày trận là sẽ khắc bạn." },
  tianfu:    { n: "Thiên Phúc Trận", s: "Thiên Phúc", tag: "Cả đội tấn công mạnh", at: 10, ch: 2, rows: [0, 0, 1, 1], pos: [{}, {}, {}, {}], all: { b: { dmg: 18 }, p: { spd: -6 } } },
  niaoxiang: { n: "Điểu Tường Trận", s: "Điểu Tường", tag: "Giành ra tay trước", at: 20, ch: 4, rows: [0, 0, 1, 1], pos: [{ b: { spd: 20 } }, { b: { spd: 10 } }, { b: { spd: 10 } }, { p: { dr: -10 } }] },
  dizai:     { n: "Địa Tải Trận", s: "Địa Tải", tag: "Thủ vững", at: 30, ch: 6, rows: [0, 0, 1, 1], pos: [{ b: { dr: 25 } }, { b: { arm: 30 } }, { b: { heal: 20 } }, { b: { heal: 20 } }], all: { p: { dmg: -10 } } },
  huyi:      { n: "Hổ Dực Trận", s: "Hổ Dực", tag: "Một người đột kích", at: 45, ch: 8, rows: [0, 0, 1, 1], pos: [{ b: { dmg: 30, aggro: 35 }, p: { dr: -15 } }, { b: { dmg: 10 } }, { b: { dmg: 10 } }, { b: { dr: 15 } }] },
  shepan:    { n: "Xà Bàn Trận", s: "Xà Bàn", tag: "Khống chế, gắn trạng thái", at: 60, ch: 10, rows: [0, 0, 1, 1], pos: [{ b: { ext: 1, stD: 15 } }, { b: { dr: 10 } }, { b: { dr: 10 } }, { b: { dr: 10 } }], all: { p: { spd: -5 } } },
};
const FORM_IDS = ['tianfu', 'niaoxiang', 'dizai', 'huyi', 'shepan'];
const FORM_BEAT = { huyi: 'shepan', shepan: 'niaoxiang', niaoxiang: 'tianfu', tianfu: 'dizai', dizai: 'huyi' };   // 谁克谁：虎翼冲散蛇蟠，蛇蟠缠住鸟翔，鸟翔快过天覆，天覆压垮地载，地载挡住虎翼；五个阵都克散阵
const FORM_WHY = { huyi: "một người đột kích, phá tan trận cuộn", shepan: "quấn chặt kẻ nhanh", niaoxiang: "ra tay trước đợt tấn công mạnh", tianfu: "tấn công mạnh đè bẹp trận thủ", dizai: "thủ vững chặn đột kích đơn lẻ" };
const FORM_MAX = 10; let FORM_K = 10, EFM_FROM = 20;   // 阵最高 10 级；克制：克的一方伤害 +10%，被克的一方 -10%；幻境 20 层起妖物摆阵
const formCost = lv => 30 * lv;   // 升到下一级要的魂晶
const formScale = (v, lv) => v * (1 + 0.1 * ((lv || 1) - 1));
const FORM_STAT = { dmg: "Sát thương", dr: "nhận sát thương", spd: "Tốc độ", arm: "Hộ giáp", heal: "nhận hồi máu", aggro: "yêu vật đánh người này trước", ext: "trạng thái kéo dài thêm", stD: "sát thương lên yêu vật có trạng thái" };
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
  pain:  { n: "Huyết Sát Ngọc", c: '#ff4a4a', d: lv => `Đòn đánh gây trúng độc: mỗi lượt ${20 + lv}% công`, st: lv => ({ poison: 20 + lv }) },
  ice:   { n: "Hàn Tủy Ngọc", c: '#8fd0ff', d: lv => `Tỉ lệ bất động +${(5 + lv * 0.2).toFixed(1)}%, sát thương lên địch bất động +${20 + lv}%`, st: lv => ({ freeze: 5 + lv * 0.2, frozenDmg: 20 + lv }) },
  greed: { n: "Chiêu Tài Ngọc", c: '#f1c94a', d: lv => `Thu hoạch bạc +${30 + lv * 2}%, phúc duyên +${10 + lv}%`, st: lv => ({ gf: 30 + lv * 2, mf: 10 + lv }) },
  guard: { n: "Kim Chung Ngọc", c: '#e8c13a', d: lv => `Sát thương phải nhận -${(6 + lv * 0.3).toFixed(1)}%; khí huyết dưới 30% thì hiệu quả gấp đôi`, st: lv => ({ gDr: 6 + lv * 0.3 }) },
  bond:  { n: "Đồng Tâm Ngọc", c: '#ff9ad0', d: lv => `Sát thương và khí huyết của đồng hành, Ngoc, cương thi +${15 + lv}%`, st: lv => ({ allyPct: 15 + lv }) },
  flow:  { n: "Lưu Quang Ngọc", c: '#9ae8ff', d: lv => `Chiêu có hồi chiêu sau khi tung ra có ${Math.min(CDSKIP_CAP, 10 + lv * 0.4).toFixed(1)}% tỉ lệ không vào hồi chiêu (cộng mọi nguồn tối đa ${CDSKIP_CAP}%)`, st: lv => ({ cdSkip: 10 + lv * 0.4 }) },
  // ---- 本命玉：每门一颗 ----
  zhanhun: { n: "Chiến Hồn Ngọc", c: '#ff6a3a', cls: 'berserker', d: lv => `Nộ ý nhận được +${Math.round(20 + lv)}%; nộ ý quá nửa thì sát thương +${LGV.zhHalf(lv).toFixed(0)}%; khí huyết mỗi lần thiếu 10%, sát thương thêm +${LGV.zhLow(lv).toFixed(1)}% (Huyết Hải, Tu La Bất Tử)`, st: lv => ({ furyGain: 20 + lv, lowHpK: LGV.zhLow(lv) }) },
  wuxing:  { n: "Ngũ Hành Ngọc", c: '#c8a2ff', cls: 'mage', d: lv => `Khi đổi sang hành khác để ra chiêu, ${LGV.wxCh(lv).toFixed(0)}% tỉ lệ gắn lên mục tiêu trạng thái của hành đó (Hỏa thiêu đốt, Thủy băng đông, Thổ phá giáp, Mộc trúng độc, Kim choáng); mỗi tầng “Liên” sát thương thêm +${(1.5 + lv * 0.06).toFixed(1)}% (Quy Nguyên, Vạn Phù)`, st: lv => ({ lianPct: 1.5 + lv * 0.06 }) },
  shiwang: { n: "Thi Vương Ngọc", c: '#7fd08a', cls: 'necro', d: lv => `Sát thương và khí huyết của cương thi +${Math.round(20 + lv * 0.8)}%; mỗi thi vị còn trống, sát thương trúng độc của bạn +${LGV.swPoi(lv).toFixed(0)}% (Âm Binh, Ngũ Độc)`, st: lv => ({ minionPct: 20 + lv * 0.8 }) },
  duopo:   { n: "Đoạt Phách Ngọc", c: '#a0a8ff', cls: 'assassin', d: lv => `Giới hạn Sát ý +1; ám khí (Tiêu Tẩm Độc, Băng Phách Châm, Mạn Thiên Hoa Vũ) trúng thì ${LGV.dpKi(lv).toFixed(0)}% tỉ lệ +1 Sát ý; sát thương đòn kết liễu +${LGV.dpFin(lv).toFixed(0)}% (Thất Sát, Thiên Cơ)`, st: () => ({}) },
  jinshen: { n: "Kim Thân Ngọc", c: '#ffd76a', cls: 'paladin', d: lv => `Bội số phản chấn +${Math.round(30 + lv)}%; mỗi lần bị đánh phản chấn, nhận hộ thể chân khí bằng ${LGV.jsSh(lv).toFixed(1)}% khí huyết tối đa (La Hán, Đại Nhật)`, st: lv => ({ thornK: 30 + lv }) },
  // ---- 打法玉：不绑门派，配对了套装才好用 ----
  lianhuan: { n: "Liên Hoàn Ngọc", c: '#ffb060', d: lv => `Chiêu đánh lan mỗi khi trúng thêm một kẻ địch, chiêu đó sát thương +${LGV.lhK(lv).toFixed(1)}% (tính tối đa 5 kẻ). Hợp với Tu La Bất Tử, Vạn Phù, Thiên Cơ, Đại Nhật`, st: () => ({}) },
  shigu:    { n: "Thực Cốt Ngọc", c: '#9ad86a', d: lv => `Trên người kẻ địch mỗi có một loại trạng thái, sát thương nó nhận từ bạn +${LGV.sgK(lv).toFixed(1)}%; trạng thái bạn gắn kéo dài thêm 1 hiệp. Hợp với Vạn Phù, Ngũ Độc, Thiên Cơ, Quy Nguyên`, st: () => ({}) },
  xuanjia:  { n: "Huyền Giáp Ngọc", c: '#8ab0d8', d: lv => `Khi có hộ thể, sát thương +${LGV.xjK(lv).toFixed(0)}%; hộ thể bị đánh vỡ thì nổ tung, gây ${LGV.xjBoom(lv).toFixed(0)}% sát thương lên mọi kẻ địch (hai hiệp tối đa một lần). Hợp với Đại Nhật, La Hán, Đạo Sĩ Ngũ Hành`, st: () => ({}) },
  shisha:   { n: "Thị Sát Ngọc", c: '#e05a5a', d: lv => `Mỗi khi có một kẻ địch ngã xuống: hồi ${LGV.ssHeal(lv).toFixed(1)}% khí huyết, chiêu kế tiếp sát thương +${LGV.ssK(lv).toFixed(0)}% (cộng dồn tối đa 3 tầng, ra chiêu xong thì xóa). Hợp với Thất Sát, Tu La Bất Tử, Âm Binh`, st: () => ({}) },
  tiangang: { n: "Thiên Cương Ngọc", c: '#ffe08a', d: lv => `Tuyệt kỹ tích nhanh hơn ${Math.round(30 + lv * 0.5)}%; tung tuyệt kỹ xong, hai chiêu sau sát thương +${LGV.tgK(lv).toFixed(0)}%. Hợp với Huyết Hải, Đại Nhật và các lối đánh dựa vào tuyệt kỹ`, st: lv => ({ xRage: 30 + lv * 0.5 }) },
  // 老存档里被删的灵玉：先放在这里，等玩家挑一颗新的换（等级保留）
  reforge:  { n: "Linh ngọc chờ tái luyện", c: '#8a8070', d: () => "Hiệu quả của viên linh ngọc này đã bị xóa: vào “Linh ngọc · Tái luyện” chọn một viên mới, cấp giữ nguyên", st: () => ({}), hide: true },
};
const LGEM_OLD = { power: "Chiến Thần Ngọc", life: "Trường Sinh Ngọc", zeal: "Tật Phong Ngọc", slay: "Phá Quân Ngọc", renew: "Hồi Xuân Ngọc" };
// 灵玉匣：通关后每个角色一个，不是掉出来的装备。自带一点气血和伤害（跟着幻境最高纪录涨），三个孔镶灵玉
const BOX_SLOTS = 3;
const boxStat = riftMax => 5 + Math.floor((riftMax || 0) / 10);

// 流派推荐：通关后每个门派两条路（对应两套幻境套装）。sk：[招式, 变招]；leg：腰带、副手上的神兵；cube：乾坤袋三格；gems：灵玉匣三颗
const BUILDS = {
  berserker: [
    { set: 'xuehai', d: "Tích đầy Nộ ý, Bá Vương Giải Giáp một đao định đoạt, đánh yêu vương nhanh nhất", sk: [['liedi', 'a'], ['bawang', 'a'], ['hanren', 'a'], ['warcry', 'b'], ['bloodlust', 'b']],
      leg: ['bawangdai', 'nutaoqiao'], cube: ['butcher', 'champion', 'yinxuejie'], gems: ['zhanhun', 'tiangang', 'guard'] },
    { set: 'busi', d: "Giữ máu thấp mà xoay Toàn Phong Đao, càng tàn càng điên, dọn bầy nhanh nhất", sk: [['liedi', 'b'], ['whirl', 'a'], ['bloodlust', 'b'], ['warcry', 'a'], ['butui', 'b']],
      leg: ['xiuluodai', 'liediqiao'], cube: ['xuexuan', 'madman', 'pojunkui'], gems: ['zhanhun', 'guard', 'lianhuan'] } ],
  mage: [
    { set: 'guiyuan', d: "Mộc Hỏa Thổ Kim Thủy nối hết vòng này sang vòng khác, “Liên” đầy thì mỗi chiêu gấp ba", sk: [['chain', 'b'], ['fireball', 'b'], ['luoshi', 'b'], ['jinguang', 'b'], ['frostnova', 'b']],
      leg: ['wuxingtao', 'taijixia'], cube: ['surge', 'hourglass', 'sanmei'], gems: ['wuxing', 'guard', 'shigu'] },
    { set: 'wanfu', d: "Không cần thứ tự, treo đầy trạng thái lên cả sân rồi kích nổ", sk: [['frostnova', 'a'], ['luoshi', 'b'], ['fireball', 'b'], ['lunzhuan', 'b'], ['meteor', 'a']],
      leg: ['baifudai', 'zhenxiexia'], cube: ['yinbaozhu', 'sanmei', 'surge'], gems: ['wuxing', 'shigu', 'guard'] } ],
  necro: [
    { set: 'yinbing', d: "Bầy xác nghiền nát: cương thi chịu đòn thay bạn, ngã xuống còn nổ", sk: [['summon', 'a'], ['jihuo', 'a'], ['yangshi', 'a'], ['bonestorm', 'b'], ['corpse', 'a']],
      leg: ['ganshisuo', 'shehunling'], cube: ['baigufan', 'shiwangguan', 'hanshipao'], gems: ['shiwang', 'bond', 'shisha'] },
    { set: 'duxing', d: "Không mang xác, một mình chồng độc rồi kết toán một lần", sk: [['shidu', 'a'], ['tudun', 'a'], ['curse', 'b'], ['bonestorm', 'b']],
      leg: ['baigunang', 'caoren'], cube: ['surge', 'earth', 'soul'], gems: ['shiwang', 'pain', 'shigu'] } ],
  assassin: [
    { set: 'qisha', d: "Tích Sát ý, đòn kết liễu hạ từng tên; giết một tên là hồi chiêu ngay", sk: [['venom', 'a'], ['shadowstep', 'a'], ['dici', 'a'], ['deathmark', 'a'], ['shadowkill', 'b']],
      leg: ['cangfengdai', 'wuyingnang'], cube: ['duoming', 'yingsha', 'abyssEye'], gems: ['duopo', 'guard', 'tiangang'] },
    { set: 'qianji', d: "Hạ độc trước, rồi ám khí phủ kín cả sân", sk: [['venom', 'b'], ['fan', 'b'], ['bingpo', 'b'], ['yandun', 'a'], ['deathmark', 'b']],
      leg: ['qianjidai', 'baidunang'], cube: ['qianzhen', 'huoyannang', 'momentum'], gems: ['duopo', 'pain', 'shigu'] } ],
  paladin: [
    { set: 'luohan', d: "Sư Tử Hống giữ chân mọi yêu vật, bị đánh một cái bật lại một cái, tích đủ thì Kim Cương Chấn quét cả sân, càng đánh càng cứng", sk: [['aegis', 'a'], ['chanhou', 'b'], ['budong', 'b'], ['hammer', 'a'], ['prayer', 'a']],
      leg: ['fumodai', 'muyu'], cube: ['jinganglingo', 'earth', 'budongxiang'],   /* 2026-11-24 睚眦佩、荆棘铠换成金刚铃、镇山履（反击并进反震后睚眦佩只占 0.2% 伤害；300 层实测打小怪胜率 50%→64%） */ gems: ['jinshen', 'guard', 'xuanjia'] },
    { set: 'dari', d: "Nuôi hộ thể, chủ động ra chiêu để bồi Phật quang", sk: [['hammer', 'b'], ['fuhu', 'a'], ['ganlu', 'a'], ['budong', 'a'], ['prayer', 'b']],
      leg: ['daridai', 'zijinbo'], cube: ['jingangchu', 'ganluping', 'hourglass'], gems: ['jinshen', 'xuanjia', 'tiangang'] } ],
};
// 改五行的变招（只有道士用得上）
const RUNE_WX = { luoshi: { a: 'jin' }, jinguang: { a: 'shui' }, lunzhuan: { a: 'tu' }, wulei: { a: 'mu' } };
const runeWx = (k, r) => (RUNE_WX[k.id] && RUNE_WX[k.id][r]) || k.wx;

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
  // 根基（root）：乘在最终的攻击／护甲／气血上，不和套装、灵玉那一堆百分比加在一起稀释。每项 50 点封顶（+100%）
  { k: 'pAtk', n: "Công", v: 2, cap: 100, root: 1 },
  { k: 'pArmor', n: "Hộ giáp", v: 2, cap: 100, root: 1 },
  { k: 'pHp', n: "Khí huyết", v: 2, cap: 100, root: 1 },
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
// 限时：一炷香 = 13 分钟（毫秒）。地图上按真实时间走；战斗里按读条折算（一轮 3 秒，和战斗倍速、跳不跳过无关）
const RIFT_CLOCK = { room: 35 };
var RIFT_LIMIT = 13 * 60 * 1000;   // 原来 12 分钟；守关妖王血量 ×1.6 后多给 1 分钟
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
    b4: 'guiYuan4', b4d: "Đổi sang một hành khác để ra chiêu, “Liên” mỗi lần +2, chiêu đó sát thương +20%",
    b6: 'guiYuan6', b6d: "Khi “Liên” đầy, chiêu đó sát thương ×3, và lan 60% sát thương sang mọi kẻ địch còn lại" },
  { id: 'yinbing', n: "Âm Binh Mượn Đường", cls: 'necro', rift: true,
    pieces: [['helm', "Âm Binh Nón Lá"], ['chest', "Âm Binh Thọ Y"], ['gloves', "Âm Binh Chỉ Sáo"], ['boots', "Âm Binh Dép Cỏ"], ['ring', "Âm Binh Ban Chỉ"], ['amulet', "Âm Binh Chuông Đồng"]],
    b2: { minion: 1, minionPct: 20 }, b2d: "Thi vị +1, sức mạnh cương thi +20%",
    b4: 'yinBing4', b4d: "Cương thi ngã xuống thì nổ tung, đánh mọi kẻ địch bằng 50% khí huyết tối đa của nó",
    b6: 'yinBing6', b6d: "Sát thương cương thi ×2; mỗi cương thi có mặt, sát thương bạn phải nhận -7%" },
  { id: 'qisha', n: "Thất Sát", cls: 'assassin', rift: true,
    pieces: [['helm', "Thất Sát Diện Tráo"], ['chest', "Thất Sát Dạ Hành Y"], ['gloves', "Thất Sát Chỉ Sáo"], ['boots', "Thất Sát Nhuyễn Ngoa"], ['ring', "Thất Sát Ban Chỉ"], ['amulet', "Thất Sát Ngọc Bội"]],
    b2: { crit: 8, critDmg: 30 }, b2d: "Tỉ lệ chí mạng +8%, sát thương chí mạng +30%",
    b4: 'qiSha4', b4d: "Giới hạn Sát ý +2; dùng xong đòn kết liễu được hoàn 2 điểm Sát ý",
    b6: 'qiSha6', b6d: "Sát thương đòn kết liễu ×4; đòn kết liễu giết được mục tiêu thì hồi chiêu ngay lập tức" },
  { id: 'luohan', n: "La Hán Kim Thân", cls: 'paladin', rift: true,
    pieces: [['helm', "La Hán Tăng Mạo"], ['chest', "La Hán Cà Sa"], ['gloves', "La Hán Hộ Uyển"], ['boots', "La Hán Tăng Hài"], ['ring', "La Hán Ban Chỉ"], ['amulet', "La Hán Niệm Châu"]],
    b2: { armorPct: 30, thornK: 150 }, b2d: "Hộ giáp +30%, bội số phản chấn +150% (phản chấn = công kích của bạn × bội số phản chấn, bị đánh một cái bật lại một cái; yêu vật bị đồng hành làm choáng cũng ăn một lần, yêu vật đánh đồng hành thì bạn bật thay một nửa)",
    b4: 'luoHan4', b4d: "Trong lúc Sư Tử Hống khiêu khích: phản chấn gấp đôi, mỗi lần phản chấn tích hai tầng «Chấn» (Kim Cương Chấn đến nhanh gấp đôi)",
    b6: 'luoHan6', b6d: "Mỗi lần phản chấn chồng một tầng «Phật nộ» (trong trận này, tối đa 10 tầng): mỗi tầng sát thương +30%, sát thương phải chịu -4%; một phần mười sát thương phản chấn hồi lại cho bản thân" },
);
// 第二套幻境套装：RSET2_LV 层起掉。上面那五套是把本门的招牌机制推到头；这五套换一种打法，用的是上面不碰的招式
const RSET2_LV = 30;
SETS.push(
  { id: 'busi', n: "Tu La Bất Tử", cls: 'berserker', rift: true, rlv: RSET2_LV,
    pieces: [['helm', "Bất Tử Chiến Khôi"], ['chest', "Bất Tử Chiến Giáp"], ['gloves', "Bất Tử Hộ Uyển"], ['boots', "Bất Tử Chiến Ngoa"], ['ring', "Bất Tử Ban Chỉ"], ['amulet', "Bất Tử Hộ Tâm Kính"]],
    b2: { leech: 5, hpPct: 12 }, b2d: "Hút máu +5%, khí huyết tối đa +12%",
    b4: 'buSi4', b4d: "Toàn Phong Đao, Liệt Địa Trảm hồi chiêu -1, mỗi kẻ địch trúng đòn hồi 3% khí huyết; chỉ còn một kẻ địch vẫn dùng được Toàn Phong Đao",
    b6: 'buSi6', b6d: "Khí huyết mỗi thiếu 1%, sát thương +3%; sát thương Toàn Phong Đao, Liệt Địa Trảm ×5; mỗi trận một lần: trúng đòn chí tử không ngã, còn 1 điểm khí huyết và vào 3 lượt “Bất Thoái”",
    need: ['liedi', 'whirl'], tip: "Dọn bầy bằng Toàn Phong Đao, Liệt Địa Trảm, phải mang cả hai chiêu" },
  { id: 'wanfu', n: "Vạn Phù Quy Tông", cls: 'mage', rift: true, rlv: RSET2_LV,
    pieces: [['helm', "Vạn Phù Đạo Quan"], ['chest', "Vạn Phù Pháp Y"], ['gloves', "Vạn Phù Hộ Uyển"], ['boots', "Vạn Phù Vân Lý"], ['ring', "Vạn Phù Ban Chỉ"], ['amulet', "Vạn Phù Ngọc Bội"]],
    b2: { elem: 25, hpPct: 8 }, b2d: "Sát thương thuật pháp +25%, khí huyết tối đa +8%",
    b4: 'wanFu4', b4d: "Khi chiêu của bạn gây trạng thái lên một kẻ địch, trạng thái đó lan sang mọi kẻ địch; kẻ địch mỗi có một loại trạng thái thì nhận sát thương từ bạn +20%; chiêu gây trạng thái khi ra tay được bù một lớp bùa hộ thân",
    b6: 'wanFu6', b6d: "Dẫn Bạo Phù không còn xóa trạng thái, phần cộng thêm của mỗi loại trạng thái từ +120% lên +170%, và lan 80% sát thương sang mọi kẻ địch còn lại; Dẫn Bạo Phù hồi chiêu -1",
    need: ['lunzhuan'], tip: "Mang Dẫn Bạo Phù, rồi mang thêm hai ba chiêu treo được trạng thái (Chân Hỏa Phù, Hàn Băng Quyết, Lạc Thạch Quyết)" },
  { id: 'duxing', n: "Ngũ Độc Độc Hành", cls: 'necro', rift: true, rlv: RSET2_LV,
    pieces: [['helm', "Độc Hành Nón Lá"], ['chest', "Độc Hành Cổ Y"], ['gloves', "Độc Hành Chỉ Sáo"], ['boots', "Độc Hành Dép Cỏ"], ['ring', "Độc Hành Ban Chỉ"], ['amulet', "Độc Hành Cổ Đàn"]],
    b2: { poisonPct: 60, hpPct: 15 }, b2d: "Sát thương trúng độc +60%, khí huyết tối đa +15%",
    b4: 'duXing4', b4d: "Thi vị mỗi trống một ô (tính tối đa 4 ô): sát thương của bạn +60%, sát thương phải nhận -13%; Trấn Hồn Đinh kèm trúng độc; không có cương thi vẫn dùng được Bách Quỷ Dạ Hành",
    b6: 'duXing6', b6d: "Trúng độc có thể cộng dồn (tối đa 5 tầng); Thi Độc Lan, Thổ Độn Táng đánh trúng kẻ địch đang trúng độc thì kết toán ngay phần độc còn lại trên nó với mức gấp đôi (độc không mất)",
    need: ['shidu', 'tudun'], tip: "Không gọi cương thi, một mình hạ độc. Mang Thi Độc Lan, Thổ Độn Táng; tháo Rung Chuông Gọi Xác xuống" },
  { id: 'qianji', n: "Thiên Cơ", cls: 'assassin', rift: true, rlv: RSET2_LV,
    pieces: [['helm', "Thiên Cơ Diện Tráo"], ['chest', "Thiên Cơ Dạ Hành Y"], ['gloves', "Thiên Cơ Chỉ Sáo"], ['boots', "Thiên Cơ Nhuyễn Ngoa"], ['ring', "Thiên Cơ Ban Chỉ"], ['amulet', "Thiên Cơ Hạp"]],
    b2: { crit: 6, poisonPct: 50 }, b2d: "Tỉ lệ chí mạng +6%, sát thương trúng độc +50%",
    b4: 'qianJi4', b4d: "Chiêu ám khí (Tiêu Tẩm Độc, Băng Phách Châm, Mạn Thiên Hoa Vũ) hồi chiêu -1; độc của Tiêu Tẩm Độc dính sang mọi kẻ địch; chỉ còn một kẻ địch vẫn dùng được Mạn Thiên Hoa Vũ",
    b6: 'qianJi6', b6d: "Chiêu ám khí đánh trúng kẻ địch đang trúng độc: chắc chắn chí mạng, sát thương ×3; Mạn Thiên Hoa Vũ mỗi kẻ địch trúng đòn, Sát ý +1",
    need: ['venom', 'fan'], tip: "Mang Tiêu Tẩm Độc, Mạn Thiên Hoa Vũ, tốt nhất thêm Băng Phách Châm; giữ một đòn kết liễu để tiêu Sát ý" },
  { id: 'dari', n: "Đại Nhật Như Lai", cls: 'paladin', rift: true, rlv: RSET2_LV,
    pieces: [['helm', "Đại Nhật Tăng Mạo"], ['chest', "Đại Nhật Cà Sa"], ['gloves', "Đại Nhật Hộ Uyển"], ['boots', "Đại Nhật Tăng Hài"], ['ring', "Đại Nhật Ban Chỉ"], ['amulet', "Đại Nhật Niệm Châu"]],
    b2: { healPct: 25, hpPct: 10 }, b2d: "Hiệu quả trị liệu +25%, khí huyết tối đa +10%",
    b4: 'daRi4', b4d: "Mỗi lượt nhận hộ thể chân khí bằng 12% khí huyết tối đa; phần hồi máu dư cũng thành hộ thể (tích tối đa 50% khí huyết tối đa)",
    b6: 'daRi6', b6d: "Khi đang có hộ thể chân khí: sát thương +100%; mỗi lần dùng chiêu có hồi chiêu, bồi thêm một luồng Phật quang, gây 200% sát thương lên mọi kẻ địch",
    tip: "Mang chiêu nào cũng được; càng nhiều chiêu hồi chiêu ngắn, Phật quang càng bồi dày" },
);
STAT_NAMES.furyGain = STAT_NAMES.furyGain || "Nộ ý nhận được";
STAT_NAMES.lianPct = STAT_NAMES.lianPct || "Sát thương mỗi tầng “Liên”";
// 2026-11-24 反击并进反震，反击几率这个属性没有了

// 镇妖录：幻境里收服妖物的精魄。一章一页，层数越高精魄品级越高（一品到十品）
// 一品 1–19 层，二品 20–39，三品 40–59，四品 60–79，五品 80–103；往上每 24 层一品：六品 104，七品 128，八品 152，九品 176，十品 200
const zyGrade = N => N < 80 ? 1 + Math.floor(N / 20) : Math.min(10, 5 + Math.floor((N - 80) / 24));
const ZY_CN = ['', "Nhất phẩm", "Nhị phẩm", "Tam phẩm", "Tứ phẩm", "Ngũ phẩm", "Lục phẩm", "Thất phẩm", "Bát phẩm", "Cửu phẩm", "Thập phẩm"];
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
// 役使：收服一章首领的精魄后，可以带着它的本事上阵；每个角色带 2 只。g = 那只首领精魄的品级（1–10）
const YI_STUN = g => Math.min(60, 16 + g * 6), YI_HOOK = g => Math.min(30, 8 + g * 3);
const YISHI = {
  xianling: { pg: 0, n: "Kinh Đường Mộc", d: g => `Khai trận đập kinh đường mộc: mỗi kẻ địch có ${YI_STUN(g)}% tỉ lệ bị chấn choáng (thủ lĩnh giảm nửa)` },
  langwang: { pg: 1, n: "Bầy Sói", d: g => `Mỗi lần bạn ra đòn, có ${18 + g * 5}% tỉ lệ dẫn bóng sói vồ cắn mục tiêu, gây ${60 + g * 20}% sát thương` },
  zhizhu:   { pg: 2, n: "Triền Ti", d: g => `Khai trận quấn tơ nhện lên mọi kẻ địch: đóng băng (chậm lại) ${2 + Math.ceil(g / 2)} lượt` },
  shimo:    { pg: 3, n: "Dung Tâm", d: g => `Khi bị đánh có ${15 + g * 5}% tỉ lệ dung nham bắn ngược, gây ${80 + g * 30}% sát thương hỏa lên kẻ ra đòn và thiêu đốt` },
  shemu:    { pg: 4, n: "Lột Da", d: g => `Mỗi trận một lần: khí huyết dưới 35% thì lột da, hồi ${14 + g * 5}% khí huyết tối đa, xóa trúng độc, thiêu đốt, đóng băng và choáng trên người` },
  xuanbing: { pg: 5, n: "Phong Trấn", d: g => `Sát thương lên địch đang choáng hoặc đóng băng (chậm lại) +${12 + g * 6}%` },
  guiwang:  { pg: 6, n: "Chợ Ma", d: g => `Phúc duyên +${12 + g * 8}%, thu hoạch bạc +${20 + g * 10}% (để săn đồ)` },
  qingxu:   { pg: 7, n: "Đan Hỏa Hộ Thể", d: g => `Đầu mỗi trận nhận hộ thể bằng ${8 + g * 4}% khí huyết tối đa` },
  niuma:    { pg: 8, n: "Câu Hồn", d: g => `Yêu vật thường dưới ${YI_HOOK(g)}% khí huyết thì bị câu đi luôn (tinh anh và thủ lĩnh không tính)` },
  mozun:    { pg: 9, n: "Ma Khí", d: g => `Sát thương +${8 + g * 4}%, nhưng sát thương phải nhận +8%` },
};
