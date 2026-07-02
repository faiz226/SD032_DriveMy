import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DonutRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function DonutRing({
  percentage,
  size = 120,
  strokeWidth = 12,
  className,
}: DonutRingProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  let colorClass = "text-destructive";
  if (percentage >= 75) {
    colorClass = "text-success";
  } else if (percentage >= 50) {
    colorClass = "text-warning";
  }

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-muted fill-none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "fill-none transition-all duration-1000 ease-out",
            colorClass,
            "stroke-current"
          )}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          {Math.round(animatedPercentage)}%
        </span>
      </div>
    </div>
  );
}
