import Phaser from "phaser";
import type { HudCallbacks } from "./HillStartScene";

export class RoadMergingScene extends Phaser.Scene {
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

  constructor() { super({ key: "road-merging" }); }

  init(data: { hudCallbacks: HudCallbacks }) {
    this.hudCallbacks = data.hudCallbacks;
    this.errors = 0; this.stallCount = 0; this.rollbackCm = 0; this.speed = 0; this.carAngle = 0;
  }

  preload(): void {}

  create(): void {
    const { width, height } = this.scale;
    const cg = this.add.rectangle(60, height * 0.7, 40, 24, 0x3b82f6);
    this.car = this.physics.add.existing(cg, false) as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.car.body.setCollideWorldBounds(true);
    this.obstacles = this.physics.add.staticGroup();
    // Main road boundaries
    this.obstacles.add(this.add.rectangle(width / 2, height * 0.35, width, 8, 0x64748b));
    this.obstacles.add(this.add.rectangle(width / 2, height * 0.65, width * 0.5, 8, 0x64748b));
    // Merge point barrier
    this.obstacles.add(this.add.rectangle(width * 0.5, height * 0.85, 8, height * 0.3, 0xef4444));
    this.finishZone = this.add.zone(width - 60, height * 0.5, 40, 80);
    this.physics.add.existing(this.finishZone, true);
    this.physics.add.collider(this.car, this.obstacles, () => { this.errors++; this.hudCallbacks?.onErrorIncrement(); });
    this.physics.add.overlap(this.car, this.finishZone, () => { if (this.speed < 2) this.handleFinish(); });
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = { W: this.input.keyboard!.addKey(87), A: this.input.keyboard!.addKey(65), S: this.input.keyboard!.addKey(83), D: this.input.keyboard!.addKey(68) };
  }

  update(): void {
    if (!this.car?.body) return;
    if (this.cursors.left.isDown || this.wasd.A.isDown) this.carAngle -= 3;
    if (this.cursors.right.isDown || this.wasd.D.isDown) this.carAngle += 3;
    let f = 0;
    if (this.cursors.up.isDown || this.wasd.W.isDown) f = 160;
    if (this.cursors.down.isDown || this.wasd.S.isDown) f = -160;
    const r = Phaser.Math.DegToRad(this.carAngle);
    this.car.body.setVelocity(Math.cos(r) * f, Math.sin(r) * f);
    this.car.setAngle(this.carAngle);
    this.speed = Math.round(Math.abs(f) / 10);
    this.hudCallbacks?.onSpeedChange(this.speed);
  }

  private handleFinish(): void {
    this.car.body.setVelocity(0, 0);
    this.hudCallbacks?.onFinish({ score: Math.max(0, 100 - this.errors * 10), errors: this.errors, stallCount: this.stallCount, rollbackCm: this.rollbackCm, passed: this.errors <= 3 });
    this.scene.pause();
  }
}
