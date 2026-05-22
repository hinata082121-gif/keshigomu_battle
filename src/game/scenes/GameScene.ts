import Phaser from 'phaser';
import { COLORS, CPU, CPU_BY_DIFFICULTY, ERASER, ROUND_LIMIT, SHOT, STAGE_LIMIT, STAGE_OPPONENTS, TABLE, UI } from '../constants';
import { Eraser } from '../objects/Eraser';
import type { AimState, CpuShotConfig, EndReason, GameSceneData, PlayState, StageOpponent, TableBounds, Winner } from '../types';
import { playSound } from '../utils/audio';
import { createResultData } from '../utils/result';
import { clampMagnitude, edgeDistance, isBodyStopped, isPointOutsideTable, powerFromSwipe, stopBody } from '../utils/physics';

export class GameScene extends Phaser.Scene {
  private state: PlayState = 'ready';
  private stage = 1;
  private round = 1;
  private opponent: StageOpponent = STAGE_OPPONENTS[0];
  private cpuShotConfig: CpuShotConfig = CPU_BY_DIFFICULTY.easy;
  private table!: TableBounds;
  private player!: Eraser;
  private cpu!: Eraser;
  private aim?: AimState;
  private titleText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private subHelpText!: Phaser.GameObjects.Text;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private cueGraphics!: Phaser.GameObjects.Graphics;
  private tableGraphics!: Phaser.GameObjects.Graphics;
  private floorGraphics!: Phaser.GameObjects.Graphics;
  private effectGraphics!: Phaser.GameObjects.Graphics;
  private headerGraphics!: Phaser.GameObjects.Graphics;
  private bottomGraphics!: Phaser.GameObjects.Graphics;
  private powerText!: Phaser.GameObjects.Text;
  private graffiti: Phaser.GameObjects.Text[] = [];
  private turnLock = false;
  private lastCollisionAt = 0;

  constructor() {
    super('GameScene');
  }

  init(data?: GameSceneData): void {
    this.stage = Phaser.Math.Clamp(Number.isFinite(data?.stage) ? Number(data?.stage) : 1, 1, STAGE_LIMIT);
    this.opponent = STAGE_OPPONENTS.find((opponent) => opponent.stage === this.stage) ?? STAGE_OPPONENTS[0];
    this.cpuShotConfig = CPU_BY_DIFFICULTY[this.opponent.difficulty];
  }

  create(): void {
    this.state = 'ready';
    this.round = 1;
    this.turnLock = false;
    this.table = this.calculateTable();
    this.createLayers();
    this.createUi();
    this.createErasers();
    this.registerInput();
    this.physics.add.collider(this.player, this.cpu, () => this.handleEraserCollision());
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });
    this.startPlayerTurn();
  }

  update(): void {
    if (!this.player || !this.cpu) {
      return;
    }

    this.player.syncDecorations();
    this.cpu.syncDecorations();
    this.applyMovementTilt(this.player);
    this.applyMovementTilt(this.cpu);
    this.drawTouchCue();

    if (this.state === 'aiming' && this.aim) {
      this.drawAimArrow();
    }

    if (this.state === 'moving' || this.state === 'cpuTurn') {
      this.checkFallOrStop();
    }
  }

  private createLayers(): void {
    this.floorGraphics = this.add.graphics().setDepth(-20);
    this.tableGraphics = this.add.graphics().setDepth(-10);
    this.cueGraphics = this.add.graphics().setDepth(15);
    this.aimGraphics = this.add.graphics().setDepth(50);
    this.effectGraphics = this.add.graphics().setDepth(55);
    this.headerGraphics = this.add.graphics().setDepth(70);
    this.bottomGraphics = this.add.graphics().setDepth(70);
    this.drawField();
  }

  private createUi(): void {
    const { width } = this.scale;
    this.drawUiChrome();

    this.titleText = this.add
      .text(width / 2, UI.safeTop + 10, '机上決戦！消しゴム落とし', {
        fontFamily: UI.fontFamily,
        fontSize: `${width < 420 ? 18 : 21}px`,
        fontStyle: '900',
        color: '#fff2c8',
        stroke: '#28170e',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(80);

    this.roundText = this.add
      .text(UI.safeX + 12, UI.safeTop + 54, '', {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '900',
        color: '#ffe28a',
      })
      .setOrigin(0, 0)
      .setDepth(80);

    this.statusText = this.add
      .text(width - UI.safeX - 12, UI.safeTop + 54, '', {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '900',
        color: '#f9f3df',
      })
      .setOrigin(1, 0)
      .setDepth(80);

    this.messageText = this.add
      .text(width / 2, UI.safeTop + 86, '', {
        fontFamily: UI.fontFamily,
        fontSize: '14px',
        fontStyle: '800',
        color: '#f7ead0',
        align: 'center',
        wordWrap: { width: Math.min(width - 56, 340) },
      })
      .setOrigin(0.5)
      .setDepth(80);

    this.helpText = this.add
      .text(width / 2, this.scale.height - UI.safeBottom - 58, '', {
        fontFamily: UI.fontFamily,
        fontSize: '18px',
        fontStyle: '800',
        color: '#fff8dc',
        align: 'center',
        wordWrap: { width: Math.min(width - 34, 360) },
      })
      .setOrigin(0.5)
      .setDepth(80);

    this.subHelpText = this.add
      .text(width / 2, this.scale.height - UI.safeBottom - 30, '', {
        fontFamily: UI.fontFamily,
        fontSize: '12px',
        fontStyle: '800',
        color: '#d8c7aa',
        align: 'center',
        wordWrap: { width: Math.min(width - 42, 340) },
      })
      .setOrigin(0.5)
      .setDepth(80);

    this.powerText = this.add
      .text(width / 2, this.table.bottom - 34, '', {
        fontFamily: UI.fontFamily,
        fontSize: '13px',
        fontStyle: '900',
        color: '#2b1a11',
        backgroundColor: '#fff0a5',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(82)
      .setVisible(false);

    this.updateTurnText('playerTurn');
  }

  private createErasers(): void {
    const playerStart = { x: this.table.left + this.table.width * 0.5, y: this.table.bottom - 72 };
    const cpuStart = { x: this.table.left + this.table.width * 0.5, y: this.table.top + 72 };

    this.player = new Eraser(this, playerStart.x, playerStart.y, {
      key: 'eraser-player',
      label: 'HEISEI',
      tag: 'YOU',
      mainColor: COLORS.player,
      darkColor: COLORS.playerDark,
      stripeColor: COLORS.blue,
      tagColor: COLORS.playerDark,
    });

    this.cpu = new Eraser(this, cpuStart.x, cpuStart.y, {
      key: `eraser-cpu-${this.opponent.eraserLabel}`,
      label: this.opponent.eraserLabel,
      tag: 'CPU',
      mainColor: COLORS.cpu,
      darkColor: COLORS.cpuDark,
      stripeColor: COLORS.red,
      tagColor: COLORS.cpuDark,
    });
  }

  private registerInput(): void {
    this.player.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.state !== 'playerTurn' || this.turnLock) {
        return;
      }

      this.state = 'aiming';
      this.aim = {
        start: new Phaser.Math.Vector2(pointer.worldX, pointer.worldY),
        current: new Phaser.Math.Vector2(pointer.worldX, pointer.worldY),
      };
      this.updateTurnText('aiming');
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.state !== 'aiming' || !this.aim) {
        return;
      }

      this.aim.current.set(pointer.worldX, pointer.worldY);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handleAimRelease(pointer);
    });

    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      this.handleAimRelease(pointer);
    });

    this.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
      this.handleAimRelease(pointer);
    });
  }

  private handleAimRelease(pointer: Phaser.Input.Pointer): void {
    if (this.state !== 'aiming' || !this.aim) {
      return;
    }

    this.aim.current.set(pointer.worldX, pointer.worldY);
    this.firePlayerShot();
  }

  private firePlayerShot(): void {
    if (!this.aim) {
      return;
    }

    const swipe = this.aim.current.clone().subtract(this.aim.start);
    const clamped = clampMagnitude(swipe, SHOT.maxSwipeDistance);
    const distance = clamped.length();
    const direction = distance < 6 ? new Phaser.Math.Vector2(0, -1) : clamped.clone().normalize();
    const power = powerFromSwipe(distance);
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(direction.x * power, direction.y * power);
    playSound('shot');
    this.spawnShotEffect(this.player.x, this.player.y, direction, power);
    this.tweenShotSquash(this.player);
    if (power > SHOT.maxPower * 0.82) {
      this.cameras.main.shake(90, 0.004);
    }
    this.aim = undefined;
    this.aimGraphics.clear();
    this.powerText.setVisible(false);
    this.state = 'moving';
    this.turnLock = true;
    this.updateTurnText('moving');
  }

  private startPlayerTurn(): void {
    if (this.state === 'result') {
      return;
    }

    this.turnLock = false;
    this.state = 'playerTurn';
    this.aimGraphics.clear();
    this.powerText.setVisible(false);
    this.updateTurnText('playerTurn');
  }

  private startCpuThinking(): void {
    if (this.state === 'result') {
      return;
    }

    this.state = 'cpuThinking';
    this.turnLock = true;
    this.updateTurnText('cpuThinking');
    this.time.delayedCall(CPU.thinkDelayMs, () => this.fireCpuShot());
  }

  private fireCpuShot(): void {
    if (this.state !== 'cpuThinking') {
      return;
    }

    if (isPointOutsideTable(this.cpu.x, this.cpu.y, this.table)) {
      this.finishGame('player', 'knockout');
      return;
    }

    const from = new Phaser.Math.Vector2(this.cpu.x, this.cpu.y);
    const to = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const direction = to.subtract(from).normalize();
    const angleOffset = Phaser.Math.DegToRad(Phaser.Math.Between(-this.cpuShotConfig.aimRandomAngleDeg, this.cpuShotConfig.aimRandomAngleDeg));
    direction.rotate(angleOffset);
    const riskyShotRate = CPU_BY_DIFFICULTY[this.opponent.difficulty].riskyShotRate;
    const riskyBoost = Phaser.Math.Between(0, 100) < riskyShotRate ? 120 : 0;
    const power = this.cpuShotConfig.basePower + Phaser.Math.Between(-this.cpuShotConfig.powerRandom, this.cpuShotConfig.powerRandom) + riskyBoost;
    const body = this.cpu.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(direction.x * power, direction.y * power);
    playSound('shot');
    this.spawnShotEffect(this.cpu.x, this.cpu.y, direction, power);
    this.tweenShotSquash(this.cpu);
    this.state = 'cpuTurn';
    this.updateTurnText('cpuTurn');
  }

  private handleEraserCollision(): void {
    const now = this.time.now;
    if (now - this.lastCollisionAt < 160 || this.state === 'result') {
      return;
    }

    this.lastCollisionAt = now;
    const x = (this.player.x + this.cpu.x) / 2;
    const y = (this.player.y + this.cpu.y) / 2;
    playSound('hit');
    this.spawnImpactEffect(x, y);
    this.cameras.main.shake(80, 0.003);
  }

  private checkFallOrStop(): void {
    const playerOut = isPointOutsideTable(this.player.x, this.player.y, this.table);
    const cpuOut = isPointOutsideTable(this.cpu.x, this.cpu.y, this.table);

    if (playerOut || cpuOut) {
      if (playerOut) {
        this.player.setFallen();
        this.spawnFallEffect(this.player.x, this.player.y);
      }
      if (cpuOut) {
        this.cpu.setFallen();
        this.spawnFallEffect(this.cpu.x, this.cpu.y);
      }
      playSound('fall');
      this.resolveFall(playerOut, cpuOut);
      return;
    }

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    const cpuBody = this.cpu.body as Phaser.Physics.Arcade.Body;

    if (isBodyStopped(playerBody) && isBodyStopped(cpuBody)) {
      stopBody(playerBody);
      stopBody(cpuBody);
      this.afterStop();
    }
  }

  private afterStop(): void {
    if (this.state === 'moving') {
      this.startCpuThinking();
      return;
    }

    if (this.state === 'cpuTurn') {
      if (this.round >= ROUND_LIMIT) {
        this.resolveJudge();
        return;
      }

      this.round += 1;
      this.startPlayerTurn();
    }
  }

  private resolveFall(playerOut: boolean, cpuOut: boolean): void {
    if (this.state === 'result') {
      return;
    }

    const reason: EndReason = playerOut && cpuOut ? 'doubleOut' : playerOut ? (this.state === 'moving' ? 'selfOut' : 'knockout') : 'knockout';
    const winner: Winner = playerOut ? 'cpu' : cpuOut ? 'player' : 'draw';
    const callout = playerOut && cpuOut ? '両方場外！' : playerOut ? (reason === 'selfOut' ? '自爆！' : '場外！') : '落とした！';
    this.helpText.setText(callout);
    this.helpText.setScale(1.08);
    this.tweens.add({ targets: this.helpText, scale: 1, duration: 180, ease: 'Back.easeOut' });
    if (playerOut && cpuOut) {
      this.spawnBattleOutcomeEffect('自爆！', 0xff9c45);
    } else if (cpuOut) {
      this.spawnBattleOutcomeEffect('K.O.!', 0xffe06b);
      playSound('win');
    } else if (playerOut) {
      this.spawnBattleOutcomeEffect(reason === 'selfOut' ? 'やりすぎショット！' : 'LOSE...', 0x9ab6e8);
    }
    this.finishGame(winner, reason);
  }

  private resolveJudge(): void {
    const playerDistance = edgeDistance(this.player.x, this.player.y, this.table);
    const cpuDistance = edgeDistance(this.cpu.x, this.cpu.y, this.table);
    const diff = playerDistance - cpuDistance;
    const winner: Winner = Math.abs(diff) < 8 ? 'draw' : diff > 0 ? 'player' : 'cpu';
    const reason: EndReason = winner === 'draw' ? 'draw' : 'judge';
    this.finishGame(winner, reason);
  }

  private finishGame(winner: Winner, reason: EndReason): void {
    this.state = 'result';
    this.turnLock = true;
    this.updateTurnText('result');

    const result = createResultData({
      winner,
      reason,
      stage: this.stage,
      opponentName: this.opponent.name,
      round: this.round,
      playerEdgeDistance: edgeDistance(this.player.x, this.player.y, this.table),
      cpuEdgeDistance: edgeDistance(this.cpu.x, this.cpu.y, this.table),
    });

    this.time.delayedCall(winner === 'player' && reason !== 'draw' ? 880 : 540, () => {
      if (winner === 'player' && this.stage < STAGE_LIMIT) {
        this.scene.start('RoundClearScene', result);
        return;
      }

      this.scene.start('ResultScene', result);
    });
  }

  private updateTurnText(nextState: PlayState): void {
    const statusByState: Record<PlayState, string> = {
      title: '',
      ready: '準備中',
      playerTurn: 'あなたの番',
      aiming: '狙い中',
      moving: '判定中',
      cpuThinking: 'CPUの番',
      cpuTurn: 'CPUショット',
      result: '結果発表',
    };
    const helpByState: Record<PlayState, string> = {
      title: '',
      ready: '準備中……',
      playerTurn: 'HEISEIをスワイプして弾け！',
      aiming: '指を離すとショット！',
      moving: '判定中……',
      cpuThinking: 'CPUの番です',
      cpuTurn: 'CPUのショットを見守ろう',
      result: '結果発表へ',
    };
    const messageByState: Record<PlayState, string> = {
      title: '',
      ready: '机の端から落としたら勝ち',
      playerTurn: '消しゴム以外は反応しません',
      aiming: '矢印の方向に飛びます',
      moving: '止まるか落ちるまで待機',
      cpuThinking: 'CPUが狙いを決めています',
      cpuTurn: `${this.opponent.label}がショット中`,
      result: '勝敗が決まりました',
    };
    const subHelpByState: Record<PlayState, string> = {
      title: '',
      ready: '',
      playerTurn: '短くても動く / 長いほど強い',
      aiming: '矢印が長いほど強いショット',
      moving: 'ショット中は操作できません',
      cpuThinking: '0.7秒後にCPUが弾きます',
      cpuTurn: '次のラウンドまで待ってね',
      result: '',
    };

    if (this.roundText) {
      this.roundText.setText(`ROUND ${this.stage}/${STAGE_LIMIT}  TURN ${this.round}/${ROUND_LIMIT}`);
    }
    if (this.statusText) {
      this.statusText.setText(statusByState[nextState]);
    }
    if (this.helpText) {
      this.helpText.setText(helpByState[nextState]);
    }
    if (this.messageText) {
      this.messageText.setText(messageByState[nextState]);
    }
    if (this.subHelpText) {
      this.subHelpText.setText(subHelpByState[nextState]);
    }
  }

  private drawAimArrow(): void {
    if (!this.aim) {
      return;
    }

    const swipe = clampMagnitude(this.aim.current.clone().subtract(this.aim.start), SHOT.maxSwipeDistance);
    const end = new Phaser.Math.Vector2(this.player.x + swipe.x, this.player.y + swipe.y);
    const powerRatio = Phaser.Math.Clamp(swipe.length() / SHOT.maxSwipeDistance, 0, 1);
    const alpha = Phaser.Math.Clamp(powerRatio, 0.32, 1);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, end.x, end.y);
    const headSize = 16;
    const arrowColor = powerRatio > 0.78 ? 0xff7055 : powerRatio > 0.45 ? 0xfff0a5 : 0xbdebdc;

    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(10, 0x3d2417, 0.42);
    this.aimGraphics.lineBetween(this.player.x, this.player.y, end.x, end.y);
    this.aimGraphics.lineStyle(5 + powerRatio * 3, arrowColor, alpha);
    this.aimGraphics.lineBetween(this.player.x, this.player.y, end.x, end.y);
    this.aimGraphics.fillStyle(arrowColor, alpha);
    this.aimGraphics.beginPath();
    this.aimGraphics.moveTo(end.x, end.y);
    this.aimGraphics.lineTo(end.x - Math.cos(angle - 0.55) * headSize, end.y - Math.sin(angle - 0.55) * headSize);
    this.aimGraphics.lineTo(end.x - Math.cos(angle + 0.55) * headSize, end.y - Math.sin(angle + 0.55) * headSize);
    this.aimGraphics.closePath();
    this.aimGraphics.fillPath();
    this.powerText
      .setText(`POWER ${Math.round(powerRatio * 100)}%`)
      .setPosition(Phaser.Math.Clamp(end.x, this.table.left + 54, this.table.right - 54), Phaser.Math.Clamp(end.y - 30, this.table.top + 28, this.table.bottom - 28))
      .setVisible(true);
  }

  private drawTouchCue(): void {
    this.cueGraphics.clear();

    if (this.state !== 'playerTurn' && this.state !== 'aiming') {
      return;
    }

    const pulse = this.state === 'aiming' ? 0.86 : 0.48 + Math.sin(this.time.now / 220) * 0.14;
    const cueX = this.player.x - ERASER.width / 2 - 8;
    const cueY = this.player.y - ERASER.height / 2 - 8;
    this.cueGraphics.fillStyle(0xfff0a5, 0.08);
    this.cueGraphics.fillRoundedRect(cueX, cueY, ERASER.width + 16, ERASER.height + 16, 6);
    this.cueGraphics.lineStyle(3, 0xfff0a5, pulse);
    this.cueGraphics.strokeRoundedRect(cueX, cueY, ERASER.width + 16, ERASER.height + 16, 6);
  }

  private tweenShotSquash(eraser: Eraser): void {
    this.tweens.add({
      targets: eraser,
      scaleX: 1.08,
      scaleY: 0.92,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private spawnShotEffect(x: number, y: number, direction: Phaser.Math.Vector2, power: number): void {
    const graphics = this.add.graphics().setDepth(54);
    const powerRatio = Phaser.Math.Clamp(power / SHOT.maxPower, 0, 1);
    graphics.lineStyle(2, 0xfff0a5, 0.75);
    for (let i = -1; i <= 1; i += 1) {
      const offset = new Phaser.Math.Vector2(direction.y, -direction.x).scale(i * 8);
      const start = new Phaser.Math.Vector2(x, y).subtract(direction.clone().scale(18)).add(offset);
      const end = start.clone().subtract(direction.clone().scale(20 + powerRatio * 28));
      graphics.lineBetween(start.x, start.y, end.x, end.y);
    }
    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => graphics.destroy(),
    });
  }

  private spawnImpactEffect(x: number, y: number): void {
    const graphics = this.add.graphics().setDepth(56);
    graphics.lineStyle(3, 0xffffff, 0.9);
    graphics.fillStyle(0xfff0a5, 0.92);
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const inner = 8;
      const outer = 22;
      graphics.lineBetween(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner, x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    }
    graphics.fillCircle(x, y, 5);
    this.tweens.add({
      targets: graphics,
      scale: 1.3,
      alpha: 0,
      duration: 160,
      ease: 'Sine.easeOut',
      onComplete: () => graphics.destroy(),
    });
  }

  private spawnFallEffect(x: number, y: number): void {
    const graphics = this.add.graphics().setDepth(56);
    graphics.fillStyle(0x20130d, 0.5);
    graphics.fillEllipse(x, y + 8, 58, 18);
    graphics.lineStyle(3, 0xffd27b, 0.8);
    graphics.strokeCircle(x, y, 16);
    this.tweens.add({
      targets: graphics,
      scaleX: 1.35,
      scaleY: 0.75,
      alpha: 0,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => graphics.destroy(),
    });
  }

  private spawnBattleOutcomeEffect(label: string, color: number): void {
    const isWin = label === 'K.O.!';
    const isSelf = label.includes('自爆') || label.includes('やりすぎ');
    this.cameras.main.flash(130, isWin ? 255 : 255, isWin ? 224 : 156, isWin ? 107 : 69, false);
    this.cameras.main.shake(isWin ? 170 : 130, isWin ? 0.006 : 0.004);
    const burst = this.add.graphics().setDepth(90);
    const centerX = this.scale.width / 2;
    const centerY = this.table.top + this.table.height * 0.42;
    burst.fillStyle(color, 0.95);
    burst.fillCircle(centerX, centerY, 44);
    burst.lineStyle(5, 0x3a2417, 0.84);
    for (let i = 0; i < 14; i += 1) {
      const angle = (Math.PI * 2 * i) / 14 + (isSelf ? 0.16 : 0);
      burst.lineBetween(centerX + Math.cos(angle) * 34, centerY + Math.sin(angle) * 34, centerX + Math.cos(angle) * 86, centerY + Math.sin(angle) * 86);
    }
    const text = this.add
      .text(centerX, centerY, label, {
        fontFamily: UI.fontFamily,
        fontSize: `${this.scale.width < 420 ? 28 : 36}px`,
        fontStyle: '900',
        color: '#2d2119',
        stroke: '#fff8dc',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(91)
      .setScale(0.72);
    this.tweens.add({
      targets: [burst, text],
      scale: 1.08,
      alpha: 0,
      duration: 680,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        burst.destroy();
        text.destroy();
      },
    });
  }

  private applyMovementTilt(eraser: Eraser): void {
    const body = eraser.body as Phaser.Physics.Arcade.Body;
    if (body.speed > 18) {
      eraser.setAngle(Math.sin(this.time.now / 80) * Phaser.Math.Clamp(body.speed / 70, 2, 8));
    } else {
      eraser.setAngle(Phaser.Math.Linear(eraser.angle, 0, 0.16));
    }
  }

  private drawField(): void {
    const { width, height } = this.scale;
    this.graffiti.forEach((item) => item.destroy());
    this.graffiti = [];
    this.floorGraphics.clear();
    this.tableGraphics.clear();
    this.floorGraphics.fillStyle(COLORS.floor, 1);
    this.floorGraphics.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 42) {
      this.floorGraphics.lineStyle(2, 0x3a261b, 0.32);
      this.floorGraphics.lineBetween(0, y, width, y);
    }
    for (let x = 24; x < width; x += 54) {
      this.floorGraphics.lineStyle(1, 0x120c09, 0.22);
      this.floorGraphics.lineBetween(x, 0, x + Math.sin(x) * 8, height);
    }
    this.floorGraphics.fillStyle(0x000000, 0.18);
    this.floorGraphics.fillRect(0, 0, width, this.table.top - 8);
    this.floorGraphics.fillStyle(COLORS.floorShadow, 0.4);
    this.floorGraphics.fillRect(0, this.table.bottom + 14, width, height - this.table.bottom);

    this.tableGraphics.fillStyle(COLORS.tableDark, 1);
    this.tableGraphics.fillRoundedRect(this.table.left - TABLE.border, this.table.top - TABLE.border, this.table.width + TABLE.border * 2, this.table.height + TABLE.border * 2, 12);
    this.tableGraphics.fillStyle(COLORS.tableBase, 1);
    this.tableGraphics.fillRoundedRect(this.table.left, this.table.top, this.table.width, this.table.height, 7);
    this.tableGraphics.fillStyle(0xffffff, 0.045);
    for (let y = this.table.top + 16; y < this.table.bottom - 12; y += 54) {
      this.tableGraphics.fillRect(this.table.left + 14, y, this.table.width - 28, 2);
    }

    for (let y = this.table.top + 12; y < this.table.bottom; y += 28) {
      this.tableGraphics.lineStyle(2, y % 56 === 0 ? COLORS.tableLight : COLORS.tableLine, 0.24);
      this.tableGraphics.beginPath();
      this.tableGraphics.moveTo(this.table.left + 8, y);
      for (let x = this.table.left + 8; x < this.table.right - 8; x += 24) {
        this.tableGraphics.lineTo(x, y + Math.sin((x + y) * 0.035) * 4);
      }
      this.tableGraphics.strokePath();
    }

    this.tableGraphics.fillStyle(0x4e2d18, 0.14);
    for (let x = this.table.left + 20; x < this.table.right - 20; x += 38) {
      for (let y = this.table.top + 26; y < this.table.bottom - 26; y += 46) {
        if ((x + y) % 3 === 0) {
          this.tableGraphics.fillRect(x, y, 2, 2);
        }
      }
    }

    this.tableGraphics.lineStyle(4, COLORS.tableLine, 0.85);
    this.tableGraphics.strokeRoundedRect(this.table.left, this.table.top, this.table.width, this.table.height, 7);
    this.tableGraphics.lineStyle(3, 0xffd27b, 0.6);
    this.tableGraphics.strokeRoundedRect(this.table.left + 3, this.table.top + 3, this.table.width - 6, this.table.height - 6, 5);
    this.tableGraphics.lineStyle(2, 0xffe2a3, 0.5);
    this.tableGraphics.strokeRoundedRect(this.table.left + 8, this.table.top + 8, this.table.width - 16, this.table.height - 16, 4);

    this.addDeskGraffiti();
  }

  private addDeskGraffiti(): void {
    const items = [
      { text: '2-B', x: 0.08, y: 0.1, size: 18, angle: -10 },
      { text: 'VS', x: 0.48, y: 0.2, size: 16, angle: 8 },
      { text: '今日の給食', x: 0.16, y: 0.86, size: 13, angle: -4 },
      { text: '←最強', x: 0.72, y: 0.88, size: 16, angle: 8 },
      { text: 'RAKUGAKI', x: 0.56, y: 0.5, size: 12, angle: -7 },
      { text: 'チャイムまであと少し', x: 0.2, y: 0.38, size: 11, angle: 5 },
      { text: '机上決戦', x: 0.68, y: 0.28, size: 13, angle: -4 },
      { text: 'えんぴつ禁止', x: 0.62, y: 0.72, size: 11, angle: 7 },
    ];

    this.graffiti = items.map((item) =>
      this.add
        .text(this.table.left + this.table.width * item.x, this.table.top + this.table.height * item.y, item.text, {
          fontFamily: UI.fontFamily,
          fontSize: `${item.size}px`,
          fontStyle: '900',
          color: '#4d2d1a',
        })
        .setAlpha(0.14)
        .setAngle(item.angle)
        .setDepth(-5),
    );
  }

  private calculateTable(): TableBounds {
    const { width, height } = this.scale;
    const left = TABLE.marginX;
    const right = width - TABLE.marginX;
    const top = Math.max(TABLE.top, UI.safeTop + 118, height * 0.17);
    const availableHeight = height - top - TABLE.bottomReserved;
    const tableHeight = Phaser.Math.Clamp(availableHeight, Math.min(TABLE.minHeight, height * 0.48), height * TABLE.maxHeightRatio);
    const bottom = top + tableHeight;

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  private handleResize(): void {
    const oldTable = this.table;
    this.table = this.calculateTable();
    this.drawField();
    this.drawUiChrome();

    const scalePoint = (eraser: Eraser) => {
      const ratioX = (eraser.x - oldTable.left) / oldTable.width;
      const ratioY = (eraser.y - oldTable.top) / oldTable.height;
      eraser.setPosition(this.table.left + this.table.width * ratioX, this.table.top + this.table.height * ratioY);
      eraser.syncDecorations();
    };

    if (this.player && this.cpu) {
      scalePoint(this.player);
      scalePoint(this.cpu);
    }

    this.titleText.setPosition(this.scale.width / 2, UI.safeTop + 10);
    this.titleText.setFontSize(this.scale.width < 420 ? 18 : 21);
    this.roundText.setPosition(UI.safeX + 12, UI.safeTop + 54);
    this.statusText.setPosition(this.scale.width - UI.safeX - 12, UI.safeTop + 54);
    this.messageText.setPosition(this.scale.width / 2, UI.safeTop + 86);
    this.messageText.setWordWrapWidth(Math.min(this.scale.width - 56, 340));
    this.helpText.setPosition(this.scale.width / 2, this.scale.height - UI.safeBottom - 58);
    this.helpText.setWordWrapWidth(Math.min(this.scale.width - 34, 360));
    this.subHelpText.setPosition(this.scale.width / 2, this.scale.height - UI.safeBottom - 30);
    this.subHelpText.setWordWrapWidth(Math.min(this.scale.width - 42, 340));
    this.powerText.setPosition(this.scale.width / 2, this.table.bottom - 34);
  }

  private drawUiChrome(): void {
    const { width, height } = this.scale;
    const headerX = UI.safeX - 6;
    const headerY = UI.safeTop;
    const headerWidth = width - (UI.safeX - 6) * 2;
    const headerHeight = 110;
    const bottomWidth = Math.min(width - 30, 360);
    const bottomHeight = 82;
    const bottomX = (width - bottomWidth) / 2;
    const bottomY = height - UI.safeBottom - bottomHeight - 6;

    this.headerGraphics.clear();
    this.headerGraphics.fillStyle(0x160f0b, 0.88);
    this.headerGraphics.fillRoundedRect(headerX, headerY, headerWidth, headerHeight, UI.panelRadius);
    this.headerGraphics.lineStyle(2, 0x5a3824, 0.8);
    this.headerGraphics.strokeRoundedRect(headerX, headerY, headerWidth, headerHeight, UI.panelRadius);
    this.headerGraphics.fillStyle(0x2f2119, 0.95);
    this.headerGraphics.fillRoundedRect(UI.safeX, UI.safeTop + 48, Math.min(148, width * 0.42), 32, 6);
    this.headerGraphics.fillRoundedRect(width - UI.safeX - Math.min(124, width * 0.34), UI.safeTop + 48, Math.min(124, width * 0.34), 32, 6);

    this.bottomGraphics.clear();
    this.bottomGraphics.fillStyle(0x160f0b, 0.9);
    this.bottomGraphics.fillRoundedRect(bottomX, bottomY, bottomWidth, bottomHeight, UI.panelRadius);
    this.bottomGraphics.lineStyle(2, 0x5a3824, 0.82);
    this.bottomGraphics.strokeRoundedRect(bottomX, bottomY, bottomWidth, bottomHeight, UI.panelRadius);
  }
}
