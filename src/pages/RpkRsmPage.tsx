import { useState } from "react";
import { CheckCircle, ArrowRight } from "phosphor-react";
import { RPK_TOPICS, countRpkCompleted } from "@/content/rpk-rsm";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheoryProgress, useUpdateTheoryProgress } from "@/hooks/useProgress";
import { useAuthStore } from "@/stores/authStore";
import { Plate, RoadRule } from "@/components/ui/road";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/shared/LoadError";

export function RpkRsmPage() {
  const { language, t } = useLanguage(); const ms = language === "ms";
  const user = useAuthStore(s => s.user);
  const progress = useTheoryProgress(user?.id ?? "");
  const save = useUpdateTheoryProgress();
  const [selected, setSelected] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const rows = progress.data ?? [];
  const completed = new Set(rows.filter(row => row.completed).map(row => row.module_id));
  const current = RPK_TOPICS.find(topic => topic.id === selected) ?? RPK_TOPICS.find(topic => !completed.has(topic.id)) ?? RPK_TOPICS[0];
  if (progress.isError) return <div className="page-shell"><LoadError onRetry={() => { void progress.refetch(); }}/></div>;
  return <div className="page-shell"><header className="page-header"><h1 className="page-title">RPK / RSM</h1><p className="page-lead">{ms ? "Persediaan pemeriksaan kenderaan dan rutin sebelum memandu." : "Vehicle inspection and preparation before driving."}</p></header>
    <p className="text-sm text-muted-foreground">{ms ? "Panduan ulang kaji ringkas. Semak langkah praktikal dengan pengajar anda; penyiapan di sini bukan pengesahan JPJ." : "A short revision guide. Confirm practical steps with your instructor; completion here is not JPJ certification."}</p>
    {progress.isPending ? <p role="status">{t("common.loading")}</p> : <>
      <p className="type-figure">{countRpkCompleted(rows)} / {RPK_TOPICS.length} {ms ? "topik selesai" : "topics completed"}</p>
      <div className="grid gap-4 md:grid-cols-[minmax(14rem,1fr)_2fr]">
        <nav aria-label={ms ? "Topik RPK / RSM" : "RPK / RSM topics"} className="space-y-2">{RPK_TOPICS.map(topic => <button disabled={save.isPending} key={topic.id} className={`bay w-full flex items-center justify-between gap-2 p-4 text-left ${current.id === topic.id ? "bay-selected" : "bay-open"}`} aria-current={current.id === topic.id ? "step" : undefined} onClick={() => {setSelected(topic.id); setReviewed(false); save.reset();}}><span>{topic.title[language]}</span>{completed.has(topic.id) ? <CheckCircle weight="fill" className="text-success" aria-label={ms ? "Selesai" : "Completed"}/> : <ArrowRight aria-hidden="true"/>}</button>)}</nav>
        <Plate className="p-5 sm:p-7"><h2 className="type-display text-2xl">{current.title[language]}</h2><ol className="list-decimal pl-5 my-6 space-y-4">{current.steps[language].map(step => <li key={step}>{step}</li>)}</ol>
          <RoadRule marking={completed.has(current.id) ? "closed" : "progress"}/>
          <label className="my-5 flex min-h-12 items-center gap-3"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="!min-h-5 !min-w-5 h-5 w-5 accent-[rgb(var(--asphalt))]"/><span>{ms ? "Saya telah mengulang kaji topik ini." : "I have reviewed this topic."}</span></label>
          <Button disabled={!reviewed || !user || save.isPending} loading={save.isPending} onClick={() => { if (user) { setSelected(current.id); save.mutate({user_id:user.id,module_id:current.id,completed:true,completed_at:new Date().toISOString()}); } }}>{ms ? "Simpan penyiapan" : "Save completion"}</Button>
          {save.isSuccess && <p role="status" className="mt-4 text-sm">{ms ? "Penyiapan disimpan." : "Completion saved."}</p>}
          {save.isError && <p role="alert" className="mt-4 text-sm text-destructive">{ms ? "Tidak dapat menyimpan. Cuba lagi." : "Could not save. Please retry."}</p>}
        </Plate>
      </div>
    </>}
    <p className="text-sm text-muted-foreground">{ms ? "Rujukan" : "References"}: <a className="inline-link underline" href="https://plmr.my/v2/wp-content/uploads/2024/06/KPP_DManual.pdf">Kurikulum Pendidikan Pemandu, kelas D</a> · <a className="inline-link underline" href="https://www.youtube.com/watch?v=M803eaL2rzY">RPK tutorial</a></p>
  </div>;
}
