import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import { signOut as signOutService, LocalSessionTerminationError } from "@/services/auth.service";
import { clearUserScopedCaches } from "@/lib/cache";
import { clearAllProgress } from "@/lib/testProgress";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDevBypass: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setDevBypass: (val: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      isDevBypass: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setSession: (session) => set({ session, isAuthenticated: Boolean(session) }),
      setLoading: (isLoading) => set({ isLoading }),
      setDevBypass: (isDevBypass) => {
        if (!import.meta.env.DEV) return;
        if (isDevBypass) {
          const mockUser: User = {
            id: "00000000-0000-0000-0000-000000000000",
            email: "dev@bypass.local",
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: { full_name: "Local Developer" },
            aud: "authenticated",
            role: "authenticated",
            updated_at: new Date().toISOString(),
            phone: "",
            confirmation_sent_at: "",
            confirmed_at: "",
            recovery_sent_at: "",
            email_confirmed_at: "",
            phone_confirmed_at: "",
            last_sign_in_at: "",
            factors: [],
            identities: []
          };
          set({ isDevBypass, user: mockUser, isAuthenticated: true });
        } else {
          set({ isDevBypass, user: null, isAuthenticated: false });
        }
      },
      signOut: async () => {
        const initialState = useAuthStore.getState();
        const outgoingUserId = initialState.user?.id;
        // Capture the session generation/ownership token at signOut start.
        // Using access_token rather than user ID means a fresh login to the SAME
        // account during a pending logout produces a different token and is preserved.
        const outgoingToken = initialState.session?.access_token;

        try {
          await signOutService({ userId: outgoingUserId, token: outgoingToken });
        } catch (error) {
          if (
            error instanceof LocalSessionTerminationError ||
            (error as { name?: string })?.name === "LocalSessionTerminationError"
          ) {
            console.error("[auth] Incomplete local session cleanup:", error);
            throw error;
          }
          console.warn("Failed to sign out on server, clearing locally", error);
        } finally {
          const currentState = useAuthStore.getState();
          // A session is genuinely newer when:
          // 1. A new access_token exists and differs from outgoing token (handles same-account & new-account logins with tokens)
          // 2. OR a new user ID exists and differs from outgoing user ID (handles different account logins even without tokens)
          const currentToken = currentState.session?.access_token;
          const currentUserId = currentState.user?.id;
          const hasNewToken = Boolean(currentToken) && currentToken !== outgoingToken;
          const hasNewUser = Boolean(currentUserId) && currentUserId !== outgoingUserId;
          const isGenuinelyNewSession = hasNewToken || hasNewUser;

          if (!isGenuinelyNewSession) {
            if (outgoingUserId) clearAllProgress(outgoingUserId);
            await clearUserScopedCaches();

            // Re-verify after asynchronous cache-clear boundary
            const postClearState = useAuthStore.getState();
            const postClearToken = postClearState.session?.access_token;
            const postClearUserId = postClearState.user?.id;
            const isStillOriginalOrCleared =
              !postClearUserId ||
              (postClearUserId === outgoingUserId && (!postClearToken || postClearToken === outgoingToken));

            if (isStillOriginalOrCleared) {
              set({ user: null, session: null, isAuthenticated: false });
            } else {
              console.warn(
                `[auth] Account change race during cache clear (outgoing=${outgoingUserId}, current=${postClearUserId}); preserving new session.`
              );
            }
          } else {
            console.warn(
              `[auth] Account change race during signout (outgoing=${outgoingUserId}, current=${currentState.user?.id}); preserving new session.`
            );
          }
        }
      },
    }),
    {
      name: "drivemy-auth-store",
      // Persist only isDevBypass and mock user — Supabase manages the actual session independently.
      partialize: (state) => ({ 
        isDevBypass: state.isDevBypass,
        user: state.isDevBypass ? state.user : null,
        isAuthenticated: state.isDevBypass ? true : false,
      }),
    }
  )
);
