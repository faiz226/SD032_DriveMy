import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "@/components/ui/icons";
import { ROAD_SIGN_CATEGORIES, roadSigns, type RoadSignCategory } from "@/content/theory";
import { categoryProgress, pickOptions, pickRound, poolOf, recordAnswer, roundSize, type LearntMap } from "@/lib/signQuiz";

type Lang = "en" | "bm";

interface SignMiniQuizzesProps {
  lang: Lang;
  learnt: LearntMap;
  onChange: (next: LearntMap) => void;
}

interface Round {
  category: RoadSignCategory;
  ids: string[];
  index: number;
  options: string[];
  picked: string | null;
  right: number;
}

const byId = new Map(roadSigns.map((sign) => [sign.id, sign]));
const allIds = roadSigns.map((sign) => sign.id);
const idsOf = (category: RoadSignCategory) => roadSigns.filter((sign) => sign.type === category).map((sign) => sign.id);

/**
 * Mini quizzes, one set per category. A sign answered right is learnt and leaves the pool; a sign answered wrong
 * comes back in a later round. A category is learnt when nothing is left in its pool.
 */
export function SignMiniQuizzes({ lang, learnt, onChange }: SignMiniQuizzesProps) {
  const [round, setRound] = useState<Round | null>(null);
  const [finished, setFinished] = useState<{ category: RoadSignCategory; right: number; asked: number } | null>(null);
  const en = lang === "en";

  const totals = useMemo(() => categoryProgress(allIds, learnt), [learnt]);

  const start = (category: RoadSignCategory) => {
    const ids = pickRound(poolOf(idsOf(category), learnt));
    if (!ids.length) return;
    setFinished(null);
    setRound({ category, ids, index: 0, options: pickOptions(ids[0], idsOf(category), allIds), picked: null, right: 0 });
  };

  const pick = (id: string) => {
    if (!round || round.picked) return;
    const correct = id === round.ids[round.index];
    onChange(recordAnswer(learnt, round.ids[round.index], correct));
    setRound({ ...round, picked: id, right: round.right + (correct ? 1 : 0) });
  };

  const next = () => {
    if (!round) return;
    const index = round.index + 1;
    if (index >= round.ids.length) {
      setFinished({ category: round.category, right: round.right, asked: round.ids.length });
      setRound(null);
      return;
    }
    setRound({ ...round, index, picked: null, options: pickOptions(round.ids[index], idsOf(round.category), allIds) });
  };

  const label = (category: RoadSignCategory) => {
    const c = ROAD_SIGN_CATEGORIES.find((item) => item.id === category);
    return c ? (en ? c.labelEn : c.labelMs) : category;
  };

  if (round) {
    const sign = byId.get(round.ids[round.index])!;
    const answered = round.picked !== null;
    const gotIt = round.picked === sign.id;
    return (
      <section className="panel space-y-4 p-4 sm:p-5" aria-label={en ? "Mini quiz" : "Kuiz mini"}>
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <span className="pill pill-info">{label(round.category)}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {en ? "Question" : "Soalan"} {round.index + 1} / {round.ids.length}
          </span>
        </div>
        <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
          {en ? `Which sign means “${sign.meaning}”?` : `Papan tanda manakah bermaksud “${sign.meaningMs}”?`}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {round.options.map((id, slot) => {
            const option = byId.get(id)!;
            const isRight = id === sign.id;
            const isPicked = id === round.picked;
            const state = answered ? (isRight ? "border-success bg-success/10" : isPicked ? "border-destructive bg-destructive/10" : "") : "";
            return (
              <button
                key={id}
                type="button"
                disabled={answered}
                onClick={() => pick(id)}
                className={`tile flex h-36 cursor-pointer flex-col items-center justify-center gap-2 p-3 disabled:cursor-default ${state}`}
              >
                <img src={option.img} alt={en ? `Sign option ${slot + 1}` : `Pilihan tanda ${slot + 1}`} className="max-h-[72px] max-w-[72px] object-contain" loading="lazy" />
                {answered && isRight && (
                  <span className="flex items-center gap-1 text-[0.8125rem] font-bold text-success">
                    <Check size={13} aria-hidden="true" />
                    {en ? "Correct" : "Tepat"}
                  </span>
                )}
                {answered && isPicked && !isRight && (
                  <span className="flex items-center gap-1 text-[0.8125rem] font-bold text-destructive">
                    <X size={13} aria-hidden="true" />
                    {en ? "Not this one" : "Bukan yang ini"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="flex flex-wrap items-center justify-between gap-3" role="status">
            <p className="text-xs text-muted-foreground">
              {gotIt
                ? en ? "Learnt. It leaves your quiz pool." : "Dipelajari. Ia keluar daripada kumpulan kuiz anda."
                : en ? "Not yet. This sign comes back in a later round." : "Belum lagi. Tanda ini akan muncul semula pada pusingan seterusnya."}
              {" "}
              {en ? sign.action : sign.actionMs}
            </p>
            <Button size="sm" className="min-h-11" onClick={next}>
              {round.index + 1 >= round.ids.length ? (en ? "Finish" : "Selesai") : en ? "Next" : "Seterusnya"}
            </Button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="panel space-y-4 p-4 sm:p-5" aria-label={en ? "Mini quizzes" : "Kuiz mini"}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h3 className="text-base font-bold font-heading">{en ? "Mini quizzes" : "Kuiz mini"}</h3>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {totals.learnt} / {totals.total} {en ? "learnt" : "dipelajari"}
        </span>
      </div>
      {finished && (
        <p role="status" className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
          {en
            ? `${label(finished.category)}: ${finished.right} of ${finished.asked} right. `
            : `${label(finished.category)}: ${finished.right} daripada ${finished.asked} betul. `}
          {categoryProgress(idsOf(finished.category), learnt).done
            ? en ? "Every sign here is learnt." : "Semua tanda di sini telah dipelajari."
            : en ? "The ones you missed come back next round." : "Yang tersilap akan muncul semula pada pusingan seterusnya."}
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {ROAD_SIGN_CATEGORIES.map((category) => {
          const progress = categoryProgress(idsOf(category.id), learnt);
          const percent = progress.total ? (progress.learnt / progress.total) * 100 : 0;
          return (
            <li key={category.id} className="space-y-2.5 rounded-2xl border border-border bg-muted/35 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{en ? category.labelEn : category.labelMs}</span>
                <span className="type-figure text-sm tabular-nums">
                  {progress.learnt} / {progress.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={en ? `${progress.learnt} of ${progress.total} learnt` : `${progress.learnt} daripada ${progress.total} dipelajari`}>
                <div
                  className="h-full w-full origin-left bg-success transition-transform duration-300 motion-reduce:transition-none"
                  style={{ transform: `scaleX(${Math.min(1, Math.max(0, percent / 100))})` }}
                />
              </div>
              {progress.done ? (
                <p className="flex min-h-11 items-center gap-1.5 text-xs font-bold text-success">
                  <Check size={14} aria-hidden="true" />
                  {en ? "Learnt" : "Dipelajari"}
                </p>
              ) : (
                <Button size="sm" variant="outline" className="min-h-11" onClick={() => start(category.id)}>
                  {en ? `Start a round (${roundSize(progress.left)})` : `Mula pusingan (${roundSize(progress.left)})`}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
