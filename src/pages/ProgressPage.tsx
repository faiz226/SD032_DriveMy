import { Link } from "react-router-dom";
import { CaretRight, CheckCircle } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useBestColorVisionScore,
  useMockStats,
  useOverallReadiness,
  useQuizStats,
  useSimStats,
  useTheoryProgressStats,
} from "@/hooks/useProgressStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/ui/surface";
import { ReadinessDonut } from "@/components/progress/ReadinessDonut";
import { ScoreTrendChart } from "@/components/progress/ScoreTrendChart";
import { CategoryBreakdownBar } from "@/components/progress/CategoryBreakdownBar";
import { ManeuverScoresBar } from "@/components/progress/ManeuverScoresBar";
import { AttemptList, type Attempt } from "@/components/progress/AttemptList";
import { LoadError } from "@/components/shared/LoadError";
import { countRpkCompleted, RPK_TOPICS } from "@/content/rpk-rsm";
import { bestFullMock } from "@/lib/dashboard/model";
import { LEGACY_MOCK_TOTAL, MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS, ROUTES, TOTAL_SIMULATION_MANEUVERS, mockPassMark } from "@/lib/constants";
import type { TranslationKey } from "@/lib/translations";
import type { MockTestResult, QuizResult, SimulationResult } from "@/types/database";
import { cn } from "@/lib/utils";

const PASS_PERCENT = Math.round((MOCK_PASS_MARK / MOCK_TOTAL_QUESTIONS) * 100);

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  "road-signs": "progress.category.road-signs",
  "traffic-rules": "progress.category.traffic-rules",
  "safety-principles": "progress.category.safety-principles",
};

const STATION_KEYS: Record<string, TranslationKey> = {
  "hill-start": "progress.maneuver.hill-start",
  "side-parking": "progress.maneuver.side-parking",
  "parallel-parking": "progress.maneuver.parallel-parking",
  "three-point-turn": "progress.maneuver.three-point-turn",
  "s-curve": "progress.maneuver.s-curve",
  "z-curve": "progress.maneuver.z-curve",
  "ramp-test": "progress.maneuver.ramp-test",
  "road-merging": "progress.maneuver.road-merging",
};

const minutes = (seconds: number | null | undefined) => (seconds ? Math.max(1, Math.round(seconds / 60)) : 0);

interface StandRow {
  label: string;
  value: string;
  note: string;
  done: boolean;
  to: string;
}

export function ProgressPage() {
  const { t } = useLanguage();
  const readinessQ = useOverallReadiness();
  const mockQ = useMockStats();
  const quizQ = useQuizStats();
  const simQ = useSimStats();
  const theoryQ = useTheoryProgressStats();
  const colorQ = useBestColorVisionScore();
  const queries = [readinessQ, mockQ, quizQ, simQ, theoryQ, colorQ];

  const header = (
    <header className="page-header">
      <h1 className="page-title">{t("progress.title")}</h1>
      <p className="page-lead">{t("progress.lead")}</p>
    </header>
  );

  if (queries.some(q => q.isError)) {
    return <div className="page-shell">{header}<LoadError onRetry={() => queries.forEach(q => { void q.refetch(); })} /></div>;
  }
  if (queries.some(q => q.isPending)) {
    return (
      <div className="page-shell" aria-busy="true" aria-label={t("common.loading")}>
        {header}
        <div className="grid gap-[var(--panel-gap)] lg:grid-cols-[20rem_1fr]">
          <Skeleton className="h-80 rounded-[var(--radius-panel)]" />
          <Skeleton className="h-80 rounded-[var(--radius-panel)]" />
        </div>
        <Skeleton className="h-64 rounded-[var(--radius-panel)]" />
      </div>
    );
  }

  const readiness = readinessQ.data!;
  const mock = mockQ.data!;
  const quiz = quizQ.data!;
  const sim = simQ.data!;
  const theory = theoryQ.data!;
  const colorBest = colorQ.data;

  const mockRows = mock.history as MockTestResult[];
  const quizRows = quiz.history as QuizResult[];
  const simRuns = sim.history as SimulationResult[];

  const bestMock = bestFullMock(mockRows);
  const bestPassMark = bestMock ? mockPassMark(bestMock.total_questions) : MOCK_PASS_MARK;
  const quizTopics = ("categoryPerformance" in quiz ? quiz.categoryPerformance : undefined) ?? [];
  const weakest = quizTopics.filter(c => c.attempts > 0).sort((a, b) => a.averageScore - b.averageScore)[0];
  const categoryName = (id: string) => (CATEGORY_KEYS[id] ? t(CATEGORY_KEYS[id]) : id);
  const rpkDone = countRpkCompleted(theory.byModule);

  const stand: StandRow[] = [
    {
      label: t("progress.stand.mock"),
      value: bestMock ? `${bestMock.score} / ${bestMock.total_questions}` : "-",
      note: bestMock ? t("progress.stand.mockNote", { pass: bestPassMark, total: bestMock.total_questions, count: mock.count }) : t("progress.stand.mockNone"),
      done: !!bestMock && bestMock.score >= bestPassMark,
      to: ROUTES.MOCK_TEST,
    },
    {
      label: t("progress.stand.quiz"),
      value: quiz.count ? `${Math.round(quiz.average)}%` : "-",
      note: weakest ? t("progress.stand.quizNote", { count: quiz.count, topic: categoryName(weakest.category), score: weakest.averageScore }) : t("progress.stand.quizNone"),
      done: quiz.count > 0 && quiz.average >= PASS_PERCENT,
      to: ROUTES.QUIZ,
    },
    {
      label: t("progress.stand.learn"),
      value: `${theory.completedModules} / ${theory.totalModules}`,
      note: t("progress.stand.learnNote"),
      done: theory.completedModules === theory.totalModules,
      to: ROUTES.THEORY,
    },
    {
      label: "RPK / RSM",
      value: `${rpkDone} / ${RPK_TOPICS.length}`,
      note: t("progress.stand.rpkNote"),
      done: rpkDone === RPK_TOPICS.length,
      to: ROUTES.RPK_RSM,
    },
    {
      label: t("progress.stand.sim"),
      value: `${sim.cleared} / ${TOTAL_SIMULATION_MANEUVERS}`,
      note: t("progress.stand.simNote"),
      done: sim.cleared === TOTAL_SIMULATION_MANEUVERS,
      to: ROUTES.SIMULATIONS,
    },
    {
      label: t("progress.stand.color"),
      value: colorBest === null || colorBest === undefined ? t("progress.stand.colorNone") : t("progress.stand.colorDone"),
      note: t("progress.stand.colorNote"),
      done: colorBest !== null && colorBest !== undefined,
      to: ROUTES.COLOR_VISION,
    },
  ];

  const taken = (seconds: number | null | undefined) => (minutes(seconds) ? [t("common.minutes", { count: minutes(seconds) })] : []);

  const mockLabel = (row: MockTestResult) => {
    if (row.total_questions === LEGACY_MOCK_TOTAL) return t("progress.mock.legacy");
    const match = /^mock-(da|d)-combined-(\d+)$/.exec(row.set_id);
    return match ? t("progress.mock.set", { num: match[2], track: match[1].toUpperCase() }) : t("progress.mock.generic");
  };

  const mockAttempts: Attempt[] = mockRows.map(row => ({
    id: row.id,
    date: row.completed_at,
    title: mockLabel(row),
    score: `${row.score} / ${row.total_questions}`,
    details: [t("progress.passMarkOf", { pass: mockPassMark(row.total_questions) }), ...taken(row.duration_seconds)],
    passed: Boolean(row.passed),
  }));

  const quizAttempts: Attempt[] = quizRows.map(row => ({
    id: row.id,
    date: row.completed_at,
    title: t("progress.quiz.title", { topic: categoryName(row.quiz_title) }),
    score: `${row.score} / ${row.total_questions}`,
    details: taken(row.duration_seconds),
  }));

  const simAttempts: Attempt[] = simRuns.map(row => {
    const stations = (row.attempt_data as { stations?: { status: string }[] } | null)?.stations;
    const isRun = Array.isArray(stations);
    return {
      id: row.id,
      date: row.completed_at,
      title: isRun ? t("progress.sim.run") : STATION_KEYS[row.maneuver_id] ? t(STATION_KEYS[row.maneuver_id]) : row.maneuver_id,
      score: isRun ? t("progress.sim.cleared", { done: stations.filter(s => s.status === "cleared").length, total: stations.length }) : `${row.score}%`,
      details: [t("progress.sim.faults", { count: row.errors ?? 0 }), ...taken(row.completion_seconds)],
      passed: Boolean(row.passed),
    };
  });

  return (
    <div className="page-shell page-enter">
      {header}

      <div className="grid items-start gap-[var(--panel-gap)] lg:grid-cols-[20rem_1fr]">
        <Panel className="p-5 sm:p-6">
          <h2 className="text-xl">{t("progress.score.title")}</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">{t("progress.score.lead")}</p>
          <ReadinessDonut {...readiness} />
        </Panel>

        <Panel className="p-5 sm:p-6">
          <h2 className="text-xl">{t("progress.stand.title")}</h2>
          <ul className="mt-3 divide-y divide-border">
            {stand.map(row => (
              <li key={row.label}>
                <Link to={row.to} className="group -mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-3 text-foreground no-underline transition-base hover:bg-muted/60">
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", row.done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                    {row.done ? <CheckCircle size={18} aria-label={t("progress.completed")} /> : <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-current opacity-60" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{row.label}</span>
                    <span className="block text-sm text-muted-foreground">{row.note}</span>
                  </span>
                  <span className="type-figure shrink-0 text-lg">{row.value}</span>
                  <CaretRight size={16} className="shrink-0 opacity-40 transition-base group-hover:translate-x-0.5 group-hover:opacity-80" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <section aria-labelledby="progress-history" className="space-y-4">
        <h2 id="progress-history" className="text-[1.75rem]">{t("progress.history.title")}</h2>
        <Tabs defaultValue="mocks">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="mocks" className="min-h-11 flex-1 sm:flex-none">{t("progress.tab.mocks")}</TabsTrigger>
            <TabsTrigger value="quizzes" className="min-h-11 flex-1 sm:flex-none">{t("progress.tab.quizzes")}</TabsTrigger>
            <TabsTrigger value="sim" className="min-h-11 flex-1 sm:flex-none">{t("progress.tab.simulations")}</TabsTrigger>
          </TabsList>

          <TabsContent value="mocks">
            <Panel className="space-y-6 p-5 sm:p-6">
              {mock.trend.length >= 2 && (
                <ScoreTrendChart data={mock.trend} label={t("progress.chart.mockTrend")} limit={10} passMark={PASS_PERCENT} />
              )}
              <AttemptList items={mockAttempts} empty={t("progress.noMockAttempts")} />
            </Panel>
          </TabsContent>

          <TabsContent value="quizzes">
            <Panel className="space-y-6 p-5 sm:p-6">
              {quiz.count > 0 && (
                <div>
                  <h3 className="mb-3 text-lg">{t("progress.categoryPerformance")}</h3>
                  <CategoryBreakdownBar data={quizTopics} />
                </div>
              )}
              {quiz.trend.length >= 2 && (
                <ScoreTrendChart data={quiz.trend.map(point => ({ ...point, title: point.title ? categoryName(point.title) : undefined }))} label={t("progress.chart.quizTrend")} limit={20} />
              )}
              <AttemptList items={quizAttempts} empty={t("progress.noQuizAttempts")} />
            </Panel>
          </TabsContent>

          <TabsContent value="sim">
            <Panel className="space-y-6 p-5 sm:p-6">
              {sim.byManeuver.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg">{t("progress.bestScoresByManeuver")}</h3>
                  <ManeuverScoresBar data={sim.byManeuver} />
                </div>
              )}
              <AttemptList items={simAttempts} empty={t("progress.noSimAttempts")} />
            </Panel>
          </TabsContent>
        </Tabs>
      </section>

      <p className="rounded-2xl bg-info/20 px-5 py-4">{t("dashboard.note")}</p>
    </div>
  );
}
