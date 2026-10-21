import { describe, expect, it } from "vitest";
import { RPK_TOPICS } from "@/content/rpk-rsm";
import { bestFullMock, dashboardModel } from "./model";

const theory = (completedModules: number, percentage: number, ids: string[] = []) => ({
  completedModules,
  percentage,
  byModule: ids.map(module_id => ({ module_id, completed: true })),
});
const allRpk = RPK_TOPICS.map(topic => topic.id);

describe("dashboardModel", () => {
  it("starts a new learner on theory with every bay open", () => {
    const model = dashboardModel({ quizPct: 0, mock: undefined, theory: undefined });
    expect(model.next).toBe("theory");
    expect(model.bays).toEqual({ quiz: "open", rpk: "open", rules: "open" });
    expect(model.bestMock).toBeUndefined();
    expect(model.headroom).toBeUndefined();
  });

  it("walks the recommended order: theory, mock, RPK/RSM, then quizzes", () => {
    expect(dashboardModel({ quizPct: 0, mock: { count: 0, history: [] }, theory: theory(1, 33) }).next).toBe("mock");
    expect(dashboardModel({ quizPct: 0, mock: { count: 1, history: [] }, theory: theory(1, 33) }).next).toBe("rpk");
    expect(dashboardModel({ quizPct: 0, mock: { count: 1, history: [] }, theory: theory(1, 33, allRpk) }).next).toBe("quiz");
  });

  it("derives bay states from real completion only", () => {
    const partial = dashboardModel({ quizPct: 40, mock: undefined, theory: theory(1, 33, allRpk.slice(0, 2)) });
    expect(partial.bays).toEqual({ quiz: "progress", rpk: "progress", rules: "progress" });
    expect(partial.rpkDone).toBe(2);
    const finished = dashboardModel({ quizPct: 40, mock: undefined, theory: theory(3, 100, allRpk) });
    expect(finished.bays.rpk).toBe("done");
    expect(finished.bays.rules).toBe("done");
  });

  it("reports headroom against the 42/50 pass mark, negative when short", () => {
    expect(dashboardModel({ quizPct: 0, mock: { count: 1, history: [{ score: 46, total_questions: 50 }] }, theory: undefined }).headroom).toBe(4);
    expect(dashboardModel({ quizPct: 0, mock: { count: 1, history: [{ score: 38, total_questions: 50 }] }, theory: undefined }).headroom).toBe(-4);
  });
});

describe("bestFullMock", () => {
  it("ignores short practice runs and impossible scores", () => {
    expect(bestFullMock([
      { score: 10, total_questions: 10 },
      { score: 51, total_questions: 50 },
      { score: Number.NaN, total_questions: 50 },
      { score: 40, total_questions: 50 },
      { score: 44, total_questions: 50 },
    ])).toEqual({ score: 44, total_questions: 50 });
  });
});
