create table if not exists scene_registry (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  legacy_actividad_id uuid references actividades(id) on delete set null,
  scene_name text not null,
  scene_rank integer,
  depth_level text not null default 'A_core' check (
    depth_level in ('A_core', 'B_abbreviated', 'C_support_reentry')
  ),
  scene_status text not null default 'scene_intake' check (
    scene_status in (
      'scene_intake',
      'scene_prioritized',
      'scene_capture_core',
      'scene_capture_capacity',
      'scene_capture_compensation',
      'scene_light_preclassification',
      'scene_micro_confirmation',
      'scene_consistency_check',
      'scene_support_reentry',
      'scene_canonical_consolidation',
      'scene_ready_for_transduction'
    )
  ),
  source text not null default 'activity_migration',
  original_text text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sesion_id, legacy_actividad_id)
);

create table if not exists scene_question_answers (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  instrument_version text not null default 'CAPA1_V2_1',
  block_id text not null,
  question_code text not null,
  subquestion_code text not null default '',
  answer_nature text not null default 'captured' check (
    answer_nature in (
      'captured',
      'normalized',
      'derived',
      'computed',
      'clarification',
      'inferred',
      'state_metadata'
    )
  ),
  answer_type text not null,
  selected_value text,
  selected_values text[],
  free_text text,
  answer_json jsonb,
  original_answer_id uuid references scene_question_answers(id) on delete set null,
  clarification_answer_id uuid references scene_question_answers(id) on delete set null,
  consolidated_value jsonb,
  provenance_chain jsonb not null default '[]'::jsonb,
  readiness_json jsonb not null default '{}'::jsonb,
  confidence_json jsonb not null default '{}'::jsonb,
  flags_json jsonb not null default '[]'::jsonb,
  bundles_json jsonb not null default '{}'::jsonb,
  is_user_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scene_answer_provenance (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  answer_id uuid references scene_question_answers(id) on delete cascade,
  provenance_type text not null check (
    provenance_type in (
      'captured',
      'normalized',
      'transduced_from_open_text',
      'derived',
      'computed',
      'clarification',
      'inferred',
      'state_metadata'
    )
  ),
  source_field text,
  source_text text,
  normalization_reason text,
  confidence numeric,
  created_by text not null default 'system',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists scene_block_derivations (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  instrument_version text not null default 'CAPA1_V2_1',
  block_id text not null,
  derivation_key text not null,
  derivation_value jsonb not null,
  evidence_answer_ids uuid[] not null default '{}'::uuid[],
  confidence numeric,
  derivation_version text not null default 'capa1_v2_1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scene_id, instrument_version, block_id, derivation_key)
);

create table if not exists scene_consistency_flags (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  flag_type text not null,
  severity text not null default 'medium' check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  description text not null,
  evidence_answer_ids uuid[] not null default '{}'::uuid[],
  requires_clarification boolean not null default false,
  status text not null default 'open' check (
    status in ('open', 'clarification_requested', 'resolved', 'dismissed')
  ),
  resolved_by_clarification_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scene_clarifications (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  flag_id uuid references scene_consistency_flags(id) on delete set null,
  question_code text,
  prompt text not null,
  response_text text,
  clarification_type text not null default 'micro_clarification',
  effect_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table scene_consistency_flags
  drop constraint if exists scene_consistency_flags_resolved_by_clarification_id_fkey;

alter table scene_consistency_flags
  add constraint scene_consistency_flags_resolved_by_clarification_id_fkey
  foreign key (resolved_by_clarification_id)
  references scene_clarifications(id) on delete set null;

create table if not exists scene_light_inferences (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  preclassification_scene_type text,
  preclassification_chain_position text,
  preclassification_vsm_role text,
  preclassification_ahe_signal text,
  preclassification_ahe_note text,
  preclassification_ahe_level_dominant text check (
    preclassification_ahe_level_dominant in ('intrapersonal', 'interpersonal', 'organizational', 'mixed', 'uncertain')
  ),
  preclassification_interpersonal_signal text check (
    preclassification_interpersonal_signal in ('pursuit', 'insistence', 'informal_support', 'load_bounce', 'relational_buffering', 'cross_area_friction', 'mixed', 'uncertain')
  ),
  preclassification_interpersonal_note text,
  preclassification_ahe_bundle_refined jsonb not null default '{}'::jsonb,
  preclassification_mission_suggested text,
  questions_triggered text[] not null default '{}'::text[],
  preclassification_gap_flag boolean not null default false,
  user_clarification text,
  preclassification_readiness text not null default 'insufficient_evidence' check (
    preclassification_readiness in (
      'ready_for_transduction',
      'needs_micro_confirmation',
      'needs_support_reentry',
      'needs_manual_review',
      'insufficient_evidence'
    )
  ),
  confidence_level text check (confidence_level in ('high', 'medium', 'low')),
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 100),
  confidence_reasoning text,
  user_confirmation text,
  user_correction text,
  flagged_for_manual_review boolean not null default false,
  inference_json jsonb not null default '{}'::jsonb,
  inference_version text not null default 'capa1_v2_1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scene_id, inference_version)
);

create table if not exists scene_answer_bundles (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  instrument_version text not null default 'CAPA1_V2_1',
  bundle_type text not null check (
    bundle_type in (
      'compensation_bundle',
      'ahe_observation_bundle',
      'evidence_bundle_for_transduction'
    )
  ),
  source_question_codes text[] not null default '{}'::text[],
  source_answer_ids uuid[] not null default '{}'::uuid[],
  canonical_variables text[] not null default '{}'::text[],
  payload jsonb not null default '{}'::jsonb,
  not_diagnostic boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scene_id, instrument_version, bundle_type)
);

create table if not exists scene_canonical_records (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  scene_id uuid not null references scene_registry(id) on delete cascade,
  instrument_version text not null default 'CAPA1_V2_1',
  canonical_json jsonb not null,
  evidence_answer_ids uuid[] not null default '{}'::uuid[],
  consistency_flag_ids uuid[] not null default '{}'::uuid[],
  readiness_for_transduction text not null default 'not_ready' check (
    readiness_for_transduction in (
      'not_ready',
      'partial',
      'ready_with_flags',
      'ready'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scene_id, instrument_version)
);

create table if not exists session_intermediate_output (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_llenado(id) on delete cascade,
  instrument_version text not null default 'CAPA1_V2_1',
  output_json jsonb not null,
  readiness_for_transduction text not null default 'not_ready' check (
    readiness_for_transduction in (
      'not_ready',
      'partial',
      'ready_with_flags',
      'ready'
    )
  ),
  generated_from_scene_ids uuid[] not null default '{}'::uuid[],
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sesion_id, instrument_version)
);

create index if not exists idx_scene_registry_sesion
  on scene_registry(sesion_id, depth_level, scene_status);

create index if not exists idx_scene_question_answers_sesion
  on scene_question_answers(sesion_id, scene_id, block_id, question_code);

create index if not exists idx_scene_answer_provenance_sesion
  on scene_answer_provenance(sesion_id, scene_id, provenance_type);

create index if not exists idx_scene_block_derivations_sesion
  on scene_block_derivations(sesion_id, scene_id, block_id);

create index if not exists idx_scene_consistency_flags_sesion
  on scene_consistency_flags(sesion_id, scene_id, severity, status);

create index if not exists idx_scene_clarifications_sesion
  on scene_clarifications(sesion_id, scene_id);

create index if not exists idx_scene_light_inferences_sesion
  on scene_light_inferences(sesion_id, scene_id);

create index if not exists idx_scene_answer_bundles_sesion
  on scene_answer_bundles(sesion_id, scene_id, bundle_type);

create index if not exists idx_scene_canonical_records_sesion
  on scene_canonical_records(sesion_id, readiness_for_transduction);

create index if not exists idx_session_intermediate_output_sesion
  on session_intermediate_output(sesion_id, instrument_version);
