import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateGeneratedCandidateFiles } from "./parallel-production/generators/validate-generated-candidate-files.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(moduleDir, "..");

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const unique = (values) => [...new Set(values.filter(Boolean))];

const EXISTING_SCHEMA_FILES = [
  "schemas/parallel-production/mmabp-design-source-bundle.schema.json",
  "schemas/parallel-production/structural-fact.schema.json",
  "schemas/parallel-production/quadrant-registry.schema.json",
  "schemas/parallel-production/mmabp-ir.schema.json",
  "schemas/parallel-production/design-handoff-package.schema.json",
];

const NEW_SCHEMA_FILES = [
  "schemas/parallel-production/inventory-readiness.schema.json",
  "schemas/parallel-production/design-gap.schema.json",
  "schemas/parallel-production/conformance-report.schema.json",
  "schemas/parallel-production/consistency-report.schema.json",
  "schemas/parallel-production/diagram-code-generation-package.schema.json",
  "schemas/parallel-production/candidate-export-package.schema.json",
];

const EXPECTED_SCHEMA_FILES = [...EXISTING_SCHEMA_FILES, ...NEW_SCHEMA_FILES];
const CONTRACT_DOC_PATH = "docs/capa1-parallel-production-design-handoff-contract.md";
const DIAGRAM_CONTRACT_DOC_PATH =
  "docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md";

const EXPECTED_CONTRACT_TERMS = [
  "platform-design-handoff-contract.capa-1.parallel-production.v1",
  "platform-consumption-contract.capa-1.v2.1",
  "platform-diagram-code-generation-contract.capa-1.parallel-production.v1",
  "evidence_bundle_for_transduction",
  "mmabp_design_source_bundle",
  "client_mmabp_structural_facts",
  "inventory_readiness",
  "design_gap",
  "conformance_report",
  "consistency_report",
  "quadrant_registry_package",
  "mmabp_ir_package",
  "parallel_production_design_handoff_package",
  "diagram_code_generation_package",
  "candidate_export_package",
  "does_not_modify_capa2_readiness",
  "not_diagnostic",
  "No implementa todavia la generacion final de BPMN XML, PlantUML ni XMI",
];

const VALID_QUADRANTS = new Set(["PM", "PF", "MoC", "OLC"]);
const VALID_READINESS = new Set([
  "ready_for_design_handoff",
  "ready_with_gaps",
  "partial_design_source",
  "blocked_by_missing_evidence",
  "blocked_by_contradiction",
  "manual_review_required",
]);
const VALID_STRUCTURAL_FACT_TYPES = new Set([
  "business_process",
  "business_function",
  "trigger_event",
  "target_state",
  "object_class",
  "attribute",
  "operation",
  "relationship",
  "object_state",
  "transition",
  "self_loop",
  "task",
  "process_state",
  "timer_event",
  "gateway",
  "handoff",
  "support_process",
  "workaround",
  "capacity_constraint",
  "consistency_flag",
  "reentry_gap",
]);
const VALID_CONFORMANCE_STATUSES = new Set([
  "pending",
  "conformant",
  "conformant_with_flags",
  "non_conformant",
  "insufficient_evidence",
  "requires_reentry",
  "passed",
  "passed_with_warnings",
  "partial",
  "blocked",
]);
const VALID_CONSISTENCY_STATUSES = new Set([
  "pending",
  "consistent",
  "consistent_with_flags",
  "inconsistent",
  "unresolved",
  "requires_reentry",
  "passed",
  "passed_with_warnings",
  "partial",
  "blocked",
]);
const VALID_PROJECTION_STATUSES = new Set(["candidate", "accepted", "blocked", "requires_review"]);
const VALID_REGISTRY_READINESS = new Set([
  "registries_ready",
  "registries_ready_with_gaps",
  "partial_registries",
  "blocked_by_missing_facts",
  "blocked_by_semantic_conflict",
  "manual_review_required",
]);
const VALID_IR_READINESS = new Set([
  "ir_ready",
  "ir_ready_with_gaps",
  "partial_ir",
  "blocked_by_registry_gap",
  "blocked_by_semantic_conflict",
  "manual_review_required",
]);
const VALID_HANDOFF_READINESS = new Set([
  "ready_for_design_area",
  "ready_for_design_area_with_gaps",
  "partial_handoff",
  "blocked_by_missing_artifact",
  "blocked_by_ir_gap",
  "manual_review_required",
]);
const VALID_INVENTORY_READINESS = new Set([
  "ready_for_registry_projection",
  "ready_with_inventory_gaps",
  "partial_inventory",
  "blocked_by_semantic_conflict",
  "blocked_by_missing_structural_facts",
  "manual_review_required",
]);
const REGISTRY_ALLOWED_INVENTORY_READINESS = new Set([
  "ready_for_registry_projection",
  "ready_with_inventory_gaps",
]);
const VALID_REPORT_STATUSES = new Set(["passed", "passed_with_warnings", "partial", "blocked"]);
const REPORT_PASS_STATUSES = new Set(["passed", "passed_with_warnings"]);
const VALID_GAP_TYPES = new Set([
  "missing_evidence",
  "semantic_conflict",
  "quadrant_support_missing",
  "traceability_gap",
  "conformance_gap",
  "consistency_gap",
  "projection_gap",
  "generation_gap",
]);
const VALID_GAP_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const VALID_GAP_BLOCKING = new Set(["non_blocking", "warning", "blocking"]);
const VALID_GAP_RESOLUTION = new Set(["open", "in_review", "resolved", "accepted_risk"]);
const VALID_GENERATION_READINESS = new Set([
  "ready_for_candidate_generation",
  "ready_with_warnings",
  "blocked_by_ir_gaps",
  "blocked_by_conformance",
  "blocked_by_consistency",
  "manual_review_required",
]);
const VALID_GENERATION_MODES = new Set(["candidate", "draft_with_warnings", "blocked"]);
const VALID_EXPORT_FORMATS = new Set(["BPMN_XML", "PLANTUML_CLASS", "PLANTUML_STATE", "XMI_OPTIONAL"]);
const VALID_SEMANTIC_PRESERVATION = new Set(["passed", "passed_with_warnings", "draft_only", "blocked"]);
const DRAFT_PROHIBITED_USES = ["capa_2", "capa_2_5", "capa_3", "diagnostic", "monetization", "final_narrative", "final_export"];
const WARNING_REQUIRED_FIELDS = [
  "warning_id",
  "warning_type",
  "severity",
  "owner",
  "affected_artifact_type",
  "affected_element_ids",
  "reason",
  "downstream_effect",
  "allowed_uses",
  "prohibited_uses",
  "related_gap_ids",
  "resolution_recommendation",
  "traceability_status",
  "semantic_preservation_status",
];
const REQUIRED_CROSS_RELATIONS = ["PM_PF", "PF_OLC", "MoC_PF", "MoC_OLC", "PM_PF_OLC"];

const IR_MODEL_BY_QUADRANT = {
  PM: "PM_IR",
  PF: "PF_IR",
  MoC: "MoC_IR",
  OLC: "OLC_IR",
};

const FORBIDDEN_KEYS = [
  "diagnostic_finding",
  "root_cause",
  "closed_ahe_reading",
  "closed_vsm_classification",
  "capa_2_node_assignment",
  "monetization",
  "causal_movie",
  "final_narrative",
  "teorema_de_inevitabilidad",
  "recommendation",
  "recommendations",
];

const REQUIRED_BOUNDARIES = [
  "does_not_replace_evidence_bundle_for_transduction",
  "does_not_modify_capa2_readiness",
  "not_diagnostic",
  "not_monetization",
  "not_final_narrative",
];
const REQUIRED_STRUCTURAL_FACT_BOUNDARIES = [
  "not_diagnostic",
  "not_capa2_readiness",
  "not_monetization",
  "not_final_narrative",
];
const REQUIRED_REGISTRY_PACKAGE_BOUNDARIES = [
  "not_diagram",
  "not_mmabp_ir",
  "not_diagnostic",
  "not_capa2_readiness",
  "not_monetization",
  "not_final_narrative",
];
const REQUIRED_IR_PACKAGE_BOUNDARIES = [
  "not_diagram",
  "not_export_package",
  "not_diagnostic",
  "not_capa2_readiness",
  "not_monetization",
  "not_final_narrative",
];
const REQUIRED_HANDOFF_PACKAGE_BOUNDARIES = [
  "not_core_runtime_change",
  "not_capa2_handoff_replacement",
  "not_export_package",
  "not_diagnostic",
  "not_monetization",
  "not_final_narrative",
];
const REQUIRED_GENERATION_BOUNDARIES = [
  "not_diagnostic",
  "not_monetization",
  "not_final_narrative",
  "does_not_modify_capa2_readiness",
  "does_not_modify_core_contract",
  "does_not_replace_handoff_to_capa2",
];

function hasKeyDeep(value, forbiddenKey) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, forbiddenKey)) return true;
  return Object.values(value).some((nested) => hasKeyDeep(nested, forbiddenKey));
}

function pushMissing(errors, pathLabel, value, fields) {
  for (const field of fields) {
    if (!(field in (value ?? {}))) errors.push(`${pathLabel} missing ${field}`);
  }
}

function pushForbidden(errors, pathLabel, value) {
  for (const forbiddenKey of FORBIDDEN_KEYS) {
    if (hasKeyDeep(value, forbiddenKey)) {
      errors.push(`${pathLabel} forbidden diagnostic key present: ${forbiddenKey}`);
    }
  }
}

function requireTrueBoundaries(errors, pathLabel, boundaries, required) {
  pushMissing(errors, pathLabel, boundaries ?? {}, required);
  for (const boundary of required) {
    if (boundaries?.[boundary] !== true) errors.push(`${pathLabel}.${boundary} must be true`);
  }
}

function result(errors, warnings = []) {
  return {
    status: errors.length ? "failed" : "passed",
    failureCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };
}

function collectRegistryElements(registry) {
  const elements = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (value.element_id && value.source_fact_ids) elements.push(value);
    for (const nested of Object.values(value)) visit(nested);
  };
  visit(registry?.elements);
  return elements;
}

function collectRegistryFactRefs(value, refs = []) {
  if (!value || typeof value !== "object") return refs;
  if (Array.isArray(value)) {
    for (const item of value) collectRegistryFactRefs(item, refs);
    return refs;
  }
  if (Array.isArray(value.source_fact_ids)) refs.push(...value.source_fact_ids.map(String));
  for (const nested of Object.values(value)) collectRegistryFactRefs(nested, refs);
  return refs;
}

function collectIrRegistryRefs(value, refs = []) {
  if (!value || typeof value !== "object") return refs;
  if (Array.isArray(value)) {
    for (const item of value) collectIrRegistryRefs(item, refs);
    return refs;
  }
  if (Array.isArray(value.source_registry_element_ids)) {
    refs.push(...value.source_registry_element_ids.map(String));
  }
  for (const nested of Object.values(value)) collectIrRegistryRefs(nested, refs);
  return refs;
}

function collectIrElements(irPackage) {
  const elements = [];
  for (const [modelName, model] of Object.entries(irPackage?.models ?? {})) {
    for (const element of asArray(model.elements)) elements.push({ ...element, modelName, quadrant: model.quadrant });
  }
  return elements;
}

function collectIrGaps(irPackage) {
  return Object.values(irPackage?.models ?? {}).flatMap((model) => asArray(model.gaps));
}

function designGapMap(designGaps) {
  return new Map(asArray(designGaps).filter((gap) => gap?.gap_id).map((gap) => [gap.gap_id, gap]));
}

function isOpenBlockingGap(gap) {
  return gap?.blocking_status === "blocking" && ["open", "in_review"].includes(gap?.resolution_status);
}

function warningSeverityRank(severity) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity] ?? 0;
}

function packageWarnings(packageJson) {
  return [
    ...asArray(packageJson?.warnings),
    ...asArray(packageJson?.exports).flatMap((exportItem) => asArray(exportItem.warnings)),
  ];
}

function hasAcceptedRisk(warning) {
  return warning?.resolution_status === "accepted_risk" && hasAny(warning?.accepted_risk_justification);
}

function includesAll(values, required) {
  const valueSet = new Set(asArray(values));
  return required.every((item) => valueSet.has(item));
}

function referencedDesignGaps(ids, gapById) {
  return asArray(ids).map((id) => gapById.get(id)).filter(Boolean);
}

function readinessStatusFromInventory(inventory, inventoryReadiness) {
  return inventoryReadiness?.inventory_readiness ?? inventory?.inventory_readiness?.status ?? null;
}

function elementIsReady(element) {
  return ["conformant", "conformant_with_flags", "passed", "passed_with_warnings"].includes(
    element?.conformance_status,
  );
}

function hasAny(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function makeFactIndexes(inventory) {
  const facts = asArray(inventory?.structural_facts);
  return {
    facts,
    factById: new Map(facts.map((fact) => [fact.fact_id, fact])),
  };
}

function makeBundleIndexes(bundle) {
  const scenes = asArray(bundle?.source_scenes);
  const evidence = asArray(bundle?.literal_evidence);
  const candidates = asArray(bundle?.quadrant_candidates);
  return {
    sceneIds: new Set(scenes.map((scene) => scene.scene_id).filter(Boolean)),
    evidenceIds: new Set(evidence.map((item) => item.evidence_id).filter(Boolean)),
    evidenceById: new Map(evidence.map((item) => [item.evidence_id, item])),
    candidateIds: new Set(candidates.map((candidate) => candidate.candidate_id).filter(Boolean)),
    candidateById: new Map(candidates.map((candidate) => [candidate.candidate_id, candidate])),
  };
}

export function validateParallelProductionContractSurface() {
  const errors = [];

  for (const schemaPath of EXPECTED_SCHEMA_FILES) {
    const absolutePath = path.join(root, schemaPath);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`Missing schema file: ${schemaPath}`);
      continue;
    }
    try {
      const schema = readJson(schemaPath);
      if (!schema.$id) errors.push(`${schemaPath} missing $id`);
      if (!schema.title) errors.push(`${schemaPath} missing title`);
    } catch (error) {
      errors.push(`${schemaPath} is not valid JSON: ${error.message}`);
    }
  }

  for (const docPath of [CONTRACT_DOC_PATH, DIAGRAM_CONTRACT_DOC_PATH]) {
    if (!fs.existsSync(path.join(root, docPath))) errors.push(`Missing contract doc: ${docPath}`);
  }

  if (fs.existsSync(path.join(root, CONTRACT_DOC_PATH))) {
    const doc = readText(CONTRACT_DOC_PATH);
    for (const term of EXPECTED_CONTRACT_TERMS) {
      if (!doc.includes(term)) errors.push(`Contract doc missing term: ${term}`);
    }
  }

  if (fs.existsSync(path.join(root, DIAGRAM_CONTRACT_DOC_PATH))) {
    const diagramDoc = readText(DIAGRAM_CONTRACT_DOC_PATH);
    for (const term of [
      "platform-diagram-code-generation-contract.capa-1.parallel-production.v1",
      "parallel_production_design_handoff_package",
      "diagram_code_generation_package",
      "candidate_export_package",
      "PM_IR",
      "PF_IR",
      "MoC_IR",
      "OLC_IR",
      "BPMN XML",
      "PlantUML",
      "XMI",
      "does_not_modify_capa2_readiness",
      "does_not_modify_core_contract",
    ]) {
      if (!diagramDoc.includes(term)) errors.push(`Diagram contract missing term: ${term}`);
    }
  }

  return {
    ...result(errors),
    schema_files: EXPECTED_SCHEMA_FILES,
    new_schema_files: NEW_SCHEMA_FILES,
    contract_doc_path: CONTRACT_DOC_PATH,
    diagram_contract_doc_path: DIAGRAM_CONTRACT_DOC_PATH,
  };
}

export function validateMmabpDesignSourceBundle(bundle) {
  const errors = [];
  const warnings = [];

  pushMissing(errors, "bundle", bundle, [
    "bundle_id",
    "bundle_type",
    "bundle_version",
    "source_core",
    "client_context",
    "source_scenes",
    "literal_evidence",
    "canonical_derivations",
    "quadrant_candidates",
    "design_source_readiness",
    "boundaries",
  ]);
  if (bundle.bundle_type !== "mmabp_design_source_bundle") errors.push("bundle_type must be mmabp_design_source_bundle");
  if (bundle.bundle_version !== "1.0.0") errors.push("bundle_version must be 1.0.0");
  if (bundle.source_core?.canonical_version !== "CAPA1_V2_1") errors.push("source_core.canonical_version must remain CAPA1_V2_1");
  if (bundle.source_core?.source_contract_id !== "platform-consumption-contract.capa-1.v2.1") {
    errors.push("source_core.source_contract_id must reference the existing core contract");
  }
  if (!bundle.source_core?.manifest_version) errors.push("source_core missing manifest_version");
  if (!bundle.source_core?.manifest_content_hash) errors.push("source_core missing manifest_content_hash");

  const { sceneIds, evidenceIds } = makeBundleIndexes(bundle);
  if (!asArray(bundle.source_scenes).length) errors.push("source_scenes must contain at least one scene");
  asArray(bundle.source_scenes).forEach((scene, index) => {
    pushMissing(errors, `source_scenes[${index}]`, scene, [
      "scene_id",
      "scene_readiness",
      "source_user_role",
      "confidence_score",
      "scene_canonical_record_ref",
    ]);
    if (Number(scene.confidence_score) < 0 || Number(scene.confidence_score) > 100) {
      errors.push(`source_scenes[${index}].confidence_score must be 0..100`);
    }
  });

  asArray(bundle.literal_evidence).forEach((item, index) => {
    pushMissing(errors, `literal_evidence[${index}]`, item, [
      "evidence_id",
      "scene_id",
      "block_origin",
      "question_origin",
      "literal_value",
      "provenance_type",
    ]);
    if (item.scene_id && !sceneIds.has(item.scene_id)) errors.push(`literal_evidence[${index}] references unknown scene_id ${item.scene_id}`);
    if (!String(item.block_origin ?? "").startsWith("block_")) errors.push(`literal_evidence[${index}].block_origin must use block_*`);
  });
  if (!asArray(bundle.literal_evidence).length) errors.push("literal_evidence must contain at least one evidence item");

  asArray(bundle.canonical_derivations).forEach((derivation, index) => {
    pushMissing(errors, `canonical_derivations[${index}]`, derivation, [
      "derivation_id",
      "scene_id",
      "canonical_variable",
      "value",
      "source_evidence_ids",
    ]);
    for (const evidenceId of asArray(derivation.source_evidence_ids)) {
      if (!evidenceIds.has(evidenceId)) errors.push(`canonical_derivations[${index}] references unknown evidence ${evidenceId}`);
    }
  });

  if (!asArray(bundle.quadrant_candidates).length) errors.push("quadrant_candidates must contain at least one candidate");
  asArray(bundle.quadrant_candidates).forEach((candidate, index) => {
    pushMissing(errors, `quadrant_candidates[${index}]`, candidate, [
      "candidate_id",
      "candidate_type",
      "canonical_label",
      "quadrant_targets",
      "source_scene_ids",
      "source_evidence_ids",
      "confidence",
      "projection_status",
    ]);
    for (const quadrant of asArray(candidate.quadrant_targets)) {
      if (!VALID_QUADRANTS.has(quadrant)) errors.push(`quadrant_candidates[${index}] invalid quadrant ${quadrant}`);
    }
    for (const sceneId of asArray(candidate.source_scene_ids)) {
      if (!sceneIds.has(sceneId)) errors.push(`quadrant_candidates[${index}] references unknown scene ${sceneId}`);
    }
    for (const evidenceId of asArray(candidate.source_evidence_ids)) {
      if (!evidenceIds.has(evidenceId)) errors.push(`quadrant_candidates[${index}] references unknown evidence ${evidenceId}`);
    }
    const confidence = Number(candidate.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) errors.push(`quadrant_candidates[${index}].confidence must be 0..1`);
    if (confidence < 0.5) warnings.push(`quadrant_candidates[${index}] has low confidence`);
  });

  if (!VALID_READINESS.has(bundle.design_source_readiness?.status)) errors.push("design_source_readiness.status is not valid");
  if (!bundle.design_source_readiness?.confidence_summary) errors.push("design_source_readiness missing confidence_summary");
  requireTrueBoundaries(errors, "boundaries", bundle.boundaries, REQUIRED_BOUNDARIES);
  pushForbidden(errors, "bundle", bundle);

  return result(errors, warnings);
}

export function validateClientMmabpStructuralFacts(inventory, sourceBundle) {
  const errors = [];
  const warnings = [];
  pushMissing(errors, "inventory", inventory, [
    "inventory_id",
    "inventory_type",
    "inventory_version",
    "source_bundle_id",
    "client_id",
    "session_id",
    "structural_facts",
    "inventory_readiness",
  ]);
  if (inventory.inventory_type !== "client_mmabp_structural_facts") errors.push("inventory_type must be client_mmabp_structural_facts");
  if (inventory.inventory_version !== "1.0.0") errors.push("inventory_version must be 1.0.0");
  if (sourceBundle) {
    if (inventory.source_bundle_id !== sourceBundle.bundle_id) errors.push("inventory.source_bundle_id must match source bundle_id");
    if (inventory.client_id !== sourceBundle.client_context?.client_id) errors.push("inventory.client_id must match source bundle client_id");
  }

  const { sceneIds, evidenceIds, evidenceById, candidateIds, candidateById } = makeBundleIndexes(sourceBundle);
  const facts = asArray(inventory.structural_facts);
  if (!facts.length) errors.push("structural_facts must contain at least one fact");
  const factIds = new Set();

  facts.forEach((fact, index) => {
    pushMissing(errors, `structural_facts[${index}]`, fact, [
      "fact_id",
      "client_id",
      "session_id",
      "scene_id",
      "source_user_role",
      "block_origin",
      "question_origin",
      "literal_evidence",
      "normalized_fact_type",
      "canonical_label",
      "quadrant_targets",
      "source_candidate_ids",
      "source_evidence_ids",
      "confidence",
      "conformance_status",
      "consistency_status",
      "projection_status",
      "flags",
      "gaps",
      "boundaries",
    ]);
    if (fact.fact_id) {
      if (factIds.has(fact.fact_id)) errors.push(`duplicate fact_id ${fact.fact_id}`);
      factIds.add(fact.fact_id);
    }
    if (fact.client_id !== inventory.client_id) errors.push(`structural_facts[${index}].client_id must match inventory.client_id`);
    if (fact.session_id !== inventory.session_id) errors.push(`structural_facts[${index}].session_id must match inventory.session_id`);
    if (sourceBundle && fact.scene_id && !sceneIds.has(fact.scene_id)) errors.push(`structural_facts[${index}] references unknown scene ${fact.scene_id}`);
    if (!String(fact.block_origin ?? "").startsWith("block_")) errors.push(`structural_facts[${index}].block_origin must use block_*`);
    if (!VALID_STRUCTURAL_FACT_TYPES.has(fact.normalized_fact_type)) errors.push(`structural_facts[${index}] invalid normalized_fact_type ${fact.normalized_fact_type}`);
    for (const quadrant of asArray(fact.quadrant_targets)) {
      if (!VALID_QUADRANTS.has(quadrant)) errors.push(`structural_facts[${index}] invalid quadrant ${quadrant}`);
    }
    for (const candidateId of asArray(fact.source_candidate_ids)) {
      if (!candidateIds.has(candidateId)) errors.push(`structural_facts[${index}] references unknown candidate ${candidateId}`);
    }
    for (const evidenceId of asArray(fact.source_evidence_ids)) {
      if (!evidenceIds.has(evidenceId)) errors.push(`structural_facts[${index}] references unknown evidence ${evidenceId}`);
      const item = evidenceById.get(evidenceId);
      if (item && item.scene_id !== fact.scene_id) errors.push(`structural_facts[${index}] evidence ${evidenceId} belongs to a different scene`);
    }
    const candidateQuadrants = new Set(asArray(fact.source_candidate_ids).flatMap((id) => asArray(candidateById.get(id)?.quadrant_targets)));
    for (const quadrant of asArray(fact.quadrant_targets)) {
      if (candidateQuadrants.size > 0 && !candidateQuadrants.has(quadrant)) {
        errors.push(`structural_facts[${index}] quadrant ${quadrant} is not supported by source candidates`);
      }
    }
    const primaryEvidence = evidenceById.get(asArray(fact.source_evidence_ids)[0]);
    if (primaryEvidence?.block_origin !== undefined && primaryEvidence.block_origin !== fact.block_origin) {
      warnings.push(`structural_facts[${index}].block_origin differs from primary evidence`);
    }
    if (primaryEvidence?.question_origin !== undefined && primaryEvidence.question_origin !== fact.question_origin) {
      warnings.push(`structural_facts[${index}].question_origin differs from primary evidence`);
    }
    const confidence = Number(fact.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) errors.push(`structural_facts[${index}].confidence must be 0..1`);
    if (!VALID_CONFORMANCE_STATUSES.has(fact.conformance_status)) errors.push(`structural_facts[${index}] invalid conformance_status ${fact.conformance_status}`);
    if (!VALID_CONSISTENCY_STATUSES.has(fact.consistency_status)) errors.push(`structural_facts[${index}] invalid consistency_status ${fact.consistency_status}`);
    if (!VALID_PROJECTION_STATUSES.has(fact.projection_status)) errors.push(`structural_facts[${index}] invalid projection_status ${fact.projection_status}`);
    requireTrueBoundaries(errors, `structural_facts[${index}].boundaries`, fact.boundaries, REQUIRED_STRUCTURAL_FACT_BOUNDARIES);
    pushForbidden(errors, `structural_facts[${index}]`, fact);
  });
  pushForbidden(errors, "inventory", inventory);
  return result(errors, warnings);
}

export function validateInventoryReadiness(inventoryReadiness, inventory, sourceBundle, designGaps = []) {
  const errors = [];
  const warnings = [];
  pushMissing(errors, "inventory_readiness", inventoryReadiness, [
    "inventory_readiness",
    "readiness_reasons",
    "blocking_gaps",
    "manual_review_required",
    "client_id",
    "source_bundle_id",
    "structural_facts_package_id",
  ]);
  if (!VALID_INVENTORY_READINESS.has(inventoryReadiness.inventory_readiness)) errors.push("inventory_readiness status is not valid");
  if (inventory && inventoryReadiness.structural_facts_package_id !== inventory.inventory_id) errors.push("inventory_readiness.structural_facts_package_id must match inventory_id");
  if (inventory && inventoryReadiness.client_id !== inventory.client_id) errors.push("inventory_readiness.client_id must match inventory.client_id");
  if (sourceBundle && inventoryReadiness.source_bundle_id !== sourceBundle.bundle_id) errors.push("inventory_readiness.source_bundle_id must match bundle_id");
  const gapById = designGapMap(designGaps);
  for (const gapId of asArray(inventoryReadiness.blocking_gaps)) {
    const gap = gapById.get(gapId);
    if (!gap) errors.push(`inventory_readiness references unknown blocking gap ${gapId}`);
    else if (!isOpenBlockingGap(gap)) warnings.push(`inventory_readiness blocking gap ${gapId} is not currently open blocking`);
  }
  if (REGISTRY_ALLOWED_INVENTORY_READINESS.has(inventoryReadiness.inventory_readiness) && inventoryReadiness.manual_review_required) {
    errors.push("inventory readiness cannot be registry-ready while manual_review_required is true");
  }
  if (!REGISTRY_ALLOWED_INVENTORY_READINESS.has(inventoryReadiness.inventory_readiness) && !inventoryReadiness.manual_review_required && !asArray(inventoryReadiness.blocking_gaps).length) {
    warnings.push("blocked or partial inventory should declare manual review or blocking gaps");
  }
  pushForbidden(errors, "inventory_readiness", inventoryReadiness);
  return result(errors, warnings);
}

export function validateDesignGap(gap) {
  const errors = [];
  pushMissing(errors, "design_gap", gap, [
    "gap_id",
    "gap_type",
    "severity",
    "blocking_status",
    "source_artifact_type",
    "source_artifact_id",
    "source_element_id",
    "affected_quadrants",
    "required_evidence",
    "reentry_question",
    "resolution_owner",
    "resolution_status",
  ]);
  if (!VALID_GAP_TYPES.has(gap.gap_type)) errors.push("design_gap.gap_type is not valid");
  if (!VALID_GAP_SEVERITIES.has(gap.severity)) errors.push("design_gap.severity is not valid");
  if (!VALID_GAP_BLOCKING.has(gap.blocking_status)) errors.push("design_gap.blocking_status is not valid");
  if (!VALID_GAP_RESOLUTION.has(gap.resolution_status)) errors.push("design_gap.resolution_status is not valid");
  if (!gap.source_artifact_id) errors.push("design_gap.source_artifact_id is required");
  for (const quadrant of asArray(gap.affected_quadrants)) {
    if (!VALID_QUADRANTS.has(quadrant)) errors.push(`design_gap invalid affected quadrant ${quadrant}`);
  }
  if (gap.gap_type === "missing_evidence" && asArray(gap.required_evidence).length === 0) {
    errors.push("missing_evidence design gaps require required_evidence");
  }
  pushForbidden(errors, "design_gap", gap);
  return result(errors);
}

export function validateQuadrantRegistryPackage(registryPackage, inventory, inventoryReadiness, designGaps = []) {
  const errors = [];
  const warnings = [];
  pushMissing(errors, "registry_package", registryPackage, [
    "registry_package_id",
    "registry_package_type",
    "registry_version",
    "source_inventory_id",
    "client_id",
    "registries",
    "registry_readiness",
    "boundaries",
  ]);
  if (registryPackage.registry_package_type !== "quadrant_registry_package") errors.push("registry_package_type must be quadrant_registry_package");
  if (registryPackage.registry_version !== "1.0.0") errors.push("registry_version must be 1.0.0");
  if (inventory) {
    if (registryPackage.source_inventory_id !== inventory.inventory_id) errors.push("registry_package.source_inventory_id must match inventory_id");
    if (registryPackage.client_id !== inventory.client_id) errors.push("registry_package.client_id must match inventory.client_id");
  }
  const readinessStatus = readinessStatusFromInventory(inventory, inventoryReadiness);
  if (!REGISTRY_ALLOWED_INVENTORY_READINESS.has(readinessStatus)) {
    errors.push(`quadrant_registry_package blocked by inventory_readiness ${readinessStatus ?? "missing"}`);
  }

  const { facts, factById } = makeFactIndexes(inventory);
  const requiredQuadrantsByFact = new Map();
  const coveredQuadrantsByFact = new Map();
  for (const fact of facts) requiredQuadrantsByFact.set(fact.fact_id, new Set(asArray(fact.quadrant_targets)));

  const registries = registryPackage.registries ?? {};
  for (const quadrant of VALID_QUADRANTS) {
    const registry = registries[quadrant];
    if (!registry) {
      errors.push(`registries missing ${quadrant}`);
      continue;
    }
    if (registry.quadrant !== quadrant) errors.push(`registries.${quadrant}.quadrant must be ${quadrant}`);
    const elements = collectRegistryElements(registry);
    for (const [index, element] of elements.entries()) {
      pushMissing(errors, `registries.${quadrant}.elements[${index}]`, element, [
        "element_id",
        "element_type",
        "label",
        "source_fact_ids",
        "conformance_status",
        "consistency_status",
      ]);
      if (!VALID_CONFORMANCE_STATUSES.has(element.conformance_status)) errors.push(`registries.${quadrant}.elements[${index}] invalid conformance_status`);
      if (!VALID_CONSISTENCY_STATUSES.has(element.consistency_status)) errors.push(`registries.${quadrant}.elements[${index}] invalid consistency_status`);
      for (const factId of asArray(element.source_fact_ids)) {
        const fact = factById.get(factId);
        if (!fact) {
          errors.push(`registries.${quadrant}.elements[${index}] references unknown fact ${factId}`);
          continue;
        }
        if (!asArray(fact.quadrant_targets).includes(quadrant)) errors.push(`registries.${quadrant}.elements[${index}] uses fact ${factId} outside quadrant ${quadrant}`);
        if (!coveredQuadrantsByFact.has(factId)) coveredQuadrantsByFact.set(factId, new Set());
        coveredQuadrantsByFact.get(factId).add(quadrant);
      }
    }
    for (const factId of collectRegistryFactRefs(registry.gaps)) {
      if (factId && !factById.has(factId)) errors.push(`registries.${quadrant}.gaps references unknown fact ${factId}`);
    }
    if (!elements.length && !asArray(registry.gaps).length) warnings.push(`registries.${quadrant} has no elements and no gaps`);
  }

  for (const [factId, quadrants] of requiredQuadrantsByFact.entries()) {
    for (const quadrant of quadrants) {
      const covered = coveredQuadrantsByFact.get(factId)?.has(quadrant);
      const gapRefs = collectRegistryFactRefs(registries[quadrant]?.gaps ?? []);
      if (!covered && !gapRefs.includes(factId)) errors.push(`fact ${factId} is not represented or gapped in quadrant ${quadrant}`);
    }
  }
  if (!VALID_REGISTRY_READINESS.has(registryPackage.registry_readiness?.status)) errors.push("registry_readiness.status is not valid");
  requireTrueBoundaries(errors, "registry_package.boundaries", registryPackage.boundaries, REQUIRED_REGISTRY_PACKAGE_BOUNDARIES);
  validateRegistrySemanticRules(errors, registryPackage, inventory, designGaps);
  pushForbidden(errors, "registry_package", registryPackage);
  return result(errors, warnings);
}

function validateRegistrySemanticRules(errors, registryPackage, inventory, designGaps) {
  const gapIds = new Set(asArray(designGaps).map((gap) => gap.gap_id));
  const registries = registryPackage.registries ?? {};

  for (const process of asArray(registries.PM?.elements).filter((item) => item.element_type === "business_process")) {
    if (elementIsReady(process) || registryPackage.registry_readiness?.status === "registries_ready") {
      if (!hasAny(process.trigger_events) || !hasAny(process.target_states)) {
        errors.push(`PM process ${process.element_id} ready requires trigger_events and target_states`);
      }
    }
    if (process.represents_org_chart === true || process.element_type === "organizational_area") {
      errors.push(`PM process ${process.element_id} must not represent org chart structure`);
    }
  }

  for (const element of asArray(registries.PF?.elements)) {
    if (element.element_type === "gateway" && elementIsReady(element) && !hasAny(element.decision_criteria) && !hasAny(element.decision_authority) && !hasAny(element.decision_level_evidence)) {
      errors.push(`PF gateway ${element.element_id} requires criterion, authority, or decision level evidence`);
    }
    if (element.element_type === "process_state" && elementIsReady(element) && !hasAny(element.awaited_events)) {
      errors.push(`PF process state ${element.element_id} requires awaited event`);
    }
    if (element.element_type === "process_state" && element.timer_required === true && !hasAny(element.timer_event)) {
      errors.push(`PF process state ${element.element_id} requires timer_event when timer_required`);
    }
    if (["workaround", "self_loop"].includes(element.element_type) && elementIsReady(element) && (!hasAny(element.cause) || !hasAny(element.affected_object))) {
      errors.push(`PF ${element.element_type} ${element.element_id} requires cause and affected object when ready`);
    }
  }

  for (const element of asArray(registries.MoC?.elements)) {
    if (element.element_type === "class" && elementIsReady(element)) {
      const label = String(element.label ?? "");
      if (/^(tbl|table|entity|dto|db_|tmp_|sys_)/i.test(label) || element.technical_name_without_business_concept === true) {
        errors.push(`MoC class ${element.element_id} must represent a business concept, not a technical name`);
      }
    }
    if (element.element_type === "operation" && elementIsReady(element) && (!hasAny(element.object_class) || !hasAny(element.precondition_reason))) {
      errors.push(`MoC operation ${element.element_id} requires object class and causal precondition when ready`);
    }
    if (element.element_type === "relationship" && elementIsReady(element) && !hasAny(element.cardinality) && !hasAny(element.semantic_reason)) {
      errors.push(`MoC relationship ${element.element_id} requires cardinality or semantic reason when ready`);
    }
    if (["role", "phase"].includes(element.element_type) && element.organizational_area === true) {
      errors.push(`MoC ${element.element_type} ${element.element_id} must not be converted into organizational area`);
    }
  }

  for (const element of asArray(registries.OLC?.elements)) {
    if (element.element_type === "object_state" && elementIsReady(element) && element.represents_task === true) {
      errors.push(`OLC state ${element.element_id} must not represent a process task`);
    }
    if (element.element_type === "transition" && elementIsReady(element) && !hasAny(element.transition_reason) && !hasAny(element.stimulus) && !hasAny(element.time_event) && !hasAny(element.operation_ref)) {
      errors.push(`OLC transition ${element.element_id} requires external stimulus, time event, valid operation, or state-change reason`);
    }
    if (element.element_type === "final_state" && element.undesired_recurrent === true && !asArray(element.design_gap_ids).some((id) => gapIds.has(id)) && !hasAny(element.warnings)) {
      errors.push(`OLC recurrent undesired final ${element.element_id} requires gap or warning`);
    }
    if (element.element_type === "operation" && elementIsReady(element) && !hasAny(element.moc_operation_ref) && !hasAny(element.source_fact_ids)) {
      errors.push(`OLC operation ${element.element_id} requires MoC operation reference or supporting fact`);
    }
    if (element.element_type === "self_loop" && element.creates_false_state === true) {
      errors.push(`OLC self-loop ${element.element_id} must not create a false state`);
    }
  }
}

export function validateConformanceReport(report, artifacts = {}, designGaps = []) {
  const errors = [];
  const warnings = [];
  pushMissing(errors, "conformance_report", report, [
    "report_id",
    "client_id",
    "source_artifact_id",
    "source_artifact_type",
    "checked_elements",
    "conformance_status",
    "findings",
    "blocking_gaps",
    "warnings",
  ]);
  if (!VALID_REPORT_STATUSES.has(report.conformance_status)) errors.push("conformance_report.conformance_status is not valid");
  if (artifacts.irPackage && report.source_artifact_id !== artifacts.irPackage.ir_package_id) errors.push("conformance_report.source_artifact_id must match ir_package_id");
  if (artifacts.irPackage && report.client_id !== artifacts.irPackage.client_id) errors.push("conformance_report.client_id must match ir client_id");
  const irElementIds = new Set(collectIrElements(artifacts.irPackage).map((element) => element.ir_element_id));
  for (const [index, elementId] of asArray(report.checked_elements).entries()) {
    if (artifacts.irPackage && !irElementIds.has(elementId)) errors.push(`checked_elements[${index}] references unknown IR element ${elementId}`);
  }
  const gapById = designGapMap(designGaps);
  for (const gapId of asArray(report.blocking_gaps)) {
    if (!gapById.has(gapId)) errors.push(`conformance_report references unknown blocking gap ${gapId}`);
  }
  asArray(report.findings).forEach((finding, index) => {
    pushMissing(errors, `conformance_report.findings[${index}]`, finding, [
      "finding_id",
      "element_id",
      "rule_id",
      "status",
      "reason",
      "source_evidence_ids",
      "source_fact_ids",
      "gap_ids",
    ]);
    if (artifacts.irPackage && finding.element_id && !irElementIds.has(finding.element_id)) errors.push(`conformance_report.findings[${index}] references unknown element ${finding.element_id}`);
    for (const gapId of asArray(finding.gap_ids)) {
      if (!gapById.has(gapId)) errors.push(`conformance_report.findings[${index}] references unknown design gap ${gapId}`);
    }
  });
  if (report.conformance_status === "blocked" && !asArray(report.blocking_gaps).length) warnings.push("blocked conformance report should declare blocking_gaps");
  pushForbidden(errors, "conformance_report", report);
  return result(errors, warnings);
}

export function validateConsistencyReport(report, artifacts = {}, designGaps = []) {
  const errors = [];
  const warnings = [];
  pushMissing(errors, "consistency_report", report, [
    "report_id",
    "client_id",
    "source_registry_package_id",
    "source_mmabp_ir_package_id",
    "checked_cross_quadrant_relations",
    "consistency_status",
    "findings",
    "blocking_gaps",
    "warnings",
  ]);
  if (!VALID_REPORT_STATUSES.has(report.consistency_status)) errors.push("consistency_report.consistency_status is not valid");
  if (artifacts.registryPackage && report.source_registry_package_id !== artifacts.registryPackage.registry_package_id) errors.push("consistency_report.source_registry_package_id must match registry_package_id");
  if (artifacts.irPackage && report.source_mmabp_ir_package_id !== artifacts.irPackage.ir_package_id) errors.push("consistency_report.source_mmabp_ir_package_id must match ir_package_id");
  for (const relation of REQUIRED_CROSS_RELATIONS) {
    if (!asArray(report.checked_cross_quadrant_relations).includes(relation)) {
      errors.push(`consistency_report missing checked relation ${relation}`);
    }
  }
  const irElementIds = new Set(collectIrElements(artifacts.irPackage).map((element) => element.ir_element_id));
  const gapById = designGapMap(designGaps);
  for (const gapId of asArray(report.blocking_gaps)) {
    if (!gapById.has(gapId)) errors.push(`consistency_report references unknown blocking gap ${gapId}`);
  }
  asArray(report.findings).forEach((finding, index) => {
    pushMissing(errors, `consistency_report.findings[${index}]`, finding, [
      "finding_id",
      "element_id",
      "rule_id",
      "status",
      "reason",
      "source_evidence_ids",
      "source_fact_ids",
      "gap_ids",
    ]);
    if (artifacts.irPackage && finding.element_id && !irElementIds.has(finding.element_id)) errors.push(`consistency_report.findings[${index}] references unknown element ${finding.element_id}`);
    for (const gapId of asArray(finding.gap_ids)) {
      if (!gapById.has(gapId)) errors.push(`consistency_report.findings[${index}] references unknown design gap ${gapId}`);
    }
  });
  if (report.consistency_status === "blocked" && !asArray(report.blocking_gaps).length) warnings.push("blocked consistency report should declare blocking_gaps");
  pushForbidden(errors, "consistency_report", report);
  return result(errors, warnings);
}

export function validateMmabpIrPackage(irPackage, registryPackage, reports = {}, designGaps = []) {
  const errors = [];
  const warnings = [];
  pushMissing(errors, "ir_package", irPackage, [
    "ir_package_id",
    "ir_package_type",
    "ir_version",
    "source_registry_package_id",
    "client_id",
    "models",
    "ir_readiness",
    "boundaries",
  ]);
  if (irPackage.ir_package_type !== "mmabp_ir_package") errors.push("ir_package_type must be mmabp_ir_package");
  if (irPackage.ir_version !== "1.0.0") errors.push("ir_version must be 1.0.0");
  if (registryPackage) {
    if (irPackage.source_registry_package_id !== registryPackage.registry_package_id) errors.push("ir_package.source_registry_package_id must match registry_package_id");
    if (irPackage.client_id !== registryPackage.client_id) errors.push("ir_package.client_id must match registry_package.client_id");
  }

  const registryElementById = new Map();
  const registryElementQuadrantById = new Map();
  for (const quadrant of VALID_QUADRANTS) {
    for (const element of collectRegistryElements(registryPackage?.registries?.[quadrant] ?? {})) {
      registryElementById.set(element.element_id, element);
      registryElementQuadrantById.set(element.element_id, quadrant);
    }
  }

  const representedRegistryElements = new Set();
  for (const quadrant of VALID_QUADRANTS) {
    const modelName = IR_MODEL_BY_QUADRANT[quadrant];
    const model = irPackage.models?.[modelName];
    if (!model) {
      errors.push(`models missing ${modelName}`);
      continue;
    }
    if (model.quadrant !== quadrant) errors.push(`models.${modelName}.quadrant must be ${quadrant}`);
    if (!Array.isArray(model.elements)) {
      errors.push(`models.${modelName}.elements must be an array`);
      continue;
    }
    if (!Array.isArray(model.gaps)) errors.push(`models.${modelName}.gaps must be an array`);
    model.elements.forEach((element, index) => {
      pushMissing(errors, `models.${modelName}.elements[${index}]`, element, [
        "ir_element_id",
        "ir_element_type",
        "label",
        "source_registry_element_ids",
        "source_fact_ids",
        "conformance_status",
        "consistency_status",
      ]);
      if (!VALID_CONFORMANCE_STATUSES.has(element.conformance_status)) errors.push(`models.${modelName}.elements[${index}] invalid conformance_status`);
      if (!VALID_CONSISTENCY_STATUSES.has(element.consistency_status)) errors.push(`models.${modelName}.elements[${index}] invalid consistency_status`);
      for (const registryElementId of asArray(element.source_registry_element_ids)) {
        const sourceElement = registryElementById.get(registryElementId);
        if (!sourceElement) {
          errors.push(`models.${modelName}.elements[${index}] references unknown registry element ${registryElementId}`);
          continue;
        }
        if (registryElementQuadrantById.get(registryElementId) !== quadrant) errors.push(`models.${modelName}.elements[${index}] uses registry element ${registryElementId} outside quadrant ${quadrant}`);
        const sourceFacts = new Set(asArray(sourceElement.source_fact_ids));
        for (const factId of asArray(element.source_fact_ids)) {
          if (!sourceFacts.has(factId)) errors.push(`models.${modelName}.elements[${index}] fact ${factId} is not supported by registry element ${registryElementId}`);
        }
        representedRegistryElements.add(registryElementId);
      }
    });
    for (const registryElementId of collectIrRegistryRefs(model.gaps ?? [])) {
      if (!registryElementById.has(registryElementId)) errors.push(`models.${modelName}.gaps references unknown registry element ${registryElementId}`);
    }
    if (!model.elements.length && !asArray(model.gaps).length) warnings.push(`models.${modelName} has no elements and no gaps`);
  }

  for (const [elementId, quadrant] of registryElementQuadrantById.entries()) {
    const modelName = IR_MODEL_BY_QUADRANT[quadrant];
    const gapRefs = collectIrRegistryRefs(irPackage.models?.[modelName]?.gaps ?? []);
    if (!representedRegistryElements.has(elementId) && !gapRefs.includes(elementId)) {
      errors.push(`registry element ${elementId} is not represented or gapped in ${modelName}`);
    }
  }

  if (!VALID_IR_READINESS.has(irPackage.ir_readiness?.status)) errors.push("ir_readiness.status is not valid");
  if (irPackage.conformance_status === "passed" && !REPORT_PASS_STATUSES.has(reports.conformanceReport?.conformance_status)) {
    errors.push("IR conformance_status passed requires conformance_report passed or passed_with_warnings");
  }
  if (irPackage.consistency_status === "passed" && !REPORT_PASS_STATUSES.has(reports.consistencyReport?.consistency_status)) {
    errors.push("IR consistency_status passed requires consistency_report passed or passed_with_warnings");
  }
  if (irPackage.conformance_report_id && reports.conformanceReport && irPackage.conformance_report_id !== reports.conformanceReport.report_id) {
    errors.push("ir_package.conformance_report_id must match conformance_report.report_id");
  }
  if (irPackage.consistency_report_id && reports.consistencyReport && irPackage.consistency_report_id !== reports.consistencyReport.report_id) {
    errors.push("ir_package.consistency_report_id must match consistency_report.report_id");
  }
  requireTrueBoundaries(errors, "ir_package.boundaries", irPackage.boundaries, REQUIRED_IR_PACKAGE_BOUNDARIES);
  validateIrSemanticRules(errors, irPackage, registryPackage, designGaps);
  pushForbidden(errors, "ir_package", irPackage);
  return result(errors, warnings);
}

function validateIrSemanticRules(errors, irPackage, registryPackage, designGaps) {
  const elements = collectIrElements(irPackage);
  const olcStates = new Set(elements.filter((element) => element.quadrant === "OLC" && ["object_state", "state"].includes(element.ir_element_type)).map((element) => element.label));
  const mocClasses = new Set(elements.filter((element) => element.quadrant === "MoC" && ["class", "object_class"].includes(element.ir_element_type)).map((element) => element.label));
  const pmTargets = new Set(elements.filter((element) => element.quadrant === "PM").flatMap((element) => asArray(element.target_states)));
  const gapIds = new Set(asArray(designGaps).map((gap) => gap.gap_id));

  for (const element of elements) {
    if (element.quadrant === "PM" && element.ir_element_type === "business_process" && elementIsReady(element)) {
      if (!hasAny(element.trigger_events) || !hasAny(element.target_states)) errors.push(`PM process ${element.ir_element_id} ready requires trigger and target state`);
      if (element.represents_org_chart === true) errors.push(`PM process ${element.ir_element_id} must not represent org chart`);
    }
    if (element.quadrant === "PF" && element.ir_element_type === "task" && elementIsReady(element)) {
      if (!hasAny(element.object_class) || !hasAny(element.olc_state_ref)) errors.push(`PF task ${element.ir_element_id} ready requires object and OLC state`);
      if (hasAny(element.olc_state_ref) && !olcStates.has(element.olc_state_ref)) errors.push(`PF task ${element.ir_element_id} references missing OLC state ${element.olc_state_ref}`);
    }
    if (element.quadrant === "PF" && element.ir_element_type === "gateway" && elementIsReady(element) && !hasAny(element.decision_criteria) && !hasAny(element.decision_authority) && !hasAny(element.decision_level_evidence)) {
      errors.push(`PF gateway ${element.ir_element_id} requires criterion, authority, or decision level evidence`);
    }
    if (element.quadrant === "PF" && element.ir_element_type === "process_state" && elementIsReady(element) && !hasAny(element.awaited_events)) {
      errors.push(`PF process state ${element.ir_element_id} requires expected event`);
    }
    if (element.quadrant === "PF" && ["workaround", "self_loop"].includes(element.ir_element_type) && elementIsReady(element) && (!hasAny(element.cause) || !hasAny(element.affected_object))) {
      errors.push(`PF ${element.ir_element_type} ${element.ir_element_id} requires cause and affected object when ready`);
    }
    if (element.quadrant === "MoC" && ["class", "object_class"].includes(element.ir_element_type) && elementIsReady(element)) {
      const label = String(element.label ?? "");
      if (/^(tbl|table|entity|dto|db_|tmp_|sys_)/i.test(label) || element.technical_name_without_business_concept === true) {
        errors.push(`MoC class ${element.ir_element_id} must represent business concept`);
      }
    }
    if (element.quadrant === "MoC" && element.ir_element_type === "operation" && elementIsReady(element) && (!hasAny(element.object_class) || !hasAny(element.precondition_reason))) {
      errors.push(`MoC operation ${element.ir_element_id} requires object and causal precondition`);
    }
    if (element.quadrant === "MoC" && element.ir_element_type === "relationship" && elementIsReady(element) && !hasAny(element.cardinality) && !hasAny(element.semantic_reason)) {
      errors.push(`MoC relationship ${element.ir_element_id} requires cardinality or semantic reason`);
    }
    if (element.quadrant === "MoC" && ["role", "phase"].includes(element.ir_element_type) && element.organizational_area === true) {
      errors.push(`MoC ${element.ir_element_type} ${element.ir_element_id} must not become organizational area`);
    }
    if (element.quadrant === "OLC" && ["object_state", "state"].includes(element.ir_element_type) && element.represents_task === true) {
      errors.push(`OLC state ${element.ir_element_id} must not represent process task`);
    }
    if (element.quadrant === "OLC" && element.ir_element_type === "transition" && elementIsReady(element) && !hasAny(element.transition_reason) && !hasAny(element.stimulus) && !hasAny(element.time_event) && !hasAny(element.operation_ref)) {
      errors.push(`OLC transition ${element.ir_element_id} requires transition reason`);
    }
    if (element.quadrant === "OLC" && element.ir_element_type === "final_state" && element.undesired_recurrent === true && !asArray(element.design_gap_ids).some((id) => gapIds.has(id)) && !hasAny(element.warnings)) {
      errors.push(`OLC recurrent undesired final ${element.ir_element_id} requires gap or warning`);
    }
    if (element.quadrant === "OLC" && element.ir_element_type === "operation" && elementIsReady(element) && !hasAny(element.moc_operation_ref) && !hasAny(element.source_fact_ids)) {
      errors.push(`OLC operation ${element.ir_element_id} requires MoC operation or supporting fact`);
    }
    if (element.quadrant === "OLC" && element.ir_element_type === "self_loop" && element.creates_false_state === true) {
      errors.push(`OLC self-loop ${element.ir_element_id} must not create false state`);
    }
    if (element.quadrant === "PF" && element.final_state && !pmTargets.has(element.final_state) && !olcStates.has(element.final_state) && !asArray(element.design_gap_ids).some((id) => gapIds.has(id))) {
      errors.push(`PF final ${element.ir_element_id} must map to PM target state, OLC final/state, or gap`);
    }
    if (element.quadrant === "OLC" && element.object_class && !mocClasses.has(element.object_class) && !asArray(element.design_gap_ids).some((id) => gapIds.has(id))) {
      errors.push(`OLC state ${element.ir_element_id} uses MoC class ${element.object_class} without MoC registry/IR support or gap`);
    }
  }
}

export function validateDesignHandoffPackage(handoffPackage, artifacts) {
  const errors = [];
  const warnings = [];
  const { bundle, inventory, registryPackage, irPackage, designGaps = [] } = artifacts ?? {};
  pushMissing(errors, "handoff_package", handoffPackage, [
    "handoff_package_id",
    "handoff_package_type",
    "handoff_version",
    "client_id",
    "artifact_refs",
    "handoff_readiness",
    "handoff_gaps",
    "receiving_area_contract",
    "boundaries",
  ]);
  if (handoffPackage.handoff_package_type !== "parallel_production_design_handoff_package") errors.push("handoff_package_type must be parallel_production_design_handoff_package");
  if (handoffPackage.handoff_version !== "1.0.0") errors.push("handoff_version must be 1.0.0");
  const refs = handoffPackage.artifact_refs ?? {};
  pushMissing(errors, "handoff_package.artifact_refs", refs, [
    "mmabp_design_source_bundle_id",
    "client_mmabp_structural_facts_id",
    "quadrant_registry_package_id",
    "mmabp_ir_package_id",
  ]);
  if (bundle && refs.mmabp_design_source_bundle_id !== bundle.bundle_id) errors.push("artifact_refs.mmabp_design_source_bundle_id must match bundle_id");
  if (inventory && refs.client_mmabp_structural_facts_id !== inventory.inventory_id) errors.push("artifact_refs.client_mmabp_structural_facts_id must match inventory_id");
  if (registryPackage && refs.quadrant_registry_package_id !== registryPackage.registry_package_id) errors.push("artifact_refs.quadrant_registry_package_id must match registry_package_id");
  if (irPackage && refs.mmabp_ir_package_id !== irPackage.ir_package_id) errors.push("artifact_refs.mmabp_ir_package_id must match ir_package_id");
  for (const clientId of [bundle?.client_context?.client_id, inventory?.client_id, registryPackage?.client_id, irPackage?.client_id].filter(Boolean)) {
    if (handoffPackage.client_id !== clientId) errors.push(`handoff_package.client_id must match artifact client_id ${clientId}`);
  }
  if (!VALID_HANDOFF_READINESS.has(handoffPackage.handoff_readiness?.status)) errors.push("handoff_readiness.status is not valid");
  const irGapIds = new Set(collectIrGaps(irPackage).map((gap) => gap.gap_id).filter(Boolean));
  const gapById = designGapMap(designGaps);
  for (const [index, gap] of asArray(handoffPackage.handoff_gaps).entries()) {
    pushMissing(errors, `handoff_gaps[${index}]`, gap, ["gap_id", "gap_type", "description"]);
    for (const sourceGapId of asArray(gap.source_gap_ids)) {
      if (irPackage && !irGapIds.has(sourceGapId) && !gapById.has(sourceGapId)) {
        errors.push(`handoff_gaps[${index}] references unknown IR gap ${sourceGapId}`);
      }
    }
  }
  const blockingOpenGaps = referencedDesignGaps(handoffPackage.design_gap_ids, gapById).filter(isOpenBlockingGap);
  if (["ready_for_design_area", "ready_for_design_area_with_gaps"].includes(handoffPackage.handoff_readiness?.status) && blockingOpenGaps.length) {
    errors.push("handoff package cannot be ready with open blocking design gaps");
  }
  if (handoffPackage.handoff_readiness?.status === "ready_for_design_area_with_gaps" && !asArray(handoffPackage.handoff_gaps).length) errors.push("handoff_readiness with gaps requires handoff_gaps");
  if (handoffPackage.handoff_readiness?.status === "ready_for_design_area" && asArray(handoffPackage.handoff_gaps).length) warnings.push("handoff_readiness ready_for_design_area has gaps");
  for (const key of ["may_generate_diagram_code", "must_preserve_source_refs", "must_not_invent_semantics", "must_not_diagnose"]) {
    if (handoffPackage.receiving_area_contract?.[key] !== true) errors.push(`receiving_area_contract.${key} must be true`);
  }
  requireTrueBoundaries(errors, "handoff_package.boundaries", handoffPackage.boundaries, REQUIRED_HANDOFF_PACKAGE_BOUNDARIES);
  pushForbidden(errors, "handoff_package", handoffPackage);
  return result(errors, warnings);
}

export function validateDiagramCodeGenerationPackage(packageJson, artifacts = {}) {
  const errors = [];
  const warnings = [];
  const { handoffPackage, irPackage, conformanceReport, consistencyReport, designGaps = [] } = artifacts;
  const isDraftMode = packageJson.generation_mode === "draft_with_warnings";
  const isRegistryWithoutIr = packageJson.generation_source === "registry_without_ir" || (!packageJson.source_mmabp_ir_package_id && packageJson.source_registry_package_id);
  pushMissing(errors, "diagram_code_generation_package", packageJson, [
    "package_id",
    "schema_version",
    "client_id",
    "source_handoff_package_id",
    "source_mmabp_ir_package_id",
    "generation_readiness",
    "generation_mode",
    "exports",
  ]);
  if (packageJson.package_type && packageJson.package_type !== "diagram_code_generation_package") errors.push("package_type must be diagram_code_generation_package");
  if (packageJson.schema_version !== "1.0.0") errors.push("schema_version must be 1.0.0");
  if (handoffPackage && packageJson.source_handoff_package_id !== handoffPackage.handoff_package_id) errors.push("source_handoff_package_id must match handoff_package_id");
  if (irPackage && packageJson.source_mmabp_ir_package_id && packageJson.source_mmabp_ir_package_id !== irPackage.ir_package_id) errors.push("source_mmabp_ir_package_id must match ir_package_id");
  if (irPackage && packageJson.client_id !== irPackage.client_id) errors.push("diagram package client_id must match IR client_id");
  if (!VALID_GENERATION_READINESS.has(packageJson.generation_readiness)) errors.push("generation_readiness is not valid");
  if (!VALID_GENERATION_MODES.has(packageJson.generation_mode)) errors.push("generation_mode is not valid");
  if (packageJson.generation_mode !== "draft_with_warnings" && packageJson.source_registry_package_id && !packageJson.source_mmabp_ir_package_id) {
    errors.push("generation from registry without IR requires draft_with_warnings mode");
  }
  if (isDraftMode && packageJson.generation_readiness === "ready_for_candidate_generation") {
    errors.push("draft_with_warnings cannot use generation_readiness ready_for_candidate_generation");
  }
  if (isDraftMode) {
    if (packageJson.generation_source !== "registry_without_ir" && isRegistryWithoutIr) errors.push("draft_with_warnings from registry requires generation_source = registry_without_ir");
    if (!hasAny(packageJson.reason_for_draft_mode)) errors.push("draft_with_warnings requires reason_for_draft_mode");
    if (!asArray(packageJson.missing_ir_gap_ids).length) errors.push("draft_with_warnings requires missing_ir_gap_ids");
    if (!includesAll(packageJson.blocked_downstream_uses, DRAFT_PROHIBITED_USES)) errors.push("draft_with_warnings requires blocked_downstream_uses for Capa 2.0, Capa 2.5, Capa 3, diagnostic, monetization, narrative and final export");
    if (!includesAll(packageJson.prohibited_downstream_uses, DRAFT_PROHIBITED_USES)) errors.push("draft_with_warnings requires prohibited_downstream_uses");
    if (packageJson.explicit_warning !== "Draft artifact cannot be treated as validated MMABP-IR export.") errors.push("draft_with_warnings requires explicit_warning");
    if (packageJson.candidate_export_status === "final" || packageJson.output_status === "final" || packageJson.final_export === true) errors.push("draft_with_warnings cannot produce final export");
  }
  if (packageJson.generation_readiness === "ready_for_candidate_generation") {
    if (!REPORT_PASS_STATUSES.has(conformanceReport?.conformance_status)) errors.push("ready diagram generation requires conformance_report passed or passed_with_warnings");
    if (!REPORT_PASS_STATUSES.has(consistencyReport?.consistency_status)) errors.push("ready diagram generation requires consistency_report passed or passed_with_warnings");
  }
  if (packageJson.generation_readiness === "ready_with_warnings") {
    if (!REPORT_PASS_STATUSES.has(conformanceReport?.conformance_status) && !isDraftMode) errors.push("ready_with_warnings requires conformance_report passed or passed_with_warnings");
    if (!REPORT_PASS_STATUSES.has(consistencyReport?.consistency_status) && !isDraftMode) errors.push("ready_with_warnings requires consistency_report passed or passed_with_warnings");
    if (!packageWarnings(packageJson).length) errors.push("ready_with_warnings requires explicit warnings");
  }
  if (["partial", "blocked"].includes(conformanceReport?.conformance_status) && packageJson.generation_readiness === "ready_for_candidate_generation") {
    errors.push("generation_readiness cannot be ready when conformance is partial or blocked");
  }
  if (["partial", "blocked"].includes(consistencyReport?.consistency_status) && packageJson.generation_readiness === "ready_for_candidate_generation") {
    errors.push("generation_readiness cannot be ready when consistency is partial or blocked");
  }

  const irElements = collectIrElements(irPackage);
  const irElementById = new Map(irElements.map((element) => [element.ir_element_id, element]));
  const gapById = designGapMap(designGaps);
  const packageGapIds = [...asArray(packageJson.design_gap_ids), ...asArray(packageJson.exports).flatMap((exportItem) => asArray(exportItem.gaps))];
  const openBlockingGaps = referencedDesignGaps(packageGapIds, gapById).filter(isOpenBlockingGap);
  if (packageJson.generation_readiness === "ready_for_candidate_generation" && openBlockingGaps.length) {
    errors.push("diagram generation package cannot be ready with open blocking design gaps");
  }
  if (["ready_for_candidate_generation", "ready_with_warnings"].includes(packageJson.generation_readiness) && openBlockingGaps.length) {
    errors.push("diagram generation package cannot be ready_with_warnings or ready with open blocking design gaps");
  }
  for (const missingIrGapId of asArray(packageJson.missing_ir_gap_ids)) {
    if (!gapById.has(missingIrGapId)) errors.push(`draft_with_warnings references unknown missing IR design gap ${missingIrGapId}`);
  }

  asArray(packageJson.exports).forEach((exportItem, index) => {
    pushMissing(errors, `exports[${index}]`, exportItem, [
      "export_id",
      "quadrant",
      "export_format",
      "source_ir_element_ids",
      "source_registry_element_ids",
      "source_fact_ids",
      "traceability_status",
      "semantic_preservation_status",
      "warnings",
      "allowed_uses",
      "prohibited_uses",
      "gaps",
    ]);
    if (!VALID_QUADRANTS.has(exportItem.quadrant)) errors.push(`exports[${index}].quadrant is not valid`);
    if (!VALID_EXPORT_FORMATS.has(exportItem.export_format)) errors.push(`exports[${index}].export_format is not valid`);
    if (!VALID_SEMANTIC_PRESERVATION.has(exportItem.semantic_preservation_status)) errors.push(`exports[${index}].semantic_preservation_status is not valid`);
    if (!asArray(exportItem.source_ir_element_ids).length && !isRegistryWithoutIr) errors.push(`exports[${index}] must reference at least one source IR element`);
    if (isRegistryWithoutIr && !asArray(exportItem.source_registry_element_ids).length) errors.push(`exports[${index}] draft_with_warnings requires source_registry_element_ids`);
    if (isRegistryWithoutIr && !asArray(exportItem.gaps).length) errors.push(`exports[${index}] draft_with_warnings without IR requires associated design_gap`);
    if (isRegistryWithoutIr && exportItem.generation_source !== "registry_without_ir") errors.push(`exports[${index}] draft export requires generation_source registry_without_ir`);
    const sourceIrElements = asArray(exportItem.source_ir_element_ids).map((id) => irElementById.get(id));
    for (const [sourceIndex, elementId] of asArray(exportItem.source_ir_element_ids).entries()) {
      const irElement = irElementById.get(elementId);
      if (!irElement) {
        errors.push(`exports[${index}].source_ir_element_ids[${sourceIndex}] references unknown IR element ${elementId}`);
        continue;
      }
      if (irElement.quadrant !== exportItem.quadrant) errors.push(`exports[${index}] uses IR element ${elementId} outside quadrant ${exportItem.quadrant}`);
    }
    const allowedRegistryIds = new Set(sourceIrElements.flatMap((element) => asArray(element?.source_registry_element_ids)));
    const allowedFactIds = new Set(sourceIrElements.flatMap((element) => asArray(element?.source_fact_ids)));
    for (const registryId of asArray(exportItem.source_registry_element_ids)) {
      if (allowedRegistryIds.size && !allowedRegistryIds.has(registryId)) errors.push(`exports[${index}] registry element ${registryId} is not supported by source IR`);
    }
    for (const factId of asArray(exportItem.source_fact_ids)) {
      if (allowedFactIds.size && !allowedFactIds.has(factId)) errors.push(`exports[${index}] fact ${factId} is not supported by source IR`);
    }
    if (!hasAny(exportItem.traceability_status)) errors.push(`exports[${index}].traceability_status is required`);
    if (!isDraftMode && exportItem.traceability_status !== "complete") errors.push(`exports[${index}].traceability_status must be complete`);
    if (isDraftMode && !["draft_only", "blocked"].includes(exportItem.semantic_preservation_status)) errors.push(`exports[${index}] draft_with_warnings requires semantic_preservation_status draft_only or blocked`);
    if (!isDraftMode && !["passed", "passed_with_warnings"].includes(exportItem.semantic_preservation_status)) errors.push(`exports[${index}] candidate mode requires semantic_preservation_status passed or passed_with_warnings`);
    if (packageJson.generation_readiness === "ready_for_candidate_generation" && exportItem.semantic_preservation_status === "draft_only") errors.push("generation_readiness ready_for_candidate_generation cannot coexist with semantic_preservation_status draft_only");
    if (isDraftMode && exportItem.semantic_preservation_status === "passed") errors.push(`exports[${index}] draft_with_warnings cannot mark semantic_preservation_status passed`);
    if (isDraftMode && !includesAll(exportItem.prohibited_uses, DRAFT_PROHIBITED_USES)) errors.push(`exports[${index}] draft_with_warnings requires prohibited_uses for downstream/final uses`);
    if (!isDraftMode && exportItem.semantic_preservation_status === "passed_with_warnings" && !asArray(exportItem.warnings).length) errors.push(`exports[${index}] passed_with_warnings requires warnings`);
    for (const traceField of ["source_candidate_ids", "source_evidence_ids", "source_scene_ids", "source_blocks", "source_questions"]) {
      if (!asArray(exportItem[traceField]).length) errors.push(`exports[${index}] missing traceability ${traceField}`);
    }
    for (const gapId of asArray(exportItem.gaps)) {
      if (!gapById.has(gapId)) errors.push(`exports[${index}] references unknown design gap ${gapId}`);
    }
    asArray(exportItem.warnings).forEach((warning, warningIndex) => {
      if (typeof warning !== "object" || warning === null) {
        errors.push(`exports[${index}].warnings[${warningIndex}] must be an auditable warning object`);
        return;
      }
      pushMissing(errors, `exports[${index}].warnings[${warningIndex}]`, warning, WARNING_REQUIRED_FIELDS);
      if (!VALID_GAP_SEVERITIES.has(warning.severity)) errors.push(`exports[${index}].warnings[${warningIndex}].severity is not valid`);
      if (!VALID_SEMANTIC_PRESERVATION.has(warning.semantic_preservation_status)) errors.push(`exports[${index}].warnings[${warningIndex}].semantic_preservation_status is not valid`);
      if (!asArray(warning.affected_element_ids).length) errors.push(`exports[${index}].warnings[${warningIndex}] requires affected_element_ids`);
      if (!hasAny(warning.downstream_effect)) errors.push(`exports[${index}].warnings[${warningIndex}] requires downstream_effect`);
      for (const gapId of asArray(warning.related_gap_ids)) {
        if (!gapById.has(gapId)) errors.push(`exports[${index}].warnings[${warningIndex}] references unknown related design gap ${gapId}`);
      }
      if (packageJson.generation_readiness === "ready_for_candidate_generation" && warningSeverityRank(warning.severity) >= 3 && !hasAcceptedRisk(warning)) {
        errors.push(`exports[${index}].warnings[${warningIndex}] high or critical warning blocks ready_for_candidate_generation without accepted_risk justification`);
      }
    });
    if (["PM", "PF"].includes(exportItem.quadrant) && exportItem.export_format !== "BPMN_XML") errors.push(`exports[${index}] ${exportItem.quadrant} must use BPMN_XML`);
    if (exportItem.quadrant === "MoC" && !["PLANTUML_CLASS", "XMI_OPTIONAL"].includes(exportItem.export_format)) errors.push(`exports[${index}] MoC must use PLANTUML_CLASS or XMI_OPTIONAL`);
    if (exportItem.quadrant === "OLC" && !["PLANTUML_STATE", "XMI_OPTIONAL"].includes(exportItem.export_format)) errors.push(`exports[${index}] OLC must use PLANTUML_STATE or XMI_OPTIONAL`);
  });
  requireTrueBoundaries(errors, "diagram_code_generation_package.boundaries", packageJson.boundaries, REQUIRED_GENERATION_BOUNDARIES);
  pushForbidden(errors, "diagram_code_generation_package", packageJson);
  return result(errors, warnings);
}

function readFixtureIfExists(fixtureDir, file) {
  const absolute = path.join(fixtureDir, file);
  return fs.existsSync(absolute) ? JSON.parse(fs.readFileSync(absolute, "utf8")) : null;
}

export function validateParallelProduction() {
  const platformContract = readJson("src/runtime/platform-consumption-contract.json");
  const failures = [];
  const warnings = [];
  const blocked = [];
  const gaps = [];
  const passed = [];
  const validatedArtifacts = [];
  const validationOrder = [
    "core_contract_requires_evidence_bundle_for_transduction",
    "core_contract_does_not_require_mmabp_design_source_bundle",
    "existing_normative_schemas",
    "new_audit_and_generation_schemas",
    "fixtures_by_stage",
    "mmabp_design_source_bundle",
    "client_mmabp_structural_facts",
    "inventory_readiness",
    "quadrant_registry_package",
    "conformance_report",
    "consistency_report",
    "mmabp_ir_package",
    "parallel_production_design_handoff_package",
    "diagram_code_generation_package",
    "candidate_export_package",
    "parallel_production_validation_report",
  ];

  const coreContractUnchanged =
    platformContract.required_bundles?.includes("evidence_bundle_for_transduction") &&
    !platformContract.required_bundles?.includes("mmabp_design_source_bundle");
  if (!platformContract.required_bundles?.includes("evidence_bundle_for_transduction")) failures.push("Core platform contract must still require evidence_bundle_for_transduction");
  for (const bundleName of [
    "mmabp_design_source_bundle",
    "client_mmabp_structural_facts",
    "quadrant_registry_package",
    "mmabp_ir_package",
    "parallel_production_design_handoff_package",
    "diagram_code_generation_package",
    "candidate_export_package",
  ]) {
    if (platformContract.required_bundles?.includes(bundleName)) failures.push(`Core platform contract must not require ${bundleName}`);
  }

  const contractSurface = validateParallelProductionContractSurface();
  if (contractSurface.status !== "passed") failures.push(...contractSurface.errors);
  else passed.push("contract_surface");

  const fixtureDir = path.join(root, "tests", "fixtures", "parallel-production");
  const fixtureFiles = fs.existsSync(fixtureDir) ? fs.readdirSync(fixtureDir).filter((file) => file.endsWith(".json")).sort() : [];
  const bundleFixtureFiles = fixtureFiles.filter((file) => file.includes("design-source-bundle"));
  const structuralFactFixtureFiles = fixtureFiles.filter((file) => file.includes("structural-facts"));
  const inventoryReadinessFixtureFiles = fixtureFiles.filter((file) => file.includes("inventory-readiness"));
  const registryFixtureFiles = fixtureFiles.filter((file) => file.includes("registries"));
  const conformanceFixtureFiles = fixtureFiles.filter((file) => file.includes("conformance-report"));
  const consistencyFixtureFiles = fixtureFiles.filter((file) => file.includes("consistency-report"));
  const designGapFixtureFiles = fixtureFiles.filter((file) => file.includes("design-gap"));
  const irFixtureFiles = fixtureFiles.filter((file) => file.includes("mmabp-ir"));
  const handoffFixtureFiles = fixtureFiles.filter((file) => file.includes("design-handoff"));
  const diagramGenerationFixtureFiles = fixtureFiles.filter((file) => file.includes("diagram-code-generation"));
  const candidateExportFixtureFiles = fixtureFiles.filter((file) => file.includes("candidate-export-package"));

  for (const [label, files] of Object.entries({
    "mmabp design source bundle": bundleFixtureFiles,
    "structural fact": structuralFactFixtureFiles,
    "inventory readiness": inventoryReadinessFixtureFiles,
    "design gap": designGapFixtureFiles,
    "quadrant registry": registryFixtureFiles,
    "conformance report": conformanceFixtureFiles,
    "consistency report": consistencyFixtureFiles,
    "MMABP-IR": irFixtureFiles,
    "design handoff": handoffFixtureFiles,
    "diagram code generation": diagramGenerationFixtureFiles,
    "candidate export package": candidateExportFixtureFiles,
  })) {
    if (!files.length) failures.push(`No ${label} fixtures found`);
  }

  const designGaps = designGapFixtureFiles.map((file) => readFixtureIfExists(fixtureDir, file));
  const designGapResults = designGaps.map((gap, index) => {
    const validation = validateDesignGap(gap);
    validatedArtifacts.push({ artifact: "design_gap", id: gap?.gap_id, file: designGapFixtureFiles[index], status: validation.status });
    if (validation.status !== "passed") failures.push(`${designGapFixtureFiles[index]}: ${validation.errors.join("; ")}`);
    if (isOpenBlockingGap(gap)) blocked.push(gap.gap_id);
    else if (gap?.blocking_status === "warning") gaps.push(gap.gap_id);
    return { file: designGapFixtureFiles[index], ...validation };
  });

  const bundleFixtures = new Map();
  const inventoryFixtures = new Map();
  const registryFixtures = new Map();
  const irFixtures = new Map();
  const conformanceFixtures = new Map();
  const consistencyFixtures = new Map();
  const warningObjects = [];
  const draftArtifacts = [];
  const artifactsBlockedByWarning = [];
  const artifactsAllowedWithWarnings = [];
  const prohibitedDownstreamUseViolations = [];

  const fixtureResults = bundleFixtureFiles.map((file) => {
    const bundle = readFixtureIfExists(fixtureDir, file);
    bundleFixtures.set(bundle.bundle_id, bundle);
    const validation = validateMmabpDesignSourceBundle(bundle);
    validatedArtifacts.push({ artifact: "mmabp_design_source_bundle", id: bundle.bundle_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const structuralFactResults = structuralFactFixtureFiles.map((file) => {
    const inventory = readFixtureIfExists(fixtureDir, file);
    inventoryFixtures.set(inventory.inventory_id, inventory);
    const sourceBundle = bundleFixtures.get(inventory.source_bundle_id);
    if (!sourceBundle) failures.push(`${file}: source bundle fixture not found`);
    const validation = validateClientMmabpStructuralFacts(inventory, sourceBundle);
    validatedArtifacts.push({ artifact: "client_mmabp_structural_facts", id: inventory.inventory_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const inventoryReadinessResults = inventoryReadinessFixtureFiles.map((file) => {
    const inventoryReadiness = readFixtureIfExists(fixtureDir, file);
    const inventory = inventoryFixtures.get(inventoryReadiness.structural_facts_package_id);
    const sourceBundle = bundleFixtures.get(inventoryReadiness.source_bundle_id);
    const validation = validateInventoryReadiness(inventoryReadiness, inventory, sourceBundle, designGaps);
    validatedArtifacts.push({ artifact: "inventory_readiness", id: inventoryReadiness.readiness_id ?? inventoryReadiness.structural_facts_package_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });
  const primaryInventoryReadiness = inventoryReadinessFixtureFiles.length ? readFixtureIfExists(fixtureDir, inventoryReadinessFixtureFiles[0]) : null;

  const registryResults = registryFixtureFiles.map((file) => {
    const registryPackage = readFixtureIfExists(fixtureDir, file);
    registryFixtures.set(registryPackage.registry_package_id, registryPackage);
    const inventory = inventoryFixtures.get(registryPackage.source_inventory_id);
    if (!inventory) failures.push(`${file}: source inventory fixture not found`);
    const validation = validateQuadrantRegistryPackage(registryPackage, inventory, primaryInventoryReadiness, designGaps);
    validatedArtifacts.push({ artifact: "quadrant_registry_package", id: registryPackage.registry_package_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const conformanceResults = conformanceFixtureFiles.map((file) => {
    const conformanceReport = readFixtureIfExists(fixtureDir, file);
    conformanceFixtures.set(conformanceReport.report_id, conformanceReport);
    const validation = validateConformanceReport(conformanceReport, { irPackage: readFixtureIfExists(fixtureDir, irFixtureFiles[0] ?? "") }, designGaps);
    validatedArtifacts.push({ artifact: "conformance_report", id: conformanceReport.report_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const consistencyResults = consistencyFixtureFiles.map((file) => {
    const consistencyReport = readFixtureIfExists(fixtureDir, file);
    consistencyFixtures.set(consistencyReport.report_id, consistencyReport);
    const validation = validateConsistencyReport(consistencyReport, {
      registryPackage: readFixtureIfExists(fixtureDir, registryFixtureFiles[0] ?? ""),
      irPackage: readFixtureIfExists(fixtureDir, irFixtureFiles[0] ?? ""),
    }, designGaps);
    validatedArtifacts.push({ artifact: "consistency_report", id: consistencyReport.report_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const irResults = irFixtureFiles.map((file) => {
    const irPackage = readFixtureIfExists(fixtureDir, file);
    irFixtures.set(irPackage.ir_package_id, irPackage);
    const registryPackage = registryFixtures.get(irPackage.source_registry_package_id);
    const conformanceReport = conformanceFixtures.get(irPackage.conformance_report_id);
    const consistencyReport = consistencyFixtures.get(irPackage.consistency_report_id);
    if (!registryPackage) failures.push(`${file}: source registry fixture not found`);
    const validation = validateMmabpIrPackage(irPackage, registryPackage, { conformanceReport, consistencyReport }, designGaps);
    validatedArtifacts.push({ artifact: "mmabp_ir_package", id: irPackage.ir_package_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const handoffResults = handoffFixtureFiles.map((file) => {
    const handoffPackage = readFixtureIfExists(fixtureDir, file);
    const bundle = bundleFixtures.get(handoffPackage.artifact_refs?.mmabp_design_source_bundle_id);
    const inventory = inventoryFixtures.get(handoffPackage.artifact_refs?.client_mmabp_structural_facts_id);
    const registryPackage = registryFixtures.get(handoffPackage.artifact_refs?.quadrant_registry_package_id);
    const irPackage = irFixtures.get(handoffPackage.artifact_refs?.mmabp_ir_package_id);
    const validation = validateDesignHandoffPackage(handoffPackage, { bundle, inventory, registryPackage, irPackage, designGaps });
    validatedArtifacts.push({ artifact: "parallel_production_design_handoff_package", id: handoffPackage.handoff_package_id, file, status: validation.status });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const diagramGenerationResults = diagramGenerationFixtureFiles.map((file) => {
    const diagramPackage = readFixtureIfExists(fixtureDir, file);
    const irPackage = irFixtures.get(diagramPackage.source_mmabp_ir_package_id);
    const handoffPackage = readFixtureIfExists(fixtureDir, handoffFixtureFiles[0] ?? "");
    const conformanceReport = conformanceFixtures.get(diagramPackage.source_conformance_report_id);
    const consistencyReport = consistencyFixtures.get(diagramPackage.source_consistency_report_id);
    const validation = validateDiagramCodeGenerationPackage(diagramPackage, {
      handoffPackage,
      irPackage,
      conformanceReport,
      consistencyReport,
      designGaps,
    });
    validatedArtifacts.push({ artifact: "diagram_code_generation_package", id: diagramPackage.package_id, file, status: validation.status });
    const packageWarningObjects = packageWarnings(diagramPackage).filter((warning) => typeof warning === "object" && warning !== null);
    warningObjects.push(...packageWarningObjects.map((warning) => ({ ...warning, artifact_id: diagramPackage.package_id })));
    if (diagramPackage.generation_mode === "draft_with_warnings") draftArtifacts.push(diagramPackage.package_id);
    if (packageWarningObjects.some((warning) => ["high", "critical"].includes(warning.severity) && !hasAcceptedRisk(warning))) {
      artifactsBlockedByWarning.push(diagramPackage.package_id);
    }
    if (diagramPackage.generation_readiness === "ready_with_warnings" || packageWarningObjects.length) {
      artifactsAllowedWithWarnings.push(diagramPackage.package_id);
    }
    for (const exportItem of asArray(diagramPackage.exports)) {
      if (diagramPackage.generation_mode === "draft_with_warnings" && !includesAll(exportItem.prohibited_uses, DRAFT_PROHIBITED_USES)) {
        prohibitedDownstreamUseViolations.push(exportItem.export_id);
      }
    }
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const generatedCandidateFileResults = candidateExportFixtureFiles.map((file) => {
    const candidateExportPackage = readFixtureIfExists(fixtureDir, file);
    const irPackage = irFixtures.get(candidateExportPackage.source_mmabp_ir_package_id);
    const registryPackage = readFixtureIfExists(fixtureDir, registryFixtureFiles[0] ?? "");
    const inventory = readFixtureIfExists(fixtureDir, structuralFactFixtureFiles[0] ?? "");
    const sourceBundle = readFixtureIfExists(fixtureDir, bundleFixtureFiles[0] ?? "");
    const validation = validateGeneratedCandidateFiles({
      root,
      candidateExportPackage,
      irPackage,
      registryPackage,
      inventory,
      sourceBundle,
      designGaps,
    });
    validatedArtifacts.push({
      artifact: "candidate_export_package",
      id: candidateExportPackage.candidate_export_package_id,
      file,
      status: validation.status,
    });
    if (validation.status !== "passed") failures.push(`${file}: ${validation.errors.join("; ")}`);
    warnings.push(...validation.warnings);
    return { file, ...validation };
  });

  const generatedSummary = generatedCandidateFileResults.reduce(
    (accumulator, item) => {
      const summary = item.summary ?? {};
      accumulator.generated_candidate_files_count += summary.generated_candidate_files_count ?? 0;
      for (const format of asArray(summary.generated_formats)) accumulator.generated_formats.add(format);
      for (const [quadrant, count] of Object.entries(summary.generated_by_quadrant ?? {})) {
        accumulator.generated_by_quadrant[quadrant] = (accumulator.generated_by_quadrant[quadrant] ?? 0) + count;
      }
      accumulator.warnings_count += summary.warnings_count ?? 0;
      accumulator.gaps_count += summary.gaps_count ?? 0;
      accumulator.blocking_gaps_count += summary.blocking_gaps_count ?? 0;
      accumulator.candidate_only_confirmed = accumulator.candidate_only_confirmed && summary.candidate_only_confirmed !== false;
      accumulator.prohibited_uses_confirmed = accumulator.prohibited_uses_confirmed && summary.prohibited_uses_confirmed !== false;
      accumulator.semantic_preservation_statuses.push(summary.semantic_preservation_status);
      if (summary.traceability_coverage && summary.traceability_coverage !== "complete") accumulator.traceability_coverage = summary.traceability_coverage;
      return accumulator;
    },
    {
      generated_candidate_files_count: 0,
      generated_formats: new Set(),
      generated_by_quadrant: {},
      traceability_coverage: "complete",
      semantic_preservation_statuses: [],
      warnings_count: 0,
      gaps_count: 0,
      blocking_gaps_count: 0,
      candidate_only_confirmed: candidateExportFixtureFiles.length > 0,
      prohibited_uses_confirmed: candidateExportFixtureFiles.length > 0,
    },
  );

  const diagnosticLeakageDetected = failures.some((failure) => /diagnostic|root_cause|monetization|narrative|recommendation/i.test(failure));
  const warningsBySeverity = warningObjects.reduce((accumulator, warning) => {
    accumulator[warning.severity] = (accumulator[warning.severity] ?? 0) + 1;
    return accumulator;
  }, {});
  const report = {
    status: failures.length ? "failed" : "passed",
    overall_status: failures.length ? "failed" : blocked.length ? "blocked" : "passed",
    checked_at: new Date().toISOString(),
    contract_id: "platform-design-handoff-contract.capa-1.parallel-production.v1",
    next_contract_id: "platform-diagram-code-generation-contract.capa-1.parallel-production.v1",
    bundle_type: "mmabp_design_source_bundle",
    bundle_version: "1.0.0",
    validation_order: validationOrder,
    validated_artifacts: validatedArtifacts,
    passed,
    warnings: unique(warnings),
    warnings_count: warningObjects.length,
    warnings_by_severity: warningsBySeverity,
    warning_objects: warningObjects,
    draft_artifacts_count: draftArtifacts.length,
    draft_artifacts: unique(draftArtifacts),
    artifacts_blocked_by_warning: unique(artifactsBlockedByWarning),
    artifacts_allowed_with_warnings: unique(artifactsAllowedWithWarnings),
    prohibited_downstream_uses_detected: prohibitedDownstreamUseViolations.length > 0,
    prohibited_downstream_use_violations: unique(prohibitedDownstreamUseViolations),
    generated_candidate_files_count: generatedSummary.generated_candidate_files_count,
    generated_formats: [...generatedSummary.generated_formats],
    generated_by_quadrant: generatedSummary.generated_by_quadrant,
    traceability_coverage: generatedSummary.traceability_coverage,
    semantic_preservation_status: unique(generatedSummary.semantic_preservation_statuses).join(",") || null,
    generated_warnings_count: generatedSummary.warnings_count,
    gaps_count: generatedSummary.gaps_count,
    blocking_gaps_count: generatedSummary.blocking_gaps_count,
    candidate_only_confirmed: generatedSummary.candidate_only_confirmed,
    prohibited_uses_confirmed: generatedSummary.prohibited_uses_confirmed,
    blocked: unique(blocked),
    gaps: unique(gaps),
    diagnostic_leakage_detected: diagnosticLeakageDetected,
    core_contract_unchanged: coreContractUnchanged,
    capa2_readiness_unchanged: coreContractUnchanged,
    fixture_count: fixtureFiles.length,
    schema_count: EXPECTED_SCHEMA_FILES.length,
    new_schema_count: NEW_SCHEMA_FILES.length,
    contract_surface: contractSurface,
    bundle_fixture_count: bundleFixtureFiles.length,
    structural_fact_fixture_count: structuralFactFixtureFiles.length,
    inventory_readiness_fixture_count: inventoryReadinessFixtureFiles.length,
    design_gap_fixture_count: designGapFixtureFiles.length,
    quadrant_registry_fixture_count: registryFixtureFiles.length,
    conformance_report_fixture_count: conformanceFixtureFiles.length,
    consistency_report_fixture_count: consistencyFixtureFiles.length,
    mmabp_ir_fixture_count: irFixtureFiles.length,
    design_handoff_fixture_count: handoffFixtureFiles.length,
    diagram_code_generation_fixture_count: diagramGenerationFixtureFiles.length,
    candidate_export_package_fixture_count: candidateExportFixtureFiles.length,
    failures,
    fixture_results: fixtureResults,
    structural_fact_results: structuralFactResults,
    inventory_readiness_results: inventoryReadinessResults,
    design_gap_results: designGapResults,
    quadrant_registry_results: registryResults,
    conformance_report_results: conformanceResults,
    consistency_report_results: consistencyResults,
    mmabp_ir_results: irResults,
    design_handoff_results: handoffResults,
    diagram_code_generation_results: diagramGenerationResults,
    generated_candidate_file_results: generatedCandidateFileResults,
  };

  const reportPath = path.join(root, "tests", "reports", "parallel-production-validation-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = validateParallelProduction();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "passed") process.exitCode = 1;
}
