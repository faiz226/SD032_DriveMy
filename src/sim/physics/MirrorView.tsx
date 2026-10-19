// The mirrors on screen. Each rear-facing camera rides on the car and renders into its own small target,
// a few mirrors a frame in turn; the three show on a HUD layer over the windscreen view, flipped left to
// right as mirrors are. Only for the first-person view.
//
// The targets are rendered exactly as the screen is: sRGB output and the same tone mapping. three.js gives a
// plain render target linear output and no tone mapping, which made every material switch shader programs
// twice a frame (screen, then mirror) and rebuild its program key each time: on a phone that cost more than
// drawing the mirror. Flagging the targets as XR targets keeps the screen's colour settings (the flag changes
// nothing else in the WebGL renderer, three r185), and the glasses copy the display-ready pixels as they are.
import { Hud, OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { DOOR_MIRROR_RISE, MIRROR_PAD, type MirrorId, MIRRORS, mirrorCamera, mirrorScale, targetSize } from './mirrors';

interface Props {
  car: RefObject<THREE.Group | null>;
  /** How many mirrors re-render each frame, in turn (WP5's quality tier sets it); 0.5 is one every other frame. */
  perFrame?: number;
  /** Pixels per mirror target. */
  budget?: number;
  /** Which mirrors exist (WP5's cut list may drop the interior one on the Low tier). */
  ids?: MirrorId[];
}

/** Copies a mirror target's display-ready pixels to the screen unchanged, flipped left to right. */
const glassMaterial = (map: THREE.Texture) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = vec2(1.0 - uv.x, uv.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0); }',
});

export function MirrorView({ car, perFrame = 1, budget = 256 * 128, ids }: Props) {
  const shown = useMemo(() => MIRRORS.filter((m) => !ids || ids.includes(m.id)), [ids]);
  const cams = useMemo(() => shown.map(mirrorCamera), [shown]);
  const targets = useMemo(() => shown.map((m) => {
    const [w, h] = targetSize(m, budget);
    // sRGB output for the programs, but a plain RGBA8 store: the shader already encodes, so the GPU must not
    const t = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, colorSpace: THREE.SRGBColorSpace, internalFormat: 'RGBA8' });
    (t as THREE.WebGLRenderTarget & { isXRRenderTarget: boolean }).isXRRenderTarget = true;
    return t;
  }), [shown, budget]);
  const glasses = useMemo(() => targets.map((t) => glassMaterial(t.texture)), [targets]);
  const next = useRef(0);
  const due = useRef(0);

  useEffect(() => () => { for (const t of targets) t.dispose(); }, [targets]);
  useEffect(() => () => { for (const g of glasses) g.dispose(); }, [glasses]);

  useEffect(() => {
    const g = car.current;
    if (!g) return;
    for (const c of cams) g.add(c);
    return () => { for (const c of cams) g.remove(c); };
  }, [car, cams]);

  // After the car's pose is synced (priority 0) and before the HUD draws the frame (priority 1).
  useFrame(({ gl, scene }) => {
    due.current += perFrame;
    const count = Math.floor(due.current);
    if (count === 0) return;
    due.current -= count;
    const shadows = gl.shadowMap.autoUpdate;
    const prev = gl.getRenderTarget();
    gl.shadowMap.autoUpdate = false;
    for (let k = 0; k < count; k++) {
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
      <Glasses mirrors={shown} glasses={glasses} />
    </Hud>
  );
}

/** The three mirror glasses, sized for an 851 x 393 screen and scaled with it. */
function Glasses({ mirrors, glasses }: { mirrors: typeof MIRRORS; glasses: THREE.ShaderMaterial[] }) {
  const { width, height } = useThree((s) => s.size);
  const k = mirrorScale(width, height);
  const pad = MIRROR_PAD * k;
  return (
    <>
      {mirrors.map((m, n) => {
        const w = m.px[0] * k;
        const h = m.px[1] * k;
        // interior mirror top centre; door mirrors at the side edges, a little above the middle,
        // which keeps them clear of the touch controls' steering pad and pedals
        const x = m.id === 'interior' ? 0 : (m.id === 'left' ? -1 : 1) * (width / 2 - pad - w / 2);
        const y = m.id === 'interior' ? height / 2 - pad - h / 2 : DOOR_MIRROR_RISE * height;
        return (
          <group key={m.id} position={[x, y, 0]}>
            <mesh position={[0, 0, -1]}>
              <planeGeometry args={[w + 6 * k, h + 6 * k]} />
              <meshBasicMaterial color="#15171a" toneMapped={false} />
            </mesh>
            <mesh material={glasses[n]}>
              <planeGeometry args={[w, h]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
