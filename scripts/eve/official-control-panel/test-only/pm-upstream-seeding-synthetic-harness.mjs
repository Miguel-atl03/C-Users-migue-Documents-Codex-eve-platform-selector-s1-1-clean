import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  validateClientMmabpStructuralFacts,
  validateInventoryReadiness,
  validateMmabpDesignSourceBundle,
  validateMmabpIrPackage,
  validateQuadrantRegistryPackage,
} from "../../validate-parallel-production.mjs";

const root = process.cwd();
const fixtureDir = path.join(root, "tests", "fixtures", "parallel-production");

export const pmSeedInputs = [
  {
    input: "PM.customer_need_id",
    objectType: "CustomerNeedReference",
    sourceRecordType: "canonical_variable_record",
    sourceFieldOrPath: "variable_name=customer_need",
    sourceNodeRef: "D6:Parallel_Production_Contract:PM Registry Candidates",
    canonicalVariable: "customer_need",
    criticalRoute: "CR-B0-WorkMapIntake-semantic-entry",
    sourceQuestion: "0.5.3",
    sourceBlock: "block_0_5",
  },
  {
    input: "PM.process_id",
    objectType: "BusinessProcessReference",
    sourceRecordType: "canonical_variable_record",
    sourceFieldOrPath: "variable_name=business_process",
    sourceNodeRef: "D6:Parallel_Production_Contract:PM Registry Candidates",
    canonicalVariable: "business_process",
    criticalRoute: "CR-B0-WorkMapIntake-semantic-entry",
    sourceQuestion: "1.1",
    sourceBlock: "block_1",
  },
  {
    input: "PM.process_kind",
    objectType: "BusinessProcessReference",
    sourceRecordType: "canonical_variable_record",
    sourceFieldOrPath: "variable_name=process_kind",
    sourceNodeRef: "D6:Parallel_Production_Contract:PM Registry Candidates",
    canonicalVariable: "process_kind",
    criticalRoute: "CR-PM-process-kind-governance",
    sourceQuestion: "0.5.3",
    sourceBlock: "block_0_5",
  },
  {
    input: "PM.trigger_event_id",
    objectType: "BusinessTriggerReference",
    sourceRecordType: "canonical_variable_record",
    sourceFieldOrPath: "variable_name=trigger_event",
    sourceNodeRef: "D1:2.2.6:PM triggering event",
    canonicalVariable: "trigger_event",
    criticalRoute: "CR-B3-start-event",
    sourceQuestion: "3.1",
    sourceBlock: "block_3",
  },
  {
    input: "PM.dependency_id",
    objectType: "ProcessDependencyReference",
    sourceRecordType: "canonical_variable_record",
    sourceFieldOrPath: "variable_name=process_dependency",
    sourceNodeRef: "D6:Parallel_Production_Contract:PM Registry Candidates",
    canonicalVariable: "process_dependency",
    criticalRoute: "CR-PM-support-dependency",
    sourceQuestion: "2.9",
    sourceBlock: "block_2",
  },
  {
    input: "PM.supported_process_id",
    objectType: "ProcessSupportReference",
    sourceRecordType: "canonical_variable_record",
    sourceFieldOrPath: "variable_name=supported_process",
    sourceNodeRef: "D6:Parallel_Production_Contract:PM Registry Candidates",
    canonicalVariable: "supported_process",
    criticalRoute: "CR-PM-support-dependency",
    sourceQuestion: "2.9",
    sourceBlock: "block_2",
  },
  {
    input: "PM.synchronization_id",
    objectType: "ProcessSynchronizationReference",
    sourceRecordType: "canonical_variable_record",
    sourceFieldOrPath: "variable_name=process_synchronization",
    sourceNodeRef: "D6:Parallel_Production_Contract:PM Registry Candidates",
    canonicalVariable: "process_synchronization",
    criticalRoute: "CR-PM-support-synchronization",
    sourceQuestion: "4.3",
    sourceBlock: "block_4",
  },
];

export const pmSeedValues = {
  customer_need_id: "NEED_PM_U0_001",
  process_id: "PROC_PM_U0_KEY_001",
  process_kind: "key",
  trigger_event_id: "TRIG_PM_U0_001",
  dependency_id: "DEP_PM_U0_SUPPORT_001",
  supported_process_id: "PROC_PM_U0_SUPPORT_001",
  synchronization_id: "SYNC_PM_U0_001",
};

export function buildPmSourceMatrix() {
  return pmSeedInputs.map((item) => ({
    input: item.input,
    source_table: "public.canonical_variable_record",
    source_record_type: item.sourceRecordType,
    source_field_or_path: item.sourceFieldOrPath,
    source_node_ref: item.sourceNodeRef,
    canonical_variable: item.canonicalVariable,
    critical_route: item.criticalRoute,
    epistemic_status: "user_confirmed_suggestion",
    confirmation_requirement: "confirmed_or_user_corrected_before_fact",
    producer_service: "scripts/eve/official-control-panel/test-only/pm-upstream-seeding-synthetic-harness.mjs",
    target_contract: item.objectType,
    target_table: "public.mmabp_source_package_version",
    consumer: "MMABP source snapshot -> normalization -> readiness -> future Conformance/Consistency -> BFF -> Panel",
    source_status: "MATERIALIZED",
  }));
}

export function buildPmVerticalSources(base) {
  const bundle = structuredClone(base.bundle);
  const facts = structuredClone(base.facts);
  const registry = structuredClone(base.registry);
  const inventory = structuredClone(base.inventory);
  const ir = structuredClone(base.ir);

  const evidenceItems = [
    evidence("EVID_PM_NEED_001", "0.5.3", "El cliente necesita que la solicitud llegue aprobada y lista para continuar sin persecucion manual."),
    evidence("EVID_PM_PROCESS_001", "1.1", "El proceso clave es gestionar solicitud hasta dejarla lista para aprobacion legal y avance operativo."),
    evidence("EVID_PM_TRIGGER_001", "3.1", "El disparador ocurre cuando entra una nueva solicitud completa al flujo operativo."),
    evidence("EVID_PM_DEP_001", "2.9", "El proceso depende de que legal revise y devuelva la aprobacion para poder continuar."),
    evidence("EVID_PM_SUPPORT_001", "2.9", "El seguimiento legal soporta al proceso clave gestionar solicitud."),
    evidence("EVID_PM_SYNC_001", "4.3", "La sincronizacion ocurre cuando aprobacion legal recibida libera el avance de la solicitud."),
    evidence("EVID_PM_KIND_001", "0.5.3", "Gestionar solicitud es proceso clave; seguimiento legal opera como soporte relacionado."),
  ];
  bundle.literal_evidence.push(...evidenceItems);
  bundle.canonical_derivations.push(...pmSeedInputs.map((item, index) => ({
    derivation_id: `DER_PM_U0_${String(index + 1).padStart(3, "0")}`,
    scene_id: "SC_001",
    canonical_variable: item.canonicalVariable,
    value: pmValueFor(item.canonicalVariable),
    source_evidence_ids: [evidenceItems[index].evidence_id],
  })));
  bundle.quadrant_candidates.push({
    candidate_id: "CAND_PM_U0_PROCESS_KEY",
    candidate_type: "business_process",
    canonical_label: "Gestionar solicitud",
    quadrant_targets: ["PM"],
    source_scene_ids: ["SC_001"],
    source_evidence_ids: evidenceItems.map((item) => item.evidence_id),
    related_process: "Gestionar solicitud",
    confidence: 0.91,
    projection_status: "candidate",
  });
  bundle.design_source_readiness.confidence_summary.average_candidate_confidence = 0.82;

  const pmFacts = [
    fact(facts, "FACT_PM_U0_NEED", "business_function", "Necesidad del cliente: solicitud aprobada y lista para avanzar.", ["EVID_PM_NEED_001"], ["CAND_PM_U0_PROCESS_KEY"]),
    fact(facts, "FACT_PM_U0_PROCESS", "business_process", "Gestionar solicitud", ["EVID_PM_PROCESS_001", "EVID_PM_KIND_001"], ["CAND_PM_U0_PROCESS_KEY"]),
    fact(facts, "FACT_PM_U0_TRIGGER", "trigger_event", "Nueva solicitud completa recibida", ["EVID_PM_TRIGGER_001"], ["CAND_PM_U0_PROCESS_KEY"]),
    fact(facts, "FACT_PM_U0_DEP", "relationship", "Gestionar solicitud depende de revision legal", ["EVID_PM_DEP_001"], ["CAND_PM_U0_PROCESS_KEY"]),
    fact(facts, "FACT_PM_U0_SUPPORT", "support_process", "Seguimiento legal soporta gestionar solicitud", ["EVID_PM_SUPPORT_001"], ["CAND_PM_U0_PROCESS_KEY"]),
    fact(facts, "FACT_PM_U0_SYNC", "relationship", "Aprobacion legal recibida sincroniza soporte y proceso clave", ["EVID_PM_SYNC_001"], ["CAND_PM_U0_PROCESS_KEY"]),
  ];
  const pmFactIds = pmFacts.map((item) => item.fact_id);

  registry.registries.PM.elements[0] = {
    ...registry.registries.PM.elements[0],
    element_id: pmSeedValues.process_id,
    label: "Gestionar solicitud",
    process_id: pmSeedValues.process_id,
    process_kind: "key",
    customer_need_id: pmSeedValues.customer_need_id,
    trigger_events: [pmSeedValues.trigger_event_id],
    target_states: ["Solicitud en espera de aprobacion legal"],
    supported_process_id: pmSeedValues.supported_process_id,
    dependency_id: pmSeedValues.dependency_id,
    synchronization_id: pmSeedValues.synchronization_id,
    source_fact_ids: ["FACT_000001", "FACT_000002", ...pmFactIds],
  };
  registry.registries.PM.elements.push({
    element_id: pmSeedValues.supported_process_id,
    element_type: "business_process",
    label: "Seguimiento legal",
    process_id: pmSeedValues.supported_process_id,
    process_kind: "support",
    supported_process_id: pmSeedValues.process_id,
    trigger_events: [pmSeedValues.trigger_event_id],
    target_states: ["Aprobacion legal recibida"],
    source_fact_ids: ["FACT_PM_U0_SUPPORT", "FACT_PM_U0_SYNC"],
    conformance_status: "pending",
    consistency_status: "pending",
  });
  registry.registries.PM.gaps = registry.registries.PM.gaps.filter((gap) => gap.gap_type !== "missing_trigger_event");

  ir.models.PM_IR.elements[0] = {
    ...ir.models.PM_IR.elements[0],
    ir_element_id: "PM_IR_PROC_U0_KEY_001",
    source_registry_element_ids: [pmSeedValues.process_id],
    source_fact_ids: ["FACT_000001", "FACT_000002", ...pmFactIds],
    process_id: pmSeedValues.process_id,
    process_kind: "key",
    customer_need_id: pmSeedValues.customer_need_id,
    trigger_events: [pmSeedValues.trigger_event_id],
    supported_process_id: pmSeedValues.supported_process_id,
    dependency_id: pmSeedValues.dependency_id,
    synchronization_id: pmSeedValues.synchronization_id,
  };
  ir.models.PM_IR.elements.push({
    ir_element_id: "PM_IR_PROC_U0_SUPPORT_001",
    ir_element_type: "business_process",
    label: "Seguimiento legal",
    source_registry_element_ids: [pmSeedValues.supported_process_id],
    source_fact_ids: ["FACT_PM_U0_SUPPORT", "FACT_PM_U0_SYNC"],
    process_id: pmSeedValues.supported_process_id,
    process_kind: "support",
    trigger_events: [pmSeedValues.trigger_event_id],
    target_states: ["Aprobacion legal recibida"],
    supported_process_id: pmSeedValues.process_id,
    dependency_id: pmSeedValues.dependency_id,
    synchronization_id: pmSeedValues.synchronization_id,
    conformance_status: "pending",
    consistency_status: "pending",
  });
  ir.models.PM_IR.gaps = ir.models.PM_IR.gaps.filter((gap) => gap.gap_type !== "missing_trigger_event");

  return { evidence: bundle, facts, registry, inventory, ir };
}

export function validatePmVerticalSources(source) {
  const reports = loadValidationReports(source.ir);
  const results = {
    evidence: validateMmabpDesignSourceBundle(source.evidence),
    facts: validateClientMmabpStructuralFacts(source.facts, source.evidence),
    inventory: validateInventoryReadiness(source.inventory, source.facts, source.evidence),
    registry: validateQuadrantRegistryPackage(source.registry, source.facts, source.inventory),
    ir: validateMmabpIrPackage(source.ir, source.registry, reports),
  };
  const failed = Object.entries(results).filter(([, value]) => value.status !== "passed");
  return { status: failed.length ? "failed" : "passed", results, failed };
}

export function evaluatePmSeedGate(candidate) {
  const findings = [];
  if (candidate.b7Direct === true) findings.push("B7_SOURCE_FORBIDDEN_FOR_PM");
  if (!["captured", "confirmed", "user_corrected", "canonically_derived", "user_confirmed_suggestion"].includes(candidate.epistemic_status)) {
    findings.push("EPISTEMIC_STATUS_NOT_ACCEPTED");
  }
  if (candidate.requiresConfirmation !== false && !["confirmed", "user_corrected"].includes(candidate.confirmation_status)) {
    findings.push("CONFIRMATION_REQUIRED");
  }
  if (candidate.input === "PM.trigger_event_id" && !candidate.source_evidence_ids?.length) findings.push("TRIGGER_WITHOUT_EVIDENCE");
  if (candidate.input === "PM.dependency_id" && (!candidate.source_process_id || !candidate.target_process_id)) findings.push("DEPENDENCY_ENDPOINT_MISSING");
  if (candidate.input === "PM.supported_process_id" && !candidate.supported_process_id) findings.push("SUPPORT_WITHOUT_SUPPORTED_PROCESS");
  if (candidate.input === "PM.synchronization_id" && !candidate.trigger_event_id) findings.push("SYNCHRONIZATION_WITHOUT_CAUSAL_EVENT");
  if (candidate.input === "PM.process_kind" && !["key", "support"].includes(candidate.value)) findings.push("PROCESS_KIND_NOT_RESOLVABLE");
  if (candidate.input === "PM.customer_need_id" && candidate.confirmation_status !== "confirmed") findings.push("CUSTOMER_NEED_UNCONFIRMED");
  return {
    ok: findings.length === 0,
    findings,
  };
}

function evidence(evidenceId, question, literalValue) {
  return {
    evidence_id: evidenceId,
    scene_id: "SC_001",
    block_origin: blockFromQuestion(question),
    question_origin: question,
    literal_value: literalValue,
    provenance_type: "user_confirmed_suggestion",
  };
}

function fact(facts, factId, factType, label, evidenceIds, candidateIds) {
  const item = {
    fact_id: factId,
    client_id: facts.client_id,
    session_id: facts.session_id,
    scene_id: "SC_001",
    source_user_id: "USR_001",
    source_user_role: "Analista de operaciones",
    block_origin: blockFromQuestion("0.5.3"),
    question_origin: "0.5.3",
    literal_evidence: label,
    normalized_fact_type: factType,
    canonical_label: label,
    quadrant_targets: ["PM"],
    source_candidate_ids: candidateIds,
    source_evidence_ids: evidenceIds,
    related_process: "Gestionar solicitud",
    related_object_class: "Solicitud",
    related_object_state: "Solicitud en espera de aprobacion legal",
    related_event: pmSeedValues.trigger_event_id,
    related_operation: null,
    confidence: 0.9,
    conformance_status: "pending",
    consistency_status: "pending",
    projection_status: "candidate",
    flags: [],
    gaps: [],
    boundaries: {
      not_diagnostic: true,
      not_capa2_readiness: true,
      not_monetization: true,
      not_final_narrative: true,
    },
  };
  facts.structural_facts.push(item);
  return item;
}

function pmValueFor(variable) {
  return {
    customer_need: pmSeedValues.customer_need_id,
    business_process: pmSeedValues.process_id,
    process_kind: pmSeedValues.process_kind,
    trigger_event: pmSeedValues.trigger_event_id,
    process_dependency: pmSeedValues.dependency_id,
    supported_process: pmSeedValues.supported_process_id,
    process_synchronization: pmSeedValues.synchronization_id,
  }[variable];
}

function blockFromQuestion(question) {
  return `block_${String(question).split(".")[0]}`;
}

function loadValidationReports(ir) {
  const conformanceReport = JSON.parse(fs.readFileSync(path.join(fixtureDir, "conformance-report-passed.json"), "utf8"));
  const consistencyReport = JSON.parse(fs.readFileSync(path.join(fixtureDir, "consistency-report-passed.json"), "utf8"));
  conformanceReport.report_id = ir.conformance_report_id;
  consistencyReport.report_id = ir.consistency_report_id;
  return { conformanceReport, consistencyReport };
}

export function sha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}
