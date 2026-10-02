#!/usr/bin/env node
/**
 * R2 verifier — artifact integrity, security scope, concurrency, Amber isolation.
 * Usage: node --env-file=.env.local scripts/eve/official-control-panel/verify-r2-manual-actions-integrity.mjs
 */
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const REPORT_DIR = resolve(
  projectRoot,
  "reports/local/rector-r2-manual-actions/results",
);
const REPORT_PATH = resolve(REPORT_DIR, "verifier.json");
const FX08_MANIFEST = resolve(
  projectRoot,
  "reports/local/rector-r2-fx08/manifest.json",
);

const AMBER_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const FX08_CASE_A = "a2080008-0000-4000-8000-000000000003";
const FX08_CASE_B = "a2080008-0000-4000-8000-000000000013";
const FX08_COMPANY = "a2080008-0000-4000-8000-000000000001";
const EMAIL_A = "fx08-r2-consultant-a@example.invalid";

loadEnvLocal();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const password = (process.env.EVE_UNIT2B_TEST_PASSWORD || "").trim();
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
  const out = { ok: false, error: "missing_env" };
  writeReport(out);
  console.error(JSON.stringify(out));
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const report = {
  ok: true,
  checkedAt: new Date().toISOString(),
  amberCaseId: AMBER_CASE,
  invalidManualTransitions: 0,
  manualHistoryMutations: 0,
  acceptedWithoutSubmittedArtifact: 0,
  acceptedArtifactVersionMismatches: 0,
  submittedWithoutArtifact: 0,
  duplicateIdempotencyEvents: 0,
  crossCompanyManualActions: 0,
  crossCaseManualActions: 0,
  unauthorizedAcceptanceEvents: 0,
  directAuthenticatedDmlGrants: 0,
  serviceRoleDirectDmlGrants: 0,
  orphanManualArtifacts: 0,
  checksumMissing: 0,
  amberManualWorkItems: 0,
  amberManualArtifacts: 0,
  syntheticInputPackages: 0,
  downloadedWithoutInputArtifact: 0,
  downloadedWithoutValidBlob: 0,
  downloadActionsWithoutAudit: 0,
  attachFromInvalidStatus: 0,
  attachWithoutVersionIncrement: 0,
  productActionsWithoutAudit: 0,
  idempotencyConcurrencyFailures: 0,
  truncateHistoryMutations: 0,
  publicSecurityDefinerHelperGrants: 0,
  authenticatedUnsafeHelperGrants: 0,
  crossPathCaseManualActions: 0,
  crossPathCaseDownloads: 0,
  clientSuppliedRequestHashAccepted: 0,
  invalidArtifactContentTypes: 0,
  details: {},
};

try {
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
all_invalid as (
  select id from invalid_triple
  union select id from discontinuity
  union select id from final_mismatch
),
accepted_no_submitted as (
  select count(*)::int as c
  from public.manual_process_work_item w
  where w.is_current
    and w.manual_tracking_status = 'accepted'
    and w.submitted_artifact_version_id is null
),
accepted_mismatch as (
  select count(*)::int as c
  from public.manual_process_work_item w
  where w.is_current
    and w.manual_tracking_status = 'accepted'
    and w.accepted_artifact_version_id is distinct from w.submitted_artifact_version_id
),
submitted_no_art as (
  select count(*)::int as c
  from public.manual_process_work_item w
  where w.is_current
    and w.manual_tracking_status = 'submitted'
    and (w.submitted_artifact_version_id is null or w.artifact_ref is null or btrim(w.artifact_ref) = '')
),
dup_idempotency as (
  select coalesce(sum(cnt - 1), 0)::int as c
  from (
    select consultant_user_id, idempotency_key, count(*) as cnt
    from public.manual_work_action_idempotency
    group by consultant_user_id, idempotency_key
    having count(*) > 1
  ) d
),
cross_company as (
  select count(*)::int as c
  from public.manual_work_artifact_version a
  join public.manual_process_work_item w on w.id = a.work_item_id
  where a.company_id is distinct from w.company_id
),
cross_case as (
  select count(*)::int as c
  from public.manual_work_artifact_version a
  join public.manual_process_work_item w on w.id = a.work_item_id
  where a.case_id is distinct from w.case_id
),
unauthorized_accept as (
  select count(*)::int as c
  from public.manual_work_action_idempotency i
  join public.manual_process_work_item w on w.id = i.work_item_id
  where i.action = 'accept_output'
    and not exists (
      select 1
      from public.eve_consultant_panel_capability_grant g
      where g.consultant_user_id = i.consultant_user_id
        and g.client_company_id = w.company_id
        and g.capability = 'accept_manual_output'
        and g.status = 'enabled'
    )
),
orphan_art as (
  select count(*)::int as c
  from public.manual_work_artifact_version a
  left join public.manual_process_work_item w on w.id = a.work_item_id
  where w.id is null
),
checksum_bad as (
  select count(*)::int as c
  from public.manual_work_artifact_version a
  join public.manual_work_artifact_blob b on b.artifact_version_id = a.id
  where a.sha256 is null
     or a.sha256 !~ '^[a-f0-9]{64}$'
     or lower(a.sha256) is distinct from encode(digest(b.content, 'sha256'), 'hex')
),
amber_items as (
  select count(*)::int as c
  from public.manual_process_work_item w
  where w.case_id = '${AMBER_CASE}'::uuid
    and w.is_current
),
amber_arts as (
  select count(*)::int as c
  from public.manual_work_artifact_version a
  where a.case_id = '${AMBER_CASE}'::uuid
),
auth_dml as (
  select count(*)::int as c
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
  where n.nspname = 'public'
    and c.relname in (
      'manual_work_artifact_version',
      'manual_work_artifact_blob',
      'manual_work_action_idempotency',
      'manual_work_product_action_event'
    )
    and acl.grantee = 'authenticated'::regrole
    and acl.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
),
service_dml as (
  select count(*)::int as c
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
  where n.nspname = 'public'
    and c.relname in (
      'manual_work_artifact_version',
      'manual_work_artifact_blob',
      'manual_work_action_idempotency',
      'manual_work_product_action_event'
    )
    and acl.grantee = 'service_role'::regrole
    and acl.privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
),
synthetic_input as (
  select count(*)::int as c
  from public.manual_process_work_item w
  join lateral (
    select a.*
    from public.manual_work_artifact_version a
    where a.work_item_id = w.id
      and a.artifact_kind = 'input_package'
    order by a.version_number desc
    limit 1
  ) a on true
  where w.is_current
    and (
      a.sanitized_filename = 'paquete-fuente.bin'
      or a.storage_reference like 'manual://input/%'
      or not exists (
        select 1 from public.manual_work_artifact_blob b
        where b.artifact_version_id = a.id
          and b.content is not null
          and octet_length(b.content) > 0
          and lower(a.sha256) = encode(digest(b.content, 'sha256'), 'hex')
      )
    )
),
downloaded_no_input as (
  select count(*)::int as c
  from public.manual_process_work_item w
  where w.is_current
    and w.manual_tracking_status = 'downloaded'
    and not exists (
      select 1 from public.manual_work_artifact_version a
      where a.work_item_id = w.id and a.artifact_kind = 'input_package'
    )
),
downloaded_no_blob as (
  select count(*)::int as c
  from public.manual_process_work_item w
  where w.is_current
    and w.manual_tracking_status in ('downloaded', 'in_manual_work', 'submitted', 'accepted', 'review_required')
    and public.eve_manual_work_latest_valid_input_package_id(w.id) is null
    and exists (
      select 1 from public.manual_work_product_action_event p
      where p.work_item_id = w.id and p.action = 'download_package'
    )
),
download_no_audit as (
  select count(*)::int as c
  from public.manual_work_action_idempotency i
  where i.action = 'download_package'
    and not exists (
      select 1 from public.manual_work_product_action_event p
      where p.idempotency_key = i.idempotency_key
        and p.actor_id = i.consultant_user_id
        and p.action = 'download_package'
    )
),
attach_invalid_status as (
  select count(*)::int as c
  from public.manual_work_product_action_event p
  where p.action = 'attach_output'
    and p.before_status not in ('in_manual_work', 'review_required')
),
attach_no_version_bump as (
  select count(*)::int as c
  from public.manual_work_product_action_event p
  where p.action = 'attach_output'
    and p.after_version <= p.before_version
),
product_actions_no_audit as (
  select count(*)::int as c
  from public.manual_work_action_idempotency i
  where i.action in (
      'download_package', 'register_start', 'attach_output',
      'submit_review', 'accept_output'
    )
    and not exists (
      select 1 from public.manual_work_product_action_event p
      where p.idempotency_key = i.idempotency_key
        and p.actor_id = i.consultant_user_id
        and p.action = i.action
    )
),
helper_grants_public as (
  select count(*)::int as c
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'eve_manual_work_latest_valid_input_package_id',
      'eve_manual_work_latest_valid_input_package',
      'eve_manual_work_validate_attach_bytes'
    )
    and (
      has_function_privilege('public', p.oid, 'EXECUTE')
      or has_function_privilege('anon', p.oid, 'EXECUTE')
    )
),
helper_grants_auth as (
  select count(*)::int as c
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'eve_manual_work_latest_valid_input_package_id',
      'eve_manual_work_latest_valid_input_package',
      'eve_manual_work_validate_attach_bytes'
    )
    and has_function_privilege('authenticated', p.oid, 'EXECUTE')
),
client_hash_param as (
  select count(*)::int as c
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'eve_apply_manual_work_product_action_as_consultant',
      'eve_download_manual_work_input_package_as_consultant'
    )
    and pg_get_function_identity_arguments(p.oid) ilike '%request_hash%'
)
select jsonb_build_object(
  'invalidManualTransitions', (select count(*)::int from all_invalid),
  'acceptedWithoutSubmittedArtifact', (select c from accepted_no_submitted),
  'acceptedArtifactVersionMismatches', (select c from accepted_mismatch),
  'submittedWithoutArtifact', (select c from submitted_no_art),
  'duplicateIdempotencyEvents', (select c from dup_idempotency),
  'crossCompanyManualActions', (select c from cross_company),
  'crossCaseManualActions', (select c from cross_case),
  'unauthorizedAcceptanceEvents', (select c from unauthorized_accept),
  'directAuthenticatedDmlGrants', (select c from auth_dml),
  'serviceRoleDirectDmlGrants', (select c from service_dml),
  'orphanManualArtifacts', (select c from orphan_art),
  'checksumMissing', (select c from checksum_bad),
  'amberManualWorkItems', (select c from amber_items),
  'amberManualArtifacts', (select c from amber_arts),
  'syntheticInputPackages', (select c from synthetic_input),
  'downloadedWithoutInputArtifact', (select c from downloaded_no_input),
  'downloadedWithoutValidBlob', (select c from downloaded_no_blob),
  'downloadActionsWithoutAudit', (select c from download_no_audit),
  'attachFromInvalidStatus', (select c from attach_invalid_status),
  'attachWithoutVersionIncrement', (select c from attach_no_version_bump),
  'productActionsWithoutAudit', (select c from product_actions_no_audit),
  'publicSecurityDefinerHelperGrants', (select c from helper_grants_public),
  'authenticatedUnsafeHelperGrants', (select c from helper_grants_auth),
  'clientSuppliedRequestHashAccepted', (select c from client_hash_param)
);
`;

  const metrics = JSON.parse(psqlJson(metricsSql));
  for (const keyName of [
    "invalidManualTransitions",
    "acceptedWithoutSubmittedArtifact",
    "acceptedArtifactVersionMismatches",
    "submittedWithoutArtifact",
    "duplicateIdempotencyEvents",
    "crossCompanyManualActions",
    "crossCaseManualActions",
    "unauthorizedAcceptanceEvents",
    "directAuthenticatedDmlGrants",
    "serviceRoleDirectDmlGrants",
    "orphanManualArtifacts",
    "checksumMissing",
    "amberManualWorkItems",
    "amberManualArtifacts",
    "syntheticInputPackages",
    "downloadedWithoutInputArtifact",
    "downloadedWithoutValidBlob",
    "downloadActionsWithoutAudit",
    "attachFromInvalidStatus",
    "attachWithoutVersionIncrement",
    "productActionsWithoutAudit",
    "publicSecurityDefinerHelperGrants",
    "authenticatedUnsafeHelperGrants",
    "clientSuppliedRequestHashAccepted",
  ]) {
    report[keyName] = Number(metrics[keyName] || 0);
  }

  report.manualHistoryMutations = probeArtifactAppendOnly();
  report.truncateHistoryMutations = probeTruncateAppendOnly();

  const live = await runLiveSecurityProbes();
  report.crossPathCaseManualActions = live.crossPathCaseManualActions;
  report.crossPathCaseDownloads = live.crossPathCaseDownloads;
  report.invalidArtifactContentTypes = live.invalidArtifactContentTypes;
  report.idempotencyConcurrencyFailures = live.idempotencyConcurrencyFailures;
  report.clientSuppliedRequestHashAccepted += live.clientHashAuthorityLeaks;
  if (live.anonHelperExecutable) {
    report.publicSecurityDefinerHelperGrants += 1;
  }
  if (live.authHelperExecutable) {
    report.authenticatedUnsafeHelperGrants += 1;
  }
  report.details.liveSecurity = live.details;

  const criticalKeys = [
    "invalidManualTransitions",
    "manualHistoryMutations",
    "acceptedWithoutSubmittedArtifact",
    "acceptedArtifactVersionMismatches",
    "submittedWithoutArtifact",
    "duplicateIdempotencyEvents",
    "crossCompanyManualActions",
    "crossCaseManualActions",
    "unauthorizedAcceptanceEvents",
    "directAuthenticatedDmlGrants",
    "serviceRoleDirectDmlGrants",
    "orphanManualArtifacts",
    "checksumMissing",
    "amberManualWorkItems",
    "amberManualArtifacts",
    "syntheticInputPackages",
    "downloadedWithoutInputArtifact",
    "downloadedWithoutValidBlob",
    "downloadActionsWithoutAudit",
    "attachFromInvalidStatus",
    "attachWithoutVersionIncrement",
    "productActionsWithoutAudit",
    "idempotencyConcurrencyFailures",
    "truncateHistoryMutations",
    "publicSecurityDefinerHelperGrants",
    "authenticatedUnsafeHelperGrants",
    "crossPathCaseManualActions",
    "crossPathCaseDownloads",
    "clientSuppliedRequestHashAccepted",
    "invalidArtifactContentTypes",
  ];

  report.ok = criticalKeys.every((k) => report[k] === 0);
  report.details.criticalKeys = Object.fromEntries(
    criticalKeys.map((k) => [k, report[k]]),
  );
} catch (error) {
  report.ok = false;
  report.details.error =
    error instanceof Error ? error.message : String(error);
}

writeReport(report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

function writeReport(payload) {
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2));
}

async function runLiveSecurityProbes() {
  const details = {};
  const out = {
    crossPathCaseManualActions: 0,
    crossPathCaseDownloads: 0,
    invalidArtifactContentTypes: 0,
    idempotencyConcurrencyFailures: 0,
    clientHashAuthorityLeaks: 0,
    anonHelperExecutable: false,
    authHelperExecutable: false,
    details,
  };

  if (!anon || !password) {
    throw new Error("missing_anon_or_password_for_live_probes");
  }

  const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL_A, password }),
  });
  const session = await login.json();
  if (!session.access_token) {
    throw new Error(`fx08_consultant_a_login_failed:${JSON.stringify(session)}`);
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Helper denial via direct RPC as authenticated
  const helperId = await userClient.rpc(
    "eve_manual_work_latest_valid_input_package_id",
    { p_work_item_id: randomUUID() },
  );
  const helperPkg = await userClient.rpc(
    "eve_manual_work_latest_valid_input_package",
    { p_work_item_id: randomUUID() },
  );
  details.helperIdDenied = !!helperId.error;
  details.helperPkgDenied = !!helperPkg.error;
  if (!helperId.error || !helperPkg.error) {
    out.authHelperExecutable = true;
  }

  // Ensure FX-08 fixtures exist
  let manifest = null;
  if (existsSync(FX08_MANIFEST)) {
    manifest = JSON.parse(readFileSync(FX08_MANIFEST, "utf8"));
  }

  const caseA = manifest?.caseId || FX08_CASE_A;
  const caseB = manifest?.caseIdB || FX08_CASE_B;
  let workA =
    manifest?.workItems?.["P-SUP-03"]?.id ||
    psqlJson(
      `select id::text from public.manual_process_work_item where case_id='${caseA}'::uuid and is_current and process_code='P-SUP-03' limit 1;`,
    );
  let workB =
    manifest?.workItemsCaseB?.["P-SUP-03"]?.id ||
    psqlJson(
      `select id::text from public.manual_process_work_item where case_id='${caseB}'::uuid and is_current and process_code='P-SUP-03' limit 1;`,
    );
  let artB =
    manifest?.workItemsCaseB?.["P-SUP-03"]?.inputPackageArtifactId ||
    psqlJson(
      `select id::text from public.manual_work_artifact_version where case_id='${caseB}'::uuid and artifact_kind='input_package' order by version_number desc limit 1;`,
    );

  workA = String(workA || "").replace(/"/g, "");
  workB = String(workB || "").replace(/"/g, "");
  artB = String(artB || "").replace(/"/g, "");

  if (!workA || !workB || !artB) {
    throw new Error("fx08_cross_path_fixtures_missing_run_seed");
  }

  // Cross-path: URL case A + work item case B
  const crossAction = await userClient.rpc(
    "eve_apply_manual_work_product_action_as_consultant",
    {
      p_case_id: caseA,
      p_work_item_id: workB,
      p_action: "register_start",
      p_expected_status: "downloaded",
      p_expected_version: 1,
      p_idempotency_key: `probe-cross-action-${randomUUID()}`,
      p_reason: "cross-path-probe",
    },
  );
  details.crossActionDenied = !!crossAction.error;
  if (!crossAction.error) out.crossPathCaseManualActions += 1;

  const eventsBeforeCross = Number(
    psqlJson(
      `select count(*)::text from public.manual_work_product_action_event where work_item_id='${workB}'::uuid;`,
    ),
  );
  const ledgerBeforeCross = Number(
    psqlJson(
      `select count(*)::text from public.manual_work_action_idempotency where work_item_id='${workB}'::uuid;`,
    ),
  );
  void eventsBeforeCross;
  void ledgerBeforeCross;

  // Cross-path download: URL case A + artifact case B
  const crossDl = await userClient.rpc(
    "eve_download_manual_work_input_package_as_consultant",
    {
      p_case_id: caseA,
      p_work_item_id: workB,
      p_artifact_version_id: artB,
      p_expected_status: "ready_to_start",
      p_expected_version: 1,
      p_idempotency_key: `probe-cross-dl-${randomUUID()}`,
      p_reason: "cross-path-download",
    },
  );
  details.crossDownloadDenied = !!crossDl.error;
  if (!crossDl.error) out.crossPathCaseDownloads += 1;

  // Invalid attach content types / empty / extension / oversized
  const attachWork = await ensureProbeWorkItem(caseA, {
    status: "in_manual_work",
    processCode: "P-SUP-04",
    tag: "attach-policy",
  });
  details.attachWork = attachWork;

  const badAttaches = [
    {
      name: "empty",
      filename: "out.bin",
      contentType: "application/octet-stream",
      content: Buffer.alloc(0),
    },
    {
      name: "extension",
      filename: "malware.exe",
      contentType: "application/octet-stream",
      content: Buffer.from("x"),
    },
    {
      name: "contentType",
      filename: "out.bin",
      contentType: "application/x-msdownload",
      content: Buffer.from("x"),
    },
    {
      name: "tooLarge",
      filename: "out.bin",
      contentType: "application/octet-stream",
      content: Buffer.alloc(5_242_881, 1),
    },
  ];

  for (const bad of badAttaches) {
    const r = await userClient.rpc(
      "eve_apply_manual_work_product_action_as_consultant",
      {
        p_case_id: caseA,
        p_work_item_id: attachWork.workItemId,
        p_action: "attach_output",
        p_expected_status: attachWork.status,
        p_expected_version: attachWork.version,
        p_idempotency_key: `probe-bad-attach-${bad.name}-${randomUUID()}`,
        p_attach_filename: bad.filename,
        p_attach_content_type: bad.contentType,
        p_attach_content: `\\x${bad.content.toString("hex")}`,
      },
    );
    const denied = !!r.error;
    details[`attach_${bad.name}`] = denied ? r.error.message : "UNEXPECTED_OK";
    if (!denied) out.invalidArtifactContentTypes += 1;
  }

  // Fake client hash must not be an RPC authority parameter
  const hashWork = await ensureProbeWorkItem(caseA, {
    status: "downloaded",
    processCode: "P-SUP-05",
    tag: "hash-probe",
  });
  const hashProbeKey = `probe-fake-hash-${randomUUID()}`;
  const first = await userClient.rpc(
    "eve_apply_manual_work_product_action_as_consultant",
    {
      p_case_id: caseA,
      p_work_item_id: hashWork.workItemId,
      p_action: "register_start",
      p_expected_status: "downloaded",
      p_expected_version: hashWork.version,
      p_idempotency_key: hashProbeKey,
      p_reason: "hash-probe-a",
      p_request_hash: "deadbeef".repeat(8),
    },
  );
  if (
    first.error &&
    /could not find|unknown|p_request_hash/i.test(first.error.message || "")
  ) {
    details.clientHashParamRejectedByApi = true;
  } else if (!first.error) {
    // Extra keys ignored by PostgREST — ensure ledger hash is not deadbeef
    const storedHash = psqlJson(
      `select request_hash from public.manual_work_action_idempotency
       where idempotency_key='${hashProbeKey}' limit 1;`,
    ).replace(/"/g, "");
    details.storedHashAfterFakeClientHash = storedHash;
    if (storedHash === "deadbeef".repeat(8)) {
      out.clientHashAuthorityLeaks += 1;
    }
  }

  // Concurrency: same key + same payload
  const concWork = await ensureProbeWorkItem(caseA, {
    status: "downloaded",
    processCode: "P-SUP-05",
    tag: "concurrency-same",
  });
  const concKey = `probe-conc-same-${randomUUID()}`;
  const concArgs = {
    p_case_id: caseA,
    p_work_item_id: concWork.workItemId,
    p_action: "register_start",
    p_expected_status: "downloaded",
    p_expected_version: concWork.version,
    p_idempotency_key: concKey,
    p_reason: "concurrency-same",
  };
  const [c1, c2] = await Promise.all([
    userClient.rpc("eve_apply_manual_work_product_action_as_consultant", concArgs),
    userClient.rpc("eve_apply_manual_work_product_action_as_consultant", concArgs),
  ]);
  const sameOk = !c1.error && !c2.error;
  const sameResult =
    JSON.stringify(c1.data) === JSON.stringify(c2.data);
  const eventCount = Number(
    psqlJson(
      `select count(*)::text from public.manual_work_product_action_event
       where idempotency_key='${concKey}' and action='register_start';`,
    ),
  );
  const ledgerCount = Number(
    psqlJson(
      `select count(*)::text from public.manual_work_action_idempotency
       where idempotency_key='${concKey}';`,
    ),
  );
  details.concurrencySame = {
    sameOk,
    sameResult,
    eventCount,
    ledgerCount,
    e1: c1.error?.message,
    e2: c2.error?.message,
  };
  if (!sameOk || !sameResult || eventCount !== 1 || ledgerCount !== 1) {
    out.idempotencyConcurrencyFailures += 1;
  }

  // Concurrency: same key + different payload
  const concWork2 = await ensureProbeWorkItem(caseA, {
    status: "downloaded",
    processCode: "P-SUP-05",
    tag: "concurrency-conflict",
  });
  const concKey2 = `probe-conc-diff-${randomUUID()}`;
  const [d1, d2] = await Promise.all([
    userClient.rpc("eve_apply_manual_work_product_action_as_consultant", {
      p_case_id: caseA,
      p_work_item_id: concWork2.workItemId,
      p_action: "register_start",
      p_expected_status: "downloaded",
      p_expected_version: concWork2.version,
      p_idempotency_key: concKey2,
      p_reason: "reason-one",
    }),
    userClient.rpc("eve_apply_manual_work_product_action_as_consultant", {
      p_case_id: caseA,
      p_work_item_id: concWork2.workItemId,
      p_action: "register_start",
      p_expected_status: "downloaded",
      p_expected_version: concWork2.version,
      p_idempotency_key: concKey2,
      p_reason: "reason-two",
    }),
  ]);
  const msgs = [d1.error?.message || "", d2.error?.message || ""];
  const successes = [d1, d2].filter((x) => !x.error).length;
  const conflicts = msgs.filter((m) =>
    /idempotency_conflict/i.test(m),
  ).length;
  details.concurrencyDiff = {
    successes,
    conflicts,
    e1: d1.error?.message,
    e2: d2.error?.message,
  };
  if (!(successes === 1 && conflicts === 1)) {
    out.idempotencyConcurrencyFailures += 1;
  }

  // Helper denial also via anon key without session
  const anonClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anonHelper = await anonClient.rpc(
    "eve_manual_work_latest_valid_input_package_id",
    { p_work_item_id: randomUUID() },
  );
  details.anonHelperDenied = !!anonHelper.error;
  if (!anonHelper.error) {
    out.anonHelperExecutable = true;
  }

  return out;
}

function ensureProbeWorkItem(caseId, { status, processCode, tag }) {
  const workId = randomUUID();
  const artId = randomUUID();
  const content = `PROBE-${tag}-${workId}`;
  const sha = createHash("sha256").update(content).digest("hex");
  let uploadedBy = "1aa14ca3-dfe6-4802-a4de-80e81f71d306";
  if (existsSync(FX08_MANIFEST)) {
    try {
      const m = JSON.parse(readFileSync(FX08_MANIFEST, "utf8"));
      if (m?.consultants?.a?.userId) uploadedBy = m.consultants.a.userId;
    } catch {
      /* keep default */
    }
  }

  const result = psqlText(`
begin;
select set_config('eve.manual_work_rpc', '1', true);
update public.manual_process_work_item
set is_current = false, updated_at = now()
where case_id = '${caseId}'::uuid
  and process_code = '${processCode}'
  and is_current;
insert into public.manual_process_work_item (
  id, company_id, case_id, process_code,
  manual_tracking_status, handoff_status, is_current, opened_at,
  responsible_label, version, artifact_ref
) values (
  '${workId}', '${FX08_COMPANY}', '${caseId}'::uuid, '${processCode}',
  '${status}', 'not_applicable', true, now(),
  'Verifier probe', 1, 'test-only://probe/${artId}'
);
insert into public.manual_work_artifact_version (
  id, work_item_id, company_id, case_id, process_code,
  artifact_kind, version_number, storage_reference, sanitized_filename,
  content_type, size_bytes, sha256, uploaded_by
) values (
  '${artId}', '${workId}', '${FX08_COMPANY}', '${caseId}'::uuid, '${processCode}',
  'input_package', 1, 'test-only://probe/${artId}', 'probe-input.bin',
  'application/octet-stream', octet_length(convert_to('${content}', 'UTF8')),
  '${sha}', '${uploadedBy}'::uuid
);
insert into public.manual_work_artifact_blob (artifact_version_id, content)
values ('${artId}', convert_to('${content}', 'UTF8'));
commit;
`);
  if (/ERROR:/i.test(result)) {
    throw new Error(`ensure_probe_failed:${result}`);
  }

  return {
    workItemId: workId,
    status,
    version: 1,
    artifactId: artId,
  };
}

function probeArtifactAppendOnly() {
  const probe = psqlText(`
set client_min_messages to notice;
do $$
declare
  v_id uuid;
  v_key text;
  v_failed int := 0;
begin
  select id into v_id from public.manual_work_artifact_version limit 1;
  if v_id is not null then
    begin
      update public.manual_work_artifact_version
        set sanitized_filename = sanitized_filename
      where id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
    begin
      delete from public.manual_work_artifact_version where id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
  end if;

  select artifact_version_id into v_id from public.manual_work_artifact_blob limit 1;
  if v_id is not null then
    begin
      update public.manual_work_artifact_blob
        set content = content
      where artifact_version_id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
    begin
      delete from public.manual_work_artifact_blob where artifact_version_id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
  end if;

  select id into v_id from public.manual_process_work_item_event limit 1;
  if v_id is not null then
    begin
      update public.manual_process_work_item_event
        set reason = reason
      where id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
    begin
      delete from public.manual_process_work_item_event where id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
  end if;

  select id into v_id from public.manual_work_product_action_event limit 1;
  if v_id is not null then
    begin
      update public.manual_work_product_action_event
        set reason = reason
      where id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
    begin
      delete from public.manual_work_product_action_event where id = v_id;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
  end if;

  select idempotency_key into v_key
  from public.manual_work_action_idempotency
  limit 1;
  if v_key is not null then
    begin
      update public.manual_work_action_idempotency
        set action = action
      where idempotency_key = v_key;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
    begin
      delete from public.manual_work_action_idempotency
      where idempotency_key = v_key;
      v_failed := v_failed + 1;
    exception when others then null;
    end;
  end if;

  raise notice 'R2_MUTATION_PROBE:%', v_failed;
end $$;
`);
  const match = /R2_MUTATION_PROBE:(\d+)/.exec(probe);
  return Number(match?.[1] ?? 1);
}

function probeTruncateAppendOnly() {
  const tables = [
    "manual_work_artifact_version",
    "manual_work_artifact_blob",
    "manual_work_action_idempotency",
    "manual_work_product_action_event",
    "manual_process_work_item_event",
  ];
  let allowed = 0;
  for (const table of tables) {
    const out = psqlText(`
set client_min_messages to notice;
do $$
begin
  begin
    execute 'truncate table public.${table}';
    raise notice 'R2_TRUNCATE_ALLOWED:${table}';
  exception when others then
    raise notice 'R2_TRUNCATE_BLOCKED:${table}';
  end;
end $$;
`);
    if (/R2_TRUNCATE_ALLOWED:/.test(out)) allowed += 1;
  }
  return allowed;
}

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
