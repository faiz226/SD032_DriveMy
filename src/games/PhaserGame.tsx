import { useEffect, useRef } from "react";
import type PhaserType from "phaser";

interface PhaserGameProps {
  /** The dynamically-imported Phaser namespace — passed in by SimulationView. */
  Phaser: typeof PhaserType;
  config: PhaserType.Types.Core.GameConfig & Record<string, unknown>;
  className?: string;
  onGameReady?: (game: PhaserType.Game) => void;
}

export function PhaserGame({ Phaser, config, className, onGameReady }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserType.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance before creating new one
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    // Create new Phaser game with container as parent
    gameRef.current = new Phaser.Game({
      ...config,
      parent: containerRef.current,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        ...config.scale,
      },
    });

    onGameReady?.(gameRef.current);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}