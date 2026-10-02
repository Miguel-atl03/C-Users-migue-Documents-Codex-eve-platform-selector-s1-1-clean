import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const modules = loadModules();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test("requires created_by", async () => {
  const result = await run({ created_by: undefined });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "created_by_required");
});

test("rejects empty created_by", async () => {
  const result = await run({ created_by: "   " });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "created_by_empty");
});

test("persists PM PF MoC OLC records with mock adapter", async () => {
  const adapter = memoryAdapter();
  const result = await run({ adapter });

  assert.equal(result.ok, true);
  assert.equal(result.persisted_count, 4);
  assertJsonEqual(adapter.records.map((record) => record.family), [
    "PM",
    "PF",
    "MoC",
    "OLC",
  ]);
  assert.ok(adapter.records.every((record) => UUID_PATTERN.test(record.registry_id)));
});

test("propagates created_by into every registry record", async () => {
  const result = await run({ created_by: "miguel" });

  assert.ok(result.records.every((record) => record.created_by === "miguel"));
});

test("propagates created_by into audit log", async () => {
  const adapter = memoryAdapter();
  const result = await run({ adapter, created_by: "miguel" });

  assert.equal(result.ok, true);
  assert.ok(adapter.auditLogs.every((entry) => entry.created_by === "miguel"));
  assert.ok(adapter.auditLogs.every((entry) => UUID_PATTERN.test(entry.audit_id)));
});

test("propagates created_by into authorization log", async () => {
  const adapter = memoryAdapter();
  const result = await run({ adapter, created_by: "miguel" });

  assert.equal(result.ok, true);
  assert.equal(adapter.authorizationLogs[0].created_by, "miguel");
  assert.ok(UUID_PATTERN.test(adapter.authorizationLogs[0].authorization_log_id));
});

test("rejects missing family", async () => {
  const result = await run({
    source_candidates: sourceCandidates().filter(
      (candidate) => candidate.family !== "OLC",
    ),
  });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /missing_family:OLC/);
});

test("rejects duplicated family", async () => {
  const candidates = sourceCandidates();
  candidates[3] = { ...candidates[0], source_candidate_ref: "duplicate-pm" };
  const result = await run({ source_candidates: candidates });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, /duplicated_family:PM/);
});

test("keeps conformance_claimed=false", async () => {
  const result = await run();

  assert.ok(result.records.every((record) => record.conformance_claimed === false));
  assert.equal(result.no_go.conformance_claimed, false);
});

test("keeps consistency_claimed=false", async () => {
  const result = await run();

  assert.ok(result.records.every((record) => record.consistency_claimed === false));
  assert.equal(result.no_go.consistency_claimed, false);
});

test("creates authorization log", async () => {
  const adapter = memoryAdapter();
  const result = await run({ adapter });

  assert.equal(result.ok, true);
  assert.equal(adapter.authorizationLogs.length, 1);
  assert.equal(adapter.authorizationLogs[0].authorization_executed, true);
});

test("creates audit log", async () => {
  const adapter = memoryAdapter();
  const result = await run({ adapter });

  assert.equal(result.ok, true);
  assert.ok(
    adapter.auditLogs.some(
      (entry) => entry.action === "registry_real_minimal_persisted",
    ),
  );
});

test("blocks if Runtime 40/20 flag is true", async () => {
  await assertBoundaryBlock("runtime_40_20_started");
});

test("blocks if IR real flag is true", async () => {
  await assertBoundaryBlock("ir_real_created");
});

test("blocks if Object Inventory real flag is true", async () => {
  await assertBoundaryBlock("object_inventory_real_opened");
});

test("blocks if F5C real flag is true", async () => {
  await assertBoundaryBlock("f5c_real_opened");
});

test("blocks if export flag is true", async () => {
  await assertBoundaryBlock("export_created");
});

test("blocks if diagnosis flag is true", async () => {
  await assertBoundaryBlock("diagnosis_created");
});

test("blocks if Delivered flag is true", async () => {
  await assertBoundaryBlock("delivered_created");
});

test("does not import Supabase", () => {
  const source = readFileSync(
    new URL("./registry-real-minimal-service.ts", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("@supabase"), false);
});

test("does not read env", () => {
  const source = readFileSync(
    new URL("./registry-real-minimal-service.ts", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("process.env"), false);
});

test("does not create endpoints", () => {
  const source = readFileSync(
    new URL("./registry-real-minimal-service.ts", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("src/app/api"), false);
  assert.equal(source.includes("fetch("), false);
});

test("keeps migration_applied=false in traceability", () => {
  const traceability = JSON.parse(
    readFileSync(
      new URL(
        "../../../../docs/implementation/registry_real_minimal_controlled_promotion_traceability.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

  assert.equal(traceability.migration_applied, false);
});

test("keeps Supabase untouched", () => {
  const traceability = JSON.parse(
    readFileSync(
      new URL(
        "../../../../docs/implementation/registry_real_minimal_controlled_promotion_traceability.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

  assert.equal(traceability.supabase_touched, false);
});

test("keeps env unread", () => {
  const traceability = JSON.parse(
    readFileSync(
      new URL(
        "../../../../docs/implementation/registry_real_minimal_controlled_promotion_traceability.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

  assert.equal(traceability.env_read, false);
});

test("keeps endpoint not created", () => {
  const traceability = JSON.parse(
    readFileSync(
      new URL(
        "../../../../docs/implementation/registry_real_minimal_controlled_promotion_traceability.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

  assert.equal(traceability.endpoint_created, false);
});

test("keeps Runtime 40/20 not started", async () => {
  const result = await run();

  assert.equal(result.no_go.runtime_40_20_started, false);
});

test("keeps IR Object Inventory F5C export diagnosis Delivered false", async () => {
  const result = await run();

  assert.equal(result.no_go.ir_real_created, false);
  assert.equal(result.no_go.object_inventory_real_opened, false);
  assert.equal(result.no_go.f5c_real_opened, false);
  assert.equal(result.no_go.export_created, false);
  assert.equal(result.no_go.diagnosis_created, false);
  assert.equal(result.no_go.delivered_created, false);
});

test("does not modify existing services", async () => {
  const result = await run();

  assert.equal(result.materiality.level, "registry_real_minimal_controlled_promotion");
  assert.equal(result.materiality.runtime_40_20_started, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

async function assertBoundaryBlock(flag) {
  const result = await run({ boundary: { [flag]: true } });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, new RegExp(flag));
}

async function run(overrides = {}) {
  return modules.service.runRegistryRealMinimalControlledPromotion({
    case_id: "case:registry-real-minimal",
    authorization_ref:
      "REGISTRY_REAL_MINIMAL_AUTHORIZATION_DOSSIER:case:registry-real-minimal",
    created_by: "codex-local-test",
    source_candidates: sourceCandidates(),
    adapter: memoryAdapter(),
    ...overrides,
  });
}

function sourceCandidates() {
  return ["PM", "PF", "MoC", "OLC"].map((family) => ({
    family,
    source_candidate_ref: `REGISTRY_CANDIDATE_LOCAL_${family}:case:registry-real-minimal`,
    local_candidate_trace_ref:
      "docs/implementation/registry_candidate_local_dry_run_traceability.json",
    metadata: { source: "local_registry_candidate_dry_run" },
  }));
}

function memoryAdapter() {
  return {
    records: [],
    auditLogs: [],
    authorizationLogs: [],
    async insertRegistryRecords(records) {
      this.records.push(...records);
      return { ok: true, inserted_count: records.length };
    },
    async insertAuditLog(entry) {
      this.auditLogs.push(entry);
      return { ok: true };
    },
    async insertAuthorizationLog(entry) {
      this.authorizationLogs.push(entry);
      return { ok: true };
    },
  };
}

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function loadModules() {
  const types = {};
  const boundarySource = readFileSync(
    new URL("./registry-real-minimal-boundary.ts", import.meta.url),
    "utf8",
  );
  const boundary = evaluateModule(
    boundarySource,
    "registry-real-minimal-boundary.ts",
    {
      "./registry-real-minimal-types": types,
    },
  );
  const serviceSource = readFileSync(
    new URL("./registry-real-minimal-service.ts", import.meta.url),
    "utf8",
  );
  const service = evaluateModule(
    serviceSource,
    "registry-real-minimal-service.ts",
    {
      "./registry-real-minimal-boundary": boundary,
      "./registry-real-minimal-types": types,
    },
  );

  return { boundary, service };
}

function evaluateModule(source, filename, requireMap) {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const context = {
    exports: {},
    crypto: webcrypto,
    require(specifier) {
      if (requireMap[specifier]) {
        return requireMap[specifier];
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, { filename });

  return context.exports;
}
