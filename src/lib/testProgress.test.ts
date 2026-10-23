import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  saveProgress,
  loadProgress,
  clearProgress,
  clearAllProgress,
  PROGRESS_SCOPES,
  PROGRESS_VERSION,
  DEFAULT_MAX_AGE_MS,
} from "./testProgress";

/**
 * These guard a learner's in-progress work. The failure modes that matter are
 * silent ones: resuming into another user's attempt, resuming stale data, or
 * resuming a shape the current code cannot read.
 */

const ALICE = "11111111-1111-1111-1111-111111111111";
const BOB = "22222222-2222-2222-2222-222222222222";

describe("testProgress", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it("round-trips a snapshot", () => {
    saveProgress(PROGRESS_SCOPES.quiz, ALICE, 1000, { answers: { q1: 2 } });
    const got = loadProgress<{ answers: Record<string, number> }>(PROGRESS_SCOPES.quiz, ALICE);

    expect(got?.data.answers).toEqual({ q1: 2 });
    expect(got?.startedAt).toBe(1000);
    expect(got?.version).toBe(PROGRESS_VERSION);
  });

  it("NEVER returns one user's attempt to another", () => {
    // The shared-device case: a driving school PC, a family tablet.
    saveProgress(PROGRESS_SCOPES.quiz, ALICE, 1000, { answers: { q1: 2 } });
    expect(loadProgress(PROGRESS_SCOPES.quiz, BOB)).toBeNull();
    // Alice's own copy is untouched.
    expect(loadProgress(PROGRESS_SCOPES.quiz, ALICE)).not.toBeNull();
  });

  it("keeps mock sets separate so one does not clobber another", () => {
    saveProgress(PROGRESS_SCOPES.mock("mock-1"), ALICE, 1, { answers: { a: 1 } });
    saveProgress(PROGRESS_SCOPES.mock("mock-2"), ALICE, 2, { answers: { b: 2 } });

    expect(loadProgress<{ answers: object }>(PROGRESS_SCOPES.mock("mock-1"), ALICE)?.data.answers)
      .toEqual({ a: 1 });
    expect(loadProgress<{ answers: object }>(PROGRESS_SCOPES.mock("mock-2"), ALICE)?.data.answers)
      .toEqual({ b: 2 });
  });

  it("discards attempts older than the max age", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    saveProgress(PROGRESS_SCOPES.quiz, ALICE, Date.now(), { answers: { q1: 1 } });

    // Same day: still offered.
    vi.setSystemTime(new Date("2026-01-01T06:00:00Z"));
    expect(loadProgress(PROGRESS_SCOPES.quiz, ALICE)).not.toBeNull();

    // Two days later: resuming this would be confusing, not helpful.
    vi.setSystemTime(new Date("2026-01-03T00:00:00Z"));
    expect(loadProgress(PROGRESS_SCOPES.quiz, ALICE, DEFAULT_MAX_AGE_MS)).toBeNull();
  });

  it("discards snapshots written by an incompatible version", () => {
    localStorage.setItem(
      `drivemy-progress:${PROGRESS_SCOPES.quiz}:${ALICE}`,
      JSON.stringify({
        version: PROGRESS_VERSION - 1,
        userId: ALICE,
        startedAt: 1,
        savedAt: Date.now(),
        data: { answers: { q1: 1 } },
      })
    );
    expect(loadProgress(PROGRESS_SCOPES.quiz, ALICE)).toBeNull();
  });

  it("fails closed on malformed storage rather than throwing", () => {
    localStorage.setItem(`drivemy-progress:${PROGRESS_SCOPES.quiz}:${ALICE}`, "{not json");
    expect(() => loadProgress(PROGRESS_SCOPES.quiz, ALICE)).not.toThrow();
    expect(loadProgress(PROGRESS_SCOPES.quiz, ALICE)).toBeNull();
  });

  it("clears one scope without touching the others", () => {
    saveProgress(PROGRESS_SCOPES.quiz, ALICE, 1, { a: 1 });
    saveProgress(PROGRESS_SCOPES.colorVision, ALICE, 1, { b: 2 });

    clearProgress(PROGRESS_SCOPES.quiz, ALICE);

    expect(loadProgress(PROGRESS_SCOPES.quiz, ALICE)).toBeNull();
    expect(loadProgress(PROGRESS_SCOPES.colorVision, ALICE)).not.toBeNull();
  });

  it("clearAllProgress wipes only the signed-out user", () => {
    saveProgress(PROGRESS_SCOPES.quiz, ALICE, 1, { a: 1 });
    saveProgress(PROGRESS_SCOPES.colorVision, ALICE, 1, { b: 2 });
    saveProgress(PROGRESS_SCOPES.quiz, BOB, 1, { c: 3 });

    clearAllProgress(ALICE);

    expect(loadProgress(PROGRESS_SCOPES.quiz, ALICE)).toBeNull();
    expect(loadProgress(PROGRESS_SCOPES.colorVision, ALICE)).toBeNull();
    expect(loadProgress(PROGRESS_SCOPES.quiz, BOB)).not.toBeNull();
  });

  it("is a no-op without a user id rather than writing a shared entry", () => {
    saveProgress(PROGRESS_SCOPES.quiz, "", 1, { a: 1 });
    expect(localStorage.length).toBe(0);
    expect(loadProgress(PROGRESS_SCOPES.quiz, "")).toBeNull();
  });
});
