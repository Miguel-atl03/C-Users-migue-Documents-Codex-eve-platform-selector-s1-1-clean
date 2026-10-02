# B3-B7 AlignmentDelta Contract

## 1. Tree branch
Capa 1.0 / B3-B7 alignment control object ownership

## 2. Object ownership
B3B7AlignmentDelta is a control object for alignment only, not a business fact.
implementation_allowed=false

## 3. MoC minimum gate
Delta must compare boundary status without promoting B7 into B3 or OEE.

## 4. OLC / state machine
- created
- checked
- with_findings
- satisfied
- blocked
- archived

## 5. Source inputs
- ReceiverFeedbackObject candidate
- PreclassificationRecord candidate

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
- alignment_delta_id
- b3_status
- b7_status
- boundary_findings
- readiness_effect
- contamination_risk

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- ArchitectureConsistencyAssessment readiness
- GovernanceIssue

## 11. Forbidden consumers
- client_business_fact
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
blocked -> GovernanceIssue -> B3/B7 boundary review

## 14. No-Go conditions
- implement service
- create endpoint
- create migration or SQL
- execute Supabase
- create executable test
- activate Runtime 40/20 full
- generate diagnosis/export/Delivered

## 15. Service contract dependency
services/eve/capa1/b3-b7-alignment-delta-service

## 16. Test contract dependency
B3/B7 alignment contamination regression contract

## 17. Materiality marker dependency
B3_FIRST_CLASS_MATERIALITY_MARKER and B7_FIRST_CLASS_MATERIALITY_MARKER

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
