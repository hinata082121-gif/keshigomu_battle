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
  { id: 'reach-stage-3', title: 'Stage 3まで到達', description: 'ラスボスの机まで進む' },
  { id: 'beat-boss', title: 'ラスボスに勝利', description: 'Stage 3をクリアする' },
  { id: 'obstacle-hit', title: '障害物バウンド成功', description: '障害物に当ててからポイントを取る' },
  { id: 'shutout', title: '無失点勝利', description: 'CPUに1ポイントも取られず勝利' },
  { id: 'three-plays', title: '3回以上プレイ', description: '3回以上結果を見る' },
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
  maxDangerScore: 0,
  savedResultImage: false,
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
    maxDangerScore: Math.max(0, Math.min(100, Math.round(Number.isFinite(merged.maxDangerScore) ? merged.maxDangerScore : 0))),
    savedResultImage: Boolean(merged.savedResultImage),
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
  const stageBonus = Math.max(1, stats.reachedStage) * 750 + stats.clearedStages * 650;
  const defenseBonus = Math.max(0, 1800 - stats.cpuPointsWon * 520);
  const noSelfBonus = stats.selfDestructs === 0 ? 850 : 0;
  const dangerBonus = isWin && stats.maxDangerScore >= 70 ? Math.min(1200, stats.maxDangerScore * 12) : Math.min(420, stats.maxDangerScore * 4);
  const shotBonus = Math.max(0, 1400 - stats.totalShots * 120);
  const obstacleBonus = Math.min(900, stats.obstacleHits * 300);
  const clearBonus = isWin && result.stage >= STAGE_LIMIT ? 1600 : 0;
  const score = Math.max(0, Math.round(victoryBonus + stageBonus + defenseBonus + noSelfBonus + dangerBonus + shotBonus + obstacleBonus + clearBonus));

  return {
    score,
    rank: rankFromScore(score),
    isBestScore: score > currentBestScore,
  };
};

const evaluateMissionIds = (result: ResultData, stats: RunStats, nextPlayCount: number): Set<string> => {
  const achieved = new Set<string>();
  const isWin = result.winner === 'player' && result.reason !== 'draw';

  if (isWin && stats.selfDestructs === 0) achieved.add('win-no-self-destruct');
  if (isWin && result.cpuPoints === 0) achieved.add('straight-stage-win');
  if (isWin && stats.maxDangerScore >= 70) achieved.add('danger-win');
  if (stats.reachedStage >= 3) achieved.add('reach-stage-3');
  if (isWin && result.stage >= STAGE_LIMIT) achieved.add('beat-boss');
  if (stats.obstacleHits > 0 && stats.playerPointsWon > 0) achieved.add('obstacle-hit');
  if (isWin && stats.cpuPointsWon === 0) achieved.add('shutout');
  if (nextPlayCount >= 3) achieved.add('three-plays');
  if (stats.savedResultImage) achieved.add('first-result-image-save');

  return achieved;
};

export const finalizeResultProgress = (result: ResultData): ResultData => {
  const previous = loadPlayerProgress();
  const nextPlayCount = previous.playCount + 1;
  const stats = normalizeRunStats(result.runStats, result.stage);
  const scoreResult = calculateScore(result, stats, previous.bestScore);
  const currentMissionIds = evaluateMissionIds(result, stats, nextPlayCount);
  const previousMissionIds = new Set(previous.achievedMissions);
  const missions: MissionResult[] = MISSIONS.map((mission) => {
    const achieved = currentMissionIds.has(mission.id);
    return {
      mission,
      achieved,
      newlyAchieved: achieved && !previousMissionIds.has(mission.id),
    };
  });
  const isNewBadge = Boolean(result.title) && !previous.unlockedBadges.includes(result.title);
  const progress: PlayerProgress = {
    bestScore: scoreResult.isBestScore ? scoreResult.score : previous.bestScore,
    unlockedBadges: isNewBadge ? [...previous.unlockedBadges, result.title] : previous.unlockedBadges,
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
  const locked = MISSIONS.find((mission) => !progress.achievedMissions.includes(mission.id));
  return locked ?? MISSIONS[0];
};
