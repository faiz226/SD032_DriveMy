// The Swift's lamps (the owner, 20 Oct): tail and brake, the high stop lamp, reverse, the indicators and the
// headlamps. Each shows as a soft glow just outside its glass while lit; the glow adds light, so an unlit lamp draws
// nothing. Our car draws its own (SwiftCar), the traffic every car's in one instanced mesh (TrafficView).
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { SWIFT_2022 as CAR } from './cars/swift-2022';

/** What a car's lamps show. indicator: 1 left, -1 right (as the steering wheel's sign); hazard: both sides flash. */
export interface LampState { brake: boolean; head: boolean; reverse: boolean; indicator: -1 | 0 | 1; hazard?: boolean }

// 90 +/- 30 flashes a minute, lit half the time (UN R6, which JPJ type approval follows)
export const BLINK_S = 60 / 85;
export const blinkOn = (t: number) => t % BLINK_S < BLINK_S / 2;
/** The lamps' and the dashboard's shared clock, seconds, so the flashes and the tick keep time together. */
export const lampClock = () => performance.now() / 1000;

type Kind = keyof typeof CAR.lamps;
/** One lamp: its kind, its side (-1 left, z < 0; 1 right; 0 the middle) and its glow's place in the car frame. */
interface Lamp { kind: Kind; side: -1 | 0 | 1; matrix: THREE.Matrix4 }

const YAW = { back: -Math.PI / 2, front: Math.PI / 2 };   // a plane faces +z: turned about y to face the car's back or front
const UP = new THREE.Vector3(0, 1, 0);
export const LAMPS: Lamp[] = Object.entries(CAR.lamps).flatMap(([kind, l]) => (l.at[2] === 0 ? [0 as const] : [-1 as const, 1 as const]).map((side) => {
  const yaw = l.face === 'out' ? (side < 0 ? Math.PI : 0) : YAW[l.face];
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(l.at[0], l.at[1], side === 0 ? 0 : side * l.at[2]),
    new THREE.Quaternion().setFromAxisAngle(UP, yaw),
    new THREE.Vector3(l.size[0], l.size[1], 1),
  );
  return { kind: kind as Kind, side, matrix };
}));

const RED = new THREE.Color(1, 0.04, 0.02);
const AMBER = new THREE.Color(1, 0.42, 0.02);
const WHITE = new THREE.Color(1, 0.96, 0.88);

/** A lamp's glow for this state at time t: its colour times its strength, black when off. */
export function lampColour(lamp: Lamp, s: LampState, t: number, out: THREE.Color): THREE.Color {
  const on = (c: THREE.Color, k: number) => out.copy(c).multiplyScalar(k);
  switch (lamp.kind) {
    case 'tail': return s.brake ? on(RED, 2.2) : on(RED, s.head ? 0.6 : 0);   // the tail lamps burn with the headlamps
    case 'stop': return on(RED, s.brake ? 2 : 0);
    case 'reverse': return on(WHITE, s.reverse ? 2 : 0);
    case 'head': return on(WHITE, s.head ? 2.2 : 0);
    default: return on(AMBER, (s.hazard || (s.indicator !== 0 && lamp.side === -s.indicator)) && blinkOn(t) ? 2.2 : 0);   // left lamps: the -z side
  }
}

let glow: THREE.Texture | null = null;
/** White, fading from the middle out: the glow's shape, its colour coming from each lamp. */
function glowTexture() {
  if (glow) return glow;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const fill = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  fill.addColorStop(0, 'rgba(255,255,255,1)');
  fill.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  fill.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = fill;
  g.fillRect(0, 0, 64, 64);
  glow = new THREE.CanvasTexture(c);
  return glow;
}

/** `count` glows, all dark, in one draw call: their matrices and colours are the caller's to set. */
export function lampMesh(count: number): THREE.InstancedMesh {
  const m = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    count,
  );
  const dark = new THREE.Color(0, 0, 0);
  for (let i = 0; i < count; i++) m.setColorAt(i, dark);
  m.frustumCulled = false;   // spread over the yard (or riding on our car): one bounding sphere would cull them wrongly
  return m;
}

export function disposeMesh(m: THREE.InstancedMesh) {
  m.geometry.dispose();
  (m.material as THREE.Material).dispose();
  m.dispose();
}

const colour = new THREE.Color();
/** One car's lamps at `first` onward in `m`, lit for `s` (outside the component: hooks keep memos immutable). */
export function paintLamps(m: THREE.InstancedMesh, first: number, s: LampState, t: number) {
  LAMPS.forEach((lamp, j) => m.setColorAt(first + j, lampColour(lamp, s, t, colour)));
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}

/** Our car's lamps, riding with it: lit every frame from `state`. */
export function CarLamps({ state }: { state: () => LampState }) {
  const mesh = useMemo(() => {
    const m = lampMesh(LAMPS.length);
    LAMPS.forEach((lamp, i) => m.setMatrixAt(i, lamp.matrix));
    return m;
  }, []);
  useEffect(() => () => disposeMesh(mesh), [mesh]);
  useFrame(() => paintLamps(mesh, 0, state(), lampClock()));
  return <primitive object={mesh} />;
}
