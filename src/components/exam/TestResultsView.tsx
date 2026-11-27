import { mockPassMark } from "@/lib/constants";
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

const CATEGORY_TRANSLATION_KEYS: Record<string, TranslationKey> = {
  "road-signs": "progress.category.road-signs",
  road_signs: "progress.category.road-signs",
  signs: "progress.category.road-signs",
  "traffic-rules": "progress.category.traffic-rules",
  traffic_rules: "progress.category.traffic-rules",
  rules: "progress.category.traffic-rules",
  "safety-principles": "progress.category.safety-principles",
  safety_principles: "progress.category.safety-principles",
  safety: "progress.category.safety-principles",
  part_a: "launch.sectionA",
  "part-a": "launch.sectionA",
  a: "launch.sectionA",
  part_b: "launch.sectionB",
  "part-b": "launch.sectionB",
  b: "launch.sectionB",
  part_c: "launch.sectionC",
  "part-c": "launch.sectionC",
  c: "launch.sectionC",
  warning: "signs.categories.warning",
  prohibitory: "signs.categories.prohibitory",
  mandatory: "signs.categories.mandatory",
  information: "signs.categories.information",
  temporary: "signs.categories.temporary",
};

function formatCategoryLabel(
  category: string,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  const key = CATEGORY_TRANSLATION_KEYS[category.trim().toLowerCase()];
  if (key) return t(key);
  return category.replace(/[-_]+/g, " ");
}

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

  // Wrong question IDs
  const wrongIds = useMemo(
    () => result.questions.filter((q) => result.answers[q.id] !== q.correct_index).map((q) => q.id),
    [result]
  );

  // The review opens on what to fix; an all-correct attempt lists every question.
  const [showWrongOnly, setShowWrongOnly] = useState(wrongIds.length > 0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const passMark = mockPassMark(result.total);
  const reviewAvailable = result.questions.length > 0;
  const passed = mode === "mock"
    ? (result.passed ?? result.score >= mockPassMark(result.total))
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

  // Quizzes lead with the retry that fixes mistakes; Try Again steps back to outline.
  const retryWrong = mode === "quiz" && wrongIds.length > 0 ? onRetryWrong : undefined;

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
    if (matchMedia("(pointer: coarse)").matches && navigator.share && navigator.canShare?.({ files: [new File([blob], filename)] })) {
      try {
        await navigator.share({
          files: [new File([blob], filename, { type: "application/pdf" })],
          title: t("exam.shareTitle", {
            mode: t(mode === "mock" ? "exam.shareMode.mock" : "exam.shareMode.quiz"),
          }),
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
              <h1 className="page-title">
                {t(mode === "mock" ? "mock.title" : "results.title")}
              </h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{t("results.score")}</p>
              <p className="type-display mt-1.5 text-[2.5rem] sm:text-[4.25rem]">
                {result.score.toLocaleString(language === "ms" ? "ms-MY" : "en-MY")}
                <span className="text-[0.45em] font-semibold text-muted-foreground"> / {result.total}</span>
              </p>
            </div>
            {/* A practice quiz is not a pass or a fail: only the mock mirrors the exam's mark. */}
            {mode === "mock" && (
              <span className={cn("pill px-3.5 py-1.5 text-sm", passed ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
                {passed ? <CheckCircle className="h-4 w-4" weight="fill" aria-hidden /> : <XCircle className="h-4 w-4" weight="fill" aria-hidden />}
                {passed ? t("results.passed") : t("results.failed")}
              </span>
            )}
          </div>

          {/* Factual, in marks, never consoling. */}
          {mode === "mock" && (
            <p className="mt-4 text-base">
              {t("results.passMark", { mark: passMark, total: result.total })}{" "}
              <span className={cn("font-semibold", passed ? "text-success" : "text-destructive")}>
                {passed
                  ? t("results.headroom", { count: result.score - passMark })
                  : t("results.short", { count: passMark - result.score })}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{t("results.notJpj")}</span>
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

        <div className="flex flex-wrap items-center gap-2.5 border-t border-border bg-muted/40 px-6 py-4 sm:px-8">
          {retryWrong && (
            <Button className="min-h-11" onClick={() => retryWrong(wrongIds)}>
              <ArrowCounterClockwise aria-hidden />
              {t("exam.retryWrong")}
            </Button>
          )}
          <Button variant={retryWrong ? "outline" : "default"} className="min-h-11" onClick={onRetry}>
            <ArrowCounterClockwise aria-hidden />
            {t("results.tryAgain")}
          </Button>
          {mode === "mock" && reviewAvailable && (
            <Button variant="outline" className="min-h-11" onClick={handlePDF}>
              <Download aria-hidden />
              {t("exam.pdfExport")}
            </Button>
          )}
          <Button variant="ghost" className="min-h-11" onClick={() => navigate(ROUTES.DASHBOARD)}>
            <House aria-hidden />
            {t("results.backToDashboard")}
          </Button>
        </div>
      </div>

      {!reviewAvailable && <p role="status">{t("exam.reviewUnavailable")}</p>}
      {reviewAvailable && <>
      {/* Category breakdown: cobalt below the pass line, green at or above it.
          The hairline marks the line itself. */}
      <div className="panel space-y-5 p-6 sm:p-7">
        <h2 className="font-heading text-lg font-bold tracking-tight">{t("results.categoryBreakdown")}</h2>
        <div className="space-y-4">
          {categories.map((cat) => {
            const { correct, total } = categoryBreakdown[cat];
            const pct = Math.round((correct / total) * 100);
            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium">{formatCategoryLabel(cat, t)}</span>
                  <span className="font-tabular-nums text-muted-foreground">{correct}/{total} ({pct}%)</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full w-full origin-left rounded-full transition-transform duration-700 ease-out motion-reduce:transition-none",
                      pct >= (100 * passMark) / result.total ? "bg-success" : "bg-brand"
                    )}
                    style={{ transform: `scaleX(${Math.max(0, Math.min(1, pct / 100))})` }}
                  />
                  <span aria-hidden className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: `${(100 * passMark) / result.total}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question review */}
      <div className="panel space-y-5 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold tracking-tight">{t("results.reviewAnswers")}</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex min-h-11 items-center gap-2.5">
              <Checkbox
                id="show-wrong-only"
                checked={showWrongOnly}
                onCheckedChange={(checked) => setShowWrongOnly(!!checked)}
              />
              <label htmlFor="show-wrong-only" className="flex min-h-11 cursor-pointer select-none items-center text-sm font-medium leading-none">
                {t("exam.showWrongOnly")}
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <FunnelSimple className="h-4 w-4 text-muted-foreground" aria-hidden />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                {/* Radix does not expose the trigger's visible value as its
                    accessible name, so it carries its own label. */}
                <SelectTrigger aria-label={t("exam.filterByCategory")} className="h-11 min-h-11 w-[190px] text-sm">
                  <SelectValue placeholder={t("exam.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("exam.allCategories")}</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {formatCategoryLabel(c, t)}
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
          <div className="space-y-2.5">
            {filteredQuestions.map((q) => {
              const userAnswer = result.answers[q.id];
              const isCorrect = userAnswer === q.correct_index;
              const isExpanded = expandedQuestions.has(q.id);
              const opts = language === "en" ? q.options_en : q.options_ms;
              const qText = language === "en" ? q.question_en : q.question_ms;
              const explanation = language === "en" ? q.explanation_en : q.explanation_ms;
              const originalIndex = result.questions.findIndex(orig => orig.id === q.id);
              const qPrefix = language === "ms" ? `S${originalIndex + 1}` : `Q${originalIndex + 1}`;

              return (
                <div key={q.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(q.id)}
                    aria-expanded={isExpanded}
                    className="flex min-h-11 w-full items-center justify-between gap-3 p-3.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-success" weight="fill" aria-hidden />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-destructive" weight="fill" aria-hidden />
                      )}
                      <span className="truncate font-medium">{qPrefix}: {qText}</span>
                    </div>
                    <CaretDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} aria-hidden />
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 border-t border-border p-4">
                      <p className="text-sm leading-relaxed">{qText}</p>
                      {q.image_url && (
                        <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                          <img src={q.image_url} alt="" className="mx-auto max-h-40 w-auto object-contain p-3" />
                        </div>
                      )}
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
                        <div className="rounded-lg border border-brand-ink/20 bg-brand/15 p-3 text-sm">
                          <span className="font-semibold text-brand-ink">{t("quiz.explanation")}:</span> {explanation}
                          <SpeechControl kind="explanation" text={explanation} />
                          {q.source_url && <p className="mt-2 text-muted-foreground">{t("exam.sourceCitation")}: {q.source_url}</p>}
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
