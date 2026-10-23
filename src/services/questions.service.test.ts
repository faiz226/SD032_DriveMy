import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchQuizQuestions,
  fetchMockQuestionsBySet,
  fetchMockAnswerKey,
  fetchCategories,
} from "./questions.service";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

describe("questions.service - W02 remediation (SEC-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchMockQuestionsBySet excludes answer keys and explanations from query projection", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "q1",
              category: "signs",
              set_id: "mock-1",
              order_index: 0,
              question_en: "Question 1",
              question_ms: "Soalan 1",
              options_en: ["A", "B"],
              options_ms: ["A", "B"],
            },
          ],
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

    const questions = await fetchMockQuestionsBySet("mock-1");

    expect(supabase.from).toHaveBeenCalledWith("kpp_questions");
    const projectedColumns = mockSelect.mock.calls[0][0];
    expect(projectedColumns).not.toContain("correct_index");
    expect(projectedColumns).not.toContain("explanation_en");
    expect(projectedColumns).not.toContain("explanation_ms");
    expect(questions).toHaveLength(1);
    expect(questions[0].correct_index).toBeUndefined();
  });

  it("fetchQuizQuestions queries secure practice view for immediate feedback", async () => {
    const mockPracticeSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: "quiz-q1",
              category: "rules",
              set_id: "quiz-pool",
              correct_index: 2,
              explanation_en: "Rule explanation",
            },
          ],
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({ select: mockPracticeSelect } as never);

    const questions = await fetchQuizQuestions({ limit: 10 });

    expect(supabase.from).toHaveBeenCalledWith("kpp_practice_questions");
    expect(questions).toHaveLength(1);
    expect(questions[0].correct_index).toBe(2);
  });

  it("fetchMockAnswerKey invokes get_mock_test_answer_key RPC when attempt ID is provided", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          id: "q1",
          correct_index: 1,
          explanation_en: "Explanation",
          explanation_ms: "Penerangan",
        },
      ],
      error: null,
    } as never);

    const key = await fetchMockAnswerKey("attempt-uuid-123");

    expect(supabase.rpc).toHaveBeenCalledWith("get_mock_test_answer_key", {
      p_test_result_id: "attempt-uuid-123",
    });
    expect(key).toHaveLength(1);
    expect(key[0].correct_index).toBe(1);
  });

  it("rejects an absent or queued attempt without querying answer columns", async () => {
    await expect(fetchMockAnswerKey("")).rejects.toThrow("saved result ID");
    await expect(fetchMockAnswerKey("offline-queued")).rejects.toThrow("saved result ID");
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("surfaces an RPC denial without a direct-table fallback", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: "access denied" } } as never);
    await expect(fetchMockAnswerKey("other-attempt")).rejects.toThrow("access denied");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("keeps an empty practice pool empty without a base-table fallback", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue({ select: () => ({ order: () => ({ limit }) }) } as never);
    expect(await fetchQuizQuestions({})).toEqual([]);
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith("kpp_practice_questions");
  });

  it("fetchCategories queries distinct categories cleanly", async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ category: "signs" }, { category: "rules" }, { category: "signs" }],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never);

    const categories = await fetchCategories();
    expect(categories).toEqual(["rules", "signs"]);
  });
});
