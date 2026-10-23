import { Outlet, Link } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { Car, ChartLineUp, ClipboardText } from "@/components/ui/icons";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { BrandMark } from "@/components/shared/BrandMark";
import { JourneyRoad } from "@/components/dashboard/JourneyRoad";
import { useLanguage } from "@/hooks/useLanguage";

const POST = "absolute bottom-0 h-20 w-4 bg-[linear-gradient(90deg,#55524c,#8d8a83,#55524c)]";

/**
 * Sign-in, sign-up and recovery, under the same night sky as the app. On a wide
 * screen a gantry sign and the road sit beside the form and show what the
 * learner is signing in to; on a phone the form stands alone.
 */
export function AuthLayout() {
  const { t } = useLanguage();
  const points = [
    { icon: ClipboardText, label: t("auth.brand.point1") },
    { icon: Car, label: t("auth.brand.point2") },
    { icon: ChartLineUp, label: t("auth.brand.point3") },
  ];

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
              <p className="mt-4 max-w-md text-[1.0625rem] text-white/85">{t("auth.brand.lead")}</p>
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
          <div className="relative">
            <JourneyRoad value={66} label={t("dashboard.hero.meter")} horn={false} />
            <span className="pill pill-neutral absolute left-0 top-0">{t("auth.brand.example")}</span>
          </div>
        </aside>

        <div className="flex min-h-[100dvh] flex-col">
          <header className="flex h-[4.5rem] shrink-0 items-center justify-between px-4 sm:px-6">
            <Link to="/" aria-label={t("app.name")} className="rounded-xl text-foreground no-underline lg:invisible">
              <BrandMark />
            </Link>
            <LanguageToggle />
          </header>

          <main id="main-content" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-8 outline-none sm:py-12">
            <div className="panel page-enter w-full max-w-md p-6 sm:p-8">
              <Outlet />
            </div>
          </main>

          <footer className="shrink-0 py-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} DriveMy
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
