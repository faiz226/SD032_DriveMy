import { SpeechControl } from "@/components/shared/SpeechControl";
import { createPortal } from "react-dom";
import {
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  X,
  ArrowLeft,
  ArrowRight,
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
import { Button } from "@/components/ui/button";
import type { ExamQuestion } from "@/types/database";
import type { TranslationKey } from "@/lib/translations";
import type { ExamResult } from "@/lib/exam/scoring";
import { useExamSession } from "./useExamSession";

export type { ExamResult };

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

  // ── Render ──────────────────────────────────────────────────────────────────
  //
  // The exam room. AppLayout drops its header and tab bar while examMode is
  // set, so there is exactly one thing on screen and no way to wander into the
  // simulator with thirty minutes on the clock. This is a task surface: the
  // question is the only thing set large, and the clock is the only thing
  // allowed to raise its voice.

  const timeIsShort = Boolean(timeLimit) && timer.secondsRemaining <= 300;

  const navigator = (
    <>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {shuffledQuestions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = i === currentIndex;
          const isFlag = flagged.has(q.id);
          // Answered is filled, flagged is amber, current carries a ring:
          // three states that stay distinct in greyscale too.
          return (
            <button
              key={q.id}
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
                "type-figure grid aspect-square min-h-0 min-w-0 place-items-center rounded-lg border text-sm transition-colors duration-150",
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

  // Rendered through a portal, not in place: `.page-enter` animates
  // `transform`, which would make a page wrapper the containing block for this
  // full-viewport `position: fixed` room and collapse it.
  return createPortal(
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      {/* ── Rail: exit, position, clock ─────────────────────────────────────── */}
      <header className="glass flex h-16 shrink-0 items-center gap-2 border-b border-border/70 px-2 sm:px-4">
        <button
          type="button"
          onClick={handleRequestExit}
          // The visible label is hidden below 640px, so the icon-only button
          // needs its own name or it reaches a screen reader as "button".
          aria-label={t("exam.exit")}
          className="tap-sm flex items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{t("exam.exit")}</span>
        </button>

        {/* Position doubles as the navigator trigger: the number you look at to
            know where you are is the thing you tap to go somewhere else. */}
        <button
          type="button"
          onClick={() => setShowNavigator(true)}
          aria-label={t("exam.openNavigator")}
          className="tap-sm mx-auto flex flex-col items-center justify-center gap-1.5 rounded-xl px-3"
        >
          <span className="type-figure text-sm">
            {currentIndex + 1}
            <span className="text-muted-foreground"> / {shuffledQuestions.length}</span>
          </span>
          <span aria-hidden className="block h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:w-40">
            <span
              className="block h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </span>
        </button>

        {timeLimit ? (
          <div
            role="timer"
            aria-live="off"
            aria-label={t("quiz.timeRemaining")}
            // Under five minutes the clock becomes a red pill with a filled
            // icon: colour plus shape, so it reads for a colour-blind learner.
            className={cn(
              "type-figure tap-sm flex items-center gap-1.5 rounded-full px-3 text-lg transition-colors",
              timeIsShort ? "bg-destructive text-destructive-foreground" : "bg-muted text-foreground"
            )}
          >
            <Clock className="h-4 w-4 shrink-0" aria-hidden weight={timeIsShort ? "fill" : "regular"} />
            {timer.formattedTime}
          </div>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </header>

      {/* ── Question ─────────────────────────────────────────────────────────
          One question, one screen. Measure is capped so a line of Malay, which
          runs about a third longer than the same line of English, still breaks
          somewhere comfortable. */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 lg:max-w-5xl lg:flex-row lg:gap-12 lg:py-12">
          <div className="min-w-0 flex-1">
            {mode === "mock" && (
              <button
                type="button"
                onClick={toggleFlag}
                aria-pressed={flagged.has(question.id)}
                className={cn(
                  "tap-sm mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  flagged.has(question.id) ? "pill-flag" : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <Flag className="h-4 w-4 shrink-0" weight={flagged.has(question.id) ? "fill" : "regular"} aria-hidden />
                {flagged.has(question.id) ? t("exam.unflagQuestion") : t("exam.flagQuestion")}
              </button>
            )}

            <h1 className="text-pretty text-[1.375rem] font-semibold leading-snug tracking-[-0.015em] sm:text-[1.625rem]">
              {language === "en"
                ? question.question_en || question.question_ms
                : question.question_ms || question.question_en}
            </h1>
            {question.source_url && !question.source_url.startsWith("http") && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-0.5 font-mono text-xs text-muted-foreground">
                <span>{t("exam.sourceCitation")}:</span>
                <span className="font-semibold text-foreground">{question.source_url}</span>
              </p>
            )}
            <SpeechControl key={`${question.id}-${language}`} text={[(language === "en" ? question.question_en || question.question_ms : question.question_ms || question.question_en), ...optionsEn.map((option, index) => `${String.fromCharCode(65 + index)}. ${language === "ms" ? optionsMs[index] || option : option || optionsMs[index]}`)].filter(Boolean).join(". ")} />
            {language === "en" && !question.question_en && (
              <p className="mt-2 text-sm italic text-muted-foreground">(English translation unavailable)</p>
            )}
            {language === "ms" && !question.question_ms && (
              <p className="mt-2 text-sm italic text-muted-foreground">(Terjemahan BM tidak tersedia)</p>
            )}

            {question.image_url && (
              <div className="panel mt-5 overflow-hidden">
                <img src={question.image_url} alt="" className="mx-auto max-h-56 w-auto object-contain p-4" />
              </div>
            )}

            <div className="mt-7 space-y-3" ref={optionsRef} role="radiogroup">
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
                    onClick={() => handleSelectOption(i)}
                    disabled={isRevealed}
                    className={cn(
                      "tile flex w-full min-w-0 items-center gap-3.5 p-3.5 text-left",
                      tileState,
                      isRevealed && "cursor-default"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn("type-figure grid h-9 w-9 shrink-0 place-items-center rounded-[0.625rem] border text-sm transition-colors duration-150", chip)}
                    >
                      {isRevealed && optionIsCorrect ? (
                        <CheckCircle className="h-5 w-5" weight="fill" />
                      ) : isRevealed && userChoseThis && !optionIsCorrect ? (
                        <XCircle className="h-5 w-5" weight="fill" />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-pretty text-[0.9375rem] font-medium leading-snug">
                      {language === "en" ? optEn || optMs : optMs || optEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {mode === "quiz" && quizPhase === "revealed" && (question.explanation_en || question.explanation_ms) && (
              <div className="mt-6 rounded-2xl border border-brand-ink/25 bg-brand/15 p-4 sm:p-5">
                <p className="text-sm font-semibold text-brand-ink">{t("quiz.explanation")}</p>
                <p className="mt-1.5 text-pretty text-[0.9375rem] leading-relaxed">
                  {language === "en"
                    ? question.explanation_en || question.explanation_ms
                    : question.explanation_ms || question.explanation_en}
                </p>
                <SpeechControl kind="explanation" text={(language === "en" ? question.explanation_en || question.explanation_ms : question.explanation_ms || question.explanation_en) ?? ""} />
              </div>
            )}
          </div>

          {/* On a wide screen the navigator is simply always open. On a phone it
              is the sheet below: same markup, no second implementation. */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="panel p-5">
              <SectionTitle className="mb-4 text-base md:text-base">{t("exam.navigator")}</SectionTitle>
              {navigator}
            </div>
            {mode === "quiz" && (
              <div className="mt-4 rounded-2xl bg-muted p-4">
                <p className="text-sm font-semibold">{t("exam.practiceTip")}</p>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {t("exam.practiceTipBody")}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────────
          In the thumb zone and padded past the home indicator. The primary
          action takes the remaining width, so "Seterusnya" has room without
          the bar reflowing between languages. */}
      <div className="glass shrink-0 border-t border-border/70 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3 sm:px-6 lg:max-w-5xl">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label={t("quiz.previous")}
            className="h-12 w-12 shrink-0"
          >
            <ArrowLeft className="!size-5" aria-hidden />
          </Button>

          {mode === "quiz" && quizPhase === "answering" ? (
            <Button
              onClick={handleConfirmQuiz}
              disabled={selectedOption === null}
              className="h-12 flex-1 text-[0.9375rem]"
            >
              {t("exam.confirmAnswer")}
            </Button>
          ) : (
            <Button onClick={handleNext} className="h-12 flex-1 text-[0.9375rem]">
              <span className="truncate">{isLastQuestion ? t("quiz.submit") : t("quiz.next")}</span>
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
            <div className="max-h-[50vh] overflow-y-auto px-4 pb-6">{navigator}</div>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>

      {/* ── Submit confirmation ─────────────────────────────────────────────── */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("quiz.confirmSubmit")}</DialogTitle>
            <DialogDescription>
              {t("quiz.confirmSubmitDesc", { unanswered: shuffledQuestions.length - answeredCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancelSubmit}>{t("common.cancel")}</Button>
            <Button onClick={handleConfirmSubmit}>{t("quiz.submit")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="ghost" onClick={() => setShowExitModal(false)}>{t("exam.stay")}</Button>
            <Button variant="destructive" onClick={handleConfirmExit}>{t("exam.exitConfirmAction")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
    document.body
  );
}
