/// <reference types="node" />
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { KppQuestion } from "@/types/database";

// @ts-expect-error JS seed file lacks TypeScript declarations
import { KPP_TEXTBOOK_QUESTIONS as RAW_QUESTIONS } from "../../scripts/questions-kpp-textbook.js";

const KPP_TEXTBOOK_QUESTIONS = RAW_QUESTIONS as KppQuestion[];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../");

describe("KPP Question Bank & Architecture Audit", () => {
  // 1. Bundle leak: No mock answers or explanations exist in browser client bundle
  it("ensures mock answers and explanations never ship in client JS bundle", () => {
    // kppQuestionBank.ts must not exist
    const questionBankPath = path.join(ROOT, "src/content/kppQuestionBank.ts");
    expect(fs.existsSync(questionBankPath)).toBe(false);

    // No source files in src/ should import from scripts/questions-*
    function getSourceFiles(dir: string): string[] {
      let results: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(getSourceFiles(fullPath));
        } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.includes("audit.test")) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const srcFiles = getSourceFiles(path.join(ROOT, "src"));
    for (const file of srcFiles) {
      const code = fs.readFileSync(file, "utf8");
      expect(code).not.toMatch(/from\s+['"][^'"]*questions-kpp-textbook/);
      expect(code).not.toMatch(/from\s+['"][^'"]*kppQuestionBank/);
    }

    // If dist/ exists, verify no mock answers are present in compiled JS
    const distDir = path.join(ROOT, "dist/assets");
    if (fs.existsSync(distDir)) {
      const distFiles = fs.readdirSync(distDir).filter((f: string) => f.endsWith(".js"));
      const sampleMockAnswers = [
        "Drivers must never cross or straddle these lines to overtake, turn right, or make a U-turn",
        "Pemandu dilarang sama sekali melintas atau memijak garisan ini untuk memotong, membelok ke kanan, atau berpusing U",
        "Rainwater mixes with accumulated oil, fuel residue, rubber particles, and road grime to form a slick film",
        "Air hujan bercampur dengan sisa minyak, bahan api, habuk getah tayar, dan debu menghasilkan lapisan licin",
        "Wheels slipping off the ramp sides, overshooting the ramp platform, or vehicle sliding back uncontrollably",
        "Tayar tergelincir keluar dari tebing tanjakan, terlajak melepasi platform, atau kenderaan mengundur tanpa kawalan"
      ];

      for (const jsFile of distFiles) {
        const content = fs.readFileSync(path.join(distDir, jsFile), "utf8");
        for (const answer of sampleMockAnswers) {
          expect(content.includes(answer)).toBe(false);
        }
      }
    }
  });

  // 2. Every question has 4 options and a valid correct index (0-3)
  it("ensures every question has exactly 4 options and valid correct_index", () => {
    expect(KPP_TEXTBOOK_QUESTIONS.length).toBe(510);

    for (const q of KPP_TEXTBOOK_QUESTIONS) {
      expect(Array.isArray(q.options_en)).toBe(true);
      expect(q.options_en.length).toBe(4);
      expect(Array.isArray(q.options_ms)).toBe(true);
      expect(q.options_ms.length).toBe(4);

      expect(Number.isInteger(q.correct_index)).toBe(true);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThanOrEqual(3);

      for (let i = 0; i < 4; i++) {
        expect(q.options_en[i].trim().length).toBeGreaterThan(0);
        expect(q.options_ms[i].trim().length).toBeGreaterThan(0);
      }
    }
  });

  // 3. No question repeats within the automatic set or within the manual set
  it("ensures no question repeats within the automatic set or manual set", () => {
    const mockDaQuestions = KPP_TEXTBOOK_QUESTIONS.filter((q: KppQuestion) => q.set_id.startsWith("mock-da-"));
    const seenDa = new Set<string>();
    for (const q of mockDaQuestions) {
      const key = q.question_en.toLowerCase().trim();
      expect(seenDa.has(key)).toBe(false);
      seenDa.add(key);
    }
    expect(mockDaQuestions.length).toBe(300);

    const mockDQuestions = KPP_TEXTBOOK_QUESTIONS.filter((q: KppQuestion) => q.set_id.startsWith("mock-d-"));
    const seenD = new Set<string>();
    for (const q of mockDQuestions) {
      const key = q.question_en.toLowerCase().trim();
      expect(seenD.has(key)).toBe(false);
      seenD.add(key);
    }
    expect(mockDQuestions.length).toBe(300);
  });

  // 4. No question mentions a page in its text
  it("ensures no question mentions a page number in its text", () => {
    const pageRegex = /(?:page|pp?\.|p\.)\s*\d+|(?:m\/s|muka surat|halaman)\s*\d+/i;

    for (const q of KPP_TEXTBOOK_QUESTIONS) {
      expect(pageRegex.test(q.question_en)).toBe(false);
      expect(pageRegex.test(q.question_ms)).toBe(false);
    }
  });

  // 4b. Learner-facing explanations carry no raw book citation
  it("ensures explanations carry no raw citation", () => {
    for (const q of KPP_TEXTBOOK_QUESTIONS) {
      expect(`${q.explanation_en} ${q.explanation_ms}`).not.toMatch(/\(KPP|m\/s \d|\.pdf/i);
    }
  });

  // 5. The right option is the longest no more often than chance (~1 in 4)
  it("ensures correct option is the longest no more often than chance (~1 in 4)", () => {
    let longestEn = 0;
    let longestMs = 0;

    for (const q of KPP_TEXTBOOK_QUESTIONS) {
      const lensEn = q.options_en.map((o: string) => o.length);
      if (lensEn[q.correct_index] === Math.max(...lensEn)) {
        longestEn++;
      }

      const lensMs = q.options_ms.map((o: string) => o.length);
      if (lensMs[q.correct_index] === Math.max(...lensMs)) {
        longestMs++;
      }
    }

    const pctEn = (longestEn / KPP_TEXTBOOK_QUESTIONS.length) * 100;
    const pctMs = (longestMs / KPP_TEXTBOOK_QUESTIONS.length) * 100;

    // Must be around 25% (allowing reasonable margin, under 28%)
    expect(pctEn).toBeLessThanOrEqual(28);
    expect(pctEn).toBeGreaterThanOrEqual(20);

    expect(pctMs).toBeLessThanOrEqual(28);
    expect(pctMs).toBeGreaterThanOrEqual(20);
  });

  // 6. Every sign image path in the app points to a file that exists
  it("ensures every sign image path points to an existing file in public/signs/", () => {
    for (const q of KPP_TEXTBOOK_QUESTIONS) {
      if (q.image_url) {
        const fullPath = path.join(ROOT, "public", q.image_url);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    }

    // Verify all sign paths referenced across src/ exist
    function getSourceFiles(dir: string): string[] {
      let results: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(getSourceFiles(fullPath));
        } else if (/\.(tsx?|jsx?|json|html)$/.test(entry.name)) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const files = getSourceFiles(path.join(ROOT, "src"));
    const signRegex = /\/signs\/[a-zA-Z0-9_.-]+\.svg/g;

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      let match;
      while ((match = signRegex.exec(content)) !== null) {
        const signRel = match[0];
        const signFull = path.join(ROOT, "public", signRel);
        expect(fs.existsSync(signFull)).toBe(true);
      }
    }
  });
});
