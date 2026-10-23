import { describe, it, expect } from "vitest";
import { isTransientError, newQueuedItem, normaliseQueue, isValidUUID, generateUUID } from "./offlineQueue";

/**
 * The classification here decides whether a learner's result is retried or
 * reported as failed. Getting it wrong in the permissive direction is what
 * caused results to be silently lost behind a "saved" message.
 */

describe("isTransientError", () => {
  it("treats RLS denial as PERMANENT (must not be queued)", () => {
    // 42501 = insufficient_privilege — what an RLS rejection looks like.
    expect(isTransientError({ code: "42501", message: "new row violates row-level security policy" }))
      .toBe(false);
  });

  it("treats constraint and data errors as PERMANENT", () => {
    expect(isTransientError({ code: "23505", message: "duplicate key value" })).toBe(false);
    expect(isTransientError({ code: "23514", message: "check constraint violated" })).toBe(false);
    expect(isTransientError({ code: "22P02", message: "invalid input syntax" })).toBe(false);
  });

  it("does NOT allow offline state to override permanent database or client errors", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    // Even when offline, a permanent Postgres error must be classified as permanent
    expect(isTransientError({ code: "42501", message: "insufficient_privilege" })).toBe(false);
    expect(isTransientError({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isTransientError({ status: 400, message: "bad request" })).toBe(false);
    expect(isTransientError({ status: 403, message: "forbidden" })).toBe(false);
    // Restore
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("treats 4xx as PERMANENT", () => {
    expect(isTransientError({ status: 400 })).toBe(false);
    expect(isTransientError({ status: 401 })).toBe(false);
    expect(isTransientError({ status: 403 })).toBe(false);
  });

  it("treats 5xx, 408 and 429 as TRANSIENT", () => {
    expect(isTransientError({ status: 500 })).toBe(true);
    expect(isTransientError({ status: 503 })).toBe(true);
    expect(isTransientError({ status: 408 })).toBe(true);
    expect(isTransientError({ status: 429 })).toBe(true);
  });

  it("treats fetch/network failures as TRANSIENT", () => {
    expect(isTransientError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isTransientError(new Error("NetworkError when attempting to fetch resource"))).toBe(true);
    expect(isTransientError(new Error("The operation timed out"))).toBe(true);
    // PostgREST error shape wrapping a client network error
    expect(isTransientError({ message: "TypeError: Failed to fetch", details: "", hint: "", code: "" })).toBe(true);
    expect(isTransientError({ status: 0, message: "Network request failed" })).toBe(true);
  });

  it("checks statusSibling when provided alongside error object", () => {
    expect(isTransientError({ message: "Server timeout" }, 504)).toBe(true);
    expect(isTransientError({ message: "Gateway error" }, 502)).toBe(true);
    expect(isTransientError({ message: "Invalid payload" }, 400)).toBe(false);
  });

  it("fails CLOSED on an unrecognised error", () => {
    // An unknown failure must surface, not vanish into a queue that will
    // retry it forever.
    expect(isTransientError(new Error("something odd happened"))).toBe(false);
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
  });
});

describe("newQueuedItem and UUID generation", () => {
  it("assigns valid RFC4122 v4 UUIDs to items and payloads without item- fallback", () => {
    const item1 = newQueuedItem({ score: 10 });
    const item2 = newQueuedItem({ score: 20 });
    expect(isValidUUID(item1.id)).toBe(true);
    expect(isValidUUID((item1.payload as unknown as { id: string }).id)).toBe(true);
    expect(isValidUUID(item2.id)).toBe(true);
    expect(item1.id).not.toBe(item2.id);
  });

  it("generateUUID produces valid RFC4122 v4 compliant strings", () => {
    const id = generateUUID();
    expect(isValidUUID(id)).toBe(true);
  });
});

describe("normaliseQueue", () => {
  it("upgrades legacy bare payloads and assigns valid persistent UUIDs", () => {
    const legacy = [{ user_id: "u1", score: 5 }, { user_id: "u1", score: 7 }];
    const queue = normaliseQueue<{ id?: string; user_id: string; score: number }>(legacy);

    expect(queue).toHaveLength(2);
    expect(queue[0].payload.score).toBe(5);
    expect(queue[0].attempts).toBe(0);
    expect(isValidUUID(queue[0].id)).toBe(true);
    expect(isValidUUID(queue[0].payload.id)).toBe(true);
    expect(queue[0].firstQueuedAt).toBeTruthy();
  });

  it("leaves already-wrapped items with valid UUIDs untouched", () => {
    const validUuid = generateUUID();
    const item = newQueuedItem({ id: validUuid, score: 1 });
    item.attempts = 3;
    const queue = normaliseQueue<{ id: string; score: number }>([item]);

    expect(queue[0].attempts).toBe(3);
    expect(queue[0].id).toBe(validUuid);
    expect(queue[0].payload.id).toBe(validUuid);
  });

  it("returns an empty queue for missing or malformed storage", () => {
    expect(normaliseQueue(undefined)).toEqual([]);
    expect(normaliseQueue(null)).toEqual([]);
    expect(normaliseQueue("nonsense")).toEqual([]);
  });
});
