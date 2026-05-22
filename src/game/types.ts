import type Phaser from 'phaser';

export type PlayState =
  | 'title'
  | 'ready'
  | 'playerTurn'
  | 'aiming'
  | 'moving'
  | 'cpuThinking'
  | 'cpuTurn'
  | 'result';

export type SceneKey =
  | 'BootScene'
  | 'TitleScene'
  | 'StoryScene'
  | 'TutorialScene'
  | 'GameScene'
  | 'RoundClearScene'
  | 'ResultScene';

export type Winner = 'player' | 'cpu' | 'draw';

export type EndReason = 'knockout' | 'selfOut' | 'doubleOut' | 'judge' | 'draw';

export type ResultType = 'win' | 'lose' | 'selfDestruct' | 'doubleOut' | 'judgeWin' | 'judgeLose' | 'draw';

export type ShotGrade = 'god' | 'great' | 'normal' | 'danger' | 'selfDestruct' | 'unlucky';

export type StageDifficulty = 'easy' | 'normal' | 'hard';

export interface StageOpponent {
  stage: number;
  name: string;
  label: string;
  introText: string;
  difficulty: StageDifficulty;
  eraserLabel: string;
}

export interface GameSceneData {
  stage?: number;
  runStats?: RunStats;
}

export interface GameProgress {
  currentStage: number;
  maxStage: number;
  clearedStages: number;
}

export interface ResultImageData {
  title: string;
  resultTitle: string;
  badge: string;
  opponentName: string;
  reachedStage: number;
  dangerScore: number;
  shotGradeLabel: string;
  score: number;
  rank: ScoreRank;
  isBestScore: boolean;
  missions: string[];
  summary: string;
  shareText: string;
}

export interface MatchPointState {
  playerPoints: number;
  cpuPoints: number;
  pointsToWin: number;
}

export interface RunStats {
  totalShots: number;
  selfDestructs: number;
  playerPointsWon: number;
  cpuPointsWon: number;
  reachedStage: number;
  clearedStages: number;
  obstacleHits: number;
  maxDangerScore: number;
  savedResultImage: boolean;
}

export type ScoreRank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface ScoreResult {
  score: number;
  rank: ScoreRank;
  isBestScore: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
}

export interface MissionResult {
  mission: Mission;
  achieved: boolean;
  newlyAchieved: boolean;
}

export interface PlayerProgress {
  bestScore: number;
  unlockedBadges: string[];
  achievedMissions: string[];
  playCount: number;
}

export interface TableBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface AimState {
  start: Phaser.Math.Vector2;
  current: Phaser.Math.Vector2;
}

export interface CpuShotConfig {
  basePower: number;
  powerRandom: number;
  aimRandomAngleDeg: number;
  riskyShotRate: number;
}

export interface ResultData {
  winner: Winner;
  reason: EndReason;
  resultType: ResultType;
  stage: number;
  stageMax: number;
  opponentName: string;
  round: number;
  rounds: number;
  maxRounds: number;
  title: string;
  badge: string;
  tightness: string;
  dangerScore: number;
  edgeDistance: number;
  shotGrade: ShotGrade;
  shotGradeLabel: string;
  shotRating: string;
  summary: string;
  shareText: string;
  playerEdgeDistance: number;
  cpuEdgeDistance: number;
  playerPoints: number;
  cpuPoints: number;
  pointsToWin: number;
  runStats: RunStats;
  scoreResult: ScoreResult;
  missions: MissionResult[];
  bestScore: number;
  unlockedBadgeCount: number;
  achievedMissionCount: number;
  missionTotal: number;
  isNewBadge: boolean;
}
