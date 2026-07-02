import { supabase } from "@/lib/supabase";
import type { KppQuestion } from "@/types/database";

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

export async function fetchMockQuestionsBySet(setId: string): Promise<KppQuestion[]> {
  const { data, error } = await supabase
    .from("kpp_questions")
    .select("*")
    .eq("set_id", setId)
    .order("order_index", { ascending: true });

  if (error) throw new Error(`fetchMockQuestionsBySet(${setId}): ${error.message}`);
  return data ?? [];
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