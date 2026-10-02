import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const dest = join(
  process.env.USERPROFILE || "",
  "Downloads",
  "r2_correccion_estructural_bloqueada_bundle.zip",
);
const files = [
  "supabase/migrations/20260720120000_eve_r2_manual_actions_structural_fix.sql",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-artifacts/[artifactVersionId]/download/route.ts",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-actions/route.ts",
  "src/services/eve/official-control-panel/official-control-panel-manual-actions.ts",
  "src/services/eve/official-control-panel/official-control-panel-manual-work-service.ts",
  "src/services/eve/official-control-panel/official-control-panel-manual-work-repository.ts",
  "src/features/official-consultant-control-panel/components/ManualWorkPanel.tsx",
  "src/features/official-consultant-control-panel/hooks/use-case-manual-work.ts",
  "src/features/official-consultant-control-panel/data/client-context-api.ts",
  "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  "scripts/eve/official-control-panel/verify-r2-manual-actions-integrity.mjs",
  "scripts/eve/official-control-panel/seed-fx08-manual-actions-test.mjs",
  "scripts/eve/official-control-panel/rollback-r2-manual-actions-preserve-data.sql",
  "tests/regression/consultant-control-panel/official-control-panel-rector-r2-manual-actions.test.mjs",
  "docs/eve/panel-control/RECTOR_R2_DICTAMEN.md",
  "docs/eve/panel-control/RECTOR_R2_MANUAL_ACTIONS_IMPLEMENTATION.md",
  "reports/local/rector-r2-manual-actions/results/verifier.json",
  "reports/local/rector-r2-fx08/manifest.json",
];

const missing = files.filter((f) => !existsSync(join(root, f)));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }));
  process.exit(1);
}

const staging = join(process.env.TEMP || ".", `r2_node_zip_${Date.now()}`);
mkdirSync(staging, { recursive: true });
for (const f of files) {
  const src = join(root, f);
  const dst = join(staging, f);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}

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
  console.error(ps.stderr || ps.stdout);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, zip: dest, files: files.length }));
