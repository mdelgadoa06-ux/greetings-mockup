import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Notificación tipo Dynamic Island: confirma cada acción sin sacar al usuario del flujo
   ========================================================================== */
type Toast = { id: number; title: string; detail?: string };
const ToastCtx = createContext<(title: string, detail?: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef(0);
  const push = useCallback((title: string, detail?: string) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), title, detail });
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed top-3 left-1/2 z-[80] flex max-w-[92vw] items-center gap-3 rounded-full bg-[#0c1212] py-2.5 pr-5 pl-2.5 text-white shadow-float"
          style={{ animation: "island-in .55s var(--ios-ease) both", transform: "translateX(-50%)" }}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ok/20 text-[#5ee35e]">
            <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2.4} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold">{toast.title}</span>
            {toast.detail && <span className="block truncate text-[12px] text-white/65">{toast.detail}</span>}
          </span>
        </div>
      )}
    </ToastCtx.Provider>
  );
}

/* ==========================================================================
   Hoja lateral (sheet) estilo iOS
   ========================================================================== */
export function Sheet({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = window.setTimeout(() => setMounted(false), 420);
      return () => window.clearTimeout(t);
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted) return null;
  // Portal a <body>: <main> tiene view-transition-name, que crea su propio contexto de apilamiento.
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className={cn("absolute inset-0 bg-[#0c1212]/25 backdrop-blur-[2px] transition-opacity duration-400", open ? "opacity-100" : "opacity-0")}
      />
      <aside
        className={cn(
          "absolute top-3 right-3 bottom-3 flex w-[min(460px,calc(100vw-24px))] flex-col rounded-[28px] bg-white shadow-float transition-transform duration-500 ease-ios",
          open ? "translate-x-0" : "translate-x-[110%]",
        )}
        style={open ? { animation: "sheet-in .5s var(--ios-ease) both" } : undefined}
      >
        <header className="flex items-start justify-between gap-4 border-b px-6 pt-6 pb-4">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="press grid h-9 w-9 place-items-center rounded-full bg-secondary text-ink cursor-pointer" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="scroll-area flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="border-t px-6 py-4">{footer}</footer>}
      </aside>
      <style>{`@keyframes sheet-in{from{transform:translateX(110%)}to{transform:none}}`}</style>
    </div>,
    document.body,
  );
}
