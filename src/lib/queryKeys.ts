import type { QueryClient } from "@tanstack/react-query";

/**
 * Query keys for everything built from a learner's results. Invalidation
 * matches keys by prefix, so one query spelled two ways fails silently: the
 * quiz and mock pages used to invalidate ["quizBest"] and ["mockBest"] while
 * the profile read ["profile", "quizBest", id], so it stayed stale.
 */
export const learnerKeys = {
  quizStats: (userId?: string, days?: number) => ["progress", "quiz", userId, days] as const,
  mockStats: (userId?: string, days?: number) => ["progress", "mock", userId, days] as const,
  simStats: (userId?: string, days?: number) => ["progress", "sim", userId, days] as const,
  theoryStats: (userId?: string) => ["progress", "theory", userId] as const,
  readiness: (userId?: string) => ["progress", "readiness", userId] as const,
  theoryRows: (userId?: string) => ["theoryProgress", userId] as const,
  activity: (userId?: string) => ["recentActivity", userId] as const,
  simsDone: (userId?: string) => ["simsDone", userId] as const,
  profileBest: (stat: "quiz" | "mock" | "sims" | "color", userId?: string) => ["profile", stat, userId] as const,
};

const LEARNER_ROOTS = ["progress", "theoryProgress", "recentActivity", "simsDone", "profile"] as const;

/** Refresh every view built from results — call after a result is saved or erased. */
export function invalidateLearnerData(queryClient: QueryClient) {
  return Promise.all(LEARNER_ROOTS.map(root => queryClient.invalidateQueries({ queryKey: [root] })));
}
