// Development only (/dev/sim): the simulator's world on its own, for building and screenshots.
// ?view=top shows the straight-down orthographic view; ?tier=medium uses the larger textures.
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { circuit } from '../data';
import { Daylight, TopDownCamera, World } from '../world/World';

export function SimPreview() {
  const [params] = useSearchParams();
  const top = params.get('view') === 'top';
  const [x0, y0, x1, y1] = circuit.site.bounds;
  const centre: [number, number, number] = [(x0 + x1) / 2, 0, -(y0 + y1) / 2];
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#9cc6e8' }}>
      <Canvas dpr={[1, 1.5]} gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <Physics timeStep={1 / 60}>
            <World tier={params.get('tier') === 'medium' ? 'medium' : 'low'} />
          </Physics>
          <Daylight />
        </Suspense>
        <TopDownCamera active={top} />
        {!top && (
          <>
            <PerspectiveCamera makeDefault position={[centre[0] - 45, 40, centre[2] + 55]} fov={50} near={0.1} far={1000} />
            <OrbitControls target={centre} />
          </>
        )}
      </Canvas>
    </div>
  );
}
