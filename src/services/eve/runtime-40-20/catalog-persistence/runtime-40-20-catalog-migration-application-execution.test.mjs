import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const boundary = loadModule("runtime-40-20-catalog-migration-application-execution-boundary.ts", {});
const service = loadService();
const serviceWithFlag = loadService({
  EVE_ALLOW_RUNTIME_CATALOG_MIGRATION_APPLICATION: "true",
});
const serviceWithoutFlag = loadService();

function loadService(env = {}) {
  return loadModule("runtime-40-20-catalog-migration-application-execution-service.ts", {
  "./runtime-40-20-catalog-migration-application-execution-boundary": boundary,
  "./runtime-40-20-catalog-migration-application-execution-types": {},
  }, env);
}
const serviceSource = readFileSync(
  new URL("runtime-40-20-catalog-migration-application-execution-service.ts", import.meta.url),
  "utf8",
);

test("blocks when operator_authorization_flag=false", () => {
  const result = run(validInput({ operator_authorization_flag: false }));

  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason, "operator_authorization_flag_missing");
});

test("allows execution report when operator_authorization_flag=true and boundaries false", () => {
  const result = run(validInput({ command_used: "supabase migration up" }));

  assert.equal(result.status, "executed");
  assert.equal(result.migration_application_executed, true);
});

test("supports dry_run=true as not_run", () => {
  const result = run(validInput({ dry_run: true }));

  assert.equal(result.status, "not_run");
  assert.equal(result.migration_applied, false);
});

test("allows process_env_flag_read=true as non-secret operational flag", () => {
  const result = run(validInput({
    operator_flag_status: operatorFlagStatus({
      operator_authorization_flag_present: true,
      process_env_flag_read: true,
    }),
  }));

  assert.equal(result.process_env_flag_read, true);
  assert.equal(result.no_go.process_env_flag_read_allowed, true);
});

test("reports operator_authorization_flag_checked=true", () => {
  assert.equal(run().operator_authorization_flag_checked, true);
});

test("reports operator_authorization_flag_present=false when flag missing", () => {
  const input = serviceWithoutFlag.runtimeCatalogMigrationExecutionInputForCurrentEnvironment("CASE-001");

  assert.equal(input.operator_flag_status.operator_authorization_flag_present, false);
  assert.equal(input.operator_flag_status.operator_authorization_flag_checked, true);
});

test("reports operator_authorization_flag_present=true only when flag value is exactly true", () => {
  const input = serviceWithFlag.runtimeCatalogMigrationExecutionInputForCurrentEnvironment("CASE-001");

  assert.equal(input.operator_flag_status.operator_authorization_flag_present, true);
});

test("blocks if operator_authorization_flag_checked=false", () => {
  const result = run(validInput({
    operator_flag_status: operatorFlagStatus({
      operator_authorization_flag_checked: false,
      operator_authorization_flag_present: true,
    }),
  }));

  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason, "operator_authorization_flag_not_checked");
});

test("blocks if operator_authorization_flag_present=false", () => {
  const result = run(validInput({
    operator_flag_status: operatorFlagStatus({
      operator_authorization_flag_present: false,
    }),
  }));

  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason, "operator_authorization_flag_missing");
});

test("blocks if env_file_read=true", () => {
  const result = run(validInput({
    operator_flag_status: operatorFlagStatus({
      env_file_read: true,
    }),
  }));

  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason, "env_file_read_forbidden");
});

test("blocks if secret_env_read=true", () => {
  const result = run(validInput({
    operator_flag_status: operatorFlagStatus({
      secret_env_read: true,
    }),
  }));

  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason, "secret_env_read_forbidden");
});

test("blocks if service_role_used=true", () => {
  const result = run(validInput({
    operator_flag_status: operatorFlagStatus({
      service_role_used: true,
    }),
  }));

  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason, "service_role_used_forbidden");
});

test("blocks if catalog_activated=true", () => {
  assertBlocked("catalog_activated", "catalog_activated_forbidden");
});

test("blocks if Runtime 40/20 started=true", () => {
  assertBlocked("runtime_40_20_started", "runtime_40_20_started_forbidden");
});

test("blocks if registry_live_db_created=true", () => {
  assertBlocked("registry_live_db_created", "registry_live_db_created_forbidden");
});

test("blocks if IR real created=true", () => {
  assertBlocked("ir_real_created", "ir_real_created_forbidden");
});

test("blocks if Object Inventory real opened=true", () => {
  assertBlocked("object_inventory_real_opened", "object_inventory_real_opened_forbidden");
});

test("blocks if F5C real opened=true", () => {
  assertBlocked("f5c_real_opened", "f5c_real_opened_forbidden");
});

test("blocks if export_created=true", () => {
  assertBlocked("export_created", "export_created_forbidden");
});

test("blocks if diagnosis_created=true", () => {
  assertBlocked("diagnosis_created", "diagnosis_created_forbidden");
});

test("blocks if delivered_created=true", () => {
  assertBlocked("delivered_created", "delivered_created_forbidden");
});

test("keeps conformance_claimed=false", () => {
  assert.equal(run().no_go.conformance_claimed, false);
});

test("keeps consistency_claimed=false", () => {
  assert.equal(run().no_go.consistency_claimed, false);
});

test("keeps migration_applied=false when flag missing", () => {
  const result = run(serviceWithoutFlag.runtimeCatalogMigrationExecutionInputForCurrentEnvironment("CASE-001"));

  assert.equal(result.migration_applied, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().catalog_activated, false);
});

test("keeps runtime_40_20_started=false", () => {
  assert.equal(run().no_go.runtime_40_20_started, false);
});

test("keeps Supabase/SQL/endpoint false", () => {
  const result = run();

  assert.equal(result.service_role_used, false);
  assert.equal(result.no_go.env_file_read, false);
  assert.equal(result.no_go.secret_env_read, false);
});

test("keeps Registry/IR/Object Inventory/F5C/export/diagnosis/Delivered false", () => {
  const noGo = run().no_go;

  assert.equal(noGo.registry_live_db_created, false);
  assert.equal(noGo.ir_real_created, false);
  assert.equal(noGo.object_inventory_real_opened, false);
  assert.equal(noGo.f5c_real_opened, false);
  assert.equal(noGo.export_created, false);
  assert.equal(noGo.diagnosis_created, false);
  assert.equal(noGo.delivered_created, false);
});

test("does not import Supabase", () => {
  assert.equal(/supabase-js|createClient|@supabase/i.test(serviceSource), false);
});

test("does not read .env file", () => {
  assert.equal(
    /readFileSync\([^)]*\.env|dotenv/i.test(serviceSource),
    false,
  );
});

test("does not create endpoint", () => {
  assert.equal(/src\/app\/api|route\.ts|NextResponse/.test(serviceSource), false);
});

test("does not modify existing services", () => {
  assert.deepEqual(Object.keys(service).sort(), [
    "createRuntimeCatalogMigrationApplicationExecutionReport",
    "readRuntimeCatalogMigrationOperatorFlag",
    "runtimeCatalogMigrationExecutionInputForCurrentEnvironment",
  ]);
});

function run(input = validInput()) {
  return service.createRuntimeCatalogMigrationApplicationExecutionReport(input);
}

function assertBlocked(boundaryKey, blocker) {
  const input = validInput();
  input.boundary[boundaryKey] = true;
  const result = run(input);

  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason, blocker);
}

function validInput(overrides = {}) {
  return {
    case_id: "CASE-001",
    operator_authorization_flag: true,
    operator_flag_status: operatorFlagStatus(),
    migration_ref: "20260702121000_eve_runtime_40_20_catalog_core.sql",
    boundary: {
      catalog_activated: false,
      runtime_40_20_started: false,
      registry_live_db_created: false,
      ir_real_created: false,
      object_inventory_real_opened: false,
      f5c_real_opened: false,
      production_parallel_real_opened: false,
      export_created: false,
      diagnosis_created: false,
      delivered_created: false,
      conformance_claimed: false,
      consistency_claimed: false,
    },
    ...overrides,
  };
}

function operatorFlagStatus(overrides = {}) {
  return {
    operator_authorization_flag_checked: true,
    operator_authorization_flag_present: true,
    process_env_flag_read: false,
    env_file_read: false,
    secret_env_read: false,
    service_role_used: false,
    ...overrides,
  };
}

function loadModule(fileName, requireMap, env = {}) {
  const source = readFileSync(new URL(fileName, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  });
  const module = { exports: {} };
  const context = {
    exports: module.exports,
    module,
    process: { env },
    require: (id) => {
      if (id in requireMap) return requireMap[id];
      throw new Error(`Unexpected require: ${id}`);
    },
  };

  vm.runInNewContext(outputText, context, { filename: fileName });
  return module.exports;
}
