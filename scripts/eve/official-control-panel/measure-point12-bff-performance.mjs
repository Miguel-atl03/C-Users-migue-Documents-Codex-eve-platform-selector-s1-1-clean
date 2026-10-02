#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const env = {};
const envPath = resolve(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const password =
  process.env.EVE_UNIT2B_TEST_PASSWORD || env.EVE_UNIT2B_TEST_PASSWORD;
const client = createClient(url, anon);
const { data, error } = await client.auth.signInWithPassword({
  email: "point12-opval-a@example.invalid",
  password,
});
if (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exit(1);
}

const token = data.session.access_token;
const caseId = "a1200012-0000-4000-8000-000000000003";
const participantId = "a1200012-0000-4000-8000-000000000005";
const profileId = "a1200012-0000-4000-8000-000000000006";
const sessionId = "a1200012-0000-4000-8000-000000000007";
const activityId = "a1200012-0000-4000-8000-000000000011";
const runId = "a1200012-0000-4000-8000-000000000021";
const basePath =
  `http://127.0.0.1:3000/api/eve/official-consultant-control-panel/cases/${caseId}/participants/${participantId}/profiles/${profileId}/sessions/${sessionId}/activities/${activityId}/runs/${runId}/runtime`;

async function timed(name, path) {
  const t0 = performance.now();
  const res = await fetch(`${basePath}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store",
    },
  });
  const body = await res.text();
  return {
    name,
    status: res.status,
    ms: Math.round(performance.now() - t0),
    bytes: Buffer.byteLength(body),
  };
}

const results = [];
for (const p of ["base-matrix", "causal-matrix", "control-state"]) {
  results.push(await timed(p, p));
}

const summary = {
  measuredAt: new Date().toISOString(),
  environment: "local",
  dataset: "point12-opval ready run (40 base + 20 causal)",
  thresholds: "none predefined in repo; observed values recorded",
  bff: results,
  notes: [
    "webpack production build used due to Windows MAX_PATH with default Turbopack",
    "A/B isolation pass without auth_user_id identity trick",
    "npm audit: see npm-audit.txt (transitive ws/postcss)",
  ],
};

const outDir = resolve(root, "reports/production-readiness/point12");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  resolve(outDir, "performance-summary.json"),
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
