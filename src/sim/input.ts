// The driver's inputs, from the keyboard or the touch controls. The physics reads them every step;
// the screens subscribe for the gear, the handbrake and notices.
import { useEffect, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import type { Controls } from './physics/vehicle';

export interface DriverState extends Controls {
  paused: boolean;
  topDown: boolean;
  /** The indicators: 1 left, -1 right (the wheel's sign), 0 off. They cancel themselves as the wheel comes back. */
  indicator: -1 | 0 | 1;
  headlights: boolean;
  /** Free drive's view from behind the car. */
  chase: boolean;
  /** When the horn last sounded (performance.now()); the page plays it and the traffic hears it. */
  horn: number;
  /** Free drive's secret: the Swift's paint in rainbow. */
  rainbow: boolean;
  /** A run starting (the owner, 21 Oct): the brief being read, then the engine starting; the car is held till then. */
  starting: 'brief' | 'engine' | null;
  /** The top-down view's zoom: 1 shows the whole yard; above 1 it follows the car. */
  zoom: number;
  speedKmh: number;                                   // written by the car each step, for the gear rule
  notice: { key: 'stopFirst'; at: number } | null;    // shown by the screens as a toast
  set(p: Partial<Controls & { paused: boolean; topDown: boolean; indicator: -1 | 0 | 1; headlights: boolean; chase: boolean; horn: number; rainbow: boolean; starting: 'brief' | 'engine' | null }>): void;
  /** That side's indicator on, or off if it is on already. */
  toggleIndicator(side: -1 | 1): void;
  /** D <-> R, only when stopped. Otherwise a "Stop first" notice. */
  toggleGear(): void;
  toggleHandbrake(): void;
  zoomBy(factor: number): void;
  /** Focus lost: every held input is released, and the run pauses. */
  release(): void;
}

const STOPPED_KMH = 1;   // R can only be selected below this (WP3)
export const ZOOM_MAX = 8;
export const ZOOM_STEP = 1.5;   // one press of a zoom button or key

export const useDriver = create<DriverState>((set, get) => ({
  throttle: 0, brake: 0, handbrake: false, gear: 'D', wheel: 0,
  paused: false, topDown: false, indicator: 0, headlights: false, chase: false, horn: 0, rainbow: false, starting: null, zoom: 1, speedKmh: 0, notice: null,
  set: (p) => set(p),
  toggleIndicator: (side) => set({ indicator: get().indicator === side ? 0 : side }),
  zoomBy: (f) => set({ zoom: Math.min(ZOOM_MAX, Math.max(1, get().zoom * f)) }),
  toggleGear: () => {
    if (Math.abs(get().speedKmh) >= STOPPED_KMH) set({ notice: { key: 'stopFirst', at: performance.now() } });
    else set({ gear: get().gear === 'D' ? 'R' : 'D' });
  },
  toggleHandbrake: () => set({ handbrake: !get().handbrake }),
  release: () => set({ throttle: 0, brake: 0, wheel: 0, paused: true }),
}));

/** How far a head turns, radians: left is positive yaw, up is positive pitch. */
export const HEAD = { yaw: 1.92, pitchUp: 0.35, pitchDown: -0.8 };
// Q: over the left shoulder, into the blind spot. E: down out of the driver's window (the only side where
// any road near the car can be seen), to where the hill's yellow band meets the kerb, beside the door mirror.
const GLANCE = { left: { yaw: 1.75, pitch: -0.1 }, right: { yaw: -0.9, pitch: -0.45 } };

/**
 * Where the driver's head points, for blind spots and lines the bonnet hides. A glance key or a drag sets it;
 * the camera eases toward it and back to the road when let go. Looking is free: nothing marks it.
 */
export const useHead = create<{ yaw: number; pitch: number; set(p: Partial<{ yaw: number; pitch: number }>): void }>((set) => ({
  yaw: 0,
  pitch: 0,
  set: (p) => set({
    ...(p.yaw !== undefined && { yaw: Math.max(-HEAD.yaw, Math.min(HEAD.yaw, p.yaw)) }),
    ...(p.pitch !== undefined && { pitch: Math.max(HEAD.pitchDown, Math.min(HEAD.pitchUp, p.pitch)) }),
  }),
}));

export type TouchPref = 'auto' | 'on' | 'off';
const TOUCH_KEY = 'drivemy.sim.touch';

function savedTouchPref(): TouchPref {
  try {
    const v = localStorage.getItem(TOUCH_KEY);
    return v === 'on' || v === 'off' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/** The simulator settings' override for the touch controls; 'auto' follows the device. */
export const useTouchPref = create<{ pref: TouchPref; setPref(p: TouchPref): void }>((set) => ({
  pref: savedTouchPref(),
  setPref: (pref) => {
    try { localStorage.setItem(TOUCH_KEY, pref); } catch { /* storage blocked: the choice lasts this visit */ }
    set({ pref });
  },
}));

const COARSE = '(pointer: coarse)';
const touchDevice = () => typeof window !== 'undefined' && !!window.matchMedia?.(COARSE).matches && navigator.maxTouchPoints > 0;
const watchPointer = (changed: () => void) => {
  const mq = window.matchMedia?.(COARSE);
  mq?.addEventListener('change', changed);
  return () => mq?.removeEventListener('change', changed);
};

/** Whether the touch controls show: a device with touch and a coarse pointer, unless overridden. Never screen width. */
export function useTouchUi(): boolean {
  const pref = useTouchPref((s) => s.pref);
  const device = useSyncExternalStore(watchPointer, touchDevice, () => false);
  return pref === 'on' || (pref === 'auto' && device);
}

/** Keyboard: W/Up throttle, S/Down brake (never reverse), A/D or Left/Right steer, R gear, Space handbrake, P or Esc pause, T top-down, +/- its zoom, Q over the left shoulder, E down out of the driver's window, Z and C the left and right indicators, L the headlamps, H the horn, V free drive's chase view. */
export function useKeyboardControls(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const held = new Set<string>();
    let glancing = false;
    const apply = () => {
      const left = held.has('KeyA') || held.has('ArrowLeft');
      const right = held.has('KeyD') || held.has('ArrowRight');
      useDriver.getState().set({
        throttle: held.has('KeyW') || held.has('ArrowUp') ? 1 : 0,
        brake: held.has('KeyS') || held.has('ArrowDown') ? 1 : 0,
        wheel: (left ? 1 : 0) - (right ? 1 : 0),
      });
      const glance = (held.has('KeyQ') ? 1 : 0) - (held.has('KeyE') ? 1 : 0);
      if (glance !== 0) useHead.getState().set(glance > 0 ? GLANCE.left : GLANCE.right);
      else if (glancing) useHead.getState().set({ yaw: 0, pitch: 0 });
      glancing = glance !== 0;
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat && !['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) return;
      const d = useDriver.getState();
      switch (e.code) {
        case 'KeyR': d.toggleGear(); break;
        case 'Space': d.toggleHandbrake(); e.preventDefault(); break;
        case 'KeyP': case 'Escape': d.set({ paused: !d.paused }); break;
        case 'KeyT': d.set({ topDown: !d.topDown }); break;
        case 'KeyZ': d.toggleIndicator(1); break;
        case 'KeyC': d.toggleIndicator(-1); break;
        case 'KeyL': d.set({ headlights: !d.headlights }); break;
        case 'KeyV': d.set({ chase: !d.chase }); break;
        case 'KeyH': d.set({ horn: performance.now() }); break;
        case 'Equal': case 'NumpadAdd': d.zoomBy(ZOOM_STEP); break;
        case 'Minus': case 'NumpadSubtract': d.zoomBy(1 / ZOOM_STEP); break;
        default:
          held.add(e.code);
          if (e.code.startsWith('Arrow')) e.preventDefault();
          apply();
      }
    };
    const up = (e: KeyboardEvent) => { held.delete(e.code); apply(); };
    const lost = () => { held.clear(); useDriver.getState().release(); useHead.getState().set({ yaw: 0, pitch: 0 }); };
    const hidden = () => { if (document.visibilityState === 'hidden') lost(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', lost);
    window.addEventListener('pagehide', lost);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', lost);
      window.removeEventListener('pagehide', lost);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [enabled]);
}
