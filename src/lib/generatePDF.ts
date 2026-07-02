import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExamResult } from "@/components/exam/ExamShell";
import { translate } from "@/lib/translations";
import type { Language } from "@/lib/constants";

interface GeneratePDFOptions {
  result: ExamResult;
  language: "en" | "ms";
  mode: "quiz" | "mock";
  setId?: string;
}

const PRIMARY_RGB: [number, number, number] = [17, 17, 17];

export function generatePDF({ result, language, mode, setId }: GeneratePDFOptions): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const lang = language as Language;
  const t = (key: Parameters<typeof translate>[0], params?: Record<string, string | number>) =>
    translate(key, lang, params);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
  doc.text("DriveMy", 14, 20);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const title =
    mode === "mock"
      ? setId
        ? t("exam.pdf.mockTitleSet", { set: setId.replace("-", " ").toUpperCase() })
        : t("exam.pdf.mockTitle")
      : t("exam.pdf.quizTitle");
  doc.text(title, 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `${t("exam.pdf.date")}: ${new Date().toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY")}`,
    14,
    37
  );
  doc.text(
    `${t("exam.pdf.duration")}: ${Math.floor(result.durationSeconds / 60)}m ${result.durationSeconds % 60}s`,
    14,
    43
  );
  doc.setTextColor(0);

  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  const scoreText = `${result.score}/${result.total}`;
  doc.text(scoreText, pageWidth / 2, 65, { align: "center" });

  doc.setFontSize(14);
  const passed = mode === "mock" ? result.score >= 42 : result.percentage >= 70;
  doc.setTextColor(passed ? 34 : 220, passed ? 139 : 53, passed ? 34 : 69);
  doc.text(passed ? t("exam.pdf.passed") : t("exam.pdf.failed"), pageWidth / 2, 75, { align: "center" });
  doc.setTextColor(0);

  doc.setFontSize(11);
  doc.text(`${result.percentage}%`, pageWidth / 2, 83, { align: "center" });

  const categoryMap: Record<string, { correct: number; total: number }> = {};
  result.questions.forEach((q) => {
    if (!categoryMap[q.category]) categoryMap[q.category] = { correct: 0, total: 0 };
    categoryMap[q.category].total++;
    if (result.answers[q.id] === q.correct_index) categoryMap[q.category].correct++;
  });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(t("exam.pdf.categoryBreakdown"), 14, 98);

  autoTable(doc, {
    startY: 102,
    head: [[t("exam.pdf.category"), t("exam.pdf.correct"), t("exam.pdf.total"), t("exam.pdf.percentCol")]],
    body: Object.entries(categoryMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, { correct, total }]) => [
        cat.replace(/-/g, " "),
        String(correct),
        String(total),
        `${Math.round((correct / total) * 100)}%`,
      ]),
    theme: "grid",
    headStyles: { fillColor: PRIMARY_RGB, textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 140;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(t("exam.pdf.questionDetails"), 14, finalY + 12);

  autoTable(doc, {
    startY: finalY + 16,
    head: [
      [
        t("exam.pdf.colNumber"),
        t("exam.pdf.question"),
        t("exam.pdf.yourAnswer"),
        t("exam.pdf.correctAnswer"),
        t("exam.pdf.result"),
      ],
    ],
    body: result.questions.map((q, i) => {
      const opts = lang === "en" ? q.options_en : q.options_ms;
      const qText = lang === "en" ? q.question_en : q.question_ms;
      const userIdx = result.answers[q.id];
      const userAns = userIdx !== undefined ? `${String.fromCharCode(65 + userIdx)}) ${opts[userIdx]}` : "-";
      const correctAns = `${String.fromCharCode(65 + q.correct_index)}) ${opts[q.correct_index]}`;
      const isCorrect = userIdx === q.correct_index;
      return [
        String(i + 1),
        qText.length > 80 ? qText.slice(0, 77) + "..." : qText,
        userAns.length > 40 ? userAns.slice(0, 37) + "..." : userAns,
        correctAns.length > 40 ? correctAns.slice(0, 37) + "..." : correctAns,
        isCorrect ? "✓" : "✗",
      ];
    }),
    theme: "striped",
    headStyles: { fillColor: PRIMARY_RGB, textColor: [255, 255, 255] },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 60 },
      4: { cellWidth: 12, halign: "center" },
    },
  });

  const pages = doc.internal.pages.length - 1;
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      t("exam.pdf.footer", { current: p, total: pages }),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  return doc.output("blob") as unknown as Blob;
}
