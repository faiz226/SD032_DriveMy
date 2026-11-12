import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const query = <T,>(data: T) => ({ data, isPending: false, isError: false, refetch: vi.fn() });

vi.mock("@/hooks/useProgressStats", () => ({
  useOverallReadiness: () => query({ theoryPct: 33, quizPct: 90, mockPct: 86, simPct: 71, composite: 77, status: "Ready for Exam" }),
  useMockStats: () => query({
    best: 86, average: 80, count: 3, passRate: 67, totalDuration: 10400,
    trend: [],
    history: [
      { id: "old", set_id: "mock-1", score: 41, total_questions: 50, percentage: 82, passed: false, duration_seconds: 2400, completed_at: "2026-10-01T10:00:00Z" },
      { id: "new", set_id: "mock-da-combined-2", score: 57, total_questions: 70, percentage: 81.43, passed: true, duration_seconds: 4100, completed_at: "2026-11-05T10:00:00Z" },
    ],
  }),
  useQuizStats: () => query({
    best: 90, average: 75, count: 4, totalDuration: 1230, trend: [],
    history: [],
    categoryPerformance: [
      { category: "road-signs", averageScore: 85, attempts: 2 },
      { category: "traffic-rules", averageScore: 60, attempts: 1 },
      { category: "safety-principles", averageScore: 70, attempts: 1 },
    ],
  }),
  useSimStats: () => query({ completed: 7, cleared: 5, averageScore: 71, byManeuver: [], totalDuration: 600, history: [] }),
  useTheoryProgressStats: () => query({ completedModules: 1, totalModules: 3, percentage: 33, byModule: [{ module_id: "rpk-exterior", completed: true }] }),
  useBestColorVisionScore: () => query(null),
}));

// The charts draw with SVG measurement jsdom does not have; their own tests cover them.
vi.mock("@/components/progress/ReadinessDonut", () => ({ ReadinessDonut: () => null }));
vi.mock("@/components/progress/ScoreTrendChart", () => ({ ScoreTrendChart: () => null }));
vi.mock("@/components/progress/CategoryBreakdownBar", () => ({ CategoryBreakdownBar: () => null }));
vi.mock("@/components/progress/ManeuverScoresBar", () => ({ ManeuverScoresBar: () => null }));

import { ProgressPage } from "./ProgressPage";

const view = () => render(<MemoryRouter><ProgressPage /></MemoryRouter>);

describe("My progress", () => {
  it("marks each mock against its own format's pass mark", () => {
    view();
    const newMock = screen.getByText("Mock test 2, class DA").closest("li")!;
    expect(within(newMock).getByText("57 / 70")).toBeInTheDocument();
    expect(within(newMock).getByText(/pass mark 56/)).toBeInTheDocument();
    expect(within(newMock).getByText("Pass")).toBeInTheDocument();

    // 41 of 50 is 82%: above 80% but below the old format's 42, so it failed.
    const oldMock = screen.getByText("Mock test, old 50-question format").closest("li")!;
    expect(within(oldMock).getByText(/pass mark 42/)).toBeInTheDocument();
    expect(within(oldMock).getByText("Fail")).toBeInTheDocument();
  });

  it("counts the seven simulator stations, cleared ones only", () => {
    view();
    const sim = screen.getByText("Simulator stations").closest("a")!;
    expect(within(sim).getByText("5 / 7")).toBeInTheDocument();
  });

  it("names the weakest quiz topic and counts all six RPK / RSM parts", () => {
    view();
    expect(screen.getByText("Average of 4 quizzes. Weakest topic: Traffic rules, 60%.")).toBeInTheDocument();
    expect(within(screen.getByText("RPK / RSM").closest("a")!).getByText("1 / 6")).toBeInTheDocument();
    expect(within(screen.getByText("Colour test").closest("a")!).getByText("Not taken")).toBeInTheDocument();
  });
});
