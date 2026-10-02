revoke all on table
  public.usuarios,
  public.empresas,
  public.sesiones_llenado,
  public.actividades,
  public.respuestas_relatos,
  public.scene_registry,
  public.scene_question_answers,
  public.scene_canonical_records,
  public.session_intermediate_output,
  public.metricas_por_capa,
  public.respuestas_estructuradas,
  public.scene_answer_provenance,
  public.scene_block_derivations,
  public.scene_consistency_flags,
  public.scene_clarifications,
  public.scene_light_inferences,
  public.scene_answer_bundles
from anon;

grant select, insert, update, delete on table
  public.usuarios,
  public.empresas,
  public.sesiones_llenado,
  public.actividades,
  public.respuestas_relatos,
  public.scene_registry,
  public.scene_question_answers,
  public.scene_canonical_records,
  public.session_intermediate_output,
  public.metricas_por_capa,
  public.respuestas_estructuradas,
  public.scene_answer_provenance,
  public.scene_block_derivations,
  public.scene_consistency_flags,
  public.scene_clarifications,
  public.scene_light_inferences,
  public.scene_answer_bundles
to authenticated;

alter table public.usuarios enable row level security;
alter table public.empresas enable row level security;
alter table public.sesiones_llenado enable row level security;
alter table public.actividades enable row level security;
alter table public.respuestas_relatos enable row level security;
alter table public.scene_registry enable row level security;
alter table public.scene_question_answers enable row level security;
alter table public.scene_canonical_records enable row level security;
alter table public.session_intermediate_output enable row level security;
alter table public.metricas_por_capa enable row level security;
alter table public.respuestas_estructuradas enable row level security;
alter table public.scene_answer_provenance enable row level security;
alter table public.scene_block_derivations enable row level security;
alter table public.scene_consistency_flags enable row level security;
alter table public.scene_clarifications enable row level security;
alter table public.scene_light_inferences enable row level security;
alter table public.scene_answer_bundles enable row level security;

drop policy if exists usuarios_authenticated_own on public.usuarios;
create policy usuarios_authenticated_own
  on public.usuarios
  for all
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists empresas_authenticated_own on public.empresas;
create policy empresas_authenticated_own
  on public.empresas
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios owner_user
      where owner_user.empresa_id = empresas.id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists empresas_authenticated_insert on public.empresas;
create policy empresas_authenticated_insert
  on public.empresas
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists empresas_authenticated_update_own on public.empresas;
create policy empresas_authenticated_update_own
  on public.empresas
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios owner_user
      where owner_user.empresa_id = empresas.id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.usuarios owner_user
      where owner_user.empresa_id = empresas.id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists empresas_authenticated_delete_own on public.empresas;
create policy empresas_authenticated_delete_own
  on public.empresas
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios owner_user
      where owner_user.empresa_id = empresas.id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists sesiones_llenado_authenticated_own on public.sesiones_llenado;
create policy sesiones_llenado_authenticated_own
  on public.sesiones_llenado
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios owner_user
      where owner_user.id = sesiones_llenado.usuario_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.usuarios owner_user
      where owner_user.id = sesiones_llenado.usuario_id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists actividades_authenticated_own_session on public.actividades;
create policy actividades_authenticated_own_session
  on public.actividades
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = actividades.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = actividades.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists respuestas_relatos_authenticated_own_session on public.respuestas_relatos;
create policy respuestas_relatos_authenticated_own_session
  on public.respuestas_relatos
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = respuestas_relatos.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = respuestas_relatos.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists scene_registry_authenticated_own_session on public.scene_registry;
create policy scene_registry_authenticated_own_session
  on public.scene_registry
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_registry.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_registry.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists scene_question_answers_authenticated_own_session on public.scene_question_answers;
create policy scene_question_answers_authenticated_own_session
  on public.scene_question_answers
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_question_answers.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_question_answers.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_question_answers.scene_id
        and owner_scene.sesion_id = scene_question_answers.sesion_id
    )
  );

drop policy if exists scene_canonical_records_authenticated_own_session on public.scene_canonical_records;
create policy scene_canonical_records_authenticated_own_session
  on public.scene_canonical_records
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_canonical_records.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_canonical_records.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_canonical_records.scene_id
        and owner_scene.sesion_id = scene_canonical_records.sesion_id
    )
  );

drop policy if exists session_intermediate_output_authenticated_own_session on public.session_intermediate_output;
create policy session_intermediate_output_authenticated_own_session
  on public.session_intermediate_output
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = session_intermediate_output.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = session_intermediate_output.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists metricas_por_capa_authenticated_own_session on public.metricas_por_capa;
create policy metricas_por_capa_authenticated_own_session
  on public.metricas_por_capa
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = metricas_por_capa.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = metricas_por_capa.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists respuestas_estructuradas_authenticated_own_session on public.respuestas_estructuradas;
create policy respuestas_estructuradas_authenticated_own_session
  on public.respuestas_estructuradas
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = respuestas_estructuradas.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = respuestas_estructuradas.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists scene_answer_provenance_authenticated_own_session on public.scene_answer_provenance;
create policy scene_answer_provenance_authenticated_own_session
  on public.scene_answer_provenance
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_answer_provenance.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_answer_provenance.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_answer_provenance.scene_id
        and owner_scene.sesion_id = scene_answer_provenance.sesion_id
    )
  );

drop policy if exists scene_block_derivations_authenticated_own_session on public.scene_block_derivations;
create policy scene_block_derivations_authenticated_own_session
  on public.scene_block_derivations
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_block_derivations.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_block_derivations.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_block_derivations.scene_id
        and owner_scene.sesion_id = scene_block_derivations.sesion_id
    )
  );

drop policy if exists scene_consistency_flags_authenticated_own_session on public.scene_consistency_flags;
create policy scene_consistency_flags_authenticated_own_session
  on public.scene_consistency_flags
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_consistency_flags.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_consistency_flags.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_consistency_flags.scene_id
        and owner_scene.sesion_id = scene_consistency_flags.sesion_id
    )
  );

drop policy if exists scene_clarifications_authenticated_own_session on public.scene_clarifications;
create policy scene_clarifications_authenticated_own_session
  on public.scene_clarifications
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_clarifications.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_clarifications.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_clarifications.scene_id
        and owner_scene.sesion_id = scene_clarifications.sesion_id
    )
  );

drop policy if exists scene_light_inferences_authenticated_own_session on public.scene_light_inferences;
create policy scene_light_inferences_authenticated_own_session
  on public.scene_light_inferences
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_light_inferences.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_light_inferences.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_light_inferences.scene_id
        and owner_scene.sesion_id = scene_light_inferences.sesion_id
    )
  );

drop policy if exists scene_answer_bundles_authenticated_own_session on public.scene_answer_bundles;
create policy scene_answer_bundles_authenticated_own_session
  on public.scene_answer_bundles
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_answer_bundles.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sesiones_llenado owner_session
      join public.usuarios owner_user on owner_user.id = owner_session.usuario_id
      where owner_session.id = scene_answer_bundles.sesion_id
        and owner_user.auth_user_id = auth.uid()
    )
    and exists (
      select 1
      from public.scene_registry owner_scene
      where owner_scene.id = scene_answer_bundles.scene_id
        and owner_scene.sesion_id = scene_answer_bundles.sesion_id
    )
  );
