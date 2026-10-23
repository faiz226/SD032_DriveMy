// The Swift on Rapier's ray-cast vehicle. Works with any Rapier module and world: the app passes the
// ones @react-three/rapier made, the tests pass @dimforge/rapier3d-compat's own.
//
// FRAME. three.js: +X is the car's nose, +Y up, +Z the car's right (left is -Z). The body origin is
// at the wheelbase centre, at wheel-centre height. The circuit frame is x = X, y = -Z, height = Y,
// and the circuit heading equals the yaw about +Y.
import type { Collider, DynamicRayCastVehicleController, RigidBody, World } from '@dimforge/rapier3d-compat';
import type { CircuitData, SimEvent, Vec2, VehicleSample, WheelSample } from '../contracts';
import { kerbContact, slopeAt } from '../geom';
import { type DriveInput, type DriveParams, G, SWIFT_DRIVE, ackermann, brakes, engineForce, holds, steerToward } from './drive';

type Rapier = typeof import('@dimforge/rapier3d-compat').default;
type V3 = { x: number; y: number; z: number };

/** What the driver is doing: pedals, the handbrake, the gear, and the steering wheel from -1 (full right) to 1 (full left). */
export interface Controls {
  throttle: number;
  brake: number;
  handbrake: boolean;
  gear: 'D' | 'R';
  wheel: number;
}

export const IDLE: Controls = { throttle: 0, brake: 0, handbrake: false, gear: 'D', wheel: 0 };

export interface Pose { x: number; y: number; z: number; yaw: number; pitch?: number }

/** Rotate v by the unit quaternion q. */
export function rotate(q: { x: number; y: number; z: number; w: number }, v: V3): V3 {
  const ix = q.w * v.x + q.y * v.z - q.z * v.y;
  const iy = q.w * v.y + q.z * v.x - q.x * v.z;
  const iz = q.w * v.z + q.x * v.y - q.y * v.x;
  const iw = -q.x * v.x - q.y * v.y - q.z * v.z;
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  };
}

/** Yaw about +Y, then pitch about the car's own +Z (nose up for a positive pitch). */
export function poseQuat(yaw: number, pitch = 0) {
  const cy = Math.cos(yaw / 2);
  const sy = Math.sin(yaw / 2);
  const cp = Math.cos(pitch / 2);
  const sp = Math.sin(pitch / 2);
  return { x: sy * sp, y: sy * cp, z: cy * sp, w: cy * cp };
}

/** three.js world point -> circuit frame (x east, y north). */
export const toCircuit = (p: V3): Vec2 => [p.x, -p.z];

export class Vehicle {
  readonly body: RigidBody;
  readonly collider: Collider;
  readonly ctl: DynamicRayCastVehicleController;
  steer = 0;                            // road-wheel angle, the bicycle model's, radians, + = left
  private holdAt: V3 | null = null;
  private input: DriveInput = { gear: 'D', throttle: 0, brake: 0, handbrake: false, steer: 0 };

  constructor(readonly R: Rapier, readonly world: World, pose: Pose, readonly p: DriveParams = SWIFT_DRIVE) {
    const bottom = p.clearance - p.radius;
    const top = p.H - p.radius;
    const hy = (top - bottom) / 2;
    const m = p.mass;
    this.body = world.createRigidBody(
      R.RigidBodyDesc.dynamic().setCanSleep(false).setTranslation(pose.x, pose.y, pose.z).setRotation(poseQuat(pose.yaw, pose.pitch)),
    );
    const inertia = { x: (m / 12) * ((2 * hy) ** 2 + p.W ** 2), y: (m / 12) * (p.L ** 2 + p.W ** 2), z: (m / 12) * (p.L ** 2 + (2 * hy) ** 2) };
    this.collider = world.createCollider(
      R.ColliderDesc.cuboid(p.L / 2, hy, p.W / 2)
        .setTranslation(0, (top + bottom) / 2, 0)
        .setMassProperties(m, { x: 0, y: p.comHeight - p.radius - (top + bottom) / 2, z: 0 }, inertia, { x: 0, y: 0, z: 0, w: 1 }),
      this.body,
    );
    this.ctl = world.createVehicleController(this.body);
    const rest = p.rest - G / (4 * p.stiffness);   // spring force = stiffness x compression x mass per wheel
    const a = p.wheelbase / 2;
    const t = p.track / 2;
    // 0 front left, 1 front right, 2 rear left, 3 rear right
    for (const [x, z] of [[a, -t], [a, t], [-a, -t], [-a, t]]) this.ctl.addWheel({ x, y: rest, z }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, p.rest, p.radius);
    for (let i = 0; i < 4; i++) {
      this.ctl.setWheelSuspensionStiffness(i, p.stiffness);
      this.ctl.setWheelSuspensionCompression(i, p.dampC);
      this.ctl.setWheelSuspensionRelaxation(i, p.dampR);
      this.ctl.setWheelMaxSuspensionTravel(i, p.travel);
      this.ctl.setWheelMaxSuspensionForce(i, p.maxSusp);
      this.ctl.setWheelFrictionSlip(i, p.frictionSlip);
      this.ctl.setWheelSideFrictionStiffness(i, p.sideStiff);
    }
  }

  forward(): V3 {
    return rotate(this.body.rotation(), { x: 1, y: 0, z: 0 });
  }

  /** Speed along the car's axis, m/s: what the drive layer works with. */
  axisSpeed(): number {
    const f = this.forward();
    const v = this.body.linvel();
    return v.x * f.x + v.y * f.y + v.z * f.z;
  }

  /** Horizontal speed along the car's heading, m/s, signed: what the driver and the rules see. */
  horizontalSpeed(): number {
    const f = this.forward();
    const v = this.body.linvel();
    return (v.x * f.x + v.z * f.z) / (Math.hypot(f.x, f.z) || 1);
  }

  /** Before each physics step: steer toward the wheel, set every wheel's force and brake, update the controller. */
  beforeStep(c: Controls) {
    const p = this.p;
    this.steer = steerToward(p, this.steer, c.wheel, this.horizontalSpeed() * 3.6);
    this.input = { gear: c.gear, throttle: c.throttle, brake: c.brake, handbrake: c.handbrake, steer: this.steer };
    const vf = this.axisSpeed();
    const engine = engineForce(p, this.input, vf);
    const [left, right] = ackermann(p, this.steer);
    const br = brakes(p, this.input);
    let held = 0;
    for (let i = 0; i < 4; i++) {
      const driven = i < 2;
      this.ctl.setWheelEngineForce(i, driven ? engine : 0);
      this.ctl.setWheelBrake(i, br[i]);
      if (this.ctl.wheelIsInContact(i) && !(driven && engine !== 0)) held += br[i];
      if (driven) this.ctl.setWheelSteering(i, i === 0 ? left : right);
    }
    this.ctl.updateVehicle(p.dt, this.R.QueryFilterFlags.EXCLUDE_SENSORS);   // a wheel never stands on a pole
    if (holds(p, held, this.forward().y, engine, vf)) this.holdAt ??= { ...this.body.translation() };
    else this.holdAt = null;
  }

  /**
   * After each physics step. While the brakes hold the car, pin it along its own axis. Below 1 km/h with no
   * pedal on level ground, cancel sideways creep; never on a slope, where it would hide a rollback.
   */
  afterStep(onSlope: boolean) {
    const f = this.forward();
    if (this.holdAt) {
      const pos = this.body.translation();
      const d = (pos.x - this.holdAt.x) * f.x + (pos.y - this.holdAt.y) * f.y + (pos.z - this.holdAt.z) * f.z;
      this.body.setTranslation({ x: pos.x - f.x * d, y: pos.y - f.y * d, z: pos.z - f.z * d }, true);
      const v = this.body.linvel();
      const va = v.x * f.x + v.y * f.y + v.z * f.z;
      this.body.setLinvel({ x: v.x - f.x * va, y: v.y - f.y * va, z: v.z - f.z * va }, true);
      return;
    }
    if (!onSlope && this.input.throttle === 0 && Math.abs(this.horizontalSpeed()) < 1 / 3.6) {
      const r = rotate(this.body.rotation(), { x: 0, y: 0, z: 1 });
      const v = this.body.linvel();
      const side = v.x * r.x + v.z * r.z;
      this.body.setLinvel({ x: v.x - r.x * side, y: v.y, z: v.z - r.z * side }, true);
    }
  }

  /** The rear-axle centre, three.js world. */
  rearAxle(): V3 {
    const pos = this.body.translation();
    const r = rotate(this.body.rotation(), { x: -this.p.wheelbase / 2, y: 0, z: 0 });
    return { x: pos.x + r.x, y: pos.y + r.y, z: pos.z + r.z };
  }

  /** The circuit heading (radians, anticlockwise from east). */
  heading(): number {
    const f = this.forward();
    return Math.atan2(-f.z, f.x);
  }

  /** One physics step as the rules engine sees it, in the circuit frame. */
  sample(t: number, circuit: CircuitData, tyreWidth: number): VehicleSample {
    const rear = this.rearAxle();
    const heading = this.heading();
    const wheels = [0, 1, 2, 3].map((i): WheelSample => {
      const cp = this.ctl.wheelIsInContact(i) ? this.ctl.wheelContactPoint(i) : null;
      if (!cp) return { x: NaN, y: NaN, z: NaN, onKerb: null };
      const [x, y] = toCircuit(cp);
      return { x, y, z: cp.y, onKerb: kerbContact(circuit, [x, y], tyreWidth) };
    }) as VehicleSample['wheels'];
    const [rx, ry] = toCircuit(rear);
    return {
      t, x: rx, y: ry, z: rear.y, heading,
      speedKmh: this.horizontalSpeed() * 3.6,
      gear: this.input.gear, handbrake: this.input.handbrake, brake: this.input.brake, steer: this.steer,
      wheels,
      slope: slopeAt(circuit, [rx, ry], heading, this.p.wheelbase),
    };
  }

  /** Touches between the body and the yard's poles in the last step. */
  poleHits(poles: Map<number, number>, t: number): SimEvent[] {
    const hits: SimEvent[] = [];
    this.world.intersectionPairsWith(this.collider, (other) => {
      const index = poles.get(other.handle);
      if (index === undefined || hits.some((h) => h.type === 'obstacle-hit' && h.index === index)) return;
      hits.push({ type: 'obstacle-hit', kind: 'pole', index, t, at: toCircuit(other.translation()) });
    });
    return hits;
  }

  /** Move the car (a practice restart): stopped, wheels straight. */
  teleport(pose: Pose) {
    this.body.setTranslation({ x: pose.x, y: pose.y, z: pose.z }, true);
    this.body.setRotation(poseQuat(pose.yaw, pose.pitch), true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.holdAt = null;
    this.steer = 0;
  }

  dispose() {
    // React's development double-mount and hot reloads replace @react-three/rapier's world under us;
    // touching a body that is not in the current world makes Rapier panic. Remove only what is still there.
    if (!this.world.getRigidBody(this.body.handle)) return;
    this.world.removeVehicleController(this.ctl);
    this.world.removeRigidBody(this.body);
  }
}
