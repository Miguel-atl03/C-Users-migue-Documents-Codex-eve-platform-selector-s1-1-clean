-- EVE OPTION A SHADOW ONLY OUTBOX MIGRATION FILE CREATION V1
-- Migration file only.
-- Not executed by this step.
-- No credentials created.
-- No observer created.
-- No bridge created.
-- No real observation authorized.
-- No Gate 3.
-- No Fase 9.
-- Append-only shadow-only table.
-- No registry/export/diagnosis.

create table if not exists shadow_only_outbox_events (
  outbox_event_id text primary key,
  source_event_id text not null,
  source_system text not null,
  source_environment text not null,
  source_locator text not null,
  emitted_at timestamptz not null,
  captured_at timestamptz not null,
  tenant_id text not null,
  session_id text not null,
  activity_id text not null,
  actor_ref text,
  real_client_intent jsonb not null,
  real_tenant_context jsonb not null,
  real_session_context jsonb not null,
  real_activity_context jsonb not null,
  real_runtime_event jsonb not null,
  real_evidence_signal jsonb not null,
  official_outcome jsonb not null,
  provenance jsonb not null,
  source_trace jsonb not null,
  correlation_id text not null,
  idempotency_key text not null,
  official_flow_ref text not null,
  redaction_status text not null,
  data_minimization_attestation boolean not null,
  payload_hash text not null,
  previous_event_hash text,
  checksum_chain_ref text not null,
  replay_ref text not null,
  latency_observation_ref text,
  append_only_attestation boolean not null,
  no_write_attestation boolean not null,
  schema_version text not null,
  contract_version text not null,
  created_at timestamptz not null default now(),
  writer_identity_ref text not null,
  reviewer_identity_ref text,
  governance_review_ref text,
  s3_star_review_ref text,
  event_status text not null,
  constraint shadow_only_outbox_redaction_known check (redaction_status <> 'unknown'),
  constraint shadow_only_outbox_data_minimized check (data_minimization_attestation = true),
  constraint shadow_only_outbox_append_attested check (append_only_attestation = true),
  constraint shadow_only_outbox_no_write_attested check (no_write_attestation = true),
  constraint shadow_only_outbox_status_check check (
    event_status in (
      'accepted_for_shadow_outbox',
      'rejected_missing_context',
      'rejected_missing_provenance',
      'rejected_missing_correlation',
      'rejected_missing_idempotency',
      'rejected_missing_official_outcome',
      'rejected_overcollection_risk',
      'rejected_append_only_attestation_missing',
      'rejected_no_write_attestation_missing',
      'quarantined_no_go'
    )
  )
);

comment on table shadow_only_outbox_events is
  'Shadow-only append-only outbox for future controlled observable event copies. This migration file is not executed by this step and grants no runtime, bridge, registry, export, diagnosis, Gate 3 or Fase 9 authority.';

create index if not exists idx_shadow_outbox_tenant_session_activity
  on shadow_only_outbox_events (tenant_id, session_id, activity_id);

create index if not exists idx_shadow_outbox_correlation_id
  on shadow_only_outbox_events (correlation_id);

create index if not exists idx_shadow_outbox_idempotency_key
  on shadow_only_outbox_events (idempotency_key);

create index if not exists idx_shadow_outbox_official_flow_ref
  on shadow_only_outbox_events (official_flow_ref);

create index if not exists idx_shadow_outbox_source_event_id
  on shadow_only_outbox_events (source_event_id);

create index if not exists idx_shadow_outbox_captured_at
  on shadow_only_outbox_events (captured_at);

create index if not exists idx_shadow_outbox_event_status
  on shadow_only_outbox_events (event_status);

create index if not exists idx_shadow_outbox_checksum_chain_ref
  on shadow_only_outbox_events (checksum_chain_ref);

create index if not exists idx_shadow_outbox_replay_ref
  on shadow_only_outbox_events (replay_ref);

create or replace function shadow_only_outbox_block_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'shadow_only_outbox_events is append-only; destructive mutation is forbidden';
end;
$$;

drop trigger if exists trg_shadow_only_outbox_block_update on shadow_only_outbox_events;
create trigger trg_shadow_only_outbox_block_update
before update on shadow_only_outbox_events
for each row execute function shadow_only_outbox_block_mutation();

drop trigger if exists trg_shadow_only_outbox_block_delete on shadow_only_outbox_events;
create trigger trg_shadow_only_outbox_block_delete
before delete on shadow_only_outbox_events
for each row execute function shadow_only_outbox_block_mutation();

alter table shadow_only_outbox_events enable row level security;
alter table shadow_only_outbox_events force row level security;

-- Fail-closed RLS/read boundary:
-- No permissive read/write policies are created here.
-- No broad grants are created here.
-- Reader/writer policies require separate future approval.
