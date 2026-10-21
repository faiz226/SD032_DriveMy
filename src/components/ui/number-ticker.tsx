/**
 * NumberTicker — from the MagicUI registry (`@magicui/number-ticker`, already
 * configured in components.json), adapted to this project.
 *
 * Three things were changed rather than accepted:
 *
 *  1. `prefers-reduced-motion` was ignored — the spring ran regardless. Jalan's
 *     floor is zero elements animating under that setting, and a score counting
 *     itself up is exactly the kind of motion someone turns off. It now paints
 *     the final value on the first frame instead.
 *  2. `text-black dark:text-white` was hardcoded. Colour comes from the
 *     surface via `currentColor`, so this works on a plate, on asphalt, and
 *     inside a berhenti panel without three variants.
 *  3. `Intl.NumberFormat("en-US")` was pinned. This app is EN/BM, so the
 *     locale follows the learner.
 *
 * Kept as-is: the spring config and the run-once-in-view trigger. This is state
 * feedback — a mark landing — which is the one kind of motion Jalan allows.
 */
import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { useInView, useMotionValue, useSpring, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  /** BCP-47 tag. Defaults to English; pass "ms-MY" for a Malay learner. */
  locale?: string;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  locale = "en-MY",
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(direction === "down" ? value : startValue);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const format = (n: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(Number(n.toFixed(decimalPlaces)));

  // Reduced motion: show the real number immediately and never start a spring.
  // A learner who has asked for no animation still needs to read their mark.
  useEffect(() => {
    if (!reduceMotion || !ref.current) return;
    ref.current.textContent = format(value);
    // format is derived from locale/decimalPlaces, both in the dep list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, value, locale, decimalPlaces]);

  useEffect(() => {
    if (reduceMotion || !isInView) return;
    const timer = setTimeout(() => {
      motionValue.set(direction === "down" ? startValue : value);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, value, direction, startValue, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    return springValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = format(latest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springValue, decimalPlaces, locale, reduceMotion]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums", className)}
      {...props}
    >
      {reduceMotion ? format(value) : format(startValue)}
    </span>
  );
}
