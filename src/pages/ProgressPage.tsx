import { useState } from "react";
import { Download, Calendar } from "phosphor-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { 
  useQuizStats, 
  useMockStats, 
  useSimStats, 
  useTheoryProgress,
} from "@/hooks/useProgressStats";
import { useLicence } from "@/hooks/useLicence";
import { PAPER_PASS_PERCENT } from "@/lib/licence";
import { Bay, Figure } from "@/components/ui/road";
import { LicenceSummary } from "@/components/progress/LicenceSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManeuverScoresBar } from "@/components/progress/ManeuverScoresBar";
import { QuizTrendLine } from "@/components/progress/QuizTrendLine";
import { MockTrendLine } from "@/components/progress/MockTrendLine";
import { CategoryBreakdownBar } from "@/components/progress/CategoryBreakdownBar";
import { QuizHistoryTable } from "@/components/progress/QuizHistoryTable";
import { MockHistoryTable } from "@/components/progress/MockHistoryTable";
import { SimHistoryTable } from "@/components/progress/SimHistoryTable";

export function ProgressPage() {
  const { t, language } = useLanguage();
  const { user } = useAuthStore();

  const [dateRange, setDateRange] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("quizzes");

  const { data: quiz, isPending: quizPending } = useQuizStats(dateRange || undefined);
  const { data: mock, isPending: mockPending } = useMockStats(dateRange || undefined);
  const { data: sim, isPending: simPending } = useSimStats(dateRange || undefined);
  const { data: theory, isPending: theoryPending } = useTheoryProgress();
  const { data: standing, isPending: standingPending } = useLicence();

  const handleExport = async () => {
    if (!hasData) return;

    try {
      const { exportProgressReportFromFrame } = await import("@/lib/exportProgressReport");
      await exportProgressReportFromFrame("progress-report-print-frame");
    } catch {
      if (!user) {
        toast.error(t("common.error"));
        return;
      }
      try {
        const { generateProgressPDF } = await import("@/lib/generateProgressPDF");
        await generateProgressPDF({
          language,
          userName: user.email?.split("@")[0] || "Student",
          theory: theory || { completedModules: 0, totalModules: 3, percentage: 0 },
          quiz: quiz || { average: 0, totalDuration: 0, history: [], trend: [] },
          mock: mock || { passRate: 0, totalDuration: 0, history: [], trend: [] },
          sim: sim || { averageScore: 0, totalDuration: 0, history: [], byManeuver: [] },
        });
      } catch (fallbackErr) {
        toast.error(t("common.error"));
      }
    }
  };

  const hasData = quiz?.count || mock?.count || sim?.completed;

  const categoryData = quiz?.categoryPerformance || [
    { category: "road-signs", averageScore: 0, attempts: 0 },
    { category: "traffic-rules", averageScore: 0, attempts: 0 },
    { category: "safety-principles", averageScore: 0, attempts: 0 },
  ];

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <header className="page-header">
          <h1 className="page-title">{t("progress.title")}</h1>
          <p className="page-lead">{t("progress.subtitle")}</p>
        </header>

        <div className="flex items-center gap-3">
          <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(Number(v))}>
            <SelectTrigger className="w-36 bg-card">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("progress.dateRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("progress.allTime")}</SelectItem>
              <SelectItem value="7">{t("progress.last7Days")}</SelectItem>
              <SelectItem value="30">{t("progress.last30Days")}</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleExport} 
            disabled={!hasData}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("progress.exportPdf")}
          </Button>
        </div>
      </div>

      <div id="progress-report-print-frame" className="space-y-6">
      {/* ── Where you stand ──────────────────────────────────────────────
          Reads from the same licence model the dashboard road uses. The old
          readiness donut computed its own composite here, which meant this
          page and the dashboard could quote two different numbers for the
          same learner. */}
      <LicenceSummary standing={standing} pending={standingPending} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        <Bay className="flex flex-col justify-between px-4 py-4">
          <p className="type-label text-sm text-muted-foreground">
            {t("progress.theoryCompleted")}
          </p>
          {theoryPending ? (
            <Skeleton className="mt-3 h-8 w-20" />
          ) : (
            <Figure
              className="mt-3"
              size="text-[2rem] sm:text-4xl"
              value={theory ? `${theory.completedModules}/${theory.totalModules}` : "0/3"}
              label={t("dashboard.modulesCompleted")}
            />
          )}
        </Bay>

        <Bay className="flex flex-col justify-between px-4 py-4">
          <p className="type-label text-sm text-muted-foreground">
            {t("progress.totalAttempts")}
          </p>
          {quizPending || mockPending || simPending ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <Figure
              className="mt-3"
              size="text-[2rem] sm:text-4xl"
              value={(quiz?.count || 0) + (mock?.count || 0) + (sim?.completed || 0)}
            />
          )}
        </Bay>

        <Bay
          state={
            !mock || mock.passRate === 0
              ? "open"
              : mock.passRate >= PAPER_PASS_PERCENT
                ? "done"
                : "fail"
          }
          className="flex flex-col justify-between px-4 py-4"
        >
          <p className="type-label text-sm text-muted-foreground">
            {t("progress.mockPassRate")}
          </p>
          {mockPending ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <Figure
              className="mt-3"
              size="text-[2rem] sm:text-4xl"
              value={mock ? Math.round(mock.passRate) : 0}
              unit="%"
            />
          )}
        </Bay>

        <Bay className="flex flex-col justify-between px-4 py-4">
          <p className="type-label text-sm text-muted-foreground">
            {t("progress.studyTime")}
          </p>
          {quizPending || mockPending || simPending ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <Figure
              className="mt-3"
              size="text-[2rem] sm:text-4xl"
              value={(() => {
                const total =
                  (quiz?.totalDuration || 0) +
                  (mock?.totalDuration || 0) +
                  (sim?.totalDuration || 0);
                return `${Math.floor(total / 3600)}h ${Math.floor((total / 60) % 60)}m`;
              })()}
            />
          )}
        </Bay>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
          <TabsTrigger value="theory">{t("progress.tab.theory")}</TabsTrigger>
          <TabsTrigger value="quizzes">{t("progress.tab.quizzes")}</TabsTrigger>
          <TabsTrigger value="mocks">{t("progress.tab.mocks")}</TabsTrigger>
          <TabsTrigger value="simulations">{t("progress.tab.simulations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="theory" className="space-y-6">
          <div className="plate p-6">
            <h3 className="text-lg font-semibold mb-4">{t("progress.categoryPerformance")}</h3>
            <CategoryBreakdownBar key={activeTab} data={categoryData} />
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 plate p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("progress.averageScore")}</h3>
              {quizPending ? (
                <>
                  <Skeleton className="h-10 w-24 mb-4 mt-2" />
                  <div className="mt-4 text-sm text-muted-foreground border-t pt-4 w-full flex justify-center">
                    <Skeleton className="h-5 w-32" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold font-mono font-tabular-nums text-primary">{quiz ? Math.round(quiz.average) : 0}%</p>
                  <div className="mt-4 text-sm text-muted-foreground border-t pt-4 w-full">
                    {t("progress.bestScore")}: <span className="font-semibold text-foreground">{quiz?.best || 0}%</span>
                  </div>
                </>
              )}
            </div>
            <div className="lg:col-span-8 plate p-6">
              <h3 className="text-lg font-semibold mb-4">{t("progress.scoreTrend")}</h3>
              {quizPending ? (
                <Skeleton className="h-[250px] w-full rounded-xl" />
              ) : quiz?.trend && quiz.trend.length > 0 ? (
                <QuizTrendLine key={activeTab} data={quiz.trend} />
              ) : (
                <p className="text-muted-foreground py-10 text-center">{t("progress.notEnoughData")}</p>
              )}
            </div>
          </div>
          <div className="plate p-6">
            <h3 className="text-lg font-semibold mb-4">{t("progress.attemptHistory")}</h3>
            {quizPending ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <QuizHistoryTable data={quiz?.history || []} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="mocks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 plate p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("progress.averageScore")}</h3>
              {mockPending ? (
                <>
                  <Skeleton className="h-10 w-24 mb-4 mt-2" />
                  <div className="mt-4 text-sm text-muted-foreground border-t pt-4 w-full flex justify-center">
                    <Skeleton className="h-5 w-32" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold font-mono font-tabular-nums text-primary">{mock ? Math.round(mock.average) : 0}%</p>
                  <div className="mt-4 text-sm text-muted-foreground border-t pt-4 w-full">
                    {t("progress.bestScore")}: <span className="font-semibold text-foreground">{mock?.best || 0}%</span>
                  </div>
                </>
              )}
            </div>
            <div className="lg:col-span-8 plate p-6">
              <h3 className="text-lg font-semibold mb-4">{t("progress.scoreTrend")}</h3>
              {mockPending ? (
                <Skeleton className="h-[250px] w-full rounded-xl" />
              ) : mock?.trend && mock.trend.length > 0 ? (
                <MockTrendLine key={activeTab} data={mock.trend} />
              ) : (
                <p className="text-muted-foreground py-10 text-center">{t("progress.notEnoughData")}</p>
              )}
            </div>
          </div>
          <div className="plate p-6">
            <h3 className="text-lg font-semibold mb-4">{t("progress.attemptHistory")}</h3>
            {mockPending ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <MockHistoryTable data={mock?.history || []} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="simulations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 plate p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("progress.averageScore")}</h3>
              {simPending ? (
                <>
                  <Skeleton className="h-10 w-24 mb-4 mt-2" />
                  <div className="mt-4 text-sm text-muted-foreground border-t pt-4 w-full flex justify-center">
                    <Skeleton className="h-5 w-48" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold font-mono font-tabular-nums text-primary">{sim ? Math.round(sim.averageScore) : 0}%</p>
                  <div className="mt-4 text-sm text-muted-foreground border-t pt-4 w-full">
                    {t("progress.maneuversAttempted")}: <span className="font-semibold text-foreground">{t("progress.maneuversCount", { completed: sim?.completed || 0, total: 8 })}</span>
                  </div>
                </>
              )}
            </div>
            <div className="lg:col-span-8 plate p-6">
              <h3 className="text-lg font-semibold mb-4">{t("progress.bestScoresByManeuver")}</h3>
              {simPending ? (
                <Skeleton className="h-[250px] w-full rounded-xl" />
              ) : sim?.byManeuver && sim.byManeuver.length > 0 ? (
                <ManeuverScoresBar key={activeTab} data={sim.byManeuver} />
              ) : (
                <p className="text-muted-foreground py-10 text-center">{t("progress.notEnoughData")}</p>
              )}
            </div>
          </div>
          <div className="plate p-6">
            <h3 className="text-lg font-semibold mb-4">{t("progress.attemptHistory")}</h3>
            {simPending ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <SimHistoryTable data={sim?.history || []} />
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
