import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "../../..");
const registryPath = resolve(
  projectRoot,
  "scripts/eve/official-control-panel/amber-repository-evidence-registry.json",
);
const seedPath = resolve(
  projectRoot,
  "supabase/seed/official-control-panel-amber-recovery.sql",
);
const recoveryScriptPath = resolve(
  projectRoot,
  "scripts/eve/official-control-panel/recover-amber-context-from-repository.mjs",
);
const evidenceDocPath = resolve(
  projectRoot,
  "docs/eve/panel-control/AMBER_REPOSITORY_RECOVERY_EVIDENCE.md",
);

const CANONICAL_COMPANY = "5c08029f-15e9-4bbd-b13e-0ff4765e23b8";
const CANONICAL_CASE = "19fc9eff-4219-43f0-854c-e2b3350f23f2";
const CANONICAL_RELATIONSHIP = "7c499a1c-31c6-4fc9-8b20-2fd8cdc57043";
const DUPLICATE_CASE = "cc983357-dd4a-42e9-b2f7-fa54364184df";
const DUPLICATE_COMPANY = "e6cdd265-b0a7-441d-a3b0-e0d7fdc842cf";

test("registry preserva UUID canónicos y excluye duplicado", () => {
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  assert.equal(registry.canonical.companyId, CANONICAL_COMPANY);
  assert.equal(registry.canonical.caseId, CANONICAL_CASE);
  assert.equal(registry.canonical.relationshipId, CANONICAL_RELATIONSHIP);
  assert.equal(registry.excluded.duplicateCaseId, DUPLICATE_CASE);
  assert.equal(registry.excluded.duplicateCompanyId, DUPLICATE_COMPANY);
  assert.equal(registry.canonical.estadoActual, null);
});

test("seed es idempotente, local y no incluye duplicado ni secretos", () => {
  const seed = readFileSync(seedPath, "utf8");
  assert.match(seed, /on conflict/i);
  assert.match(seed, new RegExp(CANONICAL_COMPANY));
  assert.doesNotMatch(seed, new RegExp(DUPLICATE_CASE));
  assert.doesNotMatch(seed, new RegExp(DUPLICATE_COMPANY));
  assert.doesNotMatch(seed, /service_role|\.env|password/i);

  const script = readFileSync(recoveryScriptPath, "utf8");
  assert.match(script, /\$\{c\.caseId\}/);
  assert.match(script, /\$\{c\.relationshipId\}/);
  assert.match(script, /client_relationships/);
  assert.match(script, /sesiones_llenado/);
  assert.match(script, /consultant_company_assignments/);
});

test("script de recuperación expone modos requeridos y rechaza remoto", () => {
  const script = readFileSync(recoveryScriptPath, "utf8");
  for (const mode of ["--inspect", "--dry-run", "--apply-local"]) {
    assert.match(script, new RegExp(mode.replace(/-/g, "\\-")));
  }
  assert.doesNotMatch(script, /--apply-staging/);
  assert.match(script, /remote_supabase_url_rejected/);
  assert.match(script, /127\.0\.0\.1|localhost/);
});

test("evidencia documental referencia fuentes canónicas del caso", () => {
  assert.equal(existsSync(evidenceDocPath), true);
  const doc = readFileSync(evidenceDocPath, "utf8");
  assert.match(doc, /mba-control-plane\.test\.mjs/);
  assert.match(doc, /run-inc16-runtime-validation-v2\.ps1/);
  assert.match(doc, new RegExp(CANONICAL_CASE));
  assert.match(doc, /No disponible/);
});

test("e2e unit2b usa UUID canónicos para Amber", () => {
  const spec = readFileSync(
    resolve(
      projectRoot,
      "tests/e2e/official-consultant-control-panel-unit2b.spec.ts",
    ),
    "utf8",
  );
  assert.match(spec, new RegExp(CANONICAL_COMPANY));
  assert.match(spec, new RegExp(CANONICAL_CASE));
  assert.match(spec, new RegExp(CANONICAL_RELATIONSHIP));
  assert.doesNotMatch(spec, /12000000-0000-4000-8000-000000000001/);
  assert.doesNotMatch(spec, /42000000-0000-4000-8000-000000000001/);
});

test("prepare unit2b alinea Amber con UUID canónicos", () => {
  const prepare = readFileSync(
    resolve(
      projectRoot,
      "tests/e2e/setup/prepare-official-control-panel-unit2b.mjs",
    ),
    "utf8",
  );
  assert.match(prepare, new RegExp(CANONICAL_COMPANY));
  assert.match(prepare, new RegExp(CANONICAL_CASE));
  assert.match(prepare, /Fixture Amber Legacy \(disabled\)/);
  assert.doesNotMatch(
    prepare,
    /'12000000-0000-4000-8000-000000000001', 'Cervecería Amber'/,
  );
});

test("mba test ancla case_id canónico INC16", () => {
  const mba = readFileSync(
    resolve(
      projectRoot,
      "tests/regression/mba-control-plane/mba-control-plane.test.mjs",
    ),
    "utf8",
  );
  assert.match(mba, new RegExp(`case_id: "${CANONICAL_CASE}"`));
  assert.match(mba, new RegExp(`session_id: "${CANONICAL_CASE}"`));
});

test("clasificador 2C no trata caso canónico como huérfano candidato", () => {
  const unit2c = readFileSync(
    resolve(
      projectRoot,
      "tests/regression/consultant-control-panel/official-control-panel-unit2c.test.mjs",
    ),
    "utf8",
  );
  assert.match(unit2c, new RegExp(CANONICAL_COMPANY));
  assert.match(unit2c, new RegExp(DUPLICATE_CASE));
  assert.equal(
    unit2c.includes(`caseId: "${CANONICAL_CASE}"`),
    false,
    "canonical case must not appear as orphan inventory entry",
  );
});
