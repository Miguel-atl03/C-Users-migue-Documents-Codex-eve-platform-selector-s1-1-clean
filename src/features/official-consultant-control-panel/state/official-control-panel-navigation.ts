import {

  CLIENT_COMPANY_VIEWS,

  EXPERIENCE_GOVERNANCE_VIEWS,

  OFFICIAL_PANEL_MODES,

  OFFICIAL_PANEL_SHELL_STATES,

  type ClientCompanyView,

  type ExperienceGovernanceView,

  type OfficialControlPanelNavigationState,

  type OfficialPanelMode,

  type OfficialPanelShellState,

} from "../types/official-control-panel.types";



export const OFFICIAL_CONTROL_PANEL_PATH =

  "/admin/official-consultant-control-panel";



export const DEFAULT_OFFICIAL_PANEL_NAVIGATION: OfficialControlPanelNavigationState =

  {

    mode: "client-company",

    view: "monitoring",

    shellState: "ready-empty",

  };



function firstParam(

  value: string | string[] | undefined | null,

): string | null {

  if (typeof value === "string") return value;

  if (Array.isArray(value) && typeof value[0] === "string") return value[0];

  return null;

}



function isOfficialPanelMode(value: string): value is OfficialPanelMode {

  return (OFFICIAL_PANEL_MODES as readonly string[]).includes(value);

}



function isClientCompanyView(value: string): value is ClientCompanyView {

  return (CLIENT_COMPANY_VIEWS as readonly string[]).includes(value);

}



function isExperienceGovernanceView(

  value: string,

): value is ExperienceGovernanceView {

  return (EXPERIENCE_GOVERNANCE_VIEWS as readonly string[]).includes(value);

}



function isShellState(value: string): value is OfficialPanelShellState {

  return (OFFICIAL_PANEL_SHELL_STATES as readonly string[]).includes(value);

}



/**

 * Normalizes query params. Invalid values fall back to defaults.

 * shellState is only honored outside production (dev-only diagnostic).

 * Experience mode (§15) is allowed; view normalizes to journeys|support|screen_health.

 */

export function parseOfficialControlPanelNavigation(

  params: Record<string, string | string[] | undefined> | URLSearchParams,

  options?: { allowShellStateOverride?: boolean },

): OfficialControlPanelNavigationState {

  const get = (key: string): string | null => {

    if (params instanceof URLSearchParams) {

      return params.get(key);

    }

    return firstParam(params[key]);

  };



  const modeRaw = get("mode");

  const viewRaw = get("view");

  const shellRaw = get("shellState");



  const mode: OfficialPanelMode =

    modeRaw && isOfficialPanelMode(modeRaw)

      ? modeRaw

      : DEFAULT_OFFICIAL_PANEL_NAVIGATION.mode;



  let view: ClientCompanyView | ExperienceGovernanceView =

    DEFAULT_OFFICIAL_PANEL_NAVIGATION.view;



  if (mode === "user-experience-governance") {

    view =

      viewRaw && isExperienceGovernanceView(viewRaw) ? viewRaw : "journeys";

  } else if (viewRaw && isClientCompanyView(viewRaw)) {

    view = viewRaw;

  } else if (viewRaw && isExperienceGovernanceView(viewRaw)) {

    // Experience views are not valid under Empresa Cliente mode.

    view = DEFAULT_OFFICIAL_PANEL_NAVIGATION.view;

  }



  const allowShell =

    options?.allowShellStateOverride ??

    process.env.NODE_ENV !== "production";



  let shellState: OfficialPanelShellState =

    DEFAULT_OFFICIAL_PANEL_NAVIGATION.shellState;

  if (allowShell && shellRaw && isShellState(shellRaw)) {

    shellState = shellRaw;

  }



  return {

    mode,

    view,

    shellState,

  };

}



export function buildOfficialControlPanelSearchParams(

  state: Pick<OfficialControlPanelNavigationState, "mode" | "view"> & {

    shellState?: OfficialPanelShellState;

  },

  options?: { includeShellState?: boolean },

): URLSearchParams {

  const next = new URLSearchParams();

  next.set("mode", state.mode);

  next.set("view", state.view);

  if (

    options?.includeShellState &&

    state.shellState &&

    state.shellState !== "ready-empty"

  ) {

    next.set("shellState", state.shellState);

  }

  return next;

}



export function officialControlPanelHref(

  state: Pick<OfficialControlPanelNavigationState, "mode" | "view"> & {

    shellState?: OfficialPanelShellState;

  },

  options?: { includeShellState?: boolean },

): string {

  const qs = buildOfficialControlPanelSearchParams(state, options).toString();

  return qs

    ? `${OFFICIAL_CONTROL_PANEL_PATH}?${qs}`

    : OFFICIAL_CONTROL_PANEL_PATH;

}


