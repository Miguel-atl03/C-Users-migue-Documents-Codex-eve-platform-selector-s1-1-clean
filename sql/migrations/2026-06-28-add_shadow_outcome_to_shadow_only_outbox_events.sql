-- EVE migration file only.
-- This file is not executed by this step.
-- No backfill is performed by this file.
-- No DB or Supabase connection is opened by this step.
-- No observer, bridge, registry, export, diagnosis, Gate 3 or Fase 9 authority is created.
-- The table remains shadow-only and append-only under the previously created mutation guard.

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome jsonb;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_provenance jsonb;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_schema_version text;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_generated_at timestamptz;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_producer text;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_checksum text;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_evidence_refs jsonb;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_no_go_flags jsonb;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_readiness text;

alter table shadow_only_outbox_events
  add column if not exists shadow_outcome_source_ref text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shadow_only_outbox_events_shadow_outcome_metadata_check'
      and conrelid = 'shadow_only_outbox_events'::regclass
  ) then
    alter table shadow_only_outbox_events
      add constraint shadow_only_outbox_events_shadow_outcome_metadata_check
      check (
        shadow_outcome is null
        or (
          shadow_outcome_provenance is not null
          and shadow_outcome_schema_version is not null
          and shadow_outcome_generated_at is not null
          and shadow_outcome_producer is not null
          and shadow_outcome_checksum is not null
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shadow_only_outbox_events_shadow_outcome_producer_check'
      and conrelid = 'shadow_only_outbox_events'::regclass
  ) then
    alter table shadow_only_outbox_events
      add constraint shadow_only_outbox_events_shadow_outcome_producer_check
      check (
        shadow_outcome_producer is null
        or shadow_outcome_producer = 'EVE_SHADOW_NON_PRODUCTIVE'
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shadow_only_outbox_events_shadow_outcome_readiness_check'
      and conrelid = 'shadow_only_outbox_events'::regclass
  ) then
    alter table shadow_only_outbox_events
      add constraint shadow_only_outbox_events_shadow_outcome_readiness_check
      check (
        shadow_outcome_readiness is null
        or shadow_outcome_readiness in (
          'not_ready',
          'ready_for_shadow_comparison',
          'quarantined_no_go',
          'requires_s3_star_review',
          'requires_eve08_review'
        )
      );
  end if;
end;
$$;

comment on column shadow_only_outbox_events.shadow_outcome is
  'Exact non-productive shadow result for later comparison with official_outcome. Not derived from official_outcome and not sourced from registry, export, diagnosis, UI, Gate 3, Fase 9 or productive runtime.';

comment on column shadow_only_outbox_events.shadow_outcome_provenance is
  'Provenance for the shadow result, required when shadow_outcome is present.';

comment on column shadow_only_outbox_events.shadow_outcome_schema_version is
  'Schema version for the shadow result contract, required when shadow_outcome is present.';

comment on column shadow_only_outbox_events.shadow_outcome_generated_at is
  'Timestamp for the non-productive shadow result, required when shadow_outcome is present.';

comment on column shadow_only_outbox_events.shadow_outcome_producer is
  'Producer identifier for the non-productive shadow result. Allowed value: EVE_SHADOW_NON_PRODUCTIVE.';

comment on column shadow_only_outbox_events.shadow_outcome_checksum is
  'Checksum for the shadow result payload, required when shadow_outcome is present.';

comment on column shadow_only_outbox_events.shadow_outcome_evidence_refs is
  'Evidence references for the non-productive shadow result.';

comment on column shadow_only_outbox_events.shadow_outcome_no_go_flags is
  'No-Go flags associated with the non-productive shadow result.';

comment on column shadow_only_outbox_events.shadow_outcome_readiness is
  'Readiness state for later shadow comparison review. Does not grant product, Gate 3 or Fase 9 authority.';

comment on column shadow_only_outbox_events.shadow_outcome_source_ref is
  'Reference to the approved non-productive shadow source that produced shadow_outcome.';
