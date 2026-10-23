/**
 * Service-worker cache hygiene.
 *
 * The Workbox runtime caches survive a sign-out — clearing the Zustand store
 * does nothing to them. On a shared device that means the next person to sign
 * in can be served responses fetched under the previous account.
 *
 * `useSessionTimeout` has always claimed in its docstring that signing out
 * "flushes the SW cache". Until now nothing actually did.
 */

/** Runtime caches that may hold responses fetched while signed in. */
const USER_SCOPED_CACHE_PREFIXES = ["supabase-"];

/**
 * Delete every Workbox runtime cache that could contain account-scoped data.
 *
 * Deliberately does NOT touch the IndexedDB offline write queues: those hold
 * results the user completed but has not yet synced, and dropping them on
 * sign-out would silently destroy their work. They are also not a cross-user
 * read risk — each queued row carries its original user_id, and the RLS
 * WITH CHECK (auth.uid() = user_id) predicate rejects any attempt to replay
 * them under a different account.
 *
 * Never throws: cache eviction must not be able to block a sign-out.
 */
export async function clearUserScopedCaches(): Promise<void> {
  if (typeof caches === "undefined") return;

  try {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => USER_SCOPED_CACHE_PREFIXES.some((p) => name.startsWith(p)))
        .map((name) => caches.delete(name).catch(() => false))
    );
  } catch (err) {
    console.warn("[cache] failed to clear user-scoped caches on sign-out", err);
  }
}
