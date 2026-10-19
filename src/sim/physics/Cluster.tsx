// Live needles on the Swift's own dials, as the Godot build had them (godot/scripts/cluster.gd).
// The dials are painted into the car's texture and the model has no needle geometry, so the needles are drawn
// on a transparent canvas laid over a copy of the binnacle face (surface.ts). The painted numerals stay
// underneath and correct. The HUD keeps its digital readout for legibility.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useDriver } from '../input';
import { SWIFT_2022 as CAR } from './cars/swift-2022';
import { flatFace } from './surface';

const NEEDLE = 0.33;            // needle length, as a fraction of the face's height: to the tick ring
// The scale is the printed dial's (CAR.cluster), not a shorter one that would move more at test speeds: at
// 40 km/h the needle has to sit on the painted 40.
// There is no engine model, so the revs present the road speed the way a CVT holds them: rising off idle,
// then nearly steady (1,600 at 10 km/h, 2,100 at 20, 3,200 at most). They make the cabin feel alive and are
// marked nowhere.
const IDLE_RPM = 800;
const rpmAt = (kmh: number) => IDLE_RPM + 2400 * (1 - Math.exp(-kmh / 25));
const RED = 'rgb(230, 41, 31)';
const HUB = 'rgb(172, 31, 23)';

type Dial = typeof CAR.cluster.speedo;

/** Two needles on a transparent canvas, redrawn only when the speed changes. */
class Needles {
  readonly texture: THREE.CanvasTexture;
  readonly material: THREE.MeshBasicMaterial;
  private g: CanvasRenderingContext2D;
  private kmh = -1;

  constructor(private aspect: number, private w = 512, private h = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    this.g = canvas.getContext('2d')!;
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthWrite: false, toneMapped: false });
    this.show(0);
  }

  show(kmh: number) {
    if (kmh === this.kmh) return;
    this.kmh = kmh;
    this.g.clearRect(0, 0, this.w, this.h);
    this.needle(CAR.cluster.speedo, kmh);
    this.needle(CAR.cluster.tacho, rpmAt(kmh));
    this.texture.needsUpdate = true;
  }

  private needle(dial: Dial, value: number) {
    const { g, w, h } = this;
    const [u, v] = dial.at;
    const a = THREE.MathUtils.degToRad(dial.zeroDeg + dial.degPerUnit * THREE.MathUtils.clamp(value, 0, dial.max));
    const x = u * w;
    const y = v * h;
    // equal lengths on the face, which is wider than the canvas's 2:1, so not equal in canvas units
    const rx = (Math.cos(a) * NEEDLE / this.aspect) * w;
    const ry = Math.sin(a) * NEEDLE * h;
    g.strokeStyle = RED;
    g.lineWidth = Math.max(2, h * 0.012);
    g.beginPath();
    g.moveTo(x - rx * 0.18, y - ry * 0.18);   // a short tail, as a real needle is counterweighted
    g.lineTo(x + rx, y + ry);
    g.stroke();
    g.fillStyle = HUB;
    g.beginPath();
    g.arc(x, y, Math.max(3, h * 0.022), 0, Math.PI * 2);
    g.fill();
  }

  dispose() {
    this.texture.dispose();
    this.material.dispose();
  }
}

export function Cluster({ body }: { body: THREE.Object3D }) {
  const face = useMemo(() => flatFace(body, CAR.cluster, CAR.eye), [body]);
  const needles = useMemo(() => face && new Needles(face.width / face.height), [face]);
  useEffect(() => () => { needles?.dispose(); face?.geometry.dispose(); }, [face, needles]);
  useFrame(() => needles?.show(Math.round(Math.abs(useDriver.getState().speedKmh) * 2) / 2));
  if (!face || !needles) return null;
  return <mesh geometry={face.geometry} material={needles.material} />;
}
