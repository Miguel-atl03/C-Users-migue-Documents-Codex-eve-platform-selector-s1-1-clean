#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(__dirname, "..", "..", "..");

export const FORBIDDEN_UI_TERMS = [
  { key: "MMABP", pattern: /\bMMABP\b/i },
  { key: "VSM", pattern: /\bVSM\b/i },
  { key: "AHE", pattern: /\bAHE\b/i },
  { key: "Gate", pattern: /\bGate\b/ },
  { key: "Chip", pattern: /\bChip\b/ },
  { key: "Runtime table", pattern: /Runtime table/i },
  { key: "Object Inventory", pattern: /Object Inventory/i },
  { key: "Integration Membrane", pattern: /Integration Membrane/i },
  { key: "Soft Governance", pattern: /Soft Governance/i },
  { key: "canonical_variable_record", pattern: /canonical_variable_record/i },
  { key: "runtime_interaction_instance", pattern: /runtime_interaction_instance/i },
  { key: "readiness_gap_record", pattern: /readiness_gap_record/i },
  { key: "readiness_decision_record", pattern: /readiness_decision_record/i },
  { key: "registry", pattern: /\bregistry\b/i },
  { key: "IR", pattern: /\bIR\b/ },
  { key: "export payload", pattern: /export payload/i },
  { key: "diagnóstico final", pattern: /diagn[oó]stico final/i },
  { key: "patología", pattern: /patolog[ií]a/i },
  { key: "Capa 1", pattern: /Capa 1/i },
  { key: "transducción causal", pattern: /transducci[oó]n causal/i },
  { key: "readiness_state", pattern: /readiness_state/i },
  { key: "expediente estructural", pattern: /expediente estructural/i },
];

export function readEnvLocal() {
  try {
    const raw = readFileSync(join(repoRoot, ".env.local"), "utf8");
    return Object.fromEntries(
      raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
  } catch {
    return {};
  }
}

export function createSupabaseLocalClient() {
  const merged = { ...readEnvLocal(), ...process.env };
  const url = merged.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    merged.EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY ??
    merged.SUPABASE_SERVICE_ROLE_KEY ??
    "";
  if (!/127\.0\.0\.1|localhost/i.test(url)) {
    throw new Error("Unsafe target: NEXT_PUBLIC_SUPABASE_URL is not local.");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function isSupabaseLocalReachable(supabase) {
  try {
    const { error } = await supabase.from("runtime_audit_trail").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function scanVisibleTextForForbiddenTerms(text) {
  const violations = [];
  for (const term of FORBIDDEN_UI_TERMS) {
    if (term.pattern.test(text)) {
      violations.push(term.key);
    }
  }
  return violations;
}

export const P9A_ARTIFACT_PATHS = {
  clientUi: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_client_ui_browser_qa_results.json",
  ),
  integratedSmoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_integrated_runtime_smoke_results.json",
  ),
  rollback: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_rollback_drill_results.json",
  ),
  abort: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_abort_path_drill_results.json",
  ),
  observability: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_observability_audit_results.json",
  ),
  noGo: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_no_go_productivo_checklist.json",
  ),
  boundary: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_boundary_ledger.json",
  ),
  commandResults: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_command_results.json",
  ),
  humanSignoff: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_human_signoff_required.json",
  ),
  traceability: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p9a_technical_qa_green_no_go_preflight_traceability.json",
  ),
  p4Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p4_runtime_real_local_smoke_results.json",
  ),
  p5Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p5_gates_readiness_local_smoke_results.json",
  ),
  p6Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p6_client_safe_result_smoke_results.json",
  ),
  p7Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p7_consultant_review_packet_smoke_results.json",
  ),
  p8Smoke: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p8_parallel_payload_smoke_results.json",
  ),
  p6Leakage: join(
    repoRoot,
    "docs/production-activation/eve_production_activation_p6_client_safe_result_leakage_scan.json",
  ),
};
