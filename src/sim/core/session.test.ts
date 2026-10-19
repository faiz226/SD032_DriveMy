import { describe, expect, it, vi } from 'vitest';
import type { RulesData, StationId, Vec2 } from '../contracts';
import { circuit, rules, swift } from '../data';
import { bayHeadingLimit, dir, rad, toDeg } from '../geom';
import { en } from '../../lib/translations/en';
import { ms } from '../../lib/translations/ms';
import { createSession } from './session';
import {
  DT, Driver, HILL_STOP_S, L, LOCK, PAR, POSITIVE, R_LOCK, SIDE, TPT, assessment, drill, hillDrive, mergeDrive,
  parallelDrive, parallelReverseIn, rampDrive, rampIn, rampOut, routePose, sDrive, sNear, sideDrive, sideReverseIn, station,
  threePointDrive, zDrive,
} from './testkit';

vi.setConfig({ testTimeout: 120_000 });   // whole runs and 5-minute time limits are many 60 Hz steps

const ORDER = [...circuit.stations].sort((a, b) => a.order - b.order).map((g) => g.id);
const status = (d: Driver, id: StationId) => d.stationState(id).status;
const reasons = (d: Driver) => d.last.faults.map((f) => f.reasonKey);
const gateS = (id: StationId, gate: string) => station(id).gates.find((g) => g.id === gate)!.s!;
const CREST = () => gateS('hill-start', 'crest');

/** Move forward along the heading while the handbrake stays on, below the stopped speed. */
function creep(d: Driver, dist: number) {
  const n = Math.ceil(dist / ((0.3 / 3.6) * DT));
  d.kmh = 0.3;
  d.handbrake = true;
  for (let i = 0; i < n; i++) {
    d.at = [d.at[0] + (dist / n) * Math.cos(d.heading), d.at[1] + (dist / n) * Math.sin(d.heading)];
    d.tick();
  }
}

/** Park the car's footprint centre on the bay centre, turned `turn` radians and shifted `across` metres. */
function parkAt(d: Driver, id: StationId, across: number, turn = 0) {
  const bay = station(id).bay!;
  const h = rad(bay.axis_deg) + turn;
  const [ux, uy] = dir(rad(bay.axis_deg));
  const centre: Vec2 = [bay.centre[0] - uy * across, bay.centre[1] + ux * across];
  const [hx, hy] = dir(h);
  d.glide([centre[0] - hx * (L / 2), centre[1] - hy * (L / 2)], h, 1);
}

describe('assessment run', () => {
  it('drives all eight stations in order with no faults, and the verdict passes', () => {
    const d = assessment();
    for (const id of ORDER) {
      POSITIVE[id](d);
      expect(status(d, id), id).toBe('cleared');
    }
    expect(d.last.faults).toEqual([]);
    expect(d.last.ended).toBe(true);
    expect(d.last.verdict).toMatchObject({ pass: true, demerits: 0, failedStations: [] });
  });

  it('never passes with no input', () => {
    const d = assessment();
    d.stop(600);
    expect(d.last.verdict).toBeNull();
    expect(d.last.ended).toBe(false);
  });

  it('reports 3 s of top-down view in the verdict, at no cost', () => {
    const d = assessment();
    d.topDown = true;
    d.stop(3);
    d.topDown = false;
    for (const id of ORDER) POSITIVE[id](d);
    expect(d.last.verdict).toMatchObject({ pass: true, demerits: 0, topDownSeconds: 3 });
  });

  it('lists one fault of each kind, each with its basis, measured value and fix, and fails', () => {
    const d = assessment();
    d.kerbOverride = 1;                                   // a tyre on a kerb before the hill
    d.stop(0.2);
    d.kerbOverride = null;
    d.events.push({ type: 'obstacle-hit', kind: 'cone', index: 0, t: d.t + DT, at: d.at });
    d.tick();
    d.follow(HILL_STOP_S(), 8);                           // the hill: a good stop, then a 0.35 m rollback
    d.stop(2.5, true);
    d.rollBack(0.35);
    d.stop(0.5);
    d.follow(CREST() + 5, 8);
    sideReverseIn(d);                                     // side parking: touch a pole
    d.hitPole(0);
    d.tick();
    d.stop(1.5, true);
    d.rs = SIDE.inBay;
    d.follow(station('side-parking').s_to + 2, 8);
    const par = station('parallel-parking');              // parallel: done half a metre out into the lane
    parallelReverseIn(d);
    d.glide([d.at[0] + 0.5, d.at[1]], d.heading, 1);
    d.stop(1.5, true);
    d.arc(R_LOCK * PAR.phi, 4, -LOCK);
    d.arc(R_LOCK * PAR.phi, 4, LOCK);
    d.rs = sNear(d.at, par.s_from, par.s_to);
    d.follow(par.s_to + 2, 8);
    threePointDrive(d);
    sDrive(d, 25);                                        // the S at 25 km/h fails the station
    zDrive(d);
    rampDrive(d);
    mergeDrive(d);

    const v = d.last.verdict!;
    expect(v.pass).toBe(false);
    expect([...new Set(v.faults.map((f) => f.kind))].sort()).toEqual(['cone', 'kerb', 'not_in_bay', 'pole', 'rollback', 'station_failed']);
    expect(v.failedStations).toEqual(['hill-start', 'side-parking', 's-curve']);
    expect(v.demerits).toBe(5 + 5 + 20 + 20 + 10);
    for (const f of v.faults) {
      expect(f.basis.length, f.kind).toBeGreaterThan(0);
      expect(en[f.reasonKey as keyof typeof en], f.reasonKey).toBeTruthy();
      expect(ms[f.fixKey as keyof typeof ms], f.fixKey).toBeTruthy();
    }
    expect(v.faults.find((f) => f.kind === 'rollback')).toMatchObject({ measured: '0.35 m', limit: '0.30 m', station: 'hill-start' });
    expect(v.faults.find((f) => f.kind === 'not_in_bay')!.measured).toMatch(/^0\.\d\d m outside/);
  });

  it('ignores stations that are not current, then clears each in turn', () => {
    const d = assessment();
    const home = { at: [...d.at] as Vec2, heading: d.heading, rs: d.rs };
    d.rs = station('s-curve').s_from;                     // the S and the Z before the hill
    d.follow(station('s-curve').s_to + 2, 10);
    d.rs = station('z-curve').s_from;
    d.follow(station('z-curve').s_to + 2, 8);
    d.rs = SIDE.inBay;                                    // and 3 s in the side bay with the handbrake on
    d.follow(SIDE.inBay + 0.05, 2);
    d.stop(3, true);
    expect(d.last.faults).toEqual([]);
    expect(d.last.stations.every((st) => st.status === 'waiting')).toBe(true);
    d.at = home.at;
    d.heading = home.heading;
    d.rs = home.rs;
    d.stop(0.5);
    for (const id of ORDER) POSITIVE[id](d);
    expect(d.last.verdict).toMatchObject({ pass: true, demerits: 0 });
  });

  it('takes its thresholds from rules.json, not from code', () => {
    const loose = structuredClone(rules) as RulesData;
    (loose.demerits.rollback as { limit_m: number }).limit_m = 0.5;
    const d = new Driver(createSession(circuit, loose, swift, 'practice', 'hill-start'), { at: station('hill-start').start.at, heading: 0 }, sNear(station('hill-start').start.at, 0, 10));
    d.follow(HILL_STOP_S(), 8);
    d.stop(2.5, true);
    d.rollBack(0.4);
    d.stop(0.5);
    d.follow(CREST() + 5, 8);
    expect(d.last.demerits).toBe(0);
    expect(status(d, 'hill-start')).toBe('cleared');
  });
});

describe('hill start', () => {
  it('clears: a stop on the band, a held handbrake, no rollback', () => {
    const d = drill('hill-start');
    hillDrive(d);
    expect(status(d, 'hill-start')).toBe('cleared');
    expect(d.last.faults).toEqual([]);
  });

  it('fails when driven over without stopping', () => {
    const d = drill('hill-start');
    d.follow(CREST() + 5, 8);
    expect(status(d, 'hill-start')).toBe('failed');
    expect(reasons(d)).toEqual(['sim.fault.hill.noStop']);
  });

  it('fails a stop on the band without the handbrake', () => {
    const d = drill('hill-start');
    d.follow(HILL_STOP_S(), 8);
    d.stop(3, false);
    d.follow(CREST() + 5, 8);
    expect(status(d, 'hill-start')).toBe('failed');
  });

  it('fails a stop short of the band', () => {
    const d = drill('hill-start');
    d.follow(HILL_STOP_S() - 0.5, 8);
    d.stop(3, true);
    d.follow(CREST() + 5, 8);
    expect(status(d, 'hill-start')).toBe('failed');
  });

  it.each([[1.95, 'failed'], [2.0, 'cleared'], [2.05, 'cleared']])('a %s s hold: %s', (secs, want) => {
    const d = drill('hill-start');
    d.follow(HILL_STOP_S(), 8);
    d.stop(secs, true);
    d.follow(CREST() + 5, 8);
    expect(status(d, 'hill-start')).toBe(want);
  });

  it.each([[0.04, 'cleared'], [0.06, 'failed']])('creeping %s m during the hold: %s', (dist, want) => {
    const d = drill('hill-start');
    d.follow(HILL_STOP_S() - 0.02, 8);
    d.stop(1, true);
    creep(d, dist);
    d.stop(1.2, true);
    d.follow(CREST() + 5, 8);
    expect(status(d, 'hill-start')).toBe(want);
  });

  it.each([[0.29, 0], [0.3, 0], [0.31, 20]])('rolling back %s m costs %s', (dist, points) => {
    const d = drill('hill-start');
    d.follow(HILL_STOP_S(), 8);
    d.stop(2.5, true);
    d.rollBack(dist);
    d.stop(0.5);
    d.follow(CREST() + 5, 8);
    expect(d.last.demerits).toBe(points);
    expect(status(d, 'hill-start')).toBe(points ? 'failed' : 'cleared');
  });

  it('fails when its 3 minutes run out', () => {
    const d = drill('hill-start');
    d.follow(HILL_STOP_S(), 8);
    d.stop(181);
    expect(status(d, 'hill-start')).toBe('failed');
    expect(reasons(d)).toEqual(['sim.fault.time']);
  });
});

describe('side parking', () => {
  const S_TO = () => station('side-parking').s_to;

  it('clears: reversed in, the handbrake as "done", driven out', () => {
    const d = drill('side-parking');
    sideDrive(d);
    expect(status(d, 'side-parking')).toBe('cleared');
    expect(d.last.faults).toEqual([]);
    expect(d.stationState('side-parking').detail.inBay).toBe(true);
  });

  // half the mirror width is 0.9235 m in a 2.6 m bay: 0.3765 m off centre puts a mirror on the line
  it.each([[0.36, 0], [0.3765, 0], [0.4, 10], [0.5, 10]])('parked %s m off centre costs %s, and still counts as done', (across, points) => {
    const d = drill('side-parking');
    sideReverseIn(d);
    parkAt(d, 'side-parking', across);
    d.stop(1.5, true);
    d.rs = SIDE.inBay;
    d.follow(S_TO() + 2, 8);
    expect(d.last.demerits).toBe(points);
    expect(status(d, 'side-parking')).toBe('cleared');
  });

  it.each([[-0.3, 0], [3, 10]])('parked %s° from the heading limit costs %s', (delta, points) => {
    const d = drill('side-parking');
    const limit = toDeg(bayHeadingLimit(swift.length_m, swift.width_mirrors_m, station('side-parking').bay!.width));
    sideReverseIn(d);
    parkAt(d, 'side-parking', 0, rad(limit + delta));
    d.stop(1.5, true);
    expect(d.last.demerits).toBe(points);
  });

  it('costs 20 and fails when a pole is touched', () => {
    const d = drill('side-parking');
    sideReverseIn(d);
    d.hitPole(0);
    d.tick();
    expect(status(d, 'side-parking')).toBe('failed');
    expect(d.last.faults.map((f) => [f.kind, f.points])).toEqual([['pole', 20]]);
  });

  it.each([[0.98, 'failed'], [1.0, 'cleared']])('a %s s handbrake stop in the bay: %s', (secs, want) => {
    const d = drill('side-parking');
    sideReverseIn(d);
    d.stop(secs, true);
    d.rs = SIDE.inBay;
    d.follow(S_TO() + 2, 8);
    expect(status(d, 'side-parking')).toBe(want);
  });

  it('fails when driven out without the "done" signal', () => {
    const d = drill('side-parking');
    sideReverseIn(d);
    d.rs = SIDE.inBay;
    d.follow(S_TO() + 2, 8);
    expect(reasons(d)).toEqual(['sim.fault.passed']);
  });

  it('fails when its 5 minutes run out', () => {
    const d = drill('side-parking');
    d.follow(SIDE.preJump, 8);
    d.stop(301);
    expect(reasons(d)).toEqual(['sim.fault.time']);
  });
});

describe('parallel parking', () => {
  it('clears: two full-lock reverse arcs into the painted box', () => {
    const d = drill('parallel-parking');
    parallelDrive(d);
    expect(status(d, 'parallel-parking')).toBe('cleared');
    expect(d.last.faults).toEqual([]);
  });

  it('costs 10 when done half a metre out into the lane', () => {
    const d = drill('parallel-parking');
    parallelReverseIn(d);
    parkAt(d, 'parallel-parking', -0.5);
    d.stop(1.5, true);
    expect(d.last.faults.map((f) => f.kind)).toEqual(['not_in_bay']);
  });
});

describe('three-point turn', () => {
  const into = (d: Driver) => d.follow(TPT.preJump, 6);
  const turns = (d: Driver, first: number, second: number) => {
    d.arc(R_LOCK * rad(first), 5, -LOCK);
    d.stop(0.5);
    d.arc(-R_LOCK * rad(second), -4, LOCK);
    d.stop(0.5);
  };

  it('clears on the third movement', () => {
    const d = drill('three-point-turn');
    threePointDrive(d);
    expect(status(d, 'three-point-turn')).toBe('cleared');
    expect(d.stationState('three-point-turn').detail.movements).toBe(3);
    expect(d.last.faults).toEqual([]);
  });

  it('never clears in one arc', () => {
    const d = drill('three-point-turn');
    into(d);
    d.arc(R_LOCK * Math.PI, 5, -LOCK);                     // a U-turn: over the kerb and onto the grass
    const back = routePose(TPT.rejoin);
    d.glide(back.at, back.heading, 5);
    d.rs = TPT.rejoin;
    d.follow(station('three-point-turn').s_to + 2, 8);
    expect(status(d, 'three-point-turn')).toBe('failed');
    expect(reasons(d)).toContain('sim.fault.passed');
    expect(d.stationState('three-point-turn').detail.movements).toBe(1);
  });

  it('fails when a fourth movement starts', () => {
    const d = drill('three-point-turn');
    into(d);
    turns(d, 40, 30);
    d.arc(R_LOCK * rad(30), 4, -LOCK);
    d.stop(0.5);
    d.arc(-0.5, -4, 0);
    expect(reasons(d)).toEqual(['sim.fault.threePoint.fourth']);
  });

  it.each([[0.29, 1], [0.31, 2]])('a %s m reverse counts as %s movement(s)', (dist, n) => {
    const d = drill('three-point-turn');
    into(d);
    d.stop(0.3);
    d.arc(-dist, -3, 0);
    d.stop(0.3);
    expect(d.stationState('three-point-turn').detail.movements).toBe(n);
  });

  it.each([[7, 'armed'], [9, 'cleared']])('turning %s° more after 140°: %s', (third, want) => {
    const d = drill('three-point-turn');
    into(d);
    turns(d, 70, 70);
    d.arc(R_LOCK * rad(third), 4, -LOCK);
    expect(status(d, 'three-point-turn')).toBe(want);
  });

  it('waits for creep pace: turned round at 7 km/h, it clears once at 6', () => {
    const d = drill('three-point-turn');
    into(d);
    turns(d, 70, 70);
    d.arc(R_LOCK * rad(40), 7, -LOCK);
    expect(status(d, 'three-point-turn')).toBe('armed');
    d.kmh = 6;
    d.tick();
    expect(status(d, 'three-point-turn')).toBe('cleared');
  });

  it('fails when its 3 minutes run out', () => {
    const d = drill('three-point-turn');
    into(d);
    d.stop(181);
    expect(reasons(d)).toEqual(['sim.fault.time']);
  });
});

describe('S-curve', () => {
  const ENTRY = () => gateS('s-curve', 'entry');

  it('clears at 10 km/h, and at 18, the top of the band', () => {
    for (const kmh of [10, 18]) {
      const d = drill('s-curve');
      sDrive(d, kmh);
      expect(status(d, 's-curve'), `${kmh}`).toBe('cleared');
    }
  });

  it('fails at 25 km/h in an assessment', () => {
    const d = drill('s-curve', 'assessment');
    sDrive(d, 25);
    expect(reasons(d)).toEqual(['sim.fault.s.speed']);
  });

  it('voids a 25 km/h attempt in practice, and the restarted drill clears', () => {
    const d = drill('s-curve');
    d.follow(ENTRY() + 2, 10);
    d.follow(ENTRY() + 12, 25);
    expect(status(d, 's-curve')).toBe('waiting');
    expect(d.stationState('s-curve').detail.voids).toBe(1);
    d.follow(station('s-curve').s_to + 2, 10);
    expect(status(d, 's-curve')).toBe('waiting');        // nothing arms until the restart
    const start = d.session.restartStation('s-curve');
    d.at = [...start.at] as Vec2;
    d.heading = start.heading;
    d.rs = sNear(start.at, station('s-curve').s_from - 12, station('s-curve').s_from);
    sDrive(d, 10);
    expect(status(d, 's-curve')).toBe('cleared');
  });

  it.each([[1.1, 'cleared'], [1.3, 'failed']])('%s s at 19 km/h inside the S: %s', (secs, want) => {
    const d = drill('s-curve', 'assessment');
    d.follow(ENTRY() + 3, 10);
    d.follow(ENTRY() + 3 + (19 / 3.6) * secs, 19);
    sDrive(d, 10);
    expect(status(d, 's-curve')).toBe(want);
  });

  it('fails a stop of more than 1.2 s inside the S', () => {
    const d = drill('s-curve', 'assessment');
    d.follow(ENTRY() + 3, 10);
    d.stop(1.5);
    sDrive(d, 10);
    expect(reasons(d)).toEqual(['sim.fault.s.speed']);
  });

  it('fails when its 3 minutes run out before the entry gate', () => {
    const d = drill('s-curve');
    d.follow(station('s-curve').s_from + 1, 8);
    d.stop(181);
    expect(reasons(d)).toEqual(['sim.fault.time']);
  });
});

describe('Z-curve', () => {
  it('clears at 8, 10 and 12 km/h', () => {
    for (const kmh of [8, 10, 12]) {
      const d = drill('z-curve');
      zDrive(d, kmh);
      expect(status(d, 'z-curve'), `${kmh}`).toBe('cleared');
    }
  });

  it('does not clear at 15 km/h: the corner gate waits, and the car drives past', () => {
    const d = drill('z-curve', 'assessment');
    zDrive(d, 15);
    expect(reasons(d)).toEqual(['sim.fault.passed']);
  });

  it('a corner taken at 12.5 km/h waits until the car slows', () => {
    const d = drill('z-curve');
    const c1 = gateS('z-curve', 'corner-1');
    d.follow(c1 - 1, 8);
    d.follow(c1 + 0.5, 12.5);
    expect(d.stationState('z-curve').detail.waiting).toBe(true);
    zDrive(d, 8);
    expect(status(d, 'z-curve')).toBe('cleared');
  });

  it('fails when its 3 minutes run out', () => {
    const d = drill('z-curve');
    d.follow(station('z-curve').s_from + 1, 8);
    d.stop(181);
    expect(reasons(d)).toEqual(['sim.fault.time']);
  });
});

describe('ramp test', () => {
  it('clears: up, stop 0.6 m short of the pole, hold, reverse out', () => {
    const d = drill('ramp-test');
    rampDrive(d);
    expect(status(d, 'ramp-test')).toBe('cleared');
    expect(d.last.faults).toEqual([]);
  });

  it.each([[0.15, 'failed'], [0.19, 'failed'], [0.2, 'cleared'], [1.0, 'cleared'], [1.01, 'failed'], [1.1, 'failed']])(
    'stopping %s m short of the pole: %s', (gap, want) => {
      const d = drill('ramp-test', 'assessment');
      rampIn(d, gap);
      d.stop(2.5);
      rampOut(d);
      d.follow(station('ramp-test').s_to + 2, 8);
      expect(status(d, 'ramp-test')).toBe(want);
    });

  it('a stop outside the window, then driving on, fails with the gap it measured against the window', () => {
    const d = drill('ramp-test', 'assessment');
    rampIn(d, 1.6);
    d.stop(2.5);
    rampOut(d);
    d.follow(station('ramp-test').s_to + 2, 8);
    expect(status(d, 'ramp-test')).toBe('failed');
    expect(d.last.faults.find((f) => f.station === 'ramp-test')).toMatchObject({
      kind: 'station_failed', reasonKey: 'sim.fault.ramp.window', fixKey: 'sim.fix.ramp.window', measured: '1.60 m', limit: '0.2-1.0 m',
    });
  });

  it('costs 20 and fails when the pole is touched', () => {
    const d = drill('ramp-test');
    rampIn(d);
    d.hitPole(circuit.obstacles.poles.findIndex((p) => p.station === 'ramp-test'));
    d.tick();
    expect(status(d, 'ramp-test')).toBe('failed');
    expect(d.last.faults.map((f) => [f.kind, f.points])).toEqual([['pole', 20]]);
  });

  it('costs 20 for a 0.31 m rollback on the slope', () => {
    const d = drill('ramp-test');
    const g = station('ramp-test');
    d.follow(sNear([g.start.at[0], g.axis!.start[1] - R_LOCK], g.s_from - 3, g.s_to), 6);
    d.arc(R_LOCK * (Math.PI / 2), 5, -LOCK);
    d.arc(g.axis!.start[0] + 3 - d.at[0], 5, 0);        // 3 m up the slope
    d.stop(1);
    d.rollBack(0.31);
    d.stop(0.5);
    expect(d.last.faults.map((f) => [f.kind, f.points, f.measured])).toEqual([['rollback', 20, '0.31 m']]);
  });

  it('fails when its 5 minutes run out', () => {
    const d = drill('ramp-test');
    d.follow(station('ramp-test').s_from + 1, 8);
    d.stop(301);
    expect(reasons(d)).toEqual(['sim.fault.time']);
  });
});

describe('road merging', () => {
  it.each([[14.9, 'failed'], [15, 'cleared'], [20, 'cleared']])('crossing the finish at %s km/h in an assessment: %s', (kmh, want) => {
    const d = drill('road-merging', 'assessment');
    mergeDrive(d, kmh);
    expect(status(d, 'road-merging')).toBe(want);
  });

  it('lets the learner retry a slow finish in practice', () => {
    const d = drill('road-merging');
    mergeDrive(d, 10);
    expect(status(d, 'road-merging')).toBe('waiting');
    expect(d.stationState('road-merging').detail.voids).toBe(1);
    const start = d.session.restartStation('road-merging');
    const g = station('road-merging');
    d.at = [...start.at] as Vec2;
    d.heading = start.heading;
    d.rs = sNear(start.at, g.s_from - 12, g.s_from);
    mergeDrive(d, 20);
    expect(status(d, 'road-merging')).toBe('cleared');
  });
});

describe('kerbs', () => {
  const touch = (d: Driver, ring: number, secs: number) => {
    d.kerbOverride = ring;
    d.stop(secs);
    d.kerbOverride = null;
  };
  const kerbFaults = (d: Driver) => d.last.faults.filter((f) => f.kind === 'kerb').length;

  it('counts one contact once; a new one only after 0.5 s clear of that kerb', () => {
    const d = drill('z-curve');
    touch(d, 7, 0.2);
    d.stop(0.4);
    touch(d, 7, 0.2);
    expect(kerbFaults(d)).toBe(1);
    d.stop(0.5);
    touch(d, 7, 0.2);
    expect(kerbFaults(d)).toBe(2);
    touch(d, 8, 0.2);
    expect(kerbFaults(d)).toBe(3);
    expect(d.last.demerits).toBe(15);
  });
});

describe('practice drills', () => {
  it('restartStation returns the start pose and a fresh attempt; nothing reloads', () => {
    const d = drill('hill-start');
    d.follow(CREST() + 5, 8);
    expect(status(d, 'hill-start')).toBe('failed');
    const g = station('hill-start');
    const start = d.session.restartStation('hill-start');
    expect(start).toEqual({ at: g.start.at, heading: rad(g.start.heading_deg) });
    expect(d.session.state()).toMatchObject({ ended: false, demerits: 0, faults: [], current: 'hill-start' });
    d.at = [...start.at] as Vec2;
    d.heading = start.heading;
    d.rs = sNear(start.at, g.s_from - 12, g.s_from);
    hillDrive(d);
    expect(status(d, 'hill-start')).toBe('cleared');
    const z = d.session.restartStation('z-curve');
    expect(z.at).toEqual(station('z-curve').start.at);
    expect(d.session.state().stations.map((st) => st.id)).toEqual(['z-curve']);
  });

  it('refuses restartStation in an assessment', () => {
    expect(() => assessment().session.restartStation('hill-start')).toThrow();
  });
});
