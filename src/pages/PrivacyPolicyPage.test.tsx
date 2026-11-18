import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { useLanguageStore } from "@/stores/languageStore";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";

// The contact section only renders once the owner sets a real inbox, so these tests stand one in.
vi.mock("@/lib/constants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/constants")>()),
  PRIVACY_CONTACT_EMAIL: "privacy@example.test",
}));

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

describe("privacy notice content (PDPA 2010)", () => {
  afterEach(() => {
    cleanup();
    useLanguageStore.setState({ language: "en" });
  });
  const open = (language: "en" | "ms") => {
    useLanguageStore.setState({ language });
    render(<MemoryRouter><PrivacyPolicyPage /></MemoryRouter>);
  };

  it.each([
    ["en", "Contact", "see, correct or delete your data, or to complain. We reply within 21 days"],
    ["ms", "Hubungi kami", "melihat, membetulkan atau memadam data anda, atau untuk membuat aduan. Kami membalas dalam masa 21 hari"],
  ] as const)("gives a way to write to us in %s, with a mailto link", (language, heading, wording) => {
    open(language);
    const section = screen.getByRole("heading", { name: heading }).closest("section")!;
    expect(section).toHaveTextContent(wording);
    expect(within(section).getByRole("link")).toHaveAttribute("href", "mailto:privacy@example.test");
  });

  it.each([
    ["en", "Your data is stored in Singapore.", "If you are under 18, use DriveMy with your parent's or guardian's knowledge."],
    ["ms", "Data anda disimpan di Singapura.", "Jika anda berumur di bawah 18 tahun, gunakan DriveMy dengan pengetahuan ibu bapa atau penjaga anda."],
  ] as const)("says where data is stored and how minors should use the app in %s", (language, location, minors) => {
    open(language);
    expect(document.body).toHaveTextContent(location);
    expect(document.body).toHaveTextContent(minors);
  });

  it("says the colour test result stays on the device", () => {
    open("en");
    expect(document.body).toHaveTextContent(/colour test result\. It stays on this device and is never sent to us/i);
  });
});
