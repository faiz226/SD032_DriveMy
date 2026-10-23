// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../contracts';
import { Path } from './path';

// a straight 40 m road along x, sampled every 0.25 m, as the route's samples are
const road = new Path(Array.from({ length: 161 }, (_, i) => [i * 0.25, 0] as Vec2), false);

describe('a path finds what lies along it', () => {
  it('sees the whole window ahead, however finely the path is sampled', () => {
    const q = road.project([30, 0.2], 0, 35);
    expect(q?.s).toBeCloseTo(30, 5);
    expect(q?.offset).toBeCloseTo(0.2, 5);
  });

  it('measures a point past the end of its stretch by its true distance, not its distance from the line', () => {
    // 20 m past the window's end, 0.5 m off the line: far away, never "in the lane"
    const q = road.project([30, 0.5], 0, 10);
    expect(Math.abs(q?.offset ?? Infinity)).toBeGreaterThan(19);
  });
});
