#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const stamp = "r2_acciones_manuales_gobernadas_apta_bundle";
const staging = join(root, "reports/local/rector-r2-manual-actions", stamp);
const outZip = join(homedir(), "Downloads", `${stamp}.zip`);

const files = [
  "supabase/migrations/20260720130000_eve_r2_manual_actions_security_scope.sql",
  "supabase/migrations/20260720130100_eve_r2_manual_actions_digest_search_path.sql",
  "supabase/migrations/20260720130200_eve_r2_manual_actions_accept_handoff.sql",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-actions/route.ts",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-artifacts/[artifactVersionId]/download/route.ts",
  "src/services/eve/official-control-panel/official-control-panel-manual-work-repository.ts",
  "src/services/eve/official-control-panel/official-control-panel-manual-work-service.ts",
  "scripts/eve/official-control-panel/verify-r2-manual-actions-integrity.mjs",
  "scripts/eve/official-control-panel/seed-fx08-manual-actions-test.mjs",
  "scripts/eve/official-control-panel/rollback-r2-manual-actions-preserve-data.sql",
  "tests/e2e/official-consultant-control-panel-rector-r2-fx08.spec.ts",
  "tests/regression/consultant-control-panel/official-control-panel-rector-r2-manual-actions.test.mjs",
  "docs/eve/panel-control/RECTOR_R2_DICTAMEN.md",
  "docs/eve/panel-control/RECTOR_R2_MANUAL_ACTIONS_PRODUCTION_READINESS.md",
  "reports/local/rector-r2-manual-actions/results/verifier.json",
  "reports/local/rector-r2-fx08/manifest.json",
  "reports/local/rector-r2-fx08/results/fx08-e2e.json",
];

const shots = [
  "01-ready-to-start.png",
  "02-downloaded.png",
  "03-in-manual-work.png",
  "04-attached-output.png",
  "05-submitted.png",
  "06-accepted.png",
  "07-timeline-accepted.png",
  "08-consultant-c-accept-denied.png",
  "09-desktop-final.png",
];

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

const missing = [];
let n = 0;
for (const rel of files) {
  const src = join(root, rel);
  if (!existsSync(src)) {
    missing.push(rel);
    continue;
  }
  const destName = rel
    .replace(/[\\/]/g, "__")
    .replace(/\[/g, "(")
    .replace(/]/g, ")");
  copyFileSync(src, join(staging, destName));
  n += 1;
}
for (const shot of shots) {
  const src = join(root, "reports/local/rector-r2-fx08/screenshots", shot);
  if (!existsSync(src)) {
    missing.push(`reports/local/rector-r2-fx08/screenshots/${shot}`);
    continue;
  }
  copyFileSync(src, join(staging, `screenshot__${shot}`));
  n += 1;
}

if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}

if (existsSync(outZip)) rmSync(outZip);

let zip = spawnSync("tar", ["-a", "-c", "-f", outZip, "-C", staging, "."], {
  encoding: "utf8",
});
if (zip.status !== 0) {
  zip = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path (Join-Path -LiteralPath '${staging.replace(/'/g, "''")}' -ChildPath '*') -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`,
    ],
    { encoding: "utf8" },
  );
}
if (zip.status !== 0) {
  console.error(zip.stderr || zip.stdout || "zip_failed");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      absolutePath: outZip,
      fileName: `${stamp}.zip`,
      filesIncluded: n,
    },
    null,
    2,
  ),
);
