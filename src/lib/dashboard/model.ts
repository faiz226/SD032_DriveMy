import { RPK_TOPICS, countRpkCompleted } from "@/content/rpk-rsm";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS } from "@/lib/constants";

/** A bay is never "locked" here: no module has an enforced prerequisite (decision D4). */
export type LearningState = "open" | "progress" | "done";

/** What the learner should do next, in the order the curriculum recommends. */
export type NextStep = "theory" | "mock" | "rpk" | "quiz";

export interface MockAttempt {
  score: number;
  total_questions: number;
}

export interface DashboardInput {
  mock: { count: number; history: MockAttempt[] } | undefined;
  theory: { completedModules: number; totalModules: number; percentage: number; byModule: { module_id: string; completed: boolean }[] } | undefined;
}

export interface DashboardModel {
  rpkDone: number;
  rpkTotal: number;
  /** Best full-length mock. Shorter practice quizzes never stand in for a 50-question result (D11). */
  bestMock: MockAttempt | undefined;
  /** Best mock score minus the pass mark; negative means short of it. */
  headroom: number | undefined;
  next: NextStep;
  /**
   * The KPP 01 bay is the 50-question mock, not the 10-question practice
   * quiz: it is "done" only once a full mock has reached the pass mark.
   */
  bays: { kpp: LearningState; rpk: LearningState; rules: LearningState };
  /** Fractions painted on the in-progress warning diamonds. */
  progressLabels: { kpp?: string; rpk: string; rules?: string };
}

export function bestFullMock(history: MockAttempt[]): MockAttempt | undefined {
  return history
    .filter(row => row.total_questions === MOCK_TOTAL_QUESTIONS && Number.isFinite(row.score) && row.score >= 0 && row.score <= MOCK_TOTAL_QUESTIONS)
    .reduce<MockAttempt | undefined>((best, row) => (!best || row.score > best.score ? row : best), undefined);
}

export function dashboardModel({ mock, theory }: DashboardInput): DashboardModel {
  const rpkDone = countRpkCompleted(theory?.byModule ?? []);
  const rpkTotal = RPK_TOPICS.length;
  const bestMock = bestFullMock(mock?.history ?? []);
  const next: NextStep = !theory?.completedModules ? "theory" : !mock?.count ? "mock" : rpkDone < rpkTotal ? "rpk" : "quiz";
  return {
    rpkDone,
    rpkTotal,
    bestMock,
    headroom: bestMock ? bestMock.score - MOCK_PASS_MARK : undefined,
    next,
    bays: {
      kpp: bestMock && bestMock.score >= MOCK_PASS_MARK ? "done" : mock?.count ? "progress" : "open",
      rpk: rpkDone === rpkTotal ? "done" : rpkDone ? "progress" : "open",
      rules: theory?.percentage === 100 ? "done" : theory?.completedModules ? "progress" : "open",
    },
    progressLabels: {
      kpp: bestMock ? `${bestMock.score}/${MOCK_TOTAL_QUESTIONS}` : undefined,
      rpk: `${rpkDone}/${rpkTotal}`,
      rules: theory ? `${theory.completedModules}/${theory.totalModules}` : undefined,
    },
  };
}
