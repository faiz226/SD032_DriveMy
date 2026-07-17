import { RigidBody, CuboidCollider, RapierRigidBody } from "@react-three/rapier";
import { Text } from "@react-three/drei";
import { useCarStore, DEMERIT } from "@/stores/carStore";
import { toast } from "sonner";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Shared Geometries & Materials ─────────────────────────────────────────────
const coneGeo = new THREE.CylinderGeometry(0.06, 0.28, 1, 8); // Reduced segments from 16 to 8
const coneMat = new THREE.MeshStandardMaterial({ color: "#ff5500", roughness: 0.7 });
const coneStripeGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.18, 8);
const coneStripeMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.4 });

const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6); // Reduced segments
const poleMat = new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.5 });
const poleBandGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.3, 6);
const poleBandMat = new THREE.MeshStandardMaterial({ color: "#dd1111", roughness: 0.5 });

// ── Obstacle helpers ──────────────────────────────────────────────────────────

function Cone({ position }: { position: [number, number, number] }) {
  const addDemerit = useCarStore((s) => s.addDemerit);
  const hitRef = useRef(false);

  const handleIntersect = () => {
    if (hitRef.current) return;
    hitRef.current = true;
    addDemerit(DEMERIT.CONE_HIT, 'cone');
    toast.error("⚠️ Cone hit! −5 demerit points.");
    setTimeout(() => { hitRef.current = false; }, 2000);
  };

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[0.3, 0.5, 0.3]} sensor onIntersectionEnter={handleIntersect} />
      {/* Orange body */}
      <mesh position={[0, -0.5, 0]} castShadow geometry={coneGeo} material={coneMat} />
      {/* Reflective white stripe */}
      <mesh position={[0, -0.05, 0]} castShadow geometry={coneStripeGeo} material={coneStripeMat} />
    </RigidBody>
  );
}

function Pole({ position, demeritWeight = DEMERIT.POLE_HIT, label = "pole" }:
  { position: [number, number, number]; demeritWeight?: number; label?: string }) {
  const addDemerit = useCarStore((s) => s.addDemerit);
  const hitRef = useRef(false);

  const handleIntersect = () => {
    if (hitRef.current) return;
    hitRef.current = true;
    addDemerit(demeritWeight, label);
    const msg = demeritWeight >= 20
      ? `🚨 Pole hit — INSTANT FAIL! (−${demeritWeight} pts)`
      : `⚠️ Pole hit! −${demeritWeight} demerit points.`;
    toast.error(msg);
    setTimeout(() => { hitRef.current = false; }, 2000);
  };

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[0.08, 1.1, 0.08]} sensor onIntersectionEnter={handleIntersect} />
      {/* Main white shaft */}
      <mesh position={[0, 0, 0]} castShadow geometry={poleGeo} material={poleMat} />
      {/* Red band */}
      <mesh position={[0, 0.6, 0]} castShadow geometry={poleBandGeo} material={poleBandMat} />
    </RigidBody>
  );
}

// ── Hill Start Monitor ────────────────────────────────────────────────────────
// Watches the car's position while on the hill; fires demerit if it rolls
// back more than 30 cm from its "stopped" position.

function HillStartMonitor({ carBodyRef }: { carBodyRef: React.RefObject<RapierRigidBody | null> }) {
  const { addDemerit } = useCarStore();
  const stopPositionZ = useRef<number | null>(null);
  const isBrakingRef = useRef(false);
  const firedRef = useRef(false);

  useFrame(() => {
    if (!carBodyRef.current) return;
    const { isBraking } = useCarStore.getState();
    const pos = carBodyRef.current.translation();
    const vel = carBodyRef.current.linvel();

    // Detect "stopped on hill" — low speed and car is in the hill Z range
    const onHill = pos.z < -40 && pos.z > -80 && pos.y > 0.5;
    if (!onHill) {
      stopPositionZ.current = null;
      firedRef.current = false;
      return;
    }

    const speed = Math.sqrt(vel.x ** 2 + vel.z ** 2);
    const stopped = speed < 0.3;

    if (stopped && isBraking && !isBrakingRef.current) {
      // Car just came to a stop — record Z position
      stopPositionZ.current = pos.z;
      firedRef.current = false;
    }
    isBrakingRef.current = isBraking;

    // Check rollback — car moves in +Z direction (backward) after stopping
    if (stopPositionZ.current !== null && !firedRef.current) {
      const rollbackM = pos.z - stopPositionZ.current;
      if (rollbackM > 0.30) {
        firedRef.current = true;
        addDemerit(DEMERIT.ROLLBACK, 'rollback');
        toast.error("🚨 Rolled back more than 30 cm — INSTANT FAIL!");
        stopPositionZ.current = null;
      }
    }
  });

  return null;
}

// ── Parking Zone Sensor ───────────────────────────────────────────────────────
// Fires a check when the car enters the zone. If it is not fully within the
// bay bounding box, adds NOT_IN_BAY demerit.

function ParkingZone({
  position, bayHalfExtents = [3, 1, 5], label
}: {
  position: [number, number, number];
  bayHalfExtents?: [number, number, number];
  label: string;
}) {
  const { addDemerit } = useCarStore();
  const insideRef = useRef(false);
  const checkedRef = useRef(false);

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      {/* Sensor */}
      <CuboidCollider
        args={bayHalfExtents}
        sensor
        onIntersectionEnter={() => { insideRef.current = true; }}
        onIntersectionExit={() => {
          if (insideRef.current && !checkedRef.current) {
            // Car left without fully entering — penalise
            checkedRef.current = true;
            addDemerit(DEMERIT.NOT_IN_BAY, label);
            toast.error("⚠️ Car not fully inside parking bay — −10 pts.");
          }
          insideRef.current = false;
          setTimeout(() => { checkedRef.current = false; }, 3000);
        }}
      />
      {/* Bay markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
        <planeGeometry args={[bayHalfExtents[0] * 2, bayHalfExtents[2] * 2]} />
        <meshStandardMaterial color="#ffffff" opacity={0.25} transparent />
      </mesh>
      <Text
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label.toUpperCase()}
      </Text>
    </RigidBody>
  );
}

// ── Main Circuit ──────────────────────────────────────────────────────────────

export function JPJCircuit({ carBodyRef }: { carBodyRef: React.RefObject<RapierRigidBody | null> }) {
  return (
    <group>
      {/* ── Ground ──────────────────────────────────────────────────────────── */}
      {/* A thin plane collider would let a fast/heavy car tunnel straight      */}
      {/* through, so we use a deep cuboid collider as a solid catch-floor.     */}
      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        <CuboidCollider args={[100, 1, 100]} position={[0, -1, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* ── Main Asphalt Straight ────────────────────────────────────────────── */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 10]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 80]} />
          <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Centre dashed lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={i} position={[0, 0.01, -30 + i * 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.15, 1.5]} />
          <meshStandardMaterial color="#f0f0a0" />
        </mesh>
      ))}

      {/* Curbs */}
      <RigidBody type="fixed" colliders="cuboid" position={[-8.5, 0.08, 10]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 0.15, 80]} />
          <meshStandardMaterial color="#cccccc" roughness={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[8.5, 0.08, 10]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 0.15, 80]} />
          <meshStandardMaterial color="#cccccc" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* ── Hill (Ujian Bukit) — branches off main road at Z = -40 ────────── */}
      <group position={[0, 0, -40]}>
        {/* Incline — ~11.5° */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.95, -8]} rotation={[0.2, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[10, 0.15, 22]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
        </RigidBody>

        {/* Flat Top */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 2.0, -22]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[10, 0.15, 6]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
          {/* Yellow stop line */}
          <mesh position={[0, 0.09, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 0.6]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0.12, -0.8]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.65}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            STOP HERE / BERHENTI DI SINI
          </Text>
        </RigidBody>

        {/* Decline — ~11.5° */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.95, -36]} rotation={[-0.2, 0, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[10, 0.15, 22]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
        </RigidBody>
      </group>

      {/* Hill rollback monitor (invisible logic component) */}
      <HillStartMonitor carBodyRef={carBodyRef} />

      {/* ── S-Curve (Selekoh S) ──────────────────────────────────────────────── */}
      {/* Rough approximation: two offset asphalt sections with dense cone rows */}
      <group position={[30, 0, -10]}>
        {/* Left bend section */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 24]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* Right bend section */}
        <RigidBody type="fixed" colliders="cuboid" position={[6, -0.05, -24]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 24]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
        </RigidBody>

        {/* S-Curve boundary cones (inner lane) */}
        <Cone position={[-1, 0.5,  8]} />
        <Cone position={[-2, 0.5,  4]} />
        <Cone position={[-2, 0.5,  0]} />
        <Cone position={[-1, 0.5, -4]} />
        <Cone position={[ 3, 0.5, -8]} />
        <Cone position={[ 5, 0.5, -12]} />
        <Cone position={[ 7, 0.5, -16]} />
        <Cone position={[ 9, 0.5, -20]} />
        {/* Outer lane */}
        <Cone position={[ 5, 0.5,  8]} />
        <Cone position={[ 6, 0.5,  4]} />
        <Cone position={[ 5, 0.5,  0]} />
        <Cone position={[ 3, 0.5, -4]} />
        <Cone position={[ 0, 0.5, -8]} />
      </group>

      {/* ── Side Parking (Parkir Tepi) ────────────────────────────────────────── */}
      <group position={[-30, 0, 20]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 30]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* Bay poles */}
        <Pole position={[-3, 1.1, -5]}  demeritWeight={DEMERIT.POLE_HIT} label="side-park-pole" />
        <Pole position={[ 3, 1.1, -5]}  demeritWeight={DEMERIT.POLE_HIT} label="side-park-pole" />
        <Pole position={[-3, 1.1,  5]}  demeritWeight={DEMERIT.POLE_HIT} label="side-park-pole" />
        <Pole position={[ 3, 1.1,  5]}  demeritWeight={DEMERIT.POLE_HIT} label="side-park-pole" />
        <ParkingZone position={[0, 0, 0]} bayHalfExtents={[3, 1, 5]} label="side parking" />
      </group>

      {/* ── Parallel Parking (Parkir Selari) ─────────────────────────────────── */}
      <group position={[-30, 0, -20]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[24, 20]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* Bay corners */}
        <Pole position={[-4, 1.1, -3]}  demeritWeight={DEMERIT.POLE_HIT} label="parallel-park-pole" />
        <Pole position={[ 4, 1.1, -3]}  demeritWeight={DEMERIT.POLE_HIT} label="parallel-park-pole" />
        <Pole position={[-4, 1.1,  3]}  demeritWeight={DEMERIT.POLE_HIT} label="parallel-park-pole" />
        <Pole position={[ 4, 1.1,  3]}  demeritWeight={DEMERIT.POLE_HIT} label="parallel-park-pole" />
        <ParkingZone position={[0, 0, 0]} bayHalfExtents={[4, 1, 3]} label="parallel parking" />
      </group>

      {/* ── 3-Point Turn zone ─────────────────────────────────────────────────── */}
      <group position={[0, 0, -80]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[14, 20]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.9} />
          </mesh>
        </RigidBody>
        {/* Road edge poles */}
        {[-7, 7].map((x) =>
          [-8, -4, 0, 4, 8].map((z) => (
            <Pole key={`${x}-${z}`} position={[x, 1.1, z]} demeritWeight={DEMERIT.CONE_HIT} label="3pt-turn-boundary" />
          ))
        )}
        <Text
          position={[0, 0.15, 8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.7}
          color="#ffff88"
          anchorX="center"
          anchorY="middle"
        >
          3-POINT TURN / PUSINGAN 3 PENJURU
        </Text>
      </group>
    </group>
  );
}
