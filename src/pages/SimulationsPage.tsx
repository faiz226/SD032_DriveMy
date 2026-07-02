import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Car, Mountains, Square, ArrowsLeftRight,
  Waves, Lightning, Warning, GitMerge, Trophy, ArrowRight
} from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { getSimulationsDone } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/skeleton";
import type { TranslationKey } from "@/lib/translations";

// ── Maneuver definitions ──────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";

interface Maneuver {
  id: string;
  nameKey: TranslationKey;
  difficulty: Difficulty;
  icon: React.ReactNode;
}

const MANEUVERS: Maneuver[] = [
  { id: "hill-start",        nameKey: "progress.maneuver.hill-start",        difficulty: "Hard",   icon: <Mountains        className="w-7 h-7" weight="regular" /> },
  { id: "side-parking",      nameKey: "progress.maneuver.side-parking",      difficulty: "Medium", icon: <Square   className="w-7 h-7" weight="regular" /> },
  { id: "parallel-parking",  nameKey: "progress.maneuver.parallel-parking",  difficulty: "Hard",   icon: <Square   className="w-7 h-7" weight="regular" /> },
  { id: "three-point-turn",  nameKey: "progress.maneuver.three-point-turn",  difficulty: "Medium", icon: <ArrowsLeftRight  className="w-7 h-7" weight="regular" /> },
  { id: "s-curve",           nameKey: "progress.maneuver.s-curve",           difficulty: "Medium", icon: <Waves           className="w-7 h-7" weight="regular" /> },
  { id: "z-curve",           nameKey: "progress.maneuver.z-curve",           difficulty: "Medium", icon: <Lightning             className="w-7 h-7" weight="regular" /> },
  { id: "ramp-test",         nameKey: "progress.maneuver.ramp-test",         difficulty: "Easy",   icon: <Warning   className="w-7 h-7" weight="regular" /> },
  { id: "road-merging",      nameKey: "progress.maneuver.road-merging",      difficulty: "Hard",   icon: <GitMerge           className="w-7 h-7" weight="regular" /> },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy:   "bg-success/15 text-success",
  Medium: "bg-warning/15 text-warning",
  Hard:   "bg-destructive/15 text-destructive",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SimulationsPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();

  // Fetch how many unique maneuvers this user has completed
  const { data: completedCount = 0, isPending: countPending } = useQuery({
    queryKey: ["simsDone", user?.id],
    queryFn: () => getSimulationsDone(user!.id),
    enabled: !!user,
  });

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <header className="page-header">
          <h1 className="page-title">{t("sim.title")}</h1>
          <p className="page-lead">{t("sim.selectManeuver")}</p>
        </header>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border surface-card text-foreground text-sm font-semibold font-mono font-tabular-nums shrink-0 min-h-[38px]">
          <Trophy className="w-4 h-4 text-muted-foreground" />
          {countPending ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span>{t("sim.completedCount", { completed: completedCount })}</span>
          )}
        </div>
      </div>

      {/* Maneuver grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MANEUVERS.map((m) => (
          <Link
            key={m.id}
            to={`${ROUTES.SIMULATIONS}/${m.id}`}
            className="feature-link flex flex-col gap-4 relative group overflow-hidden transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-muted rounded-full text-foreground transition-all duration-200 ease-out-quart group-hover:bg-primary/10 group-hover:text-primary">
                {m.icon}
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider",
                DIFFICULTY_COLORS[m.difficulty]
              )}>
                {m.difficulty}
              </span>
            </div>

            {/* Name */}
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                {t(m.nameKey)}
              </h3>
            </div>

            {/* Status */}
            <div className="mt-auto flex items-center justify-between gap-1.5 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                <span className="font-medium">{t("sim.tapToStart")}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out-quart group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
