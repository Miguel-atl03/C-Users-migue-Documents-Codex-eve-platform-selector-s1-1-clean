/**
 * Central metadata for the legacy Consultant Control Panel draft.
 * Do not duplicate this declaration across UI components.
 */

export const LEGACY_CONSULTANT_CONTROL_PANEL_STATUS = {
  status: "draft",
  official: false,
  deprecatedForNewDevelopment: true,
  label: "BORRADOR NO OFICIAL",
  replacementStatus: "pending_new_official_panel",
} as const;

/**
 * Access remains available for historical review. Default true so existing
 * permissions and routes are not broken. Gate only when an explicit rollout
 * decision disables the draft surface.
 */
export const legacyConsultantControlPanelEnabled =
  process.env.EVE_LEGACY_CONSULTANT_CONTROL_PANEL_ENABLED !== "false";

export type LegacyConsultantControlPanelStatus =
  typeof LEGACY_CONSULTANT_CONTROL_PANEL_STATUS;
