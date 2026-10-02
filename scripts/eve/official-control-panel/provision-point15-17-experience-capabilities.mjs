#!/usr/bin/env node
/**
 * Alias canónico de aprovisionamiento §§15–17 (test-only).
 * Delega a seed-point15-17-experience-test.mjs y termina.
 * El verificador verify-point15-17-action-chain.mjs no debe invocar este script.
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const seed = resolve(
  root,
  "scripts/eve/official-control-panel/seed-point15-17-experience-test.mjs",
);
const result = spawnSync(process.execPath, [seed], {
  encoding: "utf8",
  env: process.env,
  cwd: root,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
