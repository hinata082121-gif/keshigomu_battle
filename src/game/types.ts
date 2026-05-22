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
  summary: string;
  shareText: string;
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
}
