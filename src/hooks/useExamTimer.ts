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

  const start = useCallback(() => {
    if (isExpired) return;
    clearTimer();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;
        if (next <= warningAt && !warningFiredRef.current) {
          warningFiredRef.current = true;
          onWarningRef.current?.();
        }
        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          setIsExpired(true);
          onExpireRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [isExpired, clearTimer, warningAt]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
    setIsExpired(false);
    warningFiredRef.current = false;
  }, [clearTimer, totalSeconds]);

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
