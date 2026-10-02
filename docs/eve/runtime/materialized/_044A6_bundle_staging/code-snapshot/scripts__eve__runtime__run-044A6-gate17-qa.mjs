/**
 * 044-A.6 Gate 17 — regression QA pack + typecheck/lint/build/diff-check.
 * Does not rewrite T-001...T-020.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const MATERIALIZED = path.join(ROOT, "docs/eve/runtime/materialized");
const FULL =
  "EVE_RUNTIME_40_20_FULL_OA_V1_1_1_MC1_0_IH_EF614C98B10611411C6AA62E0332856E726F4DC622D42EDBB550F4A4221A604F";
const EXPECTED_XLSX =
  "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0";

function run(cmd, opts = {}) {
  try {
    const out = execSync(cmd, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });
    return { ok: true, out: String(out ?? "") };
  } catch (error) {
    return {
      ok: false,
      out: String(error.stdout ?? ""),
      err: String(error.stderr ?? error.message ?? error),
      status: error.status,
    };
  }
}

const tests = [
  {
    id: "A1",
    cmd: "node --test src/services/eve/runtime-40-20/execution-connected/runtime-40-20-renderer-conformance-044A1.test.mjs",
  },
  {
    id: "A2",
    cmd: "node --test src/services/eve/runtime-40-20/execution-connected/runtime-40-20-ingest-conformance-044A2.test.mjs",
  },
  {
    id: "A3M",
    cmd: "node --test src/services/eve/runtime-40-20/execution-connected/runtime-40-20-source-capture-conformance-044A3M.test.mjs",
  },
  {
    id: "A4R",
    cmd: "node --test src/services/eve/runtime-40-20/execution-connected/runtime-40-20-branching-conformance-044A4R.test.mjs",
  },
  {
    id: "A5",
    cmd: "node --test src/services/eve/runtime-40-20/execution-connected/runtime-40-20-regulatory-layer-conformance-044A5.test.mjs",
  },
  {
    id: "A5BR",
    cmd: "node --test src/services/eve/runtime-40-20/b7-confidence/runtime-40-20-b7-confidence-044A5BR.test.mjs",
  },
];

const results = {};
for (const t of tests) {
  results[t.id] = run(t.cmd);
}

const typecheck = run("npx tsc --noEmit -p tsconfig.json", {
  env: { ...process.env, NODE_OPTIONS: "" },
});
const lint = run(
  "npx eslint src/services/eve/runtime-40-20/execution-connected/runtime-40-20-governed-execution-service.ts src/services/eve/runtime-40-20/execution-connected/runtime-40-20-regulatory-layer-044A5-service.ts src/services/eve/runtime-40-20/execution-connected/runtime-40-20-pg-persistence-adapter.ts src/services/eve/runtime-40-20/b7-confidence/runtime-40-20-b7-confidence-service.ts src/services/eve/runtime-40-20/interaction-renderer/runtime-40-20-interaction-renderer-service.ts src/services/eve/runtime-40-20/interaction-renderer/runtime-40-20-interaction-renderer-types.ts src/services/eve/runtime-40-20/canonical-variable/runtime-40-20-canonical-variable-service.ts --max-warnings=50",
);
const build = run("npm run build");
const diffCheck = run("git diff --check");

const e2e = JSON.parse(
  readFileSync(
    path.join(MATERIALIZED, "runtime-40-20-synthetic-e2e-044A6.json"),
    "utf8",
  ),
);

const catalogOk =
  e2e.preflight?.full_immutable === true &&
  e2e.preflight?.full_xlsx_sha === EXPECTED_XLSX &&
  e2e.preflight?.full_catalog_version_id === FULL;

const report = {
  instruction: "044-A.6 Gate17",
  e2e_classification: e2e.classification,
  catalog_unchanged: catalogOk,
  T001_T020_rewritten: false,
  tests: Object.fromEntries(
    Object.entries(results).map(([k, v]) => [
      k,
      { ok: v.ok, note: v.note, err: v.ok ? undefined : String(v.err ?? "").slice(0, 500) },
    ]),
  ),
  typecheck: { ok: typecheck.ok, err: typecheck.ok ? undefined : typecheck.err?.slice(0, 500) },
  lint_focal: { ok: lint.ok, err: lint.ok ? undefined : lint.err?.slice(0, 500) },
  build: { ok: build.ok, err: build.ok ? undefined : build.err?.slice(0, 500) },
  git_diff_check: { ok: diffCheck.ok, err: diffCheck.ok ? undefined : diffCheck.err?.slice(0, 500) },
};

report.ok =
  e2e.classification === "runtime_40_20_synthetic_E2E_staging_passed" &&
  catalogOk &&
  Object.values(results).every((r) => r.ok) &&
  typecheck.ok &&
  lint.ok &&
  build.ok &&
  diffCheck.ok;

mkdirSync(MATERIALIZED, { recursive: true });
writeFileSync(
  path.join(MATERIALIZED, "runtime-40-20-gate17-qa-044A6.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;
