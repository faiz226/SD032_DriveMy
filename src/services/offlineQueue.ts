/**
 * Offline write-queue semantics.
 *
 * The previous implementation caught EVERY error and enqueued the row, then
 * returned a success marker. So a row rejected for a permanent reason — an RLS
 * violation, a CHECK constraint, a malformed payload — was reported to the user
 * as "saved", queued, and retried on every `online` event forever. It could
 * never succeed. The user's result was silently lost behind a success message.
 *
 * The fix is to distinguish two very different failures:
 *
 *   TRANSIENT  — offline, DNS failure, timeout, 5xx. Retrying will plausibly
 *                work. Queue it and tell the user it is saved offline.
 *
 *   PERMANENT  — 4xx, RLS denial, constraint violation. Retrying changes
 *                nothing. Surface it immediately; never queue it.
 */

/** Max retry attempts before an item is moved to the dead-letter queue. */
export const MAX_ATTEMPTS = 5;

/** Hard cap per queue, so an extended offline period cannot grow without bound. */
export const MAX_QUEUE_LENGTH = 200;

export interface QueuedItem<T> {
  payload: T;
  attempts: number;
  firstQueuedAt: string;
  lastError?: string;
}

/**
 * Decide whether a failure is worth retrying.
 *
 * Deliberately conservative: only classify as transient when there is positive
 * evidence of a network-class problem. An unrecognised error is treated as
 * permanent so it surfaces, rather than disappearing into a queue.
 */
export function isTransientError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;

  // supabase-js surfaces network failures as a TypeError from fetch.
  if (err instanceof TypeError) return true;

  const code = (err as { code?: string } | null)?.code;
  if (typeof code === "string") {
    // PostgREST/Postgres error codes are permanent: 42501 = RLS/insufficient
    // privilege, 23xxx = integrity constraint violation, 22xxx = data error.
    if (/^(42|23|22)/.test(code)) return false;
    // supabase-js network-layer codes.
    if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND") return true;
  }

  const status = (err as { status?: number } | null)?.status;
  if (typeof status === "number") {
    // 5xx and 408/429 are worth retrying; every other 4xx is the client's fault.
    return status >= 500 || status === 408 || status === 429;
  }

  const message = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("timeout") ||
    message.includes("timed out")
  );
}

/** Wrap a payload for its first queue entry. */
export function newQueuedItem<T>(payload: T, err?: unknown): QueuedItem<T> {
  return {
    payload,
    attempts: 0,
    firstQueuedAt: new Date().toISOString(),
    lastError: err instanceof Error ? err.message : undefined,
  };
}

/**
 * Migrate legacy entries written before the queue carried metadata, so an
 * upgrade does not strand results queued by the previous version.
 */
export function normaliseQueue<T>(raw: unknown): QueuedItem<T>[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (entry && typeof entry === "object" && "payload" in entry && "attempts" in entry) {
      return entry as QueuedItem<T>;
    }
    return newQueuedItem(entry as T);
  });
}
