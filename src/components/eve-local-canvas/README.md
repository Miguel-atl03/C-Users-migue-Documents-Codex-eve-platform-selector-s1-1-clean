# eve-local-canvas

Local development canvas namespace — intentionally distinct from the official production lienzo (`eve-official-canvas` in the Codex worktree).

Productization target for **045-R3A-X** / **X1** / **X2** / **X3** / **UI-B05** / **UI-B1** / **UI-B2** / **UI-B3** / **UI-B4** / **UI-B5**.

**Design guide:** `docs/eve/visual/EVE_CONCEPTO_PRODUCTO_FINAL.md` — concepto de producto, sensación de marca, gramática visual y checklist de pantallas.

## Status

`OfficialCanvasExperience` hosts:

| Mode | Sections |
|---|---|
| `login` | `OfficialLoginSection` |
| `estado_a` | `OfficialEstadoASection` |
| `session_resume_*` | `OfficialSessionResumeSection` |
| `intake_sheet` | Continuous sheet: **Puerta hero (una vez)** → Posición / Estado A → WorkMap → **Umbral (Scene Entry)** → **B0 Memoria operativa** → **B0 Cómo ocurre** (frecuencia in-place tras guardar) |
| `workmap` | Legacy exclusive WorkMap flow (kept for compatibility) |
| `significado` | `LocalSceneEntrySection` (Umbral Memoria → Escena) → `LocalSignificadoSection` → `LocalCanvasSignificadoBuilder` |
| `b05` | `OfficialCanvasB05Section` — Bloque 0.5 ComoOcurre chrome + Madre/matrix slot controls (visual stub until X4-05) |
| `b1` | `OfficialCanvasB1InstrumentSection` — Bloque 1 Disparador (approved visual; isolated preview; `presentation_status = official_pending` until explicit canvas integration) |
| `b2` | `OfficialCanvasB2InstrumentSection` — Bloque 2 Transformación (**approved** visual; exportable companion-only; `presentation_status = official_pending`; **not** on productive canvas) |
| `b3` | `OfficialCanvasB3InstrumentSection` — Bloque 3 Salida (**approved** visual; exportable companion-only; `presentation_status = official_pending`; **not** on productive canvas) |
| `b4` | `OfficialCanvasB4InstrumentSection` — Bloque 4 Cadena causal (**approved** visual; exportable companion-only; `presentation_status = official_pending`; **not** on productive canvas) |
| `b5` | `OfficialCanvasB5InstrumentSection` — Bloque 5 Capacidad (**approved** visual; exportable companion-only; `presentation_status = official_pending`; **not** on productive canvas yet) |

**Lienzo local oficial (desarrollo e integración de secciones aprobadas):**

`http://localhost:3112/dev/ui-posicion-workmap?fresh=1`

Hoja continua: **Puerta hero (una vez)** → Posición → WorkMap → **Umbral (Scene Entry)** → **B0 Memoria operativa** → **B0 Cómo ocurre** (frecuencia in-place).
Las secciones aprobadas en `deliverables/design/` se incorporan aquí de forma directa.
El Significado/B0 builder anterior (`LocalCanvasSignificadoBuilder`) **no** se monta en el lienzo local.

Mounted from `src/app/page.tsx` (sesión productiva comercial/demo):

- `access_screen` / `create_session` → X1 front-door
- `capture_workspace` + `intake_work_map` → `intake_sheet` (puerta hero → Posición → WorkMap bands)
- `capture_workspace` + `intake_significado` → X3 Significado/B0
- `capture_workspace` + `questionnaire_main` / `support_activity_questionnaire` → UI-B05 official shell (stub ViewModel)
- Escape hatch (legacy Runtime adapter): `?runtime_legacy=1` on questionnaire flow

**Taller visual** (solo diseño previo a aprobación; no es el lienzo):

| Ruta | Uso |
|---|---|
| `deliverables/design/eve-lienzo-umbral-escena-v2-mock.html` | Mock HTML umbral v2 |
| `/dev/ui-b1` … `/dev/ui-b5` | Bloques instrumento (companion-only) |

## WORKMAP presentation

WORKMAP UI is restored to the continuous-canvas freeze band layout (`OfficialCanvasWorkMapBuilder`).

**Authority remains `WorkMapData`** (same save/continue/draft/assistance contracts). `WorkMapEditor` stays in the repo as functional/legacy authority for e2e-block0 and thin imports — official path does **not** show its sidebar chrome.

## SIGNIFICADO / B0 presentation

**Local continuous sheet (approved):**
1. `LocalB0MemoriaOperativaSection` — secuencia void I–IV + confirmación Así es / Editar.  
   Freeze: `deliverables/design/eve-b0-secuencia-void-v4.html` (BUILD 4.3).
2. `LocalB0ComoOcurreSection` — Cómo ocurre (D1/D3/D5 + escena 1) y **frecuencia in-place** tras guardar.  
   Freeze escena: `deliverables/design/eve-b0-como-ocurre-void-v1.html` (BUILD 3.13).  
   Freeze frecuencia: `deliverables/design/eve-b0-frecuencia-continuation-v1.html` (BUILD 1.3 **aprobado**).  
   Misma estructura triangular: tras guardar redacción, las columnas muestran frecuencia; `←` vuelve a las 3 preguntas iniciales **sin** quitar la redacción del void.

**Legacy / e2e only:** `LocalCanvasSignificadoBuilder` (stance + 01/02/03 bands) remains in the repo for e2e-block0 and standalone Significado routes — **not** mounted on the local official sheet.  
`LocalB0FrecuenciaSection` queda como módulo de opciones/tipos reutilizado por Cómo ocurre; **no** se monta como banda separada.

**Authority for product B0 keys** still lives in Significado contracts for Runtime/API paths; the memoria + cómo ocurre sections are the local-canvas UX for the same room after Umbral.

**Variation foreshadow (legacy builder):** UI asks “¿A veces cambia según el caso o la urgencia?” after inicio/cierre. Matrix/Runtime binding is causal **C01** (`0.8` → `activity_variation_mode` / `scene_variation_mode`; `0.8a` → `activity_exception_signature` / `scene_exception_signature`). Captured in local UI state only until Runtime opens C01 — does **not** invent B0 keys or hardcode next interaction.

## B0.5 / B05 presentation

B05 UI restores ComoOcurre chrome on the official canvas (`OfficialCanvasB05Section`).

**Authority chain (UI-B05-R):** Madre Bloque 0.5 → semantics/options/help/UX → matrix control families → official canvas.

- Production candidate = Madre **always-visible** base slots only (`createB05VisualStubViewModel`).
- Clarification / causal surfaces exist only as **reference fixtures** (`createB05ClarificationFixtureViewModel`, `createB05CausalPreviewViewModel`) — not production authority.
- Answers keyed by neutral `field_key` (Madre source_code). Future binding maps to server `slot_ref`.
- No local branching / next-interaction sequencer.
- `fallback_textarea` is **not** official design.
- Runtime/Renderer/BFF/Ingest connection is **out of scope** for UI-B05-R.

Matrix copy (SHA256 `5DC4E7A8…1059`): `docs/eve/runtime/materialized/Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx`

Classification target: `ui_B05_visual_candidate_ready_for_runtime_binding`

## B1 / Disparador presentation

B1 approved visual candidate is **Instrumento** (`OfficialCanvasB1InstrumentSection`).

**Authority chain (UI-B1):** Madre Bloque 1 → semantics/options/help/UX → matrix control families → Instrumento shell.

- Production candidate = Madre always-visible base **1.1–1.7** (`createB1VisualStubViewModel`).
- Exception / clarifications (**1.8**, **1.A–C**) = reference fixtures only.
- Controls expose `data-field-key` + optional `data-slot-ref` passthrough (values unset until X4-1).
- Archived / deprecated shells: `OfficialCanvasB1Section`, `OfficialCanvasB1ProposalSection`.
- Deprecated preview routes `/dev/ui-b1-alt` and `/dev/ui-b1-pro` redirect to `/dev/ui-b1`.
- Productive canvas integration of B1 remains **pending explicit user confirmation**.
- Runtime/Renderer/BFF/Ingest connection is **out of scope** until `045-R3A-X4-1`.

Classification: `ui_B1_visual_candidate_ready_for_runtime_binding`

## B2 / Transformación presentation

B2 visual candidate reuses **Instrumento** (`OfficialCanvasB2InstrumentSection` + shared `canvas-b1-instrument.module.css`).

**Authority chain (UI-B2):** Madre Bloque 2 (Downloads docx SHA `0E134EE7…CCD38CC`) → semantics/options/help/UX → matrix control families → Instrumento shell.

- Production candidate = Madre always-visible base **2.1, 2.3, 2.4a, 2.4b, 2.5, 2.6, 2.7, 2.9, 2.11** (`createB2VisualStubViewModel`).
- Dimension paths / relations / exceptions / clarifications / causal = reference fixtures only (`?fixture=`).
- Help = Madre `help_text` completo (sin truncar).
- `section-model` status: **`official_pending`** (not productive-canvas official).
- Productive canvas / B1 integration remains **out of scope** until explicit instruction.
- Runtime/Renderer/BFF/Ingest connection is **out of scope** until `045-R3A-X4-2`.

Classification: `ui_B2_visual_candidate_ready_for_runtime_binding`

## B4 / Cadena causal presentation

B4 visual candidate reuses **Instrumento** (`OfficialCanvasB4InstrumentSection` + shared `canvas-b1-instrument.module.css`).

**Authority chain (UI-B4):** Madre Bloque 4 (docx SHA `B4DAB985…87C6`) → semantics/options/help/UX → matrix control families → Instrumento shell.

- Production candidate = Madre always-visible base **4.1–4.13** (`createB4VisualStubViewModel`).
- Conditionals / clarifications / causal = reference fixtures only (`?fixture=conditional|clarification|causal`).
- Help = Madre `help_text` completo (sin truncar).
- `section-model` status: **`official_pending`** (companion-only; not productive-canvas official).
- Productive canvas / B1–B3 integration remains **out of scope** until explicit instruction.
- Runtime/Renderer/BFF/Ingest connection is **out of scope** until `045-R3A-X4-4`.
- `local_sequence_authority = false` (no local show/hide sequencer).

Classification: `ui_B4_visual_approved_exportable_pending_canvas_integration`  
Export inventory: `docs/eve/runtime/materialized/UI-B4-approval-exportable.{md,json}`  
Integration: **deferred** until explicit user order (canvas ready).

## B5 / Capacidad presentation

B5 visual candidate reuses **Instrumento** (`OfficialCanvasB5InstrumentSection` + shared `canvas-b1-instrument.module.css`).

**Authority chain (UI-B5):** Madre Bloque 5 (docx SHA `43C1D19E…6488`) → semantics/options/help/UX → matrix control families → Instrumento shell.

- Production candidate = Madre always-visible user capture **5.0, 5.1, 5.2, 5.4–5.12, 5.14** (`createB5VisualStubViewModel`). Excludes `5.0_auto`, derived `5.3`, conditionals `5.13`/`5.14b`, clarifications.
- Conditionals / clarifications / derived / metric_time / causal = reference fixtures only (`?fixture=`).
- Help = Madre `help_text` completo (sin truncar).
- Inherits `dimension_dominante` stub from B2 (`{X}` resolution on 5.0).
- `section-model` status: **`official_pending`** (companion-only; not productive-canvas official).
- Productive canvas / B1–B4 integration remains **out of scope** until explicit instruction.
- Runtime/Renderer/BFF/Ingest connection is **out of scope** until `045-R3A-X4-5`.
- `local_sequence_authority = false` (no local show/hide sequencer).
- Matrix xlsx may be absent in worktree; expected SHA `5DC4E7A8…1059` recorded in `MATRIX_SHA256.txt` / docs (PARTIAL matrix gate).

Classification: `ui_B5_visual_candidate_ready_for_runtime_binding`

## Authority

- **Presentation:** official canvas sections
- **B0 function:** `OfficialCanvasSignificadoBuilder` (contracts shared with `SignificadoEditor`) + `/api/significado/block0`
- **Post-B0 sequence:** Runtime FULL via Client BFF (X4 binds B05); UI-B05 mounts visual stub only
- Assistance ≠ Runtime authority

## Sequence

FREEZE → EXTRACT/PORT → REDIRECT → TEST → DELETE

## Next

X3P CLOSED. UI-B05 visual materiality complete → wait for explicit **045-R3A-X4-05**.  
UI-B1 Instrumento approved visually → wait for explicit **canvas integration confirmation**, then **045-R3A-X4-1**.

Handoff: `docs/eve/runtime/materialized/045-R3A-UI-B05-B7-new-chat-handoff.md`
