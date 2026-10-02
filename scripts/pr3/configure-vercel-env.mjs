import { createHmac, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import nextEnv from "@next/env";
import { PR3_PROJECT_REF, validatePr3DatabaseTarget } from "../../src/services/eve/pr3/target.ts";

nextEnv.loadEnvConfig(process.cwd());
const project = "prj_DIW8ARfHp0jGLFWAqjM96gXwlSjF";
const link = JSON.parse(fs.readFileSync(".vercel/project.json", "utf8"));
if (link.projectId !== project || link.orgId !== "team_vIXDaESfRrxfIN94peNcpgTd") throw new Error("Unexpected Vercel target");
const values = {
  EVE_PR3_PERSISTENCE_MODE: "postgres",
  EVE_PR3_EXPECTED_PROJECT_REF: "keqrkyumfyhfivllvdbl",
  EVE_PR3_PILOT_AUTH_MODE: "supabase_user",
  EVE_PR3_RUNTIME_ADAPTER: "blocked",
  EVE_PR3_PILOT_SCOPE_REF: "CASE-P4-QA",
  EVE_PR3_PILOT_ACTIVITY_REF: "ACT-P4-QA",
  NEXT_PUBLIC_EVE_PR3_SUPABASE_URL: "https://keqrkyumfyhfivllvdbl.supabase.co",
  NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_EVE_PR3_PILOT_ENABLED: "true",
  EVE_PR3_ACTION_TOKEN_SECRET: randomBytes(48).toString("base64url"),
};
if (!values.NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_")) throw new Error("Clean PR3 publishable key required");
if (process.env.EVE_PR3_DATABASE_URL) {
  validatePr3DatabaseTarget(process.env.EVE_PR3_DATABASE_URL, PR3_PROJECT_REF);
  values.EVE_PR3_DATABASE_URL = process.env.EVE_PR3_DATABASE_URL;
}
for (const [name, value] of Object.entries(values)) {
  const sensitive = ["EVE_PR3_ACTION_TOKEN_SECRET", "EVE_PR3_DATABASE_URL"].includes(name);
  const result = spawnSync("vercel", ["env", "add", name, "preview", "--project", project, "--yes", "--force", sensitive ? "--sensitive" : "--no-sensitive"], {
    shell: process.platform === "win32", windowsHide: true, encoding: "utf8", input: value,
    env: { ...process.env, VERCEL_TELEMETRY_DISABLED: "1" },
  });
  if (result.status !== 0) {
    // CLI output is withheld because it may echo a credential on an error path.
    throw new Error(`Vercel configuration failed for ${name}; exit=${result.status}`);
  }
  console.log(`CONFIGURED ${name} preview`);
}
fs.mkdirSync(".tmp", { recursive: true });
const proof = createHmac("sha256", values.EVE_PR3_ACTION_TOKEN_SECRET).update("EVE_PR3_P4_HEALTH_V1").digest("hex");
fs.writeFileSync(".tmp/p4-health-proof", proof, { mode: 0o600 });
console.log(`DATABASE_SECRET_BOUND=${!!values.EVE_PR3_DATABASE_URL}; Production unchanged`);
