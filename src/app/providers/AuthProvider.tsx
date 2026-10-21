import { useEffect } from "react";
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
    getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // Prevent infinite spinner on boot-time network failures
      setLoading(false);
    });

    return onAuthStateChange((_event, session) => {
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
