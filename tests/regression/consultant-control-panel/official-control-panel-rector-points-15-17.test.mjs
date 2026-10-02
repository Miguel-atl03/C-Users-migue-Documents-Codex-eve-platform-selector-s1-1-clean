import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  COMPANY_STATE_HIERARCHY,
  EXPERIENCE_EVENT_STATUS_MAP,
  EXPERIENCE_SCREEN_KEYS,
  capabilityForAction,
} from "../../../src/services/eve/official-control-panel/official-control-panel-experience.types.ts";
import { aggregateCompanyState } from "../../../src/services/eve/official-control-panel/official-control-panel-company-state-aggregation.ts";

test("experience screen catalog has product + panel instrumentation keys", () => {
  assert.equal(EXPERIENCE_SCREEN_KEYS.length, 23);
  assert.equal(
    EXPERIENCE_SCREEN_KEYS.filter((k) => !k.startsWith("panel_")).length,
    17,
  );
  assert.ok(EXPERIENCE_SCREEN_KEYS.includes("selector_interno_eve"));
  assert.ok(EXPERIENCE_SCREEN_KEYS.includes("generacion_outputs"));
  assert.ok(EXPERIENCE_SCREEN_KEYS.includes("bloque_0_5"));
  assert.ok(EXPERIENCE_SCREEN_KEYS.includes("panel_client_monitoring"));
  assert.ok(EXPERIENCE_SCREEN_KEYS.includes("panel_experience_screen_health"));
});

test("event/status map matches rector", () => {
  assert.equal(EXPERIENCE_EVENT_STATUS_MAP.screen_entered, "active");
  assert.equal(EXPERIENCE_EVENT_STATUS_MAP.screen_error, "blocked");
  assert.equal(EXPERIENCE_EVENT_STATUS_MAP.screen_recovered, "active");
});

test("company state hierarchy order", () => {
  assert.deepEqual([...COMPANY_STATE_HIERARCHY], [
    "Cerrado",
    "Bloqueado",
    "Atención",
    "En curso",
    "No iniciado",
  ]);
});

test("aggregateCompanyState prioritizes Bloqueado over Atención", () => {
  const view = aggregateCompanyState({
    hasCriticalMilestoneBlocker: true,
    experienceAlertsComplete: true,
    experienceState: {
      caseId: "x",
      companyId: "y",
      dataStatus: "available",
      emptyMessage: null,
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
      supportQueue: [
        {
          id: "s1",
          userId: "u1",
          screenKey: "bloque_0",
          screenLabel: "Bloque 0",
          actionType: "send_message",
          reasonCode: "r",
          beforeState: "blocked",
          expectedEffect: "e",
          capability: "send_support_message",
          actorId: "a",
          createdAt: new Date().toISOString(),
          source: "support_action",
          roleRuntimeSessionId: null,
          activityId: null,
        },
      ],
      capabilities: ["view_experience_state"],
    },
  });
  assert.equal(view.companyState, "Bloqueado");
  assert.equal(view.experienceAlertCount, 1);
});

test("KPI experience alerts null when incomplete", () => {
  const view = aggregateCompanyState({
    experienceAlertsComplete: false,
  });
  assert.equal(view.experienceAlertCount, null);
});

test("capabilityForAction mapping", () => {
  assert.equal(capabilityForAction("send_message"), "send_support_message");
  assert.equal(capabilityForAction("resume_link"), "send_support_message");
  assert.equal(capabilityForAction("request_reentry"), "request_reentry");
});

test("navigation allows experience mode and normalizes view", () => {
  const nav = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/state/official-control-panel-navigation.ts",
    ),
    "utf8",
  );
  assert.ok(!/force to client-company|never activate/i.test(nav));
  assert.ok(/user-experience-governance/.test(nav));
  assert.ok(/isExperienceGovernanceView/.test(nav));
  assert.ok(/journeys/.test(nav));
});

test("migration and rollback scripts exist", () => {
  for (const file of [
    "supabase/migrations/20260718100000_eve_point15_17_experience_governance.sql",
    "scripts/eve/official-control-panel/seed-point15-17-experience-test.mjs",
    "scripts/eve/official-control-panel/verify-point15-17-experience-integrity.mjs",
    "scripts/eve/official-control-panel/verify-point15-17-action-chain.mjs",
    "scripts/eve/official-control-panel/rollback-point15-17-experience-preserve-data.sql",
    "scripts/eve/official-control-panel/reapply-point15-17-experience-writes.sql",
  ]) {
    assert.ok(existsSync(resolve(file)), file);
  }

  const actionChain = readFileSync(
    resolve(
      "scripts/eve/official-control-panel/verify-point15-17-action-chain.mjs",
    ),
    "utf8",
  );
  assert.match(actionChain, /experience-actions/);
  assert.match(actionChain, /seed-point15-17-experience-test/);
  assert.doesNotMatch(actionChain, /page\.route\(\)|route\.fulfill/);

  const sql = readFileSync(
    resolve(
      "supabase/migrations/20260718100000_eve_point15_17_experience_governance.sql",
    ),
    "utf8",
  );
  assert.match(sql, /experience_write_control/);
  assert.match(sql, /aaa_prevent_experience_screen_event_mutation/);
  assert.match(sql, /aaa_prevent_experience_support_action_mutation/);
  assert.match(sql, /eve_record_experience_screen_event/);
  assert.match(sql, /eve_apply_experience_support_action/);
  assert.match(sql, /eve_consultant_can_access_case/);
  assert.match(sql, /p_policy_authorized/);

  const panelCatalog = readFileSync(
    resolve(
      "supabase/migrations/20260718210000_eve_point15_17_panel_screen_catalog.sql",
    ),
    "utf8",
  );
  assert.match(panelCatalog, /panel_client_monitoring/);
  assert.match(panelCatalog, /panel_experience_screen_health/);

  const eventsRoute = readFileSync(
    resolve(
      "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/experience-events/route.ts",
    ),
    "utf8",
  );
  assert.match(eventsRoute, /eve_record_experience_event_as_user/);
  assert.match(eventsRoute, /authenticateOfficialControlPanelConsultant/);
  assert.doesNotMatch(eventsRoute, /createOfficialControlPanelServiceRoleClient/);

  const rollback = readFileSync(
    resolve(
      "scripts/eve/official-control-panel/rollback-point15-17-experience-preserve-data.sql",
    ),
    "utf8",
  );
  assert.ok(!/drop table/i.test(rollback));
  assert.ok(/enabled = false/i.test(rollback));
  assert.ok(/Append-only mutation preventers remain ACTIVE/i.test(rollback));
});

test("ModeSwitch enables experience without Próximamente", () => {
  const modeSwitch = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/OfficialControlPanelModeSwitch.tsx",
    ),
    "utf8",
  );
  assert.ok(!/Próximamente/.test(modeSwitch));
  assert.ok(!/\bdisabled\b/.test(modeSwitch));
  assert.ok(/user-experience-governance/.test(modeSwitch));
});
