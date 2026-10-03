import "server-only";
import { Pool, type PoolClient } from "pg";
import type { Pr3CommandReceipt } from "./contracts";
import type { AioRecord, AiProposalRecord } from "./ai/records";
import { canonicalJson } from "./canonical";
import { validatePr3DatabaseTarget } from "./target";

export type Pr3StoredProjection = {
  chain_run_id: string;
  object_run_id: string;
  object_key: "B0" | "B0.5" | "B1" | "B2";
  context_revision: string;
  object_state: string;
  chain_state: string;
  projection: unknown;
};

export interface Pr3UnitOfWork {
  getCommandReceipt(commandReceiptId: string): Promise<(Pr3CommandReceipt & { result_payload_json?: unknown }) | null>;
  insertCommandReceipt(receipt: Pr3CommandReceipt, resultPayload: unknown): Promise<void>;
  lockCommand(commandReceiptId: string): Promise<void>;
  getProjection(chainRunId: string): Promise<Pr3StoredProjection | null>;
  putProjection(state: Pr3StoredProjection): Promise<void>;
  insertAudit(input: { audit_event_id: string; chain_run_id: string; object_run_id?: string | null; event_type: string; entity_ref: string; rule_ref?: string | null; prior_state_ref?: string | null; new_state_ref?: string | null; reason?: string | null; details?: unknown; event_at: string }): Promise<void>;
  insertPilotObservation(input: { pilot_observation_id: string; chain_run_id: string; object_run_id?: string | null; observation_type: string; metric_or_fact: unknown; source_ref: string; recorded_at: string }): Promise<void>;
  getAiOperation(id: string): Promise<AioRecord | null>;
  insertAiOperationIfAbsent(row: AioRecord): Promise<boolean>;
  finishAiOperation(id: string, patch: Pick<AioRecord,"status"> & Partial<Pick<AioRecord,"provider_request_id"|"model_version"|"usage"|"completed_at"|"failure_code">>): Promise<void>;
  getAiProposalForOperation(aiOperationId: string, requestId: string): Promise<AiProposalRecord | null>;
  insertAiProposal(row: AiProposalRecord): Promise<void>;
}

export interface Pr3Repository {
  transaction<T>(fn: (tx: Pr3UnitOfWork) => Promise<T>): Promise<T>;
  readProjection(chainRunId: string): Promise<Pr3StoredProjection | null>;
  health(): Promise<{ ok: boolean; target: "postgres" | "memory"; detail?: string }>;
}

let pool: Pool | null = null;
let poolConnectionString: string | null = null;
function getPool() {
  const connectionString = process.env.EVE_PR3_DATABASE_URL;
  if (!connectionString) throw new Error("pr3_clean_database_not_configured");

  // Infrastructure-only guard: PR3 must never be pointed at either legacy
  // Supabase project. The expected project ref is non-secret and is pinned by
  // the deployment environment; the database URL itself remains server-only.
  const expectedProjectRef = process.env.EVE_PR3_EXPECTED_PROJECT_REF;
  validatePr3DatabaseTarget(connectionString, expectedProjectRef);
  if (pool && poolConnectionString !== connectionString) {
    throw new Error("pr3_clean_database_target_mismatch");
  }

  if (!pool) {
    pool = new Pool({ connectionString, max: 8, idleTimeoutMillis: 30_000, statement_timeout: 15_000 });
    poolConnectionString = connectionString;
  }
  return pool;
}

class PgUow implements Pr3UnitOfWork {
  constructor(private client: PoolClient) {}
  async lockCommand(commandReceiptId: string) {
    await this.client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [commandReceiptId]);
  }
  async getCommandReceipt(commandReceiptId: string) {
    const r = await this.client.query(
      `select command_receipt_id, operation, command_scope_ref, command_event_id, client_event_id,
              token_request_id, idempotency_key, payload_sha256, receipt_state, chain_run_id,
              object_run_id, interaction_key, context_revision, replay_of_receipt_id,
              result_payload_json, result_payload_sha256, side_effect_refs, error_code, server_time
         from eve_pr3.command_receipt where command_receipt_id=$1`,
      [commandReceiptId],
    );
    if (!r.rows[0]) return null;
    return r.rows[0] as Pr3CommandReceipt & { result_payload_json?: unknown };
  }
  async insertCommandReceipt(receipt: Pr3CommandReceipt, resultPayload: unknown) {
    await this.client.query(
      `insert into eve_pr3.command_receipt
      (command_receipt_id,operation,command_scope_ref,command_event_id,client_event_id,token_request_id,
       idempotency_key,payload_sha256,receipt_state,chain_run_id,object_run_id,interaction_key,context_revision,
       replay_of_receipt_id,result_payload_json,result_payload_sha256,side_effect_refs,error_code,server_time)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17::jsonb,$18,$19::timestamptz)`,
      [
        receipt.command_receipt_id, receipt.operation, receipt.command_scope_ref, receipt.command_event_id,
        receipt.client_event_id ?? null, receipt.token_request_id ?? null, receipt.idempotency_key,
        receipt.payload_sha256, receipt.receipt_state, receipt.chain_run_id ?? null, receipt.object_run_id ?? null,
        receipt.interaction_key ?? null, receipt.context_revision ?? null, receipt.replay_of_receipt_id ?? null,
        canonicalJson(resultPayload), receipt.result_payload_sha256 ?? null, canonicalJson([...receipt.side_effect_refs]),
        receipt.error_code ?? null, receipt.server_time,
      ],
    );
  }
  async getProjection(_chainRunId: string): Promise<Pr3StoredProjection | null> {
    // A06 does not authorize PilotObservation as a hidden state store. A real
    // production projection must be reconstructed from the authoritative P2
    // records written by the promoted Runtime adapter (ChainRun/ObjectRun/
    // InteractionInstance/PresentationEvent/...); that adapter is not deployed
    // in P2/P4 yet. Fail closed instead of inventing a persistence meaning.
    throw new Error("pr3_promoted_runtime_state_projection_adapter_not_deployed");
  }
  async putProjection(_state: Pr3StoredProjection) {
    throw new Error("pr3_promoted_runtime_state_projection_adapter_not_deployed");
  }
  async insertAudit(input: Parameters<Pr3UnitOfWork["insertAudit"]>[0]) {
    await this.client.query(
      `insert into eve_pr3.audit_event
       (audit_event_id,chain_run_id,object_run_id,event_type,entity_ref,rule_ref,prior_state_ref,new_state_ref,reason,details,event_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::timestamptz)`,
      [input.audit_event_id,input.chain_run_id,input.object_run_id??null,input.event_type,input.entity_ref,input.rule_ref??null,input.prior_state_ref??null,input.new_state_ref??null,input.reason??null,canonicalJson(input.details??{}),input.event_at],
    );
  }
  async insertPilotObservation(input: Parameters<Pr3UnitOfWork["insertPilotObservation"]>[0]) {
    await this.client.query(
      `insert into eve_pr3.pilot_observation
       (pilot_observation_id,chain_run_id,object_run_id,observation_type,metric_or_fact,source_ref,recorded_at)
       values ($1,$2,$3,$4,$5::jsonb,$6,$7::timestamptz)`,
      [input.pilot_observation_id,input.chain_run_id,input.object_run_id??null,input.observation_type,canonicalJson(input.metric_or_fact),input.source_ref,input.recorded_at],
    );
  }
  async getAiOperation(id: string) {
    const r = await this.client.query("select * from eve_pr3.a_i_operation where ai_operation_id=$1", [id]);
    return (r.rows[0] as AioRecord | undefined) ?? null;
  }
  async insertAiOperationIfAbsent(row: AioRecord) {
    const r = await this.client.query(
      `insert into eve_pr3.a_i_operation
       (ai_operation_id,object_run_id,interaction_key,operation,profile_ref,intent_ref,context_revision,context_sources,
        generator_ref,status,requested_at,provider_ref,model_id,model_version,prompt_profile_ref,prompt_profile_revision,
        response_schema_ref,instructions_sha256,input_payload_sha256,provider_request_id,usage,completed_at,failure_code)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11::timestamptz,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::timestamptz,$23)
       on conflict (ai_operation_id) do nothing returning ai_operation_id`,
      [
        row.ai_operation_id,row.object_run_id,row.interaction_key,row.operation,row.profile_ref,row.intent_ref,row.context_revision,
        canonicalJson(row.context_sources),row.generator_ref,row.status,row.requested_at,row.provider_ref,row.model_id,row.model_version,
        row.prompt_profile_ref,row.prompt_profile_revision,row.response_schema_ref,row.instructions_sha256,row.input_payload_sha256,
        row.provider_request_id??null,row.usage==null?null:canonicalJson(row.usage),row.completed_at??null,row.failure_code??null,
      ],
    );
    return r.rowCount === 1;
  }
  async finishAiOperation(id: string, patch: Parameters<Pr3UnitOfWork["finishAiOperation"]>[1]) {
    await this.client.query(
      `update eve_pr3.a_i_operation
          set status=$2,
              provider_request_id=coalesce($3,provider_request_id),
              model_version=coalesce($4,model_version),
              usage=coalesce($5::jsonb,usage),
              completed_at=coalesce($6::timestamptz,completed_at),
              failure_code=$7
        where ai_operation_id=$1`,
      [id,patch.status,patch.provider_request_id??null,patch.model_version??null,patch.usage==null?null:canonicalJson(patch.usage),patch.completed_at??null,patch.failure_code??null],
    );
  }
  async getAiProposalForOperation(aiOperationId: string, requestId: string) {
    const r = await this.client.query(
      "select * from eve_pr3.a_i_proposal where ai_operation_id=$1 and request_id=$2 order by created_at asc limit 1",
      [aiOperationId, requestId],
    );
    return (r.rows[0] as AiProposalRecord | undefined) ?? null;
  }
  async insertAiProposal(row: AiProposalRecord) {
    await this.client.query(
      `insert into eve_pr3.a_i_proposal
       (proposal_id,ai_operation_id,request_id,interaction_key,context_revision,action,payload,payload_sha256,model_ref,review_state,created_at)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::timestamptz)`,
      [row.proposal_id,row.ai_operation_id,row.request_id,row.interaction_key,row.context_revision,row.action,canonicalJson(row.payload),row.payload_sha256,row.model_ref,row.review_state,row.created_at],
    );
  }
}

export class PostgresPr3Repository implements Pr3Repository {
  async transaction<T>(fn: (tx: Pr3UnitOfWork) => Promise<T>) {
    const client = await getPool().connect();
    try {
      await client.query("begin");
      await client.query("set transaction isolation level serializable");
      const result = await fn(new PgUow(client));
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
  async readProjection(chainRunId: string) {
    return this.transaction((tx) => tx.getProjection(chainRunId));
  }
  async health() {
    try {
      const client = await getPool().connect();
      try { await client.query("select 1 from eve_pr3.chain_run limit 1"); }
      finally { client.release(); }
      return { ok: true, target: "postgres" as const };
    } catch (e) {
      return { ok: false, target: "postgres" as const, detail: e instanceof Error ? e.message : String(e) };
    }
  }
}

class MemoryUow implements Pr3UnitOfWork {
  constructor(private state: MemoryState) {}
  async lockCommand() {}
  async getCommandReceipt(id: string) { return this.state.receipts.get(id) ?? null; }
  async insertCommandReceipt(receipt: Pr3CommandReceipt, resultPayload: unknown) {
    this.state.receipts.set(receipt.command_receipt_id, { ...receipt, result_payload_json: resultPayload });
  }
  async getProjection(id: string) { return this.state.projections.get(id) ?? null; }
  async putProjection(p: Pr3StoredProjection) { this.state.projections.set(p.chain_run_id, structuredClone(p)); }
  async insertAudit(input: Parameters<Pr3UnitOfWork["insertAudit"]>[0]) { this.state.audits.push(structuredClone(input)); }
  async insertPilotObservation(input: Parameters<Pr3UnitOfWork["insertPilotObservation"]>[0]) { this.state.observations.push(structuredClone(input)); }
  async getAiOperation(id: string) { return this.state.aiOperations.get(id) ?? null; }
  async insertAiOperationIfAbsent(row: AioRecord) {
    if (this.state.aiOperations.has(row.ai_operation_id)) return false;
    this.state.aiOperations.set(row.ai_operation_id, structuredClone(row));
    return true;
  }
  async finishAiOperation(id: string, patch: Parameters<Pr3UnitOfWork["finishAiOperation"]>[1]) {
    const row = this.state.aiOperations.get(id);
    if (!row) throw new Error("unknown_ai_operation");
    this.state.aiOperations.set(id, { ...row, ...structuredClone(patch) });
  }
  async getAiProposalForOperation(aiOperationId: string, requestId: string) {
    return [...this.state.aiProposals.values()].find(row => row.ai_operation_id===aiOperationId && row.request_id===requestId) ?? null;
  }
  async insertAiProposal(row: AiProposalRecord) {
    if (this.state.aiProposals.has(row.proposal_id)) throw new Error("duplicate_ai_proposal");
    this.state.aiProposals.set(row.proposal_id, structuredClone(row));
  }
}
type MemoryState = {
  receipts: Map<string, Pr3CommandReceipt & { result_payload_json?: unknown }>;
  projections: Map<string,Pr3StoredProjection>;
  audits: unknown[];
  observations: unknown[];
  aiOperations: Map<string,AioRecord>;
  aiProposals: Map<string,AiProposalRecord>;
};
export class MemoryPr3Repository implements Pr3Repository {
  private state: MemoryState = { receipts:new Map(),projections:new Map(),audits:[],observations:[],aiOperations:new Map(),aiProposals:new Map() };
  async transaction<T>(fn:(tx:Pr3UnitOfWork)=>Promise<T>) {
    const snapshot: MemoryState = {
      receipts:new Map([...this.state.receipts].map(([k,v])=>[k,structuredClone(v)])),
      projections:new Map([...this.state.projections].map(([k,v])=>[k,structuredClone(v)])),
      audits:structuredClone(this.state.audits),
      observations:structuredClone(this.state.observations),
      aiOperations:new Map([...this.state.aiOperations].map(([k,v])=>[k,structuredClone(v)])),
      aiProposals:new Map([...this.state.aiProposals].map(([k,v])=>[k,structuredClone(v)])),
    };
    try { return await fn(new MemoryUow(this.state)); }
    catch (error) { this.state = snapshot; throw error; }
  }
  async readProjection(id:string) { return this.state.projections.get(id) ?? null; }
  async health() { return { ok:true,target:"memory" as const }; }
  debug() { return this.state; }
}

export function createPr3Repository(): Pr3Repository {
  if (process.env.EVE_PR3_PERSISTENCE_MODE === "memory_qa") {
    if (process.env.NODE_ENV === "production") throw new Error("pr3_memory_qa_forbidden_in_production");
    return globalMemoryRepository;
  }
  return new PostgresPr3Repository();
}
const globalMemoryRepository = new MemoryPr3Repository();
