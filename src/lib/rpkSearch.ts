import { RPK_TOPICS } from "@/content/rpk-rsm";

export interface RpkHit {
  topicId: string;
  routine: "rpk" | "rsm";
  title: { en: string; ms: string };
  /** Counting from 0. */
  step: number;
  text: { en: string; ms: string };
}

/**
 * Finds the vehicle-check (RPK) and before-you-drive (RSM) steps that a Learn search is really after, in either
 * language: "brake fluid" finds RPK, Engine bay, step 7. Every word typed must be in the step or its part's name.
 */
export function searchRpk(query: string, limit = 8): RpkHit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (query.trim().length < 3) return [];
  const phrase = query.trim().toLowerCase();
  const hits: (RpkHit & { rank: number })[] = [];
  for (const topic of RPK_TOPICS) {
    topic.steps.en.forEach((en, step) => {
      const ms = topic.steps.ms[step] ?? "";
      const own = `${en} ${ms}`.toLowerCase();
      const all = `${own} ${topic.title.en} ${topic.title.ms}`.toLowerCase();
      if (!words.every((word) => all.includes(word))) return;
      hits.push({ topicId: topic.id, routine: topic.routine, title: topic.title, step, text: { en, ms }, rank: own.includes(phrase) ? 0 : 1 });
    });
  }
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit).map(({ rank: _rank, ...hit }) => hit);
}
