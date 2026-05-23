import Phaser from 'phaser';
import { COLORS, GAME_TITLE, GAME_URL, HASHTAGS, OFFICIAL_SITE_URL, UI, WORLD } from '../constants';
import type { ResultData, ResultImageData, ResultType } from '../types';
import { playSound } from '../utils/audio';
import { markResultImageSaved } from '../utils/progress';
import { createFallbackResultData } from '../utils/result';
import { isSmallPhoneViewport } from '../utils/viewport';

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
    const centerX = WORLD.centerX;
    const isWide = width >= 760;
    const isCompact = isSmallPhoneViewport() || (height < 780 && !isWide);
    const panelWidth = Math.min(width - 32, isWide ? 900 : 366);
    const accent = accentByType[this.result.resultType] ?? accentByType.draw;

    this.drawBackground(width, height, accent);
    let cursorY = UI.safeTop + (isCompact ? 6 : 16);

    const title = this.add
      .text(centerX, cursorY, resultLabels[this.result.resultType], {
        fontFamily: UI.fontFamily,
        fontSize: `${isCompact ? 36 : Math.min(50, Math.max(39, width * 0.13))}px`,
        fontStyle: '900',
        color: accent.title,
        stroke: '#2c1a12',
        strokeThickness: 8,
      })
      .setOrigin(0.5, 0);
    cursorY += title.displayHeight + (isCompact ? 4 : 10);

    this.add
      .text(centerX, cursorY, resultOneLiners[this.result.resultType], {
        fontFamily: UI.fontFamily,
        fontSize: isCompact ? '13px' : '15px',
        fontStyle: '900',
        color: '#fff8dc',
        stroke: '#3a2417',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: panelWidth - 24 },
      })
      .setOrigin(0.5, 0);
    cursorY += isCompact ? 30 : 38;

    const titleCard = this.drawTitleCard(centerX, cursorY, isWide ? Math.min(620, panelWidth) : panelWidth, accent);
    cursorY += Number(titleCard.getData('layoutHeight') ?? 102) + (isCompact ? 12 : 18);
    let statsCard: Phaser.GameObjects.Container;
    let shareCard: Phaser.GameObjects.Container;
    if (isWide) {
      const cardWidth = (panelWidth - 24) / 2;
      const contentY = cursorY;
      statsCard = this.drawStatsPanel(centerX - cardWidth / 2 - 12, contentY, cardWidth);
      shareCard = this.drawShareCard(centerX + cardWidth / 2 + 12, contentY, cardWidth);
      cursorY = contentY + Math.max(Number(statsCard.getData('layoutHeight') ?? 0), Number(shareCard.getData('layoutHeight') ?? 0)) + 28;
    } else {
      statsCard = this.drawStatsPanel(centerX, cursorY, panelWidth);
      cursorY += Number(statsCard.getData('layoutHeight') ?? 154) + (isCompact ? 8 : 14);
      shareCard = this.drawShareCard(centerX, cursorY, panelWidth);
      cursorY += Number(shareCard.getData('layoutHeight') ?? 138) + (isCompact ? 16 : 24);
    }

    const gridWidth = Math.min(panelWidth, isWide ? 620 : 336);
    const halfWidth = (gridWidth - 10) / 2;
    const buttonHeight = Math.max(UI.minButtonHeight, 54);
    const rowGap = isCompact ? 54 : 64;
    const buttonStartY = Math.max(cursorY, isWide ? height - UI.safeBottom - 246 : cursorY);
    const textY = buttonStartY + buttonHeight / 2;
    const imageY = textY + rowGap;
    const retryY = imageY + rowGap;

    this.copyButton = this.createButton(centerX - halfWidth / 2 - 5, textY, halfWidth, '結果をコピー', 0xf7ead0, () => {
      void this.copyResult();
    });
    this.createButton(centerX + halfWidth / 2 + 5, textY, halfWidth, '結果画像を保存', 0xf4d7a3, () => {
      void this.saveResultImage();
    });
    this.createButton(centerX - halfWidth / 2 - 5, imageY, halfWidth, 'スマホで共有', 0xd8f2c6, () => {
      void this.shareResultImage();
    });
    this.createButton(centerX + halfWidth / 2 + 5, imageY, halfWidth, 'もう一度挑戦', 0xffd65b, () => {
      if (this.transitionLocked) {
        return;
      }

      this.transitionLocked = true;
      this.scene.start('GameScene', { stage: 1 });
    });

    this.createButton(centerX, retryY, gridWidth, 'タイトルへ戻る', 0xf7ead0, () => {
      if (this.transitionLocked) {
        return;
      }

      this.transitionLocked = true;
      this.scene.start('TitleScene');
    });

    this.feedbackText = this.add
      .text(centerX, Math.max(cursorY - 18, textY - 32), '', {
        fontFamily: UI.fontFamily,
        fontSize: '13px',
        fontStyle: '900',
        color: '#ffe28a',
        align: 'center',
        wordWrap: { width: panelWidth },
      })
      .setOrigin(0.5);

    this.createOfficialLink(centerX, Math.min(height - UI.safeBottom - 12, retryY + rowGap - 10), Math.min(width * 0.82, 330));
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
    const height = isSmallPhoneViewport() || (this.scale.height < 780 && this.scale.width < 760) ? 92 : 102;
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
    const opponent = this.add
      .text(0, 53, `ROUND ${this.result.stage}/${this.result.stageMax}  vs ${this.result.opponentName}`, {
        fontFamily: UI.fontFamily,
        fontSize: '11px',
        fontStyle: '900',
        color: '#7a3a1e',
        align: 'center',
        wordWrap: { width: width - 34 },
      })
      .setOrigin(0.5);
    const title = this.add
      .text(0, 74, this.result.title, {
        fontFamily: UI.fontFamily,
        fontSize: width > 520 ? '22px' : '21px',
        fontStyle: '900',
        color: '#2d2119',
        align: 'center',
        wordWrap: { width: width - 34 },
      })
      .setOrigin(0.5);

    container.add([shadow, paper, badge, badgeText, opponent, title]);
    container.setData('layoutHeight', height);
    if (this.result.dangerScore >= 78 && height >= 102) {
      const danger = this.add
        .text(0, 94, '落ちそうで落ちない机上残留', {
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
    const compact = isSmallPhoneViewport() || (this.scale.height < 780 && this.scale.width < 760);
    const height = compact ? 132 : 176;
    const shadow = this.add.rectangle(4, 5, width, height, COLORS.paperShadow, 1).setOrigin(0.5, 0);
    const paper = this.add.rectangle(0, 0, width, height, COLORS.paper, 1).setOrigin(0.5, 0);
    paper.setStrokeStyle(2, 0xd8b8a0, 0.9);

    const rows = [
      ['総合スコア', `${this.result.scoreResult.score.toLocaleString('ja-JP')}点`],
      ['ランク', `${this.result.scoreResult.rank}${this.result.scoreResult.isBestScore ? ' / ベスト更新!' : ''}`],
      ['対戦', `${this.result.stage} / ${this.result.stageMax}  ${this.result.opponentName}`],
      ['ポイント', `${this.result.playerPoints} - ${this.result.cpuPoints}`],
      ['ギリギリ度', `${this.result.dangerScore}%`],
      ['評価', this.result.shotGradeLabel],
    ];

    container.add([shadow, paper]);
    rows.forEach(([label, value], index) => {
      const rowY = (compact ? 13 : 18) + index * (compact ? 21 : 26);
      const labelText = this.add
        .text(-width / 2 + 24, rowY, label, {
          fontFamily: UI.fontFamily,
          fontSize: compact || width < 300 ? '11px' : '13px',
          fontStyle: '900',
          color: '#5a3824',
        })
        .setOrigin(0, 0.5);
      const valueText = this.add
        .text(width / 2 - 24, rowY, value, {
          fontFamily: UI.fontFamily,
          fontSize: compact || width < 300 ? '12px' : '15px',
          fontStyle: '900',
          color: '#2d2119',
          align: 'right',
          wordWrap: { width: width * 0.58 },
        })
        .setOrigin(1, 0.5);
      container.add([labelText, valueText]);
    });

    container.setData('layoutHeight', height);
    return container;
  }

  private drawShareCard(centerX: number, y: number, width: number): Phaser.GameObjects.Container {
    const container = this.add.container(centerX, y);
    const compact = isSmallPhoneViewport() || (this.scale.height < 780 && this.scale.width < 760);
    const height = compact ? 112 : 184;
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
      .text(0, compact ? 34 : 42, this.result.summary, {
        fontFamily: UI.fontFamily,
        fontSize: compact ? '12px' : '15px',
        fontStyle: '900',
        color: '#fff8dc',
        align: 'center',
        wordWrap: { width: width - 34 },
      })
      .setOrigin(0.5, 0);
    const achieved = this.result.missions.filter((item) => item.achieved).slice(0, compact ? 1 : 2);
    const missionLine = achieved.length > 0 ? `達成: ${achieved.map((item) => item.mission.title).join(' / ')}` : `称号: ${this.result.unlockedBadgeCount}種  ミッション: ${this.result.achievedMissionCount}/${this.result.missionTotal}`;
    const missions = this.add
      .text(0, compact ? 64 : 96, missionLine, {
        fontFamily: UI.fontFamily,
        fontSize: compact ? '10px' : '12px',
        fontStyle: '900',
        color: '#ffe28a',
        align: 'center',
        wordWrap: { width: width - 34 },
      })
      .setOrigin(0.5, 0);
    const sharePreview = this.add
      .text(0, compact ? 86 : 128, this.buildSharePreview(), {
        fontFamily: UI.fontFamily,
        fontSize: compact ? '8px' : '10px',
        fontStyle: '800',
        color: '#e9d8ba',
        align: 'center',
        lineSpacing: 2,
        wordWrap: { width: width - 32 },
      })
      .setOrigin(0.5, 0);

    container.add([background, heading, summary, missions, sharePreview]);
    container.setData('layoutHeight', height);
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
    const fontSize = width < 150 ? '13px' : width < 180 ? '15px' : '20px';
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

  private async saveResultImage(): Promise<void> {
    try {
      const blob = await this.createResultImageBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eraser-battle-result-stage-${this.result.stage}.png`;
      anchor.style.display = 'none';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      markResultImageSaved();
      playSound('copy');
      this.showFeedback('結果画像を保存しました');
    } catch {
      playSound('lose');
      this.showFeedback('画像保存に失敗しました。通常のスクリーンショットをご利用ください。');
    }
  }

  private async shareResultImage(): Promise<void> {
    if (typeof navigator.share !== 'function') {
      await this.copyResult();
      this.showFeedback('この端末では画像共有に対応していません。結果コピーをご利用ください。');
      return;
    }

    try {
      const blob = await this.createResultImageBlob();
      const file = new File([blob], 'eraser-battle-result.png', { type: 'image/png' });
      const shareData: ShareData = {
        title: GAME_TITLE.replace('\n', ''),
        text: this.result.shareText,
        files: [file],
      };
      const canShare = (navigator as Navigator & { canShare?: (data: ShareData) => boolean }).canShare;
      if (!canShare) {
        await this.shareResult();
        this.showFeedback('画像共有の確認ができないため、テキスト共有に切り替えました。');
        return;
      }
      if (!canShare.call(navigator, shareData)) {
        await this.shareResult();
        this.showFeedback('この端末では画像共有に対応していません。テキスト共有に切り替えました。');
        return;
      }
      await navigator.share(shareData);
      markResultImageSaved();
      this.showFeedback('画像共有を開きました');
    } catch {
      this.showFeedback('画像共有に失敗しました。通常のスクリーンショットをご利用ください。');
    }
  }

  private createResultImageBlob(): Promise<Blob> {
    const imageData: ResultImageData = {
      title: GAME_TITLE.replace('\n', ''),
      resultTitle: resultLabels[this.result.resultType] ?? '結果発表',
      badge: this.result.title,
      opponentName: this.result.opponentName,
      reachedStage: this.result.stage,
      dangerScore: this.result.dangerScore,
      shotGradeLabel: this.result.shotGradeLabel,
      score: this.result.scoreResult.score,
      rank: this.result.scoreResult.rank,
      isBestScore: this.result.scoreResult.isBestScore,
      missions: this.result.missions.filter((item) => item.achieved).slice(0, 3).map((item) => item.mission.title),
      summary: this.result.summary,
      shareText: this.result.shareText,
    };
    const canvas = this.createResultCardCanvas(imageData);
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          reject(new Error('Result image blob was empty.'));
        }, 'image/png');
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Result image capture failed.'));
      }
    });
  }

  private createResultCardCanvas(data: ResultImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context was not available.');
    }

    context.fillStyle = '#2b1b12';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#a86a35';
    this.roundRect(context, 64, 72, 952, 1206, 28);
    context.fill();

    context.strokeStyle = '#3d2f24';
    context.lineWidth = 12;
    this.roundRect(context, 64, 72, 952, 1206, 28);
    context.stroke();

    context.fillStyle = '#fff8dc';
    context.font = '900 52px sans-serif';
    context.textAlign = 'center';
    context.fillText(data.title, 540, 162);

    context.fillStyle = '#ffe06b';
    context.font = '900 118px sans-serif';
    context.fillText(data.resultTitle, 540, 300);

    context.fillStyle = '#f6ead0';
    this.roundRect(context, 126, 362, 828, 190, 18);
    context.fill();
    context.strokeStyle = '#3d2f24';
    context.lineWidth = 8;
    this.roundRect(context, 126, 362, 828, 190, 18);
    context.stroke();
    context.fillStyle = '#7a321d';
    context.font = '900 36px sans-serif';
    context.fillText('称号', 540, 416);
    context.fillStyle = '#2d2119';
    context.font = '900 54px sans-serif';
    this.drawCanvasWrappedText(context, data.badge, 540, 486, 760, 60);

    const stats = [
      ['総合スコア', `${data.score.toLocaleString('ja-JP')}点`],
      ['評価ランク', `${data.rank}${data.isBestScore ? ' / ベスト更新!' : ''}`],
      ['到達ラウンド', `${data.reachedStage} / 3`],
      ['対戦相手', data.opponentName],
      ['ギリギリ度', `${data.dangerScore}%`],
      ['ショット評価', data.shotGradeLabel],
    ];
    context.textAlign = 'left';
    stats.forEach(([label, value], index) => {
      const y = 598 + index * 58;
      context.fillStyle = '#f6ead0';
      this.roundRect(context, 126, y - 38, 828, 48, 10);
      context.fill();
      context.fillStyle = '#5a3824';
      context.font = '900 23px sans-serif';
      context.fillText(label, 162, y - 10);
      context.fillStyle = '#2d2119';
      context.font = '900 27px sans-serif';
      context.fillText(value, 430, y - 10);
    });

    context.fillStyle = '#2d2119';
    this.roundRect(context, 126, 920, 828, 192, 16);
    context.fill();
    context.fillStyle = '#ffe28a';
    context.font = '900 30px sans-serif';
    context.fillText('結果サマリー', 162, 970);
    context.fillStyle = '#fff8dc';
    context.font = '800 34px sans-serif';
    this.drawCanvasWrappedText(context, data.summary, 162, 1030, 760, 42, 'left');
    context.fillStyle = '#e9d8ba';
    context.font = '800 26px sans-serif';
    this.drawCanvasWrappedText(context, data.shareText.split('\n').filter(Boolean)[0] ?? data.summary, 162, 1098, 760, 34, 'left');
    if (data.missions.length > 0) {
      context.fillStyle = '#ffe28a';
      context.font = '900 24px sans-serif';
      this.drawCanvasWrappedText(context, `達成ミッション：${data.missions.join(' / ')}`, 162, 1160, 760, 30, 'left');
    }

    context.fillStyle = '#fff8dc';
    context.font = '900 30px sans-serif';
    context.textAlign = 'center';
    context.fillText(HASHTAGS.join(' '), 540, 1212);
    context.font = '800 28px sans-serif';
    context.fillText(GAME_URL, 540, 1254);

    return canvas;
  }

  private drawCanvasWrappedText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    align: CanvasTextAlign = 'center',
  ): void {
    const chars = text.replace(/\n/g, '').split('');
    let line = '';
    let lineY = y;
    context.textAlign = align;
    chars.forEach((char) => {
      const next = line + char;
      if (context.measureText(next).width > maxWidth && line) {
        context.fillText(line, x, lineY);
        line = char;
        lineY += lineHeight;
        return;
      }
      line = next;
    });
    if (line) {
      context.fillText(line, x, lineY);
    }
  }

  private roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
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
