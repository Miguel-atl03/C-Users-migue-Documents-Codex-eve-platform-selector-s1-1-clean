# EVE-04 Runtime Catalog - Shadow Mode Design V1

## 1. Proposito

Este documento disena el modo `runtime_catalog_shadow` para EVE-04-RUNTIME-CATALOG. Es un diseno, no una implementacion.

El modo permitira consultar y evaluar en sombra el catalogo Runtime candidato para:

- `runtime_interactions_base_40`
- `runtime_interactions_causal_20`
- `ux_subfield_structure`
- `branching_budget_rules`
- `readiness_gaps_reentry`
- source coverage
- documentary satisfaction
- `CCOV-001`
- `CVAR-001`

El modo no ejecuta Runtime productivo, no decide diagnostico, no exporta IR, no escribe registry, no muta WorkMap, no muta Significado y no conecta al cerebro EVE.

## 2. Estado del modo

`runtime_catalog_shadow` debe ser:

- disabled-by-default
- invocable solo por test futuro o dev harness futuro
- sin efectos laterales
- sin bloqueo de usuario
- sin mutacion de payload
- sin registry write
- sin Runtime productivo
- sin WorkMap mutation
- sin Significado mutation
- sin UI productiva
- sin conexion al cerebro EVE
- con trace completo

## 3. Consultas permitidas

El modo puede:

- resolver `runtime_interaction_id`
- resolver base interaction
- resolver causal interaction
- validar UX subfield structure
- validar branching rule
- validar branching score
- validar readiness/reentry state
- validar source_node/source_code coverage
- validar `CCOV-001`
- validar `CVAR-001`
- detectar interaccion inexistente
- detectar causal fuera de presupuesto
- detectar branching prohibido por curiosidad analitica
- detectar readiness falso
- detectar ausencia de provenance
- detectar intento de diagnostico, export o registry

## 4. Salidas prohibidas

El modo no debe producir:

- Runtime readiness final
- diagnostico
- IR
- export final
- registry write
- mutacion de catalogo
- creacion de interaccion
- modificacion de WorkMap
- modificacion de Significado
- conexion al cerebro EVE

## 5. Input conceptual

Tipo: `RuntimeCatalogEvaluationInput`.

Campos:

- `mode: "runtime_catalog_shadow"`
- `queryType`
- `runtimeInteractionId?`
- `sourceNodeId?`
- `sourceCode?`
- `variableId?`
- `branchRuleId?`
- `readinessState?`
- `evidenceRefs?`
- `sourceTrace?`
- `requestedOutputType?`
- `context?`

`queryType` admite:

- `resolve_runtime_interaction`
- `resolve_base_interaction`
- `resolve_causal_interaction`
- `validate_ux_subfield_structure`
- `validate_branching_rule`
- `validate_branching_score`
- `validate_readiness_reentry`
- `validate_source_coverage`
- `validate_ccov_001`
- `validate_cvar_001`
- `detect_runtime_catalog_gap`
- `validate_no_runtime_authority`

## 6. Output conceptual

Tipo: `RuntimeCatalogEvaluationResult`.

Campos:

- `version`
- `mode`
- `chipId`
- `queryType`
- `readinessState`
- `resolved`
- `resolvedEntity`
- `missingReferences`
- `gapFlags`
- `sourceTrace`
- `evidenceRefs`
- `allowedActions`
- `blockedActions`
- `requiredInputs`
- `findings`
- `auditEvents`
- `safetyFlags`
- `documentarySatisfaction`

Las safety flags siempre deben ser:

- `canBlockUserFlow: false`
- `canModifyPayload: false`
- `canWriteRegistry: false`
- `canModifyCatalog: false`
- `canTriggerRuntime: false`
- `canTriggerDiagnosis: false`
- `canTriggerExport: false`
- `canConnectEveBrain: false`
- `runtimeAuthority: false`

## 7. Estados internos shadow

Estados permitidos:

- `runtime_catalog_lookup_ready`
- `runtime_catalog_lookup_not_found`
- `runtime_catalog_reference_valid`
- `runtime_catalog_reference_missing`
- `runtime_catalog_gap_detected`
- `branching_rule_allows`
- `branching_rule_blocks`
- `causal_budget_available`
- `causal_budget_exhausted`
- `readiness_state_valid`
- `readiness_state_invalid`
- `documentary_satisfaction_confirmed`
- `documentary_satisfaction_broken`
- `manual_review_required`
- `reentry_required`

Estos estados son senales internas de sombra. No son gates productivos ni readiness final del Runtime.

## 8. Fixtures futuros

Los fixtures futuros quedan definidos en:

- `docs/audits/_eve_04_runtime_catalog_shadow_mode_fixtures_v1.json`

Cobertura minima:

- resolver base existente
- detectar interaccion inexistente
- resolver causal existente
- validar UX subfield structure
- validar `B6-Q38/trench_phrase` como `CCOV-001`
- validar 33 definiciones `CVAR-001`
- permitir branching con evidencia estructural
- bloquear branching por curiosidad analitica
- detectar causal budget disponible
- detectar causal budget agotado
- validar readiness/reentry
- confirmar ausencia de runtimeAuthority

## 9. Relacion con fuentes

D6 es la fuente implementable exacta para cinco modulos: base 40, causal 20, UX subfields, branching/budget y readiness/reentry.

D5 gobierna gates, QA, fronteras, no diagnostico, no export y no registry.

D7 sostiene la reduccion 164 a 40+20, branching, no perdida de genealogia y contrato de salida.

D8 + Phase3 sostienen genealogia, source_nodes, source_codes y cobertura 164/164.

UP_B0..UP_B7 sostienen definiciones re-transducidas, especialmente `CVAR-001`.

D4 es frontera tecnica posterior para loader/schema/backend. No redisenia catalogo.

D3 es integracion posterior al organismo EVE. No define filas runtime.

D1 es guardia MMABP: PM, MoC, PF y OLC separados; conformance antes de consistency.

VSM1 es guardia metodologica VSM: no diagnostico VSM, no S1-S5 cerrado y no recursion cerrada desde una respuesta.

## 10. Relacion con EVE-00/01/03

- EVE-04 no reemplaza EVE-00.
- EVE-04 no reemplaza EVE-01.
- EVE-04 depende de EVE-03 como genealogia canonica vigente.
- EVE-04 no decide diagnostico.
- EVE-04 no exporta registry.
- EVE-04 no conecta al cerebro EVE.
- EVE-04 prepara un catalogo runtime candidate not wired.

## 11. Future UI trace

Un dev harness futuro debe mostrar:

- selectedFixture
- queryType
- input identifiers
- resolvedEntity
- readinessState
- missingReferences
- gapFlags
- sourceTrace
- evidenceRefs
- allowedActions
- blockedActions
- requiredInputs
- findings
- auditEvents
- safetyFlags
- documentarySatisfaction
- MATCH expected/actual

Tambien debe mostrar los contadores y estados de seguridad definidos en:

- `docs/audits/_eve_04_runtime_catalog_future_ui_trace_requirements_v1.json`

## 12. Riesgos

La matriz de riesgos queda en:

- `docs/audits/_eve_04_runtime_catalog_shadow_mode_risks_v1.json`

Los riesgos criticos son ejecutar Runtime productivo, conectar al cerebro EVE, escribir registry, activar diagnostico/IR/export y mutar WorkMap o Significado.

## 13. Documentary satisfaction

El modo debe leer la satisfaccion documental como precondicion protegida:

- `globalSatisfactionStatus: satisfactory`
- `mismatches: 0`
- `missingInChip: 0`
- `missingInSource: 0`
- `pendingSourceProof: 0`

Si esta precondicion se rompe, el modo futuro debe devolver `documentary_satisfaction_broken` y no debe promover ninguna salida.

## 14. Fronteras de implementacion futura

Una implementacion futura debe ser dominio/servicio puro, sin `src` productivo hasta autorizacion explicita, sin APIs, sin UI productiva, sin Supabase, sin SQL, sin middleware, sin package changes y sin mutacion del paquete base.

FIN - EVE-04-RUNTIME-CATALOG-SHADOW-MODE-DESIGN-V1
