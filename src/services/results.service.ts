import { supabase } from "@/lib/supabase";
import { get, update, createStore, promisifyRequest } from "idb-keyval";
import {
  isTransientError,
  newQueuedItem,
  normaliseQueue,
  isValidUUID,
  generateUUID,
  MAX_ATTEMPTS,
  MAX_QUEUE_LENGTH,
  type QueuedItem,
} from "./offlineQueue";
import { useAuthStore } from "@/stores/authStore";
import type {
  InsertQuizResult,
  InsertMockTestResult,
  InsertSimulationResult,
  InsertColorblindResult,
} from "@/types/database";

/**
 * The idb-keyval default store function. All application keys share the single
 * 'keyval' object store inside the 'keyval-store' database, which lets us issue
 * multiple get/put requests within a single readwrite transaction.
 *
 * We lazily initialise once and reuse throughout this module.
 */
let _defaultStore: ReturnType<typeof createStore> | null = null;
function getDefaultStore(): ReturnType<typeof createStore> | null {
  if (!_defaultStore && typeof createStore === "function") {
    _defaultStore = createStore("keyval-store", "keyval");
  }
  return _defaultStore;
}

/** Marker id returned when a result was stored locally rather than on the server. */
export const OFFLINE_QUEUED_ID = "offline-queued";

const QUEUES = {
  quiz_results: "quizQueue",
  mock_test_results: "mockQueue",
  simulation_results: "simulationQueue",
  colorblind_results: "colorblindQueue",
} as const;

export type TableName = keyof typeof QUEUES;

const deadLetterKey = (queueKey: string) => `${queueKey}:dead`;

interface ResultPayload {
  id?: string;
  user_id?: string;
  [key: string]: unknown;
}

function ensureResultId<T extends object>(result: T): T & { id: string } {
  const existingId = (result as ResultPayload).id;
  if (isValidUUID(existingId)) {
    return result as T & { id: string };
  }
  const id = generateUUID();
  return { ...result, id };
}

export const DELETED_USERS_STORAGE_KEY = "drivemy_deleted_users";

// In-flight and permanent deletion tracker to coordinate active account deletion across tabs and replay
const deletingUsers = new Set<string>();
const deletedUsers = new Set<string>();

export function markUserDeleting(userId: string): void {
  if (userId) deletingUsers.add(userId);
}

export function unmarkUserDeleting(userId: string): void {
  if (userId) deletingUsers.delete(userId);
}

export function isUserDeleting(userId?: string): boolean {
  return Boolean(userId && deletingUsers.has(userId));
}

export function _resetDeletionTracking(): void {
  deletedUsers.clear();
  deletingUsers.clear();
}

export async function markUserDeleted(userId: string): Promise<void> {
  if (!userId) return;
  // Persist to durable storage first before updating local in-memory state;
  // do not silently swallow tombstone persistence failure, let it propagate
  await update<string[]>(DELETED_USERS_STORAGE_KEY, (val) => {
    const set = new Set(val || []);
    set.add(userId);
    return Array.from(set);
  });
  deletedUsers.add(userId);
  deletingUsers.delete(userId);
}

export async function isUserDeleted(userId?: string): Promise<boolean> {
  if (!userId) return false;
  // Read durable storage tombstone first to reflect cross-context mutations;
  // do not silently swallow storage read failures
  const list = await get<string[]>(DELETED_USERS_STORAGE_KEY);
  if (Array.isArray(list) && list.includes(userId)) {
    deletedUsers.add(userId);
    return true;
  }
  if (deletedUsers.has(userId)) return true;
  return false;
}

/**
 * Atomic queue mutation guarded by deletion state.
 *
 * Opens a single IndexedDB readwrite transaction via the idb-keyval default store
 * (all keys share the same 'keyval' object store). Within that transaction:
 *   1. Reads the deletion tombstone key.
 *   2. If the target user is already deleted → returns false without writing.
 *   3. Reads the queue key.
 *   4. Applies the mutator and puts the result.
 *   5. Awaits the transaction commit.
 *
 * Because the tombstone read and queue write happen in one transaction, there is
 * no window where a deletion committed between the check and the write. If the
 * IDB transaction itself fails (QuotaExceededError, etc.) it aborts atomically
 * and the promise rejects — no partial write is committed.
 *
 * IMPORTANT: Do not await any promise inside this function while the IDB
 * transaction is open (no network calls). The IDB transaction auto-commits when
 * the event loop is idle.
 */
async function atomicQueueUpdateIfNotDeleted<T>(
  queueKey: string,
  targetUserId: string | undefined,
  mutator: (queue: QueuedItem<T>[]) => QueuedItem<T>[]
): Promise<boolean> {
  // Fast-path: if no user scoping needed just do an ordinary update and succeed.
  if (!targetUserId) {
    await update(queueKey, (raw) => {
      const queue = normaliseQueue<T>(raw);
      return mutator(queue);
    });
    return true;
  }

  const storeFn = getDefaultStore();
  if (storeFn) {
    return storeFn("readwrite", (store) => {
      return new Promise<boolean>((resolve, reject) => {
        // Step 1: Read the deletion tombstone within the transaction.
        const tombstoneReq = store.get(DELETED_USERS_STORAGE_KEY) as IDBRequest<string[] | undefined>;
        tombstoneReq.onerror = () => reject(tombstoneReq.error);
        tombstoneReq.onsuccess = function () {
          const tombstone: string[] | undefined = tombstoneReq.result;
          if (Array.isArray(tombstone) && tombstone.includes(targetUserId)) {
            // User is deleted: do NOT write anything. Resolve false without committing.
            resolve(false);
            return;
          }
          // Step 2: Read the current queue within the same transaction.
          const queueReq = store.get(queueKey) as IDBRequest<QueuedItem<T>[] | undefined>;
          queueReq.onerror = () => reject(queueReq.error);
          queueReq.onsuccess = function () {
            try {
              const newQueue = mutator(normaliseQueue<T>(queueReq.result));
              // Step 3: Write the updated queue — still within the same transaction.
              store.put(newQueue, queueKey);
              // Await the transaction commit; resolve true when it commits.
              resolve(promisifyRequest(store.transaction).then(() => true));
            } catch (err) {
              reject(err instanceof Error ? err : new Error(String(err)));
            }
          };
        };
      });
    });
  }

  // Fallback for mock adapters lacking createStore
  if (await isUserDeleted(targetUserId)) {
    return false;
  }
  await update(queueKey, (raw) => {
    const queue = normaliseQueue<T>(raw);
    return mutator(queue);
  });
  return true;
}

/**
 * Reset the lazy default store reference so tests can inject a fresh store.
 * Not for application use.
 */
export function _resetDefaultStore(): void {
  _defaultStore = null;
}

async function enqueue<T>(queueKey: string, item: QueuedItem<T>): Promise<void> {
  const itemUserId = ((item as { payload?: { user_id?: string } })?.payload?.user_id) || (item as { user_id?: string })?.user_id;
  await atomicQueueUpdateIfNotDeleted(queueKey, itemUserId, (queue) => {
    queue.push(item);
    return queue.slice(-MAX_QUEUE_LENGTH);
  });
}

async function deadLetter<T>(queueKey: string, item: QueuedItem<T>): Promise<void> {
  const itemUserId = ((item as { payload?: { user_id?: string } })?.payload?.user_id) || (item as { user_id?: string })?.user_id;
  await atomicQueueUpdateIfNotDeleted(deadLetterKey(queueKey), itemUserId, (dead) => {
    dead.push(item);
    return dead.slice(-MAX_QUEUE_LENGTH);
  });
}

/**
 * Insert a result, falling back to the offline queue only when the failure is
 * plausibly transient.
 *
 * Throws on permanent failures so the caller's onError path runs and the user
 * is actually told.
 */
async function saveResult<T extends object>(table: TableName, result: T) {
  const queueKey = QUEUES[table];
  const payloadWithId = ensureResultId(result);

  const resultUserId = (payloadWithId as ResultPayload).user_id;
  if (resultUserId && (await isUserDeleted(resultUserId))) {
    throw new Error(`Cannot save result for deleted account: ${resultUserId}`);
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue(queueKey, newQueuedItem(payloadWithId));
    return { ...payloadWithId, id: OFFLINE_QUEUED_ID };
  }

  try {
    const response = await supabase
      .from(table)
      .insert(payloadWithId as never)
      .select()
      .single();
    const { data, error, status } = response as { data: unknown; error: unknown; status?: number };
    if (error) {
      if (isTransientError(error, status)) {
        console.warn(`[results] transient failure saving to ${table} — queued for retry`, error);
        await enqueue(queueKey, newQueuedItem(payloadWithId, error));
        return { ...payloadWithId, id: OFFLINE_QUEUED_ID };
      }
      console.error(`[results] permanent failure saving to ${table} — not queued`, error);
      throw error;
    }
    return data;
  } catch (err) {
    if (isTransientError(err)) {
      console.warn(`[results] transient error saving to ${table} — queued for retry`, err);
      await enqueue(queueKey, newQueuedItem(payloadWithId, err));
      return { ...payloadWithId, id: OFFLINE_QUEUED_ID };
    }
    console.error(`[results] permanent failure saving to ${table} — not queued`, err);
    throw err;
  }
}

export const saveQuizResult = (result: InsertQuizResult) => saveResult("quiz_results", result);
export const saveMockResult = (result: InsertMockTestResult) => saveResult("mock_test_results", result);
export const saveSimulationResult = (result: InsertSimulationResult) => saveResult("simulation_results", result);
export const saveColorblindResult = (result: InsertColorblindResult) => saveResult("colorblind_results", result);

const inFlightSync = new Map<string, Promise<void>>();

/**
 * Replay queued results for the current authenticated user only.
 *
 * Each item carries an attempt count and persistent UUID. Permanent failures are
 * moved to a dead-letter queue; transient ones are retried up to MAX_ATTEMPTS.
 * Items belonging to other users remain safely parked until that user logs in.
 */
export async function syncOfflineResults(targetUserId?: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const activeUserId = useAuthStore.getState().user?.id;
  if (!activeUserId) {
    // Unauthenticated clients must not replay rows to avoid cross-user RLS rejections
    return;
  }
  if (targetUserId && targetUserId !== activeUserId) {
    // Do not trust an external target ID over the active authenticated session
    return;
  }

  await Promise.all(
    (Object.entries(QUEUES) as [TableName, string][]).map(async ([table, queueKey]) => {
      const lockName = `drivemy-sync-${table}`;

      if (inFlightSync.has(lockName)) {
        return inFlightSync.get(lockName);
      }

      const syncTask = (async () => {
        if (typeof navigator !== "undefined" && navigator.locks && typeof navigator.locks.request === "function") {
          let lockAcquired = false;
          try {
            await navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => {
              lockAcquired = true;
              if (!lock) {
                // Lock held by another tab - skip safely
                return;
              }
              await syncTableQueue(table, queueKey, activeUserId);
            });
            return;
          } catch (err) {
            if (lockAcquired) {
              // Error occurred inside syncTableQueue while holding the lock — propagate, do not retry outside
              throw err;
            }
            console.warn(`[results] Web Lock acquisition failed for ${lockName}, falling back to local coordination`, err);
          }
        }
        await syncTableQueue(table, queueKey, activeUserId);
      })();

      inFlightSync.set(lockName, syncTask);
      try {
        await syncTask;
      } finally {
        inFlightSync.delete(lockName);
      }
    })
  );
}

async function syncTableQueue(table: TableName, queueKey: string, activeUserId: string): Promise<void> {
  // Step 1: Atomically migrate legacy bare payloads and wrapper metadata in storage BEFORE network I/O
  await update(queueKey, (raw) => {
    return normaliseQueue<ResultPayload>(raw);
  });

  // Step 2: Read fully migrated queue snapshot from storage
  const raw = await get(queueKey);
  const queue = normaliseQueue<ResultPayload>(raw);
  if (queue.length === 0) return;

  for (const item of queue) {
    // Retain entries belonging to other users untouched
    if (item.payload?.user_id !== activeUserId) {
      continue;
    }

    // Revalidate active authenticated identity before issuing the request
    const currentSessionUser = useAuthStore.getState().user?.id;
    if (!currentSessionUser || currentSessionUser !== activeUserId) {
      // Session ended or switched accounts during replay. Retain work untouched and stop.
      break;
    }

    // Check if user is being deleted
    if (isUserDeleting(item.payload.user_id) || (await isUserDeleted(item.payload.user_id))) {
      await update(queueKey, (currentRaw) => {
        const current = normaliseQueue<ResultPayload>(currentRaw);
        return current.filter((entry) => entry.id !== item.id && entry.payload?.id !== item.payload?.id);
      });
      continue;
    }

    const response = await supabase.from(table).insert(item.payload as never);
    const { error, status } = response as { error: unknown; status?: number };

    // Prove matching result identity on 23505 rather than blindly acknowledging every unique violation
    let isAcknowledged = !error;
    let isTransientVerification = false;
    if (error && (error as { code?: string } | null)?.code === "23505" && item.payload?.id) {
      try {
        const check = await supabase
          .from(table)
          .select("id")
          .eq("id", item.payload.id)
          .maybeSingle();
        const checkError = (check as { error?: unknown })?.error;
        const checkStatus = (check as { status?: number })?.status;
        if (checkError && isTransientError(checkError, checkStatus)) {
          // Transient failure during verification query (network drop, timeout, 5xx)
          isTransientVerification = true;
        } else {
          const existing = (check as unknown as { data?: { id?: string } | null })?.data;
          if (existing && existing.id === item.payload.id) {
            // Exact matching result UUID confirmed present on server
            isAcknowledged = true;
          }
        }
      } catch (err) {
        if (isTransientError(err)) {
          isTransientVerification = true;
        }
      }
    }

    if (isTransientVerification) {
      // Retain pending work in active queue for retry rather than permanently dead-lettering!
      item.attempts += 1;
      item.lastError = "Transient failure verifying unique constraint idempotency on server";
      await update(queueKey, (currentRaw) => {
        const current = normaliseQueue<ResultPayload>(currentRaw);
        return current.map((entry) => {
          if (entry.id === item.id || entry.payload?.id === item.payload?.id) {
            return { ...entry, attempts: item.attempts, lastError: item.lastError };
          }
          return entry;
        });
      });
      continue;
    }

    if (isAcknowledged) {
      // Remove acknowledged item atomically from the active queue
      await update(queueKey, (currentRaw) => {
        const current = normaliseQueue<ResultPayload>(currentRaw);
        return current.filter((entry) => entry.id !== item.id && entry.payload?.id !== item.payload?.id);
      });

      // Check if session switched during request before continuing to subsequent items
      const postRequestUser = useAuthStore.getState().user?.id;
      if (postRequestUser !== activeUserId) {
        break;
      }
      continue;
    }

    // Request failed: check if user switched during request before making destructive queue changes
    const postRequestUser = useAuthStore.getState().user?.id;
    if (postRequestUser !== activeUserId) {
      // User switched while request was in-flight.
      // Retain work untouched in active queue for when the owning user returns; DO NOT dead-letter on 42501!
      break;
    }

    if (isUserDeleting(item.payload.user_id) || (await isUserDeleted(item.payload.user_id))) {
      await update(queueKey, (currentRaw) => {
        const current = normaliseQueue<ResultPayload>(currentRaw);
        return current.filter((entry) => entry.id !== item.id && entry.payload?.id !== item.payload?.id);
      });
      continue;
    }

    item.attempts += 1;
    item.lastError = (error as { message?: string } | null)?.message || String(error);

    if (!isTransientError(error, status) || item.attempts >= MAX_ATTEMPTS) {
      console.error(
        `[results] giving up on a queued ${table} row after ${item.attempts} attempt(s)`,
        error
      );
      await deadLetter(queueKey, item);
      await update(queueKey, (currentRaw) => {
        const current = normaliseQueue<ResultPayload>(currentRaw);
        return current.filter((entry) => entry.id !== item.id && entry.payload?.id !== item.payload?.id);
      });
      continue;
    }

    // Transient failure: update attempts and lastError in place atomically
    await update(queueKey, (currentRaw) => {
      const current = normaliseQueue<ResultPayload>(currentRaw);
      return current.map((entry) => {
        if (entry.id === item.id || entry.payload?.id === item.payload?.id) {
          return { ...entry, attempts: item.attempts, lastError: item.lastError };
        }
        return entry;
      });
    });
  }
}

/** Clear all queued live and dead items belonging to a specific user (used on account deletion). */
export async function clearUserResultsQueue(userId: string): Promise<void> {
  await markUserDeleted(userId);
  markUserDeleting(userId);
  const failedQueues: string[] = [];

  try {
    await Promise.all(
      Object.entries(QUEUES).flatMap(([table, queueKey]) => [
        update(queueKey, (raw) => {
          const current = normaliseQueue<ResultPayload>(raw);
          return current.filter((item) => item.payload?.user_id !== userId);
        }).catch((err) => {
          failedQueues.push(`${table}:active`);
          console.error(`[results] failed clearing active queue ${table}`, err);
        }),
        update(deadLetterKey(queueKey), (raw) => {
          const current = normaliseQueue<ResultPayload>(raw);
          return current.filter((item) => item.payload?.user_id !== userId);
        }).catch((err) => {
          failedQueues.push(`${table}:dead`);
          console.error(`[results] failed clearing dead queue ${table}`, err);
        }),
      ])
    );

    if (failedQueues.length > 0) {
      throw new Error(`Partial queue cleanup failure for user ${userId}. Failed: ${failedQueues.join(", ")}`);
    }
  } finally {
    unmarkUserDeleting(userId);
  }
}

/** Number of results parked in dead-letter queues across all tables. */
export async function getDeadLetterCount(): Promise<number> {
  const counts = await Promise.all(
    Object.values(QUEUES).map(async (queueKey) =>
      normaliseQueue<object>(await get(deadLetterKey(queueKey))).length
    )
  );
  return counts.reduce((a, b) => a + b, 0);
}

/** Bounded account-scoped status: returns pending and dead-letter count for the target/current user. */
export async function getUserPendingStatus(userId?: string): Promise<{ pendingCount: number; deadLetterCount: number }> {
  const activeUserId = useAuthStore.getState().user?.id;
  if (!activeUserId) return { pendingCount: 0, deadLetterCount: 0 };
  if (userId && userId !== activeUserId) {
    // Disallow arbitrary target IDs from querying another user's queue counts
    return { pendingCount: 0, deadLetterCount: 0 };
  }
  const targetUserId = activeUserId;

  let pendingCount = 0;
  let deadLetterCount = 0;

  for (const queueKey of Object.values(QUEUES)) {
    const activeQueue = normaliseQueue<ResultPayload>(await get(queueKey));
    pendingCount += activeQueue.filter((item) => item.payload?.user_id === targetUserId).length;

    const deadQueue = normaliseQueue<ResultPayload>(await get(deadLetterKey(queueKey)));
    deadLetterCount += deadQueue.filter((item) => item.payload?.user_id === targetUserId).length;
  }

  return { pendingCount, deadLetterCount };
}

/** Bounded account-scoped recovery: returns dead-letter items belonging only to the target/current user. */
export async function getUserDeadLetterItems(userId?: string): Promise<Array<QueuedItem<ResultPayload> & { table: TableName }>> {
  const activeUserId = useAuthStore.getState().user?.id;
  if (!activeUserId) return [];
  if (userId && userId !== activeUserId) {
    // Disallow querying another user's dead-letter entries
    return [];
  }
  const targetUserId = activeUserId;
  const userDeadItems: Array<QueuedItem<ResultPayload> & { table: TableName }> = [];

  for (const [table, queueKey] of Object.entries(QUEUES) as [TableName, string][]) {
    const deadKey = deadLetterKey(queueKey);
    let committedDeadQueue: QueuedItem<ResultPayload>[] = [];

    // Normalize current value INSIDE the atomic update callback!
    // This preserves any concurrent appends (e.g. from another account or tab) without restoring a stale snapshot.
    await update(deadKey, (currentRaw) => {
      const current = normaliseQueue<ResultPayload>(currentRaw);
      committedDeadQueue = current;
      return current;
    });

    const userItems = committedDeadQueue.filter((item) => item.payload?.user_id === targetUserId);
    for (const item of userItems) {
      userDeadItems.push({ ...item, table });
    }
  }

  return userDeadItems;
}

/** Bounded account-scoped retry: moves a specific dead-letter item back to active retry queue failure-safely. */
export async function retryUserDeadLetterItem(table: TableName, itemId: string, userId?: string): Promise<boolean> {
  const activeUserId = useAuthStore.getState().user?.id;
  if (!activeUserId) return false;
  if (userId && userId !== activeUserId) {
    // Disallow arbitrary target IDs
    return false;
  }
  if (await isUserDeleted(activeUserId)) {
    throw new Error(`Cannot retry item for deleted account: ${activeUserId}`);
  }
  const targetUserId = activeUserId;

  const queueKey = QUEUES[table];
  const deadKey = deadLetterKey(queueKey);

  // Step 1: Read dead letter queue without removing the item
  const deadRaw = await get(deadKey);
  const deadQueue = normaliseQueue<ResultPayload>(deadRaw);
  const foundItem = deadQueue.find((item) => item.id === itemId && item.payload?.user_id === targetUserId);
  if (!foundItem) return false;

  const itemToRetry: QueuedItem<ResultPayload> = {
    ...foundItem,
    attempts: 0,
    lastError: undefined,
  };

  // Step 2: Atomically add to active queue FIRST (failure-safe & idempotent)
  const activeAdded = await atomicQueueUpdateIfNotDeleted<ResultPayload>(queueKey, targetUserId, (activeQueue) => {
    const exists = activeQueue.some(
      (entry) => entry.id === itemToRetry.id || (entry.payload?.id && entry.payload.id === itemToRetry.payload?.id)
    );
    if (!exists) {
      activeQueue.push(itemToRetry);
    }
    return activeQueue.slice(-MAX_QUEUE_LENGTH);
  });
  if (!activeAdded) {
    // If user was deleted concurrently, purge from dead-letter queue as well
    await update(deadKey, (currentRaw) => {
      const dead = normaliseQueue<ResultPayload>(currentRaw);
      return dead.filter((entry) => entry.id !== itemId && entry.payload?.user_id !== targetUserId);
    });
    return false;
  }

  // Step 3: Active queue write succeeded! Only now remove from dead-letter queue
  await atomicQueueUpdateIfNotDeleted<ResultPayload>(deadKey, targetUserId, (dead) => {
    return dead.filter((entry) => entry.id !== itemId);
  });

  return true;
}

export { syncOfflineResults as syncSimulationResults };
