// The practice yard as three.js meshes and Rapier collider data, built from circuit.json alone.
// Pure three.js: no React, no renderer, so it runs in tests. Built once per circuit and cached:
// changing practice level only moves the car.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CircuitData, Polygon, Slope, StationGeometry, Vec2 } from '../contracts';
import { dir, rad, slopeHeight, slopeLocal } from '../geom';

/** three.js position of a circuit point: X = x, Y = z (up), Z = -y. */
export const toThree = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);

export interface Trimesh { name: string; vertices: Float32Array; indices: Uint32Array }
export interface BoxCollider { name: string; halfExtents: [number, number, number]; position: [number, number, number]; rotationY: number }
export interface PoleCollider { index: number; position: [number, number, number]; radius: number; halfHeight: number }

export interface WorldBuild {
  group: THREE.Group;                   // the meshes, plus named markers (Object3D) for every placed thing
  materials: { concrete: THREE.MeshStandardMaterial; grass: THREE.MeshStandardMaterial };
  colliders: {
    ground: BoxCollider;
    trimeshes: Trimesh[];               // kerbs, slope decks and walls, invisible guards along the slopes
    boxes: BoxCollider[];               // booths, the office, the fence
    poles: PoleCollider[];
  };
  surfaceHeight(x: number, y: number): number;   // the deck height on a slope, else 0
}

const KERB_COLOURS: [number, number, number][] = [[0.93, 0.74, 0.08], [0.08, 0.08, 0.08]];   // yellow, black
const WHITE: [number, number, number] = [0.95, 0.95, 0.93];
const YELLOW: [number, number, number] = [0.98, 0.8, 0.1];
const RED: [number, number, number] = [0.82, 0.12, 0.12];
const DASH_M = 1;              // kerb paint: 1 m yellow, 1 m black
const LINE_M = 0.1;            // painted bay lines
const FINISH_M = 0.4;          // the finish line
const PAINT_LIFT = 0.012;      // paint sits just above the surface
const GUARD_M = 1.2;           // invisible guard rails above a slope's walls: the car cannot fall off
const RAMP_END_WALL_M = 0.45;  // the wall at the end of the ramp's platform stands this far above the deck
const BOOTH_H = 2.6;
const OFFICE_H = 3.2;
const ROOF = { thick: 0.15, over: 0.25 };
const FENCE = { h: 1.8, post: 0.06, every: 3, rail: 0.04 };
const GRASS_MARGIN = 60;

type RGB = [number, number, number];
type P3 = THREE.Vector3;

/** Collects triangles with optional colours and uvs into one non-indexed geometry. */
class Mesher {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  tri(a: P3, b: P3, c: P3, colour?: RGB, uv?: [number, number][]) {
    for (const v of [a, b, c]) this.pos.push(v.x, v.y, v.z);
    if (colour) for (let i = 0; i < 3; i++) this.col.push(...colour);
    if (uv) for (const u of uv) this.uv.push(u[0], u[1]);
  }
  /** a b c d go round the quad. */
  quad(a: P3, b: P3, c: P3, d: P3, colour?: RGB, uv?: [[number, number], [number, number], [number, number], [number, number]]) {
    this.tri(a, b, c, colour, uv && [uv[0], uv[1], uv[2]]);
    this.tri(a, c, d, colour, uv && [uv[0], uv[2], uv[3]]);
  }
  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    if (this.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (this.uv.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    return g;
  }
  trimesh(name: string): Trimesh {
    return { name, vertices: new Float32Array(this.pos), indices: Uint32Array.from({ length: this.pos.length / 3 }, (_, i) => i) };
  }
}

const open = (ring: Polygon): Polygon =>
  ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring;

const slopeLength = (s: Slope) => s.profile[s.profile.length - 1][0];

/** A closed ring with extra points every `step` metres, so heights can follow a slope along it. */
function densify(ring: Polygon, step: number): Polygon {
  const out: Polygon = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  });
  return out;
}

/** The slope a wall ring stands along, if any: every vertex within a wall's width of the slope's sides or end. */
function wallSlope(ring: Polygon, slopes: Slope[]): Slope | undefined {
  return slopes.find((s) => ring.every((p) => {
    const l = slopeLocal(s, p);
    return l.along >= -0.6 && l.along <= slopeLength(s) + 0.6 && Math.abs(l.across) <= s.width / 2 + 0.6;
  }));
}

export function buildWorld(c: CircuitData): WorldBuild {
  const kerbH = c.kerbs.height;
  const kerbW = c.kerbs.width;
  const rings = c.kerbs.rings.map(open);
  const wallOf = rings.map((r) => wallSlope(r, c.slopes));

  const surfaceHeight = (x: number, y: number): number => {
    for (const s of c.slopes) {
      const l = slopeLocal(s, [x, y]);
      if (l.along >= 0 && l.along <= slopeLength(s) && Math.abs(l.across) <= s.width / 2) return slopeHeight(s, l.along);
    }
    return 0;
  };
  const at = (p: Vec2, lift = 0) => toThree(p[0], p[1], surfaceHeight(p[0], p[1]) + lift);

  // ---------------------------------------------------------------- concrete: pavement, slope decks, wall sides
  const shape = new THREE.Shape(rings[0].map(([x, y]) => new THREE.Vector2(x, y)));
  rings.slice(1).forEach((r) => shape.holes.push(new THREE.Path(r.map(([x, y]) => new THREE.Vector2(x, y)))));
  const pavement = new THREE.ShapeGeometry(shape).toNonIndexed();
  pavement.rotateX(-Math.PI / 2);   // (x, y, 0) -> (x, 0, -y); the shape's uvs stay in metres

  const deck = new Mesher();
  for (const s of c.slopes) {
    const [ux, uy] = dir(rad(s.heading_deg));
    const side = (along: number, across: number): Vec2 => [s.start[0] + ux * along - uy * across, s.start[1] + uy * along + ux * across];
    for (let i = 1; i < s.profile.length; i++) {
      const [a0, h0] = s.profile[i - 1];
      const [a1, h1] = s.profile[i];
      const w = s.width / 2;
      const p = [side(a0, -w), side(a1, -w), side(a1, w), side(a0, w)].map((q, k) => toThree(q[0], q[1], k === 0 || k === 3 ? h0 : h1));
      deck.quad(p[0], p[1], p[2], p[3], undefined, [[a0, -w], [a1, -w], [a1, w], [a0, w]]);
    }
  }

  // Walls along the slopes: each wall ring extruded from the ground to its deck's height plus a kerb.
  const walls = new Mesher();
  const wallTops = new Mesher();
  rings.forEach((wallRing, r) => {
    const s = wallOf[r];
    if (!s) return;
    const ring = densify(wallRing, 0.5);
    const top = ring.map((p) => {
      const along = slopeLocal(s, p).along;
      const end = s.id === 'ramp' && along >= slopeLength(s) - 0.05 ? RAMP_END_WALL_M : kerbH;
      return slopeHeight(s, Math.max(0, Math.min(slopeLength(s), along))) + end;
    });
    let run = 0;
    ring.forEach((p, i) => {
      const j = (i + 1) % ring.length;
      const q = ring[j];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      walls.quad(toThree(p[0], p[1], 0), toThree(q[0], q[1], 0), toThree(q[0], q[1], top[j]), toThree(p[0], p[1], top[i]),
        undefined, [[run, 0], [run + len, 0], [run + len, top[j]], [run, top[i]]]);
      run += len;
    });
    const cap = THREE.ShapeUtils.triangulateShape(ring.map(([x, y]) => new THREE.Vector2(x, y)), []);
    for (const [a, b, d] of cap) wallTops.tri(toThree(ring[a][0], ring[a][1], top[a]), toThree(ring[b][0], ring[b][1], top[b]), toThree(ring[d][0], ring[d][1], top[d]), YELLOW);
  });
  const concreteGeo = mergeGeometries([pavement, deck.geometry(), walls.geometry()].map((g) => {
    if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((g.getAttribute('position').count) * 2), 2));
    return g;
  }));

  // ---------------------------------------------------------------- kerbs: on the grass side of every ring
  // The grass is to the right of travel round every ring: ring 0 winds anticlockwise round the yard, and
  // every hole (an island) winds clockwise.
  const kerbs = new Mesher();
  rings.forEach((ring, r) => {
    if (wallOf[r]) return;
    const n = ring.length;
    const right = (i: number): Vec2 => {
      const a = ring[i];
      const b = ring[(i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
    };
    const offset = ring.map((_, i) => {                     // mitred offset at each vertex
      const n0 = right((i - 1 + n) % n);
      const n1 = right(i);
      const m: Vec2 = [n0[0] + n1[0], n0[1] + n1[1]];
      const ml = Math.hypot(m[0], m[1]) || 1;
      const cos = Math.max(0.35, (m[0] * n1[0] + m[1] * n1[1]) / ml);
      return [(m[0] / ml) * (kerbW / cos), (m[1] / ml) * (kerbW / cos)] as Vec2;
    });
    let run = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = ring[i];
      const b = ring[j];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let t0 = 0;
      while (t0 < len - 1e-9) {
        const dash = Math.floor((run + t0) / DASH_M + 1e-9);
        const t1 = Math.min(len, (dash + 1) * DASH_M - run);
        const lerp = (u: number) => {
          const k = len ? u / len : 0;
          const inner: Vec2 = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
          const off: Vec2 = [offset[i][0] + (offset[j][0] - offset[i][0]) * k, offset[i][1] + (offset[j][1] - offset[i][1]) * k];
          return { inner, outer: [inner[0] + off[0], inner[1] + off[1]] as Vec2 };
        };
        const p0 = lerp(t0);
        const p1 = lerp(t1);
        const colour = KERB_COLOURS[dash % 2];
        const g = (q: Vec2, h: number) => toThree(q[0], q[1], h);
        kerbs.quad(g(p0.inner, kerbH), g(p1.inner, kerbH), g(p1.outer, kerbH), g(p0.outer, kerbH), colour);   // top
        kerbs.quad(g(p0.inner, 0), g(p1.inner, 0), g(p1.inner, kerbH), g(p0.inner, kerbH), colour);           // face to the road
        kerbs.quad(g(p0.outer, kerbH), g(p1.outer, kerbH), g(p1.outer, 0), g(p0.outer, 0), colour);           // face to the grass
        t0 = t1;
      }
      run += len;
    }
  });
  const kerbGeo = mergeGeometries([kerbs.geometry(), wallTops.geometry()]);

  // ---------------------------------------------------------------- paint: the stop band, the two boxes, the finish
  const paint = new Mesher();
  const strip = (a: Vec2, b: Vec2, width: number, colour: RGB) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (-(b[1] - a[1]) / len) * (width / 2);
    const ny = ((b[0] - a[0]) / len) * (width / 2);
    paint.quad(at([a[0] - nx, a[1] - ny], PAINT_LIFT), at([b[0] - nx, b[1] - ny], PAINT_LIFT), at([b[0] + nx, b[1] + ny], PAINT_LIFT), at([a[0] + nx, a[1] + ny], PAINT_LIFT), colour);
  };
  const station = (id: string) => c.stations.find((g) => g.id === id) as StationGeometry;
  const hill = c.slopes.find((s) => s.id === 'hill');
  const band = station('hill-start')?.stop_band;
  if (hill && band) {
    // the band is given along the route; the route runs up the hill's axis, so find where it starts on it
    const onHill = c.route.samples.filter((q) => q[5] === 'hill-start');
    const ref = onHill.reduce((best, q) => (Math.abs(slopeLocal(hill, [q[1], q[2]]).across) < Math.abs(slopeLocal(hill, [best[1], best[2]]).across) ? q : best), onHill[0]);
    const s0 = ref[0] - slopeLocal(hill, [ref[1], ref[2]]).along;
    const [ux, uy] = dir(rad(hill.heading_deg));
    const w = hill.width / 2;
    const pt = (along: number, across: number): Vec2 => [hill.start[0] + ux * along - uy * across, hill.start[1] + uy * along + ux * across];
    const a0 = band.s_from - s0;
    const a1 = band.s_to - s0;
    paint.quad(at(pt(a0, -w), PAINT_LIFT), at(pt(a1, -w), PAINT_LIFT), at(pt(a1, w), PAINT_LIFT), at(pt(a0, w), PAINT_LIFT), YELLOW);
  }
  for (const g of c.stations) {
    if (!g.bay) continue;
    const [ux, uy] = dir(rad(g.bay.axis_deg));        // from the back of the bay to its mouth
    const corner = (along: number, across: number): Vec2 => [g.bay!.centre[0] + ux * along - uy * across, g.bay!.centre[1] + uy * along + ux * across];
    const l = g.bay.length / 2;
    const w = g.bay.width / 2;
    strip(corner(-l, -w), corner(l, -w), LINE_M, WHITE);
    strip(corner(-l, w), corner(l, w), LINE_M, WHITE);
    strip(corner(-l, -w - LINE_M / 2), corner(-l, w + LINE_M / 2), LINE_M, WHITE);              // the back
    if (g.id !== 'side-parking') strip(corner(l, -w - LINE_M / 2), corner(l, w + LINE_M / 2), LINE_M, WHITE);   // the side bay is open at its mouth
  }
  const finish = station('road-merging')?.gates.find((q) => q.id === 'finish');
  if (finish) strip(finish.a, finish.b, FINISH_M, RED);

  // ---------------------------------------------------------------- poles, props and the fence
  const things = new Mesher();
  const box = (centre: Vec2, size: Vec2, headingDeg: number, z0: number, z1: number, colour: RGB) => {
    const [ux, uy] = dir(rad(headingDeg));
    const cnr = (sa: number, sc: number): Vec2 => [centre[0] + ux * sa * size[0] / 2 - uy * sc * size[1] / 2, centre[1] + uy * sa * size[0] / 2 + ux * sc * size[1] / 2];
    const ring = [cnr(-1, -1), cnr(1, -1), cnr(1, 1), cnr(-1, 1)];
    const lo = ring.map((q) => toThree(q[0], q[1], z0));
    const hi = ring.map((q) => toThree(q[0], q[1], z1));
    for (let i = 0; i < 4; i++) things.quad(lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i], colour);
    things.quad(hi[0], hi[1], hi[2], hi[3], colour);
  };
  const poles: PoleCollider[] = [];
  c.obstacles.poles.forEach((p, index) => {
    const base = p.base_z ?? 0;
    const bands = Math.max(1, Math.round(p.height / 0.2));
    const segs = 10;
    for (let k = 0; k < bands; k++) {
      const z0 = base + (k * p.height) / bands;
      const z1 = base + ((k + 1) * p.height) / bands;
      for (let s = 0; s < segs; s++) {
        const t0 = (s / segs) * Math.PI * 2;
        const t1 = ((s + 1) / segs) * Math.PI * 2;
        const q0: Vec2 = [p.at[0] + p.radius * Math.cos(t0), p.at[1] + p.radius * Math.sin(t0)];
        const q1: Vec2 = [p.at[0] + p.radius * Math.cos(t1), p.at[1] + p.radius * Math.sin(t1)];
        things.quad(toThree(q0[0], q0[1], z0), toThree(q1[0], q1[1], z0), toThree(q1[0], q1[1], z1), toThree(q0[0], q0[1], z1), k % 2 ? WHITE : RED);
      }
    }
    poles.push({ index, position: [p.at[0], base + p.height / 2, -p.at[1]], radius: p.radius, halfHeight: p.height / 2 });
  });
  const boxes: BoxCollider[] = [];
  const building = (name: string, b: { centre: Vec2; size: Vec2; heading_deg: number }, height: number) => {
    box(b.centre, b.size, b.heading_deg, 0, height, [0.93, 0.91, 0.86]);
    box(b.centre, [b.size[0] + 2 * ROOF.over, b.size[1] + 2 * ROOF.over], b.heading_deg, height, height + ROOF.thick, [0.23, 0.43, 0.65]);
    boxes.push({ name, halfExtents: [b.size[0] / 2, height / 2, b.size[1] / 2], position: [b.centre[0], height / 2, -b.centre[1]], rotationY: rad(b.heading_deg) });
  };
  c.props.booths.forEach((b, i) => building(`booth:${i}`, b, BOOTH_H));
  building('office', c.props.office, OFFICE_H);
  const [fx0, fy0, fx1, fy1] = c.props.fence;
  const fenceSides: [Vec2, Vec2][] = [[[fx0, fy0], [fx1, fy0]], [[fx1, fy0], [fx1, fy1]], [[fx1, fy1], [fx0, fy1]], [[fx0, fy1], [fx0, fy0]]];
  const steel: RGB = [0.3, 0.32, 0.33];
  fenceSides.forEach(([a, b], i) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const heading = Math.atan2(b[1] - a[1], b[0] - a[0]) * (180 / Math.PI);
    const posts = Math.ceil(len / FENCE.every);
    for (let k = 0; k <= posts; k++) {
      const u = k / posts;
      box([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], [FENCE.post, FENCE.post], heading, 0, FENCE.h, steel);
    }
    const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (const z of [FENCE.h / 2, FENCE.h - FENCE.rail]) box(mid, [len, FENCE.rail], heading, z, z + FENCE.rail, steel);
    boxes.push({ name: `fence:${i}`, halfExtents: [len / 2, FENCE.h / 2, 0.05], position: [mid[0], FENCE.h / 2, -mid[1]], rotationY: rad(heading) });
  });

  // ---------------------------------------------------------------- invisible guards above every slope wall
  const guards = new Mesher();
  for (const s of c.slopes) {
    const [ux, uy] = dir(rad(s.heading_deg));
    const L = slopeLength(s);
    const pt = (along: number, across: number): Vec2 => [s.start[0] + ux * along - uy * across, s.start[1] + uy * along + ux * across];
    const steps = Math.ceil(L / 0.5);
    for (const side of [-1, 1]) {
      const across = side * (s.width / 2 + 0.15);
      for (let k = 0; k < steps; k++) {
        const a0 = (k / steps) * L;
        const a1 = ((k + 1) / steps) * L;
        const h0 = slopeHeight(s, a0);
        const h1 = slopeHeight(s, a1);
        const p0 = pt(a0, across);
        const p1 = pt(a1, across);
        guards.quad(toThree(p0[0], p0[1], h0), toThree(p1[0], p1[1], h1), toThree(p1[0], p1[1], h1 + GUARD_M), toThree(p0[0], p0[1], h0 + GUARD_M));
      }
    }
    if (s.id === 'ramp') {
      const h = slopeHeight(s, L);
      const p0 = pt(L + 0.1, -s.width / 2 - 0.3);
      const p1 = pt(L + 0.1, s.width / 2 + 0.3);
      guards.quad(toThree(p0[0], p0[1], 0), toThree(p1[0], p1[1], 0), toThree(p1[0], p1[1], h + GUARD_M), toThree(p0[0], p0[1], h + GUARD_M));
    }
  }

  // ---------------------------------------------------------------- grass
  const [bx0, by0, bx1, by1] = c.site.bounds;
  const grassGeo = new THREE.PlaneGeometry(bx1 - bx0 + 2 * GRASS_MARGIN, by1 - by0 + 2 * GRASS_MARGIN);
  grassGeo.rotateX(-Math.PI / 2);
  grassGeo.translate((bx0 + bx1) / 2, 0, -(by0 + by1) / 2);
  const grassUv = grassGeo.getAttribute('uv');
  for (let i = 0; i < grassUv.count; i++) grassUv.setXY(i, grassUv.getX(i) * (bx1 - bx0 + 2 * GRASS_MARGIN), grassUv.getY(i) * (by1 - by0 + 2 * GRASS_MARGIN));

  // ---------------------------------------------------------------- meshes
  const materials = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 }),
    grass: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 }),
  };
  const painted = (o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, ...o });
  const group = new THREE.Group();
  group.name = 'world';
  const add = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material, y = 0) => {
    const m = new THREE.Mesh(geometry, material);
    m.name = name;
    m.position.y = y;
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    group.add(m);
  };
  add('grass', grassGeo, materials.grass, -0.02);
  add('concrete', concreteGeo, materials.concrete);
  add('kerbs', kerbGeo, painted());
  add('paint', paint.geometry(), painted({ polygonOffset: true, polygonOffsetFactor: -2, roughness: 0.6 }));
  add('things', things.geometry(), painted());

  // ---------------------------------------------------------------- markers: every placed thing, by name
  const marker = (name: string, p: THREE.Vector3) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.copy(p);
    group.add(o);
  };
  for (const g of c.stations) {
    for (const gate of g.gates) marker(`gate:${g.id}:${gate.id}`, at([(gate.a[0] + gate.b[0]) / 2, (gate.a[1] + gate.b[1]) / 2]));
    if (g.bay) marker(`bay:${g.id}`, at(g.bay.centre));
    marker(`start:${g.id}`, at(g.start.at));
  }
  c.obstacles.poles.forEach((p, i) => marker(`pole:${i}`, toThree(p.at[0], p.at[1], p.base_z ?? 0)));
  for (const s of c.slopes) marker(`slope:${s.id}`, toThree(s.start[0], s.start[1], 0));
  c.props.booths.forEach((b, i) => marker(`booth:${i}`, toThree(b.centre[0], b.centre[1], 0)));
  marker('office', toThree(c.props.office.centre[0], c.props.office.centre[1], 0));
  marker('spawn', at(c.spawn.at));

  // ---------------------------------------------------------------- colliders
  const kerbCollider = new Mesher();
  kerbCollider.pos = Array.from(kerbGeo.getAttribute('position').array);
  const deckCollider = new Mesher();
  deckCollider.pos = [...deck.pos, ...walls.pos, ...wallTops.pos];
  const colliders: WorldBuild['colliders'] = {
    ground: {
      name: 'ground',
      halfExtents: [(bx1 - bx0) / 2 + GRASS_MARGIN, 0.5, (by1 - by0) / 2 + GRASS_MARGIN],
      position: [(bx0 + bx1) / 2, -0.5, -(by0 + by1) / 2],
      rotationY: 0,
    },
    trimeshes: [kerbCollider.trimesh('kerbs'), deckCollider.trimesh('slopes'), guards.trimesh('guards')],
    boxes,
    poles,
  };

  return { group, materials, colliders, surfaceHeight };
}

const cache = new WeakMap<CircuitData, WorldBuild>();

/** The world for a circuit, built on first use and shared after: a level change never rebuilds it. */
export function getWorld(c: CircuitData): WorldBuild {
  let w = cache.get(c);
  if (!w) {
    w = buildWorld(c);
    cache.set(c, w);
  }
  return w;
}
