import Phaser from 'phaser';
import { COLORS, GAME_TITLE, STAGE_OPPONENTS, UI, WORLD } from '../constants';
import { playSound } from '../utils/audio';

export class StoryScene extends Phaser.Scene {
  constructor() {
    super('StoryScene');
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
    this.drawClassroomBackground(width, height);

    const panelWidth = Math.min(width - 34, width > 700 ? 560 : 358);
    const panelHeight = Math.min(430, height - UI.safeTop - UI.safeBottom - 124);
    const panelY = Math.max(UI.safeTop + 92, height * 0.19);
    this.drawNotebook(centerX, panelY, panelWidth, panelHeight);

    this.add
      .text(centerX, UI.safeTop + 24, '休み時間の教室', {
        fontFamily: UI.fontFamily,
        fontSize: `${Math.min(34, Math.max(25, width * 0.07))}px`,
        fontStyle: '900',
        color: '#fff4cf',
        stroke: '#3c2415',
        strokeThickness: 7,
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.add
      .text(centerX, panelY + 28, GAME_TITLE.replace('\n', ''), {
        fontFamily: UI.fontFamily,
        fontSize: `${width < 420 ? 22 : 26}px`,
        fontStyle: '900',
        color: '#2d2119',
        align: 'center',
        wordWrap: { width: panelWidth - 36 },
      })
      .setOrigin(0.5, 0);

    const story = [
      'チャイムが鳴るまで、あと少し。',
      '机の上の消しゴムを見て、\nとなりの席の友人がニヤッと笑った。',
      STAGE_OPPONENTS[0].introText,
      'こうして、休み時間の机上決戦が始まった。',
    ];

    story.forEach((line, index) => {
      this.add
        .text(centerX, panelY + 90 + index * 58, line, {
          fontFamily: UI.fontFamily,
          fontSize: `${width < 380 ? 14 : 16}px`,
          fontStyle: index === 2 ? '900' : '800',
          color: index === 2 ? '#7a321d' : '#30231b',
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: panelWidth - 44 },
        })
        .setOrigin(0.5, 0);
    });

    this.createTextButton(width - UI.safeX - 50, UI.safeTop + 118, 'スキップ', () => {
      this.scene.start('TutorialScene');
    });

    const buttonWidth = Math.min(width * 0.82, 330);
    this.createButton(centerX, height - UI.safeBottom - 78, buttonWidth, '次へ', () => {
      this.scene.start('TutorialScene');
    });
  }

  private drawClassroomBackground(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.floor, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(COLORS.tableBase, 1);
    graphics.fillRect(0, height * 0.32, width, height * 0.68);
    for (let y = height * 0.34; y < height; y += 34) {
      graphics.lineStyle(2, COLORS.tableDark, 0.2);
      graphics.lineBetween(0, y, width, y + Math.sin(y * 0.04) * 3);
    }
    graphics.fillStyle(0x203b34, 1);
    graphics.fillRect(18, UI.safeTop + 86, width - 36, 70);
    graphics.lineStyle(4, 0x7b5234, 1);
    graphics.strokeRect(18, UI.safeTop + 86, width - 36, 70);
    this.add
      .text(width / 2, UI.safeTop + 108, '2-B  休み時間', {
        fontFamily: UI.fontFamily,
        fontSize: '20px',
        fontStyle: '900',
        color: '#fff8dc',
      })
      .setOrigin(0.5);
  }

  private drawNotebook(centerX: number, y: number, width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paperShadow, 1);
    graphics.fillRoundedRect(centerX - width / 2 + 5, y + 7, width, height, UI.panelRadius);
    graphics.fillStyle(COLORS.paper, 1);
    graphics.fillRoundedRect(centerX - width / 2, y, width, height, UI.panelRadius);
    graphics.lineStyle(2, 0xd8b8a0, 0.9);
    for (let lineY = y + 34; lineY < y + height - 12; lineY += 32) {
      graphics.lineBetween(centerX - width / 2 + 18, lineY, centerX + width / 2 - 18, lineY);
    }
    graphics.lineStyle(3, 0xe46a6a, 0.45);
    graphics.lineBetween(centerX - width / 2 + 32, y + 10, centerX - width / 2 + 32, y + height - 10);
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
        fontSize: '22px',
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
