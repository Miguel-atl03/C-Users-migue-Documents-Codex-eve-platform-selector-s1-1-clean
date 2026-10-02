-- Capa 2 MVP causal persistence contract.
-- This file prepares storage for auditable causal outputs without forcing the
-- runtime route to persist before real-session testing validates the shape.

create table if not exists public.session_causal_outputs (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones_llenado(id) on delete cascade,
  instrument_version text not null default 'CAPA1_V2_1',
  causal_engine_version text not null default 'CAPA2_MVP_V2',
  source_session_intermediate_output_id uuid references public.session_intermediate_output(id) on delete set null,
  output_json jsonb not null,
  root_node_probable_within_mvp_scope text,
  confidence_level text not null,
  needs_reentry boolean not null default false,
  needs_expert_review boolean not null default false,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_session_causal_outputs_sesion_id
  on public.session_causal_outputs(sesion_id);

create index if not exists idx_session_causal_outputs_generated_at
  on public.session_causal_outputs(generated_at desc);

create table if not exists public.scene_causal_activations (
  id uuid primary key default gen_random_uuid(),
  session_causal_output_id uuid not null references public.session_causal_outputs(id) on delete cascade,
  sesion_id uuid not null references public.sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references public.scene_registry(id) on delete cascade,
  canonical_record_id uuid references public.scene_canonical_records(id) on delete set null,
  node_code_canonical text not null,
  node_name_canonical text not null,
  node_name_commercial text,
  activation_json jsonb not null,
  confidence_level text not null,
  confidence_components jsonb not null,
  reentry_reason_codes text[] not null default '{}',
  expert_review_reason_codes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_scene_causal_activations_session_output
  on public.scene_causal_activations(session_causal_output_id);

create index if not exists idx_scene_causal_activations_scene_node
  on public.scene_causal_activations(scene_id, node_code_canonical);

create table if not exists public.causal_rule_executions (
  id uuid primary key default gen_random_uuid(),
  session_causal_output_id uuid not null references public.session_causal_outputs(id) on delete cascade,
  sesion_id uuid not null references public.sesiones_llenado(id) on delete cascade,
  scene_id uuid references public.scene_registry(id) on delete cascade,
  rule_id text not null,
  node_code_canonical text not null,
  evidence_bundle_id text not null,
  evidence_bundle_json jsonb not null,
  activated boolean not null default false,
  confidence_level text not null,
  confidence_components jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_causal_rule_executions_session_output
  on public.causal_rule_executions(session_causal_output_id);

create index if not exists idx_causal_rule_executions_rule
  on public.causal_rule_executions(rule_id, node_code_canonical);
