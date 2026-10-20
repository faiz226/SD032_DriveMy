// The other cars and the signals in the scene. The traffic model (model.ts) is stepped with the physics by the page;
// this draws it: every moving car in one instanced mesh, each with a solid box our car cannot drive through, and the
// signal lamps lit from the model's clock.
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, type RapierRigidBody, RigidBody, useBeforePhysicsStep } from '@react-three/rapier';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { circuit } from '../data';
import { BODY, TINTS, swiftGeometry } from '../physics/OtherCars';
import { SWIFT_2022 as CAR } from '../physics/cars/swift-2022';
import type { Tier } from '../quality';
import { getWorld } from '../world/build';
import type { Traffic } from './model';

const LIT = { red: new THREE.Color(1, 0.08, 0.04), amber: new THREE.Color(1, 0.55, 0.02), green: new THREE.Color(0.1, 1, 0.35) };
const DARK = 0.12;   // an unlit lamp shows this much of its colour
const LAMP_R = 0.1;
const UP = new THREE.Vector3(0, 1, 0);
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const v = new THREE.Vector3();
const one = new THREE.Vector3(1, 1, 1);

/** Where a car drawn about its wheelbase's middle sits for a rear-axle pose on flat ground (the loops never climb). */
function place(x: number, y: number, heading: number) {
  const half = (CAR.axle.front - CAR.axle.rear) / 2;
  v.set(x + Math.cos(heading) * half, CAR.wheelRadius, -(y + Math.sin(heading) * half));
  q.setFromAxisAngle(UP, heading);
  return m4.compose(v, q, one);
}

/** Send an instanced mesh's new matrices and colours to the GPU (outside the component: hooks keep memos immutable). */
function upload(m: THREE.InstancedMesh) {
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
}

export function TrafficView({ tier, traffic }: { tier: Tier; traffic: () => Traffic }) {
  const files = CAR.files(tier);
  const body = useGLTF(files.body);
  const wheel = useGLTF(files.wheel);
  const count = traffic().cars.length;
  const cars = useMemo(() => {
    const m = new THREE.InstancedMesh(swiftGeometry(body.scene, wheel.scene), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.15 }), count);
    for (let i = 0; i < count; i++) m.setColorAt(i, TINTS[(i + 2) % TINTS.length]);
    m.frustumCulled = false;   // spread over the yard: one bounding sphere would cull them wrongly
    return m;
  }, [body.scene, wheel.scene, count]);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);

  // the lamps: three discs on each head's face, lit by its group's light
  const lamps = getWorld(circuit).lamps;
  const discs = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.CircleGeometry(LAMP_R, 16), new THREE.MeshBasicMaterial({ toneMapped: false }), lamps.length);
    lamps.forEach((lamp, i) => {
      q.setFromAxisAngle(UP, lamp.facing + Math.PI / 2);   // a disc faces +Z; turn it to face along the lamp's heading
      m.setMatrixAt(i, m4.compose(lamp.position, q, one));
      m.setColorAt(i, LIT[lamp.colour].clone().multiplyScalar(DARK));
    });
    m.frustumCulled = false;
    return m;
  }, [lamps]);
  useEffect(() => () => {
    for (const m of [cars, discs]) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); m.dispose(); }
  }, [cars, discs]);

  // the solid boxes follow the cars a physics step at a time
  useBeforePhysicsStep(() => {
    traffic().poses().forEach((p, i) => {
      const rb = bodies.current[i];
      if (!rb) return;
      place(p.x, p.y, p.heading).decompose(v, q, new THREE.Vector3());
      rb.setNextKinematicTranslation({ x: v.x, y: v.y + BODY.rise, z: v.z });
      rb.setNextKinematicRotation(q);
    });
  });

  useFrame(() => {
    const model = traffic();
    model.poses().forEach((p, i) => cars.setMatrixAt(i, place(p.x, p.y, p.heading)));
    upload(cars);
    lamps.forEach((lamp, i) => {
      const lit = model.lights(lamp.signal)[lamp.group] === lamp.colour;
      discs.setColorAt(i, lit ? LIT[lamp.colour] : LIT[lamp.colour].clone().multiplyScalar(DARK));
    });
    upload(discs);
  });

  return (
    <>
      <primitive object={cars} />
      <primitive object={discs} />
      {traffic().poses().map((p, i) => {
        place(p.x, p.y, p.heading).decompose(v, q, new THREE.Vector3());
        return (
          <RigidBody key={p.id} ref={(rb) => { bodies.current[i] = rb; }} type="kinematicPosition" colliders={false}
            position={[v.x, v.y + BODY.rise, v.z]} quaternion={[q.x, q.y, q.z, q.w]}>
            <CuboidCollider args={[BODY.halfLength, BODY.halfHeight, BODY.halfWidth]} />
          </RigidBody>
        );
      })}
    </>
  );
}
