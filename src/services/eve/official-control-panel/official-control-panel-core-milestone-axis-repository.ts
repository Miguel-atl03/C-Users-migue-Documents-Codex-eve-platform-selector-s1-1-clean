import type { SupabaseClient } from "@supabase/supabase-js";

import type { CoreMilestoneCode } from "./catalogs/core-milestone-axis.catalog";
import {
  CORE_MILESTONE_CODES,
  isCoreMilestoneCode,
} from "./catalogs/core-milestone-axis.catalog";
import type {
  CoreMilestoneAxisRpcMilestone,
  CoreMilestoneAxisRpcPayload,
} from "./official-control-panel-core-milestone-axis.types";
import type { OfficialControlPanelCoreMilestoneAxisRepository } from "./official-control-panel-core-milestone-axis-service";
import type { CoreMilestoneProgressStatus } from "./official-control-panel-core-milestones";

export function createOfficialControlPanelCoreMilestoneAxisRepository(
  client: SupabaseClient,
): OfficialControlPanelCoreMilestoneAxisRepository {
  return {
    async listCoreMilestoneAxis(caseId) {
      const { data, error } = await client.rpc("eve_list_core_milestone_axis", {
        p_case_id: caseId,
      });
      const projected = error
        ? unavailablePayload()
        : presentCoreMilestoneAxisRpc(data);
      const h0 = projected.milestones.find((item) => item.code === "H0");
      if (h0?.linkPresent && h0.linkApplicable && h0.reached) {
        return projected;
      }

      const { data: diagnosticCase, error: caseError } = await client
        .from("sesiones_llenado")
        .select("id, core_final_alternative")
        .eq("id", caseId)
        .maybeSingle();
      if (caseError || !diagnosticCase) return projected;

      const byCode = new Map(projected.milestones.map((item) => [item.code, item]));
      const milestones = CORE_MILESTONE_CODES.map((code) =>
        code === "H0"
          ? {
              code,
              reached: true,
              linkPresent: true,
              linkApplicable: true,
            }
          : (byCode.get(code) ?? {
              code,
              reached: false,
              linkPresent: false,
              linkApplicable: false,
            }),
      );
      return {
        ...projected,
        status: projected.status === "available" ? "available" : "partial",
        achieved: Math.max(1, projected.achieved),
        total: Math.max(CORE_MILESTONE_CODES.length, projected.total),
        milestones,
      };
    },
  };
}

export function presentCoreMilestoneAxisRpc(
  value: unknown,
): CoreMilestoneAxisRpcPayload {
  if (!value || typeof value !== "object") {
    return unavailablePayload();
  }
  const row = value as Record<string, unknown>;
  const status = normalizeStatus(row.status);
  const milestones = Array.isArray(row.milestones)
    ? row.milestones
        .map(presentMilestone)
        .filter((item): item is CoreMilestoneAxisRpcMilestone => item != null)
    : [];

  const finalAlternative =
    row.finalAlternative === "ClosedWithoutSufficiency" ||
    row.finalAlternative === "Cancelled"
      ? row.finalAlternative
      : null;
  const finalAlternativeReason =
    typeof row.finalAlternativeReason === "string" &&
    row.finalAlternativeReason.trim()
      ? row.finalAlternativeReason.trim()
      : null;

  return {
    status,
    achieved: numberOrZero(row.achieved),
    total: numberOrZero(row.total),
    milestones,
    finalAlternative,
    finalAlternativeReason,
  };
}

function presentMilestone(
  value: unknown,
): CoreMilestoneAxisRpcMilestone | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const code = String(row.code ?? "");
  if (!isCoreMilestoneCode(code)) return null;
  return {
    code: code as CoreMilestoneCode,
    reached: Boolean(row.reached),
    linkPresent: Boolean(row.linkPresent),
    linkApplicable: Boolean(row.linkApplicable),
  };
}

function unavailablePayload(): CoreMilestoneAxisRpcPayload {
  return {
    status: "unavailable",
    achieved: 0,
    total: 0,
    milestones: [],
    finalAlternative: null,
    finalAlternativeReason: null,
  };
}

function normalizeStatus(value: unknown): CoreMilestoneProgressStatus {
  if (value === "available" || value === "partial" || value === "unavailable") {
    return value;
  }
  return "unavailable";
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
