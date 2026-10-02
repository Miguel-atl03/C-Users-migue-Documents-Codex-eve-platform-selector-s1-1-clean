# Runtime 40/20 Phase 8 Causal Score Decision Budget Selection Local Contract Closeout

## 1. Dictamen

RUNTIME_40_20_PHASE8_CAUSAL_SCORE_DECISION_BUDGET_SELECTION_LOCAL_CONTRACT_V1 completed as a local-only Phase 8-B contract.

## 2. Plan phase

Parte 2 - Fase 8 - Branching + Budget.

## 3. Tree points worked

- 8.5 Causal score model
- 8.6 Branching decision contract
- 8.7 Budget state model
- 8.8 Budget ledger candidate
- 8.9 Selection under budget

## 4. Rector documents referenced

- EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx
- Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx
- EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx

## 5. Control de fuente / No-inferencia

The implementation is bounded by the authorized Phase 8-B instruction, the accepted Phase 7 final closeout, the corrected and accepted Phase 8-A contract, and the Phase 8-A signal intake/status patch. Scores are built only from explicit signal candidates and explicit score components or allowed source families. No causal opening, real branching decision, real budget ledger update, runtime interaction instance, formal carry-forward gap, reentry, Phase 9 execution, Supabase, SQL, endpoint, diagnosis, IR, registry, or export-preview was introduced.

## 6. Causal score model

`RuntimeBranchingCausalScoreCandidate` was added. It requires `signal_candidate_ref` and `score_source_trace`, supports the authorized score components from +5 through +0, blocks fabricated signals, blocks B7 diagnostic score attempts, and never opens causals from score alone.

## 7. Branching decision candidate contract

`RuntimeBranchingDecisionCandidate` was added. Decision candidates remain local only. `open_causal` means selected for future opening, `open_reentry` means future reentry model only, and `carry_forward_gap` means future need only. No real branching decision is created.

## 8. Budget state model

`RuntimeBranchingBudgetStateCandidate` was added with base limit 40, causal limit 20, remaining budgets, budget exhaustion, budget bucket, source trace, and overflow blocking. Causal count is preserved and not reset.

## 9. Budget ledger candidate

`RuntimeBranchingBudgetLedgerCandidate` was added. It links to the branching decision candidate, preserves budget before/after/delta, keeps real ledger update false, and performs no DB write.

## 10. Selection under budget

`RuntimeBranchingSelectionUnderBudgetCandidate` was added. Selection orders candidates by causal score, applies severity and route criticality tiebreakers, checks user input, causal count, mutual exclusion, closed_by_other, duplicate opening, curiosity score zero, missing rule ref, and budget exhaustion. Selection does not open causals or create runtime interaction instances.

## 11. Direct source vs derived boundary

- 8.5 causal score model: direct source and priority boundary.
- 8.6 branching decision contract: direct source and candidate boundary.
- 8.7 budget state model: direct source and budget boundary.
- 8.8 budget ledger candidate: direct source and local ledger boundary.
- 8.9 selection under budget: direct source and selection boundary.

## 12. No-Inference verification

No causal score is assigned without an explicit signal and source trace. No severity, route criticality, user input requirement, or budget state is invented outside the local input. B7 remains non-diagnostic. Curiosity score 0 is not selected for causal opening.

## 13. Boundary verification

causal_opened = false
runtime_interaction_instance_created = false
carry_forward_gap_formal_created = false
reentry_opened = false
branching_decision_real_created = false
budget_ledger_real_updated = false
critical_route_gate_executed = false
mmabp_gate_engine_executed = false
readiness_engine_executed = false
phase9_started = false
supabase_touched = false
sql_executed = false
endpoint_created = false

## 14. Code changes

- Extended `runtime-40-20-branching-budget-types.ts` with 8-B score, decision, budget state, ledger, and selection candidate contracts.
- Extended `runtime-40-20-branching-budget-service.ts` with 8-B local builders and result wiring.
- Extended `runtime-40-20-branching-budget.test.mjs` with 8-B tests.

## 15. Test execution

Command:

```bash
node --test src/services/eve/runtime-40-20/branching-budget/runtime-40-20-branching-budget.test.mjs
```

Result: passed. 132 tests passed, 0 failed.

## 16. Phase 8 status after this tramo

phase8_started_local = true
phase8_closed_local = false
ready_for_phase9_authorization = false
next_authorization_required = true
