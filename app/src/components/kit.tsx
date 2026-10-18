import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, OctagonAlert, type LucideIcon } from "lucide-react";
import type { Status } from "@/data/mock";
import { cn } from "@/lib/utils";

/* ---------- Panel (tarjeta iOS) ---------- */
export function Panel({ className, children, as: As = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  return <As className={cn("card p-6 md:p-8", className)}>{children}</As>;
}

export function PanelHeader({ title, subtitle, right, className }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
        {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

/* ---------- Semáforo ---------- */
export const STATUS_META: Record<Status, { label: string; risk: string; icon: LucideIcon; dot: string; chip: string }> = {
  ok: { label: "Estable", risk: "Riesgo bajo", icon: CheckCircle2, dot: "bg-ok", chip: "bg-ok-soft text-ok-ink" },
  warn: { label: "Atención", risk: "Riesgo medio", icon: AlertTriangle, dot: "bg-warn", chip: "bg-warn-soft text-warn-ink" },
  crit: { label: "Crítico", risk: "Riesgo alto", icon: OctagonAlert, dot: "bg-crit", chip: "bg-crit-soft text-crit-ink" },
};

export function StatusBadge({ status, variant = "status", label, className, size = "md" }: { status: Status; variant?: "status" | "risk"; label?: string; className?: string; size?: "sm" | "md" }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-[12.5px]" : "px-3 py-1 text-[13.5px]",
        m.chip,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.4} />
      {label ?? (variant === "risk" ? m.risk : m.label)}
    </span>
  );
}

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", STATUS_META[status].dot, className)} />;
}

/* ---------- Control segmentado iOS con indicador deslizante ---------- */
export type SegOption<T extends string> = { value: T; label: ReactNode; icon?: LucideIcon };

export function Segmented<T extends string>({
  options, value, onChange, className, size = "md", tone = "light", ariaLabel,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T, el: HTMLButtonElement) => void;
  className?: string;
  size?: "sm" | "md";
  tone?: "light" | "dark";
  ariaLabel?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ x: 0, w: 0, ready: false });
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(value)}"]`);
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [value, options.length]);
  return (
    <div
      ref={wrap}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center rounded-full p-1",
        tone === "light" ? "bg-[#ececee]" : "bg-white/10",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 left-0 rounded-full transition-[transform,width] duration-500 ease-ios",
          tone === "light" ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,.06),0_3px_8px_rgba(0,0,0,.08)]" : "bg-white",
          !thumb.ready && "opacity-0",
        )}
        style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
      />
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-value={o.value}
            onClick={(e) => onChange(o.value, e.currentTarget)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
              size === "sm" ? "px-3.5 py-1.5 text-[13.5px]" : "px-5 py-2.5 text-[15px]",
              tone === "light" ? (active ? "text-ink" : "text-muted-foreground hover:text-ink") : active ? "text-field" : "text-white/75 hover:text-white",
            )}
          >
            {Icon && <Icon className="h-4 w-4" strokeWidth={2.2} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- KPI ---------- */
export function StatTile({
  label, value, unit, delta, deltaGood, caption, icon: Icon, accent, className, children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  deltaGood?: boolean;
  caption?: ReactNode;
  icon?: LucideIcon;
  accent?: Status;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("card flex flex-col justify-between gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("grid h-8 w-8 place-items-center rounded-full", accent ? STATUS_META[accent].chip : "bg-secondary text-ink")}>
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </span>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-[34px] leading-none font-semibold tracking-[-0.04em] text-ink">{value}</span>
          {unit && <span className="text-[15px] font-semibold text-muted-foreground">{unit}</span>}
          {delta && (
            <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[12px] font-semibold", deltaGood ? "bg-ok-soft text-ok-ink" : "bg-crit-soft text-crit-ink")}>
              {delta}
            </span>
          )}
        </div>
        {caption && <p className="mt-1.5 text-[12.5px] text-muted-foreground">{caption}</p>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Avatar con iniciales ---------- */
const AVATAR_TONES = ["bg-[#e6efe9] text-[#14532d]", "bg-[#eef0f5] text-[#2b3a67]", "bg-[#f6efe6] text-[#7a4b12]", "bg-[#f3e9ef] text-[#7a2852]", "bg-[#e8f1f4] text-[#1d5566]"];
export function Avatar({ initials, seed = 0, size = 36, className }: { initials: string; seed?: number; size?: number; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold", AVATAR_TONES[Math.abs(seed) % AVATAR_TONES.length], className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}

/* ---------- Encabezado de módulo ---------- */
export function ModuleHeader({ index, title, subtitle, right }: { index: string; title: string; subtitle: string; right?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-3 inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.1em] text-brand uppercase">
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-mint px-2 font-mono text-[12px] tracking-normal text-field">{index}</span>
          Módulo {index}
        </p>
        <h1 className="text-[clamp(38px,3.6vw,56px)] leading-[1.02] font-semibold tracking-[-0.045em] text-ink">{title}</h1>
        <p className="mt-3 max-w-[52ch] text-[18px] leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

/* ---------- Siguiente paso (CTA de cierre de cada pantalla) ---------- */
export function NextStep({ eyebrow, title, onClick, icon: Icon }: { eyebrow: string; title: string; onClick: () => void; icon: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press group mt-4 flex w-full items-center justify-between gap-4 rounded-[32px] bg-field px-8 py-7 text-left text-white cursor-pointer hover:bg-field-2"
    >
      <span className="flex items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[14px] font-medium text-white/65">{eyebrow}</span>
          <span className="block text-[22px] font-semibold tracking-[-0.02em]">{title}</span>
        </span>
      </span>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[18px] text-field transition-transform duration-500 ease-ios group-hover:translate-x-1">→</span>
    </button>
  );
}

/* ---------- Interruptor iOS ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      className={cn("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 cursor-pointer", checked ? "bg-[#34c759]" : "bg-[#e3e4e8]")}
    >
      <span className={cn("absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,.15),0_1px_1px_rgba(0,0,0,.16)] transition-transform duration-300 ease-ios", checked && "translate-x-5")} />
    </button>
  );
}
