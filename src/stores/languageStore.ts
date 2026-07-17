import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translate, type TranslationKey } from "@/lib/translations";
import type { Language } from "@/lib/constants";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("drivemy-language");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.language) return parsed.state.language;
    }
  } catch (e) {}
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("ms") || lang.startsWith("id")) return "ms";
  return "en";
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: getInitialLanguage(),
      setLanguage: (language) => set({ language }),
      t: (key, params) => translate(key, get().language, params),
    }),
    { name: "drivemy-language" }
  )
);