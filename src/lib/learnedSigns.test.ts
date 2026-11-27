import { beforeEach, describe, expect, it } from "vitest";
import { LEARNED_STORAGE_KEY, learnedKeyFor, readLearned } from "./learnedSigns";

beforeEach(() => localStorage.clear());

describe("learnt signs per learner", () => {
  it("gives the older shared record to the first learner only", () => {
    localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify({ "warn-crossroads": true }));
    expect(readLearned("alice")).toEqual({ "warn-crossroads": true });
    expect(localStorage.getItem(LEARNED_STORAGE_KEY)).toBeNull();
    expect(readLearned("bob")).toEqual({});
    expect(readLearned("alice")).toEqual({ "warn-crossroads": true });
  });

  it("keeps each learner's own record apart", () => {
    localStorage.setItem(learnedKeyFor("alice"), JSON.stringify({ a: true }));
    localStorage.setItem(learnedKeyFor("bob"), JSON.stringify({ b: true }));
    expect(readLearned("alice")).toEqual({ a: true });
    expect(readLearned("bob")).toEqual({ b: true });
  });

  it("ignores damaged or odd data", () => {
    localStorage.setItem(learnedKeyFor("alice"), "{not json");
    expect(readLearned("alice")).toEqual({});
    localStorage.setItem(learnedKeyFor("alice"), JSON.stringify(["x"]));
    expect(readLearned("alice")).toEqual({});
    localStorage.setItem(learnedKeyFor("alice"), JSON.stringify({ a: true, b: "yes", c: 1 }));
    expect(readLearned("alice")).toEqual({ a: true });
  });
});
