import React, { useCallback, useRef } from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "@/components/ui/icons"

import { cn } from "@/lib/utils"

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
  variant?: TransitionVariant
  /** When true, the transition expands from the viewport center instead of the button center. */
  fromCenter?: boolean
}

function polygonCollapsed(cx: number, cy: number, vertexCount: number): string {
  const pairs = Array.from(
    { length: vertexCount },
    () => `${cx}px ${cy}px`
  ).join(", ")
  return `polygon(${pairs})`
}

function getThemeTransitionClipPaths(
  variant: TransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number
): [string, string] {
  switch (variant) {
    case "circle":
      return [
        `circle(0px at ${cx}px ${cy}px)`,
        `circle(${maxRadius}px at ${cx}px ${cy}px)`,
      ]
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const halfSide = Math.max(halfW, halfH) * 1.05
      const end = [
        `${cx - halfSide}px ${cy - halfSide}px`,
        `${cx + halfSide}px ${cy - halfSide}px`,
        `${cx + halfSide}px ${cy + halfSide}px`,
        `${cx - halfSide}px ${cy + halfSide}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`]
    }
    case "triangle": {
      const scale = maxRadius * 2.2
      const dx = (Math.sqrt(3) / 2) * scale
      const verts = [
        `${cx}px ${cy - scale}px`,
        `${cx + dx}px ${cy + 0.5 * scale}px`,
        `${cx - dx}px ${cy + 0.5 * scale}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 3), `polygon(${verts})`]
    }
    case "diamond": {
      // Slightly larger than the view-transition circle radius so axis-aligned coverage matches the circle reveal.
      const R = maxRadius * Math.SQRT2
      const end = [
        `${cx}px ${cy - R}px`,
        `${cx + R}px ${cy}px`,
        `${cx}px ${cy + R}px`,
        `${cx - R}px ${cy}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`]
    }
    case "hexagon": {
      const R = maxRadius * Math.SQRT2
      const verts: string[] = []
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3
        verts.push(`${cx + R * Math.cos(a)}px ${cy + R * Math.sin(a)}px`)
      }
      return [polygonCollapsed(cx, cy, 6), `polygon(${verts.join(", ")})`]
    }
    case "rectangle": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const end = [
        `${cx - halfW}px ${cy - halfH}px`,
        `${cx + halfW}px ${cy - halfH}px`,
        `${cx + halfW}px ${cy + halfH}px`,
        `${cx - halfW}px ${cy + halfH}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`]
    }
    case "star": {
      // Small overscan so the last frames never leave a 1px seam before the transition group ends.
      const R = maxRadius * Math.SQRT2 * 1.03
      const innerRatio = 0.42
      const starPolygon = (radius: number) => {
        const verts: string[] = []
        for (let i = 0; i < 5; i++) {
          const outerA = -Math.PI / 2 + (i * 2 * Math.PI) / 5
          verts.push(
            `${cx + radius * Math.cos(outerA)}px ${cy + radius * Math.sin(outerA)}px`
          )
          const innerA = outerA + Math.PI / 5
          verts.push(
            `${cx + radius * innerRatio * Math.cos(innerA)}px ${cy + radius * innerRatio * Math.sin(innerA)}px`
          )
        }
        return `polygon(${verts.join(", ")})`
      }
      const startR = Math.max(2, R * 0.025)
      return [starPolygon(startR), starPolygon(R)]
    }
    default:
      return [
        `circle(0px at ${cx}px ${cy}px)`,
        `circle(${maxRadius}px at ${cx}px ${cy}px)`,
      ]
  }
}

import { useTheme } from "@/hooks/useTheme"

export function useThemeAnimation(options: {
  duration?: number;
  variant?: TransitionVariant;
  fromCenter?: boolean;
} = {}) {
  const { duration = 400, variant = "circle", fromCenter = false } = options;
  const { setTheme, isDark } = useTheme();

  const toggleTheme = useCallback((element?: HTMLElement | null) => {
    if (!element && !fromCenter) return;

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    let x: number;
    let y: number;
    if (fromCenter || !element) {
      x = viewportWidth / 2;
      y = viewportHeight / 2;
    } else {
      const { top, left, width, height } = element.getBoundingClientRect();
      x = left + width / 2;
      y = top + height / 2;
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const nextTheme = isDark ? "light" : "dark";
    const root = document.documentElement;

    // The page's colours and React's theme state change in the same step, so
    // the reveal shows the finished page and nothing changes again after it.
    const applyTheme = () => {
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      flushSync(() => setTheme(nextTheme));
    };

    // While this attribute is set, index.css switches every CSS transition
    // off: otherwise each element fades its own colours over its own timing
    // inside the reveal, which is what made the switch look uneven.
    root.dataset.magicuiThemeVt = "active";
    const cleanup = () => {
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition !== "function" || reduceMotion) {
      applyTheme();
      // Two frames: the new colours paint before transitions come back.
      requestAnimationFrame(() => requestAnimationFrame(cleanup));
      return;
    }

    const clipPath = getThemeTransitionClipPaths(
      variant,
      x,
      y,
      maxRadius,
      viewportWidth,
      viewportHeight
    );
    root.style.setProperty("--magicui-theme-toggle-vt-duration", `${duration}ms`);
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);

    const transition = document.startViewTransition(applyTheme);
    transition.finished.finally(cleanup);
    transition.ready.then(() => {
      root.animate(
        { clipPath },
        {
          duration,
          // The app's ease-out: quick to open, settling softly at the edges.
          easing: variant === "star" ? "linear" : "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }, [variant, fromCenter, duration, isDark, setTheme]);

  return toggleTheme;
}

export const AnimatedThemeToggler = React.forwardRef<HTMLButtonElement, AnimatedThemeTogglerProps & { children?: React.ReactNode }>(({
  className,
  duration = 400,
  variant,
  fromCenter = false,
  children,
  onClick,
  ...props
}, forwardedRef) => {
  const shape = variant ?? "circle"
  const { isDark } = useTheme()
  
  const internalRef = useRef<HTMLButtonElement>(null)
  
  // Merge the refs
  const buttonRef = useCallback((node: HTMLButtonElement | null) => {
    internalRef.current = node
    if (typeof forwardedRef === "function") {
      forwardedRef(node)
    } else if (forwardedRef) {
      forwardedRef.current = node
    }
  }, [forwardedRef])
  
  const runAnimation = useThemeAnimation({ duration, variant: shape, fromCenter });

  const toggleTheme = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    runAnimation(internalRef.current);
    if (onClick) onClick(e);
  }, [runAnimation, onClick]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {children ? children : (
        <>
          {isDark ? <Sun className="h-5 w-5 shrink-0" aria-hidden /> : <Moon className="h-5 w-5 shrink-0" aria-hidden />}
          <span className="sr-only">Toggle theme</span>
        </>
      )}
    </button>
  )
})
AnimatedThemeToggler.displayName = "AnimatedThemeToggler"
