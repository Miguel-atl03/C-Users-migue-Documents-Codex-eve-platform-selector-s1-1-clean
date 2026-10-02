import type {
  ExperienceDataStatus,
  ExperienceEventType,
  ExperienceScreenHealthView,
  ExperienceScreenKey,
  ExperienceScreenStatus,
  ExperienceStateView,
  ExperienceSupportQueueItemView,
  ExperienceTrajectoryEventView,
  ExperienceUserJourneyView,
  ExperienceUserScreenCellView,
} from "./official-control-panel-experience.types";
import { EXPERIENCE_SCREEN_KEYS } from "./official-control-panel-experience.types";
import type {
  ExperienceRepository,
  ExperienceScreenCatalogRow,
  ExperienceScreenEventRow,
  ExperienceSelectorsFilter,
  ExperienceSupportActionRow,
} from "./official-control-panel-experience-repository";
import { buildExperienceCapabilityMatrix } from "./official-control-panel-experience-capabilities";

function asScreenKey(value: string): ExperienceScreenKey {
  if ((EXPERIENCE_SCREEN_KEYS as readonly string[]).includes(value)) {
    return value as ExperienceScreenKey;
  }
  return "login_demo";
}

function asEventType(value: string): ExperienceEventType {
  return value as ExperienceEventType;
}

function asStatus(value: string): ExperienceScreenStatus {
  return value as ExperienceScreenStatus;
}

function catalogLabel(
  catalog: ExperienceScreenCatalogRow[],
  screenKey: string,
): string {
  return catalog.find((c) => c.screen_key === screenKey)?.label ?? screenKey;
}

/** Panel instrumentation keys must not appear in participant journey UX. */
function isProductCatalogRow(row: ExperienceScreenCatalogRow): boolean {
  return !row.screen_key.startsWith("panel_");
}

function isProductEvent(row: ExperienceScreenEventRow): boolean {
  return !row.screen_key.startsWith("panel_");
}

function buildTrajectory(
  events: ExperienceScreenEventRow[],
  catalog: ExperienceScreenCatalogRow[],
): ExperienceTrajectoryEventView[] {
  return events.filter(isProductEvent).map((e) => ({
    id: e.id,
    userId: e.user_id,
    screenKey: asScreenKey(e.screen_key),
    screenLabel: catalogLabel(catalog, e.screen_key),
    eventType: asEventType(e.event_type),
    screenStatus: asStatus(e.screen_status),
    occurredAt: e.occurred_at,
    roleRuntimeSessionId: e.role_runtime_session_id,
    activityId: e.activity_id,
    sessionReference: e.session_reference,
    requestId: e.request_id,
  }));
}

function buildUserJourneys(
  events: ExperienceScreenEventRow[],
  catalog: ExperienceScreenCatalogRow[],
): ExperienceUserJourneyView[] {
  const productEvents = events.filter(isProductEvent);
  const byUser = new Map<string, ExperienceScreenEventRow[]>();
  for (const e of productEvents) {
    const list = byUser.get(e.user_id) ?? [];
    list.push(e);
    byUser.set(e.user_id, list);
  }

  const visibleScreens = catalog
    .filter(isProductCatalogRow)
    .filter((c) => c.visibility === "visible");

  return [...byUser.entries()].map(([userId, userEvents]) => {
    const latestByScreen = new Map<string, ExperienceScreenEventRow>();
    for (const e of userEvents) {
      const prev = latestByScreen.get(e.screen_key);
      if (!prev || e.occurred_at >= prev.occurred_at) {
        latestByScreen.set(e.screen_key, e);
      }
    }

    const cells: ExperienceUserScreenCellView[] = visibleScreens.map((s) => {
      const last = latestByScreen.get(s.screen_key);
      return {
        screenKey: asScreenKey(s.screen_key),
        screenLabel: s.label,
        status: last ? asStatus(last.screen_status) : "not_reached",
        lastEventAt: last?.occurred_at ?? null,
        lastEventType: last ? asEventType(last.event_type) : null,
      };
    });

    const last = userEvents[userEvents.length - 1] ?? null;
    return {
      userId,
      displayLabel: `Usuario ${userId.slice(0, 8)}`,
      currentScreenKey: last ? asScreenKey(last.screen_key) : null,
      currentStatus: last ? asStatus(last.screen_status) : null,
      lastActivityAt: last?.occurred_at ?? null,
      cells,
    };
  });
}

function buildScreenHealth(
  events: ExperienceScreenEventRow[],
  catalog: ExperienceScreenCatalogRow[],
): ExperienceScreenHealthView[] {
  const productCatalog = catalog.filter(isProductCatalogRow);
  const productEvents = events.filter(isProductEvent);
  return productCatalog.map((s) => {
    const related = productEvents.filter((e) => e.screen_key === s.screen_key);
    const activeUsers = new Set(
      related
        .filter((e) => e.screen_status === "active")
        .map((e) => e.user_id),
    );
    return {
      screenKey: asScreenKey(s.screen_key),
      screenLabel: s.label,
      visibility: s.visibility === "checkpoint" ? "checkpoint" : "visible",
      enteredCount: related.filter((e) => e.event_type === "screen_entered")
        .length,
      completedCount: related.filter((e) => e.event_type === "screen_completed")
        .length,
      blockedCount: related.filter((e) => e.event_type === "screen_blocked")
        .length,
      supportCount: related.filter((e) => e.event_type === "support_requested")
        .length,
      abandonedCount: related.filter(
        (e) => e.event_type === "screen_abandoned",
      ).length,
      errorCount: related.filter((e) => e.event_type === "screen_error").length,
      activeUsers: activeUsers.size,
    };
  });
}

function buildSupportQueue(
  events: ExperienceScreenEventRow[],
  actions: ExperienceSupportActionRow[],
  catalog: ExperienceScreenCatalogRow[],
): ExperienceSupportQueueItemView[] {
  const fromActions: ExperienceSupportQueueItemView[] = actions.map((a) => ({
    id: a.id,
    userId: a.user_id,
    screenKey: asScreenKey(a.screen_key),
    screenLabel: catalogLabel(catalog, a.screen_key),
    actionType: a.action_type as ExperienceSupportQueueItemView["actionType"],
    reasonCode: a.reason_code,
    beforeState: a.before_state,
    expectedEffect: a.expected_effect,
    capability: a.capability,
    actorId: a.actor_id,
    createdAt: a.created_at,
    source: "support_action",
    roleRuntimeSessionId: a.role_runtime_session_id,
    activityId: a.activity_id,
  }));

  const fromEvents: ExperienceSupportQueueItemView[] = events
    .filter((e) => e.event_type === "support_requested")
    .map((e) => ({
      id: e.id,
      userId: e.user_id,
      screenKey: asScreenKey(e.screen_key),
      screenLabel: catalogLabel(catalog, e.screen_key),
      actionType: null,
      reasonCode: null,
      beforeState: null,
      expectedEffect: null,
      capability: null,
      actorId: null,
      createdAt: e.occurred_at,
      source: "support_requested_event" as const,
      roleRuntimeSessionId: e.role_runtime_session_id,
      activityId: e.activity_id,
    }));

  return [...fromActions, ...fromEvents].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export async function loadExperienceStateForCase(input: {
  experienceRepository: ExperienceRepository;
  caseId: string;
  companyId: string;
  filters?: ExperienceSelectorsFilter;
}): Promise<ExperienceStateView> {
  let catalog: ExperienceScreenCatalogRow[] = [];
  let events: ExperienceScreenEventRow[] = [];
  let actions: ExperienceSupportActionRow[] = [];
  let repositoryError = false;
  try {
    catalog = await input.experienceRepository.listCatalog();
    events = await input.experienceRepository.listEventsForCase(
      input.caseId,
      input.filters,
    );
    actions = await input.experienceRepository.listSupportActionsForCase(
      input.caseId,
      input.filters,
    );
  } catch {
    repositoryError = true;
    console.error("[official-control-panel-experience] degraded", {
      code: "experience_repository_degraded",
      caseId: input.caseId,
    });
    catalog = [];
    events = [];
    actions = [];
  }

  const productEvents = events.filter(isProductEvent);
  const dataStatus: ExperienceDataStatus =
    repositoryError
      ? "error"
      : productEvents.length === 0 && actions.length === 0
        ? "empty"
        : "available";

  // Canonical CapabilityVM matrix — allowed only after route-level case access.
  const capabilities = buildExperienceCapabilityMatrix({
    caseAccessAllowed: true,
  });

  return {
    caseId: input.caseId,
    companyId: input.companyId,
    dataStatus,
    emptyMessage:
      dataStatus === "empty"
        ? "Sin eventos de experiencia registrados."
        : dataStatus === "error"
          ? "No fue posible cargar la experiencia del caso."
        : null,
    generatedAt: new Date().toISOString(),
    selectors: {
      userId: input.filters?.userId ?? null,
      roleRuntimeSessionId: input.filters?.roleRuntimeSessionId ?? null,
      activityId: input.filters?.activityId ?? null,
      screenKey: input.filters?.screenKey
        ? asScreenKey(input.filters.screenKey)
        : null,
    },
    catalog: catalog.filter(isProductCatalogRow).map((c) => ({
      screenKey: asScreenKey(c.screen_key),
      label: c.label,
      segment: c.segment,
      visibility: c.visibility === "checkpoint" ? "checkpoint" : "visible",
      sortOrder: c.sort_order,
    })),
    trajectory: buildTrajectory(events, catalog),
    users: buildUserJourneys(events, catalog),
    screensHealth: buildScreenHealth(events, catalog),
    supportQueue: buildSupportQueue(events, actions, catalog),
    capabilities,
  };
}
