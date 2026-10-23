import { describe, expect, it } from "vitest";
import { RPK_TOPICS } from "@/content/rpk-rsm";
import { bestFullMock, dashboardModel } from "./model";

const theory = (completedModules: number, percentage: number, ids: string[] = []) => ({
  completedModules,
  totalModules: 3,
  percentage,
  byModule: ids.map(module_id => ({ module_id, completed: true })),
});
const allRpk = RPK_TOPICS.map(topic => topic.id);
const mocks = (...scores: number[]) => ({ count: scores.length, history: scores.map(score => ({ score, total_questions: 50 })) });

describe("dashboardModel", () => {
  it("starts a new learner on theory with every bay open", () => {
    const model = dashboardModel({ mock: undefined, theory: undefined });
    expect(model.next).toBe("theory");
    expect(model.bays).toEqual({ kpp: "open", rpk: "open", rules: "open" });
    expect(model.bestMock).toBeUndefined();
    expect(model.headroom).toBeUndefined();
  });

  it("walks the recommended order: theory, mock, RPK/RSM, then quizzes", () => {
    expect(dashboardModel({ mock: { count: 0, history: [] }, theory: theory(1, 33) }).next).toBe("mock");
    expect(dashboardModel({ mock: mocks(30), theory: theory(1, 33) }).next).toBe("rpk");
    expect(dashboardModel({ mock: mocks(30), theory: theory(1, 33, allRpk) }).next).toBe("quiz");
  });

  it("marks the KPP 01 bay done only when a full mock reaches the pass mark", () => {
    expect(dashboardModel({ mock: mocks(41), theory: undefined }).bays.kpp).toBe("progress");
    expect(dashboardModel({ mock: mocks(41, 42), theory: undefined }).bays.kpp).toBe("done");
    // Ten-question practice runs never count as a KPP 01 result.
    expect(dashboardModel({ mock: { count: 1, history: [{ score: 10, total_questions: 10 }] }, theory: undefined }).bays.kpp).toBe("progress");
  });

  it("derives the other bays and their fractions from real completion only", () => {
    const partial = dashboardModel({ mock: undefined, theory: theory(1, 33, allRpk.slice(0, 2)) });
    expect(partial.bays).toEqual({ kpp: "open", rpk: "progress", rules: "progress" });
    expect(partial.progressLabels).toEqual({ kpp: undefined, rpk: `2/${allRpk.length}`, rules: "1/3" });
    const finished = dashboardModel({ mock: mocks(46), theory: theory(3, 100, allRpk) });
    expect(finished.bays).toEqual({ kpp: "done", rpk: "done", rules: "done" });
    expect(finished.progressLabels.kpp).toBe("46/50");
  });

  it("reports headroom against the 42/50 pass mark, negative when short", () => {
    expect(dashboardModel({ mock: mocks(46), theory: undefined }).headroom).toBe(4);
    expect(dashboardModel({ mock: mocks(38), theory: undefined }).headroom).toBe(-4);
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
