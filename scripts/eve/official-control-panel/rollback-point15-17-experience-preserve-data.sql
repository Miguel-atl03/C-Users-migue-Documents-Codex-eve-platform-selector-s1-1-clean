-- §§15–17 default rollback (non-destructive): block writes, preserve data.
-- Append-only mutation preventers remain ACTIVE after rollback.

update public.experience_write_control
set enabled = false,
    updated_at = now(),
    note = 'rollback_writes_disabled'
where id is true;

revoke execute on function public.eve_record_experience_screen_event(
  uuid, uuid, uuid, text, text, text, text, text, uuid, uuid, uuid, text, jsonb, timestamptz
) from service_role;
revoke execute on function public.eve_apply_experience_support_action(
  uuid, uuid, uuid, text, text, text, text, text, text, uuid, text, text,
  uuid, uuid, uuid, jsonb, boolean
) from service_role;

revoke all on table public.experience_screen_event from service_role, authenticated, anon;
revoke all on table public.experience_support_action from service_role, authenticated, anon;
grant select on table public.experience_screen_event to authenticated, service_role;
grant select on table public.experience_support_action to authenticated, service_role;
grant select on table public.experience_screen_catalog to authenticated, service_role;

-- After rollback:
--   RPC write → rejected
--   direct DML → rejected
--   UPDATE/DELETE/TRUNCATE on history → rejected (append-only triggers stay)
--   authorized SELECT → available
--   history → intact
