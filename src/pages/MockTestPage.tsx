import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { MOCK_TIME_LIMIT, MOCK_PASS_MARK, QUESTIONS_BY_SET } from "@/lib/constants";
import { fetchMockQuestionsBySet } from "@/services/questions.service";
import { saveMockResult } from "@/services/results.service";
import { TestLaunchPanel } from "@/components/exam/TestLaunchPanel";
import { ExamShell, type ExamResult } from "@/components/exam/ExamShell";
import { TestResultsView } from "@/components/exam/TestResultsView";
import { Skeleton } from "@/components/ui/skeleton";

type Phase = "launch" | "testing" | "results";

export function MockTestPage() {
  const { t, language: globalLang } = useLanguage();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("launch");
  const [examLang, setExamLang] = useState<"en" | "ms">(globalLang);
  const [selectedSet, setSelectedSet] = useState("mock-1");
  const [result, setResult] = useState<ExamResult | null>(null);

  // Fetch questions for selected set
  const { data: questions = [], isLoading } = useQuery({
    queryKey: QUESTIONS_BY_SET(selectedSet),
    queryFn: () => fetchMockQuestionsBySet(selectedSet),
    enabled: false, // manual trigger
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveMockResult,
    onSuccess: () => {
      toast.success(t("exam.saved"));
      queryClient.invalidateQueries({ queryKey: ["mockBest"] });
      queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["progress", "mock", user.id] });
        queryClient.invalidateQueries({ queryKey: ["progress", "readiness", user.id] });
      }
    },
    onError: (error) => {
      console.error("Failed to save mock result", error);
      toast.error(t("common.error")); // Or a more specific error key if available
    }
  });

  const handleStart = async ({ language, setId }: { language: "en" | "ms"; setId?: string }) => {
    setExamLang(language);
    const targetSet = setId || selectedSet;
    if (setId) setSelectedSet(setId);
    
    // Fetch questions explicitly for the target set to avoid stale closure state
    try {
      const data = await queryClient.fetchQuery({
        queryKey: QUESTIONS_BY_SET(targetSet),
        queryFn: () => fetchMockQuestionsBySet(targetSet),
      });
      if (data && data.length > 0) {
        setPhase("testing");
      } else {
        toast.error("No questions found for this set.");
      }
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleWarning = () => {
    toast.warning(t("exam.warning5min"), { duration: 5000 });
  };

  const handleTimeUp = () => {
    toast.error(t("exam.timeUp"), { duration: 5000 });
  };

  const handleComplete = (examResult: ExamResult) => {
    setResult(examResult);
    setPhase("results");

    // Save to DB
    if (user) {
      saveMutation.mutate({
        user_id: user.id,
        set_id: selectedSet,
        score: examResult.score,
        total_questions: examResult.total,
        percentage: examResult.percentage,
        passed: examResult.score >= MOCK_PASS_MARK,
        duration_seconds: examResult.durationSeconds,
        answers: examResult.answers,
        language: examLang,
      });
    }
  };

  const handleRetry = () => {
    setResult(null);
    setPhase("launch");
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
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-12 w-full" />
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
    <div className="page-shell max-w-5xl">
      {phase === "launch" && (
        <TestLaunchPanel mode="mock" t={t} onStart={handleStart} />
      )}

      {phase === "testing" && questions.length > 0 && (
        <ExamShell
          questions={questions}
          language={examLang}
          timeLimit={MOCK_TIME_LIMIT}
          mode="mock"
          t={t}
          onComplete={handleComplete}
          onWarning={handleWarning}
          onTimeUp={handleTimeUp}
        />
      )}

      {phase === "results" && result && (
        <TestResultsView
          result={result}
          mode="mock"
          language={examLang}
          t={t}
          onRetry={handleRetry}
          setId={selectedSet}
        />
      )}
    </div>
  );
}
