# Greetings · Documento general de la idea

> Plataforma SaaS que reduce la rotación en empresas operativas *frontline* (peluquerías, autolavados, talleres automotrices y similares), cruzando **clima laboral** con **productividad real** para decidir qué hacer hoy y anticipar quién podría irse mañana.

Este documento es la base para seguir trabajando de forma ordenada: idea, flujo de usuario, datos, modelo, decisiones de diseño del mockup y próximos pasos. El mockup funcional está en [`greetings-mockup.html`](greetings-mockup.html) y su código en [`app/`](app/).

---

## 1. Problema

En los negocios frontline la rotación es alta y sus costos **no aparecen en ningún reporte**:

| Costo oculto | Qué incluye | Valor demo por salida |
|---|---|---|
| Reclutamiento y selección | Avisos, entrevistas, tiempo del líder | $0,55 M COP |
| Dotación | Uniformes, EPP, herramientas | $0,38 M COP |
| Capacitación | Semanas de entrenamiento y acompañamiento | $0,92 M COP |
| Productividad perdida | Curva de aprendizaje de la persona nueva y sobrecarga del equipo | $1,45 M COP |
| **Total** | | **≈ $3,3 M COP por salida** |

Con 86 colaboradores y 49 salidas al año (57 % de rotación), el costo oculto es **≈ $162 M COP al año**. *Todas las cifras son supuestos del demo y deben validarse con clientes reales.*

El dueño o administrador ve las ventas en el POS, pero no ve **cómo está su gente** ni **quién está a punto de irse**, y se entera cuando ya renunciaron.

## 2. Solución: tres módulos en dos horizontes

| Momento | Módulo | Pregunta que responde | Propuesta de valor |
|---|---|---|---|
| **Momento 0** | **01 · Carga de datos** | ¿Qué datos tengo y están conectados? | Un solo lugar para POS, turnos, colaboradores y pulsos por WhatsApp. |
| **Corto plazo** | **02 · Clima y productividad** | ¿Cómo está mi equipo hoy y qué hago esta semana? | Panel por sede → departamento → empleado, semáforo y recomendación de IA contextual. |
| **Largo plazo** | **03 · Modelo predictivo** | ¿Quién se podría ir en los próximos 90 días y por qué? | Probabilidad de salida por persona (Random Forest), explicada en lenguaje simple y con simulador de acciones. **Es la propuesta de valor más grande.** |

### 2.1 Módulo 1 · Carga de datos (momento 0)

- **Fuentes**: POS (ventas, servicios por operario, ticket promedio), turnos y horarios (asistencia, horas extra, turnos dobles), datos de colaboradores (cargo, antigüedad, edad, código postal) y **Pulsos por WhatsApp**.
- **Pulsos por WhatsApp** (nombre comercial): encuestas de 30 segundos al cierre del turno con respuestas de un toque. Ejemplos:
  - ¿Cómo estuvo tu turno hoy? (Muy bien / Bien / Regular / Difícil)
  - ¿Tuviste lo necesario para trabajar bien hoy? (Sí / Parcial / No)
  - ¿Cómo estuvo el ambiente del equipo? (Bueno / Normal / Tenso)
- **Criterios del canal**: preguntas cortas, cero fricción, frecuencia diaria o semanal, anonimato agregado (desde 4 personas) y datos que alimentan tanto el panel como el modelo.
- **Integración automática vs. carga manual**: si hay integración con el POS (API / MCP), la carga manual queda en segundo plano como respaldo (Excel / CSV con mapeo de columnas).

### 2.2 Módulo 2 · Clima y productividad (corto plazo)

- **Jerarquía persistente**: sede → departamento → empleado (componente *Steps*). Cada nivel profundiza el anterior sin perder contexto.
- **KPIs**: clima laboral (0–100), productividad real (% de la meta del POS), participación en pulsos, alertas activas.
- **Cuadrante clima × productividad** con cuatro lecturas:
  - *Comprometidos*: buen clima y sobre la meta → replicar prácticas.
  - *En desgaste*: rinden, pero con bajo ánimo → el patrón que más anticipa renuncias.
  - *Capacidad sin usar*: buen clima, bajo la meta → ajustar turnos a la demanda.
  - *Desconectados*: bajo ánimo y bajo la meta → empezar por recursos.
- **Semáforo** verde / amarillo / rojo (siempre con ícono + etiqueta).
- **Recomendación de IA** al lado de cada contexto: cambia sola al cambiar de sede, departamento o persona, con acciones sugeridas y un CTA ("Profundizar", "Ver predicción de salida", "Ver acciones").
- **Comparativa P1 vs. P2** (6 semanas contra las 6 anteriores) y tendencias semanales.

### 2.3 Módulo 3 · Modelo predictivo (largo plazo)

- **Salida**: probabilidad de que una persona deje la empresa en los próximos 90 días.
  Semáforo: Alto ≥ 55 % · Medio 30–54 % · Bajo < 30 %.
- **Modelo**: aprendizaje supervisado con **Random Forest**. Cada árbol "vota" y el porcentaje es la proporción de votos por "se va".
- **Variables**:
  - Internas: ánimo en pulsos, productividad y su tendencia, turnos dobles, horas extra, asistencia, antigüedad, cargo, participación en pulsos.
  - **Exógenas**: vacantes similares por código postal, salario de mercado del cargo, distancia casa–trabajo, temporada (primas, vacaciones), desempleo local.
- **Cómo se muestra (muy intuitivo)**: anillo con el %, factores en tarjetas con nivel Bajo/Medio/Alto, "lo que más empuja el riesgo" en barras, recomendación de IA y **simulador "¿Y si actúas?"** (por ejemplo, 1:1 + reducir turnos dobles + revisar compensación + mentor: 78 % → 31 %).

## 3. Flujo de usuario (perfil: administrador)

| # | Pantalla | Contenido | CTA |
|---|---|---|---|
| 0 | **Hero** | Palabra "greetings" (Glyph Portal). Al desplazar, la cámara entra en una letra. | Entrar |
| 1 | **Inicio** | Una frase: "La rotación te costó $162 M este año" + 3 tarjetas (una cifra cada una). | Abrir módulo |
| 2 | **Carga de datos** | Diagrama de 4 fuentes → Greetings, 3 cifras, iPhone con el pulso por WhatsApp (interactivo). | Ver clima y productividad |
| 3 | **Clima y productividad** | Steps de jerarquía, P1/P2, 3 cifras, cuadrante, IA, tabla del nivel. | Profundizar / Ver predicción |
| 4 | **Modelo predictivo** | Cifras grandes, ranking de riesgo, ficha (anillo + IA), 4 factores, simulador. | Agendar 1:1 / Crear plan |

**Reglas del flujo** (del deck):

1. El administrador no entra viendo todo el análisis: primero el inicio y el mapa de módulos.
2. Transición fluida tipo zoom entre vistas, sin cortes bruscos: al entrar, la tarjeta del módulo crece a pantalla completa con su nombre en grande; al salir, el módulo se encoge de vuelta a su tarjeta.
3. Cada módulo profundiza el anterior sin romper el contexto.
4. La navegación analítica escala siempre por jerarquía: sede → departamento → empleado.
5. Cada pantalla tiene un CTA o una recomendación clara.
6. El contexto seleccionado cambia la recomendación automáticamente.
7. El predictivo se explica en lenguaje simple, nunca técnico.

## 4. Datos y variables

| Variable | Fuente | Módulo 2 | Módulo 3 |
|---|---|---|---|
| Ventas y servicios por operario | POS | Productividad | Tendencia de rendimiento |
| Asistencia, horas extra, turnos dobles | Turnos / biométrico | Contexto | Carga |
| Antigüedad, cargo, edad, código postal | Nómina / RR. HH. | Filtros | Antigüedad, mercado |
| Ánimo, recursos, ambiente, eNPS | Pulsos por WhatsApp | Clima | Ánimo |
| Vacantes similares por código postal | Portales de empleo (externo) | — | Mercado |
| Salario de mercado, desempleo local | Fuentes públicas (externo) | — | Mercado |

## 5. Sobre los "4 a 5 años" de datos para el modelo

La cifra de 4–5 años es arbitraria. Lo que determina si el modelo funciona no son los años, sino la **cantidad de salidas observadas** (los "eventos" de los que aprende):

- En frontline, con rotación de 40–60 % anual, una empresa de 80–100 personas acumula **40–60 salidas por año**. Un Random Forest razonable necesita del orden de **cientos de eventos**, así que una sola pyme tardaría años.
- **Recomendación de arranque en frío**: entrenar un **modelo base sectorial** con datos agregados y anonimizados de todos los clientes del mismo vertical (peluquerías, autolavados, talleres), y ajustarlo por empresa a medida que acumula historia. Así el módulo 3 aporta valor desde los primeros meses y no a los 4 años.
- Mientras no haya historia suficiente, el módulo 3 puede mostrar un **índice de riesgo por reglas** (las mismas señales del módulo 2) marcado como "preliminar".
- Métricas para validar: AUC, *recall* en el top 10 % de riesgo, calibración (que 70 % signifique 70 %) y estabilidad mes a mes.
- **Ética y privacidad**: no usar variables protegidas (género, estado civil, etc.) como predictores; auditar sesgos por edad; anonimato de pulsos por debajo de 4 personas; riesgo individual visible solo para el administrador; tratamiento conforme a la **Ley 1581 de 2012 (Habeas Data)**.

## 6. Números del demo (ficticios, deterministas)

Empresa demo: cadena de autolavados, 4 sedes (Norte, Centro, Sur, Este), 4 departamentos por sede (Lavado, Detallado, Atención y caja, Lubricación), 86 personas.

- Historia que cuentan los datos: **Sede Centro produce más que nunca (107 % de la meta), pero su clima cayó 18 % (71 → 58)**. Es el patrón de desgaste. El foco rojo es **Detallado** (clima 45, turnos dobles y vacantes cerca).
- Protagonista: **María Fernanda López** (Centro · Detallado), **78 %** de probabilidad de salida. Lo que más pesa: ánimo 41/100, 11 turnos dobles al mes y 34 vacantes similares a menos de 3 km.
- Empresa: 5 personas en riesgo alto, 20 en medio, 61 en bajo; ~20 salidas esperadas en 90 días (≈ $66,7 M COP); **$19,2 M COP evitables** si se retiene la mitad de las salidas en riesgo medio y alto.

Todo se genera en [`app/src/data/mock.ts`](app/src/data/mock.ts) con semilla fija: cada grabación muestra exactamente lo mismo.

## 7. El mockup

- **Abrir**: doble clic en [`greetings-mockup.html`](greetings-mockup.html). Es un único archivo (~500 KB) sin dependencias externas: funciona sin internet y sin servidor. Recomendado: Chrome o Edge actualizados (la transición de zoom entre vistas usa la *View Transitions API*; en otros navegadores el cambio es directo).
- **Atajos para grabar el video** (presiona `?` dentro del mockup para verlos):
  - `→` siguiente paso (en el hero, reproduce el zoom) · `←` paso anterior
  - `1` `2` `3` saltan a Datos, Clima y Predicción · `0` vista general · `R` repite el hero · `Esc` cierra paneles
- **Componentes de 21st.dev usados**: Glyph Portal (hero, sin modificar), Steps de Ark UI (jerarquía), Stats-2 (cifras del predictivo) y Dashboard-4 (implementación propia, porque el md solo traía el import).

### Guion sugerido para el video del pitch (~90 s, 1920×1080)

| Tiempo | Acción | Mensaje |
|---|---|---|
| 0:00 | Hero quieto 2 s, pasar el mouse por las letras. `→` | "Lo que tu POS no te cuenta de tu equipo." |
| 0:05 | Termina el zoom → Inicio: "La rotación te costó **$162 M** este año" | El costo oculto de la rotación. |
| 0:12 | Clic en *Carga de datos*. Responder el pulso en el iPhone | 30 segundos por WhatsApp; llega la notificación. |
| 0:28 | `2` → Clima. Cuadrante: Centro *en desgaste*. Esperar el texto de la IA | La IA explica y propone qué hacer. |
| 0:40 | Cambiar P1 → P2 (los puntos se mueven). *Profundizar en Centro* → *Detallado* | De la sede a la persona, sin perder el contexto. |
| 0:55 | En María: *Ver predicción de salida* | 78 % de probabilidad de salida y por qué. |
| 1:05 | *¿Y si actúas?* activar las 4 acciones: 78 % → 31 %. *Agendar 1:1* | De predecir a actuar. |
| 1:20 | `0` → el módulo se encoge de vuelta al Inicio | Cierre. |

## 8. Decisiones de diseño (y diferencias con el deck)

- **Estética**: la del Glyph Portal (papel blanco, verde bosque `#0b3b2a`, Plus Jakarta Sans) llevada a todo el producto con lenguaje iOS: radios grandes, vidrio en la barra, control segmentado, interruptores, notificaciones tipo *Dynamic Island* y hojas laterales. **Sin gradientes** (regla del deck).
- **Copy en español** (también en el hero, que en el deck estaba en inglés), tuteo y formato numérico es-CO.
- La gráfica de la diapositiva 6 (línea que une sedes) se reemplazó por un **cuadrante clima × productividad** y un **dumbbell P1 → P2** en la tabla: comparar categorías con una línea sugiere una continuidad que no existe.
- Clima y productividad nunca comparten eje: van en **gráficas separadas** (pequeños múltiplos).
- El 78 / 15 / 7 % de la diapositiva 7 se reemplazó por los **umbrales del semáforo** y la distribución del equipo, más fáciles de entender.

## 9. Próximos pasos y preguntas abiertas

1. Validar con 3–5 negocios reales el costo por salida y la tasa de rotación (son la base del caso de negocio).
2. Definir el set mínimo de preguntas del pulso y su frecuencia (diaria vs. semanal) según la tasa de respuesta.
3. Elegir el primer vertical (autolavados, peluquerías o talleres) para el modelo base sectorial.
4. Diseñar el consentimiento y la política de datos (Habeas Data) desde el primer pulso.
5. Definir precios (¿por colaborador activo al mes?) y el plan del piloto.
6. Diseñar vistas para el líder de sede (rol distinto al administrador) y para móvil.
