// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { SessionState } from './contracts';
import { expandSimRuns, FULL_CIRCUIT, runRecord, SIM_RUN_SCHEMA } from './record';

const state: SessionState = {
  mode: 'assessment',
  current: null,
  stations: [
    { id: 'hill-start', status: 'cleared', startedAt: 1, timeLimitS: 180, detail: {} },
    { id: 'side-parking', status: 'failed', startedAt: 40, timeLimitS: 300, detail: {} },
    { id: 'parallel-parking', status: 'waiting', startedAt: null, timeLimitS: 300, detail: {} },
  ],
  demerits: 20,
  faults: [{ kind: 'rollback', station: 'hill-start', points: 20, at: [0, 0], t: 9, measured: '0.34 m', limit: '0.30 m', reasonKey: 'sim.fault.rollback', fixKey: 'sim.fix.rollback', basis: 'x' }],
  ended: true,
  topDownSeconds: 12,
  verdict: { pass: false, demerits: 20, failedStations: ['side-parking'], faults: [], topDownSeconds: 12 },
};
state.verdict!.faults = state.faults;

describe('an assessment run as a results row', () => {
  it('is one versioned record under the run\'s own id', () => {
    const r = runRecord({ id: 'b9d0c2a4-0000-4000-8000-000000000001', userId: 'u1', language: 'ms', state, seconds: 412.6, rulesLabel: 'label', car: 'Swift' });
    expect(r).toMatchObject({
      id: 'b9d0c2a4-0000-4000-8000-000000000001', user_id: 'u1', maneuver_id: FULL_CIRCUIT, mode: 'assessment',
      score: 33, errors: 1, passed: false, completion_seconds: 413, rollback_cm: 34, language: 'ms',
    });
    expect(r.attempt_data).toMatchObject({ schema: SIM_RUN_SCHEMA, verdict: state.verdict });
  });

  it('refuses a run without a verdict', () => {
    expect(() => runRecord({ id: 'x', userId: 'u', language: 'en', state: { ...state, verdict: null }, seconds: 1, rulesLabel: '', car: '' })).toThrow();
  });

  it('reads back per station for the analytics; older rows pass through', () => {
    const run = runRecord({ id: 'id', userId: 'u1', language: 'en', state, seconds: 1, rulesLabel: '', car: '' });
    const old = { maneuver_id: 'z-curve', score: 80, attempt_data: { type: '3d_sim' } };
    const rows = expandSimRuns([run as { maneuver_id: string; score: number; attempt_data?: unknown }, old]);
    expect(rows.map((r) => [r.maneuver_id, r.score])).toEqual([['hill-start', 100], ['side-parking', 0], ['z-curve', 80]]);
  });
});
