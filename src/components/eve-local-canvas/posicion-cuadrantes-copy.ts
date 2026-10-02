/**
 * Copy for Posición cuadrantes visual candidate (browser-approved mock v4).
 * Wired into productive intake_sheet via LocalEstadoAPositionCuadrantesSection.
 */

import type { StartPositionContext } from "@/domain/start-position-context";

export type PosicionCuadrantesState = {
  role: string;
  roleOther: string;
  /** Tras Guardar: el texto de Otro deja de ser línea y pasa a inscripción. */
  otherEngraved: boolean;
  decision: string;
  /** true cuando las marcas actuales coinciden con el último Guardar. */
  sheetSaved: boolean;
};

export const EMPTY_POSICION_CUADRANTES_STATE: PosicionCuadrantesState = {
  role: "",
  roleOther: "",
  otherEngraved: false,
  decision: "",
  sheetSaved: false,
};

export const POSICION_ROLE_QUESTION =
  "¿Cuando el trabajo ocurre, qué papel sueles ocupar?";

export const POSICION_DECISION_QUESTION =
  "Cuando hay que decidir algo, ¿qué suele pasar contigo?";

/** Microfrases de baja intensidad — orientan, contienen, cierran. */
export const POSICION_BREATH =
  "Tómate un momento. Responde desde lo que ocurre normalmente.";


export type PosicionMarkLayout =
  | "nwM1"
  | "nwM2"
  | "nwM3"
  | "swM1"
  | "swM2"
  | "swM3"
  | "swM4"
  | "neM1"
  | "neM2"
  | "neM3"
  | "seM1"
  | "seM2"
  | "seM3";

export type PosicionOption = {
  id: string;
  label: string;
  layout: PosicionMarkLayout;
  group: "role" | "decision";
};

export const POSICION_CUADRANTES_OPTIONS: PosicionOption[] = [
  {
    id: "define_rumbo",
    label: "Defino el rumbo y las prioridades.",
    layout: "nwM1",
    group: "role",
  },
  {
    id: "direct_area",
    label: "Dirijo una parte del trabajo o un área.",
    layout: "nwM2",
    group: "role",
  },
  {
    id: "coordinate",
    label: "Coordino el trabajo de otras personas.",
    layout: "nwM3",
    group: "role",
  },
  {
    id: "prepare_info",
    label: "Preparo información, análisis o alternativas.",
    layout: "swM1",
    group: "role",
  },
  {
    id: "deliver_results",
    label: "Realizo el trabajo y entrego resultados.",
    layout: "swM2",
    group: "role",
  },
  {
    id: "external_support",
    label: "Apoyo desde fuera de la empresa.",
    layout: "swM3",
    group: "role",
  },
  {
    id: "other",
    label: "Otro.",
    layout: "swM4",
    group: "role",
  },
  {
    id: "decide_final",
    label: "Tomo la decisión y asumo la responsabilidad final.",
    layout: "neM1",
    group: "decision",
  },
  {
    id: "decide_together",
    label: "Decido junto con otras personas.",
    layout: "neM2",
    group: "decision",
  },
  {
    id: "prepare_recommend",
    label: "Preparo opciones o recomendaciones; alguien más decide.",
    layout: "neM3",
    group: "decision",
  },
  {
    id: "execute_decided",
    label: "Ejecuto una decisión que ya fue tomada.",
    layout: "seM1",
    group: "decision",
  },
  {
    id: "receive_effects",
    label: "Recibo sus efectos, pero no intervengo en ella.",
    layout: "seM2",
    group: "decision",
  },
  {
    id: "depends_situation",
    label: "Depende del tipo de situación.",
    layout: "seM3",
    group: "decision",
  },
];

/** Isla 1 lista + isla 2 lista. */
export function isPosicionCuadrantesComplete(state: PosicionCuadrantesState): boolean {
  if (!state.role || !state.decision) return false;
  if (state.role === "other" && !state.roleOther.trim()) return false;
  return true;
}

/**
 * incomplete — mist, no hay nada que grabar aún
 * ready — ink Guardar (completo y hay cambio pendiente)
 * saved — mist Guardado (completo y ya grabado)
 */
export type PosicionTraceStatus = "incomplete" | "ready" | "saved";

export function getPosicionTraceStatus(state: PosicionCuadrantesState): PosicionTraceStatus {
  if (!isPosicionCuadrantesComplete(state)) return "incomplete";
  if (state.sheetSaved) return "saved";
  return "ready";
}

/** Tras Guardar: graba Otro si aplica y marca la hoja como salvada. */
export function commitPosicionCuadrantes(state: PosicionCuadrantesState): PosicionCuadrantesState {
  if (state.role === "other" && state.roleOther.trim()) {
    return {
      ...state,
      roleOther: state.roleOther.trim(),
      otherEngraved: true,
      sheetSaved: true,
    };
  }
  return {
    ...state,
    otherEngraved: false,
    sheetSaved: true,
  };
}

/** Cualquier cambio de marca vuelve a exigir Guardar. */
export function touchPosicionCuadrantes(
  state: PosicionCuadrantesState,
  patch: Partial<PosicionCuadrantesState>,
): PosicionCuadrantesState {
  return {
    ...state,
    ...patch,
    sheetSaved: false,
  };
}

export function resolveRoleMarkLabel(
  option: PosicionOption,
  state: PosicionCuadrantesState,
): string {
  if (
    option.id === "other" &&
    state.role === "other" &&
    state.otherEngraved &&
    state.roleOther.trim()
  ) {
    return state.roleOther.trim();
  }
  return option.label;
}

/** Maps authorized cuadrantes ids → productive StartPositionContext contract. */
const POSICION_ROLE_TO_PARTICIPATION: Record<string, string> = {
  define_rumbo: "owner_general_management",
  direct_area: "area_leader",
  coordinate: "supervisor",
  prepare_info: "analyst",
  deliver_results: "support",
  external_support: "external_advisor",
  other: "other",
};

const POSICION_DECISION_TO_PROXIMITY: Record<string, string> = {
  decide_final: "take_directly",
  decide_together: "participate",
  prepare_recommend: "propose_prepare",
  execute_decided: "execute_when_decided",
  receive_effects: "impact_only",
  depends_situation: "participate",
};

const PARTICIPATION_TO_POSICION_ROLE: Record<string, string> = {
  owner_general_management: "define_rumbo",
  area_leader: "direct_area",
  supervisor: "coordinate",
  analyst: "prepare_info",
  support: "deliver_results",
  external_advisor: "external_support",
  other: "other",
};

const PROXIMITY_TO_POSICION_DECISION: Record<string, string> = {
  take_directly: "decide_final",
  participate: "decide_together",
  propose_prepare: "prepare_recommend",
  execute_when_decided: "execute_decided",
  impact_only: "receive_effects",
};

export function mapPosicionCuadrantesToStartPositionContext(
  state: PosicionCuadrantesState,
): StartPositionContext {
  return {
    participationPlace: POSICION_ROLE_TO_PARTICIPATION[state.role] ?? "",
    participationPlaceOther:
      state.role === "other" ? state.roleOther.trim() : "",
    decisionProximity: POSICION_DECISION_TO_PROXIMITY[state.decision] ?? "",
  };
}

export function mapStartPositionContextToPosicionCuadrantes(
  context: StartPositionContext,
  sheetSaved = false,
): PosicionCuadrantesState {
  const role = PARTICIPATION_TO_POSICION_ROLE[context.participationPlace] ?? "";
  const decision = PROXIMITY_TO_POSICION_DECISION[context.decisionProximity] ?? "";
  const roleOther =
    context.participationPlace === "other" ? context.participationPlaceOther : "";

  return {
    role,
    roleOther,
    otherEngraved: role === "other" && Boolean(roleOther.trim()) && sheetSaved,
    decision,
    sheetSaved:
      sheetSaved &&
      Boolean(role) &&
      Boolean(decision) &&
      (role !== "other" || Boolean(roleOther.trim())),
  };
}
