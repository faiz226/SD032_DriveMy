import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  Car,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
} from "phosphor-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useExamTimer } from "@/hooks/useExamTimer";
import { saveProgress, loadProgress, clearProgress } from "@/lib/testProgress";
import { useActivityStore } from "@/stores/activityStore";
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

  const isCorrect = (optionIndex: number) => optionIndex === question.correct_index;

  return (
    <div className="min-h-full bg-muted/30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-0 pb-12 w-[100vw] sm:w-[calc(100vw-240px)] relative left-1/2 right-1/2 -ml-[50vw] sm:-ml-[calc(50vw-120px)] overflow-hidden">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 border-b bg-card shadow-sm px-4 sm:px-8 py-3 mb-6 flex items-center justify-between gap-4 w-full">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" aria-hidden />
            <span className="font-heading font-bold tracking-tight">DriveMy</span>
          </div>
          <div className="flex-1 max-w-sm hidden md:block px-4">
             <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
               <div className="h-full transition-all duration-500 bg-accent" style={{ width: `${progressPercentage}%` }}></div>
             </div>
             <div className="text-[10px] text-muted-foreground mt-1 font-medium tracking-wide">Q{currentIndex + 1} OF {shuffledQuestions.length}</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {timeLimit && (
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono font-semibold font-tabular-nums min-h-[40px] border border-border", timer.secondsRemaining <= 300 ? "text-destructive animate-pulse" : "text-foreground")}>
                <Clock className="w-4 h-4" />
                {timer.formattedTime}
              </div>
            )}
            <button onClick={handleRequestSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95 hover:shadow-md bg-accent text-accent-foreground">{mode === 'quiz' ? t("quiz.submit") : t("mock.start").replace("Start ", "")}</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main Column */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-5 md:p-7 flex-1">
              <div className="flex items-start justify-between mb-3">
               <div>
                 <div className="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                   {mode === 'quiz' ? t("dashboard.practiceQuiz") : t("nav.mockTest")}
                 </div>
                 {mode === "mock" && (
                   <button
                     type="button"
                     onClick={toggleFlag}
                     className={cn("ml-3 inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded transition-colors", flagged.has(question.id) ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                   >
                     <Flag className="w-3 h-3" weight={flagged.has(question.id) ? "fill" : "regular"} /> {t("exam.flagQuestion")}
                   </button>
                 )}
               </div>
               <div className="font-heading font-black text-4xl md:text-5xl tabular-nums leading-none text-muted-foreground/30">
                 {currentIndex + 1 < 100 ? (currentIndex + 1).toString().padStart(3, '0') : currentIndex + 1}
               </div>
             </div>

             {language === "en" ? (
               <>
                 <h2 className="font-heading font-bold text-lg md:text-xl leading-snug">{question.question_en || question.question_ms}</h2>
                 {!question.question_en && <p className="text-sm text-muted-foreground italic mt-2">(English translation unavailable)</p>}
               </>
             ) : (
               <>
                 <h2 className="font-heading font-bold text-lg md:text-xl leading-snug">{question.question_ms || question.question_en}</h2>
                 {!question.question_ms && <p className="text-sm text-muted-foreground italic mt-2">(Terjemahan BM tidak tersedia)</p>}
               </>
             )}

             {question.image_url && (
               <div className="mt-5 flex justify-center bg-muted/20 p-4 rounded-xl border border-border">
                 <img src={question.image_url} alt="Question" className="max-h-48 rounded-lg object-contain" />
               </div>
             )}

             <div className="mt-5 space-y-2.5" ref={optionsRef} role="radiogroup">
               {optionsEn.map((optEn, i) => {
                 const optMs = optionsMs[i] || "";
                 const isSelected = selectedOption === i;
                 const isRevealed = mode === "quiz" && quizPhase === "revealed";
                 const optionIsCorrect = isCorrect(i);
                 const userChoseThis = isSelected && isRevealed;

                 let wrapperStyle = "border-border bg-card hover:border-foreground/30";
                 let letterStyle = "bg-muted text-foreground/70";

                 if (isSelected && !isRevealed) {
                   wrapperStyle = "border-primary bg-primary/5 ring-1 ring-primary";
                   letterStyle = "bg-primary text-primary-foreground";
                 }
                 if (isRevealed && optionIsCorrect) {
                   wrapperStyle = "border-success bg-success/10 ring-1 ring-success";
                   letterStyle = "bg-success text-white";
                 }
                 if (isRevealed && userChoseThis && !optionIsCorrect) {
                   wrapperStyle = "border-destructive bg-destructive/10 ring-1 ring-destructive";
                   letterStyle = "bg-destructive text-white";
                 }

                 return (
                   <button
                     key={i}
                     role="radio"
                     aria-checked={isSelected}
                     onClick={() => handleSelectOption(i)}
                     disabled={isRevealed}
                     className={cn("w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all min-h-[56px] active:scale-[0.99]", wrapperStyle, isRevealed && "cursor-default")}
                   >
                     <span className={cn("shrink-0 w-10 h-10 rounded-lg grid place-items-center font-heading font-bold text-sm transition-colors", letterStyle)}>
                       {isRevealed && optionIsCorrect ? (
                         <CheckCircle className="w-5 h-5" weight="fill" />
                       ) : isRevealed && userChoseThis && !optionIsCorrect ? (
                         <XCircle className="w-5 h-5" weight="fill" />
                       ) : (
                         String.fromCharCode(65 + i)
                       )}
                     </span>
                     <div className="flex-1 pt-1">
                       <div className={cn("text-sm font-medium", isRevealed && optionIsCorrect ? "text-success" : "text-foreground")}>
                         {language === "en" ? (optEn || optMs) : (optMs || optEn)}
                       </div>
                     </div>
                   </button>
                 );
               })}
             </div>
             
             {mode === "quiz" && quizPhase === "revealed" && (question.explanation_en || question.explanation_ms) && (
               <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                 <p className="text-sm font-bold text-primary mb-1">{t("quiz.explanation")}</p>
                 <p className="text-sm text-foreground/90">
                   {language === "en" ? (question.explanation_en || question.explanation_ms) : (question.explanation_ms || question.explanation_en)}
                 </p>
               </div>
             )}
          </div>

          <div className="border-t bg-muted/20 px-5 md:px-7 py-3 flex items-center justify-between gap-2 flex-wrap">
             <button
               onClick={handlePrev}
               disabled={currentIndex === 0}
               className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 transition-all"
             >
               <ArrowLeft className="h-4 w-4" aria-hidden /> {t("quiz.previous").toUpperCase()}
             </button>
             
             <div className="flex items-center gap-2">
               {mode === "quiz" && quizPhase === "answering" && (
                 <button
                   onClick={handleConfirmQuiz}
                   disabled={selectedOption === null}
                   className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 transition-all hover:shadow-md hover:brightness-95 active:scale-95 bg-primary text-primary-foreground min-h-[40px]"
                 >
                   {t("exam.confirmAnswer").toUpperCase()}
                 </button>
               )}
               {(mode === "mock" || (mode === "quiz" && quizPhase === "revealed")) && (
                 <button
                   onClick={handleNext}
                   className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-95 active:scale-95 hover:shadow-md bg-primary text-primary-foreground min-h-[40px]"
                 >
                   {isLastQuestion ? t("quiz.submit").toUpperCase() : t("quiz.next").toUpperCase()} {!isLastQuestion && <ArrowRight className="h-4 w-4" aria-hidden />}
                 </button>
               )}
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
           <div className="bg-card border rounded-2xl p-5 shadow-sm">
             <div className="flex items-center justify-between mb-3">
               <h3 className="font-heading font-bold text-sm">{t("nav.progress")}</h3>
               <span className="text-xs font-semibold text-muted-foreground">{answeredCount}/{questions.length} {t("profile.status.complete")}</span>
             </div>
             <div className="flex justify-center my-3">
               <div className="relative w-28 h-28">
                 <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                   <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-muted" strokeWidth="3"></circle>
                   <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-primary transition-all duration-500" strokeWidth="3" strokeDasharray={`${progressPercentage}, 100`} strokeLinecap="round"></circle>
                 </svg>
                 <div className="absolute inset-0 grid place-items-center">
                   <span className="font-heading font-black text-2xl">{Math.round(progressPercentage)}%</span>
                 </div>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div className="rounded-lg bg-muted/40 p-3 text-center">
                 <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("quiz.answered", { count: answeredCount, total: questions.length }).split(" ")[0]}</div>
                 <div className="font-heading font-bold text-lg">{answeredCount}</div>
               </div>
               <div className="rounded-lg bg-muted/40 p-3 text-center">
                 <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("quiz.timeRemaining").split(" ")[0]}</div>
                 <div className="font-heading font-bold text-lg">{questions.length - answeredCount}</div>
               </div>
             </div>
           </div>

           <div className="bg-card border rounded-2xl p-5 shadow-sm">
             <h3 className="font-heading font-bold text-sm mb-3">Question Navigation</h3>
             <div className="grid gap-1.5 grid-cols-5">
               {questions.map((q, i) => {
                 const isAnswered = answers[q.id] !== undefined;
                 const isCurrent = i === currentIndex;
                 const isFlag = flagged.has(q.id);

                 let btnStyle = "bg-muted/40 text-muted-foreground border-border hover:bg-muted";
                 if (isCurrent) {
                   btnStyle = "bg-primary/10 text-primary border-primary ring-2 ring-offset-1 ring-primary/30";
                 } else if (isFlag) {
                   btnStyle = "bg-warning/20 text-warning-foreground border-warning/40";
                 } else if (isAnswered) {
                   btnStyle = "bg-foreground text-background border-transparent";
                 }

                 return (
                   <button
                     key={q.id}
                     onClick={() => handleJump(i)}
                     className={cn("aspect-square rounded-md text-xs font-bold tabular-nums grid place-items-center transition-all border", btnStyle)}
                   >
                     {i + 1}
                   </button>
                 );
               })}
             </div>
             <div className="mt-4 space-y-1.5 text-[11px]">
               <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-foreground/90"></span>Answered</div>
               <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-muted border"></span>Not Answered</div>
               {mode === "mock" && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-warning/30 border border-warning/40"></span>Flagged for Review</div>}
             </div>
           </div>

           {mode === "quiz" && (
             <div className="rounded-2xl p-5 bg-accent/10 border border-accent/30">
               <div className="flex items-center gap-2 mb-1">
                 <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
                 <h4 className="font-heading font-bold text-sm">Practice Tip</h4>
               </div>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 You'll see the correct answer and explanation after each question. No timer — focus on learning.
               </p>
             </div>
           )}
        </aside>
      </div>

      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("quiz.confirmSubmit")}</DialogTitle>
            <DialogDescription>
              {t("quiz.confirmSubmitDesc", { unanswered: questions.length - answeredCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={handleCancelSubmit}
              className="px-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("quiz.submit")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
