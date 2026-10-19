// @vitest-environment node
// Every string exists in both languages, and every key the simulator's screens ask for is defined.
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ms } from './ms';

// the simulator's sources as text, tests excluded
const sources = import.meta.glob(['/src/sim/**/*.{ts,tsx}', '!/src/sim/**/*.test.{ts,tsx}', '/src/pages/SimulationsPage.tsx'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

describe('translations', () => {
  it('English and Malay have the same keys, none empty', () => {
    expect(Object.keys(ms).sort()).toEqual(Object.keys(en).sort());
    for (const [k, v] of Object.entries(ms)) expect(v.trim(), k).not.toBe('');
  });

  it('every literal key the simulator uses exists', () => {
    const used = new Set(Object.values(sources).flatMap((src) => [...src.matchAll(/t\('((?:sim|progress)\.[\w.-]+)'/g)].map((m) => m[1])));
    expect(used.size).toBeGreaterThan(30);
    for (const k of used) expect(en, k).toHaveProperty([k]);
    // keys built from ids: tips, station names, fault reasons and fixes
    for (const id of ['hill-start', 'side-parking', 'parallel-parking', 'three-point-turn', 's-curve', 'z-curve', 'ramp-test', 'road-merging']) {
      expect(en).toHaveProperty([`sim.tips.${id}`]);
      expect(en).toHaveProperty([`progress.maneuver.${id}`]);
    }
  });

  it('tips describe only what is measured: no clutch', () => {
    for (const [k, v] of [...Object.entries(en), ...Object.entries(ms)]) {
      if (k.startsWith('sim.tips.')) expect(v.toLowerCase(), k).not.toMatch(/clutch|klac/);
    }
    expect(en['sim.tips.road-merging']).toBe('Build speed on the approach. Join at road speed.');
  });
});
