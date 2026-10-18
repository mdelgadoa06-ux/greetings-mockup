"use client";

/**
 * Steps (21st.dev · Ark UI) adaptado a Greetings.
 * Misma anatomía que el demo "StepsWithIcons": Root → List → Item → Trigger → Indicator + Separator.
 * Cambios: color de marca en lugar de blue-600, etiqueta visible junto al indicador y modo controlado.
 * Uso principal: avance de nivel analítico Sede → Departamento → Empleado.
 */
import { Steps } from "@ark-ui/react/steps";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepDef = { icon: LucideIcon; label: string; hint?: string };

type LevelStepsProps = {
  steps: StepDef[];
  step: number;
  onStepChange?: (step: number) => void;
  /** Pasos posteriores al actual que aún no se pueden abrir (p. ej. sin entidad seleccionada). */
  maxReachable?: number;
  className?: string;
  size?: "md" | "sm";
};

export function LevelSteps({ steps, step, onStepChange, maxReachable = steps.length - 1, className, size = "md" }: LevelStepsProps) {
  const dot = size === "sm" ? "w-8 h-8" : "w-11 h-11";
  return (
    <Steps.Root
      count={steps.length}
      step={step}
      onStepChange={(d) => d.step <= maxReachable && onStepChange?.(d.step)}
      className={cn("w-full", className)}
    >
      <Steps.List className="flex justify-between items-center">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const locked = index > maxReachable;
          return (
            <Steps.Item key={s.label} index={index} className="relative flex not-last:flex-1 items-center">
              <Steps.Trigger
                disabled={locked}
                className="flex items-center gap-3 text-left rounded-full group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <Steps.Indicator
                  className={cn(
                    "flex justify-center items-center shrink-0 rounded-full font-semibold text-sm border-2 transition-colors duration-300",
                    dot,
                    "data-complete:bg-brand data-complete:text-white data-complete:border-brand",
                    "data-current:bg-field data-current:text-white data-current:border-field",
                    "data-incomplete:bg-gray-100 data-incomplete:text-gray-500 data-incomplete:border-gray-200",
                  )}
                >
                  <Icon className="w-5 h-5 group-data-complete:hidden" strokeWidth={2.2} />
                  <Check className="w-5 h-5 hidden group-data-complete:block" strokeWidth={2.6} />
                </Steps.Indicator>
                <span className="flex flex-col leading-tight">
                  <span className="text-[16px] font-semibold text-ink group-data-incomplete:text-muted-foreground">{s.label}</span>
                  {s.hint && <span className="text-[13.5px] text-muted-foreground max-w-[18ch] truncate">{s.hint}</span>}
                </span>
              </Steps.Trigger>
              <Steps.Separator
                hidden={index === steps.length - 1}
                className="flex-1 bg-gray-200 h-0.5 mx-4 rounded-full transition-colors duration-500 data-complete:bg-brand"
              />
            </Steps.Item>
          );
        })}
      </Steps.List>
    </Steps.Root>
  );
}

export default LevelSteps;
