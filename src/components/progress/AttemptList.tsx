import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "@/components/ui/icons";
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

interface AttemptListProps {
  items: Attempt[];
  empty: string;
  emptyAction?: { label: string; to: string };
}

const PAGE = 10;

/** Past attempts, newest first, ten at a time. A list rather than a table, so it reads on a phone. */
export function AttemptList({ items, empty, emptyAction }: AttemptListProps) {
  const { t, language } = useLanguage();
  const [shown, setShown] = useState(PAGE);
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-6">
        <p className="text-muted-foreground">{empty}</p>
        {emptyAction && (
          <Button asChild variant="outline" className="min-h-11">
            <Link to={emptyAction.to}>
              {emptyAction.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

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
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                <span>{when(item.date)}</span>
                {item.details?.map((detail) => (
                  <span key={detail}>{detail}</span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="type-figure text-lg">{item.score}</span>
              {item.passed !== undefined && <Pill tone={item.passed ? "success" : "danger"}>{item.passed ? t("progress.pass") : t("progress.fail")}</Pill>}
            </div>
          </li>
        ))}
      </ul>
      {sorted.length > shown && (
        <Button variant="ghost" className="mt-2 -ml-3 min-h-11 px-3" onClick={() => setShown(n => n + PAGE)}>
          {t("progress.showMore", { count: Math.min(PAGE, sorted.length - shown) })}
        </Button>
      )}
    </div>
  );
}
