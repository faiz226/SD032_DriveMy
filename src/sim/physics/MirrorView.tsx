// The mirrors on screen. Each rear-facing camera rides on the car and renders into its own small target,
// a few mirrors a frame in turn; the three show on a HUD layer over the windscreen view, flipped left to
// right as mirrors are. Only for the first-person view.
import { Hud, OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MIRRORS, mirrorCamera, targetSize } from './mirrors';

interface Props {
  car: RefObject<THREE.Group | null>;
  /** How many mirrors re-render each frame (WP5's quality tier sets it). */
  perFrame?: number;
  /** Pixels per mirror target. */
  budget?: number;
}

export function MirrorView({ car, perFrame = 1, budget = 256 * 128 }: Props) {
  const cams = useMemo(() => MIRRORS.map(mirrorCamera), []);
  const targets = useMemo(() => MIRRORS.map((m) => {
    const [w, h] = targetSize(m, budget);
    const t = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
    t.texture.repeat.x = -1;   // a mirror's left-right flip
    t.texture.offset.x = 1;
    return t;
  }), [budget]);
  const next = useRef(0);

  useEffect(() => () => { for (const t of targets) t.dispose(); }, [targets]);

  useEffect(() => {
    const g = car.current;
    if (!g) return;
    for (const c of cams) g.add(c);
    return () => { for (const c of cams) g.remove(c); };
  }, [car, cams]);

  // After the car's pose is synced (priority 0) and before the HUD draws the frame (priority 1).
  useFrame(({ gl, scene }) => {
    const shadows = gl.shadowMap.autoUpdate;
    const prev = gl.getRenderTarget();
    gl.shadowMap.autoUpdate = false;
    for (let k = 0; k < perFrame; k++) {
      const n = next.current++ % cams.length;
      gl.setRenderTarget(targets[n]);
      gl.render(scene, cams[n]);
    }
    gl.setRenderTarget(prev);
    gl.shadowMap.autoUpdate = shadows;
  }, 0.5);

  return (
    <Hud renderPriority={1}>
      <OrthographicCamera makeDefault position={[0, 0, 100]} near={1} far={200} />
      <Glasses targets={targets} />
    </Hud>
  );
}

/** The three mirror glasses, sized for an 851 x 393 screen and scaled with it. */
function Glasses({ targets }: { targets: THREE.WebGLRenderTarget[] }) {
  const { width, height } = useThree((s) => s.size);
  const k = Math.min(1.6, Math.max(0.75, Math.min(width / 851, height / 393)));
  const pad = 10 * k;
  return (
    <>
      {MIRRORS.map((m, n) => {
        const w = m.px[0] * k;
        const h = m.px[1] * k;
        // interior mirror top centre; door mirrors at the side edges, a little above the middle,
        // which keeps them clear of the touch controls' steering pad and pedals
        const x = m.id === 'interior' ? 0 : (m.id === 'left' ? -1 : 1) * (width / 2 - pad - w / 2);
        const y = m.id === 'interior' ? height / 2 - pad - h / 2 : 0.06 * height;
        return (
          <group key={m.id} position={[x, y, 0]}>
            <mesh position={[0, 0, -1]}>
              <planeGeometry args={[w + 6 * k, h + 6 * k]} />
              <meshBasicMaterial color="#15171a" toneMapped={false} />
            </mesh>
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial map={targets[n].texture} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
