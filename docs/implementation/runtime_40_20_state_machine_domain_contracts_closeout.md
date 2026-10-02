# Runtime 40/20 State Machine And Domain Contracts Closeout

## 1. Fase del plan

Parte 2 - Fase 4 - Motor Runtime 40/20, contrato previo de dominio y maquinas de estado

## 2. Dictamen

RUNTIME_40_20_STATE_MACHINE_AND_DOMAIN_CONTRACTS_COMPLETED

## 3. Files created

- `src/services/eve/runtime-40-20/domain/runtime-40-20-domain-state-types.ts`
- `src/services/eve/runtime-40-20/domain/runtime-40-20-state-machine-contract.ts`
- `src/services/eve/runtime-40-20/domain/runtime-40-20-state-machine-guards.ts`
- `src/services/eve/runtime-40-20/domain/runtime-40-20-state-machine-contract.test.mjs`
- `docs/implementation/runtime_40_20_state_machine_domain_contracts_closeout.md`
- `docs/implementation/runtime_40_20_state_machine_domain_contracts_traceability.json`

## 4. Files modified

None.

## 5. Rector documents referenced

- `EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx`
- `Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx`
- `EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx`

## 6. Execution core schema dependency

The local domain contract depends on the Execution Core schema contract being ready. The execution core migration remains unapplied, the catalog remains inactive, and Runtime 40/20 remains stopped.

## 7. Role runtime session state machine

The contract defines `draft`, `active`, `in_progress`, `ready_with_flags`, `completed`, `blocked`, and `archived`, with primary activity limit declared as 8.

## 8. Activity runtime run state machine

The contract defines the full activity run state set and allowed transitions from `initialized` through capture, readiness, review, export, and archive states. `archived` has no outgoing transition.

## 9. Runtime interaction instance state machine

The contract defines pending, shown, answered, confirmation/correction, inferred, skipped, closed, blocked, and reopened states with local transition guards.

## 10. Budget 40+20 contract

The budget guard validates `base_visible_count <= 40`, `causal_visible_count <= 20`, and `selected_primary_activity_count <= 8`. Reentry counting is declared only, not executed.

## 11. Epistemic status contract

The contract defines captured user evidence, AI inferred unconfirmed, user confirmed suggestion, user corrected evidence, canonical derivation, and internal calculated statuses with local governance rules.

## 12. Route status contract

The contract defines not applicable, open, closed, closed with flags, blocked by missing canonical route, route missing, and superseded statuses.

## 13. Readiness state contract

The contract defines ready, ready with flags, missing evidence, contradiction, missing canonical route, manual review, and reentry states.

## 14. No-Go verification

Migration application, catalog activation, Runtime 40/20 start, Supabase touch, SQL execution, endpoint creation, real runtime records, business evidence, Registry, IR, Object Inventory, F5C, export, diagnosis, and Delivered remain false.

## 15. Runtime not started

Runtime 40/20 was not started.

## 16. Supabase / SQL / Endpoint not touched

No Supabase operation, SQL execution, or endpoint creation occurred.

## 17. Test execution

```text
node --test src/services/eve/runtime-40-20/domain/runtime-40-20-state-machine-contract.test.mjs
```

Status: passed. All 29 local node:test cases passed.

## 18. What remains outside this tramo

Runtime start, catalog activation, migration application, Supabase access, endpoint creation, real records, business evidence, export, diagnosis, Delivered, and conformance or consistency claims remain outside this tramo.
