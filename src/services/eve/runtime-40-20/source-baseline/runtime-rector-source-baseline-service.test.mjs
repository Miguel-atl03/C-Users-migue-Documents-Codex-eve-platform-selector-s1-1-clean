import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const service = loadService();

test("accepts valid three rector documents", () => {
  const result = run();

  assert.equal(result.ok, true);
  assert.equal(result.rector_documents.length, 3);
  assert.equal(result.no_go_check.no_go_triggered, false);
});

test("blocks if runtime spec is missing", () => {
  const result = run({
    rector_documents: validDocuments().filter(
      (document) => document.kind !== "runtime_technical_spec",
    ),
  });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("runtime_technical_spec_missing"));
});

test("blocks if runtime catalog is missing", () => {
  const result = run({
    rector_documents: validDocuments().filter(
      (document) => document.kind !== "runtime_catalog",
    ),
  });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("runtime_catalog_missing"));
});

test("blocks if mother catalog is missing", () => {
  const result = run({
    rector_documents: validDocuments().filter(
      (document) => document.kind !== "mother_catalog",
    ),
  });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("mother_catalog_missing"));
});

test("blocks if any rector document is unreadable", () => {
  const documents = validDocuments();
  documents[0] = {
    ...documents[0],
    readable: false,
    status: "unreadable",
  };

  const result = run({ rector_documents: documents });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("runtime_technical_spec_unreadable"));
});

test("blocks if required Runtime Catalog sheet is missing", () => {
  const manifest = validRuntimeCatalogSheetManifest();
  manifest.sheets_detected = manifest.sheets_detected.filter(
    (sheet) => sheet !== "QA_Checklist",
  );
  manifest.required_sheets = manifest.required_sheets.map((sheet) =>
    sheet.sheet_name === "QA_Checklist" ? { ...sheet, present: false } : sheet,
  );

  const result = run({ runtime_catalog_sheet_manifest: manifest });

  assert.equal(result.ok, false);
  assertGate(result, "T-014", false);
});

test("blocks if base count is not 40", () => {
  const manifest = validRuntimeCatalogSheetManifest();
  manifest.base_interaction_count = 39;

  const result = run({ runtime_catalog_sheet_manifest: manifest });

  assert.equal(result.ok, false);
  assertGate(result, "T-001", false);
});

test("blocks if causal count is not 20", () => {
  const manifest = validRuntimeCatalogSheetManifest();
  manifest.causal_interaction_count = 19;

  const result = run({ runtime_catalog_sheet_manifest: manifest });

  assert.equal(result.ok, false);
  assertGate(result, "T-002", false);
});

test("blocks if checksum_registered=false", () => {
  const result = run({
    checksum_manifest: {
      ...validChecksumManifest(),
      checksum_registered: false,
    },
  });

  assert.equal(result.ok, false);
  assertGate(result, "T-016", false);
});

test("blocks if version_alignment_ok=false", () => {
  const result = run({
    version_matrix: {
      ...validVersionMatrix(),
      version_alignment_ok: false,
    },
  });

  assert.equal(result.ok, false);
  assertGate(result, "T-017", false);
});

test("produces T-001 gate", () => {
  assertGate(run(), "T-001", true);
});

test("produces T-002 gate", () => {
  assertGate(run(), "T-002", true);
});

test("produces T-014 gate", () => {
  assertGate(run(), "T-014", true);
});

test("produces T-016 gate", () => {
  assertGate(run(), "T-016", true);
});

test("produces T-017 gate", () => {
  assertGate(run(), "T-017", true);
});

test("produces T-019 gate", () => {
  assertGate(run(), "T-019", true);
});

test("produces T-020 gate", () => {
  assertGate(run(), "T-020", true);
});

test("keeps runtime_40_20_started=false", () => {
  const result = run();

  assert.equal(result.no_go_check.runtime_40_20_started, false);
  assert.equal(result.materiality.runtime_40_20_started, false);
});

test("keeps supabase/sql/endpoint false", () => {
  const result = run();

  assert.equal(result.no_go_check.supabase_touched, false);
  assert.equal(result.no_go_check.sql_executed, false);
  assert.equal(result.no_go_check.endpoint_created, false);
});

test("keeps registry/IR/Object Inventory/F5C/export/diagnosis/Delivered false", () => {
  const result = run();

  assert.equal(result.no_go_check.registry_live_db_created, false);
  assert.equal(result.no_go_check.ir_real_created, false);
  assert.equal(result.no_go_check.object_inventory_real_opened, false);
  assert.equal(result.no_go_check.f5c_real_opened, false);
  assert.equal(result.no_go_check.export_created, false);
  assert.equal(result.no_go_check.diagnosis_created, false);
  assert.equal(result.no_go_check.delivered_created, false);
});

test("does not modify existing services", () => {
  const result = run();

  assert.equal(typeof service.runRuntimeRectorSourceBaselineGate, "function");
  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runRuntimeRectorSourceBaselineGate({
    case_id: "case:runtime-40-20-baseline",
    rector_documents: validDocuments(),
    runtime_catalog_sheet_manifest: validRuntimeCatalogSheetManifest(),
    mother_catalog_sheet_manifest: validMotherCatalogSheetManifest(),
    version_matrix: validVersionMatrix(),
    checksum_manifest: validChecksumManifest(),
    ...overrides,
  });
}

function assertGate(result, gateId, passed) {
  const gate = result.gate_results.find((item) => item.gate_id === gateId);

  assert.ok(gate, `${gateId} was not produced`);
  assert.equal(gate.passed, passed);
}

function validDocuments() {
  return [
    {
      kind: "runtime_technical_spec",
      filename: "EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
      expected_path:
        "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
      detected_path:
        "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
      expected_version: "v1.0.1",
      detected_version: "v1.0.1",
      readable: true,
      checksum:
        "b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8",
      status: "found_readable",
    },
    {
      kind: "runtime_catalog",
      filename: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      expected_path:
        "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      detected_path:
        "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
      expected_version: "v1.1.1",
      detected_version: "v1.1.1",
      readable: true,
      checksum:
        "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0",
      status: "found_readable",
    },
    {
      kind: "mother_catalog",
      filename: "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
      expected_path:
        "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
      detected_path:
        "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
      expected_version: "1.0",
      detected_version: "1.0",
      readable: true,
      checksum:
        "09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2",
      status: "found_readable",
    },
  ];
}

function validRuntimeCatalogSheetManifest() {
  const sheets = [
    "Version_Control",
    "Runtime_Interactions_Base_40",
    "Runtime_Interactions_Causal_20",
    "Required_Field_Model",
    "UX_Subfield_Structure",
    "Epistemic_Policy",
    "MMABP_Output_Map",
    "Canonical_Variables",
    "Branching_Budget_Rules",
    "Critical_Routes",
    "Semantic_Resolution_Gates",
    "Process_State_Timer_Gates",
    "Readiness_Gaps_Reentry",
    "Parallel_Production_Contract",
    "QA_Checklist",
    "Implementation_Dictionaries",
  ];

  return {
    workbook_filename:
      "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    sheets_detected: sheets,
    required_sheets: sheets.map((sheetName) => ({
      sheet_name: sheetName,
      present: true,
    })),
    base_interaction_count: 40,
    causal_interaction_count: 20,
  };
}

function validMotherCatalogSheetManifest() {
  return {
    workbook_filename: "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
    sheets_detected: [
      "Version_Control",
      "Corpus_Documental",
      "Resumen_por_Bloque",
      "Catalogo_Madre_Nodos",
      "Source_Question_Registry",
      "Runtime_Classification",
      "UX_Copy_View",
      "Epistemic_Governance",
      "MMABP_Mapping",
      "Canonical_Variables",
      "Critical_Routes",
      "Trigger_Branching_Rules",
      "Readiness_Reentry_Gaps",
      "VSM_AHE_Prep",
      "Variables_Canonicas_Source",
      "Implementation_Dictionaries",
      "Audit_Issues",
    ],
    inspected: true,
  };
}

function validVersionMatrix() {
  return {
    runtime_spec_version: "v1.0.1",
    runtime_catalog_version: "v1.1.1",
    mother_catalog_version: "1.0",
    version_alignment_ok: true,
  };
}

function validChecksumManifest() {
  return {
    runtime_spec_checksum:
      "b95256c7e32e14da82c4b623ae6b08d972cf1171ab5046564fed2ff9e6f24dd8",
    runtime_catalog_checksum:
      "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0",
    mother_catalog_checksum:
      "09531a66fde4c8f17e88d591ae523992a6c42d448965ef52012c2c2de7d948a2",
    checksum_registered: true,
  };
}

function loadService() {
  const source = readFileSync(
    new URL("./runtime-rector-source-baseline-service.ts", import.meta.url),
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
      if (specifier === "./runtime-rector-source-baseline-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "runtime-rector-source-baseline-service.ts",
  });

  return context.exports;
}
