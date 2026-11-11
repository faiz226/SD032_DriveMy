import { describe, expect, it } from 'vitest';
import { brownLoop } from './sound';

describe('far-off traffic', () => {
  it('loops without a step at its seam, at a low and even level', () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // the same noise every run
    const d = brownLoop(8000, 8, random);
    expect(d.length).toBe(64000);
    let worst = 0;
    for (let i = 1; i < d.length; i++) worst = Math.max(worst, Math.abs(d[i] - d[i - 1]));
    expect(Math.abs(d[0] - d[d.length - 1])).toBeLessThanOrEqual(worst);   // the seam: no bigger than any step
    const rms = Math.sqrt(d.reduce((a, v) => a + v * v, 0) / d.length);
    expect(rms).toBeGreaterThan(0.01);
    expect(rms).toBeLessThan(0.5);
  });
});
