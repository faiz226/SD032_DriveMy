// Pure 2D geometry in the circuit frame (metres, x east, y north, angles CCW from +x).
// Shared by the rules engine (sim/core), the world (sim/world), the car (sim/physics) and tests.
import type { CarConfig, CircuitData, Polygon, Slope, Vec2 } from './contracts';

export const rad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;

/** Angle wrapped to (-PI, PI]. */
export function wrapPi(a: number): number {
  const x = (a + Math.PI) % (2 * Math.PI);
  return (x < 0 ? x + 2 * Math.PI : x) - Math.PI;
}

export const dir = (heading: number): Vec2 => [Math.cos(heading), Math.sin(heading)];

export function pointInPolygon(p: Vec2, poly: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The pavement is read even-odd: ring 0 is the yard edge, every other ring a hole. */
export function onPavement(c: CircuitData, p: Vec2): boolean {
  let inside = false;
  for (const ring of c.pavement) if (pointInPolygon(p, ring)) inside = !inside;
  return inside;
}

export function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

export function nearestRing(rings: Polygon[], p: Vec2): { ring: number; dist: number } {
  let best = { ring: -1, dist: Infinity };
  rings.forEach((ring, r) => {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const d = distToSegment(p, ring[j], ring[i]);
      if (d < best.dist) best = { ring: r, dist: d };
    }
  });
  return best;
}

// ---------------------------------------------------------------- kerb strips

const CELL = 1;   // metres: the grid that indexes the ring segments

interface KerbIndex {
  x0: number; y0: number; nx: number; ny: number;
  cells: Map<number, Array<[number, number]>>;   // cell -> [ring, segment start]
  rings: Polygon[];                               // the rings without their closing duplicate point
  ccw: boolean[];                                 // each ring's winding
}
const indexes = new WeakMap<CircuitData, KerbIndex>();

function kerbIndex(c: CircuitData): KerbIndex {
  let ix = indexes.get(c);
  if (ix) return ix;
  const [x0, y0, x1, y1] = c.site.bounds;
  const rings = c.kerbs.rings.map((r) => (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r));
  ix = { x0, y0, nx: Math.ceil((x1 - x0) / CELL) + 1, ny: Math.ceil((y1 - y0) / CELL) + 1, cells: new Map(), rings, ccw: [] };
  const reach = c.kerbs.width + 0.5;   // a segment is listed in every cell its kerb strip can reach
  rings.forEach((ring, r) => {
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      area += a[0] * b[1] - b[0] * a[1];
      const cx0 = Math.floor((Math.min(a[0], b[0]) - reach - x0) / CELL);
      const cx1 = Math.floor((Math.max(a[0], b[0]) + reach - x0) / CELL);
      const cy0 = Math.floor((Math.min(a[1], b[1]) - reach - y0) / CELL);
      const cy1 = Math.floor((Math.max(a[1], b[1]) + reach - y0) / CELL);
      for (let cx = cx0; cx <= cx1; cx++) {
        for (let cy = cy0; cy <= cy1; cy++) {
          const key = cy * ix!.nx + cx;
          const list = ix!.cells.get(key);
          if (list) list.push([r, i]);
          else ix!.cells.set(key, [[r, i]]);
        }
      }
    }
    ix!.ccw[r] = area > 0;
  });
  indexes.set(c, ix);
  return ix;
}

const cross = (o: Vec2, a: Vec2, b: Vec2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Inside the ring, judged from its nearest segment (i, i+1) at parameter t: exact near the edge. */
function insideRing(ring: Polygon, ccw: boolean, i: number, t: number, p: Vec2): boolean {
  const n = ring.length;
  const at = (k: number) => ring[((k % n) + n) % n];
  const left = (a: Vec2, b: Vec2) => (cross(a, b, p) > 0) === ccw;   // on the interior side of a-b
  if (t > 0 && t < 1) return left(at(i), at(i + 1));
  const v = t <= 0 ? i : i + 1;                       // nearest point is a vertex: use both its edges
  const a = at(v - 1);
  const b = at(v);
  const d = at(v + 1);
  const convex = (cross(a, b, d) > 0) === ccw;
  return convex ? left(a, b) && left(b, d) : left(a, b) || left(b, d);
}

/**
 * Which kerb a tyre's contact patch touches, or null. Each kerb is a strip `kerbs.width` wide on the
 * grass side of its ring. A patch `tyreWidth` wide touches it when its centre is on the strip, or
 * close enough to it on either side. tyreWidth 0 tests the contact point alone.
 */
export function kerbContact(c: CircuitData, p: Vec2, tyreWidth: number): number | null {
  const ix = kerbIndex(c);
  const cx = Math.floor((p[0] - ix.x0) / CELL);
  const cy = Math.floor((p[1] - ix.y0) / CELL);
  const list = ix.cells.get(cy * ix.nx + cx);
  if (!list) return null;
  let best = { ring: -1, seg: 0, t: 0, dist: Infinity };
  for (const [r, i] of list) {
    const ring = ix.rings[r];
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
    const dist = Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
    if (dist < best.dist) best = { ring: r, seg: i, t, dist };
  }
  if (best.ring < 0) return null;
  const inside = insideRing(ix.rings[best.ring], ix.ccw[best.ring], best.seg, best.t, p);
  const paved = best.ring === 0 ? inside : !inside;   // ring 0 bounds the yard; every other ring is a hole
  const half = tyreWidth / 2;
  return (paved ? best.dist < half : best.dist < c.kerbs.width + half) ? best.ring : null;
}

/** Height of a slope's deck at a distance along its axis (0 off either end). */
export function slopeHeight(slope: Slope, along: number): number {
  const prof = slope.profile;
  if (along <= prof[0][0] || along >= prof[prof.length - 1][0]) return along >= prof[prof.length - 1][0] ? prof[prof.length - 1][1] : prof[0][1];
  for (let i = 1; i < prof.length; i++) {
    const [a1, h1] = prof[i];
    const [a0, h0] = prof[i - 1];
    if (along <= a1) return h0 + ((h1 - h0) * (along - a0)) / (a1 - a0);
  }
  return prof[prof.length - 1][1];
}

/** Distance along and across a slope's axis from its start. */
export function slopeLocal(slope: Slope, p: Vec2): { along: number; across: number } {
  const [ux, uy] = dir(rad(slope.heading_deg));
  const dx = p[0] - slope.start[0];
  const dy = p[1] - slope.start[1];
  return { along: dx * ux + dy * uy, across: -dx * uy + dy * ux };
}

/**
 * The slope the car is on, if either axle is over its deck, with the rear axle's distance along it.
 * `rear` is the rear-axle centre; this is what VehicleSample.slope carries.
 */
export function slopeAt(c: CircuitData, rear: Vec2, heading: number, wheelbase: number): { id: 'hill' | 'ramp'; along: number } | null {
  const [hx, hy] = dir(heading);
  const front: Vec2 = [rear[0] + hx * wheelbase, rear[1] + hy * wheelbase];
  for (const slope of c.slopes) {
    const length = slope.profile[slope.profile.length - 1][0];
    const on = (p: Vec2) => {
      const l = slopeLocal(slope, p);
      return l.along >= 0 && l.along <= length && Math.abs(l.across) <= slope.width / 2;
    };
    if (on(rear) || on(front)) return { id: slope.id, along: slopeLocal(slope, rear).along };
  }
  return null;
}

/** True when the segment p0-p1 crosses the segment a-b. */
export function segmentsCross(p0: Vec2, p1: Vec2, a: Vec2, b: Vec2): boolean {
  const cross = (o: Vec2, u: Vec2, v: Vec2) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
  const d1 = cross(a, b, p0);
  const d2 = cross(a, b, p1);
  const d3 = cross(p0, p1, a);
  const d4 = cross(p0, p1, b);
  return ((d1 > 0 && d2 <= 0) || (d1 < 0 && d2 >= 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export const rearOverhang = (car: CarConfig) => car.length_m - car.wheelbase_m - car.front_overhang_m;

/** The car's footprint corners at a rear-axle pose: rear-right, front-right, front-left, rear-left. */
export function footprint(rear: Vec2, heading: number, car: CarConfig, width: number): Vec2[] {
  const [hx, hy] = dir(heading);
  const back = -rearOverhang(car);
  const fwd = car.wheelbase_m + car.front_overhang_m;
  const half = width / 2;
  const at = (along: number, left: number): Vec2 => [rear[0] + hx * along - hy * left, rear[1] + hy * along + hx * left];
  return [at(back, -half), at(fwd, -half), at(fwd, half), at(back, half)];
}

export interface Bay { centre: Vec2; axis_deg: number; length: number; width: number }

/** How far the worst corner sits outside the bay (<= 0 means every corner is inside). */
export function bayOverhang(bay: Bay, corners: Vec2[]): number {
  const [ux, uy] = dir(rad(bay.axis_deg));
  let worst = -Infinity;
  for (const [x, y] of corners) {
    const dx = x - bay.centre[0];
    const dy = y - bay.centre[1];
    const along = Math.abs(dx * ux + dy * uy) - bay.length / 2;
    const across = Math.abs(-dx * uy + dy * ux) - bay.width / 2;
    worst = Math.max(worst, along, across);
  }
  return worst;
}

/** The largest yaw at which a length x width footprint still fits a bay's width: L sin t + W cos t = bay width. */
export function bayHeadingLimit(length: number, width: number, bayWidth: number): number {
  return Math.asin(Math.min(1, bayWidth / Math.hypot(length, width))) - Math.atan2(width, length);
}

/** Heading error to a bay's axis, either way round, in [0, PI/2]. */
export function headingErrorToAxis(heading: number, axisDeg: number): number {
  const e = Math.abs(wrapPi(heading - rad(axisDeg)));
  return Math.min(e, Math.PI - e);
}
