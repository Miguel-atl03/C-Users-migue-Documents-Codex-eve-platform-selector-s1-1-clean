import type { ActivitySelectionCoverageView } from "@/services/eve/official-control-panel/official-control-panel-activity-selection.types";
import type { ParticipantProfileViewModel } from "../types/participant-profile.types";

export type ActivityCoverageAvailability =
  | "no-participant"
  | "no-profile"
  | "no-session"
  | "loading"
  | "no-effective-result"
  | "partial"
  | "available"
  | "error";

export const ACTIVITY_COVERAGE_AVAILABILITY_MESSAGES: Readonly<
  Record<ActivityCoverageAvailability, string | null>
> = {
  "no-participant":
    "No hay personas participantes registradas para este caso. La cobertura de actividades estará disponible cuando exista una persona, un perfil y una sesión funcional vinculados.",
  "no-profile":
    "Seleccione un perfil funcional para consultar la cobertura de actividades.",
  "no-session":
    "No hay una sesión funcional vinculada a este perfil.",
  loading: null,
  "no-effective-result":
    "No hay un resultado de selección registrado para esta sesión funcional.",
  partial: "El resultado de selección está incompleto.",
  available: null,
  error: "No fue posible cargar la cobertura de actividades.",
};

/**
 * Resuelve la disponibilidad causal de §11 sin inventar datos factuales.
 * Retorna null cuando no hay caso activo (status idle).
 */
export function resolveActivityCoverageAvailability(
  viewModel: ParticipantProfileViewModel,
): ActivityCoverageAvailability | null {
  if (viewModel.status === "idle") {
    return null;
  }

  if (viewModel.status === "loading-participants") {
    return "loading";
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
    return "loading";
  }

  if (viewModel.activitySelectionError) {
    return "error";
  }

  const coverage = viewModel.activitySelection;
  if (!coverage || coverage.dataStatus === "unavailable") {
    return "no-effective-result";
  }

  if (coverage.dataStatus === "partial") {
    return "partial";
  }

  return "available";
}

export function coverageMessageForAvailability(
  availability: ActivityCoverageAvailability,
  coverage: ActivitySelectionCoverageView | null,
): string | null {
  if (availability === "available" || availability === "partial") {
    return (
      ACTIVITY_COVERAGE_AVAILABILITY_MESSAGES[availability] ??
      coverage?.message ??
      null
    );
  }
  if (availability === "loading") {
    return "Cargando cobertura de actividades…";
  }
  return ACTIVITY_COVERAGE_AVAILABILITY_MESSAGES[availability];
}
