# CLOSEOUT · Sandbox types minimal

## 1. Dictamen ejecutivo

TYPES_READY_WITH_DEVIATIONS

`src/lib/types.ts` quedo reconstruido con el minimo esperado por `workmap-h12-types.diff`: `intake_work_map`, re-export de `ActivityDeclaredContext` y `declaredContext` opcional en `Activity`.

La desviacion viva es TypeScript global: `npx.cmd tsc --noEmit` ejecuta, pero falla por baseline no reconciliado en `src/app/page.tsx`, `src/app/api/coach/**`, paquetes Significado/export y otros archivos fuera del alcance permitido. No se corrigio porque esta tarea prohibe tocar `page.tsx`, APIs, Significado, Runtime y package files.

## 2. Cambios aplicados

| Simbolo | Accion | Motivo |
| --- | --- | --- |
| `ActivityDeclaredContext` | Importado desde `@/domain/work-map` y re-exportado | El diff rector lo usa para conservar contexto declarado de WorkMap. |
| `EveFlowState` | Agregado `"intake_work_map"` | Estado minimo para WorkMap H12. |
| `EveFlowState` | Retirado `"intake_significado"` | El encargo prohibe que aparezca en este paso minimo. |
| `Activity.declaredContext` | Agregado como opcional | Necesario para ranking/trazabilidad WorkMap sin conectar Significado. |

## 3. Evidencia de diff

Resumen de `git diff -- src/lib/types.ts`:

- Agrega `import type { ActivityDeclaredContext } from "@/domain/work-map";`.
- Agrega `export type { ActivityDeclaredContext };`.
- Agrega `"intake_work_map"` a `EveFlowState`.
- Agrega `declaredContext?: ActivityDeclaredContext;` a `Activity`.
- No aparece `intake_significado`.
- No aparece `intake_sentido`.
- No se agregan tipos de diagnostico, export, transduccion, Runtime ni Significado.

## 4. Tests

| Test | Exit code | Resultado |
| --- | ---: | --- |
| `node --test tests/regression/work-map-operational-readiness.test.ts` | 0 | 13/13 pass |
| `node --test tests/regression/work-map-save-validation.test.ts` | 0 | 190/190 pass |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 12/12 pass |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | 17/17 pass |

## 5. TypeScript

`npx.cmd tsc --noEmit`: exit code 1.

No fue `EACCES`; el comando ejecuto y reporto errores globales de baseline, incluyendo:

- `src/app/page.tsx` todavia referencia `"intake_significado"`, que esta tarea debe mantener fuera de `EveFlowState`.
- `src/app/api/coach/operational-description/route.ts` tiene `string | undefined` asignado a `string`.
- `src/components/significado/SignificadoDeTuTrabajo.tsx` contiene errores de tipos de draft/iconos y referencia a `currentActivity.id`.
- Multiples servicios de `operational-description-coach` usan imports con extension `.ts` no aceptada por la configuracion actual.
- Export/significado repositories tienen arrays con `null` no filtrado segun tipos.

Clasificacion: `TSC_BASELINE_BLOCKED_BY_UNRECONSTRUCTED_PAGE_AND_PREEXISTING_SIGNIFICADO`.

## 6. Riesgos restantes

- `page.tsx` aun no esta reconstruido para el estado minimo WorkMap H12.
- Significado aun aparece en baseline local, pero no fue conectado ni modificado en este paso.
- Hay tracked diffs preexistentes en `src/app/page.tsx`, `src/app/admin/runtime-vsm/page.tsx`, export services y otros archivos.
- No se hizo branch, commit, reset, checkout ni stash.
- TypeScript global no puede usarse aun como gate limpio hasta reconciliar baseline.

## 7. Recomendacion siguiente

A. Reconstruir `page.tsx` minimo WorkMap H12.
