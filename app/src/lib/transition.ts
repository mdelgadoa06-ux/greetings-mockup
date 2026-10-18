import { flushSync } from "react-dom";

export type TransitionKind = "zoom-in" | "zoom-out" | "fwd" | "back" | "drill-in" | "drill-out";

type VTDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Cambia de estado con la View Transitions API (zoom/slide nativo del navegador, en GPU).
 * Sin soporte o con "reducir movimiento" aplica el cambio directo: nunca bloquea el flujo.
 * `source` recibe un view-transition-name temporal para que crezca hasta ser la nueva vista.
 */
export function transition(update: () => void, kind: TransitionKind, source?: HTMLElement | null) {
  const doc = document as VTDocument;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) {
    update();
    return;
  }
  const root = document.documentElement;
  root.dataset.vt = kind;
  if (source) source.style.viewTransitionName = "vt-zoom";
  const vt = doc.startViewTransition(() => {
    if (source) source.style.viewTransitionName = "";
    flushSync(update);
  });
  vt.finished.finally(() => {
    if (root.dataset.vt === kind) delete root.dataset.vt;
  });
}
