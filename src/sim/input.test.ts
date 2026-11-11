import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_KEYS, useDriver, useGearPref, useHead, useKeyboardControls, useKeys } from './input';

const press = (code: string, init: KeyboardEventInit = {}) => act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code, ...init })); });
const release = (code: string) => act(() => { window.dispatchEvent(new KeyboardEvent('keyup', { code })); });
/** The road speed the car publishes each step: negative when it goes backwards. */
const driveAt = (speedKmh: number) => act(() => useDriver.setState({ speedKmh }));
const car = () => useDriver.getState();
const head = () => { const { yaw, pitch } = useHead.getState(); return { yaw, pitch }; };

beforeEach(() => {
  useDriver.setState({ throttle: 0, brake: 0, wheel: 0, gear: 'D', speedKmh: 0, notice: null, hinted: false, paused: false });
  useHead.setState({ yaw: 0, pitch: 0 });
  useGearPref.setState({ pref: 'off' });
});

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
});

describe('the automatic gears: what a press of W or S means', () => {
  it('W goes; S while moving forward brakes and the gear stays D', () => {
    renderHook(() => useKeyboardControls());
    driveAt(20);
    press('KeyW');
    expect(car()).toMatchObject({ throttle: 1, brake: 0, gear: 'D' });
    release('KeyW');
    press('KeyS');
    expect(car()).toMatchObject({ throttle: 0, brake: 1, gear: 'D' });
  });

  it('S held until the car stops keeps it stopped for as long as that press lasts: it never reverses', () => {
    renderHook(() => useKeyboardControls());
    driveAt(12);
    press('KeyS');
    driveAt(0.4);
    expect(car()).toMatchObject({ gear: 'D', brake: 1, throttle: 0 });
    driveAt(0);
    press('KeyS', { repeat: true });   // the key repeating is the same press
    expect(car()).toMatchObject({ gear: 'D', brake: 1, throttle: 0 });
  });

  it('a fresh press of S once the car has stopped selects R and reverses; letting go leaves it in R', () => {
    renderHook(() => useKeyboardControls());
    driveAt(12);
    press('KeyS');
    driveAt(0.4);
    release('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 0, throttle: 0 });
    press('KeyS');
    expect(car()).toMatchObject({ gear: 'R', throttle: 1, brake: 0 });
    driveAt(-6);   // under way backwards: still reversing
    expect(car()).toMatchObject({ gear: 'R', throttle: 1, brake: 0 });
    release('KeyS');
    expect(car()).toMatchObject({ gear: 'R', throttle: 0, brake: 0 });
  });

  it('a press just after the brake is let go still counts as stopped: the car has only begun to creep', () => {
    renderHook(() => useKeyboardControls());
    driveAt(12);
    press('KeyS');
    driveAt(0.4);
    release('KeyS');
    driveAt(1.2);   // creeping forward, as an automatic does with the brake off
    press('KeyS');
    expect(car()).toMatchObject({ gear: 'R', throttle: 1, brake: 0 });
  });

  it('a car that is really moving is braked, not reversed', () => {
    renderHook(() => useKeyboardControls());
    driveAt(4);
    press('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 1, throttle: 0 });
  });

  it('a car rolling backwards in D, as on the hill, is braked by S, not reversed', () => {
    renderHook(() => useKeyboardControls());
    driveAt(-1.5);
    press('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 1, throttle: 0 });
  });

  it('W is the same the other way: it brakes a reversing car and holds it stopped; a fresh W goes to D', () => {
    renderHook(() => useKeyboardControls());
    act(() => useDriver.setState({ gear: 'R', speedKmh: -6 }));
    press('KeyW');
    expect(car()).toMatchObject({ gear: 'R', brake: 1, throttle: 0 });
    driveAt(-0.3);
    expect(car()).toMatchObject({ gear: 'R', brake: 1, throttle: 0 });
    release('KeyW');
    press('KeyW');
    expect(car()).toMatchObject({ gear: 'D', brake: 0, throttle: 1 });
  });

  it('W and S together only brake, and never change the gear', () => {
    renderHook(() => useKeyboardControls());
    press('KeyW');
    press('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 1, throttle: 0 });
  });

  it('W pressed while S holds the car goes once S is let go', () => {
    renderHook(() => useKeyboardControls());
    driveAt(12);
    press('KeyS');
    driveAt(0.4);
    press('KeyW');
    expect(car()).toMatchObject({ gear: 'D', brake: 1, throttle: 0 });
    release('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 0, throttle: 1 });
  });

  it('S pressed while W is held brakes without changing the gear', () => {
    renderHook(() => useKeyboardControls());
    press('KeyW');
    press('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 1, throttle: 0 });
    release('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 0, throttle: 1 });
  });

  it('the arrow keys mean the same as W and S', () => {
    renderHook(() => useKeyboardControls());
    press('ArrowDown');
    expect(car()).toMatchObject({ gear: 'R', throttle: 1 });
    release('ArrowDown');
    press('ArrowUp');
    expect(car()).toMatchObject({ gear: 'D', throttle: 1 });
  });

  it('the first time S holds the car stopped a notice says to press S again; not the second time', () => {
    renderHook(() => useKeyboardControls());
    driveAt(12);
    press('KeyS');
    expect(car().notice).toBeNull();
    driveAt(0.4);
    expect(car().notice?.key).toBe('pressAgain');
    act(() => useDriver.setState({ notice: null }));
    release('KeyS');
    driveAt(9);
    press('KeyS');
    driveAt(0.2);
    expect(car().notice).toBeNull();
  });

  it('R changes gear when stopped, in this mode too, and only when stopped', () => {
    renderHook(() => useKeyboardControls());
    driveAt(4);
    press('KeyR');
    expect(car().gear).toBe('D');
    expect(car().notice?.key).toBe('stopFirst');
    driveAt(0);
    press('KeyR');
    expect(car().gear).toBe('R');
    release('KeyR');
    press('KeyR');
    expect(car().gear).toBe('D');
  });

  it('touch is left alone: with no W or S held, a changing speed writes no pedals, gear or wheel', () => {
    renderHook(() => useKeyboardControls());
    act(() => useDriver.setState({ gear: 'R', throttle: 0.5, wheel: 0.6 }));
    driveAt(-3);
    driveAt(0);
    expect(car()).toMatchObject({ gear: 'R', throttle: 0.5, wheel: 0.6 });
  });
});

describe('realistic gears', () => {
  it('W is only the throttle and S only the brake; R is the one way to change gear, only when stopped', () => {
    useGearPref.setState({ pref: 'on' });
    renderHook(() => useKeyboardControls());
    act(() => useDriver.setState({ gear: 'D', speedKmh: 0, notice: null }));
    press('KeyS');
    expect(car()).toMatchObject({ gear: 'D', brake: 1 });
    release('KeyS');
    driveAt(4);
    press('KeyR');
    expect(car().gear).toBe('D');
    expect(car().notice?.key).toBe('stopFirst');
    driveAt(0);
    press('KeyR');
    expect(car().gear).toBe('R');
    press('KeyS');   // in R, S is still only the brake
    expect(car()).toMatchObject({ gear: 'R', brake: 1, throttle: 0 });
    release('KeyS');
    press('KeyW');   // and W is the throttle, so it reverses
    expect(car()).toMatchObject({ gear: 'R', throttle: 1, brake: 0 });
  });

  it('S holding the car stopped says nothing: the hint is for the automatic gears', () => {
    useGearPref.setState({ pref: 'on' });
    renderHook(() => useKeyboardControls());
    driveAt(12);
    press('KeyS');
    driveAt(0.4);
    expect(car().notice).toBeNull();
  });
});

describe('looking with Shift', () => {
  it('Shift+A and Shift+D look left and right like Q and E, while A and D keep steering', () => {
    renderHook(() => useKeyboardControls());
    const peek = (code: string) => { press(code); const seen = head(); release(code); return seen; };
    const q = peek('KeyQ');
    const e = peek('KeyE');
    expect(q.yaw).toBeGreaterThan(0);
    expect(e.yaw).toBeLessThan(0);
    press('KeyA');   // alone, A only steers
    expect(head()).toEqual({ yaw: 0, pitch: 0 });
    expect(car().wheel).toBe(1);
    press('ShiftLeft', { shiftKey: true });
    expect(head()).toEqual(q);
    expect(car().wheel).toBe(1);
    release('ShiftLeft');
    expect(head()).toEqual({ yaw: 0, pitch: 0 });
    expect(car().wheel).toBe(1);
    release('KeyA');
    expect(car().wheel).toBe(0);
    press('ShiftLeft', { shiftKey: true });
    press('KeyD', { shiftKey: true });
    expect(head()).toEqual(e);
    expect(car().wheel).toBe(-1);
    release('KeyD');
    release('ShiftLeft');
    expect(head()).toEqual({ yaw: 0, pitch: 0 });
    expect(car().wheel).toBe(0);
  });
});

describe("the learner's own keys (Settings)", () => {
  beforeEach(() => act(() => useKeys.getState().reset()));

  it('a key given to an action does it, the key it replaced does nothing, and the arrows still drive', () => {
    renderHook(() => useKeyboardControls());
    act(() => useKeys.getState().bind('go', 'KeyI'));
    press('KeyW');
    expect(car().throttle).toBe(0);
    release('KeyW');
    press('KeyI');
    expect(car().throttle).toBe(1);
    release('KeyI');
    press('ArrowUp');
    expect(car().throttle).toBe(1);
    release('ArrowUp');
  });

  it("taking another action's key swaps the two; Shift, Tab and the fixed keys cannot be taken; reset puts all back", () => {
    act(() => useKeys.getState().bind('go', 'KeyS'));
    expect(useKeys.getState().keys).toMatchObject({ go: 'KeyS', back: 'KeyW' });
    for (const code of ['ShiftLeft', 'Tab', 'Escape', 'ArrowUp']) act(() => useKeys.getState().bind('horn', code));
    expect(useKeys.getState().keys.horn).toBe('KeyH');
    act(() => useKeys.getState().reset());
    expect(useKeys.getState().keys).toEqual(DEFAULT_KEYS);
  });
});
