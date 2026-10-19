// The Swift in the scene: its Rapier vehicle, the body, four wheels, the turning steering wheel and
// the driver's eye. It reads the driver's inputs every physics step and reports each step as the rules
// engine sees it.
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useAfterPhysicsStep, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SimEvent, Vec2, VehicleSample } from '../contracts';
import { circuit } from '../data';
import { useDriver, useHead } from '../input';
import { TIERS, type TierSpec } from '../quality';
import { getWorld } from '../world/build';
import { collidersOf } from '../world/colliders';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { Cluster } from './Cluster';
import { MirrorView } from './MirrorView';
import { Vehicle } from './vehicle';

export interface CarApi {
  /** Put the car at a start point, stopped: a practice restart. Nothing reloads. */
  teleport(at: Vec2, heading: number): void;
  vehicle(): Vehicle | null;
  /** The car in the scene, for the sun's shadow to follow. */
  group(): THREE.Group | null;
}

interface Props {
  /** The quality tier: which files, clearcoat, shadows and how the mirrors render. */
  quality?: TierSpec;
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
const EYE_ROTATION: [number, number, number, 'YXZ'] = [EYE_PITCH, -Math.PI / 2, 0, 'YXZ'];
const HEAD_EASE_S = 0.12;  // how quickly the head turns to where it is asked to look
// The head leans as it turns, as a driver's does (metres). Measured off the model: the door is so high
// that from the seat no road shows within 0.9 m of the car's side. Leaning 0.24 m toward the driver's
// glass (0.34 m away), forward past the B-pillar and up over the door's edge, it shows from 0.6 m out,
// where the hill's yellow band meets the kerb. Every pose keeps the eye 5 cm clear of the cabin.
const LEAN = { side: 0.34, right: 0.24, left: 0.12, forward: 0.45, up: 0.09 };

function poseAt(at: Vec2, heading: number) {
  const ground = getWorld(circuit).surfaceHeight(at[0], at[1]);
  return { x: at[0], y: ground + CAR.wheelRadius + 0.02, z: -at[1], yaw: heading };
}

export const SwiftCar = forwardRef<CarApi, Props>(function SwiftCar({ quality = TIERS.low, start, firstPerson, onStep, fov = 50, mirrors = true, onReady }, ref) {
  const { rapier, world } = useRapier();
  const getThree = useThree((s) => s.get);
  const files = CAR.files(quality.tier);
  const body = useGLTF(files.body);
  const wheel = useGLTF(files.wheel);
  const steering = useGLTF(files.steering);
  const { shadows, clearcoat } = quality;
  // Low tier: the paint's clearcoat goes (its own shader pass). Medium: the car casts the sun's shadow.
  const bodyScene = useMemo(() => {
    const scene = body.scene.clone(true);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = shadows;
      const m = mesh.material as THREE.MeshPhysicalMaterial;
      if (!clearcoat && m.clearcoat) {
        const plain = m.clone();
        plain.clearcoat = 0;
        mesh.material = plain;
      }
    });
    return scene;
  }, [body.scene, shadows, clearcoat]);
  // the car takes more of the sky's light than the yard does; the materials are this car's alone. Not the
  // mirror glass, which would show the sky as a white card: the HUD's mirrors are the ones that reflect.
  useEffect(() => {
    for (const scene of [bodyScene, steering.scene]) {
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (m?.isMeshStandardMaterial) m.envMapIntensity = m.name === 'Mirrors' ? 0.4 : CAR.cabinLight;
      });
    }
  }, [bodyScene, steering.scene]);
  const wheelScenes = useMemo(() => [0, 1, 2, 3].map(() => {
    const scene = wheel.scene.clone(true);   // shares geometry and materials
    scene.traverse((o) => { o.castShadow = shadows; });
    return scene;
  }), [wheel.scene, shadows]);
  const blob = useMemo(() => (shadows ? null : blobTexture()), [shadows]);

  const car = useRef<THREE.Group>(null);
  const rim = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const vehicle = useRef<Vehicle | null>(null);
  const clock = useRef(0);
  const kmh = useRef(0);   // every step's road speed, for the dials
  const eye = useRef<THREE.PerspectiveCamera>(null);
  const head = useRef({ yaw: 0, pitch: 0 });
  const speed = useCallback(() => kmh.current, []);
  const startRef = useRef(start);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const v = new Vehicle(rapier, world, poseAt(startRef.current.at, startRef.current.heading));
    vehicle.current = v;
    // compile the scene's shaders now, off the main thread where the browser can, so the first driven
    // frames do not stall on them; then the car is ready
    let live = true;
    const { gl, scene, camera } = getThree();
    const ready = () => { if (live) onReadyRef.current?.(); };
    gl.compileAsync(scene, camera).then(ready, ready);
    return () => {
      live = false;
      v.dispose();
      vehicle.current = null;
    };
  }, [rapier, world, getThree]);

  useImperativeHandle(ref, () => ({
    teleport(at, heading) {
      vehicle.current?.teleport(poseAt(at, heading));
    },
    vehicle: () => vehicle.current,
    group: () => car.current,
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
    kmh.current = sample.speedKmh;
    // the readout and the stop-first rule need 0.5 km/h, not every step: each publish re-renders the HUD
    const was = useDriver.getState().speedKmh;
    if (Math.round(was * 2) !== Math.round(sample.speedKmh * 2) || (Math.abs(was) < 1) !== (Math.abs(sample.speedKmh) < 1)) {
      useDriver.setState({ speedKmh: sample.speedKmh });
    }
    const poles = collidersOf(world)?.poles;
    onStepRef.current?.(sample, poles ? v.poleHits(poles, clock.current) : [], DT);
  });

  useFrame((_, dt) => {
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
    // the driver's head, eased toward where it is asked to look (input.ts, useHead)
    const cam = eye.current;
    if (cam) {
      const want = useHead.getState();
      const k = 1 - Math.exp(-dt / HEAD_EASE_S);
      head.current.yaw += (want.yaw - head.current.yaw) * k;
      head.current.pitch += (want.pitch - head.current.pitch) * k;
      const { yaw, pitch } = head.current;
      cam.rotation.set(EYE_PITCH + pitch, -Math.PI / 2 + yaw, cam.rotation.z, 'YXZ');   // z is the fault kick's (scene.tsx)
      // turning alone moves the head a little; looking down out of the driver's window takes it to the glass
      const turn = Math.sin(yaw);
      const down = Math.min(1, Math.max(0, -pitch) / 0.45);
      const side = turn > 0 ? Math.min(LEAN.left, LEAN.side * turn) : -Math.min(LEAN.right, -LEAN.side * turn) * (0.3 + 0.7 * down);   // + is left
      cam.position.set(CAR.eye[0] + LEAN.forward * Math.abs(side), CAR.eye[1] + LEAN.up * down * Math.abs(turn), CAR.eye[2] - side);
    }
  });

  const tilt = THREE.MathUtils.degToRad(CAR.steering.columnTiltDeg);
  return (
    <group ref={car}>
      <primitive object={bodyScene} />
      <Cluster body={bodyScene} speed={speed} />
      {blob && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -CAR.wheelRadius + 0.015, 0]} renderOrder={-1}>
          <planeGeometry args={[CAR.config.length_m + 0.5, CAR.config.width_body_m + 0.5]} />
          <meshBasicMaterial map={blob} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
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
        <PerspectiveCamera ref={eye} makeDefault position={CAR.eye} rotation={EYE_ROTATION} fov={fov} near={0.05} far={600} />
      )}
      {firstPerson && mirrors && <MirrorView car={car} body={bodyScene} {...quality.mirrors} />}
    </group>
  );
});

/** A soft dark patch under the car: the Low tier's shadow, painted once instead of rendered every frame. */
function blobTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d')!;
  const fill = g.createRadialGradient(64, 32, 4, 64, 32, 62);
  fill.addColorStop(0, 'rgba(0,0,0,0.55)');
  fill.addColorStop(0.6, 'rgba(0,0,0,0.35)');
  fill.addColorStop(1, 'rgba(0,0,0,0)');
  g.setTransform(1, 0, 0, 0.5, 0, 16);   // an ellipse, long along the car
  g.fillStyle = fill;
  g.fillRect(0, -32, 128, 128);
  return new THREE.CanvasTexture(c);
}
