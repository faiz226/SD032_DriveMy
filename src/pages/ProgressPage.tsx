import { useState } from "react";
import { Download, Calendar, Activity, Book, Clock, Target, Warning } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { 
  useQuizStats, 
  useMockStats, 
  useSimStats, 
  useTheoryProgress, 
  useOverallReadiness 
} from "@/hooks/useProgressStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReadinessDonut } from "@/components/progress/ReadinessDonut";
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
  const { data: readiness, isPending: readinessPending } = useOverallReadiness();

  const handleExport = async () => {
    if (!hasData) return;

    try {
      const { exportProgressReportFromFrame } = await import("@/lib/exportProgressReport");
      await exportProgressReportFromFrame("progress-report-print-frame");
    } catch {
      if (!quiz || !mock || !sim || !theory || !user) return;
      const { generateProgressPDF } = await import("@/lib/generateProgressPDF");
      await generateProgressPDF({
        language,
        userName: user.email?.split("@")[0] || "Student",
        theory,
        quiz,
        mock,
        sim,
      });
    }
  };

  const hasData = quiz?.count || mock?.count || sim?.completed;

  const dummyCategoryData = [
    { category: "road-signs", averageScore: 88, attempts: 5 },
    { category: "traffic-rules", averageScore: 72, attempts: 4 },
    { category: "safety-principles", averageScore: 95, attempts: 3 },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-6 flex flex-col md:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {t("progress.examReadiness")}
          </h2>
          {readinessPending ? (
            <div className="h-[250px] flex items-center justify-center">
              <Skeleton circle className="h-40 w-40" />
            </div>
          ) : readiness ? (
            <ReadinessDonut {...readiness} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="card-premium p-6 flex flex-col justify-center min-h-[120px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Book className="w-4 h-4" weight="regular" />
              <span>{t("progress.theoryCompleted")}</span>
            </div>
            {theoryPending ? (
              <div className="space-y-2 mt-1">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold font-mono font-tabular-nums text-primary">
                  {theory ? `${Math.round(theory.percentage)}%` : "0%"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {theory ? t("progress.modulesCount", { completed: theory.completedModules, total: theory.totalModules }) : ""}
                </div>
              </>
            )}
          </div>
          
          <div className="card-premium p-6 flex flex-col justify-center min-h-[120px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span>{t("progress.totalAttempts")}</span>
            </div>
            {quizPending || mockPending || simPending ? (
              <div className="mt-1">
                <Skeleton className="h-9 w-16" />
              </div>
            ) : (
              <div className="text-3xl font-bold font-mono font-tabular-nums text-foreground">
                {(quiz?.count || 0) + (mock?.count || 0) + (sim?.completed || 0)}
              </div>
            )}
          </div>

          <div className="card-premium p-6 flex flex-col justify-center min-h-[120px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Warning className="w-4 h-4" weight="regular" />
              <span>{t("progress.mockPassRate")}</span>
            </div>
            {mockPending ? (
              <div className="mt-1">
                <Skeleton className="h-9 w-16" />
              </div>
            ) : (
              <div className={`text-3xl font-bold font-mono font-tabular-nums ${mock && mock.passRate >= 84 ? "text-success" : "text-warning"}`}>
                {mock ? `${Math.round(mock.passRate)}%` : "0%"}
              </div>
            )}
          </div>

          <div className="card-premium p-6 flex flex-col justify-center min-h-[120px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span>{t("progress.studyTime")}</span>
            </div>
            {quizPending || mockPending || simPending ? (
              <div className="mt-1">
                <Skeleton className="h-9 w-24" />
              </div>
            ) : (
              <div className="text-3xl font-bold font-mono font-tabular-nums text-foreground">
                {quiz && mock && sim ? 
                  `${Math.floor(((quiz.totalDuration + mock.totalDuration + sim.totalDuration) / 60) / 60)}h ${Math.floor(((quiz.totalDuration + mock.totalDuration + sim.totalDuration) / 60) % 60)}m` 
                  : "0h 0m"}
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
          <TabsTrigger value="theory">{t("progress.tab.theory")}</TabsTrigger>
          <TabsTrigger value="quizzes">{t("progress.tab.quizzes")}</TabsTrigger>
          <TabsTrigger value="mocks">{t("progress.tab.mocks")}</TabsTrigger>
          <TabsTrigger value="simulations">{t("progress.tab.simulations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="theory" className="space-y-6">
          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold mb-4">{t("progress.categoryPerformance")}</h3>
            <CategoryBreakdownBar key={activeTab} data={dummyCategoryData} />
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 card-premium p-6 flex flex-col items-center justify-center text-center">
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
            <div className="lg:col-span-8 card-premium p-6">
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
          <div className="card-premium p-6">
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
            <div className="lg:col-span-4 card-premium p-6 flex flex-col items-center justify-center text-center">
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
            <div className="lg:col-span-8 card-premium p-6">
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
          <div className="card-premium p-6">
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
            <div className="lg:col-span-4 card-premium p-6 flex flex-col items-center justify-center text-center">
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
            <div className="lg:col-span-8 card-premium p-6">
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
          <div className="card-premium p-6">
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
