import { useMutation } from "@tanstack/react-query";
import {
  saveQuizResult,
  saveMockResult,
  saveSimulationResult,
  saveColorblindResult,
} from "@/services/results.service";

export function useSaveQuizResult() {
  return useMutation({ mutationFn: saveQuizResult });
}

export function useSaveMockResult() {
  return useMutation({ mutationFn: saveMockResult });
}

export function useSaveSimulationResult() {
  return useMutation({ mutationFn: saveSimulationResult });
}

export function useSaveColorblindResult() {
  return useMutation({ mutationFn: saveColorblindResult });
}