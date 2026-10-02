-- Re-enable governed writes after non-destructive rollback.
-- Restores EXECUTE on transition RPC only; keeps direct DML revoked.

begin;

update public.manual_work_write_control
set enabled = true,
    updated_at = now(),
    note = 'writes_via_governed_rpc_only'
where id is true;

grant execute on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text
) to service_role;

revoke insert, update, delete, truncate on public.manual_process_work_item from service_role;
revoke insert, update, delete, truncate on public.manual_process_work_item_event from service_role;
revoke insert, update, delete, truncate on public.manual_process_work_item from authenticated;
revoke insert, update, delete, truncate on public.manual_process_work_item_event from authenticated;

grant select on public.manual_process_work_item to authenticated;
grant select on public.manual_process_work_item to service_role;
grant select on public.manual_process_work_item_event to authenticated;
grant select on public.manual_process_work_item_event to service_role;

delete from public.eve_point13_rollback_marker where id is true;

commit;
