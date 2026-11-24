import { describe, expect, it } from "vitest";
import { avatarUrl, centredSquare, hasOwnAvatar, initialsOf } from "./avatar";

describe("avatarUrl", () => {
  it("prefers the picture a learner set over the provider's", () => {
    expect(avatarUrl({ user_metadata: { avatar_url: "https://g/a.jpg", custom_avatar_url: "https://s/own.webp" } })).toBe("https://s/own.webp");
  });
  it("falls back to the provider's picture, then to nothing", () => {
    expect(avatarUrl({ user_metadata: { avatar_url: "https://g/a.jpg", custom_avatar_url: null } })).toBe("https://g/a.jpg");
    expect(avatarUrl({ user_metadata: {} })).toBeUndefined();
    expect(avatarUrl(null)).toBeUndefined();
  });
  it("knows whether the picture is the learner's own", () => {
    expect(hasOwnAvatar({ user_metadata: { custom_avatar_url: "https://s/own.webp" } })).toBe(true);
    expect(hasOwnAvatar({ user_metadata: { avatar_url: "https://g/a.jpg" } })).toBe(false);
  });
});

describe("initialsOf", () => {
  it("takes the first and last word's capitals", () => {
    expect(initialsOf("nur aisyah binti ali")).toBe("NA");
    expect(initialsOf("Faiz")).toBe("F");
    expect(initialsOf("  ")).toBe("?");
  });
});

describe("centredSquare", () => {
  it("crops the longer side evenly", () => {
    expect(centredSquare(400, 200)).toEqual({ sx: 100, sy: 0, side: 200 });
    expect(centredSquare(200, 300)).toEqual({ sx: 0, sy: 50, side: 200 });
    expect(centredSquare(256, 256)).toEqual({ sx: 0, sy: 0, side: 256 });
  });
});
