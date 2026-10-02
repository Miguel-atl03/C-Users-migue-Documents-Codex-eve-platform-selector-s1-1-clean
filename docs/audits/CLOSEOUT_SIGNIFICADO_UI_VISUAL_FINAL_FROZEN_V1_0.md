# CLOSEOUT · Significado de tu trabajo — UI visual final congelada V1.0

## 1. Dictamen ejecutivo

**SIGNIFICADO_UI_VISUAL_V1_0_FROZEN**

La interfaz visual y de front-end de la pantalla **Significado de tu trabajo** queda **congelada** en la versión resultante de las pasadas A, B y C (junio 2026). Esta versión es la referencia canónica para revisión con Miguel, QA visual y cualquier evolución posterior del Runtime Block 0.

**Veredicto:** la pantalla cumple el objetivo de revisión y confirmación de actividad con carga cognitiva reducida, paleta minimalista neutra, layout coherente con WorkMap y comportamiento responsive en desktop, tablet y móvil.

**Regla de congelamiento:** cambios en `SignificadoDeTuTrabajo.tsx` o `significado-de-tu-trabajo.module.css` que alteren jerarquía visual, colores, densidad, responsive o patrones de interacción de esta pantalla requieren un nuevo closeout visual explícito. Cambios puramente funcionales (persistencia, wiring, motores) pueden coexistir si no deforman la UI congelada.

**Versión registrada:** `SIGNIFICADO_UI_VERSION = "1.0.0-frozen"` en `src/features/significado/significado-copy.ts`.

---

## 2. Dónde opera la pantalla

### 2.1 Flujo principal (producción)

| Contexto | Ubicación | Modo layout |
|---|---|---|
| Sesión EVE tras guardar WorkMap | `src/app/page.tsx` | `embedded` (default) |
| Estado de flujo | `flowState === "intake_significado"` | Sin sidebar propio; usa shell de `page.tsx` |
| Transición entrada | Desde `intake_work_map` vía `setFlowState("intake_significado")` | — |
| Transición salida | `onContinue` → `submitSignificadoIntake` | Hacia cuestionario principal |
| Retorno | `onBack` → `setFlowState("intake_work_map")` | Volver al mapa |

La pantalla solo se monta si existe `workMap` guardado. Sin mapa, `page.tsx` muestra un fallback mínimo con CTA «Volver al mapa de trabajo».

### 2.2 Ruta de desarrollo / QA visual

| Contexto | Ubicación | Modo layout |
|---|---|---|
| Dev standalone | `src/app/dev/significado/page.tsx` | `standalone` |
| URL local | `http://localhost:3000/dev/significado` | Shell completo EVE (sidebar + main) |
| Fixture | `createSignificadoBlock0DevWorkMap()` + `DEV_VISUAL_DRAFT` | Actividad financiera demo, usuario «Miguel García» |
| Session dev | `SIGNIFICADO_DEV_SESSION_ID` en `significado-dev-fixture.ts` | Draft aislado |

### 2.3 Qué NO es esta pantalla

- No es el cuestionario Runtime completo (40/20).
- No expone selección de actividades, ranking, gates, payload ni IDs técnicos al usuario.
- No sustituye WorkMap (`WorkMapIntake`); la precede en el embudo de captura.

---

## 3. Mapa de carpetas y archivos del slice

```
external-consumers/eve-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Montaje en flowState intake_significado
│   │   └── dev/significado/page.tsx          # QA visual standalone
│   ├── components/significado/
│   │   ├── SignificadoDeTuTrabajo.tsx        # Componente UI principal (FREEZE)
│   │   └── significado-de-tu-trabajo.module.css  # Estilos propios (FREEZE)
│   ├── features/significado/
│   │   ├── significado-copy.ts               # Copy canónico + SIGNIFICADO_UI_VERSION
│   │   ├── runtime-block0-canonical.ts       # Preguntas B0-Q01…Q04, ayudas, epistemicState
│   │   ├── significado-draft-state.ts        # Draft local, submit gate, payload builder
│   │   └── significado-dev-fixture.ts        # IDs y fixtures de dev
│   ├── services/
│   │   └── significado-draft.ts              # localStorage por sessionId
│   └── domain/
│       └── significado-de-trabajo.ts         # Contratos SignificadoSubmitPayload
├── tests/regression/
│   ├── significado-de-trabajo-slice.test.ts  # Regresión del slice (16 tests)
│   ├── significado-mba-alignment.test.ts     # Allowlist de diffs MBA
│   ├── significado-flow-wiring.test.ts       # Cableado de flujo
│   └── significado-activity-anchor-adapter.test.ts
└── docs/audits/
    └── CLOSEOUT_SIGNIFICADO_UI_VISUAL_FINAL_FROZEN_V1_0.md  # Este documento
```

### Dependencias visuales compartidas (no congeladas como parte de Significado, pero consumidas)

| Recurso | Archivo | Uso en Significado |
|---|---|---|
| Shell WorkMap | `src/components/work-map-intake.module.css` | Grid fila, tarjeta, footer, sidebar, botones base |
| Header de flujo | `src/components/client/ClientFlowHeader.tsx` | Título, subtítulo, pill de usuario |
| Logo | `src/components/EveLogo.tsx` | Sidebar standalone |
| Selector de actividad principal | `src/services/primary-activity-selector.ts` | Título y conteo «Actividad N de M» (interno) |

---

## 4. Componente principal y subcomponentes

### 4.1 `SignificadoDeTuTrabajo` (exportado)

**Props operativas:**

| Prop | Tipo | Rol |
|---|---|---|
| `workMap` | `WorkMapData` | Fuente de actividad y validación de guardado |
| `sessionId` | `string` | Clave de draft en localStorage |
| `primaryActivitySelectionResult` | opcional | Override de actividad principal seleccionada |
| `layout` | `"embedded"` \| `"standalone"` | Shell con o sin sidebar EVE |
| `userDisplayName` | string | Pill de usuario |
| `initialVisualDraft` | `Partial<SignificadoVisualDraft>` | Prefill visual Block 0 (dev / futuro wiring) |
| `disabled` | boolean | Bloquea acciones durante guardado |
| `onContinue` | `(SignificadoSubmitPayload) => void` | Submit al salir de la pantalla |
| `onBack` | `() => void` | Volver al mapa |

**Subcomponentes internos (no exportados):**

| Componente | Función visual / operativa |
|---|---|
| `SignificadoJourneySteps` | Pasos 1–5 del sidebar; paso 5 activo |
| `SignificadoUserPill` | Avatar + nombre en header |
| `QuestionRow` | Fila pregunta izquierda / respuesta derecha; `data-row-state` |
| `RuntimeBlock0Question` | Render de cada pregunta canónica B0-Q01…Q04 |
| `FrequencyOption` | Chips de frecuencia (single_choice) |
| `renderAnswerField` | Input, textarea o radios según `responseKind` |

**Tipo exportado:** `SignificadoVisualDraft = Record<string, string>` — respuestas Block 0 en estado local de UI.

### 4.2 Preguntas Block 0 visibles (Runtime canónico)

| ID | Sección UI | Tipo respuesta | Subcampos |
|---|---|---|---|
| B0-Q01 | Confirmar actividad | `compound` | action_verb, input_or_object, procedure_or_standard, output_or_result |
| B0-Q02 | Descripción operativa | `textarea` | — |
| B0-Q03 | Frecuencia y contexto | `compound` | frequency_base (single_choice), typical_context, primary_actor_scope |
| B0-Q04 | Inicio y cierre | `textarea` | — |

Fuente de definición: `RUNTIME_BLOCK0_CANONICAL_QUESTIONS` en `runtime-block0-canonical.ts`.

---

## 5. Características visuales congeladas (Pasadas A + B + C)

### 5.1 Principios de diseño

- **Minimalismo:** paleta neutra gris; sin iconos de estado por fila; sin badges epistemológicos visibles al usuario.
- **Jerarquía:** título de sección → pregunta → ayuda secundaria → campos.
- **Carga cognitiva:** ayuda colapsable fuera de foco; ayuda oculta en filas completadas hasta re-edición.
- **Coherencia WorkMap:** patrón tabla pregunta izquierda / respuesta derecha (`workMapRow`).

### 5.2 Tokens CSS (`significado-de-tu-trabajo.module.css`)

Definidos en `.significadoSurface` y `.significadoSidebar`:

- Acento: `#4d4d4d` (gris oscuro, no verde)
- Fondos suaves: `#f5f5f5`, `#fafbfc`, `#f9fafb`
- Bordes input: `rgba(77, 77, 77, 0.18–0.26)`
- Prefill: fondo `#fafafa`, borde sutil
- Focus ring: `rgba(77, 77, 77, 0.12)`

### 5.3 Zonas de la pantalla

| Zona | Clases / patrones | Comportamiento visual |
|---|---|---|
| Header | `ClientFlowHeader` + `pageHeader` | Título, subtítulo, pill usuario |
| Tarjeta principal | `workMapCard` + `significadoSurface` | Contenedor blanco con borde |
| Header tarjeta | `significadoCardHeader` | Título «Actividad que revisas» + badges progreso |
| Banner actividad | `cardTopNotice` + `activityBanner` | Texto literal de actividad; fondo neutro |
| Tabla preguntas | `significadoWorkTable` | Encabezado oculto (`tableHeaderMuted`, `aria-hidden`) |
| Fila pregunta | `questionRow` + `data-row-state` | Barra lateral sutil; stack en ≤900px |
| Columna prompt | `sectionPromptCopy` | Jerarquía tipográfica; ayuda en nota con borde gris |
| Columna respuesta | `answerPanel` + `compoundFields` | Inputs, textareas, chips frecuencia |
| Footer | `significadoCardFooter` + `footerContinueHint` | Hint en caja suave + CTA gris oscuro |
| Sidebar (standalone) | `significadoSidebar` | Pasos journey + tarjeta actividad actual |

### 5.4 Estados de fila (`data-row-state`)

| Estado | Condición | Efecto visual |
|---|---|---|
| `pending` | Faltan respuestas en la pregunta | Prompt y ayuda visibles según reglas de foco |
| `complete` | Todos los subcampos/valor rellenos | Prompt atenuado (`opacity: 0.88`); ayuda oculta hasta `:focus-within` |

### 5.5 Ayuda contextual (help text)

- Atributo `data-help-kind`: `canonical` | `fallback_no_canonico` (no visible como texto).
- B0-Q01: enunciado como subtítulo; sin bloque help separado en columna izquierda.
- B0-Q02: solo help text (sin enunciado duplicado).
- B0-Q03 / B0-Q04: enunciado + help text.
- Fuente canónica documentada en `CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_HELP_TEXT_FIX_V0_7.md`.

### 5.6 Campos prellenados

- Estilo `prefilledInput` en inputs/textarea cuando `epistemicState` es `inferred_from_workmap` o `context_from_workmap`.
- Sin etiqueta «Prellenado desde WorkMap» visible (metadata interna preservada).

### 5.7 Responsive (Pasada C)

| Breakpoint | Comportamiento |
|---|---|
| Desktop (>900px) | Grid 240px + flexible; dos columnas |
| Tablet (≤900px) | Filas apiladas; pregunta arriba, campos abajo; fondo `#f9fafb` en prompt |
| Móvil (≤768px) | Shell una columna; journey en grid 2 cols; CTA ancho completo 44px; inputs 16px |
| `prefers-reduced-motion` | Sin transiciones ni máscaras de fade |

### 5.8 Contraste (WCAG AA orientado)

- Texto secundario / ayuda: `#6b7280` mínimo 11px.
- Texto principal: `#272a32`, `#374151`, `#4d4d4d`.

---

## 6. Características operativas (no congeladas en detalle, pero acopladas a la UI)

| Mecanismo | Archivo | Comportamiento |
|---|---|---|
| Draft local | `significado-draft.ts` | `localStorage` key `eve:capa1:significado-draft:v1:{sessionId}` |
| Hidratación | `significado-draft-state.ts` | `hydrateDraftFromWorkMap` al montar |
| Submit gate | `evaluateSignificadoSubmitGate` | Requiere `workMap.isSaved`; bloquea CTA si no |
| Warnings | `savedWithWarnings` + `acknowledgeSavedWithWarnings` | Banner con botón «Entendido, continuar» |
| Payload | `buildDraftSubmitPayload` | `SignificadoSubmitPayload` con snapshot WorkMap |
| Progreso visual | `countBlock0VisualProgress` | Badge «N/M preguntas» en header |
| Actividad mostrada | `selectPrimaryActivitiesFromWorkMap` | Primera actividad principal; sin selector UI |
| Respuestas Block 0 | `visualDraft` state local | **Aún no persistidas** en Supabase desde esta pantalla; estado UI para revisión |

### CTAs

| Botón | Copy | Habilitación |
|---|---|---|
| Volver al mapa | `SIGNIFICADO_CTA_BACK` | Si `onBack` definido |
| Continuar | `resolveContinueCta(hasMultipleActivities)` | `workMap.isSaved` + `submitGate.canSubmit` + no `disabled` |

---

## 7. Copy canónico de usuario

Centralizado en `src/features/significado/significado-copy.ts`. Incluye:

- Títulos y subtítulos de pantalla
- Labels de sidebar y tarjeta de actividad
- Encabezados de tabla (ocultos visualmente)
- Avisos de guardado, warnings y confirmación al continuar
- Pasos del journey (`SIGNIFICADO_JOURNEY_STEPS`)
- Helpers de formato (`formatActivityProgress`, `formatBlock0QuestionProgress`)

---

## 8. Tests de regresión obligatorios

Antes de cualquier cambio visual o de slice:

```powershell
cd external-consumers/eve-platform
node --test tests/regression/significado-de-trabajo-slice.test.ts
node --test tests/regression/significado-mba-alignment.test.ts
node --test tests/regression/significado-flow-wiring.test.ts
```

**Última verificación al congelar:** 16/16 pass en `significado-de-trabajo-slice.test.ts`.

---

## 9. Línea evolutiva que conduce a este freeze

| Versión / pasada | Documento de referencia | Aporte |
|---|---|---|
| R2.3 Visual UI Pass | `CLOSEOUT_R2_3_SIGNIFICADO_VISUAL_UI_PASS_V0_1.md` | Shell mockup, sidebar, tarjetas |
| V0.2 Form rows | `CLOSEOUT_SIGNIFICADO_FORM_ROWS_V0_2_REFINEMENT.md` | Patrón fila vertical |
| V0.9 WorkMap row | `CLOSEOUT_SIGNIFICADO_WORKMAP_ROW_LAYOUT_V0_9.md` | Grid pregunta/respuesta WorkMap |
| V0.7 Help text | `CLOSEOUT_SIGNIFICADO_BLOCK0_CANONICAL_HELP_TEXT_FIX_V0_7.md` | Ayudas canónicas vs fallback |
| Pasada A | (dictamen UI junio 2026) | Color, jerarquía, affordance inputs |
| Pasada B | (dictamen UI junio 2026) | Minimalismo, ayuda colapsable, `data-row-state` |
| Pasada C | (dictamen UI junio 2026) | Responsive 900/768px, WCAG, reduced motion |
| **V1.0 FREEZE** | **Este documento** | **Congelamiento canónico** |

---

## 10. Fuera de alcance de este freeze (backlog explícito)

- Persistencia real de `visualDraft` Block 0 en Supabase.
- Wiring de `initialVisualDraft` desde sesión en flujo principal (`embedded`).
- Expansión a preguntas Block 0 adicionales o secciones C–D del Runtime.
- Unificación del shell `standalone` en `page.tsx` para flujo embebido.
- Badges epistemológicos visibles (decisión V0.9: retirados).
- Iconos de completitud por fila (decisión Pasada B: explícitamente no incluidos).

---

## 11. Confirmación de congelamiento

- [x] UI visual de Significado dictaminada y documentada.
- [x] Versión `1.0.0-frozen` registrada en `significado-copy.ts`.
- [x] Marcador de freeze en `significado-de-tu-trabajo.module.css`.
- [x] Rutas de operación identificadas (`page.tsx`, `/dev/significado`).
- [x] Archivos del slice inventariados.
- [x] Características visuales y operativas descritas.
- [x] Tests de regresión documentados.
- [x] Backlog separado del freeze visual.

**Estado:** `SIGNIFICADO_UI_VISUAL_V1_0_FROZEN` — listo para uso como baseline interno de Miguel.
