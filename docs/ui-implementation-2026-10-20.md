# UI implementation status — 20 October 2026

The user approved implementation with simulator work excluded. This is an implementation checkpoint, not a claim of exact visual acceptance against DESIGN.md.

## Delivered

- Jalan palette, semantic aliases, Archivo/Barlow typography, 4 px control geometry, spacing and motion tokens, dark-backed yellow focus indicators, and reduced-motion treatment.
- Top navigation and mobile menu with existing destinations retained. Simulator routes keep their existing layout; a route-scoped compatibility stylesheet preserves the previous palette, typography, and corner sizes. Automatic approval review initially rejected staging this safeguard; the user then explicitly approved keeping it.
- Dashboard with a learning-progress road, persistent 0/60/100 anchors, unverified L/P plates, six learning bays, actual 50-question mock scores and headroom, dated activity, and an actionable next step. Loading and failure states do not manufacture progress.
- Shared readiness weights for the dashboard, progress chart, and both language explanations. Raw theory rows and aggregated theory statistics now use different query keys.
- Bilingual RPK/RSM revision topics, topic navigation, explicit completion saving, and separate progress counting using the existing owner-scoped theory-progress storage. Saving keeps the current topic selected. These lessons are introductory revision, not a complete practical certification course.
- Keyboard-operable theory reveal buttons with inactive faces excluded from focus, labeled search with a clear-search empty state, and explicit learned marking. A reveal no longer implies learning completion.
- Native keyboard-operable safety slider, honest illustrative-comparison wording, readable MFA errors, Archivo progress figures, static chart draws, and removal of safety/result confetti.
- Authenticated Fish Audio endpoint and question/options/revealed-explanation controls. Manual listen, cancel, stop, pause/resume, same-question replay cache, stale-request cancellation, and object URL cleanup. Server secrets remain outside the client bundle.
- Daily audio quota migration, local Vite endpoint, Vercel routing/CSP support, and deployment notes. No new dependencies were added.

## Decisions and UX reasoning

- L/P gates remain **not verified** at every learning score until authoritative eligibility data exists. Remaining points refer to the end of the learning road, not legal entitlement to a P licence.
- The road is horizontally scrollable on narrow screens so both checkpoint labels remain legible. This needs browser verification.
- Fitts's Law informed 48 px controls and the whole-bay link. Jakob's Law informed standard Radix menus and native range-input keyboard behavior. Proximity informed grouping progress, description, and action inside each bay.
- Preserve the established 45/25/15/15 mock/quiz/theory/simulation formula; do not change assessment policy as part of a visual redesign.
- Audio accepts bounded question/explanation text from authenticated clients; it does not retrieve hidden answers. The client supplies only visible content. The daily quota bounds use, but this is not a database-backed content allowlist; further content enforcement is a remaining hardening item before broad public rollout.
- Keep the existing legacy fonts available for the separately owned simulator. This increases transitional font payload; removing them requires coordination with that work.
- Short RPK/RSM guidance delegates vehicle-specific checks to the instructor rather than inventing an official checklist.

## Verification

- Build (including service-worker generation), lint, and type checking passed with the final simulator-theme safeguard.
- All 146 tests passed across the final 16-file run (133 tests) and an isolated retry of offlineQueue.test.ts (13 tests). The full run reported a worker-start timeout for that file, not an assertion failure; its standalone retry passed. Earlier parallel workers also timed out. New endpoint, RPK/RSM, and audio-cancellation checks passed.
- Impeccable's targeted detector returned no findings for the new dashboard, road, bays, header, and RPK/RSM screen. This is a static check, not visual acceptance.
- A scan of generated client files found no copy of the actual Fish Audio key.
- Browser verification could not run: the in-app browser twice timed out while attaching its webview. Consequently mobile/tablet/desktop screenshots, real keyboard focus movement, zoom, rendered contrast, and reduced-motion playback remain unverified. No screenshots or successful visual checks are claimed.
- No simulator scene, physics, control, camera, asset, or narration file was edited. Shared-layout theme isolation was explicitly approved, as described above.

## Remaining work and release inputs

1. Restore an attached browser and check all changed screens at 360, 768, and 1280 px, both languages and themes, keyboard-only operation, and reduced motion. Fix any resulting differences before calling this an exact design match.
2. Select and audition a Fish voice in English and Malay, apply the quota migration, and provision hosting secrets. No database migration or deployment was performed. Narration currently returns a safe unavailable state until these inputs exist.
3. Recommended first audition: **Suara Wanita Warga Emas**, ID `97af820cf2014e0f89ed67aaaa02fb83`. Fish's listing describes clear, calm Malay guidance/teaching narration. Its English pronunciation has not been verified; the voice has not been configured automatically.
4. RPK/RSM instructional content needs instructor review before being presented as a comprehensive course. Two-user persistence and live reload have not been exercised against the database.
5. The privacy page still requires the owner's effective date/contact confirmation and complete Malay copy. Existing legal claims were not validated by this UI pass.
6. Several older screens inherit Jalan tokens but retain their existing bespoke layouts and some copy/motion details. Full page-by-page polish, PDF visual checks, and the final acceptance matrix remain open.
7. The build still reports a large vendor chunk (about 4.1 MB uncompressed) and a roughly 7.46 MB PWA precache. Simulator/vendor splitting was not changed within this excluded scope.

## Change isolation

Existing authentication, grading, settings, account, and other edits were present before this pass. Only owned hunks were staged in mixed files. Those pre-existing working-tree changes remain. The simulator's separate implementation is excluded.

## Commits

- `7d03509`: Jalan tokens and road primitives.
- `4bfa1e7`: dashboard, navigation, and RPK/RSM learning flow.
- `7e5aebd`: learning accessibility and secure narration.
- `fa50b3a`: dashboard spacing and progress markings.
- `5069e7e`: explicitly approved simulator theme safeguard.
