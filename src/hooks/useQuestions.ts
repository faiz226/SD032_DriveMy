import { useQuery } from "@tanstack/react-query";
import {
  fetchQuizQuestions,
  fetchMockQuestionsBySet,
  fetchQuestionsByCategory,
  fetchCategories,
  fetchAvailableSets,
} from "@/services/questions.service";
import { QUERY_KEYS, QUESTIONS_BY_SET, QUESTIONS_BY_CATEGORY } from "@/lib/constants";

export function useQuizQuestions({
  category,
  limit = 20,
  enabled = true,
}: {
  category?: string;
  limit?: number;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: category
      ? QUESTIONS_BY_CATEGORY(category)
      : [...QUERY_KEYS.QUESTIONS, "quiz", limit],
    queryFn: () => fetchQuizQuestions({ category, limit }),
    enabled,
    staleTime: 1000 * 60 * 60,
  });
}

export function useMockQuestions(setId: string, enabled = true) {
  return useQuery({
    queryKey: QUESTIONS_BY_SET(setId),
    queryFn: () => fetchMockQuestionsBySet(setId),
    enabled: enabled && setId.length > 0,
    staleTime: 1000 * 60 * 60,
  });
}

export function useQuestionsByCategory(category: string, enabled = true) {
  return useQuery({
    queryKey: QUESTIONS_BY_CATEGORY(category),
    queryFn: () => fetchQuestionsByCategory(category),
    enabled: enabled && category.length > 0,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useAvailableSets() {
  return useQuery({
    queryKey: QUERY_KEYS.SETS,
    queryFn: fetchAvailableSets,
    staleTime: 1000 * 60 * 60 * 24,
  });
}