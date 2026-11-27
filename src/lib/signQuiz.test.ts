import { describe, expect, it } from "vitest";
import { categoryProgress, pickOptions, pickRound, poolOf, recordAnswer, roundSize } from "./signQuiz";
import { roadSigns } from "@/content/theory";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `s${i}`);

describe("mini quiz rounds", () => {
  it("keeps a round to about 8 to 12 questions", () => {
    for (const size of [10, 13, 14]) expect(roundSize(size)).toBe(size);
    for (const size of [15, 19, 24, 25, 30, 36, 50]) {
      const round = roundSize(size);
      expect(round, `pool ${size}`).toBeGreaterThanOrEqual(8);
      expect(round, `pool ${size}`).toBeLessThanOrEqual(12);
    }
  });

  it("takes each question once, only from the pool", () => {
    const pool = ids(24);
    const round = pickRound(pool);
    expect(round).toHaveLength(12);
    expect(new Set(round).size).toBe(12);
    expect(round.every((id) => pool.includes(id))).toBe(true);
  });
});

describe("what is learnt", () => {
  it("a right answer leaves the pool, a wrong one stays in it", () => {
    let learnt = {};
    learnt = recordAnswer(learnt, "s1", true);
    learnt = recordAnswer(learnt, "s2", false);
    expect(poolOf(ids(4), learnt)).toEqual(["s0", "s2", "s3"]);
  });

  it("a wrong answer comes back next round, and the category is learnt when its pool is empty", () => {
    const all = ids(3);
    let learnt = {};
    learnt = recordAnswer(learnt, "s0", true);
    learnt = recordAnswer(learnt, "s1", false);
    learnt = recordAnswer(learnt, "s2", true);
    expect(pickRound(poolOf(all, learnt))).toEqual(["s1"]);
    expect(categoryProgress(all, learnt)).toEqual({ total: 3, learnt: 2, left: 1, done: false });
    learnt = recordAnswer(learnt, "s1", true);
    expect(poolOf(all, learnt)).toEqual([]);
    expect(categoryProgress(all, learnt)).toEqual({ total: 3, learnt: 3, left: 0, done: true });
  });

  it("an answer for an already learnt sign changes nothing", () => {
    const learnt = { s0: true };
    expect(recordAnswer(learnt, "s0", true)).toBe(learnt);
    expect(recordAnswer(learnt, "s0", false)).toBe(learnt);
  });
});

describe("answer pictures", () => {
  it("offers the right sign and three different others, preferring the same category", () => {
    const options = pickOptions("s0", ["s0", "s1", "s2", "s3", "s4"], ids(20));
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain("s0");
    expect(options.every((id) => ["s0", "s1", "s2", "s3", "s4"].includes(id))).toBe(true);
  });

  it("fills from other categories when its own is too small", () => {
    const options = pickOptions("s0", ["s0", "s1"], ids(20));
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
  });
});

describe("the sign set", () => {
  it("has many temporary signs, each with English and Malay text, an official sign file and what to do", () => {
    const temporary = roadSigns.filter((sign) => sign.type === "temporary");
    expect(temporary.length).toBeGreaterThanOrEqual(12);
    for (const sign of temporary) {
      expect(sign.name && sign.nameMs && sign.action && sign.actionMs, sign.id).toBeTruthy();
      expect(sign.img).toMatch(/^\/signs\/.+\.svg$/);
    }
    expect(new Set(roadSigns.map((sign) => sign.id)).size).toBe(roadSigns.length);
  });
});
