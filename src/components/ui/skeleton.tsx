import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as a circle (for avatars) */
  circle?: boolean;
}

/**
 * Skeleton loading placeholder.
 * Always pair with aria-busy on the parent container.
 *
 * @example
 *   <div aria-busy="true" aria-label="Loading content">
 *     <Skeleton className="h-6 w-48" />
 *     <Skeleton className="h-4 w-32 mt-2" />
 *   </div>
 */
function Skeleton({ className, circle = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-[linear-gradient(90deg,oklch(var(--muted))_0%,oklch(var(--muted)/0.45)_50%,oklch(var(--muted))_100%)] bg-[length:200%_100%]",
        circle ? "rounded-full" : "rounded-xl",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
