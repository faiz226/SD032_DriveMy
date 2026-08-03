import { supabase } from "@/lib/supabase";
import { del } from "idb-keyval";

/**
 * PDPA 2010 / GDPR data-subject rights: export (access & portability) and
 * account deletion (erasure).
 *
 * Previously this logic existed twice — in SettingsPage.tsx and in an orphaned
 * DataExportDelete.tsx — and both copies were wrong in the same way: they
 * deleted every result table BEFORE calling an RPC that did not exist, so the
 * user's data was destroyed, the account survived, and the UI reported a
 * generic failure. Keeping one implementation here prevents the two copies
 * from drifting again.
 */

const USER_DATA_TABLES = [
  "quiz_results",
  "mock_test_results",
  "simulation_results",
  "colorblind_results",
  "theory_progress",
] as const;

const OFFLINE_QUEUES = [
  "quizQueue",
  "mockQueue",
  "simulationQueue",
  "colorblindQueue",
] as const;

/**
 * Collect everything held about the signed-in user and hand it back as JSON.
 * RLS already restricts each read to the caller's own rows; the explicit
 * user_id filter is belt-and-braces.
 */
export async function exportUserData(userId: string): Promise<Blob> {
  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    userId,
  };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId);
  if (profileError) throw profileError;
  payload["profiles"] = profile ?? [];

  for (const table of USER_DATA_TABLES) {
    const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
    if (error) throw error;
    payload[table] = data ?? [];
  }

  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

/**
 * Irreversibly delete the signed-in user's account.
 *
 * Order matters. `delete_user()` removes the auth.users row, and every table
 * above references auth.users(id) ON DELETE CASCADE — so the database removes
 * the dependent rows atomically. Deleting them manually first would mean a
 * failure part-way through leaves the user with their data gone and their
 * account intact, which is exactly the bug this replaces.
 *
 * Throws if the RPC fails, leaving all data in place for a retry.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc("delete_user");
  if (error) throw error;

  // Server state is gone; now clear anything cached on this device so a queued
  // offline write cannot resurrect a row after deletion.
  await Promise.all(OFFLINE_QUEUES.map((queue) => del(queue).catch(() => undefined)));
}
