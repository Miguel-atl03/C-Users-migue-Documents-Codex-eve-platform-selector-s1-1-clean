-- EVE PR3 P2 clean state plane v1.0
-- GENERATED from A06 v1.3 + A07 v1.2. Legacy Supabase is NOT a baseline.
-- Physical policy for the pilot: one logical record family per table to preserve authority/reentry boundaries.
create schema if not exists eve_pr3;
create extension if not exists pgcrypto;

create table if not exists eve_pr3.authority_artifact (
  artifact_id text not null,
  artifact_class text not null,
  revision text not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  authority_domain text not null,
  state text not null,
  source_locator text,
  primary key (artifact_id, revision, sha256)
);
alter table eve_pr3.authority_artifact enable row level security;
alter table eve_pr3.authority_artifact force row level security;

create table if not exists eve_pr3.contract_set (
  contract_set_id text not null,
  object_key text not null,
  hash_profile_ref text not null,
  contract_set_sha256 text not null check (contract_set_sha256 ~ '^[0-9a-f]{64}$'),
  ordered_member_refs jsonb not null,
  member_count bigint not null,
  state text not null,
  primary key (contract_set_id, contract_set_sha256)
);
alter table eve_pr3.contract_set enable row level security;
alter table eve_pr3.contract_set force row level security;

create table if not exists eve_pr3.object_binding (
  object_binding_id text not null,
  object_key text not null,
  profile_id text not null,
  profile_revision text not null,
  profile_sha256 text not null check (profile_sha256 ~ '^[0-9a-f]{64}$'),
  mother_contract_id text not null,
  mother_contract_revision text not null,
  mother_contract_sha256 text not null check (mother_contract_sha256 ~ '^[0-9a-f]{64}$'),
  runtime_artifact text not null,
  runtime_sha256 text not null check (runtime_sha256 ~ '^[0-9a-f]{64}$'),
  promotion_receipt text not null,
  promotion_receipt_sha256 text not null check (promotion_receipt_sha256 ~ '^[0-9a-f]{64}$'),
  contract_set_id text not null,
  current_state text not null,
  ai_policy jsonb not null,
  primary key (object_binding_id),
  unique (object_key, profile_id, profile_revision, profile_sha256, runtime_sha256, contract_set_id)
);
alter table eve_pr3.object_binding enable row level security;
alter table eve_pr3.object_binding force row level security;

create table if not exists eve_pr3.chain_definition (
  chain_definition_id text not null,
  revision text not null,
  scope text not null,
  nodes jsonb not null,
  edges jsonb not null,
  next_resolution text not null,
  retry_policy jsonb not null,
  reentry_policy jsonb not null,
  persistence_ref text not null,
  definition_sha256 text not null check (definition_sha256 ~ '^[0-9a-f]{64}$'),
  primary key (chain_definition_id, revision, definition_sha256)
);
alter table eve_pr3.chain_definition enable row level security;
alter table eve_pr3.chain_definition force row level security;

create table if not exists eve_pr3.case_scope (
  case_id text not null,
  tenant_id text not null,
  company_id text not null,
  scope_revision text not null,
  state text not null,
  opened_at timestamptz not null,
  primary key (case_id, scope_revision),
  unique (tenant_id, company_id, case_id, scope_revision)
);
alter table eve_pr3.case_scope enable row level security;
alter table eve_pr3.case_scope force row level security;

create table if not exists eve_pr3.participant (
  participant_id text not null,
  case_id text not null,
  auth_actor_ref text not null,
  participant_type text not null,
  source_ref text not null,
  primary key (case_id, participant_id)
);
alter table eve_pr3.participant enable row level security;
alter table eve_pr3.participant force row level security;

create table if not exists eve_pr3.role_assignment (
  role_assignment_id text not null,
  case_id text not null,
  participant_id text not null,
  role_id text not null,
  role_label text,
  assignment_revision text not null,
  state text not null,
  primary key (role_assignment_id),
  unique (case_id, participant_id, role_id, assignment_revision)
);
alter table eve_pr3.role_assignment enable row level security;
alter table eve_pr3.role_assignment force row level security;

create table if not exists eve_pr3.activity (
  activity_id text not null,
  role_id text not null,
  activity_literal text not null,
  workmap_revision text not null,
  source_ref text not null,
  selection_state text not null,
  primary key (role_id, activity_id, workmap_revision)
);
alter table eve_pr3.activity enable row level security;
alter table eve_pr3.activity force row level security;

create table if not exists eve_pr3.chain_run (
  chain_run_id text not null,
  chain_definition_id text not null,
  chain_definition_revision text not null,
  case_id text not null,
  participant_id text not null,
  role_id text not null,
  activity_id text not null,
  run_ordinal bigint not null,
  state text not null,
  context_revision text not null,
  created_at timestamptz not null,
  completed_at timestamptz,
  primary key (chain_run_id),
  unique (chain_definition_id, chain_definition_revision, case_id, participant_id, role_id, activity_id, run_ordinal)
);
alter table eve_pr3.chain_run enable row level security;
alter table eve_pr3.chain_run force row level security;

create table if not exists eve_pr3.object_run (
  object_run_id text not null,
  chain_run_id text not null,
  object_key text not null,
  contract_set_id text not null,
  profile_id text not null,
  profile_revision text not null,
  profile_sha256 text not null check (profile_sha256 ~ '^[0-9a-f]{64}$'),
  local_run_id text,
  execution_ordinal bigint not null,
  state text not null,
  context_revision text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  primary key (object_run_id),
  unique (chain_run_id, object_key, contract_set_id, profile_id, profile_revision, execution_ordinal)
);
alter table eve_pr3.object_run enable row level security;
alter table eve_pr3.object_run force row level security;

create table if not exists eve_pr3.interaction_instance (
  interaction_key text not null,
  local_interaction_instance_id text not null,
  object_run_id text not null,
  runtime_definition_id text not null,
  definition_revision text not null,
  context_revision text not null,
  bucket text not null,
  idempotency_key text not null,
  charge_event_id text not null,
  state text not null,
  opening_ordinal bigint not null,
  opened_at timestamptz not null,
  shown_at timestamptz,
  completed_at timestamptz,
  primary key (interaction_key),
  unique (object_run_id, runtime_definition_id, definition_revision, opening_ordinal)
);
alter table eve_pr3.interaction_instance enable row level security;
alter table eve_pr3.interaction_instance force row level security;

create table if not exists eve_pr3.presentation_event (
  presentation_event_id text not null,
  object_run_id text not null,
  interaction_key text not null,
  target_id text not null,
  presentation_mode text not null,
  rendered_text text not null,
  context_revision text not null,
  proposal_ref text,
  admission_ref text,
  shown_at timestamptz not null,
  primary key (presentation_event_id),
  unique (object_run_id, interaction_key, target_id, presentation_mode, context_revision, proposal_ref, admission_ref, rendered_text)
);
alter table eve_pr3.presentation_event enable row level security;
alter table eve_pr3.presentation_event force row level security;

create table if not exists eve_pr3.response_event (
  response_key text not null,
  local_response_id text not null,
  object_run_id text not null,
  interaction_key text not null,
  subfield_id text not null,
  question_code text not null,
  raw_value jsonb not null,
  raw_literal text,
  user_action text not null,
  response_revision bigint not null,
  supersedes_response_key text,
  clarification_of_response_key text,
  knowledge_basis text not null,
  source_actor_ref text not null,
  provenance jsonb not null,
  idempotency_key text not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  received_at timestamptz not null,
  status text not null,
  primary key (response_key),
  unique (object_run_id, interaction_key, subfield_id, question_code, response_revision)
);
alter table eve_pr3.response_event enable row level security;
alter table eve_pr3.response_event force row level security;

create table if not exists eve_pr3.evidence_item (
  evidence_id text not null,
  object_run_id text not null,
  response_key text not null,
  question_code text not null,
  variable_id text not null,
  literal_or_value jsonb not null,
  knowledge_basis text not null,
  epistemic_class text not null,
  provenance jsonb not null,
  revision bigint not null,
  current boolean not null,
  primary key (evidence_id),
  unique (object_run_id, response_key, variable_id, revision)
);
alter table eve_pr3.evidence_item enable row level security;
alter table eve_pr3.evidence_item force row level security;

create table if not exists eve_pr3.canonical_variable_record (
  variable_record_id text not null,
  object_run_id text not null,
  variable_id text not null,
  value jsonb,
  value_state text not null,
  epistemic_class text not null,
  evidence_refs jsonb not null,
  derivation_rule_ref text,
  source_response_key text,
  revision bigint not null,
  current boolean not null,
  context_revision text not null,
  primary key (variable_record_id),
  unique (object_run_id, variable_id, revision, context_revision)
);
alter table eve_pr3.canonical_variable_record enable row level security;
alter table eve_pr3.canonical_variable_record force row level security;

create table if not exists eve_pr3.candidate_record (
  candidate_id text not null,
  object_run_id text not null,
  target_id text not null,
  proposed_value jsonb not null,
  origin text not null,
  source_refs jsonb not null,
  status text not null,
  revision bigint not null,
  context_revision text not null,
  primary key (candidate_id),
  unique (object_run_id, target_id, revision, context_revision)
);
alter table eve_pr3.candidate_record enable row level security;
alter table eve_pr3.candidate_record force row level security;

create table if not exists eve_pr3.branch_decision (
  branch_decision_id text not null,
  object_run_id text not null,
  rule_ref text not null,
  input_refs jsonb not null,
  tri_state text not null,
  target_ref text not null,
  outcome text not null,
  context_revision text not null,
  decided_at timestamptz not null,
  primary key (branch_decision_id),
  unique (object_run_id, rule_ref, input_refs, context_revision, decided_at)
);
alter table eve_pr3.branch_decision enable row level security;
alter table eve_pr3.branch_decision force row level security;

create table if not exists eve_pr3.budget_ledger (
  budget_event_id text not null,
  object_run_id text not null,
  interaction_key text,
  bucket text not null,
  delta bigint not null,
  idempotency_key text not null,
  reason text not null,
  recorded_at timestamptz not null,
  primary key (budget_event_id),
  unique (object_run_id, idempotency_key)
);
alter table eve_pr3.budget_ledger enable row level security;
alter table eve_pr3.budget_ledger force row level security;

create table if not exists eve_pr3.gap_record (
  gap_id text not null,
  object_run_id text not null,
  gap_type text not null,
  target_ref text not null,
  severity text,
  reason text not null,
  owner text not null,
  reentry_target text,
  dependent_set text,
  state text not null,
  created_at timestamptz not null,
  resolved_at timestamptz,
  primary key (gap_id),
  unique (object_run_id, gap_type, target_ref, created_at)
);
alter table eve_pr3.gap_record enable row level security;
alter table eve_pr3.gap_record force row level security;

create table if not exists eve_pr3.readiness_decision (
  readiness_decision_id text not null,
  object_run_id text not null,
  consumer_id text not null,
  input_package_id text not null,
  input_package_revision bigint not null,
  outcome text not null,
  restrictions jsonb not null,
  gap_refs jsonb not null,
  evidence_refs jsonb,
  rule_ref text not null,
  decided_at timestamptz not null,
  primary key (readiness_decision_id),
  unique (object_run_id, consumer_id, input_package_id, input_package_revision, rule_ref, decided_at)
);
alter table eve_pr3.readiness_decision enable row level security;
alter table eve_pr3.readiness_decision force row level security;

create table if not exists eve_pr3.a_i_operation (
  ai_operation_id text not null,
  object_run_id text not null,
  interaction_key text not null,
  operation text not null,
  profile_ref text not null,
  intent_ref text not null,
  context_revision text not null,
  context_sources jsonb not null,
  generator_ref text not null,
  status text not null,
  requested_at timestamptz not null,
  primary key (ai_operation_id),
  unique (object_run_id, interaction_key, operation, profile_ref, intent_ref, context_revision, context_sources, requested_at)
);
alter table eve_pr3.a_i_operation enable row level security;
alter table eve_pr3.a_i_operation force row level security;

create table if not exists eve_pr3.a_i_proposal (
  proposal_id text not null,
  ai_operation_id text not null,
  request_id text not null,
  interaction_key text not null,
  context_revision text not null,
  action text not null,
  payload jsonb not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  model_ref text not null,
  review_state text not null,
  created_at timestamptz not null,
  primary key (proposal_id),
  unique (ai_operation_id, request_id, action, payload_sha256)
);
alter table eve_pr3.a_i_proposal enable row level security;
alter table eve_pr3.a_i_proposal force row level security;

create table if not exists eve_pr3.evaluator_authority (
  evaluator_authority_id text not null,
  revision text not null,
  approval_authority text not null,
  reviewer_identity text not null,
  reviewer_type text not null,
  reviewer_version text not null,
  qualified_scope jsonb not null,
  criterion_ids jsonb not null,
  interaction_classes jsonb not null,
  risk_classes jsonb not null,
  independence_class text not null,
  generator_compatibility jsonb not null,
  valid_from timestamptz not null,
  expires_at timestamptz not null,
  status text not null,
  restrictions jsonb not null,
  successor_authority_ref text,
  primary key (evaluator_authority_id, revision)
);
alter table eve_pr3.evaluator_authority enable row level security;
alter table eve_pr3.evaluator_authority force row level security;

create table if not exists eve_pr3.evaluation_record (
  evaluation_record_id text not null,
  object_run_id text not null,
  proposal_id text not null,
  evaluator_authority_id text not null,
  reviewer_identity text not null,
  reviewer_version text not null,
  criterion_results jsonb not null,
  aggregate_result text not null,
  context_revision text not null,
  created_at timestamptz not null,
  primary key (evaluation_record_id),
  unique (object_run_id, proposal_id, evaluator_authority_id, context_revision, created_at)
);
alter table eve_pr3.evaluation_record enable row level security;
alter table eve_pr3.evaluation_record force row level security;

create table if not exists eve_pr3.admission_decision (
  admission_decision_id text not null,
  object_run_id text not null,
  proposal_id text not null,
  evaluation_record_id text not null,
  evaluator_authority_id text not null,
  decision text not null,
  reason text not null,
  target_ids jsonb not null,
  context_revision text not null,
  idempotency_key text not null,
  created_at timestamptz not null,
  primary key (admission_decision_id),
  unique (object_run_id, proposal_id, evaluation_record_id, evaluator_authority_id, context_revision, idempotency_key)
);
alter table eve_pr3.admission_decision enable row level security;
alter table eve_pr3.admission_decision force row level security;

create table if not exists eve_pr3.human_decision (
  human_decision_id text not null,
  object_run_id text not null,
  authority_ref text not null,
  decision_scope text not null,
  decision text not null,
  reason text not null,
  target_refs jsonb not null,
  context_revision text not null,
  decided_at timestamptz not null,
  primary key (human_decision_id),
  unique (object_run_id, authority_ref, decision_scope, target_refs, context_revision, decided_at)
);
alter table eve_pr3.human_decision enable row level security;
alter table eve_pr3.human_decision force row level security;

create table if not exists eve_pr3.material_package (
  material_package_id text not null,
  package_type text not null,
  package_revision bigint not null,
  producer_object_run_id text not null,
  consumer_object_key text not null,
  binding_id text not null,
  contract_set_id text not null,
  payload jsonb not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  source_package_refs jsonb,
  restrictions jsonb not null,
  released_at timestamptz,
  primary key (material_package_id),
  unique (producer_object_run_id, package_type, package_revision, binding_id, payload_sha256)
);
alter table eve_pr3.material_package enable row level security;
alter table eve_pr3.material_package force row level security;

create table if not exists eve_pr3.handoff_event (
  handoff_event_id text not null,
  material_package_id text not null,
  event_type text not null,
  producer_object_run_id text not null,
  consumer_object_run_id text,
  consumer_object_key text not null,
  binding_id text not null,
  idempotency_key text not null,
  event_state text not null,
  event_at timestamptz not null,
  primary key (handoff_event_id),
  unique (material_package_id, event_type, consumer_object_key),
  check (event_type in ('RELEASE','RECEIPT','CONSUMPTION'))
);
alter table eve_pr3.handoff_event enable row level security;
alter table eve_pr3.handoff_event force row level security;

create table if not exists eve_pr3.audit_event (
  audit_event_id text not null,
  chain_run_id text not null,
  object_run_id text,
  event_type text not null,
  entity_ref text not null,
  rule_ref text,
  prior_state_ref text,
  new_state_ref text,
  reason text,
  details jsonb,
  event_at timestamptz not null,
  primary key (audit_event_id),
  unique (chain_run_id, object_run_id, event_type, entity_ref, rule_ref, prior_state_ref, new_state_ref, event_at)
);
alter table eve_pr3.audit_event enable row level security;
alter table eve_pr3.audit_event force row level security;

create table if not exists eve_pr3.command_receipt (
  command_receipt_id text not null,
  operation text not null,
  command_scope_ref text not null,
  command_event_id text not null,
  client_event_id text,
  token_request_id text,
  idempotency_key text not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  receipt_state text not null,
  chain_run_id text,
  object_run_id text,
  interaction_key text,
  context_revision text,
  replay_of_receipt_id text,
  result_payload_json jsonb,
  result_payload_sha256 text check (result_payload_sha256 ~ '^[0-9a-f]{64}$'),
  side_effect_refs jsonb not null,
  error_code text,
  server_time timestamptz not null,
  primary key (command_receipt_id),
  unique (operation, command_scope_ref, command_event_id),
  unique (idempotency_key),
  check (receipt_state in ('ACCEPTED','REJECTED_PRECONDITION'))
);
alter table eve_pr3.command_receipt enable row level security;
alter table eve_pr3.command_receipt force row level security;

create table if not exists eve_pr3.outbox_event (
  outbox_event_id text not null,
  chain_run_id text not null,
  event_class text not null,
  aggregate_ref text not null,
  payload_ref text not null,
  idempotency_key text not null,
  delivery_state text not null,
  attempt_count bigint not null,
  next_attempt_at timestamptz,
  created_at timestamptz not null,
  primary key (outbox_event_id),
  unique (chain_run_id, idempotency_key)
);
alter table eve_pr3.outbox_event enable row level security;
alter table eve_pr3.outbox_event force row level security;

create table if not exists eve_pr3.pilot_observation (
  pilot_observation_id text not null,
  chain_run_id text not null,
  object_run_id text,
  observation_type text not null,
  metric_or_fact jsonb not null,
  source_ref text not null,
  recorded_at timestamptz not null,
  primary key (pilot_observation_id),
  unique (chain_run_id, object_run_id, observation_type, source_ref, recorded_at)
);
alter table eve_pr3.pilot_observation enable row level security;
alter table eve_pr3.pilot_observation force row level security;

alter table eve_pr3.object_run drop constraint if exists fk_object_run_chain_run_id;
alter table eve_pr3.object_run add constraint fk_object_run_chain_run_id foreign key (chain_run_id) references eve_pr3.chain_run(chain_run_id) deferrable initially deferred;
alter table eve_pr3.interaction_instance drop constraint if exists fk_interaction_instance_object_run_id;
alter table eve_pr3.interaction_instance add constraint fk_interaction_instance_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.presentation_event drop constraint if exists fk_presentation_event_object_run_id;
alter table eve_pr3.presentation_event add constraint fk_presentation_event_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.presentation_event drop constraint if exists fk_presentation_event_interaction_key;
alter table eve_pr3.presentation_event add constraint fk_presentation_event_interaction_key foreign key (interaction_key) references eve_pr3.interaction_instance(interaction_key) deferrable initially deferred;
alter table eve_pr3.response_event drop constraint if exists fk_response_event_object_run_id;
alter table eve_pr3.response_event add constraint fk_response_event_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.response_event drop constraint if exists fk_response_event_interaction_key;
alter table eve_pr3.response_event add constraint fk_response_event_interaction_key foreign key (interaction_key) references eve_pr3.interaction_instance(interaction_key) deferrable initially deferred;
alter table eve_pr3.evidence_item drop constraint if exists fk_evidence_item_object_run_id;
alter table eve_pr3.evidence_item add constraint fk_evidence_item_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.evidence_item drop constraint if exists fk_evidence_item_response_key;
alter table eve_pr3.evidence_item add constraint fk_evidence_item_response_key foreign key (response_key) references eve_pr3.response_event(response_key) deferrable initially deferred;
alter table eve_pr3.canonical_variable_record drop constraint if exists fk_canonical_variable_record_object_run_id;
alter table eve_pr3.canonical_variable_record add constraint fk_canonical_variable_record_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.candidate_record drop constraint if exists fk_candidate_record_object_run_id;
alter table eve_pr3.candidate_record add constraint fk_candidate_record_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.branch_decision drop constraint if exists fk_branch_decision_object_run_id;
alter table eve_pr3.branch_decision add constraint fk_branch_decision_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.budget_ledger drop constraint if exists fk_budget_ledger_object_run_id;
alter table eve_pr3.budget_ledger add constraint fk_budget_ledger_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.gap_record drop constraint if exists fk_gap_record_object_run_id;
alter table eve_pr3.gap_record add constraint fk_gap_record_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.readiness_decision drop constraint if exists fk_readiness_decision_object_run_id;
alter table eve_pr3.readiness_decision add constraint fk_readiness_decision_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.a_i_operation drop constraint if exists fk_a_i_operation_object_run_id;
alter table eve_pr3.a_i_operation add constraint fk_a_i_operation_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.a_i_proposal drop constraint if exists fk_a_i_proposal_ai_operation_id;
alter table eve_pr3.a_i_proposal add constraint fk_a_i_proposal_ai_operation_id foreign key (ai_operation_id) references eve_pr3.a_i_operation(ai_operation_id) deferrable initially deferred;
alter table eve_pr3.evaluation_record drop constraint if exists fk_evaluation_record_object_run_id;
alter table eve_pr3.evaluation_record add constraint fk_evaluation_record_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.evaluation_record drop constraint if exists fk_evaluation_record_proposal_id;
alter table eve_pr3.evaluation_record add constraint fk_evaluation_record_proposal_id foreign key (proposal_id) references eve_pr3.a_i_proposal(proposal_id) deferrable initially deferred;
alter table eve_pr3.admission_decision drop constraint if exists fk_admission_decision_object_run_id;
alter table eve_pr3.admission_decision add constraint fk_admission_decision_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.admission_decision drop constraint if exists fk_admission_decision_proposal_id;
alter table eve_pr3.admission_decision add constraint fk_admission_decision_proposal_id foreign key (proposal_id) references eve_pr3.a_i_proposal(proposal_id) deferrable initially deferred;
alter table eve_pr3.admission_decision drop constraint if exists fk_admission_decision_evaluation_record_id;
alter table eve_pr3.admission_decision add constraint fk_admission_decision_evaluation_record_id foreign key (evaluation_record_id) references eve_pr3.evaluation_record(evaluation_record_id) deferrable initially deferred;
alter table eve_pr3.human_decision drop constraint if exists fk_human_decision_object_run_id;
alter table eve_pr3.human_decision add constraint fk_human_decision_object_run_id foreign key (object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.material_package drop constraint if exists fk_material_package_producer_object_run_id;
alter table eve_pr3.material_package add constraint fk_material_package_producer_object_run_id foreign key (producer_object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.handoff_event drop constraint if exists fk_handoff_event_material_package_id;
alter table eve_pr3.handoff_event add constraint fk_handoff_event_material_package_id foreign key (material_package_id) references eve_pr3.material_package(material_package_id) deferrable initially deferred;
alter table eve_pr3.handoff_event drop constraint if exists fk_handoff_event_producer_object_run_id;
alter table eve_pr3.handoff_event add constraint fk_handoff_event_producer_object_run_id foreign key (producer_object_run_id) references eve_pr3.object_run(object_run_id) deferrable initially deferred;
alter table eve_pr3.audit_event drop constraint if exists fk_audit_event_chain_run_id;
alter table eve_pr3.audit_event add constraint fk_audit_event_chain_run_id foreign key (chain_run_id) references eve_pr3.chain_run(chain_run_id) deferrable initially deferred;
alter table eve_pr3.command_receipt drop constraint if exists fk_command_receipt_chain_run_id;
alter table eve_pr3.command_receipt add constraint fk_command_receipt_chain_run_id foreign key (chain_run_id) references eve_pr3.chain_run(chain_run_id) deferrable initially deferred;
alter table eve_pr3.outbox_event drop constraint if exists fk_outbox_event_chain_run_id;
alter table eve_pr3.outbox_event add constraint fk_outbox_event_chain_run_id foreign key (chain_run_id) references eve_pr3.chain_run(chain_run_id) deferrable initially deferred;
alter table eve_pr3.pilot_observation drop constraint if exists fk_pilot_observation_chain_run_id;
alter table eve_pr3.pilot_observation add constraint fk_pilot_observation_chain_run_id foreign key (chain_run_id) references eve_pr3.chain_run(chain_run_id) deferrable initially deferred;

create index if not exists idx_chain_run_case_id_participant_id_role_id_activity_id_st on eve_pr3.chain_run (case_id, participant_id, role_id, activity_id, state);
create index if not exists idx_object_run_chain_run_id_object_key_state on eve_pr3.object_run (chain_run_id, object_key, state);
create index if not exists idx_interaction_instance_object_run_id_state_opening_ordinal on eve_pr3.interaction_instance (object_run_id, state, opening_ordinal);
create index if not exists idx_response_event_object_run_id_interaction_key_subfield_id_res on eve_pr3.response_event (object_run_id, interaction_key, subfield_id, response_revision);
create index if not exists idx_canonical_variable_record_object_run_id_variable_id_revision on eve_pr3.canonical_variable_record (object_run_id, variable_id, revision);
create index if not exists idx_gap_record_object_run_id_state_gap_type on eve_pr3.gap_record (object_run_id, state, gap_type);
create index if not exists idx_readiness_decision_object_run_id_consumer_id_decided_at on eve_pr3.readiness_decision (object_run_id, consumer_id, decided_at);
create index if not exists idx_handoff_event_material_package_id_event_type_event_at on eve_pr3.handoff_event (material_package_id, event_type, event_at);
create index if not exists idx_audit_event_chain_run_id_event_at on eve_pr3.audit_event (chain_run_id, event_at);
create index if not exists idx_command_receipt_command_event_id_operation on eve_pr3.command_receipt (command_event_id, operation);
create index if not exists idx_outbox_event_delivery_state_next_attempt_at on eve_pr3.outbox_event (delivery_state, next_attempt_at);

revoke all on schema eve_pr3 from public;
do $$ begin if exists (select 1 from pg_roles where rolname='anon') then revoke all on all tables in schema eve_pr3 from anon; end if; end $$;
do $$ begin if exists (select 1 from pg_roles where rolname='authenticated') then revoke all on all tables in schema eve_pr3 from authenticated; end if; end $$;
do $$ begin if exists (select 1 from pg_roles where rolname='service_role') then grant usage on schema eve_pr3 to service_role; grant select,insert,update,delete on all tables in schema eve_pr3 to service_role; end if; end $$;