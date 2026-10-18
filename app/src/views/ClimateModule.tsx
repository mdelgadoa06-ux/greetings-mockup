import { useMemo, useState } from "react";
import { BrainCircuit, Building2, ChevronRight, Layers, UserRound } from "lucide-react";
import { LevelSteps } from "@/components/ui/steps";
import Dashboard from "@/components/ui/dashboard-4";
import { ModuleHeader, NextStep, Segmented } from "@/components/kit";
import { useToast } from "@/components/overlays";
import { COMPANY, type Entity, type Level, type Period, childrenOf, getEntity } from "@/data/mock";
import { transition } from "@/lib/transition";
import type { Nav } from "@/App";
import { cn } from "@/lib/utils";

export type ClimatePath = { parentId: string; level: Level; focusId: string };

const SEVERITY = { crit: 0, warn: 1, ok: 2 } as const;
const worstOf = (items: Entity[]) => [...items].sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.clima - b.clima)[0];

/** Módulo 2 · Clima y productividad: niveles sede → departamento → empleado, cuadrante y qué hacer. */
export function ClimateModule({ nav, path, onPath }: { nav: Nav; path: ClimatePath; onPath: (p: ClimatePath) => void }) {
  const [period, setPeriod] = useState<Period>("p2");
  const toast = useToast();

  const context = path.parentId === "all" ? COMPANY : getEntity(path.parentId);
  const items = useMemo(() => childrenOf(path.parentId), [path.parentId]);
  const focus = items.find((i) => i.id === path.focusId) ?? worstOf(items);

  const sede = path.level >= 1 ? getEntity(path.level === 1 ? path.parentId : getEntity(path.parentId).parentId!) : undefined;
  const dept = path.level === 2 ? getEntity(path.parentId) : undefined;

  const drill = (e: Entity) => {
    if (e.level === 2) return nav.openPrediction(e.id);
    const kids = childrenOf(e.id);
    transition(() => onPath({ parentId: e.id, level: (e.level + 1) as Level, focusId: worstOf(kids).id }), "drill-in");
  };
  const up = (target: Level) => {
    if (target >= path.level) return;
    const next: ClimatePath =
      target === 0 ? { parentId: "all", level: 0, focusId: sede!.id } : { parentId: sede!.id, level: 1, focusId: dept!.id };
    transition(() => onPath(next), "drill-out");
  };
  const onStep = (s: number) => (s > path.level ? drill(focus) : up(s as Level));

  const steps = [
    { icon: Building2, label: "Sede", hint: sede ? sede.name : "4 sedes" },
    { icon: Layers, label: "Departamento", hint: dept ? dept.name : path.level === 1 ? `${items.length} equipos` : `Entrar a ${focus.short}` },
    { icon: UserRound, label: "Empleado", hint: path.level === 2 ? `${items.length} personas` : path.level === 1 ? `Entrar a ${focus.short}` : "—" },
  ];
  const crumbs = [
    { id: "all", label: "Todas las sedes" },
    ...(sede ? [{ id: sede.id, label: sede.name }] : []),
    ...(dept ? [{ id: dept.id, label: dept.name }] : []),
  ];

  return (
    <div className="stagger space-y-8">
      <ModuleHeader
        index="02"
        title="Clima y productividad"
        subtitle="Cómo está tu equipo hoy y qué hacer esta semana."
        right={
          <Segmented
            ariaLabel="Período"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "p1", label: "Período anterior" },
              { value: "p2", label: "Últimas 6 semanas" },
            ]}
          />
        }
      />

      {/* Jerarquía persistente: sede → departamento → empleado */}
      <div className="card flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between md:px-8">
        <div className="-mx-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] lg:flex-1">
          <LevelSteps steps={steps} step={path.level} onStepChange={onStep} maxReachable={Math.min(2, path.level + 1)} className="min-w-[600px] lg:max-w-[720px]" />
        </div>
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1 text-[15px]">
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <button
                type="button"
                disabled={i === crumbs.length - 1}
                onClick={() => up(i as Level)}
                className={cn("rounded-full px-3.5 py-1.5 font-semibold", i === crumbs.length - 1 ? "bg-field text-white" : "text-muted-foreground hover:bg-secondary hover:text-ink cursor-pointer")}
              >
                {c.label}
              </button>
            </span>
          ))}
        </nav>
      </div>

      <div style={{ viewTransitionName: "vt-drill" }}>
        <Dashboard
          context={context}
          items={items}
          focus={focus}
          period={period}
          onFocus={(id) => onPath({ ...path, focusId: id })}
          onDrill={drill}
          onAction={(a) => toast("Agregado al plan de acción", `${a} · ${focus.name}`)}
        />
      </div>

      <NextStep eyebrow="Siguiente · largo plazo" title="¿Quién se podría ir? Ver el modelo predictivo" icon={BrainCircuit} onClick={() => nav.go("predict")} />
    </div>
  );
}
