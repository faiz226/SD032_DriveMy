// Before driving: assessment (the full circuit, marked and saved), practice (one station, restarted at will,
// never saved) or free drive (anywhere in the yard, for fun: nothing marked or saved). The world is already
// loading behind it, once, for all three.
import { Button } from '@/components/ui/button';
import { RoadTip } from '@/components/shared/RoadTip';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import type { Mode, StationId } from '../contracts';
import { circuit } from '../data';
import { useKeyNames } from '../input';
import { type SettingsProps, SimSettings } from './Settings';
import { stationName } from './Verdict';

/** What the panel offers: the rules' two modes, and free drive, which the rules never see. */
export type PanelMode = Mode | 'free';

interface Props {
  mode: PanelMode;
  drill: StationId;
  ready: boolean;
  onMode(m: PanelMode): void;
  onDrill(id: StationId): void;
  onStart(): void;
  /** A free camera over the circuit first: nothing marked. */
  onExplore(): void;
  onExit(): void;
  /** The simulator's own settings (Settings.tsx): the same panel the settings button opens while driving. */
  settings: SettingsProps;
}

export function ModePanel({ mode, drill, ready, onMode, onDrill, onStart, onExplore, onExit, settings }: Props) {
  const { t } = useLanguage();
  const names = useKeyNames();
  const choice = (selected: boolean) => cn('tile text-left', selected ? 'tile-selected' : 'tile-open');
  return (
    <div className="absolute inset-0 flex items-start justify-center overflow-y-auto bg-[oklch(var(--road)/0.55)] p-3 sm:items-center sm:p-6">
      <section className="glass-sheet w-full max-w-xl space-y-5 rounded-3xl p-5 sm:p-7" aria-labelledby="sim-mode-title">
        <header className="space-y-1.5">
          <h1 id="sim-mode-title" className="glass-ink font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t('sim.mode.title')}
          </h1>
          <p className="glass-muted text-sm">{t('sim.label')}</p>
        </header>

        <div role="radiogroup" aria-label={t('sim.mode.title')} className="grid gap-3 sm:grid-cols-3">
          {(['assessment', 'practice', 'free'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => onMode(m)}
              className={cn(choice(mode === m), 'min-h-11 flex flex-col items-start gap-1.5 p-3.5')}
            >
              <span className="font-heading text-base font-extrabold text-foreground">{t(`sim.mode.${m}`)}</span>
              <span className="text-sm leading-snug text-muted-foreground">{t(`sim.mode.${m}Desc`)}</span>
            </button>
          ))}
        </div>

        {mode === 'practice' && (
          <div className="space-y-2.5">
            <h2 className="glass-ink font-heading text-base font-bold">{t('sim.hud.drills')}</h2>
            <div role="radiogroup" aria-label={t('sim.hud.drills')} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {circuit.stations.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  role="radio"
                  aria-checked={drill === st.id}
                  onClick={() => onDrill(st.id)}
                  className={cn(choice(drill === st.id), 'type-label-strong min-h-11 flex items-center px-3 py-2 text-sm')}
                >
                  {st.order}. {stationName(t, st.id)}
                </button>
              ))}
            </div>
          </div>
        )}

        <RoadTip className="p-4" />

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="brand" disabled={!ready} onClick={onStart}>
            {mode === 'assessment' ? t('sim.mode.startAssessment') : mode === 'free' ? t('sim.mode.startFree') : t('sim.mode.startPractice', { station: stationName(t, drill) })}
          </Button>
          <Button variant="outline" disabled={!ready} onClick={onExplore}>{t('sim.explore.start')}</Button>
          <Button variant="ghost" className="glass-ink hover:bg-[var(--glass-control-hover)]" onClick={onExit}>{t('sim.hud.exit')}</Button>
        </div>

        <details className="space-y-3 border-t border-[var(--glass-hairline)] pt-3">
          <summary className="glass-ink type-label-strong min-h-11 inline-flex cursor-pointer items-center rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {t('sim.settings.title')}
          </summary>
          <SimSettings settings={settings} />
        </details>

        <p className="glass-muted text-xs leading-relaxed">{t(settings.gears === 'on' ? 'sim.mode.keysRealistic' : 'sim.mode.keys', names)}</p>
      </section>
    </div>
  );
}
