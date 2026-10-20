// The land round the yard: nothing on the pavement or in a junction, woods outside, a few trees within.
import { describe, expect, it } from 'vitest';
import { circuit } from '../data';
import { pavedForTests, plantedForTests, shapesForTests } from './Scenery';

const [x0, y0, x1, y1] = circuit.props.fence;
const inside = ([x, y]: [number, number]) => x > x0 && x < x1 && y > y0 && y < y1;
const inPoly = (p: [number, number], r: [number, number][]) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > p[1] !== r[j][1] > p[1] && p[0] < ((r[j][0] - r[i][0]) * (p[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
};

describe('the scenery', () => {
  it('builds every tree shape (a shape that cannot be merged would leave the scene with nothing to draw)', () => {
    for (const { trunk, crown } of shapesForTests()) {
      expect(trunk.attributes.position.count).toBeGreaterThan(0);
      expect(crown.attributes.position.count).toBeGreaterThan(0);
    }
  });
  const { trees, bushes } = plantedForTests();
  it('plants woods outside the fence and trees on the grass within, all solid inside', () => {
    expect(trees.filter((t) => !inside(t.at)).length).toBeGreaterThan(100);
    const within = trees.filter((t) => inside(t.at));
    expect(within.length).toBeGreaterThan(10);
    expect(within.every((t) => t.solid)).toBe(true);
  });
  it('never on the pavement or in a junction, tree or bush', () => {
    for (const p of [...trees, ...bushes].map((t) => t.at)) {
      expect(pavedForTests(p), `${p}`).toBe(false);
      for (const j of circuit.traffic!.junctions) expect(inPoly(p, j.polygon), `${p} in ${j.id}`).toBe(false);
    }
  });
});
