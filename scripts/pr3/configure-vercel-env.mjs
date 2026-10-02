import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const project = "prj_DIW8ARfHp0jGLFWAqjM96gXwlSjF";
const values = {
  EVE_PR3_PERSISTENCE_MODE: "postgres",
  EVE_PR3_EXPECTED_PROJECT_REF: "keqrkyumfyhfivllvdbl",
  EVE_PR3_PILOT_AUTH_MODE: "supabase_user",
  EVE_PR3_RUNTIME_ADAPTER: "blocked",
  EVE_PR3_PILOT_SCOPE_REF: "CASE-P4-QA",
  EVE_PR3_PILOT_ACTIVITY_REF: "ACT-P4-QA",
  NEXT_PUBLIC_EVE_PR3_SUPABASE_URL: "https://keqrkyumfyhfivllvdbl.supabase.co",
  NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_EVE_PR3_PILOT_ENABLED: "false",
  EVE_PR3_ACTION_TOKEN_SECRET: randomBytes(48).toString("base64url"),
};
if (!values.NEXT_PUBLIC_EVE_PR3_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_")) throw new Error("Clean PR3 publishable key required");
for (const [name, value] of Object.entries(values)) {
  const result = spawnSync("vercel", ["env", "add", name, "preview,production", "--project", project, "--yes", name === "EVE_PR3_ACTION_TOKEN_SECRET" ? "--sensitive" : "--no-sensitive"], {
    shell: process.platform === "win32", windowsHide: true, encoding: "utf8", input: value,
    env: { ...process.env, VERCEL_TELEMETRY_DISABLED: "1" },
  });
  if (result.status !== 0) {
    // CLI output is withheld because it may echo a credential on an error path.
    throw new Error(`Vercel configuration failed for ${name}; exit=${result.status}`);
  }
  console.log(`CONFIGURED ${name} preview,production`);
}
console.log("DATABASE_URL intentionally not supplied: bind the clean PR3 PostgreSQL secret directly in Vercel.");
