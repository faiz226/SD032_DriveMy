import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translate, type TranslationKey } from "@/lib/translations";
import type { Language } from "@/lib/constants";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
      t: (key, params) => translate(key, get().language, params),
    }),
    { name: "drivemy-language" }
  )
);