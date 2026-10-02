-- Non-destructive rollback: block ALL writes (RPC + direct); preserve data/RLS/history.
-- Application deploy must also remove BFF/UI for §13.

begin;

-- 1) Disable write gate (blocks SECURITY DEFINER RPCs and any residual DML)
update public.manual_work_write_control
set enabled = false,
    updated_at = now(),
    note = 'rollback_writes_disabled_data_preserved'
where id is true;

-- 2) Revoke EXECUTE on governed transition RPC
revoke execute on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text
) from service_role;

revoke execute on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text
) from public;

revoke execute on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text
) from authenticated;

revoke execute on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text
) from anon;

-- 3) Keep direct DML revoked (defense in depth)
revoke insert, update, delete, truncate on public.manual_process_work_item from service_role;
revoke insert, update, delete, truncate on public.manual_process_work_item_event from service_role;
revoke insert, update, delete, truncate on public.manual_process_work_item from authenticated;
revoke insert, update, delete, truncate on public.manual_process_work_item_event from authenticated;
revoke insert, update, delete, truncate on public.manual_process_work_item from anon;
revoke insert, update, delete, truncate on public.manual_process_work_item_event from anon;

-- 4) Preserve SELECT for authorized consultants + service_role reads
grant select on public.manual_process_work_item to authenticated;
grant select on public.manual_process_work_item_event to authenticated;
grant select on public.manual_process_work_item to service_role;
grant select on public.manual_process_work_item_event to service_role;

-- 5) Ops marker
create table if not exists public.eve_point13_rollback_marker (
  id boolean primary key default true check (id),
  revoked_at timestamptz not null default now(),
  note text not null default 'producer_rpc_revoked_data_preserved'
);

insert into public.eve_point13_rollback_marker (id, note)
values (true, 'write_gate_disabled_rpc_revoked_data_preserved')
on conflict (id) do update set revoked_at = now(), note = excluded.note;

commit;
