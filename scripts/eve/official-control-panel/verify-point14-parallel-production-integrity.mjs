#!/usr/bin/env node
/**
 * §14 integrity verifier — continuity, reevaluation completion, append-only probes.
 */
import { spawnSync } from "node:child_process";

const METRICS_SQL = `
with ordered_pkg as (
  select
    e.package_id,
    e.id,
    e.before_status,
    e.after_status,
    e.case_id,
    e.company_id,
    row_number() over (
      partition by e.package_id
      order by e.occurred_at asc, e.id asc
    ) as rn
  from public.parallel_production_package_event e
),
pkg_disc as (
  select count(*)::int as c
  from ordered_pkg a
  join ordered_pkg b
    on a.package_id = b.package_id and b.rn = a.rn + 1
  where a.after_status is distinct from b.before_status
),
pkg_mismatch as (
  select count(*)::int as c
  from public.parallel_production_package p
  where p.is_current
    and (
      select e.after_status
      from public.parallel_production_package_event e
      where e.package_id = p.id
      order by e.occurred_at desc, e.id desc
      limit 1
    ) is distinct from p.package_status
),
invalid_pkg_triplet as (
  select count(*)::int as c
  from public.parallel_production_package_event e
  where e.event_type <> 'package_received'
    and not exists (
      select 1 from public.parallel_production_transition_rules r
      where r.from_status = e.before_status
        and r.to_status = e.after_status
        and r.event_type = e.event_type
        and r.enabled
    )
),
ordered_finding as (
  select
    e.finding_id,
    e.package_id,
    e.id,
    e.before_status,
    e.after_status,
    e.case_id,
    e.company_id,
    e.event_type,
    row_number() over (
      partition by e.finding_id
      order by e.occurred_at asc, e.id asc
    ) as rn
  from public.parallel_production_qa_finding_event e
),
finding_disc as (
  select count(*)::int as c
  from ordered_finding a
  join ordered_finding b
    on a.finding_id = b.finding_id and b.rn = a.rn + 1
  where a.after_status is distinct from b.before_status
),
finding_mismatch as (
  select count(*)::int as c
  from public.parallel_production_qa_finding f
  where (
    select e.after_status
    from public.parallel_production_qa_finding_event e
    where e.finding_id = f.id
    order by e.occurred_at desc, e.id desc
    limit 1
  ) is distinct from f.finding_status
),
invalid_finding_triplet as (
  select count(*)::int as c
  from public.parallel_production_qa_finding_event e
  where e.event_type <> 'finding_opened'
    and not exists (
      select 1 from public.qa_finding_transition_rules r
      where r.from_status = e.before_status
        and r.to_status = e.after_status
        and r.event_type = e.event_type
        and r.enabled
    )
),
resolved_without_completed as (
  select count(*)::int as c
  from public.parallel_production_qa_finding f
  where f.finding_status = 'resolved'
    and (
      f.reevaluation_completed is not true
      or coalesce(f.reevaluation_result, '') is distinct from 'satisfactory'
      or nullif(btrim(f.reevaluation_result_ref), '') is null
      or nullif(btrim(f.reevaluation_evaluation_ref), '') is null
      or not exists (
        select 1
        from public.parallel_production_qa_finding_event e
        where e.finding_id = f.id
          and e.event_type = 'reevaluation_completed'
          and e.after_status = 'reevaluation_completed'
          and e.occurred_at < coalesce(f.resolved_at, now())
      )
    )
),
dml_grants as (
  select count(*)::int as c
  from information_schema.role_table_grants g
  where g.table_schema = 'public'
    and g.table_name in (
      'parallel_production_package',
      'parallel_production_package_event',
      'parallel_production_qa_finding',
      'parallel_production_qa_finding_event'
    )
    and g.grantee = 'service_role'
    and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
),
auth_dml as (
  select count(*)::int as c
  from information_schema.role_table_grants g
  where g.table_schema = 'public'
    and g.table_name in (
      'parallel_production_package',
      'parallel_production_package_event',
      'parallel_production_qa_finding',
      'parallel_production_qa_finding_event'
    )
    and g.grantee = 'authenticated'
    and g.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
),
permissive as (
  select count(*)::int as c
  from pg_policies p
  where p.tablename like 'parallel_production%'
    and (p.qual = 'true' or p.with_check = 'true')
)
select json_build_object(
  'invalidPackageTransitions', (select c from invalid_pkg_triplet),
  'invalidFindingTransitions', (select c from invalid_finding_triplet),
  'packageHistoryDiscontinuities', (select c from pkg_disc),
  'findingHistoryDiscontinuities', (select c from finding_disc),
  'packageCurrentStateMismatches', (select c from pkg_mismatch),
  'findingCurrentStateMismatches', (select c from finding_mismatch),
  'resolvedWithoutCompletedReevaluation', (select c from resolved_without_completed),
  'eventHistoryMutations', 0,
  'crossPackageFindingEvents', (
    select count(*)::int
    from public.parallel_production_qa_finding_event e
    join public.parallel_production_qa_finding f on f.id = e.finding_id
    where e.package_id is distinct from f.package_id
  ),
  'crossCaseEvents', (
    select count(*)::int from public.parallel_production_package_event e
    join public.parallel_production_package p on p.id = e.package_id
    where e.case_id is distinct from p.case_id
  ) + (
    select count(*)::int from public.parallel_production_qa_finding_event e
    join public.parallel_production_qa_finding f on f.id = e.finding_id
    where e.case_id is distinct from f.case_id
  ),
  'crossCompanyEvents', (
    select count(*)::int from public.parallel_production_package_event e
    join public.parallel_production_package p on p.id = e.package_id
    where e.company_id is distinct from p.company_id
  ) + (
    select count(*)::int from public.parallel_production_qa_finding_event e
    join public.parallel_production_qa_finding f on f.id = e.finding_id
    where e.company_id is distinct from f.company_id
  ),
  'permissivePolicies', (select c from permissive) + (select c from auth_dml),
  'serviceRoleDirectDmlGrants', (select c from dml_grants),
  'amberPackages', (
    select count(*)::int from public.parallel_production_package
    where case_id = '19fc9eff-4219-43f0-854c-e2b3350f23f2'
  )
);
`;

function psql(sql) {
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
      "-t",
      "-A",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { encoding: "utf8", input: sql },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "psql_failed");
  }
  return (result.stdout || "").trim();
}

function expectReject(sql, label) {
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
  const out = `${result.stderr || ""}\n${result.stdout || ""}`;
  const rejected =
    result.status !== 0 ||
    /ERROR:/i.test(out) ||
    /permission denied/i.test(out) ||
    /append_only/i.test(out) ||
    /forbidden/i.test(out);
  if (!rejected) throw new Error(`expected_reject_${label}`);
}

function main() {
  const pkgEvent = psql(
    `select id::text from public.parallel_production_package_event limit 1;`,
  ).replace(/\s+/g, "");
  const findingEvent = psql(
    `select id::text from public.parallel_production_qa_finding_event limit 1;`,
  ).replace(/\s+/g, "");

  let rejected = 0;
  const probes = [];
  if (pkgEvent) {
    probes.push(
      [
        "pkg_update",
        `begin; select set_config('eve.pp_rpc','1',true); update public.parallel_production_package_event set reason='x' where id='${pkgEvent}'; rollback;`,
      ],
      [
        "pkg_delete",
        `begin; select set_config('eve.pp_rpc','1',true); delete from public.parallel_production_package_event where id='${pkgEvent}'; rollback;`,
      ],
      [
        "pkg_truncate",
        `begin; truncate public.parallel_production_package_event; rollback;`,
      ],
    );
  }
  if (findingEvent) {
    probes.push(
      [
        "finding_update",
        `begin; select set_config('eve.pp_rpc','1',true); update public.parallel_production_qa_finding_event set reason='x' where id='${findingEvent}'; rollback;`,
      ],
      [
        "finding_delete",
        `begin; select set_config('eve.pp_rpc','1',true); delete from public.parallel_production_qa_finding_event where id='${findingEvent}'; rollback;`,
      ],
      [
        "finding_truncate",
        `begin; truncate public.parallel_production_qa_finding_event; rollback;`,
      ],
    );
  }

  for (const [label, sql] of probes) {
    expectReject(sql, label);
    rejected += 1;
  }

  expectReject(
    `begin; set local role service_role; insert into public.parallel_production_package (id, company_id, case_id, package_ref, package_status) values (gen_random_uuid(), 'a1400014-0000-4000-8000-000000000001', 'a1400014-0000-4000-8000-000000000003', 'probe', 'received'); rollback;`,
    "service_role_insert_package",
  );

  const metrics = JSON.parse(psql(METRICS_SQL));
  const expectedProbes = probes.length;
  metrics.eventHistoryMutations =
    expectedProbes === 0 || rejected === expectedProbes ? 0 : 1;

  const ok =
    metrics.invalidPackageTransitions === 0 &&
    metrics.invalidFindingTransitions === 0 &&
    metrics.packageHistoryDiscontinuities === 0 &&
    metrics.findingHistoryDiscontinuities === 0 &&
    metrics.packageCurrentStateMismatches === 0 &&
    metrics.findingCurrentStateMismatches === 0 &&
    metrics.resolvedWithoutCompletedReevaluation === 0 &&
    metrics.eventHistoryMutations === 0 &&
    metrics.crossPackageFindingEvents === 0 &&
    metrics.crossCaseEvents === 0 &&
    metrics.crossCompanyEvents === 0 &&
    metrics.permissivePolicies === 0 &&
    metrics.serviceRoleDirectDmlGrants === 0 &&
    metrics.amberPackages === 0;

  const out = { ok, ...metrics };
  console.log(JSON.stringify(out, null, 2));
  if (!ok) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
}
