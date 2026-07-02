import { useState, useEffect } from "react";

/**
 * React hook for CSS media queries.
 * SSR-safe — returns false on the server.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern API
    mql.addEventListener("change", handler);

    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
