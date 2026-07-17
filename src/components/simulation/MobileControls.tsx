import { useState, useRef } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { useCarStore } from '@/stores/carStore';

export function MobileControls() {
  const { setAccelerating, setBraking, setClutch, setSteering } = useCarStore();
  const steeringRef = useRef<HTMLDivElement>(null);
  
  // Steering logic
  const [steeringAngle, setSteeringAngle] = useState(0);

  const handleSteerStart = (e: ReactTouchEvent) => {
    e.preventDefault();
  };

  const handleSteerMove = (e: ReactTouchEvent) => {
    e.preventDefault();
    if (!steeringRef.current) return;
    const rect = steeringRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // Adjust so top is 0
    
    // Clamp angle to roughly -90 to 90
    if (angle > 180) angle -= 360;
    if (angle > 90) angle = 90;
    if (angle < -90) angle = -90;
    
    setSteeringAngle(angle);
    setSteering(-(angle / 90)); // -1 to 1, mapped from -90 to 90 degrees
  };

  const handleSteerEnd = (e: ReactTouchEvent) => {
    e.preventDefault();
    setSteeringAngle(0);
    setSteering(0);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-end p-4 pb-12 md:hidden">
      <div className="flex justify-between items-end w-full">
        {/* Left side: Steering and Clutch */}
        <div className="flex flex-col gap-6 pointer-events-auto">
          {/* Steering Wheel */}
          <div 
            ref={steeringRef}
            className="w-32 h-32 rounded-full border-4 border-white/40 bg-black/20 flex items-center justify-center relative touch-none"
            onTouchStart={handleSteerStart}
            onTouchMove={handleSteerMove}
            onTouchEnd={handleSteerEnd}
            onTouchCancel={handleSteerEnd}
          >
            <div 
              className="w-full h-2 bg-white/60 absolute"
              style={{ transform: `rotate(${steeringAngle}deg)` }}
            />
            <div className="w-8 h-8 rounded-full bg-white/40 z-10" />
          </div>

          {/* Clutch Pedal */}
          <button
            className="w-20 h-24 rounded-lg border-2 border-white/50 bg-black/40 text-white font-bold text-sm active:bg-white/20 active:translate-y-2 transition-all touch-none select-none"
            onTouchStart={(e) => { e.preventDefault(); setClutch(1); }}
            onTouchEnd={(e) => { e.preventDefault(); setClutch(0); }}
            onTouchCancel={(e) => { e.preventDefault(); setClutch(0); }}
          >
            CLUTCH
          </button>
        </div>

        {/* Right side: Brake and Gas */}
        <div className="flex gap-4 pointer-events-auto items-end">
          {/* Brake Pedal */}
          <button
            className="w-24 h-20 rounded-lg border-2 border-red-400/60 bg-red-500/40 text-white font-bold text-sm active:bg-red-500/60 active:translate-y-2 transition-all touch-none select-none"
            onTouchStart={(e) => { e.preventDefault(); setBraking(true); }}
            onTouchEnd={(e) => { e.preventDefault(); setBraking(false); }}
            onTouchCancel={(e) => { e.preventDefault(); setBraking(false); }}
          >
            BRAKE
          </button>
          
          {/* Gas Pedal */}
          <button
            className="w-20 h-32 rounded-lg border-2 border-green-400/60 bg-green-500/40 text-white font-bold text-sm active:bg-green-500/60 active:translate-y-2 transition-all touch-none select-none"
            onTouchStart={(e) => { e.preventDefault(); setAccelerating(true); }}
            onTouchEnd={(e) => { e.preventDefault(); setAccelerating(false); }}
            onTouchCancel={(e) => { e.preventDefault(); setAccelerating(false); }}
          >
            GAS
          </button>
        </div>
      </div>
    </div>
  );
}
