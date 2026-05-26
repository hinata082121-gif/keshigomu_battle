import { STAGE_LIMIT } from '../constants';
import type { Mission, MissionResult, PlayerProgress, ResultData, RunStats, ScoreRank, ScoreResult } from '../types';
import { buildShareText } from './share';

const BEST_SCORE_KEY = 'eraser-battle-best-score';
const BADGES_KEY = 'eraser-battle-unlocked-badges';
const MISSIONS_KEY = 'eraser-battle-missions';
const PLAY_COUNT_KEY = 'eraser-battle-play-count';

export const MISSIONS: Mission[] = [
  { id: 'win-no-self-destruct', title: '自爆せずに勝利', description: '自爆なしで勝利する' },
  { id: 'straight-stage-win', title: '2ポイント連取で勝利', description: 'CPUにポイントを取られずステージ勝利' },
  { id: 'danger-win', title: 'ギリギリ勝利', description: 'ギリギリ度70%以上で勝利する' },
  { id: 'reach-stage-3', title: 'Stage 3まで到達', description: '放課後チャンピオンの机まで進む' },
  { id: 'beat-boss', title: '放課後チャンピオンに勝つ', description: 'Stage 3をクリアする' },
  { id: 'safe-point', title: 'セーフショットで1ポイント', description: 'SAFEショットでポイントを取る' },
  { id: 'power-ko', title: 'パワーショットでK.O.', description: 'RISKショットでポイントを取る' },
  { id: 'pencil-pressure', title: '鉛筆バウンドで追い込む', description: '鉛筆バウンド後に相手を危険エリアへ入れる' },
  { id: 'ruler-point', title: '定規バウンドでポイント', description: '定規バウンドからポイントを取る' },
  { id: 'comeback-match-point', title: 'マッチポイントから逆転', description: 'あと1本取られた状態からステージ勝利' },
  { id: 'safe-stage-2', title: '自爆せずにStage 2突破', description: '自爆なしでStage 2を突破する' },
  { id: 'clear-safe-strategy', title: '安全第一作戦でクリア', description: '安全第一作戦を使って勝利する' },
  { id: 'clear-power-strategy', title: '一撃狙い作戦でクリア', description: '一撃狙い作戦を使って勝利する' },
  { id: 'clear-bounce-strategy', title: 'バウンド職人作戦でクリア', description: 'バウンド職人作戦を使って勝利する' },
  { id: 'obstacle-hit', title: '障害物バウンド成功', description: '障害物に当ててからポイントを取る' },
  { id: 'shutout', title: '無失点勝利', description: 'CPUに1ポイントも取られず勝利' },
  { id: 'three-plays', title: '3回以上プレイ', description: '3回以上結果を見る' },
  { id: 'best-score-update', title: 'ベストスコア更新', description: '自己ベストを更新する' },
  { id: 'first-result-image-save', title: '初めて結果画像を保存', description: '結果画像を保存する' },
];

export const createInitialRunStats = (): RunStats => ({
  totalShots: 0,
  selfDestructs: 0,
  playerPointsWon: 0,
  cpuPointsWon: 0,
  reachedStage: 1,
  clearedStages: 0,
  obstacleHits: 0,
  pencilBouncePressure: 0,
  rulerBouncePoints: 0,
  safeShots: 0,
  normalShots: 0,
  powerShots: 0,
  safePointWins: 0,
  powerPointWins: 0,
  pressureEvents: 0,
  pressureStreakMax: 0,
  recoveries: 0,
  matchPointComebacks: 0,
  maxDangerScore: 0,
  savedResultImage: false,
  playStyleLabel: '机上支配タイプ',
});

export const normalizeRunStats = (stats?: Partial<RunStats>, stage = 1): RunStats => {
  const fallback = createInitialRunStats();
  const merged = { ...fallback, ...(stats ?? {}) };
  return {
    totalShots: Math.max(0, Math.round(Number.isFinite(merged.totalShots) ? merged.totalShots : 0)),
    selfDestructs: Math.max(0, Math.round(Number.isFinite(merged.selfDestructs) ? merged.selfDestructs : 0)),
    playerPointsWon: Math.max(0, Math.round(Number.isFinite(merged.playerPointsWon) ? merged.playerPointsWon : 0)),
    cpuPointsWon: Math.max(0, Math.round(Number.isFinite(merged.cpuPointsWon) ? merged.cpuPointsWon : 0)),
    reachedStage: Math.max(stage, Math.min(STAGE_LIMIT, Math.round(Number.isFinite(merged.reachedStage) ? merged.reachedStage : stage))),
    clearedStages: Math.max(0, Math.min(STAGE_LIMIT, Math.round(Number.isFinite(merged.clearedStages) ? merged.clearedStages : 0))),
    obstacleHits: Math.max(0, Math.round(Number.isFinite(merged.obstacleHits) ? merged.obstacleHits : 0)),
    pencilBouncePressure: Math.max(0, Math.round(Number.isFinite(merged.pencilBouncePressure) ? merged.pencilBouncePressure : 0)),
    rulerBouncePoints: Math.max(0, Math.round(Number.isFinite(merged.rulerBouncePoints) ? merged.rulerBouncePoints : 0)),
    safeShots: Math.max(0, Math.round(Number.isFinite(merged.safeShots) ? merged.safeShots : 0)),
    normalShots: Math.max(0, Math.round(Number.isFinite(merged.normalShots) ? merged.normalShots : 0)),
    powerShots: Math.max(0, Math.round(Number.isFinite(merged.powerShots) ? merged.powerShots : 0)),
    safePointWins: Math.max(0, Math.round(Number.isFinite(merged.safePointWins) ? merged.safePointWins : 0)),
    powerPointWins: Math.max(0, Math.round(Number.isFinite(merged.powerPointWins) ? merged.powerPointWins : 0)),
    pressureEvents: Math.max(0, Math.round(Number.isFinite(merged.pressureEvents) ? merged.pressureEvents : 0)),
    pressureStreakMax: Math.max(0, Math.round(Number.isFinite(merged.pressureStreakMax) ? merged.pressureStreakMax : 0)),
    recoveries: Math.max(0, Math.round(Number.isFinite(merged.recoveries) ? merged.recoveries : 0)),
    matchPointComebacks: Math.max(0, Math.round(Number.isFinite(merged.matchPointComebacks) ? merged.matchPointComebacks : 0)),
    maxDangerScore: Math.max(0, Math.min(100, Math.round(Number.isFinite(merged.maxDangerScore) ? merged.maxDangerScore : 0))),
    savedResultImage: Boolean(merged.savedResultImage),
    strategyUsed: merged.strategyUsed,
    playStyleLabel: typeof merged.playStyleLabel === 'string' && merged.playStyleLabel.length > 0 ? merged.playStyleLabel : '机上支配タイプ',
  };
};

const canUseStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const readNumber = (key: string): number => {
  if (!canUseStorage()) {
    return 0;
  }
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
};

const readStringArray = (key: string): string[] => {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
  } catch {
    return [];
  }
};

const writeNumber = (key: string, value: number): void => {
  if (!canUseStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(key, `${Math.max(0, Math.round(Number.isFinite(value) ? value : 0))}`);
  } catch {
    // localStorage can be blocked in private modes; gameplay should continue.
  }
};

const writeStringArray = (key: string, value: string[]): void => {
  if (!canUseStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify([...new Set(value)].filter(Boolean)));
  } catch {
    // localStorage can be blocked in private modes; gameplay should continue.
  }
};

export const loadPlayerProgress = (): PlayerProgress => ({
  bestScore: readNumber(BEST_SCORE_KEY),
  unlockedBadges: readStringArray(BADGES_KEY),
  achievedMissions: readStringArray(MISSIONS_KEY),
  playCount: readNumber(PLAY_COUNT_KEY),
});

const savePlayerProgress = (progress: PlayerProgress): void => {
  writeNumber(BEST_SCORE_KEY, progress.bestScore);
  writeStringArray(BADGES_KEY, progress.unlockedBadges);
  writeStringArray(MISSIONS_KEY, progress.achievedMissions);
  writeNumber(PLAY_COUNT_KEY, progress.playCount);
};

const rankFromScore = (score: number): ScoreRank => {
  if (score >= 9000) return 'S';
  if (score >= 7000) return 'A';
  if (score >= 5000) return 'B';
  if (score >= 3000) return 'C';
  return 'D';
};

export const calculateScore = (result: ResultData, stats: RunStats, currentBestScore = 0): ScoreResult => {
  const isWin = result.winner === 'player' && result.reason !== 'draw';
  const victoryBonus = isWin ? 2800 : result.winner === 'draw' ? 900 : 350;
  const stageBonus = Math.max(1, stats.reachedStage) * 720 + stats.clearedStages * 720;
  const defenseBonus = Math.max(0, 1700 - stats.cpuPointsWon * 560);
  const noSelfBonus = stats.selfDestructs === 0 ? 850 : 0;
  const dangerBonus = isWin && stats.maxDangerScore >= 70 ? Math.min(1200, stats.maxDangerScore * 12) : Math.min(420, stats.maxDangerScore * 4);
  const shotBonus = Math.max(0, 1100 - stats.totalShots * 95);
  const obstacleBonus = Math.min(1250, stats.obstacleHits * 260 + stats.pencilBouncePressure * 340 + stats.rulerBouncePoints * 520);
  const pressureBonus = Math.min(1600, stats.pressureEvents * 260 + stats.pressureStreakMax * 180 + stats.recoveries * 320);
  const styleBonus = stats.safePointWins * 420 + stats.powerPointWins * 360 + stats.matchPointComebacks * 720;
  const strategyBonus =
    stats.strategyUsed === 'safe' && stats.safePointWins > 0
      ? 380
      : stats.strategyUsed === 'power' && stats.powerPointWins > 0
        ? 380
        : stats.strategyUsed === 'bounce' && stats.obstacleHits > 0
          ? 420
          : 0;
  const penalty = stats.selfDestructs * 520 + Math.max(0, stats.powerShots - stats.powerPointWins * 2) * 45;
  const clearBonus = isWin && result.stage >= STAGE_LIMIT ? 1600 : 0;
  const score = Math.max(
    0,
    Math.round(victoryBonus + stageBonus + defenseBonus + noSelfBonus + dangerBonus + shotBonus + obstacleBonus + pressureBonus + styleBonus + strategyBonus + clearBonus - penalty),
  );

  return {
    score,
    rank: rankFromScore(score),
    isBestScore: score > currentBestScore,
  };
};

const evaluateMissionIds = (result: ResultData, stats: RunStats, nextPlayCount: number, scoreResult: ScoreResult): Set<string> => {
  const achieved = new Set<string>();
  const isWin = result.winner === 'player' && result.reason !== 'draw';

  if (isWin && stats.selfDestructs === 0) achieved.add('win-no-self-destruct');
  if (isWin && result.cpuPoints === 0) achieved.add('straight-stage-win');
  if (isWin && stats.maxDangerScore >= 70) achieved.add('danger-win');
  if (stats.reachedStage >= 3) achieved.add('reach-stage-3');
  if (isWin && result.stage >= STAGE_LIMIT) achieved.add('beat-boss');
  if (stats.safePointWins > 0) achieved.add('safe-point');
  if (stats.powerPointWins > 0) achieved.add('power-ko');
  if (stats.pencilBouncePressure > 0) achieved.add('pencil-pressure');
  if (stats.rulerBouncePoints > 0) achieved.add('ruler-point');
  if (stats.matchPointComebacks > 0) achieved.add('comeback-match-point');
  if (stats.clearedStages >= 2 && stats.selfDestructs === 0) achieved.add('safe-stage-2');
  if (isWin && stats.strategyUsed === 'safe') achieved.add('clear-safe-strategy');
  if (isWin && stats.strategyUsed === 'power') achieved.add('clear-power-strategy');
  if (isWin && stats.strategyUsed === 'bounce') achieved.add('clear-bounce-strategy');
  if (stats.obstacleHits > 0 && stats.playerPointsWon > 0) achieved.add('obstacle-hit');
  if (isWin && stats.cpuPointsWon === 0) achieved.add('shutout');
  if (nextPlayCount >= 3) achieved.add('three-plays');
  if (scoreResult.isBestScore) achieved.add('best-score-update');
  if (stats.savedResultImage) achieved.add('first-result-image-save');

  return achieved;
};

const getStyleBadge = (result: ResultData, stats: RunStats): string | undefined => {
  if (result.winner === 'player' && result.stage >= STAGE_LIMIT) return '机上決戦制覇';
  if (stats.rulerBouncePoints > 0) return '定規反射の名人';
  if (stats.pencilBouncePressure > 0 || stats.obstacleHits >= 2) return '鉛筆バウンド職人';
  if (stats.matchPointComebacks > 0) return '休み時間の逆転王';
  if (stats.safePointWins > 0 && stats.safeShots >= stats.powerShots) return '安全第一の職人';
  if (stats.powerPointWins > 0 && stats.powerShots >= stats.safeShots) return '豪快ショット番長';
  if (stats.recoveries > 0) return '机端管理人';
  if (stats.selfDestructs > 0) return 'やりすぎ注意';
  return undefined;
};

export const inferPlayStyleLabel = (stats: RunStats): string => {
  if (stats.selfDestructs > 0 && stats.powerShots > stats.safeShots) return '自爆注意タイプ';
  if (stats.rulerBouncePoints > 0 || stats.pencilBouncePressure > 0 || stats.obstacleHits >= 2) return 'バウンド職人タイプ';
  if (stats.recoveries > 0 || stats.maxDangerScore >= 78) return '崖っぷち生存タイプ';
  if (stats.powerShots > stats.safeShots + stats.normalShots) return '一撃狙いタイプ';
  if (stats.safeShots >= stats.powerShots + stats.normalShots) return '安全重視タイプ';
  return '机上支配タイプ';
};

export const finalizeResultProgress = (result: ResultData): ResultData => {
  const previous = loadPlayerProgress();
  const nextPlayCount = previous.playCount + 1;
  const stats = normalizeRunStats(result.runStats, result.stage);
  stats.playStyleLabel = inferPlayStyleLabel(stats);
  const scoreResult = calculateScore(result, stats, previous.bestScore);
  const currentMissionIds = evaluateMissionIds(result, stats, nextPlayCount, scoreResult);
  const previousMissionIds = new Set(previous.achievedMissions);
  const missions: MissionResult[] = MISSIONS.map((mission) => {
    const achieved = currentMissionIds.has(mission.id);
    return {
      mission,
      achieved,
      newlyAchieved: achieved && !previousMissionIds.has(mission.id),
    };
  });
  const styleBadge = getStyleBadge(result, stats);
  const badgesToUnlock = [result.title, styleBadge].filter((badge): badge is string => Boolean(badge));
  const newBadges = badgesToUnlock.filter((badge) => !previous.unlockedBadges.includes(badge));
  const isNewBadge = newBadges.length > 0;
  const progress: PlayerProgress = {
    bestScore: scoreResult.isBestScore ? scoreResult.score : previous.bestScore,
    unlockedBadges: [...new Set([...previous.unlockedBadges, ...newBadges])],
    achievedMissions: [...new Set([...previous.achievedMissions, ...missions.filter((item) => item.achieved).map((item) => item.mission.id)])],
    playCount: nextPlayCount,
  };

  savePlayerProgress(progress);

  return {
    ...result,
    runStats: stats,
    scoreResult,
    shareText: buildShareText({ ...result, scoreResult }),
    missions,
    bestScore: progress.bestScore,
    unlockedBadgeCount: progress.unlockedBadges.length,
    achievedMissionCount: progress.achievedMissions.length,
    missionTotal: MISSIONS.length,
    isNewBadge,
  };
};

export const markResultImageSaved = (): void => {
  const progress = loadPlayerProgress();
  if (progress.achievedMissions.includes('first-result-image-save')) {
    return;
  }
  savePlayerProgress({
    ...progress,
    achievedMissions: [...progress.achievedMissions, 'first-result-image-save'],
  });
};

export const pickRecommendedMission = (progress: PlayerProgress): Mission => {
  const dateSeed =
    typeof Date !== 'undefined'
      ? Number(new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }).replace(/\D/g, ''))
      : progress.playCount;
  const locked = MISSIONS.filter((mission) => !progress.achievedMissions.includes(mission.id));
  const pool = locked.length > 0 ? locked : MISSIONS;
  return pool[Math.abs(dateSeed + progress.playCount) % pool.length] ?? MISSIONS[0];
};
