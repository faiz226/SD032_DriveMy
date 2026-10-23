/**
 * Surfaces of the DriveMy design system (src/index.css, DESIGN.md).
 *
 * A Panel rests, a Tile is acted on, the HeroPanel holds the readiness
 * instrument. Colour on them means state, never decoration.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("panel", className)} {...props} />,
);
Panel.displayName = "Panel";

/** Tile status. `open` is "available to start", never "empty". */
export type TileState = "open" | "progress" | "done" | "fail" | "locked";

export const TILE_STATE: Record<TileState, string> = {
  open: "tile-open",
  progress: "tile-progress",
  done: "tile-done",
  fail: "tile-fail",
  locked: "tile-locked",
};

export type PillTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

/** Literal class names, so Tailwind's scanner keeps every tone. */
const PILL_TONE: Record<PillTone, string> = {
  neutral: "pill-neutral",
  brand: "pill-brand",
  success: "pill-success",
  warning: "pill-warning",
  danger: "pill-danger",
  info: "pill-info",
};

export function Pill({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: PillTone }) {
  return <span className={cn("pill", PILL_TONE[tone], className)} {...props} />;
}

export function Divider({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("divider w-full", className)} {...props} />;
}

/**
 * A number that carries weight: a score, a mark, a countdown. Tabular, so a
 * running clock does not shuffle its own layout every second.
 */
export function Figure({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("type-figure", className)} {...props} />;
}

export function HeroPanel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("hero-panel", className)} {...props} />;
}

export function SectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold tracking-tight md:text-xl", className)} {...props} />;
}
