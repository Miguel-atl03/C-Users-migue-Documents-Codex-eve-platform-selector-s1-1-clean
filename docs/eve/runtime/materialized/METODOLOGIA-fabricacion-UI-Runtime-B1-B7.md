# Metodología de fabricación UI — Bloques Runtime B1–B7

**Versión:** 1.0  
**Origen:** síntesis operativa del chat 045-R3A-UI-B05 / UI-B05-R  
**Clasificación objetivo por bloque:** `ui_B{n}_visual_candidate_ready_for_runtime_binding`  
**Conexión Runtime↔UI:** fuera de Cursor; se ejecuta después (Codex / X4-n)

---

## 0. Propósito

Fabricar **UI específica por bloque** del Runtime 40/20 sobre el lienzo oficial (`eve-official-canvas`), de forma repetible, auditable y lista para binding posterior — **sin** conectar Renderer, BFF, `slot_ref` real ni branching en la ola visual.

Esta metodología convierte el piloto B0.5 (B05) en un proceso de producción para **B1 → B7**.

---

## 1. Insumos recopilados de este chat (fuente de la metodología)

### 1.1 Separación de olas (decisión rectora)

| Ola | Quién | Qué produce | Qué NO hace |
|---|---|---|---|
| **UI visual / fabricación** | Cursor | Sección oficial específica + controles + preview + entregables | Renderer, BFF, Ingest, branching, certificación funcional |
| **Conformance Runtime↔UI** | Codex / X4-n | Binding `InteractionViewModel` → UI → `slot_ref` → BFF → Ingest → next | Rediseñar la UI desde cero |

Política de puerta:

```text
X4 = waiting_for_specific_runtime_ui_materiality
→ wait_for_specific_runtime_UI_materiality_then_X4_incremental
```

Un bloque solo entra a X4 cuando su UI está visualmente terminada y el usuario autoriza la instrucción X4 dedicada.

### 1.2 Jerarquía de autoridad (obligatoria en fabricación UI)

```text
Documento Madre del bloque
        ↓
semántica / intención / opciones / help / aclaraciones / UX específica
        ↓
Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx
        ↓
UI específica del bloque en eve-official-canvas
        ↓
QA visual: no perder ni inventar nada
```

Reglas:

- **Madre** = semántica y UX del bloque (fuente principal de copy y diseño).
- **Matriz** = control transversal de slots, tipos de control, contrato de integración (QA visual).
- **Madre no reemplaza** la futura autoridad Runtime.
- **Matriz no reemplaza** el Documento Madre.
- En la ola UI, **Runtime/Renderer no es input de diseño** (sí lo es en X4).

Matriz canónica (baseline de este chat):

- Archivo: `docs/eve/runtime/materialized/Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx`
- SHA256: `5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059`
- Hojas por bloque: `01_Interacciones_60`, `02_Slots_170`, `03_Bloques_UI`, `04_Tipos_Control`, `07_Contrato_Integracion`
- **No reescribir** columnas semánticas 60/170 para justificar UI.

### 1.3 Lienzo y patrón de producto ya oficial

| Sección | Estado al cierre del chat |
|---|---|
| LOGIN / ESTADO_A | official (X1) |
| WORKMAP | official (X2) |
| SIGNIFICADO / B0 | official (X3) |
| B05 | visual candidate ready for binding (UI-B05-R) |
| B1–B7 | official_pending (aplicar esta metodología) |

Patrón de montaje (X1/X2/X3/B05):

1. Sección oficial bajo `src/components/eve-official-canvas/`
2. Actualizar `section-model.ts` (`presentation_status`)
3. Montar en `OfficialCanvasExperience` + `page.tsx`
4. Preview dedicado `http://localhost:3112/?preview=b{n}`
5. Unlock Runtime-governed solo desde `runtime_interaction_view_model` (nunca hardcode B05→B1→B2)

Surface de preview: **`http://localhost:3112/`** (no `:3000`; no `/dev/lienzo-eve`).

### 1.4 Hard prohibitions (reutilizables B1–B7)

1. No secuenciador / branching local.
2. No `fallback_textarea` como diseño oficial.
3. No inventar controles desde el prosa de la pregunta.
4. Diseñar para consumir después `InteractionViewModel` + `slot_ref` + metadata autorizada.
5. Assistance ≠ Runtime authority.
6. No modificar Runtime / BFF / catalog / persistence para acomodar UI incompleta.
7. No hardcodear next interaction.
8. No staging/prod writes; no commit salvo pedido explícito.
9. No reescribir semántica 60/170 de la matriz.
10. No certificar conformance funcional Runtime↔UI en la ola visual.

### 1.5 Lecciones del piloto B0.5 (qué funcionó / qué corrigió UI-B05-R)

| Lección | Implicación metodológica |
|---|---|
| Arrancar con **audit Madre + matriz + legacy**, luego plan, luego código | Gate 0 obligatorio antes de implementar |
| Freeze chrome (ComoOcurre) sirve de **presentation**, no de autoridad de secuencia | Portar chrome; no portar `block05-selection` local |
| Fichas derivadas ayudan, pero **Madre manda el copy** | Gate Madre-direct + tabla de conflictos |
| Fixture de aclaración (`0.5.B`) no puede gobernar preview productivo | Fixtures solo en test/reference |
| Díadas / campos compuestos deben ser **independientes** aunque se vean juntos | State separado; echo visual permitido |
| “Otro” = choice + texto complementario diferenciable | `choiceId` + `complementaryText` |
| Identidades Runtime simuladas (`stub:B05:…`, `runtime_interaction_id` “real”) confunden | Usar `field_key` neutro (source_code Madre) |
| Coach “completo” ≠ avance de bloque (caso B0) | No confundir asistencia con gate de cierre |
| Visual ready ≠ binding ready ≠ ingest ready ≠ E2E | Clasificaciones explícitas por capa |

### 1.6 Artefactos del piloto a clonar por bloque

Del chat B05 / UI-B05-R:

| Artefacto | Rol |
|---|---|
| `OfficialCanvasB{n}Section.tsx` | UI específica |
| `{bn}-presentation-contract.ts` | Contrato presentacional / binding-ready |
| `{bn}-madre-copy.ts` | Copy Madre canónico |
| `{bn}-visual-stub.ts` | Candidate base + fixtures de referencia |
| `?preview=b{n}` | Visualización sin flujo completo |
| `UI-B{n}-mother-direct-conformance.{md,json}` | Gate Madre |
| `UI-B{n}-matrix-visual-readiness.{md,json}` | Gate Matriz (sin PASS de binding/ingest) |
| `UI-B{n}-control-capability.{md,json}` | Controles listos |
| `UI-B{n}-assistance-preservation.{md,json}` | `assistance_loss = 0` |
| `UI-B{n}-runtime-binding-readiness.{md,json}` | Estructura lista, conexión false |
| `UI-B{n}-final.md` | Clasificación de cierre visual |
| Test focal UI (A–O) | Solo materialidad visual |

### 1.7 Definición de “sección visualmente terminada” (handoff)

Una sección está lista para su X4 solo si:

- [ ] Componente oficial en `eve-official-canvas`
- [ ] `presentation_status` honesto (`official` solo si es oficial visual)
- [ ] Controles = tipos matriz del bloque (sin textarea fallback oficial)
- [ ] Layout muestra help/presentation sin inventar campos Runtime
- [ ] Estructura orientada a slots/fields (placeholders OK; sin secuenciador local)
- [ ] Assistance inventariada / preservada
- [ ] Matriz consultada y documentada
- [ ] Sin cambios Runtime “para que el mock funcione”
- [ ] Tests/lint/typecheck focal PASS
- [ ] Nota de entregable escrita

Luego: **STOP** y esperar instrucción X4-n.

### 1.8 Mapa UI → X4 (por bloque)

| UI ready | Luego (fuera de ola visual) |
|---|---|
| B0.5 | `045-R3A-X4-05` |
| B1 | `045-R3A-X4-1` |
| B2 | `045-R3A-X4-2` |
| B3 | `045-R3A-X4-3` |
| B4 | `045-R3A-X4-4` |
| B5 | `045-R3A-X4-5` |
| B6 | `045-R3A-X4-6` |
| B7 | `045-R3A-X4-7` |

Cada X4 certifica:

```text
Renderer → UI específica ya existente → slot_ref → asistencia → respuesta → BFF → Runtime next
```

### 1.9 Contrato de integración (lo que la UI debe respetar sin implementarlo aún)

De `07_Contrato_Integracion` / handoff:

- `catalog_version_id` = run-pinned (no override UI)
- `interaction_instance_id` / `slot_ref` = server-issued
- answer value = humano
- next interaction = Runtime
- assistance no altera slot_ref, options authority, branching, provenance, canonical variable, next

### 1.10 Familias de control (catálogo transversal)

No inventar. Cruzar Madre + matriz `04_Tipos_Control`:

- Texto libre
- Selección única
- Selección múltiple
- Selección + texto (Otro / híbrido)
- Confirmación + corrección
- Aclaración condicional
- Ordenamiento / ranking
- Decisión binaria + texto
- Control dinámico catálogo
- Escala + texto
- Controles internos no visibles

Si falta metadata Renderer en X4 → `blocked_runtime_presentation_metadata_contract` (no improvisar en UI).

---

## 2. Metodología de fabricación (proceso estándar por bloque Bn)

### Fase A — Arranque y alcance

**A1. Abrir chat/instrucción dedicada** `UI-B{n}` (solo ese bloque).  
**A2. Confirmar worktree/branch/preview `:3112`.**  
**A3. Localizar Documento Madre del bloque Bn.**  
**A4. Verificar matriz SHA y filtrar filas del bloque en 01/02/03/04/07.**  
**A5. Inventariar freeze/legacy UI del bloque (si existe).**  
**A6. Emitir plan mínimo (archivos, props, assistance) y solo entonces codificar.**

Salida A: `UI-B{n}-kickoff-audit.md` (opcional pero recomendado).

### Fase B — Gate Madre (conformance directa)

Validar UI (o diseño propuesto) contra Madre:

- propósito del bloque
- cada pregunta / variante / aclaración
- opciones, Otro, incertidumbre
- help_text, microcopy, ecos
- asistencia documentada
- unidades cognitivas (díadas, compuestos) **sin fusionar state**

Tabla obligatoria:

| elemento_madre | ui_actual | conformant | gap | correccion_ui |
|---|---|---|---|---|

Si Madre ≠ fichas ≠ UI: **documentar**; no resolver por conveniencia visual.  
Si conflicto bloquea semántica: `blocker` explícito.

Salida B: `UI-B{n}-mother-direct-conformance.{md,json}`

### Fase C — Gate Matriz (QA visual, no PASS funcional)

Para cada interacción/slot del bloque:

- mapear `control_family` / `field_type` → capacidad UI
- confirmar `pantalla_objetivo` / `ruta_componente_real` (companion si no hay editor seguro)
- marcar solo: `estado_desarrollo_control = ready`, `visual_conformance = PASS|PARTIAL`
- **no** marcar binding/ingest/prueba funcional = PASS

Salida C: `UI-B{n}-matrix-visual-readiness.{md,json}` + `UI-B{n}-control-capability.{md,json}`

### Fase D — Diseño / fabricación UI específica

**D1. Chrome del bloque** (bandas, jerarquía, sticky activity, microcopy) — específico, no formulario genérico.  
**D2. Contrato presentacional** (`field_key` neutro = source_code Madre; answers humanos).  
**D3. Controles solo de familias autorizadas.**  
**D4. Candidate productivo = nodos always-visible Madre** (o el conjunto base documentado).  
**D5. Variantes / aclaraciones / causales = fixtures de referencia** (`clarification_visible`, `causal_visible`, etc.) — **nunca** autoridad de preview productivo.  
**D6. Props binding-ready** (fields, options, help, required, answers, onChange, onContinue) **sin** IDs Runtime reales.  
**D7. Montaje** en `OfficialCanvasExperience` + preview `?preview=b{n}`.  
**D8. Actualizar** `section-model` / README honestamente.

### Fase E — Asistencia

Inventario:

| assistance_name | source | ui_location | preserved | gap |
|---|---|---|---|---|

Objetivo: `assistance_loss = 0`.  
Assistance puede orientar; no decide semántica Runtime.

Salida E: `UI-B{n}-assistance-preservation.{md,json}`

### Fase F — Binding readiness (estructura, no conexión)

Documentar que el componente puede recibir después interaction/fields/options/help/required/values/callbacks.

Flags fijos de esta fase:

```text
Renderer_connected = false
slot_ref_real_connected = false
BFF_connected = false
ResponseIngest_connected = false
local_sequence_authority = false
fixture_authority = false
```

Salida F: `UI-B{n}-runtime-binding-readiness.{md,json}`

### Fase G — Tests UI (solo materialidad)

Checklist mínimo (extender del piloto B05):

| ID | Prueba |
|---|---|
| A–C | Campos canónicos visibles; compuestos no colapsados |
| D–G | Controles (choice / text / Otro / aclaración) |
| H | Causal/variante preview como fixture, sin lógica Runtime |
| I–J | help + assistance preservada |
| K | Fixture no gobierna producción |
| L | Sin secuenciador local |
| M–O | typecheck / lint focal / `git diff --check` |

No exigir tests BFF/Renderer/Ingest.

### Fase H — Cierre visual y STOP

Clasificación:

```text
ui_B{n}_visual_candidate_ready_for_runtime_binding
```

Flags de cierre (deben ser true salvo nota):

- Documento_Madre_directly_validated
- Matriz_used_as_QA
- specific_B{n}_UI
- dyad_or_composite_preserved (si aplica)
- required_visual_controls_ready
- assistance_loss = 0
- local_sequence_authority = false
- fixture_authority = false

`functional_Runtime_UI_conformance = pending`

Salida H: `UI-B{n}-final.md` → **STOP** → esperar X4-n.

---

## 3. Plantilla de instrucción Cursor (copiar por bloque)

```text
Cursor — UI-B{n} (visual materiality only)

Jerarquía:
Documento Madre B{n} → semántica/UX → Matriz Runtime↔UI → UI específica lienzo oficial

Hacer: sección OfficialCanvasB{n}Section; controles solo familias matriz/Madre;
preview ?preview=b{n}; field_key neutro; fixtures aclaración/causal solo reference;
entregables UI-B{n}-*; tests UI A–O.

No hacer: Renderer, InteractionViewModel live, slot_ref real, BFF, Ingest,
branching Runtime, certificación funcional, commit salvo pedido, B{m≠n}.

Clasificación: ui_B{n}_visual_candidate_ready_for_runtime_binding
STOP al cerrar visual. Binding = tarea posterior (Codex/X4-{n}).
```

---

## 4. Orden de fabricación recomendado

1. **B1** (tras B05 cerrado visualmente)  
2. B2 → B3 → B4 → B5 → B6 → B7  
3. Tras cada UI ready: **pausa** para X4-n (Codex) antes de acumular deuda de binding  
4. B7: preservar `runtime_microconfirmation_contract` en inventario de assistance  
5. READINESS: fuera de esta metodología salvo autorización explícita

Principio de mínima intervención: **un bloque por chat/instrucción**.

---

## 5. Roles Cursor vs Codex (acordado en este chat)

| Responsabilidad | Cursor (UI) | Codex (conformance) |
|---|---|---|
| Madre → UX → Matriz → sección visual | sí | no (salvo review) |
| Controles / chrome / preview | sí | no |
| Renderer → UI → slot_ref → BFF → Ingest → next | no | sí |
| Certificación funcional matriz 05_QA_60 | no | sí |
| Reabrir X3P / catalog pinning | no | no |

---

## 6. Criterio de éxito de la metodología

La metodología funciona si, para cada Bn:

1. Un agente puede fabricar la UI **sin** tocar Runtime.  
2. Un segundo agente puede conectar Runtime **sin** rediseñar la UI.  
3. QA puede distinguir `visual_candidate` de `functional_Runtime_UI_conformance`.  
4. No se pierde assistance ni se inventan controles.  
5. El lienzo permanece continuo y específico por bloque (nunca un form genérico definitivo).

---

## 7. Referencias canónicas nacidas en este chat

- Handoff ola: `045-R3A-UI-B05-B7-new-chat-handoff.md`
- Matriz integración: `045-R3A-X0R-runtime-ui-matrix-integration.md`
- Patrón B1–B7 (post-binding): `045-R3A-V-B1-B7-pattern.md` / `045-R3A-VR-B1-B7-pattern.md`
- Piloto cerrado: `UI-B05-final.md` (+ companions `UI-B05-*`)
- Código piloto: `src/components/eve-official-canvas/OfficialCanvasB05Section.tsx` y satélites `b05-*`

---

**Fin de metodología v1.0 — lista para aplicar en UI-B1.**
