-- TRAMO R2A CONTROLLED ROLLBACK
-- Local only. Requires empty participant/profile tables + no R2A audit rows.

begin;

do $$
begin
  if exists (select 1 from public.case_participant_profiles)
    or exists (select 1 from public.case_participants)
    or exists (
      select 1 from public.official_control_panel_context_audit
      where action in (
        'case_participant_added',
        'case_participant_disabled',
        'case_participant_validity_changed',
        'case_participant_profile_added',
        'case_participant_profile_resolution_updated',
        'case_participant_profile_reassigned',
        'case_participant_profile_disabled'
      )
    ) then
    raise exception using
      errcode = '55000',
      message = 'tramo_r2a_rollback_requires_empty_participant_tables';
  end if;
end;
$$;

drop function if exists public.eve_verify_tramo_r2a_case_participant_integrity();
drop function if exists public.eve_admin_disable_case_participant_profile(uuid, uuid, text);
drop function if exists public.eve_admin_reassign_case_participant_profile(uuid, uuid, text, text, text);
drop function if exists public.eve_admin_update_case_participant_profile_resolution(uuid, uuid, text, text);
drop function if exists public.eve_admin_add_case_participant_profile(uuid, uuid, text, text, timestamptz, timestamptz);
drop function if exists public.eve_admin_disable_case_participant(uuid, uuid, text);
drop function if exists public.eve_admin_add_case_participant(uuid, uuid, uuid, text, text, timestamptz, timestamptz);
drop function if exists public.eve_consultant_can_access_case_participant_profile(uuid, uuid, uuid, timestamptz);
drop function if exists public.eve_consultant_can_access_case_participant(uuid, uuid, timestamptz);

drop trigger if exists trg_case_participant_profiles_no_silent_reassign
  on public.case_participant_profiles;
drop function if exists public.eve_prevent_silent_profile_reassignment();

drop trigger if exists trg_case_participants_enforce_company
  on public.case_participants;
drop function if exists public.eve_enforce_case_participant_company_scope();

drop policy if exists case_participant_profiles_consultant_assigned_select
  on public.case_participant_profiles;
drop policy if exists case_participants_consultant_assigned_select
  on public.case_participants;

drop table if exists public.case_participant_profiles;
drop table if exists public.case_participants;

-- Restore Unit 4A audit checklist (without R2A actions)
alter table public.official_control_panel_context_audit
  drop constraint if exists official_control_panel_context_audit_action_check;
alter table public.official_control_panel_context_audit
  drop constraint if exists official_control_panel_context_audit_scope_check;

alter table public.official_control_panel_context_audit
  add constraint official_control_panel_context_audit_action_check
  check (
    action in (
      'assignment_created',
      'assignment_disabled',
      'relationship_created',
      'relationship_updated',
      'case_linked',
      'case_unlinked',
      'main_process_created',
      'main_process_updated',
      'current_milestone_set',
      'milestone_created',
      'milestone_updated',
      'milestone_disabled',
      'core_definition_registered',
      'core_definition_updated',
      'case_core_linked',
      'case_core_operational_linked',
      'core_achievement_recorded',
      'core_achievement_revoked',
      'main_process_core_code_set'
    )
  );

alter table public.official_control_panel_context_audit
  add constraint official_control_panel_context_audit_scope_check
  check (
    (
      action in ('assignment_created', 'assignment_disabled')
      and client_company_id is not null
    )
    or (
      action in ('relationship_created', 'relationship_updated')
      and client_company_id is not null
      and client_relationship_id is not null
    )
    or (
      action in ('case_linked', 'case_unlinked')
      and client_company_id is not null
      and client_relationship_id is not null
      and case_id is not null
    )
    or (
      action in (
        'main_process_created',
        'main_process_updated',
        'current_milestone_set',
        'milestone_created',
        'milestone_updated',
        'milestone_disabled',
        'case_core_linked',
        'case_core_operational_linked',
        'core_achievement_recorded',
        'core_achievement_revoked',
        'main_process_core_code_set'
      )
      and client_company_id is not null
      and client_relationship_id is not null
      and case_id is not null
    )
    or (
      action in ('core_definition_registered', 'core_definition_updated')
      and client_company_id is null
      and client_relationship_id is null
      and case_id is null
    )
  );

commit;
