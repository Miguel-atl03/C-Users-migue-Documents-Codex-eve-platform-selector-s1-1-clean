import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  validateClientMmabpStructuralFacts,
  validateDesignHandoffPackage,
  validateMmabpIrPackage,
  validateMmabpDesignSourceBundle,
  validateParallelProduction,
  validateParallelProductionContractSurface,
  validateQuadrantRegistryPackage,
} from "../../../scripts/validate-parallel-production.mjs";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

test("mmabp_design_source_bundle fixture is valid and traceable", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const result = validateMmabpDesignSourceBundle(bundle);

  assert.equal(result.status, "passed", result.errors.join("\n"));
  assert.equal(bundle.bundle_type, "mmabp_design_source_bundle");
  assert.equal(bundle.source_core.source_contract_id, "platform-consumption-contract.capa-1.v2.1");
  assert.equal(bundle.boundaries.does_not_modify_capa2_readiness, true);
});

test("parallel production validator preserves the core Capa 1 -> Capa 2 contract", () => {
  const report = validateParallelProduction();
  const coreContract = readJson("src/runtime/platform-consumption-contract.json");

  assert.equal(report.status, "passed", report.failures.join("\n"));
  assert.ok(coreContract.required_bundles.includes("evidence_bundle_for_transduction"));
  assert.ok(!coreContract.required_bundles.includes("mmabp_design_source_bundle"));
});

test("contract surface declares every normative artifact and boundary", () => {
  const result = validateParallelProductionContractSurface();
  const doc = fs.readFileSync(
    path.join(root, "docs/capa1-parallel-production-design-handoff-contract.md"),
    "utf8",
  );

  assert.equal(result.status, "passed", result.errors.join("\n"));
  for (const schemaPath of result.schema_files) {
    assert.ok(fs.existsSync(path.join(root, schemaPath)), `${schemaPath} missing`);
  }
  assert.ok(doc.includes("mmabp_design_source_bundle"));
  assert.ok(doc.includes("client_mmabp_structural_facts"));
  assert.ok(doc.includes("quadrant_registry_package"));
  assert.ok(doc.includes("mmabp_ir_package"));
  assert.ok(doc.includes("parallel_production_design_handoff_package"));
  assert.ok(doc.includes("no modifica Capa 1.0 core"));
});

test("bundle candidates cannot be accepted without evidence references", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  bundle.quadrant_candidates[0].source_evidence_ids = ["UNKNOWN_EVIDENCE"];

  const result = validateMmabpDesignSourceBundle(bundle);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("unknown evidence")));
});

test("bundle rejects diagnostic leakage", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  bundle.root_cause = "diagnostico prohibido";

  const result = validateMmabpDesignSourceBundle(bundle);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("forbidden diagnostic key")));
});

test("client_mmabp_structural_facts fixture is valid and derived from bundle candidates", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");

  const result = validateClientMmabpStructuralFacts(inventory, bundle);

  assert.equal(result.status, "passed", result.errors.join("\n"));
  assert.equal(inventory.inventory_type, "client_mmabp_structural_facts");
  assert.equal(inventory.client_id, bundle.client_context.client_id);
  assert.equal(inventory.source_bundle_id, bundle.bundle_id);
});

test("structural facts cannot drift to another client", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  inventory.structural_facts[0].client_id = "CLIENTE_DISTINTO";

  const result = validateClientMmabpStructuralFacts(inventory, bundle);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("client_id must match")));
});

test("structural facts cannot reference unsupported quadrants from source candidates", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  inventory.structural_facts[1].quadrant_targets = ["MoC"];

  const result = validateClientMmabpStructuralFacts(inventory, bundle);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("not supported by source candidates")));
});

test("quadrant registry package is valid and sourced from structural facts", () => {
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");

  const result = validateQuadrantRegistryPackage(registryPackage, inventory);

  assert.equal(result.status, "passed", result.errors.join("\n"));
  assert.equal(registryPackage.registry_package_type, "quadrant_registry_package");
  assert.equal(registryPackage.source_inventory_id, inventory.inventory_id);
  assert.equal(registryPackage.registries.PF.quadrant, "PF");
});

test("quadrant registry cannot use a fact outside its declared quadrant", () => {
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  registryPackage.registries.MoC.elements.push({
    element_id: "MOC_BAD_001",
    element_type: "class",
    label: "Solicitud",
    source_fact_ids: ["FACT_000002"],
    conformance_status: "pending",
    consistency_status: "pending"
  });

  const result = validateQuadrantRegistryPackage(registryPackage, inventory);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("outside quadrant MoC")));
});

test("quadrant registry must cover or gap every fact quadrant", () => {
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  registryPackage.registries.PM.elements = [];
  registryPackage.registries.PM.gaps = [];

  const result = validateQuadrantRegistryPackage(registryPackage, inventory);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("not represented or gapped")));
});

test("MMABP-IR package is valid and sourced from quadrant registries", () => {
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const conformanceReport = readJson("tests/fixtures/parallel-production/conformance-report-passed.json");
  const consistencyReport = readJson("tests/fixtures/parallel-production/consistency-report-passed.json");
  const designGaps = [
    readJson("tests/fixtures/parallel-production/design-gap-non-blocking.json"),
    readJson("tests/fixtures/parallel-production/design-gap-moc-support.json"),
  ];

  const result = validateMmabpIrPackage(irPackage, registryPackage, {
    conformanceReport,
    consistencyReport,
  }, designGaps);

  assert.equal(result.status, "passed", result.errors.join("\n"));
  assert.equal(irPackage.ir_package_type, "mmabp_ir_package");
  assert.equal(irPackage.source_registry_package_id, registryPackage.registry_package_id);
});

test("MMABP-IR cannot reference unknown registry elements", () => {
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  irPackage.models.PF_IR.elements[0].source_registry_element_ids = ["UNKNOWN_REGISTRY_ELEMENT"];

  const result = validateMmabpIrPackage(irPackage, registryPackage);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("unknown registry element")));
});

test("MMABP-IR cannot invent unsupported fact references", () => {
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  irPackage.models.PF_IR.elements[0].source_fact_ids = ["FACT_000002"];

  const result = validateMmabpIrPackage(irPackage, registryPackage);

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("not supported by registry element")));
});

test("design handoff package is valid and references the full parallel chain", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const handoffPackage = readJson("tests/fixtures/parallel-production/design-handoff-package.json");

  const result = validateDesignHandoffPackage(handoffPackage, {
    bundle,
    inventory,
    registryPackage,
    irPackage,
  });

  assert.equal(result.status, "passed", result.errors.join("\n"));
  assert.equal(handoffPackage.handoff_package_type, "parallel_production_design_handoff_package");
  assert.equal(handoffPackage.artifact_refs.mmabp_ir_package_id, irPackage.ir_package_id);
});

test("design handoff package cannot point to a missing artifact", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const handoffPackage = readJson("tests/fixtures/parallel-production/design-handoff-package.json");
  handoffPackage.artifact_refs.mmabp_ir_package_id = "MISSING_IR";

  const result = validateDesignHandoffPackage(handoffPackage, {
    bundle,
    inventory,
    registryPackage,
    irPackage,
  });

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("mmabp_ir_package_id must match")));
});

test("design handoff package cannot reference unknown IR gaps", () => {
  const bundle = readJson("tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");
  const inventory = readJson("tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const registryPackage = readJson("tests/fixtures/parallel-production/quadrant-registries.json");
  const irPackage = readJson("tests/fixtures/parallel-production/mmabp-ir-package.json");
  const handoffPackage = readJson("tests/fixtures/parallel-production/design-handoff-package.json");
  handoffPackage.handoff_gaps[0].source_gap_ids = ["UNKNOWN_IR_GAP"];

  const result = validateDesignHandoffPackage(handoffPackage, {
    bundle,
    inventory,
    registryPackage,
    irPackage,
  });

  assert.equal(result.status, "failed");
  assert.ok(result.errors.some((error) => error.includes("unknown IR gap")));
});

test("validation report records the complete implementation chain", () => {
  const report = validateParallelProduction();

  assert.equal(report.status, "passed", report.failures.join("\n"));
  assert.equal(report.schema_count, 11);
  assert.equal(report.new_schema_count, 6);
  assert.equal(report.bundle_fixture_count, 1);
  assert.equal(report.structural_fact_fixture_count, 1);
  assert.equal(report.inventory_readiness_fixture_count, 1);
  assert.equal(report.design_gap_fixture_count, 2);
  assert.equal(report.quadrant_registry_fixture_count, 1);
  assert.equal(report.conformance_report_fixture_count, 1);
  assert.equal(report.consistency_report_fixture_count, 1);
  assert.equal(report.mmabp_ir_fixture_count, 1);
  assert.equal(report.design_handoff_fixture_count, 1);
  assert.equal(report.diagram_code_generation_fixture_count, 2);
  assert.equal(report.candidate_export_package_fixture_count, 1);
  assert.equal(report.warnings_count, 3);
  assert.equal(report.generated_candidate_files_count, 4);
  assert.equal(report.candidate_only_confirmed, true);
  assert.equal(report.prohibited_uses_confirmed, true);
  assert.equal(report.draft_artifacts_count, 1);
  assert.equal(report.prohibited_downstream_uses_detected, false);
  assert.equal(report.contract_surface.status, "passed");
  assert.equal(report.core_contract_unchanged, true);
  assert.equal(report.capa2_readiness_unchanged, true);
});

test("parallel production remains optional sidecar, never a required core bundle", () => {
  const coreContract = readJson("src/runtime/platform-consumption-contract.json");
  const forbiddenRequiredBundles = [
    "mmabp_design_source_bundle",
    "client_mmabp_structural_facts",
    "quadrant_registry_package",
    "mmabp_ir_package",
    "parallel_production_design_handoff_package",
  ];

  for (const bundleName of forbiddenRequiredBundles) {
    assert.ok(!coreContract.required_bundles.includes(bundleName), `${bundleName} leaked into core contract`);
  }
});
