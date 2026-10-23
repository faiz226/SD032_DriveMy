// DriveMy v2: headless check of the Swift's drive layer on Rapier's ray-cast vehicle.
// Reference for WP3: port it to vitest and keep every check. Not app code.
//
// Usage (from the app folder, after npm ci):
//   node docs/v2-plan/physics/car-check.cjs node_modules/@dimforge/rapier3d-compat
//   node docs/v2-plan/physics/car-check.cjs node_modules/@dimforge/rapier3d-compat '{"stiffness":25}'
// The optional JSON overrides any value in P. Exit code 0 means every target was met.
//
// Frame, as in the app: three.js, X forward, Y up, Z to the car's right. The body origin is at
// the wheelbase centre, at wheel-centre height. Results on Rapier 0.19.2 (14 Oct 2026): all 19 met.
// Kerb check: a body box 0.12 m above the road hits the kerb; 0.16 m clears it; 0.20 m is used.
const RAPIER = require(require('path').resolve(process.argv[2], 'rapier.cjs'));

const P = Object.assign({
  mass: 900, L: 3.842, W: 1.730, H: 1.622, wheelbase: 2.45, track: 1.493,
  radius: 0.324, clearance: 0.20, comHeight: 0.55,     // clearance: bottom of the body box above the road
  rest: 0.20, travel: 0.20, stiffness: 20, dampC: 1.5, dampR: 2.2,
  maxSusp: 9000, frictionSlip: 1.2, sideStiff: 1.0,
  fMax: 1350, vTop: 25,                     // per driven (front) wheel, N; falloff speed, m/s
  vCreep: 5 / 3.6, creepKp: 1000, creepCap: 300, engineBrake: 200,   // per front wheel
  brakeMax: 26, handbrake: 20,              // impulse caps per wheel per 1/60 s step
  lock: 0.62, dt: 1 / 60, ackermann: true, hold: true,
}, JSON.parse(process.argv[3] || '{}'));

const G = 9.81, SLOPE = Math.atan(0.12);

function rotZ(a) { return { x: 0, y: 0, z: Math.sin(a / 2), w: Math.cos(a / 2) }; }
function rotate(q, v) {           // rotate vector v by unit quaternion q
  const { x, y, z, w } = q;
  const ix = w * v.x + y * v.z - z * v.y, iy = w * v.y + z * v.x - x * v.z;
  const iz = w * v.z + x * v.y - y * v.x, iw = -x * v.x - y * v.y - z * v.z;
  return { x: ix * w + iw * -x + iy * -z - iz * -y, y: iy * w + iw * -y + iz * -x - ix * -z,
           z: iz * w + iw * -z + ix * -y - iy * -x };
}

function makeWorld(slope) {
  const world = new RAPIER.World({ x: 0, y: -G, z: 0 });
  world.timestep = P.dt;
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(200, 0.5, 200).setTranslation(0, -0.5, 0), ground);
  let slopeCol = null;
  if (slope) {   // a 12% plane rising along +X, starting at x = 0
    const q = rotZ(SLOPE);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setRotation(q)
      .setTranslation(...Object.values(rotate(q, { x: 40, y: -0.5, z: 0 })).slice(0, 3)));
    slopeCol = world.createCollider(RAPIER.ColliderDesc.cuboid(40, 0.5, 20), body);
  }
  return { world, slopeCol };
}

function makeCar(world, at, yawPitch) {
  const q = yawPitch || { x: 0, y: 0, z: 0, w: 1 };
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setCanSleep(false)
    .setTranslation(at.x, at.y, at.z).setRotation(q));
  const bottom = P.clearance - P.radius, top = P.H - P.radius;
  const m = P.mass, hy = (top - bottom) / 2;
  const inertia = { x: m / 12 * ((2 * hy) ** 2 + P.W ** 2), y: m / 12 * (P.L ** 2 + P.W ** 2),
                    z: m / 12 * (P.L ** 2 + (2 * hy) ** 2) };
  world.createCollider(RAPIER.ColliderDesc.cuboid(P.L / 2, hy, P.W / 2)
    .setTranslation(0, (top + bottom) / 2, 0)
    .setMassProperties(m, { x: 0, y: P.comHeight - P.radius - (top + bottom) / 2, z: 0 }, inertia,
                       { x: 0, y: 0, z: 0, w: 1 }), body);
  const v = world.createVehicleController(body);
  const staticLen = P.rest - G / (4 * P.stiffness);         // spring force = k * x * mass per wheel
  const a = P.wheelbase / 2, t = P.track / 2;
  // 0 FL, 1 FR, 2 RL, 3 RR. Left is -Z.
  for (const [x, z] of [[a, -t], [a, t], [-a, -t], [-a, t]]) {
    v.addWheel({ x, y: staticLen, z }, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, P.rest, P.radius);
  }
  for (let i = 0; i < 4; i++) {
    v.setWheelSuspensionStiffness(i, P.stiffness);
    v.setWheelSuspensionCompression(i, P.dampC);
    v.setWheelSuspensionRelaxation(i, P.dampR);
    v.setWheelMaxSuspensionTravel(i, P.travel);
    v.setWheelMaxSuspensionForce(i, P.maxSusp);
    v.setWheelFrictionSlip(i, P.frictionSlip);
    v.setWheelSideFrictionStiffness(i, P.sideStiff);
  }
  return { body, v };
}

// The app's drive layer: gear D/R, throttle 0..1, brake 0..1, handbrake, steer (rad, + = left).
function drive(car, input) {
  const { body, v } = car;
  const q = body.rotation(), lv = body.linvel();
  const fwd = rotate(q, { x: 1, y: 0, z: 0 });
  const vf = lv.x * fwd.x + lv.y * fwd.y + lv.z * fwd.z;      // along the car's axis
  const dir = input.gear === 'R' ? -1 : 1, s = dir * vf;
  let f = 0;
  if (input.brake <= 0) {
    f = Math.max(-P.engineBrake, Math.min(P.creepCap, P.creepKp * (P.vCreep - s)));
    if (input.throttle > 0) f = Math.max(f, input.throttle * P.fMax * Math.max(0.3, 1 - s / P.vTop));
  }
  // Ackermann: the input is the bicycle-model angle; each front wheel points at the same centre.
  const d = input.steer || 0, R = Math.abs(d) > 1e-4 ? P.wheelbase / Math.tan(Math.abs(d)) : Infinity;
  const inner = Math.atan(P.wheelbase / (R - P.track / 2)), outer = Math.atan(P.wheelbase / (R + P.track / 2));
  const steer = P.ackermann && R < Infinity ? (d > 0 ? [inner, outer] : [-outer, -inner]) : [d, d];
  let cap = 0;
  for (let i = 0; i < 4; i++) {
    v.setWheelEngineForce(i, i < 2 ? dir * f : 0);            // front-wheel drive
    const b = Math.max(input.brake > 0 ? input.brake * P.brakeMax : 0, i >= 2 && input.handbrake ? P.handbrake : 0);
    v.setWheelBrake(i, b);
    if (v.wheelIsInContact(i) && !(i < 2 && f !== 0)) cap += b;   // a driven wheel's brake is ignored
    if (i < 2) v.setWheelSteering(i, steer[i]);
  }
  v.updateVehicle(P.dt);
  // Brake hold. Rapier applies the wheel impulses before gravity is integrated, so a braked car
  // creeps down a slope a little every step. While nearly stopped with enough brake held to hold
  // the slope, pin the car along its own axis after each physics step (useAfterPhysicsStep).
  const pull = Math.abs(P.mass * G * fwd.y + 2 * dir * f) * P.dt;    // impulse per step to resist
  if (P.hold && cap >= pull && Math.abs(vf) < 0.1) {
    car.holdAt = car.holdAt || body.translation();
    return () => {
      const p = body.translation(), h = car.holdAt;
      const d = (p.x - h.x) * fwd.x + (p.y - h.y) * fwd.y + (p.z - h.z) * fwd.z;
      body.setTranslation({ x: p.x - fwd.x * d, y: p.y - fwd.y * d, z: p.z - fwd.z * d }, true);
      const lv2 = body.linvel(), va = lv2.x * fwd.x + lv2.y * fwd.y + lv2.z * fwd.z;
      body.setLinvel({ x: lv2.x - fwd.x * va, y: lv2.y - fwd.y * va, z: lv2.z - fwd.z * va }, true);
    };
  }
  car.holdAt = null;
  return null;
}

function horizSpeed(body) {
  const q = body.rotation(), lv = body.linvel(), fwd = rotate(q, { x: 1, y: 0, z: 0 });
  const h = Math.hypot(fwd.x, fwd.z) || 1;
  return (lv.x * fwd.x + lv.z * fwd.z) / h;                  // signed horizontal speed, m/s
}
function rearAxle(body) {
  const p = body.translation(), r = rotate(body.rotation(), { x: -P.wheelbase / 2, y: 0, z: 0 });
  return { x: p.x + r.x, y: p.y + r.y, z: p.z + r.z };
}
function run(world, car, input, seconds, each) {
  const n = Math.round(seconds / P.dt);
  for (let k = 0; k < n; k++) {
    const post = drive(car, typeof input === 'function' ? input(k * P.dt) : input);
    world.step();
    if (post) post();
    if (each && each(k * P.dt) === false) return k * P.dt;
  }
  return seconds;
}
const kmh = (ms) => ms * 3.6;
const out = {};

// Placement: wheel-centre height above the surface along its normal.
function onLevel(world) { return makeCar(world, { x: 0, y: P.radius + 0.02, z: 0 }); }
function onHill(world) {
  const q = rotZ(SLOPE), along = 12, n = rotate(q, { x: 0, y: 1, z: 0 }), d = rotate(q, { x: along, y: 0, z: 0 });
  const h = P.radius + 0.02;
  return makeCar(world, { x: d.x + n.x * h, y: d.y + n.y * h, z: 0 }, q);
}
const still = { gear: 'D', throttle: 0, brake: 1, handbrake: false };

RAPIER.init().then(() => {
// T0: wheel rays must hit the ground, not the car's own body.
{
  const { world } = makeWorld(false), car = onLevel(world);
  run(world, car, still, 1.5);
  out.contact = [0, 1, 2, 3].map((i) => car.v.wheelIsInContact(i) && car.v.wheelGroundObject(i)?.parent()?.handle !== car.body.handle);
  out.rideHeight = +car.body.translation().y.toFixed(3);
}
// T1: creep on level ground settles at 4-6 km/h.
{
  const { world } = makeWorld(false), car = onLevel(world);
  run(world, car, still, 1);
  run(world, car, { gear: 'D', throttle: 0, brake: 0 }, 20);
  out.creepKmh = +kmh(horizSpeed(car.body)).toFixed(2);
}
// T2: 0-30 km/h at full throttle in 2.5-3.5 s.  T3: braking from 30 km/h stops in 4-6 m.
{
  const { world } = makeWorld(false), car = onLevel(world);
  run(world, car, still, 1);
  out.zeroTo30s = +run(world, car, { gear: 'D', throttle: 1, brake: 0 }, 10, () => kmh(horizSpeed(car.body)) < 30).toFixed(2);
  const p0 = car.body.translation();
  run(world, car, { gear: 'D', throttle: 0, brake: 1 }, 10, () => Math.abs(kmh(horizSpeed(car.body))) > 0.1);
  const p1 = car.body.translation();
  out.stop30m = +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2);
}
// T4: handbrake alone holds on the 12% hill (D, no pedals): at most 0.05 m in 5 s.
// T5: the brake alone holds too.  T6: with nothing held, the car rolls back (so rollback can happen).
// T7: releasing the handbrake with 40% throttle in the same step: rollback under 0.05 m.
for (const [name, input] of [
  ['hillHandbrakeDrift', { gear: 'D', throttle: 0, brake: 0, handbrake: true }],
  ['hillBrakeDrift', { gear: 'D', throttle: 0, brake: 1, handbrake: false }],
  ['hillNoHoldRollback2s', { gear: 'D', throttle: 0, brake: 0, handbrake: false }],
  ['hillStartRollback', { gear: 'D', throttle: 0.4, brake: 0, handbrake: false }],
]) {
  const { world } = makeWorld(true), car = onHill(world);
  run(world, car, { gear: 'D', throttle: 0, brake: 1, handbrake: true }, 2);
  const along = () => { const p = car.body.translation(); return p.x * Math.cos(SLOPE) + p.y * Math.sin(SLOPE); };
  const a0 = along();
  let minAlong = a0;
  const trace = [];
  run(world, car, input, name === 'hillNoHoldRollback2s' ? 2 : 5, (t) => { minAlong = Math.min(minAlong, along()); if (Math.abs(t % 1) < 1e-9 || Math.abs(t % 1 - 1) < P.dt / 2) trace.push(+(along() - a0).toFixed(4)); });
  if (process.env.TRACE) console.log(name, JSON.stringify(trace));
  out[name] = name === 'hillStartRollback' ? +(a0 - minAlong).toFixed(3) : +(a0 - along()).toFixed(3);
  if (name === 'hillStartRollback') out.hillStartClimbedM = +(along() - a0).toFixed(2);
}
// T8: full lock at walking pace: rear-axle radius 3.43 m +- 0.15 (kinematic L / tan(0.62)).
{
  const { world } = makeWorld(false), car = onLevel(world);
  run(world, car, still, 1);
  run(world, car, { gear: 'D', throttle: 0, brake: 0, steer: P.lock }, 6);
  const pts = [];
  run(world, car, { gear: 'D', throttle: 0, brake: 0, steer: P.lock }, 30, () => { pts.push(rearAxle(car.body)); });
  // least-squares circle (Kasa) in the XZ plane
  let sx = 0, sz = 0, sxx = 0, szz = 0, sxz = 0, sxr = 0, szr = 0, sr = 0;
  for (const p of pts) { const r = p.x * p.x + p.z * p.z; sx += p.x; sz += p.z; sxx += p.x * p.x; szz += p.z * p.z; sxz += p.x * p.z; sxr += p.x * r; szr += p.z * r; sr += r; }
  const n = pts.length, A = [[sxx, sxz, sx], [sxz, szz, sz], [sx, sz, n]], b = [sxr, szr, sr];
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(A), col = (j) => A.map((row, i) => row.map((v, k) => (k === j ? b[i] : v)));
  const [a1, a2, a3] = [0, 1, 2].map((j) => det(col(j)) / D);
  const cx = a1 / 2, cz = a2 / 2;
  out.lockRadiusM = +Math.sqrt(a3 + cx * cx + cz * cz).toFixed(3);
  out.lockSpeedKmh = +kmh(horizSpeed(car.body)).toFixed(2);
}
// T9: at rest on level ground with the brake held, no sideways creep: under 0.01 m in 5 s.
{
  const { world } = makeWorld(false), car = onLevel(world);
  run(world, car, still, 1);
  const p0 = car.body.translation();
  run(world, car, still, 5);
  const p1 = car.body.translation();
  out.restDriftM = +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(4);
}

// T10: a light brake (10%) cannot hold the hill: the car rolls back (more than 0.30 m in 3 s).
{
  const { world } = makeWorld(true), car = onHill(world);
  run(world, car, { gear: 'D', throttle: 0, brake: 1, handbrake: true }, 2);
  const along = () => { const p = car.body.translation(); return p.x * Math.cos(SLOPE) + p.y * Math.sin(SLOPE); };
  const a0 = along();
  run(world, car, { gear: 'D', throttle: 0, brake: 0.1, handbrake: false }, 3);
  out.hillLightBrakeRollback3s = +(a0 - along()).toFixed(3);
  // T11: 60% throttle from the handbrake: climbs at least 2 m in 5 s.
  const { world: w2 } = makeWorld(true), c2 = onHill(w2);
  run(w2, c2, { gear: 'D', throttle: 0, brake: 1, handbrake: true }, 2);
  const along2 = () => { const p = c2.body.translation(); return p.x * Math.cos(SLOPE) + p.y * Math.sin(SLOPE); };
  const b0 = along2();
  run(w2, c2, { gear: 'D', throttle: 0.6, brake: 0, handbrake: false }, 5);
  out.hillClimb60pc5sM = +(along2() - b0).toFixed(2);
}
// T12: reverse creep settles at -4..-6 km/h.
{
  const { world } = makeWorld(false), car = onLevel(world);
  run(world, car, still, 1);
  run(world, car, { gear: 'R', throttle: 0, brake: 0 }, 15);
  out.reverseCreepKmh = +kmh(horizSpeed(car.body)).toFixed(2);
}
// T13: creeping straight over a 0.13 x 0.20 m kerb: the car crosses it, never leaves the
// ground with all four wheels, and the body never touches the kerb.
{
  const { world } = makeWorld(false);
  const kb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const kerb = world.createCollider(RAPIER.ColliderDesc.cuboid(0.10, 0.065, 5).setTranslation(6, 0.065, 0), kb);
  const car = onLevel(world);
  run(world, car, still, 1);
  let airborne = 0, bodyHit = false, maxVy = 0;
  run(world, car, { gear: 'D', throttle: 0, brake: 0 }, 12, () => {
    if ([0, 1, 2, 3].every((i) => !car.v.wheelIsInContact(i))) airborne++;
    world.contactPairsWith(kerb, (other) => {          // candidates only: confirm a real contact point
      if (other.parent()?.handle !== car.body.handle) return;
      world.contactPair(kerb, other, (m) => { if (m.numContacts() > 0) bodyHit = true; });
    });
    maxVy = Math.max(maxVy, Math.abs(car.body.linvel().y));
  });
  out.kerbCrossed = car.body.translation().x > 8;
  out.kerbAirborneSteps = airborne;
  out.kerbBodyContact = bodyHit;
  out.kerbMaxVertSpeed = +maxVy.toFixed(2);
}

const targets = {
  contact: (v) => v.every(Boolean), creepKmh: (v) => v >= 4 && v <= 6, zeroTo30s: (v) => v >= 2.5 && v <= 3.5,
  stop30m: (v) => v >= 4 && v <= 6, hillHandbrakeDrift: (v) => Math.abs(v) <= 0.05, hillBrakeDrift: (v) => Math.abs(v) <= 0.05,
  hillNoHoldRollback2s: (v) => v > 0.3, hillStartRollback: (v) => v < 0.05, lockRadiusM: (v) => Math.abs(v - 3.43) <= 0.15,
  restDriftM: (v) => v < 0.01, hillLightBrakeRollback3s: (v) => v > 0.3, hillClimb60pc5sM: (v) => v >= 2,
  reverseCreepKmh: (v) => v <= -4 && v >= -6, kerbCrossed: (v) => v === true, kerbAirborneSteps: (v) => v === 0,
  kerbBodyContact: (v) => v === false,
};
let fails = 0;
for (const [k, v] of Object.entries(out)) {
  const ok = targets[k] ? targets[k](v) : null;
  if (ok === false) fails++;
  console.log(`${ok === null ? '    ' : ok ? 'ok  ' : 'FAIL'} ${k}: ${JSON.stringify(v)}`);
}
console.log(fails ? `${fails} target(s) missed` : 'all targets met');
process.exit(fails ? 1 : 0);
});
