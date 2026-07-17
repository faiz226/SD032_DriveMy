import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguageStore } from "@/stores/languageStore";

/**
 * Merge Tailwind classes safely — combines clsx conditional logic
 * with tailwind-merge conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date using date-fns with Malaysian locale fallback.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const lang = useLanguageStore.getState().language === "ms" ? "ms-MY" : "en-MY";
  
  return d.toLocaleDateString(lang, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  return Math.min(Math.max(value, actualMin), actualMax);
}

/**
 * Shuffle an array (Fisher-Yates) — used for quiz randomisation.
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Truncate a string to maxLength with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  if (maxLength <= 3) return str.slice(0, maxLength);
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Convert seconds to MM:SS display string.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return `-${formatDuration(-seconds)}`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Calculate percentage, safe against division by zero.
 */
export function percentage(value: number, total: number, decimals = 1): number {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
}

/**
 * Generate a random ID (not cryptographically secure — for UI keys only).
 */
export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}



/**
 * Trigger a file download from a Blob, with cross-browser compatibility.
 * Handles modern browsers, iOS Safari (open in new tab), and legacy Edge.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  const nav = navigator as Navigator & { msSaveOrOpenBlob?: (b: Blob, n: string) => void };
  if (/Edg/.test(navigator.userAgent) && nav.msSaveOrOpenBlob) {
    // Legacy Edge / IE fallback (effectively dead on modern Windows)
    nav.msSaveOrOpenBlob(blob, filename);
  } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // iOS Safari cannot trigger downloads — open in new tab instead
    window.open(url, "_blank");
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Delay revocation so the browser has time to initiate the download
  // before the blob URL is garbage-collected (fixes race on iOS + Chromium)
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
