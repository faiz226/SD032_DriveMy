// The scripted assessment: one learner's line through all seven stations, driven only through the controls a
// learner has (pedals, wheel, gear, handbrake). Each manoeuvre is a generator that yields the controls for the
// next physics step; whoever steps the car reports each step back through observe(). The headless test steps a
// Rapier world with it; the page's ?autopilot=1 drives the real car with it, for the performance run and the
// demo recording.
import type { StationId, Vec2, VehicleSample } from '../contracts';
import { circuit, swift } from '../data';
import { rad, toDeg, wrapPi } from '../geom';
import { SWIFT_DRIVE as P, lockAt } from './drive';
import type { Traffic } from '../traffic/model';
import type { Controls } from './vehicle';

type Piece = typeof circuit.route.samples;
export type Plan = Generator<Controls, void, void>;

const S = circuit.route.samples;
const DT = P.dt;
export const R_LOCK = P.wheelbase / Math.tan(P.lock);
const station = (id: StationId) => circuit.stations.find((g) => g.id === id)!;

/** The route's driven pieces: it breaks where the car reverses into the side bay and turns round. */
export const PIECES: Piece[] = (() => {
  const out: Piece[] = [];
  S.forEach((q, i) => {
    if (i === 0 || Math.hypot(q[1] - S[i - 1][1], q[2] - S[i - 1][2]) > 1) out.push([]);
    out[out.length - 1].push(q);
  });
  return out;
})();

export function sNear(at: Vec2, lo: number, hi: number) {
  let best = lo;
  let d = Infinity;
  for (const q of S) if (q[0] >= lo && q[0] <= hi) { const e = Math.hypot(q[1] - at[0], q[2] - at[1]); if (e < d) { d = e; best = q[0]; } }
  return best;
}

export class Pilot {
  last!: VehicleSample;
  odometer = 0;
  controls: Controls = { throttle: 0, brake: 1, handbrake: true, gear: 'D', wheel: 0 };
  marks: string[] = [];
  /** The other cars, when there are any: follow() keeps behind them, stops on red and gives way at the merge. */
  traffic: (() => Traffic | null) | null = null;

  /** The step that just happened. */
  observe(sample: VehicleSample, dt: number) {
    this.last = sample;
    this.odometer += (sample.speedKmh / 3.6) * dt;
  }

  /** Where the car is, for a failure report. */
  mark(label: string) {
    const l = this.last;
    this.marks.push(`${label} t${l.t.toFixed(1)} (${l.x.toFixed(2)},${l.y.toFixed(2)}) h${toDeg(l.heading).toFixed(1)} v${l.speedKmh.toFixed(1)}`);
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

  *stop(): Plan {
    for (let k = 0; k < 600 && (k < 10 || Math.abs(this.last.speedKmh) > 0.05); k++) {
      this.controls = { ...this.controls, throttle: 0, brake: 1 };
      yield this.controls;
    }
  }

  *hold(seconds: number, handbrake: boolean): Plan {
    this.controls = { ...this.controls, throttle: 0, brake: 1, handbrake };
    for (let k = 0; k < Math.round(seconds / DT); k++) yield this.controls;
  }

  /**
   * Follow a route piece with pure pursuit, from wherever the car is, to sTo; optionally stopping there.
   * `offset` moves the line sideways (metres, + = left of travel), where a manoeuvre wants another start.
   */
  *follow(piece: Piece, sTo: number, kmh: (s: number) => number, stopAtEnd: boolean, offset: (s: number) => number = () => 0): Plan {
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
      target = Math.min(target, this.traffic?.()?.learnerLimitKmh(s, this.last) ?? Infinity);
      this.controls = { ...this.controls, ...this.pedals(target), wheel: Math.max(-1, Math.min(1, delta / lockAt(P, this.last.speedKmh))) };
      yield this.controls;
    }
    if (stopAtEnd) yield* this.stop();
  }

  /** Wheel to its angle while stopped, in the gear for the direction (reverse when `back`). */
  private *ready(wheel: number, back: boolean): Plan {
    yield* this.stop();
    this.controls = { ...this.controls, wheel, gear: back ? 'R' : 'D', handbrake: false };
    for (let k = 0; k < 120 && Math.abs(this.last.steer - wheel * P.lock) > 0.005; k++) {
      this.controls = { ...this.controls, brake: 1 };
      yield this.controls;
    }
  }

  /** A straight move: dist metres (negative = in reverse) at a crawl. */
  *arc(dist: number, wheel: number, kmh = 3): Plan {
    yield* this.ready(wheel, dist < 0);
    const o0 = this.odometer;
    for (let k = 0; k < 60 * 120 && Math.abs(this.odometer - o0) < Math.abs(dist) - 0.03; k++) {
      this.controls = { ...this.controls, ...this.pedals(kmh) };
      yield this.controls;
    }
    yield* this.stop();
  }

  /** A manoeuvre's arc, ended by how far the car has turned (degrees), not by distance. */
  *turn(deg: number, wheel: number, back: boolean, kmh = 3): Plan {
    yield* this.ready(wheel, back);
    const h0 = this.last.heading;
    for (let k = 0; k < 60 * 120 && Math.abs(wrapPi(this.last.heading - h0)) < rad(deg) - 0.02; k++) {
      this.controls = { ...this.controls, ...this.pedals(kmh) };
      yield this.controls;
    }
    yield* this.stop();
  }

  /**
   * Every station, from the spawn to a stop past the finish. With `faults` (WP6), the same line commits one fault
   * of each kind on purpose: a rollback, not in the bay, a pole touch, the S's speed band, a kerb touch, a ramp
   * stop outside its window and a slow merge.
   */
  *assessment(faults = false): Plan {
    const [first, second] = PIECES;   // the route breaks once, where the car reverses into the 3-side bay
    const slow = () => 8;
    // 1. hill start: front tyres on the yellow band, handbrake 2.5 s, then away over the crest
    yield* this.hold(0.5, true);
    const band = station('hill-start').stop_band!;
    yield* this.follow(first, (band.s_from + band.s_to) / 2 - P.wheelbase, slow, true);
    yield* this.hold(2.5, true);
    if (faults) {   // let go of everything: creep cannot hold the car on the hill, so it rolls back
      this.controls = { ...this.controls, throttle: 0, brake: 0, handbrake: false };
      for (let k = 0; k < Math.round(1.6 / DT); k++) yield this.controls;
      this.mark('rolled back');
    }
    // 2. side parking: along the band's far half (0.36 m off the line keeps the swinging nose clear of the
    //    mouth pole), reverse in at full right lock, straight back, done
    yield* this.follow(first, first[first.length - 1][0], slow, true, (s) => (s > station('side-parking').s_from + 3 ? 0.36 : 0));
    this.mark('side start');
    yield* this.turn(90, -1, true);
    this.mark('side turned');
    // faults: 1.6 m short, so the front stays out of the box when the handbrake says done
    yield* this.arc(-(station('side-parking').bay!.centre[1] + 1.703 - this.last.y) + (faults ? 1.6 : 0), 0);
    this.mark('side parked');
    yield* this.hold(1.5, true);
    //    out the way a learner does: straight until the rear axle is 1.05 m short of the mouth poles' line,
    //    then full left lock; the inner side clears the east pole by ~0.3 m, the outer front tyre the far kerb by ~0.4 m
    //    (faults: turning 0.8 m earlier sweeps the inner side through the east pole)
    yield* this.arc(this.last.y - (faults ? 13.2 : 12.4), 0);
    yield* this.turn(90, 1, false);
    this.mark('side out');
    // 3. parallel parking: an S of two full-lock reverse arcs into the box, done, and out the same way
    const box = station('parallel-parking').bay!;
    const laneX = S.find((q) => q[5] === 'parallel-parking')![1];   // the lane past the recess (the start is across the spine road)
    const phi = Math.acos(1 - (laneX - box.centre[0]) / (2 * R_LOCK));
    const startY = 34.0 + 2 * R_LOCK * Math.sin(phi);
    yield* this.follow(second, sNear([laneX, startY], station('parallel-parking').s_from, station('parallel-parking').s_to), slow, true);
    const phiDeg = toDeg(phi);
    this.mark('parallel start');
    yield* this.turn(phiDeg, 1, true);
    yield* this.turn(phiDeg, -1, true);
    this.mark('parallel parked');
    yield* this.hold(1.5, true);
    yield* this.turn(phiDeg, -1, false);
    yield* this.turn(phiDeg, 1, false);
    this.mark('parallel out');
    // 4-5. the S and the Z at 8 km/h; then to the ramp's turning point
    const ramp = station('ramp-test');
    const turnIn = sNear([ramp.start.at[0], ramp.axis!.start[1] - R_LOCK], ramp.s_from - 3, ramp.s_to);
    if (faults) {   // a stop in the middle of the S, longer than its grace; then the left tyres over a Z kerb
      const s = station('s-curve');
      yield* this.follow(second, (s.s_from + s.s_to) / 2, slow, true);
      yield* this.hold(2.5, false);
      const z = station('z-curve');   // the left tyres over the Z's first leg's kerb
      yield* this.follow(second, turnIn, slow, true, (q) => (q > z.s_from + 2.9 && q < z.s_from + 6.9 ? 1.3 : 0));
    } else {
      yield* this.follow(second, turnIn, slow, true);
    }
    this.mark('ramp turn-in');
    // 6. ramp: turn in, climb to 0.6 m short of the pole, hold, reverse out and turn back into the lane
    const pole = circuit.obstacles.poles.find((p) => p.station === 'ramp-test')!;
    yield* this.turn(90, -1, false);
    const gap = faults ? 1.6 : 0.6;   // the window is 0.2-1.0 m
    yield* this.arc(pole.at[0] - pole.radius - gap - (P.wheelbase + swift.front_overhang_m) - this.last.x, 0, 4);
    this.mark('ramp top');
    yield* this.hold(2.5, false);
    yield* this.arc(-(this.last.x - (ramp.gates.find((g) => g.id === 'mouth')!.a[0] - 1)), 0);
    yield* this.turn(90, -1, true);
    this.mark('ramp out');
    // 7. road merging, at the roundabout: give way at its entry (follow() waits for a gap in the traffic), go round,
    //    leave by the north arm and build speed through the finish; the rule wants 15 km/h or more there
    const merge = station('road-merging');
    const finish = merge.gates.find((g) => g.id === 'finish')!.s!;
    const joinKmh = faults ? 10 : 18;
    yield* this.follow(second, Math.min(merge.s_to + 5, second[second.length - 1][0] - 1), (s) => (s > finish - 9 ? joinKmh : 12), false);
    yield* this.stop();
  }
}

// Rules and the scripted line hold state for the whole run: in development, an edit reloads the page.
import.meta.hot?.accept(() => location.reload());
