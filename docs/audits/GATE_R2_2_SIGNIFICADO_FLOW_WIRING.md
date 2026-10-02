# GATE R2.2 · Significado de tu trabajo · Flow wiring

## 1. Dictamen ejecutivo

Estado: REQUIRES_TREE_CLEANUP.

El slice R2.1.1 de Significado existe y sus tests pasan.
El patch conceptual de R2.2 es pequeno y claro, pero toca justo `src/app/page.tsx` y `src/lib/types.ts`.
`src/app/page.tsx` esta modificado con un diff amplio de front-door, WorkMap, session restore y UI.
`src/lib/types.ts` tambien esta modificado, aunque el diff es pequeno.
`src/components/WorkMapIntake.tsx` aparece como archivo sin seguimiento y tiene 1973 lineas, por lo que Git no puede mostrar diff base.
No hay wiring parcial de Significado en el flujo principal.
No existen `intake_significado` ni `intake_sentido`.
TypeScript global esta rojo por errores externos/preexistentes.
R2.2 no debe aplicarse encima de este arbol sin aislar primero el baseline.

## 2. Evidencia de comandos

| Comando | Exit code | Resultado | Observacion |
|---|---:|---|---|
| `pwd` | 0 | `C:\Users\migue\Documents\Catalogo de preguntas y funcionalidad operativa - Implementacion\external-consumers\eve-platform` | Repo correcto; termina en `external-consumers\eve-platform`. |
| `git status --short` | 0 | Multiples `M` y muchos `??`. | Arbol sucio; incluye `src/app/page.tsx`, `src/lib/types.ts`, APIs, `package.json`, WorkMap y slice R2.1.1 sin seguimiento. |
| `ls` | 0 | Top-level incluye `.next`, `docs`, `src`, `tests`, `scripts`, `sql`, `package.json`, `package-lock.json`. | Repo Next existente; no se detecto `WRONG_REPO`. |
| `git diff --name-only` | 0 | Lista 21 archivos trackeados modificados. | No incluye archivos sin seguimiento como `src/components/WorkMapIntake.tsx` ni el slice R2.1.1. |
| `git diff -- src/app/page.tsx` | 0 | Diff de 1457 lineas; numstat `797 insertions / 393 deletions`. | Contaminacion alta en la superficie principal de R2.2. |
| `git diff -- src/lib/types.ts` | 0 | Diff de 28 lineas; numstat `6 insertions / 0 deletions`. | Cambio pequeno pero preexistente en el tipo de flujo. |
| `git diff -- src/components/WorkMapIntake.tsx` | 0 | Sin stdout. | El archivo esta `??`, no trackeado; `git diff` no muestra contenido. |
| `git diff -- package.json` | 0 | Diff de 278 lineas; numstat `260 insertions / 2 deletions`. | `package.json` contaminado por scripts y dependencia `xlsx`; no tocar en R2.2. |
| `rg -n "type EveFlowState\|EveFlowState\|flowState\|setFlowState\|questionnaire_main\|intake_work_map\|intake_significado\|intake_sentido\|WorkMapIntake\|saveWorkMapIntake\|flattenWorkMapToActivities\|rankActivities\|bootstrapScenes\|SceneQuestionnaireRunner" src/app src/lib src/components src/services` | 0 | Referencias clave en `src/lib/types.ts`, `src/app/page.tsx`, `WorkMapIntake`, `SceneQuestionnaireRunner`, `work-map-flatten`. | No aparecen `intake_significado` ni `intake_sentido`. |
| `rg -n "SignificadoDeTuTrabajo\|SignificadoSubmitPayload\|buildSignificadoSubmitPayload\|extractTraceableWorkMapActivities\|buildActivityAnchorBundle\|evaluateActivityAnchorReadiness\|readSignificadoDraft\|writeSignificadoDraft" src tests docs` | 0 | Referencias en slice/dev, adapter, tests y docs. | No hay referencia a `SignificadoDeTuTrabajo` en `src/app/page.tsx`. |
| `node --test tests/regression/significado-de-trabajo-slice.test.ts` | 0 | 17 tests, 17 pass. | Slice R2.1.1 material y verde; warning ESM por package type. |
| `node --test tests/regression/significado-activity-anchor-adapter.test.ts` | 0 | 10 tests, 10 pass. | Contratos R1 verdes; warning ESM por package type. |
| `npx.cmd tsc --noEmit` | 1 | Errores en `src/app/page.tsx`, `src/domain/work-map.ts`, `src/services/work-map-operational-readiness.ts` y tests externos. | Estado TypeScript global rojo; no corregido por instruccion. |

## 3. Estado del arbol

| Area | Estado | Evidencia | Riesgo para R2.2 |
|---|---|---|---|
| `src/app/page.tsx` | Modificado | `git diff`: 1457 lineas, `797/393`; referencias en lineas aprox. 38, 41, 227, 1171, 1222, 1572, 1608. | Alto: R2.2 debe tocar este archivo justo donde hay cambios grandes. |
| `src/lib/types.ts` | Modificado | `git diff`: 28 lineas; `EveFlowState` en linea aprox. 17; agrega `intake_work_map`. | Medio: cambio futuro minimo es simple, pero el archivo ya tiene diff preexistente. |
| WorkMap | Contaminado/sin seguimiento | `src/components/WorkMapIntake.tsx` aparece `??`, 1973 lineas; servicios WorkMap tambien `??` o modificados. | Alto: no tocar internals WorkMap; usar solo contrato `onContinue(workMap)`. |
| APIs | Modificadas/preexistentes | `src/app/api/intake/triple/route.ts`, restore/bootstrap/runtime aparecen `M` o `??`. | Alto: R2.2 MVP no debe crear phase API ni persistencia backend. |
| `package.json` | Modificado | Diff 278 lineas; scripts runtime/fases y `xlsx`. | Medio/alto: no tocar; tsc warning package type no debe resolverse aqui. |
| R2.1.1 slice | Material sin seguimiento | `src/components/significado/`, `src/features/significado/`, `src/app/dev/significado/page.tsx`, tests y closeout en `??`. | Medio: existe y pasa tests, pero conviene aislarlo en baseline antes de R2.2. |
| Tests | Slice verde, global rojo | 17/17 y 10/10 pass; `tsc` falla en tests externos por `TS5097`. | Medio: R2.2 debe agregar tests nuevos, no arreglar suite global. |

## 4. Mapa real del flujo actual

Flujo WorkMap actual reconstruido:

1. `src/app/page.tsx` importa `WorkMapIntake` en linea aprox. 13.
2. `src/app/page.tsx` define `flowState` con `initialIntakeFlowState` en linea aprox. 227.
3. `src/app/page.tsx` renderiza `WorkMapIntake` cuando `flowState === "intake_work_map"` en lineas aprox. 1572-1598.
4. `WorkMapIntake` recibe `onContinue={saveWorkMapIntake}` en linea aprox. 1582.
5. `src/components/WorkMapIntake.tsx` define prop `onContinue: (workMap: WorkMapData) => void | Promise<void>` en linea aprox. 81.
6. `src/components/WorkMapIntake.tsx` en `handleContinue` bloquea si `!workMap.isSaved` en linea aprox. 1108.
7. Si esta guardado, `WorkMapIntake` llama `await onContinue(payload)` y limpia draft local en lineas aprox. 1120-1121 y 1137-1138.
8. `src/app/page.tsx` define `saveWorkMapIntake` en linea aprox. 1171.
9. `saveWorkMapIntake` ejecuta `flattenWorkMapToActivities(draft)` en linea aprox. 1180.
10. Luego hace `POST /api/intake/triple` con `phase: "continue"` y envia `workMap` + `activities` en lineas aprox. 1190-1203.
11. Despues ejecuta `rankActivities(databaseSessionId)` y `bootstrapScenes(databaseSessionId)` en lineas aprox. 1213-1214.
12. Finalmente hace `setFlowState("questionnaire_main")` en linea aprox. 1222.
13. `SceneQuestionnaireRunner` se renderiza cuando `flowState === "questionnaire_main"` o `support_activity_questionnaire` en lineas aprox. 1606-1617.

Flujo actual real:

```text
WorkMapIntake
  -> onContinue
  -> saveWorkMapIntake
  -> flattenWorkMapToActivities
  -> POST /api/intake/triple phase:"continue"
  -> rankActivities
  -> bootstrapScenes
  -> setFlowState("questionnaire_main")
  -> SceneQuestionnaireRunner
```

## 5. Estado actual de EveFlowState

`EveFlowState` vive en `src/lib/types.ts`, lineas aprox. 17-27.

| Estado | Existe | Uso | Riesgo |
|---|---|---|---|
| `intake_work_map` | Si | Entrada WorkMap cuando `NEXT_PUBLIC_INTAKE_UI !== "triple"`. | Ya es diff preexistente en `types.ts`. |
| `intake_main_activities` | Si | Flujo legacy TripleIntake. | Debe mantenerse. |
| `questionnaire_main` | Si | Pantalla actual de preguntas principales. | R2.2 debe llegar aqui solo despues de Significado. |
| `closure_check` | Si | Loading de verificacion. | No tocar. |
| `support_activity_selected_internal` | Si | Loading de soporte. | No tocar. |
| `support_activity_questionnaire` | Si | Preguntas de actividad soporte. | No tocar. |
| `closure_recheck` | Si | Revalidacion. | No tocar. |
| `micro_clarification` | Si | Aclaracion breve. | No tocar. |
| `intake_completed` | Si | Cierre UI. | No tocar. |
| `intake_significado` | No | Futuro estado R2.2 recomendado. | Cambio minimo requerido. |
| `intake_sentido` | No | No recomendado: puede confundir con naming aprobado. | Evitar; usar `intake_significado`. |

Cambio futuro minimo recomendado: agregar `| "intake_significado"` a `EveFlowState`.

## 6. Patch conceptual R2.2

### 6.1 Types

En `src/lib/types.ts`:

- Agregar `| "intake_significado"` a `EveFlowState`.
- No cambiar `SessionLayer`.
- No cambiar `Activity`.
- No renombrar `intake_work_map`.
- No introducir `intake_sentido`.

### 6.2 Orquestacion en page.tsx

Dividir el handler actual `saveWorkMapIntake` en dos responsabilidades:

1. Nuevo handler de salida de WorkMap:
   - recibe `draft: WorkMapData`;
   - valida `databaseSessionId`;
   - valida que tenga actividades trazables o deja esa validacion para el pipeline posterior;
   - hace `setWorkMap(draft)`;
   - hace `setFlowState("intake_significado")`;
   - no llama `flattenWorkMapToActivities`;
   - no llama `POST /api/intake/triple`;
   - no llama `rankActivities`;
   - no llama `bootstrapScenes`;
   - no salta a `questionnaire_main`.

2. Extraer el pipeline post-WorkMap hoy embebido en `saveWorkMapIntake`:
   - bloque actual de lineas aprox. 1180-1222;
   - conservar `flattenWorkMapToActivities`;
   - conservar `POST /api/intake/triple` con `phase: "continue"`;
   - conservar `rankActivities`;
   - conservar `bootstrapScenes`;
   - conservar `setQuestionnaireScope("main")`;
   - conservar `setQuestionnaireActivities(ranking.primary)`;
   - terminar con `setFlowState("questionnaire_main")`.

3. Nuevo handler submit Significado:
   - recibe `SignificadoSubmitPayload`;
   - verifica locks `diagnosticsEnabled/exportEnabled/transductionEnabled === false` si se quiere guard defensivo;
   - ejecuta el pipeline post-WorkMap usando `payload.workMapSnapshot`;
   - no persiste Significado en backend en R2.2;
   - no conecta runtime ni transduccion.

4. Nuevo render branch:
   - importar `SignificadoDeTuTrabajo`;
   - renderizar cuando `flowState === "intake_significado"`;
   - pasar `workMap={workMap}` solo si existe y esta guardado;
   - pasar `sessionId={databaseSessionId ?? ""}`;
   - `onBack={() => setFlowState("intake_work_map")}`;
   - `onContinue={handleSignificadoContinue}`.

Bloques exactos que hay que mover/dividir en R2.2:

- `saveWorkMapIntake` completo, aprox. lineas 1171-1235.
- Dentro de ese handler, separar el tramo `flattenWorkMapToActivities` -> `setFlowState("questionnaire_main")`, aprox. lineas 1180-1222.
- Render branch alrededor de `WorkMapIntake`, aprox. lineas 1572-1598.
- Render branch de `SceneQuestionnaireRunner`, aprox. lineas 1606-1617, solo para asegurar que Significado queda antes.
- `steps` en aprox. lineas 41-58 para agregar el paso visual de Significado si aplica.

### 6.3 Tests futuros

Antes de aplicar R2.2:

- Crear test de wiring estatico que falle si `EveFlowState` no tiene `intake_significado`.
- Crear test de wiring estatico que falle si `saveWorkMapIntake` llama directamente `rankActivities`, `bootstrapScenes` o `setFlowState("questionnaire_main")`.
- Crear test que asegure que `SignificadoDeTuTrabajo` no aparece en `page.tsx` antes del patch.

Despues de aplicar R2.2:

- Actualizar test para exigir render branch de `SignificadoDeTuTrabajo`.
- Exigir que WorkMap Continue navega a `intake_significado`.
- Exigir que Significado Submit ejecuta el pipeline posterior.
- Exigir que `onBack` vuelve a `intake_work_map`.
- Re-ejecutar tests R2.1.1 y adapter.

## 7. Patch boundary recomendado para R2.2

| Archivo | Accion futura | Obligatorio | Riesgo | Guard |
|---|---|---:|---|---|
| `src/lib/types.ts` | Agregar `intake_significado` a `EveFlowState`. | Si | Medio por diff preexistente. | Cambio de una linea, sin tocar otros tipos. |
| `src/app/page.tsx` | Importar Significado, dividir handler, agregar render branch. | Si | Alto por diff monolitico. | Patch pequeno, revisar hunk por hunk, tests de wiring antes/despues. |
| `tests/regression/significado-flow-wiring.test.ts` | Crear test estatico de flujo. | Si | Bajo | Debe validar no bypass a questionnaire. |
| `docs/audits/CLOSEOUT_R2_2_SIGNIFICADO_FLOW.md` | Crear closeout post-apply. | Si | Bajo | Evidencia de comandos y guards. |

NO tocar en R2.2:

- `src/components/WorkMapIntake.tsx`
- `src/services/work-map-operational-readiness.ts`
- `src/services/work-map-save-validation.ts`
- `src/services/work-map-flatten.ts`
- `src/services/work-map-activity-validation.ts`
- `src/services/work-map-responsibility-validation.ts`
- `src/app/api/**`
- Supabase / SQL / middleware / auth
- runtime engine core
- `questionnaire_main`
- `SceneQuestionnaireRunner`
- `package.json`
- `package-lock.json`

## 8. Estrategia de implementacion recomendada

Eleccion: B. Crear branch/commit limpio con R1/R2.1.1 aislado y luego aplicar R2.2.

Justificacion:

- El patch futuro es pequeno y conceptualmente claro.
- Pero `page.tsx` tiene un diff grande de 1457 lineas y es el archivo central del acople.
- `types.ts` tambien esta sucio, aunque con bajo volumen.
- WorkMap esta en archivos sin seguimiento y no se puede auditar por diff normal.
- `package.json` esta contaminado por un diff grande ajeno.
- `tsc` global esta rojo antes de R2.2.
- Implementar sobre este arbol aumentaria el riesgo de mezclar front-door/session restore/WorkMap con Significado.

No se recomienda A sobre el arbol actual.
No se recomienda C como bloqueo total porque el slice y el patch conceptual si estan listos.

## 9. Tests minimos requeridos para R2.2

| Test | Tipo | Que valida | Archivo sugerido |
|---|---|---|---|
| `EveFlowState includes intake_significado` | Estatico | El estado nuevo existe y no se usa `intake_sentido`. | `tests/regression/significado-flow-wiring.test.ts` |
| `WorkMap Continue enters Significado` | Estatico | `WorkMapIntake` usa handler que hace `setFlowState("intake_significado")`. | `tests/regression/significado-flow-wiring.test.ts` |
| `WorkMap Continue does not call questionnaire_main directly` | Estatico | El handler de WorkMap no contiene `setFlowState("questionnaire_main")`. | `tests/regression/significado-flow-wiring.test.ts` |
| `WorkMap Continue does not rank activities` | Estatico | WorkMap Continue no llama `rankActivities`. | `tests/regression/significado-flow-wiring.test.ts` |
| `WorkMap Continue does not bootstrap scenes` | Estatico | WorkMap Continue no llama `bootstrapScenes`. | `tests/regression/significado-flow-wiring.test.ts` |
| `Significado Submit runs post-WorkMap pipeline` | Estatico | Handler submit contiene `flattenWorkMapToActivities`, POST `phase: "continue"`, `rankActivities`, `bootstrapScenes`. | `tests/regression/significado-flow-wiring.test.ts` |
| `payload locks remain false` | Unit/regression | `diagnosticsEnabled`, `exportEnabled`, `transductionEnabled` siguen `false`. | `tests/regression/significado-de-trabajo-slice.test.ts` o nuevo wiring test |
| `back returns to WorkMap` | Estatico | `onBack` de Significado hace `setFlowState("intake_work_map")`. | `tests/regression/significado-flow-wiring.test.ts` |
| `WorkMap internals untouched` | Estatico | R2.2 no modifica `WorkMapIntake` ni servicios WorkMap. | `tests/regression/significado-flow-wiring.test.ts` o evidencia Git |

## 10. Riesgos y No-Go

- Arbol sucio: muchos `M` y muchos `??`.
- `page.tsx` monolitico: diff actual de 1457 lineas.
- `types.ts` sucio: `EveFlowState` ya fue alterado para `intake_work_map`.
- `package.json` contaminado: 278 lineas de diff y dependencia nueva.
- `tsc` global rojo: `TS2367` en `page.tsx`, `TS5097` en imports `.ts`, error en readiness WorkMap.
- Restore no implementado para Significado: si se refresca en `intake_significado`, el payload es local/client-side.
- API phase no autorizado: no crear `phase: "significado"` en `/api/intake/triple`.
- Supabase no autorizado: no persistir Significado en backend en R2.2.
- Posibilidad de doble submit: Significado Submit debe respetar `disabled`/estado saving si se implementa.
- Perdida de payload en refresh: MVP R2.2 puede aceptar local draft; backend queda para R2.4.
- Confusion Significado/Sentido: usar `intake_significado`, no `intake_sentido`.
- WorkMap H12: no tocar internals ni reglas de validacion.
- `WorkMapIntake.tsx` sin seguimiento impide comparar contra baseline Git.

No-Go especifico:

- Si R2.2 requiere editar `WorkMapIntake`, servicios WorkMap, APIs, Supabase, runtime o `SceneQuestionnaireRunner`, detener.
- Si aparece wiring parcial no controlado de Significado antes del patch, reevaluar como `READY_WITH_DEVIATIONS` o `NO_GO` segun alcance.

## 11. Matriz de archivos tocados por R2.2-GATE

| Archivo | Accion |
|---|---|
| `docs/audits/GATE_R2_2_SIGNIFICADO_FLOW_WIRING.md` | Creado por esta auditoria. |

## 12. Guards confirmados

- [x] No se modifico producto.
- [x] No se toco `src/app/page.tsx`.
- [x] No se toco `src/lib/types.ts`.
- [x] No se toco WorkMap.
- [x] No se toco `work-map-flatten.ts`.
- [x] No se tocaron APIs.
- [x] No se toco Supabase.
- [x] No se toco Runtime engine.
- [x] No se toco `questionnaire_main`.
- [x] No se conecto `flowState`.
- [x] No se creo persistencia backend.
- [x] No se activo diagnostico.
- [x] No se activo export.
- [x] No se activo transduccion.
- [x] Solo se creo/actualizo el reporte GATE R2.2.

## 13. Dictamen final

REQUIRES_TREE_CLEANUP.

R2.2 es viable como patch minimo y client-side/in-memory.
El punto de acople esta claro: dividir `saveWorkMapIntake` antes del pipeline `flatten/continue/rank/bootstrap`.
Sin embargo, `page.tsx` esta demasiado contaminado para recibir el patch con buena trazabilidad.
`types.ts` necesita un cambio minimo, pero ya esta modificado.
WorkMap y servicios asociados no deben tocarse y varios archivos estan sin seguimiento.
El slice R2.1.1 existe y sus tests pasan, asi que no hay bloqueo funcional del slice.
La recomendacion es aislar/commitear baseline R1/R2.1.1 y despues aplicar R2.2 con tests de wiring.
