import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useActivityStore } from "@/stores/activityStore";
import { useSaveResultMutation } from "@/hooks/useResults";
import { saveColorblindResult } from "@/services/results.service";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Panel, Pill, type PillTone } from "@/components/ui/surface";
import { ArrowClockwise, ArrowLeft, ArrowRight, CheckCircle, Info, Warning } from "@/components/ui/icons";
import { PLATES, plateImage, scoreTest, type Plate, type Reading } from "@/content/color-vision";
import { saveProgress, loadProgress, clearProgress, PROGRESS_SCOPES } from "@/lib/testProgress";
import type { TranslationKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

/** An unfinished test, kept on the device so a stray tap on the menu does not lose it. */
interface SavedTest {
  answers: Record<number, string>;
  index: number;
}

const READING: Record<Reading, { key: TranslationKey; tone: PillTone }> = {
  normal: { key: "color.reading.normal", tone: "success" },
  redGreen: { key: "color.reading.redGreen", tone: "warning" },
  protan: { key: "color.reading.protan", tone: "warning" },
  deutan: { key: "color.reading.deutan", tone: "warning" },
  other: { key: "color.reading.other", tone: "neutral" },
};

/** A plate as the learner sees it: round, like the printed card, so its white margin never shows on a dark card. */
function PlateImage({ plate, className }: { plate: Plate; className?: string }) {
  const { t } = useLanguage();
  return (
    <span className={cn("block aspect-square shrink-0 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-border", className)}>
      <img src={plateImage(plate.n)} alt={t("color.plateAlt", { num: plate.n })} className="h-full w-full scale-[1.04] object-cover" width={233} height={233} />
    </span>
  );
}

export function ColorVisionPage() {
  const { t } = useLanguage();
  const user = useAuthStore(s => s.user);
  const isDevBypass = useAuthStore(s => s.isDevBypass);
  const saveMutation = useSaveResultMutation(saveColorblindResult, { successToastKey: "color.saved", errorToastKey: "color.error.saveFailed" });

  // Read once, before the first paint, so a resumed test opens on the plate the learner left.
  const [restored] = useState(() => {
    const saved = user?.id ? loadProgress<SavedTest>(PROGRESS_SCOPES.colorVision, user.id) : null;
    // A snapshot from the old shuffled test has no plain index: start fresh rather than land on a wrong plate.
    return saved && typeof saved.data.index === "number" && saved.data.answers ? saved : null;
  });
  const [phase, setPhase] = useState<"intro" | "test" | "result">(restored ? "test" : "intro");
  const [answers, setAnswers] = useState<Record<number, string>>(restored?.data.answers ?? {});
  const [index, setIndex] = useState(restored?.data.index ?? 0);
  const [draft, setDraft] = useState(() => (restored ? restored.data.answers[PLATES[restored.data.index].n] ?? "" : ""));
  const [showAll, setShowAll] = useState(false);
  const startedAt = useRef(restored?.startedAt ?? Date.now());
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (restored) toast.success(t("color.resumed"));
    // Once, for a resumed test only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snapshot after every answer; the inactivity sign-out waits while a test is running.
  useEffect(() => {
    if (phase !== "test" || !user?.id) return;
    saveProgress<SavedTest>(PROGRESS_SCOPES.colorVision, user.id, startedAt.current, { answers, index });
  }, [phase, answers, index, user?.id]);

  useEffect(() => {
    if (phase !== "test") return;
    const { beginTest, endTest } = useActivityStore.getState();
    beginTest();
    return endTest;
  }, [phase]);

  useEffect(() => {
    if (phase !== "test" || Object.keys(answers).length === 0) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase, answers]);

  const plate = PLATES[index];

  const start = () => {
    startedAt.current = Date.now();
    setShowAll(false);
    setAnswers({});
    setIndex(0);
    setDraft("");
    setPhase("test");
  };

  const goTo = (next: number, all: Record<number, string>) => {
    setIndex(next);
    setDraft(all[PLATES[next].n] ?? "");
    input.current?.focus();
  };

  const answer = (value: string) => {
    const next = { ...answers, [plate.n]: value };
    setAnswers(next);
    if (index < PLATES.length - 1) return goTo(index + 1, next);

    if (user?.id) clearProgress(PROGRESS_SCOPES.colorVision, user.id);
    setPhase("result");
    // The dev sign-in has no real session, so nothing is written for it.
    if (user && !isDevBypass) {
      const { normal } = scoreTest(next);
      saveMutation.mutate({
        user_id: user.id,
        score: normal,
        total_plates: PLATES.length,
        percentage: Math.round((normal / PLATES.length) * 100),
        answers: Object.fromEntries(Object.entries(next)),
      });
    }
  };

  if (phase === "intro") {
    return (
      <div className="page-shell page-enter">
        <header className="page-header">
          <h1 className="page-title">{t("color.title")}</h1>
          <p className="page-lead">{t("color.lead")}</p>
        </header>

        <Panel className="grid items-center gap-8 p-5 sm:p-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-readable space-y-6">
            <section aria-labelledby="color-how">
              <h2 id="color-how" className="text-xl">{t("color.how.title")}</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>{t("color.how.plates")}</li>
                <li>{t("color.how.answer")}</li>
                <li>{t("color.how.first")}</li>
              </ul>
            </section>
            <section aria-labelledby="color-setup">
              <h2 id="color-setup" className="text-xl">{t("color.setup.title")}</h2>
              <ul className="mt-3 space-y-2">
                {(["color.setup.brightness", "color.setup.filters", "color.setup.glasses"] as const).map(key => (
                  <li key={key} className="flex gap-2.5">
                    <CheckCircle size={20} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <Button variant="brand" size="lg" onClick={start}>
              {t("color.start")}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <PlateImage plate={PLATES[0]} className="mx-auto w-48 sm:w-60" />
        </Panel>

        <p className="flex max-w-readable items-start gap-2 text-sm text-muted-foreground">
          <Info size={18} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />
          {t("color.note")}
        </p>
      </div>
    );
  }

  if (phase === "test") {
    const last = index === PLATES.length - 1;
    return (
      <div className="page-shell page-enter">
        <header className="page-header">
          <h1 className="page-title">{t("color.title")}</h1>
        </header>
        <Panel className="mx-auto w-full max-w-xl p-5 sm:p-8">
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="type-figure" aria-live="polite">{t("color.plate", { current: index + 1, total: PLATES.length })}</p>
            {index > 0 && (
              <Button variant="ghost" className="-mr-3 px-3" onClick={() => goTo(index - 1, answers)}>
                <ArrowLeft aria-hidden="true" />
                {t("color.previous")}
              </Button>
            )}
          </div>
          <Progress value={((index + 1) / PLATES.length) * 100} className="mt-3" aria-label={t("color.plate", { current: index + 1, total: PLATES.length })} />

          <PlateImage key={plate.n} plate={plate} className="mx-auto my-8 w-[min(15rem,70vw)] sm:w-72" />

          <form
            className="mx-auto max-w-sm space-y-3"
            onSubmit={e => { e.preventDefault(); if (draft) answer(draft); }}
          >
            <label htmlFor="plate-answer" className="block text-center font-bold">{t("color.question")}</label>
            <input
              ref={input}
              id="plate-answer"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]*"
              maxLength={2}
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value.replace(/\D/g, ""))}
              className="type-figure h-16 w-full rounded-xl border border-input bg-card text-center text-3xl transition-base focus-visible:border-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-ink/20"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" size="lg" onClick={() => answer("")}>
                {t("color.nothing")}
              </Button>
              <Button type="submit" variant="brand" size="lg" disabled={!draft}>
                {last ? t("color.finish") : t("color.next")}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    );
  }

  const result = scoreTest(answers);
  const verdict = {
    clear: { tile: "tile-done", icon: CheckCircle, title: t("color.result.clear.title"), body: t("color.result.clear.body") },
    check: { tile: "tile-progress", icon: Warning, title: t("color.result.check.title", { count: result.differ }), body: t("color.result.check.body", { redGreen: result.redGreen }) },
    invalid: { tile: "tile-fail", icon: Warning, title: t("color.result.invalid.title"), body: t("color.result.invalid.body") },
  }[result.outcome];
  const VerdictIcon = verdict.icon;

  return (
    <div className="page-shell page-enter">
      <header className="page-header">
        <h1 className="page-title">{t("color.result.title")}</h1>
      </header>

      <section className={cn("tile p-5 sm:p-8", verdict.tile)} aria-labelledby="color-verdict">
        <div className="max-w-readable space-y-3">
          <h2 id="color-verdict" className="flex items-start gap-3 text-2xl">
            <VerdictIcon size={28} className="mt-0.5 shrink-0" aria-hidden="true" />
            {verdict.title}
          </h2>
          <p>{verdict.body}</p>
          {result.outcome === "check" && <p className="text-muted-foreground">{t("color.result.check.advice")}</p>}
        </div>
        <Button variant="outline" className="mt-6" onClick={start}>
          <ArrowClockwise aria-hidden="true" />
          {t("color.retake")}
        </Button>
      </section>

      <section aria-labelledby="color-review" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="color-review" className="text-2xl">{t(showAll ? "color.review.title" : "color.review.differ")}</h2>
          <Button variant="outline" aria-pressed={showAll} onClick={() => setShowAll(v => !v)}>
            {showAll ? t("color.review.showDiffer") : t("color.review.showAll", { total: PLATES.length })}
          </Button>
        </div>
        {!showAll && result.differ === 0 && result.outcome !== "invalid" && <p className="text-muted-foreground">{t("color.review.noneDiffer")}</p>}
        <ul className="grid gap-3 lg:grid-cols-2">
          {result.readings.filter(r => showAll || r.reading !== "normal").map(({ plate: p, answer: given, reading }) => {
            // Each reading as "label: value", so long Malay labels and values wrap like a sentence.
            const rows: [string, string][] = [
              [t("color.review.you"), given || t("color.nothing")],
              [t("color.review.normal"), p.normal ?? t("color.nothing")],
              ...(p.protan !== undefined
                ? [[t("color.reading.protan"), p.protan], [t("color.reading.deutan"), p.deutan ?? ""]] as [string, string][]
                : p.redGreen !== undefined ? [[t("color.review.redGreen"), p.redGreen ?? t("color.review.missOrWrong")]] as [string, string][] : []),
            ];
            return (
              <li key={p.n} className="panel flex items-start gap-4 p-4">
                <PlateImage plate={p} className="w-16 sm:w-20" />
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{t("color.plateLabel", { num: p.n })}</span>
                    <Pill tone={READING[reading].tone}>{t(READING[reading].key)}</Pill>
                  </div>
                  <dl className="space-y-0.5">
                    {rows.map(([label, value]) => (
                      <div key={label}>
                        <dt className="inline text-muted-foreground">{label}: </dt>
                        <dd className="type-figure inline">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="flex max-w-readable items-start gap-2 text-sm text-muted-foreground">
        <Info size={18} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />
        {t("color.note")}
      </p>
    </div>
  );
}
