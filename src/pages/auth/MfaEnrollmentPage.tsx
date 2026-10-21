import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMfaAssuranceLevel, enrollTotp, verifyTotp, unenrollTotp } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { toast } from "sonner";
import { ShieldCheck, QrCode } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";

export function MfaEnrollmentPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Declared before the effect that calls it — referencing it earlier is a
  // use-before-declare that the React Hooks lint rules reject.
  const checkMfaStatus = useCallback(async () => {
    try {
      const data = await getMfaAssuranceLevel();
      if (data.currentLevel === "aal2") {
        setIsEnrolled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void checkMfaStatus();
  }, [checkMfaStatus]);

  const startEnrollment = async () => {
    setIsPending(true);
    setError(null);
    try {
      const data = await enrollTotp();
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    } catch (err: any) {
      setError(err.message || "Failed to start enrollment");
    } finally {
      setIsPending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    
    setIsPending(true);
    setError(null);
    try {
      await verifyTotp(factorId, verifyCode);
      toast.success("MFA successfully enabled!");
      setIsEnrolled(true);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleUnenroll = async () => {
    if (!window.confirm("Are you sure you want to disable MFA?")) return;
    setIsPending(true);
    try {
      if (await unenrollTotp()) {
        toast.success("MFA disabled.");
        setIsEnrolled(false);
        setQrCode(null);
        setFactorId(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to disable MFA");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 mt-10 p-6 bg-card border rounded-lg shadow-sm">
      <div className="text-center space-y-2">
        <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-semibold font-heading">{t("settings.mfa")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("settings.mfaDesc")}
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 text-sm text-destructive bg-card border border-destructive rounded-md">
          {error}
        </div>
      )}

      {isEnrolled ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md border border-green-500/20 text-center">
            {t("settings.mfaEnabled")}
          </div>
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleUnenroll}
            loading={isPending}
          >
            {t("settings.mfaDisable")}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(ROUTES.DASHBOARD)}>
            {t("settings.mfaReturn")}
          </Button>
        </div>
      ) : !qrCode ? (
        <Button className="w-full" onClick={startEnrollment} loading={isPending}>
          <QrCode className="mr-2" /> {t("settings.mfaSetup")}
        </Button>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="p-4 bg-white rounded-md flex justify-center">
            <img src={qrCode} alt={t("settings.mfaQrAlt")} className="w-48 h-48" />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            {t("settings.mfaScanDesc")}
          </p>
          
          <FormField
            label={t("settings.mfaCode")}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
          />
          
          <Button type="submit" className="w-full" loading={isPending}>
            {t("settings.mfaVerify")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setQrCode(null)}>
            {t("common.cancel")}
          </Button>
        </form>
      )}
    </div>
  );
}
