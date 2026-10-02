import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("creates migration application authorization gate from valid traceability inputs", () => {
  assert.equal(run().ok, true);
});

test("creates preconditions check", () => {
  assert.equal(run().preconditions_check.check_id, "runtime_40_20_catalog_migration_preconditions");
});

test("creates migration safety checklist", () => {
  assert.equal(run().migration_safety_checklist.checklist_id, "runtime_40_20_catalog_migration_safety");
});

test("creates Supabase execution boundary check", () => {
  assert.equal(
    run().supabase_execution_boundary_check.reason,
    "authorization_gate_only_no_live_execution",
  );
});

test("creates RLS ownership readiness check", () => {
  assert.equal(run().rls_ownership_readiness_check.security_review_required, true);
});

test("creates migration rollback readiness check", () => {
  assert.equal(run().migration_rollback_readiness_check.rollback_plan_required, true);
});

test("creates live DB application decision candidate", () => {
  assert.equal(
    run().live_db_application_decision_candidate.decision_id,
    "runtime_40_20_catalog_live_db_application_decision_candidate",
  );
});

test("creates migration application No-Go check", () => {
  assert.equal(
    run().migration_application_no_go_check.no_go_check_id,
    "runtime_40_20_catalog_migration_application_no_go",
  );
});

test("recommends authorize_later_with_explicit_human_approval", () => {
  assert.equal(
    run().live_db_application_decision_candidate.decision_candidate,
    "authorize_later_with_explicit_human_approval",
  );
});

test("keeps migration_applied=false", () => {
  assert.equal(run().no_go.migration_applied, false);
});

test("keeps catalog_activated=false", () => {
  assert.equal(run().no_go.catalog_activated, false);
});

test("keeps supabase_touched=false", () => {
  assert.equal(run().no_go.supabase_touched, false);
});

test("keeps env_read=false", () => {
  assert.equal(run().no_go.env_read, false);
});

test("keeps service_role_used=false", () => {
  assert.equal(run().no_go.service_role_used, false);
});

test("keeps sql_executed=false", () => {
  assert.equal(run().no_go.sql_executed, false);
});

test("keeps endpoint_created=false", () => {
  assert.equal(run().no_go.endpoint_created, false);
});

test("blocks if schema_contract_created=false", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.schema_contract_created = false;
    }),
    "schema_contract_not_created",
  );
});

test("blocks if migration_draft_created=false", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.migration_draft_created = false;
    }),
    "migration_draft_not_created",
  );
});

test("blocks if checksum_contract_aligned=false", () => {
  assertBlocked(
    mutate((input) => {
      input.checksum_alignment_traceability.checksum_contract_aligned = false;
    }),
    "checksum_contract_not_aligned",
  );
});

test("blocks if incorrect_field_names_removed=false", () => {
  assertBlocked(
    mutate((input) => {
      input.checksum_alignment_traceability.incorrect_field_names_removed = false;
    }),
    "incorrect_checksum_field_names_not_removed",
  );
});

test("blocks if runtime_catalog_tables_supported is not 14", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.runtime_catalog_tables_supported = 13;
    }),
    "runtime_catalog_table_count_not_14",
  );
});

test("blocks if execution_runtime_tables_created=true", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.execution_runtime_tables_created = true;
    }),
    "execution_runtime_tables_created_forbidden",
  );
});

test("blocks if business_evidence_created=true", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.business_evidence_created = true;
    }),
    "business_evidence_created_forbidden",
  );
});

test("blocks if migration_applied=true", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.migration_applied = true;
    }),
    "migration_already_applied_forbidden",
  );
});

test("blocks if catalog_activated=true", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.catalog_activated = true;
    }),
    "catalog_already_activated_forbidden",
  );
});

test("blocks if supabase_touched=true", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.supabase_touched = true;
    }),
    "supabase_already_touched_forbidden",
  );
});

test("blocks if runtime_40_20_started=true", () => {
  assertBlocked(
    mutate((input) => {
      input.schema_contract_traceability.runtime_40_20_started = true;
    }),
    "runtime_40_20_already_started_forbidden",
  );
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

test("keeps conformance/consistency claimed false", () => {
  const noGo = run().no_go;

  assert.equal(noGo.conformance_claimed, false);
  assert.equal(noGo.consistency_claimed, false);
});

test("does not modify existing services", () => {
  assert.deepEqual(Object.keys(service).sort(), [
    "runRuntimeCatalogMigrationAuthorizationGate",
  ]);
});

function run(input = validInput()) {
  return service.runRuntimeCatalogMigrationAuthorizationGate(input);
}

function assertBlocked(input, blocker) {
  const result = run(input);

  assert.equal(result.ok, false);
  assert.ok(result.preconditions_check.blockers.includes(blocker));
  assert.equal(result.live_db_application_decision_candidate.decision_candidate, "blocked");
}

function mutate(mutator) {
  const input = validInput();
  mutator(input);
  return input;
}

function validInput() {
  return {
    case_id: "CASE-001",
    schema_contract_traceability: {
      schema_contract_created: true,
      migration_draft_created: true,
      migration_applied: false,
      catalog_activated: false,
      runtime_40_20_started: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
      runtime_catalog_tables_supported: 14,
      execution_runtime_tables_created: false,
      business_evidence_created: false,
    },
    checksum_alignment_traceability: {
      checksum_contract_aligned: true,
      incorrect_field_names_removed: true,
      runtime_spec_checksum: "text not null",
      runtime_catalog_checksum: "text not null",
      mother_catalog_checksum: "text not null",
      migration_applied: false,
      catalog_activated: false,
      runtime_40_20_started: false,
      supabase_touched: false,
      sql_executed: false,
      endpoint_created: false,
    },
  };
}

function loadService() {
  const source = readFileSync(
    new URL("runtime-40-20-catalog-migration-authorization-gate-service.ts", import.meta.url),
    "utf8",
  );
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
    require: (id) => {
      if (id === "./runtime-40-20-catalog-migration-authorization-gate-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${id}`);
    },
  };

  vm.runInNewContext(outputText, context, {
    filename: "runtime-40-20-catalog-migration-authorization-gate-service.ts",
  });
  return module.exports;
}

