#!/usr/bin/env node
/**
 * Ola 3 §§15–17 integrity verifier.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const AMBER = "19fc9eff-4219-43f0-854c-e2b3350f23f2";

loadEnv(root);

function sql(q) {
  const r = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_eve-platform",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-t",
      "-A",
      "-c",
      q,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "sql_failed");
  return (r.stdout || "").trim();
}

function probe(label, q) {
  const r = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_eve-platform",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      q,
    ],
    { encoding: "utf8" },
  );
  // success of mutation = fail
  return r.status === 0;
}

const metrics = {
  amberExperienceEvents: Number(
    sql(
      `select count(*) from public.experience_screen_event where case_id='${AMBER}' and screen_key not like 'panel_%'`,
    ),
  ),
  amberPanelInstrumentationEvents: Number(
    sql(
      `select count(*) from public.experience_screen_event where case_id='${AMBER}' and screen_key like 'panel_%'`,
    ),
  ),
  amberSupportActions: Number(
    sql(
      `select count(*) from public.experience_support_action where case_id='${AMBER}'`,
    ),
  ),
  serviceRoleDirectDmlGrants: Number(
    sql(`
select count(*) from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('experience_screen_event','experience_support_action')
  and grantee='service_role'
  and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')
`),
  ),
  authDmlGrants: Number(
    sql(`
select count(*) from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('experience_screen_event','experience_support_action')
  and grantee='authenticated'
  and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')
`),
  ),
  permissivePolicies: Number(
    sql(`
select count(*) from pg_policies
where tablename in ('experience_screen_event','experience_support_action')
  and (qual='true' or with_check='true')
`),
  ),
  eventHistoryMutations: 0,
};

const eventId = sql(
  `select id::text from public.experience_screen_event limit 1`,
);
const actionId = sql(
  `select id::text from public.experience_support_action limit 1`,
);

if (eventId) {
  if (
    probe(
      "upd_event",
      `begin; select set_config('eve.experience_rpc','1',true); update public.experience_screen_event set request_id='x' where id='${eventId}'; rollback;`,
    )
  )
    metrics.eventHistoryMutations += 1;
  if (
    probe(
      "del_event",
      `begin; select set_config('eve.experience_rpc','1',true); delete from public.experience_screen_event where id='${eventId}'; rollback;`,
    )
  )
    metrics.eventHistoryMutations += 1;
  if (
    probe(
      "trunc_event",
      `begin; truncate public.experience_screen_event; rollback;`,
    )
  )
    metrics.eventHistoryMutations += 1;
}

if (actionId) {
  if (
    probe(
      "upd_action",
      `begin; select set_config('eve.experience_rpc','1',true); update public.experience_support_action set reason_code='x' where id='${actionId}'; rollback;`,
    )
  )
    metrics.eventHistoryMutations += 1;
  if (
    probe(
      "del_action",
      `begin; select set_config('eve.experience_rpc','1',true); delete from public.experience_support_action where id='${actionId}'; rollback;`,
    )
  )
    metrics.eventHistoryMutations += 1;
}

const ok =
  metrics.amberExperienceEvents === 0 &&
  metrics.amberSupportActions === 0 &&
  metrics.serviceRoleDirectDmlGrants === 0 &&
  metrics.authDmlGrants === 0 &&
  metrics.permissivePolicies === 0 &&
  metrics.eventHistoryMutations === 0;

console.log(JSON.stringify({ ok, ...metrics }, null, 2));
process.exitCode = ok ? 0 : 1;

function loadEnv(rootDir) {
  try {
    for (const line of readFileSync(resolve(rootDir, ".env.local"), "utf8").split(
      /\r?\n/,
    )) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    /* optional */
  }
}
