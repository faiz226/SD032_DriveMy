import { Outlet, Link } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { Car, ChartLineUp, ClipboardText, Moon, Sun } from "@/components/ui/icons";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { BrandMark } from "@/components/shared/BrandMark";
import { JourneyRoad } from "@/components/shared/JourneyRoad";
import { SwapIcon } from "@/components/ui/swap-icon";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/hooks/useTheme";
import { ROUTES } from "@/lib/constants";

const POST = "absolute bottom-0 h-20 w-4 bg-[#77746d]";

/**
 * Sign-in, sign-up and recovery, under the same night sky as the app. On a wide
 * screen a gantry sign and the road sit beside the form and show what the
 * learner is signing in to; on a phone a compact expressway header introduces
 * the app above the form while keeping the KL skyline visible.
 */
export function AuthLayout() {
  const { t, language } = useLanguage();
  const { isDark, setTheme } = useTheme();
  const points = [
    { icon: ClipboardText, label: t("auth.brand.point1") },
    { icon: Car, label: t("auth.brand.point2") },
    { icon: ChartLineUp, label: t("auth.brand.point3") },
  ];

  const themeToggleLabel = isDark
    ? language === "ms"
      ? "Tukar ke mod cerah"
      : "Switch to light mode"
    : language === "ms"
      ? "Tukar ke mod gelap"
      : "Switch to dark mode";

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only fixed left-3 top-3 z-50 rounded-xl bg-card px-4 py-3 text-sm font-semibold shadow-lg"
        >
          {t("a11y.skipToContent")}
        </a>

        <aside className="hidden flex-col justify-center gap-6 p-10 lg:flex xl:p-14" aria-hidden="true">
          <BrandMark className="text-foreground" />
          <div className="relative pb-6">
            <span className={`${POST} left-[12%]`} />
            <span className={`${POST} right-[12%]`} />
            <div className="hero-panel px-9 py-9">
              <p className="type-display max-w-md text-[2.5rem] text-white xl:text-[3rem]">{t("auth.brand.title")}</p>
              <p className="mt-4 max-w-md text-[1.0625rem] text-white">{t("auth.brand.lead")}</p>
              <ul className="mt-6 space-y-2.5">
                {points.map(({ icon: Glyph, label }) => (
                  <li key={label} className="flex items-center gap-3 font-semibold text-white">
                    <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-white bg-[#0A5FBF]"><Glyph size={18} weight="bold" /></span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative [&_.car-idle]:animate-none">
            <JourneyRoad value={66} label={t("dashboard.hero.meter")} horn={false} />
            <span className="pill pill-neutral absolute left-0 top-0">{t("auth.brand.example")}</span>
          </div>
        </aside>

        <div className="flex min-h-[100dvh] flex-col">
          <header className="flex min-h-[4.5rem] shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link
              to="/"
              aria-label={t("app.name")}
              className="inline-flex min-h-11 items-center rounded-xl text-foreground no-underline lg:invisible"
            >
              <BrandMark />
            </Link>
            <div className="glass-bar inline-flex items-center gap-1 rounded-full p-1">
              <LanguageToggle variant="pill" className="bg-transparent p-0" />
              <span aria-hidden="true" className="h-5 w-px bg-border/60" />
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={themeToggleLabel}
                title={themeToggleLabel}
                className="glass-control grid h-11 w-11 place-items-center rounded-full glass-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SwapIcon id={isDark ? "sun" : "moon"}>
                  {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                </SwapIcon>
              </button>
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6 outline-none sm:py-10">
            {/* Compact expressway header on mobile so small viewports keep DriveMy's road identity above the card */}
            <div className="hero-panel w-full max-w-md px-5 py-4 lg:hidden" aria-hidden="true">
              <p className="font-heading text-lg font-extrabold leading-tight text-white">
                {t("auth.brand.title")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/90">
                {t("auth.brand.lead")}
              </p>
            </div>

            <div className="panel page-enter w-full max-w-md p-6 sm:p-8">
              <Outlet />
            </div>
          </main>

          <footer className="shrink-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-4 text-center text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} DriveMy</span>
            <Link
              to={ROUTES.PRIVACY}
              className="inline-flex min-h-11 items-center px-2 font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              {t("settings.privacyPolicy")}
            </Link>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
