// Surprises (the owner, 20 Oct: "a few easter eggs"), all in free drive, where nothing is marked, so none can touch
// a run: the other cars answer the horn with their hazard lamps; an orange cat crosses at the zebra and thanks a
// driver who stops for it (and leaps clear of one who does not); three doughnuts get a word; a secret code paints
// the Swift in rainbow. And a note on the office roof waits for anyone who flies over it, in any mode.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { create } from 'zustand';
import type { TranslationKey } from '@/lib/translations';
import type { VehicleSample } from '../contracts';
import { circuit, swift } from '../data';
import { dir, rad, wrapPi } from '../geom';
import { useDriver } from '../input';
import { OFFICE_H, ROOF, toThree } from '../world/build';
import { meowSound } from './sound';

/** The latest surprise's line, for the HUD. */
export const useEggs = create<{ toast: { key: TranslationKey; at: number } | null; say(key: TranslationKey): void }>((set) => ({
  toast: null,
  say: (key) => set({ toast: { key, at: performance.now() } }),
}));

// ---------------------------------------------------------------- the secret code

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'].join();

/** Up, up, down, down, left, right, left, right, B, A while free driving: the Swift in rainbow, or back to red. */
export function useKonami(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const last: string[] = [];
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      last.push(e.code);
      if (last.length > 10) last.shift();
      if (last.join() !== KONAMI) return;
      last.length = 0;
      const rainbow = !useDriver.getState().rainbow;
      useDriver.getState().set({ rainbow });
      if (rainbow) useEggs.getState().say('sim.egg.rainbow');
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [enabled]);
}

// ---------------------------------------------------------------- the cat and the doughnuts

const ZEBRA = circuit.traffic?.zebra ?? null;
const NOSE = swift.wheelbase_m + swift.front_overhang_m;
// a cat's walk; it starts across when we come within `near` of the crossing, heading for it, and waits `restS` before
// its next crossing; stopped (under `stopKmh`) within `stopM` of the crossing is waiting for it
const CAT = { speed: 0.8, near: 30, restS: 40, firstS: 5, stopKmh: 1, stopM: 12, leapS: 0.9, leapSpeed: 5 };
const DOUGHNUT = { turns: 3, kmh: 2, straightS: 3, straightRate: 0.25 };

/** One free drive's surprises: stepped with the physics by the page, drawn by ZebraCat. */
export class Eggs {
  /** The cat: crossing or not; metres walked from its side (`from`: 1 the road's left, -1 its right); leaping since. */
  readonly cat = { on: false, u: 0, from: 1 as 1 | -1, leap: -1, rest: CAT.firstS, waited: false };
  private turned = 0;
  private straight = 0;
  private heading: number | null = null;

  step(s: VehicleSample, dt: number) {
    this.doughnuts(s, dt);
    if (ZEBRA) this.zebraCat(s, dt, ZEBRA);
  }

  /** Three full turns the same way, driving: a word from the yard. */
  private doughnuts(s: VehicleSample, dt: number) {
    const d = this.heading === null ? 0 : wrapPi(s.heading - this.heading);
    this.heading = s.heading;
    if (Math.abs(s.speedKmh) < DOUGHNUT.kmh) return;
    if (d * this.turned < 0) this.turned = 0;   // the other way round: start again
    this.turned += d;
    this.straight = Math.abs(d) / dt < DOUGHNUT.straightRate ? this.straight + dt : 0;
    if (this.straight > DOUGHNUT.straightS) this.turned = 0;   // driving on straight: the spin is over
    if (Math.abs(this.turned) < DOUGHNUT.turns * 2 * Math.PI) return;
    this.turned = 0;
    useEggs.getState().say('sim.egg.doughnut');
  }

  private zebraCat(s: VehicleSample, dt: number, z: NonNullable<typeof ZEBRA>) {
    const c = this.cat;
    const [ux, uy] = dir(rad(z.heading_deg));   // along the road
    const along = (x: number, y: number) => (x - z.centre[0]) * ux + (y - z.centre[1]) * uy;
    const across = (s.y - z.centre[1]) * ux - (s.x - z.centre[0]) * uy;
    const rear = along(s.x, s.y);
    const nose = along(s.x + Math.cos(s.heading) * NOSE, s.y + Math.sin(s.heading) * NOSE);
    const onRoad = Math.abs(across) < z.width / 2 + 1;
    const half = z.length / 2;
    if (!c.on) {
      c.rest -= dt;
      const toward = Math.cos(s.heading - rad(z.heading_deg)) * -Math.sign(rear) > 0.5;
      if (c.rest > 0 || !onRoad || !toward || Math.abs(nose) > CAT.near || Math.abs(nose) < half + 6) return;
      Object.assign(c, { on: true, u: 0, from: Math.random() < 0.5 ? 1 : -1, leap: -1, waited: false });
      return;
    }
    if (c.leap >= 0) {   // clear of the car, at a run
      c.leap += dt;
      c.u += CAT.leapSpeed * dt;
      if (c.leap > CAT.leapS || c.u > z.width + 1) this.catGone();
      return;
    }
    c.u += CAT.speed * dt;
    const stopped = Math.abs(s.speedKmh) < CAT.stopKmh;
    if (stopped && onRoad && Math.abs(nose) > half && Math.abs(nose) < CAT.stopM) c.waited = true;
    // on the crossing, moving, while the cat is on it: it leaps clear, and the yard says why
    if (!stopped && onRoad && (Math.abs(nose) < half || Math.abs(rear) < half || nose * rear < 0)) {
      c.leap = 0;
      useEggs.getState().say('sim.egg.catJump');
      return;
    }
    if (c.u < z.width) return;
    if (c.waited) {
      useEggs.getState().say('sim.egg.catThanks');
      meowSound();
    }
    this.catGone();
  }

  private catGone() {
    Object.assign(this.cat, { on: false, leap: -1, rest: CAT.restS });
  }
}

// an orange cat, as Malaysian roads know them; its frame: x the way it walks, y up, about its feet
const ORANGE = '#e0812b';
const LEGS: [number, number][] = [[0.14, -0.06], [0.14, 0.06], [-0.14, -0.06], [-0.14, 0.06]];

/** The cat on the zebra crossing while it crosses; nothing otherwise. */
export function ZebraCat({ eggs }: { eggs: () => Eggs | null }) {
  const group = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => placeCat(group.current, legs.current, eggs(), clock.elapsedTime));
  return (
    <group ref={group} visible={false}>
      <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.42, 0.18, 0.17]} /><meshStandardMaterial color={ORANGE} /></mesh>
      <mesh position={[0.25, 0.3, 0]} castShadow><boxGeometry args={[0.16, 0.15, 0.15]} /><meshStandardMaterial color={ORANGE} /></mesh>
      {[-0.045, 0.045].map((z) => (
        <mesh key={z} position={[0.25, 0.4, z]}><coneGeometry args={[0.035, 0.07, 4]} /><meshStandardMaterial color={ORANGE} /></mesh>
      ))}
      {[-0.035, 0.035].map((z) => (
        <mesh key={z} position={[0.335, 0.32, z]}><sphereGeometry args={[0.014, 6, 6]} /><meshStandardMaterial color="#1d2a10" /></mesh>
      ))}
      <mesh position={[-0.27, 0.33, 0]} rotation={[0, 0, 0.9]}><cylinderGeometry args={[0.018, 0.022, 0.3, 6]} /><meshStandardMaterial color={ORANGE} /></mesh>
      {LEGS.map(([x, z], i) => (
        <mesh key={i} ref={(m) => { legs.current[i] = m; }} position={[x, 0.07, z]}><boxGeometry args={[0.045, 0.14, 0.045]} /><meshStandardMaterial color={ORANGE} /></mesh>
      ))}
    </group>
  );
}

/** Where the cat is this frame (outside the component: hooks keep their values immutable). */
function placeCat(g: THREE.Group | null, legs: (THREE.Mesh | null)[], eggs: Eggs | null, t: number) {
  if (!g) return;
  const c = eggs?.cat;
  g.visible = !!c?.on && !!ZEBRA;
  if (!c?.on || !ZEBRA) return;
  const [ux, uy] = dir(rad(ZEBRA.heading_deg));
  const off = c.from * (ZEBRA.width / 2 - c.u);   // across the road, from its side to the other
  const leap = c.leap >= 0 ? Math.sin(Math.min(1, c.leap / CAT.leapS) * Math.PI) * 0.6 : 0;
  g.position.set(ZEBRA.centre[0] - uy * off, 0.02 + leap, -(ZEBRA.centre[1] + ux * off));   // the spine road is flat
  g.rotation.y = Math.atan2(-ux * c.from, uy * c.from);   // facing the way it walks
  const stride = Math.sin(t * (c.leap >= 0 ? 30 : 12)) * 0.5;
  legs.forEach((m, i) => { if (m) m.rotation.z = (i === 0 || i === 3 ? 1 : -1) * stride; });
}

// ---------------------------------------------------------------- the roof note

/** Painted on the office roof, for anyone who flies over it (the top-down view, or exploring). */
export function RoofNote() {
  const { office } = circuit.props;
  const [w, h] = [office.size[0] + 2 * ROOF.over, office.size[1] + 2 * ROOF.over];
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round((1024 * h) / w);
    const g = c.getContext('2d')!;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    // white paint, edged dark so it reads on the pale roof
    const paint = (text: string, size: number, y: number) => {
      g.font = size > 0.3 ? `bold ${Math.round(c.height * size)}px sans-serif` : `${Math.round(c.height * size)}px sans-serif`;
      g.lineWidth = c.height * size * 0.14;
      g.strokeStyle = 'rgba(16, 28, 44, 0.85)';
      g.strokeText(text, c.width / 2, c.height * y);
      g.fillStyle = '#f4f1e8';
      g.fillText(text, c.width / 2, c.height * y);
    };
    paint('SELAMAT MEMANDU', 0.36, 0.4);
    paint('drive safe · DriveMy', 0.18, 0.78);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [w, h]);
  useEffect(() => () => texture.dispose(), [texture]);
  const at = toThree(office.centre[0], office.centre[1], OFFICE_H + ROOF.thick + 0.01);
  return (
    <mesh position={at} rotation={[-Math.PI / 2, 0, rad(office.heading_deg)]}>
      <planeGeometry args={[w * 0.9, h * 0.8]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
