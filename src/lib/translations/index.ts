import { en, type TranslationKey } from "./en";
import { ms } from "./ms";
import type { Language } from "@/lib/constants";

export type { TranslationKey };
export { en, ms };

const translations: Record<Language, Record<TranslationKey, string>> = { en, ms };

/**
 * Resolve a translation key for the given language.
 * Supports {{variable}} interpolation.
 *
 * @example
 *   translate("quiz.question", "en", { current: 3, total: 50 })
 *   // → "Question 3 of 50"
 */
export function translate(
  key: TranslationKey,
  language: Language,
  params?: Record<string, string | number>
): string {
  const map = translations[language] ?? en;
  let value: string = map[key] ?? en[key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replaceAll(`{{${k}}}`, String(v));
    }
  }

  return value;
}
