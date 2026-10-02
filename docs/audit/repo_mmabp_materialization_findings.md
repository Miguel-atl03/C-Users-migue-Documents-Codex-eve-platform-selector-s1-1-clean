# Repo MMABP Materialization Findings

## CRITICAL
No critical No-Go finding was confirmed in this discovery.

## HIGH
### DISC-HIGH-001
- Severity: HIGH
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: P-SUP-03, P-SUP-04 and P-SUP-05 must be distinguishable as executable PF flows, not only target-state contracts.
- Impact: Transduction, aggregation and expert synthesis can appear materially present while only being represented as OLC/process-state definitions.
- Recommended action: Run a detailed PF-SUP-03/04/05 gap design before claiming service-level implementation.

### DISC-HIGH-002
- Severity: HIGH
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/parallel-production/runtime/assessment-run.mjs`, `tests/regression/mba-control-plane/mba-control-plane.test.mjs`
- Rector rule affected: P-SUP-07 and P-SUP-08 require explicit conformance and consistency boundaries.
- Impact: The implementation combines them as `P-SUP-07/08`, which is workable for control but reduces traceability by individual PF id.
- Recommended action: Split audit labels or add explicit PF-SUP-07 and PF-SUP-08 evidence markers without changing runtime semantics.

## MEDIUM
### DISC-MED-001
- Severity: MEDIUM
- Evidence/path: `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json`, `fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json`, `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.ts`
- Rector rule affected: B3 receiver feedback must be separate from receiver satisfaction and have a route when operational feedback exists.
- Impact: Separation is documented/catalogued, but no first-class `ReceiverFeedbackObject` service/schema was found.
- Recommended action: Add a narrow B3 materiality test or contract that proves receiver feedback route handling without using satisfaction as a substitute.

### DISC-MED-002
- Severity: MEDIUM
- Evidence/path: `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.ts`, `docs/chips/agent-constitution/EVE_01_Agent_Constitution_v0_1/EVE_01_Agent_Constitution_v0_1.ts`, `src/types/eve-organism-gate2-signal-guardrails.ts`
- Rector rule affected: B7 must stay a non-diagnostic preclassification/boundary signal.
- Impact: Guardrails exist, but no dedicated `PreclassificationRecord` / `interpretation_limit` / `non_diagnostic_signal_only` service materiality was found.
- Recommended action: Add a discovery-to-contract follow-up for B7 boundary fields before allowing B7-derived downstream behavior.

## LOW
### DISC-LOW-001
- Severity: LOW
- Evidence/path: `package.json`
- Rector rule affected: Discovery should distinguish tested from testable.
- Impact: Test scripts exist, but this discovery did not execute tests by design.
- Recommended action: In a later safe verification tramo, run only local no-secret regression tests relevant to MBA control plane and parallel production.

## INFO
### DISC-INFO-001
- Severity: INFO
- Evidence/path: `schemas/parallel-production/`, `scripts/validate-parallel-production.mjs`, `tests/regression/parallel-production/`
- Rector rule affected: P-SUP-06/07/08/09 materiality.
- Impact: Strong evidence exists for candidate/shadow bounded parallel production: schemas, validators, fixtures and tests.
- Recommended action: Treat this as implemented for candidate/shadow scope, not final production/export scope.

### DISC-INFO-002
- Severity: INFO
- Evidence/path: `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: No-Go guardrails.
- Impact: The repo has explicit guards for export without ACA[Satisfied], QA routed to core, EvidenceBundle/MDSB fusion, SCR/EscenaEvidencial fusion, and Capa 1 diagnostic output.
- Recommended action: Keep these guards as acceptance criteria in future Gate 5/Fase 9 planning.
