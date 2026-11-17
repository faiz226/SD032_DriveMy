import { useRef, useState, useCallback, useEffect } from "react";

interface UseExamTimerOptions {
  totalSeconds: number;
  onWarning?: () => void;
  onExpire?: () => void;
  warningAt?: number; // seconds remaining to trigger warning
}

interface UseExamTimerReturn {
  secondsRemaining: number;
  isRunning: boolean;
  isExpired: boolean;
  elapsed: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formattedTime: string;
}

/** Whole seconds until `endAt` (a wall-clock time in ms), rounded up so the clock reads 0 only when time is up. */
const secondsUntil = (endAt: number) => Math.max(0, Math.ceil((endAt - Date.now()) / 1000));

/**
 * Counts down against the wall clock, not against interval ticks. A sleeping phone or a throttled background
 * tab runs fewer ticks than seconds pass; counting ticks let a 75-minute mock run longer than 75 minutes.
 * Each tick (and the moment the page becomes visible again) re-reads the clock, so the time that passed is
 * always the time that is taken off.
 */
export function useExamTimer({
  totalSeconds,
  onWarning,
  onExpire,
  warningAt = 300,
}: UseExamTimerOptions): UseExamTimerReturn {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Wall-clock time (ms) the exam ends at while it runs; the seconds left while it is stopped.
  const endAtRef = useRef(0);
  const remainingRef = useRef(totalSeconds);
  const warningFiredRef = useRef(false);
  const onWarningRef = useRef(onWarning);
  const onExpireRef = useRef(onExpire);

  // Keep callback refs fresh
  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const remaining = secondsUntil(endAtRef.current);
    remainingRef.current = remaining;
    setSecondsRemaining(remaining);
    if (remaining <= warningAt && !warningFiredRef.current) {
      warningFiredRef.current = true;
      onWarningRef.current?.();
    }
    if (remaining <= 0) {
      clearTimer();
      setIsRunning(false);
      setIsExpired(true);
      onExpireRef.current?.();
    }
  }, [clearTimer, warningAt]);

  const start = useCallback(() => {
    if (isExpired || intervalRef.current) return;
    endAtRef.current = Date.now() + remainingRef.current * 1000;
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [isExpired, tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      remainingRef.current = secondsUntil(endAtRef.current);
      setSecondsRemaining(remainingRef.current);
    }
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    remainingRef.current = totalSeconds;
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
    setIsExpired(false);
    warningFiredRef.current = false;
  }, [clearTimer, totalSeconds]);

  // Catch up the moment the page is back, rather than on the next tick.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && intervalRef.current) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [tick]);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  const minutes = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return {
    secondsRemaining,
    isRunning,
    isExpired,
    elapsed: totalSeconds - secondsRemaining,
    start,
    pause,
    reset,
    formattedTime,
  };
}
