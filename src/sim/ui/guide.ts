// The practice guide's brain: which of a station's steps the learner is on, from what the car is doing and what the
// rules report for the station (its `detail`). A step is done when its condition holds; the page keeps the highest
// step reached, so a step never comes back. Stations whose steps repeat on every bend or have no signal of their own
// follow the learner's progress through the station instead. The last step ends when the station does.
import type { StationId } from '../contracts';

export interface Signals {
  /** km/h, positive forward. */
  speed: number;
  gear: 'D' | 'R';
  handbrake: boolean;
  /** The steering input: +1 full left, -1 full right. */
  wheel: number;
  /** The car has been driven since the drill began. */
  moved: boolean;
  /** The rules' own readings for the station (hold timer, bay, ramp window). */
  detail: Record<string, unknown>;
  /** How far through the station the car is, 0 to 1. */
  along: number;
}

type Done = (s: Signals) => boolean;

const stopped: Done = (s) => Math.abs(s.speed) < 0.5;
const reversing: Done = (s) => s.gear === 'R' && s.speed < -0.3;
const held: Done = (s) => s.detail.held === true;
const committed: Done = (s) => s.detail.inBay !== undefined;   // the 1 s handbrake stop inside the bay was made

const PULLED_AWAY: Done = (s) => held(s) && !s.handbrake && s.speed > 0.3;

/** The condition that finishes each step, in order, apart from the last, which the station's end finishes. */
const STEPS: Partial<Record<StationId, Done[]>> = {
  'hill-start': [(s) => s.detail.onBand === true, (s) => s.detail.onBand === true && stopped(s), held, PULLED_AWAY],
  'side-parking': [(s) => s.moved, (s) => s.moved && stopped(s), (s) => reversing(s) && s.wheel < -0.5, (s) => reversing(s) && s.wheel > -0.25, committed],
  'parallel-parking': [(s) => s.moved && stopped(s), (s) => reversing(s) && s.wheel > 0.5, (s) => reversing(s) && s.wheel < -0.5, committed],
  'ramp-test': [(s) => s.moved && Number(s.detail.gapM ?? Infinity) < 15, (s) => Number(s.detail.heldS ?? 0) > 0, held, PULLED_AWAY],
};

/** `done` steps are behind the learner; this is how many are, now. Never fewer than before, never past the last step. */
export function advance(id: StationId, count: number, done: number, s: Signals): number {
  const last = count - 1;
  const rules = STEPS[id];
  if (!rules) return Math.max(done, Math.min(last, Math.floor(s.along * count)));
  let n = done;
  while (n < last && rules[n]?.(s)) n += 1;
  return n;
}
