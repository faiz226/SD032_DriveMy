import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Colour variant */
  variant?: "default" | "success" | "warning" | "destructive";
  /** Show percentage label */
  showLabel?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", showLabel = false, ...props }, ref) => {
  const { t } = useLanguage();
  const indicatorColor = {
    default:     "bg-primary",
    success:     "bg-success",
    warning:     "bg-warning",
    destructive: "bg-destructive",
  }[variant];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{t("common.progress")}</span>
          <span aria-live="polite">{Math.round(value ?? 0)}%</span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        aria-valuenow={value ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out-quart",
            indicatorColor
          )}
          style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
