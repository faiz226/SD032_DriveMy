export const READINESS_WEIGHTS = { mock: .45, quiz: .25, theory: .15, sim: .15 } as const;

export function readinessContributions(scores: Record<keyof typeof READINESS_WEIGHTS, number>) {
  return Object.fromEntries(Object.entries(READINESS_WEIGHTS).map(([key, weight]) => [key,
    Math.min(100, Math.max(0, Number.isFinite(scores[key as keyof typeof scores]) ? scores[key as keyof typeof scores] : 0)) * weight,
  ])) as Record<keyof typeof READINESS_WEIGHTS, number>;
}

export function calculateReadiness(scores: Record<keyof typeof READINESS_WEIGHTS, number>) {
  return Object.values(readinessContributions(scores)).reduce((sum, value) => sum + value, 0);
}
