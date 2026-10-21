import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowsLeftRight, Book, BookOpen, Car, Clipboard, ClipboardText, Mountains, Path, Wrench } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useOverallReadiness, useMockStats, useTheoryProgress } from "@/hooks/useProgressStats";
import { getRecentActivity, type ActivityEvent } from "@/services/analytics.service";
import { ReadinessRoad } from "@/components/dashboard/ReadinessRoad";
import { NextStep } from "@/components/dashboard/NextStep";
import { LearningBay } from "@/components/dashboard/LearningBay";
import { Plate, Figure } from "@/components/ui/road";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/shared/LoadError";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS, ROUTES } from "@/lib/constants";
import { dashboardModel, type DashboardModel, type NextStep as NextStepKey } from "@/lib/dashboard/model";
import { learnerKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

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
  if (queries.some(q => q.isError)) return <div className="jalan-container"><LoadError onRetry={() => { queries.forEach(q => { void q.refetch(); }); }}/></div>;
  if (queries.some(q => q.isPending)) return <div className="jalan-container space-y-4" aria-busy="true" aria-label={t("common.loading")}><Skeleton className="h-96 w-full"/><div className="learning-grid">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48"/>)}</div></div>;
  return <DashboardView
    score={readiness.data?.composite ?? 0}
    model={dashboardModel({ mock: mock.data, theory: theory.data })}
    activity={activity.data ?? []}
  />;
}

interface DashboardViewProps {
  score: number;
  model: DashboardModel;
  activity: ActivityEvent[];
}

/** The dashboard itself, from data already loaded. Rendered alone in tests and previews. */
export function DashboardView({ score, model, activity }: DashboardViewProps) {
  const { t } = useLanguage();
  const { next, bays, progressLabels, bestMock, headroom, rpkDone, rpkTotal } = model;
  return <div className="jalan-container space-y-4">
    <ReadinessRoad value={score}>
      <NextStep
        label={t("dashboard.next.label")}
        title={t(`dashboard.next.${next}.title`)}
        detail={t(`dashboard.next.${next}.detail`, { done: rpkDone, total: rpkTotal })}
        action={t(`dashboard.next.${next}.action`)}
        to={NEXT_ROUTE[next]}
      />
    </ReadinessRoad>

    <section aria-labelledby="learning-title" className="pt-2">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="learning-title" className="type-display text-xl">{t("dashboard.bays.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("dashboard.bays.lead")}</p>
      </div>
      <div className="learning-grid">
        <LearningBay title={t("dashboard.bay.kpp.title")} to={ROUTES.MOCK_TEST} icon={ClipboardText} state={bays.kpp} progressLabel={progressLabels.kpp}
          description={bestMock ? t("dashboard.bay.kpp.best", { score: bestMock.score, total: MOCK_TOTAL_QUESTIONS }) : t("dashboard.bay.kpp.fresh")}/>
        <LearningBay title="RPK / RSM" to={ROUTES.RPK_RSM} icon={Wrench} state={bays.rpk} progressLabel={progressLabels.rpk}
          description={t("rpk.topicsCompleted", { done: rpkDone, total: rpkTotal })}/>
        <LearningBay title={t("dashboard.bay.circuit.title")} to={ROUTES.SIMULATIONS} icon={Path} description={t("dashboard.bay.circuit.desc")}/>
        <LearningBay title={t("dashboard.bay.hill.title")} to={`${ROUTES.SIMULATIONS}/hill-start`} icon={Mountains} description={t("dashboard.bay.hill.desc")}/>
        <LearningBay title={t("dashboard.bay.parallel.title")} to={`${ROUTES.SIMULATIONS}/parallel-parking`} icon={ArrowsLeftRight} description={t("dashboard.bay.parallel.desc")}/>
        <LearningBay title={t("dashboard.bay.rules.title")} to={ROUTES.THEORY} icon={BookOpen} info state={bays.rules} progressLabel={progressLabels.rules} description={t("dashboard.bay.rules.desc")}/>
      </div>
    </section>

    <div className="dashboard-deck pt-2">
      <Plate className="p-5">
        <h2 className="type-label-strong text-xl">{t("dashboard.perf.title")}</h2>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          <PerformanceFigure label={t("dashboard.perf.passMark")} value={MOCK_PASS_MARK} caption={`/ ${MOCK_TOTAL_QUESTIONS}`}/>
          <PerformanceFigure label={t("dashboard.perf.best")} value={bestMock?.score ?? "—"} caption={bestMock ? `/ ${bestMock.total_questions}` : ""}/>
          <PerformanceFigure
            label={t("dashboard.perf.headroom")}
            value={headroom === undefined ? "—" : headroom > 0 ? `+${headroom}` : headroom < 0 ? `−${-headroom}` : "0"}
            caption={headroom === undefined ? "" : `${t("dashboard.perf.marks")} ${t(headroom < 0 ? "dashboard.perf.short" : "dashboard.perf.above")}`}
            tone={headroom === undefined || headroom === 0 ? undefined : headroom < 0 ? "fail" : "pass"}
          />
        </dl>
        <p className="mt-5 text-xs text-muted-foreground">{t("dashboard.perf.note")}</p>
      </Plate>
      <Plate className="p-5">
        <h2 className="type-label-strong text-xl">{t("dashboard.activity.title")}</h2>
        {!activity.length
          ? <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.noActivityDesc")}</p>
          : <ul className="mt-2 divide-y divide-border">{activity.slice(0, 3).map(event => <ActivityRow key={`${event.type}-${event.id}`} event={event}/>)}</ul>}
        <Link to={ROUTES.PROGRESS} className="mt-2 inline-flex min-h-12 items-center gap-2 text-sm font-semibold">{t("dashboard.activity.all")}<ArrowRight size={16} weight="bold" aria-hidden="true"/></Link>
      </Plate>
    </div>
  </div>;
}

function PerformanceFigure({ label, value, caption, tone }: { label: string; value: string | number; caption: string; tone?: "pass" | "fail" }) {
  return <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-2">
      <Figure className={cn("block text-[clamp(2rem,3vw,3rem)] leading-none", tone === "pass" && "text-success", tone === "fail" && "text-destructive")}>{value}</Figure>
      <span className="mt-1 block text-sm text-muted-foreground">{caption}</span>
    </dd>
  </div>;
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const { language, t } = useLanguage();
  const Icon = event.type === "sim" ? Car : event.type === "mock" ? Clipboard : Book;
  const date = event.date ? new Date(event.date) : null;
  const valid = date !== null && !Number.isNaN(+date);
  return <li className="flex gap-3 py-3">
    <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0"/>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{t(event.type === "sim" ? "nav.simulator" : event.type === "mock" ? "nav.mockTest" : "nav.quiz")}</p>
      <p className="text-xs text-muted-foreground">{event.score}{event.type === "sim" ? ` ${t("common.points")}` : "%"}</p>
    </div>
    <time className="shrink-0 text-right text-xs text-muted-foreground" dateTime={valid ? date.toISOString() : undefined}>
      {valid ? date.toLocaleDateString(language === "ms" ? "ms-MY" : "en-MY", { day: "numeric", month: "short" }) : t("dashboard.activity.noDate")}
    </time>
  </li>;
}
