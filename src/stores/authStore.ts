import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import { signOut as signOutService } from "@/services/auth.service";

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
        try {
          await signOutService();
        } catch (error) {
          console.warn("Failed to sign out on server, clearing locally", error);
        } finally {
          set({ user: null, session: null, isAuthenticated: false });
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