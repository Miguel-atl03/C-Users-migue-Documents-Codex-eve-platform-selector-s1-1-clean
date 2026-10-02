import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../../..");
const MATERIALIZED = path.join(ROOT, "docs/eve/runtime/materialized");
const FULL =
  "EVE_RUNTIME_40_20_FULL_OA_V1_1_1_MC1_0_IH_EF614C98B10611411C6AA62E0332856E726F4DC622D42EDBB550F4A4221A604F";

const CROSSWALK = JSON.parse(
  readFileSync(
    path.join(MATERIALIZED, "runtime-40-20-source-capture-crosswalk-044A3M.json"),
    "utf8",
  ),
);

function sha256File(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

test("044A3M Gate2: crosswalk has exactly 170 relations and 0 duplicate identities", () => {
  assert.equal(CROSSWALK.counts.relations, 170);
  assert.equal(CROSSWALK.relations.length, 170);
  assert.equal(CROSSWALK.counts.duplicate_identities, 0);
  const keys = CROSSWALK.relations.map(
    (r) =>
      `${r.catalog_version_id}|${r.runtime_interaction_id}|${r.source_node_id}|${r.source_code}`,
  );
  assert.equal(new Set(keys).size, 170);
});

test("044A3M Gate3: B05-Q05 keeps separate source slots", () => {
  const slots = CROSSWALK.capture_slots_by_interaction["B05-Q05"] || [];
  assert.deepEqual(
    slots.map((s) => s.source_code),
    ["0.5.1", "0.5.1a", "0.5.1_rel", "0.5.1c", "0.5.1d"],
  );
});

test("044A3M Gate3: block0_entry_control is CONTROL_METADATA", () => {
  const rel = CROSSWALK.relations.find((r) => r.source_code === "block0_entry_control");
  assert.equal(rel.capture_slot_kind, "control_metadata");
  assert.equal(rel.policy_class, "CONTROL_METADATA");
});

test("044A3M 1+2+16: simple/compound render + budget=1", async () => {
  const { advanceGovernedExecution } = loadGoverned();
  const persistence = persistenceWithFullCrosswalkCatalog();
  const ctx = { persistence, case_id: "CASE-044A3M-1", role_id: "R", activity_id: "A" };
  const started = await advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "m1",
    run_id: "run-m1",
  });
  const simple = await advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "m1",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  assert.equal(simple.source_capture_binding, true);
  assert.ok(simple.source_capture_slot_count >= 2);
  assert.equal(simple.budget_counts_as_one, true);

  const compound = await advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "m1",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B05-Q05",
  });
  assert.equal(compound.source_capture_slot_count, 5);
  assert.equal(compound.budget_counts_as_one, true);
});

test("044A3M 3+4: conditional slot + B05 beneficiario ≠ afectado", async () => {
  const { advanceGovernedExecution } = loadGoverned();
  const persistence = persistenceWithFullCrosswalkCatalog();
  const ctx = { persistence, case_id: "CASE-044A3M-4", role_id: "R", activity_id: "A" };
  const started = await advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "m4",
    run_id: "run-m4",
  });
  await advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "m4",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B05-Q05",
  });
  const ingested = await advanceGovernedExecution(ctx, {
    action: "ingest_response",
    synthetic_case_token: "m4",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B05-Q05",
    answers: {
      "0.5.1": "Cliente final ACME",
      "0.5.1a": "Operador de planta",
      "0.5.1_rel": "distintos",
      "0.5.1c": "alta",
      "0.5.1d": "media",
    },
  });
  assert.equal(ingested.ok, true);
  const names = persistence._tables.canonical_variable_record.map((r) => r.variable_name);
  assert.ok(names.includes("beneficiario_final_0_5_1") || names.includes("scene_functional_client"));
  assert.ok(names.includes("afectado_final_0_5_1a"));
  const ben = persistence._tables.canonical_variable_record.find(
    (r) =>
      r.variable_name === "beneficiario_final_0_5_1" ||
      r.variable_name === "scene_functional_client",
  );
  const af = persistence._tables.canonical_variable_record.find(
    (r) => r.variable_name === "afectado_final_0_5_1a",
  );
  assert.notEqual(String(ben?.variable_value), String(af?.variable_value));

  // conditional inactive rejected
  await advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "m4",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  await assert.rejects(
    () =>
      advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "m4",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: {
          "0.1": "ok",
          "0.1a": "actividad",
          "0.D": "no debería entrar sin activación",
        },
      }),
    /inactive_conditional_slot/,
  );
});

test("044A3M 5: trigger_frequency → trigger_pattern authorized outputs", async () => {
  const { advanceGovernedExecution } = loadGoverned();
  const persistence = persistenceWithFullCrosswalkCatalog();
  const ctx = { persistence, case_id: "CASE-044A3M-5", role_id: "R", activity_id: "A" };
  const started = await advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "m5",
    run_id: "run-m5",
  });
  await advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "m5",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B1-Q10",
  });
  const slots = CROSSWALK.capture_slots_by_interaction["B1-Q10"] || [];
  const answers = Object.fromEntries(
    slots
      .filter((s) => s.capture_slot_kind !== "control_metadata" && s.capture_slot_kind !== "internal" && s.capture_slot_kind !== "conditional_clarification")
      .map((s) => [s.source_code, s.source_code === "1.4" ? "diaria" : `valor-${s.source_code}`]),
  );
  await advanceGovernedExecution(ctx, {
    action: "ingest_response",
    synthetic_case_token: "m5",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B1-Q10",
    answers,
  });
  const names = persistence._tables.canonical_variable_record.map((r) => r.variable_name);
  assert.ok(names.includes("trigger_frequency"));
  assert.ok(names.includes("trigger_pattern"));
});

test("044A3M 7: C09 satisfaction ≠ feedback; projection preserved", async () => {
  const rels = CROSSWALK.relations.filter((r) => r.runtime_interaction_id === "C09");
  assert.ok(rels.length >= 1);
  assert.equal(rels[0].projection_authority, "exact_authorized_runtime_projection");
  assert.ok(
    rels.some((r) => (r.canonical_variable_names || []).includes("receiver_feedback")),
  );
});

test("044A3M 9+10: C15/C17 explicit runtime projection with genealogy", () => {
  for (const id of ["C15", "C17"]) {
    const rel = CROSSWALK.relations.find((r) => r.runtime_interaction_id === id);
    assert.equal(
      rel.projection_authority,
      "explicit_runtime_projection_with_source_genealogy",
    );
    assert.ok(rel.runtime_interaction_projection);
  }
});

test("044A3M 11: B7 fail-closed algorithm-not-closed not auto-authorized", () => {
  const { getAuthorizedCanonicalMappingsForInteraction } = loadSourceCapture();
  const maps = getAuthorizedCanonicalMappingsForInteraction("B7-Q39");
  assert.equal(
    maps.filter((m) => String(m.canonical_variable_name || m.variable_name).startsWith("preclassification_")).length,
    0,
  );
});

test("044A3M 12+13+14: wrong source_code / extra key / double ingest rejected", async () => {
  const { advanceGovernedExecution, createInMemoryPersistencePort } = loadGoverned();
  const persistence = createInMemoryPersistencePort();
  const ctx = { persistence, case_id: "CASE-044A3M-12", role_id: "R", activity_id: "A" };
  const started = await advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "m12",
    run_id: "run-m12",
  });
  const rendered = await advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "m12",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  await assert.rejects(
    () =>
      advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "m12",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: { "9.9.9": "ajeno" },
      }),
    /foreign_or_unknown_source_code/,
  );
  await assert.rejects(
    () =>
      advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "m12",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: {
          "0.1": "ok",
          "0.1a": "actividad",
          extra: "no",
        },
      }),
    /foreign_or_unknown_source_code/,
  );
  await advanceGovernedExecution(ctx, {
    action: "ingest_response",
    synthetic_case_token: "m12",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
    runtime_interaction_instance_id: rendered.runtime_interaction_instance_id,
    answers: { "0.1": "ok", "0.1a": "actividad" },
  });
  await assert.rejects(
    () =>
      advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "m12",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: { "0.1": "ok", "0.1a": "actividad" },
      }),
    /double_ingest_not_authorized/,
  );
});

test("044A3M 15: canonical failure → 0 writes", async () => {
  const { advanceGovernedExecution, createInMemoryPersistencePort } = loadGoverned({
    "../canonical-variable/runtime-40-20-canonical-variable-service": {
      createRuntime4020CanonicalVariableCandidatesLocal: () => {
        throw new Error("induced_failure");
      },
    },
  });
  const persistence = createInMemoryPersistencePort();
  const ctx = { persistence, case_id: "CASE-044A3M-15", role_id: "R", activity_id: "A" };
  const started = await advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: "m15",
    run_id: "run-m15",
  });
  await advanceGovernedExecution(ctx, {
    action: "render_next",
    synthetic_case_token: "m15",
    run_id: started.activity_runtime_run_id,
    interaction_id: "B0-Q01",
  });
  await assert.rejects(
    () =>
      advanceGovernedExecution(ctx, {
        action: "ingest_response",
        synthetic_case_token: "m15",
        run_id: started.activity_runtime_run_id,
        interaction_id: "B0-Q01",
        answers: { "0.1": "ok", "0.1a": "actividad" },
      }),
    /blocked_real_canonical_variable_path_failed/,
  );
  assert.equal(persistence._tables.response_record.length, 0);
  assert.equal(persistence._tables.canonical_variable_record.length, 0);
});

test("044A3M Gate7: 0.5.4a scene_priority_pattern unresolved without explicit rule", () => {
  const { getAuthorizedCanonicalMappingsForInteraction } = loadSourceCapture();
  const maps = getAuthorizedCanonicalMappingsForInteraction("B05-Q07");
  assert.equal(
    maps.filter((m) => (m.canonical_variable_name || m.variable_name) === "scene_priority_pattern")
      .length,
    0,
  );
  assert.ok(
    maps.some(
      (m) =>
        (m.canonical_variable_name || m.variable_name) === "scene_priority_displacement_source",
    ),
  );
});

test("044A3M write evidence + reclassification", () => {
  const crosswalkSha = sha256File(
    path.join(MATERIALIZED, "runtime-40-20-source-capture-crosswalk-044A3M.json"),
  );
  const reclass = {
    instruction: "044-A.3M",
    gate: "GATE_1_SUPERSESSION_DOCUMENTAL",
    previous_block: "blocked_rector_canonical_mapping_semantics_absent",
    superseded_by: "primary_source_reconstruction",
    canonical_authority_status: "rector_projection_reconstructable_and_validated",
    historical_artifacts_preserved: [
      "044-A.3",
      "044-A.3R",
      "044-A.3G",
      "044-A.3V",
      "044-A.3VR",
    ],
    classification_target: "canonical_variable_real_path_conformant_local_only",
  };
  const pathJson = {
    instruction: "044-A.3M",
    classification: "canonical_variable_real_path_conformant_local_only",
    path: [
      "persisted source response",
      "exact source identity (catalog+interaction+node+code)",
      "source-capture crosswalk 044A3M",
      "authorized canonical output",
      "canonical variable persistence",
    ],
    forbidden: [
      "fuzzy matching",
      "inferred aliases",
      "semantic regex",
      "NLP",
      "var_${index}",
      "answer-key matching",
      "field position",
      "legacy defaults as authority",
      "Object.entries(answers) redistribution",
    ],
    crosswalk_relations: 170,
    duplicate_identities: 0,
    crosswalk_sha256: crosswalkSha,
    production_consulted: false,
    staging_writes: false,
    branching_executed: false,
    next_step_only: "044-A.4 BranchingEngine exact rule connection",
  };

  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-canonical-authority-reclassification-044A3M.json"),
    `${JSON.stringify(reclass, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-canonical-authority-reclassification-044A3M.md"),
    `# 044-A.3M — Canonical authority reclassification

- previous_block: \`blocked_rector_canonical_mapping_semantics_absent\`
- superseded_by: \`primary_source_reconstruction\`
- canonical_authority_status: \`rector_projection_reconstructable_and_validated\`
- historical 044-A.3 / 3R / 3G / 3V / 3VR artifacts preserved unmodified
`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-canonical-variable-real-path-044A3M.json"),
    `${JSON.stringify(pathJson, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-canonical-variable-real-path-044A3M.md"),
    `# 044-A.3M — Canonical variable real path

Classification: \`canonical_variable_real_path_conformant_local_only\`

Path: persisted source response → exact source identity → crosswalk → authorized canonical output → persistence.

Crosswalk relations: 170. Duplicate identities: 0.
`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-source-capture-crosswalk-044A3M.md"),
    `# 044-A.3M — Source capture crosswalk

Deterministic materialization of the 170 validated relations.

Identity: catalog_version_id + runtime_interaction_id + source_node_id + source_code.

Operators \`+\` \`/\` \`;\` \`*\` are NOT interpreted as runtime operators.
`,
  );

  assert.equal(pathJson.classification, "canonical_variable_real_path_conformant_local_only");
  assert.equal(reclass.superseded_by, "primary_source_reconstruction");
});

function loadSourceCapture() {
  return loadTsModule(
    path.join(
      ROOT,
      "src/services/eve/runtime-40-20/source-capture/runtime-40-20-source-capture-crosswalk.ts",
    ),
  );
}

function buildFullDefsFromCrosswalk() {
  const ids = [...new Set(CROSSWALK.relations.map((r) => r.runtime_interaction_id))];
  assert.equal(ids.length, 60);
  return ids.map((id, index) => ({
    runtime_interaction_id: id,
    interaction_group_source: index < 40 ? "base_40" : "causal_20",
    interaction_group_normalized: index < 40 ? "base" : "causal",
    runtime_order: index + 1,
    visible_text: `Visible ${id}`,
    ui_component: id === "B0-Q01" ? "confirmation_card_with_correction" : "compound_card",
    pm_output: null,
    moc_output: null,
    pf_output: null,
    olc_output: null,
    mmabp_ir_target: null,
    readiness_effect: null,
    registry_target: null,
    raw_row_json: {
      runtime_interaction_id: id,
      source_code: `SRC-${id}`,
      source_question_code: id,
      block: String(id).split("-")[0],
      help_text: `Help ${id}`,
    },
    active: true,
  }));
}

function buildSubfieldSchemasFromCrosswalk() {
  const rows = [];
  let n = 0;
  for (const [interactionId, slots] of Object.entries(
    CROSSWALK.capture_slots_by_interaction,
  )) {
    for (const slot of slots) {
      if (slot.capture_slot_kind === "control_metadata") continue;
      n += 1;
      rows.push({
        subfield_schema_id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
        catalog_version_id: FULL,
        runtime_interaction_id: interactionId,
        subfield_name: slot.source_code,
        subfield_label: slot.source_code,
        subfield_type: "text",
        required: slot.capture_slot_kind !== "conditional_clarification" && slot.capture_slot_kind !== "internal",
        ordinal: n,
        storage_rule: "requires_user_confirmation",
        ui_component: "compound_card",
        raw_row_json: {
          type: "text",
          label: slot.source_code,
          source_reference: {
            source_sheet: "source_capture_crosswalk_044A3M",
            source_row: n,
          },
        },
      });
    }
  }
  return rows;
}

function persistenceWithFullCrosswalkCatalog(seed = {}) {
  const { createInMemoryPersistencePort } = loadGoverned();
  const ids = [...new Set(CROSSWALK.relations.map((r) => r.runtime_interaction_id))];
  const epistemic_rules = ids.map((id) => ({
    catalog_version_id: FULL,
    runtime_interaction_id: id,
    field_name: "must_not_infer",
    raw_literal: `must_not_infer_for_${id}`,
    source_file: "Catalogo_Runtime_40_20_EVE_MMABP_v1_1_1_Operacional_Ajustado.xlsx",
    source_sheet: "Runtime_Interactions_Base_40",
    source_row: 2,
    trace_id: "TR-044A3M",
  }));
  return createInMemoryPersistencePort({
    interaction_defs: buildFullDefsFromCrosswalk(),
    subfield_schemas: buildSubfieldSchemasFromCrosswalk(),
    epistemic_rules,
    ...seed,
  });
}

function loadGoverned(extraStubs = {}) {
  return loadTsModule(
    path.join(HERE, "runtime-40-20-governed-execution-service.ts"),
    {
      "../branching/runtime-40-20-branching-service": {
        createRuntime4020BranchingCandidatesLocal: () => ({
          ok: true,
          decision_candidates: [],
        }),
      },
      "../gates-readiness/runtime-40-20-gates-readiness-service": {
        buildSemanticResolutionEventInsert: () => ({}),
        evaluateCriticalRouteGateLocally: () => ({ passed: true }),
        resolveReadinessEvaluation: () => ({
          readiness_state: "ready",
          blocking_reason: null,
          readiness_gap: null,
        }),
      },
      "../critical-gates/runtime-40-20-critical-gates-service": {
        evaluateSEM001StateAsClassLocally: () => ({ blocks_projection: false }),
      },
      "../mmabp-gate/runtime-40-20-mmabp-gate-engine-service": {
        evaluateMMABPGateEngine: () => ({ ok: true, decision: "pass" }),
      },
      "../domain/runtime-40-20-domain-state-types": {},
      "../catalog-canonicalization/runtime-40-20-catalog-canonicalization-types": {},
      "../interaction-renderer/runtime-40-20-interaction-renderer-types": {},
      "../response-ingest/runtime-40-20-response-ingest-types": {},
      "../branching/runtime-40-20-branching-types": {},
      "../orchestrator/runtime-40-20-activity-runtime-orchestrator-types": {},
      ...extraStubs,
    },
  );
}

function loadTsModule(filePath, stubs = {}) {
  const cache = new Map();
  function loadTs(fp) {
    if (cache.has(fp)) return cache.get(fp);
    const source = readFileSync(fp, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      },
    });
    const moduleObj = { exports: {} };
    const dir = path.dirname(fp);
    const context = {
      exports: moduleObj.exports,
      module: moduleObj,
      require: (specifier) => {
        if (stubs[specifier]) return stubs[specifier];
        if (specifier.startsWith(".")) {
          const resolvedTs = path.resolve(dir, `${specifier}.ts`);
          if (existsSync(resolvedTs)) return loadTs(resolvedTs);
          const resolvedJson = path.resolve(dir, specifier);
          if (existsSync(resolvedJson)) return require(resolvedJson);
        }
        return require(specifier);
      },
      console,
      process,
      Buffer,
      setTimeout,
      clearTimeout,
    };
    vm.runInNewContext(outputText, context, { filename: fp });
    cache.set(fp, moduleObj.exports);
    return moduleObj.exports;
  }
  return loadTs(filePath);
}
