import { ArrowRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/kit";
import type { Recommendation } from "@/data/ai";
import { useStreamedText } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const TONE_RING = { ok: "ring-ok/25", warn: "ring-warn/35", crit: "ring-crit/30" };

/**
 * Recomendación del LLM. Cambia sola cuando cambia el contexto (sede, departamento o persona):
 * muestra "Analizando…" y luego escribe el texto en streaming.
 */
export function AIRecommendation({
  rec, subject, onAction, cta, className, compact = false,
}: {
  rec: Recommendation;
  subject: string;
  onAction?: (action: string) => void;
  cta?: { label: string; onClick: () => void; icon?: ReactNode };
  className?: string;
  compact?: boolean;
}) {
  const { text, thinking, done } = useStreamedText(rec.body, rec.key + rec.title);

  return (
    <section className={cn("card relative flex flex-col overflow-hidden p-6 md:p-8 ring-1", TONE_RING[rec.tone], className)} aria-live="polite">
      <header className="mb-6 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2.5 text-[16px] font-semibold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-field text-white">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </span>
          Recomendación de IA
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] text-muted-foreground">{subject}</span>
          <StatusBadge status={rec.tone} size="sm" />
        </span>
      </header>

      {thinking ? (
        <div className="space-y-2.5 py-1" aria-label="Analizando">
          <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </span>
            Analizando pulsos, POS y turnos…
          </div>
          <div className="skeleton h-7 w-4/5" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          {!compact && <div className="skeleton h-4 w-2/3" />}
        </div>
      ) : (
        <div className="animate-fade">
          <h4 className="text-[clamp(24px,2vw,30px)] leading-tight font-semibold tracking-[-0.03em] text-ink">{rec.title}</h4>
          <p className={cn("mt-3 text-[17px] leading-relaxed text-[#3d433f]", !done && "caret")}>{text}</p>
        </div>
      )}

      <div className={cn("mt-auto pt-6 transition-opacity duration-500", thinking || !done ? "opacity-0" : "opacity-100")}>
        <p className="mb-3 text-[14px] font-semibold text-muted-foreground">Qué hacer</p>
        <div className="flex flex-wrap gap-2">
          {rec.actions.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onAction?.(a)}
              className="press rounded-full bg-secondary px-4 py-2 text-[15px] font-medium text-ink hover:bg-mint cursor-pointer"
            >
              {a}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {cta && (
            <button
              type="button"
              onClick={cta.onClick}
              className="press inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[16px] font-semibold text-white hover:bg-field-2 cursor-pointer"
            >
              {cta.icon}
              {cta.label}
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
