/**
 * Official Control Panel — Unit 1 shell types.
 * No business fixtures. No remote data contracts.
 */

export type OfficialPanelMode =
  | "client-company"
  | "user-experience-governance";

export type ClientCompanyView = "monitoring" | "tracking" | "governance";

/** §§15–16 Experience mode views (distinct from Empresa Cliente subviews). */
export type ExperienceGovernanceView =
  | "journeys"
  | "support"
  | "screen_health";

export type OfficialPanelShellState = "ready-empty" | "loading" | "error";

/** Internal shell readiness — not shown in product UI. */
export type OfficialPanelContextStatus = "loading" | "ready" | "error";

/** Internal factual data presence — not shown in product UI. */
export type OfficialPanelDataStatus =
  | "empty"
  | "available"
  | "partial"
  | "error";

export type DataAvailability =
  | "no-context"
  | "loading"
  | "available"
  | "error";

export type ContextDrawerState = "collapsed" | "expanded";

export type OfficialControlPanelNavigationState = {
  mode: OfficialPanelMode;
  view: ClientCompanyView | ExperienceGovernanceView;
  shellState: OfficialPanelShellState;
};

export const DEFAULT_DATA_AVAILABILITY: DataAvailability = "no-context";

export const OFFICIAL_PANEL_MODES = [
  "client-company",
  "user-experience-governance",
] as const satisfies readonly OfficialPanelMode[];

export const CLIENT_COMPANY_VIEWS = [
  "monitoring",
  "tracking",
  "governance",
] as const satisfies readonly ClientCompanyView[];

export const EXPERIENCE_GOVERNANCE_VIEWS = [
  "journeys",
  "support",
  "screen_health",
] as const satisfies readonly ExperienceGovernanceView[];

export const EXPERIENCE_GOVERNANCE_VIEW_COPY: Record<
  ExperienceGovernanceView,
  { label: string; title: string; emptyTitle: string; emptyMessage: string }
> = {
  journeys: {
    label: "Trayectorias",
    title: "Trayectorias de experiencia",
    emptyTitle: "Sin experience events",
    emptyMessage:
      "Sin eventos de experiencia registrados.",
  },
  support: {
    label: "Soporte",
    title: "Cola de soporte de experiencia",
    emptyTitle: "Sin solicitudes de soporte",
    emptyMessage: "Sin solicitudes de soporte.",
  },
  screen_health: {
    label: "Salud de pantallas",
    title: "Salud de pantallas",
    emptyTitle: "Sin información disponible",
    emptyMessage: "Sin información disponible.",
  },
};

export const OFFICIAL_PANEL_SHELL_STATES = [
  "ready-empty",
  "loading",
  "error",
] as const satisfies readonly OfficialPanelShellState[];

/** Franja visible: situacionales (ex-cabecera) + shells métricos. */
export const CLIENT_COMPANY_KPI_LABELS = [
  "Estado actual",
  "Próximo paso",
  "Atención requerida",
  "Hitos core alcanzados",
  "Alertas de experiencia",
] as const;

/** Reservados para monitoreo profundo — no en franja global. */
export const CLIENT_COMPANY_DEEP_MONITORING_KPI_LABELS = [
  "Usuarios",
  "Roles funcionales",
  "Actividades primarias",
  "Procesos manuales",
  "Findings / rework",
] as const;

export const CORE_STATUS_BAND_EMPTY = {
  processLabel: "Resumen auxiliar del caso",
  caseLabel: "Sin empresa seleccionada",
  caseState: "No disponible",
  nextEvent: "No disponible",
  timerPolicy: "No disponible",
} as const;

export const CORE_MILESTONE_EMPTY_NOTE = "Sin empresa seleccionada";

export const PROCESS_AXIS_EMPTY_LABEL = "Sin empresa seleccionada";

export const CONTEXT_DRAWER_EMPTY = {
  title: "Seleccione una empresa cliente.",
  message:
    "Seleccione una empresa cliente, una relación activa y un caso en curso para consultar atención requerida.",
} as const;

export const CLIENT_COMPANY_VIEW_COPY: Record<
  ClientCompanyView,
  { label: string; title: string; emptyTitle: string; emptyMessage: string }
> = {
  monitoring: {
    label: "Monitoreo",
    title: "Monitoreo de Empresa Cliente",
    emptyTitle: "Seleccione una empresa cliente.",
    emptyMessage:
      "Seleccione una empresa cliente, una relación activa y un caso en curso para consultar el monitoreo.",
  },
  tracking: {
    label: "Seguimiento",
    title: "Seguimiento de Empresa Cliente",
    emptyTitle: "Seleccione una empresa cliente.",
    emptyMessage:
      "Seleccione una empresa cliente, una relación activa y un caso en curso para consultar el seguimiento.",
  },
  governance: {
    label: "Gobernanza",
    title: "Gobernanza de Empresa Cliente",
    emptyTitle: "Seleccione una empresa cliente.",
    emptyMessage:
      "Seleccione una empresa cliente, una relación activa y un caso en curso para consultar la gobernanza.",
  },
};
