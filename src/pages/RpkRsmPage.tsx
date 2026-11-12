import { useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle, Info } from "@/components/ui/icons";
import { RPK_TOPICS, type Topic } from "@/content/rpk-rsm";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheoryProgressRows, useUpdateTheoryProgress } from "@/hooks/useProgress";
import { useAuthStore } from "@/stores/authStore";
import { Panel, Divider } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadError } from "@/components/shared/LoadError";
import { cn } from "@/lib/utils";

const GROUPS = [
  { routine: "rpk", titleKey: "rpk.group.rpk", noteKey: "rpk.powder" },
  { routine: "rsm", titleKey: "rpk.group.rsm", noteKey: "rpk.rsmOrder" },
] as const;

export function RpkRsmPage() {
  const { language, t } = useLanguage();
  const user = useAuthStore(s => s.user);
  const isDevBypass = useAuthStore(s => s.isDevBypass);
  const progress = useTheoryProgressRows(isDevBypass ? "" : user?.id ?? "");
  const save = useUpdateTheoryProgress();
  // The dev sign-in has no real session, so its ticks stay on this page.
  const [localDone, setLocalDone] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ticked, setTicked] = useState<Record<string, number[]>>({});
  const panel = useRef<HTMLDivElement>(null);

  if (progress.isError) return <div className="page-shell"><LoadError onRetry={() => { void progress.refetch(); }} /></div>;

  const done = new Set([...(progress.data ?? []).filter(row => row.completed).map(row => row.module_id), ...localDone]);
  const doneCount = RPK_TOPICS.filter(topic => done.has(topic.id)).length;
  const current = RPK_TOPICS.find(topic => topic.id === selected) ?? RPK_TOPICS.find(topic => !done.has(topic.id)) ?? RPK_TOPICS[0];
  const steps = current.steps[language];
  const ticks = ticked[current.id] ?? [];
  const allTicked = ticks.length === steps.length;
  // Saved but not yet refetched still counts, so the button does not flash back for a moment.
  const isDone = done.has(current.id) || (save.isSuccess && save.variables?.module_id === current.id);
  const nextTopic = RPK_TOPICS.find(topic => !done.has(topic.id) && topic.id !== current.id);

  const open = (topic: Topic) => {
    setSelected(topic.id);
    save.reset();
    // On a phone the list sits above the steps: bring the steps into view.
    if (window.matchMedia("(max-width: 767px)").matches) panel.current?.scrollIntoView({ block: "start" });
  };

  const toggle = (step: number) => setTicked(prev => {
    const list = prev[current.id] ?? [];
    return { ...prev, [current.id]: list.includes(step) ? list.filter(s => s !== step) : [...list, step] };
  });

  const markDone = () => {
    setSelected(current.id);
    if (isDevBypass) return setLocalDone(prev => [...prev, current.id]);
    if (user) save.mutate({ user_id: user.id, module_id: current.id, completed: true, completed_at: new Date().toISOString() });
  };

  return (
    <div className="page-shell page-enter">
      <header className="page-header">
        <h1 className="page-title">RPK / RSM</h1>
        <p className="page-lead">{t("rpk.lead")}</p>
      </header>

      {progress.isPending && !isDevBypass ? <p role="status">{t("common.loading")}</p> : (
        <>
          <div className="flex max-w-md items-center gap-4">
            <Progress value={(doneCount / RPK_TOPICS.length) * 100} aria-label={t("rpk.topicsCompleted", { done: doneCount, total: RPK_TOPICS.length })} />
            <p className="type-figure shrink-0 text-sm">{t("rpk.topicsCompleted", { done: doneCount, total: RPK_TOPICS.length })}</p>
          </div>

          <div className="grid gap-[var(--panel-gap)] md:grid-cols-[minmax(15rem,1fr)_2fr]">
            <nav aria-label={t("rpk.topicsNav")} className="space-y-6">
              {GROUPS.map(group => (
                <section key={group.routine} aria-labelledby={`rpk-${group.routine}`}>
                  <h2 id={`rpk-${group.routine}`} className="text-lg">{t(group.titleKey)}</h2>
                  <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
                    {RPK_TOPICS.filter(topic => topic.routine === group.routine).map(topic => {
                      const isCurrent = current.id === topic.id;
                      const topicDone = done.has(topic.id);
                      return (
                        <li key={topic.id}>
                          <button
                            type="button"
                            aria-current={isCurrent ? "step" : undefined}
                            onClick={() => open(topic)}
                            className={cn("tile flex h-full min-h-12 w-full items-center gap-3 p-3 text-left text-base font-semibold", isCurrent ? "tile-selected" : topicDone && "tile-done")}
                          >
                            <span className="min-w-0 flex-1">{topic.title[language]}</span>
                            {topicDone && <CheckCircle size={18} className="shrink-0 text-success" aria-label={t("rpk.doneState")} />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">{t(group.noteKey)}</p>
                </section>
              ))}
            </nav>

            <div ref={panel} className="scroll-mt-4">
              <Panel className="p-5 sm:p-8">
                <h2 className="text-[1.75rem]">{current.title[language]}</h2>
                {current.intro && <p className="mt-3 max-w-readable">{current.intro[language]}</p>}

                <ol className="my-6 space-y-2" aria-label={t("rpk.stepsLabel")}>
                  {steps.map((step, i) => {
                    const on = isDone || ticks.includes(i);
                    return (
                      <li key={step}>
                        <label className={cn("flex min-h-12 items-start gap-3.5 rounded-xl p-2.5 transition-base", isDone ? "cursor-default" : "cursor-pointer hover:bg-muted/60", on && "text-muted-foreground")}>
                          <input type="checkbox" className="peer sr-only" checked={on} disabled={isDone} onChange={() => toggle(i)} />
                          <span aria-hidden="true" className={cn("type-figure grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs transition-base peer-focus-visible:ring-2 peer-focus-visible:ring-brand-ink", on ? "border-success bg-success text-success-foreground" : "border-input bg-card")}>
                            {on ? <Check size={14} weight="bold" /> : i + 1}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{step}</span>
                        </label>
                      </li>
                    );
                  })}
                </ol>

                {current.routine === "rpk" && <p className="mb-5 max-w-readable text-sm text-muted-foreground">{t("rpk.fixFirst")}</p>}
                <Divider />

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {isDone ? (
                    <>
                      <p role="status" className="flex items-center gap-2 font-bold text-success"><CheckCircle size={20} aria-hidden="true" />{t("rpk.doneState")}</p>
                      {nextTopic && (
                        <Button variant="brand" className="h-auto min-h-11 whitespace-normal py-2.5 text-left" onClick={() => open(nextTopic)}>
                          {t("rpk.next", { title: nextTopic.title[language] })}
                          <ArrowRight aria-hidden="true" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="brand" disabled={!allTicked || save.isPending} loading={save.isPending} onClick={markDone}>
                        {t("rpk.markDone")}
                      </Button>
                      {!allTicked && <p className="text-sm text-muted-foreground">{t("rpk.tickAll", { count: steps.length - ticks.length })}</p>}
                    </>
                  )}
                  {save.isError && <p role="alert" className="w-full text-sm text-destructive">{t("rpk.saveFailed")}</p>}
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}

      <p className="flex max-w-readable items-start gap-2 text-sm text-muted-foreground">
        <Info size={18} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />
        {t("rpk.disclaimer")}
      </p>
    </div>
  );
}
