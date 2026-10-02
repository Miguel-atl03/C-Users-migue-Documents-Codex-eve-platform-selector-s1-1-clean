# CLOSEOUT_RUNTIME_BLOCK0_RESPONSE_MODEL_R1

## Dictamen

RUNTIME_BLOCK0_RESPONSE_MODEL_READY_WITH_GAPS

El modelo formal de respuestas de Runtime Block 0 queda implementado en memoria y conectado al submit de Significado sin persistencia, sin API, sin Supabase y sin tocar WorkMap ni Runtime Engine.

El gap vivo no corresponde a esta implementacion: la regresion `significado-mba-alignment` sigue fallando por `BASELINE_CONTAMINATION_PREEXISTING` en `src/app/admin/runtime-vsm/page.tsx`.

## Archivos creados

- `src/domain/runtime-block0-response.ts`
- `src/services/runtime-block0-response-model.ts`
- `tests/regression/runtime-block0-response-model.test.ts`
- `docs/audits/CLOSEOUT_RUNTIME_BLOCK0_RESPONSE_MODEL_R1.md`

## Archivos modificados

- `src/domain/significado-de-trabajo.ts`
- `src/components/significado/SignificadoDeTuTrabajo.tsx`
- `tests/regression/significado-de-trabajo-slice.test.ts`

## Que implementa

- Contrato `RuntimeBlock0ResponseBundle` version `RUNTIME_BLOCK0_RESPONSE_R1`.
- Respuestas separables para B0-Q01, B0-Q03 y B0-Q04.
- B0-Q04 conserva `input_transduction` y `output_transduction` como subcampos distintos aunque la pregunta canonical sea de tipo textarea.
- Builder `buildRuntimeBlock0ResponseBundle(input)` en `src/services/runtime-block0-response-model.ts`.
- Estados epistémicos formales:
  - `captured_user_evidence`
  - `inferred_from_workmap`
  - `context_from_workmap`
  - `user_confirmed_suggestion`
  - `user_corrected_evidence`
  - `canonical_derivation`
  - `internal_calculated`
- Provenance formal por subcampo:
  - `workmap_prefill`
  - `user_confirmed`
  - `user_corrected`
  - `user_answer`
  - `system_internal`
- Readiness minimo `evidenceReadyForRuntime` solo cuando B0-Q01, B0-Q02, B0-Q03 y B0-Q04 tienen los minimos actuales de pantalla.
- Integracion minima en Significado: al continuar se adjunta `runtimeBlock0ResponseBundle` al payload en memoria.

## Que no implementa

- No implementa Runtime completo.
- No implementa ReadinessEngine.
- No modifica APIs.
- No modifica Supabase.
- No modifica WorkMap.
- No modifica Runtime Engine.
- No persiste el bundle.
- No expone estados epistémicos ni metadata runtime en la interfaz.
- No modifica `package.json`, `package-lock.json`, SQL, middleware ni rutas de servidor.

## Epistemic status

- Prefill sin cambios al submit: `user_confirmed_suggestion`.
- Prefill modificado: `user_corrected_evidence`.
- Campo vacio con valor nuevo: `captured_user_evidence`.
- Prefill no confirmado: conserva estado derivado (`inferred_from_workmap`, `context_from_workmap` o `canonical_derivation`) y no se convierte en evidencia capturada.
- Valores internos vacios sin prefill: `internal_calculated`.

## Tests

- `node --test tests/regression/runtime-block0-catalog-adapter.test.ts` -> PASS, 9/9.
- `node --test tests/regression/runtime-block0-response-model.test.ts` -> PASS, 12/12.
- `node --test tests/regression/significado-de-trabajo-slice.test.ts` -> PASS, 17/17.
- `node --test tests/regression/significado-flow-wiring.test.ts` -> PASS, 7/7.
- `node --test tests/regression/primary-activity-selection-policy.test.ts` -> PASS, 10/10.
- `node --test tests/regression/significado-mba-alignment.test.ts` -> FAIL esperado, 3/4; unico fallo: `Unexpected tracked diff: src/app/admin/runtime-vsm/page.tsx`.

## Verificacion /dev/significado

`http://localhost:3000/dev/significado` respondio `200`.

Comprobaciones HTML:

- Titulo Significado presente.
- B0-Q01 presente.
- `runtimeBlock0ResponseBundle` no aparece en UI.
- `captured_user_evidence` no aparece en UI.
- `user_confirmed_suggestion` no aparece en UI.
- `epistemicStatus` no aparece en UI.
- `fallback_no_canonico` no aparece en UI.
- `CANONICAL_HELP_MISSING` no aparece en UI.
- `payload` no aparece en UI.
- `runtime` no aparece en UI.

La conexion al navegador integrado quedo bloqueada por el entorno Windows; se verifico por HTTP local.

## Git status / diff

El workspace permanece con baseline sucio preexistente. Hay cambios tracked ajenos a esta tarea en:

- `src/app/admin/runtime-vsm/page.tsx`
- `src/app/page.tsx`
- `src/domain/export.ts`
- `src/lib/types.ts`
- `src/services/export/activity-collection-xlsx.ts`
- `src/services/export/activity-export-template-map.ts`
- `src/services/export/session-export-consolidator.ts`
- `src/services/export/xlsx-template.ts`

Los archivos de esta tarea aparecen dentro de la zona untracked/preexistente del slice Significado/Runtime Block 0 y no limpian ni revierten baseline.

## Gaps vivos

- `BASELINE_CONTAMINATION_PREEXISTING`: `significado-mba-alignment` falla por diff previo en `src/app/admin/runtime-vsm/page.tsx`.
- Browser integrado no pudo iniciar por restriccion del entorno; verificacion equivalente realizada via HTTP.
- El bundle sigue siendo in-memory; persistencia y consumo Runtime completo quedan fuera de alcance por instruccion.

## Recomendacion

B

El modelo de respuesta R1 esta listo para continuar con integracion posterior controlada, manteniendo congelados API, Supabase, WorkMap y Runtime Engine. Antes de usar `significado-mba-alignment` como gate limpio, conviene aislar o resolver la contaminacion preexistente de `src/app/admin/runtime-vsm/page.tsx`.
