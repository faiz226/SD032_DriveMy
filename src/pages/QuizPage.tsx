import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Warning } from "@/components/ui/icons";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { QUIZ_QUESTION_COUNT, QUERY_KEYS } from "@/lib/constants";
import { fetchQuizQuestions } from "@/services/questions.service";
import { getTextbookSet, getTextbookPracticePool } from "@/content/kppQuestionBank";
import { saveQuizResult } from "@/services/results.service";
import { useSaveResultMutation } from "@/hooks/useResults";
import { PROGRESS_SCOPES } from "@/lib/testProgress";
import { TestLaunchPanel } from "@/components/exam/TestLaunchPanel";
import { ExamShell, type ExamResult } from "@/components/exam/ExamShell";
import { TestResultsView } from "@/components/exam/TestResultsView";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { data: allQuestions = [], isLoading } = useQuery({
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
      const textbookSet = fromDb.length > 0 ? fromDb : getTextbookSet(section);
      if (textbookSet.length > 0) {
        setActiveQuestions(textbookSet.map((q) => ({ ...q })));
        setPhase("testing");
        return;
      }
    }

    const category = resolveSectionCategory(section);
    const pool = allQuestions.filter((q) => q.category === category);
    const fallbackPool = pool.length > 0 ? pool : getTextbookPracticePool(category);
    const picked = pickQuestions(fallbackPool.length > 0 ? fallbackPool : allQuestions, QUIZ_QUESTION_COUNT);
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
      <div className="max-w-lg mx-auto py-12" aria-busy="true" aria-label={t("common.loading")}>
        <div className="card-premium p-6 sm:p-8 space-y-8 animate-pulse">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl w-full mx-auto">
      {phase === "launch" && (
        <TestLaunchPanel mode="quiz" t={t} onStart={handleStart} />
      )}

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
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-card rounded-2xl border shadow-sm p-8 mt-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Warning className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="text-xl font-bold font-heading">No Questions Available</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't load questions from the database for this section. Please check your database connection or seed the questions table.
          </p>
          <button 
            onClick={() => setPhase("launch")}
            className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors mt-4"
          >
            Go Back
          </button>
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
