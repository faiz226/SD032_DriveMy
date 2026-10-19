// A part of the car's own surface, copied out as its own mesh so an image can be laid square on it: the
// needles on the dials (Cluster.tsx) and the mirror images on the mirror glass (MirrorView.tsx). The same
// technique the Godot build used (godot/scripts/car.gd, _glass_mesh): an image drawn on the part the car
// already models reads as part of the car, where one drawn beside it reads as a sticker in the cabin.
import * as THREE from 'three';

export interface SurfacePick {
  /** The material the part carries in the car's file. */
  material: string;
  /** The part's centre, car frame; triangles of that material further than `radius` are someone else's. */
  at: readonly number[];
  radius: number;
}

const LIFT_M = 0.002;   // in front of the original: enough to win the depth test, too little to see

const v3 = (a: readonly number[]) => new THREE.Vector3(a[0], a[1], a[2]);

/**
 * The picked part as its own mesh, in the car frame, lifted 2 mm toward the eye, with a planar unwrap: u runs
 * left to right as the driver sees it, v bottom to top. The source UVs address the car's shared texture
 * atlas, so they are no use for this. `width` and `height` are the part's extents in metres. Null if the
 * model has no such part.
 */
export function flatFace(body: THREE.Object3D, pick: SurfacePick, eye: readonly number[]) {
  const centre = v3(pick.at);
  body.updateMatrixWorld(true);
  const toBody = body.matrixWorld.clone().invert();
  const pts: THREE.Vector3[] = [];
  const tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const mid = new THREE.Vector3();
  body.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || (mesh.material as THREE.Material).name !== pick.material) return;
    const m = toBody.clone().multiply(mesh.matrixWorld);
    const pos = mesh.geometry.attributes.position;
    const index = mesh.geometry.index;
    const count = index ? index.count : pos.count;
    for (let t = 0; t < count; t += 3) {
      for (let k = 0; k < 3; k++) tri[k].fromBufferAttribute(pos, index ? index.getX(t + k) : t + k).applyMatrix4(m);
      mid.copy(tri[0]).add(tri[1]).add(tri[2]).divideScalar(3);
      if (mid.distanceTo(centre) <= pick.radius) pts.push(...tri.map((p) => p.clone()));
    }
  });
  if (pts.length < 3) return null;

  const ctr = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(pts.length);
  // the normal of the largest triangle, a better estimate on a shallow curve than an average
  const normal = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  let best = 0;
  for (let t = 0; t < pts.length; t += 3) {
    const cr = e1.subVectors(pts[t + 1], pts[t]).cross(e2.subVectors(pts[t + 2], pts[t]));
    if (cr.length() > best) { best = cr.length(); normal.copy(cr).normalize(); }
  }
  // Turned to face the driver before anything is derived from it: a cross product's sign is arbitrary, and a
  // flipped normal would mirror the unwrap left to right.
  const toEye = v3(eye).sub(ctr);
  if (normal.dot(toEye) < 0) normal.negate();
  const right = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
  const up = normal.clone().cross(right).normalize();

  const d = new THREE.Vector3();
  const flat = pts.map((p) => { d.subVectors(p, ctr); return [d.dot(right), d.dot(up)]; });
  const lo = [Math.min(...flat.map((f) => f[0])), Math.min(...flat.map((f) => f[1]))];
  const span = [Math.max(...flat.map((f) => f[0])) - lo[0], Math.max(...flat.map((f) => f[1])) - lo[1]];
  const lift = toEye.normalize().multiplyScalar(LIFT_M);
  const position = new Float32Array(pts.length * 3);
  const uv = new Float32Array(pts.length * 2);
  pts.forEach((p, i) => {
    p.clone().add(lift).toArray(position, i * 3);
    uv[i * 2] = (flat[i][0] - lo[0]) / span[0];
    uv[i * 2 + 1] = (flat[i][1] - lo[1]) / span[1];
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return { geometry, width: span[0], height: span[1] };
}
