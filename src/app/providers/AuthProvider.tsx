import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { useAuthStore } from "@/stores/authStore";
import { getSession, onAuthStateChange } from "@/services/auth.service";
import { syncOfflineResults } from "@/services/results.service";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

/**
 * Hydrates useAuthStore from the live Supabase session on first render and
 * keeps it in sync on sign-in, sign-out and token refresh. This is the single
 * source of truth used by ProtectedRoute and every page that calls
 * useAuthStore(). Results saved offline are flushed for whoever is signed in,
 * on sign-in and whenever the browser comes back online.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setLoading } = useAuthStore();

  useSessionTimeout();

  useEffect(() => {
    // In local development the dev sign-in keeps a mock learner that Supabase
    // knows nothing about; an empty session must not sign that learner out.
    const keepDevLearner = (session: Session | null) =>
      import.meta.env.DEV && !session && useAuthStore.getState().isDevBypass;

    getSession().then((session) => {
      if (!keepDevLearner(session)) {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(() => {
      // Prevent infinite spinner on boot-time network failures
      setLoading(false);
    });

    return onAuthStateChange((_event, session) => {
      if (keepDevLearner(session)) { setLoading(false); return; }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user?.id) {
        syncOfflineResults(session.user.id);
      }
    });
  }, [setUser, setSession, setLoading]);

  useEffect(() => {
    const handleOnline = () => {
      const activeUserId = useAuthStore.getState().user?.id;
      if (activeUserId) syncOfflineResults(activeUserId);
    };
    window.addEventListener("online", handleOnline);
    const activeUserId = useAuthStore.getState().user?.id;
    if (activeUserId) syncOfflineResults(activeUserId);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return <>{children}</>;
}
