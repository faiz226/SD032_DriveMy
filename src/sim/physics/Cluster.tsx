// Live needles on the Swift's own dials, as the Godot build had them (godot/scripts/cluster.gd): fed the road
// speed every frame, never in steps, and eased a little so they sweep the way a real needle does.
// The dials are painted into the car's texture and the model has no needle geometry, so each needle is a thin
// red blade with a hub, laid on the dial's own face (surface.ts) and turned about the face's normal. Turning a
// mesh costs nothing a frame; redrawing and re-uploading a needle texture 60 times a second would, on a phone.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { flatFace } from './surface';

// Sizes as fractions of the face's height, as the Godot build drew them
const NEEDLE = 0.32;        // to the tick ring
const TAIL = 0.18;          // the counterweight behind the hub, as a share of the length
const WIDTH = 0.012;
const HUB = 0.022;
const LIFT_M = 0.0015;      // off the dial, toward the driver: in front of the paint, too little to see
const EASE_S = 0.08;        // how quickly a needle settles on a new reading
// The scale is the printed dial's (CAR.cluster), not a shorter one that would move more at test speeds: at
// 40 km/h the needle has to sit on the painted 40.
// There is no engine model, so the revs present the road speed the way a CVT holds them: rising off idle,
// then nearly steady (1,600 at 10 km/h, 2,100 at 20, 3,200 at most). They make the cabin feel alive and are
// marked nowhere.
const IDLE_RPM = 800;
const rpmAt = (kmh: number) => IDLE_RPM + 2400 * (1 - Math.exp(-kmh / 25));
const RED = new THREE.Color('rgb(230, 41, 31)');
const HUB_RED = new THREE.Color('rgb(172, 31, 23)');

type Dial = typeof CAR.cluster.speedo;
type Face = NonNullable<ReturnType<typeof flatFace>>;

/** One blade and its hub, along +x from the pivot, in the plane facing +z; coloured per vertex. */
function needleGeometry(height: number) {
  const len = NEEDLE * height;
  const w = (WIDTH * height) / 2;
  const r = HUB * height;
  const pos: number[] = [];
  const col: number[] = [];
  const vertex = (x: number, y: number, z: number, c: THREE.Color) => { pos.push(x, y, z); col.push(c.r, c.g, c.b); };
  const quad = [[-TAIL * len, -w], [len, -w], [len, w], [-TAIL * len, -w], [len, w], [-TAIL * len, w]];
  for (const [x, y] of quad) vertex(x, y, 0, RED);
  const n = 16;
  for (let i = 0; i < n; i++) {   // the hub, a hair in front of the blade
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    vertex(0, 0, 0.0002, HUB_RED);
    vertex(Math.cos(a0) * r, Math.sin(a0) * r, 0.0002, HUB_RED);
    vertex(Math.cos(a1) * r, Math.sin(a1) * r, 0.0002, HUB_RED);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** Both needles as one instanced mesh: one draw call, two matrices a frame. */
class Needles {
  readonly mesh: THREE.InstancedMesh;
  private kmh = 0;
  private pivots: THREE.Vector3[];
  private dir = new THREE.Vector3();
  private side = new THREE.Vector3();
  private m = new THREE.Matrix4();

  constructor(private face: Face) {
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.InstancedMesh(needleGeometry(face.height), material, 2);
    this.mesh.frustumCulled = false;   // the geometry sits at the origin; the instances on the dials
    this.pivots = [CAR.cluster.speedo, CAR.cluster.tacho].map((d) =>
      face.pointAt(d.at[0], 1 - d.at[1]).addScaledVector(face.normal, LIFT_M));   // the dial's v runs top down
    this.show(0, 1);
  }

  /** `target` km/h now; `dt` seconds since the last frame. */
  show(target: number, dt: number) {
    this.kmh += (target - this.kmh) * (1 - Math.exp(-dt / EASE_S));
    this.place(0, CAR.cluster.speedo, this.kmh);
    this.place(1, CAR.cluster.tacho, rpmAt(this.kmh));
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private place(i: number, dial: Dial, value: number) {
    const a = THREE.MathUtils.degToRad(dial.zeroDeg + dial.degPerUnit * THREE.MathUtils.clamp(value, 0, dial.max));
    // clockwise from pointing right, as the dial is read: with the face's up, that is right cos a - up sin a
    this.dir.copy(this.face.right).multiplyScalar(Math.cos(a)).addScaledVector(this.face.up, -Math.sin(a));
    this.side.crossVectors(this.face.normal, this.dir);
    this.m.makeBasis(this.dir, this.side, this.face.normal).setPosition(this.pivots[i]);
    this.mesh.setMatrixAt(i, this.m);
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}

/** `speed` gives the car's road speed in km/h, read every frame. */
export function Cluster({ body, speed }: { body: THREE.Object3D; speed: () => number }) {
  const face = useMemo(() => flatFace(body, CAR.cluster, CAR.eye), [body]);
  const needles = useMemo(() => face && new Needles(face), [face]);
  useEffect(() => () => { needles?.dispose(); face?.geometry.dispose(); }, [face, needles]);
  useFrame((_, dt) => needles?.show(Math.abs(speed()), dt));
  if (!needles) return null;
  return <primitive object={needles.mesh} />;
}
