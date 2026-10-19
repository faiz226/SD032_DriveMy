// The yard's fixed colliders, made directly on a Rapier world. The app (World.tsx, through
// useRapier) and the headless tests call this same function, so a test drives the real kerbs.
import type { World } from '@dimforge/rapier3d-compat';
import type { WorldBuild } from './build';

type Rapier = typeof import('@dimforge/rapier3d-compat').default;

export interface WorldColliders {
  /** Collider handle -> index into circuit.obstacles.poles. */
  poles: Map<number, number>;
  remove(): void;
}

const yawQuat = (yaw: number) => ({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });

const registry = new WeakMap<World, WorldColliders>();

/** The yard's colliders on a world, once World.tsx (or a test) has added them. */
export const collidersOf = (world: World) => registry.get(world);

export function addWorldColliders(R: Rapier, world: World, build: WorldBuild): WorldColliders {
  const { ground, trimeshes, boxes, poles } = build.colliders;
  const body = world.createRigidBody(R.RigidBodyDesc.fixed());
  world.createCollider(R.ColliderDesc.cuboid(...ground.halfExtents).setTranslation(...ground.position), body);
  for (const t of trimeshes) world.createCollider(R.ColliderDesc.trimesh(t.vertices, t.indices), body);
  for (const b of boxes) {
    world.createCollider(R.ColliderDesc.cuboid(...b.halfExtents).setTranslation(...b.position).setRotation(yawQuat(b.rotationY)), body);
  }
  const map = new Map<number, number>();
  const poleBodies = poles.map((p) => {
    const pb = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(...p.position));
    const c = world.createCollider(R.ColliderDesc.cylinder(p.halfHeight, p.radius), pb);
    map.set(c.handle, p.index);
    return pb;
  });
  const added: WorldColliders = {
    poles: map,
    remove() {
      // only what is still in the current world: see Vehicle.dispose
      for (const b of [...poleBodies, body]) if (world.getRigidBody(b.handle)) world.removeRigidBody(b);
      registry.delete(world);
    },
  };
  registry.set(world, added);
  return added;
}
