import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Envelope, Lock, Eye, EyeSlash } from "phosphor-react";
import { GoogleLogo } from "@/components/shared/GoogleLogo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { signIn, signUp, signInWithGoogle } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AuthFormAlert } from "@/components/shared/AuthFormAlert";

// ─── Dev bypass ───────────────

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().min(1, "validation.required").email("validation.email"),
  password: z.string().min(1, "validation.required"),
});

const registerSchema = z
  .object({
    email:           z.string().min(1, "validation.required").email("validation.email"),
    password:        z.string().min(8, "validation.passwordMin"),
    confirmPassword: z.string().min(1, "validation.required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "validation.passwordMatch",
    path: ["confirmPassword"],
  });

type LoginValues    = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

// ─── Login form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { setDevBypass } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      setIsPending(true);
      const data = await signIn(values.email, values.password);
      if (data.session) {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      // Dev bypass: on any failure in DEV, fall back to a mock user
      if (import.meta.env.DEV) {
        try {
          setDevBypass(true);
          navigate(from, { replace: true });
          return;
        } catch {
          // fall through to show real error
        }
      }
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Invalid login") || msg.includes("invalid_credentials")) {
        setServerError(t("auth.error.invalidCredentials"));
      } else {
        setServerError(t("auth.error.generic"));
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogle = async () => {
    setServerError(null);
    setIsGooglePending(true);
    try {
      await signInWithGoogle();
    } catch {
      setServerError(t("auth.error.generic"));
    } finally {
      setIsGooglePending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        loading={isGooglePending}
        loadingLabel={t("common.loading")}
        aria-label={t("auth.signInWithGoogle")}
      >
        <GoogleLogo className="h-4 w-4" />
        {t("auth.signInWithGoogle")}
      </Button>

      {/* Divider */}
      <div className="relative flex items-center gap-3" aria-hidden>
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">{t("auth.orContinueWith")}</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Email */}
      <FormField
        label={t("auth.email")}
        type="email"
        autoComplete="email"
        required
        leftIcon={<Envelope className="h-4 w-4" weight="regular" />}
        error={errors.email ? t(errors.email.message as never) : undefined}
        {...register("email")}
      />

      {/* Password */}
      <FormField
        label={t("auth.password")}
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        leftIcon={<Lock className="h-4 w-4" weight="regular" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("a11y.hidePassword") : t("a11y.showPassword")}
            className={cn(
              "pointer-events-auto touch-target rounded-md",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          >
            {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        error={errors.password ? t(errors.password.message as never) : undefined}
        {...register("password")}
      />

      {/* Forgot password — links to standalone page */}
      <div className="flex justify-end -mt-1">
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className={cn(
            "text-sm text-primary hover:underline underline-offset-4",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          )}
        >
          {t("auth.forgotPassword")}
        </Link>
      </div>

      {/* Server error */}
      {serverError && <AuthFormAlert>{serverError}</AuthFormAlert>}

      <Button
        type="submit"
        className="w-full h-11"
        loading={isPending}
        loadingLabel={t("common.loading")}
      >
        {t("auth.signIn")}
      </Button>
    </form>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────
function RegisterForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const handleGoogle = async () => {
    setServerError(null);
    setIsGooglePending(true);
    try {
      await signInWithGoogle();
    } catch {
      setServerError(t("auth.error.generic"));
    } finally {
      setIsGooglePending(false);
    }
  };

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    setIsPending(true);
    try {
      const data = await signUp(values.email, values.password);
      if (data.session) {
        // Email confirmation disabled — user is immediately signed in
        navigate(ROUTES.DASHBOARD, { replace: true });
      } else {
        // Email confirmation required — redirect to dedicated holding page
        navigate(ROUTES.VERIFY_EMAIL, {
          replace: true,
          state:   { email: values.email },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setServerError(t("auth.error.emailInUse"));
      } else if (msg.includes("Password should be")) {
        setServerError(t("auth.error.weakPassword"));
      } else {
        setServerError(t("auth.error.generic"));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        loading={isGooglePending}
        loadingLabel={t("common.loading")}
        aria-label={t("auth.signInWithGoogle")}
      >
        <GoogleLogo className="h-4 w-4" />
        {t("auth.signInWithGoogle")}
      </Button>

      {/* Divider */}
      <div className="relative flex items-center gap-3" aria-hidden>
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">{t("auth.orContinueWith")}</span>
        <div className="flex-1 border-t border-border" />
      </div>
      {/* Email */}
      <FormField
        label={t("auth.email")}
        type="email"
        autoComplete="email"
        required
        leftIcon={<Envelope className="h-4 w-4" weight="regular" />}
        error={errors.email ? t(errors.email.message as never) : undefined}
        {...register("email")}
      />

      {/* Password */}
      <FormField
        label={t("auth.password")}
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
              "pointer-events-auto touch-target rounded-md",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          >
            {showPassword ? <EyeSlash className="h-4 w-4" weight="regular" /> : <Eye className="h-4 w-4" weight="regular" />}
          </button>
        }
        hint={t("validation.passwordMin")}
        error={errors.password ? t(errors.password.message as never) : undefined}
        {...register("password")}
      />

      {/* Confirm password */}
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
              "pointer-events-auto touch-target rounded-md",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          >
            {showConfirm ? <EyeSlash className="h-4 w-4" weight="regular" /> : <Eye className="h-4 w-4" weight="regular" />}
          </button>
        }
        error={errors.confirmPassword ? t(errors.confirmPassword.message as never) : undefined}
        {...register("confirmPassword")}
      />

      {/* Server error */}
      {serverError && <AuthFormAlert>{serverError}</AuthFormAlert>}

      <Button
        type="submit"
        className="w-full h-11"
        loading={isPending}
        loadingLabel={t("common.loading")}
      >
        {t("auth.signUp")}
      </Button>
    </form>
  );
}

// ─── AuthPage ─────────────────────────────────────────────────────────────────
export function AuthPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    ROUTES.DASHBOARD;

  // Redirect already-authenticated users away from the auth page
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  return (
    <div className="space-y-6 max-w-readable mx-auto w-full">
      <div className="text-center space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("app.name")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("app.tagline")}</p>
      </div>

      <Tabs defaultValue="login">
        <TabsList className="w-full mb-6 h-11 bg-muted p-1 rounded-md">
          <TabsTrigger value="login" className="flex-1 rounded-md" aria-label={t("auth.signIn")}>
            {t("auth.signIn")}
          </TabsTrigger>
          <TabsTrigger value="register" className="flex-1 rounded-md" aria-label={t("auth.signUp")}>
            {t("auth.signUp")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm />
        </TabsContent>

        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>

      {import.meta.env.DEV && (
        <p className="text-center text-xs text-muted-foreground">
          {t("auth.devBypassHint")}
        </p>
      )}
    </div>
  );
}
