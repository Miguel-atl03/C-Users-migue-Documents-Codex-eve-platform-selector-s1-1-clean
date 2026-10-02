# EVE — Concepto de producto final

**Versión:** 1.1  
**Fecha:** 2026-08-26  
**Estado:** guía canónica de diseño y producto para el lienzo oficial (`eve-official-canvas`)  
**Formato fuente:** Markdown (genera `.docx` homólogo en Descargas y `docs/eve/visual/`)

---

## 1. Identidad en una frase

**EVE** (*Enterprise Viability Engine*) es un **instrumento de captura diagnóstica** donde una persona reconstruye, con precisión auditable, cómo ocurre realmente su trabajo — para que consultores y motores downstream lean la arquitectura operativa de la empresa con trazabilidad.

**Strapline de producto:** Strategic & Operational Architecture / Enterprise Viability Engine  

**Tagline de marca:** *Lo que sostiene no siempre se ve. Una forma distinta de mirar.*

---

## 2. Qué es EVE (y qué no es)

### EVE es

- Un **espacio de levantamiento estructural** continuo (hoja de trabajo, no wizard).
- Un **instrumento de medición operativa** con preguntas canónicas, inferencia asistida y cierre arquitectónico.
- Un sistema que **preserva la semántica** del instrumento de recolección y produce salidas auditables.
- Una experiencia donde el usuario **testifica su operación real**; la plataforma decide internamente secuencia, soporte y aclaraciones.
- Un producto orientado a **viabilidad empresarial**: hacer visible lo que sostiene el negocio pero no se ve en el día a día.

### EVE no es

- Un formulario genérico, survey SaaS ni Typeform.
- Un dashboard de productividad, BI o KPIs.
- Un chat conversacional que disfraza un cuestionario.
- Un wizard gamificado con barras de progreso ruidosas.
- Una herramienta que expone al usuario la maquinaria interna (brechas MMABP, VSM, actividades soporte, inferencias).

---

## 3. Promesa de producto

> **Hacer visible la arquitectura operativa de una empresa — empezando por el trabajo real de una persona.**

La promesa tiene tres capas:

1. **Captura fiel** — Lo que el usuario describe corresponde a trabajo real, no a autoetiquetas abstractas.
2. **Estructura legible** — Las respuestas se organizan para diagnóstico sistémico (MMABP, cadena de valor, roles regulatorios).
3. **Trazabilidad** — Todo lo inferido, aclarado o cerrado puede explicarse; nada se inventa.

---

## 4. Sensación que debe proyectar

| Dimensión | Sensación objetivo | Evitar |
|---|---|---|
| Ritmo | Calma estructural, sin prisa visual | Urgencia artificial, animaciones distractoras |
| Tono | Seriedad intelectual, respeto al oficio | Infantilización, corporativismo vacío |
| Relación | Acompañamiento preciso, no examen | Sensación de evaluación o auditoría hostil |
| Descubrimiento | Revelación gradual de estructura | Abruptitud, saltos entre modos dispares |
| Confianza | Competencia silenciosa del sistema | Exposición de lógica interna o jerga técnica |

**Tono emocional meta:** claro, sobrio, confiable — como entrar a un estudio de arquitectura o a una mesa de revisión técnica.

---

## 5. Concepto de diseño: Hoja de trabajo monumental

### Metáfora central

Una **hoja continua** donde cada fase del recorrido es una **sala del mismo edificio**, no una pantalla aislada.

El usuario no “avanza pasos”; **atraviesa salas** que se revelan sobre la misma superficie de trabajo.

### Salas del recorrido (orden lógico)

1. **Acceso** — identidad y entrada al espacio de trabajo.
2. **Posición** — desde dónde participa y qué tan cerca está de las decisiones.
3. **Mapa de trabajo** — responsabilidades y actividades reales.
4. **Significado / B0** — significado operativo de la actividad seleccionada.
5. **Runtime B0.5–B7** — bloques de captura estructurada por escena (Instrumento).
6. **Cierre** — consistencia, aclaraciones puntuales, completitud del levantamiento.

### Nombre del patrón visual por bloque

**Instrumento** — cada bloque runtime es una pieza de medición: slots, opciones, help y aclaraciones dispuestos con precisión tipográfica, sin cromatismo decorativo.

### Espacio sobre información

El vacío no es margen decorativo: es el **protagonista compositivo** de la hoja.

- El contenido visible debe ocupar aproximadamente **25% del área**; el resto es plano abierto.
- Las preguntas, opciones y acciones viven como **eventos dispersos** sobre la superficie, no como bloques que llenan el centro.
- Las líneas estructurales (`--eve-line`) marcan arquitectura del void, no decoración.

Referencia compositiva: `deliverables/design/eve-concepto-propuesta-v2.html` (propuesta concepto v2 · hoja monumental).

### La línea delgada: opciones como inscripciones

Esta es la tensión central del concepto de hoja de trabajo. EVE debe capturar respuestas estructuradas **sin** que el participante sienta que sigue reglas de un formulario.

En cuanto las opciones se presentan como **listado** — columna vertical centrada, stack uniforme, tipografía de lectura, gap de menú — la hoja deja de ser un **plano monumental** y se convierte en un **cuestionario**. El usuario percibe instrucciones que cumplir, no inscripciones sobre las que deja su marca.

La clave no es ocultar las opciones ni eliminar la selección. Es cambiar su **estatus ontológico** en pantalla:

| Formulario (rompe el concepto) | Inscripción (sostiene el concepto) |
|---|---|
| Stack vertical centrado | Islas posicionadas en el vacío |
| Tipografía de lectura para todas las opciones | Tipografía susurro (`--eve-mist`, ~11px) hasta activación |
| Gap uniforme entre ítems (menú) | Separación arquitectónica: columnas, void, asimetría |
| “Elige una de estas opciones” | “Estas frases ya están en la hoja; tú marcas cuál resuona” |
| Densidad que llena el centro | Contenido periférico; void como centro |
| Radio, checkbox, borde o caja de selección | Activación por peso + tinta (`mist` → `ink`) |

#### Reglas compositivas para opciones seleccionables

1. **Islas, no stacks** — Agrupar pregunta + opciones en islas compositivas separadas por void. En salas como Posición: máximo **dos islas** visibles (p. ej. participación | proximidad a decisiones), no bloques apilados en una sola columna central.
2. **La pregunta es el evento tipográfico** — Inscripción en mayúsculas espaciadas o peso alto; las opciones son consecuencia tipográfica secundaria, no el bloque dominante.
3. **Opciones en susurro** — Estado inactivo: `--eve-mist`, peso regular, tamaño reducido. Estado activo: `--eve-ink`, peso semibold/bold. Sin bordes, fondos, radios ni iconografía de control.
4. **Selección sin caja** — Nunca radio button, checkbox, pill, chip ni borde de foco visible como control de formulario. La interacción se manifiesta solo en la tipografía.
5. **Distribución espacial, no catálogo** — Con muchas opciones (bloques Instrumento): distribuir en el plano (columnas, bandas, grid asimétrico con void) o revelar por banda. Prohibido el scroll de catálogo vertical tipo menú de respuestas.
6. **Una traza de acción** — Acciones primarias como subrayado o bracketed en el borde del plano (`GUARDAR`, `[ COMIENZA TU LEVANTAMIENTO ]`), no botón primario que compita con el void.
7. **Accesibilidad sin romper la gramática** — Mantener roles ARIA (`radiogroup`, `aria-pressed`) y foco usable; la accesibilidad no justifica revertir a controles visuales de formulario.

#### Límites de la línea delgada

Empujar demasiado hacia lo monumental degrada la captura funcional. Equilibrio obligatorio:

- Legibilidad suficiente para distinguir opciones sin esfuerzo excesivo.
- Área clicable/tappable adecuada aunque visualmente sea solo texto.
- En bloques Instrumento con alta densidad de slots, la **proporción void/contenido** sigue siendo regla compositiva aunque la densidad suba respecto al vestíbulo.

#### Aplicación por sala

| Sala | Composición esperada |
|---|---|
| **Posición (Estado A)** | Dos islas en plano inferior, separadas por void vertical; preguntas como inscripciones; opciones susurro |
| **Mapa de trabajo** | Bandas estructurales con aire; captura como anotación sobre la hoja, no tabla densa |
| **Instrumento (B05–B7)** | Slots con precisión tipográfica; opciones distribuidas en plano o banda, nunca listado vertical centrado |
| **Micro-aclaraciones** | Texto de trinchera como inscripción única; respuesta como línea de escritura, no campo encajonado |

---

## 6. Principios de diseño (obligatorios)

### P1 — Tipografía como arquitectura

Las preguntas son **inscripciones**, no labels de formulario. Jerarquía por escala, tracking, columnas y aire — no por cajas ni tarjetas repetitivas.

### P2 — Monocromía con intención

- Fondo claro (`#fafbfc` / off-white)
- Tinta oscura (`#12141a`)
- Acento frío único (`#5c7d8f`)
- Sin gradientes decorativos, sombras ni iconografía ornamental

### P3 — Una gramática visual para todo el recorrido

Login, posición, workmap, significado y bloques B05–B7 comparten la misma familia visual. Solo varía la **densidad** de contenido, no el lenguaje de diseño.

### P4 — Contenedor sobrio, voz humana

El marco visual es neutral y monumental. El copy de preguntas, help y micro-aclaraciones usa **lenguaje de trinchera**: cercano, concreto, sin jerga de motor.

### P5 — Revelación, no wizard

No usar “Paso 3 de 12” como eje de navegación. El lienzo se despliega; las salas aparecen cuando corresponde al flujo de sesión.

### P6 — Autoridad silenciosa del sistema

EVE decide internamente: actividad soporte, inferencias (p. ej. misión 1.2), aclaraciones por inconsistencia. La UI comunica **necesidad de información**, no arquitectura interna.

### P7 — Instrumento antes que interfaz

Controles alineados a familia matriz (selección única, texto, aclaración condicional). Cada slot tiene trazabilidad (`field_key` / futuro `slot_ref`). Sin secuenciador local que compita con Runtime.

### P8 — Fidelidad metodológica

Jerarquía de autoridad para contenido:

1. Documento Madre del bloque (semántica, opciones, help, UX)
2. Matriz Conformance Runtime↔UI (contratos de slot y tipo)
3. Lienzo oficial (`eve-official-canvas`)
4. QA: no perder ni inventar

### P9 — Conservadurismo ante datos ausentes

Nunca fabricar respuestas. Campos no reconstruibles: vacío o marcador explícito (`PENDIENTE` / `NO CAPTURADO`).

### P10 — Auditabilidad sobre pulido cosmético

Priorizar salidas reproducibles por `sessionId` y trazabilidad consultor sobre efectos visuales.

### P11 — Espacio sobre información; opciones como inscripciones

El vacío es protagonista (~75% del plano). Las opciones seleccionables no son ítems de listado ni controles de formulario: son **inscripciones susurradas** que el participante activa con peso y tinta. Composición por islas y void, nunca por stack vertical centrado que lea como menú de respuestas.

---

## 7. Gramática visual (tokens y composición)

### Tokens de color

| Token | Uso |
|---|---|
| `--eve-sheet` | Fondo principal de hoja |
| `--eve-ink` | Texto principal |
| `--eve-mist` | Texto secundario, metadatos |
| `--eve-line` | Divisores estructurales |
| `--eve-accent` | Acento puntual (no decoración masiva) |
| `--eve-graphite` | Intro oscura opcional (acceso) |

### Tipografía

- Display: serif o sans sobria para titulares monumentales.
- Cuerpo: sans limpia para preguntas, opciones y help.
- Tracking amplio en metadatos de marca y kickers.
- Mayúsculas espaciadas para inscripciones de alto nivel.

### Composición

- Alto uso de espacio negativo (respiración); **~75% void / ~25% contenido** como referencia compositiva.
- Columnas e islas cuando hay contraste conceptual (p. ej. posición vs. proximidad a decisiones).
- Acciones mínimas: texto subrayado o bracketed (`[ COMIENZA TU LEVANTAMIENTO ]`, `GUARDAR`).
- Sin wall of cards; alternar secciones abiertas con bandas estructurales.
- Líneas estructurales (`--eve-line`) para marcar void arquitectónico, no para enmarcar controles.

### Opciones seleccionables (gramática tipográfica)

| Elemento | Inactivo | Activo / seleccionado |
|---|---|---|
| Color | `--eve-mist` | `--eve-ink` |
| Peso | 400–500 | 600–700 |
| Tamaño | ~11px (susurro) | ~11px (mismo tamaño; cambia peso/tinta) |
| Contenedor | ninguno | ninguno |
| Alineación | según isla (izq. / der.) | igual que inactivo |
| Max-width | ~30–34ch por columna de opciones | — |

La pregunta asociada usa escala superior (inscripción): mayúsculas espaciadas o peso 700, ~12px, `--eve-ink`.

---

## 8. Tono y voz

### Voz de marca (UI)

- Declarativa, no imperativa agresiva.
- Filosófica en el vestíbulo; operativa en los bloques.
- Español claro; evitar anglicismos innecesarios en superficie usuario.

### Micro-aclaraciones (inconsistencias)

Estructura obligatoria:

1. Comentario de trinchera
2. “A lo que me refiero es…”
3. “Por ejemplo…” (contextualizado a la actividad)
4. Pregunta breve de aclaración

### Lo que nunca decir al usuario

- Referencias a MMABP, VSM, S3, brechas, slot_ref, InteractionViewModel.
- “Selecciona actividad soporte”, “elige candidata”, “confirma recomendación del motor”.

### Lo que sí decir

- “Necesitamos un poco más de información para completar el levantamiento.”
- “Hemos terminado las actividades principales.”
- Aclaraciones concretas sobre la actividad descrita.

---

## 9. Roles y responsabilidades en la experiencia

| Actor | Responsabilidad |
|---|---|
| **Participante** | Describir trabajo real cuando el flujo lo solicita; responder lo que la plataforma presenta |
| **Plataforma** | Seleccionar actividades, inferir cuando corresponde, detectar brechas, incorporar soporte, pedir aclaraciones, cerrar |
| **Consultor** | Revisar salidas auditables; no intervenir en decisiones ya gobernadas por el sistema en captura |

---

## 10. Anti-patrones (prohibidos)

- Dashboards con charts, KPIs o tarjetas BI.
- Ilustraciones “friendly”, mascotas, emojis como UI.
- Progress bars gamificados.
- Exposición de lógica de cierre, selección soporte o scoring de confianza al participante.
- Rediseño del instrumento de recolección por conveniencia visual.
- Segunda ontología de preguntas en UI paralela al catálogo canónico.
- Mockups o exploraciones visuales descartadas como referencia de implementación.
- **Listas verticales centradas de opciones** — stack tipo menú de respuestas que rompe el plano monumental.
- **Grids de opciones que llenan el centro** del plano sin void dominante.
- **Controles de formulario visibles** — radio, checkbox, pill, chip, borde de selección, fondo de estado.
- **Tipografía de lectura para opciones inactivas** — tamaño de cuerpo (≥14px) que compite con la inscripción de la pregunta.
- **Scroll de catálogo de respuestas** — columna larga de opciones apiladas como survey.

---

## 11. Checklist de evaluación de cualquier pantalla nueva

Antes de aprobar una superficie visual en el lienzo, verificar:

1. ¿Proyecta calma estructural y seriedad intelectual?
2. ¿Usa la gramática visual EVE (tokens, tipografía, monocromía)?
3. ¿Las preguntas respetan Madre + Matriz sin inventar copy?
4. ¿El usuario ve necesidad de información, no maquinaria interna?
5. ¿Es continua con las salas anteriores del recorrido?
6. ¿Evita anti-patrones (cards, BI, wizard ruidoso)?
7. ¿Mantiene trazabilidad de datos y proveniencia?
8. ¿Está lista para binding Runtime futuro sin secuenciador local?
9. ¿El void domina la composición (~75% plano abierto)?
10. ¿Las opciones se leen como inscripciones susurradas, no como listado de formulario?
11. ¿La selección se manifiesta solo con peso + tinta, sin cajas ni controles visibles?
12. ¿Las preguntas y opciones están distribuidas en islas/bandas, no apiladas en columna central?

---

## 12. Implementación de referencia

| Elemento | Ubicación |
|---|---|
| Lienzo oficial | `src/components/eve-official-canvas/OfficialCanvasExperience.tsx` |
| Patrón Instrumento | `OfficialCanvasB1InstrumentSection` … `B5InstrumentSection`, `OfficialCanvasB05Section` |
| Tokens visuales | `official-canvas.module.css`, `canvas-b1-instrument.module.css` |
| Metodología UI bloques | `docs/eve/runtime/materialized/` (UI-B05 … UI-B5) |
| Composición monumental (referencia) | `deliverables/design/eve-concepto-propuesta-v2.html`, `.png` |
| Estado A (implementación actual) | `OfficialEstadoASection.tsx` — pendiente alineación a islas + susurro |

**Previews aislados** (`/dev/ui-b1` … `/dev/ui-b5`) son taller de fabricación; la referencia productiva es el lienzo en `localhost:3112`.

---

## 13. Posicionamiento competitivo implícito

EVE compite conceptualmente con:

- Form builders → **Gana en estructura diagnóstica y trazabilidad**
- HR / engagement surveys → **Gana en profundidad operativa real**
- Process mining tools → **Gana en captura vivida desde la experiencia del trabajador**
- Consulting deliverables estáticos → **Gana en reconstrucción reproducible y auditable**

No compite en velocidad de llenado ni en “UX divertida”. Compite en **calidad arquitectónica del levantamiento**.

---

## 14. Evolución del documento

Este concepto es la base para:

- Fabricación de bloques UI restantes (B6, B7 si aplica).
- Integración al flujo productivo cuando el lienzo salga de reparación.
- Revisiones de copy, tokens y composición en `eve-official-canvas`.
- Criterio de rechazo de propuestas visuales que rompan la gramática.

**Próxima revisión:** cuando Estado A y el primer bloque Instrumento integren composición de islas + susurro al flujo productivo.

**Cambios v1.1:** línea delgada (opciones como inscripciones), reglas compositivas, P11, anti-patrones de listado, checklist ampliado.

---

*Documento canónico EVE — Concepto de producto final v1.1*
