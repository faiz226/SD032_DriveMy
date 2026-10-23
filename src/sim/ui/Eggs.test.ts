// Free drive's surprises: the cat at the zebra crossing, and the doughnuts.
import * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import type { VehicleSample } from '../contracts';
import { circuit } from '../data';
import { catRig, Eggs, LEG, poseCat, useEggs } from './Eggs';

const DT = 1 / 60;
const z = circuit.traffic!.zebra;   // across the spine road, which runs east-west
const LANE_Y = z.centre[1] + 1.9;   // eastbound keeps left: the road's north half

function at(x: number, y: number, heading: number, kmh: number): VehicleSample {
  const w = { x, y, z: 0, onKerb: null };
  return { t: 0, x, y, z: 0, heading, speedKmh: kmh, gear: 'D', handbrake: false, brake: 0, steer: 0, wheels: [w, w, w, w], slope: null };
}

/** Drive east along the lane at kmh from x (rear axle) for seconds, or stand there; returns where it got to. */
function drive(eggs: Eggs, x: number, kmh: number, seconds: number) {
  for (let k = 0; k < seconds / DT; k++) {
    eggs.step(at(x, LANE_Y, 0, kmh), DT);
    x += (kmh / 3.6) * DT;
  }
  return x;
}

const said = () => useEggs.getState().toast?.key ?? null;

describe('free drive surprises', () => {
  beforeEach(() => useEggs.setState({ toast: null }));

  it('the cat thanks a driver who stops short of the zebra for it', () => {
    const eggs = new Eggs();
    let x = drive(eggs, z.centre[0] - 40, 0, 6);   // its first rest runs out, out of its sight
    while (!eggs.cat.on) x = drive(eggs, x, 10, DT);   // coming up the lane, it starts across
    x = drive(eggs, x, 10, (z.centre[0] - z.length / 2 - 8 - 3.15 - x) / (10 / 3.6));   // to 8 m short of the crossing
    drive(eggs, x, 0, 12);
    expect(said()).toBe('sim.egg.catThanks');
    expect(eggs.cat.on).toBe(false);
  });

  it('the cat leaps clear of a driver who goes over the crossing while it is on it', () => {
    const eggs = new Eggs();
    let x = drive(eggs, z.centre[0] - 40, 0, 6);
    while (!eggs.cat.on) x = drive(eggs, x, 20, DT);
    drive(eggs, x, 20, 8);
    expect(said()).toBe('sim.egg.catJump');
  });

  it('the rigged cat walks: a paw on the road stays where it landed, and no paw goes into the road', () => {
    const r = catRig();
    const landed: (number | null)[] = [null, null, null, null];
    const standing = [0, 0, 0, 0];
    for (let u = 0; u < 1; u += 0.002) {
      r.root.position.x = u;   // walking along +x
      poseCat(r, u, -1);
      r.root.updateMatrixWorld(true);
      r.knees.forEach((knee, i) => {
        const paw = knee.localToWorld(new THREE.Vector3(0, -LEG.lower, 0));
        expect(paw.y, `paw ${i} at ${u.toFixed(3)} m`).toBeGreaterThan(-0.001);
        if (Math.abs(paw.y) > 1e-4) { landed[i] = null; return; }   // in the air
        landed[i] ??= paw.x;
        standing[i]++;
        expect(Math.abs(paw.x - landed[i]!), `paw ${i} slides at ${u.toFixed(3)} m`).toBeLessThan(0.001);
      });
    }
    for (const n of standing) expect(n).toBeGreaterThan(150);   // each paw stood for about half the walk
  });

  it('three turns on the spot are doughnuts; fewer are not', () => {
    const eggs = new Eggs();
    let h = 0;
    for (let k = 0; k < 17 / DT; k++) eggs.step(at(10, 10, (h += DT), 8), DT);   // 17 rad: under three turns
    expect(said()).toBeNull();
    for (let k = 0; k < 2 / DT; k++) eggs.step(at(10, 10, (h += DT), 8), DT);
    expect(said()).toBe('sim.egg.doughnut');
  });
});
