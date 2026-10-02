#!/usr/bin/env node
/**
 * Verifier §13 — real metrics for transitions, append-only, permissive policies.
 * Usage: node --env-file=.env.local scripts/eve/official-control-panel/verify-point13-manual-work-integrity.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
loadEnvLocal();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
if (!key) {
  const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
    cwd: projectRoot,
    encoding: "utf8",
    shell: true,
  });
  const m = /SERVICE_ROLE_KEY=(.+)/.exec(status.stdout || "");
  if (m) key = m[1].trim().replace(/^"|"$/g, "");
}
if (!url || !key) {
  console.error(JSON.stringify({ status: "fail", error: "missing_env" }));
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const report = {
  status: "pass",
  invalidTransitions: 0,
  invalidTransitionIds: [],
  eventHistoryMutations: 0,
  eventMutationFailures: [],
  permissivePolicies: 0,
  permissivePolicyDetails: [],
  multipleCurrentItems: 0,
  eventsWithoutParent: 0,
  crossCaseEvents: 0,
  crossCompanyEvents: 0,
  crossProcessEvents: 0,
  acceptedWithoutResult: 0,
  submittedWithoutArtifact: 0,
  pendingHandoffWithoutDeadline: 0,
  pendingHandoffWithoutExpectedEvent: 0,
  blockedWithoutReason: 0,
};

const metricsSql = `
with rules as (
  select from_status, to_status, event_type
  from public.manual_work_transition_rules
  where enabled
),
events_ordered as (
  select
    e.*,
    row_number() over (partition by e.work_item_id order by e.occurred_at, e.created_at, e.id) as rn,
    lag(e.after_status) over (partition by e.work_item_id order by e.occurred_at, e.created_at, e.id) as prev_after
  from public.manual_process_work_item_event e
),
invalid_triple as (
  select e.id
  from events_ordered e
  left join rules r
    on r.from_status = e.before_status
   and r.to_status = e.after_status
   and r.event_type = e.event_type
  where r.event_type is null
),
discontinuity as (
  select e.id
  from events_ordered e
  where e.prev_after is not null
    and e.before_status is distinct from e.prev_after
),
final_mismatch as (
  select e.id
  from events_ordered e
  join public.manual_process_work_item w on w.id = e.work_item_id
  join lateral (
    select max(rn) as max_rn
    from events_ordered x
    where x.work_item_id = e.work_item_id
  ) m on true
  where e.rn = m.max_rn
    and e.after_status is distinct from w.manual_tracking_status
),
orphan as (
  select e.id
  from public.manual_process_work_item_event e
  left join public.manual_process_work_item w on w.id = e.work_item_id
  where w.id is null
),
cross_case as (
  select e.id
  from public.manual_process_work_item_event e
  join public.manual_process_work_item w on w.id = e.work_item_id
  where e.case_id is distinct from w.case_id
),
cross_company as (
  select e.id
  from public.manual_process_work_item_event e
  join public.manual_process_work_item w on w.id = e.work_item_id
  where e.company_id is distinct from w.company_id
),
cross_process as (
  select e.id
  from public.manual_process_work_item_event e
  join public.manual_process_work_item w on w.id = e.work_item_id
  where e.process_code is distinct from w.process_code
),
all_invalid as (
  select id from invalid_triple
  union select id from discontinuity
  union select id from final_mismatch
  union select id from cross_case
  union select id from cross_company
  union select id from cross_process
)
select jsonb_build_object(
  'invalidTransitionIds', coalesce((select jsonb_agg(id order by id) from all_invalid), '[]'::jsonb),
  'eventsWithoutParent', (select count(*)::int from orphan),
  'crossCaseEvents', (select count(*)::int from cross_case),
  'crossCompanyEvents', (select count(*)::int from cross_company),
  'crossProcessEvents', (select count(*)::int from cross_process)
);
`;

const metrics = JSON.parse(psqlJson(metricsSql));
const invalidIds = (metrics.invalidTransitionIds || []).map(String);
report.invalidTransitionIds = invalidIds.slice(0, 50);
report.invalidTransitions = invalidIds.length;
report.eventsWithoutParent = Number(metrics.eventsWithoutParent || 0);
report.crossCaseEvents = Number(metrics.crossCaseEvents || 0);
report.crossCompanyEvents = Number(metrics.crossCompanyEvents || 0);
report.crossProcessEvents = Number(metrics.crossProcessEvents || 0);

const { data: items, error: itemsErr } = await admin
  .from("manual_process_work_item")
  .select(
    "id, case_id, process_code, manual_tracking_status, handoff_status, artifact_ref, acceptance_result_ref, expected_handoff_at, expected_event, status_reason, is_current",
  )
  .eq("is_current", true);
if (itemsErr) throw itemsErr;

const byCaseProcess = new Map();
for (const row of items ?? []) {
  const keyCp = `${row.case_id}::${row.process_code}`;
  byCaseProcess.set(keyCp, (byCaseProcess.get(keyCp) ?? 0) + 1);
  if (row.manual_tracking_status === "accepted" && !row.acceptance_result_ref) {
    report.acceptedWithoutResult += 1;
  }
  if (row.manual_tracking_status === "submitted" && !row.artifact_ref) {
    report.submittedWithoutArtifact += 1;
  }
  if (row.handoff_status === "pending" && !row.expected_handoff_at) {
    report.pendingHandoffWithoutDeadline += 1;
  }
  if (row.handoff_status === "pending" && !row.expected_event) {
    report.pendingHandoffWithoutExpectedEvent += 1;
  }
  if (row.manual_tracking_status === "blocked" && !row.status_reason) {
    report.blockedWithoutReason += 1;
  }
}
for (const count of byCaseProcess.values()) {
  if (count > 1) report.multipleCurrentItems += count - 1;
}

const mutationProbe = psqlText(`
do $$
declare
  v_id uuid;
  v_failed int := 0;
  v_detail text := '';
begin
  select id into v_id from public.manual_process_work_item_event limit 1;
  if v_id is null then
    begin
      execute 'truncate public.manual_process_work_item_event';
      v_failed := v_failed + 1;
      v_detail := v_detail || 'truncate_succeeded;';
    exception when others then
      null;
    end;
    raise notice 'MUTATION_PROBE:%:%', v_failed, v_detail;
    return;
  end if;

  begin
    update public.manual_process_work_item_event
    set reason = coalesce(reason, '') || '_probe'
    where id = v_id;
    v_failed := v_failed + 1;
    v_detail := v_detail || 'update_succeeded;';
  exception when others then
    null;
  end;

  begin
    delete from public.manual_process_work_item_event where id = v_id;
    v_failed := v_failed + 1;
    v_detail := v_detail || 'delete_succeeded;';
  exception when others then
    null;
  end;

  begin
    execute 'truncate public.manual_process_work_item_event';
    v_failed := v_failed + 1;
    v_detail := v_detail || 'truncate_succeeded;';
  exception when others then
    null;
  end;

  raise notice 'MUTATION_PROBE:%:%', v_failed, v_detail;
end $$;
`);

const probeMatch = /MUTATION_PROBE:(\d+):(.*)/.exec(mutationProbe);
const mutationFailures = Number(probeMatch?.[1] ?? 1);
if (mutationFailures > 0) {
  report.eventHistoryMutations = mutationFailures;
  report.eventMutationFailures = String(probeMatch?.[2] || "probe_incomplete")
    .split(";")
    .filter(Boolean);
}

const triggerCfg = psqlText(`
select string_agg(tgname, ',')
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'manual_process_work_item_event'
  and not t.tgisinternal;
`);
for (const needed of [
  "trg_manual_work_event_forbid_update",
  "trg_manual_work_event_forbid_truncate",
  "trg_manual_work_event_governed_write",
]) {
  if (!triggerCfg.includes(needed)) {
    report.eventHistoryMutations += 1;
    report.eventMutationFailures.push(`missing_trigger:${needed}`);
  }
}

const permissiveSql = `
select coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb)
from (
  select
    n.nspname || '.' || c.relname as table_name,
    p.polname as policy_name,
    p.polcmd::text as command,
    coalesce(array_to_string(p.polroles::regrole[]::text[], ','), 'public') as roles,
    'policy' as kind
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('manual_process_work_item', 'manual_process_work_item_event')
    and (
      pg_get_expr(p.polqual, p.polrelid) = 'true'
      or pg_get_expr(p.polwithcheck, p.polrelid) = 'true'
      or p.polcmd in ('a', 'w', 'd', '*')
    )
  union all
  select
    n.nspname || '.' || c.relname,
    null,
    'rls_disabled',
    null,
    'rls'
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('manual_process_work_item', 'manual_process_work_item_event')
    and c.relrowsecurity is not true
  union all
  select
    n.nspname || '.' || c.relname,
    null,
    acl.privilege_type,
    acl.grantee::text,
    'grant'
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join lateral aclexplode(c.relacl) acl
  where n.nspname = 'public'
    and c.relname in ('manual_process_work_item', 'manual_process_work_item_event')
    and acl.grantee in ('authenticated'::regrole, 'anon'::regrole, 'service_role'::regrole)
    and acl.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
) x;
`;

const permissive = JSON.parse(psqlJson(permissiveSql));
report.permissivePolicyDetails = (permissive || []).map((row) => ({
  table: row.table_name,
  policy: row.policy_name,
  command: row.command,
  role: row.roles,
  kind: row.kind,
}));
report.permissivePolicies = report.permissivePolicyDetails.length;

const failed =
  report.invalidTransitions > 0 ||
  report.eventHistoryMutations > 0 ||
  report.permissivePolicies > 0 ||
  report.multipleCurrentItems > 0 ||
  report.eventsWithoutParent > 0 ||
  report.crossCaseEvents > 0 ||
  report.crossCompanyEvents > 0 ||
  report.crossProcessEvents > 0 ||
  report.acceptedWithoutResult > 0 ||
  report.submittedWithoutArtifact > 0 ||
  report.pendingHandoffWithoutDeadline > 0 ||
  report.pendingHandoffWithoutExpectedEvent > 0 ||
  report.blockedWithoutReason > 0;

report.status = failed ? "fail" : "pass";
console.log(JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);

function psqlJson(sql) {
  const result = spawnSync(
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
      "-c",
      sql,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`psql_failed:${result.stderr || result.stdout}`);
  }
  const out = (result.stdout || "").trim();
  if (!out) return "null";
  return out;
}

function psqlText(sql) {
  const result = spawnSync(
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
    ],
    { encoding: "utf8", input: sql },
  );
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

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
