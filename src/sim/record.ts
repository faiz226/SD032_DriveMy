// An assessment run as one versioned results row, and how the analytics read it back per station.
// Types only, so the analytics can import it without pulling in the simulator.
import type { InsertSimulationResult } from '@/types/database';
import type { SessionState, StationId } from './contracts';

export const SIM_RUN_SCHEMA = 'drivemy.simrun/1';
/** maneuver_id of a whole assessment run: all seven stations in one record. */
export const FULL_CIRCUIT = 'full-circuit';

interface RunRecordInput {
  id: string;               // the run's UUID: the row's id, so retries and syncs insert it once
  userId: string;
  language: 'en' | 'ms';
  state: SessionState;      // must carry a verdict
  seconds: number;          // the run's clock, paused time excluded
  rulesLabel: string;
  car: string;
}

export function runRecord({ id, userId, language, state, seconds, rulesLabel, car }: RunRecordInput): InsertSimulationResult {
  const v = state.verdict;
  if (!v) throw new Error('runRecord: the run has no verdict yet');
  const cleared = state.stations.filter((s) => s.status === 'cleared').length;
  const rollbackM = Math.max(0, ...v.faults.filter((f) => f.kind === 'rollback').map((f) => parseFloat(f.measured ?? '') || 0));
  return {
    id,
    user_id: userId,
    maneuver_id: FULL_CIRCUIT,
    mode: 'assessment',
    score: Math.round((100 * cleared) / state.stations.length),
    errors: v.faults.length,
    passed: v.pass,
    completion_seconds: Math.round(seconds),
    stall_count: 0,
    rollback_cm: Math.round(rollbackM * 100),
    language,
    attempt_data: {
      schema: SIM_RUN_SCHEMA,
      rules: rulesLabel,
      car,
      verdict: v,
      stations: state.stations.map((s) => ({ id: s.id, status: s.status, detail: s.detail })),
    },
  };
}

interface SimRow { maneuver_id: string; score: number; passed?: boolean; attempt_data?: unknown }

/**
 * Rows as the per-manoeuvre analytics expect them. Older rows pass through; a v2 run becomes one row per
 * station it reached: 100 when cleared, 0 when failed. A station never reached is not counted.
 */
export function expandSimRuns<T extends SimRow>(rows: T[]): T[] {
  return rows.flatMap((r) => {
    const d = r.attempt_data as { schema?: unknown; stations?: { id: StationId; status: string }[] } | null | undefined;
    if (d?.schema !== SIM_RUN_SCHEMA || !Array.isArray(d.stations)) return [r];
    return d.stations
      .filter((s) => s.status === 'cleared' || s.status === 'failed')
      .map((s) => ({ ...r, maneuver_id: s.id, score: s.status === 'cleared' ? 100 : 0, passed: s.status === 'cleared' }));
  });
}
