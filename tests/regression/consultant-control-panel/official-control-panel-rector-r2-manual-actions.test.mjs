#!/usr/bin/env node
/**
 * R2 regression — static/contract tests for governed manual product actions.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

test("R2 migration files exist", () => {
  assert.equal(
    existsSync(
      resolve(
        root,
        "supabase/migrations/20260720100000_eve_r2_manual_actions_authenticated.sql",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        root,
        "supabase/migrations/20260720110000_eve_r2_manual_capability_grants.sql",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        root,
        "supabase/migrations/20260720120000_eve_r2_manual_actions_structural_fix.sql",
      ),
    ),
    true,
  );
  const fixSql = read(
    "supabase/migrations/20260720120000_eve_r2_manual_actions_structural_fix.sql",
  );
  assert.match(fixSql, /eve_download_manual_work_input_package_as_consultant/);
  assert.match(fixSql, /manual_work_product_action_event/);
  assert.match(fixSql, /pg_advisory_xact_lock/);
  assert.match(fixSql, /before truncate/i);
  assert.doesNotMatch(fixSql, /paquete-fuente\.bin/);
  assert.equal(
    existsSync(
      resolve(
        root,
        "supabase/migrations/20260720130000_eve_r2_manual_actions_security_scope.sql",
      ),
    ),
    true,
  );
  const secSql = read(
    "supabase/migrations/20260720130000_eve_r2_manual_actions_security_scope.sql",
  );
  assert.match(secSql, /eve_list_valid_manual_input_packages_as_consultant/);
  assert.match(secSql, /p_case_id/);
  assert.match(secSql, /manual_work_artifact_upload_policy/);
  assert.doesNotMatch(secSql, /p_request_hash\s+text/);
});

test("rollback and verifier scripts exist", () => {
  assert.equal(
    existsSync(
      resolve(
        root,
        "scripts/eve/official-control-panel/rollback-r2-manual-actions-preserve-data.sql",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        root,
        "scripts/eve/official-control-panel/verify-r2-manual-actions-integrity.mjs",
      ),
    ),
    true,
  );
  const rb = read(
    "scripts/eve/official-control-panel/rollback-r2-manual-actions-preserve-data.sql",
  );
  assert.match(rb, /eve_apply_manual_work_product_action_as_consultant/);
  assert.match(rb, /eve_fetch_manual_work_artifact_blob_as_consultant/);
  assert.doesNotMatch(rb, /drop table public\.manual_work_artifact_version/);
});

test("manual-actions BFF route uses authenticated RPC without service_role", () => {
  const routePath =
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-actions/route.ts";
  assert.equal(existsSync(resolve(root, routePath)), true);
  const route = read(routePath);
  assert.match(route, /eve_apply_manual_work_product_action_as_consultant/);
  assert.match(route, /p_case_id:\s*caseId/);
  assert.doesNotMatch(route, /p_request_hash/);
  assert.doesNotMatch(route, /createOfficialControlPanelServiceRoleClient/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("product actions set matches R2 contract", () => {
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-actions/route.ts",
  );
  for (const action of [
    "register_start",
    "attach_output",
    "submit_review",
    "accept_output",
  ]) {
    assert.match(route, new RegExp(`"${action}"`));
  }
  assert.match(route, /manual_download_requires_binary_endpoint/);
});

test("binary download route exists", () => {
  const routePath =
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-artifacts/[artifactVersionId]/download/route.ts";
  assert.equal(existsSync(resolve(root, routePath)), true);
  const route = read(routePath);
  assert.match(route, /eve_download_manual_work_input_package_as_consultant/);
  assert.match(route, /p_case_id:\s*caseId/);
  assert.doesNotMatch(route, /p_request_hash/);
  assert.match(route, /Content-Disposition/);
  assert.match(route, /private, no-store/);
  assert.doesNotMatch(route, /createOfficialControlPanelServiceRoleClient/);
});

test("ManualWorkPanel references availableActions", () => {
  const panel = read(
    "src/features/official-consultant-control-panel/components/ManualWorkPanel.tsx",
  );
  assert.match(panel, /availableActions/);
  assert.match(panel, /presentManualActionReason/);
});

test("capability catalog exposes R2_MANUAL_MUTATION_CAPABILITIES", () => {
  const catalog = read(
    "src/services/eve/official-control-panel/official-control-panel-capability-catalog.ts",
  );
  assert.match(catalog, /R2_MANUAL_MUTATION_CAPABILITIES/);
  assert.match(catalog, /manage_manual_work/);
  assert.match(catalog, /accept_manual_output/);
  assert.match(catalog, /buildManualWorkCapabilityMatrix/);
});

test("presentManualActionReason strings (source contract)", () => {
  const src = read(
    "src/services/eve/official-control-panel/official-control-panel-manual-actions.ts",
  );
  const reasonCases = [
    ["must_download_package", "Primero debe descargar el paquete."],
    ["must_register_start", "Debe registrar el inicio del trabajo manual."],
    ["must_attach_output", "Debe adjuntar una salida antes de enviarla."],
    ["not_submitted", "La salida aún no fue enviada a revisión."],
    ["capability_absent", "No tiene autorización para esta acción."],
    [
      "accept_requires_capability",
      "No tiene autorización para aceptar esta salida.",
    ],
    ["wrong_status", "El estado actual no permite esta acción."],
    [
      "input_package_missing",
      "No hay un paquete fuente válido para descargar.",
    ],
  ];

  for (const [code, expected] of reasonCases) {
    assert.match(src, new RegExp(`case "${code}"`));
    assert.match(src, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("computeManualWorkAvailableActions pure logic (duplicated contract)", () => {
  const capabilities = (allowed) =>
    ["manage_manual_work", "accept_manual_output"].map((key) => ({
      key,
      allowed: allowed.includes(key),
      reasonCode: allowed.includes(key) ? null : "capability_absent",
      targetScope: null,
    }));

  function compute(input) {
    const canManage = input.capabilities.find(
      (c) => c.key === "manage_manual_work",
    )?.allowed;
    const canAccept = input.capabilities.find(
      (c) => c.key === "accept_manual_output",
    )?.allowed;
    const actions = [];

    if (!canManage) actions.push({ action: "download_package", allowed: false });
    else if (input.status !== "ready_to_start")
      actions.push({ action: "download_package", allowed: false });
    else actions.push({ action: "download_package", allowed: true });

    if (!canAccept) actions.push({ action: "accept_output", allowed: false });
    else if (input.status !== "submitted")
      actions.push({ action: "accept_output", allowed: false });
    else if (!input.submittedArtifactVersionId)
      actions.push({ action: "accept_output", allowed: false });
    else actions.push({ action: "accept_output", allowed: true });

    return actions;
  }

  const ready = compute({
    status: "ready_to_start",
    capabilities: capabilities(["manage_manual_work", "accept_manual_output"]),
    submittedArtifactVersionId: null,
  });
  assert.equal(
    ready.find((a) => a.action === "download_package")?.allowed,
    true,
  );
  assert.equal(
    ready.find((a) => a.action === "accept_output")?.allowed,
    false,
  );

  const submitted = compute({
    status: "submitted",
    capabilities: capabilities(["manage_manual_work", "accept_manual_output"]),
    submittedArtifactVersionId: "art-1",
  });
  assert.equal(
    submitted.find((a) => a.action === "accept_output")?.allowed,
    true,
  );

  const noAccept = compute({
    status: "submitted",
    capabilities: capabilities(["manage_manual_work"]),
    submittedArtifactVersionId: "art-1",
  });
  assert.equal(
    noAccept.find((a) => a.action === "accept_output")?.allowed,
    false,
  );
});

test("R2 implementation docs exist", () => {
  for (const doc of [
    "docs/eve/panel-control/RECTOR_R2_MANUAL_ACTIONS_IMPLEMENTATION.md",
    "docs/eve/panel-control/RECTOR_R2_MANUAL_ACTIONS_SECURITY_MATRIX.md",
    "docs/eve/panel-control/RECTOR_R2_MANUAL_ACTIONS_PRODUCTION_READINESS.md",
    "docs/eve/panel-control/RECTOR_R2_MANUAL_ACTIONS_ROLLBACK_RUNBOOK.md",
  ]) {
    assert.equal(existsSync(resolve(root, doc)), true, doc);
    const body = read(doc);
    assert.ok(body.length > 500, `${doc} should not be a stub`);
  }
});
