import { SpeechControl } from "@/components/shared/SpeechControl";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, CheckCircle, CaretDown, ArrowCounterClockwise, Download, House, FunnelSimple, Clock } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDuration, downloadBlob } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

import type { ExamResult } from "./ExamShell";
import type { TranslationKey } from "@/lib/translations";

interface TestResultsViewProps {
  result: ExamResult;
  mode: "quiz" | "mock";
  language: "en" | "ms";
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  onRetry: () => void;
  onRetryWrong?: (wrongQuestionIds: string[]) => void;
  setId?: string;
}

export function TestResultsView({
  result,
  mode,
  language,
  t,
  onRetry,
  onRetryWrong,
  setId,
}: TestResultsViewProps) {
  const navigate = useNavigate();
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const passMark = Math.ceil(result.total * 0.84);
  const reviewAvailable = result.questions.length > 0;
  const passed = mode === "mock"
    ? (result.passed ?? result.percentage >= 84)
    : result.percentage >= 70;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    result.questions.forEach((q) => {
      if (!map[q.category]) map[q.category] = { correct: 0, total: 0 };
      map[q.category].total++;
      if (result.answers[q.id] === q.correct_index) {
        map[q.category].correct++;
      }
    });
    return map;
  }, [result]);

  const categories = Object.keys(categoryBreakdown).sort();

  // Wrong question IDs
  const wrongIds = useMemo(
    () => result.questions.filter((q) => result.answers[q.id] !== q.correct_index).map((q) => q.id),
    [result]
  );

  // Filtered questions for review
  const filteredQuestions = useMemo(() => {
    let qs = result.questions;
    if (showWrongOnly) {
      qs = qs.filter((q) => result.answers[q.id] !== q.correct_index);
    }
    if (categoryFilter !== "all") {
      qs = qs.filter((q) => q.category === categoryFilter);
    }
    return qs;
  }, [result, showWrongOnly, categoryFilter]);

  const toggleExpanded = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  const handlePDF = async () => {
    const { generatePDF } = await import("@/lib/generatePDF");
    const blob = generatePDF({ result, language, mode, setId });
    const filename = `drivemy-${mode}-result.pdf`;

    // Try native share on mobile, fall back to download
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename)] })) {
      try {
        await navigator.share({
          files: [new File([blob], filename, { type: "application/pdf" })],
          title: `DriveMy ${mode === "mock" ? "Mock Test" : "Quiz"} Result`,
        });
        return;
      } catch {
        // Fall through to download
      }
    }

    downloadBlob(blob, filename);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-[var(--panel-gap)]">
      <div className="panel overflow-hidden">
        {/* The mark is the headline, stated in marks against the line: 42 of
            50 either happened or it did not. */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("results.score")}</p>
              <p className="type-display mt-2 text-[3.5rem] sm:text-[4.25rem]">
                {result.score.toLocaleString(language === "ms" ? "ms-MY" : "en-MY")}
                <span className="text-[0.45em] font-semibold text-muted-foreground"> / {result.total}</span>
              </p>
            </div>
            <span className={cn("pill px-3.5 py-1.5 text-sm", passed ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
              {passed ? <CheckCircle className="h-4 w-4" weight="fill" aria-hidden /> : <XCircle className="h-4 w-4" weight="fill" aria-hidden />}
              {passed ? t("results.passed") : t("results.failed")}
            </span>
          </div>

          {/* Factual, in marks, never consoling. */}
          {mode === "mock" && (
            <p className="mt-4 text-[0.9375rem]">
              {t("results.passMark", { mark: passMark, total: result.total })}{" "}
              <span className={cn("font-semibold", passed ? "text-success" : "text-destructive")}>
                {passed
                  ? t("results.headroom", { count: result.score - passMark })
                  : t("results.short", { count: passMark - result.score })}
              </span>
            </p>
          )}

          {result.autoSubmitted && (
            <p className="mt-2 text-sm font-medium text-destructive">{t("exam.autoSubmitted")}</p>
          )}

          <p className="mt-4 inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden />
            {t("results.timeTaken")}: {formatDuration(result.durationSeconds)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:px-8">
          <Button onClick={onRetry}>
            <ArrowCounterClockwise aria-hidden />
            {t("results.tryAgain")}
          </Button>
          {mode === "quiz" && wrongIds.length > 0 && onRetryWrong && (
            <Button variant="outline" onClick={() => onRetryWrong(wrongIds)}>
              <ArrowCounterClockwise aria-hidden />
              {t("exam.retryWrong")}
            </Button>
          )}
          {mode === "mock" && reviewAvailable && (
            <Button variant="outline" onClick={handlePDF}>
              <Download aria-hidden />
              {t("exam.pdfExport")}
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate(ROUTES.DASHBOARD)}>
            <House aria-hidden />
            {t("results.backToDashboard")}
          </Button>
        </div>
      </div>

      {!reviewAvailable && <p role="status">{t("exam.reviewUnavailable")}</p>}
      {reviewAvailable && <>
      {/* Category breakdown: cobalt below the 84% line, green at or above it.
          The hairline marks the line itself. */}
      <div className="panel space-y-5 p-6 sm:p-7">
        <h3 className="text-base font-semibold">{t("results.categoryBreakdown")}</h3>
        <div className="space-y-4">
          {categories.map((cat) => {
            const { correct, total } = categoryBreakdown[cat];
            const pct = Math.round((correct / total) * 100);
            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium capitalize">{cat.replace(/-/g, " ")}</span>
                  <span className="font-tabular-nums text-muted-foreground">{correct}/{total} ({pct}%)</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-700 ease-out", pct >= 84 ? "bg-success" : "bg-brand")}
                    style={{ width: `${pct}%` }}
                  />
                  <span aria-hidden className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: "84%" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question review */}
      <div className="panel space-y-5 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{t("results.reviewAnswers")}</h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-wrong-only"
                checked={showWrongOnly}
                onCheckedChange={(checked) => setShowWrongOnly(!!checked)}
              />
              <label htmlFor="show-wrong-only" className="cursor-pointer text-sm font-medium leading-none">
                {t("exam.showWrongOnly")}
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <FunnelSimple className="h-4 w-4 text-muted-foreground" aria-hidden />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                {/* Radix does not expose the trigger's visible value as its
                    accessible name, so it carries its own label. */}
                <SelectTrigger aria-label={t("exam.filterByCategory")} className="h-10 w-[170px] text-sm">
                  <SelectValue placeholder={t("exam.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("exam.allCategories")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {showWrongOnly ? t("results.allCorrect") : t("results.noFilterMatch")}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredQuestions.map((q) => {
              const userAnswer = result.answers[q.id];
              const isCorrect = userAnswer === q.correct_index;
              const isExpanded = expandedQuestions.has(q.id);
              const opts = language === "en" ? q.options_en : q.options_ms;
              const qText = language === "en" ? q.question_en : q.question_ms;
              const explanation = language === "en" ? q.explanation_en : q.explanation_ms;
              const originalIndex = result.questions.findIndex(orig => orig.id === q.id);

              return (
                <div key={q.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(q.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between gap-3 p-3.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-success" weight="fill" aria-hidden />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-destructive" weight="fill" aria-hidden />
                      )}
                      <span className="truncate font-medium">Q{originalIndex + 1}: {qText}</span>
                    </div>
                    <CaretDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} aria-hidden />
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 border-t border-border p-4">
                      <p className="text-sm">{qText}</p>
                      <div className="space-y-1.5">
                        {opts.map((opt, oi) => (
                          <div
                            key={oi}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                              oi === q.correct_index && "bg-success/15 font-medium text-success",
                              oi === userAnswer && oi !== q.correct_index && "bg-destructive/15 text-destructive line-through"
                            )}
                          >
                            <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                            {oi === q.correct_index && <CheckCircle className="ml-auto h-4 w-4 shrink-0" weight="fill" aria-hidden />}
                            {oi === userAnswer && oi !== q.correct_index && <XCircle className="ml-auto h-4 w-4 shrink-0" weight="fill" aria-hidden />}
                          </div>
                        ))}
                      </div>
                      {explanation && (
                        <div className="rounded-xl border border-brand-ink/20 bg-brand/15 p-3 text-sm">
                          <span className="font-semibold text-brand-ink">{t("quiz.explanation")}:</span> {explanation}
                          <SpeechControl kind="explanation" text={explanation} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>}
    </div>
  );
}
