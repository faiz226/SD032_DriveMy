import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import NumberFlow from "@number-flow/react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useOverallReadiness, useMockStats, useTheoryProgressStats } from "@/hooks/useProgressStats";
import { getRecentActivity, type ActivityEvent } from "@/services/analytics.service";
import { GantrySign } from "@/components/dashboard/GantrySign";
import { JourneyRoad } from "@/components/shared/JourneyRoad";
import { VmsBoard } from "@/components/dashboard/VmsBoard";
import { TollPlaza, type Lane } from "@/components/dashboard/TollPlaza";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/shared/LoadError";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS, ROUTES, mockPassMark } from "@/lib/constants";
import { dashboardModel, type DashboardModel, type NextStep as NextStepKey } from "@/lib/dashboard/model";
import { readinessContributions } from "@/lib/readiness";
import { learnerKeys } from "@/lib/queryKeys";

const NEXT_ROUTE: Record<NextStepKey, string> = {
  theory: ROUTES.THEORY,
  mock: ROUTES.MOCK_TEST,
  rpk: ROUTES.RPK_RSM,
  quiz: ROUTES.QUIZ,
};

export function DashboardPage() {
  const { t } = useLanguage();
  const user = useAuthStore(s => s.user);
  const readiness = useOverallReadiness();
  const mock = useMockStats();
  const theory = useTheoryProgressStats();
  const activity = useQuery({ queryKey: learnerKeys.activity(user?.id), queryFn: () => getRecentActivity(user!.id), enabled: !!user });
  const queries = [readiness, mock, theory, activity];
  const fullName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
  const name = (fullName || user?.email?.split("@")[0] || t("header.learner")).trim().split(/\s+/).pop() ?? "";

  if (queries.some(q => q.isError)) return <div className="app-container"><LoadError onRetry={() => { queries.forEach(q => { void q.refetch(); }); }} /></div>;
  if (queries.some(q => q.isPending)) {
    return (
      <div className="app-container space-y-8 pt-14" role="status" aria-busy="true" aria-label={t("common.loading")}>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-[22rem] w-full rounded-3xl" />
        <Skeleton className="h-[140px] w-full rounded-3xl" />
      </div>
    );
  }
  const parts = readinessContributions({
    mock: readiness.data?.mockPct ?? 0,
    quiz: readiness.data?.quizPct ?? 0,
    theory: readiness.data?.theoryPct ?? 0,
    sim: readiness.data?.simPct ?? 0,
  });
  return <DashboardView
    name={name}
    score={readiness.data?.composite ?? 0}
    parts={{ theory: parts.mock + parts.quiz + parts.theory, practical: parts.sim }}
    model={dashboardModel({ mock: mock.data, theory: theory.data })}
    activity={activity.data ?? []}
  />;
}

interface DashboardViewProps {
  name: string;
  score: number;
  /** Points earned on each side of the course: theory out of 85, practical out of 15. */
  parts: { theory: number; practical: number };
  model: DashboardModel;
  activity: ActivityEvent[];
}

function helloKey(hour: number) {
  if (hour < 12) return "dashboard.hello.morning" as const;
  if (hour < 15) return "dashboard.hello.afternoon" as const;
  if (hour < 19) return "dashboard.hello.evening" as const;
  return "dashboard.hello.night" as const;
}

const SECTION_TITLE = "mt-14 text-xl font-black tracking-[-0.02em] sm:mt-16 sm:text-2xl";

/** The dashboard itself, from data already loaded. Rendered alone in tests and previews. */
export function DashboardView({ name, score, parts, model, activity }: DashboardViewProps) {
  const { t } = useLanguage();
  const { next, bays, bestMock, headroom, rpkDone, rpkTotal } = model;
  const theoryLanes: Lane[] = [
    {
      sign: "KPP 01",
      title: t("dashboard.bay.kpp.title"),
      description: bestMock ? t("dashboard.bay.kpp.best", { score: bestMock.score, total: bestMock.total_questions }) : t("dashboard.bay.kpp.fresh"),
      to: ROUTES.MOCK_TEST,
      state: bays.kpp,
    },
    { sign: "RPK / RSM", title: "RPK / RSM", description: t("rpk.topicsCompleted", { done: rpkDone, total: rpkTotal }), to: ROUTES.RPK_RSM, state: bays.rpk },
    { sign: "R&R", title: t("dashboard.bay.rules.title"), description: t("dashboard.bay.rules.desc"), to: ROUTES.THEORY, state: bays.rules, info: true },
  ];

  return (
    <div className="app-container pb-16">
      <p className="mt-4 text-sm font-semibold tracking-[-0.005em] text-muted-foreground sm:mt-6 sm:text-[0.9375rem]">
        {t(helloKey(new Date().getHours()))}, <span className="font-extrabold text-foreground">{name}</span>
      </p>

      <GantrySign score={score} theory={parts.theory} practical={parts.practical} bestMock={bestMock?.score} mockTotal={bestMock?.total_questions} passMark={bestMock ? mockPassMark(bestMock.total_questions) : MOCK_PASS_MARK} />
      <JourneyRoad value={score} label={t("dashboard.hero.meter")} lReached={!!bestMock && bestMock.score >= mockPassMark(bestMock.total_questions)} />

      <VmsBoard
        label={t("dashboard.next.label")}
        title={t(`dashboard.next.${next}.title`)}
        detail={t(`dashboard.next.${next}.detail`, { done: rpkDone, total: rpkTotal })}
        action={t(`dashboard.next.${next}.action`)}
        to={NEXT_ROUTE[next]}
      />

      <section aria-labelledby="lanes-title">
        <h2 id="lanes-title" className={`${SECTION_TITLE} mb-6`}>{t("dashboard.lanes.title")}</h2>
        <TollPlaza name={t("dashboard.lanes.theory")} lanes={theoryLanes} firstLane={1} />
      </section>

      <Scoreboard bestMock={bestMock} headroom={headroom} />

      <section aria-labelledby="log-title">
        <h2 id="log-title" className={`${SECTION_TITLE} mb-6`}>{t("dashboard.log.title")}</h2>
        {activity.length
          ? <ul className="panel divide-y divide-border">{activity.slice(0, 5).map(event => <LogRow key={`${event.type}-${event.id}`} event={event} />)}</ul>
          : <p className="panel px-6 py-5 text-muted-foreground">{t("dashboard.noActivityDesc")}</p>}
      </section>

      <p className="mt-8 rounded-2xl border border-info/25 bg-info/15 px-5 py-4 text-[0.9375rem] leading-relaxed">{t("dashboard.note")}</p>
    </div>
  );
}

/** The learner's own best mock on a round sign, and the pass mark as a target on a bar beside it. */
function Scoreboard({ bestMock, headroom }: { bestMock: DashboardModel["bestMock"]; headroom: number | undefined }) {
  const { t } = useLanguage();
  const total = bestMock?.total_questions ?? MOCK_TOTAL_QUESTIONS;
  const passMark = bestMock ? mockPassMark(total) : MOCK_PASS_MARK;
  const score = bestMock?.score ?? 0;
  const passed = headroom !== undefined && headroom >= 0;
  const fillRatio = total > 0 ? Math.min(1, Math.max(0, score / total)) : 0;
  return (
    <section aria-labelledby="score-title">
      <h2 id="score-title" className={SECTION_TITLE}>{t("dashboard.score.title")}</h2>
      <p className="mb-6 mt-1 text-muted-foreground">{t("dashboard.score.lead")}</p>
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div className="grid justify-items-center gap-3 text-center">
          <div
            role="img"
            className="grid aspect-square w-[min(100%,12rem)] place-items-center rounded-full border-[14px] border-[#15181d] bg-white text-[2.75rem] font-black tabular-nums tracking-[-0.04em] text-[#111] shadow-[0_0_0_3px_#fff,0_8px_20px_-10px_rgb(11_26_42/0.35)] sm:text-5xl"
            aria-label={bestMock ? t("dashboard.score.bestOf", { score, total }) : t("dashboard.score.none")}
          >
            {bestMock ? <NumberFlow value={score} /> : "–"}
          </div>
          <p className="max-w-[18ch] text-sm text-muted-foreground">{bestMock ? t("dashboard.score.best", { total }) : t("dashboard.score.none")}</p>
          {!bestMock && (
            <Link to={ROUTES.MOCK_TEST} className="inline-flex min-h-11 items-center rounded-lg border-2 border-foreground px-4 text-sm font-extrabold no-underline transition-colors hover:bg-foreground/10 active:scale-[0.98] motion-reduce:active:scale-100">
              {t("dashboard.score.take")}
            </Link>
          )}
        </div>
        <div className="panel grid gap-3 px-5 py-5">
          {bestMock
            ? <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-semibold">{t("dashboard.score.passMarkIs", { pass: passMark })}</span>
              <span className={passed ? "text-sm font-bold text-success" : "text-sm font-bold text-muted-foreground"}>
                {t(passed ? "dashboard.score.above" : "dashboard.score.short", { n: Math.abs(headroom ?? 0) })}
              </span>
            </p>
            : <p className="text-muted-foreground">{t("dashboard.score.passNote", { pass: passMark, total })}</p>}
          <div className="relative h-4 rounded-full bg-muted" role="img" aria-label={t("dashboard.score.barLabel", { score, total, pass: passMark })}>
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <span
                className={`block h-full w-full origin-left rounded-full transition-transform duration-500 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none ${passed ? "bg-success" : "bg-brand"}`}
                style={{ transform: `scaleX(${fillRatio})` }}
              />
            </span>
            <span aria-hidden="true" className="absolute -inset-y-1.5 w-1 -translate-x-1/2 rounded-full bg-foreground" style={{ left: `${(passMark / total) * 100}%` }} />
          </div>
          <div aria-hidden="true" className="flex justify-between text-xs tabular-nums text-muted-foreground"><span>0</span><span>{total}</span></div>
        </div>
      </div>
    </section>
  );
}

function LogRow({ event }: { event: ActivityEvent }) {
  const { language, t } = useLanguage();
  const date = event.date ? new Date(event.date) : null;
  const valid = date !== null && !Number.isNaN(+date);
  const label = t(event.type === "sim" ? "nav.simulator" : event.type === "mock" ? "nav.mockTest" : "nav.quiz");
  return (
    <li className="flex justify-between gap-3 px-6 py-4">
      <p className="min-w-0 font-semibold">{label}, <span className="tabular-nums">{event.score}{event.type === "sim" ? ` ${t("common.points")}` : "%"}</span></p>
      <time className="shrink-0 whitespace-nowrap text-muted-foreground" dateTime={valid ? date.toISOString() : undefined}>
        {valid ? date.toLocaleDateString(language === "ms" ? "ms-MY" : "en-MY", { day: "numeric", month: "short", year: "numeric" }) : t("dashboard.activity.noDate")}
      </time>
    </li>
  );
}
