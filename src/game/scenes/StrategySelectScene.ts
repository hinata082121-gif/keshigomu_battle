import Phaser from 'phaser';
import { COLORS, STAGE_LIMIT, STAGE_OPPONENTS, STRATEGIES, UI, WORLD } from '../constants';
import type { GameSceneData, RunStats, Strategy, StrategyType } from '../types';
import { playSound } from '../utils/audio';
import { createInitialRunStats, normalizeRunStats } from '../utils/progress';
import { isSmallPhoneViewport } from '../utils/viewport';

export class StrategySelectScene extends Phaser.Scene {
  private stage = 1;
  private runStats: RunStats = createInitialRunStats();
  private locked = false;

  constructor() {
    super('StrategySelectScene');
  }

  init(data?: GameSceneData): void {
    this.stage = Phaser.Math.Clamp(Number.isFinite(data?.stage) ? Number(data?.stage) : 1, 1, STAGE_LIMIT);
    this.runStats = normalizeRunStats(data?.runStats, this.stage);
    this.locked = false;
  }

  create(): void {
    this.draw();
    this.scale.on('resize', this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.draw, this);
    });
  }

  private draw(): void {
    this.children.removeAll();
    const { width, height } = this.scale;
    const centerX = WORLD.centerX;
    const compact = isSmallPhoneViewport() || height <= 760;
    const opponent = STAGE_OPPONENTS.find((item) => item.stage === this.stage) ?? STAGE_OPPONENTS[0];

    this.drawBackground(width, height);
    this.add
      .text(centerX, UI.safeTop + (compact ? 14 : 22), `STAGE ${this.stage} 作戦会議`, {
        fontFamily: UI.fontFamily,
        fontSize: compact ? '27px' : '32px',
        fontStyle: '900',
        color: '#fff4cf',
        stroke: '#3c2415',
        strokeThickness: 7,
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, UI.safeTop + (compact ? 56 : 72), `${opponent.name}に挑む前に、休み時間の作戦を選ぼう。`, {
        fontFamily: UI.fontFamily,
        fontSize: compact ? '13px' : '15px',
        fontStyle: '900',
        color: '#fff8dc',
        stroke: '#3a2417',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: Math.min(width - 44, 340) },
      })
      .setOrigin(0.5, 0);

    const cardWidth = Math.min(width - 42, 332);
    const cardHeight = compact ? 122 : 138;
    const gap = compact ? 10 : 14;
    const startY = UI.safeTop + (compact ? 112 : 134);

    STRATEGIES.forEach((strategy, index) => {
      this.drawStrategyCard(strategy, centerX, startY + index * (cardHeight + gap), cardWidth, cardHeight);
    });

    this.add
      .text(centerX, height - UI.safeBottom - 24, '作戦はスコアとショットの安定感に影響します', {
        fontFamily: UI.fontFamily,
        fontSize: '11px',
        fontStyle: '900',
        color: '#d8c7aa',
        align: 'center',
        wordWrap: { width: Math.min(width - 50, 330) },
      })
      .setOrigin(0.5);
  }

  private drawBackground(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.floor, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(COLORS.tableBase, 1);
    graphics.fillRoundedRect(16, 86, width - 32, height - 156, 10);
    graphics.lineStyle(4, COLORS.tableLine, 0.9);
    graphics.strokeRoundedRect(16, 86, width - 32, height - 156, 10);
    for (let y = 108; y < height - 90; y += 34) {
      graphics.lineStyle(2, COLORS.tableLight, 0.16);
      graphics.lineBetween(28, y, width - 28, y + Math.sin(y * 0.03) * 4);
    }
  }

  private drawStrategyCard(strategy: Strategy, centerX: number, y: number, width: number, height: number): void {
    const accent = strategy.id === 'safe' ? 0xbdebdc : strategy.id === 'power' ? 0xff9c45 : 0xffe28a;
    const container = this.add.container(centerX, y);
    const shadow = this.add.rectangle(4, 5, width, height, 0x4b2819, 0.92).setOrigin(0.5, 0);
    const paper = this.add.rectangle(0, 0, width, height, COLORS.paper, 1).setOrigin(0.5, 0);
    paper.setStrokeStyle(3, 0x3a2417, 0.9);
    const tag = this.add.rectangle(-width / 2 + 48, 22, 72, 28, accent, 1).setOrigin(0.5);
    tag.setStrokeStyle(2, 0x3a2417, 0.75);
    const tagText = this.add
      .text(-width / 2 + 48, 22, strategy.id.toUpperCase(), {
        fontFamily: UI.fontFamily,
        fontSize: '11px',
        fontStyle: '900',
        color: '#2b1a11',
      })
      .setOrigin(0.5);
    const title = this.add
      .text(-width / 2 + 94, 13, strategy.title, {
        fontFamily: UI.fontFamily,
        fontSize: '20px',
        fontStyle: '900',
        color: '#2d2119',
      })
      .setOrigin(0, 0);
    const body = this.add
      .text(0, 52, strategy.description, {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '900',
        color: '#5a3824',
        align: 'center',
        wordWrap: { width: width - 42 },
      })
      .setOrigin(0.5, 0);
    const hint = this.add
      .text(0, height - 30, this.getStrategyHint(strategy.id), {
        fontFamily: UI.fontFamily,
        fontSize: '11px',
        fontStyle: '900',
        color: '#7a321d',
        align: 'center',
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5, 0);

    container.add([shadow, paper, tag, tagText, title, body, hint]);
    const hitZone = this.add.zone(centerX, y + height / 2, width, height).setInteractive({ useHandCursor: true });
    hitZone.setDepth(100);
    hitZone.on('pointerdown', () => container.setY(y + 3));
    hitZone.on('pointerout', () => container.setY(y));
    hitZone.on('pointerup', () => {
      if (this.locked) {
        return;
      }
      this.locked = true;
      container.setY(y);
      playSound('tap');
      this.scene.start('GameScene', { stage: this.stage, runStats: this.runStats, strategy: strategy.id as StrategyType });
    });
  }

  private getStrategyHint(strategy: StrategyType): string {
    if (strategy === 'safe') {
      return 'SAFE成功ボーナス / ブレ減少';
    }
    if (strategy === 'power') {
      return 'RISK得点アップ / 自爆注意';
    }
    return '障害物バウンド得点アップ';
  }
}
