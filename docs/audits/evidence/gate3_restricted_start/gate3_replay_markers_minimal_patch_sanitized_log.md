# Sanitized Log - PATCH_GATE_3_REPLAY_MARKERS_MINIMAL_V1

## Functional patch

- Added an optional Gate 3 restricted activation envelope to the local replay adapter.
- The envelope is produced only for controlled `candidate_generation` signals carrying `gate3RestrictedActivation=true`.
- The envelope includes operational headcount input, draft candidate output, evidence trace, source trace, No-Go status, S3* review requirement, G2-RISK-001 carry-forward and promotion blocked.
- Added a regression scenario asserting the Gate 3 markers.

## Command

`node --test tests/regression/eve-organism-shadow-e2e-adapter.test.ts`

## Sanitized output summary

- Node warning: TypeScript file reparsed as ES module because package type is not specified.
- Test file executed successfully.
- New scenario observed: `A-005B: Gate 3 candidate_generation envelope carries supervised markers`.
- tests: 45
- pass: 45
- fail: 0
- duration_ms: 142.4165

## No-Go verification

- No `.env` read.
- No secrets exposed.
- No DB or Supabase connection.
- No migrations.
- No SQL changes.
- No observer.
- No registry/export/diagnosis.
- No runtime/object inventory/MBA writes.
- No Gate 4, Gate 5 or Fase 9.
