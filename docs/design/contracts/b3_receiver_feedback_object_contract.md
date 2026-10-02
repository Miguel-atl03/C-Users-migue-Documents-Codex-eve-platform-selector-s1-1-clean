# B3 ReceiverFeedbackObject Contract

## 1. Tree branch
Capa 1.0 / B3 receiver feedback materiality

## 2. Object ownership
ReceiverFeedbackObject is owned by B3 and separated from receiver satisfaction.
implementation_allowed=false

## 3. MoC minimum gate
Feedback must describe receiver-side operational effect, not satisfaction value alone.

## 4. OLC / state machine
- captured
- route_validated
- operationally_relevant
- rejected_as_satisfaction_only
- gap_flagged
- rework_triggered
- blocked_by_missing_canonical_route
- frozen
- archived

## 5. Source inputs
- B3 route 3.13a receiver feedback evidence
- output_handoff_ref
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
- receiver_feedback_id
- scene_id
- output_handoff_ref
- receiver_satisfaction_value
- receiver_feedback_exists
- receiver_feedback_literal
- receiver_feedback_type
- receiver_feedback_route_status
- canonical_route_ref
- operational_impact

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- EvidenceBundle
- PF rework when route_validated
- OperationalExceptionEvidence

## 11. Forbidden consumers
- receiver_satisfaction_as_feedback
- diagnosis
- export
- registry

## 12. Boundary guards
- implementation_allowed=false
- Runtime 40/20 full allowed=false
- no diagnosis/export/registry/Delivered unless explicitly allowed
- receiver_satisfaction != receiver_feedback for B3 when applicable
- B7 remains non_diagnostic_preclassification_only when applicable

## 13. Rework route
blocked_by_missing_canonical_route -> CanonicalRouteException; gap_flagged -> GapObject

## 14. No-Go conditions
- implement service
- create endpoint
- create migration or SQL
- execute Supabase
- create executable test
- activate Runtime 40/20 full
- generate diagnosis/export/Delivered

## 15. Service contract dependency
services/eve/capa1/b3-receiver-feedback-materializer

## 16. Test contract dependency
tests/b3/receiver-feedback-materializer.test

## 17. Materiality marker dependency
B3_FIRST_CLASS_MATERIALITY_MARKER

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
