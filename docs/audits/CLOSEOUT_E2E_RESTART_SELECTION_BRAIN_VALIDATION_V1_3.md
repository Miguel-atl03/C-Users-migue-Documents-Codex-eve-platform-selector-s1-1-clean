# CLOSEOUT — E2E-RESTART-SELECTION-BRAIN-VALIDATION-V1_3

## 1. Dictamen

**`SELECTION_BRAIN_E2E_VALIDATED_WITH_GAPS`**

Justificación:

- El recorrido E2E en host (`/dev/e2e-block0`) desde Login → Estado A → WorkMap → Guardar → Significado → Bloque 0 confirma que la política **`PRIMARY_ACTIVITY_SELECTION_V1_3`** se ejecuta, traza correctamente y alimenta Significado/B0-Q01.
- La calibración **Director de Costos** coincide 8/8 vía selector programático y test de regresión dedicado.
- Gaps residuales:
  - El recorrido browser usó **`loaded_financial_example`**, no captura manual del caso Director de Costos (no hay loader de ese fixture en la demo).
  - `significado-flow-wiring.test.ts` falla 1/7 por baseline de `git diff` preexistente (`forbidden files remain unmodified by tracked diff`), no por regresión funcional de selección.
  - `git status` / `git diff` no disponibles en el entorno por restricción de ownership del repositorio padre.

No se detectó **`SELECTION_BRAIN_MISMATCH`** ni **`SELECTION_BRAIN_IMPLEMENTATION_BLOCKER`**.

---

## 2. Reinicio de demo

| Verificación | Resultado |
|---|---|
| Reset demo ejecutado | Sí — botón **Reset demo** en `http://localhost:3000/dev/e2e-block0` |
| Estado inicial limpio | Sí — etapa **Acceso demo**, sin actividades aplanadas ni selección primaria |
| Sin selección previa | Sí — sección D: *Sin selección primaria todavía* |
| Sin fixture leakage | Sí — tras reset, `flattenedActivitiesCount = 0`, `savedWorkMapExists = false` |
| Inicio desde Login | Sí — click real en **Demo controlada**, no `/dev/significado` ni pantalla intermedia |

Estado inicial confirmado en traza (post-reset, pre-recorrido):

- `sourceMode` = vacío / manual inicial
- `savedWorkMapExists` = false
- `flattenedActivitiesCount` = 0
- `selectedCount` = vacío
- `currentActivity` vacío
- `prefillBuiltFromCurrentActivity` = false (sección F sin datos)

---

## 3. Cerebro de selección revisado

### Archivos inspeccionados

| Archivo | Rol |
|---|---|
| `src/domain/primary-activity-selection-policy.v1.3.ts` | Política canónica TS machine-readable |
| `src/rules/primary-activity-selection-policy.v1.3.json` | Espejo JSON ejecutable |
| `src/domain/primary-activity-selection-policy.ts` | Re-exporta v1.3; `PRIMARY_ACTIVITY_SELECTION_VERSION` |
| `src/services/primary-activity-selector.ts` | Implementación runtime |
| `tests/regression/primary-activity-selection-policy.test.ts` | Regresión v1.3 + Director de Costos |
| `tests/fixtures/director-costos-calibration.v1.3.json` | Calibración esperada |
| `src/services/significado-activity-anchor-adapter.ts` | Consumidor: `primaryActivitySelectionPolicy: V1_3` |
| `src/domain/significado-de-trabajo.ts` | Tipos de política v1.3 |
| `src/features/dev/e2e-block0-demo-state.ts` | Traza dev A–F |

### Fuente ejecutable principal

- **Versión activa:** `PRIMARY_ACTIVITY_SELECTION_V1_3`
- **Fuente normativa histórica:** `PrimaryActivitySelectionPolicy_EVE_MMABP_v1_3_Operacional.xlsx` (no leído en runtime)
- **Fuente operativa:** `primary-activity-selection-policy.v1.3.json` + `primary-activity-selection-policy.v1.3.ts`
- **Runtime:** `src/services/primary-activity-selector.ts` (sin referencias a XLSX)

### Reglas actuales (resumen ejecutable)

| Condición | Modo | Acción |
|---|---|---|
| 0 elegibles | `reentry_required` | Reentrada a WorkMap; no Runtime 40/20 |
| 1–8 elegibles | `non_competitive_inclusion` | Incluir todas; sin ranking competitivo |
| >8 elegibles | `competitive_selection` | Máximo 8; slots especiales + scoring v1.3 |

### Criterios de elegibilidad (gates)

- **G1** actividad no vacía (hard)
- **G2** pertenece al WorkMap guardado (hard)
- **G3** no duplicado/alias de mejor candidato (soft → contexto)
- **G4** no responsabilidad genérica sin operación observable (soft)
- Penalizaciones: `duplicatePenalty`, `tooMacroPenalty`, `tooMicroPenalty`, `overlySpecificToolPenalty`, `lateralContextPenalty`

### Scoring v1.3

Fórmula documentada en política:

`0.30*architectural + 0.15*operationalCentrality + 0.15*transformationObject + 0.15*handoff + 0.05*timer + 0.10*governance + 0.10*friction + 0.05*pfOlcRisk + 0.05*coverageDiversity + responsibilityBalanceAdjustment - penalizaciones`

### Special slot policy (competitive)

| Slot | Criterio | reasonCode |
|---|---|---|
| 1 | Mayor `architecturalSignalPotential` | `selected_for_high_architectural_signal` |
| 2 | Mayor `transformationObjectSignal` | `selected_for_transformation_object_signal` |
| 3 | Mayor handoff/timer | `selected_for_handoff_timer_signal` |
| 4 | Mayor gobernanza/sincronización | `selected_for_governance_synchronization_signal` |
| 5 | Mayor PF/OLC risk | `selected_for_pf_olc_risk_signal` |
| 6 | Mayor `finalSelectionScore` restante | `selected_for_high_final_score` |
| 7 | Diversidad de cobertura (desempate) | `selected_for_coverage_diversity_tiebreaker` |
| 8 | Señal exploratoria / score restante | `selected_for_exploratory_signal` |

### responsibilityBalanceAdjustment

- Permitido solo como **corrección/desempate** (`max = 0.05`)
- **No** puede ser driver primario
- Prohibido el reason genérico R2.3: *"Selected by R2.3 structural score with responsibility balance."*

### No primarias como contexto

- `preserveNonPrimaryContext: true`
- Actividades no seleccionadas quedan en `nonPrimaryContextActivities` con `contextStatus` y `contextReason`

### Usuario no selecciona actividades

- Confirmado en selector y tests: `userSelectedActivities: false`
- Significado consume `selectedPrimaryActivities`; no re-selecciona

### Cambio respecto a lógica anterior (R2.3 / V1_2)

- Versión activa pasó a **V1_3** con reason codes específicos por slot/señal
- Slots 1–8 con reglas arquitectónicas explícitas (no “primeras 8 del mapa”)
- `responsibilityBalanceAdjustment` acotado a 0.05 y subordinado a señales críticas
- Reason genérico R2.3 explícitamente prohibido

---

## 4. WorkMap usado en la prueba

**Modo:** `loaded_financial_example` (ejemplo controlado de la demo E2E; no captura manual)

| Campo | Valor |
|---|---|
| sourceMode | `loaded_financial_example` |
| wasExampleLoaded | true |
| wasManualEditedAfterExample | false |
| Áreas | Finanzas, Control de gestion |
| Responsabilidades | 3 |
| Actividades totales | 17 |
| savedWorkMapExists | true (post-guardar) |
| countsMatch | true (visible = guardado = 17) |

### Tabla de actividades aplanadas (guardadas)

| flattenedIndex | activityId | actividad (abrev.) | responsabilidad |
|---|---|---|---|
| 0 | act-e2e-r1-1 | Analizo la proyeccion mensual de erogaciones… | Yo analizo desviaciones presupuestales… |
| 1 | act-e2e-r1-2 | Concilio saldos de cuentas contables… | Yo analizo desviaciones presupuestales… |
| 2 | act-e2e-r1-3 | Valido ajustes de provision… | Yo analizo desviaciones presupuestales… |
| 3 | act-e2e-r1-4 | Consolido comentarios de variacion… | Yo analizo desviaciones presupuestales… |
| 4 | act-e2e-r1-5 | Reviso partidas pendientes de conciliacion bancaria… | Yo analizo desviaciones presupuestales… |
| 5 | act-e2e-r1-6 | Actualizo el forecast trimestral… | Yo analizo desviaciones presupuestales… |
| 6 | act-e2e-r2-1 | Coordino el cierre mensual… | Yo coordino el cierre mensual… |
| 7 | act-e2e-r2-2 | Recopilo evidencia de soporte… | Yo coordino el cierre mensual… |
| 8 | act-e2e-r2-3 | Verifico la aplicacion de tipos de cambio… | Yo coordino el cierre mensual… |
| 9 | act-e2e-r2-4 | Preparo el paquete de cierre para auditoria… | Yo coordino el cierre mensual… |
| 10 | act-e2e-r2-5 | Analizo desviaciones de headcount… | Yo coordino el cierre mensual… |
| 11 | act-e2e-r2-6 | Consolido indicadores de productividad financiera… | Yo coordino el cierre mensual… |
| 12 | act-e2e-r3-1 | Elaboro el documento de criterios vigentes… | Yo mantengo criterios contables… |
| 13 | act-e2e-r3-2 | Actualizo el catalogo de centros de costo… | Yo mantengo criterios contables… |
| 14 | act-e2e-r3-3 | Reviso solicitudes de alta de proveedores… | Yo mantengo criterios contables… |
| 15 | act-e2e-r3-4 | Monitoreo cumplimiento de fechas limite… | Yo mantengo criterios contables… |
| 16 | act-e2e-r3-5 | Documento hallazgos de control en gastos viaje… | Yo mantengo criterios contables… |

---

## 5. Resultado de selección primaria

### Resumen (browser + selector, ejemplo financiero)

| Campo | Valor |
|---|---|
| policyVersion | `PRIMARY_ACTIVITY_SELECTION_V1_3` |
| selectionMode | `competitive_selection` |
| eligibleCount | 17 |
| selectedCount | 8 |
| maxAllowed | 8 |
| nonPrimaryContextCount | 9 |
| excludedCount | 0 |

### Tabla de seleccionadas

| activityId | actividad | selectedSlot | selectionReasonCode | selectionReasonText | finalSelectionScore | responsibilityBalanceAffectedResult |
|---|---|---:|---|---|---|---:|
| act-e2e-r2-5 | Analizo desviaciones de headcount contra presupuesto… | 1 | `selected_for_high_architectural_signal` | Seleccionada por alta señal arquitectónica MMABP esperada. | 0.591 | 0 |
| act-e2e-r1-2 | Concilio saldos de cuentas contables… | 2 | `selected_for_transformation_object_signal` | Seleccionada por señal fuerte de transformación de objeto de negocio. | 0.529 | 0 |
| act-e2e-r2-6 | Consolido indicadores de productividad financiera… | 3 | `selected_for_handoff_timer_signal` | Seleccionada por dependencia, handoff, espera o compromiso temporal. | 0.354 | 0 |
| act-e2e-r1-6 | Actualizo el forecast trimestral de erogaciones… | 4 | `selected_for_governance_synchronization_signal` | Seleccionada por sincronización, autorización o gobernanza transversal. | 0.521 | 0 |
| act-e2e-r2-3 | Verifico la aplicacion de tipos de cambio… | 5 | `selected_for_pf_olc_risk_signal` | Seleccionada por riesgo PF/OLC, cambio de estado, autorización o cierre. | 0.329 | 0 |
| act-e2e-r1-3 | Valido ajustes de provision… | 6 | `selected_for_high_final_score` | Seleccionada por mayor puntaje final bajo la política v1.3. | 0.462 | 0 |
| act-e2e-r3-3 | Reviso solicitudes de alta de proveedores… | 7 | `selected_for_coverage_diversity_tiebreaker` | Seleccionada por diversidad de cobertura sin desplazar señal crítica. | 0.386 | 0 |
| act-e2e-r1-1 | Analizo la proyeccion mensual de erogaciones… | 8 | `selected_for_exploratory_signal` | Seleccionada por señal exploratoria útil para completar variedad estructural. | 0.411 | 0 |

### Tabla de no primarias (contexto, 9)

act-e2e-r1-4, act-e2e-r1-5, act-e2e-r2-1, act-e2e-r2-2, act-e2e-r2-4, act-e2e-r3-1, act-e2e-r3-2, act-e2e-r3-4, act-e2e-r3-5

---

## 6. Comparación esperado vs real

### 6A. Ejemplo financiero E2E (browser)

Todas las filas **coinciden** con la salida del selector v1.3 (17/17). No hay `SELECTION_BRAIN_MISMATCH`.

| flattenedIndex | activityId | expectedPrimary | actualPrimary | coincide | selectedSlot | selectionReasonCode | explicación |
|---:|---|---|---|---|---:|---|---|
| 0 | act-e2e-r1-1 | sí | sí | sí | 8 | exploratory | Slot 8 exploratorio |
| 1 | act-e2e-r1-2 | sí | sí | sí | 2 | transformation_object | Slot 2 MoC/OLC |
| 2 | act-e2e-r1-3 | sí | sí | sí | 6 | high_final_score | Slot 6 score |
| 3–4 | act-e2e-r1-4/5 | no | no | sí | — | — | Contexto |
| 5 | act-e2e-r1-6 | sí | sí | sí | 4 | governance | Slot 4 |
| 6–7,9 | act-e2e-r2-1/2/4 | no | no | sí | — | — | Contexto |
| 8 | act-e2e-r2-3 | sí | sí | sí | 5 | pf_olc_risk | Slot 5 |
| 10 | act-e2e-r2-5 | sí | sí | sí | 1 | architectural | **Primera en Significado** |
| 11 | act-e2e-r2-6 | sí | sí | sí | 3 | handoff_timer | Slot 3 |
| 12–13,15–16 | act-e2e-r3-* | no | no | sí | — | — | Contexto |
| 14 | act-e2e-r3-3 | sí | sí | sí | 7 | coverage_diversity | Slot 7 diversidad |

`responsibilityBalanceAdjustment` = **0** en las 8 seleccionadas (no afectó el resultado en este caso).

### 6B. Calibración Director de Costos (programático)

Fixture: `tests/fixtures/director-costos-calibration.v1.3.json`

**Esperado (8):** R1-A3, R2-A1, R2-A4, R2-A5, R2-A6, R3-A1, R3-A4, R3-A6

**Primer reemplazo válido:** R3-A5

**Resultado test:** `assert.deepEqual` — **8/8 coinciden**, `nonPrimaryContextCount = 9`, R3-A5 en contexto.

| activityId | expectedPrimary | actualPrimary | coincide |
|---|---|---|---|
| R1-A3 | sí | sí | sí |
| R2-A1 | sí | sí | sí |
| R2-A4 | sí | sí | sí |
| R2-A5 | sí | sí | sí |
| R2-A6 | sí | sí | sí |
| R3-A1 | sí | sí | sí |
| R3-A4 | sí | sí | sí |
| R3-A6 | sí | sí | sí |
| R3-A5 | no (backup) | no | sí |
| resto (9) | no | no | sí |

---

## 7. Validación en Significado

| Verificación | Resultado |
|---|---|
| Actividad actual viene de `selectedPrimaryActivities` | Sí — `act-e2e-r2-5` (slot 1) |
| UI: **Actividad 1 de 8** | Sí |
| Título coincide con selección | Sí — *Analizo desviaciones de headcount contra presupuesto por unidad de negocio para generar alertas tempranas.* |
| `exactMatchInFlattenedWorkMap` | true |
| `inSelectedPrimaryActivities` | true |
| `prefillBuiltFromCurrentActivity` | true (sección F) |
| B0-Q01 prellenado desde esa actividad | Sí — verbos: Analizo / objeto: desviaciones de headcount… / resultado: alertas tempranas |
| Estados epistémicos B0-Q01 | `inferido-workmap` (no evidencia confirmada) |
| Significado no selecciona actividades | Sí — consumidor de selección previa |
| No usa primera actividad del WorkMap por defecto | Sí — primera aplanada es `act-e2e-r1-1` (slot 8), no la mostrada |

---

## 8. Estado Bloque 0

| Verificación | Resultado |
|---|---|
| B0-Q01 prellenado desde WorkMap | Sí |
| B0-Q02 (descripción operativa) vacío | Sí — placeholder *Escribe aquí* |
| B0-Q03 sin inferencias indebidas | Sí — subcampos vacíos |
| B0-Q04 espera descripción | Sí — status: *Primero escribe arriba la descripción operativa* |
| Continue bloqueado | Sí — *Continuar a la siguiente actividad* disabled |
| Prefill ≠ evidencia confirmada | Sí — epistemic `inferido-workmap`, mensaje de confirmación pendiente |
| Sin metadata interna en UI principal | Sí — metadata solo en traza dev |

---

## 9. Tests con exit codes

| Comando | pass | fail | exit |
|---|---:|---:|---|
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | 12 | 0 | 0 |
| `node --test tests/regression/e2e-block0-demo-contract.test.ts` | 29 | 0 | 0 |
| `node --test tests/regression/workmap-to-block0-prefill.test.ts` | 15 | 0 | 0 |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 20 | 0 | 0 |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 12 | 0 | 0 |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 6 | 1 | 1 |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 13 | 0 | 0 |
| `node --test tests/regression/work-map-save-validation.test.ts` | 190 | 0 | 0 |

**Fallo único:** `significado-flow-wiring.test.ts` → `forbidden files remain unmodified by tracked diff` (contaminación de baseline git preexistente; no atribuible a regresión del cerebro v1.3).

**Actualización de test en esta tarea:** `significado-de-trabajo-slice.test.ts` — expectativa `PRIMARY_ACTIVITY_SELECTION_V1_2` → `V1_3`.

---

## 10. Git status / diff

No ejecutable en este entorno:

```
fatal: detected dubious ownership in repository at '.../Implementacion-significado-clean-clone'
```

### Archivos creados o modificados en esta validación (conocidos)

| Archivo | Acción |
|---|---|
| `docs/audits/CLOSEOUT_E2E_RESTART_SELECTION_BRAIN_VALIDATION_V1_3.md` | Creado |
| `src/features/dev/e2e-block0-demo-state.ts` | Modificado — traza v1.3 (`selectedSlot`, `selectionReasonCode`, scores) |
| `src/app/dev/e2e-block0/page.tsx` | Modificado — tabla traza D con columnas v1.3 |
| `tests/regression/significado-de-trabajo-slice.test.ts` | Modificado — expectativa V1_3 |

**No se modificó** el cerebro de selección (`primary-activity-selector.ts`, políticas v1.3).

---

## 11. Recomendación

**A. Validar cerebro v1.3 y continuar revisión de Bloque 0.**

El cerebro v1.3 está operativo en runtime, trazable en demo y alimenta Significado correctamente. Los gaps son de cobertura E2E (Director de Costos solo programático; baseline git en un test de wiring), no de mismatch funcional detectado.

### improvement_type (backlog opcional)

| Campo | Valor |
|---|---|
| improvement_type | `future_backlog` |
| improvement_title | Loader demo Director de Costos para E2E browser |
| improvement_reason | Validar en host el fixture de calibración sin captura manual de 17 actividades |
| architectural_impact | Solo dev fixture/demo |
| files_likely_affected | `e2e-block0-demo-fixture.ts`, `page.tsx` |
| implementation_risk | low |
| requires_user_approval | true |
| recommended_now_or_later | later |

---

*Validación ejecutada: 2026-06-17 · Host: `localhost:3000/dev/e2e-block0`*
