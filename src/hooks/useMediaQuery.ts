import { useSyncExternalStore } from "react";

/** Whether a media query matches now, and again whenever it changes. `fallback` stands in where there is no matchMedia (tests). */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof matchMedia !== "function") return () => {};
      const list = matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => (typeof matchMedia === "function" ? matchMedia(query).matches : fallback),
    () => fallback,
  );
}
