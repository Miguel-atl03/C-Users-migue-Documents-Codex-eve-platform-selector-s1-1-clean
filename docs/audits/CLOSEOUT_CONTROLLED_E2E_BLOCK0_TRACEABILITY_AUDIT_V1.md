# CLOSEOUT — CONTROLLED-E2E-BLOCK0-TRACEABILITY-AUDIT-V1

## 1. Dictamen

**CONTROLLED_E2E_BLOCK0_TRACE_READY_WITH_GAPS**

La demo `/dev/e2e-block0` expone trazabilidad dev verificable (WorkMap → flatten → selección primaria → actividad Significado → prefill B0-Q01) con invariantes y banners de error. Los tests de contrato pasan al 100%.

Gap pendiente: verificación manual en browser no ejecutada en esta sesión (dev server no validado en host).

## 2. Qué trazabilidad se agregó

### Panel “Ver traza demo” (solo `/dev/e2e-block0`)

**A. Fuente del WorkMap**
- `sourceMode`: `manual` | `loaded_financial_example`
- `savedWorkMapExists`
- `responsibilitiesCount`
- `flattenedActivitiesCount`
- timestamp ISO de guardado

**B. Actividades aplanadas**
Tabla con: `flattenedIndex`, `responsibilityIndex`, `activityIndexWithinResponsibility`, `activityId`, `activityTitle`, `responsibilityTitle`.

**C. Selección primaria**
- policy `PRIMARY_ACTIVITY_SELECTION_V1_2`
- `selectedCount`, `maxAllowed: 8`
- Tabla por actividad seleccionada: índices fuente, título, `selectionReason`, ranking interno (dev only)

**D. Actividad actual Significado**
- índice `N de 8`, título, índices fuente, `exactMatchInFlattenedWorkMap`, `inSelectedPrimaryActivities`

**E. Prefill B0-Q01**
- `prefillSourceActivityTitle`, `prefillBuiltFromCurrentActivity`
- subcampos action / object / procedureOrStandard / output
- estados epistémicos con etiquetas dev (`inferido-workmap`, `contexto-workmap`)

### Estado y validación (`e2e-block0-demo-state.ts`)
- `flattenFilledWorkMapActivities()`
- `validateE2eBlock0TraceInvariants()` → banners rojos `TRACEABILITY_ERROR: …`
- `buildE2eBlock0DemoTrace()` ampliado

### Diferenciación manual vs fixture
- `workMapSourceMode` en page: `manual` al iniciar WorkMap vacío; `loaded_financial_example` al pulsar “Cargar ejemplo financiero”
- Botón **Reset demo** para recorridos limpios
- Detección de fixture leakage en modo manual (`isE2eFinancialFixtureWorkMap`, literales del fixture)

## 3. Invariantes verificadas

| Invariante | Implementación |
|---|---|
| currentActivity ∈ flattenedActivities | `exactMatchInFlattenedWorkMap` + error banner |
| currentActivity ∈ selectedPrimaryActivities | `inSelectedPrimaryActivities` + error banner |
| prefill source = currentActivity | `prefillBuiltFromCurrentActivity` + error banner |
| manual no usa fixture | IDs `act-e2e-*` y literales fixture → error banner |

## 4. Recorrido A — ejemplo financiero (esperado)

Tras cargar ejemplo, guardar y continuar a Significado:

| Campo | Valor esperado |
|---|---|
| sourceMode | `loaded_financial_example` |
| flattenedActivitiesCount | **17** |
| selectedCount | **8** |
| currentActivity | primera primaria seleccionada (runtimeOrder 1) |
| source flattenedIndex | índice en tabla B coherente con `activityId` |
| prefillBuiltFromCurrentActivity | **true** |
| traceabilityErrors | **[]** |

## 5. Recorrido B — manual mínimo (esperado)

Tras Reset demo → captura manual 2×2 → guardar → continuar:

| Campo | Valor esperado |
|---|---|
| sourceMode | **manual** |
| flattenedActivitiesCount | **4** (2 resp × 2 actividades con texto) |
| selectedCount | ≤ 8 (4 si todas pasan gates) |
| currentActivity | literal del mapa manual, no del fixture |
| fixture leakage | **sin** IDs `act-e2e-*` ni literales financieros |
| prefillBuiltFromCurrentActivity | **true** |

## 6. Tests con exit codes

| Suite | Resultado |
|---|---|
| `e2e-block0-demo-contract.test.ts` | **pass 21/21**, exit 0 |
| `workmap-to-block0-prefill.test.ts` | **pass 15/15**, exit 0 |
| `significado-de-trabajo-slice.test.ts` | **pass 20/20**, exit 0 |
| `primary-activity-selection-policy.test.ts` | **pass 10/10**, exit 0 |

## 7. Git status / diff

```
BASELINE_CONTAMINATION_PREEXISTING
```

Git no disponible de forma fiable en el entorno de ejecución (ownership / no repo).

## 8. Recomendación

**B. Corregir trazabilidad antes** — solo en el sentido de **completar verificación manual en host** (Recorridos A y B en `http://localhost:3000/dev/e2e-block0`). La implementación y tests automatizados están listos; falta confirmación visual en browser.

Tras Recorridos A/B OK → pasar a **A. Aprobar Bloque 0 y pasar a Bloque 0.5**.

FIN — CONTROLLED-E2E-BLOCK0-TRACEABILITY-AUDIT-V1
