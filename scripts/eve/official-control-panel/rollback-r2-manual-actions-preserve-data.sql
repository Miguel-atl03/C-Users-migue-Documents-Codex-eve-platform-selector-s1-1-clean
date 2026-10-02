-- Non-destructive rollback: R2 authenticated manual product actions.
-- Preserves artifact tables, blobs, idempotency ledger, and all historical data.
-- Application deploy must also remove BFF POST manual-actions and UI action buttons.

begin;

-- ---------------------------------------------------------------------------
-- 1) Drop authenticated wrapper RPCs (R2 layer only)
-- ---------------------------------------------------------------------------
drop function if exists public.eve_apply_manual_work_product_action_as_consultant(
  uuid, text, text, integer, text, text, text, uuid, text, text, text, text, bytea
);
drop function if exists public.eve_apply_manual_work_product_action_as_consultant(
  uuid, uuid, text, text, integer, text, text, uuid, text, text, text, bytea
);

drop function if exists public.eve_fetch_manual_work_artifact_blob_as_consultant(uuid);

drop function if exists public.eve_consultant_has_manual_capability(uuid, text);
drop function if exists public.eve_consultant_has_panel_capability(uuid, text);
drop function if exists public.eve_download_manual_work_input_package_as_consultant(
  uuid, uuid, text, integer, text, text, text, text
);
drop function if exists public.eve_download_manual_work_input_package_as_consultant(
  uuid, uuid, uuid, text, integer, text, text, text
);
drop function if exists public.eve_list_valid_manual_input_packages_as_consultant(uuid, uuid[]);
drop function if exists public.eve_manual_work_validate_attach_bytes(text, text, bytea);
drop function if exists public.eve_manual_work_latest_valid_input_package_id(uuid);
drop function if exists public.eve_manual_work_latest_valid_input_package(uuid);

-- ---------------------------------------------------------------------------
-- 2) Revoke authenticated SELECT on R2 tables (defense in depth after rollback)
--    Tables and rows remain intact.
-- ---------------------------------------------------------------------------
revoke all on table public.manual_work_artifact_version from authenticated;
revoke all on table public.manual_work_artifact_blob from authenticated;
revoke all on table public.manual_work_action_idempotency from authenticated;

-- service_role retains SELECT for ops reads
grant select on table public.manual_work_artifact_version to service_role;
grant select on table public.manual_work_action_idempotency to service_role;

-- ---------------------------------------------------------------------------
-- 3) Restore core transition RPC execute to service_role only
--    (14-arg signature from point13 + actor_id patch in 20100000)
-- ---------------------------------------------------------------------------
revoke all on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text, uuid
) from public;
revoke all on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text, uuid
) from authenticated;
revoke all on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text, uuid
) from anon;
grant execute on function public.eve_apply_manual_work_transition(
  uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text, uuid
) to service_role;

-- Legacy 13-arg overload (if still present) — revoke from non-service roles
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'eve_apply_manual_work_transition'
      and pg_get_function_identity_arguments(p.oid) =
        'p_work_item_id uuid, p_after_status text, p_actor_label text, p_event_type text, p_reason text, p_artifact_ref text, p_acceptance_result_ref text, p_after_handoff_status text, p_expected_handoff_at timestamp with time zone, p_expected_event text, p_request_id text, p_handoff_origin text, p_handoff_destination text'
  ) then
    execute $sql$
      revoke all on function public.eve_apply_manual_work_transition(
        uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text
      ) from public, authenticated, anon;
      grant execute on function public.eve_apply_manual_work_transition(
        uuid, text, text, text, text, text, text, text, timestamptz, text, text, text, text
      ) to service_role;
    $sql$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Optional: disable point13 write gate if full manual write rollback desired
--    Uncomment only when coordinating with point13 preserve-data rollback.
-- ---------------------------------------------------------------------------
-- update public.manual_work_write_control
-- set enabled = false, updated_at = now(), note = 'r2_rollback_writes_disabled'
-- where id is true;

-- ---------------------------------------------------------------------------
-- 5) Ops marker (non-destructive audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.eve_r2_manual_actions_rollback_marker (
  id boolean primary key default true check (id),
  revoked_at timestamptz not null default now(),
  note text not null default 'r2_authenticated_wrapper_revoked_data_preserved'
);

insert into public.eve_r2_manual_actions_rollback_marker (id, note)
values (true, 'authenticated_wrapper_and_blob_fetch_dropped_data_preserved')
on conflict (id) do update set revoked_at = now(), note = excluded.note;

commit;

-- ---------------------------------------------------------------------------
-- Manual steps after SQL (documented):
-- 1. Deploy application build without POST .../manual-actions route handler.
-- 2. Deploy UI without manual action buttons (ManualWorkPanel read-only).
-- 3. Verify: authenticated cannot EXECUTE product wrapper (dropped).
-- 4. Verify: artifact tables still readable by service_role; data row counts unchanged.
-- 5. Re-apply forward migrations 20260720100000 + 20260720110000 to restore R2.
