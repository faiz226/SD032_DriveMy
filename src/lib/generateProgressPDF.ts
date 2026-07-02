import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { enUS, ms } from "date-fns/locale";
import { translate } from "@/lib/translations";
import { downloadBlob } from "@/lib/utils";
import type { Language } from "@/lib/constants";

interface TrendPoint {
  date: string;
  score: number;
  title?: string;
}

interface ManeuverStat {
  maneuver: string;
  bestScore: number;
  attempts: number;
}

interface HistoryRow {
  completed_at: string;
  percentage?: number;
  duration_seconds?: number;
  set_id?: string;
  passed?: boolean;
  maneuver_id?: string;
  score?: number;
  errors?: number;
}

interface PDFProgressData {
  language: string;
  userName: string;
  theory: {
    completedModules: number;
    totalModules: number;
    percentage: number;
  };
  quiz: {
    average: number;
    totalDuration: number;
    history: HistoryRow[];
    trend: TrendPoint[];
  };
  mock: {
    passRate: number;
    totalDuration: number;
    history: HistoryRow[];
    trend: TrendPoint[];
  };
  sim: {
    averageScore: number;
    totalDuration: number;
    history: HistoryRow[];
    byManeuver: ManeuverStat[];
  };
}

export async function generateProgressPDF(data: PDFProgressData): Promise<void> {
  const doc = new jsPDF();
  const lang = (data.language === "ms" ? "ms" : "en") as Language;
  const t = (key: Parameters<typeof translate>[0]) => translate(key, lang);

  doc.setFontSize(24);
  doc.setTextColor(17, 17, 17);
  doc.text("DriveMy", 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(51, 65, 85);
  doc.text(t("progress.pdf.title"), 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const dateStr = format(new Date(), "PPP p", { locale: lang === "en" ? enUS : ms });
  doc.text(`${t("progress.pdf.generatedOn")}: ${dateStr}`, 14, 36);
  doc.text(`${t("progress.pdf.student")}: ${data.userName}`, 14, 42);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 46, 196, 46);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(t("progress.pdf.executiveSummary"), 14, 55);

  const totalDurationMinutes =
    (data.quiz.totalDuration + data.mock.totalDuration + data.sim.totalDuration) / 60;

  autoTable(doc, {
    startY: 60,
    head: [[t("progress.pdf.metric"), t("progress.pdf.value")]],
    body: [
      [
        t("progress.pdf.totalStudyTime"),
        `${Math.floor(totalDurationMinutes / 60)}h ${Math.floor(totalDurationMinutes % 60)}m`,
      ],
      [
        t("progress.pdf.theoryModules"),
        `${data.theory.completedModules} / ${data.theory.totalModules} (${data.theory.percentage.toFixed(1)}%)`,
      ],
      [t("progress.pdf.avgQuiz"), `${data.quiz.average.toFixed(1)}%`],
      [t("progress.pdf.mockPassRate"), `${data.mock.passRate.toFixed(1)}%`],
      [t("progress.pdf.avgSim"), `${data.sim.averageScore.toFixed(1)}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  doc.text(t("progress.pdf.recentQuizzes"), 14, finalY1);
  autoTable(doc, {
    startY: finalY1 + 5,
    head: [[t("progress.pdf.date"), t("progress.pdf.score"), t("progress.pdf.duration")]],
    body: data.quiz.history.slice(0, 10).map((r) => [
      format(new Date(r.completed_at), "MMM d, yyyy"),
      `${r.percentage ?? 0}%`,
      String(r.duration_seconds ?? 0),
    ]),
    theme: "striped",
    margin: { left: 14, right: 14 },
  });

  const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  if (finalY2 > 250) doc.addPage();
  const startY2 = finalY2 > 250 ? 20 : finalY2;

  doc.text(t("progress.pdf.recentMocks"), 14, startY2);
  autoTable(doc, {
    startY: startY2 + 5,
    head: [
      [
        t("progress.pdf.date"),
        t("progress.pdf.set"),
        t("progress.pdf.score"),
        t("progress.pdf.status"),
      ],
    ],
    body: data.mock.history.slice(0, 10).map((r) => [
      format(new Date(r.completed_at), "MMM d, yyyy"),
      r.set_id ?? "-",
      `${r.percentage ?? 0}%`,
      r.passed ? t("progress.pdf.pass") : t("progress.pdf.fail"),
    ]),
    theme: "striped",
    margin: { left: 14, right: 14 },
  });

  const finalY3 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  if (finalY3 > 250) doc.addPage();
  const startY3 = finalY3 > 250 ? 20 : finalY3;

  doc.text(t("progress.pdf.recentSims"), 14, startY3);
  autoTable(doc, {
    startY: startY3 + 5,
    head: [
      [
        t("progress.pdf.date"),
        t("progress.pdf.maneuver"),
        t("progress.pdf.score"),
        t("progress.pdf.errors"),
      ],
    ],
    body: data.sim.history.slice(0, 10).map((r) => [
      format(new Date(r.completed_at), "MMM d, yyyy"),
      r.maneuver_id ?? "-",
      `${r.score ?? 0}%`,
      String(r.errors ?? 0),
    ]),
    theme: "striped",
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `DriveMy Progress Report - ${t("progress.pdf.page")} ${i} / ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  const filename = `DriveMy_Progress_${format(new Date(), "yyyyMMdd")}.pdf`;
  downloadBlob(doc.output("blob"), filename);
}
