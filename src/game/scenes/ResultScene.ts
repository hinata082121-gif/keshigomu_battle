import Phaser from 'phaser';
import { COLORS, GAME_TITLE, OFFICIAL_SITE_URL, UI } from '../constants';
import type { ResultData, ResultType } from '../types';
import { playSound } from '../utils/audio';
import { createFallbackResultData } from '../utils/result';

type ResultButton = {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  hitZone: Phaser.GameObjects.Zone;
};

type IntroTarget = Phaser.GameObjects.Container | Phaser.GameObjects.Text;

const resultLabels: Record<ResultType, string> = {
  win: '勝利！',
  lose: '敗北…',
  selfDestruct: '自爆！',
  doubleOut: '両落ち！',
  judgeWin: '判定勝ち！',
  judgeLose: '判定負け…',
  draw: '引き分け',
};

const resultOneLiners: Record<ResultType, string> = {
  win: '机の上で天下を取った',
  lose: '次の休み時間で取り返そう',
  selfDestruct: '勢いだけは学年トップ',
  doubleOut: '教室がざわつく道連れ決着',
  judgeWin: '最後まで残った者が強い',
  judgeLose: '粘ったけど端っこが近かった',
  draw: '決着は次の休み時間へ',
};

const accentByType: Record<ResultType, { title: string; badge: number; background: number; card: number }> = {
  win: { title: '#ffe06b', badge: 0xffd65b, background: 0x2b1b12, card: COLORS.tableBase },
  lose: { title: '#a9d1ff', badge: 0x83aee8, background: 0x171412, card: 0x86572f },
  selfDestruct: { title: '#ffb86b', badge: 0xff9c45, background: 0x24120f, card: 0xa8642d },
  doubleOut: { title: '#ffd07a', badge: 0xffa84d, background: 0x22140f, card: 0xa56432 },
  judgeWin: { title: '#e8dc80', badge: 0xd7c85b, background: 0x1b1911, card: 0x9b6938 },
  judgeLose: { title: '#b9c9ef', badge: 0x9aa9cf, background: 0x17171d, card: 0x795432 },
  draw: { title: '#fff3cc', badge: 0xd6c2a1, background: 0x1b1714, card: 0x926337 },
};

export class ResultScene extends Phaser.Scene {
  private result: ResultData = createFallbackResultData();
  private transitionLocked = false;
  private feedbackText?: Phaser.GameObjects.Text;
  private copyButton?: ResultButton;

  constructor() {
    super('ResultScene');
  }

  init(data?: Partial<ResultData>): void {
    this.result = {
      ...createFallbackResultData(),
      ...(data ?? {}),
    };
  }

  create(): void {
    this.transitionLocked = false;
    this.draw();
    playSound(this.result.winner === 'player' ? 'win' : this.result.winner === 'cpu' ? 'lose' : 'tap');
    this.scale.on('resize', this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.draw, this);
    });
  }

  private draw(): void {
    this.children.removeAll();
    this.copyButton = undefined;
    const { width, height } = this.scale;
    const centerX = width / 2;
    const panelWidth = Math.min(width - 32, 366);
    const accent = accentByType[this.result.resultType] ?? accentByType.draw;
    const canUseNativeShare = typeof navigator.share === 'function';

    this.drawBackground(width, height, accent);

    const title = this.add
      .text(centerX, UI.safeTop + 18, resultLabels[this.result.resultType], {
        fontFamily: UI.fontFamily,
        fontSize: `${Math.min(50, Math.max(39, width * 0.13))}px`,
        fontStyle: '900',
        color: accent.title,
        stroke: '#2c1a12',
        strokeThickness: 8,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, UI.safeTop + 78, resultOneLiners[this.result.resultType], {
        fontFamily: UI.fontFamily,
        fontSize: '15px',
        fontStyle: '900',
        color: '#fff8dc',
        stroke: '#3a2417',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: panelWidth - 24 },
      })
      .setOrigin(0.5, 0);

    const titleCard = this.drawTitleCard(centerX, UI.safeTop + 122, panelWidth, accent);
    const statsY = UI.safeTop + 246;
    const statsCard = this.drawStatsPanel(centerX, statsY, panelWidth);
    const shareY = statsY + 132;
    const shareCard = this.drawShareCard(centerX, shareY, panelWidth);

    const buttonWidth = Math.min(panelWidth, 336);
    const secondaryY = height - UI.safeBottom - 150;
    const retryY = height - UI.safeBottom - 82;
    if (canUseNativeShare && width >= 360) {
      const halfWidth = (buttonWidth - 10) / 2;
      this.copyButton = this.createButton(centerX - halfWidth / 2 - 5, secondaryY, halfWidth, '結果をコピー', 0xf7ead0, () => {
        void this.copyResult();
      });
      this.createButton(centerX + halfWidth / 2 + 5, secondaryY, halfWidth, 'スマホで共有', 0xcfe9ff, () => {
        void this.shareResult();
      });
    } else {
      this.copyButton = this.createButton(centerX, secondaryY, buttonWidth, '結果をコピー', 0xf7ead0, () => {
        void this.copyResult();
      });
    }

    this.createButton(centerX, retryY, buttonWidth, 'もう一度遊ぶ', 0xffd65b, () => {
      if (this.transitionLocked) {
        return;
      }

      this.transitionLocked = true;
      this.scene.start('GameScene');
    });

    this.feedbackText = this.add
      .text(centerX, height - UI.safeBottom - 204, '', {
        fontFamily: UI.fontFamily,
        fontSize: '13px',
        fontStyle: '900',
        color: '#ffe28a',
        align: 'center',
      })
      .setOrigin(0.5);

    this.createOfficialLink(centerX, height - UI.safeBottom - 24, Math.min(width * 0.82, 330));
    this.playIntroTweens(title, titleCard, statsCard, shareCard);
  }

  private drawBackground(width: number, height: number, accent: { background: number; card: number }): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(accent.background, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(accent.card, 1);
    graphics.fillRoundedRect(16, 76, width - 32, height - 138, 10);
    graphics.lineStyle(4, COLORS.tableLine, 0.88);
    graphics.strokeRoundedRect(16, 76, width - 32, height - 138, 10);

    for (let y = 102; y < height - 82; y += 30) {
      graphics.lineStyle(2, y % 60 === 0 ? COLORS.tableLight : COLORS.tableDark, 0.2);
      graphics.lineBetween(28, y, width - 28, y + Math.sin(y * 0.03) * 4);
    }

    if (this.result.resultType === 'selfDestruct' || this.result.resultType === 'doubleOut') {
      graphics.lineStyle(3, 0xffd27b, 0.26);
      for (let i = 0; i < 9; i += 1) {
        const x = 42 + i * ((width - 84) / 8);
        graphics.lineBetween(x - 8, 116 + (i % 3) * 18, x + 8, 132 + (i % 3) * 18);
        graphics.lineBetween(x + 8, 116 + (i % 3) * 18, x - 8, 132 + (i % 3) * 18);
      }
    }
  }

  private drawTitleCard(centerX: number, y: number, width: number, accent: { badge: number }): Phaser.GameObjects.Container {
    const container = this.add.container(centerX, y);
    const height = 102;
    const shadow = this.add.rectangle(4, 6, width, height, 0x4b2819, 0.9).setOrigin(0.5, 0);
    const paper = this.add.rectangle(0, 0, width, height, COLORS.paper, 1).setOrigin(0.5, 0);
    paper.setStrokeStyle(3, 0x3a2417, 0.9);
    const badge = this.add.rectangle(0, 18, Math.min(width - 88, 188), 28, accent.badge, 1).setOrigin(0.5, 0);
    badge.setStrokeStyle(2, 0x3a2417, 0.8);
    const badgeText = this.add
      .text(0, 32, this.result.badge, {
        fontFamily: UI.fontFamily,
        fontSize: '13px',
        fontStyle: '900',
        color: '#2b1a11',
      })
      .setOrigin(0.5);
    const title = this.add
      .text(0, 57, this.result.title, {
        fontFamily: UI.fontFamily,
        fontSize: '23px',
        fontStyle: '900',
        color: '#2d2119',
        align: 'center',
        wordWrap: { width: width - 34 },
      })
      .setOrigin(0.5);

    container.add([shadow, paper, badge, badgeText, title]);
    if (this.result.dangerScore >= 78) {
      const danger = this.add
        .text(0, 84, '落ちそうで落ちない机上残留', {
          fontFamily: UI.fontFamily,
          fontSize: '12px',
          fontStyle: '900',
          color: '#7a3a1e',
        })
        .setOrigin(0.5);
      container.add(danger);
    }

    return container;
  }

  private drawStatsPanel(centerX: number, y: number, width: number): Phaser.GameObjects.Container {
    const container = this.add.container(centerX, y);
    const height = 118;
    const shadow = this.add.rectangle(4, 5, width, height, COLORS.paperShadow, 1).setOrigin(0.5, 0);
    const paper = this.add.rectangle(0, 0, width, height, COLORS.paper, 1).setOrigin(0.5, 0);
    paper.setStrokeStyle(2, 0xd8b8a0, 0.9);

    const rows = [
      ['ラウンド', `${this.result.rounds} / ${this.result.maxRounds}`],
      ['ギリギリ度', `${this.result.dangerScore}%`],
      ['ショット評価', this.result.shotGradeLabel],
    ];

    container.add([shadow, paper]);
    rows.forEach(([label, value], index) => {
      const rowY = 24 + index * 34;
      const labelText = this.add
        .text(-width / 2 + 24, rowY, label, {
          fontFamily: UI.fontFamily,
          fontSize: '15px',
          fontStyle: '900',
          color: '#5a3824',
        })
        .setOrigin(0, 0.5);
      const valueText = this.add
        .text(width / 2 - 24, rowY, value, {
          fontFamily: UI.fontFamily,
          fontSize: '18px',
          fontStyle: '900',
          color: '#2d2119',
        })
        .setOrigin(1, 0.5);
      container.add([labelText, valueText]);
    });

    const meterWidth = 96;
    const meterY = 74;
    const meterX = width / 2 - 24 - meterWidth / 2;
    const meterBack = this.add.rectangle(meterX, meterY, meterWidth, 7, 0x6d5c47, 1).setOrigin(0.5);
    const meterFill = this.add.rectangle(meterX - meterWidth / 2, meterY, meterWidth * (this.result.dangerScore / 100), 7, this.result.dangerScore >= 78 ? 0xff7055 : 0xffd65b, 1).setOrigin(0, 0.5);
    meterFill.setStrokeStyle(1, 0x3a2417, 0.4);
    container.add([meterBack, meterFill]);

    return container;
  }

  private drawShareCard(centerX: number, y: number, width: number): Phaser.GameObjects.Container {
    const container = this.add.container(centerX, y);
    const height = 154;
    const background = this.add.rectangle(0, 0, width, height, 0x2d2119, 0.9).setOrigin(0.5, 0);
    background.setStrokeStyle(2, 0xffe28a, 0.7);
    const heading = this.add
      .text(-width / 2 + 18, 16, '結果サマリー', {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '900',
        color: '#ffe28a',
      })
      .setOrigin(0, 0);
    const summary = this.add
      .text(0, 42, this.result.summary, {
        fontFamily: UI.fontFamily,
        fontSize: '15px',
        fontStyle: '900',
        color: '#fff8dc',
        align: 'center',
        wordWrap: { width: width - 34 },
      })
      .setOrigin(0.5, 0);
    const sharePreview = this.add
      .text(0, 96, this.buildSharePreview(), {
        fontFamily: UI.fontFamily,
        fontSize: '11px',
        fontStyle: '800',
        color: '#e9d8ba',
        align: 'center',
        lineSpacing: 2,
        wordWrap: { width: width - 32 },
      })
      .setOrigin(0.5, 0);

    container.add([background, heading, summary, sharePreview]);
    return container;
  }

  private buildSharePreview(): string {
    const lines = this.result.shareText.split('\n').filter(Boolean);
    return lines.slice(0, 3).join('\n');
  }

  private createButton(x: number, y: number, width: number, label: string, color: number, onClick: () => void): ResultButton {
    const height = Math.max(UI.minButtonHeight, 54);
    const container = this.add.container(x, y);
    const shadow = this.add.rectangle(4, 6, width, height, 0x4b2819, 1).setOrigin(0.5);
    const face = this.add.rectangle(0, 0, width, height, color, 1).setOrigin(0.5);
    face.setStrokeStyle(4, 0x2b1a11);
    const fontSize = width < 160 ? '16px' : '21px';
    const text = this.add
      .text(0, 0, label, {
        fontFamily: UI.fontFamily,
        fontSize,
        fontStyle: '900',
        color: '#2b1a11',
      })
      .setOrigin(0.5);
    container.add([shadow, face, text]);

    const hitZone = this.add.zone(x, y, width, height + 10).setInteractive({ useHandCursor: true });
    hitZone.setDepth(100);
    hitZone.on('pointerdown', () => container.setY(y + 3));
    hitZone.on('pointerout', () => container.setY(y));
    hitZone.on('pointerup', () => {
      container.setY(y);
      playSound('tap');
      onClick();
    });

    return { container, text, hitZone };
  }

  private createOfficialLink(centerX: number, y: number, width: number): void {
    const link = this.add
      .text(centerX, y, '公式サイトへ', {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '800',
        color: '#ffe9ad',
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const hitZone = this.add.zone(centerX, y, width, 42).setInteractive({ useHandCursor: true });
    hitZone.setDepth(100);
    const openOfficialSite = () => {
      playSound('tap');
      window.open(OFFICIAL_SITE_URL, '_blank', 'noopener,noreferrer');
    };
    link.on('pointerup', openOfficialSite);
    hitZone.on('pointerup', openOfficialSite);
  }

  private async copyResult(): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is not available.');
      }

      await navigator.clipboard.writeText(this.result.shareText);
      playSound('copy');
      this.showFeedback('コピーしました！');
      this.flashCopyLabel('コピーしました！');
    } catch {
      playSound('lose');
      this.showFeedback('コピーできない場合は共有文カードを長押し');
      this.flashCopyLabel('コピー失敗');
    }
  }

  private async shareResult(): Promise<void> {
    if (typeof navigator.share !== 'function') {
      this.showFeedback('共有非対応のためコピーを使ってください');
      return;
    }

    try {
      await navigator.share({
        title: GAME_TITLE.replace('\n', ''),
        text: this.result.shareText,
        url: OFFICIAL_SITE_URL,
      });
      this.showFeedback('共有画面を開きました');
    } catch {
      this.showFeedback('共有をキャンセルしました');
    }
  }

  private flashCopyLabel(label: string): void {
    if (!this.copyButton) {
      return;
    }

    this.copyButton.text.setText(label);
    this.time.delayedCall(1700, () => {
      this.copyButton?.text.setText('結果をコピー');
    });
  }

  private showFeedback(message: string): void {
    if (!this.feedbackText) {
      return;
    }

    this.feedbackText.setText(message);
    this.feedbackText.setAlpha(1);
    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      delay: 1500,
      duration: 360,
      ease: 'Sine.easeOut',
    });
  }

  private playIntroTweens(...targets: IntroTarget[]): void {
    targets.forEach((target, index) => {
      target.setAlpha(0);
      target.setY(target.y + 12);
      this.tweens.add({
        targets: target,
        alpha: 1,
        y: target.y - 12,
        duration: 300,
        delay: index * 70,
        ease: 'Sine.easeOut',
      });
    });

    if (this.result.resultType === 'selfDestruct' || this.result.resultType === 'doubleOut') {
      this.cameras.main.shake(180, 0.006);
    }
  }
}
