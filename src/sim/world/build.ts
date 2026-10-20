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

/** A signal lamp: where it shines from, which way it faces (a circuit heading, radians) and what it shows. */
export interface SignalLamp { signal: string; group: 'ew' | 'ns'; colour: 'red' | 'amber' | 'green'; position: THREE.Vector3; facing: number }

export interface WorldBuild {
  group: THREE.Group;                   // the meshes, plus named markers (Object3D) for every placed thing
  materials: { asphalt: THREE.MeshStandardMaterial; concrete: THREE.MeshStandardMaterial; grass: THREE.MeshStandardMaterial };
  lamps: SignalLamp[];                  // lit by the scene (traffic/Signals.tsx) from the run's clock
  colliders: {
    ground: BoxCollider;
    trimeshes: Trimesh[];               // kerbs, slope decks and walls, invisible guards along the slopes
    boxes: BoxCollider[];               // booths, the office, the fence
    poles: PoleCollider[];
  };
  surfaceHeight(x: number, y: number): number;   // the deck height on a slope, else 0
}

// The markings follow JKR's Arahan Teknik (Jalan) 2D/85, Road Marking and Delineation (the owner, 20 Oct), cited by
// clause and figure. Kerbs: white and black segments, white first (4.3.8: 1.5 m at most).
const KERB_COLOURS: [number, number, number][] = [[0.95, 0.95, 0.93], [0.08, 0.08, 0.08]];
const WHITE: [number, number, number] = [0.95, 0.95, 0.93];
const YELLOW: [number, number, number] = [0.98, 0.8, 0.1];
const BOX_YELLOW: [number, number, number] = [0.95, 0.66, 0.05];    // 3.0: JKR's one yellow, BS 381C No. 356, for yellow boxes
const RED: [number, number, number] = [0.82, 0.12, 0.12];
const DASH_M = 1;              // kerb paint: 1 m yellow, 1 m black
const LINE_M = 0.1;            // painted bay lines
const FINISH_M = 0.4;          // the finish line
const EDGE_M = 0.15;           // 4.1.6: white edge lines
const STOP_M = 0.3;            // 4.2.2: stop lines
const GIVE_WAY = { width: 0.2, dash: 0.3, gap: 0.3 };                      // 4.2.3, Fig 12
const GIVE_WAY_SIGN = { back: 2.75, long: 3.75, wide: 1.25, rim: 0.15, base: 0.6 };   // Fig 12: the triangle
const OUTLINE_M = 0.2;         // Fig 14: the border round a chevron area
const CHEVRON = { width: 0.3, gap: 0.6, line: 0.2, apart: 0.125 };        // Fig 14: 45 degree stripes; the double line on from the tip
const ARROW = { long: 3.0, head: 1.125, headWide: 0.825, shaft: 0.185, turnR: 0.8, turnHead: 0.6, turnHeadWide: 0.75 };   // Fig 19, urban
const YELLOW_BOX = { border: 0.2, line: 0.15, every: 3.05 };              // 4.3.7, Fig 24
const MARKER = { radius: 0.05, height: 1.6, band: 0.2, plate: 0.36 };   // the poles where a station's queue stops
const SIGNAL = { pole: 0.06, height: 2.9, box: [0.24, 0.92, 0.32] as const, lamp: 0.28 };
const PAINT_LIFT = 0.012;      // paint sits just above the surface
const GUARD_M = 1.2;           // invisible guard rails above a slope's walls: the car cannot fall off
const RAMP_END_WALL_M = 0.45;  // the wall at the end of the ramp's platform stands this far above the deck
const BOOTH_H = 2.6;
export const OFFICE_H = 3.2;
export const ROOF = { thick: 0.15, over: 0.25 };
const FENCE = { h: 1.8, post: 0.06, every: 3, rail: 0.04 };
const GRASS_MARGIN = 500;   // the grass runs on out to the haze (Scenery.tsx): no edge to the world

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

  // ---------------------------------------------------------------- the surface: asphalt pavement; concrete slope decks and wall sides
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
    for (const [a, b, d] of cap) wallTops.tri(toThree(ring[a][0], ring[a][1], top[a]), toThree(ring[b][0], ring[b][1], top[b]), toThree(ring[d][0], ring[d][1], top[d]), WHITE);
  });
  const concreteGeo = mergeGeometries([deck.geometry(), walls.geometry()].map((g) => {
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
    const a0 = band.s_from - s0;
    const a1 = band.s_to - s0;
    // ours, and the same band on the twin strip beside it, where the other learner stops
    for (const strip_ of c.slopes.filter((s) => s.id === 'hill' || s.id === 'hill-twin')) {
      const [ux, uy] = dir(rad(strip_.heading_deg));
      const w = strip_.width / 2;
      const pt = (along: number, across: number): Vec2 => [strip_.start[0] + ux * along - uy * across, strip_.start[1] + uy * along + ux * across];
      paint.quad(at(pt(a0, -w), PAINT_LIFT), at(pt(a1, -w), PAINT_LIFT), at(pt(a1, w), PAINT_LIFT), at(pt(a0, w), PAINT_LIFT), YELLOW);
    }
  }
  const bays = [   // the 3-side bays are open at their mouths
    ...c.stations.flatMap((g) => (g.bay ? [{ bay: g.bay, open: g.id === 'side-parking' }] : [])),
    ...(c.markings?.bays ?? []).map((bay) => ({ bay, open: true })),
  ];
  for (const { bay, open } of bays) {
    const [ux, uy] = dir(rad(bay.axis_deg));        // from the back of the bay to its mouth
    const corner = (along: number, across: number): Vec2 => [bay.centre[0] + ux * along - uy * across, bay.centre[1] + uy * along + ux * across];
    const l = bay.length / 2;
    const w = bay.width / 2;
    strip(corner(-l, -w), corner(l, -w), LINE_M, WHITE);
    strip(corner(-l, w), corner(l, w), LINE_M, WHITE);
    strip(corner(-l, -w - LINE_M / 2), corner(-l, w + LINE_M / 2), LINE_M, WHITE);              // the back
    if (!open) strip(corner(l, -w - LINE_M / 2), corner(l, w + LINE_M / 2), LINE_M, WHITE);
  }
  const finish = station('road-merging')?.gates.find((q) => q.id === 'finish');
  if (finish) strip(finish.a, finish.b, FINISH_M, RED);
  // filled shapes: a convex polygon as a fan, on the surface
  const fill = (poly: Vec2[], colour: RGB) => {
    for (let i = 1; i < poly.length - 1; i++) paint.tri(at(poly[0], PAINT_LIFT), at(poly[i], PAINT_LIFT), at(poly[i + 1], PAINT_LIFT), colour);
  };
  const dashed = (a: Vec2, b: Vec2, width: number, dash: number, gap: number, colour: RGB) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const p = (t: number): Vec2 => [a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len];
    for (let t = 0; t < len - 1e-6; t += dash + gap) strip(p(t), p(Math.min(len, t + dash)), width, colour);
  };
  // a shape drawn in its own frame (x forward, y left), placed at `centre` and turned to `heading` (radians)
  const place = (centre: Vec2, heading: number) => {
    const [ux, uy] = dir(heading);
    return (q: Vec2): Vec2 => [centre[0] + ux * q[0] - uy * q[1], centre[1] + uy * q[0] + ux * q[1]];
  };
  // a convex polygon cut to a convex area (both any winding)
  const clip = (poly: Vec2[], edges: Vec2[]): Vec2[] => {
    let area = 0;
    edges.forEach((p, i) => { const q = edges[(i + 1) % edges.length]; area += p[0] * q[1] - q[0] * p[1]; });
    const side = (p: Vec2, a: Vec2, b: Vec2) => ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) * Math.sign(area);
    let out = poly;
    edges.forEach((a, i) => {
      const b = edges[(i + 1) % edges.length];
      const next: Vec2[] = [];
      out.forEach((p, j) => {
        const q = out[(j + 1) % out.length];
        const dp = side(p, a, b);
        const dq = side(q, a, b);
        if (dp >= 0) next.push(p);
        if ((dp >= 0) !== (dq >= 0)) next.push([p[0] + ((q[0] - p[0]) * dp) / (dp - dq), p[1] + ((q[1] - p[1]) * dp) / (dp - dq)]);
      });
      out = next;
    });
    return out;
  };
  // a polyline as a strip of quads (arcs of arrows)
  const polyline = (pts: Vec2[], width: number) => { for (let i = 1; i < pts.length; i++) strip(pts[i - 1], pts[i], width, WHITE); };

  // centre lines (4.1.2): 100 mm white, unbroken where crossing is prohibited (gap 0), else in strokes and gaps
  const marks = c.markings;
  for (const line of marks?.centre_lines ?? []) {
    if (!(marks!.gap > 0)) {
      for (let i = 1; i < line.length; i++) strip(line[i - 1], line[i], marks!.width, WHITE);
      continue;
    }
    let run = 0;   // metres along the line, for the dash pattern
    for (let i = 1; i < line.length; i++) {
      const [a, b] = [line[i - 1], line[i]];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const at = (t: number): Vec2 => [a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len];
      for (let t = 0; t < len;) {
        const phase = (run + t) % (marks!.dash + marks!.gap);
        const left = phase < marks!.dash ? marks!.dash - phase : 0;
        if (left > 0) strip(at(t), at(Math.min(len, t + left)), marks!.width, WHITE);
        t += left > 0 ? left : marks!.dash + marks!.gap - phase;
      }
      run += len;
    }
  }

  // edge lines (4.1.6), stop lines (4.2.2), give-way lines (4.2.3)
  for (const line of marks?.edge_lines ?? []) for (let i = 1; i < line.length; i++) strip(line[i - 1], line[i], EDGE_M, WHITE);
  for (const [a, b] of marks?.stop_lines ?? []) strip(a, b, STOP_M, WHITE);
  for (const [a, b] of marks?.give_way ?? []) dashed(a, b, GIVE_WAY.width, GIVE_WAY.dash, GIVE_WAY.gap, WHITE);
  // the merge's give-way triangle (Fig 12): an outline, its base 2.75 m before the line, its point at the drivers
  const merge = c.traffic?.merge;
  if (merge) {
    const [a, b] = merge.give_way;
    const t = place([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], rad(merge.heading_deg));
    const g = GIVE_WAY_SIGN;
    const apex = -g.back - g.long;
    const half = (x: number) => (g.wide / 2) * ((x - apex) / g.long);           // the half width at x
    const across = (g.rim * Math.hypot(g.long, g.wide / 2)) / g.long;             // the rim, measured across the road
    const innerApex = apex + (g.rim * Math.hypot(g.long, g.wide / 2)) / (g.wide / 2);   // where the rims' inner edges meet
    const x1 = -g.back - g.base;
    fill([t([-g.back, -g.wide / 2]), t([-g.back, g.wide / 2]), t([x1, half(x1)]), t([x1, -half(x1)])], WHITE);   // the base
    for (const sd of [1, -1]) fill([t([x1, sd * half(x1)]), t([x1, sd * (half(x1) - across)]), t([innerApex, 0]), t([apex, 0])], WHITE);
  }

  // direction arrows (Fig 19, the urban size): a 3.0 m arrow for straight on, a curved branch for each turn
  for (const arrow of marks?.arrows ?? []) {
    const pt = place(arrow.at, rad(arrow.heading_deg));
    const A = ARROW;
    const base = -A.long / 2;
    const straight = arrow.kind.includes('S');
    const turns = [...arrow.kind].filter((m) => m === 'L' || m === 'R');
    const bendAt = straight ? base + 0.55 : base + A.long - A.turnR - A.turnHeadWide / 2 - 0.5;   // where a branch leaves the shaft
    const top = straight ? A.long / 2 - A.head : bendAt;
    fill([pt([base, -A.shaft / 2]), pt([top, -A.shaft / 2]), pt([top, A.shaft / 2]), pt([base, A.shaft / 2])], WHITE);
    if (straight) fill([pt([top, -A.headWide / 2]), pt([A.long / 2, 0]), pt([top, A.headWide / 2])], WHITE);
    for (const k of turns) {
      const sd = k === 'L' ? 1 : -1;
      const arc: Vec2[] = [];
      for (let i = 0; i <= 8; i++) {   // a quarter circle off the shaft, ending pointed sideways
        const u = (i / 8) * (Math.PI / 2);
        arc.push(pt([bendAt + A.turnR * Math.sin(u), sd * A.turnR * (1 - Math.cos(u))]));
      }
      polyline(arc, A.shaft);
      const ex = bendAt + A.turnR;
      fill([pt([ex - A.turnHeadWide / 2, sd * A.turnR]), pt([ex + A.turnHeadWide / 2, sd * A.turnR]), pt([ex, sd * (A.turnR + A.turnHead)])], WHITE);
    }
  }

  // chevron areas (Fig 14): a 200 mm border, 300 mm stripes 600 mm apart at 45 degrees whose points face the oncoming
  // traffic, and a double line run on from the tip towards it
  for (const ch of marks?.chevrons ?? []) {
    const poly = ch.polygon;
    poly.forEach((p, i) => strip(p, poly[(i + 1) % poly.length], OUTLINE_M, WHITE));
    const centre: Vec2 = [poly.reduce((acc, p) => acc + p[0], 0) / poly.length, poly.reduce((acc, p) => acc + p[1], 0) / poly.length];
    const reach = 2 * (Math.max(...poly.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1]))) + 1);
    const pt = place(centre, rad(ch.heading_deg));
    const w = (CHEVRON.width * Math.SQRT2) / 2;       // a 45 degree stripe's half width along the flow
    const pitch = (CHEVRON.width + CHEVRON.gap) * Math.SQRT2;
    for (let k = -reach; k <= reach; k += pitch) {
      for (const sd of [1, -1]) {   // each V: its point upstream, its arms opening downstream
        const cut = clip([pt([k - w, 0]), pt([k + reach - w, sd * reach]), pt([k + reach + w, sd * reach]), pt([k + w, 0])], poly);
        if (cut.length >= 3) fill(cut, WHITE);
      }
    }
    const tip = (ch as { tip?: Vec2 }).tip;
    const lead = (ch as { lead?: number }).lead ?? 0;
    if (tip && lead > 0) {
      const back = place(tip, rad(ch.heading_deg));
      const off = (CHEVRON.line + CHEVRON.apart) / 2;
      for (const sd of [1, -1]) strip(back([0, sd * off]), back([-lead, sd * off]), CHEVRON.line, WHITE);
    }
  }

  // zebra crossings (4.2.4, Fig 13 type A): 600 mm strips along the road, side by side across it, from 250 mm off the kerb
  for (const z of marks?.zebras ?? []) {
    const pt = place(z.centre, rad(z.heading_deg));
    for (let y = -z.width / 2 + 0.25; y + z.stripe <= z.width / 2 - 0.25 + 1e-6; y += z.stripe + z.gap) {
      fill([pt([-z.length / 2, y]), pt([z.length / 2, y]), pt([z.length / 2, y + z.stripe]), pt([-z.length / 2, y + z.stripe])], WHITE);
    }
  }

  // yellow box junctions (4.3.7, Fig 24): a 200 mm yellow border and 150 mm yellow criss-cross lines 3.05 m apart
  for (const boxPoly of (marks as { yellow_boxes?: Vec2[][] } | undefined)?.yellow_boxes ?? []) {
    const ring = boxPoly;
    let area = 0;
    ring.forEach((p, i) => { const q = ring[(i + 1) % ring.length]; area += p[0] * q[1] - q[0] * p[1]; });
    const inside = Math.sign(area) * YELLOW_BOX.border;   // left of each edge is inside an anticlockwise ring
    ring.forEach((p, i) => {
      const q = ring[(i + 1) % ring.length];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const e = place(p, Math.atan2(q[1] - p[1], q[0] - p[0]));
      fill([e([0, 0]), e([len, 0]), e([len, inside]), e([0, inside])], BOX_YELLOW);
    });
    const cx = ring.reduce((acc, p) => acc + p[0], 0) / ring.length;
    const cy = ring.reduce((acc, p) => acc + p[1], 0) / ring.length;
    const span = Math.max(...ring.map((p) => Math.hypot(p[0] - cx, p[1] - cy))) + 1;
    for (const ang of [Math.PI / 4, -Math.PI / 4]) {
      const pt = place([cx, cy], ang);
      for (let k = -span; k <= span; k += YELLOW_BOX.every) {
        const cut = clip([pt([-span, k - YELLOW_BOX.line / 2]), pt([span, k - YELLOW_BOX.line / 2]), pt([span, k + YELLOW_BOX.line / 2]), pt([-span, k + YELLOW_BOX.line / 2])], ring);
        if (cut.length >= 3) fill(cut, BOX_YELLOW);
      }
    }
  }

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
  // a round post in bands of colour: the queues' marker poles and the signals' posts
  const post = (centre: Vec2, radius: number, z0: number, z1: number, band: number, colours: RGB[]) => {
    const segs = 10;
    const bands = Math.max(1, Math.round((z1 - z0) / band));
    for (let k = 0; k < bands; k++) {
      const b0 = z0 + ((z1 - z0) * k) / bands;
      const b1 = z0 + ((z1 - z0) * (k + 1)) / bands;
      for (let s = 0; s < segs; s++) {
        const t0 = (s / segs) * Math.PI * 2;
        const t1 = ((s + 1) / segs) * Math.PI * 2;
        const q0: Vec2 = [centre[0] + radius * Math.cos(t0), centre[1] + radius * Math.sin(t0)];
        const q1: Vec2 = [centre[0] + radius * Math.cos(t1), centre[1] + radius * Math.sin(t1)];
        things.quad(toThree(q0[0], q0[1], b0), toThree(q1[0], q1[1], b0), toThree(q1[0], q1[1], b1), toThree(q0[0], q0[1], b1), colours[k % colours.length]);
      }
    }
  };
  // where each station's queue stops: a yellow and black pole on the grass, a plate on top facing the road
  for (const w of c.traffic?.waiting ?? []) {
    post(w.pole, MARKER.radius, 0, MARKER.height, MARKER.band, [[0.08, 0.08, 0.08], YELLOW]);
    box(w.pole, [0.04, MARKER.plate], w.heading_deg + 90, MARKER.height - 0.05, MARKER.height - 0.05 + MARKER.plate, YELLOW);
  }
  // the signals' posts and lamp housings; the lamps themselves are lit by the scene
  const lamps: SignalLamp[] = [];
  for (const sg of c.traffic?.signals ?? []) {
    for (const hd of sg.heads) {
      post(hd.at, SIGNAL.pole, 0, SIGNAL.height, SIGNAL.height, [[0.32, 0.34, 0.35]]);
      const h = rad(hd.heading_deg);
      const [ux, uy] = dir(h);
      const front: Vec2 = [hd.at[0] + ux * 0.12, hd.at[1] + uy * 0.12];
      const mid = SIGNAL.height + SIGNAL.box[1] / 2;
      box(front, [SIGNAL.box[0], SIGNAL.box[2]], hd.heading_deg, mid - SIGNAL.box[1] / 2, mid + SIGNAL.box[1] / 2, [0.05, 0.05, 0.05]);
      const face: Vec2 = [front[0] + ux * (SIGNAL.box[0] / 2 + 0.005), front[1] + uy * (SIGNAL.box[0] / 2 + 0.005)];
      (['red', 'amber', 'green'] as const).forEach((colour, k) => {
        lamps.push({ signal: sg.id, group: hd.group, colour, position: toThree(face[0], face[1], mid + (1 - k) * SIGNAL.lamp), facing: h });
      });
    }
  }
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
    asphalt: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 }),
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
  add('asphalt', pavement, materials.asphalt);
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

  return { group, materials, lamps, colliders, surfaceHeight };
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
