import { useState } from "react";
import { CalendarCheck, Home, Info } from "lucide-react";
import { Stats2 } from "@/components/ui/stats-2";
import { AIRecommendation } from "@/components/AIRecommendation";
import { Avatar, ModuleHeader, NextStep, Panel, PanelHeader, STATUS_META, StatusBadge, Switch } from "@/components/kit";
import { Meter, RiskRing, statusHex } from "@/components/charts/small";
import { Sheet, useToast } from "@/components/overlays";
import { WHAT_IFS, recommend, simulateRisk } from "@/data/ai";
import {
  AVOIDABLE_COST_90D, EMPLOYEES, EXPECTED_COST_90D, EXPECTED_EXITS_90D, RISK_BUCKETS, RISK_HIGH,
  type Employee, type Status, deptName, fmt, fmtPct, getEntity, money, riskStatus, sedeName,
} from "@/data/mock";
import type { Nav } from "@/App";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<Status, string> = { ok: "Bajo", warn: "Medio", crit: "Alto" };
const SEVERITY = { crit: 0, warn: 1, ok: 2 } as const;
const RANKED = [...EMPLOYEES].sort((a, b) => b.risk - a.risk);
/** "María Fernanda López" → "María López": cabe completo en el ranking. */
const shortName = (n: string) => { const p = n.split(" "); return p.length > 2 ? `${p[0]} ${p[p.length - 1]}` : n; };

/** Módulo 3 · Modelo predictivo: quién se podría ir, por qué y qué pasa si actúas. */
export function PredictiveModule({ nav, selectedId, onSelect }: { nav: Nav; selectedId: string; onSelect: (id: string) => void }) {
  const [howOpen, setHowOpen] = useState(false);
  const toast = useToast();
  const emp = EMPLOYEES.find((e) => e.id === selectedId) ?? RANKED[0];

  return (
    <div className="stagger space-y-8">
      <ModuleHeader
        index="03"
        title="Modelo predictivo"
        subtitle="Quién se podría ir en los próximos 90 días, por qué y qué hacer."
        right={
          <button type="button" onClick={() => setHowOpen(true)} className="press inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-ink shadow-card hover:bg-mint cursor-pointer">
            <Info className="h-[18px] w-[18px]" /> ¿Cómo funciona?
          </button>
        }
      />

      <Stats2
        items={[
          { eyebrow: "Personas en riesgo alto", value: RISK_BUCKETS.crit, caption: `de ${EMPLOYEES.length} · próximos 90 días`, tone: "critical" },
          { eyebrow: "Salidas esperadas en 90 días", value: fmt(EXPECTED_EXITS_90D, 0), caption: `≈ ${money(EXPECTED_COST_90D)} COP en costos ocultos` },
          { eyebrow: "Costo evitable si actúas hoy", value: money(AVOIDABLE_COST_90D), caption: "COP que puedes ahorrar", tone: "brand" },
        ]}
      />

      <div className="grid gap-8 xl:grid-cols-12">
        <RiskRanking selectedId={emp.id} onSelect={onSelect} />
        <div className="min-w-0 space-y-8 xl:col-span-8">
          <EmployeeDetail key={emp.id} emp={emp} onToast={toast} />
        </div>
      </div>

      <NextStep eyebrow="Fin del recorrido" title="Volver al inicio" icon={Home} onClick={() => nav.go("hero")} />

      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title="¿Cómo funciona el modelo?" subtitle="Sin tecnicismos: lo que necesitas saber para confiar en el número.">
        <HowItWorksDetail />
      </Sheet>
    </div>
  );
}

/* ---------- Ranking de riesgo ---------- */
function RiskRanking({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <Panel className="flex min-w-0 flex-col p-0 md:p-0 xl:sticky xl:top-24 xl:col-span-4 xl:max-h-[calc(100svh-7.5rem)] xl:self-start">
      <div className="px-6 pt-6 md:px-8 md:pt-8">
        <PanelHeader title="Ranking de riesgo" subtitle="De mayor a menor" className="mb-4" />
      </div>
      <ul className="scroll-area max-h-[520px] min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4 xl:max-h-none">
        {RANKED.map((e, i) => {
          const s = riskStatus(e.risk);
          const active = e.id === selectedId;
          const Icon = STATUS_META[s].icon;
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onSelect(e.id)}
                className={cn("flex w-full items-center gap-3.5 rounded-[20px] px-3.5 py-3 text-left transition-colors cursor-pointer", active ? "bg-field text-white" : "hover:bg-secondary")}
              >
                <span className={cn("w-6 text-right font-mono text-[13px]", active ? "text-white/60" : "text-muted-foreground")}>{i + 1}</span>
                <Avatar initials={e.initials} seed={e.name.length} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold" title={e.name}>{shortName(e.name)}</span>
                  <span className={cn("block truncate text-[14px]", active ? "text-white/65" : "text-muted-foreground")}>
                    {sedeName(e.sedeId).replace("Sede ", "")} · {deptName(e.deptId)}
                  </span>
                </span>
                <span className="w-[72px] shrink-0">
                  <span className="flex items-center justify-end gap-1 text-[16px] font-semibold tabular">
                    <Icon className="h-4 w-4" style={{ color: active ? "#fff" : statusHex(s) }} strokeWidth={2.4} />
                    {fmt(e.risk)} %
                  </span>
                  <Meter value={e.risk} status={s} className="mt-1.5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ---------- Ficha de la persona ---------- */
function factorsOf(e: Employee) {
  return [
    { label: "Ánimo en pulsos", value: fmt(e.clima), unit: "/100", status: (e.clima < 50 ? "crit" : e.clima < 65 ? "warn" : "ok") as Status, meter: 100 - e.clima,
      desc: e.clima < e.climaPrev - 5 ? `Bajó de ${fmt(e.climaPrev)} a ${fmt(e.clima)}` : "Estable" },
    { label: "Turnos dobles", value: String(e.doubleShifts), unit: "este mes", status: (e.doubleShifts >= 8 ? "crit" : e.doubleShifts >= 4 ? "warn" : "ok") as Status, meter: (e.doubleShifts / 14) * 100,
      desc: e.doubleShifts >= 8 ? "Carga muy por encima de lo normal" : "Carga normal" },
    { label: "Vacantes en su zona", value: String(e.vacancies), unit: "a < 3 km", status: (e.vacancies >= 25 ? "crit" : e.vacancies >= 15 ? "warn" : "ok") as Status, meter: (e.vacancies / 40) * 100,
      desc: `Código postal ${e.zip}` },
    { label: "Rendimiento", value: fmt(e.prod), unit: "% meta", status: (e.prodTrend <= -20 ? "crit" : e.prodTrend <= -8 ? "warn" : "ok") as Status, meter: Math.min(100, Math.max(5, -e.prodTrend * 4)),
      desc: `${fmtPct(e.prodTrend)} en 3 meses` },
    { label: "Antigüedad", value: fmt(e.tenure, 1), unit: "años", status: (e.tenure < 1 ? "crit" : e.tenure < 2.5 ? "warn" : "ok") as Status, meter: Math.max(8, 100 - (e.tenure / 5) * 100),
      desc: e.tenure < 2.5 ? "La etapa con más salidas" : "Permanencia alta" },
    { label: "Asistencia", value: fmt(e.attendance), unit: "%", status: (e.attendance < 88 ? "crit" : e.attendance < 93 ? "warn" : "ok") as Status, meter: Math.max(6, (100 - e.attendance) * 6),
      desc: e.attendance >= 93 ? "Buena asistencia" : "Más ausencias de lo normal" },
  ];
}

function EmployeeDetail({ emp, onToast }: { emp: Employee; onToast: (t: string, d?: string) => void }) {
  const [active, setActive] = useState<string[]>([]);
  const shown = active.length ? simulateRisk(emp, active) : emp.risk;
  const status = riskStatus(shown);
  const rec = recommend(getEntity(emp.id));
  const first = emp.name.split(" ")[0];
  // Los 4 factores que más pesan: primero los de nivel alto.
  const factors = factorsOf(emp).sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || b.meter - a.meter).slice(0, 4);
  const book = () => onToast("1:1 agendado", `${first} · jueves 10:00 a. m. · con líder de sede`);

  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials={emp.initials} seed={emp.name.length} size={64} />
            <div>
              <h2 className="text-[clamp(26px,2.2vw,34px)] leading-tight font-semibold tracking-[-0.035em] text-ink">{emp.name}</h2>
              <p className="mt-0.5 text-[16px] text-muted-foreground">
                {emp.role} · {sedeName(emp.sedeId)} · {fmt(emp.tenure, 1)} años
              </p>
            </div>
          </div>
          <StatusBadge status={riskStatus(emp.risk)} variant="risk" className="px-4 py-1.5 text-[15px]" />
        </div>
        <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <RiskRing value={shown} baseline={active.length ? emp.risk : undefined} status={status} size={250} stroke={18} />
          </div>
          <AIRecommendation
            rec={rec}
            subject={first}
            compact
            className="border-0 bg-secondary/60 shadow-none ring-0"
            onAction={(a) => (a === "Agendar 1:1" ? book() : onToast("Acción agregada al plan", `${a} · ${first}`))}
            cta={{ label: "Agendar 1:1", icon: <CalendarCheck className="h-5 w-5" />, onClick: book }}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Por qué" subtitle={`Las 4 señales que más pesan en el riesgo de ${first}`} />
        <div className="grid gap-4 sm:grid-cols-2">
          {factors.map((f) => (
            <div key={f.label} className="rounded-[24px] bg-secondary/60 p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[16px] font-medium text-muted-foreground">{f.label}</p>
                <StatusBadge status={f.status} size="sm" label={LEVEL_LABEL[f.status]} />
              </div>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-[44px] leading-none font-semibold tracking-[-0.05em] text-ink">{f.value}</span>
                <span className="text-[16px] font-semibold text-muted-foreground">{f.unit}</span>
              </p>
              <Meter value={f.meter} status={f.status} className="mt-4 h-2" />
              <p className="mt-3 text-[15px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="¿Y si actúas?" subtitle="Activa acciones y mira cómo baja la probabilidad" />
        <div className="grid gap-3 sm:grid-cols-2">
          {WHAT_IFS.map((w) => {
            const on = active.includes(w.id);
            return (
              <label key={w.id} className={cn("flex cursor-pointer items-center justify-between gap-4 rounded-[22px] p-5 transition-colors", on ? "bg-mint/70" : "bg-secondary/60 hover:bg-secondary")}>
                <span className="min-w-0">
                  <span className="block text-[16px] font-semibold text-ink">{w.label}</span>
                  <span className="mt-0.5 block text-[14px] text-muted-foreground">{w.detail}</span>
                </span>
                <Switch checked={on} onChange={(v) => setActive((a) => (v ? [...a, w.id] : a.filter((x) => x !== w.id)))} label={w.label} />
              </label>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-field px-7 py-6 text-white">
          <div>
            <p className="text-[15px] text-white/65">Probabilidad de salida</p>
            <p className="mt-1 text-[clamp(32px,3vw,44px)] leading-none font-semibold tracking-[-0.04em] tabular">
              {fmt(emp.risk)} % <span className="text-white/45">→</span> {fmt(shown)} %
            </p>
            <p className="mt-2 text-[15px] text-white/65">{active.length ? `${STATUS_META[status].risk} con ${active.length} acción${active.length > 1 ? "es" : ""}` : "Activa una o más acciones"}</p>
          </div>
          <button
            type="button"
            disabled={!active.length}
            onClick={() => onToast("Plan de retención creado", `${first} · ${active.length} acciones · seguimiento en 2 semanas`)}
            className="press rounded-full bg-white px-6 py-3.5 text-[16px] font-semibold text-field disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Crear plan para {first}
          </button>
        </div>
      </Panel>
    </>
  );
}

function HowItWorksDetail() {
  const rows = [
    ["Qué predice", "La probabilidad de que una persona deje la empresa en los próximos 90 días."],
    ["Con qué aprende", "Historia de POS, turnos, pulsos y salidas. Arranca con un modelo base del sector y se ajusta a tu empresa con tus propios datos."],
    ["Modelo", "Random Forest (500 árboles de decisión). Cada árbol vota y el porcentaje es la proporción de votos por “se va”."],
    ["Variables externas", "Vacantes similares por código postal, salario de mercado del cargo, distancia casa – trabajo y temporada."],
    ["Qué tan bien acierta", "En validación con salidas pasadas identifica 8 de cada 10 renuncias con 60 días de anticipación (AUC 0,86 · demo)."],
    ["Semáforo", `Alto ≥ ${RISK_HIGH} % · Medio 30–${RISK_HIGH - 1} % · Bajo < 30 %.`],
    ["Privacidad", "Los pulsos son anónimos por debajo de 4 personas; el riesgo individual sólo lo ve el administrador."],
  ];
  return (
    <dl className="space-y-3">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-2xl bg-secondary/70 p-4">
          <dt className="text-[13px] font-semibold text-muted-foreground">{k}</dt>
          <dd className="mt-1 text-[15px] leading-relaxed text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
