import { supabaseServer } from "@/lib/supabase-server";
import {
  buildMbaComplianceReport,
  createMbaServiceRoleSupabaseClient,
  createMbaEventLedger,
  createMbaTimerLedger,
  observeCapa1Outputs,
  observeParallelProductionOutputs,
} from "./index.mjs";
import { persistMbaControlPlaneState } from "./supabase-persistence.mjs";

const parseJson = (value) => {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const first = (value) => (Array.isArray(value) ? value[0] : value);

async function loadCanonicalRecord({ sessionId, sceneId, canonicalRecordId }) {
  let query = supabaseServer
    .from("scene_canonical_records")
    .select("id, scene_id, canonical_json, evidence_answer_ids, consistency_flag_ids, readiness_for_transduction");

  if (canonicalRecordId) query = query.eq("id", canonicalRecordId);
  else {
    query = query.eq("sesion_id", sessionId);
    if (sceneId) query = query.eq("scene_id", sceneId);
  }

  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);
  const row = first(data);
  if (!row) return null;
  const canonical = parseJson(row.canonical_json);

  return {
    id: row.id,
    scene_id: row.scene_id,
    evidence_answer_ids: row.evidence_answer_ids ?? [],
    traceability: canonical.traceability ?? {
      evidenceAnswerIds: row.evidence_answer_ids ?? [],
      derivationIds: [],
      consistencyFlagIds: row.consistency_flag_ids ?? [],
    },
    gaps: canonical.gaps ?? [],
    flags: canonical.consistency?.flags ?? [],
    readiness_for_transduction: row.readiness_for_transduction,
    canonical_json: canonical,
  };
}

async function loadSessionIntermediateOutput(sessionId) {
  const { data, error } = await supabaseServer
    .from("session_intermediate_output")
    .select("id, output_json, readiness_for_transduction")
    .eq("sesion_id", sessionId)
    .order("generated_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return first(data) ?? null;
}

async function observeAndPersist({ caseId, sessionId, capa1, parallelProduction }) {
  const ledger = createMbaEventLedger({ env: process.env });
  const timerLedger = createMbaTimerLedger();
  const capa1Result = capa1
    ? observeCapa1Outputs(
        {
          ...capa1,
          case_id: caseId ?? sessionId,
          session_id: sessionId,
        },
        { ledger, timerLedger },
      )
    : { findings: [], hard_gate_candidates: [] };
  const parallelResult = parallelProduction
    ? observeParallelProductionOutputs(
        {
          ...parallelProduction,
          case_id: caseId ?? sessionId,
          session_id: sessionId,
        },
        { ledger, timerLedger },
      )
    : { findings: [], hard_gate_candidates: [] };
  const report = buildMbaComplianceReport({
    case_id: caseId ?? sessionId,
    ledger,
    timerLedger,
    hard_gate_candidates: [
      ...(capa1Result.hard_gate_candidates ?? []),
      ...(parallelResult.hard_gate_candidates ?? []),
    ],
    extra_findings: [...(capa1Result.findings ?? []), ...(parallelResult.findings ?? [])],
  });
  const serviceRole = createMbaServiceRoleSupabaseClient(process.env);
  const persistence = await persistMbaControlPlaneState({
    supabase: serviceRole.client,
    ledger,
    timerLedger,
    report,
    extraFindings: [...(capa1Result.findings ?? []), ...(parallelResult.findings ?? [])],
    missingClientContext: serviceRole.client
      ? null
      : {
          error_code: serviceRole.error_code,
          error_message: serviceRole.error_message,
          table_name: null,
        },
  });
  if (!persistence.persisted) {
    console.warn(
      `[mba_shadow_persistence] ${persistence.error_code}: ${persistence.error_message} (${persistence.table_name ?? "no_table"})`,
    );
  }

  return { report, persistence };
}

export async function observeSceneCanonicalizationShadow({ sessionId, sceneId, result }) {
  const sceneCanonicalRecord = await loadCanonicalRecord({
    sessionId,
    sceneId,
    canonicalRecordId: result?.canonicalRecordId,
  });
  if (!sceneCanonicalRecord) return { skipped: true, reason: "scene_canonical_record_not_found" };

  return observeAndPersist({
    caseId: sessionId,
    sessionId,
    capa1: {
      scene_canonical_record: sceneCanonicalRecord,
      gaps: sceneCanonicalRecord.gaps,
      flags: sceneCanonicalRecord.flags,
      technical_actor: "scene_canonicalize_route",
    },
  });
}

export async function observeSessionIntermediateOutputShadow({ sessionId, result }) {
  const outputRow = await loadSessionIntermediateOutput(sessionId);
  const output = parseJson(outputRow?.output_json);
  const canonicalRecordIds = output.traceability?.canonicalRecordIds ?? [];
  const generatedFromSceneIds = output.traceability?.generatedFromSceneIds ?? result?.generatedFromSceneIds ?? [];
  const sceneCanonicalRecord = {
    id: canonicalRecordIds[0] ?? `SCR:${sessionId}`,
    scene_id: generatedFromSceneIds[0] ?? `SCENE:${sessionId}`,
    evidence_answer_ids: output.traceability?.evidenceAnswerIds ?? [],
    traceability: {
      evidenceAnswerIds: output.traceability?.evidenceAnswerIds ?? [],
      derivationIds: output.traceability?.derivationIds ?? [],
      consistencyFlagIds: output.traceability?.consistencyFlagIds ?? [],
    },
    gaps: output.gaps ?? [],
    flags: output.validations?.warnings ?? [],
  };
  const hasEvidenceBundle = (output.evidence_bundle_summary ?? []).some(
    (item) => item.hasEvidenceBundle,
  );
  const evidenceBundle =
    hasEvidenceBundle && result?.readinessForTransduction === "ready"
      ? {
          id: `EvidenceBundle:${sessionId}`,
          bundle_type: "evidence_bundle_for_transduction",
          source_output_id: outputRow?.id ?? result?.outputId,
        }
      : null;

  return observeAndPersist({
    caseId: sessionId,
    sessionId,
    capa1: {
      scene_canonical_record: sceneCanonicalRecord,
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: Boolean(result?.sessionReadyForTransduction),
      gaps: output.gaps ?? [],
      flags: output.validations?.warnings ?? [],
      technical_actor: "session_intermediate_output_route",
    },
  });
}

export async function observeParallelProductionShadow({ sessionId, result }) {
  return observeAndPersist({
    caseId: sessionId,
    sessionId,
    parallelProduction: {
      mmabp_design_source_bundle: result?.bundle,
      technical_actor: "parallel_production_design_source_bundle_route",
    },
  });
}

export async function observeParallelProductionRuntimeShadow({
  sessionId,
  caseId,
  result,
  technicalActor = "parallel_production_runtime_route",
}) {
  return observeAndPersist({
    caseId: caseId ?? sessionId,
    sessionId,
    parallelProduction: {
      mmabp_design_source_bundle: result?.bundle ?? null,
      InventarioMMABP:
        result?.inventory ??
        (result?.inventory_id
          ? {
              inventory_id: result.inventory_id,
              structural_facts: result.structural_facts ?? [],
              warnings: result.semantic_warnings ?? [],
              gaps: result.gaps ?? [],
            }
          : null),
      MMABPIR:
        result?.mmabp_ir ??
        (result?.mmabp_ir_id
          ? {
              ir_package_id: result.mmabp_ir_id,
              models: result.registry_candidates ?? {},
              warnings: result.ir_warnings ?? [],
              gaps: result.gaps ?? [],
            }
          : null),
      ArchitectureConsistencyAssessment:
        result?.assessment ??
        (result?.assessment_id
          ? {
              assessment_id: result.assessment_id,
              assessment_status: result.assessment_status,
              findings: result.findings ?? [],
              warnings: [
                ...(result.conformance_warnings ?? []),
                ...(result.consistency_warnings ?? []),
              ],
            }
          : null),
      candidate_export_package:
        result?.candidate_export_package ?? result?.candidateExportPackage ?? null,
      allow_export_promotion: result?.allow_export_promotion ?? false,
      syntax_validation_passed: result?.syntax_validation_passed ?? false,
      technical_actor: technicalActor,
    },
  });
}

export async function runMbaShadowSafely(task, label = "mba_shadow_observer") {
  try {
    return await task();
  } catch (error) {
    console.warn(
      `[${label}] ${error instanceof Error ? error.message : "MBA shadow observation failed"}`,
    );
    return {
      skipped: true,
      error: error instanceof Error ? error.message : "MBA shadow observation failed",
    };
  }
}
