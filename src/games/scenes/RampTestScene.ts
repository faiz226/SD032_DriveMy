import Phaser from "phaser";
import type { HudCallbacks } from "./HillStartScene";

export class RampTestScene extends Phaser.Scene {
  private car!: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private finishZone!: Phaser.GameObjects.Zone & { body: Phaser.Physics.Arcade.StaticBody };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private hudCallbacks!: HudCallbacks;
  private errors = 0;
  private stallCount = 0;
  private rollbackCm = 0;
  private speed = 0;
  private finished = false;

  constructor() {
    super({ key: "ramp-test" });
  }

  init() {
    this.hudCallbacks = (this.game.config as any).hudCallbacks;
    this.errors = 0;
    this.stallCount = 0;
    this.rollbackCm = 0;
    this.speed = 0;
    this.finished = false;
  }

  preload(): void {
    // No external assets needed — we draw everything with code
  }

  create(): void {
    const { width, height } = this.scale;

    // Ground (flat surface)
    this.add.rectangle(width / 2, height - 20, width, 40, 0x334155);

    // Ramp (incline)
    const rampGraphics = this.add.graphics();
    rampGraphics.fillStyle(0x475569, 1);
    rampGraphics.beginPath();
    rampGraphics.moveTo(width * 0.5, height - 40);
    rampGraphics.lineTo(width * 0.8, height - 120);
    rampGraphics.lineTo(width * 0.8, height - 40);
    rampGraphics.closePath();
    rampGraphics.fillPath();

    // Car (blue rectangle)
    const carRect = this.add.rectangle(100, height - 60, 48, 24, 0x3b82f6);
    this.physics.add.existing(carRect);
    this.car = carRect as any;
    this.car.body.setCollideWorldBounds(true);
    this.car.body.setBounce(0);
    this.car.body.setDrag(500);

    // Obstacles (static physics)
    this.obstacles = this.physics.add.staticGroup();

    // Ground collision
    const ground = this.add.rectangle(width / 2, height - 20, width, 40, 0x000000, 0);
    this.physics.add.existing(ground, true);
    this.obstacles.add(ground);

    // Ramp collision (invisible hitbox)
    const rampHitbox = this.add.rectangle(width * 0.65, height - 70, width * 0.3, 80, 0x000000, 0);
    this.physics.add.existing(rampHitbox, true);
    this.obstacles.add(rampHitbox);

    // Finish zone (at top of ramp)
    this.finishZone = this.add.zone(width * 0.75, height - 100, 60, 40) as any;
    this.physics.add.existing(this.finishZone, true);

    // Collisions
    this.physics.add.collider(this.car, this.obstacles);

    // Overlap finish
    this.physics.add.overlap(this.car, this.finishZone, () => {
      if (!this.finished) {
        this.handleFinish();
      }
    });

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(): void {
    if (!this.car?.body || this.finished) return;

    let vx = 0;
    let vy = 0;

    // Horizontal movement (left/right)
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      vx = -150;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      vx = 150;
    }

    // Vertical movement (up/down for climbing)
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      vy = -150;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      vy = 150;
    }

    this.car.body.setVelocity(vx, vy);

    // Calculate speed for HUD
    this.speed = Math.round(Math.sqrt(vx * vx + vy * vy) / 10);
    this.hudCallbacks?.onSpeedChange(this.speed);
  }

  private handleFinish(): void {
    this.finished = true;
    this.car.body.setVelocity(0, 0);

    const score = Math.max(0, 100 - this.errors * 10);
    const passed = this.errors <= 3;

    this.hudCallbacks?.onFinish({
      score,
      errors: this.errors,
      stallCount: this.stallCount,
      rollbackCm: this.rollbackCm,
      passed,
    });

    this.scene.pause();
  }
}