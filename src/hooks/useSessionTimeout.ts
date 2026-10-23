import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useActivityStore } from '@/stores/activityStore';
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
 * When the timer fires, calls authStore.signOut(), which clears the auth store
 * and purges the Workbox runtime caches (see lib/cache.ts).
 *
 * NOTE: this is a client-side convenience only. It does not invalidate the
 * token server-side, so it is no defence against a stolen session — set
 * [auth.sessions] inactivity_timeout / timebox on the hosted Supabase project
 * for that.
 */
export function useSessionTimeout() {
  const { user, signOut } = useAuthStore();
  const userId = user?.id;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        // Never sign someone out mid-test. The mock exam runs 45 minutes
        // against a 30-minute idle timeout, so a careful candidate — or one who
        // pauses and steps away — was being logged out and losing the attempt.
        // Re-arm instead of firing; the check repeats until the test is done.
        if (useActivityStore.getState().isTestInProgress()) {
          resetTimeout();
          return;
        }
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
  }, [userId, signOut]);
}
