# Informe — Metodología y documentos usados en los diseños UI por bloque

**Fecha:** 2026-08-24  
**Alcance:** ola visual Cursor (B0.5 → B5)  
**Fuera de alcance:** X4 / Runtime binding / integración al lienzo productivo

---

## 1. Metodología canónica

**Documento:** `docs/eve/runtime/materialized/METODOLOGIA-fabricacion-UI-Runtime-B1-B7.md`

Convierte el piloto B0.5 en proceso repetible para B1–B7.

### Separación de olas

| Ola | Quién | Produce | No hace |
|---|---|---|---|
| UI visual | Cursor | Sección oficial + controles + preview + entregables | Renderer, BFF, Ingest, branching, cert funcional |
| Conformance Runtime↔UI | Codex / X4-n | Binding ViewModel → UI → slot_ref → BFF → next | Rediseñar UI desde cero |

### Jerarquía de autoridad (obligatoria)

```text
Documento Madre del bloque
        ↓
semántica / opciones / help / aclaraciones / UX
        ↓
Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx
        ↓
UI específica en eve-official-canvas (Instrumento)
        ↓
QA visual: no perder ni inventar
```

- **Madre** manda copy y UX del bloque.
- **Matriz** manda familias de control / slots (QA visual).
- **Runtime** no es input de diseño en la ola visual.

### Fases A–H (por bloque)

| Fase | Contenido | Entregable típico |
|---|---|---|
| A Kickoff | Madre path+SHA, Matriz SHA, plan, relaciones interbloque | `UI-B{n}-kickoff-audit.md` |
| B Madre-direct | Fidelidad copy/options/help/visibility | `UI-B{n}-mother-direct-conformance.*` |
| C Matriz visual | Ready visual; **no** binding PASS | `UI-B{n}-matrix-visual-readiness.*` |
| D UI | Instrumento; D4 base + D5 fixtures; sin secuenciador | sección + stub + `/dev/ui-b{n}` |
| E Assistance | Inventario help; `assistance_loss = 0` | `UI-B{n}-assistance-preservation.*` |
| F Binding readiness | Estructura; flags connected = false | `UI-B{n}-runtime-binding-readiness.*` |
| G Tests | Materialidad visual | `runtime-40-20-045-R3A-UI-B{n}-…test.mjs` |
| H STOP | Clasificación + esperar X4-n | `UI-B{n}-final.md` |

### Regla D4 / D5

- **D4 (candidato productivo visual):** solo nodos Madre always-visible.
- **D5 (fixtures de referencia):** condicionales, aclaraciones, causales, derivados — nunca autoridad de preview productivo.
- `local_sequence_authority = false` siempre.

### Hard prohibitions

1. No secuenciador / branching local  
2. No `fallback_textarea` oficial  
3. No inventar controles desde prosa  
4. Diseñar para consumir ViewModel + slot_ref después  
5. Assistance ≠ Runtime authority  
6. No modificar Runtime/BFF/catalog para acomodar mock  
7. No hardcodear next  
8. No commit salvo pedido  
9. No reescribir semántica 60/170 de la matriz  
10. No certificar conformance funcional en ola visual  

---

## 2. Documentos rectores transversales

| # | Documento | Rol |
|---|---|---|
| 1 | `METODOLOGIA-fabricacion-UI-Runtime-B1-B7.md` | Proceso y reglas de fabricación UI |
| 2 | Documento Madre Bn (docx Capa 1 v2.1) | Semántica y copy del bloque |
| 3 | `Matriz_Conformance_Runtime_UI_40_20_por_Bloque_v1_0.xlsx` | QA controles/slots/contrato |
| 3a | SHA Matriz (único baseline) | `5DC4E7A833A2EB5FE6977D290DDBEA855743AF2E9D167245B5B55BB7C1ED1059` |
| 4 | Lienzo `eve-official-canvas` + patrón Instrumento | Chrome / presentación oficial |
| 5 | Entregables `UI-B{n}-*` | Trazabilidad auditable por ola |
| 6 | Runtime / X4-n | Posterior; secuencia y binding |

Hojas Matriz usadas como QA: `01_Interacciones_60`, `02_Slots_170`, `03_Bloques_UI`, `04_Tipos_Control`, `07_Contrato_Integracion`.

---

## 3. Por bloque — Madre y estado UI

| Bloque | Nombre canónico | Documento Madre | SHA Madre (resumen) | Patrón UI | Estado actual |
|---|---|---|---|---|---|
| **B0.5** | Como ocurre | Documento Madre B0.5 | piloto UI-B05-R | Shell B05 / Instrumento | `ui_B05_visual_candidate_ready_for_runtime_binding` |
| **B1** | Disparador | `Bloque_1_Documento_Madre_Capa1_v2_1_EVE.docx` | `d5d92a1d…8319` | Instrumento | candidato / pending honesty `official_pending` |
| **B2** | Transformación | `Bloque_2_Documento_Madre_Capa1_v2_1_EVE.docx` | `0E134EE7…38CC` | Instrumento | **approved exportable** |
| **B3** | Salida | `Bloque_3_…_rev3_alineado.docx` | `1A89CFF4…1B8E` | Instrumento | visual candidate |
| **B4** | Cadena causal | `Bloque_4_Documento_Madre_Capa1_v2_1_EVE.docx` | `B4DAB985…87C6` | Instrumento | **approved exportable** |
| **B5** | Capacidad y discrecionalidad | `Bloque_5_…_rev3.docx` | `43C1D19E…6488` | Instrumento | **approved exportable** |
| B6–B7 | — | — | — | — | pendientes |

### Previews companion (no lienzo productivo)

| Bloque | Preview |
|---|---|
| B0.5 | `/?preview=b05` (según ola) |
| B1 | `/dev/ui-b1` |
| B2 | `/dev/ui-b2` |
| B3 | `/dev/ui-b3` |
| B4 | `/dev/ui-b4` |
| B5 | `/dev/ui-b5` |

---

## 4. Relación secuencial entre bloques (Madre / arquitectura)

```text
B0 → B0.5 → B1 → B2 → B3 → B4 → B5 → B6 → B7
```

| Bloque | Continúa de | Prepara / alimenta | Herencias / notas |
|---|---|---|---|
| B0.5 | B0 | B1 | Piloto de metodología |
| B1 | B0.5 | B2 | Disparador de escena |
| B2 | B1 | B3 | Transformación; deja `dimension_dominante` |
| B3 | B2 | B4 | Salida / receptor |
| B4 | B3 | B5 | Cadena causal / flujo |
| B5 | B4 | B6 | Capacidad; hereda dimensión dominante de **B2** |
| B6+ | B5 | … | Pendiente UI |

**Importante:** la continuidad show/hide entre bloques la decide **Runtime (X4)**, no la UI local.

---

## 5. Artefactos de código / docs por ola

Patrón repetido:

```text
b{n}-madre-copy.ts
b{n}-presentation-contract.ts
b{n}-visual-stub.ts
OfficialCanvasB{n}InstrumentSection.tsx
src/app/dev/ui-b{n}/page.tsx
docs/.../UI-B{n}-*.md|json
docs/.../madre_b{n}_authority/   (cuando rebound Madre-direct)
tests/.../runtime-40-20-045-R3A-UI-B{n}-official-canvas.test.mjs
```

---

## 6. Resumen ejecutivo

Los diseños UI de cada bloque se fabricaron con la **misma metodología** y la **misma Matriz** (SHA fijo), cambiando solo el **Documento Madre** del bloque. El patrón visual convergente es **Instrumento**. Condicionales y causales viven en **fixtures D5**; la secuencia real queda para **X4**. B2, B4 y B5 están **aprobados/exportables** para integración futura al lienzo; **aún no** montados en captura productiva.

---

## 7. Referencias

- `docs/eve/runtime/materialized/METODOLOGIA-fabricacion-UI-Runtime-B1-B7.md`
- `docs/eve/runtime/materialized/UI-B{n}-final.md`
- `docs/eve/runtime/materialized/UI-B{n}-kickoff-audit.md`
- `docs/eve/runtime/materialized/UI-B{n}-approval-exportable.*` (donde aplica)
- Canvas: `canvases/UI-methodology-documents-report.canvas.tsx`
