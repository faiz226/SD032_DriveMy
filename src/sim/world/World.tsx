// The practice yard in the scene: the cached meshes, their textures, and the fixed colliders.
import { OrthographicCamera, Sky, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { textureFiles } from '../assets';
import { circuit } from '../data';
import { getWorld } from './build';
import { addWorldColliders } from './colliders';

export type Tier = 'low' | 'medium';

const TILE_M = { concrete: 4, grass: 6 };   // one texture tile covers this many metres

export function World({ tier = 'low' }: { tier?: Tier }) {
  const world = getWorld(circuit);
  const physics = useRapier();
  useEffect(() => {
    const added = addWorldColliders(physics.rapier, physics.world, world);
    return () => added.remove();
  }, [physics.rapier, physics.world, world]);
  const [concrete, grass] = useTexture(textureFiles(tier));

  useLayoutEffect(() => {
    const maps: [THREE.Texture, number, THREE.MeshStandardMaterial][] = [
      [concrete, TILE_M.concrete, world.materials.concrete],
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
  }, [world, concrete, grass]);

  useLayoutEffect(() => {
    world.group.traverse((o) => { o.receiveShadow = true; });   // used only when the tier turns shadows on
  }, [world]);

  return <primitive object={world.group} dispose={null} />;
}

const SUN = new THREE.Vector3(60, 80, 30);
const SUN_FROM_CAR = SUN.clone().setLength(55);
const SHADOW_HALF_M = 18;   // the shadow map covers this far around the car
const at = new THREE.Vector3();

/**
 * Daylight: a sky, a hemisphere fill and the sun. No environment map, so nothing loads from the network.
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
      <hemisphereLight args={['#e8f2ff', '#7a8f5a', 1.3]} />
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

/** A straight-down orthographic camera framed to the site, north up. */
export function TopDownCamera({ active }: { active: boolean }) {
  const size = useThree((s) => s.size);
  const [x0, y0, x1, y1] = circuit.site.bounds;
  const zoom = Math.min(size.width / (x1 - x0), size.height / (y1 - y0));
  return (
    <OrthographicCamera
      makeDefault={active}
      position={[(x0 + x1) / 2, 150, -(y0 + y1) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      zoom={zoom}
      near={1}
      far={400}
    />
  );
}
