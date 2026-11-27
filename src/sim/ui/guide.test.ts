// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { advance, type Signals } from './guide';

const base: Signals = { speed: 0, gear: 'D', handbrake: false, wheel: 0, moved: false, detail: {}, along: 0 };
/** Feed the guide a drive, one reading at a time, keeping the step it has reached as the page does. */
const follow = (id: Parameters<typeof advance>[0], count: number, readings: Partial<Signals>[]) =>
  readings.reduce((done, r) => advance(id, count, done, { ...base, ...r }), 0);

describe('the practice guide', () => {
  it('hill start: each step comes up as the learner does the one before', () => {
    const rolling = { speed: 3, moved: true, detail: { onBand: true } };
    const stopped = { moved: true, detail: { onBand: true } };
    const held = { moved: true, handbrake: true, detail: { onBand: true, held: true } };
    const away = { moved: true, handbrake: false, speed: 2, detail: { onBand: true, held: true } };
    expect(follow('hill-start', 5, [{ speed: 8, moved: true }])).toBe(0);
    expect(follow('hill-start', 5, [rolling])).toBe(1);   // on the band, still rolling: stop next
    expect(follow('hill-start', 5, [rolling, stopped])).toBe(2);   // stopped on it: pull the handbrake
    expect(follow('hill-start', 5, [rolling, stopped, held])).toBe(3);   // held 2 s: pull away
    expect(follow('hill-start', 5, [rolling, stopped, held, away])).toBe(4);   // over the crest is left
  });

  it('a step never comes back, and the last one is left to the station ending', () => {
    const stopped = { moved: true, detail: { onBand: true } };
    const held = { moved: true, handbrake: true, detail: { onBand: true, held: true } };
    const away = { moved: true, handbrake: false, speed: 2, detail: { onBand: true, held: true } };
    expect(follow('hill-start', 5, [stopped, { ...stopped, speed: 5 }])).toBe(2);   // rolling again does not undo "stopped"
    expect(follow('hill-start', 5, [stopped, held, away, base, away])).toBe(4);   // nothing runs past the last step
  });

  it('side parking: reversing with the wheel hard right, then straightening, then the handbrake stop', () => {
    const reverse = { gear: 'R' as const, speed: -3, moved: true };
    const past = { speed: 4, moved: true };
    const stopped = { moved: true };
    expect(follow('side-parking', 6, [past])).toBe(1);   // moving past the bay: stop beside it next
    expect(follow('side-parking', 6, [past, stopped])).toBe(2);   // stopped: reverse in
    expect(follow('side-parking', 6, [past, stopped, { ...reverse, wheel: -1 }])).toBe(3);   // wheel hard right, reversing
    expect(follow('side-parking', 6, [past, stopped, { ...reverse, wheel: -1 }, { ...reverse, wheel: 0 }])).toBe(4);   // straightened
    expect(follow('side-parking', 6, [past, stopped, { ...reverse, wheel: -1 }, { ...reverse, wheel: 0 }, { detail: { inBay: true }, moved: true }])).toBe(5);
  });

  it('a curve follows the learner through it, in as many parts as it has steps', () => {
    expect(follow('s-curve', 5, [{ along: 0.05 }])).toBe(0);
    expect(follow('s-curve', 5, [{ along: 0.45 }])).toBe(2);
    expect(follow('s-curve', 5, [{ along: 1 }])).toBe(4);
    expect(follow('z-curve', 5, [{ along: 0.7 }, { along: 0.2 }])).toBe(3);   // never back
  });
});
