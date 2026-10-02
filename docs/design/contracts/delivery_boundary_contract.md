# PF-SUP-05 DeliveryBoundary Contract

## 1. Tree branch
PF-SUP-05 / synthesis contract and delivery boundary ownership

## 2. Object ownership
DeliveryBoundary is owned by PF-SUP-05. Sistema Regulatorio is authorization boundary only.
implementation_allowed=false

## 3. MoC minimum gate
Delivery boundary can be created only from SynthesisCase with traceability checked.

## 4. OLC / state machine
- created
- authorization_checked
- delivery_blocked
- delivery_authorized
- manual_review_required
- archived

## 5. Source inputs
- PeliculaCausalAgregada aggregated
- traceability_manifest
- authorization_boundary_ref

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
- delivery_boundary_id
- synthesis_case_ref
- authorization_status
- blocked_outputs
- governance_issue_ref
- delivery_authorized_unreachable_in_this_tramo

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- manual authorization process

## 11. Forbidden consumers
- automatic_delivered_diagnosis
- client_delivery
- export_code_package_generated

## 12. Boundary guards
- implementation_allowed=false
- Runtime 40/20 full allowed=false
- no diagnosis/export/registry/Delivered unless explicitly allowed
- receiver_satisfaction != receiver_feedback for B3 when applicable
- B7 remains non_diagnostic_preclassification_only when applicable

## 13. Rework route
delivery_blocked -> GovernanceIssue -> manual authorization boundary review

## 14. No-Go conditions
- implement service
- create endpoint
- create migration or SQL
- execute Supabase
- create executable test
- activate Runtime 40/20 full
- generate diagnosis/export/Delivered

## 15. Service contract dependency
services/eve/synthesis/expert-synthesis-contract-service

## 16. Test contract dependency
tests/pf-sup-05/expert-synthesis-contract.test

## 17. Materiality marker dependency
PF_SUP_05_MATERIALITY_MARKER

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
