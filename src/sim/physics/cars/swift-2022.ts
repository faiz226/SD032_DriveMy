// The 2022 Suzuki Swift 1.2 GLX: right-hand drive, CVT automatic.
// Positions are measured off the built model by scripts/swift_web.py (public/sim/cars/swift-2022/
// measure.json), in the car frame: x forward, y up, z to the right; origin at the wheelbase centre,
// at wheel-centre height.
import type { CarConfig } from '../../contracts';
import base from '../../../../docs/circuit-v2/car-swift-2022.json';
import { carFiles } from '../../assets';
import { SWIFT_DRIVE } from '../drive';

type V3 = [number, number, number];

export const SWIFT_2022 = {
  config: base as CarConfig,
  drive: SWIFT_DRIVE,
  published: { massKg: 900, powerKw: 61, torqueNm: 113, gearbox: 'CVT' },
  files: carFiles,
  wheelRadius: 0.324,
  axle: { front: 1.2251, rear: -1.2251, halfTrack: 0.7466 },
  steering: {
    hub: [0.3549, 0.6352, 0.3295] as V3,
    columnTiltDeg: 23.53,
    rimRadius: 0.168,
    rackRatio: 9,                       // rim angle = road-wheel angle x 9
  },
  // 1.20 m above the road, on the steering hub's line (0.33 m right of centre), 0.62 m behind the hub
  eye: [0.3549 - 0.62, 1.2 - 0.324, 0.3295] as V3,
  mirrors: {
    left: [0.5349, 0.7607, -0.839] as V3,
    right: [0.5349, 0.7607, 0.839] as V3,
    interior: [0.4747, 0.9705, 0.0002] as V3,
  },
  // How much of the sky's light (World.tsx, Daylight) the car takes, against the yard's 1: the cabin's
  // black plastics read as black at 1, as a camera's auto-exposure would not let them.
  cabinLight: 2.2,
  // The instrument binnacle: the car's decal material within `radius` of `at`, measured off the model
  // (0.281 m wide, 0.125 m tall, tilted back). Each dial: its centre as fractions of that face (left to
  // right, top to bottom), where its needle points at zero and how far it turns per unit, in degrees
  // clockwise from pointing right. Fitted to the numerals printed on the model's own dial artwork, within
  // 1.6 degrees: the speedometer reads to 220 km/h and is the right dial, the rev counter the left.
  cluster: {
    material: 'Sticker',
    at: [0.68, 0.649, 0.329] as V3,
    radius: 0.18,
    speedo: { at: [0.8215, 0.5985] as [number, number], zeroDeg: 88.3, degPerUnit: 1.2497, max: 220 },
    tacho: { at: [0.1731, 0.6037] as [number, number], zeroDeg: 86.4, degPerUnit: 0.034693, max: 8000 },
  },
};
