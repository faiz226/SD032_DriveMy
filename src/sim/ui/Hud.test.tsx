import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { en } from '@/lib/translations/en';
import { DrillDone } from './Hud';

describe('practice: a drill that is over', () => {
  it('says why an attempt did not count and how to fix it, and offers the next station (the testers, 2 Nov)', () => {
    const on = { onRestart: vi.fn(), onNext: vi.fn(), onStations: vi.fn() };
    render(<DrillDone station={{ id: 'road-merging', status: 'waiting', startedAt: null, timeLimitS: null, detail: { voids: 1, voidKey: 'merge.slow' } }} {...on} />);
    expect(screen.getByText(new RegExp(en['sim.hud.voided']))).toBeTruthy();
    expect(screen.getByText(en['sim.fault.merge.slow'])).toBeTruthy();
    expect(screen.getByText(en['sim.fix.merge.slow'])).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: en['sim.hud.nextStation'] }));
    expect(on.onNext).toHaveBeenCalledOnce();
  });
});
