import { CheckCircle, Clock, Circle } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type MilestoneState = "complete" | "inProgress" | "notStarted";

export interface MilestoneRowProps {
  module: string;
  result: string;
  state: MilestoneState;
  stateLabel: string;
}

export function MilestoneRow({ module, result, state, stateLabel }: MilestoneRowProps) {
  const StateIcon = state === "complete" ? CheckCircle : state === "inProgress" ? Clock : Circle;
  const stateColor = state === "complete" ? "text-success" : state === "inProgress" ? "text-primary" : "text-muted-foreground";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 py-3 px-4 rounded-md bg-background border border-border">
      <p className="text-sm font-medium text-foreground">{module}</p>
      <div className="flex flex-col sm:items-end gap-1">
        <p className="text-sm font-tabular-nums font-semibold text-foreground">{result}</p>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", stateColor)}>
          <StateIcon className="h-3.5 w-3.5" weight="fill" aria-hidden />
          {stateLabel}
        </span>
      </div>
    </div>
  );
}

export function SettingsPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "card-premium p-5 md:p-6 space-y-5",
        className
      )}
      aria-labelledby={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <h2
        id={`settings-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="font-heading text-sm font-semibold text-muted-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 max-w-readable">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center min-h-[48px]">{children}</div>
    </div>
  );
}

