/**
 * "LLM" del mockup: genera la recomendación contextual a partir de los datos.
 * En producción esto sería una llamada a un modelo con el contexto (entidad, métricas,
 * comentarios de pulsos). Aquí es determinista para que el demo sea repetible.
 */
import {
  type Entity,
  type Employee,
  type Status,
  SEDE_ENTITIES,
  childrenOf,
  deltaPct,
  fmt,
  riskTerms,
  RISK_HIGH,
  RISK_MID,
} from "./mock";

export type Quadrant = "engaged" | "burnout" | "comfortable" | "disconnected";
export const CLIMA_CUT = 65;
export const PROD_CUT = 100;

export const QUADRANTS: Record<Quadrant, { label: string; hint: string }> = {
  engaged: { label: "Comprometidos", hint: "Buen clima y sobre la meta" },
  burnout: { label: "En desgaste", hint: "Rinden, pero con bajo ánimo" },
  comfortable: { label: "Capacidad sin usar", hint: "Buen clima, bajo la meta" },
  disconnected: { label: "Desconectados", hint: "Bajo ánimo y bajo la meta" },
};

export const quadrantOf = (clima: number, prod: number): Quadrant =>
  clima >= CLIMA_CUT ? (prod >= PROD_CUT ? "engaged" : "comfortable") : prod >= PROD_CUT ? "burnout" : "disconnected";

export interface Recommendation {
  key: string;
  tone: Status;
  title: string;
  body: string;
  actions: string[];
  basis: string;
}

const article = (e: Entity) => (e.level === 0 ? e.name : e.level === 1 ? `el equipo de ${e.name}` : e.name.split(" ")[0]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function recommend(e: Entity): Recommendation {
  const d = deltaPct(e.clima, e.climaPrev);
  const who = article(e);
  const pulses = Math.round(e.headcount * 6 * (e.participation / 100));
  const basis = e.level === 2
    ? `Basado en 12 semanas de POS, turnos y ${Math.round(6 * (e.participation / 100))} pulsos respondidos`
    : `Basado en ${fmt(pulses)} pulsos, POS de 12 semanas y turnos de ${e.headcount} personas`;

  if (e.level === 2 && e.employee) return recommendEmployee(e, e.employee, basis);

  const q = quadrantOf(e.clima, e.prod);
  const best = [...SEDE_ENTITIES].sort((a, b) => b.clima - a.clima)[0];
  const worstChild = e.level < 2 ? [...childrenOf(e.id)].sort((a, b) => a.clima - b.clima)[0] : undefined;
  const drop = `${fmt(e.climaPrev)} → ${fmt(e.clima)}`;

  switch (q) {
    case "burnout":
      return {
        key: e.id, tone: e.status,
        title: "Desgaste: rinde más, pero con menos ánimo",
        body: `${cap(who)} está en ${fmt(e.prod)} % de la meta, pero su clima ${d < 0 ? `bajó ${fmt(Math.abs(d))} % (${drop})` : `sigue bajo (${fmt(e.clima)})`}. Los pulsos repiten "turnos dobles" y "poco reconocimiento". Este patrón suele anticipar renuncias en 4 a 8 semanas.${worstChild ? ` El foco está en ${worstChild.name} (clima ${fmt(worstChild.clima)}).` : ""}`,
        actions: ["Rebalancear turnos de las próximas 2 semanas", "Reconocer en público el esfuerzo del equipo", "Pulso de seguimiento el viernes"],
        basis,
      };
    case "disconnected":
      return {
        key: e.id, tone: e.status,
        title: "Desconexión: bajo ánimo y bajo la meta",
        body: `El clima de ${who} está en ${fmt(e.clima)} y la productividad en ${fmt(e.prod)} % de la meta. El 38 % respondió "Parcial" o "No" a "¿Tuviste lo necesario para trabajar bien?". Empieza por recursos antes que por metas.`,
        actions: ["Revisar insumos y herramientas esta semana", "Reunión de 10 min al iniciar turno", "Meta semanal alcanzable y visible"],
        basis,
      };
    case "comfortable":
      return {
        key: e.id, tone: e.status,
        title: "Buen clima, capacidad sin usar",
        body: `El ánimo de ${who} es bueno (${fmt(e.clima)}${d > 0 ? `, +${fmt(d)} %` : ""}), pero la productividad está en ${fmt(e.prod)} % de la meta. El POS muestra horas valle con personal de sobra: ajusta la programación a los picos de demanda.`,
        actions: ["Ajustar turnos a los picos del POS", "Metas por turno visibles en tablero", "Incentivo por servicios adicionales"],
        basis,
      };
    default:
      return {
        key: e.id, tone: e.status,
        title: "Equipo sano: replica lo que funciona",
        body: `${cap(who)} combina clima ${fmt(e.clima)} con ${fmt(e.prod)} % de la meta y ${fmt(e.participation)} % de participación en pulsos. ${e.id === best.id ? "Es la mejor sede: documenta sus prácticas (líder presente en cambio de turno, reconocimiento semanal) y llévalas a Sede Centro." : "Mantén la frecuencia de pulsos y comparte sus prácticas con las sedes en rojo."}`,
        actions: ["Documentar prácticas del líder", "Mentoría cruzada con Sede Centro", "Mantener pulso semanal"],
        basis,
      };
  }
}

function recommendEmployee(e: Entity, emp: Employee, basis: string): Recommendation {
  const first = emp.name.split(" ")[0];
  const drivers = topDrivers(emp).slice(0, 3).map((x) => x.phrase);
  const list = drivers.length > 1 ? `${drivers.slice(0, -1).join(", ")} y ${drivers.at(-1)}` : drivers[0] ?? "señales estables";
  if (emp.risk >= RISK_HIGH)
    return {
      key: e.id, tone: "crit",
      title: "Intervenir esta semana",
      body: `${first} tiene ${fmt(emp.risk)} % de probabilidad de salir en los próximos 90 días. Lo que más pesa: ${list}. Una conversación 1:1 en los próximos 5 días es la acción con mayor efecto.`,
      actions: ["Agendar 1:1", "Reducir turnos dobles", "Revisar compensación"],
      basis,
    };
  if (emp.risk >= RISK_MID)
    return {
      key: e.id, tone: "warn",
      title: "Monitorear de cerca",
      body: `${first} está en riesgo medio (${fmt(emp.risk)} %). Señales: ${list}. Aún no requiere intervención formal; un reconocimiento oportuno y escuchar en el próximo pulso suele bastar.`,
      actions: ["Reconocimiento esta semana", "Pulso individual", "Revisar carga de turnos"],
      basis,
    };
  return {
    key: e.id, tone: "ok",
    title: "Estable y comprometido",
    body: `${first} tiene riesgo bajo (${fmt(emp.risk)} %), clima ${fmt(emp.clima)} y ${fmt(emp.prod)} % de la meta. Es candidato a referente o mentor para personas nuevas del equipo.`,
    actions: ["Proponer como mentor", "Plan de carrera", "Mantener pulso"],
    basis,
  };
}

/* ---------- explicación del modelo (lenguaje simple) ---------- */
export interface Driver {
  key: keyof ReturnType<typeof riskTerms>;
  label: string;
  phrase: string;
  weight: number;
}
const DRIVER_COPY: Record<Driver["key"], { label: string; phrase: (e: Employee) => string }> = {
  clima: { label: "Ánimo en pulsos", phrase: (e) => `su ánimo bajó a ${fmt(e.clima)}/100` },
  carga: { label: "Turnos dobles", phrase: (e) => `${e.doubleShifts} turnos dobles este mes` },
  mercado: { label: "Vacantes en su zona", phrase: (e) => `${e.vacancies} vacantes similares cerca de su casa` },
  antiguedad: { label: "Antigüedad", phrase: (e) => `lleva ${fmt(e.tenure, 1)} años, la etapa con más salidas` },
  asistencia: { label: "Asistencia", phrase: (e) => `asistencia de ${fmt(e.attendance)} %` },
  rendimiento: { label: "Tendencia de rendimiento", phrase: (e) => `su rendimiento cayó ${fmt(Math.abs(e.prodTrend))} %` },
};

export function topDrivers(emp: Employee): Driver[] {
  const terms = riskTerms(emp);
  const pos = (Object.keys(terms) as Driver["key"][]).filter((k) => terms[k] > 0.05);
  const total = pos.reduce((a, k) => a + terms[k], 0) || 1;
  return pos
    .map((k) => ({ key: k, label: DRIVER_COPY[k].label, phrase: DRIVER_COPY[k].phrase(emp), weight: terms[k] / total }))
    .sort((a, b) => b.weight - a.weight);
}

/* ---------- simulador "¿y si actúo?" ---------- */
export interface WhatIf {
  id: string;
  label: string;
  detail: string;
  effect: number;
  driver: Driver["key"];
}
export const WHAT_IFS: WhatIf[] = [
  { id: "1a1", label: "Conversación 1:1 esta semana", detail: "Escuchar y acordar 1 cambio concreto", effect: 0.55, driver: "clima" },
  { id: "turnos", label: "Reducir turnos dobles", detail: "Máximo 4 al mes durante 6 semanas", effect: 0.7, driver: "carga" },
  { id: "comp", label: "Revisar compensación vs. mercado", detail: "Bono de permanencia o ajuste por zona", effect: 0.6, driver: "mercado" },
  { id: "mentor", label: "Plan de carrera con mentor", detail: "Ruta a líder de detallado en 6 meses", effect: 0.35, driver: "antiguedad" },
];
export function simulateRisk(emp: Employee, active: string[]) {
  const terms = riskTerms(emp);
  const reduction = WHAT_IFS.filter((w) => active.includes(w.id)).reduce((a, w) => a + Math.min(w.effect, Math.max(0.15, terms[w.driver] * 0.8)), 0);
  return Math.round((1 / (1 + Math.exp(-(emp.logit - reduction)))) * 100);
}

/* ---------- alertas (semáforo) ---------- */
export interface Alert {
  id: string;
  status: Status;
  title: string;
  detail: string;
  entityId: string;
}
export function alertsUnder(parentId: string | null): Alert[] {
  const pool = (parentId && parentId !== "all" ? [childrenOf(parentId), ...childrenOf(parentId).map((c) => childrenOf(c.id))] : [SEDE_ENTITIES, ...SEDE_ENTITIES.map((s) => childrenOf(s.id))]).flat();
  return pool
    .filter((e) => e.status !== "ok")
    .sort((a, b) => (a.status === b.status ? a.clima - b.clima : a.status === "crit" ? -1 : 1))
    .slice(0, 4)
    .map((e) => {
      const d = deltaPct(e.clima, e.climaPrev);
      const parent = e.level === 1 ? SEDE_ENTITIES.find((s) => s.id === e.parentId)?.short : undefined;
      const title = e.level === 2 ? e.name : parent ? `${parent} · ${e.name}` : e.name;
      let detail: string;
      if (e.level === 2 && e.employee) detail = `Riesgo de salida ${fmt(e.employee.risk)} %`;
      else if (d <= -6) detail = `Clima ${d < 0 ? "−" : "+"}${fmt(Math.abs(d))} % en 6 semanas`;
      else if (e.prod < 92) detail = `Productividad en ${fmt(e.prod)} % de la meta`;
      else if (e.participation < 70) detail = `Participación en pulsos de ${fmt(e.participation)} %`;
      else detail = `Clima en ${fmt(e.clima)}/100`;
      return { id: e.id, status: e.status, title, detail, entityId: e.id };
    });
}
