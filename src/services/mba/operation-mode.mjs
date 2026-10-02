export const MBA_OPERATION_MODES = Object.freeze([
  "shadow_mode",
  "soft_governance_mode",
  "enforcement_mode",
]);

const normalizeMode = (value) => {
  if (value === "shadow") return "shadow_mode";
  if (value === "soft" || value === "soft_governance") return "soft_governance_mode";
  if (value === "enforcement") return "enforcement_mode";
  return value;
};

export function resolveMbaOperationMode(env = {}) {
  const requestedMode = normalizeMode(env.MBA_CONTROL_PLANE_MODE) ?? "shadow_mode";

  if (requestedMode === "enforcement_mode") {
    const armed =
      env.MBA_ALLOW_ENFORCEMENT === "true" &&
      env.MBA_ENFORCEMENT_CONFIRMATION === "ENABLE_MBA_OLC_BLOCKING";

    return {
      mode: armed ? "enforcement_mode" : "soft_governance_mode",
      requested_mode: "enforcement_mode",
      enforcement_armed: armed,
      downgrade_reason: armed ? null : "enforcement_not_armed",
    };
  }

  if (requestedMode === "soft_governance_mode") {
    return {
      mode: "soft_governance_mode",
      requested_mode: requestedMode,
      enforcement_armed: false,
      downgrade_reason: null,
    };
  }

  return {
    mode: "shadow_mode",
    requested_mode: requestedMode,
    enforcement_armed: false,
    downgrade_reason: requestedMode === "shadow_mode" ? null : "unknown_mode_defaulted_to_shadow",
  };
}

export function modeAllowsBlocking(modeResolution) {
  return modeResolution.mode === "enforcement_mode" && modeResolution.enforcement_armed === true;
}

