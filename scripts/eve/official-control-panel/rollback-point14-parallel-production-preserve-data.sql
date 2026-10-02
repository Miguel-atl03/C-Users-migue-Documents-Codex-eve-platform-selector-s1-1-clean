-- §14 default rollback (non-destructive): block all writes, preserve data.
-- Append-only mutation preventers remain ACTIVE after rollback.

-- 1) Disable write control gate
update public.parallel_production_write_control
set enabled = false,
    updated_at = now(),
    note = 'rollback_writes_disabled'
where id is true;

-- 2) Revoke EXECUTE on all §14 write RPCs (current signatures)
revoke execute on function public.eve_create_parallel_production_package(
  uuid, uuid, text, text, uuid, text, text
) from service_role;
revoke execute on function public.eve_open_parallel_production_finding(
  uuid, text, text, text, text, uuid, text, text, boolean, text
) from service_role;
revoke execute on function public.eve_apply_parallel_production_transition(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text,
  boolean, boolean, text, boolean, text, text, text, text, text, text, text, text, text
) from service_role;
revoke execute on function public.eve_apply_parallel_production_finding_transition(
  uuid, text, text, text, text, text, text, text, text, text
) from service_role;

-- 3) Keep DML revoked (idempotent); authorized SELECT remains
revoke all on table public.parallel_production_package from service_role, authenticated, anon;
revoke all on table public.parallel_production_package_event from service_role, authenticated, anon;
revoke all on table public.parallel_production_qa_finding from service_role, authenticated, anon;
revoke all on table public.parallel_production_qa_finding_event from service_role, authenticated, anon;
grant select on table public.parallel_production_package to authenticated, service_role;
grant select on table public.parallel_production_package_event to authenticated, service_role;
grant select on table public.parallel_production_qa_finding to authenticated, service_role;
grant select on table public.parallel_production_qa_finding_event to authenticated, service_role;

-- After rollback:
--   RPC write → rejected
--   direct DML → rejected
--   UPDATE/DELETE/TRUNCATE on events → rejected (append-only triggers stay)
--   authorized SELECT → available
--   history → intact
-- Application deploy must remove or feature-flag BFF/UI §14 surfaces.
