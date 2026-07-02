import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTheoryProgress, updateTheoryProgress } from "@/services/progress.service";

export function useTheoryProgress(userId: string) {
  return useQuery({
    queryKey: ["progress", "theory", userId],
    queryFn: () => getTheoryProgress(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateTheoryProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTheoryProgress,
    onSuccess: (data) => {
      if (data?.user_id) {
        qc.invalidateQueries({ queryKey: ["progress", "theory", data.user_id] });
      }
    },
  });
}