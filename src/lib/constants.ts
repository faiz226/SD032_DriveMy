export type Language = "en" | "ms";
export type Theme = "dark" | "light" | "system";

export const ROUTES = {
  DASHBOARD: "/",
  THEORY: "/theory",
  QUIZ: "/quizzes",
  MOCK_TEST: "/mock-test",
  COLOR_VISION: "/color-vision",
  SIMULATIONS: "/simulations",
  PROGRESS: "/progress",
  SAFETY: "/safety",
  RPK_RSM: "/rpk-rsm",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  AUTH: "/auth",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  MFA: "/mfa",
  PRIVACY: "/privacy",
} as const;

/**
 * Contact address for the privacy notice, or null while there is none.
 *
 * The notice used to print privacy@drivemy.local, a reserved domain that never delivers mail, so learners were
 * shown a contact that could not reach anyone. Set a real, monitored inbox here and the notice shows a contact
 * section again; until then it points people to the self-service tools in Settings.
 */
export const PRIVACY_CONTACT_EMAIL: string | null = null;

export const STORAGE_KEYS = {
  QUIZ_PROGRESS: "drivemy-quiz-progress",
} as const;

export const QUERY_KEYS = {
  QUESTIONS: ["questions"] as const,
  CATEGORIES: ["questions", "categories"] as const,
  SETS: ["questions", "sets"] as const,
} as const;

export const QUESTIONS_BY_SET = (setId: string) => [...QUERY_KEYS.QUESTIONS, "set", setId] as const;
export const QUESTIONS_BY_CATEGORY = (category: string) => [...QUERY_KEYS.QUESTIONS, "category", category] as const;

// ── Exam configuration ────────────────────────────────────────────────────────
export const QUIZ_QUESTION_COUNT = 10;
export const MOCK_TIME_LIMIT = 4500;             // 75 minutes in seconds
export const MOCK_PASS_MARK = 56;
export const MOCK_TOTAL_QUESTIONS = 70;
export const LEGACY_MOCK_TOTAL = 50;
export const LEGACY_MOCK_PASS_MARK = 42;
export const LEGACY_MOCK_TIME_LIMIT = 45 * 60;

export function mockPassMark(total: number): number {
  return total === LEGACY_MOCK_TOTAL ? LEGACY_MOCK_PASS_MARK : MOCK_PASS_MARK;
}

export const MOCK_WARNING_TIME = 300;            // 5 minutes in seconds

// ── Simulation configuration ──────────────────────────────────────────────────
/** The simulator's seven JPJ circuit stations, as in docs/v2-plan/rules.json (constants.test.ts checks it). */
export const SIM_STATIONS = ["hill-start", "side-parking", "parallel-parking", "s-curve", "z-curve", "ramp-test", "road-merging"] as const;
export const TOTAL_SIMULATION_MANEUVERS = SIM_STATIONS.length;