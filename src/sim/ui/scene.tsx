// In the 3D scene: the "where next" marker over the next station's entry on route.samples, and a small camera
// kick when a fault happens. Both stay still for anyone who asks for reduced motion.
import { PerformanceMonitor } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import type { StationId, Vec2 } from '../contracts';
import { circuit } from '../data';
import type { TierSpec } from '../quality';
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

/** The device pixel ratio for a point in the tier's render-scale band (0 = its low end, 1 = its high end). */
export const dprFor = (spec: TierSpec, f: number) => {
  const [lo, hi] = spec.renderScale;
  const native = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  return Math.round(Math.min(spec.maxDpr, Math.max(1, native * (lo + (hi - lo) * f))) * 20) / 20;
};

/** Holds the frame rate by moving the render scale within the tier's band; the tier itself never changes. */
export function RenderScale({ spec }: { spec: TierSpec }) {
  const setDpr = useThree((s) => s.setDpr);
  return (
    <PerformanceMonitor
      factor={1}
      flipflops={6}
      bounds={() => spec.fpsBounds}
      onChange={({ factor }) => setDpr(dprFor(spec, factor))}
      onFallback={() => setDpr(dprFor(spec, 0))}
    />
  );
}

// ?perf=1: every frame's duration, for the performance run (docs/v2-plan/RESULTS.md)
const frames: number[] = [];
let lastFrame = 0;
let calls = 0;
let triangles = 0;

function frameStats() {
  const s = [...frames].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0;
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return { frames: s.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), calls, triangles, memoryMB: memory ? memory.usedJSHeapSize / 1e6 : null };
}

/** Records frame times; the run reads them back through window.__simPerf. */
export function FrameProbe() {
  useFrame(({ gl }) => {
    // draw calls and triangles of the whole previous frame: the scene, the mirrors and the HUD
    gl.info.autoReset = false;
    calls = gl.info.render.calls;
    triangles = gl.info.render.triangles;
    gl.info.reset();
    const now = performance.now();
    if (lastFrame) frames.push(now - lastFrame);
    lastFrame = now;
    if (frames.length > 120_000) frames.splice(0, 60_000);
  });
  useEffect(() => {
    Object.assign(window, { __simPerf: { reset: () => { frames.length = 0; lastFrame = 0; }, stats: frameStats } });
  }, []);
  return null;
}
