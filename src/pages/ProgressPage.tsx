import { useState } from "react";
import { Download, Calendar, Activity, Book, Clock, Target, Warning } from "@/components/ui/icons";
import { toast } from "sonner";
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
import { ScoreTrendChart } from "@/components/progress/ScoreTrendChart";
import { CategoryBreakdownBar } from "@/components/progress/CategoryBreakdownBar";
import { QuizHistoryTable } from "@/components/progress/QuizHistoryTable";
import { MockHistoryTable } from "@/components/progress/MockHistoryTable";
import { SimHistoryTable } from "@/components/progress/SimHistoryTable";
import { LoadError } from "@/components/shared/LoadError";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS } from "@/lib/constants";

// A trend needs two points; one attempt is listed in the history table below.
const MIN_TREND_POINTS = 2;

export function ProgressPage() {
  const { t, language } = useLanguage();
  const { user } = useAuthStore();

  const [dateRange, setDateRange] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("quizzes");

  const quizQ = useQuizStats(dateRange || undefined);
  const mockQ = useMockStats(dateRange || undefined);
  const simQ = useSimStats(dateRange || undefined);
  const theoryQ = useTheoryProgress();
  const readinessQ = useOverallReadiness();

  const { data: quiz, isPending: quizPending } = quizQ;
  const { data: mock, isPending: mockPending } = mockQ;
  const { data: sim, isPending: simPending } = simQ;
  const { data: theory, isPending: theoryPending } = theoryQ;
  const { data: readiness, isPending: readinessPending } = readinessQ;

  // Previously there was no error branch at all: a failed fetch left every
  // skeleton shimmering indefinitely with no message and no way to retry.
  const loadFailed =
    quizQ.isError || mockQ.isError || simQ.isError || theoryQ.isError || readinessQ.isError;

  const retryAll = () => {
    void quizQ.refetch();
    void mockQ.refetch();
    void simQ.refetch();
    void theoryQ.refetch();
    void readinessQ.refetch();
  };

  const handleExport = async () => {
    if (!hasData) return;

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
    } catch {
      toast.error(t("common.error"));
    }
  };

  const hasData = quiz?.count || mock?.count || sim?.completed;

  const categoryData = quiz?.categoryPerformance || [
    { category: "road-signs", averageScore: 0, attempts: 0 },
    { category: "traffic-rules", averageScore: 0, attempts: 0 },
    { category: "safety-principles", averageScore: 0, attempts: 0 },
  ];

  if (loadFailed) {
    return (
      <div className="page-shell max-w-7xl space-y-6">
        <header className="page-header">
          <h1 className="page-title">{t("progress.title")}</h1>
        </header>
        <LoadError onRetry={retryAll} />
      </div>
    );
  }

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

      <div className="space-y-6">
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
                <div className="text-3xl font-bold type-figure text-primary">
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
              <div className="text-3xl font-bold type-figure text-foreground">
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
              <div className={`text-3xl font-bold type-figure ${mock && mock.passRate >= 84 ? "text-success" : "text-warning"}`}>
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
              <div className="text-3xl font-bold type-figure text-foreground">
                {(() => {
                  const total = (quiz?.totalDuration || 0) + (mock?.totalDuration || 0) + (sim?.totalDuration || 0);
                  return `${Math.floor(total / 3600)}h ${Math.floor((total / 60) % 60)}m`;
                })()}
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
            <CategoryBreakdownBar key={activeTab} data={categoryData} />
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
                  <p className="text-4xl font-bold type-figure text-primary">{quiz ? Math.round(quiz.average) : 0}%</p>
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
              ) : quiz?.trend && quiz.trend.length >= MIN_TREND_POINTS ? (
                <ScoreTrendChart key={activeTab} data={quiz.trend} label={t("progress.chart.quizTrend")} limit={20} />
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
                  <p className="text-4xl font-bold type-figure text-primary">{mock ? Math.round(mock.average) : 0}%</p>
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
              ) : mock?.trend && mock.trend.length >= MIN_TREND_POINTS ? (
                <ScoreTrendChart key={activeTab} data={mock.trend} label={t("progress.chart.mockTrend")} limit={10} passMark={Math.round((MOCK_PASS_MARK / MOCK_TOTAL_QUESTIONS) * 100)} />
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
                  <p className="text-4xl font-bold type-figure text-primary">{sim ? Math.round(sim.averageScore) : 0}%</p>
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
