import { describe, it, expect } from "vitest";
import type { KppQuestion } from "@/types/database";
// @ts-expect-error JS seed file lacks TypeScript declarations
import { KPP_TEXTBOOK_QUESTIONS as RAW_QUESTIONS } from "../../scripts/questions-kpp-textbook.js";

const QUESTIONS = RAW_QUESTIONS as KppQuestion[];
const LANGUAGES = ["en", "ms"] as const;

function lengths(question: KppQuestion, lang: (typeof LANGUAGES)[number]) {
  const options = lang === "en" ? question.options_en : question.options_ms;
  return options.map((option) => option.length);
}

describe("answer length gives nothing away", () => {
  it.each(LANGUAGES)("never makes the correct option clearly the longest (%s)", (lang) => {
    const clear = QUESTIONS.filter((question) => {
      const all = lengths(question, lang);
      const correct = all[question.correct_index]!;
      const others = all.filter((_, index) => index !== question.correct_index);
      const longestOther = Math.max(...others);
      const meanOther = others.reduce((sum, value) => sum + value, 0) / others.length;
      return correct > longestOther && (correct / meanOther >= 1.25 || correct >= 1.2 * longestOther);
    });
    expect(clear.map((question) => question.id)).toEqual([]);
  });

  it.each(LANGUAGES)("scores no better than chance for a learner who always picks the longest option (%s)", (lang) => {
    // A tie counts for 1 / (number tied), which is what picking among the longest at random would earn.
    const expected = QUESTIONS.reduce((sum, question) => {
      const all = lengths(question, lang);
      const longest = Math.max(...all);
      const tied = all.filter((value) => value === longest).length;
      return sum + (all[question.correct_index] === longest ? 1 / tied : 0);
    }, 0);
    expect(expected / QUESTIONS.length).toBeLessThanOrEqual(0.25);
  });
});
