# EVE Organism Shadow E2E Replay Fixtures V1

## Alcance

Materializa 16 fixtures replay offline aprobados por el preflight de seleccion. Los fixtures alimentan el adapter `src/services/eve-organism-shadow-e2e-adapter.ts` sin conectar observacion real ni autoridad productiva.

## Dictamen

REPLAY_FIXTURES_STRENGTHENING_PASSED_WITH_SYNTHETIC_FIELDS

## Fuente de Seleccion

- `docs/audits/AUDIT_EVE_ORGANISM_REPLAY_FIXTURES_SELECTION_PREFLIGHT_V1.md`
- `docs/audits/_eve_organism_replay_fixtures_selection_preflight_v1.json`
- `docs/audits/_eve_organism_replay_fixture_candidate_matrix_v1.json`

## Fixtures Creados

| Fixture | Signal kind | Expected status | Expected blockers | Expected divergence |
| --- | --- | --- | --- | --- |
| `replay_fixture_001_workmap_activity` | `workmap_activity` | `SHADOW_ACCEPTED` | `none` | `none` |
| `replay_fixture_002_significado_intent` | `significado_intent` | `SHADOW_ACCEPTED` | `none` | `none` |
| `replay_fixture_003_runtime_like_response` | `runtime_like_response` | `SHADOW_ACCEPTED` | `none` | `none` |
| `replay_fixture_004_evidence_provenance` | `evidence_capture` | `SHADOW_ACCEPTED` | `none` | `none` |
| `replay_fixture_005_candidate_source_trace` | `candidate_generation` | `SHADOW_ACCEPTED` | `none` | `none` |
| `replay_fixture_006_official_flow_ref` | `official_flow_result` | `SHADOW_ACCEPTED` | `none` | `none` |
| `replay_fixture_007_missing_context` | `workmap_activity` | `SHADOW_QUARANTINED` | `OCR-BLK-001` | `missing_context` |
| `replay_fixture_008_missing_provenance` | `evidence_capture` | `SHADOW_DEGRADED` | `OCR-BLK-013` | `provenance_gap` |
| `replay_fixture_009_missing_idempotency_correlation` | `workmap_activity` | `SHADOW_QUARANTINED` | `OCR-BLK-012` | `unknown` |
| `replay_fixture_010_missing_source_trace` | `candidate_generation` | `SHADOW_DEGRADED` | `OCR-BLK-014` | `candidate_difference` |
| `replay_fixture_011_registry_export_attempt` | `registry_export_attempt` | `SHADOW_QUARANTINED` | `OCR-BLK-003, OCR-BLK-004` | `no_go_triggered` |
| `replay_fixture_012_tenant_leak_attempt` | `tenant_leak_signal` | `SHADOW_QUARANTINED` | `OCR-BLK-007` | `tenant_boundary_risk` |
| `replay_fixture_013_gate_bypass_signal` | `gate_bypass_signal` | `SHADOW_QUARANTINED` | `OCR-BLK-007, OCR-BLK-010` | `no_go_triggered` |
| `replay_fixture_014_evidence_corruption_signal` | `evidence_corruption_signal` | `SHADOW_DEGRADED` | `OCR-BLK-013` | `provenance_gap` |
| `replay_fixture_015_no_go_critical_signal` | `runtime_like_response` | `SHADOW_QUARANTINED` | `OCR-BLK-007` | `no_go_triggered` |
| `replay_fixture_016_non_critical_divergence_signal` | `candidate_generation` | `SHADOW_DEGRADED` | `OCR-BLK-014` | `candidate_difference` |

## Campos Sinteticos y Missing Fields

| Fixture | Synthetic fields | Missing in source |
| --- | --- | --- |
| `replay_fixture_001_workmap_activity` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `tenantId`, `organizationId`, `sessionId`, `actorId_or_userId`, `sourceTrace`, `idempotencyKey`, `correlationId`, `officialFlowRef` |
| `replay_fixture_002_significado_intent` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `tenantId`, `organizationId`, `actorId_or_userId`, `sourceTrace`, `idempotencyKey`, `correlationId`, `officialFlowRef` |
| `replay_fixture_003_runtime_like_response` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `tenantId`, `organizationId`, `sessionId`, `actorId_or_userId`, `sourceTrace`, `idempotencyKey`, `correlationId`, `officialFlowRef` |
| `replay_fixture_004_evidence_provenance` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `tenantId`, `organizationId`, `actorId_or_userId`, `sourceTrace`, `idempotencyKey`, `correlationId`, `officialFlowRef` |
| `replay_fixture_005_candidate_source_trace` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `none` |
| `replay_fixture_006_official_flow_ref` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `none` |
| `replay_fixture_007_missing_context` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `tenantId`, `sessionId`, `activityId` |
| `replay_fixture_008_missing_provenance` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `provenance` |
| `replay_fixture_009_missing_idempotency_correlation` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `idempotencyKey`, `correlationId`, `sourceTrace` |
| `replay_fixture_010_missing_source_trace` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `sourceTrace` |
| `replay_fixture_011_registry_export_attempt` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `sourceTrace` |
| `replay_fixture_012_tenant_leak_attempt` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `sourceTrace` |
| `replay_fixture_013_gate_bypass_signal` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `sourceTrace` |
| `replay_fixture_014_evidence_corruption_signal` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `sourceTrace` |
| `replay_fixture_015_no_go_critical_signal` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `sourceTrace` |
| `replay_fixture_016_non_critical_divergence_signal` | `observedSignalId`, `observedAt`, `sourceSystem`, `tenantId`, `organizationId`, `sessionId`, `activityId`, `actorId`, `rawObservedPayload.fixtureMarker`, `idempotencyKey`, `correlationId`, `officialFlowRef.flowId`, `officialFlowRef.outcomeRef` | `sourceTrace` |

## Escenarios Cubiertos

- WorkMap activity
- Significado intent
- runtime-like response
- evidence provenance
- candidate sourceTrace
- officialFlowRef
- missing context
- missing provenance
- missing idempotency/correlation
- missing sourceTrace
- registry/export attempt
- tenant leak
- gate bypass
- evidence corruption
- no-go critical
- non-critical divergence

## Tests Ejecutados

- Command: `node --test tests/regression/eve-organism-shadow-e2e-replay-fixtures.test.ts`
- Result: pass
- Summary: 9 tests passed, 0 failed. `MODULE_TYPELESS_PACKAGE_JSON` warning observed as non-blocking.

## No-Cableado

- DB write allowed: false
- Registry write allowed: false
- Export allowed: false
- Diagnosis allowed: false
- UI touch allowed: false
- Runtime mutation allowed: false
- Supabase required: false
- WorkMap connected: false
- Significado connected: false
- Productive runtime connected: false

## Que No Se Hizo

- No real observation connected.
- No WorkMap connected.
- No Significado connected.
- No productive runtime connected.
- No DB, Supabase, registry, export, diagnosis or UI touched.
- No package.json or lockfile changes.
- No commit created.

## Gaps Restantes

- Fixtures are synthetic and offline-only by design.
- Later commit verification should confirm only the allowlisted replay fixture artifacts are committed.
- The existing module type warning remains non-blocking and was not addressed here.

## Siguiente Paso

REPO_COMMIT_REPLAY_FIXTURES_STRENGTHENING_V1
