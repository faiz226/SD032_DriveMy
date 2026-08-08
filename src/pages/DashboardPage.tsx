/**
 * Papan Pemuka — the dashboard.
 *
 * One job: tell the learner how close they are to passing, and what to do in
 * the next ten minutes. Everything here answers one of those two questions.
 *
 * The road carries the first answer; the Next rule carries the second; the
 * bays are the evidence behind the number. See DESIGN_SYSTEM.md.
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import {
  ROUTES,
  MOCK_TIME_LIMIT,
  MOCK_TOTAL_QUESTIONS,
  TOTAL_SIMULATION_MANEUVERS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Bay, RoadRule, SectionHead, Figure } from "@/components/ui/road";
import { ReadinessRoad } from "@/components/dashboard/ReadinessRoad";
import { CircuitMarks } from "@/components/dashboard/CircuitMarks";
import { getTheoryProgress } from "@/services/progress.service";
import {
  getBestQuizScore,
  getBestMockTestScore,
  getSimulationsDone,
  getRecentActivity,
} from "@/services/analytics.service";
import { useLicence } from "@/hooks/useLicence";
import {
  THEORY_MODULES,
  THEORY_MODULE_MARKS,
  QUIZ_MARKS,
  MOCK_MARKS,
  CIRCUIT_MARKS,
  PAPER_PASS_PERCENT,
} from "@/lib/licence";
import type { TranslationKey } from "@/lib/translations";
import type { BayState } from "@/components/ui/road";

const TOTAL_THEORY_MODULES = 3;

/** Shared query options — this data changes on completion, not on focus. */
const CACHED = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const userId = user?.id;

  const { data: theoryProgress = [], isPending: theoryPending } = useQuery({
    queryKey: ["theoryProgress", userId],
    queryFn: () => getTheoryProgress(userId!),
    enabled: !!userId,
    ...CACHED,
  });

  const { data: quizBest = 0, isPending: quizPending } = useQuery({
    queryKey: ["quizBest", userId],
    queryFn: () => getBestQuizScore(userId!),
    enabled: !!userId,
    ...CACHED,
  });

  const { data: mockBest = 0, isPending: mockPending } = useQuery({
    queryKey: ["mockBest", userId],
    queryFn: () => getBestMockTestScore(userId!),
    enabled: !!userId,
    ...CACHED,
  });

  const { data: simsDone = 0 } = useQuery({
    queryKey: ["simsDone", userId],
    queryFn: () => getSimulationsDone(userId!),
    enabled: !!userId,
    ...CACHED,
  });

  const { data: recentActivity = [], isPending: activityPending } = useQuery({
    queryKey: ["recentActivity", userId],
    queryFn: () => getRecentActivity(userId!),
    enabled: !!userId,
    ...CACHED,
  });

  const { data: standing, isPending: standingPending } = useLicence();

  const theoryCompleted = theoryProgress.filter((p) => p.completed).length;

  // What to do next. Unchanged logic, given a label and a meta line so the
  // learner knows what they are committing to before they tap.
  const next =
    quizBest > 0 && quizBest < 100
      ? {
          route: ROUTES.QUIZ,
          titleKey: "dashboard.resumeTheoryQuiz" as TranslationKey,
          meta: null,
          verbKey: "dashboard.resume" as TranslationKey,
        }
      : mockBest === 0
        ? {
            route: ROUTES.MOCK_TEST,
            titleKey: "dashboard.takeFirstMock" as TranslationKey,
            meta: t("dashboard.mockMeta", {
              minutes: String(Math.round(MOCK_TIME_LIMIT / 60)),
              count: String(MOCK_TOTAL_QUESTIONS),
            }),
            verbKey: "dashboard.start" as TranslationKey,
          }
        : {
            route: ROUTES.SIMULATIONS,
            titleKey: "dashboard.practiceSimulation" as TranslationKey,
            meta: `${simsDone}/${TOTAL_SIMULATION_MANEUVERS}`,
            verbKey: "dashboard.start" as TranslationKey,
          };

  return (
    <div className="page-shell pb-28 md:pb-12 space-y-10 sm:space-y-12">
      {/* No greeting eyebrow. It was the last vestige of the templated
          "Good afternoon, <name>" hero, it answers neither of this page's two
          questions, and the rail already shows who is signed in. */}
      <ReadinessRoad standing={standing} pending={standingPending} />

      {/* ── What to do next ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHead state="open">{t("dashboard.section.next")}</SectionHead>
        <Link
          to={next.route}
          className={cn(
            "group flex items-center gap-4 bay bay-progress px-4 py-4 sm:px-5 sm:py-5",
            "transition-colors duration-200 ease-out-quart hover:bg-muted",
            "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]"
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="type-display text-lg sm:text-xl text-foreground">
              {t(next.titleKey)}
            </p>
            {next.meta ? (
              <p className="type-label mt-1 text-sm text-muted-foreground">
                {next.meta}
              </p>
            ) : null}
          </div>
          <span className="type-label-strong shrink-0 text-sm text-foreground">
            {t(next.verbKey)}
          </span>
          <ArrowRight
            weight="bold"
            className="h-4 w-4 shrink-0 text-foreground transition-transform duration-200 ease-out-quart group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      </section>

      {/* ── The evidence behind the number ──────────────────────────────── */}
      <section className="space-y-4">
        <SectionHead state="open">{t("dashboard.section.record")}</SectionHead>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
          <StatBay
            label={t("dashboard.bay.theory")}
            pending={theoryPending}
            value={t("dashboard.marksShort", {
              earned: String(theoryCompleted * THEORY_MODULE_MARKS),
              total: String(THEORY_MODULES * THEORY_MODULE_MARKS),
            })}
            note={t("dashboard.bay.marksLabel")}
            state={
              theoryCompleted === 0
                ? "open"
                : theoryCompleted >= TOTAL_THEORY_MODULES
                  ? "done"
                  : "progress"
            }
            to={ROUTES.THEORY}
          />
          <StatBay
            label={t("dashboard.bay.quiz")}
            pending={quizPending}
            value={t("dashboard.marksShort", {
              earned: String(Math.round((quizBest / 100) * QUIZ_MARKS * 10) / 10),
              total: String(QUIZ_MARKS),
            })}
            empty={quizBest === 0}
            note={
              quizBest > 0
                ? t("dashboard.bay.marksLabel")
                : t("dashboard.notAttempted")
            }
            state={
              quizBest === 0
                ? "open"
                : quizBest >= PAPER_PASS_PERCENT
                  ? "done"
                  : "progress"
            }
            to={ROUTES.QUIZ}
          />
          <StatBay
            label={t("dashboard.bay.mock")}
            pending={mockPending}
            value={t("dashboard.marksShort", {
              earned: String(Math.round((mockBest / 100) * MOCK_MARKS * 10) / 10),
              total: String(MOCK_MARKS),
            })}
            empty={mockBest === 0}
            note={
              mockBest > 0
                ? t("dashboard.bay.marksLabel")
                : t("dashboard.notAttempted")
            }
            state={
              mockBest === 0
                ? "open"
                : mockBest >= PAPER_PASS_PERCENT
                  ? "done"
                  : "fail"
            }
            to={ROUTES.MOCK_TEST}
          />
          <StatBay
            label={t("dashboard.bay.circuit")}
            pending={standingPending}
            value={t("dashboard.marksShort", {
              earned: String(standing?.circuitEarned ?? 0),
              total: String(CIRCUIT_MARKS),
            })}
            empty={!standing || standing.circuitEarned === 0}
            note={
              standing && standing.circuitEarned > 0
                ? t("dashboard.bay.marksLabel")
                : t("dashboard.notAttempted")
            }
            state={
              !standing || standing.circuitEarned === 0
                ? "open"
                : standing.allManeuversPassed
                  ? "done"
                  : "progress"
            }
            to={ROUTES.SIMULATIONS}
          />
        </div>
      </section>

      {/* ── How the circuit marks are split ─────────────────────────────── */}
      <CircuitMarks standing={standing} pending={standingPending} />

      {/* ── Recent record ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* `open`, not `locked` — an empty history is not a prerequisite you
            have failed to meet, and the grammar has to mean what it says. */}
        <SectionHead state="open">{t("dashboard.recentActivity")}</SectionHead>

        {activityPending ? (
          <ul
            className="space-y-3"
            aria-busy="true"
            aria-label={t("dashboard.recentActivity")}
          >
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </li>
            ))}
          </ul>
        ) : recentActivity.length === 0 ? (
          <p className="max-w-readable text-sm text-muted-foreground">
            {t("dashboard.noActivityDesc")}
          </p>
        ) : (
          <ul>
            {recentActivity.map((activity, idx) => (
              <li key={activity.id}>
                {idx > 0 ? <RoadRule state="open" className="opacity-60" /> : null}
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {activity.title}
                  </p>
                  <p className="type-figure shrink-0 text-base text-foreground">
                    {activity.type === "sim"
                      ? `${activity.score}`
                      : `${activity.score}%`}
                  </p>
                  <p className="type-label shrink-0 text-xs text-muted-foreground w-28 text-right">
                    {formatDistanceToNow(new Date(activity.date), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ── A single kerbed bay in the record grid ───────────────────────────────── */

interface StatBayProps {
  label: string;
  value: string;
  unit?: string;
  note: string;
  state: BayState;
  pending: boolean;
  empty?: boolean;
  to: string;
}

function StatBay({
  label,
  value,
  unit,
  note,
  state,
  pending,
  empty = false,
  to,
}: StatBayProps) {
  return (
    <Link
      to={to}
      className={cn(
        "block no-underline transition-colors duration-200 ease-out-quart",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(var(--background)),0_0_0_5px_rgb(var(--awas))]"
      )}
    >
      <Bay state={state} className="h-full px-4 pt-4 pb-4 hover:bg-muted">
        <p className="type-label text-sm text-muted-foreground">{label}</p>
        {pending ? (
          <Skeleton className="mt-3 h-8 w-16" />
        ) : (
          <Figure
            value={value}
            unit={unit}
            label={note}
            empty={empty}
            size="text-[2rem] sm:text-4xl"
            className="mt-3"
          />
        )}
      </Bay>
    </Link>
  );
}
