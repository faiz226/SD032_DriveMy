import { loadProgress, saveProgress, PROGRESS_SCOPES } from "@/lib/testProgress";

/**
 * The colour test result stays on this device: it is never sent to the server. It is kept per learner under the
 * same storage as an unfinished test, so signing out and Reset Progress clear it too.
 */
export function loadColourBest(userId: string): number | null {
  const saved = loadProgress<{ best: number }>(PROGRESS_SCOPES.colorResult, userId, Number.POSITIVE_INFINITY);
  return typeof saved?.data.best === "number" ? saved.data.best : null;
}

/** Remember the best percentage so far; returns it. */
export function saveColourResult(userId: string, percentage: number): number {
  const best = Math.max(loadColourBest(userId) ?? 0, percentage);
  saveProgress(PROGRESS_SCOPES.colorResult, userId, Date.now(), { best });
  return best;
}
