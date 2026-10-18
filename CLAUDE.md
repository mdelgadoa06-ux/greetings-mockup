# CLAUDE.md · Greetings (mockup UX para pitch)

Instrucciones de trabajo para cualquier sesión de Claude en este proyecto. Léelas completas antes de tocar código.

## Qué es esto

Mockup navegable de **Greetings**, SaaS para reducir la rotación en empresas frontline (peluquerías, autolavados, talleres). Es el **insumo del pitch** de un concurso de emprendimiento: se graba en video. Prioridades, en orden: **(1) que se vea impecable y fluido en el video, (2) que el flujo cuente la historia, (3) que el código sea mantenible.** No es producción: no hay backend; los datos son ficticios y deterministas.

## Fuentes de verdad

| Archivo | Para qué |
|---|---|
| [`GREETINGS_IDEA.md`](GREETINGS_IDEA.md) | La idea, el flujo, los datos, el modelo y el guion del video. **Actualízalo si cambias el flujo o las cifras.** |
| [`componentes_21stdev.md`](componentes_21stdev.md) | Componentes de 21st.dev que el usuario exige usar (Glyph Portal, Steps, Dashboard-4, Stats-2). |
| `Greetings_flujo_visual_completo.pptx` | Deck de 8 diapositivas con el flujo UX original (para leerlo: descomprimir y parsear `ppt/slides/slide*.xml`). |
| [`greetings-mockup.html`](greetings-mockup.html) | **Entregable.** Build de un solo archivo; se regenera, nunca se edita a mano. |

## Comandos (desde `app/`)

```bash
npm install            # una vez
npm run dev            # desarrollo con HMR → http://localhost:5173
npm run typecheck      # tsc --noEmit (debe quedar en 0 errores)
npm run build:single   # typecheck + build → ../greetings-mockup.html (todo inline, ~500 KB)
```

Después de cualquier cambio: `npm run build:single` y verifica visualmente (ver "Verificación").

## Stack y estructura

Vite 8 · React 19 · TypeScript 7 · Tailwind CSS v4 (`@tailwindcss/vite`, tokens en CSS) · estructura shadcn (`components.json`, alias `@/`) · Ark UI (Steps) · lucide-react · `vite-plugin-singlefile`. Sin librerías de gráficas: **SVG propio**.

```
app/src/
  main.tsx                 carga la fuente ANTES de montar (requisito del Glyph Portal)
  App.tsx                  vistas, cortina de capítulo (transición entre vistas), atajos, barra superior
  index.css                tokens de diseño, View Transitions, overrides del hero
  lib/transition.ts        View Transitions API, solo para profundizar dentro de Clima (drill-in / drill-out)
  lib/hooks.ts             useWidth/useSize, texto en streaming (IA), número animado, textWidth
  data/mock.ts             datos demo deterministas + modelo de riesgo + formato es-CO
  data/ai.ts               "LLM" simulado: recomendaciones, alertas, drivers, simulador
  components/ui/           componentes 21st.dev: glyph-portal, steps, stats-2, dashboard-4, button
  components/kit.tsx       Panel, StatusBadge, Segmented (iOS), StatTile, Avatar, ModuleHeader, NextStep
  components/charts/       Quadrant (clima×productividad), Trend, small (Sparkline, Dumbbell, Meter, StackedBar, HBars, RiskRing)
  components/AIRecommendation.tsx · PhoneMock.tsx (WhatsApp) · overlays.tsx (toast tipo Dynamic Island, Sheet)
  views/                   Hero (+ Vista general), DataModule, ClimateModule, PredictiveModule
```

## Reglas de componentes 21st.dev

- **`glyph-portal.tsx` se copió literal del md: no lo modifiques.** Personalízalo solo con props, variables `--gp-*` y CSS con prefijo `[data-hero]` en `index.css`. Conserva el aviso MIT.
- El portal **mide la tinta de la fuente**: la fuente debe estar cargada antes de montarlo (`main.tsx` usa `FontFace` y espera hasta 1,6 s). Si la pestaña está oculta o el primer frame tarda más de 2,5 s, el portal entra en modo estático a propósito.
- El CTA del portal es un ancla; `Hero.tsx` lo intercepta y anima el scroll (2,6 s). El portal mantiene visible el caption mientras el enlace tenga foco: por eso se hace `blur()`.
- `steps.tsx`: misma anatomía Ark UI del demo, recoloreada a marca y en modo controlado (`LevelSteps`).
- `stats-2.tsx`: misma estructura del demo con contenido por props. **No uses `@aliimam/icons`**: su barril no es tree-shakeable y sumaba ~5 MB al build. Se usa `ArrowRight` de lucide.
- `dashboard-4.tsx`: el md solo traía el import, no el código. Es implementación propia en esa ruta (KPIs → cuadrante + IA + alertas → tabla → tendencias).
- Componentes nuevos de 21st.dev: van a `components/ui/`, adaptados con tokens de marca y verificando el tamaño del bundle.

## Sistema de diseño (no negociable)

- **Estética**: la del Glyph Portal llevada a todo el producto. Papel `#fff`, tinta `#0c1212`, campo `#0b3b2a`, marca `#166534`, menta `#dcfce7`, lienzo `#f5f5f7`. Fuente: Plus Jakarta Sans (familia `"Greetings Jakarta"`).
- **Lenguaje iOS**: tarjetas `rounded-[24px]`+, controles en píldora, `Segmented` con indicador deslizante, `Switch` iOS, vidrio en la barra superior, toasts tipo Dynamic Island, curva `--ios-ease` (`cubic-bezier(.32,.72,0,1)`).
- **Sin gradientes** (regla del deck). Colores planos; los estados de carga son pulsos de opacidad.
- **Semáforo** (`ok` / `warn` / `crit`): siempre **ícono + etiqueta**, nunca solo color (verde y amarillo se confunden con protanopia; está validado). Colores solo vía tokens `--ok/--warn/--crit` y `StatusBadge`.
- Usa los tokens de `index.css` (`bg-field`, `text-muted-foreground`, `bg-crit-soft`…). Evita hex sueltos en componentes, salvo en atributos SVG, donde `var()` no es confiable.
- **Copy**: español de Colombia, tuteo, frases cortas. Números con `fmt()` / `fmtPct()` / `money()` de `mock.ts` (es-CO: `1.248`, `1,8`, `−18 %`).

## Reglas de gráficas

- **Una sola escala por gráfica.** Nunca doble eje: clima y productividad van en gráficas separadas.
- Énfasis: la serie protagonista en verde marca `#166534` y la comparación en gris `#87918b`. Leyenda siempre presente con 2 o más series; etiqueta directa solo en el extremo.
- Líneas de 2 px, marcadores ≥ 8 px con anillo blanco de 2 px, cuadrícula de 1 px sólida (nunca punteada), área al 8–10 %.
- Hover con tooltip en todas las gráficas; las etiquetas del cuadrante usan colocación anti-choques (`textWidth`).
- Categorías no se unen con líneas (para P1 vs P2 se usa dumbbell).

## Dirección de arte (feedback del usuario, obligatorio)

- **Minimalista, para video**: cada pantalla debe entenderse en 1 segundo. Una pieza protagonista por módulo y lo mínimo alrededor.
- **Inicio ≠ módulos**: el Inicio es verde, una frase protagonista ("La rotación te costó $162 M este año") y 3 tarjetas con una sola cifra. Los módulos son claros (`bg-canvas`) con tarjetas blancas.
- **Letra grande y aire**: nada por debajo de ~13 px en gráficas ni de ~14 px en UI; títulos de panel de 20 px, cifras de 44–64 px; `p-8` en tarjetas y `gap-8` entre bloques.
- Contenido por módulo (no agregar más sin pedirlo): **Datos** = diagrama de fuentes + 3 cifras + teléfono WhatsApp. **Clima** = Steps de nivel + P1/P2 + 3 cifras + cuadrante + IA + tabla. **Predicción** = Stats-2 + ranking + ficha (anillo + IA) + 4 factores + simulador.

## Reglas de UX (del deck)

1. Primero el hero y el mapa de módulos; el análisis viene después.
2. Transiciones de capítulo sin cortes (`go()` en `App.tsx`, Web Animations sobre `clip-path`/`opacity`): Inicio → módulo, la tarjeta crece a pantalla completa con la portada del módulo; módulo → Inicio, se encoge de vuelta a su tarjeta (`[data-module-card]`); módulo → módulo, fundido con portada. Dentro de Clima, `transition()` hace el drill.
3. Jerarquía persistente sede → departamento → empleado.
4. **Toda pantalla termina en un CTA o una recomendación** (`NextStep`, CTA de la IA).
5. Cambiar de contexto cambia la recomendación de IA automáticamente (streaming con `useStreamedText`).
6. El predictivo en lenguaje simple: nada de "feature importance", "SHAP" ni "logit" en la UI.
7. Toda acción da feedback (`useToast`) y nada es un callejón sin salida.

## Datos demo

- Todo sale de `data/mock.ts` con semilla fija. **No uses `Math.random()` en render**: rompe la repetibilidad del video.
- La historia es intencional: Sede Centro en desgaste (−18 % de clima con 107 % de la meta), Detallado como foco y **María Fernanda López al 78 %**. Si recalibras coeficientes, conserva esa historia y vuelve a verificar las cifras citadas en `GREETINGS_IDEA.md` (riesgos 5/20/61, $162 M, $66,7 M, $19,2 M, simulador 78 → 31 %).
- Para validar cifras: copia `mock.ts`/`ai.ts` a una carpeta temporal y ejecútalos con `node` (Node 24 ejecuta TS directamente).

## Rendimiento (el video no perdona)

- Anima solo `transform` y `opacity`. Las gráficas se mueven con transiciones CSS sobre `transform`.
- Presupuesto: build único **≤ 600 KB**. Si sube mucho, revisa qué dependencia no es tree-shakeable.
- Objetivo: 60 fps en el zoom del hero (medido: 16,7 ms promedio, máximo 17 ms en Chrome headless 1440×900).
- Los `Sheet` se renderizan en un **portal a `body`** (el bloque con `view-transition-name: vt-drill` crea su propio contexto de apilamiento).
- La cortina de capítulo (`z-60`) bloquea clics mientras anima; `busy` evita transiciones encadenadas.

## Verificación (antes de decir "listo")

1. `npm run typecheck` en 0 errores y `npm run build:single` OK (anota el tamaño).
2. Revisión visual del **build final** (no del dev server) en **1440×900** y **1920×1080**, y que **390 px** no tenga scroll horizontal.
   - Si la ventana de Chrome del usuario está oculta, `requestAnimationFrame` no corre y el portal queda estático: no es un bug. Usa Chrome headless por CDP (`--headless=new --remote-debugging-port`, `Emulation.setDeviceMetricsOverride`, `Input.dispatch*`, `Page.captureScreenshot`).
   - Al automatizar clics no hagas `scrollIntoView` sobre elementos sticky del hero: mueve el portal y desactiva su CTA (p > 0,08).
3. Recorre el guion: hero → zoom → vista general → Datos (responder el pulso) → Clima (P1/P2, profundizar hasta María) → Predicción (simulador, Agendar 1:1).
4. Sin errores en consola. Sin textos cortados ni etiquetas superpuestas.

## Forma de trabajo

- Antes de cambiar algo visual, mira el estado actual con una captura; después del cambio, vuelve a capturar y compara.
- Cambios pequeños y verificables; no reescribas módulos completos si basta con ajustar uno.
- No agregues dependencias pesadas para algo que se resuelve con SVG o CSS.
- Si cambias el flujo, las cifras o los atajos, actualiza `GREETINGS_IDEA.md` en la misma sesión.
- El usuario escribe en español: responde en español y conserva el tono del producto.
