import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCapabilityMatrix,
  resolveCapabilityAllowed,
} from "../../../src/services/eve/official-control-panel/official-control-panel-capability-catalog.ts";
import {
  adaptExperienceStateToEnvelope,
  adaptHttpFailureToEnvelope,
  deriveExperienceSourceObservedAt,
} from "../../../src/services/eve/official-control-panel/official-control-panel-contract-adapt.ts";
import {
  assertScopeMatchesAuthorization,
  composeCompanyControlPanelVM,
  composeParticipantMonitoringList,
  pickNextExpectedEvent,
} from "../../../src/services/eve/official-control-panel/official-control-panel-contract-compose.ts";
import {
  buildFreshnessVM,
  mapWireToPanelDataAvailability,
  validateAndBuildEffectiveScope,
} from "../../../src/services/eve/official-control-panel/official-control-panel-contract-normalize.ts";
import {
  COMPANY_STATE_UNAVAILABLE,
} from "../../../src/features/official-consultant-control-panel/presentation/company-state-presentation.ts";
import { presentCompanyStateFromVm } from "../../../src/features/official-consultant-control-panel/presentation/company-state-from-vm.ts";
import {
  presentParticipantMonitoringTableRows,
} from "../../../src/features/official-consultant-control-panel/presentation/participant-monitoring-from-vm.ts";

function baseVmInput(overrides = {}) {
  return {
    company: { id: "co-1", label: "Acme" },
    relationship: { id: "rel-1", label: "Engagement" },
    diagnosticCase: { id: "case-1", label: "Caso 1" },
    milestones: [],
    processAxis: [],
    attentionAlerts: [],
    generatedAt: "2026-07-20T18:00:00.000Z",
    sourceObservedAt: null,
    ...overrides,
  };
}

test("empty wire status maps to available", () => {
  assert.equal(mapWireToPanelDataAvailability("empty"), "available");
});

test("freshness rejects generatedAt as sourceObservedAt", () => {
  const generatedAt = "2026-07-20T17:00:00.000Z";
  const rejected = buildFreshnessVM({
    generatedAt,
    sourceObservedAt: generatedAt,
  });
  assert.equal(rejected.status, "unknown");
  assert.equal(rejected.sourceObservedAt, null);
});

test("experience sourceObservedAt uses factual timestamps only", () => {
  assert.equal(
    deriveExperienceSourceObservedAt({
      trajectory: [],
      supportQueue: [],
      screensHealth: [],
      users: [],
    }),
    null,
  );
});

test("VM with factual state → same status on KPI projection and drawer label", () => {
  const vm = composeCompanyControlPanelVM(
    baseVmInput({
      companyState: {
        companyState: "Atención",
        companyStateReason: "Existen flags de soporte.",
        alerts: [],
        experienceAlertCount: 2,
        experienceAlertsComplete: true,
      },
      experience: {
        caseId: "case-1",
        companyId: "co-1",
        dataStatus: "available",
        emptyMessage: null,
        generatedAt: "2026-07-20T17:00:00.000Z",
        selectors: {
          userId: null,
          roleRuntimeSessionId: null,
          activityId: null,
          screenKey: null,
        },
        catalog: [],
        trajectory: [],
        users: [],
        screensHealth: [],
        supportQueue: [],
        capabilities: ["view_experience_state"],
      },
      attentionAlerts: [
        {
          alertId: "a1",
          alertType: "experience_support_requested",
          severity: "warning",
          title: "Soporte",
          detail: "d",
          scopeLabel: "s",
          responseHint: "r",
          userId: "u",
          screenKey: "login",
          capabilities: [],
        },
      ],
      milestones: [
        {
          code: "H1",
          label: "Scene",
          sequence: 1,
          objectStateLabel: "x",
          expectedNextEventLabel: "SceneCanonicalRecord [Consolidated]",
          timerPolicyName: null,
          responsibleProcessCode: null,
          responsibleProcessManual: false,
          modalityLabel: null,
          reached: false,
          uiState: "current_wait",
          uiStateLabel: "En espera",
          dataStatus: "available",
        },
      ],
    }),
  );

  const projection = presentCompanyStateFromVm({
    contextActive: true,
    vm,
  });
  assert.equal(projection.currentStatusLabel, "Atención");
  assert.equal(
    projection.nextStepLabel,
    "SceneCanonicalRecord [Consolidated]",
  );

  const kpis = {
    estado: projection.currentStatusLabel,
    proximo: projection.nextStepLabel,
    alertas: String(vm.companyStateAggregation?.experienceAlertCount ?? "—"),
    drawerEstado: projection.currentStatusLabel,
  };
  assert.equal(kpis.estado, "Atención");
  assert.equal(kpis.proximo, "SceneCanonicalRecord [Consolidated]");
  assert.equal(kpis.alertas, "2");
  assert.equal(kpis.drawerEstado, kpis.estado);
});

test("VM without next event → No disponible everywhere", () => {
  const vm = composeCompanyControlPanelVM(
    baseVmInput({
      companyState: {
        companyState: "En curso",
        companyStateReason: "Sin bloqueo crítico y con próximo evento válido.",
        alerts: [],
        experienceAlertCount: 0,
        experienceAlertsComplete: true,
      },
      experience: {
        caseId: "case-1",
        companyId: "co-1",
        dataStatus: "available",
        emptyMessage: null,
        generatedAt: "2026-07-20T17:00:00.000Z",
        selectors: {
          userId: null,
          roleRuntimeSessionId: null,
          activityId: null,
          screenKey: null,
        },
        catalog: [],
        trajectory: [],
        users: [
          {
            userId: "u1",
            displayLabel: "Ana",
            currentScreenKey: "workmap",
            currentStatus: "active",
            lastActivityAt: "2026-07-20T16:00:00.000Z",
            cells: [],
          },
        ],
        screensHealth: [],
        supportQueue: [],
        capabilities: ["view_experience_state"],
      },
      milestones: [],
    }),
  );
  assert.equal(vm.nextExpectedEvent, null);
  const projection = presentCompanyStateFromVm({
    contextActive: true,
    vm,
  });
  assert.equal(projection.currentStatusLabel, COMPANY_STATE_UNAVAILABLE);
  assert.equal(projection.nextStepLabel, COMPANY_STATE_UNAVAILABLE);
});

test("two sessions same user stay separated in table rows", () => {
  const vms = composeParticipantMonitoringList(
    [
      {
        participantId: "p1",
        userId: "u1",
        label: "Ana",
        engagementLabel: "Activo",
        rolesCount: 2,
        rolesCountLabel: "2",
        activitiesLabel: "No disponible",
        journeyStageLabel: "Etapa A",
        readinessLabel: "No disponible",
        attentionLabel: "Sin atención",
        participationStatusLabel: null,
        profileResolutionStatus: "resolved",
      },
    ],
    new Map([
      [
        "u1",
        [
          {
            id: "rrs-1",
            label: "Rol A",
            stateLabel: "open",
            linkStatus: "confirmed",
          },
          {
            id: "rrs-2",
            label: "Rol B",
            stateLabel: "open",
            linkStatus: "confirmed",
          },
        ],
      ],
    ]),
  );
  assert.equal(vms[0].roleSessions.length, 2);
  assert.equal(vms[0].roleSessionsDataStatus, "available");
  const rows = presentParticipantMonitoringTableRows(vms);
  assert.equal(rows[0].rolesCountLabel, "2");
  assert.equal(rows[0].roleSessionCount, 2);
});

test("sessions not evaluated → No disponible, not 0", () => {
  const vms = composeParticipantMonitoringList(
    [
      {
        participantId: "p1",
        userId: "u1",
        label: "Ana",
        engagementLabel: "Activo",
        rolesCount: 0,
        rolesCountLabel: "0",
        activitiesLabel: "No disponible",
        journeyStageLabel: "No disponible",
        readinessLabel: "No disponible",
        attentionLabel: "Sin atención",
        participationStatusLabel: null,
        profileResolutionStatus: "unresolved",
      },
    ],
    new Map(),
  );
  assert.equal(vms[0].roleSessionsDataStatus, "unavailable");
  assert.equal(vms[0].roleSessions.length, 0);
  const rows = presentParticipantMonitoringTableRows(vms);
  assert.equal(rows[0].rolesCountLabel, "No disponible");
  assert.equal(rows[0].roleSessionCount, null);
});

test("sessions evaluated empty → factual 0", () => {
  const map = new Map();
  map.set("u1", []);
  const vms = composeParticipantMonitoringList(
    [
      {
        participantId: "p1",
        userId: "u1",
        label: "Ana",
        engagementLabel: "Activo",
        rolesCount: 0,
        rolesCountLabel: "0",
        activitiesLabel: "No disponible",
        journeyStageLabel: "No disponible",
        readinessLabel: "No disponible",
        attentionLabel: "Sin atención",
        participationStatusLabel: null,
        profileResolutionStatus: "resolved",
      },
    ],
    map,
  );
  assert.equal(vms[0].roleSessionsDataStatus, "available");
  assert.equal(vms[0].roleSessions.length, 0);
  const rows = presentParticipantMonitoringTableRows(vms);
  assert.equal(rows[0].rolesCountLabel, "0");
  assert.equal(rows[0].roleSessionCount, 0);
});

test("scope cumulative + authorization relationship required", () => {
  assert.equal(
    validateAndBuildEffectiveScope({
      companyId: "c",
      caseId: "k",
    }).ok,
    false,
  );
  assert.equal(
    assertScopeMatchesAuthorization(
      { companyId: "c", caseId: "k" },
      { companyId: "c", caseId: "k", relationshipId: "r" },
    ),
    false,
  );
});

test("unauthorized envelope has null scope without unknown IDs", () => {
  const forbidden = adaptHttpFailureToEnvelope({
    requestId: "ocp_f",
    status: 403,
  });
  assert.equal(forbidden.effectiveScope, null);
  const serialized = JSON.stringify(forbidden);
  assert.equal(serialized.includes('"companyId":"unknown"'), false);
});

test("experience empty → available; capabilities deny R2", () => {
  const wire = {
    caseId: "case-1",
    companyId: "company-1",
    dataStatus: "empty",
    emptyMessage: "Sin eventos",
    generatedAt: "2026-07-20T17:00:00.000Z",
    selectors: {
      userId: null,
      roleRuntimeSessionId: null,
      activityId: null,
      screenKey: null,
    },
    catalog: [],
    trajectory: [],
    users: [],
    screensHealth: [],
    supportQueue: [],
    capabilities: ["view_experience_state"],
    companyState: {
      companyState: "No iniciado",
      companyStateReason: "Evidencia insuficiente",
      alerts: [],
      experienceAlertCount: 0,
      experienceAlertsComplete: true,
    },
  };
  const envelope = adaptExperienceStateToEnvelope(wire, {
    requestId: "ocp_abc",
    companyId: "company-1",
    relationshipId: "rel-1",
    caseId: "case-1",
    composedAt: "2026-07-20T18:00:00.000Z",
  });
  assert.equal(envelope.dataStatus, "available");
  assert.equal(
    resolveCapabilityAllowed(envelope.capabilities, "manage_manual_work"),
    false,
  );
  assert.equal(pickNextExpectedEvent([]), null);
  assert.equal(
    resolveCapabilityAllowed(
      buildCapabilityMatrix({ allowed: [] }),
      "view_company_state",
    ),
    false,
  );
});
