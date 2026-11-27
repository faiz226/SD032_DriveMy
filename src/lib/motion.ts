/**
 * Shared spring physics and gesture helpers for DriveMy.
 *
 * One coherent spring family (snappy, smooth, gentle) aligned with the CSS
 * `--ease-spring` curve. Compositor-only properties (`transform`, `opacity`,
 * and small-icon `filter`) — never animate layout properties.
 */
import type { Transition } from "motion/react";

/** 150–200 ms envelope: presses, segmented thumbs, tab-bar liquid pill, SwapIcon. */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};

/** 240–320 ms envelope: dialogs, popovers, quiz answer reveals, flashcards. */
export const SPRING_SMOOTH: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 1,
};

/** 320–450 ms envelope: route shared-axis transitions, bottom sheets, first-view list stagger. */
export const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 1,
};

/** Instant cross-fade fallback when `prefers-reduced-motion: reduce` is active. */
export const REDUCED_TRANSITION: Transition = {
  duration: 0.14,
  ease: "linear",
};

/** Apple-style rubber-band resistance past a sheet detent. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (overshoot <= 0 || dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * overshoot);
}

/** Project resting position from release velocity (px/s) using iOS deceleration rate. */
export function projectMomentum(velocityPxPerSec: number, decelerationRate = 0.996): number {
  return (velocityPxPerSec / 1000) * (decelerationRate / (1 - decelerationRate));
}
