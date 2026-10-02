# B7 PreclassificationRecord Contract

## 1. Tree branch
Capa 1.0 / B7 preclassification boundary object ownership

## 2. Object ownership
PreclassificationRecord is owned by B7 signal-only boundary. Sistema Regulatorio is only boundary/autorizacion.
implementation_allowed=false

## 3. MoC minimum gate
B7 can record preclassification signal but cannot create structural fact.

## 4. OLC / state machine
- captured
- boundary_checked
- signal_only_accepted
- rejected
- contamination_blocked
- manual_review_required
- frozen
- archived

## 5. Source inputs
- B7 source signal
- source_ref
- interpretation_limit

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
- preclassification_id
- scene_id
- source_b7_ref
- preclassification_ahe_level_dominant
- preclassification_interpersonal_signal
- preclassification_interpersonal_note
- preclassification_interpersonal_confirmation
- preclassification_ahe_bundle_refined
- interpretation_limit
- no_render_zone

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- EvidenceBundle summary
- QA restriction
- NoRenderZone

## 11. Forbidden consumers
- structural_fact
- registry
- IR
- export
- diagnosis
- OperationalExceptionEvidence

## 12. Boundary guards
- implementation_allowed=false
- Runtime 40/20 full allowed=false
- no diagnosis/export/registry/Delivered unless explicitly allowed
- receiver_satisfaction != receiver_feedback for B3 when applicable
- B7 remains non_diagnostic_preclassification_only when applicable

## 13. Rework route
contamination_blocked -> GovernanceIssue/TransductionBlocker

## 14. No-Go conditions
- implement service
- create endpoint
- create migration or SQL
- execute Supabase
- create executable test
- activate Runtime 40/20 full
- generate diagnosis/export/Delivered

## 15. Service contract dependency
services/eve/capa1/b7-preclassification-boundary-service

## 16. Test contract dependency
tests/b7/preclassification-boundary-service.test

## 17. Materiality marker dependency
B7_FIRST_CLASS_MATERIALITY_MARKER

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
