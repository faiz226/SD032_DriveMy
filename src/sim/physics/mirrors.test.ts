// @vitest-environment node
// The mirrors, checked without rendering: points projected through each mirror camera, with the display's flip.
import { describe, expect, it } from 'vitest';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { MIRRORS, mirrorCamera, seenInMirror, targetSize } from './mirrors';

const cam = (id: 'left' | 'interior' | 'right') => mirrorCamera(MIRRORS.find((m) => m.id === id)!);
const ROAD = -CAR.wheelRadius;   // the road, in the car frame (origin at wheel-centre height)

describe('mirrors', () => {
  it('a pole behind the car, moved toward the car\'s left, moves left in all three', () => {
    // 0.6 m up a pole 6 m behind the wheelbase centre, where each mirror can see it
    for (const [id, z] of [['left', -2.0], ['interior', 0], ['right', 2.0]] as const) {
      const before = seenInMirror(cam(id), [-6, ROAD + 0.6, z]);
      const after = seenInMirror(cam(id), [-6, ROAD + 0.6, z - 0.4]);   // the car's left is -z
      expect(before, id).not.toBeNull();
      expect(after, id).not.toBeNull();
      expect(after![0], id).toBeLessThan(before![0]);
    }
  });

  it('each door mirror shows the car\'s own flank, by the rear wheel, along its inner edge, in the lower half', () => {
    const half = CAR.config.width_body_m / 2 - 0.03;   // just inside the body's widest line
    const left = seenInMirror(cam('left'), [CAR.axle.rear, 0.1, -half]);
    const right = seenInMirror(cam('right'), [CAR.axle.rear, 0.1, half]);
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(left![0]).toBeGreaterThan(0.5);    // the right edge of the left mirror
    expect(right![0]).toBeLessThan(-0.5);     // the left edge of the right mirror
    expect(left![1]).toBeLessThan(0);
    expect(right![1]).toBeLessThan(0);
  });

  it('the interior mirror looks straight back through the rear window', () => {
    const p = seenInMirror(cam('interior'), [-15, ROAD + 1.0, 0]);
    expect(p).not.toBeNull();
    expect(Math.abs(p![0])).toBeLessThan(0.01);
    expect(Math.abs(p![1])).toBeLessThan(0.6);
  });

  it('render targets keep each mirror\'s shape within the pixel budget', () => {
    for (const m of MIRRORS) {
      const [w, h] = targetSize(m);
      expect(w * h).toBeLessThanOrEqual(256 * 128 * 1.02);
      expect(w / h).toBeCloseTo(m.px[0] / m.px[1], 1);
    }
  });
});
