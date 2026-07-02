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
  PROFILE: "/profile",
  SETTINGS: "/settings",
  AUTH: "/auth",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
} as const;

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
export const MOCK_TIME_LIMIT = 2700;             // 45 minutes in seconds
export const MOCK_PASS_MARK = 42;
export const MOCK_TOTAL_QUESTIONS = 50;
export const MOCK_WARNING_TIME = 300;            // 5 minutes in seconds

// ── Simulation configuration ──────────────────────────────────────────────────
export const TOTAL_SIMULATION_MANEUVERS = 8;