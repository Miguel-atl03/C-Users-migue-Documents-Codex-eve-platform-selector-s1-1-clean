import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const modules = loadModules();

test("blocks when operator_authorization_flag=false", () => {
  const result = run({ operator_authorization_flag: false });

  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.match(result.blocked_reason, /explicit_operator_authorization_flag_missing/);
});

test("allows report when operator_authorization_flag=true and all boundaries false", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.status, "not_run");
  assert.equal(result.migration_application_executed, false);
});

test("blocks if Runtime 40/20 started=true", () => {
  assertBoundaryBlock("runtime_40_20_started");
});

test("blocks if IR real created=true", () => {
  assertBoundaryBlock("ir_real_created");
});

test("blocks if Object Inventory real opened=true", () => {
  assertBoundaryBlock("object_inventory_real_opened");
});

test("blocks if F5C real opened=true", () => {
  assertBoundaryBlock("f5c_real_opened");
});

test("blocks if export_created=true", () => {
  assertBoundaryBlock("export_created");
});

test("blocks if diagnosis_created=true", () => {
  assertBoundaryBlock("diagnosis_created");
});

test("blocks if delivered_created=true", () => {
  assertBoundaryBlock("delivered_created");
});

test("keeps conformance_claimed=false", () => {
  const result = run();

  assert.equal(result.no_go.conformance_claimed, false);
});

test("keeps consistency_claimed=false", () => {
  const result = run();

  assert.equal(result.no_go.consistency_claimed, false);
});

test("does not import Supabase", () => {
  const source = readFileSync(
    new URL("./registry-migration-application-execution-service.ts", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("@supabase"), false);
});

test("does not read env", () => {
  const source = readFileSync(
    new URL("./registry-migration-application-execution-service.ts", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("process.env"), false);
});

test("does not create endpoint", () => {
  const source = readFileSync(
    new URL("./registry-migration-application-execution-service.ts", import.meta.url),
    "utf8",
  );

  assert.equal(source.includes("src/app/api"), false);
  assert.equal(source.includes("fetch("), false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(
    result.materiality.level,
    "registry_real_minimal_migration_application_execution",
  );
  assert.equal(result.materiality.runtime_40_20_started, false);
  assert.equal(result.materiality.next_authorization_required, true);
});

function assertBoundaryBlock(flag) {
  const result = run({
    boundary: {
      ...boundary(),
      [flag]: true,
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.blocked_reason, new RegExp(flag));
}

function run(overrides = {}) {
  return modules.service.createRegistryMigrationApplicationExecutionReport({
    case_id: "case:registry-migration-execution",
    operator_authorization_flag: true,
    migration_ref: "20260702120000_eve_registry_real_minimal.sql",
    dry_run: true,
    boundary: boundary(),
    ...overrides,
  });
}

function boundary() {
  return {
    runtime_40_20_started: false,
    ir_real_created: false,
    object_inventory_real_opened: false,
    f5c_real_opened: false,
    production_parallel_real_opened: false,
    export_created: false,
    diagnosis_created: false,
    delivered_created: false,
    conformance_claimed: false,
    consistency_claimed: false,
  };
}

function loadModules() {
  const boundarySource = readFileSync(
    new URL("./registry-migration-application-execution-boundary.ts", import.meta.url),
    "utf8",
  );
  const boundaryModule = evaluateModule(
    boundarySource,
    "registry-migration-application-execution-boundary.ts",
    {},
  );
  const serviceSource = readFileSync(
    new URL("./registry-migration-application-execution-service.ts", import.meta.url),
    "utf8",
  );
  const service = evaluateModule(
    serviceSource,
    "registry-migration-application-execution-service.ts",
    {
      "./registry-migration-application-execution-boundary": boundaryModule,
      "./registry-migration-application-execution-types": {},
    },
  );

  return { boundaryModule, service };
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
