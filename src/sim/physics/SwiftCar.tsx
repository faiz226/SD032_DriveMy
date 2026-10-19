// The Swift in the scene: its Rapier vehicle, the body, four wheels, the turning steering wheel and
// the driver's eye. It reads the driver's inputs every physics step and reports each step as the rules
// engine sees it.
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useAfterPhysicsStep, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SimEvent, Vec2, VehicleSample } from '../contracts';
import { circuit } from '../data';
import { useDriver } from '../input';
import { getWorld } from '../world/build';
import { collidersOf } from '../world/colliders';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { MirrorView } from './MirrorView';
import { Vehicle } from './vehicle';

export interface CarApi {
  /** Put the car at a start point, stopped: a practice restart. Nothing reloads. */
  teleport(at: Vec2, heading: number): void;
  vehicle(): Vehicle | null;
}

interface Props {
  tier?: 'low' | 'medium';
  start: { at: Vec2; heading: number };
  firstPerson: boolean;
  /** Every physics step, in the circuit frame, with the step's events. */
  onStep?: (sample: VehicleSample, events: SimEvent[], dt: number) => void;
  fov?: number;
  /** The three mirrors, in the first-person view. */
  mirrors?: boolean;
  /** The car's files have loaded and its vehicle exists. */
  onReady?: () => void;
}

const DT = CAR.drive.dt;
const EYE_PITCH = -0.07;   // a little nose-down, so the bonnet line shows

function poseAt(at: Vec2, heading: number) {
  const ground = getWorld(circuit).surfaceHeight(at[0], at[1]);
  return { x: at[0], y: ground + CAR.wheelRadius + 0.02, z: -at[1], yaw: heading };
}

export const SwiftCar = forwardRef<CarApi, Props>(function SwiftCar({ tier = 'low', start, firstPerson, onStep, fov = 50, mirrors = true, onReady }, ref) {
  const { rapier, world } = useRapier();
  const files = CAR.files(tier);
  const body = useGLTF(files.body);
  const wheel = useGLTF(files.wheel);
  const steering = useGLTF(files.steering);
  const wheelScenes = useMemo(() => [0, 1, 2, 3].map(() => wheel.scene.clone(true)), [wheel.scene]);   // shares geometry and materials

  const car = useRef<THREE.Group>(null);
  const rim = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const vehicle = useRef<Vehicle | null>(null);
  const clock = useRef(0);
  const startRef = useRef(start);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const v = new Vehicle(rapier, world, poseAt(startRef.current.at, startRef.current.heading));
    vehicle.current = v;
    onReadyRef.current?.();
    return () => {
      v.dispose();
      vehicle.current = null;
    };
  }, [rapier, world]);

  useImperativeHandle(ref, () => ({
    teleport(at, heading) {
      vehicle.current?.teleport(poseAt(at, heading));
    },
    vehicle: () => vehicle.current,
  }), []);

  useBeforePhysicsStep(() => {
    const d = useDriver.getState();
    vehicle.current?.beforeStep({ throttle: d.throttle, brake: d.brake, handbrake: d.handbrake, gear: d.gear, wheel: d.wheel });
  });

  useAfterPhysicsStep(() => {
    const v = vehicle.current;
    if (!v) return;
    clock.current += DT;
    const before = v.sample(clock.current, circuit, CAR.config.tyre_width_m);
    v.afterStep(before.slope !== null);
    const sample = v.sample(clock.current, circuit, CAR.config.tyre_width_m);
    useDriver.setState({ speedKmh: sample.speedKmh });
    const poles = collidersOf(world)?.poles;
    onStepRef.current?.(sample, poles ? v.poleHits(poles, clock.current) : [], DT);
  });

  useFrame(() => {
    const v = vehicle.current;
    const g = car.current;
    if (!v || !g) return;
    const p = v.body.translation();
    const q = v.body.rotation();
    g.position.set(p.x, p.y, p.z);
    g.quaternion.set(q.x, q.y, q.z, q.w);
    for (let i = 0; i < 4; i++) {
      const w = wheels.current[i];
      if (!w) continue;
      const c = v.ctl.wheelChassisConnectionPointCs(i);
      const len = v.ctl.wheelSuspensionLength(i) ?? 0;
      if (c) w.position.set(c.x, c.y - len, c.z);
      w.rotation.set(0, v.ctl.wheelSteering(i) ?? 0, -(v.ctl.wheelRotation(i) ?? 0), 'YZX');
    }
    // the rim turns at 9x the road wheels; a left input turns it anticlockwise as the driver sees it
    if (rim.current) rim.current.rotation.x = -v.steer * CAR.steering.rackRatio;
  });

  const tilt = THREE.MathUtils.degToRad(CAR.steering.columnTiltDeg);
  return (
    <group ref={car}>
      <primitive object={body.scene} />
      {wheelScenes.map((scene, i) => (
        <group key={i} ref={(el) => { wheels.current[i] = el; }}>
          {/* the right-hand wheels are the same wheel turned round, never mirrored */}
          <group rotation={[0, i % 2 ? Math.PI : 0, 0]}>
            <primitive object={scene} />
          </group>
        </group>
      ))}
      <group position={CAR.steering.hub} rotation={[0, 0, -tilt]}>
        <group ref={rim}>
          <primitive object={steering.scene} />
        </group>
      </group>
      {firstPerson && (
        <PerspectiveCamera makeDefault position={CAR.eye} rotation={[EYE_PITCH, -Math.PI / 2, 0, 'YXZ']} fov={fov} near={0.05} far={600} />
      )}
      {firstPerson && mirrors && <MirrorView car={car} />}
    </group>
  );
});
