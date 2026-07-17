import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { QUIZ_QUESTION_COUNT, QUERY_KEYS } from "@/lib/constants";
import { fetchQuizQuestions } from "@/services/questions.service";
import { saveQuizResult } from "@/services/results.service";
import { TestLaunchPanel } from "@/components/exam/TestLaunchPanel";
import { ExamShell, type ExamResult } from "@/components/exam/ExamShell";
import { TestResultsView } from "@/components/exam/TestResultsView";
import { Skeleton } from "@/components/ui/skeleton";
import type { KppQuestion } from "@/types/database";

type Phase = "launch" | "testing" | "results";

export function QuizPage() {
  const { t, language: globalLang } = useLanguage();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("launch");
  const [examLang, setExamLang] = useState<"en" | "ms">(globalLang);
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [result, setResult] = useState<ExamResult | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<KppQuestion[]>([]);

  // Fetch quiz questions
  const { data: allQuestions = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.QUESTIONS, "quiz-pool"],
    queryFn: () => fetchQuizQuestions({ limit: 200 }),
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveQuizResult,
    onSuccess: () => {
      toast.success(t("exam.saved"));
      queryClient.invalidateQueries({ queryKey: ["quizBest"] });
      queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["progress", "quiz", user.id] });
        queryClient.invalidateQueries({ queryKey: ["progress", "readiness", user.id] });
      }
    },
    onError: (error) => {
      console.error("Failed to save quiz result", error);
      toast.error(t("common.error"));
    }
  });

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
    const section = setId || "A";
    setSelectedSection(section);
    
    // Map section A, B, C to categories:
    let category = "road-signs";
    if (section === "B") category = "traffic-rules";
    if (section === "C") category = "safety-principles";

    const pool = allQuestions.filter(q => q.category === category);
    const picked = pickQuestions(pool.length > 0 ? pool : allQuestions, QUIZ_QUESTION_COUNT);
    setActiveQuestions(picked);
    setPhase("testing");
  };

  const handleComplete = (examResult: ExamResult) => {
    setResult(examResult);
    setPhase("results");

    // Save to DB
    if (user) {
      let category = "road-signs";
      if (selectedSection === "B") category = "traffic-rules";
      if (selectedSection === "C") category = "safety-principles";

      saveMutation.mutate({
        user_id: user.id,
        quiz_title: category,
        score: examResult.score,
        total_questions: examResult.total,
        percentage: examResult.percentage,
        duration_seconds: examResult.durationSeconds,
        language: examLang,
        question_ids: examResult.questions.map((q) => q.id),
        answers: examResult.answers,
      });
    }
  };

  const handleRetry = () => {
    setResult(null);
    setPhase("launch");
  };

  const handleRetryWrong = (wrongIds: string[]) => {
    const wrongQs = allQuestions
      .filter((q) => wrongIds.includes(q.id))
      .map((q) => ({ ...q })); // Fresh copy to prevent mutation
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
        />
      )}

      {phase === "testing" && activeQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-card rounded-2xl border shadow-sm p-8 mt-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-muted-foreground">warning</span>
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
        />
      )}
    </div>
  );
}
