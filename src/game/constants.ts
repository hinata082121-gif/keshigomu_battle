export const OFFICIAL_SITE_URL = 'https://heisei-school-games.vercel.app/';
export const GAME_URL = 'https://keshigomu-battle.vercel.app/';

export const GAME_TITLE = '机上決戦！\n消しゴム落とし';
export const GAME_SUBTITLE = '休み時間、机の上の天下を取れ！';
export const ENGLISH_TITLE = 'Eraser Battle';

export const ROUND_LIMIT = 5;
export const STAGE_LIMIT = 3;

export const STAGE_OPPONENTS = [
  {
    stage: 1,
    name: 'となりの席の友人',
    label: 'FRIEND',
    introText: '「なあ、消しゴム落としやろうぜ！」',
    difficulty: 'easy',
    eraserLabel: 'FRIEND',
  },
  {
    stage: 2,
    name: 'クラスの消しゴム職人',
    label: 'CRAFT',
    introText: '「その角度、まだ甘いな。」',
    difficulty: 'normal',
    eraserLabel: 'CRAFT',
  },
  {
    stage: 3,
    name: '机上決戦のラスボス',
    label: 'BOSS',
    introText: '「この机の王者は、俺だ。」',
    difficulty: 'hard',
    eraserLabel: 'BOSS',
  },
] as const;

export const UI = {
  safeX: 20,
  safeTop: 16,
  safeBottom: 24,
  minButtonHeight: 56,
  panelRadius: 8,
  fontFamily: '"Hiragino Maru Gothic ProN", "Yu Gothic", system-ui, sans-serif',
};

export const TABLE = {
  marginX: 18,
  top: 146,
  bottomReserved: 150,
  minHeight: 360,
  maxHeightRatio: 0.6,
  border: 8,
};

export const ERASER = {
  width: 76,
  height: 42,
  bounce: 0.74,
  drag: 285,
  maxVelocity: 680,
  bodyInset: 2,
};

export const SHOT = {
  minPower: 145,
  maxPower: 640,
  maxSwipeDistance: 132,
  stopSpeedThreshold: 14,
};

export const CPU = {
  basePower: 335,
  powerRandom: 155,
  aimRandomAngleDeg: 22,
  thinkDelayMs: 680,
};

export const CPU_BY_DIFFICULTY = {
  easy: {
    basePower: 300,
    powerRandom: 180,
    aimRandomAngleDeg: 26,
    riskyShotRate: 18,
  },
  normal: {
    basePower: 360,
    powerRandom: 160,
    aimRandomAngleDeg: 18,
    riskyShotRate: 14,
  },
  hard: {
    basePower: 430,
    powerRandom: 130,
    aimRandomAngleDeg: 12,
    riskyShotRate: 10,
  },
} as const;

export const COLORS = {
  floor: 0x231811,
  floorShadow: 0x15100c,
  tableBase: 0xa86a35,
  tableLight: 0xc38545,
  tableDark: 0x6f3f22,
  tableLine: 0x4e2d18,
  paper: 0xf6ead0,
  paperShadow: 0xcab88e,
  ink: 0x3d2f24,
  player: 0x67d9c5,
  playerDark: 0x237d77,
  cpu: 0xffcf5c,
  cpuDark: 0x9f5c21,
  red: 0xe45151,
  blue: 0x4a86e8,
  white: 0xfff8dc,
  black: 0x211714,
};

export const TITLE_COPY = [
  '自分の消しゴムをタッチ',
  '指を動かして狙いを決める',
  '離して相手を机の外へ！',
];

export const RESULT_TITLES = {
  win: ['机上の支配者', 'ワンショット職人', '放課後チャンピオン', '消しゴム界の番長', '休み時間の王者', '神ショットの使い手'],
  close: ['崖っぷち生存者', '机の端の魔術師', '1ミリ残しの奇跡', 'スレスレ職人'],
  lose: ['自爆王', '勢いだけの男', '机外ホームラン', '逆方向の天才', '消しゴム行方不明'],
  joke: ['筆箱に救われし者', '定規に嫌われた者', '休み時間終了間際の英雄'],
};

export const SHARE_LINES = [
  '休み時間30秒、俺は机の上で天下を取った。',
  '消しゴムを弾いただけなのに、教室が沸いた。',
  '1ミリ残しで生き残りました。',
  '机の上では負けられない戦いがある。',
  '自分の消しゴムだけ場外に飛びました。',
];

export const HASHTAGS = ['#平成学校ゲームズ', '#消しゴム落とし', '#机上決戦', '#ブラウザゲーム'];
