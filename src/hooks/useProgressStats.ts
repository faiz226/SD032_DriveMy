import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { TOTAL_SIMULATION_MANEUVERS } from "@/lib/constants";
import {
  getQuizStats,
  getMockStats,
  getSimStats,
  getTheoryProgressStats,
} from "@/services/analytics.service";

export function useQuizStats(dateRange?: number) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["progress", "quiz", user?.id, dateRange],
    queryFn: () => getQuizStats(user!.id, dateRange),
    enabled: !!user,
  });
}

export function useMockStats(dateRange?: number) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["progress", "mock", user?.id, dateRange],
    queryFn: () => getMockStats(user!.id, dateRange),
    enabled: !!user,
  });
}

export function useSimStats(dateRange?: number) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["progress", "sim", user?.id, dateRange],
    queryFn: () => getSimStats(user!.id, dateRange),
    enabled: !!user,
  });
}

export function useTheoryProgress() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["progress", "theory", user?.id],
    queryFn: () => getTheoryProgressStats(user!.id),
    enabled: !!user,
  });
}

export function useOverallReadiness() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["progress", "readiness", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");

      const [theory, quiz, mock, sim] = await Promise.all([
        getTheoryProgressStats(user.id),
        getQuizStats(user.id),
        getMockStats(user.id),
        getSimStats(user.id),
      ]);

      const simScore = sim ? (sim.completed / TOTAL_SIMULATION_MANEUVERS) * 100 : 0;
      const quizScore = quiz ? quiz.best : 0;
      const mockScore = mock ? mock.best : 0;
      const theoryScore = theory ? theory.percentage : 0;

      // Weighting rationale.
      //
      // This previously ran sim 0.4 / mock 0.3 / quiz 0.2 / theory 0.1, which
      // had two problems. First, it weighted the optional driving simulator
      // above everything the JPJ KPP1 THEORY exam actually tests. Second — and
      // worse — a learner who scored 100% on every quiz, every mock test and
      // all theory but skipped the simulator topped out at 60, while "Ready for
      // Exam" needs 75. The top rating was mathematically unreachable for
      // anyone not using the simulator, and the simulator is optional.
      //
      // The mock test is the closest proxy for the real exam, so it leads.
      // The simulator now contributes a modest bonus rather than acting as a
      // gate: a fully-prepared learner reaches "Ready for Exam" on theory work
      // alone, and simulator practice pushes them higher still.
      const composite = Math.min(
        Math.max(
          mockScore * 0.45 + quizScore * 0.25 + theoryScore * 0.15 + simScore * 0.15,
          0
        ),
        100
      );

      type ReadinessStatus = "Ready for Exam" | "Getting There" | "Not Ready";
      let status: ReadinessStatus = "Not Ready";
      if (composite >= 75) status = "Ready for Exam";
      else if (composite >= 50) status = "Getting There";

      return {
        theoryPct: theoryScore,
        quizPct: quizScore,
        mockPct: mockScore,
        simPct: simScore,
        composite,
        status,
      };
    },
    enabled: !!user,
  });
}
