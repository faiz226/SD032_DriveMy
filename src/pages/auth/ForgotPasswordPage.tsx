import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Envelope, ArrowLeft, CheckCircle } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { AuthFormAlert } from "@/components/shared/AuthFormAlert";
import { useLanguage } from "@/hooks/useLanguage";
import { sendPasswordResetEmail } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().min(1, "validation.required").email("validation.email"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(values.email);
      setSentEmail(values.email);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many")) {
        setServerError(t("auth.error.rateLimit"));
      } else if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        setServerError(t("auth.error.network"));
      } else {
        setServerError(t("auth.error.generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 max-w-readable mx-auto w-full text-center" role="status" aria-live="polite">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <CheckCircle className="h-6 w-6" weight="fill" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {t("auth.resetPassword")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.verifyEmailDesc", { email: sentEmail })}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full h-11">
          <Link to={ROUTES.AUTH}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("common.back")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-readable mx-auto w-full">
      <div className="text-center space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("auth.forgotPassword")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.forgotPasswordDesc")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          required
          leftIcon={<Envelope className="h-4 w-4" weight="regular" />}
          error={errors.email ? t(errors.email.message as never) : undefined}
          {...register("email")}
        />

        {serverError && <AuthFormAlert>{serverError}</AuthFormAlert>}

        <Button
          type="submit"
          className="w-full h-11"
          loading={loading}
          loadingLabel={t("common.loading")}
        >
          {t("auth.sendResetLink")}
        </Button>
      </form>

      <div className="text-center">
        <Link
          to={ROUTES.AUTH}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
            "transition-colors rounded-sm min-h-[48px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}
