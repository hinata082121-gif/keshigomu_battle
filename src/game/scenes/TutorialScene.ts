import Phaser from 'phaser';
import { COLORS, ERASER, SHOT, UI, WORLD } from '../constants';
import { playSound } from '../utils/audio';
import { isSmallPhoneViewport } from '../utils/viewport';

const tutorialSteps = [
  {
    title: '消しゴムをスワイプ！',
    body: '自分の消しゴムをタッチして、\n飛ばしたい方向へスワイプしよう。',
  },
  {
    title: '強さを調整！',
    body: '長くスワイプすると強ショット。\n短くスワイプすると安全ショット。',
  },
  {
    title: '相手を机から落とせ！',
    body: '相手を机の外へ落とせば勝利。\n自分が落ちると負け！',
  },
];

export class TutorialScene extends Phaser.Scene {
  private stepIndex = 0;

  constructor() {
    super('TutorialScene');
  }

  init(): void {
    this.stepIndex = 0;
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
    const isCompact = isSmallPhoneViewport() || height <= 760;
    this.drawBackground(width, height);
    const step = tutorialSteps[this.stepIndex] ?? tutorialSteps[0];

    this.add
      .text(centerX, UI.safeTop + 20, '遊び方', {
        fontFamily: UI.fontFamily,
        fontSize: `${isCompact ? 30 : Math.min(42, Math.max(32, width * 0.1))}px`,
        fontStyle: '900',
        color: '#fff4cf',
        stroke: '#3c2415',
        strokeThickness: 8,
      })
      .setOrigin(0.5, 0);
    this.add
      .text(centerX, UI.safeTop + (isCompact ? 64 : 76), `${this.stepIndex + 1} / ${tutorialSteps.length}`, {
        fontFamily: UI.fontFamily,
        fontSize: '16px',
        fontStyle: '900',
        color: '#ffe28a',
        stroke: '#3c2415',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);

    const panelWidth = Math.min(width - 34, width > 700 ? 590 : 360);
    const panelY = UI.safeTop + (isCompact ? 86 : 96);
    const cardHeight = Math.min(height - panelY - UI.safeBottom - (isCompact ? 116 : 104), isCompact ? 368 : 460);
    this.drawPanel(centerX, panelY, panelWidth, cardHeight);
    this.drawTutorialDesk(centerX, panelY + (isCompact ? 24 : 36), panelWidth - 44, Math.min(isCompact ? 156 : 210, cardHeight * 0.45), this.stepIndex);

    this.add
      .text(centerX, panelY + Math.min(isCompact ? 196 : 268, cardHeight * (isCompact ? 0.54 : 0.57)), step.title, {
        fontFamily: UI.fontFamily,
        fontSize: `${isCompact ? 22 : width < 380 ? 21 : 24}px`,
        fontStyle: '900',
        color: '#2d2119',
        align: 'center',
        wordWrap: { width: panelWidth - 46 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, panelY + Math.min(isCompact ? 240 : 320, cardHeight * (isCompact ? 0.66 : 0.69)), step.body, {
        fontFamily: UI.fontFamily,
        fontSize: `${isCompact ? 18 : width < 380 ? 16 : 18}px`,
        fontStyle: '800',
        color: '#30231b',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: panelWidth - 52 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, panelY + cardHeight - 34, tutorialSteps.map((_, index) => (index === this.stepIndex ? '●' : '○')).join('  '), {
        fontFamily: UI.fontFamily,
        fontSize: '16px',
        fontStyle: '900',
        color: '#7a321d',
      })
      .setOrigin(0.5);

    const hintY = Math.min(height - UI.safeBottom - 140, panelY + cardHeight + 12);
    const hintBackground = this.add.rectangle(centerX, hintY + 14, Math.min(panelWidth, 340), 32, 0x2d2119, 0.88).setOrigin(0.5);
    hintBackground.setStrokeStyle(2, 0xffe28a, 0.5);
    this.add
      .text(centerX, hintY, `短いスワイプで安全 / 長いほど強い / 最大 POWER ${Math.round((SHOT.maxPower / 10) * 10)}`, {
        fontFamily: UI.fontFamily,
        fontSize: isCompact ? '11px' : '12px',
        fontStyle: '900',
        color: '#fff8dc',
        align: 'center',
        wordWrap: { width: panelWidth - 22 },
      })
      .setOrigin(0.5, 0);

    this.createTextButton(width - UI.safeX - 46, UI.safeTop + 30, 'スキップ', () => {
      this.scene.start('StrategySelectScene', { stage: 1 });
    });

    this.createButton(centerX, height - UI.safeBottom - (isCompact ? 62 : 72), Math.min(width * 0.82, 330), this.stepIndex === tutorialSteps.length - 1 ? '勝負開始！' : '次へ', () => {
      if (this.stepIndex < tutorialSteps.length - 1) {
        this.stepIndex += 1;
        this.draw();
        return;
      }
      this.scene.start('StrategySelectScene', { stage: 1 });
    });
  }

  private drawBackground(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.floor, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(COLORS.tableDark, 1);
    graphics.fillRect(0, Math.max(142, height * 0.21), width, height);
    for (let x = 0; x < width; x += 42) {
      graphics.lineStyle(1, 0xffe2a3, 0.12);
      graphics.lineBetween(x, 0, x + Math.sin(x) * 4, height);
    }
  }

  private drawPanel(centerX: number, y: number, width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paperShadow, 1);
    graphics.fillRoundedRect(centerX - width / 2 + 5, y + 6, width, height, UI.panelRadius);
    graphics.fillStyle(COLORS.paper, 1);
    graphics.fillRoundedRect(centerX - width / 2, y, width, height, UI.panelRadius);
    graphics.lineStyle(3, 0x3a2417, 0.86);
    graphics.strokeRoundedRect(centerX - width / 2, y, width, height, UI.panelRadius);
  }

  private drawTutorialDesk(centerX: number, y: number, width: number, height: number, stepIndex: number): void {
    const graphics = this.add.graphics();
    const left = centerX - width / 2;
    graphics.fillStyle(COLORS.tableBase, 1);
    graphics.fillRoundedRect(left, y, width, height, 8);
    graphics.lineStyle(4, COLORS.tableLine, 0.85);
    graphics.strokeRoundedRect(left, y, width, height, 8);
    graphics.fillStyle(0xfff8dc, 0.94);
    graphics.fillRect(centerX - ERASER.width / 2, y + height - 72, ERASER.width, ERASER.height);
    graphics.fillStyle(COLORS.player, 1);
    graphics.fillRect(centerX - ERASER.width / 2 + 8, y + height - 64, ERASER.width - 16, ERASER.height - 16);
    graphics.fillStyle(COLORS.cpu, 1);
    graphics.fillRect(centerX - ERASER.width / 2, y + 34, ERASER.width, ERASER.height);
    const arrowLength = stepIndex === 1 ? 78 : 54;
    const arrowEndY = y + height - 50 - arrowLength;
    graphics.lineStyle(stepIndex === 1 ? 10 : 7, 0x3d2417, 0.42);
    graphics.lineBetween(centerX, y + height - 50, centerX + 46, arrowEndY);
    graphics.lineStyle(stepIndex === 1 ? 6 : 4, stepIndex === 2 ? 0xff7055 : 0xfff0a5, 0.92);
    graphics.lineBetween(centerX, y + height - 50, centerX + 46, arrowEndY);
    graphics.fillStyle(stepIndex === 2 ? 0xff7055 : 0xfff0a5, 0.92);
    graphics.fillTriangle(centerX + 46, arrowEndY, centerX + 28, arrowEndY + 10, centerX + 43, arrowEndY + 24);
    if (stepIndex === 2) {
      graphics.lineStyle(4, 0xff7055, 0.78);
      graphics.strokeCircle(centerX, y + 55, 42);
    }
    this.add.text(centerX, y + height - 51, 'HEISEI', { fontFamily: UI.fontFamily, fontSize: '11px', fontStyle: '900', color: '#211714' }).setOrigin(0.5);
    this.add.text(centerX, y + 55, 'CPU', { fontFamily: UI.fontFamily, fontSize: '11px', fontStyle: '900', color: '#211714' }).setOrigin(0.5);
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

  private createTextButton(x: number, y: number, label: string, onClick: () => void): void {
    const width = 92;
    const height = 38;
    const background = this.add.rectangle(x, y, width, height, 0x2d2119, 0.84).setOrigin(0.5);
    background.setStrokeStyle(2, 0xffe28a, 0.58);
    const text = this.add
      .text(x, y, label, {
        fontFamily: UI.fontFamily,
        fontSize: '13px',
        fontStyle: '900',
        color: '#fff8dc',
      })
      .setOrigin(0.5);
    const hitZone = this.add.zone(x, y, width + 10, height + 10).setInteractive({ useHandCursor: true });
    hitZone.setDepth(100);
    hitZone.on('pointerup', () => {
      playSound('tap');
      onClick();
    });
    background.setDepth(90);
    text.setDepth(91);
  }
}
