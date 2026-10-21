import { SpeechControl } from "@/components/shared/SpeechControl";
// The exam room is a Jalan surface, so it brings Jalan's type with it. Routes
// that have not converted do not import this and pay nothing for it.
import "@/styles/jalan-type.css";

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
} from "phosphor-react";
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
import { SectionHead } from "@/components/ui/road";
import { useUIStore } from "@/stores/uiStore";
import { ROUTES } from "@/lib/constants";
import type { ExamQuestion } from "@/services/questions.service";
import type { TranslationKey } from "@/lib/translations";

// ── Runtime shuffle (true random — runs once per mount) ────────────────────────
import {
  shuffleQuestionOptions,
  toStorageAnswers,
  countCorrect,
  type OptionPermutations,
} from "./examScoring";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExamResult {
  /**
   * Answers in DISPLAY order — indices into the shuffled option arrays on
   * `questions`. Use for the local results view, which renders those same
   * shuffled questions. Do NOT persist these.
   */
  answers: Record<string, number>;
  /**
   * Answers remapped to the ORIGINAL database option order. This is what must
   * be written to quiz_results / mock_test_results: the recompute_exam_score
   * trigger grades against kpp_questions.correct_index, which is unshuffled.
   */
  answersForStorage: Record<string, number>;
  /**
   * Option permutations for this attempt, so a caller that fetches the answer
   * key AFTER submission (mock exams) can map each correct_index from database
   * order onto the position the learner actually saw. See applyAnswerKey().
   */
  permutations: OptionPermutations;
  /**
   * Provisional. Zero for a mock exam until the key is fetched, because the
   * key is deliberately not sent to the browser during the exam. The server
   * regrades on insert regardless — that is the authoritative score.
   */
  score: number;
  total: number;
  percentage: number;
  /** Authoritative mock pass status, when returned by the server. */
  passed?: boolean;
  durationSeconds: number;
  questions: ExamQuestion[];
  autoSubmitted?: boolean;
}

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
  // The exam room, cut onto Jalan (see DESIGN_SYSTEM.md). AppLayout drops its
  // sidebar, header and bottom nav while examMode is set, so there is exactly
  // one thing on screen and no way to wander into the simulator with thirty
  // minutes on the clock.
  //
  // It previously tried to achieve that from *inside* the app shell, with
  // `w-[100vw] left-1/2 -ml-[50vw]` and a hardcoded 240px sidebar offset — a
  // full-bleed escape hack that was also wrong, since the sidebar is 256px
  // expanded and 72px collapsed. Owning the shell removes the fight.
  //
  // This is an Operate surface: the learner is in a task and the interface
  // should disappear. The question is the only thing set large, and the clock
  // is the only thing allowed to shout.

  const timeIsShort = Boolean(timeLimit) && timer.secondsRemaining <= 300;
  const ink = { color: "rgb(var(--road-ink))" };
  const muted = { color: "rgb(var(--road-muted))" };
  const edge = { borderColor: "rgb(var(--road-edge))" };

  const navigator = (
    <>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
        {shuffledQuestions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = i === currentIndex;
          const isFlag = flagged.has(q.id);

          // Answered is a filled ink bay; flagged is an awas plate — dark on
          // yellow, because awas cannot carry text on a pale surface (1.67:1).
          // Current is an awas outline. Three states, none relying on hue
          // alone, all readable in greyscale.
          const style: React.CSSProperties = isFlag
            ? {}
            : isAnswered
              ? { backgroundColor: "rgb(var(--road-ink))", color: "rgb(var(--road-raised))", borderColor: "rgb(var(--road-ink))" }
              : { borderColor: "rgb(var(--road-edge))", color: "rgb(var(--road-muted))" };

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
              style={style}
              className={cn(
                "type-label-strong focus-paint grid aspect-square min-h-0 min-w-0 place-items-center",
                "border text-sm tabular-nums transition-colors duration-150",
                isFlag && "plate-awas",
                isCurrent && "outline outline-2 outline-offset-2"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <ul className="type-label mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={muted}>
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-3.5 border" style={{ backgroundColor: "rgb(var(--road-ink))", borderColor: "rgb(var(--road-ink))" }} />
          {t("exam.legend.answered")}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-3.5 border" style={edge} />
          {t("exam.legend.unanswered")}
        </li>
        {mode === "mock" && (
          <li className="flex items-center gap-2">
            <span aria-hidden className="plate-awas h-3.5 w-3.5" />
            {t("exam.legend.flagged")}
          </li>
        )}
      </ul>
    </>
  );

  // Rendered through a portal, not in place. `.page-shell` carries the
  // `page-enter` keyframe, whose `transform` makes it the containing block for
  // any `position: fixed` descendant — so a full-viewport exam laid out inside
  // it collapsed to nothing. Escaping to <body> also means no page wrapper's
  // padding or max-width can reach the exam.
  return createPortal(
    <div
      className="type-body fixed inset-0 z-40 flex flex-col"
      style={{ backgroundColor: "rgb(var(--road-page))", color: "rgb(var(--road-ink))" }}
    >
      {/* ── Rail ─────────────────────────────────────────────────────────────
          Exit, position, clock. The clock is the only thing here that has to be
          readable at a glance, so it is the only thing set large. */}
      <header
        className="flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:px-4"
        style={{ ...edge, backgroundColor: "rgb(var(--road-raised))" }}
      >
        <button
          type="button"
          onClick={handleRequestExit}
          // The visible label is hidden below 640px, so the icon-only button
          // needs its own name or it reaches a screen reader as "button".
          aria-label={t("exam.exit")}
          className="type-label focus-paint tap-sm flex items-center gap-1.5 px-2.5 text-sm transition-colors"
          style={muted}
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
          className="focus-paint tap-sm mx-auto flex flex-col justify-center gap-1 px-3"
        >
          <span className="type-figure text-sm" style={ink}>
            {currentIndex + 1}
            <span style={muted}> / {shuffledQuestions.length}</span>
          </span>
          {/* Solid behind is answered, broken ahead is what is still open —
              the road-marking grammar, at rail scale. */}
          <span
            aria-hidden
            className="block h-1 w-24 overflow-hidden sm:w-36"
            style={{ backgroundColor: "rgb(var(--grade-7))" }}
          >
            <span
              className="block h-full transition-[width] duration-300 ease-out-quart"
              style={{ width: `${progressPercentage}%`, backgroundColor: "rgb(var(--road-ink))" }}
            />
          </span>
        </button>

        {timeLimit ? (
          <div
            role="timer"
            aria-live="off"
            aria-label={t("quiz.timeRemaining")}
            className="type-figure tap-sm flex items-center gap-1.5 px-2.5 text-lg sm:px-3"
            // Under five minutes the clock stops being text and becomes a
            // berhenti plate. Colour alone is not enough on a cheap panel in
            // daylight, and not enough for a colour-blind learner.
            style={
              timeIsShort
                ? { backgroundColor: "rgb(var(--berhenti))", color: "rgb(var(--paint))", borderRadius: "var(--r-plate)" }
                : ink
            }
          >
            <Clock className="h-4 w-4 shrink-0" aria-hidden weight={timeIsShort ? "fill" : "regular"} />
            {timer.formattedTime}
          </div>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </header>

      {/* ── Question ─────────────────────────────────────────────────────────
          One question, one screen. Measure is capped so a line of Malay — which
          runs about a third longer than the same line of English — still breaks
          somewhere comfortable instead of running the width of a tablet. */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 lg:max-w-5xl lg:flex-row lg:gap-10 lg:py-10">
          <div className="min-w-0 flex-1">
            {mode === "mock" && (
              <button
                type="button"
                onClick={toggleFlag}
                aria-pressed={flagged.has(question.id)}
                className={cn(
                  "type-label focus-paint tap-sm mb-5 inline-flex items-center gap-2 px-3 text-sm transition-colors",
                  flagged.has(question.id) ? "plate-awas" : "border"
                )}
                style={flagged.has(question.id) ? undefined : { ...edge, ...muted, borderRadius: "var(--r-plate)" }}
              >
                <Flag className="h-4 w-4 shrink-0" weight={flagged.has(question.id) ? "fill" : "regular"} aria-hidden />
                {flagged.has(question.id) ? t("exam.unflagQuestion") : t("exam.flagQuestion")}
              </button>
            )}

            {/* Body family rather than display: this is prose a learner reads
                carefully, fifty times, often in Malay. Barlow's brief is
                highway signage and it holds long BM strings without collapsing;
                Archivo's expanded display weight would shout at every question. */}
            <h1 className="type-label-strong text-pretty text-xl leading-snug sm:text-2xl" style={ink}>
              {language === "en"
                ? question.question_en || question.question_ms
                : question.question_ms || question.question_en}
            </h1>
            <SpeechControl key={`${question.id}-${language}`} text={[(language === "en" ? question.question_en || question.question_ms : question.question_ms || question.question_en), ...optionsEn.map((option, index) => `${String.fromCharCode(65 + index)}. ${language === "ms" ? optionsMs[index] || option : option || optionsMs[index]}`)].filter(Boolean).join(". ")} />
            {language === "en" && !question.question_en && (
              <p className="type-label mt-2 text-sm italic" style={muted}>(English translation unavailable)</p>
            )}
            {language === "ms" && !question.question_ms && (
              <p className="type-label mt-2 text-sm italic" style={muted}>(Terjemahan BM tidak tersedia)</p>
            )}

            {question.image_url && (
              <div className="plate mt-5 overflow-hidden">
                <img src={question.image_url} alt="" className="mx-auto max-h-56 w-auto object-contain p-3" />
              </div>
            )}

            <div className="mt-6 space-y-2.5" ref={optionsRef} role="radiogroup">
              {optionsEn.map((optEn, i) => {
                const optMs = optionsMs[i] || "";
                const isSelected = selectedOption === i;
                const isRevealed = mode === "quiz" && quizPhase === "revealed";
                const optionIsCorrect = isCorrect(i);
                const userChoseThis = isSelected && isRevealed;

                // Every state is carried by the kerb edge and a filled letter
                // chip, never by a wash of tinted background. A 5% tint measures
                // about 1.1:1 against the page — it does not survive noon
                // sunlight on a 500-nit phone, which is where this is used.
                let bayKerb = "bay-open";
                let chip: React.CSSProperties = { borderColor: "rgb(var(--road-edge))", color: "rgb(var(--road-muted))" };

                if (isSelected && !isRevealed) {
                  bayKerb = "bay-selected";
                  chip = { backgroundColor: "rgb(var(--road-ink))", borderColor: "rgb(var(--road-ink))", color: "rgb(var(--road-raised))" };
                }
                if (isRevealed && optionIsCorrect) {
                  bayKerb = "bay-done";
                  chip = { backgroundColor: "rgb(var(--lulus))", borderColor: "rgb(var(--lulus))", color: "rgb(var(--paint))" };
                }
                if (isRevealed && userChoseThis && !optionIsCorrect) {
                  bayKerb = "bay-fail";
                  chip = { backgroundColor: "rgb(var(--berhenti))", borderColor: "rgb(var(--berhenti))", color: "rgb(var(--paint))" };
                }

                return (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(i)}
                    disabled={isRevealed}
                    // The option IS the bay — a painted rectangle whose kerb
                    // colour is its state. Wrapping a button in a bay div would
                    // put the tap target inside the paint instead of on it.
                    className={cn(
                      "bay focus-paint flex w-full min-w-0 items-center gap-3 p-3 text-left",
                      bayKerb,
                      isRevealed ? "cursor-default" : "active:translate-y-px"
                    )}
                  >
                    <span
                      aria-hidden
                      style={{ ...chip, borderRadius: "var(--r-plate)" }}
                      className="type-label-strong grid h-9 w-9 shrink-0 place-items-center border text-sm transition-colors duration-150"
                    >
                      {isRevealed && optionIsCorrect ? (
                        <CheckCircle className="h-5 w-5" weight="fill" />
                      ) : isRevealed && userChoseThis && !optionIsCorrect ? (
                        <XCircle className="h-5 w-5" weight="fill" />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="type-label min-w-0 flex-1 text-pretty text-[0.9375rem] leading-snug" style={ink}>
                      {language === "en" ? optEn || optMs : optMs || optEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {mode === "quiz" && quizPhase === "revealed" && (question.explanation_en || question.explanation_ms) && (
              <div className="plate mt-6 p-4" style={{ borderLeft: "4px solid rgb(var(--sign-info))" }}>
                <p className="type-label-strong text-sm" style={ink}>{t("quiz.explanation")}</p>
                <p className="type-label mt-1.5 text-pretty text-[0.9375rem] leading-relaxed" style={ink}>
                  {language === "en"
                    ? question.explanation_en || question.explanation_ms
                    : question.explanation_ms || question.explanation_en}
                </p>
                <SpeechControl kind="explanation" text={(language === "en" ? question.explanation_en || question.explanation_ms : question.explanation_ms || question.explanation_en) ?? ""} />
              </div>
            )}
          </div>

          {/* On a wide screen the navigator is simply always open. On a phone it
              is the sheet below — same markup, no second implementation. */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <SectionHead className="mb-4">{t("exam.navigator")}</SectionHead>
            {navigator}
            {mode === "quiz" && (
              <div className="plate mt-6 p-4">
                <p className="type-label-strong text-sm" style={ink}>{t("exam.practiceTip")}</p>
                <p className="type-label mt-1.5 text-pretty text-sm leading-relaxed" style={muted}>
                  {t("exam.practiceTipBody")}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────────
          Fixed in the thumb zone and padded past the home indicator. The primary
          action takes the remaining width, so "Seterusnya" has room to breathe
          without the bar reflowing between languages. */}
      <div
        className="shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
        style={{ ...edge, backgroundColor: "rgb(var(--road-raised))" }}
      >
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-3 sm:px-6 lg:max-w-5xl">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label={t("quiz.previous")}
            className="focus-paint tap flex shrink-0 items-center justify-center border transition-colors disabled:pointer-events-none disabled:opacity-30"
            style={{ ...edge, ...ink, borderRadius: "var(--r-plate)" }}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>

          {mode === "quiz" && quizPhase === "answering" ? (
            <button
              type="button"
              onClick={handleConfirmQuiz}
              disabled={selectedOption === null}
              className="type-label-strong focus-paint tap flex flex-1 items-center justify-center gap-2 px-4 text-[0.9375rem] transition-opacity disabled:pointer-events-none disabled:opacity-40"
              style={{ backgroundColor: "rgb(var(--road-ink))", color: "rgb(var(--road-raised))", borderRadius: "var(--r-plate)" }}
            >
              {t("exam.confirmAnswer")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="type-label-strong focus-paint tap flex flex-1 items-center justify-center gap-2 px-4 text-[0.9375rem] active:translate-y-px"
              style={{ backgroundColor: "rgb(var(--road-ink))", color: "rgb(var(--road-raised))", borderRadius: "var(--r-plate)" }}
            >
              <span className="truncate">{isLastQuestion ? t("quiz.submit") : t("quiz.next")}</span>
              {!isLastQuestion && <ArrowRight className="h-5 w-5 shrink-0" aria-hidden weight="bold" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Question navigator (phone) ───────────────────────────────────────
          Was a sidebar rendered below fifty questions' worth of options, so on a
          phone it was effectively unreachable. */}
      <Drawer open={showNavigator} onOpenChange={setShowNavigator}>
        <DrawerPopup className="lg:hidden">
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>{t("exam.navigator")}</DrawerTitle>
              <DrawerDescription>
                {t("quiz.answered", { count: answeredCount, total: shuffledQuestions.length })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[50vh] overflow-y-auto px-4 pb-6">{navigator}</div>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>

      {/* ── Submit confirmation ──────────────────────────────────────────────*/}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("quiz.confirmSubmit")}</DialogTitle>
            <DialogDescription>
              {t("quiz.confirmSubmitDesc", { unanswered: shuffledQuestions.length - answeredCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancelSubmit}
              className="type-label focus-paint tap-sm px-4 text-sm"
              style={muted}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              className="type-label-strong focus-paint tap-sm px-4 text-sm"
              style={{ backgroundColor: "rgb(var(--road-ink))", color: "rgb(var(--road-raised))", borderRadius: "var(--r-plate)" }}
            >
              {t("quiz.submit")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Exit confirmation ────────────────────────────────────────────────
          Exiting is the only way out now, so it has to be honest about what it
          costs: the work is kept, but on a mock the clock does not stop. */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("exam.exitConfirm")}</DialogTitle>
            <DialogDescription>{t("exam.exitConfirmDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowExitModal(false)}
              className="type-label focus-paint tap-sm px-4 text-sm"
              style={muted}
            >
              {t("exam.stay")}
            </button>
            <button
              type="button"
              onClick={handleConfirmExit}
              className="type-label-strong focus-paint tap-sm px-4 text-sm"
              style={{ backgroundColor: "rgb(var(--berhenti))", color: "rgb(var(--paint))", borderRadius: "var(--r-plate)" }}
            >
              {t("exam.exitConfirmAction")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
    document.body
  );
}
