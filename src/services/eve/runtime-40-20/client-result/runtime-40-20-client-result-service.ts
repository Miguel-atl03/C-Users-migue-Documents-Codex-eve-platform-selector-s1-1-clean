import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EVEProductionReadinessState } from "../gates-readiness/runtime-40-20-gates-readiness-types";
import type {
  EVEClientSafeCorrectionReentryDTO,
  EVEClientSafeNextAction,
  EVEClientSafeNextActionKind,
  EVEClientSafeResultDTO,
  EVEClientSafeResultLocalAdapterStatus,
  EVEClientSafeResultRequest,
  EVEClientSafeResultScope,
  EVEClientSafeVisibleState,
} from "./runtime-40-20-client-result-types";
import { EVE_CLIENT_SAFE_RESULT_FORBIDDEN_EXPOSURE_TERMS } from "./runtime-40-20-client-result-types";

const RUNTIME_LOCAL_FLAG = "EVE_RUNTIME_40_20_LOCAL_ENABLED";
const GATES_LOCAL_FLAG = "EVE_GATES_READINESS_LOCAL_ENABLED";
const CLIENT_SAFE_RESULT_FLAG = "EVE_CLIENT_SAFE_RESULT_LOCAL_ENABLED";
const SERVICE_ROLE_KEYS = [
  "EVE_SUPABASE_LOCAL_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isLocalSupabaseUrl(url: string): boolean {
  return /127\.0\.0\.1|localhost/i.test(url);
}

function resolveServiceRole(env: NodeJS.ProcessEnv, _supabaseUrl = "") {
  for (const keyName of SERVICE_ROLE_KEYS) {
    if (env[keyName]) return { keyName, key: env[keyName] as string, local_fallback: false };
  }
  // Never embed service-role material in source. Local scripts must supply env.
  return { keyName: null, key: null, local_fallback: false };
}

export function normalizeClientSafeResultScope(
  raw: Partial<EVEClientSafeResultScope> | undefined,
): EVEClientSafeResultScope {
  return {
    tenant_id: raw?.tenant_id?.trim() ?? "",
    case_id: raw?.case_id?.trim() ?? "",
    role_id: raw?.role_id?.trim() || undefined,
    activity_id: raw?.activity_id?.trim() || undefined,
    run_id: raw?.run_id?.trim() ?? "",
    correlation_id: raw?.correlation_id?.trim() ?? "",
  };
}

export function validateClientSafeResultScope(
  raw: Partial<EVEClientSafeResultScope> | undefined,
): { valid: boolean; scope: EVEClientSafeResultScope; blocking_reasons: string[] } {
  const scope = normalizeClientSafeResultScope(raw);
  const blocking_reasons: string[] = [];
  if (!isNonEmptyString(scope.tenant_id)) blocking_reasons.push("missing_tenant_id");
  if (!isNonEmptyString(scope.case_id)) blocking_reasons.push("missing_case_id");
  if (!isNonEmptyString(scope.run_id)) blocking_reasons.push("missing_run_id");
  if (!isNonEmptyString(scope.correlation_id)) blocking_reasons.push("missing_correlation_id");
  return { valid: blocking_reasons.length === 0, scope, blocking_reasons };
}

export function mapReadinessStateToClientVisibleState(
  readinessState: EVEProductionReadinessState,
): EVEClientSafeVisibleState {
  switch (readinessState) {
    case "ready":
      return "informacion_en_revision";
    case "ready_with_flags":
      return "resultado_en_revision";
    case "blocked":
      return "bloqueado_seguro";
    case "reentry_required":
      return "necesitamos_aclarar_algo";
    case "manual_review_required":
      return "informacion_en_revision";
    default:
      return "informacion_en_revision";
  }
}

const VISIBLE_STATE_COPY: Record<
  EVEClientSafeVisibleState,
  { title: string; message: string; nextAction: EVEClientSafeNextActionKind }
> = {
  sesion_lista: {
    title: "Sesi?n lista",
    message: "Tu sesi?n está lista para continuar.",
    nextAction: "continuar_interaccion",
  },
  mapa_de_trabajo_listo: {
    title: "Mapa de trabajo listo",
    message: "El mapa de trabajo está listo para revisar.",
    nextAction: "continuar_interaccion",
  },
  actividad_seleccionada: {
    title: "Actividad seleccionada",
    message: "Puedes continuar con la actividad seleccionada.",
    nextAction: "continuar_interaccion",
  },
  pregunta: {
    title: "Siguiente pregunta",
    message: "Aqu? tienes la siguiente pregunta de la actividad.",
    nextAction: "continuar_interaccion",
  },
  respuesta_registrada: {
    title: "Respuesta registrada",
    message: "Tu respuesta quedó registrada.",
    nextAction: "continuar_interaccion",
  },
  informacion_en_revision: {
    title: "Informaci?n en revisión",
    message: "Tu información está en revisión. Te avisaremos cuando haya novedades.",
    nextAction: "esperar_revision",
  },
  necesitamos_aclarar_algo: {
    title: "Necesitamos aclarar algo",
    message:
      "Para completar correctamente la recopilaci?n, necesitamos una aclaraci?n breve sobre una de tus respuestas.",
    nextAction: "aclarar_informacion",
  },
  puedes_corregir: {
    title: "Puedes corregir",
    message: "Si algo no quedó como esperabas, puedes corregir tu respuesta.",
    nextAction: "corregir_respuesta",
  },
  resultado_en_revision: {
    title: "Resultado en revisión",
    message:
      "Tu información quedó registrada y está en revisión. Aún no hay un resultado final disponible.",
    nextAction: "esperar_revision",
  },
  bloqueado_seguro: {
    title: "No podemos continuar por ahora",
    message:
      "Por ahora no podemos continuar con este paso. Si necesitas ayuda, contacta a quien te invit? a responder.",
    nextAction: "contactar_revision",
  },
};

const NEXT_ACTION_LABELS: Record<EVEClientSafeNextActionKind, string> = {
  esperar_revision: "Esperar revisión",
  corregir_respuesta: "Corregir respuesta",
  aclarar_informacion: "Aclarar información",
  continuar_interaccion: "Continuar",
  contactar_revision: "Contactar para revisión",
  sin_accion_segura: "Sin acci?n disponible",
};

function buildNextAction(
  kind: EVEClientSafeNextActionKind,
  enabled = true,
): EVEClientSafeNextAction {
  return {
    kind,
    label: NEXT_ACTION_LABELS[kind],
    enabled,
  };
}

export function buildClientSafeResultDTO(
  request: EVEClientSafeResultRequest,
): EVEClientSafeResultDTO {
  const readinessState = request.readiness_state ?? "ready_with_flags";
  const visible_state = mapReadinessStateToClientVisibleState(readinessState);
  const copy = VISIBLE_STATE_COPY[visible_state];

  const review_pending =
    visible_state === "informacion_en_revision" ||
    visible_state === "resultado_en_revision";

  const can_reenter =
    readinessState === "reentry_required" ||
    visible_state === "necesitamos_aclarar_algo";

  const can_correct =
    readinessState === "reentry_required" ||
    readinessState === "ready_with_flags" ||
    visible_state === "puedes_corregir";

  let nextActionKind = copy.nextAction;
  if (can_reenter && visible_state !== "bloqueado_seguro") {
    nextActionKind = "aclarar_informacion";
  } else if (can_correct && visible_state === "resultado_en_revision") {
    nextActionKind = "corregir_respuesta";
  }

  const nextEnabled =
    visible_state !== "bloqueado_seguro" &&
    nextActionKind !== "sin_accion_segura";

  return {
    visible_state,
    visible_title: copy.title,
    visible_message: copy.message,
    visible_next_action: buildNextAction(nextActionKind, nextEnabled),
    review_pending,
    can_correct,
    can_reenter,
    client_safe: true,
  };
}

export function buildClientSafeCorrectionReentryDTO(
  mode: "correction" | "reentry",
): EVEClientSafeCorrectionReentryDTO {
  if (mode === "reentry") {
    const copy = VISIBLE_STATE_COPY.necesitamos_aclarar_algo;
    return {
      visible_state: "necesitamos_aclarar_algo",
      visible_title: copy.title,
      visible_message: copy.message,
      visible_next_action: buildNextAction("aclarar_informacion", true),
      can_correct: false,
      can_reenter: true,
      client_safe: true,
    };
  }
  const copy = VISIBLE_STATE_COPY.puedes_corregir;
  return {
    visible_state: "puedes_corregir",
    visible_title: copy.title,
    visible_message: copy.message,
    visible_next_action: buildNextAction("corregir_respuesta", true),
    can_correct: true,
    can_reenter: false,
    client_safe: true,
  };
}

export function validateClientSafeResultNoInternalLeakage(payload: unknown): boolean {
  const serialized = JSON.stringify(payload);
  for (const term of EVE_CLIENT_SAFE_RESULT_FORBIDDEN_EXPOSURE_TERMS) {
    if (serialized.toLowerCase().includes(term.toLowerCase())) {
      return false;
    }
  }
  if (/\bIR\b/.test(serialized)) return false;
  return true;
}

export function getClientSafeResultLocalAdapterStatus(
  env: NodeJS.ProcessEnv = process.env,
): EVEClientSafeResultLocalAdapterStatus {
  const runtimeEnabled = env[RUNTIME_LOCAL_FLAG] === "true";
  const gatesEnabled = env[GATES_LOCAL_FLAG] === "true";
  const clientSafeEnabled = env[CLIENT_SAFE_RESULT_FLAG] === "true";
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const localTargetAvailable =
    runtimeEnabled &&
    gatesEnabled &&
    clientSafeEnabled &&
    isLocalSupabaseUrl(supabaseUrl);

  let blocked_reason: string | null = null;
  if (!runtimeEnabled) blocked_reason = "runtime_local_flag_disabled";
  else if (!gatesEnabled) blocked_reason = "gates_readiness_local_flag_disabled";
  else if (!clientSafeEnabled) blocked_reason = "client_safe_result_local_flag_disabled";
  else if (!isLocalSupabaseUrl(supabaseUrl)) blocked_reason = "supabase_url_not_local";

  return {
    enabled: runtimeEnabled && gatesEnabled && clientSafeEnabled,
    dependency_blocked: !localTargetAvailable,
    local_runtime_flag_required: true,
    local_gates_readiness_flag_required: true,
    local_client_safe_result_flag_required: true,
    local_target_available: localTargetAvailable,
    blocked_reason: localTargetAvailable ? null : blocked_reason,
  };
}

export function isClientSafeResultDependencyBlocked(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getClientSafeResultLocalAdapterStatus(env).dependency_blocked;
}

function createLocalSupabaseClient(env: NodeJS.ProcessEnv): SupabaseClient | null {
  const status = getClientSafeResultLocalAdapterStatus(env);
  if (status.dependency_blocked) return null;
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRole = resolveServiceRole(env, url);
  if (!serviceRole.key) return null;
  return createClient(url, serviceRole.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface EVEActivationChainContextRef {
  tenant_id: string;
  case_id: string;
  role_id?: string;
  activity_id?: string;
  run_id: string;
  readiness_decision_record_id: string;
  readiness_state?: EVEProductionReadinessState;
  role_runtime_session_id?: string;
  runtime_audit_trail_ids?: string[];
  readiness_gap_record_ids?: string[];
}

export type EVEClientSafeResultChainReadFailure =
  | "missing_context"
  | "missing_readiness_decision_record"
  | "scope_mismatch"
  | "rls_blocked"
  | "dto_invalid";

export interface EVEClientSafeResultChainReadResult {
  dto: EVEClientSafeResultDTO | null;
  failure: EVEClientSafeResultChainReadFailure | null;
  local_server_side_service_access_used: boolean;
  readiness_state: EVEProductionReadinessState | null;
}

export function isLocalServerSideServiceAccessUsed(env: NodeJS.ProcessEnv = process.env): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return resolveServiceRole(env, url).local_fallback;
}

export async function readLocalReadinessByDecisionId(
  chainContext: EVEActivationChainContextRef,
  scope: EVEClientSafeResultScope,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EVEClientSafeResultChainReadResult> {
  const local_server_side_service_access_used = isLocalServerSideServiceAccessUsed(env);

  if (!chainContext?.readiness_decision_record_id) {
    return {
      dto: null,
      failure: "missing_context",
      local_server_side_service_access_used,
      readiness_state: null,
    };
  }

  if (
    chainContext.tenant_id !== scope.tenant_id ||
    chainContext.case_id !== scope.case_id ||
    chainContext.run_id !== scope.run_id
  ) {
    return {
      dto: null,
      failure: "scope_mismatch",
      local_server_side_service_access_used,
      readiness_state: null,
    };
  }

  const supabase = createLocalSupabaseClient(env);
  if (!supabase) {
    return {
      dto: null,
      failure: "rls_blocked",
      local_server_side_service_access_used,
      readiness_state: null,
    };
  }

  const decisionResult = await supabase
    .from("readiness_decision_record")
    .select("id, tenant_id, case_id, run_id, readiness_state, manual_review_required, reentry_target")
    .eq("id", chainContext.readiness_decision_record_id)
    .maybeSingle();

  if (decisionResult.error || !decisionResult.data) {
    return {
      dto: null,
      failure: decisionResult.error ? "rls_blocked" : "missing_readiness_decision_record",
      local_server_side_service_access_used,
      readiness_state: null,
    };
  }

  const record = decisionResult.data;
  if (
    record.tenant_id !== scope.tenant_id ||
    record.case_id !== scope.case_id ||
    record.run_id !== scope.run_id
  ) {
    return {
      dto: null,
      failure: "scope_mismatch",
      local_server_side_service_access_used,
      readiness_state: null,
    };
  }

  const readiness_state = record.readiness_state as EVEProductionReadinessState;
  const gapResult = await supabase
    .from("readiness_gap_record")
    .select("id")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id)
    .eq("status", "open")
    .limit(1);

  const dto = buildClientSafeResultDTO({
    scope,
    readiness_state,
    has_open_gaps: !gapResult.error && (gapResult.data?.length ?? 0) > 0,
    manual_review_required: Boolean(record.manual_review_required),
    reentry_required:
      readiness_state === "reentry_required" || Boolean(record.reentry_target),
  });

  if (!validateClientSafeResultNoInternalLeakage(dto)) {
    return {
      dto: null,
      failure: "dto_invalid",
      local_server_side_service_access_used,
      readiness_state,
    };
  }

  return {
    dto,
    failure: null,
    local_server_side_service_access_used,
    readiness_state,
  };
}

export interface EVEClientSafeReadinessSnapshot {
  readiness_state: EVEProductionReadinessState;
  manual_review_required: boolean;
  reentry_required: boolean;
  has_open_gaps: boolean;
}

export async function readLocalReadinessSnapshotForScope(
  scope: EVEClientSafeResultScope,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EVEClientSafeReadinessSnapshot | null> {
  const supabase = createLocalSupabaseClient(env);
  if (!supabase) return null;

  const decisionQuery = supabase
    .from("readiness_decision_record")
    .select("readiness_state, manual_review_required, reentry_target")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const gapQuery = supabase
    .from("readiness_gap_record")
    .select("id, status")
    .eq("tenant_id", scope.tenant_id)
    .eq("case_id", scope.case_id)
    .eq("run_id", scope.run_id)
    .eq("status", "open")
    .limit(1);

  const [decisionResult, gapResult] = await Promise.all([decisionQuery, gapQuery]);

  if (decisionResult.error || !decisionResult.data) {
    return null;
  }

  const readiness_state = decisionResult.data.readiness_state as EVEProductionReadinessState;
  const manual_review_required = Boolean(decisionResult.data.manual_review_required);
  const reentry_required =
    readiness_state === "reentry_required" ||
    Boolean(decisionResult.data.reentry_target);
  const has_open_gaps = !gapResult.error && (gapResult.data?.length ?? 0) > 0;

  return {
    readiness_state,
    manual_review_required,
    reentry_required,
    has_open_gaps,
  };
}

export async function buildClientSafeResultFromLocalReadiness(
  scope: EVEClientSafeResultScope,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EVEClientSafeResultDTO | null> {
  const snapshot = await readLocalReadinessSnapshotForScope(scope, env);
  if (!snapshot) return null;
  return buildClientSafeResultDTO({
    scope,
    readiness_state: snapshot.readiness_state,
    has_open_gaps: snapshot.has_open_gaps,
    manual_review_required: snapshot.manual_review_required,
    reentry_required: snapshot.reentry_required,
  });
}

export function buildP6ClientSafeResultBoundaryFlags() {
  return {
    diagnosis_created: false as const,
    export_real_created: false as const,
    produccion_paralela_started: false as const,
    qa_green_real_created: false as const,
    activation_allowed: false as const,
    production_supabase_touched: false as const,
    client_final_diagnosis_visible: false as const,
  };
}

export const Runtime40_20ClientResultService = {
  normalizeClientSafeResultScope,
  validateClientSafeResultScope,
  mapReadinessStateToClientVisibleState,
  buildClientSafeResultDTO,
  buildClientSafeCorrectionReentryDTO,
  validateClientSafeResultNoInternalLeakage,
  getClientSafeResultLocalAdapterStatus,
  isClientSafeResultDependencyBlocked,
  isLocalServerSideServiceAccessUsed,
  readLocalReadinessSnapshotForScope,
  readLocalReadinessByDecisionId,
  buildClientSafeResultFromLocalReadiness,
  buildP6ClientSafeResultBoundaryFlags,
};
