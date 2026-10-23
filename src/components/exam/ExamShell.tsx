import { SpeechControl } from "@/components/shared/SpeechControl";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import { useExamTimer } from "@/hooks/useExamTimer";
import { saveProgress, loadProgress, clearProgress } from "@/lib/testProgress";
import { useActivityStore } from "@/stores/activityStore";
import { SectionTitle } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { ROUTES } from "@/lib/constants";
import type { ExamQuestion } from "@/services/questions.service";
import type { TranslationKey } from "@/lib/translations";

// ── Runtime shuffle (true random — runs once per mount) ────────────────────────
import {
  shuffleQuestionOptions,
  toStorageAnswers,
  countCorrect,
  type ExamResult,
  type OptionPermutations,
} from "@/lib/exam/scoring";

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

/** What gets written to storage so an interrupted attempt can be resumed. */
interface PersistedExamState {
  answers: Record<string, number>;
  /**
   * The option order this attempt was shown. MUST be restored rather than
   * re-shuffled: `answers` holds display-order indices, so a fresh shuffle
   * would silently repoint every saved answer at a different option.
   */
  permutations: OptionPermutations;
  currentIndex: number;
  flagged: string[];
  /** Guards against restoring into a different question set. */
  questionIds: string[];
}

type QuizPhase = "answering" | "revealed";

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
  // Read any interrupted attempt ONCE, synchronously, before first paint — the
  // shuffle below needs the saved permutations to be available immediately.
  const [restored] = useState(() => {
    if (!persistScope || !userId) return null;
    const snap = loadProgress<PersistedExamState>(persistScope, userId);
    if (!snap) return null;

    // Only resume into the same question set. If the bank was reseeded or a
    // different set was picked, the saved indices are meaningless.
    const currentIds = questions.map((q) => q.id).join(",");
    const savedIds = (snap.data.questionIds ?? []).join(",");
    if (!savedIds || savedIds !== currentIds) {
      clearProgress(persistScope, userId);
      return null;
    }
    return snap;
  });

  const [currentIndex, setCurrentIndex] = useState(restored?.data.currentIndex ?? 0);
  const [answers, setAnswers] = useState<Record<string, number>>(restored?.data.answers ?? {});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set(restored?.data.flagged ?? []));
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("answering");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const navigate = useNavigate();

  // Shuffle options once per mount — reusing the resumed attempt's option order
  // when there is one, so restored answers still point at the same options.
  const { questions: shuffledQuestions, permutations } = useMemo(
    () => shuffleQuestionOptions(questions, restored?.data.permutations),
    [questions, restored]
  );

  // A resumed attempt keeps its ORIGINAL start time, so elapsed duration and
  // remaining exam time stay honest across the interruption.
  const startTimeRef = useRef(restored?.startedAt ?? Date.now());
  const optionsRef = useRef<HTMLDivElement>(null);

  const question = shuffledQuestions[currentIndex] || ({} as typeof shuffledQuestions[0]);
  const questionId = question.id || "empty";
  // Dual-language arrays
  const optionsEn = question.options_en || [];
  const optionsMs = question.options_ms || [];
  const isLastQuestion = currentIndex === shuffledQuestions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / shuffledQuestions.length) * 100;

  const hasSubmitted = useRef(false);

  // ── Crash-safe persistence ────────────────────────────────────────────────
  // Write a snapshot whenever the learner's work changes. Cheap (a few hundred
  // bytes, synchronous) and it means an accidental tap on the bottom nav, a
  // refresh, or a closed tab no longer throws the attempt away.
  useEffect(() => {
    if (!persistScope || !userId || hasSubmitted.current) return;
    // Nothing worth restoring yet — don't leave an empty entry lying around.
    if (Object.keys(answers).length === 0 && currentIndex === 0 && flagged.size === 0) return;

    saveProgress<PersistedExamState>(persistScope, userId, startTimeRef.current, {
      answers,
      permutations,
      currentIndex,
      flagged: [...flagged],
      questionIds: questions.map((q) => q.id),
    });
  }, [answers, currentIndex, flagged, permutations, questions, persistScope, userId]);

  // Suspend the inactivity sign-out for as long as this exam is mounted, so a
  // 45-minute mock test cannot be cut short by a 30-minute idle timeout.
  useEffect(() => {
    const { beginTest, endTest } = useActivityStore.getState();
    beginTest();
    return endTest;
  }, []);

  // Hand the screen over to the exam: AppLayout drops its sidebar, header and
  // bottom nav while this is set. Cleared on unmount whatever the reason —
  // submit, time-up, exit, or a crash caught by the route error boundary — so
  // the app can never be left without navigation.
  useEffect(() => {
    const { setExamMode } = useUIStore.getState();
    setExamMode(true);
    return () => setExamMode(false);
  }, []);

  /** Drop the saved attempt — called once the result has been handed upstream. */
  const clearSavedProgress = useCallback(() => {
    if (persistScope && userId) clearProgress(persistScope, userId);
  }, [persistScope, userId]);

  // Tell the learner their work came back, rather than leaving them to wonder
  // why they are mid-way through a test they thought they had lost.
  useEffect(() => {
    if (restored) toast.success(t("exam.resumed"));
    // Fires once on mount for a resumed attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Second line of defence behind persistence: make closing the tab or hitting
  // back an explicit choice rather than an accident. Browsers show their own
  // generic wording here; returnValue just opts in to the prompt.
  useEffect(() => {
    const answered = Object.keys(answers).length;
    if (answered === 0) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasSubmitted.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [answers]);

  // Timer (only for mock)
  const handleExpire = useCallback(() => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    
    onTimeUp?.();
    // Zero for a mock exam: the answer key is not in the browser yet. The
    // caller fetches it after submission and regrades (see applyAnswerKey).
    const score = countCorrect(shuffledQuestions, answers);
    // The attempt is being handed upstream — the saved copy has done its job.
    clearSavedProgress();
    onComplete({
      answers,
      permutations,
      answersForStorage: toStorageAnswers(answers, permutations),
      score,
      total: shuffledQuestions.length,
      percentage: Math.round((score / shuffledQuestions.length) * 100),
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      questions: shuffledQuestions,
      autoSubmitted: true,
    });
  }, [answers, shuffledQuestions, permutations, onComplete, onTimeUp]);

  // On a resumed timed exam, hand the timer the time that ACTUALLY remains.
  // Without this, walking away and coming back would silently grant a fresh
  // 45 minutes — turning the interruption into a way to game the clock.
  const initialSeconds = useMemo(() => {
    if (!timeLimit) return 99999;
    if (!restored) return timeLimit;
    const elapsedSec = Math.floor((Date.now() - restored.startedAt) / 1000);
    return Math.max(0, timeLimit - elapsedSec);
  }, [timeLimit, restored]);

  const timer = useExamTimer({
    totalSeconds: initialSeconds,
    onWarning,
    onExpire: handleExpire,
    warningAt: 300,
  });

  useEffect(() => {
    if (timeLimit) timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const firstOption = optionsRef.current?.querySelector<HTMLButtonElement>("[role=radio]");
    firstOption?.focus();
  }, [currentIndex, quizPhase]);

  useEffect(() => {
    if (mode === "mock") {
      setSelectedOption(answers[questionId] ?? null);
    } else {
      if (answers[questionId] !== undefined) {
        setSelectedOption(answers[questionId]);
        setQuizPhase("revealed");
      } else {
        setSelectedOption(null);
        setQuizPhase("answering");
      }
    }
  }, [currentIndex, questionId, answers, mode]);

  const handleSelectOption = (index: number) => {
    if (mode === "quiz" && quizPhase === "revealed") return;
    setSelectedOption(index);
    if (mode === "mock" && questionId !== "empty") {
      setAnswers((prev) => ({ ...prev, [questionId]: index }));
    }
  };

  const handleConfirmQuiz = () => {
    if (selectedOption === null || questionId === "empty") return;
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOption }));
    setQuizPhase("revealed");
  };

  const handleNext = () => {
    if (mode === "quiz") {
      setQuizPhase("answering");
      setSelectedOption(null);
    }
    if (isLastQuestion) {
      handleRequestSubmit();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      if (mode === "quiz") setQuizPhase("answering");
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleJump = (index: number) => {
    if (mode === "quiz") setQuizPhase("answering");
    setCurrentIndex(index);
  };

  const toggleFlag = () => {
    if (questionId === "empty") return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleRequestSubmit = () => {
    if (timeLimit) timer.pause();
    setShowSubmitModal(true);
  };

  const handleCancelSubmit = () => {
    setShowSubmitModal(false);
    if (timeLimit) timer.start();
  };

  const handleConfirmSubmit = () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    
    setShowSubmitModal(false);
    // Zero for a mock exam: the answer key is not in the browser yet. The
    // caller fetches it after submission and regrades (see applyAnswerKey).
    const score = countCorrect(shuffledQuestions, answers);
    // The attempt is being handed upstream — the saved copy has done its job.
    clearSavedProgress();
    onComplete({
      answers,
      permutations,
      answersForStorage: toStorageAnswers(answers, permutations),
      score,
      total: shuffledQuestions.length,
      percentage: Math.round((score / shuffledQuestions.length) * 100),
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      questions: shuffledQuestions,
    });
  };

  // Leaving is now a deliberate act rather than a stray tap on a bottom nav
  // that is no longer there. The saved snapshot means the attempt survives, so
  // this asks rather than blocks — but it says plainly that the clock runs on.
  const handleRequestExit = () => {
    if (answeredCount === 0) {
      navigate(ROUTES.DASHBOARD);
      return;
    }
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    navigate(ROUTES.DASHBOARD);
  };

  const isCorrect = (optionIndex: number) => optionIndex === question.correct_index;


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
