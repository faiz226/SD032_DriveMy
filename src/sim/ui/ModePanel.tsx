// Before driving: assessment (the full circuit, marked and saved) or practice (one station, restarted at will,
// never saved). The world is already loading behind it, once, for both.
import { Button } from '@/components/ui/button';
import { Plate } from '@/components/ui/road';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import type { Mode, StationId } from '../contracts';
import { circuit } from '../data';
import { stationName } from './Verdict';

interface Props {
  mode: Mode;
  drill: StationId;
  ready: boolean;
  onMode(m: Mode): void;
  onDrill(id: StationId): void;
  onStart(): void;
  onExit(): void;
}

export function ModePanel({ mode, drill, ready, onMode, onDrill, onStart, onExit }: Props) {
  const { t } = useLanguage();
  const choice = (selected: boolean) => cn('bay focus-paint text-left', selected ? 'bay-selected' : 'bay-open');
  return (
    <div className="absolute inset-0 flex items-start justify-center overflow-y-auto bg-[rgb(var(--asphalt)/0.55)] p-3 sm:items-center">
      <Plate className="w-full max-w-xl space-y-4 p-4 sm:p-6">
        <h1 className="type-display text-2xl">{t('sim.mode.title')}</h1>
        <div role="radiogroup" aria-label={t('sim.mode.title')} className="grid gap-3 sm:grid-cols-2">
          {(['assessment', 'practice'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => onMode(m)} className={cn(choice(mode === m), 'flex flex-col items-start gap-1 p-3')}>
              <span className="type-label-strong">{t(m === 'assessment' ? 'sim.mode.assessment' : 'sim.mode.practice')}</span>
              <span className="type-label text-sm">{t(m === 'assessment' ? 'sim.mode.assessmentDesc' : 'sim.mode.practiceDesc')}</span>
            </button>
          ))}
        </div>
        {mode === 'practice' && (
          <div role="radiogroup" aria-label={t('sim.hud.drills')} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {circuit.stations.map((st) => (
              <button key={st.id} type="button" role="radio" aria-checked={drill === st.id} onClick={() => onDrill(st.id)} className={cn(choice(drill === st.id), 'type-label-strong tap-sm p-2')}>
                {st.order}. {stationName(t, st.id)}
              </button>
            ))}
          </div>
        )}
        <p className="type-label text-sm">{t('sim.label')}</p>
        <div className="flex flex-wrap gap-3">
          <Button disabled={!ready} onClick={onStart}>
            {mode === 'assessment' ? t('sim.mode.startAssessment') : t('sim.mode.startPractice', { station: stationName(t, drill) })}
          </Button>
          <Button variant="ghost" onClick={onExit}>{t('sim.hud.exit')}</Button>
        </div>
        <p className="type-label text-xs">{t('sim.mode.keys')}</p>
      </Plate>
    </div>
  );
}
