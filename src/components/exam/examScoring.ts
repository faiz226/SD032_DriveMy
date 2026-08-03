import type { KppQuestion } from "@/types/database";

/**
 * Per-question option permutation: `perm[displayIndex] = originalIndex`.
 * Used to translate a learner's answer back into database option order.
 */
export type OptionPermutations = Record<string, number[]>;

export interface ShuffleResult {
  questions: KppQuestion[];
  permutations: OptionPermutations;
}

/**
 * Randomise answer order per attempt so options cannot be memorised by position.
 *
 * The permutations are returned, not discarded. The database stores answers as
 * { question_id: option_index }, and the recompute_exam_score trigger compares
 * that index against kpp_questions.correct_index — which is in ORIGINAL order.
 * Submitting display-order indices therefore scores every attempt against a
 * permutation the server never saw. Callers must map answers back through
 * `permutations` before persisting (see toStorageAnswers).
 */
export function shuffleQuestionOptions(questions: KppQuestion[]): ShuffleResult {
  const permutations: OptionPermutations = {};

  const shuffled = questions.map((q) => {
    const opts_en = [...q.options_en];
    const opts_ms = [...q.options_ms];
    // Build permutation via Fisher-Yates
    const perm = opts_en.map((_, i) => i);
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    permutations[q.id] = perm;
    const new_correct = perm.indexOf(q.correct_index);
    return {
      ...q,
      options_en: perm.map((i) => opts_en[i]),
      options_ms: perm.map((i) => opts_ms[i]),
      correct_index: new_correct,
    };
  });

  return { questions: shuffled, permutations };
}

/**
 * Convert display-order answers into the original database option order, so
 * the server-side score recomputation compares like with like.
 */
export function toStorageAnswers(
  answers: Record<string, number>,
  permutations: OptionPermutations
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [questionId, displayIndex] of Object.entries(answers)) {
    const perm = permutations[questionId];
    // perm[displayIndex] is the option's index in the original DB ordering.
    out[questionId] = perm?.[displayIndex] ?? displayIndex;
  }
  return out;
}
