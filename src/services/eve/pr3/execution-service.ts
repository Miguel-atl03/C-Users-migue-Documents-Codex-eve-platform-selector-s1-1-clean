import "server-only";
import { randomUUID } from "node:crypto";
import a02 from "../../../../pr3/authority/A02_PR3_PRODUCTION_OBJECT_REGISTRY_v1_0.json";
import { deriveIdentity, sha256CanonicalJson, utcTimestamp } from "./canonical";
import { issueActionToken, verifyActionToken } from "./action-token";
import type {
  Pr3ActionTokenRequest,
  Pr3CommandOperation,
  Pr3CommandReceipt,
  Pr3ExecutionResult,
  Pr3InteractionContract,
  Pr3OpenOrResumeCommand,
  Pr3Principal,
  Pr3ResumeCommand,
  Pr3SubmitCorrectionCommand,
  Pr3SubmitResponseCommand,
} from "./contracts";
import { PR3_CHAIN_DEFINITION_ID, PR3_CHAIN_DEFINITION_REVISION } from "./contracts";
import type { Pr3Repository, Pr3StoredProjection, Pr3UnitOfWork } from "./repository";

const objectRegistry = Object.fromEntries(
  (a02.objects as Array<Record<string, unknown>>).map((x) => [String(x.object_key), x]),
) as Record<string, Record<string, unknown>>;

class Pr3CommandConflict extends Error {}
class Pr3Precondition extends Error { constructor(public code: string, message = code) { super(message); } }

function commandIdentity(operation: Pr3CommandOperation, command_scope_ref: string, command_event_id: string) {
  const d = deriveIdentity("cmdr", ["operation", "command_scope_ref", "command_event_id"], {
    operation, command_scope_ref, command_event_id,
  });
  return { command_receipt_id: d.record_id, idempotency_key: `idem-${d.identity_sha256.slice(0, 24)}` };
}

function replayReceipt(stored: Pr3CommandReceipt): Pr3CommandReceipt {
  return { ...stored, receipt_state: "IDEMPOTENT_REPLAY", replay_of_receipt_id: stored.command_receipt_id };
}

export async function executePr3ReceiptBound<T extends object>(args: {
  repo: Pr3Repository;
  operation: Pr3CommandOperation;
  command_scope_ref: string;
  command_event_id: string;
  client_event_id?: string | null;
  token_request_id?: string | null;
  payload: unknown;
  execute: (tx: Pr3UnitOfWork) => Promise<{ result: T; side_effect_refs?: string[]; refs?: Partial<Pick<Pr3CommandReceipt,"chain_run_id"|"object_run_id"|"interaction_key"|"context_revision">> }>;
}): Promise<{ receipt: Pr3CommandReceipt; result: T }> {
  const identity = commandIdentity(args.operation, args.command_scope_ref, args.command_event_id);
  const payload_sha256 = sha256CanonicalJson(args.payload);
  return args.repo.transaction(async (tx) => {
    await tx.lockCommand(identity.command_receipt_id);
    const existing = await tx.getCommandReceipt(identity.command_receipt_id);
    if (existing) {
      if (existing.payload_sha256 !== payload_sha256) throw new Pr3CommandConflict("IDEMPOTENCY_CONFLICT");
      return { receipt: replayReceipt(existing), result: existing.result_payload_json as T };
    }
    try {
      const executed = await args.execute(tx);
      const server_time = utcTimestamp();
      const result_payload_sha256 = sha256CanonicalJson(executed.result);
      const receipt: Pr3CommandReceipt = {
        command_receipt_id: identity.command_receipt_id,
        operation: args.operation,
        command_scope_ref: args.command_scope_ref,
        command_event_id: args.command_event_id,
        client_event_id: args.client_event_id ?? null,
        token_request_id: args.token_request_id ?? null,
        idempotency_key: identity.idempotency_key,
        payload_sha256,
        receipt_state: "ACCEPTED",
        ...executed.refs,
        replay_of_receipt_id: null,
        result_payload_sha256,
        side_effect_refs: executed.side_effect_refs ?? [],
        error_code: null,
        server_time,
      };
      await tx.insertCommandReceipt(receipt, executed.result);
      return { receipt, result: executed.result };
    } catch (error) {
      if (!(error instanceof Pr3Precondition)) throw error;
      const result = { error: error.code } as T;
      const server_time = utcTimestamp();
      const receipt: Pr3CommandReceipt = {
        command_receipt_id: identity.command_receipt_id,
        operation: args.operation,
        command_scope_ref: args.command_scope_ref,
        command_event_id: args.command_event_id,
        client_event_id: args.client_event_id ?? null,
        token_request_id: args.token_request_id ?? null,
        idempotency_key: identity.idempotency_key,
        payload_sha256,
        receipt_state: "REJECTED_PRECONDITION",
        replay_of_receipt_id: null,
        result_payload_sha256: sha256CanonicalJson(result),
        side_effect_refs: [],
        error_code: error.code,
        server_time,
      };
      await tx.insertCommandReceipt(receipt, result);
      return { receipt, result };
    }
  });
}

function requireBoundPrincipal(principal: Pr3Principal, scopeRef?: string, activityRef?: string) {
  if (scopeRef && scopeRef !== principal.scope_ref) throw new Pr3Precondition("SCOPE_MISMATCH");
  if (activityRef && activityRef !== principal.activity_ref) throw new Pr3Precondition("ACTIVITY_MISMATCH");
}

function syntheticContract(seed: { chainRunId:string; objectRunId:string; interactionKey:string; objectKey:"B0"|"B0.5"|"B1"|"B2"; contextRevision:string; step:number }): Pr3InteractionContract {
  const reg = objectRegistry[seed.objectKey];
  const sourceCode = `QA.${seed.step}`;
  const slot = deriveIdentity("slot", ["object_run_id","interaction_key","runtime_definition_id","question_code","subfield_id","context_revision"], {
    object_run_id: seed.objectRunId,
    interaction_key: seed.interactionKey,
    runtime_definition_id: `QA-${seed.objectKey}-${seed.step}`,
    question_code: sourceCode,
    subfield_id: "answer",
    context_revision: seed.contextRevision,
  }).record_id;
  return {
    chain_definition_id: PR3_CHAIN_DEFINITION_ID,
    chain_definition_revision: PR3_CHAIN_DEFINITION_REVISION,
    chain_run_id: seed.chainRunId,
    object_key: seed.objectKey,
    object_run_id: seed.objectRunId,
    contract_set_id: String(reg.contract_set_id),
    profile_id: String(reg.profile_id),
    profile_revision: String(reg.profile_revision),
    profile_sha256: String(reg.profile_sha256),
    runtime_definition_id: `QA-${seed.objectKey}-${seed.step}`,
    definition_revision: "QA-SYNTHETIC-1",
    interaction_key: seed.interactionKey,
    local_interaction_instance_id: null,
    context_revision: seed.contextRevision,
    bucket: seed.step % 2 ? "base_40" : "causal_20",
    presentation_event_id: `pe-${sha256CanonicalJson(seed).slice(0,24)}`,
    presentation_state: "TURN_READY",
    visible_text: `[QA sintético ${seed.objectKey}] Escribe un valor para probar transporte, retry y reanudación.`,
    help_text: "Fixture técnico de P4. No representa una pregunta promovida B0–B2 ni evidencia empresarial.",
    ui_component: "runtime_interaction_sheet",
    slots: [{ slot_ref: slot, field_key:"qa_value", source_code:sourceCode, label:"Valor de prueba", help_text:"Sólo QA técnico", control_family:"free_text", answer_mode:"libre", required:true, max_chars:4096, capture_slot_kind:"visible_capture" }],
    restrictions: ["QA_SYNTHETIC_NON_SEMANTIC_NON_PRODUCTION"],
    server_time: utcTimestamp(),
  };
}

function runtimeAdapterMode() { return process.env.EVE_PR3_RUNTIME_ADAPTER ?? "blocked"; }
function ensureSyntheticAllowed() {
  if (runtimeAdapterMode() !== "synthetic_qa") throw new Pr3Precondition("PROMOTED_RUNTIME_ADAPTER_NOT_DEPLOYED");
  if (process.env.NODE_ENV === "production") throw new Pr3Precondition("SYNTHETIC_RUNTIME_FORBIDDEN_IN_PRODUCTION");
}

export class Pr3ExecutionService {
  constructor(private repo: Pr3Repository) {}

  async issueActionToken(principal: Pr3Principal, input: Pr3ActionTokenRequest) {
    requireBoundPrincipal(principal, input.scope_ref, input.activity_ref);
    const scope = `action-token:${principal.principal_ref}|${input.operation}|${input.scope_ref ?? principal.scope_ref}|${input.activity_ref ?? principal.activity_ref}`;
    const payloadForHash = { ...input, action_token: undefined };
    const wrapped = await executePr3ReceiptBound({
      repo:this.repo, operation:"ISSUE_ACTION_TOKEN", command_scope_ref:scope, command_event_id:input.token_request_id,
      token_request_id:input.token_request_id, payload:payloadForHash,
      execute: async () => {
        const client_event_id = `evt-${randomUUID()}`;
        const token = issueActionToken({ principal_ref:principal.principal_ref, operation:input.operation, client_event_id,
          scope_ref:input.scope_ref ?? principal.scope_ref, activity_ref:input.activity_ref ?? principal.activity_ref,
          chain_run_id:input.chain_run_id ?? null, object_run_id:input.object_run_id ?? null,
          interaction_key:input.interaction_key ?? null, context_revision:input.context_revision ?? null });
        return { result:{ client_event_id, operation:input.operation, issued_at:token.payload.issued_at, expires_at:token.payload.expires_at,
          action_token:token.action_token, bound_chain_run_id:input.chain_run_id??null, bound_object_run_id:input.object_run_id??null,
          bound_interaction_key:input.interaction_key??null, bound_context_revision:input.context_revision??null }, side_effect_refs:[client_event_id] };
      },
    });
    return { ...wrapped.result, command_receipt: wrapped.receipt };
  }

  private verifyToken(
    principal: Pr3Principal,
    token: string,
    operation: Pr3ActionTokenRequest["operation"],
    clientEventId: string,
    expected: {
      scope_ref?: string | null;
      activity_ref?: string | null;
      chain_run_id?: string | null;
      object_run_id?: string | null;
      interaction_key?: string | null;
      context_revision?: string | null;
    } = {},
  ) {
    const p = verifyActionToken(token);
    const mismatch =
      p.principal_ref !== principal.principal_ref ||
      p.operation !== operation ||
      p.client_event_id !== clientEventId ||
      (p.scope_ref != null && p.scope_ref !== principal.scope_ref) ||
      (p.activity_ref != null && p.activity_ref !== principal.activity_ref) ||
      Object.entries(expected).some(([key, value]) => {
        if (value == null) return false;
        return (p as unknown as Record<string, unknown>)[key] !== value;
      });
    if (mismatch) throw new Pr3Precondition("ACTION_TOKEN_BINDING_MISMATCH");
    return p;
  }

  async openOrResume(principal:Pr3Principal, input:Pr3OpenOrResumeCommand):Promise<Pr3ExecutionResult> {
    requireBoundPrincipal(principal,input.scope_ref,input.activity_ref);
    this.verifyToken(principal,input.action_token,"OPEN_OR_RESUME",input.client_event_id,{scope_ref:input.scope_ref,activity_ref:input.activity_ref});
    if (input.expected_chain_definition_id!==PR3_CHAIN_DEFINITION_ID || input.expected_chain_definition_revision!==PR3_CHAIN_DEFINITION_REVISION) throw new Pr3Precondition("CHAIN_DEFINITION_MISMATCH");
    const scope=`open:${input.scope_ref}|${input.activity_ref}|${PR3_CHAIN_DEFINITION_ID}@${PR3_CHAIN_DEFINITION_REVISION}`;
    const wrapped=await executePr3ReceiptBound({repo:this.repo,operation:"OPEN_OR_RESUME",command_scope_ref:scope,command_event_id:input.client_event_id,client_event_id:input.client_event_id,payload:{...input,action_token:undefined},execute:async(tx)=>{
      ensureSyntheticAllowed();
      const chainRunId=`cr-${sha256CanonicalJson({scope,inputEvent:input.client_event_id}).slice(0,24)}`;
      const objectRunId=`or-${sha256CanonicalJson({chainRunId,object:"B0"}).slice(0,24)}`;
      const interactionKey=`ii-${sha256CanonicalJson({objectRunId,step:1}).slice(0,24)}`;
      const contextRevision="ctx-qa-0001";
      const contract=syntheticContract({chainRunId,objectRunId,interactionKey,objectKey:"B0",contextRevision,step:1});
      const state:Pr3StoredProjection={chain_run_id:chainRunId,object_run_id:objectRunId,object_key:"B0",context_revision:contextRevision,object_state:"active",chain_state:"active",projection:{kind:"interaction_contract",value:contract}};
      await tx.putProjection(state);
      return {result:{domain_state:{chain_run_id:chainRunId,object_run_id:objectRunId,object_key:"B0",context_revision:contextRevision,object_state:"active",chain_state:"active",restrictions:["QA_SYNTHETIC_NON_PRODUCTION"],gap_refs:[],handoff_refs:[]},next_projection:state.projection} as Omit<Pr3ExecutionResult,"command_receipt">,side_effect_refs:[chainRunId,objectRunId,interactionKey,contract.presentation_event_id],refs:{chain_run_id:chainRunId,object_run_id:objectRunId,interaction_key:interactionKey,context_revision:contextRevision}};
    }});
    return {...wrapped.result,command_receipt:wrapped.receipt};
  }

  async submitResponse(principal:Pr3Principal,input:Pr3SubmitResponseCommand):Promise<Pr3ExecutionResult> {
    this.verifyToken(principal,input.action_token,"SUBMIT_RESPONSE",input.client_event_id,{chain_run_id:input.chain_run_id,object_run_id:input.object_run_id,interaction_key:input.interaction_key,context_revision:input.context_revision});
    const scope=`response:${input.chain_run_id}|${input.object_run_id}|${input.interaction_key}|${input.context_revision}`;
    const wrapped=await executePr3ReceiptBound({repo:this.repo,operation:"SUBMIT_RESPONSE",command_scope_ref:scope,command_event_id:input.client_event_id,client_event_id:input.client_event_id,payload:{...input,action_token:undefined},execute:async(tx)=>{
      ensureSyntheticAllowed();
      if (!Array.isArray(input.answers)||input.answers.length===0) throw new Pr3Precondition("EMPTY_ANSWER_BATCH");
      const prior=await tx.getProjection(input.chain_run_id); if(!prior) throw new Pr3Precondition("CHAIN_RUN_NOT_FOUND");
      if(prior.object_run_id!==input.object_run_id||prior.context_revision!==input.context_revision) throw new Pr3Precondition("STALE_CONTEXT_REENTRY_REQUIRED");
      const current=(prior.projection as {kind?:string;value?:Pr3InteractionContract});
      if(current.kind!=="interaction_contract"||!current.value||current.value.interaction_key!==input.interaction_key) throw new Pr3Precondition("INTERACTION_BINDING_MISMATCH");
      const allowed=new Set(current.value.slots.map(s=>s.slot_ref)); if(input.answers.some(a=>!allowed.has(a.slot_ref))) throw new Pr3Precondition("SLOT_REF_NOT_BOUND");
      const raw=String(input.answers[0]?.raw_value??"");
      if(raw.length>4096) throw new Pr3Precondition("B2_LIMIT_TEXT_LENGTH_REENTRY_REQUIRED");
      const objects:["B0","B0.5","B1","B2"]=["B0","B0.5","B1","B2"];
      const idx=objects.indexOf(prior.object_key); const nextIdx=idx+1; const nextContext=`ctx-qa-${String(nextIdx+1).padStart(4,"0")}`;
      if(nextIdx>=objects.length){
        const packageRef=`pkg-qa-${sha256CanonicalJson({chain:input.chain_run_id,done:true}).slice(0,24)}`;
        const state:Pr3StoredProjection={...prior,context_revision:nextContext,object_state:"complete",chain_state:"complete",projection:{kind:"chain_complete_package_ref",value:packageRef}};
        await tx.putProjection(state);
        return {result:{domain_state:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,object_key:state.object_key,context_revision:state.context_revision,object_state:"complete",chain_state:"complete",restrictions:["QA_SYNTHETIC_NON_PRODUCTION"],gap_refs:[],handoff_refs:[]},next_projection:state.projection} as Omit<Pr3ExecutionResult,"command_receipt">,side_effect_refs:[packageRef],refs:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,interaction_key:input.interaction_key,context_revision:state.context_revision}};
      }
      const objectKey=objects[nextIdx]; const objectRunId=`or-${sha256CanonicalJson({chainRunId:input.chain_run_id,objectKey}).slice(0,24)}`; const interactionKey=`ii-${sha256CanonicalJson({objectRunId,step:nextIdx+1}).slice(0,24)}`;
      const contract=syntheticContract({chainRunId:input.chain_run_id,objectRunId,interactionKey,objectKey,contextRevision:nextContext,step:nextIdx+1});
      const state:Pr3StoredProjection={chain_run_id:input.chain_run_id,object_run_id:objectRunId,object_key:objectKey,context_revision:nextContext,object_state:"active",chain_state:"active",projection:{kind:"interaction_contract",value:contract}}; await tx.putProjection(state);
      return {result:{domain_state:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,object_key:state.object_key,context_revision:state.context_revision,object_state:"active",chain_state:"active",restrictions:["QA_SYNTHETIC_NON_PRODUCTION"],gap_refs:[],handoff_refs:[]},next_projection:state.projection} as Omit<Pr3ExecutionResult,"command_receipt">,side_effect_refs:[`qa-response-${input.client_event_id}`,objectRunId,interactionKey,contract.presentation_event_id],refs:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,interaction_key:interactionKey,context_revision:state.context_revision}};
    }});
    return {...wrapped.result,command_receipt:wrapped.receipt};
  }

  async submitCorrection(principal:Pr3Principal,input:Pr3SubmitCorrectionCommand):Promise<Pr3ExecutionResult>{
    this.verifyToken(principal,input.action_token,"SUBMIT_CORRECTION",input.client_event_id,{chain_run_id:input.chain_run_id,object_run_id:input.object_run_id,interaction_key:input.interaction_key,context_revision:input.context_revision});
    const scope=`correction:${input.chain_run_id}|${input.object_run_id}|${input.interaction_key}|${input.context_revision}`;
    const wrapped=await executePr3ReceiptBound({repo:this.repo,operation:"SUBMIT_CORRECTION",command_scope_ref:scope,command_event_id:input.client_event_id,client_event_id:input.client_event_id,payload:{...input,action_token:undefined},execute:async(tx)=>{
      ensureSyntheticAllowed(); if(!input.corrections?.length) throw new Pr3Precondition("EMPTY_CORRECTION_BATCH");
      const prior=await tx.getProjection(input.chain_run_id); if(!prior) throw new Pr3Precondition("CHAIN_RUN_NOT_FOUND");
      const nextContext=`${prior.context_revision}-corr`;
      const descriptor={reason:"QA_CORRECTION_REENTRY",preserved_prior_context_revision:prior.context_revision,next_context_revision:nextContext,supersedes:input.corrections.map(c=>c.supersedes_response_key)};
      const state={...prior,context_revision:nextContext,object_state:"reentry_required",chain_state:"reentry_required",projection:{kind:"reentry_descriptor",value:descriptor}} as Pr3StoredProjection; await tx.putProjection(state);
      return {result:{domain_state:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,object_key:state.object_key,context_revision:state.context_revision,object_state:state.object_state,chain_state:state.chain_state,restrictions:["QA_SYNTHETIC_NON_PRODUCTION"],gap_refs:["gap-qa-correction"],handoff_refs:[]},next_projection:state.projection} as Omit<Pr3ExecutionResult,"command_receipt">,side_effect_refs:["gap-qa-correction"],refs:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,interaction_key:input.interaction_key,context_revision:state.context_revision}};
    }}); return {...wrapped.result,command_receipt:wrapped.receipt};
  }

  async resume(principal:Pr3Principal,input:Pr3ResumeCommand):Promise<Pr3ExecutionResult>{
    this.verifyToken(principal,input.action_token,"RESUME",input.client_event_id,{chain_run_id:input.chain_run_id}); const scope=`resume:${input.chain_run_id}|${input.last_known_context_revision??"null"}`;
    const wrapped=await executePr3ReceiptBound({repo:this.repo,operation:"RESUME",command_scope_ref:scope,command_event_id:input.client_event_id,client_event_id:input.client_event_id,payload:{...input,action_token:undefined},execute:async(tx)=>{
      ensureSyntheticAllowed(); const state=await tx.getProjection(input.chain_run_id); if(!state) throw new Pr3Precondition("CHAIN_RUN_NOT_FOUND");
      return {result:{domain_state:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,object_key:state.object_key,context_revision:state.context_revision,object_state:state.object_state,chain_state:state.chain_state,restrictions:["QA_SYNTHETIC_NON_PRODUCTION"],gap_refs:state.chain_state==="reentry_required"?["gap-qa-correction"]:[],handoff_refs:[]},next_projection:state.projection} as Omit<Pr3ExecutionResult,"command_receipt">,side_effect_refs:[],refs:{chain_run_id:state.chain_run_id,object_run_id:state.object_run_id,context_revision:state.context_revision}};
    }}); return {...wrapped.result,command_receipt:wrapped.receipt};
  }

  async readState(chainRunId:string) { return this.repo.readProjection(chainRunId); }
}

export function isPr3CommandConflict(error: unknown): error is Pr3CommandConflict { return error instanceof Pr3CommandConflict; }
export function isPr3Precondition(error: unknown): error is Pr3Precondition { return error instanceof Pr3Precondition; }
