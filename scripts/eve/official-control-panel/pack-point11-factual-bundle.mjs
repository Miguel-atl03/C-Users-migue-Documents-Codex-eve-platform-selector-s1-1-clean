import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const downloads = path.join(os.homedir(), "Downloads");
const zipName = "rector_point_11_activity_selection_factual_bundle.zip";
const zipPath = path.join(downloads, zipName);
const staging = path.join(os.tmpdir(), "eve-rector-11-factual-bundle");

fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

const files = [
  "supabase/migrations/20260716190000_eve_official_control_panel_point11_activity_selection_results.sql",
  "src/services/eve/official-control-panel/official-control-panel-activity-selection.types.ts",
  "src/services/eve/official-control-panel/official-control-panel-activity-selection-repository.ts",
  "src/services/eve/official-control-panel/official-control-panel-activity-selection-service.ts",
  "src/features/official-consultant-control-panel/components/ActivitySelectionCoveragePanel.tsx",
  "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  "src/features/official-consultant-control-panel/hooks/use-case-participants.ts",
  "src/features/official-consultant-control-panel/data/client-context-api.ts",
  "src/features/official-consultant-control-panel/types/participant-profile.types.ts",
  "src/features/official-consultant-control-panel/presentation/participant-profile-presentation.ts",
  "src/features/official-consultant-control-panel/styles/official-control-panel.module.css",
  "scripts/eve/official-control-panel/manage-activity-selection-results.mjs",
  "scripts/eve/official-control-panel/verify-point11-activity-selection-integrity.mjs",
  "scripts/eve/official-control-panel/write-point11-activity-selection-bff-route.mjs",
  "tests/regression/consultant-control-panel/official-control-panel-rector-point-11.test.mjs",
  "docs/eve/panel-control/RECTOR_POINT_11_ACTIVITY_SELECTION_IMPLEMENTATION.md",
  "docs/eve/panel-control/RECTOR_POINT_11_ACTIVITY_SELECTION_DICTAMEN.md",
  "docs/eve/panel-control/RECTOR_POINT_11_ACTIVITY_SELECTION_ROLLBACK.md",
  "docs/eve/panel-control/RECTOR_POINTS_10_12_IMPLEMENTATION_PLAN.md",
  "docs/eve/panel-control/RECTOR_POINTS_10_12_STATUS_DICTAMEN.md",
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activity-selection/route.ts",
];

const missing = [];
for (const rel of files) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) {
    missing.push(rel);
    continue;
  }
  const dest = path.join(staging, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const shotSrc = path.join(root, "reports/local/rector-point-11/screenshots");
const shotDest = path.join(staging, "reports/local/rector-point-11/screenshots");
fs.mkdirSync(shotDest, { recursive: true });
if (fs.existsSync(shotSrc)) {
  for (const name of fs.readdirSync(shotSrc)) {
    if (!name.endsWith(".png")) continue;
    fs.copyFileSync(path.join(shotSrc, name), path.join(shotDest, name));
  }
}

if (missing.length) {
  console.error(JSON.stringify({ missing }, null, 2));
  process.exit(1);
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execFileSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${staging}\\*' -DestinationPath '${zipPath}' -Force`,
  ],
  { stdio: "inherit" },
);

function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(full);
    else n += 1;
  }
  return n;
}

console.log(
  JSON.stringify(
    { zipPath, zipName, files: countFiles(staging) },
    null,
    2,
  ),
);
