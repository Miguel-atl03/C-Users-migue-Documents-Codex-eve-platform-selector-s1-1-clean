export type RegistryFamily = "PM" | "PF" | "MoC" | "OLC";

export type RegistryRealMinimalState =
  | "draft"
  | "candidate_loaded"
  | "authorization_checked"
  | "ready_for_minimal_persistence"
  | "persisted_minimal"
  | "blocked"
  | "archived";

export interface RegistryRealMinimalRecord {
  registry_id: string; // UUID-formatted
  case_id: string;
  family: RegistryFamily;
  registry_state: RegistryRealMinimalState;
  source_candidate_ref: string;
  authorization_ref: string;
  local_candidate_trace_ref: string;
  created_by: string;
  conformance_claimed: false;
  consistency_claimed: false;
  active: boolean;
  metadata: Record<string, unknown>;
}

export interface RegistryRealMinimalInput {
  case_id: string;
  authorization_ref: string;
  created_by: string;
  source_candidates: Array<{
    family: RegistryFamily;
    source_candidate_ref: string;
    local_candidate_trace_ref: string;
    metadata?: Record<string, unknown>;
  }>;
  adapter: RegistryRealMinimalPersistenceAdapter;
  boundary?: RegistryRealMinimalBoundaryInput;
}

export interface RegistryRealMinimalPersistenceAdapter {
  insertRegistryRecords(records: RegistryRealMinimalRecord[]): Promise<{
    ok: boolean;
    inserted_count: number;
    error?: string;
  }>;

  insertAuditLog(entry: RegistryRealMinimalAuditLog): Promise<{
    ok: boolean;
    error?: string;
  }>;

  insertAuthorizationLog(entry: RegistryRealMinimalAuthorizationLog): Promise<{
    ok: boolean;
    error?: string;
  }>;
}

export interface RegistryRealMinimalAuditLog {
  audit_id: string; // UUID-formatted
  case_id: string;
  created_by: string;
  action:
    | "registry_real_minimal_persist_attempted"
    | "registry_real_minimal_persisted"
    | "registry_real_minimal_blocked";
  no_go_triggered: boolean;
  metadata: Record<string, unknown>;
}

export interface RegistryRealMinimalAuthorizationLog {
  authorization_log_id: string; // UUID-formatted
  case_id: string;
  authorization_ref: string;
  created_by: string;
  capability: "registry_real_minimal";
  authorization_executed: true;
  scope: RegistryFamily[];
  metadata: Record<string, unknown>;
}

export interface RegistryRealMinimalBoundaryInput {
  runtime_40_20_started?: boolean;
  ir_real_created?: boolean;
  object_inventory_real_opened?: boolean;
  f5c_real_opened?: boolean;
  production_parallel_real_opened?: boolean;
  export_created?: boolean;
  diagnosis_created?: boolean;
  delivered_created?: boolean;
  conformance_claimed?: boolean;
  consistency_claimed?: boolean;
}

export interface RegistryRealMinimalResult {
  ok: boolean;
  case_id: string;
  records: RegistryRealMinimalRecord[];
  persisted_count: number;
  blocked_reason?: string;
  no_go: {
    runtime_40_20_started: false;
    ir_real_created: false;
    object_inventory_real_opened: false;
    f5c_real_opened: false;
    production_parallel_real_opened: false;
    export_created: false;
    diagnosis_created: false;
    delivered_created: false;
    conformance_claimed: false;
    consistency_claimed: false;
  };
  materiality: {
    level: "registry_real_minimal_controlled_promotion";
    registry_real_minimal_created: boolean;
    runtime_40_20_started: false;
    next_authorization_required: true;
  };
}
