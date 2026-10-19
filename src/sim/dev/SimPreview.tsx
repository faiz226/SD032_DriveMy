// Development only (/dev/sim): the simulator's world and car without the app's screens.
//   ?view=drive (default) first person, ?view=top straight down, ?view=orbit a free camera
//   ?start=<station id> starts at that station's practice start point instead of the spawn
//   ?tier=medium uses the larger textures
//   ?touch=on shows the touch controls on any device
// Keys: W/S throttle and brake, A/D steer, R gear, Space handbrake, T top-down, P pause.
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { StationId } from '../contracts';
import { circuit } from '../data';
import { rad } from '../geom';
import { useDriver, useKeyboardControls, useTouchUi } from '../input';
import { SwiftCar } from '../physics/SwiftCar';
import { TouchControls } from '../TouchControls';
import { Daylight, TopDownCamera, World } from '../world/World';

export function SimPreview() {
  const [params] = useSearchParams();
  const view = params.get('view') ?? 'drive';
  const tier = params.get('tier') === 'medium' ? 'medium' : 'low';
  const station = circuit.stations.find((s) => s.id === (params.get('start') as StationId));
  const start = station ? { at: station.start.at, heading: rad(station.start.heading_deg) } : { at: circuit.spawn.at, heading: rad(circuit.spawn.heading_deg) };
  const topDown = useDriver((s) => s.topDown) || view === 'top';
  const paused = useDriver((s) => s.paused);
  const [readout, setReadout] = useState('');
  const touch = useTouchUi() || params.get('touch') === 'on';
  useKeyboardControls();
  useEffect(() => { useDriver.getState().set({ handbrake: circuit.spawn.handbrake, paused: false }); }, []);
  const [x0, y0, x1, y1] = circuit.site.bounds;
  const centre: [number, number, number] = [(x0 + x1) / 2, 0, -(y0 + y1) / 2];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#9cc6e8' }}>
      <Canvas dpr={[1, 1.5]} gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <Physics timeStep={1 / 60} paused={paused}>
            <World tier={tier} />
            <SwiftCar
              tier={tier}
              start={start}
              firstPerson={view === 'drive' && !topDown}
              onStep={(s) => {
                if (Math.round(s.t * 60) % 6 === 0) {
                  setReadout(`${s.speedKmh.toFixed(1)} km/h  ${s.gear}${s.handbrake ? '  HANDBRAKE' : ''}  x ${s.x.toFixed(1)} y ${s.y.toFixed(1)}  ${s.wheels.some((w) => w.onKerb !== null) ? 'KERB' : ''}`);
                }
              }}
            />
          </Physics>
          <Daylight />
        </Suspense>
        <TopDownCamera active={topDown} />
        {view === 'orbit' && !topDown && (
          <>
            <PerspectiveCamera makeDefault position={[centre[0] - 45, 40, centre[2] + 55]} fov={50} near={0.1} far={1000} />
            <OrbitControls target={centre} />
          </>
        )}
      </Canvas>
      {touch && <TouchControls />}
      <div style={{ position: 'absolute', left: touch ? 180 : 12, bottom: touch ? 70 : 12, padding: '6px 10px', background: 'rgba(0,0,0,0.55)', color: 'white', font: '14px monospace', borderRadius: 6 }}>
        {readout}{paused ? '  PAUSED' : ''}
      </div>
    </div>
  );
}
