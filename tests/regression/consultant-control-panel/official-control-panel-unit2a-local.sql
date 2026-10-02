begin;

select set_config('request.jwt.claim.role', 'service_role', true);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'unit2a-consultant-a@example.invalid',
    '',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'unit2a-consultant-b@example.invalid',
    '',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'unit2a-admin@example.invalid',
    '',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.empresas (id, nombre)
values
  ('10000000-0000-4000-8000-000000000001', 'Empresa A'),
  ('10000000-0000-4000-8000-000000000002', 'Empresa B');

insert into public.usuarios (id, empresa_id, email)
values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'participant-company-b@example.invalid'
);

select public.eve_admin_assign_consultant_company(
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  now() - interval '1 day',
  null
);

create temporary table unit2a_test_context on commit drop as
select public.eve_admin_create_client_relationship(
  '20000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  'Relación A',
  now() - interval '1 day',
  null
) as relationship_id;

insert into public.sesiones_llenado (
  id,
  usuario_id,
  estado_actual
)
values (
  '40000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'capa_1_triple'
);

select public.eve_admin_link_case_relationship(
  '20000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  (select relationship_id from unit2a_test_context),
  'Caso A'
);

do $$
declare
  case_company uuid;
  participant_company uuid;
begin
  select s.client_company_id, u.empresa_id
    into case_company, participant_company
  from public.sesiones_llenado s
  join public.usuarios u on u.id = s.usuario_id
  where s.id = '40000000-0000-4000-8000-000000000001';

  if case_company <> '10000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'explicit_case_company_not_saved';
  end if;
  if participant_company = case_company then
    raise exception 'test_did_not_separate_participant_company';
  end if;
end;
$$;

do $$
begin
  begin
    insert into public.sesiones_llenado (
      id,
      usuario_id,
      estado_actual,
      client_company_id,
      client_relationship_id,
      display_name
    )
    values (
      '40000000-0000-4000-8000-000000000002',
      '50000000-0000-4000-8000-000000000001',
      'capa_1_triple',
      '10000000-0000-4000-8000-000000000002',
      (select relationship_id from unit2a_test_context),
      'Caso cruzado'
    );
    raise exception 'cross_company_case_was_accepted';
  exception
    when foreign_key_violation then null;
  end;
end;
$$;

do $$
begin
  begin
    perform public.eve_admin_assign_consultant_company(
      '20000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      now(),
      null
    );
    raise exception 'overlapping_assignment_was_accepted';
  exception
    when exclusion_violation then null;
  end;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select
  auth.uid() as authenticated_consultant,
  auth.role() as authenticated_role,
  (select count(*) from public.empresas) as visible_companies,
  (select count(*) from public.client_relationships) as visible_relationships,
  (select count(*) from public.sesiones_llenado) as visible_cases;

do $$
begin
  if (select count(*) from public.empresas) <> 1 then
    raise exception 'consultant_a_company_scope_failed';
  end if;
  if (select count(*) from public.client_relationships) <> 1 then
    raise exception 'consultant_a_relationship_scope_failed';
  end if;
  if (select count(*) from public.sesiones_llenado) <> 1 then
    raise exception 'consultant_a_case_scope_failed';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-4000-8000-000000000002',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if (select count(*) from public.empresas) <> 0 then
    raise exception 'consultant_b_company_leak';
  end if;
  if (select count(*) from public.client_relationships) <> 0 then
    raise exception 'consultant_b_relationship_leak';
  end if;
  if (select count(*) from public.sesiones_llenado) <> 0 then
    raise exception 'consultant_b_case_leak';
  end if;
end;
$$;

reset role;
select 'unit2a_local_integration_pass' as result;

rollback;
