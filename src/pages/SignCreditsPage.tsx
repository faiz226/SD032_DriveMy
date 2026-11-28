import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  MagnifyingGlass as Search,
  X,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ROUTES } from "@/lib/constants";
import { roadSigns } from "@/content/theory";
import {
  SIGN_CREDITS,
  SIGN_CREDIT_BY_FILE,
  fallbackSignName,
  signFilenameFromImg,
  type SignCredit,
} from "@/lib/signCredits";

const PAGE_SIZE = 24;

type LicenceFilter = "all" | "attribution" | "public-domain";

interface CreditEntry {
  credit: SignCredit;
  nameEn: string;
  nameMs: string;
  searchHaystack: string;
}

const SIGN_BY_FILE = new Map(
  roadSigns.map((sign) => [signFilenameFromImg(sign.img), sign]),
);

const ALL_ENTRIES: CreditEntry[] = SIGN_CREDITS.map((credit) => {
  const matched = SIGN_BY_FILE.get(credit.filename);
  const fallback = fallbackSignName(credit);
  const nameEn = matched?.name ?? fallback;
  const nameMs = matched?.nameMs ?? fallback;
  return {
    credit,
    nameEn,
    nameMs,
    searchHaystack: `${nameEn} ${nameMs} ${credit.author} ${credit.licenceName} ${credit.sourceLabel} ${credit.filename}`.toLowerCase(),
  };
}).sort((a, b) => {
  if (a.credit.isPublicDomain !== b.credit.isPublicDomain) {
    return a.credit.isPublicDomain ? 1 : -1;
  }
  return a.nameEn.localeCompare(b.nameEn);
});

function CreditRow({
  entry,
  isMs,
  highlighted = false,
}: {
  entry: CreditEntry;
  isMs: boolean;
  highlighted?: boolean;
}) {
  const { credit } = entry;
  const title = isMs ? entry.nameMs : entry.nameEn;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:gap-4 ${
        highlighted
          ? "border-brand-ink bg-card ring-2 ring-brand-ink/40"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border bg-muted/40 p-1.5">
          <img
            src={`/signs/${credit.filename}`}
            alt=""
            loading="lazy"
            className="max-h-11 max-w-11 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-heading text-sm font-bold leading-snug text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {credit.isPublicDomain ? (
              isMs ? "Domain awam" : "Public domain"
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {isMs ? "Pencipta: " : "Author: "}
                </span>
                {credit.author}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:justify-end sm:shrink-0">
        <a
          href={credit.licenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link inline-flex min-h-11 items-center gap-1 font-semibold"
        >
          <span>{credit.licenceName}</span>
          <ArrowRight size={13} className="-rotate-45" aria-hidden="true" />
        </a>
        <a
          href={credit.commonsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link inline-flex min-h-11 items-center gap-1 font-semibold"
        >
          <span>{isMs ? "Sumber Commons" : "Commons source"}</span>
          <ArrowRight size={13} className="-rotate-45" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function SignCreditsPage() {
  const { language } = useLanguage();
  const isMs = language === "ms";
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LicenceFilter>("all");
  const [page, setPage] = useState(1);

  const topRef = useRef<HTMLDivElement>(null);
  const selectedFilename = searchParams.get("sign") ?? "";
  useEffect(() => {
    window.scrollTo(0, 0);
    const scroller = topRef.current?.closest("main");
    if (scroller) scroller.scrollTop = 0;
  }, [selectedFilename]);

  const selectedEntry = useMemo(() => {
    if (!selectedFilename || !SIGN_CREDIT_BY_FILE.has(selectedFilename)) return null;
    return ALL_ENTRIES.find((entry) => entry.credit.filename === selectedFilename) ?? null;
  }, [selectedFilename]);

  const counts = useMemo(() => {
    let attribution = 0;
    let publicDomain = 0;
    for (const entry of ALL_ENTRIES) {
      if (entry.credit.isPublicDomain) publicDomain += 1;
      else attribution += 1;
    }
    return { all: ALL_ENTRIES.length, attribution, publicDomain };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ENTRIES.filter((entry) => {
      if (filter === "attribution" && entry.credit.isPublicDomain) return false;
      if (filter === "public-domain" && !entry.credit.isPublicDomain) return false;
      if (!q) return true;
      return entry.searchHaystack.includes(q);
    });
  }, [query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleFilterChange = (next: LicenceFilter) => {
    setFilter(next);
    setPage(1);
  };

  const clearSelected = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div ref={topRef} className="page-shell max-w-5xl space-y-6 pb-24">
      <div className="space-y-3">
        <Link
          to={ROUTES.THEORY}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground no-underline"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{isMs ? "Kembali ke papan tanda" : "Back to road signs"}</span>
        </Link>

        <header className="page-header">
          <h1 className="page-title">
            {isMs ? "Kredit papan tanda jalan" : "Road sign credits"}
          </h1>
          <p className="page-lead">
            {isMs
              ? "Semua imej papan tanda jalan Malaysia diperoleh daripada Wikimedia Commons mengikut lesen terbuka masing-masing."
              : "All Malaysian road sign images come from Wikimedia Commons under their respective open licences."}
          </p>
        </header>
      </div>

      {selectedEntry && (
        <section
          aria-labelledby="selected-sign-credit"
          className="panel space-y-3 p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="selected-sign-credit" className="text-base font-bold font-heading">
              {isMs ? "Papan tanda dipilih" : "Selected sign"}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={clearSelected}
            >
              {isMs ? "Papar semua sahaja" : "Clear selection"}
            </Button>
          </div>
          <CreditRow entry={selectedEntry} isMs={isMs} highlighted />
        </section>
      )}

      <section className="panel space-y-4 p-4 sm:p-5" aria-labelledby="all-sign-credits-heading">
        <h2 id="all-sign-credits-heading" className="sr-only">
          {isMs ? "Semua kredit papan tanda" : "All sign credits"}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={
                isMs
                  ? "Cari tanda, pencipta, atau lesen"
                  : "Search sign, author, or licence"
              }
              aria-label={
                isMs
                  ? "Cari kredit papan tanda jalan"
                  : "Search road sign credits"
              }
              className={`h-11 w-full rounded-xl border border-input bg-card pl-9 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                query ? "pr-11" : "pr-4"
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                aria-label={isMs ? "Kosongkan carian" : "Clear search"}
                className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <span className="pill pill-neutral self-start sm:self-auto">
            {filtered.length} {isMs ? "papan tanda" : "signs"}
          </span>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={isMs ? "Tapis mengikut lesen" : "Filter by licence"}
        >
          {(
            [
              {
                id: "all" as const,
                label: isMs ? `Semua (${counts.all})` : `All (${counts.all})`,
              },
              {
                id: "attribution" as const,
                label: isMs
                  ? `Perlu kredit CC (${counts.attribution})`
                  : `Attribution required (${counts.attribution})`,
              },
              {
                id: "public-domain" as const,
                label: isMs
                  ? `Domain awam (${counts.publicDomain})`
                  : `Public domain (${counts.publicDomain})`,
              },
            ] as const
          ).map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleFilterChange(item.id)}
                className={`min-h-11 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-foreground/40"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {pageItems.length === 0 ? (
          <div role="status" className="rounded-2xl border border-border bg-muted/30 p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {isMs
                ? "Tiada papan tanda sepadan dengan carian anda."
                : "No road signs match your search."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => {
                handleQueryChange("");
                handleFilterChange("all");
              }}
            >
              {isMs ? "Kosongkan tapisan" : "Reset filters"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pageItems.map((entry) => (
              <CreditRow
                key={entry.credit.filename}
                entry={entry}
                isMs={isMs}
                highlighted={entry.credit.filename === selectedFilename}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            aria-label={isMs ? "Halaman kredit papan tanda" : "Sign credits pagination"}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
          >
            <p className="text-xs font-semibold tabular-nums text-muted-foreground">
              {isMs
                ? `Halaman ${safePage} daripada ${totalPages}`
                : `Page ${safePage} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <CaretLeft size={14} aria-hidden="true" />
                <span>{isMs ? "Sebelum" : "Previous"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>{isMs ? "Seterusnya" : "Next"}</span>
                <CaretRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
