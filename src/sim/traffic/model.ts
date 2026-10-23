// The other cars in the yard (the owner, 20 Oct): cars on keep-left loops at a yard's pace, each following the car
// ahead (the intelligent driver model), slowing for bends, stopping for red lights, taking a junction one car at a
// time and giving way there to the learner, except at the merge, where the main road has priority. Pure TypeScript,
// stepped with the physics: the page draws it (TrafficView.tsx), the rules read its events, the headless test and
// the autopilot drive among it.
import type { CarConfig, CircuitData, SignalGroup, SimEvent, TrafficData, Vec2, VehicleSample } from '../contracts';
import { dir, rad, segmentsCross, wrapPi } from '../geom';
import { Path } from './path';
import { type Light, lightsAt } from './signals';

// The intelligent driver model: comfortable acceleration and braking, the gap kept when stopped, the time headway.
const IDM = { accel: 1.4, brake: 2.5, gap: 2.0, headway: 1.2, maxBrake: 8 };
const LOOK_M = 32;            // how far ahead a car looks for what it must stop for
const LANE_HALF = 1.15;       // a car is in my way if its body comes this close to my line: half my width and a margin
const YIELD_S = 3.0;          // a car gives way to the learner who would reach a junction within this
const AMBER_STOP = 3.0;       // m/s^2: on amber a car stops if it can at this braking, else goes on
const STOP_SHORT = 0.4;       // metres short of a stop line, give-way line or junction a car stops
const REHIT_S = 1.0;          // a contact with the same car counts again only after this long apart
const ROOM_M = 1.0;           // junctions closer than a car's length plus this are taken together, as one
const CLEAR_M = 1.0;          // the learner waits this much further short of a junction another car is crossing
const SIGNAL_M = 30;          // a car turning at a junction indicates from this far before it until it is through
const SIGNAL_TURN = 0.5;      // radians: a junction crossed with less heading change than this is straight on
const HONK = { m: 18, cos: 0.3, s: 2.4 };   // free drive: cars this close ahead of the horn flash their hazards this long

/**
 * Junctions a path meets one after another, closer than a car: a car taking the first must take them all, or it
 * would wait in one for the next while another car waits in that one for it. `held` are the ones without signals
 * (the lights share out the others).
 */
interface Chain { ids: string[]; held: string[]; sIn: number; sOut: number; parts: { id: string; sIn: number; sOut: number }[] }

/** steer: the front wheels' angle, + left; indicator: 1 left, -1 right (as the steering wheel's sign). */
export interface TrafficCar { id: string; kind: 'loop'; loop: string; x: number; y: number; heading: number; kmh: number; braking: boolean; steer: number; indicator: -1 | 0 | 1; hazard: boolean }

interface Car {
  id: string;
  loop: string;
  path: Path;
  kmh: number;
  s: number;            // rear axle, along the path
  v: number;            // m/s
  a: number;
  stops: { s: number; signal: string; group: SignalGroup }[];         // where the path crosses a stop line (front bumper)
  chains: Chain[];
  hazardUntil: number;  // the run's clock until which its hazard lamps flash (free drive's horn)
}

interface Body { id: string; x: number; y: number; heading: number; v: number; learner: boolean }

export class Traffic {
  t = 0;
  readonly cars: Car[] = [];
  private readonly data: TrafficData;
  private readonly back: number;
  private readonly nose: number;
  private readonly half: number;
  private readonly wheelbase: number;
  private readonly holders = new Map<string, string>();       // junction -> the car taking it
  private readonly touching = new Map<string, number>();      // car -> last time it touched the learner
  private prevFront: Vec2 | null = null;
  private readonly route: { path: Path; s0: number }[] = [];  // the learner's route, in pieces between manoeuvres
  private readonly routeStops: { s: number; signal: string; group: SignalGroup }[] = [];
  private readonly routeChains: Chain[] = [];                 // the junctions on the route, in route distance
  /** What set the learner's last limit, for the HUD and for tests. */
  limitWhy = '';
  private readonly routeGiveWay: number | null = null;

  constructor(circuit: CircuitData, car: CarConfig, opts: { loops?: boolean } = {}) {
    const data = circuit.traffic;
    if (!data) throw new Error('circuit.json has no traffic');
    this.data = data;
    this.back = car.length_m - car.wheelbase_m - car.front_overhang_m;
    this.nose = car.wheelbase_m + car.front_overhang_m;
    this.half = car.width_body_m / 2;
    this.wheelbase = car.wheelbase_m;
    const paths = new Map(data.loops.map((lp) => [lp.id, new Path(lp.points, true)]));
    if (opts.loops !== false) {
      data.loops.forEach((lp, li) => {
        const path = paths.get(lp.id)!;
        for (let k = 0; k < lp.cars; k++) {
          const s = path.wrap(path.length * (k / lp.cars + 0.21 * li));
          this.cars.push({ id: `${lp.id}:${k}`, loop: lp.id, path, kmh: lp.kmh, s, v: lp.kmh / 3.6 / 2, a: 0,
            stops: this.stopsOn(path), chains: this.chainsOn(path), hazardUntil: -1 });
        }
      });
    }
    // the learner's route, for the autopilot's limits: pieces between the manoeuvres' breaks
    const S = circuit.route.samples;
    let start = 0;
    for (let i = 1; i <= S.length; i++) {
      if (i === S.length || Math.hypot(S[i][1] - S[i - 1][1], S[i][2] - S[i - 1][2]) > 1) {
        if (i - start > 2) this.route.push({ path: new Path(S.slice(start, i).map((q) => [q[1], q[2]] as Vec2), false), s0: S[start][0] });
        start = i;
      }
    }
    for (const piece of this.route) {
      for (const st of this.stopsOn(piece.path)) this.routeStops.push({ ...st, s: st.s + piece.s0 });
      for (const ch of this.chainsOn(piece.path)) {
        for (const sub of this.stretches(ch)) {
          this.routeChains.push({ ...sub, sIn: sub.sIn + piece.s0, sOut: sub.sOut + piece.s0, parts: sub.parts.map((q) => ({ ...q, sIn: q.sIn + piece.s0, sOut: q.sOut + piece.s0 })) });
        }
      }
      const gw = this.crossing(piece.path, data.merge.give_way as [Vec2, Vec2], rad(data.merge.heading_deg));
      if (gw !== null) this.routeGiveWay = gw + piece.s0;
    }
  }

  // ---------------------------------------------------------------- set-up: what each path meets

  /** Where a path crosses the segment a-b heading within 60 degrees of `heading`, as distance along it. */
  private crossing(path: Path, line: [Vec2, Vec2], heading: number): number | null {
    return this.crossings(path, line, heading)[0] ?? null;
  }

  /** Every place a path crosses the segment a-b heading within 60 degrees of `heading` (a route may pass a stop line twice). */
  private crossings(path: Path, [a, b]: [Vec2, Vec2], heading: number): number[] {
    const out: number[] = [];
    const n = path.pts.length;
    for (let i = 0; i < (path.closed ? n : n - 1); i++) {
      const p = path.pts[i];
      const q = path.pts[(i + 1) % n];
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 1) continue;
      if (Math.abs(wrapPi(path.heading[i] - heading)) > Math.PI / 3) continue;
      if (segmentsCross(p, q, a, b)) out.push(path.cum[i]);
    }
    return out;
  }

  private stopsOn(path: Path) {
    const out: Car['stops'] = [];
    for (const sg of this.data.signals) {
      for (const ap of sg.approaches) {
        for (const s of this.crossings(path, ap.stop as [Vec2, Vec2], rad(ap.heading_deg))) out.push({ s, signal: sg.id, group: ap.group });
      }
    }
    return out.sort((p, q) => p.s - q.s);
  }

  private chainsOn(path: Path): Chain[] {
    const boxes: { id: string; sIn: number; sOut: number }[] = [];
    const n = path.pts.length;
    for (const j of this.data.junctions) {
      const inside = path.pts.map((p) => inPoly(p, j.polygon));
      for (let i = 0; i < n; i++) {
        if (!inside[i] || inside[(i - 1 + n) % n]) continue;
        if (!path.closed && i === 0) continue;
        let k = i;
        while (inside[(k + 1) % n] && k - i < n && (path.closed || k + 1 < n)) k++;
        boxes.push({ id: j.id, sIn: path.cum[i], sOut: path.cum[k % n] });
      }
    }
    boxes.sort((p, q) => p.sIn - q.sIn);
    const signal = (id: string) => !!this.data.junctions.find((j) => j.id === id)!.signal;
    // from a to b along the path, negative where b comes first: boxes that overlap are one chain, never two (two
    // cars would each take one and wait in it for the other)
    const gap = (a: number, b: number) => {
      const d = path.dist(a, b);
      return path.closed && d > path.length / 2 ? d - path.length : d;
    };
    const chains: Chain[] = [];
    for (const b of boxes) {
      const last = chains[chains.length - 1];
      if (last && gap(last.sOut, b.sIn) < this.back + this.nose + ROOM_M) {
        last.ids.push(b.id);
        last.parts.push(b);
        if (!signal(b.id)) last.held.push(b.id);
        if (gap(last.sOut, b.sOut) > 0) last.sOut = b.sOut;
      } else chains.push({ ids: [b.id], held: signal(b.id) ? [] : [b.id], sIn: b.sIn, sOut: b.sOut, parts: [b] });
    }
    // round a loop, the last chain may run on into the first
    if (path.closed && chains.length > 1 && gap(chains[chains.length - 1].sOut, chains[0].sIn) < this.back + this.nose + ROOM_M) {
      const last = chains.pop()!;
      chains[0] = { ids: [...last.ids, ...chains[0].ids], held: [...last.held, ...chains[0].held], sIn: last.sIn, sOut: chains[0].sOut, parts: [...last.parts, ...chains[0].parts] };
    }
    return chains;
  }

  /**
   * The learner's view of a chain on its route (an open path): split where the gap between two junctions holds the
   * whole car stopped short of the next. The learner, who never holds a junction, waits only for the stretch it
   * cannot stop inside; on the spine road that is not the whole road.
   */
  private stretches(ch: Chain): Chain[] {
    const fit = this.back + this.nose + STOP_SHORT;
    const out: Chain[] = [];
    for (const q of ch.parts) {
      const last = out[out.length - 1];
      const held = ch.held.includes(q.id);
      if (last && q.sIn - last.sOut < fit) {
        last.ids.push(q.id);
        last.parts.push(q);
        if (held) last.held.push(q.id);
        last.sOut = Math.max(last.sOut, q.sOut);
      } else out.push({ ids: [q.id], held: held ? [q.id] : [], sIn: q.sIn, sOut: q.sOut, parts: [q] });
    }
    return out;
  }

  // ---------------------------------------------------------------- the step

  /** Lights at one signal now. */
  lights(signal: string): Record<SignalGroup, Light> {
    const sg = this.data.signals.find((q) => q.id === signal);
    return sg ? lightsAt(sg, this.t) : { ew: 'green', ns: 'green' };
  }

  /**
   * Every car's pose, for drawing it and for its collider. Its front wheels point along its line: following a path
   * at the rear axle, the angle's tangent is the heading change over one wheelbase. Its brake lamps burn while it
   * slows or stands.
   */
  poses(): TrafficCar[] {
    return this.cars.map((c) => {
      const p = c.path.pose(c.s);
      const steer = Math.atan(wrapPi(c.path.pose(c.s + this.wheelbase).heading - p.heading));
      return { id: c.id, kind: 'loop' as const, loop: c.loop, x: p.x, y: p.y, heading: p.heading, kmh: c.v * 3.6,
        braking: c.a < -0.5 || c.v < 0.3, steer, indicator: this.indicatorOf(c), hazard: this.t < c.hazardUntil };
    });
  }

  /** Free drive's horn, from the learner's car: the cars close ahead flash their hazard lamps back. How many did. */
  honk(learner: VehicleSample): number {
    let n = 0;
    for (const c of this.cars) {
      const p = c.path.pose(c.s);
      const dx = p.x - learner.x;
      const dy = p.y - learner.y;
      const d = Math.hypot(dx, dy);
      if (d > HONK.m || (dx * Math.cos(learner.heading) + dy * Math.sin(learner.heading)) / (d || 1) < HONK.cos) continue;
      c.hazardUntil = this.t + HONK.s;
      n++;
    }
    return n;
  }

  /** The side a car indicates: toward its turn at the junction ahead, from SIGNAL_M before it until it is through. */
  private indicatorOf(c: Car): -1 | 0 | 1 {
    if (c.loop === this.data.merge.loop) return 0;   // round the roundabout and never leaving it: nothing to signal
    const front = c.s + this.nose;
    for (const ch of c.chains) {
      const into = c.path.dist(ch.sIn - SIGNAL_M, front);   // since the stretch where it signals began
      if (into < 0 || into > SIGNAL_M + c.path.dist(ch.sIn, ch.sOut) + this.nose + this.back) continue;
      const turn = wrapPi(c.path.pose(ch.sOut + 2).heading - c.path.pose(ch.sIn - 2).heading);
      if (Math.abs(turn) > SIGNAL_TURN) return turn > 0 ? 1 : -1;
    }
    return 0;
  }

  /**
   * Advance the cars by dt on the run's clock, with the learner where the sample says (null: no learner on the
   * yard yet). Returns what the learner did that the rules mark: hitting a car, a red light, cutting in at the merge.
   */
  step(dt: number, learner: VehicleSample | null): SimEvent[] {
    this.t += dt;
    const bodies: Body[] = this.cars.map((c) => {
      const p = c.path.pose(c.s);
      return { id: c.id, x: p.x, y: p.y, heading: p.heading, v: c.v, learner: false };
    });
    const me: Body | null = learner && { id: 'learner', x: learner.x, y: learner.y, heading: learner.heading, v: learner.speedKmh / 3.6, learner: true };
    if (me) bodies.push(me);
    for (const car of this.cars) this.drive(car, dt, bodies, me);
    return me && learner ? this.judge(learner, me) : [];
  }

  private drive(car: Car, dt: number, bodies: Body[], me: Body | null) {
    const v0 = Math.min(car.kmh, car.path.curveLimitKmh(car.s + this.nose * 0.5, Math.max(6, (car.v * car.v) / (2 * IDM.accel) + 4))) / 3.6;
    let gap = Infinity;
    let lead = 0;
    // the nearest body in my way
    for (const b of bodies) {
      if (b.id === car.id) continue;
      const hit = this.ahead(car.path, car.s, b);
      if (hit && hit.gap < gap) { gap = hit.gap; lead = hit.v; }
    }
    // red lights, and amber where there is room to stop
    for (const st of car.stops) {
      const d = car.path.dist(car.s + this.nose, st.s);
      if (d > LOOK_M || d < -0.5) continue;
      const light = this.lights(st.signal)[st.group];
      if (light === 'red' || (light === 'amber' && d > (car.v * car.v) / (2 * AMBER_STOP))) {
        const g = d - STOP_SHORT + IDM.gap;   // the model keeps IDM.gap to what it stops for: stop STOP_SHORT short instead
        if (g < gap) { gap = g; lead = 0; }
      }
      break;
    }
    // junctions: let go of each one as the car's tail leaves it (a chain is taken whole, so no car waits in one for
    // another; let go of piece by piece, the junctions behind open sooner), then take the next chain if it is free,
    // else stop before it
    const front = car.s + this.nose;
    for (const ch of car.chains) {
      ch.parts.forEach((part, k) => {
        if (this.holders.get(part.id) !== car.id || ch.parts.slice(k + 1).some((q) => q.id === part.id)) return;
        const span = car.path.dist(part.sIn, part.sOut);
        const rearIn = car.path.dist(part.sIn, car.s - this.back);
        if (rearIn > span && rearIn < span + LOOK_M) this.holders.delete(part.id);
      });
    }
    let next: Chain | null = null;
    let dNext = Infinity;
    for (const ch of car.chains) {
      const d = car.path.dist(front, ch.sIn);
      if (d < dNext && d <= LOOK_M) { next = ch; dNext = d; }
    }
    const taken = next !== null && next.held.length > 0 && next.held.every((id) => this.holders.get(id) === car.id);
    if (next && !taken && dNext <= Math.max(4, (car.v * car.v) / (2 * IDM.brake) + 3)) {
      if (this.free(car, next, me, bodies)) {
        for (const id of next.held) this.holders.set(id, car.id);
      } else {
        const g = dNext - STOP_SHORT + IDM.gap;
        if (g < gap) { gap = g; lead = 0; }
      }
    }
    // the intelligent driver model, and never into the car ahead
    const v = car.v;
    const sStar = IDM.gap + Math.max(0, v * IDM.headway + (v * (v - lead)) / (2 * Math.sqrt(IDM.accel * IDM.brake)));
    let a = IDM.accel * (1 - (v / Math.max(0.1, v0)) ** 4 - (gap === Infinity ? 0 : (sStar / Math.max(0.05, gap)) ** 2));
    a = Math.max(-IDM.maxBrake, Math.min(IDM.accel, a));
    car.v = Math.max(0, v + a * dt);
    if (gap !== Infinity && gap - IDM.gap < 0.2) car.v = Math.min(car.v, Math.max(0, lead));
    car.a = a;
    car.s = car.path.wrap(car.s + car.v * dt);
  }

  /** A body in my way ahead on my path: its nearest point's gap from my front bumper, and its speed along my path. */
  private ahead(path: Path, s: number, b: Body): { gap: number; v: number } | null {
    // along the path is never shorter than straight across: a body further than the window can't be in it
    const me = path.pose(s);
    if (Math.hypot(b.x - me.x, b.y - me.y) > LOOK_M + 2 * (this.nose + this.back)) return null;
    const [hx, hy] = dir(b.heading);
    let best: { gap: number; v: number } | null = null;
    for (const along of [-this.back, (this.nose - this.back) / 2, this.nose]) {
      const p: Vec2 = [b.x + hx * along, b.y + hy * along];
      const q = path.project(p, s, LOOK_M + this.nose);
      if (!q || Math.abs(q.offset) > LANE_HALF + this.half) continue;
      const gap = path.dist(s, q.s) - this.nose;
      if (gap < -this.nose) continue;
      const h = path.pose(q.s).heading;
      if (!best || gap < best.gap) best = { gap, v: b.v * Math.cos(b.heading - h) };
    }
    return best;
  }

  /** May this car go into this chain of junctions now? */
  private free(car: Car, ch: Chain, me: Body | null, bodies: Body[]): boolean {
    if (ch.held.some((id) => { const h = this.holders.get(id); return h !== undefined && h !== car.id; })) return false;
    if (me) {
      const span = car.path.dist(ch.sIn, ch.sOut) + this.nose + this.back;
      for (const id of ch.ids) {
        const j = this.data.junctions.find((q) => q.id === id)!;
        // never into a junction where the learner is on my way through it (in the other lane, they are not)
        const onMyWay = this.corners(me).some((p) => {
          const q = car.path.project(p, ch.sIn - this.nose, span);
          return q !== null && Math.abs(q.offset) < LANE_HALF + this.half && inPoly(p, j.polygon);
        });
        if (onMyWay) return false;
        if (!j.signal && !(j.merge && car.loop === this.data.merge.loop) && this.approaching(me, j.polygon) && !this.behind(car, me)) return false;
      }
    }
    // room beyond it: never stop in a junction behind a queue, or with a red light ahead in it or just past it
    const exitGap = car.path.dist(car.s + this.nose, ch.sOut) + this.back + this.nose + ROOM_M;
    for (const st of car.stops) {
      const d = car.path.dist(car.s + this.nose, st.s);
      if (d > 0.5 && d < exitGap && this.lights(st.signal)[st.group] !== 'green') return false;
    }
    for (const b of bodies) {
      if (b.id === car.id) continue;
      const hit = this.ahead(car.path, car.s, b);
      if (hit && hit.gap < exitGap && hit.gap > car.path.dist(car.s + this.nose, ch.sIn) && hit.v < 1) return false;
    }
    return true;
  }

  /** The learner would reach this box within YIELD_S, driving towards it. */
  private approaching(me: Body, poly: Vec2[]): boolean {
    if (me.v < 0.5) return false;
    const [hx, hy] = dir(me.heading);
    const front: Vec2 = [me.x + hx * this.nose, me.y + hy * this.nose];
    const cx = poly.reduce((acc, p) => acc + p[0], 0) / poly.length;
    const cy = poly.reduce((acc, p) => acc + p[1], 0) / poly.length;
    const toward = ((cx - front[0]) * hx + (cy - front[1]) * hy) / (Math.hypot(cx - front[0], cy - front[1]) || 1);
    if (toward < 0.3) return false;
    return distToPoly(front, poly) / me.v < YIELD_S;
  }

  /** The learner is following me in my lane: I do not give way to them. */
  private behind(car: Car, me: Body): boolean {
    const q = car.path.project([me.x, me.y], car.s - 20, 20);
    return !!q && Math.abs(q.offset) < LANE_HALF && car.path.dist(q.s, car.s) < 20;
  }

  private corners(b: Body): Vec2[] {
    const [hx, hy] = dir(b.heading);
    const at = (al: number, ac: number): Vec2 => [b.x + hx * al - hy * ac, b.y + hy * al + hx * ac];
    return [at(-this.back, -this.half), at(this.nose, -this.half), at(this.nose, this.half), at(-this.back, this.half)];
  }

  // ---------------------------------------------------------------- what the learner did

  private judge(sample: VehicleSample, me: Body): SimEvent[] {
    const events: SimEvent[] = [];
    const t = sample.t;
    const mine = this.corners(me);
    for (const car of this.cars) {
      const p = car.path.pose(car.s);
      const theirs = this.corners({ id: car.id, x: p.x, y: p.y, heading: p.heading, v: car.v, learner: false });
      if (!overlap(mine, theirs)) continue;
      const last = this.touching.get(car.id);
      this.touching.set(car.id, t);
      if (last === undefined || t - last > REHIT_S) events.push({ type: 'vehicle-hit', car: car.id, t, at: [sample.x, sample.y] });
    }
    const [hx, hy] = dir(sample.heading);
    const front: Vec2 = [sample.x + hx * this.nose, sample.y + hy * this.nose];
    if (this.prevFront && sample.speedKmh > 0) {
      for (const sg of this.data.signals) {
        for (const ap of sg.approaches) {
          if (Math.abs(wrapPi(sample.heading - rad(ap.heading_deg))) > Math.PI / 3) continue;
          if (!segmentsCross(this.prevFront, front, ap.stop[0], ap.stop[1])) continue;
          if (lightsAt(sg, this.t)[ap.group] === 'red') events.push({ type: 'red-light', signal: sg.id, t, at: front });
        }
      }
      const gw = this.data.merge.give_way;
      if (Math.abs(wrapPi(sample.heading - rad(this.data.merge.heading_deg))) < Math.PI / 3 && segmentsCross(this.prevFront, front, gw[0], gw[1])) {
        const gapS = this.mergeGapS();
        if (gapS < this.data.merge.gap_s) events.push({ type: 'merge-cut-in', gapS, t, at: front });
      }
    }
    this.prevFront = front;
    return events;
  }

  /**
   * Seconds until the next main-road car reaches the merge's conflict point (0 while one is in it); Infinity with
   * none on its way.
   */
  mergeGapS(): number {
    const m = this.data.merge;
    let best = Infinity;
    for (const car of this.cars) {
      if (car.loop !== m.loop) continue;
      const toConflict = car.path.dist(car.s + this.nose, m.conflict_s);
      const before = m.conflict_s - m.window[0];
      if (toConflict <= before) best = Math.min(best, toConflict / Math.max(car.v, 0.5));
      else if (car.path.dist(m.conflict_s, car.s - this.back) <= m.window[1] - m.conflict_s) best = 0;   // in it
    }
    return best;
  }

  // ---------------------------------------------------------------- the autopilot's view

  /**
   * The speed the learner may drive at, at route distance s (the rear axle), for what is ahead: a car in the lane,
   * a red light, the merge's give-way line while a main-road car is coming. Infinity when nothing limits it.
   */
  learnerLimitKmh(s: number, sample: VehicleSample): number {
    let cap = Infinity;
    this.limitWhy = '';
    const why = (c: number, w: string) => { if (c < cap) { cap = c; this.limitWhy = w; } };
    const brake = 2.0;
    const stopIn = (d: number) => Math.sqrt(2 * brake * Math.max(0, d)) * 3.6;
    const piece = this.route.find((r) => s >= r.s0 - 0.5 && s <= r.s0 + r.path.length + 0.5);
    if (piece) {
      const local = s - piece.s0;
      for (const car of this.cars) {
        const p = car.path.pose(car.s);
        const hit = this.ahead(piece.path, local, { id: car.id, x: p.x, y: p.y, heading: p.heading, v: car.v, learner: false });
        if (hit) why(Math.max(0, hit.v) * 3.6 + stopIn(hit.gap - IDM.gap - 0.5), `car ${car.id} gap ${hit.gap.toFixed(1)}`);
      }
    }
    const front = s + this.nose;
    const v = Math.abs(sample.speedKmh) / 3.6;
    const stop = this.routeStops.find((st) => st.s > front - 0.3 && st.s - front < LOOK_M);
    if (stop) {
      const d = stop.s - front;
      const light = this.lights(stop.signal)[stop.group];
      if (light === 'red' || (light === 'amber' && d > (v * v) / (2 * AMBER_STOP) + 0.5)) why(stopIn(d - STOP_SHORT), `${light} at ${stop.signal}`);
    }
    // junctions another car has taken: wait outside until it is through (else each waits for the other, inside)
    const ch = this.routeChains.filter((c) => c.sIn > front && c.sIn - front < LOOK_M).sort((p, q) => p.sIn - q.sIn)[0];
    const holder = ch?.held.map((id) => this.holders.get(id)).find((h) => h !== undefined);
    if (ch && holder) why(stopIn(ch.sIn - front - STOP_SHORT), `${ch.ids.join('+')} taken by ${holder}`);
    // a junction another car is crossing, or is too close to stop short of: wait outside it, signals or not, unless
    // that car leads on my own way. Inside, two cars crossing each other's way would each wait for the other (a car
    // that went in on amber is still turning when my green comes); and a yellow box is never stopped in. The stop
    // aims CLEAR_M short of the box: the car must not roll its nose in while it brakes.
    if (ch && piece) {
      const boxes = ch.ids.map((id) => this.data.junctions.find((j) => j.id === id)!.polygon);
      for (const car of this.cars) {
        const p = car.path.pose(car.s);
        const body = { id: car.id, x: p.x, y: p.y, heading: p.heading, v: car.v, learner: false };
        const inside = this.corners(body).some((c) => boxes.some((poly) => inPoly(c, poly)));
        const [hx, hy] = dir(p.heading);
        const nose: Vec2 = [p.x + hx * this.nose, p.y + hy * this.nose];
        const committed = car.v > 0.5 && boxes.some((poly) => distToPoly(nose, poly) < (car.v * car.v) / (2 * IDM.brake) + 0.5);
        if (!inside && !committed) continue;
        const q = piece.path.project([p.x, p.y], s - piece.s0, LOOK_M + this.nose);
        if (q && Math.abs(q.offset) < LANE_HALF + this.half && Math.cos(p.heading - piece.path.pose(q.s).heading) > 0.7) continue;
        why(stopIn(ch.sIn - front - STOP_SHORT - CLEAR_M), `${ch.ids.join('+')} crossed by ${car.id}`);
      }
    }
    // and never into them with no room beyond: a queue, or a red light, past a junction waits before it, keeping it clear
    if (ch) {
      const past = this.routeStops.find((st) => st.s > ch.sIn && st.s < ch.sOut + this.back + this.nose + ROOM_M);
      if (past && this.lights(past.signal)[past.group] !== 'green') why(stopIn(ch.sIn - front - STOP_SHORT), `${this.lights(past.signal)[past.group]} at ${past.signal} past ${ch.ids.join('+')}`);
    }
    if (ch && piece) {
      const room = ch.sOut - piece.s0 + this.back + this.nose + ROOM_M;
      for (const car of this.cars) {
        if (car.v > 1) continue;
        const p = car.path.pose(car.s);
        const hit = this.ahead(piece.path, s - piece.s0, { id: car.id, x: p.x, y: p.y, heading: p.heading, v: car.v, learner: false });
        if (hit && hit.gap + (s - piece.s0) + this.nose < room && hit.gap > ch.sIn - front) why(stopIn(ch.sIn - front - STOP_SHORT), `no room past ${ch.ids.join('+')}`);
      }
    }
    if (this.routeGiveWay !== null) {
      const d = this.routeGiveWay - front;
      if (d > -0.3 && d < LOOK_M && this.mergeGapS() < this.data.merge.gap_s + 1.5) why(stopIn(d - STOP_SHORT), 'merge gap');
    }
    return cap;
  }
}

// ---------------------------------------------------------------- geometry

function inPoly(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToPoly(p: Vec2, poly: Vec2[]): number {
  if (inPoly(p, poly)) return 0;
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j];
    const b = poly[i];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / (ex * ex + ey * ey || 1)));
    best = Math.min(best, Math.hypot(p[0] - a[0] - ex * u, p[1] - a[1] - ey * u));
  }
  return best;
}

/** Two convex quads overlap (separating axes). */
function overlap(a: Vec2[], b: Vec2[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const nx = p[1] - q[1];
      const ny = q[0] - p[0];
      const pa = a.map(([x, y]) => nx * x + ny * y);
      const pb = b.map(([x, y]) => nx * x + ny * y);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}
