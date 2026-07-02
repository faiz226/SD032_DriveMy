import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { Shield, Users, Brain } from "phosphor-react";

export type MaqasidPrinciple = "nafs" | "nasl" | "aql";

interface MaqasidBadgeProps {
  principle: MaqasidPrinciple;
}

export function MaqasidBadge({ principle }: MaqasidBadgeProps) {
  const { t } = useLanguage();

  const config = {
    nafs: {
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: Shield,
      label: t("safety.maqasid.nafs"),
    },
    nasl: {
      color: "bg-success/10 text-success border-success/20",
      icon: Users,
      label: t("safety.maqasid.nasl"),
    },
    aql: {
      color: "bg-primary/10 text-primary border-primary/20",
      icon: Brain,
      label: t("safety.maqasid.aql"),
    },
  };

  const current = config[principle];
  const Icon = current.icon;

  return (
    <Badge variant="outline" className={`${current.color} flex items-center gap-1.5 py-1 px-3`}>
      <Icon className="w-3.5 h-3.5" />
      {current.label}
    </Badge>
  );
}
