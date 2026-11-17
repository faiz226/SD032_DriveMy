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
