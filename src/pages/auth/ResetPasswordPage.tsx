import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeSlash, CheckCircle, Warning } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { AuthFormAlert } from "@/components/shared/AuthFormAlert";
import { useLanguage } from "@/hooks/useLanguage";
import { updatePassword } from "@/services/auth.service";
import { supabase } from "@/lib/supabase";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const schema = z.object({
  password:        z.string().min(8, "validation.passwordMin"),
  confirmPassword: z.string().min(1, "validation.required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "validation.passwordMatch",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setTokenError(null);
      }
    });

    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          setTokenError(t("auth.resetLinkInvalid"));
        }
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [t]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await updatePassword(values.password);
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 2000);
    } catch {
      setServerError(t("auth.error.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="space-y-5 max-w-readable mx-auto w-full text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <CheckCircle className="h-6 w-6" weight="fill" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold">{t("auth.passwordUpdated")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.passwordUpdatedDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="space-y-5 max-w-readable mx-auto w-full text-center" role="alert">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <Warning className="h-6 w-6" weight="fill" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold">{t("auth.resetPassword")}</h1>
          <p className="text-sm text-muted-foreground">{tokenError}</p>
        </div>
        <Button
          variant="outline"
          className="w-full h-11"
          onClick={() => navigate(ROUTES.AUTH, { replace: true })}
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-readable mx-auto w-full">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("auth.resetPassword")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth.resetPasswordDesc")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          label={t("auth.newPassword")}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          leftIcon={<Lock className="h-4 w-4" weight="regular" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("a11y.hidePassword") : t("a11y.showPassword")}
              className={cn(
                "pointer-events-auto touch-target rounded-md text-muted-foreground hover:text-foreground",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              {showPassword ? <EyeSlash className="h-4 w-4" weight="regular" /> : <Eye className="h-4 w-4" weight="regular" />}
            </button>
          }
          hint={t("validation.passwordMin")}
          error={errors.password ? t(errors.password.message as never) : undefined}
          {...register("password")}
        />

        <FormField
          label={t("auth.confirmPassword")}
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          required
          leftIcon={<Lock className="h-4 w-4" weight="regular" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? t("a11y.hidePassword") : t("a11y.showPassword")}
              className={cn(
                "pointer-events-auto touch-target rounded-md text-muted-foreground hover:text-foreground",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              {showConfirm ? <EyeSlash className="h-4 w-4" weight="regular" /> : <Eye className="h-4 w-4" weight="regular" />}
            </button>
          }
          error={errors.confirmPassword ? t(errors.confirmPassword.message as never) : undefined}
          {...register("confirmPassword")}
        />

        {serverError && <AuthFormAlert>{serverError}</AuthFormAlert>}

        <Button
          type="submit"
          className="w-full h-11"
          loading={loading}
          loadingLabel={t("common.loading")}
        >
          {t("auth.resetPassword")}
        </Button>
      </form>
    </div>
  );
}
