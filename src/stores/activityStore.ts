import { create } from "zustand";

/**
 * Tracks whether the user is part-way through something that must not be
 * interrupted by the inactivity sign-out.
 *
 * The mock test runs for 45 minutes; the inactivity timeout is 30. A candidate
 * who reads carefully, or pauses the exam and steps away, was being signed out
 * mid-attempt and losing the lot. Extending the timeout globally would weaken
 * the security control everywhere, so instead it is suspended only while a test
 * is genuinely in progress.
 *
 * Deliberately NOT persisted: a stale "test in progress" flag surviving a
 * reload would disable the inactivity timeout indefinitely, which is exactly
 * the failure mode the timeout exists to prevent. It resets on every load.
 */
interface ActivityState {
  /** Number of tests currently in progress (a count, so nested/overlapping
   *  mounts cannot leave the flag stuck on). */
  activeTests: number;
  isTestInProgress: () => boolean;
  beginTest: () => void;
  endTest: () => void;
}

export const useActivityStore = create<ActivityState>()((set, get) => ({
  activeTests: 0,
  isTestInProgress: () => get().activeTests > 0,
  beginTest: () => set((s) => ({ activeTests: s.activeTests + 1 })),
  endTest: () => set((s) => ({ activeTests: Math.max(0, s.activeTests - 1) })),
}));
