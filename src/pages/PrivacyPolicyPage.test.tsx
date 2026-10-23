import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

/** Open the privacy page as the last of `entries` and press its back button. */
function pressBackFrom(entries: string[]) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: /back/i }));
}

describe("privacy page back button", () => {
  afterEach(cleanup);

  it("returns to the page that opened it", () => {
    pressBackFrom(["/settings", "/privacy"]);
    expect(screen.getByTestId("where")).toHaveTextContent("/settings");
  });

  it("goes home when the page was opened from a link", () => {
    pressBackFrom(["/privacy"]);
    expect(screen.getByTestId("where").textContent).toBe("/");
  });
});
