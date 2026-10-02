-- Runtime manifest contract migration for Capa 1 v2.1.
-- Safe to run on an existing eve-platform database.
-- It only adds missing contract fields, constraints, indexes, and the bundles table.

begin;

alter table scene_question_answers
  add column if not exists original_answer_id uuid references scene_question_answers(id) on delete set null,
  add column if not exists clarification_answer_id uuid references scene_question_answers(id) on delete set null,
  add column if not exists consolidated_value jsonb,
  add column if not exists provenance_chain jsonb not null default '[]'::jsonb,
  add column if not exists readiness_json jsonb not null default '{}'::jsonb,
  add column if not exists confidence_json jsonb not null default '{}'::jsonb,
  add column if not exists flags_json jsonb not null default '[]'::jsonb,
  add column if not exists bundles_json jsonb not null default '{}'::jsonb;

alter table scene_light_inferences
  add column if not exists preclassification_ahe_note text,
  add column if not exists preclassification_ahe_level_dominant text,
  add column if not exists preclassification_interpersonal_signal text,
  add column if not exists preclassification_interpersonal_note text,
  add column if not exists preclassification_ahe_bundle_refined jsonb not null default '{}'::jsonb,
  add column if not exists questions_triggered text[] not null default '{}'::text[],
  add column if not exists preclassification_gap_flag boolean not null default false,
  add column if not exists user_clarification text,
  add column if not exists preclassification_readiness text not null default 'insufficient_evidence';

update scene_light_inferences
set preclassification_readiness = case preclassification_readiness
  when 'ready_with_microconfirmations' then 'needs_micro_confirmation'
  when 'needs_review' then 'needs_manual_review'
  else preclassification_readiness
end
where preclassification_readiness in ('ready_with_microconfirmations', 'needs_review');

alter table scene_light_inferences
  drop constraint if exists scene_light_inferences_preclassification_readiness_check;

do $$
begin
  alter table scene_light_inferences
    add constraint scene_light_inferences_preclassification_readiness_check
    check (
      preclassification_readiness in (
        'ready_for_transduction',
        'needs_micro_confirmation',
        'needs_support_reentry',
        'needs_manual_review',
        'insufficient_evidence'
      )
    );
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scene_light_inferences_ahe_level_check'
  ) then
    alter table scene_light_inferences
      add constraint scene_light_inferences_ahe_level_check
      check (
        preclassification_ahe_level_dominant is null or
        preclassification_ahe_level_dominant in (
          'intrapersonal',
          'interpersonal',
          'organizational',
          'mixed',
          'uncertain'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scene_light_inferences_interpersonal_signal_check'
  ) then
    alter table scene_light_inferences
      add constraint scene_light_inferences_interpersonal_signal_check
      check (
        preclassification_interpersonal_signal is null or
        preclassification_interpersonal_signal in (
          'pursuit',
          'insistence',
          'informal_support',
          'load_bounce',
          'relational_buffering',
          'cross_area_friction',
          'mixed',
          'uncertain'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scene_light_inferences_confidence_score_0_100_check'
  ) then
    alter table scene_light_inferences
      add constraint scene_light_inferences_confidence_score_0_100_check
      check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100));
  end if;
end $$;

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

create index if not exists idx_scene_answer_bundles_sesion
  on scene_answer_bundles(sesion_id, scene_id, bundle_type);

create index if not exists idx_scene_question_answers_contract_trace
  on scene_question_answers(scene_id, instrument_version, original_answer_id, clarification_answer_id);

comment on column scene_question_answers.original_answer_id is
  'Contract field: preserves the original answer separately from clarifications.';

comment on column scene_question_answers.clarification_answer_id is
  'Contract field: links the clarification answer without overwriting the original answer.';

comment on column scene_question_answers.consolidated_value is
  'Contract field: stores consolidated value; this is not Capa 2.';

comment on column scene_question_answers.provenance_chain is
  'Contract field: auditable chain from original answer through clarification and consolidation.';

comment on column scene_light_inferences.preclassification_readiness is
  'Block 7 readiness state; separate from confidence and classification.';

comment on table scene_answer_bundles is
  'Structured Capa 1 runtime bundles. evidence_bundle_for_transduction is not Capa 2.';

commit;
