# DriveMy design audit and implementation plan

Status: implementation approved on 20 October 2026, excluding the simulator. Simulator pages, controls, camera, audio, and assets are owned by another model and are not edited in this task. The simulator retains its existing shell; shared tokens may affect its appearance.

Authority: root `DESIGN.md`, read in full, including its corrections to `drivemy_dashboard.png`. The image is a reference composition, not a pixel-perfect or responsive specification. `DESIGN_SYSTEM.md`, installed skills, and existing component defaults do not override it.

## Scope and evidence

The audit inspected routing, tokens, shared controls, dashboard, theory, quiz, mock test, results, progress, safety, color vision, simulations and their HUD/controls/results, settings, authentication, privacy, and not-found surfaces. Findings below are source-level unless explicitly stated otherwise. The reference image was inspected. A local Vite server started, but the connected browser repeatedly displayed an empty page without captured console errors. This does not establish the cause of the blank page or prove that the app fails in another browser.

Rendered authenticated screens, responsive geometry, keyboard flows, screen-reader output, frame rate, and audio quality remain unverified. Build, lint, typecheck, and tests have not been run in this planning phase. Existing modified and untracked files were present before work began; implementation must preserve those changes and stage only its own reviewed hunks.

User decisions received during the audit:

- Keep L and P gates **not verified** until authoritative qualification data exists.
- Add a real RPK/RSM learning feature to the scope.
- Add Fish Audio for both question/explanation narration and simulator instructions.
- Implementation was approved on 20 October 2026, excluding simulator work.

## Design rules understood

1. The interface is an operational Malaysian driving-learning product: asphalt surfaces, signage, learning bays, and factual progress.
2. Use the exact seven Jalan colors. Saturated colors communicate progress/warning, failure/blocking, completion, or information; they are not arbitrary accents.
3. Use Archivo 800 with expanded width for display/figures, Barlow 400/500/600 for body/controls, and Barlow Condensed 600/700 only for actual signs.
4. Normal copy uses sentence case. Reserve tracked uppercase for genuine road plates.
5. Learning bays have 0 px corners; plates and ordinary controls have at most 4 px corners. Circles remain valid for genuinely circular objects.
6. Road markings encode locked (double solid), completed (single solid), open (white broken), and in-progress (yellow broken) states.
7. Readiness is the dominant road visualization. Its numeric position does not prove L/P eligibility. All scores, dates, and progress must be real.
8. Dashboard layout uses a 1280–1320 px desktop container, 16–20 px gutters, 12–16 px panel gaps, and 3/2/1 learning columns at 1200/768 px boundaries.
9. No staged page arrivals. Useful motion uses transform/opacity and respects reduced motion. Initial values render immediately.
10. Keep AA contrast, obvious yellow keyboard focus, labeled controls, non-color status cues, bilingual independence, and concrete verb-led actions.

## Stack and reusable foundations

The app uses React 19, TypeScript, Vite, React Router 7 with lazy protected routes, Tailwind CSS 3, and custom shadcn-style components built on Radix. State uses Zustand and TanStack Query; forms use React Hook Form and Zod. Supabase handles authentication and persistence. Vite PWA/Workbox provides offline behavior. Charts use Recharts; icons use phosphor-react. Motion includes CSS/Tailwind keyframes, Motion, WAAPI theme transitions, and canvas-confetti. Three.js, React Three Fiber, Drei, Rapier, and postprocessing power a real 3D simulator. Vitest and Testing Library are installed; axe-core and Puppeteer are also present. Vercel configuration currently deploys the SPA; no application API directory or Supabase functions directory was found.

Reuse `src/index.css`, `tailwind.config.js`, `src/styles/jalan-type.css`, `src/components/ui/road.tsx`, existing Radix controls, progress services, translation dictionaries, and exam result components. The seven colors and warm gray ramp already exist. Jalan fonts and square bays already work in parts of the exam flow. Do not build a second component library.

## Skill use

The finder selected the explicit named-skill playbook. The user's requested audit/plan approval boundary governs this task; no separate brief gate is inserted.

| Skill | Application |
|---|---|
| ui-ux-pro-max | Layout, hierarchy, responsive controls, semantic interactions. Its alternate design-system generator is not used because DESIGN.md already fixes the design system. |
| impeccable | Consistency, technical audit, finish quality, and the eventual bounded polish pass. |
| laws-of-ux | Fitts for stable generous targets; Hick for grouped navigation and clear next actions; Jakob for native control behavior; proximity/common region for grouping content with actions. These are design rationales, not measured user-study results. |
| apple-design | Clarity, feedback, familiar controls, touch targets, and reduced motion. Its glass, system-font, and spring defaults do not override Jalan. |
| web-animation | Property selection, technology reuse, reduced motion, and performance. |
| improve-animations | Read-only motion audit and concrete correction plans; its requested parallel motion audit was used. |
| find-animation-opportunities | Restrict additions to feedback, orientation, and real state changes. |
| animation-vocabulary | Consistent names: state transition, press feedback, dialog fade, progress update. |
| threejs-animation | Applies because the simulator has procedural camera and physics motion. No need to introduce skeletal animation or animation mixers. |
| humanizer | Copy review, truthful claims, bilingual action labels. Found at `C:/Users/ASUS/.codex/skills/humanizer/SKILL.md`. |
| ponytail | Reuse existing components, native fetch/audio, and the smallest sufficient changes. |
| caveman | Chat only. This document, UI copy, code, and commits use normal prose. |
| taste | Skipped after inspecting its scope: this installed skill concerns music-video/angelcore editing, not application UI. DESIGN.md and Impeccable provide the requested aesthetic review without silently renaming this skill. |
| motion-studio | Skipped after reading it: it builds rendered motion-graphics videos, not interactive app motion. |

## Design audit

Severity: **blocker** prevents the specified result or access to a core interaction; **major** is substantial design/UX/accessibility drift; **minor** is a localized inconsistency. Findings are not a claim of exhaustive runtime testing.

| Area | What's wrong | Which DESIGN.md rule it breaks | Severity | Skill(s) used to judge |
|---|---|---|---|---|
| Global tokens | `src/index.css` still maps ordinary surfaces to #F9F9F9/#FCFCFC, legacy semantic colors, and 8 px radius. Correct Jalan tokens sit beside them without replacing defaults. | §§3,5,14 | Major | Impeccable, UI/UX Pro Max |
| Type | `tailwind.config.js` defaults to Cal Sans/Inter and JetBrains Mono; Jalan fonts load only on converted routes. Dashboard figures are smaller than the specified hierarchy. | §4 | Major | Impeccable, Apple Design |
| Shared primitives | Card uses 12 px corners; button uses 8 px. Most controls use legacy focus rings. `road.tsx` lacks Carriageway, LPlate, and a locked Bay state. | §§5,6,12 | Major | UI/UX Pro Max, Impeccable |
| Shell/navigation | `AppLayout.tsx:49` defines eight sidebar destinations with filled icons. Desktop top navigation, identity/menu arrangement, and the road-stripe logo are absent. | §§2,7,10 | Major | UI/UX Pro Max, Laws of UX |
| Collapsed navigation | `vertical-dock.tsx:74` uses a focusable div as a button without Enter/Space handling; magnification changes target dimensions and removes the outline. | §12 | Blocker for keyboard use | Apple Design, Laws of UX, improve-animations |
| Dashboard hierarchy | `DashboardPage.tsx:155` prioritizes greeting/name, continue bar, and four generic statistic cards. Readiness appears lower as a donut. | §§2,6,9 | Major | UI/UX Pro Max, Impeccable |
| Readiness road | `src/components/dashboard/ReadinessRoad.tsx` and `src/lib/licence.ts` do not exist. There are no 0/60/100 checkpoints. | §§6,14 | Blocker for specified dashboard | UI/UX Pro Max, ponytail |
| Learning bays | Dashboard has three quick links, not six status-bearing bays. RPK/RSM content/progress is absent. | §§6,8 | Major; RPK/RSM is an approved scope addition | UI/UX Pro Max, Laws of UX |
| Dashboard information deck | No pass-mark/best-score/headroom group. Activity uses generic icons and inline relative dates. Next action is an earlier generic Continue bar. | §9 | Major | Impeccable, humanizer |
| Dashboard responsive rules | `max-w-6xl`, 32 px desktop padding, and existing statistic grids do not implement the specified dashboard composition or 1200 px breakpoint. The missing road has no mobile treatment. | §§2,11 | Major | UI/UX Pro Max |
| Theory | `TheoryPage.tsx:249` has English-only heading/subtitle; 12/16 px cards; learned stars use yellow. Flippable cards are click-only divs at line 314; search lacks an explicit label. | §§3–5,12,13 | Blocker for keyboard card access; major styling/copy | UI/UX Pro Max, humanizer, Laws of UX |
| Quiz/mock launch and exam | Jalan typography and bays are already present and should be retained. Legacy outer page shells/empty states remain; exam progress animates width at `ExamShell.tsx:547`. | §§5,12 | Major | Impeccable, web-animation |
| Exam results | Good factual score/headroom treatment already exists. Passing still triggers multicolored confetti at `TestResultsView.tsx:58`, even though reduced-motion users are protected. | §§1,3,12 | Minor | Impeccable, improve-animations |
| Progress | `ProgressPage.tsx` uses legacy metric cards and mono figures. `ReadinessDonut.tsx` uses an English status string and animated chart; readiness should not imply exam qualification. | §§4,5,12,13 | Major | Impeccable, humanizer, web-animation |
| Safety/ethics | Rounded cards, uppercase labels, mono figures, elastic controls, and confetti. `ElasticSlider.tsx:150` has no keyboard slider interface. | §§1,4,5,12 | Blocker for keyboard adjustment | Apple Design, Laws of UX, improve-animations |
| Color vision | Legacy page/cards, mono result figures, uppercase breakdown, and non-Jalan badges. The test plate images themselves must retain their colors. | §§3–5,13; shared UI only | Major | Impeccable, humanizer |
| Simulator selection | `SimulationsPage.tsx:43` assigns green/yellow/red to difficulty, conflicting with completion/progress/failure meanings. Nine-pixel uppercase difficulty chips and generic glyphs replace the road-path visual language. | §§3,4,6,10 | Major | Impeccable, Laws of UX |
| Simulator HUD/controls/results | HUD/results retain legacy mono typography and radii. Pedal colors in `MobileControls.tsx:79,89` use red/green as control identity. Automatic camera orbit/shake ignores reduced motion. | §§3–5,12 | Major | threejs-animation, Apple Design, improve-animations |
| Settings | `SettingsPage.tsx:87,445,817` uses uppercase headings, pill selectors, and legacy surfaces. Preserve account, language, theme, export, and deletion behavior. | §§4,5,13 | Major | Impeccable, Apple Design |
| Authentication | AuthLayout uses legacy card and page entrance; login/register/recovery/verification inherit old controls. MFA has a white-on-pale-red error at `MfaEnrollmentPage.tsx:116`. | §§3–5,12 | Major | UI/UX Pro Max, Impeccable |
| Privacy/404 | Privacy is English-only and uses legacy type; 404 uses card-premium/page-shell. Neither needs dashboard-style bays. | §§4,5,13; inherited rules | Minor visual; major localization | humanizer, Impeccable |
| Shared motion | Page arrivals, width/height animation, transition-all, chart draws, theme clip-path, and canvas effects are inconsistent and lack common timing tokens. CSS reduced-motion rules do not cover every JS effect. | §12 | Major | web-animation, improve-animations |

## Bugs and UX issues beyond the visual specification

| Issue | Evidence and consequence | Treatment in plan |
|---|---|---|
| Readiness disagrees with itself | `useProgressStats.ts` uses mock/quiz/theory/simulation weights 45/25/15/15. `ReadinessDonut.tsx:23` uses 30/20/10/40. Both dictionaries describe simulation/quiz/mock as 40/30/30. | One shared calculation supplies charts and translated explanations. Preserve the actual formula unless separately approved. |
| Readiness query failure looks like zero | Dashboard excludes the readiness query from its error/retry collection, then defaults absent data to zero. | Keep unavailable/loading/error distinct from an actual zero score. |
| New-learner next action skips theory | Dashboard initializes the route to theory, but every branch overwrites it; a learner with no quiz/mock results is sent to mock test. | Explicit recommendation rules with a meaningful first-learning action. Hick's Law: offer one understandable next action. |
| Activity errors become empty data | `getRecentActivity` ignores query errors and substitutes epoch dates when timestamps are absent. | Report error/partial data and unknown dates truthfully. Localize event names and dates. |
| Misleading community average | `SafetyPage.tsx:144` sets hardcoded 7.2/6.5/8.1 values and presents them as a community average. | Label as an illustrative comparison or remove that claim; do not fabricate live aggregation. |
| Search has no empty result explanation | Theory filters return no cards without a matching empty state or clear-search action. | Add localized no-results feedback and a reset action. |
| Simulator count failure looks like zero | Simulator selection defaults the count to zero without an error branch. | Distinguish unavailable count from no completed maneuvers. |
| Notification switch overpromises | Settings stores a local preference; no notification-delivery implementation was found. | Preserve the preference with truthful copy. Bell may open an in-app status/activity panel; do not imply push delivery exists. |
| Dialog can jump during animation | Dialog's translate-based centering and scale/fade keyframes replace the same transform property. | Separate positioning from animation, keeping Radix focus management. Source-level risk requires rendered confirmation. |
| Privacy placeholders remain | `[Insert Date]` and `privacy@drivemy.local` remain in published copy/constants. | Require the owner's real date and contact before release. Do not invent them or claim legal review. |
| Local preview is blank | Browser observation only; no captured exception established a root cause. | Resolve preview and authenticated test access before implementation verification; do not mask a boot failure with styling. |

## Decisions where DESIGN.md is silent or needs an accessible interpretation

| ID | Decision | Basis / status |
|---|---|---|
| D1 | Apply shared Jalan rules throughout the app, but reserve the exact road/six-bay/deck composition for the dashboard. | DESIGN.md explicitly names the dashboard as its surface. Other routes keep their task-specific layouts. |
| D2 | L/P remain not verified, regardless of score. Retain 0/60/100 anchors as visual positions, not qualification thresholds. | User approved. Do not introduce an invented eligibility algorithm. |
| D3 | Add bilingual RPK/RSM lessons with real topic-level completion. | User approved scope. The reference's 3/5 is sample data, not a requirement to fabricate five completed topics. Source and review lesson content before release. |
| D4 | Keep current maneuver routes usable. Present RPK/RSM as recommended preparation; only show a locked bay when a real supported prerequisite exists. | Preserves working behavior and avoids copying the reference's fictional Bukit lock. Any new enforced lock requires an explicit product decision. |
| D5 | Use 1320 px max dashboard width, 16 px mobile/20 px desktop gutters, and 16 px panel gaps. | Choices within the spec's ranges. Use named tokens. |
| D6 | Use a small 4 px spacing basis plus named layout/type tokens; use 0/4 px radii and one subtle asphalt shadow. | The spec does not enumerate a complete scale. Proposed shadow: `0 1px 3px rgb(var(--asphalt) / .08)`. |
| D7 | Proposed motion: 100 ms feedback, 150 ms dialog/content fade, 200 ms real progress update; reuse `cubic-bezier(.25,1,.5,1)` already in the repo. Reduced motion is immediate. | Timings/easing are proposed decisions, not values from DESIGN.md. No bounce, page stagger, or chart draw. |
| D8 | Keep a yellow focus indicator with a dark contrasting backing/offset on pale surfaces. Put paint-white road markings on an asphalt strip. | Yellow on paint is only about 1.67:1; asphalt on yellow is about 8.83:1. Yellow alone cannot provide sufficient contrast against the light surface. White markings on pale bays also need the dark strip. |
| D9 | Preserve dark/system theme, using existing warm Jalan dark surface tokens with individually verified text/status contrast. | Dark mode is already a working feature; DESIGN.md provides no full dark-mode specification. |
| D10 | Group existing destinations under Dashboard, Kurikulum, Ujian, Litar & Praktikal, and Sumber; keep Progress, Safety, Color vision, Settings, and account actions reachable. | Hick's Law supports grouping; Jakob's Law supports standard links, menus, and active-page states. No hidden feature removal. |
| D11 | Use actual 50-question mock-result counts for the KPP best-score/headroom panel. Never convert a ten-question practice quiz into a fictional 46/50 result. | Reuse existing 42/50 product constants and stored attempt data. This audit does not certify current external exam regulations. |
| D12 | Fish Audio is optional, user-triggered narration of existing content. Text remains available. Stop playback on navigation, question/language change, and simulator reset; do not reveal answers during a test. | User approved both narration surfaces. No cloned voice, microphone capture, or autoplay is required. |
| D13 | Native fetch and HTML audio are sufficient; no new dependency is proposed. | Ponytail and existing stack. Deployment secrets and a server endpoint are required even though the key exists locally. |

## Ordered implementation plan

Each numbered item is a separate commit-sized unit. Larger screen groups are explicitly split. Run focused checks after each unit; complete the full gate at the end. Do not combine existing unrelated edits into these commits.

| Step | Files affected | Change | Risk | Verification |
|---|---|---|---|---|
| 1. Central tokens | `src/index.css`, `tailwind.config.js`, `src/styles/jalan-type.css` | Map existing aliases to Jalan; centralize type, spacing, radii, shadows, motion, focus, and dashboard breakpoints. Move shared fonts to the common entry when all routes use them. | High: affects every route and print capture. | Inspect computed values in both themes; compare canonical hex values; verify font width/weights and no duplicate font downloads. |
| 2. Road primitives | `src/components/ui/road.tsx`, `src/index.css` | Extend existing Bay/Plate/Figure; add locked state, Carriageway and LPlate now that real callers need them; support horizontal/vertical semantic markings. | Medium: state meaning and contrast. | Render every state with words/icon/marking; verify white lines on dark strips and truthful unknown gates. |
| 3. Controls and overlays | `src/components/ui/{button,card,input,textarea,select,checkbox,radio-group,switch,tabs,dialog,drawer,tooltip,accordion,progress,badge,alert,skeleton,form-field}.tsx` | Reuse Radix behavior; apply tokens, 4 px geometry, visible focus, 48 px default targets, localized labels, and stable dialog positioning. | High: broad input/focus impact. | Tab/Shift-Tab, Enter/Space, arrow controls, Escape, focus return, 200% zoom, loading/error/disabled states. Fitts and Jakob guide target and behavior choices. |
| 4. Navigation shell | `src/components/shared/AppLayout.tsx`, new `src/components/shared/AppHeader.tsx`, `src/lib/translations/{en,ms}.ts` | Implement top navigation/account utilities and mobile menu; retire the shell's magnifying dock. Keep all existing destinations accessible. Preserve focused exam/simulator layouts. | High: routing/discoverability. | Route inventory comparison; active state, deep links, menu keyboard behavior, long Malay labels at 360/768/1200 px. |
| 5. Dashboard data | `src/hooks/useProgressStats.ts`, `src/services/analytics.service.ts`, new `src/lib/readiness.ts`, new `src/lib/licence.ts`, focused tests | Centralize existing readiness calculation, truthful loading/error states, actual mock counts/headroom, activity dates, and next-action rules. Licence adapter returns not verified with current data. | High: misleading data if incorrect. | Zero/partial/error data, 41/42/50 mock scores, different practice totals, score 100 with unknown L/P, consistency between dashboard and progress. |
| 6. RPK/RSM content and persistence | New `src/content/rpk-rsm.ts`, `docs/rpk-rsm-content-sources.md`, `src/services/progress.service.ts`, focused tests | Source bilingual vehicle/pre-drive inspection lessons; use stable topic IDs and existing theory_progress rows where schema/RLS permit. Keep these IDs separate from the three existing theory modules. | High: instructional correctness and progress contamination. | Review sources and terminology; save/reload under two users; verify existing theory percentage is unchanged; explicit saved/error feedback. Add migration only if inspection proves necessary. |
| 7. RPK/RSM screen | New `src/pages/RpkRsmPage.tsx`, `src/App.tsx`, `src/lib/constants.ts`, dictionaries | Add lesson list/detail, resume, completion actions, and accessible instructional steps using shared primitives. | Medium: route/state handling. | Keyboard lesson completion, empty/new/partial/completed states, reload, mobile long-text layout. No automatic completion merely from opening a page. |
| 8. Readiness road | New `src/components/dashboard/ReadinessRoad.tsx`, `src/pages/DashboardPage.tsx`, focused tests | Replace dashboard donut with dominant carriageway, score, remaining points, car, and persistent 0/L/P anchors. | Medium: mobile overlap and misleading qualification. | Values 0/59/60/68/99/100; unknown gates at all values; initial render is static; narrow-screen anchors remain readable. |
| 9. Bays and information deck | `src/pages/DashboardPage.tsx`, new `src/components/dashboard/LearningBay.tsx`, dictionaries | Six real bays, semantic markings, sourced metrics, activity, and one actionable next step. | Medium: state-to-route mapping. | Each bay links to the correct live destination; error/no-data states; 3/2/1 grid at exact breakpoints; no copied sample scores/dates. |
| 10. Theory screen | `src/pages/TheoryPage.tsx`, relevant theory components, dictionaries | Convert card surfaces, use semantic flip/disclosure controls, add search label/no-results state, and factual completion styling. | Medium: nested interaction and learning state. | Keyboard access to reveal and learned actions without nested buttons; filters; mobile swipe/scroll; both languages. |
| 11. Exam screens | `src/pages/{QuizPage,MockTestPage}.tsx`, `src/components/exam/{TestLaunchPanel,ExamShell,TestResultsView}.tsx` | Finish legacy wrappers/loading/empty states while preserving grading, timer, resume, authoritative submission, and review behavior. | High: assessment flow. | Existing exam tests plus start/resume/submit/offline/error/review flows; no answer leakage or changed scoring. |
| 12. Progress screen | `src/pages/ProgressPage.tsx`, `src/components/progress/*.tsx`, `src/lib/{generateProgressPDF,exportProgressReport}.ts`, print CSS | Apply plates/figures; unify readiness representation and text; preserve histories, filters, and exports. | Medium: chart meaning and PDF regression. | Chart/table values agree; filter/empty/error states; generated PDF remains readable and complete. |
| 13. Safety and color-vision UI | `src/pages/{SafetyPage,ColorVisionPage}.tsx`, `src/components/safety/{EthicsSlider,ScenarioCard,ResultsBadge,MaqasidBadge}.tsx` | Reuse accessible slider; correct community-average wording; tokenized surfaces and result figures. Preserve actual color-test images and scoring. | Medium/high: interaction and stimulus integrity. | Arrow/Home/End slider control, pointer equivalence, phase transitions, saved/error states; image assets unchanged. Clinical validity is outside this visual audit. |
| 14. Simulator surfaces | `src/pages/SimulationsPage.tsx`, `src/components/simulation/{SimulationHUD,MobileControls,SimulationResults}.tsx` | Neutral difficulty labels, accurate module states, road-path icons, Jalan HUD/results, and readable labeled controls. | High: driving controls. | All eight maneuvers remain reachable; keyboard/touch controls and reset/exit work; responsive HUD does not cover required controls. |
| 15. Account/public screens | `src/pages/SettingsPage.tsx`, `src/pages/auth/*.tsx`, `src/components/shared/AuthLayout.tsx`, `src/pages/{PrivacyPolicyPage,NotFoundPage}.tsx`, shared banners/errors | Apply tokens/type/copy; fix MFA error contrast; retain auth/account safeguards and public privacy access. | High for auth/account regression. | Sign-in/recovery/MFA state rendering and focus; settings persistence; no actual account deletion in routine verification. Owner-supplied privacy facts remain a release prerequisite. |
| 16. Motion correction | `src/index.css`, `tailwind.config.js`, `src/components/ui/{animated-theme-toggler,progress,dialog}.tsx`, exam/progress/safety components, `src/pages/Simulation3DView.tsx` | Remove page entrances, confetti, navigation magnification, and chart draws; use transform/opacity tokens; remove automatic simulator intro and suppress decorative shake under reduced motion. Preserve essential simulation physics. | Medium: transitions and simulator camera. | Normal/reduced motion; interrupt dialogs/progress changes; no delayed keyboard response; CPU-throttled inspection; static initial data. |
| 17. Fish Audio server integration | New `api/speech.ts`, `server/speech.ts`, `scripts/dev-speech.ts`, client `src/services/speech.service.ts`, `.env.example`, `vite.config.ts`, `vercel.json`, deployment docs; quota migration if needed | Native-fetch server proxy, authenticated caller, bounded/allowlisted learning content, request timeout, usage limits, explicit model configuration, safe error handling, and repeat-audio caching. Local server reads FISH_AUDIO_API_KEY; production uses hosting secrets. Exclude API route from SPA rewrite. | High: key exposure, paid usage, answer visibility, deployment parity. | Missing key/auth, expired session, excessive payload/rate, provider 401/402/503/timeout, no secret in bundle/logs, no paid fallback on invalid model, local/production route parity. |
| 18. Fish Audio playback | New `src/hooks/useSpeech.ts`, new `src/components/shared/SpeechControl.tsx`, exam shell/results, simulator instructions/HUD, dictionaries, `vercel.json` | Listen/pause/stop/retry with clear busy/error states and transcript; narrate selected-language visible content. Abort stale requests and revoke object URLs; one playback at a time. Minimal media-src change if blob playback is used. | Medium/high: audio races and distraction. | English/Malay pronunciation samples; navigate/change question/language/reset during generation and playback; offline/quota failure; keyboard control; mock-test timer unchanged; explanations available only when review permits. |
| 19. Copy pass | `src/lib/translations/{en,ms}.ts`, hardcoded labels in affected pages/components, privacy description of audio processing | Sentence case, exact actions, factual errors/results, complete language parity. Remove Local Developer fallback and unsupported readiness predictions. | Medium: missing keys and changed meaning. | Review both languages independently; check long text, date locale, screen-reader labels, and actual text sent for narration. |
| 20. Accessibility, performance, polish, final verification | All changed UI plus targeted tests and audit evidence | Complete cross-screen matrix, contrast/focus checks, reduced-motion coverage, font/bundle/3D loading checks, and final DESIGN.md comparison. | High if incomplete verification is mistaken for acceptance. | Run build, lint, typecheck, tests; inspect mobile/tablet/desktop and all changed states. Record remaining deviations honestly. |

## Fish Audio implementation constraints

The local key's presence was confirmed without displaying its value; `.env.local` is ignored by Git. No Fish Audio generation request has been sent.

The official [Fish Audio TTS endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech) accepts authenticated POST requests at `/v1/tts`, JSON input, and MP3 output. Its current documentation warns that an omitted or unrecognized model can fall back to `s2.1-pro`. The implementation must validate an explicit configured model and never silently turn a failed/free request into a paid request. Voice/model compatibility and account entitlement require an actual smoke test after implementation approval. The language option affects text normalization; it does not guarantee Malay accent or pronunciation. Validate Malaysian terms with listening samples.

Proposed server location is a Vercel API handler because the repo already has Vercel deployment configuration. A small local Node server using the same handler and a Vite proxy supports development with the existing tsx tooling. This choice avoids adding a framework or exposing the key as a VITE_ variable. Production secret setup is separate from editing `.env.local`.

Narration sends only lesson/question/instruction text required for the requested playback, not learner identifiers, results, private profile fields, or unrevealed answers. Server authorization and quota enforcement are required before exposing the endpoint. Do not rely on an in-memory serverless counter as a durable spending limit. Reuse Supabase for a bounded per-user quota if the host does not already provide one. Exact quota and voice choices are configuration decisions to record during implementation; no unlimited synthesis endpoint is acceptable.

## Acceptance and verification matrix

- Run `npm run build`, `npm run lint`, `npm run type-check`, and `npm test`. Record baseline failures separately from regressions. Fix failures introduced by this work; do not rewrite unrelated features to obtain a green report.
- Inspect 360/390 px mobile, 768/1024 px tablet, and 1280/1448 px desktop; include 767/768 and 1199/1200 boundary checks, both languages, light/dark/system, 200% zoom, and reduced motion.
- Cover dashboard new/partial/complete/error states; RPK/RSM list/lesson/save/reload; theory search/reveal; quiz/mock launch/in-progress/queued/error/result/review; safety phases; color vision intro/test/results; simulator selection/loading/active/results; progress histories/export; settings; auth/recovery/MFA; privacy/404 and shared dialogs/banners.
- Verify Tab/Shift-Tab order, Enter/Space activation, arrow-key controls, Escape, focus return, skip link, labels, status announcements, contrast, and absence of color-only state.
- Confirm readiness never grants L/P; RPK progress never inflates legacy theory completion; mock counts and headroom refer to the same attempt/denominator; error data is never presented as zero.
- Test Fish Audio success/failure/cancellation and language changes without exposing answers or interrupting input. Keep readable text available when audio fails. Verify no secrets in generated assets.
- Preserve lazy 3D loading and existing service-worker/offline behavior. Avoid caching authenticated audio responses in a global public service-worker cache. Check memory cleanup and one active playback.
- Recompare every changed surface with DESIGN.md. Use at most one batched polish correction pass and a confirmation pass unless a new functional failure justifies more work. No pixel-match claim is appropriate because the specification explicitly corrects and qualifies the reference render.

## Approval and outstanding inputs

Approval of this plan authorizes the implementation sequence, including RPK/RSM and Fish Audio, and was received on 20 October 2026 with simulator work excluded. L/P remains not verified as requested. A valid privacy contact/date and reviewed RPK/RSM instructional sources are needed before release; they do not block tokens and shared UI work. Production Fish Audio secret provisioning and a usable authenticated preview are necessary for final end-to-end verification. No dependency installation, deployment, database migration, or code commit has been performed in this audit.
