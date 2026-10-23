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
  id: string;
  payload: T;
  attempts: number;
  firstQueuedAt: string;
  lastError?: string;
}

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Decide whether a failure is worth retrying.
 *
 * Deliberately conservative: only classify as transient when there is positive
 * evidence of a network-class problem. Known permanent database or client errors
 * always return false, even if network connectivity changes during response processing.
 */
export function isTransientError(err: unknown, statusSibling?: number): boolean {
  // 1. Explicit database error codes (Postgres / PostgREST) are always permanent
  const code = (err as { code?: string } | null)?.code;
  if (typeof code === "string") {
    // 42xxx = RLS/insufficient privilege, 23xxx = integrity constraint, 22xxx = syntax/type error
    if (/^(42|23|22)/.test(code)) return false;
    // supabase-js network-layer codes
    if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "FETCH_ERROR") return true;
  }

  // 2. HTTP status codes
  const status = typeof statusSibling === "number" ? statusSibling : (err as { status?: number } | null)?.status;
  if (typeof status === "number") {
    // Client errors other than 408 (timeout) and 429 (rate-limited) are permanent
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
    // 0 = network drop / aborted request, 5xx = server error, 408/429 = retryable
    if (status === 0 || status >= 500 || status === 408 || status === 429) return true;
  }

  // 3. supabase-js network failures as a TypeError from fetch
  if (err instanceof TypeError) return true;

  // 4. Offline state only applies if no permanent DB/HTTP code was reported
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;

  // 5. Handle Error instances or plain PostgREST error objects without collapsing to [object Object]
  const rawMsg = err instanceof Error
    ? err.message
    : (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string")
    ? (err as any).message
    : (err && typeof err === "object" && "error_description" in err && typeof (err as any).error_description === "string")
    ? (err as any).error_description
    : String(err ?? "");

  const message = rawMsg.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("connection refused") ||
    message.includes("load failed")
  );
}

/** Wrap a payload for its first queue entry with a stable persistent UUID. */
export function newQueuedItem<T>(payload: T, err?: unknown): QueuedItem<T> {
  let normalizedPayload = payload;
  if (payload && typeof payload === "object") {
    const payloadObj = payload as Record<string, unknown>;
    if (!isValidUUID(payloadObj.id)) {
      normalizedPayload = { ...payloadObj, id: generateUUID() } as T;
    }
  }

  const payloadId = (normalizedPayload as Record<string, unknown> | null)?.id;
  const id = isValidUUID(payloadId) ? (payloadId as string) : generateUUID();

  const lastError = err instanceof Error
    ? err.message
    : (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string")
    ? (err as any).message
    : (err && typeof err === "object" && "error_description" in err && typeof (err as any).error_description === "string")
    ? (err as any).error_description
    : err ? String(err) : undefined;

  return {
    id,
    payload: normalizedPayload,
    attempts: 0,
    firstQueuedAt: new Date().toISOString(),
    lastError,
  };
}

/**
 * Migrate legacy entries written before the queue carried metadata or stable IDs, so an
 * upgrade does not strand results queued by the previous version.
 */
export function normaliseQueue<T>(raw: unknown): QueuedItem<T>[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((entry) => {
    if (entry && typeof entry === "object" && "payload" in entry && "attempts" in entry) {
      const item = { ...(entry as QueuedItem<T>) };
      let payload = item.payload;
      if (payload && typeof payload === "object") {
        const payloadObj = payload as Record<string, unknown>;
        if (!isValidUUID(payloadObj.id)) {
          payload = { ...payloadObj, id: generateUUID() } as T;
          item.payload = payload;
        }
      }
      if (!isValidUUID(item.id)) {
        const payloadId = (payload as Record<string, unknown> | null)?.id;
        item.id = isValidUUID(payloadId) ? (payloadId as string) : generateUUID();
      }
      return item;
    }
    return newQueuedItem(entry as T);
  });
}
