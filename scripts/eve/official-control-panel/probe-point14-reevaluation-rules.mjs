#!/usr/bin/env node
/**
 * Active RPC probes for reevaluation separation (§14).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
loadEnv(root);
const env = resolveEnv(root);
const admin = createClient(env.url, env.key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const COMPANY = "a1400014-0000-4000-8000-000000000001";
const CASE_ID = "a1400014-0000-4000-8000-000000000004";

async function main() {
  // Ensure seed structure exists
  spawnSync(
    "node",
    ["--env-file=.env.local", "scripts/eve/official-control-panel/seed-point14-parallel-production-test.mjs"],
    { cwd: root, encoding: "utf8", shell: true },
  );

  const pkgId = randomUUID();
  const findingId = randomUUID();

  await mustOk(
    admin.rpc("eve_create_parallel_production_package", {
      p_company_id: COMPANY,
      p_case_id: CASE_ID,
      p_package_ref: `PP-PROBE-${pkgId.slice(0, 8)}`,
      p_actor_label: "probe",
      p_package_id: pkgId,
      p_readiness_status: "ready",
    }),
    "create",
  );

  // Drive package to with_findings quickly then open finding on a findings case instead —
  // use findings case for open findings without breaking satisfied case current package.
  // Recreate on findings case:
  const findingsCase = "a1400014-0000-4000-8000-000000000003";
  const pkg2 = randomUUID();
  await mustOk(
    admin.rpc("eve_create_parallel_production_package", {
      p_company_id: COMPANY,
      p_case_id: findingsCase,
      p_package_ref: `PP-PROBE-F-${pkg2.slice(0, 8)}`,
      p_actor_label: "probe",
      p_package_id: pkg2,
      p_readiness_status: "ready",
    }),
    "create2",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_transition", {
      p_package_id: pkg2,
      p_after_status: "validated",
      p_actor_label: "probe",
      p_event_type: "package_validated",
    }),
    "validated",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_transition", {
      p_package_id: pkg2,
      p_after_status: "processing",
      p_actor_label: "probe",
      p_event_type: "processing_started",
      p_source_bundle_ref: "mdsb://probe",
      p_candidates_ref: "c://probe",
      p_facts_ref: "f://probe",
      p_registries_ref: "r://probe",
      p_ir_ref: "ir://probe",
      p_inventory_ref: "inv://probe",
    }),
    "processing",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_transition", {
      p_package_id: pkg2,
      p_after_status: "with_findings",
      p_actor_label: "probe",
      p_event_type: "findings_opened",
      p_reason: "probe",
      p_aca_status: "WithFindings",
      p_conformance_status: "failed",
      p_consistency_composite_status: "failed",
      p_export_eligibility: "blocked",
      p_rework_process_code: "P-SUP-06",
    }),
    "with_findings",
  );

  await mustOk(
    admin.rpc("eve_open_parallel_production_finding", {
      p_package_id: pkg2,
      p_finding_type: "conformance",
      p_evidence_ref: "ev://probe",
      p_origin: "probe",
      p_actor_label: "probe",
      p_finding_id: findingId,
      p_affected_model: "PM",
      p_severity: "warning",
      p_blocking: false,
    }),
    "open_finding",
  );

  // Path to reevaluation_started
  await mustOk(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "rework_requested",
      p_actor_label: "probe",
      p_event_type: "rework_requested",
      p_reason: "probe",
    }),
    "rework_requested",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "rework_started",
      p_actor_label: "probe",
      p_event_type: "rework_started",
    }),
    "rework_started",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "rework_submitted",
      p_actor_label: "probe",
      p_event_type: "rework_submitted",
      p_evidence_ref: "ev://rework",
    }),
    "rework_submitted",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "reevaluation_started",
      p_actor_label: "probe",
      p_event_type: "reevaluation_started",
      p_evidence_ref: "ev://rework",
    }),
    "reevaluation_started",
  );

  // Flag must remain false after started
  const { data: afterStart } = await admin
    .from("parallel_production_qa_finding")
    .select("reevaluation_completed,finding_status")
    .eq("id", findingId)
    .single();
  if (afterStart?.reevaluation_completed === true) {
    throw new Error("reevaluation_started_marked_completed");
  }
  if (afterStart?.finding_status !== "reevaluation_started") {
    throw new Error("unexpected_status_after_start");
  }

  // started → resolved must fail
  await mustFail(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "resolved",
      p_actor_label: "probe",
      p_event_type: "finding_resolved",
      p_resolution_ref: "res://x",
    }),
    "started_to_resolved",
  );

  // completed without result must fail
  await mustFail(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "reevaluation_completed",
      p_actor_label: "probe",
      p_event_type: "reevaluation_completed",
      p_evidence_ref: "ev://qa",
    }),
    "completed_without_result",
  );

  // unsatisfactory completion then resolve must fail
  await mustOk(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "reevaluation_completed",
      p_actor_label: "probe",
      p_event_type: "reevaluation_completed",
      p_evidence_ref: "ev://qa",
      p_reevaluation_result: "unsatisfactory",
      p_reevaluation_result_ref: "qa://bad",
      p_reevaluation_evaluation_ref: "eval://bad",
    }),
    "completed_unsatisfactory",
  );
  await mustFail(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingId,
      p_after_status: "resolved",
      p_actor_label: "probe",
      p_event_type: "finding_resolved",
      p_resolution_ref: "res://x",
    }),
    "resolve_after_unsatisfactory",
  );

  // New finding for satisfactory path
  const findingOk = randomUUID();
  await mustOk(
    admin.rpc("eve_open_parallel_production_finding", {
      p_package_id: pkg2,
      p_finding_type: "factual_consistency",
      p_evidence_ref: "ev://ok",
      p_origin: "probe",
      p_actor_label: "probe",
      p_finding_id: findingOk,
      p_blocking: false,
    }),
    "open_ok",
  );
  for (const step of [
    ["rework_requested", "rework_requested", { p_reason: "r" }],
    ["rework_started", "rework_started", {}],
    ["rework_submitted", "rework_submitted", { p_evidence_ref: "ev://rw" }],
    ["reevaluation_started", "reevaluation_started", { p_evidence_ref: "ev://rw" }],
    [
      "reevaluation_completed",
      "reevaluation_completed",
      {
        p_evidence_ref: "ev://qa",
        p_reevaluation_result: "satisfactory",
        p_reevaluation_result_ref: "qa://ok",
        p_reevaluation_evaluation_ref: "eval://ok",
      },
    ],
    ["resolved", "finding_resolved", { p_resolution_ref: "res://ok" }],
  ]) {
    await mustOk(
      admin.rpc("eve_apply_parallel_production_finding_transition", {
        p_finding_id: findingOk,
        p_after_status: step[0],
        p_actor_label: "probe",
        p_event_type: step[1],
        ...step[2],
      }),
      step[0],
    );
  }

  // Reopen preserves resolution
  await mustOk(
    admin.rpc("eve_apply_parallel_production_finding_transition", {
      p_finding_id: findingOk,
      p_after_status: "reopened",
      p_actor_label: "probe",
      p_event_type: "finding_reopened",
      p_reason: "reopen",
    }),
    "reopened",
  );
  const { data: reopened } = await admin
    .from("parallel_production_qa_finding")
    .select("resolution_ref,reevaluation_completed,reevaluation_result")
    .eq("id", findingOk)
    .single();
  if (reopened?.resolution_ref !== "res://ok") {
    throw new Error("reopen_lost_resolution");
  }
  if (reopened?.reevaluation_completed !== true) {
    throw new Error("reopen_lost_reevaluation");
  }

  // Drive a clean package with an open finding toward satisfied → must fail
  const pkgQa = randomUUID();
  await mustOk(
    admin.rpc("eve_create_parallel_production_package", {
      p_company_id: COMPANY,
      p_case_id: findingsCase,
      p_package_ref: `PP-PROBE-QA-${pkgQa.slice(0, 8)}`,
      p_actor_label: "probe",
      p_package_id: pkgQa,
      p_readiness_status: "ready",
    }),
    "create_qa",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_transition", {
      p_package_id: pkgQa,
      p_after_status: "validated",
      p_actor_label: "probe",
      p_event_type: "package_validated",
    }),
    "qa_validated",
  );
  await mustOk(
    admin.rpc("eve_apply_parallel_production_transition", {
      p_package_id: pkgQa,
      p_after_status: "processing",
      p_actor_label: "probe",
      p_event_type: "processing_started",
      p_source_bundle_ref: "mdsb://qa",
      p_candidates_ref: "c://qa",
      p_facts_ref: "f://qa",
      p_registries_ref: "r://qa",
      p_ir_ref: "ir://qa",
      p_inventory_ref: "inv://qa",
    }),
    "qa_processing",
  );
  const findingOpen = randomUUID();
  await mustOk(
    admin.rpc("eve_open_parallel_production_finding", {
      p_package_id: pkgQa,
      p_finding_type: "conformance",
      p_evidence_ref: "ev://open",
      p_origin: "probe",
      p_actor_label: "probe",
      p_finding_id: findingOpen,
      p_blocking: true,
    }),
    "qa_open_finding",
  );
  await mustFail(
    admin.rpc("eve_apply_parallel_production_transition", {
      p_package_id: pkgQa,
      p_after_status: "satisfied",
      p_actor_label: "probe",
      p_event_type: "qa_satisfied",
      p_aca_status: "Satisfied",
      p_conformance_status: "passed",
      p_consistency_composite_status: "passed",
      p_b3_route_exception: false,
      p_b7_boundary_violation: false,
    }),
    "qa_satisfied_with_open_finding",
  );

  // Restore deterministic OpVal seed for Playwright / verifier
  const reseed = spawnSync(
    "node",
    [
      "--env-file=.env.local",
      "scripts/eve/official-control-panel/seed-point14-parallel-production-test.mjs",
    ],
    { cwd: root, encoding: "utf8", shell: true },
  );
  if (reseed.status !== 0) {
    throw new Error(`reseed_failed:${reseed.stderr || reseed.stdout}`);
  }

  console.log(JSON.stringify({ ok: true, probes: "passed" }));
}

async function mustOk(promise, label) {
  const { error } = await promise;
  if (error) throw new Error(`${label}:${error.message}`);
}

async function mustFail(promise, label) {
  const { error } = await promise;
  if (!error) throw new Error(`expected_fail_${label}`);
}

function loadEnv(root) {
  try {
    for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    /* optional */
  }
}

function resolveEnv(root) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key) {
    const st = spawnSync("npx", ["supabase", "status", "-o", "env"], {
      cwd: root,
      encoding: "utf8",
      shell: true,
    });
    const m = /SERVICE_ROLE_KEY=(.+)/.exec(`${st.stdout}\n${st.stderr}`);
    if (!m) throw new Error("missing_service_role");
    key = m[1].trim().replace(/^"|"$/g, "");
  }
  return { url, key };
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: String(e.message || e) }));
  process.exit(1);
});
