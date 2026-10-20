// A lane path the other cars drive: a polyline with its distance along it, closed (a loop) or open.
// Pure TypeScript, in the circuit frame (metres, x east, y north, headings CCW from +x).
import type { Vec2 } from '../contracts';
import { wrapPi } from '../geom';

export class Path {
  readonly pts: Vec2[];
  readonly cum: number[];          // distance to each point
  readonly length: number;
  readonly heading: number[];      // at each point
  readonly curveKmh: number[];     // the speed its bend allows at each point (lateral acceleration LAT)

  constructor(points: Vec2[], readonly closed: boolean, lat = 2.0) {
    this.pts = points;
    this.cum = [0];
    for (let i = 1; i < points.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    const n = points.length;
    this.length = this.cum[n - 1] + (closed ? Math.hypot(points[0][0] - points[n - 1][0], points[0][1] - points[n - 1][1]) : 0);
    this.heading = points.map((_, i) => {
      const a = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
      const b = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      return Math.atan2(b[1] - a[1], b[0] - a[0]);
    });
    // the bend over the 2 m either side of each point: radius from the heading change
    const span = 4;
    this.curveKmh = points.map((_, i) => {
      const j = closed ? (i + span) % n : Math.min(n - 1, i + span);
      const k = closed ? (i - span + n) % n : Math.max(0, i - span);
      const turn = Math.abs(wrapPi(this.heading[j] - this.heading[k]));
      const dist = this.dist(this.cum[k], this.cum[j]) || 1;
      const radius = turn > 1e-3 ? dist / turn : 1e6;
      return Math.sqrt(lat * radius) * 3.6;
    });
  }

  /** s wrapped onto the path (closed) or clamped (open). */
  wrap(s: number): number {
    if (this.closed) return ((s % this.length) + this.length) % this.length;
    return Math.max(0, Math.min(this.length, s));
  }

  /** Distance forward from a to b along the path (closed: always forward, round the loop). */
  dist(a: number, b: number): number {
    if (!this.closed) return b - a;
    const d = this.wrap(b) - this.wrap(a);
    return d < 0 ? d + this.length : d;
  }

  /** The index of the point at or before s. */
  index(s: number): number {
    const w = this.wrap(s);
    let lo = 0;
    let hi = this.pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.cum[mid] <= w) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /** Position and heading at s. */
  pose(s: number): { x: number; y: number; heading: number } {
    const w = this.wrap(s);
    const i = this.index(w);
    const n = this.pts.length;
    const j = this.closed ? (i + 1) % n : Math.min(n - 1, i + 1);
    const segLen = (j === 0 ? this.length : this.cum[j]) - this.cum[i] || 1;
    const u = Math.max(0, Math.min(1, (w - this.cum[i]) / segLen));
    const [ax, ay] = this.pts[i];
    const [bx, by] = this.pts[j];
    return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, heading: this.heading[i] + wrapPi(this.heading[j] - this.heading[i]) * u };
  }

  /** The lowest speed a bend allows from s over the next `ahead` metres. */
  curveLimitKmh(s: number, ahead: number): number {
    let i = this.index(s);
    let best = Infinity;
    const n = this.pts.length;
    for (let k = 0; k <= Math.ceil(ahead / 0.5) + 1; k++) {
      best = Math.min(best, this.curveKmh[i]);
      i = this.closed ? (i + 1) % n : Math.min(n - 1, i + 1);
    }
    return best;
  }

  /**
   * Where p falls on the path between `from` and `from + window` (forward): its distance along the path and
   * its offset across it (+ left), or null if it is outside that stretch. The offset is p's true distance from
   * the stretch, so a point far past its end, on the line its last segment points along, is far, not near.
   */
  project(p: Vec2, from: number, window: number): { s: number; offset: number } | null {
    const n = this.pts.length;
    let i = this.index(from);
    let best: { s: number; offset: number } | null = null;
    let bestD = Infinity;
    for (let walked = -(this.wrap(from) - this.cum[i]); walked <= window && walked < this.length; ) {
      const j = this.closed ? (i + 1) % n : i + 1;
      if (j >= n && !this.closed) break;
      const a = this.pts[i];
      const b = this.pts[j];
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const len2 = ex * ex + ey * ey || 1;
      const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / len2));
      const dx = p[0] - (a[0] + ex * u);
      const dy = p[1] - (a[1] + ey * u);
      const d = Math.hypot(dx, dy);
      if (d < bestD) {
        bestD = d;
        const along = this.cum[i] + u * Math.sqrt(len2);
        best = { s: along, offset: (ex * dy - ey * dx >= 0 ? 1 : -1) * d };
      }
      walked += Math.sqrt(len2);
      i = j;
    }
    if (!best) return null;
    const ahead = this.dist(from, best.s);
    return ahead <= window ? best : null;
  }
}
