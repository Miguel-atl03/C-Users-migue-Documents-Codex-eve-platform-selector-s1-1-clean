import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  deriveExperienceHasValidNextEvent,
  aggregateCompanyState,
} from "../../../src/services/eve/official-control-panel/official-control-panel-company-state-aggregation.ts";
import {
  COMPANY_STATE_UNAVAILABLE,
} from "../../../src/features/official-consultant-control-panel/presentation/company-state-presentation.ts";
import { presentCompanyStateFromVm } from "../../../src/features/official-consultant-control-panel/presentation/company-state-from-vm.ts";
import { composeCompanyControlPanelVM } from "../../../src/services/eve/official-control-panel/official-control-panel-contract-compose.ts";
import { resolveOfficialPanelShellSnapshot } from "../../../src/features/official-consultant-control-panel/state/official-panel-shell-snapshot.ts";

const EMPTY_EXPERIENCE = {
  caseId: "case-1",
  companyId: "company-1",
  dataStatus: "empty",
  emptyMessage: "Sin eventos de experiencia registrados.",
  generatedAt: new Date().toISOString(),
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
};

test("empty experience does not imply valid next event", () => {
  assert.equal(deriveExperienceHasValidNextEvent(EMPTY_EXPERIENCE), false);
});

test("Amber empty via CompanyControlPanelVM projection — No disponible", () => {
  const companyState = aggregateCompanyState({
    hasCriticalMilestoneBlocker: false,
    hasSupportRequested: false,
    hasValidNextEvent: false,
    experienceAlertsComplete: true,
    experienceState: EMPTY_EXPERIENCE,
  });

  const vm = composeCompanyControlPanelVM({
    company: { id: "company-1", label: "Amber" },
    relationship: { id: "rel-1", label: "Engagement" },
    diagnosticCase: { id: "case-1", label: "Caso 1" },
    milestones: [],
    processAxis: [],
    attentionAlerts: [],
    generatedAt: new Date().toISOString(),
    sourceObservedAt: null,
    companyState,
    experience: EMPTY_EXPERIENCE,
  });

  const projection = presentCompanyStateFromVm({
    contextActive: true,
    vm,
  });

  assert.equal(projection.currentStatusLabel, COMPANY_STATE_UNAVAILABLE);
  assert.equal(projection.nextStepLabel, COMPANY_STATE_UNAVAILABLE);
  assert.equal(projection.evaluable, false);
  assert.notEqual(projection.currentStatusLabel, "En curso");
});

test("En curso without factual next event → No disponible via VM projection", () => {
  const companyState = aggregateCompanyState({
    hasCriticalMilestoneBlocker: false,
    hasSupportRequested: false,
    hasValidNextEvent: true,
    experienceAlertsComplete: true,
    experienceState: {
      ...EMPTY_EXPERIENCE,
      dataStatus: "available",
      users: [
        {
          userId: "u1",
          displayLabel: "Usuario u1",
          currentScreenKey: "workmap",
          currentStatus: "active",
          lastActivityAt: new Date().toISOString(),
          cells: [],
        },
      ],
    },
  });

  const vm = composeCompanyControlPanelVM({
    company: { id: "company-1", label: "Amber" },
    relationship: { id: "rel-1", label: "Engagement" },
    diagnosticCase: { id: "case-1", label: "Caso 1" },
    milestones: [],
    processAxis: [],
    attentionAlerts: [],
    generatedAt: new Date().toISOString(),
    sourceObservedAt: null,
    companyState,
    experience: {
      ...EMPTY_EXPERIENCE,
      dataStatus: "available",
      users: [
        {
          userId: "u1",
          displayLabel: "Usuario u1",
          currentScreenKey: "workmap",
          currentStatus: "active",
          lastActivityAt: new Date().toISOString(),
          cells: [],
        },
      ],
    },
  });

  assert.equal(vm.nextExpectedEvent, null);
  const projection = presentCompanyStateFromVm({
    contextActive: true,
    vm,
  });
  assert.equal(projection.currentStatusLabel, COMPANY_STATE_UNAVAILABLE);
  assert.equal(projection.nextStepLabel, COMPANY_STATE_UNAVAILABLE);
});

test("shell snapshot separates context ready from data empty", () => {
  const snapshot = resolveOfficialPanelShellSnapshot({
    shellState: "ready-empty",
    contextStatus: "active",
    experienceDataStatus: "empty",
  });
  assert.equal(snapshot.contextStatus, "ready");
  assert.equal(snapshot.dataStatus, "empty");
});

test("product shell does not render technical status bar", () => {
  const shell = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/OfficialControlPanelShell.tsx",
    ),
    "utf8",
  );
  assert.doesNotMatch(shell, /OfficialControlPanelStatusBar/);
});

test("mode switch does not show experience subview placeholder", () => {
  const modeSwitch = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/OfficialControlPanelModeSwitch.tsx",
    ),
    "utf8",
  );
  assert.doesNotMatch(
    modeSwitch,
    /Subvistas en el workspace de experiencia/,
  );
  assert.doesNotMatch(modeSwitch, /experience-subnav-note/);
});

test("KPI and experience body share projection wiring", () => {
  const kpi = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/ClientCompanyKpiStrip.tsx",
    ),
    "utf8",
  );
  const experience = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/ExperienceGovernanceMode.tsx",
    ),
    "utf8",
  );
  assert.match(kpi, /companyStateProjection/);
  assert.match(experience, /companyStateProjection\.currentStatusLabel/);
});

test("partial experience alerts KPI stays incomplete", () => {
  const view = aggregateCompanyState({
    experienceAlertsComplete: false,
    experienceState: {
      ...EMPTY_EXPERIENCE,
      dataStatus: "partial",
    },
  });
  assert.equal(view.experienceAlertCount, null);
});
