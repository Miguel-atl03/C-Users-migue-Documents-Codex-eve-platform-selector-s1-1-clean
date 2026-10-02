import { assertRegistryRealMinimalBoundary } from "./registry-real-minimal-boundary";
import type {
  RegistryFamily,
  RegistryRealMinimalAuditLog,
  RegistryRealMinimalAuthorizationLog,
  RegistryRealMinimalInput,
  RegistryRealMinimalRecord,
  RegistryRealMinimalResult,
} from "./registry-real-minimal-types";

const REQUIRED_FAMILIES: RegistryFamily[] = ["PM", "PF", "MoC", "OLC"];

const NO_GO: RegistryRealMinimalResult["no_go"] = {
  runtime_40_20_started: false,
  ir_real_created: false,
  object_inventory_real_opened: false,
  f5c_real_opened: false,
  production_parallel_real_opened: false,
  export_created: false,
  diagnosis_created: false,
  delivered_created: false,
  conformance_claimed: false,
  consistency_claimed: false,
};

export async function runRegistryRealMinimalControlledPromotion(
  input: RegistryRealMinimalInput,
): Promise<RegistryRealMinimalResult> {
  const createdByValidation = validateCreatedBy(input.created_by);
  if (!createdByValidation.ok) {
    return blocked(input, createdByValidation.reason);
  }

  const boundary = assertRegistryRealMinimalBoundary(input.boundary ?? {});
  if (!boundary.ok) {
    await input.adapter.insertAuditLog(
      buildAuditLog(input, "registry_real_minimal_blocked", true, {
        blockers: boundary.blockers,
      }),
    );
    return blocked(input, boundary.blockers.join(";"));
  }

  const familyValidation = validateFamilies(input);
  if (!familyValidation.ok) {
    await input.adapter.insertAuditLog(
      buildAuditLog(input, "registry_real_minimal_blocked", true, {
        blockers: familyValidation.blockers,
      }),
    );
    return blocked(input, familyValidation.blockers.join(";"));
  }

  const records = buildRecords(input);
  await input.adapter.insertAuditLog(
    buildAuditLog(input, "registry_real_minimal_persist_attempted", false, {
      record_count: records.length,
    }),
  );

  const insertResult = await input.adapter.insertRegistryRecords(records);
  if (!insertResult.ok || insertResult.inserted_count !== records.length) {
    await input.adapter.insertAuditLog(
      buildAuditLog(input, "registry_real_minimal_blocked", true, {
        error: insertResult.error ?? "insert_count_mismatch",
        inserted_count: insertResult.inserted_count,
        expected_count: records.length,
      }),
    );
    return blocked(input, insertResult.error ?? "registry_insert_failed");
  }

  const authorizationLogResult = await input.adapter.insertAuthorizationLog(
    buildAuthorizationLog(input),
  );
  if (!authorizationLogResult.ok) {
    await input.adapter.insertAuditLog(
      buildAuditLog(input, "registry_real_minimal_blocked", true, {
        error: authorizationLogResult.error ?? "authorization_log_failed",
      }),
    );
    return blocked(input, authorizationLogResult.error ?? "authorization_log_failed");
  }

  const auditResult = await input.adapter.insertAuditLog(
    buildAuditLog(input, "registry_real_minimal_persisted", false, {
      inserted_count: insertResult.inserted_count,
    }),
  );
  if (!auditResult.ok) {
    return blocked(input, auditResult.error ?? "audit_log_failed");
  }

  return {
    ok: true,
    case_id: input.case_id,
    records,
    persisted_count: insertResult.inserted_count,
    no_go: NO_GO,
    materiality: {
      level: "registry_real_minimal_controlled_promotion",
      registry_real_minimal_created: true,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}

function validateFamilies(input: RegistryRealMinimalInput):
  | { ok: true }
  | { ok: false; blockers: string[] } {
  const families = input.source_candidates.map((candidate) => candidate.family);
  const blockers: string[] = [];

  for (const family of REQUIRED_FAMILIES) {
    if (!families.includes(family)) {
      blockers.push(`missing_family:${family}`);
    }
  }

  for (const family of REQUIRED_FAMILIES) {
    if (families.filter((candidateFamily) => candidateFamily === family).length > 1) {
      blockers.push(`duplicated_family:${family}`);
    }
  }

  if (families.length !== REQUIRED_FAMILIES.length) {
    blockers.push("source_candidates_must_contain_exactly_pm_pf_moc_olc");
  }

  return blockers.length === 0 ? { ok: true } : { ok: false, blockers };
}

function buildRecords(
  input: RegistryRealMinimalInput,
): RegistryRealMinimalRecord[] {
  return REQUIRED_FAMILIES.map((family) => {
    const candidate = input.source_candidates.find(
      (sourceCandidate) => sourceCandidate.family === family,
    );
    if (!candidate) {
      throw new Error(`Missing family after validation: ${family}`);
    }

    return {
      registry_id: createUuid(),
      case_id: input.case_id,
      family,
      registry_state: "persisted_minimal",
      source_candidate_ref: candidate.source_candidate_ref,
      authorization_ref: input.authorization_ref,
      local_candidate_trace_ref: candidate.local_candidate_trace_ref,
      created_by: input.created_by,
      conformance_claimed: false,
      consistency_claimed: false,
      active: true,
      metadata: candidate.metadata ?? {},
    };
  });
}

function buildAuditLog(
  input: RegistryRealMinimalInput,
  action: RegistryRealMinimalAuditLog["action"],
  noGoTriggered: boolean,
  metadata: Record<string, unknown>,
): RegistryRealMinimalAuditLog {
  return {
    audit_id: createUuid(),
    case_id: input.case_id,
    created_by: input.created_by,
    action,
    no_go_triggered: noGoTriggered,
    metadata,
  };
}

function buildAuthorizationLog(
  input: RegistryRealMinimalInput,
): RegistryRealMinimalAuthorizationLog {
  return {
    authorization_log_id: createUuid(),
    case_id: input.case_id,
    authorization_ref: input.authorization_ref,
    created_by: input.created_by,
    capability: "registry_real_minimal",
    authorization_executed: true,
    scope: REQUIRED_FAMILIES,
    metadata: {
      registry_real_minimal_created_in_code: true,
      registry_real_minimal_applied_to_live_db: false,
    },
  };
}

function validateCreatedBy(
  createdBy: string,
): { ok: true } | { ok: false; reason: string } {
  if (typeof createdBy !== "string") {
    return { ok: false, reason: "created_by_required" };
  }
  if (createdBy.trim().length === 0) {
    return { ok: false, reason: "created_by_empty" };
  }

  return { ok: true };
}

function createUuid(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  throw new Error("crypto.randomUUID unavailable");
}

function blocked(
  input: RegistryRealMinimalInput,
  reason: string,
): RegistryRealMinimalResult {
  return {
    ok: false,
    case_id: input.case_id,
    records: [],
    persisted_count: 0,
    blocked_reason: reason,
    no_go: NO_GO,
    materiality: {
      level: "registry_real_minimal_controlled_promotion",
      registry_real_minimal_created: false,
      runtime_40_20_started: false,
      next_authorization_required: true,
    },
  };
}
