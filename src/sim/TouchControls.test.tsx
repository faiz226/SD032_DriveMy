import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDriver, useTouchPref, useTouchUi } from './input';
import { TouchControls } from './TouchControls';

beforeEach(() => {
  useDriver.setState({ throttle: 0, brake: 0, handbrake: false, gear: 'D', wheel: 0, paused: false, topDown: false, speedKmh: 0, notice: null });
});

describe('touch controls', () => {
  it('the steering holds its angle when let go: dragging left turns left', () => {
    render(<TouchControls />);
    const wheel = screen.getByRole('slider');
    fireEvent.pointerDown(wheel, { pointerId: 1, clientX: 200 });
    fireEvent.pointerMove(wheel, { pointerId: 1, clientX: 145 });
    expect(useDriver.getState().wheel).toBeCloseTo(0.5, 2);
    fireEvent.pointerUp(wheel, { pointerId: 1, clientX: 145 });
    expect(useDriver.getState().wheel).toBeCloseTo(0.5, 2);
    fireEvent.pointerMove(wheel, { pointerId: 1, clientX: 0 });   // no longer held: nothing changes
    expect(useDriver.getState().wheel).toBeCloseTo(0.5, 2);
  });

  it('a double tap on the steering centres it', () => {
    useDriver.setState({ wheel: -0.8 });
    render(<TouchControls />);
    const wheel = screen.getByRole('slider');
    fireEvent.pointerDown(wheel, { pointerId: 1, clientX: 100 });
    fireEvent.pointerUp(wheel, { pointerId: 1, clientX: 100 });
    expect(useDriver.getState().wheel).toBeCloseTo(-0.8, 5);
    fireEvent.pointerDown(wheel, { pointerId: 2, clientX: 100 });
    expect(useDriver.getState().wheel).toBe(0);
  });

  it('the pedals press while held and release when let go, and the brake never selects reverse', () => {
    render(<TouchControls />);
    const brake = screen.getByRole('button', { name: 'Brake' });
    const gas = screen.getByRole('button', { name: 'Accelerator' });
    fireEvent.pointerDown(brake, { pointerId: 3, clientY: 10 });
    expect(useDriver.getState().brake).toBeGreaterThan(0);
    expect(useDriver.getState().gear).toBe('D');
    fireEvent.pointerUp(brake, { pointerId: 3 });
    expect(useDriver.getState().brake).toBe(0);
    fireEvent.pointerDown(gas, { pointerId: 4, clientY: 10 });
    expect(useDriver.getState().throttle).toBeGreaterThan(0);
    fireEvent.pointerCancel(gas, { pointerId: 4 });
    expect(useDriver.getState().throttle).toBe(0);
  });

  it('D/R changes only when stopped; the other buttons toggle', () => {
    render(<TouchControls />);
    useDriver.setState({ speedKmh: 5 });
    fireEvent.click(screen.getByRole('button', { name: /^Gear/ }));
    expect(useDriver.getState().gear).toBe('D');
    expect(useDriver.getState().notice?.key).toBe('stopFirst');
    useDriver.setState({ speedKmh: 0 });
    fireEvent.click(screen.getByRole('button', { name: /^Gear/ }));
    expect(useDriver.getState().gear).toBe('R');
    fireEvent.click(screen.getByRole('button', { name: 'Handbrake' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Top-down view' }));
    expect(useDriver.getState()).toMatchObject({ handbrake: true, paused: true, topDown: true });
  });

  it('show at 800 x 360 with touch and a coarse pointer, and stay hidden on a desktop with a mouse', () => {
    const device = (coarse: boolean, points: number) => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: (q: string) => ({ matches: coarse && q === '(pointer: coarse)', media: q, addEventListener: () => {}, removeEventListener: () => {} }),
      });
      Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: points });
    };
    const before = window.matchMedia;
    Object.assign(window, { innerWidth: 800, innerHeight: 360 });
    useTouchPref.setState({ pref: 'auto' });
    try {
      device(true, 5);
      expect(renderHook(() => useTouchUi()).result.current).toBe(true);
      device(false, 0);
      Object.assign(window, { innerWidth: 1920, innerHeight: 1080 });
      expect(renderHook(() => useTouchUi()).result.current).toBe(false);
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: before });
      Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
    }
  });

  it('show on a touch device with a coarse pointer, or when the setting says so; never by screen width', () => {
    // jsdom has no coarse pointer and no touch points
    useTouchPref.setState({ pref: 'auto' });
    expect(renderHook(() => useTouchUi()).result.current).toBe(false);
    useTouchPref.setState({ pref: 'on' });
    expect(renderHook(() => useTouchUi()).result.current).toBe(true);
    useTouchPref.setState({ pref: 'off' });
    expect(renderHook(() => useTouchUi()).result.current).toBe(false);
  });
});
