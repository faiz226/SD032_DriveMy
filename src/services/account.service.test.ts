import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetProgress } from "./account.service";
import { supabase } from "@/lib/supabase";
import { clearUserResultsQueue } from "./results.service";

const deleted: string[] = [];
const failing = new Set<string>();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      delete: () => ({
        eq: () => {
          deleted.push(table);
          return Promise.resolve({ error: failing.has(table) ? new Error(`${table} refused`) : null });
        },
      }),
    })),
  },
}));

vi.mock("./results.service", () => ({
  clearUserResultsQueue: vi.fn().mockResolvedValue(undefined),
  markUserDeleted: vi.fn(),
}));

describe("resetProgress", () => {
  beforeEach(() => {
    deleted.length = 0;
    failing.clear();
    vi.clearAllMocks();
  });

  it("clears only this learner's queues before deleting every progress table", async () => {
    await resetProgress("user-1");
    expect(clearUserResultsQueue).toHaveBeenCalledWith("user-1");
    expect(vi.mocked(clearUserResultsQueue).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(supabase.from).mock.invocationCallOrder[0]);
    expect(deleted.sort()).toEqual(["colorblind_results", "mock_test_results", "quiz_results", "simulation_results", "theory_progress"]);
  });

  it("throws when any delete reports an error instead of claiming success", async () => {
    failing.add("mock_test_results");
    await expect(resetProgress("user-1")).rejects.toThrow("mock_test_results refused");
  });
});
