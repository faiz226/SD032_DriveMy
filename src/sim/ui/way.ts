// The way arrow's geometry (the testers, 2 Nov: "I couldn't follow the next direction without the top-down view"):
// where the route lies a few seconds ahead of the car, and which way that is from the car.
import type { Vec2 } from '../contracts';
import { circuit } from '../data';
import { toDeg, wrapPi } from '../geom';
import type { Pose } from './run';

const S = circuit.route.samples;

/** The route's point `s` metres along it. */
export function routeAt(s: number): Vec2 {
  const i = S.findIndex((q) => q[0] >= s);
  const q = S[i < 0 ? S.length - 1 : i];
  return [q[1], q[2]];
}

/** The CSS rotation that turns a right-pointing arrow towards `at` as seen from the car: -90 is straight ahead. */
export const wayTurnDeg = (pose: Pose, at: Vec2) =>
  -90 - toDeg(wrapPi(Math.atan2(at[1] - pose.at[1], at[0] - pose.at[0]) - pose.heading));
