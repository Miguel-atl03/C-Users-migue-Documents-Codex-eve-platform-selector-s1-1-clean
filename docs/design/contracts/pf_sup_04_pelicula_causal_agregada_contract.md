# PF-SUP-04 PeliculaCausalAgregada Contract

## 1. Tree branch
PF-SUP-04 / causal aggregation object ownership

## 2. Object ownership
PeliculaCausalAgregada is owned by PF-SUP-04 and cannot be owned by Runtime 40/20.
implementation_allowed=false

## 3. MoC minimum gate
Aggregated movie must preserve causal traces across validated scenes.

## 4. OLC / state machine
- scenes_received
- aggregation_eligible
- index_built
- pattern_identified
- loss_estimated
- composed
- aggregated
- blocked_by_insufficient_scenes
- manual_review_required
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
- pelicula_id
- scene_set_ref
- aggregation_index_ref
- pattern_refs
- monetizable_signal_refs
- loss_estimate_refs
- ahe_blockage_refs

## 7. Required source_ref / derivation_ref
source_ref and derivation_ref are mandatory. Missing either field blocks L4 contract_defined acceptance.

## 8. GovernanceIssue linkage
governance_issue_refs is mandatory for rework, boundary violation and No-Go attempts.

## 9. ReadinessDecision linkage
readiness_decision_ref is mandatory and documentary only in this tramo.

## 10. Allowed consumers
- PF-SUP-05 contract service
- ArchitectureConsistencyAssessment readiness

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
blocked_by_insufficient_scenes -> GovernanceIssue -> PF-SUP-03/PF-SUP-04 rework

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
