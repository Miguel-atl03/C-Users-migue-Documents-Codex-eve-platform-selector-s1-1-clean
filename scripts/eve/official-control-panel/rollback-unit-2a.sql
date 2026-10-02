-- UNIT 2A CONTROLLED ROLLBACK
-- Run only in an authorized environment after reviewing the precondition block.

begin;

do $$
begin
  if exists (
    select 1
    from public.sesiones_llenado
    where client_company_id is not null
       or client_relationship_id is not null
  ) or exists (
    select 1 from public.consultant_company_assignments
  ) or exists (
    select 1 from public.client_relationships
  ) or exists (
    select 1 from public.official_control_panel_context_audit
  ) then
    raise exception using
      errcode = '55000',
      message = 'unit_2a_rollback_requires_empty_context_tables';
  end if;
end;
$$;

drop policy consultant_company_assignments_own_current_select
  on public.consultant_company_assignments;
drop policy client_relationships_assigned_current_select
  on public.client_relationships;
drop policy empresas_consultant_assigned_select
  on public.empresas;
drop policy sesiones_llenado_consultant_assigned_select
  on public.sesiones_llenado;

drop function public.eve_verify_official_context_integrity();
drop function public.eve_admin_disable_consultant_company(
  uuid, uuid, timestamptz
);
drop function public.eve_admin_link_case_relationship(
  uuid, uuid, uuid, uuid, text
);
drop function public.eve_admin_create_client_relationship(
  uuid, uuid, text, timestamptz, timestamptz
);
drop function public.eve_admin_assign_consultant_company(
  uuid, uuid, uuid, timestamptz, timestamptz
);
drop function public.eve_require_official_context_admin();
drop function public.eve_consultant_can_access_case(uuid, timestamptz);
drop function public.eve_consultant_can_access_relationship(
  uuid, timestamptz
);
drop function public.eve_consultant_has_company_access(uuid, timestamptz);

drop table public.official_control_panel_context_audit;

drop trigger trg_client_relationships_protect_linked_company
  on public.client_relationships;
drop function public.eve_prevent_linked_relationship_company_change();

alter table public.sesiones_llenado
  drop constraint sesiones_llenado_explicit_context_check,
  drop constraint sesiones_llenado_relationship_company_fkey,
  drop column display_name,
  drop column client_relationship_id,
  drop column client_company_id;

drop trigger trg_client_relationships_set_updated_at
  on public.client_relationships;
drop trigger trg_consultant_company_assignments_set_updated_at
  on public.consultant_company_assignments;
drop function public.eve_official_context_set_updated_at();

drop table public.client_relationships;
drop table public.consultant_company_assignments;

commit;
