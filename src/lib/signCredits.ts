import signSourcesMarkdown from "../../docs/sign-sources.md?raw";

export interface SignCredit {
  /** Public asset filename under /signs/, e.g. "f60d1ad5a5610370.svg". */
  filename: string;
  /** Original Wikimedia Commons label or title from the source table. */
  sourceLabel: string;
  /** Wikimedia Commons file page URL. */
  commonsUrl: string;
  /** Short licence name, e.g. "CC BY-SA 4.0", "Public domain", "CC0". */
  licenceName: string;
  /** Licence deed or Wikimedia licensing section URL. */
  licenceUrl: string;
  /** Author / creator credit string as recorded on Wikimedia Commons. */
  author: string;
  /** True for Public domain and CC0 assets where no author attribution is required. */
  isPublicDomain: boolean;
}

const LINK_RE = /^\[([^\]]+)\]\((.+)\)$/;
const PUBLIC_DOMAIN_RE = /^(?:public domain|cc0)\b/i;

function parseMarkdownLink(cell: string): { label: string; url: string } | null {
  const match = LINK_RE.exec(cell.trim());
  if (!match) return null;
  return { label: match[1].trim(), url: match[2].trim() };
}

/**
 * Parses docs/sign-sources.md (the single source of truth checked by kpp-question-bank.audit.test.ts)
 * into typed SignCredit records for the app UI. Handles both 4-column and 5-column rows and URLs
 * containing parentheses (such as Commons filenames like AWAS_(Caution)_lettering.png).
 */
export function parseSignSources(markdown: string): SignCredit[] {
  const credits: SignCredit[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("| `")) continue;
    const cells = line
      .slice(1, line.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((cell) => cell.trim());
    if (cells.length < 4) continue;

    const filenameMatch = /^`([^`]+)`$/.exec(cells[0]);
    const sourceLink = parseMarkdownLink(cells[1]);
    const licenceLink = parseMarkdownLink(cells[2]);
    if (!filenameMatch || !sourceLink || !licenceLink) continue;

    const author = cells[3];
    credits.push({
      filename: filenameMatch[1],
      sourceLabel: sourceLink.label,
      commonsUrl: sourceLink.url,
      licenceName: licenceLink.label,
      licenceUrl: licenceLink.url,
      author,
      isPublicDomain: PUBLIC_DOMAIN_RE.test(licenceLink.label),
    });
  }
  return credits;
}

/** Every shipped road-sign credit parsed directly from docs/sign-sources.md. */
export const SIGN_CREDITS: readonly SignCredit[] = parseSignSources(signSourcesMarkdown);

/** Fast lookup map by shipped filename (e.g. "f60d1ad5a5610370.svg"). */
export const SIGN_CREDIT_BY_FILE: ReadonlyMap<string, SignCredit> = new Map(
  SIGN_CREDITS.map((credit) => [credit.filename, credit]),
);

/** Extract the bare filename from an asset path like "/signs/f60d1ad5a5610370.svg". */
export function signFilenameFromImg(img: string): string {
  return img.replace(/^\/signs\//, "");
}

/** Look up attribution metadata for any sign asset path (e.g. "/signs/..."). */
export function creditForImg(img: string): SignCredit | undefined {
  return SIGN_CREDIT_BY_FILE.get(signFilenameFromImg(img));
}

/** Readable fallback sign title derived from a Commons file URL when a sign is exam-only. */
export function fallbackSignName(credit: SignCredit): string {
  const fromUrl = credit.commonsUrl.split("/File:")[1];
  const raw = fromUrl
    ? decodeURIComponent(fromUrl)
    : credit.sourceLabel.replace(/^File:/i, "");
  return raw
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
