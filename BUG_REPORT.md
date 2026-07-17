# DriveMy — Bug & Edge-Case Audit Report

**Date:** 2026-07-17
**Scope:** Full read-through of `src/` (115 TS/TSX files) to find real bugs, broken edge cases, and user-facing failures.
**Method:** Parallel subsystem audits (auth/session, quiz/mock/exam, 3D simulation, progress/profile/safety, i18n/theme/PWA) plus direct verification of cross-cutting files (results service, analytics, ExamShell, Simulation3DView, carStore, JPJCircuit).
**Note:** Nothing has been fixed. This is a report only.

Severity legend: **Critical** (data loss / security / completely broken core feature) · **High** (significant wrong behavior, no graceful fallback) · **Medium** (degraded UX, wrong values, hidden failures) · **Low** (polish, dead code, latent footguns).

---

## CRITICAL

### C1. "Resend verification email" actually sends a password-reset email
**File:** `src/pages/auth/VerifyEmailPage.tsx:25`
The post-registration "Resend email" button calls `sendPasswordResetEmail(email)`, which invokes `supabase.auth.resetPasswordForEmail()` — a password-recovery flow, **not** a signup-confirmation resend. Supabase's correct call is `supabase.auth.resend({ type: 'signup', email })`.
**Scenario:** A new user registers, never receives the confirmation email, and taps "Resend email" on the verify page. They receive a "reset your password" email (or nothing), never a verification link. The success toast `auth.verifyEmailResent` ("Verification email resent") is also misleading. The user cannot complete email verification through this UI.

### C2. Delete Account does nothing (Settings) and deletes nothing (Profile)
**Files:** `src/pages/SettingsPage.tsx:85-89`; `src/components/profile/DataExportDelete.tsx:39-54`
Two different "Delete Account" buttons, both broken in different ways:
- **Settings:** `handleDeleteAccount` only shows a `toast.message(...)` and calls no deletion logic, opens no dialog, navigates nowhere. A user who believes they deleted their account has done **nothing**.
- **Profile:** Calls `supabase.rpc('delete_user')` (the `delete_user` RPC is referenced nowhere else in the repo — if it isn't installed, every click fails with a generic toast). Even if the RPC succeeds and removes the `auth.users` row, **no code deletes** the user's rows in `quiz_results`, `mock_test_results`, `simulation_results`, `colorblast_results`, `theory_progress`, or `profiles`. All PII-attributable test history is orphaned forever.
**Scenario:** User clicks "Delete Account" → either nothing happens (Settings) or the auth account is removed while all their test data remains in the database (Profile). This is a GDPR/PDPA compliance hole.

### C3. "Export My Data" only exports the `profiles` row
**File:** `src/components/profile/DataExportDelete.tsx:21-24`
`handleExportData` runs `supabase.from('profiles').select('*').eq('id', user.id).single()` and downloads that single row as JSON. It never queries `quiz_results`, `mock_test_results`, `simulation_results`, `colorblind_results`, or `theory_progress`.
**Scenario:** A user exercising their data-export right receives only their profile object — none of their quiz/mock/simulation/color-vision history — while the GDPR text on the same card promises comprehensive data export.

### C4. Readiness composite labels the quiz score as "Theory"
**Files:** `src/hooks/useProgressStats.ts:55-81`; `src/components/progress/ReadinessDonut.tsx:18`
`useOverallReadiness` calls `getQuizStats`, `getMockStats`, `getSimStats` — but **not** `getTheoryProgressStats`. It returns `theoryPct: quizScore` (the best *quiz* percentage) and `ReadinessDonut` renders `theoryPct * 0.3` as the "Theory" wedge. Theory module completion is never fetched here.
**Scenario:** A student who finishes all 3 theory modules but has never taken a quiz sees 0% in the "Theory" wedge and a depressed composite. A student who aces quizzes but ignores theory shows a full "Theory" wedge. The headline readiness metric is wrong either way.

### C5. `VerifyEmailPage` resend silently swallows all errors
**File:** `src/pages/auth/VerifyEmailPage.tsx:27-29`
The `catch {}` block is empty ("Silently fail — user can try again"). Combined with C1 (wrong API), the user gets no feedback that the resend failed.
**Scenario:** Resend fails (wrong endpoint, rate limit, network) → button returns to idle, no error shown, user has no idea nothing was sent.

### C6. Offline quiz / mock / color-vision results are lost (no queue)
**File:** `src/services/results.service.ts:10-28, 68-76`
Only `saveSimulationResult` checks `navigator.onLine` and queues to IndexedDB. `saveQuizResult`, `saveMockResult`, and `saveColorblindResult` call `supabase...insert(...)` directly and `throw error` on failure. In `QuizPage`/`MockTestPage`/`ColorVisionPage` the save is a `useMutation` with no `onError` (mock has none; quiz has none) — and even where there is an `onError`, there is no retry/queue.
**Scenario:** User completes a 50-question mock test while briefly offline (or on a flaky train connection). `saveMockResult` throws, the mutation errors, and the result is gone — no score saved, no retry offered, the progress charts never update.

### C7. `syncSimulationResults` clears the offline queue even when inserts fail
**File:** `src/services/results.service.ts:57-66`
```
for (const result of queue) {
  await supabase.from("simulation_results").insert(result as any);
}
await set("simulationQueue", []);   // cleared regardless of insert success
```
The insert return is never inspected. If any insert fails (RLS rejection, schema drift, network blip mid-sync), the function still clears the queue, **permanently deleting** those queued results.
**Scenario:** User completes several simulations offline. On reconnect, one insert fails an RLS policy → that result is dropped from the queue forever with no error surfaced.

### C8. `AuthInit.getSession()` has no `.catch()` — a boot-time network failure bricks the app
**File:** `src/App.tsx:61-67`
`supabase.auth.getSession().then(...)` sets `setLoading(false)` only on success. If the promise rejects (transient outage at boot, browser blocking the request), `isLoading` stays `true` forever and `ProtectedRoute` renders its spinner indefinitely. `onAuthStateChange` may not fire to rescue it.
**Scenario:** User opens the PWA on a flaky connection. `getSession()` fails. The app shows an infinite spinner — no error, no retry, no fallback — until force-closed.

---

## HIGH

### H1. Stale `selectedSet` when starting a mock test — wrong question set fetched
**File:** `src/pages/MockTestPage.tsx:47-57`
```
const handleStart = async ({ language, setId }) => {
  setExamLang(language);
  if (setId) setSelectedSet(setId);   // state update is async
  const { data } = await refetch();   // uses OLD selectedSet from this render
  ...
};
```
`refetch()` uses the query key `QUESTIONS_BY_SET(selectedSet)` from the current render's closure, not the just-set value. If the launch panel lets the user pick a set different from the default `"mock-1"`, the fetch uses the *previous* `selectedSet`. The questions shown won't match the `selectedSet` that's then used to label the result and save the row.
**Scenario:** User picks "Mock Set 3" in the launch panel and starts. `refetch()` queries set `mock-1` (the default). The test renders set-1 questions, but the saved result is tagged `set_id: "mock-3"`. Progress history is mislabeled.

### H2. No double-submit guard on quiz / mock completion
**Files:** `src/components/exam/ExamShell.tsx:180-193`; `src/pages/MockTestPage.tsx:67-85`; `src/pages/QuizPage.tsx:63-81`
`handleSubmit`/`handleComplete` have no in-flight guard. A rapid double-tap on "FINISH TEST" (or the auto-submit + a manual submit racing) fires `saveMutation.mutate` twice → duplicate rows in `quiz_results` / `mock_test_results`, inflating `count`, `average`, `best`, and `passRate` in analytics.
**Scenario:** User double-clicks the Finish button → two identical result rows are inserted → progress stats count the test twice.

### H3. `ExamShell` crashes on an empty questions array
**File:** `src/components/exam/ExamShell.tsx:77-80`
`const question = shuffledQuestions[currentIndex];` then `question.options_en`. If `questions` is empty (QuizPage guards this at the page level, but MockTestPage only guards `questions.length > 0` for rendering — a race between `refetch` resolving empty and the `setPhase("testing")` in `handleStart`'s `data.length > 0` check is fine, but any future caller that passes `[]` will crash on `question.options_en`).
**Scenario:** A future code path or a transient empty fetch that slips past the page guard renders a blank screen / hits `ErrorBoundary` with "Cannot read properties of undefined".

### H4. Simulation result `completion_seconds` is hardcoded to 15
**File:** `src/pages/Simulation3DView.tsx:828`
```
completion_seconds: 15,
```
Every simulation result, regardless of actual duration, is recorded as 15 seconds. This corrupts `getSimStats().totalDuration`, the Progress page "study time" cell, and any analytics that sum simulation durations.
**Scenario:** User spends 4 minutes on a hill-start simulation; the saved row says 15s. The progress "Total Study Time" undercounts simulation time for every user, always.

### H5. Mobile users cannot reverse, shift gears, or use the handbrake in the 3D sim
**File:** `src/components/simulation/MobileControls.tsx`
The mobile control overlay exposes Steering, Clutch, Brake, and Gas — but **no gear shifter** and **no reverse control**. `useKeys` (keyboard) handles `q`/`e` gear shifts and the car's reverse depends on `gear === -1`. On mobile, `gear` stays at its default `1` forever, so:
- The car can never go into reverse (the reverse impulse at `Simulation3DView.tsx:395` requires `gear === -1`).
- Several maneuvers (parallel parking, side parking, three-point turn) require reversing → they are **impossible to complete on mobile**.
- `setReversing` is never wired on mobile (the `isReversing` path is keyboard-only).
**Scenario:** A mobile user opens any parking or three-point-turn simulation. They can drive forward only. The maneuver cannot be completed; the only way to finish is the "Finish Maneuver" debug button.

### H6. Multi-touch on mobile pedals can leave a pedal "stuck on"
**File:** `src/components/simulation/MobileControls.tsx:65-95`
Each pedal uses `onTouchStart`/`onTouchEnd`/`onTouchCancel` on a `<button>`. With multi-touch (steering + gas simultaneously), if a second touch lands on the gas button while the first is still on steering, the browser may dispatch a `touchend` for the wrong identifier, or `e.touches[0]` in the steering handler points to the gas touch. There is no per-touch tracking. If a `touchend` is missed (e.g. finger slides off the button — no `touchcancel` always fires), `setAccelerating(true)` is never reset to `false` and the car accelerates forever.
**Scenario:** User holds gas, drags finger off the button onto the canvas. `onTouchEnd` may not fire on the button. The car keeps accelerating into the 30 km/h cap with no way to stop except the brake button.

### H7. `score` formula ignores `errors`/`stallCount`/`rollbackCm`
**File:** `src/pages/Simulation3DView.tsx:825`
```
score: Math.max(0, 100 - data.demeritPoints * 5),
```
The saved score only subtracts demerit points (×5). `errors` is double-counted (each error already added demerits in assessment mode via `addDemerit`), but `stallCount` and `rollbackCm` have **zero effect** on the saved score despite being recorded. A stall-heavy run with low demerits scores higher than a clean run that stalled once.
**Scenario:** Two users: one stalls 3 times but hits no cones (demerit 0 → score 100), another stalls 0 times but grazes one cone (demerit 5 → score 75). The stalling user "scores higher" despite worse driving.

### H8. Hill-start rollback detection fires only once and never resets on retry
**File:** `src/components/simulation/JPJCircuit.tsx:78-116`
`HillStartMonitor` uses `firedRef` and `stopPositionZ` refs that reset only when the car leaves the hill region. On `handleRetry` (`Simulation3DView.tsx:881`), the car respawns but `HillStartMonitor` is never told to reset — it relies on the car physically leaving/re-entering the hill box. If the respawn point is already inside the hill Z range (`hill-start` spawns at `[0,1.5,0]`, and the hill is at Z -40..-80 — so the spawn is *outside*; OK for hill-start). But for `ramp-test` (spawn `[0,1.5,0]`), and any future spawn inside the box, the monitor's `stopPositionZ` from the *previous* attempt persists and can produce a false rollback fail on a fresh attempt.
**Scenario:** Repeated hill-start attempts where the car re-enters the hill box can re-trigger the 30 cm check against a stale `stopPositionZ`.

### H9. `useSessionTimeout` `signOut()` can throw and leave the user half-signed-out
**Files:** `src/hooks/useSessionTimeout.ts:32-37`; `src/stores/authStore.ts:34-40`
The timeout callback does `await signOut()` then `toast.error(...)`. `signOut` awaits `signOutService()` which `throw error` if the Supabase call fails. If the network is down or the refresh token is already dead, the `await` rejects, the cache delete + store reset never run, and the toast never shows. The store keeps `isAuthenticated: true` while the real session is dead.
**Scenario:** User idle 30 min on a train with no signal. Timeout fires, `supabase.auth.signOut()` rejects → store never clears → user stuck on the dashboard with every API call 401ing and no "Session expired" message.

### H10. `ResetPasswordPage` 3-second heuristic falsely rejects valid links on slow networks
**File:** `src/pages/auth/ResetPasswordPage.tsx:40-59`
The page subscribes to `onAuthStateChange` for `PASSWORD_RECOVERY`, but if that event fired before the component mounted (it fires during `getSession()` in `AuthInit`), the subscription misses it. The fallback `setTimeout(() => getSession()..., 3000)` waits an arbitrary 3s; if PKCE exchange hasn't completed by then (slow 3G), `data.session` is null and the user sees `auth.resetLinkInvalid` ("This reset link is invalid or has expired") even though the link is valid. During those 3s the form is interactive — the user can submit a password change that fails with a confusing error.
**Scenario:** User taps the reset link on a slow connection. After 3s they're told the link is invalid. They request a new one. The original was fine.

### H11. `ResetPasswordPage` navigation `setTimeout` is never cleaned up
**File:** `src/pages/auth/ResetPasswordPage.tsx:67`
`setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 2000)` on success is not cleared in any cleanup. If the user navigates away within 2s, the pending `navigate` fires on an unmounted component and clobbers their destination.
**Scenario:** User resets password, taps "back" within 2s → forcibly redirected to the dashboard.

### H12. Recharts `fill` uses `rgb(var(--primary) / 0.7)` — invalid as an SVG attribute in some browsers
**File:** `src/components/progress/ReadinessDonut.tsx:25-31` (also `ManeuverScoresBar`, `CategoryBreakdownBar`, `QuizTrendLine`, `MockTrendLine`)
`<Cell fill="rgb(var(--primary) / 0.7)">` passes the modern space-separated-alpha `rgb()` with a CSS custom property straight to the SVG `fill` presentation attribute. SVG attributes do not resolve `var()` in all browsers, and the space-separated-alpha form is only parsed in CSS contexts. The legend swatches (which use `style={{ backgroundColor }}` — a CSS context) render correctly, so **chart and legend colors diverge**.
**Scenario:** On Safari/Firefox the donut wedges render black/transparent while the legend swatches show the brand color — a visible mismatch.

### H13. `html2canvas` PDF export can't resolve the same `var(--*)` colors → broken chart images
**File:** `src/lib/exportProgressReport.ts:56-67`
`exportProgressReportFromFrame` captures the progress DOM with html2canvas. The recharts SVGs inside use `fill="rgb(var(--primary))"` (H12). html2canvas's `applyPrintTheme` overrides `.bg-card`/`.text-muted-foreground`/etc. but does **not** override the inline SVG `fill`/`stroke` attributes, so the captured chart elements render with unresolved `var()` → black/missing data in the exported PDF.
**Scenario:** User clicks "Export PDF" → the downloaded PDF has black-on-black or invisible charts.

### H14. `ProgressPage.handleExport` silently fails if `sim` is undefined
**File:** `src/pages/ProgressPage.tsx:38-56`
The fallback to `generateProgressPDF` is gated `if (!quiz || !mock || !sim || !theory || !user) return;`. The primary `exportProgressReportFromFrame` path doesn't need those objects (it reads the DOM). If the primary throws (H13) **and** `getSimStats` errored (`sim` undefined), the fallback returns early — no PDF, no toast, no error.
**Scenario:** html2canvas throws AND the simulation query failed → clicking Export does nothing with no feedback.

### H15. PDF export prints "NaN%" if any result row has a null `percentage`
**Files:** `src/services/analytics.service.ts:129-130, 152-153`; `src/lib/generateProgressPDF.ts:86-103`
`Math.max(...rows.map(d => d.percentage))` and `rows.reduce((s,d) => s + d.percentage, 0)/count` assume `percentage` is a non-null number on every row. A single row with `percentage: null` (the Insert types allow it optional for some tables; a failed/partial save could leave it null) makes `best`/`average`/`passRate` `NaN`, and `NaN.toFixed(1)` prints `"NaN"` into the PDF and charts.
**Scenario:** One quiz result row with `percentage: null` → the PDF average and mock pass-rate columns print "NaN%".

### H16. Theory progress `percentage` can exceed 100%
**File:** `src/services/analytics.service.ts:192-201`
`totalModules` is hardcoded to `3`, and `completedModules = rows.filter(d => d.completed).length` counts every matching row. If a duplicate `theory_progress` row exists (missing unique constraint, or a race in the upsert), `completedModules` can be 4 → `percentage = 133%`. There's no clamp.
**Scenario:** A duplicate row for `theory-signs` makes the Theory completion and the donut wedge overflow past 100%.

### H17. Safety "ethics" phase does not affect the score; "community average" is fabricated
**File:** `src/pages/SafetyPage.tsx:121-149, 168-183, 213-215`
Scoring adds 20 pts per correct *defensive* answer (5 × 20 = 100). `submitEthics` sets `mockAvg = Number((Math.random() * (9-5) + 5).toFixed(1))` — a random client-side number labeled "community avg" — and the `ethicsValue` slider is never scored and never persisted. The results screen shows `/100` but the ethics slider has zero effect.
**Scenario:** User drags the ethics slider from 1 (selfish) to 10 (community) — score is identical. The "community average" they're shown is a freshly randomized number between 5.0 and 9.0 on every submit.

### H18. `ColorVisionPage` tritan classification overwrites red-green even when red-green is severe
**File:** `src/pages/ColorVisionPage.tsx:417-428`
In the 25-plate block, after red-green detection sets `classification = "deutan"` (when `classificationColorblindCount >= 2`), a subsequent `if (tritanMisses >= 2)` **unconditionally overwrites** it to `"tritan"`. A severely red-green-deficient user who also misses tritan plates gets classified as tritan-only.
**Scenario:** User misses 8 red-green plates and 2 tritan plates → classified "tritan", missing the primary red-green diagnosis.

### H19. Color vision "Nothing" answer on control plate 1 invalidates the whole test
**File:** `src/pages/ColorVisionPage.tsx:131-136, 380-383, 602`
There's no guard preventing the "nothing" button on the control plate (plate 1, `normalAnswer = "12"`). If the user taps "Nothing" then submits, `plate1Valid` is false → `isInvalid = true` → the entire test is classified invalid with no per-plate warning and no recourse except retaking.
**Scenario:** A normal-vision user accidentally taps "Nothing" on plate 1, finishes the rest perfectly, and is told the test is invalid.

### H20. OAuth login drops the deep link — Google users always land on the dashboard
**File:** `src/pages/auth/AuthCallbackPage.tsx:49, 63, 68`
On success the callback hardcodes `navigate(ROUTES.DASHBOARD, ...)`. There's no reading of `location.state.from` or any `?next=` param. Password login preserves `from` (`AuthPage.tsx`), but the Google OAuth redirect URL is a fixed `/auth/callback` with no return-to.
**Scenario:** Unauthenticated user clicks a bookmarked `/simulations/abc` link. `ProtectedRoute` saves `from`. They pick "Sign in with Google." After OAuth they land on `/` — the deep link is lost.

### H21. `AuthCallbackPage` shows raw provider/Supabase error strings to the user
**File:** `src/pages/auth/AuthCallbackPage.tsx:35, 44, 59, 78`
`errorDescription` (OAuth provider) and `exchangeError.message` / `sessionError.message` (Supabase) are rendered directly into `<AuthFormAlert>` with no sanitization or translation mapping. Users see `invalid_grant`, `User already registered`, or URL-encoded provider messages.
**Scenario:** Google denies consent or the PKCE code is reused → user sees a raw English technical string, inconsistent with the i18n keys used elsewhere.

---

## MEDIUM

### M1. No rate-limit / "too many attempts" handling anywhere in auth
**Files:** `AuthPage.tsx:82-87, 247-255`; `ForgotPasswordPage.tsx:41-43`; `ResetPasswordPage.tsx:68-70`
Every auth `catch` collapses errors into `auth.error.generic` or `auth.error.invalidCredentials`. Supabase's distinct rate-limit errors (`over_request_rate_limit`, `over_email_send_rate_limit`, HTTP 429 with `retry_after`) are never detected.
**Scenario:** Rate-limited user sees "generic error", keeps clicking resend, deepening the rate limit, and the "check your inbox" success screen never appears.

### M2. No Turnstile `onError` / `onExpire` — a failed/expired captcha permanently disables submit
**File:** `src/pages/auth/AuthPage.tsx:183-188, 350-356`
`<Turnstile>` only wires `onSuccess`. If the widget errors (iframe blocked on a corporate network) or the token expires, `captchaToken` stays `null`, the submit button stays `disabled`, and there's no retry path or message.
**Scenario:** User on a restrictive network where the Turnstile iframe fails to load → button greyed out forever, no explanation, no way to log in.

### M3. Dev-bypass fallback masks real auth failures (DEV only)
**File:** `src/pages/auth/AuthPage.tsx:72-81`
In dev, *any* `signIn` error (wrong password, rate limit, network) sets `isDevBypass(true)` and navigates to `from`. The developer is "logged in" with `user=null`, `session=null` — every RLS-protected query 401s, producing a broken dashboard instead of a clear "invalid credentials" error. (No-op in production, but a real DX hazard and can mask genuine bugs during testing.)

### M4. `useSessionTimeout` re-attaches 6 global listeners (incl. `mousemove`) on every `user` reference change
**File:** `src/hooks/useSessionTimeout.ts:27-54`
The effect depends on `[user, signOut]`. Supabase fires `onAuthStateChange` (`TOKEN_REFRESHED`) ~hourly, and `AuthInit` calls `setUser` each time — changing the `user` reference and re-running this effect. Each run tears down and re-attaches 6 document listeners including `mousemove` (the highest-frequency DOM event). On low-end mobile this is a real perf cost; in dev StrictMode the double-mount can briefly leave overlapping timers, risking a spurious "Session expired" sign-out during active use.

### M5. Authenticated user navigating to `/auth` sees the login form flash for one frame
**File:** `src/pages/auth/AuthPage.tsx:378-385`
The redirect-away effect runs after render. There's no early return when `isAuthenticated`, so the full login form paints for one frame before the redirect to `/`.
**Scenario:** Authenticated user types `/auth` in the URL bar → login form flashes briefly → yanked to dashboard. Looks like they were logged out.

### M6. Dark-theme flash + permanent dark on `localStorage` failure
**File:** `index.html:2, 44-60`
`<html lang="en-MY" class="dark">` is the static default. The inline theme script corrects it, but between first paint and the script there's a dark flash for light/system-light users. Worse, the `catch` block falls back to `classList.add("dark")` — a light-preference user whose `localStorage` throws (privacy mode) gets a permanent dark theme.

### M7. English flash for BM users on every page load
**Files:** `src/stores/languageStore.ts:14-19`; `src/hooks/useLanguage.ts:19`
The language store initializes `language: "en"` synchronously; `localStorage` is read only after hydration. First paint resolves `t()` with `"en"`, then re-renders with `"ms"`. (Theme has the inline `index.html` guard; language has none.) A returning BM user sees an English flash on every reload.

### M8. First-visit default language ignores OS locale
**File:** `src/lib/utils.ts:93-107`
`getPreferredLanguage()` reads `navigator.language` and would default `ms` for `ms-MY`/`id` — but it's never wired into `languageStore`, which always defaults to `"en"`. A Malaysian user with an `ms-MY` OS still gets English on first visit.

### M9. Stale theme-toggle icon when OS theme changes in "system" mode
**Files:** `src/hooks/useTheme.ts:7-32`; `src/components/shared/AppLayout.tsx:146`; `src/components/ui/animated-theme-toggler.tsx:138`
`useTheme` subscribes to `prefers-color-scheme` only when `theme === "system"` and updates the `<html>` class. But `AppLayout` and `animated-theme-toggler` compute their own `isDark` by reading `window.matchMedia(...).matches` at render time **without subscribing**. OS dark→light while in system mode: the page background changes (correct) but the sun/moon icon stays stale until some other render is forced.

### M10. `ErrorBoundary` fallback is hardcoded English and leaks raw error messages
**File:** `src/components/shared/ErrorBoundary.tsx:63-78`
Class boundary can't use `useLanguage`, so the fallback renders literal "Something went wrong" / "Try again" (translated keys already exist). It also exposes `this.state.error?.message` directly — implementation/stack details can leak to end users.

### M11. PWA update toast is hardcoded English and swallows reload failures
**File:** `src/main.tsx:22-34`
`onNeedRefresh` uses literal English strings; the "Reload" `onClick: () => updateSW?.(true)` isn't async and doesn't catch errors. If the SW update fails, the toast dismisses but nothing reloads — user stuck on a stale version with no feedback.

### M12. `formatDate()` is hardcoded to `"en-MY"`, ignoring selected language
**File:** `src/lib/utils.ts:15-23`
Always `toLocaleDateString("en-MY", ...)`. Even in BM, dates render with English month abbreviations. (Currently unused/dead code, but exported as a public utility — latent i18n bug the moment it's called.)

### M13. `OfflineBanner` can show a false "online" state (no liveness polling)
**File:** `src/components/shared/OfflineBanner.tsx:13-15`
Seeds `isOnline` from `navigator.onLine` (notoriously unreliable on desktop Chromium) and only updates on `online`/`offline` events. A network drop during sleep/wake that doesn't fire `offline` leaves a false "online" banner with no polling/fetch check.

### M14. MFA enrollment page is fully English (no i18n)
**File:** `src/pages/auth/MfaEnrollmentPage.tsx`
Every string is raw English, unlike every other auth page. A BM user enabling MFA sees a jarring language switch. The 6-digit code field also uses `type="text"` with no `inputMode="numeric"` — mobile users get a QWERTY keyboard for a TOTP code — and there's no 6-digit length validation before `mfa.verify`.

### M15. Quiz always shows both EN + BM questions regardless of selected exam language
**File:** `src/pages/QuizPage.tsx:129`
`<ExamShell ... language="en" />` is hardcoded; the `examLang` chosen on the launch panel is ignored for display (ExamShell renders `question_en` + `question_ms` anyway). `examLang` is still saved to the DB, so the recorded language may not match what the user saw.

### M16. Biased quiz shuffle (not Fisher-Yates)
**File:** `src/pages/QuizPage.tsx:48-54`
`pickQuestions` uses `[...pool].sort(() => Math.random() - 0.5)` — a known-biased non-uniform shuffle. Some questions are systematically more/less likely to be picked. (ExamShell's option shuffle correctly uses Fisher-Yates; only the question *selection* is biased.)

### M17. Mock / quiz save mutations have no `onError` toast
**Files:** `src/pages/MockTestPage.tsx:34-45`; `src/pages/QuizPage.tsx:34-45`
`saveMutation` defines `onSuccess` only. On failure the user gets no feedback — the result appears "saved" in the UI but was never persisted. (Compounds C6: an offline save silently fails.)

### M18. `getRecentActivity` breaks on a null `completed_at`
**Files:** `src/services/analytics.service.ts:99-111`; `src/pages/DashboardPage.tsx:327`
Events map `date: row.completed_at` directly. The Insert type marks `completed_at?` optional. A null value → `new Date(undefined)` → Invalid Date → `getTime()` returns `NaN` → the sort comparator returns `NaN` (unstable order) and `formatDistanceToNow` throws/renders "Invalid Date". The offline simulation queue path doesn't set `completed_at`, so a synced offline result can corrupt the whole recent-activity list.
**Scenario:** One synced offline simulation result with no `completed_at` → dashboard recent-activity list is misordered and shows "Invalid Date".

### M19. Progress "study time" shows `0h 0m` if any one of quiz/mock/sim is undefined
**File:** `src/pages/ProgressPage.tsx:181-186`
`quiz && mock && sim ? <calc> : "0h 0m"`. If one query errors (e.g. RLS on `simulation_results`), the AND short-circuits to `"0h 0m"` even though the other two have real durations — no error state shown.
**Scenario:** `getSimStats` throws → study time reads `0h 0m` forever, hiding hours of quiz/mock study, with no indication anything is wrong.

### M20. "Category Performance" chart is hardcoded dummy data
**File:** `src/pages/ProgressPage.tsx:60-64, 202`
`dummyCategoryData = [{road-signs:88},{traffic-rules:72},{safety-principles:95}]` is always rendered — no service call fetches the real per-category breakdown.
**Scenario:** User opens Progress → Theory tab and sees 88% / 72% / 95% category scores that never change and don't reflect their actual performance.

### M21. `ElasticSlider` divides by `width` with no zero-guard → NaN propagation
**File:** `src/components/safety/ElasticSlider.tsx:93-94`
`((e.clientX - left) / width) * (maxValue - startingValue)` with `width` from `getBoundingClientRect()`. If the slider is in a hidden tab/accordion (`display:none` → `width:0`), `newValue` is `Infinity`/`NaN`; `Math.min(Math.max(NaN,1),10)` is `NaN`. `setValue(NaN)` → `ethicsValue.toFixed(2)` throws in `SafetyPage`.
**Scenario:** User drags the ethics slider before layout (or while its tab is animating open) → render throws.

### M22. `downloadBlob` revokes the object URL too eagerly
**File:** `src/lib/utils.ts:113-134`
`URL.revokeObjectURL(url)` runs immediately after `link.click()`. On older Safari the download may not have started reading the blob → failed/empty download. The iOS branch (opens `url` in a new tab then revokes) is worse — the new tab may load a revoked blob URL.

### M23. `MockHistoryTable`/`QuizHistoryTable` sort treats null `completed_at` as epoch
**Files:** `src/components/progress/MockHistoryTable.tsx:40-56`; `src/components/progress/QuizHistoryTable.tsx:40-56`
`new Date(null).getTime()` is `0` (1970-01-01). A null `completed_at` row sorts to the top of "oldest first" and renders a 1970 date; `duration_seconds: null` renders `0m 0s`. Misleading rather than crashing.

### M24. `authStore.signOut()` deletes a `'supabase-api'` cache that is never created anywhere
**File:** `src/stores/authStore.ts:36-38`
`caches.delete('supabase-api')` — no `caches.open('supabase-api')` exists in the repo (and no SW registers that cache name). Dead code that always resolves `false`; misleads future maintainers into thinking sign-out clears a cache that doesn't exist.

### M25. Duplicate right-side mirror rendered in the car
**File:** `src/pages/Simulation3DView.tsx:590-607`
Two `<MirrorView>` blocks with nearly identical `camLocal`/`lookLocal` and `planeLocal={[1.0,1.0,-0.3]}` / `{[0.9,1.0,-0.5]}` are both labeled in comments as the "Right side mirror" — there is **no left-side mirror**. The car has rearview + two right mirrors and zero left mirrors.
**Scenario:** A right-hand-drive learner checking the left (offside) mirror sees nothing — the left mirror is missing from the model.

---

## LOW

### L1. `AuthCallbackPage` StrictMode double-exchange of the one-time PKCE code
**File:** `src/pages/auth/AuthCallbackPage.tsx:25, 42`
The `cancelled` flag guards `navigate`/`setError` but `exchangeCodeForSession(code)` already ran. In dev StrictMode the effect mounts twice; both invocations exchange the same one-time code — the second fails with "code already exchanged". Production is unaffected (no StrictMode double-invoke), but this is a dev-mode flakiness source.

### L2. `AnimatedThemeToggler` is a one-way street out of "system" mode
**File:** `src/components/ui/animated-theme-toggler.tsx:138-172`
In system mode, clicking the toggle sets `setTheme("dark")` or `setTheme("light")` directly — discarding "system". Once toggled, the user can't return to "system" via that control (only via Settings).

### L3. `truncate()` breaks for `maxLength <= 3`
**File:** `src/lib/utils.ts:28-50`
`return \`${str.slice(0, maxLength - 3)}...\`` produces output longer than `maxLength` when `maxLength < 3` (e.g. `truncate("hello", 2)` → `"hell..."`). Existing tests only cover `maxLength=5`.

### L4. `clamp(value, min, max)` doesn't validate `min <= max`
**File:** `src/lib/utils.ts:28-50`
Called with `min > max`, `Math.min(Math.max(value, min), max)` silently returns `max` (the smaller number) instead of erroring. Latent footgun.

### L5. `formatDuration()` doesn't handle negative seconds
**File:** `src/lib/utils.ts:69-73`
Negative input yields negative padded components (`"-01:-05"`). No guard; tests only cover non-negative.

### L6. `types/i18n.ts` shadows the strict `TranslationKey` union with `string`
**File:** `src/types/i18n.ts:7`
`export type TranslationKey = string;` undermines the precise `keyof typeof en` union used elsewhere. Any module importing from `@/types/i18n` loses compile-time key checking. Currently no caller does, so dormant — a footgun for future contributors.

### L7. Safety confetti `requestAnimationFrame` loop has no unmount cleanup
**File:** `src/pages/SafetyPage.tsx:107-119`
If the user navigates away during the 2.5s confetti burst, the rAF loop isn't cancelled → "setState on unmounted component" warning / leaked rAF.

### L8. `SimHistoryTable` renders `stall_count` with no null guard
**File:** `src/components/simulation/SimulationResults.tsx` / `SimHistoryTable.tsx:63-66, 121`
Offline-queued rows may omit `stall_count`; `{row.stall_count}` renders nothing. Minor display gap.

### L9. Two readiness formulas that can drift
**Files:** `src/pages/DashboardPage.tsx:93-98` vs `src/hooks/useProgressStats.ts:61-68`
Dashboard computes readiness inline (`simsPercent*0.4 + quizBest*0.3 + mockBest*0.3`); the hook computes it separately. Duplicate logic that can drift over time.

### L10. Physics debug `console.log` ships to production
**File:** `src/pages/Simulation3DView.tsx:441-446`
`[Physics Debug] Speed: ...` logs every ~0.5s in production builds — console spam for end users, mild perf cost.

### L11. `getPreferredLanguage()` / `isPWA()` are dead code
**File:** `src/lib/utils.ts:93-107`
Both exported, no callers. `getPreferredLanguage` would fix M8 if wired into the store.

---

## Cross-cutting themes (worth addressing together)

1. **Offline resilience is half-built.** Only simulation results are queued (C7 has a data-loss bug even there); quiz/mock/color-vision saves throw and lose data (C6). A unified offline queue + `onError` toasts would close C6, C7, M17, and parts of M18 at once.
2. **Analytics assume clean numeric rows.** `getQuizStats`/`getMockStats`/`getSimStats`/`getTheoryProgressStats` all do unguarded `Math.max`/`reduce`/division over `percentage`, `completed_at`, `duration_seconds`, and `completed`. A single null/NaN row corrupts `best`, `average`, `passRate`, the PDF (H15), the dashboard (M18), and study time (M19). Coerce-or-skip per row.
3. **Recharts `rgb(var(--*))` colors break in two places at once** (H12 chart, H13 PDF export). Switching to resolved hex/rgb at render time fixes the donut, the bars, the trend lines, and the html2canvas capture in one move.
4. **The readiness / study-time / category-breakdown surfaces show wrong or fabricated data** (C4, H16, M19, M20, H17 safety-ethics). These are the headline numbers users and supervisors will trust — they should be computed from real data or explicitly marked "coming soon."
5. **Auth has no error taxonomy.** Rate limits (M1), captcha failure (M2), OAuth provider errors (H21), and network failures (C8, H9) all collapse into generic messages or silent dead-ends. Mapping Supabase error codes to specific i18n keys would fix a whole class of "I can't log in and I don't know why" reports.
