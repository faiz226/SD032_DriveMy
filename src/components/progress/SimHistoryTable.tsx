import { useState } from "react";
import { format } from "date-fns";
import { enUS, ms } from "date-fns/locale";
import { CaretUp, CaretDown, CaretLeft, CaretRight } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/translations";

interface SimHistoryTableProps {
  data: any[];
}

type SortField = "date" | "score" | "errors" | "stalls";
type SortOrder = "asc" | "desc";

const MANEUVER_KEYS: Record<string, TranslationKey> = {
  "hill-start": "progress.maneuver.hill-start",
  "side-parking": "progress.maneuver.side-parking",
  "parallel-parking": "progress.maneuver.parallel-parking",
  "three-point-turn": "progress.maneuver.three-point-turn",
  "s-curve": "progress.maneuver.s-curve",
  "z-curve": "progress.maneuver.z-curve",
  "ramp-test": "progress.maneuver.ramp-test",
  "road-merging": "progress.maneuver.road-merging",
};

export function SimHistoryTable({ data }: SimHistoryTableProps) {
  const { t, language } = useLanguage();
  const en = language === "en";
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-card text-muted-foreground">
        {t("progress.noSimAttempts")}
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal, bVal;
    if (sortField === "date") {
      aVal = new Date(a.completed_at).getTime();
      bVal = new Date(b.completed_at).getTime();
    } else if (sortField === "score") {
      aVal = a.score;
      bVal = b.score;
    } else if (sortField === "errors") {
      aVal = a.errors;
      bVal = b.errors;
    } else if (sortField === "stalls") {
      aVal = a.stall_count;
      bVal = b.stall_count;
    }
    
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="w-4 h-4 opacity-0" />;
    return sortOrder === "asc" ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("date")} aria-sort={sortField === "date" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
                <div className="flex items-center gap-1">{t("progress.table.date")} <SortIcon field="date" /></div>
              </th>
              <th scope="col" className="px-4 py-3">{t("progress.table.maneuver")}</th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("score")} aria-sort={sortField === "score" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
                <div className="flex items-center gap-1">{t("progress.table.score")} <SortIcon field="score" /></div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("errors")} aria-sort={sortField === "errors" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
                <div className="flex items-center gap-1">{t("progress.table.errors")} <SortIcon field="errors" /></div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("stalls")} aria-sort={sortField === "stalls" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
                <div className="flex items-center gap-1">{t("progress.table.stalls")} <SortIcon field="stalls" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((row) => {
              const nameKey = MANEUVER_KEYS[row.maneuver_id];
              const name = nameKey ? t(nameKey) : row.maneuver_id;
              return (
                <tr key={row.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {format(new Date(row.completed_at), "PPP p", { locale: en ? enUS : ms })}
                  </td>
                  <td className="px-4 py-3">
                    {name}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {row.score}%
                  </td>
                  <td className="px-4 py-3 text-destructive">
                    {row.errors}
                  </td>
                  <td className="px-4 py-3 text-warning">
                    {row.stall_count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("progress.pageOf", { page, total: totalPages })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label={t("a11y.previousPage")}
            >
              <CaretLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label={t("a11y.nextPage")}
            >
              <CaretRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
