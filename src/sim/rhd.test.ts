// Malaysia: right-hand drive cars, traffic keeps LEFT, roundabouts go clockwise. One test per thing the owner listed.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { circuit } from './data';
import { SWIFT_2022 as CAR } from './physics/cars/swift-2022';
import { LAMPS } from './physics/Lamps';
import { lampColour } from './physics/Lamps';
import { MIRRORS } from './physics/mirrors';
import { toDeg } from './geom';

// the car frame: x forward, y up, z to the RIGHT
describe('the car is right-hand drive', () => {
  it('seats the driver, the wheel and the dials on the right', () => {
    expect(CAR.eye[2]).toBeGreaterThan(0.2);
    expect(CAR.steering.hub[2]).toBeGreaterThan(0.2);
    expect(CAR.cluster.at[2]).toBeGreaterThan(0.2);
    expect(Math.abs(CAR.eye[2] - CAR.steering.hub[2])).toBeLessThan(0.05);   // the eye is on the wheel's line
  });

  it('has the near door mirror on the right and the far one on the left, both turned outward', () => {
    expect(CAR.mirrors.right[2]).toBeGreaterThan(0.5);
    expect(CAR.mirrors.left[2]).toBeLessThan(-0.5);
    const yaw = (id: string) => MIRRORS.find((m) => m.id === id)!.yawDeg;
    expect(yaw('left')).toBeLessThan(90);    // less than 90 turns towards the car's left
    expect(yaw('right')).toBeGreaterThan(90);
    expect(MIRRORS.find((m) => m.id === 'left')!.onGlass).toBe(false);   // the far mirror is outside the windscreen view
    expect(MIRRORS.find((m) => m.id === 'right')!.onGlass).toBe(true);
  });

  it('flashes the left lamps for a left indicator (+1) and the right lamps for a right one (-1)', () => {
    const out = new THREE.Color();
    const lit = (indicator: -1 | 1, side: -1 | 1) =>
      LAMPS.filter((l) => l.side === side && !['tail', 'stop', 'reverse', 'head'].includes(l.kind)).some((l) => lampColour(l, { brake: false, head: false, reverse: false, indicator }, 0, out).r > 0);
    expect(lit(1, -1)).toBe(true);
    expect(lit(1, 1)).toBe(false);
    expect(lit(-1, 1)).toBe(true);
    expect(lit(-1, -1)).toBe(false);
  });
});

// the yard: x east, y north, heading counter-clockwise from east. Keeping left, a car heading east is on the NORTH side.
describe('traffic keeps left', () => {
  const spineMidY = circuit.traffic!.zebra.centre[1];   // the middle of the east-west spine road
  const onSpine = (x: number, y: number) => y > 21.3 && y < 29.8 && x > 12 && x < 115;

  it('drives the learner east on the north half of the spine and west on the south half', () => {
    const legs = circuit.route.samples.filter((s) => onSpine(s[1], s[2]) && [0, 180].includes(Math.round(s[3])));
    expect(legs.length).toBeGreaterThan(100);
    for (const s of legs) expect(s[2] > spineMidY ? 0 : 180, `s=${s[0]}`).toBe(Math.round(s[3]));
  });

  it('paints the spine arrows the same way', () => {
    const arrows = circuit.markings!.arrows!.filter((a) => onSpine(a.at[0], a.at[1]) && [0, 180].includes(a.heading_deg));
    expect(arrows.length).toBeGreaterThan(4);
    for (const a of arrows) expect(a.at[1] > spineMidY ? 0 : 180, a.junction).toBe(a.heading_deg);
  });

  it('sends the roundabout clockwise, and the island road clockwise outside and anticlockwise inside', () => {
    const turn = (id: string) => {
      const p = circuit.traffic!.loops.find((l) => l.id === id)!.points;
      return p.reduce((area, q, i) => { const n = p[(i + 1) % p.length]; return area + q[0] * n[1] - n[0] * q[1]; }, 0) / 2;
    };
    expect(turn('roundabout')).toBeLessThan(0);    // negative area: clockwise
    expect(turn('outer')).toBeLessThan(0);
    expect(turn('island-cw')).toBeLessThan(0);
    expect(turn('island-ccw')).toBeGreaterThan(0);   // the inner lane has the block on its left, as keeping left puts it
  });

  it('spawns the learner heading east in a lane, facing the course', () => {
    expect(toDeg(0)).toBe(0);
    expect(circuit.spawn.heading_deg).toBe(0);
  });
});
