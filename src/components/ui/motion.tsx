/**
 * Motion primitives for DriveMy.
 *
 * Two rules from DESIGN_SYSTEM.md shape everything here:
 *
 * 1. Persuade vs Operate. The landing page may reveal and choreograph; every
 *    authenticated surface may not. `Reveal` is therefore a Persuade component
 *    and deliberately has no Operate equivalent — if you want it on a
 *    dashboard, the answer is no.
 * 2. transform and opacity only. Nothing here touches layout.
 *
 * Reduced motion is handled twice over: MotionConfig reducedMotion="user" in
 * App.tsx disables `motion` transforms globally, and these components also read
 * the preference directly so they can skip the work rather than animate to the
 * same place.
 *
 * Durations and curves come from the web-animation skill's tables: entrances
 * decelerate (ease-out), 300ms at ~50px of travel, and stagger stays under
 * 500ms in total so a group reads as one gesture rather than a queue.
 */
import { motion, useInView, useReducedMotion as useMotionReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Entrance curve — decelerates into place. Never ease-in on an entrance. */
const ENTER = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds. Keep the whole group under 0.5s of total stagger. */
  delay?: number;
  /** Travel distance in px. 16–24 reads as arrival; more reads as a slide. */
  y?: number;
}

/**
 * Reveals its children once, when scrolled into view. PERSUADE SURFACES ONLY.
 *
 * `once` matters: re-animating on every scroll past is the single fastest way
 * to make a page feel cheap, and it punishes anyone who scrolls back to reread.
 */
export function Reveal({ children, className, delay = 0, y = 20 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduce = useMotionReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.45, delay, ease: ENTER }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Counts to `value` when it *changes*, not when it mounts.
 *
 * This is the Operate-safe form of number motion. A figure that animates on
 * every page load is an intro; a figure that animates when marks actually move
 * is feedback, and feedback is the only thing motion is allowed to be inside
 * the app. `animateOnMount` opts the landing page into the louder behaviour.
 */
export function CountUp({
  value,
  className,
  duration = 700,
  animateOnMount = false,
}: {
  value: number;
  className?: string;
  duration?: number;
  animateOnMount?: boolean;
}) {
  const reduce = useMotionReducedMotion();
  const [shown, setShown] = useState(animateOnMount ? 0 : value);
  const prev = useRef(animateOnMount ? 0 : value);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      prev.current = value;
      return;
    }
    const from = prev.current;
    const to = value;
    if (from === to) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic — arrives decisively, no overshoot on a number
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  // One decimal only when the target genuinely has one, so "12.6" keeps its
  // precision while "40" never renders as "40.0".
  const decimals = Number.isInteger(value) ? 0 : 1;
  return <span className={className}>{shown.toFixed(decimals)}</span>;
}

/**
 * A pressable wrapper: scale down on press, nothing on hover.
 *
 * Press feedback is the highest-frequency motion in any product, so it gets the
 * shortest duration in the table — under 150ms, or the control feels laggy. It
 * is scale rather than colour because colour is spoken for by the palette.
 */
export function Pressable({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      className={cn("cursor-pointer", className)}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: ENTER }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
