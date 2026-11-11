// @vitest-environment node
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { closePillars, seenFromSeat, triangles } from './pillars';

// Node's file reading, typed here by hand: the app's TypeScript project has no Node types
const { readFileSync } = (await import(/* @vite-ignore */ `node:${'fs'}`)) as { readFileSync(file: URL): Uint8Array };

/** The body's triangles as the car shows them (its one node is untransformed), each part named by its material. */
function body(tier: 'low' | 'medium') {
  const glb = readFileSync(new URL(`../../../public/sim/cars/swift-2022/${tier}/body.glb`, import.meta.url));
  const jsonLength = new DataView(glb.buffer, glb.byteOffset, glb.byteLength).getUint32(12, true);
  const gltf = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLength)));
  const bin = glb.subarray(28 + jsonLength);
  const read = (i: number, Type: Float32ArrayConstructor | Uint16ArrayConstructor, size: number) => {
    const a = gltf.accessors[i];
    const start = (gltf.bufferViews[a.bufferView].byteOffset ?? 0) + (a.byteOffset ?? 0);
    return new Type(new Uint8Array(bin.subarray(start, start + a.count * size * Type.BYTES_PER_ELEMENT)).buffer);   // a copy: aligned
  };
  const group = new THREE.Group();
  for (const mesh of gltf.meshes) {
    for (const part of mesh.primitives) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(read(part.attributes.POSITION, Float32Array, 3), 3));
      g.setIndex(new THREE.BufferAttribute(read(part.indices, Uint16Array, 1), 1));
      group.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ name: gltf.materials[part.material].name })));
    }
  }
  return group;
}

/** Every triangle near the right windscreen pillar, in the car frame, nine numbers each. */
function nearPillar(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3(new THREE.Vector3(-0.3, 0.5, 0.2), new THREE.Vector3(1.2, 1.35, 1.0));
  const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const bounds = new THREE.Box3();
  const out: number[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.getAttribute('position');
    const list = triangles(mesh.geometry);
    for (let k = 0; k < list.length; k += 3) {
      a.fromBufferAttribute(pos, list[k]).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(pos, list[k + 1]).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(pos, list[k + 2]).applyMatrix4(mesh.matrixWorld);
      if (bounds.setFromPoints([a, b, c]).intersectsBox(box)) out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  });
  return Float64Array.from(out);
}

/** Whether a ray meets any triangle, from either side, within `far` (Moller-Trumbore). */
function blocked(t: Float64Array, o: THREE.Vector3, d: THREE.Vector3, far: number) {
  for (let i = 0; i < t.length; i += 9) {
    const e1x = t[i + 3] - t[i], e1y = t[i + 4] - t[i + 1], e1z = t[i + 5] - t[i + 2];
    const e2x = t[i + 6] - t[i], e2y = t[i + 7] - t[i + 1], e2z = t[i + 8] - t[i + 2];
    const px = d.y * e2z - d.z * e2y, py = d.z * e2x - d.x * e2z, pz = d.x * e2y - d.y * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) < 1e-12) continue;
    const sx = o.x - t[i], sy = o.y - t[i + 1], sz = o.z - t[i + 2];
    const u = (sx * px + sy * py + sz * pz) / det;
    if (u < 0 || u > 1) continue;
    const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
    const v = (d.x * qx + d.y * qy + d.z * qz) / det;
    if (v < 0 || u + v > 1) continue;
    const s = (e2x * qx + e2y * qy + e2z * qz) / det;
    if (s > 1e-6 && s < far) return true;
  }
  return false;
}

/** The pixels around the right windscreen pillar, in the driver's view at 1280 x 800, whose ray leaves the car. */
function gaps(root: THREE.Object3D) {
  const camera = new THREE.PerspectiveCamera(CAR.eyeView.fovDeg, 1280 / 800, 0.05, 600);
  camera.position.set(...CAR.eye);
  camera.rotation.set(CAR.eyeView.pitch, -Math.PI / 2, 0, 'YXZ');
  camera.updateMatrixWorld();
  const tris = nearPillar(root);
  const ray = new THREE.Raycaster();
  const out: [number, number][] = [];
  for (let y = 0; y < 320; y += 4) {
    for (let x = 900; x < 1080; x += 4) {
      ray.setFromCamera(new THREE.Vector2((x / 1280) * 2 - 1, 1 - (y / 800) * 2), camera);
      if (!blocked(tris, ray.ray.origin, ray.ray.direction, 3)) out.push([x, y]);
    }
  }
  return out;
}

describe('the windscreen pillars from the seat (the owner, 10 Nov)', () => {
  for (const tier of ['low', 'medium'] as const) {
    it(`show no sky through the gaps the model leaves, and no red inside the frames (${tier})`, () => {
      const car = body(tier);
      expect(gaps(car).length).toBeGreaterThan(0);   // the model as it comes
      closePillars(car);
      expect(gaps(car)).toEqual([]);
      car.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && (mesh.material as THREE.Material).name === 'Door_carPaint') {
          expect(seenFromSeat(mesh, triangles(mesh.geometry)).seen).toEqual([]);   // the faces the seat sees went black
        }
      });
    }, 60_000);
  }
});
