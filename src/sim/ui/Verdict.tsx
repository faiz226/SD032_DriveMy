// The assessment's verdict, built only from SessionState.verdict. Nothing on this screen can change it: its
// buttons start another attempt or a practice station, or leave.
import { Button } from '@/components/ui/button';
import { Bay, Figure, Plate, SectionHead } from '@/components/ui/road';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/translations';
import type { Fault, SessionState, StationId } from '../contracts';
import { rules } from '../data';
import { Minimap } from './Minimap';

export type Verdict = NonNullable<SessionState['verdict']>;
export type SaveStatus = 'saving' | 'saved' | 'offline' | 'failed';
type T = ReturnType<typeof useLanguage>['t'];

export const stationName = (t: T, id: StationId) => t(`progress.maneuver.${id}` as TranslationKey);

const SAVE_KEY: Record<SaveStatus, TranslationKey> = {
  saving: 'sim.verdict.saving',
  saved: 'sim.resultSaved',
  offline: 'sim.verdict.savedOffline',
  failed: 'sim.resultSaveFailed',
};

interface Props {
  verdict: Verdict;
  save: SaveStatus | null;
  onRetry(): void;
  onPractise(id: StationId): void;
  onExit(): void;
}

export function VerdictView({ verdict, save, onRetry, onPractise, onExit }: Props) {
  const { t } = useLanguage();
  const practise = verdict.failedStations[0] ?? verdict.faults[0]?.station ?? null;
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[rgb(var(--asphalt)/0.86)] p-3 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="sim-verdict">
      <Plate className="mx-auto max-w-3xl space-y-6 p-4 sm:p-7">
        <header className="space-y-3">
          <p className="type-label">{t('sim.verdict.title')}</p>
          <Bay state={verdict.pass ? 'done' : 'fail'} className="space-y-1 px-4 py-3">
            <h1 id="sim-verdict" className="type-display text-3xl">{verdict.pass ? t('sim.verdict.pass') : t('sim.verdict.fail')}</h1>
            <p className="type-label-strong">
              <Figure>{verdict.demerits}</Figure> {t('sim.verdict.demerits', { max: rules.verdict.fail_at_demerits })}
            </p>
          </Bay>
          <p>
            {verdict.failedStations.length
              ? `${t('sim.verdict.failedStations')}: ${verdict.failedStations.map((id) => stationName(t, id)).join(', ')}`
              : t('sim.verdict.allCleared')}
          </p>
          <p className="type-label">{t('sim.verdict.topDown', { s: Math.round(verdict.topDownSeconds) })}</p>
          {save && <p className="type-label" role="status">{t(SAVE_KEY[save])}</p>}
        </header>

        <section className="space-y-3" aria-labelledby="sim-faults">
          <SectionHead id="sim-faults">{t('sim.verdict.faults')}</SectionHead>
          {verdict.faults.length === 0 ? (
            <p>{t('sim.verdict.noFaults')}</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
              <ol className="space-y-4">
                {verdict.faults.map((f, i) => <FaultItem key={i} n={i + 1} fault={f} t={t} />)}
              </ol>
              <Minimap
                marks={verdict.faults.map((f, i) => ({ at: f.at, label: String(i + 1) }))}
                label={t('sim.verdict.map')}
                className="h-auto w-full self-start rounded-[var(--r-plate)]"
              />
            </div>
          )}
        </section>

        <footer className="flex flex-wrap gap-3">
          <Button onClick={onRetry}>{t('sim.verdict.retry')}</Button>
          {practise && (
            <Button variant="outline" onClick={() => onPractise(practise)}>
              {t('sim.verdict.practise', { station: stationName(t, practise) })}
            </Button>
          )}
          <Button variant="ghost" onClick={onExit}>{t('sim.hud.exit')}</Button>
        </footer>
      </Plate>
    </div>
  );
}

function FaultItem({ n, fault, t }: { n: number; fault: Fault; t: T }) {
  return (
    <li className="space-y-1">
      <p className="type-label-strong">
        {n}. {stationName(t, fault.station)}
        {fault.points > 0 && <span className="type-label"> · {t('sim.verdict.points', { n: fault.points })}</span>}
      </p>
      <p>{t(fault.reasonKey as TranslationKey)}</p>
      {fault.measured && fault.limit && (
        <p className="type-label">{t('sim.verdict.measured', { measured: fault.measured, limit: fault.limit })}</p>
      )}
      <p>{t(fault.fixKey as TranslationKey)}</p>
      <details>
        <summary className="type-label cursor-pointer">{t('sim.verdict.why')}</summary>
        <p className="type-label mt-1">{fault.basis}</p>
      </details>
    </li>
  );
}
