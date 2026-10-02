# CLOSEOUT - Sandbox page WorkMap minimal

## 1. Dictamen ejecutivo

Estado: PAGE_WORKMAP_READY_WITH_DEVIATIONS

Se reconstruyo manualmente el flujo minimo WorkMap H12 en `src/app/page.tsx` dentro del clean integration sandbox.

El flujo queda:

`intake_work_map -> WorkMapIntake -> saveWorkMapDraft/saveWorkMapIntake -> flattenWorkMapToActivities -> /api/intake/triple phase:"continue" -> rankActivities -> bootstrapScenes -> questionnaire_main`

No se conecto Significado.
No se agrego `intake_significado`.
No se agrego `intake_sentido`.
No se modifico `WorkMapIntake`.
No se tocaron APIs, Supabase, Runtime ni package files.

Tests WorkMap, Significado y wiring estatico pasan. `npx.cmd tsc --noEmit` quedo `ENV_BLOCKED` por `EACCES`/npm registry-cache.

## 2. Cambios aplicados

| Bloque | Accion | Motivo |
| --- | --- | --- |
| Imports WorkMap | Agregados `WorkMapIntake`, `WorkMapData`, `flattenWorkMapToActivities` | Habilitar page wiring minimo sin tocar componentes/servicios WorkMap. |
| Initial flow | Agregado `useTripleIntake` e `initialIntakeFlowState` | Default a WorkMap H12, preservando `TripleIntake` legacy bajo flag. |
| `steps` | Primer paso cambia entre `intake_work_map` y `intake_main_activities` segun flag | Reflejar flujo activo sin eliminar legacy path. |
| Estado `workMap` | Agregado `useState<WorkMapData | null>` | Mantener draft recibido por `WorkMapIntake` desde page. |
| Session create/restore sin actividades | Ajustado a `initialIntakeFlowState()` | Permitir iniciar/retomar en WorkMap H12 cuando no hay actividades. |
| `saveWorkMapDraft` | Agregado handler minimo con `phase: "save"` | Guardar mapa sin avanzar flujo, sin ranking ni bootstrap. |
| `saveWorkMapIntake` | Agregado handler minimo con flatten, `phase: "continue"`, ranking, bootstrap y `questionnaire_main` | Conectar WorkMap al pipeline existente de cuestionario. |
| Render branch | Agregado branch `flowState === "intake_work_map"` con `WorkMapIntake` | Renderizar WorkMap H12 antes de TripleIntake legacy. |
| Test estatico | Creado `tests/regression/workmap-h12-page-wiring.test.ts` | Guardar fronteras WorkMap si / Significado no. |

## 3. Flujo reconstruido

1. El flujo inicial usa `initialIntakeFlowState()`.
2. Por default, entra a `intake_work_map`.
3. Si `NEXT_PUBLIC_INTAKE_UI === "triple"`, conserva el path legacy `intake_main_activities`.
4. `flowState === "intake_work_map"` renderiza `WorkMapIntake`.
5. `onSave` llama `saveWorkMapDraft`; guarda `workMap` con `phase: "save"` y no avanza.
6. `onContinue` llama `saveWorkMapIntake`; aplana actividades, guarda con `phase: "continue"`, rankea, bootstrappea escenas y pasa a `questionnaire_main`.
7. `questionnaire_main` sigue usando `SceneQuestionnaireRunner` sin modificaciones.

## 4. Exclusiones confirmadas

- No Significado.
- No `intake_significado`.
- No `intake_sentido`.
- No `SignificadoDeTuTrabajo`.
- No `SignificadoSubmitPayload`.
- No API phase `significado`.
- No API phase `sentido`.
- No Supabase nuevo.
- No Runtime.
- No package files.
- No cambios en `src/components/WorkMapIntake.tsx` despues de aplicar paquete.

## 5. Tests

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | 13/13 pass |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | 190/190 pass |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | 17/17 pass |
| `node --test tests/regression/workmap-h12-page-wiring.test.ts` | 0 | 5/5 pass |

Observacion: Node emitio warnings `MODULE_TYPELESS_PACKAGE_JSON`; no se toco `package.json`.

## 6. TypeScript

`npx.cmd tsc --noEmit`

Resultado: exit code 1, `ENV_BLOCKED`.

Detalle: npm intento acceder a `https://registry.npmjs.org/tsc` y fallo con `EACCES`; tampoco pudo escribir logs en `C:\Users\migue\AppData\Local\npm-cache\_logs`.

No hay evidencia de fallo TypeScript causado por `src/app/page.tsx`.

## 7. Estado git

`git status --short` tras la reconstruccion y antes de este reporte:

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
?? tests/regression/work-map-operational-readiness.test.ts
?? tests/regression/work-map-save-validation.test.ts
?? tests/regression/workmap-h12-page-wiring.test.ts
```

`git diff --name-only`:

```text
external-consumers/eve-platform/src/app/page.tsx
external-consumers/eve-platform/src/lib/types.ts
```

Nota: `src/lib/types.ts` corresponde a la tarea anterior `SANDBOX-TYPES-MINIMAL`.

## 8. Riesgos restantes

- Significado aun no esta conectado.
- Restore/session no fue reconstruido completo; se mantuvo el comportamiento legacy salvo la entrada inicial a WorkMap.
- No hay branch/commit.
- `tsc` queda bloqueado por entorno/npm cache.
- R2.2 sigue pendiente.
- El flujo usa `/api/intake/triple` existente; no se tocaron APIs.

## 9. Recomendacion siguiente

A. Auditar manualmente `page.tsx` reconstruido.

Despues de esa auditoria, proceder a R2.2 Significado flow wiring solo si el page minimal queda aceptado.
