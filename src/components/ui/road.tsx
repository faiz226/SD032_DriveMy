/**
 * Jalan road primitives — see DESIGN_SYSTEM.md.
 *
 * The interface is the road surface; the content is the signage. These are the
 * surfaces content sits on, so they stay achromatic: the only saturated colour
 * on screen should belong to an actual JPJ sign or an actual pass/fail state.
 *
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/** Bay status. `open` is "available to start", never "empty". */
export type BayState = "open" | "progress" | "done" | "fail" | "locked";

const BAY_STATE: Record<BayState, string> = {
  open: "bay-open",
  progress: "bay-progress",
  done: "bay-done",
  fail: "bay-fail",
  locked: "bay-locked",
};

/**
 * A painted parking bay: square corners, paint on the leading edge. The kerb
 * colour is the status, which is why status never needs a coloured fill.
 */
export const Bay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { state?: BayState }
>(({ state = "open", className, ...props }, ref) => (
  <div ref={ref} className={cn("bay", BAY_STATE[state], className)} {...props} />
));
Bay.displayName = "Bay";

/**
 * An informational surface — the 4px corner a JPJ plate has, and a hairline
 * edge. The edge is load-bearing, not decoration: a raised surface measures
 * 1.18:1 against the page, so without the edge the plate does not exist in
 * daylight on a cheap panel.
 */
export const Plate = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("plate", className)} {...props} />
));
Plate.displayName = "Plate";

/**
 * Yellow as a plate rather than as text. `awas` on a pale surface measures
 * 1.67:1; asphalt on `awas` measures 8.83:1 — and dark-on-yellow is what a
 * warning diamond actually does.
 */
export const AwasPlate = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn("plate-awas", className)} {...props} />
));
AwasPlate.displayName = "AwasPlate";

/** A line's pattern states permission, the way it does on a Malaysian road. */
export type RuleMarking = "locked" | "closed" | "open" | "progress";

const RULE_MARKING: Record<RuleMarking, string> = {
  locked: "mark-locked",
  closed: "mark-closed",
  open: "mark-open",
  progress: "mark-progress",
};

export function RoadRule({
  marking = "open",
  className,
  ...props
}: React.HTMLAttributes<HTMLHRElement> & { marking?: RuleMarking }) {
  return (
    <hr
      role="separator"
      className={cn("w-full border-0", RULE_MARKING[marking], className)}
      {...props}
    />
  );
}

/**
 * A number that carries weight — a score, a mark, a countdown. Tabular so a
 * running clock does not shuffle its own layout every second.
 */
export function Figure({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("type-figure", className)} {...props} />;
}

export function Carriageway({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("carriageway", className)} {...props} />;
}

export function LPlate({ letter, verified = false, label }: { letter: "L" | "P"; verified?: boolean; label: string }) {
  return <span className="inline-flex flex-col items-center gap-2">
    <span className={cn("type-plate flex h-12 w-12 items-center justify-center border-2 text-3xl", !verified && "border-dashed")}
      style={{ background: verified ? "rgb(var(--sign-info))" : "transparent", color: "rgb(var(--paint))", borderColor: "rgb(var(--paint))" }}>{letter}</span>
    <span className="type-body text-xs text-center">{label}</span>
  </span>;
}

/**
 * A section head. Sentence case in the body family — deliberately not the plate
 * voice, which is reserved for things that are genuinely signage.
 */
export function SectionHead({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("type-label-strong text-[0.9375rem]", className)}
      style={{ color: "rgb(var(--road-ink))" }}
      {...props}
    />
  );
}
