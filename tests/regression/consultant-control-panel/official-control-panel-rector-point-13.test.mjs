#!/usr/bin/env node
/**
 * §13 regression — uses productive evaluateManualHandoffOverdue (no duplicate).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { createRequire } from "node:module";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// Import productive evaluator via Node strip-types
const { evaluateManualHandoffOverdue } = await import(
  `file:///${resolve(root, "src/services/eve/official-control-panel/official-control-panel-manual-handoff-overdue.ts").replace(/\\/g, "/")}`
);

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

test("integrity migration exists and does not edit original", () => {
  assert.equal(
    existsSync(
      resolve(
        root,
        "supabase/migrations/20260718020000_eve_point13_manual_work_integrity_fix.sql",
      ),
    ),
    true,
  );
  const sql = read(
    "supabase/migrations/20260718020000_eve_point13_manual_work_integrity_fix.sql",
  );
  assert.match(sql, /manual_work_allowed_transition/);
  assert.match(sql, /manual_work_transition_not_allowed/);
  assert.match(sql, /manual_work_event_append_only/);
  assert.match(sql, /work_unblocked/);
  assert.doesNotMatch(sql, /drop table if exists public\.manual_process_work_item;/);
});

test("manual-actions product route exists for R2", () => {
  assert.equal(
    existsSync(
      resolve(
        root,
        "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-actions/route.ts",
      ),
    ),
    true,
  );
  const route = read(
    "src/app/api/eve/official-consultant-control-panel/cases/[caseId]/manual-actions/route.ts",
  );
  assert.match(route, /eve_apply_manual_work_product_action_as_consultant/);
  assert.doesNotMatch(route, /createOfficialControlPanelServiceRoleClient/);
});

test("productive overdue evaluator cases", () => {
  const now = new Date("2026-07-18T18:00:00.000Z");
  assert.equal(
    evaluateManualHandoffOverdue(
      {
        handoffStatus: "pending",
        manualTrackingStatus: "submitted",
        expectedHandoffAt: "2026-07-17T18:00:00.000Z",
        expectedEvent: "handoff_sintesis_experta",
      },
      now,
    ).overdue,
    true,
  );
  assert.equal(
    evaluateManualHandoffOverdue(
      {
        handoffStatus: "pending",
        manualTrackingStatus: "submitted",
        expectedHandoffAt: "2026-07-19T18:00:00.000Z",
        expectedEvent: "handoff_sintesis_experta",
      },
      now,
    ).overdue,
    false,
  );
  assert.equal(
    evaluateManualHandoffOverdue({
      handoffStatus: "pending",
      manualTrackingStatus: "submitted",
      expectedHandoffAt: null,
      expectedEvent: "x",
    }).evaluable,
    false,
  );
  assert.equal(
    evaluateManualHandoffOverdue({
      handoffStatus: "pending",
      manualTrackingStatus: "submitted",
      expectedHandoffAt: "2026-07-17T18:00:00.000Z",
      expectedEvent: "",
    }).evaluable,
    false,
  );
  assert.equal(
    evaluateManualHandoffOverdue({
      handoffStatus: "accepted",
      manualTrackingStatus: "submitted",
      expectedHandoffAt: "2026-07-17T18:00:00.000Z",
      expectedEvent: "x",
    }).evaluable,
    false,
  );
  assert.equal(
    evaluateManualHandoffOverdue({
      handoffStatus: "closed",
      manualTrackingStatus: "submitted",
      expectedHandoffAt: "2026-07-17T18:00:00.000Z",
      expectedEvent: "x",
    }).evaluable,
    false,
  );
  assert.equal(
    evaluateManualHandoffOverdue({
      handoffStatus: "pending",
      manualTrackingStatus: "submitted",
      expectedHandoffAt: "not-a-date",
      expectedEvent: "x",
    }).evaluable,
    false,
  );
  assert.equal(
    evaluateManualHandoffOverdue(
      {
        handoffStatus: "pending",
        manualTrackingStatus: "accepted",
        expectedHandoffAt: "2026-07-17T18:00:00.000Z",
        expectedEvent: "x",
      },
      now,
    ).evaluable,
    false,
  );
  // timezone consistency: same instant
  const due = "2026-07-18T12:00:00-06:00";
  const nowMx = new Date("2026-07-18T19:00:00.000Z"); // after due
  assert.equal(
    evaluateManualHandoffOverdue(
      {
        handoffStatus: "pending",
        manualTrackingStatus: "submitted",
        expectedHandoffAt: due,
        expectedEvent: "x",
      },
      nowMx,
    ).overdue,
    true,
  );
});

test("UI copy avoids MBA tecnicismos and ornamental actions", () => {
  const panel = read(
    "src/features/official-consultant-control-panel/components/ManualWorkPanel.tsx",
  );
  const presentation = read(
    "src/features/official-consultant-control-panel/presentation/manual-work-presentation.ts",
  );
  assert.doesNotMatch(panel, /Object\[State\] MBA/);
  assert.doesNotMatch(panel, /Escalar responsable/);
  assert.doesNotMatch(panel, /Descargar paquete/);
  assert.match(
    presentation,
    /aceptación del resultado se confirma por separado/,
  );
  const attention = read(
    "src/features/official-consultant-control-panel/components/AttentionGovernancePanel.tsx",
  );
  assert.doesNotMatch(attention, /Escalar responsable/);
});

test("strict transition-event migration exists", () => {
  assert.equal(
    existsSync(
      resolve(
        root,
        "supabase/migrations/20260718030000_eve_point13_transition_event_strict.sql",
      ),
    ),
    true,
  );
  const sql = read(
    "supabase/migrations/20260718030000_eve_point13_transition_event_strict.sql",
  );
  assert.match(sql, /manual_work_transition_rules/);
  assert.match(sql, /manual_work_write_control/);
  assert.match(sql, /manual_work_direct_write_forbidden/);
  assert.match(sql, /revoke all on table public\.manual_process_work_item from service_role/i);
});

test("preserve-data rollback disables write gate and RPC", () => {
  const rb = read(
    "scripts/eve/official-control-panel/rollback-point13-manual-work-preserve-data.sql",
  );
  assert.match(rb, /manual_work_write_control/);
  assert.match(rb, /enabled = false/);
  assert.match(rb, /revoke execute/);
  assert.doesNotMatch(rb, /drop table public\.manual_process_work_item/);
});
