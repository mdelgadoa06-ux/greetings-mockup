"use client";

/**
 * Stats2 (21st.dev) adaptado a Greetings.
 * Misma estructura: grilla de 3 tarjetas bg-secondary con cifra grande (text-6xl) + bloque CTA centrado.
 * Cambios: contenido por props, radios tipo iOS (rounded-3xl), tono opcional por tarjeta y CTA con acción.
 * Ícono: el original usa ArrowRight de @aliimam/icons, pero ese paquete no es tree-shakeable
 * (barril de ~12.000 íconos con forwardRef sin @__PURE__) y añadía ~5 MB al build.
 * Se usa el ArrowRight equivalente de lucide-react.
 */
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Stat2Item = {
  eyebrow: string;
  value: ReactNode;
  caption: string;
  tone?: "default" | "critical" | "brand";
  footer?: ReactNode;
};

export type Stats2Props = {
  items: Stat2Item[];
  cta?: {
    title: string;
    subtitle: string;
    button: string;
    note?: string;
    link?: string;
    onClick?: () => void;
    onLink?: () => void;
  };
  className?: string;
};

const tones = {
  default: "bg-secondary",
  critical: "bg-crit-soft",
  brand: "bg-field text-white [&_.s2-muted]:text-white/70 [&_.s2-caption]:text-white/85",
};

const Stats2 = ({ items, cta, className }: Stats2Props) => {
  return (
    <section className={cn("", className)}>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.eyebrow}
            className={cn("flex h-52 flex-col justify-between rounded-3xl p-6 lg:h-56", tones[item.tone ?? "default"])}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="s2-muted text-muted-foreground text-sm">{item.eyebrow}</p>
              {item.footer}
            </div>
            <div>
              <h3 className="text-6xl font-semibold tracking-[-0.04em]">{item.value}</h3>
              <p className="s2-caption text-foreground/80 mt-1 text-base">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>
      {cta && (
        <div className="flex flex-col justify-center p-6 py-16 text-center">
          <div>
            <h2 className="mb-4 text-3xl font-medium tracking-[-0.03em] md:text-5xl">{cta.title}</h2>
            <p className="text-muted-foreground mx-auto mb-6 max-w-2xl text-lg">{cta.subtitle}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button className="mt-2 h-14 rounded-2xl px-10 text-[15px]" onClick={cta.onClick}>
              {cta.button}
            </Button>
            {cta.note && <p className="text-muted-foreground text-xs">{cta.note}</p>}
            {cta.link && (
              <button type="button" onClick={cta.onLink} className="flex items-center gap-2 text-sm text-brand hover:text-field cursor-pointer">
                <span>{cta.link}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export { Stats2 };
