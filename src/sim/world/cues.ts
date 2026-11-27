// The yard's wordless guidance as three.js meshes and collider boxes: the lit board over the road at each start, the
// chevron boards on the bends and the closed-road barriers. Everything of one kind is merged into one mesh (a few
// draw calls whatever the count), drawn with unlit materials so it reads as lit by night as by day.
import * as THREE from 'three';
import type { CircuitData, Vec2 } from '../contracts';
import { dir } from '../geom';
import { BARRIERS, planChevrons, planGantries, type CueKind } from '../guidance';
import type { BoxCollider } from './build';

type RGB = [number, number, number];
const BLACK: RGB = [0.04, 0.04, 0.04];
const RED: RGB = [0.95, 0.12, 0.1];
const AMBER: RGB = [1, 0.55, 0.08];
const WHITE: RGB = [0.97, 0.97, 0.94];

/**
 * The signs themselves are the official Malaysia files (docs/sign-sources.md), laid on a plane as a texture: nothing
 * of a sign is drawn here. T17a and T17b are the chevron alignment signs (right and left), RM1c the ahead arrow.
 */
export const SIGN_FILES = {
  right: { url: '/signs/263bc825012bcc83.svg', aspect: 450 / 600 },   // Malaysia_road_sign_T17a
  left: { url: '/signs/ae147611d2116fed.svg', aspect: 450 / 600 },    // Malaysia_road_sign_T17b
  ahead: { url: '/signs/2a61a654c2768ee6.svg', aspect: 1 },           // Malaysia_road_sign_RM1c
} as const;

/** The three sign files side by side in one texture (one draw call): each slot is 512 px, a sign fills its height. */
const SLOT = 512;
const SLOTS: CueKind[] = ['left', 'right', 'ahead'];
const slotRect = (kind: CueKind): [number, number] => {
  const w = SLOT * SIGN_FILES[kind].aspect;
  const x0 = SLOTS.indexOf(kind) * SLOT + (SLOT - w) / 2;
  return [x0 / (SLOT * SLOTS.length), (x0 + w) / (SLOT * SLOTS.length)];
};

function signAtlas(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;   // tests have no document; the planes stay plain
  const canvas = document.createElement('canvas');
  canvas.width = SLOT * SLOTS.length;
  canvas.height = SLOT;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (!ctx) return texture;
  for (const kind of SLOTS) {
    const image = new Image();
    image.onload = () => {
      const [u0, u1] = slotRect(kind);
      ctx.drawImage(image, u0 * canvas.width, 0, (u1 - u0) * canvas.width, SLOT);
      texture.needsUpdate = true;
    };
    image.src = SIGN_FILES[kind].url;
  }
  return texture;
}

/** Merged triangles with vertex colours and UVs (UVs only matter to the sign planes). */
class Mesher {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, colour: RGB, [u0, u1] = [0, 1]) {
    const corners = [[u0, 0], [u1, 0], [u1, 1], [u0, 0], [u1, 1], [u0, 1]];
    [a, b, c, a, c, d].forEach((p, i) => { this.pos.push(p.x, p.y, p.z); this.col.push(...colour); this.uv.push(...corners[i]); });
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    return g;
  }
}

/** Circuit point and height to three.js. */
const to3 = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y);

/** A flat shape in a vertical plane: frame origin (circuit x, y), `right` the unit vector to the viewer's right. */
function plane(origin: Vec2, right: Vec2, lift = 0, push: Vec2 = [0, 0]) {
  return (u: number, v: number) => to3(origin[0] + right[0] * u + push[0], origin[1] + right[1] * u + push[1], v + lift);
}

/** The viewer's right, for a board whose face points along `face` (towards the viewer, who looks along the opposite way). */
export const rightOf = (face: number): Vec2 => {
  const [nx, ny] = dir(face);
  return [-ny, nx];
};

/** A sign plane, `w` wide by `w / aspect` high, its bottom edge `bottom` m up, facing along `face`. */
function board(m: Mesher, origin: Vec2, face: number, w: number, bottom: number, kind: CueKind) {
  const [nx, ny] = dir(face);
  const front = plane(origin, rightOf(face), bottom, [nx * 0.02, ny * 0.02]);
  const h = w / SIGN_FILES[kind].aspect;
  m.quad(front(-w / 2, 0), front(w / 2, 0), front(w / 2, h), front(-w / 2, h), WHITE, slotRect(kind));
  return h;
}

function post(m: Mesher, at: Vec2, height: number, colour: RGB, half = 0.04) {
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    m.quad(to3(at[0] - dx * half, at[1] - dy * half, 0), to3(at[0] + dx * half, at[1] + dy * half, 0), to3(at[0] + dx * half, at[1] + dy * half, height), to3(at[0] - dx * half, at[1] - dy * half, height), colour);
  }
}

export interface Guidance { group: THREE.Group; boxes: BoxCollider[] }

export function buildGuidance(c: CircuitData): Guidance {
  const signs = new Mesher();
  const glow = new Mesher();
  const boxes: BoxCollider[] = [];
  const barrierMesh = new Mesher();   // the barriers and the sign posts: plain colours, one draw call

  // the lit board over the road ahead of each start, on two posts beside it
  for (const g of planGantries(c)) {
    const [tx, ty] = dir(g.heading);
    const face = g.heading + Math.PI;                       // towards the driver coming on
    const left: Vec2 = [-ty, tx];
    const half = g.width / 2 + 0.5;
    for (const side of [-1, 1]) post(barrierMesh, [g.at[0] + left[0] * half * side, g.at[1] + left[1] * half * side], 4.2, BLACK);
    board(signs, g.at, face, 1.5, 2.3, g.kind);
  }

  // a chevron board on a post at each bend
  for (const ch of planChevrons(c)) {
    post(barrierMesh, ch.at, 1.2, BLACK);
    board(signs, ch.at, ch.face, 0.8, 0.9, ch.kind);
  }

  // closed-road barriers: a low strip (amber and white), X markers across it, a glow on the road, a collider behind
  for (const b of BARRIERS) {
    const len = Math.hypot(b.b[0] - b.a[0], b.b[1] - b.a[1]);
    const heading = Math.atan2(b.b[1] - b.a[1], b.b[0] - b.a[0]);
    const [ux, uy] = dir(heading);
    const nx = -uy, ny = ux;
    const mid: Vec2 = [(b.a[0] + b.b[0]) / 2, (b.a[1] + b.b[1]) / 2];
    const segs = Math.max(2, Math.round(len / 0.5));
    for (let i = 0; i < segs; i++) {
      const p0 = i / segs, p1 = (i + 1) / segs;
      const a: Vec2 = [b.a[0] + ux * len * p0, b.a[1] + uy * len * p0];
      const e: Vec2 = [b.a[0] + ux * len * p1, b.a[1] + uy * len * p1];
      const colour = i % 2 ? WHITE : AMBER;
      for (const side of [-1, 1]) {       // both faces and the top
        const o = 0.07 * side;
        barrierMesh.quad(to3(a[0] + nx * o, a[1] + ny * o, 0), to3(e[0] + nx * o, e[1] + ny * o, 0), to3(e[0] + nx * o, e[1] + ny * o, 0.42), to3(a[0] + nx * o, a[1] + ny * o, 0.42), colour);
      }
      barrierMesh.quad(to3(a[0] - nx * 0.07, a[1] - ny * 0.07, 0.42), to3(e[0] - nx * 0.07, e[1] - ny * 0.07, 0.42), to3(e[0] + nx * 0.07, e[1] + ny * 0.07, 0.42), to3(a[0] + nx * 0.07, a[1] + ny * 0.07, 0.42), colour);
      // the glow: a soft amber band on the road either side
      const g = 0.5;
      glow.quad(to3(a[0] - nx * g, a[1] - ny * g, 0.02), to3(e[0] - nx * g, e[1] - ny * g, 0.02), to3(e[0] + nx * g, e[1] + ny * g, 0.02), to3(a[0] + nx * g, a[1] + ny * g, 0.02), [0.34, 0.16, 0.02]);
    }
    // X markers: crossed bars standing on the strip, one about every 2 m
    const xs = Math.max(1, Math.round(len / 2));
    for (let i = 0; i < xs; i++) {
      const u = ((i + 0.5) / xs) * len;
      const centre: Vec2 = [b.a[0] + ux * u, b.a[1] + uy * u];
      const face = Math.atan2(ny, nx);
      for (const side of [1, -1]) {
        const [fx, fy] = dir(face + (side > 0 ? 0 : Math.PI));
        const right = rightOf(face + (side > 0 ? 0 : Math.PI));
        const p = plane(centre, right, 0.42, [fx * 0.08, fy * 0.08]);
        const r = 0.34, t = 0.055;
        barrierMesh.quad(p(-r - t, 0), p(-r + t, 0), p(r + t, 0.7), p(r - t, 0.7), RED);
        barrierMesh.quad(p(r - t, 0), p(r + t, 0), p(-r + t, 0.7), p(-r - t, 0.7), RED);
      }
    }
    boxes.push({ name: `barrier:${b.note}`, halfExtents: [len / 2, 0.45, 0.15], position: [mid[0], 0.45, -mid[1]], rotationY: heading });
  }

  const group = new THREE.Group();
  group.name = 'guidance';
  const unlit = (o: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, fog: false, ...o });
  const add = (name: string, m: Mesher, material: THREE.Material) => {
    const mesh = new THREE.Mesh(m.geometry(), material);
    mesh.name = name;
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
  };
  add('signs', signs, unlit({ map: signAtlas(), vertexColors: false, transparent: true, alphaTest: 0.1 }));
  add('barriers', barrierMesh, unlit());
  add('barrier-glow', glow, unlit({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  return { group, boxes };
}
