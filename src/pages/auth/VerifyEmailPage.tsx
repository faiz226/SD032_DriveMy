import { Link, useLocation } from "react-router-dom";
import { Envelope, ArrowLeft, CheckCircle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useCaptcha } from "@/hooks/useCaptcha";
import { resendEmailConfirmation } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Post-registration holding page.
 * Shown after sign-up when Supabase requires email confirmation.
 * Receives the registered email via location.state.email.
 */
export function VerifyEmailPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const { captcha, captchaToken, isCaptchaPending, resetCaptcha } = useCaptcha();

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      await resendEmailConfirmation(email, captchaToken);
      setResent(true);
    } catch (err: unknown) {
      // Turnstile tokens are single-use — without this the retry fails too.
      resetCaptcha();
      toast.error(
        err instanceof Error && err.message ? err.message : t("auth.error.generic")
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-readable mx-auto w-full text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Envelope className="h-6 w-6" weight="regular" aria-hidden />
      </div>

      <div className="space-y-2" role="status" aria-live="polite">
        <h1 className="page-title">
          {t("auth.verifyEmail")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {email
            ? t("auth.verifyEmailDesc", { email })
            : t("auth.verifyEmailDescGeneric")}
        </p>
      </div>

      {email && (
        <div className="space-y-3">
          {resent ? (
            <div
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-success/15 px-3.5 py-2 text-sm text-success border border-success/25 font-medium"
              role="status"
            >
              <CheckCircle className="h-4 w-4" weight="fill" aria-hidden />
              {t("auth.verifyEmailResent")}
            </div>
          ) : (
            <>
              {/* Supabase captcha protection covers the resend endpoint too. */}
              {captcha}
              <Button
                type="button"
                variant="brand"
                size="lg"
                className="w-full"
                onClick={handleResend}
                loading={resending}
                disabled={isCaptchaPending}
                loadingLabel={t("common.loading")}
              >
                {t("auth.resendEmail")}
              </Button>
            </>
          )}
        </div>
      )}

      <Button asChild variant="ghost" className="w-full min-h-11 text-muted-foreground hover:text-foreground">
        <Link to={ROUTES.AUTH}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("common.back")}
        </Link>
      </Button>
    </div>
  );
}
