// The Swift's dials, re-seated in their rings, with live needles.
//
// The model's painted dials sit 55 mm behind their silver rings, and from this car's driving eye each painting
// shows about 11 mm inward and 5 mm low in its ring, and smaller than the opening (49 mm against 64 mm). So each
// dial is re-seated: its ring is measured as the driver sees it (the silver edge projected from the eye onto
// the dial's plane, and a circle fitted), and a disc there carries the car's own dial painting, re-drawn flat
// once from the model's texture and scaled to fill the ring. The needles turn on each ring's centre, fed the
// road speed every frame and eased a little, as the Godot build's were (godot/scripts/cluster.gd). The rings
// themselves are faceted in the model, in both tiers; they are drawn round (roundRings), the faceted ones hidden.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { flatFace } from './surface';

// The discs stand this far in front of the painted dials: past the old hub caps and the small gauges' rims,
// which rise up to 6.3 mm (measured), and well behind the bezel.
const DISC_DEPTH_M = 0.0075;
const OVERFILL = 1.03;      // the disc a shade wider than the ring's opening, which hides its edge
// needle sizes as shares of the dial's rim, as the painting's ticks and the Godot build's needles sit
const NEEDLE = 0.88;
const TAIL = 0.18;          // the counterweight behind the hub, as a share of the length
const WIDTH = 0.031;
const HUB = 0.056;
const EASE_S = 0.08;        // how quickly a needle settles on a new reading
// The scale is the printed dial's (CAR.cluster), not a shorter one that would move more at test speeds: at
// 40 km/h the needle has to sit on the painted 40.
// There is no engine model, so the revs present the road speed the way a CVT holds them: rising off idle,
// then nearly steady (1,600 at 10 km/h, 2,100 at 20, 3,200 at most). They make the cabin feel alive and are
// marked nowhere.
const IDLE_RPM = 800;
const rpmAt = (kmh: number) => IDLE_RPM + 2400 * (1 - Math.exp(-kmh / 25));
const CUT = 8;               // each faceted triangle is cut into CUT x CUT before its points go round
const CREASE = Math.PI / 6;  // edges sharper than this stay sharp on the round rings
const RED = new THREE.Color('rgb(230, 41, 31)');
const HUB_RED = new THREE.Color('rgb(172, 31, 23)');

type Dial = typeof CAR.cluster.speedo;
type Face = NonNullable<ReturnType<typeof flatFace>>;
/** A dial's seat as seen: its centre, the disc's extent (to the ring), and the opening the bezel leaves. */
interface Seat { centre: THREE.Vector3; radius: number; opening: number; dial: Dial }

/** A circle through points (x, y): an algebraic fit, good for a ring's many vertices. */
function fitCircle(pts: [number, number][]) {
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0;
  for (const [x, y] of pts) {
    const z = x * x + y * y;
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sz += z; sxz += x * z; syz += y * z;
  }
  const m = new THREE.Matrix3().set(sxx, sxy, sx, sxy, syy, sy, sx, sy, pts.length).invert();
  const [D, E, F] = new THREE.Vector3(-sxz, -syz, -sz).applyMatrix3(m).toArray();
  const cx = -D / 2;
  const cy = -E / 2;
  return { cx, cy, r: Math.sqrt(cx * cx + cy * cy - F) };
}

/**
 * Each dial's seat as the driver sees it, on the plane the discs stand in: the silver ring projected from the
 * eye onto that plane and a circle fitted to it (its centre, and the disc's extent at its inner edge), and the
 * opening the faceted bezel leaves inside it (its nearest vertex to that centre, likewise projected). Null if
 * the model has no rings.
 */
function seats(body: THREE.Object3D, face: Face, eye: THREE.Vector3): Seat[] | null {
  const centre = new THREE.Vector3(...CAR.cluster.at);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(face.normal, face.planePoint(0.5, 0.5, DISC_DEPTH_M));
  const ray = new THREE.Ray();
  const hit = new THREE.Vector3();
  const p = new THREE.Vector3();
  const toBody = body.matrixWorld.clone().invert();
  /** The material's vertices round the binnacle, as seen on the dial's plane: metres, left dial then right. */
  const seen = (material: string) => {
    const sides: [number, number][][] = [[], []];
    body.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || (mesh.material as THREE.Material).name !== material) return;
      const m = toBody.clone().multiply(mesh.matrixWorld);
      const pos = mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(m);
        if (p.distanceTo(centre) > CAR.cluster.rings.radius) continue;
        ray.set(eye, p.clone().sub(eye).normalize());
        if (!ray.intersectPlane(plane, hit)) continue;
        const [u, v] = face.toUnwrap(hit);
        sides[u < 0.5 ? 0 : 1].push([u * face.width, v * face.height]);
      }
    });
    return sides;
  };
  const rings = seen(CAR.cluster.rings.material);
  const bezels = seen(CAR.cluster.bezel);
  if (rings.some((s) => s.length < 6)) return null;
  return rings.map((pts, i) => {
    const c = fitCircle(pts);
    const distance = ([x, y]: [number, number]) => Math.hypot(x - c.cx, y - c.cy);
    const inner = pts.map(distance).sort((a, b) => a - b)[Math.floor(pts.length * 0.1)];
    const opening = Math.min(inner, ...bezels[i].map(distance).filter((r) => r > 0.02));
    return {
      centre: face.planePoint(c.cx / face.width, c.cy / face.height, DISC_DEPTH_M),
      radius: inner,
      opening,
      dial: i === 0 ? CAR.cluster.tacho : CAR.cluster.speedo,
    };
  });
}

/** The model's faceted silver rings and the bezels inside them. */
function facetedRings(body: THREE.Object3D): THREE.Mesh[] {
  const found: THREE.Mesh[] = [];
  body.traverse((o) => {
    const mesh = o as THREE.Mesh;
    const name = mesh.isMesh ? (mesh.material as THREE.Material).name : '';
    if (name === CAR.cluster.rings.material || name === CAR.cluster.bezel) found.push(mesh);
  });
  return found;
}

/**
 * The silver rings and the bezels inside them, round (the owner, 3 Nov: "the meter is still not round"). Each faceted
 * triangle is cut small and every point laid back on the circle about its dial's axis, at its own radius and depth,
 * its texture where it was: the model's own shapes, without the corners. Each axis is the circle the silver ring's
 * points make, seen straight on. In the body's frame; empty if the model has no rings.
 */
function roundRings(body: THREE.Object3D, face: Face): THREE.Mesh[] {
  const toBody = body.matrixWorld.clone().invert();
  const origin = face.planePoint(0, 0, 0);
  const d = new THREE.Vector3();
  const local = (p: THREE.Vector3): [number, number, number] => {
    d.subVectors(p, origin);
    return [d.dot(face.right), d.dot(face.up), d.dot(face.normal)];
  };
  const parts = facetedRings(body).map((mesh) => {
    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
    const m = toBody.clone().multiply(mesh.matrixWorld);
    const P = g.attributes.position;
    const U = g.attributes.uv;
    const pts = Array.from({ length: P.count }, (_, i) => local(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(m)));
    const uvs = U ? Array.from({ length: U.count }, (_, i) => [U.getX(i), U.getY(i)]) : null;
    if (g !== mesh.geometry) g.dispose();
    return { mesh, pts, uvs };
  });
  const half = face.width / 2;
  const ring: [number, number][][] = [[], []];   // the silver ring's points, left dial then right
  for (const { mesh, pts } of parts) {
    if ((mesh.material as THREE.Material).name !== CAR.cluster.rings.material) continue;
    for (const [x, y] of pts) ring[x < half ? 0 : 1].push([x, y]);
  }
  if (ring.some((side) => side.length < 6)) return [];
  const axes = ring.map((side) => fitCircle(side));
  const at = new THREE.Vector3();
  return parts.map(({ mesh, pts, uvs }) => {
    const pos: number[] = [];
    const uv: number[] = [];
    for (let t = 0; t + 2 < pts.length; t += 3) {
      const tri = [pts[t], pts[t + 1], pts[t + 2]];
      const { cx, cy } = axes[(tri[0][0] + tri[1][0] + tri[2][0]) / 3 < half ? 0 : 1];
      const cyl = tri.map(([x, y, z]) => ({ r: Math.hypot(x - cx, y - cy), a: Math.atan2(y - cy, x - cx), z }));
      for (const c of cyl.slice(1)) c.a = cyl[0].a + Math.atan2(Math.sin(c.a - cyl[0].a), Math.cos(c.a - cyl[0].a));   // no wrap inside one triangle
      const point = (i: number, j: number) => {   // corners 0, 1 and 2 at (0, 0), (CUT, 0) and (0, CUT)
        const w = [(CUT - i - j) / CUT, i / CUT, j / CUT];
        const r = w[0] * cyl[0].r + w[1] * cyl[1].r + w[2] * cyl[2].r;
        const a = w[0] * cyl[0].a + w[1] * cyl[1].a + w[2] * cyl[2].a;
        const z = w[0] * cyl[0].z + w[1] * cyl[1].z + w[2] * cyl[2].z;
        at.copy(origin).addScaledVector(face.right, cx + r * Math.cos(a)).addScaledVector(face.up, cy + r * Math.sin(a)).addScaledVector(face.normal, z);
        pos.push(at.x, at.y, at.z);
        if (uvs) for (const k of [0, 1]) uv.push(w[0] * uvs[t][k] + w[1] * uvs[t + 1][k] + w[2] * uvs[t + 2][k]);
      };
      for (let i = 0; i < CUT; i++) {
        for (let j = 0; i + j < CUT; j++) {
          point(i, j); point(i + 1, j); point(i, j + 1);   // the winding of the corners, kept
          if (i + j < CUT - 1) { point(i + 1, j); point(i + 1, j + 1); point(i, j + 1); }
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (uvs) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const merged = mergeVertices(g, 1e-5);
    const round = toCreasedNormals(merged, CREASE);
    g.dispose();
    merged.dispose();
    return new THREE.Mesh(round, mesh.material);   // the car's own material, shared: never disposed here
  });
}

/** The two re-seated faces as one mesh: discs whose texture is the painting, centred and scaled to each ring. */
function discGeometry(face: Face, list: Seat[]) {
  const pos: number[] = [];
  const uv: number[] = [];
  const n = 64;
  const corner = new THREE.Vector3();
  for (const { centre, radius, opening, dial } of list) {
    const art = [dial.at[0], 1 - dial.at[1]];   // the painting's centre in the unwrap (its v runs top down)
    const r = radius * OVERFILL;                 // under the bezel, out to the ring: no gap shows
    const vertex = (k: number | null) => {
      const a = k === null ? 0 : (k / n) * Math.PI * 2;
      const f = k === null ? 0 : r;
      corner.copy(centre).addScaledVector(face.right, Math.cos(a) * f).addScaledVector(face.up, Math.sin(a) * f);
      pos.push(corner.x, corner.y, corner.z);
      const s = (f / opening) * CAR.cluster.rim;   // the bezel's opening shows the painting out to its rim
      uv.push(art[0] + (Math.cos(a) * s) / face.width, art[1] + (Math.sin(a) * s) / face.height);
    };
    for (let k = 0; k < n; k++) { vertex(null); vertex(k); vertex(k + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** One blade and its hub for a dial of rim `rim`, along +x from the pivot, facing +z; coloured per vertex. */
function needleGeometry(rim: number) {
  const len = NEEDLE * rim;
  const w = (WIDTH * rim) / 2;
  const r = HUB * rim;
  const pos: number[] = [];
  const col: number[] = [];
  const vertex = (x: number, y: number, z: number, c: THREE.Color) => { pos.push(x, y, z); col.push(c.r, c.g, c.b); };
  for (const [x, y] of [[-TAIL * len, -w], [len, -w], [len, w], [-TAIL * len, -w], [len, w], [-TAIL * len, w]]) vertex(x, y, 0, RED);
  const n = 16;
  for (let i = 0; i < n; i++) {   // the hub, a hair in front of the blade
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    vertex(0, 0, 0.0003, HUB_RED);
    vertex(Math.cos(a0) * r, Math.sin(a0) * r, 0.0003, HUB_RED);
    vertex(Math.cos(a1) * r, Math.sin(a1) * r, 0.0003, HUB_RED);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

class Dials {
  readonly group = new THREE.Group();
  private needles: THREE.InstancedMesh;
  private faceTarget = new THREE.WebGLRenderTarget(1024, 512, { colorSpace: THREE.SRGBColorSpace });
  private drawn = false;
  private kmh = 0;
  private dir = new THREE.Vector3();
  private side = new THREE.Vector3();
  private m = new THREE.Matrix4();

  constructor(private face: Face, private list: Seat[]) {
    const discs = new THREE.Mesh(discGeometry(face, list), new THREE.MeshBasicMaterial({ map: this.faceTarget.texture, color: 0xe8e8e8 }));
    // one blade size for both, sized to the opening: the two dials match to the millimetre
    const rim = list[0].opening;
    this.needles = new THREE.InstancedMesh(needleGeometry(rim), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }), 2);
    this.needles.position.addScaledVector(face.normal, 0.0005);   // in front of the discs
    for (const o of [discs, this.needles]) o.frustumCulled = false;   // small, always in view, placed by matrices
    this.group.add(discs, this.needles);
  }

  /** Once: the car's own dial painting, laid flat into the discs' texture. */
  private draw(gl: THREE.WebGLRenderer) {
    this.drawn = true;
    if (!this.face.map) return;
    const scene = new THREE.Scene();
    const flat = new THREE.Mesh(this.face.flat(), new THREE.MeshBasicMaterial({ map: this.face.map, side: THREE.DoubleSide }));
    scene.add(flat);
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    const before = gl.getRenderTarget();
    gl.setRenderTarget(this.faceTarget);
    gl.render(scene, camera);
    gl.setRenderTarget(before);
    flat.geometry.dispose();
    (flat.material as THREE.Material).dispose();
  }

  /** `target` km/h now; `dt` seconds since the last frame. */
  show(gl: THREE.WebGLRenderer, target: number, dt: number) {
    if (!this.drawn) this.draw(gl);
    this.kmh += (target - this.kmh) * (1 - Math.exp(-dt / EASE_S));
    this.list.forEach((seat, i) => this.place(i, seat, seat.dial === CAR.cluster.speedo ? this.kmh : rpmAt(this.kmh)));
    this.needles.instanceMatrix.needsUpdate = true;
  }

  private place(i: number, seat: Seat, value: number) {
    const { dial } = seat;
    const a = THREE.MathUtils.degToRad(dial.zeroDeg + dial.degPerUnit * THREE.MathUtils.clamp(value, 0, dial.max));
    // clockwise from pointing right, as the dial is read: with the face's up, that is right cos a - up sin a
    this.dir.copy(this.face.right).multiplyScalar(Math.cos(a)).addScaledVector(this.face.up, -Math.sin(a));
    this.side.crossVectors(this.face.normal, this.dir);
    this.m.makeBasis(this.dir, this.side, this.face.normal).setPosition(seat.centre);
    this.needles.setMatrixAt(i, this.m);
  }

  dispose() {
    this.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.needles.dispose();
    this.faceTarget.dispose();
  }
}

/** `speed` gives the car's road speed in km/h, read every frame. */
export function Cluster({ body, speed }: { body: THREE.Object3D; speed: () => number }) {
  const dials = useMemo(() => {
    const face = flatFace(body, CAR.cluster, CAR.eye);
    const list = face && seats(body, face, new THREE.Vector3(...CAR.eye));
    if (!face || !list) return null;
    const rings = new THREE.Group();
    for (const m of roundRings(body, face)) rings.add(m);
    return { face, d: new Dials(face, list), rings };
  }, [body]);
  useEffect(() => () => {
    dials?.d.dispose();
    dials?.face.geometry.dispose();
    for (const m of dials?.rings.children ?? []) (m as THREE.Mesh).geometry.dispose();
  }, [dials]);
  // the faceted rings, hidden while the round ones stand in for them
  useEffect(() => {
    if (!dials?.rings.children.length) return;
    const faceted = facetedRings(body);
    for (const m of faceted) m.visible = false;
    return () => { for (const m of faceted) m.visible = true; };
  }, [body, dials]);
  useFrame(({ gl }, dt) => dials?.d.show(gl, Math.abs(speed()), dt));
  if (!dials) return null;
  return (
    <>
      <primitive object={dials.d.group} />
      <primitive object={dials.rings} />
    </>
  );
}
