/**
 * ParticipantMonitoringVM → visible table row.
 * Architectural values come from the VM; participantId is an explicit navigation key.
 */

import type { ParticipantMonitoringVM } from "@/services/eve/official-control-panel/official-control-panel-contract.types";
import type { CaseParticipantListItem } from "../types/participant-profile.types";
import { presentAssignmentLabel } from "./participant-profile-presentation.ts";

export const MONITORING_UNAVAILABLE_LABEL = "No disponible";

export type ParticipantMonitoringTableRow = {
  /** Navigation / expand key (case_participant id). */
  participantId: string;
  userId: string;
  displayName: string;
  engagementLabel: string;
  rolesCountLabel: string;
  activitiesLabel: string;
  journeyStageLabel: string;
  attentionLabel: string;
  lastActivityAt: string | null;
  roleSessionsDataStatus: ParticipantMonitoringVM["roleSessionsDataStatus"];
  roleSessionCount: number | null;
};

/**
 * Map canonical monitoring VMs to table rows.
 * unevaluated sessions → "No disponible" (not "0").
 * evaluated empty → "0".
 */
export function presentParticipantMonitoringTableRows(
  vms: ParticipantMonitoringVM[],
): ParticipantMonitoringTableRow[] {
  return vms.map((vm) => {
    const evaluated = vm.roleSessionsDataStatus === "available";
    const roleSessionCount = evaluated ? vm.roleSessions.length : null;
    const rolesCountLabel = evaluated
      ? String(vm.roleSessions.length)
      : MONITORING_UNAVAILABLE_LABEL;

    return {
      participantId: vm.participantId,
      userId: vm.userId,
      displayName: vm.displayName,
      engagementLabel: vm.engagementState || MONITORING_UNAVAILABLE_LABEL,
      rolesCountLabel,
      activitiesLabel: vm.activitiesLabel || MONITORING_UNAVAILABLE_LABEL,
      journeyStageLabel: vm.journeyStage || MONITORING_UNAVAILABLE_LABEL,
      attentionLabel: vm.attentionState || MONITORING_UNAVAILABLE_LABEL,
      lastActivityAt: vm.lastActivityAt,
      roleSessionsDataStatus: vm.roleSessionsDataStatus,
      roleSessionCount,
    };
  });
}

/**
 * Bridge table rows into CaseParticipantListItem for existing expand/navigation UI.
 * Architectural labels come from the VM row; assignment uses unavailable until profiles load.
 */
export function monitoringTableRowsToParticipantListItems(
  rows: ParticipantMonitoringTableRow[],
  profileCountByParticipantId?: Map<string, number>,
): CaseParticipantListItem[] {
  return rows.map((row) => {
    const profileCount =
      profileCountByParticipantId?.get(row.participantId) ?? 0;
    return {
      id: row.participantId,
      label: row.displayName,
      userId: row.userId,
      authUserId: null,
      email: null,
      declaredPosition: null,
      profileCount,
      participationStatusLabel: null,
      profileResolutionStatus: "unavailable",
      assignmentKind: "unavailable",
      assignmentLabel: presentAssignmentLabel("unavailable"),
      engagementLabel: row.engagementLabel,
      rolesCountLabel: row.rolesCountLabel,
      activitiesLabel: row.activitiesLabel,
      journeyStageLabel: row.journeyStageLabel,
      readinessLabel: MONITORING_UNAVAILABLE_LABEL,
      attentionLabel: row.attentionLabel,
    };
  });
}
