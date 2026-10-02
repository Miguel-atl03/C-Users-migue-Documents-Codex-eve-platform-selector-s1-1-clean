import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateMocPlantUml } from "./generate-moc-plantuml.mjs";
import { generateOlcPlantUml } from "./generate-olc-plantuml.mjs";
import { generatePfBpmn } from "./generate-pf-bpmn.mjs";
import { generatePmBpmn } from "./generate-pm-bpmn.mjs";
import { generateXmiOptional } from "./generate-xmi-optional.mjs";
import {
  asArray,
  hasOpenBlockingGap,
  readJson,
  REQUIRED_CANDIDATE_PROHIBITED_USES,
  requireIrValidated,
  unique,
  writeGeneratedFile,
  writeJson,
} from "./generator-utils.mjs";
import { validateGeneratedCandidateFiles } from "./validate-generated-candidate-files.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(moduleDir, "..", "..", "..");
const fixtureRoot = "tests/fixtures/parallel-production";
const generatedDir = `${fixtureRoot}/generated-candidate-files`;

const generatorByFormat = {
  BPMN_XML: {
    PM: generatePmBpmn,
    PF: generatePfBpmn,
  },
  PLANTUML_CLASS: {
    MoC: generateMocPlantUml,
  },
  PLANTUML_STATE: {
    OLC: generateOlcPlantUml,
  },
};

const extensionByFormat = {
  BPMN_XML: "bpmn",
  PLANTUML_CLASS: "puml",
  PLANTUML_STATE: "puml",
};

const formatLabel = {
  BPMN_XML: "bpmn",
  PLANTUML_CLASS: "plantuml-class",
  PLANTUML_STATE: "plantuml-state",
};

function exportReadinessFromDiagramPackage(diagramPackage) {
  if (diagramPackage.generation_mode === "draft_with_warnings") return "draft_only";
  if (diagramPackage.generation_readiness === "ready_with_warnings") return "ready_with_warnings";
  if (diagramPackage.generation_readiness === "ready_for_candidate_generation") return "ready_for_review";
  return "blocked";
}

function packageModeFromDiagramPackage(diagramPackage) {
  if (diagramPackage.generation_mode === "draft_with_warnings") return "draft_with_warnings";
  if (diagramPackage.generation_mode === "candidate") return "candidate";
  return "blocked";
}

function fileNameForExport(exportItem) {
  const label = formatLabel[exportItem.export_format] ?? exportItem.export_format.toLowerCase();
  return `${generatedDir}/${exportItem.quadrant.toLowerCase()}-${label}-${exportItem.export_id.toLowerCase()}.${extensionByFormat[exportItem.export_format]}`;
}

export function generateCandidateExportPackage({ root = defaultRoot } = {}) {
  const diagramPackage = readJson(root, `${fixtureRoot}/diagram-code-generation-package.json`);
  const irPackage = readJson(root, `${fixtureRoot}/mmabp-ir-package.json`);
  const inventory = readJson(root, `${fixtureRoot}/client-mmabp-structural-facts.json`);
  const registryPackage = readJson(root, `${fixtureRoot}/quadrant-registries.json`);
  const bundle = readJson(root, `${fixtureRoot}/valid-mmabp-design-source-bundle.json`);
  const conformanceReport = readJson(root, `${fixtureRoot}/conformance-report-passed.json`);
  const consistencyReport = readJson(root, `${fixtureRoot}/consistency-report-passed.json`);
  const designGaps = ["design-gap-non-blocking.json", "design-gap-moc-support.json"]
    .map((file) => readJson(root, `${fixtureRoot}/${file}`));

  const validationErrors = requireIrValidated(irPackage, conformanceReport, consistencyReport);
  const referencedGapIds = asArray(diagramPackage.exports).flatMap((exportItem) => asArray(exportItem.gaps));
  const gapById = new Map(designGaps.map((gap) => [gap.gap_id, gap]));
  const openBlockingGaps = referencedGapIds.map((gapId) => gapById.get(gapId)).filter(hasOpenBlockingGap);
  if (openBlockingGaps.length) validationErrors.push("Cannot generate candidate export package with open blocking gaps");
  if (validationErrors.length) throw new Error(validationErrors.join("; "));

  const generatedExports = [];
  const packageWarnings = [...asArray(diagramPackage.warnings)];

  for (const diagramExport of asArray(diagramPackage.exports)) {
    const generator = generatorByFormat[diagramExport.export_format]?.[diagramExport.quadrant];
    if (!generator) continue;
    const content = generator({ irPackage, inventory, registryPackage, sourceBundle: bundle, diagramExport });
    const output = writeGeneratedFile(root, fileNameForExport(diagramExport), content);
    generatedExports.push({
      export_id: diagramExport.export_id.replace(/^EXP_/, "CEXP_"),
      source_diagram_export_id: diagramExport.export_id,
      quadrant: diagramExport.quadrant,
      export_format: diagramExport.export_format,
      ...output,
      source_ir_element_ids: asArray(diagramExport.source_ir_element_ids),
      source_registry_element_ids: asArray(diagramExport.source_registry_element_ids),
      source_fact_ids: asArray(diagramExport.source_fact_ids),
      source_candidate_ids: asArray(diagramExport.source_candidate_ids),
      source_evidence_ids: asArray(diagramExport.source_evidence_ids),
      source_scene_ids: asArray(diagramExport.source_scene_ids),
      source_blocks: asArray(diagramExport.source_blocks),
      source_questions: asArray(diagramExport.source_questions),
      warnings: asArray(diagramExport.warnings),
      gaps: asArray(diagramExport.gaps),
      semantic_preservation_status: diagramExport.semantic_preservation_status,
      traceability_status:
        diagramExport.traceability_status === "complete" ? "complete" : "complete_with_warnings",
      candidate_only: true,
      generated_file_is_evidence: false,
      prohibited_uses: REQUIRED_CANDIDATE_PROHIBITED_USES,
      allowed_uses: ["parallel_production_design_review", "candidate_diagram_review", "diagram_code_qa"],
    });
  }

  const xmiOptional = generateXmiOptional();
  packageWarnings.push(...xmiOptional.warnings);

  const packageJson = {
    candidate_export_package_id: "CLIENTE_001_CANDIDATE_EXPORT_PACKAGE_V1",
    package_type: "candidate_export_package",
    schema_version: "1.0.0",
    client_id: diagramPackage.client_id,
    source_diagram_code_generation_package_id: diagramPackage.package_id,
    source_mmabp_ir_package_id: irPackage.ir_package_id,
    generated_at: new Date().toISOString(),
    generation_mode: packageModeFromDiagramPackage(diagramPackage),
    export_readiness: exportReadinessFromDiagramPackage(diagramPackage),
    exports: generatedExports,
    warnings: packageWarnings,
    gaps: unique([
      ...asArray(diagramPackage.design_gap_ids),
      ...asArray(diagramPackage.exports).flatMap((exportItem) => asArray(exportItem.gaps)),
      ...asArray(xmiOptional.gaps),
    ]),
    traceability_summary: {
      coverage: "complete",
      source_ir_element_ids: unique(generatedExports.flatMap((exportItem) => exportItem.source_ir_element_ids)),
      source_registry_element_ids: unique(generatedExports.flatMap((exportItem) => exportItem.source_registry_element_ids)),
      source_fact_ids: unique(generatedExports.flatMap((exportItem) => exportItem.source_fact_ids)),
      source_candidate_ids: unique(generatedExports.flatMap((exportItem) => exportItem.source_candidate_ids)),
      source_evidence_ids: unique(generatedExports.flatMap((exportItem) => exportItem.source_evidence_ids)),
      source_scene_ids: unique(generatedExports.flatMap((exportItem) => exportItem.source_scene_ids)),
      source_blocks: unique(generatedExports.flatMap((exportItem) => exportItem.source_blocks)),
      source_questions: unique(generatedExports.flatMap((exportItem) => exportItem.source_questions)),
    },
    semantic_preservation_status: generatedExports.some((exportItem) => exportItem.semantic_preservation_status === "passed_with_warnings")
      ? "passed_with_warnings"
      : "passed",
    prohibited_uses: REQUIRED_CANDIDATE_PROHIBITED_USES,
    allowed_uses: ["parallel_production_design_review", "candidate_diagram_review", "diagram_code_qa"],
    boundaries: {
      candidate_only: true,
      generated_files_are_not_evidence: true,
      not_diagnostic: true,
      not_monetization: true,
      not_final_narrative: true,
      does_not_modify_capa2_readiness: true,
      does_not_modify_core_contract: true
    }
  };

  writeJson(root, `${fixtureRoot}/candidate-export-package.json`, packageJson);
  const validation = validateGeneratedCandidateFiles({
    root,
    candidateExportPackage: packageJson,
    irPackage,
    registryPackage,
    inventory,
    sourceBundle: bundle,
    designGaps,
  });
  if (validation.status !== "passed") throw new Error(validation.errors.join("; "));
  return { package: packageJson, validation };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = generateCandidateExportPackage({ root: defaultRoot });
  console.log(JSON.stringify(output.validation, null, 2));
}
