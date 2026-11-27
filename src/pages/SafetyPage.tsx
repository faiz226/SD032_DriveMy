import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { EMERGENCIES, type Emergency } from "@/content/road-safety";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Panel } from "@/components/ui/surface";
import { ArrowClockwise, ArrowRight, CheckCircle, XCircle } from "@/components/ui/icons";
import { SwapIcon } from "@/components/ui/swap-icon";
import { cn } from "@/lib/utils";

/** A fresh option order for every emergency, so the right answer is not always in the same place. */
function shuffledOrders() {
  return EMERGENCIES.map(() => {
    const order = [0, 1, 2];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });
}

function Steps({ emergency }: { emergency: Emergency }) {
  const { language } = useLanguage();
  return (
    <ol className="space-y-3">
      {emergency.steps[language].map((step, i) => (
        <li key={step} className="flex gap-3">
          <span className="type-figure grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs">{i + 1}</span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function SafetyPage() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState(shuffledOrders);
  const [index, setIndex] = useState(0);
  // The option each emergency was answered with; 0 is the KPP answer.
  const [picks, setPicks] = useState<number[]>([]);
  const feedback = useRef<HTMLHeadingElement>(null);

  const finished = picks.length === EMERGENCIES.length && index === EMERGENCIES.length;
  const emergency = EMERGENCIES[index];
  const pick = picks[index];

  useEffect(() => {
    if (pick !== undefined) feedback.current?.focus();
  }, [pick]);

  const restart = () => {
    setOrders(shuffledOrders());
    setPicks([]);
    setIndex(0);
  };

  const header = (
    <header className="page-header">
      <h1 className="page-title">{t("safety.title")}</h1>
      <p className="page-lead">{t("safety.lead")}</p>
    </header>
  );

  if (finished) {
    const missed = EMERGENCIES.filter((_, i) => picks[i] !== 0);
    const score = EMERGENCIES.length - missed.length;
    return (
      <div className="page-shell">
        {header}
        <Panel
          role="region"
          className={cn("mx-auto w-full max-w-3xl p-5 sm:p-8", missed.length === 0 && "border-success/55")}
          aria-labelledby="safety-score"
        >
          <h2 id="safety-score" className="text-xl sm:text-2xl">{t("safety.result.title", { score, total: EMERGENCIES.length })}</h2>
          <p className="mt-2 max-w-readable text-muted-foreground">{missed.length === 0 ? t("safety.result.allRight") : t("safety.result.someMissed")}</p>
          <Button variant="brand" size="lg" className="mt-6 min-h-11" onClick={restart}>
            <ArrowClockwise aria-hidden="true" />
            {t("safety.restart")}
          </Button>
        </Panel>

        {missed.length > 0 && (
          <section aria-labelledby="safety-review" className="mx-auto w-full max-w-3xl space-y-4">
            <h2 id="safety-review" className="text-xl sm:text-2xl">{t("safety.result.review")}</h2>
            {missed.map(item => (
              <Panel key={item.id} className="space-y-4 p-5 sm:p-6">
                <h3 className="text-lg">{item.situation[language]}</h3>
                <Steps emergency={item} />
              </Panel>
            ))}
          </section>
        )}
      </div>
    );
  }

  const answered = pick !== undefined;
  const answeredCount = picks.filter((p) => p !== undefined).length;
  const right = pick === 0;
  const last = index === EMERGENCIES.length - 1;

  return (
    <div className="page-shell">
      {header}
      <Panel className="mx-auto w-full max-w-3xl p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="type-figure text-sm" aria-live="polite">{t("safety.progress", { current: index + 1, total: EMERGENCIES.length })}</p>
          {(index > 0 || answered) && (
            <Button variant="ghost" className="-mr-3 min-h-11 px-3 text-muted-foreground hover:text-foreground" onClick={restart}>
              <ArrowClockwise aria-hidden="true" />
              {t("safety.restart")}
            </Button>
          )}
        </div>
        <Progress value={(answeredCount / EMERGENCIES.length) * 100} className="mt-3" aria-label={t("safety.progress", { current: index + 1, total: EMERGENCIES.length })} />

        <h2 className="mt-8 text-xl sm:text-2xl">{emergency.situation[language]}</h2>
        <p className="mt-2 text-muted-foreground" id="safety-question">{t("safety.question")}</p>

        <div className="mt-5 grid gap-3" role="group" aria-labelledby="safety-question">
          {orders[index].map(option => {
            const isKpp = option === 0;
            const isPick = option === pick;
            return (
              <button
                key={option}
                type="button"
                disabled={answered}
                aria-pressed={isPick}
                onClick={() => setPicks(prev => { const next = [...prev]; next[index] = option; return next; })}
                className={cn(
                  "tile flex min-h-14 w-full items-start gap-3 rounded-xl p-4 text-left disabled:cursor-default",
                  answered && isKpp && "tile-done",
                  answered && isPick && !isKpp && "tile-fail",
                  answered && !isKpp && !isPick && "opacity-60",
                )}
              >
                {answered && isKpp && <CheckCircle size={20} className="mt-0.5 shrink-0 text-success" aria-label={t("safety.kppAnswer")} />}
                {answered && isPick && !isKpp && <XCircle size={20} className="mt-0.5 shrink-0 text-destructive" aria-label={t("safety.yourAnswer")} />}
                <span>{emergency.options[option][language]}</span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          {answered && (
            <div className="mt-8 space-y-4 border-t border-border pt-6">
              <h3 ref={feedback} tabIndex={-1} className="flex items-center gap-2 text-xl focus-visible:shadow-none focus-visible:outline-none">
                <SwapIcon id={right ? "right" : "wrong"}>{right ? <CheckCircle size={24} className="text-success" aria-hidden="true" /> : <XCircle size={24} className="text-destructive" aria-hidden="true" />}</SwapIcon>
                {right ? t("safety.right") : t("safety.wrong")}
              </h3>
              <p className="font-bold">{t("safety.steps")}</p>
              <Steps emergency={emergency} />
              <Button variant="brand" size="lg" className="mt-2 w-full sm:w-auto" onClick={() => setIndex(index + 1)}>
                {last ? t("safety.finish") : t("safety.next")}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
