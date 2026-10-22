import { cn } from "@/lib/utils";

/**
 * The DriveMy mark: two lane strokes leaning forward, road yellow then ink,
 * and the wordmark in heavy Overpass.
 */
export function BrandMark({ className, wordmark = true }: { className?: string; wordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center font-black tracking-[-0.03em]", className)}>
      <i aria-hidden="true" className="mr-[3px] h-7 w-2.5 -skew-x-[18deg] bg-brand" />
      <i aria-hidden="true" className="mr-2 h-7 w-2.5 -skew-x-[18deg] bg-current" />
      {wordmark && <span className="pt-0.5 text-[1.625rem] leading-none">DriveMy</span>}
    </span>
  );
}
