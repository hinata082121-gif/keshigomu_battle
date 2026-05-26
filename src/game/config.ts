import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { RoundClearScene } from './scenes/RoundClearScene';
import { StrategySelectScene } from './scenes/StrategySelectScene';
import { StoryScene } from './scenes/StoryScene';
import { TitleScene } from './scenes/TitleScene';
import { TutorialScene } from './scenes/TutorialScene';
import { WORLD_HEIGHT, WORLD_WIDTH } from './constants';

export const createGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#2a1a12',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  input: {
    activePointers: 3,
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  scene: [BootScene, TitleScene, StoryScene, TutorialScene, StrategySelectScene, GameScene, RoundClearScene, ResultScene],
});
