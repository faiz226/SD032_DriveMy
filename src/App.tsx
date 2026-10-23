import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Shell
import { AppLayout }      from "@/app/layouts/AppLayout";
import { AuthLayout }     from "@/app/layouts/AuthLayout";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { AuthProvider }   from "@/app/providers/AuthProvider";
import { ErrorBoundary }  from "@/components/shared/ErrorBoundary";
import { ConsentBanner }  from "@/components/shared/ConsentBanner";

// Auth pages — kept as direct imports (small, needed immediately). The two password pages are lazy below:
// their forms bring zod and react-hook-form, about 80 KB the sign-in page never uses.
import { AuthPage }           from "@/pages/auth/AuthPage";
import { VerifyEmailPage }    from "@/pages/auth/VerifyEmailPage";
import { AuthCallbackPage }   from "@/pages/auth/AuthCallbackPage";
import { MfaEnrollmentPage }  from "@/pages/auth/MfaEnrollmentPage";

// Lazy-load all heavy app pages to split vendor chunks
const LazyDashboardPage   = lazy(() => import("@/pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const LazyRpkRsmPage = lazy(() => import("@/pages/RpkRsmPage").then(m => ({ default: m.RpkRsmPage })));
const LazyTheoryPage      = lazy(() => import("@/pages/TheoryPage").then(m => ({ default: m.TheoryPage })));
const LazyQuizPage        = lazy(() => import("@/pages/QuizPage").then(m => ({ default: m.QuizPage })));
const LazyMockTestPage    = lazy(() => import("@/pages/MockTestPage").then(m => ({ default: m.MockTestPage })));
const LazyColorVisionPage = lazy(() => import("@/pages/ColorVisionPage").then(m => ({ default: m.ColorVisionPage })));
const LazySimulationsPage = lazy(() => import("@/pages/SimulationsPage").then(m => ({ default: m.SimulationsPage })));
// The simulator: its car and textures start downloading the moment the route opens, alongside its code.
const LazySimulation3DView = lazy(() => { preloadSimAssets(currentTier()); return import("@/pages/Simulation3DView").then(m => ({ default: m.Simulation3DView })); });
const LazyProgressPage    = lazy(() => import("@/pages/ProgressPage").then(m => ({ default: m.ProgressPage })));
const LazySafetyPage      = lazy(() => import("@/pages/SafetyPage").then(m => ({ default: m.SafetyPage })));
const LazySettingsPage    = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const LazyNotFoundPage    = lazy(() => import("@/pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const LazyPrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));
const LazyForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const LazyResetPasswordPage  = lazy(() => import("@/pages/auth/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
// Development only: the simulator's world on its own (/dev/sim), and the simulator page without signing in
// (/dev/sim/:id, nothing saved; also in performance builds, VITE_SIM_PERF=1, for scripts/sim-perf.mjs).
// Absent from production builds.
const LazySimPreview = import.meta.env.DEV ? lazy(() => import("@/sim/dev/SimPreview").then(m => ({ default: m.SimPreview }))) : null;
const LazySimPageDev = import.meta.env.DEV || import.meta.env.VITE_SIM_PERF === "1" ? lazy(() => { preloadSimAssets(currentTier()); return import("@/sim/ui/SimulatorPage").then(m => ({ default: m.SimulatorPage })); }) : null;


// Stores & services
import { preloadSimAssets } from "@/sim/assets";
import { currentTier } from "@/sim/quality";
import { ROUTES }        from "@/lib/constants";
import { useTheme }      from "@/hooks/useTheme";
import { useLanguage }   from "@/hooks/useLanguage";

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
  const { language } = useLanguage();
  // Screen readers choose pronunciation from <html lang>, and chart dates
  // follow it, so it must change when the learner switches language.
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={PageSpinner}>
                <Routes>

                  {/* ── Auth routes — AuthLayout (no sidebar, no bottom nav) ── */}
                  <Route element={<AuthLayout />}>
                    <Route path={ROUTES.AUTH}             element={<AuthPage />} />
                    <Route path={ROUTES.FORGOT_PASSWORD}  element={<LazyForgotPasswordPage />} />
                    <Route path={ROUTES.RESET_PASSWORD}   element={<LazyResetPasswordPage />} />
                    <Route path={ROUTES.VERIFY_EMAIL}     element={<VerifyEmailPage />} />
                  </Route>

                  {/* ── Protected app routes — app shell (header + tab bar) ── */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index                               element={routed(<LazyDashboardPage />)} />
                    <Route path={ROUTES.RPK_RSM}              element={routed(<LazyRpkRsmPage />)} />
                    <Route path={ROUTES.THEORY}               element={routed(<LazyTheoryPage />)} />
                    <Route path={ROUTES.QUIZ}                 element={routed(<LazyQuizPage />)} />
                    <Route path={ROUTES.MOCK_TEST}            element={routed(<LazyMockTestPage />)} />
                    <Route path={ROUTES.COLOR_VISION}         element={routed(<LazyColorVisionPage />)} />
                    <Route path={ROUTES.PROGRESS}             element={routed(<LazyProgressPage />)} />
                    <Route path={ROUTES.SAFETY}               element={routed(<LazySafetyPage />)} />
                    <Route path={ROUTES.SETTINGS}             element={routed(<LazySettingsPage />)} />
                    <Route path={ROUTES.MFA}                  element={routed(<MfaEnrollmentPage />)} />
                    {/* The simulator draws full screen over the shell. */}
                    <Route path={ROUTES.SIMULATIONS}          element={routed(<LazySimulationsPage />)} />
                    <Route path={`${ROUTES.SIMULATIONS}/:id`} element={routed(<LazySimulation3DView />)} />
                  </Route>

                  {/* ── Public routes ─────────────────────────────────────── */}
                  {/* The privacy notice must be reachable BEFORE a user signs
                      up — a notice nobody can read is legally equivalent to
                      not having one (PDPA 2010 §7, Notice & Choice). */}
                  <Route path={ROUTES.PRIVACY} element={<LazyPrivacyPolicyPage />} />
                  {LazySimPreview && <Route path="/dev/sim" element={routed(<LazySimPreview />)} />}
                  {LazySimPageDev && <Route path="/dev/sim/:id" element={routed(<LazySimPageDev />)} />}

                  {/* ── Fallbacks ─────────────────────────────────────────── */}
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="*"             element={<LazyNotFoundPage />} />

                </Routes>
              </Suspense>
              <ConsentBanner />
            </BrowserRouter>
          </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
