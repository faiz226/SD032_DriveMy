// What the learner sees while driving. It keeps out of the mirrors' three areas (the top centre, and the
// side edges a little above the middle) and clear of the touch controls along the bottom.
import { ArrowCounterClockwise, ArrowFatLeft, ArrowFatRight, Gear, Headlights, ListBullets, MagnifyingGlassMinus, MagnifyingGlassPlus, MapTrifold, Pause, Play, SignOut, VideoCamera } from '@/components/ui/icons';
import { SwapIcon } from "@/components/ui/swap-icon";
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Figure } from '@/components/ui/surface';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import type { Fault, StationId, StationProgress } from '../contracts';
import { circuit, rules } from '../data';
import { useDriver, useKeyNames, useSettingsPanel, ZOOM_STEP } from '../input';
import { blinkOn, lampClock } from '../physics/Lamps';
import { MIRROR_PAD, mirrorScale } from '../physics/mirrors';
import { useEggs } from './Eggs';
import { useRun } from './run';
import { type SettingsProps, SettingsDialog } from './Settings';
import { faultSound, tickSound } from './sound';
import { stationName } from './Verdict';
import { advance } from './guide';
import { useStepLines } from './Steps';
import { routeAt, wayTurnDeg } from './way';

const TIP_S = 6;          // rules.json modes: tips show for 6 s when a station arms
const TOAST_S = 3.5;
const EGG_S = 4.5;
const NOTICE_S = 4.5;
const INTERIOR_MIRROR_H = 60;

// Compact Liquid Glass plate for simulator edge HUD controls only (zero blur over the 3D canvas center).
export const HUD_PLATE = 'glass-hud rounded-[var(--radius)]';

// High-contrast secondary / ghost button styles over dark asphalt glass in both light and dark themes.
const HUD_ACTION_SECONDARY =
  'border border-white/30 bg-white/10 text-white shadow-none hover:border-white/45 hover:bg-white/20 hover:text-white focus-visible:ring-white focus-visible:ring-offset-[oklch(var(--road))]';
const HUD_ACTION_GHOST =
  'bg-transparent text-white/85 shadow-none hover:bg-white/15 hover:text-white focus-visible:ring-white focus-visible:ring-offset-[oklch(var(--road))]';

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
  /** Practice: the next station's drill. */
  onNext(): void;
  onStations(): void;
  onExit(): void;
  /** The settings, behind the button (the same panel as the first screen's). */
  settings: SettingsProps;
}

export function Hud({ touch, free = false, onRestart, onNext, onStations, onExit, settings }: Props) {
  const { t } = useLanguage();
  const names = useKeyNames();
  const mode = useRun((s) => s.mode);
  const state = useRun((s) => s.state);
  const runId = useRun((s) => s.runId);
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
  const voided = mode === 'practice' && station?.status === 'waiting' && Number(station.detail.voids ?? 0) > 0;
  const done = free || mode !== 'practice' ? null : state.current === null ? state.stations[0] : voided ? station : null;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <div className="absolute left-3 top-3 w-[min(40vw,300px)] space-y-2">
        {station && <StationPanel station={station} now={now} tips={mode !== 'practice'} />}
      </div>

      {station?.status === 'waiting' && !voided && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <WayArrow id={station.id} progress={state.progress ?? 0} />
        </div>
      )}

      <div className="absolute right-3 top-3 flex w-[min(46vw,340px)] flex-col items-end gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
          <div className="glass-hud flex items-center gap-1 rounded-2xl p-1">
            {free && (
              <>
                <HudButton label={t('sim.hud.toStart')} onClick={onRestart}><ArrowCounterClockwise size={20} /></HudButton>
                <HudButton label={t('sim.hud.modes')} onClick={onStations}><ListBullets size={20} /></HudButton>
              </>
            )}
            {!free && mode === 'practice' && (
              <>
                <HudButton label={t('sim.hud.restartDrill')} onClick={onRestart}><ArrowCounterClockwise size={20} /></HudButton>
                <HudButton label={t('sim.hud.drills')} onClick={onStations}><ListBullets size={20} /></HudButton>
              </>
            )}
            {!free && mode === 'assessment' && (
              <HudButton label={t('sim.hud.restartTest')} onClick={onRestart}><ArrowCounterClockwise size={20} /></HudButton>
            )}
          </div>
          <div className="glass-hud flex items-center gap-1 rounded-2xl p-1">
            <HudButton label={t('sim.hud.chase')} pressed={chase} onClick={() => useDriver.getState().set({ chase: !chase })}><VideoCamera size={20} /></HudButton>
            {!touch && (
              <>
                <HudButton label={t('sim.touch.topDown')} pressed={topDown} onClick={() => useDriver.getState().set({ topDown: !topDown })}><MapTrifold size={20} /></HudButton>
                <HudButton label={paused ? t('sim.hud.resume') : t('sim.touch.pause')} pressed={paused} onClick={() => useDriver.getState().set({ paused: !paused })}>
                  <SwapIcon id={paused ? "play" : "pause"}>{paused ? <Play size={20} weight="fill" /> : <Pause size={20} />}</SwapIcon>
                </HudButton>
              </>
            )}
            <HudButton label={t('sim.hud.lights')} pressed={headlights} onClick={() => useDriver.getState().set({ headlights: !headlights })}><Headlights size={20} /></HudButton>
          </div>
          <div className="glass-hud flex items-center gap-1 rounded-2xl p-1">
            <HudButton label={t('sim.settings.title')} onClick={() => useSettingsPanel.getState().show()}><Gear size={20} /></HudButton>
            <HudButton label={t('sim.hud.exit')} onClick={onExit}><SignOut size={20} /></HudButton>
          </div>
        </div>
        {topDown && (
          <div className="pointer-events-auto glass-hud flex items-center gap-1 rounded-2xl p-1">
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
        <NoticeLine />
      </div>

      <Readouts bottom={touch ? 72 : 12} />

      {station && mode === 'practice' && !done && <Guide key={`${runId}-${station.id}`} id={station.id} />}

      {done && <DrillDone station={done} onRestart={onRestart} onNext={onNext} onStations={onStations} />}
      <SettingsDialog settings={settings} />
      {paused && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[oklch(var(--road)/0.5)] p-4">
          <div className={cn(HUD_PLATE, 'w-full max-w-sm space-y-4 rounded-3xl p-6 text-center')} role="status">
            <div className="space-y-1.5">
              <p className="font-heading text-xl font-extrabold text-white">{t('sim.hud.paused')}</p>
              <p className="type-label text-sm text-white/80">{t('sim.hud.pausedHint', names)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="brand" className="w-full" onClick={() => useDriver.getState().set({ paused: false })}>
                {t('sim.hud.resume')}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className={HUD_ACTION_SECONDARY}
                  onClick={() => { useDriver.getState().set({ paused: false }); onRestart(); }}
                >
                  {free ? t('sim.hud.toStart') : mode === 'practice' ? t('sim.hud.restartDrill') : t('sim.hud.restartTest')}
                </Button>
                <Button variant="ghost" className={HUD_ACTION_GHOST} onClick={onExit}>
                  {t('sim.hud.exit')}
                </Button>
              </div>
            </div>
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
      className={cn(
        'tap-sm flex items-center justify-center rounded-xl text-[oklch(var(--paint))] transition-[background-color,color,transform] duration-150 ease-spring active:scale-[0.96]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[oklch(var(--road))]',
        pressed
          ? 'bg-[oklch(var(--paint)/0.94)] text-[oklch(var(--road))] shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]'
          : 'hover:bg-white/15',
      )}
    >
      {children}
    </button>
  );
}

/** The station's number and title; its tip for the first 6 s after it arms, then just the title. */
function StationPanel({ station, now, tips }: { station: StationProgress; now: number; tips: boolean }) {
  const { t } = useLanguage();
  const n = circuit.stations.find((s) => s.id === station.id)?.order ?? 0;
  const armed = station.status === 'armed';
  const tip = tips && armed && now - (station.startedAt ?? now) < TIP_S;   // practice shows the steps instead
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

/** The driver's notice (the gear refused while moving, or how to reverse after S holds the car), for a few seconds. */
function NoticeLine() {
  const { t } = useLanguage();
  const names = useKeyNames();
  const notice = useDriver((s) => s.notice);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setShown(notice.at), NOTICE_S * 1000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  if (!notice || shown === notice.at) return null;
  return <p className={cn(HUD_PLATE, 'type-label w-full px-3 py-1.5 text-center')} role="status">{t(`sim.notice.${notice.key}` as TranslationKey, { key: names.back })}</p>;
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

const LOOK_M = 15;   // the way arrow points at the route this far ahead of the car

/**
 * On the way to a station (the testers, 2 Nov: "I couldn't follow the next direction without the top-down view"):
 * an arrow at the route a few seconds ahead, turned to where it lies from the car, and how far the station is (its name
 * is in the station panel beside it).
 */
function WayArrow({ id, progress }: { id: StationId; progress: number }) {
  const { t } = useLanguage();
  const pose = useRun((s) => s.pose);
  if (!pose) return null;
  const from = circuit.stations.find((g) => g.id === id)!.s_from;
  const metres = Math.max(0, Math.round((from - progress) / 5) * 5);
  return (
    <div className={cn(HUD_PLATE, 'flex items-center gap-2 px-3 py-1.5')} role="img" aria-label={`${t('sim.hud.next')}: ${stationName(t, id)}, ${metres} m`}>
      <ArrowFatRight size={28} weight="fill" aria-hidden style={{ transform: `rotate(${wayTurnDeg(pose, routeAt(progress + LOOK_M))}deg)` }} />
      <span className="type-label-strong whitespace-nowrap tabular-nums" aria-hidden>{metres} m</span>
    </div>
  );
}

/**
 * Practice: the station's steps, one at a time, in the middle of the screen, moving on as the learner does each one
 * (guide.ts reads the car and the rules). "Next step" is always there, so a step the car cannot see never holds anyone.
 */
function Guide({ id }: { id: StationId }) {
  const { t } = useLanguage();
  const lines = useStepLines(id);
  const [done, setDone] = useState(0);
  const moved = useRef(false);
  const speed = useDriver((s) => s.speedKmh);
  const gear = useDriver((s) => s.gear);
  const handbrake = useDriver((s) => s.handbrake);
  const wheel = useDriver((s) => s.wheel);
  const detail = useRun((s) => s.state.stations.find((st) => st.id === id)?.detail);
  const progress = useRun((s) => s.state.progress ?? 0);
  useEffect(() => {
    if (Math.abs(speed) >= 1.5) moved.current = true;
    const geo = circuit.stations.find((g) => g.id === id)!;
    const d = detail ?? {};
    const gates = Number(d.gates);
    const along = gates > 0 ? Number(d.gate ?? 0) / gates : (progress - geo.s_from) / Math.max(1, geo.s_to - geo.s_from);
    setDone((n) => advance(id, lines.length, n, { speed, gear, handbrake, wheel, moved: moved.current, detail: d, along: Math.min(1, Math.max(0, along)) }));
  }, [id, lines.length, speed, gear, handbrake, wheel, detail, progress]);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[34%] flex justify-center px-4">
      <div className={cn(HUD_PLATE, 'pointer-events-auto w-[min(92vw,26rem)] space-y-2.5 rounded-2xl px-4 py-3.5 text-center')} role="status" aria-live="polite">
        <p className="type-label text-xs uppercase tracking-wide text-white/75">{t('sim.guide.step', { n: done + 1, total: lines.length })}</p>
        <p className="type-label-strong text-lg leading-snug text-white">{lines[done]}</p>
        {done < lines.length - 1 && (
          <button
            type="button"
            onClick={() => setDone((n) => Math.min(lines.length - 1, n + 1))}
            className="min-h-11 inline-flex items-center justify-center rounded-full border border-white/40 bg-white/15 px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-spring hover:bg-white/25 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[oklch(var(--road))]"
          >
            {t('sim.guide.next')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Practice: the station is over, or the attempt did not count; why, how to fix it, and what next. */
export function DrillDone({ station, onRestart, onNext, onStations }: { station: StationProgress; onRestart(): void; onNext(): void; onStations(): void }) {
  const { t } = useLanguage();
  const fault = useRun((s) => s.state.faults.at(-1));
  const voidKey = station.status === 'waiting' ? String(station.detail.voidKey ?? '') : '';
  const cleared = station.status === 'cleared';
  const reason = voidKey ? `sim.fault.${voidKey}` : cleared ? undefined : fault?.reasonKey;
  const fix = voidKey ? `sim.fix.${voidKey}` : cleared ? undefined : fault?.fixKey;
  const statusTone = voidKey
    ? 'border-amber-300/45 bg-amber-400/20 text-amber-100'
    : cleared
      ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-100'
      : 'border-rose-400/45 bg-rose-500/20 text-rose-100';
  return (
    <div className="pointer-events-auto absolute inset-x-0 top-1/3 mx-auto w-[min(92vw,400px)] px-3">
      <div className={cn(HUD_PLATE, 'space-y-3.5 rounded-3xl p-5')} role="status">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-lg font-extrabold text-white">{stationName(t, station.id)}</p>
          <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize', statusTone)}>
            {t(voidKey ? 'sim.hud.voided' : cleared ? 'sim.hud.cleared' : 'sim.hud.failed')}
          </span>
        </div>
        {reason && <p className="type-label text-sm leading-relaxed text-white/95">{t(reason as TranslationKey)}</p>}
        {fix && <p className="type-label text-sm leading-relaxed text-white/80">{t(fix as TranslationKey)}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="brand" onClick={onRestart}>{t('sim.hud.restartDrill')}</Button>
          <Button variant="outline" className={HUD_ACTION_SECONDARY} onClick={onNext}>{t('sim.hud.nextStation')}</Button>
          <Button variant="outline" className={HUD_ACTION_SECONDARY} onClick={onStations}>{t('sim.hud.drills')}</Button>
        </div>
      </div>
    </div>
  );
}
