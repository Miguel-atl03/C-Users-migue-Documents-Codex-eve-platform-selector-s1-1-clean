insert into eve_pr3.evaluator_authority (
  evaluator_authority_id, revision, approval_authority, reviewer_identity, reviewer_type, reviewer_version,
  qualified_scope, criterion_ids, interaction_classes, risk_classes, independence_class,
  generator_compatibility, valid_from, expires_at, status, restrictions, successor_authority_ref,
  qualification_basis_ref, invalidation_triggers, recertification_trigger
) values (
  'EVE-B2-EVALUATOR-AUTHORITY-CANDIDATE-v0.2.1',
  '0.2.1',
  'CENTRO_DE_CONTROL_PENDING_DECISION',
  'EVAL-FIXTURE-v1',
  'fixture_semantic_reviewer',
  '1.0',
  '{"profile_ref":"EVE-C1-B2-OPERATIONAL-PROJECTION-G1@1.1","operation":"render","locale":"es","target_class":"B2_CAPTURE_RENDER"}'::jsonb,
  '["intent_fidelity","observer_fidelity","reflexive_integrity","narrative_canonical_fidelity"]'::jsonb,
  '["B2_CAPTURE_RENDER"]'::jsonb,
  '["capture_contamination","unsupported_specificity","observer_scope_violation","stale_context"]'::jsonb,
  'partially_independent',
  '{"generator_ref":"fixture-generator-v1","context_policy_ref":"B2-CONTEXT-POLICY-G1.1","product_model_config_qualified":false}'::jsonb,
  '2026-09-29T00:00:00+00:00'::timestamptz,
  '2026-10-29T00:00:00+00:00'::timestamptz,
  'CANDIDATE',
  '{"not_institutionally_authorized":true,"not_valid_for_model_test":true,"reference_fixture_only":true,"automatic_admission":false}'::jsonb,
  null,
  'EVALUATOR-REFERENCE-QUALIFICATION-BANK-v0.2.1',
  '["generator_change","context_policy_change","profile_revision_change","criterion_change"]'::jsonb,
  'Exact evaluator/model/configuration execution becomes available or material configuration changes'
) on conflict (evaluator_authority_id, revision) do nothing;
