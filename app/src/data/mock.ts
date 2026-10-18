/**
 * Datos demo de Greetings. 100 % ficticios y deterministas (semilla fija) para que
 * cada grabación del pitch muestre exactamente lo mismo.
 *
 * Historia que cuentan los datos:
 *  - 4 sedes de una cadena de autolavados, 86 colaboradores.
 *  - Sede Centro produce MÁS que nunca pero su clima cayó fuerte → patrón de desgaste.
 *  - Dentro de Centro, Detallado es el foco rojo (turnos dobles + vacantes cerca).
 *  - María Fernanda López (Centro · Detallado) tiene 78 % de probabilidad de salida.
 *
 * Escalas: clima 0–100 (índice de pulsos), productividad % de la meta del POS,
 * riesgo 0–100 (% de probabilidad de salida en 90 días).
 */

export type Status = "ok" | "warn" | "crit";
export type Level = 0 | 1 | 2;
export type Period = "p1" | "p2";

export interface Employee {
  id: string;
  name: string;
  initials: string;
  sedeId: string;
  deptId: string;
  role: string;
  tenure: number;
  age: number;
  zip: string;
  clima: number;
  climaPrev: number;
  prod: number;
  prodPrev: number;
  prodTrend: number;
  attendance: number;
  doubleShifts: number;
  vacancies: number;
  participation: number;
  logit: number;
  risk: number;
}

export interface Entity {
  id: string;
  level: Level;
  name: string;
  short: string;
  parentId?: string;
  clima: number;
  climaPrev: number;
  prod: number;
  prodPrev: number;
  participation: number;
  headcount: number;
  risk: number;
  highRisk: number;
  status: Status;
  weekly: { clima: number[]; prod: number[] };
  employee?: Employee;
}

/* ---------- utilidades deterministas ---------- */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261016);
const noise = (amp: number) => (rand() * 2 - 1) * amp;
const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;
const clampN = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/* ---------- semanas (P1 = 6 semanas anteriores, P2 = 6 más recientes) ---------- */
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const WEEKS: string[] = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, 9, 12 - (11 - i) * 7);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
});
export const PERIODS = {
  p1: { label: "P1", range: `${WEEKS[0]} – ${WEEKS[5]}` },
  p2: { label: "P2", range: `${WEEKS[6]} – ${WEEKS[11]}` },
};

/* ---------- estructura organizacional ---------- */
export const SEDES = [
  { id: "norte", name: "Sede Norte", short: "Norte", zip: "110111" },
  { id: "centro", name: "Sede Centro", short: "Centro", zip: "110311" },
  { id: "sur", name: "Sede Sur", short: "Sur", zip: "110811" },
  { id: "este", name: "Sede Este", short: "Este", zip: "110221" },
];
const DEPTS = [
  { id: "lavado", name: "Lavado", role: "Operario de lavado" },
  { id: "detallado", name: "Detallado", role: "Detallador" },
  { id: "caja", name: "Atención y caja", role: "Asesor de servicio" },
  { id: "lubricacion", name: "Lubricación", role: "Técnico de lubricación" },
];

// [clima P2, clima P1, productividad P2, productividad P1, participación, personas, turnos dobles prom., vacantes cerca]
type Target = [number, number, number, number, number, number, number, number];
const TARGETS: Record<string, Record<string, Target>> = {
  norte: { lavado: [84, 80, 104, 102, 93, 7, 1, 9], detallado: [80, 77, 101, 100, 90, 5, 2, 11], caja: [86, 81, 106, 103, 95, 4, 1, 7], lubricacion: [78, 75, 99, 98, 86, 4, 2, 8] },
  centro: { lavado: [60, 70, 109, 103, 66, 7, 6, 22], detallado: [47, 68, 116, 107, 52, 6, 6, 24], caja: [64, 73, 101, 99, 71, 5, 3, 18], lubricacion: [66, 72, 104, 101, 74, 4, 4, 16] },
  sur: { lavado: [71, 65, 90, 91, 80, 7, 1, 14], detallado: [68, 62, 88, 90, 77, 5, 1, 15], caja: [72, 67, 97, 96, 84, 5, 1, 12], lubricacion: [63, 61, 93, 94, 72, 5, 2, 17] },
  este: { lavado: [77, 75, 100, 99, 86, 7, 2, 10], detallado: [74, 73, 97, 98, 83, 5, 2, 12], caja: [79, 76, 102, 100, 88, 6, 1, 9], lubricacion: [72, 70, 96, 97, 80, 4, 3, 13] },
};

const FIRST = ["Juan David", "Laura Sofía", "Kevin Andrés", "Daniela", "Brayan Steven", "Valentina", "Andrés Felipe", "Paula Andrea", "Jhon Fredy", "Natalia", "Cristian Camilo", "Luisa Fernanda", "Santiago", "Yeimy Lorena", "Diego Alejandro", "Carolina", "Julián", "Angie Paola", "Sebastián", "Marcela", "Edwin", "Tatiana", "Óscar Iván", "Ximena", "Wilmer", "Diana Marcela", "Camilo", "Leidy Johana", "Mauricio", "Sara", "Duván", "Manuela"];
const LAST = ["Ríos", "Peña", "Mora", "Cárdenas", "Gómez", "Rojas", "Castaño", "Vargas", "Herrera", "Ortiz", "Salazar", "Muñoz", "Quintero", "Ramírez", "Bermúdez", "Acosta", "Parra", "Cifuentes", "Londoño", "Patiño", "Arango", "Beltrán", "Guzmán", "Pineda", "Suárez", "Zapata", "Moreno", "Duarte"];

/** Modelo de riesgo (representa la salida del Random Forest como logit aditivo explicable). */
export function riskTerms(e: Pick<Employee, "clima" | "prod" | "doubleShifts" | "vacancies" | "tenure" | "attendance" | "prodTrend">) {
  return {
    clima: 0.045 * (66 - e.clima),
    carga: 0.075 * e.doubleShifts + (e.prod > 105 && e.clima < 60 ? 0.2 : 0),
    mercado: 0.035 * (e.vacancies - 14),
    antiguedad: e.tenure < 1 ? 0.6 : e.tenure < 2.5 ? 0.35 : e.tenure < 4 ? 0 : -0.5,
    asistencia: 0.05 * (94 - e.attendance),
    rendimiento: e.prodTrend < 0 ? 0.03 * -e.prodTrend : 0,
  };
}
const BIAS = -1.45;

let empSeq = 0;
function makeEmployee(sedeId: string, deptId: string, t: Target, idx: number): Employee {
  const sede = SEDES.find((s) => s.id === sedeId)!;
  const dept = DEPTS.find((d) => d.id === deptId)!;
  const name = `${FIRST[(empSeq * 7 + 3) % FIRST.length]} ${LAST[(empSeq * 11 + idx * 5) % LAST.length]}`;
  empSeq++;
  const clima = clampN(round(t[0] + noise(11)), 22, 98);
  const climaPrev = clampN(round(t[1] + noise(8)), 30, 98);
  const prod = clampN(round(t[2] + noise(12)), 64, 135);
  const prodPrev = clampN(round(t[3] + noise(9)), 64, 135);
  const e: Employee = {
    id: `${sedeId}-${deptId}-${idx}`,
    name,
    initials: name.split(" ").filter((_, i, a) => i === 0 || i === a.length - 1).map((p) => p[0]).join(""),
    sedeId, deptId, role: dept.role,
    tenure: round(clampN(0.3 + rand() * 5.4, 0.2, 7), 1),
    age: Math.round(19 + rand() * 24),
    zip: sede.zip,
    clima, climaPrev, prod, prodPrev,
    prodTrend: round(((prod - prodPrev) / prodPrev) * 100),
    attendance: clampN(round(95 + noise(5)), 82, 100),
    doubleShifts: Math.max(0, Math.round(t[6] + noise(3))),
    vacancies: Math.max(2, Math.round(t[7] + noise(6))),
    participation: clampN(round(t[4] + noise(14)), 20, 100),
    logit: 0,
    risk: 0,
  };
  const terms = riskTerms(e);
  e.logit = BIAS + Object.values(terms).reduce((a, b) => a + b, 0) + noise(0.35);
  e.risk = round(sigmoid(e.logit) * 100);
  return e;
}

/* ---------- generación ---------- */
const employees: Employee[] = [];
for (const sede of SEDES) {
  for (const dept of DEPTS) {
    const t = TARGETS[sede.id][dept.id];
    const group = Array.from({ length: t[5] }, (_, i) => makeEmployee(sede.id, dept.id, t, i));
    // Recentrar para que el promedio del grupo sea exactamente el objetivo del departamento.
    const fix = (key: "clima" | "climaPrev" | "prod" | "prodPrev" | "participation", target: number) => {
      const diff = target - mean(group.map((g) => g[key]));
      group.forEach((g) => (g[key] = round(g[key] + diff)));
    };
    fix("clima", t[0]); fix("climaPrev", t[1]); fix("prod", t[2]); fix("prodPrev", t[3]); fix("participation", t[4]);
    group.forEach((g) => {
      g.participation = clampN(g.participation, 10, 100);
      g.prodTrend = round(((g.prod - g.prodPrev) / g.prodPrev) * 100);
      g.logit = BIAS + Object.values(riskTerms(g)).reduce((a, b) => a + b, 0) + noise(0.55);
      g.risk = round(sigmoid(g.logit) * 100);
    });
    employees.push(...group);
  }
}

// Protagonista del demo (coincide con la diapositiva 7 del deck).
const maria = employees.find((e) => e.id === "centro-detallado-0")!;
Object.assign(maria, {
  name: "María Fernanda López", initials: "ML", tenure: 1.8, age: 27, clima: 41, climaPrev: 66,
  prod: 86, prodPrev: 98, prodTrend: -12, attendance: 94, doubleShifts: 11, vacancies: 34, participation: 60,
});
maria.logit = Math.log(0.78 / 0.22);
maria.risk = 78;
// Ajuste narrativo: María es el caso protagonista, nadie de su equipo la supera.
employees
  .filter((e) => e.deptId === "detallado" && e.sedeId === "centro" && e !== maria && e.risk > 72)
  .forEach((e) => { e.logit = Math.log(0.72 / 0.28); e.risk = 72; });

export const EMPLOYEES = employees;
export const FOCUS_EMPLOYEE_ID = maria.id;

/* ---------- series semanales ---------- */
function weekly(prev: number, curr: number, amp: number, seedOffset: number): number[] {
  const r = mulberry32(seedOffset);
  return Array.from({ length: 12 }, (_, i) => {
    const t = clampN((i - 3.5) / 5, 0, 1);
    const ease = t * t * (3 - 2 * t);
    const base = prev + (curr - prev) * ease;
    return round(base + ((r() * 2 - 1) * amp));
  });
}
function recenter(series: number[], p1: number, p2: number) {
  const d1 = p1 - mean(series.slice(0, 6));
  const d2 = p2 - mean(series.slice(6));
  return series.map((v, i) => round(v + (i < 6 ? d1 : d2), 1));
}
const hash = (s: string) => Array.from(s).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

/* ---------- agregación ---------- */
export function statusOf(clima: number, climaPrev: number, prod: number): Status {
  const delta = (clima - climaPrev) / climaPrev;
  if (clima < 55 || delta <= -0.15) return "crit";
  if (clima < 65 || delta <= -0.06 || prod < 92) return "warn";
  return "ok";
}
export const RISK_HIGH = 55;
export const RISK_MID = 30;
export const riskStatus = (risk: number): Status => (risk >= RISK_HIGH ? "crit" : risk >= RISK_MID ? "warn" : "ok");

function aggregate(id: string, level: Level, name: string, short: string, members: Employee[], parentId?: string): Entity {
  const w = (k: keyof Employee) => round(mean(members.map((m) => m[k] as number)), 1);
  const clima = w("clima"), climaPrev = w("climaPrev"), prod = w("prod"), prodPrev = w("prodPrev");
  const wk = {
    clima: recenter(weekly(climaPrev, clima, level === 2 ? 5 : 2.2, hash(id)), climaPrev, clima),
    prod: recenter(weekly(prodPrev, prod, level === 2 ? 6 : 2.5, hash(id) + 99), prodPrev, prod),
  };
  return {
    id, level, name, short, parentId, clima, climaPrev, prod, prodPrev,
    participation: w("participation"),
    headcount: members.length,
    risk: w("risk"),
    highRisk: members.filter((m) => m.risk >= RISK_HIGH).length,
    status: level === 2 ? riskStatus(members[0].risk) : statusOf(clima, climaPrev, prod),
    weekly: wk,
    employee: level === 2 ? members[0] : undefined,
  };
}

export const COMPANY = aggregate("all", 0, "Todas las sedes", "Empresa", employees);
export const SEDE_ENTITIES: Entity[] = SEDES.map((s) => aggregate(s.id, 0, s.name, s.short, employees.filter((e) => e.sedeId === s.id)));
export const DEPT_ENTITIES: Entity[] = SEDES.flatMap((s) =>
  DEPTS.map((d) => aggregate(`${s.id}-${d.id}`, 1, d.name, d.name, employees.filter((e) => e.sedeId === s.id && e.deptId === d.id), s.id)),
);
export const EMPLOYEE_ENTITIES: Entity[] = employees.map((e) => aggregate(e.id, 2, e.name, e.name.split(" ")[0], [e], `${e.sedeId}-${e.deptId}`));

const ALL = new Map<string, Entity>([COMPANY, ...SEDE_ENTITIES, ...DEPT_ENTITIES, ...EMPLOYEE_ENTITIES].map((e) => [e.id, e]));
export const getEntity = (id: string) => ALL.get(id)!;
export function childrenOf(parentId: string | null): Entity[] {
  if (!parentId || parentId === "all") return SEDE_ENTITIES;
  return [...DEPT_ENTITIES, ...EMPLOYEE_ENTITIES].filter((e) => e.parentId === parentId);
}
export const sedeName = (id: string) => SEDES.find((s) => s.id === id)?.name ?? id;
export const deptName = (id: string) => DEPTS.find((d) => d.id === id)?.name ?? id;

/* ---------- costos ocultos de rotación (millones COP, ilustrativo) ---------- */
export const EXIT_COST = [
  { label: "Reclutamiento y selección", short: "Reclutamiento", value: 0.55 },
  { label: "Dotación y uniformes", short: "Dotación", value: 0.38 },
  { label: "Capacitación", short: "Capacitación", value: 0.92 },
  { label: "Productividad perdida (curva de aprendizaje)", short: "Productividad perdida", value: 1.45 },
];
export const COST_PER_EXIT = round(EXIT_COST.reduce((a, b) => a + b.value, 0), 2);
export const EXITS_LAST_12M = 49;
export const ANNUAL_TURNOVER = round((EXITS_LAST_12M / employees.length) * 100);
export const HIDDEN_COST_12M = round(EXITS_LAST_12M * COST_PER_EXIT, 1);

export const RISK_BUCKETS = {
  crit: employees.filter((e) => riskStatus(e.risk) === "crit").length,
  warn: employees.filter((e) => riskStatus(e.risk) === "warn").length,
  ok: employees.filter((e) => riskStatus(e.risk) === "ok").length,
};
export const EXPECTED_EXITS_90D = round(employees.reduce((a, e) => a + e.risk / 100, 0), 1);
export const EXPECTED_COST_90D = round(EXPECTED_EXITS_90D * COST_PER_EXIT, 1);
/** Costo evitable si se retiene la mitad de las salidas esperadas entre quienes están en riesgo medio o alto. */
export const AVOIDABLE_COST_90D = round(
  employees.filter((e) => e.risk >= RISK_MID).reduce((a, e) => a + (e.risk / 100) * COST_PER_EXIT * 0.5, 0),
  1,
);

/* ---------- formato es-CO ---------- */
export const fmt = (n: number, d = 0) => n.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtPct = (n: number, d = 0) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n), d)} %`;
export const deltaPct = (curr: number, prev: number) => ((curr - prev) / prev) * 100;
export const money = (millions: number) => `$${fmt(millions, millions >= 100 ? 0 : 1)} M`;

/* ---------- integración de datos (Módulo 1) ---------- */
export const SOURCES = [
  { id: "pos", name: "Registros POS", desc: "Ventas, servicios por operario y ticket promedio.", records: 38412, sync: "hace 4 min", fields: ["Servicios", "Ventas", "Ticket", "Operario"] },
  { id: "turnos", name: "Turnos y horarios", desc: "Asistencia, horas extra y turnos dobles.", records: 6120, sync: "hace 12 min", fields: ["Entrada", "Salida", "Horas extra", "Turno"] },
  { id: "rrhh", name: "Datos de colaboradores", desc: "Antigüedad, cargo, edad y código postal.", records: 86, sync: "hoy 6:00", fields: ["Cargo", "Antigüedad", "Edad", "C. postal"] },
  { id: "pulsos", name: "Pulsos por WhatsApp", desc: "Encuestas de 30 segundos al cierre del turno.", records: 3592, sync: "en vivo", fields: ["Ánimo", "Recursos", "Ambiente", "eNPS"] },
] as const;
export const PULSE_TODAY = { sent: 86, answered: 61 };
export const PULSE_QUESTIONS = [
  { q: "¿Cómo estuvo tu turno hoy?", options: ["😄 Muy bien", "🙂 Bien", "😐 Regular", "😣 Difícil"] },
  { q: "¿Tuviste lo necesario para trabajar bien hoy?", options: ["Sí", "Parcial", "No"] },
  { q: "¿Cómo estuvo el ambiente del equipo?", options: ["Bueno", "Normal", "Tenso"] },
];
