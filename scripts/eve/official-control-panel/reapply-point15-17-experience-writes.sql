-- Re-enable Ola 3 experience writes (EXECUTE only).
update public.experience_write_control
set enabled = true, updated_at = now(), note = 'writes_via_governed_rpc_only'
where id is true;

grant execute on function public.eve_record_experience_screen_event(
  uuid, uuid, uuid, text, text, text, text, text, uuid, uuid, uuid, text, jsonb, timestamptz
) to service_role;

grant execute on function public.eve_apply_experience_support_action(
  uuid, uuid, uuid, text, text, text, text, text, text, uuid, text, text,
  uuid, uuid, uuid, jsonb, boolean
) to service_role;

revoke all on table public.experience_screen_event from service_role, authenticated, anon;
revoke all on table public.experience_support_action from service_role, authenticated, anon;
grant select on table public.experience_screen_event to authenticated, service_role;
grant select on table public.experience_support_action to authenticated, service_role;
grant select on table public.experience_screen_catalog to authenticated, service_role;
