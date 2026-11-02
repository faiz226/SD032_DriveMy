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
  px: [number, number];    // its size on an 851 x 393 screen as a panel; its shape is the glass's
  near: number;            // past the housing
  /**
   * Shown on the car's own mirror glass, which the driver sees through the windscreen. The left door mirror is
   * outside that view (a driver turns their head to it), so it stays a panel, opposite where the right one shows.
   */
  onGlass: boolean;
}

// The glass the car's model carries ("Mirrors"), measured: door mirrors 0.152 x 0.121 m, the interior mirror
// 0.221 x 0.063 m. Each camera takes its glass's shape, so the image is never stretched onto it.
export const GLASS = { material: 'Mirrors', radius: 0.15 };

// Door mirrors turned 15 deg outward and 14 deg down, so the flank by the rear tyre runs along the inner
// edge, in the lower half: where learners watch the bay lines and the kerb.
export const MIRRORS: MirrorSpec[] = [
  { id: 'left', at: CAR.mirrors.left, yawDeg: 90 - 15, pitchDeg: -14, hfovDeg: 35, px: [150, 120], near: 0.1, onGlass: false },
  { id: 'interior', at: CAR.mirrors.interior, yawDeg: 90, pitchDeg: -3, hfovDeg: 50, px: [240, 68], near: 0.05, onGlass: true },
  { id: 'right', at: CAR.mirrors.right, yawDeg: 90 + 15, pitchDeg: -14, hfovDeg: 35, px: [150, 120], near: 0.1, onGlass: true },
];

export const MIRROR_FAR = 60;

// A real car tips its door mirrors down in reverse, so the driver sees the kerb and the bay lines by the rear
// wheels. Here both door mirrors dip this far in R (eased, MirrorView.tsx) and come back up in D: at this much the
// rear tyre's patch of road sits low in the middle of each (mirrors.test.ts).
export const REVERSE_TILT_DEG = 12;

/** A mirror's pitch, degrees, with `reverse` from 0 (in D) to 1 (in R): the door mirrors dip, the interior one never does. */
export const pitchAt = (m: MirrorSpec, reverse: number) => m.pitchDeg - (m.id === 'interior' ? 0 : REVERSE_TILT_DEG * reverse);

/** The mirrors' sizes are for an 851 x 393 screen; this scales them with the screen. */
export const mirrorScale = (w: number, h: number) => Math.min(1.6, Math.max(0.75, Math.min(w / 851, h / 393)));
export const MIRROR_PAD = 10;
/** The touch steering pad's top edge above the screen's bottom (TouchControls.tsx: 16 px up, 140 px tall) and a gap. */
export const TOUCH_PAD_TOP = 164;

/**
 * Where the right door mirror's glass shows on the driver's screen, x and y in -1..1, for a screen of this shape
 * with the head at rest. The left door mirror is out of the windscreen view, so its panel takes the opposite place.
 */
export function rightMirrorOnScreen(aspect: number): [number, number] {
  const eye = new THREE.PerspectiveCamera(CAR.eyeView.fovDeg, aspect, 0.05, 600);
  eye.position.set(...CAR.eye);
  eye.rotation.set(CAR.eyeView.pitch, -Math.PI / 2, 0, 'YXZ');
  eye.updateMatrixWorld();
  const p = new THREE.Vector3(...CAR.mirrors.right).project(eye);
  return [p.x, p.y];
}

/**
 * The centre of a door mirror's panel on a width x height screen, in pixels from the middle (x right, y up): the
 * left panel is the right mirror's place across the middle, the right one (when its glass is missing) its own
 * place, never past the screen's edge. With touch controls the panel keeps to the edge, clear of the interior
 * mirror, and stays above the steering pad.
 */
export function doorPanelAt(m: MirrorSpec, width: number, height: number, touch: boolean): [number, number] {
  const k = mirrorScale(width, height);
  const [sx, sy] = rightMirrorOnScreen(width / height);
  const edge = width / 2 - MIRROR_PAD * k - (m.px[0] * k) / 2;
  const x = (m.id === 'left' ? -1 : 1) * (touch ? edge : Math.min((sx * width) / 2, edge));
  const y = Math.max((sy * height) / 2, touch ? TOUCH_PAD_TOP - height / 2 + (m.px[1] * k) / 2 : -Infinity);
  return [x, y];
}

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
