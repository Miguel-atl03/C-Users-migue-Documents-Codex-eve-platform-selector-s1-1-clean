# CLOSEOUT — CONTROLLED-E2E-WORKMAP-SAVE-SOURCE-TRACE-FIX-V1

## 1. Dictamen

**CONTROLLED_E2E_WORKMAP_SOURCE_TRACE_READY**

La demo `/dev/e2e-block0` ahora separa borrador visible, snapshot guardado y fuente (manual vs ejemplo financiero). El guardado usa el payload de `WorkMapIntake.onSave` / `onContinue` y la traza compara draft vs saved.

## 2. Causa del guardado incorrecto

Dos problemas combinados:

1. **Estado padre desincronizado:** `page.tsx` mantenía un único `workMap` como semilla inicial y como snapshot guardado. Las ediciones vivían solo en el estado interno de `WorkMapIntake` (y en `localStorage` vía `sessionId`), mientras la traza leía el `workMap` padre **antes** de guardar → mostraba áreas/actividades del fixture financiero aunque la UI visible tuviera solo “Construcción”.

2. **Contaminación de localStorage:** el mismo `E2E_BLOCK0_DEMO_SESSION_ID` persistía borradores previos del ejemplo financiero. Sin `clearWorkMapDraft` en Reset / inicio manual, podían mezclarse datos viejos con flujos nuevos.

3. **Banner estático engañoso:** el texto fijo “3 responsabilidades · 17 actividades” sugería fixture incluso en flujo manual.

## 3. Cambios realizados

### Aislamiento manual vs fixture
- `sourceMode`: `manual` | `loaded_financial_example` | `manual_modified_from_example`
- Flags: `wasExampleLoaded`, `wasManualEditedAfterExample`
- `resolveE2eSourceModeAfterSave()` clasifica guardado posterior a edición del ejemplo

### Guardado correcto
- `workMapSeed` → semilla para `WorkMapIntake.initialWorkMap`
- `savedWorkMapSnapshot` → solo actualizado en `onSave` / `onContinue` con el draft visible
- `syncDemoWorkMapDraft()` / `clearDemoWorkMapDraft()` en Reset, inicio manual y carga de ejemplo
- `visibleDraftWorkMap` lee `readWorkMapDraft(sessionId)` durante fase WorkMap para traza en vivo

### Traza dev ampliada
Secciones A–F: fuente, conteos draft/saved, actividades aplanadas, selección primaria (incl. `eligibleCount`, `nonPrimaryContextCount`, contexto no primario), actividad actual, prefill B0-Q01.

### Fixtures de prueba
- `createE2eManualMinimalWorkMap()` — recorrido B (4 actividades)
- Helpers de comparación de áreas y equivalencia estructural con fixture financiero

## 4. Recorrido A — ejemplo financiero

| Campo | Valor esperado |
|---|---|
| sourceMode | `loaded_financial_example` |
| áreas | Finanzas, Control de gestion |
| flattenedActivitiesCount | 17 |
| selectedCount | 8 |
| selectionMode | `competitive_selection` |
| currentActivity | primera primaria seleccionada, en flattened y en selected |
| prefill source | `prefillBuiltFromCurrentActivity = true` |

Validado en test `financial example trace passes invariants when sourceMode matches`.

## 5. Recorrido B — manual mínimo

| Campo | Valor esperado |
|---|---|
| sourceMode | `manual` |
| áreas visibles vs guardadas | coinciden (`areasMatch = true`) |
| flattenedActivitiesCount | 4 |
| selectedCount | 4 |
| selectionMode | `non_competitive_inclusion` |
| fixture leakage | ninguno (`traceabilityErrors` vacío) |
| prefill source | actividad primaria actual |

Validado en test `manual minimal work map uses non_competitive_inclusion`.

## 6. Recorrido C — edición posterior a ejemplo

| Campo | Valor esperado |
|---|---|
| sourceMode | `manual_modified_from_example` |
| saved snapshot | coincide con draft editado (sin restaurar fixture) |
| wasManualEditedAfterExample | `true` |

Validado en test `resolve source mode marks edited example as manual_modified_from_example`.

## 7. Política de selección

Confirmado contra `selectPrimaryActivitiesFromWorkMap`:
- 1–8 elegibles → `non_competitive_inclusion`
- >8 elegibles → `competitive_selection`
- máximo 8 primarias
- no selección por usuario (`userSelectedActivities: false`)
- no primarias excluidas se pierden: `nonPrimaryContextActivities` conserva contexto

## 8. Tests con exit codes

| Suite | Resultado |
|---|---|
| `e2e-block0-demo-contract.test.ts` | **29/29 pass**, exit 0 |
| `workmap-to-block0-prefill.test.ts` | **15/15 pass**, exit 0 |
| `primary-activity-selection-policy.test.ts` | **10/10 pass**, exit 0 |
| `significado-de-trabajo-slice.test.ts` | **20/20 pass**, exit 0 |

## 9. Git status / diff

No evaluado en este entorno (repositorio con restricciones de ownership en sandbox).

## 10. Recomendación

**A. Aprobar Bloque 0 y pasar a Bloque 0.5**

La demo controlada ya permite validar trazabilidad WorkMap → selección primaria → prefill B0-Q01 sin ambigüedad de fuente. Verificación manual en browser recomendada para Recorridos A–C con “Ver traza demo” abierta.

FIN — CONTROLLED-E2E-WORKMAP-SAVE-SOURCE-TRACE-FIX-V1
