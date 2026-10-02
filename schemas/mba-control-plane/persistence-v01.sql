create extension if not exists pgcrypto;

create table if not exists mba_event_ledger (
  event_id uuid primary key,
  event_type text not null,
  emitted_by text not null,
  received_by text not null,
  object_type text not null,
  object_id text not null,
  previous_state text not null,
  target_state text not null,
  timestamp timestamptz not null,
  technical_actor text not null,
  correlation_id text,
  case_id text,
  operation text,
  responsible_process text,
  legacy_event_type text,
  legacy_previous_state text,
  legacy_target_state text,
  governance_mode text not null default 'shadow_mode',
  warnings jsonb not null default '[]'::jsonb,
  nonconformances jsonb not null default '[]'::jsonb,
  source_adapter text,
  session_id text,
  payload jsonb not null default '{}'::jsonb,
  validation_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table mba_event_ledger add column if not exists legacy_event_type text;
alter table mba_event_ledger add column if not exists legacy_previous_state text;
alter table mba_event_ledger add column if not exists legacy_target_state text;
alter table mba_event_ledger add column if not exists governance_mode text not null default 'shadow_mode';
alter table mba_event_ledger add column if not exists warnings jsonb not null default '[]'::jsonb;
alter table mba_event_ledger add column if not exists nonconformances jsonb not null default '[]'::jsonb;
alter table mba_event_ledger add column if not exists source_adapter text;
alter table mba_event_ledger add column if not exists session_id text;

create table if not exists mba_object_state_snapshots (
  object_type text not null,
  object_id text not null,
  case_id text,
  current_state text not null,
  updated_at timestamptz not null,
  last_event_id uuid references mba_event_ledger(event_id),
  last_validation_status text not null,
  primary key (object_type, object_id)
);

create table if not exists mba_domain_state_observations (
  observation_id uuid primary key default gen_random_uuid(),
  case_id text,
  session_id text,
  object_type text not null,
  object_id text not null,
  observed_state text not null,
  source_adapter text,
  source_artifact text,
  observed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create table if not exists mba_transition_findings (
  finding_id uuid primary key default gen_random_uuid(),
  event_id uuid references mba_event_ledger(event_id),
  case_id text,
  session_id text,
  object_type text not null,
  object_id text not null,
  rule_id text not null,
  severity text not null,
  description text not null,
  action text not null,
  detail text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists mba_legacy_mappings (
  mapping_id uuid primary key default gen_random_uuid(),
  mapping_type text not null check (mapping_type in ('event', 'state')),
  object_type text,
  legacy_name text not null,
  mba_canonical_name text not null,
  source_adapter text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (mapping_type, object_type, legacy_name, mba_canonical_name)
);

create table if not exists mba_timer_ledger (
  timer_id uuid primary key,
  timer_name text not null,
  process_state text not null,
  started_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null,
  exit_applied text not null,
  case_id text,
  session_id text,
  object_type text not null,
  object_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists mba_compliance_reports (
  report_id text primary key,
  case_id text,
  session_id text,
  generated_at timestamptz not null,
  operation_mode text not null,
  report_json jsonb not null,
  created_at timestamptz not null default now()
);

alter table mba_transition_findings add column if not exists session_id text;
alter table mba_timer_ledger add column if not exists session_id text;
alter table mba_compliance_reports add column if not exists session_id text;

create index if not exists idx_mba_event_ledger_case_id on mba_event_ledger(case_id);
create index if not exists idx_mba_event_ledger_session_id on mba_event_ledger(session_id);
create index if not exists idx_mba_event_ledger_correlation_id on mba_event_ledger(correlation_id);
create index if not exists idx_mba_event_ledger_event_type on mba_event_ledger(event_type);
create index if not exists idx_mba_event_ledger_object_type on mba_event_ledger(object_type);
create index if not exists idx_mba_event_ledger_created_at on mba_event_ledger(created_at);
create index if not exists idx_mba_timer_ledger_case_id on mba_timer_ledger(case_id);
create index if not exists idx_mba_timer_ledger_session_id on mba_timer_ledger(session_id);
create index if not exists idx_mba_timer_ledger_object_type on mba_timer_ledger(object_type);
create index if not exists idx_mba_timer_ledger_created_at on mba_timer_ledger(created_at);
create index if not exists idx_mba_object_state_snapshots_case_id on mba_object_state_snapshots(case_id);
create index if not exists idx_mba_domain_state_observations_case_id on mba_domain_state_observations(case_id);
create index if not exists idx_mba_domain_state_observations_session_id on mba_domain_state_observations(session_id);
create index if not exists idx_mba_domain_state_observations_object_type on mba_domain_state_observations(object_type);
create index if not exists idx_mba_transition_findings_case_id on mba_transition_findings(case_id);
create index if not exists idx_mba_transition_findings_session_id on mba_transition_findings(session_id);
create index if not exists idx_mba_transition_findings_rule_id on mba_transition_findings(rule_id);
create index if not exists idx_mba_transition_findings_created_at on mba_transition_findings(created_at);
create index if not exists idx_mba_compliance_reports_case_id on mba_compliance_reports(case_id);
create index if not exists idx_mba_compliance_reports_session_id on mba_compliance_reports(session_id);
create index if not exists idx_mba_compliance_reports_created_at on mba_compliance_reports(created_at);
create index if not exists idx_mba_legacy_mappings_legacy_name on mba_legacy_mappings(legacy_name);
create index if not exists idx_mba_legacy_mappings_canonical_name on mba_legacy_mappings(mba_canonical_name);

comment on table mba_event_ledger is
  'MBA Control Plane shadow ledger. Payloads must keep references and summaries only; do not duplicate full evidence bodies.';
comment on table mba_compliance_reports is
  'MBA Control Plane compliance reports generated in shadow_mode for operational validation.';
