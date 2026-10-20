// The practice yard in the scene: the cached meshes, their textures, and the fixed colliders.
import { Environment, OrthographicCamera, Sky, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { textureFiles } from '../assets';
import { circuit } from '../data';
import { getWorld } from './build';
import { addWorldColliders } from './colliders';

export type Tier = 'low' | 'medium';

const TILE_M = { concrete: 4, grass: 6, asphalt: 6 };   // one texture tile covers this many metres

export function World({ tier = 'low' }: { tier?: Tier }) {
  const world = getWorld(circuit);
  const physics = useRapier();
  useEffect(() => {
    const added = addWorldColliders(physics.rapier, physics.world, world);
    return () => added.remove();
  }, [physics.rapier, physics.world, world]);
  const [concrete, grass, asphalt] = useTexture(textureFiles(tier));

  useLayoutEffect(() => {
    const maps: [THREE.Texture, number, THREE.MeshStandardMaterial][] = [
      [concrete, TILE_M.concrete, world.materials.concrete],
      [asphalt, TILE_M.asphalt, world.materials.asphalt],
      [grass, TILE_M.grass, world.materials.grass],
    ];
    for (const [map, tile, material] of maps) {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(1 / tile, 1 / tile);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
      map.needsUpdate = true;
      material.map = map;
      material.needsUpdate = true;
    }
  }, [world, concrete, grass, asphalt]);

  useLayoutEffect(() => {
    world.group.traverse((o) => { o.receiveShadow = true; });   // used only when the tier turns shadows on
  }, [world]);

  return <primitive object={world.group} dispose={null} />;
}

const SUN = new THREE.Vector3(60, 80, 30);
const SUN_FROM_CAR = SUN.clone().setLength(55);
const SHADOW_HALF_M = 18;   // the shadow map covers this far around the car
const at = new THREE.Vector3();

const HEMI_INTENSITY = 0.8;

/**
 * Daylight: a sky, the light the sky gives, a hemisphere fill and the sun.
 * The sky's light is a gradient dome (blue overhead, pale at the horizon, the yard's colour below) rendered
 * once into a 64 px cube map: nothing loads from the network. Not the Sky shader itself, whose sun disc
 * would land in the cube map and light everything a second time. Without it the car's dark plastics had
 * only the hemisphere's flat fill and, on the Medium tier, the roof's shadow kept the sun off them, so the
 * cabin read as black. SwiftCar turns the car's share of it up (CAR.cabinLight).
 * With `shadows` (the Medium tier) the sun casts a 1024 px shadow map kept centred on the car.
 */
export function Daylight({ shadows = false, follow }: { shadows?: boolean; follow?: () => THREE.Object3D | null }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const light = sun.current;
    const target = follow?.();
    if (!shadows || !light || !target) return;
    target.getWorldPosition(at);
    light.position.copy(at).add(SUN_FROM_CAR);
    light.target.position.copy(at);
    light.target.updateMatrixWorld();
  });
  return (
    <>
      <Sky distance={4500} sunPosition={SUN.toArray()} turbidity={3} rayleigh={0.8} mieCoefficient={0.004} />
      <Environment frames={1} resolution={64}>
        <SkyDome />
      </Environment>
      <hemisphereLight args={['#e8f2ff', '#7a8f5a', HEMI_INTENSITY]} />
      <directionalLight
        ref={sun}
        position={SUN.toArray()}
        intensity={2.2}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-SHADOW_HALF_M}
        shadow-camera-right={SHADOW_HALF_M}
        shadow-camera-top={SHADOW_HALF_M}
        shadow-camera-bottom={-SHADOW_HALF_M}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
    </>
  );
}

const DOME_R = 300;
const ZENITH = new THREE.Color('#7fb2e5');
const HORIZON = new THREE.Color('#e6eef2');
const GROUND = new THREE.Color('#6f7363');

/** The light probe's sky: a sphere coloured by height, seen from inside. */
function SkyDome() {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(DOME_R, 32, 16);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const up = pos.getY(i) / DOME_R;
      if (up >= 0) c.copy(HORIZON).lerp(ZENITH, Math.pow(up, 0.6));
      else c.copy(HORIZON).lerp(GROUND, Math.min(1, -up * 6));
      c.toArray(colors, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} />
    </mesh>
  );
}

const carAt = new THREE.Vector3();
/** `v`, moved so a view `half` wide either side stays inside [lo, hi]; centred if the view is wider. */
const keepInside = (v: number, lo: number, hi: number, half: number) =>
  hi - lo <= 2 * half ? (lo + hi) / 2 : Math.min(hi - half, Math.max(lo + half, v));

interface TopDownProps {
  active: boolean;
  /** 1 frames the whole site; above 1 the view closes in on `follow`, kept inside the site. */
  zoom?: () => number;
  /** Wheel and pinch on the canvas ask for this factor. */
  onZoom?: (factor: number) => void;
  follow?: () => THREE.Object3D | null;
}

/** A straight-down orthographic camera, north up, framed to the site and zoomable onto the car. */
export function TopDownCamera({ active, zoom = () => 1, onZoom, follow }: TopDownProps) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const cam = useRef<THREE.OrthographicCamera>(null);
  const [x0, y0, x1, y1] = circuit.site.bounds;
  const fit = Math.min(size.width / (x1 - x0), size.height / (y1 - y0));

  useEffect(() => {
    if (!active || !onZoom) return;
    const el = gl.domElement;
    const wheel = (e: WheelEvent) => { e.preventDefault(); onZoom(Math.exp(-e.deltaY * 0.0015)); };
    const pts = new Map<number, [number, number]>();
    let span = 0;
    const spread = () => { const [a, b] = [...pts.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    const down = (e: PointerEvent) => { pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) span = spread(); };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size !== 2 || span <= 0) return;
      const now = spread();
      onZoom(now / span);
      span = now;
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); span = 0; };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [active, gl, onZoom]);

  useFrame(() => {
    const c = cam.current;
    if (!active || !c) return;
    const z = zoom();
    if (c.zoom !== fit * z) {
      c.zoom = fit * z;
      c.updateProjectionMatrix();
    }
    let x = (x0 + x1) / 2;
    let y = (y0 + y1) / 2;
    const target = z > 1 ? follow?.() : null;
    if (target) {
      target.getWorldPosition(carAt);
      x = carAt.x;
      y = -carAt.z;
    }
    c.position.set(keepInside(x, x0, x1, size.width / c.zoom / 2), 150, -keepInside(y, y0, y1, size.height / c.zoom / 2));
  });

  return (
    <OrthographicCamera
      ref={cam}
      makeDefault={active}
      position={[(x0 + x1) / 2, 150, -(y0 + y1) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      zoom={fit}
      near={1}
      far={400}
    />
  );
}
