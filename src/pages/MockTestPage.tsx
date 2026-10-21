import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Warning } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { MOCK_TIME_LIMIT, QUESTIONS_BY_SET } from "@/lib/constants";
import { fetchMockQuestionsBySet, fetchMockAnswerKey } from "@/services/questions.service";
import { applyAnswerKey, hasCompleteAnswerKey } from "@/components/exam/examScoring";
import { PROGRESS_SCOPES } from "@/lib/testProgress";
import { OFFLINE_QUEUED_ID, saveMockResult } from "@/services/results.service";
import { TestLaunchPanel } from "@/components/exam/TestLaunchPanel";
import { ExamShell, type ExamResult } from "@/components/exam/ExamShell";
import { TestResultsView } from "@/components/exam/TestResultsView";
import { Skeleton } from "@/components/ui/skeleton";

// "grading" covers the round-trip that fetches the answer key after submission.
// Without it the results screen would flash a zero score before the key lands.
type Phase = "launch" | "testing" | "grading" | "results";

export function MockTestPage() {
  const { t, language: globalLang } = useLanguage();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("launch");
  const [examLang, setExamLang] = useState<"en" | "ms">(globalLang);
  const [selectedSet, setSelectedSet] = useState("mock-1");
  const [submissionStatus, setSubmissionStatus] = useState<"queued" | "failed" | null>(null);
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
    onSuccess: (saved) => {
      if ((saved as { id?: string } | null)?.id === OFFLINE_QUEUED_ID) return;
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
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleWarning = () => {
    toast.warning(t("exam.warning5min"), { duration: 5000 });
  };

  const handleTimeUp = () => {
    toast.error(t("exam.timeUp"), { duration: 5000 });
  };

  const handleComplete = async (examResult: ExamResult) => {
    setPhase("grading");
    setSubmissionStatus(null);
    setResult(examResult);
    try {
      if (!user) throw new Error("A signed-in account is required to save a mock attempt");
      const saved = await saveMutation.mutateAsync({
        user_id: user.id,
        set_id: selectedSet,
        score: 0,
        total_questions: examResult.total,
        percentage: 0,
        passed: false,
        duration_seconds: examResult.durationSeconds,
        answers: examResult.answersForStorage,
        language: examLang,
      }) as { id: string; score: number; total_questions: number; percentage: number; passed: boolean } | null;
      if (!saved) throw new Error("The server did not return a saved result");
      if (saved.id === OFFLINE_QUEUED_ID) {
        setSubmissionStatus("queued");
        setPhase("results");
        return;
      }
      // The returned row contains the trigger's authoritative grade.
      let graded: ExamResult = {
        ...examResult,
        score: saved.score,
        total: saved.total_questions,
        percentage: Number(saved.percentage),
        passed: saved.passed,
        questions: [], // Do not mark answers wrong when the key is unavailable.
      };
      try {
        const key = await fetchMockAnswerKey(saved.id);
        const reviewed = applyAnswerKey(examResult.questions, examResult.permutations, key);
        if (!hasCompleteAnswerKey(reviewed)) throw new Error("Incomplete answer review");
        graded = { ...graded, questions: reviewed };
      } catch {
        toast.error(t("exam.reviewUnavailable"));
      }
      setResult(graded);
      setPhase("results");
    } catch {
      setSubmissionStatus("failed");
      setPhase("results");
    }
  };

  const handleRetry = () => {
    setResult(null);
    setSubmissionStatus(null);
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

      {phase === "grading" && (
        <div
          className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
          role="status"
          aria-live="polite"
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">{t("exam.grading")}</p>
        </div>
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
          persistScope={PROGRESS_SCOPES.mock(selectedSet)}
          userId={user?.id}
        />
      )}

      {/* Without this, a failed or emptied question fetch left the user staring
          at a blank page with no explanation and no way forward. */}
      {phase === "testing" && questions.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-card rounded-2xl border shadow-sm p-8 mt-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Warning className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-muted-foreground max-w-sm">{t("quiz.noQuestions")}</p>
          <Button onClick={handleRetry}>{t("common.back")}</Button>
        </div>
      )}

      {phase === "results" && result && submissionStatus && (
        <div className="plate p-6 space-y-4" role="status">
          <p>{t(submissionStatus === "queued" ? "exam.queuedUngraded" : "exam.saveFailedUngraded")}</p>
          {submissionStatus === "failed" && (
            <Button onClick={() => handleComplete(result)}>{t("exam.retrySave")}</Button>
          )}
          <Button variant="outline" onClick={handleRetry}>{t("common.back")}</Button>
        </div>
      )}
      {phase === "results" && result && !submissionStatus && (
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
