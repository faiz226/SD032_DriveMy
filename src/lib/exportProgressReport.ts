import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { downloadBlob } from "@/lib/utils";

/** Absolute hex values for canvas capture — avoids unresolved `var(--*)` at export time */
const PRINT_THEME = {
  background: "#f9f9f9",
  card: "#fcfcfc",
  foreground: "#202020",
  mutedForeground: "#646464",
  border: "#d8d8d8",
  primary: "#644a40",
} as const;

const FRAME_ID = "progress-report-print-frame";

function applyPrintTheme(root: HTMLElement) {
  root.style.backgroundColor = PRINT_THEME.background;
  root.style.color = PRINT_THEME.foreground;

  root.querySelectorAll<HTMLElement>("[class*='bg-card'], .bg-card").forEach((el) => {
    el.style.backgroundColor = PRINT_THEME.card;
    el.style.borderColor = PRINT_THEME.border;
  });

  root.querySelectorAll<HTMLElement>(".text-muted-foreground").forEach((el) => {
    el.style.color = PRINT_THEME.mutedForeground;
  });

  root.querySelectorAll<HTMLElement>(".text-primary").forEach((el) => {
    el.style.color = PRINT_THEME.primary;
  });

  root.querySelectorAll<HTMLElement>(".border-border").forEach((el) => {
    el.style.borderColor = PRINT_THEME.border;
  });
}


export async function exportProgressReportFromFrame(
  frameId: string = FRAME_ID
): Promise<void> {
  const frame = document.getElementById(frameId);
  if (!frame) {
    throw new Error(`Print frame #${frameId} not found`);
  }

  frame.setAttribute("data-print-mode", "true");

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const canvas = await html2canvas(frame, {
      backgroundColor: PRINT_THEME.background,
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (_doc, clonedFrame) => {
        if (clonedFrame instanceof HTMLElement) {
          clonedFrame.setAttribute("data-print-mode", "true");
          applyPrintTheme(clonedFrame);
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const filename = `DriveMy_Progress_${format(new Date(), "yyyyMMdd")}.pdf`;
    downloadBlob(pdf.output("blob"), filename);
  } finally {
    frame.removeAttribute("data-print-mode");
  }
}
