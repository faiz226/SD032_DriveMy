import { useMediaQuery } from "./useMediaQuery";

/**
 * True when the OS asks for reduced motion.
 *
 * The CSS floor in index.css already stops declarative animation, but it cannot
 * reach motion drawn outside the DOM — canvas particle systems, rAF loops,
 * anything imperative. Those have to ask, and they have to ask through this
 * hook rather than re-typing the query string, because the audit harness in
 * .screenshots/motion.mjs inspects computed styles on elements and is blind to
 * a <canvas>. Three confetti call sites ran under reduced-motion for exactly
 * that reason while the audit reported zero offenders.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
