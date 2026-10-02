# RUN_GATE_3_RESTRICTED_INTERNAL_SUPERVISED_ACTIVATION_V1

DICTAMEN: GATE_3_RESTRICTED_INTERNAL_SUPERVISED_ACTIVATION_EXECUTED_DEGRADED

## Execution

- Route: LOCAL_CONTROLLED_INTERNAL_MBA_ACTIVATION_ROUTE
- Command: `node --test tests/regression/eve-organism-shadow-e2e-adapter.test.ts`
- Exit code: 0
- Test executed: true
- Test passed: true
- Tests passed: 44
- Tests failed: 0

## Gate 3 markers

- runShadowE2EReplay executed: true
- operational input headcount present in executed test: false
- candidate_generation present: true
- candidate output draft present: false
- evidence trace present: true
- source trace present: true
- No-Go status present: true
- S3* review required present: false
- G2-RISK-001 carry-forward present: false

## Assessment

The existing local replay harness is executable and passes. It validates offline replay, candidate_generation, sourceTrace, evidence provenance, no-cableado and forbidden side-effect guardrails.

The run is degraded because it does not execute the authorized headcount Gate 3 run envelope and does not produce the required S3* review marker or G2-RISK-001 carry-forward marker.

## Side effects

- env_file_read: false
- secret_values_exposed: false
- db_connected: false
- supabase_connected: false
- writes_attempted: false
- write_count: 0
- migration_executed: false
- sql_modified: false
- observer_created: false
- registry_written: false
- export_generated: false
- diagnosis_enabled: false
- runtime_mutated: false
- object_inventory_mutated: false
- mba_written: false
- parallel_production_real_started: false
- gate4_started: false
- gate5_started: false
- fase9_started: false

## Next step
PATCH_GATE_3_REPLAY_MARKERS_MINIMAL_V1
