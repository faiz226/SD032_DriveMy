// The three mirrors a learner checks in the real test: the interior mirror and both door mirrors.
// Each is a rear-facing camera on the car, rendered into a small target and shown flipped left to
// right, as a mirror shows it. The aims were checked on 14 Oct by projecting points through three.js
// cameras; mirrors.test.ts keeps them honest. Positions are in the car frame (x forward, y up, z right).
import * as THREE from 'three';
import { rad, toDeg } from '../geom';
import { SWIFT_2022 as CAR } from './cars/swift-2022';

type V3 = [number, number, number];
export type MirrorId = 'left' | 'interior' | 'right';

export interface MirrorSpec {
  id: MirrorId;
  at: V3;                  // the glass
  yawDeg: number;          // 90 looks straight back; less turns it toward the car's left, more toward its right
  pitchDeg: number;        // negative looks down
  hfovDeg: number;         // how wide it sees
  px: [number, number];    // its size on an 851 x 393 screen, which also sets its shape
  near: number;            // past the housing
}

// Door mirrors turned 15 deg outward and 14 deg down, so the flank by the rear tyre runs along the inner
// edge, in the lower half: where learners watch the bay lines and the kerb.
export const MIRRORS: MirrorSpec[] = [
  { id: 'left', at: CAR.mirrors.left, yawDeg: 90 - 15, pitchDeg: -14, hfovDeg: 35, px: [150, 100], near: 0.1 },
  { id: 'interior', at: CAR.mirrors.interior, yawDeg: 90, pitchDeg: -3, hfovDeg: 50, px: [240, 60], near: 0.05 },
  { id: 'right', at: CAR.mirrors.right, yawDeg: 90 + 15, pitchDeg: -14, hfovDeg: 35, px: [150, 100], near: 0.1 },
];

export const MIRROR_FAR = 60;

export function mirrorCamera(m: MirrorSpec): THREE.PerspectiveCamera {
  const aspect = m.px[0] / m.px[1];
  const vfov = 2 * Math.atan(Math.tan(rad(m.hfovDeg) / 2) / aspect);
  const cam = new THREE.PerspectiveCamera(toDeg(vfov), aspect, m.near, MIRROR_FAR);
  cam.name = `mirror-${m.id}`;
  cam.position.set(...m.at);
  cam.rotation.set(rad(m.pitchDeg), rad(m.yawDeg), 0, 'YXZ');
  cam.updateMatrixWorld();
  return cam;
}

/** Render-target size: the mirror's shape, within a pixel budget (WP5's quality tier sets it). */
export function targetSize(m: MirrorSpec, budget = 256 * 128): [number, number] {
  const k = Math.sqrt(budget / (m.px[0] * m.px[1]));
  return [Math.round(m.px[0] * k), Math.round(m.px[1] * k)];
}

/**
 * Where a point (car frame) shows in a mirror as the driver sees it: x and y in -1..1, flipped left to
 * right as the display flips it. Null when the mirror cannot see it.
 */
export function seenInMirror(cam: THREE.PerspectiveCamera, p: V3): [number, number] | null {
  const v = new THREE.Vector3(...p).project(cam);
  if (Math.abs(v.z) > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return null;
  return [-v.x, v.y];
}
