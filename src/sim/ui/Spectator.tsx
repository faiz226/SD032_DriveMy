// Explore: a free camera over the circuit before driving, as Minecraft's spectator mode flies. It passes through
// everything, nothing is marked, and the car waits parked at the start. Drag to look; W/S fly where the camera
// looks, A/D slide sideways, Space rises, Shift sinks, the wheel sets the speed. Touch devices get hold buttons.
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { ArrowDown, ArrowLineDown, ArrowLineUp, ArrowUp } from '@/components/ui/icons';
import { type ReactNode, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { circuit } from '../data';
import { HUD_PLATE } from './Hud';

const LOOK_PER_PX = 0.005;      // radians of turn per pixel dragged
const SPEED = { start: 10, min: 2, max: 50 };   // m/s
const MARGIN_M = 60;            // how far past the site the camera may wander
const CEILING_M = 150;
const FLOOR_M = 0.3;

/** For the page's wrapper while exploring: a drag on the canvas turns the camera, never scrolls the page. */
export const EXPLORE_CANVAS = '[&_canvas]:touch-none [&_canvas]:cursor-grab';

// held movement keys, from the keyboard or the touch buttons
const held = new Set<string>();
const has = (...codes: string[]) => codes.some((c) => held.has(c));

const ahead = new THREE.Vector3();
const side = new THREE.Vector3();
const facing = new THREE.Vector3();

/** The explore camera. Mount it only while exploring: unmounting hands the view back to the car. */
export function SpectatorCamera({ from }: { from: () => THREE.Object3D | null }) {
  const cam = useRef<THREE.PerspectiveCamera>(null);
  const gl = useThree((s) => s.gl);
  const look = useRef({ yaw: 0, pitch: -0.35 });
  const speed = useRef(SPEED.start);

  // start above and behind the car, looking the way it faces
  useEffect(() => {
    const c = cam.current;
    const car = from();
    if (!c || !car) return;
    car.getWorldPosition(c.position);
    facing.set(1, 0, 0).applyQuaternion(car.quaternion).setY(0).normalize();   // the car frame's forward
    c.position.addScaledVector(facing, -12).add(new THREE.Vector3(0, 6, 0));
    look.current.yaw = Math.atan2(-facing.x, -facing.z);
  }, [from]);

  // (the page gives the canvas touch-action: none and a grab cursor while exploring: EXPLORE_CANVAS)
  useEffect(() => {
    const el = gl.domElement;
    const drag = { id: -1, x: 0, y: 0 };
    const down = (e: PointerEvent) => { Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY }); el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== drag.id) return;
      look.current.yaw -= (e.clientX - drag.x) * LOOK_PER_PX;
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - (e.clientY - drag.y) * LOOK_PER_PX, -1.5, 1.5);
      drag.x = e.clientX;
      drag.y = e.clientY;
    };
    const up = (e: PointerEvent) => { if (drag.id === e.pointerId) drag.id = -1; };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      speed.current = THREE.MathUtils.clamp(speed.current * Math.exp(-e.deltaY * 0.001), SPEED.min, SPEED.max);
    };
    const key = (on: boolean) => (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      if (on) held.add(e.code); else held.delete(e.code);
    };
    const keyDown = key(true);
    const keyUp = key(false);
    const lost = () => held.clear();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', lost);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', lost);
      held.clear();
    };
  }, [gl]);

  useFrame((_, dt) => {
    const c = cam.current;
    if (!c) return;
    const { yaw, pitch } = look.current;
    c.rotation.set(pitch, yaw, 0, 'YXZ');
    // W/S along the look, pitch included; A/D level; Space/Shift straight up and down
    ahead.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    side.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const step = speed.current * Math.min(dt, 0.1);
    const f = (has('KeyW', 'ArrowUp') ? 1 : 0) - (has('KeyS', 'ArrowDown') ? 1 : 0);
    const r = (has('KeyD', 'ArrowRight') ? 1 : 0) - (has('KeyA', 'ArrowLeft') ? 1 : 0);
    const u = (has('Space') ? 1 : 0) - (has('ShiftLeft', 'ShiftRight', 'KeyC') ? 1 : 0);
    c.position.addScaledVector(ahead, f * step).addScaledVector(side, r * step);
    c.position.y += u * step;
    const [x0, y0, x1, y1] = circuit.site.bounds;
    c.position.x = THREE.MathUtils.clamp(c.position.x, x0 - MARGIN_M, x1 + MARGIN_M);
    c.position.z = THREE.MathUtils.clamp(c.position.z, -y1 - MARGIN_M, -y0 + MARGIN_M);
    c.position.y = THREE.MathUtils.clamp(c.position.y, FLOOR_M, CEILING_M);
  });

  return <PerspectiveCamera ref={cam} makeDefault fov={60} near={0.1} far={800} />;
}

/** While exploring: how to fly, the way back, and hold buttons on touch devices. Escape also goes back. */
export function ExploreHud({ touch, onBack }: { touch: boolean; onBack(): void }) {
  const { t } = useLanguage();
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.code === 'Escape') onBack(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onBack]);
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className={cn(HUD_PLATE, 'pointer-events-auto absolute left-3 top-3 max-w-[min(90vw,420px)] space-y-2 p-3')}>
        <p className="type-label-strong">{t('sim.explore.title')}</p>
        <p className="type-label text-sm">{t(touch ? 'sim.explore.helpTouch' : 'sim.explore.help')}</p>
        <Button onClick={onBack}>{t('sim.explore.back')}</Button>
      </div>
      {touch && (
        <div className="pointer-events-auto absolute bottom-3 right-3 grid grid-cols-2 gap-2">
          <Hold code="KeyW" label={t('sim.explore.forward')}><ArrowUp size={22} /></Hold>
          <Hold code="Space" label={t('sim.explore.up')}><ArrowLineUp size={22} /></Hold>
          <Hold code="KeyS" label={t('sim.explore.backward')}><ArrowDown size={22} /></Hold>
          <Hold code="ShiftLeft" label={t('sim.explore.down')}><ArrowLineDown size={22} /></Hold>
        </div>
      )}
    </div>
  );
}

/** A button that moves the camera while it is held. */
function Hold({ code, label, children }: { code: string; label: string; children: ReactNode }) {
  const release = () => held.delete(code);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); held.add(code); }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className={cn(HUD_PLATE, 'tap flex h-14 w-14 items-center justify-center')}
    >
      {children}
    </button>
  );
}
