import { useEffect, useRef, useState } from "react";
import { BatteryFull, CheckCheck, ChevronLeft, Lock, Mic, Paperclip, RotateCcw, Signal, Wifi } from "lucide-react";
import { PULSE_QUESTIONS } from "@/data/mock";
import { cn } from "@/lib/utils";

type Msg = { id: number; from: "bot" | "me"; text: string; options?: string[] };

const INTRO = "Hola Juan 👋 Soy Greetings, el asistente de tu equipo en Sede Norte. Son 3 preguntas de 30 segundos y tus respuestas son anónimas.";
const OUTRO = "¡Gracias, Juan! 🙌 Tu pulso ya está en el tablero de tu sede. Mañana al cierre de turno te escribo de nuevo.";

/**
 * Simulación del canal "Pulsos por WhatsApp" dentro de un iPhone.
 * Es interactivo: se toca una respuesta y el pulso llega al tablero (onAnswer / onComplete).
 */
export function PhoneMock({ onComplete, onAnswer, className }: { onComplete?: () => void; onAnswer?: (q: number, a: string) => void; className?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(0);
  const seq = useRef(0);
  const body = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const add = (m: Omit<Msg, "id">) => setMsgs((xs) => [...xs, { ...m, id: ++seq.current }]);
  const botSays = (m: Omit<Msg, "id" | "from">, delay = 650) => {
    setTyping(true);
    later(() => { setTyping(false); add({ from: "bot", ...m }); }, delay);
  };

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMsgs([]);
    setStep(0);
    botSays({ text: INTRO }, 500);
    later(() => botSays({ text: PULSE_QUESTIONS[0].q, options: PULSE_QUESTIONS[0].options }, 700), 1300);
  };

  useEffect(() => {
    start();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const answer = (a: string) => {
    add({ from: "me", text: a });
    onAnswer?.(step, a);
    const next = step + 1;
    setStep(next);
    if (next < PULSE_QUESTIONS.length) botSays({ text: PULSE_QUESTIONS[next].q, options: PULSE_QUESTIONS[next].options });
    else {
      botSays({ text: OUTRO }, 800);
      later(() => onComplete?.(), 900);
    }
  };

  return (
    <div className={cn("relative mx-auto w-[300px] shrink-0", className)}>
      <div className="relative h-[612px] overflow-hidden rounded-[52px] border-[10px] border-[#0c1212] bg-[#efeae2] shadow-float">
        {/* barra de estado + isla */}
        <div className="absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between bg-white px-6 text-[12px] font-semibold text-ink">
          <span>9:41</span>
          <span className="absolute top-2 left-1/2 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-[#0c1212]" />
          <span className="flex items-center gap-1">
            <Signal className="h-3.5 w-3.5" /> <Wifi className="h-3.5 w-3.5" /> <BatteryFull className="h-4 w-4" />
          </span>
        </div>
        {/* cabecera del chat */}
        <div className="absolute inset-x-0 top-11 z-10 flex items-center gap-2 border-b border-black/5 bg-white px-3 pb-2.5 pt-1">
          <ChevronLeft className="h-5 w-5 text-brand" />
          <span className="grid h-9 w-9 place-items-center rounded-full bg-field text-[13px] font-bold tracking-[-0.06em] text-white">g.</span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[14px] font-semibold text-ink">Greetings · Pulsos</span>
            <span className="block text-[11px] text-muted-foreground">{typing ? "escribiendo…" : "Cuenta de empresa"}</span>
          </span>
        </div>
        {/* mensajes */}
        <div ref={body} className="absolute inset-x-0 top-[100px] bottom-[58px] overflow-y-auto px-3 py-3 [scrollbar-width:none]">
          <div className="mx-auto mb-3 flex w-fit items-center gap-1 rounded-lg bg-[#fdf4c5] px-2.5 py-1 text-[10.5px] text-[#54656f]">
            <Lock className="h-3 w-3" /> Respuestas anónimas y cifradas
          </div>
          <div className="space-y-2">
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")} style={{ animation: "rise .35s var(--ios-ease) both" }}>
                <div className={cn("max-w-[84%]", m.from === "me" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-[13px] leading-snug text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,.13)]",
                      m.from === "me" ? "rounded-tr-md bg-[#d9fdd3]" : "rounded-tl-md bg-white",
                    )}
                  >
                    {m.text}
                    <span className="ml-2 inline-flex translate-y-0.5 items-center gap-0.5 text-[10px] text-[#667781]">
                      6:{String(12 + (m.id % 40)).padStart(2, "0")} p. m.
                      {m.from === "me" && <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />}
                    </span>
                  </div>
                  {m.options && m === msgs[msgs.length - 1] && !typing && step < PULSE_QUESTIONS.length && (
                    <div className={cn("mt-1 grid gap-1", m.options.length === 4 ? "grid-cols-2" : "grid-cols-3")}>
                      {m.options.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => answer(o)}
                          className="press rounded-xl bg-white px-2 py-2 text-[12.5px] font-semibold text-brand shadow-[0_1px_0.5px_rgba(11,20,26,.13)] hover:bg-mint cursor-pointer"
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex">
                <div className="flex gap-1 rounded-2xl rounded-tl-md bg-white px-3 py-3 shadow-[0_1px_0.5px_rgba(11,20,26,.13)]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8696a0]" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* barra de escritura */}
        <div className="absolute inset-x-0 bottom-0 flex h-[58px] items-center gap-2 bg-[#f0f2f5] px-3 pb-2">
          <Paperclip className="h-5 w-5 text-[#54656f]" />
          <span className="flex-1 rounded-full bg-white px-3 py-2 text-[12.5px] text-[#8696a0]">Escribe un mensaje…</span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white">
            <Mic className="h-4 w-4" />
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={start}
        className="press absolute -bottom-11 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-muted-foreground shadow-card hover:text-ink cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reiniciar conversación
      </button>
    </div>
  );
}
