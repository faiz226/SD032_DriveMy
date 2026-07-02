import Phaser from "phaser";

/**
 * HUD callback interface — React passes these functions into the scene
 * so Phaser can update the HUD overlay in real-time.
 */
export interface HudCallbacks {
  onSpeedChange: (speed: number) => void;
  onErrorIncrement: () => void;
  onStallIncrement: () => void;
  onMirrorCheck: (checked: boolean) => void;
  onSignalChange: (left: boolean, right: boolean) => void;
  onFinish: (result: { score: number; errors: number; stallCount: number; rollbackCm: number; passed: boolean }) => void;
}

/**
 * HillStartScene — Side-view scene.
 * Car on an incline; must use clutch control to move uphill without rolling back.
 *
 * Key: "hill-start"
 */
export class HillStartScene extends Phaser.Scene {
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

  constructor() {
    super({ key: "hill-start" });
  }

  init(data: { hudCallbacks: HudCallbacks }) {
    this.hudCallbacks = data.hudCallbacks;
    this.errors = 0;
    this.stallCount = 0;
    this.rollbackCm = 0;
    this.speed = 0;
  }

  preload(): void {
    // Assets will be loaded here in Phase 6 Part 3
  }

  create(): void {
    const { width, height } = this.scale;

    // Placeholder car (rectangle graphic until sprites are added)
    const carGraphic = this.add.rectangle(120, height - 80, 48, 24, 0x3b82f6);
    this.car = this.physics.add.existing(carGraphic, false) as unknown as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    this.car.body.setCollideWorldBounds(true);

    // Boundaries / obstacles
    this.obstacles = this.physics.add.staticGroup();
    // Ground line
    const ground = this.add.rectangle(width / 2, height - 20, width, 40, 0x475569);
    this.obstacles.add(ground);
    // Incline (placeholder)
    const incline = this.add.rectangle(width / 2, height - 60, width * 0.6, 8, 0x64748b);
    this.obstacles.add(incline);

    // Finish zone
    this.finishZone = this.add.zone(width - 60, height - 80, 40, 60);
    this.physics.add.existing(this.finishZone, true);

    // Collisions
    this.physics.add.collider(this.car, this.obstacles, () => {
      this.errors++;
      this.hudCallbacks?.onErrorIncrement();
    });

    // Overlap with finish
    this.physics.add.overlap(this.car, this.finishZone, () => {
      this.handleFinish();
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

    const accel = 200;
    let vx = 0;
    let vy = 0;

    // Side-view: left/right movement, W to climb
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -accel;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = accel;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -accel;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = accel;

    this.car.body.setVelocity(vx, vy);

    this.speed = Math.round(Math.sqrt(vx * vx + vy * vy) / 10);
    this.hudCallbacks?.onSpeedChange(this.speed);
  }

  private handleFinish(): void {
    this.car.body.setVelocity(0, 0);
    this.hudCallbacks?.onFinish({
      score: Math.max(0, 100 - this.errors * 10 - this.stallCount * 15),
      errors: this.errors,
      stallCount: this.stallCount,
      rollbackCm: this.rollbackCm,
      passed: this.errors <= 3 && this.stallCount <= 1,
    });
    this.scene.pause();
  }
}
