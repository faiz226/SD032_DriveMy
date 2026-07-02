# DriveMy Remediation Checklist

This checklist tracks the resolution of all identified issues from the Technical Audit (`TechStack.md`), organized by priority and timeframe.

## 30-Day Plan (P0 — Stop the Bleeding)

- [x] **Rotate the Supabase service-role key** and remove it from `.env.local`. Ensure it only lives in CI secrets / Edge Function env. (§8.1)
- [x] **Delete `scripts/create-admin.js`** and remove any `admin@drivemy.com` / `password123` account in production. (§4.5)
- [x] **Fix production auth config:** Update `site_url` and `additional_redirect_urls` to real Vercel domain; set `enable_confirmations = true`; set `minimum_password_length = 10` with complexity requirements. (§4.1, 4.2, 4.4)
- [x] **Turn off production sourcemaps:** Set `sourcemap: 'hidden'` in `vite.config.ts`. (§1.2)
- [x] **Fix SW Supabase cache:** Remove status `0`, cap TTL to 300s, clear cache on signOut in `vite.config.ts`. (§1.3/10.1)
- [x] **Add CSP + HSTS** to `vercel.json` / `public/_headers`. (§8.3)
- [x] **Lock down storage upload** to an admin role, or remove SVG from allowed MIME types immediately. (§8.2)
- [x] **Fix light-mode contrast:** Darken `--muted-foreground` token to ~`#4b4b4b`. (§1.1)

## 60-Day Plan (P1 — Close the Gaps)

- [x] **Add CI (GitHub Actions):** Configure `npm ci`, lint, type-check, build, `npm audit --audit-level=high`, and RLS policy tests. (§7.1, 7.3, 7.4)
- [x] **Add tests:** Implement pgTAP RLS policy tests and Vitest unit tests for `lib/` (`utils.test.ts`, `constants.test.ts` — 20 tests passing). (§7.2)
- [x] **Integrate Sentry:** Add error tracking and capture it in `ErrorBoundary`. (§1.7, 1.8, 12.1)
- [x] **Resolve dual auth state:** Implement a single source of truth via `onAuthStateChange` → `authStore`. (§4.7)
- [x] **Add per-route ErrorBoundaries:** Include chunk-load retry fallback logic. (§1.7, 1.10)
- [x] **Fix quiz-timer persistence:** Store `startedAt` and recompute remaining time via `onRehydrateStorage` in `quizStore.ts`. (§1.5)
- [x] **Fix mobile-menu focus trap:** Implement Radix Dialog for better accessibility. (§1.6)
- [x] **Fix dependencies:** Run `npm audit fix` for `dompurify` and `react-router`; verify PDF render and routing. (§8.5, 8.6)
- [x] **Handle offline-sync:** Either wire up or delete offline-sync, and fix the `mock_results` table name if kept. (§1.9, 1.16)
- [x] **Add `profiles` table:** Include `is_admin` column with RLS as the foundation for RBAC. (§8.4)
- [x] **Version DB schema:** Convert `setup_schema.sql` to ordered migrations and add `supabase db push` in CI. (§3.1, 7.5)
- [x] **Implement Server-side score recomputation:** Add an Edge Function or DB trigger for validation. (§2.2)

## 90-Day Plan (P2/P3 — Hardening & Polish)

- [x] **Refine Code-splitting:** Implement dynamic Phaser import (via `PhaserGame` prop), `motion` chunk, drop `lucide-react`, re-enable `modulePreload`. (§1.11–1.15)
- [x] **Improve Service Worker Updates:** Set `skipWaiting: false` for safer SW updates. (§1.14)
- [x] **Enhance Auth:** Add MFA for admin accounts. Add session inactivity timeout via `useSessionTimeout` hook (30 min, passive listeners, clears SW cache). **MFA enrollment UI implemented via `MfaEnrollmentPage.tsx`.** (§4.3)
- [x] **Add Rate Limiting:** Edge Function (`supabase/functions/rate-limit/`) with Upstash Redis deployed. **Frontend invocation and captcha on auth forms implemented using `@marsidev/react-turnstile`.** (§9.1, 9.2)
- [x] **Data Compliance:** Add GDPR data-export and delete flow. (§14.2)
- [x] **Legal:** Add Privacy Policy and cookie consent (if analytics are added). (§14.1)
- [x] **Content Licensing:** Document Ishihara plate design basis and JPJ road sign attribution in `THIRD_PARTY_LICENSES.md`. (§8.8, 14.3)
- [x] **Monitoring:** Add Lighthouse CI (`lighthouse.yml` + `.lighthouserc.json`) and synthetic uptime monitoring. (§15.1, 15.4)
- [x] **Disaster Recovery:** Document Supabase plan / backup RPO and create a restore runbook (`docs/DISASTER_RECOVERY.md`). (§13.2)
- [x] **Clean Repo:** Add `supabase/.temp/` to `.gitignore` (was never tracked, gitignore entry added). (§8.7)

## Pre-Commit & Operational Tasks (from Security Report)

- [x] **Fix `skip_nonce_check`:** Ensure `skip_nonce_check = false` in `supabase/config.toml` (or ensure the remote prod environment has nonce checking enabled) before production go-live.
- [x] **Ignore `dev-dist`:** Ensure `dev-dist/` is added to `.gitignore` so Vite PWA dev artifacts are not committed.
- [x] **Google OAuth Setup:** Implemented `AuthCallbackPage` to correctly process the redirect hash and wired Google OAuth in `supabase/config.toml`.

### Post-Commit / External Action Items
- [ ] **GitHub Secrets:** Add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID` for CI.
- [ ] **Vercel Env Vars:** Add `VITE_SENTRY_DSN`.
- [ ] **Supabase Edge Function Secrets:** Set `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` via CLI/Dashboard.
- [ ] **Supabase Dashboard:** Enable MFA, verify PITR backups (Pro plan), and configure Google OAuth Client ID/Secret.
- [ ] **Content Licensing:** Manually source licensed/public-domain Ishihara plates for `src/assets/color-vision/`.
- [ ] **Uptime Monitoring:** Set up BetterStack/UptimeRobot synthetic monitor pointing to the live Vercel URL.