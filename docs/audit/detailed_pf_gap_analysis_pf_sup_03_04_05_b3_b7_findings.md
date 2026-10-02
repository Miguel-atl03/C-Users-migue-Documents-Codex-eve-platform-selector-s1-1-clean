# Detailed PF Gap Analysis Findings

## Rector source note
- Rector source: `C:\Users\migue\Downloads\Minimal Business Architecture EVE\MMABP_Minimal_Business_Architecture_EVE_v1_1_B3_B7_alineado.docx`
- Rector source type: `full_docx_shared_read`
- Scope impact: PF-SUP-03, PF-SUP-04, PF-SUP-05, B3 and B7 were crossed against the rector document first, before implementation materiality was interpreted.

## HIGH
### DPF-HIGH-001
- Severity: HIGH
- PF affected: PF-SUP-03
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: PF-SUP-03 requires executable transduction from EvidenceBundle[ReadyForTransduction] to EscenaEvidencial[Validated].
- Impact: Current materiality can be mistaken for implementation although it is a transition/timer contract.
- Recommended action: Add a PF-SUP-03 runner contract and local test before claiming executable flow.
- Dependency: moc_and_olc

### DPF-HIGH-002
- Severity: HIGH
- PF affected: PF-SUP-04
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: PF-SUP-04 requires SceneSet, AggregationIndex, multi-role pattern and aggregate traceability before PeliculaCausalAgregada[Aggregated].
- Impact: Guardrails exist, but the aggregation flow is not executable at PF-SUP-04 level.
- Recommended action: Add minimal PF-SUP-04 aggregation contract; keep Capa 2.5 aggregation out of scope unless explicitly bridged.
- Dependency: moc_and_olc

### DPF-HIGH-003
- Severity: HIGH
- PF affected: PF-SUP-05
- Evidence/path: `src/services/mba/domain-state-registry.mjs`, `src/services/mba/nonconformance-rules.mjs`
- Rector rule affected: PF-SUP-05 requires expert traceability, expert review and authorized delivery.
- Impact: Delivery is represented and guarded, but no authorized synthesis service exists.
- Recommended action: Keep PF-SUP-05 blocked as final output until Gate/Fase authorization and add a non-executing contract first.
- Dependency: moc_and_olc

### DPF-HIGH-004
- Severity: HIGH
- PF affected: B7 / downstream PF
- Evidence/path: `docs/chips/runtime-catalog/EVE_04_Runtime_Catalog_v0_2/EVE_04_Runtime_Catalog_v0_2.ts`, `src/types/eve-organism-gate2-signal-guardrails.ts`
- Rector rule affected: B7 cannot produce structural fact, registry, IR, export, OEE or diagnosis.
- Impact: Boundary is documented/typed, but no first-class `PreclassificationRecord` and executable downstream contamination test was found.
- Recommended action: Add B7 boundary contract with `interpretation_limit` and `non_diagnostic_signal_only`.
- Dependency: moc

## MEDIUM
### DPF-MED-001
- Severity: MEDIUM
- PF affected: B3 / PF rework boundary
- Evidence/path: `fixtures/canonical/capa-1/v2.1/question-catalog-v2-1.master.json`, `fixtures/canonical/capa-1/v2.1/canonical-dictionary-v2-1.json`
- Rector rule affected: receiver_feedback can trigger operational event only through canonical route; receiver_satisfaction cannot.
- Impact: Separation exists in catalog, but no first-class operational feedback object or PF event bridge was found.
- Recommended action: Add `ReceiverFeedbackObject` or `OperationalExceptionEvidence` contract with route_ref/source_ref and gap/reentry behavior.
- Dependency: olc

### DPF-MED-002
- Severity: MEDIUM
- PF affected: PF-SUP-03 / PF-SUP-04 / PF-SUP-05
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: rector timers require step-specific waiting states and exits.
- Impact: Only one broad equivalent timer exists per PF; exact rector timers are missing.
- Recommended action: Add PF timer matrix before executable implementation.
- Dependency: olc

## LOW
### DPF-LOW-001
- Severity: LOW
- PF affected: PF-SUP-04
- Evidence/path: `src/services/client-causal-aggregation-engine.ts`, `src/app/api/causal/client-aggregation/route.ts`
- Rector rule affected: PF-SUP-04 must not be conflated with Capa 2.5 causal aggregation.
- Impact: Existing aggregation services may be misread as PF-SUP-04, but they belong to a different layer.
- Recommended action: Add explicit boundary note in future PF-SUP-04 design.
- Dependency: moc

## INFO
### DPF-INFO-001
- Severity: INFO
- PF affected: PF-SUP-03 / PF-SUP-04 / PF-SUP-05
- Evidence/path: `src/services/mba/domain-state-registry.mjs`
- Rector rule affected: Object/state naming.
- Impact: State and transition vocabulary is already aligned enough to support a next MoC/OLC tranche.
- Recommended action: Use current registry as input, not as proof of executable implementation.
- Dependency: moc_and_olc
