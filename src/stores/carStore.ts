import { create } from 'zustand';

// ── JPJ Demerit Weights ───────────────────────────────────────────────────────
// Based on the official JPJ KPP2 assessment rubric.
export const DEMERIT = {
  CONE_HIT: 5,      // Touching a traffic cone
  POLE_HIT: 20,     // Hitting a boundary pole → Instant Fail
  ROLLBACK: 20,     // Rolling back > 30 cm on hill → Instant Fail
  STALL: 5,         // Stalling on hill
  NOT_IN_BAY: 10,   // Parking outside the designated bay
} as const;

export const MAX_DEMERIT = 20; // ≥ 20 = automatic FAIL

// ── Types ─────────────────────────────────────────────────────────────────────
export type SimMode = 'practice' | 'assessment';

interface CarState {
  // ── Controls ──────────────────────────────────────────────────────────────
  isAccelerating: boolean;
  isBraking: boolean;
  isReversing: boolean;
  steeringInput: number; // -1 (left) to 1 (right)
  clutchPosition: number; // 0 (released) to 1 (fully pressed)
  gear: number; // -1: Reverse, 0: Neutral, 1–5: Forward
  setAccelerating: (val: boolean) => void;
  setBraking: (val: boolean) => void;
  setReversing: (val: boolean) => void;
  setSteering: (val: number) => void;
  setClutch: (val: number) => void;
  setGear: (val: number) => void;

  // ── Scoring ───────────────────────────────────────────────────────────────
  mode: SimMode;
  demeritPoints: number;
  errors: number;           // raw collision count
  stallCount: number;
  rollbackCm: number;
  isFailed: boolean;        // auto-set when demerit >= 20 in assessment mode
  addDemerit: (points: number, reason: string) => void;
  addError: () => void;     // camera-shake + raw error (no demerit in practice)
  resetSession: (mode: SimMode) => void;

  // ── Camera FX ─────────────────────────────────────────────────────────────
  shakeIntensity: number;
  setShake: (val: number) => void;
}

export const useCarStore = create<CarState>((set, get) => ({
  // Controls
  isAccelerating: false,
  isBraking: false,
  isReversing: false,
  steeringInput: 0,
  clutchPosition: 0,
  gear: 1,
  setAccelerating: (val) => set({ isAccelerating: val }),
  setBraking: (val) => set({ isBraking: val }),
  setReversing: (val) => set({ isReversing: val }),
  setSteering: (val) => set({ steeringInput: val }),
  setClutch: (val) => set({ clutchPosition: val }),
  setGear: (val) => set({ gear: val }),

  // Scoring
  mode: 'practice',
  demeritPoints: 0,
  errors: 0,
  stallCount: 0,
  rollbackCm: 0,
  isFailed: false,

  addDemerit: (points, _reason) => {
    const { mode, demeritPoints, isFailed } = get();
    if (isFailed) return; // already failed, no double-counting
    // Trigger camera shake regardless of mode
    set({ shakeIntensity: Math.min(1.0, points / 5) });
    if (mode !== 'assessment') {
      // In practice mode, still record raw error count + shake
      set((s) => ({ errors: s.errors + 1 }));
      return;
    }
    const newTotal = demeritPoints + points;
    set((s) => ({
      demeritPoints: newTotal,
      errors: s.errors + 1,
      isFailed: newTotal >= MAX_DEMERIT,
    }));
  },

  addError: () => {
    // Raw error (camera shake only in practice; full demerit in assessment)
    get().addDemerit(DEMERIT.CONE_HIT, 'cone');
  },

  resetSession: (mode) => set({
    mode,
    demeritPoints: 0,
    errors: 0,
    stallCount: 0,
    rollbackCm: 0,
    isFailed: false,
    shakeIntensity: 0,
    gear: 1,
    isAccelerating: false,
    isBraking: false,
    isReversing: false,
    steeringInput: 0,
    clutchPosition: 0,
  }),

  // Camera FX
  shakeIntensity: 0,
  setShake: (val) => set({ shakeIntensity: val }),
}));
