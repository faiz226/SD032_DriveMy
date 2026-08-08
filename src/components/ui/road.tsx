/**
 * Road primitives — the structural language of the "Jalan" design system.
 *
 * The interface is the road surface; the content is the signage. These are the
 * pieces that draw the surface. See DESIGN_SYSTEM.md.
 *
 * The marking set is not decoration: a line's pattern says what you may do,
 * exactly as it does on a Malaysian road.
 *
 *   double solid    locked    prerequisite unmet, you may not cross yet
 *   single solid    closed    finished, nothing left to do here
 *   broken          open      available to start or continue
 *   broken, painted progress  this is where you left off
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export type MarkState = "locked" | "closed" | "open" | "progress";

const MARK_CLASS: Record<MarkState, string> = {
  locked: "mark-locked",
  closed: "mark-closed",
  open: "mark-open",
  progress: "mark-progress",
};

/* ── RoadRule ───────────────────────────────────────────────────────────────
   A painted line. Decorative by default — the state it encodes is always also
   carried by adjacent text, so screen readers get the meaning from there. Pass
   `srLabel` on the rare occasion the line is the only thing saying it.        */

export interface RoadRuleProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: MarkState;
  vertical?: boolean;
  srLabel?: string;
}

export function RoadRule({
  state = "open",
  vertical = false,
  srLabel,
  className,
  ...props
}: RoadRuleProps) {
  return (
    <div
      role={srLabel ? "img" : undefined}
      aria-label={srLabel}
      aria-hidden={srLabel ? undefined : true}
      className={cn("mark", MARK_CLASS[state], vertical && "mark-v", className)}
      {...props}
    />
  );
}

/* ── SectionHead ────────────────────────────────────────────────────────────
   A plate-lettered label with the rule running out to the edge. Replaces the
   free-floating `<h2>` that every section used to open with.                  */

export interface SectionHeadProps {
  children: React.ReactNode;
  /** What the rule beside this heading should say about the section. */
  state?: MarkState;
  /** Right-aligned control (a link, a filter, a count). */
  action?: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
}

export function SectionHead({
  children,
  state = "open",
  action,
  as: Tag = "h2",
  className,
}: SectionHeadProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Tag className="type-label-strong text-sm text-foreground shrink-0">
        {children}
      </Tag>
      <RoadRule state={state} className="flex-1" />
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ── Bay ────────────────────────────────────────────────────────────────────
   A painted parking bay: a rectangle with paint on one edge, no radius. The
   kerb colour is the status. This replaces the app's floating rounded card.   */

export type BayState = "default" | "open" | "progress" | "done" | "fail";

const BAY_CLASS: Record<BayState, string> = {
  default: "",
  open: "bay-open",
  progress: "bay-progress",
  done: "bay-done",
  fail: "bay-fail",
};

export interface BayProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: BayState;
}

export const Bay = React.forwardRef<HTMLDivElement, BayProps>(
  ({ state = "default", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bay", BAY_CLASS[state], className)}
      {...props}
    />
  )
);
Bay.displayName = "Bay";

/* ── Plate ──────────────────────────────────────────────────────────────────
   An informational surface — the small-cornered plate a blue JPJ sign uses.
   For content that informs rather than reports status.                        */

export const Plate = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("plate", className)} {...props} />
));
Plate.displayName = "Plate";

/* ── Carriageway ────────────────────────────────────────────────────────────
   The dark road surface. Marks and signs sit on it in both themes, so its
   contents opt into the on-road palette.                                      */

export const Carriageway = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("carriageway on-road", className)} {...props} />
));
Carriageway.displayName = "Carriageway";

/* ── LPlate ─────────────────────────────────────────────────────────────────
   The real object: a Malaysian learner plate is a red L on white; the
   probationary plate that follows it is a white P on red. Used to mark where
   the learner is now and what they are driving toward — nowhere else.         */

export interface LPlateProps {
  letter: "L" | "P";
  /** px edge length. Malaysian plates are square. */
  size?: number;
  /**
   * Whether the learner actually holds this licence. An unearned plate is
   * drawn as an empty outline — the shape of the thing they are working
   * toward, without the colour that says they have it.
   */
  earned?: boolean;
  className?: string;
  title?: string;
}

export function LPlate({
  letter,
  size = 34,
  earned = true,
  className,
  title,
}: LPlateProps) {
  const isLearner = letter === "L";
  return (
    <span
      role="img"
      aria-label={title ?? (isLearner ? "Learner plate" : "Probationary plate")}
      title={title}
      style={{ width: size, height: size, fontSize: size * 0.62 }}
      className={cn(
        "inline-grid select-none place-items-center leading-none",
        "type-figure",
        earned
          ? isLearner
            ? "bg-paint text-berhenti"
            : "bg-berhenti text-paint"
          : "border-2 border-dashed border-current bg-transparent text-current opacity-45",
        className
      )}
    >
      {letter}
    </span>
  );
}

/* ── Figure ─────────────────────────────────────────────────────────────────
   A load-bearing number with its unit and label. Scores, counts, timers.
   Tabular by construction so digits never jitter as values update.            */

export interface FigureProps {
  value: React.ReactNode;
  unit?: string;
  label?: React.ReactNode;
  /** Tailwind text size for the value. */
  size?: string;
  /**
   * No value yet. Renders a broken line in the figure's place rather than a
   * dash — at figure weight an em dash reads as a redaction bar, and the
   * marking already means "open, not started".
   */
  empty?: boolean;
  className?: string;
}

export function Figure({
  value,
  unit,
  label,
  size = "text-3xl",
  empty = false,
  className,
}: FigureProps) {
  return (
    <div className={cn("min-w-0", className)}>
      {empty ? (
        <div className={cn("flex items-center", size)}>
          <RoadRule state="open" className="w-10 opacity-50" />
        </div>
      ) : (
        <p className={cn("type-figure text-foreground", size)}>
          {value}
          {unit ? (
            <span className="ml-0.5 align-baseline text-[0.45em] font-bold">
              {unit}
            </span>
          ) : null}
        </p>
      )}
      {label ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
