# EVE Organism Real Signal Field Proof Inventory V1

## Dictamen

REAL_SIGNAL_FIELD_PROOF_PARTIAL_REPLAY_ONLY_CONTINUES

## Summary

The repository contains partial documentary evidence for several field names, especially `sessionId`, `activityId`, `userId`, and `provenance`. However, no single safe real signal object proves the required composite set: tenant/organization/session/activity, provenance or sourceTrace, idempotency or correlation, and officialFlowRef without UI, DB, Supabase, WorkMap, Significado, runtime, registry or export risk.

## Field Status

| Field | Confidence | Blocker impact | Strongest evidence |
| --- | --- | --- | --- |
| `tenantId` | weak | does_not_clear_blocker | `src/types/eve-organism-composition-root.ts:93` |
| `organizationId` | weak | does_not_clear_blocker | `src/types/eve-organism-composition-root.ts:94` |
| `sessionId` | partial | reduces_blocker | `src/domain/causal.ts:235` |
| `activityId` | partial | reduces_blocker | `src/domain/activity.ts:42` |
| `actorId/userId` | partial | reduces_blocker | `src/domain/activity.ts:55` |
| `provenance` | partial | reduces_blocker | `src/domain/questionnaire.ts:204` |
| `sourceTrace` | weak | does_not_clear_blocker | `src/domain/eve-03-canonical-catalog-shadow.ts:57` |
| `idempotencyKey` | weak | does_not_clear_blocker | `src/types/eve-organism-composition-root.ts:105` |
| `correlationId` | weak | does_not_clear_blocker | `src/services/mba/adapters/capa1-observer.mjs:100` |
| `officialFlowRef` | not_proven | does_not_clear_blocker | `src/services/eve-organism-shadow-e2e-adapter.ts:105` |

## Composite Candidates

- Total: 6
- Candidate for future observer: 0
- Replay only: 5
- Rejected: 1

## Exit Conditions

- Total: 18
- Closed: 0
- Partially supported: 10
- Open: 8

## Blocker Status

- ROB-002: reduced - sessionId/activityId and user-related fields appear in product code, but tenant/organization/full context remains weak or not proven.
- ROB-003: reduced - provenance appears in services/types, but sourceTrace is mostly replay/test/shadow and not proven as real signal evidence.
- ROB-004: open - idempotency/correlation are found mainly in shadow/replay infrastructure, not a real platform signal.
- ROB-005: open - officialFlowRef exists in shadow/replay artifacts only and cannot be treated as real official flow evidence.
- ROB-008: open - synthetic fixture fields remain explicitly declared and do not convert to real evidence.

## No Modification Attestation

- src modified: false
- tests modified: false
- app modified: false
- DB modified: false
- runtime connected: false
- shadow activated: false
- registry written: false
- commit created: false

## Next Step

REPLAY_ONLY_CONTINUES_V1
