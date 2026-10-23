// The Swift's drive layer: pure functions from the driver's inputs to wheel forces, brakes and
// steering. The app and the tests use exactly these; docs/v2-plan/physics/car-check.cjs proved them.

export interface DriveParams {
  mass: number; L: number; W: number; H: number; wheelbase: number; track: number;
  radius: number; clearance: number; comHeight: number;         // clearance: bottom of the body box above the road
  rest: number; travel: number; stiffness: number; dampC: number; dampR: number; maxSusp: number;
  frictionSlip: number; sideStiff: number;
  fMax: number; vTop: number;                                   // per driven (front) wheel, N; falloff speed, m/s
  vCreep: number; creepKp: number; creepCap: number; engineBrake: number;
  brakeMax: number; handbrake: number;                          // impulse caps per wheel per step
  lock: number; lockFast: number; lockFullKmh: number; lockFastKmh: number; steerRate: number;
  dt: number;
}

/** The 2022 Swift on Rapier's ray-cast vehicle: the values car-check.cjs met every target with. */
export const SWIFT_DRIVE: DriveParams = {
  mass: 900, L: 3.842, W: 1.730, H: 1.622, wheelbase: 2.45, track: 1.493,
  radius: 0.324, clearance: 0.20, comHeight: 0.55,
  rest: 0.20, travel: 0.20, stiffness: 20, dampC: 1.5, dampR: 2.2, maxSusp: 9000,
  frictionSlip: 1.2, sideStiff: 1.0,
  fMax: 1350, vTop: 25,
  vCreep: 5 / 3.6, creepKp: 1000, creepCap: 300, engineBrake: 200,
  brakeMax: 26, handbrake: 20,
  lock: 0.62, lockFast: 0.16, lockFullKmh: 6, lockFastKmh: 45, steerRate: 0.8,
  dt: 1 / 60,
};

export const G = 9.81;

export interface DriveInput {
  gear: 'D' | 'R';
  throttle: number;    // 0..1
  brake: number;       // 0..1; never selects reverse
  handbrake: boolean;
  steer: number;       // road-wheel angle, the bicycle model's, radians, + = left
}

/** Engine force per front wheel, N, signed for the gear. `vf` is the speed along the car's axis, m/s. */
export function engineForce(p: DriveParams, input: DriveInput, vf: number): number {
  if (input.brake > 0) return 0;              // Rapier ignores a wheel's brake while it has engine force
  const dir = input.gear === 'R' ? -1 : 1;
  const s = dir * vf;
  let f = Math.max(-p.engineBrake, Math.min(p.creepCap, p.creepKp * (p.vCreep - s)));
  if (input.throttle > 0) f = Math.max(f, input.throttle * p.fMax * Math.max(0.3, 1 - s / p.vTop));
  return dir * f;
}

/** The front wheels' angles [left, right], each aimed at the same turning centre (Ackermann). */
export function ackermann(p: DriveParams, steer: number): [number, number] {
  if (Math.abs(steer) < 1e-4) return [steer, steer];
  const R = p.wheelbase / Math.tan(Math.abs(steer));
  const inner = Math.atan(p.wheelbase / (R - p.track / 2));
  const outer = Math.atan(p.wheelbase / (R + p.track / 2));
  return steer > 0 ? [inner, outer] : [-outer, -inner];
}

/** Brake impulse per wheel [FL, FR, RL, RR]: the pedal on all four, the handbrake on the rear pair. */
export function brakes(p: DriveParams, input: DriveInput): [number, number, number, number] {
  const pedal = input.brake > 0 ? input.brake * p.brakeMax : 0;
  const hand = input.handbrake ? p.handbrake : 0;
  return [pedal, pedal, Math.max(pedal, hand), Math.max(pedal, hand)];
}

/**
 * The brake hold: a braked ray-cast car creeps down a slope a little every step, because the wheel
 * impulses are applied before gravity is integrated. While nearly stopped, with enough brake held on
 * grounded, undriven wheels to resist the slope and the engine, the car is pinned along its axis.
 * `held` is that brake capacity; `slopeSin` the sine of the car's pitch (its forward vector's y).
 */
export function holds(p: DriveParams, held: number, slopeSin: number, engine: number, vf: number): boolean {
  const pull = Math.abs(p.mass * G * slopeSin + 2 * engine) * p.dt;
  return held >= pull && Math.abs(vf) < 0.1;
}

/** The steering lock allowed at a speed: full lock at walking pace, narrowing to lockFast by lockFastKmh. */
export function lockAt(p: DriveParams, kmh: number): number {
  const v = Math.abs(kmh);
  if (v <= p.lockFullKmh) return p.lock;
  if (v >= p.lockFastKmh) return p.lockFast;
  return p.lock + ((p.lockFast - p.lock) * (v - p.lockFullKmh)) / (p.lockFastKmh - p.lockFullKmh);
}

/** The road-wheel angle one step on, moving toward the request at a fixed rate: it never snaps. */
export function steerToward(p: DriveParams, current: number, wheel: number, kmh: number): number {
  const target = Math.max(-1, Math.min(1, wheel)) * lockAt(p, kmh);
  const step = p.steerRate * p.dt;
  return current + Math.max(-step, Math.min(step, target - current));
}
