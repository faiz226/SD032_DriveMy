import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OFFLINE_QUEUED_ID } from "@/services/results.service";
import { invalidateLearnerData } from "@/lib/queryKeys";
import { useLanguageStore } from "@/stores/languageStore";
import type { TranslationKey } from "@/lib/translations/en";

/**
 * Shared mutation for saving learner results (quiz, mock test, colour vision).
 *
 * Checks OFFLINE_QUEUED_ID so offline-queued attempts do not toast premature
 * server confirmation or trigger redundant refetches, invalidates cached
 * learner data on online saves, and surfaces permanent save failures via toast.
 */
export function useSaveResultMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  options?: {
    successToastKey?: TranslationKey;
    errorToastKey?: TranslationKey;
  }
) {
  const queryClient = useQueryClient();
  const successKey = options?.successToastKey ?? "exam.saved";
  const errorKey = options?.errorToastKey ?? "common.error";

  return useMutation({
    mutationFn,
    onSuccess: (saved) => {
      if ((saved as { id?: string } | null)?.id === OFFLINE_QUEUED_ID) return;
      toast.success(useLanguageStore.getState().t(successKey));
      void invalidateLearnerData(queryClient);
    },
    onError: (error) => {
      console.error("[results] save failed", error);
      toast.error(useLanguageStore.getState().t(errorKey));
    },
  });
}
