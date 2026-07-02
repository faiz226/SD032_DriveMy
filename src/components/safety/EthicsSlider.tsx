import { ElasticSlider } from "./ElasticSlider";
import { useLanguage } from "@/hooks/useLanguage";
import { User, UsersThree } from "phosphor-react";

interface EthicsSliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function EthicsSlider({ value, onChange, disabled }: EthicsSliderProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-6 px-4">
      <ElasticSlider
        defaultValue={value}
        startingValue={1}
        maxValue={10}
        stepSize={1}
        isStepped={false}
        onChange={onChange}
        disabled={disabled}
        leftIcon={<User size={24} weight="fill" />}
        rightIcon={<UsersThree size={24} weight="fill" />}
        className="w-full"
      />
      
      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mt-8 px-2">
        <span>{t("safety.slider.self")}</span>
        <span>{t("safety.slider.community")}</span>
      </div>
    </div>
  );
}
