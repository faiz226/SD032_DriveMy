import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NumberFlow from "@number-flow/react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useOverallReadiness, useMockStats, useTheoryProgress } from "@/hooks/useProgressStats";
import { getRecentActivity, type ActivityEvent } from "@/services/analytics.service";
import { GantrySign } from "@/components/dashboard/GantrySign";
import { JourneyRoad } from "@/components/dashboard/JourneyRoad";
import { VmsBoard } from "@/components/dashboard/VmsBoard";
import { TollPlaza, type Lane } from "@/components/dashboard/TollPlaza";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/shared/LoadError";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS, ROUTES } from "@/lib/constants";
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
  const theory = useTheoryProgress();
  const activity = useQuery({ queryKey: learnerKeys.activity(user?.id), queryFn: () => getRecentActivity(user!.id), enabled: !!user });
  const queries = [readiness, mock, theory, activity];
  const fullName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
  const name = (fullName || user?.email?.split("@")[0] || t("header.learner")).trim().split(/\s+/).pop() ?? "";

  if (queries.some(q => q.isError)) return <div className="app-container"><LoadError onRetry={() => { queries.forEach(q => { void q.refetch(); }); }} /></div>;
  if (queries.some(q => q.isPending)) {
    return (
      <div className="app-container space-y-8 pt-14" aria-busy="true" aria-label={t("common.loading")}>
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

const SECTION_TITLE = "mt-16 text-[1.75rem] font-black tracking-[-0.02em]";

/** The dashboard itself, from data already loaded. Rendered alone in tests and previews. */
export function DashboardView({ name, score, parts, model, activity }: DashboardViewProps) {
  const { t } = useLanguage();
  const { next, bays, bestMock, headroom, rpkDone, rpkTotal } = model;
  const theoryLanes: Lane[] = [
    {
      sign: "KPP 01",
      title: t("dashboard.bay.kpp.title"),
      description: bestMock ? t("dashboard.bay.kpp.best", { score: bestMock.score, total: MOCK_TOTAL_QUESTIONS }) : t("dashboard.bay.kpp.fresh"),
      to: ROUTES.MOCK_TEST,
      state: bays.kpp,
    },
    { sign: "RPK / RSM", title: "RPK / RSM", description: t("rpk.topicsCompleted", { done: rpkDone, total: rpkTotal }), to: ROUTES.RPK_RSM, state: bays.rpk },
    { sign: "R&R", title: t("dashboard.bay.rules.title"), description: t("dashboard.bay.rules.desc"), to: ROUTES.THEORY, state: bays.rules, info: true },
  ];
  const practicalLanes: Lane[] = [
    { sign: t("dashboard.lane.hill"), title: t("dashboard.bay.hill.title"), description: t("dashboard.bay.hill.desc"), to: `${ROUTES.SIMULATIONS}/hill-start`, state: "open" },
    { sign: t("dashboard.lane.circuit"), title: t("dashboard.bay.circuit.title"), description: t("dashboard.bay.circuit.desc"), to: ROUTES.SIMULATIONS, state: "open" },
    { sign: t("dashboard.lane.parking"), title: t("dashboard.bay.parallel.title"), description: t("dashboard.bay.parallel.desc"), to: `${ROUTES.SIMULATIONS}/parallel-parking`, state: "open" },
  ];

  return (
    <div className="app-container page-enter pb-16">
      <p className="mt-6 text-[1.5rem] font-extrabold leading-tight tracking-[-0.01em] sm:mt-10 sm:text-[1.625rem]">
        <span className="font-semibold text-muted-foreground">{t(helloKey(new Date().getHours()))}</span>, {name}.
      </p>

      <GantrySign score={score} theory={parts.theory} practical={parts.practical} bestMock={bestMock?.score} passMark={MOCK_PASS_MARK} />

      {/* The next step sits right under the sign so a phone shows it without
          scrolling past the road; the road then runs on into the toll plaza. */}
      <VmsBoard
        label={t("dashboard.next.label")}
        title={t(`dashboard.next.${next}.title`)}
        detail={t(`dashboard.next.${next}.detail`, { done: rpkDone, total: rpkTotal })}
        action={t(`dashboard.next.${next}.action`)}
        to={NEXT_ROUTE[next]}
      />
      <JourneyRoad value={score} label={t("dashboard.hero.meter")} />

      <section aria-labelledby="lanes-title">
        <h2 id="lanes-title" className={SECTION_TITLE}>{t("dashboard.lanes.title")}</h2>
        <p className="mb-6 mt-1 text-muted-foreground">{t("dashboard.lanes.lead")}</p>
        <div className="space-y-8">
          <TollPlaza name={t("dashboard.lanes.theory")} lanes={theoryLanes} firstLane={1} />
          <TollPlaza name={t("dashboard.lanes.practical")} lanes={practicalLanes} firstLane={4} />
        </div>
      </section>

      <section aria-labelledby="score-title">
        <h2 id="score-title" className={SECTION_TITLE}>{t("dashboard.score.title")}</h2>
        <p className="mb-6 mt-1 text-muted-foreground">{t("dashboard.score.lead")}</p>
        <div className="grid grid-cols-2 items-center gap-6 lg:grid-cols-4">
          <dl className="contents">
            <RoundSign value={MOCK_PASS_MARK} caption={t("dashboard.score.passMark")} />
            <RoundSign value={bestMock?.score} caption={bestMock ? t("dashboard.score.best") : t("dashboard.score.none")} />
            <RoundSign
              value={headroom}
              signed
              caption={headroom === undefined ? t("dashboard.score.none") : t(headroom < 0 ? "dashboard.score.short" : "dashboard.score.above")}
            />
          </dl>
          <RoadTip />
        </div>
      </section>

      <section aria-labelledby="log-title">
        <h2 id="log-title" className={`${SECTION_TITLE} mb-6`}>{t("dashboard.log.title")}</h2>
        {activity.length
          ? <ul className="panel divide-y divide-border">{activity.slice(0, 5).map(event => <LogRow key={`${event.type}-${event.id}`} event={event} />)}</ul>
          : <p className="panel px-6 py-5 text-muted-foreground">{t("dashboard.noActivityDesc")}</p>}
      </section>

      <p className="mt-8 rounded-2xl bg-info/20 px-5 py-4 text-[0.9375rem]">{t("dashboard.note")}</p>
    </div>
  );
}

/** A stat on a round sign: white disc, dark ring, like a speed-limit plate. */
function RoundSign({ value, caption, signed }: { value: number | undefined; caption: string; signed?: boolean }) {
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <dt className="order-2 max-w-[18ch] text-sm text-muted-foreground">{caption}</dt>
      <dd className="order-1 grid aspect-square w-[min(100%,10rem)] place-items-center rounded-full border-[14px] border-[#15181d] bg-white text-[2.75rem] font-black tabular-nums tracking-[-0.04em] text-[#111] shadow-[0_0_0_3px_#fff,0_12px_30px_-10px_#000] sm:text-5xl">
        {value === undefined ? "-" : <NumberFlow value={value} format={{ signDisplay: signed ? "exceptZero" : "auto" }} />}
      </dd>
    </div>
  );
}

/** The brown tourist-sign tip card, with a button for another tip. */
function RoadTip() {
  const { t } = useLanguage();
  const tips = [t("dashboard.tip.1"), t("dashboard.tip.2"), t("dashboard.tip.3")];
  const [index, setIndex] = useState(0);
  return (
    <div className="col-span-2 grid min-h-[11.25rem] content-center gap-2.5 rounded-[0.875rem] bg-[#6A4220] p-[1.375rem] text-white shadow-[inset_0_0_0_3px_#6A4220,inset_0_0_0_5px_#fff] lg:col-span-1">
      <p className="text-lg font-extrabold">{t("dashboard.tip.title")}</p>
      <p aria-live="polite">{tips[index % tips.length]}</p>
      <button
        type="button"
        onClick={() => setIndex(i => i + 1)}
        className="min-h-11 justify-self-start rounded-lg border-2 border-white px-3.5 text-sm font-extrabold transition-colors hover:bg-white/10"
      >
        {t("dashboard.tip.next")}
      </button>
    </div>
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
