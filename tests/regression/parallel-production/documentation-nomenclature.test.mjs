import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("handoff Fase 2 section delegates generation rules to diagram contract", () => {
  const handoffDoc = readText("docs/capa1-parallel-production-design-handoff-contract.md");
  const phase2Section = handoffDoc.split("## Fase 2: Diagram Code Generation Candidate")[1].split("## Readiness Separados")[0];

  assert.ok(phase2Section.includes("platform-diagram-code-generation-contract.capa-1.parallel-production.v1"));
  assert.ok(phase2Section.includes("solo declara la transicion hacia ese tramo"));
  assert.ok(!phase2Section.includes("handoff packages que apunten"), "handoff blocking rules must not live inside Fase 2 generation section");
});

test("readiness nomenclature map declares canonical and deprecated terms", () => {
  const nomenclatureDoc = readText("docs/parallel-production-readiness-nomenclature-map.md");

  for (const term of [
    "design_source_readiness",
    "inventory_readiness",
    "handoff_readiness",
    "generation_readiness",
    "generation_mode",
    "export_readiness",
    "semantic_preservation_status",
    "ready_for_candidate_generation",
    "ready_with_warnings",
    "draft_with_warnings",
    "draft_only",
    "blocked",
  ]) {
    assert.ok(nomenclatureDoc.includes(term), `${term} missing from nomenclature map`);
  }

  assert.ok(nomenclatureDoc.includes("`export_ready`: deprecated alias"));
  assert.ok(nomenclatureDoc.includes("`export_ready_with_warnings`: deprecated alias"));
  assert.ok(nomenclatureDoc.includes("`export_blocked_*`: deprecated alias"));
});

test("diagram generation contract points to canonical nomenclature map", () => {
  const diagramDoc = readText("docs/contracts/platform-diagram-code-generation-contract.capa-1.parallel-production.v1.md");

  assert.ok(diagramDoc.includes("docs/parallel-production-readiness-nomenclature-map.md"));
  assert.ok(diagramDoc.includes("No confundir `handoff_readiness` con `generation_readiness`"));
});
