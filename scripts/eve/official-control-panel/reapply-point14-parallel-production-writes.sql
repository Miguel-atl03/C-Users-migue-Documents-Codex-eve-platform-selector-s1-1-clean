-- Re-enable §14 writes after non-destructive rollback (RPC EXECUTE only; no direct DML).
update public.parallel_production_write_control
set enabled = true,
    updated_at = now(),
    note = 'writes_via_governed_rpc_only'
where id is true;

grant execute on function public.eve_create_parallel_production_package(
  uuid, uuid, text, text, uuid, text, text
) to service_role;
grant execute on function public.eve_open_parallel_production_finding(
  uuid, text, text, text, text, uuid, text, text, boolean, text
) to service_role;
grant execute on function public.eve_apply_parallel_production_transition(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text,
  boolean, boolean, text, boolean, text, text, text, text, text, text, text, text, text
) to service_role;
grant execute on function public.eve_apply_parallel_production_finding_transition(
  uuid, text, text, text, text, text, text, text, text, text
) to service_role;

revoke all on table public.parallel_production_package from service_role, authenticated, anon;
revoke all on table public.parallel_production_package_event from service_role, authenticated, anon;
revoke all on table public.parallel_production_qa_finding from service_role, authenticated, anon;
revoke all on table public.parallel_production_qa_finding_event from service_role, authenticated, anon;
grant select on table public.parallel_production_package to authenticated, service_role;
grant select on table public.parallel_production_package_event to authenticated, service_role;
grant select on table public.parallel_production_qa_finding to authenticated, service_role;
grant select on table public.parallel_production_qa_finding_event to authenticated, service_role;
