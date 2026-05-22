import Phaser from 'phaser';
import { COLORS, ERASER, UI } from '../constants';

export interface EraserStyle {
  key: string;
  label: string;
  tag: string;
  mainColor: number;
  darkColor: number;
  stripeColor: number;
  tagColor: number;
}

export class Eraser extends Phaser.Physics.Arcade.Sprite {
  private readonly labelObject: Phaser.GameObjects.Text;
  private readonly tagObject: Phaser.GameObjects.Text;
  private readonly shadow: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, style: EraserStyle) {
    Eraser.ensureTexture(scene, style);
    super(scene, x, y, style.key);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setName(style.label);
    this.setDepth(20);
    this.setInteractive({ useHandCursor: true });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(ERASER.width - ERASER.bodyInset * 2, ERASER.height - ERASER.bodyInset * 2);
    body.setCollideWorldBounds(false);
    body.setBounce(ERASER.bounce);
    body.setDrag(ERASER.drag);
    body.setMaxVelocity(ERASER.maxVelocity);

    this.shadow = scene.add.rectangle(x + 4, y + 5, ERASER.width, ERASER.height, COLORS.floorShadow, 0.28);
    this.shadow.setDepth(10);
    this.shadow.setOrigin(0.5);

    this.labelObject = scene.add
      .text(x, y, style.label, {
        fontFamily: UI.fontFamily,
        fontSize: '12px',
        fontStyle: '900',
        color: '#211714',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.tagObject = scene.add
      .text(x, y - ERASER.height / 2 - 10, style.tag, {
        fontFamily: UI.fontFamily,
        fontSize: '10px',
        fontStyle: '900',
        color: '#fff8dc',
        backgroundColor: Phaser.Display.Color.IntegerToColor(style.tagColor).rgba,
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(22);
  }

  static ensureTexture(scene: Phaser.Scene, style: EraserStyle): void {
    if (scene.textures.exists(style.key)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(COLORS.black, 0.24);
    graphics.fillRect(0, 2, ERASER.width, ERASER.height - 2);
    graphics.fillStyle(style.darkColor, 1);
    graphics.fillRect(2, 0, ERASER.width - 4, ERASER.height - 4);
    graphics.fillStyle(style.mainColor, 1);
    graphics.fillRect(5, 4, ERASER.width - 10, ERASER.height - 10);
    graphics.fillStyle(0xfff8dc, 0.94);
    graphics.fillRect(12, 10, ERASER.width - 24, ERASER.height - 20);
    graphics.fillStyle(style.stripeColor, 0.82);
    graphics.fillRect(12, 10, 7, ERASER.height - 20);
    graphics.fillRect(ERASER.width - 19, 10, 7, ERASER.height - 20);
    graphics.fillStyle(0xffffff, 0.28);
    graphics.fillRect(8, 5, ERASER.width - 16, 4);
    graphics.fillStyle(style.darkColor, 0.35);
    graphics.fillRect(8, ERASER.height - 10, ERASER.width - 16, 3);
    graphics.fillStyle(style.tagColor, 0.95);
    graphics.fillRect(27, 6, ERASER.width - 54, 4);
    graphics.lineStyle(2, COLORS.black, 0.5);
    graphics.strokeRect(2, 0, ERASER.width - 4, ERASER.height - 4);
    graphics.lineStyle(1, COLORS.white, 0.35);
    graphics.strokeRect(6, 5, ERASER.width - 12, ERASER.height - 12);
    graphics.generateTexture(style.key, ERASER.width, ERASER.height);
    graphics.destroy();
  }

  resetTo(x: number, y: number): void {
    this.setPosition(x, y);
    this.setAngle(0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    this.syncDecorations();
  }

  syncDecorations(): void {
    this.shadow.setPosition(this.x + 4, this.y + 5);
    this.shadow.setRotation(this.rotation);
    this.labelObject.setPosition(this.x, this.y);
    this.labelObject.setRotation(this.rotation);
    this.tagObject.setPosition(this.x, this.y - ERASER.height / 2 - 10);
  }

  setFallen(): void {
    this.setAlpha(0.45);
    this.labelObject.setAlpha(0.45);
    this.tagObject.setAlpha(0.35);
    this.shadow.setAlpha(0.08);
  }

  revive(): void {
    this.setAlpha(1);
    this.labelObject.setAlpha(1);
    this.tagObject.setAlpha(1);
    this.shadow.setAlpha(0.28);
  }

  destroy(fromScene?: boolean): void {
    this.labelObject.destroy();
    this.tagObject.destroy();
    this.shadow.destroy();
    super.destroy(fromScene);
  }
}
