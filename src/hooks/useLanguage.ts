import { useLanguageStore } from "@/stores/languageStore";
import type { Language } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";

/**
 * Primary i18n hook.
 * Returns the current language, a setter, and the t() translation helper.
 *
 * @example
 *   const { t, language, setLanguage } = useLanguage();
 *   <h1>{t("quiz.title")}</h1>
 *   <p>{t("quiz.question", { current: 3, total: 50 })}</p>
 */
export function useLanguage(): {
  language:    Language;
  setLanguage: (lang: Language) => void;
  t:           (key: TranslationKey, params?: Record<string, string | number>) => string;
} {
  return useLanguageStore();
}
