create table if not exists activity_structural_scores (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  actividad_id uuid not null references actividades(id) on delete cascade,
  total_score integer not null,
  max_score integer not null,
  coverage_ratio numeric not null,
  dimension_scores_json jsonb not null,
  detected_signals_json jsonb not null,
  selection_recommendation text not null check (
    selection_recommendation in ('primary_candidate', 'support_pool')
  ),
  rationale_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actividad_id)
);

create table if not exists activity_canonical_profiles (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  actividad_id uuid not null references actividades(id) on delete cascade,
  profile_json jsonb not null,
  extraction_version text not null default 'architecture_v01',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actividad_id, extraction_version)
);

create table if not exists triangulation_results (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  actividad_id uuid references actividades(id) on delete cascade,
  rule_code text not null,
  confidence numeric not null,
  result_json jsonb not null,
  source_questions_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists closure_results (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  actividad_id uuid references actividades(id) on delete cascade,
  closure_scope text not null check (closure_scope in ('activity', 'role')),
  closure_status text not null check (
    closure_status in ('closed', 'partial', 'gap_requires_support')
  ),
  closure_confidence numeric not null default 0,
  result_json jsonb not null,
  engine_version text not null default 'architecture_v01',
  created_at timestamptz not null default now()
);

create table if not exists support_activity_requests (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  required boolean not null default true,
  activity_type_needed text not null,
  reason text not null,
  status text not null default 'pending' check (
    status in ('pending', 'fulfilled', 'dismissed')
  ),
  source_closure_result_id uuid references closure_results(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_activity_structural_scores_sesion
  on activity_structural_scores(sesion_id, selection_recommendation);

create index if not exists idx_activity_canonical_profiles_sesion
  on activity_canonical_profiles(sesion_id);

create index if not exists idx_triangulation_results_sesion
  on triangulation_results(sesion_id, rule_code);

create index if not exists idx_closure_results_sesion
  on closure_results(sesion_id, closure_scope, closure_status);

create index if not exists idx_support_activity_requests_sesion
  on support_activity_requests(sesion_id, status);
