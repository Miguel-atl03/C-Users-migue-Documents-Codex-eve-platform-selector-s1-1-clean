/**
 * R2 — availableActions computation (server-side only).
 * UI must not invent capabilities or enable buttons heuristically.
 */

import type { CapabilityVM } from "./official-control-panel-contract.types";
import { resolveCapabilityAllowed } from "./official-control-panel-capability-catalog";
import type {
  ManualTrackingStatus,
  ManualWorkActionId,
  ManualWorkArtifactView,
  ManualWorkAvailableActionView,
} from "./official-control-panel-manual-work.types";

const ACTION_LABELS: Record<ManualWorkActionId, string> = {
  download_package: "Descargar paquete",
  register_start: "Registrar inicio",
  attach_output: "Adjuntar salida",
  submit_review: "Enviar a revisión",
  accept_output: "Aceptar salida",
};

const ACTION_ORDER: ManualWorkActionId[] = [
  "download_package",
  "register_start",
  "attach_output",
  "submit_review",
  "accept_output",
];

export function presentManualActionReason(reasonCode: string | null): string | null {
  if (!reasonCode) return null;
  switch (reasonCode) {
    case "must_download_package":
      return "Primero debe descargar el paquete.";
    case "must_register_start":
      return "Debe registrar el inicio del trabajo manual.";
    case "must_attach_output":
      return "Debe adjuntar una salida antes de enviarla.";
    case "input_package_missing":
      return "No hay un paquete fuente válido para descargar.";
    case "not_submitted":
      return "La salida aún no fue enviada a revisión.";
    case "capability_absent":
      return "No tiene autorización para esta acción.";
    case "accept_requires_capability":
      return "No tiene autorización para aceptar esta salida.";
    case "wrong_status":
      return "El estado actual no permite esta acción.";
    default:
      return "Esta acción no está disponible ahora.";
  }
}

export function computeManualWorkAvailableActions(input: {
  status: ManualTrackingStatus;
  capabilities: CapabilityVM[];
  latestInputArtifact: ManualWorkArtifactView | null;
  hasValidInputPackage: boolean;
  latestOutputArtifact: ManualWorkArtifactView | null;
  submittedArtifactVersionId: string | null;
  submittedArtifactChecksumValid?: boolean;
}): ManualWorkAvailableActionView[] {
  const canManage = resolveCapabilityAllowed(
    input.capabilities,
    "manage_manual_work",
  );
  const canAccept = resolveCapabilityAllowed(
    input.capabilities,
    "accept_manual_output",
  );

  return ACTION_ORDER.map((action) => {
    const label = ACTION_LABELS[action];
    let allowed = false;
    let reasonCode: string | null = null;

    switch (action) {
      case "download_package":
        if (!canManage) reasonCode = "capability_absent";
        else if (input.status !== "ready_to_start") reasonCode = "wrong_status";
        else if (!input.hasValidInputPackage)
          reasonCode = "input_package_missing";
        else allowed = true;
        break;
      case "register_start":
        if (!canManage) reasonCode = "capability_absent";
        else if (input.status !== "downloaded")
          reasonCode =
            input.status === "ready_to_start"
              ? "must_download_package"
              : "wrong_status";
        else allowed = true;
        break;
      case "attach_output":
        if (!canManage) reasonCode = "capability_absent";
        else if (!["in_manual_work", "review_required"].includes(input.status))
          reasonCode =
            input.status === "downloaded" || input.status === "ready_to_start"
              ? "must_register_start"
              : "wrong_status";
        else allowed = true;
        break;
      case "submit_review":
        if (!canManage) reasonCode = "capability_absent";
        else if (!["in_manual_work", "review_required"].includes(input.status))
          reasonCode = "wrong_status";
        else if (!input.latestOutputArtifact) reasonCode = "must_attach_output";
        else allowed = true;
        break;
      case "accept_output":
        if (!canAccept) reasonCode = "accept_requires_capability";
        else if (input.status !== "submitted") reasonCode = "not_submitted";
        else if (!input.submittedArtifactVersionId)
          reasonCode = "must_attach_output";
        else if (input.submittedArtifactChecksumValid === false)
          reasonCode = "must_attach_output";
        else allowed = true;
        break;
    }

    return {
      action,
      allowed,
      reasonCode: allowed ? null : reasonCode,
      label,
    };
  });
}
