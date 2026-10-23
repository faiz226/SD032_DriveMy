import { useState } from "react";
import { CheckCircle, CaretRight, Info } from "@/components/ui/icons";
import { RPK_TOPICS, countRpkCompleted } from "@/content/rpk-rsm";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheoryProgress, useUpdateTheoryProgress } from "@/hooks/useProgress";
import { useAuthStore } from "@/stores/authStore";
import { Panel, Divider } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadError } from "@/components/shared/LoadError";
import { cn } from "@/lib/utils";

export function RpkRsmPage() {
  const { language, t } = useLanguage();
  const user = useAuthStore(s => s.user);
  const progress = useTheoryProgress(user?.id ?? "");
  const save = useUpdateTheoryProgress();
  const [selected, setSelected] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const rows = progress.data ?? [];
  const completed = new Set(rows.filter(row => row.completed).map(row => row.module_id));
  const done = countRpkCompleted(rows);
  const current = RPK_TOPICS.find(topic => topic.id === selected) ?? RPK_TOPICS.find(topic => !completed.has(topic.id)) ?? RPK_TOPICS[0];
  if (progress.isError) return <div className="page-shell"><LoadError onRetry={() => { void progress.refetch(); }} /></div>;

  return (
    <div className="page-shell page-enter">
      <header className="page-header">
        <h1 className="page-title">RPK / RSM</h1>
        <p className="page-lead">{t("rpk.lead")}</p>
      </header>
      <p className="flex max-w-readable items-start gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t("rpk.disclaimer")}
      </p>

      {progress.isPending ? <p role="status">{t("common.loading")}</p> : (
        <>
          <div className="flex max-w-md items-center gap-4">
            <Progress value={(done / RPK_TOPICS.length) * 100} className="h-2" aria-label={t("rpk.topicsCompleted", { done, total: RPK_TOPICS.length })} />
            <p className="type-figure shrink-0 text-sm">{t("rpk.topicsCompleted", { done, total: RPK_TOPICS.length })}</p>
          </div>

          <div className="grid gap-[var(--panel-gap)] md:grid-cols-[minmax(15rem,1fr)_2fr]">
            <nav aria-label={t("rpk.topicsNav")} className="space-y-2">
              {RPK_TOPICS.map((topic, index) => {
                const isCurrent = current.id === topic.id;
                const isDone = completed.has(topic.id);
                return (
                  <button
                    type="button"
                    disabled={save.isPending}
                    key={topic.id}
                    className={cn("tile flex w-full items-center gap-3 p-3.5 text-left", isCurrent ? "tile-selected" : "tile-open")}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => { setSelected(topic.id); setReviewed(false); save.reset(); }}
                  >
                    <span className={cn("type-figure grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm", isDone ? "bg-success/15 text-success" : isCurrent ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
                      {isDone ? <CheckCircle size={18} weight="fill" aria-label={t("progress.completed")} /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-[0.9375rem] font-medium">{topic.title[language]}</span>
                    <CaretRight size={16} className="shrink-0 opacity-40" aria-hidden="true" />
                  </button>
                );
              })}
            </nav>

            <Panel className="p-5 sm:p-8">
              <h2 className="type-display text-[1.75rem]">{current.title[language]}</h2>
              <ol className="my-6 space-y-4">
                {current.steps[language].map((step, index) => (
                  <li key={step} className="flex gap-3.5">
                    <span className="type-figure grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs">{index + 1}</span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <Divider />
              <label className="my-5 flex min-h-12 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="h-5 w-5 rounded accent-[rgb(var(--brand))]" />
                <span>{t("rpk.reviewedConfirm")}</span>
              </label>
              <Button
                disabled={!reviewed || !user || save.isPending}
                loading={save.isPending}
                onClick={() => { if (user) { setSelected(current.id); save.mutate({ user_id: user.id, module_id: current.id, completed: true, completed_at: new Date().toISOString() }); } }}
              >
                {t("rpk.saveCompletion")}
              </Button>
              {save.isSuccess && <p role="status" className="mt-4 text-sm text-success">{t("rpk.saved")}</p>}
              {save.isError && <p role="alert" className="mt-4 text-sm text-destructive">{t("rpk.saveFailed")}</p>}
            </Panel>
          </div>
        </>
      )}
      <p className="text-sm text-muted-foreground">
        {t("rpk.references")}: <a className="inline-link" href="https://plmr.my/v2/wp-content/uploads/2024/06/KPP_DManual.pdf">Kurikulum Pendidikan Pemandu, kelas D</a> · <a className="inline-link" href="https://www.youtube.com/watch?v=M803eaL2rzY">RPK tutorial</a>
      </p>
    </div>
  );
}
