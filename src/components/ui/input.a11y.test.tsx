import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Input } from "./input";
import { FormField } from "./form-field";

/**
 * Accessibility regression tests.
 *
 * The Lighthouse run in docs/reports/lighthouse.md recorded `aria-hidden-focus`
 * at score 0 on the auth form: the icon wrapper carried aria-hidden="true"
 * while containing the show/hide-password BUTTON. That made a functional
 * control keyboard-reachable but invisible to screen readers — WCAG 2.1 AA
 * §4.1.2. The aria-hidden has since been removed from input.tsx, but nothing
 * in the pipeline would have caught it coming back.
 *
 * ── IMPORTANT: what axe can and cannot do here ──────────────────────────────
 *
 * jsdom has no layout engine, so axe-core CANNOT evaluate `aria-hidden-focus`
 * in this environment — it needs computed visibility and focusability. Verified
 * empirically: rendering the exact broken pattern (a <button> inside an
 * aria-hidden <span>) and running axe returns ZERO violations.
 *
 * So `expect(results.violations).toEqual([])` must NOT be read as proof that
 * this specific defect is absent — for that rule it passes vacuously, the same
 * false assurance the old pgTAP RLS test gave.
 *
 * The real guard for this defect is the explicit DOM assertion in the second
 * test, which does not depend on axe. The axe calls are still worth keeping —
 * they cover rules that DO work in jsdom (labelling, aria-invalid, roles,
 * name-from-content) — but full a11y verification requires the browser-based
 * Lighthouse CI run against a real rendering engine.
 */

describe("Input accessibility", () => {
  it("has no violations with an interactive rightIcon (password toggle pattern)", async () => {
    const { container } = render(
      <FormField
        label="Password"
        type="password"
        rightIcon={
          <button type="button" aria-label="Show password">
            👁
          </button>
        }
      />
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  // ── This is the real regression guard for the Lighthouse failure. ──
  it("does not hide interactive content from assistive technology", async () => {
    const { container } = render(
      <Input
        aria-label="Password"
        rightIcon={
          <button type="button" aria-label="Show password">
            👁
          </button>
        }
      />
    );

    // The regression guard: a focusable control must never sit inside an
    // aria-hidden subtree.
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    for (const node of hidden) {
      expect(
        node.querySelector("button, a[href], input, select, textarea, [tabindex]")
      ).toBeNull();
    }

    const results = await axe(container);
    const ariaHiddenFocus = results.violations.filter((v) => v.id === "aria-hidden-focus");
    expect(ariaHiddenFocus).toEqual([]);
  });

  it("has no violations with a decorative leftIcon", async () => {
    const { container } = render(
      <FormField
        label="Email"
        type="email"
        leftIcon={<span aria-hidden>@</span>}
      />
    );

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("associates the error message with the input for screen readers", async () => {
    const { container } = render(
      <FormField label="Email" type="email" error="Enter a valid email" />
    );

    const input = container.querySelector("input")!;
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(container.querySelector(`#${describedBy}`)?.textContent).toContain(
      "Enter a valid email"
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
