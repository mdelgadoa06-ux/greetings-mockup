import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import GlyphPortal from "@/components/ui/glyph-portal";
import { Avatar } from "@/components/kit";
import { COST_PER_EXIT, EXITS_LAST_12M, HIDDEN_COST_12M, RISK_BUCKETS, SEDE_ENTITIES, SOURCES, deltaPct, fmt, fmtPct } from "@/data/mock";
import type { View } from "@/App";
import { cn } from "@/lib/utils";

export type HeroHandle = { enter: () => void; replay: () => void; isEntered: () => boolean; showOverview: () => void };

type Props = { face: string; onOpen: (view: Exclude<View, "hero">, source: HTMLElement | null, focus?: string) => void };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Pantalla 0 (Hero) + Pantalla 1 (Inicio).
 * El Glyph Portal hace zoom dentro de una letra de "greetings" y adentro aparece el mapa de módulos.
 */
export const Hero = forwardRef<HeroHandle, Props>(function Hero({ face, onOpen }, ref) {
  const scroller = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const raf = useRef(0);

  const animateTo = (top: number, duration: number) => {
    const el = scroller.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    const from = el.scrollTop;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      el.scrollTop = from + (top - from) * ease(k);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const contentTop = () => {
    const el = scroller.current!;
    const content = el.querySelector<HTMLElement>("[data-gp-content]")!;
    return content.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
  };
  const enter = () => animateTo(contentTop(), 2600);
  const replay = () => animateTo(0, 1500);

  const showOverview = () => {
    cancelAnimationFrame(raf.current);
    if (scroller.current) scroller.current.scrollTop = contentTop();
  };

  useImperativeHandle(ref, () => ({ enter, replay, showOverview, isEntered: () => progress.current >= 0.9 }));

  return (
    <div
      ref={scroller}
      data-hero
      className="h-svh overflow-y-auto overscroll-none bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ fontFamily: face }}
      onWheel={() => cancelAnimationFrame(raf.current)}
      onTouchStart={() => cancelAnimationFrame(raf.current)}
      onClickCapture={(e) => {
        // El CTA del portal es un ancla (#contenido). Lo convertimos en un recorrido animado del zoom.
        const link = (e.target as Element).closest<HTMLElement>("[data-gp-enter]");
        if (link) {
          e.preventDefault();
          link.blur(); // el portal mantiene visible el caption mientras tenga foco
          enter();
        }
      }}
    >
      <GlyphPortal
        word="greetings"
        fontFamily={face}
        fontWeight={700}
        scrollLength={2.4}
        interactive
        enterLabel="Entrar"
        style={{ fontFamily: face, "--gp-field": "#0b3b2a", "--gp-ink": "#0c1212", "--gp-foreground": "#fbfbfa" } as CSSProperties}
        onProgress={(p) => (progress.current = p)}
        background={<div aria-hidden style={{ position: "absolute", inset: 0, background: "#0b3b2a" }} />}
        front={
          <>
            <div data-hero-header>
              <span data-hero-logo>greetings.</span>
              <span data-hero-category>
                Retención para equipos operativos
                <br />
                peluquerías · autolavados · talleres
              </span>
            </div>
            <p data-hero-eyebrow>Lo que tu POS no te cuenta de tu equipo.</p>
            <p data-hero-support>Clima laboral y productividad real, en un solo lugar.</p>
            <div data-hero-steps>
              {["Carga de datos", "Visualización", "Modelo predictivo"].map((s, i) => (
                <span key={s} className="flex items-center gap-2.5">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] font-semibold", i === 0 ? "bg-mint text-field" : "bg-[#f3f4f6] text-[#71766f]")}>
                    0{i + 1}
                  </span>
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-[#71766f] uppercase">{s}</span>
                </span>
              ))}
            </div>
          </>
        }
      >
        <Overview onOpen={onOpen} />
      </GlyphPortal>
    </div>
  );
});

/* ==========================================================================
   Inicio: una frase que se entiende en un segundo + los 3 módulos como puertas
   ========================================================================== */
function Overview({ onOpen }: { onOpen: Props["onOpen"] }) {
  const centro = SEDE_ENTITIES.find((s) => s.id === "centro")!;
  return (
    <div className="flex min-h-[var(--gp-height,100svh)] w-full flex-col px-[clamp(24px,5vw,96px)] py-[clamp(24px,4vh,48px)] text-[#fbfbfa]">
      <header className="flex items-center justify-between gap-4">
        <span className="text-[24px] font-bold tracking-[-0.065em]">greetings.</span>
        <span className="flex items-center gap-3">
          <span className="hidden text-right text-[15px] leading-tight md:block">
            Andrés R.<span className="block text-[13px] text-white/60">Administrador</span>
          </span>
          <Avatar initials="AR" seed={1} size={42} />
        </span>
      </header>

      <div className="my-auto py-[clamp(24px,5vh,64px)]">
        <p className="text-[clamp(17px,1.4vw,21px)] text-white/65">Hola, Andrés</p>
        <h2 className="mt-3 max-w-[18ch] text-[clamp(44px,5.4vw,88px)] leading-[1.02] font-medium tracking-[-0.05em] text-balance">
          La rotación te costó <span className="text-[#86efac]">${fmt(HIDDEN_COST_12M, 0)} M</span> este año.
        </h2>
        <p className="mt-5 text-[clamp(17px,1.4vw,21px)] text-white/65">
          {EXITS_LAST_12M} salidas × ${fmt(COST_PER_EXIT, 1)} M cada una. Empieza por aquí:
        </p>

        <div className="mt-[clamp(28px,5vh,56px)] grid gap-5 md:grid-cols-3">
          <ModuleCard id="data" n="01" title="Carga de datos" value={`${SOURCES.length}/${SOURCES.length}`} label="fuentes conectadas" onOpen={onOpen} />
          <ModuleCard id="climate" n="02" title="Clima y productividad" value={fmtPct(deltaPct(centro.clima, centro.climaPrev))} label="de clima en Sede Centro" alert onOpen={onOpen} />
          <ModuleCard id="predict" n="03" title="Modelo predictivo" value={String(RISK_BUCKETS.crit)} label="personas en riesgo alto" alert onOpen={onOpen} />
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ id, n, title, value, label, alert, onOpen }: { id: "data" | "climate" | "predict"; n: string; title: string; value: string; label: string; alert?: boolean; onOpen: Props["onOpen"] }) {
  return (
    <button
      type="button"
      data-module-card={id}
      onClick={(e) => onOpen(id, e.currentTarget)}
      className="group flex min-h-[clamp(220px,30vh,300px)] flex-col justify-between rounded-[32px] bg-white p-7 text-left text-ink transition-[transform,box-shadow] duration-500 ease-ios hover:-translate-y-1.5 hover:shadow-[0_28px_56px_-24px_rgba(0,0,0,.5)] active:scale-[0.985] cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-white/40"
    >
      <span className="flex items-center justify-between">
        <span className="grid h-9 min-w-9 place-items-center rounded-full bg-mint px-2.5 font-mono text-[14px] font-semibold text-field">{n}</span>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-field text-white transition-transform duration-500 ease-ios group-hover:translate-x-1">
          <ArrowRight className="h-5 w-5" />
        </span>
      </span>
      <span>
        <span className={`block text-[clamp(48px,4.4vw,68px)] leading-none font-semibold tracking-[-0.05em] ${alert ? "text-crit" : "text-ink"}`}>{value}</span>
        <span className="mt-2 block text-[16px] text-muted-foreground">{label}</span>
        <span className="mt-5 block text-[clamp(21px,1.7vw,26px)] font-semibold tracking-[-0.025em]">{title}</span>
      </span>
    </button>
  );
}
