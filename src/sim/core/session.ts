// DriveMy v2 rules engine. Pure TypeScript: no React, no three.js, no Rapier.
// Every threshold comes from rules.json, every position from circuit.json (docs/v2-plan/RULES.md).
import type {
  CarConfig, CircuitData, CreateSession, Fault, Gate, Mode, RulesData, SessionState, SimEvent,
  StationGeometry, StationId, StationProgress, Vec2, VehicleSample,
} from '../contracts';
import {
  bayHeadingLimit, bayOverhang, dir, footprint, headingErrorToAxis, pointInPolygon, rad, segmentsCross, toDeg, wrapPi,
} from '../geom';

// Progress tracking along route.samples (0.25 m apart). Engine internals, not rule thresholds.
const AHEAD = 32;           // samples searched ahead of the last match (8 m): short, because the route passes
                            // the same road twice (the side-parking band, the middle road) and must not jump ahead
const BEHIND = 16;          // and behind it (4 m), for reversing
const MAX_OFFSET_M = 8;     // further than this from every sample searched: keep the last progress
const PASS_MARGIN_M = 0.5;  // this far past a station's s_to counts as driving past it
const JUMP_M = 1;           // samples further apart than this are a manoeuvre's break in the line
const EPS = 1e-6;           // for timers summed from many small steps

type Rec = Record<string, unknown>;
type Kind = 'cone' | 'pole' | 'rollback' | 'not_in_bay' | 'kerb';

function need(o: Rec | undefined, key: string, where: string): number {
  const v = o?.[key];
  if (typeof v !== 'number') throw new Error(`rules.json: ${where}.${key} must be a number`);
  return v;
}

function readRules(r: RulesData) {
  const st = r.stations as unknown as Record<StationId, Rec>;
  const dm = r.demerits as unknown as Record<Kind, Rec>;
  const band = st['s-curve'].speed_band_kmh as [number, number];
  const win = st['ramp-test'].stop_window_m as [number, number];
  return {
    failAt: r.verdict.fail_at_demerits,
    endAtFail: r.verdict.end_run_at_fail,
    stoppedKmh: need((r as unknown as Rec).motion as Rec, 'stopped_kmh', 'motion'),
    points: (k: Kind) => need(dm[k], 'points', `demerits.${k}`),
    clearS: (k: 'kerb' | 'pole' | 'cone') => need(dm[k], 'clear_s', `demerits.${k}`),
    rollbackLimit: need(dm.rollback, 'limit_m', 'demerits.rollback'),
    demeritBasis: (k: Kind) => String(dm[k].basis ?? ''),
    stationBasis: (id: StationId) => String(st[id].basis ?? ''),
    timeLimit: (id: StationId) => (typeof st[id].time_limit_s === 'number' ? (st[id].time_limit_s as number) : null),
    hill: {
      hold: need(st['hill-start'], 'hold_s', 'hill-start'),
      still: need(st['hill-start'], 'still_m', 'hill-start'),
      handbrake: st['hill-start'].handbrake_required === true,
    },
    commitS: (id: StationId) => need(st[id], 'commit_s', id),
    tpt: {
      minMove: need(st['three-point-turn'], 'movement_min_m', 'three-point-turn'),
      movements: need(st['three-point-turn'], 'movements', 'three-point-turn'),
      turnDeg: need(st['three-point-turn'], 'turn_deg', 'three-point-turn'),
      settleKmh: need(st['three-point-turn'], 'settle_kmh', 'three-point-turn'),
    },
    sBand: [need({ v: band?.[0] }, 'v', 's-curve.speed_band_kmh[0]'), need({ v: band?.[1] }, 'v', 's-curve.speed_band_kmh[1]')],
    sGrace: need(st['s-curve'], 'grace_s', 's-curve'),
    cornerKmh: need(st['z-curve'], 'corner_kmh', 'z-curve'),
    ramp: {
      window: [need({ v: win?.[0] }, 'v', 'ramp-test.stop_window_m[0]'), need({ v: win?.[1] }, 'v', 'ramp-test.stop_window_m[1]')],
      hold: need(st['ramp-test'], 'hold_s', 'ramp-test'),
      still: need(st['ramp-test'], 'still_m', 'ramp-test'),
      handbrake: st['ramp-test'].handbrake_required === true,
    },
    mergeKmh: need(st['road-merging'], 'min_kmh', 'road-merging'),
  };
}

/** A station's working state; a restart or a void starts it afresh. */
interface Work {
  phase: number;              // hill, ramp: 0 looking for the stop, 1 held
  holdT: number;
  holdFrom: Vec2 | null;
  commitT: number;            // bays
  committed: boolean;
  entryHeading: number | null; // three-point turn
  movements: number;
  moveDir: number;
  pendDist: number;
  gate: number;               // S, Z: the next gate
  outT: number;
  waiting: boolean;           // Z: a corner gate crossed too fast, waiting for the car to slow
}
const freshWork = (): Work => ({
  phase: 0, holdT: 0, holdFrom: null, commitT: 0, committed: false, entryHeading: null,
  movements: 0, moveDir: 0, pendDist: 0, gate: 0, outT: 0, waiting: false,
});

interface Run { geo: StationGeometry; pub: StationProgress; m: Work; blocked: boolean }

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

export const createSession: CreateSession = (circuit: CircuitData, rulesData: RulesData, car: CarConfig, mode: Mode, only?: StationId) => {
  const R = readRules(rulesData);
  const samples = circuit.route.samples;
  const ordered = [...circuit.stations].sort((a, b) => a.order - b.order);
  const offRoute = circuit.stations.filter((g) => g.slope === 'ramp' && g.box).map((g) => g.box!);
  const nose = car.wheelbase_m + car.front_overhang_m;

  let drill = only;
  let runs: Run[] = [];
  let state!: SessionState;
  let idx = 0;                 // progress: nearest route sample
  let s = 0;                   // and the distance along the route
  let prev: Vec2 | null = null;
  let wasStopped = true;
  const roll = { id: null as null | 'hill' | 'ramp', peak: 0, faulted: false, fault: -1, worst: 0 };
  const kerbs = new Map<number, number>();   // ring -> last touched
  const hits = new Map<string, number>();    // obstacle -> last touched

  function nearestIndex(at: Vec2, from = 0, to = samples.length - 1): number {
    let best = from;
    let bestD = Infinity;
    for (let j = Math.max(0, from); j <= Math.min(samples.length - 1, to); j++) {
      const d = Math.hypot(samples[j][1] - at[0], samples[j][2] - at[1]);
      if (d < bestD) { bestD = d; best = j; }
    }
    return best;
  }

  function init() {
    const geos = drill ? ordered.filter((g) => g.id === drill) : ordered;
    if (!geos.length) throw new Error(`unknown station: ${drill}`);
    runs = geos.map((geo) => ({
      geo, m: freshWork(), blocked: false,
      pub: { id: geo.id, status: 'waiting', startedAt: null, timeLimitS: R.timeLimit(geo.id), detail: {} },
    }));
    state = {
      mode, current: runs[0].geo.id, stations: runs.map((r) => r.pub), demerits: 0, faults: [],
      ended: false, topDownSeconds: 0, verdict: null,
    };
    const first = runs[0].geo;
    idx = drill
      ? nearestIndex(first.start.at, samples.findIndex((q) => q[0] >= first.s_from - 12), samples.findIndex((q) => q[0] >= first.s_from))
      : nearestIndex(circuit.spawn.at, 0, AHEAD);
    s = samples[idx][0];
    prev = null;
    wasStopped = true;
    roll.id = null;
    kerbs.clear();
    hits.clear();
  }

  function track(p: Vec2) {
    if (offRoute.some((box) => pointInPolygon(p, box))) return;   // the route runs beside the ramp: hold progress on it
    let best = -1;
    let bestD = Infinity;
    for (let j = Math.max(0, idx - BEHIND); j <= Math.min(samples.length - 1, idx + AHEAD); j++) {
      const d = Math.hypot(samples[j][1] - p[0], samples[j][2] - p[1]);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (bestD > MAX_OFFSET_M) return;
    idx = best;
    s = samples[best][0];
    let dBest = bestD;
    for (const k of [best - 1, best]) {         // refine on the segments either side of the match
      const a = samples[k];
      const b = samples[k + 1];
      if (!a || !b) continue;
      const ex = b[1] - a[1];
      const ey = b[2] - a[2];
      const len = Math.hypot(ex, ey);
      if (len === 0 || len > JUMP_M) continue;
      const u = Math.max(0, Math.min(1, ((p[0] - a[1]) * ex + (p[1] - a[2]) * ey) / (len * len)));
      const d = Math.hypot(a[1] + u * ex - p[0], a[2] + u * ey - p[1]);
      if (d < dBest) { dBest = d; s = a[0] + u * (b[0] - a[0]); }
    }
  }

  function crossed(g: Gate | undefined, p: Vec2, sense = 1): boolean {
    if (!g || !prev) return false;
    const [gx, gy] = dir(rad(g.heading_deg));
    return segmentsCross(prev, p, g.a, g.b) && ((p[0] - prev[0]) * gx + (p[1] - prev[1]) * gy) * sense > 0;
  }

  function fault(kind: Fault['kind'], station: StationId, points: number, at: Vec2, t: number, code: string, basis: string, measured?: string, limit?: string) {
    state.faults.push({
      kind, station, points, at: [r2(at[0]), r2(at[1])], t: r2(t), measured, limit,
      reasonKey: `sim.fault.${code}`, fixKey: `sim.fix.${code}`, basis,
    });
    state.demerits += points;
  }

  function end() {
    if (state.ended) return;
    state.ended = true;
    state.current = null;
    state.verdict = {
      pass: runs.every((r) => r.pub.status === 'cleared') && state.demerits < R.failAt,
      demerits: state.demerits,
      failedStations: runs.filter((r) => r.pub.status === 'failed').map((r) => r.geo.id),
      faults: [...state.faults],
      topDownSeconds: r1(state.topDownSeconds),
    };
  }

  function advance() {
    const next = runs.find((r) => r.pub.status === 'waiting' || r.pub.status === 'armed');
    state.current = next ? next.geo.id : null;
    if (!next) end();
  }

  function clear(run: Run) {
    run.pub.status = 'cleared';
    advance();
  }

  /** `code` names the reason; a station failed by a fault already listed (pole, rollback) adds no second record. */
  function fail(run: Run, code: string | null, at: Vec2, t: number, measured?: string, limit?: string) {
    run.pub.status = 'failed';
    if (code) fault('station_failed', run.geo.id, 0, at, t, code, R.stationBasis(run.geo.id), measured, limit);
    advance();
  }

  /**
   * Practice only: the attempt is void. The station waits, unarmed, for restartStation (the screen moves the car
   * back to its start); detail.voids counts the voids so the screen can react.
   */
  function voidRun(run: Run) {
    const voids = Number(run.pub.detail.voids ?? 0) + 1;
    run.pub.status = 'waiting';
    run.pub.startedAt = null;
    run.pub.detail = { voids };
    run.m = freshWork();
    run.blocked = true;
  }

  // ---------------------------------------------------------------- faults any time

  function kerbStep(sample: VehicleSample, events: SimEvent[]) {
    const touched = new Map<number, Vec2>();
    sample.wheels.forEach((w) => { if (w.onKerb !== null) touched.set(w.onKerb, [w.x, w.y]); });
    for (const e of events) if (e.type === 'kerb-contact') touched.set(e.ring, e.at);
    for (const [ring, last] of kerbs) if (!touched.has(ring) && sample.t - last >= R.clearS('kerb') - EPS) kerbs.delete(ring);
    for (const [ring, at] of touched) {
      const isNew = !kerbs.has(ring);
      kerbs.set(ring, sample.t);
      if (isNew && state.current) fault('kerb', state.current, R.points('kerb'), at, sample.t, 'kerb', R.demeritBasis('kerb'));
    }
  }

  function hitStep(events: SimEvent[]) {
    for (const e of events) {
      if (e.type !== 'obstacle-hit') continue;
      const key = `${e.kind}${e.index}`;
      const last = hits.get(key);
      hits.set(key, e.t);
      if (last !== undefined && e.t - last < R.clearS(e.kind) - EPS) continue;   // the same contact
      const owner = e.kind === 'pole' ? circuit.obstacles.poles[e.index]?.station : undefined;
      const station = state.current ?? owner;
      if (!station) continue;
      fault(e.kind, station, R.points(e.kind), e.at, e.t, e.kind, R.demeritBasis(e.kind));
      const run = runs.find((r) => r.geo.id === owner);
      if (run && run.pub.status === 'armed') fail(run, null, e.at, e.t);
    }
  }

  /**
   * Backward travel along the current station's slope while not in reverse, from the furthest-forward point since
   * the car last stopped. Once counted, the fault keeps the worst distance until the car stops or leaves the slope.
   */
  function rollbackStep(sample: VehicleSample, run: Run | undefined, stopped: boolean) {
    const sl = sample.slope;
    const owned = run?.pub.status === 'armed' && sl?.id === run.geo.slope;
    if (!sl || (!owned && !(roll.fault >= 0 && sl.id === roll.id)) || sample.gear === 'R' || roll.id !== sl.id) {
      roll.id = sl && (owned || roll.fault >= 0) ? sl.id : null;
      roll.peak = sl?.along ?? 0;
      roll.faulted = false;
      roll.fault = -1;
      return;
    }
    roll.peak = Math.max(roll.peak, sl.along);
    const back = roll.peak - sl.along;
    if (owned) run!.pub.detail.rollbackM = r2(Math.max(Number(run!.pub.detail.rollbackM ?? 0), back));
    if (roll.fault >= 0 && back > roll.worst) {
      roll.worst = back;
      state.faults[roll.fault] = { ...state.faults[roll.fault], measured: `${back.toFixed(2)} m` };
    }
    if (owned && !roll.faulted && back > R.rollbackLimit + EPS) {
      roll.faulted = true;
      roll.fault = state.faults.length;
      roll.worst = back;
      fault('rollback', run!.geo.id, R.points('rollback'), [sample.x, sample.y], sample.t, 'rollback',
        R.demeritBasis('rollback'), `${back.toFixed(2)} m`, `${R.rollbackLimit.toFixed(2)} m`);
      if (run!.geo.id === 'hill-start') fail(run!, null, [sample.x, sample.y], sample.t);
    }
    if (stopped && !wasStopped) { roll.peak = sl.along; roll.faulted = false; roll.fault = -1; }
  }

  // ---------------------------------------------------------------- the eight stations

  /** Stillness hold: true once the car has stayed within `still` metres for `hold` seconds while `ok`. */
  function hold(w: Work, ok: boolean, p: Vec2, dt: number, holdS: number, still: number): boolean {
    if (!ok) { w.holdFrom = null; w.holdT = 0; return false; }
    if (!w.holdFrom || Math.hypot(p[0] - w.holdFrom[0], p[1] - w.holdFrom[1]) > still) { w.holdFrom = p; w.holdT = dt; }
    else w.holdT += dt;
    return w.holdT >= holdS - EPS;
  }

  function hill(run: Run, x: VehicleSample, p: Vec2, dt: number, stopped: boolean) {
    const w = run.m;
    const band = run.geo.stop_band!;
    const [ux, uy] = dir(rad(samples[idx][3]));
    const onBand = [x.wheels[0], x.wheels[1]].every((wh) => {
      const ws = s + (wh.x - p[0]) * ux + (wh.y - p[1]) * uy;
      return ws >= band.s_from && ws <= band.s_to;
    });
    if (w.phase === 0 && hold(w, stopped && onBand && (x.handbrake || !R.hill.handbrake), p, dt, R.hill.hold, R.hill.still)) w.phase = 1;
    run.pub.detail = { ...run.pub.detail, onBand, heldS: r1(w.holdT), held: w.phase === 1 };
    if (crossed(run.geo.gates.find((g) => g.id === 'crest'), p)) {
      if (w.phase === 1) clear(run);
      else fail(run, 'hill.noStop', p, x.t, `held ${w.holdT.toFixed(1)} s`, `${R.hill.hold} s on the band with the handbrake on`);
    }
  }

  function bay(run: Run, x: VehicleSample, p: Vec2, dt: number, stopped: boolean) {
    const w = run.m;
    if (w.committed) return;
    w.commitT = stopped && x.handbrake ? w.commitT + dt : 0;
    run.pub.detail = { ...run.pub.detail, commitS: r1(w.commitT) };
    if (w.commitT < R.commitS(run.geo.id) - EPS) return;
    w.committed = true;
    const b = run.geo.bay!;
    const out = bayOverhang(b, footprint(p, x.heading, car, car.width_mirrors_m));
    const err = toDeg(headingErrorToAxis(x.heading, b.axis_deg));
    const limit = toDeg(bayHeadingLimit(car.length_m, car.width_mirrors_m, b.width));
    const inBay = out <= EPS;                // on the line counts as inside
    run.pub.detail = { ...run.pub.detail, inBay, outsideM: r2(Math.max(0, out)), headingDeg: r1(err), limitDeg: r1(limit) };
    if (!inBay) {
      fault('not_in_bay', run.geo.id, R.points('not_in_bay'), p, x.t, 'notInBay', R.demeritBasis('not_in_bay'),
        `${out.toFixed(2)} m outside, ${err.toFixed(1)}° off`, `inside the ${b.width} × ${b.length} m box, mirrors included; ${limit.toFixed(1)}° at most`);
    }
  }

  function threePoint(run: Run, x: VehicleSample, p: Vec2, dt: number) {
    const w = run.m;
    const T = R.tpt;
    if (w.entryHeading === null) {
      if (!pointInPolygon(p, run.geo.box!)) return;
      w.entryHeading = x.heading;
      w.movements = 1;
      w.moveDir = x.speedKmh < 0 ? -1 : 1;
    }
    if (Math.abs(x.speedKmh) >= R.stoppedKmh) {
      const d = x.speedKmh < 0 ? -1 : 1;
      if (d === w.moveDir) w.pendDist = 0;
      else {
        w.pendDist += (Math.abs(x.speedKmh) / 3.6) * dt;
        if (w.pendDist >= T.minMove - EPS) { w.movements += 1; w.moveDir = d; w.pendDist = 0; }
      }
    }
    const turned = toDeg(Math.abs(wrapPi(x.heading - w.entryHeading)));
    run.pub.detail = { movements: w.movements, turnedDeg: Math.round(turned) };
    if (w.movements > T.movements) fail(run, 'threePoint.fourth', p, x.t, `${w.movements} movements`, `${T.movements} movements`);
    else if (w.movements === T.movements && turned >= T.turnDeg && Math.abs(x.speedKmh) <= T.settleKmh) clear(run);
  }

  function sCurve(run: Run, x: VehicleSample, p: Vec2, dt: number) {
    const w = run.m;
    const gates = run.geo.gates;
    if (crossed(gates[w.gate], p)) w.gate += 1;
    const v = Math.abs(x.speedKmh);
    if (w.gate >= 1 && w.gate < gates.length) {
      w.outT = v < R.sBand[0] || v > R.sBand[1] ? w.outT + dt : 0;
      if (w.outT > R.sGrace + EPS) {
        if (mode === 'practice') return voidRun(run);
        return fail(run, 's.speed', p, x.t, `${v.toFixed(0)} km/h for more than ${R.sGrace} s`, `${R.sBand[0]}–${R.sBand[1]} km/h`);
      }
    }
    run.pub.detail = { ...run.pub.detail, gate: w.gate, gates: gates.length, outS: r1(w.outT) };
    if (w.gate >= gates.length) clear(run);
  }

  function zCurve(run: Run, x: VehicleSample, p: Vec2) {
    const w = run.m;
    const gates = run.geo.gates;
    const v = Math.abs(x.speedKmh);
    if (w.waiting) {
      if (v <= R.cornerKmh) { w.waiting = false; w.gate += 1; }
    } else if (crossed(gates[w.gate], p)) {
      if (gates[w.gate].id.startsWith('corner') && v > R.cornerKmh) w.waiting = true;
      else w.gate += 1;
    }
    run.pub.detail = { gate: w.gate, gates: gates.length, waiting: w.waiting };
    if (w.gate >= gates.length) clear(run);
  }

  function ramp(run: Run, x: VehicleSample, p: Vec2, dt: number, stopped: boolean) {
    const w = run.m;
    const g = run.geo;
    const [ux, uy] = dir(rad(g.axis!.heading_deg));
    const [hx, hy] = dir(x.heading);
    const poleR = circuit.obstacles.poles.find((q) => q.station === g.id)?.radius ?? 0;
    const gap = (g.pole![0] - p[0] - hx * nose) * ux + (g.pole![1] - p[1] - hy * nose) * uy - poleR;
    const inWindow = gap >= R.ramp.window[0] - EPS && gap <= R.ramp.window[1] + EPS;
    if (w.phase === 0 && hold(w, stopped && inWindow && (x.handbrake || !R.ramp.handbrake), p, dt, R.ramp.hold, R.ramp.still)) w.phase = 1;
    run.pub.detail = { ...run.pub.detail, gapM: r2(gap), heldS: r1(w.holdT), held: w.phase === 1 };
    if (w.phase === 1 && crossed(g.gates.find((q) => q.id === 'mouth'), p, -1)) clear(run);
  }

  function merge(run: Run, x: VehicleSample, p: Vec2) {
    if (!crossed(run.geo.gates.find((g) => g.id === 'finish'), p)) return;
    const v = Math.abs(x.speedKmh);
    run.pub.detail = { ...run.pub.detail, finishKmh: Math.round(v) };
    if (v >= R.mergeKmh - EPS) clear(run);
    else if (mode === 'practice') voidRun(run);
    else fail(run, 'merge.slow', p, x.t, `${v.toFixed(0)} km/h`, `${R.mergeKmh} km/h`);
  }

  function machine(run: Run, x: VehicleSample, p: Vec2, dt: number, stopped: boolean) {
    switch (run.geo.id) {
      case 'hill-start': return hill(run, x, p, dt, stopped);
      case 'side-parking':
      case 'parallel-parking': return bay(run, x, p, dt, stopped);
      case 'three-point-turn': return threePoint(run, x, p, dt);
      case 's-curve': return sCurve(run, x, p, dt);
      case 'z-curve': return zCurve(run, x, p);
      case 'ramp-test': return ramp(run, x, p, dt, stopped);
      case 'road-merging': return merge(run, x, p);
    }
  }

  // ---------------------------------------------------------------- the session

  const snapshot = (): SessionState => ({
    ...state,
    stations: state.stations.map((st) => ({ ...st, detail: { ...st.detail } })),
    faults: [...state.faults],
    verdict: state.verdict && { ...state.verdict, failedStations: [...state.verdict.failedStations], faults: [...state.verdict.faults] },
  });

  init();

  return {
    step(x: VehicleSample, events: SimEvent[], dt: number, topDownOn: boolean): SessionState {
      if (state.ended) return snapshot();
      const p: Vec2 = [x.x, x.y];
      const stopped = Math.abs(x.speedKmh) < R.stoppedKmh;
      if (topDownOn) state.topDownSeconds += dt;
      track(p);
      kerbStep(x, events);
      hitStep(events);
      const run = runs.find((r) => r.geo.id === state.current);
      if (run && run.pub.status === 'waiting' && !run.blocked && s >= run.geo.s_from) {
        run.pub.status = 'armed';
        run.pub.startedAt = x.t;
      }
      rollbackStep(x, run, stopped);
      if (run?.pub.status === 'armed') machine(run, x, p, dt, stopped);
      if (run?.pub.status === 'armed') {
        const limit = run.pub.timeLimitS;
        const elapsed = x.t - (run.pub.startedAt ?? x.t);
        if (limit !== null && elapsed > limit + EPS) fail(run, 'time', p, x.t, `${Math.round(elapsed)} s`, `${limit} s`);
        else if (s > run.geo.s_to + PASS_MARGIN_M) {
          if (run.m.committed) clear(run);   // a bay: done, and driven out past the end
          else fail(run, 'passed', p, x.t);
        }
      }
      if (R.endAtFail && state.demerits >= R.failAt) end();
      prev = p;
      wasStopped = stopped;
      return snapshot();
    },

    restartStation(id: StationId) {
      if (mode !== 'practice') throw new Error('restartStation is for practice only');
      drill = id;
      init();
      const start = runs[0].geo.start;
      return { at: start.at, heading: rad(start.heading_deg) };
    },

    state: snapshot,
  };
};
