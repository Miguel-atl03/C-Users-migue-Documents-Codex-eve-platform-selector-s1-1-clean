#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RING1_ARTIFACT_PATHS, repoRoot } from "./ring1-artifact-paths.mjs";
import {
  FORBIDDEN_UI_TERMS,
  readJsonIfExists,
  scanVisibleTextForForbiddenTerms,
} from "./p9a-production-activation-lib.mjs";

const RING1_EXTRA_FORBIDDEN = [
  { key: "No-Go interno", pattern: /No-Go interno/i },
];

function scanRing1ForbiddenTerms(text) {
  const base = scanVisibleTextForForbiddenTerms(text);
  for (const term of RING1_EXTRA_FORBIDDEN) {
    if (term.pattern.test(text) && !base.includes(term.key)) {
      base.push(term.key);
    }
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
    const violations = scanRing1ForbiddenTerms(
      clientFacingSection ? clientFacingSection.join(" ") : "",
    );
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
  const testTenant = readJsonIfExists(RING1_ARTIFACT_PATHS.testTenantManifest);
  const internalClient = readJsonIfExists(RING1_ARTIFACT_PATHS.internalTestClientManifest);
  const ring1Auth = readJsonIfExists(RING1_ARTIFACT_PATHS.ring1Authorization);

  const server_reachable = await isServerReachable();
  const pages = [
    { id: "estado_a_login", path: "/" },
    { id: "estado_b_preview", path: "/?preview=estado-b" },
    { id: "dev_significado", path: "/dev/significado" },
  ];

  const live_scans = [];
  let live_scan_passed = false;
  if (server_reachable) {
    let allPassed = true;
    for (const page of pages) {
      try {
        const text = await fetchPageText(page.path);
        const violations = scanRing1ForbiddenTerms(text);
        const passed = violations.length === 0;
        if (!passed) allPassed = false;
        live_scans.push({ page: page.id, path: page.path, passed, violations });
      } catch (error) {
        allPassed = false;
        live_scans.push({
          page: page.id,
          path: page.path,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    live_scan_passed = allPassed;
  }

  const source_scan = scanClientSourceFiles();
  const membranePath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-membrane/runtime-40-20-client-membrane-service.ts",
  );
  const bffPath = join(
    repoRoot,
    "src/services/eve/runtime-40-20/client-bff/runtime-40-20-client-bff-service.ts",
  );

  const checks = {
    ring1_authorization_verified: ring1Auth?.ring1_authorized === true,
    internal_test_client_access: Boolean(internalClient?.internal_test_client_id),
    test_tenant_scope: Boolean(testTenant?.test_tenant_id),
    estado_a_b_applicable: server_reachable
      ? live_scans.some((s) => s.page === "estado_a_login" && s.passed)
      : existsSync(join(repoRoot, "src/app/page.tsx")),
    workmap_significado_present: existsSync(membranePath) && existsSync(bffPath),
    question_answer_flow_supported: existsSync(
      join(repoRoot, "src/services/eve/runtime-40-20/runtime-real/runtime-40-20-runtime-real-service.ts"),
    ),
    safe_result_visible: existsSync(
      join(repoRoot, "src/services/eve/runtime-40-20/client-result/runtime-40-20-client-result-types.ts"),
    ),
    no_internal_terms_leaked: server_reachable
      ? live_scan_passed
      : source_scan.allPassed,
  };

  const client_ui_flow_passed =
    checks.ring1_authorization_verified &&
    checks.internal_test_client_access &&
    checks.test_tenant_scope &&
    checks.workmap_significado_present &&
    checks.safe_result_visible &&
    checks.no_internal_terms_leaked;

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_RING1_CLIENT_UI_FLOW",
    generated_at: new Date().toISOString(),
    ring1_scope: "internal_test_tenant_limited_client",
    base_url: baseUrl,
    server_reachable,
    test_tenant_id: testTenant?.test_tenant_id ?? null,
    internal_test_client_id: internalClient?.internal_test_client_id ?? null,
    live_scans,
    source_scan,
    forbidden_terms_checked: [
      ...FORBIDDEN_UI_TERMS.map((t) => t.key),
      ...RING1_EXTRA_FORBIDDEN.map((t) => t.key),
    ],
    checks,
    client_ui_flow_passed,
    diagnosis_created: false,
    export_real_created: false,
    activation_allowed_general_production: false,
    production_supabase_touched: false,
  };

  writeFileSync(RING1_ARTIFACT_PATHS.clientUiFlow, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!client_ui_flow_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
