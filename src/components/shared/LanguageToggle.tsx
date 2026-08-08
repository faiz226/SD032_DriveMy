import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/constants";
import { Translate } from "phosphor-react";

interface LanguageToggleProps {
  variant?:  "pill" | "text" | "icon";
  className?: string;
}

const LANGUAGES: { code: Language; shortLabel: string; nativeLabel: string }[] = [
  { code: "en", shortLabel: "EN", nativeLabel: "English"          },
  { code: "ms", shortLabel: "BM", nativeLabel: "Bahasa Malaysia"  },
];

export function LanguageToggle({ variant = "pill", className }: LanguageToggleProps) {
  const { language, setLanguage, t } = useLanguage();

  if (variant === "text") {
    const other = LANGUAGES.find((l) => l.code !== language);
    return (
      <button
        type="button"
        onClick={() => other && setLanguage(other.code)}
        aria-label={other?.shortLabel}
        title={other?.nativeLabel}
        lang={other?.code === "ms" ? "ms-MY" : "en-MY"}
        className={cn(
          "tap flex items-center justify-center rounded-md px-2 text-sm font-medium",
          "text-muted-foreground hover:text-foreground transition-base",
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]",
          className
        )}
      >
        {other?.shortLabel}
      </button>
    );
  }

  if (variant === "icon") {
    const other = LANGUAGES.find((l) => l.code !== language);
    return (
      <button
        type="button"
        onClick={() => other && setLanguage(other.code)}
        aria-label={other?.shortLabel}
        title={other?.nativeLabel}
        lang={other?.code === "ms" ? "ms-MY" : "en-MY"}
        className={cn(
          "tap flex items-center justify-center rounded-lg p-1.5",
          "text-muted-foreground hover:text-foreground transition-base",
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]",
          className
        )}
      >
        <Translate className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  // Pill: two plate-lettered options, the selected one underlined in paint.
  // BM is not a secondary option here — both sit at the same weight, and only
  // the marker distinguishes them.
  return (
    <div
      role="group"
      aria-label={t("a11y.toggleLanguage")}
      className={cn("inline-flex items-stretch gap-1", className)}
    >
      {LANGUAGES.map((lang) => {
        const selected = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-label={lang.nativeLabel}
            title={lang.nativeLabel}
            aria-pressed={selected}
            lang={lang.code === "ms" ? "ms-MY" : "en-MY"}
            className={cn(
              "relative min-h-[36px] px-2 pb-1.5 pt-1",
              "type-label-strong text-xs transition-colors duration-150",
              "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--awas))]",
              selected
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {lang.shortLabel}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-1 bottom-0 h-[2px] transition-opacity duration-150",
                selected ? "bg-awas opacity-100" : "opacity-0"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
