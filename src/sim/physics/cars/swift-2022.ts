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
};
