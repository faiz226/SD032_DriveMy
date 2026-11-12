import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/surface";
import { useLanguage } from "@/hooks/useLanguage";

export interface Attempt {
  id: string;
  /** When it was finished; null while it waits to sync from an offline save. */
  date: string | null;
  title: string;
  score: string;
  /** Short facts shown after the date, such as the pass mark and the time taken. */
  details?: string[];
  passed?: boolean;
}

const PAGE = 10;

/** Past attempts, newest first, ten at a time. A list rather than a table, so it reads on a phone. */
export function AttemptList({ items, empty }: { items: Attempt[]; empty: string }) {
  const { t, language } = useLanguage();
  const [shown, setShown] = useState(PAGE);
  if (items.length === 0) return <p className="py-6 text-muted-foreground">{empty}</p>;

  const sorted = [...items].sort((a, b) => (b.date ? Date.parse(b.date) : Infinity) - (a.date ? Date.parse(a.date) : Infinity));
  const when = (date: string | null) => date
    ? new Date(date).toLocaleString(language === "ms" ? "ms-MY" : "en-MY", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : t("progress.waitingToSync");

  return (
    <div>
      <ul className="divide-y divide-border">
        {sorted.slice(0, shown).map(item => (
          <li key={item.id} className="flex items-center justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {when(item.date)}
                {item.details?.length ? (
                  <>
                    {/* Inline after the date where there is room; on its own line on a phone, with no dangling rule. */}
                    <span aria-hidden="true" className="mx-2 hidden h-3 w-px bg-border align-[-1px] sm:inline-block" />
                    <span className="sr-only">, </span>
                    <span className="block sm:inline">{item.details.join(", ")}</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="type-figure text-lg">{item.score}</span>
              {item.passed !== undefined && <Pill tone={item.passed ? "success" : "danger"}>{item.passed ? t("progress.pass") : t("progress.fail")}</Pill>}
            </div>
          </li>
        ))}
      </ul>
      {sorted.length > shown && (
        <Button variant="ghost" className="mt-2 -ml-3 px-3" onClick={() => setShown(n => n + PAGE)}>
          {t("progress.showMore", { count: Math.min(PAGE, sorted.length - shown) })}
        </Button>
      )}
    </div>
  );
}
