// A station's steps (the testers, 2 Nov: "explain step by step first"; "step-by-step procedure with tips on how to
// pass each level"): one step per line of the station's `sim.steps.*` string, with the reference points to use.
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import type { StationId } from '../contracts';
import { useKeyNames } from '../input';

export function Steps({ id, className }: { id: StationId; className?: string }) {
  const { t } = useLanguage();
  const names = useKeyNames();
  return (
    <ol className={cn('list-decimal space-y-0.5 pl-5', className)}>
      {t(`sim.steps.${id}` as TranslationKey, names).split('\n').map((line) => <li key={line}>{line}</li>)}
    </ol>
  );
}
