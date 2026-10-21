import { supabase } from "@/lib/supabase";
import { clearUserResultsQueue, markUserDeleted } from "./results.service";
import { useAuthStore } from "@/stores/authStore";

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
 * Erase the learner's results and theory progress but keep the account.
 *
 * This learner's offline queues go first, so a background sync cannot
 * re-upload a result between the server delete and the local clean-up; other
 * learners' pending work on a shared device is left alone. Every delete is
 * checked because supabase-js reports a failure in `error` instead of
 * throwing — unchecked, a half-done reset looked like success.
 */
export async function resetProgress(userId: string): Promise<void> {
  await clearUserResultsQueue(userId);
  const results = await Promise.all(USER_DATA_TABLES.map(table => supabase.from(table).delete().eq("user_id", userId)));
  const failed = results.find(result => result.error);
  if (failed?.error) throw failed.error;
}

export class AccountCleanupError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AccountCleanupError";
  }
}

/**
 * Irreversibly delete the signed-in user's account.
 *
 * Order matters. `delete_user()` removes the auth.users row, and every table
 * above references auth.users(id) ON DELETE CASCADE — so the database removes
 * the dependent rows atomically.
 *
 * Cleans ONLY the deleted user's live and dead-letter queued data locally,
 * preserving pending work for other accounts on shared devices.
 *
 * Throws if the RPC fails, leaving all data in place for a retry.
 */
export async function deleteAccount(): Promise<void> {
  // Establish a reliable outgoing identity before deleting the remote auth row
  let userId: string | undefined;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    userId = sessionData?.session?.user?.id;
  } catch {
    // Check fallback
  }
  if (!userId) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      userId = authData?.user?.id;
    } catch {
      // Check store
    }
  }
  if (!userId) {
    userId = useAuthStore.getState().user?.id;
  }

  if (!userId) {
    throw new Error("Cannot delete account: unable to establish authenticated user identity for local cleanup.");
  }

  const { error } = await supabase.rpc("delete_user");
  if (error) throw error;

  // Remote deletion succeeded: durably mark user as deleted in storage and clean queues locally
  try {
    await markUserDeleted(userId);
    await clearUserResultsQueue(userId);
  } catch (cleanupErr) {
    // Distinguish remote deletion success from local cleanup failure
    const msg = cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr);
    throw new AccountCleanupError(`Account deleted remotely, but failed to complete local queue cleanup: ${msg}`, cleanupErr);
  }
}
