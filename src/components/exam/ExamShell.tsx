import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Flag, Clock, CheckCircle, XCircle } from "phosphor-react";
import { cn } from "@/lib/utils";
import { useExamTimer } from "@/hooks/useExamTimer";
import type { KppQuestion } from "@/types/database";
import type { TranslationKey } from "@/lib/translations";

// ── Runtime shuffle (true random — runs once per mount) ────────────────────────
function shuffleQuestionOptions(questions: KppQuestion[]): KppQuestion[] {
  return questions.map((q) => {
    const opts_en = [...q.options_en];
    const opts_ms = [...q.options_ms];
    // Build permutation via Fisher-Yates
    const perm = opts_en.map((_, i) => i);
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const new_correct = perm.indexOf(q.correct_index);
    return {
      ...q,
      options_en: perm.map((i) => opts_en[i]),
      options_ms: perm.map((i) => opts_ms[i]),
      correct_index: new_correct,
    };
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExamResult {
  answers: Record<string, number>;
  score: number;
  total: number;
  percentage: number;
  durationSeconds: number;
  questions: KppQuestion[];
  autoSubmitted?: boolean;
}

interface ExamShellProps {
  questions: KppQuestion[];
  language: "en" | "ms";
  timeLimit?: number;
  mode: "quiz" | "mock";
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  onComplete: (result: ExamResult) => void;
  onWarning?: () => void;
  onTimeUp?: () => void;
}

type QuizPhase = "answering" | "revealed";

// ── Component ─────────────────────────────────────────────────────────────────

export function ExamShell({
  questions,
  timeLimit,
  mode,
  t,
  onComplete,
  onWarning,
  onTimeUp,
}: ExamShellProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("answering");

  // Shuffle options once per mount (true random per attempt)
  const shuffledQuestions = useMemo(() => shuffleQuestionOptions(questions), [questions]);

  const startTimeRef = useRef(Date.now());
  const optionsRef = useRef<HTMLDivElement>(null);

  const question = shuffledQuestions[currentIndex];
  // Dual-language arrays
  const optionsEn = question.options_en || [];
  const optionsMs = question.options_ms || [];
  const isLastQuestion = currentIndex === shuffledQuestions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / shuffledQuestions.length) * 100;

  // Timer (only for mock)
  const handleExpire = useCallback(() => {
    onTimeUp?.();
    const score = shuffledQuestions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correct_index ? 1 : 0);
    }, 0);
    onComplete({
      answers,
      score,
      total: shuffledQuestions.length,
      percentage: Math.round((score / shuffledQuestions.length) * 100),
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      questions: shuffledQuestions,
      autoSubmitted: true,
    });
  }, [answers, shuffledQuestions, onComplete, onTimeUp]);

  const timer = useExamTimer({
    totalSeconds: timeLimit ?? 99999,
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
      setSelectedOption(answers[question.id] ?? null);
    } else {
      if (answers[question.id] !== undefined) {
        setSelectedOption(answers[question.id]);
        setQuizPhase("revealed");
      } else {
        setSelectedOption(null);
        setQuizPhase("answering");
      }
    }
  }, [currentIndex, question.id, answers, mode]);

  const handleSelectOption = (index: number) => {
    if (mode === "quiz" && quizPhase === "revealed") return;
    setSelectedOption(index);
    if (mode === "mock") {
      setAnswers((prev) => ({ ...prev, [question.id]: index }));
    }
  };

  const handleConfirmQuiz = () => {
    if (selectedOption === null) return;
    setAnswers((prev) => ({ ...prev, [question.id]: selectedOption }));
    setQuizPhase("revealed");
  };

  const handleNext = () => {
    if (mode === "quiz") {
      setQuizPhase("answering");
      setSelectedOption(null);
    }
    if (isLastQuestion) {
      handleSubmit();
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
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (timeLimit) timer.pause();
    const score = shuffledQuestions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correct_index ? 1 : 0);
    }, 0);
    onComplete({
      answers,
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
            <span className="material-symbols-outlined select-none text-xl text-primary" aria-hidden="true">directions_car</span>
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
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95 hover:shadow-md bg-accent text-accent-foreground">FINISH {mode === 'quiz' ? 'QUIZ' : 'TEST'}</button>
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
                   {mode === 'quiz' ? 'Practice Quiz' : 'Mock Test'}
                 </div>
                 {mode === "mock" && (
                   <button
                     type="button"
                     onClick={toggleFlag}
                     className={cn("ml-3 inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded transition-colors", flagged.has(question.id) ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                   >
                     <Flag className="w-3 h-3" weight={flagged.has(question.id) ? "fill" : "regular"} /> Flag
                   </button>
                 )}
               </div>
               <div className="font-heading font-black text-4xl md:text-5xl tabular-nums leading-none text-muted-foreground/30">
                 {currentIndex + 1 < 100 ? (currentIndex + 1).toString().padStart(3, '0') : currentIndex + 1}
               </div>
             </div>

             <h2 className="font-heading font-bold text-lg md:text-xl leading-snug">{question.question_en}</h2>
             <p className="text-sm text-muted-foreground italic mt-2">{question.question_ms || "(Translation Unavailable)"}</p>

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
                       <div className={cn("text-sm font-medium", isRevealed && optionIsCorrect ? "text-success" : "text-foreground")}>{optEn}</div>
                       {optMs && <div className={cn("text-xs italic mt-0.5", isRevealed && optionIsCorrect ? "text-success/80" : "text-muted-foreground")}>{optMs}</div>}
                     </div>
                   </button>
                 );
               })}
             </div>
             
             {mode === "quiz" && quizPhase === "revealed" && (question.explanation_en || question.explanation_ms) && (
               <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                 <p className="text-sm font-bold text-primary mb-1">{t("quiz.explanation")}</p>
                 <p className="text-sm text-foreground/90">{question.explanation_en}</p>
                 <p className="text-xs text-muted-foreground italic mt-1">{question.explanation_ms}</p>
               </div>
             )}
          </div>

          <div className="border-t bg-muted/20 px-5 md:px-7 py-3 flex items-center justify-between gap-2 flex-wrap">
             <button
               onClick={handlePrev}
               disabled={currentIndex === 0}
               className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 transition-all"
             >
               <span className="material-symbols-outlined select-none text-lg" aria-hidden="true">arrow_back</span> {t("quiz.previous").toUpperCase()}
             </button>
             
             <div className="flex items-center gap-2">
               {mode === "quiz" && quizPhase === "answering" && (
                 <button
                   onClick={handleConfirmQuiz}
                   disabled={selectedOption === null}
                   className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 transition-all hover:shadow-md hover:brightness-95 active:scale-95 bg-primary text-primary-foreground min-h-[40px]"
                 >
                   CONFIRM
                 </button>
               )}
               {(mode === "mock" || (mode === "quiz" && quizPhase === "revealed")) && (
                 <button
                   onClick={handleNext}
                   className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-95 active:scale-95 hover:shadow-md bg-primary text-primary-foreground min-h-[40px]"
                 >
                   {isLastQuestion ? t("quiz.submit").toUpperCase() : t("quiz.next").toUpperCase()} {!isLastQuestion && <span className="material-symbols-outlined select-none text-lg" aria-hidden="true">arrow_forward</span>}
                 </button>
               )}
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
           <div className="bg-card border rounded-2xl p-5 shadow-sm">
             <div className="flex items-center justify-between mb-3">
               <h3 className="font-heading font-bold text-sm">Quiz Progress</h3>
               <span className="text-xs font-semibold text-muted-foreground">{answeredCount}/{questions.length} Complete</span>
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
                 <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Answered</div>
                 <div className="font-heading font-bold text-lg">{answeredCount}</div>
               </div>
               <div className="rounded-lg bg-muted/40 p-3 text-center">
                 <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</div>
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
                 <span className="material-symbols-outlined select-none text-base text-primary" aria-hidden="true">lightbulb</span>
                 <h4 className="font-heading font-bold text-sm">Practice Tip</h4>
               </div>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 You'll see the correct answer and explanation after each question. No timer — focus on learning.
               </p>
             </div>
           )}
        </aside>
      </div>
    </div>
  );
}

