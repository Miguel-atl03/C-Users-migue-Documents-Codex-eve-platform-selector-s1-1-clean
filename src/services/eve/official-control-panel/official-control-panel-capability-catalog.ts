import type {
  CapabilityVM,
  OfficialControlPanelCapability,
} from "./official-control-panel-contract.types";
import type { ExperienceCapability } from "./official-control-panel-experience.types";

export const OFFICIAL_CONTROL_PANEL_CAPABILITIES = [
  "view_company_state",
  "view_participant_detail",
  "view_authorized_evidence",
  "view_experience_state",
  "send_support_message",
  "request_reentry",
  "mark_manual_review",
  "manage_manual_work",
  "accept_manual_output",
  "generate_export",
  "block_export",
] as const satisfies readonly OfficialControlPanelCapability[];

/**
 * Experience-domain capability aliases → rector catalog.
 * Unknown / absent → deny.
 */
export const EXPERIENCE_CAPABILITY_ALIASES: Partial<
  Record<ExperienceCapability, OfficialControlPanelCapability>
> = {
  view_experience_state: "view_experience_state",
  send_support_message: "send_support_message",
  request_reentry: "request_reentry",
  mark_manual_review: "mark_manual_review",
  // Panel-only aliases (not rector keys) stay unmapped → deny at catalog layer
};

/** R2 enables these via eve_consultant_panel_capability_grant + assignment. */
export const R2_MANUAL_MUTATION_CAPABILITIES: OfficialControlPanelCapability[] =
  ["manage_manual_work", "accept_manual_output"];

/** @deprecated Use R2_MANUAL_MUTATION_CAPABILITIES — kept empty so R1 builders no longer deny. */
export const R1_DISABLED_MUTATION_CAPABILITIES: OfficialControlPanelCapability[] =
  [];

export function isOfficialControlPanelCapability(
  value: string,
): value is OfficialControlPanelCapability {
  return (OFFICIAL_CONTROL_PANEL_CAPABILITIES as readonly string[]).includes(
    value,
  );
}

export function denyCapability(
  key: OfficialControlPanelCapability,
  reasonCode: string,
): CapabilityVM {
  return { key, allowed: false, reasonCode, targetScope: null };
}

export function allowCapability(
  key: OfficialControlPanelCapability,
  reasonCode: string | null = null,
): CapabilityVM {
  return { key, allowed: true, reasonCode, targetScope: null };
}

/**
 * Build full capability matrix. Missing keys are denied.
 * R2: manage_manual_work / accept_manual_output allowed only when passed in `allowed`.
 */
export function buildCapabilityMatrix(input: {
  allowed: Iterable<string>;
  reasonByKey?: Partial<Record<OfficialControlPanelCapability, string>>;
}): CapabilityVM[] {
  const allowedSet = new Set<string>();
  for (const raw of input.allowed) {
    if (!isOfficialControlPanelCapability(raw)) continue;
    allowedSet.add(raw);
  }

  return OFFICIAL_CONTROL_PANEL_CAPABILITIES.map((key) => {
    if (allowedSet.has(key)) {
      return allowCapability(key, input.reasonByKey?.[key] ?? null);
    }
    return denyCapability(
      key,
      input.reasonByKey?.[key] ?? "capability_absent",
    );
  });
}

/** Grant-backed matrix for manual-work surfaces (R2). */
export function buildManualWorkCapabilityMatrix(input: {
  manageManualWork: boolean;
  acceptManualOutput: boolean;
}): CapabilityVM[] {
  const allowed: OfficialControlPanelCapability[] = [];
  if (input.manageManualWork) allowed.push("manage_manual_work");
  if (input.acceptManualOutput) allowed.push("accept_manual_output");
  return buildCapabilityMatrix({
    allowed,
    reasonByKey: {
      ...(!input.manageManualWork
        ? { manage_manual_work: "capability_absent" as const }
        : {}),
      ...(!input.acceptManualOutput
        ? { accept_manual_output: "capability_absent" as const }
        : {}),
    },
  });
}

export function mapExperienceCapabilitiesToOfficial(
  experienceCaps: readonly ExperienceCapability[],
): OfficialControlPanelCapability[] {
  const out: OfficialControlPanelCapability[] = [];
  for (const cap of experienceCaps) {
    const mapped = EXPERIENCE_CAPABILITY_ALIASES[cap];
    if (mapped) out.push(mapped);
  }
  return out;
}

/** Absent or unknown capability → deny. */
export function resolveCapabilityAllowed(
  matrix: CapabilityVM[],
  key: string,
): boolean {
  if (!isOfficialControlPanelCapability(key)) return false;
  const row = matrix.find((c) => c.key === key);
  return row?.allowed === true;
}
