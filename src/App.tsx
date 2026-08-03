import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Layouts
import { AppLayout }      from "@/components/shared/AppLayout";
import { AuthLayout }     from "@/components/shared/AuthLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ErrorBoundary }  from "@/components/shared/ErrorBoundary";
import { ConsentBanner }  from "@/components/shared/ConsentBanner";

// Auth pages — kept as direct imports (small, needed immediately)
import { AuthPage }           from "@/pages/auth/AuthPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage }  from "@/pages/auth/ResetPasswordPage";
import { VerifyEmailPage }    from "@/pages/auth/VerifyEmailPage";
import { AuthCallbackPage }   from "@/pages/auth/AuthCallbackPage";
import { MfaEnrollmentPage }  from "@/pages/auth/MfaEnrollmentPage";

// Lazy-load all heavy app pages to split vendor chunks
const LazyDashboardPage   = lazy(() => import("@/pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const LazyTheoryPage      = lazy(() => import("@/pages/TheoryPage").then(m => ({ default: m.TheoryPage })));
const LazyQuizPage        = lazy(() => import("@/pages/QuizPage").then(m => ({ default: m.QuizPage })));
const LazyMockTestPage    = lazy(() => import("@/pages/MockTestPage").then(m => ({ default: m.MockTestPage })));
const LazyColorVisionPage = lazy(() => import("@/pages/ColorVisionPage").then(m => ({ default: m.ColorVisionPage })));
const LazySimulationsPage = lazy(() => import("@/pages/SimulationsPage").then(m => ({ default: m.SimulationsPage })));
const LazySimulation3DView = lazy(() => import("@/pages/Simulation3DView").then(m => ({ default: m.Simulation3DView })));
const LazyProgressPage    = lazy(() => import("@/pages/ProgressPage").then(m => ({ default: m.ProgressPage })));
const LazySafetyPage      = lazy(() => import("@/pages/SafetyPage").then(m => ({ default: m.SafetyPage })));
const LazySettingsPage    = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const LazyNotFoundPage    = lazy(() => import("@/pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const LazyPrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));


// Stores & services
import { useAuthStore }  from "@/stores/authStore";
import { supabase }      from "@/lib/supabase";
import { ROUTES }        from "@/lib/constants";
import { useTheme }      from "@/hooks/useTheme";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { syncOfflineResults } from "@/services/results.service";

// ─── TanStack Query client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Auth initialiser ─────────────────────────────────────────────────────────
// Hydrates useAuthStore from the live Supabase session on first render and
// keeps it in sync via onAuthStateChange. This is the single source of truth
// used by ProtectedRoute and every page that calls useAuthStore().
function AuthInit({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setLoading } = useAuthStore();

  useSessionTimeout();

  useEffect(() => {
    // Hydrate on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // Prevent infinite spinner on boot-time network failures
      setLoading(false);
    });

    // Stay in sync with sign-in / sign-out / token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading]);

  useEffect(() => {
    const handleOnline = () => syncOfflineResults();
    window.addEventListener("online", handleOnline);
    syncOfflineResults();
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return <>{children}</>;
}

// ─── Per-route error isolation ───────────────────────────────────────────────
//
// The root <ErrorBoundary> alone means any render error anywhere unmounts the
// entire app — including the navigation — so a crash in the 3D simulator
// (Simulation3DView: WebGL + physics, by far the most crash-prone surface)
// leaves the user on a blank screen with no way out but a manual reload.
//
// Wrapping each route keeps the shell and navigation alive, so the user can
// simply navigate away. The root boundary stays as a backstop for errors in
// the layout itself. Navigating away unmounts the boundary, which resets it.
const routed = (node: React.ReactNode) => <ErrorBoundary>{node}</ErrorBoundary>;

// ─── Shared page loading spinner ─────────────────────────────────────────────
const PageSpinner = (
  <div className="flex min-h-[60vh] items-center justify-center p-6">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
      aria-label="Loading"
      role="status"
    />
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  useTheme();
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthInit>
            <BrowserRouter>
              <Suspense fallback={PageSpinner}>
                <Routes>

                  {/* ── Auth routes — AuthLayout (no sidebar, no bottom nav) ── */}
                  <Route element={<AuthLayout />}>
                    <Route path={ROUTES.AUTH}             element={<AuthPage />} />
                    <Route path={ROUTES.FORGOT_PASSWORD}  element={<ForgotPasswordPage />} />
                    <Route path={ROUTES.RESET_PASSWORD}   element={<ResetPasswordPage />} />
                    <Route path={ROUTES.VERIFY_EMAIL}     element={<VerifyEmailPage />} />
                  </Route>

                  {/* ── Protected app routes — AppLayout (sidebar + bottom nav) */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index                               element={routed(<LazyDashboardPage />)} />
                    <Route path={ROUTES.THEORY}               element={routed(<LazyTheoryPage />)} />
                    <Route path={ROUTES.QUIZ}                 element={routed(<LazyQuizPage />)} />
                    <Route path={ROUTES.MOCK_TEST}            element={routed(<LazyMockTestPage />)} />
                    <Route path={ROUTES.COLOR_VISION}         element={routed(<LazyColorVisionPage />)} />
                    <Route path={ROUTES.SIMULATIONS}          element={routed(<LazySimulationsPage />)} />
                    <Route path={`${ROUTES.SIMULATIONS}/:id`} element={routed(<LazySimulation3DView />)} />
                    <Route path={ROUTES.PROGRESS}             element={routed(<LazyProgressPage />)} />
                    <Route path={ROUTES.SAFETY}               element={routed(<LazySafetyPage />)} />
                    <Route path={ROUTES.SETTINGS}             element={routed(<LazySettingsPage />)} />
                    <Route path={ROUTES.MFA}                  element={routed(<MfaEnrollmentPage />)} />
                  </Route>

                  {/* ── Public routes ─────────────────────────────────────── */}
                  {/* The privacy notice must be reachable BEFORE a user signs
                      up — a notice nobody can read is legally equivalent to
                      not having one (PDPA 2010 §7, Notice & Choice). */}
                  <Route path={ROUTES.PRIVACY} element={<LazyPrivacyPolicyPage />} />

                  {/* ── Fallbacks ─────────────────────────────────────────── */}
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="*"             element={<LazyNotFoundPage />} />

                </Routes>
              </Suspense>
              <ConsentBanner />
            </BrowserRouter>
          </AuthInit>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
