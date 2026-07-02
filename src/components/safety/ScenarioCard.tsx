import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/lib/translations";
import { MaqasidBadge, type MaqasidPrinciple } from "./MaqasidBadge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "phosphor-react";
import { Card } from "@/components/ui/card";

export interface ScenarioOption {
  id: string;
  textKey: TranslationKey;
}

export interface Scenario {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  options: ScenarioOption[];
  correctId: string;
  principle: MaqasidPrinciple;
  explanationKey: TranslationKey;
}

interface ScenarioCardProps {
  scenario: Scenario;
  onNext: (isCorrect: boolean) => void;
  isExiting: boolean;
}

export function ScenarioCard({ scenario, onNext, isExiting }: ScenarioCardProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Shuffle options randomly each time a new scenario card mounts
  const shuffledOptions = useMemo(() => {
    const opts = [...scenario.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [scenario.id]);

  useEffect(() => {
    setSelected(null);
    setIsConfirmed(false);
  }, [scenario.id]);

  const isCorrect = selected === scenario.correctId;

  return (
    <div
      className={`w-full transition-all duration-200 ease-out-quart motion-reduce:transition-none ${isExiting ? "opacity-0 -translate-x-2" : "opacity-100 translate-x-0"}`}
    >
      <Card className="p-6 border border-border bg-card">
        <h3 className="text-lg font-semibold mb-2">
          {t(scenario.titleKey)}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t(scenario.descKey)}
        </p>

        <RadioGroup
          value={selected || ""}
          onValueChange={setSelected}
          disabled={isConfirmed}
          className="space-y-3"
        >
          {shuffledOptions.map((opt) => {
            const isOptSelected = selected === opt.id;
            const isOptCorrect = opt.id === scenario.correctId;
            
            let cardClass = "flex items-center space-x-3 p-4 border rounded-lg bg-card min-h-[52px] transition-all duration-200 ease-out-quart";
            if (isConfirmed) {
              if (isOptCorrect) {
                cardClass += " border-success bg-success/5 shadow-sm";
              } else if (isOptSelected) {
                cardClass += " border-destructive bg-destructive/5 opacity-80 shadow-sm";
              } else {
                cardClass += " border-border opacity-40 scale-[0.98]";
              }
            } else {
              if (isOptSelected) {
                cardClass += " border-primary bg-primary/5 shadow-sm";
              } else {
                cardClass += " border-border hover:border-primary/30 hover:bg-muted/30";
              }
              cardClass += " cursor-pointer active:scale-[0.99]";
            }

            return (
              <div 
                key={opt.id} 
                className={cardClass}
                onClick={() => !isConfirmed && setSelected(opt.id)}
              >
                <RadioGroupItem 
                  value={opt.id} 
                  id={opt.id} 
                  className={isConfirmed ? "hidden" : "text-primary border-primary"} 
                />
                
                {isConfirmed && isOptCorrect && <CheckCircle className="w-5 h-5 text-success shrink-0" weight="fill" />}
                {isConfirmed && isOptSelected && !isOptCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" weight="fill" />}
                {isConfirmed && !isOptCorrect && !isOptSelected && <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />}
                
                <Label 
                  htmlFor={opt.id} 
                  className={`flex-1 text-sm font-medium leading-relaxed ${isConfirmed ? 'cursor-default' : 'cursor-pointer text-foreground/90 group-hover:text-foreground'}`}
                  onClick={(e) => {
                    // Prevent double-triggering since the outer div also has an onClick
                    e.preventDefault();
                  }}
                >
                  {t(opt.textKey)}
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {isConfirmed && (
          <div className="mt-8 p-4 bg-accent border border-border rounded-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-sm">{t("safety.feedback.why")}</span>
              <MaqasidBadge principle={scenario.principle} />
            </div>
            <p className="text-sm leading-relaxed mb-6">
              {t(scenario.explanationKey)}
            </p>
          </div>
        )}
        <div className="mt-6">
          {!isConfirmed ? (
            <Button 
              className="w-full sm:w-auto sm:min-w-[140px]" 
              onClick={() => setIsConfirmed(true)}
              disabled={!selected}
            >
              {t("common.confirm")}
            </Button>
          ) : (
            <Button 
              className="w-full sm:w-auto sm:min-w-[140px]" 
              onClick={() => onNext(isCorrect)}
            >
              {t("safety.next")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
