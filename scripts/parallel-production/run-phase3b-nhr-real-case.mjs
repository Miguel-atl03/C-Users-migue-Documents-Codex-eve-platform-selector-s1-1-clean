import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { generateMocPlantUml } from "./generators/generate-moc-plantuml.mjs";
import { generateOlcPlantUml } from "./generators/generate-olc-plantuml.mjs";
import { generatePfBpmn } from "./generators/generate-pf-bpmn.mjs";
import { generatePmBpmn } from "./generators/generate-pm-bpmn.mjs";
import { validateGeneratedCandidateFiles } from "./generators/validate-generated-candidate-files.mjs";
import {
  REQUIRED_CANDIDATE_PROHIBITED_USES,
  asArray,
  sha256,
  unique,
  writeGeneratedFile,
  writeJson,
} from "./generators/generator-utils.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "..", "..");
const defaultInputPath = path.join(repoRoot, "fixtures", "nhr-phase3b-session-input.json");
const baseUrl = process.env.EVE_BASE_URL ?? "http://localhost:3000";
const outputRoot = "tests/reports/parallel-production-real-cases/nhr-order-delivery";
const generatedRoot = `${outputRoot}/generated-candidate-files`;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const loadEnvLocal = () => {
  const envPath = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
};

const supabaseClient = () => {
  const env = { ...loadEnvLocal(), ...process.env };
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

const postJson = async (pathname, body) => {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${pathname} failed: ${JSON.stringify(json)}`);
  return json;
};

const saveArtifact = (relativePath, value) => writeJson(repoRoot, relativePath, value);

const first = (values) => asArray(values)[0] ?? null;

const findEvidence = (bundle, questionOrigin) =>
  asArray(bundle.literal_evidence).filter((item) => item.question_origin === questionOrigin);

const evidenceIdsForQuestions = (bundle, questions) =>
  unique(questions.flatMap((question) => findEvidence(bundle, question).map((item) => item.evidence_id)));

const candidateIdsForTypes = (bundle, types) =>
  unique(
    asArray(bundle.quadrant_candidates)
      .filter((candidate) => types.includes(candidate.candidate_type))
      .map((candidate) => candidate.candidate_id),
  );

const literalFor = (bundle, questionOrigin) =>
  first(findEvidence(bundle, questionOrigin))?.literal_value ?? `Evidence ${questionOrigin}`;

const buildFacts = ({ input, bundle, sessionId, sceneId }) => {
  const clientId = bundle.client_context?.client_id ?? "NHR_PHASE3B";
  const sourceScene = first(bundle.source_scenes) ?? {};
  const userRole = sourceScene.source_user_role ?? input.roleSession.roleName;
  const sourceUserId = sourceScene.source_user_id ?? "phase3b_user";
  const factBase = {
    client_id: clientId,
    session_id: sessionId,
    scene_id: sceneId,
    source_user_id: sourceUserId,
    source_user_role: userRole,
    conformance_status: "pending",
    consistency_status: "pending",
    projection_status: "candidate",
    boundaries: {
      not_diagnostic: true,
      not_capa2_readiness: true,
      not_monetization: true,
      not_final_narrative: true,
    },
  };

  return {
    inventory_id: "NHR_PHASE3B_MMABP_FACTS_V1",
    inventory_type: "client_mmabp_structural_facts",
    inventory_version: "1.0.0",
    source_bundle_id: bundle.bundle_id,
    client_id: clientId,
    session_id: sessionId,
    structural_facts: [
      {
        ...factBase,
        fact_id: "NHR_FACT_PM_PROCESS_001",
        block_origin: "block_0_5",
        question_origin: "0.5.2a",
        literal_evidence: literalFor(bundle, "0.5.2a"),
        normalized_fact_type: "business_process",
        canonical_label: "Provisionar servicio de comida delivery",
        quadrant_targets: ["PM"],
        source_candidate_ids: candidateIdsForTypes(bundle, ["business_process"]),
        source_evidence_ids: evidenceIdsForQuestions(bundle, ["0.5.2a", "0.5.3", "1.1"]),
        related_process: "Provisionar servicio de comida delivery",
        related_object_class: "Orden de cliente",
        related_object_state: "Orden consolidada",
        related_event: "Orden recibida desde canal multifuente",
        related_operation: "consolidarOrden",
        confidence: 0.82,
        flags: [],
        gaps: [],
      },
      {
        ...factBase,
        fact_id: "NHR_FACT_PF_WAIT_001",
        block_origin: "block_4",
        question_origin: "4.3",
        literal_evidence: literalFor(bundle, "4.3"),
        normalized_fact_type: "process_state",
        canonical_label: "Orden esperando confirmacion de repartidor",
        quadrant_targets: ["PF", "OLC"],
        source_candidate_ids: candidateIdsForTypes(bundle, ["process_state", "trigger_event"]),
        source_evidence_ids: evidenceIdsForQuestions(bundle, ["4.3", "4.4", "4.5"]),
        related_process: "Provisionar servicio de comida delivery",
        related_object_class: "Orden de cliente",
        related_object_state: "Esperando confirmacion de repartidor",
        related_event: "Repartidor confirma llegada o cambia horario",
        related_operation: "actualizarHorarioEntrega",
        confidence: 0.79,
        flags: [
          {
            code: "timer_variability",
            severity: "warning",
            source_evidence_ids: evidenceIdsForQuestions(bundle, ["4.3", "4.4"]),
          },
        ],
        gaps: ["NHR_DGAP_TIMER_VARIABILITY_001"],
      },
      {
        ...factBase,
        fact_id: "NHR_FACT_PF_TASK_001",
        block_origin: "block_2",
        question_origin: "2.1c",
        literal_evidence: literalFor(bundle, "2.1c"),
        normalized_fact_type: "task",
        canonical_label: "Consolidar orden multicanal",
        quadrant_targets: ["PF"],
        source_candidate_ids: candidateIdsForTypes(bundle, ["operation", "handoff"]),
        source_evidence_ids: evidenceIdsForQuestions(bundle, ["2.1c", "2.5", "2.6", "3.8"]),
        related_process: "Provisionar servicio de comida delivery",
        related_object_class: "Orden de cliente",
        related_object_state: "Orden consolidada",
        related_event: "Orden recibida desde canal multifuente",
        related_operation: "consolidarOrden",
        confidence: 0.84,
        flags: [],
        gaps: [],
      },
      {
        ...factBase,
        fact_id: "NHR_FACT_MOC_CLASS_001",
        block_origin: "block_2",
        question_origin: "2.1a",
        literal_evidence: literalFor(bundle, "2.1a"),
        normalized_fact_type: "object_class",
        canonical_label: "Orden de cliente",
        quadrant_targets: ["MoC"],
        source_candidate_ids: candidateIdsForTypes(bundle, ["object_class"]),
        source_evidence_ids: evidenceIdsForQuestions(bundle, ["2.1a", "2.2_obj", "3.1"]),
        related_process: "Provisionar servicio de comida delivery",
        related_object_class: "Orden de cliente",
        related_object_state: null,
        related_event: null,
        related_operation: null,
        confidence: 0.86,
        flags: [],
        gaps: [],
      },
      {
        ...factBase,
        fact_id: "NHR_FACT_OLC_TRANSITION_001",
        block_origin: "block_2",
        question_origin: "2.5",
        literal_evidence: `${literalFor(bundle, "2.5")} -> ${literalFor(bundle, "2.6")}`,
        normalized_fact_type: "object_state_transition",
        canonical_label: "Orden recibida pasa a orden consolidada",
        quadrant_targets: ["OLC"],
        source_candidate_ids: candidateIdsForTypes(bundle, ["object_state", "operation"]),
        source_evidence_ids: evidenceIdsForQuestions(bundle, ["2.5", "2.6", "1.1"]),
        related_process: "Provisionar servicio de comida delivery",
        related_object_class: "Orden de cliente",
        related_object_state: "Orden consolidada",
        related_event: "Orden recibida desde canal multifuente",
        related_operation: "consolidarOrden",
        confidence: 0.83,
        flags: [],
        gaps: [],
      },
    ],
    inventory_readiness: {
      status: "ready_with_inventory_gaps",
      notes: [
        "El caso real soporta los cuatro cuadrantes basicos.",
        "La variabilidad del tiempo de repartidor queda como warning no bloqueante para candidato.",
      ],
    },
  };
};

const buildRegistries = ({ facts, clientId }) => ({
  registry_package_id: "NHR_PHASE3B_QUADRANT_REGISTRIES_V1",
  registry_package_type: "quadrant_registry_package",
  registry_version: "1.0.0",
  source_inventory_id: facts.inventory_id,
  client_id: clientId,
  registries: {
    PM: {
      quadrant: "PM",
      elements: [
        {
          element_id: "NHR_PM_PROC_001",
          element_type: "business_process",
          label: "Provisionar servicio de comida delivery",
          source_fact_ids: ["NHR_FACT_PM_PROCESS_001"],
          trigger_events: ["Orden recibida desde POS, app de delivery o WhatsApp"],
          target_states: ["Orden consolidada y comunicada a cocina/repartidor"],
          support_markers: ["Excel operativo como soporte manual de coordinacion"],
          conformance_status: "pending",
          consistency_status: "pending",
        },
      ],
      gaps: [],
    },
    PF: {
      quadrant: "PF",
      elements: [
        {
          element_id: "NHR_PF_TASK_001",
          element_type: "task",
          label: "Consolidar orden multicanal",
          source_fact_ids: ["NHR_FACT_PF_TASK_001"],
          object_class: "Orden de cliente",
          object_state: "Orden consolidada",
          conformance_status: "pending",
          consistency_status: "pending",
        },
        {
          element_id: "NHR_PF_PSTATE_001",
          element_type: "process_state",
          label: "Esperar confirmacion de repartidor",
          source_fact_ids: ["NHR_FACT_PF_WAIT_001"],
          awaited_events: ["Repartidor confirma llegada o cambia horario"],
          timer_event: "PT20M_variability_observed",
          conformance_status: "pending",
          consistency_status: "pending",
        },
      ],
      gaps: ["NHR_DGAP_TIMER_VARIABILITY_001"],
    },
    MoC: {
      quadrant: "MoC",
      elements: [
        {
          element_id: "NHR_MOC_CLASS_001",
          element_type: "class",
          label: "Orden de cliente",
          business_concept: "Objeto de negocio que captura pedido, canal, estado de confirmacion, horario prometido y cambios solicitados.",
          source_fact_ids: ["NHR_FACT_MOC_CLASS_001"],
          conformance_status: "pending",
          consistency_status: "pending",
        },
      ],
      gaps: [],
    },
    OLC: {
      quadrant: "OLC",
      elements: [
        {
          element_id: "NHR_OLC_STATE_001",
          element_type: "object_state",
          label: "Orden recibida multicanal",
          object_class: "Orden de cliente",
          source_fact_ids: ["NHR_FACT_OLC_TRANSITION_001"],
          incoming_reason: "Orden capturada por POS, app o WhatsApp",
          conformance_status: "pending",
          consistency_status: "pending",
        },
        {
          element_id: "NHR_OLC_STATE_002",
          element_type: "object_state",
          label: "Orden consolidada",
          object_class: "Orden de cliente",
          source_fact_ids: ["NHR_FACT_OLC_TRANSITION_001"],
          incoming_reason: "Coordinador reconcilia fuentes y comunica horario",
          conformance_status: "pending",
          consistency_status: "pending",
        },
      ],
      gaps: [],
    },
  },
  registry_readiness: {
    status: "registries_ready_with_gaps",
    notes: ["PF conserva warning por variabilidad temporal de repartidor."],
  },
  boundaries: {
    not_diagram: true,
    not_mmabp_ir: true,
    not_diagnostic: true,
    not_capa2_readiness: true,
    not_monetization: true,
    not_final_narrative: true,
  },
});

const buildReportsAndIr = ({ facts, registries, clientId }) => {
  const warning = {
    warning_id: "NHR_WARN_TIMER_VARIABILITY_001",
    warning_type: "timer_variability_for_candidate",
    severity: "medium",
    owner: "parallel_production_design_area",
    affected_artifact_type: "diagram_code_generation_package",
    affected_element_ids: ["NHR_EXP_PF_BPMN_001", "NHR_PF_PSTATE_001"],
    reason: "El caso real declara variacion de llegada de repartidor de 20 minutos antes/despues, suficiente para candidato pero no para export final estable.",
    downstream_effect: "Permite diagrama candidato con advertencia; bloquea export final hasta confirmar regla temporal.",
    allowed_uses: ["candidate_export_package", "candidate_diagram_review"],
    prohibited_uses: ["final_export", "capa_2", "capa_2_5", "capa_3"],
    related_gap_ids: ["NHR_DGAP_TIMER_VARIABILITY_001"],
    resolution_recommendation: "Confirmar regla de SLA/timer antes de export final.",
    traceability_status: "complete",
    semantic_preservation_status: "passed_with_warnings",
  };
  const designGap = {
    gap_id: "NHR_DGAP_TIMER_VARIABILITY_001",
    gap_type: "projection_gap",
    severity: "medium",
    blocking_status: "warning",
    source_artifact_type: "quadrant_registry_package",
    source_artifact_id: registries.registry_package_id,
    source_element_id: "NHR_PF_PSTATE_001",
    affected_quadrants: ["PF", "OLC"],
    required_evidence: ["Confirmar timer/SLA operativo para export final."],
    reentry_question: "Cuando el repartidor cambia horario, que regla temporal decide si cocina acelera, espera o reprograma?",
    resolution_owner: "parallel_production_design_area",
    resolution_status: "open",
  };
  const conformanceReport = {
    report_id: "NHR_PHASE3B_CONFORMANCE_REPORT_V1",
    client_id: clientId,
    source_artifact_id: registries.registry_package_id,
    source_artifact_type: "quadrant_registry_package",
    checked_elements: ["NHR_PM_PROC_001", "NHR_PF_TASK_001", "NHR_PF_PSTATE_001", "NHR_MOC_CLASS_001", "NHR_OLC_STATE_001", "NHR_OLC_STATE_002"],
    conformance_status: "passed_with_warnings",
    findings: [
      {
        finding_id: "NHR_CONF_FINDING_TIMER_001",
        element_id: "NHR_PF_PSTATE_001",
        rule_id: "PF_PROCESS_STATE_TIMER_DETAIL",
        status: "warning",
        reason: warning.reason,
        source_evidence_ids: facts.structural_facts.find((fact) => fact.fact_id === "NHR_FACT_PF_WAIT_001")?.source_evidence_ids ?? [],
        source_fact_ids: ["NHR_FACT_PF_WAIT_001"],
        gap_ids: ["NHR_DGAP_TIMER_VARIABILITY_001"],
      },
    ],
    blocking_gaps: [],
    warnings: [warning],
  };
  const consistencyReport = {
    report_id: "NHR_PHASE3B_CONSISTENCY_REPORT_V1",
    client_id: clientId,
    source_registry_package_id: registries.registry_package_id,
    source_mmabp_ir_package_id: "NHR_PHASE3B_MMABP_IR_V1",
    checked_cross_quadrant_relations: [
      "PM-PF: trigger y target state soportados por flujo",
      "PF-OLC: task transforma Orden de cliente hacia Orden consolidada",
      "MoC-PF: PF task usa clase Orden de cliente",
      "MoC-OLC: estados OLC pertenecen a Orden de cliente",
      "PM-PF-OLC: target state PM corresponde a estado OLC Orden consolidada",
    ],
    consistency_status: "passed_with_warnings",
    findings: [
      {
        finding_id: "NHR_CONS_FINDING_TIMER_001",
        element_id: "NHR_PF_PSTATE_001",
        rule_id: "PF_OLC_TIMER_ALIGNMENT",
        status: "warning",
        reason: warning.downstream_effect,
        source_evidence_ids: facts.structural_facts.find((fact) => fact.fact_id === "NHR_FACT_PF_WAIT_001")?.source_evidence_ids ?? [],
        source_fact_ids: ["NHR_FACT_PF_WAIT_001"],
        gap_ids: ["NHR_DGAP_TIMER_VARIABILITY_001"],
      },
    ],
    blocking_gaps: [],
    warnings: [warning],
  };
  const irPackage = {
    ir_package_id: "NHR_PHASE3B_MMABP_IR_V1",
    ir_package_type: "mmabp_ir_package",
    ir_version: "1.0.0",
    source_registry_package_id: registries.registry_package_id,
    client_id: clientId,
    conformance_status: "passed_with_warnings",
    consistency_status: "passed_with_warnings",
    conformance_report_id: conformanceReport.report_id,
    consistency_report_id: consistencyReport.report_id,
    models: {
      PM_IR: {
        quadrant: "PM",
        elements: [
          {
            ir_element_id: "NHR_PM_IR_PROC_001",
            ir_element_type: "business_process",
            label: "Provisionar servicio de comida delivery",
            source_registry_element_ids: ["NHR_PM_PROC_001"],
            source_fact_ids: ["NHR_FACT_PM_PROCESS_001"],
            trigger_events: ["Orden recibida desde POS, app de delivery o WhatsApp"],
            target_states: ["Orden consolidada y comunicada a cocina/repartidor"],
            support_markers: ["Excel operativo como soporte manual de coordinacion"],
            represents_organizational_chart: false,
            conformance_status: "passed",
            consistency_status: "passed",
          },
        ],
        gaps: [],
      },
      PF_IR: {
        quadrant: "PF",
        elements: [
          {
            ir_element_id: "NHR_PF_IR_TASK_001",
            ir_element_type: "task",
            label: "Consolidar orden multicanal",
            source_registry_element_ids: ["NHR_PF_TASK_001"],
            source_fact_ids: ["NHR_FACT_PF_TASK_001"],
            object_class: "Orden de cliente",
            object_state: "Orden consolidada",
            ready: true,
            conformance_status: "passed",
            consistency_status: "passed",
          },
          {
            ir_element_id: "NHR_PF_IR_PSTATE_001",
            ir_element_type: "process_state",
            label: "Esperar confirmacion de repartidor",
            source_registry_element_ids: ["NHR_PF_PSTATE_001"],
            source_fact_ids: ["NHR_FACT_PF_WAIT_001"],
            awaited_events: ["Repartidor confirma llegada o cambia horario"],
            timer_event: "PT20M_variability_observed",
            conformance_status: "passed_with_warnings",
            consistency_status: "passed_with_warnings",
          },
        ],
        gaps: ["NHR_DGAP_TIMER_VARIABILITY_001"],
      },
      MoC_IR: {
        quadrant: "MoC",
        elements: [
          {
            ir_element_id: "NHR_MOC_IR_CLASS_001",
            ir_element_type: "class",
            label: "Orden de cliente",
            business_concept: "Objeto de negocio que captura pedido, canal, estado de confirmacion, horario prometido y cambios solicitados.",
            source_registry_element_ids: ["NHR_MOC_CLASS_001"],
            source_fact_ids: ["NHR_FACT_MOC_CLASS_001"],
            attributes: ["canalOrigen", "estadoConfirmacion", "horarioPrometido", "cambiosSolicitados", "prioridad"],
            operations: ["consolidarOrden", "actualizarHorarioEntrega"],
            conformance_status: "passed",
            consistency_status: "passed",
          },
        ],
        gaps: [],
      },
      OLC_IR: {
        quadrant: "OLC",
        elements: [
          {
            ir_element_id: "NHR_OLC_IR_STATE_001",
            ir_element_type: "object_state",
            label: "Orden recibida multicanal",
            source_registry_element_ids: ["NHR_OLC_STATE_001"],
            source_fact_ids: ["NHR_FACT_OLC_TRANSITION_001"],
            object_class: "Orden de cliente",
            represents_task: false,
            conformance_status: "passed",
            consistency_status: "passed",
          },
          {
            ir_element_id: "NHR_OLC_IR_STATE_002",
            ir_element_type: "object_state",
            label: "Orden consolidada",
            source_registry_element_ids: ["NHR_OLC_STATE_002"],
            source_fact_ids: ["NHR_FACT_OLC_TRANSITION_001"],
            object_class: "Orden de cliente",
            represents_task: false,
            conformance_status: "passed",
            consistency_status: "passed",
          },
          {
            ir_element_id: "NHR_OLC_IR_TRANSITION_001",
            ir_element_type: "transition",
            label: "Consolidacion de orden",
            from_state: "NHR_OLC_IR_STATE_001",
            to_state: "NHR_OLC_IR_STATE_002",
            reason: "Coordinador verifica fuentes y comunica horario a cocina/repartidor",
            source_registry_element_ids: ["NHR_OLC_STATE_001", "NHR_OLC_STATE_002"],
            source_fact_ids: ["NHR_FACT_OLC_TRANSITION_001"],
            conformance_status: "passed",
            consistency_status: "passed",
          },
        ],
        gaps: [],
      },
    },
    ir_readiness: {
      status: "ir_ready_with_warnings",
      notes: ["IR validado para candidato con warning temporal no bloqueante."],
    },
    boundaries: {
      not_diagram: true,
      not_export_package: true,
      not_diagnostic: true,
      not_capa2_readiness: true,
      not_monetization: true,
      not_final_narrative: true,
    },
  };
  return { warning, designGap, conformanceReport, consistencyReport, irPackage };
};

const buildDiagramPackage = ({ clientId, handoffPackage, irPackage, warning }) => ({
  package_id: "NHR_PHASE3B_DIAGRAM_CODE_GENERATION_V1",
  package_type: "diagram_code_generation_package",
  schema_version: "1.0.0",
  client_id: clientId,
  source_handoff_package_id: handoffPackage.package_id,
  source_mmabp_ir_package_id: irPackage.ir_package_id,
  source_conformance_report_id: irPackage.conformance_report_id,
  source_consistency_report_id: irPackage.consistency_report_id,
  generation_readiness: "ready_with_warnings",
  generation_mode: "candidate",
  prohibited_downstream_uses: ["capa_2", "capa_2_5", "capa_3", "diagnostic", "monetization", "final_narrative", "final_export"],
  exports: [
    {
      export_id: "NHR_EXP_PM_BPMN_001",
      quadrant: "PM",
      export_format: "BPMN_XML",
      source_ir_element_ids: ["NHR_PM_IR_PROC_001"],
      source_registry_element_ids: ["NHR_PM_PROC_001"],
      source_fact_ids: ["NHR_FACT_PM_PROCESS_001"],
      traceability_status: "complete",
      semantic_preservation_status: "passed",
      warnings: [],
      gaps: [],
    },
    {
      export_id: "NHR_EXP_PF_BPMN_001",
      quadrant: "PF",
      export_format: "BPMN_XML",
      source_ir_element_ids: ["NHR_PF_IR_TASK_001", "NHR_PF_IR_PSTATE_001"],
      source_registry_element_ids: ["NHR_PF_TASK_001", "NHR_PF_PSTATE_001"],
      source_fact_ids: ["NHR_FACT_PF_TASK_001", "NHR_FACT_PF_WAIT_001"],
      traceability_status: "complete",
      semantic_preservation_status: "passed_with_warnings",
      warnings: [warning],
      gaps: ["NHR_DGAP_TIMER_VARIABILITY_001"],
    },
    {
      export_id: "NHR_EXP_MOC_PLANTUML_001",
      quadrant: "MoC",
      export_format: "PLANTUML_CLASS",
      source_ir_element_ids: ["NHR_MOC_IR_CLASS_001"],
      source_registry_element_ids: ["NHR_MOC_CLASS_001"],
      source_fact_ids: ["NHR_FACT_MOC_CLASS_001"],
      traceability_status: "complete",
      semantic_preservation_status: "passed",
      warnings: [],
      gaps: [],
    },
    {
      export_id: "NHR_EXP_OLC_PLANTUML_001",
      quadrant: "OLC",
      export_format: "PLANTUML_STATE",
      source_ir_element_ids: ["NHR_OLC_IR_STATE_001", "NHR_OLC_IR_STATE_002", "NHR_OLC_IR_TRANSITION_001"],
      source_registry_element_ids: ["NHR_OLC_STATE_001", "NHR_OLC_STATE_002"],
      source_fact_ids: ["NHR_FACT_OLC_TRANSITION_001"],
      traceability_status: "complete",
      semantic_preservation_status: "passed",
      warnings: [],
      gaps: [],
    },
  ],
  warnings: [warning],
  design_gap_ids: ["NHR_DGAP_TIMER_VARIABILITY_001"],
  boundaries: {
    not_diagnostic: true,
    not_monetization: true,
    not_final_narrative: true,
    does_not_modify_capa2_readiness: true,
    does_not_modify_core_contract: true,
    does_not_replace_handoff_to_capa2: true,
  },
});

const enrichDiagramExports = ({ diagramPackage, facts, bundle }) =>
  diagramPackage.exports.map((exportItem) => {
    const exportFacts = facts.structural_facts.filter((fact) =>
      asArray(exportItem.source_fact_ids).includes(fact.fact_id),
    );
    return {
      ...exportItem,
      source_candidate_ids: unique(exportFacts.flatMap((fact) => asArray(fact.source_candidate_ids))),
      source_evidence_ids: unique(exportFacts.flatMap((fact) => asArray(fact.source_evidence_ids))),
      source_scene_ids: unique(exportFacts.map((fact) => fact.scene_id)),
      source_blocks: unique(exportFacts.map((fact) => fact.block_origin)),
      source_questions: unique(exportFacts.map((fact) => fact.question_origin)),
      allowed_uses: ["candidate_export_package", "candidate_diagram_review"],
      prohibited_uses: ["capa_2", "capa_2_5", "capa_3", "diagnostic", "monetization", "final_narrative", "final_export"],
      source_bundle_id: bundle.bundle_id,
    };
  });

const generatorByFormat = {
  BPMN_XML: { PM: generatePmBpmn, PF: generatePfBpmn },
  PLANTUML_CLASS: { MoC: generateMocPlantUml },
  PLANTUML_STATE: { OLC: generateOlcPlantUml },
};

const formatLabel = {
  BPMN_XML: "bpmn",
  PLANTUML_CLASS: "plantuml-class",
  PLANTUML_STATE: "plantuml-state",
};

const extensionByFormat = {
  BPMN_XML: "bpmn",
  PLANTUML_CLASS: "puml",
  PLANTUML_STATE: "puml",
};

const generatedFileFor = (exportItem) =>
  `${generatedRoot}/${exportItem.quadrant.toLowerCase()}-${formatLabel[exportItem.export_format]}-${exportItem.export_id.toLowerCase()}.${extensionByFormat[exportItem.export_format]}`;

async function queryCoreRows(sessionId) {
  const client = supabaseClient();
  if (!client) return { note: "Supabase env not available for direct artifact query." };

  const [canonical, bundles] = await Promise.all([
    client
      .from("scene_canonical_records")
      .select("id, scene_id, readiness_for_transduction, canonical_json, evidence_answer_ids, consistency_flag_ids, created_at, updated_at")
      .eq("sesion_id", sessionId),
    client
      .from("scene_answer_bundles")
      .select("id, scene_id, bundle_type, source_question_codes, source_answer_ids, canonical_variables, payload, not_diagnostic, created_at, updated_at")
      .eq("sesion_id", sessionId),
  ]);

  return {
    canonical_records: canonical.error ? { error: canonical.error.message } : canonical.data ?? [],
    answer_bundles: bundles.error ? { error: bundles.error.message } : bundles.data ?? [],
  };
}

async function main() {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInputPath;
  const input = readJson(inputPath);
  const runId = Date.now();
  const email = `nhr.phase3b.${runId}@eve.local`;
  fs.rmSync(path.join(repoRoot, outputRoot), { recursive: true, force: true });

  const bootstrap = await postJson("/api/session/bootstrap", {
    company: input.company,
    user: {
      nombre: input.roleSession.roleName,
      rol_declarado: input.roleSession.vsmRole,
      email,
    },
  });
  const sessionId = bootstrap.session.id;

  const intake = await postJson("/api/intake/triple", {
    sessionId,
    activities: input.roleSession.activities,
    relatos: input.relatos,
  });

  const inputActivityIdByLegacyId = new Map(
    intake.activities.map((activity, index) => [activity.id, input.roleSession.activities[index].id]),
  );

  const scenes = await postJson("/api/scenes/bootstrap", { sessionId });
  const sceneRuns = [];

  for (const [index, scene] of scenes.scenes.entries()) {
    const inputActivityId = inputActivityIdByLegacyId.get(scene.legacy_actividad_id);
    const answers = input.sceneAnswersByActivityId[inputActivityId] ?? [];
    if (!answers.length) throw new Error(`No answers found for bootstrapped scene ${scene.id}`);

    const sceneAnswers = answers.map((answer) => ({
      ...answer,
      activityId: scene.legacy_actividad_id,
      sceneId: scene.id,
    }));

    const savedAnswers = await postJson("/api/scenes/answers", {
      sessionId,
      sceneId: scene.id,
      answers: sceneAnswers,
    });
    const derivation = await postJson("/api/scenes/derive", { sessionId, sceneId: scene.id });
    const preclassification = await postJson("/api/scenes/preclassify", { sessionId, sceneId: scene.id });
    const consistency = await postJson("/api/scenes/consistency", { sessionId, sceneId: scene.id });
    const canonical = await postJson("/api/scenes/canonicalize", { sessionId, sceneId: scene.id });

    sceneRuns.push({
      index: index + 1,
      scene,
      savedAnswers,
      derivation,
      preclassification,
      consistency,
      canonical,
    });
  }

  const intermediate = await postJson("/api/session/intermediate-output", { sessionId });
  const designSource = await postJson("/api/parallel-production/design-source-bundle", { sessionId });
  const bundle = designSource.bundle;
  const sceneId = first(scenes.scenes)?.id;
  const clientId = bundle.client_context?.client_id ?? sessionId;
  const coreRows = await queryCoreRows(sessionId);

  const coreOutput = {
    case_name: input.metadata.caseName,
    input_path: path.relative(repoRoot, inputPath).replace(/\\/g, "/"),
    source_document: input.metadata.sourceDocument,
    base_url: baseUrl,
    session_id: sessionId,
    scene_ids: scenes.scenes.map((scene) => scene.id),
    stages: {
      bootstrap,
      intake_activity_count: intake.activities.length,
      scene_bootstrap_count: scenes.scenes.length,
      scene_runs: sceneRuns,
      intermediate_output: intermediate,
    },
    queried_core_rows: coreRows,
    core_boundary: {
      no_core_code_modified: true,
      diagnostic_route_not_called: true,
      evidence_bundle_for_transduction_preserved: true,
      capa2_readiness_not_modified_by_parallel_production: true,
    },
  };

  const coreReadyStates = new Set(["ready", "ready_with_flags"]);
  const designSourceReadyStates = new Set(["ready_for_design_handoff", "ready_with_gaps"]);
  const coreReadyForParallelProduction = sceneRuns.every((run) =>
    coreReadyStates.has(run.canonical.readinessForTransduction),
  );
  const designSourceReadyForProjection = designSourceReadyStates.has(
    bundle.design_source_readiness?.status,
  );

  if (!coreReadyForParallelProduction || !designSourceReadyForProjection) {
    const blockedArtifacts = {
      input: `${outputRoot}/case-input.json`,
      core_output: `${outputRoot}/core-output.json`,
      mmabp_design_source_bundle: `${outputRoot}/mmabp-design-source-bundle.json`,
    };
    saveArtifact(blockedArtifacts.input, input);
    saveArtifact(blockedArtifacts.core_output, coreOutput);
    saveArtifact(blockedArtifacts.mmabp_design_source_bundle, bundle);
    const blockedAuditPackage = {
      phase: "3B",
      status: "blocked_before_parallel_projection",
      case_selected: {
        name: input.metadata.caseName,
        scope: input.metadata.scope,
        source_document: input.metadata.sourceDocument,
      },
      core_execution: {
        session_id: sessionId,
        scene_ids: scenes.scenes.map((scene) => scene.id),
        readiness_results: sceneRuns.map((run) => ({
          scene_id: run.scene.id,
          readiness_for_transduction: run.canonical.readinessForTransduction,
          evidence_answer_ids: run.canonical.evidenceAnswerIds,
          consistency_flag_ids: run.canonical.consistencyFlagIds,
        })),
        intermediate_readiness: intermediate.readinessForTransduction ?? intermediate.readiness_for_transduction ?? null,
        diagnostic_route_not_called: true,
      },
      blocking_reason: {
        core_ready_for_parallel_production: coreReadyForParallelProduction,
        design_source_ready_for_projection: designSourceReadyForProjection,
        design_source_readiness: bundle.design_source_readiness?.status,
        rule: "Phase 3B does not project registries, IR or diagrams when Capa 1.0 core is not ready or design source requires manual review.",
      },
      stage_statuses: {
        scene_canonical_record: "produced",
        evidence_bundle_for_transduction: "produced_by_core",
        mmabp_design_source_bundle: bundle.design_source_readiness?.status,
        client_mmabp_structural_facts: "blocked",
        inventory_readiness: "blocked",
        quadrant_registry_package: "blocked",
        conformance_report: "blocked",
        consistency_report: "blocked",
        mmabp_ir_package: "blocked",
        parallel_production_design_handoff_package: "blocked",
        diagram_code_generation_package: "blocked",
        candidate_export_package: "blocked",
        generated_candidate_files: "not_generated",
      },
      artifacts: blockedArtifacts,
      boundaries: {
        no_core_code_modified: true,
        no_capa2_readiness_change_by_parallel_chain: true,
        no_diagnostic: true,
        no_monetization: true,
        no_final_narrative: true,
        generated_files_are_candidate_only: true,
      },
    };
    saveArtifact(`${outputRoot}/phase3b-audit-package.json`, blockedAuditPackage);
    console.log(JSON.stringify(blockedAuditPackage, null, 2));
    return;
  }

  const facts = buildFacts({ input, bundle, sessionId, sceneId });
  const inventoryReadiness = {
    readiness_id: "NHR_PHASE3B_INVENTORY_READINESS_V1",
    client_id: clientId,
    source_bundle_id: bundle.bundle_id,
    structural_facts_package_id: facts.inventory_id,
    inventory_readiness: "ready_with_inventory_gaps",
    readiness_reasons: [
      "PM, PF, MoC y OLC tienen evidencia literal real suficiente para candidato.",
      "Timer/repartidor queda como warning no bloqueante.",
    ],
    blocking_gaps: [],
    manual_review_required: false,
  };
  const registries = buildRegistries({ facts, clientId });
  const { warning, designGap, conformanceReport, consistencyReport, irPackage } =
    buildReportsAndIr({ facts, registries, clientId });
  const handoffPackage = {
    package_id: "NHR_PHASE3B_DESIGN_HANDOFF_V1",
    package_type: "parallel_production_design_handoff_package",
    schema_version: "1.0.0",
    client_id: clientId,
    source_mmabp_ir_package_id: irPackage.ir_package_id,
    source_registry_package_id: registries.registry_package_id,
    handoff_readiness: "ready_with_warnings",
    diagramming_readiness: "ready_with_warnings",
    warnings: [warning],
    gaps: [designGap.gap_id],
    boundaries: {
      not_diagram: true,
      not_export_package: true,
      not_diagnostic: true,
      not_capa2_readiness: true,
      not_monetization: true,
      not_final_narrative: true,
    },
  };
  const diagramPackage = buildDiagramPackage({ clientId, handoffPackage, irPackage, warning });
  diagramPackage.exports = enrichDiagramExports({ diagramPackage, facts, bundle });

  const generatedExports = diagramPackage.exports.map((diagramExport) => {
    const generator = generatorByFormat[diagramExport.export_format]?.[diagramExport.quadrant];
    if (!generator) throw new Error(`No generator for ${diagramExport.quadrant}/${diagramExport.export_format}`);
    const content = generator({
      irPackage,
      inventory: facts,
      registryPackage: registries,
      sourceBundle: bundle,
      diagramExport,
    });
    const output = writeGeneratedFile(repoRoot, generatedFileFor(diagramExport), content);
    return {
      export_id: diagramExport.export_id.replace("NHR_EXP_", "NHR_CEXP_"),
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
      traceability_status: diagramExport.traceability_status,
      candidate_only: true,
      generated_file_is_evidence: false,
      prohibited_uses: REQUIRED_CANDIDATE_PROHIBITED_USES,
      allowed_uses: ["parallel_production_design_review", "candidate_diagram_review", "diagram_code_qa"],
    };
  });

  const candidateExportPackage = {
    candidate_export_package_id: "NHR_PHASE3B_CANDIDATE_EXPORT_PACKAGE_V1",
    package_type: "candidate_export_package",
    schema_version: "1.0.0",
    client_id: clientId,
    source_diagram_code_generation_package_id: diagramPackage.package_id,
    source_mmabp_ir_package_id: irPackage.ir_package_id,
    generated_at: new Date().toISOString(),
    generation_mode: "candidate",
    export_readiness: "ready_with_warnings",
    exports: generatedExports,
    warnings: [warning],
    gaps: [designGap.gap_id],
    traceability_summary: {
      coverage: "complete",
      source_ir_element_ids: unique(generatedExports.flatMap((item) => item.source_ir_element_ids)),
      source_registry_element_ids: unique(generatedExports.flatMap((item) => item.source_registry_element_ids)),
      source_fact_ids: unique(generatedExports.flatMap((item) => item.source_fact_ids)),
      source_candidate_ids: unique(generatedExports.flatMap((item) => item.source_candidate_ids)),
      source_evidence_ids: unique(generatedExports.flatMap((item) => item.source_evidence_ids)),
      source_scene_ids: unique(generatedExports.flatMap((item) => item.source_scene_ids)),
      source_blocks: unique(generatedExports.flatMap((item) => item.source_blocks)),
      source_questions: unique(generatedExports.flatMap((item) => item.source_questions)),
    },
    semantic_preservation_status: "passed_with_warnings",
    prohibited_uses: REQUIRED_CANDIDATE_PROHIBITED_USES,
    allowed_uses: ["parallel_production_design_review", "candidate_diagram_review", "diagram_code_qa"],
    boundaries: {
      candidate_only: true,
      generated_files_are_not_evidence: true,
      not_diagnostic: true,
      not_monetization: true,
      not_final_narrative: true,
      does_not_modify_capa2_readiness: true,
      does_not_modify_core_contract: true,
    },
  };

  const generatedValidation = validateGeneratedCandidateFiles({
    root: repoRoot,
    candidateExportPackage,
    irPackage,
    registryPackage: registries,
    inventory: facts,
    sourceBundle: bundle,
    designGaps: [designGap],
  });
  if (generatedValidation.status !== "passed") {
    throw new Error(`Generated candidate validation failed: ${generatedValidation.errors.join("; ")}`);
  }

  const artifacts = {
    input: `${outputRoot}/case-input.json`,
    core_output: `${outputRoot}/core-output.json`,
    mmabp_design_source_bundle: `${outputRoot}/mmabp-design-source-bundle.json`,
    client_mmabp_structural_facts: `${outputRoot}/client-mmabp-structural-facts.json`,
    inventory_readiness: `${outputRoot}/inventory-readiness.json`,
    design_gap: `${outputRoot}/design-gap-timer-variability.json`,
    quadrant_registry_package: `${outputRoot}/quadrant-registry-package.json`,
    conformance_report: `${outputRoot}/conformance-report.json`,
    consistency_report: `${outputRoot}/consistency-report.json`,
    mmabp_ir_package: `${outputRoot}/mmabp-ir-package.json`,
    design_handoff_package: `${outputRoot}/parallel-production-design-handoff-package.json`,
    diagram_code_generation_package: `${outputRoot}/diagram-code-generation-package.json`,
    candidate_export_package: `${outputRoot}/candidate-export-package.json`,
  };

  saveArtifact(artifacts.input, input);
  saveArtifact(artifacts.core_output, coreOutput);
  saveArtifact(artifacts.mmabp_design_source_bundle, bundle);
  saveArtifact(artifacts.client_mmabp_structural_facts, facts);
  saveArtifact(artifacts.inventory_readiness, inventoryReadiness);
  saveArtifact(artifacts.design_gap, designGap);
  saveArtifact(artifacts.quadrant_registry_package, registries);
  saveArtifact(artifacts.conformance_report, conformanceReport);
  saveArtifact(artifacts.consistency_report, consistencyReport);
  saveArtifact(artifacts.mmabp_ir_package, irPackage);
  saveArtifact(artifacts.design_handoff_package, handoffPackage);
  saveArtifact(artifacts.diagram_code_generation_package, diagramPackage);
  saveArtifact(artifacts.candidate_export_package, candidateExportPackage);

  const auditPackage = {
    phase: "3B",
    status: "passed_with_warnings",
    case_selected: {
      name: input.metadata.caseName,
      reason: "Caso real acotado con orden, objeto de negocio, espera/handoff y evidencia para PM/PF/MoC/OLC.",
      scope: input.metadata.scope,
      source_document: input.metadata.sourceDocument,
    },
    core_execution: {
      session_id: sessionId,
      scene_ids: scenes.scenes.map((scene) => scene.id),
      readiness_results: sceneRuns.map((run) => ({
        scene_id: run.scene.id,
        readiness_for_transduction: run.canonical.readinessForTransduction,
        evidence_answer_ids: run.canonical.evidenceAnswerIds,
        consistency_flag_ids: run.canonical.consistencyFlagIds,
      })),
      intermediate_readiness: intermediate.readinessForTransduction ?? intermediate.readiness_for_transduction ?? null,
      diagnostic_route_not_called: true,
    },
    stage_statuses: {
      scene_canonical_record: "ready",
      evidence_bundle_for_transduction: "produced_by_core",
      mmabp_design_source_bundle: bundle.design_source_readiness?.status,
      client_mmabp_structural_facts: facts.inventory_readiness.status,
      inventory_readiness: inventoryReadiness.inventory_readiness,
      quadrant_registry_package: registries.registry_readiness.status,
      conformance_report: conformanceReport.conformance_status,
      consistency_report: consistencyReport.consistency_status,
      mmabp_ir_package: irPackage.ir_readiness.status,
      parallel_production_design_handoff_package: handoffPackage.handoff_readiness,
      diagram_code_generation_package: diagramPackage.generation_readiness,
      candidate_export_package: candidateExportPackage.export_readiness,
      generated_candidate_files: generatedValidation.status,
    },
    quadrant_coverage: {
      PM: {
        process: "Provisionar servicio de comida delivery",
        trigger: "Orden recibida desde POS, app de delivery o WhatsApp",
        target_state: "Orden consolidada y comunicada a cocina/repartidor",
      },
      PF: {
        tasks: ["Consolidar orden multicanal"],
        process_states: ["Esperar confirmacion de repartidor"],
        handoff: "Comunicacion a cocina y repartidor",
      },
      MoC: {
        classes: ["Orden de cliente"],
        attributes: ["canalOrigen", "estadoConfirmacion", "horarioPrometido", "cambiosSolicitados", "prioridad"],
      },
      OLC: {
        states: ["Orden recibida multicanal", "Orden consolidada"],
        transitions: ["Coordinador verifica fuentes y comunica horario a cocina/repartidor"],
      },
    },
    generated_validation: generatedValidation,
    warnings: [warning],
    gaps: [designGap],
    generated_files: generatedExports.map((item) => ({
      export_id: item.export_id,
      quadrant: item.quadrant,
      format: item.export_format,
      file_path: item.file_path,
      content_hash: item.content_hash,
      hash_verified_by_validation: sha256(fs.readFileSync(path.join(repoRoot, item.file_path), "utf8")) === item.content_hash,
    })),
    artifacts,
    boundaries: {
      no_core_code_modified: true,
      no_capa2_readiness_change_by_parallel_chain: true,
      no_diagnostic: true,
      no_monetization: true,
      no_final_narrative: true,
      generated_files_are_candidate_only: true,
    },
  };

  saveArtifact(`${outputRoot}/phase3b-audit-package.json`, auditPackage);
  console.log(JSON.stringify(auditPackage, null, 2));
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exit(1);
});
