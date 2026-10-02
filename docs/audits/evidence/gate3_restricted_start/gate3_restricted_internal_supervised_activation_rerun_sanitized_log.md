# Sanitized Log - RERUN_GATE_3_RESTRICTED_INTERNAL_SUPERVISED_ACTIVATION_V1

## Command

`node --test tests/regression/eve-organism-shadow-e2e-adapter.test.ts`

## Sanitized output summary

- Node warning: TypeScript file reparsed as ES module because package type is not specified.
- Test file executed successfully.
- Gate 3 marker scenario observed: `A-005B: Gate 3 candidate_generation envelope carries supervised markers`.
- tests: 45
- pass: 45
- fail: 0
- duration_ms: 120.3424

## Marker evidence

- `runShadowE2EReplay` executed by replay scenarios.
- `candidate_generation` accepted with sourceTrace.
- Gate 3 envelope carries supervised markers.
- No-Go scenario still requires human review.
- No DB write, registry write, export, diagnosis, UI touch, production authority or external backend requirement.
- Forbidden import/side-effect guard passed.

## Sanitization

- env_file_read: false
- secret_values_exposed: false
- db_connected: false
- supabase_connected: false
- writes_attempted: false
- registry_written: false
- export_generated: false
- diagnosis_enabled: false
