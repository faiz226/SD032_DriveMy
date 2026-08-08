/**
 * The licence model — the single source of truth for how a DriveMy learner
 * progresses from nothing to L to P.
 *
 * This mirrors the real Malaysian sequence a learner actually goes through:
 *
 *   nothing → pass the KPP theory paper      → Lesen Belajar Memandu  (L)
 *           → pass the JPJ circuit (litar)   → Lesen Percubaan        (P)
 *
 * Everything on the dashboard road is derived from here, so the marks a
 * learner sees, the checkpoints on the road, and what the simulator will let
 * them open can never disagree with each other.
 */

import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

export type Licence = "none" | "L" | "P";
export type Difficulty = "Easy" | "Medium" | "Hard";

/* ── The mark sheet ─────────────────────────────────────────────────────────
   100 marks, split the way the licence itself is split: the paper half you
   need for the L, the circuit half you need for the P.                       */

export const PAPER_MARKS = 60;
export const CIRCUIT_MARKS = 40;
export const TOTAL_MARKS = PAPER_MARKS + CIRCUIT_MARKS;

/** Paper breakdown. Theory modules are all-or-nothing; the tests scale. */
export const THEORY_MODULE_MARKS = 5; // × 3 modules = 15
export const THEORY_MODULES = 3;
export const QUIZ_MARKS = 15;
export const MOCK_MARKS = 30;

/** The KPP1 pass mark, as a percentage — 42 of 50. */
export const PAPER_PASS_PERCENT = (MOCK_PASS_MARK / MOCK_TOTAL_QUESTIONS) * 100;

/* ── Circuit weighting ──────────────────────────────────────────────────────
   The eight JPJ circuit maneuvers are not equally hard, and the app already
   records how hard each one is. Marks come from that rating rather than being
   split evenly eight ways, so clearing the hill start is worth more than
   clearing the ramp — which is what a learner already believes to be true.

   Hard 7 × 3 = 21 · Medium 4 × 4 = 16 · Easy 3 × 1 = 3 → 40 exactly.
   The values are written out rather than computed from a ratio so the
   published mark sheet always sums to the total with no rounding drift.      */

export const DIFFICULTY_MARKS: Record<Difficulty, number> = {
  Hard: 7,
  Medium: 4,
  Easy: 3,
};

export interface Maneuver {
  id: string;
  nameKey: TranslationKey;
  difficulty: Difficulty;
  marks: number;
  /**
   * The one maneuver a learner may open before holding an L, so the simulator
   * is not a locked black box. The easiest one, so the preview is encouraging
   * rather than punishing.
   */
  preview?: boolean;
}

const define = (
  id: string,
  nameKey: TranslationKey,
  difficulty: Difficulty,
  preview = false
): Maneuver => ({
  id,
  nameKey,
  difficulty,
  marks: DIFFICULTY_MARKS[difficulty],
  ...(preview ? { preview: true } : {}),
});

export const MANEUVERS: Maneuver[] = [
  define("hill-start", "progress.maneuver.hill-start", "Hard"),
  define("side-parking", "progress.maneuver.side-parking", "Medium"),
  define("parallel-parking", "progress.maneuver.parallel-parking", "Hard"),
  define("three-point-turn", "progress.maneuver.three-point-turn", "Medium"),
  define("s-curve", "progress.maneuver.s-curve", "Medium"),
  define("z-curve", "progress.maneuver.z-curve", "Medium"),
  define("ramp-test", "progress.maneuver.ramp-test", "Easy", true),
  define("road-merging", "progress.maneuver.road-merging", "Hard"),
];

export const PREVIEW_MANEUVER_ID =
  MANEUVERS.find((m) => m.preview)?.id ?? MANEUVERS[0].id;

/**
 * A maneuver counts as passed on the simulator's own rule: fewer than
 * MAX_DEMERIT demerit points, which the 3D view stores as
 * `score = max(0, 100 − demerits × 5)`. So any score above zero is a pass, and
 * a scruffy pass earns proportionally fewer marks.
 */
export const MANEUVER_PASS_SCORE = 1;

/* ── Inputs ─────────────────────────────────────────────────────────────── */

export interface LicenceInput {
  /** Theory modules completed, 0–3. */
  theoryModules: number;
  /** Best quiz score, 0–100. */
  quizBest: number;
  /** Best mock test score, 0–100. */
  mockBest: number;
  /** Best score per maneuver id, 0–100. Missing ids count as not attempted. */
  maneuverScores: Record<string, number>;
}

export interface ManeuverStanding {
  maneuver: Maneuver;
  /** Best score recorded, 0–100. Null when never attempted. */
  best: number | null;
  passed: boolean;
  /** Marks earned, proportional to the best score. */
  earned: number;
  /** Whether the learner may open this one right now. */
  unlocked: boolean;
}

export interface LicenceStanding {
  licence: Licence;

  paperEarned: number;
  circuitEarned: number;
  totalEarned: number;

  /** Position along the road, 0–100. */
  position: number;

  hasL: boolean;
  hasP: boolean;

  /** L gate parts, so the UI can say precisely what is outstanding. */
  theoryComplete: boolean;
  theoryModules: number;
  theoryRemaining: number;
  mockPassed: boolean;

  /** P gate. */
  maneuversPassed: number;
  allManeuversPassed: boolean;

  maneuvers: ManeuverStanding[];
  /** True while the simulator is limited to the single preview maneuver. */
  circuitLocked: boolean;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Resolve everything about where a learner stands. Pure, so the dashboard, the
 * simulator gate, and the progress page all read the same numbers.
 */
export function resolveLicence(input: LicenceInput): LicenceStanding {
  const theoryModules = clamp(input.theoryModules, 0, THEORY_MODULES);
  const quizBest = clamp(input.quizBest);
  const mockBest = clamp(input.mockBest);

  // ── Paper ──
  const theoryComplete = theoryModules >= THEORY_MODULES;
  const mockPassed = mockBest >= PAPER_PASS_PERCENT;
  const hasL = theoryComplete && mockPassed;

  const paperEarned =
    theoryModules * THEORY_MODULE_MARKS +
    (quizBest / 100) * QUIZ_MARKS +
    (mockBest / 100) * MOCK_MARKS;

  // ── Circuit ──
  // Locked until the L is held, except for the single preview maneuver. Marks
  // from the preview still count; there is no reason to make a learner redo it.
  const circuitLocked = !hasL;

  const maneuvers: ManeuverStanding[] = MANEUVERS.map((maneuver) => {
    const raw = input.maneuverScores[maneuver.id];
    const best = typeof raw === "number" && !Number.isNaN(raw) ? clamp(raw) : null;
    const passed = best !== null && best >= MANEUVER_PASS_SCORE;
    return {
      maneuver,
      best,
      passed,
      earned: best === null ? 0 : (best / 100) * maneuver.marks,
      unlocked: !circuitLocked || maneuver.id === PREVIEW_MANEUVER_ID,
    };
  });

  const circuitEarned = maneuvers.reduce((sum, m) => sum + m.earned, 0);
  const maneuversPassed = maneuvers.filter((m) => m.passed).length;
  const allManeuversPassed = maneuversPassed === MANEUVERS.length;

  const hasP = hasL && allManeuversPassed;
  const totalEarned = paperEarned + circuitEarned;

  return {
    licence: hasP ? "P" : hasL ? "L" : "none",
    paperEarned: round(paperEarned),
    circuitEarned: round(circuitEarned),
    totalEarned: round(totalEarned),
    position: clamp(totalEarned),
    hasL,
    hasP,
    theoryComplete,
    theoryModules,
    theoryRemaining: Math.max(0, THEORY_MODULES - theoryModules),
    mockPassed,
    maneuversPassed,
    allManeuversPassed,
    maneuvers,
    circuitLocked,
  };
}

/** One decimal is enough for a mark sheet, and keeps totals from drifting. */
function round(n: number): number {
  return Math.round(n * 10) / 10;
}
