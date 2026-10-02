import type { ActivityDeclaredContext } from "@/domain/local-work-map";

export type { ActivityDeclaredContext };

export type SessionLayer =
  | "capa_1_triple"
  | "seleccion_actividades"
  | "cuestionario_full_v03"
  | "diagnostico"
  | "capa_2_estructural"
  | "capa_2_5_s2"
  | "capa_3a_patron"
  | "pausa_s4"
  | "capa_3b_ruptura"
  | "completado";

export type EveFlowState =
  | "intake_work_map"
  | "intake_significado"
  | "intake_main_activities"
  | "questionnaire_main"
  | "closure_check"
  | "support_activity_selected_internal"
  | "support_activity_questionnaire"
  | "closure_recheck"
  | "micro_clarification"
  | "intake_completed";

export type ActivityOrigin = "usuario_redactada" | "ia_inferida";

export type Activity = {
  id: string;
  title: string;
  narrativeAnchor: string;
  origin: ActivityOrigin;
  accepted: boolean;
  critical: boolean;
  interconnectionScore: number;
  declaredContext?: ActivityDeclaredContext;
};

export type RelatoType = "ultimo_incendio" | "lo_que_no_deberia_pasar";

export type RelatoAnswer = {
  question: string;
  answer: string;
};

export type StructuralAnswer = {
  activityId: string;
  contextConfirmed: boolean;
  autonomyLevel: string;
  dependencyLevel: string;
  qualityImpact: string;
};

export type PatternAnswer = {
  questionId: string;
  label: string;
  defaultAnswer: string;
  exceptions: Record<string, string>;
};

export type AlgedonicEvent = {
  id: string;
  failureType: string;
  reaction: string;
  learning: string;
};
