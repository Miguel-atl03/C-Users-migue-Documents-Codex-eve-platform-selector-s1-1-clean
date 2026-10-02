# PF-SUP-04 AggregationIndex Contract

## 1. Tree branch
PF-SUP-04 / causal aggregation object ownership

## 2. Object ownership
AggregationIndex is owned by PF-SUP-04 and indexes validated scenes only.
implementation_allowed=false

## 3. MoC minimum gate
Indexed dimensions must preserve material object/state/event traceability.

## 4. OLC / state machine
- building
- built
- rejected
- superseded
- archived

## 5. Source inputs
- EscenaEvidencial validated collection
- SceneSet
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
- aggregation_index_id
- scene_set_id
- indexed_dimensions
- actor_role_index
- object_index
- event_index
- state_index
- inconsistency_index
- feedback_index
- b7_boundary_index

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- PeliculaCausalAgregada

## 11. Forbidden consumers
- final_diagnosis
- client_narrative
- export_code_package_generated

## 12. Boundary guards
- implementation_allowed=false
- Runtime 40/20 full allowed=false
- no diagnosis/export/registry/Delivered unless explicitly allowed
- receiver_satisfaction != receiver_feedback for B3 when applicable
- B7 remains non_diagnostic_preclassification_only when applicable

## 13. Rework route
rejected -> GovernanceIssue -> SceneSet correction

## 14. No-Go conditions
- implement service
- create endpoint
- create migration or SQL
- execute Supabase
- create executable test
- activate Runtime 40/20 full
- generate diagnosis/export/Delivered

## 15. Service contract dependency
services/eve/aggregation/causal-movie-aggregation-runner

## 16. Test contract dependency
tests/pf-sup-04/causal-movie-aggregation-runner.test

## 17. Materiality marker dependency
PF_SUP_04_MATERIALITY_MARKER

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
