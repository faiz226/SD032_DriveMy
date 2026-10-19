// In the 3D scene: the "where next" marker over the next station's entry on route.samples, and a small camera
// kick when a fault happens. Both stay still for anyone who asks for reduced motion.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import type { StationId, Vec2 } from '../contracts';
import { circuit } from '../data';
import { getWorld } from '../world/build';
import { useRun } from './run';

const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const KICK_S = 0.35;
const MARK = '#F2B705';   // awas: where to go next is progress

/** Where each station starts along the route: the marker floats here until the station arms. */
const ENTRY = Object.fromEntries(circuit.stations.map((st) => {
  const q = circuit.route.samples.find((s) => s[0] >= st.s_from) ?? circuit.route.samples[0];
  return [st.id, [q[1], q[2]] as Vec2];
})) as Record<StationId, Vec2>;

export function WhereNext() {
  const target = useRun((s) => {
    const st = s.state.stations.find((x) => x.id === s.state.current);
    return st && st.status === 'waiting' && !Number(st.detail.voids ?? 0) ? st.id : null;
  });
  const group = useRef<THREE.Group>(null);
  const base = useMemo(() => {
    if (!target) return null;
    const [x, y] = ENTRY[target];
    return { x, y, h: getWorld(circuit).surfaceHeight(x, y) + 2.4 };
  }, [target]);
  useFrame(({ clock }) => {
    if (group.current && base && !REDUCED) group.current.position.y = base.h + Math.sin(clock.elapsedTime * 2.2) * 0.15;
  });
  if (!base) return null;
  return (
    <group ref={group} position={[base.x, base.h, -base.y]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 1, 4]} />
        <meshBasicMaterial color={MARK} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A short roll of the driver's view on a fault; the top-down camera never moves. */
export function CameraKick() {
  useFrame(({ camera }) => {
    if (!(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    const age = (performance.now() - useRun.getState().lastFaultAt) / 1000;
    camera.rotation.z = !REDUCED && age < KICK_S ? Math.sin(age * 55) * 0.012 * (1 - age / KICK_S) : 0;
  });
  return null;
}
