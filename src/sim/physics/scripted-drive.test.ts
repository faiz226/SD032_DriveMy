// @vitest-environment node
// One continuous assessment, driven only through the controls a learner has (pedals, wheel, gear,
// handbrake), on the real yard's colliders, judged by the rules engine. No teleports. The line itself is
// pilot.ts, the same one the page's autopilot drives.
import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, describe, expect, it } from 'vitest';
import type { SessionState, Vec2, VehicleSample } from '../contracts';
import { createSession } from '../core/session';
import { circuit, rules, swift } from '../data';
import { rad } from '../geom';
import { Traffic } from '../traffic/model';
import { getWorld } from '../world/build';
import { addWorldColliders } from '../world/colliders';
import { G, SWIFT_DRIVE as P } from './drive';
import { Pilot } from './pilot';
import { type Controls, Vehicle } from './vehicle';

const DT = P.dt;

/** A headless world, the car at the spawn, and the rules watching: what the page does, without the screen. */
class Drive {
  world: RAPIER.World;
  car: Vehicle;
  session = createSession(circuit, rules, swift, 'assessment');
  state!: SessionState;
  last!: VehicleSample;
  t = 0;
  kerb: { t: number; at: Vec2; ring: number }[] = [];
  hits: string[] = [];
  maxKmh: Record<string, number> = {};
  poles: Map<number, number>;
  traffic: Traffic | null;
  met: string[] = [];   // what the other cars saw the learner do
  still = 0;            // seconds stood still now, and the longest
  longestStill = 0;

  /** `traffic`: the other cars, already this many seconds into their day (null: an empty yard). */
  constructor(traffic: number | null = null) {
    this.traffic = traffic === null ? null : new Traffic(circuit, swift);
    for (let k = 0; this.traffic && k < Math.round((traffic ?? 0) / DT); k++) this.traffic.step(DT, null);
    this.world = new RAPIER.World({ x: 0, y: -G, z: 0 });
    this.world.timestep = DT;
    this.poles = addWorldColliders(RAPIER, this.world, getWorld(circuit)).poles;
    const [x, y] = circuit.spawn.at;
    this.car = new Vehicle(RAPIER, this.world, { x, y: P.radius + 0.02, z: -y, yaw: rad(circuit.spawn.heading_deg) });
    this.tick({ throttle: 0, brake: 1, handbrake: true, gear: 'D', wheel: 0 });
  }

  tick(controls: Controls) {
    this.car.beforeStep(controls);
    this.world.step();
    const pre = this.car.sample(this.t, circuit, swift.tyre_width_m);
    this.car.afterStep(pre.slope !== null);
    this.t += DT;
    const s = this.car.sample(this.t, circuit, swift.tyre_width_m);
    const hits = this.car.poleHits(this.poles, this.t);
    const met = this.traffic?.step(DT, s) ?? [];
    this.still = Math.abs(s.speedKmh) < 0.3 ? this.still + DT : 0;
    this.longestStill = Math.max(this.longestStill, this.still);
    for (const e of met) this.met.push(`${e.type} t${this.t.toFixed(1)} (${s.x.toFixed(1)},${s.y.toFixed(1)})`);
    this.state = this.session.step(s, [...hits, ...met], DT, false);
    this.last = s;
    for (const h of hits) this.hits.push(`pole ${h.type === 'obstacle-hit' ? h.index : ''} t${this.t.toFixed(1)} (${s.x.toFixed(2)},${s.y.toFixed(2)})`);
    s.wheels.forEach((w) => { if (w.onKerb !== null) this.kerb.push({ t: this.t, at: [w.x, w.y], ring: w.onKerb }); });
    const where = this.state.current ?? 'end';
    this.maxKmh[where] = Math.max(this.maxKmh[where] ?? 0, Math.abs(s.speedKmh));
  }
}

beforeAll(async () => {
  await RAPIER.init();
});

/** Step a fresh world with a plan's controls, from the spawn: the page's loop, without the screen. */
function drive(plan: (pilot: Pilot) => Iterable<Controls>, traffic: number | null = null) {
  const d = new Drive(traffic);
  const pilot = new Pilot();
  pilot.traffic = () => d.traffic;
  pilot.observe(d.last, 0);
  for (const controls of plan(pilot)) {
    d.tick(controls);
    pilot.observe(d.last, DT);
  }
  const report = { marks: pilot.marks, hits: d.hits, met: d.met, kerb: d.kerb.slice(0, 5), faults: d.state.faults, statuses: d.state.stations.map((st) => `${st.id}:${st.status}`), maxKmh: d.maxKmh, seconds: Math.round(d.t) };
  return { d, report: JSON.stringify(report) };
}

describe('acceptance runs through the real controls (WP6)', () => {
  it('a clean run: spawn to exit, no tyre on a kerb, 0 demerits, and the verdict passes', () => {
    const { d, report } = drive((p) => p.assessment());
    expect(d.kerb, report).toEqual([]);
    expect(d.state.verdict, report).toMatchObject({ pass: true, demerits: 0 });
    // 15 km/h or less everywhere but the merge leg, and 10 or less (with the cruise band's 0.5) in the S and Z
    for (const [where, v] of Object.entries(d.maxKmh)) if (where !== 'road-merging' && where !== 'end') expect(v, where).toBeLessThanOrEqual(15);
    for (const id of ['s-curve', 'z-curve'] as const) expect(d.maxKmh[id], id).toBeLessThanOrEqual(10.5);
    expect(Math.abs(d.last.speedKmh)).toBeLessThan(0.1);   // the plan ends stopped
  }, 600_000);

  it('one fault of each kind on purpose: it fails, and lists each with its station, measure, limit and fix', () => {
    const { d, report } = drive((p) => p.assessment(true));
    const v = d.state.verdict;
    expect(v, report).not.toBeNull();
    expect(v!.pass, report).toBe(false);
    const find = (kind: string, reason?: string) => v!.faults.find((f) => f.kind === kind && (!reason || f.reasonKey === reason));
    const want: [string, string | undefined, string][] = [
      ['rollback', undefined, 'hill-start'],
      ['not_in_bay', undefined, 'side-parking'],
      ['pole', undefined, 'side-parking'],
      ['station_failed', 'sim.fault.s.speed', 's-curve'],
      ['kerb', undefined, 'z-curve'],
      ['station_failed', 'sim.fault.ramp.window', 'ramp-test'],
      ['station_failed', 'sim.fault.merge.slow', 'road-merging'],
    ];
    for (const [kind, reason, station] of want) {
      const f = find(kind, reason);
      expect(f, `${kind} ${reason ?? ''} ${report}`).toBeDefined();
      expect(f!.station, kind).toBe(station);
      expect(f!.fixKey, kind).toMatch(/^sim\.fix\./);
      expect(f!.basis.length, kind).toBeGreaterThan(0);
    }
    for (const reason of ['sim.fault.rollback', 'sim.fault.ramp.window', 'sim.fault.merge.slow']) {
      const f = v!.faults.find((x) => x.reasonKey === reason)!;
      expect(f.measured, reason).toBeTruthy();
      expect(f.limit, reason).toBeTruthy();
    }
  }, 600_000);

  // Among the other cars (the owner, 20 Oct), at two moments of their day: 20 s in, a car went into J1 on amber
  // and was still turning when the learner's green came (each waited for the other, then they touched), and the
  // route passes J1's eastbound stop line twice (the second pass ran the red).
  for (const at of [0, 20]) {
    it(`a clean run among the other cars, ${at} s into their day: no contact, no red light, and the verdict passes`, () => {
      const { d, report } = drive((p) => p.assessment(), at);
      expect(d.met, report).toEqual([]);
      expect(d.state.verdict, report).toMatchObject({ pass: true, demerits: 0 });
      // the spine road's junctions are let go of one by one, and the learner waits only for the stretch it cannot
      // stop in: before, it stood 70 s at a time behind a car that held the whole road
      expect(d.longestStill, report).toBeLessThan(40);
    }, 900_000);
  }

  it('nothing: an assessment with no input never passes', () => {
    const { d } = drive(function* () {
      for (let k = 0; k < Math.round(180 / DT); k++) yield { throttle: 0, brake: 1, handbrake: true, gear: 'D', wheel: 0 } as Controls;
    });
    expect(d.state.verdict).toBeNull();
    expect(d.state.stations.every((st) => st.status !== 'cleared')).toBe(true);
  }, 600_000);
});
