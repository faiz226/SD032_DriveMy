// @vitest-environment node
// One continuous assessment, driven only through the controls a learner has (pedals, wheel, gear,
// handbrake), on the real yard's colliders, judged by the rules engine. No teleports.
import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, describe, expect, it } from 'vitest';
import type { SessionState, StationId, Vec2, VehicleSample } from '../contracts';
import { createSession } from '../core/session';
import { circuit, rules, swift } from '../data';
import { rad, wrapPi } from '../geom';
import { getWorld } from '../world/build';
import { addWorldColliders } from '../world/colliders';
import { G, SWIFT_DRIVE as P, lockAt } from './drive';
import { type Controls, Vehicle } from './vehicle';

const DT = P.dt;
const S = circuit.route.samples;
const R_LOCK = P.wheelbase / Math.tan(P.lock);
const station = (id: StationId) => circuit.stations.find((g) => g.id === id)!;

/** The route's driven pieces: it breaks where the car reverses into the side bay and turns round. */
const pieces: (typeof S)[] = [];
S.forEach((q, i) => {
  if (i === 0 || Math.hypot(q[1] - S[i - 1][1], q[2] - S[i - 1][2]) > 1) pieces.push([]);
  pieces[pieces.length - 1].push(q);
});

function sNear(at: Vec2, lo: number, hi: number) {
  let best = lo;
  let d = Infinity;
  for (const q of S) if (q[0] >= lo && q[0] <= hi) { const e = Math.hypot(q[1] - at[0], q[2] - at[1]); if (e < d) { d = e; best = q[0]; } }
  return best;
}

class Drive {
  world: RAPIER.World;
  car: Vehicle;
  session = createSession(circuit, rules, swift, 'assessment');
  state!: SessionState;
  last!: VehicleSample;
  t = 0;
  odometer = 0;
  kerb: { t: number; at: Vec2; ring: number }[] = [];
  maxKmh: Record<string, number> = {};
  controls: Controls = { throttle: 0, brake: 1, handbrake: true, gear: 'D', wheel: 0 };
  poles: Map<number, number>;
  marks: string[] = [];

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -G, z: 0 });
    this.world.timestep = DT;
    this.poles = addWorldColliders(RAPIER, this.world, getWorld(circuit)).poles;
    const [x, y] = circuit.spawn.at;
    this.car = new Vehicle(RAPIER, this.world, { x, y: P.radius + 0.02, z: -y, yaw: rad(circuit.spawn.heading_deg) });
    this.tick();
  }

  tick() {
    this.car.beforeStep(this.controls);
    this.world.step();
    const pre = this.car.sample(this.t, circuit, swift.tyre_width_m);
    this.car.afterStep(pre.slope !== null);
    this.t += DT;
    const s = this.car.sample(this.t, circuit, swift.tyre_width_m);
    const hits = this.car.poleHits(this.poles, this.t);
    this.state = this.session.step(s, hits, DT, false);
    this.last = s;
    if (hits.length) this.mark('pole hit');
    this.odometer += (s.speedKmh / 3.6) * DT;
    s.wheels.forEach((w) => { if (w.onKerb !== null) this.kerb.push({ t: this.t, at: [w.x, w.y], ring: w.onKerb }); });
    const where = this.state.current ?? 'end';
    this.maxKmh[where] = Math.max(this.maxKmh[where] ?? 0, Math.abs(s.speedKmh));
  }

  /** Where the car is, for the failure report. */
  mark(label: string) {
    const l = this.last;
    this.marks.push(`${label} t${this.t.toFixed(1)} (${l.x.toFixed(2)},${l.y.toFixed(2)}) h${((l.heading * 180) / Math.PI).toFixed(1)} v${l.speedKmh.toFixed(1)}`);
  }

  /** Pedals for a target speed (km/h, in the selected gear's direction): throttle above creep, brake below it. */
  pedals(target: number) {
    const v = (this.controls.gear === 'R' ? -1 : 1) * this.last.speedKmh;
    if (target <= 0) return { throttle: 0, brake: 1 };
    const err = target - v;
    if (err > 0.4) return { throttle: Math.min(1, 0.2 + 0.08 * err), brake: 0 };
    if (err < -0.4) return { throttle: 0, brake: Math.min(1, 0.1 * -err) };
    return { throttle: 0, brake: 0 };
  }

  stop() {
    for (let k = 0; k < 600 && (k < 10 || Math.abs(this.last.speedKmh) > 0.05); k++) { this.controls = { ...this.controls, throttle: 0, brake: 1 }; this.tick(); }
  }

  hold(seconds: number, handbrake: boolean) {
    this.controls = { ...this.controls, throttle: 0, brake: 1, handbrake };
    for (let k = 0; k < Math.round(seconds / DT); k++) this.tick();
  }

  /**
   * Follow a route piece with pure pursuit, from wherever the car is, to sTo; optionally stopping there.
   * `offset` moves the line sideways (metres, + = left of travel), where a manoeuvre wants another start.
   */
  follow(piece: typeof S, sTo: number, kmh: (s: number) => number, stopAtEnd: boolean, offset: (s: number) => number = () => 0) {
    this.controls = { ...this.controls, gear: 'D', handbrake: false };
    let i = 0;
    let best = Infinity;
    piece.forEach((q, k) => { const d = Math.hypot(q[1] - this.last.x, q[2] - this.last.y); if (d < best) { best = d; i = k; } });
    for (let n = 0; n < 60 * 600; n++) {
      for (let k = i; k < Math.min(piece.length, i + 40); k++) {
        if (Math.hypot(piece[k][1] - this.last.x, piece[k][2] - this.last.y) <= Math.hypot(piece[i][1] - this.last.x, piece[i][2] - this.last.y)) i = k;
      }
      const s = piece[i][0];
      const left = sTo - s;
      if (left <= 0.02 || (stopAtEnd && left < 0.06)) break;
      const look = Math.max(2.6, Math.abs(this.last.speedKmh) / 3.6 * 0.9);
      let j = i;
      while (j < piece.length - 1 && piece[j][0] < s + look) j++;
      const off = offset(piece[j][0]);
      const nh = rad(piece[j][3]);
      const tx = piece[j][1] - Math.sin(nh) * off - this.last.x;
      const ty = piece[j][2] + Math.cos(nh) * off - this.last.y;
      const alpha = wrapPi(Math.atan2(ty, tx) - this.last.heading);
      const delta = Math.atan2(2 * P.wheelbase * Math.sin(alpha), Math.max(0.5, Math.hypot(tx, ty)));
      // slow for the bend ahead (lateral acceleration 1.6 m/s^2), and for the stop
      let turn = 0;
      for (let k = i; k < Math.min(piece.length - 1, i + 20); k++) turn = Math.max(turn, Math.abs(wrapPi(rad(piece[k + 1][3] - piece[k][3]))) / Math.max(0.01, piece[k + 1][0] - piece[k][0]));
      let target = Math.min(kmh(s), Math.sqrt(1.6 / Math.max(turn, 1e-3)) * 3.6);
      if (stopAtEnd) target = Math.min(target, Math.max(1.5, Math.sqrt(2 * 0.8 * left) * 3.6));
      this.controls = { ...this.controls, ...this.pedals(target), wheel: Math.max(-1, Math.min(1, delta / lockAt(P, this.last.speedKmh))) };
      this.tick();
    }
    if (stopAtEnd) this.stop();
  }

  /** Wheel to its angle while stopped, in the gear for the direction (reverse when `back`). */
  private ready(wheel: number, back: boolean) {
    this.stop();
    this.controls = { ...this.controls, wheel, gear: back ? 'R' : 'D', handbrake: false };
    for (let k = 0; k < 120 && Math.abs(this.car.steer - wheel * P.lock) > 0.005; k++) { this.controls.brake = 1; this.tick(); }
  }

  /** A straight move: dist metres (negative = in reverse) at a crawl. */
  arc(dist: number, wheel: number, kmh = 3) {
    this.ready(wheel, dist < 0);
    const o0 = this.odometer;
    for (let k = 0; k < 60 * 120 && Math.abs(this.odometer - o0) < Math.abs(dist) - 0.03; k++) {
      this.controls = { ...this.controls, ...this.pedals(kmh) };
      this.tick();
    }
    this.stop();
  }

  /** A manoeuvre's arc, ended by how far the car has turned (degrees), not by distance. */
  turn(deg: number, wheel: number, back: boolean, kmh = 3) {
    this.ready(wheel, back);
    const h0 = this.last.heading;
    for (let k = 0; k < 60 * 120 && Math.abs(wrapPi(this.last.heading - h0)) < rad(deg) - 0.02; k++) {
      this.controls = { ...this.controls, ...this.pedals(kmh) };
      this.tick();
    }
    this.stop();
  }
}

beforeAll(async () => {
  await RAPIER.init();
});

describe('a scripted assessment through the real controls', () => {
  it('drives from the spawn to the exit with no tyre on a kerb, and the verdict passes', () => {
    const d = new Drive();
    const [first, second, third] = pieces;
    const slow = () => 8;
    // 1. hill start: front tyres on the yellow band, handbrake 2.5 s, then away over the crest
    d.hold(0.5, true);
    const band = station('hill-start').stop_band!;
    d.follow(first, (band.s_from + band.s_to) / 2 - P.wheelbase, slow, true);
    d.hold(2.5, true);
    // 2. side parking: along the band's far half (0.36 m off the line keeps the swinging nose clear of the
    //    mouth pole), reverse in at full right lock, straight back, done
    d.follow(first, first[first.length - 1][0], slow, true, (s) => (s > station('side-parking').s_from + 3 ? 0.36 : 0));
    d.mark('side start');
    d.turn(90, -1, true);
    d.mark('side turned');
    d.arc(-(station('side-parking').bay!.centre[1] + 1.703 - d.last.y), 0);
    d.mark('side parked');
    d.hold(1.5, true);
    //    out the way a learner does: straight until the rear axle is 1.05 m short of the mouth poles' line,
    //    then full left lock; the inner side clears the east pole by ~0.3 m, the outer front tyre the far kerb by ~0.4 m
    d.arc(d.last.y - 12.4, 0);
    d.turn(90, 1, false);
    d.mark('side out');
    // 3. parallel parking: an S of two full-lock reverse arcs into the box, done, and out the same way
    const box = station('parallel-parking').bay!;
    const laneX = station('parallel-parking').start.at[0];
    const phi = Math.acos(1 - (laneX - box.centre[0]) / (2 * R_LOCK));
    const startY = 34.0 + 2 * R_LOCK * Math.sin(phi);
    d.follow(second, sNear([laneX, startY], station('parallel-parking').s_from, station('parallel-parking').s_to), slow, true);
    const phiDeg = (phi * 180) / Math.PI;
    d.mark('parallel start');
    d.turn(phiDeg, 1, true);
    d.turn(phiDeg, -1, true);
    d.mark('parallel parked');
    d.hold(1.5, true);
    d.turn(phiDeg, -1, false);
    d.turn(phiDeg, 1, false);
    d.mark('parallel out');
    // 4. three-point turn: forward right lock, reverse left lock, forward right lock
    d.follow(second, second[second.length - 1][0], () => 6, true);
    d.mark('3pt start');
    d.turn(70, -1, false);
    d.turn(70, 1, true);
    d.turn(40, -1, false);
    d.mark('3pt done');
    // 5-6. the S and the Z at 8 km/h; then to the ramp's turning point
    const ramp = station('ramp-test');
    const turnIn = sNear([ramp.start.at[0], ramp.axis!.start[1] - R_LOCK], ramp.s_from - 3, ramp.s_to);
    d.follow(third, turnIn, slow, true);
    d.mark('ramp turn-in');
    // 7. ramp: turn in, climb to 0.6 m short of the pole, hold, reverse out and turn back into the lane
    const pole = circuit.obstacles.poles.find((p) => p.station === 'ramp-test')!;
    d.turn(90, -1, false);
    d.arc(pole.at[0] - pole.radius - 0.6 - (P.wheelbase + swift.front_overhang_m) - d.last.x, 0, 4);
    d.mark('ramp top');
    d.hold(2.5, false);
    d.arc(-(d.last.x - (ramp.gates.find((g) => g.id === 'mouth')!.a[0] - 1)), 0);
    d.turn(90, -1, true);
    d.mark('ramp out');
    // 8. road merging: build speed down the east road through the finish; the rule wants 15 km/h or more there
    const merge = station('road-merging');
    d.follow(third, Math.min(merge.s_to + 6, third[third.length - 1][0] - 1), (s) => (s > merge.s_from ? 16 : 8), false);

    const report = { marks: d.marks, kerb: d.kerb.slice(0, 5), faults: d.state.faults, statuses: d.state.stations.map((st) => `${st.id}:${st.status}`), maxKmh: d.maxKmh, seconds: Math.round(d.t) };
    expect(d.kerb, JSON.stringify(report)).toEqual([]);
    expect(d.state.verdict, JSON.stringify(report)).toMatchObject({ pass: true, demerits: 0 });
    // 15 km/h or less everywhere but the merge leg, and 10 or less (with the cruise band's 0.5) in the S and Z
    for (const [where, v] of Object.entries(d.maxKmh)) if (where !== 'road-merging' && where !== 'end') expect(v, where).toBeLessThanOrEqual(15);
    for (const id of ['s-curve', 'z-curve'] as const) expect(d.maxKmh[id], id).toBeLessThanOrEqual(10.5);
  }, 600_000);
});
