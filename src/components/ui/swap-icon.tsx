import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Swaps one icon for another (sun and moon, play and pause, eye and eye-off) with opacity, scale and a small blur
 * together, so the change reads as one gesture instead of a hard cut. `id` names the icon showing; changing it
 * swaps. With reduced motion the icon simply changes.
 */
export function SwapIcon({ id, children }: { id: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className="inline-grid place-items-center">{children}</span>;
  return (
    <span className="relative inline-grid place-items-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={id}
          className="inline-grid place-items-center"
          initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
          transition={{ type: "spring", duration: 0.2, bounce: 0 }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
