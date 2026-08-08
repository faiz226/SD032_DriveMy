/**
 * The circuit mark sheet — how the 40 circuit marks are split across the eight
 * JPJ maneuvers, and how many of them the learner currently holds.
 *
 * Marks follow the difficulty the app already records, so the hill start is
 * worth more than the ramp. The allocation is published rather than hidden:
 * a learner deciding what to practise next should be able to see where the
 * marks actually are.
 *
 * Each row's state marking is the same grammar used everywhere else —
 * double solid means locked, broken means open, single solid means done.
 */
import { Link } from "react-router-dom";
import { Lock } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { ROUTES } from "@/lib/constants";
import { CIRCUIT_MARKS, type LicenceStanding } from "@/lib/licence";
import { RoadRule, SectionHead } from "@/components/ui/road";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface CircuitMarksProps {
  standing?: LicenceStanding;
  pending?: boolean;
}

export function CircuitMarks({ standing, pending = false }: CircuitMarksProps) {
  const { t } = useLanguage();

  return (
    <section className="space-y-4">
      {/* The section itself is reachable — seven of its eight rows are what is
          locked, and each row says so with its own marking. */}
      <SectionHead
        state="open"
        action={
          pending || !standing ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <p className="type-figure text-sm text-foreground">
              {t("dashboard.marksShort", {
                earned: String(standing.circuitEarned),
                total: String(CIRCUIT_MARKS),
              })}
            </p>
          )
        }
      >
        {t("dashboard.section.circuit")}
      </SectionHead>

      {standing?.circuitLocked ? (
        <p className="max-w-readable text-sm text-muted-foreground">
          {t("sim.locked.desc")}
        </p>
      ) : null}

      {pending || !standing ? (
        <ul className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>
      ) : (
        <ul>
          {standing.maneuvers.map((row, idx) => {
            const { maneuver, best, passed, earned, unlocked } = row;
            const state = !unlocked ? "locked" : passed ? "closed" : "open";

            const content = (
              <div className="flex items-center gap-3 py-3 sm:gap-4">
                <RoadRule
                  state={state}
                  className="w-8 shrink-0 sm:w-10"
                  srLabel={
                    unlocked
                      ? undefined
                      : t("sim.locked.badge")
                  }
                />
                <p
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    unlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(maneuver.nameKey)}
                  {maneuver.preview && standing.circuitLocked ? (
                    <span className="ml-2 rounded-sm bg-awas px-1.5 py-0.5 text-[11px] font-semibold text-asphalt">
                      {t("sim.preview.badge")}
                    </span>
                  ) : null}
                </p>

                {!unlocked ? (
                  <Lock
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}

                <p className="type-figure w-20 shrink-0 text-right text-sm text-foreground sm:w-24">
                  {best === null ? (
                    <span className="text-muted-foreground">
                      {t("sim.marks", { marks: String(maneuver.marks) })}
                    </span>
                  ) : (
                    t("sim.marksEarned", {
                      earned: String(Math.round(earned * 10) / 10),
                      marks: String(maneuver.marks),
                    })
                  )}
                </p>
              </div>
            );

            return (
              <li key={maneuver.id}>
                {idx > 0 ? <RoadRule state="open" className="opacity-40" /> : null}
                {unlocked ? (
                  <Link
                    to={`${ROUTES.SIMULATIONS}/${maneuver.id}`}
                    className={cn(
                      "block no-underline transition-colors duration-200 ease-out-quart hover:bg-muted",
                      "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]"
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
