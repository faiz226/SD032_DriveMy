import { describe, it, expect } from "vitest";
import {
  resolveLicence,
  MANEUVERS,
  PREVIEW_MANEUVER_ID,
  CIRCUIT_MARKS,
  PAPER_MARKS,
  TOTAL_MARKS,
  THEORY_MODULES,
  PAPER_PASS_PERCENT,
  type LicenceInput,
} from "@/lib/licence";

const base: LicenceInput = {
  theoryModules: 0,
  quizBest: 0,
  mockBest: 0,
  maneuverScores: {},
};

/** All eight cleared at full score. */
const allPerfect = Object.fromEntries(MANEUVERS.map((m) => [m.id, 100]));

describe("circuit mark allocation", () => {
  it("distributes exactly the circuit total across the eight maneuvers", () => {
    const sum = MANEUVERS.reduce((n, m) => n + m.marks, 0);
    expect(sum).toBe(CIRCUIT_MARKS);
  });

  it("weights harder maneuvers above easier ones", () => {
    const hard = MANEUVERS.find((m) => m.difficulty === "Hard")!;
    const medium = MANEUVERS.find((m) => m.difficulty === "Medium")!;
    const easy = MANEUVERS.find((m) => m.difficulty === "Easy")!;
    expect(hard.marks).toBeGreaterThan(medium.marks);
    expect(medium.marks).toBeGreaterThan(easy.marks);
  });

  it("has exactly one preview maneuver", () => {
    expect(MANEUVERS.filter((m) => m.preview)).toHaveLength(1);
  });

  it("paper and circuit sum to the total", () => {
    expect(PAPER_MARKS + CIRCUIT_MARKS).toBe(TOTAL_MARKS);
  });
});

describe("L licence gate", () => {
  it("is withheld from a learner who has done nothing", () => {
    const s = resolveLicence(base);
    expect(s.hasL).toBe(false);
    expect(s.licence).toBe("none");
    expect(s.totalEarned).toBe(0);
  });

  it("is withheld when the mock passes but theory is incomplete", () => {
    const s = resolveLicence({ ...base, theoryModules: 2, mockBest: 90 });
    expect(s.hasL).toBe(false);
    expect(s.theoryRemaining).toBe(1);
  });

  it("is withheld when theory is done but the mock is below the pass mark", () => {
    const s = resolveLicence({
      ...base,
      theoryModules: THEORY_MODULES,
      mockBest: PAPER_PASS_PERCENT - 2,
    });
    expect(s.hasL).toBe(false);
    expect(s.mockPassed).toBe(false);
  });

  it("is granted at exactly the KPP1 pass mark", () => {
    const s = resolveLicence({
      ...base,
      theoryModules: THEORY_MODULES,
      mockBest: PAPER_PASS_PERCENT,
    });
    expect(s.hasL).toBe(true);
    expect(s.licence).toBe("L");
  });
});

describe("circuit gating", () => {
  it("locks every maneuver except the preview before the L is held", () => {
    const s = resolveLicence(base);
    expect(s.circuitLocked).toBe(true);
    const unlocked = s.maneuvers.filter((m) => m.unlocked);
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].maneuver.id).toBe(PREVIEW_MANEUVER_ID);
  });

  it("opens all eight once the L is held", () => {
    const s = resolveLicence({
      ...base,
      theoryModules: THEORY_MODULES,
      mockBest: 100,
    });
    expect(s.circuitLocked).toBe(false);
    expect(s.maneuvers.every((m) => m.unlocked)).toBe(true);
  });

  it("still counts marks earned in the preview before the L is held", () => {
    const s = resolveLicence({
      ...base,
      maneuverScores: { [PREVIEW_MANEUVER_ID]: 100 },
    });
    const preview = MANEUVERS.find((m) => m.id === PREVIEW_MANEUVER_ID)!;
    expect(s.circuitEarned).toBe(preview.marks);
  });
});

describe("P licence gate", () => {
  it("is withheld without an L, even with a perfect circuit", () => {
    const s = resolveLicence({ ...base, maneuverScores: allPerfect });
    expect(s.allManeuversPassed).toBe(true);
    expect(s.hasP).toBe(false);
  });

  it("is withheld when one maneuver is still unpassed", () => {
    const scores = { ...allPerfect };
    delete scores[MANEUVERS[0].id];
    const s = resolveLicence({
      ...base,
      theoryModules: THEORY_MODULES,
      mockBest: 100,
      maneuverScores: scores,
    });
    expect(s.hasL).toBe(true);
    expect(s.maneuversPassed).toBe(MANEUVERS.length - 1);
    expect(s.hasP).toBe(false);
  });

  it("is granted with the L and all eight passed", () => {
    const s = resolveLicence({
      ...base,
      theoryModules: THEORY_MODULES,
      mockBest: 100,
      quizBest: 100,
      maneuverScores: allPerfect,
    });
    expect(s.hasP).toBe(true);
    expect(s.licence).toBe("P");
    expect(s.totalEarned).toBe(TOTAL_MARKS);
    expect(s.position).toBe(100);
  });
});

describe("marks", () => {
  it("awards circuit marks in proportion to the best score", () => {
    const hard = MANEUVERS.find((m) => m.difficulty === "Hard")!;
    const s = resolveLicence({
      ...base,
      theoryModules: THEORY_MODULES,
      mockBest: 100,
      maneuverScores: { [hard.id]: 50 },
    });
    const row = s.maneuvers.find((m) => m.maneuver.id === hard.id)!;
    expect(row.earned).toBeCloseTo(hard.marks / 2);
  });

  it("never exceeds the paper total", () => {
    const s = resolveLicence({
      ...base,
      theoryModules: THEORY_MODULES,
      quizBest: 100,
      mockBest: 100,
    });
    expect(s.paperEarned).toBe(PAPER_MARKS);
  });

  it("clamps scores outside 0–100 rather than letting them skew the total", () => {
    const s = resolveLicence({
      theoryModules: 99,
      quizBest: 500,
      mockBest: -20,
      maneuverScores: { [MANEUVERS[0].id]: 400 },
    });
    expect(s.paperEarned).toBeLessThanOrEqual(PAPER_MARKS);
    expect(s.circuitEarned).toBeLessThanOrEqual(CIRCUIT_MARKS);
    expect(s.position).toBeLessThanOrEqual(100);
  });

  it("ignores a maneuver id that is not part of the circuit", () => {
    const s = resolveLicence({
      ...base,
      maneuverScores: { "not-a-real-maneuver": 100 },
    });
    expect(s.circuitEarned).toBe(0);
  });
});
