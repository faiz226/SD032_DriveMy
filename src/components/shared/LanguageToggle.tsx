import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/constants";
import { Translate } from "@/components/ui/icons";

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
          "touch-target rounded-md px-2 text-sm font-medium",
          "text-muted-foreground hover:text-foreground transition-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
          "touch-target rounded-lg p-1.5",
          "text-muted-foreground hover:text-foreground transition-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          className
        )}
      >
        <Translate className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("a11y.toggleLanguage")}
      className={cn(
        "inline-flex gap-0.5 rounded-full bg-muted p-1",
        className
      )}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLanguage(lang.code)}
          aria-label={lang.shortLabel}
          title={lang.nativeLabel}
          aria-pressed={language === lang.code}
          lang={lang.code === "ms" ? "ms-MY" : "en-MY"}
          className={cn(
            "inline-flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-xs font-semibold tracking-wide",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            language === lang.code
              ? "bg-card text-foreground shadow-sm dark:bg-secondary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {lang.shortLabel}
        </button>
      ))}
    </div>
  );
}
