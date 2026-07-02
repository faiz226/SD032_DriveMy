import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";
import type { QuizSession, Question } from "@/types/quiz";

interface QuizState {
  activeSession: QuizSession | null;
  currentQuestionIndex: number;
  timeRemainingSeconds: number;

  startSession: (session: QuizSession) => void;
  answerQuestion: (questionId: string, selectedIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  tickTimer: () => void;
  endSession: () => void;
  clearSession: () => void;

  // Derived helpers
  getCurrentQuestion: () => Question | null;
  getAnsweredCount: () => number;
  getProgress: () => number;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      currentQuestionIndex: 0,
      timeRemainingSeconds: 0,

      startSession: (session) => {
        set({
          activeSession: session,
          currentQuestionIndex: 0,
          timeRemainingSeconds: session.timeLimitSeconds ?? 0,
        });
      },

      answerQuestion: (questionId, selectedIndex) => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({
          activeSession: {
            ...activeSession,
            answers: {
              ...activeSession.answers,
              [questionId]: selectedIndex,
            },
          },
        });
      },

      nextQuestion: () => {
        const { activeSession, currentQuestionIndex } = get();
        if (!activeSession) return;
        const max = activeSession.questions.length - 1;
        set({ currentQuestionIndex: Math.min(currentQuestionIndex + 1, max) });
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        set({ currentQuestionIndex: Math.max(currentQuestionIndex - 1, 0) });
      },

      goToQuestion: (index) => {
        const { activeSession } = get();
        if (!activeSession) return;
        const clamped = Math.max(0, Math.min(index, activeSession.questions.length - 1));
        set({ currentQuestionIndex: clamped });
      },

      tickTimer: () => {
        const { timeRemainingSeconds } = get();
        if (timeRemainingSeconds > 0) {
          set({ timeRemainingSeconds: timeRemainingSeconds - 1 });
        }
      },

      endSession: () => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({
          activeSession: {
            ...activeSession,
            completedAt: new Date(),
          },
        });
      },

      clearSession: () => {
        set({
          activeSession: null,
          currentQuestionIndex: 0,
          timeRemainingSeconds: 0,
        });
      },

      getCurrentQuestion: () => {
        const { activeSession, currentQuestionIndex } = get();
        return activeSession?.questions[currentQuestionIndex] ?? null;
      },

      getAnsweredCount: () => {
        const { activeSession } = get();
        return Object.keys(activeSession?.answers ?? {}).length;
      },

      getProgress: () => {
        const { activeSession } = get();
        if (!activeSession || activeSession.questions.length === 0) return 0;
        const answered = Object.keys(activeSession.answers).length;
        return (answered / activeSession.questions.length) * 100;
      },
    }),
    {
      name: STORAGE_KEYS.QUIZ_PROGRESS,
      // Only persist the active session — not derived state
      partialize: (state) => ({
        activeSession: state.activeSession,
        currentQuestionIndex: state.currentQuestionIndex,
        timeRemainingSeconds: state.timeRemainingSeconds,
      }),
    }
  )
);
