import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MockTestPage } from "./MockTestPage";
import { saveMockResult } from "@/services/results.service";
import { fetchMockAnswerKey } from "@/services/questions.service";
import { toast } from "sonner";

const { attempt, question } = vi.hoisted(() => {
  const question = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", category: "rules", set_id: "mock-1",
    options_en: ["A", "B", "C", "D"], options_ms: ["A", "B", "C", "D"] };
  return { question, attempt: { questions: [question], answers: { [question.id]: 0 },
    answersForStorage: { [question.id]: 2 }, permutations: { [question.id]: [2, 0, 1, 3] },
    score: 0, total: 1, percentage: 0, durationSeconds: 30 } };
});
vi.mock("@/services/results.service", () => ({ saveMockResult: vi.fn(), OFFLINE_QUEUED_ID: "offline-queued" }));
vi.mock("@/services/questions.service", () => ({ fetchMockAnswerKey: vi.fn(), fetchMockQuestionsBySet: vi.fn(async () => [question]) }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: () => ({ user: { id: "dummy-user" } }) }));
vi.mock("@/hooks/useLanguage", () => ({ useLanguage: () => ({ t: (key: string) => key, language: "en" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock("@/components/exam/TestLaunchPanel", () => ({ TestLaunchPanel: ({ onStart }: { onStart: (args: object) => void }) =>
  <button onClick={() => onStart({ language: "en", setId: "mock-1" })}>Start</button> }));
vi.mock("@/components/exam/ExamShell", () => ({ ExamShell: ({ onComplete }: { onComplete: (args: object) => void }) =>
  <button onClick={() => onComplete(attempt)}>Submit</button> }));
vi.mock("@/components/exam/TestResultsView", () => ({ TestResultsView: ({ result }: { result: { score: number; total: number; questions: unknown[] } }) =>
  <div data-testid="grade">{result.score}/{result.total};review={result.questions.length}</div> }));

async function submit() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <MockTestPage />
  </QueryClientProvider>);
  fireEvent.click(screen.getByText("Start"));
  fireEvent.click(await screen.findByText("Submit"));
}

describe("actual mock completion flow", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(saveMockResult).mockResolvedValue({ id: "saved-attempt", score: 42, total_questions: 50, percentage: 84 } as never);
    vi.mocked(fetchMockAnswerKey).mockResolvedValue([{ id: question.id, correct_index: 2, explanation_en: null, explanation_ms: null }]);
  });
  it("saves original-order answers first, gates review by returned ID and displays the server grade", async () => {
    await submit();
    expect(await screen.findByTestId("grade")).toHaveTextContent("42/50;review=1");
    expect(vi.mocked(saveMockResult).mock.calls[0][0]).toEqual(expect.objectContaining({ answers: attempt.answersForStorage, score: 0 }));
    expect(fetchMockAnswerKey).toHaveBeenCalledWith("saved-attempt");
    expect(vi.mocked(saveMockResult).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(fetchMockAnswerKey).mock.invocationCallOrder[0]);
  });
  it("does not claim a queued result is graded or remotely saved", async () => {
    vi.mocked(saveMockResult).mockResolvedValue({ id: "offline-queued" } as never);
    await submit();
    expect(await screen.findByText("exam.queuedUngraded")).toBeInTheDocument();
    expect(fetchMockAnswerKey).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.queryByTestId("grade")).not.toBeInTheDocument();
  });
  it("keeps failed submissions ungraded and allows saving the same answers again", async () => {
    vi.mocked(saveMockResult).mockRejectedValueOnce(new Error("permission denied"));
    await submit();
    expect(await screen.findByText("exam.saveFailedUngraded")).toBeInTheDocument();
    expect(fetchMockAnswerKey).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("exam.retrySave"));
    expect(await screen.findByTestId("grade")).toHaveTextContent("42/50");
    expect(saveMockResult).toHaveBeenCalledTimes(2);
  });
  it.each(["denied", "empty"])("retains authoritative grading when review is %s", async (kind) => {
    if (kind === "denied") vi.mocked(fetchMockAnswerKey).mockRejectedValueOnce(new Error("denied"));
    else vi.mocked(fetchMockAnswerKey).mockResolvedValueOnce([]);
    await submit();
    expect(await screen.findByTestId("grade")).toHaveTextContent("42/50;review=0");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("exam.reviewUnavailable"));
  });
});
