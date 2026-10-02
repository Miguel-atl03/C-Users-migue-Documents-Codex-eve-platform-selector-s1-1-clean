#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  P9A_ARTIFACT_PATHS,
  repoRoot,
  scanVisibleTextForForbiddenTerms,
} from "./p9a-production-activation-lib.mjs";

const baseUrl = process.env.EVE_BASE_URL ?? "http://127.0.0.1:3000";
const playwrightConfig = join(repoRoot, "playwright.config.ts");
const e2eSpec = join(repoRoot, "tests/e2e/eve-client-final-ui-local.spec.ts");

function isServerReachable() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = fetch(baseUrl, { signal: controller.signal });
    return response.then((r) => {
      clearTimeout(timer);
      return r.ok || r.status < 500;
    }).catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

async function fetchPageText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const html = await response.text();
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
}

async function runStaticSurfaceScan() {
  const pages = [
    { id: "estado_a_login", path: "/" },
    { id: "estado_b_preview", path: "/?preview=estado-b" },
    { id: "dev_significado", path: "/dev/significado" },
  ];
  const scans = [];
  let allPassed = true;
  for (const page of pages) {
    try {
      const text = await fetchPageText(page.path);
      const violations = scanVisibleTextForForbiddenTerms(text);
      const passed = violations.length === 0;
      if (!passed) allPassed = false;
      scans.push({ page: page.id, path: page.path, passed, violations });
    } catch (error) {
      allPassed = false;
      scans.push({
        page: page.id,
        path: page.path,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { scans, allPassed };
}

function runPlaywright() {
  const args = ["playwright", "test", "tests/e2e/eve-client-final-ui-local.spec.ts", "--config=playwright.config.ts"];
  const result = spawnSync("npx", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: true,
    env: { ...process.env, EVE_BASE_URL: baseUrl },
  });
  return {
    command: `npx ${args.join(" ")}`,
    exit_code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    passed: result.status === 0,
  };
}

async function main() {
  const playwright_viable =
    existsSync(playwrightConfig) && existsSync(e2eSpec);
  const server_reachable = await isServerReachable();

  let playwright_run = null;
  let static_scan = null;
  let browser_qa_passed = false;
  let browser_qa_available = false;
  let blocked_reason = null;

  if (!playwright_viable) {
    blocked_reason = "BLOCKED_UI_BROWSER_RUNNER_UNAVAILABLE";
  } else if (!server_reachable) {
    blocked_reason = "BLOCKED_DEV_SERVER_UNAVAILABLE";
  } else {
    browser_qa_available = true;
    playwright_run = runPlaywright();
    static_scan = await runStaticSurfaceScan();
    browser_qa_passed = static_scan.allPassed && playwright_run.passed;
  }

  const checks = {
    login_access_visible: browser_qa_passed,
    estado_a_visible: browser_qa_passed,
    estado_b_visible: browser_qa_passed,
    workmap_significado_flow_checked: static_scan?.scans?.some((s) => s.page === "dev_significado" && s.passed) ?? false,
    safe_result_surface_checked: browser_qa_passed,
    no_internal_terms_leaked: static_scan?.allPassed ?? false,
  };

  const result = {
    dictamen: "EVE_PRODUCTION_ACTIVATION_P9A_CLIENT_UI_BROWSER_QA",
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    playwright_viable,
    server_reachable,
    browser_qa_available,
    client_ui_browser_qa_passed: browser_qa_passed,
    client_ui_browser_qa_available: browser_qa_available,
    blocked_reason,
    checks,
    static_surface_scan: static_scan,
    playwright_run,
    forbidden_terms_checked: [
      "MMABP",
      "VSM",
      "AHE",
      "Gate",
      "Chip",
      "Runtime table",
      "Object Inventory",
      "Integration Membrane",
      "Soft Governance",
      "canonical_variable_record",
      "runtime_interaction_instance",
      "readiness_gap_record",
      "readiness_decision_record",
      "registry",
      "IR",
      "export payload",
      "diagnóstico final",
      "patología",
      "Capa 1",
      "transducción causal",
      "readiness_state",
      "expediente estructural",
    ],
    client_internal_leakage_detected: static_scan ? !static_scan.allPassed : true,
    client_final_diagnosis_visible: false,
    qa_green_real_created: false,
    activation_allowed: false,
    production_supabase_touched: false,
  };

  writeFileSync(P9A_ARTIFACT_PATHS.clientUi, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  if (!browser_qa_passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
