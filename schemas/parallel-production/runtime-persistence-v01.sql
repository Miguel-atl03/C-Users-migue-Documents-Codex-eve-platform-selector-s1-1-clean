create table if not exists public.parallel_production_runtime_artifacts (
  artifact_id text primary key,
  artifact_type text not null,
  artifact_status text not null,
  case_id text null,
  session_id uuid null,
  correlation_id text null,
  source_artifact_id text null,
  run_id text not null,
  source_step text not null,
  source_adapter text not null default 'parallel_production_runtime',
  warnings jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists parallel_production_runtime_artifacts_uq_step_run
  on public.parallel_production_runtime_artifacts (artifact_type, session_id, run_id);

create index if not exists parallel_production_runtime_artifacts_idx_session
  on public.parallel_production_runtime_artifacts (session_id, created_at desc);

create index if not exists parallel_production_runtime_artifacts_idx_case
  on public.parallel_production_runtime_artifacts (case_id, created_at desc);

create index if not exists parallel_production_runtime_artifacts_idx_correlation
  on public.parallel_production_runtime_artifacts (correlation_id, created_at desc);

alter table public.parallel_production_runtime_artifacts enable row level security;
