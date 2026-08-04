import type { ExamQuestion, AnswerKeyEntry } from "@/services/questions.service";

/**
 * Per-question option permutation: `perm[displayIndex] = originalIndex`.
 * Used to translate a learner's answer back into database option order.
 */
export type OptionPermutations = Record<string, number[]>;

export interface ShuffleResult {
  questions: ExamQuestion[];
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
 *
 * Works whether or not the question carries an answer key: mock exams are
 * fetched without one, practice quizzes with.
 */
export function shuffleQuestionOptions(questions: ExamQuestion[]): ShuffleResult {
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

    return {
      ...q,
      options_en: perm.map((i) => opts_en[i]),
      options_ms: perm.map((i) => opts_ms[i]),
      // Only meaningful when the key is present (practice mode). For a mock
      // exam it stays undefined until applyAnswerKey() runs after submission.
      correct_index:
        q.correct_index === undefined ? undefined : perm.indexOf(q.correct_index),
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

/**
 * Merge a post-submission answer key into the shuffled questions the learner
 * actually saw, translating each correct_index from database order into the
 * display position on screen.
 *
 * Without this the review screen would highlight the wrong option: the key is
 * in original order, but the options were rendered shuffled.
 */
export function applyAnswerKey(
  questions: ExamQuestion[],
  permutations: OptionPermutations,
  key: AnswerKeyEntry[]
): ExamQuestion[] {
  const byId = new Map(key.map((entry) => [entry.id, entry]));

  return questions.map((q) => {
    const entry = byId.get(q.id);
    if (!entry) return q;

    const perm = permutations[q.id];
    // indexOf maps original position -> display position. Fall back to the
    // original index when no permutation was recorded.
    const displayCorrect = perm ? perm.indexOf(entry.correct_index) : entry.correct_index;

    return {
      ...q,
      correct_index: displayCorrect,
      explanation_en: entry.explanation_en,
      explanation_ms: entry.explanation_ms,
    };
  });
}

/**
 * Count correct answers. Questions with no known key are skipped rather than
 * counted wrong, so a partial key cannot silently deflate a learner's score.
 */
export function countCorrect(
  questions: ExamQuestion[],
  answers: Record<string, number>
): number {
  return questions.reduce((total, q) => {
    if (q.correct_index === undefined) return total;
    return total + (answers[q.id] === q.correct_index ? 1 : 0);
  }, 0);
}

/** Whether every question carries a key — i.e. the review screen can be shown. */
export function hasCompleteAnswerKey(questions: ExamQuestion[]): boolean {
  return questions.length > 0 && questions.every((q) => q.correct_index !== undefined);
}
