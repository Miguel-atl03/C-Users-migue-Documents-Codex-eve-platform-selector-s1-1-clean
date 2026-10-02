# Plan de integración §12 — Matrices Base 40 y Causal 20

**Archivo canónico:** `RECTOR_POINT_12_MATRICES_INTEGRATION_PLAN.md`  
**Sustituye:** `RECTOR_POINT_12_MATRICES_INTEGRATION_PLAN_REVIEW.md` (revisión vinculante 2026-07-17)  
**Tipo:** planificación vinculante — **aprobada** (ajustes de enum/razón) → autoriza **solo Entrega A**  
**Fecha:** 2026-07-17  

---

## 0. Objetivo

Corregir y completar el plan de integración de las superficies:

- **Matriz Base 40**
- **Matriz Causal 20**

antes de iniciar Entrega A.

El plan separa **Entrega A (Base 40)**, **Entrega B (Causal 20)** y **Entrega C (Gaps, timers, revisión y readiness)**; usa lectura read-only; y prohíbe `0/40` / `0/20` sin evidencia de universo evaluable.

### 0.1 Ajustes vinculantes de aprobación (obligatorios)

Antes de implementar, el plan queda corregido así:

1. **Enum unificado:** el único token permitido es `not_evaluated`.  
   Queda **prohibido** el alias con guion `not-evaluated` en contratos, docs y código.

2. **`selectionReasonSource`:** solo `"branching-decision" | "unavailable"`.  
   - La razón factual de columna proviene **únicamente** de `branching_decision.reason`.  
   - Si no existe `reason` vinculable → etiqueta **No disponible** y `selectionReasonSource: "unavailable"`.  
   - `trigger_signal` y `source_signal` son **evidencia de soporte** (drawer/trazabilidad); **nunca** `selectionReasonSource` ni valor de la columna «Razón de selección».  
   - Queda **eliminado** cualquier `runtime-source-signal` (u homólogo) como fuente de razón.

---

## 1. Autoridades

### 1.1 Diseño rector

`Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx`

Jerarquía obligatoria:

```
Caso
→ Usuario
→ Rol funcional
→ Sesión funcional
→ Actividad primaria
→ Run
```

Título §12 del rector: **Runtime 40+20 y bloques individuales**.

### 1.2 Diseño complementario aprobado

`Diseno_Complementario_Runtime_Matrices_Base_Causal_Panel_EVE_v1_1.docx`

Define las dos superficies detalladas (Matriz Base 40 / Matriz Causal 20).  
**Amplía** visual y operativamente §12; **no sustituye** el diseño rector.

### 1.3 Prohibición

No usar la razón de selección de la **actividad primaria** (§11: `selectionReasonCode` / `selectionReasonText` / política de primarias) para explicar la selección de preguntas Base o Causales.

---

## 2. Columnas exactas (congeladas)

La UI utilizará **exactamente** estas columnas, en este orden. No modificar el orden en implementación.

### 2.1 Matriz Base 40

| # | Columna |
|---|---------|
| 1 | ID |
| 2 | Nodo fuente |
| 3 | Pregunta base seleccionada |
| 4 | Razón de selección |
| 5 | Cierre satisfactorio |
| 6 | Bloqueo |
| 7 | Revisión |
| 8 | Función |

**No** agregar columna independiente «Bloque».  
El bloque se **deriva del ID**: `B0-Q01`, `B0.5-Q05` (alias UI de `B05-Q05`), `B1-Q08`, …, `B7-Q40`.

### 2.2 Matriz Causal 20

| # | Columna |
|---|---------|
| 1 | ID |
| 2 | Prioridad/clase |
| 3 | Activación documental |
| 4 | Razón de selección |
| 5 | Cierre satisfactorio |
| 6 | Bloqueo si falla |
| 7 | Bloquea ready pleno |

---

## 3. Llave Prioridad/clase (Causal)

Cada causal ocupa **una fila individual**.  
La columna Prioridad/clase produce la llave compuesta:

```
P0-C05  P0-C09  P0-C11  P0-C20
P1-C02  P1-C03  P1-C04  P1-C08  P1-C13  P1-C14  P1-C15
P2-C16  P2-C17  P2-C18  P2-C19
P3-C01  P3-C06  P3-C07  P3-C10  P3-C12
```

No mostrar una sola fila agrupada por prioridad.

```ts
type CausalPriorityKey = `P${0 | 1 | 2 | 3}-C${string}`;
```

Fuente de prioridad en código operativo: `CAUSAL20_P0_IDS` … `CAUSAL20_P3_IDS` (`causal20-operational-rule.ts`).

---

## 4. Separar catálogo y realidad del run

### 4.1 Regla canónica (catálogo del complemento)

Proviene del catálogo (Anexo A / causal del complemento; materializable en `runtime-*-matrix.catalog.ts`):

- función;
- nodos fuente;
- activación documental;
- cierre obligatorio;
- bloqueo si falla;
- prioridad;
- si bloquea ready pleno.

### 4.2 Resultado factual (run concreto)

Proviene del run:

- pregunta efectivamente ejecutada;
- razón factual de selección;
- estado de resolución / cierre;
- evidencia disponible;
- flag o bloqueo real;
- gap real;
- reentry;
- revisión manual;
- impacto factual sobre readiness.

**La regla de catálogo no demuestra que algo ocurrió.**

Ejemplo:

- Regla: `B4-Q24` debe cerrar espera, evento y timer.  
- Realidad del run: **No evaluado**.  
- No presentar la regla como resolución o bloqueo factual.

---

## 5. Diseño interno de celdas (sin columnas nuevas)

### 5.1 Cierre satisfactorio

- **Regla esperada:** [texto de cierre obligatorio]  
- **Resultado factual:** Cerrado / Abierto / No evaluado / No disponible  

### 5.2 Bloqueo

- **Regla si falla:** [texto canónico]  
- **Situación factual:** Sin bloqueo / Flag / Bloqueada / No evaluada / No disponible  

### 5.3 Revisión

Acción operativa concreta **solo si existe fuente factual** (gap / timer / decision / semantic event), p. ej.:

- Reentry B0 / Reentry B4  
- Aclaración requerida  
- Revisión manual  
- Resolver timer  
- Completar ruta canónica  
- Sin acción requerida  
- No disponible  

No generar acciones por interpretación libre del front-end.

### 5.4 Activación documental causal

- **Regla de activación:** [condición canónica]  
- **Evaluación factual:** Activada / No activada con evidencia / Desconocida / No evaluada  

### 5.5 Bloquea ready pleno

- **Regla:** Sí / No  
- **Impacto factual actual:** Bloquea / No bloquea / No evaluable  

---

## 6. Fuente de «Pregunta base seleccionada»

Trazabilidad:

```
interacción Base
→ runtime_interaction_mapping
→ nodo/pregunta realmente ejecutado
→ source_node_ref.source_question_code
```

Mostrar **únicamente** el código del nodo efectivamente ejecutado (`0.1a`, `1.8`, `4.4`, `6.10`, …).

No listar todos los nodos fuente del catálogo como si todos se hubieran preguntado.

Sin evidencia del nodo ejecutado → **No disponible** (no inferir desde catálogo).

---

## 7. Fuente de «Razón de selección»

### 7.1 Base 40

```
interacción Base abierta o seleccionada
→ branching_decision (opened_interaction_id)
→ branching_decision.reason
```

La razón factual de la columna es **únicamente** `branching_decision.reason`.

`trigger_signal` / `source_signal` (u otros campos de señal) son **evidencia de soporte** para trazabilidad en drawer/adaptador; **no** constituyen `selectionReasonSource` ni sustituyen la razón cuando `reason` falta.

### 7.2 Causal 20

```
condición causal evaluada
→ branching_decision (opened_interaction_id)
→ branching_decision.reason
```

Misma regla: la columna «Razón de selección» = `branching_decision.reason` o **No disponible**.

### 7.3 Prohibición

Nunca usar `selectionReasonCode` / `selectionReasonText` de la política de actividades primarias (§11).  
Nunca usar texto de catálogo, `activation_signal` canónico ni `trigger_signal`/`source_signal` como valor de la columna «Razón de selección».

### 7.4 Ausencia de fuente

Si no hay `branching_decision.reason` vinculable a la interacción del run:

- Razón de selección: **No disponible**  
- `selectionReasonSource: "unavailable"`  
- `dataStatus: "unavailable"` (o `not_evaluated` si el run es consultable pero sin decisión)

**Confirmación schema P3:** `public.branching_decision` incluye `run_id`, `opened_interaction_id`, `trigger_signal`, `reason`.
---

## 8. Estados exactos — Matriz Base (congelados)

### 8.1 Resolución factual

Alineados con `BASE40_ALLOWED_STATES`:

- `captured_user_evidence`
- `user_confirmed_prefill`
- `canonical_derivation_closed`
- `internal_calculated_closed`
- `not_applicable_with_evidence`
- `ready_with_flag`
- `blocked_by_missing_evidence`
- `blocked_by_missing_canonical_route`
- `reentry_required`
- `manual_review_required`
- `inferred_unconfirmed`
- `skipped_silently` — **estado prohibido / violación** (señalar si aparece)

### 8.2 Disponibilidad de datos (separada)

- `available`
- `partial`
- `not_evaluated`
- `unavailable`
- `error`

| Etiqueta UI | Significado |
|-------------|-------------|
| **No evaluado** (`not_evaluated`) | Existe run y contrato consultable; la interacción **no** tiene evaluación registrada |
| **No disponible** (`unavailable`) | No puede consultarse de forma segura la información necesaria o falta el contrato factual |

### 8.3 Adaptador de derivación (planificado, sin inventar)

No existe tabla dedicada `base_resolution_record`. La Entrega A debe usar un **adaptador de lectura** documentado que combine, cuando existan:

| Señal | Tabla / campo |
|-------|----------------|
| Instancia | `runtime_interaction_instance.state` |
| Episteme | `runtime_subfield_response.epistemic_status` |
| Gaps / reentry / manual | `readiness_gap_record`, `readiness_decision_record`, `semantic_resolution_event` |

Si la combinación no alcanza un estado de §8.1 con evidencia → `factualResolutionState = null` y `dataStatus = not_evaluated | unavailable` (nunca inventar cierre).

---

## 9. Estados exactos — Matriz Causal (congelados)

### 9.1 Cierre causal

Alineados con `CAUSAL20_ALLOWED_STATES`:

- `not_triggered_with_evidence`
- `triggered_required`
- `answered_closed`
- `closed_by_confirmed_negative`
- `closed_not_applicable`
- `activation_unknown`
- `triggered_unanswered`
- `route_missing`
- `contradiction_flag`
- `manual_review_required`
- `reentry_required`

### 9.2 Disponibilidad

Igual que Base: `available` | `partial` | `not_evaluated` | `unavailable` | `error`.

### 9.3 Reglas

- No mostrar **«No activada»** sin evidencia explícita de evaluación (`not_triggered_with_evidence`).  
- Ausencia de instancia causal **no** prueba no activación, cierre ni no aplicabilidad → **No evaluada** o **No disponible**.

---

## 10. Contratos de fila (planificación)

### 10.1 Base

```ts
type BaseMatrixRowView = {
  id: string;
  sourceNodes: string[];
  selectedQuestionNode: string | null;

  selectionReasonLabel: string | null;
  selectionReasonSource: "branching-decision" | "unavailable";

  mandatoryClosureRule: string;
  factualResolutionState: string | null;

  blockingRule: string;
  factualBlockingState:
    | "none"
    | "flag"
    | "blocked"
    | "not_evaluated"
    | "unavailable";

  reviewActionLabel: string | null;
  functionLabel: string;

  evidencePresent: boolean | null;
  dataStatus:
    | "available"
    | "partial"
    | "not_evaluated"
    | "unavailable"
    | "error";
};
```

### 10.2 Causal

```ts
type CausalMatrixRowView = {
  id: string;
  priorityClassKey: string; // P0-C05 …

  documentaryActivationRule: string;
  factualActivationState:
    | "triggered"
    | "not-triggered-with-evidence"
    | "unknown"
    | "not_evaluated"
    | "unavailable";

  selectionReasonLabel: string | null;
  selectionReasonSource: "branching-decision" | "unavailable";

  mandatoryClosureRule: string;
  factualClosureState: string | null;

  blockingRule: string;
  factualBlockingState:
    | "none"
    | "flag"
    | "blocked"
    | "not_evaluated"
    | "unavailable";

  blocksFullReadinessRule: boolean;
  blocksFullReadinessFactually: boolean | null;

  dataStatus:
    | "available"
    | "partial"
    | "not_evaluated"
    | "unavailable"
    | "error";
};
```

Ajustar a convenciones del repo; **no** eliminar la separación regla vs hecho.

---

## 11. Filtros exactos (solo lectura)

### 11.1 Matriz Base

Estado de resolución · Bloque derivado del ID · Evidencia faltante · Flag · Bloqueo · Reentry · Revisión manual · Ruta canónica faltante · No evaluada · No disponible

### 11.2 Matriz Causal

Prioridad P0–P3 · Estado causal · Activada · No activada con evidencia · Activación desconocida · Bloquea ready pleno · Gap · Reentry · Revisión manual · Ruta faltante · No evaluada · No disponible

---

## 12. Drawer / detalle contextual (read-only)

Campos previstos:

ID · Actividad primaria · Run · Nodo o interacción · Regla canónica · Estado factual · Razón de selección · Evidencia disponible · Fuente de evidencia · Flag o bloqueo · Motivo · Acción requerida · Historial mínimo

Sin evidencia sensible completa sin capability autorizada.  
La matriz debe bastar para reconocer el estado sin depender del drawer.

---

## 13. Entregas A / B / C

### Entrega A — Matriz Base 40

| Paso | Entrega | Criterio |
|------|---------|----------|
| A0 | Plan + bitácora Base | Este plan citado |
| A1 | Catálogo 40 IDs | Sin columna Bloque; alias B0.5 |
| A2 | `BaseMatrixRowView` | Estados §8 congelados |
| A3 | Adaptador catálogo + overlay | Ausencia ≠ cero; no `base_visible_count` como x/40 |
| A4 | BFF `base-matrix` + detalle | Auth acumulativa |
| A5 | UI tabla/filtros/drawer | Read-only; celdas duales §5 |
| A6 | Pruebas + capturas reales | Ver §16 |

**Checkpoint A (interno):** regresiones OK → continuar a B.  
Validación real en navegador obligatoria.

### Entrega B — Matriz Causal 20

| Paso | Entrega | Criterio |
|------|---------|----------|
| B0 | Bitácora Causal | Tras checkpoint A |
| B1 | Catálogo 20 + `priorityClassKey` | Una fila por causal |
| B2 | `CausalMatrixRowView` | Estados §9 |
| B3 | Adaptador overlay | «No activada» solo con evidencia |
| B4 | BFF `causal-matrix` | Misma auth |
| B5 | Tabs Base↔Causal | Sin KPI % global |
| B6 | Pruebas + capturas | Ver §16 |

**Checkpoint B (interno):** regresiones OK → continuar a C.

### Entrega C — Gaps, timers, revisión y readiness

**Objetivo:** conectar matrices con fuentes factuales de gap, timer, reentry, manual review y readiness.

| Paso | Entrega | Criterio |
|------|---------|----------|
| C0 | Inventario tablas P3 | Cardinalidad confirmada |
| C1 | Adaptador gaps y timers | Sin inferir desde texto de catálogo |
| C2 | Estado revisión/reentry | Acción factual (§5.3) |
| C3 | Impacto readiness | P0/P1/P2/P3 aplicado factual |
| C4 | Pie operativo | §14 |
| C5 | Pruebas | Gaps, timers, reentry, readiness reales |

**Sin Entrega C no declarar el complemento cerrado operacionalmente.**

#### Fuentes P3 confirmadas (C0)

| Necesidad | Tabla |
|-----------|--------|
| Gaps | `readiness_gap_record` |
| Readiness | `readiness_decision_record` |
| Timer / espera | `process_state_timer_event` |
| Semántica / revisión | `semantic_resolution_event` |
| Branching | `branching_decision` |
| Instancias | `runtime_interaction_instance` |
| Mapping / pregunta | `runtime_interaction_mapping`, `source_node_ref` |
| Subcampos | `runtime_subfield_response` |

---

## 14. Pie operativo (footer común)

Estado de avance:

- Puede avanzar  
- Puede avanzar con restricciones  
- Bloqueado  
- No evaluable  

**No** calcular solo por conteo. Considerar: Base no cerradas · flags · causales abiertas · prioridad · gaps · reentry · revisión manual · evidencia de no activación · readiness factual.

Si faltan fuentes → **No evaluable**.

---

## 15. Orden de ejecución

```
Entrega A — Matriz Base 40
  → validación real en navegador
  → checkpoint técnico interno

Entrega B — Matriz Causal 20
  → validación real en navegador
  → checkpoint técnico interno

Entrega C — Gaps, timers, revisión y readiness
  → validación integral

Dictamen final del complemento
```

- No ejecutar A, B y C en paralelo.  
- Tras A: detenerse en checkpoint; continuar a B solo si regresiones pasan.  
- Tras B: continuar a C.  
- Aprobación de usuario al cierre del conjunto, salvo bloqueo factual.  
- **Plan aprobado (con §0.1):** se autoriza iniciar **exclusivamente Entrega A — Matriz Base 40**. No iniciar B ni C en la misma ola.

---

## 16. Capturas y pruebas planificadas

Todas desde **navegador real**. Amber solo para vacío factual. Estados completos con datos **test-only**.

### Entrega A

40 filas · pregunta seleccionada · razón factual · cierre · bloqueo · revisión · filtros · detalle  

`reports/local/rector-point-12-base-matrix/screenshots/`

### Entrega B

20 causales · llave prioridad/clase · activación documental · razón factual · estados de cierre · readiness rule  

`reports/local/rector-point-12-causal-matrix/screenshots/`

### Entrega C

gap · timer · reentry · revisión manual · P0 bloqueante · ready con restricciones · no evaluable  

`reports/local/rector-point-12-gates-readiness/screenshots/`

---

## 17. Congelado fuera de alcance

- Empresa → Relación → Caso; §§7–9; layout Atención  
- Persistencia / ciclo de vida §11 (salvo wiring run → matrices)  
- Staging / producción; inserts Amber  
- Migraciones nuevas (primera ola = schema P3 existente)  
- Mutación Runtime desde el panel  
- Reutilizar crudo `/api/eve/runtime-40-20/*` sin adaptador oficial  
- KPI global `x/40` / `x/20` / barra % de 60 preguntas  
- §13  

Si la derivación auditada resulta imposible sin tablas nuevas: **bloquear y documentar**, no improvisar.

---

## 18. BFF propuesto (oficial)

Prefijo: `/api/eve/official-consultant-control-panel/`

1. `GET .../runs/:runId/runtime/base-matrix`  
2. `GET .../runs/:runId/runtime/causal-matrix`  
3. `GET .../runs/:runId/runtime/base/:baseId`  
4. `GET .../runs/:runId/runtime/causal/:causalId`  
5. (Entrega C) `GET .../runs/:runId/runtime/gaps-readiness` (o equivalente)

Auth acumulativa:

Consultor ∧ Empresa ∧ Relación ∧ Caso ∧ Participante ∧ Perfil ∧ Sesión ∧ Actividad **primaria effective** ∧ Run ∧ (Bloque/fila cuando aplique).

---

## 19. Relación con código / docs previos

Cualquier implementación o dictamen que declare §12-B «cerrada» **antes** de este plan corregido (§0.1) queda **sujeta a realineación** en Entregas A→B→C.  
Tras la aprobación con §0.1, la implementación autorizada es **solo Entrega A**.

---

## 20. Decisión de planificación

### Comprobación de fuentes

| Requisito | Confirmado en repo |
|-----------|-------------------|
| Catálogo Base/Causal | Sí (`runtime-*-matrix.catalog.ts` + reglas BASE40/CAUSAL20) |
| Run / sesión / primaria | Sí (P3 + §10 links + §11 effective) |
| Branching → razón | Sí (`branching_decision`) con degradación a unavailable |
| Pregunta ejecutada | Sí (`mapping` + `source_question_code`) con degradación |
| Estados resolución (enum) | Sí en operational-rules; overlay vía adaptador + not_evaluated |
| Gaps / timers / readiness | Sí (tablas P3) → Entrega C |
| Sin migraciones nuevas | Sí (plan no las autoriza) |

### Veredicto

**PLAN APROBADO — INICIAR SOLO ENTREGA A**

Condiciones:

1. Ejecutar solo Entrega A (Matriz Base 40) bajo §0.1.  
2. No declarar complemento cerrado sin Entrega C.  
3. Degradar a `not_evaluated` / `unavailable` ante ausencia de overlay; nunca inventar.  
4. Mantener razón de matrices ≠ razón §11; razón = solo `branching_decision.reason`.

---

## 21. Dictamen de esta revisión documental

```
Plan §12 actualizado y aprobado.

Ajustes vinculantes:
- enum unificado: not_evaluated (prohibido not-evaluated)
- selectionReasonSource: branching-decision | unavailable
- trigger_signal / source_signal = evidencia de soporte, no razón
- sin reason → No disponible

Entrega A: Matriz Base 40 — AUTORIZADA.
Entrega B: Matriz Causal 20 — pendiente checkpoint A.
Entrega C: Gaps, timers, revisión y readiness — pendiente.

Columnas congeladas.
Estados Base y Causal congelados.
Fuentes de Razón de selección diferenciadas de §11.
No evaluado separado de No disponible.

PLAN APROBADO — INICIAR SOLO ENTREGA A
```
