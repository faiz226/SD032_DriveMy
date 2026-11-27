// Mini quizzes for the road-sign categories. A sign answered right is "learnt" and leaves the pool; a sign answered
// wrong stays in the pool and comes back in a later round. A category is learnt when its pool is empty.
// "Learnt" is the same record the star on each sign card uses, so the two always agree.

export type LearntMap = Record<string, boolean>;

const BIG_ROUND = 12;
const ONE_ROUND_UP_TO = 14;

/** About 8 to 12 questions a round: a small pool is one round, a bigger one is split into near-equal rounds. */
export function roundSize(poolSize: number): number {
  if (poolSize <= ONE_ROUND_UP_TO) return poolSize;
  const rounds = Math.ceil(poolSize / BIG_ROUND);
  return Math.ceil(poolSize / rounds);
}

/** The signs of a category that are not learnt yet. */
export function poolOf(ids: string[], learnt: LearntMap): string[] {
  return ids.filter((id) => !learnt[id]);
}

/** Pick this round's questions from the pool, in a shuffled order. `rand` is injectable for tests. */
export function pickRound(pool: string[], rand: () => number = Math.random): string[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, roundSize(pool.length));
}

/** Right answers leave the pool (learnt); wrong answers leave the sign where it is, so it returns next round. */
export function recordAnswer(learnt: LearntMap, id: string, correct: boolean): LearntMap {
  if (!correct || learnt[id]) return learnt;
  return { ...learnt, [id]: true };
}

export interface CategoryProgress {
  total: number;
  learnt: number;
  left: number;
  done: boolean;
}

export function categoryProgress(ids: string[], learnt: LearntMap): CategoryProgress {
  const learntCount = ids.filter((id) => learnt[id]).length;
  return { total: ids.length, learnt: learntCount, left: ids.length - learntCount, done: ids.length > 0 && learntCount === ids.length };
}

/** Four answer pictures: the right one and three others, from the same category first so they look alike. */
export function pickOptions(
  correctId: string,
  sameCategory: string[],
  everyone: string[],
  rand: () => number = Math.random,
): string[] {
  const take = (from: string[], count: number, taken: Set<string>) => {
    const pool = from.filter((id) => !taken.has(id));
    const out: string[] = [];
    while (out.length < count && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    return out;
  };
  const taken = new Set([correctId]);
  const near = take(sameCategory, 3, taken);
  near.forEach((id) => taken.add(id));
  const far = take(everyone, 3 - near.length, taken);
  const all = [correctId, ...near, ...far];
  for (let i = all.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}
