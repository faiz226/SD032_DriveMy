import { supabase } from "@/lib/supabase";
import { get, set } from "idb-keyval";
import type {
  InsertQuizResult,
  InsertMockTestResult,
  InsertSimulationResult,
  InsertColorblindResult,
} from "@/types/database";

async function queueResult<T>(key: string, result: T) {
  const queue = (await get<T[]>(key)) || [];
  queue.push(result);
  await set(key, queue);
}

export async function saveQuizResult(result: InsertQuizResult) {
  if (!navigator.onLine) {
    await queueResult("quizQueue", result);
    return { ...result, id: 'offline-queued' };
  }
  try {
    const { data, error } = await supabase.from("quiz_results").insert(result as any).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    await queueResult("quizQueue", result);
    return { ...result, id: 'offline-queued' };
  }
}

export async function saveMockResult(result: InsertMockTestResult) {
  if (!navigator.onLine) {
    await queueResult("mockQueue", result);
    return { ...result, id: 'offline-queued' };
  }
  try {
    const { data, error } = await supabase.from("mock_test_results").insert(result as any).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    await queueResult("mockQueue", result);
    return { ...result, id: 'offline-queued' };
  }
}

export async function saveSimulationResult(result: InsertSimulationResult) {
  if (!navigator.onLine) {
    await queueResult("simulationQueue", result);
    return { ...result, id: 'offline-queued' };
  }
  try {
    const { data, error } = await supabase.from("simulation_results").insert(result as any).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    await queueResult("simulationQueue", result);
    return { ...result, id: 'offline-queued' };
  }
}

export async function saveColorblindResult(result: InsertColorblindResult) {
  if (!navigator.onLine) {
    await queueResult("colorblindQueue", result);
    return { ...result, id: 'offline-queued' };
  }
  try {
    const { data, error } = await supabase.from("colorblind_results").insert(result as any).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    await queueResult("colorblindQueue", result);
    return { ...result, id: 'offline-queued' };
  }
}

export async function syncOfflineResults() {
  if (!navigator.onLine) return;

  const syncQueue = async (key: string, table: string) => {
    const queue = await get<any[]>(key);
    if (!queue || queue.length === 0) return;

    const failed = [];
    for (const item of queue) {
      const { error } = await supabase.from(table).insert(item);
      if (error) {
        failed.push(item);
      }
    }
    await set(key, failed);
  };

  await Promise.all([
    syncQueue("simulationQueue", "simulation_results"),
    syncQueue("quizQueue", "quiz_results"),
    syncQueue("mockQueue", "mock_test_results"),
    syncQueue("colorblindQueue", "colorblind_results"),
  ]);
}

export { syncOfflineResults as syncSimulationResults };