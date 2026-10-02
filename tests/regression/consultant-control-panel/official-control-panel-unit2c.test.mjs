import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  classifyOrphanCase,
  summarizeClassifications,
  FORBIDDEN_SOLE_EVIDENCE,
  CLASSIFICATIONS,
} from "../../../scripts/eve/official-control-panel/orphan-case-classification-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

test("classification is reproducible from snapshot inventory", () => {
  const inventoryPath = resolve(
    root,
    "reports/staging/unit2/orphan-cases-inventory.json",
  );
  assert.equal(existsSync(inventoryPath), true);
  const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
  assert.equal(inventory.totalAnalyzed, 80);
  assert.equal(inventory.classificationCounts.unambiguous, 0);
  assert.equal(inventory.classificationCounts["ambiguous-company"], 1);
  assert.equal(inventory.classificationCounts["insufficient-evidence"], 79);
});

test("unambiguous requires documentary company and relationship", () => {
  const result = classifyOrphanCase(
    { caseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    {
      documentaryCaseCompany: {
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa":
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      },
      documentaryCaseRelationships: {
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": [
          "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        ],
      },
      enabledRelationshipsByCompany: {
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": [
          { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", status: "enabled" },
        ],
      },
    },
  );
  assert.equal(result.classification, CLASSIFICATIONS.UNAMBIGUOUS);
  assert.equal(result.recommendedAction, "link");
});

test("ambiguous company when duplicate Amber notes present", () => {
  const result = classifyOrphanCase(
    { caseId: "cc983357-dd4a-42e9-b2f7-fa54364184df" },
    {
      ambiguousCompanyCases: {
        "cc983357-dd4a-42e9-b2f7-fa54364184df": [
          "duplicate amber company pair",
        ],
      },
    },
  );
  assert.equal(result.classification, CLASSIFICATIONS.AMBIGUOUS_COMPANY);
  assert.equal(result.recommendedAction, "manual-review");
});

test("ambiguous relationship when multiple documentary relationships", () => {
  const result = classifyOrphanCase(
    { caseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    {
      documentaryCaseCompany: {
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa":
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      },
      documentaryCaseRelationships: {
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": [
          "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        ],
      },
      enabledRelationshipsByCompany: {
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": [
          { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", status: "enabled" },
          { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", status: "enabled" },
        ],
      },
    },
  );
  assert.equal(result.classification, CLASSIFICATIONS.AMBIGUOUS_RELATIONSHIP);
});

test("insufficient evidence when no documentary company", () => {
  const result = classifyOrphanCase(
    { caseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    {},
  );
  assert.equal(result.classification, CLASSIFICATIONS.INSUFFICIENT_EVIDENCE);
  assert.equal(result.recommendedAction, "retain-unlinked");
});

test("duplicate company UUIDs detected in registry", () => {
  const registry = JSON.parse(
    readFileSync(
      resolve(root, "reports/staging/unit2/orphan-evidence-registry.json"),
      "utf8",
    ),
  );
  assert.equal(registry.companyDuplicates.length >= 1, true);
  assert.deepEqual(registry.companyDuplicates[0].companyIds.sort(), [
    "5c08029f-15e9-4bbd-b13e-0ff4765e23b8",
    "e6cdd265-b0a7-441d-a3b0-e0d7fdc842cf",
  ].sort());
});

test("rejects inference by usuario as allowed sole evidence kind", () => {
  assert.equal(FORBIDDEN_SOLE_EVIDENCE.includes("usuario_id"), true);
  assert.equal(FORBIDDEN_SOLE_EVIDENCE.includes("usuarios.empresa_id"), true);
});

test("rejects inference by name as allowed sole evidence kind", () => {
  assert.equal(FORBIDDEN_SOLE_EVIDENCE.includes("partial_name"), true);
  assert.equal(FORBIDDEN_SOLE_EVIDENCE.includes("textual_similarity"), true);
});

test("company without relationship when company known but relation unbound", () => {
  const result = classifyOrphanCase(
    { caseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    {
      documentaryCaseCompany: {
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa":
          "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      },
      documentaryCaseRelationships: {},
      enabledRelationshipsByCompany: {
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": [],
      },
    },
  );
  assert.equal(
    result.classification,
    CLASSIFICATIONS.COMPANY_WITHOUT_RELATIONSHIP,
  );
  assert.equal(result.recommendedAction, "create-relationship-review");
});

test("linking plan has zero proposed writes when A=0", () => {
  const plan = JSON.parse(
    readFileSync(
      resolve(root, "reports/staging/unit2/orphan-linking-plan.json"),
      "utf8",
    ),
  );
  assert.equal(plan.proposedLinks.length, 0);
});

test("linking result records no executed links", () => {
  const result = JSON.parse(
    readFileSync(
      resolve(root, "reports/staging/unit2/orphan-linking-result.json"),
      "utf8",
    ),
  );
  assert.equal(result.linkedCases, 0);
  assert.equal(result.orphanCasesAfter, 80);
  assert.equal(result.crossCompanyCases, 0);
  assert.equal(result.executedLinks.length, 0);
});

test("canonical Amber case is not treated as orphan", () => {
  const inventory = JSON.parse(
    readFileSync(
      resolve(root, "reports/staging/unit2/orphan-cases-inventory.json"),
      "utf8",
    ),
  );
  const ids = inventory.assessments.map((a) => a.caseId);
  assert.equal(ids.includes("19fc9eff-4219-43f0-854c-e2b3350f23f2"), false);
  assert.equal(
    inventory.preservedCanonicalAmber.caseId,
    "19fc9eff-4219-43f0-854c-e2b3350f23f2",
  );
});

test("summarizeClassifications aggregates counts", () => {
  const summary = summarizeClassifications([
    { classification: "insufficient-evidence" },
    { classification: "insufficient-evidence" },
    { classification: "ambiguous-company" },
  ]);
  assert.equal(summary["insufficient-evidence"], 2);
  assert.equal(summary["ambiguous-company"], 1);
});

test("classifier script and docs exist", () => {
  assert.equal(
    existsSync(
      resolve(
        root,
        "scripts/eve/official-control-panel/classify-orphan-cases.mjs",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        root,
        "docs/eve/panel-control/STAGING_ORPHAN_CASES_MASTER_INVENTORY.md",
      ),
    ),
    true,
  );
  assert.equal(
    existsSync(
      resolve(
        root,
        "docs/eve/panel-control/STAGING_ORPHAN_CASES_REMEDIATION_PLAN.md",
      ),
    ),
    true,
  );
});
