import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

/** 30-minute inactivity window — sign the user out automatically. */
const TIMEOUT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'pointerdown',
] as const;

/**
 * Attaches passive event listeners to detect user activity.
 * Resets a 30-minute timer on every interaction.
 * When the timer fires, calls authStore.signOut() so the SW cache
 * is flushed and the auth store is fully reset.
 */
export function useSessionTimeout() {
  const { user, signOut } = useAuthStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        await signOut();
        toast.error('Session expired due to inactivity. Please sign in again.', {
          duration: 6000,
        });
      }, TIMEOUT_MS);
    };

    // Passive listeners — do not block scroll performance
    ACTIVITY_EVENTS.forEach((event) =>
      document.addEventListener(event, resetTimeout, { passive: true })
    );

    // Arm the timer immediately
    resetTimeout();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        document.removeEventListener(event, resetTimeout)
      );
    };
  }, [user, signOut]);
}
