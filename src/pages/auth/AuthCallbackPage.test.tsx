import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { completeAuthRedirect, getSession } from "@/services/auth.service";
import { AuthCallbackPage } from "./AuthCallbackPage";

vi.mock("@/services/auth.service", () => ({ completeAuthRedirect: vi.fn(), getSession: vi.fn() }));

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

/** Land on the callback page the way Supabase sends a learner back after Google. */
function landOn(search: string) {
  window.history.replaceState(null, "", `/auth/callback${search}`);
  render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Google sign-in callback", () => {
  afterEach(() => { cleanup(); vi.mocked(completeAuthRedirect).mockReset(); });

  it("waits for the client's own code exchange and goes on to the next page", async () => {
    vi.mocked(completeAuthRedirect).mockResolvedValue({ access_token: "t" } as never);
    landOn("?code=abc&next=%2Fsettings");
    expect(await screen.findByTestId("where")).toHaveTextContent("/settings");
    expect(completeAuthRedirect).toHaveBeenCalledTimes(1);
    expect(getSession).not.toHaveBeenCalled();
  });

  it("shows the error when the client's exchange failed", async () => {
    vi.mocked(completeAuthRedirect).mockRejectedValue(new Error("invalid flow state, no valid flow state found"));
    landOn("?code=abc&next=%2F");
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
  });
});
