/**
 * One query that answers "where does this learner stand?" — marks, licences
 * held, and which circuit maneuvers are open.
 *
 * The dashboard, the simulator gate, and the progress page all read this, so
 * they cannot drift apart. The arithmetic itself lives in `lib/licence.ts` and
 * is pure; this hook only fetches.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  getBestQuizScore,
  getBestMockTestScore,
  getSimStats,
  getTheoryProgressStats,
} from "@/services/analytics.service";
import { resolveLicence, type LicenceStanding } from "@/lib/licence";

export function useLicence() {
  const { user } = useAuthStore();

  return useQuery<LicenceStanding>({
    queryKey: ["licence", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user");

      const [theory, quizBest, mockBest, sim] = await Promise.all([
        getTheoryProgressStats(user.id),
        getBestQuizScore(user.id),
        getBestMockTestScore(user.id),
        getSimStats(user.id),
      ]);

      const maneuverScores: Record<string, number> = {};
      for (const row of sim.byManeuver) {
        if (row.maneuver) maneuverScores[row.maneuver] = row.bestScore;
      }

      return resolveLicence({
        theoryModules: theory.completedModules,
        quizBest,
        mockBest,
        maneuverScores,
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
