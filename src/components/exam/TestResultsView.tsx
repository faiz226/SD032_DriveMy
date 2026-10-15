import "@/styles/jalan-type.css";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, CheckCircle, CaretDown, CaretUp, ArrowCounterClockwise, Download, House, FunnelSimple } from "phosphor-react";
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
import { NumberTicker } from "@/components/ui/number-ticker";

import type { ExamResult } from "./ExamShell";
import type { TranslationKey } from "@/lib/translations";
import confetti from "canvas-confetti";
import { useEffect } from "react";

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

  // Confetti on pass — but never for a learner who asked for no animation.
  // Jalan's floor is zero elements animating under prefers-reduced-motion, and
  // this fired unconditionally. matchMedia rather than a hook so it is read at
  // the moment of the effect, and the whole thing is skipped rather than sped
  // up: a burst of particles has no reduced-motion equivalent.
  useEffect(() => {
    if (!passed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }, [passed]);

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
    <div className="type-body max-w-3xl mx-auto space-y-6">
      <div className="plate p-6 sm:p-8">
        {/* The mark is the headline, and it is stated in marks against the
            line rather than as a percentage in a gauge. A gauge cannot show a
            threshold, and the threshold is the entire shape of this
            qualification: 42 of 50 either happened or it did not. */}
        <p className="type-label text-sm" style={{ color: "rgb(var(--road-muted))" }}>
          {t("results.score")}
        </p>
        <p className="type-figure mt-1 text-5xl" style={{ color: "rgb(var(--road-ink))" }}>
          <NumberTicker value={result.score} locale={language === "ms" ? "ms-MY" : "en-MY"} />
          <span style={{ color: "rgb(var(--road-muted))" }}>/{result.total}</span>
        </p>

        {/* Pass and fail are plates, not tinted pills: a 15% wash measures
            close to the surface it sits on and does not survive daylight. */}
        <p
          className="type-label-strong mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm"
          style={{
            borderRadius: "var(--r-plate)",
            backgroundColor: passed ? "rgb(var(--lulus))" : "rgb(var(--berhenti))",
            color: "rgb(var(--paint))",
          }}
        >
          {passed ? <CheckCircle className="h-4 w-4" weight="fill" aria-hidden /> : <XCircle className="h-4 w-4" weight="fill" aria-hidden />}
          {passed ? t("results.passed") : t("results.failed")}
        </p>

        {/* Signage register: factual, in marks, never consoling. The old copy
            here was "Keep practising. You can do it!". */}
        {mode === "mock" && (
          <p className="type-label mt-3 text-[0.9375rem]" style={{ color: "rgb(var(--road-ink))" }}>
            {t("results.passMark", { mark: passMark, total: result.total })}{" "}
            {passed
              ? t("results.headroom", { count: result.score - passMark })
              : t("results.short", { count: passMark - result.score })}
          </p>
        )}

        {result.autoSubmitted && (
          <p className="type-label mt-2 text-sm" style={{ color: "rgb(var(--berhenti))" }}>
            {t("exam.autoSubmitted")}
          </p>
        )}

        <p className="type-label mt-4 text-sm tabular-nums" style={{ color: "rgb(var(--road-muted))" }}>
          {t("results.timeTaken")}: {formatDuration(result.durationSeconds)}
        </p>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={onRetry}
            className="type-label-strong focus-paint tap flex items-center gap-2 px-4 text-sm"
            style={{ borderRadius: "var(--r-plate)", backgroundColor: "rgb(var(--road-ink))", color: "rgb(var(--road-raised))" }}
          >
            <ArrowCounterClockwise className="w-4 h-4" />
            {t("results.tryAgain")}
          </button>

          {mode === "quiz" && wrongIds.length > 0 && onRetryWrong && (
            <button
              onClick={() => onRetryWrong(wrongIds)}
              className="type-label focus-paint tap flex items-center gap-2 border px-4 text-sm"
              style={{ borderRadius: "var(--r-plate)", borderColor: "rgb(var(--road-edge))", color: "rgb(var(--road-ink))" }}
            >
              <ArrowCounterClockwise className="w-4 h-4" />
              {t("exam.retryWrong")}
            </button>
          )}

          {mode === "mock" && reviewAvailable && (
            <button
              onClick={handlePDF}
              className="type-label focus-paint tap flex items-center gap-2 border px-4 text-sm"
              style={{ borderRadius: "var(--r-plate)", borderColor: "rgb(var(--road-edge))", color: "rgb(var(--road-ink))" }}
            >
              <Download className="w-4 h-4" />
              {t("exam.pdfExport")}
            </button>
          )}

          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="type-label focus-paint tap flex items-center gap-2 border px-4 text-sm"
            style={{ borderRadius: "var(--r-plate)", borderColor: "rgb(var(--road-edge))", color: "rgb(var(--road-ink))" }}
          >
            <House className="w-4 h-4" />
            {t("results.backToDashboard")}
          </button>
        </div>
      </div>

      {!reviewAvailable && <p role="status">{t("exam.reviewUnavailable")}</p>}
      {reviewAvailable && <>
      {/* ── Category breakdown ───────────────────────────────────────── */}
      <div className="plate p-6 space-y-4">
        <h3 className="type-label-strong text-base" style={{ color: "rgb(var(--road-ink))" }}>{t("results.categoryBreakdown")}</h3>
        <div className="space-y-3">
          {categories.map((cat) => {
            const { correct, total } = categoryBreakdown[cat];
            const pct = Math.round((correct / total) * 100);
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{cat.replace(/-/g, " ")}</span>
                  <span className="text-muted-foreground font-tabular-nums">{correct}/{total} ({pct}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      pct >= 84 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Question review ──────────────────────────────────────────── */}
      <div className="plate p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="type-label-strong text-base" style={{ color: "rgb(var(--road-ink))" }}>{t("results.reviewAnswers")}</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-wrong-only"
                checked={showWrongOnly}
                onCheckedChange={(checked) => setShowWrongOnly(!!checked)}
              />
              <label
                htmlFor="show-wrong-only"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {t("exam.showWrongOnly")}
              </label>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <FunnelSimple className="w-3.5 h-3.5 text-muted-foreground mr-1" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                {/* Radix renders the trigger as a combobox button whose visible value is
                    not exposed as its accessible name, so axe reported it as a
                    button with no discernible text. The key already existed. */}
                <SelectTrigger
                  aria-label={t("exam.filterByCategory")}
                  className="type-label focus-paint tap-sm w-[150px] border px-3 text-sm"
                  style={{ borderRadius: "var(--r-plate)", borderColor: "rgb(var(--road-edge))", color: "rgb(var(--road-ink))" }}
                >
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
          <p className="text-sm text-muted-foreground text-center py-4">
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
                <div key={q.id} className="border overflow-hidden" style={{ borderColor: "rgb(var(--road-edge))", borderRadius: "var(--r-plate)" }}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(q.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 text-left text-sm transition-colors",
                      isCorrect ? "bg-success/5" : "bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="truncate font-medium">Q{originalIndex + 1}: {qText}</span>
                    </div>
                    {isExpanded ? <CaretUp className="w-4 h-4 shrink-0" /> : <CaretDown className="w-4 h-4 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-border space-y-3">
                      <p className="text-sm">{qText}</p>
                      <div className="space-y-1.5">
                        {opts.map((opt, oi) => (
                          <div
                            key={oi}
                            className={cn(
                              "text-xs px-3 py-2 rounded-md flex items-center gap-2",
                              oi === q.correct_index && "bg-success/10 font-medium",
                              oi === userAnswer && oi !== q.correct_index && "bg-destructive/10 line-through"
                            )}
                          >
                            <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                            {oi === q.correct_index && <CheckCircle className="w-3 h-3 text-success ml-auto" />}
                            {oi === userAnswer && oi !== q.correct_index && <XCircle className="w-3 h-3 text-destructive ml-auto" />}
                          </div>
                        ))}
                      </div>
                      {explanation && (
                        <div className="p-3 rounded-md bg-accent border border-border text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{t("quiz.explanation")}:</span> {explanation}
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
