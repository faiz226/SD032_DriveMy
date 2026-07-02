import { supabase } from "@/lib/supabase";
import type { InsertTheoryProgress, TheoryProgress } from "@/types/database";

export async function getTheoryProgress(userId: string): Promise<TheoryProgress[]> {
  const { data, error } = await supabase
    .from("theory_progress")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateTheoryProgress(
  progress: InsertTheoryProgress
): Promise<TheoryProgress> {
  const { data, error } = await supabase
    .from("theory_progress")
    .upsert(progress as any, { onConflict: "user_id,module_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}