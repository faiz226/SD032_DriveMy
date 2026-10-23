// Development only (/dev/sim): the simulator's world and car without the app's screens.
//   ?view=drive (default) first person, ?view=top straight down, ?view=orbit a free camera
//   ?start=<station id> starts at that station's practice start point instead of the spawn
//   ?tier=medium uses the larger textures
//   ?touch=on shows the touch controls on any device
//   ?verdict=demo shows the verdict screen over the scene, with a sample failed run
// Keys: W/S throttle and brake, A/D steer, R gear, Space handbrake, T top-down, P pause.
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { StationId } from '../contracts';
import { circuit } from '../data';
import { rad } from '../geom';
import { useDriver, useKeyboardControls, useTouchUi } from '../input';
import { type CarApi, SwiftCar } from '../physics/SwiftCar';
import { TIERS } from '../quality';
import { TouchControls } from '../TouchControls';
import { LoadingMap } from '../ui/LoadingMap';
import { type Verdict, VerdictView } from '../ui/Verdict';

const DEMO: Verdict = {
  pass: false, demerits: 25, failedStations: ['side-parking'], topDownSeconds: 42,
  faults: [
    { kind: 'pole', station: 'side-parking', points: 20, at: [29.2, 11.35], t: 92, reasonKey: 'sim.fault.pole', fixKey: 'sim.fix.pole', basis: 'rubric; guides: touching a pole fails the element' },
    { kind: 'kerb', station: 's-curve', points: 5, at: [52.4, 25.1], t: 240, reasonKey: 'sim.fault.kerb', fixKey: 'sim.fix.kerb', basis: 'decided: guides list touching a kerb as a minor fault worth 2-5 points' },
    { kind: 'station_failed', station: 'road-merging', points: 0, at: [113, 2], t: 380, measured: '12 km/h', limit: '15 km/h', reasonKey: 'sim.fault.merge.slow', fixKey: 'sim.fix.merge.slow', basis: 'prd' },
  ],
};
import { Daylight, TopDownCamera, World } from '../world/World';
import { Scenery } from '../world/Scenery';

export function SimPreview() {
  const [params] = useSearchParams();
  const view = params.get('view') ?? 'drive';
  const tier = params.get('tier') === 'medium' ? 'medium' : 'low';
  const station = circuit.stations.find((s) => s.id === (params.get('start') as StationId));
  const start = station ? { at: station.start.at, heading: rad(station.start.heading_deg) } : { at: circuit.spawn.at, heading: rad(circuit.spawn.heading_deg) };
  const topDown = useDriver((s) => s.topDown) || view === 'top';
  const paused = useDriver((s) => s.paused);
  const [readout, setReadout] = useState('');
  const [ready, setReady] = useState(false);
  const car = useRef<CarApi>(null);
  const touch = useTouchUi() || params.get('touch') === 'on';
  useKeyboardControls();
  useEffect(() => { useDriver.getState().set({ handbrake: circuit.spawn.handbrake, paused: false }); }, []);
  const [x0, y0, x1, y1] = circuit.site.bounds;
  const centre: [number, number, number] = [(x0 + x1) / 2, 0, -(y0 + y1) / 2];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#9cc6e8' }}>
      <Canvas dpr={[1, 1.5]} shadows={TIERS[tier].shadows && 'percentage'} gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <Physics timeStep={1 / 60} paused={paused}>
            <World tier={tier} />
            <Scenery tier={tier} />
            <SwiftCar
              ref={car}
              quality={TIERS[tier]}
              start={start}
              firstPerson={view === 'drive' && !topDown}
              onReady={() => setReady(true)}
              onStep={(s) => {
                if (Math.round(s.t * 60) % 6 === 0) {
                  setReadout(`${s.speedKmh.toFixed(1)} km/h  ${s.gear}${s.handbrake ? '  HANDBRAKE' : ''}  x ${s.x.toFixed(1)} y ${s.y.toFixed(1)}  ${s.wheels.some((w) => w.onKerb !== null) ? 'KERB' : ''}`);
                }
              }}
            />
          </Physics>
          <Daylight shadows={TIERS[tier].shadows} follow={() => car.current?.group() ?? null} />
        </Suspense>
        <TopDownCamera active={topDown} />
        {view === 'orbit' && !topDown && (
          <>
            <PerspectiveCamera makeDefault position={[centre[0] - 45, 40, centre[2] + 55]} fov={50} near={0.1} far={1000} />
            <OrbitControls target={centre} />
          </>
        )}
      </Canvas>
      <LoadingMap ready={ready} />
      {touch && <TouchControls />}
      {params.get('verdict') === 'demo' && <VerdictView verdict={DEMO} save="saved" onRetry={() => {}} onPractise={() => {}} onExit={() => {}} />}
      <div style={{ position: 'absolute', left: touch ? 180 : 12, bottom: touch ? 70 : 12, padding: '6px 10px', background: 'rgba(0,0,0,0.55)', color: 'white', font: '14px monospace', borderRadius: 6 }}>
        {readout}{paused ? '  PAUSED' : ''}
      </div>
    </div>
  );
}
