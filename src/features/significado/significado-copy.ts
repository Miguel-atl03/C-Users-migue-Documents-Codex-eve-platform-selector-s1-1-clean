export const SIGNIFICADO_UI_VERSION = "1.0.0-frozen";

export const SIGNIFICADO_SCREEN_TITLE = "Significado de tu trabajo";

export const SIGNIFICADO_SCREEN_SUBTITLE =
  "Vamos a entender una actividad concreta de tu mapa antes de continuar con las preguntas.";

export const SIGNIFICADO_SCREEN_EXPLANATION =
  "Algunas actividades se recorrerán con mayor profundidad. El resto de tu mapa se conserva como contexto.";

export const SIGNIFICADO_SIDE_CARD_TITLE = "Actividad actual";

export const SIGNIFICADO_SIDE_CARD_BODY =
  "Estamos recorriendo una actividad de tu mapa para prepararla antes de las preguntas.";

export const SIGNIFICADO_ACTIVITY_LABEL = "Actividad actual";

export const SIGNIFICADO_CARD_TITLE = "Actividad que revisas";

export const SIGNIFICADO_TABLE_HEADER_SECTION = "Sección";

export const SIGNIFICADO_TABLE_HEADER_CONTENT = "Revisa y confirma";

export const SIGNIFICADO_INTRO_TITLE =
  "Esto es lo que EVE entendió desde tu mapa. Revísalo y corrige lo necesario.";

export const SIGNIFICADO_INTRO_BODY =
  "Estos campos vienen prellenados desde tu Mapa del trabajo. Al continuar, confirmas o corriges esta descripción.";

export const SIGNIFICADO_INTRO_BADGE = "Requiere confirmación";

export const SIGNIFICADO_PREFILL_BADGE = "Prellenado desde tu Mapa del trabajo";

export const SIGNIFICADO_REQUIRES_CONFIRMATION_BADGE = "Requiere confirmación";

export const SIGNIFICADO_CONTEXT_SUGGESTION_HINT =
  "Sugerencia desde el contexto; corrige si no aplica.";

export const SIGNIFICADO_BOUNDARY_CONFIRMATION_HELP =
  "Confirma o ajusta dónde empieza y dónde termina realmente esta actividad.";

export const SIGNIFICADO_CONTINUE_CONFIRMATION_NOTICE =
  "Al continuar, confirmas esta información para la actividad que estás revisando.";

export const SIGNIFICADO_BLOCK0_INCOMPLETE_NOTICE =
  "Completa y confirma las secciones pendientes antes de continuar.";

export const SIGNIFICADO_CONTEXT_BAR =
  "No se elimina ninguna actividad de tu mapa. Las actividades no recorridas quedan como contexto.";

export const SIGNIFICADO_SAVED_WITH_WARNINGS_NOTICE =
  "Algunas partes de tu mapa quedaron con estructura incompleta. Puedes continuar si reconoces este aviso.";

export const SIGNIFICADO_SAVE_REQUIRED_NOTICE =
  "Primero guarda tu mapa de trabajo para poder continuar.";

export const SIGNIFICADO_CTA_BACK = "Volver al mapa";
export const SIGNIFICADO_CTA_CONTINUE_NEXT = "Continuar a la siguiente actividad";
export const SIGNIFICADO_CTA_CONTINUE_QUESTIONS = "Continuar a las preguntas";

export const SIGNIFICADO_JOURNEY_STEPS = [
  { id: "ubicar", label: "Ubicar trabajo", status: "completed" as const },
  { id: "responsabilidad", label: "Responsabilidad", status: "completed" as const },
  { id: "actividades", label: "Actividades", status: "completed" as const },
  { id: "guardar", label: "Guardar mapa", status: "completed" as const },
  { id: "significado", label: "Trabajo que realizas", status: "active" as const },
];

export const SIGNIFICADO_REQUIRED_BADGE = "Obligatoria";
export const SIGNIFICADO_OPTIONAL_BADGE = "Opcional";

/** F1 visual chips — lenguaje de trinchera, no metadatos técnicos */
export const SIGNIFICADO_CHIP_FROM_WORKMAP = "Desde tu mapa";
export const SIGNIFICADO_CHIP_SUGGESTION = "Sugerencia";
export const SIGNIFICADO_CHIP_REVIEW = "Revisa esto";
export const SIGNIFICADO_CHIP_REQUIRED = "Obligatorio";

export const SIGNIFICADO_SUBFIELD_SUGGESTION_NOTE =
  "Sugerencia desde tu mapa. Corrige si no aplica.";

export const SIGNIFICADO_BLOCK0_PROGRESS_LABEL = "Progreso del recorrido";

export function formatActivityProgress(current: number, total: number): string {
  return `Actividad ${current} de ${total}`;
}

export function formatBlock0QuestionProgress(prepared: number, total: number): string {
  return `${prepared}/${total} secciones listas para revisar`;
}

export const SIGNIFICADO_SIDEBAR_FOOTER_LEAD =
  "Strategic & Operational Architecture";

export const SIGNIFICADO_SIDEBAR_FOOTER_SUB = "Enterprise Viability Engine";

export function deriveShortActivityName(activityLiteral: string): string {
  const trimmed = activityLiteral.trim();
  if (!trimmed) return "";

  const firstSentence = trimmed.split(/[.,;]/)[0]?.trim() ?? trimmed;
  if (firstSentence.length <= 72) return firstSentence;

  return `${firstSentence.slice(0, 71).trim()}...`;
}

export function resolveUserInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function resolveContinueCta(hasMultipleActivities: boolean): string {
  return hasMultipleActivities
    ? SIGNIFICADO_CTA_CONTINUE_NEXT
    : SIGNIFICADO_CTA_CONTINUE_QUESTIONS;
}
