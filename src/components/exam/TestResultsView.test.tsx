import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestResultsView } from "./TestResultsView";
import type { ExamResult } from "./ExamShell";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
const result: ExamResult = { questions: [], answers: {}, answersForStorage: {}, permutations: {},
  score: 42, total: 60, percentage: 70, passed: false, durationSeconds: 10 };
const question = (id: string, text: string) => ({ id, category: "road-signs", set_id: "s", order_index: 0, question_en: text,
  question_ms: text, options_en: ["a", "b"], options_ms: ["a", "b"], correct_index: 0, image_url: null, created_at: "" });
// "alpha" is answered right, "beta" wrong (or both right when `betaAnswer` is 0).
const attempt = (betaAnswer: number): ExamResult => ({ questions: [question("1", "alpha"), question("2", "beta")],
  answers: { "1": 0, "2": betaAnswer }, answersForStorage: {}, permutations: {}, score: 1, total: 2, percentage: 50, durationSeconds: 5 });
const view = (r: ExamResult, mode: "quiz" | "mock") => render(<MemoryRouter><TestResultsView result={r} mode={mode} language="en"
  t={(key) => key} onRetry={() => {}} onRetryWrong={() => {}} /></MemoryRouter>);

describe("results lead with what to fix", () => {
  beforeEach(() => { cleanup(); });
  it.each(["quiz", "mock"] as const)("%s review opens on the wrong answers only", (mode) => {
    view(attempt(1), mode);
    expect(screen.getByLabelText("exam.showWrongOnly")).toBeChecked();
    expect(screen.getByText(/beta/)).toBeInTheDocument();
    expect(screen.queryByText(/alpha/)).not.toBeInTheDocument();
  });
  it("lists every question when nothing was wrong", () => {
    view(attempt(0), "quiz");
    expect(screen.getByLabelText("exam.showWrongOnly")).not.toBeChecked();
    expect(screen.getByText(/alpha/)).toBeInTheDocument();
    expect(screen.getByText(/beta/)).toBeInTheDocument();
  });
  it("makes Retry Wrong Answers the filled quiz button and Try Again the outline one", () => {
    view(attempt(1), "quiz");
    expect(screen.getByRole("button", { name: "exam.retryWrong" }).className).toContain("bg-primary");
    expect(screen.getByRole("button", { name: "results.tryAgain" }).className).not.toContain("bg-primary");
  });
  it("keeps Try Again filled when there is nothing to retry", () => {
    view(attempt(0), "quiz");
    expect(screen.queryByRole("button", { name: "exam.retryWrong" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "results.tryAgain" }).className).toContain("bg-primary");
  });
});

describe("authoritative mock result display", () => {
  beforeEach(() => { cleanup(); });
  it("uses the server pass status rather than treating 42 as a pass for every denominator", () => {
    render(<MemoryRouter><TestResultsView result={result} mode="mock" language="en" t={(key) => key} onRetry={() => {}} /></MemoryRouter>);
    expect(screen.getByText("results.failed")).toBeInTheDocument();
    expect(screen.queryByText("results.passed")).not.toBeInTheDocument();
  });
  it("shows the pass pill and a not-JPJ line on a mock", () => {
    render(<MemoryRouter><TestResultsView result={result} mode="mock" language="en" t={(key) => key} onRetry={() => {}} /></MemoryRouter>);
    expect(screen.getByText("results.failed")).toBeInTheDocument();
    expect(screen.getByText("results.notJpj")).toBeInTheDocument();
  });
  it("shows no pass or fail on a practice quiz", () => {
    render(<MemoryRouter><TestResultsView result={{ ...result, passed: undefined, percentage: 90 }} mode="quiz" language="en" t={(key) => key} onRetry={() => {}} /></MemoryRouter>);
    expect(screen.queryByText("results.failed")).not.toBeInTheDocument();
    expect(screen.queryByText("results.passed")).not.toBeInTheDocument();
  });
  it("does not offer per-question review, categorical grading or PDF when the key is unavailable", () => {
    render(<MemoryRouter><TestResultsView result={result} mode="mock" language="en" t={(key) => key} onRetry={() => {}} /></MemoryRouter>);
    expect(screen.getByText("exam.reviewUnavailable")).toBeInTheDocument();
    expect(screen.queryByText("results.categoryBreakdown")).not.toBeInTheDocument();
    expect(screen.queryByText("results.reviewAnswers")).not.toBeInTheDocument();
    expect(screen.queryByText("exam.pdfExport")).not.toBeInTheDocument();
  });
});
