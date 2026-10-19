import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Fault } from '../contracts';
import routeSrc from '@/pages/Simulation3DView.tsx?raw';
import pageSrc from './SimulatorPage.tsx?raw';
import { type Verdict, VerdictView } from './Verdict';

const fault = (over: Partial<Fault>): Fault => ({
  kind: 'pole', station: 'side-parking', points: 20, at: [29.2, 11.3], t: 90,
  reasonKey: 'sim.fault.pole', fixKey: 'sim.fix.pole', basis: 'rubric: touching a pole fails the element', ...over,
});

const failing: Verdict = {
  pass: false,
  demerits: 25,
  failedStations: ['side-parking'],
  faults: [
    fault({}),
    fault({ kind: 'kerb', station: 's-curve', points: 5, at: [60, 20], reasonKey: 'sim.fault.kerb', fixKey: 'sim.fix.kerb', basis: 'kerb basis' }),
    fault({ kind: 'station_failed', station: 'road-merging', points: 0, at: [110, 5], measured: '12 km/h', limit: '15 km/h', reasonKey: 'sim.fault.merge.slow', fixKey: 'sim.fix.merge.slow', basis: 'prd' }),
  ],
  topDownSeconds: 42.4,
};

const passing: Verdict = { pass: true, demerits: 5, failedStations: [], faults: [failing.faults[1]], topDownSeconds: 0 };

const noop = { onRetry: vi.fn(), onPractise: vi.fn(), onExit: vi.fn() };

describe('the verdict', () => {
  it('shows what the session decided: fail, the demerits, the stations not cleared and the top-down seconds', () => {
    render(<VerdictView verdict={failing} save="saved" {...noop} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fail');
    expect(screen.getByText(/The fail line is 20/)).toBeInTheDocument();
    expect(screen.getByText(/Not cleared: Side Parking/i)).toBeInTheDocument();
    expect(screen.getByText('Top-down view on for 42 s. No penalty.')).toBeInTheDocument();
    expect(screen.getByText('Result saved successfully.')).toBeInTheDocument();
  });

  it('gives each fault its station, a numbered map marker, the measured value against the limit, one fix and its basis', () => {
    const { container } = render(<VerdictView verdict={failing} save={null} {...noop} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('The car touched a pole.')).toBeInTheDocument();
    expect(screen.getByText('Measured 12 km/h. Limit 15 km/h.')).toBeInTheDocument();
    expect(screen.getByText('Build speed on the approach. Join at road speed.')).toBeInTheDocument();
    expect(screen.getByText('rubric: touching a pole fails the element')).toBeInTheDocument();
    expect(screen.getAllByText('Why this rule?')).toHaveLength(3);
    const map = screen.getByRole('img', { name: 'Where each fault happened' });
    expect(map.querySelectorAll('circle[fill="rgb(var(--berhenti))"]')).toHaveLength(3);
    expect(container).toBeTruthy();
  });

  it('a pass reads as a pass', () => {
    render(<VerdictView verdict={passing} save={null} {...noop} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pass');
    expect(screen.getByText('All eight stations cleared.')).toBeInTheDocument();
  });

  it('no button can pass a run: they only retry, practise the failed station or leave', () => {
    const calls = { onRetry: vi.fn(), onPractise: vi.fn(), onExit: vi.fn() };
    render(<VerdictView verdict={failing} save={null} {...calls} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Try the assessment again', 'Practise Side Parking', 'Leave simulator']);
    for (const b of buttons) fireEvent.click(b);
    expect(calls.onRetry).toHaveBeenCalledOnce();
    expect(calls.onPractise).toHaveBeenCalledWith('side-parking');
    expect(calls.onExit).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fail');
  });

  it('the old manual pass is gone from the simulator route', () => {
    const page = routeSrc + pageSrc;
    for (const banned of ['Finish Maneuver', 'simulateSuccess', 'addSimulatedError', 'passed: true']) expect(page).not.toContain(banned);
    // the verdict on screen is the run store's, which only the rules session writes
    expect(page).toContain('const verdict = useRun((s) => s.state.verdict);');
  });
});
