// @vitest-environment node
// The other cars on their own and with a learner: they keep apart, keep moving, stop on red, give way where they
// should, and report what the learner does to them.
import { describe, expect, it } from 'vitest';
import type { SimEvent, Vec2, VehicleSample } from '../contracts';
import { circuit, swift } from '../data';
import { dir, rad, segmentsCross } from '../geom';
import { Traffic } from './model';
import { lightsAt } from './signals';

const DT = 1 / 60;
const data = circuit.traffic!;

/** A learner standing (or moving) at a rear-axle pose. */
function learner(at: Vec2, heading: number, kmh = 0, t = 0): VehicleSample {
  const w = { x: at[0], y: at[1], z: 0, onKerb: null };
  return { t, x: at[0], y: at[1], z: 0, heading, speedKmh: kmh, gear: 'D', handbrake: kmh === 0, brake: 0, steer: 0, wheels: [w, w, w, w], slope: null };
}

function corners(x: number, y: number, h: number): Vec2[] {
  const back = swift.length_m - swift.wheelbase_m - swift.front_overhang_m;
  const nose = swift.wheelbase_m + swift.front_overhang_m;
  const half = swift.width_body_m / 2;
  const [hx, hy] = dir(h);
  const at = (al: number, ac: number): Vec2 => [x + hx * al - hy * ac, y + hy * al + hx * ac];
  return [at(-back, -half), at(nose, -half), at(nose, half), at(-back, half)];
}

function overlap(a: Vec2[], b: Vec2[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % 4];
      const nx = p[1] - q[1];
      const ny = q[0] - p[0];
      const pa = a.map(([x, y]) => nx * x + ny * y);
      const pb = b.map(([x, y]) => nx * x + ny * y);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}

describe('the other cars', () => {
  it('keep apart and keep moving for ten minutes, and never pass a stop line on red', () => {
    const traffic = new Traffic(circuit, swift);
    const n = traffic.cars.length;
    expect(n).toBe(data.loops.reduce((acc, lp) => acc + lp.cars, 0));
    const travelled = new Array(n).fill(0);
    let fronts = traffic.poses().map((p) => [p.x + Math.cos(p.heading) * 3.146, p.y + Math.sin(p.heading) * 3.146] as Vec2);
    for (let k = 0; k < 600 / DT; k++) {
      traffic.step(DT, null);
      const poses = traffic.poses();
      poses.forEach((p, i) => { travelled[i] += (p.kmh / 3.6) * DT; });
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = poses[i];
          const b = poses[j];
          expect(overlap(corners(a.x, a.y, a.heading), corners(b.x, b.y, b.heading)), `${a.id} and ${b.id} at t ${traffic.t.toFixed(1)}`).toBe(false);
        }
      }
      const now = poses.map((p) => [p.x + Math.cos(p.heading) * 3.146, p.y + Math.sin(p.heading) * 3.146] as Vec2);
      for (const sg of data.signals) {
        for (const ap of sg.approaches) {
          if (lightsAt(sg, traffic.t)[ap.group] !== 'red') continue;
          now.forEach((f, i) => {
            const crossed = segmentsCross(fronts[i], f, ap.stop[0], ap.stop[1]) && Math.cos(poses[i].heading - rad(ap.heading_deg)) > 0.5;
            expect(crossed, `${poses[i].id} ran the red at ${sg.id} at t ${traffic.t.toFixed(1)}`).toBe(false);
          });
        }
      }
      fronts = now;
    }
    // every car laps its loop more than twice in ten minutes: nothing gridlocked
    traffic.cars.forEach((c, i) => expect(travelled[i], c.id).toBeGreaterThan(2 * c.path.length));
  }, 120_000);

  it('never drive into a learner parked across a junction', () => {
    const traffic = new Traffic(circuit, swift);
    const box = data.junctions.find((j) => j.id === 'spine-52')!.polygon;
    const cx = box.reduce((a, p) => a + p[0], 0) / box.length;
    const cy = box.reduce((a, p) => a + p[1], 0) / box.length;
    const events: SimEvent[] = [];
    for (let k = 0; k < 180 / DT; k++) events.push(...traffic.step(DT, learner([cx - 1.2, cy], 0, 0, k * DT)));
    expect(events.filter((e) => e.type === 'vehicle-hit')).toEqual([]);
  }, 60_000);

  it('report the learner touching one of them, once per contact', () => {
    const traffic = new Traffic(circuit, swift);
    const p = traffic.poses()[0];
    const events: SimEvent[] = [];
    for (let k = 0; k < 30; k++) {
      const q = traffic.poses()[0];
      events.push(...traffic.step(DT, learner([q.x, q.y], q.heading, 0, k * DT)));
    }
    expect(events.filter((e) => e.type === 'vehicle-hit').length, p.id).toBe(1);
  });

  it('report a learner crossing a stop line on red, and not on green', () => {
    const sg = data.signals[0];
    const ap = sg.approaches[0];
    const h = rad(ap.heading_deg);
    const mid: Vec2 = [(ap.stop[0][0] + ap.stop[1][0]) / 2, (ap.stop[0][1] + ap.stop[1][1]) / 2];
    const nose = swift.wheelbase_m + swift.front_overhang_m;
    const drive = (t0: number) => {
      const traffic = new Traffic(circuit, swift, { loops: false });
      traffic.t = t0;
      const events: SimEvent[] = [];
      for (let k = -60; k <= 60; k++) {   // the front bumper from 1 m before the line to 1 m past it
        const front: Vec2 = [mid[0] + Math.cos(h) * k / 60, mid[1] + Math.sin(h) * k / 60];
        events.push(...traffic.step(DT, learner([front[0] - Math.cos(h) * nose, front[1] - Math.sin(h) * nose], h, 3.6, t0 + k * DT)));
      }
      return events.filter((e) => e.type === 'red-light');
    };
    const redAt = [...Array(300).keys()].map((k) => k / 10).find((t) => lightsAt(sg, t)[ap.group] === 'red' && lightsAt(sg, t + 3)[ap.group] === 'red')!;
    const greenAt = [...Array(300).keys()].map((k) => k / 10).find((t) => lightsAt(sg, t)[ap.group] === 'green' && lightsAt(sg, t + 3)[ap.group] === 'green')!;
    expect(drive(redAt)).toHaveLength(1);
    expect(drive(greenAt)).toEqual([]);
  });

  it('give the merge a gap: a main-road car on its way makes the gap short, none makes it endless', () => {
    expect(new Traffic(circuit, swift, { loops: false }).mergeGapS()).toBe(Infinity);
    const traffic = new Traffic(circuit, swift);
    const seen: number[] = [];
    for (let k = 0; k < 120 / DT; k++) { traffic.step(DT, null); seen.push(traffic.mergeGapS()); }
    expect(Math.min(...seen)).toBeLessThan(data.merge.gap_s);
    expect(seen.some((g) => g === Infinity || g > 10)).toBe(true);
  }, 60_000);
});
