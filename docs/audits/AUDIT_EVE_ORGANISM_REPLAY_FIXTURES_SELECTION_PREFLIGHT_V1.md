# EVE Organism Replay Fixtures Selection Preflight V1

## Dictamen

REPLAY_FIXTURES_SELECTION_READY_WITH_SYNTHETIC_FIELDS

## Scope

This audit selects evidence-backed candidates for a later fixture/replay strengthening step. It does not implement fixtures, does not create tests, does not modify runtime code, and does not activate shadow or productive authority.

## Inputs Read

- `docs/audits/_eve_organism_real_observation_signal_inventory_v1.json`
- `docs/audits/_eve_organism_real_observation_entrypoint_decision_v1.json`
- `docs/audits/_eve_organism_real_observation_gap_index_v1.json`
- `docs/audits/_eve_organism_shadow_e2e_harness_v1.json`
- `src/types/eve-organism-shadow-e2e.ts`
- `src/services/eve-organism-shadow-e2e-adapter.ts`
- `tests/regression/eve-organism-shadow-e2e-adapter.test.ts`

## Source Findings

- `safe_fixture_replay_total`: 278
- Real-observation entrypoint dictamen: `REAL_OBSERVATION_PREFLIGHT_READY_WITH_FIXTURE_FIRST_ONLY`
- Shadow E2E harness dictamen: `SHADOW_E2E_OFFLINE_HARNESS_PASSED_WITH_NON_BLOCKING_WARNINGS`
- Gap index: 11 total, 0 critical, 10 high, 1 medium

## Selected Set

The selected set contains 16 candidates, one per required replay coverage category. The set is intentionally fixture-only: when a field is not present in the source evidence, the matrix marks it as `missing_in_source`; if an offline test value is needed later, the matrix declares `synthetic_test_value_required: true`.

| Coverage | Fixture id | Source signal | Evidence locator | Expected result |
| --- | --- | --- | --- | --- |
| WorkMap activity | `replay_fixture_001_workmap_activity` | `ROSIG-0089` | `src/services/primary-activity-selector.ts:17,148,164,168` | `SHADOW_ACCEPTED` |
| Significado intent | `replay_fixture_002_significado_intent` | `ROSIG-0099` | `src/services/significado-activity-anchor-adapter.ts:17,18,41,88,89,233,244` | `SHADOW_ACCEPTED` |
| runtime-like response | `replay_fixture_003_runtime_like_response` | `ROSIG-0091` | `src/services/runtime-block0-response-model.ts:11,13,185,186,208,226,228` | `SHADOW_ACCEPTED` |
| evidence provenance | `replay_fixture_004_evidence_provenance` | `ROSIG-0146` | `src/services/export/activity-collection-xlsx.ts:23,102,103,130,132,265,269` | `SHADOW_ACCEPTED` |
| candidate sourceTrace | `replay_fixture_005_candidate_source_trace` | `ROSIG-0209` | `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:50,51,293,294,297` | `SHADOW_ACCEPTED` |
| officialFlowRef | `replay_fixture_006_official_flow_ref` | `ROSIG-0209` | `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:84,110,207,304,306,307,308` | `SHADOW_ACCEPTED` |
| missing context | `replay_fixture_007_missing_context` | `ROSIG-0209` | `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:90,142,268,270,271` | `SHADOW_BLOCKED` |
| missing provenance | `replay_fixture_008_missing_provenance` | `ROSIG-0209` | `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:93,94,145,320,322,325,327` | `SHADOW_DEGRADED` |
| missing idempotency/correlation | `replay_fixture_009_missing_idempotency_correlation` | `ROSIG-0084` | `src/services/eve-organism-shadow-e2e-adapter.ts:60,61,113` and `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:166,167,168` | `SHADOW_ACCEPTED` |
| missing sourceTrace | `replay_fixture_010_missing_source_trace` | `ROSIG-0209` | `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:147,148,333,337,339` | `SHADOW_DEGRADED` |
| registry/export attempt | `replay_fixture_011_registry_export_attempt` | `ROSIG-0084` | `src/services/eve-organism-shadow-e2e-adapter.ts:166,233` and `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:98` | `SHADOW_BLOCKED` |
| tenant leak | `replay_fixture_012_tenant_leak_attempt` | `ROSIG-0084` | `src/services/eve-organism-shadow-e2e-adapter.ts:167,247` and `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:102,186,187,189` | `SHADOW_BLOCKED` |
| gate bypass | `replay_fixture_013_gate_bypass_signal` | `ROSIG-0084` | `src/services/eve-organism-shadow-e2e-adapter.ts:164,178` | `SHADOW_BLOCKED` |
| evidence corruption | `replay_fixture_014_evidence_corruption_signal` | `ROSIG-0154` | `src/types/eve-organism-shadow-e2e.ts:24,25,39,40,41` and `src/services/eve-organism-shadow-e2e-adapter.ts:165` | `SHADOW_DEGRADED` |
| no-go critical | `replay_fixture_015_no_go_critical_signal` | `ROSIG-0084` | `src/services/eve-organism-shadow-e2e-adapter.ts:200` and `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:106,111,177` | `SHADOW_BLOCKED` |
| non-critical divergence | `replay_fixture_016_non_critical_divergence_signal` | `ROSIG-0209` | `tests/regression/eve-organism-shadow-e2e-adapter.test.ts:147,148,171,333,337,339` | `SHADOW_DEGRADED` |

## Synthetic Field Policy

Synthetic fields are required. The selected real repo signals often expose only part of the replay envelope: for example activity/provenance without tenant, organization, actor, correlation, idempotency or official-flow comparator fields. The matrix therefore requires later fixture implementation to use non-sensitive synthetic values only where explicitly declared.

No selected candidate may treat synthetic fixture values as real observation data.

## No-Cableado

- WorkMap connected: false
- Significado connected: false
- runtime connected: false
- DB touched: false
- Supabase touched: false
- registry written: false
- export produced: false
- diagnosis enabled: false
- UI touched: false
- shadow activated: false

## Created Artifacts

- `docs/audits/AUDIT_EVE_ORGANISM_REPLAY_FIXTURES_SELECTION_PREFLIGHT_V1.md`
- `docs/audits/_eve_organism_replay_fixtures_selection_preflight_v1.json`
- `docs/audits/_eve_organism_replay_fixture_candidate_matrix_v1.json`

## Next Step

REPLAY_FIXTURES_STRENGTHENING_V1
