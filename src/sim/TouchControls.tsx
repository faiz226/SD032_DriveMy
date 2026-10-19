// Touch: the left thumb steers (the wheel holds its angle when let go; double-tap it to centre), the right
// thumb works the pedals (press higher up a pedal for more), and four buttons: D/R, handbrake, pause and
// the top-down view. Every control writes the same driver inputs as the keyboard.
import { MapTrifold, Pause, Play } from 'phosphor-react';
import { type CSSProperties, type PointerEvent, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDriver } from './input';

const STEER_PX = 110;        // a drag this far is full lock
const DOUBLE_TAP_MS = 300;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const capture = (e: PointerEvent<HTMLElement>) => e.currentTarget.setPointerCapture?.(e.pointerId);

// Jalan: controls are road, not signage, so asphalt and paint only (awas, berhenti and lulus mean progress,
// fail and pass); plate corners, except the round steering pad.
const IDLE = 'rgb(var(--asphalt) / 0.5)';
const LIT = 'rgb(var(--paint) / 0.92)';
const pad: CSSProperties = {
  position: 'absolute', pointerEvents: 'auto', touchAction: 'none', userSelect: 'none',
  background: IDLE, border: '1px solid rgb(var(--paint) / 0.6)', color: 'rgb(var(--paint))', borderRadius: 'var(--r-plate)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
};
const lit = (on: boolean): CSSProperties => (on ? { background: LIT, color: 'rgb(var(--asphalt))' } : {});

export function TouchControls() {
  const { t } = useLanguage();
  const gear = useDriver((s) => s.gear);
  const handbrake = useDriver((s) => s.handbrake);
  const wheel = useDriver((s) => s.wheel);
  const paused = useDriver((s) => s.paused);
  const topDown = useDriver((s) => s.topDown);
  const steer = useRef<{ id: number; x: number; wheel: number } | null>(null);
  const lastTap = useRef(-Infinity);

  const steerDown = (e: PointerEvent<HTMLDivElement>) => {
    capture(e);
    const now = performance.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      useDriver.getState().set({ wheel: 0 });
      lastTap.current = -Infinity;
      steer.current = null;
      return;
    }
    lastTap.current = now;
    steer.current = { id: e.pointerId, x: e.clientX, wheel: useDriver.getState().wheel };
  };
  const steerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = steer.current;
    if (!s || s.id !== e.pointerId) return;
    useDriver.getState().set({ wheel: clamp(s.wheel + (s.x - e.clientX) / STEER_PX, -1, 1) });   // drag left, turn left
  };
  const steerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (steer.current?.id === e.pointerId) steer.current = null;   // the wheel keeps its angle
  };

  const button = (on: boolean): CSSProperties => ({ ...pad, position: 'static', width: 52, height: 48, ...lit(on) });
  const d = useDriver.getState;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} onContextMenu={(e) => e.preventDefault()}>
      <div
        role="slider"
        aria-label={t('sim.touch.steer')}
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={Math.round(wheel * 100) / 100}
        style={{ ...pad, left: 16, bottom: 16, width: 140, height: 140, borderRadius: 9999 }}
        onPointerDown={steerDown}
        onPointerMove={steerMove}
        onPointerUp={steerUp}
        onPointerCancel={steerUp}
      >
        {/* a left input turns the rim anticlockwise */}
        <svg width="96" height="96" viewBox="-50 -50 100 100" style={{ transform: `rotate(${-wheel * 135}deg)` }} aria-hidden>
          <circle r="42" fill="none" stroke="currentColor" strokeWidth="8" />
          <path d="M -42 0 H 42 M 0 0 V 42" stroke="currentColor" strokeWidth="8" />
          <circle r="9" fill="currentColor" />
        </svg>
      </div>

      <Pedal kind="brake" label={t('sim.touch.brake')} text={t('sim.touch.brake')} style={{ right: 16 + 64 + 10, width: 84, height: 112 }} />
      <Pedal kind="throttle" label={t('sim.touch.throttle')} text={t('sim.touch.throttleShort')} style={{ right: 16, width: 64, height: 140 }} />

      <div style={{ position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
        <button type="button" className="type-label-strong tap" aria-label={t('sim.touch.gear')} style={button(gear === 'R')} onClick={() => d().toggleGear()}>{gear}</button>
        <button type="button" className="type-label-strong tap" aria-label={t('sim.touch.handbrake')} aria-pressed={handbrake} style={button(handbrake)} onClick={() => d().toggleHandbrake()}>(P)</button>
        <button type="button" className="tap" aria-label={t('sim.touch.pause')} aria-pressed={paused} style={button(paused)} onClick={() => d().set({ paused: !paused })}>
          {paused ? <Play size={22} weight="fill" /> : <Pause size={22} />}
        </button>
        <button type="button" className="tap" aria-label={t('sim.touch.topDown')} aria-pressed={topDown} style={button(topDown)} onClick={() => d().set({ topDown: !topDown })}>
          <MapTrifold size={22} />
        </button>
      </div>
    </div>
  );
}

/** A pedal: pressed while a finger is on it, harder higher up; released when every finger lifts. */
function Pedal({ kind, label, text, style }: { kind: 'throttle' | 'brake'; label: string; text: string; style: CSSProperties }) {
  const value = useDriver((s) => s[kind]);
  const held = useRef(new Set<number>());
  const press = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    // higher up the pedal is more; the lowest quarter is a light touch
    useDriver.getState().set({ [kind]: r.height > 0 ? clamp((r.bottom - e.clientY) / r.height, 0.25, 1) : 1 });
  };
  const down = (e: PointerEvent<HTMLDivElement>) => { capture(e); held.current.add(e.pointerId); press(e); };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (held.current.has(e.pointerId)) press(e); };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    held.current.delete(e.pointerId);
    if (held.current.size === 0) useDriver.getState().set({ [kind]: 0 });
  };
  return (
    <div
      role="button"
      aria-label={label}
      className="type-label-strong"
      style={{ ...pad, bottom: 16, ...style, ...lit(value > 0) }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {text}
    </div>
  );
}
