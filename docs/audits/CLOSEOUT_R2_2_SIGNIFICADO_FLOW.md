# CLOSEOUT R2.2 - Significado flow wiring

## 1. Dictamen ejecutivo

Estado: R2_2_READY_WITH_DEVIATIONS

R2.2 fue implementado materialmente en el clean integration sandbox: `Significado de tu trabajo` queda insertado entre WorkMap H12 y `questionnaire_main`, sin crear API nueva, sin Supabase nuevo, sin Runtime y sin tocar internals de WorkMap.

El bloqueo inicial no venia del nuevo wiring R2.2: `tests/regression/significado-flow-wiring.test.ts` pasaba 7/7. El bloqueo venia de tests pre-R2.2 que todavia codificaban la regla anterior "Significado no debe estar en page.tsx":

- `tests/regression/significado-de-trabajo-slice.test.ts`: falla 1/17 porque espera que `src/app/page.tsx` no contenga `SignificadoDeTuTrabajo`.
- `tests/regression/workmap-h12-page-wiring.test.ts`: falla 3/5 porque espera que no exista `intake_significado`, que WorkMap `onContinue` siga apuntando al pipeline directo, y que exista `saveWorkMapIntake`.

Esos tests fueron reconciliados en `R2.2 test reconciliation`. El unico bloqueo restante es ambiental: `npx.cmd tsc --noEmit` no llega a compilar por `EACCES` de npm/cache.

## 2. Cambios aplicados

| Archivo | Cambio | Motivo |
| --- | --- | --- |
| `src/lib/types.ts` | Agrega `"intake_significado"` a `EveFlowState` | Habilitar estado de flujo R2.2 entre WorkMap y questionnaire. |
| `src/app/page.tsx` | Importa `SignificadoDeTuTrabajo` y `SignificadoSubmitPayload` | Renderizar pantalla Significado y tipar submit in-memory. |
| `src/app/page.tsx` | Agrega paso visible `intake_significado` | Reflejar avance en navegación/progreso. |
| `src/app/page.tsx` | Extrae `runPostWorkMapQuestionnairePipeline(draft)` | Reutilizar pipeline existente WorkMap -> `/api/intake/triple` -> rank/bootstrap -> `questionnaire_main`. |
| `src/app/page.tsx` | Agrega `continueFromWorkMapToSignificado(draft)` | WorkMap Continue ya no rankea ni bootstrappea; solo avanza a Significado. |
| `src/app/page.tsx` | Agrega `submitSignificadoIntake(payload)` | Valida boundary locks y entonces ejecuta pipeline post-WorkMap. |
| `src/app/page.tsx` | Agrega render branch `flowState === "intake_significado"` | Inserta Significado entre WorkMap y questionnaire con back seguro a WorkMap. |
| `tests/regression/significado-flow-wiring.test.ts` | Nuevo test estatico R2.2 | Verifica Significado entre WorkMap y questionnaire, locks y fronteras. |
| `docs/audits/CLEAN_INTEGRATION_SANDBOX_PREP.md` | Actualizado | Documenta estado R2.2. |

## 3. Flujo final R2.2

```text
intake_work_map
  -> WorkMapIntake
  -> continueFromWorkMapToSignificado
  -> intake_significado
  -> SignificadoDeTuTrabajo
  -> submitSignificadoIntake
  -> runPostWorkMapQuestionnairePipeline
  -> flattenWorkMapToActivities
  -> /api/intake/triple phase:"continue"
  -> rankActivities
  -> bootstrapScenes
  -> questionnaire_main
```

Si `workMap` es `null` en `intake_significado`, el page muestra un estado seguro y solo permite volver a `intake_work_map`.

## 4. Fronteras

- No API phase Significado.
- No API phase Sentido.
- No Supabase nuevo.
- No Runtime.
- No diagnostico nuevo.
- No export.
- No transduccion.
- No WorkMap internals.
- No `SceneQuestionnaireRunner`.
- No `package.json` ni `package-lock.json`.

## 5. Tests

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | 13/13 pass |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | 190/190 pass |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 1 | 16/17 pass; falla assertion pre-R2.2 que prohibe `SignificadoDeTuTrabajo` en `page.tsx`. |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 1 | 2/5 pass; falla por contrato pre-R2.2 que prohibe `intake_significado` y espera pipeline directo desde WorkMap. |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | 7/7 pass |

## 6. TypeScript

`npx.cmd tsc --noEmit`

Resultado: exit code 1, `ENV_BLOCKED`.

Detalle: npm intento acceder a `https://registry.npmjs.org/tsc` y fallo con `EACCES`; tampoco pudo escribir logs en `C:\Users\migue\AppData\Local\npm-cache\_logs`.

No hay evidencia de error TypeScript por `page.tsx` o `types.ts`; la ejecucion no llega a compilar.

## 7. Estado git

`git status --short`:

```text
 M src/app/page.tsx
 M src/lib/types.ts
?? docs/audits/
?? public/eve-logo.png
?? src/app/dev/
?? src/components/EveLogo.tsx
?? src/components/GuideCardBody.tsx
?? src/components/WorkMapIntake.tsx
?? src/components/client/
?? src/components/eve-logo.module.css
?? src/components/guide-card-body.module.css
?? src/components/significado/
?? src/components/work-map-intake.module.css
?? src/domain/significado-de-trabajo.ts
?? src/domain/start-position-context.ts
?? src/domain/work-map.ts
?? src/features/
?? src/services/significado-activity-anchor-adapter.ts
?? src/services/significado-draft.ts
?? src/services/work-map-activity-validation.ts
?? src/services/work-map-flatten.ts
?? src/services/work-map-operational-readiness.ts
?? src/services/work-map-responsibility-validation.ts
?? src/services/work-map-save-validation.ts
?? tests/regression/significado-activity-anchor-adapter.test.ts
?? tests/regression/significado-de-trabajo-slice.test.ts
?? tests/regression/significado-flow-wiring.test.ts
?? tests/regression/work-map-operational-readiness.test.ts
?? tests/regression/work-map-save-validation.test.ts
?? tests/regression/workmap-h12-page-wiring.test.ts
```

`git diff --name-only`:

```text
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

## 8. ZIP externo

Creado:

`C:\Users\migue\Documents\r2-2-clean-integration-sandbox.zip`

Tamano: 154,305 bytes.

Entradas: 49 archivos.

Verificacion de exclusiones: `tar -tf ... | rg '(^|/)package(-lock)?\.json$|^src/app/api/|^sql/|runtime-engine|^middleware\.ts$'` no encontro coincidencias.

## 9. Riesgos restantes

- No branch/commit.
- `tsc` `ENV_BLOCKED`.
- Tests pre-R2.2 deben reconciliarse o retirarse del gate R2.2.
- Significado sigue client-side/in-memory; no hay persistencia backend.
- Refresh puede depender de draft local de Significado.
- Ranking no consume prioridad Significado todavia.
- R2.4 backend/persistencia pendiente.

## R2.2 test reconciliation

Dictamen actualizado: R2_2_READY_WITH_DEVIATIONS.

Tests pre-R2.2 que fallaban:

- `tests/regression/significado-de-trabajo-slice.test.ts`: prohibia `SignificadoDeTuTrabajo` en `src/app/page.tsx`.
- `tests/regression/workmap-h12-page-wiring.test.ts`: esperaba ausencia de `intake_significado` y pipeline directo WorkMap -> `questionnaire_main`.

Cambios aplicados a tests:

- `significado-de-trabajo-slice.test.ts`: la dev route sigue aislada, pero `page.tsx` puede importar/renderizar Significado. El test ahora bloquea fases/API nuevas `significado`/`sentido`, `intake_sentido` y Runtime.
- `workmap-h12-page-wiring.test.ts`: el contrato queda post-R2.2: `intake_work_map` -> `continueFromWorkMapToSignificado` -> `intake_significado`; el pipeline `runPostWorkMapQuestionnairePipeline` queda como unico puente hacia `questionnaire_main`.

Resultados post-reconcile:

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | 13/13 pass |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | 190/190 pass |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | 17/17 pass |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 0 | 6/6 pass |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | 7/7 pass |

TypeScript:

- `npx.cmd tsc --noEmit`: exit code 1, `ENV_BLOCKED` por `EACCES` al intentar acceder a npm registry/cache. No hay evidencia de error de compilacion en `page.tsx`/`types.ts` porque `tsc` no arranca.

Fronteras:

- No se modifico producto en esta reconciliacion.
- No se tocaron APIs, Supabase, Runtime, WorkMap internals, Significado component/services ni package files.
- `src/app/page.tsx` y `src/lib/types.ts` siguen apareciendo en `git diff --name-only` por el wiring R2.2 previo, no por esta tarea.

## 10. Recomendacion

A. Pasar a QA manual visual/funcional.

La implementacion R2.2 y los gates reconciliados pasan. Mantener como desviaciones: `tsc` bloqueado por entorno, sin branch y sin commit.

## R2.2 MBA alignment patch

Dictamen actualizado: MBA_ALIGNMENT_READY_WITH_DEVIATIONS.

Se alineo `Significado de tu trabajo` al documento rector MBA v1.1:

- La pantalla ya no solicita prioridad, claridad, energia ni carga.
- La pantalla comunica que EVE prepara las preguntas desde el mapa de trabajo.
- Se conserva resumen de WorkMap, aviso `savedWithWarnings`, continuar a preguntas y volver al mapa.
- `selectedPrimaryActivityId` queda como compatibilidad deprecated y no se deriva de preferencia del usuario.
- La prioridad legacy de draft no se transporta en el bundle activo.
- El payload conserva `workMapSnapshot`, `traceableActivities` y locks `diagnosticsEnabled`, `exportEnabled`, `transductionEnabled` en `false`.
- Se agrega gobernanza: `selectionGovernance: "eve_policy_required"`, `primaryActivitySelectionPolicy: "not_implemented_in_r2_2"` y `userPriorityDoesNotSelectRuntimeActivities: true`.

Tests post-alignment:

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | 13/13 pass |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | 190/190 pass |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 0 | 6/6 pass |
| `node --test tests/regression/significado-flow-wiring.test.ts` | 0 | 7/7 pass |
| `node --test tests/regression/significado-mba-alignment.test.ts` | 0 | 4/4 pass |

TypeScript/lint:

- `npx.cmd tsc --noEmit`: exit code 1, `ENV_BLOCKED` por `EACCES` npm registry/cache.
- `npm run lint`: exit code 1, `ENV_BLOCKED` porque `eslint` no esta disponible localmente.

Fronteras confirmadas:

- No API nueva.
- No Supabase.
- No Runtime.
- No diagnostico.
- No export.
- No transduccion.
- No WorkMapIntake.
- No work-map services.
- No package files.
