# EVE - Shadow E2E Harness Design V1

## Dictamen

SHADOW_E2E_HARNESS_DESIGN_READY_FOR_OFFLINE_IMPLEMENTATION

## Base verificada

- HEAD observado: `5b49fab855f1a6f71caa303d1c0636b61ccec83a`
- HEAD contiene commit `5b49fab`: true
- Dirty tree count observado antes del diseño: 858
- Staged count observado: 0
- Composition Root Shadow existe: true
- Inventarios Gate 2 existen: true
- Preflight Gate 2 previo: `SHADOW_E2E_PREFLIGHT_READY_WITH_GAPS`
- Gap crítico a resolver por diseño: `G2-GAP-001 / SHADOW_E2E_ENTRYPOINT_UNKNOWN / critical`

## Decisión de entrypoint

El entrypoint recomendado para `EVE_ORGANISM_SHADOW_E2E_HARNESS_V1` es un **fixture/replay adapter**.

Modo recomendado: `fixture`.

Razón: permite alimentar el Composition Root Shadow con señales con forma real observada o replayada, pero sin tocar DB, Supabase, UI, WorkMap, Significado, runtime, registry, export ni diagnóstico. El flujo oficial conserva toda autoridad; el shadow solo produce comando, trace, audit, candidates y comparación en memoria o fixture de test.

Opciones evaluadas:

- `E2E-ENTRY-001`: replay desde fixture sintético basado en señales reales inventariadas - aceptado.
- `E2E-ENTRY-002`: replay desde audit/trace existente - rechazado como entrypoint único; sirve como evidencia de diseño.
- `E2E-ENTRY-003`: adapter read-only desde service existente - rechazado hasta probar límites DB/Supabase.
- `E2E-ENTRY-004`: adapter desde evento WorkMap - rechazado por alcance y riesgo de product wiring.
- `E2E-ENTRY-005`: adapter desde Significado - rechazado por alcance y riesgo de tocar flujo existente.
- `E2E-ENTRY-006`: adapter desde runtime response - rechazado hasta probar observación libre de Supabase y mutación.
- `E2E-ENTRY-007`: adapter desde admin trace - rechazado como primer entrypoint porque implica `src/app`.
- `E2E-ENTRY-008`: adapter desde test fixture controlado - aceptado como forma de ejecución de pruebas.

Rechazadas: 6.

## Contrato futuro del adapter

Tipo futuro: `EveOrganismShadowE2EObservedSignal`.

Campos mínimos:

- `observedSignalId`
- `observedAt`
- `sourceSystem`
- `sourcePath`
- `tenantId`
- `organizationId`
- `sessionId`
- `activityId`
- `actorId`
- `signalKind`
- `clientIntent`
- `rawObservedPayload`
- `evidenceInputs[]`
- `candidateInputs[]`
- `provenance`
- `idempotencyKey`
- `correlationId`
- `officialFlowRef`
- `observationMode`: `fixture | replay | read_only_observation`
- `sideEffectPolicy`: `no_db_write | no_registry_write | no_export | no_ui_touch | no_diagnosis`

## Mapper hacia Composition Root Shadow

Función futura: `mapObservedSignalToShadowCommand(signal): EveOrganismShadowCommand`.

Reglas de diseño:

- `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `clientIntent`, `evidenceInputs`, `candidateInputs`, `idempotencyKey` y `correlationId` se copian desde la señal observada.
- `dryRun` siempre debe ser `true`.
- `gateEnforcement` debe degradarse a `gateAdvisory`.
- Si falta `tenantId`, `sessionId` o `activityId`, se espera `OCR-BLK-001`.
- Si falta provenance, se espera `OCR-BLK-013`.
- Si falta `sourceTrace` en candidate, se espera `OCR-BLK-014`.
- `registryWrite`, `finalExport` y `diagnosis` nunca se mapean como permitidos.

## Comparación oficial vs shadow

Tipo futuro: `EveOrganismShadowE2EComparison`.

Debe contener:

- `comparisonId`
- `officialFlowRef`
- `shadowTraceRef`
- `sameOutcome`
- `divergenceType`
- `divergenceSeverity`
- `blockers`
- `explanation`
- `reproducible`
- `requiresHumanReview`

Divergence types permitidos:

- `none`
- `missing_context`
- `provenance_gap`
- `semantic_gate_difference`
- `candidate_difference`
- `no_go_triggered`
- `false_blocker_candidate`
- `latency_or_replay_issue`
- `tenant_boundary_risk`
- `unknown`

## Escenarios planificados

- Total: 30
- Categorías:
  - A. Replay seguro
  - B. Comparación oficial vs shadow
  - C. No-cableado
  - D. Contexto y seguridad
  - E. Algedonic / No-Go
- No-cableado cubierto: true
- Algedonic cubierto: true
- Cross-tenant cubierto: true

## No-cableado Gate 2

- registry_write_allowed: false
- final_export_allowed: false
- diagnosis_allowed: false
- db_write_allowed: false
- ui_touch_allowed: false
- production_authority_allowed: false
- runtime_mutation_allowed: false
- supabase_required: false

## Allowlist futura

La implementación posterior puede crear/modificar solo:

- `src/types/eve-organism-shadow-e2e.ts`
- `src/services/eve-organism-shadow-e2e-adapter.ts`
- `tests/regression/eve-organism-shadow-e2e-adapter.test.ts`
- `docs/audits/AUDIT_EVE_ORGANISM_SHADOW_E2E_HARNESS_V1.md`
- `docs/audits/_eve_organism_shadow_e2e_harness_v1.json`

Opcional si se justifica:

- `tests/fixtures/eve-organism-shadow-e2e/*.json`

Prohibidos:

- `app/**`
- `src/app/**`
- `components/**`
- `pages/**`
- `docs/chips/**`
- `docs/runtime/**`
- `docs/organism/**`
- `package.json`
- lockfiles
- `supabase/**`
- `migrations/**`
- registry/export productivo
- DB/SQL files
- WorkMap files
- Significado files
- runtime productivo

## Gaps restantes de diseño

- Total: 12
- Critical: 0
- High: 7
- Medium: 4
- Info: 1

Lista:

- `DESIGN-GAP-001 / ENTRYPOINT_REQUIRES_FIXTURE_FIRST / high`
- `DESIGN-GAP-002 / REAL_FLOW_OBSERVATION_NOT_SAFE_YET / high`
- `DESIGN-GAP-003 / TENANT_CONTEXT_MAPPING_NEEDS_CONFIRMATION / high`
- `DESIGN-GAP-004 / SESSION_ACTIVITY_MAPPING_NEEDS_CONFIRMATION / high`
- `DESIGN-GAP-005 / PROVENANCE_COVERAGE_NEEDS_HARNESS / high`
- `DESIGN-GAP-006 / IDEMPOTENCY_CORRELATION_NEEDS_HARNESS / high`
- `DESIGN-GAP-007 / OFFICIAL_FLOW_COMPARISON_NOT_IMPLEMENTED / high`
- `DESIGN-GAP-008 / ALGEDONIC_SCENARIOS_NEED_FIXTURES / medium`
- `DESIGN-GAP-009 / CROSS_TENANT_SCENARIO_NEEDS_FIXTURE / medium`
- `DESIGN-GAP-010 / SUPABASE_FREE_HARNESS_REQUIRED / medium`
- `DESIGN-GAP-011 / DIRTY_TREE_CONTEXT / medium`
- `DESIGN-GAP-012 / READY_FOR_OFFLINE_HARNESS_IMPLEMENTATION / info`

## Archivos de soporte

- `docs/audits/_eve_organism_shadow_e2e_harness_design_v1.json`
- `docs/audits/_eve_organism_shadow_e2e_entrypoint_decision_v1.json`
- `docs/audits/_eve_organism_shadow_e2e_scenario_plan_v1.json`
- `docs/audits/_eve_organism_shadow_e2e_future_allowlist_v1.json`

## No modification attestation

- src_modified: false
- tests_modified: false
- chips_modified: false
- runtime_modified: false
- package_json_modified: false
- db_modified: false
- runtime_connected: false
- shadow_activated: false
- registry_written: false
- commit_created: false

## Siguiente paso

SHADOW_E2E_OFFLINE_HARNESS_IMPLEMENTATION_V1
