import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

const EMAIL = "unit2b-consultant@example.invalid";
const password = process.env.EVE_UNIT2B_TEST_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!password || !supabaseUrl || !serviceRoleKey) {
  throw new Error("unit2b_local_e2e_environment_missing");
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const consultantUserId = await resolveConsultantUserId();
const sql = buildSql(consultantUserId);
const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "supabase_db_eve-platform",
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "postgres",
  ],
  { encoding: "utf8", input: sql },
);

if (result.status !== 0) {
  throw new Error("unit2b_local_e2e_database_seed_failed");
}

console.log(
  JSON.stringify({
    ok: true,
    consultantUserId,
    companies: 3,
    relationships: 3,
    cases: 3,
  }),
);

async function resolveConsultantUserId() {
  const { data: usersData, error: listError } =
    await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error("unit2b_test_user_list_failed");

  const existing = usersData.users.find((user) => user.email === EMAIL);
  if (existing) {
    const { error } = await client.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error("unit2b_test_user_update_failed");
    return existing.id;
  }

  const { data, error } = await client.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error("unit2b_test_user_create_failed");
  return data.user.id;
}

function buildSql(userId) {
  return `
begin;

-- Disable legacy non-canonical Amber fixture so the consultant sees one Amber only.
update public.consultant_company_assignments
set status = 'disabled'
where id = '62000000-0000-4000-8000-000000000001'
   or client_company_id = '12000000-0000-4000-8000-000000000001';

update public.empresas
set nombre = 'Fixture Amber Legacy (disabled)'
where id = '12000000-0000-4000-8000-000000000001';

insert into public.empresas (id, nombre)
values
  ('5c08029f-15e9-4bbd-b13e-0ff4765e23b8', 'Cervecería Amber'),
  ('12000000-0000-4000-8000-000000000002', 'Empresa Múltiple'),
  ('12000000-0000-4000-8000-000000000003', 'Empresa Sin Relación')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.usuarios (id, empresa_id, email)
values
  (
    '5a830545-d8a7-4a4f-b727-629d3c6e3751',
    '5c08029f-15e9-4bbd-b13e-0ff4765e23b8',
    'amber-canonical-participant@example.invalid'
  ),
  (
    '52000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000002',
    'unit2b-participant@example.invalid'
  )
on conflict (id) do update set empresa_id = excluded.empresa_id, email = excluded.email;

insert into public.consultant_company_assignments (
  id,
  consultant_user_id,
  client_company_id,
  status,
  valid_from,
  valid_until,
  created_by
)
values
  (
    '173bcb79-b607-464e-8180-9b2f7b15432a',
    '${userId}',
    '5c08029f-15e9-4bbd-b13e-0ff4765e23b8',
    'enabled',
    now() - interval '1 day',
    null,
    '${userId}'
  ),
  (
    '62000000-0000-4000-8000-000000000002',
    '${userId}',
    '12000000-0000-4000-8000-000000000002',
    'enabled',
    now() - interval '1 day',
    null,
    '${userId}'
  ),
  (
    '62000000-0000-4000-8000-000000000003',
    '${userId}',
    '12000000-0000-4000-8000-000000000003',
    'enabled',
    now() - interval '1 day',
    null,
    '${userId}'
  )
on conflict (id) do update set
  consultant_user_id = excluded.consultant_user_id,
  status = excluded.status,
  valid_from = excluded.valid_from,
  valid_until = excluded.valid_until;

insert into public.client_relationships (
  id,
  client_company_id,
  display_name,
  status,
  valid_from,
  valid_until,
  created_by
)
values
  (
    '7c499a1c-31c6-4fc9-8b20-2fd8cdc57043',
    '5c08029f-15e9-4bbd-b13e-0ff4765e23b8',
    'Relación activa de Cervecería Amber',
    'enabled',
    now() - interval '1 day',
    null,
    '${userId}'
  ),
  (
    '32000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002',
    'Relación con Casos',
    'enabled',
    now() - interval '1 day',
    null,
    '${userId}'
  ),
  (
    '32000000-0000-4000-8000-000000000003',
    '12000000-0000-4000-8000-000000000002',
    'Relación Sin Caso',
    'enabled',
    now() - interval '1 day',
    null,
    '${userId}'
  )
on conflict (id) do update set
  client_company_id = excluded.client_company_id,
  display_name = excluded.display_name,
  status = excluded.status,
  valid_from = excluded.valid_from,
  valid_until = excluded.valid_until;

insert into public.sesiones_llenado (
  id,
  usuario_id,
  estado_actual,
  client_company_id,
  client_relationship_id,
  display_name
)
values
  (
    '19fc9eff-4219-43f0-854c-e2b3350f23f2',
    '5a830545-d8a7-4a4f-b727-629d3c6e3751',
    null,
    '5c08029f-15e9-4bbd-b13e-0ff4765e23b8',
    '7c499a1c-31c6-4fc9-8b20-2fd8cdc57043',
    'Caso INC16 Cervecería Amber Ancestral'
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '52000000-0000-4000-8000-000000000001',
    'capa_1_triple',
    '12000000-0000-4000-8000-000000000002',
    '32000000-0000-4000-8000-000000000002',
    'Caso Alfa'
  ),
  (
    '42000000-0000-4000-8000-000000000003',
    '52000000-0000-4000-8000-000000000001',
    'completado',
    '12000000-0000-4000-8000-000000000002',
    '32000000-0000-4000-8000-000000000002',
    'Caso Beta'
  )
on conflict (id) do update set
  usuario_id = excluded.usuario_id,
  estado_actual = excluded.estado_actual,
  client_company_id = excluded.client_company_id,
  client_relationship_id = excluded.client_relationship_id,
  display_name = excluded.display_name;

commit;
`;
}
