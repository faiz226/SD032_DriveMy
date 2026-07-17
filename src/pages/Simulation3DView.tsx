import { useState, useCallback, useRef, Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas, useFrame, createPortal, useThree } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera, useFBO, Environment, Sky } from "@react-three/drei";
import { EffectComposer, Bloom, SMAA } from "@react-three/postprocessing";
import { Physics, RigidBody, RapierRigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { ArrowLeft, Play, Lightbulb, Gear, Disc, CheckCircle } from "phosphor-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useSaveSimulationResult } from "@/hooks/useResults";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SimulationHUD } from "@/components/simulation/SimulationHUD";
import { SimulationResults } from "@/components/simulation/SimulationResults";
import { MobileControls } from "@/components/simulation/MobileControls";
import { JPJCircuit } from "@/components/simulation/JPJCircuit";
import { useCarStore } from "@/stores/carStore";
import { syncSimulationResults } from "@/services/results.service";

// ── GLTF Model Preloading ───────────────────────────────────────────────────
useGLTF.preload("/toyota-corolla-e170-2017.glb");

function useKeys() {
  const { setAccelerating, setReversing, setSteering, setBraking, setGear, gear } = useCarStore();
  
  // Track gear separately to avoid dependency loop in effect
  const gearRef = useRef(gear);
  useEffect(() => { gearRef.current = gear; }, [gear]);

  useEffect(() => {
    const activeKeys = new Set<string>();
    
    const updateStore = () => {
      setAccelerating(activeKeys.has('w') || activeKeys.has('ArrowUp'));
      setReversing(activeKeys.has('s') || activeKeys.has('ArrowDown'));
      setBraking(activeKeys.has(' '));
      
      let steer = 0;
      if (activeKeys.has('a') || activeKeys.has('ArrowLeft')) steer += 1;
      if (activeKeys.has('d') || activeKeys.has('ArrowRight')) steer -= 1;
      setSteering(steer);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      activeKeys.add(e.key);
      
      // Simple gear shifting logic for testing (Shift Up/Down)
      if (e.key === 'e') {
        setGear(Math.min(gearRef.current + 1, 5));
      }
      if (e.key === 'q') {
        setGear(Math.max(gearRef.current - 1, -1));
      }
      
      updateStore();
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key);
      updateStore();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setAccelerating, setReversing, setSteering, setBraking, setGear]);
}

// ── Driver seat & mirror offsets (relative to car body centre) ────────────────
// At scale=1.0 the Corolla is 2.06m wide, 1.74m tall, 4.43m long.
// Driver seat (Right-hand drive, flipped):
//   X: 0.35 (right of centre), Y: 0.75 (seat eye height), Z: -0.1 (forward of the headrest)
const DRIVER_POS = new THREE.Vector3(0.35, 0.75, -0.1);

// ── Reusable mirror (FBO) ─────────────────────────────────────────────────────
// Each mirror owns an off-screen PerspectiveCamera that renders the scene into
// its own FBO, and a display plane that shows that texture. The display plane
// is a CHILD of the car RigidBody, so the R3F scene graph moves/turns it with
// the car for free — no manual world-space sync, no one-frame lag, no drift.
//
// The off-screen render camera is NOT parented (it must not inherit the body's
// scale/visibility quirks); instead we derive its world position + lookAt each
// frame from the display plane's own matrixWorld, which the scene graph has
// already updated to the body's current transform. Reading matrixWorld means we
// never hand-compute the body transform — we just trust the graph, so there is
// no chance of double-applying it.
//
// To save GPU on mobile, each mirror only re-renders its FBO every 3rd frame.
//
// `camLocal`   — offset of the render camera from the display plane, in
//                PLANE-LOCAL space (so the camera sits behind/above its glass).
// `lookLocal`  — offset of the look-at point from the display plane, in
//                PLANE-LOCAL space (points "outward" through the glass).
// `planeLocal`/`planeRot`/`size` — the display plane, in CAR-LOCAL space.
function MirrorView({
  carBodyRef, camLocal, lookLocal, planeLocal, planeRot = [0, 0, 0], size = [0.3, 0.1],
}: {
  carBodyRef: React.RefObject<RapierRigidBody | null>;
  camLocal: THREE.Vector3;
  lookLocal: THREE.Vector3;
  planeLocal: [number, number, number];
  planeRot?: [number, number, number];
  size?: [number, number];
}) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  const frameCounter = useRef(0);
  // The default scene — used to portal the off-screen render camera to the
  // scene root so it is NOT parented to the car body (while the display mesh
  // below IS a body child and tracks the body via the scene graph).
  const rootScene = useThree((s) => s.scene);
  // Half-res render target — mirrors don't need full resolution.
  const fbo = useFBO(512, 256, { samples: 0 });
  // Reusable scratch objects (avoid per-frame allocations).
  const planeWorldPos = useRef(new THREE.Vector3());
  const planeWorldQuat = useRef(new THREE.Quaternion());
  const planeWorldScale = useRef(new THREE.Vector3());
  const camWorldPos = useRef(new THREE.Vector3());
  const lookWorldPos = useRef(new THREE.Vector3());

  // IMPORTANT: no positive renderPriority here. In R3F, passing any positive
  // priority (e.g. 1) makes this callback TAKE OVER the render loop — R3F then
  // stops auto-rendering the main canvas, which breaks physics stepping and
  // leaves the screen blank. Running at the default priority (0) means R3F
  // keeps owning the main render and just calls us as a normal subscriber.
  // We render the mirror into the FBO manually and always restore the target
  // to null so the main canvas render is unaffected.
  useFrame(({ gl, scene }) => {
    // Safety: the car rigid body may not be ready on the very first frame(s).
    // If we dereferenced it before the ref is assigned we'd throw, and an
    // uncaught throw inside useFrame kills the whole frame/physics loop — the
    // car would silently stop moving. Guard the body FIRST, then the camera.
    if (!carBodyRef.current) return;
    if (!camRef.current || !planeRef.current) return;

    // ── Read the display plane's WORLD transform straight from its matrix ────
    // The scene graph has already composed this from the car body's transform,
    // so the plane is exactly where the car put it this frame — no lag, no
    // drift, and we never re-derive the body transform ourselves.
    planeRef.current.updateMatrixWorld();
    planeRef.current.matrixWorld.decompose(
      planeWorldPos.current,
      planeWorldQuat.current,
      planeWorldScale.current,
    );

    // Position the off-screen render camera relative to the plane (in the
    // plane's local frame), then convert to world space.
    camWorldPos.current.copy(camLocal).applyQuaternion(planeWorldQuat.current)
      .add(planeWorldPos.current);
    camRef.current.position.copy(camWorldPos.current);

    // Look-at point, likewise relative to the plane in its local frame.
    lookWorldPos.current.copy(lookLocal).applyQuaternion(planeWorldQuat.current)
      .add(planeWorldPos.current);
    camRef.current.lookAt(lookWorldPos.current);

    // ── Only re-render the mirror FBO every 3rd frame (mobile perf) ───────────
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    // Render the mirror camera into the FBO, then ALWAYS restore the render
    // target to null so R3F's own main-canvas render is not hijacked.
    gl.setRenderTarget(fbo);
    gl.render(scene, camRef.current);
    gl.setRenderTarget(null);
  });

  return (
    <>
      {/* Off-screen render camera (NOT the main camera). Portaled to the scene
          root so it is NOT a child of the car body — its world position + lookAt
          are set from the display plane's matrixWorld each frame, meaning it
          never gets parented to (or scaled/hidden by) the body. */}
      {createPortal(
        <PerspectiveCamera ref={camRef} fov={60} near={0.1} far={200} />,
        rootScene,
      )}

      {/* Display plane — a CHILD of the car RigidBody. Its local position/
          rotation are set declaratively below; the scene graph handles the
          rest, so it tracks the body with zero lag. */}
      <mesh ref={planeRef} position={planeLocal} rotation={planeRot}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={fbo.texture} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

const SPAWN_POINTS: Record<string, { position: [number, number, number]; rotation: [number, number, number] }> = {
  "hill-start": { position: [0, 1.5, 0], rotation: [0, Math.PI, 0] },
  "side-parking": { position: [-30, 1.5, 30], rotation: [0, Math.PI, 0] },
  "parallel-parking": { position: [-30, 1.5, -10], rotation: [0, Math.PI, 0] },
  "three-point-turn": { position: [0, 1.5, -70], rotation: [0, Math.PI, 0] },
  "s-curve": { position: [30, 1.5, 5], rotation: [0, Math.PI, 0] },
  "z-curve": { position: [30, 1.5, -35], rotation: [0, Math.PI, 0] },
  "ramp-test": { position: [0, 1.5, 0], rotation: [0, Math.PI, 0] },
  "road-merging": { position: [0, 1.5, 0], rotation: [0, Math.PI, 0] },
};

function Car({ 
  onSpeedChange, 
  bodyRefProp,
  spawnPosition = [0, 1, 0],
  spawnRotation = [0, 0, 0]
}: { 
  onSpeedChange?: (speed: number) => void; 
  bodyRefProp?: React.RefObject<RapierRigidBody | null>;
  spawnPosition?: [number, number, number];
  spawnRotation?: [number, number, number];
}) {
  const { scene } = useGLTF("/toyota-corolla-e170-2017.glb");
  const internalRef = useRef<RapierRigidBody>(null);
  const bodyRef = (bodyRefProp as React.RefObject<RapierRigidBody>) ?? internalRef;
  const hasSpawned = useRef(false);
  const debugTimer = useRef(0); // accumulates elapsed time for the throttled debug log
  const introTimer = useRef(0); // for the intro camera animation
  // steeringWheelRef removed — steering wheel is now part of the Toyota GLB model
  
  // Enhance the Corolla's materials to prevent them from looking dull
  // but without making them look like shiny, glary wet plastic.
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          // Normal environmental reflections
          mat.envMapIntensity = 1.0; 
          
          const name = child.name.toLowerCase();
          // Increase roughness on interior parts for a matte leather/plastic look
          if (name.includes("interior") || name.includes("seat") || name.includes("dash") || name.includes("panel") || name.includes("steer")) {
             mat.roughness = 0.85;
             mat.metalness = 0.1;
             
             // Make the flat grey plastics richer
             if (mat.color.getHex() > 0x888888 && mat.color.getHex() < 0xaaaaaa) {
                mat.color.set('#2a1a10'); // Dark leather brown
             }
          }
        }
      }
    });
  }, [scene]);

  // Drag to look state
  const cameraAngle = useRef({ yaw: 0, pitch: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      cameraAngle.current.yaw -= dx * 0.003;
      cameraAngle.current.pitch -= dy * 0.003;
      
      // clamp pitch to avoid looking too far up/down
      cameraAngle.current.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraAngle.current.pitch));
      // clamp yaw to avoid 360 spinning (like an owl)
      cameraAngle.current.yaw = Math.max(-Math.PI * 0.8, Math.min(Math.PI * 0.8, cameraAngle.current.yaw));
    };
    const onPointerUp = () => {
      isDragging.current = false;
    };
    
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
  }, []);
  
  // Hide the corolla's built in interior so our detailed one shows
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const name = child.name.toLowerCase();
        if (name.includes("interior") || name.includes("seat") || name.includes("dash") || name.includes("wheel") || name.includes("glass") || name.includes("window")) {
           // We might not want to hide glass, but let's hide typical interior parts
           if (!name.includes("glass") && !name.includes("window")) {
             child.visible = false;
           }
        }
      }
    });
  }, [scene]);

  useKeys(); // Initialize keyboard listeners that write to store

  useFrame((state, delta) => {
    if (!bodyRef.current) return;
    
    if (!hasSpawned.current) {
      bodyRef.current.setTranslation({ x: spawnPosition[0], y: spawnPosition[1], z: spawnPosition[2] }, true);
      const euler = new THREE.Euler(spawnRotation[0], spawnRotation[1], spawnRotation[2]);
      const quat = new THREE.Quaternion().setFromEuler(euler);
      bodyRef.current.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      hasSpawned.current = true;
    }

    // Clamp delta to avoid huge impulses after a tab loses focus / hitches.
    const dt = Math.min(delta, 1 / 30);

    // Read directly from store state to avoid React re-renders on physics loop
    const { isAccelerating, isBraking, isReversing, steeringInput, gear, clutchPosition, shakeIntensity, setShake } = useCarStore.getState();

    // No more FORCE_BOOST. Moderate force magnitude (15) against mass=10 (see
    // the RigidBody collider below) gives a steady ~1.5 m/s² acceleration.
    const forwardForce = 15;
    // HARD speed cap: 30 km/h ≈ 8.33 m/s. Enforced each frame below with
    // setLinvel() so the car can NEVER exceed it, regardless of impulses.
    const MAX_SPEED_MS = 30 / 3.6; // ≈ 8.33 m/s

    // ── Read body transform ONCE at the top (bPos used below for wheel forces) ──
    const bPos     = bodyRef.current.translation();
    const velocity = bodyRef.current.linvel();
    const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    const speedKmh = currentSpeed * 3.6;

    const bRot  = bodyRef.current.rotation();
    const quat  = new THREE.Quaternion(bRot.x, bRot.y, bRot.z, bRot.w);
    const euler = new THREE.Euler().setFromQuaternion(quat);
    // Model forward direction is -Z in local space. Derived directly from the
    // body's quaternion so the car always drives the way the camera looks.
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);

    // ── Steering (Speed-Sensitive) ───────────────────────────────────────────
    // Map steering so low speed (0–20 km/h) allows up to 30° of yaw rate, and
    // high speed reduces it toward 10° to prevent spinning out. We apply a
    // torque impulse about Y instead of overwriting angvel, so the tyres keep
    // grip and the car doesn't slide/flip like with setAngvel.
    // 30°/s ≈ 0.524 rad/s, 10°/s ≈ 0.175 rad/s.
    const MAX_YAW_LOW  = 0.524;
    const MAX_YAW_HIGH = 0.175;
    // Below 20 km/h full lock; above 60 km/h minimum lock; linear between.
    const steerAuthority = THREE.MathUtils.clamp(
      1 - (speedKmh - 20) / (60 - 20),
      0,
      1,
    );
    const maxYaw = MAX_YAW_HIGH + (MAX_YAW_LOW - MAX_YAW_HIGH) * steerAuthority;

    // Direction flips when the car is moving backward so steering feels natural
    // in reverse (mirrors real cars — the tail follows the wheel).
    const velDir = new THREE.Vector3(velocity.x, 0, velocity.z);
    const moving = velDir.lengthSq() > 0.04;
    const direction = moving && velDir.normalize().dot(forward) < -0.1 ? -1 : 1;

    // Target yaw velocity; only steer when actually rolling. When stopped we
    // damp existing yaw so the car doesn't keep spinning from a previous input.
    if (steeringInput !== 0 && currentSpeed > 0.5) {
      const targetYaw = steeringInput * maxYaw * direction;
      // Apply as a torque impulse at the centre — far gentler than setAngvel
      // and lets Rapier's angular damping settle the body naturally.
      const yawTorque = (targetYaw - bodyRef.current.angvel().y) * 40 * dt;
      bodyRef.current.applyTorqueImpulse({ x: 0, y: yawTorque, z: 0 }, true);
    }

    // ── Acceleration / Reverse (applied at the centre of mass) ───────────────
    // We use applyImpulse (NOT applyImpulseAtPoint). Applying the impulse at the
    // body's centre of mass produces pure translation — no torque arm — so it
    // can't fight the steering yaw torque or randomly pivot the car, which was
    // the source of the jitter under acceleration.
    const powerMult = Math.max(0, 1 - clutchPosition);
    const gearMult  = gear === 0 ? 0 : 1;
    const effectiveForce = forwardForce * powerMult * gearMult * dt;

    if (isAccelerating && currentSpeed < MAX_SPEED_MS && gear > 0) {
      bodyRef.current.applyImpulse(
        { x: forward.x * effectiveForce, y: 0, z: forward.z * effectiveForce },
        true,
      );
    }
    if (isAccelerating && currentSpeed < MAX_SPEED_MS && gear === -1) {
      bodyRef.current.applyImpulse(
        { x: -forward.x * effectiveForce * 0.5, y: 0, z: -forward.z * effectiveForce * 0.5 },
        true,
      );
    }

    if (isReversing) {
      bodyRef.current.applyImpulse(
        { x: -forward.x * forwardForce * 0.5 * dt, y: 0, z: -forward.z * forwardForce * 0.5 * dt },
        true,
      );
    }

    // ── Braking ───────────────────────────────────────────────────────────────
    // Engine braking (natural coast-down when no throttle) is handled by the
    // RigidBody's linearDamping below. The brake key does a stronger artificial
    // velocity bleed so the car stops on demand.
    if (isBraking) {
      bodyRef.current.setLinvel(
        { x: velocity.x * 0.88, y: velocity.y, z: velocity.z * 0.88 },
        true,
      );
    }

    // ── HARD speed clamp ──────────────────────────────────────────────────────
    // Re-read the live velocity (braking above may have changed it) and, if the
    // horizontal speed exceeds MAX_SPEED_MS (≈8.33 m/s = 30 km/h), scale the
    // velocity vector back to the cap with setLinvel(). This guarantees the car
    // can NEVER exceed 30 km/h, no matter what forces were applied this frame.
    {
      const lv = bodyRef.current.linvel();
      const horizSpeed = Math.sqrt(lv.x * lv.x + lv.z * lv.z);
      if (horizSpeed > MAX_SPEED_MS && horizSpeed > 0) {
        const scale = MAX_SPEED_MS / horizSpeed;
        bodyRef.current.setLinvel(
          { x: lv.x * scale, y: lv.y, z: lv.z * scale },
          true,
        );
      }
    }

    // ── Debug Logger ──────────────────────────────────────────────────────────
    // Prints speed + raw input states every ~0.5s so you can confirm the
    // keyboard/MobileControls are actually feeding the physics loop.
    debugTimer.current += dt;
    if (debugTimer.current >= 0.5) {
      debugTimer.current = 0;
      if (import.meta.env.DEV) {
        console.log(
          `[Physics Debug] Speed: ${speedKmh.toFixed(1)} km/h | Throttle: ${isAccelerating} | Brake: ${isBraking} | Reverse: ${isReversing} | Steer: ${steeringInput.toFixed(2)} | Gear: ${gear}`,
        );
      }
    }

    // ── Steering wheel visual ────────────────────────────────────────────────
    // (The steering wheel is part of the GLB model, no manual rotation needed)

    // ── First-Person Camera: locked to the driver's seat ───────────────────────
    // Compute driver seat world position
    const seatLocal = DRIVER_POS.clone().applyEuler(euler);
    const seatWorld = new THREE.Vector3(
      bPos.x + seatLocal.x,
      bPos.y + seatLocal.y,
      bPos.z + seatLocal.z,
    );

    // Apply Camera Shake — a small random offset added on top of the rigid seat
    // position. Decays over time. (Randomness here is fine: it is intentional
    // bump feedback, not a camera-follow artefact.)
    let shakeOffset = new THREE.Vector3(0, 0, 0);
    if (shakeIntensity > 0) {
      shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * shakeIntensity * 0.5,
        (Math.random() - 0.5) * shakeIntensity * 0.5,
        (Math.random() - 0.5) * shakeIntensity * 0.5,
      );
      // Decay shake
      setShake(Math.max(0, shakeIntensity - dt * 2));
    }

    introTimer.current += dt;
    const INTRO_DURATION = 4.0;
    
    // Calculate final look direction based on car rotation + user drag rotation
    const userLocalQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(cameraAngle.current.pitch, cameraAngle.current.yaw, 0, 'YXZ'));
    const combinedQuat = quat.clone().multiply(userLocalQuat);
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(combinedQuat);
    // Project a point 10 meters ahead for lookAt
    const lookAtWorld = seatWorld.clone().add(lookDir.multiplyScalar(10));

    if (introTimer.current < INTRO_DURATION) {
      const progress = introTimer.current / INTRO_DURATION;
      const easeProgress = progress * progress * (3 - 2 * progress); // smoothstep
      
      const startRadius = 15;
      const endRadius = 1.0;
      const radius = startRadius - easeProgress * (startRadius - endRadius);
      
      const startHeight = 10;
      const endHeight = 2.0;
      const height = startHeight - easeProgress * (startHeight - endHeight);
      
      const angle = progress * Math.PI * 2; // full 360 degree round
      
      const camPosLocal = new THREE.Vector3(
        Math.sin(angle) * radius,
        height,
        Math.cos(angle) * radius
      );
      
      // Interpolate towards seat position at the very end
      const finalCamPos = new THREE.Vector3(bPos.x, bPos.y, bPos.z).add(camPosLocal);
      const lookAtTarget = new THREE.Vector3(bPos.x, bPos.y, bPos.z).add(new THREE.Vector3(0, 1, 0));
      
      if (progress > 0.8) {
         const t = (progress - 0.8) / 0.2;
         finalCamPos.lerp(seatWorld, t);
         lookAtTarget.lerp(lookAtWorld, t);
      }
      
      state.camera.position.copy(finalCamPos);
      state.camera.lookAt(lookAtTarget);
      state.camera.updateMatrixWorld();
    } else {
      // Lock the camera DIRECTLY to the body transform
      state.camera.position.copy(seatWorld).add(shakeOffset);
      state.camera.lookAt(lookAtWorld);
      state.camera.updateMatrixWorld();
    }

    if (onSpeedChange) {
      onSpeedChange(Math.round(currentSpeed * 3.6));
    }
  });

  return (
    <>
    <RigidBody
      ref={bodyRef}
      colliders={false} // auto-colliders off — we use one explicit cuboid below
      type="dynamic" // dynamic so forces/impulses actually move it
      // Spawn at y=2 so the collider (bottom at y = 2 + (-0.5 - 0.6) = 0.9) is
      // clearly above the floor (top at y=0). Any initial overlap can make
      // Rapier freeze the body to avoid physics explosions.
      position={[0, 2, 0]}
      linearDamping={2.5} // Strong coast-down so the car slows when off throttle (engine braking)
      angularDamping={3.0} // Resist yaw so it doesn't spin/flip on hard steering
      // No enabledTranslations/enabledRotations locks — all axes are free.
    >
      {/* Explicit cuboid collider sized for the real Corolla at scale=1.0       */}
      {/* half-extents: X=1.0 (2m wide), Y=0.87 (1.74m tall), Z=2.2 (4.4m long) */}
      <CuboidCollider args={[1.0, 0.87, 2.2]} position={[0, 0.37, 0]} mass={10} />
      {/* Toyota Corolla GLB — scale=1.0 (already in metres, 2.06m wide) */}
      {/* The model natively faces +Z, but our physics/camera forward is -Z.      */}
      {/* We rotate by 180° (Math.PI) so it faces forward correctly.              */}
      <group position={[0, -0.5, 0]} rotation={[0, Math.PI, 0]}>
        {/* Cabin light so interior is bright but not blindingly glary */}
        <ambientLight intensity={0.8} />
        {/* Soft point light to fill shadows */}
        <pointLight position={[0, 0.7, 0.3]} intensity={1.5} distance={4} color="#fff8f0" />
        <primitive
          object={scene}
          scale={[-1, 1, 1]} // Flips the model on X to make it Right-Hand Drive!
          castShadow
          receiveShadow
        />
      </group>

      {/* ── Mirrors (each is an FBO render-camera + a display plane) ────────────── */}
      {/* These live INSIDE the car RigidBody so the display planes are children   */}
      {/* of the body and track it via the scene graph (no lag, no drift). The    */}
      {/* off-screen render camera inside each MirrorView is portaled to the scene */}
      {/* root so it is NOT parented to the body; its world transform is derived   */}
      {/* from the display plane's matrixWorld each frame.                        */}
      {/* camLocal/lookLocal are in PLANE-LOCAL space (relative to the glass).    */}

      {/* Rearview: planeLocal [0, 1.1, -0.3] hangs at the top center of the windscreen. */}
      <MirrorView
        carBodyRef={bodyRef}
        camLocal={new THREE.Vector3(0, 0.05, 0.1)}    // just behind the glass, slightly up
        lookLocal={new THREE.Vector3(0, -0.3, 8)}     // look down-and-back out the rear
        planeLocal={[0, 1.1, -0.3]}
        planeRot={[0, Math.PI, 0]} // face the driver (plane normal toward the eyes)
        size={[0.3, 0.1]}
      />

      {/* Left side mirror: symmetrically opposite to the right side mirror. */}
      <MirrorView
        carBodyRef={bodyRef}
        camLocal={new THREE.Vector3(-0.1, 0, 0.05)}    // just outboard of the glass (left side)
        lookLocal={new THREE.Vector3(-6, -0.3, 6)}      // look out-left and back
        planeLocal={[-0.9, 1.0, -0.5]}                 // left side position
        planeRot={[0, 0.3, 0]}                         // angled towards driver
        size={[0.18, 0.1]}
      />

      {/* Right side mirror: planeLocal [0.9, 1.0, -0.5], angled slightly outward. */}
      <MirrorView
        carBodyRef={bodyRef}
        camLocal={new THREE.Vector3(0.1, 0, 0.05)}     // just outboard of the glass
        lookLocal={new THREE.Vector3(6, -0.3, 6)}       // look out-right and back
        planeLocal={[0.9, 1.0, -0.5]}
        planeRot={[0, -0.3, 0]}
        size={[0.18, 0.1]}
      />
    </RigidBody>
    </>
  );
}

// ── Maneuver definitions (same as original KPP2 config) ──────────────────────
interface ManeuverConfig {
  name: string;
  nameMs: string;
  instructions: string;
  instructionsMs: string;
  tips: string[];
  clutchTips: string[];
}

const maneuverConfigs: Record<string, ManeuverConfig> = {
  "hill-start": {
    name: "Hill Start",
    nameMs: "Ujian Bukit",
    instructions: "Drive uphill, stop at the marked line, then continue without rolling back more than 30cm.",
    instructionsMs: "Pandu ke atas bukit, berhenti di garisan, kemudian teruskan tanpa mengundur lebih 30cm.",
    tips: [
      "Stop fully at the red line before proceeding. / Berhenti sepenuhnya di garisan merah sebelum meneruskan.",
      "Use handbrake to hold position on the slope. / Guna brek tangan untuk menahan kedudukan di cerun.",
      "Find the clutch biting point before releasing the handbrake. / Cari titik gigitan klac sebelum melepaskan brek tangan.",
      "Apply gentle throttle as you release the clutch slowly. / Beri minyak perlahan semasa melepaskan klac secara beransur.",
      "Do not rush — smooth is better than fast. / Jangan tergesa-gesa — lancar lebih baik daripada laju.",
    ],
    clutchTips: [
      "Press clutch fully and shift to gear / Tekan klac penuh dan masuk gear",
      "Slowly raise clutch until you feel the car vibrate (biting point). / Angkat klac perlahan sehingga rasa kereta bergetar (titik gigitan).",
      "Hold the biting point steady, then add light throttle. / Kekalkan titik gigitan, kemudian tambah minyak ringan.",
      "Release handbrake smoothly — car should move forward. / Lepas brek tangan dengan lancar — kereta bergerak ke hadapan.",
      "If the car rolls back, press clutch and brake immediately. / Jika kereta mengundur, tekan klac dan brek segera.",
    ],
  },
  "side-parking": {
    name: "Side Parking",
    nameMs: "Parkir Tepi",
    instructions: "Drive forward past the bay, then reverse into the parking space without touching poles.",
    instructionsMs: "Pandu ke hadapan melepasi petak, kemudian undur masuk ke petak parkir tanpa menyentuh tiang.",
    tips: [
      "Drive past the parking bay and align your car. / Pandu melepasi petak parkir dan selaraskan kereta.",
      "Check all mirrors before reversing. / Periksa semua cermin sebelum mengundur.",
      "Turn steering wheel fully when rear aligns with first pole. / Pusing stereng penuh apabila belakang sejajar tiang pertama.",
      "Straighten the wheel once inside the bay. / Luruskan stereng sebaik masuk dalam petak.",
      "Ensure the car is centered in the bay. / Pastikan kereta di tengah petak.",
    ],
    clutchTips: [
      "Use half-clutch for slow, controlled reverse movement. / Guna separuh klac untuk undur perlahan terkawal.",
      "Keep clutch at biting point — do not release fully. / Kekalkan klac di titik gigitan — jangan lepas penuh.",
      "Control speed with the clutch, not the brake. / Kawal kelajuan dengan klac, bukan brek.",
    ],
  },
  "parallel-parking": {
    name: "Parallel Parking",
    nameMs: "Parkir Selari",
    instructions: "Park the car parallel between the markers without touching any cones.",
    instructionsMs: "Parkir kereta selari antara penanda tanpa menyentuh kon.",
    tips: [
      "Align parallel to front car, about 1 arm distance. / Selaraskan selari dengan kereta hadapan, 1 lengan jarak.",
      "Reverse slowly, turn wheel fully when rear bumper passes front car. / Undur perlahan, pusing stereng penuh apabila bumper belakang melepasi kereta hadapan.",
      "Once at 45 degrees, straighten the wheel. / Sebaik 45 darjah, luruskan stereng.",
      "Turn wheel fully opposite to straighten near curb. / Pusing stereng penuh sebaliknya untuk lurus di bahu jalan.",
      "Adjust position with small movements. / Laraskan kedudukan dengan pergerakan kecil.",
    ],
    clutchTips: [
      "Half-clutch throughout for maximum control. / Separuh klac sepanjang masa untuk kawalan maksimum.",
      "Feather the clutch — tiny movements matter. / Kawalan halus klac — pergerakan kecil penting.",
    ],
  },
  "three-point-turn": {
    name: "Three-Point Turn",
    nameMs: "Pusingan 3 Penjuru",
    instructions: "Turn the vehicle around using exactly 3 maneuvers as per JPJ test.",
    instructionsMs: "Pusing kenderaan menggunakan tepat 3 manuver mengikut ujian JPJ.",
    tips: [
      "Step 1: Steering FULL LEFT, drive forward slowly to opposite curb. / Langkah 1: Stereng PENUH KIRI, pandu ke hadapan perlahan ke bahu bertentangan.",
      "Step 2: Steering FULL RIGHT, reverse slowly to original curb. / Langkah 2: Stereng PENUH KANAN, undur perlahan ke bahu asal.",
      "Step 3: Steering LEFT, drive forward to straighten. / Langkah 3: Stereng KIRI, pandu ke hadapan untuk meluruskan.",
      "Only 3 movements allowed — forward, reverse, forward. / Hanya 3 pergerakan — hadapan, undur, hadapan.",
      "Do not cross road boundaries. / Jangan melintas sempadan jalan.",
    ],
    clutchTips: [
      "Use half-clutch at all times for slow controlled movement. / Guna separuh klac untuk pergerakan perlahan terkawal.",
      "Press clutch fully before stopping, then find biting point again. / Tekan klac penuh sebelum berhenti, cari titik gigitan semula.",
      "Speed control is critical — never rush. / Kawalan kelajuan kritikal — jangan tergesa-gesa.",
    ],
  },
  "s-curve": {
    name: "S-Curve",
    nameMs: "Selekoh S",
    instructions: "Navigate through the S-shaped course without touching the curbs.",
    instructionsMs: "Navigasi laluan berbentuk S tanpa menyentuh bahu jalan.",
    tips: [
      "Enter the curve slowly — speed control is key. / Masuk selekoh perlahan — kawalan kelajuan kunci.",
      "Look ahead through the curve, not at the curb. / Pandang ke hadapan, bukan bahu jalan.",
      "For right bend, move slightly left first then steer right. / Untuk selekoh kanan, gerak kiri dahulu kemudian stereng kanan.",
      "For left bend, position right before steering left. / Untuk selekoh kiri, posisi kanan sebelum stereng kiri.",
      "Keep a steady slow speed throughout. / Kekalkan kelajuan perlahan tetap.",
    ],
    clutchTips: [
      "Maintain half-clutch for consistent slow speed. / Kekalkan separuh klac untuk kelajuan perlahan konsisten.",
      "Do not accelerate through the curves. / Jangan pecut melalui selekoh.",
    ],
  },
  "z-curve": {
    name: "Z-Curve",
    nameMs: "Selekoh Z",
    instructions: "Navigate through the Z-shaped course without touching the curbs.",
    instructionsMs: "Navigasi laluan berbentuk Z tanpa menyentuh bahu jalan.",
    tips: [
      "Move closer to RIGHT before turning LEFT at corners. / Gerak lebih dekat KANAN sebelum belok KIRI.",
      "Move closer to LEFT before turning RIGHT at corners. / Gerak lebih dekat KIRI sebelum belok KANAN.",
      "This gives the widest turning arc. / Ini memberi lengkok pusingan paling luas.",
      "Look ahead to the next corner. / Pandang to selekoh seterusnya.",
      "Maintain very slow steady speed. / Kekalkan kelajuan sangat perlahan dan tetap.",
    ],
    clutchTips: [
      "Half-clutch is your best friend here. / Separuh klac sahabat terbaik anda di sini.",
      "If you need to stop, press clutch fully first. / Jika perlu berhenti, tekan klac penuh dahulu.",
    ],
  },
  "ramp-test": {
    name: "Ramp Test",
    nameMs: "Ujian Ramp",
    instructions: "Drive up the ramp, stop at the top, then continue down smoothly.",
    instructionsMs: "Pandu naik tanjakan, berhenti di atas, kemudian turun dengan lancar.",
    tips: [
      "Approach the ramp in gear 1 with steady speed. / Hampiri tanjakan dalam gear 1 dengan kelajuan tetap.",
      "Stop at the designated stop line at the top. / Berhenti di garisan berhenti di atas.",
      "Use same technique as hill start to move off. / Guna teknik sama seperti permulaan bukit.",
      "When descending, use engine braking (low gear). / Semasa menurun, guna brek enjin (gear rendah).",
      "Apply brakes gently when going downhill. / Tekan brek perlahan semasa turun.",
    ],
    clutchTips: [
      "Going up: find biting point, add gas, release handbrake. / Naik: cari titik gigitan, tambah minyak, lepas brek tangan.",
      "Going down: press clutch, shift to gear 1, release slowly for engine braking. / Turun: tekan klac, masuk gear 1, lepas perlahan.",
      "Never ride the clutch going downhill. / Jangan pegang klac semasa turun bukit.",
    ],
  },
  "road-merging": {
    name: "Road Merging",
    nameMs: "Bergabung Jalan",
    instructions: "Merge safely into moving traffic. Watch for other vehicles and find gaps.",
    instructionsMs: "Bergabung dengan selamat ke dalam trafik bergerak. Perhatikan kenderaan lain dan cari ruang.",
    tips: [
      "Check mirrors and blind spot before merging. / Periksa cermin dan blind spot sebelum bergabung.",
      "Match the speed of traffic in the lane you are entering. / Padankan kelajuan trafik di lorong yang anda masuki.",
      "Use the acceleration lane to build speed. / Guna lorong pecutan untuk tingkatkan kelajuan.",
      "Signal early to indicate your intention. / Beri isyarat awal untuk tunjukkan niat anda.",
      "Do not stop on the acceleration lane unless absolutely necessary. / Jangan berhenti di lorong pecutan kecuali sangat perlu.",
    ],
    clutchTips: [
      "Build speed steadily — keep clutch fully released in higher gear. / Tingkatkan kelajuan secara tetap.",
      "Downshift if you need to slow down quickly. / Turunkan gear jika perlu perlahan segera.",
    ],
  },
};

const VALID_MANEUVERS = new Set(Object.keys(maneuverConfigs));

type Phase = "pre-launch" | "playing" | "results";
type Mode = "practice" | "assessment";

export function Simulation3DView() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const saveResult = useSaveSimulationResult();
  const savedRef = useRef(false);

  const { gear, demeritPoints, errors: storeErrors, isFailed, stallCount, rollbackCm, resetSession } = useCarStore();
  const [phase, setPhase] = useState<Phase>("pre-launch");
  const [mode, setMode] = useState<Mode>("practice");
  // Ref to carBody so JPJCircuit's HillStartMonitor can access it
  const carBodyRef = useRef<RapierRigidBody>(null);

  const [hudState, setHudState] = useState({
    leftSignal: false,
    rightSignal: false,
    mirrorChecked: false,
    speed: 0,
  });

  const [resultData, setResultData] = useState({
    demeritPoints: 0,
    errors: 0,
    stallCount: 0,
    rollbackCm: 0,
    passed: true,
  });

  const maneuverId = id && VALID_MANEUVERS.has(id) ? id : "hill-start";
  const config = maneuverConfigs[maneuverId];
  const maneuverName = language === "ms" ? config.nameMs : config.name;

  const handleFinish = useCallback((data: {
    demeritPoints: number;
    errors: number;
    stallCount: number;
    rollbackCm: number;
    passed: boolean;
  }) => {
    setResultData(data);
    setPhase("results");

    if (savedRef.current || !user) return;
    savedRef.current = true;

    saveResult.mutate(
      {
        user_id: user.id,
        maneuver_id: maneuverId,
        mode,
        score: Math.max(0, 100 - data.demeritPoints * 5),
        errors: data.errors,
        passed: data.passed,
        completion_seconds: 15,
        stall_count: data.stallCount,
        rollback_cm: data.rollbackCm,
        language,
        attempt_data: { type: "3d_sim", mode },
      },
      {
        onSuccess: () => {
          toast.success(t("sim.resultSaved"));
          if (user?.id) {
            queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
            queryClient.invalidateQueries({ queryKey: ["progress", "sim", user.id] });
            queryClient.invalidateQueries({ queryKey: ["progress", "readiness", user.id] });
          }
        },
        onError: () => {
          savedRef.current = false;
          toast.error(t("sim.resultSaveFailed"));
        },
      }
    );
  }, [user, maneuverId, mode, language, saveResult.mutate, t, queryClient]);

  // Auto-fail when demerit limit hit in assessment mode
  useEffect(() => {
    if (isFailed && phase === "playing") {
      handleFinish({
        demeritPoints,
        errors: storeErrors,
        stallCount,
        rollbackCm,
        passed: false,
      });
    }
  }, [isFailed, phase, demeritPoints, storeErrors, stallCount, rollbackCm, handleFinish]);

  // Sync offline results when network is restored
  useEffect(() => {
    const handleOnline = () => {
      syncSimulationResults().then(() => {
        queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
      });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [queryClient]);

  const handleStart = () => {
    savedRef.current = false;
    resetSession(mode);
    setPhase("playing");
  };

  const handleRetry = () => {
    savedRef.current = false;
    setPhase("pre-launch");
    setHudState({ leftSignal: false, rightSignal: false, mirrorChecked: false, speed: 0 });
    resetSession(mode);
    setResultData({ demeritPoints: 0, errors: 0, stallCount: 0, rollbackCm: 0, passed: true });
  };

  const handleBack = () => {
    navigate(ROUTES.SIMULATIONS);
  };

  const handleLeftSignal = () => {
    setHudState((prev) => ({
      ...prev,
      leftSignal: !prev.leftSignal,
      rightSignal: prev.leftSignal ? prev.rightSignal : false,
    }));
  };

  const handleRightSignal = () => {
    setHudState((prev) => ({
      ...prev,
      rightSignal: !prev.rightSignal,
      leftSignal: prev.rightSignal ? prev.leftSignal : false,
    }));
  };

  const handleMirrorCheck = () => {
    setHudState((prev) => ({ ...prev, mirrorChecked: true }));
    window.setTimeout(() => setHudState((prev) => ({ ...prev, mirrorChecked: false })), 1500);
  };

  const simulateSuccess = () => {
    const dp = demeritPoints;
    handleFinish({
      demeritPoints: dp,
      errors: storeErrors,
      stallCount,
      rollbackCm,
      passed: dp < 20,
    });
  };

  const addSimulatedError = () => {
    useCarStore.getState().addDemerit(5, 'manual-test');
  };

  return (
    <div className="page-shell max-w-5xl space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      {phase === "pre-launch" && (
        <div className="max-w-xl mx-auto card-premium p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2 border-b border-border pb-4">
            <h1 className="font-heading text-2xl font-bold text-foreground">{maneuverName}</h1>
            <p className="text-muted-foreground text-sm max-w-readable mx-auto">
              {language === "ms" ? config.instructionsMs : config.instructions}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tips Section */}
            <div className="p-4 rounded-lg bg-accent/40 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-bold text-foreground">
                  {t("sim.tips")}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
                {config.tips.map((tip, index) => (
                  <li key={index} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>

            {/* Clutch Control Section */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {language === "ms" ? "Kawalan Klac & Manual" : "Clutch & Manual Control"}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                {config.clutchTips.map((tip, index) => (
                  <li key={index} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Gear className="w-4 h-4 text-muted-foreground" weight="regular" />
              {t("sim.modeLabel")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["practice", "assessment"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-[48px] py-3 px-4 rounded-md border font-medium text-sm transition-colors duration-200 capitalize",
                    mode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent/50"
                  )}
                >
                  {t(m === "practice" ? "sim.mode.practice" : "sim.mode.assessment")}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full min-h-[48px] py-3 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Play className="w-5 h-5" />
            {t("sim.start")}
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="space-y-4">
          <SimulationHUD
            leftSignal={hudState.leftSignal}
            rightSignal={hudState.rightSignal}
            mirrorChecked={hudState.mirrorChecked}
            errors={storeErrors}
            speed={hudState.speed}
            gear={gear}
            onMirrorCheck={handleMirrorCheck}
            onLeftSignal={handleLeftSignal}
            onRightSignal={handleRightSignal}
          />

          {/* 3D Viewport container */}
          <div className="w-full min-h-[480px] aspect-[16/10] bg-[#111] rounded-md border border-border overflow-hidden relative flex flex-col">
            <Suspense
              fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-muted-foreground space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm font-semibold">Loading 3D Car Model... / Memuatkan Model 3D...</span>
                </div>
              }
            >
              <Canvas 
                shadows 
                dpr={[1, 1.5]} 
                camera={{ position: [0, 2, 5], fov: 75 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight
                  position={[20, 30, 10]}
                  intensity={1.5}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                  shadow-camera-far={100}
                  shadow-camera-left={-30}
                  shadow-camera-right={30}
                  shadow-camera-top={30}
                  shadow-camera-bottom={-30}
                />
                
                <Environment preset="park" background={false} />
                <Sky distance={450000} sunPosition={[20, 30, 10]} inclination={0} azimuth={0.25} />

                <Physics>
                  {/* 3D Car Model — passes bodyRef to JPJCircuit for Hill monitor */}
                  <Car
                    onSpeedChange={(s) => setHudState(prev => prev.speed !== s ? { ...prev, speed: s } : prev)}
                    bodyRefProp={carBodyRef}
                    spawnPosition={SPAWN_POINTS[maneuverId]?.position ?? [0, 1, 0]}
                    spawnRotation={SPAWN_POINTS[maneuverId]?.rotation ?? [0, 0, 0]}
                  />

                  {/* Test Circuit with Hill Monitor */}
                  <JPJCircuit carBodyRef={carBodyRef} />
                </Physics>
                
                <EffectComposer>
                  <Bloom intensity={0.2} luminanceThreshold={0.8} />
                  <SMAA />
                </EffectComposer>
              </Canvas>
            </Suspense>

            {/* Mobile Controls Overlay */}
            <MobileControls />

            {/* Quick Demo HUD controls overlay */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 pointer-events-auto">
              <button
                type="button"
                onClick={addSimulatedError}
                className="bg-destructive/95 hover:bg-destructive text-destructive-foreground px-4 py-2 text-xs font-semibold rounded-md shadow-md transition-colors"
              >
                Trigger Error
              </button>
              <button
                type="button"
                onClick={simulateSuccess}
                className="bg-success/95 hover:bg-success text-success-foreground px-4 py-2 text-xs font-semibold rounded-md shadow-md flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Finish Maneuver
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Drag mouse/finger to rotate camera · Pinch/scroll to zoom
          </p>
        </div>
      )}

      {phase === "results" && (
        <SimulationResults
          maneuverName={maneuverName}
          demeritPoints={resultData.demeritPoints}
          errors={resultData.errors}
          stallCount={resultData.stallCount}
          rollbackCm={resultData.rollbackCm}
          passed={resultData.passed}
          mode={mode}
          onRetry={handleRetry}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
