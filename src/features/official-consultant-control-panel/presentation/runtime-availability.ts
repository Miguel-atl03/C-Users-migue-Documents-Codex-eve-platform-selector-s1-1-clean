/**
 * §12-A — Disponibilidad estructural de Ejecución Runtime (sin inventar datos).
 */

import type { ParticipantProfileViewModel } from "../types/participant-profile.types";

export type RuntimeAvailability =
  | "no-participant"
  | "no-profile"
  | "no-session"
  | "no-effective-selection"
  | "no-primary-activity"
  | "no-run"
  | "operational-data-unavailable"
  | "partial"
  | "available"
  | "error";

export const RUNTIME_AVAILABILITY_MESSAGES: Readonly<
  Record<RuntimeAvailability, string | null>
> = {
  "no-participant":
    "La ejecución Runtime estará disponible cuando exista una persona, un perfil funcional, una sesión funcional, una selección efectiva y una actividad primaria vinculados.",
  "no-profile":
    "Seleccione un perfil funcional para consultar la ejecución Runtime.",
  "no-session":
    "No hay una sesión funcional vinculada a este perfil.",
  "no-effective-selection":
    "No hay un resultado efectivo de selección para esta sesión funcional.",
  "no-primary-activity":
    "No hay una actividad primaria disponible para consultar Runtime.",
  "no-run":
    "Esta actividad primaria no tiene una ejecución Runtime registrada.",
  "operational-data-unavailable":
    "Existe una ejecución registrada, pero el detalle Base y Causal todavía no está disponible.",
  partial: "Los datos de ejecución están incompletos.",
  available: null,
  error: "No fue posible cargar la estructura Runtime.",
};

export const RUNTIME_STRUCTURAL_BLOCKS = [
  {
    code: "B0",
    label: "Anclaje y confirmación de actividad",
    criticalRoute: true,
  },
  {
    code: "B0.5",
    label: "Encuadre sistémico",
    criticalRoute: false,
  },
  {
    code: "B1",
    label: "Disparador",
    criticalRoute: false,
  },
  {
    code: "B2",
    label: "Transformación",
    criticalRoute: true,
  },
  {
    code: "B3",
    label: "Salida y receptor",
    criticalRoute: true,
  },
  {
    code: "B4",
    label: "Flujo real",
    criticalRoute: false,
  },
  {
    code: "B5",
    label: "Capacidad y discrecionalidad",
    criticalRoute: false,
  },
  {
    code: "B6",
    label: "Compensación y workaround",
    criticalRoute: false,
  },
  {
    code: "B7",
    label: "Verificación ligera",
    criticalRoute: true,
  },
] as const;

/**
 * Resuelve disponibilidad §12-A. Retorna null si no hay caso activo (idle).
 * Nunca declara available/partial operacional sin ledger (esta tarea no lo provee).
 */
export function resolveRuntimeAvailability(
  viewModel: ParticipantProfileViewModel,
): RuntimeAvailability | null {
  if (viewModel.status === "idle") {
    return null;
  }

  if (viewModel.status === "loading-participants") {
    return "no-participant";
  }

  if (viewModel.status === "error") {
    return "error";
  }

  if (
    viewModel.status === "empty" ||
    viewModel.participants.length === 0
  ) {
    return "no-participant";
  }

  if (!viewModel.selectedProfile) {
    return "no-profile";
  }

  if (!viewModel.selectedSessionId) {
    return "no-session";
  }

  if (viewModel.activitySelectionLoading) {
    return "no-effective-selection";
  }

  if (viewModel.activitySelectionError) {
    return "error";
  }

  const coverage = viewModel.activitySelection;
  if (!coverage || coverage.dataStatus === "unavailable") {
    return "no-effective-selection";
  }

  const primaries = coverage.primaryActivities ?? [];
  if (primaries.length === 0) {
    return "no-primary-activity";
  }

  const selectedId = viewModel.selectedActivityId;
  const selectedIsPrimary =
    selectedId != null &&
    primaries.some((item) => item.activityId === selectedId);

  if (!selectedIsPrimary) {
    return "no-primary-activity";
  }

  const runRow = viewModel.activities.find(
    (row) => row.activityId === selectedId && Boolean(row.runId),
  );

  if (!runRow) {
    return "no-run";
  }

  // §12-B bloqueado: run sin ledger Base/Causal evaluable.
  return "operational-data-unavailable";
}

export function runtimeMessageForAvailability(
  availability: RuntimeAvailability,
): string | null {
  return RUNTIME_AVAILABILITY_MESSAGES[availability];
}
