/**
 * Litar JPJ — the circuit.
 *
 * The eight maneuvers are gated behind the L licence, because that is the real
 * order: you sit the KPP paper, you get your L, and only then do you go near
 * the circuit. One maneuver stays open as a preview so the simulator is never
 * a locked black box to someone deciding whether the app is worth their time.
 *
 * The maneuver list itself lives in `lib/licence.ts` — this page renders it,
 * it does not own it, so marks and gating cannot drift from the dashboard.
 */
import { Link } from "react-router-dom";
import { Lock, ArrowRight, Car } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { CIRCUIT_MARKS, MANEUVERS, type Difficulty } from "@/lib/licence";
import { useLicence } from "@/hooks/useLicence";
import { Bay, LPlate, RoadRule, SectionHead } from "@/components/ui/road";
import { Skeleton } from "@/components/ui/skeleton";

/** Difficulty is stated in words; the marks carry the weight. */
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  Easy: "Easy",
  Medium: "Medium",
  Hard: "Hard",
};

export function SimulationsPage() {
  const { t } = useLanguage();
  const { data: standing, isPending } = useLicence();

  const byId = new Map(
    (standing?.maneuvers ?? []).map((m) => [m.maneuver.id, m])
  );

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <header className="max-w-readable space-y-2">
        <h1 className="page-title">{t("sim.title")}</h1>
        <p className="page-lead">
          {t("dashboard.road.split", {
            paper: String(100 - CIRCUIT_MARKS),
            circuit: String(CIRCUIT_MARKS),
          })}
        </p>
      </header>

      {/* ── Locked notice ─────────────────────────────────────────────────── */}
      {standing?.circuitLocked ? (
        <Bay state="progress" className="flex items-start gap-4 px-5 py-5">
          <LPlate letter="L" size={34} earned={false} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="type-display text-base text-foreground sm:text-lg">
              {t("sim.locked.title")}
            </p>
            <p className="mt-1.5 max-w-readable text-sm text-muted-foreground">
              {t("sim.locked.desc")}
            </p>
            <Link
              to={ROUTES.MOCK_TEST}
              className="inline-link mt-3 inline-flex items-center gap-2 text-sm font-medium text-foreground"
            >
              {t("dashboard.takeMockTest")}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </Bay>
      ) : null}

      {/* ── The eight ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* The section itself is reachable — seven of its eight rows are what is
            locked, and each row says so with its own marking. */}
        <SectionHead
          state="open"
          action={
            isPending || !standing ? (
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {MANEUVERS.map((m) => {
            const row = byId.get(m.id);
            const unlocked = row?.unlocked ?? false;
            const passed = row?.passed ?? false;
            const best = row?.best ?? null;
            const earned = row?.earned ?? 0;

            const body = (
              <Bay
                state={passed ? "done" : unlocked ? "open" : "default"}
                className={cn(
                  "flex h-full flex-col gap-3 px-4 py-4",
                  unlocked
                    ? "transition-colors duration-200 ease-out-quart hover:bg-muted"
                    : "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="type-label text-xs text-muted-foreground">
                    {DIFFICULTY_LABEL[m.difficulty]}
                  </p>
                  {!unlocked ? (
                    <Lock
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : m.preview && standing?.circuitLocked ? (
                    <span className="rounded-sm bg-awas px-1.5 py-0.5 text-[11px] font-semibold text-asphalt">
                      {t("sim.preview.badge")}
                    </span>
                  ) : null}
                </div>

                <h3 className="type-display text-base text-foreground">
                  {t(m.nameKey)}
                </h3>

                <RoadRule
                  state={!unlocked ? "locked" : passed ? "closed" : "open"}
                  className="opacity-50"
                />

                <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
                  <p className="type-figure text-lg text-foreground">
                    {best === null
                      ? t("sim.marks", { marks: String(m.marks) })
                      : t("sim.marksEarned", {
                          earned: String(Math.round(earned * 10) / 10),
                          marks: String(m.marks),
                        })}
                  </p>
                  {unlocked ? (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Car className="h-3.5 w-3.5" aria-hidden />
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  ) : null}
                </div>
              </Bay>
            );

            return unlocked ? (
              <Link
                key={m.id}
                to={`${ROUTES.SIMULATIONS}/${m.id}`}
                className={cn(
                  "block no-underline",
                  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]"
                )}
              >
                {body}
              </Link>
            ) : (
              <div key={m.id} aria-disabled className="block">
                {body}
                <span className="sr-only">{t("sim.locked.badge")}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
