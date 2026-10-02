-- UNIT 4A CONTROLLED ROLLBACK
-- Local only. Requires empty core milestone tables + no Unit 4A audit rows.

begin;

do $$
begin
  if exists (select 1 from public.core_milestone_achievements)
    or exists (select 1 from public.case_core_milestones)
    or exists (select 1 from public.core_milestone_definitions)
    or exists (
      select 1 from public.official_control_panel_context_audit
      where action in (
        'core_definition_registered',
        'core_definition_updated',
        'case_core_linked',
        'case_core_operational_linked',
        'core_achievement_recorded',
        'core_achievement_revoked',
        'main_process_core_code_set'
      )
    ) then
    raise exception using
      errcode = '55000',
      message = 'unit_4a_rollback_requires_empty_core_tables';
  end if;
end;
$$;

drop function if exists public.eve_verify_unit4a_core_milestone_integrity();
drop function if exists public.eve_calculate_core_milestone_progress(uuid);
drop function if exists public.eve_admin_revoke_core_milestone_achievement(uuid, uuid, text);
drop function if exists public.eve_admin_record_core_milestone_achievement(
  uuid, uuid, text, text, timestamptz, text, text, text
);
drop function if exists public.eve_admin_link_operational_core_milestone(uuid, uuid, uuid);
drop function if exists public.eve_admin_link_case_core_milestone(
  uuid, uuid, uuid, uuid, text
);
drop function if exists public.eve_admin_register_core_milestone_definition(
  uuid, text, text, integer, text, text
);
drop function if exists public.eve_admin_set_main_process_core_code(uuid, uuid, text);

drop trigger if exists trg_case_core_milestones_enforce_scope
  on public.case_core_milestones;
drop function if exists public.eve_enforce_case_core_milestone_scope();

drop policy if exists case_core_milestones_consultant_assigned_select
  on public.case_core_milestones;
drop policy if exists core_milestone_definitions_authenticated_select
  on public.core_milestone_definitions;

drop table if exists public.core_milestone_achievements;
drop table if exists public.case_core_milestones;
drop table if exists public.core_milestone_definitions;

alter table public.case_main_processes
  drop constraint if exists case_main_processes_core_process_code_check;
alter table public.case_main_processes
  drop column if exists core_process_code;

-- Restore Unit 3A audit checklist (without Unit 4A actions)
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
      'milestone_disabled'
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
      action in (
        'case_linked',
        'case_unlinked',
        'main_process_created',
        'main_process_updated',
        'current_milestone_set',
        'milestone_created',
        'milestone_updated',
        'milestone_disabled'
      )
      and client_company_id is not null
      and client_relationship_id is not null
      and case_id is not null
    )
  );

commit;
