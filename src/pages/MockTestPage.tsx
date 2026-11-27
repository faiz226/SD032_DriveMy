import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Warning } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { LEGACY_MOCK_TIME_LIMIT, LEGACY_MOCK_TOTAL, MOCK_TIME_LIMIT, QUESTIONS_BY_SET } from "@/lib/constants";
import { fetchMockQuestionsBySet, fetchMockAnswerKey } from "@/services/questions.service";
import { applyAnswerKey, hasCompleteAnswerKey } from "@/lib/exam/scoring";
import { PROGRESS_SCOPES } from "@/lib/testProgress";
import { OFFLINE_QUEUED_ID, saveMockResult } from "@/services/results.service";
import { useSaveResultMutation } from "@/hooks/useResults";
import { TestLaunchPanel } from "@/components/exam/TestLaunchPanel";
import { ExamShell, type ExamResult } from "@/components/exam/ExamShell";
import { TestResultsView } from "@/components/exam/TestResultsView";
import { Skeleton } from "@/components/ui/skeleton";

// "grading" covers the round-trip that fetches the answer key after submission.
// Without it the results screen would flash a zero score before the key lands.
type Phase = "launch" | "testing" | "grading" | "results";

export function MockTestPage() {
  const { t, language: globalLang } = useLanguage();
  const { user, isDevBypass } = useAuthStore();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("launch");
  const [examLang, setExamLang] = useState<"en" | "ms">(globalLang);
  const [selectedSet, setSelectedSet] = useState("mock-da-combined-1");
  const [submissionStatus, setSubmissionStatus] = useState<"queued" | "failed" | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);

  // Fetch questions for selected set
  const { data: questions = [], isLoading } = useQuery({
    queryKey: QUESTIONS_BY_SET(selectedSet),
    queryFn: () => fetchMockQuestionsBySet(selectedSet),
    enabled: false, // manual trigger
  });

  // Save mutation
  const saveMutation = useSaveResultMutation(saveMockResult);

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
        if (data[0].set_id === "mock-1") toast.info(t("mock.legacyFormat"));
        setPhase("testing");
      } else {
        toast.error(t("quiz.noQuestions"));
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

    if (isDevBypass) {
      setSubmissionStatus("queued");
      setPhase("results");
      return;
    }

    try {
      if (!user) throw new Error("A signed-in account is required to save a mock attempt");
      const saved = await saveMutation.mutateAsync({
        user_id: user.id,
        set_id: questions[0]?.set_id ?? selectedSet,
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
      <div
        className="page-shell max-w-5xl"
        aria-busy="true"
        aria-label={t("common.loading")}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <div className="space-y-2.5">
            <Skeleton className="h-9 w-56 rounded-xl" />
            <Skeleton className="h-5 w-full max-w-lg rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-[4.75rem] w-full rounded-2xl" />
              <Skeleton className="h-[4.75rem] w-full rounded-2xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full rounded-2xl sm:h-36" />
              <Skeleton className="h-28 w-full rounded-2xl sm:h-36" />
            </div>
          </div>
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
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
          className="flex min-h-[50dvh] flex-col items-center justify-center gap-4"
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
          timeLimit={questions.length === LEGACY_MOCK_TOTAL ? LEGACY_MOCK_TIME_LIMIT : MOCK_TIME_LIMIT}
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
        <div className="panel mx-auto mt-8 flex min-h-[360px] max-w-xl flex-col items-center justify-center space-y-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Warning className="h-8 w-8 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="font-heading text-xl font-bold">{t("quiz.noQuestionsTitle")}</h2>
          <p className="max-w-sm text-muted-foreground">{t("quiz.noQuestions")}</p>
          <Button variant="brand" onClick={handleRetry} className="mt-2 min-h-11">
            {t("common.back")}
          </Button>
        </div>
      )}

      {phase === "results" && result && submissionStatus && (
        <div className="panel mx-auto max-w-xl space-y-4 p-6 sm:p-7" role="status">
          <p className="text-base leading-relaxed">
            {t(submissionStatus === "queued" ? "exam.queuedUngraded" : "exam.saveFailedUngraded")}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {submissionStatus === "failed" && (
              <Button variant="brand" className="min-h-11" onClick={() => handleComplete(result)}>
                {t("exam.retrySave")}
              </Button>
            )}
            <Button variant="outline" className="min-h-11" onClick={handleRetry}>
              {t("common.back")}
            </Button>
          </div>
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
