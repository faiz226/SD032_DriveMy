import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDriver, useKeyboardControls } from './input';

describe('losing focus', () => {
  it('switching tabs or windows clears every held input and pauses', () => {
    renderHook(() => useKeyboardControls());
    for (const lose of [() => window.dispatchEvent(new Event('blur')), () => window.dispatchEvent(new Event('pagehide')), () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    }]) {
      act(() => useDriver.setState({ throttle: 1, brake: 0.5, wheel: -0.7, paused: false }));
      act(lose);
      expect(useDriver.getState()).toMatchObject({ throttle: 0, brake: 0, wheel: 0, paused: true });
    }
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  it('R changes gear only when stopped; holding S never selects reverse', () => {
    renderHook(() => useKeyboardControls());
    act(() => useDriver.setState({ gear: 'D', speedKmh: 0, notice: null }));
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' })); });
    expect(useDriver.getState()).toMatchObject({ gear: 'D', brake: 1 });
    act(() => { window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' })); });
    act(() => useDriver.setState({ speedKmh: 4 }));
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); });
    expect(useDriver.getState().gear).toBe('D');
    expect(useDriver.getState().notice?.key).toBe('stopFirst');
    act(() => useDriver.setState({ speedKmh: 0 }));
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' })); });
    expect(useDriver.getState().gear).toBe('R');
  });
});
