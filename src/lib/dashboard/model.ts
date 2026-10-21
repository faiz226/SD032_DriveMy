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
  quizPct: number;
  mock: { count: number; history: MockAttempt[] } | undefined;
  theory: { completedModules: number; percentage: number; byModule: { module_id: string; completed: boolean }[] } | undefined;
}

export interface DashboardModel {
  rpkDone: number;
  rpkTotal: number;
  /** Best full-length mock. Shorter practice quizzes never stand in for a 50-question result (D11). */
  bestMock: MockAttempt | undefined;
  /** Best mock score minus the pass mark; negative means short of it. */
  headroom: number | undefined;
  next: NextStep;
  bays: { quiz: LearningState; rpk: LearningState; rules: LearningState };
}

export function bestFullMock(history: MockAttempt[]): MockAttempt | undefined {
  return history
    .filter(row => row.total_questions === MOCK_TOTAL_QUESTIONS && Number.isFinite(row.score) && row.score >= 0 && row.score <= MOCK_TOTAL_QUESTIONS)
    .reduce<MockAttempt | undefined>((best, row) => (!best || row.score > best.score ? row : best), undefined);
}

export function dashboardModel({ quizPct, mock, theory }: DashboardInput): DashboardModel {
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
      quiz: quizPct > 0 ? "progress" : "open",
      rpk: rpkDone === rpkTotal ? "done" : rpkDone ? "progress" : "open",
      rules: theory?.percentage === 100 ? "done" : theory?.completedModules ? "progress" : "open",
    },
  };
}
