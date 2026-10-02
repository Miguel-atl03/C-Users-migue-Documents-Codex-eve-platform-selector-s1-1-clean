# CLOSEOUT R2.3 - PrimaryActivitySelectionPolicy

## 1. Dictamen ejecutivo

`R2_3_SELECTION_POLICY_READY_WITH_DEVIATIONS`

PrimaryActivitySelectionPolicy v1.2 quedo implementada in-memory antes de Significado. La seleccion primaria ahora pertenece a EVE, no al usuario. Significado recibe el resultado de seleccion como payload operacional, no muestra selector, y el pipeline usa hasta 8 actividades primarias seleccionadas sin mutar el WorkMap original.

Desviaciones: `tsc` y `lint` quedaron `ENV_BLOCKED` por entorno local incompleto/restringido; la seleccion sigue en memoria y aun no hay persistencia/backend R2.4.

## 2. Documentos rectores usados

- `docs/policies/PrimaryActivitySelectionPolicy_EVE_MMABP_v1_2_Operacional.xlsx`
- `docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx`
- `docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx`
- `Diseno_MBA_Operacional_Significado_de_tu_trabajo_EVE_v1_1_alineado`

## 3. Cambios aplicados

- Creado `src/domain/primary-activity-selection-policy.ts`.
- Creado `src/services/primary-activity-selector.ts`.
- Creado `tests/regression/primary-activity-selection-policy.test.ts`.
- Actualizado `src/app/page.tsx` para ejecutar `selectPrimaryActivitiesFromWorkMap` antes de Significado.
- Actualizado `src/domain/significado-de-trabajo.ts` para incluir `primaryActivitySelectionResult`.
- Actualizado `src/services/significado-activity-anchor-adapter.ts`.
- Actualizado `src/components/significado/SignificadoDeTuTrabajo.tsx`.
- Actualizado `src/features/significado/significado-copy.ts`.
- Actualizado `src/features/significado/significado-draft-state.ts`.
- Actualizadas pruebas de Significado/wiring para R2.3.

## 4. Reglas v1.2 implementadas

- 0 elegibles -> `reentry_required`.
- 1-8 elegibles -> `non_competitive_inclusion`.
- >8 elegibles -> `competitive_selection`.
- Maximo 8 actividades primarias.
- No hay seleccion del usuario: `userSelectedActivities = false`.
- `primaryActivitySelectionResolvedByUser = false`.
- `selectionGovernance = "eve_policy"`.
- WorkMap completo preservado como contexto.
- Actividades no primarias preservadas como contexto/backlog.
- Runtime budget: 40 base + hasta 20 causales por actividad primaria.
- Scoring minimo: `0.45*MMABP + 0.25*Friction + 0.15*Coverage + 0.10*Evidence + boost - 0.15*Burden`.
- Balance competitivo por responsabilidad y variedad estructural.

## 5. Integracion de flujo

```text
WorkMap H12
  -> selectPrimaryActivitiesFromWorkMap
  -> Significado
  -> submit
  -> questionnaire_main
```

Detalles:

- `continueFromWorkMapToSignificado(draft)` calcula y guarda `PrimaryActivitySelectionResult`.
- Si el modo es `reentry_required`, no avanza a Significado/questionnaire.
- `SignificadoDeTuTrabajo` recibe `primaryActivitySelectionResult`.
- `submitSignificadoIntake` valida candados y gobierno EVE.
- El pipeline usa `selectedPrimaryActivitiesToLegacyActivities(...)` como puente in-memory para compatibilidad.
- `nonPrimaryContextActivities` queda fuera del recorrido primario y se conserva como contexto/backlog.

## 6. Tests con exit codes

| Comando | Exit code |
|---|---:|
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 |
| `node --test tests/regression/primary-activity-selection-policy.test.ts` | 0 |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 0 |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 0 |

## 7. tsc/lint

| Comando | Exit code | Resultado |
|---|---:|---|
| `npx.cmd tsc --noEmit` | 1 | `ENV_BLOCKED`: npm intento resolver `tsc` via registry/cache y fallo con `EACCES`; no se instalaron dependencias. |
| `npm run lint` | 1 | `ENV_BLOCKED`: `eslint` no esta disponible como comando local/ejecutable en este entorno. |

## 8. git diff --name-only

Salida observada:

```text
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

Nota: el workspace ya contiene muchos archivos no rastreados previos; `git diff --name-only` solo reporta cambios rastreados. Los archivos nuevos creados para esta tarea aparecen en `git status --short` como no rastreados.

## 9. Riesgos restantes

- R2.4 persistencia/backend pendiente.
- `selectionResult` es in-memory.
- Refresh/restore puede perder seleccion hasta que se persista.
- Ranking legacy puede seguir existiendo por compatibilidad del pipeline.
- Thresholds semanticos pendientes de afinacion con evidencia real.
- No se hizo branch ni commit.
- `ENV_BLOCKED` para `tsc` y `lint`.

## 10. Recomendacion

**A. Pasar a QA manual visual/funcional R2.3.**

