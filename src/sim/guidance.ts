// What the yard tells a learner without words: where the first move goes (a lit board over the road at the spawn), where
// the road turns (yellow and black chevron boards, as on a Malaysian bend) and where it is closed (a glowing barrier
// strip with X markers). Pure data and geometry in the circuit frame, no three.js, so tests can check it headlessly.
import type { CircuitData, Vec2 } from './contracts';
import { dir, onPavement, rad, wrapPi } from './geom';
import guidanceJson from '../../docs/circuit-v2/guidance.json';

export interface BarrierSpec { a: Vec2; b: Vec2; note: string }
export const BARRIERS = (guidanceJson as unknown as { barriers: BarrierSpec[] }).barriers;

export type CueKind = 'left' | 'right' | 'ahead';
export interface Gantry { at: Vec2; heading: number; width: number; kind: CueKind }
export interface Chevron { at: Vec2; /** the way the board's face points: towards the driver, a heading in radians */ face: number; kind: 'left' | 'right' }

const samples = (c: CircuitData) => c.route.samples;

function nearest(c: CircuitData, p: Vec2): number {
  let best = 0;
  let d = Infinity;
  samples(c).forEach((s, i) => {
    const e = Math.hypot(s[1] - p[0], s[2] - p[1]);
    if (e < d) { d = e; best = i; }
  });
  return best;
}

function at(c: CircuitData, s: number) {
  const list = samples(c);
  const i = list.findIndex((q) => q[0] >= s);
  return list[i < 0 ? list.length - 1 : i];
}

/** Where a car standing at `pose` has to go first: straight on, or round a bend that starts within about 12 m. */
export function firstMove(c: CircuitData, pose: { at: Vec2; heading: number }): { kind: CueKind; turn: number; s: number } {
  const s0 = samples(c)[nearest(c, pose.at)][0];
  const turn = wrapPi(rad(at(c, s0 + 12)[3]) - pose.heading);   // positive: to the left
  const kind: CueKind = Math.abs(turn) < rad(25) ? 'ahead' : turn > 0 ? 'left' : 'right';
  return { kind, turn, s: s0 };
}

/** How far a learner's head starts turned towards the first move, radians (left is positive); 0 when it is straight on. */
export function spawnLookYaw(c: CircuitData, pose: { at: Vec2; heading: number }): number {
  const { kind, turn } = firstMove(c, pose);
  if (kind === 'ahead') return 0;
  return Math.sign(turn) * Math.min(0.75, (Math.abs(turn) / rad(90)) * 0.75);
}

/** Every pose a run can start from: the assessment spawn and each station's practice start. */
export const startPoses = (c: CircuitData) => [
  { at: c.spawn.at, heading: rad(c.spawn.heading_deg) },
  ...c.stations.map((g) => ({ at: g.start.at, heading: rad(g.start.heading_deg) })),
];

const GANTRY_AHEAD_M = 11;

/** One lit board over the road, ahead of each start; two starts close together share one. */
export function planGantries(c: CircuitData): Gantry[] {
  const out: Gantry[] = [];
  for (const pose of startPoses(c)) {
    const { kind, s } = firstMove(c, pose);
    const q = at(c, s + GANTRY_AHEAD_M);
    const g: Gantry = { at: [q[1], q[2]], heading: rad(q[3]), width: q[4], kind };
    if (out.some((o) => Math.hypot(o.at[0] - g.at[0], o.at[1] - g.at[1]) < 6)) continue;
    out.push(g);
  }
  return out;
}

const BEND_DEG = 35;       // a bend turns the heading this much within BEND_WINDOW_M
const BEND_WINDOW_M = 10;
const BOARDS_PER_BEND = 2;

/** Yellow and black chevron boards round every bend of the route, on whichever side of it is off the paving. */
export function planChevrons(c: CircuitData): Chevron[] {
  const list = samples(c);
  const out: Chevron[] = [];
  let i = 0;
  while (i < list.length - 1) {
    const j = list.findIndex((q) => q[0] >= list[i][0] + BEND_WINDOW_M);
    if (j < 0) break;
    const turn = wrapPi(rad(list[j][3]) - rad(list[i][3]));
    if (Math.abs(turn) < rad(BEND_DEG)) { i += 1; continue; }
    // the bend runs on until the heading stops changing
    let end = j;
    for (;;) {
      const k = list.findIndex((q) => q[0] >= list[end][0] + 2);
      if (k < 0) break;
      const step = wrapPi(rad(list[k][3]) - rad(list[end][3]));
      if (Math.abs(step) < rad(2) || Math.sign(step) !== Math.sign(turn)) break;
      end = k;
    }
    for (let n = 1; n <= BOARDS_PER_BEND; n++) {
      const k = Math.round(i + ((end - i) * n) / (BOARDS_PER_BEND + 1));
      const q = list[k];
      // which way the road turns right here (about 6 m either side), so an S curve's two bends each get their own way
      const local = wrapPi(rad(list[Math.min(list.length - 1, k + 24)][3]) - rad(list[Math.max(0, k - 24)][3]));
      if (Math.abs(local) < rad(10)) continue;
      const kind = local > 0 ? 'left' : 'right';
      const [tx, ty] = dir(rad(q[3]));
      const left: Vec2 = [-ty, tx];
      // the outside of the bend first (a driver steers away from it), else the inside
      for (const side of [kind === 'left' ? -1 : 1, kind === 'left' ? 1 : -1]) {
        const reach = q[4] / 2 + 0.9;
        const p: Vec2 = [q[1] + left[0] * side * reach, q[2] + left[1] * side * reach];
        if (onPavement(c, p) || onPavement(c, [q[1] + left[0] * side * (reach + 0.8), q[2] + left[1] * side * (reach + 0.8)])) continue;
        out.push({ at: p, face: Math.atan2(q[2] - p[1], q[1] - p[0]), kind });
        break;
      }
    }
    i = end + 1;
  }
  return out;
}
