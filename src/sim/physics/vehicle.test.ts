// @vitest-environment node
// Every target of docs/v2-plan/physics/car-check.cjs, run through the app's own drive layer.
import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, describe, expect, it } from 'vitest';
import { circuit } from '../data';
import { G, SWIFT_DRIVE as P, lockAt } from './drive';
import { type Controls, IDLE, Vehicle, poseQuat, rotate, toCircuit } from './vehicle';

const SLOPE = Math.atan(0.12);
const kmh = (ms: number) => ms * 3.6;
const still: Controls = { ...IDLE, brake: 1 };

beforeAll(async () => {
  await RAPIER.init();
});

function makeWorld(slope: boolean) {
  const world = new RAPIER.World({ x: 0, y: -G, z: 0 });
  world.timestep = P.dt;
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(200, 0.5, 200).setTranslation(0, -0.5, 0), ground);
  if (slope) {   // a 12% plane rising along +X from x = 0
    const q = poseQuat(0, SLOPE);
    const c = rotate(q, { x: 40, y: -0.5, z: 0 });
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setRotation(q).setTranslation(c.x, c.y, c.z));
    world.createCollider(RAPIER.ColliderDesc.cuboid(40, 0.5, 20), body);
  }
  return world;
}

const onLevel = (world: RAPIER.World) => new Vehicle(RAPIER, world, { x: 0, y: P.radius + 0.02, z: 0, yaw: 0 });
function onHill(world: RAPIER.World) {
  const q = poseQuat(0, SLOPE);
  const d = rotate(q, { x: 12, y: 0, z: 0 });
  const n = rotate(q, { x: 0, y: 1, z: 0 });
  const h = P.radius + 0.02;
  return new Vehicle(RAPIER, world, { x: d.x + n.x * h, y: d.y + n.y * h, z: 0, yaw: 0, pitch: SLOPE });
}

/** Step the car; `each` may stop early by returning false. Returns the seconds run. */
function run(world: RAPIER.World, car: Vehicle, c: Controls | ((t: number) => Controls), seconds: number, onSlope = false, each?: (t: number) => boolean | void) {
  const n = Math.round(seconds / P.dt);
  for (let k = 0; k < n; k++) {
    car.beforeStep(typeof c === 'function' ? c(k * P.dt) : c);
    world.step();
    car.afterStep(onSlope);
    if (each && each(k * P.dt) === false) return k * P.dt;
  }
  return seconds;
}

const along = (car: Vehicle) => { const p = car.body.translation(); return p.x * Math.cos(SLOPE) + p.y * Math.sin(SLOPE); };

describe('the Swift on Rapier meets every car-check target', () => {
  it('rests on all four wheels, on the ground and not on itself', () => {
    const world = makeWorld(false);
    const car = onLevel(world);
    run(world, car, still, 1.5);
    for (let i = 0; i < 4; i++) {
      expect(car.ctl.wheelIsInContact(i), `wheel ${i}`).toBe(true);
      expect(car.ctl.wheelGroundObject(i)?.parent()?.handle).not.toBe(car.body.handle);
    }
  });

  it('creeps at 4-6 km/h on level ground, and -4 to -6 in reverse', () => {
    for (const [gear, lo, hi] of [['D', 4, 6], ['R', -6, -4]] as const) {
      const world = makeWorld(false);
      const car = onLevel(world);
      run(world, car, still, 1);
      run(world, car, { ...IDLE, gear }, 20);
      const v = kmh(car.horizontalSpeed());
      expect(v, gear).toBeGreaterThanOrEqual(lo);
      expect(v, gear).toBeLessThanOrEqual(hi);
    }
  });

  it('reaches 30 km/h in 2.5-3.5 s and stops from it in 4-6 m', () => {
    const world = makeWorld(false);
    const car = onLevel(world);
    run(world, car, still, 1);
    const t = run(world, car, { ...IDLE, throttle: 1 }, 10, false, () => kmh(car.horizontalSpeed()) < 30);
    expect(t).toBeGreaterThanOrEqual(2.5);
    expect(t).toBeLessThanOrEqual(3.5);
    const p0 = { ...car.body.translation() };
    run(world, car, { ...IDLE, brake: 1 }, 10, false, () => Math.abs(kmh(car.horizontalSpeed())) > 0.1);
    const p1 = car.body.translation();
    const d = Math.hypot(p1.x - p0.x, p1.z - p0.z);
    expect(d).toBeGreaterThanOrEqual(4);
    expect(d).toBeLessThanOrEqual(6);
  });

  it.each([
    ['the handbrake alone', { ...IDLE, handbrake: true }],
    ['the brake alone', { ...IDLE, brake: 1 }],
  ])('holds on the 12%% hill with %s: under 0.05 m in 5 s', (_, c) => {
    const world = makeWorld(true);
    const car = onHill(world);
    run(world, car, { ...IDLE, brake: 1, handbrake: true }, 2, true);
    const a0 = along(car);
    run(world, car, c, 5, true);
    expect(Math.abs(a0 - along(car))).toBeLessThanOrEqual(0.05);
  });

  it('rolls back with nothing held (over 0.30 m in 2 s), and with a 10% brake (over 0.30 m in 3 s)', () => {
    for (const [c, secs] of [[IDLE, 2], [{ ...IDLE, brake: 0.1 }, 3]] as const) {
      const world = makeWorld(true);
      const car = onHill(world);
      run(world, car, { ...IDLE, brake: 1, handbrake: true }, 2, true);
      const a0 = along(car);
      run(world, car, c, secs, true);
      expect(a0 - along(car)).toBeGreaterThan(0.3);
    }
  });

  it('starts on the hill: 40% throttle from the handbrake rolls back under 0.05 m; 60% climbs 2 m in 5 s', () => {
    for (const [throttle, check] of [[0.4, 'rollback'], [0.6, 'climb']] as const) {
      const world = makeWorld(true);
      const car = onHill(world);
      run(world, car, { ...IDLE, brake: 1, handbrake: true }, 2, true);
      const a0 = along(car);
      let lowest = a0;
      run(world, car, { ...IDLE, throttle }, 5, true, () => { lowest = Math.min(lowest, along(car)); });
      if (check === 'rollback') expect(a0 - lowest).toBeLessThan(0.05);
      else expect(along(car) - a0).toBeGreaterThanOrEqual(2);
    }
  });

  it('turns at full lock and walking pace on a 3.43 m rear-axle radius (+-0.15)', () => {
    const world = makeWorld(false);
    const car = onLevel(world);
    run(world, car, still, 1);
    run(world, car, { ...IDLE, wheel: 1 }, 6);
    const pts: { x: number; z: number }[] = [];
    run(world, car, { ...IDLE, wheel: 1 }, 30, false, () => { const r = car.rearAxle(); pts.push({ x: r.x, z: r.z }); });
    // least-squares circle (Kasa) in the XZ plane
    const n = pts.length;
    let sx = 0; let sz = 0; let sxx = 0; let szz = 0; let sxz = 0; let sxr = 0; let szr = 0; let sr = 0;
    for (const p of pts) { const r = p.x * p.x + p.z * p.z; sx += p.x; sz += p.z; sxx += p.x * p.x; szz += p.z * p.z; sxz += p.x * p.z; sxr += p.x * r; szr += p.z * r; sr += r; }
    const A = [[sxx, sxz, sx], [sxz, szz, sz], [sx, sz, n]];
    const b = [sxr, szr, sr];
    const det = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det(A);
    const [a1, a2, a3] = [0, 1, 2].map((j) => det(A.map((row, i) => row.map((v, k) => (k === j ? b[i] : v)))) / D);
    const radius = Math.sqrt(a3 + (a1 / 2) ** 2 + (a2 / 2) ** 2);
    expect(Math.abs(radius - 3.43)).toBeLessThanOrEqual(0.15);
  });

  it('does not creep sideways at rest: under 0.01 m in 5 s', () => {
    const world = makeWorld(false);
    const car = onLevel(world);
    run(world, car, still, 1);
    const p0 = { ...car.body.translation() };
    run(world, car, still, 5);
    const p1 = car.body.translation();
    expect(Math.hypot(p1.x - p0.x, p1.z - p0.z)).toBeLessThan(0.01);
  });

  it('creeps over a 0.13 m kerb: no wheel leaves the ground and the body never touches it', () => {
    const world = makeWorld(false);
    const kb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const kerb = world.createCollider(RAPIER.ColliderDesc.cuboid(0.1, 0.065, 5).setTranslation(6, 0.065, 0), kb);
    const car = onLevel(world);
    run(world, car, still, 1);
    let airborne = 0;
    let bodyHit = false;
    run(world, car, IDLE, 12, false, () => {
      if ([0, 1, 2, 3].every((i) => !car.ctl.wheelIsInContact(i))) airborne++;
      world.contactPairsWith(kerb, (other) => {
        if (other.parent()?.handle !== car.body.handle) return;
        world.contactPair(kerb, other, (m) => { if (m.numContacts() > 0) bodyHit = true; });
      });
    });
    expect(car.body.translation().x).toBeGreaterThan(8);
    expect(airborne).toBe(0);
    expect(bodyHit).toBe(false);
  });
});

describe('the driver', () => {
  it('never selects reverse by holding the brake at rest on the hill', () => {
    const world = makeWorld(true);
    const car = onHill(world);
    run(world, car, { ...IDLE, brake: 1 }, 5, true);
    const s = car.sample(5, circuit, 0.185);
    expect(s.gear).toBe('D');
    expect(Math.abs(s.speedKmh)).toBeLessThan(0.1);
  });

  it('narrows the steering lock with speed, as the PRD schedules it', () => {
    expect(lockAt(P, 0)).toBe(0.62);
    expect(lockAt(P, 5)).toBe(0.62);        // full lock at walking pace
    expect(lockAt(P, 45)).toBeCloseTo(0.16, 6);
    expect(lockAt(P, 80)).toBeCloseTo(0.16, 6);
    expect(lockAt(P, 25)).toBeGreaterThan(0.16);
    expect(lockAt(P, 25)).toBeLessThan(0.62);
  });

  it('moves the wheels toward the request at 0.8 rad/s: never a snap', () => {
    const world = makeWorld(false);
    const car = onLevel(world);
    run(world, car, still, 0.5);
    run(world, car, { ...still, wheel: 1 }, 0.25);
    expect(car.steer).toBeCloseTo(0.8 * 0.25, 2);
  });
});

describe('frames', () => {
  it('maps three.js to the circuit frame: x = X, y = -Z, and yaw is the heading', () => {
    expect(toCircuit({ x: 3, y: 9, z: -4 })).toEqual([3, 4]);
    for (const yaw of [0, 0.5, Math.PI / 2, 2.5, -1]) {
      const f = rotate(poseQuat(yaw), { x: 1, y: 0, z: 0 });
      expect(Math.atan2(-f.z, f.x)).toBeCloseTo(Math.atan2(Math.sin(yaw), Math.cos(yaw)), 9);
    }
    const nose = rotate(poseQuat(0, 0.2), { x: 1, y: 0, z: 0 });
    expect(nose.y).toBeCloseTo(Math.sin(0.2), 9);   // a positive pitch raises the nose
  });
});
