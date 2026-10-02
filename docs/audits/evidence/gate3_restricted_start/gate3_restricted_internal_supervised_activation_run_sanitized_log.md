# Sanitized Log - RUN_GATE_3_RESTRICTED_INTERNAL_SUPERVISED_ACTIVATION_V1

## Preflight

- `src/services/eve-organism-shadow-e2e-adapter.ts`: found
- `tests/regression/eve-organism-shadow-e2e-adapter.test.ts`: found

## Command

`node --test tests/regression/eve-organism-shadow-e2e-adapter.test.ts`

## Sanitized output summary

- Warning: Node reparsed the TypeScript test file as an ES module because package type is not specified.
- Test file executed successfully.
- tests: 44
- pass: 44
- fail: 0
- duration_ms: 139.0697

## Relevant passed scenarios

- fixture workmap_activity accepted
- fixture significado_intent accepted
- evidence_capture accepted with provenance
- candidate_generation accepted with sourceTrace
- no_go_triggered requires human review
- every replay has no DB write
- every replay has no registry write
- every replay has no export
- every replay has no diagnosis
- every replay does not require external backend
- adapter and E2E tests have no forbidden imports or productive side effects

## Missing Gate 3 run markers

- authorized headcount operational input in executed test
- candidate output draft artifact
- explicit S3* review marker
- explicit G2-RISK-001 carry-forward marker

## Sanitization

- env_file_read: false
- secret_values_exposed: false
- db_connected: false
- supabase_connected: false
- writes_attempted: false
