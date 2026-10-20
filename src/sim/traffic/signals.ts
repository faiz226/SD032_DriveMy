// The yard's traffic signals: each on a fixed cycle from the run's clock (circuit.json traffic.signals), the spine
// road's group first, then the side road's, each green, then amber, then a moment of red both ways.
import type { SignalGroup, TrafficData } from '../contracts';

export type Light = 'green' | 'amber' | 'red';
type SignalData = TrafficData['signals'][number];

export function cycleS(sg: SignalData): number {
  const { ew, ns } = sg.phases;
  return ew.green + ew.amber + ew.all_red + ns.green + ns.amber + ns.all_red;
}

/** What each group's lights show at time t (seconds on the run's clock). */
export function lightsAt(sg: SignalData, t: number): Record<SignalGroup, Light> {
  const { ew, ns } = sg.phases;
  const c = cycleS(sg);
  const u = (((t + sg.offset_s) % c) + c) % c;
  const ewEnd = ew.green + ew.amber + ew.all_red;
  if (u < ew.green) return { ew: 'green', ns: 'red' };
  if (u < ew.green + ew.amber) return { ew: 'amber', ns: 'red' };
  if (u < ewEnd) return { ew: 'red', ns: 'red' };
  if (u < ewEnd + ns.green) return { ew: 'red', ns: 'green' };
  if (u < ewEnd + ns.green + ns.amber) return { ew: 'red', ns: 'amber' };
  return { ew: 'red', ns: 'red' };
}

/** Seconds until the group next shows green (0 while it is green). */
export function untilGreen(sg: SignalData, group: SignalGroup, t: number): number {
  for (let k = 0; k <= cycleS(sg) * 10; k++) if (lightsAt(sg, t + k / 10)[group] === 'green') return k / 10;
  return cycleS(sg);
}
