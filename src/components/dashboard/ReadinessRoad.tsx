/**
 * Jarak ke Lulus — Distance to pass.
 *
 * The signature of the "Jalan" system: the learner's whole route from nothing
 * to a P licence, drawn as a stretch of road with the two real checkpoints
 * painted across it.
 *
 *   solid double line   marks already earned
 *   broken line         what is still open ahead
 *   transverse line     a checkpoint — the L at 60 marks, the P at 100
 *   L plate             Lesen Belajar Memandu, lit once the paper is passed
 *   P plate             Lesen Percubaan, lit once the circuit is passed
 *
 * A gauge cannot show a threshold, let alone two. A road can — and the two
 * thresholds are the entire shape of this qualification, so they get to be the
 * loudest marks on the surface.
 *
 * On honesty: a plate lights when its gate is actually met, which is not the
 * same as reaching its position on the road. A learner can hold their L at 53
 * marks and still have paper marks left on the table. The plate tells the
 * truth about the licence; the position tells the truth about the marks. Both
 * are stated rather than reconciled into one number that means neither.
 *
 * Horizontal on desktop, vertical on phones, where a route reads better running
 * away from you than squeezed across 340px.
 */
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MOCK_PASS_MARK, MOCK_TOTAL_QUESTIONS } from "@/lib/constants";
import {
  PAPER_MARKS,
  CIRCUIT_MARKS,
  TOTAL_MARKS,
  MANEUVERS,
  type LicenceStanding,
} from "@/lib/licence";
import { LPlate } from "@/components/ui/road";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Where the L checkpoint falls: the end of the paper stretch. */
const L_AT = (PAPER_MARKS / TOTAL_MARKS) * 100;

const PLATE = 34;
const PLATE_SM = 30;

/**
 * The painted line draws itself only when marks actually move — after a quiz,
 * a mock, or a maneuver — and is simply present on load. This is an Operate
 * surface; choreography the learner watches every time they open the dashboard
 * is decoration, not feedback.
 */
function useValueChanged(value: number, ms = 700): boolean {
  const previous = useRef<number | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const moved = previous.current !== null && previous.current !== value;
    previous.current = value;
    if (!moved) return;
    setChanged(true);
    const id = setTimeout(() => setChanged(false), ms);
    return () => clearTimeout(id);
  }, [value, ms]);

  return changed;
}

export interface ReadinessRoadProps {
  standing?: LicenceStanding;
  pending?: boolean;
  className?: string;
}

export function ReadinessRoad({
  standing,
  pending = false,
  className,
}: ReadinessRoadProps) {
  const { t } = useLanguage();
  const isPhone = useMediaQuery("(max-width: 767px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const position = standing?.position ?? 0;
  const justMoved = useValueChanged(Math.round(position));

  // What the learner is actually working toward right now, and what is left.
  const next = !standing
    ? null
    : standing.hasP
      ? { label: t("licence.p.name"), outstanding: null }
      : standing.hasL
        ? {
            label: t("licence.p.name"),
            outstanding: t("licence.outstanding.circuit", {
              count: String(standing.maneuversPassed),
              total: String(MANEUVERS.length),
            }),
          }
        : {
            label: t("licence.l.name"),
            outstanding: !standing.theoryComplete
              ? t("licence.outstanding.theory", {
                  count: String(standing.theoryRemaining),
                })
              : t("licence.outstanding.mock", {
                  mark: String(MOCK_PASS_MARK),
                  total: String(MOCK_TOTAL_QUESTIONS),
                }),
          };

  const track = {
    position,
    hasL: standing?.hasL ?? false,
    hasP: standing?.hasP ?? false,
    paint: justMoved && !reduceMotion && !pending,
    lLabel: t("licence.l.name"),
  };

  return (
    <section
      className={cn("carriageway on-road px-5 py-6 sm:px-8 sm:py-7", className)}
      aria-labelledby="readiness-road-heading"
    >
      <h2
        id="readiness-road-heading"
        className="type-display text-xl text-road-foreground sm:text-2xl"
      >
        {t("dashboard.road.title")}
      </h2>

      {pending || !standing ? (
        <Skeleton className="mt-2 h-5 w-72 bg-paint/10" />
      ) : (
        <p className="mt-1.5 max-w-readable text-sm text-road-muted">
          <span className="text-road-foreground">
            {t("dashboard.marks", {
              earned: String(standing.totalEarned),
              total: String(TOTAL_MARKS),
            })}
            .
          </span>{" "}
          {next?.outstanding ? (
            <>
              {next.outstanding} {t("licence.toEarn", { licence: next.label })}
            </>
          ) : (
            t("licence.bothEarned")
          )}
        </p>
      )}

      <div
        role="progressbar"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={TOTAL_MARKS}
        aria-valuetext={
          standing
            ? `${standing.totalEarned} of ${TOTAL_MARKS} marks. ${
                standing.hasL ? "L licence earned." : "L licence not yet earned."
              } ${standing.hasP ? "P licence earned." : "P licence not yet earned."}`
            : undefined
        }
        aria-labelledby="readiness-road-heading"
        className="mt-6"
      >
        {isPhone ? <VerticalRoad {...track} /> : <HorizontalRoad {...track} />}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-road-muted/85">
        {t("dashboard.road.split", {
          paper: String(PAPER_MARKS),
          circuit: String(CIRCUIT_MARKS),
        })}
      </p>
    </section>
  );
}

interface TrackProps {
  position: number;
  hasL: boolean;
  hasP: boolean;
  paint: boolean;
  lLabel: string;
}

const paintTransition = (on: boolean) =>
  on ? "transform 650ms cubic-bezier(0.22,1,0.36,1)" : undefined;

/* ── Desktop: the road runs across ─────────────────────────────────────────── */

function HorizontalRoad({ position, hasL, hasP, paint, lLabel }: TrackProps) {
  return (
    <div className="flex items-stretch gap-4">
      <div className="relative h-[104px] flex-1 bg-road-lane">
        {/* Inner track, inset by half a plate at each end so a plate never hangs
            off the lane. Every mark sits inside it, so they share one
            coordinate space and land exactly where the marks say. */}
        <div
          className="absolute inset-y-0"
          style={{ left: PLATE / 2, right: PLATE / 2 }}
        >
          {/* Marks earned — a solid double line. Scaled rather than resized:
              animating width thrashes layout every frame. */}
          <div
            className="absolute left-0 top-1/2 h-[7px] w-full origin-left -translate-y-1/2"
            style={{
              transform: `translateY(-50%) scaleX(${position / 100})`,
              background:
                "linear-gradient(rgb(var(--paint)),rgb(var(--paint))) top/100% 2px no-repeat, linear-gradient(rgb(var(--paint)),rgb(var(--paint))) bottom/100% 2px no-repeat",
              transition: paintTransition(paint),
            }}
          />
          {/* Still open ahead — a broken line, scaled from the far end */}
          <div
            className="absolute left-0 top-1/2 h-[2px] w-full origin-right -translate-y-1/2"
            style={{
              transform: `translateY(-50%) scaleX(${1 - position / 100})`,
              background:
                "repeating-linear-gradient(90deg, rgb(var(--on-road-muted)) 0 22px, transparent 22px 42px)",
              transition: paintTransition(paint),
            }}
          />

          {/* ── Checkpoint: the L, at the end of the paper stretch ──
              Label above, bar below it, plate standing on the bar. The caption
              gets its own band so the 7px stroke never runs through it. */}
          <p
            className="type-plate absolute top-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-road-muted"
            style={{ left: `${L_AT}%` }}
            aria-hidden
          >
            {lLabel}
          </p>
          <div
            className={cn(
              "absolute bottom-0 top-6 w-[7px] -translate-x-1/2",
              hasL ? "bg-paint" : "bg-paint/35"
            )}
            style={{ left: `${L_AT}%` }}
            aria-hidden
          />
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${L_AT}%` }}
          >
            <LPlate letter="L" size={28} earned={hasL} title={lLabel} />
          </div>

          {/* Where the marks have reached */}
          <p
            className="type-figure absolute top-1/2 -translate-y-1/2 translate-x-2 text-sm text-road-foreground"
            style={{ left: `${position}%` }}
            aria-hidden
          >
            {Math.round(position)}
          </p>
        </div>
      </div>

      {/* The destination, past the end of the road */}
      <div className="flex items-center">
        <LPlate letter="P" size={PLATE} earned={hasP} />
      </div>
    </div>
  );
}

/* ── Phone: the road runs away from you ────────────────────────────────────── */

function VerticalRoad({ position, hasL, hasP, paint, lLabel }: TrackProps) {
  const HEIGHT = 250;

  return (
    <div className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center gap-3">
        <div
          className="relative w-[76px] bg-road-lane"
          style={{ height: HEIGHT }}
        >
          <div
            className="absolute inset-x-0"
            style={{ top: PLATE_SM / 2, bottom: PLATE_SM / 2 }}
          >
            {/* Marks earned */}
            <div
              className="absolute left-1/2 top-0 h-full w-[7px] origin-top -translate-x-1/2"
              style={{
                transform: `translateX(-50%) scaleY(${position / 100})`,
                background:
                  "linear-gradient(90deg,rgb(var(--paint)),rgb(var(--paint))) left/2px 100% no-repeat, linear-gradient(90deg,rgb(var(--paint)),rgb(var(--paint))) right/2px 100% no-repeat",
                transition: paintTransition(paint),
              }}
            />
            {/* Still open */}
            <div
              className="absolute left-1/2 top-0 h-full w-[2px] origin-bottom -translate-x-1/2"
              style={{
                transform: `translateX(-50%) scaleY(${1 - position / 100})`,
                background:
                  "repeating-linear-gradient(180deg, rgb(var(--on-road-muted)) 0 20px, transparent 20px 38px)",
                transition: paintTransition(paint),
              }}
            />
            {/* The L checkpoint */}
            <div
              className={cn(
                "absolute -left-2 -right-2 h-[7px] -translate-y-1/2",
                hasL ? "bg-paint" : "bg-paint/35"
              )}
              style={{ top: `${L_AT}%` }}
              aria-hidden
            />
          </div>
        </div>
        <LPlate letter="P" size={PLATE_SM} earned={hasP} />
      </div>

      {/* Readings, beside the road rather than crowded onto it */}
      <div className="relative min-w-0 flex-1" style={{ height: HEIGHT }}>
        <div
          className="absolute -translate-y-1/2"
          style={{
            top: `calc(${PLATE_SM / 2}px + (100% - ${PLATE_SM}px) * ${position / 100})`,
          }}
          aria-hidden
        >
          <p className="type-figure text-lg text-road-foreground">
            {Math.round(position)}
            <span className="ml-1 text-xs text-road-muted">
              /{TOTAL_MARKS}
            </span>
          </p>
        </div>
        <div
          className="absolute flex -translate-y-1/2 items-center gap-2"
          style={{
            top: `calc(${PLATE_SM / 2}px + (100% - ${PLATE_SM}px) * ${L_AT / 100})`,
          }}
        >
          <LPlate letter="L" size={24} earned={hasL} title={lLabel} />
          <p className="type-plate text-[10px] text-road-muted">{lLabel}</p>
        </div>
      </div>
    </div>
  );
}
