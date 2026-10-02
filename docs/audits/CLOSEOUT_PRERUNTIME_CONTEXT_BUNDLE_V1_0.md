# CLOSEOUT_PRERUNTIME_CONTEXT_BUNDLE_V1_0

## Objetivo

Conectar `PreRuntimeContextBundle EVE v1.0` como contexto gobernado previo a Runtime para que Estado A, WorkMap y el resultado de seleccion primaria v1.3 viajen hacia Significado sin convertirse en evidencia MMABP confirmada.

## Estado A localizado

Estado A vive en estos puntos:

- `src/domain/start-position-context.ts`: contrato `StartPositionContext`, opciones `PARTICIPATION_PLACE_OPTIONS`, `DECISION_PROXIMITY_OPTIONS`, normalizacion y validacion.
- `src/components/client/EmptyAssessmentState.tsx`: captura UI inicial de `Lugar de participacion` y `Cercania a decisiones`.
- `src/components/client/StartPositionEditModal.tsx`: edicion posterior de Estado A.
- `src/app/page.tsx`: estado `startPositionContext`, persistencia dentro de `WorkMapData.startPositionContext` y paso hacia WorkMap/Significado.
- `src/features/dev/e2e-block0-demo-state.ts`: traza demo que parte desde Estado A antes de WorkMap.

## Archivos creados

- `src/services/pre-runtime-context-bundle-builder.ts`
- `tests/regression/pre-runtime-context-bundle.test.ts`
- `docs/audits/CLOSEOUT_PRERUNTIME_CONTEXT_BUNDLE_V1_0.md`

## Archivos modificados

- `src/domain/pre-runtime-context-bundle.v1.0.ts`
- `src/domain/significado-de-trabajo.ts`
- `src/services/significado-activity-anchor-adapter.ts`
- `src/features/significado/significado-draft-state.ts`
- `src/components/significado/SignificadoDeTuTrabajo.tsx`
- `src/app/page.tsx`
- `src/features/dev/e2e-block0-demo-state.ts`
- `src/app/dev/e2e-block0/page.tsx`
- `tests/regression/e2e-block0-demo-contract.test.ts`

## Construccion del bundle

El builder `buildPreRuntimeContextBundle` consume:

- `startPositionContext`
- snapshot completo de `WorkMapData`
- `primaryActivitySelectionResult`

Y produce:

- `preRuntimeContextBundleId`
- `policyVersion = PRE_RUNTIME_CONTEXT_BUNDLE_EVE_V1_0`
- `sourceState`
- `estadoAContext`
- `workMapContext`
- `selectionContext`
- `runtimeContext`

## Campos que viajan

- `functional_role_context`: desde `participationPlace` / `participationPlaceOther`.
- `decision_level_context`: desde `decisionProximity`.
- `workmap_area_context`: desde `selectedAreas` y `customAreas`.
- `responsibility_context`: responsabilidades redactadas en WorkMap.
- `workmap_activity_context`: actividades redactadas en WorkMap.
- `primary_activity_context`: `selectedPrimaryActivities` de seleccion primaria v1.3.
- `non_primary_activity_context`: `nonPrimaryContextActivities` de seleccion primaria v1.3.

Cada contexto viaja con `epistemicStatus`, `source`, `allowedUses` y `mustNotBeUsedFor`.

## Contexto, no evidencia

El bundle mantiene estas restricciones:

- Estado A no se guarda como evidencia MMABP confirmada.
- WorkMap no sustituye respuestas Runtime.
- Responsabilidades no se convierten en PM confirmado.
- Areas/ubicaciones no se convierten en swimlanes PF confirmados.
- Nivel de decision no se convierte en autoridad real sin confirmacion Runtime.
- Actividades no primarias se preservan como contexto y no entran a Runtime 40/20 inmediato.
- Bloque 0 puede usar contexto para orientacion/prefill/traza, pero no como evidencia confirmada.

## Conexion al flujo

- `src/app/page.tsx` construye el bundle despues de `selectPrimaryActivitiesFromWorkMap`.
- El bundle se guarda en estado paralelo como `preRuntimeContextBundle`.
- `SignificadoDeTuTrabajo` lo recibe como prop sin cambiar su rol: sigue siendo consumidor.
- `buildDraftSubmitPayload` y `buildSignificadoSubmitPayload` lo transportan dentro del payload de Significado.
- La traza dev de `src/app/dev/e2e-block0/page.tsx` permite inspeccionar version, contextos, estados epistemologicos, usos permitidos y usos prohibidos.

## Gaps detectados en Estado A

El Estado A actual solo captura:

- lugar/perspectiva de participacion;
- cercania a decisiones.

No existe captura explicita separada para:

- `role_scope_context`;
- `decision_scope_context`;
- funciones declaradas del rol.

Por eso esos campos quedan fuera del builder operativo hasta que la UI/producto capture datos fuente reales. Cuando `participationPlace` o `decisionProximity` faltan, el bundle marca el campo correspondiente como `gap`.

## Tests ejecutados

- `node --test tests/regression/pre-runtime-context-bundle.test.ts` -> PASS 2/2
- `node --test tests/regression/primary-activity-selection-policy.test.ts` -> PASS 12/12
- `node --test tests/regression/significado-activity-anchor-adapter.test.ts` -> PASS 12/12
- `node --test tests/regression/e2e-block0-demo-contract.test.ts` -> PASS 30/30
- `node --test tests/regression/workmap-to-block0-prefill.test.ts` -> PASS 15/15
- `node --test tests/regression/significado-de-trabajo-slice.test.ts` -> PASS 20/20
- `node --test tests/regression/significado-flow-wiring.test.ts` -> PASS 7/7

## Confirmaciones de alcance

- Runtime 40/20 no fue modificado.
- Catologo Madre no fue modificado.
- Bloques 0-7 no fueron modificados.
- Capa 2, Produccion Paralela, VSM/AHE, monetizacion y narrativa final no fueron modificados.
- Selector primario v1.3 no fue alterado.
- Significado sigue siendo consumidor; no selecciona actividades.
- No se modificaron `package.json`, `package-lock.json` ni `middleware.ts`.
