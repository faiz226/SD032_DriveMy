import type { Language } from "@/lib/constants";

export interface Question {
  id: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  question: Record<Language, string>;
  options: Record<Language, string[]>;
  correctIndex: number;
  explanation?: Record<Language, string>;
  imageUrl?: string;
  tags: string[];
}

export interface QuizSession {
  id: string;
  mode: "practice" | "exam" | "category";
  category?: string;
  questions: Question[];
  answers: Record<string, number>;   // questionId → selectedIndex
  startedAt: Date;
  completedAt?: Date;
  timeLimitSeconds?: number;
}

export interface QuizResult {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skipped: number;
  score: number;           // percentage 0–100
  passed: boolean;
  timeTakenSeconds: number;
  categoryBreakdown: CategoryScore[];
}

export interface CategoryScore {
  category: string;
  total: number;
  correct: number;
  percentage: number;
}

export type QuizMode = "practice" | "exam" | "category";
export type Difficulty = "easy" | "medium" | "hard";
