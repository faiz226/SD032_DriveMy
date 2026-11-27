import { useId } from "react";
import { motion } from "motion/react";
import { useLanguage } from "@/hooks/useLanguage";
import { SPRING_SNAPPY } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/constants";
import { Translate } from "@/components/ui/icons";

interface LanguageToggleProps {
  variant?: "pill" | "text" | "icon";
  className?: string;
}

const LANGUAGES: { code: Language; shortLabel: string; nativeLabel: string }[] = [
  { code: "en", shortLabel: "EN", nativeLabel: "English" },
  { code: "ms", shortLabel: "BM", nativeLabel: "Bahasa Malaysia" },
];

export function LanguageToggle({ variant = "pill", className }: LanguageToggleProps) {
  const { language, setLanguage, t } = useLanguage();
  const thumbId = `lang-toggle-thumb-${useId()}`;

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
          "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold",
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
          "glass-control inline-flex h-11 w-11 min-w-11 items-center justify-center rounded-full",
          "text-muted-foreground hover:text-foreground transition-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          className
        )}
      >
        <Translate className="h-5 w-5" aria-hidden />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("a11y.toggleLanguage")}
      className={cn(
        "glass-pill relative inline-flex h-11 select-none items-center rounded-full",
        "bg-foreground/[0.06] dark:bg-white/[0.08]",
        className
      )}
    >
      {LANGUAGES.map((lang) => {
        const active = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-label={lang.shortLabel}
            title={lang.nativeLabel}
            aria-pressed={active}
            lang={lang.code === "ms" ? "ms-MY" : "en-MY"}
            className={cn(
              "relative inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-xs font-bold tracking-wide",
              "transition-colors duration-200 active:scale-[0.97] motion-reduce:active:scale-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "glass-ink" : "glass-muted hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={thumbId}
                transition={SPRING_SNAPPY}
                aria-hidden="true"
                className="glass-pill glass-pill-lens pointer-events-none absolute inset-1 rounded-full"
              />
            )}
            <span className="relative z-10">{lang.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
