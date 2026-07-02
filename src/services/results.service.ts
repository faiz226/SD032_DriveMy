import { supabase } from "@/lib/supabase";
import type {
  InsertQuizResult,
  InsertMockTestResult,
  InsertSimulationResult,
  InsertColorblindResult,
} from "@/types/database";

export async function saveQuizResult(result: InsertQuizResult) {
  const { data, error } = await supabase
    .from("quiz_results")
    .insert(result as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveMockResult(result: InsertMockTestResult) {
  const { data, error } = await supabase
    .from("mock_test_results")
    .insert(result as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveSimulationResult(result: InsertSimulationResult) {
  const { data, error } = await supabase
    .from("simulation_results")
    .insert(result as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveColorblindResult(result: InsertColorblindResult) {
  const { data, error } = await supabase
    .from("colorblind_results")
    .insert(result as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}