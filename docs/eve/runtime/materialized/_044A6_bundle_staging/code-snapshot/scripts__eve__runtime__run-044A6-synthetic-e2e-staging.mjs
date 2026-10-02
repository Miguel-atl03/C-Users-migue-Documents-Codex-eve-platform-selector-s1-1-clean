/**
 * 044-A.6 — Synthetic E2E staging runner (Runs A/B/C).
 * Uses real governed path + PG staging persistence.
 * Never prints DATABASE_URL / secrets.
 */
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import pg from "pg";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const MATERIALIZED = path.join(ROOT, "docs/eve/runtime/materialized");
const FULL =
  "EVE_RUNTIME_40_20_FULL_OA_V1_1_1_MC1_0_IH_EF614C98B10611411C6AA62E0332856E726F4DC622D42EDBB550F4A4221A604F";
const STAGING_REF = "shrpiwkxcdgvbqymjecx";
const PROTECTED_REF = "bwflscplkjohdhkiqqoc";

const CROSSWALK = JSON.parse(
  readFileSync(
    path.join(
      ROOT,
      "src/services/eve/runtime-40-20/source-capture/runtime-40-20-source-capture-crosswalk-044A3M.json",
    ),
    "utf8",
  ),
);

const BASE_ORDER = [
  "B0-Q01",
  "B0-Q02",
  "B0-Q03",
  "B0-Q04",
  "B05-Q05",
  "B05-Q06",
  "B05-Q07",
  "B1-Q08",
  "B1-Q09",
  "B1-Q10",
  "B1-Q11",
  "B2-Q12",
  "B2-Q13",
  "B2-Q14",
  "B2-Q15",
  "B2-Q16",
  "B2-Q17",
  "B3-Q18",
  "B3-Q19",
  "B3-Q20",
  "B3-Q21",
  "B3-Q22",
  "B4-Q23",
  "B4-Q24",
  "B4-Q25",
  "B4-Q26",
  "B4-Q27",
  "B4-Q28",
  "B5-Q29",
  "B5-Q30",
  "B5-Q31",
  "B5-Q32",
  "B5-Q33",
  "B6-Q34",
  "B6-Q35",
  "B6-Q36",
  "B6-Q37",
  "B6-Q38",
  "B7-Q39",
  "B7-Q40",
];

function assertStagingUrl(url) {
  if (!url) throw new Error("blocked_staging_db_url_missing");
  if (url.includes(PROTECTED_REF)) {
    throw new Error("blocked_staging_identity_mismatch:protected_project_ref");
  }
  if (!url.includes(STAGING_REF)) {
    throw new Error("blocked_staging_identity_mismatch:expected_staging_ref");
  }
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
          const asJson = path.resolve(dir, specifier);
          if (existsSync(asJson)) return require(asJson);
          if (existsSync(`${asJson}.ts`)) return loadTs(`${asJson}.ts`);
        }
        if (specifier.startsWith("node:")) return require(specifier);
        return require(specifier);
      },
      console,
      process,
      Buffer,
      setTimeout,
      clearTimeout,
      URL,
      TextEncoder,
      TextDecoder,
    };
    vm.runInNewContext(outputText, context, { filename: fp });
    cache.set(fp, moduleObj.exports);
    return moduleObj.exports;
  }
  return loadTs(filePath);
}

function firstOption(optionsLiteral) {
  const raw = String(optionsLiteral ?? "").trim();
  if (!raw || raw === "N/A") return "sintetico_044A6";
  const cleaned = raw
    .replace(/fallback_options:\s*/gi, "")
    .replace(/Dinámicas[^|]*\|?/gi, "")
    .replace(/Opciones dinámicas[^.]+\.?/gi, "");
  const parts = cleaned
    .split(/\s*\/\s*|\s*\|\s*|;|\n/)
    .map((p) => p.replace(/^\d+\)\s*/, "").trim())
    .filter((p) => p && p.length > 1 && !/^opciones/i.test(p) && !/^number_/i.test(p));
  return parts[0] ?? "sintetico_044A6";
}

function buildAnswersForInteraction(interactionId, scenario) {
  const slots = CROSSWALK.capture_slots_by_interaction[interactionId] || [];
  const rels = CROSSWALK.relations.filter(
    (r) => r.runtime_interaction_id === interactionId,
  );
  const answers = {};
  for (const slot of slots) {
    if (
      slot.capture_slot_kind === "control_metadata" ||
      slot.capture_slot_kind === "conditional_clarification" ||
      slot.capture_slot_kind === "internal"
    ) {
      continue;
    }
    const rel = rels.find((r) => r.source_code === slot.source_code);
    const code = slot.source_code;

    if (scenario.answer_overrides?.[interactionId]?.[code] !== undefined) {
      answers[code] = String(scenario.answer_overrides[interactionId][code]);
      continue;
    }

    // All bound capture subfields use type "text" in the governed binder.
    if (code === "0.1") answers[code] = "Sí, está correcto";
    else if (code === "0.1a")
      answers[code] = "Elaborar pedido de cliente sintético 044A6";
    else if (code === "0.2")
      answers[code] = "Preparar y enviar el pedido operativo al área siguiente";
    else if (code === "0.3") answers[code] = "Diaria";
    else if (code === "0.4") answers[code] = "En horario laboral estándar";
    else if (code === "0.5_actor_scope") answers[code] = "Yo mismo";
    else if (code === "0.6") answers[code] = "Cuando llega un pedido nuevo";
    else if (code === "0.7") answers[code] = "Pedido listo para el siguiente equipo";
    else if (code === "0.5.1") answers[code] = "Cliente externo";
    else if (code === "0.5.1a") answers[code] = "Otro equipo";
    else if (code === "0.5.1_rel") answers[code] = "Son actores distintos";
    else if (code === "0.5.1c" || code === "0.5.1d") answers[code] = "Muy claro";
    else if (code === "0.5.2") answers[code] = "Otro (especificar)";
    else if (code === "0.5.3") answers[code] = "Pedido confirmado listo para despacho";
    else if (code === "0.5.4" || code === "0.5.4a") answers[code] = "El cliente lo exige";
    else if (code === "4.5")
      answers[code] =
        "Sí, a veces queda bloqueada y tengo que ir a preguntar";
    else if (code === "3.13") answers[code] = "Lo acepta sin cambios";
    else if (code === "3.10") answers[code] = "No, siempre llega como se espera";
    else if (code === "2.9") answers[code] = "No, siempre se transforma correctamente";
    else if (code === "7.1")
      answers[code] = "Transformación operativa del pedido";
    else if (code === "7.4") answers[code] = "Sin aclaración adicional";
    else if (code === "7.2" || code === "7.3")
      answers[code] = firstOption(rel?.options);
    else if (code === "7.3a") answers[code] = "Sin nota interpersonal adicional";
    else if (code === "4.5b")
      answers[code] = firstOption(rel?.options) || "Supervisor de área";
    else if (code === "5.1" || code === "5.2")
      answers[code] = "10 pedidos/día";
    else if (code === "6.7") answers[code] = "5 — carga media";
    else if (String(rel?.field_type ?? "").includes("free_text"))
      answers[code] = `Respuesta sintética 044A6 para ${code}`;
    else answers[code] = firstOption(rel?.options);
  }
  return answers;
}

function createPgClient(url) {
  assertStagingUrl(url);
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  let connected = false;
  return {
    async query(sql, params) {
      if (!connected) {
        await client.connect();
        connected = true;
      }
      return client.query(sql, params);
    },
    async end() {
      if (connected) await client.end();
    },
  };
}

async function snapshotIsolation(pgClient, token) {
  const r = await pgClient.query(
    `select
      (select count(*)::int from public.role_runtime_session
        where (
          case_id ~* '(^|[^a-z])gaby([^a-z]|$)'
          or role_id ~* '(^|[^a-z])gaby([^a-z]|$)'
        )
        and coalesce(metadata_json->>'synthetic','false') <> 'true'
        and coalesce(metadata_json->>'instruction','') <> '044'
       ) as gaby_sessions,
      (select count(*)::int from public.scene_registry) as scene_registry,
      (select count(*)::int from public.mba_event_ledger) as mba_ledger,
      (select count(*)::int from public.parallel_production_run) as parallel_runs,
      (select count(*)::int from public.role_runtime_session
        where case_id like $1 or coalesce(metadata_json->>'synthetic_case_token','') like $2) as synthetic_sessions,
      (select source_xlsx_checksum from public.runtime_catalog_version
        where catalog_version_id=$3) as full_xlsx_sha,
      (select status::text from public.runtime_catalog_version
        where catalog_version_id=$3) as full_status`,
    [`%${token}%`, `%${token}%`, FULL],
  );
  return r.rows[0];
}

async function reconcileRun(pgClient, runId) {
  const q = async (sql) =>
    (await pgClient.query(sql, [runId])).rows[0].c;
  return {
    interaction_instances: await q(
      `select count(*)::int as c from public.runtime_interaction_instance where activity_runtime_run_id=$1`,
    ),
    responses: await q(
      `select count(*)::int as c from public.response_record where activity_runtime_run_id=$1`,
    ),
    subfields: await q(
      `select count(*)::int as c from public.runtime_subfield_response r
       join public.response_record rr on rr.response_id=r.response_id
       where rr.activity_runtime_run_id=$1`,
    ),
    evidence: await q(
      `select count(*)::int as c from public.evidence_item where activity_runtime_run_id=$1`,
    ),
    canonical: await q(
      `select count(*)::int as c from public.canonical_variable_record where activity_runtime_run_id=$1`,
    ),
    branching: await q(
      `select count(*)::int as c from public.branching_decision where activity_runtime_run_id=$1`,
    ),
    budget: await q(
      `select count(*)::int as c from public.budget_ledger where activity_runtime_run_id=$1`,
    ),
    sem: await q(
      `select count(*)::int as c from public.semantic_resolution_event where activity_runtime_run_id=$1`,
    ),
    pst: await q(
      `select count(*)::int as c from public.process_state_timer_event where activity_runtime_run_id=$1`,
    ),
    readiness_gaps: await q(
      `select count(*)::int as c from public.readiness_gap_record where activity_runtime_run_id=$1`,
    ),
    readiness_decisions: await q(
      `select count(*)::int as c from public.readiness_decision_record where activity_runtime_run_id=$1`,
    ),
    audit: await q(
      `select count(*)::int as c from public.runtime_audit_trail where activity_runtime_run_id=$1`,
    ),
    budget_sums: (
      await pgClient.query(
        `select coalesce(sum(base_count_delta),0)::int as base_used,
                coalesce(sum(causal_count_delta),0)::int as causal_used
         from public.budget_ledger where activity_runtime_run_id=$1`,
        [runId],
      )
    ).rows[0],
  };
}

async function runScenario(services, pgClient, scenario) {
  const { advanceGovernedExecution, createRuntime4020PgPersistenceAdapter } =
    services;
  const persistence = createRuntime4020PgPersistenceAdapter(pgClient);
  const token = scenario.token;
  const ctx = {
    persistence,
    case_id: `synthetic:044A6:${token}`,
    role_id: `synthetic-role-044A6-${token}`,
    activity_id: `synthetic-activity-044A6-${token}`,
    tenant_id: "synthetic-tenant-044A6",
    owner_auth_user_id: null,
  };

  const lineage = [];
  const stateTrace = [];
  const started = await advanceGovernedExecution(ctx, {
    action: "start_synthetic_run",
    synthetic_case_token: token,
    // Label for isolation; PK uuid allocated by governed start when non-uuid.
    run_id: `run-044A6-${token}`,
  });
  stateTrace.push({
    at: "start",
    state: started.state,
    run_id: started.activity_runtime_run_id,
    synthetic_run_label: `run-044A6-${token}`,
  });
  const runId = started.activity_runtime_run_id;
  const openedQueue = [];

  async function renderAndIngest(interactionId, extra = {}) {
    const rendered = await advanceGovernedExecution(ctx, {
      action: "render_next",
      synthetic_case_token: token,
      run_id: runId,
      interaction_id: interactionId,
    });
    const answers = buildAnswersForInteraction(interactionId, scenario);
    const ingested = await advanceGovernedExecution(ctx, {
      action: "ingest_response",
      synthetic_case_token: token,
      run_id: runId,
      interaction_id: interactionId,
      runtime_interaction_instance_id: rendered.runtime_interaction_instance_id,
      answers,
      ...extra,
    });
    const opened = (ingested.branching_outcomes || []).filter(
      (o) => o.result === "opened",
    );
    for (const o of opened) {
      if (!openedQueue.includes(o.target_causal_interaction_id)) {
        openedQueue.push(o.target_causal_interaction_id);
      }
    }
    lineage.push({
      runtime_interaction_id: interactionId,
      instance_id: rendered.runtime_interaction_instance_id,
      source_capture_slot_count: rendered.source_capture_slot_count,
      response_id: ingested.response_id,
      budget_base: ingested.base_visible_count,
      budget_causal: ingested.causal_visible_count,
      branching_outcomes: ingested.branching_outcomes,
      b7_confidence: ingested.b7_confidence
        ? {
            level: ingested.b7_confidence.confidence_level,
            score: ingested.b7_confidence.confidence_score,
          }
        : null,
    });
    return { rendered, ingested };
  }

  // Base 40 (or truncated for fail-closed)
  const baseList = scenario.base_interactions || BASE_ORDER;
  for (const id of baseList) {
    try {
      const extra =
        id === "B7-Q39" && scenario.b7_confidence_input
          ? { b7_confidence_input: scenario.b7_confidence_input }
          : {};
      await renderAndIngest(id, extra);
      // Drain opened causals immediately (no skip to readiness)
      while (openedQueue.length > 0) {
        const causalId = openedQueue.shift();
        if (causalId === "C20" && scenario.c20_answers) {
          const rendered = await advanceGovernedExecution(ctx, {
            action: "render_next",
            synthetic_case_token: token,
            run_id: runId,
            interaction_id: causalId,
          });
          const ingested = await advanceGovernedExecution(ctx, {
            action: "ingest_response",
            synthetic_case_token: token,
            run_id: runId,
            interaction_id: causalId,
            runtime_interaction_instance_id:
              rendered.runtime_interaction_instance_id,
            answers: {
              ...buildAnswersForInteraction(causalId, scenario),
              ...Object.fromEntries(
                Object.entries(scenario.c20_answers).map(([k, v]) => [
                  k,
                  String(v),
                ]),
              ),
            },
          });
          const opened = (ingested.branching_outcomes || []).filter(
            (o) => o.result === "opened",
          );
          for (const o of opened) {
            if (!openedQueue.includes(o.target_causal_interaction_id)) {
              openedQueue.push(o.target_causal_interaction_id);
            }
          }
          lineage.push({
            runtime_interaction_id: causalId,
            instance_id: rendered.runtime_interaction_instance_id,
            source_capture_slot_count: rendered.source_capture_slot_count,
            response_id: ingested.response_id,
            budget_base: ingested.base_visible_count,
            budget_causal: ingested.causal_visible_count,
            branching_outcomes: ingested.branching_outcomes,
            b7_confidence: ingested.b7_confidence
              ? {
                  level: ingested.b7_confidence.confidence_level,
                  score: ingested.b7_confidence.confidence_score,
                }
              : null,
          });
        } else {
          await renderAndIngest(causalId);
        }
      }
    } catch (error) {
      throw new Error(
        `scenario_${scenario.name}_failed_at_${id}:${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // Any remaining opened causals
  while (openedQueue.length > 0) {
    const causalId = openedQueue.shift();
    await renderAndIngest(causalId);
  }

  stateTrace.push({ at: "post_capture", opened_remaining: openedQueue.length });

  const gates = await advanceGovernedExecution(ctx, {
    action: "evaluate_gates",
    synthetic_case_token: token,
    run_id: runId,
    answers: {
      // CR-B3: demonstrate receiver_satisfaction ≠ receiver_feedback (no inference).
      "canonical:receiver_satisfaction": "Lo acepta sin cambios",
      "canonical:receiver_feedback":
        "Feedback canónico de receptor ausente / no capturado",
      "canonical:receiver_feedback_exists": false,
      "canonical:receiver_satisfaction_separated": true,
      ...(scenario.gate_canonical_overrides ?? {}),
    },
    sem_signals: scenario.sem_signals ?? {
      state_as_class_detected: false,
      attribute_as_class_detected: false,
      process_as_object_detected: false,
      false_isa_by_type_of_detected: false,
      alias_or_duplicate_detected: false,
      role_phase_end_confusion_detected: false,
      fused_marsupial_object_detected: false,
    },
    process_state_wait: scenario.process_state_wait,
    b7_contamination: scenario.b7_contamination,
    b7_confidence_input: scenario.gates_b7_confidence_input,
  });
  stateTrace.push({
    at: "evaluate_gates",
    phase: gates.runtime_phase,
    classification: gates.regulatory_layer?.classification_hint,
  });

  let readiness;
  let readinessError = null;
  try {
    readiness = await advanceGovernedExecution(ctx, {
      action: "complete_readiness",
      synthetic_case_token: token,
      run_id: runId,
      force_ready: scenario.force_ready === true ? true : undefined,
    });
    stateTrace.push({
      at: "complete_readiness",
      readiness_state: readiness.readiness_state,
      terminal: readiness.terminal_state,
    });
  } catch (error) {
    readinessError = error instanceof Error ? error.message : String(error);
    stateTrace.push({ at: "complete_readiness_error", error: readinessError });
  }

  const recon = await reconcileRun(pgClient, runId);
  return {
    scenario: scenario.name,
    token,
    run_id: runId,
    case_id: ctx.case_id,
    lineage,
    stateTrace,
    gates: {
      ok: gates.ok,
      classification: gates.regulatory_layer?.classification_hint,
      c20: gates.regulatory_layer?.c20_confidence,
      diagnostic_non_contamination_boundary:
        gates.regulatory_layer?.diagnostic_non_contamination_boundary,
      EVE_pathology_inputs_to_confidence:
        gates.regulatory_layer?.EVE_pathology_inputs_to_confidence,
      critical_routes: gates.regulatory_layer?.critical_routes,
      sem: gates.regulatory_layer?.sem?.map((s) => ({
        gate: s.gate,
        outcome: s.outcome,
      })),
      pst: gates.regulatory_layer?.pst?.map((p) => ({
        gate: p.gate,
        outcome: p.outcome,
      })),
      timer_event_id: gates.process_state_timer_event_id,
    },
    readiness: readiness
      ? {
          readiness_state: readiness.readiness_state,
          terminal_state: readiness.terminal_state,
          classification_hint: readiness.classification_hint,
          writes_scene: readiness.writes_scene,
          writes_mba: readiness.writes_mba,
          parallel_production: readiness.parallel_production,
        }
      : null,
    readinessError,
    reconciliation: recon,
  };
}

async function main() {
  mkdirSync(MATERIALIZED, { recursive: true });
  const dbUrl = process.env.EVE_STAGING_SUPABASE_DB_URL;
  assertStagingUrl(dbUrl);

  const execDir = path.join(
    ROOT,
    "src/services/eve/runtime-40-20/execution-connected",
  );
  const pgAdapter = loadTsModule(
    path.join(execDir, "runtime-40-20-pg-persistence-adapter.ts"),
  );
  const governed = loadTsModule(
    path.join(execDir, "runtime-40-20-governed-execution-service.ts"),
  );
  const services = {
    advanceGovernedExecution: governed.advanceGovernedExecution,
    createRuntime4020PgPersistenceAdapter:
      pgAdapter.createRuntime4020PgPersistenceAdapter,
  };

  const pgClient = createPgClient(dbUrl);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const pre = await snapshotIsolation(pgClient, "044A6");

  const preflight = {
    instruction: "044-A.6",
    branch_expected: "release/eve-c312-production",
    staging_project_ref: STAGING_REF,
    full_catalog_version_id: FULL,
    full_status: pre.full_status,
    full_xlsx_sha: pre.full_xlsx_sha,
    expected_full_xlsx_sha:
      "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0",
    full_immutable:
      pre.full_xlsx_sha ===
      "5be7bd2ed510c5f54ab0490535d11685f0ae981505575fdec38de8e4cdd3b2e0",
    pre_snapshot: pre,
    stamp,
  };
  if (pre.full_status !== "active") {
    throw new Error("blocked_full_catalog_not_active");
  }
  if (!preflight.full_immutable) {
    throw new Error("blocked_full_catalog_hash_changed");
  }

  // RUN A — canonical complete with PST strong wait + business inconsistency preserved
  const runA = await runScenario(services, pgClient, {
    name: "A_canonical_complete",
    token: `A-${stamp}`,
    answer_overrides: {},
    process_state_wait: {
      strong_wait: true,
      awaited_event: "aprobacion_supervisor",
      release_condition: "aprobacion_recibida",
      timer_or_timeout_rule: "48h_escalation",
      timeout_state: "escalated_waiting",
      resolver_owner: "supervisor_area",
      exit_path: "reentry_B4_or_continue",
    },
    gates_b7_confidence_input: {
      business_structural_inconsistency_observed: true,
      business_structural_inconsistency_refs: ["PM_vs_PF_synthetic_044A6"],
    },
    gate_canonical_overrides: {
      "canonical:activity_name_user_confirmed":
        "Elaborar pedido de cliente sintético 044A6",
      "canonical:activity_end_result_hint":
        "Pedido listo para el siguiente equipo",
      "canonical:activity_start_condition_hint": "Cuando llega un pedido nuevo",
      "canonical:activity_summary_literal":
        "Elaborar pedido de cliente sintético 044A6",
    },
  });

  // RUN B — epistemic medium → C20
  const runB = await runScenario(services, pgClient, {
    name: "B_microconfirmation_C20",
    token: `B-${stamp}`,
    b7_confidence_input: {
      evidence_completeness_status: "complete",
      provenance_status: "closed",
      canonical_route_status: "closed",
      epistemic_ambiguity_status: "resolvable",
      microconfirmation_state: "pending",
    },
    c20_answers: {
      "7.1": "Confirmación de tipo de escena: transformación",
      "7.2": firstOption(
        CROSSWALK.relations.find(
          (r) => r.runtime_interaction_id === "C20" && r.source_code === "7.2",
        )?.options,
      ),
      "7.3": firstOption(
        CROSSWALK.relations.find(
          (r) => r.runtime_interaction_id === "C20" && r.source_code === "7.3",
        )?.options,
      ),
      "7.3a": "Aclaración interpersonal sintética",
      "7.4": "Microconfirmación resuelta 044A6",
    },
    // After C20 answered, gates re-evaluate with ambiguity resolved.
    gates_b7_confidence_input: {
      evidence_completeness_status: "complete",
      provenance_status: "closed",
      canonical_route_status: "closed",
      epistemic_ambiguity_status: "none",
      microconfirmation_state: "resolved",
    },
    gate_canonical_overrides: {
      "canonical:activity_name_user_confirmed":
        "Elaborar pedido de cliente sintético 044A6",
      "canonical:activity_end_result_hint":
        "Pedido listo para el siguiente equipo",
      "canonical:activity_start_condition_hint": "Cuando llega un pedido nuevo",
      "canonical:activity_summary_literal":
        "Elaborar pedido de cliente sintético 044A6",
    },
    process_state_wait: { strong_wait: false },
  });

  // RUN C — fail-closed missing critical route / incomplete base
  let runC;
  try {
    runC = await runScenario(services, pgClient, {
      name: "C_fail_closed",
      token: `C-${stamp}`,
      base_interactions: ["B0-Q01", "B0-Q02", "B0-Q03"],
      force_ready: true,
      process_state_wait: { strong_wait: false },
    });
  } catch (error) {
    runC = {
      scenario: "C_fail_closed",
      token: `C-${stamp}`,
      readinessError: error instanceof Error ? error.message : String(error),
      expected_fail_closed: true,
    };
  }

  const post = await snapshotIsolation(pgClient, "044A6");
  const isolation = {
    gaby_sessions_pre: pre.gaby_sessions,
    gaby_sessions_post: post.gaby_sessions,
    gaby_delta: Number(post.gaby_sessions) - Number(pre.gaby_sessions),
    scene_registry_pre: pre.scene_registry,
    scene_registry_post: post.scene_registry,
    scene_delta: Number(post.scene_registry) - Number(pre.scene_registry),
    mba_ledger_pre: pre.mba_ledger,
    mba_ledger_post: post.mba_ledger,
    mba_delta: Number(post.mba_ledger) - Number(pre.mba_ledger),
    parallel_runs_pre: pre.parallel_runs,
    parallel_runs_post: post.parallel_runs,
    parallel_delta: Number(post.parallel_runs) - Number(pre.parallel_runs),
    production_writes: 0,
    notes:
      "Isolation by synthetic case_id/token scope. Gaby delta must be 0; scene/mba/parallel remain untouched.",
  };

  const classificationCandidates = [];
  if (isolation.gaby_delta !== 0) classificationCandidates.push("blocked_isolation_proof");
  if (isolation.scene_delta !== 0 || isolation.mba_delta !== 0 || isolation.parallel_delta !== 0) {
    classificationCandidates.push("blocked_isolation_proof");
  }
  if (!runA?.readiness && !runA?.readinessError) {
    classificationCandidates.push("blocked_readiness_staging");
  }
  if (runA?.reconciliation?.budget_sums?.base_used > 40) {
    classificationCandidates.push("blocked_budget_staging");
  }
  if (runA?.reconciliation?.budget_sums?.causal_used > 20) {
    classificationCandidates.push("blocked_budget_staging");
  }

  const runAReady =
    runA?.readiness?.readiness_state === "ready" ||
    runA?.readiness?.readiness_state === "ready_with_flags";
  const runBOpenedC20 = (runB?.lineage || []).some((l) =>
    (l.branching_outcomes || []).some(
      (o) =>
        o.target_causal_interaction_id === "C20" && o.result === "opened",
    ),
  );
  const runBHasC20Answer = (runB?.lineage || []).some(
    (l) => l.runtime_interaction_id === "C20",
  );
  const crMaterial = (runA?.gates?.critical_routes || []).some(
    (r) => r.gate === "CR-B0" || r.gate === "CR-B7",
  );
  const crB3Separated = (runA?.gates?.critical_routes || []).some(
    (r) =>
      r.gate === "CR-B3" &&
      (r.evidence_basis?.satisfaction_separated === true ||
        r.evidence_basis?.b3?.receiver_satisfaction_separated === true),
  );

  if (!runAReady) classificationCandidates.push("blocked_readiness_staging");
  if (!runBOpenedC20 || !runBHasC20Answer) {
    classificationCandidates.push("blocked_branching_staging_path");
  }
  if (!crMaterial) classificationCandidates.push("blocked_critical_route_staging");
  if (!crB3Separated) classificationCandidates.push("blocked_critical_route_staging");

  const forceReadyBlocked =
    String(runC?.readinessError ?? "").includes("caller_forced_ready") ||
    (runC?.readiness && runC.readiness.readiness_state !== "ready");

  const passed =
    preflight.full_immutable &&
    runA?.lineage?.length >= 40 &&
    Number(runA?.reconciliation?.budget_sums?.base_used ?? 99) <= 40 &&
    Number(runA?.reconciliation?.budget_sums?.causal_used ?? 99) <= 20 &&
    runA?.gates?.c20?.producer === "connected" &&
    runA?.gates?.diagnostic_non_contamination_boundary === "enforced" &&
    Number(runA?.gates?.EVE_pathology_inputs_to_confidence ?? 1) === 0 &&
    runAReady &&
    runBOpenedC20 &&
    runBHasC20Answer &&
    crMaterial &&
    crB3Separated &&
    isolation.gaby_delta === 0 &&
    isolation.scene_delta === 0 &&
    isolation.mba_delta === 0 &&
    isolation.parallel_delta === 0 &&
    forceReadyBlocked &&
    classificationCandidates.length === 0;

  const summary = {
    instruction: "044-A.6",
    classification: passed
      ? "runtime_40_20_synthetic_E2E_staging_passed"
      : classificationCandidates[0] || "blocked_staging_reconciliation",
    preflight,
    isolation,
    runA_summary: {
      run_id: runA?.run_id,
      lineage_count: runA?.lineage?.length,
      base_used: runA?.reconciliation?.budget_sums?.base_used,
      causal_used: runA?.reconciliation?.budget_sums?.causal_used,
      readiness: runA?.readiness,
      classification: runA?.gates?.classification,
      c20: runA?.gates?.c20,
    },
    runB_summary: {
      run_id: runB?.run_id,
      c20_opened: (runB?.lineage || []).some((l) =>
        (l.branching_outcomes || []).some(
          (o) =>
            o.target_causal_interaction_id === "C20" && o.result === "opened",
        ),
      ),
      b7_levels: (runB?.lineage || [])
        .filter((l) => l.b7_confidence)
        .map((l) => l.b7_confidence),
      readiness: runB?.readiness,
    },
    runC_summary: {
      readinessError: runC?.readinessError,
      readiness: runC?.readiness,
      force_ready_rejected: forceReadyBlocked,
    },
    next: passed
      ? "Cerrar 044. Siguiente único paso: 045 (NO automático)."
      : "Resolver primer bloqueo factual antes de 045.",
  };

  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-synthetic-e2e-044A6.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-synthetic-e2e-044A6.md"),
    `# 044-A.6 Synthetic E2E Staging\n\nClassification: \`${summary.classification}\`\n\nFULL immutable: ${preflight.full_immutable}\nGaby delta: ${isolation.gaby_delta}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-synthetic-run-A-044A6.json"),
    `${JSON.stringify(runA, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-synthetic-run-B-044A6.json"),
    `${JSON.stringify(runB, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-synthetic-run-C-044A6.json"),
    `${JSON.stringify(runC, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-staging-reconciliation-044A6.json"),
    `${JSON.stringify({ runA: runA?.reconciliation, runB: runB?.reconciliation, runC: runC?.reconciliation }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-state-machine-044A6.json"),
    `${JSON.stringify({ A: runA?.stateTrace, B: runB?.stateTrace, C: runC?.stateTrace }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-budget-reconciliation-044A6.json"),
    `${JSON.stringify({
      A: runA?.reconciliation?.budget_sums,
      B: runB?.reconciliation?.budget_sums,
      caps: { base: 40, causal: 20 },
    }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-gate-reconciliation-044A6.json"),
    `${JSON.stringify({ A: runA?.gates, B: runB?.gates }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(MATERIALIZED, "runtime-40-20-isolation-proof-044A6.json"),
    `${JSON.stringify(isolation, null, 2)}\n`,
  );

  await pgClient.end();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      classification: "blocked_staging_reconciliation",
    }),
  );
  process.exit(1);
});
