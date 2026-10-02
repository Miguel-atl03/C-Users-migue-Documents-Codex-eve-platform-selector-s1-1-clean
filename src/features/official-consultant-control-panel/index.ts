/**

 * Official Consultant Control Panel — Unit 1 public barrel.

 * Non-UI exports only (safe for node:test). Import shell from components/.

 */



export {

  OFFICIAL_CONTROL_PANEL_STATUS,

  officialConsultantControlPanelShellEnabled,

} from "./config/official-control-panel-status";

export type { OfficialControlPanelStatus } from "./config/official-control-panel-status";



export {

  OFFICIAL_CONTROL_PANEL_PATH,

  DEFAULT_OFFICIAL_PANEL_NAVIGATION,

  parseOfficialControlPanelNavigation,

  buildOfficialControlPanelSearchParams,

  officialControlPanelHref,

} from "./state/official-control-panel-navigation";



export type {

  OfficialPanelMode,

  ClientCompanyView,

  OfficialPanelShellState,

  OfficialControlPanelNavigationState,

  DataAvailability,

  ContextDrawerState,

} from "./types/official-control-panel.types";



export {

  OFFICIAL_PANEL_MODES,

  CLIENT_COMPANY_VIEWS,

  OFFICIAL_PANEL_SHELL_STATES,

  CLIENT_COMPANY_KPI_LABELS,

  CLIENT_COMPANY_DEEP_MONITORING_KPI_LABELS,

  CLIENT_COMPANY_VIEW_COPY,

  DEFAULT_DATA_AVAILABILITY,

  CORE_STATUS_BAND_EMPTY,

  CORE_MILESTONE_EMPTY_NOTE,

  PROCESS_AXIS_EMPTY_LABEL,

  CONTEXT_DRAWER_EMPTY,

} from "./types/official-control-panel.types";



