import { Link } from "react-router-dom";
import {
  Car, Mountains, Square, Compass,
  Waves, Lightning, Warning, GitMerge, Trophy,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Panel, Pill, type PillTone } from "@/components/ui/surface";
import { useLanguage } from "@/hooks/useLanguage";
import { useSimStats } from "@/hooks/useProgressStats";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { TranslationKey } from "@/lib/translations";
import { circuit } from "@/sim/data";

// ── Maneuver definitions ──────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";

interface Maneuver {
  id: string;
  order: number;
  nameKey: TranslationKey;
  difficulty: Difficulty;
  icon: React.ReactNode;
}

const MANEUVERS: Maneuver[] = [
  { id: "hill-start",       order: 1, nameKey: "progress.maneuver.hill-start",       difficulty: "Hard",   icon: <Mountains className="h-6 w-6" weight="regular" /> },
  { id: "side-parking",     order: 2, nameKey: "progress.maneuver.side-parking",     difficulty: "Medium", icon: <Square    className="h-6 w-6" weight="regular" /> },
  { id: "parallel-parking", order: 3, nameKey: "progress.maneuver.parallel-parking", difficulty: "Hard",   icon: <Square    className="h-6 w-6" weight="regular" /> },
  { id: "s-curve",          order: 4, nameKey: "progress.maneuver.s-curve",          difficulty: "Medium", icon: <Waves     className="h-6 w-6" weight="regular" /> },
  { id: "z-curve",          order: 5, nameKey: "progress.maneuver.z-curve",          difficulty: "Medium", icon: <Lightning className="h-6 w-6" weight="regular" /> },
  { id: "ramp-test",        order: 6, nameKey: "progress.maneuver.ramp-test",        difficulty: "Easy",   icon: <Warning   className="h-6 w-6" weight="regular" /> },
  { id: "road-merging",     order: 7, nameKey: "progress.maneuver.road-merging",     difficulty: "Hard",   icon: <GitMerge  className="h-6 w-6" weight="regular" /> },
];

const DIFFICULTY_TONE: Record<Difficulty, PillTone> = {
  Easy:   "success",
  Medium: "warning",
  Hard:   "danger",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SimulationsPage() {
  const { t } = useLanguage();

  // Fetch how many unique maneuvers this user has completed
  const { data: simStats, isPending: countPending } = useSimStats();
  const totalStations = circuit.stations.length;
  const completedCount = Math.min(simStats?.completed ?? 0, totalStations);
  const completedLabel = t("sim.completedCount", { completed: completedCount }).replace("/8", `/${totalStations}`);

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <header className="page-header">
          <h1 className="page-title">{t("sim.title")}</h1>
          <p className="page-lead">{t("sim.selectManeuver")}</p>
          <p className="text-sm text-muted-foreground">{t("sim.breakNote")}</p>
        </header>
        <div className="surface-card inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-xl border border-border px-4 py-2 font-mono text-sm font-semibold text-foreground font-tabular-nums md:self-auto">
          <Trophy className="h-4 w-4 text-brand-ink dark:text-brand" aria-hidden />
          {countPending ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span>{completedLabel}</span>
          )}
        </div>
      </div>

      {/* Primary hero: full JPJ circuit assessment */}
      <Panel className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Pill tone="brand">{t("sim.mode.assessment")}</Pill>
            <span className="text-xs font-semibold text-muted-foreground font-tabular-nums">
              {totalStations} {t("sim.hud.drills").toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Car className="h-6 w-6 shrink-0 text-foreground" weight="regular" aria-hidden />
            <h2 className="font-heading text-xl font-extrabold text-foreground sm:text-2xl">
              {t("sim.assessment.cardTitle")}
            </h2>
          </div>
          <p className="max-w-readable text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("sim.assessment.cardDesc")}
          </p>
        </div>
        <Button variant="brand" size="lg" asChild className="shrink-0 self-start sm:self-center">
          <Link to={`${ROUTES.SIMULATIONS}/assessment`}>
            {t("sim.mode.startAssessment")}
          </Link>
        </Button>
      </Panel>

      {/* Subordinate section: 7 individual station drills */}
      <section className="space-y-4" aria-labelledby="sim-practice-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="sim-practice-heading" className="font-heading text-lg font-extrabold text-foreground sm:text-xl">
            {t("sim.mode.practice")}
          </h2>
          <span className="text-sm font-semibold text-muted-foreground font-tabular-nums">
            {totalStations} {t("sim.hud.drills").toLowerCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MANEUVERS.map((m) => (
            <Link
              key={m.id}
              to={`${ROUTES.SIMULATIONS}/${m.id}`}
              className="tile group flex min-h-[136px] flex-col gap-3.5 p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
                  {m.icon}
                  <span className="font-mono text-xs font-semibold font-tabular-nums">
                    {String(m.order).padStart(2, "0")}
                  </span>
                </div>
                <Pill tone={DIFFICULTY_TONE[m.difficulty]} className="px-2.5 py-0.5 text-xs font-semibold">
                  {m.difficulty}
                </Pill>
              </div>

              <h3 className="font-heading text-base font-bold leading-snug text-foreground transition-colors group-hover:text-brand-ink dark:group-hover:text-brand">
                {t(m.nameKey)}
              </h3>

              <span className="mt-auto pt-1 text-xs font-semibold text-muted-foreground">
                {t("sim.tapToStart")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Subordinate section: free drive */}
      <section aria-labelledby="sim-free-heading">
        <Link
          to={`${ROUTES.SIMULATIONS}/free`}
          className="tile group flex min-h-[84px] flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3.5 sm:items-center">
            <Compass className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:mt-0" weight="regular" aria-hidden />
            <div className="space-y-0.5">
              <h2 id="sim-free-heading" className="font-heading text-base font-bold text-foreground">
                {t("sim.free.cardTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("sim.free.cardDesc")}</p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
            {t("sim.mode.startFree")}
          </span>
        </Link>
      </section>
    </div>
  );
}
