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
        set({ isDevBypass });
      },
      signOut: async () => {
        await signOutService();
        set({ user: null, session: null, isAuthenticated: false });
      },
    }),
    {
      name: "drivemy-auth-store",
      // Persist nothing — Supabase manages the session independently via cookies/storage.
      partialize: () => ({}),
    }
  )
);