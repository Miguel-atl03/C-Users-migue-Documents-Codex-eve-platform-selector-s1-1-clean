# B3 OperationalExceptionEvidence Contract

## 1. Tree branch
Capa 1.0 / OperationalExceptionEvidence

## 2. Object ownership
OperationalExceptionEvidence is owned by Capa 1.0/B3 when derived from route-validated receiver feedback or transformation exception.
implementation_allowed=false

## 3. MoC minimum gate
Operational exception must point to a material operational deviation.

## 4. OLC / state machine
- detected
- route_checked
- derived
- unresolved
- classified
- linked_to_issue
- ready_for_bundle
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
- exception_evidence_id
- subtype
- scene_id
- block_id
- route_code
- canonical_value
- literal_evidence
- severity

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- EvidenceBundle
- PF rework/block/handoff

## 11. Forbidden consumers
- diagnosis
- export
- registry
- B7_preclassification_as_OEE

## 12. Boundary guards
- implementation_allowed=false
- Runtime 40/20 full allowed=false
- no diagnosis/export/registry/Delivered unless explicitly allowed
- receiver_satisfaction != receiver_feedback for B3 when applicable
- B7 remains non_diagnostic_preclassification_only when applicable

## 13. Rework route
unresolved -> GovernanceIssue -> B3 clarification

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
