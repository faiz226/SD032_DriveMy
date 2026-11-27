import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OFFLINE_QUEUED_ID } from "@/services/results.service";
import { isRowLimitError } from "@/services/offlineQueue";
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
    // Run while offline too: saveResult then queues the attempt on the device. The default ("online") pauses the
    // mutation until the connection returns, which left a learner who submitted offline on an endless spinner.
    networkMode: "always",
    onSuccess: (saved) => {
      if ((saved as { id?: string } | null)?.id === OFFLINE_QUEUED_ID) return;
      toast.success(useLanguageStore.getState().t(successKey));
      void invalidateLearnerData(queryClient);
    },
    onError: (error) => {
      console.error("[results] save failed", error);
      const t = useLanguageStore.getState().t;
      // A daily or lifetime row limit is not a fault: say so calmly, not "something went wrong".
      if (isRowLimitError(error)) toast(t("exam.limitReached"));
      else toast.error(t(errorKey));
    },
  });
}
