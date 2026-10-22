// The land around the yard (the owner, 21 Oct: "beautify the landscape"): rain trees and palms on the grass
// islands, in the grass inside the fence and in a belt of woodland outside it; bougainvillea along the fence and
// round the booths; street lights round the yard; rows of terrace houses beyond the trees; hazy hills on the
// horizon, a few clouds, the haze that softens distance; and the national flag beside the office. Everything is made here, from a seeded random, so it is the same on every visit and
// loads nothing. Nothing stands on the pavement, near a junction (a driver must see across it) or against a
// booth, pole or signal; the trees the car could reach have trunks it cannot drive through.
import { useFrame } from '@react-three/fiber';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Vec2 } from '../contracts';
import { circuit } from '../data';
import { toThree } from './build';
import type { Tier } from './World';

const C = circuit;
const [FX0, FY0, FX1, FY1] = C.props.fence;
const CENTRE: Vec2 = [(FX0 + FX1) / 2, (FY0 + FY1) / 2];
export const HAZE = '#cfe0ec';   // the sky's colour at the horizon (World.tsx, SkyBackdrop): distance fades into it

// ---------------------------------------------------------------- where things may stand

/** A seeded random in [0, 1): the same land every visit. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RINGS = C.pavement;   // even-odd: the yard's edge, then the islands and walls as holes
const inRing = (p: Vec2, r: Vec2[]) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if (r[i][1] > p[1] !== r[j][1] > p[1] && p[0] < ((r[j][0] - r[i][0]) * (p[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) inside = !inside;
  }
  return inside;
};
const area = (r: Vec2[]) => Math.abs(r.reduce((s, p, i) => s + p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1], 0)) / 2;
// a ring's bounding box: a point further than m outside it is further than m from the ring, and not inside it
type Box = [number, number, number, number];
const boxOf = (r: Vec2[]): Box => r.reduce<Box>((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
const inBox = (p: Vec2, b: Box, m: number) => p[0] > b[0] - m && p[0] < b[2] + m && p[1] > b[1] - m && p[1] < b[3] + m;
const RING_BOX = RINGS.map(boxOf);
// small holes are the slopes' walls and the hill's dividers: concrete, not grass
const WALLS = RINGS.slice(1).filter((r) => area(r) < 40);
const paved = (p: Vec2) => RINGS.reduce((n, r, k) => n + (inBox(p, RING_BOX[k], 0) && inRing(p, r) ? 1 : 0), 0) % 2 === 1 || WALLS.some((r) => inRing(p, r));

function segDist(p: Vec2, a: Vec2, b: Vec2) {
  const ex = b[0] - a[0];
  const ey = b[1] - a[1];
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / (ex * ex + ey * ey || 1)));
  return Math.hypot(p[0] - a[0] - ex * u, p[1] - a[1] - ey * u);
}
/** Is p within d of ring r's line? Its box first, then each side, stopping at the first that is. */
const nearRing = (p: Vec2, r: Vec2[], d: number, b: Box = boxOf(r)) => inBox(p, b, d) && r.some((a, i) => segDist(p, a, r[(i + 1) % r.length]) < d);
const nearAnyRing = (p: Vec2, d: number) => RINGS.some((r, k) => nearRing(p, r, d, RING_BOX[k]));
const rectDist = (p: Vec2, c: Vec2, size: Vec2) => Math.hypot(Math.max(0, Math.abs(p[0] - c[0]) - size[0] / 2), Math.max(0, Math.abs(p[1] - c[1]) - size[1] / 2));

const JUNCTIONS = (C.traffic?.junctions ?? []).map((j) => j.polygon);
const JUNCTION_BOX = JUNCTIONS.map(boxOf);
const BOXES = [...C.props.booths, C.props.office];
const POINTS: Vec2[] = [
  ...C.obstacles.poles.map((p) => p.at),
  ...(C.traffic?.signals ?? []).flatMap((sg) => sg.heads.map((h) => h.at)),
  ...(C.traffic?.waiting ?? []).map((w) => w.pole),
];
const insideFence = (p: Vec2, m: number) => p[0] > FX0 + m && p[0] < FX1 - m && p[1] > FY0 + m && p[1] < FY1 - m;

/** Walk the fence's inside, `inset` metres in, every `step` metres: each point and the way into the yard (radians). */
function alongFence(inset: number, step: number): { at: Vec2; facing: number }[] {
  const out: { at: Vec2; facing: number }[] = [];
  const w = FX1 - FX0;
  const h = FY1 - FY0;
  for (let s = step / 2; s < 2 * (w + h); s += step) {
    if (s < w) out.push({ at: [FX0 + s, FY0 + inset], facing: Math.PI / 2 });
    else if (s < w + h) out.push({ at: [FX1 - inset, FY0 + s - w], facing: Math.PI });
    else if (s < 2 * w + h) out.push({ at: [FX1 - (s - w - h), FY1 - inset], facing: -Math.PI / 2 });
    else out.push({ at: [FX0 + inset, FY1 - (s - 2 * w - h)], facing: 0 });
  }
  return out;
}

/** Clear grass inside the fence: off the pavement by `edge`, clear of junctions, booths, poles and signals. */
function clearGrass(p: Vec2, edge: number, points: Vec2[] = POINTS) {
  if (!insideFence(p, 1.6) || paved(p)) return false;
  if (nearAnyRing(p, edge)) return false;
  if (JUNCTIONS.some((j, k) => nearRing(p, j, 6, JUNCTION_BOX[k]) || (inBox(p, JUNCTION_BOX[k], 0) && inRing(p, j)))) return false;
  if (BOXES.some((b) => rectDist(p, b.centre, b.size) < 3.5)) return false;
  return !points.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 2.5);
}

// street lights round the yard, on the grass inside the fence, facing in; placed before anything is planted
const LIGHTS = alongFence(2.4, 21).filter((l) => clearGrass(l.at, 0.9));
const POINTS_AND_LIGHTS = [...POINTS, ...LIGHTS.map((l) => l.at)];

type Kind = 'rain' | 'palm';
interface Tree { at: Vec2; kind: Kind; scale: number; turn: number; tone: number; solid: boolean }
interface Bush { at: Vec2; scale: number; tone: number; pink: boolean }

/** The trees and the bushes, placed once. `fewer` (the Low tier) keeps every other one outside the fence. */
function plant(fewer: boolean) {
  const rnd = seeded(20261021);
  const trees: Tree[] = [];
  // the trees by 9 m cells: no spacing asked for is wider, so a tree too near p is in p's cell or one beside it
  const cells = new Map<string, Tree[]>();
  const cell = (x: number, y: number) => `${Math.floor(x / 9)},${Math.floor(y / 9)}`;
  const spaced = (p: Vec2, d: number) => {
    for (let i = -9; i <= 9; i += 9) {
      for (let j = -9; j <= 9; j += 9) {
        for (const t of cells.get(cell(p[0] + i, p[1] + j)) ?? []) if (Math.hypot(t.at[0] - p[0], t.at[1] - p[1]) < d) return false;
      }
    }
    return true;
  };
  const tree = (at: Vec2, kind: Kind, solid: boolean) => {
    const t: Tree = { at, kind, scale: 0.8 + rnd() * 0.45, turn: rnd() * Math.PI * 2, tone: rnd(), solid };
    trees.push(t);
    const k = cell(at[0], at[1]);
    cells.set(k, [...(cells.get(k) ?? []), t]);
  };
  // inside the fence: the islands and the grass round the yard, a tree every few metres where there is room;
  // on a narrow island only palms, whose crowns stand above the traffic
  for (let x = FX0 + 2; x < FX1 - 2; x += 2.5) {
    for (let y = FY0 + 2; y < FY1 - 2; y += 2.5) {
      const p: Vec2 = [x + (rnd() - 0.5) * 2, y + (rnd() - 0.5) * 2];
      if (rnd() > 0.5 || !clearGrass(p, 2.2, POINTS_AND_LIGHTS) || !spaced(p, 6.5)) continue;
      const roomy = !nearAnyRing(p, 3.6);
      tree(p, roomy && rnd() < 0.6 ? 'rain' : 'palm', true);
    }
  }
  // outside: a belt of woodland, thinning away from the fence; past it, open country to the hills
  for (let k = 0; k < 2600; k++) {
    const out = 5 + Math.pow(rnd(), 1.6) * 55;   // metres outside the fence
    const side = rnd() * 2 * (FX1 - FX0 + FY1 - FY0);
    const w = FX1 - FX0;
    const h = FY1 - FY0;
    const p: Vec2 = side < w ? [FX0 + side, FY0 - out]
      : side < w + h ? [FX1 + out, FY0 + side - w]
        : side < 2 * w + h ? [FX1 - (side - w - h), FY1 + out]
          : [FX0 - out, FY1 - (side - 2 * w - h)];
    if (!spaced(p, 5 + out * 0.06)) continue;
    if (fewer && k % 2) continue;
    tree(p, rnd() < 0.75 ? 'rain' : 'palm', false);
  }
  // bougainvillea: along the inside of the fence, round the booths and the office, and ringing the roundabout
  const bushes: Bush[] = [];
  const bush = (at: Vec2, pink = rnd() < 0.45) => {
    if (!clearGrass(at, 1.2, POINTS_AND_LIGHTS) || !spaced(at, 2)) return;
    bushes.push({ at, scale: 0.75 + rnd() * 0.5, tone: rnd(), pink });
  };
  for (let s = 0; s < 2 * (FX1 - FX0 + FY1 - FY0); s += 4.5) {
    const w = FX1 - FX0;
    const h = FY1 - FY0;
    const m = 2.2;
    bush(s < w ? [FX0 + s, FY0 + m] : s < w + h ? [FX1 - m, FY0 + s - w] : s < 2 * w + h ? [FX1 - (s - w - h), FY1 - m] : [FX0 + m, FY1 - (s - 2 * w - h)]);
  }
  for (const b of C.props.booths) for (const dx of [-1, 1]) bush([b.centre[0] + dx * (b.size[0] / 2 + 4), b.centre[1]], true);
  const isle = RINGS.slice(1).filter((r) => area(r) > 100 && area(r) < 140)[0];   // the roundabout's middle
  if (isle) {
    const cx = isle.reduce((s, p) => s + p[0], 0) / isle.length;
    const cy = isle.reduce((s, p) => s + p[1], 0) / isle.length;
    for (let k = 0; k < 8; k++) bush([cx + Math.cos((k / 8) * 2 * Math.PI) * 3, cy + Math.sin((k / 8) * 2 * Math.PI) * 3], k % 2 === 0);
  }
  return { trees, bushes };
}

// ---------------------------------------------------------------- the trees' and bushes' shapes

/** Several shapes as one: all unindexed first (cones and cylinders come indexed, icosahedrons do not). */
function merge(parts: THREE.BufferGeometry[]) {
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
  if (!merged) throw new Error('Scenery: shapes that cannot be merged');
  return merged;
}

/** A shape painted one colour, by vertex: to be merged and drawn with the yard's own material. */
function tinted(g: THREE.BufferGeometry, c: THREE.Color) {
  const n = g.attributes.position.count;
  const colour = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colour.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(colour, 3));
  return g;
}
// the yard's own material (build.ts): what is drawn with it shares its shader program, and costs no compile
const yardMaterial = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide });

/** A rain tree: a short trunk under a broad, flat-topped crown of a few lumps. Crown about its base, trunk below. */
function rainTree(detail = 1) {
  const trunk = new THREE.CylinderGeometry(0.18, 0.28, 2.6, 7).translate(0, 1.3, 0);
  const lumps = [[0, 3.9, 0, 2.3], [1.5, 3.6, 0.6, 1.7], [-1.3, 3.7, -0.7, 1.8], [0.3, 3.5, -1.5, 1.6], [-0.4, 3.6, 1.4, 1.6]]
    .map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, detail).scale(1, 0.62, 1).translate(x, y, z));
  return { trunk, crown: merge(lumps) };
}

/** A palm: a tall, slightly tapering trunk and a crown of drooping fronds. */
function palm() {
  const trunk = new THREE.CylinderGeometry(0.13, 0.2, 6.2, 7).translate(0, 3.1, 0);
  const fronds = Array.from({ length: 10 }, (_, k) => {
    const long = k % 2 ? 2.6 : 3.3;
    // each frond in two parts, as a real one arches: up and out from the crown, then drooping to its tip
    const inner = new THREE.ConeGeometry(0.62, long * 0.5, 3, 1).rotateZ(-Math.PI / 2).translate(long * 0.25, 0, 0).scale(1, 0.16, 1).rotateZ(0.25);
    const outer = new THREE.ConeGeometry(0.5, long * 0.6, 3, 1).rotateZ(-Math.PI / 2).translate(long * 0.3, 0, 0).scale(1, 0.14, 1)
      .rotateZ(-0.75).translate(long * 0.45, long * 0.12, 0);
    return merge([inner, outer]).rotateY((k / 10) * 2 * Math.PI + (k % 2) * 0.2).translate(0, 6.1, 0);
  });
  return { trunk, crown: merge([...fronds, new THREE.IcosahedronGeometry(0.45, 0).translate(0, 6.05, 0)]) };
}

const LEAF = [new THREE.Color('#3f6b2a'), new THREE.Color('#567d2e'), new THREE.Color('#2f5a26')];
const FROND = [new THREE.Color('#4f7f2c'), new THREE.Color('#6a8f34')];
const BARK = new THREE.Color('#6b5643');
const PINK = [new THREE.Color('#c4387a'), new THREE.Color('#d2578f'), new THREE.Color('#a8306a')];
const SHRUB = [new THREE.Color('#3d6a2c'), new THREE.Color('#4a7731')];

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const pick = (cs: THREE.Color[], t: number) => cs[Math.floor(t * cs.length) % cs.length];

function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, items: { at: Vec2; scale: number; turn?: number }[], colour: (i: number) => THREE.Color, shadows: boolean) {
  const m = new THREE.InstancedMesh(geometry, material, Math.max(1, items.length));
  m.count = items.length;
  items.forEach((it, i) => {
    q.setFromAxisAngle(UP, it.turn ?? 0);
    m.setMatrixAt(i, m4.compose(toThree(it.at[0], it.at[1], 0), q, new THREE.Vector3(it.scale, it.scale, it.scale)));
    m.setColorAt(i, colour(i));
  });
  m.castShadow = shadows;
  m.frustumCulled = false;   // spread round the whole site: one bounding sphere would cull them wrongly
  return m;
}

function Plants({ tier }: { tier: Tier }) {
  const shadows = tier !== 'low';
  const { trees, bushes } = useMemo(() => plant(tier === 'low'), [tier]);
  const meshes = useMemo(() => {
    const leaves = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const bark = new THREE.MeshLambertMaterial({ color: BARK });
    const out: THREE.InstancedMesh[] = [];
    // Coarse rain-tree crowns (a quarter of the triangles, the faceted look of a far tree) wherever they are far or
    // the tier is Low; and the woodland outside the fence casts no shadow. Every tree is drawn in the main view and
    // each mirror, and on Medium into the sun's shadow map too: the woodland in full was most of the triangles.
    const groups: { these: (t: Tree) => boolean; detail: number; cast: boolean }[] = tier === 'low'
      ? [{ these: () => true, detail: 0, cast: false }]
      : [{ these: (t) => t.solid, detail: 1, cast: shadows }, { these: (t) => !t.solid, detail: 0, cast: false }];
    for (const g of groups) {
      for (const [kind, shape, palette] of [['rain', rainTree(g.detail), LEAF], ['palm', palm(), FROND]] as const) {
        const these = trees.filter((t) => t.kind === kind && g.these(t));
        out.push(instanced(shape.trunk, bark, these, () => BARK, g.cast));
        out.push(instanced(shape.crown, leaves, these, (i) => pick(palette, these[i].tone), g.cast));
      }
    }
    const blob = new THREE.IcosahedronGeometry(0.75, 1).scale(1, 0.75, 1).translate(0, 0.45, 0);
    out.push(instanced(blob, leaves, bushes, (i) => (bushes[i].pink ? pick(PINK, bushes[i].tone) : pick(SHRUB, bushes[i].tone)), false));
    return out;
  }, [trees, bushes, shadows, tier]);
  useEffect(() => () => {
    for (const m of meshes) { m.geometry.dispose(); m.dispose(); }
    (meshes[0]?.material as THREE.Material | undefined)?.dispose();
    (meshes[1]?.material as THREE.Material | undefined)?.dispose();
  }, [meshes]);
  const solid = trees.filter((t) => t.solid);
  return (
    <>
      {meshes.map((m, i) => <primitive key={i} object={m} />)}
      {/* the trunks the car can reach: it stops against them as against a pole */}
      <RigidBody type="fixed" colliders={false}>
        {solid.map((t, i) => (
          <CylinderCollider key={i} args={[1.5, (t.kind === 'rain' ? 0.3 : 0.22) * t.scale]} position={toThree(t.at[0], t.at[1], 1.5).toArray()} />
        ))}
      </RigidBody>
    </>
  );
}

// ---------------------------------------------------------------- the distance

/** Two rings of low hills round the horizon, the farther one bluer; the haze does the rest. */
function Hills() {
  const geometry = useMemo(() => {
    const parts = [[390, 16, 0.6, '#5f7a52'], [470, 30, 2.1, '#7d93a0']].map(([r, top, phase, col]) => {
      const n = 160;
      const pos: number[] = [];
      const colours: number[] = [];
      const c = new THREE.Color(col as string);
      const low = c.clone().multiplyScalar(0.8);
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const h = (top as number) * (0.55 + 0.25 * Math.sin(3 * a + (phase as number)) + 0.15 * Math.sin(7 * a + 1.3 * (phase as number)) + 0.08 * Math.sin(17 * a));
        const x = CENTRE[0] + Math.cos(a) * (r as number);
        const z = -(CENTRE[1] + Math.sin(a) * (r as number));
        pos.push(x, -2, z, x, h, z);
        colours.push(low.r, low.g, low.b, c.r, c.g, c.b);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
      const index: number[] = [];
      for (let i = 0; i < n; i++) { const k = i * 2; index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      g.setIndex(index);
      return g;
    });
    return merge(parts);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A soft white puff, drawn once: every cloud is a few of them. */
function puffTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const fill = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  fill.addColorStop(0, 'rgba(255,255,255,0.95)');
  fill.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  fill.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = fill;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A dozen fair-weather clouds above the hills, each a cluster of puffs (sprites: they always face the eye). */
function Clouds() {
  // every puff in one mesh, one draw call (as 65 sprites they were 65): each a flat square turned to face the yard's
  // middle, which from anywhere in the yard, 280 m and more away, looks as a sprite would
  const mesh = useMemo(() => {
    const rnd = seeded(7);
    const puffs: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 13; k++) {
      const a = rnd() * Math.PI * 2;
      const r = 280 + rnd() * 180;   // inside the eye's 600 m
      const y = 85 + rnd() * 70;
      const size = 40 + rnd() * 45;
      for (let p = 0; p < 5; p++) {
        const off = (p - 2) * size * 0.32;
        const x = CENTRE[0] + Math.cos(a) * r - Math.sin(a) * off;
        const z = -(CENTRE[1] + Math.sin(a) * r + Math.cos(a) * off);
        const up = y + (rnd() - 0.5) * size * 0.18;
        const s = size * (0.6 + rnd() * 0.5);
        puffs.push(new THREE.PlaneGeometry(s, s).rotateY(Math.atan2(CENTRE[0] - x, -CENTRE[1] - z)).translate(x, up, z));
      }
    }
    return new THREE.Mesh(merge(puffs), new THREE.MeshBasicMaterial({ map: puffTexture(), transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
  }, []);
  useEffect(() => () => { mesh.geometry.dispose(); mesh.material.map?.dispose(); mesh.material.dispose(); }, [mesh]);
  return <primitive object={mesh} />;
}

// ---------------------------------------------------------------- street lights

const LAMP = { height: 7, arm: 1.6 };

/** A street light about its foot: a tapering pole, an arm reaching along +x, a lamp head at its end. */
function streetLight() {
  return merge([
    new THREE.CylinderGeometry(0.06, 0.1, LAMP.height, 8).translate(0, LAMP.height / 2, 0),
    new THREE.BoxGeometry(LAMP.arm, 0.07, 0.07).translate(LAMP.arm / 2, LAMP.height - 0.1, 0),
    new THREE.BoxGeometry(0.62, 0.12, 0.26).translate(LAMP.arm - 0.12, LAMP.height - 0.2, 0),
  ]);
}

function StreetLights({ shadows }: { shadows: boolean }) {
  const mesh = useMemo(() => {
    // one mesh in the yard's material; each light's arm (+x) reaches into the yard
    const grey = new THREE.Color('#9aa1a6');
    const m = new THREE.Mesh(merge(LIGHTS.map((l) => tinted(streetLight().rotateY(l.facing), grey).translate(l.at[0], 0, -l.at[1]))), yardMaterial());
    m.castShadow = shadows;
    return m;
  }, [shadows]);
  useEffect(() => () => { mesh.geometry.dispose(); mesh.material.dispose(); }, [mesh]);
  return (
    <>
      <primitive object={mesh} />
      <RigidBody type="fixed" colliders={false}>
        {LIGHTS.map((l, i) => <CylinderCollider key={i} args={[LAMP.height / 2, 0.1]} position={toThree(l.at[0], l.at[1], LAMP.height / 2).toArray()} />)}
      </RigidBody>
    </>
  );
}

// ---------------------------------------------------------------- terrace houses

// Rows of double-storey terrace houses beyond the woodland, each house its own colour under one long tiled roof,
// with the road in front of them; past the trees' belt, so the haze softens them
const TERRACE = { w: 6.5, d: 12, h: 6.2, roof: 2.0, out: 88, road: 7 };
const WALLS_PALETTE = ['#efe6d2', '#f3edd9', '#e4ead2', '#f1dfc8', '#e8e8e2', '#dfe6ea'].map((c) => new THREE.Color(c));
const TILES = new THREE.Color('#9c4a2f');

/** The rows: each a run of houses along one side of the yard, facing it. */
function terraceRows() {
  const rnd = seeded(31);
  const rows: { start: Vec2; along: Vec2; count: number }[] = [];
  const midX = (FX0 + FX1) / 2;
  const midY = (FY0 + FY1) / 2;
  const T = TERRACE;
  rows.push({ start: [midX - 5 * T.w, FY1 + T.out], along: [1, 0], count: 10 });
  rows.push({ start: [FX1 + T.out, midY - 4 * T.w], along: [0, 1], count: 8 });
  rows.push({ start: [midX + 4 * T.w, FY0 - T.out], along: [-1, 0], count: 8 });
  return { rows, tone: () => rnd() };
}

function Terraces() {
  // one mesh in the yard's material: every house's walls, the rows' roofs and their roads
  const mesh = useMemo(() => {
    const { rows, tone } = terraceRows();
    const T = TERRACE;
    const houses: { at: Vec2; turn: number }[] = [];
    const roofParts: THREE.BufferGeometry[] = [];
    const roadParts: THREE.BufferGeometry[] = [];
    const road = new THREE.Color('#4b4d50');
    for (const r of rows) {
      const turn = Math.atan2(r.along[1], r.along[0]);   // the row's length along the house's local x
      const len = r.count * T.w;
      // which side is the yard: the houses' fronts and the road face it
      const inward: Vec2 = [-r.along[1], r.along[0]];
      const towardYard = (CENTRE[0] - r.start[0]) * inward[0] + (CENTRE[1] - r.start[1]) * inward[1] > 0 ? 1 : -1;
      for (let k = 0; k < r.count; k++) houses.push({ at: [r.start[0] + r.along[0] * (k + 0.5) * T.w, r.start[1] + r.along[1] * (k + 0.5) * T.w], turn });
      const mid: Vec2 = [r.start[0] + (r.along[0] * len) / 2, r.start[1] + (r.along[1] * len) / 2];
      // one tiled roof over the row, its ridge along it (a triangular prism)
      const roof = new THREE.CylinderGeometry(T.roof, T.roof, len + 0.6, 3, 1).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2)
        .scale(1, 1, T.d / (2 * T.roof * Math.cos(Math.PI / 6)) * 1.04);
      roof.rotateY(turn).translate(mid[0], T.h + T.roof * 0.5, -mid[1]);
      roofParts.push(tinted(roof, TILES));
      // the road in front, toward the yard
      const ahead = towardYard * (T.d / 2 + 2 + T.road / 2);
      roadParts.push(tinted(new THREE.PlaneGeometry(len + 30, T.road).rotateX(-Math.PI / 2).rotateY(turn)
        .translate(mid[0] + inward[0] * ahead, 0.01, -(mid[1] + inward[1] * ahead)), road));
    }
    const walls = houses.map((hs) => tinted(new THREE.BoxGeometry(T.w - 0.08, T.h, T.d).translate(0, T.h / 2, 0).rotateY(hs.turn), pick(WALLS_PALETTE, tone()))
      .translate(hs.at[0], 0, -hs.at[1]));
    return new THREE.Mesh(merge([...walls, ...roofParts, ...roadParts]), yardMaterial());
  }, []);
  useEffect(() => () => { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); }, [mesh]);
  return <primitive object={mesh} />;
}

// ---------------------------------------------------------------- the flag

const FLAG = { w: 2.4, h: 1.2, pole: 7.5 };

/**
 * Jalur Gemilang: fourteen stripes, red and white, red at the top; a dark blue canton over the upper eight
 * stripes and half the length, holding a yellow crescent and a yellow fourteen-pointed star.
 */
function flagTexture() {
  const W = 512;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const band = H / 14;
  for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#cc0001'; g.fillRect(0, i * band, W, band + 0.5); }
  const cw = W / 2;
  const ch = band * 8;
  g.fillStyle = '#010066';
  g.fillRect(0, 0, cw, ch);
  // the crescent: a yellow disc with a blue one cut out of it, toward the fly
  const cy = ch / 2;
  const r = ch * 0.4;
  const cx = cw * 0.36;
  g.fillStyle = '#ffcc00';
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#010066';
  g.beginPath();
  g.arc(cx + r * 0.28, cy, r * 0.85, 0, Math.PI * 2);
  g.fill();
  // the star: fourteen points, beside the crescent's open side
  const sx = cx + r * 1.05;
  const outer = r * 0.62;
  const inner = outer * 0.42;
  g.fillStyle = '#ffcc00';
  g.beginPath();
  for (let k = 0; k < 28; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 14;
    const rr = k % 2 ? inner : outer;
    if (k === 0) g.moveTo(sx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else g.lineTo(sx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Where the flag stands: on the grass by the office's west end, the nearest clear spot to it. */
const FLAG_AT: Vec2 = (() => {
  const { centre, size } = C.props.office;
  const want: Vec2 = [centre[0] - size[0] / 2 - 3, centre[1]];
  let best: Vec2 = want;
  let bestD = Infinity;
  for (let dx = -8; dx <= 8; dx += 0.5) {
    for (let dy = -8; dy <= 8; dy += 0.5) {
      const p: Vec2 = [want[0] + dx, want[1] + dy];
      const d = Math.hypot(dx, dy);
      if (d < bestD && insideFence(p, 1) && !paved(p) && !nearAnyRing(p, 1.2) && rectDist(p, centre, size) > 1.5) { best = p; bestD = d; }
    }
  }
  return best;
})();

/** Ripple the flag a little (outside the component: hooks keep their values immutable). */
function wave(g: THREE.BufferGeometry, rest: Float32Array, t: number) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = rest[i * 3];
    const along = x / FLAG.w;   // 0 at the pole, 1 at the fly
    pos.setZ(i, Math.sin(x * 3.2 - t * 4.5) * 0.09 * along + Math.sin(rest[i * 3 + 1] * 2.5 + t * 3) * 0.03 * along);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
}

function Flag() {
  const { geometry, rest, texture } = useMemo(() => {
    const g = new THREE.PlaneGeometry(FLAG.w, FLAG.h, 16, 8).translate(FLAG.w / 2, -FLAG.h / 2, 0);
    return { geometry: g, rest: Float32Array.from(g.attributes.position.array), texture: flagTexture() };
  }, []);
  useEffect(() => () => { geometry.dispose(); texture.dispose(); }, [geometry, texture]);
  const flag = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (flag.current) wave(geometry, rest, clock.elapsedTime); });
  const base = toThree(FLAG_AT[0], FLAG_AT[1], 0);
  return (
    <group position={base}>
      <mesh position={[0, FLAG.pole / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, FLAG.pole, 8]} />
        <meshStandardMaterial color="#d8dadc" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, FLAG.pole + 0.05, 0]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* the flag flies to the east, the hoist at the pole */}
      <mesh ref={flag} geometry={geometry} position={[0.05, FLAG.pole - 0.05, 0]}>
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[FLAG.pole / 2, 0.08]} position={[0, FLAG.pole / 2, 0]} />
      </RigidBody>
    </group>
  );
}

/** The land round the yard. Inside <Physics>: the trunks and the flagpole are solid. */
export function Scenery({ tier = 'low' }: { tier?: Tier }) {
  return (
    <>
      <fog attach="fog" args={[HAZE, 160, 720]} />
      <Plants tier={tier} />
      <StreetLights shadows={tier !== 'low'} />
      <Terraces />
      <Hills />
      <Clouds />
      <Flag />
    </>
  );
}

/** For the tests: how many trees stand inside the fence, and whether any stands on the pavement or a junction. */
export const plantedForTests = () => plant(false);
export const pavedForTests = paved;
export const shapesForTests = () => [rainTree(), palm()];
export const lightsForTests = () => LIGHTS;
