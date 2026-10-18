import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BrainCircuit, Database, LineChart } from "lucide-react";
import { Avatar, Segmented } from "@/components/kit";
import { Sheet, ToastProvider } from "@/components/overlays";
import { FOCUS_EMPLOYEE_ID } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Hero, type HeroHandle } from "@/views/Hero";
import { DataModule } from "@/views/DataModule";
import { ClimateModule, type ClimatePath } from "@/views/ClimateModule";
import { PredictiveModule } from "@/views/PredictiveModule";

export type View = "hero" | "data" | "climate" | "predict";
type ModuleView = Exclude<View, "hero">;
const ORDER: View[] = ["hero", "data", "climate", "predict"];

export type Nav = {
  go: (view: View, opts?: { source?: HTMLElement | null }) => Promise<void>;
  openClimate: (focusId: string, source?: HTMLElement | null) => void;
  openPrediction: (employeeId: string, source?: HTMLElement | null) => void;
};

/** Portada de cada capítulo: lo que se lee en el segundo de transición. */
const CHAPTERS: Record<ModuleView, { n: string; title: string; sub: string }> = {
  data: { n: "01", title: "Carga de datos", sub: "Todo tu equipo en un solo lugar" },
  climate: { n: "02", title: "Clima y productividad", sub: "Cómo está tu equipo hoy" },
  predict: { n: "03", title: "Modelo predictivo", sub: "Quién se podría ir mañana" },
};

const DEFAULT_PATH: ClimatePath = { parentId: "all", level: 0, focusId: "centro" };
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const FULL = "inset(0px 0px 0px 0px round 0px)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frames = (n = 2) => new Promise<void>((r) => { const tick = (k: number) => (k ? requestAnimationFrame(() => tick(k - 1)) : r()); tick(n); });
const insetOf = (r: DOMRect) =>
  `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 32px)`;
const centerRect = () => new DOMRect(window.innerWidth * 0.32, window.innerHeight * 0.34, window.innerWidth * 0.36, window.innerHeight * 0.32);

export default function App({ face }: { face: string }) {
  const [view, setView] = useState<View>("hero");
  const [chapter, setChapter] = useState<ModuleView>("data");
  const [climatePath, setClimatePath] = useState<ClimatePath>(DEFAULT_PATH);
  const [predictId, setPredictId] = useState(FOCUS_EMPLOYEE_ID);
  const [shortcuts, setShortcuts] = useState(false);
  const hero = useRef<HeroHandle>(null);
  const moduleScroll = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const curtainTitle = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  /**
   * Transición de capítulo (solo clip-path y opacity, en GPU):
   *  · Inicio → módulo: la tarjeta tocada crece hasta llenar la pantalla con el nombre del módulo.
   *  · Módulo → inicio: el módulo se encoge de vuelta a su tarjeta.
   *  · Módulo → módulo: fundido con la portada del siguiente capítulo.
   */
  const go: Nav["go"] = useCallback(async (next, opts = {}) => {
    const cur = viewRef.current;
    const el = curtain.current;
    const title = curtainTitle.current;
    if (next === cur || busy.current || !el || !title) return;
    const swap = () => {
      flushSync(() => setView(next));
      moduleScroll.current?.scrollTo({ top: 0 });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return swap();

    busy.current = true;
    const reset = () => {
      [el, title].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
      el.style.display = "none";
    };
    const reveal = async () => {
      title.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-18px)" }], { duration: 320, easing: EASE, fill: "forwards" });
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 460, delay: 140, easing: "ease", fill: "forwards" }).finished;
    };
    try {
      flushSync(() => setChapter((next === "hero" ? cur : next) as ModuleView));
      el.style.display = "block";

      if (cur === "hero") {
        const from = opts.source?.getBoundingClientRect() ?? centerRect();
        title.animate([{ opacity: 0, transform: "translateY(18px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 460, delay: 240, easing: EASE, fill: "forwards" });
        await el.animate([{ clipPath: insetOf(from), opacity: 1 }, { clipPath: FULL, opacity: 1 }], { duration: 680, easing: EASE, fill: "forwards" }).finished;
        await sleep(420);
        swap();
        await reveal();
      } else if (next === "hero") {
        el.animate([{ clipPath: FULL, opacity: 0 }, { clipPath: FULL, opacity: 1 }], { duration: 260, easing: "ease", fill: "forwards" });
        title.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" });
        await sleep(300);
        swap();
        hero.current?.showOverview();
        await frames(3);
        const card = document.querySelector<HTMLElement>(`[data-module-card="${cur}"]`)?.getBoundingClientRect() ?? centerRect();
        title.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.94)" }], { duration: 300, easing: EASE, fill: "forwards" });
        await el.animate([{ clipPath: FULL, opacity: 1 }, { clipPath: insetOf(card), opacity: 1 }], { duration: 640, easing: EASE, fill: "forwards" }).finished;
        await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).finished;
      } else {
        el.animate([{ clipPath: FULL, opacity: 0 }, { clipPath: FULL, opacity: 1 }], { duration: 300, easing: "ease", fill: "forwards" });
        title.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 100, easing: EASE, fill: "forwards" });
        await sleep(780);
        swap();
        await reveal();
      }
    } finally {
      reset();
      busy.current = false;
    }
  }, []);

  const nav: Nav = {
    go,
    openClimate: (focusId, source) => {
      const [sede, dept] = focusId.split("-");
      const depth = focusId.split("-").length;
      setClimatePath(
        depth === 1 ? { parentId: "all", level: 0, focusId }
        : depth === 2 ? { parentId: sede, level: 1, focusId }
        : { parentId: `${sede}-${dept}`, level: 2, focusId },
      );
      go("climate", { source });
    },
    openPrediction: (employeeId, source) => {
      setPredictId(employeeId);
      go("predict", { source });
    },
  };

  /* Atajos para presentar / grabar: ← → recorren el flujo, 1·2·3 saltan a un módulo, 0 vuelve al inicio, R repite el hero, ? ayuda */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if ((t instanceof Element && t.closest("input, textarea, select, [contenteditable=true]")) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]') && e.key !== "?") return;
      const cur = viewRef.current;
      const i = ORDER.indexOf(cur);
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (cur === "hero" && !hero.current?.isEntered()) hero.current?.enter();
        else if (i < ORDER.length - 1) go(ORDER[i + 1], { source: cur === "hero" ? document.querySelector<HTMLElement>('[data-module-card="data"]') : null });
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (cur === "hero") hero.current?.replay();
        else go(ORDER[i - 1]);
      } else if (["1", "2", "3"].includes(e.key)) {
        const v = ORDER[Number(e.key)];
        go(v, { source: cur === "hero" ? document.querySelector<HTMLElement>(`[data-module-card="${v}"]`) : null });
      } else if (e.key === "0" || e.key === "Home") go("hero");
      else if (e.key.toLowerCase() === "r") {
        if (cur === "hero") hero.current?.replay();
        else go("hero").then(() => window.setTimeout(() => hero.current?.replay(), 200));
      } else if (e.key === "?") setShortcuts((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const inHero = view === "hero";
  const ch = CHAPTERS[chapter];

  return (
    <ToastProvider>
      {/* Capa 1: Hero + Inicio (siempre montada para conservar el scroll del zoom) */}
      <div className={cn("fixed inset-0", !inHero && "invisible")} inert={!inHero} aria-hidden={!inHero}>
        <Hero ref={hero} face={face} onOpen={(v, el, focus) => (focus ? nav.openClimate(focus, el) : go(v, { source: el }))} />
      </div>

      {/* Capa 2: módulos */}
      {!inHero && (
        <div ref={moduleScroll} data-module-scroll className="scroll-area fixed inset-0 overflow-y-auto bg-canvas">
          <TopBar view={view} nav={nav} />
          <main className="mx-auto w-full max-w-[1360px] px-5 pt-12 pb-20 sm:px-8 lg:px-12">
            {view === "data" && <DataModule nav={nav} />}
            {view === "climate" && <ClimateModule nav={nav} path={climatePath} onPath={setClimatePath} />}
            {view === "predict" && <PredictiveModule nav={nav} selectedId={predictId} onSelect={setPredictId} />}
          </main>
        </div>
      )}

      {/* Cortina de capítulo */}
      <div ref={curtain} aria-hidden className="pointer-events-auto fixed inset-0 z-[60] hidden bg-canvas" style={{ willChange: "clip-path, opacity" }}>
        <div ref={curtainTitle} className="absolute inset-0 grid place-items-center px-6 text-center">
          <div>
            <span className="inline-grid h-12 min-w-12 place-items-center rounded-full bg-mint px-4 font-mono text-[18px] font-semibold text-field">{ch.n}</span>
            <h2 className="mt-6 text-[clamp(44px,5.6vw,84px)] leading-none font-semibold tracking-[-0.05em] text-ink">{ch.title}</h2>
            <p className="mt-5 text-[clamp(18px,1.6vw,24px)] text-muted-foreground">{ch.sub}</p>
          </div>
        </div>
      </div>

      <Sheet open={shortcuts} onClose={() => setShortcuts(false)} title="Atajos para presentar" subtitle="Pensados para grabar el video del pitch sin tocar el mouse.">
        <ul className="space-y-2.5 text-[15px]">
          {[
            ["→", "Siguiente paso (en el hero, reproduce el zoom)"],
            ["←", "Paso anterior (en el hero, vuelve al inicio)"],
            ["1 · 2 · 3", "Ir a Datos, Clima o Predicción"],
            ["0", "Volver al inicio"],
            ["R", "Repetir el hero desde el principio"],
            ["Esc", "Cerrar paneles"],
            ["?", "Mostrar u ocultar esta ayuda"],
          ].map(([k, d]) => (
            <li key={k} className="flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3">
              <span className="text-muted-foreground">{d}</span>
              <kbd className="rounded-lg bg-white px-2.5 py-1 font-mono text-[13px] font-semibold text-ink shadow-card">{k}</kbd>
            </li>
          ))}
        </ul>
      </Sheet>
    </ToastProvider>
  );
}

/* Barra superior mínima: marca · módulos · usuario */
function TopBar({ view, nav }: { view: View; nav: Nav }) {
  return (
    <header className="glass sticky top-0 z-40 border-b border-black/[0.05]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1360px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <button type="button" onClick={() => nav.go("hero")} className="press rounded-xl px-1 cursor-pointer" aria-label="Volver al inicio">
          <span className="text-[20px] font-bold tracking-[-0.065em] text-[#18251e] sm:text-[23px]">greetings.</span>
        </button>
        <Segmented
          ariaLabel="Módulos"
          value={view === "hero" ? "data" : view}
          onChange={(v) => nav.go(v)}
          options={[
            { value: "data", label: "Datos", icon: Database },
            { value: "climate", label: "Clima", icon: LineChart },
            { value: "predict", label: "Predicción", icon: BrainCircuit },
          ]}
          className="[&_button]:px-3 md:[&_button]:px-5 [&_svg]:hidden sm:[&_svg]:block"
        />
        <span className="hidden items-center gap-2.5 sm:flex">
          <span className="text-right text-[14px] leading-tight font-semibold">
            Andrés R.<span className="block text-[12.5px] font-normal text-muted-foreground">Administrador</span>
          </span>
          <Avatar initials="AR" seed={1} size={38} />
        </span>
      </div>
    </header>
  );
}
