import { describe, expect, it } from "vitest";
import { EMERGENCIES } from "./road-safety";

const LANGUAGES = ["en", "ms"] as const;

/** Option lengths for one question, the KPP answer first. */
const lengths = (options: (typeof EMERGENCIES)[number]["options"], lang: (typeof LANGUAGES)[number]) => options.map(option => option[lang].length);

describe("road safety answers give nothing away", () => {
  it.each(LANGUAGES)("never makes the KPP answer clearly the longest (%s)", lang => {
    const clear = EMERGENCIES.filter(({ options }) => {
      const [correct, ...others] = lengths(options, lang);
      const longestOther = Math.max(...others);
      const meanOther = others.reduce((sum, value) => sum + value, 0) / others.length;
      return correct > longestOther && (correct / meanOther >= 1.25 || correct >= 1.2 * longestOther);
    });
    expect(clear.map(item => item.id)).toEqual([]);
  });

  it.each(LANGUAGES)("scores no better than chance for someone who always picks the longest option (%s)", lang => {
    const expected = EMERGENCIES.reduce((sum, { options }) => {
      const all = lengths(options, lang);
      const longest = Math.max(...all);
      const tied = all.filter(value => value === longest).length;
      return sum + (all[0] === longest ? 1 / tied : 0);
    }, 0);
    expect(expected / EMERGENCIES.length).toBeLessThanOrEqual(1 / 3);
  });

  it("gives every wrong option the same shape as the right one: an action, not a one-word dismissal", () => {
    for (const { options } of EMERGENCIES)
      for (const option of options) for (const lang of LANGUAGES) expect(option[lang].split(/\s+/).length).toBeGreaterThanOrEqual(8);
  });

  it("does not let a wrong option stand out by being absurd: none promises to be faster or sooner as its reason", () => {
    for (const { options } of EMERGENCIES) expect(options.map(option => option.en).join(" ")).not.toMatch(/\b(get home sooner|reach .* sooner)\b/i);
  });
});
