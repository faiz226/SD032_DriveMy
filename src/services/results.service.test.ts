import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveQuizResult,
  syncOfflineResults,
  clearUserResultsQueue,
  getUserPendingStatus,
  getUserDeadLetterItems,
  retryUserDeadLetterItem,
  _resetDeletionTracking,
  _resetDefaultStore,
  OFFLINE_QUEUED_ID,
} from "./results.service";
import { newQueuedItem, isValidUUID, generateUUID } from "./offlineQueue";
import { useAuthStore } from "@/stores/authStore";

// In-memory mock store for idb-keyval replicating atomic IndexedDB transaction semantics
const memoryDb = new Map<string, unknown>();
const dbQueues = new Map<string, Promise<unknown>>();

let dbTxQueue = Promise.resolve();

/**
 * Build a mock IDBObjectStore-shaped object that reads/writes memoryDb.
 * Exposes get(key) and put(value, key) returning IDBRequest-shaped objects
 * so that atomicQueueUpdateIfNotDeleted can use its callback-based pattern.
 */
function makeMockStore(onCommit?: () => void) {
  function makeRequest<T>(value: T) {
    const req: {
      result: T;
      error: DOMException | null;
      onsuccess: (() => void) | null;
      onerror: (() => void) | null;
    } = {
      result: value,
      error: null,
      onsuccess: null,
      onerror: null,
    };
    Promise.resolve().then(() => req.onsuccess?.());
    return req;
  }

  const txReq = {
    result: undefined,
    error: null as DOMException | null,
    oncomplete: null as (() => void) | null,
    onabort: null as (() => void) | null,
  };

  const store = {
    get: (key: string) => {
      const snapshot = memoryDb.has(key) ? structuredClone(memoryDb.get(key)) : undefined;
      return makeRequest(snapshot);
    },
    put: (value: unknown, key: string) => {
      memoryDb.set(key, structuredClone(value));
      Promise.resolve().then(() => {
        onCommit?.();
        txReq.oncomplete?.();
      });
      return makeRequest(undefined);
    },
    transaction: txReq as unknown as IDBTransaction,
  };

  return { store };
}

vi.mock("idb-keyval", () => {
  const promisifyRequest = vi.fn(<T>(reqOrTx: unknown): Promise<T> => {
    if (!reqOrTx) return Promise.resolve(undefined as T);
    if (reqOrTx instanceof Promise) return reqOrTx as Promise<T>;
    const req = reqOrTx as { oncomplete?: () => void; onsuccess?: () => void; result?: T; error?: unknown };
    return new Promise<T>((resolve, reject) => {
      req.oncomplete = () => resolve(req.result as T);
      req.onsuccess = () => resolve(req.result as T);
      if (req.error) reject(req.error);
    });
  });

  const createStore = vi.fn((_dbName: string, _storeName: string) => {
    return vi.fn((_txMode: string, callback: (store: unknown) => unknown) => {
      // Serialize readwrite transactions serially just like real IndexedDB
      const runTx = async () => {
        let commitResolve: () => void;
        const commitPromise = new Promise<void>((r) => { commitResolve = r; });
        const { store } = makeMockStore(() => commitResolve());
        const res = await callback(store);
        // Wait for put commit microtask if put was called
        await Promise.race([commitPromise, Promise.resolve()]);
        return res;
      };
      const current = dbTxQueue.then(runTx, runTx);
      dbTxQueue = current.then(() => {}, () => {});
      return current;
    });
  });

  return {
    get: vi.fn(async (key: string) => {
      const val = memoryDb.get(key);
      return val ? structuredClone(val) : undefined;
    }),
    set: vi.fn(async (key: string, val: unknown) => {
      memoryDb.set(key, structuredClone(val));
    }),
    update: vi.fn(async (key: string, updater: (val: unknown) => unknown) => {
      const prev = dbQueues.get(key) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      dbQueues.set(key, current);

      await prev;
      try {
        const existing = memoryDb.get(key);
        const updated = await updater(existing ? structuredClone(existing) : undefined);
        memoryDb.set(key, structuredClone(updated));
        return updated;
      } finally {
        release();
        if (dbQueues.get(key) === current) {
          dbQueues.delete(key);
        }
      }
    }),
    createStore,
    promisifyRequest,
  };
});

const { mockInsert, mockSelect, mockRpc, mockGetSession } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockSelect: vi.fn(),
  mockRpc: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: () => ({
        eq: () => ({
          maybeSingle: mockSelect,
        }),
      }),
    })),
    auth: {
      getSession: mockGetSession,
    },
    rpc: mockRpc,
  },
}));

describe("results.service (W01 rework remediation)", () => {
  beforeEach(() => {
    memoryDb.clear();
    dbQueues.clear();
    dbTxQueue = Promise.resolve();
    _resetDeletionTracking();
    _resetDefaultStore();
    mockInsert.mockReset();
    mockSelect.mockReset();
    mockRpc.mockReset();
    mockGetSession.mockReset();
    mockSelect.mockResolvedValue({ data: null, error: null });
    useAuthStore.setState({
      user: { id: "user-alice" } as never,
      isAuthenticated: true,
    });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true, writable: true });
  });

  describe("BUG-002: Concurrent offline saves and UUID persistence", () => {
    it("retains both rows across concurrent offline saves with valid RFC4122 UUIDs", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

      await Promise.all([
        saveQuizResult({ user_id: "user-alice", score: 10 } as never),
        saveQuizResult({ user_id: "user-alice", score: 20 } as never),
      ]);

      const rawQueue = memoryDb.get("quizQueue") as Array<{ payload: { score: number; id: string } }>;
      expect(rawQueue).toBeDefined();
      expect(rawQueue).toHaveLength(2);
      expect(rawQueue.map((item) => item.payload.score).sort()).toEqual([10, 20]);
      // Both entries should have valid RFC4122 v4 UUIDs
      expect(isValidUUID(rawQueue[0].payload.id)).toBe(true);
      expect(isValidUUID(rawQueue[1].payload.id)).toBe(true);
      expect(rawQueue[0].payload.id).not.toBe(rawQueue[1].payload.id);
    });

    it("assigns stable UUID and returns OFFLINE_QUEUED_ID on transient server failure", async () => {
      mockInsert.mockReturnValue({
        select: () => ({
          single: async () => ({
            data: null,
            error: { message: "TypeError: Failed to fetch", code: "" },
            status: 0,
          }),
        }),
      });

      const res = (await saveQuizResult({ user_id: "user-alice", score: 85 } as never)) as { id: string };
      expect(res.id).toBe(OFFLINE_QUEUED_ID);

      const queue = memoryDb.get("quizQueue") as Array<{ payload: { score: number; id: string } }>;
      expect(queue).toHaveLength(1);
      expect(queue[0].payload.score).toBe(85);
      expect(isValidUUID(queue[0].payload.id)).toBe(true);
    });

    it("throws and does not queue when encountering permanent failure", async () => {
      mockInsert.mockReturnValue({
        select: () => ({
          single: async () => ({
            data: null,
            error: { code: "42501", message: "new row violates row-level security policy" },
            status: 403,
          }),
        }),
      });

      await expect(
        saveQuizResult({ user_id: "user-alice", score: 99 } as never)
      ).rejects.toMatchObject({ code: "42501" });

      const queue = memoryDb.get("quizQueue");
      expect(queue).toBeUndefined();
    });

    it("migrates bare legacy entries in storage before network I/O", async () => {
      let insertedPayload: { id?: string; score?: number } | null = null;
      mockInsert.mockImplementation(async (payload) => {
        insertedPayload = payload;
        return { error: null };
      });

      // Legacy bare payload without wrapper or id
      memoryDb.set("quizQueue", [{ user_id: "user-alice", score: 42 }]);

      await syncOfflineResults("user-alice");

      expect(insertedPayload).toBeTruthy();
      expect(isValidUUID(insertedPayload!.id)).toBe(true);
      // Queue is cleared because the migrated ID was acknowledged
      const queue = memoryDb.get("quizQueue") as unknown[];
      expect(queue).toHaveLength(0);
    });
  });

  describe("BUG-001: syncOfflineResults coordination and multi-user isolation", () => {
    it("does not insert duplicate rows during overlapping sync calls", async () => {
      let insertCalls = 0;
      mockInsert.mockImplementation(async () => {
        insertCalls++;
        return { error: null };
      });

      const uuid = generateUUID();
      const item = newQueuedItem({ id: uuid, user_id: "user-alice", score: 50 });
      memoryDb.set("quizQueue", [item]);

      await Promise.all([syncOfflineResults("user-alice"), syncOfflineResults("user-alice")]);

      expect(insertCalls).toBe(1);
      const remainingQueue = memoryDb.get("quizQueue") as unknown[];
      expect(remainingQueue).toHaveLength(0);
    });

    it("preserves other accounts pending rows untouched without dead-lettering", async () => {
      mockInsert.mockResolvedValue({ error: null });

      const aliceItem = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 90 });
      const bobItem = newQueuedItem({ id: generateUUID(), user_id: "user-bob", score: 75 });
      memoryDb.set("quizQueue", [aliceItem, bobItem]);

      await syncOfflineResults("user-alice");

      const remainingQueue = memoryDb.get("quizQueue") as Array<{ payload: { user_id: string } }>;
      expect(remainingQueue).toHaveLength(1);
      expect(remainingQueue[0].payload.user_id).toBe("user-bob");

      const deadQueue = memoryDb.get("quizQueue:dead");
      expect(deadQueue).toBeUndefined();
    });

    it("protects remaining items in active queue when user switches mid-replay", async () => {
      let calls = 0;
      mockInsert.mockImplementation(async () => {
        calls++;
        if (calls === 1) {
          // Mid-replay account switch to Bob
          useAuthStore.setState({ user: { id: "user-bob" } as never });
          return { error: null };
        }
        return { error: { code: "42501", message: "RLS violation" }, status: 403 };
      });

      const alice1 = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 10 });
      const alice2 = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 20 });
      memoryDb.set("quizQueue", [alice1, alice2]);

      await syncOfflineResults();

      // First item succeeded and cleared; second item aborted before insert and remains in active queue
      expect(calls).toBe(1);
      const remaining = memoryDb.get("quizQueue") as Array<{ payload: { id: string } }>;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].payload.id).toBe(alice2.payload.id);

      // Dead letter queue must NOT have received Alice's second row
      const deadQueue = memoryDb.get("quizQueue:dead");
      expect(deadQueue).toBeUndefined();
    });

    it("acknowledges 23505 unique violation only when server confirms matching result ID", async () => {
      const matchUuid = generateUUID();
      mockInsert.mockResolvedValue({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });
      // Server select confirms row with this ID exists
      mockSelect.mockResolvedValue({ data: { id: matchUuid }, error: null });

      const item = newQueuedItem({ id: matchUuid, user_id: "user-alice", score: 100 });
      memoryDb.set("quizQueue", [item]);

      await syncOfflineResults("user-alice");

      // Acknowledged and removed
      expect(memoryDb.get("quizQueue")).toEqual([]);
      expect(memoryDb.get("quizQueue:dead")).toBeUndefined();
    });

    it("dead-letters 23505 unique violation when server row does not match result ID", async () => {
      const unmatchUuid = generateUUID();
      mockInsert.mockResolvedValue({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });
      // Server row not found or different constraint collision
      mockSelect.mockResolvedValue({ data: null, error: null });

      const item = newQueuedItem({ id: unmatchUuid, user_id: "user-alice", score: 100 });
      memoryDb.set("quizQueue", [item]);

      await syncOfflineResults("user-alice");

      // Moved to dead-letter queue
      expect(memoryDb.get("quizQueue")).toEqual([]);
      const dead = memoryDb.get("quizQueue:dead") as Array<{ payload: { id: string } }>;
      expect(dead).toHaveLength(1);
      expect(dead[0].payload.id).toBe(unmatchUuid);
    });

    it("retains pending item in active queue when 23505 verification query suffers transient error", async () => {
      const itemUuid = generateUUID();
      mockInsert.mockResolvedValue({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });
      // Verification query fails transiently with network fetch error
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: "Failed to fetch", code: "" },
        status: 0,
      });

      const item = newQueuedItem({ id: itemUuid, user_id: "user-alice", score: 85 });
      memoryDb.set("quizQueue", [item]);

      await syncOfflineResults("user-alice");

      // Item must be retained in active queue for retry; must NOT be dead-lettered!
      const active = memoryDb.get("quizQueue") as Array<{ attempts: number; payload: { id: string } }>;
      expect(active).toHaveLength(1);
      expect(active[0].payload.id).toBe(itemUuid);
      expect(active[0].attempts).toBe(1);

      expect(memoryDb.get("quizQueue:dead")).toBeUndefined();
    });

    it("preserves concurrent append during active replay", async () => {
      let insertStarted = false;
      let resolveInsert!: (val: unknown) => void;
      const pendingInsert = new Promise((resolve) => { resolveInsert = resolve; });

      mockInsert.mockImplementationOnce(async () => {
        insertStarted = true;
        await pendingInsert;
        return { data: { id: "res-1" }, error: null };
      });

      const item1 = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 10 });
      memoryDb.set("quizQueue", [item1]);

      const replayPromise = syncOfflineResults("user-alice");
      // Wait for replay loop to begin insert
      await new Promise((r) => setTimeout(r, 10));
      expect(insertStarted).toBe(true);

      // Concurrent append happens while item 1 is in-flight
      const item2 = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 20 });
      const raw = memoryDb.get("quizQueue") as unknown[];
      raw.push(item2);
      memoryDb.set("quizQueue", structuredClone(raw));

      resolveInsert({ error: null });
      await replayPromise;

      // Item 1 was acknowledged; Item 2 is preserved in queue
      const remaining = memoryDb.get("quizQueue") as Array<{ payload: { id: string } }>;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].payload.id).toBe(item2.payload.id);
    });
  });

  describe("BUG-007: Account deletion targeted queue cleanup & race coordination", () => {
    it("clears only the deleted user rows from active and dead-letter queues", async () => {
      const aliceLive = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 1 });
      const bobLive = newQueuedItem({ id: generateUUID(), user_id: "user-bob", score: 2 });
      const aliceDead = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 3 });
      const bobDead = newQueuedItem({ id: generateUUID(), user_id: "user-bob", score: 4 });

      memoryDb.set("quizQueue", [aliceLive, bobLive]);
      memoryDb.set("quizQueue:dead", [aliceDead, bobDead]);

      await clearUserResultsQueue("user-alice");

      const remainingLive = memoryDb.get("quizQueue") as Array<{ payload: { user_id: string } }>;
      const remainingDead = memoryDb.get("quizQueue:dead") as Array<{ payload: { user_id: string } }>;

      expect(remainingLive).toHaveLength(1);
      expect(remainingLive[0].payload.user_id).toBe("user-bob");

      expect(remainingDead).toHaveLength(1);
      expect(remainingDead[0].payload.user_id).toBe("user-bob");
    });

    it("delayed replay response after deletion cleanup does NOT recreate dead letters", async () => {
      let releaseInsert!: (val: unknown) => void;
      const pendingInsert = new Promise((resolve) => { releaseInsert = resolve; });

      mockInsert.mockImplementationOnce(() => pendingInsert);

      const aliceItem = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 99 });
      memoryDb.set("quizQueue", [aliceItem]);

      const replayPromise = syncOfflineResults("user-alice");
      await new Promise((r) => setTimeout(r, 10));

      // Account deletion cleanup runs while insert is in-flight
      await clearUserResultsQueue("user-alice");

      // In-flight insert now finishes with 42501
      releaseInsert({ error: { code: "42501", message: "Account deleted / permission denied" }, status: 403 });
      await replayPromise;

      // No dead letter should have been created for deleted user
      const deadQueue = (memoryDb.get("quizQueue:dead") as unknown[] | undefined) || [];
      expect(deadQueue).toEqual([]);
      const aliceDead = await getUserDeadLetterItems("user-alice");
      expect(aliceDead).toEqual([]);
    });
  });

  describe("Account-scoped status and recovery API", () => {
    it("returns pending and dead-letter counts scoped strictly to authenticated user", async () => {
      const aliceLive = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 1 });
      const aliceDead = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 2 });
      const bobDead = newQueuedItem({ id: generateUUID(), user_id: "user-bob", score: 3 });

      memoryDb.set("quizQueue", [aliceLive]);
      memoryDb.set("quizQueue:dead", [aliceDead, bobDead]);

      const status = await getUserPendingStatus("user-alice");
      expect(status).toEqual({ pendingCount: 1, deadLetterCount: 1 });

      // Cross-account query rejected
      const bobStatus = await getUserPendingStatus("user-bob");
      expect(bobStatus).toEqual({ pendingCount: 0, deadLetterCount: 0 });

      const deadItems = await getUserDeadLetterItems("user-alice");
      expect(deadItems).toHaveLength(1);
      expect(deadItems[0].payload.id).toBe(aliceDead.payload.id);

      // Cross-account retrieval rejected
      const bobDeadItems = await getUserDeadLetterItems("user-bob");
      expect(bobDeadItems).toHaveLength(0);
    });

    it("persists normalized legacy IDs before returning retry handles", async () => {
      // Legacy bare item without wrapper or payload UUID
      const legacyItem = { user_id: "user-alice", score: 55 };
      memoryDb.set("quizQueue:dead", [legacyItem]);

      const deadItems = await getUserDeadLetterItems("user-alice");
      expect(deadItems).toHaveLength(1);
      expect(isValidUUID(deadItems[0].id)).toBe(true);
      expect(isValidUUID(deadItems[0].payload.id)).toBe(true);

      // In storage, it must now be durably persisted with UUIDs
      const stored = memoryDb.get("quizQueue:dead") as Array<{ id: string; payload: { id: string } }>;
      expect(isValidUUID(stored[0].id)).toBe(true);
      expect(isValidUUID(stored[0].payload.id)).toBe(true);
    });

    it("retries a dead-letter item failure-safely: preserves dead letter if active queue append throws", async () => {
      const deadId = generateUUID();
      const aliceDead = newQueuedItem({ id: deadId, user_id: "user-alice", score: 70 });
      memoryDb.set("quizQueue:dead", [aliceDead]);

      const { createStore } = await import("idb-keyval");
      const realCreateStore = vi.mocked(createStore).getMockImplementation()!;

      vi.mocked(createStore).mockImplementationOnce((() => {
        return vi.fn(async (_txMode, _cb) => {
          throw new Error("Active queue disk write failure");
        });
      }) as never);

      try {
        await expect(retryUserDeadLetterItem("quiz_results", deadId, "user-alice")).rejects.toThrow(
          "Active queue disk write failure"
        );

        // Dead letter MUST NOT be lost!
        const deadQueue = memoryDb.get("quizQueue:dead") as Array<{ id: string }>;
        expect(deadQueue).toHaveLength(1);
        expect(deadQueue[0].id).toBe(deadId);
      } finally {
        vi.mocked(createStore).mockImplementation(realCreateStore);
      }
    });

    it("retries a dead-letter item by moving it back to the active queue with reset attempts on success", async () => {
      const deadId = generateUUID();
      const aliceDead = newQueuedItem({ id: deadId, user_id: "user-alice", score: 70 });
      aliceDead.attempts = 5;
      memoryDb.set("quizQueue:dead", [aliceDead]);

      const retried = await retryUserDeadLetterItem("quiz_results", deadId, "user-alice");
      expect(retried).toBe(true);

      const remainingDead = memoryDb.get("quizQueue:dead") as unknown[];
      expect(remainingDead).toHaveLength(0);

      const active = memoryDb.get("quizQueue") as Array<{ attempts: number; payload: { id: string } }>;
      expect(active).toHaveLength(1);
      expect(active[0].payload.id).toBe(deadId);
      expect(active[0].attempts).toBe(0);
    });

    it("preserves concurrent additions during legacy dead-letter normalization and does not overwrite with stale snapshot", async () => {
      // Alice has a legacy bare item
      memoryDb.set("quizQueue:dead", [{ user_id: "user-alice", score: 2 }]);
      const bobItem = newQueuedItem({ user_id: "user-bob", score: 3 });

      const { update } = await import("idb-keyval");
      const realUpdate = vi.mocked(update).getMockImplementation();

      let bobInserted = false;
      vi.mocked(update).mockImplementation(async (key: IDBValidKey, updater: (v: unknown) => unknown) => {
        if (key === "quizQueue:dead" && !bobInserted) {
          bobInserted = true;
          // Simulate Bob concurrently appending a dead letter while Alice's normalization transaction is running
          const current = (memoryDb.get("quizQueue:dead") as unknown[]) || [];
          memoryDb.set("quizQueue:dead", [...current, bobItem]);
        }
        return realUpdate!(key, updater);
      });

      const aliceItems = await getUserDeadLetterItems("user-alice");
      expect(aliceItems).toHaveLength(1);
      expect(aliceItems[0].payload.user_id).toBe("user-alice");

      // Verify Bob's item was NOT lost from storage!
      const deadQueue = memoryDb.get("quizQueue:dead") as Array<{ payload?: { user_id?: string } }>;
      expect(deadQueue).toHaveLength(2);
      expect(deadQueue.some((item) => item.payload?.user_id === "user-bob")).toBe(true);

      vi.mocked(update).mockImplementation(realUpdate!);
    });

    it("rejects retryUserDeadLetterItem for deleted account", async () => {
      // Mark user-alice as deleted in durable storage
      const { markUserDeleted } = await import("./results.service");
      await markUserDeleted("user-alice");

      await expect(retryUserDeadLetterItem("quiz_results", generateUUID(), "user-alice")).rejects.toThrow(
        "Cannot retry item for deleted account"
      );
    });

    it("deletion occurring between final shared tombstone read and queue mutation: no deleted-user row survives; other users survive", async () => {
      const { clearUserResultsQueue } = await import("./results.service");
      const { get } = await import("idb-keyval");
      const realGet = vi.mocked(get).getMockImplementation()!;

      // Alice and Bob both have rows in the system
      const aliceItem = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 80 });
      const bobDead = newQueuedItem({ id: generateUUID(), user_id: "user-bob", score: 90 });
      memoryDb.set("quizQueue", [aliceItem]);
      memoryDb.set("quizQueue:dead", [bobDead]);

      mockInsert.mockResolvedValueOnce({
        error: { code: "42501", message: "row-level security violation" },
        status: 403,
      });

      let pausedResolve: (() => void) | null = null;
      const pausedPromise = new Promise<void>((r) => { pausedResolve = r; });
      let tombstoneReadCount = 0;

      // Simulate a context pausing on the tombstone read right before writing dead letter
      vi.mocked(get).mockImplementation(async (key: IDBValidKey) => {
        const val = await realGet(key);
        if (key === "drivemy_deleted_users" && ++tombstoneReadCount === 3) {
          // Pause Alice's read before tombstone is present
          await pausedPromise;
        }
        return val;
      });

      // Background sync attempts to replay Alice's item, fails permanently with 42501, and moves to dead letter
      const syncPromise = syncOfflineResults("user-alice");

      // While paused on dead-letter tombstone read, Alice's account is deleted and queues purged in another context
      await clearUserResultsQueue("user-alice");

      // Resume Alice's delayed tombstone read
      pausedResolve!();
      await syncPromise;

      // Alice's row MUST NOT reappear in dead letter queue!
      const deadQueue = (memoryDb.get("quizQueue:dead") as Array<{ payload?: { user_id?: string } }>) || [];
      expect(deadQueue.some((item) => item.payload?.user_id === "user-alice")).toBe(false);

      // Bob's row MUST survive untouched!
      expect(deadQueue.some((item) => item.payload?.user_id === "user-bob")).toBe(true);

      vi.mocked(get).mockImplementation(realGet);
    });

    it("atomic transaction: tombstone present at transaction read time prevents any write; no deleted-user row is committed even without post-write cleanup", async () => {
      const { markUserDeleted } = await import("./results.service");

      // Pre-mark alice as deleted so tombstone is present in memoryDb
      await markUserDeleted("user-alice");

      // Bob has a concurrent pending append that must survive
      const bobItem = newQueuedItem({ id: generateUUID(), user_id: "user-bob", score: 77 });
      memoryDb.set("quizQueue:dead", [bobItem]);

      // Attempt to dead-letter Alice's item using atomicQueueUpdateIfNotDeleted
      const aliceItem = newQueuedItem({ id: generateUUID(), user_id: "user-alice", score: 55 });
      mockInsert.mockResolvedValueOnce({
        error: { code: "42501", message: "rls violation" },
        status: 403,
      });
      memoryDb.set("quizQueue", [aliceItem]);
      await syncOfflineResults("user-alice");

      // Alice must NOT appear in dead letter queue — the atomic transaction read the tombstone
      // and returned false without putting anything.
      const deadQueue = (memoryDb.get("quizQueue:dead") as Array<{ payload?: { user_id?: string } }>) || [];
      expect(deadQueue.filter((item) => item.payload?.user_id === "user-alice")).toHaveLength(0);

      // Bob's row must still be present
      expect(deadQueue.some((item) => item.payload?.user_id === "user-bob")).toBe(true);
    });

    it("IDB transaction failure aborts all guarded mutations atomically; other user's concurrent append is preserved", async () => {
      const { createStore } = await import("idb-keyval");
      const realCreateStore = vi.mocked(createStore).getMockImplementation()!;

      // Bob has an existing item in the active queue
      const bobExisting = newQueuedItem({ id: generateUUID(), user_id: "user-bob", score: 22 });
      memoryDb.set("quizQueue", [bobExisting]);

      // Reset cached default store so mock createStore is called
      _resetDefaultStore();

      // Make the createStore-backed transaction throw on commit (simulates QuotaExceededError)
      vi.mocked(createStore).mockImplementation((() => {
        return vi.fn(async (_txMode: string, _callback: (store: unknown) => unknown) => {
          // Simulate a transaction that rejects (IDB quota or abort)
          throw new Error("IDB transaction aborted: QuotaExceededError");
        });
      }) as never);

      try {
        // Attempt to enqueue alice's item offline — should throw because the IDB transaction failed
        Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
        await expect(
          saveQuizResult({ user_id: "user-alice", score: 88 } as never)
        ).rejects.toThrow("IDB transaction aborted");

        // Bob's concurrent item MUST still be present — transaction failure must not corrupt other users' data
        const activeQueue = memoryDb.get("quizQueue") as Array<{ payload?: { user_id?: string } }>;
        expect(activeQueue.some((item) => item.payload?.user_id === "user-bob")).toBe(true);
        // Alice's item must NOT be in active queue (write was aborted)
        expect((activeQueue || []).some((item) => item.payload?.user_id === "user-alice")).toBe(false);
      } finally {
        Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
        _resetDefaultStore();
        vi.mocked(createStore).mockImplementation(realCreateStore);
      }
    });

    it("tombstone storage failure after successful remote RPC reports incomplete durable cleanup; other contexts do not proceed as readable", async () => {
      const { isUserDeleted } = await import("./results.service");
      const { deleteAccount, AccountCleanupError } = await import("./account.service");
      const { update, get } = await import("idb-keyval");
      const realUpdate = vi.mocked(update).getMockImplementation()!;
      const realGet = vi.mocked(get).getMockImplementation()!;

      // Mock remote delete RPC to succeed
      mockGetSession.mockResolvedValueOnce({
        data: { session: { user: { id: "user-alice" } } },
      });
      mockRpc.mockResolvedValueOnce({ error: null });

      // Simulate tombstone storage failure
      vi.mocked(update).mockImplementation(async (key: IDBValidKey, updater: (v: unknown) => unknown) => {
        if (key === "drivemy_deleted_users") {
          throw new Error("QuotaExceededError / IDB transaction error");
        }
        return realUpdate(key, updater);
      });

      // deleteAccount must report AccountCleanupError rather than full success
      await expect(deleteAccount()).rejects.toThrow(AccountCleanupError);

      // If durable storage read fails, isUserDeleted must throw rather than silently returning false
      vi.mocked(get).mockImplementation(async (key: IDBValidKey) => {
        if (key === "drivemy_deleted_users") {
          throw new Error("IDB read failure");
        }
        return realGet(key);
      });

      await expect(isUserDeleted("user-alice")).rejects.toThrow("IDB read failure");

      vi.mocked(update).mockImplementation(realUpdate);
      vi.mocked(get).mockImplementation(realGet);
    });
  });
});
