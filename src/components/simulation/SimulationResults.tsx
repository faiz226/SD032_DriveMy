import {
  Trophy, XCircle, ArrowCounterClockwise, ArrowLeft,
  Warning, Gauge
} from "phosphor-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { MAX_DEMERIT } from "@/stores/carStore";

interface SimulationResultsProps {
  maneuverName: string;
  demeritPoints: number;
  errors: number;
  stallCount: number;
  rollbackCm: number;
  passed: boolean;
  mode: "practice" | "assessment";
  onRetry: () => void;
  onBack: () => void;
}

export function SimulationResults({
  maneuverName,
  demeritPoints,
  errors,
  stallCount,
  rollbackCm,
  passed,
  mode,
  onRetry,
  onBack,
}: SimulationResultsProps) {
  const { t } = useLanguage();
  const demeritPct = Math.min(100, (demeritPoints / MAX_DEMERIT) * 100);

  return (
    <div className="max-w-md mx-auto card-premium p-6 sm:p-8 space-y-6 page-enter">
      {/* Header */}
      <div className="text-center space-y-3">
        <div
          className={cn(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-md",
            passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          )}
        >
          {passed ? (
            <Trophy className="w-7 h-7" weight="regular" aria-hidden />
          ) : (
            <XCircle className="w-7 h-7" weight="regular" aria-hidden />
          )}
        </div>

        <h2 className="font-heading text-2xl font-semibold tracking-tight">{maneuverName}</h2>

        <div
          className={cn(
            "inline-flex px-4 py-1.5 rounded-md text-sm font-semibold",
            passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          )}
        >
          {passed ? t("sim.resultPass") : t("sim.resultFail")}
        </div>

        {mode === "practice" && (
          <p className="text-xs text-muted-foreground">
            Practice Mode — demerits not counted towards official score.
            / Mod Latihan — demerit tidak dikira untuk skor rasmi.
          </p>
        )}
      </div>

      {/* Demerit Gauge (only meaningful in assessment mode) */}
      {mode === "assessment" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Demerit Points / Mata Demerit</span>
            <span className={cn("font-bold", demeritPoints >= MAX_DEMERIT ? "text-destructive" : "text-foreground")}>
              {demeritPoints} / {MAX_DEMERIT}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                demeritPct >= 100 ? "bg-destructive" : demeritPct >= 60 ? "bg-warning" : "bg-success"
              )}
              style={{ width: `${demeritPct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Pass = &lt;{MAX_DEMERIT} pts · Fail = ≥{MAX_DEMERIT} pts
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-md border border-border bg-muted/50 flex flex-col items-center gap-1">
          <Warning className="w-5 h-5 text-destructive" weight="regular" aria-hidden />
          <span className="font-mono text-2xl font-bold font-tabular-nums">{errors}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Collisions
          </span>
        </div>

        <div className="p-4 rounded-md border border-border bg-muted/50 flex flex-col items-center gap-1">
          <Gauge className="w-5 h-5 text-warning" weight="regular" aria-hidden />
          <span className="font-mono text-2xl font-bold font-tabular-nums">{stallCount}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t("sim.stallsLabel")}
          </span>
        </div>

        <div className="p-4 rounded-md border border-border bg-muted/50 flex flex-col items-center gap-1">
          <ArrowCounterClockwise className="w-5 h-5 text-muted-foreground" weight="regular" aria-hidden />
          <span className="text-2xl font-bold font-heading font-tabular-nums">
            {rollbackCm}
            <span className="text-sm">cm</span>
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {t("sim.rollbackLabel")}
          </span>
        </div>

        <div className="p-4 rounded-md border border-border bg-muted/50 flex flex-col items-center gap-1">
          <Warning className={cn("w-5 h-5", demeritPoints > 0 ? "text-destructive" : "text-muted-foreground")} weight="fill" aria-hidden />
          <span className={cn("font-mono text-2xl font-bold font-tabular-nums", demeritPoints >= MAX_DEMERIT ? "text-destructive" : "")}>
            {demeritPoints}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Demerit Pts
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="w-full min-h-[48px] py-3 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <ArrowCounterClockwise className="w-4 h-4" weight="regular" aria-hidden />
          {t("sim.tryAgain")}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full min-h-[48px] py-3 rounded-md border border-border font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" weight="regular" aria-hidden />
          {t("sim.backToSimulations")}
        </button>
      </div>
    </div>
  );
}
