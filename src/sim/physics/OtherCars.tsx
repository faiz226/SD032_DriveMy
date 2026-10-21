// The other learners (the owner, 20 Oct): stopped mid-test on the twin hill and ramp, facing the way we do. The
// same Swift, merged into one mesh with each material's colour on its vertices (a textured one's averaged, the
// paint left white so each car takes its own tint), both cars in one draw call. Each has a solid box, so our car
// cannot drive through it. They are scenery: nothing marks them.
import { useGLTF } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { circuit } from '../data';
import type { Tier } from '../quality';
import { getWorld } from '../world/build';
import { SWIFT_2022 as CAR } from './cars/swift-2022';

const PAINT = /car_?paint/i;                       // the body colour's materials: tinted per car
const GLASS = new THREE.Color(0.05, 0.07, 0.09);
// white, silver-blue, then the moving cars' (traffic/TrafficView.tsx): dark grey, maroon, sky blue, silver
export const TINTS = [[0.93, 0.93, 0.92], [0.55, 0.62, 0.72], [0.22, 0.23, 0.25], [0.45, 0.07, 0.09], [0.42, 0.62, 0.82], [0.72, 0.73, 0.74]]
  .map(([r, g, b]) => new THREE.Color(r, g, b));
/** The Swift's solid box, about its rear axle's height point: the colliders of the parked and moving cars. */
export const BODY = { halfLength: CAR.config.length_m / 2, halfHeight: 0.72, halfWidth: CAR.config.width_body_m / 2, rise: 0.35 };

// each texture's average colour, worked out once: the car's meshes share a few textures
const average = new WeakMap<object, THREE.Color>();
// the cabin's insides, which these cars' dark, opaque glass hides: left out (a third of the body's triangles)
const INSIDE = /^(dash|console|seath?_|seat_|roof_(beige|blackleather|seatb|pedal)|roof_carpet|door_cloth|ornamelta|defros|sticker_plas|stiker_silver)/i;

/** A material's colour as one value: its own colour, times its texture's average where it has one. */
function colourOf(m: THREE.MeshStandardMaterial): THREE.Color {
  if (m.transparent || m.opacity < 1) return GLASS;
  const c = m.color.clone();
  if (PAINT.test(m.name) && c.r > 0.4 && c.g < 0.1) return new THREE.Color(1, 1, 1);
  const image = m.map?.image as CanvasImageSource | undefined;
  if (image && average.has(image)) return c.multiply(average.get(image)!);
  if (image) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 4;
    const g = canvas.getContext('2d');
    if (g) {
      g.drawImage(image, 0, 0, 4, 4);
      const px = g.getImageData(0, 0, 4, 4).data;
      let r = 0, gr = 0, b = 0;
      for (let i = 0; i < px.length; i += 4) { r += px[i]; gr += px[i + 1]; b += px[i + 2]; }
      const mean = new THREE.Color().setRGB(r / 16 / 255, gr / 16 / 255, b / 16 / 255, THREE.SRGBColorSpace);
      average.set(image, mean);
      c.multiply(mean);
    }
  }
  return c;
}

/** Every mesh of `scene` as plain coloured triangles, placed by `place`, in the car's frame. */
function solids(scene: THREE.Object3D, place: THREE.Matrix4) {
  scene.updateMatrixWorld(true);
  const out: THREE.BufferGeometry[] = [];
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || INSIDE.test((mesh.material as THREE.Material).name)) return;
    let g = mesh.geometry.clone();
    if (g.index) g = g.toNonIndexed();
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    g.applyMatrix4(place.clone().multiply(mesh.matrixWorld));
    const c = colourOf(mesh.material as THREE.MeshStandardMaterial);
    const n = g.attributes.position.count;
    const colour = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) colour.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colour, 3));
    out.push(g);
  });
  return out;
}

/** Where each car stands: on its slope, pitched with it, its wheels' centres at their radius above it. */
function poses() {
  const ground = getWorld(circuit).surfaceHeight;
  const half = (CAR.axle.front - CAR.axle.rear) / 2;
  return (circuit.props.npc_cars ?? []).map(({ at, heading_deg }) => {
    const h = THREE.MathUtils.degToRad(heading_deg);
    const [ux, uy] = [Math.cos(h), Math.sin(h)];
    const front = ground(at[0] + ux * half, at[1] + uy * half);
    const rear = ground(at[0] - ux * half, at[1] - uy * half);
    const position = new THREE.Vector3(at[0], (front + rear) / 2 + CAR.wheelRadius, -at[1]);
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, h, Math.atan2(front - rear, 2 * half), 'YZX'));
    return { position, quaternion };
  });
}

/** The four wheels' hubs in the car frame, front first, left before right; the right-hand ones are turned round. */
export const WHEELS = [[CAR.axle.front, -1], [CAR.axle.front, 1], [CAR.axle.rear, -1], [CAR.axle.rear, 1]].map(([x, side]) => ({
  front: x > 0,
  hub: new THREE.Vector3(x, 0, side * CAR.axle.halfTrack),
  turn: new THREE.Matrix4().makeRotationY(side > 0 ? Math.PI : 0),   // the same wheel turned round, as on our car
}));

/**
 * The Swift as one coloured geometry about the wheelbase's middle, its paint left white: with its wheels (standing
 * still), or the body alone for cars whose wheels turn (wheelGeometry).
 */
export function swiftGeometry(body: THREE.Object3D, wheel: THREE.Object3D, wheels = true): THREE.BufferGeometry {
  // the body is worked out once for the parked cars and the moving ones; each gets its own copy to dispose
  let shell = shells.get(body);
  if (!shell) {
    const parts = solids(body, new THREE.Matrix4());
    shell = mergeGeometries(parts);
    for (const p of parts) p.dispose();
    shells.set(body, shell);
  }
  if (!wheels) return shell.clone();
  const parts = WHEELS.flatMap((w) => solids(wheel, new THREE.Matrix4().setPosition(w.hub).multiply(w.turn)));
  const geometry = mergeGeometries([shell, ...parts]);
  for (const p of parts) p.dispose();
  return geometry;
}
const shells = new WeakMap<THREE.Object3D, THREE.BufferGeometry>();

/** One wheel as a coloured geometry about its hub, axle along z: the moving cars turn and steer each of theirs. */
export function wheelGeometry(wheel: THREE.Object3D): THREE.BufferGeometry {
  const parts = solids(wheel, new THREE.Matrix4());
  const geometry = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return geometry;
}

export function OtherCars({ tier }: { tier: Tier }) {
  const files = CAR.files(tier);
  const body = useGLTF(files.body);
  const wheel = useGLTF(files.wheel);
  const where = useMemo(() => poses(), []);
  const mesh = useMemo(() => {
    if (!where.length) return null;
    const geometry = swiftGeometry(body.scene, wheel.scene);
    const m = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.15 }), where.length);
    where.forEach(({ position, quaternion }, i) => {
      m.setMatrixAt(i, new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1)));
      m.setColorAt(i, TINTS[i % TINTS.length]);
    });
    m.frustumCulled = false;   // two cars far apart: one bounding sphere at the origin would cull them wrongly
    return m;
  }, [body.scene, wheel.scene, where]);
  useEffect(() => () => { mesh?.geometry.dispose(); (mesh?.material as THREE.Material | undefined)?.dispose(); mesh?.dispose(); }, [mesh]);

  if (!mesh) return null;
  return (
    <>
      <primitive object={mesh} />
      {where.map(({ position, quaternion }, i) => (
        <RigidBody key={i} type="fixed" colliders={false} position={position.toArray()} quaternion={quaternion.toArray() as [number, number, number, number]}>
          <CuboidCollider args={[BODY.halfLength, BODY.halfHeight, BODY.halfWidth]} position={[0, BODY.rise, 0]} />
        </RigidBody>
      ))}
    </>
  );
}
