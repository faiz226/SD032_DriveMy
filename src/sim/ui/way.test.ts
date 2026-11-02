import { describe, expect, it } from 'vitest';
import { circuit } from '../data';
import { routeAt, wayTurnDeg } from './way';

describe('the way arrow', () => {
  const car = { at: [0, 0] as [number, number], heading: 0 };   // facing east

  it('points up for the route dead ahead, left for a route on the left and right for one on the right', () => {
    expect(wayTurnDeg(car, [10, 0])).toBeCloseTo(-90);
    expect(wayTurnDeg(car, [0, 10])).toBeCloseTo(-180);   // north of a car facing east: its left
    expect(wayTurnDeg(car, [0, -10])).toBeCloseTo(0);     // south: its right
  });

  it("finds the route's point by the distance along it", () => {
    const q = circuit.route.samples[400];
    expect(routeAt(q[0])).toEqual([q[1], q[2]]);
  });
});
