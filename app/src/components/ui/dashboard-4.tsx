"use client";

/**
 * Dashboard (ruta del demo 21st.dev "dashboard-4"). El md sólo traía el import, no el código,
 * así que esta es la implementación propia inspirada en el patrón shadcn de dashboard,
 * reducida a lo esencial para video: 3 cifras → cuadrante + IA → tabla del nivel.
 */
import type { ReactNode } from "react";
import { BrainCircuit, ChevronRight } from "lucide-react";
import { AIRecommendation } from "@/components/AIRecommendation";
import { Avatar, Panel, PanelHeader, StatusBadge } from "@/components/kit";
import { QuadrantChart } from "@/components/charts/Quadrant";
import { Dumbbell } from "@/components/charts/small";
import { alertsUnder, recommend } from "@/data/ai";
import { type Entity, type Period, deltaPct, fmt, fmtPct, getEntity } from "@/data/mock";
import { cn } from "@/lib/utils";

const NOUN = ["sede", "departamento", "persona"] as const;
const PLURAL = ["sedes", "departamentos", "personas"] as const;

export type DashboardProps = {
  context: Entity;
  items: Entity[];
  focus: Entity;
  period: Period;
  onFocus: (id: string) => void;
  onDrill: (e: Entity) => void;
  onAction: (action: string) => void;
};

export default function Dashboard({ context, items, focus, period, onFocus, onDrill, onAction }: DashboardProps) {
  const p2 = period === "p2";
  const level = items[0]?.level ?? 0;
  const alerts = alertsUnder(context.id);
  const crit = alerts.filter((a) => a.status === "crit").length;
  const rec = recommend(focus);
  const dClima = deltaPct(context.clima, context.climaPrev);
  const dProd = deltaPct(context.prod, context.prodPrev);

  return (
    <div className="space-y-8">
      {/* Tres cifras del contexto seleccionado */}
      <div className="card grid gap-6 p-6 sm:grid-cols-3 sm:gap-0 md:p-8">
        <Kpi label={`Clima laboral · ${context.short}`} value={fmt(p2 ? context.clima : context.climaPrev)} unit="/100" delta={p2 ? fmtPct(dClima) : undefined} good={dClima >= 0} />
        <Kpi label="Productividad real" value={fmt(p2 ? context.prod : context.prodPrev)} unit="% meta" delta={p2 ? fmtPct(dProd) : undefined} good={dProd >= 0} divider />
        <Kpi label="Alertas activas" value={String(alerts.length)} divider>
          {crit > 0 && <StatusBadge status="crit" label={`${crit} crítica${crit > 1 ? "s" : ""}`} />}
        </Kpi>
      </div>

      {/* Protagonista: cuadrante + qué hacer */}
      <div className="grid gap-8 xl:grid-cols-12">
        <Panel className="flex flex-col xl:col-span-7">
          <PanelHeader title="Clima vs. productividad" subtitle={`Cada punto es ${level === 1 ? "un" : "una"} ${NOUN[level]}. Toca uno.`} />
          <QuadrantChart items={items} period={period} focusId={focus.id} onFocus={onFocus} />
        </Panel>
        <AIRecommendation
          className="xl:col-span-5"
          rec={rec}
          subject={focus.level === 1 ? `${getEntity(focus.parentId!).short} · ${focus.name}` : focus.name}
          onAction={onAction}
          cta={
            focus.level < 2
              ? { label: `Profundizar en ${focus.short}`, onClick: () => onDrill(focus) }
              : { label: "Ver predicción de salida", onClick: () => onDrill(focus), icon: <BrainCircuit className="h-5 w-5" /> }
          }
        />
      </div>

      {/* Tabla del nivel */}
      <Panel className="overflow-hidden">
        <PanelHeader title={`Todas las ${PLURAL[level]}`} subtitle="Clima del período anterior (P1) al actual (P2)" />
        <div className="-mx-6 overflow-x-auto md:-mx-8">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-[16px]">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[34%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[4%]" />
            </colgroup>
            <thead>
              <tr className="text-left text-[14px] text-muted-foreground">
                <th className="py-3 pl-6 font-medium md:pl-8">{NOUN[level].charAt(0).toUpperCase() + NOUN[level].slice(1)}</th>
                <th className="py-3 font-medium">Clima P1 → P2</th>
                <th className="py-3 text-right font-medium">Cambio</th>
                <th className="py-3 text-right font-medium">{level === 2 ? "Riesgo" : "Prod."}</th>
                <th className="py-3 pl-6 font-medium">Estado</th>
                <th className="py-3 pr-6 md:pr-8" />
              </tr>
            </thead>
            <tbody>
              {[...items].sort((a, b) => a.clima - b.clima).map((e) => {
                const d = deltaPct(e.clima, e.climaPrev);
                const focused = e.id === focus.id;
                return (
                  <tr
                    key={e.id}
                    onClick={() => onFocus(e.id)}
                    className={cn("cursor-pointer transition-colors [&>td]:border-t [&>td]:border-black/[0.05]", focused ? "bg-mint/50" : "hover:bg-secondary/70")}
                  >
                    <td className="py-4 pl-6 md:pl-8">
                      <span className="flex items-center gap-3">
                        {e.level === 2 && e.employee && <Avatar initials={e.employee.initials} seed={e.name.length} size={36} />}
                        <span className="truncate font-semibold text-ink">{e.name}</span>
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="flex items-center gap-3 tabular">
                        <Dumbbell from={e.climaPrev} to={e.clima} status={e.status} min={20} width={200} />
                        <span className="text-[15px] text-muted-foreground">{fmt(e.climaPrev)} → <b className="font-semibold text-ink">{fmt(e.clima)}</b></span>
                      </span>
                    </td>
                    <td className={cn("py-4 text-right font-semibold tabular", d < 0 ? "text-crit-ink" : "text-ok-ink")}>{fmtPct(d)}</td>
                    <td className="py-4 text-right tabular text-ink">{level === 2 && e.employee ? `${fmt(e.employee.risk)} %` : `${fmt(e.prod)} %`}</td>
                    <td className="py-4 pl-6">
                      <StatusBadge status={e.status} size="sm" variant={level === 2 ? "risk" : "status"} />
                    </td>
                    <td className="py-4 pr-6 text-right md:pr-8">
                      <button
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); onDrill(e); }}
                        className="press grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-card hover:bg-field hover:text-white cursor-pointer"
                        aria-label={level === 2 ? `Ver predicción de ${e.name}` : `Profundizar en ${e.name}`}
                      >
                        {level === 2 ? <BrainCircuit className="h-[18px] w-[18px]" /> : <ChevronRight className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, unit, delta, good, divider, children }: { label: string; value: string; unit?: string; delta?: string; good?: boolean; divider?: boolean; children?: ReactNode }) {
  return (
    <div className={cn("sm:px-8 sm:first:pl-0", divider && "sm:border-l")}>
      <p className="text-[15px] text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="text-[clamp(44px,3.8vw,60px)] leading-none font-semibold tracking-[-0.05em] text-ink">{value}</span>
        {unit && <span className="text-[18px] font-semibold text-muted-foreground">{unit}</span>}
        {delta && (
          <span className={cn("rounded-full px-2.5 py-1 text-[14px] font-semibold", good ? "bg-ok-soft text-ok-ink" : "bg-crit-soft text-crit-ink")}>{delta}</span>
        )}
        {children}
      </div>
    </div>
  );
}
