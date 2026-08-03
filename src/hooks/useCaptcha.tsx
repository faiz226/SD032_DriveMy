import { useCallback, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/**
 * Cloudflare Turnstile integration for the auth forms.
 *
 * The previous implementation rendered the widget and stored the resulting
 * token in component state, but never forwarded it to Supabase — the token was
 * used only to enable the submit button, then discarded. That made the captcha
 * decorative: it stopped nobody, while looking like bot protection in review.
 *
 * `captchaToken` here is meant to be spread straight into the Supabase call so
 * the token is actually verified server-side.
 *
 * Turnstile tokens are single-use. After any failed submission the widget MUST
 * be reset via `resetCaptcha()`, or the user's retry will be rejected with an
 * already-redeemed token and they will be stuck on a form that never succeeds.
 */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null);
  const instance = useRef<TurnstileInstance | undefined>(undefined);

  const resetCaptcha = useCallback(() => {
    setToken(null);
    instance.current?.reset();
  }, []);

  // Rendered only when a site key is configured, so local development and
  // preview builds without the key are unaffected.
  const captcha = SITE_KEY ? (
    <div className="flex justify-center my-2">
      <Turnstile
        ref={instance}
        siteKey={SITE_KEY}
        onSuccess={(t) => setToken(t)}
        onError={() => setToken(null)}
        onExpire={() => setToken(null)}
      />
    </div>
  ) : null;

  return {
    /** The widget, or null when no site key is configured. */
    captcha,
    /** `undefined` when captcha is disabled — safe to pass to Supabase either way. */
    captchaToken: token ?? undefined,
    /** True when a captcha is required but not yet solved — use to gate submit. */
    isCaptchaPending: Boolean(SITE_KEY) && !token,
    resetCaptcha,
  };
}
