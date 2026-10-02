import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { register } from "node:module";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");

const hookPath = resolve(
  tmpdir(),
  "eve-official-ccp-activity-selection-mutation-hook.mjs",
);
writeFileSync(
  hookPath,
  `import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";
const root = ${JSON.stringify(projectRoot)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = resolvePath(root, "src", specifier.slice(2));
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    for (const candidate of [base, base + ".ts", base + ".tsx"]) {
      if (existsSync(candidate)) return { shortCircuit: true, url: pathToFileURL(candidate).href };
    }
  }
  return nextResolve(specifier, context);
}
`,
);
register(pathToFileURL(hookPath).href);

function read(relPath) {
  return readFileSync(resolve(projectRoot, relPath), "utf8");
}

const {
  assertSelectedActivityCountAllowed,
  buildActivitySelectionStageFromWorkMap,
  SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY,
  MAX_PRIMARY_SELECTED_ACTIVITIES,
} = await import(
  pathToFileURL(
    resolve(
      projectRoot,
      "src/services/eve/official-control-panel/official-control-panel-activity-selection-mutation.ts",
    ),
  ).href
);

const ROUTE =
  "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/participants/[participantId]/profiles/[profileId]/sessions/[sessionId]/activity-selection/route.ts";
const MIGRATION =
  "supabase/migrations/20260722040000_eve_r4_canonical_activity_selection.sql";

test("activity-selection BFF exposes POST wired to authenticated RPC (no service_role client)", () => {
  assert.ok(existsSync(resolve(projectRoot, ROUTE)));
  const route = read(ROUTE);
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(
    route,
    /eve_publish_canonical_activity_selection_as_consultant/,
  );
  assert.match(route, /authenticateOfficialControlPanelConsultant/);
  assert.match(route, /assertMonitoringParticipantAccess/);
  assert.match(route, /SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY|selection_result_more_than_eight_primary/);
  assert.doesNotMatch(route, /createOfficialControlPanelServiceRoleClient/);
  assert.doesNotMatch(route, /workMapPath|loadWorkMapFromAllowedFixturePath/);
  assert.doesNotMatch(route, /p_request_hash|p_result|p_items/);
});

test("migration grants governed execute, protects ledger and computes hash in PostgreSQL", () => {
  assert.ok(existsSync(resolve(projectRoot, MIGRATION)));
  const sql = read(MIGRATION);
  assert.match(
    sql,
    /eve_publish_canonical_activity_selection_as_consultant/,
  );
  assert.match(sql, /grant execute[\s\S]*to authenticated/);
  assert.match(sql, /STALE_ACTIVITY_SELECTION_VERSION/);
  assert.match(sql, /IDEMPOTENCY_CONFLICT/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /digest\(convert_to\(jsonb_build_object/);
  assert.match(sql, /before truncate on public\.activity_selection_action_idempotency/);
  assert.match(sql, /from anon, authenticated, service_role/);
});

test("FX-03 style: ≤8 eligible prepares non_competitive_inclusion with selected ≤8", () => {
  const workMap = JSON.parse(
    read("tests/fixtures/official-control-panel/r4/workmap-fx03-le8.json"),
  );
  const prepared = buildActivitySelectionStageFromWorkMap(
    workMap,
    "workmap-file:fx03",
  );
  assert.equal(prepared.mode, "non_competitive_inclusion");
  assert.ok(prepared.result.selected_count <= MAX_PRIMARY_SELECTED_ACTIVITIES);
  assert.equal(
    prepared.result.selected_count,
    prepared.selectedActivityIds.length,
  );
  assert.equal(
    assertSelectedActivityCountAllowed(prepared.selectedActivityIds).ok,
    true,
  );
  assert.ok(prepared.result.eligible_count <= 8);
  assert.equal(
    prepared.result.selected_count,
    prepared.result.eligible_count,
  );
});

test("FX-04 style: >8 eligible prepares competitive_selection with selected ≤8 (no silent truncate of client >8)", () => {
  const workMap = JSON.parse(
    read("tests/fixtures/official-control-panel/r4/workmap-fx04-gt8.json"),
  );
  const prepared = buildActivitySelectionStageFromWorkMap(
    workMap,
    "workmap-file:fx04",
  );
  assert.equal(prepared.mode, "competitive_selection");
  assert.ok(prepared.result.eligible_count > 8);
  assert.ok(prepared.result.selected_count <= MAX_PRIMARY_SELECTED_ACTIVITIES);
  assert.ok(prepared.result.selected_count >= 1);
  assert.ok(
    prepared.items.some((item) => item.classification === "non_primary"),
  );
  assert.ok(
    prepared.items
      .filter((item) => item.classification === "primary")
      .every(
        (item) =>
          typeof item.selected_slot === "number" &&
          item.selected_slot >= 1 &&
          item.selected_slot <= 8 &&
          typeof item.selection_reason_code === "string",
      ),
  );
});

test("reject >8 selectedActivityIds with canonical code and no mutation side effects in guard", () => {
  const nine = Array.from({ length: 9 }, (_, i) => `act-${i + 1}`);
  const denied = assertSelectedActivityCountAllowed(nine);
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.code, SELECTION_RESULT_MORE_THAN_EIGHT_PRIMARY);
  }
  const eight = Array.from({ length: 8 }, (_, i) => `act-${i + 1}`);
  assert.equal(assertSelectedActivityCountAllowed(eight).ok, true);
});

test("R4 seeds FX-03/04 clear productGaps and declare POST BFF path", () => {
  const fx03 = read(
    "scripts/eve/official-control-panel/r4/seed-fx03-seleccion-le8.mjs",
  );
  const fx04 = read(
    "scripts/eve/official-control-panel/r4/seed-fx04-seleccion-gt8.mjs",
  );
  assert.match(fx03, /productGaps:\s*\[\s*\]/);
  assert.match(fx04, /productGaps:\s*\[\s*\]/);
  assert.match(fx03, /bffMutationMethod:\s*"POST"/);
  assert.match(fx04, /bffMutationMethod:\s*"POST"/);
  assert.match(fx04, /selection_result_more_than_eight_primary/);
  assert.doesNotMatch(fx03, /activity_selection_bff_write_missing/);
  assert.doesNotMatch(fx04, /activity_selection_bff_write_missing/);
});
