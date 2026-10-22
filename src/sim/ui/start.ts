// The run's start (the owner, 21 Oct): which brief the instructor reads before the engine starts. Each brief once a
// visit, so a respawn goes straight to the engine.
import type { StationId } from '../contracts';
import { circuit } from '../data';
import type { PanelMode } from './ModePanel';

const FIRST = [...circuit.stations].sort((a, b) => a.order - b.order)[0].id;

/** The brief to read first: the drill's, the first station's, or free drive's; null once it has been read. */
export function briefFor(mode: PanelMode, drill: StationId, spoken: Set<string>): string | null {
  const key = mode === 'free' ? 'sim.voice.free' : `sim.tips.${mode === 'practice' ? drill : FIRST}`;
  return spoken.has(key) ? null : key;
}
