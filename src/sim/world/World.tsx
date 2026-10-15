// The practice yard in the scene: the cached meshes, their textures, and the fixed colliders.
import { OrthographicCamera, Sky, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { CuboidCollider, CylinderCollider, RigidBody, TrimeshCollider } from '@react-three/rapier';
import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { circuit } from '../data';
import { getWorld } from './build';

export type Tier = 'low' | 'medium';

const TILE_M = { concrete: 4, grass: 6 };   // one texture tile covers this many metres

export function World({ tier = 'low' }: { tier?: Tier }) {
  const world = getWorld(circuit);
  const px = tier === 'low' ? 512 : 1024;
  const [concrete, grass] = useTexture([`/sim/textures/concrete-${px}.webp`, `/sim/textures/grass-${px}.webp`]);

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

  const { ground, trimeshes, boxes, poles } = world.colliders;
  return (
    <>
      <primitive object={world.group} dispose={null} />
      <RigidBody type="fixed" colliders={false} name="world">
        <CuboidCollider args={ground.halfExtents} position={ground.position} />
        {trimeshes.map((t) => <TrimeshCollider key={t.name} args={[t.vertices, t.indices]} />)}
        {boxes.map((b) => <CuboidCollider key={b.name} args={b.halfExtents} position={b.position} rotation={[0, b.rotationY, 0]} />)}
      </RigidBody>
      {poles.map((p) => (
        <RigidBody key={p.index} type="fixed" colliders={false} position={p.position} userData={{ pole: p.index }}>
          <CylinderCollider args={[p.halfHeight, p.radius]} />
        </RigidBody>
      ))}
    </>
  );
}

/** Daylight: a sky, a hemisphere fill and the sun. No environment map, so nothing loads from the network. */
export function Daylight() {
  return (
    <>
      <Sky distance={4500} sunPosition={[60, 80, 30]} turbidity={6} rayleigh={1.2} />
      <hemisphereLight args={['#dfeeff', '#6f8f4f', 0.9]} />
      <directionalLight position={[60, 80, 30]} intensity={1.6} />
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
