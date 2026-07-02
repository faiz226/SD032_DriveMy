import { useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Book, Target, Car, Trophy, ArrowRight, Activity } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getTheoryProgress } from "@/services/progress.service";
import {
  getBestQuizScore,
  getBestMockTestScore,
  getSimulationsDone,
  getRecentActivity,
} from "@/services/analytics.service";

const LazyDonutRing = lazy(() =>
  import("@/components/ui/donut-ring").then((m) => ({ default: m.DonutRing }))
);

export function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const userId = user?.id;

  const name =
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";

  const hour = new Date().getHours();
  let greetingKey = "dashboard.greeting.morning";
  if (hour >= 12 && hour < 18) {
    greetingKey = "dashboard.greeting.afternoon";
  } else if (hour >= 18) {
    greetingKey = "dashboard.greeting.evening";
  }

  const { data: theoryProgress = [], isPending: theoryPending } = useQuery({
    queryKey: ["theoryProgress", userId],
    queryFn: () => getTheoryProgress(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: quizBest = 0, isPending: quizPending } = useQuery({
    queryKey: ["quizBest", userId],
    queryFn: () => getBestQuizScore(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: mockBest = 0, isPending: mockPending } = useQuery({
    queryKey: ["mockBest", userId],
    queryFn: () => getBestMockTestScore(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: simsDone = 0, isPending: simsPending } = useQuery({
    queryKey: ["simsDone", userId],
    queryFn: () => getSimulationsDone(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: recentActivity = [], isPending: activityPending } = useQuery({
    queryKey: ["recentActivity", userId],
    queryFn: () => getRecentActivity(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const theoryCompleted = theoryProgress.filter((p) => p.completed).length;
  const theoryPercent = Math.round((theoryCompleted / 3) * 100) || 0;

  const TOTAL_SIMS = 8;
  const simsPercent = Math.min((simsDone / TOTAL_SIMS) * 100, 100);

  const examReadiness = useMemo(() => {
    const s = simsPercent * 0.4;
    const q = quizBest * 0.3;
    const m = mockBest * 0.3;
    return Math.round(s + q + m);
  }, [simsPercent, quizBest, mockBest]);

  let ctaRoute: string = ROUTES.THEORY;

  if (quizBest > 0 && quizBest < 100) {
    ctaRoute = ROUTES.QUIZ;
  } else if (mockBest === 0) {
    ctaRoute = ROUTES.MOCK_TEST;
  } else {
    ctaRoute = ROUTES.SIMULATIONS;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* ── Editorial Header ── */}
      <header className="py-4 md:py-6 border-b border-border">
        <p className="section-eyebrow mb-1.5 uppercase tracking-wider text-muted-foreground font-medium text-[10px]">{t(greetingKey as never, { name })}</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tighter text-foreground mb-2">
          {name || "Local Developer"}
        </h1>
        <p className="text-muted-foreground max-w-lg leading-relaxed">
          {t("dashboard.readyForExam")}
        </p>
      </header>

      {/* ── Continue bar ── */}
      <div className="card-premium border border-border rounded-xl">
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 border border-border rounded-lg flex items-center justify-center shrink-0">
              {quizBest > 0 && quizBest < 100 ? (
                <Book className="w-5 h-5 text-foreground" />
              ) : (
                <Trophy className="w-5 h-5 text-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase mb-0.5">
                {quizBest > 0 && quizBest < 100 ? t("dashboard.continueLearning") : t("dashboard.suggestedNextStep")}
              </p>
              <p className="text-sm font-semibold leading-snug truncate text-foreground">
                {quizBest > 0 && quizBest < 100
                  ? t("dashboard.resumeTheoryQuiz")
                  : mockBest === 0 ? t("dashboard.takeFirstMock") : t("dashboard.practiceSimulation")}
              </p>
            </div>
          </div>
          <Link to={ctaRoute} className="w-full sm:w-auto shrink-0">
            <Button size="sm" className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90">
              Continue <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4 flex flex-col h-full border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center">
              <Book className="w-4 h-4 text-foreground" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("progress.tab.theory")}</span>
          </div>
          {theoryPending ? (
            <Skeleton className="h-9 w-24 mb-1.5" />
          ) : (
            <p className="font-heading text-3xl font-semibold tracking-tight text-foreground">{theoryPercent}%</p>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">{t("dashboard.modulesCompleted")}</p>
          <div className="h-1.5 w-full bg-muted rounded-full mt-auto pt-3 overflow-hidden">
             {theoryPending ? (
               <Skeleton className="h-1.5 w-full" />
             ) : (
               <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${theoryPercent}%` }} />
             )}
          </div>
        </div>
        <div className="card-premium p-4 flex flex-col h-full border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center">
              <Target className="w-4 h-4 text-foreground" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("dashboard.quizBest")}</span>
          </div>
          {quizPending ? (
            <Skeleton className="h-9 w-24 mb-1.5" />
          ) : (
            <p className="font-heading text-3xl font-semibold tracking-tight text-foreground">{quizBest}%</p>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">{t("dashboard.highestQuizScore")}</p>
        </div>
        <div className="card-premium p-4 flex flex-col h-full border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center">
              <Trophy className="w-4 h-4 text-foreground" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("dashboard.mockTestBest")}</span>
          </div>
          {mockPending ? (
            <Skeleton className="h-9 w-24 mb-1.5" />
          ) : (
            <p className="font-heading text-3xl font-semibold tracking-tight text-foreground">{mockBest}%</p>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">{t("dashboard.highestMockScore")}</p>
        </div>
        <div className="card-premium p-4 flex flex-col h-full border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center">
              <Car className="w-4 h-4 text-foreground" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{t("progress.chart.simulations")}</span>
          </div>
          {simsPending ? (
            <Skeleton className="h-9 w-24 mb-1.5" />
          ) : (
            <p className="font-heading text-3xl font-semibold tracking-tight text-foreground">{simsDone}/{TOTAL_SIMS}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">{t("dashboard.maneuversPractised")}</p>
          <div className="h-1.5 w-full bg-muted rounded-full mt-auto pt-3 overflow-hidden">
             {simsPending ? (
               <Skeleton className="h-1.5 w-full" />
             ) : (
               <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${simsPercent}%` }} />
             )}
          </div>
        </div>
      </section>

      {/* ── Two-column: Readiness + Activity ── */}
      <section className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Readiness */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">{t("dashboard.examReadiness")}</h2>
          <div className="card-premium border border-border rounded-xl p-5">
            <div className="flex items-center gap-5">
              <div className="flex justify-center shrink-0">
                {theoryPending || quizPending || mockPending || simsPending ? (
                  <Skeleton circle className="h-24 w-24" />
                ) : (
                  <Suspense fallback={<Skeleton circle className="h-24 w-24" />}>
                    <LazyDonutRing percentage={examReadiness} size={96} strokeWidth={8} />
                  </Suspense>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t("dashboard.overallReadiness")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("dashboard.readinessFormula")}</p>
                <div className="h-1.5 w-full bg-muted rounded-full mt-3 overflow-hidden">
                   <div className="h-full bg-primary rounded-full" style={{ width: `${examReadiness}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Link to={ROUTES.THEORY}>
              <div className="card-premium border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center shrink-0 group-hover:border-foreground/20 transition-colors">
                  <Book className="w-4 h-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-foreground">{t("progress.tab.theory")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.reviewTheory")}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
            <Link to={ROUTES.QUIZ}>
              <div className="card-premium border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center shrink-0 group-hover:border-foreground/20 transition-colors">
                  <Target className="w-4 h-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-foreground">{t("dashboard.practiceQuiz")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.startPractice")}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
            <Link to={ROUTES.SIMULATIONS}>
              <div className="card-premium border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center shrink-0 group-hover:border-foreground/20 transition-colors">
                  <Car className="w-4 h-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-foreground">{t("progress.tab.simulations")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.maneuversPractised")}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Activity sidebar */}
        <aside className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">{t("dashboard.recentActivity")}</h2>
          <div className="card-premium border border-border rounded-xl p-4">
            {activityPending ? (
              <ul className="space-y-4" aria-busy="true" aria-label="Loading recent activity">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center justify-between gap-3 pt-4 border-t border-border/40 first:pt-0 first:border-0">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <Skeleton circle className="h-7 w-7 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-medium text-foreground">{t("dashboard.noActivity")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("dashboard.noActivityDesc")}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <li key={activity.id} className={cn("flex items-start gap-3", idx > 0 && "pt-3 border-t border-border/40")}>
                    <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.type === "sim" ? `${activity.score} ${t("common.points")}` : `${activity.score}%`} · {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
