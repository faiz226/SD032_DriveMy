import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogo } from "@/components/shared/GoogleLogo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { signInWithGoogle } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";
import { AuthFormAlert } from "@/components/shared/AuthFormAlert";

// ─── AuthPage ─────────────────────────────────────────────────────────────────
// Google is the only way in. The same button signs a learner in or, the first time, creates the account.
export function AuthPage() {
  const { t } = useLanguage();
  const { isAuthenticated, setDevBypass } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    ROUTES.DASHBOARD;

  // Redirect already-authenticated users away from the auth page
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  if (isAuthenticated) return null;

  const handleGoogle = async () => {
    setServerError(null);
    setIsGooglePending(true);
    try {
      await signInWithGoogle(from);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        setServerError(t("auth.error.network"));
      } else {
        setServerError(t("auth.error.oauthFailed"));
      }
    } finally {
      setIsGooglePending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-readable mx-auto w-full">
      <div className="text-center space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("app.name")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("app.tagline")}</p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11"
          onClick={handleGoogle}
          loading={isGooglePending}
          loadingLabel={t("common.loading")}
          aria-label={t("auth.signInWithGoogle")}
        >
          <GoogleLogo className="h-4 w-4" />
          {t("auth.signInWithGoogle")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">{t("auth.googleOnly")}</p>
        {serverError && <AuthFormAlert>{serverError}</AuthFormAlert>}
      </div>

      {/* Development builds only: into the app without an account */}
      {import.meta.env.DEV && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setDevBypass(true);
            navigate(from, { replace: true });
          }}
        >
          {t("auth.devBypass")}
        </Button>
      )}
    </div>
  );
}
