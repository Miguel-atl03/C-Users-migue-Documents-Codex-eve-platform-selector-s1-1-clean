# 045-R3A — Handoff chat nuevo: materialidad UI Runtime B0.5–B7

## Purpose

Arrancar un **chat nuevo** para materializar visualmente las secciones oficiales faltantes del lienzo Runtime (**B0.5 → B7**), sin ejecutar aún X4.

## Closed upstream (do not reopen)

| Instruction | Classification / status |
|---|---|
| 045-R3A-X3P | **CLOSED** — `runtime_full_run_catalog_pinning_conformant_local_only` |
| catalog during execution | `activity_runtime_run.catalog_version_id` |
| mid-run catalog upgrade | false |
| X3R B0→FULL handoff | PASS (do not reopen) |

Canonical close note:

`docs/eve/runtime/materialized/045-R3A-X3P-final.md`

## Current gate

```text
X4 = waiting_for_specific_runtime_ui_materiality
Next = wait_for_specific_runtime_UI_materiality_then_X4_incremental
```

**NO iniciar X4-05 / X4-1…X4-7 en este chat** hasta que la sección correspondiente esté visualmente terminada y se abra una instrucción X4 dedicada.

---

## Worktree / baseline

- **Authorized worktree:**  
  `.../eve-platform-operational-baseline-c312/external-consumers/eve-platform`
- **Git root:** `.../eve-platform-operational-baseline-c312`
- **Branch:** `release/eve-c312-production`
- **HEAD baseline at X3P close:** `8becedf4940b9bd19ec9d9968b9308d34070b555` (verify; do not assume clean)
- **No commit** unless user explicitly asks
- **No staging writes / no production**
- Split `preexisting_dirty` vs instruction delta

## Local preview URL (authoritative for this wave)

- **Use:** `http://localhost:3112/`
- **Do NOT assume:** `http://localhost:3000/` (often down / wrong process)
- **Do NOT use:** `/dev/lienzo-eve` (old prototype path; removed from live product)

Official product surface:

```text
http://localhost:3112/
```

## Continuous canvas section status (vs 045-R3A-V-freeze)

| Section | Status |
|---|---|
| Login | freeze visual + product auth (latest for productization) |
| Estado A | freeze visual + StartPositionContext (latest) |
| WorkMap explainer | freeze match (latest) |
| WorkMap builder | freeze areas + **1 responsabilidad + 2 actividades** por área (restored) |
| Significado explainer | freeze match (latest) |
| Significado / B0 | freeze SignificadoC bands via `OfficialCanvasSignificadoBuilder` (stance + 01/02/03 + variation foreshadow); **no** Inicio/cierre fringe UI; B0-Q04 silent on continue; `/api/significado/block0` preserved |

WorkMap chips authority: `src/config/canvas-work-map-areas.ts` (Operaciones / Producción, Ventas / Comercial, …) — **not** legacy PREDEFINED Venta/Logística.

## Official canvas already done

| Mode / section | Status |
|---|---|
| LOGIN / ESTADO_A / session resume | official (X1) |
| WORKMAP | official (X2) |
| SIGNIFICADO / B0 | official (X3) + handoff X3-R |
| B05 | `legacy_wrapped` — **first visual target** |
| B1–B7 | `official_pending` |
| READINESS | `official_pending` (out of this wave unless authorized) |

Sources of truth for canvas:

- `src/components/eve-official-canvas/`
- `src/components/eve-official-canvas/section-model.ts`
- `src/components/eve-official-canvas/README.md`
- Mount: `src/app/page.tsx`

Unlock rule already encoded: B05–B7 unlock from **`runtime_interaction_view_model`** only. Never hardcode B05→B1→B2.

---

## Matrix authority (mandatory)

**File:**  
`docs/eve/runtime/materialized/Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx`

**SHA256 baseline:**  
`5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059`

### Documento Madre hierarchy (mandatory working frame for each block)

```text
Documento Madre del bloque
        ↓
semántica, intención, opciones, help, aclaraciones, UX específica
        ↓
Matriz_Conformance_Runtime_UI_40_20  (contratos/slots/tipos — no sustituye Madre)
        ↓
Lienzo oficial actual (eve-official-canvas / OfficialCanvasExperience en :3112)
        ↓
QA: la UI del lienzo no perdió ni inventó nada respecto a Madre + matriz
```

**No existe** una pieza separada llamada “Runtime 40/20/Renderer vigente” que el agente deba “usar como dependencia externa”.  
El desarrollo de B0.5 se **agrega al lienzo oficial actual** (`src/components/eve-official-canvas/`, montado desde `page.tsx` / `OfficialCanvasExperience` en `http://localhost:3112/`).

La matriz es autoridad de conformancia UI↔contratos. El **Documento Madre** es autoridad de semántica/UX del bloque. El **lienzo** es el producto donde se materializa.

For **B0.5**, inputs obligatorios de esta ola:

1. Matriz conformance xlsx (arriba; copiar a worktree si falta)
2. **Documento Madre B0.5** (adjuntar en el chat nuevo):  
   `c:\Users\migue\Downloads\Diseno Estructural de la Arquitectura de Entrerprise Viability Engine - Strategy and Operations\Bloques de preguntas\Bloque_0_5_Documento_Madre_Capa1_v2_1_EVE.docx`
3. Código del lienzo oficial ya existente (repo): `eve-official-canvas` + freeze visual `ComoOcurreSection` como referencia de chrome

Repeat for B1…B7: solo el Madre del bloque en curso + matriz + lienzo actual.

Madre B0.5 UX signals that matrix summarizes but does not substitute (must survive UI port):

- Díada visual **0.5.1 / 0.5.1a** (consecutive, related, not fused; final beneficiary/affected — not immediate receptor)
- **0.5.1_rel** with contextual echo of the prior pair
- **0.5.1b** only if `0.5.1_rel = Son actores distintos` (short guided dual mini-signals)
- Conditional clarifications **0.5.A / 0.5.B / 0.5.C**
- Closed **Selección única** with contextualized options + **Otro** / uncertainty rules where Madre defines them

For **each** block, consult matrix sheets:

1. `01_Interacciones_60`
2. `02_Slots_170`
3. `03_Bloques_UI`
4. `04_Tipos_Control`
5. `07_Contrato_Integracion`

Also useful:

- `05_QA_60` (certification board — visual ready ≠ QA PASS)
- `045-R3A-X0R-runtime-ui-matrix-integration.md`

### Column policy

- **Do not rewrite** Runtime semantic columns (ids, texts, options, branching, provenance, etc.) to justify UI.
- Operational conformance columns may be updated carefully when documenting UI progress.
- **Do not modify 60/170 semantic content** casually. Prefer documenting in instruction artifacts.

`07_Contrato_Integracion` already states:

- `catalog_version_id` → **run-pinned**
- `interaction_instance_id` / `slot_ref` → server-issued
- next interaction → Runtime

---

## Objective of this chat wave

Materialize **official UI sections** for Runtime blocks so they can later consume:

- `InteractionViewModel`
- `slot_ref`
- authorized presentation metadata

Order of work:

1. **B0.5 (B05)** first
2. Then B1 → B2 → B3 → B4 → B5 → B6 → B7

Suggested instruction ids for visual materiality (not X4):

- `045-R3A-UI-B05`
- `045-R3A-UI-B1`
- …
- `045-R3A-UI-B7`

When a block is visually ready → **stop UI chat** and open **X4** instruction:

| UI ready | Then execute |
|---|---|
| B0.5 | `045-R3A-X4-05` |
| B1 | `045-R3A-X4-1` |
| B2 | `045-R3A-X4-2` |
| B3 | `045-R3A-X4-3` |
| B4 | `045-R3A-X4-4` |
| B5 | `045-R3A-X4-5` |
| B6 | `045-R3A-X4-6` |
| B7 | `045-R3A-X4-7` |

Each X4 certifies:

```text
Renderer → UI específica ya existente → slot_ref → asistencia → respuesta → BFF → Runtime next
```

Visual ready ≠ binding ready ≠ ingest ready ≠ E2E certified.

---

## Hard prohibitions

1. **NO** implementar secuencia/branching local.
2. **NO** convertir `fallback_textarea` en diseño oficial.
3. **NO** inventar controles desde el texto de la pregunta.
4. **NO** modificar Runtime / BFF / persistence / catalog pinning para acomodar UI incompleta.
5. **NO** reabrir X3P / X3R / creación de runs / activación de catálogo.
6. **NO** arrancar X4 en el mismo chat de materialidad visual salvo instrucción explícita del usuario.
7. **NO** hardcodear next interaction (B05, C01, etc.).
8. Assistance may help draft/understand; must **not** alter `slot_ref`, options authority, branching, provenance, canonical variable, or next interaction.

## Design obligations

1. Controls come from matrix `04_Tipos_Control` + row metadata — not from prose improvisation.
2. Each section must be shaped to bind later to Renderer view-model fields and opaque `slot_ref`s.
3. Preserve existing user-assistance mechanisms (`runtime_help_text`, microconfirmation where B7, etc.).
4. Follow existing official-canvas patterns (X1/X2/X3): extract/port → official section → mount via `OfficialCanvasExperience` when authorized.
5. Keep continuous-canvas language; do not invent a parallel Runtime UI shell.
6. Frontend design rules in user rules apply when creating branded surfaces; within existing canvas, **preserve established visual language**.

---

## Definition of “sección visualmente terminada” (UI gate before X4)

A block is ready for its X4 only when all are true:

- [ ] Official section component(s) exist under `eve-official-canvas` (or authorized equivalent)
- [ ] `section-model.ts` `presentation_status` updated honestly (`official` only when truly official)
- [ ] Controls match matrix types for that block’s interactions/slots (no official textarea fallback)
- [ ] Layout can display help/presentation metadata without inventing Runtime fields
- [ ] Slot-oriented structure present (placeholders OK for binding; no fake local sequencer)
- [ ] Assistance preserved / inventoried
- [ ] Matrix consulted and documented for the block
- [ ] No Runtime engine changes required “just to make the mock work”
- [ ] Focal tests / lint / typecheck for touched UI paths PASS (or justified)
- [ ] Deliverable note written for the UI instruction

Then ask user to open **X4-xx**.

---

## Paste-ready startup prompt (copy into new chat)

```text
INSTRUCCIÓN APROBADA — 045-R3A-UI-B05
Materialidad visual oficial de Bloque 0.5 (B05) en el lienzo actual
STATUS: APPROVED — implementar ahora (solo UI). NO ejecutar X4.

═══════════════════════════════════════════════════════════════
1) OBJETIVO
═══════════════════════════════════════════════════════════════
Agregar al LIENZO OFICIAL ACTUAL (no a un shell paralelo) la sección
visual de Bloque 0.5 / B05, lista para X4 posterior.

Producto / surface:
- http://localhost:3112/   (NO :3000; NO /dev/lienzo-eve)
- Código: src/components/eve-official-canvas/
- Mount: OfficialCanvasExperience + page.tsx

Entregar:
- OfficialCanvasB05Section (+ builder fino si hace falta)
- Chrome freeze ComoOcurre (activity sticky, frame, marquee, bands, help)
- Cuerpo slot-oriented con props de presentación (stub-ready para X4)
- Controles SOLO: single_choice | free_text | clarification band |
  “Otro” condicional cuando metadata lo autorice
- Mount en canvas oficial con ViewModel stub para preview en :3112
  (sin binding X4; page puede seguir con runner legacy hasta X4)
- Actualizar section-model / README con honestidad
- Copiar matriz al worktree si falta (sin reescribir hojas semánticas)
- Nota deliverable 045-R3A-UI-B05-*

Al terminar: declarar ready_for_X4-05 = true|false y PARAR.
NO iniciar 045-R3A-X4-05.

═══════════════════════════════════════════════════════════════
2) MARCO DE TRABAJO — JERARQUÍA DE INFORMACIÓN (OBLIGATORIA)
═══════════════════════════════════════════════════════════════
Usa esta jerarquía para TODA decisión de B0.5:

Documento Madre del bloque
        ↓
semántica, intención, opciones, help, aclaraciones, UX específica
        ↓
Matriz_Conformance_Runtime_UI_40_20
(contratos: interacciones, slots, tipos de control, integración)
        ↓
Lienzo oficial actual (eve-official-canvas / OfficialCanvasExperience)
        ↓
QA: la UI no perdió ni inventó nada respecto a Madre + matriz

Reglas de jerarquía:
- Madre manda semántica/UX del bloque (díada, eco, microaclaraciones,
  “Otro”, incertidumbre, etc.).
- Matriz manda IDs, slots, tipos de control y contrato de integración.
- Si hay tensión: Madre para intención/UX; Matriz para contratos;
  NO inventar controles desde prosa; NO reescribir semántica 60/170.
- NO existe “Runtime 40/20/Renderer vigente” como input separado.
  El desarrollo se AGREGA al lienzo oficial ya productizado.

═══════════════════════════════════════════════════════════════
3) FUENTES OBLIGATORIAS DE ESTE CHAT
═══════════════════════════════════════════════════════════════
A) Documento Madre B0.5 (adjuntar en el chat):
   c:\Users\migue\Downloads\Diseno Estructural de la Arquitectura de Entrerprise Viability Engine - Strategy and Operations\Bloques de preguntas\Bloque_0_5_Documento_Madre_Capa1_v2_1_EVE.docx

B) Matriz:
   docs/eve/runtime/materialized/Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx
   SHA256: 5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059
   Si falta en worktree: copiar desde Downloads; no reescribir sheets.

C) Lienzo actual (dónde implementar):
   - src/components/eve-official-canvas/
   - OfficialCanvasExperience, section-model.ts, README.md, page.tsx
   - Freeze visual de referencia: ComoOcurreSection (045-R3A-V-freeze)
   - Handoff: docs/eve/runtime/materialized/045-R3A-UI-B05-B7-new-chat-handoff.md

Consultar matriz por bloque: 01_Interacciones_60, 02_Slots_170,
03_Bloques_UI, 04_Tipos_Control, 07_Contrato_Integracion.

═══════════════════════════════════════════════════════════════
4) AUTORIDAD MATRIZ B0.5 / B05 (resumen)
═══════════════════════════════════════════════════════════════
B05-Q05 Beneficiario/afectado — guided_textarea_or_choice_plus_text
  slots visibles: 0.5.1, 0.5.1a, 0.5.1_rel, 0.5.1c, 0.5.1d (Selección única)
B05-Q06 Proceso contenedor — same
  0.5.2 Selección única + 0.5.B aclaración condicional
B05-Q07 Hito + prioridad — same
  0.5.3 Texto libre; 0.5.4 / 0.5.4a Selección única
C02 Asimetría/hito ambiguo — conditional_probe_card
  0.5.1b texto; 0.5.A / 0.5.C aclaración condicional
  (variante de layout en la MISMA sección si presentation lo dice;
   NO hardcodear C02 después de B05)

Madre exige además (matriz resume, no sustituye):
- Díada 0.5.1↔0.5.1a consecutiva, emparentada, no fusionada
- 0.5.1_rel con eco contextual de la díada
- 0.5.1b solo si 0.5.1_rel = Son actores distintos
- Microaclaraciones 0.5.A / 0.5.B / 0.5.C según Madre
- Selección única contextualizada; “Otro” / incertidumbre solo si Madre/matriz lo autorizan

═══════════════════════════════════════════════════════════════
5) PLAN APROBADO (alcance)
═══════════════════════════════════════════════════════════════
SÍ:
- Materialidad visual oficial B05 en el lienzo continuo
- Props de presentación stub-ready (visible_text, help_text, slot_ref,
  control_family, choice_options?)
- Una interacción de slots como el Renderer emitiría (p.ej. multi-slot Q05);
  sin avance cliente a Q06/Q07/C02
- Preview mount con ViewModel stub en OfficialCanvasExperience (:3112)

NO:
- Secuenciador/branching local (prohibido portar block05-selection.ts
  como comportamiento de producto)
- X4 binding / answer→BFF / next-interaction
- Edits Runtime / BFF / catalog / persistence
- fallback_textarea como diseño oficial
- Colapsar B05 a un solo textarea
- Hardcode B05→B1 / C01 / C02
- Empezar 045-R3A-X4-05
- Reabrir X3P / X3R

Contexto cerrado:
- Branch: release/eve-c312-production
- Worktree: eve-platform-operational-baseline-c312/external-consumers/eve-platform
- 045-R3A-X3P CLOSED; X3R PASS
- X4 = waiting_for_specific_runtime_ui_materiality
- No commit salvo que yo lo pida; no staging/prod

═══════════════════════════════════════════════════════════════
6) ORDEN DE EJECUCIÓN
═══════════════════════════════════════════════════════════════
1. Leer Madre B0.5 + matriz B05 + handoff + eve-official-canvas actual
2. Inventariar slots/controles Madre∩matriz (sin inventar)
3. Implementar OfficialCanvasB05Section en el lienzo
4. Montar preview stub en OfficialCanvasExperience / page si hace falta
5. Actualizar section-model (legacy_wrapped → official solo si gate visual real)
6. tsc/eslint paths tocados; nota 045-R3A-UI-B05-*
7. Declarar ready_for_X4-05 y detenerse

EMPIEZA AHORA.
```

---

## Suggested first actions for the new agent

1. Attach/read Madre B0.5 + this handoff + matrix
2. Audit matrix rows for B0.5 / B05 against Madre UX (díada, eco, clarifications)
3. Implement official B05 section **into current lienzo** (`eve-official-canvas`)
4. Mount stub ViewModel preview on `:3112` without X4 binding
5. Update `section-model` / README honestly
6. Write `045-R3A-UI-B05-*` deliverables
7. Declare `ready_for_X4-05` without starting X4

---

## Related artifacts

- Matrix integration: `docs/eve/runtime/materialized/045-R3A-X0R-runtime-ui-matrix-integration.md`
- X3P final: `docs/eve/runtime/materialized/045-R3A-X3P-final.md`
- Canvas / lienzo actual: `src/components/eve-official-canvas/`
- Bundle prior: `Downloads/045_R3A_X3P_run_catalog_pinning_conformance.zip`
