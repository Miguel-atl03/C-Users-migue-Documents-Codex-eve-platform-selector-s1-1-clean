import type {
  ActiveCausalMvpNodeId,
  CausalNodeDefinition,
  CausalNodeId,
  CausalRule,
  CausalRuleId,
} from "@/domain/causal";

export const CAUSAL_MVP_NODE_SCOPE: ActiveCausalMvpNodeId[] = [
  "N03",
  "N04",
  "N06",
  "N10",
];

const SOURCE_ARTIFACTS = [
  "Tabla de Transduccion Causal operacional actualizada",
  "Arbol de Decision Causal actualizado",
  "Templates de narrativa diagnostica preliminar",
];

export const CAUSAL_NODE_DEFINITIONS: Record<CausalNodeId, CausalNodeDefinition> = {
  N02: {
    id: "N02",
    node_code_canonical: "N02",
    node_name_canonical: "Brecha Intencional",
    node_name_commercial: "Brecha Intencional",
    motor_node_reference: {
      commercialProductNodeCount: null,
      motorStructuralReference: "MMABP_13_COMPARTMENTS",
      mmabpNodeNumber: 2,
      mmabpDecoupling: "PM <-> PF",
      mmabpAnchors: ["PM", "PF"],
      vsmAnchors: [],
      aheAnchors: [],
      sourceArtifacts: SOURCE_ARTIFACTS,
    },
    label: "N02 Brecha Intencional",
    shortName: "Brecha intencional",
    epistemicBoundary:
      "Nodo canonico preparado para expansion posterior; no activo en el MVP actual.",
  },
  N03: {
    id: "N03",
    node_code_canonical: "N03",
    node_name_canonical: "Anarquia Operacional",
    node_name_commercial: "El Heroe",
    legacy_mvp_code: "N5",
    motor_node_reference: {
      commercialProductNodeCount: 6,
      legacyMvpCode: "N5",
      commercialNodeCode: "N5",
      motorStructuralReference: "MMABP_13_COMPARTMENTS",
      mmabpNodeNumber: 3,
      mmabpDecoupling: "MoC <-> PF",
      mmabpAnchors: ["MoC", "PF"],
      vsmAnchors: ["S1", "S2", "S3"],
      aheAnchors: ["heroicidad operacional", "compensacion creativa", "desgaste"],
      sourceArtifacts: SOURCE_ARTIFACTS,
    },
    label: "N03 Anarquia Operacional (El Heroe)",
    shortName: "Coordinacion heroica informal",
    epistemicBoundary:
      "Hipotesis causal auditable sobre ausencia de coordinacion formal suficiente.",
  },
  N04: {
    id: "N04",
    node_code_canonical: "N04",
    node_name_canonical: "Violacion Causal",
    node_name_commercial: "El Politico",
    legacy_mvp_code: "N4",
    motor_node_reference: {
      commercialProductNodeCount: 6,
      legacyMvpCode: "N4",
      commercialNodeCode: "N4",
      motorStructuralReference: "MMABP_13_COMPARTMENTS",
      mmabpNodeNumber: 4,
      mmabpDecoupling: "PF <-> OLC",
      mmabpAnchors: ["PF", "OLC"],
      vsmAnchors: ["S3", "S3*", "S5"],
      aheAnchors: ["deformacion de realidad", "proteccion ante castigo"],
      sourceArtifacts: SOURCE_ARTIFACTS,
    },
    label: "N04 Violacion Causal (El Politico)",
    shortName: "Deformacion de variedad",
    epistemicBoundary:
      "Hipotesis causal auditable sobre informacion deformada u oculta, no dictamen final.",
  },
  N06: {
    id: "N06",
    node_code_canonical: "N06",
    node_name_canonical: "Tortura Causal",
    node_name_commercial: "El Doble Vinculo",
    legacy_mvp_code: "N2",
    motor_node_reference: {
      commercialProductNodeCount: 6,
      legacyMvpCode: "N2",
      commercialNodeCode: "N2",
      motorStructuralReference: "MMABP_13_COMPARTMENTS",
      mmabpNodeNumber: 6,
      mmabpDecoupling: "PF <-> OLC",
      mmabpAnchors: ["PF", "OLC"],
      vsmAnchors: ["S1", "S2", "S3"],
      aheAnchors: ["carga por doble vinculo", "obediencia bajo bloqueo"],
      sourceArtifacts: SOURCE_ARTIFACTS,
    },
    label: "N06 Tortura Causal (El Doble Vinculo)",
    shortName: "Doble vinculo operativo",
    epistemicBoundary:
      "Hipotesis causal auditable sobre bloqueo por dependencias, no diagnostico final.",
  },
  N10: {
    id: "N10",
    node_code_canonical: "N10",
    node_name_canonical: "Promesa Imposible",
    node_name_commercial: "La Falsa Discrecion",
    legacy_mvp_code: "N3",
    motor_node_reference: {
      commercialProductNodeCount: 6,
      legacyMvpCode: "N3",
      commercialNodeCode: "N3",
      motorStructuralReference: "MMABP_13_COMPARTMENTS",
      mmabpNodeNumber: 10,
      mmabpDecoupling: "PM <-> PF <-> OLC",
      mmabpAnchors: ["PM", "PF", "OLC"],
      vsmAnchors: ["S1", "S3"],
      aheAnchors: ["sacrificio", "agencia constreñida", "variedad residual"],
      sourceArtifacts: SOURCE_ARTIFACTS,
    },
    label: "N10 Promesa Imposible (La Falsa Discrecion)",
    shortName: "Falsa discrecion",
    epistemicBoundary:
      "Hipotesis causal auditable sobre mandato mayor que capacidad real, no juicio final.",
  },
  N13: {
    id: "N13",
    node_code_canonical: "N13",
    node_name_canonical: "Incoherencia Total",
    node_name_commercial: "Incoherencia Total",
    motor_node_reference: {
      commercialProductNodeCount: null,
      motorStructuralReference: "MMABP_13_COMPARTMENTS",
      mmabpNodeNumber: 13,
      mmabpDecoupling: "PM <-> MoC <-> PF <-> OLC",
      mmabpAnchors: ["PM", "MoC", "PF", "OLC"],
      vsmAnchors: [],
      aheAnchors: [],
      sourceArtifacts: SOURCE_ARTIFACTS,
    },
    label: "N13 Incoherencia Total",
    shortName: "Incoherencia total",
    epistemicBoundary:
      "Nodo canonico preparado para expansion posterior; no activo en el MVP actual.",
  },
};

const node = (id: CausalNodeId) => CAUSAL_NODE_DEFINITIONS[id];

export const CAUSAL_RULES_MVP: CausalRule[] = [
  {
    id: "R-N06-TORTURA-CAUSAL-MVP",
    nodeId: "N06",
    node_code_canonical: "N06",
    node_name_canonical: node("N06").node_name_canonical,
    node_name_commercial: node("N06").node_name_commercial,
    name: "Dependencia activa sin sincronizacion suficiente",
    description:
      "Activa N06 cuando una escena muestra dependencias, espera, bloqueo, excepciones o contradicciones de sincronizacion.",
    minimumSupportScore: 3,
    strongSupportScore: 6,
    evidenceVariables: [
      "dependency_previous",
      "dependency_next",
      "trigger_preconditions",
      "wait_time_typical",
      "deadlock_risk",
      "blocking_impact",
      "bottleneck_type",
      "delivery_failure_exists",
      "transformation_exception_exists",
    ],
    weakeningVariables: [
      "deadlock_resolution",
      "alternative_paths",
      "receiver_feedback",
    ],
    structuralDiagnosis:
      "La escena parece exigir accion mientras las condiciones causales para actuar permanecen fuera del control directo.",
    aheTransduction:
      "Posible carga humana por doble vinculo: responder por un resultado condicionado por otros.",
  },
  {
    id: "R-N10-PROMESA-IMPOSIBLE-MVP",
    nodeId: "N10",
    node_code_canonical: "N10",
    node_name_canonical: node("N10").node_name_canonical,
    node_name_commercial: node("N10").node_name_commercial,
    name: "Mandato, capacidad y discrecion desalineados",
    description:
      "Activa N10 cuando existe brecha entre capacidad nominal y real, resource bargain o discrecion limitada.",
    minimumSupportScore: 3,
    strongSupportScore: 6,
    evidenceVariables: [
      "capacidad_nominal_5_1",
      "capacidad_real_5_2",
      "brecha_capacidad_5_3",
      "discrecionalidad_5_9",
      "constreñimientos_5_10",
      "resource_bargain_5_14",
      "variedad_residual_5_12",
    ],
    weakeningVariables: [
      "recursos_personas_requeridas_5_7",
      "recursos_tiempo_requerido_5_8",
    ],
    structuralDiagnosis:
      "La escena parece prometer un resultado que excede la capacidad real o la discrecion disponible.",
    aheTransduction:
      "Posible sacrificio o absorcion de variedad para sostener una promesa operativa insuficientemente equipada.",
  },
  {
    id: "R-N04-VIOLACION-CAUSAL-MVP",
    nodeId: "N04",
    node_code_canonical: "N04",
    node_name_canonical: node("N04").node_name_canonical,
    node_name_commercial: node("N04").node_name_commercial,
    name: "Informacion, regla o feedback deformado",
    description:
      "Activa N04 cuando hay informacion faltante, reglas informales, subprocesos ocultos o fallas sin feedback visible.",
    minimumSupportScore: 3,
    strongSupportScore: 6,
    evidenceVariables: [
      "informacion_faltante",
      "informacion_faltante_accion",
      "regla_informal",
      "regla_informal_conocida",
      "hidden_subprocess",
      "real_vs_official_sequence",
      "delivery_failure_exists",
      "receiver_feedback",
    ],
    weakeningVariables: ["validation_rule", "receiver_feedback"],
    structuralDiagnosis:
      "La escena parece operar con informacion incompleta, regla no oficial o baja visibilidad del error.",
    aheTransduction:
      "Posible deformacion de variedad: alguien corrige, completa o interpreta lo que el sistema no explicita.",
  },
  {
    id: "R-N03-ANARQUIA-OPERACIONAL-MVP",
    nodeId: "N03",
    node_code_canonical: "N03",
    node_name_canonical: node("N03").node_name_canonical,
    node_name_commercial: node("N03").node_name_commercial,
    name: "Workaround y coordinacion informal como sosten estructural",
    description:
      "Activa N03 cuando la escena se sostiene mediante workaround, rutas alternas, desviaciones o compensacion humana.",
    minimumSupportScore: 3,
    strongSupportScore: 6,
    evidenceVariables: [
      "workaround_used",
      "workaround_types",
      "flow_deviation_frequency",
      "alternative_paths",
      "parallelism_pattern",
      "delivery_channel",
      "sacrificio_humano",
      "absorcion_variedad_residual",
      "desgaste_acumulado",
    ],
    weakeningVariables: ["delivery_channel", "validation_rule"],
    structuralDiagnosis:
      "La coordinacion formal parece insuficiente y la operacion se sostiene con arreglos paralelos.",
    aheTransduction:
      "Posible heroicidad operacional: creatividad y sacrificio sustituyen coordinacion sistemica.",
  },
];

export const CAUSAL_RULE_BY_ID = CAUSAL_RULES_MVP.reduce(
  (index, rule) => ({ ...index, [rule.id]: rule }),
  {} as Record<CausalRuleId, CausalRule>,
);

export const CAUSAL_DECISION_TREE_MVP: Record<CausalNodeId, CausalNodeId[]> = {
  N02: [],
  N03: ["N06"],
  N04: [],
  N06: ["N04"],
  N10: ["N06", "N04"],
  N13: [],
};

export const CAUSAL_NARRATIVE_TEMPLATES_MVP = {
  expert_internal_high:
    "Lectura preliminar auditable para revision experta: dentro del alcance MVP se activa {rootNode} como nodo raiz probable, con camino {path}. La evidencia fuerte aparece en {supportScenes}; la tension o evidencia debilitante aparece en {weakeningScenes}. {trenchQuote}Esta lectura es preparatoria y no constituye dictamen final.",
  expert_internal_medium:
    "Hipotesis causal preliminar: {rootNode} aparece como nodo mas probable dentro del alcance MVP, conectado con {path}. Se sostiene principalmente en {supportScenes} y conserva tension en {weakeningScenes}. {trenchQuote}Debe leerse como insumo para composicion experta.",
  consultant_preparation:
    "Para preparar la lectura consultiva, la sesion muestra una ruta probable {path}, con {rootNode} como punto de entrada dentro del MVP. La evidencia que sostiene y debilita la hipotesis queda separada para auditoria. {trenchQuote}",
  client_safe_preview:
    "La lectura preliminar muestra tensiones estructurales consistentes con {rootNode}. Esta formulacion aun no es narrativa final para cliente y requiere revision experta antes de presentarse.",
  needsReentry:
    "Antes de cerrar la lectura causal conviene reentrar a escena porque quedan razones trazables: {reasons}.",
  needsExpertReview:
    "Se recomienda revision experta por estas razones: {reasons}.",
};
