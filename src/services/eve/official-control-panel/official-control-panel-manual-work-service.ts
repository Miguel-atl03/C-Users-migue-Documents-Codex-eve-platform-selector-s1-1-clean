import type { OfficialControlPanelContextRepository } from "./official-control-panel-context.types";
import { assertConsultantCaseSupportProcessAccess } from "./official-control-panel-support-process-service";
import {
  evaluateManualHandoffOverdue,
  formatOverdueDuration,
} from "./official-control-panel-manual-handoff-overdue";
import type {
  ManualWorkArtifactRow,
  ManualWorkEventRow,
  ManualWorkItemRow,
  ManualWorkRepository,
} from "./official-control-panel-manual-work-repository";
import { buildManualWorkCapabilityMatrix } from "./official-control-panel-capability-catalog";
import { computeManualWorkAvailableActions } from "./official-control-panel-manual-actions";
import {
  MANUAL_HANDOFF_OVERDUE_CODE,
  MANUAL_HANDOFF_OVERDUE_TITLE,
  MANUAL_PROCESS_CODES,
  MANUAL_PROCESS_OPERATIONAL_LABELS,
  isHandoffStatus,
  isManualProcessCode,
  isManualTrackingStatus,
  type ManualHandoffOverdueAlertView,
  type ManualProcessCode,
  type ManualProcessGroupView,
  type ManualWorkArtifactView,
  type ManualWorkItemView,
  type ManualWorkTimelineEventView,
  type ManualWorkTrackingResponse,
} from "./official-control-panel-manual-work.types";

export async function loadManualWorkTrackingForCase(input: {
  contextRepository: OfficialControlPanelContextRepository;
  manualWorkRepository: ManualWorkRepository;
  consultantUserId: string;
  caseId: string;
  companyId: string;
  relationshipId: string;
  now?: Date;
}): Promise<
  | { ok: true; body: ManualWorkTrackingResponse }
  | { ok: false; status: number; code: string; message: string }
> {
  const access = await assertConsultantCaseSupportProcessAccess(
    input.contextRepository,
    {
      consultantUserId: input.consultantUserId,
      companyId: input.companyId,
      relationshipId: input.relationshipId,
      caseId: input.caseId,
    },
  );
  if (!access.ok) {
    return {
      ok: false,
      status: access.status,
      code: access.code,
      message: access.message,
    };
  }

  try {
    const workItems =
      await input.manualWorkRepository.listCurrentWorkItemsForCase(
        input.caseId,
      );
    const events = await input.manualWorkRepository.listEventsForWorkItems(
      workItems.map((w) => w.id),
    );
    const artifacts =
      await input.manualWorkRepository.listArtifactsForWorkItems(
        workItems.map((w) => w.id),
      );
    const grants =
      await input.manualWorkRepository.listEnabledCapabilityGrants({
        consultantUserId: input.consultantUserId,
        companyId: input.companyId,
      });
    const grantSet = new Set(
      grants
        .filter((g) => g.status === "enabled")
        .map((g) => g.capability),
    );
    const capabilities = buildManualWorkCapabilityMatrix({
      manageManualWork: grantSet.has("manage_manual_work"),
      acceptManualOutput: grantSet.has("accept_manual_output"),
    });
    const validInputIds =
      await input.manualWorkRepository.listValidInputPackageIdsForWorkItems({
        caseId: input.caseId,
        workItemIds: workItems.map((w) => w.id),
      });
    const submittedIds = workItems
      .map((w) => w.submitted_artifact_version_id)
      .filter((id): id is string => Boolean(id));
    const validSubmittedIds =
      await input.manualWorkRepository.listValidSubmittedArtifactIds(
        submittedIds,
      );
    return {
      ok: true,
      body: buildManualWorkTrackingResponse({
        caseId: input.caseId,
        companyId: input.companyId,
        workItems,
        events,
        artifacts,
        capabilities,
        validInputPackageIds: validInputIds,
        validSubmittedArtifactIds: validSubmittedIds,
        now: input.now ?? new Date(),
      }),
    };
  } catch {
    console.error("[official-control-panel-manual-work] degraded", {
      code: "manual_work_repository_degraded",
      caseId: input.caseId,
    });
    return {
      ok: true,
      body: {
        caseId: input.caseId,
        companyId: input.companyId,
        dataStatus: "error",
        processes: MANUAL_PROCESS_CODES.map((processCode) => ({
          processCode,
          processLabel: MANUAL_PROCESS_OPERATIONAL_LABELS[processCode],
          dataStatus: "error",
          emptyMessage: null,
          partialMessage: null,
          errorMessage: "No fue posible cargar los trabajos manuales del caso.",
          workItems: [],
        })),
        overdueAlerts: [],
        generatedAt: (input.now ?? new Date()).toISOString(),
        capabilities: buildManualWorkCapabilityMatrix({
          manageManualWork: false,
          acceptManualOutput: false,
        }),
      },
    };
  }
}

export function buildManualWorkTrackingResponse(input: {
  caseId: string;
  companyId: string;
  workItems: ManualWorkItemRow[];
  events: ManualWorkEventRow[];
  artifacts?: ManualWorkArtifactRow[];
  capabilities?: import("./official-control-panel-contract.types").CapabilityVM[];
  validInputPackageIds?: Set<string>;
  validSubmittedArtifactIds?: Set<string>;
  now: Date;
}): ManualWorkTrackingResponse {
  const eventsByWork = groupEvents(input.events);
  const artifactsByWork = groupArtifacts(input.artifacts ?? []);
  const capabilities =
    input.capabilities ??
    buildManualWorkCapabilityMatrix({
      manageManualWork: false,
      acceptManualOutput: false,
    });
  const validInputPackageIds = input.validInputPackageIds ?? new Set<string>();
  const validSubmittedArtifactIds =
    input.validSubmittedArtifactIds ?? new Set<string>();
  const overdueAlerts: ManualHandoffOverdueAlertView[] = [];

  const processes: ManualProcessGroupView[] = MANUAL_PROCESS_CODES.map(
    (processCode) => {
      const rows = input.workItems.filter(
        (row) => row.process_code === processCode,
      );
      if (rows.length === 0) {
        return {
          processCode,
          processLabel: MANUAL_PROCESS_OPERATIONAL_LABELS[processCode],
          dataStatus: "empty",
          emptyMessage:
            "No hay trabajos manuales registrados para este proceso.",
          partialMessage: null,
          errorMessage: null,
          workItems: [],
        };
      }

      const workItems = rows.map((row) =>
        projectWorkItem(
          row,
          eventsByWork.get(row.id) ?? [],
          artifactsByWork.get(row.id) ?? [],
          capabilities,
          validInputPackageIds,
          validSubmittedArtifactIds,
          input.now,
        ),
      );

      for (const item of workItems) {
        if (item.overdueAlert) overdueAlerts.push(item.overdueAlert);
      }

      const hasPartial = workItems.some((w) => w.dataStatus === "partial");
      return {
        processCode,
        processLabel: MANUAL_PROCESS_OPERATIONAL_LABELS[processCode],
        dataStatus: hasPartial ? "partial" : "available",
        emptyMessage: null,
        partialMessage: hasPartial
          ? "La información de seguimiento está incompleta."
          : null,
        errorMessage: null,
        workItems,
      };
    },
  );

  const anyAvailable = processes.some(
    (p) => p.dataStatus === "available" || p.dataStatus === "partial",
  );
  const anyPartial = processes.some((p) => p.dataStatus === "partial");

  return {
    caseId: input.caseId,
    companyId: input.companyId,
    dataStatus: anyPartial ? "partial" : anyAvailable ? "available" : "empty",
    processes,
    overdueAlerts,
    generatedAt: input.now.toISOString(),
    capabilities,
  };
}

function projectWorkItem(
  row: ManualWorkItemRow,
  events: ManualWorkEventRow[],
  artifacts: ManualWorkArtifactRow[],
  capabilities: import("./official-control-panel-contract.types").CapabilityVM[],
  validInputPackageIds: Set<string>,
  validSubmittedArtifactIds: Set<string>,
  now: Date,
): ManualWorkItemView {
  const processCode: ManualProcessCode = isManualProcessCode(row.process_code)
    ? row.process_code
    : "P-SUP-03";
  const tracking = isManualTrackingStatus(row.manual_tracking_status)
    ? row.manual_tracking_status
    : "blocked";
  const handoff = isHandoffStatus(row.handoff_status)
    ? row.handoff_status
    : "not_applicable";
  const partial =
    !isManualTrackingStatus(row.manual_tracking_status) ||
    !isHandoffStatus(row.handoff_status) ||
    !isManualProcessCode(row.process_code) ||
    (row.handoff_status === "pending" &&
      (!row.handoff_origin || !row.handoff_destination));

  const overdueEval = evaluateManualHandoffOverdue(
    {
      handoffStatus: handoff,
      manualTrackingStatus: tracking,
      expectedHandoffAt: row.expected_handoff_at,
      expectedEvent: row.expected_event,
    },
    now,
  );

  let overdueAlert: ManualHandoffOverdueAlertView | null = null;
  if (overdueEval.overdue && overdueEval.dueAt && overdueEval.overdueMs != null) {
    overdueAlert = {
      code: MANUAL_HANDOFF_OVERDUE_CODE,
      title: MANUAL_HANDOFF_OVERDUE_TITLE,
      processCode,
      processLabel: MANUAL_PROCESS_OPERATIONAL_LABELS[processCode],
      workItemId: row.id,
      expectedEvent: (row.expected_event ?? "").trim(),
      dueAt: overdueEval.dueAt,
      overdueDurationLabel: formatOverdueDuration(overdueEval.overdueMs),
      responsibleLabel: row.responsible_label,
      nextReviewRequired: true,
    };
  }

  const latestInput = latestArtifact(artifacts, "input_package");
  const latestOutput = latestArtifact(artifacts, "manual_output");
  const hasValidInputPackage = Boolean(
    latestInput && validInputPackageIds.has(latestInput.id),
  );
  const availableActions = computeManualWorkAvailableActions({
    status: tracking,
    capabilities,
    latestInputArtifact: latestInput,
    hasValidInputPackage,
    latestOutputArtifact: latestOutput,
    submittedArtifactVersionId: row.submitted_artifact_version_id,
    submittedArtifactChecksumValid: row.submitted_artifact_version_id
      ? validSubmittedArtifactIds.has(row.submitted_artifact_version_id)
      : undefined,
  });

  return {
    id: row.id,
    processCode,
    dataStatus: partial ? "partial" : "available",
    manualTrackingStatus: tracking,
    handoffStatus: handoff,
    sourceObjectLabel: row.source_object_label,
    sourceStateLabel: row.source_state_label,
    expectedOutputObjectLabel: row.expected_output_object_label,
    expectedOutputStateLabel: row.expected_output_state_label,
    responsibleLabel: row.responsible_label,
    openedAt: row.opened_at,
    expectedEvent: row.expected_event,
    expectedHandoffAt: row.expected_handoff_at,
    lastEventAt: row.last_event_at,
    artifactRef: row.artifact_ref,
    version: row.version,
    attentionRequired: Boolean(overdueAlert) || tracking === "blocked",
    timeline: events.map(projectEvent),
    overdueAlert,
    latestInputArtifact: latestInput,
    latestOutputArtifact: latestOutput,
    submittedArtifactVersionId: row.submitted_artifact_version_id,
    acceptedArtifactVersionId: row.accepted_artifact_version_id,
    availableActions,
  };
}

function latestArtifact(
  artifacts: ManualWorkArtifactRow[],
  kind: "input_package" | "manual_output",
): ManualWorkArtifactView | null {
  const filtered = artifacts.filter((a) => a.artifact_kind === kind);
  if (filtered.length === 0) return null;
  const row = filtered.reduce((best, cur) =>
    cur.version_number > best.version_number ? cur : best,
  );
  return {
    id: row.id,
    kind,
    versionNumber: row.version_number,
    sanitizedFilename: row.sanitized_filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    createdAt: row.created_at,
    storageReference: row.storage_reference,
  };
}

function projectEvent(event: ManualWorkEventRow): ManualWorkTimelineEventView {
  return {
    id: event.id,
    eventType: event.event_type,
    actorLabel: event.actor_label,
    occurredAt: event.occurred_at,
    beforeStatus: event.before_status,
    afterStatus: event.after_status,
    beforeHandoffStatus: event.before_handoff_status,
    afterHandoffStatus: event.after_handoff_status,
    reason: event.reason,
    artifactRef: event.artifact_ref,
  };
}

function groupEvents(events: ManualWorkEventRow[]) {
  const map = new Map<string, ManualWorkEventRow[]>();
  for (const event of events) {
    const list = map.get(event.work_item_id) ?? [];
    list.push(event);
    map.set(event.work_item_id, list);
  }
  return map;
}

function groupArtifacts(artifacts: ManualWorkArtifactRow[]) {
  const map = new Map<string, ManualWorkArtifactRow[]>();
  for (const row of artifacts) {
    const list = map.get(row.work_item_id) ?? [];
    list.push(row);
    map.set(row.work_item_id, list);
  }
  return map;
}
