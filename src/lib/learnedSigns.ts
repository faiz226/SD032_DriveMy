// Which road signs a learner has learnt (the star on a card, and the mini quizzes). Kept per signed-in user, so on a
// shared device one learner's progress never shows as another's.

export const LEARNED_STORAGE_KEY = "drivemy_theory_learned_signs_v2";

export type LearnedSigns = Record<string, boolean>;

export const learnedKeyFor = (userId: string | undefined): string => (userId ? `${LEARNED_STORAGE_KEY}:${userId}` : LEARNED_STORAGE_KEY);

function parse(raw: string | null): LearnedSigns {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, v]) => v === true)) as LearnedSigns;
  } catch {
    return {};
  }
}

/**
 * A signed-in learner's record. The older single shared record is handed to the FIRST learner who opens the page
 * after the update and then removed, so a second learner on the same device starts empty instead of inheriting it.
 */
export function readLearned(userId: string | undefined, storage: Pick<Storage, "getItem" | "removeItem" | "setItem"> = localStorage): LearnedSigns {
  try {
    const own = storage.getItem(learnedKeyFor(userId));
    if (own !== null || !userId) return parse(own ?? storage.getItem(LEARNED_STORAGE_KEY));
    const legacy = storage.getItem(LEARNED_STORAGE_KEY);
    if (legacy === null) return {};
    const adopted = parse(legacy);
    storage.setItem(learnedKeyFor(userId), JSON.stringify(adopted));
    storage.removeItem(LEARNED_STORAGE_KEY);
    return adopted;
  } catch {
    return {};
  }
}
