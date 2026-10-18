import { useMemo, useState } from "react";
import { STATUS_META, StatusBadge } from "@/components/kit";
import { CLIMA_CUT, PROD_CUT, QUADRANTS, quadrantOf, type Quadrant } from "@/data/ai";
import { type Entity, type Period, fmt } from "@/data/mock";
import { textWidth, useSize } from "@/lib/hooks";
import { statusHex } from "./small";

const PAD = { l: 72, r: 18, t: 18, b: 50 };
const TINT: Record<Quadrant, string> = {
  engaged: "#f2f8f3",
  burnout: "#fdf4f3",
  comfortable: "#fbf8ee",
  disconnected: "#f5f5f6",
};
type Box = { x0: number; y0: number; x1: number; y1: number };
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/**
 * Cuadrante clima × productividad. Cada punto es una sede, departamento o persona
 * (según el nivel). El color es el semáforo; el ícono y la etiqueta lo acompañan en leyenda y tooltip.
 * Llena la altura de su tarjeta y coloca las etiquetas evitando choques.
 */
export function QuadrantChart({ items, period, focusId, onFocus }: { items: Entity[]; period: Period; focusId?: string; onFocus: (id: string) => void }) {
  const [ref, size] = useSize<HTMLDivElement>({ w: 640, h: 360 });
  const [hover, setHover] = useState<string | null>(null);
  const width = size.w;
  const H = Math.max(380, size.h);

  const pts = items.map((e) => ({ e, clima: period === "p2" ? e.clima : e.climaPrev, prod: period === "p2" ? e.prod : e.prodPrev }));
  const dom = useMemo(() => {
    const all = items.flatMap((e) => [e.clima, e.climaPrev]);
    const allP = items.flatMap((e) => [e.prod, e.prodPrev]);
    return {
      x0: Math.min(40, Math.floor((Math.min(...all) - 6) / 10) * 10), x1: 100,
      y0: Math.min(80, Math.floor((Math.min(...allP) - 4) / 10) * 10), y1: Math.max(120, Math.ceil((Math.max(...allP) + 4) / 10) * 10),
    };
  }, [items]);

  const iw = Math.max(200, width - PAD.l - PAD.r);
  const ih = H - PAD.t - PAD.b;
  const sx = (v: number) => PAD.l + ((v - dom.x0) / (dom.x1 - dom.x0)) * iw;
  const sy = (v: number) => PAD.t + (1 - (v - dom.y0) / (dom.y1 - dom.y0)) * ih;
  const cx = sx(CLIMA_CUT), cy = sy(PROD_CUT);
  const xTicks = range(dom.x0, dom.x1, 10);
  const yTicks = range(dom.y0, dom.y1, 10).filter((t) => t !== PROD_CUT);
  const hovered = pts.find((p) => p.e.id === hover);

  const qLabels: { q: Quadrant; x: number; y: number; anchor: "start" | "end" }[] = [
    { q: "burnout", x: PAD.l + 18, y: PAD.t + 28, anchor: "start" },
    { q: "engaged", x: PAD.l + iw - 18, y: PAD.t + 28, anchor: "end" },
    { q: "disconnected", x: PAD.l + 18, y: PAD.t + ih - 30, anchor: "start" },
    { q: "comfortable", x: PAD.l + iw - 18, y: PAD.t + ih - 30, anchor: "end" },
  ];

  // Colocación de etiquetas: protagonista primero, luego críticos; prueba derecha, izquierda, arriba, abajo.
  const labels = useMemo(() => {
    const obstacles: Box[] = qLabels.map(({ q, x, y, anchor }) => {
      const w = Math.max(textWidth(QUADRANTS[q].label, '600 15px "Greetings Jakarta", Arial, sans-serif'), textWidth(QUADRANTS[q].hint, '400 13px "Greetings Jakarta", Arial, sans-serif'));
      return anchor === "start" ? { x0: x - 4, y0: y - 16, x1: x + w + 4, y1: y + 24 } : { x0: x - w - 4, y0: y - 16, x1: x + 4, y1: y + 24 };
    });
    const dots = pts.map(({ e, clima, prod }) => ({ id: e.id, b: { x0: sx(clima) - 10, y0: sy(prod) - 10, x1: sx(clima) + 10, y1: sy(prod) + 10 } }));
    const bounds: Box = { x0: PAD.l, y0: PAD.t, x1: PAD.l + iw, y1: PAD.t + ih };
    const order = [...pts].sort((a, b) => Number(b.e.id === focusId) - Number(a.e.id === focusId) || (a.e.status === "crit" ? -1 : 0) - (b.e.status === "crit" ? -1 : 0));
    const placed: Box[] = [];
    const out = new Map<string, { dx: number; dy: number; anchor: "start" | "end" | "middle" } | null>();
    const showAll = items.length <= 8;
    for (const { e, clima, prod } of order) {
      if (!(showAll || e.id === focusId || e.status === "crit")) { out.set(e.id, null); continue; }
      const x = sx(clima), y = sy(prod);
      const w = textWidth(e.short, '600 14px "Greetings Jakarta", Arial, sans-serif') + 2;
      const cands = [
        { dx: 16, dy: 5, anchor: "start" as const, b: { x0: x + 15, y0: y - 9, x1: x + 15 + w, y1: y + 8 } },
        { dx: -16, dy: 5, anchor: "end" as const, b: { x0: x - 15 - w, y0: y - 9, x1: x - 15, y1: y + 8 } },
        { dx: 0, dy: -17, anchor: "middle" as const, b: { x0: x - w / 2, y0: y - 31, x1: x + w / 2, y1: y - 13 } },
        { dx: 0, dy: 27, anchor: "middle" as const, b: { x0: x - w / 2, y0: y + 13, x1: x + w / 2, y1: y + 31 } },
        { dx: 13, dy: -11, anchor: "start" as const, b: { x0: x + 12, y0: y - 25, x1: x + 12 + w, y1: y - 7 } },
        { dx: 13, dy: 21, anchor: "start" as const, b: { x0: x + 12, y0: y + 7, x1: x + 12 + w, y1: y + 25 } },
      ];
      const ok = cands.find((c) =>
        c.b.x0 >= bounds.x0 - 4 && c.b.x1 <= bounds.x1 + 4 && c.b.y0 >= bounds.y0 - 4 && c.b.y1 <= bounds.y1 + 4 &&
        !placed.some((p) => hit(p, c.b)) && !obstacles.some((o) => hit(o, c.b)) && !dots.some((d) => d.id !== e.id && hit(d.b, c.b)),
      ) ?? cands.find((c) => !placed.some((p) => hit(p, c.b))) ?? cands[0];
      placed.push(ok.b);
      out.set(e.id, { dx: ok.dx, dy: ok.dy, anchor: ok.anchor });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, period, focusId, width, H]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={ref} className="relative min-h-[400px] flex-1 select-none">
        <svg className="absolute inset-0" width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label="Cuadrante de clima laboral contra productividad">
          {/* 4 baldosas separadas por un hueco de superficie: el hueco ES la línea de corte */}
          <rect x={PAD.l} y={PAD.t} width={cx - PAD.l - 2} height={cy - PAD.t - 2} fill={TINT.burnout} rx={16} />
          <rect x={cx + 2} y={PAD.t} width={PAD.l + iw - cx - 2} height={cy - PAD.t - 2} fill={TINT.engaged} rx={16} />
          <rect x={PAD.l} y={cy + 2} width={cx - PAD.l - 2} height={PAD.t + ih - cy - 2} fill={TINT.disconnected} rx={16} />
          <rect x={cx + 2} y={cy + 2} width={PAD.l + iw - cx - 2} height={PAD.t + ih - cy - 2} fill={TINT.comfortable} rx={16} />
          {qLabels.map((l) => (
            <g key={l.q}>
              <text x={l.x} y={l.y} textAnchor={l.anchor} className="fill-[#3d433f] text-[15px] font-semibold">{QUADRANTS[l.q].label}</text>
              <text x={l.x} y={l.y + 19} textAnchor={l.anchor} className="fill-[#898781] text-[13px]">{QUADRANTS[l.q].hint}</text>
            </g>
          ))}
          {yTicks.map((t) => (
            <text key={`y${t}`} x={PAD.l - 10} y={sy(t) + 4} textAnchor="end" className="fill-[#898781] text-[13px] tabular">{t}</text>
          ))}
          {xTicks.map((t) => (
            <text key={`x${t}`} x={sx(t)} y={H - PAD.b + 22} textAnchor="middle" className="fill-[#898781] text-[13px] tabular">{t}</text>
          ))}
          <text x={PAD.l - 10} y={cy + 5} textAnchor="end" className="fill-[#166534] text-[13px] font-semibold">Meta</text>
          <text x={cx} y={H - PAD.b + 22} textAnchor="middle" className="fill-[#166534] text-[13px] font-semibold">{CLIMA_CUT}</text>
          <text x={PAD.l} y={H - 4} className="fill-[#646a63] text-[13px] font-medium">Clima laboral (0–100) →</text>
          <text x={12} y={PAD.t + ih / 2} transform={`rotate(-90 12 ${PAD.t + ih / 2})`} dominantBaseline="middle" textAnchor="middle" className="fill-[#646a63] text-[13px] font-medium">
            Productividad (% de meta) →
          </text>

          {/* puntos: se desplazan suavemente al cambiar de período o nivel */}
          {pts.map(({ e, clima, prod }) => {
            const focused = e.id === focusId;
            const label = labels.get(e.id);
            return (
              <g
                key={e.id}
                style={{ transform: `translate(${sx(clima)}px, ${sy(prod)}px)`, transition: "transform .8s var(--ios-ease)" }}
                onPointerEnter={() => setHover(e.id)}
                onPointerLeave={() => setHover((h) => (h === e.id ? null : h))}
                onClick={() => onFocus(e.id)}
                className="cursor-pointer"
              >
                <circle r={20} fill="transparent" />
                {focused && <circle r={18} fill="none" stroke="#166534" strokeOpacity={0.28} strokeWidth={3.5} />}
                <circle r={focused ? 10.5 : 8.5} fill={statusHex(e.status)} stroke="#fff" strokeWidth={2.5} />
                {label && (
                  <text
                    x={label.dx} y={label.dy} textAnchor={label.anchor}
                    className="text-[14px] font-semibold"
                    style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3.5, strokeLinejoin: "round", fill: focused ? "#0c1212" : "#3d433f" }}
                  >
                    {e.short}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-2xl bg-white/95 p-3 text-[12.5px] shadow-float backdrop-blur animate-fade"
            style={{ left: Math.min(width - 120, Math.max(120, sx(hovered.clima))), top: Math.max(0, sy(hovered.prod) - 118) }}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="truncate font-semibold text-ink">{hovered.e.name}</span>
              <StatusBadge status={hovered.e.status} size="sm" variant={hovered.e.level === 2 ? "risk" : "status"} />
            </div>
            <Row k="Clima" v={`${fmt(hovered.clima)}/100`} />
            <Row k="Productividad" v={`${fmt(hovered.prod)} % de meta`} />
            <Row k="Cuadrante" v={QUADRANTS[quadrantOf(hovered.clima, hovered.prod)].label} />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Clic para ver la recomendación</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 pl-[72px]">
        {(["ok", "warn", "crit"] as const).map((s) => {
          const Icon = STATUS_META[s].icon;
          return (
            <span key={s} className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusHex(s) }} />
              <Icon className="h-3.5 w-3.5" strokeWidth={2.3} /> {STATUS_META[s].label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold tabular text-ink">{v}</span>
    </div>
  );
}

function range(a: number, b: number, step: number) {
  const out: number[] = [];
  for (let v = Math.ceil(a / step) * step; v <= b; v += step) out.push(v);
  return out;
}
