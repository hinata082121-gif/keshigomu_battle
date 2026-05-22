import Phaser from 'phaser';
import { ROUND_LIMIT, STAGE_LIMIT, STAGE_OPPONENTS } from '../constants';
import type { EndReason, ResultData, ResultType, ShotGrade, Winner } from '../types';
import { buildShareText } from './share';

const titlePools: Record<ResultType, string[]> = {
  win: [
    '机上の支配者',
    'ワンショット職人',
    '放課後チャンピオン',
    '消しゴム界の番長',
    '休み時間の王者',
    '神ショットの使い手',
    '机上バトルの転校生',
    '消しゴム界の新星',
    '休み時間の主役',
    '教室の小さな覇者',
  ],
  lose: [
    '勢いだけの男',
    '机外ホームラン',
    '逆方向の天才',
    '消しゴム行方不明',
    '端っこ生活の末路',
    '休み時間の反省会',
    '力加減迷子',
    '今日の机は広すぎた',
    '机外遠征隊',
    '次の休み時間に期待',
  ],
  selfDestruct: [
    '自爆王',
    '巻き込み職人',
    '伝説の道連れ',
    '相打ちの申し子',
    '机上の花火',
    '勢いの化身',
    '一緒に落ちれば怖くない',
    '休み時間の大事故',
    'やりすぎショット',
    '消しゴム大脱走',
  ],
  doubleOut: [
    '巻き込み職人',
    '伝説の道連れ',
    '相打ちの申し子',
    '机上の花火',
    '一緒に落ちれば怖くない',
    '休み時間の大事故',
    'やりすぎショット',
  ],
  judgeWin: ['粘り勝ちの職人', '机上の守備職人', '最後まで残った者', '安全圏の達人', '休み時間の判定王', '中央キープの名人'],
  judgeLose: ['端っこ生活の末路', 'じわじわ敗北', '机端に愛された者', '安全確認不足', 'あと一歩の消しゴム', '粘ったけど落ちそう'],
  draw: ['休み時間延長希望', '決着つかずの名勝負', '机上の平和条約', 'どっちも譲らない', '消しゴム同士の和解'],
};

const closeWinTitles = [
  '崖っぷち生存者',
  '机の端の魔術師',
  '1ミリ残しの奇跡',
  'スレスレ職人',
  '端っこ耐久王',
  'ギリギリの申し子',
  '机端の生還者',
  '落ちそうで落ちない人',
  '休み時間の粘り腰',
  '奇跡の机上残留',
];

const badges: Record<ResultType, string> = {
  win: '机上制圧',
  lose: '次こそリベンジ',
  selfDestruct: '場外一直線',
  doubleOut: '道連れ決着',
  judgeWin: '判定勝ち',
  judgeLose: '判定負け',
  draw: '休み時間延長',
};

const summaries: Record<ResultType, string[]> = {
  win: ['相手の消しゴムを机の外へ弾き飛ばした！', '机の上では負けられない戦いに勝利した！', '休み時間最速の決着！'],
  lose: ['あなたの消しゴムは机の外へ旅立った……', '机の広さを信じすぎた結果です。', 'あと少しで踏みとどまれたかもしれない。'],
  selfDestruct: ['勢いは満点、結果は場外！', '自分の消しゴムが一番元気に飛んでいった！', 'やる気が机のサイズを超えてしまった。'],
  doubleOut: ['相手も巻き込んだが、自分も落ちた！', '教室が一瞬だけ静かになる相打ちショット！', '勝敗よりも勢いが記憶に残った。'],
  judgeWin: ['最後まで机の上に残り、判定勝ち！', '中央を守りきった粘りの勝利！', '落とせなくても、残れば勝ち。'],
  judgeLose: ['最後まで粘ったが、机の端に追い込まれた……', 'あと少し中央に残れていれば……', '長期戦の末、端っこが近すぎた。'],
  draw: ['決着つかず。次の休み時間へ持ち越し！', '互いに譲らない机上の名勝負！', 'チャイムが鳴ったらノーサイド。'],
};

const shotLabels: Record<ShotGrade, string[]> = {
  god: ['神ショット', '一撃必落', '角度完璧'],
  great: ['ナイスショット', '机上制圧', '中央キープ'],
  normal: ['惜しいショット', '判定決着', '次は勝てる'],
  danger: ['1ミリ残し', 'スレスレ生存', '崖っぷち回避', '奇跡の残留', '落ちそうで落ちない'],
  selfDestruct: ['やりすぎ注意', '豪快すぎた', '道連れ成功？', '自爆ショット', '勢い全振り'],
  unlucky: ['力みすぎ', '方向迷子', '机外ホームラン', '長期戦の末路', '端っこ危機'],
};

const choose = (items: string[], seed: number): string => items[Math.abs(Math.floor(seed)) % items.length] ?? items[0] ?? '休み時間の記録';

const resultTypeFrom = (winner: Winner, reason: EndReason): ResultType => {
  if (reason === 'doubleOut') {
    return 'doubleOut';
  }

  if (reason === 'selfOut') {
    return 'selfDestruct';
  }

  if (reason === 'judge') {
    return winner === 'player' ? 'judgeWin' : 'judgeLose';
  }

  if (reason === 'draw' || winner === 'draw') {
    return 'draw';
  }

  return winner === 'player' ? 'win' : 'lose';
};

const shotGradeFrom = (resultType: ResultType, round: number, dangerScore: number): ShotGrade => {
  if (resultType === 'selfDestruct' || resultType === 'doubleOut') {
    return 'selfDestruct';
  }

  if (dangerScore >= 78 && (resultType === 'win' || resultType === 'judgeWin')) {
    return 'danger';
  }

  if (resultType === 'win' && round <= 1) {
    return 'god';
  }

  if (resultType === 'win' || resultType === 'judgeWin') {
    return 'great';
  }

  if (resultType === 'draw') {
    return 'normal';
  }

  return 'unlucky';
};

const dangerFromEdge = (edgeDistanceValue: number): number => Phaser.Math.Clamp(Math.round(100 - edgeDistanceValue * 2.05), 0, 100);

export const formatTightness = (dangerScore: number): string => {
  if (dangerScore >= 90) {
    return '机端すれすれ';
  }

  if (dangerScore >= 72) {
    return 'ギリギリ';
  }

  if (dangerScore >= 42) {
    return 'やや危険';
  }

  return '安定';
};

export const createResultData = (params: {
  winner: Winner;
  reason: EndReason;
  stage?: number;
  opponentName?: string;
  round: number;
  playerEdgeDistance: number;
  cpuEdgeDistance: number;
}): ResultData => {
  const round = Phaser.Math.Clamp(Number.isFinite(params.round) ? params.round : 1, 1, ROUND_LIMIT);
  const stage = Phaser.Math.Clamp(Number.isFinite(params.stage) ? Number(params.stage) : 1, 1, STAGE_LIMIT);
  const opponentName = params.opponentName?.trim() || STAGE_OPPONENTS.find((opponent) => opponent.stage === stage)?.name || '対戦相手';
  const playerEdgeDistance = Math.max(0, Math.round(Number.isFinite(params.playerEdgeDistance) ? params.playerEdgeDistance : 0));
  const cpuEdgeDistance = Math.max(0, Math.round(Number.isFinite(params.cpuEdgeDistance) ? params.cpuEdgeDistance : 0));
  const resultType = resultTypeFrom(params.winner, params.reason);
  const edgeDistance =
    resultType === 'win' || resultType === 'judgeWin' || resultType === 'draw'
      ? playerEdgeDistance
      : resultType === 'lose' || resultType === 'judgeLose'
        ? playerEdgeDistance
        : 0;
  const dangerScore = resultType === 'selfDestruct' || resultType === 'doubleOut' ? 100 : dangerFromEdge(edgeDistance);
  const shotGrade = shotGradeFrom(resultType, round, dangerScore);
  const seed = round * 23 + playerEdgeDistance * 3 - cpuEdgeDistance * 2 + resultType.length * 11;
  const isCloseWin = (resultType === 'win' || resultType === 'judgeWin') && dangerScore >= 76;
  const titlePool = isCloseWin ? closeWinTitles : titlePools[resultType];
  const result: ResultData = {
    winner: params.winner,
    reason: params.reason,
    resultType,
    stage,
    stageMax: STAGE_LIMIT,
    opponentName,
    round,
    rounds: round,
    maxRounds: ROUND_LIMIT,
    title: choose(titlePool, seed),
    badge: badges[resultType],
    tightness: `${dangerScore}% / ${formatTightness(dangerScore)}`,
    dangerScore,
    edgeDistance,
    shotGrade,
    shotGradeLabel: choose(shotLabels[shotGrade], seed + 5),
    shotRating: '',
    summary: choose(summaries[resultType], seed + 9),
    shareText: '',
    playerEdgeDistance,
    cpuEdgeDistance,
  };

  result.shotRating = result.shotGradeLabel;
  result.shareText = buildShareText(result);
  return result;
};

export const createFallbackResultData = (): ResultData =>
  createResultData({
    winner: 'draw',
    reason: 'draw',
    stage: 1,
    opponentName: STAGE_OPPONENTS[0].name,
    round: 1,
    playerEdgeDistance: 50,
    cpuEdgeDistance: 50,
  });
