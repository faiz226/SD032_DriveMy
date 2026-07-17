import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ArrowCircleLeft, ArrowCircleRight, Eye, Warning, Gauge
} from "phosphor-react";

interface SimulationHUDProps {
  leftSignal: boolean;
  rightSignal: boolean;
  mirrorChecked: boolean;
  errors: number;
  speed: number;
  gear: number;
  onMirrorCheck: () => void;
  onLeftSignal: () => void;
  onRightSignal: () => void;
}

export function SimulationHUD({
  leftSignal,
  rightSignal,
  mirrorChecked,
  errors,
  speed,
  gear,
  onMirrorCheck,
  onLeftSignal,
  onRightSignal,
}: SimulationHUDProps) {
  const { t } = useLanguage();

  return (
    <div
      className="hud-panel flex flex-wrap items-center justify-between gap-2 px-4 py-3"
      role="toolbar"
      aria-label="Simulation controls"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLeftSignal}
          className={cn(
            "min-h-[44px] min-w-[44px] p-2.5 rounded-md transition-colors duration-200",
            leftSignal
              ? "bg-warning/20 text-warning"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
          aria-label={t("sim.hud.signalLeft")}
          aria-pressed={leftSignal}
        >
          <ArrowCircleLeft className="w-5 h-5" weight="regular" />
        </button>
        <button
          type="button"
          onClick={onRightSignal}
          className={cn(
            "min-h-[44px] min-w-[44px] p-2.5 rounded-md transition-colors duration-200",
            rightSignal
              ? "bg-warning/20 text-warning"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
          aria-label={t("sim.hud.signalRight")}
          aria-pressed={rightSignal}
        >
          <ArrowCircleRight className="w-5 h-5" weight="regular" />
        </button>
      </div>

      <button
        type="button"
        onClick={onMirrorCheck}
        className={cn(
          "flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-md font-medium transition-colors duration-200",
          mirrorChecked
            ? "bg-success/15 text-success"
            : "bg-muted text-muted-foreground hover:bg-accent"
        )}
        aria-label={t("sim.hud.mirrorCheck")}
        aria-pressed={mirrorChecked}
      >
        <Eye className="w-4 h-4" weight="regular" aria-hidden />
        {t("sim.hud.mirror")}
      </button>

      <div
        className={cn(
          "flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-md font-bold font-mono font-tabular-nums",
          errors > 0
            ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Warning className="w-4 h-4" weight="regular" aria-hidden />
        {errors}
      </div>

      <div className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-md bg-muted font-bold font-mono font-tabular-nums text-foreground">
        <Gauge className="w-4 h-4 text-muted-foreground" weight="regular" aria-hidden />
        {speed}
        <span className="text-muted-foreground font-normal">km/h</span>
        <div className="w-px h-4 bg-border mx-1" />
        <span className="text-primary">{gear === 0 ? "N" : gear === -1 ? "R" : `G${gear}`}</span>
      </div>
    </div>
  );
}
