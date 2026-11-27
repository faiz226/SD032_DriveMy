import type { ReactNode } from "react";

interface FlipCardProps {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  className?: string;
}

/**
 * Two faces in one grid cell, so the card is as tall as its taller face. Same flip as the sign cards:
 * the hidden face is inert and hidden from assistive tech, and reduced motion swaps the faces with no turn.
 */
export function FlipCard({ flipped, front, back, className = "" }: FlipCardProps) {
  return (
    <div className={`perspective-1000 ${className}`}>
      <div
        className={`grid transform-style-3d transition-transform [transition-duration:var(--motion-slow)] [transition-timing-function:var(--ease-spring)] motion-reduce:transition-none ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        <div inert={flipped} aria-hidden={flipped} className="panel backface-hidden col-start-1 row-start-1 flex flex-col gap-3 p-4">
          {front}
        </div>
        <div inert={!flipped} aria-hidden={!flipped} className="panel backface-hidden rotate-y-180 col-start-1 row-start-1 flex flex-col gap-3 p-4">
          {back}
        </div>
      </div>
    </div>
  );
}
