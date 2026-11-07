import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useExamTimer } from "@/hooks/useExamTimer";
import { saveProgress, loadProgress, clearProgress } from "@/lib/testProgress";
import { useActivityStore } from "@/stores/activityStore";
import { useUIStore } from "@/stores/uiStore";
import { ROUTES } from "@/lib/constants";
import type { ExamQuestion } from "@/types/database";
import type { TranslationKey } from "@/lib/translations";
import {
  shuffleQuestionOptions,
  toStorageAnswers,
  countCorrect,
  type ExamResult,
  type OptionPermutations,
} from "@/lib/exam/scoring";

export interface UseExamSessionParams {
  questions: ExamQuestion[];
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

export type QuizPhase = "answering" | "revealed";

export function useExamSession({
  questions,
  timeLimit,
  mode,
  t,
  onComplete,
  onWarning,
  onTimeUp,
  persistScope,
  userId,
}: UseExamSessionParams) {
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
  }, [answers, shuffledQuestions, permutations, onComplete, onTimeUp, clearSavedProgress]);

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

  const handleRequestSubmit = () => {
    if (timeLimit) timer.pause();
    setShowSubmitModal(true);
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

  return {
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
  };
}

