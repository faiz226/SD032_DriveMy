/**
 * Crash-safe storage for a test that is part-way through.
 *
 * Quiz, mock test and colour vision all kept their answers in component state
 * only. One accidental tap on the bottom nav, one back-swipe, one refresh, and
 * 45 minutes of work vanished with no warning and no way back.
 *
 * Design notes:
 *
 * - Keyed per USER. On a shared device (a driving school PC, a family tablet)
 *   one learner must never resume into another's half-finished attempt.
 *
 * - VERSIONED. If the saved shape changes in a future release, old entries are
 *   discarded rather than restored into code that no longer understands them.
 *
 * - EXPIRING. Resuming a mock test someone abandoned three days ago is not
 *   helpful; it is confusing. Stale entries are dropped on read.
 *
 * - localStorage rather than IndexedDB, deliberately: writes are synchronous,
 *   so a save issued from a `beforeunload` handler actually completes. The
 *   payload is a few hundred bytes.
 */

const PREFIX = "drivemy-progress";

/** Bump when the persisted shape changes incompatibly. */
export const PROGRESS_VERSION = 1;

/** Abandoned attempts older than this are not offered for resume. */
export const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SavedProgress<T> {
  version: number;
  userId: string;
  /** When the attempt began — used to compute remaining time on a timed exam. */
  startedAt: number;
  /** When this snapshot was written. */
  savedAt: number;
  data: T;
}

function storageKey(scope: string, userId: string): string {
  return `${PREFIX}:${scope}:${userId}`;
}

/** Persist a snapshot. Never throws — losing a save must not break the test. */
export function saveProgress<T>(
  scope: string,
  userId: string,
  startedAt: number,
  data: T
): void {
  if (!userId) return;
  try {
    const payload: SavedProgress<T> = {
      version: PROGRESS_VERSION,
      userId,
      startedAt,
      savedAt: Date.now(),
      data,
    };
    localStorage.setItem(storageKey(scope, userId), JSON.stringify(payload));
  } catch {
    // Quota exceeded, private browsing, storage disabled. The test continues;
    // the user simply loses the resume safety net.
  }
}

/**
 * Read a snapshot back, or null if there is nothing usable.
 *
 * Returns null (and clears the entry) when the saved data is for a different
 * schema version, a different user, malformed, or older than `maxAgeMs`.
 */
export function loadProgress<T>(
  scope: string,
  userId: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): SavedProgress<T> | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(scope, userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedProgress<T>;

    if (
      parsed?.version !== PROGRESS_VERSION ||
      parsed.userId !== userId ||
      typeof parsed.savedAt !== "number" ||
      typeof parsed.startedAt !== "number" ||
      parsed.data == null
    ) {
      clearProgress(scope, userId);
      return null;
    }

    if (Date.now() - parsed.savedAt > maxAgeMs) {
      clearProgress(scope, userId);
      return null;
    }

    return parsed;
  } catch {
    clearProgress(scope, userId);
    return null;
  }
}

export function clearProgress(scope: string, userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(storageKey(scope, userId));
  } catch {
    /* nothing useful to do */
  }
}

/** Remove every saved attempt for a user — used on sign-out. */
export function clearAllProgress(userId: string): void {
  if (!userId) return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:`) && k.endsWith(`:${userId}`)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nothing useful to do */
  }
}

// ── Scopes ──────────────────────────────────────────────────────────────────
export const PROGRESS_SCOPES = {
  quiz: "quiz",
  colorVision: "color-vision",
  /** Mock progress is per set, so mock-1 and mock-2 do not overwrite each other. */
  mock: (setId: string) => `mock:${setId}`,
} as const;
