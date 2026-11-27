import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Warning } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { QUIZ_QUESTION_COUNT, QUERY_KEYS } from "@/lib/constants";
import { fetchQuizQuestions } from "@/services/questions.service";
import { saveQuizResult } from "@/services/results.service";
import { useSaveResultMutation } from "@/hooks/useResults";
import { PROGRESS_SCOPES } from "@/lib/testProgress";
import { TestLaunchPanel } from "@/components/exam/TestLaunchPanel";
import { ExamShell, type ExamResult } from "@/components/exam/ExamShell";
import { TestResultsView } from "@/components/exam/TestResultsView";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/shared/LoadError";
import type { KppQuestion } from "@/types/database";

type Phase = "launch" | "testing" | "results";

function resolveSectionCategory(section: string): string {
  if (section === "B" || section.startsWith("quiz-b")) return "traffic-rules";
  if (section === "C" || section.startsWith("quiz-c")) return "safety-principles";
  return "road-signs";
}

export function QuizPage() {
  const { t, language: globalLang } = useLanguage();
  const { user, isDevBypass } = useAuthStore();

  const [phase, setPhase] = useState<Phase>("launch");
  const [examLang, setExamLang] = useState<"en" | "ms">(globalLang);
  const [selectedSection, setSelectedSection] = useState<string>("quiz-a-1");
  const [result, setResult] = useState<ExamResult | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<KppQuestion[]>([]);

  // Fetch quiz questions
  const { data: allQuestions = [], isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.QUESTIONS, "quiz-pool"],
    queryFn: () => fetchQuizQuestions({ limit: 500 }),
  });

  // Save mutation
  const saveMutation = useSaveResultMutation(saveQuizResult);

  // Randomize and pick N questions
  const pickQuestions = useCallback(
    (pool: KppQuestion[], count: number) => {
      const shuffled = [...pool].map(q => ({ ...q })); // Fresh copy
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, count);
    },
    []
  );

  const handleStart = ({ language, setId }: { language: "en" | "ms"; setId?: string }) => {
    setExamLang(language);
    const section = setId || "quiz-a-1";
    setSelectedSection(section);

    if (section.startsWith("quiz-")) {
      const fromDb = allQuestions.filter((q) => q.set_id === section);
      if (fromDb.length > 0) {
        setActiveQuestions(fromDb.map((q) => ({ ...q })));
        setPhase("testing");
        return;
      }
    }

    const category = resolveSectionCategory(section);
    const pool = allQuestions.filter((q) => q.category === category);
    const candidatePool = pool.length > 0 ? pool : allQuestions;
    const picked = pickQuestions(candidatePool, QUIZ_QUESTION_COUNT);
    setActiveQuestions(picked);
    setPhase("testing");
  };

  const handleComplete = (examResult: ExamResult) => {
    setResult(examResult);
    setPhase("results");

    // Save to DB when authenticated with a real session
    if (user && !isDevBypass) {
      const category = resolveSectionCategory(selectedSection);

      saveMutation.mutate({
        user_id: user.id,
        quiz_title: category,
        score: examResult.score,
        total_questions: examResult.total,
        percentage: examResult.percentage,
        duration_seconds: examResult.durationSeconds,
        language: examLang,
        question_ids: examResult.questions.map((q) => q.id),
        // Original-order indices — the server trigger regrades against the
        // unshuffled kpp_questions.correct_index.
        answers: examResult.answersForStorage,
      });
    }
  };

  const handleRetry = () => {
    setResult(null);
    setPhase("launch");
  };

  const handleRetryWrong = (wrongIds: string[]) => {
    const combined = [...activeQuestions, ...allQuestions];
    const seen = new Set<string>();
    const wrongQs: KppQuestion[] = [];
    for (const q of combined) {
      if (wrongIds.includes(q.id) && !seen.has(q.id)) {
        seen.add(q.id);
        wrongQs.push({ ...q });
      }
    }
    if (wrongQs.length === 0) return;
    setActiveQuestions(wrongQs);
    setResult(null);
    setPhase("testing");
  };

  if (isLoading) {
    return (
      <div
        className="page-shell max-w-7xl w-full mx-auto"
        aria-busy="true"
        aria-label={t("common.loading")}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <div className="space-y-2.5">
            <Skeleton className="h-9 w-52 rounded-xl" />
            <Skeleton className="h-5 w-72 rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-[4.75rem] w-full rounded-2xl" />
              <Skeleton className="h-[4.75rem] w-full rounded-2xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Skeleton className="h-24 w-full rounded-2xl sm:h-32" />
              <Skeleton className="h-24 w-full rounded-2xl sm:h-32" />
              <Skeleton className="h-24 w-full rounded-2xl sm:h-32" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <div className="grid grid-cols-3 gap-2.5">
              <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
              <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
              <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
            </div>
          </div>
          <Skeleton className="h-[52px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl w-full mx-auto">
      {phase === "launch" && (isError
        ? <LoadError onRetry={() => { void refetch(); }} />
        : <TestLaunchPanel mode="quiz" t={t} onStart={handleStart} />)}

      {phase === "testing" && activeQuestions.length > 0 && (
        <ExamShell
          questions={activeQuestions}
          timeLimit={undefined} // Quizzes have no time limit
          mode="quiz"
          language={examLang}
          t={t}
          onComplete={handleComplete}
          persistScope={PROGRESS_SCOPES.quiz}
          userId={user?.id}
        />
      )}

      {phase === "testing" && activeQuestions.length === 0 && (
        <div className="panel mx-auto mt-8 flex min-h-[360px] max-w-xl flex-col items-center justify-center space-y-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Warning className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="font-heading text-xl font-bold">{t("quiz.noQuestionsTitle")}</h2>
          <p className="max-w-md text-muted-foreground">{t("quiz.noQuestions")}</p>
          <Button variant="brand" onClick={() => setPhase("launch")} className="mt-2 min-h-11">
            {t("common.back")}
          </Button>
        </div>
      )}

      {phase === "results" && result && (
        <TestResultsView
          result={result}
          mode="quiz"
          language={examLang}
          t={t}
          onRetry={handleRetry}
          onRetryWrong={handleRetryWrong}
          setId={selectedSection}
        />
      )}
    </div>
  );
}
