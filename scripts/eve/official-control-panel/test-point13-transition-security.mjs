#!/usr/bin/env node
/**
 * §13 active integrity probes: transition↔event, service_role DML, rollback gate.
 * Usage: node --env-file=.env.local scripts/eve/official-control-panel/test-point13-transition-security.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
loadEnvLocal();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
let serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
if (!serviceKey) {
  const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
    cwd: projectRoot,
    encoding: "utf8",
    shell: true,
  });
  const m = /SERVICE_ROLE_KEY=(.+)/.exec(status.stdout || "");
  if (m) serviceKey = m[1].trim().replace(/^"|"$/g, "");
}
if (!url || !serviceKey || !anon) {
  console.error(JSON.stringify({ ok: false, error: "missing_env" }));
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CASE_ID = "a1300013-0000-4000-8000-000000000003";
const COMPANY = "a1300013-0000-4000-8000-000000000001";
const results = [];

function assert(name, cond, detail = "") {
  results.push({ name, ok: !!cond, detail });
  if (!cond) console.error(`FAIL ${name}: ${detail}`);
  else console.log(`PASS ${name}`);
}

function psql(sql) {
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
      "-t",
      "-A",
    ],
    { encoding: "utf8", input: sql },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "psql_failed");
  }
  return (r.stdout || "").trim();
}

async function main() {
  const workId = crypto.randomUUID();

  // Free unique current slot for P-SUP-03, open probe starter via postgres + GUC
  psql(`
begin;
select set_config('eve.manual_work_rpc', '1', true);
update public.manual_process_work_item
set is_current = false, updated_at = now()
where case_id = '${CASE_ID}' and process_code = 'P-SUP-03' and is_current;
insert into public.manual_process_work_item (
  id, company_id, case_id, process_code, manual_tracking_status, handoff_status, is_current, opened_at, version
) values (
  '${workId}', '${COMPANY}', '${CASE_ID}', 'P-SUP-03', 'not_ready', 'not_applicable', true, now(), 1
);
commit;
`);

  // Direct service_role DML must fail
  const directInsert = await admin.from("manual_process_work_item").insert({
    id: crypto.randomUUID(),
    company_id: COMPANY,
    case_id: CASE_ID,
    process_code: "P-SUP-03",
    manual_tracking_status: "not_ready",
    handoff_status: "not_applicable",
    is_current: false,
  });
  assert(
    "service_role_direct_insert_rejected",
    !!directInsert.error,
    directInsert.error?.message || "unexpected success",
  );

  // Valid triple accepted
  const okReady = await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "ready_to_start",
    p_actor_label: "probe",
    p_event_type: "work_ready",
  });
  assert("valid_triple_accepted", !okReady.error, okReady.error?.message);

  // Wrong event for valid status change
  const wrongEvent = await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "downloaded",
    p_actor_label: "probe",
    p_event_type: "work_ready",
  });
  assert(
    "wrong_event_rejected",
    !!wrongEvent.error &&
      /manual_work_transition_not_allowed/i.test(wrongEvent.error.message),
    wrongEvent.error?.message || "missing error",
  );

  // Event valid for another transition
  const otherEvent = await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "downloaded",
    p_actor_label: "probe",
    p_event_type: "manual_work_started",
  });
  assert(
    "event_for_other_transition_rejected",
    !!otherEvent.error &&
      /manual_work_transition_not_allowed/i.test(otherEvent.error.message),
    otherEvent.error?.message || "missing error",
  );

  // Illegal jump
  const jump = await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "accepted",
    p_actor_label: "probe",
    p_event_type: "output_accepted",
    p_acceptance_result_ref: "x",
  });
  assert(
    "illegal_jump_rejected",
    !!jump.error &&
      /manual_work_transition_not_allowed/i.test(jump.error.message),
    jump.error?.message || "missing error",
  );

  // Failed transition must not insert event
  const beforeCount = Number(
    psql(
      `select count(*) from public.manual_process_work_item_event where work_item_id = '${workId}';`,
    ),
  );
  await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "submitted",
    p_actor_label: "probe",
    p_event_type: "output_submitted",
    p_artifact_ref: "a",
  });
  const afterFailCount = Number(
    psql(
      `select count(*) from public.manual_process_work_item_event where work_item_id = '${workId}';`,
    ),
  );
  assert(
    "failed_transition_no_event",
    afterFailCount === beforeCount,
    `before=${beforeCount} after=${afterFailCount}`,
  );

  // Drive to accepted
  for (const step of [
    ["downloaded", "artifact_downloaded", {}],
    ["in_manual_work", "manual_work_started", {}],
    ["submitted", "output_submitted", { p_artifact_ref: "artifact://probe" }],
    [
      "accepted",
      "output_accepted",
      {
        p_acceptance_result_ref: "result://probe",
        p_after_handoff_status: "accepted",
        p_handoff_origin: "Probe origen",
        p_handoff_destination: "Probe destino",
      },
    ],
  ]) {
    const [status, event, extra] = step;
    const r = await admin.rpc("eve_apply_manual_work_transition", {
      p_work_item_id: workId,
      p_after_status: status,
      p_actor_label: "probe",
      p_event_type: event,
      ...extra,
    });
    assert(`path_${status}`, !r.error, r.error?.message);
  }

  const reopen = await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "in_manual_work",
    p_actor_label: "probe",
    p_event_type: "manual_work_started",
  });
  assert(
    "accepted_terminal",
    !!reopen.error && /manual_work_terminal_accepted/i.test(reopen.error.message),
    reopen.error?.message || "missing error",
  );

  // Sync check
  const sync = psql(`
select count(*)::text
from public.manual_process_work_item w
join lateral (
  select after_status
  from public.manual_process_work_item_event e
  where e.work_item_id = w.id
  order by occurred_at desc, created_at desc, id desc
  limit 1
) last on true
where w.id = '${workId}'
  and last.after_status is distinct from w.manual_tracking_status;
`);
  assert("event_work_item_synced", sync === "0", sync);

  // Authenticated cannot execute RPC
  const password = (process.env.EVE_UNIT2B_TEST_PASSWORD || "").trim();
  const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "point13-opval-a@example.invalid",
      password,
    }),
  });
  const session = await login.json();
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authRpc = await userClient.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "ready_to_start",
    p_actor_label: "auth",
    p_event_type: "work_ready",
  });
  assert("authenticated_rpc_denied", !!authRpc.error, authRpc.error?.message);

  // Rollback behavior
  const rb = spawnSync(
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
      "-f",
      "-",
    ],
    {
      encoding: "utf8",
      input: readFileSync(
        resolve(
          projectRoot,
          "scripts/eve/official-control-panel/rollback-point13-manual-work-preserve-data.sql",
        ),
        "utf8",
      ),
    },
  );
  assert("rollback_applied", rb.status === 0, rb.stderr || rb.stdout);

  const afterRb = await admin.rpc("eve_apply_manual_work_transition", {
    p_work_item_id: workId,
    p_after_status: "ready_to_start",
    p_actor_label: "probe",
    p_event_type: "work_ready",
  });
  assert(
    "rpc_rejected_after_rollback",
    !!afterRb.error,
    afterRb.error?.message || "unexpected success",
  );

  const historyAfter = Number(
    psql(
      `select count(*) from public.manual_process_work_item_event where work_item_id = '${workId}';`,
    ),
  );
  assert("history_preserved_after_rollback", historyAfter >= 4, String(historyAfter));

  const reapply = spawnSync(
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
      "-f",
      "-",
    ],
    {
      encoding: "utf8",
      input: readFileSync(
        resolve(
          projectRoot,
          "scripts/eve/official-control-panel/reapply-point13-manual-work-writes.sql",
        ),
        "utf8",
      ),
    },
  );
  assert("reapply_applied", reapply.status === 0, reapply.stderr || reapply.stdout);

  // Deactivate probe item so unique current index stays clean
  psql(`
begin;
select set_config('eve.manual_work_rpc', '1', true);
update public.manual_process_work_item set is_current = false where id = '${workId}';
commit;
`);

  // Restore operational seed for subsequent e2e
  const seed = spawnSync(
    "node",
    [
      "--env-file=.env.local",
      "scripts/eve/official-control-panel/seed-point13-manual-work-test.mjs",
    ],
    { cwd: projectRoot, encoding: "utf8", shell: true },
  );
  assert("seed_restored", seed.status === 0, seed.stderr || seed.stdout);

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }));
  process.exit(1);
});

function loadEnvLocal() {
  const path = resolve(projectRoot, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    process.env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
}
