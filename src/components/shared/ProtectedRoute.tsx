import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useLanguage } from "@/hooks/useLanguage";
import { ROUTES } from "@/lib/constants";

interface ProtectedRouteProps {
  children:    React.ReactNode;
  redirectTo?: string;
}

/**
 * Guards a route behind authentication.
 * - Redirects unauthenticated users to /auth, preserving the intended
 *   destination in location.state.from for post-login redirect.
 * - Skips the check entirely in dev-bypass mode.
 * - Shows an accessible loading spinner while auth state is resolving.
 */
export function ProtectedRoute({
  children,
  redirectTo = ROUTES.AUTH,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isDevBypass } = useAuthStore();
  const { t } = useLanguage();
  const location = useLocation();

  // PROD-GATE: The following block is stripped in production by Vite's dead code elimination.
  // import.meta.env.DEV is replaced with `false` at build time, making this branch unreachable.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (import.meta.env.DEV && isDevBypass) return <>{children}</>;

  if (isLoading) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center bg-background"
        role="status"
        aria-label={t("a11y.loading")}
        aria-live="polite"
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
          aria-hidden
        />
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
