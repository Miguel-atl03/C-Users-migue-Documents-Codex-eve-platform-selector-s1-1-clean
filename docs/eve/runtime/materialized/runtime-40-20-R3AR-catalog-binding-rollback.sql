-- 045-R3A-R rollback candidate.
-- Restores the pre-045-R3A-R create_role_runtime_session_for_profile body.
-- Intended only for staging rollback rehearsal; do not use against production.

create or replace function public.create_role_runtime_session_for_profile(
  p_case_participant_profile_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  role_runtime_session_id uuid,
  case_participant_profile_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_profile public.case_participant_profiles;
  v_participant public.case_participants;
  v_usuario public.usuarios;
  v_case public.sesiones_llenado;
  v_runtime public.role_runtime_session;
  v_link public.case_profile_runtime_session_links;
  v_actor uuid := auth.uid();
  v_internal boolean := v_actor_role = 'service_role';
  v_created boolean := false;
begin
  if p_case_participant_profile_id is null then
    raise exception using errcode = '22023', message = 'missing_case_participant_profile_id';
  end if;

  select * into v_profile
  from public.case_participant_profiles
  where id = p_case_participant_profile_id
    and public.case_participant_profiles.profile_status = 'active'
  for update;

  if v_profile.id is null then
    raise exception using errcode = '23514', message = 'active_profile_required';
  end if;

  select * into v_participant
  from public.case_participants
  where id = v_profile.case_participant_id
    and public.case_participants.status = 'active'
  for update;

  if v_participant.id is null then
    raise exception using errcode = '23514', message = 'active_case_participant_required';
  end if;

  select * into v_usuario
  from public.usuarios
  where id = v_participant.usuario_id;

  if v_usuario.id is null or v_usuario.auth_user_id is null then
    raise exception using errcode = '23514', message = 'participant_auth_user_required';
  end if;

  select * into v_case
  from public.sesiones_llenado
  where id = v_participant.case_id;

  if v_case.id is null
    or v_case.client_company_id is distinct from v_participant.empresa_id
    or v_case.client_relationship_id is distinct from v_participant.client_relationship_id then
    raise exception using errcode = '23514', message = 'profile_case_context_mismatch';
  end if;

  if not v_internal and (
    v_actor is null
    or not public.eve_consultant_can_access_case(v_participant.case_id)
  ) then
    raise exception using errcode = '42501', message = 'runtime_creation_not_authorized';
  end if;

  select r.* into v_runtime
  from public.role_runtime_session r
  where r.sesion_id = v_participant.case_id
    and r.owner_auth_user_id = v_usuario.auth_user_id
    and r.metadata_json->>'case_participant_profile_id' = v_profile.id::text
  order by r.created_at asc
  limit 1;

  if v_runtime.role_runtime_session_id is null then
    insert into public.role_runtime_session (
      sesion_id,
      case_id,
      role_id,
      role_label,
      owner_auth_user_id,
      execution_mode,
      metadata_json
    )
    values (
      v_participant.case_id,
      v_participant.case_id::text,
      v_profile.role_code,
      v_profile.role_label,
      v_usuario.auth_user_id,
      'commercial',
      jsonb_build_object(
        'created_by_rpc', 'create_role_runtime_session_for_profile',
        'case_participant_id', v_participant.id,
        'case_participant_profile_id', v_profile.id,
        'client_company_id', v_participant.empresa_id,
        'client_relationship_id', v_participant.client_relationship_id
      ) || coalesce(p_metadata, '{}'::jsonb)
    )
    returning * into v_runtime;
    v_created := true;
  end if;

  select * into v_link
  from public.case_profile_runtime_session_links
  where public.case_profile_runtime_session_links.case_participant_profile_id = v_profile.id
    and public.case_profile_runtime_session_links.role_runtime_session_id = v_runtime.role_runtime_session_id
    and public.case_profile_runtime_session_links.status = 'active'
  limit 1;

  if v_link.id is null then
    insert into public.case_profile_runtime_session_links (
      case_participant_profile_id,
      role_runtime_session_id,
      linked_by,
      status,
      metadata
    )
    values (
      v_profile.id,
      v_runtime.role_runtime_session_id,
      coalesce(v_actor, v_usuario.auth_user_id),
      'active',
      jsonb_build_object(
        'created_by_rpc', 'create_role_runtime_session_for_profile'
      ) || coalesce(p_metadata, '{}'::jsonb)
    )
    returning * into v_link;
  end if;

  return query
  select
    v_runtime.role_runtime_session_id,
    v_profile.id,
    case when v_created then 'created' else 'existing' end;
end;
$$;

revoke all on function public.create_role_runtime_session_for_profile(uuid, jsonb)
  from public, anon, authenticated;

grant execute on function public.create_role_runtime_session_for_profile(uuid, jsonb)
  to authenticated, service_role;
