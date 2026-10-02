import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, unlinkSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const files = [
  "docs/eve/panel-control/CODEX_R4_R5_CONTEXT_CONFIRMATION.md",
  "docs/eve/panel-control/CODEX_R4_CURRENT_STATE_AUDIT.md",
  "docs/eve/panel-control/RECTOR_POINTS_18_25_STATUS_DICTAMEN.md",
  "docs/eve/panel-control/RECTOR_R4_DICTAMEN.md",
  "docs/eve/panel-control/RECTOR_R4_ACCEPTANCE_BASELINE.md",
  "docs/eve/panel-control/RECTOR_R4_ACCEPTANCE_CRITERIA_MATRIX.md",
  "docs/eve/panel-control/RECTOR_R4_FIXTURE_REGISTRY.md",
  "docs/eve/panel-control/RECTOR_R4_TEST_IMPLEMENTATION.md",
  "docs/eve/panel-control/RECTOR_R4_PRODUCTION_READINESS.md",
  "docs/eve/panel-control/RECTOR_R5_FULL_TRACEABILITY_MATRIX.md",
  "docs/eve/panel-control/RECTOR_R5_FINAL_CLOSURE_REPORT.md",
  "docs/eve/panel-control/RECTOR_R5_DICTAMEN.md",
  "tests/e2e/official-consultant-control-panel-rector-r4-acceptance.spec.ts",
  "tests/fixtures/official-control-panel/r4/r4-fixture-registry.ts",
  "tests/fixtures/official-control-panel/r4/workmap-fx03-le8.json",
  "tests/fixtures/official-control-panel/r4/workmap-fx04-gt8.json",
  "tests/regression/consultant-control-panel/official-control-panel-activity-selection-mutation.test.mjs",
  "tests/regression/consultant-control-panel/official-control-panel-r4-fx05-fx06-projections.test.mjs",
  "tests/regression/consultant-control-panel/official-control-panel-support-action-drawer.test.mjs",
  "tests/regression/consultant-control-panel/official-control-panel-unit1.test.mjs",
  "tests/regression/consultant-control-panel/official-control-panel-unit2b.test.mjs",
  "tests/regression/consultant-control-panel/official-control-panel-unit4-blocked.test.mjs",
  "tests/regression/consultant-control-panel/official-control-panel-unit4a.test.mjs",
  "scripts/eve/official-control-panel/r4/provision-r4-acceptance-fixtures.mjs",
  "scripts/eve/official-control-panel/r4/verify-r4-fixtures-and-acceptance.mjs",
  "scripts/eve/official-control-panel/r4/r4-seed-lib.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx01-empresa-saludable.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx02-usuario-multirrol.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx03-seleccion-le8.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx04-seleccion-gt8.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx05-workmap-gap.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx06-ruta-b2.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx07-feedback-b3.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx08-11-wrappers.mjs",
  "scripts/eve/official-control-panel/r4/seed-fx12-final-alternativo.mjs",
  "scripts/eve/official-control-panel/r4/rollback-r4-authenticated-product-entries-preserve-history.sql",
  "scripts/eve/official-control-panel/verify-r3-runtime-panel-physical-ab.mjs",
  "supabase/migrations/20260722010000_eve_r4_core_final_alternative.sql",
  "supabase/migrations/20260722020000_eve_r4_activity_selection_bff_mutation.sql",
  "supabase/migrations/20260722030000_eve_r4_core_final_alternative_reason_projection.sql",
  "supabase/migrations/20260722040000_eve_r4_canonical_activity_selection.sql",
  "supabase/migrations/20260722040100_eve_r4_activity_selection_digest_search_path.sql",
  "supabase/migrations/20260722050000_eve_r4_parallel_production_authenticated_actions.sql",
  "supabase/migrations/20260722060000_eve_r4_core_final_alternative_product_event.sql",
  "src/services/eve/official-control-panel/official-control-panel-activity-selection-mutation.ts",
  "src/services/eve/official-control-panel/official-control-panel-activity-selection-attention.ts",
  "src/services/eve/official-control-panel/official-control-panel-missing-canonical-route.ts",
  "src/features/official-consultant-control-panel/components/ParallelProductionPanel.tsx",
  "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  "src/features/official-consultant-control-panel/data/client-context-api.ts",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/parallel-production/route.ts",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/core-milestones/route.ts",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activity-selection/route.ts",
  "reports/local/rector-r4-acceptance/manifest.json",
  "reports/local/rector-r4-acceptance/results/e2e-r4.json",
  "reports/local/rector-r4-acceptance/diagnostics/verify-summary.json",
  "reports/local/rector-r4-acceptance/diagnostics/verify-summary-cycle-1.json",
  "reports/local/rector-r4-acceptance/diagnostics/verify-summary-cycle-2.json",
  "reports/local/rector-r4-acceptance/diagnostics/npm-audit-summary.json",
  "reports/local/rector-r4-acceptance/diagnostics/repeatability-summary.json",
  "reports/local/rector-r3-physical-runtime-panel/runtime-panel-ab-evidence.json",
];

const shotDir = join(root, "reports/local/rector-r4-acceptance/screenshots");
for (const name of readdirSync(shotDir).filter((f) => f.endsWith(".png"))) {
  files.push(`reports/local/rector-r4-acceptance/screenshots/${name}`);
}

const missing = files.filter((f) => !existsSync(join(root, f)));
if (missing.length) {
  console.error(JSON.stringify({ missing }, null, 2));
  process.exit(1);
}

const staging = join(process.env.TEMP || "/tmp", "r4_apto_bundle_staging");
const dest = join(
  process.env.USERPROFILE || process.env.HOME || root,
  "Downloads",
  "r4_fixtures_criterios_aceptacion_apto_bundle.zip",
);

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
files.forEach((f, i) => {
  const leaf = basename(f);
  copyFileSync(
    join(root, f),
    join(staging, `${String(i + 1).padStart(2, "0")}_${leaf}`),
  );
});

if (existsSync(dest)) unlinkSync(dest);
const ps = spawnSync(
  "powershell",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${staging}\\*' -DestinationPath '${dest}' -Force`,
  ],
  { encoding: "utf8" },
);
if (ps.status !== 0) {
  console.error(ps.stdout || ps.stderr);
  process.exit(ps.status || 1);
}

const st = statSync(dest);
console.log(
  JSON.stringify(
    { zip: dest, name: basename(dest), bytes: st.size, count: files.length },
    null,
    2,
  ),
);
