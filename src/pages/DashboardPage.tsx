import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Play, Clipboard, Car, Book } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useOverallReadiness, useMockStats, useTheoryProgress } from "@/hooks/useProgressStats";
import { getRecentActivity } from "@/services/analytics.service";
import { ReadinessRoad } from "@/components/dashboard/ReadinessRoad";
import { LearningBay } from "@/components/dashboard/LearningBay";
import { Plate, Figure } from "@/components/ui/road";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/shared/LoadError";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS } from "@/lib/constants";
import { dashboardModel } from "@/lib/dashboard/model";
import { learnerKeys } from "@/lib/queryKeys";

export function DashboardPage() {
  const { language, t } = useLanguage();
  const ms = language === "ms";
  const user = useAuthStore(s => s.user);
  const readiness = useOverallReadiness();
  const mock = useMockStats();
  const theory = useTheoryProgress();
  const activity = useQuery({ queryKey: learnerKeys.activity(user?.id), queryFn: () => getRecentActivity(user!.id), enabled: !!user });
  const queries = [readiness, mock, theory, activity];
  if (queries.some(q => q.isError)) return <div className="jalan-container"><LoadError onRetry={() => { queries.forEach(q => { void q.refetch(); }); }}/></div>;
  if (queries.some(q => q.isPending)) return <div className="jalan-container space-y-4" aria-busy="true" aria-label={t("common.loading")}><Skeleton className="h-80 w-full"/><div className="learning-grid">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48"/>)}</div></div>;
  const model = dashboardModel({ quizPct: readiness.data?.quizPct ?? 0, mock: mock.data, theory: theory.data });
  const { rpkDone, rpkTotal, bestMock: best, headroom, bays } = model;
  const next = {
    theory: { to: "/theory", title: ms ? "Kenali tanda jalan" : "Learn the road signs", detail: ms ? "Baca nota dan semak kefahaman anda." : "Read the notes and check your understanding." },
    mock: { to: "/mock-test", title: ms ? "Cuba ujian percubaan KPP" : "Try a KPP mock test", detail: ms ? "50 soalan · 45 minit" : "50 questions · 45 minutes" },
    rpk: { to: "/rpk-rsm", title: ms ? "Sambung RPK / RSM" : "Continue RPK / RSM", detail: ms ? "Semak kenderaan dan persediaan memandu." : "Review vehicle checks and driving preparation." },
    quiz: { to: "/quizzes", title: ms ? "Latih tubi teori" : "Practise theory", detail: ms ? "Pilih bahagian untuk diulang kaji." : "Choose a section to review." },
  }[model.next];
  return <div className="jalan-container space-y-4">
    <ReadinessRoad value={readiness.data?.composite ?? 0}/>
    <section aria-labelledby="learning-title"><div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 id="learning-title" className="type-display text-xl">{ms ? "Bay pembelajaran" : "Learning bays"}</h2><p className="text-sm text-muted-foreground">{ms ? "Pilih latihan untuk disambung." : "Choose where to continue."}</p></div>
      <div className="learning-grid">
        <LearningBay title={ms ? "Kuiz KPP 01" : "KPP 01 quiz"} to="/quizzes" description={best ? `${ms ? "Ujian percubaan terbaik" : "Best mock test"}: ${best.score} / ${best.total_questions}` : (ms ? "Latih tubi tanda jalan dan peraturan." : "Practise road signs and rules.")} state={bays.quiz}/>
        <LearningBay title="RPK / RSM" to="/rpk-rsm" description={`${rpkDone} / ${rpkTotal} ${ms ? "topik selesai" : "topics completed"}`} state={bays.rpk}/>
        <LearningBay title={ms ? "Latihan litar" : "Circuit maneuvers"} to="/simulations" description={ms ? "Lihat latihan praktikal yang tersedia." : "Explore available practical exercises."}/>
        <LearningBay title={ms ? "Bukit" : "Hill start"} to="/simulations/hill-start" description={ms ? "Ulang kaji RPK / RSM sebelum berlatih." : "Review RPK / RSM before practising."}/>
        <LearningBay title={ms ? "Parkir selari" : "Parallel parking"} to="/simulations/parallel-parking" description={ms ? "Latih kedudukan dan kawalan kenderaan." : "Practise positioning and vehicle control."}/>
        <LearningBay title={ms ? "Peraturan jalan raya" : "Road rules"} to="/theory" description={ms ? "Nota, tanda jalan dan panduan ringkas." : "Notes, road signs and practical guidance."} state={bays.rules}/>
      </div>
    </section>
    <div className="dashboard-deck">
      <Plate className="dashboard-performance p-5"><h2 className="type-label-strong text-xl">{ms ? "Prestasi KPP" : "KPP performance"}</h2>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[{label: ms ? "Markah lulus" : "Pass mark", value: MOCK_PASS_MARK, suffix: `/ ${MOCK_TOTAL_QUESTIONS}`}, {label: ms ? "Skor terbaik" : "Best score", value: best?.score ?? "—", suffix: best ? `/ ${best.total_questions}` : ""}, {label: ms ? "Beza markah" : "Headroom", value: headroom ?? "—", suffix: ms ? "markah" : "marks"}].map(metric => <div key={metric.label}><p className="text-xs text-muted-foreground">{metric.label}</p><Figure className="block mt-2 text-[clamp(2rem,3vw,3rem)]">{metric.value}</Figure><span className="text-sm text-muted-foreground">{metric.suffix}</span></div>)}
        </div><p className="mt-5 text-xs text-muted-foreground">{ms ? "Berdasarkan ujian percubaan 50 soalan. Bukan ramalan keputusan peperiksaan." : "Based on 50-question mock tests. This is not an exam prediction."}</p>
      </Plate>
      <Plate className="p-5"><div className="flex justify-between gap-2"><h2 className="type-label-strong text-xl">{ms ? "Aktiviti terkini" : "Recent activity"}</h2><Link to="/progress" className="inline-flex min-w-12 min-h-12 items-center justify-center" aria-label={t("nav.progress")}><ArrowRight aria-hidden="true"/></Link></div>
        {!activity.data?.length ? <p className="text-sm text-muted-foreground mt-3">{t("dashboard.noActivityDesc")}</p> : <ul className="divide-y divide-border">{activity.data.slice(0,3).map(event => {
          const Icon = event.type === "sim" ? Car : event.type === "mock" ? Clipboard : Book;
          const date = event.date ? new Date(event.date) : null;
          return <li key={`${event.type}-${event.id}`} className="flex gap-2 py-3"><Icon size={20} aria-hidden="true" className="shrink-0 mt-1"/><div className="flex-1 min-w-0"><p className="text-sm font-medium">{event.type === "sim" ? t("nav.simulator") : event.type === "mock" ? t("nav.mockTest") : t("nav.quiz")}</p><p className="text-xs text-muted-foreground">{event.score}{event.type === "sim" ? ` ${t("common.points")}` : "%"}</p></div><time className="text-xs text-muted-foreground text-right" dateTime={date && !Number.isNaN(+date) ? date.toISOString() : undefined}>{date && !Number.isNaN(+date) ? date.toLocaleDateString(ms ? "ms-MY" : "en-MY",{day:"numeric",month:"short"}) : (ms ? "Tarikh tiada" : "No date")}</time></li>;
        })}</ul>}
      </Plate>
      <Plate className="p-5 flex flex-col"><h2 className="type-label-strong text-xl">{ms ? "Langkah seterusnya" : "Next action"}</h2><h3 className="type-display text-xl mt-5">{next.title}</h3><p className="text-sm text-muted-foreground mt-2 mb-5">{next.detail}</p><Button asChild className="mt-auto"><Link to={next.to}><Play weight="fill" aria-hidden="true"/>{ms ? "Mula latihan" : "Start learning"}</Link></Button></Plate>
    </div>
  </div>;
}
