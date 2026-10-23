// The simulator's two quality tiers (WP5). Low is for Android phones (Redmi 9T class); Medium for iPhones
// (Xs class) and desktops. Detected once, overridable in the simulator's settings, and only ever applied
// before a run starts: quality never changes in the middle of a station.
import { create } from 'zustand';
import type { MirrorId } from './physics/mirrors';

export type Tier = 'low' | 'medium';
export type TierPref = 'auto' | Tier;

export interface TierSpec {
  tier: Tier;
  /** One sun with a 1024 px shadow map that follows the car; otherwise a soft shadow painted under the car. */
  shadows: boolean;
  clearcoat: boolean;
  /** Render scale, as a fraction of the device pixel ratio: moved between these to hold the frame rate. */
  renderScale: [number, number];
  maxDpr: number;
  /** The frame rate the render scale defends: below the first it steps down, above the second it steps up. */
  fpsBounds: [number, number];
  mirrors: { perFrame: number; budget: number; ids: MirrorId[] };
}

export const TIERS: Record<Tier, TierSpec> = {
  low: { tier: 'low', shadows: false, clearcoat: false, renderScale: [0.7, 0.85], maxDpr: 1.5, fpsBounds: [30, 50], mirrors: { perFrame: 0.5, budget: 256 * 128, ids: ['left', 'interior', 'right'] } },
  medium: { tier: 'medium', shadows: true, clearcoat: true, renderScale: [0.85, 1], maxDpr: 2, fpsBounds: [45, 70], mirrors: { perFrame: 3, budget: 512 * 256, ids: ['left', 'interior', 'right'] } },
};

/** Android, or a device reporting 4 GB of memory or less, gets Low; iPhones and desktops get Medium. */
export function detectTier(nav: { userAgent: string; deviceMemory?: number } = navigator as Navigator & { deviceMemory?: number }): Tier {
  if (/Android/i.test(nav.userAgent)) return 'low';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return 'low';
  return 'medium';
}

const KEY = 'drivemy.sim.quality';

function savedPref(): TierPref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'low' || v === 'medium' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export const useQualityPref = create<{ pref: TierPref; setPref(p: TierPref): void }>((set) => ({
  pref: savedPref(),
  setPref: (pref) => {
    try { localStorage.setItem(KEY, pref); } catch { /* storage blocked: the choice lasts this visit */ }
    set({ pref });
  },
}));

const detected = typeof navigator === 'undefined' ? 'medium' : detectTier();

/** The tier in effect now, outside React: the route uses it to start the right downloads early. */
export const currentTier = (): Tier => {
  const pref = useQualityPref.getState().pref;
  return pref === 'auto' ? detected : pref;
};

/** The tier in effect: the setting, or the device's own when the setting is Auto. */
export function useTier(): { tier: Tier; detected: Tier } {
  const pref = useQualityPref((s) => s.pref);
  return { tier: pref === 'auto' ? detected : pref, detected };
}
