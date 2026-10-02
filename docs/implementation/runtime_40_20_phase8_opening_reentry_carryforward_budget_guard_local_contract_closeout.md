# Runtime 40/20 Phase 8 Opening Reentry Carryforward Budget Guard Local Contract Closeout

## 1. Dictamen

RUNTIME_40_20_PHASE8_OPENING_REENTRY_CARRYFORWARD_BUDGET_GUARD_LOCAL_CONTRACT_V1 completed as a local-only Phase 8-C contract.

## 2. Plan phase

Parte 2 - Fase 8 - Branching + Budget.

## 3. Tree points worked

- 8.10 Causal interaction opening candidate
- 8.11 Skip / close_by_other / no_action contract
- 8.12 Reentry model
- 8.13 Carry-forward gap
- 8.14 Budget exhaustion guard

## 4. Rector documents referenced

- EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx
- EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx

## 5. Control de fuente / No-inferencia

The implementation is bounded by the authorized Phase 8-C instruction, the accepted Phase 7 final closeout, the corrected and accepted Phase 8-A contract, the Phase 8-A signal intake/status patch, and the accepted Phase 8-B contract. It creates only local candidates and guards. It does not create a real runtime interaction instance, shown_at, answered_at, UI render, endpoint, reentry, readiness gap record, readiness decision, branching decision, budget ledger update, Phase 9 execution, Supabase write, SQL execution, diagnosis, IR, registry, or export-preview.

## 6. Causal interaction opening candidate

`RuntimeBranchingCausalInteractionOpeningCandidate` was added. It is built only from a selected `open_causal` branching decision candidate and selection-under-budget output. It preserves `causal_interaction_id`, `opened_by_branching_decision_ref`, trigger source signal, trigger source trace, visibility/casual counting flags, and budget ledger candidate reference. It always keeps real creation flags false.

## 7. Skip / close_by_other / no_action contract

`RuntimeBranchingNonOpeningDecisionCandidate` was added. It supports `skip_causal`, `close_by_other`, and `no_action` as local non-opening candidates. `skip_causal` requires a skipped reason, `close_by_other` requires source variable or source evidence, `no_action` requires a no-action reason, and budget cost is forced to zero. Hidden opening, satisfaction-general closure, and B7 diagnostic closure are blocked.

## 8. Reentry model

`RuntimeBranchingReentryCandidate` was added. It requires blocking gap, source trace, and justification. `may_exceed_normal_flow` is true only when justification is present. Reentry by curiosity is blocked. No reentry or readiness decision is created.

## 9. Carry-forward gap

`RuntimeBranchingCarryForwardGapCandidate` was added. It requires source trace and a causal candidate not opened, supports the authorized carry-forward reasons, and keeps readiness gap record creation false. Hidden carry-forward gap is blocked.

## 10. Budget exhaustion guard

`RuntimeBranchingBudgetExhaustionGuard` was added. It detects causal limit reached, attempted opening over 20, opening blocked due to budget, critical route exception candidate, and reentry justification presence. Budget override, silent overflow, causal count reset, and budget ledger rewrite remain false, with local blocking reasons when attempted.

## 11. Direct source vs derived boundary

- 8.10 causal interaction opening candidate: direct source and opening candidate boundary.
- 8.11 skip / close_by_other / no_action contract: direct source and non-opening boundary.
- 8.12 reentry model: direct source and reentry boundary.
- 8.13 carry-forward gap: direct source and gap carry-forward boundary.
- 8.14 budget exhaustion guard: direct source and budget guard boundary.

## 12. No-Inference verification

Opening candidates are derived from selected branching decision candidates. Non-opening candidates require explicit reasons and source trace. Reentry candidates require blocking gap and justification. Carry-forward candidates require source trace and a not-opened causal candidate. Budget guard candidates do not authorize override or silent overflow.

## 13. Boundary verification

runtime_interaction_instance_real_created = false
shown_at_real_created = false
answered_at_real_created = false
ui_rendered_real = false
endpoint_created = false
branching_decision_real_created = false
budget_ledger_real_updated = false
causal_opened_real = false
reentry_opened_real = false
readiness_gap_record_real_created = false
readiness_decision_real_created = false
critical_route_gate_executed = false
mmabp_gate_engine_executed = false
readiness_engine_executed = false
phase9_started = false
supabase_touched = false
sql_executed = false

## 14. Code changes

- Extended `runtime-40-20-branching-budget-types.ts` with 8-C opening, non-opening, reentry, carry-forward, and budget guard contracts.
- Extended `runtime-40-20-branching-budget-service.ts` with 8-C local builders and result wiring.
- Extended `runtime-40-20-branching-budget.test.mjs` with 8-C tests and boundary checks.

## 15. Test execution

Command:

```bash
node --test src/services/eve/runtime-40-20/branching-budget/runtime-40-20-branching-budget.test.mjs
```

Result: passed. 201 tests passed, 0 failed.

## 16. Phase 8 status after this tramo

phase8_started_local = true
phase8_closed_local = false
ready_for_phase9_authorization = false
next_authorization_required = true
