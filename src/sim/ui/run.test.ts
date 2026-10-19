// @vitest-environment node
// The run store, driven the way the page drives it: every step through useRun.step, by the kinematic driver.
import { describe, expect, it } from 'vitest';
import type { Session, StationId } from '../contracts';
import { Driver, POSITIVE, sNear, station } from '../core/testkit';
import { circuit } from '../data';
import { type Pose, useRun } from './run';

const ORDER = [...circuit.stations].sort((a, b) => a.order - b.order).map((g) => g.id);

/** A session that is really the run store: what SwiftCar's onStep does on the page. */
const viaRun: Session = {
  step: (sample, events, dt, topDown) => {
    useRun.getState().step(sample, events, dt, topDown);
    return useRun.getState().state;
  },
  restartStation: () => { throw new Error('the page restarts through useRun.begin'); },
  state: () => useRun.getState().state,
};

function driverAt(pose: Pose, near: [number, number]) {
  const d = new Driver(viaRun, pose, sNear(pose.at, near[0], near[1]));
  d.last = useRun.getState().state;
  return d;
}

const drillDriver = (id: StationId, pose: Pose) => driverAt(pose, [station(id).s_from - 12, station(id).s_from]);

describe('the run', () => {
  it('an assessment: every station clears, the verdict passes and reports the top-down seconds', () => {
    const pose = useRun.getState().begin('assessment');
    expect(pose.at).toEqual(circuit.spawn.at);
    const d = driverAt(pose, [0, 5]);
    for (const id of ORDER) {
      d.topDown = id === 's-curve';
      POSITIVE[id](d);
    }
    const { state, elapsed } = useRun.getState();
    expect(state.verdict).toMatchObject({ pass: true, demerits: 0, failedStations: [] });
    expect(state.verdict!.topDownSeconds).toBeGreaterThan(1);
    expect(state.verdict!.topDownSeconds).toBeCloseTo(state.topDownSeconds, 1);   // the verdict keeps one decimal
    expect(elapsed).toBeGreaterThan(60);
  });

  it('practice: the car goes to the station\'s start, the top-down view works there too, and a restart is a fresh run', () => {
    const pose = useRun.getState().begin('practice', 'side-parking');
    expect(pose.at).toEqual(station('side-parking').start.at);
    expect(useRun.getState().state.mode).toBe('practice');
    const first = useRun.getState().runId;
    const d = drillDriver('side-parking', pose);
    d.topDown = true;
    d.stop(2);
    expect(useRun.getState().state.topDownSeconds).toBeGreaterThan(1.8);
    useRun.getState().restart();
    expect(useRun.getState().runId).not.toBe(first);
    expect(useRun.getState().state.topDownSeconds).toBe(0);
    expect(useRun.getState().toasts).toEqual([]);
  });

  it('one toast per kerb contact, however long the tyre stays on it', () => {
    const pose = useRun.getState().begin('assessment');
    const d = driverAt(pose, [0, 5]);
    d.stop(0.2);
    d.kerbOverride = 0;
    d.stop(1.5);
    expect(useRun.getState().toasts).toHaveLength(1);
    expect(useRun.getState().toasts[0].fault.kind).toBe('kerb');
    d.kerbOverride = null;
    d.stop(1);           // off the kerb for longer than its 0.5 s clear time
    d.kerbOverride = 0;
    d.stop(0.3);
    expect(useRun.getState().toasts).toHaveLength(2);
  });
});
