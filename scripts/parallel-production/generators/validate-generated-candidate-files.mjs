import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  asArray,
  hasOpenBlockingGap,
  readJson,
  REQUIRED_CANDIDATE_PROHIBITED_USES,
  sha256,
} from "./generator-utils.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(moduleDir, "..", "..", "..");

const result = (errors, warnings = [], summary = {}) => ({
  status: errors.length ? "failed" : "passed",
  failureCount: errors.length,
  warningCount: warnings.length,
  errors,
  warnings,
  summary,
});

function collectIrElements(irPackage) {
  return Object.values(irPackage?.models ?? {}).flatMap((model) =>
    asArray(model.elements).map((element) => ({ ...element, quadrant: model.quadrant })),
  );
}

function collectRegistryElements(registryPackage) {
  return Object.values(registryPackage?.registries ?? {}).flatMap((registry) =>
    asArray(registry.elements).map((element) => ({ ...element, quadrant: registry.quadrant })),
  );
}

function assertXmlLooksWellFormed(content, label, errors) {
  if (!content.includes("<bpmn:definitions")) errors.push(`${label} missing bpmn:definitions`);
  const openTags = [...content.matchAll(/<([A-Za-z0-9:_-]+)(\s[^>]*)?>/g)]
    .map((match) => match[1])
    .filter((tag) => !tag.startsWith("?") && !tag.includes("!"));
  const closeTags = [...content.matchAll(/<\/([A-Za-z0-9:_-]+)>/g)].map((match) => match[1]);
  for (const tag of closeTags) {
    if (!openTags.includes(tag)) errors.push(`${label} has closing tag without opening tag: ${tag}`);
  }
  if (!content.trim().endsWith("</bpmn:definitions>")) errors.push(`${label} XML is not closed with bpmn:definitions`);
}

function assertBpmnTraceability(content, exportItem, errors) {
  const elementMatches = [...content.matchAll(/<bpmn:(startEvent|endEvent|task|userTask|serviceTask|subProcess|intermediateCatchEvent|exclusiveGateway|inclusiveGateway|parallelGateway|textAnnotation)\b[^>]*id="([^"]+)"/g)];
  for (const [, type, id] of elementMatches) {
    const closePattern = new RegExp(`<\\/bpmn:${type}>`);
    const isSelfClosed = new RegExp(`<bpmn:${type}\\b[^>]*id="${id}"[^>]*/>`).test(content);
    const afterElement = content.slice(content.indexOf(`id="${id}"`), content.indexOf(`id="${id}"`) + 800);
    if (!isSelfClosed && closePattern.test(content) && !afterElement.includes("source_ir_element_ids")) {
      errors.push(`${exportItem.export_id} BPMN element ${id} missing source_ir_element_ids documentation`);
    }
  }
}

function assertPlantUmlTraceability(content, exportItem, errors) {
  if (!content.includes("@startuml") || !content.includes("@enduml")) {
    errors.push(`${exportItem.export_id} PlantUML must include @startuml and @enduml`);
  }
  for (const token of ["candidate_only: true", "source_ir_element_ids", "source_registry_element_ids", "source_fact_ids"]) {
    if (!content.includes(token)) errors.push(`${exportItem.export_id} PlantUML missing trace token ${token}`);
  }
}

export function validateGeneratedCandidateFiles({
  root = defaultRoot,
  candidateExportPackage,
  irPackage,
  registryPackage,
  inventory,
  sourceBundle,
  designGaps = [],
} = {}) {
  const errors = [];
  const warnings = [];
  const packageJson =
    candidateExportPackage ??
    readJson(root, "tests/fixtures/parallel-production/candidate-export-package.json");
  const ir =
    irPackage ?? readJson(root, "tests/fixtures/parallel-production/mmabp-ir-package.json");
  const registry =
    registryPackage ?? readJson(root, "tests/fixtures/parallel-production/quadrant-registries.json");
  const factsInventory =
    inventory ?? readJson(root, "tests/fixtures/parallel-production/client-mmabp-structural-facts.json");
  const bundle =
    sourceBundle ?? readJson(root, "tests/fixtures/parallel-production/valid-mmabp-design-source-bundle.json");

  const irElementIds = new Set(collectIrElements(ir).map((element) => element.ir_element_id));
  const registryElementIds = new Set(collectRegistryElements(registry).map((element) => element.element_id));
  const factIds = new Set(asArray(factsInventory.structural_facts).map((fact) => fact.fact_id));
  const evidenceIds = new Set(asArray(bundle.literal_evidence).map((evidence) => evidence.evidence_id));
  const gapById = new Map(asArray(designGaps).map((gap) => [gap.gap_id, gap]));
  const generatedFormats = [];
  const generatedByQuadrant = {};
  let candidateOnlyConfirmed = true;
  let prohibitedUsesConfirmed = true;

  if (packageJson.export_readiness !== "blocked") {
    for (const requiredUse of REQUIRED_CANDIDATE_PROHIBITED_USES) {
      if (!asArray(packageJson.prohibited_uses).includes(requiredUse)) {
        prohibitedUsesConfirmed = false;
        errors.push(`candidate_export_package missing prohibited use ${requiredUse}`);
      }
    }
  }

  const packageOpenBlockingGaps = asArray(packageJson.gaps)
    .map((gapId) => gapById.get(gapId))
    .filter(hasOpenBlockingGap);
  if (packageOpenBlockingGaps.length) errors.push("candidate_export_package cannot be ready with open blocking design gaps");

  for (const [index, exportItem] of asArray(packageJson.exports).entries()) {
    for (const field of [
      "export_id",
      "quadrant",
      "export_format",
      "file_path",
      "content_hash",
      "source_ir_element_ids",
      "source_registry_element_ids",
      "source_fact_ids",
      "source_evidence_ids",
      "traceability_status",
      "semantic_preservation_status",
    ]) {
      if (!(field in exportItem)) errors.push(`exports[${index}] missing ${field}`);
    }
    if (!asArray(exportItem.source_ir_element_ids).length) errors.push(`${exportItem.export_id} missing source_ir_element_ids`);
    for (const id of asArray(exportItem.source_ir_element_ids)) {
      if (!irElementIds.has(id)) errors.push(`${exportItem.export_id} references unknown IR element ${id}`);
    }
    for (const id of asArray(exportItem.source_registry_element_ids)) {
      if (!registryElementIds.has(id)) errors.push(`${exportItem.export_id} references unknown registry element ${id}`);
    }
    for (const id of asArray(exportItem.source_fact_ids)) {
      if (!factIds.has(id)) errors.push(`${exportItem.export_id} references unknown structural fact ${id}`);
    }
    for (const id of asArray(exportItem.source_evidence_ids)) {
      if (!evidenceIds.has(id)) errors.push(`${exportItem.export_id} references unknown evidence ${id}`);
    }
    for (const gapId of asArray(exportItem.gaps)) {
      const gap = gapById.get(gapId);
      if (!gap) errors.push(`${exportItem.export_id} references unknown design gap ${gapId}`);
      if (hasOpenBlockingGap(gap)) errors.push(`${exportItem.export_id} cannot be ready with open blocking design gap ${gapId}`);
    }
    if (exportItem.semantic_preservation_status === "passed_with_warnings" && !asArray(exportItem.warnings).length) {
      errors.push(`${exportItem.export_id} passed_with_warnings requires explicit warnings`);
    }
    const absolutePath = path.join(root, exportItem.file_path ?? "");
    if (!fs.existsSync(absolutePath)) {
      errors.push(`${exportItem.export_id} generated file does not exist: ${exportItem.file_path}`);
      continue;
    }
    const content = fs.readFileSync(absolutePath, "utf8");
    if (sha256(content) !== exportItem.content_hash) errors.push(`${exportItem.export_id} content_hash does not match file`);
    if (!content.includes("candidate_only")) {
      candidateOnlyConfirmed = false;
      errors.push(`${exportItem.export_id} generated file missing candidate_only marker`);
    }
    if (!content.includes("source_ir_element_ids") || !content.includes("source_registry_element_ids") || !content.includes("source_fact_ids")) {
      errors.push(`${exportItem.export_id} generated file missing minimum traceability markers`);
    }
    if (exportItem.export_format === "BPMN_XML") {
      assertXmlLooksWellFormed(content, exportItem.export_id, errors);
      assertBpmnTraceability(content, exportItem, errors);
    }
    if (["PLANTUML_CLASS", "PLANTUML_STATE"].includes(exportItem.export_format)) {
      assertPlantUmlTraceability(content, exportItem, errors);
    }
    if (exportItem.export_format === "XMI_OPTIONAL" && !content.includes("source_ir_element_ids")) {
      errors.push(`${exportItem.export_id} XMI missing traceability comments/tagged values`);
    }
    generatedFormats.push(exportItem.export_format);
    generatedByQuadrant[exportItem.quadrant] = (generatedByQuadrant[exportItem.quadrant] ?? 0) + 1;
  }

  return result(errors, warnings, {
    generated_candidate_files_count: asArray(packageJson.exports).length,
    generated_formats: [...new Set(generatedFormats)],
    generated_by_quadrant: generatedByQuadrant,
    traceability_coverage: errors.some((error) => error.includes("trace")) ? "incomplete" : "complete",
    semantic_preservation_status: packageJson.semantic_preservation_status,
    warnings_count: asArray(packageJson.warnings).length + asArray(packageJson.exports).flatMap((item) => asArray(item.warnings)).length,
    gaps_count: asArray(packageJson.gaps).length + asArray(packageJson.exports).flatMap((item) => asArray(item.gaps)).length,
    blocking_gaps_count: packageOpenBlockingGaps.length,
    candidate_only_confirmed: candidateOnlyConfirmed,
    prohibited_uses_confirmed: prohibitedUsesConfirmed,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const designGaps = fs
    .readdirSync(path.join(defaultRoot, "tests", "fixtures", "parallel-production"))
    .filter((file) => file.includes("design-gap") && file.endsWith(".json"))
    .map((file) => readJson(defaultRoot, path.join("tests", "fixtures", "parallel-production", file)));
  const report = validateGeneratedCandidateFiles({ root: defaultRoot, designGaps });
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "passed") process.exitCode = 1;
}
