// @vitest-environment node
// A restart sets the other cars out afresh, each somewhere new in one step: one touching the learner's car must
// leave it where it is, not throw it off the yard with the speed of its jump.
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { beforeAll, expect, it } from 'vitest';
import { G, SWIFT_DRIVE as P } from '../physics/drive';
import { IDLE, Vehicle } from '../physics/vehicle';
import { moveBox } from './TrafficView';

beforeAll(async () => {
  await RAPIER.init();
});

it('set out afresh, a car touching ours jumps away without taking it along', () => {
  const world = new RAPIER.World({ x: 0, y: -G, z: 0 });
  world.timestep = P.dt;
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(500, 0.5, 500).setTranslation(0, -0.5, 0), ground);
  const car = new Vehicle(RAPIER, world, { x: 0, y: P.radius + 0.02, z: 0, yaw: 0 });
  const step = () => { car.beforeStep({ ...IDLE, brake: 1 }); world.step(); car.afterStep(false); };
  for (let k = 0; k < 60; k++) step();
  // the other car, a box the Swift's size, rolls up to our tail at 9 km/h and leans on it
  const turn = new THREE.Quaternion();
  let x = -4.5;
  const box = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, 0.65, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(1.92, 0.72, 0.85), box);
  for (let k = 0; k < 60; k++) { x += 2.5 * P.dt; moveBox(box, { x, y: 0.65, z: 0 }, turn); step(); }
  moveBox(box, { x: x + 30, y: 0.65, z: 0 }, turn);   // the restart
  let top = 0;
  for (let k = 0; k < 60; k++) {
    step();
    const v = car.body.linvel();
    top = Math.max(top, Math.hypot(v.x, v.y, v.z) * 3.6);
  }
  expect(top).toBeLessThan(15);
});
