// ============ 深渊回廊 · 像素图 ============
// 每个图 16×16。只写 8 个字符的行会自动左右镜像。'.' 是透明。
'use strict';
const SPR = (() => {
  const K = '#140d0b';
  const T = {
    // ---------- 立绘（24×24）补全：雷老虎、铁蛋、张大锤、清虚 ----------
    p_lei: { w: 24, pal: { K, H: '#3a2614', S: '#d9a27a', E: '#1a1010', R: '#e8c13a', B: '#2a1a10', C: '#5a2a14', Y: '#c9a45c' }, rows: [
      '............', '......KKKKKK', '....KKHHHHHH', '...KHHHHHHHH', '..KHHHHHHHHH', '..KRRRRRRRRR', '..KRRRRRRRRR', '..KHKSSSSSSS',
      '..KHSKKKKSSS', '..KHSSSSSSSS', '..KHSSKEESSS', '..KHSSSSSSSS', '...KSSSSSSKS', '...KBSSSSSSS', '...KBBSSSSSS', '...KBBBKKKKK',
      '...KBBBBBBBB', '....KBBBBBBB', '.....KBBBBBB', '......KKBBBB', '.....KCCKKKK', '...KKCCYCCCC', '..KCCCCYCCCC', '.KCCCCCYCCCC'] },
    p_tiedan: { w: 24, pal: { K, H: '#2a1a12', S: '#e2b48a', E: '#1a1010', W: '#ffffff', D: '#7a5a4a', C: '#8a4a2a', A: '#4a3a30' }, rows: [
      '............', '.....K...K..', '....KHK.KHKK', '...KHHHKHHHH', '..KHHHHHHHHH', '..KHHHHHHHHH', '..KHHHHHHHHH', '..KHHSHHHHSS',
      '..KHSSSSSSSS', '..KHSSKKSSSS', '..KHSSSSSSSS', '..KSSSKWSSSS', '..KSSSKESSSS', '...KSDSSSSSS', '...KSSSSSSSS', '....KSSSSKKK',
      '....KSSSSSSS', '.....KKSSSSS', '......KKKSSS', '.......KSSSS', '.....KKCCKKK', '...KKCCCCAAA', '..KCCCCCAAAA', '.KCCCCCCAAAA'] },
    p_smith: { w: 24, pal: { K, S: '#c99a72', E: '#1a1010', B: '#3a2a1a', C: '#5a4a3a', W: '#d8d0c0' }, rows: [
      '............', '............', '.......KKKKK', '.....KKSSSSS', '....KSSSSSSS', '...KSSSSSSSS', '...KSSSSSSSS', '..KSSSSSSSSS',
      '..KSSKKKKSSS', '..KSSSSSSSSS', '..KSSSKESSSS', '.KSKSSSSSSSS', '.KSKSSSSSSKS', '..KBSSSSSSSS', '..KBBSSSSSSS', '..KBBBKKKKKK',
      '..KBBBBBBBBB', '...KBBBBBBBB', '....KBBBBBBB', '.....KKBBBBB', '....KWWKKKKK', '..KKCWWWCCCC', '.KCCCCWWCCCC', 'KCCCCCCCCCCC'] },
    p_qingxu: { w: 24, pal: { K, H: '#d8d4c8', S: '#ecc8a8', E: '#1a1a20', Y: '#c9a45c', B: '#e8e4d8', T: '#5a6a8a', W: '#f4f2ec' }, rows: [
      '..........KK', '.........KYY', '........KYYY', '.......KYKYY', '......KHHHHH', '.....KHHHHHH', '....KHHHHHHH', '...KHHHHHHHH',
      '...KHSSSSSSS', '...KHSSSSSSS', '...KHSSKKSSS', '...KHSSSSSSS', '...KHSKKESSS', '...KHSSSSSSS', '...KHSSSSSKS', '...KHWSSSKSS',
      '...KHWWSSSKK', '...KHWWWWWWW', '....KWWWWWWW', '....KWWWWWWW', '.....KWWWWWW', '..KKTKKWWWWW', '.KBBBTBKWWWW', 'KBBBBBTBKWWW'] },
    // ---------- 表情符号（对话立绘旁边冒出来） ----------
    emo_angry: { w: 8, pal: { R: '#ff3a2a', K }, rows: ['.KK..KK.', 'KRRKKRRK', 'KRK..KRK', '.K....K.', '.K....K.', 'KRK..KRK', 'KRRKKRRK', '.KK..KK.'] },
    emo_sweat: { w: 8, pal: { B: '#5ab0ff', W: '#e0f4ff', K }, rows: ['...K....', '..KBK...', '.KBWBK..', '.KWBBK..', 'KBBBBBK.', 'KBBBBBK.', '.KBBBK..', '..KKK...'] },
    emo_note: { w: 8, pal: { Y: '#ffd23a', K }, rows: ['....KKKK', '....KYYK', '....KYKK', '....KYK.', '..KKKYK.', '.KYYYYK.', '.KYYYK..', '..KKK...'] },
    emo_ex: { w: 8, pal: { Y: '#ffd23a', K }, rows: ['..KKKK..', '..KYYK..', '..KYYK..', '..KYYK..', '..KKKK..', '..KKKK..', '..KYYK..', '..KKKK..'] },
    emo_heart: { w: 8, pal: { R: '#ff5a8a', W: '#ffd0e0', K }, rows: ['.KK.KK..', 'KRWKRRK.', 'KRRRRRK.', 'KRRRRRK.', '.KRRRK..', '..KRK...', '...K....', '........'] },
    emo_dots: { w: 8, pal: { W: '#e8dcc8' }, rows: ['........', '........', '........', '........', '........', 'W..W..W.', '........', '........'] },
    // ---------- 角色 ----------
    berserker: { pal: { K, W: '#e9e2d0', M: '#8d8f96', S: '#d9a27a', F: '#7a4a26' }, rows: [
      '........', '..K....K', '..WK..KM', '...WKKMM', '....KMMM', '....KSKS', '....KSSS', '.....KSS',
      '..KKFFFF', '.KMKSFSS', 'KMMKSSFS', '.KMKSKFF', '..K.KFFF', '....KSKK', '....KS.K', '...KKK..'] },
    mage: { pal: { K, B: '#3b52c4', S: '#e2b48a', W: '#ece6da', Y: '#7fe3ff' }, rows: [
      '.......K', '......KB', '.....KBB', '....KBBB', '...KBBBB', '..KKKKKK', '....KSSS', '....KKSS',
      '....KWWW', '...KBWWW', '..KBBKWW', '.KYKBBBB', '..K.KBBB', '....KBBB', '...KBBBB', '...KKKKK'] },
    necro: { pal: { K, D: '#2c2a33', W: '#e3dccb', G: '#5fe07a' }, rows: [
      '........', '.....KKK', '....KDDD', '...KDDDD', '...KDKWW', '...KDWGW', '...KDWWW', '....KDKW',
      '...KDDDD', '..KDWDDD', '..KW.KDD', '..KW.KDD', '....KDDD', '...KDDDD', '...KKKKK', '........'] },
    assassin: { pal: { K, N: '#24202a', R: '#c4291f', M: '#b9bcc6' }, rows: [
      '........', '.....KKK', '....KNNN', '...KNNNN', '...KNNNN', '...KNRRN', '...KRRRR', '....KNNN',
      '...KNNNN', '..KNKNNN', '.KMKKNNN', 'KM..KNNN', '....KNKK', '....KN.K', '...KKK..', '........'] },
    paladin: { pal: { K, M: '#c9a45c', S: '#e2b48a', W: '#ece6da', R: '#b0201a' }, rows: [
      '........', '.....KKK', '....KMMM', '...KMMMM', '...KMKKK', '...KMSSS', '...KMMMM', '..KKKMMM',
      '.KMMKWWW', '.KMMKWWR', '.KM.KWRR', '.KM.KWWR', '....KWWW', '....KMKK', '....KM.K', '...KKK..'] },
    // ---------- 怪物 ----------
    skeleton: { pal: { K, W: '#e8e0c8', R: '#ff3a2a' }, rows: [
      '........', '.....KKK', '....KWWW', '...KWWWW', '...KWRRW', '...KWRRW', '...KWWWK', '....KWWW',
      '.....KWK', '......KW', '...KKWWW', '..KWKWKW', '..K.KWKW', '..W.KWKW', '.....KWW', '....KW.K'] },
    skelking: { pal: { K, W: '#e8e0c8', R: '#ff3a2a', Y: '#f1c94a', P: '#5a1f6e' }, rows: [
      '...Y.Y.Y', '...YYYYY', '...KWWWW', '...KWRRW', '...KWRRW', '...KWWWK', '....KWWW', '.....KWK',
      '..PPPKWW', '.PPKKWWW', '.PKWKWKW', '.PK.KWKW', '.PW.KWKW', '.PP..KWW', '.P..KW.K', '........'] },
    zombie: { pal: { K, G: '#7f9a5a', R: '#ff3a2a', D: '#4a3a30' }, rows: [
      '........', '....KKKK', '...KGGGG', '...KGRGG', '...KGGGG', '...KGKKK', '....KGGG', '..KKDDDD',
      '.KGKDDDD', '.KG.KDDD', '.KG.KDDD', '....KDDD', '....KDKK', '....KD.K', '...KKK..', '........'] },
    imp: { pal: { K, R: '#b8322a', Y: '#ffe04a' }, rows: [
      '........', '........', '..K....K', '..KK..KR', '...KKRRR', '...KRYRR', '...KRRRR', '....KRKK',
      '.....KRR', '...KKRRR', '..KR.KRR', '..K..KRR', '.....KRK', '....KR.K', '....KK..', '........'] },
    bat: { pal: { K, B: '#4a3a52', Y: '#ff3a2a' }, rows: [
      '........', '........', '........', '........', 'K.....KK', 'KK...KBB', 'KBK.KBYB', 'KBBKBBBB',
      'KBBBBBBB', '.KBBBBBB', '..KBKKBB', '...K..KB', '......KK', '........', '........', '........'] },
    golem: { pal: { K, S: '#6a5e58', O: '#ff7a2a' }, rows: [
      '........', '....KKKK', '...KSSSS', '...KSOSS', '...KSSSS', '.KKKKSSS', 'KSSSKSOS', 'KSOSKSSS',
      'KSSSKSSS', 'KSSKKSOS', '.KK.KSSS', '....KSSK', '...KSSK.', '...KSSK.', '...KKKK.', '........'] },
    hound: { pal: { K, D: '#5a5450', Y: '#ff5a1a', W: '#ece6da' }, rows: [
      '........', '........', '.K......', '.KDK....', '.KDDKKKK', '..KDDDDD', '..KDYDDD', '..KDDDDD',
      '...KDDDD', '...KDDDK', '....KDKW', '....KKDD', '...KDDDD', '..KDDKDD', '..KK.KKD', '........'] },
    knight: { pal: { K, M: '#55535c', R: '#ff3a2a', D: '#2a2830' }, rows: [
      '........', '.....KKK', '....KMMM', '...KMMMM', '...KMKKK', '...KMRRR', '...KMMMM', '..KKKMMM',
      '.KMMKMMM', '.KMMKMDM', '.KM.KMMM', '.KM.KMMM', '....KMKK', '....KM.K', '...KKK..', '........'] },
    caster: { pal: { K, P: '#5a1e10', Y: '#ffb02a', O: '#ff7a2a' }, rows: [
      '........', '.....KKK', '....KPPP', '...KPPPP', '...KPKKK', '...KPKYK', '...KPKKK', '....KPPP',
      '...KPPPP', '..KPPKPP', '..KO.KPP', '..KK.KPP', '....KPPP', '...KPPPP', '...KKKKK', '........'] },
    ghost: { pal: { K, C: '#a8c8e0' }, rows: [
      '........', '....KKKK', '...KCCCC', '..KCCCCC', '..KCKKCC', '..KCKKCC', '..KCCCCC', '..KCCKKC',
      '..KCCCCC', '.KCCCCCC', '.KCCCCCC', 'KCCCCCCC', 'KCKCCKCC', 'KK.KK.KC', '........', '........'] },
    demon: { pal: { K, R: '#9a1a14', Y: '#ffdd33', D: '#3a0e0a' }, rows: [
      '........', '.K......', '.KK....K', '.KYK..KR', '..KK.KRR', '....KRRR', '....KRYR', 'K...KRRR',
      'KK..KKRK', 'KDK.KRRR', 'KDDKRRRR', 'KDDKRKRR', '.KDK.KRR', '..K..KRR', '.....KRK', '....KK.K'] },
    spider: { pal: { K, G: '#5a3a6a', R: '#ff3a2a' }, rows: [
      '........', '........', '.K......', '..K...KK', 'K..K.KGG', '.K.KKGRG', '..KKGGGG', 'KK.KGGGG',
      '..KKGGGG', '.K.KKGGG', 'K..K.KGG', '..K...KK', '.K......', '........', '........', '........'] },
    goblin: { pal: { K, Y: '#f1c94a', G: '#7fae4a', R: '#ff3a2a', B: '#6a4a2a' }, rows: [
      '........', '....KKKK', '...KYYYY', '..KYYYYY', '..KYYYYY', '..KYKKKK', '..KYKGGG', '...KKGRG',
      '....KGGG', '....KGKK', '...KBBBB', '..KG.KBB', '..K..KBB', '.....KBK', '....KG.K', '....KK..'] },
    portal: { pal: { K, P: '#7a3aff', C: '#c8a8ff', W: '#ffffff' }, rows: [
      '........', '.....KKK', '....KPPP', '...KPPCC', '..KPPCCC', '..KPCCWW', '.KPPCWWW', '.KPCCWWW',
      '.KPCCWWW', '.KPPCWWW', '..KPCCWW', '..KPPCCC', '...KPPCC', '....KPPP', '.....KKK', '........'] },
    // ---------- 东方：角色 ----------
    blade: { pal: { K, H: '#1a1414', R: '#b8231b', S: '#d9a27a', B: '#2a3a5a', M: '#d0d4dc' }, rows: [
      '........', '....KKKK', '...KHHHH', '..KHHHHH', '..KRRRRR', '..KHSSSS', '...KSKSS', '...KSSSS',
      '....KSSK', '..KKBBBB', '.KSKBBRB', 'KMKSKBBB', 'KMK.KBBB', 'KM..KBKK', 'K...KB.K', '...KKK..'] },
    taoist: { pal: { K, H: '#1a1414', Y: '#e8c13a', S: '#e2b48a', W: '#e2b48a', B: '#2e4a7a' }, rows: [
      '......KK', '.....KYK', '....KHHH', '...KHHHH', '...KSSSS', '...KSKSS', '...KSSSS', '....KWWW',
      '...KBBWB', '..KBBBKB', '.KYKBBBB', '..K.KBBB', '....KBBB', '...KBBBB', '..KBBBBB', '..KKKKKK'] },
    corpseman: { pal: { K, T: '#a8884a', S: '#d9b08a', D: '#1e1c24', Y: '#e8c13a' }, rows: [
      '........', '.......K', '.....KKT', '...KKTTT', '.KKTTTTT', 'KTTTTTTT', '.KKKSSSS', '...KSKSS',
      '...KSSSS', '...KDDDD', '..KDDDDD', '.KYKDDDD', '..K.KDDD', '....KDDD', '...KDDDD', '...KKKKK'] },
    monk: { pal: { K, S: '#d9a27a', O: '#d0782a', B: '#5a2a14' }, rows: [
      '........', '.....KKK', '....KSSS', '...KSSSS', '...KSSSS', '...KSKSS', '...KSSSS', '....KSSS',
      '...KOBOB', '..KOBOOO', '.KSKOBOO', '.KS.KOOO', '....KOOO', '...KOOOO', '...KKKKK', '........'] },
    ngoc: { pal: { K, H: '#1a1012', G: '#3fd18a', S: '#f2c8a8', P: '#e86a8a', R: '#ff8aa0' }, rows: [
      '.....KKK', '....KHHH', '...KHHHH', '..KHHHHG', '..KHHHHH', '..KHSSSS', '..KHSKSS', '..KHSRSS',
      '..KH.KSS', '...KKGGG', '..KPPGGG', '.KSKPPGP', '..K.KPPP', '....KPPP', '...KPPPP', '...KKKKK'] },
    ngocfox: { pal: { K, H: '#e8e4f0', G: '#3fd18a', S: '#f2c8a8', P: '#f4f0ff', R: '#ff8aa0', W: '#ffffff', O: '#ffb066' }, rows: [
      '..K....K', '.KWK..KH', '.KWOKKHH', '..KHHHHG', '..KHHHHH', '..KHSSSS', '..KHSKSS', '..KHSRSS',
      '..KH.KSS', '...KKGGG', 'W.KPPGGG', 'WKSKPPGP', 'WWK.KPPP', '.WWWKPPP', '...KPPPP', '...KKKKK'] },
    smith: { pal: { K, S: '#d9a27a', B: '#7a5a3a', A: '#5a3a22' }, rows: [
      '........', '.....KKK', '....KSSS', '...KSSSS', '...KSKSS', '...KSSSS', '...KBBBB', '...KBBBB',
      '....KBBB', '..KKSAAA', '.KSSKAAA', '.KSSKAAA', '..KK.KAA', '....KAKK', '...KAK.K', '...KK...'] },
    merchant: { pal: { K, R: '#8a1a14', S: '#e2b48a', M: '#2a1a12', Y: '#c9a13a' }, rows: [
      '........', '....KKKK', '...KRRRR', '..KKKKKK', '...KSSSS', '...KSKSS', '...KSSSS', '...KMMSS',
      '....KSSS', '..KKYYYY', '.KYYYYYY', 'KYYYYKYY', 'KYYYYYYY', '.KYYYYYY', '..KKKKKK', '........'] },
    // ---------- 东方：怪物 ----------
    jiangshi: { pal: { K, R: '#b8231b', D: '#1e2a4a', G: '#8aa88a', Y: '#e8c13a', B: '#2a3a5a' }, rows: [
      '.....KKK', '....KRKK', '..KKKKKK', '..KDDDDD', '...KGGYY', '...KGRYY', '...KGGYY', '....KGGG',
      '.KKKBBBB', 'KGGKBBBB', 'KGGKBBBB', '.KK.KBBB', '....KBBB', '....KBKK', '...KBK.K', '...KK...'] },
    fox: { pal: { K, O: '#d0782a', W: '#f4ece0', Y: '#ffdd55' }, rows: [
      '........', '..K....K', '.KOK..KO', '.KOOKKOO', '.KOOOOOO', '..KOWOOO', '..KOYKOO', '..KOOOOO',
      '...KWWWW', '....KWWK', '.....KWW', '...KKOOO', '..KOOOOO', '..KOOKOO', '..KK.KOK', '.......K'] },
    femghost: { pal: { K, H: '#0e0a10', S: '#d8e0e8', R: '#ff3a3a', W: '#e8eef4' }, rows: [
      '....KKKK', '...KHHHH', '..KHHHHH', '..KHHHHH', '..KHHSHH', '..KHHRHH', '..KHHHHH', '..KHWHHH',
      '.KHWWWWW', '.KHWWWWW', '.KWWKWWW', 'KWWWWWWW', 'KWWWWWWW', 'KWKWWKWW', 'KK.KK.KW', '........'] },
    snake: { pal: { K, G: '#4a8a3a', R: '#ff3a2a', Y: '#d8d07a' }, rows: [
      '........', '....KKKK', '...KGGGG', '..KGGRGG', '..KGGGGG', '...KGGKR', '....KKGG', '.....KGG',
      '....KGGG', '...KGGYG', '..KGGYYG', '.KGGGKKK', 'KGGGKGGG', 'KGGGGGGG', '.KGGGGGG', '..KKKKKK'] },
    bull: { pal: { K, W: '#e8e0c8', D: '#4a2a1a', R: '#ff3a2a', T: '#a8806a', Y: '#e8c13a', M: '#3a3a44' }, rows: [
      '........', '.K......', '.KWK....', '..KWK.KK', '...KKKDD', '...KDDDD', '...KDRDD', '...KDDDD',
      '....KTTT', '....KTKT', '.....KYK', '..KKMMMM', '.KDKMMMM', '.KD.KMMM', '....KMKK', '...KKK..'] },
    wisp: { pal: { K, C: '#3ad8a8', W: '#c8fff0' }, rows: [
      '........', '........', '.......C', '......CC', '.....CCC', '....CCWW', '....CWWW', '...CCWKW',
      '...CWWWW', '...CWWWW', '...CCWWW', '....CCWW', '.....CCC', '........', '........', '........'] },
    paper: { pal: { K, W: '#f0ece0', R: '#d0302a' }, rows: [
      '........', '.....KKK', '....KWWW', '...KWWWW', '...KWKWW', '...KWRWW', '...KWWWK', '....KWWW',
      '..KKWWWW', '.KWKWRWW', '.KW.KWWW', '....KWWW', '....KWKK', '....KW.K', '....KK..', '........'] },
    crow: { pal: { K, R: '#c4291f', Y: '#ffdd55', O: '#ff9a2a' }, rows: [
      '........', '........', '........', 'K.......', 'KK......', 'KRK....K', 'KRRK..KR', '.KRRKKRR',
      '.KRRRKRY', '..KRRRRR', '...KRRRO', '....KKRR', '......KR', '.....K.K', '........', '........'] },
    toad: { pal: { K, Y: '#e8c13a', R: '#c4291f', C: '#fff2a0' }, rows: [
      '........', '........', '........', '..KK..KK', '.KYYK.KY', '.KYRYKKY', '.KYYYYYY', 'KYYYYYYY',
      'KYYYKKKK', 'KYYKCCCC', 'KYYYKCCC', '.KYYYKKK', 'KYKYYYYY', 'KKKKKKKK', '........', '........'] },
    // ---------- 东方：房间图标 ----------
    fu: { pal: { K, Y: '#e8c13a', R: '#c4291f' }, rows: [
      '................', '.....KKKKKK.....', '.....KYYYYK.....', '.....KYRRYK.....', '.....KYYRYK.....', '.....KYRRYK.....',
      '.....KYYYYK.....', '.....KYRYYK.....', '.....KYRRYK.....', '.....KYYRYK.....', '.....KYRRYK.....', '.....KYYYYK.....',
      '.....KKKKKK.....', '................', '................', '................'] },
    ingot: { pal: { K, Y: '#f1c94a', W: '#fff2b0' }, rows: [
      '........', '........', '........', '........', '........', 'K.......', 'KYK.....', 'KYYK..KK',
      '.KYYKKYY', '.KYYYYYW', '..KYYYYY', '...KYYYY', '....KKKK', '........', '........', '........'] },
    scroll: { pal: { K, B: '#7a4a22', P: '#e8dcc0' }, rows: [
      '................', '..KKKKKKKKKKKK..', '.KBKPPPPPPPPKBK.', '.KBKPKKKKKKPKBK.', '.KBKPPPPPPPPKBK.', '.KBKPKKKKKPPKBK.',
      '.KBKPPPPPPPPKBK.', '.KBKPKKKKKKPKBK.', '.KBKPPPPPPPPKBK.', '..KKKKKKKKKKKK..', '................', '................',
      '................', '................', '................', '................'] },
    // ---------- 地貌装饰 ----------
    tomb: { pal: { K, G: '#5a5650', H: '#77736a', D: '#2e241a' }, rows: [
      '........', '........', '........', '.....KKK', '....KHHH', '....KGHG', '....KGKK', '....KGGK',
      '....KGKK', '....KGGG', '....KGGG', '....KGGG', '...KKKKK', '..KDDDDD', '..KKKKKK', '........'] },
    mound: { pal: { K, D: '#3a2c1e', H: '#4a3a28', W: '#b8b0a0' }, rows: [
      '........', '........', '........', '........', '........', '.......W', '.......W', '......WW',
      '.....KKK', '...KKHHH', '..KDDDDD', '.KDDDDDD', 'KDDDDDDD', 'KKKKKKKK', '........', '........'] },
    deadtree: { pal: { K, B: '#3a2a20' }, rows: [
      '................', '..B.......B.....', '...B..B..B..B...', '....B.B.B..B....', '.....BBB.BB.....', '......BBBB......',
      '.......BB.......', '.......BB.......', '......BBB.......', '.......BB.......', '.......BB.......', '......BBBB......',
      '.....BBBBBB.....', '....KKKKKKKK....', '................', '................'] },
    pine: { pal: { K, G: '#1e3a24', H: '#2e5a34', B: '#3a2a1a' }, rows: [
      '.......K', '......KH', '......KG', '.....KHG', '....KGGG', '.....KHG', '....KHGG', '...KGGGG',
      '....KHGG', '...KHGGG', '..KGGGGG', '.KKKKKKK', '.......B', '.......B', '......KK', '........'] },
    cobweb: { pal: { W: '#b8b8c0' }, rows: [
      'WWWWWWWWWWWW....', 'W.W...W...W.....', 'W..W..W..W......', 'W...WWWWW.......', 'WWWW.W.W........', 'W..WW..W........',
      'W..W.WW.........', 'W.W..W..........', 'WW..W...........', 'W..W............', 'W.W.............', 'WW..............',
      'W...............', '................', '................', '................'] },
    rock: { pal: { K, G: '#4a4440', H: '#6a6460' }, rows: [
      '........', '........', '........', '........', '........', '........', '.....KKK', '....KHHG',
      '...KGHHG', '..KGGGGG', '..KGGGGG', '.KGGGGGG', '.KGGGGGG', 'KKKKKKKK', '........', '........'] },
    crack: { pal: { O: '#ff5a1a', Y: '#ffc04a' }, rows: [
      '................', '................', '..O.............', '...OO...........', '.....O..O.......', '......OYYO......',
      '......O...O.....', '...........OO...', '.............O..', '..........O.....', '.........O......', '................',
      '................', '................', '................', '................'] },
    crystal: { pal: { K, C: '#6ab0d8', W: '#e0f4ff' }, rows: [
      '........', '.......K', '......KC', '......KW', '.....KCW', '..K..KCW', '.KCK.KCC', '.KWCKKCC',
      '.KCCKCCC', '..KCKCCC', '..KCCCCC', '...KCCCC', '...KKKKK', '........', '........', '........'] },
    lantern: { pal: { K, R: '#c4291f', Y: '#ffcc55', B: '#3a2a1a' }, rows: [
      '.......B', '.......B', '......KK', '.....KRR', '....KRYR', '....KRYY', '....KRYY', '....KRYR',
      '.....KRR', '......KK', '.......Y', '.......Y', '.......B', '.......B', '.......B', '......BB'] },
    // ---------- 青石镇新人物 ----------
    oldman: { pal: { K, B: '#1a1a22', S: '#e2b48a', W: '#ecebe4', G: '#6a6a72' }, rows: [
      '........', '........', '.KK.KKKK', '.KBKBBBB', '..K.KBBB', '....KSSS', '....KSKS', '....KWWW',
      '.....KWW', '....KGGW', '...KGGGG', '..KSKGGG', '....KGGG', '....KGGG', '....KKGK', '....KK.K'] },
    constable: { pal: { K, H: '#1a1418', R: '#c4291f', S: '#efc39a', D: '#2a2a3a', M: '#b9bcc6' }, rows: [
      '........', '.....KKK', '....KHHH', '...KHHHH', '...KRRRR', '...KHSSS', '...KSKSS', '....KSSS',
      '...KRDDD', '..KDRDDD', '.KSKDRDD', '.KM.KDDD', '.KM.KDDD', '....KDKK', '....KD.K', '...KKK..'] },
    scholar: { pal: { K, B: '#3a5a9a', S: '#e2b48a', H: '#2a2a2a', W: '#e8e4dc', Y: '#c9a45c' }, rows: [
      '........', '....KKKK', '....KBBB', '...KBBBB', '...KHHHH', '...KHSSS', '....KSKS', '....KSSS',
      '.....KHH', '...KBBBW', '..KBBBBW', '.KYYKBBB', '.KYYKBBB', '....KBBB', '...KBBBB', '...KKKKK'] },
    herb: { pal: { K, G: '#3a8a5a', L: '#7fe0a0', W: '#e0fff0' }, rows: [
      '........', '........', '........', '........', '.......W', '......WL', '...L..KL', '..LGL.KG',
      '...LGKGG', '....KGGL', '..LGGKGG', '...LGGKG', '....KKGG', '.....KKK', '........', '........'] },
    // ---------- 房间图标 ----------
    chest: { pal: { K, Y: '#e8c13a', B: '#7a4a22' }, rows: [
      '........', '........', '........', '...KKKKK', '..KYBBBB', '..KYBBBB', '..KYYYYY', '..KBBBBK',
      '..KBBBBK', '..KBBBBB', '..KYBBBB', '..KYYYYY', '...KKKKK', '........', '........', '........'] },
    fire: { pal: { K, O: '#ff6a1a', Y: '#ffd23a', W: '#fff6c8', B: '#5a3a22' }, rows: [
      '........', '........', '.......O', '......OY', '......OY', '.....OYY', '....OOYW', '....OYYW',
      '...OOYWW', '...OYYYW', '....OYYY', '..BBKOOO', '.BBBBKKK', '..BBBBBB', '........', '........'] },
    bag: { pal: { K, B: '#8a6a3a', Y: '#f1c94a' }, rows: [
      '........', '........', '......KK', '.....KBK', '......KY', '....KKBB', '...KBBBB', '..KBBBBB',
      '..KBBYYY', '..KBBYBB', '..KBBYYY', '..KBBBBY', '..KBBYYY', '...KBBBB', '....KKKK', '........'] },
    gold: { pal: { K, Y: '#f1c94a', W: '#fff2b0' }, rows: [
      '........', '........', '........', '........', '........', '........', '........', '......KK',
      '.....KYY', '....KYYW', '...KYYYY', '..KYYWYY', '..KYYYYY', '.KKKKKKK', '........', '........'] },
    rune: { pal: { P: '#b28cff', K }, rows: [
      '................', '................', '......PPPP......', '.....PPKKPP.....', '.....PP..PP.....', '.........PP.....',
      '........PP......', '.......PP.......', '.......PP.......', '................', '.......PP.......', '.......PP.......',
      '................', '................', '................', '................'] },
    key: { pal: { K, Y: '#f1c94a' }, rows: [
      '................', '................', '................', '................', '..KKKK..........', '.KYYYYK.........',
      '.KY..YKKKKKKKK..', '.KY..YYYYYYYYYK.', '.KYYYYKKKYKYKK..', '..KKKK...K.K....', '................', '................',
      '................', '................', '................', '................'] },
    stairs: { pal: { K, S: '#6a5e58', D: '#2a201c' }, rows: [
      '................', '................', '..KKKKKKKKKKKK..', '..KDDDDDDDDDDK..', '..KSSSSSSSSSSK..', '..KDDDDDDDDDDK..',
      '..KKSSSSSSSSKK..', '...KDDDDDDDDK...', '...KKSSSSSSKK...', '....KDDDDDDK....', '....KKSSSSKK....', '.....KDDDDK.....',
      '.....KKKKKK.....', '................', '................', '................'] },
    lock: { pal: { K, M: '#c9a45c', D: '#5a4020' }, rows: [
      '........', '........', '.....KKK', '....KMMM', '....KM.K', '....KM..', '...KKKKK', '...KMMMM',
      '...KMMMD', '...KMMKD', '...KMMMK', '...KMMMM', '...KKKKK', '........', '........', '........'] },
    // ---------- 装备图标（M = 品质色） ----------
    i_weapon: { pal: { K, M: '#c8c8d0', Y: '#c9a45c', B: '#5a3a22' }, rows: [
      '..............KK', '.............KMK', '............KMMK', '...........KMMK.', '..........KMMK..', '.........KMMK...',
      '........KMMK....', '...KK..KMMK.....', '...KYKKMMK......', '....KYMMK.......', '.....KYK........', '....KYKYK.......',
      '...KBK.KYK......', '..KBK...KK......', '..KK............', '................'] },
    i_helm: { pal: { K, M: '#c8c8d0' }, rows: [
      '........', '........', '........', '........', '.......K', '.....KKM', '...KKMMM', '.KKMMMMM',
      'KMMMMMMM', 'KKKKKKKK', '...KMMMM', '...KMMMM', '....KKKK', '........', '........', '........'] },
    i_chest: { pal: { K, M: '#c8c8d0' }, rows: [
      '........', '........', '...KKK..', '..KMMMKK', '.KMMMMMM', '.KMMKMMM', '.KMKKMMM', '..KKKMMM',
      '....KMMM', '....KMMM', '....KMMM', '....KMMM', '....KMMM', '....KKKK', '........', '........'] },
    i_gloves: { pal: { K, M: '#c8c8d0', Y: '#c9a45c' }, rows: [
      '........', '........', '........', '..K.K...', '.KMKMK..', '.KMKMKK.', '.KMMMMK.', '.KMMMMK.',
      '..KMMMK.', '..KMMK..', '..KYYK..', '..KKKK..', '........', '........', '........', '........'] },
    i_boots: { pal: { K, M: '#c8c8d0' }, rows: [
      '........', '........', '........', '..KKKK..', '..KMMK..', '..KMMK..', '..KMMK..', '..KMMK..',
      '.KMMMK..', 'KMMMMK..', 'KMMMMK..', 'KKKKKK..', '........', '........', '........', '........'] },
    i_ring: { pal: { K, M: '#c8c8d0', W: '#ffffff' }, rows: [
      '........', '........', '........', '........', '....KKKK', '...KMMMM', '...KMWMM', '...KMMMM',
      '...KMMMM', '...KMMMM', '...KKKKK', '........', '........', '........', '........', '........'] },
    i_amulet: { pal: { K, M: '#c8c8d0', R: '#c4291f' }, rows: [
      '........', '.......K', '......KR', '.......K', '.....KKK', '....KMMM', '...KMMKK', '...KMK..',
      '...KMK..', '...KMMKK', '....KMMM', '.....KKK', '......KR', '......KR', '.......R', '........'] },
    gem: { pal: { K, G: '#e04040', W: '#ffffff' }, rows: [
      '........', '........', '........', '........', '....KKKK', '...KGWGG', '..KGWGGG', '..KGGGGG',
      '...KGGGG', '....KGGG', '.....KGG', '......KG', '.......K', '........', '........', '........'] },
    // ---------- 第一章新妖物 ----------
    villager: { pal: { K, H: '#2a1a14', W: '#e8e0d0', S: '#e2b48a', B: '#7a5a3a', D: '#3a2a20' }, rows: [
      '........', '........', '.....KKK', '....KHHH', '....KWWW', '....KSSS', '....KSKS', '.....KSS',
      '....KBBB', '...KBBBB', '..KSKBBB', '..K.KBBB', '....KBBB', '....KDKK', '....KD.K', '...KKK..'] },
    yayi: { pal: { K, N: '#1c1c26', R: '#c4291f', G: '#9ac8a8', W: '#e8e0c8' }, rows: [
      '.......R', '.....KRR', '....KNNN', '...KNNNN', '..KNNNNN', '....KGGG', '....KGKG', '.....KGG',
      '....KNNN', '...KNRRR', '..KGKNNW', '..K.KNNN', '....KNNN', '....KNKK', '....KN.K', '...KKK..'] },
    yong: { pal: { K, T: '#9a6a44', D: '#6a4a30', L: '#c08a5a' }, rows: [
      '.......K', '......KT', '.....KTT', '....KTTT', '....KLLL', '....KLKL', '.....KLL', '...KKDDD',
      '..KTKDTD', '..KT.DDD', '..KL.DTD', '....KDDD', '....KTTT', '....KTKK', '....KT.K', '...KKKK.'] },
    headless: { pal: { K, W: '#c8d8e0', B: '#3a4a6a', R: '#ff3a2a', S: '#b8c8b0' }, rows: [
      '................', '.......KK.......', '......KRRK......', '....KKBBBBKK....', '...KBBBBBBBBK...', '..KBBBKBBKBBBK..',
      '..KBBK.BB.KBBK..', '..KSK.KBBK..KSK.', '..KSK.KBBK.KKKKK', '...K..KBBK.KWWWK', '......KBBK.KWKWK', '.....KBBBBKKWWWK',
      '.....KBBBBK.KRK.', '....KBBKKBBK.K..', '....KBK..KBK....', '....KKK..KKK....'] },
    xianling: { pal: { K, N: '#14141c', R: '#9a1a1a', Y: '#e8c13a', G: '#9ab89a', W: '#f0e0a0', D: '#5a0a0a' }, rows: [
      '................', '.....KKKKKK.....', '....KNNNNNNK....', 'KKKKKNNNNNNKKKKK', 'KNNNKNNYYNNKNNNK', 'KKKKKNNNNNNKKKKK',
      '.....KGGGGK.....', '.....KWWWWK.....', '.....KGKKGK.....', '......KGGK......', '...KKKRRRRKKK...', '..KRRRYYYYRRRK..',
      '.KRKRRYDDYRRKRK.', '.KGKRRYYYYRRKGK.', '...KRRRRRRRRK...', '...KKKK..KKKK...'] },
    // ---------- 对话立绘 24×24 ----------
    p_ngoc: { w: 24, pal: { K, H: '#2a1a22', S: '#f2c8a8', E: '#3a2030', W: '#ffffff', M: '#c85060', P: '#e86a8a', R: '#d83040', B: '#f0a0a0', L: '#fff0f0' }, rows: [
      '............', '......KKKKKK', '....KKHHHHHH', '...KHHHHHHHH', '..KHHHHHHHHH', '..KHHHRRHHHH', '.KHHHRRHHHHH', '.KHHHHHHHHHH',
      '.KHHHHKKHHHH', '.KHHHKSSKHHH', '.KHHKSSSSKHH', '.KHHKSSSSSKS', '.KHHKSKKSSSS', '.KHHKSEWESSS', '.KHHKSEEESSS', '.KHHKSSSSSSS',
      '.KHHKSBBSSSS', '.KHHHKSSSSSM', '.KHHHHKSSSSS', '.KHHHHHKKSSS', '.KHHHHKPPKSS', '..KHHKPPPPKL', '.KPPPPPPPPPL', 'KPPPPPPPPPPL'] },
    p_zhen: { w: 24, pal: { K, H: '#16121a', S: '#eec0a0', E: '#2a1a14', W: '#ffffff', N: '#24304a', R: '#c4291f' }, rows: [
      '............', '.........KKK', '........KHHH', '........KHHH', '......KKKKKK', '....KKHHHHHH', '...KHHHHHHHH', '..KHHHHHHHHH',
      '..KRRRRRRRRR', '..KHHHHHHHHH', '..KHHKSSSSSS', '..KHKSSSSSSS', '..KHKSKKKSSS', '..KHKSSEWESS', '..KHKSSEEESS', '..KHKSSSSSSS',
      '...KKSSSSSSS', '....KSSSSSKK', '....KKSSSSSS', '.....KKKSSSS', '......KNNKKK', '....KKNNNRNN', '..KKNNNNNRNN', '.KNNNNNNNRNN'] },
    p_liu: { w: 24, pal: { K, C: '#2a2a3a', Y: '#c8302a', S: '#e0b890', W: '#ece8e0', G: '#6a6a72' }, rows: [
      '............', '..........KK', '.........KYY', '.......KKKCC', '.....KKCCCCC', '....KCCCCCCC', '....KKKKKKKK', '....KSSSSSSS',
      '...KSSSSSSSS', '..KSSWWWSSSS', '..KSSSSSSSSS', '..KSKKKSSSSS', '..KSSSSSSSSS', '...KSSSSSKSS', '...KSSSSSSSS', '...KSSWWWWWW',
      '....KSWWKKWW', '....KSWWWWWW', '.....KKWWWWW', '......KKWWWW', '.....KGKKWWW', '...KKGGGKKWW', '..KGGGGGGGKK', '.KGGGGGGGGGG'] },
    p_kang: { w: 24, pal: { K, N: '#1a1a1a', Y: '#e8c13a', S: '#f0c090', R: '#a02a1a', M: '#7a1a1a', T: '#ffffff', B: '#e89070' }, rows: [
      '............', '.......KKKKK', '.....KKNNNNN', '....KNNNNNYY', '....KNNNNNYY', '...KKKKKKKKK', '..KSSSSSSSSS', '.KSSSSSSSSSS',
      'KSSSKKKSSSSS', 'KSSSSSSSSSSS', 'KSSSKKSSSSSS', 'KSSSSSSSSSSS', 'KSBBBSSSSSSS', 'KSBBBSSSKKKK', 'KSSSSSKKKKKK', 'KSSSSKMMMMMM',
      'KSSSSKMTTTTT', '.KSSSSKMMMMM', '.KSSSSSKKKKK', '..KSSSSSSSSS', '...KKSSSSSSS', '..KRRKKKKKKK', '.KRRRRRYRRRR', 'KRRRRRRYRRRR'] },
    p_long: { w: 24, pal: { K, C: '#2a3a5a', H: '#1a1a20', S: '#ecc8a8', E: '#1a1a20', B: '#8ab0d0', W: '#f0f0e8' }, rows: [
      '............', '........KKKK', '.......KCCCC', '......KCCCCC', '.....KCCCCCC', '....KCCCCCCC', '....KKKKKKKK', '..CKHHHHHHHH',
      '..CKHHSSSSSS', '..CKHSSSSSSS', '..CKHSKKKSSS', '..CKHSSSSSSS', '...KHSKEESSS', '...KHSSSSSSS', '...KHSSSSSKS', '....KSSSSSSS',
      '....KSSSSKKK', '....KSSSSSSS', '.....KSSSSSS', '......KKSSSS', '.....KWWKKKK', '...KKBBWWWBB', '..KBBBBBWWBB', '.KBBBBBBBWBB'] },
    shard: { pal: { K, P: '#9a7aff', W: '#e8e0ff' }, rows: [
      '........', '........', '.......K', '......KP', '.....KPW', '.....KPP', '....KPPP', '....KPWP',
      '...KPPPP', '...KPPPP', '....KPPP', '.....KPP', '......KP', '.......K', '........', '........'] },
    // ---------- 场景里的实物 ----------
    cocoon: { pal: { K, W: '#e8e4ec', G: '#b8b0c4' }, rows: [
      '.......K', '.......W', '......KW', '.....KWW', '....KWWG', '....KWGW', '...KWWWG', '...KWGWW', '...KWWWG', '...KWGWW', '...KWWWG', '....KWWW', '....KWGW', '.....KWW', '......KW', '.......K'] },
    mirror: { pal: { K, Y: '#c9a45c', L: '#d8d4c8', W: '#ffffff' }, rows: [
      '.....KKK', '....KYYY', '...KYLLL', '..KYLLLL', '..KYLWLL', '..KYLLLL', '..KYLLLL', '...KYLLL', '....KYYY', '.....KKK', '.......K', '.......Y', '......KY', '.....KYY', '....KYYY', '....KKKK'] },
    silverbox: { pal: { K, W: '#e8e8f0', B: '#6a3a1a', D: '#8a5a2a', Y: '#e8c13a' }, rows: [
      '........', '........', '...KKKKK', '..KWWKWW', '..KBBBBB', '.KBDDDDD', '.KBDYYDD', '.KBDDDDD', '.KBBBBBB', '.KBDDDDD', '.KBDDDDK', '.KBDDDDY', '.KBDDDDD', '.KBBBBBB', '.KKKKKKK', '........'] },
    furnace: { pal: { K, S: '#5a4a44', R: '#c4291f', O: '#ff8a2a', Y: '#ffd75a' }, rows: [
      '....KKKK', '...KSSSS', '...KSKSS', '..KSSSSS', '..KSSSSS', '.KSSSSSS', '.KSSKKKK', '.KSKRRRR', '.KSKROOY', '.KSKROYY', '.KSKRRRR', '.KSSKKKK', 'KSSSSSSS', 'KSSSSSSS', 'KKKKKKKK', '........'] },
    minecart: { pal: { K, M: '#6a6a72', G: '#5a4a3a', R: '#ff6a2a', D: '#3a3a40' }, rows: [
      '........', '........', '........', '........', '........', 'KKKKKKKK', 'KMMMMMMM', 'KMRGGRGG', 'KMGRGGRG', 'KMMMMMMM', '.KMMMMMM', '.KMMMMMM', '..KKKKKK', '.KDDK...', '.KDDK...', '..KK....'] },
    anvil: { pal: { K, M: '#7a7a86', H: '#a8a8b4' }, rows: [
      '........', '........', '........', '........', '........', 'KKKKKKKK', 'KHHHHHHH', '.KMMMMMM', '..KKMMMM', '....KMMM', '....KMMM', '...KMMMM', '..KMMMMM', '..KKKKKK', '........', '........'] },
    jar: { pal: { K, B: '#6a3a1a', R: '#c4291f', W: '#e8dcc0' }, rows: [
      '........', '.....KKK', '....KRRR', '....KKKK', '...KBBBB', '..KBBBBB', '.KBBBWWW', '.KBBWRRW', '.KBBWRRW', '.KBBBWWW', '.KBBBBBB', '..KBBBBB', '...KBBBB', '....KKKK', '........', '........'] },
    cauldron: { pal: { K, M: '#4a4038', G: '#8fe07a', S: '#c8c8c0' }, rows: [
      '......S.', '.....S..', '......S.', '........', '..KKKKKK', '.KMMMMMM', 'KMGGGGGG', 'KMMMMMMM', 'KMMMMMMM', '.KMMMMMM', '.KMMMMMM', '..KMMMMM', '...KKKKK', '..KM....', '..KM....', '........'] },
    tent: { pal: { K, W: '#d8d0c0', R: '#a02a1a' }, rows: [
      '.......K', '......KR', '.....KWW', '....KWWW', '...KWWWW', '..KWWWWW', '.KWWWWWW', 'KRRRRRKK', 'KWWWWK..', 'KWWWK...', 'KWWK....', 'KWWK....', 'KWWK....', 'KKKK....', '........', '........'] },
    boat: { pal: { K, B: '#6a4a2a', D: '#4a3018' }, rows: [
      '........', '........', '........', '........', '........', '........', '........', '.......K', '.......K', 'KKKKKKKK', 'KBBBBBBB', '.KBBBBBB', '..KDDDDD', '...KKKKK', '........', '........'] },
    bones: { w: 16, pal: { K, W: '#e8e0c8' }, rows: [
      '................', '................', '................', '................', '................', '................', '................', '................',
      '.....WWW........', '....WKWKW.......', '....WWWWW...W..W', '.....W.W....WWWW', '..W.......WWWW..', '..WWWWWWWW..W...', '...W....W.......', '................'] },
    chain: { pal: { K, M: '#7a7a86' }, rows: [
      '.......K', '......KM', '.......K', '......KM', '.......K', '......KM', '.......K', '......KM', '.......K', '......KM', '.......K', '......KM', '.....KMM', '....KMKK', '.....K..', '........'] },
    bell: { pal: { K, Y: '#c9a45c', O: '#7a5a2a' }, rows: [
      '.......K', '......KY', '.....KKK', '....KYYY', '...KYYYY', '...KYYYY', '...KYYYY', '..KYYYYY', '..KYYYYY', '..KYOYOY', '.KYYYYYY', '.KKKKKKK', '......KY', '.......K', '........', '........'] },
    iceblock: { pal: { K: '#2a4a6a', B: '#8fd0f0', L: '#c8ecff', W: '#ffffff' }, rows: [
      '........', '..KKKKKK', '.KLLLLLL', '.KLWWLLL', '.KLWLLLB', '.KLLLLBB', '.KLLLBBB', '.KLLBBBB', '.KLBBBBB', '.KLBBBBB', '.KLBBBBB', '.KBBBBBB', '.KBBBBBB', '.KBBBBBB', '..KKKKKK', '........'] },
    // ---------- 动作图：起手 rd、出招 st、施法 cs、挨打 ht（art/poses.py 生成） ----------
    blade_rd: { pal: { K, H: '#1a1414', R: '#b8231b', S: '#d9a27a', B: '#2a3a5a', M: '#d0d4dc' }, rows: ['................', '...KKKKKKKK.....', '..KHHHHHHHHK....', '.KHHHHHHHHHHK...', '.KRRRRRRRRRRKKK.', '.KHSSSSSSSSHKSSK', '..KSKSSSSKSKKSSK', '..KSSSSSSSSKKSSK', '...KSSKKSSKKKSSK', '..KKBBBBBBBBKSSK', '..KSBBRBBRBBSKK.', '.KSSKBBBBBBKSK..', 'KSSKKBBBBBBKK...', 'SKKKBKKKKKKBK...', 'K..KBKK..KKBK...', '..KKK......KKK..'] },
    blade_st: { pal: { K, H: '#1a1414', R: '#b8231b', S: '#d9a27a', B: '#2a3a5a', M: '#d0d4dc' }, rows: ['................', '.....KKKKKKKK...', '....KHHHHHHHHK..', '...KHHHHHHHHHHK.', '...KRRRRRRRRRRK.', '...KHSSSSSSSSHK.', '....KSKSSSSKSK..', '....KSSSSSSSSK..', 'KKK.KKSSKKSSK...', 'SSSKBBBBBBBBKKKK', 'SSSSBBRBBRBBSSSS', 'KKKSKBBBBBBKSSSS', '...KKBBBBBBKKKKK', '...KBKKKKKKKBK..', '...KBKK...KKBK..', '..KKK.......KKK.'] },
    blade_cs: { pal: { K, H: '#1a1414', R: '#b8231b', S: '#d9a27a', B: '#2a3a5a', M: '#d0d4dc' }, rows: ['................', '....KKKKKKKK....', '...KHHHHHHHHK...', '..KHHHHHHHHHHK..', '..KRRRRRRRRRRK..', '.KKHSSSSSSSSHKK.', 'KSSKSKSSSSKSKSSK', 'KSSKSSSSSSSSKSSK', 'KSSKKSSKKSSKKSSK', 'KSSKBBBBBBBBKSSK', '.KKSBBRBBRBBSKK.', '..KSKBBBBBBKSK..', '...KKBBBBBBKK...', '....KBKKKKBK....', '....KBKKKKBK....', '...KKK....KKK...'] },
    blade_ht: { pal: { K, H: '#1a1414', R: '#b8231b', S: '#d9a27a', B: '#2a3a5a', M: '#d0d4dc' }, rows: ['................', '...KKKKKKKK.....', '..KHHHHHHHHK....', '.KHHHHHHHHHHK...', '.KRRRRRRRRRRK...', '.KHSSSSSSSSHK...', '..KSKKSSKKSK....', 'K.KSSSSSSSSK...K', 'SKKKSSKKSSKK.KKS', 'SSSKBBBBBBBBKSSS', 'KSSSBBRBBRBBSSSK', '.KKSKBBBBBBKSKK.', '...KKBBBBBBKK...', '...KBKKKKKKBK...', '...KBKK..KKBK...', '..KKK......KKK..'] },
    assassin_rd: { pal: { K, N: '#24202a', R: '#c4291f', M: '#b9bcc6', L: '#4a4458' }, rows: ['................', '....KKKKKK......', '...KNNNNNNK.....', '..KNNNNNNNNK.KK.', '..KNNNNNNNNKKNNK', '..KNRRNNRRNKKLLK', '..KRRRRRRRRKKLLK', '...KNNNNNNK.KLLK', '..KNNNNNNNNKKLLK', '..KLKNNNNNNKLKK.', '.KLLKNNNNNNKLK..', 'KNLKKNNNNNNKK...', 'NKKKNKKKKKKNK...', 'K..KNKK..KKNK...', '..KKK......KKK..', '................'] },
    assassin_st: { pal: { K, N: '#24202a', R: '#c4291f', M: '#b9bcc6', L: '#4a4458' }, rows: ['................', '......KKKKKK....', '.....KNNNNNNK...', '....KNNNNNNNNK..', '....KNNNNNNNNK..', '....KNRRNNRRNK..', '....KRRRRRRRRK..', 'KKK..KNNNNNNK...', 'NLLKKNNNNNNNNKKK', 'NLLLKNNNNNNKLLLN', 'KKKLKNNNNNNKLLLN', '...KKNNNNNNKKKKK', '...KNKKKKKKKNK..', '...KNKK...KKNK..', '..KKK.......KKK.', '................'] },
    assassin_cs: { pal: { K, N: '#24202a', R: '#c4291f', M: '#b9bcc6', L: '#4a4458' }, rows: ['................', '.....KKKKKK.....', '....KNNNNNNK....', '...KNNNNNNNNK...', '.KKKNNNNNNNNKKK.', 'KNNKNRRNNRRNKNNK', 'KLLKRRRRRRRRKLLK', 'KLLKKNNNNNNKKLLK', 'KLLKNNNNNNNNKLLK', '.KKLKNNNNNNKLKK.', '..KLKNNNNNNKLK..', '...KKNNNNNNKK...', '....KNKKKKNK....', '....KNKKKKNK....', '...KKK....KKK...', '................'] },
    assassin_ht: { pal: { K, N: '#24202a', R: '#c4291f', M: '#b9bcc6', L: '#4a4458' }, rows: ['................', '....KKKKKK......', '...KNNNNNNK.....', '..KNNNNNNNNK....', '..KNNNNNNNNK....', '..KNRRNNRRNK....', 'K.KRRRRRRRRK...K', 'NKKKNNNNNNK..KKN', 'NLLNNNNNNNNKKLLN', 'KLLLKNNNNNNKLLLK', '.KKLKNNNNNNKLKK.', '...KKNNNNNNKK...', '...KNKKKKKKNK...', '...KNKK..KKNK...', '..KKK......KKK..', '................'] },
    monk_rd: { pal: { K, S: '#d9a27a', O: '#d0782a', B: '#5a2a14' }, rows: ['................', '....KKKKKK......', '...KSSSSSSK.....', '..KSSSSSSSSK....', '..KSSSSSSSSK..KK', '..KSKSSSSKSK.KSS', '..KSSSSSSSSK.KSS', '...KSSSSSSKK.KSS', '...KOBOBBOBOKKSS', '..KOBOOOOOOBOKSS', '.KSKOBOOOOBOKSKK', 'KSSKKOOOOOOKKSK.', 'SSK.KOOOOOOK.K..', 'SK.KOOOOOOOOK...', 'K..KKKKKKKKKK...', '................'] },
    monk_st: { pal: { K, S: '#d9a27a', O: '#d0782a', B: '#5a2a14' }, rows: ['................', '......KKKKKK....', '.....KSSSSSSK...', '....KSSSSSSSSK..', '....KSSSSSSSSK..', '....KSKSSSSKSK..', '....KSSSSSSSSK..', '....KKSSSSSSK...', 'KK.KOBOBBOBOK...', 'SSKOBOOOOOOBOKKK', 'SSSKOBOOOOBOKSSS', 'KKSKKOOOOOOKKSSS', '..K.KOOOOOOK.KKK', '...KOOOOOOOOK...', '...KKKKKKKKKK...', '................'] },
    monk_cs: { pal: { K, S: '#d9a27a', O: '#d0782a', B: '#5a2a14' }, rows: ['................', '.....KKKKKK.....', '....KSSSSSSK....', '...KSSSSSSSSK...', '...KSSSSSSSSK...', 'KK.KSKSSSSKSK.KK', 'SSKKSSSSSSSSKKSS', 'SSK.KSSSSSSK.KSS', 'SSKKOBOBBOBOKKSS', 'SSKOBOOOOOOBOKSS', 'KKSKOBOOOOBOKSKK', '.KSKKOOOOOOKKSK.', '..K.KOOOOOOK.K..', '...KOOOOOOOOK...', '...KKKKKKKKKK...', '................'] },
    monk_ht: { pal: { K, S: '#d9a27a', O: '#d0782a', B: '#5a2a14' }, rows: ['................', '....KKKKKK......', '...KSSSSSSK.....', '..KSSSSSSSSK....', '..KSSSSSSSSK....', '..KSKKSSKKSK....', '..KSSSSSSSSK....', 'K..KSSSSSSKK...K', 'SK.KOBOBBOBOK.KS', 'SSKOBOOOOOOBOKSS', 'KSSKOBOOOOBOKSSK', '.KSKKOOOOOOKKSK.', '..K.KOOOOOOK.K..', '...KOOOOOOOOK...', '...KKKKKKKKKK...', '................'] },
    taoist_rd: { pal: { K, H: '#1a1414', Y: '#e8c13a', S: '#e2b48a', W: '#e2b48a', B: '#2e4a7a' }, rows: ['.....KKKK.......', '....KYKKYK......', '...KHHHHHHK.....', '..KHHHHHHHHK....', '..KSSSSSSSSK..KK', '..KSKSSSSKSK.KSS', '..KSSSSSSSSK.KBB', '...KWWWWWWKK.KBB', '...KBBWBBWBBKKBB', '..KBBBKBBKBBBKBB', '.KBKBBBBBBBBKBKK', 'KBBKKBBBBBBKKBK.', 'SBK.KBBBBBBK.K..', 'SK.KBBBBBBBBK...', 'K.KBBBBBBBBBBK..', '..KKKKKKKKKKKK..'] },
    taoist_st: { pal: { K, H: '#1a1414', Y: '#e8c13a', S: '#e2b48a', W: '#e2b48a', B: '#2e4a7a' }, rows: ['.......KKKK.....', '......KYKKYK....', '.....KHHHHHHK...', '....KHHHHHHHHK..', '....KSSSSSSSSK..', '....KSKSSSSKSK..', '....KSSSSSSSSK..', '....KKWWWWWWK...', 'KK.KBBWBBWBBK...', 'SBKBBBKBBKBBBKKK', 'SBBKBBBBBBBBKBBS', 'KKBKKBBBBBBKKBBS', '..K.KBBBBBBK.KKK', '...KBBBBBBBBK...', '..KBBBBBBBBBBK..', '..KKKKKKKKKKKK..'] },
    taoist_cs: { pal: { K, H: '#1a1414', Y: '#e8c13a', S: '#e2b48a', W: '#e2b48a', B: '#2e4a7a' }, rows: ['......KKKK......', '.....KYKKYK.....', '....KHHHHHHK....', '...KHHHHHHHHK...', '...KSSSSSSSSK...', 'KK.KSKSSSSKSK.KK', 'SSKKSSSSSSSSKKSS', 'BBK.KWWWWWWK.KBB', 'BBKKBBWBBWBBKKBB', 'BBKBBBKBBKBBBKBB', 'KKBKBBBBBBBBKBKK', '.KBKKBBBBBBKKBK.', '..K.KBBBBBBK.K..', '...KBBBBBBBBK...', '..KBBBBBBBBBBK..', '..KKKKKKKKKKKK..'] },
    taoist_ht: { pal: { K, H: '#1a1414', Y: '#e8c13a', S: '#e2b48a', W: '#e2b48a', B: '#2e4a7a' }, rows: ['.....KKKK.......', '....KYKKYK......', '...KHHHHHHK.....', '..KHHHHHHHHK....', '..KSSSSSSSSK....', '..KSKKSSKKSK....', '..KSSSSSSSSK....', 'K..KWWWWWWKK...K', 'SK.KBBWBBWBBK.KS', 'SBKBBBKBBKBBBKBS', 'KBBKBBBBBBBBKBBK', '.KBKKBBBBBBKKBK.', '..K.KBBBBBBK.K..', '...KBBBBBBBBK...', '..KBBBBBBBBBBK..', '..KKKKKKKKKKKK..'] },
    corpseman_rd: { pal: { K, T: '#a8884a', S: '#d9b08a', D: '#1e1c24', Y: '#e8c13a', L: '#3e3a4e' }, rows: ['................', '......KK........', '....KKTTKK......', '..KKTTTTTTKK....', 'KKTTTTTTTTTTKK..', 'TTTTTTTTTTTTTTKK', 'KKKSSSSSSSSKKKSS', '..KSKSSSSKSK.KLL', '..KSSSSSSSSK.KLL', '...KDDDDDDDDKKLL', '..KDDDDDDDDDDKLL', '.KLKDDDDDDDDKLKK', 'KLLKKDDDDDDKKLK.', 'SLK.KDDDDDDK.K..', 'SK.KDDDDDDDDK...', 'K..KKKKKKKKKK...'] },
    corpseman_st: { pal: { K, T: '#a8884a', S: '#d9b08a', D: '#1e1c24', Y: '#e8c13a', L: '#3e3a4e' }, rows: ['................', '........KK......', '......KKTTKK....', '....KKTTTTTTKK..', '..KKTTTTTTTTTTKK', '.KTTTTTTTTTTTTTT', '..KKKSSSSSSSSKKK', '....KSKSSSSKSK..', '....KSSSSSSSSK..', 'KK.KDDDDDDDDK...', 'SLKDDDDDDDDDDKKK', 'SLLKDDDDDDDDKLLS', 'KKLKKDDDDDDKKLLS', '..K.KDDDDDDK.KKK', '...KDDDDDDDDK...', '...KKKKKKKKKK...'] },
    corpseman_cs: { pal: { K, T: '#a8884a', S: '#d9b08a', D: '#1e1c24', Y: '#e8c13a', L: '#3e3a4e' }, rows: ['................', '.......KK.......', '.....KKTTKK.....', '...KKTTTTTTKK...', '.KKTTTTTTTTTTKK.', 'KTTTTTTTTTTTTTTK', 'KKKKSSSSSSSSKKKK', 'SSKKSKSSSSKSKKSS', 'LLKKSSSSSSSSKKLL', 'LLKKDDDDDDDDKKLL', 'LLKDDDDDDDDDDKLL', 'KKLKDDDDDDDDKLKK', '.KLKKDDDDDDKKLK.', '..K.KDDDDDDK.K..', '...KDDDDDDDDK...', '...KKKKKKKKKK...'] },
    corpseman_ht: { pal: { K, T: '#a8884a', S: '#d9b08a', D: '#1e1c24', Y: '#e8c13a', L: '#3e3a4e' }, rows: ['................', '......KK........', '....KKTTKK......', '..KKTTTTTTKK....', 'KKTTTTTTTTTTKK..', 'TTTTTTTTTTTTTTK.', 'KKKSSSSSSSSKKK..', '..KSKKSSKKSK....', 'K.KSSSSSSSSK...K', 'SK.KDDDDDDDDK.KS', 'SLKDDDDDDDDDDKLS', 'KLLKDDDDDDDDKLLK', '.KLKKDDDDDDKKLK.', '..K.KDDDDDDK.K..', '...KDDDDDDDDK...', '...KKKKKKKKKK...'] },
    ngoc_rd: { pal: { K, H: '#1a1012', G: '#3fd18a', S: '#f2c8a8', P: '#e86a8a', R: '#ff8aa0' }, rows: ['....KKKKKK......', '...KHHHHHHK.....', '..KHHHHHHHHK....', '.KHHHHGGHHHHK...', '.KHHHHHHHHHHK...', '.KHSSSSSSSSHK.KK', '.KHSKSSSSKSHKKSS', '.KHSRSSSSRSHKKPP', '.KHKKSSSSKKHKKPP', '..KKKGGGGGGKKKPP', '..KPPGGGGGGPPKPP', '.KPKPPGPPGPPKPKK', 'KPPKKPPPPPPKKPK.', 'SPK.KPPPPPPK.K..', 'SK.KPPPPPPPPK...', 'K..KKKKKKKKKK...'] },
    ngoc_st: { pal: { K, H: '#1a1012', G: '#3fd18a', S: '#f2c8a8', P: '#e86a8a', R: '#ff8aa0' }, rows: ['......KKKKKK....', '.....KHHHHHHK...', '....KHHHHHHHHK..', '...KHHHHGGHHHHK.', '...KHHHHHHHHHHK.', '...KHSSSSSSSSHK.', '...KHSKSSSSKSHK.', '...KHSRSSSSRSHK.', '...KHKKSSSSKKHK.', 'KK.KKGGGGGGKKK..', 'SPKPPGGGGGGPPKKK', 'SPPKPPGPPGPPKPPS', 'KKPKKPPPPPPKKPPS', '..K.KPPPPPPK.KKK', '...KPPPPPPPPK...', '...KKKKKKKKKK...'] },
    ngoc_cs: { pal: { K, H: '#1a1012', G: '#3fd18a', S: '#f2c8a8', P: '#e86a8a', R: '#ff8aa0' }, rows: ['.....KKKKKK.....', '....KHHHHHHK....', '...KHHHHHHHHK...', '..KHHHHGGHHHHK..', '..KHHHHHHHHHHK..', '..KHSSSSSSSSHK..', 'KKKHSKSSSSKSHKKK', 'SSKHSRSSSSRSHKSS', 'PPKHKKSSSSKKHKPP', 'PPKKKGGGGGGKKKPP', 'PPKPPGGGGGGPPKPP', 'KKPKPPGPPGPPKPKK', '.KPKKPPPPPPKKPK.', '..K.KPPPPPPK.K..', '...KPPPPPPPPK...', '...KKKKKKKKKK...'] },
    ngoc_ht: { pal: { K, H: '#1a1012', G: '#3fd18a', S: '#f2c8a8', P: '#e86a8a', R: '#ff8aa0' }, rows: ['....KKKKKK......', '...KHHHHHHK.....', '..KHHHHHHHHK....', '.KHHHHGGHHHHK...', '.KHHHHHHHHHHK...', '.KHSSSSSSSSHK...', '.KHSKKSSKKSHK...', '.KHSRSSSSRSHK...', 'KKHKKSSSSKKHK..K', 'SKKKKGGGGGGKK.KS', 'SPKPPGGGGGGPPKPS', 'KPPKPPGPPGPPKPPK', '.KPKKPPPPPPKKPK.', '..K.KPPPPPPK.K..', '...KPPPPPPPPK...', '...KKKKKKKKKK...'] },
    constable_rd: { pal: { K, H: '#1a1418', R: '#c4291f', S: '#efc39a', D: '#2a2a3a', M: '#b9bcc6', L: '#4a4a64' }, rows: ['................', '....KKKKKK......', '...KHHHHHHK.....', '..KHHHHHHHHK....', '..KRRRRRRRRK..KK', '..KHSSSSSSHK.KSS', '..KSKSSSSKSK.KLL', '...KSSSSSSKK.KLL', '...KRDDDDDDRKKLL', '..KDRDDDDDDRDKLL', '.KLKDRDDDDRDKLKK', 'KLLKKDDDDDDKKLK.', 'SLK.KDDDDDDK.K..', 'KK.KDKKKKKKDK...', '...KDKK..KKDK...', '..KKK......KKK..'] },
    constable_st: { pal: { K, H: '#1a1418', R: '#c4291f', S: '#efc39a', D: '#2a2a3a', M: '#b9bcc6', L: '#4a4a64' }, rows: ['................', '......KKKKKK....', '.....KHHHHHHK...', '....KHHHHHHHHK..', '....KRRRRRRRRK..', '....KHSSSSSSHK..', '....KSKSSSSKSK..', '....KKSSSSSSK...', 'KK.KRDDDDDDRK...', 'SLKDRDDDDDDRDKKK', 'SLLKDRDDDDRDKLLS', 'KKLKKDDDDDDKKLLS', '..K.KDDDDDDKKKKK', '...KDKKKKKKKDK..', '...KDKK...KKDK..', '..KKK.......KKK.'] },
    constable_cs: { pal: { K, H: '#1a1418', R: '#c4291f', S: '#efc39a', D: '#2a2a3a', M: '#b9bcc6', L: '#4a4a64' }, rows: ['................', '.....KKKKKK.....', '....KHHHHHHK....', '...KHHHHHHHHK...', '...KRRRRRRRRK...', 'KK.KHSSSSSSHK.KK', 'SSKKSKSSSSKSKKSS', 'LLK.KSSSSSSK.KLL', 'LLKKRDDDDDDRKKLL', 'LLKDRDDDDDDRDKLL', 'KKLKDRDDDDRDKLKK', '.KLKKDDDDDDKKLK.', '..K.KDDDDDDK.K..', '....KDKKKKDK....', '....KDKKKKDK....', '...KKK....KKK...'] },
    constable_ht: { pal: { K, H: '#1a1418', R: '#c4291f', S: '#efc39a', D: '#2a2a3a', M: '#b9bcc6', L: '#4a4a64' }, rows: ['................', '....KKKKKK......', '...KHHHHHHK.....', '..KHHHHHHHHK....', '..KRRRRRRRRK....', '..KHSSSSSSHK....', '..KSKKSSKKSK....', 'K..KSSSSSSKK...K', 'SK.KRDDDDDDRK.KS', 'SLKDRDDDDDDRDKLS', 'KLLKDRDDDDRDKLLK', '.KLKKDDDDDDKKLK.', '..K.KDDDDDDK.K..', '...KDKKKKKKDK...', '...KDKK..KKDK...', '..KKK......KKK..'] },
    scholar_rd: { pal: { K, B: '#3a5a9a', S: '#e2b48a', H: '#2a2a2a', W: '#e8e4dc', Y: '#c9a45c' }, rows: ['................', '...KKKKKKKK.....', '...KBBBBBBK.....', '..KBBBBBBBBK....', '..KHHHHHHHHK....', '..KHSSSSSSHK.KK.', '...KSKSSKSK.KSSK', '...KSSSSSSK.KBBK', '....KHHHHKKKKBBK', '...KBBBWWBBBKBBK', '..KBBBBWWBBBBBBK', '..KBKBBBBBBKBKK.', '.KBBKBBBBBBKBK..', 'KSBKKBBBBBBKK...', 'KSKKBBBBBBBBK...', '.K.KKKKKKKKKK...'] },
    scholar_st: { pal: { K, B: '#3a5a9a', S: '#e2b48a', H: '#2a2a2a', W: '#e8e4dc', Y: '#c9a45c' }, rows: ['................', '.....KKKKKKKK...', '.....KBBBBBBK...', '....KBBBBBBBBK..', '....KHHHHHHHHK..', '....KHSSSSSSHK..', '.....KSKSSKSK...', '.....KSSSSSSK...', '....KKKHHHHK....', 'KKKKBBBWWBBBK...', 'SBBBBBBWWBBBBKKK', 'SBBBKBBBBBBKBBBS', 'KKKBKBBBBBBKBBBS', '...KKBBBBBBKKKKK', '...KBBBBBBBBK...', '...KKKKKKKKKK...'] },
    scholar_cs: { pal: { K, B: '#3a5a9a', S: '#e2b48a', H: '#2a2a2a', W: '#e8e4dc', Y: '#c9a45c' }, rows: ['................', '....KKKKKKKK....', '....KBBBBBBK....', '...KBBBBBBBBK...', '...KHHHHHHHHK...', '...KHSSSSSSHK...', '.KK.KSKSSKSK.KK.', 'KSSKKSSSSSSKKSSK', 'KBBKKKHHHHKKKBBK', 'KBBKBBBWWBBBKBBK', 'KBBBBBBWWBBBBBBK', '.KKBKBBBBBBKBKK.', '..KBKBBBBBBKBK..', '...KKBBBBBBKK...', '...KBBBBBBBBK...', '...KKKKKKKKKK...'] },
    scholar_ht: { pal: { K, B: '#3a5a9a', S: '#e2b48a', H: '#2a2a2a', W: '#e8e4dc', Y: '#c9a45c' }, rows: ['................', '...KKKKKKKK.....', '...KBBBBBBK.....', '..KBBBBBBBBK....', '..KHHHHHHHHK....', '..KHSSSSSSHK....', '...KSKKKKSK.....', '...KSSSSSSK.....', 'K...KHHHHKKK...K', 'SKKKBBBWWBBBKKKS', 'SBBBBBBWWBBBBBBS', 'KBBBKBBBBBBKBBBK', '.KKBKBBBBBBKBKK.', '...KKBBBBBBKK...', '...KBBBBBBBBK...', '...KKKKKKKKKK...'] },
    // ---------- 第 1–4 章新妖物、首领大图（art/mons24.py 生成；_atk 是出招图） ----------
    boar: { pal: { K, B: '#5a3a24', D: '#3a2414', W: '#f0e8d8', R: '#ff3a2a', P: '#c8907a' }, rows: ['................', '................', '......KK.KK.....', '.....KDKKDDK.K..', '....KDDDDDDDKDK.', '..KKBBBBDDDDDDK.', '.KBBRBBBBBBBDDDK', 'KPBBBBBBBBBBBBDK', 'KPPKBBBBBBBBBBBK', 'KPPKBBBBBBBBBBK.', '.KWWKBBBBBBBBBK.', '..KWKBBKKKKBBK..', '...K.KBK..KBK...', '....KDDK..KDDK..', '....KKK...KKK...', '................'] },
    boar_atk: { pal: { K, B: '#5a3a24', D: '#3a2414', W: '#f0e8d8', R: '#ff3a2a', P: '#c8907a' }, rows: ['................', '................', '......KK.KK.....', '.....KDKKDDK.K..', '....KDDDDDDDKDK.', '..KKBBBBDDDDDDK.', '.KBBYBBBBBBBDDDK', 'KPBBBBBBBBBBBBDK', 'KPPKBBBBBBBBBBBK', 'KPPKBBBBBBBBBBK.', 'KWWWKBBBBBBBBBK.', '.KWKKBBKKKKBBK..', '..K..KBK..KBK...', '...KDDK....KDDK.', '...KKK.....KKK..', '................'] },
    bear: { pal: { K, B: '#2a2220', C: '#c8a070', R: '#ff3a2a', P: '#8a6a4a', W: '#f0e8d8' }, rows: ['..KK........KK..', '.KBBK......KBBK.', '.KBBBKKKKKKBBBK.', '..KBBBBBBBBBBK..', '..KBRBBBBBBRBK..', '..KBBBKPPKBBBK..', '...KBBKKKKBBK...', '.KKKBBBBBBBBKKK.', 'KBBKCCBBBBCCKBBK', 'KBBKBCCBBCCBKBBK', 'KWBKBBCCCCBBKBWK', '.KK.KBBBBBBK.KK.', '....KBBBBBBK....', '...KBBBKKBBBK...', '...KBBK..KBBK...', '...KKKK..KKKK...'] },
    bear_atk: { pal: { K, B: '#2a2220', C: '#c8a070', R: '#ff3a2a', P: '#8a6a4a', W: '#f0e8d8' }, rows: ['KWK..........KWK', 'KBK.KK....KK.KBK', 'KBKKBBKKKKBBKKBK', 'KBBBBBBBBBBBBBBK', '.KKBYBBBBBBYBKK.', '..KBBKWKKWKBBK..', '...KBKRRRRKBK...', '.KKKBBBBBBBBKKK.', '..KKCCBBBBCCKK..', '...KBCCBBCCBK...', '...KBBCCCCBBK...', '....KBBBBBBK....', '....KBBBBBBK....', '...KBBBKKBBBK...', '...KBBK..KBBK...', '...KKKK..KKKK...'] },
    leopard: { pal: { K, Y: '#d8a040', S: '#3a2a14', W: '#f0e0c0', R: '#7aff4a' }, rows: ['................', '................', '..............K.', '.KK..........KYK', 'KYYK.........KYK', 'KRYYK........KK.', 'KYYYYKKKKKKKKYK.', '.KWYYYSYYSYYYYK.', '..KWYSYYYSYYSYK.', '..KWWYYSYYYSYYK.', '...KWWWYYYYYYK..', '...KYYKKKKKKYYK.', '..KYK......KYK..', '.KYK......KYK...', '.KK.......KK....', '................'] },
    leopard_atk: { pal: { K, Y: '#d8a040', S: '#3a2a14', W: '#f0e0c0', R: '#7aff4a' }, rows: ['................', '................', '..............K.', '.KK..........KYK', 'KYYK..........K.', 'KRYYK.........KK', 'KYWYYKKKKKKKKYK.', 'KWKYYYSYYSYYYYK.', '..KWYSYYYSYYSYK.', '..KWWYYSYYYSYYK.', '...KWWWYYYYYYK..', '..KYYKKKKKKKYYK.', '.KYK........KYK.', 'KYK..........KYK', 'KK............KK', '................'] },
    monkey: { pal: { K, B: '#6a4a30', F: '#e8e0d0', R: '#c4291f' }, rows: ['................', '.....KKKKKK.....', '..KKKBBBBBBKKK..', '.KBBKFFFFFFKBBK.', '.KBBKFKFFKFKBBK.', '..KKKFRFFRFKKK..', '.....KFKKFK.....', '....KBKFFKBK....', '...KBBBKKBBBK...', '..KBKBBBBBBKBK..', '.KBK.KBBBBK.KBK.', '.KK..KBBBBK..KK.', '....KBBKKBBK....', '...KBBK..KBBK...', '...KKK....KKK...', '................'] },
    monkey_atk: { pal: { K, B: '#6a4a30', F: '#e8e0d0', R: '#c4291f' }, rows: ['................', '.....KKKKKK.....', '..KKKBBBBBBKKK..', '.KBBKFFFFFFKBBK.', '.KBBKFKFFKFKBBK.', '..KKKFRFFRFKKK..', '.....KKRRKK.....', '....KBKFFKBK....', '...KBBBKKBBBK...', 'KK.KKBBBBBBKK.KK', 'KBKK.KBBBBK.KKBK', '.K...KBBBBK...K.', '....KBBKKBBK....', '...KBBK..KBBK...', '...KKK....KKK...', '................'] },
    shanxiao: { pal: { K, B: '#4a3a2a', R: '#d83a2a', U: '#3a6ad8', Y: '#ffd23a', W: '#f0e8d8' }, rows: ['....KKKKKKKK....', '...KBBBBBBBBK...', '..KBBYBBBBYBBK..', '..KBUURRRRUUBK..', '..KBUURRRRUUBK..', '...KBKWWWWKBK...', '..KKBBKKKKBBKK..', '.KBBBBBBBBBBBBK.', 'KBBKBBBBBBBBKBBK', 'KWK.KBBBBBBK.KWK', '.K..KBBBBBBK..K.', '.....KBBBBK.....', '.....KBBBBK.....', '......KBBK......', '.....KBBBBK.....', '.....KKKKKK.....'] },
    shanxiao_atk: { pal: { K, B: '#4a3a2a', R: '#d83a2a', U: '#3a6ad8', Y: '#ffd23a', W: '#f0e8d8' }, rows: ['....KKKKKKKK....', '...KBBBBBBBBK...', '..KBBYBBBBYBBK..', '..KBUURRRRUUBK..', '..KBUURRRRUUBK..', '...KBKWKKWKBK...', '..KKBBKRRKBBKK..', 'KKBBBBBBBBBBBBKK', 'KWKKBBBBBBBBKKWK', '.K..KBBBBBBK..K.', '....KBBBBBBK....', '.....KBBBBK.....', '.....KBBBBK.....', '......KBBK......', '.....KBBBBK.....', '.....KKKKKK.....'] },
    treant: { pal: { K, B: '#6a4a2a', D: '#4a3218', G: '#4a8a3a', L: '#7ab84a', Y: '#ffd23a' }, rows: ['....KKKK', '..KKGGLG', '.KGLGGGG', 'KGGGGLGG', 'KGLGGGGG', '.KGGKKKK', '..KKKBBB', '...KBDBB', '...KBYKB', '...KBBBB', '.KKKBKKK', 'KBBKBBBB', 'K..KBDBB', '...KBBBB', '..KBBKBB', '.KKK.KKK'] },
    treant_atk: { pal: { K, B: '#6a4a2a', D: '#4a3218', G: '#4a8a3a', L: '#7ab84a', Y: '#ffd23a' }, rows: ['....KKKK', '..KKGGLG', '.KGLGGGG', 'KGGGGLGG', 'KGLGGGGG', '.KGGKKKK', '..KKKBBB', '...KBDBB', '...KBYYB', '...KBBBB', '.KKKKRRR', 'KBBKKRKK', 'K..KBDBB', '...KBBBB', '..KBBKBB', '.KKK.KKK'] },
    spiderwoman: { pal: { K, H: '#1a1014', S: '#e8c8c0', P: '#6a2a7a', R: '#ff3a5a', L: '#9a6a9a' }, rows: ['....KKKKKKKK....', '...KHHHHHHHHK...', '..KHHSSSSSSHHK..', '..KHSRSSSSRSHK..', '..KHSSSKKSSSHK..', '..KHHKSSSSKHHK..', '.KHHKPPPPPPKHHK.', '..KKPPPSSPPPKK..', '.L.KPPPPPPPPK.L.', 'L.L.KPPPPPPK.L.L', '..L.KKPPPPKK.L..', '.L..L.KKKK.L..L.', 'L..L........L..L', '..L..........L..', '.L............L.', '................'] },
    spiderwoman_atk: { pal: { K, H: '#1a1014', S: '#e8c8c0', P: '#6a2a7a', R: '#ff3a5a', L: '#9a6a9a' }, rows: ['....KKKKKKKK....', '...KHHHHHHHHK...', '..KHHSSSSSSHHK..', '..KHSRSSSSRSHK..', '..KHSSKRRKSSHK..', '..KHHKSSSSKHHK..', '.KHHKPPPPPPKHHK.', '..KKPPPSSPPPKK..', 'LKLKPPPPPPPPKLKL', 'L.L.KPPPPPPK.L.L', '..L.KKPPPPKK.L..', 'L...L.KKKK.L...L', '.L.L........L.L.', '..L..........L..', '.L............L.', '................'] },
    rat: { pal: { K, R: '#c84a2a', O: '#ff8a3a', Y: '#ffd23a', W: '#ffffff' }, rows: ['...........Y....', '..........YOY...', '..........YOOY..', '...........OOY..', '...........KO...', '...........K....', '..KK.......K....', '.KRRK..KKKKK....', 'KWRRRKKRRRRRK...', 'KRRRRRRRRRRRRK..', '.KKORRRRRRRRRK..', '...KOOOORRRRK...', '...KKKKKKKKK....', '....KK...KK.....', '................', '................'] },
    rat_atk: { pal: { K, R: '#c84a2a', O: '#ff8a3a', Y: '#ffd23a', W: '#ffffff' }, rows: ['..........Y.Y...', '.........YOYOY..', '..........YOOY..', '...........OOY..', '...........KO...', '...........K....', '..KK.......K....', '.KRRK..KKKKK....', 'KYRRRKKRRRRRK...', 'KRKKRRRRRRRRRK..', 'KWKORRRRRRRRRK..', '...KOOOORRRRK...', '...KKKKKKKKK....', '....KK...KK.....', '................', '................'] },
    cocoonman: { pal: { K, W: '#e8e4dc', G: '#b8b4ac', R: '#ff3a2a' }, rows: ['....KKKK', '...KWWWW', '..KWGWWG', '..KWWRWW', '..KGWWWW', '...KWGWW', '..KKWWWG', '.KWKGWWW', 'KWGKWWGW', 'KWWKWGWW', '.KK.KWWG', '....KGWW', '....KWWG', '....KWK.', '...KWWK.', '...KKKK.'] },
    cocoonman_atk: { pal: { K, W: '#e8e4dc', G: '#b8b4ac', R: '#ff3a2a' }, rows: ['....KKKK', '...KWWWW', '..KWGWWG', '..KWWRRW', '..KGWWWW', '...KWGWW', 'KKKKWWWG', 'KWWKGWWW', '.KGKWWGW', '..KKWGWW', '.KK.KWWG', '....KGWW', '....KWWG', '....KWK.', '...KWWK.', '...KKKK.'] },
    tarantula: { pal: { K, B: '#4a2a1a', O: '#d87a2a', R: '#ff3a2a' }, rows: ['................', '................', '....K......K....', '...KBK....KBK...', '..KBKKKKKKKKBK..', '.KBKBBBBBBBBKBK.', 'KBKBBRBBBBRBBKBK', 'BK.KBBRBBRBBK.KB', 'K.KBBBOBBOBBBK.K', '.KBK.KBOOBK.KBK.', 'KBK.KBBBBBBK.KBK', 'BK..KOBBBBOK..KB', 'K...KBOBBOBK...K', '....KBBOOBBK....', '.....KBBBBK.....', '......KKKK......'] },
    tarantula_atk: { pal: { K, B: '#4a2a1a', O: '#d87a2a', R: '#ff3a2a' }, rows: ['................', '................', '..K..........K..', '.KBK..K..K..KBK.', 'KBKKKKBKKBKKKKBK', '.KBKBBBBBBBBKBK.', 'KBKBBYBBBBYBBKBK', 'BK.KBBYBBYBBK.KB', 'K.KBBBOBBOBBBK.K', '.KBK.KRWWRK.KBK.', 'KBK.KBBBBBBK.KBK', 'BK..KOBBBBOK..KB', 'K...KBOBBOBK...K', '....KBBOOBBK....', '.....KBBBBK.....', '......KKKK......'] },
    bandit: { pal: { K, H: '#3a2a1a', R: '#7a1a1a', S: '#d9a27a', B: '#5a4a3a' }, rows: ['........', '....KKKK', '...KRRRR', '..KRRRRR', '..KHSSSS', '..KSKSSS', '..KSSSSS', '...KHHHH', '...KHHHH', '..KKBBBB', '.KSKBBRB', '.KSKBBBB', '..K.KBBB', '....KBKK', '....KB.K', '...KKK..'] },
    lavadog: { pal: { K, D: '#2a2220', O: '#ff6a1a', Y: '#ffd23a' }, rows: ['................', '................', '.K..............', '.KDK............', '.KDDKKKKKKKK....', 'KDDDDDODDDDDK...', 'KYDDODDDODDDDK..', 'KDDDDDDDDODDDDKK', '.KOOKDODDDDODDK.', '..KKKDDDDODDDK..', '....KDDKKKKDDK..', '....KDK....KDK..', '...KDK.....KDK..', '...KOK....KOK...', '...KK.....KK....', '................'] },
    lavadog_atk: { pal: { K, D: '#2a2220', O: '#ff6a1a', Y: '#ffd23a' }, rows: ['................', '................', '.K..............', '.KDK............', '.KDDKKKKKKKK....', 'KDDDDDODDDDDK...', 'KYDDODDDODDDDK..', 'KDDDDDDDDODDDDKK', 'KOYOKDODDDDODDK.', '.KOOKDDDDODDDK..', '..KK.KDKKKKDDK..', '...KDK......KDK.', '..KDK........KDK', '..KOK........KOK', '..KK..........KK', '................'] },
    stoneguard: { pal: { K, S: '#8a7a6a', D: '#5a4a3a', O: '#ff8a2a', Y: '#ffd23a' }, rows: ['...KKKKK', '..KSSSSS', '..KSDSSS', '..KSOKSS', '..KSSSSS', '..KKDDDD', 'KKKSSSSS', 'KSDKSSOO', 'KSSKSOYO', 'KSDKSSOO', '.KKKSSSS', '...KDDDD', '...KSSKK', '...KSSK.', '..KSSSK.', '..KKKKK.'] },
    stoneguard_atk: { pal: { K, S: '#8a7a6a', D: '#5a4a3a', O: '#ff8a2a', Y: '#ffd23a' }, rows: ['...KKKKK', '..KSSSSS', '..KSDSSS', '..KSYKSS', '..KSSSSS', '..KKDDDD', 'KKKSSSSS', 'KSDKSOYY', 'KSSKOYYY', 'KSDKSOYY', '.KKKSSSS', '...KDDDD', '...KSSKK', '...KSSK.', '..KSSSK.', '..KKKKK.'] },
    miner: { pal: { K, Y: '#d8b030', L: '#fff4a0', G: '#7f9a5a', R: '#ff3a2a', B: '#5a4a3a' }, rows: ['........', '.....KKK', '....KYYL', '...KYYYY', '..KKKKKK', '...KGGGG', '...KGRGG', '...KGGKK', '....KGGG', '..KKBBBB', '.KGKBBBB', '.KG.KBBB', '....KBBB', '....KBKK', '....KB.K', '...KKK..'] },
    miner_atk: { pal: { K, Y: '#d8b030', L: '#fff4a0', G: '#7f9a5a', R: '#ff3a2a', B: '#5a4a3a' }, rows: ['........', '.....KKK', '....KYYL', '...KYYYY', '..KKKKKK', '...KGGGG', '...KGRRG', '...KGKRR', '....KGKK', '..KKBBBB', '.KGKBBBB', '.KG.KBBB', '....KBBB', '....KBKK', '....KB.K', '...KKK..'] },
    lizard: { pal: { K, R: '#a83a1a', O: '#ff8a3a', Y: '#ffd23a' }, rows: ['................', '................', '................', '................', '................', '................', '.KKK..........K.', 'KRYRKK.......KRK', 'KRRRRRKKKKKKKRK.', '.KORRORRRORRRK..', '..KKRRRRRRORRK..', '...KOOOOOOOOK...', '..KRK.KKKK.KRK..', '.KRK.......KRK..', '.KK.........KK..', '................'] },
    lizard_atk: { pal: { K, R: '#a83a1a', O: '#ff8a3a', Y: '#ffd23a' }, rows: ['................', '................', '................', '................', '................', '.KKK............', 'KRYRK.........K.', 'KRRRRKK......KRK', 'KOOKRRKKKKKKKRK.', 'KYOKRORRRORRRK..', '.KKKRRRRRRORRK..', '...KOOOOOOOOK...', '..KRK.KKKK.KRK..', '.KRK.......KRK..', '.KK.........KK..', '................'] },
    firecrow: { pal: { K, B: '#2a1a1a', O: '#ff6a1a', Y: '#ffd23a', R: '#ff3a2a' }, rows: ['........', 'Y.......', 'OY......', 'KOY...KK', '.KOO.KBB', '.KOOKBRB', '..KOOKBB', '..KYOOKY', '...KYOOB', '....KOBB', '.....KBB', '....KOKB', '....K.KK', '........', '........', '........'] },
    firecrow_atk: { pal: { K, B: '#2a1a1a', O: '#ff6a1a', Y: '#ffd23a', R: '#ff3a2a' }, rows: ['Y.Y.....', 'OYOY....', 'KOOY..KK', '.KOOYKBB', '..KOOKBR', '..KOOKBB', '..KOOKBB', '..KYOOKY', '...KYOOB', '....KOBB', '.....KBB', '....KOKB', '....K.KK', '........', '........', '........'] },
    minerghost: { pal: { K, C: '#8aa8b8', Y: '#b8a050', L: '#d8f4ff' }, rows: ['........', '.....KKK', '....KYYL', '...KYYYY', '..KKKKKK', '..KCCCCC', '..KCKKCC', '..KCKKCC', '..KCCCKK', '.KCCCCCC', '.KCCCCCC', 'KCCCCCCC', 'KCKCCKCC', 'KK.KK.KC', '........', '........'] },
    minerghost_atk: { pal: { K, C: '#8aa8b8', Y: '#b8a050', L: '#d8f4ff' }, rows: ['........', '.....KKK', '....KYYL', '...KYYYY', '..KKKKKK', '..KCCCCC', '..KCLLCC', '..KCLLCC', '..KCCKKK', '.KCCCKLL', '.KCCCCCC', 'KCCCCCCC', 'KCKCCKCC', 'KK.KK.KC', '........', '........'] },
    fireling: { pal: { K, Y: '#fff0a0', O: '#ffb02a', R: '#ff5a1a', D: '#c42a0a' }, rows: ['.......Y', '......YY', '...Y..YO', '...YY.OO', '..YOOYOO', '..OOOOOR', '.YOKKOOR', '.OOKKORR', '.OROOORR', '.ORROOKK', '..RRRRRR', '..DRRRRR', '...DRRRD', '....DDDD', '........', '........'] },
    fireling_atk: { pal: { K, Y: '#fff0a0', O: '#ffb02a', R: '#ff5a1a', D: '#c42a0a' }, rows: ['..Y....Y', '..YY..YY', '...Y..YO', '...YY.OO', '..YOOYOO', '..OOOOOR', '.YOYYOOR', '.OOYYORR', '.OROOORR', '.ORROKKK', '..RRRKYY', '..DRRRRR', '...DRRRD', '....DDDD', '........', '........'] },
    w_gao: { pal: { K, M: '#a8acb8', F: '#6a3a1a' }, rows: ['........KKK.....', '.......KMMMK....', '........KMMMK...', '..........KMMK..', '..........KFKMK.', '.........KFK.KMK', '........KFK...KK', '.......KFK......', '......KFK.......', '.....KFK........', '....KFK.........', '...KFK..........', '..KFK...........', '.KFK............', '.KK.............', '................'] },
    xianling32: { w: 32, pal: { K, H: '#2a2a3a', R: '#c4291f', Y: '#e8c83a', G: '#8aa878', E: '#ff3a2a', B: '#3a2a5a', D: '#24183a', W: '#e8e0c8', N: '#c8d8a8' }, rows: ['..............KR', '............KKRR', '..........KKHHHH', '........KKHHHHHH', '......KKHHHHHHHH', '.....KHHHHHHHHHH', '....KKKKKKKKKKKK', '.....KGGGGGGGYYY', '.....KGGGGGGKYRY', '.....KGEEGGGGYYY', '.....KGKKGGGGYRY', '.....KGGGGGGGYYY', '.....KGGGGGGGGYY', '......KGGKKKKGGG', '......KGGKWKWKKK', '.......KGGGGGGGG', '........KKKKKKKK', '......KKBBBBBBBB', '....KKBBBBBBDBBB', '...KBBBBBBBBKWWW', '..KBBBBBBBBBKWYW', '.KBBKBBBBBBBKWWW', 'KGNKKBBBBBBBKKKK', 'KGNK.KBBBBBBBBBB', '.KK..KBBBBBBDBBB', '.....KBBBBBBBBBB', '.....KBBBBBBBBBB', '....KBBBBBBBBBBB', '....KBBBBBBBBDBB', '...KBBBBBBBBBBBB', '...KDDDDDDDDDDDD', '...KKKKKKKKKKKKK'] },
    xianling32_atk: { w: 32, pal: { K, H: '#2a2a3a', R: '#c4291f', Y: '#e8c83a', G: '#8aa878', E: '#ff3a2a', B: '#3a2a5a', D: '#24183a', W: '#e8e0c8', N: '#c8d8a8' }, rows: ['..............KR', '............KKRR', '..........KKHHHH', '........KKHHHHHH', '......KKHHHHHHHH', '.....KHHHHHHHHHH', '....KKKKKKKKKKKK', '.....KGGGGGGGYYY', '.....KGGGGGGKYRY', '.....KGEEGGGGYYY', '.....KGEEGGGGYRY', '.....KGGGGGGGYYY', '.....KGGGGGGGGYY', '......KGKKKKKKKK', '......KGKWRRRRRR', '......KGKKWKWKKK', '........KKKKKKKK', '......KKBBBBBBBB', '....KKBBBBBBDBBB', '...KBBBBBBBBKWWW', '..KBBBBBBBBBKWYW', 'KKKKKBBBBBBBKWWW', 'KGNNNKBBBBBBKKKK', '.KKKK.KBBBBBBBBB', '.KK..KBBBBBBDBBB', '.....KBBBBBBBBBB', '.....KBBBBBBBBBB', '....KBBBBBBBBBBB', '....KBBBBBBBBDBB', '...KBBBBBBBBBBBB', '...KDDDDDDDDDDDD', '...KKKKKKKKKKKKK'] },
    wolfking32: { w: 32, pal: { K, D: '#3a3a3a', G: '#6a6a6a', W: '#e8e8e8', R: '#ff3a2a', M: '#2a2a2a' }, rows: ['...K............', '..KGK...........', '..KGGK..........', '..KGDGK.........', '..KGDDGKKKKKKKKK', '...KGDDGGGGGGGGG', '...KMGGGGGGGGGGG', '..KMMGGGGGGGGGGG', '..KMGGKRRKGGGGGG', '.KMMGKRRRRKGGGGG', '.KMMGGKKKKGGGGWW', 'KMMMGGGGGGGGGWWW', 'KMMMMGGGGGGGWWWW', 'KMMMMMGGGGGGWKKK', '.KMMMMMGGGGGWWKK', '.KMMMMMMGGKKWWWW', '..KMMMMMMKWKKKKK', '..KMMMMMMKWWKWKW', '...KMMMMMMKKKKKK', '...KMMMMMMMMMWWW', '....KMMMMMMMWWWW', '....KDDDDDMMMWWW', '...KDDDDDDDDMMWW', '..KDDKDDDDDDDDMM', '.KDDK.KDDDDDDDDD', 'KWDK..KDDDDDDDDD', 'KWK...KDDDDDDDDD', '.K....KDDDDKKKKK', '......KDDDDK....', '.....KDDDDK.....', '.....KWDWDK.....', '.....KKKKKK.....'] },
    wolfking32_atk: { w: 32, pal: { K, D: '#3a3a3a', G: '#6a6a6a', W: '#e8e8e8', R: '#ff3a2a', M: '#2a2a2a' }, rows: ['...K............', '..KGK...........', '..KGGK..........', '..KGDGK.........', '..KGDDGKKKKKKKKK', '...KGDDGGGGGGGGG', '...KMGGGGGGGGGGG', '..KMMGGGGGGGGGGG', '..KMGGKRRKGGGGGG', '.KMMGKRWWRKGGGGG', '.KMMGGKKKKGGGGWW', 'KMMMGGGGGGGGGWWW', 'KMMMMGGGGGGGWWWW', 'KMMMMMGGGGGGWKKK', '.KMMMMMGGGGGWWKK', '.KMMMMMMGGKKKKKK', '..KMMMMMMKWKRRRR', '..KMMMMMMKWRRRRR', '...KMMMMMMKWKWKW', '...KMMMMMMMKKKKK', '....KMMMMMMMWWWW', '....KDDDDDMMMWWW', '...KDDDDDDDDMMWW', '..KDDKDDDDDDDDMM', '.KDDK.KDDDDDDDDD', 'KWDK..KDDDDDDDDD', 'KWK...KDDDDDDDDD', '.K....KDDDDKKKKK', '......KDDDDK....', '.....KDDDDK.....', '.....KWDWDK.....', '.....KKKKKK.....'] },
    spiderqueen32: { w: 32, pal: { K, H: '#1a1014', S: '#e8c8c0', P: '#7a2a8a', R: '#ff3a5a', B: '#3a1a3a', L: '#8a5a8a', Y: '#ffcc44', V: '#c4294a' }, rows: ['................', '...........KKKKK', '.........KKHHHHH', '........KHHHHHHH', '........KHHSSSSS', '........KHSSSSSS', '........KHSRRSSS', '........KHSSSSSS', '........KHHSSSVV', '.........KHHSSSS', '........KHHHKSSS', '.......KHHKPPPPP', '......KHHKPPPPPP', '.....KSSKPPPPPPP', '....KSSK.KPPPPPP', '...KSK...KPPYPPP', '..KSK...KBBBBBBB', '.KL.K..KBBBBBBBB', 'KL...KKBBYBBBBBB', 'L..KKLBBBBBYBBBB', '..KL.KBBBBBBBBBB', '.KL..KBBYBBBBBYB', 'KL..KLKBBBBBBBBB', 'L..KL..KBBBYBBBB', '..KL...KBBBBBBBB', '.KL...KLKBBBBBBB', 'KL...KL..KBBBBBB', 'L...KL....KKBBBB', '...KL.......KKKK', '..KL............', '.KL.............', 'KL..............'] },
    spiderqueen32_atk: { w: 32, pal: { K, H: '#1a1014', S: '#e8c8c0', P: '#7a2a8a', R: '#ff3a5a', B: '#3a1a3a', L: '#8a5a8a', Y: '#ffcc44', V: '#c4294a' }, rows: ['................', '...........KKKKK', '.........KKHHHHH', '........KHHHHHHH', '........KHHSSSSS', '........KHSSSSSS', '........KHSRRSSS', '........KHSSSSSS', '........KHHSSKVV', '.........KHHSSKK', '........KHHHKSSS', '.......KHHKPPPPP', '......KHHKPPPPPP', '..KKKSSKPPPPPPPP', '.KSSKK..KPPPPPPP', 'KSK.....KPPYPPPP', 'KK......KBBBBBBB', '.KL.K..KBBBBBBBB', 'KL...KKBBYBBBBBB', 'L..KKLBBBBBYBBBB', '..KL.KBBBBBBBBBB', '.KL..KBBYBBBBBYB', 'KL..KLKBBBBBBBBB', 'L..KL..KBBBYBBBB', '..KL...KBBBBBBBB', '.KL...KLKBBBBBBB', 'KL...KL..KBBBBBB', 'L...KL....KKBBBB', '...KL.......KKKK', '..KL............', '.KL.............', 'KL..............'] },
    magmagolem32: { w: 32, pal: { K, D: '#3a2a24', S: '#5a4a40', O: '#ff6a1a', Y: '#ffd23a', R: '#c42a0a' }, rows: ['................', '................', '..........KKKKKK', '........KKSSSSSS', '.......KSSDSSSSS', '.......KSDDSSSSS', '......KSSSKKSSSS', '......KSSKYOKSSS', '......KSSSKKSSSS', '......KDSSSSSOSS', '.......KDSSOOOOO', '....KKKKKDSSSSSS', '..KKSSSSSKKKKKKK', '.KSSDSSOSSSSSSSS', 'KSSDDSSSOSSSKKKK', 'KSDDSSSSSOSSKRRR', 'KSSDSKSSSSOSKROY', 'KSSSKKSSSSSOKROY', 'KDSSK.KSSSSSKRRR', 'KOSK..KSSSSSSKKK', 'KOOK..KSSOSSSSSS', 'KOOOK.KSSSOSSSSS', '.KKK..KDSSSOSSSS', '......KDDSSSSSSS', '......KKDDKKKKKK', '.....KSSSK......', '.....KSOSK......', '....KSSOSK......', '....KSSSSK......', '...KSSSOSSK.....', '...KDDDDDDK.....', '...KKKKKKKK.....'] },
    magmagolem32_atk: { w: 32, pal: { K, D: '#3a2a24', S: '#5a4a40', O: '#ff6a1a', Y: '#ffd23a', R: '#c42a0a' }, rows: ['................', '................', '..........KKKKKK', '........KKSSSSSS', '.......KSSDSSSSS', '.......KSDDSSSSS', '......KSSSKKSSSS', '......KSSKYYKSSS', '......KSSSKKSSSS', '......KDSSSSSOSS', '.......KDSSYYYYY', '....KKKKKDSSSSSS', 'KKKKSSSSSKKKKKKK', 'KOOKDSSOSSSSSSSS', 'KOOKDSSSOSSSKKKK', '.KKKSSSSSOSSKRRR', 'KSSDSKSSSSOSKROY', 'KSSSKKSSSSSOKROY', 'KDSSK.KSSSSSKRRR', '.KSK..KSSSSSSKKK', '..KSK.KSSOSSSSSS', '...KK.KSSSOSSSSS', '.KKK..KDSSSOSSSS', '......KDDSSSSSSS', '......KKDDKKKKKK', '.....KSSSK......', '.....KSOSK......', '....KSSOSK......', '....KSSSSK......', '...KSSSOSSK.....', '...KDDDDDDK.....', '...KKKKKKKK.....'] },
    // ---------- 第 5–7 章新妖物、首领大图（art/mons57.py 生成） ----------
    snakewoman: { pal: { K, H: '#1a3a1a', S: '#c8e0b0', G: '#3a8a3a', L: '#7ac84a', R: '#ffd23a', V: '#c4294a' }, rows: ['....KKKKKKKK....', '...KHHHHHHHHK...', '..KHHSSSSSSHHK..', '..KHSRSSSSRSHK..', '..KHSSSSSSSSHK..', '..KHHSSVVSSHHK..', '...KHKSSSSKHK...', '..KSKGGGGGGKSK..', '.KSK.KGLLGK.KSK.', '.KK..KGGGGK..KK.', '.....KGLLGK.....', '....KGGGGGGK....', '...KGLGGGGLGK...', '..KGGGKKKKGGGK..', '.KGLGK....KGLGK.', '.KKKK......KKKK.'] },
    snakewoman_atk: { pal: { K, H: '#1a3a1a', S: '#c8e0b0', G: '#3a8a3a', L: '#7ac84a', R: '#ffd23a', V: '#c4294a' }, rows: ['....KKKKKKKK....', '...KHHHHHHHHK...', '..KHHSSSSSSHHK..', '..KHSRRSSRRSHK..', '..KHSSSSSSSSHK..', '..KHHSKVVKSHHK..', '...KHKSVVSKHK...', 'KSKKKGGGGGGKKKSK', 'KSK..KGLLGK..KSK', '.KK..KGGGGK..KK.', '.....KGLLGK.....', '....KGGGGGGK....', '...KGLGGGGLGK...', '..KGGGKKKKGGGK..', '.KGLGK....KGLGK.', '.KKKK......KKKK.'] },
    croc: { pal: { K, G: '#3a5a2a', D: '#2a3a1a', Y: '#ffd23a', W: '#f0e8d8', B: '#8a9a5a' }, rows: ['................', '................', '................', '................', '........KK.K.K..', '....KKKKGDKDKDK.', '..KKGGGYGGGGGGDK', 'KKGGGGGGGGGGGGGK', 'KWKWKWGGGGGGGGGK', 'KGGGGGGGBBBBGGK.', '.KKKKKKKBBBBBKK.', '......KGK..KGK..', '.....KGK...KGK..', '.....KK....KK...', '................', '................'] },
    croc_atk: { pal: { K, G: '#3a5a2a', D: '#2a3a1a', Y: '#ffd23a', W: '#f0e8d8', B: '#8a9a5a' }, rows: ['................', '................', '................', '................', '........KK.K.K..', 'KK..KKKKGDKDKDK.', 'KGKKGGGYGGGGGGDK', 'KWKWKWGGGGGGGGGK', '......KGGGGGGGGK', 'KWKWKWGGBBBBGGK.', 'KKKKKKKKBBBBBKK.', '......KGK..KGK..', '.....KGK...KGK..', '.....KK....KK...', '................', '................'] },
    swampcorpse: { pal: { K, G: '#6a8a4a', D: '#3a5a2a', W: '#2a4a1a', R: '#ff3a2a', M: '#4a3a2a' }, rows: ['........', '....KKKK', '...KWGWG', '..KGGGGG', '..KGRGGG', '..KGGGKK', '...KWGGG', '.KKGGGGG', 'KGGKGDGG', 'KGWKGGGD', '.KW.KGGG', '..W.KGDG', '....KGGG', '...KMMKK', '...KMK..', '..KKKK..'] },
    swampcorpse_atk: { pal: { K, G: '#6a8a4a', D: '#3a5a2a', W: '#2a4a1a', R: '#ff3a2a', M: '#4a3a2a' }, rows: ['........', '....KKKK', '...KWGWG', '..KGGGGG', '..KGRRGG', '..KGGKRR', '...KWGGG', 'KKKGGGGG', 'KGGKGDGG', '.KKKGGGD', '..W.KGGG', '..W.KGDG', '....KGGG', '...KMMKK', '...KMK..', '..KKKK..'] },
    mosquito: { pal: { K, B: '#3a3a2a', R: '#c43a2a', W: '#c8d8e8' }, rows: ['................', '................', '................', '.........W.W....', '.........WWW....', '..W.W...KKBRK...', '..WWW....K.K....', '.KKBRK..........', '..K.K...........', '................', '.......W.W......', '.......WWW..W.W.', '......KKBRK.WWW.', '.......K.K.KKBRK', '............K.K.', '................'] },
    mosquito_atk: { pal: { K, B: '#3a3a2a', R: '#c43a2a', W: '#c8d8e8' }, rows: ['................', '................', '................', '........W...W...', '.........WWW....', '.W...W..KKBRK...', '..WWW....K.K....', '.KKBRK..........', '..K.K...........', '................', '......W...W.....', '.......WWW.W...W', '......KKBRK..WWW', '.......K.K.KKBRK', '............K.K.', '................'] },
    waterghost: { pal: { K, H: '#1a2a2a', C: '#5a8a8a', W: '#9ad8e8', R: '#ff3a2a' }, rows: ['....KKKK', '...KHHHH', '..KHHHHH', '..KHHHHH', '..KHHHRH', '..KHHHHH', '.KHHCHHH', '.KHCCCHH', 'KHHCCCCH', 'KHKCCCCC', 'KH.KCCCC', 'W..KCCCC', '...KCCWC', '..KCCCCC', '.KCWCCWC', '.KK.KK.K'] },
    waterghost_atk: { pal: { K, H: '#1a2a2a', C: '#5a8a8a', W: '#9ad8e8', R: '#ff3a2a' }, rows: ['....KKKK', '...KHHHH', '..KHHHHH', '..KHHKKH', '..KHHKRK', '..KHHKKH', '.KHHCHHH', '.KHCCCHH', 'KHKCCCCH', 'KWKCCCCC', 'W..KCCCC', '.W.KCCCC', '...KCCWC', '..KCCCCC', '.KCWCCWC', '.KK.KK.K'] },
    wasps: { pal: { K, Y: '#e8c41a', R: '#c43a2a', W: '#d8e8f0' }, rows: ['................', '................', '...WW...........', '..WWWW.....WW...', '.KKYKYK...WWWW..', 'KRKYKYKK.KKYKYK.', '.KKYKYK.KRKYKYKK', '..K..K...KKYKYK.', '.........K..K...', '................', '.....WW.........', '....WWWW........', '...KKYKYK.......', '..KRKYKYKK......', '...KKYKYK.......', '....K..K........'] },
    wasps_atk: { pal: { K, Y: '#e8c41a', R: '#c43a2a', W: '#d8e8f0' }, rows: ['................', '................', '..W..W..........', '.W....W....W..W.', '.KKYKYK...WWWW..', 'KRKYKYKK.KKYKYK.', '.KKYKYK.KRKYKYKK', '..K..K...KKYKYK.', '.........K..K...', '................', '....W..W........', '...W....W.......', '...KKYKYK.......', '..KRKYKYKK......', '...KKYKYK.......', '....K..K........'] },
    toadking: { pal: { K, G: '#5a7a2a', L: '#8aa84a', Y: '#ffd23a', W: '#a8c86a', R: '#c4294a' }, rows: ['........', '..KKK...', '.KYYK...', '.KYKK.KK', 'KGGGKKGG', 'KGWGGGGG', 'KGGGGGGG', 'KRRRRRRR', '.KGGGGGG', 'KGGKLLLL', 'KGKLLWLL', 'KGKLLLLL', '.KGKLLLL', 'KGGGKGGG', 'KGWGKKGG', 'KKKK..KK'] },
    toadking_atk: { pal: { K, G: '#5a7a2a', L: '#8aa84a', Y: '#ffd23a', W: '#a8c86a', R: '#c4294a' }, rows: ['........', '..KKK...', '.KYYK...', '.KYYK.KK', 'KGGGKKGG', 'KGWGGGGG', 'KKKKKKKK', 'KRRRRRRR', 'KRRRRRRR', 'KGKRRRWR', 'KGKLRRRR', 'KGKLLLRR', '.KGKLLLL', 'KGGGKGGG', 'KGWGKKGG', 'KKKK..KK'] },
    icesoldier: { pal: { K, M: '#8ab8d8', D: '#4a6a8a', W: '#e8f8ff', R: '#3ad8ff' }, rows: ['........', '.....KKK', '....KMWW', '...KMMMM', '...KMKKK', '...KMRRR', '...KMMMM', '..KWKMMM', '.KWMKMDM', '.KMMKMWM', '.KM.KMMM', '.KM.KMDM', '....KMKK', '....KM.K', '...KKK..', '........'] },
    icesoldier_atk: { pal: { K, M: '#8ab8d8', D: '#4a6a8a', W: '#e8f8ff', R: '#3ad8ff' }, rows: ['........', '.....KKK', '....KMWW', '...KMMMM', '...KMKKK', '...KMWWW', '...KMMMM', '.KKWKMMM', 'KWWMKMDM', '.KMMKMWM', '.KM.KMMM', '.KM.KMDM', '....KMKK', '....KM.K', '...KKK..', '........'] },
    snowwolf: { pal: { K, W: '#e8eef4', G: '#a8b8c8', B: '#3a8aff', R: '#c4294a' }, rows: ['................', '................', '.K..K...........', '.KWKWK..........', 'KWWWWWK.........', 'KBWWWWWKKKKKKK..', 'KWWWWWWWWWWWWWKK', '.KKWWGWWWWWWWWWK', '..KWWWGGWWWWGWK.', '..KWWWWWWWWWWWK.', '...KWWKKKKKWWK..', '...KWK....KWK...', '..KWK.....KWK...', '..KGK....KGK....', '..KK.....KK.....', '................'] },
    snowwolf_atk: { pal: { K, W: '#e8eef4', G: '#a8b8c8', B: '#3a8aff', R: '#c4294a' }, rows: ['................', '................', '.K..K...........', '.KWKWK..........', 'KWWWWWK.........', 'KBWWWWWKKKKKKK..', 'KKKWWWWWWWWWWWKK', 'KRRKWGWWWWWWWWWK', '.KKWWWGGWWWWGWK.', '..KWWWWWWWWWWWK.', '...KWWKKKKKWWK..', '..KWK......KWK..', '.KWK........KWK.', '.KGK........KGK.', '.KK..........KK.', '................'] },
    iceshard: { pal: { K, C: '#9ae8ff', W: '#ffffff', B: '#4a8ac8' }, rows: ['.......K', '......KW', '.....KWC', '....KWCC', '...KWCCC', '..KWCCBC', '..KCCKWC', '..KCCKKC', '..KCCCCB', '...KCCBB', '....KCBB', '.....KBB', '......KB', '.......K', '........', '........'] },
    iceshard_atk: { pal: { K, C: '#9ae8ff', W: '#ffffff', B: '#4a8ac8' }, rows: ['.......K', '......KW', '.....KWC', '....KWCC', 'K..KWCCC', '.KKWCCBC', '..KCWWWC', '..KCWWWC', 'K.KCCCCB', '.K.KCCBB', '....KCBB', '.....KBB', '......KB', '.......K', '........', '........'] },
    yeti: { pal: { K, W: '#e8eef4', G: '#a8b8c8', B: '#3a8aff', R: '#c4294a' }, rows: ['....KKKK', '...KWWWW', '..KWWWWW', '..KWGBGW', '..KWWWWW', '..KWGKKK', '.KKWWWWW', 'KWWKWWWW', 'KWWKWWGW', 'KWWKWWWW', 'KGWKWGWW', '.KK.KWWW', '....KWWW', '...KWWKK', '...KWWK.', '...KKKK.'] },
    yeti_atk: { pal: { K, W: '#e8eef4', G: '#a8b8c8', B: '#3a8aff', R: '#c4294a' }, rows: ['KK..KKKK', 'KWK.KWWW', 'KWKKWWWW', 'KWKWGBGW', '..KWWWWW', '..KWKRRR', '..KKWWWW', '...KWWWW', '...KWWGW', '...KWWWW', '...KWGWW', '....KWWW', '....KWWW', '...KWWKK', '...KWWK.', '...KKKK.'] },
    icesilkworm: { pal: { K, W: '#e8f4ff', C: '#9ad0ee', B: '#3a6aa8' }, rows: ['................', '................', '................', '................', '................', '................', '...KKK..KKK.....', '..KWWWKKWWWKKK..', '.KWBWWKWWWWKWWK.', 'KWWWWWKWWCWKWWWK', 'KWWCWWKWWWWKWCWK', '.KWWWKKWWWKKWWK.', '..KKK..KKK..KK..', '................', '................', '................'] },
    icesilkworm_atk: { pal: { K, W: '#e8f4ff', C: '#9ad0ee', B: '#3a6aa8' }, rows: ['................', '................', '................', '................', '................', '..KKK...........', '.KWWWK..KKK.....', 'KWBWWWKKWWWKKK..', 'KWWWWWKWWWWKWWK.', 'KWWWWWKWWCWKWWWK', 'KWWCWWKWWWWKWCWK', '.KWWWKKWWWKKWWK.', '..KKK..KKK..KK..', '................', '................', '................'] },
    snowape: { pal: { K, W: '#e8eef4', G: '#b8c8d8', F: '#7a9ac8', R: '#ff3a2a' }, rows: ['....KKKK', '...KWWWW', '..KWWWWW', '..KWKFFF', '.KWWFRFF', '.KWWFFKK', '..KWKFFF', '.KKWWKKK', 'KWWWWWWW', 'KWGKWWWW', 'KWGKWGWW', 'KWK.KWWW', 'KG..KWWW', '....KWWK', '...KWWK.', '...KKKK.'] },
    snowape_atk: { pal: { K, W: '#e8eef4', G: '#b8c8d8', F: '#7a9ac8', R: '#ff3a2a' }, rows: ['KK..KKKK', 'KWK.KWWW', 'KWKKWWWW', 'KGKWKFFF', '.KWWFRFF', '.KWWFKRR', '..KWKFFF', '..KWWKKK', '..KWWWWW', '...KWWWW', '...KWGWW', '....KWWW', '....KWWW', '....KWWK', '...KWWK.', '...KKKK.'] },
    crystalgolem: { pal: { K, C: '#7ad0ff', W: '#e8f8ff', B: '#3a7ab8', Y: '#ffffff' }, rows: ['......KK', '.....KWC', '....KWCC', '...KCBCC', '...KCKBC', '....KCCC', '..KKKKCC', '.KWCKBCW', 'KWCCKCWY', 'KCCBKCYY', '.KCK.KCC', '..K..KCB', '.....KCC', '....KCBK', '...KCCK.', '...KKKK.'] },
    crystalgolem_atk: { pal: { K, C: '#7ad0ff', W: '#e8f8ff', B: '#3a7ab8', Y: '#ffffff' }, rows: ['......KK', '.....KWC', '....KWCC', '...KCBCC', '...KCYBC', '....KCCC', '..KKKKCC', 'KWCCKBCW', 'KWCCKCYY', 'KCCBKYYY', 'KCCK.KCC', '.KK..KCB', '.....KCC', '....KCBK', '...KCCK.', '...KKKK.'] },
    oxhead: { pal: { K, B: '#3a2a2a', H: '#e8e0c8', F: '#5a3a2a', R: '#ff3a2a', Y: '#e8c83a', C: '#8a8a8a' }, rows: ['KH......', 'KHH.....', '.KHHKKKK', '..KKFFFF', '..KFRFFF', '..KFFFFF', '...KFFYY', '...KKYKK', '..KKBBBB', '.KBKBCBB', 'KBBKBBCB', 'KFK.KBBC', '....KBBB', '....KBKK', '....KB.K', '...KKK..'] },
    oxhead_atk: { pal: { K, B: '#3a2a2a', H: '#e8e0c8', F: '#5a3a2a', R: '#ff3a2a', Y: '#e8c83a', C: '#8a8a8a' }, rows: ['KH......', 'KHH.....', '.KHHKKKK', '..KKFFFF', '..KFRRFF', '..KFFKKF', '...KFRRY', '...KKYKK', '..KKBBBB', '.KBKBCBB', 'KBBKBBCB', 'KFK.KBBC', '....KBBB', '....KBKK', '....KB.K', '...KKK..'] },
    horseface: { pal: { K, B: '#2a2a3a', F: '#6a4a2a', M: '#1a1a1a', R: '#ff3a2a', W: '#f0e8d8' }, rows: ['.....KK.', '....KFK.', '....KFKK', '...KMFFF', '...KMFRF', '...KMFFF', '...KMFFF', '....KFFF', '....KFFF', '....KFKF', '...KKWWW', '..KBKKKK', '.KBBBBBB', '.KBKBBBB', '..K.KBKK', '...KKK.K'] },
    horseface_atk: { pal: { K, B: '#2a2a3a', F: '#6a4a2a', M: '#1a1a1a', R: '#ff3a2a', W: '#f0e8d8' }, rows: ['.....KK.', '....KFK.', '....KFKK', '...KMFFF', '...KMFRR', '...KMFFF', '...KMFFF', '....KFFF', '....KFFF', '....KFKK', '...KKWKW', '..KBKWKW', '.KBBKKKK', '.KBKBBBB', '..K.KBKK', '...KKK.K'] },
    hanged: { pal: { K, W: '#e8e8f0', H: '#1a1a1a', R: '#c4294a', S: '#d8e0e8', N: '#8a7a5a' }, rows: ['.......N', '.......N', '....KKKN', '...KHHHH', '..KHHSSS', '..KHSKSS', '..KHSSSS', '..KHHSKR', '..KHHKWR', '.KHHKWWR', '.KHKWWWR', 'KHKWWWWK', 'KK.KWWWW', '...KWWWW', '..KWWKWW', '..KK.K.K'] },
    hanged_atk: { pal: { K, W: '#e8e8f0', H: '#1a1a1a', R: '#c4294a', S: '#d8e0e8', N: '#8a7a5a' }, rows: ['.......N', '.......N', '....KKKN', '...KHHHH', '..KHHSSS', '..KHSRSS', '..KHSSSS', '..KHHSKR', '..KHHKWR', 'KKHHKWWR', 'KHHKWWWR', 'KHKWWWWR', 'KK.KWWWR', '...KWWWK', '..KWWKWW', '..KK.K.K'] },
    baiwuchang: { pal: { K, W: '#f0f0f0', G: '#c8c8d0', S: '#e0e4e8', R: '#c4294a' }, rows: ['....KKKK', '....KWWW', '....KWKW', '....KWWK', '...KWWWW', '...KWKWW', '..KKKKKK', '...KSSSS', '...KSKSS', '...KSSSR', '..KKKKKR', '.KGWWKWR', 'KWWKWWWR', 'KS.KWWWW', '...KWWWW', '...KKKKK'] },
    baiwuchang_atk: { pal: { K, W: '#f0f0f0', G: '#c8c8d0', S: '#e0e4e8', R: '#c4294a' }, rows: ['....KKKK', '....KWWW', '....KWKW', '....KWWK', '...KWWWW', '...KWKWW', '..KKKKKK', '...KSSSS', '...KSRSS', '...KSSSR', '..KKKKKR', 'KKGWWKWR', 'KSWKWWWR', 'KS.KWWWR', '...KWWWK', '...KKKKK'] },
    painted: { pal: { K, H: '#1a1014', S: '#f2d0c0', W: '#e8e0c8', R: '#c4294a', P: '#c44a6a', E: '#ff3a2a' }, rows: ['....KKKKKKKK....', '...KHHHHHHHHK...', '..KHHSSSSWWWHK..', '..KHSSSSWWWWHK..', '..KHSKSSWKKWHK..', '..KHSSSSWKEWHK..', '..KHSSRSWWWWHK..', '..KHHSSSKWKWHK..', '.KHHHKSSWWWKHHK.', '.KHHKPPPPPPPKHK.', 'KHHKPPPPPPPPPKHK', 'KHK.KPPPPPPPPK.K', 'KK..KPPPPPPPPK..', '....KPPPPPPPPK..', '...KPPPPPPPPPPK.', '...KKKKKKKKKKKK.'] },
    painted_atk: { pal: { K, H: '#1a1014', S: '#f2d0c0', W: '#e8e0c8', R: '#c4294a', P: '#c44a6a', E: '#ff3a2a' }, rows: ['....KKKKKKKK....', '...KHHHHHHHHK...', '..KHHSSWWWWWHK..', '..KHSSWWWWWWHK..', '..KHSKWKKWKKHK..', '..KHSSWKEKEKHK..', '..KHSRWWWWWWHK..', '..KHHSKWKWKWHK..', '.KHHHKSSWWWKHHK.', '.KHHKPPPPPPPKHK.', 'KHHKPPPPPPPPPKHK', 'KHK.KPPPPPPPPK.K', 'KK..KPPPPPPPPK..', '....KPPPPPPPPK..', '...KPPPPPPPPPPK.', '...KKKKKKKKKKKK.'] },
    gamblerskull: { pal: { K, W: '#e8e0c8', R: '#ff3a2a', Y: '#e8c83a', B: '#3a3a5a', D: '#ffffff' }, rows: ['....KKKKKKK.....', '...KBBBBBBBK....', '..KKKKKKKKKKK...', '...KWWWWWWWK....', '...KWKRWKRWK....', '...KWWWKWWWK....', '....KWKWKWK.....', '.....KKKKK......', '...KKBBWBBKK....', '..KWKBBWBBKWK...', '.KWK.KBWBK.KWKK.', '.KDDK.KWK..KYYK.', '.KDKK.KWK...KK..', '..KK.KWKWK......', '....KWK.KWK.....', '....KK...KK.....'] },
    gamblerskull_atk: { pal: { K, W: '#e8e0c8', R: '#ff3a2a', Y: '#e8c83a', B: '#3a3a5a', D: '#ffffff' }, rows: ['....KKKKKKK.....', '...KBBBBBBBK....', '..KKKKKKKKKKK...', '...KWWWWWWWK....', '...KWKRWKRWK....', '...KWWWKWWWK....', '....KWKWKWK.....', '.....KKKKK......', '...KKBBWBBKK....', '.KKWKBBWBBKWK...', 'KDDKKKBWBK.KWKK.', 'KDKK..KWK..KYYK.', '.KK...KWK...KK..', '..KK.KWKWK......', '....KWK.KWK.....', '....KK...KK.....'] },
    snakemother32: { w: 32, pal: { K, G: '#2a6a3a', L: '#5aa84a', Y: '#ffd23a', B: '#c8d88a', R: '#c4294a', W: '#f0e8d8' }, rows: ['................', '................', '..........KKKKKK', '........KKGGGGGG', '......KKGGLLLGGG', '.....KGGLLGGGLLG', '....KGGLGGGYYGGL', '...KGGLGGGYKKYGG', '...KGLGGGGYKKYGG', '..KGGLGGGGGYYGGG', '..KGLGGGGGKYYKGG', '..KGGLGGGGKYKKGG', '..KGGGLGGGGKGGGG', '...KGGLGGGGGKRRR', '...KGGGLGGGKWRRR', '....KGGGLGGKWKRR', '.....KGGGLGGKKKK', '......KKGGGLBBBB', '........KGGGBBBB', '........KGGLBBBB', '.......KGGGLBBBB', '......KGGGLGBBBB', '....KKGGGLGGGBBB', '..KKGGGLGGGGGGGG', '.KGGLGGGGGGLLLLG', 'KGGLGGKKKKKGGGGG', 'KGLGGK.....KGGGL', 'KGGLGGKKKKKGGGLG', '.KGGGLLLGGGGLLGG', '..KKGGGGGGGGGGGG', '....KKKKKKKKKKKK', '................'] },
    snakemother32_atk: { w: 32, pal: { K, G: '#2a6a3a', L: '#5aa84a', Y: '#ffd23a', B: '#c8d88a', R: '#c4294a', W: '#f0e8d8' }, rows: ['................', '................', '..........KKKKKK', '........KKGGGGGG', '......KKGGLLLGGG', '.....KGGLLGGGLLG', '....KGGLGGGYYGGL', '...KGGLGGGYKKYGG', '...KGLGGGGYKKYGG', '..KGGLGGGGGYYGGG', '..KGLGGGGGKYYKGG', '..KGGLGGGGKYYKGG', '..KGGGLGGGGKGGGG', '...KGGLGGGGKKKKK', '...KGGGLGGKWRRRR', '....KGGGLGKWKRRR', '.....KGGGLGKWKRR', '......KKGGGLKKKK', '........KGGGBBBB', '........KGGLBBBB', '.......KGGGLBBBB', '......KGGGLGBBBB', '....KKGGGLGGGBBB', '..KKGGGLGGGGGGGG', '.KGGLGGGGGGLLLLG', 'KGGLGGKKKKKGGGGG', 'KGLGGK.....KGGGL', 'KGGLGGKKKKKGGGLG', '.KGGGLLLGGGGLLGG', '..KKGGGGGGGGGGGG', '....KKKKKKKKKKKK', '................'] },
    xuanbing32: { w: 32, pal: { K, M: '#a8e0ff', D: '#4a7aa8', W: '#f4fbff', S: '#e8d8c8', H: '#e8eef8', B: '#3a5a8a', E: '#3ad8ff' }, rows: ['................', '...........KKKKK', '.........KKHHHHH', '........KHHHHHHH', '.......KHHHMMMMM', '.......KHHMWMMWM', '.......KHHSSSSSS', '.......KHSSKESSS', '.......KHSSSSSSS', '.......KHHSSSSKK', '........KHHSSSSS', '......KKKHHKKKKK', '....KKMMMKBBBBBB', '...KMWMMMKBBWBBB', '..KMMMMMKBBBWBBB', '..KMMDMKBBBBWBBB', '..KKKKKBBBBBBWWW', '..KSK.KBBBDBBBBB', '..KSK.KBBBBDBBBB', '..KMK.KBBBBBBBBB', '...K..KMMMMMMMMM', '......KBBBBBBWBB', '.....KBBBBBBBBBB', '.....KBBBDBBBBBB', '....KBBBBBBBBBBB', '....KBBBBBDBBBBB', '...KBBBBBBBBBBBB', '...KMMMMMMMMMMMM', '...KWWMWWMWWMWWM', '....KKKKKKKKKKKK', '................', '................'] },
    xuanbing32_atk: { w: 32, pal: { K, M: '#a8e0ff', D: '#4a7aa8', W: '#f4fbff', S: '#e8d8c8', H: '#e8eef8', B: '#3a5a8a', E: '#3ad8ff' }, rows: ['................', '...........KKKKK', '.........KKHHHHH', '........KHHHHHHH', '.......KHHHMMMMM', '.......KHHMWMMWM', '.......KHHSSSSSS', '.......KHSSKEESS', '.......KHSSSSSSS', '.......KHHSSSKKK', '........KHHSSSSS', '......KKKHHKKKKK', '....KKMMMKBBBBBB', '...KMWMMMKBBWBBB', '..KMMMMMKBBBWBBB', '..KMMDMKBBBBWBBB', '..KKKKKBBBBBBWWW', '.KSK..KBBBDBBBBB', 'KSK...KBBBBDBBBB', 'KMK...KBBBBBBBBB', '.K....KMMMMMMMMM', '......KBBBBBBWBB', '.....KBBBBBBBBBB', '.....KBBBDBBBBBB', '....KBBBBBBBBBBB', '....KBBBBBDBBBBB', '...KBBBBBBBBBBBB', '...KMMMMMMMMMMMM', '...KWWMWWMWWMWWM', '....KKKKKKKKKKKK', '................', '................'] },
    guiwang32: { w: 32, pal: { K, P: '#3a1a6a', D: '#24104a', V: '#7a4ac8', Y: '#ffd23a', G: '#a0f0ff', S: '#5a4a8a', W: '#f0e8d8' }, rows: ['..............KY', '....K.......KYYY', '...KVK.....KYKYY', '...KVVK...KYYYYY', '....KVVKKKYYYYYY', '.....KVVSSSSSSSS', '......KSSSSSSSSS', '.....KSSKGGKSSSS', '.....KSSKGGKSSSS', '.....KSSSSSSSSKK', '......KSSSKWKWKW', '.......KSSSSKKKK', '.....KKKKSSSSSSS', '...KKPPPPKKKKKKK', '..KPPPVPPPPPPDPP', '.KPPPVPPPPPPDPPP', '.KPPVPPKPPPPPDPP', 'KPPVPPKKPPPPPPDP', 'KPVPPK.KPPPPPPPD', 'KSSK...KPPPYPPPP', 'KSWK...KPPPPYPPP', '.KK....KPPPPPYPP', '.......KPPPPPPPP', '......KPPPDPPPPP', '......KPPPPDPPPP', '.....KPPPPPPDPPP', '.....KPPPPPPPPPP', '....KPPVPPPVPPPV', '....KVPPVPPPVPPP', '...KV.KV.KV.KV.K', '...V...V...V...V', '................'] },
    guiwang32_atk: { w: 32, pal: { K, P: '#3a1a6a', D: '#24104a', V: '#7a4ac8', Y: '#ffd23a', G: '#a0f0ff', S: '#5a4a8a', W: '#f0e8d8' }, rows: ['..............KY', '....K.......KYYY', '...KVK.....KYKYY', '...KVVK...KYYYYY', '....KVVKKKYYYYYY', '.....KVVSSSSSSSS', '......KSSSSSSSSS', '.....KSSKGWKSSSS', '.....KSSKWGKSSSS', '.....KSSSSSSSSKK', '......KSSKWKWKWK', '.......KSKRRRRRR', '.....KKKKSSSSSSS', '...KKPPPPKKKKKKK', '..KPPPVPPPPPPDPP', '.KPPPVPPPPPPDPPP', '.KPPVPPKPPPPPDPP', 'KPPVPPKKPPPPPPDP', '.KPPPK.KPPPPPPPD', '..KSSK.KPPPYPPPP', '..KSWK.KPPPPYPPP', '...KK..KPPPPPYPP', '.......KPPPPPPPP', '......KPPPDPPPPP', '......KPPPPDPPPP', '.....KPPPPPPDPPP', '.....KPPPPPPPPPP', '....KPPVPPPVPPPV', '....KVPPVPPPVPPP', '...KV.KV.KV.KV.K', '...V...V...V...V', '................'] },
    // ---------- 兵器（拿在手里、跟着出招转；斜放，握把在左下） ----------
    w_dao: { pal: { K, W: '#f4f0e8', M: '#a8acb8', Y: '#e8b830', F: '#6a3a1a', R: '#c4291f' }, rows: [
      '............KKK.', '...........KWWMK', '..........KWWMMK', '.........KWWMMK.', '........KWWMMK..', '.......KWWMMK...', '......KWWMMK....', '.....KWWMMK.....',
      '....KWWMMK......', '...KYKMMK.......', '..KYYYKK........', '...KFYK.........', '..KFFK..........', '.KFFK...........', '.KRK............', 'RR.R............'] },
    w_jian: { pal: { K, O: '#d08040', F: '#7a3a1a', Y: '#e8b830', R: '#c4291f' }, rows: [
      '..............KK', '.............KOK', '............KOFK', '...........KOFK.', '..........KOFK..', '.........KOFK...', '........KOFK....', '.......KOFK.....',
      '......KOFK......', '...KK.KFK.......', '...KYKFK........', '....KYK.........', '...KFKYK........', '..KFK..K........', '.KFK............', '.RR.............'] },
    w_ling: { pal: { K, Y: '#e8b830', W: '#fff4c0', F: '#6a3a1a', R: '#c4291f' }, rows: [
      '..........KKKK..', '.........KYYWYK.', '.........KYYYYK.', '........KYYYYYYK', '........KKKKKKKK', '..........KRK...', '.........KFK....', '........KFKR....',
      '.......KFK.RR...', '......KFK.......', '.....KFK........', '....KFK.........', '...KFK..........', '..KFK...........', '.KFK............', '.KK.............'] },
    w_bishou: { pal: { K, W: '#f4f0e8', M: '#a8acb8', Y: '#e8b830', N: '#2a2430' }, rows: [
      '................', '................', '................', '................', '..........KK....', '.........KWMK...', '........KWMK....', '.......KWMK.....',
      '......KWMK......', '....KKKMK.......', '....KYYKK.......', '.....KYK........', '....KNK.K.......', '...KNK..........', '...KK...........', '................'] },
    w_zhang: { pal: { K, Y: '#e8b830', F: '#7a4a1a', M: '#c9a45c' }, rows: [
      '...........KKKK.', '..........KY..YK', '..........KY..YK', '...........KYYK.', '...........KFK..', '..........KFK...', '.........KFK....', '........KFK.....',
      '.......KFK......', '......KFK.......', '.....KFK........', '....KFK.........', '...KFK..........', '..KFK...........', '.KMK............', '.KK.............'] },
    w_qiang: { pal: { K, W: '#f4f0e8', M: '#a8acb8', R: '#c4291f', F: '#5a3a1a' }, rows: [
      '.............KK.', '............KWMK', '...........KWMK.', '..........KMMK..', '.........KRRK...', '........KRFK....', '.......KFK......', '......KFK.......',
      '.....KFK........', '....KFK.........', '...KFK..........', '..KFK...........', '.KFK............', 'KFK.............', 'KK..............', '................'] },
    w_bi: { pal: { K, B: '#1a1a1a', W: '#f4f0e8', F: '#8a5a2a' }, rows: [
      '................', '................', '............KK..', '...........KBBK.', '..........KBBK..', '.........KWWK...', '........KFFK....', '.......KFFK.....',
      '......KFFK......', '.....KFFK.......', '....KFFK........', '...KFFK.........', '..KFFK..........', '..KKK...........', '................', '................'] },
    stall: { pal: { K, R: '#a02a1a', W: '#e8d8b0', B: '#5a3a1a', Y: '#ffb04a' }, rows: [
      'KKKKKKKK', 'KRRWWRRW', 'KRRWWRRW', 'KKKKKKKK', '.K......', '.K..Y...', '.K.KYK..', '.K..K...', '.K......', 'KKKKKKKK', 'KBBBBBBB', 'KBWWBBWW', 'KBBBBBBB', 'KBBBBBBB', 'KK....KK', '........'] },
  };
  const RAR_COL = { normal: '#b0aca4', magic: '#6b78ff', rare: '#e8c840', set: '#3cc850', legend: '#e88a30' };
  const cache = {};
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  function grid(t) {
    const w = t.w || 16;
    return t.rows.map(r => r.length === w / 2 ? r + [...r].reverse().join('') : (r + '.'.repeat(w)).slice(0, w));
  }
  // ======== 高清渲染：16 格原图 → 32 格（EPX 平滑斜边）+ 自动明暗（光从左上来）+ 内描边柔化 ========
  const HD = 2, OUTL = 'K';
  const hexRgb = h => { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mixc = (a, b, k) => { const A = hexRgb(a), B2 = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B2[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const lum = c => { const [r, g2, b] = hexRgb(c); return (0.299 * r + 0.587 * g2 + 0.114 * b) / 255; };
  const toneCache = {};
  function tones(c) {
    if (toneCache[c]) return toneCache[c];
    const L = lum(c);
    return (toneCache[c] = { hi: mixc(c, '#fff3d6', L < 0.15 ? 0.2 : L > 0.75 ? 0.45 : 0.3), lo: mixc(c, '#1c0c18', L < 0.15 ? 0.25 : 0.34), lo2: mixc(c, '#12060e', 0.5), ln: mixc(c, '#140d0b', 0.62) });
  }
  function epx(g) {
    const H = g.length, W = g[0].length, o = Array.from({ length: H * 2 }, () => Array(W * 2).fill('.'));
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '.' : g[y][x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const P = at(x, y), A2 = at(x, y - 1), B2 = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
      let e0 = P, e1 = P, e2 = P, e3 = P;
      if (C === A2 && C !== D && A2 !== B2) e0 = A2;
      if (A2 === B2 && A2 !== C && B2 !== D) e1 = B2;
      if (D === C && D !== B2 && C !== A2) e2 = C;
      if (B2 === D && B2 !== A2 && D !== C) e3 = D;
      o[2 * y][2 * x] = e0; o[2 * y][2 * x + 1] = e1; o[2 * y + 1][2 * x] = e2; o[2 * y + 1][2 * x + 1] = e3;
    }
    return o;
  }
  // 把字符格子画到画布上：hd=false 时按原样 1:1
  function paint(g0, pal, hd) {
    const g = hd ? epx(g0) : g0, H = g.length, W = g[0].length, c = document.createElement('canvas');
    c.width = W; c.height = H; const x2 = c.getContext('2d');
    if (!hd) { g.forEach((row, y) => row.forEach((ch, x) => { if (ch !== '.' && pal[ch]) { x2.fillStyle = pal[ch]; x2.fillRect(x, y, 1, 1); } })); return c; }
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '.' : g[y][x];
    const solid = ch => ch !== '.' && !!pal[ch];
    // 外描边减到 1 像素：贴着透明的一层，如果里面那层也是描边，就去掉外面这层
    const gg = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== OUTL) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!solid(at(x + dx, y + dy)) && at(x - dx, y - dy) === OUTL) {
          const ix = x - dx * 2, iy = y - dy * 2; if (solid(at(ix, iy)) && at(ix, iy) !== OUTL) { gg[y][x] = '.'; break; }
        }
      }
    }
    const G = gg, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '.' : G[y][x];
    // 连通块：小于等于 8 像素的小点（眼睛、纹样）算细节，不当作明暗的边界
    const comp = new Int32Array(W * H).fill(-1), csz = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (comp[y * W + x] >= 0 || !solid(A(x, y))) continue;
      const ch = A(x, y), id = csz.length, st = [[x, y]]; comp[y * W + x] = id; let n = 0;
      while (st.length) { const [cx, cy] = st.pop(); n++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx; if (comp[k] < 0 && A(nx, ny) === ch) { comp[k] = id; st.push([nx, ny]); } } }
      csz.push(n);
    }
    const innerC = {};
    const inner = cid => { if (cid in innerC) return innerC[cid]; let ok = true;
      for (let i = 0; i < comp.length && ok; i++) if (comp[i] === cid) { const xx = i % W, yy = (i / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const q = A(xx + dx, yy + dy); if (!solid(q)) { ok = false; break; } } }
      return (innerC[cid] = ok); };
    if (g0.mirrored) {   // 左右对称的小人：头部的小点（眼睛、嘴）往前挪一格，像是侧过脸来
      const moved = new Set();
      for (let y = 0; y < Math.round(H * 0.5); y++) for (let x = W - 2; x >= 1; x--) {
        const k = y * W + x, ch = G[y][x]; if (comp[k] < 0 || csz[comp[k]] > 8 || moved.has(comp[k]) || (ch === OUTL && !inner(comp[k]))) continue;
        // 整块往右挪一格：右边必须是同一种底色
        const cid = comp[k], cells = []; for (let yy = 0; yy < Math.round(H * 0.5); yy++) for (let xx = 0; xx < W; xx++) if (comp[yy * W + xx] === cid) cells.push([xx, yy]);
        const under = G[cells[0][1]][cells[0][0] - 1];
        if (!solid(under) || under === OUTL || cells.some(([xx, yy]) => { const q = G[yy][xx + 1]; return q !== ch && q !== under; })) { moved.add(cid); continue; }
        cells.sort((a2, b2) => b2[0] - a2[0]).forEach(([xx, yy]) => { G[yy][xx + 1] = ch; G[yy][xx] = under; comp[yy * W + xx + 1] = cid; comp[yy * W + xx] = -2; });
        moved.add(cid);
      }
      for (let i = 0; i < comp.length; i++) if (comp[i] === -2) { const xx = i % W, yy = (i / W) | 0; const nbr = A(xx - 1, yy); comp[i] = comp[yy * W + xx - 1] >= 0 ? comp[yy * W + xx - 1] : -1; if (nbr) G[yy][xx] = G[yy][xx]; }
    }
    const isDetail = (x, y) => { const k = y * W + x; return x >= 0 && y >= 0 && x < W && y < H && comp[k] >= 0 && csz[comp[k]] <= 8 && (A(x, y) !== OUTL || inner(comp[k])); };
    // 每块颜色里离边界的距离（最多 3）→ 高度 → 朝左上的面亮、朝右下的面暗
    const dist = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = A(x, y); if (!solid(ch) || ch === OUTL) continue;
      let d = 4;
      for (let r = 1; r <= 3 && d === 4; r++) for (let dy = -r; dy <= r && d === 4; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const q = A(x + dx, y + dy); if (q === ch || isDetail(x + dx, y + dy)) continue;
        d = r; break;
      }
      dist[y * W + x] = Math.min(d, 4);
    }
    const H0 = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : dist[y * W + x];
    const id = x2.createImageData(W, H), D = id.data;
    const put = (x, y, col) => { const [r, g2, b] = hexRgb(col), i = (y * W + x) * 4; D[i] = r; D[i + 1] = g2; D[i + 2] = b; D[i + 3] = 255; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = A(x, y); if (!solid(ch)) continue;
      const base = pal[ch];
      if (ch === OUTL) {   // 描边：贴着外面的留深色，夹在两块颜色中间的换成邻色的深一档
        let outer = false; const nb = {};
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const q = A(x + dx, y + dy); if (!solid(q)) outer = true; else if (q !== OUTL) nb[q] = (nb[q] || 0) + 1; }
        if (outer || (comp[y * W + x] >= 0 && csz[comp[y * W + x]] <= 8)) { put(x, y, base); continue; }
        const k = Object.keys(nb).sort((a2, b2) => nb[b2] - nb[a2])[0];
        put(x, y, k ? tones(pal[k]).ln : base); continue;
      }
      const k0 = y * W + x;
      if (csz[comp[k0]] <= 8) { put(x, y, base); continue; }   // 小点保持原色
      const h = dist[k0], hv = (xx, yy) => isDetail(xx, yy) ? h : H0(xx, yy), gx = hv(x + 1, y) - hv(x - 1, y), gy = hv(x, y + 1) - hv(x, y - 1);
      const sh = (gx * 0.45 + gy * 0.75);   // >0：朝左上（亮）；<0：朝右下（暗）
      const T2 = tones(base);
      let col = base;
      if (h <= 1 && sh > 0.4) col = T2.hi;
      else if (h <= 1 && sh < -0.4) col = (gy < 0 && A(x, y + 1) !== ch) ? T2.lo2 : T2.lo;
      else if (h === 2 && sh < -1) col = T2.lo;
      put(x, y, col);
    }
    x2.putImageData(id, 0, 0);
    return c;
  }
  const HD_ON = () => !(typeof SAVE !== 'undefined' && SAVE && SAVE.hdOff);
  function gridOf(name) { const t = T[name]; if (!t) return null; const g = grid(t).map(r => [...r]); g.mirrored = t.rows.some(r => r.length === (t.w || 16) / 2); return g; }
  // 呼吸帧：腰以上整体往下沉一个像素
  const brCache = {};
  function breathUrl(name, over) {
    const key = name + JSON.stringify(over || {}) + HD_ON();
    if (brCache[key]) return brCache[key];
    const c0 = cv(name, over); if (!c0) return '';
    const c = document.createElement('canvas'); c.width = c0.width; c.height = c0.height; const x2 = c.getContext('2d');
    const wy = Math.round(c0.height * 0.56);
    x2.drawImage(c0, 0, wy, c0.width, c0.height - wy, 0, wy, c0.width, c0.height - wy);
    x2.drawImage(c0, 0, 0, c0.width, wy, 0, 1, c0.width, wy);
    return (brCache[key] = c.toDataURL());
  }
  // ======== 首领、稀有精英的动作帧：脚下不动，上身后仰蓄力 / 前扑出招 / 收势 / 挨打后仰；眼睛蓄力时发亮、挨打时闭上 ========
  const monCache = {};
  const MONK = { mw: { sh: 1.3, dy: 1, eye: 'hot' }, atk: { sh: -1.5, dy: -1, eye: 'hot' }, mf: { sh: -0.8, dy: 0, eye: 'hot' }, mh: { sh: 1.5, dy: 0, eye: 'shut' } };
  function monUrl(name, kind, over) {
    const key = name + '|' + kind + JSON.stringify(over || {}) + HD_ON();
    if (monCache[key]) return monCache[key];
    if (typeof document === 'undefined') return '';
    const src = (kind === 'atk' || kind === 'mf') && T[name + '_atk'] ? name + '_atk' : name;
    const g0 = gridOf(src), K0 = MONK[kind]; if (!g0 || !K0) return '';
    const t = T[src], pal = { ...t.pal, ...(over || {}), '!': '#fff2a8' }, H = g0.length, W = g0[0].length, sc = W / 16;
    let g = g0.map(r => r.slice());
    // 眼睛：上半身里的小块，颜色亮或偏红
    const seen = new Set(), lim = Math.round(2 * sc);
    for (let y = 0; y < Math.round(H * 0.62); y++) for (let x = 0; x < W; x++) {
      const ch = g[y][x], k0 = y * W + x; if (ch === '.' || ch === 'K' || seen.has(k0) || !pal[ch]) continue;
      const st = [[x, y]], cells = []; seen.add(k0);
      while (st.length) { const [cx, cy] = st.pop(); cells.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(ny * W + nx) || g[ny][nx] !== ch) continue; seen.add(ny * W + nx); st.push([nx, ny]); } }
      if (cells.length > lim) continue;
      const [r, gg, b] = hexRgb(pal[ch]), L = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
      if (!(L > 0.62 || (r > 150 && r > gg * 1.6))) continue;
      for (const [cx, cy] of cells) g[cy][cx] = K0.eye === 'shut' ? 'K' : '!';
    }
    // 上身压低 / 拉高一格
    const mid = Math.round(H * 0.45);
    if (K0.dy > 0) { g.splice(mid, 1); g.unshift(Array(W).fill('.')); }
    else if (K0.dy < 0 && g[0].every(c => c === '.')) { g.splice(mid, 0, g[mid].slice()); g.shift(); }
    // 前倾 / 后仰：越往上挪得越多，脚下不动（妖物在右边，往左算“往前”）
    const pivot = Math.round(H * 0.7), amt = K0.sh * sc;
    g = g.map((row, y) => { const k = y < pivot ? (pivot - y) / pivot : 0, sh = Math.round(amt * k); if (!sh) return row; const out = Array(W).fill('.'); for (let x = 0; x < W; x++) { const sx = x - sh; if (sx >= 0 && sx < W) out[x] = row[sx]; } return out; });
    g.mirrored = g0.mirrored;
    return (monCache[key] = paint(g, pal, HD_ON()).toDataURL());
  }
  function url(name, over) {
    const t = T[name]; if (!t || !canvas) return '';
    const key = name + JSON.stringify(over || {}) + HD_ON();
    if (cache[key]) return cache[key];
    return (cache[key] = cv(name, over).toDataURL());
  }
  const cvCache = {};
  function cv(name, over) {
    const key = name + JSON.stringify(over || {}) + HD_ON();
    if (cvCache[key]) return cvCache[key];
    const t = T[name]; if (!t || typeof document === 'undefined') return null;
    return (cvCache[key] = paint(gridOf(name), { ...t.pal, ...(over || {}) }, HD_ON()));
  }
  // 走路的帧：f = 0 站着，1 迈左脚，2 站着，3 迈右脚。
  // 长袍盖住脚的（道士、赶尸人、武僧、Ngoc）在袍子底下露出一双脚；本来就有腿的，左右腿轮流抬起来
  const wkCache = {};
  function walkGrid(name, f) {
    const t = T[name]; if (!t) return null;
    const g = grid(t).map(r => [...r]), W = t.w || 16;
    let yb = g.length - 1; while (yb > 0 && g[yb].every(c => c === '.')) yb--;
    const row = g[yb], cx = W / 2, legged = row[cx - 1] === '.' && row[cx] === '.' && row.slice(0, cx - 1).some(c => c !== '.') && row.slice(cx + 1).some(c => c !== '.');
    if (legged) {   // 有腿的：抬起来的那只脚往上收一格，另一只脚往前迈一格
      if (f === 0 || f === 2) return g;
      const up = f === 1 ? 'R' : 'L', out = g.map(r => r.slice());
      for (let x = 2; x < W - 2; x++) {
        const side = x < cx ? 'L' : 'R';
        if (side === up) { if (g[yb][x] !== '.') { out[yb - 1][x] = g[yb][x]; out[yb][x] = '.'; } }
      }
      // 着地的脚往前（朝右）挪一格
      const fr = [...g[yb]];
      for (let x = 2; x < W - 2; x++) { const side = x < cx ? 'L' : 'R'; if (side !== up) out[yb][x] = '.'; }
      for (let x = 2; x < W - 2; x++) { const side = x < cx ? 'L' : 'R'; if (side !== up && fr[x] !== '.') out[yb][Math.min(W - 1, x + 1)] = fr[x]; }
      return out;
    }
    // 长袍：在下摆下面露出一双脚
    const H = Math.max(g.length, yb + 3), out = g.map(r => r.slice());
    while (out.length < H) out.push(Array(W).fill('.'));
    const put = (x, y, c) => { if (y < H && x >= 0 && x < W) out[y][x] = c; };
    const y1 = yb + 1, y2 = yb + 2, Lx = cx - 3, Rx = cx + 1;   // 腿：左 5–6，右 9–10（16 宽）
    const plant = (x0, dx) => { put(x0, y1, '%'); put(x0 + 1, y1, '%'); put(x0 - 1 + dx, y2, 'K'); put(x0 + dx, y2, 'K'); put(x0 + 1 + dx, y2, 'K'); };
    const lift = x0 => { put(x0 - 1, y1, 'K'); put(x0, y1, 'K'); put(x0 + 1, y1, 'K'); };
    if (f === 1) { plant(Lx, 1); lift(Rx + 1); }        // 左脚着地往前，右脚抬起
    else if (f === 3) { lift(Lx); plant(Rx, 1); }       // 右脚着地往前，左脚抬起
    else { plant(Lx, -0); plant(Rx, 1); }
    return out;
  }
  function walkCv(name, over, f) {
    const key = name + JSON.stringify(over || {}) + '#' + (f || 0) + HD_ON();
    if (wkCache[key]) return wkCache[key];
    if (typeof document === 'undefined') return null;
    const g = walkGrid(name, f || 0); if (!g) return null;
    const t = T[name]; g.mirrored = t.rows.some(r => r.length === (t.w || 16) / 2);
    return (wkCache[key] = paint(g, { ...t.pal, ...(over || {}), '%': '#6a5648' }, HD_ON()));
  }
  // 背影：头上露出来的皮肤换成头发颜色，眼睛嘴巴抹掉（往上走的时候用）
  const bkCache = {};
  function backCv(name, over, f) {
    const key = name + JSON.stringify(over || {}) + '#' + (f || 0) + HD_ON();
    if (bkCache[key]) return bkCache[key];
    if (typeof document === 'undefined') return null;
    const g = walkGrid(name, f || 0); if (!g) return null;
    const t = T[name], H = g.length, head = Math.round(H * 0.48), cnt = {};
    for (let y = 0; y < Math.round(H * 0.3); y++) for (const ch of g[y]) if (ch !== '.' && ch !== 'K' && ch !== 'S') cnt[ch] = (cnt[ch] || 0) + 1;
    let sk = 0; for (let y = 0; y < Math.round(H * 0.3); y++) for (const ch of g[y]) if (ch === 'S') sk++;
    let hair = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 'K';
    if (sk > (cnt[hair] || 0)) hair = 'S';   // 光头：后脑勺还是皮肤，只抹掉五官
    const out = g.map(r => r.slice());
    for (let y = 0; y < head; y++) for (let x = 0; x < out[y].length; x++) {
      const ch = out[y][x];
      if (ch === 'S') out[y][x] = hair;
      else if (ch !== '.' && ch !== 'K' && ch !== hair) { const L = out[y][x - 1], Rr = out[y][x + 1]; if ((L === 'S' || L === hair) && (Rr === 'S' || Rr === hair)) out[y][x] = hair; }
      else if (ch === 'K') { const L = g[y][x - 1], Rr = g[y][x + 1], U = (g[y - 1] || [])[x], D = (g[y + 1] || [])[x]; if ([L, Rr, U, D].every(q => q && q !== '.' && q !== 'K')) out[y][x] = hair; }
    }
    return (bkCache[key] = paint(out, { ...t.pal, ...(over || {}), '%': '#6a5648' }, HD_ON()));
  }
  const wkUrl = {};
  function walkUrl(name, over, f) { const key = name + JSON.stringify(over || {}) + '#' + (f || 0); if (wkUrl[key]) return wkUrl[key]; const c = walkCv(name, over, f); return c ? (wkUrl[key] = c.toDataURL()) : ''; }
  function img(name, size, over, cls) {
    return `<img class="spr ${cls || ''}" src="${url(name, over)}" width="${size}" height="${size}" alt="" draggable="false">`;
  }
  function item(it, size) {
    if (it.gem) return img('gem', size, { G: GEM_TYPES[it.gem].c });
    return img('i_' + it.slot, size, { M: RAR_COL[it.rarity] });
  }
  return { url, breathUrl, monUrl, img, item, cv, walkCv, backCv, walkUrl, walkGrid, gridOf, paint, tones, mixc, hexRgb, T, RAR_COL };
})();
