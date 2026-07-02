import { useState } from "react";
import { format } from "date-fns";
import { enUS, ms } from "date-fns/locale";
import { CaretUp, CaretDown, CaretLeft, CaretRight } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

interface QuizHistoryTableProps {
  data: any[];
}

type SortField = "date" | "score" | "duration";
type SortOrder = "asc" | "desc";

export function QuizHistoryTable({ data }: QuizHistoryTableProps) {
  const { t, language } = useLanguage();
  const en = language === "en";
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-card text-muted-foreground">
        {t("progress.noQuizAttempts")}
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
      aVal = a.percentage;
      bVal = b.percentage;
    } else if (sortField === "duration") {
      aVal = a.duration_seconds;
      bVal = b.duration_seconds;
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
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("score")} aria-sort={sortField === "score" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
                <div className="flex items-center gap-1">{t("progress.table.score")} <SortIcon field="score" /></div>
              </th>
              <th scope="col" className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort("duration")} aria-sort={sortField === "duration" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}>
                <div className="flex items-center gap-1">{t("progress.table.duration")} <SortIcon field="duration" /></div>
              </th>
              <th scope="col" className="px-4 py-3">
                {t("progress.table.language")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((row) => (
              <tr key={row.id} className="bg-card hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  {format(new Date(row.completed_at), "PPP p", { locale: en ? enUS : ms })}
                </td>
                <td className="px-4 py-3">
                  <div className={`font-bold ${row.percentage >= 84 ? 'text-success' : 'text-destructive'}`}>
                    {row.percentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">{row.score} / {row.total_questions}</div>
                </td>
                <td className="px-4 py-3">
                  {Math.floor(row.duration_seconds / 60)}m {row.duration_seconds % 60}s
                </td>
                <td className="px-4 py-3 uppercase text-xs font-semibold">
                  {row.language}
                </td>
              </tr>
            ))}
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
