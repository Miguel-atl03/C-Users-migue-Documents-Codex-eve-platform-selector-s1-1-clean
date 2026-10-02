import type { ClientContextStatus } from "../types/client-context.types";
import type { ClientCompanyView } from "../types/official-control-panel.types";

export type ClientContextShellCopy = {
  bandProcessLabel: string;
  bandCaseLabel: string;
  bandCaseState: string;
  bandNextEvent: string;
  bandTimer: string;
  processAxisLabel: string;
  railTitle: string;
  railNote: string;
  workspaceTitle: string;
  workspaceMessage: string;
  drawerTitle: string;
  drawerMessage: string;
};

export type ClientContextErrorKind = "session" | "context" | "network";

const OPERATIONAL_UNAVAILABLE = "No disponible";

export const SESSION_VALIDATION_ERROR =
  "No fue posible validar la sesión del Consultor.";
export const CONTEXT_ACCESS_ERROR =
  "No fue posible abrir el contexto solicitado.";
export const CONTEXT_NETWORK_ERROR = "No fue posible cargar el contexto.";

export function presentClientContextShellCopy(input: {
  status: ClientContextStatus;
  view: ClientCompanyView;
  caseStatusLabel?: string | null;
  caseLabel?: string | null;
  errorKind?: ClientContextErrorKind | null;
}): ClientContextShellCopy {
  const viewLabel =
    input.view === "tracking"
      ? "seguimiento"
      : input.view === "governance"
        ? "gobernanza"
        : "monitoreo";

  const base = {
    bandProcessLabel: "Resumen auxiliar del caso",
    bandCaseState: OPERATIONAL_UNAVAILABLE,
    bandNextEvent: OPERATIONAL_UNAVAILABLE,
    bandTimer: OPERATIONAL_UNAVAILABLE,
    railTitle: "Hitos core del caso",
  };

  if (input.status === "error") {
    const kind = input.errorKind ?? "context";
    if (kind === "session") {
      return {
        ...base,
        bandCaseLabel: "Sesión no validada",
        processAxisLabel: "Sesión no validada",
        railNote: "Sesión no validada",
        workspaceTitle: SESSION_VALIDATION_ERROR,
        workspaceMessage:
          "Será redirigido al acceso oficial de la plataforma para iniciar sesión de Consultor.",
        drawerTitle: "Sesión no validada.",
        drawerMessage: SESSION_VALIDATION_ERROR,
      };
    }
    if (kind === "network") {
      return {
        ...base,
        bandCaseLabel: "Contexto no disponible",
        processAxisLabel: "Contexto no disponible",
        railNote: "Contexto no disponible",
        workspaceTitle: CONTEXT_NETWORK_ERROR,
        workspaceMessage:
          "Reintente la carga del contexto o verifique la conectividad local.",
        drawerTitle: "Contexto no disponible.",
        drawerMessage: CONTEXT_NETWORK_ERROR,
      };
    }
    return {
      ...base,
      bandCaseLabel: "Contexto no disponible",
      processAxisLabel: "Contexto no disponible",
      railNote: "Contexto no disponible",
      workspaceTitle: CONTEXT_ACCESS_ERROR,
      workspaceMessage:
        "Reintente la carga del contexto o seleccione nuevamente una empresa autorizada.",
      drawerTitle: "Contexto no disponible.",
      drawerMessage: CONTEXT_ACCESS_ERROR,
    };
  }

  if (
    input.status === "loading-companies" ||
    input.status === "loading-relationships" ||
    input.status === "loading-cases"
  ) {
    return {
      ...base,
      bandCaseLabel: "Cargando contexto…",
      processAxisLabel: "Cargando contexto…",
      railNote: "Cargando contexto…",
      workspaceTitle: "Cargando contexto…",
      workspaceMessage:
        "Espere mientras se resuelve la empresa, la relación activa y el caso en curso.",
      drawerTitle: "Cargando contexto…",
      drawerMessage:
        "Espere mientras se completa la carga del contexto operativo.",
    };
  }

  if (input.status === "active") {
    const caseLabel =
      typeof input.caseLabel === "string" && input.caseLabel.trim().length > 0
        ? input.caseLabel.trim()
        : "Contexto activo";
    return {
      ...base,
      bandCaseLabel: caseLabel,
      bandCaseState: input.caseStatusLabel ?? OPERATIONAL_UNAVAILABLE,
      processAxisLabel: "Contexto activo",
      railNote: "Contexto activo",
      workspaceTitle: "Contexto activo.",
      workspaceMessage:
        "Las vistas operativas se habilitarán en las siguientes unidades.",
      drawerTitle: "Atención y Gobernanza",
      drawerMessage: "Sin alertas activas para el caso.",
    };
  }

  if (input.status === "no-relationship") {
    return {
      ...base,
      bandCaseLabel: "Sin relación activa",
      processAxisLabel: "Sin relación activa",
      railNote: "Sin relación activa",
      workspaceTitle: "Seleccione una relación activa.",
      workspaceMessage:
        "Elija la relación vigente asociada a la empresa cliente seleccionada.",
      drawerTitle: "Seleccione una relación activa.",
      drawerMessage:
        "Se requiere una relación activa antes de consultar atención requerida.",
    };
  }

  if (input.status === "no-case") {
    return {
      ...base,
      bandCaseLabel: "Sin caso en curso",
      processAxisLabel: "Sin caso en curso",
      railNote: "Sin caso en curso",
      workspaceTitle: "Seleccione un caso en curso.",
      workspaceMessage:
        "Elija el caso vinculado a la relación activa para consultar el panel.",
      drawerTitle: "Seleccione un caso en curso.",
      drawerMessage:
        "Se requiere un caso en curso antes de consultar atención requerida.",
    };
  }

  return {
    ...base,
    bandCaseLabel: "Sin empresa seleccionada",
    processAxisLabel: "Sin empresa seleccionada",
    railNote: "Sin empresa seleccionada",
    workspaceTitle: "Seleccione una empresa cliente.",
    workspaceMessage: `Seleccione una empresa cliente, una relación activa y un caso en curso para consultar el ${viewLabel}.`,
    drawerTitle: "Seleccione una empresa cliente.",
    drawerMessage:
      "Seleccione una empresa cliente, una relación activa y un caso en curso para consultar atención requerida.",
  };
}
