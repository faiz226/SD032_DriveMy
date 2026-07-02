import Phaser from "phaser";
import type { HudCallbacks } from "./HillStartScene";

export class DrivingScene extends Phaser.Scene {
  private car!: Phaser.GameObjects.Container;
  private carBody!: { x: number; y: number; angle: number; speed: number; steerAngle: number };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private cones: Phaser.GameObjects.Arc[] = [];
  private errors = 0;
  private errorText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private maneuverType: string;
  private touchControls = { up: false, down: false, left: false, right: false };
  private roadGraphics!: Phaser.GameObjects.Graphics;
  private trackGraphics!: Phaser.GameObjects.Graphics;
  private started = false;
  private completed = false;
  private goalZone!: Phaser.GameObjects.Rectangle;
  private startTime = 0;
  public completionTime = 0;
  private signalState: 'none' | 'left' | 'right' = 'none';
  private signalIndicatorL!: Phaser.GameObjects.Arc;
  private signalIndicatorR!: Phaser.GameObjects.Arc;
  private signalBlinkTimer = 0;
  private mirrorText!: Phaser.GameObjects.Text;
  // For merging: obstacle cars
  private obstacleCars: { rect: Phaser.GameObjects.Rectangle; speed: number; y: number }[] = [];

  constructor(maneuverType: string) {
    super({ key: "DrivingScene" });
    this.maneuverType = maneuverType;
  }

  private get hud(): HudCallbacks | undefined {
    const ref = (this.game.config as { hudCallbacksRef?: { current?: HudCallbacks } }).hudCallbacksRef;
    return ref?.current;
  }

  init() {
    this.errors = 0;
    this.completed = false;
    this.completionTime = 0;
    this.obstacleCars = [];
    this.cones = [];
    this.touchControls = { up: false, down: false, left: false, right: false };
    this.signalState = "none";
  }

  setTouchControl(dir: string, pressed: boolean) {
    if (dir === 'up' || dir === 'down' || dir === 'left' || dir === 'right') {
      this.touchControls[dir] = pressed;
    }
  }

  setSignal(dir: 'none' | 'left' | 'right') {
    this.signalState = dir;
  }

  setMirrorCheck(active: boolean) {
    if (this.mirrorText) {
      this.mirrorText.setVisible(active);
    }
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor('#2d5a27');
    this.roadGraphics = this.add.graphics();
    this.trackGraphics = this.add.graphics();

    // Draw environment decorations
    this.drawEnvironment(w, h);
    this.setupManeuver(w, h);

    this.carBody = { x: 0, y: 0, angle: 0, speed: 0, steerAngle: 0 };
    this.setCarStartPosition(w, h);

    const isSideView = this.maneuverType === 'hill-start' || this.maneuverType === 'ramp-test';

    if (isSideView) {
      // Side-view car (horizontal rectangle)
      const body = this.add.rectangle(0, 0, 40, 18, 0x2563eb).setStrokeStyle(1.5, 0x1d4ed8);
      const roof = this.add.rectangle(4, -2, 16, 12, 0x93c5fd);
      const wheelFront = this.add.circle(14, 10, 5, 0x333333).setStrokeStyle(1, 0x111111);
      const wheelRear = this.add.circle(-14, 10, 5, 0x333333).setStrokeStyle(1, 0x111111);
      this.car = this.add.container(this.carBody.x, this.carBody.y, [body, roof, wheelFront, wheelRear]);
    } else {
      // Top-down car
      const carRect = this.add.rectangle(0, 0, 22, 40, 0x2563eb).setStrokeStyle(1.5, 0x1d4ed8);
      const windshield = this.add.rectangle(0, -13, 14, 6, 0x93c5fd).setStrokeStyle(0.5, 0x60a5fa);
      const leftLight = this.add.rectangle(-8, -18, 4, 3, 0xfbbf24);
      const rightLight = this.add.rectangle(8, -18, 4, 3, 0xfbbf24);
      const rearLeft = this.add.rectangle(-8, 18, 4, 3, 0xef4444);
      const rearRight = this.add.rectangle(8, 18, 4, 3, 0xef4444);
      // Side mirrors
      const mirrorL = this.add.rectangle(-13, -8, 3, 6, 0x94a3b8);
      const mirrorR = this.add.rectangle(13, -8, 3, 6, 0x94a3b8);
      this.car = this.add.container(this.carBody.x, this.carBody.y, [carRect, windshield, leftLight, rightLight, rearLeft, rearRight, mirrorL, mirrorR]);
    }

    // Signal indicators on car
    this.signalIndicatorL = this.add.circle(-15, -10, 3, 0xfbbf24).setAlpha(0);
    this.signalIndicatorR = this.add.circle(15, -10, 3, 0xfbbf24).setAlpha(0);
    this.car.add([this.signalIndicatorL, this.signalIndicatorR]);

    // HUD
    this.errorText = this.add.text(10, 10, 'Errors / Kesalahan: 0', { fontSize: '12px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 6, y: 3 } }).setScrollFactor(0).setDepth(100);
    this.speedText = this.add.text(10, 30, 'Speed / Kelajuan: 0', { fontSize: '12px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 6, y: 3 } }).setScrollFactor(0).setDepth(100);
    this.instructionText = this.add.text(w / 2, h - 14, 'WASD / Arrow keys to drive', { fontSize: '10px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 6, y: 3 } }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Mirror check text
    this.mirrorText = this.add.text(w / 2, 14, 'Checking mirrors... / Memeriksa cermin...', { fontSize: '11px', color: '#00ff88', backgroundColor: '#00000088', padding: { x: 8, y: 4 } }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.started = true;
    this.startTime = Date.now();
  }

  private drawEnvironment(w: number, h: number) {
    const g = this.roadGraphics;
    const isSideView = this.maneuverType === 'hill-start' || this.maneuverType === 'ramp-test';

    if (isSideView) {
      // Sky gradient effect
      g.fillStyle(0x87ceeb, 0.3);
      g.fillRect(0, 0, w, h * 0.35);
      // Clouds
      [w * 0.15, w * 0.5, w * 0.8].forEach(cx => {
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx, 40, 18);
        g.fillCircle(cx + 15, 35, 14);
        g.fillCircle(cx - 12, 38, 12);
      });
      // Sun
      g.fillStyle(0xfbbf24, 0.5);
      g.fillCircle(w - 60, 40, 20);
      return;
    }

    // Top-down decorations: trees along edges
    const treePositions = [
      { x: 20, y: 20 }, { x: 20, y: h / 3 }, { x: 20, y: h * 2 / 3 },
      { x: w - 20, y: 20 }, { x: w - 20, y: h / 3 }, { x: w - 20, y: h * 2 / 3 },
    ];

    if (this.maneuverType !== 'road-merging') {
      treePositions.forEach(({ x, y }) => {
        // Tree shadow
        g.fillStyle(0x1a3d15, 0.4);
        g.fillCircle(x + 2, y + 2, 10);
        // Tree canopy
        g.fillStyle(0x228b22, 0.7);
        g.fillCircle(x, y, 10);
        g.fillStyle(0x2d7a2d, 0.5);
        g.fillCircle(x, y, 6);
      });
    }
  }

  private setCarStartPosition(w: number, h: number) {
    const isSideView = this.maneuverType === 'hill-start' || this.maneuverType === 'ramp-test';
    if (isSideView) {
      this.carBody.x = w * 0.1;
      this.carBody.y = h * 0.65 - 14;
      this.carBody.angle = 0;
      return;
    }

    switch (this.maneuverType) {
      case 'parallel-parking':
      case 'side-parking':
        this.carBody.x = w / 4;
        this.carBody.y = h / 2;
        this.carBody.angle = 0;
        break;
      case 'three-point-turn':
        this.carBody.x = 60;
        this.carBody.y = h / 2;
        this.carBody.angle = 0;
        break;
      case 'road-merging':
        this.carBody.x = 60;
        this.carBody.y = h * 0.75;
        this.carBody.angle = -Math.PI / 2;
        break;
      default:
        this.carBody.x = w / 2;
        this.carBody.y = h - 60;
        this.carBody.angle = -Math.PI / 2;
    }
  }

  private setupManeuver(w: number, h: number) {
    const g = this.roadGraphics;

    switch (this.maneuverType) {
      case 'hill-start': {
        // Side view: grass base
        g.fillStyle(0x3d8c3d, 0.6);
        g.fillRect(0, h * 0.65 + 8, w, h);

        // Road surface (flat + slope)
        g.fillStyle(0x555555);
        g.fillRect(0, h * 0.65, w * 0.3, 8);

        // Slope surface
        g.fillStyle(0x666666);
        g.beginPath();
        g.moveTo(w * 0.3, h * 0.65);
        g.lineTo(w * 0.75, h * 0.32);
        g.lineTo(w, h * 0.32);
        g.lineTo(w, h * 0.32 + 8);
        g.lineTo(w * 0.75, h * 0.32 + 8);
        g.lineTo(w * 0.3, h * 0.65 + 8);
        g.closePath();
        g.fillPath();

        // Flat at top
        g.fillStyle(0x555555);
        g.fillRect(w * 0.75, h * 0.32, w * 0.25, 8);

        // Ground under slope
        g.fillStyle(0x4a3728);
        g.beginPath();
        g.moveTo(0, h * 0.65 + 8);
        g.lineTo(w * 0.3, h * 0.65 + 8);
        g.lineTo(w * 0.75, h * 0.32 + 8);
        g.lineTo(w, h * 0.32 + 8);
        g.lineTo(w, h);
        g.lineTo(0, h);
        g.closePath();
        g.fillPath();

        // Grass patches on ground
        for (let i = 0; i < 8; i++) {
          g.fillStyle(0x2d7a2d, 0.3);
          g.fillCircle(Math.random() * w, h * 0.7 + Math.random() * h * 0.25, 5 + Math.random() * 8);
        }

        // Stop line on slope
        const stopX = w * 0.55;
        const t = (stopX - w * 0.3) / (w * 0.45);
        const stopY = h * 0.65 - t * (h * 0.33);
        g.lineStyle(3, 0xff4444);
        g.lineBetween(stopX - 25, stopY, stopX + 25, stopY);
        this.add.text(stopX + 28, stopY - 8, 'STOP', { fontSize: '11px', color: '#ff4444', fontStyle: 'bold' });

        // Goal at top right
        this.goalZone = this.add.rectangle(w * 0.88, h * 0.32 - 14, 50, 25).setVisible(false);
        g.fillStyle(0x00ff00, 0.15);
        g.fillRect(w * 0.88 - 25, h * 0.32 - 26, 50, 25);
        this.add.text(w * 0.88 - 14, h * 0.32 - 24, 'FINISH', { fontSize: '9px', color: '#00ff00' });
        break;
      }
      case 'ramp-test': {
        // Side view with ramp (up then down)
        g.fillStyle(0x3d8c3d, 0.6);
        g.fillRect(0, h * 0.65 + 8, w, h);

        // Flat road start
        g.fillStyle(0x555555);
        g.fillRect(0, h * 0.65, w * 0.2, 8);

        // Ramp up
        g.fillStyle(0x666666);
        g.beginPath();
        g.moveTo(w * 0.2, h * 0.65);
        g.lineTo(w * 0.5, h * 0.32);
        g.lineTo(w * 0.5, h * 0.32 + 8);
        g.lineTo(w * 0.2, h * 0.65 + 8);
        g.closePath();
        g.fillPath();

        // Flat top
        g.fillStyle(0x555555);
        g.fillRect(w * 0.5, h * 0.32, w * 0.1, 8);

        // Ramp down
        g.fillStyle(0x666666);
        g.beginPath();
        g.moveTo(w * 0.6, h * 0.32);
        g.lineTo(w * 0.85, h * 0.65);
        g.lineTo(w * 0.85, h * 0.65 + 8);
        g.lineTo(w * 0.6, h * 0.32 + 8);
        g.closePath();
        g.fillPath();

        // Flat end
        g.fillStyle(0x555555);
        g.fillRect(w * 0.85, h * 0.65, w * 0.15, 8);

        // Ground
        g.fillStyle(0x4a3728);
        g.beginPath();
        g.moveTo(0, h * 0.65 + 8);
        g.lineTo(w * 0.2, h * 0.65 + 8);
        g.lineTo(w * 0.5, h * 0.32 + 8);
        g.lineTo(w * 0.6, h * 0.32 + 8);
        g.lineTo(w * 0.85, h * 0.65 + 8);
        g.lineTo(w, h * 0.65 + 8);
        g.lineTo(w, h);
        g.lineTo(0, h);
        g.closePath();
        g.fillPath();

        // Stop at top
        g.lineStyle(3, 0xffaa00);
        g.lineBetween(w * 0.52, h * 0.32 - 3, w * 0.58, h * 0.32 - 3);
        this.add.text(w * 0.55 + 8, h * 0.32 - 14, 'STOP', { fontSize: '10px', color: '#ffaa00' });

        // Goal at end
        this.goalZone = this.add.rectangle(w * 0.93, h * 0.65 - 14, 40, 25).setVisible(false);
        g.fillStyle(0x00ff00, 0.15);
        g.fillRect(w * 0.93 - 20, h * 0.65 - 26, 40, 25);
        break;
      }
      case 'parallel-parking':
      case 'side-parking': {
        // Road
        g.fillStyle(0x555555);
        g.fillRect(0, h / 2 - 60, w, 120);
        // Road markings
        g.lineStyle(1, 0xffffff, 0.3);
        for (let dx = 0; dx < w; dx += 30) {
          g.lineBetween(dx, h / 2, dx + 15, h / 2);
        }
        // Parking bay
        g.fillStyle(0x444444);
        g.fillRect(w / 2 - 45, h / 2 + 60, 90, 85);
        g.lineStyle(2, 0xffffff);
        g.strokeRect(w / 2 - 45, h / 2 + 60, 90, 85);
        // Poles / cones
        this.addCone(w / 2 - 45, h / 2 + 60);
        this.addCone(w / 2 + 45, h / 2 + 60);
        this.addCone(w / 2 - 45, h / 2 + 145);
        this.addCone(w / 2 + 45, h / 2 + 145);
        // Parked cars (decorative)
        this.drawParkedCar(w / 2 - 130, h / 2 + 90);
        this.drawParkedCar(w / 2 + 130, h / 2 + 90);
        this.goalZone = this.add.rectangle(w / 2, h / 2 + 102, 70, 65).setVisible(false);
        break;
      }
      case 'three-point-turn': {
        g.fillStyle(0x555555);
        g.fillRect(0, h / 2 - 45, w, 90);
        // Curbs
        g.fillStyle(0x8B4513);
        g.fillRect(0, h / 2 - 50, w, 5);
        g.fillRect(0, h / 2 + 45, w, 5);
        // Road center line
        g.lineStyle(1, 0xffffff, 0.2);
        for (let dx = 0; dx < w; dx += 25) {
          g.lineBetween(dx, h / 2, dx + 12, h / 2);
        }
        this.add.text(10, h / 2 - 65, 'Curb / Bahu jalan', { fontSize: '9px', color: '#aaa' });
        this.add.text(10, h / 2 + 54, 'Curb / Bahu jalan', { fontSize: '9px', color: '#aaa' });
        this.goalZone = this.add.rectangle(w - 60, h / 2, 40, 60).setVisible(false);
        // Green direction arrow
        g.lineStyle(2, 0x00ff00, 0.2);
        g.lineBetween(40, h / 2, w - 40, h / 2);
        break;
      }
      case 's-curve': {
        g.fillStyle(0x555555);
        const path = new Phaser.Curves.Spline([
          new Phaser.Math.Vector2(w / 2, h - 20),
          new Phaser.Math.Vector2(w / 2 + 80, h * 0.7),
          new Phaser.Math.Vector2(w / 2 - 80, h * 0.3),
          new Phaser.Math.Vector2(w / 2, 20),
        ]);
        for (let t = 0; t <= 1; t += 0.01) {
          const p = path.getPoint(t);
          g.fillCircle(p.x, p.y, 32);
        }
        for (let t = 0; t <= 1; t += 0.12) {
          const p = path.getPoint(t);
          const tangent = path.getTangent(t);
          this.addCone(p.x + tangent.y * 37, p.y - tangent.x * 37);
          this.addCone(p.x - tangent.y * 37, p.y + tangent.x * 37);
        }
        this.goalZone = this.add.rectangle(w / 2, 30, 60, 40).setVisible(false);
        break;
      }
      case 'z-curve': {
        g.fillStyle(0x555555);
        // Z path segments
        g.fillRect(w / 2 - 30, h - 100, 60, 100);
        g.fillRect(w / 2 - 30, h - 130, 130, 60);
        g.fillRect(w / 2 + 70, h - 240, 60, 170);
        g.fillRect(w / 2 - 70, h - 270, 170, 60);
        g.fillRect(w / 2 - 70, h - 370, 60, 160);
        // Cones at corners
        this.addCone(w / 2 - 30, h - 100);
        this.addCone(w / 2 + 30, h - 100);
        this.addCone(w / 2 + 100, h - 130);
        this.addCone(w / 2 + 70, h - 240);
        this.addCone(w / 2 - 70, h - 270);
        this.addCone(w / 2 + 100, h - 270);
        this.goalZone = this.add.rectangle(w / 2 - 40, 40, 60, 40).setVisible(false);
        break;
      }
      case 'road-merging': {
        // Main road (horizontal, 2 lanes)
        g.fillStyle(0x555555);
        g.fillRect(0, h * 0.3, w, 100);
        // Lane divider
        g.lineStyle(2, 0xffffff, 0.4);
        for (let dx = 0; dx < w; dx += 30) {
          g.lineBetween(dx, h * 0.3 + 50, dx + 15, h * 0.3 + 50);
        }
        // Acceleration lane (merge ramp from bottom)
        g.fillStyle(0x555555);
        g.beginPath();
        g.moveTo(0, h * 0.75);
        g.lineTo(0, h * 0.75 + 40);
        g.lineTo(w * 0.5, h * 0.3 + 100);
        g.lineTo(w * 0.5, h * 0.3 + 60);
        g.closePath();
        g.fillPath();
        // Merge area indicator
        g.lineStyle(2, 0xffaa00, 0.5);
        g.lineBetween(w * 0.4, h * 0.3 + 95, w * 0.6, h * 0.3 + 95);

        // Road edge markings
        g.lineStyle(2, 0xffffff, 0.6);
        g.lineBetween(0, h * 0.3, w, h * 0.3);
        g.lineBetween(0, h * 0.3 + 100, w, h * 0.3 + 100);

        // Goal (successfully merged into main road)
        this.goalZone = this.add.rectangle(w - 50, h * 0.3 + 75, 60, 40).setVisible(false);
        g.fillStyle(0x00ff00, 0.1);
        g.fillRect(w - 80, h * 0.3 + 55, 60, 40);

        // Spawn obstacle cars on main road
        for (let i = 0; i < 3; i++) {
          const ox = w * 0.1 + i * w * 0.3;
          const oy = h * 0.3 + 25 + (i % 2) * 50;
          const rect = this.add.rectangle(ox, oy, 20, 36, 0xef4444).setStrokeStyle(1, 0xb91c1c);
          this.obstacleCars.push({ rect, speed: 40 + Math.random() * 30, y: oy });
        }

        // Decorations: buildings on top
        g.fillStyle(0x6b7280, 0.5);
        g.fillRect(30, 20, 40, 60);
        g.fillRect(120, 10, 30, 70);
        g.fillRect(w - 100, 15, 35, 65);
        // Windows
        g.fillStyle(0xfbbf24, 0.4);
        [30, 120, w - 100].forEach(bx => {
          for (let wy = 0; wy < 3; wy++) {
            g.fillRect(bx + 5, 25 + wy * 18, 8, 8);
            g.fillRect(bx + 18, 25 + wy * 18, 8, 8);
          }
        });
        break;
      }
      default: {
        g.fillStyle(0x555555);
        g.fillRect(w / 2 - 50, 0, 100, h);
        this.goalZone = this.add.rectangle(w / 2, 40, 80, 40).setVisible(false);
      }
    }
  }

  private drawParkedCar(x: number, y: number) {
    const g = this.roadGraphics;
    g.fillStyle(0x94a3b8);
    g.fillRect(x - 10, y - 18, 20, 36);
    g.fillStyle(0x64748b);
    g.fillRect(x - 6, y - 12, 12, 5);
  }

  private addCone(x: number, y: number) {
    const cone = this.add.circle(x, y, 5, 0xff6600).setStrokeStyle(1.5, 0xff3300);
    this.cones.push(cone);
  }

  update(_time: number, delta: number) {
    if (!this.started || this.completed) return;

    const dt = delta / 1000;
    const isSideView = this.maneuverType === 'hill-start' || this.maneuverType === 'ramp-test';
    const accel = 120;
    const maxSteer = 0.04; // radians per frame (gradual steering)
    const steerReturn = 0.06;

    const up = this.cursors?.up?.isDown || this.wasd?.W?.isDown || this.touchControls.up;
    const down = this.cursors?.down?.isDown || this.wasd?.S?.isDown || this.touchControls.down;
    const left = this.cursors?.left?.isDown || this.wasd?.A?.isDown || this.touchControls.left;
    const right = this.cursors?.right?.isDown || this.wasd?.D?.isDown || this.touchControls.right;

    if (isSideView) {
      // Side view physics: horizontal movement along road profile
      if (up || right) this.carBody.speed += accel * dt;
      if (down || left) this.carBody.speed -= accel * dt * 0.5;

      // Gravity on slope
      const w = this.scale.width;
      const h = this.scale.height;
      const gravity = 30;

      if (this.maneuverType === 'hill-start') {
        if (this.carBody.x > w * 0.3 && this.carBody.x < w * 0.75) {
          this.carBody.speed -= gravity * dt; // gravity pulls back on slope
        }
      } else {
        // Ramp: gravity on uphill, assists on downhill
        if (this.carBody.x > w * 0.2 && this.carBody.x < w * 0.5) {
          this.carBody.speed -= gravity * dt;
        } else if (this.carBody.x > w * 0.6 && this.carBody.x < w * 0.85) {
          this.carBody.speed += gravity * 0.3 * dt;
        }
      }

      this.carBody.speed *= 0.97;
      this.carBody.x += this.carBody.speed * dt;
      this.carBody.x = Phaser.Math.Clamp(this.carBody.x, 25, this.scale.width - 25);

      // Y position based on road profile
      this.carBody.y = this.getSideViewY(this.carBody.x, w, h) - 14;

      // Rotation to match slope angle
      const x1 = this.carBody.x - 2;
      const x2 = this.carBody.x + 2;
      const y1 = this.getSideViewY(x1, w, h);
      const y2 = this.getSideViewY(x2, w, h);
      const slopeAngle = Math.atan2(y2 - y1, x2 - x1);
      this.car.setRotation(slopeAngle);

    } else {
      // Top-down: gradual steering (bicycle model)
      if (up) this.carBody.speed += accel * dt;
      if (down) this.carBody.speed -= accel * dt * 0.6;
      this.carBody.speed *= 0.96;

      // Gradual steering angle change
      if (left) {
        this.carBody.steerAngle -= maxSteer;
      } else if (right) {
        this.carBody.steerAngle += maxSteer;
      } else {
        // Return steering to center
        if (Math.abs(this.carBody.steerAngle) < steerReturn) {
          this.carBody.steerAngle = 0;
        } else {
          this.carBody.steerAngle -= Math.sign(this.carBody.steerAngle) * steerReturn;
        }
      }
      this.carBody.steerAngle = Phaser.Math.Clamp(this.carBody.steerAngle, -0.6, 0.6);

      // Apply steering based on speed (can't turn when stationary)
      const wheelBase = 38;
      if (Math.abs(this.carBody.speed) > 1) {
        const turnRadius = wheelBase / Math.tan(Math.abs(this.carBody.steerAngle) + 0.001);
        const angularVelocity = this.carBody.speed / turnRadius;
        this.carBody.angle += angularVelocity * Math.sign(this.carBody.steerAngle) * dt;
      }

      this.carBody.x += Math.sin(this.carBody.angle) * this.carBody.speed * dt;
      this.carBody.y -= Math.cos(this.carBody.angle) * this.carBody.speed * dt;
      this.carBody.x = Phaser.Math.Clamp(this.carBody.x, 20, this.scale.width - 20);
      this.carBody.y = Phaser.Math.Clamp(this.carBody.y, 20, this.scale.height - 20);
    }

    // Tire tracks
    if (Math.abs(this.carBody.speed) > 5) {
      this.trackGraphics.fillStyle(0x1a1a1a, 0.12);
      this.trackGraphics.fillCircle(this.carBody.x, this.carBody.y, 1.5);
    }

    this.car.setPosition(this.carBody.x, this.carBody.y);
    if (!isSideView) {
      this.car.setRotation(this.carBody.angle);
    }

    // Signal blink
    this.signalBlinkTimer += dt;
    const blinkOn = Math.sin(this.signalBlinkTimer * 6) > 0;
    this.signalIndicatorL.setAlpha(this.signalState === 'left' && blinkOn ? 1 : 0);
    this.signalIndicatorR.setAlpha(this.signalState === 'right' && blinkOn ? 1 : 0);

    // Cone collision
    for (const cone of this.cones) {
      const dist = Phaser.Math.Distance.Between(this.carBody.x, this.carBody.y, cone.x, cone.y);
      if (dist < 18) {
        this.errors++;
        this.hud?.onErrorIncrement();
        cone.setFillStyle(0xff0000);
        this.cones = this.cones.filter((c) => c !== cone);
        this.cameras.main.shake(100, 0.01);
      }
    }

    // Obstacle car movement (merging)
    for (const obs of this.obstacleCars) {
      obs.rect.x += obs.speed * dt;
      if (obs.rect.x > this.scale.width + 30) {
        obs.rect.x = -30;
      }
      // Collision with player
      const dist = Phaser.Math.Distance.Between(this.carBody.x, this.carBody.y, obs.rect.x, obs.rect.y);
      if (dist < 28) {
        this.errors++;
        this.hud?.onErrorIncrement();
        this.cameras.main.shake(150, 0.015);
        // Push player back
        this.carBody.speed = -20;
      }
    }

    // Goal detection
    if (this.goalZone) {
      const dist = Phaser.Math.Distance.Between(this.carBody.x, this.carBody.y, this.goalZone.x, this.goalZone.y);
      if (dist < 30 && Math.abs(this.carBody.speed) < 8 && !this.completed) {
        this.completed = true;
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        this.completionTime = elapsed;
        this.instructionText.setText(`Completed! Errors: ${this.errors} | Time: ${elapsed}s`);
        this.instructionText.setStyle({ ...this.instructionText.style, backgroundColor: "#00880088" });
        const score = Math.max(0, 100 - this.errors * 15);
        this.hud?.onFinish({
          score,
          errors: this.errors,
          stallCount: 0,
          rollbackCm: 0,
          passed: this.errors <= 2,
        });
      }
    }

    const displaySpeed = Math.abs(Math.round(this.carBody.speed));
    this.hud?.onSpeedChange(displaySpeed);
    this.errorText.setText(`Errors / Kesalahan: ${this.errors}`);
    this.speedText.setText(`Speed / Kelajuan: ${displaySpeed}`);
  }

  private getSideViewY(x: number, w: number, h: number): number {
    if (this.maneuverType === 'hill-start') {
      if (x < w * 0.3) return h * 0.65;
      if (x > w * 0.75) return h * 0.32;
      const t = (x - w * 0.3) / (w * 0.45);
      return h * 0.65 - t * (h * 0.33);
    }
    // Ramp
    if (x < w * 0.2) return h * 0.65;
    if (x < w * 0.5) {
      const t = (x - w * 0.2) / (w * 0.3);
      return h * 0.65 - t * (h * 0.33);
    }
    if (x < w * 0.6) return h * 0.32;
    if (x < w * 0.85) {
      const t = (x - w * 0.6) / (w * 0.25);
      return h * 0.32 + t * (h * 0.33);
    }
    return h * 0.65;
  }
}
