# Design System Inconsistencies Report

## Summary

**48 issues found across 35+ files.**

> **Critical context:** The *implemented* design system in `index.css` / `tailwind.config.js` is a warm "Earth & Espresso" theme (espresso brown primary `#644a40`, cream secondary, full dark mode) — **not** the white-canvas / `#111111` / Cal Sans system described in the steering doc (`drivemy-project.md` + `DESIGN.md`). This creates a systemic mismatch that cascades through every file. The top priority is aligning the token layer before fixing individual components.

---

## Critical Issues

### 1. `src/stores/themeStore.ts` — Dark mode store with dark default
```ts
theme: "system",
resolvedTheme: "dark",   // new users land in dark mode by default
```
The design system is **white-canvas only**. A dark mode store should not exist. The entire file is a violation.  
**Fix:** Delete `themeStore.ts`. Replace with a simple `useThemeStore` stub that always returns `"light"`, or remove entirely and clean up all call sites.

---

### 2. `src/hooks/useTheme.ts` — Exposes dark mode API
```ts
export function useTheme() {
  return useThemeStore(); // re-exports setTheme with dark/system options
}
```
Wraps and re-exports the full dark-mode store.  
**Fix:** Delete this hook. Remove all usages.

---

### 3. `src/components/shared/ThemeToggle.tsx` — Dark mode toggle component
```tsx
{ value: "dark",   icon: <Moon ... />, labelKey: "settings.theme.dark" },
{ value: "system", icon: <Monitor ... />, labelKey: "settings.theme.system" },
```
The entire component is a design system violation. It is rendered in `AppLayout`, `AuthLayout`, `GeminiSidebar`, and `SettingsPage`.  
**Fix:** Delete `ThemeToggle.tsx`. Remove all import/usage sites.

---

### 4. `src/App.tsx` — `ThemeProvider` applies `.dark` class to `<html>`
```tsx
const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
root.classList.toggle("dark", resolved === "dark");
```
Actively enables the dark CSS variable set on every page load.  
**Fix:** Remove the `ThemeProvider` component from `App.tsx` entirely.

---

### 5. `src/index.css` — Full `.dark` CSS variable block (~40 lines)
```css
.dark {
  --background: 17 17 17;         /* #111111 Deep Ink */
  --card: 25 25 25;               /* #191919 */
  --sidebar-background: 24 24 27; /* #18181b */
  /* ~40 more lines */
}
```
The entire `.dark` block should be removed for a white-canvas-only system.  
**Fix:** Delete the `.dark { ... }` block from `index.css`.

---

### 6. `src/index.css` — Wrong primary color token
```css
--primary: 100 74 64;   /* #644a40 Rich Espresso — WRONG */
/* Should be: */
--primary: 17 17 17;    /* #111111 per steering doc */
```
This cascades to every `bg-primary`, `text-primary`, `border-primary` across all files.  
**Fix:** Change `--primary` to `17 17 17` and `--ring` to `17 17 17`. Update `--primary-foreground` to `255 255 255`.

---

### 7. `tailwind.config.js` — Cal Sans not configured; wrong heading font
```js
fontFamily: {
  heading: ['"Inter Variable"', "Inter", ...],  // should be Cal Sans
  body:    ['"Inter Variable"', "Inter", ...],
}
```
The steering doc mandates **Cal Sans** for `heading` (h1/h2/h3 display). Cal Sans is never referenced anywhere in the codebase.  
**Fix:** Add `'"Cal Sans"'` as the first entry in `fontFamily.heading`. Until Cal Sans is licensed, document the Inter 600 substitute explicitly in a comment.

---

### 8. `tailwind.config.js` — `darkMode: ["class"]` enabled
```js
darkMode: ["class"],   // line 3
```
Enables Tailwind's dark mode variant system. Must be removed for a white-canvas-only system.  
**Fix:** Remove the `darkMode` key entirely from `tailwind.config.js`.

---

### 9. `src/components/shared/AppLayout.tsx` — Dark sidebar via `bg-sidebar` token
```tsx
className={cn(
  "... bg-sidebar text-sidebar-foreground",
)}
```
`bg-sidebar` resolves to `#18181b` in dark mode (the default state). The steering doc explicitly states: *"Sidebar: Must use surface-card (#f5f5f5) or canvas (#ffffff). NOT dark background."*  
**Fix:** Replace `bg-sidebar` with `bg-background` or `bg-[#f5f5f5]`. After removing dark mode, the sidebar token will resolve correctly — but the token itself should be audited.

---

### 10. `src/components/shared/GeminiSidebar.tsx` — Dark sidebar + duplicate layout
```css
/* dark mode sidebar token resolves to: */
--sidebar-background: 24 24 27; /* #18181b — near-black */
```
In dark mode (the default), the sidebar renders as `#18181b` — a direct violation. Additionally, this file is a near-duplicate of `AppLayout.tsx`, defining its own `Sidebar`, `MobileBottomNav`, and layout wrappers.  
**Fix:** Remove `GeminiSidebar.tsx` or consolidate it into `AppLayout.tsx`. Fix the sidebar background token.

---

## Moderate Issues

### 11. `src/components/ui/card.tsx` — Wrong border radius
```tsx
className={cn("rounded-md border border-border bg-card ...", ...)}
```
Cards use `rounded-md`. The steering doc specifies cards = `{rounded.lg}` = 12px. The root cause is in `tailwind.config.js` where both `lg` and `md` map to `var(--radius)` = 8px:
```js
borderRadius: {
  lg: "var(--radius)",   // 8px — should be 12px (0.75rem)
  md: "var(--radius)",   // 8px — correct for buttons
}
```
**Fix:** Change `borderRadius.lg` to `"0.75rem"` (12px) in `tailwind.config.js`. Update `card.tsx` to use `rounded-lg`.

---

### 12. `src/pages/ProgressPage.tsx` — Pervasive i18n bypass (~15 instances)
```tsx
<span>{en ? "Theory Completed" : "Teori Selesai"}</span>
<span>{en ? "Total Attempts" : "Jumlah Percubaan"}</span>
<TabsTrigger value="theory">{en ? "Theory" : "Teori"}</TabsTrigger>
// + "Loading..." hardcoded, + "Modules" suffix hardcoded
```
The `en ? "..." : "..."` pattern is used ~15 times instead of `t("key")`.  
**Fix:** Add translation keys to `en.ts` / `ms.ts` and replace all inline ternaries with `t("key")`.

---

### 13. `src/pages/SafetyPage.tsx` — Hardcoded strings + `font-bold` on headings
```tsx
toast.error("Justification must be at least 50 characters.");  // hardcoded English
<h1 className="text-3xl font-bold">...</h1>   // font-bold (700) — should be font-semibold (600)
<div className="text-5xl font-bold font-mono ...">  // font-bold on display size
```
`font-bold` (700) on display headings violates: *"Display weight stays at 600 across all sizes — never 700."*  
**Fix:** Replace `font-bold` with `font-semibold`. Move toast string to i18n.

---

### 14. `src/pages/SimulationsPage.tsx` — Hardcoded strings
```tsx
{completedCount}/8 Completed   // "Completed" hardcoded
{en ? "Tap to start" : "Ketik untuk mula"}  // inline bilingual, not i18n key
```
**Fix:** Add keys to translation files and use `t("key")`.

---

### 15. `src/pages/SimulationView.tsx` — All tip strings hardcoded in component
```tsx
const MANEUVER_TIPS: Record<string, { en: string; ms: string }> = {
  "hill-start": { en: "Keep clutch at biting point...", ms: "Pastikan klac..." },
  // 7 more entries — all hardcoded, not in i18n files
}
```
**Fix:** Move all maneuver tip strings into `en.ts` / `ms.ts` and reference via `t()`.

---

### 16. `src/pages/TheoryPage.tsx` — Hardcoded data + inline `<style>` tag
```tsx
const SIGNS = [
  { id: "s1", name_en: "Stop", name_ms: "Berhenti", desc_en: "You must stop completely.", ... },
  // 7 more signs — all bilingual strings hardcoded in component
]
placeholder={en ? "Search theory..." : "Cari teori..."}  // not i18n key

<style>{`
  .hide-scrollbar::-webkit-scrollbar { display: none; }
`}</style>  // inline <style> tag
```
**Fix:** Move sign data to i18n files. Replace inline `<style>` with a utility class in `index.css`.

---

### 17. `src/pages/DashboardPage.tsx` — Hardcoded strings
```tsx
<p>Combined score based on your progress</p>  // hardcoded English
<span>{activity.score} pts</span>              // "pts" hardcoded
```
**Fix:** Add keys to translation files and use `t("key")`.

---

### 18. `src/components/simulation/SimulationResults.tsx` — No i18n at all
```tsx
// Does not use useLanguage() hook — all 8+ strings are inline bilingual:
{passed ? (en ? "Passed" : "Lulus") : (en ? "Failed" : "Gagal")}
{en ? "Score" : "Markah"}
{en ? "Try Again" : "Cuba Lagi"}
{en ? "Back to Simulations" : "Kembali ke Simulasi"}
```
**Fix:** Import `useLanguage()`, add all strings to translation files, replace inline ternaries with `t("key")`.

---

### 19. `src/components/simulation/SimulationHUD.tsx` — Hardcoded English
```tsx
<Eye ... /> Mirror   // "Mirror" hardcoded
aria-label="Left turn signal"   // hardcoded English a11y label
aria-label="Right turn signal"
aria-label="Mirror check"
```
**Fix:** Use `t("key")` for all visible text and aria-labels.

---

### 20. `src/components/exam/TestLaunchPanel.tsx` — Hardcoded string
```tsx
"10 randomized questions · No time limit"   // hardcoded English
```
**Fix:** Move to translation files.

---

### 21. `src/components/progress/MockHistoryTable.tsx`, `QuizHistoryTable.tsx`, `SimHistoryTable.tsx` — i18n bypass
```tsx
{en ? "No mock test attempts yet." : "Belum ada percubaan ujian mock."}
{en ? `Page ${page} of ${totalPages}` : `Muka Surat ${page} daripada ${totalPages}`}
aria-label="Previous page"   // hardcoded English
aria-label="Next page"
```
**Fix:** Add keys to translation files and use `t("key")`.

---

### 22. `src/pages/ColorVisionPage.tsx` — `font-bold` on `text-5xl` display
```tsx
<div className="text-5xl font-bold font-mono font-tabular-nums text-primary">{percentage}%</div>
```
**Fix:** Replace `font-bold` with `font-semibold`.

---

### 23. `src/pages/ProfilePage.tsx` — `font-bold` on h1
```tsx
<h1 className="font-heading text-3xl font-bold tracking-tight">
```
**Fix:** Replace `font-bold` with `font-semibold`.

---

### 24. `src/components/ui/button.tsx` — Extra variants outside design system
```tsx
success: "bg-success text-success-foreground ...",
warning: "bg-warning text-warning-foreground ...",
```
The steering doc permits only: `button-primary`, `button-secondary`, `button-icon-circular`, `button-text-link`. Colored action buttons (`success`, `warning`) are not in the system.  
**Fix:** Remove `success` and `warning` variants. Audit call sites and replace with appropriate semantic alternatives (e.g., use `default` + icon, or a badge).

---

### 25. `src/components/ui/badge.tsx` — Hover states on non-interactive badges
```tsx
default:   "... hover:bg-primary/80",
secondary: "... hover:bg-secondary/80",
success:   "... hover:bg-success/20 ...",
warning:   "... hover:bg-warning/20 ...",
```
Steering doc: *"No hover-heavy styling."* Badges are display elements — hover states are noise.  
**Fix:** Remove all `hover:` classes from badge variants.

---

### 26. `src/components/shared/AppLayout.tsx` — Icon hover scale on nav items
```tsx
<span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
  {item.icon}
</span>
```
Violates: *"No hover-heavy styling (hover:scale, ...)"*  
**Fix:** Remove `group-hover:scale-105` from the icon span.

---

### 27. `src/components/shared/GeminiSidebar.tsx` — More aggressive icon hover scale
```tsx
<span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
```
Same violation as above, more aggressive.  
**Fix:** Remove `group-hover:scale-110`.

---

### 28. `src/pages/ProgressPage.tsx` — `font-bold` on h1
```tsx
<h1 className="font-heading text-3xl font-bold text-foreground">
```
**Fix:** Replace `font-bold` with `font-semibold`.

---

### 29. `src/pages/TheoryPage.tsx` — `font-bold` on h1
```tsx
<h1 className="font-heading text-3xl font-bold">
```
**Fix:** Replace `font-bold` with `font-semibold`.

---

### 30. `src/pages/NotFoundPage.tsx` — `font-bold` on `text-6xl` display
```tsx
<p className="font-heading text-6xl font-bold text-muted-foreground/40 ...">404</p>
```
**Fix:** Replace `font-bold` with `font-semibold`.

---

## Minor / Style Drift

### 31. `src/components/progress/QuizTrendLine.tsx` + `MockTrendLine.tsx` — CSS variable convention mismatch
```tsx
stroke="hsl(var(--chart-1))"   // uses hsl() wrapper — WRONG
dot={{ fill: "rgb(var(--primary))", ... }}  // uses rgb() wrapper — correct
```
Project convention is `rgb(var(--token))`. Tokens are defined as RGB triples. Using `hsl()` produces wrong colors.  
**Fix:** Replace `hsl(var(--chart-1))` with `rgb(var(--chart-1))`.

---

### 32. `src/components/progress/ReadinessDonut.tsx` — Inline bilingual aria-label
```tsx
aria-label={en ? "Overall Readiness Chart" : "Carta Kesediaan Keseluruhan"}
```
**Fix:** Add key to translation files and use `t("key")`.

---

### 33. `src/components/progress/CategoryBreakdownBar.tsx` — Hardcoded category labels
```tsx
const CATEGORY_LABELS: Record<string, { en: string; ms: string }> = {
  "road-signs": { en: "Road Signs", ms: "Papan Tanda" },
  ...
}
```
**Fix:** Move to translation files.

---

### 34. `src/components/progress/ManeuverScoresBar.tsx` — Hardcoded maneuver labels
```tsx
const MANEUVER_LABELS: Record<string, { en: string; ms: string; difficulty: string }> = {
  "hill-start": { en: "Hill Start", ms: "Mula Bukit", ... },
  ...
}
```
**Fix:** Move to translation files.

---

### 35. `src/components/exam/ExamShell.tsx` — Hardcoded English in navigator legend
```tsx
<span>Unanswered</span>
<span>Answered</span>
<span>Flagged</span>
aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ""}${isFlagged ? ", flagged" : ""}`}
```
**Fix:** Use `t("key")` for all labels and aria-labels.

---

### 36. `src/components/exam/TestResultsView.tsx` — Hardcoded English in share sheet
```tsx
title: `DriveMy ${mode === "mock" ? "Mock Test" : "Quiz"} Result`,
```
**Fix:** Use `t("key")` with interpolation.

---

### 37. `src/components/theory/FlipCard.tsx` — Hardcoded fallback string
```tsx
<span>Road Sign Placeholder<br />({name})</span>
```
**Fix:** Use `t("theory.signPlaceholder", { name })`.

---

### 38. `src/components/safety/ScenarioCard.tsx` — Hover states on option cards
```tsx
cardClass += " hover:border-primary/40 hover:bg-muted/40 cursor-pointer";
```
**Fix:** Remove `hover:` classes. Use active/selected state styling only.

---

### 39. `src/pages/SimulationsPage.tsx` — Hover states on maneuver cards
```tsx
className="... hover:border-primary/40 hover:bg-accent/50"
```
**Fix:** Remove `hover:` classes.

---

### 40. `src/pages/DashboardPage.tsx` — Hover states on quick-link cards
```tsx
className="... hover:border-primary/40 hover:bg-accent/50"  // multiple instances
```
**Fix:** Remove `hover:` classes.

---

### 41. `src/components/shared/AuthLayout.tsx` — ThemeToggle usage site
```tsx
<ThemeToggle variant="icon" />
```
Will be resolved automatically once `ThemeToggle.tsx` is deleted (Critical issue #3).

---

### 42. `src/components/shared/OfflineBanner.tsx` — Hardcoded separator
```tsx
<span className="text-muted-foreground"> - {t("common.offlineDesc")}</span>
// The " - " separator is hardcoded outside the translation string
```
**Fix:** Include the separator inside the translation string or use a styled element.

---

### 43. `src/components/ui/progress.tsx` — Hardcoded "Progress" label
```tsx
<span>Progress</span>  // hardcoded English when showLabel=true
```
**Fix:** Accept a `label` prop or use `t("common.progress")`.

---

### 44. `src/components/safety/ResultsBadge.tsx` — Hover states on display badges
```tsx
"... hover:bg-success/20 ..."
"... hover:bg-primary/20 ..."
"... hover:bg-destructive/20 ..."
```
**Fix:** Remove `hover:` classes from non-interactive badge elements.

---

### 45. `src/pages/SafetyPage.tsx` — `bg-secondary/30` undocumented surface
```tsx
className="... bg-secondary/30 ..."
```
`bg-secondary` resolves to `#ffdfb5` (Cream Biscuit) — not a documented surface token in the steering doc.  
**Fix:** Replace with `bg-[#f5f5f5]` (`surface-card`) or `bg-background`.

---

### 46. `src/components/shared/AuthFormAlert.tsx` — Color token drift
```tsx
className={cn("... text-destructive", ...)}
```
`text-destructive` resolves to `#e54d2e` (Terracotta) in the implemented system vs. `#ef4444` (steering doc's `{colors.error}`). Minor drift between spec and implementation.  
**Fix:** After fixing the primary token layer (Critical #6), audit whether `--destructive` should be updated to `239 68 68` (#ef4444).

---

### 47. `src/pages/auth/AuthPage.tsx` — `font-bold` on h1
```tsx
<h1 className="font-heading text-2xl font-bold tracking-tight">
```
**Fix:** Replace `font-bold` with `font-semibold`.

---

### 48. `src/pages/auth/ForgotPasswordPage.tsx` + `src/pages/auth/ResetPasswordPage.tsx` — `font-bold` on headings
```tsx
<h1 className="font-heading text-2xl font-bold tracking-tight">
```
**Fix:** Replace `font-bold` with `font-semibold` in both files.

---

## Recommendations

### Priority 1 — Fix the token layer first (resolves ~10 cascading issues)
1. Remove `darkMode: ["class"]` from `tailwind.config.js`.
2. Delete the `.dark { ... }` block from `index.css`.
3. Change `--primary` in `index.css` from `100 74 64` to `17 17 17` (#111111).
4. Change `borderRadius.lg` in `tailwind.config.js` from `"var(--radius)"` to `"0.75rem"` (12px).
5. Add `'"Cal Sans"'` as the first entry in `fontFamily.heading` (with Inter 600 as documented fallback).

### Priority 2 — Remove the dark mode system (resolves 6 critical violations)
Delete or gut: `themeStore.ts`, `useTheme.ts`, `ThemeToggle.tsx`, `ThemeProvider` in `App.tsx`. Remove all import/usage sites across `AppLayout.tsx`, `AuthLayout.tsx`, `GeminiSidebar.tsx`, and `SettingsPage.tsx`.

### Priority 3 — Systematic i18n sweep
Replace all `en ? "English" : "Malay"` inline patterns with `t("key")` calls. Highest-density files: `ProgressPage`, `SimulationResults`, `TheoryPage`, `SimulationView`. Add missing keys to `en.ts` and `ms.ts`.

### Priority 4 — Typography weight audit
Replace `font-bold` (700) with `font-semibold` (600) on all display headings. Affects ~10 files: `SafetyPage`, `ColorVisionPage`, `ProfilePage`, `ProgressPage`, `TheoryPage`, `NotFoundPage`, `AuthPage`, `ForgotPasswordPage`, `ResetPasswordPage`.

### Priority 5 — Remove out-of-spec button variants
Remove `success` and `warning` variants from `button.tsx`. Audit call sites and replace with `default` + contextual icon or badge.

### Priority 6 — Remove hover-heavy styling
Remove `group-hover:scale-105` / `group-hover:scale-110` from nav icon spans in `AppLayout.tsx` and `GeminiSidebar.tsx`. Remove `hover:border-*` and `hover:bg-*` from card elements in `DashboardPage`, `SimulationsPage`, `ScenarioCard`, and `ResultsBadge`.

### Priority 7 — Fix chart color convention
Replace `hsl(var(--chart-N))` with `rgb(var(--chart-N))` in `QuizTrendLine.tsx` and `MockTrendLine.tsx`.

### Priority 8 — Consolidate duplicate layout
`GeminiSidebar.tsx` is a near-duplicate of `AppLayout.tsx`. Consolidate into a single layout component to prevent future drift.
