import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();
const baseInput = loadEvidenceInput();

test("accepts all five families when all report L6 service_present", () => {
  const result = evaluate();
  assert.equal(result.ok, true);
  assert.equal(result.closure_summary.total_families, 5);
  assert.equal(result.closure_summary.accepted_l6_count, 5);
});

test("rejects missing family", () => {
  const result = evaluate({
    traceability_records: baseInput.traceability_records.filter(
      (record) => record.family !== "B7",
    ),
  });
  assert.equal(result.ok, false);
  assert.ok(finding(result, "B7", "missing_traceability_record"));
});

test("rejects failed test", () => {
  const result = evaluate({
    traceability_records: mutateRecord("B3", {
      test_execution: { ...record("B3").test_execution, status: "failed" },
    }),
  });
  assert.equal(result.ok, false);
  assert.ok(finding(result, "B3", "test_execution_failed"));
});

test("rejects not_run test", () => {
  const result = evaluate({
    traceability_records: mutateRecord("PF_SUP_04", {
      test_execution: { ...record("PF_SUP_04").test_execution, status: "not_run" },
    }),
  });
  assert.equal(result.ok, false);
  assert.ok(finding(result, "PF_SUP_04", "test_execution_not_run"));
});

test("rejects No-Go triggered", () => {
  const result = evaluate({
    traceability_records: mutateRecord("PF_SUP_03", { no_go_triggered: true }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.closure_summary.no_go_count, 1);
  assert.ok(finding(result, "PF_SUP_03", "no_go_triggered"));
});

test("rejects Runtime 40/20 full opened", () => {
  const result = evaluate({
    traceability_records: mutateRecord("PF_SUP_05", {
      boundary: { ...record("PF_SUP_05").boundary, runtime_40_20_full_opened: true },
    }),
  });
  assert.equal(result.ok, false);
  assert.ok(
    finding(
      result,
      "PF_SUP_05",
      "runtime_40_20_full_opened_forbidden_true",
    ),
  );
});

test("rejects diagnosis/export/registry/IR created", () => {
  for (const key of ["diagnosis_created", "export_created", "registry_created", "ir_created"]) {
    const result = evaluate({
      traceability_records: mutateRecord("B7", {
        boundary: { ...record("B7").boundary, [key]: true },
      }),
    });
    assert.equal(result.ok, false);
    assert.ok(finding(result, "B7", `${key}_forbidden_true`));
  }
});

test("rejects L4/L5 as incomplete", () => {
  for (const level of ["L4 contract_defined", "L5 schema_present"]) {
    const result = evaluate({
      traceability_records: mutateRecord("PF_SUP_03", {
        materiality: { ...record("PF_SUP_03").materiality, after: level },
      }),
    });
    assert.equal(result.ok, false);
    assert.ok(finding(result, "PF_SUP_03", "materiality_incomplete_below_l6"));
  }
});

test("rejects L7/L8 as overclaim", () => {
  for (const level of ["L7 tested_materiality", "L8 executable_materiality"]) {
    const result = evaluate({
      traceability_records: mutateRecord("PF_SUP_04", {
        materiality: { ...record("PF_SUP_04").materiality, after: level },
      }),
    });
    assert.equal(result.ok, false);
    assert.ok(finding(result, "PF_SUP_04", "materiality_overclaim_above_l6"));
  }
});

test("verifies next_authorization_required = true", () => {
  const result = evaluate({
    traceability_records: mutateRecord("B3", {
      next_authorization_required: false,
    }),
  });
  assert.equal(result.ok, false);
  assert.ok(finding(result, "B3", "next_authorization_required_not_true"));
});

test("returns global accepted_level L6 service_present", () => {
  const result = evaluate();
  assert.equal(result.accepted_level, "L6 service_present");
  assert.equal(result.materiality.level, "L6 service_present");
});

test("does not create diagnosis", () => {
  assert.equal(evaluate().no_go.diagnosis_created, false);
});

test("does not create registry", () => {
  assert.equal(evaluate().no_go.registry_created, false);
});

test("does not create IR", () => {
  assert.equal(evaluate().no_go.ir_created, false);
});

test("does not create export", () => {
  assert.equal(evaluate().no_go.export_created, false);
});

test("does not open Runtime 40/20 full", () => {
  assert.equal(evaluate().no_go.runtime_40_20_full_opened, false);
});

function evaluate(overrides = {}) {
  return service.evaluateMaterialityMarkers({
    traceability_records:
      overrides.traceability_records ?? baseInput.traceability_records,
    marker_contracts: overrides.marker_contracts ?? baseInput.marker_contracts,
  });
}

function finding(result, family, findingName) {
  return result.families_evaluated
    .find((evaluation) => evaluation.family === family)
    .findings.includes(findingName);
}

function record(family) {
  return baseInput.traceability_records.find(
    (traceability) => traceability.family === family,
  );
}

function mutateRecord(family, patch) {
  return baseInput.traceability_records.map((traceability) =>
    traceability.family === family
      ? {
          ...traceability,
          ...patch,
        }
      : traceability,
  );
}

function loadEvidenceInput() {
  const traceabilityFiles = [
    ["PF_SUP_03", "docs/implementation/pf_sup_03_executable_slice_traceability.json"],
    ["PF_SUP_04", "docs/implementation/pf_sup_04_executable_slice_traceability.json"],
    ["PF_SUP_05", "docs/implementation/pf_sup_05_local_contract_service_traceability.json"],
    ["B3", "docs/implementation/b3_first_class_materiality_local_service_traceability.json"],
    ["B7", "docs/implementation/b7_first_class_materiality_local_service_traceability.json"],
  ];
  const markerFiles = [
    ["PF_SUP_03", "fixtures/contracts/pf_sup_03_materiality_marker.contract.json"],
    ["PF_SUP_04", "fixtures/contracts/pf_sup_04_materiality_marker.contract.json"],
    ["PF_SUP_05", "fixtures/contracts/pf_sup_05_materiality_marker.contract.json"],
    ["B3", "fixtures/contracts/b3_first_class_materiality_marker.contract.json"],
    ["B7", "fixtures/contracts/b7_first_class_materiality_marker.contract.json"],
  ];

  return {
    traceability_records: traceabilityFiles.map(([family, path]) => ({
      family,
      traceability_id: family,
      ...readJson(path),
    })),
    marker_contracts: markerFiles.map(([family, path]) => ({
      ...readJson(path),
      scope: family,
    })),
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8"));
}

function loadService() {
  const source = readFileSync(
    new URL("./materiality-marker-evaluator.ts", import.meta.url),
    "utf8",
  );
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
      if (specifier === "./materiality-marker-evaluator-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "materiality-marker-evaluator.ts",
  });

  return context.exports;
}
