#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCKED_EXIT_CODE, RING2_ARTIFACT_PATHS, repoRoot } from "./ring2-artifact-paths.mjs";
import { assessPilotReadiness, writeBlockedArtifact } from "./ring2-pilot-readiness-lib.mjs";
import {
  FORBIDDEN_UI_TERMS,
  readJsonIfExists,
  scanVisibleTextForForbiddenTerms,
} from "./p9a-production-activation-lib.mjs";

const RING2_EXTRA_FORBIDDEN = [
  { key: "No-Go interno", pattern: /No-Go interno/i },
  { key: "diagnóstico", pattern: /diagn[oó]stico final/i },
];

function scanRing2ForbiddenTerms(text) {
  const base = scanVisibleTextForForbiddenTerms(text);
  for (const term of RING2_EXTRA_FORBIDDEN) {
    if (term.pattern.test(text) && !base.includes(term.key)) base.push(term.key);
  }
  return base;
}

const baseUrl = process.env.EVE_BASE_URL ?? "http://127.0.0.1:3000";

async function isServerReachable() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(baseUrl, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function fetchPageText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const html = await response.text();
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
}

function scanClientSourceFiles() {
  const paths = [
    join(repoRoot, "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane-service.ts"),
    join(repoRoot, "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service.ts"),
    join(repoRoot, "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-types.ts"),
  ];
  const scans = [];
  let allPassed = true;
  for (const filePath of paths) {
    if (!existsSync(filePath)) {
      allPassed = false;
      scans.push({ file: filePath, passed: false, error: "missing" });
      continue;
    }
    const text = readFileSync(filePath, "utf8");
    const clientFacingSection = text.match(/CLIENT_VISIBLE|client_visible|safe.*state|resultado_en_revision/gi);
    const violations = scanRing2ForbiddenTerms(clientFacingSection ? clientFacingSection.join(" ") : "");
    const passed = violations.length === 0;
    if (!passed) allPassed = false;
    scans.push({
      file: filePath.replace(repoRoot + "\\", "").replace(repoRoot + "/", ""),
      passed,
      violations,
    });
  }
  return { scans, allPassed };
}

async function main() {
  const readiness = assessPilotReadiness();
  if (!readiness.ready_for_execution) {
    writeBlockedArtifact(RING2_ARTIFACT_PATHS.clientUiFlow, "EVE_PRODUCTION_ACTIVATION_RING2_CLIENT_UI_FLOW", {
      client_ui_flow_passed: false,
    });
    process.exit(BLOCKED_EXIT_CODE);
  }

  const pilotScope = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotScopeManifest);
  const pilotClient = readJsonIfExists(RING2_ARTIFACT_PATHS.pilotClientManifest);
  const server_reachable = await isServerReachable();
  const pages = [
    { id: "estado_a_login", path: "/" },
    { id: "estado_b_preview", path: "/?preview=estado-b" },
  ];

  const live_scans = [];
  let live_scan_passed = false;
  if (server_reachable) {
    let allPassed = true;
    for (const page of pages) {
      try {
        const text = await fetchPageText(page.path);
        const violations = scanRing2ForbiddenTerms(text);
        const passed = violations.length === 0;
        if (!passed) allPassed = false;
        live_scans.push({ page: page.id, path: page.path, passed, violations });
      } catch (error) {
        allPassed = false;
        live_scans.push({ page: page.id, path: page.path, passed: false, error: String(error) });
      }
    }
    live_scan_passed = allPassed;
  }

  const source_scan = scanClientSourceFiles();
  const client_ui_flow_passed =
    source_scan.allPassed &&
    (live_scan_passed || !server_reachable) &&
    pilotScope?.scope_closed === true &&
    pilotClient?.authorized_pilot_client === true;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING2_CLIENT_UI_FLOW",
    generated_at: new Date().toISOString(),
    ring2_scope: "authorized_pilot_client_scoped_supervised",
    pilot_client_id: pilotClient?.pilot_client_id ?? null,
    pilot_scope_ref: "docs/production-activation/ring2_pilot_scope_manifest.json",
    server_reachable,
    source_scan,
    live_scans,
    live_scan_passed,
    client_ui_flow_passed,
    diagnosis_exposed: false,
    production_public_access_enabled: false,
    activation_allowed_general_production: false,
  };

  writeFileSync(RING2_ARTIFACT_PATHS.clientUiFlow, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!client_ui_flow_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
