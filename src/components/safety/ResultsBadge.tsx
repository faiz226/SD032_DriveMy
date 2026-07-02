import { Badge } from "@/components/ui/badge";
import { CheckCircle, Warning } from "phosphor-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ResultsBadgeProps {
  score: number; // 0-100
}

export function ResultsBadge({ score }: ResultsBadgeProps) {
  const { t } = useLanguage();

  if (score >= 90) {
    return (
      <Badge className="border border-success/30 bg-success/15 text-success py-1.5 px-3 flex gap-1.5 text-base">
        <CheckCircle className="w-5 h-5" weight="regular" />
        {t("safety.results.excellent")}
      </Badge>
    );
  }

  if (score >= 70) {
    return (
      <Badge className="border border-primary/30 bg-primary/15 text-primary py-1.5 px-3 flex gap-1.5 text-base">
        <Warning className="w-5 h-5" weight="regular" />
        {t("safety.results.good")}
      </Badge>
    );
  }

  return (
    <Badge className="border border-destructive/30 bg-destructive/15 text-destructive py-1.5 px-3 flex gap-1.5 text-base">
      <Warning className="w-5 h-5" weight="regular" />
      {t("safety.results.needsImprovement")}
    </Badge>
  );
}
