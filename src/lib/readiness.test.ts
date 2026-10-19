import { describe, it, expect } from "vitest";
import { calculateReadiness, READINESS_WEIGHTS } from "./readiness";
import { THEORY_MODULE_IDS } from "@/services/analytics.service";

/**
 * Guards two related reporting bugs.
 *
 * 1. Readiness used to weight the OPTIONAL 3D driving simulator at 40% — more
 *    than anything the JPJ KPP1 theory exam actually tests. A learner who
 *    scored 100% on every quiz, every mock and all theory but skipped the
 *    simulator topped out at 60, while "Ready for Exam" needs 75. The top
 *    rating was unreachable for anyone not using an optional feature.
 *
 * 2. Theory progress counted EVERY completed row and divided by 3, but the
 *    Safety page writes its own "safety_ethics" row — so Safety plus two
 *    theory tabs reported 100% theory with a tab never opened.
 */

const WEIGHTS = READINESS_WEIGHTS;
function composite(mock: number, quiz: number, theory: number, sim: number): number {
  return calculateReadiness({mock, quiz, theory, sim});
}

function status(v: number): string {
  if (v >= 75) return "Ready for Exam";
  if (v >= 50) return "Getting There";
  return "Not Ready";
}

/** Mirrors the counting in analytics.service + DashboardPage. */
function theoryPercent(completedModuleIds: string[]): number {
  const done = new Set(completedModuleIds);
  const n = THEORY_MODULE_IDS.filter((id) => done.has(id)).length;
  return (n / THEORY_MODULE_IDS.length) * 100;
}

describe("exam readiness", () => {
  it("weights sum to exactly 1 so a perfect learner scores 100", () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(composite(100, 100, 100, 100)).toBe(100);
  });

  it("a fully-prepared learner reaches Ready for Exam WITHOUT the simulator", () => {
    // The regression that mattered: this used to score 60 and read
    // "Getting There", making the top rating unreachable.
    const score = composite(100, 100, 100, 0);
    expect(score).toBeGreaterThanOrEqual(75);
    expect(status(score)).toBe("Ready for Exam");
  });

  it("cannot be gamed by simulator practice alone", () => {
    const score = composite(0, 0, 0, 100);
    expect(status(score)).toBe("Not Ready");
  });

  it("ranks the mock test as the strongest single signal", () => {
    // The mock test is the closest proxy for the real JPJ exam.
    expect(WEIGHTS.mock).toBeGreaterThan(WEIGHTS.quiz);
    expect(WEIGHTS.mock).toBeGreaterThan(WEIGHTS.theory);
    expect(WEIGHTS.mock).toBeGreaterThan(WEIGHTS.sim);
  });

  it("a learner who has barely started is Not Ready", () => {
    expect(status(composite(0, 0, 33, 0))).toBe("Not Ready");
  });
});

describe("theory progress counting", () => {
  it("does not let the Safety page stand in for an unvisited theory tab", () => {
    // Two real tabs + the Safety page's own row. Previously 3 completed rows
    // divided by 3 = 100%.
    const pct = theoryPercent(["theory-signs", "theory-rules", "safety_ethics"]);
    expect(pct).toBeCloseTo(66.67, 1);
    expect(pct).toBeLessThan(100);
  });

  it("reaches 100% only when all three theory modules are done", () => {
    expect(theoryPercent([...THEORY_MODULE_IDS])).toBe(100);
  });

  it("ignores duplicate rows for the same module", () => {
    expect(theoryPercent(["theory-signs", "theory-signs", "theory-signs"])).toBeCloseTo(33.33, 1);
  });

  it("ignores unrelated module ids entirely", () => {
    expect(theoryPercent(["safety_ethics", "something-else"])).toBe(0);
  });
});
