import { describe, expect, it } from "vitest";
import { lastMockAttempts, nextMockSet } from "./TestLaunchPanel";
import type { MockTestResult } from "@/types/database";

const row = (set_id: string, completed_at: string, score = 50) =>
  ({ set_id, completed_at, score, total_questions: 70 }) as MockTestResult;
const pick = (rows: MockTestResult[], track: "D" | "DA" = "DA") => nextMockSet(lastMockAttempts(rows, track));

describe("suggested mock set", () => {
  it("is Set 1 when nothing was tried", () => {
    expect(pick([])).toBe(1);
  });
  it("is the set not tried yet", () => {
    expect(pick([row("mock-da-combined-1", "2026-01-02")])).toBe(2);
    expect(pick([row("mock-da-combined-2", "2026-01-02")])).toBe(1);
  });
  it("is the set tried longest ago once both were tried, judged by each set's newest attempt", () => {
    expect(pick([
      row("mock-da-combined-1", "2026-01-05"),
      row("mock-da-combined-2", "2026-01-03"),
      row("mock-da-combined-1", "2026-01-01"),
    ])).toBe(2);
  });
  it("only counts attempts on the selected class", () => {
    expect(pick([row("mock-d-combined-1", "2026-01-02")], "DA")).toBe(1);
    expect(pick([row("mock-d-combined-1", "2026-01-02")], "D")).toBe(2);
  });
  it("keeps the newest attempt per set for the 'Last' line", () => {
    const last = lastMockAttempts([row("mock-da-combined-1", "2026-01-09", 61), row("mock-da-combined-1", "2026-01-01", 41)], "DA");
    expect(last.get(1)?.score).toBe(61);
    expect(last.has(2)).toBe(false);
  });
});
