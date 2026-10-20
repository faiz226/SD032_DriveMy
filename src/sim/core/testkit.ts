// Test driver for the rules engine: a kinematic Swift (bicycle model, rear-axle reference) that turns
// its own motion into VehicleSamples at 60 Hz. Used by the tests only; physics comes in sim/physics.
import type { Mode, Session, SessionState, SimEvent, StationGeometry, StationId, Vec2, VehicleSample, WheelSample } from '../contracts';
import { circuit, rules, swift } from '../data';
import { dir, kerbContact, rad, slopeAt, wrapPi } from '../geom';
import { createSession } from './session';

export const DT = 1 / 60;
export const L = swift.wheelbase_m;
export const LOCK = swift.steer_lock_rad;
export const R_LOCK = L / Math.tan(LOCK);     // rear-axle radius at full lock
const S = circuit.route.samples;

export const station = (id: StationId): StationGeometry => circuit.stations.find((g) => g.id === id)!;

/** Rear-axle pose on the route at distance s (never interpolated across a manoeuvre's break). */
export function routePose(s: number): { at: Vec2; heading: number } {
  let i = S.findIndex((q) => q[0] >= s);
  if (i < 0) i = S.length - 1;
  const b = S[i];
  const a = S[Math.max(0, i - 1)];
  if (Math.hypot(b[1] - a[1], b[2] - a[2]) > 1 && s < b[0]) return { at: [a[1], a[2]], heading: rad(a[3]) };   // the line's end before a break
  if (i === 0 || b[0] === s || Math.hypot(b[1] - a[1], b[2] - a[2]) > 1) return { at: [b[1], b[2]], heading: rad(b[3]) };
  const u = (s - a[0]) / (b[0] - a[0]);
  return { at: [a[1] + u * (b[1] - a[1]), a[2] + u * (b[2] - a[2])], heading: rad(a[3]) + u * wrapPi(rad(b[3]) - rad(a[3])) };
}

/** Route distance of the sample nearest `at` with s in [lo, hi]. */
export function sNear(at: Vec2, lo: number, hi: number): number {
  let best = lo;
  let bestD = Infinity;
  for (const q of S) {
    if (q[0] < lo || q[0] > hi) continue;
    const d = Math.hypot(q[1] - at[0], q[2] - at[1]);
    if (d < bestD) { bestD = d; best = q[0]; }
  }
  return best;
}

export class Driver {
  t = 0;
  at: Vec2;
  heading: number;
  kmh = 0;
  gear: 'D' | 'R' = 'D';
  handbrake = false;
  topDown = false;
  rs: number;                         // where the driver is on the route, for follow()
  kerbOverride: number | null = null; // force wheel 0 onto this kerb ring
  events: SimEvent[] = [];
  last!: SessionState;

  constructor(public session: Session, start: { at: Vec2; heading: number }, rs: number) {
    this.at = [...start.at] as Vec2;
    this.heading = start.heading;
    this.rs = rs;
  }

  sample(): VehicleSample {
    const [hx, hy] = dir(this.heading);
    const half = swift.track_m / 2;
    const wheel = (along: number, left: number): WheelSample => {
      const x = this.at[0] + hx * along - hy * left;
      const y = this.at[1] + hy * along + hx * left;
      return { x, y, z: 0, onKerb: kerbContact(circuit, [x, y], swift.tyre_width_m) };
    };
    const wheels: VehicleSample['wheels'] = [wheel(L, half), wheel(L, -half), wheel(0, half), wheel(0, -half)];
    if (this.kerbOverride !== null) wheels[0] = { ...wheels[0], onKerb: this.kerbOverride };
    return {
      t: this.t, x: this.at[0], y: this.at[1], z: 0, heading: this.heading, speedKmh: this.kmh, gear: this.gear,
      handbrake: this.handbrake, brake: this.kmh === 0 ? 1 : 0, steer: 0, wheels,
      slope: slopeAt(circuit, this.at, this.heading, L),
    };
  }

  tick(): SessionState {
    this.t += DT;
    this.last = this.session.step(this.sample(), this.events, DT, this.topDown);
    this.events = [];
    return this.last;
  }

  /** Follow the route line forward to sTo at a steady speed. */
  follow(sTo: number, kmh: number) {
    this.gear = 'D';
    this.handbrake = false;
    this.kmh = kmh;
    const ds = (kmh / 3.6) * DT;
    while (this.rs < sTo - 1e-9) {
      this.rs = Math.min(sTo, this.rs + ds);
      const q = routePose(this.rs);
      this.at = q.at;
      this.heading = q.heading;
      this.tick();
    }
  }

  stop(seconds: number, handbrake = false) {
    this.kmh = 0;
    this.handbrake = handbrake;
    for (let i = 0; i < Math.round(seconds / DT); i++) this.tick();
  }

  /** Bicycle model: drive `dist` metres (negative = backwards) with a steady road-wheel angle (+ = left). */
  arc(dist: number, kmh: number, steer: number, gear: 'D' | 'R' = kmh < 0 ? 'R' : 'D') {
    this.gear = gear;
    this.handbrake = false;
    this.kmh = kmh;
    const n = Math.max(1, Math.ceil(Math.abs(dist) / ((Math.abs(kmh) / 3.6) * DT)));
    const ds = dist / n;
    for (let i = 0; i < n; i++) {
      this.heading += (ds * Math.tan(steer)) / L;
      this.at = [this.at[0] + ds * Math.cos(this.heading), this.at[1] + ds * Math.sin(this.heading)];
      this.tick();
    }
  }

  /** Roll backwards in D (no reverse gear): what the rollback rule measures. */
  rollBack(dist: number, kmh = 2) {
    this.arc(-dist, -Math.abs(kmh), 0, 'D');
  }

  /** Slide to a pose in a straight line (not a real path: for setting up a test pose). */
  glide(to: Vec2, heading: number, kmh: number) {
    const from = [...this.at] as Vec2;
    const h0 = this.heading;
    const dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const n = Math.max(1, Math.ceil(Math.max(dist, 0.05) / ((Math.abs(kmh) / 3.6) * DT)));
    this.kmh = kmh;
    this.gear = kmh < 0 ? 'R' : 'D';
    this.handbrake = false;
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      this.at = [from[0] + u * (to[0] - from[0]), from[1] + u * (to[1] - from[1])];
      this.heading = h0 + u * wrapPi(heading - h0);
      this.tick();
    }
  }

  hitPole(index: number) {
    this.events.push({ type: 'obstacle-hit', kind: 'pole', index, t: this.t + DT, at: circuit.obstacles.poles[index].at });
  }

  stationState(id: StationId) {
    return this.last.stations.find((st) => st.id === id)!;
  }
}

export function assessment(): Driver {
  const d = new Driver(createSession(circuit, rules, swift, 'assessment' as Mode), { at: circuit.spawn.at, heading: rad(circuit.spawn.heading_deg) }, sNear(circuit.spawn.at, 0, 5));
  d.last = d.session.state();
  return d;
}

/** A practice drill of one station, the car at the station's start point. */
export function drill(id: StationId, mode: Mode = 'practice'): Driver {
  const g = station(id);
  const session = createSession(circuit, rules, swift, mode, id);
  const d = new Driver(session, { at: g.start.at, heading: rad(g.start.heading_deg) }, sNear(g.start.at, g.s_from - 12, g.s_from));
  d.last = session.state();
  return d;
}

// ---------------------------------------------------------------- positive drives, one per station
// Each starts wherever the last left the car on the route, and ends driving on past the station.

const bandMid = () => { const b = station('hill-start').stop_band!; return (b.s_from + b.s_to) / 2; };

export const HILL_STOP_S = () => bandMid() - L;   // rear axle here puts both front tyres mid-band

export function hillDrive(d: Driver) {
  d.follow(HILL_STOP_S(), 8);
  d.stop(2.5, true);
  d.follow(station('hill-start').gates.find((g) => g.id === 'crest')!.s! + 5, 8);
}

/** The route's break at a station's manoeuvre: the last sample before it and the first after it. */
function breakAt(id: StationId): { pre: number; post: number } {
  const m = circuit.route.manoeuvres.find((q) => q.station === id)!;
  const i = S.findIndex((q, k) => k + 1 < S.length && q[0] >= m.s_from - 0.5 && Math.hypot(S[k + 1][1] - q[1], S[k + 1][2] - q[2]) > 1);
  return { pre: S[i][0], post: S[i + 1][0] };
}

/** Side parking: past the bay along the band, one full-lock reverse arc, straight back, done. */
export const SIDE = { preJump: breakAt('side-parking').pre, inBay: breakAt('side-parking').post, straightBack: 3.36 };
export function sideReverseIn(d: Driver) {
  d.follow(SIDE.preJump, 8);
  d.stop(0.5);
  d.arc(-R_LOCK * (Math.PI / 2), -4, -LOCK);
  d.arc(-SIDE.straightBack, -4, 0);
}
export function sideDrive(d: Driver) {
  sideReverseIn(d);
  d.stop(1.5, true);
  d.rs = SIDE.inBay;
  d.follow(station('side-parking').s_to + 2, 8);
}

/** Parallel parking: an S of two full-lock reverse arcs from the lane into the painted box. */
export const PAR = (() => {
  const box = station('parallel-parking').bay!;
  const parked: Vec2 = [box.centre[0], 34.0];                 // rear axle, deep in the box
  const laneX = S.find((q) => q[5] === 'parallel-parking')![1];   // the lane past the recess (the start is across the spine road)
  const phi = Math.acos(1 - (laneX - parked[0]) / (2 * R_LOCK));
  const startY = parked[1] + 2 * R_LOCK * Math.sin(phi);
  return { parked, laneX, phi, startY };
})();
export function parallelReverseIn(d: Driver) {
  const g = station('parallel-parking');
  d.follow(sNear([PAR.laneX, PAR.startY], g.s_from, g.s_to), 8);
  d.stop(0.5);
  d.arc(-R_LOCK * PAR.phi, -4, LOCK);
  d.arc(-R_LOCK * PAR.phi, -4, -LOCK);
}
export function parallelDrive(d: Driver) {
  const g = station('parallel-parking');
  parallelReverseIn(d);
  d.stop(1.5, true);
  d.arc(R_LOCK * PAR.phi, 4, -LOCK);
  d.arc(R_LOCK * PAR.phi, 4, LOCK);
  d.rs = sNear(d.at, g.s_from, g.s_to);
  d.follow(g.s_to + 2, 8);
}

/** Three-point turn: forward right lock 70°, reverse left lock 70°, forward right lock to face back north. */
export function sDrive(d: Driver, kmh = 10) {
  d.follow(station('s-curve').s_to + 2, kmh);
}

export function zDrive(d: Driver, kmh = 8) {
  d.follow(station('z-curve').s_to + 2, kmh);
}

/** Ramp: right turn into the mouth, up to `gap` short of the pole, hold, reverse out and turn back into the lane. */
export function rampIn(d: Driver, gap = 0.6) {
  const g = station('ramp-test');
  const laneX = g.start.at[0];
  d.follow(sNear([laneX, g.axis!.start[1] - R_LOCK], g.s_from - 3, g.s_to), 6);
  d.arc(R_LOCK * (Math.PI / 2), 5, -LOCK);
  const pole = circuit.obstacles.poles.find((p) => p.station === 'ramp-test')!;
  const stopX = pole.at[0] - pole.radius - gap - (L + swift.front_overhang_m);
  d.arc(stopX - d.at[0], 5, 0);
}
export function rampOut(d: Driver) {
  const g = station('ramp-test');
  d.arc(-(d.at[0] - (g.gates.find((q) => q.id === 'mouth')!.a[0] - 1)), -4, 0);
  d.arc(-R_LOCK * (Math.PI / 2), -4, -LOCK);
  const q = routePose(sNear([g.start.at[0], d.at[1] + 2], g.s_from, g.s_to));
  d.glide(q.at, q.heading, 4);
  d.rs = sNear(q.at, g.s_from, g.s_to);
}
export function rampDrive(d: Driver) {
  rampIn(d);
  d.stop(2.5);
  rampOut(d);
  d.follow(station('ramp-test').s_to + 2, 8);
}

export function mergeDrive(d: Driver, kmh = 20) {
  d.follow(station('road-merging').s_to + 3, kmh);
}

export const POSITIVE: Record<StationId, (d: Driver) => void> = {
  'hill-start': hillDrive,
  'side-parking': sideDrive,
  'parallel-parking': parallelDrive,
  's-curve': (d) => sDrive(d),
  'z-curve': (d) => zDrive(d),
  'ramp-test': rampDrive,
  'road-merging': (d) => mergeDrive(d),
};
