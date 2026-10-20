// DriveMy v2: the contracts between the simulator's modules.
// Copy to src/sim/contracts.ts unchanged. Each work package builds against these types, so the
// rules (sim/core), world (sim/world), car (sim/physics) and screens (sim/ui) can be built in
// parallel and meet in the middle. Change a type only by editing this file and saying so in the
// work package's report.
//
// FRAME. Everything sim/core sees is in the circuit frame of docs/circuit-v2/circuit.json:
// metres, x = east, y = north, z = up; heading in radians, counter-clockwise from +x.
// three.js is y-up: X = x, Y = z, Z = -y, and a three.js yaw (about +Y) equals the circuit heading.

// ---------------------------------------------------------------- data files (shapes only)

export type Vec2 = [number, number];
export type Polygon = Vec2[];

export interface Gate { id: string; s?: number; a: Vec2; b: Vec2; heading_deg: number }

export interface StationGeometry {
  id: StationId;
  order: number;            // 1..8
  title: string;
  s_from: number;           // metres along route.samples where the station starts
  s_to: number;             // ... and ends
  gates: Gate[];
  slope?: 'hill' | 'ramp';
  stop_line_height?: number;
  stop_band?: { s_from: number; s_to: number; note: string };
  pocket?: Polygon;
  bay?: { centre: Vec2; axis_deg: number; length: number; width: number; kerbed?: boolean };
  box?: Polygon;            // three-point turn: the turning box in its lane; ramp test: the ramp's footprint
  width?: number;
  depth?: number;
  legs?: Polygon[];
  fillets?: Polygon[];
  flares?: Polygon[];
  pole?: Vec2;              // ramp-test
  axis?: { start: Vec2; heading_deg: number };   // ramp-test: the ramp's centreline, pointing up the slope
  manoeuvre?: string;
  note?: string;
  start: { at: Vec2; heading_deg: number };   // practice: the car appears here; the map is never reloaded
}

export interface Slope {
  /** The twins are the other learners' tracks beside ours (the owner, 20 Oct): scenery, never marked. */
  id: 'hill' | 'ramp' | 'hill-twin' | 'ramp-twin';
  start: Vec2;
  heading_deg: number;
  width: number;
  profile: [number, number][];   // [metres along the axis, height]
  sides: string;
}

export interface CircuitData {
  schema: 'drivemy.circuit/2';
  units: 'metres';
  site: { bounds: [number, number, number, number] };
  pavement: Polygon[];        // even-odd: ring 0 is the yard edge, every other ring is a hole
  pavement_rule: string;
  kerbs: { height: number; width: number; placement: string; rings: Polygon[] };
  slopes: Slope[];
  stations: StationGeometry[];
  junctions: { id: string; polygon: Polygon; note: string }[];   // where the route may cross itself
  route: {
    columns: string[];
    samples: [number, number, number, number, number, string][];
    // Where the line jumps: the car reverses into the side bay, and turns round. Track progress by
    // the nearest sample ahead of the last one, so jumps and crossings never confuse it.
    manoeuvres: { station: StationId; s_from: number; s_to: number; note: string }[];
  };
  obstacles: { poles: { station: StationId; at: Vec2; radius: number; height: number; base_z?: number; status: string }[]; cones: [] };
  /**
   * Road markings: broken centre lines on the two-way roads (polylines), never on the stations; yellow edge
   * lines; stop and give-way lines; direction arrows (kind: the movements, of 'L', 'S', 'R'); chevron areas
   * (heading_deg: the way traffic flows past them); zebra crossings.
   */
  markings?: {
    centre_lines: Vec2[][]; dash: number; gap: number; width: number; note?: string;
    edge_lines?: Vec2[][]; stop_lines?: Vec2[][]; give_way?: Vec2[][];
    arrows?: { at: Vec2; heading_deg: number; kind: string; junction: string }[];
    chevrons?: { polygon: Polygon; heading_deg: number; note?: string }[];
    zebras?: Zebra[];
  };
  /** The other cars, the signals, the merge and the stations' queues (the owner, 20 Oct): docs/circuit-v2/traffic_gen.py. */
  traffic?: TrafficData;
  props: {
    booths: { centre: Vec2; size: Vec2; heading_deg: number }[]; office: { centre: Vec2; size: Vec2; heading_deg: number }; fence: number[];
    /** Other learners' cars, stopped mid-test on the twin tracks: `at` is the car's centre, the wheelbase's middle. */
    npc_cars?: { on: string; at: Vec2; heading_deg: number }[];
  };
  spawn: { at: Vec2; heading_deg: number; handbrake: boolean };
  parameters: Record<string, { value: unknown; source: string; note: string }>;
}

export interface Zebra { centre: Vec2; heading_deg: number; length: number; width: number; stripe: number; gap: number; note?: string }

export type SignalGroup = 'ew' | 'ns';

export interface TrafficData {
  /** Closed lane paths the other cars drive, keeping left; points every 0.5 m. */
  loops: { id: string; kmh: number; cars: number; points: Vec2[]; length: number; note?: string }[];
  /** Where roads meet: the other cars take a box one at a time, and give way to the learner. */
  junctions: { id: string; polygon: Polygon; signal?: string; merge?: boolean }[];
  signals: {
    id: string; junction: string; offset_s: number;
    phases: Record<SignalGroup, { green: number; amber: number; all_red: number }>;
    approaches: { group: SignalGroup; heading_deg: number; stop: Vec2[] }[];
    heads: { at: Vec2; heading_deg: number; group: SignalGroup }[];
  }[];
  /** The last station joins the outer loop's traffic, which has priority: conflict_s and window are along that loop. */
  merge: { give_way: Vec2[]; heading_deg: number; loop: string; conflict_point: Vec2; conflict_s: number; window: [number, number]; gap_s: number; junction: string; note?: string };
  /** Where each station's queue stops (the rear axle at `at`, the front bumper at `front`) and its marker pole. */
  waiting: { station: StationId; s: number; at: Vec2; heading_deg: number; front: Vec2; pole: Vec2; pole_side: 'left' | 'right'; pole_gap: number }[];
  zebra: Zebra;
  parameters: Record<string, { value: unknown; source: string; note: string }>;
}

export type StationId =
  | 'hill-start' | 'side-parking' | 'parallel-parking' | 'three-point-turn'
  | 's-curve' | 'z-curve' | 'ramp-test' | 'road-merging';

// rules.json is typed loosely here; sim/core narrows it and must not hard-code its numbers.
export interface RulesData {
  schema: 'drivemy.rules/1';
  label: string;
  verdict: { fail_at_demerits: number; end_run_at_fail: boolean };
  demerits: Record<'cone' | 'pole' | 'rollback' | 'not_in_bay' | 'kerb' | 'stall' | 'centre_line', { points: number; basis: string; limit_m?: number; rule?: string; ends_run?: boolean }>;
  stations: Record<StationId, Record<string, unknown> & { time_limit_s: number | null; basis?: string }>;
  modes: Record<'assessment' | 'practice', Record<string, unknown>>;
}

// The car config: docs/circuit-v2/car-swift-2022.json. WP3 extends it into src/sim/physics/cars/swift-2022.ts.
export interface CarConfig {
  name: string;
  length_m: number;
  width_body_m: number;
  width_mirrors_m: number;
  wheelbase_m: number;
  track_m: number;
  tyre_radius_m: number;
  tyre_width_m: number;
  front_overhang_m: number;
  steer_lock_rad: number;
}

// ---------------------------------------------------------------- physics -> rules

/** One physics step, already converted to the circuit frame. Produced by sim/physics (WP3). */
export interface VehicleSample {
  t: number;                 // seconds since the run started (paused time excluded)
  x: number; y: number; z: number;   // rear-axle centre
  heading: number;           // radians, CCW from +x
  speedKmh: number;          // horizontal speed only, signed: + forward, - backward
  gear: 'D' | 'R';
  handbrake: boolean;
  brake: number;             // 0..1
  steer: number;             // road-wheel angle, radians, + = left
  wheels: [WheelSample, WheelSample, WheelSample, WheelSample];   // FL, FR, RL, RR
  slope: { id: 'hill' | 'ramp'; along: number } | null;          // along = metres along the slope axis
}

export interface WheelSample { x: number; y: number; z: number; onKerb: number | null }  // kerb ring index or null

/** Discrete things that happened during the step. */
export type SimEvent =
  | { type: 'kerb-contact'; wheel: 0 | 1 | 2 | 3; ring: number; t: number; at: Vec2 }
  | { type: 'obstacle-hit'; kind: 'pole' | 'cone'; index: number; t: number; at: Vec2 };

// ---------------------------------------------------------------- rules -> screens

export type Mode = 'assessment' | 'practice';

export interface Fault {
  kind: 'cone' | 'pole' | 'rollback' | 'not_in_bay' | 'kerb' | 'station_failed' | 'centre_line';
  station: StationId;
  points: number;            // 0 for station_failed (it fails the run by itself)
  at: Vec2;                  // where it happened, for the verdict's small map
  t: number;
  measured?: string;         // e.g. "rolled back 0.34 m"
  limit?: string;            // e.g. "0.30 m"
  reasonKey: string;         // i18n key, e.g. "fault.hill.rollback"
  fixKey: string;            // i18n key for the one corrective action
  basis: string;             // from rules.json, shown on request
}

export type StationStatus = 'waiting' | 'armed' | 'cleared' | 'failed';

export interface StationProgress {
  id: StationId;
  status: StationStatus;
  startedAt: number | null;
  timeLimitS: number | null;
  detail: Record<string, number | string | boolean>;   // e.g. { movements: 2, heldS: 1.4 }
}

export interface SessionState {
  mode: Mode;
  current: StationId | null;           // the only armed station; null after the last
  stations: StationProgress[];         // in order
  demerits: number;
  faults: Fault[];
  ended: boolean;
  topDownSeconds: number;              // time the top-down view was on (assessment reports it, no penalty)
  verdict: null | { pass: boolean; demerits: number; failedStations: StationId[]; faults: Fault[]; topDownSeconds: number };
}

/** sim/core's public API. Pure TypeScript: no React, no three.js, no Rapier. */
export interface Session {
  step(sample: VehicleSample, events: SimEvent[], dt: number, topDownOn: boolean): SessionState;
  restartStation(id: StationId): { at: Vec2; heading: number };   // practice only: stations[id].start, to teleport to
  state(): SessionState;
}

export type CreateSession = (circuit: CircuitData, rules: RulesData, car: CarConfig, mode: Mode, only?: StationId) => Session;
