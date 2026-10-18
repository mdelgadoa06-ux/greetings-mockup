import { useState } from "react";
import { LineChart } from "lucide-react";
import { ModuleHeader, NextStep, Panel, PanelHeader } from "@/components/kit";
import { PhoneMock } from "@/components/PhoneMock";
import { useToast } from "@/components/overlays";
import { EMPLOYEES, PULSE_TODAY, SOURCES, fmt } from "@/data/mock";
import type { Nav } from "@/App";

/** Módulo 1 · Carga de datos: de dónde sale todo (diagrama) y cómo se toma el pulso (WhatsApp). */
export function DataModule({ nav }: { nav: Nav }) {
  const [answered, setAnswered] = useState(PULSE_TODAY.answered);
  const toast = useToast();
  const records = SOURCES.reduce((a, s) => a + s.records, 0);

  return (
    <div className="stagger space-y-8">
      <ModuleHeader index="01" title="Carga de datos" subtitle="POS, turnos, colaboradores y pulsos por WhatsApp, cruzados en un solo lugar." />

      <div className="grid gap-8 lg:grid-cols-12">
        <Panel className="flex flex-col lg:col-span-7">
          <PanelHeader title="4 fuentes, un solo lugar" subtitle="Se sincronizan solas · sin cargar archivos" />
          <div className="flex flex-1 items-center py-4">
            <IntegrationHub />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-6 border-t pt-7">
            <Figure value={fmt(records)} label="registros unificados" />
            <Figure value={String(EMPLOYEES.length)} label="personas con perfil" />
            <Figure value={`${answered}/${PULSE_TODAY.sent}`} label="pulsos respondidos hoy" />
          </div>
        </Panel>

        <Panel className="flex flex-col items-center lg:col-span-5">
          <PanelHeader className="w-full" title="Pulso por WhatsApp" subtitle="3 preguntas · 30 segundos · anónimo" />
          <div className="flex flex-1 items-center pb-12">
            <PhoneMock
              onComplete={() => {
                setAnswered((n) => Math.min(PULSE_TODAY.sent, n + 1));
                toast("Nuevo pulso recibido", "Sede Norte · anónimo");
              }}
            />
          </div>
        </Panel>
      </div>

      <NextStep eyebrow="Datos listos" title="Ver clima y productividad" icon={LineChart} onClick={() => nav.go("climate")} />
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-[clamp(30px,2.6vw,42px)] leading-none font-semibold tracking-[-0.045em] text-ink">{value}</p>
      <p className="mt-2 text-[15px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* Diagrama: 4 fuentes → Greetings → datos listos */
function IntegrationHub() {
  const inputs = ["POS", "Turnos", "Colaboradores", "WhatsApp"];
  const ys = [34, 98, 162, 226];
  return (
    <svg viewBox="0 0 520 260" className="h-auto w-full" role="img" aria-label="Cuatro fuentes de datos fluyen hacia Greetings y salen como datos listos">
      {inputs.map((label, i) => (
        <g key={label}>
          <rect x={0} y={ys[i] - 21} width={168} height={42} rx={21} fill="#f2f4f2" />
          <circle cx={22} cy={ys[i]} r={5} fill="#0ca30c" />
          <text x={38} y={ys[i] + 5.5} className="fill-[#0c1212] text-[16px] font-semibold">{label}</text>
          <path d={`M168 ${ys[i]} C 225 ${ys[i]}, 215 130, 262 130`} fill="none" stroke="#e3e8e3" strokeWidth={2.5} />
          <path d={`M168 ${ys[i]} C 225 ${ys[i]}, 215 130, 262 130`} fill="none" stroke="#166534" strokeWidth={2.5} strokeDasharray="5 10" strokeLinecap="round" className="animate-flow" style={{ animationDelay: `${i * 0.2}s` }} />
        </g>
      ))}
      <circle cx={296} cy={130} r={44} fill="#dcfce7" className="origin-[296px_130px] animate-[pulse-ring_2.4s_ease-in-out_infinite]" />
      <circle cx={296} cy={130} r={34} fill="#0b3b2a" />
      <text x={296} y={139} textAnchor="middle" className="fill-white text-[25px] font-bold" style={{ letterSpacing: "-0.06em" }}>g.</text>
      <path d="M332 130 H 366" stroke="#166534" strokeWidth={2.5} strokeDasharray="5 10" strokeLinecap="round" className="animate-flow" />
      <rect x={366} y={92} width={154} height={76} rx={24} fill="#0b3b2a" />
      <text x={443} y={124} textAnchor="middle" className="fill-white text-[16px] font-semibold">Datos listos</text>
      <text x={443} y={146} textAnchor="middle" fill="rgba(255,255,255,.7)" className="text-[13.5px]">clima · KPI · riesgo</text>
      <style>{`@keyframes pulse-ring{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.6}}`}</style>
    </svg>
  );
}
