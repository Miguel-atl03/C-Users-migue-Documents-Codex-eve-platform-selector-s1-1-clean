# PF-SUP-03 ActoObservable Contract

## 1. Tree branch
Capa 1.0 / Ruta de Materializacion / EvidenceBundle -> PF-SUP-03 / ActoObservable

## 2. Object ownership
ActoObservable is owned by PF-SUP-03 as the atomic observable act extracted from evidence.
implementation_allowed=false

## 3. MoC minimum gate
A source evidence fragment must show an observable action over a material object.

## 4. OLC / state machine
- captured
- evidence_linked
- accepted
- rejected
- requires_review
- archived

## 5. Source inputs
- EvidenceBundle ready_for_transduction
- ActoObservable candidates
- source_ref
- derivation_ref

## 6. Required fields
- id
- case_id
- state
- source_ref
- derivation_ref
- governance_issue_refs
- readiness_decision_ref
- allowed_consumers
- forbidden_consumers
- audit_log
- acto_observable_id
- source_evidence_ref
- source_scene_ref
- actor_role_ref
- observed_action
- observed_object
- material_trace
- epistemic_status

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- EscenaEvidencial

## 11. Forbidden consumers
- diagnosis
- export
- registry
- final_client_narrative

## 12. Boundary guards
- implementation_allowed=false
- Runtime 40/20 full allowed=false
- no diagnosis/export/registry/Delivered unless explicitly allowed
- receiver_satisfaction != receiver_feedback for B3 when applicable
- B7 remains non_diagnostic_preclassification_only when applicable

## 13. Rework route
requires_review -> GovernanceIssue -> EvidenceBundle clarification

## 14. No-Go conditions
- implement service
- create endpoint
- create migration or SQL
- execute Supabase
- create executable test
- activate Runtime 40/20 full
- generate diagnosis/export/Delivered

## 15. Service contract dependency
services/eve/transduction/evidential-scene-runner

## 16. Test contract dependency
tests/pf-sup-03/evidential-scene-runner.test

## 17. Materiality marker dependency
PF_SUP_03_MATERIALITY_MARKER

## 18. L4 acceptance criteria
- contract markdown exists
- schema JSON exists
- state machine declared
- source_ref and derivation_ref required
- GovernanceIssue and ReadinessDecision linkage declared
- allowed and forbidden consumers declared
- implementation_allowed=false
- materiality target L4 contract_defined

## 19. Explicitly not implemented in this tramo
- No executable service.
- No executable test.
- No endpoint.
- No SQL or migration.
- No Supabase operation.
- No Runtime 40/20 full activation.
- No diagnosis, export, registry or Delivered output.
