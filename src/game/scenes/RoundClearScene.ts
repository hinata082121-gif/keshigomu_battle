import Phaser from 'phaser';
import { COLORS, STAGE_LIMIT, STAGE_OPPONENTS, UI } from '../constants';
import type { ResultData } from '../types';
import { playSound } from '../utils/audio';
import { createFallbackResultData } from '../utils/result';

export class RoundClearScene extends Phaser.Scene {
  private result: ResultData = createFallbackResultData();
  private locked = false;

  constructor() {
    super('RoundClearScene');
  }

  init(data?: Partial<ResultData>): void {
    this.result = {
      ...createFallbackResultData(),
      ...(data ?? {}),
    };
  }

  create(): void {
    this.locked = false;
    this.draw();
    playSound('win');
    this.cameras.main.flash(220, 255, 224, 107, false);
    this.scale.on('resize', this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.draw, this);
    });
  }

  private draw(): void {
    this.children.removeAll();
    const { width, height } = this.scale;
    const centerX = width / 2;
    const nextStage = Math.min(this.result.stage + 1, STAGE_LIMIT);
    const nextOpponent = STAGE_OPPONENTS.find((opponent) => opponent.stage === nextStage);

    this.drawBackground(width, height);
    this.add
      .text(centerX, UI.safeTop + 22, `ラウンド${this.result.stage}クリア！`, {
        fontFamily: UI.fontFamily,
        fontSize: `${Math.min(44, Math.max(31, width * 0.1))}px`,
        fontStyle: '900',
        color: '#ffe06b',
        stroke: '#2c1a12',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5, 0);

    const panelWidth = Math.min(width - 34, width > 700 ? 560 : 362);
    const panelHeight = Math.min(390, height - UI.safeTop - UI.safeBottom - 168);
    const panelY = UI.safeTop + 108;
    this.drawPanel(centerX, panelY, panelWidth, panelHeight);

    this.add
      .text(centerX, panelY + 30, `${this.result.opponentName}に勝利！`, {
        fontFamily: UI.fontFamily,
        fontSize: `${width < 380 ? 19 : 23}px`,
        fontStyle: '900',
        color: '#2d2119',
        align: 'center',
        wordWrap: { width: panelWidth - 36 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, panelY + 84, this.getOpponentComment(), {
        fontFamily: UI.fontFamily,
        fontSize: `${width < 380 ? 15 : 17}px`,
        fontStyle: '900',
        color: '#7a321d',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: panelWidth - 46 },
      })
      .setOrigin(0.5, 0);

    this.drawVersusStrip(centerX, panelY + 168, panelWidth - 42);

    this.add
      .text(centerX, panelY + 238, nextOpponent ? `${nextOpponent.name}が立ちはだかる` : 'ついに最終結果へ', {
        fontFamily: UI.fontFamily,
        fontSize: `${width < 380 ? 15 : 17}px`,
        fontStyle: '900',
        color: '#2d2119',
        align: 'center',
        wordWrap: { width: panelWidth - 44 },
      })
      .setOrigin(0.5, 0);

    if (nextOpponent) {
      this.add
        .text(centerX, panelY + 284, nextOpponent.introText, {
          fontFamily: UI.fontFamily,
          fontSize: `${width < 380 ? 15 : 17}px`,
          fontStyle: '900',
          color: '#7a321d',
          align: 'center',
          wordWrap: { width: panelWidth - 44 },
        })
        .setOrigin(0.5, 0);
    }

    this.createButton(centerX, height - UI.safeBottom - 78, Math.min(width * 0.82, 330), `次のラウンドへ`, () => {
      if (this.locked) {
        return;
      }
      this.locked = true;
      this.scene.start('GameScene', { stage: nextStage });
    });
  }

  private getOpponentComment(): string {
    if (this.result.stage === 1) {
      return '「お前、意外と強いな……！」';
    }
    if (this.result.stage === 2) {
      return '「そのショット、認めるしかないな。」';
    }
    return '机の上に、静かな拍手が起きた。';
  }

  private drawBackground(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x24150f, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(COLORS.tableBase, 1);
    graphics.fillRoundedRect(16, 82, width - 32, height - 164, 10);
    graphics.lineStyle(4, COLORS.tableLine, 0.88);
    graphics.strokeRoundedRect(16, 82, width - 32, height - 164, 10);
    for (let y = 104; y < height - 92; y += 32) {
      graphics.lineStyle(2, COLORS.tableLight, 0.18);
      graphics.lineBetween(28, y, width - 28, y + Math.sin(y * 0.03) * 4);
    }
  }

  private drawPanel(centerX: number, y: number, width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paperShadow, 1);
    graphics.fillRoundedRect(centerX - width / 2 + 5, y + 6, width, height, UI.panelRadius);
    graphics.fillStyle(COLORS.paper, 1);
    graphics.fillRoundedRect(centerX - width / 2, y, width, height, UI.panelRadius);
    graphics.lineStyle(3, 0x3a2417, 0.9);
    graphics.strokeRoundedRect(centerX - width / 2, y, width, height, UI.panelRadius);
  }

  private drawVersusStrip(centerX: number, y: number, width: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2d2119, 1);
    graphics.fillRect(centerX - width / 2, y, width, 44);
    graphics.lineStyle(3, 0xffe28a, 0.85);
    graphics.strokeRect(centerX - width / 2, y, width, 44);
    this.add
      .text(centerX, y + 22, `HEISEI  WIN  vs  ${this.result.opponentName}`, {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '900',
        color: '#ffe28a',
        align: 'center',
      })
      .setOrigin(0.5);
  }

  private createButton(x: number, y: number, width: number, label: string, onClick: () => void): void {
    const height = Math.max(UI.minButtonHeight, 58);
    const button = this.add.container(x, y);
    const shadow = this.add.rectangle(4, 6, width, height, 0x5d321f, 1).setOrigin(0.5);
    const face = this.add.rectangle(0, 0, width, height, 0xffd65b, 1).setOrigin(0.5);
    face.setStrokeStyle(4, 0x3b2416);
    const text = this.add.text(0, 0, label, { fontFamily: UI.fontFamily, fontSize: '22px', fontStyle: '900', color: '#2b1a11' }).setOrigin(0.5);
    button.add([shadow, face, text]);
    const hitZone = this.add.zone(x, y, width, height + 10).setInteractive({ useHandCursor: true });
    hitZone.setDepth(100);
    hitZone.on('pointerdown', () => button.setY(y + 3));
    hitZone.on('pointerout', () => button.setY(y));
    hitZone.on('pointerup', () => {
      button.setY(y);
      playSound('tap');
      onClick();
    });
  }
}
