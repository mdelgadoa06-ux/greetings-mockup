import { useState } from "react";
import { fmt } from "@/data/mock";
import { useWidth } from "@/lib/hooks";

export type TrendSeries = { id: string; label: string; values: number[]; color: string; emphasis?: boolean };

const PAD = { l: 34, r: 44, t: 22, b: 26 };

/**
 * Línea de tendencia semanal con una sola escala (nunca doble eje: clima y productividad
 * van en gráficas separadas, como pequeños múltiplos). Crosshair + tooltip al pasar el cursor.
 */
export function TrendChart({
  weeks, series, domain, reference, unit = "", height = 168, split = 6,
}: {
  weeks: string[];
  series: TrendSeries[];
  domain: [number, number];
  reference?: { value: number; label: string };
  unit?: string;
  height?: number;
  split?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(420);
  const [idx, setIdx] = useState<number | null>(null);
  const iw = Math.max(120, width - PAD.l - PAD.r);
  const ih = height - PAD.t - PAD.b;
  const n = weeks.length;
  const sx = (i: number) => PAD.l + (i / (n - 1)) * iw;
  const sy = (v: number) => PAD.t + (1 - (v - domain[0]) / (domain[1] - domain[0])) * ih;
  const ticks = [domain[0], (domain[0] + domain[1]) / 2, domain[1]];
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join("");
  const focus = series.find((s) => s.emphasis) ?? series[0];
  const splitX = (sx(split - 1) + sx(split)) / 2;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - PAD.l) / iw) * (n - 1));
    setIdx(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} onPointerMove={onMove} onPointerLeave={() => setIdx(null)} role="img" aria-label={`Tendencia semanal de ${focus.label}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={PAD.l + iw} y1={sy(t)} y2={sy(t)} stroke="#ebedeb" strokeWidth={1} />
            <text x={PAD.l - 8} y={sy(t) + 4} textAnchor="end" className="fill-[#898781] text-[10.5px] tabular">{fmt(t)}</text>
          </g>
        ))}
        {reference && (
          <g>
            <line x1={PAD.l} x2={PAD.l + iw} y1={sy(reference.value)} y2={sy(reference.value)} stroke="#166534" strokeOpacity={0.35} strokeWidth={1} />
            <text x={PAD.l + 4} y={sy(reference.value) - 5} className="fill-[#166534] text-[10.5px] font-semibold">{reference.label}</text>
          </g>
        )}
        {/* división de períodos */}
        <line x1={splitX} x2={splitX} y1={PAD.t - 8} y2={PAD.t + ih} stroke="#dfe3df" strokeWidth={1} />
        <text x={splitX - 6} y={PAD.t - 10} textAnchor="end" className="fill-[#898781] text-[10px] font-semibold tracking-wide">P1</text>
        <text x={splitX + 6} y={PAD.t - 10} className="fill-[#898781] text-[10px] font-semibold tracking-wide">P2</text>

        <path d={`${path(focus.values)}L${sx(n - 1)} ${PAD.t + ih}L${sx(0)} ${PAD.t + ih}Z`} fill={focus.color} opacity={0.08} />
        {series.map((s) => (
          <path key={s.id} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="transition-[d] duration-700" />
        ))}
        {/* etiqueta directa sólo en el extremo de la serie protagonista */}
        <circle cx={sx(n - 1)} cy={sy(focus.values[n - 1])} r={4.5} fill={focus.color} stroke="#fff" strokeWidth={2} />
        <text x={sx(n - 1) + 9} y={sy(focus.values[n - 1]) + 4} className="fill-[#0c1212] text-[12px] font-semibold tabular">{fmt(focus.values[n - 1])}{unit}</text>

        {[0, Math.floor((n - 1) / 2), n - 1].map((i) => (
          <text key={i} x={sx(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-[#898781] text-[10.5px]">{weeks[i]}</text>
        ))}

        {idx !== null && (
          <g pointerEvents="none">
            <line x1={sx(idx)} x2={sx(idx)} y1={PAD.t} y2={PAD.t + ih} stroke="#0c1212" strokeOpacity={0.18} strokeWidth={1} />
            {series.map((s) => (
              <circle key={s.id} cx={sx(idx)} cy={sy(s.values[idx])} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {idx !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-40 -translate-x-1/2 rounded-xl bg-white/95 px-3 py-2 text-[12px] shadow-float backdrop-blur"
          style={{ left: Math.min(width - 84, Math.max(84, sx(idx))) }}
        >
          <div className="mb-1 font-semibold text-ink">Semana del {weeks[idx]}</div>
          {series.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} /> {s.label}
              </span>
              <span className="font-semibold tabular text-ink">{fmt(s.values[idx], 1)}{unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrendLegend({ series }: { series: TrendSeries[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((s) => (
        <span key={s.id} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="h-[3px] w-4 rounded-full" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
