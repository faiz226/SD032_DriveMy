// The windscreen pillars from the seat (the owner, 3 and 10 Nov: "pillar still broken"). The model paints the doors'
// window frames red on the inside too, so a red band ran up each pillar between the trim and the glass, where the real
// car's grey trim meets black. Between the frame, its seal, the trim and the glass it leaves hairline gaps that showed
// the sky, and the seal's toothed edge lay over the trim. Here, on a copy of the car's body:
//   - the frame faces turned toward the seat take black plastic (the outside stays red);
//   - the seal sits a little further from the driver's eye, behind the trim's own clean edge;
//   - a narrow black band runs along the open edges of the faces seen from the seat (the frames, the seals and the
//     pillars' trim), leaning back behind them, so only a gap lets it show.
import * as THREE from 'three';
import { SWIFT_2022 as CAR } from './cars/swift-2022';

const FRAME_BLACK = new THREE.MeshStandardMaterial({ name: 'Frame_Black', color: 0x0b0b0b, roughness: 0.55 });
// drawn a little behind its depth, so where it meets a surface the surface stays in front
const GAP_BLACK = new THREE.MeshBasicMaterial({
  name: 'Gap_Black', color: 0x060606, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 4,
});
const FACING = 0.15;       // a face turned this far toward the seat's eye (cosine) counts as seen from the cabin
const BAND_M = 0.006;      // the band's width: the widest of those gaps is 3 mm
const BAND_LEAN = 0.6;     // how far back the band leans behind its edge, against 1 straight out
const SEAL_BACK_M = 0.012; // the seal's edge lies up to 9 mm in front of the trim
const A_PILLAR = { fromX: 0.1, outZ: 0.4 };   // the windscreen pillars' trim: ahead of this, and this far out (m)

/** On the body's own copy (SwiftCar clones it): the loaded model, shared by every copy of the car, stays as it is. */
export function closePillars(body: THREE.Object3D) {
  body.updateMatrixWorld(true);
  const doors: THREE.Mesh[] = [];
  const seals: THREE.Mesh[] = [];
  const trims: THREE.Mesh[] = [];
  body.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const name = (mesh.material as THREE.Material).name;
    if (name === 'Door_carPaint') doors.push(mesh);
    else if (name === 'Door_Rubber') seals.push(mesh);
    else if (name === 'Roof_Beige_Plas' || name === 'Roof_BeigeFab') trims.push(mesh);   // the Low tier merges the two
  });
  for (const mesh of trims) {
    const all = triangles(mesh.geometry);
    addBand(mesh, all, seenFromSeat(mesh, all, (mid) => mid.x > A_PILLAR.fromX && Math.abs(mid.z) > A_PILLAR.outZ).seen);
  }
  const eye = new THREE.Vector3(...CAR.eye);
  const p = new THREE.Vector3();
  for (const mesh of seals) {
    const g = mesh.geometry.clone();
    const pos = g.getAttribute('position');
    const toLocal = mesh.matrixWorld.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      const d = p.distanceTo(eye);
      p.sub(eye).multiplyScalar((d + SEAL_BACK_M) / d).add(eye).applyMatrix4(toLocal);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    g.computeBoundingSphere();
    mesh.geometry = g;
    const all = triangles(g);
    addBand(mesh, all, seenFromSeat(mesh, all).seen);
  }
  for (const mesh of doors) {
    const g = mesh.geometry;
    const all = triangles(g);
    const { seen, unseen } = seenFromSeat(mesh, all);
    if (seen.length === 0) continue;
    mesh.geometry = sharing(g, unseen);   // new index lists over the same vertices
    const frame = new THREE.Mesh(sharing(g, seen), FRAME_BLACK);
    frame.castShadow = mesh.castShadow;
    mesh.add(frame);
    addBand(mesh, all, seen);
  }
}

/** A mesh's triangles split by whether they face the eye of whoever sits on their side of the car (and lie `where`). */
export function seenFromSeat(mesh: THREE.Mesh, all: number[], where: (mid: THREE.Vector3) => boolean = () => true) {
  const pos = mesh.geometry.getAttribute('position');
  const toCar = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const flip = mesh.matrixWorld.determinant() < 0 ? -1 : 1;   // a mirrored node turns its faces round
  const [tri, n, mid, toEye] = [new THREE.Triangle(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const seen: number[] = [];
  const unseen: number[] = [];
  for (let k = 0; k < all.length; k += 3) {
    tri.setFromAttributeAndIndices(pos, all[k], all[k + 1], all[k + 2]);
    tri.getNormal(n).applyMatrix3(toCar).normalize().multiplyScalar(flip);
    tri.getMidpoint(mid).applyMatrix4(mesh.matrixWorld);
    // the driver's eye, or its mirror image for the left of the car
    toEye.set(CAR.eye[0], CAR.eye[1], Math.sign(mid.z) * Math.abs(CAR.eye[2])).sub(mid).normalize();
    (n.dot(toEye) > FACING && where(mid) ? seen : unseen).push(all[k], all[k + 1], all[k + 2]);
  }
  return { seen, unseen };
}

export function triangles(g: THREE.BufferGeometry): number[] {
  const index = g.getIndex();
  return index ? Array.from(index.array) : Array.from({ length: g.getAttribute('position').count }, (_, i) => i);
}

function sharing(g: THREE.BufferGeometry, index: number[]) {
  const part = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(g.attributes)) part.setAttribute(name, attribute);
  part.setIndex(index);
  return part;
}

/**
 * The band along the open edges of `along` (triangles, three vertices each): an edge is open when no other triangle
 * of `all` shares it, vertices welded at 0.05 mm, as the model splits them at its seams. Each piece leans back from
 * the side its triangle shows, so wherever the model's own surfaces meet it, it stays behind them.
 */
function addBand(mesh: THREE.Mesh, all: number[], along: number[]) {
  const pos = mesh.geometry.getAttribute('position');
  const scale = mesh.matrixWorld.getMaxScaleOnAxis();
  const front = mesh.matrixWorld.determinant() < 0 ? -1 : 1;   // a mirrored node shows its triangles' other side
  const weld = 5e-5 / scale;
  const ids = new Map<string, number>();
  const id = (v: number) => {
    const k = `${Math.round(pos.getX(v) / weld)},${Math.round(pos.getY(v) / weld)},${Math.round(pos.getZ(v) / weld)}`;
    let i = ids.get(k);
    if (i === undefined) ids.set(k, (i = ids.size));
    return i;
  };
  const edge = (a: number, b: number) => {
    const [i, j] = [id(a), id(b)];
    return i < j ? i * 4194304 + j : j * 4194304 + i;
  };
  const uses = new Map<number, number>();
  for (let k = 0; k < all.length; k += 3) {
    for (const [a, b] of [[all[k], all[k + 1]], [all[k + 1], all[k + 2]], [all[k + 2], all[k]]]) {
      const e = edge(a, b);
      uses.set(e, (uses.get(e) ?? 0) + 1);
    }
  }
  const [pa, pb, pc, side, n, out] = Array.from({ length: 6 }, () => new THREE.Vector3());
  const width = BAND_M / scale;
  const band: number[] = [];
  for (let k = 0; k < along.length; k += 3) {
    const [a, b, c] = [along[k], along[k + 1], along[k + 2]];
    for (const [u, v, w] of [[a, b, c], [b, c, a], [c, a, b]]) {
      if (uses.get(edge(u, v)) !== 1) continue;
      pa.fromBufferAttribute(pos, u);
      pb.fromBufferAttribute(pos, v);
      pc.fromBufferAttribute(pos, w);
      side.subVectors(pb, pa);
      n.subVectors(pc, pa).cross(side).negate().normalize().multiplyScalar(front);   // (b - a) x (c - a): its front
      out.crossVectors(side, n).normalize();
      if (out.dot(pc.sub(pa)) > 0) out.negate();   // away from the triangle
      out.addScaledVector(n, -BAND_LEAN).normalize().multiplyScalar(width);
      band.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z, pb.x + out.x, pb.y + out.y, pb.z + out.z);
      band.push(pa.x, pa.y, pa.z, pb.x + out.x, pb.y + out.y, pb.z + out.z, pa.x + out.x, pa.y + out.y, pa.z + out.z);
    }
  }
  if (band.length === 0) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(band, 3));
  mesh.add(new THREE.Mesh(g, GAP_BLACK));
}
