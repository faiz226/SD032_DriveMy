import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTheoryProgress, updateTheoryProgress } from "@/services/progress.service";
import { learnerKeys, invalidateLearnerData } from "@/lib/queryKeys";

export function useTheoryProgress(userId: string) {
  return useQuery({
    queryKey: learnerKeys.theoryRows(userId),
    queryFn: () => getTheoryProgress(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateTheoryProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTheoryProgress,
    onSuccess: () => invalidateLearnerData(qc),
  });
}
