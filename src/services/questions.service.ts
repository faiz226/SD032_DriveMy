import { supabase } from "@/lib/supabase";
import type { KppQuestion, ExamQuestion, AnswerKeyEntry } from "@/types/database";

export type { ExamQuestion, AnswerKeyEntry };

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
 * Practice quiz questions — WITH the answer key.
 *
 * Practice mode reveals the correct answer immediately after each question, so
 * withholding the key here would mean a network round-trip per question for no
 * security benefit: the learner is about to be shown the answer anyway.
 */
export async function fetchQuizQuestions({
  category,
  setId,
  limit = 20,
}: {
  category?: string;
  setId?: string;
  limit?: number;
}): Promise<KppQuestion[]> {
  let query = supabase
    .from("kpp_practice_questions" as never)
    .select("*")
    .order("order_index", { ascending: true })
    .limit(limit);
  if (category) query = query.eq("category", category);
  if (setId) query = query.eq("set_id", setId);
  const { data, error } = await query;
  if (error) throw new Error(`fetchQuizQuestions: ${error.message}`);
  const rows = (data ?? []) as KppQuestion[];
  if (rows.length > 0 || !setId) return rows;

  // Migration gap fallback: if specific set_id not yet migrated, query any available
  // practice questions (by category if available) up to limit.
  let fallbackQuery = supabase
    .from("kpp_practice_questions" as never)
    .select("*")
    .order("order_index", { ascending: true })
    .limit(limit);
  if (category) fallbackQuery = fallbackQuery.eq("category", category);
  const { data: fallbackData } = await fallbackQuery;
  return (fallbackData ?? []) as KppQuestion[];
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
  const rows = (data ?? []) as unknown as ExamQuestion[];
  if (rows.length > 0 || setId === "mock-1") return rows;

  // Migration gap fallback: if the new textbook set hasn't landed in DB yet,
  // query legacy 'mock-1' so learners never see an empty test or error.
  const fallback = await supabase
    .from("kpp_questions")
    .select(EXAM_COLUMNS)
    .eq("set_id", "mock-1")
    .order("order_index", { ascending: true });
  return (fallback.data ?? []) as unknown as ExamQuestion[];
}

/** Only a saved, caller-owned attempt can release the mock answer key. */
export async function fetchMockAnswerKey(testResultId: string): Promise<AnswerKeyEntry[]> {
  if (!testResultId || testResultId === "offline-queued") {
    throw new Error("fetchMockAnswerKey: a saved result ID is required");
  }
  const { data, error } = await supabase.rpc("get_mock_test_answer_key" as never, {
    p_test_result_id: testResultId,
  } as never);
  if (error) throw new Error(`fetchMockAnswerKey: ${error.message}`);
  return (data ?? []) as AnswerKeyEntry[];
}

export async function fetchQuestionsByCategory(category: string): Promise<KppQuestion[]> {
  const { data, error } = await supabase
    .from("kpp_practice_questions" as never)
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
