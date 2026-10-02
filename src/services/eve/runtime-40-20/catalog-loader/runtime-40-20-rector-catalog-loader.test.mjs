import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { inflateRawSync } from "node:zlib";
import ts from "typescript";

const service = loadService();

test("blocks if allow_file_read=false", async () => {
  const result = await run({ options: { allow_file_read: false } });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "allow_file_read_required");
});

test("blocks if runtime spec path is missing", async () => {
  const result = await run({
    document_paths: {
      ...validDocumentPaths(),
      runtime_spec_path: "docs/runtime/missing-runtime-spec.docx",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "runtime_spec_path_missing");
});

test("blocks if runtime catalog path is missing", async () => {
  const result = await run({
    document_paths: {
      ...validDocumentPaths(),
      runtime_catalog_path: "docs/runtime/missing-runtime-catalog.xlsx",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "runtime_catalog_path_missing");
});

test("blocks if mother catalog path is missing", async () => {
  const result = await run({
    document_paths: {
      ...validDocumentPaths(),
      mother_catalog_path: "docs/runtime/missing-mother-catalog.xlsx",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "mother_catalog_path_missing");
});

test("extracts runtime spec metadata from DOCX", async () => {
  const result = await run();

  assert.equal(result.ok, true);
  assert.equal(result.extraction_report.runtime_spec_extract.detected_version, "v1.0.1");
  assert.equal(result.extraction_report.runtime_spec_extract.mentions_runtime_40_20, true);
  assert.equal(
    result.extraction_report.runtime_spec_extract.mentions_runtime_catalog_v1_1_1,
    true,
  );
  assert.equal(
    result.extraction_report.runtime_spec_extract.mentions_mother_catalog_v1_0,
    true,
  );
});

test("extracts Runtime Catalog sheet names", async () => {
  const result = await run();

  assert.ok(
    result.extraction_report.runtime_catalog_sheets_detected.includes(
      "Runtime_Interactions_Base_40",
    ),
  );
  assert.ok(
    result.extraction_report.runtime_catalog_sheets_detected.includes(
      "Runtime_Interactions_Causal_20",
    ),
  );
});

test("extracts Mother Catalog sheet names", async () => {
  const result = await run();

  assert.ok(
    result.extraction_report.mother_catalog_sheets_detected.includes(
      "Catalogo_Madre_Nodos",
    ),
  );
  assert.ok(
    result.extraction_report.mother_catalog_sheets_detected.includes(
      "Source_Question_Registry",
    ),
  );
});

test("extracts 40 base interactions", async () => {
  const result = await run();

  assert.equal(result.extraction_report.runtime_base_interactions.length, 40);
  assert.equal(result.extraction_report.base_count, 40);
});

test("extracts 20 causal interactions", async () => {
  const result = await run();

  assert.equal(result.extraction_report.runtime_causal_interactions.length, 20);
  assert.equal(result.extraction_report.causal_count, 20);
});

test("extracts generic runtime rows with source trace", async () => {
  const result = await run();
  const row = result.extraction_report.runtime_generic_extracts.find(
    (item) => item.extract_kind === "qa_rule",
  );

  assert.ok(row);
  assert.equal(row.source_document, "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx");
  assert.equal(typeof row.source_sheet, "string");
  assert.equal(typeof row.source_row_number, "number");
  assert.equal(typeof row.raw_row, "object");
});

test("extracts mother catalog rows with source trace", async () => {
  const result = await run();
  const row = result.extraction_report.mother_generic_extracts.find(
    (item) => item.extract_kind === "mother_node",
  );

  assert.ok(row);
  assert.equal(row.source_document, "EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx");
  assert.equal(row.source_sheet, "Catalogo_Madre_Nodos");
  assert.equal(typeof row.source_row_number, "number");
  assert.equal(typeof row.raw_row, "object");
});

test("blocks if required runtime sheet is missing", async () => {
  const paths = validDocumentPaths();
  const result = await run({
    document_paths: {
      ...paths,
      runtime_catalog_path: paths.mother_catalog_path,
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.blocked_reason, "missing_required_runtime_catalog_sheet");
});

test("blocks if base_count is not 40", async () => {
  const paths = validDocumentPaths();
  const result = await run({
    document_paths: {
      ...paths,
      runtime_catalog_path: paths.mother_catalog_path,
    },
  });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("runtime_base_count_not_40"));
});

test("blocks if causal_count is not 20", async () => {
  const paths = validDocumentPaths();
  const result = await run({
    document_paths: {
      ...paths,
      runtime_catalog_path: paths.mother_catalog_path,
    },
  });

  assert.equal(result.ok, false);
  assert.ok(result.no_go_check.blockers.includes("runtime_causal_count_not_20"));
});

test("keeps Runtime 40/20 not started", async () => {
  const result = await run();

  assert.equal(result.no_go_check.runtime_40_20_started, false);
  assert.equal(result.materiality.runtime_40_20_started, false);
});

test("keeps Supabase/SQL/endpoint false", async () => {
  const result = await run();

  assert.equal(result.no_go_check.supabase_touched, false);
  assert.equal(result.no_go_check.sql_executed, false);
  assert.equal(result.no_go_check.endpoint_created, false);
});

test("keeps Registry/IR/Object Inventory/F5C/export/diagnosis/Delivered false", async () => {
  const result = await run();

  assert.equal(result.no_go_check.registry_live_db_created, false);
  assert.equal(result.no_go_check.ir_real_created, false);
  assert.equal(result.no_go_check.object_inventory_real_opened, false);
  assert.equal(result.no_go_check.f5c_real_opened, false);
  assert.equal(result.no_go_check.export_created, false);
  assert.equal(result.no_go_check.diagnosis_created, false);
  assert.equal(result.no_go_check.delivered_created, false);
});

test("does not modify existing services", async () => {
  const result = await run();

  assert.equal(typeof service.runRuntime4020RectorCatalogLoader, "function");
  assert.equal(result.materiality.local_only, true);
  assert.equal(result.materiality.next_authorization_required, true);
});

function run(overrides = {}) {
  return service.runRuntime4020RectorCatalogLoader({
    case_id: "case:runtime-40-20-loader",
    document_paths: validDocumentPaths(),
    options: {
      allow_file_read: true,
    },
    ...overrides,
  });
}

function validDocumentPaths() {
  return {
    runtime_spec_path:
      "docs/runtime/EVE_Runtime_40_20_Especificacion_Tecnica_Ejecutable_v1_0_1.docx",
    runtime_catalog_path:
      "docs/runtime/Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    mother_catalog_path:
      "docs/chips/canonical-catalog/EVE_03_Canonical_Catalog_v0_1/sources/EVE_Catalogo_Madre_Capa1_v1_0_Bloques_0_0_5_1_7.xlsx",
  };
}

function loadService() {
  const source = readFileSyncText(
    new URL("./runtime-40-20-rector-catalog-loader-service.ts", import.meta.url),
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
  }).outputText;
  const context = {
    Buffer,
    exports: {},
    process,
    require(specifier) {
      if (specifier === "node:fs/promises") {
        return { access, readFile };
      }
      if (specifier === "node:path") {
        return path;
      }
      if (specifier === "node:zlib") {
        return { inflateRawSync };
      }
      if (specifier === "./runtime-40-20-rector-catalog-loader-types") {
        return {};
      }
      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(transpiled, context, {
    filename: "runtime-40-20-rector-catalog-loader-service.ts",
  });

  return context.exports;
}

function readFileSyncText(url) {
  return readFileSync(url, "utf8");
}
