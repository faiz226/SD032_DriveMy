// What the learner sees while driving. It keeps out of the mirrors' three areas (the top centre, and the
// side edges a little above the middle) and clear of the touch controls along the bottom.
import { ArrowCounterClockwise, ArrowFatLeft, ArrowFatRight, Headlights, ListBullets, MagnifyingGlassMinus, MagnifyingGlassPlus, MapTrifold, Pause, Play, SignOut, VideoCamera } from '@/components/ui/icons';
import { type ReactNode, useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Figure } from '@/components/ui/surface';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import type { Fault, StationProgress } from '../contracts';
import { circuit, rules } from '../data';
import { useDriver, ZOOM_STEP } from '../input';
import { blinkOn, lampClock } from '../physics/Lamps';
import { MIRROR_PAD, mirrorScale } from '../physics/mirrors';
import { useEggs } from './Eggs';
import { useRun } from './run';
import { faultSound, tickSound } from './sound';
import { stationName } from './Verdict';

const TIP_S = 6;          // rules.json modes: tips show for 6 s when a station arms
const TOAST_S = 3.5;
const EGG_S = 4.5;
const INTERIOR_MIRROR_H = 60;

// the HUD's own surface: asphalt with paint, the on-road palette
export const HUD_PLATE = 'rounded-[var(--radius)] border border-[rgb(var(--paint)/0.25)] bg-[rgb(var(--road)/0.72)] text-[rgb(var(--paint))]';

const sizeNow = () => `${window.innerWidth}x${window.innerHeight}`;
const onResize = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };
function useWindowSize(): [number, number] {
  const s = useSyncExternalStore(onResize, sizeNow, () => '851x393');
  const [w, h] = s.split('x').map(Number);
  return [w, h];
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

interface Props {
  touch: boolean;
  /** Free drive: nothing is marked, so no station, demerits or faults; back to the start, and the chase view. */
  free?: boolean;
  onRestart(): void;
  onStations(): void;
  onExit(): void;
}

export function Hud({ touch, free = false, onRestart, onStations, onExit }: Props) {
  const { t } = useLanguage();
  const mode = useRun((s) => s.mode);
  const state = useRun((s) => s.state);
  const now = useRun((s) => s.t);
  const paused = useDriver((s) => s.paused);
  const topDown = useDriver((s) => s.topDown);
  const chase = useDriver((s) => s.chase);
  const headlights = useDriver((s) => s.headlights);
  const starting = useDriver((s) => s.starting);
  const [w, h] = useWindowSize();
  const k = mirrorScale(w, h);
  const belowMirror = topDown ? 12 : MIRROR_PAD * k + INTERIOR_MIRROR_H * k + 8;

  const station = free ? null : (state.stations.find((s) => s.id === state.current) ?? null);
  const done = !free && mode === 'practice' && state.current === null ? state.stations[0] : null;
  const voided = mode === 'practice' && station?.status === 'waiting' && Number(station.detail.voids ?? 0) > 0;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className="absolute left-3 top-3 w-[min(40vw,300px)] space-y-2">
        {station && <StationPanel station={station} now={now} />}
        {voided && <p className={cn(HUD_PLATE, 'type-label px-3 py-2')} role="status">{t('sim.hud.void')}</p>}
      </div>

      <div className="absolute right-3 top-3 flex w-[min(40vw,300px)] flex-col items-end gap-2">
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          {free && (
            <>
              <HudButton label={t('sim.hud.toStart')} onClick={onRestart}><ArrowCounterClockwise size={20} /></HudButton>
              <HudButton label={t('sim.hud.modes')} onClick={onStations}><ListBullets size={20} /></HudButton>
              <HudButton label={t('sim.hud.chase')} pressed={chase} onClick={() => useDriver.getState().set({ chase: !chase })}><VideoCamera size={20} /></HudButton>
            </>
          )}
          {!free && mode === 'practice' && (
            <>
              <HudButton label={t('sim.hud.restartDrill')} onClick={onRestart}><ArrowCounterClockwise size={20} /></HudButton>
              <HudButton label={t('sim.hud.drills')} onClick={onStations}><ListBullets size={20} /></HudButton>
            </>
          )}
          {!touch && (
            <>
              <HudButton label={t('sim.touch.topDown')} pressed={topDown} onClick={() => useDriver.getState().set({ topDown: !topDown })}><MapTrifold size={20} /></HudButton>
              <HudButton label={paused ? t('sim.hud.resume') : t('sim.touch.pause')} pressed={paused} onClick={() => useDriver.getState().set({ paused: !paused })}>
                {paused ? <Play size={20} weight="fill" /> : <Pause size={20} />}
              </HudButton>
            </>
          )}
          <HudButton label={t('sim.hud.lights')} pressed={headlights} onClick={() => useDriver.getState().set({ headlights: !headlights })}><Headlights size={20} /></HudButton>
          <HudButton label={t('sim.hud.exit')} onClick={onExit}><SignOut size={20} /></HudButton>
        </div>
        {topDown && (
          <div className="pointer-events-auto flex gap-2">
            <HudButton label={t('sim.hud.zoomOut')} onClick={() => useDriver.getState().zoomBy(1 / ZOOM_STEP)}><MagnifyingGlassMinus size={20} /></HudButton>
            <HudButton label={t('sim.hud.zoomIn')} onClick={() => useDriver.getState().zoomBy(ZOOM_STEP)}><MagnifyingGlassPlus size={20} /></HudButton>
          </div>
        )}
        {station?.status === 'armed' && station.timeLimitS !== null && (
          <p className={cn(HUD_PLATE, 'type-label px-3 py-1.5')}>
            {t('sim.hud.timeLeft')} <Figure>{clock(Math.max(0, station.timeLimitS - (now - (station.startedAt ?? now))))}</Figure>
          </p>
        )}
        {!free && mode === 'assessment' && (
          <p className={cn(HUD_PLATE, 'type-label px-3 py-1.5')}>
            {t('sim.hud.demerits')} <Figure>{state.demerits}/{rules.verdict.fail_at_demerits}</Figure>
          </p>
        )}
      </div>

      <div className="absolute left-1/2 flex w-[min(60vw,420px)] -translate-x-1/2 flex-col items-center gap-2" style={{ top: belowMirror }}>
        <p className={cn(HUD_PLATE, 'type-label px-2 py-0.5 text-xs')}>{t(free ? 'sim.hud.free' : 'sim.label')}</p>
        {starting && <p className={cn(HUD_PLATE, 'type-label w-full px-3 py-1.5 text-center')} role="status">{t(starting === 'brief' ? 'sim.hud.brief' : 'sim.hud.engine')}</p>}
        {!free && <Toasts />}
        <EggLine />
      </div>

      <Readouts bottom={touch ? 72 : 12} />

      {done && <DrillDone station={done} onRestart={onRestart} onStations={onStations} />}
      {paused && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[rgb(var(--road)/0.45)]">
          <div className={cn(HUD_PLATE, 'max-w-sm space-y-3 p-4 text-center')} role="status">
            <p className="type-label-strong text-lg">{t('sim.hud.paused')}</p>
            <p className="type-label">{t('sim.hud.pausedHint')}</p>
            <Button onClick={() => useDriver.getState().set({ paused: false })}>{t('sim.hud.resume')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function HudButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick(): void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(HUD_PLATE, 'tap-sm flex items-center justify-center', pressed && 'bg-[rgb(var(--paint)/0.92)] text-[rgb(var(--road))]')}
    >
      {children}
    </button>
  );
}

/** The station's number and title; its tip for the first 6 s after it arms, then just the title. */
function StationPanel({ station, now }: { station: StationProgress; now: number }) {
  const { t } = useLanguage();
  const n = circuit.stations.find((s) => s.id === station.id)?.order ?? 0;
  const armed = station.status === 'armed';
  const tip = armed && now - (station.startedAt ?? now) < TIP_S;
  return (
    <div className={cn(HUD_PLATE, 'px-3 py-2')} role="status">
      <p className="type-label-strong">
        {armed ? '' : `${t('sim.hud.next')}: `}{n} · {stationName(t, station.id)}
      </p>
      {tip && <p className="type-label mt-1 text-sm">{t(`sim.tips.${station.id}` as TranslationKey)}</p>}
    </div>
  );
}

/** A surprise's line, for a few seconds. */
function EggLine() {
  const { t } = useLanguage();
  const toast = useEggs((s) => s.toast);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setShown(toast.at), EGG_S * 1000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  if (!toast || shown === toast.at) return null;
  return <p className={cn(HUD_PLATE, 'type-label w-full px-3 py-1.5 text-center')} role="status">{t(toast.key)}</p>;
}

/** One per fault, in the order they happened, each with a short tone. Kerbs and poles count once per contact. */
function Toasts() {
  const { t } = useLanguage();
  const toasts = useRun((s) => s.toasts);
  const mode = useRun((s) => s.mode);
  const newest = toasts.at(-1)?.id;
  useEffect(() => { if (newest !== undefined) faultSound(); }, [newest]);
  return (
    <ul className="flex w-full flex-col items-center gap-1.5" aria-live="polite">
      {toasts.map(({ id, fault }) => (
        <ToastItem key={id} id={id}>
          <FaultLine fault={fault} assessment={mode === 'assessment'} t={t} />
        </ToastItem>
      ))}
    </ul>
  );
}

function ToastItem({ id, children }: { id: number; children: ReactNode }) {
  useEffect(() => {
    const timer = window.setTimeout(() => useRun.getState().dismiss(id), TOAST_S * 1000);
    return () => window.clearTimeout(timer);
  }, [id]);
  return <li className={cn(HUD_PLATE, 'type-label w-full px-3 py-1.5 text-center')}>{children}</li>;
}

function FaultLine({ fault, assessment, t }: { fault: Fault; assessment: boolean; t: ReturnType<typeof useLanguage>['t'] }) {
  return (
    <>
      {t(fault.reasonKey as TranslationKey)}
      {assessment && fault.points > 0 && <strong> · {t('sim.verdict.points', { n: fault.points })}</strong>}
    </>
  );
}

/** Whether the indicators show lit now, the relay ticking at each change: in step with the lamps on the car. */
function useFlash(on: boolean): boolean {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    if (!on) return;
    let was: boolean | null = null;
    const timer = window.setInterval(() => {
      const now = blinkOn(lampClock());
      if (now === was) return;
      was = now;
      setLit(now);
      tickSound(now);
    }, 25);
    return () => window.clearInterval(timer);
  }, [on]);
  return on && lit;
}

function Readouts({ bottom }: { bottom: number }) {
  const { t } = useLanguage();
  const speed = useDriver((s) => s.speedKmh);
  const gear = useDriver((s) => s.gear);
  const handbrake = useDriver((s) => s.handbrake);
  const indicator = useDriver((s) => s.indicator);
  const headlights = useDriver((s) => s.headlights);
  const flash = useFlash(indicator !== 0);
  // the dashboard's arrows, dim until that side flashes
  const arrow = (side: 1 | -1) => (indicator === side && flash ? 'opacity-100' : 'opacity-20');
  return (
    <div className={cn(HUD_PLATE, 'absolute left-1/2 flex -translate-x-1/2 items-center gap-3 px-3 py-1.5')} style={{ bottom }}>
      <span className={arrow(1)} aria-hidden><ArrowFatLeft size={18} weight="fill" /></span>
      <span><Figure className="text-xl">{Math.round(Math.abs(speed))}</Figure> <span className="type-label">km/h</span></span>
      <span className="type-label-strong" aria-label={t('sim.touch.gear')}>{gear}</span>
      {handbrake && <span className="type-label-strong" title={t('sim.touch.handbrake')}>(P)</span>}
      {headlights && <span title={t('sim.hud.lights')}><Headlights size={18} weight="fill" /></span>}
      <span className={arrow(-1)} aria-hidden><ArrowFatRight size={18} weight="fill" /></span>
      {indicator !== 0 && <span className="sr-only">{t(indicator > 0 ? 'sim.hud.signalLeft' : 'sim.hud.signalRight')}</span>}
    </div>
  );
}

/** Practice: the station is over. */
function DrillDone({ station, onRestart, onStations }: { station: StationProgress; onRestart(): void; onStations(): void }) {
  const { t } = useLanguage();
  const cleared = station.status === 'cleared';
  const fault = useRun((s) => s.state.faults.at(-1));
  return (
    <div className="pointer-events-auto absolute inset-x-0 top-1/3 mx-auto w-[min(92vw,380px)]">
      <div className={cn(HUD_PLATE, 'space-y-3 border-l-4 p-4', cleared ? 'border-l-[rgb(var(--success))]' : 'border-l-[rgb(var(--destructive))]')} role="status">
        <p className="type-label-strong text-lg">{stationName(t, station.id)}: {cleared ? t('sim.hud.cleared') : t('sim.hud.failed')}</p>
        {!cleared && fault && <p className="type-label">{t(fault.fixKey as TranslationKey)}</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRestart}>{t('sim.hud.restartDrill')}</Button>
          <Button variant="outline" onClick={onStations}>{t('sim.hud.drills')}</Button>
        </div>
      </div>
    </div>
  );
}
