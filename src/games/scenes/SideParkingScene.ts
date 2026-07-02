import Phaser from "phaser";
import type { HudCallbacks } from "./HillStartScene";

/**
 * SideParkingScene — Top-down view.
 * Car must reverse into a side parking bay between two obstacles.
 *
 * Key: "side-parking"
 */
export class SideParkingScene extends Phaser.Scene {
  private car!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private finishZone!: Phaser.GameObjects.Zone;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private hudCallbacks!: HudCallbacks;

  private errors = 0;
  private stallCount = 0;
  private rollbackCm = 0;
  private speed = 0;
  private carAngle = 0;

  constructor() {
    super({ key: "side-parking" });
  }

  init(data: { hudCallbacks: HudCallbacks }) {
    this.hudCallbacks = data.hudCallbacks;
    this.errors = 0;
    this.stallCount = 0;
    this.rollbackCm = 0;
    this.speed = 0;
    this.carAngle = 0;
  }

  preload(): void {}

  create(): void {
    const { width, height } = this.scale;

    // Car placeholder
    const carGraphic = this.add.rectangle(width / 2, height - 100, 40, 24, 0x3b82f6);
    this.car = this.physics.add.existing(carGraphic, false) as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.car.body.setCollideWorldBounds(true);

    // Parking bay boundaries
    this.obstacles = this.physics.add.staticGroup();
    const leftWall = this.add.rectangle(width / 2 - 60, height / 2, 8, 120, 0xef4444);
    const rightWall = this.add.rectangle(width / 2 + 60, height / 2, 8, 120, 0xef4444);
    const backWall = this.add.rectangle(width / 2, height / 2 - 60, 120, 8, 0xef4444);
    this.obstacles.add(leftWall);
    this.obstacles.add(rightWall);
    this.obstacles.add(backWall);

    // Finish zone (inside parking bay)
    this.finishZone = this.add.zone(width / 2, height / 2, 80, 80);
    this.physics.add.existing(this.finishZone, true);

    // Collisions
    this.physics.add.collider(this.car, this.obstacles, () => {
      this.errors++;
      this.hudCallbacks?.onErrorIncrement();
    });

    this.physics.add.overlap(this.car, this.finishZone, () => {
      if (this.speed < 2) this.handleFinish();
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
    if (!this.car?.body) return;

    const turnSpeed = 3;
    const accel = 160;

    // Top-down: A/D rotate, W/S forward/back
    if (this.cursors.left.isDown || this.wasd.A.isDown) this.carAngle -= turnSpeed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) this.carAngle += turnSpeed;

    let forward = 0;
    if (this.cursors.up.isDown || this.wasd.W.isDown) forward = accel;
    if (this.cursors.down.isDown || this.wasd.S.isDown) forward = -accel;

    const rad = Phaser.Math.DegToRad(this.carAngle);
    this.car.body.setVelocity(Math.cos(rad) * forward, Math.sin(rad) * forward);
    this.car.setAngle(this.carAngle);

    this.speed = Math.round(Math.abs(forward) / 10);
    this.hudCallbacks?.onSpeedChange(this.speed);
  }

  private handleFinish(): void {
    this.car.body.setVelocity(0, 0);
    this.hudCallbacks?.onFinish({
      score: Math.max(0, 100 - this.errors * 10 - this.stallCount * 15),
      errors: this.errors,
      stallCount: this.stallCount,
      rollbackCm: this.rollbackCm,
      passed: this.errors <= 3,
    });
    this.scene.pause();
  }
}
