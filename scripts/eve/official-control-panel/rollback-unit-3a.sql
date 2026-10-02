-- UNIT 3A CONTROLLED ROLLBACK
-- Run only in an authorized LOCAL environment after reviewing preconditions.
-- Does not touch staging or production.

begin;

do $$
begin
  if exists (select 1 from public.case_milestones)
    or exists (select 1 from public.case_main_processes)
    or exists (
      select 1
      from public.official_control_panel_context_audit
      where action in (
        'main_process_created',
        'main_process_updated',
        'current_milestone_set',
        'milestone_created',
        'milestone_updated',
        'milestone_disabled'
      )
    ) then
    raise exception using
      errcode = '55000',
      message = 'unit_3a_rollback_requires_empty_process_structure';
  end if;
end;
$$;

drop policy if exists case_milestones_consultant_assigned_select
  on public.case_milestones;
drop policy if exists case_main_processes_consultant_assigned_select
  on public.case_main_processes;

drop function if exists public.eve_verify_unit3a_process_structure_integrity();
drop function if exists public.eve_admin_disable_case_milestone(uuid, uuid);
drop function if exists public.eve_admin_update_case_milestone(
  uuid, uuid, text, text, text, boolean, timestamptz, boolean, text, boolean
);
drop function if exists public.eve_admin_set_current_case_milestone(uuid, uuid, uuid);
drop function if exists public.eve_admin_add_case_milestone(
  uuid, uuid, text, integer, text, text, timestamptz, text
);
drop function if exists public.eve_admin_create_case_main_process(uuid, uuid, text, text);

drop trigger if exists trg_case_milestones_protect_current_process
  on public.case_milestones;
drop function if exists public.eve_prevent_current_milestone_process_reassign();

drop trigger if exists trg_case_main_processes_current_milestone_same_process
  on public.case_main_processes;
drop function if exists public.eve_enforce_current_milestone_same_process();

drop trigger if exists trg_case_main_processes_require_case_context
  on public.case_main_processes;
drop function if exists public.eve_enforce_main_process_case_context();

drop trigger if exists trg_case_milestones_set_updated_at
  on public.case_milestones;
drop trigger if exists trg_case_main_processes_set_updated_at
  on public.case_main_processes;

alter table public.case_main_processes
  drop constraint if exists case_main_processes_current_milestone_fkey;

drop table if exists public.case_milestones;
drop table if exists public.case_main_processes;

-- Restore Unit 2A audit action checklist
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
      'case_unlinked'
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
  );

commit;
