import { Outlet, Link } from "react-router-dom";
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
    <div className="min-h-[100dvh] canvas-subtle flex flex-col">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6 shrink-0 border-b border-border bg-background">
        <Link
          to="/"
          aria-label={t("app.name")}
          className={cn(
            "font-heading text-xl font-semibold tracking-tight text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          )}
        >
          Drive<span className="text-primary">My</span>
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
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          {t("a11y.skipToContent")}
        </a>

        <div
          className={cn(
            "w-full max-w-md card-premium p-4 sm:p-6 page-enter"
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
