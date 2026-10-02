/** Spanish presentation labels for experience screens/statuses — no diagnosis. */

import type {
  ExperienceActionType,
  ExperienceEventType,
  ExperienceScreenStatus,
} from "@/services/eve/official-control-panel/official-control-panel-experience.types";

export const EXPERIENCE_STATUS_LABELS: Record<ExperienceScreenStatus, string> =
  {
    not_reached: "No alcanzada",
    active: "Activa",
    completed: "Completada",
    blocked: "Bloqueada",
    support_requested: "Soporte solicitado",
    abandoned: "Abandonada",
    stale: "Sin actividad reciente",
    not_applicable: "No aplicable",
  };

export const EXPERIENCE_EVENT_LABELS: Record<ExperienceEventType, string> = {
  screen_entered: "Entrada",
  screen_completed: "Completada",
  screen_blocked: "Bloqueo",
  support_requested: "Soporte solicitado",
  screen_abandoned: "Abandono",
  screen_error: "Error de pantalla",
  screen_recovered: "Recuperación",
};

export const EXPERIENCE_ACTION_LABELS: Record<ExperienceActionType, string> = {
  send_message: "Enviar mensaje de ayuda",
  resume_link: "Generar enlace de retorno",
  request_reentry: "Solicitar reentry",
  mark_manual_review: "Marcar revisión manual",
  reopen_block: "Reabrir bloque",
  session_reset: "Reset de sesión",
};

export const EXPERIENCE_MODE_INTRO =
  "Observación de la trayectoria del usuario en la plataforma. No interpreta comportamiento como evidencia del negocio.";
