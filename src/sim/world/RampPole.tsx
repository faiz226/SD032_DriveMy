// The ramp's pole (the owner, 2 Nov): it stands on the platform until the car has held still short of it, then
// slides aside towards the right-hand wall, as the pole is moved aside in the yard. The yard is one mesh, so this
// one pole is drawn on its own; its collider stays where it stood, and the rules ignore it once it is aside.
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { circuit } from '../data';
import { RED, WHITE, toThree } from './build';

const pole = circuit.obstacles.poles.find((p) => p.station === 'ramp-test')!;
const ramp = circuit.stations.find((st) => st.id === 'ramp-test')!;
const width = circuit.slopes.find((sl) => sl.id === ramp.slope)!.width;
const ASIDE = width / 2 - 0.3;   // metres across, to just short of the wall
const SPEED = 1.5;               // metres a second
const BANDS = Math.max(1, Math.round(pole.height / 0.2));
const h = (ramp.axis!.heading_deg * Math.PI) / 180;
const right: [number, number] = [Math.sin(h), -Math.cos(h)];   // the way in's right-hand side
const base = toThree(pole.at[0], pole.at[1], pole.base_z ?? 0);
const colours = [RED, WHITE].map((c) => new THREE.Color().setRGB(...c));

export function RampPole({ open, snap = false }: { open: boolean; snap?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const moved = useRef<number | null>(null);
  useFrame((_, dt) => {
    const want = open ? ASIDE : 0;
    const now = moved.current ?? want;   // the first frame puts it where it belongs
    moved.current = snap ? want : now + Math.sign(want - now) * Math.min(Math.abs(want - now), SPEED * dt);
    group.current?.position.set(base.x + right[0] * moved.current, base.y, base.z - right[1] * moved.current);
  });
  return (
    <group ref={group} position={base}>
      {Array.from({ length: BANDS }, (_, k) => (
        <mesh key={k} position={[0, ((k + 0.5) * pole.height) / BANDS, 0]}>
          <cylinderGeometry args={[pole.radius, pole.radius, pole.height / BANDS, 10]} />
          <meshStandardMaterial color={colours[k % 2]} roughness={0.8} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
