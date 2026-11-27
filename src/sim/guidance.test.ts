import { describe, expect, it } from 'vitest';
import { circuit } from './data';
import { distToSegment, onPavement, rad } from './geom';
import { BARRIERS, firstMove, planChevrons, planGantries, spawnLookYaw, startPoses } from './guidance';
import { getWorld } from './world/build';
import { rightOf } from './world/cues';

const route = circuit.route.samples;
const routeDistance = (p: [number, number]) => Math.min(...route.map((s) => Math.hypot(s[1] - p[0], s[2] - p[1])));
const named = (id: string) => circuit.stations.find((g) => g.id === id)!;
const poseOf = (id: string) => ({ at: named(id).start.at, heading: rad(named(id).start.heading_deg) });

describe('the first move is shown from every start', () => {
  it('knows which way each level begins', () => {
    const kind = (id: string) => firstMove(circuit, poseOf(id)).kind;
    expect(kind('side-parking')).toBe('right');   // 3-point parking starts by turning right
    expect(kind('s-curve')).toBe('right');
    expect(kind('z-curve')).toBe('right');
    expect(kind('hill-start')).toBe('ahead');
    expect(kind('ramp-test')).toBe('ahead');
    expect(kind('parallel-parking')).toBe('ahead');
    expect(firstMove(circuit, { at: circuit.spawn.at, heading: rad(circuit.spawn.heading_deg) }).kind).toBe('ahead');
  });

  it('turns the head towards a turn at the start, and not for straight on', () => {
    expect(spawnLookYaw(circuit, poseOf('side-parking'))).toBeLessThan(-0.3);   // right is negative
    expect(spawnLookYaw(circuit, poseOf('hill-start'))).toBe(0);
    for (const pose of startPoses(circuit)) expect(Math.abs(spawnLookYaw(circuit, pose))).toBeLessThanOrEqual(0.75);
  });

  it('has a board ahead of every start, in front of it, on the route', () => {
    const gantries = planGantries(circuit);
    for (const pose of startPoses(circuit)) {
      const [fx, fy] = [Math.cos(pose.heading), Math.sin(pose.heading)];
      const seen = gantries.some((g) => {
        const dx = g.at[0] - pose.at[0], dy = g.at[1] - pose.at[1];
        const d = Math.hypot(dx, dy);
        return d > 6 && d < 25 && (dx * fx + dy * fy) / d > 0.2 && routeDistance(g.at) < 1;
      });
      expect(seen, JSON.stringify(pose)).toBe(true);
    }
  });
});

describe('chevron boards on the bends', () => {
  const chevrons = planChevrons(circuit);
  it('has boards, none on the paving, none in the way of the route', () => {
    expect(chevrons.length).toBeGreaterThan(8);
    for (const c of chevrons) {
      expect(onPavement(circuit, c.at)).toBe(false);
      expect(routeDistance(c.at)).toBeGreaterThan(2);
    }
  });
  it('points each board the way the road turns (the S curve changes sides, so the rest must agree)', () => {
    let agree = 0;
    for (const c of chevrons) {
      const i = route.reduce((best, s, k) => (Math.hypot(s[1] - c.at[0], s[2] - c.at[1]) < Math.hypot(route[best][1] - c.at[0], route[best][2] - c.at[1]) ? k : best), 0);
      const turn = ((route[Math.min(route.length - 1, i + 24)][3] - route[Math.max(0, i - 24)][3] + 540) % 360) - 180;
      if (Math.sign(turn) === (c.kind === 'left' ? 1 : -1)) agree += 1;
    }
    expect(agree / chevrons.length).toBeGreaterThan(0.85);
  });
});

describe('closed-road barriers', () => {
  it('sit across roads the route never uses, and never across the route', () => {
    expect(BARRIERS.length).toBeGreaterThanOrEqual(10);
    for (const b of BARRIERS) {
      for (const s of route) expect(distToSegment([s[1], s[2]], b.a, b.b), b.note).toBeGreaterThan(1.5);
    }
  });
  it('have an invisible collider each, in the world, and merged meshes (few draw calls)', () => {
    const world = getWorld(circuit);
    expect(world.colliders.boxes.filter((b) => b.name.startsWith('barrier:'))).toHaveLength(BARRIERS.length);
    const meshes = world.group.getObjectByName('guidance')!.children;
    expect(meshes.map((m) => m.name).sort()).toEqual(['barrier-glow', 'barriers', 'signs']);
  });
});

describe('the hill stop box', () => {
  it('is wide enough for a normal stop: 1.6 m along the road, centred where it was', () => {
    const band = named('hill-start').stop_band!;
    expect(+(band.s_to - band.s_from).toFixed(2)).toBe(1.6);
    expect((band.s_from + band.s_to) / 2).toBeCloseTo(24.1, 5);
  });
});

describe('boards read the right way round', () => {
  it("puts a board's right where the driver's right is, for a driver heading any way", () => {
    for (const h of [0, 90, 180, 270, 37]) {
      const heading = rad(h);
      const [rx, ry] = rightOf(heading + Math.PI);          // the board faces back at the driver
      expect(rx).toBeCloseTo(Math.sin(heading), 6);          // the driver's own right
      expect(ry).toBeCloseTo(-Math.cos(heading), 6);
    }
  });
});
