import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  buildMbaComplianceReport,
  createMbaServiceRoleSupabaseClient,
  createMbaEventLedger,
  createMbaTimerLedger,
  evaluateTransition,
  observeCapa1Outputs,
  observeParallelProductionOutputs,
  persistMbaControlPlaneState,
} from "../src/services/mba/index.mjs";

const root = process.cwd();
const reportDir = path.join(root, "tests", "reports", "mba-control-plane");
const reportPath = path.join(reportDir, "increment-1-2-shadow-validation-report.json");
const sqlPath = path.join(root, "schemas", "mba-control-plane", "persistence-v01.sql");

const readEnv = () => {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
};

const createSupabaseClients = () => {
  const env = readEnv();
  const mergedEnv = { ...process.env, ...env };
  const anonClient =
    mergedEnv.NEXT_PUBLIC_SUPABASE_URL && mergedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? createClient(mergedEnv.NEXT_PUBLIC_SUPABASE_URL, mergedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      : null;
  const serviceRole = createMbaServiceRoleSupabaseClient(mergedEnv);

  return {
    anonClient,
    serviceClient: serviceRole.client,
    serviceRole,
  };
};

const requiredTables = [
  "mba_event_ledger",
  "mba_timer_ledger",
  "mba_object_state_snapshots",
  "mba_domain_state_observations",
  "mba_transition_findings",
  "mba_compliance_reports",
  "mba_legacy_mappings",
];

const requiredIndexNames = [
  "idx_mba_event_ledger_case_id",
  "idx_mba_event_ledger_session_id",
  "idx_mba_event_ledger_correlation_id",
  "idx_mba_event_ledger_event_type",
  "idx_mba_event_ledger_object_type",
  "idx_mba_event_ledger_created_at",
  "idx_mba_timer_ledger_case_id",
  "idx_mba_timer_ledger_session_id",
  "idx_mba_timer_ledger_object_type",
  "idx_mba_timer_ledger_created_at",
  "idx_mba_compliance_reports_case_id",
  "idx_mba_compliance_reports_session_id",
  "idx_mba_compliance_reports_created_at",
];

async function checkTables(supabase) {
  if (!supabase) {
    return requiredTables.map((table) => ({
      table,
      exists: false,
      error_code: "NO_SUPABASE_ENV",
      error_message: "Supabase environment is not configured.",
    }));
  }

  const checks = [];
  for (const table of requiredTables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    checks.push({
      table,
      exists: !error,
      error_code: error?.code ?? null,
      error_message: error?.message ?? null,
      sample_rows_visible: data?.length ?? 0,
    });
  }
  return checks;
}

function checkSqlReadiness() {
  const sql = fs.readFileSync(sqlPath, "utf8");
  return {
    sql_path: "schemas/mba-control-plane/persistence-v01.sql",
    create_table_if_not_exists_count: (sql.match(/create table if not exists/g) ?? []).length,
    alter_table_if_not_exists_count: (sql.match(/add column if not exists/g) ?? []).length,
    has_pgcrypto_extension: sql.includes("create extension if not exists pgcrypto"),
    has_primary_keys:
      sql.includes("event_id uuid primary key") &&
      sql.includes("report_id text primary key") &&
      sql.includes("primary key (object_type, object_id)"),
    required_indexes: requiredIndexNames.map((name) => ({
      index_name: name,
      declared: sql.includes(name),
    })),
    payload_minimization_comment: sql.includes("Payloads must keep references and summaries only"),
    idempotent:
      sql.includes("create table if not exists") &&
      sql.includes("create index if not exists") &&
      sql.includes("add column if not exists"),
  };
}

const canonicalScene = {
  id: "SCR_SHADOW_A",
  scene_id: "SCENE_SHADOW_A",
  evidence_answer_ids: ["ANS_A"],
  traceability: {
    evidenceAnswerIds: ["ANS_A"],
    derivationIds: ["DER_A"],
  },
  gaps: [],
  flags: [],
};

const evidenceBundle = {
  id: "EB_SHADOW_A",
  bundle_type: "evidence_bundle_for_transduction",
};

function scenarioA() {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  observeCapa1Outputs(
    {
      case_id: "MBA_SHADOW_CASE_A",
      session_id: "MBA_SHADOW_SESSION_A",
      scene_canonical_record: canonicalScene,
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );
  return buildMbaComplianceReport({
    case_id: "MBA_SHADOW_CASE_A",
    ledger,
    timerLedger,
  });
}

function scenarioB() {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  observeCapa1Outputs(
    {
      case_id: "MBA_SHADOW_CASE_B",
      session_id: "MBA_SHADOW_SESSION_B",
      scene_canonical_record: canonicalScene,
      evidence_bundle_for_transduction: evidenceBundle,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );
  const parallel = observeParallelProductionOutputs(
    {
      case_id: "MBA_SHADOW_CASE_B",
      session_id: "MBA_SHADOW_SESSION_B",
      architectureConsistencyAssessment: {
        assessment_id: "ACA_SHADOW_B",
        assessment_status: "WithFindings",
        findings: [{ finding_id: "QA_IR_B", affected_artifact_type: "mmabp_ir_package" }],
      },
      candidate_export_package: {
        candidate_export_package_id: "CAND_EXPORT_B",
      },
      syntax_validation_passed: false,
    },
    { ledger, timerLedger },
  );
  return buildMbaComplianceReport({
    case_id: "MBA_SHADOW_CASE_B",
    ledger,
    timerLedger,
    hard_gate_candidates: parallel.hard_gate_candidates,
    extra_findings: parallel.findings,
  });
}

function scenarioC() {
  const ledger = createMbaEventLedger();
  const timerLedger = createMbaTimerLedger();
  const observed = observeCapa1Outputs(
    {
      case_id: "MBA_SHADOW_CASE_C",
      session_id: "MBA_SHADOW_SESSION_C",
      scene_canonical_record: canonicalScene,
      session_ready_for_transduction: true,
    },
    { ledger, timerLedger },
  );
  return buildMbaComplianceReport({
    case_id: "MBA_SHADOW_CASE_C",
    ledger,
    timerLedger,
    extra_findings: observed.findings,
  });
}

function ncCoverage() {
  const cases = [
    ["NC-01", () => evaluateTransition({
      object_type: "DiagnosticoExpertoFinal",
      object_id: "DX_NC_01",
      previous_state: "ExpertReviewed",
      target_state: "Delivered",
      event_type: "DiagnosticoFinalDeliveredReceived",
      operation: "entregar",
      responsible_process: "P-SUP-05",
      emitted_by: "P-SUP-05",
    })],
    ["NC-02", () => evaluateTransition({
      object_type: "ExportCodePackage",
      object_id: "EXP_NC_02",
      previous_state: "SyntaxValidating",
      target_state: "Generated",
      event_type: "ExportCodePackageGenerated",
      operation: "empaquetar",
      responsible_process: "P-SUP-09",
      emitted_by: "P-SUP-09",
      payload: { syntax_validation_status: "passed" },
    })],
    ["NC-03", () => evaluateTransition({
      object_type: "ArchitectureConsistencyAssessment",
      object_id: "ACA_NC_03",
      previous_state: "CompositeEvaluating",
      target_state: "WithFindings",
      event_type: "GapInconsistenciaDetectada",
      operation: "clasificarFindings",
      responsible_process: "P-CORE-01",
      emitted_by: "P-SUP-07/08",
      received_by: "P-CORE-01",
      payload: { finding_scope: "parallel_production_design" },
    })],
    ["NC-04", () => evaluateTransition({
      object_type: "EvidenceBundle",
      object_id: "EB_NC_04",
      previous_state: "ReadinessAssessmentPending",
      target_state: "session_ready_for_transduction",
      event_type: "EvidenceBundleReadyReceived",
      operation: "marcarReady",
      responsible_process: "P-SUP-02",
      emitted_by: "Capa 1.0",
    })],
    ["NC-05", () => evaluateTransition({
      object_type: "EvidenceBundle",
      object_id: "EB_NC_05",
      previous_state: "ReadinessAssessmentPending",
      target_state: "ReadyForTransduction",
      event_type: "EvidenceBundleReadyReceived",
      operation: "marcarReady",
      responsible_process: "P-SUP-02",
      emitted_by: "Capa 1.0",
      payload: { process_state: "UnexpectedStateWithoutTimer" },
    })],
    ["NC-06", () => evaluateTransition({
      object_type: "EvidenceBundle",
      object_id: "EB_NC_06",
      previous_state: "ReadinessAssessmentPending",
      target_state: "TechnicalReadyState",
      event_type: "EvidenceBundleReadyReceived",
      operation: "marcarReady",
      responsible_process: "P-SUP-02",
      emitted_by: "Capa 1.0",
    })],
    ["NC-07", () => evaluateTransition({
      object_type: "ExportCodePackage",
      object_id: "MOC_NC_07",
      previous_state: "SyntaxValidating",
      target_state: "Blocked",
      event_type: "SyntaxValidationFailed",
      operation: "bloquear",
      responsible_process: "P-SUP-09",
      emitted_by: "P-SUP-09",
      payload: { technical_moc_classes: [{ name: "ReactComponent", conceptual_function: false }] },
    })],
    ["NC-08", () => evaluateTransition({
      object_type: "SceneCanonicalRecord",
      object_id: "SCR_NC_08",
      previous_state: "ConformanceChecked",
      target_state: "Consolidated",
      event_type: "SceneCanonicalRecordConsolidatedReceived",
      operation: "consolidar",
      responsible_process: "P-SUP-01",
      emitted_by: "Capa 1.0",
      payload: { fused_objects: ["EscenaOperativaRegulada", "EscenaEvidencial"] },
    })],
    ["NC-09", () => evaluateTransition({
      object_type: "EvidenceBundle",
      object_id: "EB_NC_09",
      previous_state: "ReadinessAssessmentPending",
      target_state: "ReadyForTransduction",
      event_type: "EvidenceBundleReadyReceived",
      operation: "marcarReady",
      responsible_process: "P-SUP-02",
      emitted_by: "Capa 1.0",
      payload: { fused_objects: ["EvidenceBundle", "mmabp_design_source_bundle"] },
    })],
    ["NC-10", () => evaluateTransition({
      object_type: "SceneCanonicalRecord",
      object_id: "SCR_NC_10",
      previous_state: "ConformanceChecked",
      target_state: "Consolidated",
      event_type: "SceneCanonicalRecordConsolidatedReceived",
      operation: "consolidar",
      responsible_process: "P-SUP-01",
      emitted_by: "Capa 1.0",
      payload: {
        node_eve: "N04",
        root_cause: "forbidden",
        monetization: {},
        causal_movie: {},
        final_diagnostic: {},
      },
    })],
  ];

  return cases.map(([ruleId, run]) => {
    const result = run();
    return {
      rule_id: ruleId,
      detected: result.nonconformance.some((finding) => finding.rule_id === ruleId),
      validation_status: result.status,
    };
  });
}

async function sampleRealData(supabase) {
  if (!supabase) return { available: false };
  const [sessions, canonical, intermediate] = await Promise.all([
    supabase.from("sesiones_llenado").select("id,estado_actual").limit(3),
    supabase
      .from("scene_canonical_records")
      .select("id,sesion_id,scene_id,readiness_for_transduction")
      .limit(3),
    supabase
      .from("session_intermediate_output")
      .select("id,sesion_id,readiness_for_transduction")
      .limit(3),
  ]);
  return {
    available: true,
    sessions: {
      ok: !sessions.error,
      count: sessions.data?.length ?? 0,
      sample: sessions.data ?? [],
    },
    scene_canonical_records: {
      ok: !canonical.error,
      count: canonical.data?.length ?? 0,
      sample: canonical.data ?? [],
    },
    session_intermediate_output: {
      ok: !intermediate.error,
      count: intermediate.data?.length ?? 0,
      sample: intermediate.data ?? [],
    },
  };
}

async function countMbaRows(supabase) {
  if (!supabase) return [];
  const rows = [];
  for (const table of requiredTables) {
    const { error, count } = await supabase.from(table).select("*", { count: "exact", head: true });
    rows.push({
      table,
      ok: !error,
      error_code: error?.code ?? null,
      error_message: error?.message ?? null,
      count: count ?? 0,
    });
  }
  return rows;
}

async function verifyAnonWriteBlocked(supabase) {
  if (!supabase) {
    return {
      checked: false,
      blocked: null,
      error_code: "NO_ANON_CLIENT",
      error_message: "Anon client is not configured for this validation run.",
    };
  }
  const attempt = await supabase.from("mba_legacy_mappings").insert({
    mapping_type: "event",
    object_type: null,
    legacy_name: `ANON_PROBE_${Date.now()}`,
    mba_canonical_name: "EvidenceBundleReadyReceived",
    source_adapter: "anon_probe",
    active: true,
  });
  return {
    checked: true,
    blocked: Boolean(attempt.error),
    error_code: attempt.error?.code ?? null,
    error_message: attempt.error?.message ?? null,
  };
}

async function main() {
  const clients = createSupabaseClients();
  const tableCheckClient = clients.anonClient ?? clients.serviceClient;
  const tableChecks = await checkTables(tableCheckClient);
  const allTablesExist = tableChecks.every((item) => item.exists);
  const reports = {
    A_clean_flow: scenarioA(),
    B_parallel_with_findings: scenarioB(),
    C_session_ready_boundary: scenarioC(),
  };
  let persistenceAttempt = {
    attempted: false,
    ok: false,
    reason: "MBA tables are not present.",
  };

  if (allTablesExist && clients.serviceClient) {
    try {
      const ledger = createMbaEventLedger();
      const timerLedger = createMbaTimerLedger();
      observeCapa1Outputs(
        {
          case_id: "MBA_SHADOW_PERSISTENCE_SMOKE",
          session_id: "MBA_SHADOW_PERSISTENCE_SMOKE",
          scene_canonical_record: canonicalScene,
          evidence_bundle_for_transduction: evidenceBundle,
          session_ready_for_transduction: true,
        },
        { ledger, timerLedger },
      );
      const report = buildMbaComplianceReport({
        case_id: "MBA_SHADOW_PERSISTENCE_SMOKE",
        ledger,
        timerLedger,
      });
      persistenceAttempt = {
        attempted: true,
        ok: false,
        result: await persistMbaControlPlaneState({
          supabase: clients.serviceClient,
          ledger,
          timerLedger,
          report,
          missingClientContext: clients.serviceClient
            ? null
            : {
                error_code: clients.serviceRole.error_code,
                error_message: clients.serviceRole.error_message,
                table_name: null,
              },
        }),
      };
      persistenceAttempt.ok = Boolean(persistenceAttempt.result?.persisted);
    } catch (error) {
      persistenceAttempt = {
        attempted: true,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } else if (allTablesExist) {
    persistenceAttempt = {
      attempted: false,
      ok: false,
      reason:
        clients.serviceRole.error_message ??
        "Service role client is unavailable for server-side MBA persistence.",
      error_code: clients.serviceRole.error_code ?? "MBA_SERVICE_ROLE_CLIENT_UNAVAILABLE",
    };
  }

  const tableCounts = await countMbaRows(clients.serviceClient ?? tableCheckClient);
  const latestEventResult = clients.serviceClient
    ? await clients.serviceClient
        .from("mba_event_ledger")
        .select(
          "event_id,event_type,object_type,object_id,previous_state,target_state,case_id,session_id,governance_mode,source_adapter,timestamp,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: { code: "NO_SERVICE_CLIENT", message: "Service client unavailable." } };
  const latestReportResult = clients.serviceClient
    ? await clients.serviceClient
        .from("mba_compliance_reports")
        .select("report_id,case_id,session_id,operation_mode,generated_at,report_json,created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: { code: "NO_SERVICE_CLIENT", message: "Service client unavailable." } };
  const anonWriteProbe = await verifyAnonWriteBlocked(clients.anonClient);

  const validation = {
    generated_at: new Date().toISOString(),
    mode_requirement: "shadow_mode only; soft_governance_mode and enforcement_mode not activated",
    persistence_client: {
      auth_mode: clients.serviceRole.auth_mode,
      key_name: clients.serviceRole.key_name,
      available: Boolean(clients.serviceClient),
      error_code: clients.serviceRole.error_code,
      error_message: clients.serviceRole.error_message,
    },
    supabase_tables: tableChecks,
    table_row_counts: tableCounts,
    sql_readiness: checkSqlReadiness(),
    real_data_sample: await sampleRealData(clients.anonClient ?? clients.serviceClient),
    anon_write_probe: anonWriteProbe,
    smoke_routes_observed_manually: [
      {
        route: "POST /api/scenes/canonicalize",
        functional_response_unchanged: true,
        note: "Returned canonicalRecordId, readinessForTransduction, evidenceAnswerIds, consistencyFlagIds, next.",
      },
      {
        route: "POST /api/session/intermediate-output",
        functional_response_unchanged: true,
        note: "Returned outputId, readinessForTransduction, sessionReadyForTransduction, generatedFromSceneIds, sceneCount, next.",
      },
      {
        route: "POST /api/parallel-production/design-source-bundle",
        functional_response_unchanged: true,
        note: "Returned bundle, generatedFromSceneIds, candidateCount, evidenceCount, readiness, next.",
      },
    ],
    scenarios: Object.fromEntries(
      Object.entries(reports).map(([name, report]) => [
        name,
        {
          event_count: report.summary.event_count,
          timer_count: report.summary.timer_count,
          finding_count: report.summary.finding_count,
          hard_gate_candidate_count: report.summary.hard_gate_candidate_count,
          non_conformant_transition_count: report.summary.non_conformant_transition_count,
          object_states_reached: report.object_states_reached.map(
            (item) => `${item.object_type} [${item.current_state}]`,
          ),
          findings_should_return_to_p_sup_06: report.findings_should_return_to_p_sup_06.map(
            (item) => item.rule_id,
          ),
          findings_affecting_capa1_or_capa2_readiness:
            report.findings_affecting_capa1_or_capa2_readiness.map((item) => item.rule_id),
          shadow_mode_next_action: report.shadow_mode_next_action,
        },
      ]),
    ),
    nc_coverage: ncCoverage(),
    persistence_attempt: persistenceAttempt,
    latest_persisted_event: latestEventResult.data ?? null,
    latest_persisted_event_error: latestEventResult.error ?? null,
    latest_compliance_report: latestReportResult.data ?? null,
    latest_compliance_report_error: latestReportResult.error ?? null,
    recommendation:
      allTablesExist && persistenceAttempt.ok
        ? "Stay in shadow_mode and observe more real cases before considering soft_governance_mode."
        : "Stay in shadow_mode. Configure server-side service role persistence and rerun validation before considering soft_governance_mode.",
  };

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(validation, null, 2)}\n`);
  console.log(JSON.stringify(validation, null, 2));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
