// @vitest-environment node
// The mirrors, checked without rendering: points projected through each mirror camera, with the display's flip.
import { describe, expect, it } from 'vitest';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { doorPanelAt, MIRROR_PAD, MIRRORS, mirrorCamera, mirrorScale, pitchAt, rightMirrorOnScreen, seenInMirror, TOUCH_PAD_TOP, targetSize } from './mirrors';

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

  it('in reverse both door mirrors dip, so the rear tyre\'s patch of road shows; in D it is out of sight', () => {
    for (const id of ['left', 'right'] as const) {
      const m = MIRRORS.find((x) => x.id === id)!;
      const tyre: [number, number, number] = [CAR.axle.rear, ROAD, (id === 'left' ? -1 : 1) * CAR.axle.halfTrack];
      expect(seenInMirror(cam(id), tyre), id).toBeNull();
      const seen = seenInMirror(mirrorCamera({ ...m, pitchDeg: pitchAt(m, 1) }), tyre);
      expect(seen, id).not.toBeNull();
      expect(seen![1], id).toBeLessThan(0);      // in the lower half, where the kerb is looked for
      expect(seen![1], id).toBeGreaterThan(-0.8);
    }
    const interior = MIRRORS.find((m) => m.id === 'interior')!;
    expect(pitchAt(interior, 1)).toBe(interior.pitchDeg);   // the interior mirror never dips
    expect(pitchAt(MIRRORS[0], 0)).toBe(MIRRORS[0].pitchDeg);
  });

  it('the interior mirror looks straight back through the rear window', () => {
    const p = seenInMirror(cam('interior'), [-15, ROAD + 1.0, 0]);
    expect(p).not.toBeNull();
    expect(Math.abs(p![0])).toBeLessThan(0.01);
    expect(Math.abs(p![1])).toBeLessThan(0.6);
  });

  it('the left panel is the right mirror\'s place across the middle, at the same height, on any screen', () => {
    const [left, right] = [MIRRORS.find((m) => m.id === 'left')!, MIRRORS.find((m) => m.id === 'right')!];
    for (const [w, h] of [[1280, 800], [1366, 650], [1920, 960], [851, 393]]) {
      const [lx, ly] = doorPanelAt(left, w, h, false);
      const [rx, ry] = doorPanelAt(right, w, h, false);
      expect(lx, `${w}x${h}`).toBeCloseTo(-rx, 6);
      expect(ly, `${w}x${h}`).toBeCloseTo(ry, 6);
      expect(ly, `${w}x${h} below the middle, as the right mirror is`).toBeLessThan(0);
    }
    // where the right mirror's glass really shows, when that is inside the screen's edge
    const [sx, sy] = rightMirrorOnScreen(1366 / 650);
    expect(doorPanelAt(right, 1366, 650, false)).toEqual([(sx * 1366) / 2, (sy * 650) / 2]);
  });

  it('the left panel stays inside the screen, out of the road ahead, and above the touch steering pad', () => {
    const left = MIRRORS.find((m) => m.id === 'left')!;
    for (const [w, h] of [[1280, 800], [851, 393], [1024, 683], [1366, 650], [1920, 960]]) {
      const k = mirrorScale(w, h);
      const [x] = doorPanelAt(left, w, h, false);
      expect(w / 2 + x - (left.px[0] * k) / 2, `${w}x${h} inside the edge`).toBeGreaterThanOrEqual(MIRROR_PAD * k - 1e-6);
      expect(w / 2 + x + (left.px[0] * k) / 2, `${w}x${h} out of the middle`).toBeLessThan(w * 0.3);
    }
    const k = mirrorScale(851, 393);
    const [x, y] = doorPanelAt(left, 851, 393, true);
    expect(393 / 2 + y - (left.px[1] * k) / 2).toBeGreaterThanOrEqual(TOUCH_PAD_TOP - 1e-6);   // its bottom edge above the pad's top
    expect(851 / 2 + x - (left.px[0] * k) / 2).toBeCloseTo(MIRROR_PAD * k, 6);                 // and at the edge, clear of the interior mirror
  });

  it('render targets keep each mirror\'s shape within the pixel budget', () => {
    for (const m of MIRRORS) {
      const [w, h] = targetSize(m);
      expect(w * h).toBeLessThanOrEqual(256 * 128 * 1.02);
      expect(w / h).toBeCloseTo(m.px[0] / m.px[1], 1);
    }
  });
});
