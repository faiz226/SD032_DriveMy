import { describe, it, expect } from "vitest";
import { shuffleQuestionOptions, toStorageAnswers } from "./examScoring";
import type { KppQuestion } from "@/types/database";

/**
 * Regression tests for the option-shuffle / server-regrade contract.
 *
 * The bug these guard against: ExamShell shuffles answer options per attempt
 * and remaps correct_index to the DISPLAY position, but persisted answers were
 * submitted in display order while the recompute_exam_score trigger grades
 * against kpp_questions.correct_index in ORIGINAL order. Every stored score was
 * therefore computed against a permutation the server never saw.
 */

function makeQuestion(id: string, correctIndex: number): KppQuestion {
  return {
    id,
    category: "road-signs",
    set_id: "mock-1",
    order_index: 0,
    question_en: "q",
    question_ms: "s",
    options_en: ["A", "B", "C", "D"],
    options_ms: ["A", "B", "C", "D"],
    correct_index: correctIndex,
    explanation_en: null,
    explanation_ms: null,
    image_url: null,
    source_url: null,
    created_at: new Date().toISOString(),
  } as KppQuestion;
}

describe("shuffleQuestionOptions", () => {
  it("keeps the correct option pointing at the same text after shuffling", () => {
    const original = makeQuestion("q1", 2); // correct answer is "C"
    const { questions } = shuffleQuestionOptions([original]);
    const shuffled = questions[0];

    expect(shuffled.options_en[shuffled.correct_index]).toBe("C");
  });

  it("records a permutation mapping display index back to original index", () => {
    const original = makeQuestion("q1", 0);
    const { questions, permutations } = shuffleQuestionOptions([original]);
    const perm = permutations["q1"];

    expect(perm).toHaveLength(4);
    // Every display slot maps to a distinct original slot.
    expect([...perm].sort()).toEqual([0, 1, 2, 3]);
    // The option shown at display slot d is the original option perm[d].
    perm.forEach((originalIdx, displayIdx) => {
      expect(questions[0].options_en[displayIdx]).toBe(original.options_en[originalIdx]);
    });
  });
});

describe("toStorageAnswers", () => {
  it("translates a display-order answer back into original DB order", () => {
    const original = makeQuestion("q1", 2);
    const { questions, permutations } = shuffleQuestionOptions([original]);
    const shuffled = questions[0];

    // Learner picks the correct option as displayed.
    const displayAnswers = { q1: shuffled.correct_index };
    const stored = toStorageAnswers(displayAnswers, permutations);

    // What we persist must equal the ORIGINAL correct_index, which is what the
    // server-side trigger compares against.
    expect(stored["q1"]).toBe(original.correct_index);
  });

  it("keeps a wrong answer wrong after translation", () => {
    const original = makeQuestion("q1", 2);
    const { questions, permutations } = shuffleQuestionOptions([original]);
    const shuffled = questions[0];

    const wrongDisplayIndex = (shuffled.correct_index + 1) % 4;
    const stored = toStorageAnswers({ q1: wrongDisplayIndex }, permutations);

    expect(stored["q1"]).not.toBe(original.correct_index);
  });

  it("server-side regrade matches the client score across many shuffles", () => {
    // 50 questions, as in a full mock test, repeated to defeat luck.
    for (let round = 0; round < 25; round++) {
      const originals = Array.from({ length: 50 }, (_, i) =>
        makeQuestion(`q${i}`, i % 4)
      );
      const { questions, permutations } = shuffleQuestionOptions(originals);

      // Learner answers the first 30 correctly, the rest wrong.
      const displayAnswers: Record<string, number> = {};
      questions.forEach((q, i) => {
        displayAnswers[q.id] =
          i < 30 ? q.correct_index : (q.correct_index + 1) % 4;
      });

      // Score as the client computes it (display order).
      const clientScore = questions.reduce(
        (acc, q) => acc + (displayAnswers[q.id] === q.correct_index ? 1 : 0),
        0
      );

      // Score as the database trigger computes it (original order).
      const stored = toStorageAnswers(displayAnswers, permutations);
      const serverScore = originals.reduce(
        (acc, q) => acc + (stored[q.id] === q.correct_index ? 1 : 0),
        0
      );

      expect(clientScore).toBe(30);
      expect(serverScore).toBe(clientScore);
    }
  });

  it("passes an answer through unchanged when no permutation is known", () => {
    expect(toStorageAnswers({ q1: 3 }, {})).toEqual({ q1: 3 });
  });
});
