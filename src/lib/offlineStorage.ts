/**
 * offlineStorage.ts — IndexedDB-backed offline queue and cache.
 * Uses idb-keyval for a simple key/value store on top of IndexedDB.
 */
import { get, set, del } from "idb-keyval";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueuedWrite {
  id: string;
  table: "quiz_results" | "mock_results" | "simulation_results" | "colorblind_results";
  payload: Record<string, unknown>;
  timestamp: number;
}

const QUEUE_KEY = "offline-write-queue";

// ─── Offline Write Queue ──────────────────────────────────────────────────────

/** Add a write to the pending offline queue. */
export async function enqueueWrite(
  table: QueuedWrite["table"],
  payload: Record<string, unknown>
): Promise<void> {
  const existing: QueuedWrite[] = (await get(QUEUE_KEY)) ?? [];
  const entry: QueuedWrite = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    table,
    payload,
    timestamp: Date.now(),
  };
  await set(QUEUE_KEY, [...existing, entry]);
}

/** Retrieve all pending writes. */
export async function getQueue(): Promise<QueuedWrite[]> {
  return (await get(QUEUE_KEY)) ?? [];
}

/** Remove a specific entry from the queue by id. */
export async function dequeueWrite(id: string): Promise<void> {
  const existing: QueuedWrite[] = (await get(QUEUE_KEY)) ?? [];
  await set(QUEUE_KEY, existing.filter((e) => e.id !== id));
}

/** Clear the entire queue. */
export async function clearQueue(): Promise<void> {
  await del(QUEUE_KEY);
}

// ─── Generic Cache ────────────────────────────────────────────────────────────

/** Cache any serialisable value under a namespaced key. */
export async function setCached<T>(key: string, value: T): Promise<void> {
  await set(key, value);
}

/** Retrieve a cached value; returns undefined if missing. */
export async function getCached<T>(key: string): Promise<T | undefined> {
  return get<T>(key);
}
