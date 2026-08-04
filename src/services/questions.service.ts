import { supabase } from "@/lib/supabase";
import type { KppQuestion } from "@/types/database";

/**
 * Columns safe to send to the browser while an exam is in progress.
 *
 * Deliberately excludes correct_index, explanation_en and explanation_ms.
 * `select("*")` shipped the full answer key to the client before the learner
 * had answered anything — open DevTools during a 45-minute mock test and every
 * correct answer was sitting there in the network tab.
 *
 * The server-side recompute trigger means a cheat cannot forge a PASS on
 * record, so this is not a data-integrity hole. It is worse in a subtler way:
 * it defeats the product's entire purpose. A learner who fools themselves about
 * being ready sits a real road-safety exam unprepared.
 */
const EXAM_COLUMNS =
  "id, category, set_id, order_index, question_en, question_ms, options_en, options_ms, image_url, source_url, created_at";

/**
 * A question as delivered during an exam — no answer key attached.
 *
 * The key fields are optional rather than absent so a fully-populated
 * KppQuestion remains assignable here. Practice quizzes still fetch the key up
 * front, because immediate feedback is the point of practice.
 */
export type ExamQuestion = Omit<
  KppQuestion,
  "correct_index" | "explanation_en" | "explanation_ms"
> & {
  correct_index?: number;
  explanation_en?: string | null;
  explanation_ms?: string | null;
};

/** The answer key for one question, fetched only after submission. */
export interface AnswerKeyEntry {
  id: string;
  correct_index: number;
  explanation_en: string | null;
  explanation_ms: string | null;
}

/**
 * Practice quiz questions — WITH the answer key.
 *
 * Practice mode reveals the correct answer immediately after each question, so
 * withholding the key here would mean a network round-trip per question for no
 * security benefit: the learner is about to be shown the answer anyway.
 */
export async function fetchQuizQuestions({
  category,
  limit = 20,
}: {
  category?: string;
  limit?: number;
}): Promise<KppQuestion[]> {
  let query = supabase
    .from("kpp_questions")
    .select("*")
    .eq("set_id", "quiz-pool")
    .order("order_index", { ascending: true })
    .limit(limit);

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error(`fetchQuizQuestions: ${error.message}`);
  return data ?? [];
}

/**
 * Mock exam questions — WITHOUT the answer key.
 *
 * This is the graded exam, so the key stays on the server until the learner
 * submits. Retrieve it afterwards with fetchMockAnswerKey().
 */
export async function fetchMockQuestionsBySet(setId: string): Promise<ExamQuestion[]> {
  const { data, error } = await supabase
    .from("kpp_questions")
    .select(EXAM_COLUMNS)
    .eq("set_id", setId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(`fetchMockQuestionsBySet(${setId}): ${error.message}`);
  return (data ?? []) as unknown as ExamQuestion[];
}

/**
 * The answer key for a mock set. Call only once the exam has been submitted —
 * fetching it earlier reopens exactly the hole this split exists to close.
 */
export async function fetchMockAnswerKey(setId: string): Promise<AnswerKeyEntry[]> {
  const { data, error } = await supabase
    .from("kpp_questions")
    .select("id, correct_index, explanation_en, explanation_ms")
    .eq("set_id", setId);

  if (error) throw new Error(`fetchMockAnswerKey(${setId}): ${error.message}`);
  return (data ?? []) as unknown as AnswerKeyEntry[];
}

export async function fetchQuestionsByCategory(category: string): Promise<KppQuestion[]> {
  const { data, error } = await supabase
    .from("kpp_questions")
    .select("*")
    .eq("category", category)
    .order("set_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) throw new Error(`fetchQuestionsByCategory(${category}): ${error.message}`);
  return data ?? [];
}

export async function fetchCategories(): Promise<string[]> {
  const { data, error } = await supabase.from("kpp_questions").select("category");
  if (error) throw new Error(`fetchCategories: ${error.message}`);
  const rows = (data ?? []) as Array<{ category: string }>;
  return [...new Set(rows.map((r) => r.category))].sort();
}

export async function fetchAvailableSets(): Promise<string[]> {
  const { data, error } = await supabase.from("kpp_questions").select("set_id");
  if (error) throw new Error(`fetchAvailableSets: ${error.message}`);
  const rows = (data ?? []) as Array<{ set_id: string }>;
  return [...new Set(rows.map((r) => r.set_id))].sort();
}
