import { SpeechControl } from "@/components/shared/SpeechControl";
import { Fragment, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
} from "@/components/ui/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerPopup,
  DrawerPanel,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/ui/surface";
import { StartOverDialog } from "@/components/exam/StartOverDialog";
import { Button } from "@/components/ui/button";
import type { ExamQuestion } from "@/types/database";
import type { TranslationKey } from "@/lib/translations";
import type { ExamResult } from "@/lib/exam/scoring";
import { useExamSession } from "./useExamSession";

export type { ExamResult };

const CATEGORY_LABELS: Record<string, TranslationKey> = {
  "road-signs": "progress.category.road-signs",
  "traffic-rules": "progress.category.traffic-rules",
  "safety-principles": "progress.category.safety-principles",
};

interface ExamShellProps {
  questions: ExamQuestion[];
  language: "en" | "ms";
  timeLimit?: number;
  mode: "quiz" | "mock";
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  onComplete: (result: ExamResult) => void;
  onWarning?: () => void;
  onTimeUp?: () => void;
  /**
   * Storage scope for crash-safe resume (see lib/testProgress). Omit to opt out
   * of persistence entirely. Requires `userId` — progress is stored per user so
   * a shared device never restores one learner's attempt for another.
   */
  persistScope?: string;
  userId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExamShell({
  questions,
  language,
  timeLimit,
  mode,
  t,
  onComplete,
  onWarning,
  onTimeUp,
  persistScope,
  userId,
}: ExamShellProps) {
  const {
    currentIndex,
    answers,
    selectedOption,
    flagged,
    quizPhase,
    showSubmitModal,
    setShowSubmitModal,
    showNavigator,
    setShowNavigator,
    showExitModal,
    setShowExitModal,
    showStartOver,
    setShowStartOver,
    handleConfirmStartOver,
    shuffledQuestions,
    optionsRef,
    question,
    optionsEn,
    optionsMs,
    isLastQuestion,
    answeredCount,
    progressPercentage,
    timer,
    handleSelectOption,
    handleConfirmQuiz,
    handleNext,
    handlePrev,
    handleJump,
    toggleFlag,
    handleCancelSubmit,
    handleConfirmSubmit,
    handleRequestExit,
    handleConfirmExit,
    isCorrect,
  } = useExamSession({
    questions,
    timeLimit,
    mode,
    t,
    onComplete,
    onWarning,
    onTimeUp,
    persistScope,
    userId,
  });

  // ── Focus & scroll on question advance ───────────────────────────────────────
  // Runs after useExamSession's effect so keyboard and screen-reader users land
  // cleanly on the new question heading rather than mid-way down the options.
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevIndexRef.current !== null && prevIndexRef.current !== currentIndex) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
    prevIndexRef.current = currentIndex;
    questionHeadingRef.current?.focus({ preventScroll: true });
  }, [currentIndex]);

  // ── Render ──────────────────────────────────────────────────────────────────
  //
  // The exam room. AppLayout drops its header and tab bar while examMode is
  // set, so there is exactly one thing on screen and no way to wander into the
  // simulator with thirty minutes on the clock. This is a task surface: the
  // question sits on a solid, high-contrast panel scrolling beneath floating
  // Liquid Glass rails, and the clock is the only thing allowed to raise its voice.

  const timeIsShort = Boolean(timeLimit) && timer.secondsRemaining <= 300;
  const clampedProgress = Math.max(0, Math.min(1, progressPercentage / 100));

  // A mock runs in fixed parts (signs, rules, safety). Naming each run makes 70
  // squares read as three blocks; a one-category attempt needs no headings.
  const namedRuns = new Set(shuffledQuestions.map((q) => q.category)).size > 1;

  const navigator = (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
        {shuffledQuestions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = i === currentIndex;
          const isFlag = flagged.has(q.id);
          // Answered is filled, flagged is amber, current carries a ring:
          // three states that stay distinct in greyscale too.
          return (
            <Fragment key={q.id}>
              {namedRuns && q.category !== shuffledQuestions[i - 1]?.category && (
                <h3 className={cn("col-span-full font-heading text-sm font-bold", i > 0 && "mt-3")}>
                  {CATEGORY_LABELS[q.category] ? t(CATEGORY_LABELS[q.category]) : q.category}
                </h3>
              )}
              <button
                type="button"
                onClick={() => {
                  handleJump(i);
                  setShowNavigator(false);
                }}
                aria-label={t("exam.questionAria", {
                  num: i + 1,
                  answered: isAnswered ? t("exam.questionAriaAnswered") : "",
                  flagged: isFlag ? t("exam.questionAriaFlagged") : "",
                })}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "type-figure grid aspect-square min-h-11 min-w-11 place-items-center rounded-lg border text-sm transition-colors duration-150",
                  isFlag
                    ? "pill-flag"
                    : isAnswered
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  isCurrent && "ring-2 ring-brand-ink ring-offset-2 ring-offset-background"
                )}
              >
                {i + 1}
              </button>
            </Fragment>
          );
        })}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-3.5 rounded bg-foreground" />
          {t("exam.legend.answered")}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-3.5 rounded border border-border bg-card" />
          {t("exam.legend.unanswered")}
        </li>
        {mode === "mock" && (
          <li className="flex items-center gap-2">
            <span aria-hidden className="pill-flag h-3.5 w-3.5 rounded" />
            {t("exam.legend.flagged")}
          </li>
        )}
      </ul>
    </>
  );

  const position = (
    <>
      <span className="type-figure glass-ink text-sm">
        {currentIndex + 1}
        <span className="glass-muted"> / {shuffledQuestions.length}</span>
      </span>
      <span aria-hidden className="block h-1.5 w-24 overflow-hidden rounded-full bg-foreground/15 dark:bg-white/15 sm:w-40">
        <span
          className="block h-full w-full origin-left rounded-full bg-brand transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${clampedProgress})` }}
        />
      </span>
    </>
  );

  // Rendered through a portal, not in place: `.page-enter` animates
  // `transform`, which would make a page wrapper the containing block for this
  // full-viewport `position: fixed` room and collapse it.
  return createPortal(
    <div className="fixed inset-0 z-40 bg-background text-foreground">
      {/* ── Floating Liquid Glass top rail: exit, position, clock ──────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <header className="glass-bar pointer-events-auto mx-auto flex min-h-14 max-w-5xl items-center gap-1.5 rounded-2xl px-2 py-1.5 sm:min-h-16 sm:gap-2 sm:px-3">
          <button
            type="button"
            onClick={handleRequestExit}
            // The visible label is hidden below 640px, so the icon-only button
            // needs its own name or it reaches a screen reader as "button".
            aria-label={t("exam.exit")}
            className="tap-sm glass-control glass-ink flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium"
          >
            <X className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t("exam.exit")}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowStartOver(true)}
            aria-label={t("exam.startOver")}
            className="tap-sm glass-control glass-muted flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium"
          >
            <ArrowCounterClockwise className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t("exam.startOver")}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNavigator(true)}
            aria-label={t("exam.openNavigatorAt", { num: currentIndex + 1, total: shuffledQuestions.length })}
            className="tap-sm glass-control glass-ink mx-auto flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl px-3.5 py-1 lg:hidden"
          >
            {position}
          </button>
          <div className="mx-auto hidden flex-col items-center gap-1.5 lg:flex">
            {position}
          </div>

          {timeLimit ? (
            <div
              role="timer"
              aria-live="off"
              aria-label={t("quiz.timeRemaining")}
              // Under five minutes the clock becomes a red pill with a filled
              // icon: colour plus shape, so it reads for a colour-blind learner.
              className={cn(
                "type-figure tap-sm flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-base transition-colors sm:text-lg",
                timeIsShort ? "bg-destructive text-destructive-foreground" : "glass-pill glass-ink"
              )}
            >
              <Clock className="h-4 w-4 shrink-0" aria-hidden weight={timeIsShort ? "fill" : "regular"} />
              {timer.formattedTime}
            </div>
          ) : (
            <span className="h-11 w-11 shrink-0" aria-hidden />
          )}
        </header>
      </div>

      {/* ── Question ─────────────────────────────────────────────────────────
          One question, one screen. The solid `.panel` card scrolls beneath the
          floating Liquid Glass rails; measure is capped so a line of Malay,
          which runs about a third longer than English, still breaks comfortably. */}
      <div ref={scrollContainerRef} className="h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-24 pb-28 sm:px-6 sm:pt-28 sm:pb-32 lg:max-w-5xl lg:flex-row lg:items-start lg:gap-8">
          <article key={question.id} className="panel min-w-0 flex-1 p-5 sm:p-8 animate-content-in">
            {mode === "mock" && (
              <button
                type="button"
                onClick={toggleFlag}
                aria-pressed={flagged.has(question.id)}
                className={cn(
                  "tap-sm mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  flagged.has(question.id) ? "pill-flag" : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <Flag className="h-4 w-4 shrink-0" weight={flagged.has(question.id) ? "fill" : "regular"} aria-hidden />
                {flagged.has(question.id) ? t("exam.unflagQuestion") : t("exam.flagQuestion")}
              </button>
            )}

            <h1
              id="exam-question"
              ref={questionHeadingRef}
              tabIndex={-1}
              className="font-heading text-pretty text-[1.375rem] font-extrabold leading-snug tracking-[-0.015em] focus:outline-none sm:text-[1.625rem]"
            >
              {language === "en"
                ? question.question_en || question.question_ms
                : question.question_ms || question.question_en}
            </h1>
            <SpeechControl key={`${question.id}-${language}`} text={[(language === "en" ? question.question_en || question.question_ms : question.question_ms || question.question_en), ...optionsEn.map((option, index) => `${String.fromCharCode(65 + index)}. ${language === "ms" ? optionsMs[index] || option : option || optionsMs[index]}`)].filter(Boolean).join(". ")} />
            {language === "en" && !question.question_en && (
              <p className="mt-2 text-sm italic text-muted-foreground">(English translation unavailable)</p>
            )}
            {language === "ms" && !question.question_ms && (
              <p className="mt-2 text-sm italic text-muted-foreground">(Terjemahan BM tidak tersedia)</p>
            )}

            {question.image_url && (
              <div className="mt-5 overflow-hidden rounded-xl border border-border bg-muted/30">
                <img src={question.image_url} alt="" className="mx-auto max-h-44 w-auto object-contain p-4 sm:max-h-56" />
              </div>
            )}

            <div
              className="mt-7 space-y-3"
              ref={optionsRef}
              role="radiogroup"
              aria-labelledby="exam-question"
              // Arrow keys move through the options and select, as a radio group should; Tab then leaves the group.
              onKeyDown={(e) => {
                const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
                if (!step) return;
                const radios = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]:not(:disabled)")];
                const at = radios.indexOf(document.activeElement as HTMLButtonElement);
                if (at < 0) return;
                e.preventDefault();
                const next = radios[(at + step + radios.length) % radios.length];
                next.focus();
                next.click();
              }}
            >
              {optionsEn.map((optEn, i) => {
                const optMs = optionsMs[i] || "";
                const isSelected = selectedOption === i;
                const isRevealed = mode === "quiz" && quizPhase === "revealed";
                const optionIsCorrect = isCorrect(i);
                const userChoseThis = isSelected && isRevealed;

                // State is an edge, a tint and a filled letter chip together,
                // so it never rests on colour alone.
                let tileState = "tile-open";
                let chip = "border-border bg-muted text-muted-foreground";
                if (isSelected && !isRevealed) {
                  tileState = "tile-selected";
                  chip = "border-brand-ink bg-brand text-brand-foreground";
                }
                if (isRevealed && optionIsCorrect) {
                  tileState = "tile-done";
                  chip = "border-success bg-success text-success-foreground";
                }
                if (isRevealed && userChoseThis && !optionIsCorrect) {
                  tileState = "tile-fail";
                  chip = "border-destructive bg-destructive text-destructive-foreground";
                }

                return (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={(selectedOption === null ? i === 0 : isSelected) ? 0 : -1}
                    onClick={() => handleSelectOption(i)}
                    disabled={isRevealed}
                    className={cn(
                      "tile flex min-h-14 w-full min-w-0 items-center gap-3.5 p-3.5 text-left",
                      tileState,
                      isRevealed && "cursor-default"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn("type-figure grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-sm tabular-nums transition-colors duration-150", chip)}
                    >
                      {isRevealed && optionIsCorrect ? (
                        <CheckCircle className="h-5 w-5" weight="fill" />
                      ) : isRevealed && userChoseThis && !optionIsCorrect ? (
                        <XCircle className="h-5 w-5" weight="fill" />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-pretty text-base font-medium leading-snug">
                      {language === "en" ? optEn || optMs : optMs || optEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {mode === "quiz" && quizPhase === "revealed" && (question.explanation_en || question.explanation_ms) && (
              <div className="mt-6 rounded-xl border border-brand-ink/25 bg-brand/15 p-4 sm:p-5">
                <p className="text-sm font-semibold text-brand-ink">{t("quiz.explanation")}</p>
                <p className="mt-1.5 text-pretty text-base leading-relaxed">
                  {language === "en"
                    ? question.explanation_en || question.explanation_ms
                    : question.explanation_ms || question.explanation_en}
                </p>
                <SpeechControl kind="explanation" text={(language === "en" ? question.explanation_en || question.explanation_ms : question.explanation_ms || question.explanation_en) ?? ""} />
                {question.source_url && <p className="mt-3 text-sm text-muted-foreground">{t("exam.sourceCitation")}: {question.source_url}</p>}
              </div>
            )}
          </article>

          {/* On a wide screen the navigator is simply always open. On a phone it
              is the sheet below: same markup, no second implementation. */}
          <aside className="hidden w-80 shrink-0 lg:sticky lg:top-28 lg:block">
            <div className="panel p-5">
              <SectionTitle className="mb-4 text-base md:text-base">{t("exam.navigator")}</SectionTitle>
              {navigator}
            </div>
            {mode === "quiz" && (
              <div className="mt-4 rounded-2xl border border-border bg-muted/60 p-4">
                <p className="text-sm font-semibold">{t("exam.practiceTip")}</p>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {t("exam.practiceTipBody")}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Floating Liquid Glass action bar ─────────────────────────────────
          In the thumb zone and padded past the home indicator. The primary
          action takes the remaining width, so "Seterusnya" has room without
          the bar reflowing between languages. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
        <div className="glass-bar pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-2.5 rounded-2xl p-2 sm:p-2.5 lg:max-w-5xl">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label={t("quiz.previous")}
            className="h-12 w-12 min-h-11 min-w-11 shrink-0 rounded-xl"
          >
            <ArrowLeft className="!size-5" aria-hidden />
          </Button>

          {mode === "quiz" && quizPhase === "answering" ? (
            <Button
              variant="brand"
              onClick={handleConfirmQuiz}
              disabled={selectedOption === null}
              className="h-12 min-h-11 flex-1 rounded-xl text-base"
            >
              {t("exam.confirmAnswer")}
            </Button>
          ) : (
            <Button variant="brand" onClick={handleNext} className="h-12 min-h-11 flex-1 rounded-xl text-base">
              <span className="truncate">{isLastQuestion ? t(mode === "mock" ? "mock.submit" : "quiz.submit") : t("quiz.next")}</span>
              {!isLastQuestion && <ArrowRight className="!size-5 shrink-0" aria-hidden weight="bold" />}
            </Button>
          )}
        </div>
      </div>

      {/* ── Question navigator (phone) ─────────────────────────────────────── */}
      <Drawer open={showNavigator} onOpenChange={setShowNavigator}>
        <DrawerPopup className="lg:hidden" showBar>
          <DrawerPanel>
            <DrawerHeader className="text-left">
              <DrawerTitle>{t("exam.navigator")}</DrawerTitle>
              <DrawerDescription>
                {t("quiz.answered", { count: answeredCount, total: shuffledQuestions.length })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[50dvh] overflow-y-auto px-4 pb-6">{navigator}</div>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>

      {/* ── Submit confirmation ─────────────────────────────────────────────── */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(mode === "mock" ? "mock.confirmSubmit" : "quiz.confirmSubmit")}</DialogTitle>
            <DialogDescription>
              {t("quiz.confirmSubmitDesc", { unanswered: shuffledQuestions.length - answeredCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="min-h-11 w-full sm:w-auto" onClick={handleCancelSubmit}>
              {t("common.cancel")}
            </Button>
            <Button variant="brand" className="min-h-11 w-full sm:w-auto" onClick={handleConfirmSubmit}>
              {t(mode === "mock" ? "mock.submit" : "quiz.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StartOverDialog open={showStartOver} onOpenChange={setShowStartOver} onConfirm={handleConfirmStartOver} timed={Boolean(timeLimit)} />

      {/* ── Exit confirmation ───────────────────────────────────────────────
          Exiting is the only way out, so it is honest about the cost: the work
          is kept, but on a mock the clock does not stop. */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("exam.exitConfirm")}</DialogTitle>
            <DialogDescription>{t("exam.exitConfirmDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="min-h-11 w-full sm:w-auto" onClick={() => setShowExitModal(false)}>
              {t("exam.stay")}
            </Button>
            <Button variant="destructive" className="min-h-11 w-full sm:w-auto" onClick={handleConfirmExit}>
              {t("exam.exitConfirmAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
    document.body
  );
}
