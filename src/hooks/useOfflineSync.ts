import { useEffect } from "react";
import { toast } from "sonner";
import { getQueue, dequeueWrite } from "@/lib/offlineStorage";
import { supabase } from "@/lib/supabase";

/**
 * useOfflineSync — listens for the browser coming back online,
 * then flushes any queued IndexedDB writes to Supabase.
 *
 * Mount once at the app root level.
 */
export function useOfflineSync() {
  useEffect(() => {
    const flush = async () => {
      const queue = await getQueue();
      if (queue.length === 0) return;

      let synced = 0;
      for (const entry of queue) {
        const { error } = await supabase.from(entry.table).insert(entry.payload as any);
        if (!error) {
          await dequeueWrite(entry.id);
          synced++;
        }
      }

      if (synced > 0) {
        toast.success(`Synced ${synced} offline result${synced > 1 ? "s" : ""} to the cloud.`);
      }
    };

    window.addEventListener("online", flush);

    // Also attempt on first mount (in case we're already online with a backlog)
    if (navigator.onLine) flush();

    return () => window.removeEventListener("online", flush);
  }, []);
}
