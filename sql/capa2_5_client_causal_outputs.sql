-- Capa 2.5 MVP client-level causal aggregation persistence contract.
-- This layer aggregates already-produced Capa 2 session causal outputs by empresa_id.
-- It does not read raw questionnaire answers and does not produce final expert judgment.

create table if not exists public.client_causal_aggregation_runs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  aggregation_schema_version text not null default 'capa2_5_client_causal_aggregation_mvp_v1',
  causal_engine_version text not null default 'CAPA2_5_CLIENT_MVP_V1',
  source_session_causal_output_ids uuid[] not null default '{}',
  source_sesion_ids uuid[] not null default '{}',
  session_count integer not null default 0,
  run_status text not null default 'completed' check (
    run_status in ('completed', 'completed_with_flags', 'failed')
  ),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_client_causal_aggregation_runs_empresa_id
  on public.client_causal_aggregation_runs(empresa_id, generated_at desc);

create table if not exists public.client_causal_outputs (
  id uuid primary key default gen_random_uuid(),
  aggregation_run_id uuid not null references public.client_causal_aggregation_runs(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  output_json jsonb not null,
  client_root_node_probable text,
  confidence_level_client text not null,
  needs_reentry_client boolean not null default false,
  needs_expert_review_client boolean not null default true,
  preliminary_client_narrative text,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_causal_outputs_empresa_id
  on public.client_causal_outputs(empresa_id, generated_at desc);

create table if not exists public.client_node_aggregation (
  id uuid primary key default gen_random_uuid(),
  aggregation_run_id uuid not null references public.client_causal_aggregation_runs(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  node_code_canonical text not null,
  node_name_canonical text not null,
  aggregation_kind text not null check (
    aggregation_kind in (
      'recurrent',
      'local',
      'dominant_transversal',
      'contradictory',
      'recursive_echo',
      'symptom_transversal'
    )
  ),
  session_count_supporting integer not null default 0,
  session_count_weakening integer not null default 0,
  session_coverage_ratio numeric not null default 0,
  weighted_support_score numeric not null default 0,
  weighted_weaken_score numeric not null default 0,
  average_confidence_score numeric not null default 0,
  confidence_level text not null,
  dominant_session_ids uuid[] not null default '{}',
  local_session_ids uuid[] not null default '{}',
  evidence_bundle_ids text[] not null default '{}',
  aggregation_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_node_aggregation_run
  on public.client_node_aggregation(aggregation_run_id);

create index if not exists idx_client_node_aggregation_node
  on public.client_node_aggregation(empresa_id, node_code_canonical);

create table if not exists public.client_contradiction_map (
  id uuid primary key default gen_random_uuid(),
  aggregation_run_id uuid not null references public.client_causal_aggregation_runs(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  contradiction_type text not null check (
    contradiction_type in (
      'root_split',
      'support_vs_weaken',
      'confidence_mismatch',
      'local_vs_transversal',
      'symptom_vs_root'
    )
  ),
  node_codes text[] not null default '{}',
  supporting_session_ids uuid[] not null default '{}',
  weakening_session_ids uuid[] not null default '{}',
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  requires_expert_review boolean not null default true,
  contradiction_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_contradiction_map_run
  on public.client_contradiction_map(aggregation_run_id);

create index if not exists idx_client_contradiction_map_empresa
  on public.client_contradiction_map(empresa_id, severity);
