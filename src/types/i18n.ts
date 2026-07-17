import type { Language } from "@/lib/constants";

/** A bilingual string — always provide both EN and BM. */
export type BilingualString = Record<Language, string>;

/** Translation namespace keys */
import { en } from "@/lib/translations/en";
export type TranslationKey = keyof typeof en;

/** i18n context value */
export interface I18nContext {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}
