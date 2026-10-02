import { createHash } from "node:crypto";

import type { PrimaryActivitySelectionResult } from "@/domain/primary-activity-selection-policy";
import {
  normalizeWorkMapData,
  type WorkMapData,
  type WorkMapResponsibility,
} from "@/domain/local-work-map";
import {
  buildActivitySelectionStageFromWorkMap,
  type ActivitySelectionPublishPreparation,
} from "@/services/eve/official-control-panel/official-control-panel-activity-selection-mutation";
import { hashStableJson } from "@/services/primary-activity-selection-audit";
import { selectPrimaryActivitiesFromWorkMap } from "@/services/primary-activity-selector";

export type ParticipantProfileQueueItem = {
  id: string;
  roleCode: string | null;
  roleLabel: string;
  status?: string | null;
  isPrimary?: boolean | null;
  createdAt?: string | null;
};

export type ProfileCanonicalSelection = {
  profile: ParticipantProfileQueueItem;
  profileOrder: number;
  scopedWorkMap: WorkMapData;
  selectionResult: PrimaryActivitySelectionResult;
  stage: ActivitySelectionPublishPreparation;
  sourceReference: string;
  workMapHash: string;
};

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function compareNullableText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? "").localeCompare(b ?? "", "es", { sensitivity: "base" });
}

export function orderParticipantProfilesForAutomaticProcessing(
  profiles: ParticipantProfileQueueItem[],
): ParticipantProfileQueueItem[] {
  return [...profiles].sort((a, b) => {
    if (Boolean(a.isPrimary) !== Boolean(b.isPrimary)) {
      return a.isPrimary ? -1 : 1;
    }

    const byLabel = compareNullableText(a.roleLabel, b.roleLabel);
    if (byLabel !== 0) return byLabel;

    const byCreatedAt = compareNullableText(a.createdAt, b.createdAt);
    if (byCreatedAt !== 0) return byCreatedAt;

    return compareNullableText(a.id, b.id);
  });
}

function responsibilityBelongsToProfile(
  responsibility: WorkMapResponsibility,
  profile: ParticipantProfileQueueItem,
  profileCount: number,
) {
  const responsibilityArea = normalizeLabel(responsibility.primaryArea);
  if (!responsibilityArea) {
    return profileCount === 1;
  }

  const roleLabel = normalizeLabel(profile.roleLabel);
  const roleCode = normalizeLabel(profile.roleCode);
  return responsibilityArea === roleLabel || responsibilityArea === roleCode;
}

export function scopeWorkMapToParticipantProfile(
  workMap: WorkMapData,
  profile: ParticipantProfileQueueItem,
  profileCount: number,
) {
  const normalized = normalizeWorkMapData(workMap) ?? workMap;
  const responsibilities = normalized.responsibilities.filter(
    (responsibility) =>
      responsibilityBelongsToProfile(responsibility, profile, profileCount),
  );
  const profileLabel = profile.roleLabel.trim();

  return {
    ...normalized,
    selectedAreas: normalized.selectedAreas.filter(
      (area) => normalizeLabel(area) === normalizeLabel(profileLabel),
    ),
    customAreas: normalized.customAreas.filter(
      (area) => normalizeLabel(area) === normalizeLabel(profileLabel),
    ),
    responsibilities,
  };
}

export function hashCanonicalJson(value: unknown) {
  return hashStableJson(value);
}

export function buildCanonicalSelectionsForParticipantProfiles(input: {
  workMap: WorkMapData;
  profiles: ParticipantProfileQueueItem[];
  sourceSnapshotId: string;
}): ProfileCanonicalSelection[] {
  const orderedProfiles = orderParticipantProfilesForAutomaticProcessing(input.profiles);

  return orderedProfiles.map((profile, index) => {
    const scopedWorkMap = scopeWorkMapToParticipantProfile(
      input.workMap,
      profile,
      orderedProfiles.length,
    );
    const selectionResult = selectPrimaryActivitiesFromWorkMap(scopedWorkMap);
    const sourceReference = `case_participant_workmap_snapshots:${input.sourceSnapshotId}:profile:${profile.id}`;
    const stage = buildActivitySelectionStageFromWorkMap(
      scopedWorkMap,
      sourceReference,
    );

    return {
      profile,
      profileOrder: index + 1,
      scopedWorkMap,
      selectionResult,
      stage,
      sourceReference,
      workMapHash: hashCanonicalJson(scopedWorkMap),
    };
  });
}


