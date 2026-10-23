// The run: one rules session at a time, fed by the car every physics step and published to the screens.
// The session lives outside React. The screens see a snapshot about ten times a second, and at once
// whenever a station, a fault or the verdict changes.
import { create } from 'zustand';
import { generateUUID } from '@/services/offlineQueue';
import type { Fault, Mode, Session, SessionState, SimEvent, StationId, Vec2, VehicleSample } from '../contracts';
import { createSession } from '../core/session';
import { circuit, rules, swift } from '../data';
import { rad } from '../geom';

export interface Pose { at: Vec2; heading: number }
export interface Toast { id: number; fault: Fault }

interface RunStore {
  mode: Mode;
  drill: StationId;
  /** A fresh UUID per run: the saved result's id, so a run can only ever insert one row. */
  runId: string;
  state: SessionState;
  /** The car's clock at the latest snapshot, seconds; the stations' startedAt use it. Paused time never counts. */
  t: number;
  /** Seconds since this run began. */
  elapsed: number;
  toasts: Toast[];
  /** performance.now() of the newest fault, for the camera kick. */
  lastFaultAt: number;
  /** Start a run (practice: one station) and say where the car goes. */
  begin(mode: Mode, drill?: StationId): Pose;
  /** The same run again, from its start. */
  restart(): Pose;
  step(sample: VehicleSample, events: SimEvent[], dt: number, topDown: boolean): void;
  dismiss(id: number): void;
}

const PUBLISH_S = 0.1;
const MAX_TOASTS = 3;

let session: Session = createSession(circuit, rules, swift, 'assessment');
let publishedAt = -Infinity;
let t0: number | null = null;
let shown = '';
let toastId = 0;

/** What the screens must see the moment it changes. */
const signature = (s: SessionState) =>
  `${s.current}|${s.stations.map((x) => `${x.status}${x.detail.voids ?? ''}`).join(',')}|${s.faults.length}|${s.ended}`;

export const spawnPose = (): Pose => ({ at: circuit.spawn.at, heading: rad(circuit.spawn.heading_deg) });

export const useRun = create<RunStore>((set, get) => ({
  mode: 'assessment',
  drill: 'hill-start',
  runId: generateUUID(),
  state: session.state(),
  t: 0,
  elapsed: 0,
  toasts: [],
  lastFaultAt: -Infinity,

  begin(mode, drill = get().drill) {
    session = createSession(circuit, rules, swift, mode, mode === 'practice' ? drill : undefined);
    const pose = mode === 'practice' ? session.restartStation(drill) : spawnPose();
    publishedAt = -Infinity;
    shown = '';
    t0 = null;
    set({ mode, drill, runId: generateUUID(), state: session.state(), t: 0, elapsed: 0, toasts: [] });
    return pose;
  },

  restart() {
    return get().begin(get().mode, get().drill);
  },

  step(sample, events, dt, topDown) {
    t0 ??= sample.t - dt;
    const s = session.step(sample, events, dt, topDown);
    const sig = signature(s);
    if (sig === shown && sample.t - publishedAt < PUBLISH_S) return;
    const fresh = s.faults.slice(get().state.faults.length);
    shown = sig;
    publishedAt = sample.t;
    set(fresh.length
      ? { state: s, t: sample.t, elapsed: sample.t - t0, toasts: [...get().toasts, ...fresh.map((fault) => ({ id: ++toastId, fault }))].slice(-MAX_TOASTS), lastFaultAt: performance.now() }
      : { state: s, t: sample.t, elapsed: sample.t - t0 });
  },

  dismiss(id) {
    set({ toasts: get().toasts.filter((x) => x.id !== id) });
  },
}));
