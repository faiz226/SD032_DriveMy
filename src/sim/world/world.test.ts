import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Vec2 } from '../contracts';
import { circuit, rules, swift } from '../data';
import { kerbContact, slopeHeight } from '../geom';
import { createSession } from '../core/session';
import { buildWorld, getWorld, toThree } from './build';

const world = getWorld(circuit);
const find = (name: string) => {
  const o = world.group.getObjectByName(name);
  expect(o, name).toBeDefined();
  return o!.position;
};
const near = (got: THREE.Vector3, want: THREE.Vector3, what: string) => {
  expect(got.distanceTo(want), what).toBeLessThan(0.01);
};
const mid = (a: Vec2, b: Vec2): Vec2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

describe('the world is placed from circuit.json', () => {
  it('has every gate, bay, pole, slope, booth, the spawn and every start within 1 cm', () => {
    let count = 0;
    for (const g of circuit.stations) {
      for (const gate of g.gates) {
        const m = mid(gate.a, gate.b);
        near(find(`gate:${g.id}:${gate.id}`), toThree(m[0], m[1], world.surfaceHeight(m[0], m[1])), `gate ${g.id}:${gate.id}`);
        count++;
      }
      if (g.bay) { near(find(`bay:${g.id}`), toThree(g.bay.centre[0], g.bay.centre[1]), `bay ${g.id}`); count++; }
      near(find(`start:${g.id}`), toThree(g.start.at[0], g.start.at[1], world.surfaceHeight(g.start.at[0], g.start.at[1])), `start ${g.id}`);
      count++;
    }
    circuit.obstacles.poles.forEach((p, i) => { near(find(`pole:${i}`), toThree(p.at[0], p.at[1], p.base_z ?? 0), `pole ${i}`); count++; });
    for (const s of circuit.slopes) { near(find(`slope:${s.id}`), toThree(s.start[0], s.start[1]), `slope ${s.id}`); count++; }
    circuit.props.booths.forEach((b, i) => { near(find(`booth:${i}`), toThree(b.centre[0], b.centre[1]), `booth ${i}`); count++; });
    near(find('spawn'), toThree(circuit.spawn.at[0], circuit.spawn.at[1]), 'spawn');
    expect(count).toBeGreaterThan(40);
  });

  it('puts a collider on every pole, carrying its index', () => {
    expect(world.colliders.poles.map((p) => p.index)).toEqual(circuit.obstacles.poles.map((_, i) => i));
    world.colliders.poles.forEach((p, i) => {
      const src = circuit.obstacles.poles[i];
      expect(p.position[0]).toBeCloseTo(src.at[0], 3);
      expect(p.position[2]).toBeCloseTo(-src.at[1], 3);
      expect(p.position[1] - p.halfHeight).toBeCloseTo(src.base_z ?? 0, 3);
    });
  });

  it('raises both slopes to their profiles', () => {
    for (const s of circuit.slopes) {
      for (const [along, h] of s.profile) {
        const [ux, uy] = [Math.cos((s.heading_deg * Math.PI) / 180), Math.sin((s.heading_deg * Math.PI) / 180)];
        const a = Math.min(along, s.profile[s.profile.length - 1][0] - 1e-6);
        expect(world.surfaceHeight(s.start[0] + ux * a, s.start[1] + uy * a), `${s.id} at ${along}`).toBeCloseTo(slopeHeight(s, a), 6);
        expect(slopeHeight(s, along)).toBeCloseTo(h, 6);
      }
    }
  });
});

describe('kerbContact agrees with the rings', () => {
  it('hits 0.05 m outside every pavement edge and misses 0.05 m inside it', () => {
    let tested = 0;
    circuit.kerbs.rings.forEach((raw, r) => {
      const ring = raw[0][0] === raw[raw.length - 1][0] && raw[0][1] === raw[raw.length - 1][1] ? raw.slice(0, -1) : raw;
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 0.6) return;                            // too short to stand 0.05 m off its middle cleanly
        const m = mid(a, b);
        const right: Vec2 = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];   // the grass side of every ring
        const out: Vec2 = [m[0] + right[0] * 0.05, m[1] + right[1] * 0.05];
        const inn: Vec2 = [m[0] - right[0] * 0.05, m[1] - right[1] * 0.05];
        expect(kerbContact(circuit, out, 0), `ring ${r} segment ${i} outside`).toBe(r);
        expect(kerbContact(circuit, inn, 0), `ring ${r} segment ${i} inside`).toBeNull();
        tested++;
      });
    });
    expect(tested).toBeGreaterThan(150);
  });

  it('counts a tyre whose patch overlaps the kerb, and not one clear of it', () => {
    const [a, b] = [circuit.kerbs.rings[0][0], circuit.kerbs.rings[0][1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const m = mid(a, b);
    const inward: Vec2 = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const at = (d: number): Vec2 => [m[0] + inward[0] * d, m[1] + inward[1] * d];
    expect(kerbContact(circuit, at(swift.tyre_width_m / 2 - 0.01), swift.tyre_width_m)).toBe(0);
    expect(kerbContact(circuit, at(swift.tyre_width_m / 2 + 0.01), swift.tyre_width_m)).toBeNull();
    expect(kerbContact(circuit, at(-(circuit.kerbs.width + swift.tyre_width_m / 2) - 0.05), swift.tyre_width_m)).toBeNull();   // out on the grass
  });
});

describe('one world for every level', () => {
  const meshes = (g: THREE.Object3D) => {
    const found: THREE.Mesh[] = [];
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) found.push(o as THREE.Mesh); });
    return found;
  };

  it('adds at most 10 draw calls', () => {
    expect(meshes(world.group).length).toBeLessThanOrEqual(10);
  });

  it('builds no new meshes when the practice level changes ten times', () => {
    const before = meshes(getWorld(circuit).group).map((m) => m.geometry.uuid);
    const session = createSession(circuit, rules, swift, 'practice', 'hill-start');
    for (let i = 0; i < 10; i++) session.restartStation(circuit.stations[i % circuit.stations.length].id);
    expect(getWorld(circuit)).toBe(world);
    expect(meshes(getWorld(circuit).group).map((m) => m.geometry.uuid)).toEqual(before);
  });

  it('is cheap enough to build: a fresh build stays within a sane size', () => {
    const fresh = buildWorld(circuit);
    const tris = meshes(fresh.group).reduce((n, m) => n + m.geometry.getAttribute('position').count / 3, 0);
    expect(tris).toBeLessThan(60_000);
  });
});
