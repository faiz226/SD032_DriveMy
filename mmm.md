Here's the consolidated bug list with **Severity** (user/business impact) and **Difficulty** (how hard to fix correctly — reasoning depth, cross-file tracing, concurrency/React-lifecycle subtlety) added, so you can route the hard ones to a stronger model.

Difficulty scale: **Easy** = localized, mechanical fix. **Medium** = needs care, state/lifecycle reasoning. **Hard** = deep tracing, concurrency, auth/security correctness, or cross-subsystem refactor.

---

## CRITICAL

| # | Bug | File | Sev | Diff |
|---|-----|------|-----|------|
| 1 | "Resend email" on VerifyEmailPage calls `resetPasswordForEmail` instead of `supabase.auth.resend({type:'signup'})` — verification email is never actually resent | `src/pages/auth/VerifyEmailPage.tsx:25` | Critical | **Easy** |
| 2 | OAuth callback hardcodes redirect to dashboard, drops the deep link / `from` | `src/pages/auth/AuthCallbackPage.tsx:49,63,68` | Critical | **Medium** |
| 3 | `useSessionTimeout` re-arms + re-attaches 6 listeners on every token refresh / user-ref change; StrictMode double-mount can double-fire timers → spurious sign-out + listener leak | `src/hooks/useSessionTimeout.ts:27-54` | Critical | **Hard** |
| 4 | Session-timeout `signOut()` can throw unhandled inside `setTimeout` (network down / expired refresh token) → store never cleared, no toast, no redirect, stuck half-signed-in | `src/hooks/useSessionTimeout.ts:32-37`, `authStore.ts:34-40` | Critical | **Hard** |

---

## HIGH

| # | Bug | File | Sev | Diff |
|---|-----|------|-----|------|
| 5 | `ResetPasswordPage` 3-second heuristic + missed `PASSWORD_RECOVERY` event → valid links rejected on slow networks | `src/pages/auth/ResetPasswordPage.tsx:40-59` | High | **Hard** |
| 6 | `ResetPasswordPage` success `setTimeout(navigate, 2000)` not cleared in cleanup → navigate-after-unmount | `src/pages/auth/ResetPasswordPage.tsx:67` | High | **Easy** |
| 7 | `AuthPage` dev-bypass fallback fires on *any* login error in DEV → fake logged-in state, all RLS queries 401 | `src/pages/auth/AuthPage.tsx:72-81` | High | **Medium** |
| 8 | No Turnstile `onError`/`onExpire` → failed/expired captcha permanently disables submit, no retry | `src/pages/auth/AuthPage.tsx:183-188, 350-356` | High | **Easy** |
| 9 | No rate-limit / 429 handling anywhere in auth (login, reset, signup) — all collapsed to generic error | `AuthPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` | High | **Medium** |
| 10 | `AuthCallbackPage` renders raw provider/Supabase error strings (`invalid_grant`, etc.) with no i18n/sanitization | `src/pages/auth/AuthCallbackPage.tsx:35,44,59,78` | High | **Easy** |
| 11 | `MockTestPage.handleStart` calls `setSelectedSet(setId)` then `await refetch()` — refetch uses stale `selectedSet`, fetches wrong set | `src/pages/MockTestPage.tsx:47-57` | High | **Medium** |
| 12 | Mock/quiz/colorblind `saveMutation` has no `onError` → silent save failure, user thinks it saved | `src/pages/MockTestPage.tsx:34-45` (and QuizPage, ColorVisionPage) | High | **Easy** |
| 13 | Only `saveSimulationResult` queues offline; quiz/mock/colorblind results throw + are lost when offline | `src/services/results.service.ts:10-49` | High | **Medium** |
| 14 | `syncSimulationResults` swallows insert errors then clears the queue → permanently deletes unsaved results | `src/services/results.service.ts:57-66` | High | **Medium** |
| 15 | `handleComplete`/`saveResult.mutate` not guarded against double-click → duplicate DB rows | `src/pages/MockTestPage.tsx:67-85`, `ExamShell.handleSubmit` | High | **Easy** |
| 16 | `ExamShell` no empty-state guard: if `questions=[]`, `question` is `undefined` → `question.options_en` throws → blank/error screen | `src/components/exam/ExamShell.tsx:77-79` | High | **Easy** |
| 17 | Mobile simulation has **no gear/reverse controls** (`setReversing` never bound, no gear shifter) → can't reverse, can't pass parking/3-point-turn/rollback maneuvers on touch devices | `src/components/simulation/MobileControls.tsx` | High | **Medium** |
| 18 | `simulateSuccess`/`handleFinish` hardcodes `completion_seconds: 15` and `passed: dp < 20` — scoring disconnected from actual maneuver completion | `src/pages/Simulation3DView.tsx:828,921` | High | **Medium** |

---

## MEDIUM

| # | Bug | File | Sev | Diff |
|---|-----|------|-----|------|
| 19 | `AuthPage` redirect-when-authenticated runs in effect after render → login form flashes one frame before yank | `src/pages/auth/AuthPage.tsx:378-385` | Medium | **Easy** |
| 20 | `MfaEnrollmentPage` verify-code input is `type="text"`, no `inputMode="numeric"`/`pattern`, no 6-digit validation | `src/pages/auth/MfaEnrollmentPage.tsx:147-155` | Medium | **Easy** |
| 21 | `MfaEnrollmentPage` is hardcoded English — breaks BM localization contract | `src/pages/auth/MfaEnrollmentPage.tsx` (whole file) | Medium | **Medium** |
| 22 | `AuthCallbackPage` StrictMode double-invokes `exchangeCodeForSession` with same one-time PKCE code → flaky dev auth | `src/pages/auth/AuthCallbackPage.tsx:41-42` | Medium | **Hard** |
| 23 | `Car` `useFrame` writes `hudState.speed` via `setHudState` every frame even when unchanged-ish → React re-render thrash on the simulation page | `src/pages/Simulation3DView.tsx:533-535, 1064` | Medium | **Medium** |
| 24 | `useSessionTimeout` `mousemove` listener resets timer every pixel — perf/jank on low-end mobile | `src/hooks/useSessionTimeout.ts:8-15` | Medium | **Easy** (debounce/throttle) |
| 25 | `MirrorView`/`Car` allocate new `THREE.Vector3`/`Quaternion`/`Euler` objects per frame (debug/shake path) — GC pressure | `src/pages/Simulation3DView.tsx:472-491` | Medium | **Medium** |
| 26 | JPJCircuit shared geometries/materials created at module scope, never disposed on unmount — leak across navigations | `src/components/simulation/JPJCircuit.tsx:10-18` | Medium | **Medium** |
| 27 | `HillStartMonitor` hill Z-range `-40..-80` doesn't match SPAWN/geometry for all maneuvers; rollback only detected for hill-start | `src/components/simulation/JPJCircuit.tsx:89` | Medium | **Hard** |

---

## LOW

| # | Bug | File | Sev | Diff |
|---|-----|------|-----|------|
| 28 | `authStore.signOut()` deletes a `'supabase-api'` Cache that is never created anywhere — dead code | `src/stores/authStore.ts:36-38` | Low | **Easy** |
| 29 | `AuthInit` has no `.catch()` on `getSession()` — network failure at boot leaves `isLoading:true` forever (infinite spinner) | `src/App.tsx:61-67` | Low* | **Easy** |
| 30 | `MobileControls` multi-touch: touching gas then steering can lose the gas `touchend` (no pointer-capture / `touch.identifier` tracking) → pedal stuck "on" | `src/components/simulation/MobileControls.tsx:88-95` | Low* | **Medium** |

\*#29 is Low severity but **Hard-ish in DX terms** — flagged Low only because it needs a network failure at boot to trigger. #30 marked Low because it's mobile-only and touch-sequence-dependent.

---

## Routing recommendation

**Send to the expert/strongest model** (concurrency + auth security + React lifecycle):
- **#3, #4, #5, #22** (session timeout + PKCE recovery race — hardest, security-sensitive)
- **#13, #14** (offline-result queue rewrite, needs consistent design across 4 services)

**Mid-tier model** (state/ordering, careful but localized):
- #2, #7, #11, #17, #18, #23, #25, #26, #27

**Fast model** (mechanical, well-scoped):
- #1, #6, #8, #10, #12, #15, #16, #19, #20, #24, #28, #29

Note: items #21 (i18n sweep) and #9 (rate-limit UX) are medium-effort but touch multiple files — fine for a mid-tier model with clear scope.

A reminder: I'm a side-instance with no tools, and I drafted this from the in-conversation findings already gathered. The full bug report MD file is being written by the main agent from the complete set of agent results (the simulation, quiz, progress, and i18n audits were still landing when you asked this). Treat the severity/difficulty assignments above as authoritative for the bugs already surfaced; if the other audits surface additional issues, they should be slotted in using the same scale before you assign work.