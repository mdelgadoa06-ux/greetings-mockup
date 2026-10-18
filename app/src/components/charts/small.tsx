import { STATUS_META } from "@/components/kit";
import { type Status, fmt } from "@/data/mock";
import { useAnimatedNumber } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const STATUS_HEX: Record<Status, string> = { ok: "#0ca30c", warn: "#eda100", crit: "#d03b3b" };
const STATUS_TRACK: Record<Status, string> = { ok: "#dcfce7", warn: "#fef3c7", crit: "#fee2e2" };
export const statusHex = (s: Status) => STATUS_HEX[s];

/* ---------- Sparkline (tendencia de 12 puntos, tono de bajo énfasis + punto actual en acento) ---------- */
export function Sparkline({ values, width = 120, height = 36, color = "#166534", className }: { values: number[]; width?: number; height?: number; color?: string; className?: string }) {
  // Rango mínimo de 12 puntos: evita que el ruido semanal parezca una caída dramática.
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = Math.max(12, hi - lo);
  const min = (lo + hi) / 2 - span / 2;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 8) + 4, height - 4 - ((v - min) / span) * (height - 8)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={`${d}L${last[0]} ${height}L4 ${height}Z`} fill={color} opacity={0.1} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={4} fill={color} stroke="#fff" strokeWidth={2} />
    </svg>
  );
}

/* ---------- Dumbbell P1 → P2 (en tabla) ---------- */
export function Dumbbell({ from, to, status, min = 30, max = 100, width = 132 }: { from: number; to: number; status: Status; min?: number; max?: number; width?: number }) {
  const x = (v: number) => 6 + ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (width - 12);
  const a = x(from), b = x(to);
  return (
    <svg width={width} height={20} viewBox={`0 0 ${width} 20`} aria-label={`De ${fmt(from)} a ${fmt(to)}`}>
      <line x1={6} x2={width - 6} y1={10} y2={10} stroke="#eef0ee" strokeWidth={2} strokeLinecap="round" />
      <line x1={a} x2={b} y1={10} y2={10} stroke="#c9cec9" strokeWidth={2} strokeLinecap="round" />
      <circle cx={a} cy={10} r={4} fill="#87918b" stroke="#fff" strokeWidth={2} />
      <circle cx={b} cy={10} r={5.5} fill={STATUS_HEX[status]} stroke="#fff" strokeWidth={2} />
    </svg>
  );
}

/* ---------- Medidor: el relleno carga la severidad, la pista es el mismo tono más claro ---------- */
export function Meter({ value, status, className }: { value: number; status: Status; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full", className)} style={{ background: STATUS_TRACK[status] }}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-ios" style={{ width: `${Math.max(4, Math.min(100, value))}%`, background: STATUS_HEX[status] }} />
    </div>
  );
}

/* ---------- Barra apilada con separación de 2 px (distribución de riesgo) ---------- */
export function StackedBar({ parts, height = 10, className, showLabels = true, dark = false }: { parts: { status: Status; value: number; label: string }[]; height?: number; className?: string; showLabels?: boolean; dark?: boolean }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div className={className}>
      <div className="flex w-full gap-[2px]" style={{ height }}>
        {parts.map((p, i) => (
          <div
            key={p.status}
            title={`${p.label}: ${p.value}`}
            className={cn("h-full transition-[flex-grow] duration-700 ease-ios", i === 0 && "rounded-l-full", i === parts.length - 1 && "rounded-r-full")}
            style={{ flexGrow: p.value / total, flexBasis: 0, background: STATUS_HEX[p.status] }}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {parts.map((p) => {
            const Icon = STATUS_META[p.status].icon;
            return (
              <span key={p.status} className={cn("inline-flex items-center gap-1.5 text-[12px]", dark ? "text-white/80" : "text-muted-foreground")}>
                <Icon className="h-3.5 w-3.5" style={{ color: STATUS_HEX[p.status] }} strokeWidth={2.4} />
                <span className={cn("font-semibold tabular", dark ? "text-white" : "text-ink")}>{p.value}</span> {p.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Barras horizontales de una sola serie (participación por sede) ---------- */
export function HBars({ rows, max = 100, unit = "%" }: { rows: { label: string; value: number }[]; max?: number; unit?: string }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[84px_1fr_48px] items-center gap-3">
          <span className="truncate text-[13px] text-muted-foreground">{r.label}</span>
          <div className="h-2.5 rounded-full bg-[#eef1ee]">
            <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-ios" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="text-right text-[13px] font-semibold tabular text-ink">{fmt(r.value)}{unit}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Anillo de probabilidad de salida (cifra protagonista de la vista) ---------- */
export function RiskRing({ value, baseline, status, size = 208, stroke = 16, label = "Probabilidad de salida", sub = "próximos 90 días" }: { value: number; baseline?: number; status: Status; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = useAnimatedNumber(value, 900);
  const off = (v: number) => c * (1 - Math.max(0, Math.min(100, v)) / 100);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={STATUS_TRACK[status]} strokeWidth={stroke} />
        {baseline !== undefined && baseline > value && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d03b3b" strokeOpacity={0.18} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off(baseline)} />
        )}
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={STATUS_HEX[status]} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off(shown)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[64px] leading-none font-semibold tracking-[-0.05em] text-ink">
            {Math.round(shown)}<span className="text-[26px] tracking-normal text-muted-foreground"> %</span>
          </div>
          <div className="mt-2 text-[15px] font-medium text-ink">{label}</div>
          <div className="text-[14px] text-muted-foreground">{sub}</div>
        </div>
      </div>
    </div>
  );
}
