import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestResultsView } from "./TestResultsView";
import type { ExamResult } from "./ExamShell";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
const result: ExamResult = { questions: [], answers: {}, answersForStorage: {}, permutations: {},
  score: 42, total: 60, percentage: 70, passed: false, durationSeconds: 10 };
describe("authoritative mock result display", () => {
  beforeEach(() => { cleanup(); });
  it("uses the server pass status rather than treating 42 as a pass for every denominator", () => {
    render(<MemoryRouter><TestResultsView result={result} mode="mock" language="en" t={(key) => key} onRetry={() => {}} /></MemoryRouter>);
    expect(screen.getByText("results.failed")).toBeInTheDocument();
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
