# EVE-03 Canonical Catalog Shadow Mode Design V1

## 1. Propósito

Diseñar `canonical_catalog_shadow` como modo de consulta y validación en sombra para el chip `EVE-03-CANONICAL-CATALOG`.

El modo permite resolver y validar registros del catálogo canónico sin cablear el chip, sin autoridad runtime y sin efectos laterales.

## 2. Principios de seguridad

- disabled-by-default;
- invocable solo por test futuro o dev harness futuro;
- sin bloqueo de usuario;
- sin mutación de payload;
- sin registry write;
- sin Runtime productivo;
- sin WorkMap mutation;
- sin Significado mutation;
- sin UI productiva;
- sin creación de nodos, variables, rutas o políticas;
- con trace completo.

## 3. Consultas soportadas

`canonical_catalog_shadow` podrá consultar o validar:

- source_node_registry;
- source_code_registry;
- canonical_variables;
- node_variable_map;
- critical_routes;
- epistemic_policy;
- vsm_prep_guard;
- source_documents;
- source_target_map.

## 4. Input conceptual

`CanonicalCatalogEvaluationInput`:

- mode: `canonical_catalog_shadow`;
- queryType:
  - `resolve_node`
  - `resolve_source_code`
  - `resolve_canonical_variable`
  - `validate_node_variable_map`
  - `validate_critical_route`
  - `validate_epistemic_policy`
  - `validate_source_document`
  - `validate_source_target_map`
  - `validate_vsm_guard`
  - `detect_catalog_gap`
- nodeId?;
- sourceCode?;
- variableId?;
- routeId?;
- policyId?;
- sourceDocumentId?;
- sourceTargetId?;
- evidenceRefs?;
- sourceTrace?;
- requestedOutputType?;
- context?.

## 5. Output conceptual

`CanonicalCatalogEvaluationResult`:

- version;
- mode;
- chipId;
- queryType;
- readinessState;
- resolved;
- resolvedEntity;
- missingReferences;
- gapFlags;
- sourceTrace;
- evidenceRefs;
- allowedActions;
- blockedActions;
- requiredInputs;
- findings;
- auditEvents;
- safetyFlags.

Safety flags siempre false:

- canBlockUserFlow;
- canModifyPayload;
- canWriteRegistry;
- canModifyCatalog;
- canTriggerRuntime;
- canTriggerDiagnosis;
- canTriggerExport;
- runtimeAuthority.

## 6. Readiness states

Estados internos de sombra:

- catalog_lookup_ready
- catalog_lookup_not_found
- catalog_reference_valid
- catalog_reference_missing
- catalog_gap_detected
- epistemic_policy_allows
- epistemic_policy_blocks
- critical_route_found
- critical_route_missing
- manual_review_required
- reentry_required

Estos estados son señales internas. No son gates productivos ni readiness final de Runtime.

## 7. Relación con fuentes

- D8: fuente primaria para nodos, códigos, variables, rutas, políticas y mappings.
- D6: compatibilidad runtime XLSX y verificación contra catálogo operativo.
- D5: frontera/gobernanza runtime, rutas críticas, QA y reglas operativas.
- D7: frontera arquitectura runtime/MMABP, inventario, membrana y estructura.
- VSM1: guardia metodológica VSM únicamente; no genera campos operativos por sí solo.

## 8. Relación con EVE-00/01/02

- EVE-03 no evalúa conformance MMABP.
- EVE-03 no produce diagnóstico.
- EVE-03 no reemplaza EVE-02.
- EVE-03 provee catálogo canónico para etapas posteriores.
- EVE-03 no decide Runtime readiness final.
- EVE-03 no exporta registry.

## 9. Gap vivo aceptado

El diseño conserva el gap vivo:

- CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED
- status: still_open_non_blocking
- count: 33

El shadow mode debe poder detectarlo y reportarlo, pero no resolverlo automáticamente.

## 10. UI trace futura

Un dev harness futuro debe mostrar:

- selectedFixture;
- queryType;
- input identifiers;
- resolvedEntity;
- readinessState;
- missingReferences;
- gapFlags;
- sourceTrace;
- evidenceRefs;
- allowedActions;
- blockedActions;
- requiredInputs;
- findings;
- auditEvents;
- safetyFlags;
- MATCH expected/actual.

También debe mostrar:

- total nodes: 164;
- total source codes: 164;
- total canonical variables: 257;
- total node-variable mappings: 213;
- total critical routes: 4;
- gap CANONICAL_VARIABLES_REFERENCED_NOT_DEFINED count 33.

## 11. Recomendación

Implementar `canonical_catalog_shadow` como dominio/servicio puro en una etapa posterior, manteniéndolo aislado, disabled-by-default y sin autoridad runtime.
