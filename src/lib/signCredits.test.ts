/// <reference types="node" />
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { roadSigns } from "@/content/theory";
import {
  SIGN_CREDITS,
  SIGN_CREDIT_BY_FILE,
  creditForImg,
  fallbackSignName,
  parseSignSources,
} from "./signCredits";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNS_DIR = path.resolve(__dirname, "../../public/signs");

describe("signCredits (single source of truth from docs/sign-sources.md)", () => {
  it("matches every shipped file in public/signs/ 1-to-1", () => {
    const shipped = fs.readdirSync(SIGNS_DIR).sort();
    const parsed = SIGN_CREDITS.map((c) => c.filename).sort();
    expect(parsed).toEqual(shipped);
    expect(SIGN_CREDIT_BY_FILE.size).toBe(shipped.length);
  });

  it("provides valid source URLs, licence URLs and non-empty authors for CC-licensed signs", () => {
    for (const credit of SIGN_CREDITS) {
      expect(credit.commonsUrl, credit.filename).toMatch(/^https?:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(credit.licenceUrl, credit.filename).toMatch(/^https?:\/\//);
      expect(credit.licenceName.length, credit.filename).toBeGreaterThan(0);
      if (!credit.isPublicDomain) {
        expect(credit.author.length, `${credit.filename} requires author attribution`).toBeGreaterThan(0);
      }
    }
  });

  it("resolves every sign shown in Learn (roadSigns)", () => {
    for (const sign of roadSigns) {
      const credit = creditForImg(sign.img);
      expect(credit, `missing credit for ${sign.id} (${sign.img})`).toBeDefined();
    }
  });

  it("handles Commons URLs containing parentheses without truncating", () => {
    const sample =
      "| `536fa969bb85d50a.png` | [File:AWAS (Caution) lettering.png](https://commons.wikimedia.org/wiki/File:AWAS_(Caution)_lettering.png) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | ItsTomato |";
    const [parsed] = parseSignSources(sample);
    expect(parsed.commonsUrl).toBe("https://commons.wikimedia.org/wiki/File:AWAS_(Caution)_lettering.png");
    expect(parsed.author).toBe("ItsTomato");
    expect(parsed.isPublicDomain).toBe(false);
    expect(fallbackSignName(parsed)).toBe("AWAS (Caution) lettering");
  });
});
