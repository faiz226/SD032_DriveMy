// ?autopilot=1, in development and performance builds only: the scripted assessment (pilot.ts) drives the real
// car through the same driver inputs as the keyboard; ?autopilot=faults drives the fault run. It is for the
// performance run and the demo capture; the page never saves a run it drove.
import type { VehicleSample } from '../contracts';
import { type Plan, Pilot } from '../physics/pilot';
import type { Controls } from '../physics/vehicle';

export const PERF_TOOLS = import.meta.env.DEV || import.meta.env.VITE_SIM_PERF === '1';

const IDLE: Controls = { throttle: 0, brake: 1, handbrake: true, gear: 'D', wheel: 0 };

export class Autopilot {
  private pilot = new Pilot();
  private plan: Plan | null = null;

  constructor(private faults = false) {}

  /** After each physics step: what the car did, and the controls for the next step. */
  next(sample: VehicleSample, dt: number): Controls {
    this.pilot.observe(sample, dt);
    this.plan ??= this.pilot.assessment(this.faults);
    const c = this.plan.next();
    return c.done ? IDLE : c.value;
  }
}
