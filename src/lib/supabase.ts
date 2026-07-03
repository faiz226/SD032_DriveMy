import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables. Check .env.local or production config");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    // Use PKCE (Proof Key for Code Exchange) — the secure default for SPAs
    // with Supabase projects created after 2023-04. Google OAuth returns a
    // ?code= query param; PKCE flow exchanges it for a session automatically.
    flowType: "pkce",
  },
});

/**
 * Passively checks if the 'kpp-images' Supabase Storage bucket exists.
 * Logs a console warning if missing — does NOT block or throw.
 * Call this once at app startup (e.g. in main.tsx or App.tsx).
 */
export async function checkKppImagesBucket(): Promise<void> {
  try {
    const { data, error } = await supabase.storage.getBucket("kpp-images");
    if (error || !data) {
      console.warn(
        "[DriveMy] ⚠️ Supabase Storage bucket 'kpp-images' is missing or inaccessible. " +
          "Road sign images will not load. Create a public bucket named 'kpp-images' in your Supabase dashboard."
      );
    }
  } catch {
    // Network offline or permissions error — fail silently
  }
}