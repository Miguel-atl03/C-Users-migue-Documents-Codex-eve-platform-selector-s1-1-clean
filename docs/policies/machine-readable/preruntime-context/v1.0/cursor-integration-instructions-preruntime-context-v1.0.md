# Cursor/Codex Integration — PreRuntimeContextBundle EVE v1.0

## Objetivo

Incrustar el chip `PRE_RUNTIME_CONTEXT_BUNDLE_EVE_V1_0` para que la información de Estado A y WorkMap no se pierda y viaje como contexto gobernado hacia:

Estado A → WorkMap → PreRuntimeContextBundle → PrimaryActivitySelectionPolicy v1.3 → Significado → Bloque 0 → Runtime 40/20 → EvidenceBundle / Producción Paralela.

## Regla quirúrgica

No modificar Runtime 40/20.
No modificar Catálogo Madre.
No modificar bloques 0–7.
No modificar Capa 2.
No modificar Producción Paralela.
No modificar VSM/AHE.
No convertir Estado A en diagnóstico.
No usar rol funcional o nivel de decisión como selección directa de actividades.
No crear swimlanes en PF.

## Archivos a colocar

- `src/domain/pre-runtime-context-bundle.v1.0.ts`
- `src/rules/pre-runtime-context-bundle.v1.0.json`
- `docs/policies/machine-readable/v1.0/pre-runtime-context-bundle.v1.0.schema.json`
- `tests/fixtures/pre-runtime-context-director-costos.fixture.v1.0.json`
- `docs/policies/machine-readable/v1.0/cursor-integration-instructions-preruntime-context-v1.0.md`

## Implementación esperada

Crear o actualizar un builder, preferentemente:

`src/services/pre-runtime-context-bundle-builder.ts`

Debe exponer una función:

`buildPreRuntimeContextBundle(estadoA, workMap, primaryActivitySelectionResult): PreRuntimeContextBundle`

## Campos mínimos del bundle

- `policyVersion = PRE_RUNTIME_CONTEXT_BUNDLE_EVE_V1_0`
- `estadoAContext.functional_role_context`
- `estadoAContext.decision_level_context`
- `estadoAContext.decision_scope_context`
- `estadoAContext.declared_function_scope_context`
- `workMapContext.areas`
- `workMapContext.responsibilities`
- `workMapContext.activities`
- `workMapContext.first_workmap_question`
- `selectionContext.selectedPrimaryActivities`
- `selectionContext.nonPrimaryContextActivities`
- `runtimeContext.contextMustNotBeSavedAsConfirmedEvidence = true`

## Reglas epistemológicas

- `Lugar desde donde participas` en UI = `functional_role_context` internamente.
- Estado A y WorkMap son contexto, no evidencia MMABP confirmada.
- WorkMap puede prellenar B0, pero no cerrar B0 sin confirmación.
- `decision_level_context` puede orientar B5, escalamiento y control; no sustituye evidencia Runtime.
- `functional_role_context` puede orientar perspectiva, frontera de observación y wording; no diagnostica.

## Integración mínima

1. Después de WorkMap guardado y antes de Significado, construir el PreRuntimeContextBundle.
2. Adjuntar el bundle al payload que ya transporta `primaryActivitySelectionResult`.
3. Hacer que Significado pueda recibirlo como contexto.
4. Hacer que la traza dev muestre si el bundle existe y qué campos vienen poblados.
5. No cambiar la selección v1.3 salvo para recibir contexto auxiliar si ya hay hook.

## QA esperado

- Estado A capturado aparece en el bundle.
- `functional_role_context` existe o se marca `gap`.
- `decision_level_context` existe o se marca `gap`.
- `selectedPrimaryActivities` y `nonPrimaryContextActivities` viajan.
- Significado recibe el bundle y no selecciona.
- B0 prefill conserva `inferido-workmap` o `context_only`, no evidencia confirmada.
- El bundle se conserva para EvidenceBundle / Producción Paralela como contexto.

## Closeout sugerido

Crear:

`docs/audits/CLOSEOUT_PRERUNTIME_CONTEXT_BUNDLE_V1_0.md`

Debe incluir:
- Archivos creados/modificados.
- Dónde se construye el bundle.
- Dónde se adjunta al handoff.
- Qué campos de Estado A viajan.
- Qué campos de WorkMap viajan.
- Qué actividades no primarias viajan.
- Confirmación de que no se diagnostica.
- Confirmación de que Runtime 40/20 no fue modificado.
