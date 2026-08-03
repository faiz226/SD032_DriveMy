import { describe, it, expect } from "vitest";
import { isTransientError, newQueuedItem, normaliseQueue } from "./offlineQueue";

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
  });

  it("fails CLOSED on an unrecognised error", () => {
    // An unknown failure must surface, not vanish into a queue that will
    // retry it forever.
    expect(isTransientError(new Error("something odd happened"))).toBe(false);
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
  });
});

describe("normaliseQueue", () => {
  it("upgrades legacy bare payloads written by the previous version", () => {
    const legacy = [{ user_id: "u1", score: 5 }, { user_id: "u1", score: 7 }];
    const queue = normaliseQueue<{ user_id: string; score: number }>(legacy);

    expect(queue).toHaveLength(2);
    expect(queue[0].payload).toEqual({ user_id: "u1", score: 5 });
    expect(queue[0].attempts).toBe(0);
    expect(queue[0].firstQueuedAt).toBeTruthy();
  });

  it("leaves already-wrapped items untouched", () => {
    const item = newQueuedItem({ score: 1 });
    item.attempts = 3;
    const queue = normaliseQueue<{ score: number }>([item]);

    expect(queue[0].attempts).toBe(3);
    expect(queue[0].payload).toEqual({ score: 1 });
  });

  it("returns an empty queue for missing or malformed storage", () => {
    expect(normaliseQueue(undefined)).toEqual([]);
    expect(normaliseQueue(null)).toEqual([]);
    expect(normaliseQueue("nonsense")).toEqual([]);
  });
});
