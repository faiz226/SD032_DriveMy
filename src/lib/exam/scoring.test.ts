import { describe, it, expect } from "vitest";
import {
  shuffleQuestionOptions,
  toStorageAnswers,
  applyAnswerKey,
  countCorrect,
  hasCompleteAnswerKey,
} from "./scoring";
import type { ExamQuestion } from "@/services/questions.service";
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

    expect(shuffled.options_en[shuffled.correct_index!]).toBe("C");
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
    const displayAnswers = { q1: shuffled.correct_index! };
    const stored = toStorageAnswers(displayAnswers, permutations);

    // What we persist must equal the ORIGINAL correct_index, which is what the
    // server-side trigger compares against.
    expect(stored["q1"]).toBe(original.correct_index);
  });

  it("keeps a wrong answer wrong after translation", () => {
    const original = makeQuestion("q1", 2);
    const { questions, permutations } = shuffleQuestionOptions([original]);
    const shuffled = questions[0];

    const wrongDisplayIndex = (shuffled.correct_index! + 1) % 4;
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
          i < 30 ? q.correct_index! : (q.correct_index! + 1) % 4;
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

// ─────────────────────────────────────────────────────────────────────────────
// Deferred answer key (mock exams)
//
// Mock questions are fetched WITHOUT correct_index so the answer key is not
// sitting in the browser during a graded exam. The key arrives after
// submission and must be mapped from database order onto the shuffled position
// the learner actually saw — get that mapping wrong and the review screen
// highlights the wrong option, which is worse than showing nothing.
// ─────────────────────────────────────────────────────────────────────────────

/** A question as delivered during a mock exam: no key attached. */
function makeExamQuestion(id: string): ExamQuestion {
  const q = makeQuestion(id, 0) as ExamQuestion;
  delete q.correct_index;
  delete q.explanation_en;
  delete q.explanation_ms;
  return q;
}

describe("applyAnswerKey", () => {
  it("maps the key onto the shuffled position the learner saw", () => {
    for (let round = 0; round < 50; round++) {
      const examQ = makeExamQuestion("q1");
      const { questions, permutations } = shuffleQuestionOptions([examQ]);

      // In the database the correct answer is index 2 — the text "C".
      const keyed = applyAnswerKey(questions, permutations, [
        { id: "q1", correct_index: 2, explanation_en: "because", explanation_ms: "kerana" },
      ]);

      const q = keyed[0];
      // Whatever the shuffle did, the flagged option must still be "C".
      expect(q.options_en[q.correct_index!]).toBe("C");
      expect(q.explanation_en).toBe("because");
    }
  });

  it("leaves questions untouched when the key has no entry for them", () => {
    const { questions, permutations } = shuffleQuestionOptions([makeExamQuestion("q1")]);
    const keyed = applyAnswerKey(questions, permutations, []);

    expect(keyed[0].correct_index).toBeUndefined();
  });

  it("agrees with what the server will compute", () => {
    // End-to-end: learner picks the option showing "C" in the shuffled order.
    // The client scores it via the applied key; the server scores
    // answersForStorage against the original index. They must agree.
    for (let round = 0; round < 50; round++) {
      const { questions, permutations } = shuffleQuestionOptions([makeExamQuestion("q1")]);
      const shown = questions[0];

      const displayIndex = shown.options_en.indexOf("C");
      const answers = { q1: displayIndex };

      const keyed = applyAnswerKey(questions, permutations, [
        { id: "q1", correct_index: 2, explanation_en: null, explanation_ms: null },
      ]);
      const clientScore = countCorrect(keyed, answers);

      const stored = toStorageAnswers(answers, permutations);
      const serverScore = stored["q1"] === 2 ? 1 : 0;

      expect(clientScore).toBe(1);
      expect(serverScore).toBe(1);
    }
  });
});

describe("countCorrect", () => {
  it("skips questions with no key rather than counting them wrong", () => {
    // A partial key must not silently deflate a learner's score.
    const withKey = makeQuestion("a", 1) as ExamQuestion;
    const withoutKey = makeExamQuestion("b");

    expect(countCorrect([withKey, withoutKey], { a: 1, b: 0 })).toBe(1);
  });

  it("returns zero when no key is present at all (mock exam pre-grading)", () => {
    const qs = [makeExamQuestion("a"), makeExamQuestion("b")];
    expect(countCorrect(qs, { a: 0, b: 1 })).toBe(0);
  });
});

describe("hasCompleteAnswerKey", () => {
  it("is false while a mock exam is in progress", () => {
    expect(hasCompleteAnswerKey([makeExamQuestion("a")])).toBe(false);
  });

  it("is true once the key has been applied", () => {
    const { questions, permutations } = shuffleQuestionOptions([makeExamQuestion("a")]);
    const keyed = applyAnswerKey(questions, permutations, [
      { id: "a", correct_index: 0, explanation_en: null, explanation_ms: null },
    ]);
    expect(hasCompleteAnswerKey(keyed)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Resume safety
//
// Saved answers are DISPLAY-order indices. If a resumed attempt reshuffled from
// scratch, every restored answer would silently point at a different option
// than the learner picked — turning a helpful resume into corrupted results.
// ─────────────────────────────────────────────────────────────────────────────

describe("shuffleQuestionOptions — resuming an interrupted attempt", () => {
  it("reuses saved permutations so restored answers still point at the same option", () => {
    for (let round = 0; round < 50; round++) {
      const q = makeQuestion("q1", 2); // correct answer is the text "C"
      const first = shuffleQuestionOptions([q]);

      // The learner picked whatever was shown at this display position.
      const pickedDisplayIndex = first.questions[0].options_en.indexOf("C");
      const pickedText = first.questions[0].options_en[pickedDisplayIndex];

      // Resume: same questions, saved permutations handed back in.
      const resumed = shuffleQuestionOptions([q], first.permutations);

      expect(resumed.questions[0].options_en).toEqual(first.questions[0].options_en);
      expect(resumed.questions[0].options_en[pickedDisplayIndex]).toBe(pickedText);
      expect(resumed.permutations["q1"]).toEqual(first.permutations["q1"]);
    }
  });

  it("falls back to a fresh shuffle for questions with no saved permutation", () => {
    const a = makeQuestion("a", 0);
    const b = makeQuestion("b", 1);
    const first = shuffleQuestionOptions([a]);

    // Only "a" has a saved order; "b" is new to this attempt.
    const resumed = shuffleQuestionOptions([a, b], first.permutations);

    expect(resumed.permutations["a"]).toEqual(first.permutations["a"]);
    expect(resumed.permutations["b"]).toHaveLength(4);
    expect([...resumed.permutations["b"]].sort()).toEqual([0, 1, 2, 3]);
  });

  it("ignores a corrupt saved permutation instead of producing garbage options", () => {
    const q = makeQuestion("q1", 0);

    for (const bad of [[0, 0, 1, 2], [0, 1, 2], [0, 1, 2, 9], "nonsense"]) {
      const res = shuffleQuestionOptions([q], { q1: bad as number[] });
      const perm = res.permutations["q1"];

      // Must be a genuine permutation of 0..3, not the corrupt input.
      expect([...perm].sort()).toEqual([0, 1, 2, 3]);
      // And the flagged answer must still be the originally-correct text.
      expect(res.questions[0].options_en[res.questions[0].correct_index!])
        .toBe(q.options_en[q.correct_index]);
    }
  });
});
