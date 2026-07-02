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

      const [quiz, mock, sim] = await Promise.all([
        getQuizStats(user.id),
        getMockStats(user.id),
        getSimStats(user.id),
      ]);

      const simScore = sim ? (sim.completed / TOTAL_SIMULATION_MANEUVERS) * 100 : 0;
      const quizScore = quiz ? quiz.best : 0;
      const mockScore = mock ? mock.best : 0;

      const composite = Math.min(Math.max(
        simScore * 0.4 + quizScore * 0.3 + mockScore * 0.3,
        0
      ), 100);

      type ReadinessStatus = "Ready for Exam" | "Getting There" | "Not Ready";
      let status: ReadinessStatus = "Not Ready";
      if (composite >= 75) status = "Ready for Exam";
      else if (composite >= 50) status = "Getting There";

      return {
        theoryPct: quizScore,
        mockPct: mockScore,
        simPct: simScore,
        composite,
        status,
      };
    },
    enabled: !!user,
  });
}
