/**
 * Presentación operativa §13 — sin snake_case ni tecnicismos en UI.
 */

import type {
  HandoffStatus,
  ManualTrackingStatus,
} from "@/services/eve/official-control-panel/official-control-panel-manual-work.types";

const TRACKING_LABELS: Record<ManualTrackingStatus, string> = {
  not_ready: "Aún no listo",
  ready_to_start: "Listo para iniciar",
  downloaded: "Paquete descargado",
  in_manual_work: "En trabajo manual",
  submitted: "Enviado a revisión",
  review_required: "Requiere ajuste",
  accepted: "Salida aceptada",
  blocked: "Bloqueado",
};

const HANDOFF_LABELS: Record<HandoffStatus, string> = {
  not_applicable: "Sin handoff",
  pending: "Handoff pendiente",
  accepted: "Handoff aceptado",
  closed: "Handoff cerrado",
};

const EVENT_LABELS: Record<string, string> = {
  work_ready: "Listo para trabajo",
  artifact_downloaded: "Paquete descargado",
  manual_work_started: "Trabajo manual iniciado",
  output_submitted: "Salida enviada",
  review_requested: "Se solicitó ajuste",
  review_resubmitted: "Reenviado a revisión",
  output_accepted: "Salida aceptada",
  work_blocked: "Trabajo bloqueado",
  work_unblocked: "Trabajo desbloqueado",
  handoff_pending: "Handoff pendiente registrado",
  handoff_accepted: "Handoff aceptado",
  handoff_closed: "Handoff cerrado",
};

export function presentManualTrackingStatus(status: string): string {
  return TRACKING_LABELS[status as ManualTrackingStatus] ?? status;
}

export function presentHandoffStatus(status: string): string {
  return HANDOFF_LABELS[status as HandoffStatus] ?? status;
}

export function presentManualEventType(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export const MANUAL_WORK_INTRO_COPY =
  "Este seguimiento registra el avance técnico de las entregas manuales. La aceptación del resultado se confirma por separado.";
