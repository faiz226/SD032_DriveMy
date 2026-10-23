import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "@/lib/constants";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Night is the signature theme; day stays one tap away in the header.
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "drivemy-theme",
    }
  )
);
