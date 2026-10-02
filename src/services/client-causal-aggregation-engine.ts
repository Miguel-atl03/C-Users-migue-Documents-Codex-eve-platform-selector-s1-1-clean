import type {
  CausalConfidenceLevel,
  CausalEvidenceItem,
  CausalNodeId,
  CausalPath,
  EvidenceBundle,
  NodeActivation,
} from "@/domain/causal";
import type {
  ClientAggregationMode,
  ClientCausalAggregationOutput,
  ClientExpertReviewFlag,
  ClientCausalNodeKind,
  ClientNodeAggregation,
  ClientNodeAggregationKind,
  ClientReentryDecision,
  ClientSessionCausalInput,
  CrossSessionContradiction,
  CrossSessionSupportMap,
  PreliminaryClientNarrative,
  RecursiveRoleContribution,
  RoleObservationPosition,
} from "@/domain/client-causal";

const CLIENT_SCHEMA_VERSION = "capa2_5_client_causal_aggregation_mvp_v1";

const confidenceWeight: Record<CausalConfidenceLevel, number> = {
  high: 1,
  medium: 0.65,
  low: 0.35,
};

const legacyNodeMap: Record<string, CausalNodeId> = {
  N2: "N06",
  N3: "N10",
  N4: "N04",
  N5: "N03",
};

const canonicalNodeLabels: Record<CausalNodeId, string> = {
  N02: "N02 Brecha Intencional",
  N03: "N03 Anarquia Operacional",
  N04: "N04 Violacion Causal",
  N06: "N06 Tortura Causal",
  N10: "N10 Promesa Imposible",
  N13: "N13 Incoherencia Total",
};

const nodeKindById: Record<CausalNodeId, ClientCausalNodeKind> = {
  N02: "nuclear",
  N03: "complementary",
  N04: "complementary",
  N06: "nuclear",
  N10: "nuclear",
  N13: "complementary",
};

const canonicalNodeId = (nodeId: string): CausalNodeId =>
  (legacyNodeMap[nodeId] ?? nodeId) as CausalNodeId;

const nodeKind = (nodeId: CausalNodeId): ClientCausalNodeKind =>
  nodeKindById[nodeId] ?? "complementary";

type NodeAccumulator = {
  node_id: CausalNodeId;
  node_label: string;
  node_name_canonical: string;
  supporting_session_ids: Set<string>;
  weakening_session_ids: Set<string>;
  root_session_ids: Set<string>;
  secondary_session_ids: Set<string>;
  evidence_bundle_ids: Set<string>;
  supportScore: number;
  weakenScore: number;
  confidenceScoreTotal: number;
  confidenceCount: number;
  dominant_bundles_by_session: Map<string, EvidenceBundle[]>;
  activations_by_session: Map<string, NodeActivation>;
  weaken_evidence_by_session: Map<string, CausalEvidenceItem[]>;
  symptomSignalScore: number;
  structuralRootSignalScore: number;
};

type AggregateNodeCandidate = ClientNodeAggregation & {
  root_session_count: number;
  secondary_session_count: number;
  symptom_signal_score: number;
  structural_root_signal_score: number;
  raw_rank_score: number;
};

const emptyBoundary = {
  does_not_produce_final_truth: true as const,
  does_not_replace_expert_judgment: true as const,
  does_not_generate_final_inevitability_theorem: true as const,
  integrates_partial_role_lenses_into_single_client_reading: true as const,
};

const confidenceFromScore = (score: number): CausalConfidenceLevel => {
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "medium";
  return "low";
};

const avg = (value: number, count: number) => (count > 0 ? value / count : 0);

const unique = <T>(items: T[]) => [...new Set(items)];

const nodeLabelFromActivation = (activation: NodeActivation | null | undefined) => {
  if (!activation) return "Nodo causal";
  const canonical = canonicalNodeId(activation.node_code_canonical);
  const label = activation.nodeLabel ?? activation.node_name_canonical ?? canonical;
  return label.startsWith("N2 ") ||
    label.startsWith("N3 ") ||
    label.startsWith("N4 ") ||
    label.startsWith("N5 ")
    ? canonicalNodeLabels[canonical]
    : label;
};

const evidenceText = (item: CausalEvidenceItem) =>
  [
    item.canonicalVariable,
    item.reason,
    item.nature,
    item.evidenceTier,
    JSON.stringify(item.value ?? {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const bundleEvidenceText = (bundle: EvidenceBundle) =>
  [...bundle.supports, ...bundle.weakens].map(evidenceText).join(" ");

const symptomSignalScore = (bundle: EvidenceBundle) => {
  const text = bundleEvidenceText(bundle);
  const patterns = [
    /workaround/,
    /sacrificio/,
    /compens/,
    /absorci/,
    /desgaste/,
    /informal_operation/,
    /variedad_residual/,
  ];
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
};

const structuralRootSignalScore = (bundle: EvidenceBundle) => {
  const text = bundleEvidenceText(bundle);
  const patterns = [
    /workaround_as_coordination_architecture/,
    /system_parallel_as_primary_truth/,
    /formal_system_insufficient_absorption/,
    /explicit_n04_breach/,
    /temporal_dependency_break/,
    /capacity_gap/,
    /brecha_capacidad/,
    /promise_impossible/,
    /validation_state_conflict/,
    /improper_release/,
  ];
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
};

const bundleNetScore = (bundle: EvidenceBundle) =>
  Math.max(0, bundle.supportScore - bundle.weakenScore);

const normalizeActivation = (
  activation: NodeActivation | null | undefined,
): NodeActivation | null => {
  if (!activation) return null;
  const canonical = canonicalNodeId(activation.node_code_canonical);
  return {
    ...activation,
    nodeId: canonical,
    node_code_canonical: canonical,
    nodeLabel:
      activation.nodeLabel?.startsWith("N5 ") ||
      activation.nodeLabel?.startsWith("N4 ") ||
      activation.nodeLabel?.startsWith("N3 ") ||
      activation.nodeLabel?.startsWith("N2 ")
        ? canonicalNodeLabels[canonical]
        : activation.nodeLabel,
  };
};

const normalizeBundle = (bundle: EvidenceBundle): EvidenceBundle => {
  const canonical = canonicalNodeId(bundle.node_code_canonical);
  return {
    ...bundle,
    nodeId: canonical,
    node_code_canonical: canonical,
  };
};

const rootActivation = (input: ClientSessionCausalInput) =>
  normalizeActivation(
    input.output.root_node_probable_within_mvp_scope ??
      input.output.root_node_probable ??
      null,
  );

const secondaryActivations = (input: ClientSessionCausalInput) =>
  (input.output.secondary_nodes_activated ?? [])
    .map(normalizeActivation)
    .filter(Boolean) as NodeActivation[];

const allNodeActivations = (input: ClientSessionCausalInput) => {
  const root = rootActivation(input);
  const byNode = new Map<CausalNodeId, NodeActivation>();
  if (root) byNode.set(root.node_code_canonical, root);
  for (const activation of secondaryActivations(input)) {
    byNode.set(activation.node_code_canonical, activation);
  }
  return [...byNode.values()];
};

const createAccumulator = (
  nodeId: CausalNodeId,
  activation: NodeActivation | null,
): NodeAccumulator => ({
  node_id: nodeId,
  node_label: nodeLabelFromActivation(activation),
  node_name_canonical: activation?.node_name_canonical ?? nodeId,
  supporting_session_ids: new Set(),
  weakening_session_ids: new Set(),
  root_session_ids: new Set(),
  secondary_session_ids: new Set(),
  evidence_bundle_ids: new Set(),
  supportScore: 0,
  weakenScore: 0,
  confidenceScoreTotal: 0,
  confidenceCount: 0,
  dominant_bundles_by_session: new Map(),
  activations_by_session: new Map(),
  weaken_evidence_by_session: new Map(),
  symptomSignalScore: 0,
  structuralRootSignalScore: 0,
});

const aggregationKindFor = (
  candidate: Omit<AggregateNodeCandidate, "aggregation_kind" | "interpretation">,
  sessionCount: number,
): ClientNodeAggregationKind => {
  const coverage = candidate.session_coverage_ratio;
  const mostlySymptom =
    candidate.symptom_signal_score > candidate.structural_root_signal_score * 1.5 &&
    candidate.structural_root_signal_score < 3 &&
    candidate.session_count_supporting > 1;

  if (mostlySymptom) return "symptom_transversal";
  if (coverage >= 0.5 && candidate.root_session_count > 0) {
    return "dominant_transversal";
  }
  if (candidate.session_count_supporting >= 2 || coverage >= 0.4) return "recurrent";
  if (sessionCount > 1 && candidate.secondary_session_count > 1) return "recursive_echo";
  return "local";
};

const candidateIsStructurallyStrong = (candidate: AggregateNodeCandidate) =>
  candidate.session_coverage_ratio >= 0.4 &&
  candidate.weighted_support_score > candidate.weighted_weaken_score &&
  candidate.confidence_level !== "low";

const decideAggregationMode = ({
  primaryNuclear,
  secondaryNuclear,
  complementaryNodes,
}: {
  primaryNuclear: AggregateNodeCandidate | null;
  secondaryNuclear: AggregateNodeCandidate | null;
  complementaryNodes: AggregateNodeCandidate[];
}): ClientAggregationMode => {
  if (
    primaryNuclear &&
    secondaryNuclear &&
    candidateIsStructurallyStrong(primaryNuclear) &&
    candidateIsStructurallyStrong(secondaryNuclear) &&
    secondaryNuclear.raw_rank_score >= primaryNuclear.raw_rank_score * 0.65
  ) {
    return "compound_nuclear_configuration";
  }

  if (
    primaryNuclear &&
    complementaryNodes.some(
      (node) =>
        node.session_count_supporting > 0 &&
        node.aggregation_kind !== "symptom_transversal",
    )
  ) {
    return "nuclear_root_with_complements";
  }

  return "single_nuclear_root";
};

const interpretationFor = (
  candidate: Omit<AggregateNodeCandidate, "aggregation_kind" | "interpretation">,
  kind: ClientNodeAggregationKind,
) => {
  if (kind === "symptom_transversal") {
    return "El nodo aparece de forma repetida, pero el soporte proviene sobre todo de senales de compensacion, workaround o absorcion; se conserva como sintoma transversal hasta revisar su posicion causal.";
  }

  if (kind === "dominant_transversal") {
    return "El nodo aparece con soporte multisesion y bundles suficientemente fuertes para operar como candidato preliminar de raiz cliente dentro del alcance de Capa 2.5.";
  }

  if (kind === "recursive_echo") {
    return "El nodo aparece en distintos roles como eco o funcion causal situada; no necesariamente opera como raiz cliente.";
  }

  if (kind === "local") {
    return "El nodo aparece principalmente localizado en una sesion o rol; se conserva como ruptura situada dentro de la pelicula cliente.";
  }

  return "El nodo aparece de forma recurrente entre sesiones y contribuye a la lectura causal agregada del cliente.";
};

const buildRoleObservation = (
  input: ClientSessionCausalInput,
): RoleObservationPosition => ({
  sesion_id: input.sesion_id,
  usuario_id: input.usuario_id,
  role_label: input.role_label,
  observation_scope: "partial_role_lens_on_client_system",
  interpretation_unit: "client_system",
  note:
    "Esta sesion representa una lente causal parcial del sistema cliente; no equivale por si sola a la lectura agregada del cliente.",
});

const buildSupportMaps = (
  inputs: ClientSessionCausalInput[],
  accumulators: Map<CausalNodeId, NodeAccumulator>,
): CrossSessionSupportMap[] =>
  [...accumulators.values()].map((acc) => ({
    node_id: acc.node_id,
    sessions_that_support: [...acc.supporting_session_ids].map((sessionId) => {
      const input = inputs.find((candidate) => candidate.sesion_id === sessionId);
      return {
        sesion_id: sessionId,
        session_causal_output_id: input?.session_causal_output_id ?? "",
        role_label: input?.role_label ?? null,
        root_in_session: acc.root_session_ids.has(sessionId),
        activation: acc.activations_by_session.get(sessionId) ?? null,
        dominant_bundles: acc.dominant_bundles_by_session.get(sessionId) ?? [],
      };
    }),
    sessions_that_weaken: [...acc.weakening_session_ids].map((sessionId) => {
      const input = inputs.find((candidate) => candidate.sesion_id === sessionId);
      return {
        sesion_id: sessionId,
        role_label: input?.role_label ?? null,
        weaken_evidence: acc.weaken_evidence_by_session.get(sessionId) ?? [],
      };
    }),
  }));

const buildContradictions = (
  inputs: ClientSessionCausalInput[],
  candidates: AggregateNodeCandidate[],
): CrossSessionContradiction[] => {
  const contradictions: CrossSessionContradiction[] = [];
  const rootNodes = new Map<CausalNodeId, string[]>();

  for (const input of inputs) {
    const root = rootActivation(input);
    if (!root) continue;
    const existing = rootNodes.get(root.node_code_canonical) ?? [];
    existing.push(input.sesion_id);
    rootNodes.set(root.node_code_canonical, existing);
  }

  if (rootNodes.size > 1) {
    contradictions.push({
      id: "client-root-split",
      contradiction_type: "root_split",
      node_ids: [...rootNodes.keys()],
      supporting_session_ids: [...rootNodes.values()].flat(),
      weakening_session_ids: [],
      description:
        "Distintos roles llegan con raices causales de sesion diferentes; Capa 2.5 debe integrarlas sin aplanarlas.",
      severity: "medium",
      requires_expert_review: true,
    });
  }

  for (const candidate of candidates) {
    if (
      candidate.session_count_supporting > 0 &&
      candidate.session_count_weakening > 0
    ) {
      contradictions.push({
        id: `support-vs-weaken-${candidate.node_id}`,
        contradiction_type: "support_vs_weaken",
        node_ids: [candidate.node_id],
        supporting_session_ids: candidate.dominant_session_ids,
        weakening_session_ids: candidate.local_session_ids,
        description:
          "El nodo tiene soporte en algunas lentes de rol y evidencia debilitante en otras.",
        severity: candidate.session_count_weakening > 1 ? "high" : "medium",
        requires_expert_review: true,
      });
    }

    if (candidate.aggregation_kind === "symptom_transversal") {
      contradictions.push({
        id: `symptom-vs-root-${candidate.node_id}`,
        contradiction_type: "symptom_vs_root",
        node_ids: [candidate.node_id],
        supporting_session_ids: candidate.dominant_session_ids,
        weakening_session_ids: [],
        description:
          "El nodo se repite transversalmente, pero su evidencia parece sintomatica o compensatoria; no debe elevarse automaticamente a raiz cliente.",
        severity: "medium",
        requires_expert_review: true,
      });
    }
  }

  return contradictions;
};

const buildRoleContributions = (
  inputs: ClientSessionCausalInput[],
  root: ClientNodeAggregation | null,
  contradictions: CrossSessionContradiction[],
): RecursiveRoleContribution[] =>
  inputs.map((input) => {
    const rootNode = rootActivation(input);
    const activatedNodes = allNodeActivations(input).map(
      (activation) => activation.node_code_canonical,
    );
    const supportsRoot =
      !!root && activatedNodes.includes(root.node_id) && rootNode?.node_code_canonical === root.node_id;
    const weakensRoot =
      !!root &&
      input.output.evidence_that_weakens.some((item) =>
        evidenceText(item).includes(root.node_id.toLowerCase()),
      );
    const introducesContradiction = contradictions.some((contradiction) =>
      contradiction.supporting_session_ids.includes(input.sesion_id) ||
      contradiction.weakening_session_ids.includes(input.sesion_id),
    );

    const contribution_kind: RecursiveRoleContribution["contribution_kind"] =
      supportsRoot
        ? "supports_client_root"
        : weakensRoot
          ? "weakens_client_root"
          : introducesContradiction
            ? "reveals_cross_session_contradiction"
            : rootNode
              ? "reveals_local_node"
              : "reveals_recursive_echo";

    return {
      sesion_id: input.sesion_id,
      usuario_id: input.usuario_id,
      role_label: input.role_label,
      contribution_kind,
      node_ids: unique(
        [rootNode?.node_code_canonical, ...activatedNodes].filter(
          Boolean,
        ) as CausalNodeId[],
      ),
      evidence_bundle_ids: input.output.evidence_bundle_used
        .slice(0, 8)
        .map((bundle) => bundle.id),
      contribution_summary:
        contribution_kind === "supports_client_root"
          ? "La lente del rol sostiene directamente la raiz cliente preliminar."
          : contribution_kind === "weakens_client_root"
            ? "La lente del rol introduce evidencia que debilita la raiz cliente preliminar."
            : contribution_kind === "reveals_cross_session_contradiction"
              ? "La lente del rol participa en una contradiccion o tension inter-sesion."
              : "La lente del rol aporta una lectura local que debe integrarse sin confundirse con la raiz cliente.",
    };
  });

const buildClientPath = (
  root: ClientNodeAggregation | null,
  complementaryNodes: ClientNodeAggregation[],
  secondaryNuclear: ClientNodeAggregation | null,
): CausalPath | null => {
  if (!root) return null;
  const nodeIds = unique([
    root.node_id,
    ...(secondaryNuclear ? [secondaryNuclear.node_id] : []),
    ...complementaryNodes
      .filter((node) => node.node_id !== root.node_id)
      .slice(0, 3)
      .map((node) => node.node_id),
  ]);

  return {
    id: `client-path-${nodeIds.join("-")}`,
    nodeIds,
    label: `Camino causal cliente preliminar: ${nodeIds.join(" -> ")}`,
    confidenceScore: root.average_confidence_score,
    confidenceLevel: root.confidence_level,
    confidenceReasoning:
      "Camino construido desde nodos recurrentes/transversales y contribuciones por rol; no es teorema final.",
    rationale:
      "Capa 2.5 integra raices, nodos secundarios, bundles dominantes, contradicciones y cobertura de roles para proponer un camino cliente auditable.",
  };
};

const buildNarrative = (
  root: ClientNodeAggregation | null,
  aggregationMode: ClientAggregationMode,
  primaryNuclear: ClientNodeAggregation | null,
  secondaryNuclear: ClientNodeAggregation | null,
  complementaryNodes: ClientNodeAggregation[],
  symptomTransversalNodes: ClientNodeAggregation[],
  localNodes: ClientNodeAggregation[],
  roleContributions: RecursiveRoleContribution[],
  contradictions: CrossSessionContradiction[],
  expertReview: boolean,
): PreliminaryClientNarrative => {
  const supportRoles = roleContributions
    .filter((item) => item.contribution_kind === "supports_client_root")
    .map((item) => item.role_label ?? item.sesion_id);
  const tensionRoles = roleContributions
    .filter(
      (item) =>
        item.contribution_kind === "weakens_client_root" ||
        item.contribution_kind === "reveals_cross_session_contradiction",
    )
    .map((item) => item.role_label ?? item.sesion_id);

  const text = [
    primaryNuclear
      ? aggregationMode === "compound_nuclear_configuration"
        ? `Configuracion causal compuesta: ${primaryNuclear.node_label} y ${secondaryNuclear?.node_label ?? "otro nodo nuclear"} estructuran partes relevantes de la pelicula cliente.`
        : `Estructura causal principal: ${primaryNuclear.node_label} organiza la pelicula cliente preliminar.`
      : root
        ? `Patron transversal preliminar: ${root.node_label} aparece como candidato de lectura cliente dentro del alcance de Capa 2.5.`
      : "No hay raiz cliente preliminar suficiente con las sesiones disponibles.",
    complementaryNodes.length
      ? `Nodos complementarios que manifiestan, modulan o localizan la pelicula: ${complementaryNodes
          .slice(0, 4)
          .map((node) => node.node_label)
          .join(", ")}.`
      : "No se detectaron nodos complementarios relevantes fuera del nodo estructurante.",
    symptomTransversalNodes.length
      ? `Sintomas o ecos transversales preservados sin elevarlos automaticamente a raiz: ${symptomTransversalNodes
          .slice(0, 3)
          .map((node) => node.node_label)
          .join(", ")}.`
      : "No se detectaron sintomas transversales fuertes separados de la raiz cliente.",
    supportRoles.length
      ? `Roles que sostienen la lectura: ${supportRoles.join(", ")}.`
      : "Ningun rol sostiene de forma directa una raiz cliente consolidada.",
    localNodes.length
      ? `Nodos locales relevantes: ${localNodes
          .slice(0, 3)
          .map((node) => node.node_label)
          .join(", ")}.`
      : "No se detectaron nodos locales relevantes fuera de la lectura transversal.",
    tensionRoles.length
      ? `Roles que tensionan o contradicen la lectura: ${tensionRoles.join(", ")}.`
      : "No se detectaron roles que tensionen de forma fuerte la lectura agregada.",
    contradictions.length
      ? `Contradicciones abiertas: ${contradictions.length}.`
      : "No se detectaron contradicciones inter-sesion fuertes.",
    aggregationMode === "compound_nuclear_configuration"
      ? "La configuracion compuesta obliga cautela: no debe colapsarse en una causa simple."
      : `Modo de agregacion: ${aggregationMode}.`,
    expertReview
      ? "Requiere revision experta antes de cualquier composicion final."
      : "No reemplaza el juicio experto; queda lista como lectura causal preliminar auditable.",
  ].join(" ");

  return {
    boundary: "preliminary_client_causal_narrative",
    text,
    sessions_used: roleContributions.map((item) => item.sesion_id),
    sessions_that_tension: roleContributions
      .filter(
        (item) =>
          item.contribution_kind === "weakens_client_root" ||
          item.contribution_kind === "reveals_cross_session_contradiction",
      )
      .map((item) => item.sesion_id),
    not_final_client_narrative: true,
    not_expert_judgment: true,
  };
};

export function aggregateClientCausalOutputs(
  inputs: ClientSessionCausalInput[],
): ClientCausalAggregationOutput {
  if (inputs.length === 0) {
    throw new Error("At least one session causal output is required for Capa 2.5.");
  }

  const empresaId = inputs[0].empresa_id;
  const accumulators = new Map<CausalNodeId, NodeAccumulator>();

  for (const input of inputs) {
    const root = rootActivation(input);
    const rootNode = root?.node_code_canonical ?? null;
    const activations = allNodeActivations(input);
    const activationByNode = new Map(
      activations.map((activation) => [activation.node_code_canonical, activation]),
    );

    for (const activation of activations) {
      const nodeId = activation.node_code_canonical;
      const acc =
        accumulators.get(nodeId) ??
        createAccumulator(nodeId, activation);
      accumulators.set(nodeId, acc);

      acc.supporting_session_ids.add(input.sesion_id);
      acc.activations_by_session.set(input.sesion_id, activation);
      acc.confidenceScoreTotal += confidenceWeight[activation.confidenceLevel];
      acc.confidenceCount += 1;
      if (rootNode === nodeId) acc.root_session_ids.add(input.sesion_id);
      else acc.secondary_session_ids.add(input.sesion_id);
    }

    const bundlesByNode = new Map<CausalNodeId, EvidenceBundle[]>();
    for (const rawBundle of input.output.evidence_bundle_used) {
      const bundle = normalizeBundle(rawBundle);
      const nodeId = bundle.node_code_canonical;
      const acc =
        accumulators.get(nodeId) ??
        createAccumulator(nodeId, activationByNode.get(nodeId) ?? null);
      accumulators.set(nodeId, acc);

      const nodeBundles = bundlesByNode.get(nodeId) ?? [];
      nodeBundles.push(bundle);
      bundlesByNode.set(nodeId, nodeBundles);
      acc.evidence_bundle_ids.add(bundle.id);
      acc.supportScore += bundleNetScore(bundle) * confidenceWeight[bundle.confidenceLevel];
      acc.weakenScore += bundle.weakenScore * confidenceWeight[bundle.confidenceLevel];
      acc.symptomSignalScore += symptomSignalScore(bundle);
      acc.structuralRootSignalScore += structuralRootSignalScore(bundle);
      if (bundle.weakenScore > 0) {
        acc.weakening_session_ids.add(input.sesion_id);
        const existing = acc.weaken_evidence_by_session.get(input.sesion_id) ?? [];
        acc.weaken_evidence_by_session.set(input.sesion_id, [
          ...existing,
          ...bundle.weakens,
        ]);
      }
    }

    for (const [nodeId, bundles] of bundlesByNode.entries()) {
      const acc = accumulators.get(nodeId);
      if (!acc) continue;
      acc.dominant_bundles_by_session.set(
        input.sesion_id,
        [...bundles]
          .sort((left, right) => bundleNetScore(right) - bundleNetScore(left))
          .slice(0, 3),
      );
    }
  }

  const sessionCount = inputs.length;
  const candidates: AggregateNodeCandidate[] = [...accumulators.values()]
    .map((acc) => {
      const session_count_supporting = acc.supporting_session_ids.size;
      const session_coverage_ratio = session_count_supporting / sessionCount;
      const average_confidence_score = avg(
        acc.confidenceScoreTotal,
        acc.confidenceCount,
      );
      const symptomPenalty =
        acc.symptomSignalScore > acc.structuralRootSignalScore ? 0.75 : 0;
      const raw_rank_score =
        acc.supportScore +
        session_coverage_ratio * 4 +
        average_confidence_score * 3 +
        acc.root_session_ids.size * 1.5 +
        Math.min(acc.structuralRootSignalScore, 4) * 0.75 -
        acc.weakenScore -
        symptomPenalty;

      const base = {
        node_id: acc.node_id,
        node_label: acc.node_label,
        node_kind: nodeKind(acc.node_id),
        session_count_supporting,
        session_count_weakening: acc.weakening_session_ids.size,
        session_coverage_ratio: Number(session_coverage_ratio.toFixed(3)),
        weighted_support_score: Number(acc.supportScore.toFixed(2)),
        weighted_weaken_score: Number(acc.weakenScore.toFixed(2)),
        average_confidence_score: Number(average_confidence_score.toFixed(3)),
        confidence_level: confidenceFromScore(average_confidence_score),
        dominant_session_ids: [...acc.root_session_ids],
        local_session_ids: [...acc.supporting_session_ids].filter(
          (id) => !acc.root_session_ids.has(id),
        ),
        evidence_bundle_ids: [...acc.evidence_bundle_ids],
        root_session_count: acc.root_session_ids.size,
        secondary_session_count: acc.secondary_session_ids.size,
        symptom_signal_score: acc.symptomSignalScore,
        structural_root_signal_score: acc.structuralRootSignalScore,
        raw_rank_score: Number(raw_rank_score.toFixed(2)),
      };
      const aggregation_kind = aggregationKindFor(base, sessionCount);

      return {
        ...base,
        aggregation_kind,
        interpretation: interpretationFor(base, aggregation_kind),
      };
    })
    .sort((left, right) => right.raw_rank_score - left.raw_rank_score);

  const recurrent = candidates.filter((item) => item.aggregation_kind === "recurrent");
  const local = candidates.filter((item) => item.aggregation_kind === "local");
  const dominant = candidates.filter(
    (item) => item.aggregation_kind === "dominant_transversal",
  );
  const recursive = candidates.filter(
    (item) => item.aggregation_kind === "recursive_echo",
  );
  const symptomTransversal = candidates.filter(
    (item) => item.aggregation_kind === "symptom_transversal",
  );
  const nuclearCandidates = candidates
    .filter(
      (item) =>
        item.node_kind === "nuclear" &&
        item.aggregation_kind !== "symptom_transversal",
    )
    .sort((left, right) => right.raw_rank_score - left.raw_rank_score);
  const primaryNuclear = nuclearCandidates[0] ?? null;
  const secondaryNuclear = nuclearCandidates[1] ?? null;
  const complementaryNodes = candidates.filter(
    (item) =>
      item.node_kind === "complementary" &&
      item.aggregation_kind !== "symptom_transversal",
  );
  const localManifestationNodes = complementaryNodes.filter(
    (item) =>
      item.aggregation_kind === "local" ||
      item.aggregation_kind === "recursive_echo" ||
      item.aggregation_kind === "recurrent",
  );
  const aggregationMode = decideAggregationMode({
    primaryNuclear,
    secondaryNuclear,
    complementaryNodes,
  });
  const root = primaryNuclear ?? candidates[0] ?? null;
  const supportMap = buildSupportMaps(inputs, accumulators);
  const contradictions = buildContradictions(inputs, candidates);
  const rolePerspectiveMap = inputs.map(buildRoleObservation);
  const roleContributionMap = buildRoleContributions(
    inputs,
    root,
    contradictions,
  );
  const needsReentry = inputs.length < 2 || !root;
  const needsExpertReview =
    contradictions.length > 0 ||
    root?.confidence_level !== "high" ||
    aggregationMode === "compound_nuclear_configuration" ||
    candidates.some((candidate) => candidate.aggregation_kind === "symptom_transversal");

  const reentryDecision: ClientReentryDecision = {
    needs_reentry_client: needsReentry,
    reason_codes: [
      ...(inputs.length < 2 ? (["insufficient_session_coverage"] as const) : []),
      ...(!root ? (["low_confidence_client_root"] as const) : []),
    ],
    suggested_session_ids: inputs.length < 2 ? inputs.map((input) => input.sesion_id) : [],
    suggested_focus: needsReentry
      ? ["Agregar mas lentes de rol antes de cerrar lectura cliente."]
      : [],
  };

  const expertReviewFlag: ClientExpertReviewFlag = {
    needs_expert_review_client: needsExpertReview,
    reason_codes: [
      ...(contradictions.length > 0
        ? (["cross_session_conflict"] as const)
        : []),
      ...(root?.confidence_level !== "high"
        ? (["weak_client_root_margin"] as const)
        : []),
      ...(candidates.some(
        (candidate) => candidate.aggregation_kind === "symptom_transversal",
      )
        ? (["dominant_symptom_pattern"] as const)
        : []),
      ...(aggregationMode === "compound_nuclear_configuration"
        ? (["multi_role_composition_required"] as const)
        : []),
      "client_narrative_not_final",
    ],
    severity: contradictions.some((item) => item.severity === "high")
      ? "high"
      : needsExpertReview
        ? "moderate"
        : "none",
    reasons: [
      ...(contradictions.length > 0
        ? ["Existen contradicciones o tensiones entre lentes de rol."]
        : []),
      "La narrativa cliente sigue siendo preliminar y requiere frontera con Capa 3.",
    ],
  };

  const narrative = buildNarrative(
    root,
    aggregationMode,
    primaryNuclear,
    secondaryNuclear,
    complementaryNodes,
    symptomTransversal,
    local,
    roleContributionMap,
    contradictions,
    needsExpertReview,
  );
  const confidenceLevelClient =
    aggregationMode === "compound_nuclear_configuration" && root?.confidence_level === "high"
      ? "medium"
      : root?.confidence_level ?? "low";

  return {
    schema_version: CLIENT_SCHEMA_VERSION,
    empresa_id: empresaId,
    client_interpretation_unit: "client_system",
    generated_at: new Date().toISOString(),
    source: {
      session_causal_output_ids: inputs.map((input) => input.session_causal_output_id),
      sesion_ids: inputs.map((input) => input.sesion_id),
      primary_source: "session_causal_outputs",
      fallback_sources: [],
    },
    role_perspective_map: rolePerspectiveMap,
    recursive_role_contribution_map: roleContributionMap,
    aggregation_mode: aggregationMode,
    client_root_node_probable: root,
    primary_nuclear_node: primaryNuclear,
    secondary_nuclear_node:
      aggregationMode === "compound_nuclear_configuration" ? secondaryNuclear : null,
    complementary_nodes: complementaryNodes,
    symptom_transversal_nodes: symptomTransversal,
    local_manifestation_nodes: localManifestationNodes,
    cross_session_nodes_recurrent: recurrent,
    cross_session_nodes_local: local,
    cross_session_nodes_dominant_transversal: dominant,
    cross_session_nodes_recursive: recursive,
    cross_session_nodes_symptom_transversal: symptomTransversal,
    cross_session_contradictions: contradictions,
    cross_session_support_map: supportMap,
    client_causal_path_probable: buildClientPath(
      root,
      complementaryNodes,
      aggregationMode === "compound_nuclear_configuration" ? secondaryNuclear : null,
    ),
    sessions_that_support: roleContributionMap
      .filter((item) => item.contribution_kind === "supports_client_root")
      .map((item) => ({
        sesion_id: item.sesion_id,
        role_label: item.role_label,
        node_ids: item.node_ids,
      })),
    sessions_that_weaken: roleContributionMap
      .filter(
        (item) =>
          item.contribution_kind === "weakens_client_root" ||
          item.contribution_kind === "reveals_cross_session_contradiction",
      )
      .map((item) => ({
        sesion_id: item.sesion_id,
        role_label: item.role_label,
        node_ids: item.node_ids,
      })),
    confidence_level_client: confidenceLevelClient,
    confidence_reasoning_client: root
      ? `Confianza heuristica basada en modo ${aggregationMode}, cobertura ${root.session_coverage_ratio}, soporte ponderado ${root.weighted_support_score}, debilitamiento ${root.weighted_weaken_score} y contribuciones por rol.${aggregationMode === "compound_nuclear_configuration" ? " Se aplica cautela porque hay mas de un nodo nuclear estructuralmente relevante." : ""}`
      : "No hay raiz cliente preliminar suficiente.",
    needs_reentry_client: needsReentry,
    reentry_decision_client: reentryDecision,
    needs_expert_review_client: needsExpertReview,
    expert_review_flag_client: expertReviewFlag,
    preliminary_client_narrative: narrative,
    boundary: emptyBoundary,
  };
}
