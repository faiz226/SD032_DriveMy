import { useLanguage } from "@/hooks/useLanguage";

interface EthicsSliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function EthicsSlider({ value, onChange, disabled }: EthicsSliderProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-6 px-4">
      <input
        type="range"
        min={1}
        max={10}
        step={0.1}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        disabled={disabled}
        aria-label={`${t("safety.slider.self")}  -  ${t("safety.slider.community")}`}
        className="w-full min-h-12 accent-[rgb(var(--brand))]"
      />
      
      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mt-8 px-2">
        <span>{t("safety.slider.self")}</span>
        <span>{t("safety.slider.community")}</span>
      </div>
    </div>
  );
}
