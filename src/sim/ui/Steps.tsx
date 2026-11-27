// A station's steps (the testers, 2 Nov: "explain step by step first"; "step-by-step procedure with tips on how to
// pass each level"): one step per line of the station's `sim.steps.*` string, with the reference points to use.
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import type { StationId } from '../contracts';
import { useKeyNames } from '../input';

/** A station's steps, one string each, in the learner's language and with the learner's own key names. */
export function useStepLines(id: StationId): string[] {
  const { t } = useLanguage();
  const names = useKeyNames();
  return t(`sim.steps.${id}` as TranslationKey, names).split('\n');
}

export function Steps({ id, className }: { id: StationId; className?: string }) {
  return (
    <ol className={cn('list-decimal space-y-1 pl-5 leading-relaxed', className)}>
      {useStepLines(id).map((line) => <li key={line}>{line}</li>)}
    </ol>
  );
}
