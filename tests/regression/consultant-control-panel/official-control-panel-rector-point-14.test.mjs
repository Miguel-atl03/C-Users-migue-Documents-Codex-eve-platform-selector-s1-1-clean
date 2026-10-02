import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  PP_QA_EVALUATION_ORDER,
  isExportEligibleGate,
  withFindingsIsNotSatisfied,
} from "../../../src/services/eve/official-control-panel/official-control-panel-parallel-production.types.ts";

test("conformance precedes consistency in evaluation order", () => {
  assert.equal(PP_QA_EVALUATION_ORDER[0], "conformance");
  assert.ok(PP_QA_EVALUATION_ORDER.indexOf("consistency_factual") > 0);
});

test("WithFindings is not Satisfied", () => {
  assert.equal(withFindingsIsNotSatisfied("WithFindings"), true);
  assert.equal(withFindingsIsNotSatisfied("Satisfied"), false);
});

test("export eligibility gate rejects findings and B3/B7", () => {
  assert.equal(
    isExportEligibleGate({
      acaStatus: "Satisfied",
      conformanceStatus: "passed",
      consistencyCompositeStatus: "passed",
      b3RouteException: false,
      b7BoundaryViolation: false,
      openBlockingFindings: 0,
    }),
    true,
  );
  assert.equal(
    isExportEligibleGate({
      acaStatus: "WithFindings",
      conformanceStatus: "passed",
      consistencyCompositeStatus: "passed",
      b3RouteException: false,
      b7BoundaryViolation: false,
      openBlockingFindings: 0,
    }),
    false,
  );
  assert.equal(
    isExportEligibleGate({
      acaStatus: "Satisfied",
      conformanceStatus: "passed",
      consistencyCompositeStatus: "passed",
      b3RouteException: true,
      b7BoundaryViolation: false,
      openBlockingFindings: 0,
    }),
    false,
  );
});

test("integrity migrations and preserve-data rollback exist", () => {
  for (const file of [
    "supabase/migrations/20260718040000_eve_point14_integrity_transition_fix.sql",
    "supabase/migrations/20260718050000_eve_point14_reevaluation_append_only_fix.sql",
    "supabase/migrations/20260718060000_eve_point14_factual_qa_export_closure.sql",
  ]) {
    assert.ok(existsSync(resolve(file)), file);
  }
  const migration500 = readFileSync(
    resolve(
      "supabase/migrations/20260718050000_eve_point14_reevaluation_append_only_fix.sql",
    ),
    "utf8",
  );
  assert.ok(/reevaluation_completed/.test(migration500));
  assert.ok(/prevent_parallel_production_event_mutation/.test(migration500));
  assert.ok(/prevent_qa_finding_event_mutation/.test(migration500));
  assert.ok(
    !/reevaluation_started',\s*'resolved'/.test(migration500.replace(/\s+/g, " ")),
  );

  const migration600 = readFileSync(
    resolve(
      "supabase/migrations/20260718060000_eve_point14_factual_qa_export_closure.sql",
    ),
    "utf8",
  );
  assert.ok(/eve_pp_finding_factually_resolved/.test(migration600));
  assert.ok(/eve_pp_assert_package_factual_closure/.test(migration600));

  const rollback = readFileSync(
    resolve(
      "scripts/eve/official-control-panel/rollback-point14-parallel-production-preserve-data.sql",
    ),
    "utf8",
  );
  assert.ok(!/drop table/i.test(rollback));
  assert.ok(/revoke execute/i.test(rollback));
  assert.ok(/enabled = false/i.test(rollback));
  assert.ok(/Append-only mutation preventers remain ACTIVE/i.test(rollback));
  assert.ok(
    /uuid, text, text, text, text, text, text, text, text, text/.test(rollback),
  );
});

test("UI avoids ornamental export buttons and MBA jargon as primary copy", () => {
  const panel = readFileSync(
    resolve(
      "src/features/official-consultant-control-panel/components/ParallelProductionPanel.tsx",
    ),
    "utf8",
  );
  assert.ok(!/Object\[State\]/.test(panel));
  assert.ok(!/Generar exportación/.test(panel));
  assert.ok(/Generador no disponible/.test(panel));
  assert.ok(/P-SUP-06/.test(panel));
});
