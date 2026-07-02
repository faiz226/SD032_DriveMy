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
        "animate-pulse bg-muted",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
