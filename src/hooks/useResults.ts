import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  saveQuizResult,
  saveMockResult,
  saveSimulationResult,
  saveColorblindResult,
} from "@/services/results.service";
import { useLanguageStore } from "@/stores/languageStore";

/**
 * Result-saving mutations.
 *
 * saveResult() now THROWS on permanent failures (RLS denial, constraint
 * violation, 4xx) instead of quietly queueing them behind a success marker.
 * Every mutation therefore needs an onError, or the learner is told nothing
 * when their attempt genuinely fails to save.
 */
function useSaveResultMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>
) {
  return useMutation({
    mutationFn,
    onError: (error) => {
      console.error("[results] save failed", error);
      toast.error(useLanguageStore.getState().t("common.error"));
    },
  });
}

export function useSaveQuizResult() {
  return useSaveResultMutation(saveQuizResult);
}

export function useSaveMockResult() {
  return useSaveResultMutation(saveMockResult);
}

export function useSaveSimulationResult() {
  return useSaveResultMutation(saveSimulationResult);
}

export function useSaveColorblindResult() {
  return useSaveResultMutation(saveColorblindResult);
}
