import Phaser from 'phaser';
import { COLORS, ENGLISH_TITLE, GAME_SUBTITLE, GAME_TITLE, OFFICIAL_SITE_URL, TITLE_COPY, UI, WORLD } from '../constants';
import { isMuted, playSound, toggleMuted } from '../utils/audio';
import { MISSIONS, loadPlayerProgress, pickRecommendedMission } from '../utils/progress';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
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
    const safeTop = UI.safeTop + 8;
    const safeBottom = UI.safeBottom + 12;
    const centerX = WORLD.centerX;

    this.drawDeskBackground(width, height);
    this.drawDecorativeErasers(width, height);

    this.add
      .text(centerX, safeTop + 20, GAME_TITLE, {
        fontFamily: UI.fontFamily,
        fontSize: `${Math.min(36, Math.max(29, width * 0.092))}px`,
        fontStyle: '900',
        color: '#fff4cf',
        align: 'center',
        stroke: '#3c2415',
        strokeThickness: 8,
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, safeTop + 126, ENGLISH_TITLE, {
        fontFamily: UI.fontFamily,
        fontSize: '15px',
        fontStyle: '900',
        color: '#2b1a11',
        backgroundColor: '#ffe081',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, safeTop + 172, GAME_SUBTITLE, {
        fontFamily: UI.fontFamily,
        fontSize: '18px',
        fontStyle: '900',
        color: '#fff8dc',
        align: 'center',
        stroke: '#4b2e1c',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const noteWidth = Math.min(width - 38, 354);
    const noteHeight = 154;
    const noteY = Math.max(safeTop + 208, height * 0.37);
    this.drawNotebook(centerX - noteWidth / 2, noteY, noteWidth, noteHeight);

    TITLE_COPY.forEach((line, index) => {
      this.add
        .text(centerX - noteWidth / 2 + 42, noteY + 30 + index * 38, `${index + 1}. ${line}`, {
          fontFamily: UI.fontFamily,
          fontSize: '17px',
          fontStyle: '800',
          color: '#30231b',
        })
        .setOrigin(0, 0.5);
    });

    const progress = loadPlayerProgress();
    const mission = pickRecommendedMission(progress);
    const progressY = noteY + noteHeight + 12;
    this.drawProgressCard(centerX, progressY, noteWidth, progress, mission.title);

    const buttonWidth = Math.min(width * 0.82, 330);
    const buttonY = Math.min(height - safeBottom - 108, progressY + 96);
    this.createButton(centerX, buttonY, buttonWidth, 'ゲーム開始', () => {
      this.scene.start('StoryScene');
    });

    const linkY = Math.min(height - safeBottom - 22, buttonY + 66);
    const link = this.add
      .text(centerX, linkY, '平成学校ゲームズ公式サイトへ', {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '800',
        color: '#ffe9ad',
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const linkHit = this.add.zone(centerX, linkY, Math.min(width * 0.82, 330), 44).setInteractive({ useHandCursor: true });
    linkHit.setDepth(100);

    const openOfficialSite = () => {
      playSound('tap');
      window.open(OFFICIAL_SITE_URL, '_blank', 'noopener,noreferrer');
    };
    link.on('pointerup', openOfficialSite);
    linkHit.on('pointerup', openOfficialSite);
    this.createMuteButton(width - UI.safeX - 22, safeTop + 10);
  }

  private drawDeskBackground(width: number, height: number): void {
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.floor).setDepth(-20);
    const wood = this.add.graphics();
    wood.fillStyle(COLORS.tableBase, 1);
    wood.fillRect(0, 0, width, height);

    for (let y = -20; y < height + 30; y += 34) {
      wood.lineStyle(2, y % 68 === 0 ? COLORS.tableLight : COLORS.tableDark, 0.22);
      wood.beginPath();
      wood.moveTo(0, y);
      for (let x = 0; x < width + 20; x += 30) {
        wood.lineTo(x, y + Math.sin((x + y) * 0.022) * 7);
      }
      wood.strokePath();
    }

    this.add
      .text(20, Math.max(270, height * 0.58), '2-B  休み時間  ←最強', {
        fontFamily: UI.fontFamily,
        fontSize: '15px',
        color: '#5b351e',
        fontStyle: '900',
      })
      .setAlpha(0.32)
      .setAngle(-7);
  }

  private drawDecorativeErasers(width: number, height: number): void {
    const graphics = this.add.graphics();
    const y = Math.min(height - 188, Math.max(214, height * 0.29));
    const leftX = Math.max(44, width * 0.18);
    const rightX = Math.min(width - 48, width * 0.82);
    this.drawMiniEraser(graphics, leftX, y, 0x67d9c5, 0x237d77, -9, 'HEISEI');
    this.drawMiniEraser(graphics, rightX, y + 18, 0xffcf5c, 0x9f5c21, 8, 'BATTLE');
  }

  private drawMiniEraser(graphics: Phaser.GameObjects.Graphics, x: number, y: number, main: number, dark: number, angleDeg: number, label: string): void {
    const angle = Phaser.Math.DegToRad(angleDeg);
    graphics.save();
    graphics.translateCanvas(x, y);
    graphics.rotateCanvas(angle);
    graphics.fillStyle(0x211714, 0.22);
    graphics.fillRect(-34, -15, 72, 34);
    graphics.fillStyle(dark, 1);
    graphics.fillRect(-36, -20, 72, 34);
    graphics.fillStyle(main, 1);
    graphics.fillRect(-32, -16, 64, 26);
    graphics.fillStyle(0xfff8dc, 0.92);
    graphics.fillRect(-20, -10, 40, 14);
    graphics.lineStyle(2, 0x211714, 0.45);
    graphics.strokeRect(-36, -20, 72, 34);
    graphics.restore();
    this.add
      .text(x, y - 7, label, {
        fontFamily: UI.fontFamily,
        fontSize: '9px',
        fontStyle: '900',
        color: '#211714',
      })
      .setOrigin(0.5)
      .setAngle(angleDeg)
      .setAlpha(0.88);
  }

  private drawNotebook(x: number, y: number, width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paperShadow, 1);
    graphics.fillRoundedRect(x + 4, y + 5, width, height, UI.panelRadius);
    graphics.fillStyle(COLORS.paper, 1);
    graphics.fillRoundedRect(x, y, width, height, UI.panelRadius);
    graphics.lineStyle(2, 0xd8b8a0, 0.9);

    for (let lineY = y + 28; lineY < y + height - 14; lineY += 30) {
      graphics.lineBetween(x + 18, lineY, x + width - 18, lineY);
    }

    graphics.lineStyle(3, 0xe46a6a, 0.5);
    graphics.lineBetween(x + 30, y + 10, x + 30, y + height - 10);
  }

  private drawProgressCard(centerX: number, y: number, width: number, progress: ReturnType<typeof loadPlayerProgress>, goal: string): void {
    const cardHeight = 72;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2d2119, 0.82);
    graphics.fillRoundedRect(centerX - width / 2, y, width, cardHeight, UI.panelRadius);
    graphics.lineStyle(2, 0xffe28a, 0.56);
    graphics.strokeRoundedRect(centerX - width / 2, y, width, cardHeight, UI.panelRadius);

    const missionCount = progress.achievedMissions.length;
    this.add
      .text(centerX, y + 15, `ベスト ${progress.bestScore.toLocaleString('ja-JP')}点  称号 ${progress.unlockedBadges.length}種  ミッション ${missionCount}/${MISSIONS.length}`, {
        fontFamily: UI.fontFamily,
        fontSize: width < 330 ? '10px' : '12px',
        fontStyle: '900',
        color: '#fff8dc',
        align: 'center',
        wordWrap: { width: width - 20 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, y + 42, `今日の目標：${goal}`, {
        fontFamily: UI.fontFamily,
        fontSize: width < 330 ? '11px' : '13px',
        fontStyle: '900',
        color: '#ffe28a',
        align: 'center',
        wordWrap: { width: width - 24 },
      })
      .setOrigin(0.5, 0);
  }

  private createButton(x: number, y: number, width: number, label: string, onClick: () => void): void {
    const height = Math.max(UI.minButtonHeight, 58);
    const button = this.add.container(x, y);
    const shadow = this.add.rectangle(4, 6, width, height, 0x5d321f, 1).setOrigin(0.5);
    const face = this.add.rectangle(0, 0, width, height, 0xffd65b, 1).setOrigin(0.5);
    face.setStrokeStyle(4, 0x3b2416);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: UI.fontFamily,
        fontSize: '23px',
        fontStyle: '900',
        color: '#2b1a11',
      })
      .setOrigin(0.5);

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

  private createMuteButton(x: number, y: number): void {
    const size = 42;
    const face = this.add.rectangle(x, y, size, size, 0x2d2119, 0.82).setOrigin(0.5);
    face.setStrokeStyle(2, 0xffe28a, 0.56);
    const label = this.add
      .text(x, y, isMuted() ? '音OFF' : '音ON', {
        fontFamily: UI.fontFamily,
        fontSize: '10px',
        fontStyle: '900',
        color: '#fff8dc',
        align: 'center',
      })
      .setOrigin(0.5);
    const hitZone = this.add.zone(x, y, size + 10, size + 10).setInteractive({ useHandCursor: true });
    hitZone.setDepth(100);
    hitZone.on('pointerup', () => {
      const muted = toggleMuted();
      label.setText(muted ? '音OFF' : '音ON');
    });
  }
}
