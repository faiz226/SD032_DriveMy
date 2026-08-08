import { Outlet, Link } from "react-router-dom";
import { LPlate } from "@/components/ui/road";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

/**
 * Centered card layout for all auth pages.
 * No sidebar — logo, card, and theme/language controls.
 */
export function AuthLayout() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6 shrink-0 border-b border-border bg-background">
        <Link
          to="/"
          aria-label={t("app.name")}
          className={cn(
            "flex items-center gap-2.5 rounded-sm no-underline",
            "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]"
          )}
        >
          <LPlate letter="L" size={24} title={t("app.name")} />
          <span className="type-display text-lg text-foreground">
            {t("app.name")}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle variant="pill" />
        </div>
      </header>

      <main
        id="main-content"
        className="relative flex flex-1 items-center justify-center px-4 py-10 sm:py-12"
        tabIndex={-1}
      >
        <a
          href="#main-content"
          className={cn(
            "sr-only focus:not-sr-only",
            "fixed top-2 left-2 z-50 rounded-md bg-primary px-4 py-2",
            "text-primary-foreground text-sm font-medium",
            "focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]"
          )}
        >
          {t("a11y.skipToContent")}
        </a>

        <div
          className={cn(
            "w-full max-w-md plate p-4 sm:p-6 page-enter"
          )}
        >
          <Outlet />
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground shrink-0">
        © {new Date().getFullYear()} DriveMy
      </footer>
    </div>
  );
}
