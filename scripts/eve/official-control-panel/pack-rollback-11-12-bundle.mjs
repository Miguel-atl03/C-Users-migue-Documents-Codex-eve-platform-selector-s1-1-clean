import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const downloads = path.join(os.homedir(), "Downloads");
const zipName = "rollback_points_11_12_checkpoint_point10_bundle.zip";
const zipPath = path.join(downloads, zipName);
const staging = path.join(os.tmpdir(), "eve-rollback-11-12-bundle");

fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

const files = [
  "docs/eve/panel-control/ROLLBACK_POINTS_11_12_DICTAMEN.md",
  "docs/eve/panel-control/RECTOR_POINTS_10_12_STATUS_DICTAMEN.md",
  "tests/e2e/official-consultant-control-panel-rollback-points-11-12.spec.ts",
  "reports/local/rollback-points-11-12/screenshots/01-amber-checkpoint-point10-no-11-12.png",
  "src/features/official-consultant-control-panel/components/CaseParticipantsPanel.tsx",
  "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
  "src/features/official-consultant-control-panel/hooks/use-case-participants.ts",
  "src/features/official-consultant-control-panel/data/client-context-api.ts",
  "src/features/official-consultant-control-panel/state/monitoring-depth-navigation.ts",
  "src/features/official-consultant-control-panel/types/participant-profile.types.ts",
  "src/features/official-consultant-control-panel/presentation/participant-profile-presentation.ts",
  "src/features/official-consultant-control-panel/styles/official-control-panel.module.css",
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

if (missing.length) {
  console.error(JSON.stringify({ missing }, null, 2));
  process.exit(1);
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
const ps = `Compress-Archive -Path '${staging}\\*' -DestinationPath '${zipPath}' -Force`;
execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], {
  stdio: "inherit",
});

function count(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    n += e.isDirectory() ? count(f) : 1;
  }
  return n;
}

console.log(JSON.stringify({ zipPath, zipName, files: count(staging) }, null, 2));
