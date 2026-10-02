/**
 * Single metadata source for the official EVE Control Panel.
 * Unit 1 keeps implementationStarted=false (shell only; no real data).
 */

export const OFFICIAL_CONTROL_PANEL_STATUS = {
  status: "design_pending",
  implementationStarted: false,
  official: true,
  label: "Panel de Control EVE — Oficial",
  canonicalDocument:
    "Diseno_Panel_Control_EVE_Empresa_Cliente_Matriz_XY_Gobernanza_Experiencia_v1_0.docx",
} as const;

/**
 * Shell route gate. Default ON (opt-out) per Unit 1 acceptance.
 * Set EVE_OFFICIAL_CONSULTANT_CONTROL_PANEL_SHELL_ENABLED=false to disable.
 * Does not modify legacyConsultantControlPanelEnabled.
 */
export const officialConsultantControlPanelShellEnabled =
  process.env.EVE_OFFICIAL_CONSULTANT_CONTROL_PANEL_SHELL_ENABLED !== "false";

export type OfficialControlPanelStatus = typeof OFFICIAL_CONTROL_PANEL_STATUS;
