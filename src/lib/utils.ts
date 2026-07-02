import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  // Simple formatter — replace with date-fns format() in components
  return d.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
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
 * Check if the app is running in a PWA standalone context.
 */
export function isPWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

/**
 * Get the user's preferred language (en or ms).
 */
export function getPreferredLanguage(): "en" | "ms" {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("ms") || lang.startsWith("id")) return "ms";
  return "en";
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

  URL.revokeObjectURL(url);
}
