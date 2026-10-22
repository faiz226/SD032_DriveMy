// The run's start: the brief once a visit, never again on a respawn.
import { describe, expect, it } from 'vitest';
import { briefFor } from './start';

describe('the brief before the engine', () => {
  it('reads the first station on the first assessment, then never again on a respawn', () => {
    const spoken = new Set<string>();
    const brief = briefFor('assessment', 'hill-start', spoken);
    expect(brief).toBe('sim.tips.hill-start');
    spoken.add(brief!);
    expect(briefFor('assessment', 'hill-start', spoken)).toBeNull();
  });
  it("reads each drill's own brief once, and free drive's", () => {
    const spoken = new Set(['sim.tips.hill-start']);
    expect(briefFor('practice', 'z-curve', spoken)).toBe('sim.tips.z-curve');
    expect(briefFor('practice', 'hill-start', spoken)).toBeNull();
    expect(briefFor('free', 'hill-start', spoken)).toBe('sim.voice.free');
  });
});
