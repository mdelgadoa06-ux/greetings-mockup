import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Ancho de un elemento con ResizeObserver (para gráficas SVG responsivas sin librerías). */
export function useWidth<T extends HTMLElement>(initial = 600) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || initial);
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [initial]);
  return [ref, width] as const;
}

/** Texto que se "escribe" palabra por palabra, como la salida de un LLM en streaming. */
export function useStreamedText(text: string, key: string, speed = 22) {
  const [count, setCount] = useState(0);
  const [thinking, setThinking] = useState(true);
  const words = text.split(" ");
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setThinking(false);
      setCount(Infinity);
      return;
    }
    setThinking(true);
    setCount(0);
    let i = 0;
    let timer = 0;
    const start = window.setTimeout(() => {
      setThinking(false);
      timer = window.setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= words.length) window.clearInterval(timer);
      }, speed);
    }, 520);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, text]);
  const done = count >= words.length;
  return { text: done ? text : words.slice(0, count).join(" "), thinking, done };
}

/** Número que se anima hacia su nuevo valor (requestAnimationFrame, sin estado por frame fuera del componente). */
export function useAnimatedNumber(value: number, duration = 700) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      const v = a + (value - a) * e;
      setDisplay(v);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return display;
}

/** Ancho y alto de un elemento (gráficas que llenan el espacio disponible de su tarjeta). */
export function useSize<T extends HTMLElement>(initial = { w: 640, h: 360 }) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize({ w: el.clientWidth || initial.w, h: el.clientHeight || initial.h });
    const ro = new ResizeObserver(([entry]) => setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, size] as const;
}

let measureCtx: CanvasRenderingContext2D | null = null;
/** Ancho real de un texto con la fuente de la app (para colocar etiquetas sin choques). */
export function textWidth(text: string, font = '600 12px "Greetings Jakarta", Arial, sans-serif') {
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * 7;
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
}
