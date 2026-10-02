import manifest from "@/runtime/capa-1-v2-1-runtime-manifest.json";
import platformContract from "@/runtime/platform-consumption-contract.json";
import { supabaseServer } from "@/lib/supabase-server";
import { CAPA1_V2_1_INSTRUMENT_VERSION } from "@/domain/canonical-variables";

type SceneCanonicalRecordRow = {
  id: string;
  scene_id: string;
  canonical_json: unknown;
  evidence_answer_ids: string[] | null;
  readiness_for_transduction: string | null;
  created_at: string;
  updated_at: string;
};

type SessionRow = {
  id: string;
  usuario_id: string;
};

type UserRow = {
  id: string;
  empresa_id: string | null;
  nombre: string | null;
  rol_declarado: string | null;
};

type CompanyRow = {
  id: string;
  nombre: string | null;
  sector: string | null;
};

type CanonicalVariableEntry = {
  value?: unknown;
  evidenceAnswerIds?: string[];
  sourceQuestionCode?: string | null;
  derivationId?: string | null;
};

type CanonicalJson = {
  sceneMetadata?: {
    sceneId?: string;
    sessionId?: string;
    sceneName?: string;
    sceneRank?: number | null;
    depthLevel?: string;
    sceneStatus?: string;
  };
  evidence?: {
    answers?: Array<{
      id?: string;
      blockId?: string;
      questionCode?: string;
      answerType?: string;
      selectedValue?: string | null;
      selectedValues?: string[] | null;
      freeText?: string | null;
      answerJson?: unknown;
      isUserVisible?: boolean;
    }>;
  };
  provenance?: Array<{
    answerId?: string | null;
    provenanceType?: string | null;
  }>;
  canonicalVariablesByBlock?: Record<
    string,
    Record<string, CanonicalVariableEntry>
  >;
  gaps?: Array<{
    source?: string;
    code?: string;
    severity?: string;
    message?: string;
  }>;
  lightInference?: {
    confidenceScore?: number | null;
  } | null;
  traceability?: {
    evidenceAnswerIds?: string[];
  };
  readiness?: {
    recommendedStatus?: string;
    requiresManualReview?: boolean;
    gapCount?: number;
  };
};

type CanonicalEvidenceAnswer = NonNullable<
  NonNullable<CanonicalJson["evidence"]>["answers"]
>[number];

type BuildMmabpDesignSourceBundleInput = {
  sessionId: string;
};

type Quadrant = "PM" | "PF" | "MoC" | "OLC";

const variableQuadrants: Record<string, Quadrant[]> = {
  scene_macro_process: ["PM"],
  scene_enabled_milestone: ["PM"],
  beneficiario_final_0_5_1: ["PM"],
  afectado_final_0_5_1a: ["PM"],
  receiver_immediate: ["PM", "PF"],
  trigger_source: ["PF"],
  trigger_preconditions: ["PF"],
  dependency_previous: ["PF"],
  dependency_next: ["PF"],
  delivery_channel: ["PF"],
  delivery_failure_exists: ["PF"],
  flow_deviation_frequency: ["PF"],
  bottleneck_type: ["PF"],
  workaround_used: ["PF"],
  receiver_feedback: ["PF"],
  retrabajo_presente: ["PF", "OLC"],
  objeto_tipo: ["MoC"],
  sujeto_tipo: ["MoC"],
  accion_tipo: ["MoC"],
  dimension_dominante: ["MoC"],
  atributos_objeto_cambian: ["MoC"],
  atributos_sujeto_cambian: ["MoC"],
  atributos_accion_cambian: ["MoC"],
  transformation_state_initial: ["OLC"],
  transformation_state_final: ["OLC"],
  transformation_iterations: ["OLC"],
  transformation_exception_exists: ["OLC"],
  transformation_exception_type: ["OLC"],
  transformation_hidden_changes: ["OLC"],
};

const variableCandidateType: Record<string, string> = {
  scene_macro_process: "business_process",
  scene_enabled_milestone: "target_state",
  beneficiario_final_0_5_1: "relationship",
  afectado_final_0_5_1a: "relationship",
  receiver_immediate: "handoff",
  trigger_source: "trigger_event",
  trigger_preconditions: "relationship",
  dependency_previous: "relationship",
  dependency_next: "relationship",
  delivery_channel: "handoff",
  delivery_failure_exists: "consistency_flag",
  flow_deviation_frequency: "process_state",
  bottleneck_type: "process_state",
  workaround_used: "workaround",
  receiver_feedback: "relationship",
  retrabajo_presente: "self_loop",
  objeto_tipo: "object_class",
  sujeto_tipo: "object_class",
  accion_tipo: "operation",
  dimension_dominante: "attribute",
  atributos_objeto_cambian: "attribute",
  atributos_sujeto_cambian: "attribute",
  atributos_accion_cambian: "attribute",
  transformation_state_initial: "object_state",
  transformation_state_final: "object_state",
  transformation_iterations: "self_loop",
  transformation_exception_exists: "gateway",
  transformation_exception_type: "gateway",
  transformation_hidden_changes: "transition",
};

const parseCanonicalJson = (value: unknown): CanonicalJson => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as CanonicalJson;
    } catch {
      return {};
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as CanonicalJson;
  }

  return {};
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

const valueText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const firstMeaningfulAnswerValue = (
  answer: CanonicalEvidenceAnswer,
) =>
  valueText(
    answer.freeText ??
      answer.selectedValue ??
      answer.selectedValues ??
      answer.answerJson ??
      "",
  );

const stableId = (...parts: Array<string | number | null | undefined>) =>
  parts
    .map((part) => String(part ?? "NA").replace(/[^a-zA-Z0-9]+/g, "_"))
    .join("_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 120);

const blockOrigin = (blockId: string | undefined, questionCode: string | undefined) => {
  if (blockId?.startsWith("block_")) return blockId;
  const firstSegment = questionCode?.split(".")[0];
  return `block_${firstSegment ?? "unknown"}`;
};

const evidenceIdsForScene = (
  evidence: Array<{ evidence_id: string; scene_id: string }>,
  sceneId: string,
) => evidence.filter((item) => item.scene_id === sceneId).map((item) => item.evidence_id);

const sourceSceneReadiness = (record: SceneCanonicalRecordRow, canonical: CanonicalJson) =>
  canonical.readiness?.recommendedStatus ??
  (record.readiness_for_transduction === "ready" ||
  record.readiness_for_transduction === "ready_with_flags"
    ? "ready_for_transduction"
    : "insufficient_evidence");

const designReadinessStatus = (
  records: SceneCanonicalRecordRow[],
  canonicals: CanonicalJson[],
  candidateCount: number,
) => {
  if (!records.length || candidateCount === 0) return "blocked_by_missing_evidence";
  if (canonicals.some((item) => item.readiness?.requiresManualReview)) {
    return "manual_review_required";
  }
  if (
    canonicals.some((item) =>
      (item.gaps ?? []).some((gap) => gap.severity === "critical"),
    )
  ) {
    return "blocked_by_contradiction";
  }
  if (canonicals.some((item) => (item.gaps ?? []).length > 0)) {
    return "ready_with_gaps";
  }
  if (
    records.every((record) =>
      ["ready", "ready_with_flags"].includes(
        String(record.readiness_for_transduction ?? ""),
      ),
    )
  ) {
    return "ready_for_design_handoff";
  }
  return "partial_design_source";
};

async function loadClientContext(sessionId: string) {
  const { data: session, error: sessionError } = await supabaseServer
    .from("sesiones_llenado")
    .select("id, usuario_id")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "No existe la sesion indicada.");
  }

  const sessionRow = session as unknown as SessionRow;
  const { data: user, error: userError } = await supabaseServer
    .from("usuarios")
    .select("id, empresa_id, nombre, rol_declarado")
    .eq("id", sessionRow.usuario_id)
    .single();

  if (userError || !user) {
    throw new Error(userError?.message ?? "No existe el usuario de la sesion.");
  }

  const userRow = user as unknown as UserRow;
  const { data: company, error: companyError } = userRow.empresa_id
    ? await supabaseServer
        .from("empresas")
        .select("id, nombre, sector")
        .eq("id", userRow.empresa_id)
        .single()
    : { data: null, error: null };

  if (companyError) throw new Error(companyError.message);

  const companyRow = (company ?? null) as CompanyRow | null;

  return {
    user: userRow,
    company: companyRow,
    clientContext: {
      client_id: companyRow?.id ?? userRow.empresa_id ?? sessionId,
      client_name: companyRow?.nombre ?? "Cliente sin nombre",
      client_sector: companyRow?.sector ?? null,
      analysis_unit: "sistema_operativo_cliente",
      capture_scope: "escenas_reguladas_capa_1_core",
    },
  };
}

export async function buildMmabpDesignSourceBundle({
  sessionId,
}: BuildMmabpDesignSourceBundleInput) {
  const [{ user, clientContext }, canonicalResult] = await Promise.all([
    loadClientContext(sessionId),
    supabaseServer
      .from("scene_canonical_records")
      .select(
        "id, scene_id, canonical_json, evidence_answer_ids, readiness_for_transduction, created_at, updated_at",
      )
      .eq("sesion_id", sessionId)
      .eq("instrument_version", CAPA1_V2_1_INSTRUMENT_VERSION)
      .order("created_at", { ascending: true }),
  ]);

  if (canonicalResult.error) throw new Error(canonicalResult.error.message);

  const records = (canonicalResult.data ?? []) as unknown as SceneCanonicalRecordRow[];
  if (!records.length) {
    throw new Error(
      "No existen scene_canonical_records para generar el handoff lateral.",
    );
  }

  const canonicals = records.map((record) => parseCanonicalJson(record.canonical_json));
  const evidence: Array<Record<string, unknown> & { evidence_id: string; scene_id: string }> = [];
  const derivations: Array<Record<string, unknown> & { derivation_id: string; scene_id: string }> = [];
  const candidates: Array<Record<string, unknown> & { candidate_id: string }> = [];
  const gaps: Array<Record<string, unknown>> = [];

  for (const [recordIndex, record] of records.entries()) {
    const canonical = canonicals[recordIndex];
    const sceneId = canonical.sceneMetadata?.sceneId ?? record.scene_id;
    const provenanceByAnswer = new Map(
      (canonical.provenance ?? [])
        .filter((item) => item.answerId)
        .map((item) => [String(item.answerId), item.provenanceType ?? "captured"]),
    );

    for (const answer of canonical.evidence?.answers ?? []) {
      if (!answer.id || answer.isUserVisible === false) continue;
      const literalValue = firstMeaningfulAnswerValue(answer);
      if (!literalValue) continue;

      evidence.push({
        evidence_id: answer.id,
        scene_id: sceneId,
        block_origin: blockOrigin(answer.blockId, answer.questionCode),
        question_origin: answer.questionCode ?? "unknown",
        literal_value: literalValue,
        answer_type: answer.answerType ?? null,
        provenance_type:
          provenanceByAnswer.get(answer.id) ?? "captured_user_evidence",
      });
    }
  }

  for (const [recordIndex, record] of records.entries()) {
    const canonical = canonicals[recordIndex];
    const sceneId = canonical.sceneMetadata?.sceneId ?? record.scene_id;
    const fallbackEvidenceIds = evidenceIdsForScene(evidence, sceneId);
    const sceneConfidence = Number(canonical.lightInference?.confidenceScore ?? 65);
    const candidateConfidence = Math.max(0.5, Math.min(1, sceneConfidence / 100));

    for (const [blockId, variables] of Object.entries(
      canonical.canonicalVariablesByBlock ?? {},
    )) {
      for (const [variableName, entry] of Object.entries(variables)) {
        const text = valueText(entry.value);
        if (!text) continue;

        const sourceEvidenceIds = unique(
          (entry.evidenceAnswerIds ?? []).filter((id) =>
            evidence.some((item) => item.evidence_id === id),
          ),
        );
        const derivationId =
          entry.derivationId ??
          stableId("DER", sceneId, blockId, variableName, derivations.length + 1);

        derivations.push({
          derivation_id: derivationId,
          scene_id: sceneId,
          canonical_variable: variableName,
          value: entry.value,
          source_evidence_ids: sourceEvidenceIds,
        });

        const quadrantTargets = variableQuadrants[variableName];
        if (!quadrantTargets?.length) continue;

        const candidateEvidenceIds = sourceEvidenceIds.length
          ? sourceEvidenceIds
          : fallbackEvidenceIds.slice(0, 3);
        if (!candidateEvidenceIds.length) continue;

        candidates.push({
          candidate_id: stableId("CAND", sceneId, variableName, candidates.length + 1),
          candidate_type: variableCandidateType[variableName] ?? "attribute",
          canonical_label: `${variableName}: ${text}`.slice(0, 240),
          quadrant_targets: quadrantTargets,
          source_scene_ids: [sceneId],
          source_evidence_ids: candidateEvidenceIds,
          source_derivation_ids: [derivationId],
          related_scene_name: canonical.sceneMetadata?.sceneName ?? null,
          confidence: Number(candidateConfidence.toFixed(2)),
          projection_status: "candidate",
        });
      }
    }

    for (const gap of canonical.gaps ?? []) {
      gaps.push({
        gap_id: stableId("GAP", sceneId, gap.source, gap.code, gaps.length + 1),
        scene_id: sceneId,
        source: gap.source ?? "unknown",
        code: gap.code ?? "unknown",
        severity: gap.severity ?? "unknown",
        description: gap.message ?? "Gap heredado del registro canonico.",
      });
    }
  }

  const candidateConfidences = candidates.map((candidate) =>
    Number(candidate.confidence),
  );
  const averageConfidence = candidateConfidences.length
    ? candidateConfidences.reduce((sum, value) => sum + value, 0) /
      candidateConfidences.length
    : 0;
  const lowestConfidence = candidateConfidences.length
    ? Math.min(...candidateConfidences)
    : 0;

  const bundle = {
    bundle_id: stableId("MMABPDSB", sessionId),
    bundle_type: "mmabp_design_source_bundle",
    bundle_version: "1.0.0",
    created_at: new Date().toISOString(),
    source_core: {
      canonical_version: CAPA1_V2_1_INSTRUMENT_VERSION,
      manifest_version: manifest.metadata.manifest_version,
      manifest_content_hash: manifest.metadata.content_hash,
      source_contract_id: platformContract.contract_id,
    },
    client_context: clientContext,
    source_scenes: records.map((record, index) => {
      const canonical = canonicals[index];
      return {
        scene_id: canonical.sceneMetadata?.sceneId ?? record.scene_id,
        scene_readiness: sourceSceneReadiness(record, canonical),
        source_user_id: user.id,
        source_user_role: user.rol_declarado ?? "Rol no declarado",
        confidence_score: Number(canonical.lightInference?.confidenceScore ?? 0),
        scene_canonical_record_ref: `scene_canonical_record:${record.id}`,
      };
    }),
    literal_evidence: evidence,
    canonical_derivations: derivations,
    flags: [],
    gaps,
    quadrant_candidates: candidates,
    design_source_readiness: {
      status: designReadinessStatus(records, canonicals, candidates.length),
      confidence_summary: {
        average_candidate_confidence: Number(averageConfidence.toFixed(3)),
        lowest_candidate_confidence: Number(lowestConfidence.toFixed(3)),
        candidate_count: candidates.length,
        evidence_count: evidence.length,
      },
      notes: gaps.length
        ? ["La salida lateral conserva gaps para el area de diagramacion."]
        : [],
    },
    boundaries: {
      does_not_replace_evidence_bundle_for_transduction: true,
      does_not_modify_capa2_readiness: true,
      not_diagnostic: true,
      not_monetization: true,
      not_final_narrative: true,
    },
    runtime_boundary: {
      sidecar_only: true,
      core_required_bundles_unchanged: true,
      capa2_handoff_unchanged: true,
      source_chain:
        "Capa 1.0 core -> scene_canonical_record -> mmabp_design_source_bundle",
    },
  };

  return {
    bundle,
    generatedFromSceneIds: records.map((record) => record.scene_id),
    candidateCount: candidates.length,
    evidenceCount: evidence.length,
    readiness: bundle.design_source_readiness.status,
  };
}
