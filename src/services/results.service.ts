import { supabase } from "@/lib/supabase";
import { get, set } from "idb-keyval";
import {
  isTransientError,
  newQueuedItem,
  normaliseQueue,
  MAX_ATTEMPTS,
  MAX_QUEUE_LENGTH,
  type QueuedItem,
} from "./offlineQueue";
import type {
  InsertQuizResult,
  InsertMockTestResult,
  InsertSimulationResult,
  InsertColorblindResult,
} from "@/types/database";

/** Marker id returned when a result was stored locally rather than on the server. */
export const OFFLINE_QUEUED_ID = "offline-queued";

const QUEUES = {
  quiz_results: "quizQueue",
  mock_test_results: "mockQueue",
  simulation_results: "simulationQueue",
  colorblind_results: "colorblindQueue",
} as const;

type TableName = keyof typeof QUEUES;

const deadLetterKey = (queueKey: string) => `${queueKey}:dead`;

async function enqueue<T>(queueKey: string, item: QueuedItem<T>): Promise<void> {
  const queue = normaliseQueue<T>(await get(queueKey));
  queue.push(item);
  // Drop the OLDEST entries past the cap: a learner's most recent attempt is
  // the one they care about, and unbounded growth is its own failure mode.
  await set(queueKey, queue.slice(-MAX_QUEUE_LENGTH));
}

async function deadLetter<T>(queueKey: string, item: QueuedItem<T>): Promise<void> {
  const dead = normaliseQueue<T>(await get(deadLetterKey(queueKey)));
  dead.push(item);
  await set(deadLetterKey(queueKey), dead.slice(-MAX_QUEUE_LENGTH));
}

/**
 * Insert a result, falling back to the offline queue only when the failure is
 * plausibly transient.
 *
 * Throws on permanent failures so the caller's onError path runs and the user
 * is actually told. Previously every error was swallowed into the queue behind
 * a success message.
 */
async function saveResult<T extends object>(table: TableName, result: T) {
  const queueKey = QUEUES[table];

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue(queueKey, newQueuedItem(result));
    return { ...result, id: OFFLINE_QUEUED_ID };
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .insert(result as never)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    if (isTransientError(err)) {
      console.warn(`[results] transient failure saving to ${table} — queued for retry`, err);
      await enqueue(queueKey, newQueuedItem(result, err));
      return { ...result, id: OFFLINE_QUEUED_ID };
    }
    // Permanent: queuing it would be a lie. Let the caller surface it.
    console.error(`[results] permanent failure saving to ${table} — not queued`, err);
    throw err;
  }
}

export const saveQuizResult = (result: InsertQuizResult) => saveResult("quiz_results", result);
export const saveMockResult = (result: InsertMockTestResult) => saveResult("mock_test_results", result);
export const saveSimulationResult = (result: InsertSimulationResult) => saveResult("simulation_results", result);
export const saveColorblindResult = (result: InsertColorblindResult) => saveResult("colorblind_results", result);

/**
 * Replay queued results. Called on startup and on every `online` event.
 *
 * Each item carries an attempt count. Permanent failures are moved to a
 * dead-letter queue immediately; transient ones are retried until MAX_ATTEMPTS,
 * then dead-lettered too. Nothing is retried forever.
 */
export async function syncOfflineResults(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  await Promise.all(
    (Object.entries(QUEUES) as [TableName, string][]).map(async ([table, queueKey]) => {
      const queue = normaliseQueue<object>(await get(queueKey));
      if (queue.length === 0) return;

      const retained: QueuedItem<object>[] = [];

      for (const item of queue) {
        const { error } = await supabase.from(table).insert(item.payload as never);

        if (!error) continue; // synced — drop from the queue

        item.attempts += 1;
        item.lastError = error.message;

        if (!isTransientError(error) || item.attempts >= MAX_ATTEMPTS) {
          // Retrying will not help, or we have tried long enough. Park it where
          // it can be inspected instead of looping forever.
          console.error(
            `[results] giving up on a queued ${table} row after ${item.attempts} attempt(s)`,
            error
          );
          await deadLetter(queueKey, item);
          continue;
        }

        retained.push(item);
      }

      await set(queueKey, retained);
    })
  );
}

/** Number of results parked in dead-letter queues — surface this in the UI. */
export async function getDeadLetterCount(): Promise<number> {
  const counts = await Promise.all(
    Object.values(QUEUES).map(async (queueKey) =>
      normaliseQueue<object>(await get(deadLetterKey(queueKey))).length
    )
  );
  return counts.reduce((a, b) => a + b, 0);
}

export { syncOfflineResults as syncSimulationResults };
