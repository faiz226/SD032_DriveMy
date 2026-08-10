/**
 * The landing page — the one Persuade surface in this product.
 *
 * Everything else in DriveMy is Operate: a learner is in a task and the
 * interface should disappear. Here the visitor is deciding, so display type is
 * allowed to carry the voice and the road vernacular goes louder than it ever
 * does inside the app. The mode comes from the surface, not the product.
 *
 * What does not change: the marks, the pass mark, and the maneuver weights are
 * read from `lib/licence.ts`, so the page cannot advertise a number the app
 * does not actually use.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion as useMotionReducedMotion,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Clipboard,
  Car,
  Eye,
  ShieldWarning,
  CloudSlash,
} from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ROUTES,
  MOCK_PASS_MARK,
  MOCK_TOTAL_QUESTIONS,
  MOCK_TIME_LIMIT,
} from "@/lib/constants";
import {
  MANEUVERS,
  PAPER_MARKS,
  CIRCUIT_MARKS,
  TOTAL_MARKS,
  THEORY_MODULES,
} from "@/lib/licence";
import { Button } from "@/components/ui/button";
import { Bay, LPlate, RoadRule } from "@/components/ui/road";
import { Reveal } from "@/components/ui/motion";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import type { TranslationKey } from "@/lib/translations";

const MOCK_MINUTES = String(Math.round(MOCK_TIME_LIMIT / 60));

const FEATURES: {
  icon: React.ReactNode;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}[] = [
  {
    icon: <BookOpen className="h-5 w-5" aria-hidden />,
    titleKey: "landing.feature.signs",
    bodyKey: "landing.feature.signsBody",
  },
  {
    icon: <Clipboard className="h-5 w-5" aria-hidden />,
    titleKey: "landing.feature.mock",
    bodyKey: "landing.feature.mockBody",
  },
  {
    icon: <Car className="h-5 w-5" aria-hidden />,
    titleKey: "landing.feature.sim",
    bodyKey: "landing.feature.simBody",
  },
  {
    icon: <Eye className="h-5 w-5" aria-hidden />,
    titleKey: "landing.feature.colour",
    bodyKey: "landing.feature.colourBody",
  },
  {
    icon: <ShieldWarning className="h-5 w-5" aria-hidden />,
    titleKey: "landing.feature.ethics",
    bodyKey: "landing.feature.ethicsBody",
  },
  {
    icon: <CloudSlash className="h-5 w-5" aria-hidden />,
    titleKey: "landing.feature.offline",
    bodyKey: "landing.feature.offlineBody",
  },
];

export function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed left-2 top-2 z-50 rounded-sm bg-awas px-4 py-2 type-label-strong text-sm text-asphalt"
      >
        {t("a11y.skipToContent")}
      </a>

      {/* ── Bar ─────────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <span className="flex select-none items-center gap-2.5">
          <LPlate letter="L" size={26} title={t("app.name")} />
          <span className="type-display text-lg text-foreground">
            {t("app.name")}
          </span>
        </span>
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle variant="pill" />
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.AUTH}>{t("auth.signIn")}</Link>
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* ── Hero ──────────────────────────────────────────────────────────
            Left-aligned, not centred, and the artefact carrying it is the road
            itself rather than a stock photograph or a gradient. */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-8 sm:pb-16 sm:pt-14">
          {/* Hero stagger: 90ms apart, four steps, so the whole arrival lands
              inside 350ms and reads as one gesture. Persuade surface only. */}
          <Reveal y={12}>
            <p className="type-plate text-xs text-muted-foreground">
              {t("landing.hero.eyebrow")}
            </p>
          </Reveal>

          <Reveal delay={0.09}>
            <h1 className="type-display mt-4 max-w-[16ch] text-[2.75rem] leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
              {t("landing.hero.title")}
            </h1>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mt-6 max-w-[52ch] text-base text-muted-foreground sm:text-lg">
              {t("landing.hero.lead")}
            </p>
          </Reveal>

          <Reveal delay={0.27}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="awas" size="lg">
                <Link to={ROUTES.AUTH}>
                  {t("landing.hero.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="link" size="lg" className="sm:ml-3">
                <Link to={ROUTES.AUTH}>{t("landing.hero.ctaSecondary")}</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {t("landing.hero.note")}
            </p>
          </Reveal>

          {/* The signature, doing the hero's visual work */}
          <Reveal delay={0.36} y={24}>
            <HeroRoad />
          </Reveal>
        </section>

        {/* ── The two halves ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-8 sm:py-16">
          <Reveal className="max-w-readable">
            <h2 className="type-display text-2xl text-foreground sm:text-4xl">
              {t("landing.journey.title")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t("landing.journey.lead")}
            </p>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2">
            <Bay className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <LPlate letter="L" size={34} />
                <p className="type-figure text-2xl text-foreground">
                  {PAPER_MARKS}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    / {TOTAL_MARKS}
                  </span>
                </p>
              </div>
              <h3 className="type-display text-lg text-foreground sm:text-xl">
                {t("landing.journey.l.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.journey.l.body", {
                  total: String(MOCK_TOTAL_QUESTIONS),
                  minutes: MOCK_MINUTES,
                  mark: String(MOCK_PASS_MARK),
                })}
              </p>
              <p className="mt-auto text-sm text-muted-foreground">
                {t("licence.l.gate", {
                  modules: String(THEORY_MODULES),
                  mark: String(MOCK_PASS_MARK),
                  total: String(MOCK_TOTAL_QUESTIONS),
                })}
              </p>
            </Bay>

            <Bay className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <LPlate letter="P" size={34} />
                <p className="type-figure text-2xl text-foreground">
                  {CIRCUIT_MARKS}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    / {TOTAL_MARKS}
                  </span>
                </p>
              </div>
              <h3 className="type-display text-lg text-foreground sm:text-xl">
                {t("landing.journey.p.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing.journey.p.body")}
              </p>
              <p className="mt-auto text-sm text-muted-foreground">
                {t("licence.p.gate", { count: String(MANEUVERS.length) })}
              </p>
            </Bay>
          </div>
        </section>

        {/* ── The mark sheet, published ─────────────────────────────────── */}
        <section className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-8 sm:py-16">
            <Reveal className="max-w-readable">
              <h2 className="type-display text-2xl text-foreground sm:text-4xl">
                {t("landing.marks.title")}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                {t("landing.marks.lead")}
              </p>
            </Reveal>

            <ul className="grid gap-x-8 sm:grid-cols-2">
              {MANEUVERS.map((m) => (
                <li key={m.id}>
                  <RoadRule state="open" className="opacity-40" />
                  <div className="flex items-baseline justify-between gap-4 py-3.5">
                    <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {t(m.nameKey)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {m.difficulty}
                    </p>
                    <p className="type-figure w-10 shrink-0 text-right text-base text-foreground">
                      {m.marks}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between gap-4 border-t-[3px] border-foreground pt-3">
              <p className="type-label-strong text-sm text-foreground">
                {t("dashboard.section.circuit")}
              </p>
              <p className="type-figure text-lg text-foreground">
                {CIRCUIT_MARKS}
              </p>
            </div>
          </div>
        </section>

        {/* ── What is in the box ────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-8 sm:py-16">
          <h2 className="type-display max-w-readable text-2xl text-foreground sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Bay key={f.titleKey} className="flex flex-col gap-3 p-5">
                <span className="text-foreground">{f.icon}</span>
                <h3 className="type-display text-base text-foreground">
                  {t(f.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(f.bodyKey, {
                    total: String(MOCK_TOTAL_QUESTIONS),
                    minutes: MOCK_MINUTES,
                  })}
                </p>
              </Bay>
            ))}
          </div>
        </section>

        {/* ── Close ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-24">
          <div className="carriageway on-road px-6 py-10 sm:px-12 sm:py-14">
            <h2 className="type-display max-w-[18ch] text-2xl text-road-foreground sm:text-4xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mt-4 max-w-readable text-sm text-road-muted sm:text-base">
              {t("landing.cta.body")}
            </p>
            <Button asChild variant="awas" size="lg" className="mt-8">
              <Link to={ROUTES.AUTH}>
                {t("landing.hero.cta")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-8">
          <p>{t("landing.footer.rights")}</p>
          <div className="flex items-center gap-4">
            <Link to={ROUTES.PRIVACY} className="inline-link">
              {t("nav.privacy")}
            </Link>
            <p>© {new Date().getFullYear()} DriveMy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── The hero's artefact ────────────────────────────────────────────────────
   The same road the dashboard uses, at full width and with both checkpoints
   lit, showing a visitor the shape of the thing before they sign up.        */

/**
 * The hero road, driven once as a journey: nothing, to the L, to the P.
 *
 * One MotionValue carries progress 0 → 1 and everything else derives from it —
 * the line draws, the marker travels at its leading edge, and each plate lights
 * as the marker reaches it. Deriving rather than choreographing separately is
 * what keeps the parts from drifting out of sync on a slow device.
 *
 * ~1.9s, ease-in-out: a journey starts at rest and arrives at rest. That is
 * longer than any Operate animation is allowed to be, which is the point — this
 * is the one Persuade surface, and the road is the argument the page is making.
 *
 * The plates reuse LPlate's `earned` state, so an unreached checkpoint is the
 * same dashed outline the dashboard uses for a gate that is not yet met.
 */
function HeroRoad() {
  const { t } = useLanguage();
  const lAt = (PAPER_MARKS / TOTAL_MARKS) * 100;

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useMotionReducedMotion();

  // useReducedMotion returns boolean | null (null before it resolves), and
  // LPlate wants a plain boolean — coerce once here rather than at each use.
  const progress = useMotionValue(reduce ? 1 : 0);
  const [lEarned, setLEarned] = useState<boolean>(!!reduce);
  const [pEarned, setPEarned] = useState<boolean>(!!reduce);

  const markerX = useTransform(progress, [0, 1], ["-100%", "0%"]);

  useMotionValueEvent(progress, "change", (v) => {
    setLEarned(v >= lAt / 100);
    setPEarned(v >= 0.995);
  });

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(progress, 1, {
      duration: 1.9,
      // The Reveal wrapper already holds this back 0.36s; another half-second
      // on top left the road sitting visibly empty before anything moved.
      delay: 0.15,
      ease: [0.65, 0, 0.35, 1], // accelerate away, decelerate into the P
    });
    return () => controls.stop();
  }, [inView, reduce, progress]);

  return (
    <div ref={ref} className="carriageway on-road mt-12 px-5 py-7 sm:mt-16 sm:px-8 sm:py-9">
      <div className="flex items-stretch gap-4">
        <div className="relative h-[110px] flex-1 bg-road-lane sm:h-[128px]">
          <div className="absolute inset-y-0" style={{ left: 17, right: 17 }}>
            {/* The route ahead — unpainted ground, so there is something to cover */}
            <div
              className="absolute left-0 top-1/2 h-[7px] w-full -translate-y-1/2 opacity-25"
              style={{
                background:
                  "linear-gradient(rgb(var(--paint)),rgb(var(--paint))) top/100% 2px no-repeat, linear-gradient(rgb(var(--paint)),rgb(var(--paint))) bottom/100% 2px no-repeat",
              }}
              aria-hidden
            />

            {/* Ground covered. scaleX from the left edge — transform only, so
                the whole draw stays on the compositor. */}
            <motion.div
              className="absolute left-0 top-1/2 h-[7px] w-full -translate-y-1/2"
              style={{
                scaleX: progress,
                transformOrigin: "left center",
                background:
                  "linear-gradient(rgb(var(--paint)),rgb(var(--paint))) top/100% 2px no-repeat, linear-gradient(rgb(var(--paint)),rgb(var(--paint))) bottom/100% 2px no-repeat",
              }}
              aria-hidden
            />

            {/* The traveller. Its wrapper spans the track and slides from
                -100% to 0%, so the marker rides the leading edge without
                anyone having to measure a pixel width. */}
            <motion.div
              className="pointer-events-none absolute inset-y-0 left-0 w-full"
              style={{ x: markerX }}
              aria-hidden
            >
              <span className="absolute right-0 top-1/2 h-[11px] w-[11px] -translate-y-1/2 translate-x-1/2 rounded-full bg-paint" />
            </motion.div>

            <p
              className="type-plate absolute top-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-road-muted"
              style={{ left: `${lAt}%` }}
              aria-hidden
            >
              {t("licence.l.name")}
            </p>
            <div
              className="absolute bottom-0 top-6 w-[7px] -translate-x-1/2 bg-paint"
              style={{ left: `${lAt}%` }}
              aria-hidden
            />
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${lAt}%` }}
            >
              <LPlate
                letter="L"
                size={30}
                earned={lEarned}
                title={t("licence.l.name")}
              />
            </div>

            <p
              className="type-plate absolute bottom-2 left-0 text-[10px] text-road-muted"
              aria-hidden
            >
              {t("dashboard.section.paper")} {PAPER_MARKS}
            </p>
            <p
              className="type-plate absolute bottom-2 right-0 text-[10px] text-road-muted"
              aria-hidden
            >
              {t("dashboard.section.circuit")} {CIRCUIT_MARKS}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <LPlate
            letter="P"
            size={34}
            earned={pEarned}
            title={t("licence.p.name")}
          />
        </div>
      </div>
    </div>
  );
}
