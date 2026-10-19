// The driver's inputs, from the keyboard or the touch controls. The physics reads them every step;
// the screens subscribe for the gear, the handbrake and notices.
import { useEffect, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import type { Controls } from './physics/vehicle';

export interface DriverState extends Controls {
  paused: boolean;
  topDown: boolean;
  speedKmh: number;                                   // written by the car each step, for the gear rule
  notice: { key: 'stopFirst'; at: number } | null;    // shown by the screens as a toast
  set(p: Partial<Controls & { paused: boolean; topDown: boolean }>): void;
  /** D <-> R, only when stopped. Otherwise a "Stop first" notice. */
  toggleGear(): void;
  toggleHandbrake(): void;
  /** Focus lost: every held input is released, and the run pauses. */
  release(): void;
}

const STOPPED_KMH = 1;   // R can only be selected below this (WP3)

export const useDriver = create<DriverState>((set, get) => ({
  throttle: 0, brake: 0, handbrake: false, gear: 'D', wheel: 0,
  paused: false, topDown: false, speedKmh: 0, notice: null,
  set: (p) => set(p),
  toggleGear: () => {
    if (Math.abs(get().speedKmh) >= STOPPED_KMH) set({ notice: { key: 'stopFirst', at: performance.now() } });
    else set({ gear: get().gear === 'D' ? 'R' : 'D' });
  },
  toggleHandbrake: () => set({ handbrake: !get().handbrake }),
  release: () => set({ throttle: 0, brake: 0, wheel: 0, paused: true }),
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

/** Keyboard: W/Up throttle, S/Down brake (never reverse), A/D or Left/Right steer, R gear, Space handbrake, P or Esc pause, T top-down. */
export function useKeyboardControls(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const held = new Set<string>();
    const apply = () => {
      const left = held.has('KeyA') || held.has('ArrowLeft');
      const right = held.has('KeyD') || held.has('ArrowRight');
      useDriver.getState().set({
        throttle: held.has('KeyW') || held.has('ArrowUp') ? 1 : 0,
        brake: held.has('KeyS') || held.has('ArrowDown') ? 1 : 0,
        wheel: (left ? 1 : 0) - (right ? 1 : 0),
      });
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat && !['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) return;
      const d = useDriver.getState();
      switch (e.code) {
        case 'KeyR': d.toggleGear(); break;
        case 'Space': d.toggleHandbrake(); e.preventDefault(); break;
        case 'KeyP': case 'Escape': d.set({ paused: !d.paused }); break;
        case 'KeyT': d.set({ topDown: !d.topDown }); break;
        default:
          held.add(e.code);
          if (e.code.startsWith('Arrow')) e.preventDefault();
          apply();
      }
    };
    const up = (e: KeyboardEvent) => { held.delete(e.code); apply(); };
    const lost = () => { held.clear(); useDriver.getState().release(); };
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
