import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ROUTES } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { AuthFormAlert } from "@/components/shared/AuthFormAlert";

/**
 * AuthCallbackPage — handles the OAuth redirect from Google (and email magic
 * links / password-reset links) after Supabase's PKCE flow.
 *
 * Supabase PKCE flow returns:
 *   https://drivemy-rho.vercel.app/auth/callback?code=<auth_code>
 *
 * We must call supabase.auth.exchangeCodeForSession(code) to swap the
 * one-time code for a real access + refresh token pair. Once that succeeds,
 * onAuthStateChange fires SIGNED_IN and we redirect to the dashboard.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const exchangedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");
      const nextUrl = params.get("next") || ROUTES.DASHBOARD;

      const sanitizeError = (msg: string | null) => {
        if (!msg) return t("auth.error.generic");
        const lower = msg.toLowerCase();
        if (lower.includes("invalid_grant") || lower.includes("invalid login")) return t("auth.error.invalidCredentials");
        if (lower.includes("already registered") || lower.includes("already exists")) return t("auth.error.emailInUse");
        return t("auth.error.generic");
      };

      // ── Handle OAuth error returned by provider ──────────────────────────
      if (errorParam) {
        setError(sanitizeError(errorDescription ?? errorParam));
        return;
      }

      // ── PKCE: exchange ?code= for a session ──────────────────────────────
      if (code) {
        if (exchangedRef.current === code) return;
        exchangedRef.current = code;
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError(sanitizeError(exchangeError.message));
          return;
        }
        // Session is now active; onAuthStateChange (in AuthInit) will update
        // the store. Navigate to dashboard immediately.
        navigate(nextUrl, { replace: true });
        return;
      }

      // ── Implicit / magic-link fallback: check if session already hydrated ─
      // Supabase JS auto-parses the hash fragment (#access_token=...) on init.
      // Give it a tick, then check.
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError) {
        setError(sanitizeError(sessionError.message));
        return;
      }
      if (data.session) {
        navigate(nextUrl, { replace: true });
        return;
      }

      // Nothing in URL and no active session — redirect to login
      navigate(ROUTES.AUTH, { replace: true });
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 space-y-4">
        <AuthFormAlert>{error}</AuthFormAlert>
        <button
          onClick={() => navigate(ROUTES.AUTH)}
          className="text-sm text-primary hover:underline"
        >
          {t("common.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-label="Authenticating..."
        role="status"
      />
    </div>
  );
}
