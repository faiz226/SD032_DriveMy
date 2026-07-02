import { Link, useLocation } from "react-router-dom";
import { Envelope, ArrowLeft, CheckCircle } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { sendPasswordResetEmail } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";

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

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      await sendPasswordResetEmail(email);
      setResent(true);
    } catch {
      // Silently fail — user can try again
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-readable mx-auto w-full text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Envelope className="h-6 w-6" weight="regular" aria-hidden />
      </div>

      <div className="space-y-2" role="status" aria-live="polite">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
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
              className="inline-flex items-center justify-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm text-success border border-success/20 font-medium"
              role="status"
            >
              <CheckCircle className="h-4 w-4" weight="fill" aria-hidden />
              {t("auth.verifyEmailResent")}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleResend}
              loading={resending}
              loadingLabel={t("common.loading")}
            >
              {t("auth.resendEmail")}
            </Button>
          )}
        </div>
      )}

      <Button asChild variant="ghost" className="w-full h-11 text-muted-foreground hover:text-foreground">
        <Link to={ROUTES.AUTH}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("common.back")}
        </Link>
      </Button>
    </div>
  );
}
